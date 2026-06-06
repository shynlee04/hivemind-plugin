# C8 Foundation — Execution PLAN.md

**Created:** 2026-06-07
**Cluster:** C8 — Foundation
**Phase:** AUDIT-04 (Legacy Phase Audit)
**Remaining Phases:** 35, SR-00/SR-04, 34

---

## Plan 1: Phase 35 — Dead Code Cleanup

**SPEC Reference:** REQ-35, AC-35-1 through AC-35-7
**Depends On:** SR-01 (COMPLETE)
**Effort:** 1-2 hours
**Wave:** 1

### Dead Type Verification Results

| Type | Status | Evidence |
|------|--------|----------|
| SessionPromptParams | ✅ DEAD | Zero imports outside types.ts |
| SessionToolProfile | ✅ DEAD | Zero imports outside types.ts |
| SessionBudgetOverride | ✅ DEAD | Zero imports outside types.ts |
| SessionConcurrencyOverride | ✅ DEAD | Zero imports outside types.ts |
| HarnessStatus | ✅ DEAD | Zero imports outside types.ts |
| DelegationPacketStatus | ✅ DEAD | Zero imports outside types.ts |
| LoopWindow | ✅ DEAD | Zero imports outside types.ts |
| ToolCallSummary | ✅ DEAD | Zero imports outside types.ts |
| CapturedResult | ⚠️ **NOT DEAD** | Used in `src/task-management/continuity/index.ts` (lines 8, 135, 153, 194, 405) |
| PermissionAction | ✅ DEAD | Zero imports outside types.ts |
| SessionStatusType | ✅ DEAD | Zero imports outside types.ts |
| DelegationPacket | ⚠️ **NOT DEAD** | Used in `src/task-management/continuity/index.ts` (lines 12, 110, 155, 196, 395) |

**⚠️ DISCREPANCY:** SPEC lists `CapturedResult` and `DelegationPacket` as dead, but both are actively used in `src/task-management/continuity/index.ts`. These types must NOT be removed — doing so will break the build.

### task-status.ts Verification

- `src/shared/task-status.ts` (22 LOC) exports: `VALID_TASK_STATUSES`, `VALID_TRANSITIONS`, `canTransition`, `isTerminal`
- References in other files are **comments only** (not imports):
  - `src/config/workflow/workflow-state.ts:5` — comment mentioning pattern
  - `src/schema-kernel/hivemind-configs.schema.ts:141` — `@future-consumer` annotation
- `src/index.ts:12` — wildcard re-export (`export * from "./shared/task-status.js"`)
- Other files have their OWN `isTerminal` implementations (not imports from task-status.ts)
- **Verdict:** ✅ DEAD — safe to remove

### Steps

1. **Verify dead types (already done above):**
   - 10 confirmed dead, 2 NOT dead (CapturedResult, DelegationPacket)
   - Remove only the 10 confirmed dead types

2. **Remove 10 dead types from `src/shared/types.ts`:**
   - SessionPromptParams
   - SessionToolProfile
   - SessionBudgetOverride
   - SessionConcurrencyOverride
   - HarnessStatus
   - DelegationPacketStatus
   - LoopWindow
   - ToolCallSummary
   - PermissionAction
   - SessionStatusType

3. **Keep `CapturedResult` and `DelegationPacket`** — they are actively used in continuity module

4. **Delete `src/shared/task-status.ts`**

5. **Update `src/index.ts`:**
   - Remove line: `export * from "./shared/task-status.js"`

6. **Delete `tests/lib/task-status.test.ts`** if it exists

7. **Verify:**
   ```bash
   npm run typecheck    # MUST PASS
   npm test             # ALL PASS
   npm run build        # PASS
   npm pack --dry-run   # No consumer breakage
   ```

8. **Commit:**
   ```
   refactor(C8/35): remove 10 dead types + task-status.ts

   - Removed 10 dead types from src/shared/types.ts
   - Deleted src/shared/task-status.ts (22 LOC, zero runtime consumers)
   - Updated src/index.ts to remove task-status re-export
   - Kept CapturedResult and DelegationPacket (actively used in continuity)
   ```

### Acceptance Criteria

| AC | Criterion | Verification |
|----|-----------|--------------|
| AC-35-1 | All dead types removed from types.ts | `grep -c "SessionPromptParams\|..." src/shared/types.ts` → 0 |
| AC-35-2 | task-status.ts deleted | `ls src/shared/task-status.ts` → "No such file" |
| AC-35-3 | index.ts no longer exports task-status | `grep "task-status" src/index.ts` → 0 results |
| AC-35-4 | task-status test deleted | `ls tests/lib/task-status.test.ts` → "No such file" |
| AC-35-5 | All tests pass | `npm test` → ALL PASS |
| AC-35-6 | Typecheck passes | `npm run typecheck` → PASS |
| AC-35-7 | No npm consumer breakage | `npm pack --dry-run` → PASS |

### Notes

- SPEC lists 12 types but only 10 are actually dead
- `CapturedResult` and `DelegationPacket` must be preserved (used in `src/task-management/continuity/index.ts`)
- `task-status.ts` exports are never imported by any runtime module — safe to delete
- Other modules have their own `isTerminal` implementations (not related to task-status.ts)

---

## Plan 2: SR-00/SR-04 — Archive (No-Op)

**SPEC Reference:** REQ-SR00, REQ-SR04
**Depends On:** None
**Effort:** 0
**Wave:** 1 (parallel with Plan 1)

### Steps

1. **Update SPEC.md:**
   - Mark SR-00 as ARCHIVED with note: "No changes needed. Sub-requirement already complete or no longer relevant."
   - Mark SR-04 as ARCHIVED with note: "No changes needed. Sub-requirement already complete or no longer relevant."

2. **No code changes required**

### Acceptance Criteria

| AC | Criterion | Verification |
|----|-----------|--------------|
| — | SPEC.md updated | `grep "ARCHIVED" SPEC.md` → 2 results |
| — | No code changes | `git diff src/` → empty |

---

## Plan 3: Phase 34 — Typed Errors + HarnessError + TUI-Safe Logging

**SPEC Reference:** REQ-34A, REQ-34B, REQ-34C
**Depends On:** Phase 33 (COMPLETE), Phase 35 (Plan 1)
**Effort:** 3-4 hours
**Wave:** 2

### Unprefixed Throw Count

```
grep -rn "throw new Error(" src/ --include="*.ts" | grep -v "\[Harness\]" | wc -l
→ 56
```

**Matches SPEC estimate.** All 56 sites need `[Harness]` prefix.

### Sub-plan 3A: HarnessError Base Class

**SPEC:** REQ-34A, AC-34A-1 through AC-34A-4

**Files to create/modify:**
- CREATE: `src/shared/errors/harness-error.ts`
- MODIFY: `src/shared/errors/commands.ts`

**Steps:**

1. **Create `src/shared/errors/harness-error.ts`:**
   ```typescript
   export class HarnessError extends Error {
     readonly code: string
     readonly cluster: string
     readonly module: string

     constructor(params: { code: string; cluster: string; module: string; message: string }) {
       super(`[Harness] ${params.message}`)
       this.code = params.code
       this.cluster = params.cluster
       this.module = params.module
       this.name = "HarnessError"
     }
   }
   ```

2. **Update `src/shared/errors/commands.ts`:**
   - Import `HarnessError` from `./harness-error.js`
   - Change `CommandNotFoundError` to extend `HarnessError` instead of `Error`
   - Add `code`, `cluster`, `module` properties
   - Keep `[Harness]` prefix in message (inherited from base class)

3. **Verify:**
   ```bash
   npm run typecheck    # MUST PASS
   npm test             # ALL PASS
   ```

### Sub-plan 3B: Error Prefix Audit

**SPEC:** REQ-34B, AC-34B-1 through AC-34B-2

**Files to modify:** All `src/**/*.ts` files with unprefixed `throw new Error(`

**Steps:**

1. **Grep all unprefixed throws:**
   ```bash
   grep -rn "throw new Error(" src/ --include="*.ts" | grep -v "\[Harness\]"
   ```

2. **For each site, add `[Harness]` prefix and cluster identifier:**
   - Example: `throw new Error("Session not found")` → `throw new Error("[Harness/C8] Session not found")`
   - Cluster identifiers: C1 (governance), C2 (task-mgmt), C3 (coordination), C4 (hooks), C5 (tools), C7 (sidecar), C8 (shared)

3. **Batch approach:**
   - Group by file
   - Update each file atomically
   - Run typecheck after each file to catch issues early

4. **Verify:**
   ```bash
   grep -rn "throw new Error(" src/ --include="*.ts" | grep -v "\[Harness\]" | wc -l
   # MUST return 0
   npm run typecheck
   npm test
   ```

### Sub-plan 3C: TUI-Safe Error Suppression

**SPEC:** REQ-34C, AC-34C-1 through AC-34C-3

**Files to modify:** TUI error handling code (likely in `src/tools/` or `src/hooks/`)

**Steps:**

1. **Identify TUI error display code:**
   ```bash
   grep -rn "toast\|showError\|displayError" src/ --include="*.ts"
   ```

2. **Add suppression logic:**
   - If error message starts with `[Harness]` → suppress from TUI toast
   - Log via `client.app.log` instead
   - User-facing errors (from agent prompts) → still show in TUI

3. **Pattern:**
   ```typescript
   // In TUI error handler
   if (error.message.startsWith("[Harness]")) {
     // Internal harness error — log only, don't show in TUI
     client.app.log("error", error.message)
   } else {
     // User-facing error — show in TUI toast
     showToast(error.message)
   }
   ```

4. **Verify:**
   - Manual test: Trigger a harness error → should NOT appear in TUI
   - Manual test: Trigger a user error → should appear in TUI
   - `npm test` → ALL PASS

### Acceptance Criteria

| AC | Criterion | Verification |
|----|-----------|--------------|
| AC-34A-1 | HarnessError class exists | `ls src/shared/errors/harness-error.ts` |
| AC-34A-2 | All properties readonly | Code review |
| AC-34A-3 | Auto [Harness] prefix | Test: `new HarnessError({...}).message` starts with `[Harness]` |
| AC-34A-4 | commands.ts extends HarnessError | `grep "extends HarnessError" src/shared/errors/commands.ts` |
| AC-34B-1 | Zero unprefixed throws | `grep -rn "throw new Error(" src/ | grep -v "\[Harness\]"` → 0 |
| AC-34B-2 | All messages include cluster | Code review of updated throws |
| AC-34C-1 | [Harness] errors suppressed from TUI | Manual test |
| AC-34C-2 | User errors still show in TUI | Manual test |
| AC-34C-3 | Harness errors logged via app.log | Code review |

### Final Verification

```bash
npm run typecheck    # MUST PASS
npm test             # ALL PASS
npm run build        # PASS
```

### Commit

```
feat(C8/34): HarnessError base class + [Harness] prefix + TUI-safe suppression

- Created HarnessError base class with code, cluster, module properties
- Updated commands.ts to extend HarnessError
- Added [Harness] prefix to all 56 unprefixed throw sites
- Implemented TUI-safe error suppression for harness errors
```

---

## Dependencies

```
Plan 1 (Phase 35) ──→ Plan 3 (Phase 34)
Plan 2 (SR-00/SR-04) ──→ No dependencies (parallel with Plan 1)
```

**Execution order:**
1. Plan 1 + Plan 2 (parallel, Wave 1)
2. Plan 3 (Wave 2, after Plan 1 completes)

## Effort Estimate

| Plan | Phase | Effort | Context Cost |
|------|-------|--------|--------------|
| 1 | 35 | 1-2 hr | ~20% (type removal + verify) |
| 2 | SR-00/SR-04 | 0 | ~5% (SPEC update only) |
| 3 | 34 | 3-4 hr | ~40% (HarnessError + 56 sites + TUI) |
| **Total** | | **4-6 hr** | **~65%** |

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Removing CapturedResult/DelegationPacket breaks build | HIGH | HIGH | Already verified — these are NOT dead, must keep |
| Error prefix changes break error handling | Low | Medium | Grep verification + test run |
| TUI suppression hides user-facing errors | Low | Medium | Manual verification + code review |
| 56 throw sites too many for single pass | Medium | Low | Batch by file, typecheck after each |

---

*C8 Foundation PLAN.md — 2026-06-07*
