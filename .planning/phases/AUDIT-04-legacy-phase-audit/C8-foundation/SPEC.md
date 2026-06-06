# C8 Foundation — Specification Document

**Analysis Date:** 2026-06-06
**Cluster:** C8 — Foundation
**Phase:** AUDIT-04 (Legacy Phase Audit)

---

## 1. Requirements by Locked Decision

### REQ-33: plugin.ts Split

**Source:** Locked decision #4

**Requirement:** Split `src/plugin.ts` (1,076 LOC) into 3 files by concern:

| File | Responsibility | Target LOC |
|------|---------------|------------|
| `src/plugin.ts` | Composition root: `HarnessControlPlane` factory + `setupDelegationModules` | ~200 |
| `src/plugin-registration.ts` | 4 `register*Tools()` functions | ~600 |
| `src/one-shot-migrations.ts` | 2 legacy migration functions | ~276 |

**Acceptance Criteria:**
- [ ] AC-33-1: `src/plugin.ts` ≤ 500 LOC after split
- [ ] AC-33-2: `src/plugin-registration.ts` exports `registerDelegationTools`, `registerSessionTools`, `registerHivemindTools`, `registerConfigTools`
- [ ] AC-33-3: `src/one-shot-migrations.ts` exports `migrateLegacyEventTracker`, `migrateLegacyDelegationsJson`
- [ ] AC-33-4: All existing tests pass after split (`npm test`)
- [ ] AC-33-5: `npm run typecheck` passes
- [ ] AC-33-6: No circular dependencies introduced between the 3 files
- [ ] AC-33-7: `src/index.ts` public API unchanged (no new exports, no removed exports)

**Verification Method:**
```bash
wc -l src/plugin.ts src/plugin-registration.ts src/one-shot-migrations.ts
npm run typecheck
npm test
```

**Success Metrics:**
- `plugin.ts` reduced from 1,076 to ≤ 500 LOC
- Zero test regressions
- Zero type errors

---

### REQ-SR01: session-api Coupling Extraction

**Source:** Locked decision #5

**Requirement:** Remove `getSessionBehavioralProfile()` from `src/shared/session-api.ts`. Have C4's `core-hooks.ts` import `resolveBehavioralProfile` directly from C1 routing.

**Acceptance Criteria:**
- [ ] AC-SR01-1: `getSessionBehavioralProfile` removed from `src/shared/session-api.ts`
- [ ] AC-SR01-2: Import of `resolveBehavioralProfile` removed from `src/shared/session-api.ts`
- [ ] AC-SR01-3: Import of `ResolvedBehavioralProfile` type removed from `src/shared/session-api.ts`
- [ ] AC-SR01-4: C4's `core-hooks.ts` imports `resolveBehavioralProfile` directly from C1 routing
- [ ] AC-SR01-5: `session-api.ts` has zero cross-cluster imports (leaf-only)
- [ ] AC-SR01-6: All existing tests pass
- [ ] AC-SR01-7: `npm run typecheck` passes

**Verification Method:**
```bash
grep -n "resolveBehavioralProfile\|ResolvedBehavioralProfile" src/shared/session-api.ts
# Should return zero results
grep -n "resolveBehavioralProfile" src/hooks/lifecycle/core-hooks.ts
# Should show direct import from C1 routing
npm run typecheck
npm test
```

**Success Metrics:**
- `session-api.ts` has zero imports from outside `src/shared/`
- C8 becomes leaf-only (zero outbound cross-cluster imports)

---

### REQ-35: Dead Code Cleanup

**Source:** Locked decision #6

**Requirement:** Remove 12 dead types from `shared/types.ts` and remove `task-status.ts` entirely.

**Dead Types to Remove:**
1. `SessionPromptParams`
2. `SessionToolProfile`
3. `SessionBudgetOverride`
4. `SessionConcurrencyOverride`
5. `HarnessStatus`
6. `DelegationPacketStatus`
7. `LoopWindow`
8. `ToolCallSummary`
9. `CapturedResult`
10. `PermissionAction`
11. `SessionStatusType`
12. `DelegationPacket`

**Acceptance Criteria:**
- [ ] AC-35-1: All 12 dead types removed from `src/shared/types.ts`
- [ ] AC-35-2: `src/shared/task-status.ts` deleted
- [ ] AC-35-3: `src/index.ts` no longer exports from `task-status.ts`
- [ ] AC-35-4: `tests/lib/task-status.test.ts` deleted
- [ ] AC-35-5: All existing tests pass (excluding removed test file)
- [ ] AC-35-6: `npm run typecheck` passes
- [ ] AC-35-7: No npm consumer breakage (verify with `npm pack --dry-run`)

**Verification Method:**
```bash
# Verify dead types removed
grep -c "SessionPromptParams\|SessionToolProfile\|SessionBudgetOverride\|SessionConcurrencyOverride\|HarnessStatus\|DelegationPacketStatus\|LoopWindow\|ToolCallSummary\|CapturedResult\|PermissionAction\|SessionStatusType\|DelegationPacket" src/shared/types.ts
# Should return 0

# Verify task-status.ts removed
ls src/shared/task-status.ts 2>&1
# Should show "No such file"

npm run typecheck
npm test
```

**Success Metrics:**
- `types.ts` reduced by ~80 LOC
- `task-status.ts` (22 LOC) removed
- Zero test regressions
- Zero type errors

---

### REQ-34: Async I/O + Typed Errors

**Source:** Locked decision #9

**Requirement:** Implement typed errors with `[Harness]` prefix and TUI-safe suppression.

**Sub-requirements:**

#### REQ-34A: HarnessError Base Class

Create `src/shared/errors/harness-error.ts` with:
- `HarnessError` base class extending `Error`
- Properties: `code: string`, `cluster: string`, `module: string`
- `[Harness]` prefix on all error messages

**Acceptance Criteria:**
- [ ] AC-34A-1: `HarnessError` class exists at `src/shared/errors/harness-error.ts`
- [ ] AC-34A-2: All properties (`code`, `cluster`, `module`) are readonly
- [ ] AC-34A-3: Error message automatically prefixed with `[Harness]`
- [ ] AC-34A-4: Existing error classes in `src/shared/errors/commands.ts` extend `HarnessError`

#### REQ-34B: Error Prefix Audit

Add `[Harness]` prefix to all 56 unprefixed `throw new Error(...)` sites.

**Acceptance Criteria:**
- [ ] AC-34B-1: Zero `throw new Error(...)` sites without `[Harness]` prefix in `src/`
- [ ] AC-34B-2: All error messages include cluster identifier

#### REQ-34C: TUI-Safe Error Suppression

Suppress internal harness errors from appearing in TUI toast notifications.

**Acceptance Criteria:**
- [ ] AC-34C-1: Errors with `[Harness]` prefix are not shown in TUI toast
- [ ] AC-34C-2: User-facing errors (from agent prompts) still show in TUI
- [ ] AC-34C-3: All harness errors are logged via `client.app.log` instead

**Verification Method:**
```bash
# Verify no unprefixed throws
grep -rn "throw new Error(" src/ --include="*.ts" | grep -v "\[Harness\]" | wc -l
# Should return 0

npm run typecheck
npm test
```

**Success Metrics:**
- `HarnessError` base class created
- 56 error sites updated with `[Harness]` prefix
- TUI suppresses internal errors
- Zero test regressions

---

### REQ-SR00: Archive (No-Op)

**Source:** Locked decision #7

**Requirement:** No changes. SR-00 is archived.

---

### REQ-SR04: Archive (No-Op)

**Source:** Locked decision #8

**Requirement:** No changes. SR-04 is archived.

---

### REQ-SR02: Journal Write Path

**Source:** Locked decision #1

**Requirement:** Wire journal write path into the shared layer (~50 lines).

**Acceptance Criteria:**
- [ ] AC-SR02-1: Journal write functions accessible from C8 shared layer
- [ ] AC-SR02-2: ~50 LOC added to shared layer
- [ ] AC-SR02-3: All existing tests pass
- [ ] AC-SR02-4: `npm run typecheck` passes

---

### REQ-SR03: Concurrency Queue (Keep)

**Source:** Locked decision #2

**Requirement:** No changes. Concurrency queue is fully integrated.

---

## 2. Priority Order

| Priority | Phase | Requirement | Effort |
|----------|-------|-------------|--------|
| 1 | 33 | plugin.ts split | 4-6 hr |
| 2 | SR-01 | session-api coupling extraction | 1 hr |
| 3 | 35 | Dead code cleanup | 1-2 hr |
| 4 | SR-00/SR-04 | Archive (no-op) | 0 |
| 5 | 34 | Async I/O + typed errors | 3-4 hr |

**Total estimated effort:** 9-13 hours

---

## 3. Dependency Constraints

### 3.1 Phase Dependencies

| Phase | Depends On | Reason |
|-------|------------|--------|
| 33 | None | Self-contained split |
| SR-01 | None | Self-contained extraction |
| 35 | SR-01 | Dead types may be affected by session-api changes |
| 34 | 33 | Error prefix audit needs stable plugin.ts |

### 3.2 Cross-Cluster Constraints

| Constraint | Impact | Mitigation |
|------------|--------|------------|
| C8 provides 125 imports to all clusters | Any type change cascades | Careful deprecation, explicit re-exports |
| C8 ↔ C3 re-export cycle in types.ts | Fragile coupling | Document as backward-compat bridge |
| C8 → C1 coupling in session-api.ts | Foundation depends on governance | SR-01 removes this |

---

## 4. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| plugin.ts split breaks tool registration | Medium | High | Comprehensive test run after split |
| Dead type removal breaks npm consumers | Low | Medium | `npm pack --dry-run` verification |
| Error prefix changes break error handling | Low | Medium | Grep verification + test run |
| session-api extraction breaks C4 hooks | Low | High | Verify C4 imports directly from C1 |

---

*Specification document: 2026-06-06 — requirements derived from locked C8 decisions*
