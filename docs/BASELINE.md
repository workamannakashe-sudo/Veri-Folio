# VeriFolio Baseline Verification Log

Generated: 2026-11-25

This document records the exact verbatim command execution outputs, exit codes, and failure traces when running build, lint, typecheck, tests, and Docker checks on the baseline repository.

---

## 1. Monorepo Build (`pnpm -r run build`)

**Command:**
```bash
pnpm -r run build
```

**Result:** Exited with code 0 (Success)

**Verbatim Output:**
```text
Scope: 5 of 6 workspace projects
packages/shared build$ tsc
packages/shared build: Done
apps/api build$ tsc
apps/worker build$ tsc
apps/web build$ next build
apps/mock-erp build$ tsc
apps/worker build: Done
apps/mock-erp build: Done
apps/api build: Done
apps/web build:   ▲ Next.js 14.2.18
apps/web build: 
apps/web build:    Creating an optimized production build ...
apps/web build:  ✓ Compiled successfully
apps/web build:    Linting and checking validity of types ...
apps/web build:    Collecting page data ...
apps/web build:    Generating static pages (0/11) ...
apps/web build:    Generating static pages (2/11) 
apps/web build:    Generating static pages (5/11) 
apps/web build:    Generating static pages (8/11) 
apps/web build:  ✓ Generating static pages (11/11)
apps/web build:    Finalizing page optimization ...
apps/web build:    Collecting build traces ...
apps/web build: 
apps/web build: Route (app)                              Size     First Load JS
apps/web build: ┌ ○ /                                    2.39 kB         106 kB
apps/web build: ├ ○ /_not-found                          870 B            88 kB
apps/web build: ├ ƒ /check/[id]                          5.91 kB         101 kB
apps/web build: ├ ○ /dashboard/admin                     3.13 kB         103 kB
apps/web build: ├ ○ /dashboard/admin/roster              5.07 kB         104 kB
apps/web build: ├ ○ /dashboard/mentor                    3.76 kB         103 kB
apps/web build: ├ ○ /dashboard/student                   348 B           104 kB
apps/web build: ├ ○ /dashboard/viewer                    4.04 kB         103 kB
apps/web build: ├ ○ /entries/new                         33.1 kB         132 kB
apps/web build: ├ ○ /login                               3.88 kB        99.3 kB
apps/web build: └ ƒ /verifications/[id]                  6.87 kB         106 kB
apps/web build: + First Load JS shared by all            87.2 kB
apps/web build:   ├ chunks/120-7e84da3097733bda.js       31.6 kB
apps/web build:   ├ chunks/16b899b3-b11f1e29bb5eebfb.js  53.6 kB
apps/web build:   └ other shared chunks (total)          1.96 kB
apps/web build: 
apps/web build: ○  (Static)   prerendered as static content
apps/web build: ƒ  (Dynamic)  server-rendered on demand
apps/web build: 
apps/web build: Done
```

---

## 2. Monorepo Lint (`pnpm -r run lint`)

**Command:**
```bash
pnpm -r run lint
```

**Result:** Exited with code 1 (Failed)

**Verbatim Failure Output:**
```text
Scope: 5 of 6 workspace projects
packages/shared lint$ tsc --noEmit
packages/shared lint: Done
apps/worker lint$ tsc --noEmit
apps/mock-erp lint$ tsc --noEmit
apps/api lint$ tsc --noEmit
apps/web lint$ next lint
apps/web lint: ? How would you like to configure ESLint? https://nextjs.org/docs/basic-features/eslint
apps/web lint: ❯  Strict (recommended)
apps/web lint:  ⚠ If you set up ESLint yourself, we recommend adding the Next.js ESLint plugin. See https://nextjs.org/docs/basic-features/eslint#migrating-existing-config
apps/web lint:    Base
apps/web lint:    Cancel
apps/web lint: Failed
[ELIFECYCLE] Command failed with exit code 1.
apps/worker lint: Failed
[ELIFECYCLE] Command failed with exit code 1.
apps/mock-erp lint: Failed
[ELIFECYCLE] Command failed with exit code 1.
apps/api lint: Failed
[ELIFECYCLE] Command failed with exit code 1.
Error: ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL
```

**Root Cause:**
`apps/web` does not have an `.eslintrc.json` or ESLint configuration file, causing `next lint` to stop at an interactive CLI prompt in non-interactive CI/build environments.

---

## 3. Monorepo Typecheck (`pnpm -r run typecheck`)

**Command:**
```bash
pnpm -r run typecheck
```

**Result:** Exited with code 0 (Success)

**Verbatim Output:**
```text
Scope: 5 of 6 workspace projects
packages/shared typecheck$ tsc --noEmit
packages/shared typecheck: Done
apps/api typecheck$ tsc --noEmit
apps/worker typecheck$ tsc --noEmit
apps/mock-erp typecheck$ tsc --noEmit
apps/web typecheck$ tsc --noEmit
apps/worker typecheck: Done
apps/mock-erp typecheck: Done
apps/web typecheck: Done
apps/api typecheck: Done
```

---

## 4. Test Suite Execution (`pnpm -r run test`)

**Command:**
```bash
pnpm -r run test
```

**Result:** Exited with code 0 (All 49 Vitest tests passed)

**Verbatim Output:**
```text
Scope: 5 of 6 workspace projects
$ vitest run

 RUN  v2.1.5 C:/Users/Aman/OneDrive/Desktop/VeriFolio/Veri-Folio/apps/api

 ✓ src/tests/tenant-isolation.test.ts (3 tests) 11ms
 ✓ src/modules/seal/seal.test.ts (7 tests) 61ms
 ✓ src/tests/erp.test.ts (5 tests) 247ms
 ✓ src/tests/suggester.test.ts (3 tests) 145ms
 ✓ src/tests/consent-and-viewer.test.ts (3 tests) 209ms
 ✓ src/tests/check.test.ts (3 tests) 267ms
 ✓ src/tests/auth.test.ts (8 tests) 306ms
 ✓ src/tests/verifications.test.ts (9 tests) 319ms
 ✓ src/tests/entries-and-roster.test.ts (8 tests) 359ms

 Test Files  9 passed (9)
      Tests  49 passed (49)
   Start at  16:19:46
   Duration  11.76s (transform 5.56s, setup 0ms, collect 63.72s, tests 1.92s, environment 3ms, prepare 11.79s)
```

---

## 5. Docker Compose Config Validation (`docker-compose config`)

**Command:**
```bash
docker-compose config
```

**Result:** Exited with code 0 (Config validated with deprecation notice)

**Verbatim Output:**
```text
time="2026-11-25T16:21:41+05:30" level=warning msg="docker-compose.yml: the attribute `version` is obsolete, it will be ignored, please remove it to avoid potential confusion"
name: veri-folio
services:
  minio:
    container_name: verifolio-minio
    ...
  postgres:
    container_name: verifolio-postgres
    ...
  redis:
    container_name: verifolio-redis
    ...
```

---

## 6. Docker Daemon Status (`docker info`)

**Command:**
```bash
docker info
```

**Result:** Exited with code 1 (Docker engine daemon not currently running)

**Verbatim Output:**
```text
Client:
 Version:    29.5.3
 Context:    default
 Debug Mode: false

Server:
failed to connect to the docker API at npipe:////./pipe/docker_engine; check if the path is correct and if the daemon is running: open //./pipe/docker_engine: The system cannot find the file specified.
```
