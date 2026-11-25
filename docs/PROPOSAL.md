# VeriFolio Proposal Specification

## 1. Problem Statement
High school and college students build authentic engineering, creative, and community achievements outside standard exams, but traditional school credentials only record grades and attendance. Existing portfolios are unverified self-reported claims easily exaggerated or AI-generated.

## 2. Solution: Mentor-Verified Credential Portfolios
VeriFolio provides a cryptographic trust protocol where teachers, club mentors, and sports coaches verify student work in a two-minute mobile workflow.
- Produces an Ed25519 cryptographic seal stored on a public check page.
- Provides employers and universities tamper-evident proof that a real, named educator verified the skills on a specific date.
- Protects minor student privacy with guardian consent mechanisms and zero PII sharing with external AI.

## 3. Key Actors
- **Student**: Documents projects, uploads evidence, requests review from eligible roster-linked mentors.
- **Mentor**: Evaluates submissions, selects rubric levels, inputs authentic evaluation notes, seals with one click.
- **School Admin**: Synchronizes roster data, configures mentor-group mappings, monitors tamper-evidence ledger.
- **Viewer / University**: Verifies cryptographic seals via QR code or public check URL with zero private data exposure.
