# Code Skepticism Report — Plan 6 (Session Writer)

**Scope:** Session Writer implementation for event-tracker feature — session metadata lifecycle, delegation append, injection append.
**Files Examined:**
- `src/features/event-tracker/writers/session-writer.ts` (162 LOC)
- `src/features/event-tracker/session-writer/session-metadata.red.test.ts` (133 LOC)
- `src/features/event-tracker/session-writer/delegation-append.red.test.ts` (107 LOC)
- `src/features/event-tracker/session-writer/injection-append.red.test.ts` (95 LOC)
- `src/features/event-tracker/session-writer/integration-boundary.red.test.ts` (74 LOC)
- `src/features/event-tracker/paths.ts` (86 LOC)
- `src/features/event-tracker/writers/base-writer.ts` (11 LOC)
- `src/features/event-tracker/types.ts` (203 LOC)
**Overall Risk:** LOW

---

## Critical Issues (Must Fix Before Merge)

None found.

## High-Risk Issues (Should Fix Before Merge)

### H1: Plan-Specified Type Placement Not Followed

**Location:** `src/features/event-tracker/writers/session-writer.ts:12-38`
**Plan reference:** `.hivemind/activity/planning/plan-6-revision-1.md` step 1: "Define Session Writer contracts in `types.ts`."

The plan explicitly calls for adding `SessionMetadataInput`, `SessionDelegationAppendInput`, and `SessionInjectionAppendInput` to `types.ts`. The implementation defines these types in `session-writer.ts` instead.

**Risk:** If other modules need to reference these input types (e.g., integration boundary wiring in `events-writer.ts` or `diagnostics-writer.ts`), they would need to import from the writer module rather than the centralized type authority. This creates tighter coupling.

**Mitigating factor:** The current integration boundary test (`integration-boundary.red.test.ts`) constructs the delegation input inline without importing the type, so there is no immediate consumer pressure. However, Plan 6 step 3 ("Integrate Session Writer at writer boundaries") is incomplete — those integration points will likely need these types.

**Severity assessment:** HIGH if integration step proceeds. MEDIUM if types remain session-writer-internal only.

---

## Medium-Risk Issues (Should Address Soon)

### M1: Types Duplicated in Test Files Instead of Imported

**Location:** All 4 test files re-declare input types locally.

- `session-metadata.red.test.ts:9-25` — `SessionMetadataInput`
- `delegation-append.red.test.ts:9-17` — `DelegationAppendInput`
- `injection-append.red.test.ts:9-15` — `InjectionAppendInput`

**Evidence:** The test files declare their own type aliases with identical shapes to the exported types in `session-writer.ts`. While this is valid RED-phase TDD practice (tests written before implementation), the types should be imported from the implementation after GREEN.

**Risk:** If the input type contracts change, the test types drift silently. Tests would pass against stale shapes.

**Recommendation:** After REFACTOR, replace local type declarations with imports from `../writers/session-writer.js`.

### M2: Integration Boundary Test Reads Source File via `process.cwd()`

**Location:** `integration-boundary.red.test.ts:16-19`

```typescript
const source = await readFile(
  join(process.cwd(), 'src/features/event-tracker/writers/session-writer.ts'),
  'utf8',
)
```

**Risk:** This assertion depends on the working directory being the project root. In CI environments or when tests are run from a different directory, this test will fail with a file-not-found error. This is a brittle test pattern.

**Recommendation:** Use `import.meta.url` or a test fixture to resolve the path reliably, or move this assertion into a lint/CI rule rather than a runtime test.

### M3: Classifier Adapter Import May Be Unused for RED Phase

**Location:** `integration-boundary.red.test.ts:7`

```typescript
import { mapEventEntryToSessionEventInput } from '../classifier/writer-adapter.js'
```

This import IS used in the second integration test (line 53). However, the test then constructs the delegation input manually from the adapted output, which means the integration boundary is tested at the *caller* level, not at the *session writer* API level. The session writer doesn't know about `EventEntry` or the classifier adapter — it just takes its own input types.

**Risk:** This is actually correct CQRS separation (writer doesn't classify). But the test name "consumes classifier adapter output" implies the session writer has integration with the classifier, when it's really the caller's responsibility. The test is valid but the framing is misleading.

---

## Observations (Consider Addressing)

### O1: `trimOrFallback` Default Overwrites Legitimate Empty Strings

**Location:** `session-writer.ts:40-42`

```typescript
function trimOrFallback(value: string | undefined, fallback = 'N/A'): string {
  return value?.trim() ? value : fallback
}
```

If a caller intentionally passes `""` or `"   "`, this returns `'N/A'` rather than the empty/fallback. This is likely the desired behavior for display purposes, but there's no contract test verifying that empty-string inputs produce `'N/A'` in the rendered output.

### O2: `readExistingSessionMetadata` Swallows All Errors

**Location:** `session-writer.ts:65-72`

The `catch` block returns `null` for any error — including `SyntaxError` from `JSON.parse` on a corrupted file, `ENOENT` from missing file, or `EACCES` from permission errors. All three are silently treated as "file doesn't exist yet."

**Risk:** A corrupted `session.json` (partial write, disk full) would be silently overwritten without any log or warning. In production, this could mask data corruption.

**Recommendation:** At minimum, log a warning when `JSON.parse` fails on an existing file. Alternatively, distinguish "file not found" from "file corrupt."

### O3: Test Files in Non-Standard Location

**Location:** `src/features/event-tracker/session-writer/*.red.test.ts`

Tests live under `src/` rather than the conventional `tests/` directory. The plan spec specifies the test path as `tests/features/event-tracker/writers/session-writer.test.ts` but the actual implementation places them at `src/features/event-tracker/session-writer/*.red.test.ts`.

**Evidence:** The plan step 4 says "Create: `tests/features/event-tracker/writers/session-writer.test.ts`" — a single file. The implementation uses 4 files in `src/`. This may be an intentional project convention (co-located tests), but it contradicts the plan spec.

### O4: No JSDoc on Internal Helper Functions

**Location:** `session-writer.ts:40-46, 48-63, 65-72, 97-116, 133-147`

The three exported functions have JSDoc (`initOrUpdateSessionMetadata`, `appendSessionDelegationEntry`, `appendSessionInjectionEntry`). The internal helpers (`trimOrFallback`, `trimOrEmpty`, `createInitialSessionMetadata`, `readExistingSessionMetadata`, `renderSessionDelegationBlock`, `renderSessionInjectionBlock`) do not.

**Recommendation:** Add minimal JSDoc to internal helpers for maintainability, especially `readExistingSessionMetadata` which has non-obvious error-swallowing behavior.

---

## Assumptions Challenged

| # | Assumption | Location | Risk if Wrong |
|---|-----------|----------|---------------|
| 1 | `session.json` fits in memory | `session-writer.ts:67` | Very large sessions could OOM; no streaming support |
| 2 | `appendFile` is atomic enough | `base-writer.ts:10` | Concurrent writes could interleave content; no file locking |
| 3 | `sessionId` is filesystem-safe | `paths.ts:6` | Sessions with `/` or `..` in IDs could escape the directory |
| 4 | No concurrent init for same session | `session-writer.ts:79-95` | Two concurrent `initOrUpdateSessionMetadata` calls could race and lose data |

---

## Evidence Collected

### Type-check gate
```
$ npx tsc --noEmit
(exit 0, no errors)
```

### Test suite results
```
session-metadata.red.test.ts:        3/3 pass (449ms)
delegation-append.red.test.ts:       2/2 pass (435ms)
injection-append.red.test.ts:        2/2 pass (429ms)
integration-boundary.red.test.ts:    2/2 pass (386ms)
Total: 9/9 pass, 0 fail
```

### ESM import suffix check
```
$ grep "from '\..*(?<!\.js)'" session-writer.ts + test files
No matches — all imports use .js suffixes. PASS
```

### LOC count
```
session-writer.ts:                  162 LOC  (limit: 300) PASS
session-metadata.red.test.ts:       133 LOC  (limit: 300) PASS
delegation-append.red.test.ts:      107 LOC  (limit: 300) PASS
injection-append.red.test.ts:        95 LOC  (limit: 300) PASS
integration-boundary.red.test.ts:    74 LOC  (limit: 300) PASS
```

### Path authority verification
```
$ grep -c "getSessionMetadataPath\|getSessionDelegationPath\|getSessionInjectionPath" session-writer.ts
3 imports from paths.ts — no duplicate definitions found. PASS
```

### Classification logic scan
```
$ grep -i "classification\|classify\|classifier" session-writer.ts
No matches — writer contains zero classification logic. PASS
```

---

## Verdict

**Status: CONDITIONAL**

The implementation is clean, well-structured, and passes all tests and type-checks. The code correctly:
- Reuses canonical path builders from `paths.ts` without duplication
- Implements append-only contracts for delegation.md and injection.md
- Provides idempotent session.json init/update
- Contains zero classification logic (correct CQRS boundary)
- Stays well under 300 LOC per file
- Uses ESM `.js` import suffixes consistently

**MUST address before claiming completion:**
1. **H1**: Move input types to `types.ts` per plan spec, or document the deliberate deviation from the plan.
2. **M2**: Fix the `process.cwd()` path resolution in `integration-boundary.red.test.ts` — this is a brittle test that will break in non-standard execution contexts.

**SHOULD address in REFACTOR phase:**
1. M1: Import types from implementation instead of redeclaring in tests.
2. O2: Add error logging in `readExistingSessionMetadata` for corrupted file detection.
3. O3: Reconcile test file location with plan spec (plan says `tests/`, code uses `src/`).
