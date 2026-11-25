# VeriFolio Comprehensive Technical & ERP Logic Audit

Generated: 2026-11-25  
Auditor: Principal Full-Stack Engineer, ERP/Accounting Domain Expert, DevOps Lead

---

## 1. Executive Summary

This audit assesses the VeriFolio monorepo across architecture, business/ERP logic, data integrity, background jobs, frontend-backend wiring, and DevOps readiness.

VeriFolio is an educational verification platform (mentor-verified student skills, roster sync, cryptographic Ed25519 sealing, and audit chains). Financial accounting, general ledger, tax/GST, and physical inventory do **not** apply to this domain and are marked as **N/A** per prompt guidelines.

---

## 2. Findings Log

| ID | File:Line | Category | Severity | Root Cause | Impact | Proposed Fix |
|---|---|---|---|---|---|---|
| **AUD-001** | `apps/worker/src/index.ts:1-6` | Completeness / Async Jobs | **High** | Background worker is an empty idle heartbeat stub (`setInterval(...)`). | BullMQ queues for nightly verification sweeping, MinIO virus scanning, and webhook retries are not running. | Implement BullMQ queue processors for verification re-checking, virus scan hooks, and retryable webhook dispatch. |
| **AUD-002** | `apps/api/src/routes/*.ts` | Architecture / Persistence | **High** | API routes operate against in-memory `memoryStore` rather than Prisma / PostgreSQL database. | Process restart drops dynamic entries, revisions, and new audit events created after startup. | Implement a persistent database repository layer (Prisma + RLS) with seamless fallback for isolated testing. |
| **AUD-003** | `apps/api/src/routes/dashboard.routes.ts:10-56` | Completeness / API | **High** | All 4 role dashboard routes (`/student`, `/mentor`, `/admin`, `/viewer`) return static hardcoded empty objects. | Frontend dashboards must query underlying entity routes or suffer from blank dashboard overviews. | Query live data from store/database to compute dynamic counts (pending reviews, verified skills, active roster). |
| **AUD-004** | `apps/api/src/routes/admin.routes.ts:1` vs `apps/web/src/app/dashboard/admin/page.tsx:23` | Logic Defect / Missing Route | **High** | Frontend calls `GET /admin/audit/integrity`, but this route does not exist in backend router. | Admin dashboard receives 404 and always falls back to hardcoded numbers (2 students, 2 mentors, 1 verified). | Add `GET /admin/audit/integrity` to `admin.routes.ts` returning chain continuity, head hash, and event count. |
| **AUD-005** | `apps/web/src/app/dashboard/admin/roster/page.tsx:140-160` | Logic Defect / Integration | **High** | CSV import uses unauthenticated `fetch` with mismatched payload key `{ csv: ... }` instead of `{ csv_content: ... }`. | CSV upload always fails authorization/validation and triggers a fake `setTimeout` fallback. | Use `apiFetch` with JWT token and send correct `{ csv_content: csvContent }` payload matching API schema. |
| **AUD-006** | `apps/api/src/services/webhook.ts:46-48` | Reliability / Webhooks | **Medium** | Webhook dispatcher catches network errors and returns a simulated success (`mock-${timestamp}`). | Failed webhook deliveries to school ERP are not queued or retried, causing silent delivery loss. | Integrate webhook dispatch with BullMQ queue with exponential backoff retries and dead-letter log. |
| **AUD-007** | `apps/web/package.json:9` | CI/CD / Linting | **Medium** | `next lint` lacks `.eslintrc.json`, causing interactive prompt in non-interactive environments and CI failure. | `pnpm -r run lint` fails in non-interactive CI jobs with exit code 1. | Add standard `.eslintrc.json` extending `next/core-web-vitals` to `apps/web`. |
| **AUD-008** | `docker-compose.yml:1` | DevOps / Config | **Low** | Top-level `version: '3.8'` attribute is obsolete in modern Docker Compose v5+. | Emits deprecation warnings on every docker compose invocation. | Remove obsolete `version: '3.8'` line from `docker-compose.yml`. |
| **AUD-009** | `packages/shared/src/skills-data.ts:1` | Data Consistency | **Low** | Controlled skills list (~150 skills) is defined in shared package but not seeded into Prisma `Skill` table. | Database seeds may lack full canonical taxonomy if migrated to PostgreSQL. | Add database seed script populating `Skill` table directly from `CONTROLLED_SKILLS`. |
| **AUD-010** | `apps/api/src/routes/entries.routes.ts:15` | API Validation | **Medium** | `category` is restricted to strictly `['project', 'sport', 'club']`, but some UI mocks used display labels (e.g. `STEM & Robotics`). | Inconsistent category schemas can lead to validation failures on entry creation. | Standardize category enum across `packages/shared` and ensure UI dropdown values match schema exactly. |

---

## 3. ERP & Business Domain Verification (Phase 1 Assessment)

Per prompt specifications, areas that do not apply to the VeriFolio educational verification domain:

| Domain Area | Applicable? | Analysis & Reason |
|---|---|---|
| **1.1 Money and Numbers** | **N/A** | VeriFolio does not process payments, fees, or invoicing. It handles verified skill claims and cryptographic seals. |
| **1.2 Accounting Integrity (Double-Entry)** | **N/A** | No financial accounts or ledgers exist. Audit integrity is maintained via cryptographic hash chains (SHA-256 blocks). |
| **1.3 Document Lifecycle** | **Applicable** | Entry revision lifecycle (`DRAFT` -> `REQUESTED` -> `CHANGES_REQUESTED` -> `APPROVED` -> `DECLINED` -> `REVOKED`) is enforced via strict state machine and triggers. |
| **1.4 Inventory** | **N/A** | No physical stock or warehouse tracking. |
| **1.5 Numbering and Identifiers** | **Applicable** | Uses UUIDs for internal IDs, cryptographic hashes (SHA-256) for digests, and sequential counters for audit blocks. |
| **1.6 Concurrency and Idempotency** | **Applicable** | Multi-step decision and sealing transactions must be atomic; background queue jobs must be idempotent. |
| **1.7 Data Integrity at Database Level** | **Applicable** | Schema constraints (NOT NULL, UNIQUE, triggers blocking unverified approvals and preventing audit log mutation) are specified in SQL. |
| **1.8 Multi-tenancy, Auth & Permissions** | **Applicable** | Multi-tenant isolation by `school_id`, PostgreSQL FORCE RLS, role-based access control (Student, Mentor, Admin, Viewer). |
| **1.9 Audit Trail** | **Applicable** | Hash-chained audit event log with continuous SHA-256 proofs per school. |
| **1.10 Dates, Time & Localization** | **Applicable** | Timestamps in UTC ISO 8601; dates formatted consistently. |

---

## 4. Threshold Assessment & Next Steps

- **Total Blocker Findings:** 0
- **Total High Findings:** 5 (AUD-001 through AUD-005)
- **Total Medium Findings:** 3 (AUD-006, AUD-007, AUD-010)
- **Total Low Findings:** 2 (AUD-008, AUD-009)
- **Breaking Schema Changes Required:** None.

Because there are **fewer than 10 Blocker/High findings (5 total)** and **no breaking schema changes required**, we can proceed systematically through the remaining phases according to our implementation plan.
