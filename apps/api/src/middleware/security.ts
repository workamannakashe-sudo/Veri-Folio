import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import pino from 'pino';

export const logger = pino({
  name: 'verifolio-api',
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  formatters: {
    level: (label) => ({ level: label })
  },
  timestamp: pino.stdTimeFunctions.isoTime
});

// Request ID header & Correlation Tracking
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const reqId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  req.headers['x-request-id'] = reqId;
  res.setHeader('X-Request-ID', reqId);
  next();
}

// Security Headers Middleware (Helmet-equivalent native standard headers)
export function securityHeadersMiddleware(_req: Request, res: Response, next: NextFunction) {
  // Enforce secure framing, MIME protection, and XSS defense
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' http://localhost:* https:;"
    );
  }

  next();
}

// In-Memory Rate Limiter (Token bucket per IP)
interface RateLimitBucket {
  tokens: number;
  lastRefill: number;
}

const rateLimitBuckets = new Map<string, RateLimitBucket>();
const MAX_TOKENS = 120; // 120 requests per minute
const REFILL_RATE_PER_SEC = 2; // refills 2 tokens per second

export function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  // Skip rate limits in test environments
  if (process.env.NODE_ENV === 'test') {
    return next();
  }

  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  const now = Date.now();

  let bucket = rateLimitBuckets.get(clientIp);
  if (!bucket) {
    bucket = { tokens: MAX_TOKENS, lastRefill: now };
    rateLimitBuckets.set(clientIp, bucket);
  } else {
    // Refill tokens based on elapsed time
    const elapsedSecs = (now - bucket.lastRefill) / 1000;
    bucket.tokens = Math.min(MAX_TOKENS, bucket.tokens + elapsedSecs * REFILL_RATE_PER_SEC);
    bucket.lastRefill = now;
  }

  if (bucket.tokens < 1) {
    res.setHeader('Retry-After', '30');
    return res.status(429).json({
      error: 'Too Many Requests',
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Rate limit exceeded. Please wait a moment before trying again.'
    });
  }

  bucket.tokens -= 1;
  res.setHeader('X-RateLimit-Limit', MAX_TOKENS.toString());
  res.setHeader('X-RateLimit-Remaining', Math.floor(bucket.tokens).toString());

  next();
}

// Centralized Production Error Handler
export function errorHandlerMiddleware(err: any, req: Request, res: Response, _next: NextFunction) {
  const reqId = req.headers['x-request-id'] as string;
  const status = err.status || err.statusCode || 500;

  // Log error with correlation ID
  logger.error({
    requestId: reqId,
    method: req.method,
    path: req.path,
    statusCode: status,
    err: err.message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
  }, 'API Request Error');

  // Client-safe response: Never expose internal stack traces in production
  const response: Record<string, any> = {
    error: err.name || 'Error',
    message: err.message || 'An unexpected internal error occurred.',
    statusCode: status,
    requestId: reqId
  };

  if (err.issues || err.details) {
    response.details = err.issues || err.details;
  }

  return res.status(status).json(response);
}
