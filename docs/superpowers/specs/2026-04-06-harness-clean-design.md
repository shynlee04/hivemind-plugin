# Harness Clean Design

**Date:** 2026-04-06
**Author:** Audit via brainstorming + root-cause-analysis

## Problem

The prompt-enhance executable pipeline branch (12 commits, 279 tests) contains confirmed bugs that block real agent workflows, noisy components that waste context budget, and ceremonial artifacts with no consumers.

## Confirmed Bugs

| # | Bug | Severity | Evidence |
|---|-----|----------|----------|
| 1 | **Double-compaction counting** — `event` + `session.compacting` both call `recordCompaction()` | HIGH | 1 compaction → count=2, budget=70 (should be 1, 85) |
| 2 | **session-patch heading corruption** — regex matches inside wrong heading level | HIGH | `## [Section]` matches `### [Section]`, corrupts heading level |
| 3 | **Orchestrator references 5 non-existent agents** | HIGH | `prompt-skimmer`, `prompt-analyzer`, `context-mapper`, `risk-assessor`, `prompt-repackager` |
| 4 | **system-transform injects 804 chars into every session** | MEDIUM | 27 lines of dead text, no tool outputs described format |
| 5 | **prompt-analyze misses cross-line contradictions** | MEDIUM | Per-line-only detection |
| 6 | **context-budget fake linear model** | LOW | 15% per compaction is fiction |
| 7 | **Duplicate tools** in `src/tools/` AND `.opencode/tools/` | LOW | Maintenance burden |
| 8 | **Duplicate test files** | LOW | Wasted maintenance |

## Removals REJECTED After Re-evaluation

| File/Dir | Original Reason | Re-evaluation Finding | Corrected Decision |
|----------|----------------|----------------------|-------------------|
| `src/hooks/system-transform.ts` | Injects dead text into every session. No consumer. | Feature IS valuable — output contracts enforce structure. Bug is unconditional injection, not the concept. | **Keep + Fix** — gate by delegation metadata |
| `src/tools/context-budget/` | Fake model. OpenCode tracks real context. | Context awareness is a UNIQUE harness capability. No other component provides it. | **Keep + Rebuild** — replace fake 15% model with real data |
| `src/shared/tool-helpers.ts` | One-liner wrapper. Inline into tools. | 5 LOC convention anchor. Costs nothing. Scattering format across tools is worse. | **Keep as-is** |
| `.opencode/tools/*.ts` (5 files) | Dead duplicates of `src/tools/`. | Dev-local runtime versions — enable iteration without `npm run build`. Real productivity feature. | **Keep + Fix** — convert to re-exports of `src/tools/` |
| `tests/tools/*.test.ts` (4 files importing from `.opencode/tools/`) | Redundant with `-tool.test.ts` variants. | Test different import paths. Not redundant while `.opencode/tools/` exists as independent code. | **Defer** — depends on `.opencode/tools/` resolution |
| `ContextBudgetRecordSchema` | No consumer after context-budget removal. | Context-budget stays. Schema IS the validation contract the rebuilt engine must satisfy. | **Keep + Fix** |
| `PipelineStateSchema` | Never persisted or read. | Core orchestration concept. ~15 lines. Contract with no consumer yet ≠ reason to destroy contract. | **Defer** — build the consumer, don't kill the schema |
| `EnhancedPromptOutputSchema` | Never produced by any tool. | Defines the pipeline's final deliverable. "What done looks like." | **Keep as target contract** |
| `.hivemind/state/session-context-prompt.md` | Manual scratchpad, not auto-populated. | Runtime state file, not source code. Session's working memory. Wrong category for removal. | **Do Not Touch** |
| `BUDGET_DECREMENT_PER_COMPACTION` | Magic number with no consumer | Coupled to context-budget. Goes away as part of model rebuild, not separately. | **Defer** — contingent on #2 |

## Removals (genuine dead code / noise)

| File/Dir | Reason |
|----------|--------|
| `tests/plugins/prompt-enhance.test.ts` | Masks the double-count bug. Rewrite with single-compaction-path test. |

## Fixes (functional but broken)

| File | Fix |
|------|-----|
| `src/plugins/prompt-enhance.ts` | Remove `event` hook's `session.compacted` handling. Keep only `experimental.session.compacting`. |
| `src/tools/session-patch/tools.ts` | Anchor regex: `(?:^|\n)(${escapedSection})[\s\S]*?(?=\n## |$)` |
| `src/tools/prompt-analyze/tools.ts` | Cross-line contradiction: compare all line pairs, not just within single lines |
| `src/tools/prompt-skim/tools.ts` | Remove `recommended_lanes` (references non-existent agents) |
| `.opencode/agents/hivefiver-orchestrator.md` | Remove or fix execution loop — either define the missing agents or route to existing `researcher`/`builder`/`critic` |
| `src/plugin.ts` | Remove `system.transform` hook wiring. Remove `PromptEnhancePlugin` event forwarding for compaction. |
| `tests/plugins/prompt-enhance.test.ts` | Rewrite to test single-compaction-path, not double-count |

## Rebuilds (ceremonial → functional)

| Component | Rebuild As |
|-----------|-----------|
| `messages-transform.ts` | Gate injection by delegation category, not trigger phrase scan. Remove generic trigger detection. |
| Schema kernel | Keep only `PromptSkimResultSchema`, `PromptAnalysisFindingSchema`, `PromptAnalysisResultSchema`, `SessionPatchRecordSchema` — the 4 schemas that actual tools produce and validate against. |

## Resulting Architecture

After cleanup:
- **4 tools** (not 4 broken): `prompt-skim`, `prompt-analyze`, `context-budget` (rebuilt model), `session-patch` (fixed regex)
- **2 hooks** (not 1 broken): `system-transform` (gated), `messages-transform` (gated)
- **6 schemas** (not 4): skim result, analysis finding, analysis result, context budget, session patch, enhanced output + pipeline state (both kept as contracts)
- **1 plugin**: `prompt-enhance` (single compaction path only, no double-count)
- **0 dead text** injected into non-prompt-enhance sessions
- **0 broken references** to non-existent agents (orchestrator fixed)
- **0 double-counting** of compaction events
- `.opencode/tools/` → re-exports of `src/tools/` (dev-local workflow preserved, divergence eliminated)
- `tool-helpers.ts` kept as convention anchor (5 LOC)
- Runtime state files untouched

## Success Criteria

1. All 8 confirmed bugs fixed
2. Zero dead text injected into non-prompt-enhance sessions
3. `system-transform` gated by delegation metadata
4. `context-budget` uses real OpenCode compaction data, not fake 15% model
5. `session-patch` regex anchored to line start — no heading corruption
6. `prompt-analyze` detects cross-line contradictions
7. Orchestrator workflow references only existing agents, or execution loop removed
8. `prompt-skim` `recommended_lanes` removed (no phantom agent references)
9. `.opencode/tools/` are re-exports, not divergent implementations
10. Tests: no false positives, double-count scenario explicitly tested as NOT happening
11. `npm run typecheck`, `npm test`, `npm run build` all pass
12. Every remaining component answers "yes" to: does this help an AI agent complete its workflow?
