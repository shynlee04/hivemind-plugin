# Plan #10: Migration + Plugin Wiring (Unit 9)

**Goal:** Wire 3 orphaned hook handler modules into `opencode-plugin.ts`, deprecate `diagnostic-log.ts`, configure session journal system as plugin integration — alongside legacy, not replacing immediately.

**Created:** 2026-03-24
**Estimated Steps:** 6
**Unit:** 9 — Migration + Plugin Wiring
**Depends On:** Plan #9 (handler modules exist, tests pass)

---

## Prerequisites

| Prerequisite | Status | Owner |
|-------------|--------|-------|
| `src/hooks/transform-handler.ts` exists with `createTransformHandler()` | ✅ Ready | Plan #9 |
| `src/hooks/text-complete-handler.ts` exists with `createTextCompleteHandler()` | ✅ Ready | Plan #9 |
| `src/hooks/compaction-handler.ts` exists with `createCompactionJournalHandler()` | ✅ Ready | Plan #9 |
| Handler tests pass (`tests/hooks/*.test.ts`) | ✅ Ready | Plan #9 |
| `src/plugin/injection-store.ts` functional | ✅ Ready | Existing |
| `src/features/event-tracker/writers/` functional | ✅ Ready | Existing |

---

## Context Analysis

### Current Plugin State (opencode-plugin.ts, 212 lines)

| Hook | Status | Implementation |
|------|--------|----------------|
| `system.transform` | ❌ NOT registered | Handler exists in hooks but orphaned |
| `experimental.text.complete` | ⚠️ Inline (lines 165-202) | Calls `upsertSessionInspectionExport` + `writeDiagnosticLog` |
| `experimental.chat.messages.transform` | ✅ Wired | Via `messages-transform-adapter.ts` |
| `experimental.session.compacting` | ✅ Wired | Via `compaction-adapter.ts` |

### Orphaned Handlers (Plan #9 deliverables, not yet wired)

| Handler | Export Name | Hook Target | Writes To |
|---------|------------|-------------|-----------|
| `transform-handler.ts` | `createTransformHandler` | `system.transform` | injection-store |
| `text-complete-handler.ts` | `createTextCompleteHandler` | `experimental.text.complete` | events-writer, session-writer, diagnostics-writer |
| `compaction-handler.ts` | `createCompactionJournalHandler` | `experimental.session.compacting` | events-writer |

### Migration Strategy: Alongside Legacy

The key constraint is **safe migration** — wire new handlers alongside existing logic, not replacing immediately:

1. **`system.transform`** → Register new hook. No existing registration. Zero conflict risk.
2. **`experimental.text.complete`** → Run new handler AFTER existing inline handler. Both fire; new handler writes journal, old handler writes diagnostic-log + session-inspection. Gradual cutover.
3. **`experimental.session.compacting`** → Run journal handler AFTER existing adapter. Adapter injects context; journal handler records event. Orthogonal concerns, no conflict.
4. **`diagnostic-log.ts`** → Add `@deprecated` JSDoc. Do NOT remove import yet. Remove in Plan #11 after verification window.

### Architecture Decision: Compose, Don't Replace

Each hook point composes multiple handlers into a single async function:

```
experimental.text.complete = async (input, output) => {
  await existingInlineHandler(input, output)    // legacy: diagnostic-log + session-inspection
  await newTextCompleteHandler(input, output)   // journal: events + metadata + diagnostics
}
```

This ensures zero regression during transition. The new handler's `.catch(() => undefined)` prevents any journal write failure from breaking the existing flow.

---

## Steps

### Step 1: Add barrel exports for orphaned handlers

**Target Agent:** hivemaker
**Scope:** `src/hooks/index.ts` (1 file, ~3 lines added)
**Dependencies:** None
**Success Criteria:**
- `src/hooks/index.ts` re-exports `transform-handler.js`
- `src/hooks/index.ts` re-exports `text-complete-handler.js`
- `src/hooks/index.ts` re-exports `compaction-handler.js`
- `npx tsc --noEmit` passes after edit

**Delegation Packet:**
```markdown
## Delegation Packet

**Target Agent:** hivemaker
**Scope:** Add 3 export lines to src/hooks/index.ts barrel file
**Context:** Plan #10 Step 1 — barrel re-exports for orphaned handler modules
**Constraints:**
- Edit src/hooks/index.ts only
- Add ESM .js suffix to each export
- Preserve existing exports unchanged
- Follow alphabetical or logical grouping (new handlers together)

**Expected Return:**
- Status: completed
- Evidence: diff showing 3 added lines, npx tsc --noEmit output
```

---

### Step 2: Import 3 handlers + deprecation annotation in opencode-plugin.ts

**Target Agent:** hivemaker
**Scope:** `src/plugin/opencode-plugin.ts` (1 file, import section + deprecation)
**Dependencies:** Step 1
**Success Criteria:**
- 3 new imports added: `createTransformHandler`, `createTextCompleteHandler`, `createCompactionJournalHandler`
- Import paths use `../hooks/` (barrel or direct)
- `writeDiagnosticLog` import annotated with `@deprecated` comment
- `diagnostic-log.ts` file receives `@deprecated` JSDoc tag
- No functional changes — imports only
- `npx tsc --noEmit` passes

**Delegation Packet:**
```markdown
## Delegation Packet

**Target Agent:** hivemaker
**Scope:** Add imports to opencode-plugin.ts + deprecation annotation
**Context:** Plan #10 Step 2 — prepare plugin for handler wiring
**Constraints:**
- Add imports for 3 handler factories from ../hooks/
- Add @deprecated comment on writeDiagnosticLog import line
- Add @deprecated JSDoc to diagnostic-log.ts exports
- Do NOT change any hook registration yet
- ESM .js import suffixes required
- Must not break existing functionality

**Expected Return:**
- Status: completed
- Evidence: diff showing new import lines + deprecation annotations, tsc output
```

---

### Step 3: Register `system.transform` hook (new — no conflict)

**Target Agent:** hivemaker
**Scope:** `src/plugin/opencode-plugin.ts` (1 file, ~5 lines added in hook return object)
**Dependencies:** Step 2
**Success Criteria:**
- `system.transform` hook registered in plugin return object
- Handler created via `createTransformHandler({ directory })`
- Hook signature matches SDK contract: `async (input, output) => { ... }`
- No other hooks modified
- `npx tsc --noEmit` passes

**Delegation Packet:**
```markdown
## Delegation Packet

**Target Agent:** hivemaker
**Scope:** Register system.transform hook in opencode-plugin.ts
**Context:** Plan #10 Step 3 — new hook registration (no existing registration to conflict with)
**Constraints:**
- Add to hook return object alongside existing hooks
- Use createTransformHandler({ directory }) factory
- Hook must be named 'system.transform' (SDK hook name)
- Follow existing hook registration patterns in the file
- ≤5 lines of new code

**Expected Return:**
- Status: completed
- Evidence: diff showing new hook registration, tsc output
```

---

### Step 4: Compose journal handler into `experimental.text.complete`

**Target Agent:** hivemaker
**Scope:** `src/plugin/opencode-plugin.ts` (1 file, ~3 lines added inside existing handler)
**Dependencies:** Step 2
**Success Criteria:**
- `createTextCompleteHandler({ directory })` instantiated before hook return or inline
- New handler called AFTER existing inline logic within `experimental.text.complete`
- Existing `upsertSessionInspectionExport` call preserved
- Existing `writeDiagnosticLog` call preserved (deprecated but still functional)
- New handler's `.catch(() => undefined)` prevents journal failure from breaking legacy
- `npx tsc --noEmit` passes

**Delegation Packet:**
```markdown
## Delegation Packet

**Target Agent:** hivemaker
**Scope:** Compose new text complete handler alongside existing inline handler
**Context:** Plan #10 Step 4 — safe migration: new handler runs AFTER legacy, both fire
**Constraints:**
- Existing inline handler (lines 165-202) must remain intact
- New handler call added AFTER existing logic, not replacing it
- Both handlers fire on each text.complete event
- New handler must not depend on or interfere with existing handler output
- Use same directory variable from plugin scope
- ≤3 lines added inside existing handler function

**Expected Return:**
- Status: completed
- Evidence: diff showing composed handler call, tsc output
```

---

### Step 5: Compose journal handler into `experimental.session.compacting`

**Target Agent:** hivemaker
**Scope:** `src/plugin/opencode-plugin.ts` (1 file, ~3 lines added)
**Dependencies:** Step 2
**Success Criteria:**
- `createCompactionJournalHandler({ directory })` instantiated
- Journal handler called alongside existing `compactionHandler` adapter
- Existing compaction-adapter behavior preserved (context injection)
- New handler only writes compaction event (read-only observer pattern)
- `npx tsc --noEmit` passes

**Delegation Packet:**
```markdown
## Delegation Packet

**Target Agent:** hivemaker
**Scope:** Compose compaction journal handler alongside existing compaction adapter
**Context:** Plan #10 Step 5 — journal writes alongside adapter's context injection
**Constraints:**
- Existing compaction adapter must remain untouched
- New handler is a write-only observer (records event, does not modify output)
- Both handlers fire on session.compacting event
- Name import as createCompactionJournalHandler to avoid collision with existing createCompactionHandler
- ≤3 lines added

**Expected Return:**
- Status: completed
- Evidence: diff showing composed handler call, tsc output
```

---

### Step 6: Full verification + commit

**Target Agent:** hivemaker
**Scope:** Verification across all modified files
**Dependencies:** Steps 1-5
**Success Criteria:**
- `npx tsc --noEmit` passes — zero type errors
- All existing tests pass: `npx tsx --test tests/`
- Handler tests pass: `npx tsx --test tests/hooks/*.test.ts`
- Plugin loads without runtime errors (no import resolution failures)
- `git diff` shows only planned changes (no accidental mutations)
- Atomic commit with conventional message

**Delegation Packet:**
```markdown
## Delegation Packet

**Target Agent:** hivemaker
**Scope:** Full verification + atomic commit for Plan #10
**Context:** Plan #10 Step 6 — final gate before declaring wiring complete
**Constraints:**
- Run npx tsc --noEmit — must pass with zero errors
- Run all test suites — must pass
- Run git diff to verify only planned files changed
- Commit with conventional message: "feat(plugin): wire session journal handlers alongside legacy"
- Files to commit: src/hooks/index.ts, src/plugin/opencode-plugin.ts, src/sdk-supervisor/diagnostic-log.ts
- Do NOT remove diagnostic-log.ts or its import — deprecation only

**Expected Return:**
- Status: completed
- Evidence: tsc output, test output, git diff summary, commit SHA
```

---

## File Change Summary

| File | Action | Lines Changed (est) |
|------|--------|-------------------|
| `src/hooks/index.ts` | Edit — add 3 barrel exports | +3 |
| `src/plugin/opencode-plugin.ts` | Edit — imports + hook registrations | +15 |
| `src/sdk-supervisor/diagnostic-log.ts` | Edit — @deprecated JSDoc | +2 |
| **Total** | | **~20 LOC** |

---

## Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| `system.transform` hook not fired by SDK (experimental) | Medium | Low | Handler is a no-op if never called. No side effects. Safe to register. |
| text.complete fires multiple times per turn (streaming) | Medium | Medium | Both handlers write per-fire. Journal may have duplicates. Accept for v1 — append-only, non-destructive. |
| Journal write failure breaks existing text.complete flow | Low | High | New handler wrapped in `.catch(() => undefined)`. Existing handler unaffected. |
| Import resolution fails for orphaned handlers | Low | High | Step 1 adds barrel exports first. Step 2 imports after barrel is updated. tsc catches failures. |
| Compaction journal + compaction adapter conflict | Very Low | Low | Orthogonal concerns — one writes event, one injects context. Both fire, neither interferes. |

---

## Architect Decisions Needed

| Decision | Context | Urgency |
|----------|---------|---------|
| None — all decisions resolved in Plan #9 Rev 1 | Handler location, factory pattern, thin handler constraint, dual write strategy, compaction observer pattern all decided | — |

---

## Verification Criteria (Plan-Level)

1. `npx tsc --noEmit` passes — zero type errors
2. All existing plugin hooks still registered and functional
3. `system.transform` hook newly registered with `createTransformHandler`
4. `experimental.text.complete` fires both legacy inline handler AND new journal handler
5. `experimental.session.compacting` fires both existing adapter AND new journal handler
6. `diagnostic-log.ts` marked `@deprecated` but still importable and functional
7. `src/hooks/index.ts` exports all 3 handler modules
8. No files modified outside the 3 listed in File Change Summary
9. All existing tests continue to pass (zero regressions)
