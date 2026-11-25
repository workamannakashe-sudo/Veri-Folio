# VeriFolio Judge & Operator Quick Start (docs/DEMO.md)

## 1. Quick Start for Judges (No Signup, No Setup, 1-Click)
- **Production URL**: [https://veri-folio.vercel.app](https://veri-folio.vercel.app)
- **Direct 1-Click Demo Entry**: [https://veri-folio.vercel.app/demo](https://veri-folio.vercel.app/demo)
- Click **"Enter Demo Mode"** on the landing page navigation.
- You are immediately signed in with a persistent session scoped to **"VeriFolio Demo School"**.

---

## 2. Global Role Switcher
In Demo Mode, a role switcher is fixed to the top navigation on every viewport (including 390px mobile):
- **Student**: Aarav Sharma (Class 10A)
- **Mentor**: Ms. Sunita Kulkarni (Computer Science Faculty)
- **School Admin**: Principal Office
- **University / Employer Viewer**: Horizon College Admissions

Switching roles is instant and preserves your active session.

---

## 3. The 3-Minute Demo Script Walkthrough

### Step 1: Student Portfolio Submission
- Open `/dashboard/student` or click **Student** in the switcher.
- Observe pre-seeded student entries across STEM, debate, and athletics.
- Click **"Submit New Skill Claim"** (`/entries/new`) to walk through the 5-step wizard. Notice AI skill suggestions with deterministic rule-based fallback when offline.

### Step 2: Mentor Mobile Attestation (390px Viewport)
- Switch to **Mentor** in the switcher or open `/dashboard/mentor`.
- Open pending claim **"Autonomous Campus Waste-Sorting Rover"**.
- Evaluate evidence hashes, adjust skill rubric levels (Beginner, Intermediate, Advanced).
- Enter an authentic evaluation note (minimum 20 characters, written by the mentor, never pre-filled).
- Click **"Approve & Sign"** to execute the single transaction: locks revision, builds RFC 8785 canonical JSON, signs with Ed25519 demo key (`demo-1`), and appends to the immutable SHA-256 audit ledger.

### Step 3: Public Verification & Offline Check
- Switch to **Viewer** or open `/check/ent-stu-1-1`.
- Shows **"Cryptographically Verified"** with green badge.
- Recomputes SHA-256 digest from canonical fields and verifies against the public key in `/.well-known/verifolio-keys.json`.
- Click **"QR Code"** to scan on a mobile device or **"Share Link"** to copy the URL.

### Step 4: Live Tamper Detection Demonstration
- Open `/check/ent-stu-1-2` (showcase tampered entry) or click **"Simulate DB Tampering"** on any check page.
- The record title is altered directly in the database.
- Refresh the page: the state flips immediately to **"CHANGED SINCE VERIFICATION"** with red alert.
- Click **"Restore Original Seal"** to demonstrate cryptographic self-healing verification.

### Step 5: Talent Search & Roster Administration
- Open `/dashboard/viewer`: search `"Python, advanced, verified"` to filter across 50 students. Notice under-18 minor students are masked with initials and class level only.
- Open `/dashboard/admin`: inspect hash-chain audit continuity, active head hash, and roster CSV import.

---

## 4. Operator & Offline Fallback Instructions
- **Generate / Refresh Demo Snapshot**:
  ```bash
  node -e "const { writeDemoSnapshot } = require('./apps/api/dist/api/src/scripts/demo-seed'); writeDemoSnapshot();"
  ```
- **Static Offline Fallback**:
  If the backend API is unreachable, `/demo` automatically falls back to bundled `public/demo-snapshot.json` in read-only mode so judges can navigate without errors.
