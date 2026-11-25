# VeriFolio Educational ERP Rules & Constraints

## 1. Domain Clarification
VeriFolio is an educational portfolio and credential verification ERP. It is **not** a general ledger or stock inventory system. The following financial modules are explicitly marked **N/A**:
- 1.1 Money / Floating-Point currency calculations
- 1.2 General Ledger double-entry bookkeeping (Debits == Credits)
- 1.4 Physical inventory warehouse movements and FIFO valuation

## 2. Enforced Educational & Verification Rules

### Rule 1: Mentor-Exclusive State Transition (Anti-Rubber-Stamping)
- Only an assigned mentor with an active institutional relationship can transition an entry from `SUBMITTED` to `APPROVED` or `REJECTED`.
- Students, Admins, Viewers, and AI assistants are strictly forbidden from setting an entry to `APPROVED`.
- Self-verification is impossible; a student cannot be the mentor on their own submission.

### Rule 2: Strict Revision Immutability
- Once an entry is submitted (`SUBMITTED`, `IN_REVIEW`, `APPROVED`, `FLAGGED`), all existing revisions are frozen and immutable.
- Edits are only permitted in `DRAFT` or `REVISION_REQUESTED` state.
- In `REVISION_REQUESTED` state, editing increments the revision sequence and creates a new historical snapshot, preserving the audit trail of previous work.

### Rule 3: Zero-PII AI & Evidence Protection
- Student PII (legal names, guardian contacts, marks, grades, attendance records) is never sent to LLMs or AI review agents.
- AI rubric assistance operates only on anonymized student project summaries and skill category tags.

### Rule 4: No Auto-Merging on ERP Roster Import
- During CSV or mock-ERP sync, students and mentors are matched strictly by institutional identifier (`student_id` / `employee_id`).
- When a conflict or partial match occurs, records are staged for human administrative review; automatic heuristic merging of identity records is strictly banned.

### Rule 5: Cryptographic Hash-Chain Integrity
- The integrity of the portfolio verification record is maintained through an append-only SHA-256 hash chain.
- Deletions (`DELETE`) and retroactive updates (`UPDATE`) on sealed verification records are prohibited.

### Rule 6: Strictly Scoped Multi-Tenancy
- Every operational query must be filtered by `school_id`.
- Cross-tenant access is rejected at both the API middleware layer and the PostgreSQL Row-Level Security (RLS) layer.
