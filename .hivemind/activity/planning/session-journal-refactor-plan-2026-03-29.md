# Session Journal Refactor Plan

**Plan ID:** plan-2026-03-29-session-journal-refactor  
**Created:** 2026-03-29T17:24:32+07:00  
**Status:** Validated — ready for execution  
**Phases:** 13  
**Critical Path Length:** 6 phases  
**Parallel Waves:** 7  

---

## Goal

Refactor the HiveMind session journal system to:
1. Fix write-side output (file naming, header format, tool I/O, model extraction, duration, noise)
2. Activate read-side incremental processing (parser → classifier → synthesizer → index)
3. Clean infrastructure (remove dead code, consolidate paths, unify error logs, remove V2)

---

## Requirement Classification

| Bucket | Count | Key Requirements |
|--------|-------|-----------------|
| **Functional** | 8 | File naming, header format, tool I/O, model extraction, duration, noise, subsession embedding |
| **Non-Functional** | 3 | TDD, incremental processing, phase gatekeeping |
| **Integration** | 7 | Read-side wiring (4), path consolidation, error-log unification, main-session-only |
| **Risk/Compliance** | 3 | Dead code removal, SessionV2 removal, symlink removal |
| **Operations** | 0 | — |

---

## Phase Map

### Wave 1 — Foundation (parallel, no dependencies)

| Phase | Concern | Files | Gate |
|-------|---------|-------|------|
| `01-path-consolidation` | Consolidate path authority to paths.ts | paths.ts, session-structure.ts | `tsc + paths tests` |
| `02-dead-code-removal` | Remove deprecated writer chain | session-writers.ts, session-writer.ts, events-writer.ts, diagnostics-writer.ts, hivemind-journal.ts | `tsc + test` |
| `03-types-cleanup` | Remove SessionV2, keep V3 | types.ts | `tsc + types tests` |

### Wave 2 — Core Writer Refactor (sequential)

| Phase | Concern | Files | Dependencies | Gate |
|-------|---------|-------|-------------|------|
| `04-consolidated-writer-refactor` | V3-only, SDK ID naming, LOC < 300 | consolidated-writer.ts, *.test.ts (×2) | 01, 02, 03 | `tsc + consolidated-writer tests` |

### Wave 3 — Write-Side Fixes (parallel)

| Phase | Concern | Files | Dependencies | Gate |
|-------|---------|-------|-------------|------|
| `05-markdown-writer-refactor` | Header format, model, duration, noise | markdown-writer.ts, *.test.ts | 04 | `tsc + markdown-writer tests` |
| `06-tool-handler-fixes` | Tool input args, tool output.output | tool-execution-handler.ts, text-complete-handler.ts | 04 | `tsc + tool-execution tests` |

### Wave 4 — Hook + Classifier Updates (parallel)

| Phase | Concern | Files | Dependencies | Gate |
|-------|---------|-------|-------------|------|
| `07-event-handler-updates` | Duration tracking, lifecycle timestamps | event-handler.ts | 05 | `tsc + event-handler tests` |
| `08-hook-handler-updates` | Chat/compaction format, subsession embedding, symlink removal | chat-message-handler.ts, compaction-handler.ts, session-resolver.ts | 05 | `tsc + chat/compaction tests` |
| `09-classifier-adapter-update` | Remove deprecated writer imports | writer-adapter.ts, event-classifier.ts | 02 | `tsc + classifier tests` |

### Wave 5 — Read-Side Activation + Cleanup (parallel)

| Phase | Concern | Files | Dependencies | Gate |
|-------|---------|-------|-------------|------|
| `10-read-side-wiring` | Incremental parser → classifier → synthesizer → index | turn-parser.ts, event-classifier.ts, synthesizer.ts, index-writer.ts, tool-execution-handler.ts | 07, 08, 09 | `tsc + test` |
| `11-session-resolver-cleanup` | Simplify to direct SDK ID resolution | session-resolver.ts | 01, 04 | `tsc + session-resolver tests` |

### Wave 6 — Infrastructure Cleanup

| Phase | Concern | Files | Dependencies | Gate |
|-------|---------|-------|-------------|------|
| `12-error-log-unification` | Single error-log format | error-log-writer.ts, event-handler.ts | 07 | `tsc + error-log tests` |

### Wave 7 — Verification

| Phase | Concern | Files | Dependencies | Gate |
|-------|---------|-------|-------------|------|
| `13-integration-verification` | Full integration test | (all) | 10, 11, 12 | `tsc + test + build` |

---

## Critical Path

```
03-types-cleanup
  → 04-consolidated-writer-refactor
    → 05-markdown-writer-refactor
      → 07-event-handler-updates
        → 10-read-side-wiring
          → 13-integration-verification
```

**Critical path length:** 6 phases  
**Total phases:** 13  
**Max parallelism:** 3 phases (Wave 1 and Wave 4)

---

## Parallel Wave Analysis

| Wave | Phases | Rationale |
|------|--------|-----------|
| 1 | 01, 02, 03 | Zero deps, no shared files |
| 2 | 04 | Depends on all wave-1 phases |
| 3 | 05, 06 | Both depend only on 04, no shared files |
| 4 | 07, 08, 09 | 07+08 depend on 05; 09 depends on 02; no shared mutable files |
| 5 | 10, 11 | 10 depends on 07+08+09; 11 depends on 01+04; parallel safe |
| 6 | 12 | Depends on 07 |
| 7 | 13 | Final gate, depends on all |

**Estimated delegation count:** 13 phases × 1 delegation each = 13 delegations  
**With parallelism:** ~7 sequential steps if max parallel dispatch

---

## LOC Reduction Targets

| File | Current LOC | Target | Strategy |
|------|-------------|--------|----------|
| consolidated-writer.ts | 665 | <300 | Remove V2 code, extract helpers |
| event-handler.ts | 608 | <300 | Extract lifecycle helpers, remove noise handling |
| markdown-writer.ts | 545 | <300 | Simplify format, extract rendering helpers |
| types.ts | 366 | <300 | Remove SessionV2 and V2-specific types |

---

## Risk Register

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| hivemind-journal.ts breaks when session-writers deleted | High | High | Update hivemind-journal.ts FIRST in phase 02 |
| Classifier fails after events-writer.ts deleted | Medium | High | Phase 09 updates writer-adapter.ts before verification |
| Read-side parser fails on new markdown format | Medium | Medium | Parser updates in phase 10 after format finalized in 05 |
| LOC reduction introduces regressions | Low | High | TDD: failing tests first, incrementally pass |

---

## Gate Protocol

Every phase gate runs:
1. `npx tsc --noEmit` — zero type errors
2. `npm test -- --testPathPattern={phase-pattern}` — targeted tests pass
3. Phase 13 runs full `npm test && npm run build`

**Evidence required:** Command output with exit code 0. No agent claims without output.

---

## Carry Forward (≤5 items)

1. consolidated-writer.ts is 665 LOC — must be split below 300
2. classifier/writer-adapter.ts is the ONLY read→write bridge — must update import after dead code removal
3. hivemind-journal.ts is the sole consumer of deprecated session-writers.ts — must update before deletion
4. Parser expects old markdown format — must update after format changes in phase 05
5. Symlink removal touches session-resolver.ts AND consolidated-writer.ts — coordinate across phases 04 and 08
