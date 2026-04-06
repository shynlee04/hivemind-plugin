# Phase 1 Baseline Cleanup — Remaining Items Research

**Researched:** 2026-04-06
**Domain:** opencode-harness plugin cleanup
**Confidence:** HIGH

## Summary

Three items remain from Phase 1 Baseline Cleanup (7/10 complete). All three are LOW-risk removals or fixes with clear execution paths. No blockers or dependencies between them — they can be done in any order, and each is independently safe.

**Primary recommendation:** Execute all 3 in a single batch — remove system.transform wiring, fix orchestrator references, and gut the context-budget heuristic model.

---

## Item 8: Remove `system.transform` Wiring from `src/plugin.ts`

### What It Is
Lines 38 and 315-320 of `src/plugin.ts`:
```typescript
// Line 38 — import
import { transformSystemPrompt } from "./hooks/system-transform.js"

// Lines 315-320 — hook wiring
"system.transform": async (
  input: { sessionID?: string },
  output: { systemPrompt: string },
) => {
  output.systemPrompt = transformSystemPrompt(output.systemPrompt, input.sessionID)
},
```

### What the Hook Does
`src/hooks/system-transform.ts` injects a "Prompt-Enhance Output Contract" (YAML frontmatter + XML body structure) into the system prompt **only** for sessions that have delegation metadata with an `agent` field. Normal sessions pass through unchanged.

### Current State Assessment
- The ROADMAP marks "System-transform gating" (MED-01) as **done** — the hook already checks delegation metadata before injecting
- The ROADMAP marks this item (LOW-03) as **pending** — remove the wiring entirely
- The hook file (`src/hooks/system-transform.ts`) is a **pure read-side function** — it has no side effects beyond string concatenation
- No other code in the repo calls `transformSystemPrompt` except `plugin.ts`

### Consumers
| File | Usage |
|------|-------|
| `src/plugin.ts:38` | Import |
| `src/plugin.ts:315-320` | Hook wiring |
| `src/hooks/system-transform.ts` | Definition (can be deleted with wiring) |

### Recommendation
**Delete both the import and the hook wiring.** The hook was a gating mechanism for prompt-enhance sessions, and since the gating is confirmed working (MED-01 done), the wiring serves no further purpose. The hook file itself can also be deleted since nothing else references it.

### Execution Steps
1. Delete line 38: `import { transformSystemPrompt } from "./hooks/system-transform.js"`
2. Delete lines 315-320: the entire `"system.transform"` hook block
3. Delete `src/hooks/system-transform.ts` (orphaned file)
4. Run `npm run typecheck` to confirm no broken imports
5. Run `npm test` to confirm no test failures

### Risk: **LOW**
- Pure removal — no behavior change for non-prompt-enhance sessions (they already passed through unchanged)
- Prompt-enhance sessions lose the contract injection, but this is the intent (the contract was a gating artifact, not a runtime requirement)
- No tests reference `transformSystemPrompt` directly (verified by grep)

---

## Item 9: Fix `hivefiver-orchestrator.md` Expecting `recommended_lanes`

### What It Is
The orchestrator agent file at `.hivefiver-meta-builder/agents-lab/active/refactoring/hivefiver-orchestrator.md` references `recommended_lanes` in two places:

1. **Line 102** — Anti-Patterns section example of correct delegation:
```
prompt: "Analyze this prompt and return a skim summary.\n\nPrompt: $USER_PROMPT\n\nReturn: intent, complexity_score, key_entities, ambiguity_flags, recommended_lanes."
```

2. **Line 163** — Phase 0: Skim in the "Executing the Prompt-Enhance Pipeline" section:
```
Return: word_count, line_count, token_estimate, url_count, urls[], absolute_claim_count, complexity_score (1-10), flooding_risk, verdict (simple|complex|unclear), recommended_lanes.
```

### Root Cause
The `prompt-skim` tool (`src/tools/prompt-skim/tools.ts`) does **NOT** return a `recommended_lanes` field. Its actual output (verified from `PromptSkimResultSchema`):
- `word_count`, `line_count`, `token_estimate`
- `url_count`, `urls`
- `path_count`, `paths` (with `exists` verification)
- `absolute_claim_count`
- `complexity_score`, `flooding_risk`, `verdict`

No `recommended_lanes` field exists anywhere in the source code.

### Impact
The orchestrator agent will instruct subagents to return `recommended_lanes`, but the `prompt-skim` tool never produces it. This creates:
1. **Phantom expectation** — subagents may try to fabricate `recommended_lanes` to satisfy the contract
2. **Confusion** — the field doesn't exist in the skim result schema, so validation would reject it if anyone tried to add it

### Recommendation
**Remove `recommended_lanes` from both references in the orchestrator file.** This is a documentation/agent definition fix, not a code change.

### Execution Steps
1. Line 102: Remove `, recommended_lanes` from the Return string
2. Line 163: Remove `, recommended_lanes` from the Return string
3. Verify no other files reference `recommended_lanes` (already confirmed — grep returned 0 results in `src/`)

### Risk: **LOW**
- Pure text change in an agent definition file
- No code or schema changes
- The field never existed, so nothing depends on it

---

## Item 10: Replace Heuristic Context-Budget with Real OpenCode Compaction Data

### Current Implementation (The Heuristic)
The `context-budget` tool (`src/tools/context-budget/tools.ts`) uses a **fake model**:
1. Reads a file path passed as argument
2. Parses `compaction_count` from YAML frontmatter in the file
3. Maps to budget: `0 → 100%`, `1-2 → 50%`, `>2 → 25%`

This is heuristic because:
- The `compaction_count` is a **self-managed counter** in a `.hivemind/state/session-context-prompt.md` file
- It's incremented by `prompt-enhance.ts`'s `session.compacting` hook (not by OpenCode itself)
- The 15% linear decay model (100% → 50% → 25%) is **arbitrary** — not based on actual token/context data
- The tool requires the caller to know the session file path — it has no access to real OpenCode compaction state

### What OpenCode Actually Provides
OpenCode's `experimental.session.compacting` hook provides:
- **`input.sessionID`** — the session being compacted
- **`output.context`** — an array of context strings to inject into the compaction summary
- **`output`** has no token count, message count, or context length fields exposed to plugins

The `opencode.json` compaction config:
```json
{
  "compaction": {
    "auto": true,
    "prune": true,
    "reserved": 15000
  }
}
```

This configures OpenCode's internal compaction behavior (auto-compaction, pruning, reserved token budget) but **does not expose** real-time token usage or context length to plugins.

### The Reality Check
**OpenCode does not currently expose real compaction data (token counts, context length, message counts) to plugin hooks.** The `experimental.session.compacting` hook is a **context injection** hook — plugins add TO the compaction context, they don't read FROM OpenCode's compaction state.

This means a "real" context-budget tool cannot be built from OpenCode plugin hooks alone. The options are:

### Option A: Remove the Tool Entirely (Recommended)
The context-budget tool is a LOW-priority item (LOW-01) in the requirements. It provides no value with its current fake model, and there's no real data source to replace it with. Remove the tool, its tests, and its registration from `plugin.ts`.

**Pros:** Clean removal, eliminates false signal, no maintenance burden
**Cons:** Loses the concept of "budget awareness" (but it was never accurate anyway)

### Option B: Track Compaction Events Internally
Instead of reading a file, the harness could track compaction count in-memory (via the existing `session.compacting` hook in `plugin.ts`) and expose it through `tool.execute.after` metadata (which already injects `_harness` metadata). The tool could then read from the harness's own state rather than a separate file.

**Pros:** Keeps the concept, uses harness's own data
**Cons:** Still doesn't give real token counts — just a compaction counter with arbitrary thresholds

### Option C: Wait for OpenCode to Expose Real Data
Defer this item entirely. When OpenCode exposes token/context data to plugins, rebuild the tool then.

**Pros:** Eventually gets real data
**Cons:** Item remains pending indefinitely

### Recommendation
**Option A: Remove the context-budget tool entirely.** The heuristic model provides misleading information (claiming "50% budget remaining" based on an arbitrary counter is worse than providing no information at all). The tool's schema (`ContextBudgetRecordSchema`) in `schema-kernel/` can be kept as a contract placeholder for future use.

### Execution Steps (Option A)
1. Delete `src/tools/context-budget/` directory (3 files: `index.ts`, `tools.ts`, `types.ts`)
2. Remove `"context-budget": createContextBudgetTool(process.cwd())` from `src/plugin.ts` (line ~471)
3. Remove `import { createContextBudgetTool }` from `src/plugin.ts` (line ~43)
4. Delete `tests/tools/context-budget.test.ts`
5. Delete `docs/harness-techniques/context-budget-rules-refernces.md` (orphaned docs)
6. Keep `ContextBudgetRecordSchema` in `src/schema-kernel/prompt-enhance.schema.ts` (it's a contract definition, not the tool itself)
7. Run `npm run typecheck`
8. Run `npm test`

### Risk: **LOW-MEDIUM**
- The tool is LOW priority and currently provides fake data
- The schema contract is preserved for future real implementation
- Tests will need updating (removing context-budget test file)
- If any downstream workflow depends on the `context-budget` tool name, it will break (but grep shows no consumers beyond plugin.ts registration)

---

## Cross-Item Dependencies

| Item | Depends On | Blocking |
|------|-----------|----------|
| 8. Remove system.transform wiring | None | None |
| 9. Fix recommended_lanes references | None | None |
| 10. Replace context-budget | None | None |

All 3 items are **independent** — no ordering requirement.

## Impact on Quality Gates

| Gate | Impact |
|------|--------|
| QUAL-01: Zero dead text in non-prompt-enhance sessions | **Improved** — removing system.transform eliminates the injection path entirely |
| QUAL-03: `npm run typecheck` passes | **Must verify** after all 3 changes |
| QUAL-04: `npm test` passes | **Must verify** — will lose context-budget tests |
| QUAL-05: `npm run build` passes | **Must verify** after all 3 changes |

## Files Modified (Summary)

| File | Action | Item |
|------|--------|------|
| `src/plugin.ts` | Remove import (line 38), remove hook (lines 315-320), remove tool registration (line ~471), remove import (line ~43) | 8, 10 |
| `src/hooks/system-transform.ts` | Delete file | 8 |
| `.hivefiver-meta-builder/.../hivefiver-orchestrator.md` | Remove `recommended_lanes` from lines 102, 163 | 9 |
| `src/tools/context-budget/` | Delete directory (3 files) | 10 |
| `tests/tools/context-budget.test.ts` | Delete file | 10 |
| `docs/harness-techniques/context-budget-rules-refernces.md` | Delete file | 10 |

## Environment Availability

| Dependency | Required By | Available | Notes |
|------------|------------|-----------|-------|
| Node.js >= 20 | Build/test | ✓ | darwin, verified |
| npm | Build/test | ✓ | Standard |
| OpenCode plugin SDK | Plugin interface | ✓ | `@opencode-ai/plugin` peer dep |
| vitest | Test runner | ✓ | Dev dependency |

No external service dependencies. All changes are code-only.

## Sources

### Primary (HIGH confidence)
- `src/plugin.ts` — verified lines 38, 315-320, 43, 471
- `src/hooks/system-transform.ts` — full file read
- `src/tools/prompt-skim/tools.ts` — verified no `recommended_lanes` in output
- `src/tools/context-budget/tools.ts` — verified heuristic model
- `.hivefiver-meta-builder/.../hivefiver-orchestrator.md` — verified lines 102, 163
- `opencode.json` — verified compaction config
- `src/plugins/prompt-enhance.ts` — verified compaction tracking mechanism

### Secondary (MEDIUM confidence)
- `.repo-sdk-packed/opencode-api-sdk.xml` — no compaction data exposed to plugins (searched, empty)
- grep searches across codebase — confirmed no other consumers

## Metadata

**Confidence breakdown:**
- Item 8 (system.transform removal): HIGH — verified all consumers, no hidden dependencies
- Item 9 (recommended_lanes fix): HIGH — verified field doesn't exist in tool output
- Item 10 (context-budget replacement): HIGH on problem analysis, MEDIUM on recommendation (Option A vs B vs C is a judgment call)

**Research date:** 2026-04-06
**Valid until:** 2026-05-06 (stable codebase, no fast-moving deps)
