import { Request, Response, NextFunction } from 'express';

interface CachedResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: any;
  timestamp: number;
}

// In-memory idempotency cache (TTL: 24 hours)
const idempotencyStore = new Map<string, CachedResponse>();
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

// Periodic cleanup of expired keys
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of idempotencyStore.entries()) {
    if (now - val.timestamp > IDEMPOTENCY_TTL_MS) {
      idempotencyStore.delete(key);
    }
  }
}, 60 * 60 * 1000);

/**
 * Idempotency Middleware.
 * Prevents duplicate processing of requests carrying an 'Idempotency-Key' header.
 * Ideal for avoiding duplicate entry submissions, verifications, and roster imports on network retries.
 */
export function idempotencyMiddleware(req: Request, res: Response, next: NextFunction) {
  const idempotencyKey = req.headers['idempotency-key'] as string;

  // Idempotency applies to state-mutating requests (POST, PUT, PATCH, DELETE)
  if (!idempotencyKey || req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }

  const userId = req.user?.userId || 'anonymous';
  const schoolId = req.schoolId || 'global';
  const compositeKey = `${schoolId}:${userId}:${idempotencyKey}`;

  const cached = idempotencyStore.get(compositeKey);
  if (cached) {
    if (Date.now() - cached.timestamp <= IDEMPOTENCY_TTL_MS) {
      res.setHeader('X-Idempotent-Replay', 'true');
      return res.status(cached.statusCode).json(cached.body);
    } else {
      idempotencyStore.delete(compositeKey);
    }
  }

  // Intercept json() response to cache idempotent result
  const originalJson = res.json.bind(res);
  res.json = (body: any): Response => {
    // Only cache successful or client validation responses (avoid caching transient 500s)
    if (res.statusCode >= 200 && res.statusCode < 500) {
      idempotencyStore.set(compositeKey, {
        statusCode: res.statusCode,
        headers: {},
        body,
        timestamp: Date.now()
      });
    }
    return originalJson(body);
  };

  next();
}
