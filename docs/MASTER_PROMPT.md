ROLE
You are a senior full-stack engineer and product designer. VeriFolio must be a professional, production-quality web application for a hackathon demo that also holds up as a real school product. In THIS task, produce only: (1) an implementation plan artifact, (2) a task list artifact, (3) the repo scaffold (monorepo, docker-compose, CI skeleton, AGENTS.md, docs/). Then STOP and wait for approval. Each later phase runs as a separate agent that reads AGENTS.md and docs/MASTER_PROMPT.md. Do not build features in this task.

PRODUCT
VeriFolio is a mentor-verified skill portfolio platform for schools. A student adds an entry (project, sport, club role) with evidence. A mentor linked to that student through a class, club or team in the school roster reviews it, sets a level per skill, writes a note (min 20 characters, written by the mentor, never pre-filled) and approves. The platform seals the approved content (SHA-256 digest, Ed25519 signature, hash-chained audit log). Anyone with a link to a published or shared entry can open a public check page without logging in and see who verified what, when, and whether anything changed since. It plugs into a school ERP (SSO, roster, mentor links, signed webhooks) and also runs standalone with CSV import.
"Verified" means only: a named, roster-linked mentor confirmed these skills at these levels on this date and the content has not changed. It never claims the skill was examined. Use this exact narrow claim in all copy.

NON-NEGOTIABLE RULES
1. Only a mentor can set "verified". AI drafts, students request, admins configure. Enforce in API code AND with a database constraint/trigger.
2. The mentor must be linked to the student via group membership. Unlinked teachers and self-verification get 403.
3. Verified revisions are immutable. Editing creates a new Draft revision; the approved one stays live labelled "newer edits pending".
4. Two data planes. Private tables carry school_id with FORCE row-level security, a non-owner app role and SET LOCAL app.school_id per transaction. The public plane is the published_entry read model plus a SECURITY DEFINER function used by a separate public_reader role for the check page. The check page never reads private tables directly and works only for published or explicitly shared entries (random UUIDs).
5. VeriFolio never receives marks, attendance, health or disciplinary data.
6. Every external dependency has a fallback: no LLM -> rule-based tags; no ERP -> CSV + admin screen; slow mentor -> reminders + batch approval; no email -> in-app notification.
7. Check-page responses are never cached longer than 10 seconds.

STACK
pnpm workspaces monorepo: apps/web (Next.js current stable, TypeScript, Tailwind, installable PWA), apps/api (Node current LTS, Express, TypeScript, zod, Prisma + raw SQL for RLS and search), apps/worker (BullMQ), apps/mock-erp (small Express app), packages/shared (zod schemas, types). Infra: PostgreSQL, Redis, S3-compatible storage (MinIO locally, Cloudflare R2 in prod), docker-compose, GitHub Actions (lint, typecheck, vitest, playwright). Verify current versions against official docs, pin exact versions and record them in docs/VERSIONS.md. Auth: Google OAuth + email one-time code; ERP SSO via OIDC against the mock ERP; 15-minute JWT + rotating httpOnly refresh cookie; RBAC (student, mentor, admin, viewer). Integrity: Node crypto, RFC 8785 canonical JSON, SHA-256, Ed25519.

ROLES AND LIMITS
Student: add/edit drafts, accept or edit AI skills, pick an eligible mentor, request verification, publish/unpublish/delete. CANNOT mark anything verified.
Mentor: see only linked students' requests; approve, set levels, ask for changes, decline, revoke. CANNOT verify unlinked students or own records.
Viewer (registered, admin-approved organisation): search published verified entries, open check pages and one-page portfolios. CANNOT see private entries or contact details.
School admin: approve mentors, map mentors to groups, import roster, set publishing policy, review flagged mentors and anomaly signals, see participation numbers. CANNOT approve entries or edit entry content.

DATA MODEL
school, user(role, minor flag, erp_ref, status), group, membership(user, group, role_in_group), entry, entry_revision(state DRAFT|REQUESTED|CHANGES_REQUESTED|APPROVED|DECLINED|REVOKED; immutable once requested), skill(~150 in 8 families: technology, science, arts, sports, leadership, communication, community, enterprise; with synonyms), entry_skill(level, source STUDENT|AI|MENTOR), evidence(object_key, sha256, type, size, scan_status), verification(mentor_id, decision, note, digest, signature, key_id, decided_at), revocation(signed event), audit_event(school_id, sequence, type, actor, payload, prev_hash, hash; insert-only, trigger blocks UPDATE/DELETE), consent(guardian reference, scope, given_at, withdrawn_at, notice_version), published_entry(display fields, tsv, skill_ids, verified_at), share_link, viewer_org, view_log, notification, flag, mentor_signal.
A trigger allows state APPROVED only when a matching verification row written by the decision transaction exists.

SEAL (implement exactly; pure library in apps/api/src/modules/seal, no DB dependency)
fields = { schema_version, school_id, entry_id, student_id, revision, key_id, title, description, category, role, start, end (ISO 8601 dates), skills:[{id,level}] sorted by id, evidence:[sha256] sorted, mentor_id, mentor_note, decided_at (ISO 8601 UTC, ms) }
digest = sha256(canonicalize(fields)); sig = ed25519_sign(privateKey[key_id], digest)
event_hash = sha256(prev_event_hash || canonicalize(event)), one chain per school.
Revocation = signed event {schema_version, entry_id, revision, verification_digest, revoked_by, reason, revoked_at, key_id}; a revoked flag alone is never trusted.
check(entry) = APPROVED and recomputed digest == stored and signature verifies and no valid signed revocation and chain continuous. Approval is ONE transaction: verify link, freeze revision, canonicalize, hash, sign, write verification row, append audit event. Signing sits behind a Signer interface (env-secret for demo, KMS-ready). Nightly sweeper re-checks all verified entries, alerts admin on mismatch, signs and emails the chain head. Golden-vector tests are mandatory. Provide an admin-only tamper-demo script.

MENTOR NOTE
The note field starts empty. Show three suggestion prompts beside it. Reject notes under 20 characters or matching template text. Record approval duration and approval rate per mentor as signals for admins; show mentor confirmed count and change/decline rate on viewer cards.

AI SKILL SUGGESTION (assist-only)
SkillSuggester interface with LlmSuggester and RuleSuggester. Pipeline: redact (names, phones, emails, IDs, school names -> placeholders) -> closed skill list prompt, up to 5 skills with level, one-line reason and 2-line summary as JSON, temperature 0, cache by hash of redacted text -> zod validate, drop unknown ids -> on timeout/invalid/provider down fall back to RuleSuggester. Provider chosen by env var (Gemini default). The model has no tools and no path to status changes. UI labels each skill AI-suggested or student-added; mentors see the labels.

PRIVACY
Private by default. Minors need recorded guardian consent (who, when, how, notice version) before first publish; withdrawal unpublishes everything within minutes and purges caches. Minors show first name + class level only. No contact details anywhere. Viewer organisations are approved; every view is logged; rate limits and caps; no bulk export. Deletion removes files and read-model rows; the audit chain keeps a hash-only tombstone. No tracking, no ads.

SECURITY
RLS isolation suite (every table, two schools), strict CSP, no raw HTML/markdown rendering, upload type/size/magic-byte checks and scan hook, separate files domain with nosniff, Redis rate limits, httpOnly SameSite cookies, authorisation tests for every role, startup check that fails if the DB role is superuser or owner.

UI (design system in docs/DESIGN.md; tokens in apps/web/styles/tokens.css)
Professional glassmorphism, mobile-first, installable PWA, WCAG AA 4.5:1, keyboard accessible, loading/empty/error states on every screen, dark default with a light theme that has its own darker status colours. Orbs are pre-blurred radial gradients animating only transform. Always include -webkit-backdrop-filter and an @supports fallback; honour prefers-reduced-transparency and prefers-reduced-motion. Use glass sparingly.

SCREENS
Public: landing, sign-in, /check/:id.
Student: dashboard, 5-step wizard, entry detail with revision timeline, portfolio and publish controls, consent.
Mentor: inbox, phone-first review, student history, my stats.
Viewer: organisation signup, search, result cards, one-page portfolio, flag dialog.
Admin: roster import, group/mentor mapping, mentor approvals, publishing policy, flagged entries and anomaly signals, analytics, integrity status.
Mock ERP: login, lists, embedded Verified Skills tab, webhook log.

SEED DATA
One demo school: 3 classes, 2 clubs, 1 cricket team, 12 students (2 minors with consent), 5 mentors, 2 viewer orgs, 150-skill list, 20 entries in mixed states including the "Campus waste-sorting app" sample, one revoked entry and one hand-tampered entry.

DELIVERABLES OF THIS TASK ONLY
Implementation plan, task list, scaffold, docs/MASTER_PROMPT.md, docs/DESIGN.md, docs/VERSIONS.md (draft), AGENTS.md. Then stop and wait.
