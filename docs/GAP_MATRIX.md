# VeriFolio Gap Matrix: Plan v2 Compliance Audit

| Requirement / Component | Plan v2 Spec | Current Status | Evidence & Defect Location | Planned Remediation |
| :--- | :--- | :--- | :--- | :--- |
| **Pure Cryptographic Seal Library** | RFC 8785 JCS, SHA-256, Ed25519 signer, exact fields, golden vectors | **PRESENT & VERIFIED** | `apps/api/src/modules/seal/` (100% tests passing) | Maintained; golden vectors pass without DB. |
| **State Machine Enforcement** | DRAFT → REQUESTED → (APPROVED \| DECLINED \| CHANGES_REQUESTED) | **PRESENT** | `@verifolio/shared/src/index.ts` | Ensure API & UI use exact Plan v2 status labels. |
| **PostgreSQL RLS & Tenant Isolation** | FORCE RLS on all 14 private tables, 2-tenant test matrix, app role non-superuser | **PRESENT** | `infra/init-db/00-schema.sql`, `src/tests/tenant-isolation.test.ts` | Keep single source of truth. |
| **Mentor-Link Group Membership** | Unlinked mentor, student, and admin get 403 on verify | **PRESENT** | `apps/api/src/routes/verifications.routes.ts`, `src/tests/erp.test.ts` | Verified; self-verification blocked. |
| **Public Check Page (`/check/:id`)** | Server-rendered, no login, public_reader read-model, QR code, tamper check | **PRESENT** | `apps/api/src/routes/check.routes.ts`, `apps/web/src/app/check/[id]/page.tsx` | Ensure glassmorphism theme tokens and QR scanner. |
| **Tamper Simulation Demo** | Direct DB row edit triggers "Changed since verification" | **PRESENT** | `POST /check/:id/tamper-demo`, `e2e-lifecycle-tamper.test.ts` | Expose in Demo Mode admin/check panel. |
| **Glassmorphism Design System** | Deep navy/indigo mesh, pre-blurred orbs, frosted panels, cyan/violet accents | **BROKEN / DRIFTED** | Previously had EduView pastel colors | **P0 Fix**: Fully align `apps/web/styles/tokens.css` and all screens with Plan v2 section 6 tokens. Remove any pastel leftovers. |
| **Demo Mode (1-Click, 50 Students)** | `/demo` entry point, persistent banner, role switcher, static snapshot fallback, 50 students | **MISSING** | No dedicated `/demo` route or 50-student static snapshot | **P0 Implementation**: Build 50-student deterministic dataset, `/demo` route, role switcher in top bar, and offline snapshot fallback. |
| **Guardian Consent for Minors** | Recorded guardian consent, minor name masking (first name + class only) | **PRESENT** | `apps/api/src/tests/consent-and-viewer.test.ts` | Reflected in Demo dataset (6 minor students). |
| **AI Suggester with Rule Fallback** | PII redaction, ~150 controlled skills in 8 families, offline fallback | **PRESENT** | `apps/api/src/services/suggester.ts`, `suggester.test.ts` | Set `AI_PROVIDER=rules` for demo mode. |
| **Signed Webhook Dispatcher & ERP** | HMAC-SHA256 webhooks, mock ERP with Verified Skills tab | **PRESENT** | `apps/mock-erp/src/index.ts`, `apps/worker/src/index.ts` | Preload with demo school roster and webhook logs. |
| **Responsive Screen Tests** | 390px and 1280px clean across all 4 roles | **PARTIAL** | Verified on desktop, needs mobile audit | Optimize mobile layouts at 390px. |
