# Requirements: Harness Cleanup

**Defined:** 2026-04-06
**Core Value:** Every remaining component helps an AI agent complete its workflow — no dead code, no false positives, no phantom references.

## v1 Requirements

### Dead Code Removal

- [ ] **DEAD-01**: Delete `.opencode/tools/` directory (all 5 files: prompt-skim, prompt-analyze, context-budget, session-patch, safe-tool)
- [ ] **DEAD-02**: Delete duplicate test files (`tests/tools/prompt-skim.test.ts`, `prompt-analyze.test.ts`, `context-budget.test.ts`, `session-patch.test.ts`, `safe-tool.test.ts`)
- [ ] **DEAD-03**: Delete `tests/plugins/prompt-enhance.test.ts` (masks double-count bug)

### Test Consolidation

- [ ] **TEST-01**: Rename `tests/tools/*-tool.test.ts` files to `tests/tools/*.test.ts`

### HIGH: Critical Bugs

- [ ] **HIGH-01**: Fix double-compaction counting — remove event hook's `session.compacted` handling, keep only `experimental.session.compacting`
- [ ] **HIGH-02**: Fix session-patch heading corruption — anchor regex to line start: `(?:^|\n)(${escapedSection})[\s\S]*?(?=\n## |$)`
- [ ] **HIGH-03**: Fix orchestrator references to 5 non-existent agents — either define missing agents or route to existing researcher/builder/critic

### MEDIUM: Functional Bugs

- [ ] **MED-01**: Gate system-transform by delegation metadata — prevent 804-char injection into non-prompt-enhance sessions
- [ ] **MED-02**: Fix prompt-analyze to detect cross-line contradictions — compare all line pairs, not just within single lines

### LOW: Model & Quality

- [ ] **LOW-01**: Rebuild context-budget with real OpenCode compaction data — replace fake 15% linear model
- [ ] **LOW-02**: Remove `prompt-skim` recommended_lanes (phantom agent references)
- [ ] **LOW-03**: Remove system-transform hook wiring from plugin.ts
- [ ] **LOW-04**: Remove PromptEnhancePlugin event forwarding for compaction from plugin.ts

### Quality Gates

- [ ] **QUAL-01**: Zero dead text injected into non-prompt-enhance sessions
- [ ] **QUAL-02**: Double-count scenario explicitly tested as NOT happening
- [ ] **QUAL-03**: `npm run typecheck` passes
- [ ] **QUAL-04**: `npm test` passes (all tests, no false positives)
- [ ] **QUAL-05**: `npm run build` passes

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Schema Consumers

- **SCHEMA-01**: Build consumer for PipelineStateSchema (schema exists but no consumer yet)
- **SCHEMA-02**: Wire EnhancedPromptOutputSchema as target contract for pipeline output

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Remove any src/tools/ components | All kept and fixed — all contribute to AI agent workflows |
| Remove EnhancedPromptOutputSchema | Defines pipeline's final deliverable — target contract |
| Remove PipelineStateSchema | Core orchestration concept — build consumer, don't kill contract |
| Remove tool-helpers.ts | 5 LOC convention anchor — scattering format across tools is worse |
| Touch .hivemind/ runtime state files | Runtime output, not source code — wrong category for cleanup |
| Add new features | This is cleanup only — no feature additions |
| Restructure plugin.ts beyond bug fixes | Minimal changes to fix confirmed bugs only |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DEAD-01 | Phase 1 | Pending |
| DEAD-02 | Phase 1 | Pending |
| DEAD-03 | Phase 1 | Pending |
| TEST-01 | Phase 1 | Pending |
| HIGH-01 | Phase 2 | Pending |
| HIGH-02 | Phase 2 | Pending |
| HIGH-03 | Phase 2 | Pending |
| MED-01 | Phase 3 | Pending |
| MED-02 | Phase 3 | Pending |
| LOW-01 | Phase 4 | Pending |
| LOW-02 | Phase 4 | Pending |
| LOW-03 | Phase 4 | Pending |
| LOW-04 | Phase 4 | Pending |
| QUAL-01 | Phase 5 | Pending |
| QUAL-02 | Phase 5 | Pending |
| QUAL-03 | Phase 5 | Pending |
| QUAL-04 | Phase 5 | Pending |
| QUAL-05 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-06*
*Last updated: 2026-04-06 after initial definition*
