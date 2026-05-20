---
phase: 19-non-destructive-remediation
plans:
  - 19-01: Schema barrel cleanup
  - 19-02: Dead module deletions
  - 19-03: Code inlines + hook cleanup
status: COMPLETE
date: 2026-05-21
metrics:
  seconds: 0
  tasks: 8
  files_created: 1
  files_deleted: 12
  files_edited: 10
  loc_added: 81
  loc_deleted: 935
  net_loc: -854

---

# Phase 19: Non-Destructive Remediation — Summary

## One-line

Deleted ~850 LOC of dead/wrapper code across 8 source files, 5 test files, inlined 1 wrapper, removed 1 no-op hook, and preserved 2 prompt-packet files that have active consumers.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Miss] skill-metadata.schema.ts has real consumers — cannot delete**
- **Found during:** Plan 19-01 Task 2
- **Issue:** Research incorrectly flagged skill-metadata.schema.ts as dead. The `SkillFrontmatterSchema`, `SkillFile`, and `SkillFrontmatter` types are actively consumed by `compiler.ts`, `cross-primitive-validator.ts`, and `primitive-loader.ts` from the barrel.
- **Fix:** Restored skill-metadata.schema.ts and its barrel re-exports. The file is NOT dead.
- **Files modified:** src/schema-kernel/skill-metadata.schema.ts (restored), src/schema-kernel/index.ts (re-added re-exports)
- **Commit:** 07be038e

**2. [Rule 3 - Fix] Test file imports from deleted permission schema**
- **Found during:** Plan 19-01 verification
- **Issue:** `tests/schema-kernel/opencode-config.schemas.test.ts` imported `PermissionActionSchema` and other types from the now-deleted permission.schema.ts, causing 20 test failures.
- **Fix:** Removed permission test imports and all 3 permission test blocks (PermissionActionSchema, PermissionRuleSchema, PatternBasedPermissionSchema, PermissionRuleSchemaLenient).
- **Files modified:** tests/schema-kernel/opencode-config.schemas.test.ts
- **Commit:** 07be038e

**3. [Rule 3 - Fix] Test spies on deleted concurrency-key module**
- **Found during:** Plan 19-03 Task 1
- **Issue:** `tests/lib/delegation-manager.test.ts` used `vi.spyOn(spawnerConcurrencyKey, "resolveDelegationConcurrencyKey")` on the now-deleted module.
- **Fix:** Removed the 2 implementation-detail spies (outcome already verified by `acquireSpy` assertions). Changed `import * as spawnerConcurrencyKey` to `import * as concurrencyQueue`.
- **Files modified:** tests/lib/delegation-manager.test.ts
- **Commit:** 9cadbb2b

## Completed Tasks

| Plan | Task | Name | Files |
|------|------|------|-------|
| 19-01 | 1 | Create tool.schema.ts + update barrel | tool.schema.ts (NEW), index.ts (EDIT) |
| 19-01 | 2 | Delete dead schemas + strip barrel | permission.schema.ts (DEL), skill-metadata.schema.ts (restored), tool-definition.schema.ts (DEL), index.ts (EDIT), opencode-config.schemas.test.ts (EDIT) |
| 19-02 | 1 | Delete session-classification-hook + test | session-classification-hook.ts (DEL), its test (DEL) |
| 19-02 | 2 | Delete schema-normalizer + test | schema-normalizer.ts (DEL), its test (DEL) |
| 19-02 | 3 | Delete prompt-packet partial (delegation-packet + index + tests) | delegation-packet.ts (DEL), index.ts (DEL), AGENTS.md (DEL), 2 test files (DEL) |
| 19-03 | 1 | Inline concurrency-key wrapper | concurrency-key.ts (DEL), manager-runtime.ts (EDIT), delegation-manager.test.ts (EDIT) |
| 19-03 | 2 | Delete deprecated profile methods | resolve-behavioral-profile.ts (EDIT), index.ts (EDIT), test (EDIT) |
| 19-03 | 3 | Remove messages.transform no-op hook | core-hooks.ts (EDIT) |

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Kept skill-metadata.schema.ts | Has 3 runtime consumers (compiler.ts, cross-primitive-validator.ts, primitive-loader.ts) |
| Kept system.transform in core-hooks.ts | Test file has 4+ test cases using it; SDK only dispatches experimental.chat.system.transform |
| Kept compaction-preservation.ts + kernel-packet.ts | Both actively imported by session-hooks.ts for compaction preservation |
| Option B for system.transform | Safer than removing + updating tests; negligible maintenance burden |

## Scope Remaining

The following items from the ROADMAP are NOT yet complete and are deferred to subsequent plans:
- **19-04:** Delete empty dirs (src/kernel/, src/harness/), rebuild dist/, sync ROADMAP + STATE

## Stub Tracking

No stubs found — this plan only deleted dead code and inlined wrappers. All remaining code is actively consumed.

## Threat Flags

None — zero security-relevant surface introduced or modified.

## Self-Check: PASSED

- Typecheck: clean (exit 0)
- Schema-kernel tests: 116 passed
- Cross-primitive-validator tests: 17 passed
- Delegation-manager tests: 121 passed
- Behavioral-profile tests: 48 passed
- Core-hooks tests: 45 passed
- Prompt-packet tests (preserved): 8 passed
- Total: 7 test files, 355 tests, 0 failures
- Dead code `rg` verification: all zero hits
- 12 source/test files deleted, 1 file created, 10 files edited
