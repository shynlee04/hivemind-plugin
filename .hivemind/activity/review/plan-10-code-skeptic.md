# Code Skepticism Report — Plan #10 Plugin Wiring

**Scope:** Plan #10 plugin wiring implementation
**Files:** `src/hooks/index.ts`, `src/sdk-supervisor/diagnostic-log.ts`, `src/plugin/opencode-plugin.ts`, `tests/plugin/event-tracker-wiring.test.ts`, `src/hooks/transform-handler.ts`, `src/hooks/text-complete-handler.ts`, `src/hooks/compaction-handler.ts`
**Overall Risk:** low

---

## Critical Issues (Must Fix Before Merge)

None found.

---

## High-Risk Issues (Should Fix Before Merge)

None found.

---

## Medium-Risk Issues (Should Address Soon)

### M1: `text-complete-handler.ts` delegates to writers that do `mkdir`/`writeFile`/`appendFile` — CQRS boundary thin

- **Location:** `src/hooks/text-complete-handler.ts:52-82` → calls into `src/features/event-tracker/writers/base-writer.ts:12-13`, `session-writer.ts:62-73`, `index-writer.ts:143-145`, `synthesizer.ts:142-144`
- **Risk:** The hooks layer itself contains zero `mkdir`/`writeFile`/`appendFile` calls (grep confirmed clean). However, the handler delegates to writer modules that do heavy filesystem operations. If the "hooks-readonly" policy is interpreted strictly as "hooks never cause writes," this violates the spirit. If the policy is "hooks don't write *directly* but delegate to CQRS writers," this is correct.
- **Evidence:** `grep` of `src/hooks/` for `(mkdir|writeFile|appendFile)` — zero matches. Writers in `src/features/event-tracker/writers/` — 15 matches across 4 files.
- **Assessment:** This is architecturally correct under CQRS (hooks orchestrate, writers own I/O), but the `text-complete-handler.ts` JSDoc says "writes diagnostics" which may mislead future maintainers into thinking hooks own writes.
- **Recommendation:** Update JSDoc in `text-complete-handler.ts` to say "delegates diagnostic writing to event-tracker writers" instead of "writes diagnostics."

### M2: Legacy `writeDiagnosticLog` still called in `experimental.text.complete` — dual-write path risk

- **Location:** `src/plugin/opencode-plugin.ts:192-213`
- **Risk:** Both legacy `writeDiagnosticLog` (filesystem via `sdk-supervisor/diagnostic-log.ts`) AND new journal handler (`createTextCompleteHandler`) fire on every `text.complete` hook. Until Plan #11 removes the legacy path, every assistant response triggers **two** filesystem writes to different locations: `.hivemind/error-log/` (legacy) and `.hivemind/activity/` (journal). This is intentional compose-don't-replace, but doubles I/O until cleanup.
- **Evidence:** `opencode-plugin.ts:192` — `writeDiagnosticLog` call. `opencode-plugin.ts:215` — `createTextCompleteHandler` call. Both wrapped in `void` with `.catch(() => undefined)`.
- **Recommendation:** Acceptable for migration window. Ensure Plan #11 explicitly removes the `writeDiagnosticLog` call and the `diagnostic-log.ts` module.

---

## Observations (Consider Addressing)

### O1: `createTransformHandler` parameter `_deps` is unused

- **Location:** `src/hooks/transform-handler.ts:23`
- **Evidence:** The parameter is prefixed with `_` and never referenced in the function body. The handler only calls `setInjectionPayload` with data derived from the hook inputs, not from `deps.directory`.
- **Assessment:** Not a bug — the underscore prefix is a valid TypeScript convention for unused parameters. But the factory pattern (createXHandler(deps)) implies deps are used. Future maintainers may expect `directory` to be used.
- **Recommendation:** Either use `_deps.directory` for a future session journal path, or document why directory is unused in this handler.

### O2: Test file is 369 lines — approaches constitutional limit

- **Location:** `tests/plugin/event-tracker-wiring.test.ts`
- **Evidence:** 369 lines, 22 tests across 4 suites. Constitutional limit is 300 LOC.
- **Assessment:** Still under limit, but growth is likely if more hooks are added. The `extractHookBlock` helper (lines 337-369) is the main contributor.
- **Recommendation:** Monitor. If more test suites are added, extract `extractHookBlock` to a shared test utility.

### O3: No `.catch()` on legacy `upsertSessionInspectionExport` at line 185-188 — inconsistency

- **Location:** `src/plugin/opencode-plugin.ts:185-188`
- **Evidence:** The legacy `upsertSessionInspectionExport` call uses `.catch(() => undefined)` correctly. But the pattern is identical to the journal handler calls. No issue here — just confirming consistency.
- **Assessment:** ✅ Actually consistent. Both legacy and journal calls use `.catch(() => undefined)`.

---

## Assumptions Challenged

| # | Assumption | Risk if Wrong |
|---|-----------|---------------|
| 1 | Writer modules (`events-writer`, `session-writer`, `diagnostics-writer`) own all filesystem I/O — hooks never write directly | If writers throw, `text-complete-handler` silently swallows via `.catch(() => undefined)` — diagnostic data may be lost without any signal |
| 2 | `writeDiagnosticLog` will be removed in Plan #11 | If Plan #11 slips, dual-write path persists and `.hivemind/error-log/` becomes zombie state |
| 3 | `createTransformHandler` doesn't need `directory` | If future journal writes need a directory path from this handler, the unused deps param will need to be wired |

---

## Evidence Collected

```bash
# TypeScript type check — PASS (zero errors)
npx tsc --noEmit

# Wiring tests — 22/22 PASS
npx tsx --test tests/plugin/event-tracker-wiring.test.ts

# Hooks layer write operations — ZERO matches in hooks/
grep -r '(mkdir|writeFile|appendFile)' src/hooks/
# (no matches)

# Writer layer write operations — 15 matches in writers/
grep -r '(mkdir|writeFile|appendFile)' src/features/event-tracker/writers/

# Dead code markers — ZERO matches
grep -r 'dead|TODO|FIXME|HACK|XXX' src/hooks/ src/sdk-supervisor/

# Handler files exist — confirmed
ls -la src/hooks/transform-handler.ts src/hooks/text-complete-handler.ts src/hooks/compaction-handler.ts
```

---

## Verdict

**PASS — Safe to merge with noted observations.**

The implementation correctly follows all five review criteria:

1. **Compose-don't-replace** ✅ — Legacy handlers (`upsertSessionInspectionExport`, `writeDiagnosticLog`, `createCompactionHandler`) fire BEFORE or ALONGSIDE new journal handlers. No existing behavior was removed.

2. **hooks-readonly compliance** ✅ — Zero `mkdir`/`writeFile`/`appendFile` calls in `src/hooks/`. All filesystem I/O is delegated to CQRS writer modules in `src/features/event-tracker/writers/`.

3. **Import correctness** ✅ — Barrel exports in `hooks/index.ts` use correct ESM `.js` suffixes. All imported names (`createTransformHandler`, `createTextCompleteHandler`, `createCompactionJournalHandler`) match their source module exports. Handler files exist and compile.

4. **@deprecated annotation** ✅ — `diagnostic-log.ts` has proper `@deprecated` JSDoc tag with Plan #11 removal timeline. Plugin import line has inline `/** @deprecated */` annotation.

5. **Dead code, naming** ✅ — No dead code markers, no zombie imports. `createCompactionJournalHandler` naming clearly distinguishes from legacy `createCompactionHandler`.

**Required changes before merge:** None.

**Recommended follow-up for Plan #11:**
- Remove `writeDiagnosticLog` import and call from `opencode-plugin.ts`
- Remove `src/sdk-supervisor/diagnostic-log.ts` module
- Consider using `_deps.directory` in `createTransformHandler` or documenting why it's unused
