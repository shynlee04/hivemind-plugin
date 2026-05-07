---
phase: BOOT-04-primitives-recovery
status: completed
created: 2026-05-08
evidence_level: L3
allowed_surfaces:
  - tests/tools/bootstrap-recover.test.ts
  - tests/cli/commands/recover.test.ts
  - .planning/**
forbidden_surfaces:
  - .opencode/**
  - .hivemind/state/**
depends_on:
  - BOOT-02-cli-framework-entry-point
  - BOOT-03-state-init
---

# BOOT-04 Primitives Recovery Plan

## Goal

Prove `hivemind recover` restores missing `.opencode/agents`, `.opencode/skills`, and `.opencode/commands` symlinks from `.hivefiver-meta-builder/` source roots.

## Tasks

| Task | Status | Evidence |
|---|---|---|
| Verify recover tool contract | COMPLETE | `tests/tools/bootstrap-recover.test.ts` |
| Verify recover CLI output contract | COMPLETE | `tests/cli/commands/recover.test.ts` |
| Prove built CLI repairs deleted symlinks in a temp project | COMPLETE | `VERIFICATION-2026-05-08.md` |

## Acceptance Criteria

| ID | Criterion | Verification |
|---|---|---|
| BOOT04-AC-01 | Missing agent/skill/command symlinks are recreated. | Temp-project CLI proof |
| BOOT04-AC-02 | Recovery is non-destructive for real files. | Existing recover tests |
| BOOT04-AC-03 | Recovery reports repaired/skipped counts. | CLI tests + runtime output |
