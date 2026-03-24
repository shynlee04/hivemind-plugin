# Code Skepticism Report — Plan #9 Hook Handlers

**Scope:** Three hook handler implementations + tests for `system.transform`, `text.complete`, and `session.compacting`.
**Files:** `src/hooks/transform-handler.ts`, `src/hooks/text-complete-handler.ts`, `src/hooks/compaction-handler.ts` + matching test files.
**Overall Risk:** HIGH — one handler has a confirmed error-resilience bug.

---

## Critical Issues (Must Fix Before Merge)

None.

---

## High-Risk Issues (Should Fix Before Merge)

### H1: `.catch(() => undefined)` Does NOT Catch Synchronous Throws

**File:** `src/hooks/transform-handler.ts:47`

```typescript
await Promise.resolve(setInjectionPayload(payload)).catch(() => undefined)
```

`setInjectionPayload` is **synchronous** (returns `void`, `src/plugin/injection-store.ts:27-29`). Wrapping it in `Promise.resolve()` evaluates the function synchronously, then wraps the return value. If `setInjectionPayload` throws (e.g., Map.set on OOM, or if the store is replaced with a throwing implementation), the exception propagates **synchronously** — the `.catch()` never fires.

**Evidence:**

```
$ node -e "async function t() { try { await Promise.resolve((() => { throw new Error('x') })()).catch(() => 'caught'); } catch(e) { console.log('UNHANDLED:', e.message); } } t();"
UNHANDLED: x
```

**Risk:** A crash in `setInjectionPayload` crashes the entire hook invocation. The pattern appears in only this handler — the other two handlers use `.catch()` on genuinely async calls (`mkdir`, `appendSessionEvent`).

**Required fix:** Either:
1. Use `try { setInjectionPayload(payload) } catch {}` for synchronous wrapping, or
2. Make `setInjectionPayload` itself resilient (internal try-catch).

The `.catch(() => undefined)` annotation should be removed since it gives false confidence of error handling.

---

## Medium-Risk Issues (Should Address Soon)

### M1: Redundant `Promise.resolve()` Wrapper on Synchronous Call

**File:** `src/hooks/transform-handler.ts:47`

Related to H1. `Promise.resolve(setInjectionPayload(payload))` has no purpose — `setInjectionPayload` is synchronous and returns `void`. The `Promise.resolve()` wrapper only adds overhead and (as shown in H1) creates a misleading error-handling pattern. The handler can be simplified:

```typescript
// Current (misleading)
await Promise.resolve(setInjectionPayload(payload)).catch(() => undefined)

// Correct
try { setInjectionPayload(payload) } catch {}
```

### M2: `_deps` Parameter Silently Ignored

**File:** `src/hooks/transform-handler.ts:23`

```typescript
export function createTransformHandler(_deps: TransformHandlerDeps)
```

The `directory` dependency is accepted but prefixed with `_` to suppress the unused warning. This means:
- The factory signature claims to need `directory`, but ignores it.
- A caller passing `directory` gets no feedback that it's unused.
- If a future refactor adds directory usage, the underscore prefix silently enables it.

Not a bug now, but a maintenance trap. Consider either: (a) removing `TransformHandlerDeps` entirely if the handler truly needs no deps, or (b) documenting why it's accepted but unused (SDK hook factory contract).

---

## Observations (Consider Addressing)

### O1: Heavy Source-Inspection Tests (Fragile)

Multiple tests verify behavior by **string-matching source code** rather than testing runtime behavior:

| Test File | Source-Inspection Tests | Total Tests |
|-----------|------------------------|-------------|
| `transform-handler.test.ts` | 3 of 7 (43%) | 7 |
| `text-complete-handler.test.ts` | 8 of 13 (62%) | 13 |
| `compaction-handler.test.ts` | 4 of 8 (50%) | 8 |

Examples:
- `assert.match(source, /setInjectionPayload/)` — tests import existence
- `assert.doesNotMatch(source, /from\s+['"]\.\.\/\.\.\/core\//)` — tests non-imports
- `assert.match(source, /isPurposeClass/)` — tests local function definition
- `assert.doesNotMatch(source, /as\s+any/)` — tests absence of pattern

These tests break on **any** reorganization (moving imports, renaming variables, adding comments containing keywords). They do not validate runtime contracts. The behavioral tests (wiring, writes, void return, skip-on-empty) are solid — the source-inspection layer adds noise.

**Recommendation:** Keep 1-2 source guards as canaries (e.g., "thin handler" constraint). Remove redundant import-existence tests that are already proven by the behavioral tests (if `appendSessionEvent` is called at runtime, it's obviously imported).

### O2: Unnecessary 3-Way Sequential Await in text-complete-handler

**File:** `src/hooks/text-complete-handler.ts:55-89`

Four `await` calls run sequentially. The `mkdir` must complete before writes, but the three writer calls (`appendSessionEvent`, `initOrUpdateSessionMetadata`, `appendSessionDiagnostic`) could be parallelized:

```typescript
// Current: ~3× latency
await mkdir(...)
await appendSessionEvent(...)
await initOrUpdateSessionMetadata(...)
await appendSessionDiagnostic(...)

// Alternative: ~1× latency after mkdir
await mkdir(...)
await Promise.all([
  appendSessionEvent(...),
  initOrUpdateSessionMetadata(...),
  appendSessionDiagnostic(...),
])
```

**Severity:** Low — these are small markdown/JSON writes, not network calls. But for high-frequency hooks, the compound latency adds up.

### O3: Hardcoded Lineage Value

**File:** `src/hooks/text-complete-handler.ts:76`

```typescript
lineage: 'hiveminder',
```

This is hardcoded. If the plugin ever supports `hivefiver` lineage, this value would be wrong. The injection payload (from `system.transform`) doesn't carry lineage, so this is a known simplification — but it should be documented as a deliberate choice rather than an oversight.

### O4: Handler LOC — All Within Limits

| Handler | LOC | Status |
|---------|-----|--------|
| `transform-handler.ts` | 49 | ✅ |
| `text-complete-handler.ts` | 91 | ✅ |
| `compaction-handler.ts` | 51 | ✅ |

All handlers are well within the 300-LOC constitutional limit. No god functions detected.

---

## Assumptions Challenged

| # | Assumption | Location | Risk if Wrong |
|---|-----------|----------|---------------|
| 1 | `setInjectionPayload` never throws | `transform-handler.ts:47` | Hook crashes; `.catch()` gives false confidence |
| 2 | `getAndClearInjectionPayload` returns `undefined` for unknown sessions (not throws) | `text-complete-handler.ts:52` | Handler crash on first turn of new session |
| 3 | `PURPOSE_CLASS_VALUES` is kept in sync with `PurposeClass` union | `text-complete-handler.ts:23` | Type guard rejects valid values |
| 4 | Session directory creation succeeds or is idempotent | `text-complete-handler.ts:55`, `compaction-handler.ts:39` | Silent data loss on disk-full |

**Verification:**
- Assumption 2: ✅ Confirmed — `getAndClearInjectionPayload` uses `Map.get` + `Map.delete`, returns `undefined` for missing keys (`injection-store.ts:31-34`).
- Assumption 3: ✅ Confirmed — both `PurposeClass` and `PURPOSE_CLASS_VALUES` are in the same file (`types.ts:34-43, 78-87`) and are manually synchronized. No auto-generation.
- Assumption 4: ⚠️ Acceptable — `mkdir` with `{ recursive: true }` is idempotent. The `.catch(() => undefined)` swallows the error, but subsequent writes will also fail silently. No data corruption risk, just silent loss.

---

## Evidence Collected

```
$ npx tsc --noEmit
(empty — 0 errors)

$ npx tsx --test tests/hooks/transform-handler.test.ts tests/hooks/text-complete-handler.test.ts tests/hooks/compaction-handler.test.ts
ℹ tests 30
ℹ pass 30
ℹ fail 0

$ grep -rn "as any" src/hooks/
(no matches)

$ grep -rn "Promise.resolve" src/hooks/transform-handler.ts
47:    await Promise.resolve(setInjectionPayload(payload)).catch(() => undefined)

$ node -e "async function t() { try { await Promise.resolve((() => { throw new Error('x') })()).catch(() => 'caught'); } catch(e) { console.log('UNHANDLED:', e.message); } } t();"
UNHANDLED: x
```

---

## Verdict

**Code quality is generally good.** All three handlers are thin (≤91 LOC), delegate cleanly to writer modules, use proper factory patterns, and have no `as any` casts. The `isPurposeClass` type guard in `text-complete-handler` is a textbook example of narrowing without unsafe casts. The `mkdir { recursive: true }` pattern is correct and idempotent.

**One confirmed bug blocks merge:** The `Promise.resolve(setInjectionPayload()).catch()` pattern in `transform-handler.ts:47` does not catch synchronous throws. This is a **silent resilience failure** — the code looks like it handles errors, but it doesn't. The fix is trivial (replace with `try/catch`), but the pattern must be corrected before this ships.

**Required changes before merge:**
1. **[H1]** Replace `Promise.resolve(setInjectionPayload(payload)).catch(() => undefined)` with `try { setInjectionPayload(payload) } catch {}` in `transform-handler.ts:47`.

**Recommended changes (should address soon):**
1. **[M1]** Remove the `Promise.resolve()` wrapper — it adds no value.
2. **[M2]** Either use or document the `_deps` parameter.

**Test suite:** 30/30 passing. Behavioral coverage is solid. Source-inspection layer is over-indexed (62% of text-complete tests) but not blocking.
