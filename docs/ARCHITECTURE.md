# VeriFolio Architecture Specification

## 1. System Overview
VeriFolio is an educational skill portfolio verification platform that bridges student self-reported project claims with cryptographically sealed mentor attestations. 

```mermaid
flowchart TD
    subgraph Client["Presentation Tier (apps/web)"]
        UI["Next.js 14 Web App\n(WCAG AA Glassmorphism)"]
        RoleViews["Role-Specific Views\n(Student, Mentor, Admin, Public Viewer)"]
    end

    subgraph API["Application Tier (apps/api)"]
        Router["Express + TypeScript Server"]
        AuthMiddleware["JWT + RBAC + RLS Context"]
        SecMiddleware["Token Bucket Rate Limiter + Security Headers"]
        IdempMiddleware["Idempotency Engine (24-hr Cache)"]
        SealEngine["Cryptographic Seal Module (Pure Library)"]
        AuditLog["Hash-Chained Audit Ledger"]
    end

    subgraph Worker["Background Tier (apps/worker)"]
        BullMQWorker["BullMQ Worker (Redis Queue)"]
        Sweeper["Verification Sweeper"]
        Scanner["Evidence ClamAV Scanner"]
        Webhook["ERP Webhook Dispatcher"]
    end

    subgraph Data["Persistence Tier"]
        PG[("PostgreSQL 16\n(FORCE RLS + Cascade Constraints)")]
        Redis[("Redis 7\n(Queues, Token Buckets, Idempotency)")]
        Minio[("MinIO S3\n(Encrypted Evidence Storage)")]
    end

    UI --> Router
    Router --> AuthMiddleware
    AuthMiddleware --> SecMiddleware
    SecMiddleware --> IdempMiddleware
    IdempMiddleware --> SealEngine
    SealEngine --> AuditLog
    AuditLog --> PG
    Router --> BullMQWorker
    BullMQWorker --> PG
    BullMQWorker --> Redis
```

## 2. Cryptographic Sealing Pipeline
The seal mechanism guarantees tamper-proof verification badges that can be validated offline by third-party universities or employers.

1. **Payload Canonicalization**:
   The verification payload (entry ID, student ID, mentor ID, school ID, rubric score, approved timestamp, skill taxonomy IDs) is normalized via RFC 8785 JSON Canonicalization Scheme (JCS).
2. **SHA-256 Digest**:
   A deterministic 256-bit hash digest is produced over the canonical bytes.
3. **Ed25519 Signature**:
   The school's active private key signs the digest:
   $$\text{Seal} = \text{Sign}_{\text{Ed25519}}(\text{PrivateKey}_{\text{school}}, \text{SHA-256}(\text{CanonicalPayload}))$$
4. **Append-Only Hash Chain**:
   Each approved verification appends an immutable block to the audit log:
   $$H_n = \text{SHA-256}(H_{n-1} \parallel \text{EventData}_n \parallel \text{Seal}_n)$$
   Any retroactive edit breaks the chain continuity immediately, flagged by `GET /api/v1/admin/audit/integrity`.

## 3. Defense-in-Depth Security
- **PostgreSQL Row-Level Security (RLS)**:
  Every private table has `FORCE ROW LEVEL SECURITY`. Application queries pass `SET LOCAL app.current_school_id = ...` and `SET LOCAL app.current_user_id = ...`. Tenant leakage is impossible at the SQL engine level.
- **Role-Based Access Control (RBAC)**:
  Strict server-side enforcement across 5 roles: `STUDENT`, `MENTOR`, `ADMIN`, `VIEWER`, `PUBLIC_READER`.
- **Public Reader Isolation**:
  The public check page operates under an isolated database role with execution rights restricted exclusively to verification validation functions. Private school data, notes, and records are never queried.
- **Privacy Shield**:
  Under 18 student data is protected. Minor PII (legal names, contacts, attendance, marks) is strictly masked and never dispatched to external LLMs or third parties.
