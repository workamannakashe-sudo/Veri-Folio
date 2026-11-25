# BUILD PLAN V2: VeriFolio Specification

## 1. Product Summary
VeriFolio is a mentor-verified skill portfolio platform for schools.
A student adds an entry (project, sport, club role) with evidence. A mentor linked to that student through a class, club, or team in the school roster reviews it, sets a level per skill, writes a note (minimum 20 characters, written by the mentor, never pre-filled) and approves. The platform seals the approved content (SHA-256 digest, Ed25519 signature, hash-chained audit log). Anyone with a link to a published or shared entry can open a public check page without logging in and see who verified what, when, and whether anything changed since. It plugs into a school ERP (SSO, roster, mentor links, signed webhooks) and also runs standalone with CSV import.

"Verified" means only: **a named, roster-linked mentor confirmed these skills at these levels on this date and the content has not changed.** It never claims the skill was examined. Use this exact narrow claim in all copy.

---

## 2. Non-Negotiable Rules
1. **Mentor-Exclusive Approval**: Only a mentor can set "verified". AI drafts, students request, admins configure. Enforce in API code AND with a database constraint/trigger.
2. **Roster-Linked Relationship**: The mentor must be linked to the student via group membership. Unlinked teachers and self-verification get 403.
3. **Immutable Revisions**: Verified revisions are immutable. Editing creates a new Draft revision; the approved one stays live labelled "newer edits pending".
4. **Two Data Planes**:
   - Private tables carry `school_id` with FORCE row-level security (RLS), a non-owner app role, and `SET LOCAL app.school_id` per transaction.
   - Public plane is the `published_entry` read model plus a `SECURITY DEFINER` function used by a separate `public_reader` role for the check page. The check page never reads private tables directly and works only for published or explicitly shared entries (random UUIDs).
5. **Zero Sensitive PII**: VeriFolio never receives marks, attendance, health, or disciplinary data.
6. **Robust Fallbacks**: No LLM -> rule-based tags; no ERP -> CSV + admin screen; slow mentor -> reminders + batch approval; no email -> in-app notification.
7. **Cache Invalidation**: Check-page responses are never cached longer than 10 seconds.

---

## 3. Cryptographic Seal Specification
- **Algorithm**: RFC 8785 JSON Canonicalization Scheme (JCS) -> SHA-256 -> Ed25519 digital signature.
- **Payload Fields**: `schema_version`, `school_id`, `entry_id`, `student_id`, `revision`, `key_id`, `title`, `description`, `category`, `role`, `start`, `end` (YYYY-MM-DD), `skills` `[{id, level}]` sorted by id, `evidence` `[sha256]` sorted, `mentor_id`, `mentor_note`, `decided_at` (ISO 8601 UTC).
- **Audit Ledger**: Hash-chained audit events where $H_n = \text{SHA-256}(H_{n-1} \parallel \text{Canonical}(Event_n))$.
- **Revocation**: Signed cryptographic revocation events; invalid/forged revocations raise an integrity alert.

---

## 4. Glassmorphism UI Design System
- **Theme**: Deep navy-to-indigo mesh (`#0B1030`, `#1B1650`, `#0E2A4A`) with pre-blurred radial gradient orbs animating transform only.
- **Glass**: Frosted glass panels (`rgba(255,255,255,0.08)`, border `rgba(255,255,255,0.18)`), opaque panel backing (`rgba(14,18,40,0.72)`) for WCAG AA 4.5:1 text readability.
- **Accents**: Cyan (`#5EEAD4`), Violet (`#A78BFA`), Verified Green (`#34D399`), Changed/Revoked Red (`#F87171`), Pending Amber (`#FBBF24`).
- **Typography**: Space Grotesk headings, Inter body (16px base, 1.55 line height).
- **Touch**: 44px minimum touch targets, 2px cyan focus rings.
