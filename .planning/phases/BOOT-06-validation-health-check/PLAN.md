---
phase: BOOT-06-validation-health-check
status: completed
created: 2026-05-08
evidence_level: L2-L3
allowed_surfaces:
  - src/cli/commands/doctor.ts
  - src/lib/bootstrap-structure.ts
  - tests/cli/commands/doctor.test.ts
  - .planning/**
depends_on:
  - BOOT-03-state-init
  - BOOT-04-primitives-recovery
  - BOOT-05-config-bootstrap-defaults
---

# BOOT-06 Validation + Health Check Plan

## Goal

Make `hivemind doctor` a complete BOOT health check and prove it passes for the current project.

## Tasks

| Task | Status | Evidence |
|---|---|---|
| Add doctor checks for typecheck, tests, and modules | COMPLETE | `src/lib/bootstrap-structure.ts`, `src/cli/commands/doctor.ts` |
| Preserve recovery semantics for real primitive files | COMPLETE | Doctor reports real files as WARN |
| Verify with doctor unit tests and built CLI doctor | COMPLETE | `VERIFICATION-2026-05-08.md` |

## Acceptance Criteria

| ID | Criterion | Verification |
|---|---|---|
| BOOT06-AC-01 | Doctor includes structure, symlinks, config, sdk, typecheck, tests, and modules. | Unit tests + CLI output |
| BOOT06-AC-02 | Failed typecheck/tests fail doctor. | Unit test with injected runner |
| BOOT06-AC-03 | Current project doctor exits successfully. | Built CLI doctor output |
