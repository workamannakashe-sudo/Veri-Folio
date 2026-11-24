# AGENTS.md

## Project
VeriFolio: mentor-verified skill portfolios. pnpm monorepo: apps/web, apps/api, apps/worker, apps/mock-erp, packages/shared. Read docs/MASTER_PROMPT.md and docs/DESIGN.md.

## Always
- TypeScript strict. Validate every request and every LLM response with zod from packages/shared.
- Never let AI output, a student or an admin change an entry to APPROVED. Only the mentor decision transaction may.
- Every private table has school_id and FORCE RLS. Viewer and public routes never query private tables; the check page uses the public_reader role and its one function.
- Seal logic lives only in apps/api/src/modules/seal as a pure library. Never edit it without updating golden-vector tests.
- UI: design tokens from apps/web/styles/tokens.css only; no raw hex in components. Text on glass meets WCAG AA 4.5:1 in dark and light themes. Include -webkit-backdrop-filter and an @supports fallback.
- Mobile first. Test every screen at 390px and 1280px.
- Every screen has loading, empty and error states.
- Copy uses the narrow "verified" claim only. Never say "certified" or "guaranteed".
- No secrets in git. Use .env.example.
- One mission per task. If a task grows beyond its phase, stop and report.

## Definition of done for any task
Types pass, lint passes, unit and API tests pass, screen verified in the browser at 390px and 1280px, screenshot attached as an artifact, short list of what is done and what is left.

## Never
- Never render raw HTML or markdown from user text.
- Never send names, contacts, marks or attendance to the LLM.
- Never auto-merge people records during ERP import.
- Never edit or delete a test to make it pass; fix the code.
- Never add a dependency without stating why; pin exact versions.
- Never run destructive database commands outside the local docker volume.
- Never put signing keys, tokens or real student data in logs or git.
- Never cache check-page responses longer than 10 seconds.
- Never pre-fill the mentor note.
