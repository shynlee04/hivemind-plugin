# Tool Refactoring Plan — HiveMind Plugin

**Created:** 2026-03-31
**Status:** Planning Complete — Awaiting Execution Authorization
**Branch:** v2.9.5-detox-dev (worktree)

---

## Context

Refactoring the 12 custom tools system following an 8-principle evaluation framework. Goal: consolidate, clean up, and enhance tools to be architecturally sound while keeping doc-intelligence read-only and ensuring tools are superior utilities for AI agents.

## 8-Principle Framework

1. Tools must have clear descriptions showing distinct use cases and superiority
2. Serve many high-frequency use cases, not niche ones
3. No conflicts/overlap; no cumbersome preconditions
4. Low friction — usable mid-run, not too many required fields
5. Well-designed granularity with routing and combinations
6. Linked with HiveMind concepts (trajectory, delegation, workflow, contracts)
7. Don't replace innate tools unless clearly superior
8. Tools = utilities of superiority that make agents think like human experts

## Final Tool Taxonomy (12 → 11 tools)

| # | Tool | Actions | Directory | Change |
|---|------|---------|-----------|--------|
| 1 | `hivemind_trajectory` | 6 | `src/tools/trajectory/` | CANONICAL — no changes |
| 2 | `hivemind_task` | 7 | `src/tools/task/` | Fix redundant async |
| 3 | `hivemind_handoff` | 6 | `src/tools/handoff/` | Group Zod args (20 flat → 6 grouped) |
| 4 | `hivemind_doc` | 6 | `src/tools/doc/` | Add `search_symbols`, fix routing/security/glob bugs |
| 5 | `hivemind_runtime` | 2 | `src/tools/runtime/` | MERGED from status+command tools |
| 6 | `hivemind_journal` | 6 | `src/tools/journal/` | MOVED from flat file to directory |
| 7 | `hivemind_agent_work` | 4 | `src/tools/agent-work/` | MERGED contracts+classify |
| 8 | `hivemind_hm_init` | 1 | `src/tools/hm-init/` | Renamed from hivefiver-init |
| 9 | `hivemind_hm_doctor` | 1 | `src/tools/hm-doctor/` | Renamed from hivefiver-doctor |
| 10 | `hivemind_hm_setting` | 1 | `src/tools/hm-setting/` | SPLIT (1,121 LOC → ~150 tool + ~350 features) |

## Key Decisions

| Decision | Verdict | Rationale |
|----------|---------|-----------|
| Doc writes | NO — stay read-only | P7: Don't replace innate write/edit tools |
| `search_symbols` action | YES — add to doc tool | P7: Superior to innate grep (structured extraction) |
| Handoff 6 interfaces | KEEP as-is | Proper ≤10-field decomposition |
| Handoff Zod args | GROUP from 20 flat → 6 grouped | Better agent comprehension |
| Runtime tools | MERGE → single tool (2 actions) | P3: Same domain, no overlap |
| Contract tools | MERGE → single tool (4 actions) | P3: Same domain |
| Journal | MOVE to `src/tools/journal/` directory | P6: Harmonize with canonical pattern |
| Task async | FIX — remove redundant async | Consistency |
| `hm_setting` | SPLIT aggressively | ≤300 LOC rule violated (1,121 LOC) |
| Dead code | DELETE `doc-surface-router.ts` | P2: No zombie code |
| Upward imports | FIX — move pressure contracts to `src/shared/` | Architecture violation |
| Legacy recovery | SKIP entirely | Archive = re-exported schemas, not dropped features |

## Execution Phases

### Phase 0 (CRITICAL — TDD First)
Write regression tests for 5 untested core tools BEFORE any structural changes.
- `hivemind_task` — test registration, action routing, feature dispatch
- `hivemind_trajectory` — test registration, action routing, feature dispatch
- `hivemind_handoff` — test registration, action routing, feature dispatch
- `hivemind_doc` — test registration, action routing, feature dispatch
- `hivemind_runtime` — test registration, action routing, feature dispatch

**Gate:** `npm test` passes for all new tests.

### Phase 1 (Safe Structural Cleanup)
- Move `hivemind-journal.ts` → `src/tools/journal/` directory structure
- Fix `task/tools.ts` redundant async
- Delete `doc-surface-router.ts` (dead code)
- Merge runtime tools: `status` + `command` → single `hivemind_runtime` tool
- Merge contract tools: create+export+classify → `hivemind_agent_work`
- Fix upward imports: move pressure contracts to `src/shared/`
- Rename directories: `hivefiver-*` → `hm-*`
- Update `src/tools/index.ts` catalog (12 → 11 entries)
- Update `src/plugin/opencode-plugin.ts` import paths

**Gate:** `npx tsc --noEmit` + `npm test` pass.

### Phase 2 (Doc Intelligence Enhancements)
- Add `search_symbols` action to doc tool
- Fix regex injection in `read-ops.ts`
- Fix glob filtering in `read-ops.ts`
- Fix case-insensitive heading lookup in `formats/md.ts`
- Fix frontmatter parsing
- Switch if-chain → switch/case routing
- Enhance tool descriptions for agent clarity

**Gate:** `npx tsc --noEmit` + `npm test` pass.

### Phase 3 (hm_setting Split)
- Extract business logic from `hm_setting` (1,121 LOC → ~150 tool + ~350 features)
- Create `src/features/hm-setting/` with:
  - `dashboard-builder.ts`
  - `language-selector.ts`
  - `config-reader.ts`
- Update tool to delegate to feature modules

**Gate:** `npx tsc --noEmit` + `npm test` pass.

### Phase 4 (Documentation)
- Update AGENTS.md tool count (7 → 11)
- Update tool descriptions in `agentToolCatalog`
- Fix phantom test references
- Update `tool-audit-reconciled.md` with final state

**Gate:** Manual review of documentation accuracy.

## Files to Modify

### Source files
- `src/tools/index.ts` — tool catalog
- `src/tools/trajectory/` — NO CHANGES (canonical)
- `src/tools/task/tools.ts` — fix async
- `src/tools/handoff/tools.ts` — group Zod args
- `src/tools/doc/` — add search_symbols, fix bugs
- `src/tools/runtime/` — merge tools
- `src/tools/hivemind-journal.ts` — move to directory
- `src/tools/hivefiver-init/` → rename
- `src/tools/hivefiver-doctor/` → rename
- `src/tools/hivefiver-setting/` → split + rename
- `src/features/agent-work-contract/tools/` — merge into agent-work
- `src/intelligence/doc/doc-surface-router.ts` — DELETE
- `src/intelligence/doc/read-ops.ts` — fix security bugs
- `src/intelligence/doc/formats/md.ts` — fix heading lookup
- `src/plugin/opencode-plugin.ts` — update imports

### New files to create
- `src/tools/journal/` directory structure
- `src/tools/agent-work/` directory structure
- `src/features/hm-setting/` directory structure
- `src/shared/tool-schema-helpers.ts`
- `src/shared/action-types.ts`
- Phase 0 test files for 5 untested tools

## Dependencies Flow (Enforced)

```
Tool → Feature → Intelligence → stdlib
```

NEVER reverse. Tools depend only on SDK and Tier 1 (features/intelligence).

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Breaking existing tool consumers | Phase 0 tests catch regressions |
| hm_setting split too aggressive | Extract incrementally, verify each extraction |
| Doc tool changes break search | Test search_symbols against real codebase |
| Import path updates miss references | `npx tsc --noEmit` catches all |
| Worktree npm link issues | Verify with `npm run build` before each phase |
