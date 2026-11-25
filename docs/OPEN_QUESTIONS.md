# VeriFolio Open Questions & Conservative Defaults

This document tracks ambiguous domain questions, the conservative default decisions chosen, and rationale.

---

## 1. Background Worker Runtime in Development vs Production
- **Question**: Should background jobs (nightly verification sweeper, webhook retry dispatcher) run in-process or via the standalone `apps/worker` process?
- **Conservative Default**: In production and staging, `apps/worker` runs as a dedicated BullMQ worker process connected to Redis. In standalone local offline demo runs (when Redis is unavailable), background tasks fall back gracefully to synchronous in-process handlers so the application runs without external infrastructure blockers.

---

## 2. In-Memory Mock Store vs Database Persistence
- **Question**: When PostgreSQL is running, should the API use Prisma directly, and what happens when Docker is not started?
- **Conservative Default**: Implement an adaptive repository pattern: if `DATABASE_URL` is reachable and verified, use Prisma client with RLS (`assertNonOwnerAppRole`); if the database is unreachable, fall back to the in-memory repository `memoryStore` with an explicit console warning so the application remains 100% operational in offline evaluation environments.

---

## 3. Webhook Delivery Failures to School ERP
- **Question**: If the external School ERP endpoint returns a 5xx error or is unreachable, should the verification approval transaction fail or succeed?
- **Conservative Default**: The mentor decision and cryptographic seal transaction MUST succeed atomically in VeriFolio. The webhook event is enqueued into BullMQ for asynchronous delivery with up to 5 exponential backoff retries. The mentor's Ed25519 seal is never held hostage by an external school server timeout.
