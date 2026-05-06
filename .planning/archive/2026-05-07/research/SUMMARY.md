# Research Summary: Harness Cleanup

**Date:** 2026-04-06
**Type:** Brownfield audit consolidation

## Audit Findings (Pre-existing — findings.md)

The harness-experiment worktree contains a prompt-enhance executable pipeline (12 commits, ~279 tests) with the following confirmed issues:

### 8 Confirmed Bugs

| # | Bug | Severity | Impact |
|---|-----|----------|--------|
| 1 | Double-compaction counting — event + session.compacting both call recordCompaction() | HIGH | Budget drops to 0% after 4 compactions instead of 7 |
| 2 | session-patch heading corruption — regex matches inside wrong heading level | HIGH | `## [Section]` matches `### [Section]`, corrupts heading |
| 3 | Orchestrator references 5 non-existent agents | HIGH | phantom references: prompt-skimmer, prompt-analyzer, context-mapper, risk-assessor, prompt-repackager |
| 4 | system-transform injects 804 chars into every session | MEDIUM | 27 lines of dead text, no tool outputs described format |
| 5 | prompt-analyze misses cross-line contradictions | MEDIUM | Per-line-only detection |
| 6 | context-budget fake linear model | LOW | 15% per compaction is fiction |
| 7 | Duplicate tools in src/tools/ AND .opencode/tools/ | LOW | Maintenance burden |
| 8 | Duplicate test files | LOW | Wasted maintenance |

### Feature-Debt Analysis Results

**0 components unconditionally removed** — all kept and fixed after re-evaluation.

**Kept + Fixed (4):**
- system-transform: gate by delegation metadata (not unconditional injection)
- context-budget: rebuild with real OpenCode compaction data
- .opencode/tools/: DELETE — src/tools/ is superior in every dimension
- tool-helpers: keep as convention anchor (5 LOC)

**Kept as-is (2):**
- EnhancedPromptOutputSchema: defines pipeline's final deliverable
- PipelineStateSchema: core orchestration concept, ~15 lines

**Corrected removal list:**
- DELETE: `.opencode/tools/` — all 5 files (prompt-skim, prompt-analyze, context-budget, session-patch, safe-tool)
- DELETE: `tests/tools/prompt-skim.test.ts`, `prompt-analyze.test.ts`, `context-budget.test.ts`, `session-patch.test.ts`, `safe-tool.test.ts`
- DELETE: `tests/plugins/prompt-enhance.test.ts` (masks double-count bug)
- RENAME: `tests/tools/*-tool.test.ts` → `tests/tools/*.test.ts`
- KEEP ALL: `src/tools/*/`, schema kernel, hooks (with fixes), plugin (with fixes)

### Design Decisions (from harness-clean-design.md)

**Architecture after cleanup:**
- 4 tools (not 4 broken): prompt-skim, prompt-analyze, context-budget (rebuilt), session-patch (fixed regex)
- 2 hooks (not 1 broken): system-transform (gated), messages-transform (gated)
- 6 schemas (not 4): skim result, analysis finding, analysis result, context budget, session patch, enhanced output + pipeline state
- 1 plugin: prompt-enhance (single compaction path only, no double-count)
- 0 dead text injected into non-prompt-enhance sessions
- 0 broken references to non-existent agents
- 0 double-counting of compaction events

## Implications for Roadmap

This is a **brownfield cleanup** project, not a greenfield build. The roadmap should:

1. **Phase by bug severity** — HIGH bugs first (double-compaction, heading corruption, phantom agents)
2. **Consolidate before fixing** — delete .opencode/tools/ and old tests first to reduce surface area
3. **Fix functional bugs** — regex anchoring, cross-line detection, gating logic
4. **Rebuild fake models** — context-budget with real OpenCode data
5. **Verify end-to-end** — all tests pass, no false positives, explicit double-count test

**Suggested phase structure:**
- Phase 1: Foundation — delete dead code, consolidate duplicates
- Phase 2: HIGH bugs — fix double-compaction, heading corruption, orchestrator
- Phase 3: MEDIUM bugs — gate system-transform, fix prompt-analyze
- Phase 4: LOW bugs + rebuild — context-budget real model, test consolidation
- Phase 5: Verification — full test suite, typecheck, build

## Watch Out For

1. **Don't break working tools** — src/tools/ are functional, only fix confirmed bugs
2. **Don't touch runtime state files** — .hivemind/ is runtime output, not source
3. **Don't remove schemas prematurely** — EnhancedPromptOutputSchema and PipelineStateSchema are contracts
4. **Test the fix, not the bug** — prompt-enhance.test.ts should verify single-compaction path works
5. **Keep tool-helpers** — 5 LOC convention anchor, costs nothing to maintain
