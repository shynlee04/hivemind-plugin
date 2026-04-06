# Roadmap: Harness Cleanup

**Created:** 2026-04-06
**Granularity:** Fine
**Coverage:** 18/18 requirements mapped ✓

## Phases

- [ ] **Phase 1: Consolidate** - Delete dead code, consolidate duplicates, establish clean baseline
- [ ] **Phase 2: Critical Fixes** - Fix HIGH severity bugs (double-compaction, heading corruption, phantom agents)
- [ ] **Phase 3: Functional Fixes** - Fix MEDIUM severity bugs (system-transform gating, cross-line contradiction detection)
- [ ] **Phase 4: Rebuild & Polish** - Rebuild context-budget model, remove remaining LOW issues
- [ ] **Phase 5: Verification** - Full test suite, quality gates, zero-regression confirmation

## Phase Details

### Phase 1: Consolidate
**Goal**: Establish a clean codebase by removing dead code and consolidating duplicates
**Depends on**: Nothing (first phase)
**Requirements**: DEAD-01, DEAD-02, DEAD-03, TEST-01
**Success Criteria** (what must be TRUE):
  1. `.opencode/tools/` directory no longer exists — all 5 files deleted
  2. No duplicate test files remain in `tests/tools/` — old `*.test.ts` files deleted
  3. `tests/plugins/prompt-enhance.test.ts` deleted (no longer masks double-count bug)
  4. All remaining test files in `tests/tools/` follow `*.test.ts` naming convention (no `-tool.test.ts` suffix)
**Plans**: TBD

### Phase 2: Critical Fixes
**Goal**: Fix all HIGH severity bugs that break agent workflows
**Depends on**: Phase 1
**Requirements**: HIGH-01, HIGH-02, HIGH-03
**Success Criteria** (what must be TRUE):
  1. One compaction event increments count by 1 (not 2) — budget correctly decrements
  2. session-patch regex only matches exact heading level — `## Section` does not match `### Section`
  3. Orchestrator references only existing agents (researcher, builder, critic) OR execution loop removed entirely
**Plans**: TBD

### Phase 3: Functional Fixes
**Goal**: Fix MEDIUM severity bugs that degrade agent workflow quality
**Depends on**: Phase 2
**Requirements**: MED-01, MED-02
**Success Criteria** (what must be TRUE):
  1. system-transform hook injects zero text into sessions without prompt-enhance delegation metadata
  2. prompt-analyze detects contradictions that span multiple lines (not just within single lines)
**Plans**: TBD

### Phase 4: Rebuild & Polish
**Goal**: Rebuild fake models and remove remaining LOW severity issues
**Depends on**: Phase 3
**Requirements**: LOW-01, LOW-02, LOW-03, LOW-04
**Success Criteria** (what must be TRUE):
  1. context-budget uses real OpenCode compaction data (not hardcoded 15% per compaction)
  2. prompt-skim output contains no `recommended_lanes` field
  3. plugin.ts has no system-transform hook wiring
  4. plugin.ts has no PromptEnhancePlugin event forwarding for compaction
**Plans**: TBD

### Phase 5: Verification
**Goal**: Confirm zero regressions, all quality gates pass, no dead text injection
**Depends on**: Phase 4
**Requirements**: QUAL-01, QUAL-02, QUAL-03, QUAL-04, QUAL-05
**Success Criteria** (what must be TRUE):
  1. Zero dead text injected into sessions that are not prompt-enhance sessions
  2. Test suite includes explicit test verifying double-compaction does NOT occur
  3. `npm run typecheck` exits with code 0
  4. `npm test` exits with code 0 (all tests pass, no false positives)
  5. `npm run build` exits with code 0
**Plans**: TBD

## Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Consolidate | 0/4 | Not started | - |
| 2. Critical Fixes | 0/3 | Not started | - |
| 3. Functional Fixes | 0/2 | Not started | - |
| 4. Rebuild & Polish | 0/4 | Not started | - |
| 5. Verification | 0/5 | Not started | - |

## Dependencies

```
Phase 1: Consolidate
  └─→ Phase 2: Critical Fixes
       └─→ Phase 3: Functional Fixes
            └─→ Phase 4: Rebuild & Polish
                 └─→ Phase 5: Verification
```

**Rationale for ordering:**
- Phase 1 first: Remove dead code before fixing bugs in it (waste not)
- Phase 2 before 3: HIGH bugs before MEDIUM (severity ordering)
- Phase 3 before 4: Functional fixes before model rebuild (fix what exists, then rebuild)
- Phase 5 last: Verification requires all fixes in place

---
*Roadmap created: 2026-04-06*
*Last updated: 2026-04-06 after initial creation*
