import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { defaultKeyRegistry } from './modules/seal/keys';
import { idempotencyMiddleware } from './middleware/idempotency';
import {
  requestIdMiddleware,
  securityHeadersMiddleware,
  rateLimitMiddleware,
  errorHandlerMiddleware,
  logger
} from './middleware/security';
import { memoryStore } from './services/store';
import { authRouter } from './routes/auth.routes';
import { dashboardRouter } from './routes/dashboard.routes';
import { entriesRouter } from './routes/entries.routes';
import { adminRouter } from './routes/admin.routes';
import { skillsRouter } from './routes/skills.routes';
import { verificationsRouter } from './routes/verifications.routes';
import { checkRouter } from './routes/check.routes';
import { viewerRouter } from './routes/viewer.routes';
import { consentRouter } from './routes/consent.routes';

const app = express();
const port = Number(process.env.PORT) || 4000;

// Security, Tracking & Formatting Middlewares
app.use(requestIdMiddleware);
app.use(securityHeadersMiddleware);
app.use(rateLimitMiddleware);
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(idempotencyMiddleware);

// Liveness check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'api',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Readiness check (checks storage, key registry, and dependencies)
app.get('/ready', (_req, res) => {
  const isKeyActive = !!defaultKeyRegistry.getKey('ed25519-demo-2026-v1');
  const isStoreReady = memoryStore.users.size > 0;

  const checks = {
    keyRegistry: isKeyActive ? 'ok' : 'degraded',
    store: isStoreReady ? 'ok' : 'degraded',
    memoryRssBytes: process.memoryUsage().rss
  };

  const isReady = isKeyActive && isStoreReady;
  res.status(isReady ? 200 : 503).json({
    status: isReady ? 'ready' : 'not_ready',
    service: 'api',
    checks
  });
});

// Metrics endpoint
app.get('/metrics', (_req, res) => {
  const mem = process.memoryUsage();
  res.json({
    uptime_seconds: Math.floor(process.uptime()),
    memory: {
      rss_mb: (mem.rss / 1024 / 1024).toFixed(2),
      heap_used_mb: (mem.heapUsed / 1024 / 1024).toFixed(2),
      heap_total_mb: (mem.heapTotal / 1024 / 1024).toFixed(2)
    },
    total_users: memoryStore.users.size,
    total_entries: memoryStore.entries.size,
    total_published: memoryStore.publishedEntries.size
  });
});

// Well-known public keys for Ed25519 seal verification
app.get('/.well-known/verifolio-keys.json', (_req, res) => {
  res.json(defaultKeyRegistry.getWellKnownKeys());
});

// Routes
app.use('/auth', authRouter);
app.use('/dashboard', dashboardRouter);
app.use('/entries', entriesRouter);
app.use('/admin', adminRouter);
app.use('/skills', skillsRouter);
app.use('/verifications', verificationsRouter);
app.use('/check', checkRouter);
app.use('/viewer', viewerRouter);
app.use('/consent', consentRouter);

// Centralized Error Handler (Catches all unhandled errors and formats client-safe JSON)
app.use(errorHandlerMiddleware);

let server: any = null;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(port, '0.0.0.0', () => {
    logger.info(`VeriFolio API listening on port ${port}`);
  });

  // Graceful shutdown
  const shutdown = () => {
    logger.info('Received shutdown signal. Draining connections...');
    if (server) {
      server.close(() => {
        logger.info('VeriFolio API server closed gracefully.');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

export default app;
