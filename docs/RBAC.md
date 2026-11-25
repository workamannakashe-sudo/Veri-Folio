# VeriFolio Role-Based Access Control (RBAC) Specification

## 1. Overview
VeriFolio enforces multi-tenancy and authorization across two layers:
1. **Application Middleware Layer**: `authenticate` verifies access tokens (15-min JWT) and `requireRole(...)` verifies user permissions before any controller logic executes.
2. **Database Row-Level Security Layer**: PostgreSQL `FORCE ROW LEVEL SECURITY` with non-owner role `verifolio_app` ensures that even raw queries cannot access records outside the tenant defined by `SET LOCAL app.school_id`.

---

## 2. Role & Permission Matrix

| Resource / Action | Endpoint | Student | Mentor | School Admin | Viewer Org | Public Reader |
|---|---|:---:|:---:|:---:|:---:|:---:|
| **Own Draft Entries (Create/Edit)** | `POST/PUT /entries` | **Allow** | Deny | Deny | Deny | Deny |
| **Request Verification** | `POST /entries/:id/request-verification` | **Allow** | Deny | Deny | Deny | Deny |
| **AI Skill Suggestion** | `POST /skills/suggest` | **Allow** | Deny | Deny | Deny | Deny |
| **Mentor Review Inbox** | `GET /verifications/inbox` | Deny | **Allow** (Linked only) | Deny | Deny | Deny |
| **Verification Decision (Approve/Decline)** | `POST /verifications/:id/decision` | Deny | **Allow** (Linked only) | Deny | Deny | Deny |
| **Revoke Verification** | `POST /check/:id/revoke` | Deny | **Allow** | **Allow** | Deny | Deny |
| **Approve Mentor Account** | `POST /admin/mentors/:id/approve` | Deny | Deny | **Allow** | Deny | Deny |
| **Roster CSV Import** | `POST /admin/import/csv` | Deny | Deny | **Allow** | Deny | Deny |
| **Audit Chain Integrity Status** | `GET /admin/audit/integrity` | Deny | Deny | **Allow** | Deny | Deny |
| **Search Published Entries** | `GET /viewer/search` | Deny | Deny | **Allow** | **Allow** | Deny |
| **Public Check Page** | `GET /check/:id` | **Allow** | **Allow** | **Allow** | **Allow** | **Allow** |
| **Public Keys Endpoint** | `GET /.well-known/verifolio-keys.json` | **Allow** | **Allow** | **Allow** | **Allow** | **Allow** |

---

## 3. Strict Non-Negotiable Authorization Rules
1. **Never AI or Admin Approval**: Only a mentor linked to the student via school group membership (class, club, team) may transition an entry revision to `APPROVED`.
2. **Anti-Self-Verification**: Mentors cannot review or approve entries where `student_id == mentor_id`.
3. **Tenant Boundary**: Tenant A cannot query or mutate records from Tenant B (checked via `tenantMiddleware` and PostgreSQL RLS).
4. **Minor Privacy Shield**: Minors require guardian consent before publishing (`/consent/record`). If consent is withdrawn (`/consent/withdraw`), records are immediately purged from public search. Public views for minors display first name and grade only.
