# Quality Scan — 2026-04-11

**Scan Date:** 2026-04-11
**Scope:** Post-Phases 08, 09, 09.1, 09.2 codebase
**TypeScript:** `tsc --noEmit` — ✅ **PASS** (zero errors)
**Tests:** 608 passed, 1 skipped, 40 files — ✅ **PASS**

---

## 1. Test Coverage Gap Analysis

### Files with NO test coverage (zero indirect coverage)

| File | LOC | Risk | Notes |
|------|-----|------|-------|
| `src/lib/continuity-normalizers.ts` | 706 | **HIGH** | 29 functions, 706 LOC — largest untested file. All normalizer functions (`normalizePermissionRule`, `normalizeContinuityRecord`, etc.) exercise only via `continuity.ts` read path with no assertions on normalization behavior. |
| `src/lib/lifecycle-queue.ts` | 139 | **MEDIUM** | Queue management (`enqueueWaitingLifecycle`, `acquireLifecycleQueue`) called by lifecycle-manager but queue mechanics never directly verified. |
| `src/lib/lifecycle-tmux-runner.ts` | 264 | **HIGH** | tmux execution path (`runLifecycleTmuxTask`) — complex async flow with notification delivery, no tests at all. |
| `src/lib/pending-notifications.ts` | 79 | **MEDIUM** | Notification persistence functions called in production path but never directly tested. |
| `src/lib/runtime.ts` | 69 | **LOW** | Small utility (`inferContinuityStatusFromEvent`), indirectly exercised through lifecycle-manager tests. |
| `src/lib/specialist-router.ts` | 179 | **LOW** | Has `tests/lib/specialist-routing.test.ts` (4 tests) — light coverage but exists. |

### Indirect coverage (tested via integration tests)
- `src/lib/continuity.ts` — 4 tests, but normalizer layer sits unverified
- `src/lib/lifecycle-manager.ts` — 19 tests, covers happy path + some error branches
- `src/lib/lifecycle-process-runner.ts` — 3 tests only (minimal for 456 LOC)

### Coverage by area

| Area | Files | Test Files | Test Count | Status |
|------|-------|------------|------------|--------|
| `src/lib/` (core) | 31 | 24 | ~380 | Mostly covered |
| `src/tools/` | 5 | 4 | ~55 | Well covered |
| `src/hooks/` | 4 (+ types) | 3 | ~42 | Well covered |
| `src/schema-kernel/` | 1 (+ index) | 1 | 46 | Excellent |
| `src/shared/` | 2 | 0 | 0 | **No tests** (small files) |
| Integration | — | 2 | 18 | Good e2e coverage |

**Note:** `@vitest/coverage-v8` not installed — no line-level coverage percentages available. Gap analysis above based on import/reachability.

---

## 2. TypeScript Strict Mode Compliance

### `any` type usage
**Result: ✅ CLEAN** — zero instances of `any`, `as any`, `Record<string, any>` in entire `src/`.

### Unused locals / parameters
**Result: ✅ CLEAN** — `tsc --noEmit` passes with `noUnusedLocals: true` and `noUnusedParameters: true`.

### `verbatimModuleSyntax` compliance
**Result: ⚠️ PARTIAL** — 63 `import type` statements found vs 107 regular `import { }` statements. Several imports mix types and values in the same import clause without using `import type`. Examples:

```typescript
// src/lib/lifecycle-manager.ts:1 — mixes class (value) with types
import { buildDelegationQueueKey, DelegationConcurrencyQueue, reserveSubagentSpawn } from "./concurrency.js"
// DelegationConcurrencyQueue is a class (value) — this is correct

// src/lib/lifecycle-manager.ts:17 — only imports a function
import { resolveLifecycleConcurrency } from "./lifecycle-runtime-policy.js"
// This is fine — runtime import
```

No violations detected (tsc would catch these under `verbatimModuleSyntax`), but the codebase does **not** aggressively use `import type` for type-only imports — relies on compiler to inline.

### Implicit any
**Result: ✅ CLEAN** — `noImplicitAny` is enforced by `strict: true` and build passes.

---

## 3. Error Handling Patterns

### `[Harness]` prefix compliance

**Total `throw new Error` calls:** 53
**With `[Harness]` prefix:** 48 (90.6%)
**Without `[Harness]` prefix:** 5 (9.4%)

### Errors MISSING prefix (violations)

| File | Line | Error Message | Fix |
|------|------|---------------|-----|
| `src/lib/lifecycle-tmux-runner.ts` | 212 | `throw new Error(finalized.error)` | Prefix with `[Harness] ` or use a dedicated error class |
| `src/lib/lifecycle-tmux-runner.ts` | 258 | `throw new Error(finalized.error)` | Same as above |
| `src/lib/lifecycle-process-runner.ts` | 203 | `throw new Error(finalized.error)` | Same as above |
| `src/lib/lifecycle-process-runner.ts` | 264 | `throw new Error(finalized.error)` | Same as above |
| `src/lib/helpers.ts` | 25 | `throw new Error(message)` | `unwrapData` re-throws SDK errors — should prefix |

### Swallowed errors
**Result: ✅ CLEAN** — no empty catch blocks found. All `catch` blocks extract message and propagate or log.

### Error propagation pattern
The runner files (`lifecycle-tmux-runner.ts`, `lifecycle-process-runner.ts`) re-throw `finalized.error` as a plain string — this loses stack trace context. Consider:
```typescript
throw new Error(`[Harness] ${finalized.error}`)
```

---

## 4. Naming Conventions

### File naming
**Pattern:** kebab-case ✅
```
lifecycle-manager.ts, continuity-normalizers.ts, delegate-task.ts, background-manager.ts
```
All files follow kebab-case consistently.

### Directory naming
**Pattern:** kebab-case ✅
```
src/lib/, src/tools/, src/hooks/, src/shared/, src/schema-kernel/
```

### Export naming
**Pattern:** camelCase for functions, PascalCase for types/classes ✅
```typescript
export function createDelegationPacket(...)   // ✅ camelCase
export class BackgroundManager               // ✅ PascalCase
export type SessionContinuityRecord          // ✅ PascalCase
export const VALID_AGENTS                    // ✅ UPPER_SNAKE (constants)
```

### Constant naming
**Result: ✅ CONSISTENT** — all constants use UPPER_SNAKE_CASE:
```
MAX_DESCENDANTS_PER_ROOT, VALID_AGENTS, VALID_DELEGATION_CATEGORIES,
VALID_TASK_STATUSES, VALID_TRANSITIONS, DEFAULT_CONCURRENCY_LIMIT,
DEFAULT_RUNTIME_POLICY, DEFAULT_ALLOWED_COMMANDS, CATEGORY_DEFAULTS,
INJECTION_CANDIDATE_IDS
```

### Internal helper naming
One inconsistency: `src/lib/continuity-normalizers.ts` defines private helpers on single lines:
```typescript
function isRecord(value: unknown): value is Record<string, unknown> { return ... }
function asString(value: unknown): string | undefined { return ... }
```
These shadow identically-named functions in `src/lib/helpers.ts` (`isObject`, `asString`, `getNestedValue`). No actual conflict (different scopes) but **duplication** exists.

---

## 5. Dead Code Detection

### Exports with no importers (confirmed dead)

| Export | File | Used? | Recommendation |
|--------|------|-------|----------------|
| `getPromptToolCompatibility` | `src/lib/helpers.ts:37` | ❌ Never imported | **Remove** — dead code |
| `getContinuityStoragePath` | `src/lib/continuity.ts:288` | ❌ Never imported in `src/` | Only used by tests — keep or move to test utils |
| `getDelegationExportPolicy` | `src/lib/continuity.ts:292` | ❌ Never imported in `src/` | **Remove** or wire into execution path |

### Deprecated code

| Location | Code | Status |
|----------|------|--------|
| `src/lib/lifecycle-background-observer.ts:113` | `completionDetector` parameter | `@deprecated` — kept for backward compat. Safe to remove once migration complete. |

### Duplication detected

| Duplicated Code | Files | Description |
|-----------------|-------|-------------|
| `isRecord` / `isObject` | `continuity-normalizers.ts`, `helpers.ts` | Identical type guard — `helpers.ts` exports `isObject`, normalizers define `isRecord` (same logic) |
| `asString` | `continuity-normalizers.ts`, `helpers.ts` | Identical function defined twice |
| Error re-throw pattern | `lifecycle-tmux-runner.ts:212,258`, `lifecycle-process-runner.ts:203,264` | Same `throw new Error(finalized.error)` pattern duplicated 4× |

---

## 6. Complexity Hotspots

### Files exceeding 350 LOC target

| File | LOC | Functions | Complexity Assessment |
|------|-----|-----------|----------------------|
| `src/lib/lifecycle-manager.ts` | **734** | 5 | **CRITICAL** — 2× over target. Class `HarnessLifecycleManager` contains massive method bodies. Needs extraction. |
| `src/lib/continuity-normalizers.ts` | **706** | 29 | **HIGH** — 29 normalizer functions. Many are small but file is bloated by volume. |
| `src/lib/lifecycle-process-runner.ts` | **456** | 7 | **MEDIUM** — complex async flows with nested callbacks. |
| `src/hooks/create-session-hooks.ts` | **364** | 7 | **MEDIUM** — close to limit, hook creation logic is dense. |
| `src/tools/delegate-task.ts` | **359** | 7 | **MEDIUM** — permission logic + delegation flow in single file. |
| `src/lib/background-manager.ts` | **352** | 1 (class) | **MEDIUM** — single large class, manageable but should target <300. |

### Deeply nested conditionals

The runner files contain 4-5 levels of nesting in their promise chains:

```typescript
// lifecycle-process-runner.ts — nesting example:
// .then() → .then() → if () → if () → .then() → if ()
```

`lifecycle-manager.ts` `executeLifecycleTask` method has deeply nested switch/if branches for execution mode routing (tmux vs builtin vs subsession).

### Cognitive complexity drivers

- **`lifecycle-manager.ts`** — `executeLifecycleTask` method routes between 3 execution modes, each with their own lifecycle, notification, and error handling paths.
- **`continuity-normalizers.ts`** — 29 normalization functions, each with their own validation branches.
- **`delegate-task.ts`** — permission resolution, category routing, model selection, and delegation chaining in one tool factory.

---

## 7. Test Quality Assessment

### Tests that verify behavior (good) ✅
- `tests/lib/delegation-packet.test.ts` — 44 tests, validates round-trip serialization, parent chain building, artifact tracking
- `tests/lib/helpers.test.ts` — 55 tests, comprehensive utility coverage
- `tests/lib/completion-detector.test.ts` — 24 tests + 11 crash tests, covers edge cases
- `tests/schema-kernel/prompt-enhance.schema.test.ts` — 46 tests, validates all Zod schemas
- `tests/lib/background-manager-harden.test.ts` — 898 LOC, stress tests edge cases
- `tests/integration/v3-e2e.test.ts` — 658 LOC, full delegation lifecycle

### Tests that verify implementation details (concern) ⚠️
- `tests/lib/lifecycle-manager.test.ts` — 19 tests for 734 LOC file (ratio: 1 test per 38 LOC). Tests mock heavily and verify internal state transitions rather than observable behavior.
- `tests/lib/concurrency.test.ts` — 24 tests for keyed semaphore — good but focuses on internal queue mechanics.

### Test patterns observed

**Framework:** vitest (globals: true)
**Structure:**
```typescript
describe("feature name", () => {
  beforeEach(() => { /* setup */ })
  it("does specific behavior", () => { /* assertions */ })
})
```

**Mocking:** Heavy use of `vi.fn()` for dependency injection. Test helpers in `tests/lib/helpers/in-memory-client.ts`.

**Skipped tests:** 1 test in `tests/plugins/prompt-enhance-compaction.test.ts` (entire file skipped) — should be re-enabled or removed.

### Test-to-source LOC ratio

| Metric | Count |
|--------|-------|
| Source LOC (`src/`) | 8,785 |
| Test LOC (`tests/`) | 12,311 |
| Ratio | **1.4:1** (tests > source) ✅ |

---

## 8. LOC Per File — Exceeding 350 Target

### Critical (over 500 LOC)

| File | LOC | Over by |
|------|-----|---------|
| `src/lib/lifecycle-manager.ts` | 734 | +384 |
| `src/lib/continuity-normalizers.ts` | 706 | +356 |

### Warning (350–500 LOC)

| File | LOC | Over by |
|------|-----|---------|
| `src/lib/lifecycle-process-runner.ts` | 456 | +106 |
| `src/hooks/create-session-hooks.ts` | 364 | +14 |
| `src/tools/delegate-task.ts` | 359 | +9 |
| `src/lib/background-manager.ts` | 352 | +2 |

### Full distribution

| Range | File Count | Files |
|-------|------------|-------|
| 0–100 | 13 | `task-status`, `tool-helpers`, `types` (partial), hooks `types`, schema-kernel `index`, etc. |
| 101–200 | 8 | `helpers`, `categories`, `messages-transform`, `runtime`, `notification-handler`, `compaction-checkpoint`, `session-api`, `execution-mode` |
| 201–350 | 12 | `state`, `delegation-packet`, `concurrency`, `continuity`, `governance-engine`, `injection-engine`, `session-recovery`, `specialist-router`, `runtime-policy`, `lifecycle-state`, `lifecycle-queue`, `lifecycle-runtime-policy`, `continuity-clone`, `lifecycle-background-observer`, `create-tool-guard-hooks`, `create-core-hooks` |
| 351–500 | 4 | `lifecycle-process-runner`, `create-session-hooks`, `delegate-task`, `background-manager` |
| 501+ | 2 | `lifecycle-manager`, `continuity-normalizers` |

---

## Summary & Priority Actions

### Immediate (blockers)
1. **Add `[Harness]` prefix** to 5 error throws in `lifecycle-tmux-runner.ts`, `lifecycle-process-runner.ts`, and `helpers.ts`
2. **Remove dead export** `getPromptToolCompatibility` from `src/lib/helpers.ts`

### High priority
3. **Write tests** for `continuity-normalizers.ts` (706 LOC, 0 tests) — highest risk untested surface
4. **Write tests** for `lifecycle-tmux-runner.ts` (264 LOC, 0 tests) — critical execution path
5. **Split `lifecycle-manager.ts`** — 734 LOC is unmanageable. Extract execution mode routing into separate module.

### Medium priority
6. **Deduplicate** `isRecord`/`isObject` and `asString` between `continuity-normalizers.ts` and `helpers.ts`
7. **Write tests** for `lifecycle-queue.ts` and `pending-notifications.ts`
8. **Re-enable or remove** skipped test in `tests/plugins/prompt-enhance-compaction.test.ts`
9. **Install `@vitest/coverage-v8`** — coverage reporting is blind without it

### Low priority
10. **Convert mixed imports to `import type`** where only types are imported — improves tree-shaking clarity
11. **Reduce `continuity-normalizers.ts`** from 706 → ~400 LOC by grouping related normalizers

---

*Quality scan: 2026-04-11 | 53 source files | 42 test files | 608 tests passing*
