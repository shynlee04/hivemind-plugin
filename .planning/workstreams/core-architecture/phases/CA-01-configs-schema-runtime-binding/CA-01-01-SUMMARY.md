---
phase: CA-01
plan: 01
subsystem: schema-kernel
tags: [configs, schema, zod, snake-case, migration]
requires: []
provides: [HivemindConfigsSchema-v2, WorkflowConfigSchema, DiscussModeSchema, LEGACY_KEY_MAP, migrateKeys]
affects: [readConfigs, writeConfigs, getDefaultConfigs]
tech-stack:
  added: []
  patterns: [factory-default-for-zod-v4, legacy-key-migration]
key-files:
  created: []
  modified:
    - src/schema-kernel/hivemind-configs.schema.ts
    - src/schema-kernel/index.ts
    - tests/schema-kernel/hivemind-configs.schema.test.ts
    - .hivemind/configs.json
key-decisions:
  - "Zod v4 requires factory default for WorkflowConfigSchema due to inner-field defaults not being resolved at .default({}) time"
  - "LEGACY_KEY_MAP and migrateKeys() provide backward compat for camelCase→snake_case migration in readConfigs()"
  - "Schema version bumped to 2.0.0 (breaking: field name changes)"
requirements-completed: [D-CONF-01, D-CONF-04, D-CONF-05]
duration: "~15 min"
completed: "2026-05-06"
---

# Phase CA-01 Plan 01: Schema Expansion to Skeleton v2 §9.1 Summary

Expanded configs.json Zod schema from 5-field minimal to full skeleton v2 §9.1 with 13 workflow toggles, 3 execution fields, and snake_case JSON key convention.

## Duration

~15 minutes

## Tasks Completed: 1/1

### Task 1: Expand Zod schema to full skeleton v2 §9.1

**Schema changes:**
- Bumped `HIVEMIND_CONFIGS_SCHEMA_VERSION` from `1.0.0` to `2.0.0`
- Added `DiscussModeSchema` enum (3 values)
- Added `WorkflowConfigSchema` with 13 toggles (`research`, `plan_check`, `verifier`, `discuss_mode`, `use_worktrees`, etc.)
- Added execution fields: `parallelization`, `atomic_commit`, `commit_docs` (all default `true`)
- Renamed all field keys from camelCase to snake_case (`conversationLanguage` → `conversation_language`, `documentsLanguage` → `documents_and_artifacts_language`, etc.)
- Added `LEGACY_KEY_MAP` and `migrateKeys()` for backward-compatible reading of old camelCase configs

**Zod v4 adaptation:**
- Used factory default pattern (`WorkflowConfigInnerSchema.default(() => WorkflowConfigInnerSchema.parse({}))`) because Zod v4 `.default({})` requires the full resolved type, not an empty object when inner fields have individual defaults

**Test coverage:**
- 44 tests (up from 28): +16 new test cases covering workflow toggles, execution fields, discuss mode, legacy key migration, and backward compatibility

**Files modified:** 4 | **Commit:** `75339362`

## Deviations from Plan

**[Rule 1 - Bug] Zod v4 default type mismatch** — Found during: Task 1 | Issue: `.default({})` on WorkflowConfigSchema fails typecheck in Zod v4 because `{}` doesn't satisfy the resolved output type | Fix: Used inner schema + factory default pattern | Verification: `npm run typecheck` passes | Commit: `75339362`

**Total deviations:** 1 auto-fixed. **Impact:** None — correct Zod v4 pattern applied.

## Self-Check: PASSED

- [x] HivemindConfigsSchema includes workflow object with 13 toggles matching skeleton v2 §9.1
- [x] Top-level parallelization, atomic_commit, commit_docs fields exist with correct defaults
- [x] All field names use snake_case matching skeleton v2 §9.1
- [x] Existing 5-field configs.json parses correctly under expanded schema (backward compatible)
- [x] Invalid enum values rejected for mode, user_expert_level, discuss_mode
- [x] All new types exported: WorkflowConfigSchema, WorkflowConfig, DiscussModeSchema, DiscussMode
- [x] Schema version bumped to 2.0.0
- [x] Test count increased by 16 new test cases (28 → 44)
- [x] Full test suite passes with 0 regressions (2 pre-existing session-journal failures)
- [x] Module stays at 385 LOC (under 500 limit)
