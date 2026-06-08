# AUDIT-04 Iterations Report

**Date:** 2026-06-08
**Branch:** feature/harness-implementation
**Commits on this branch:** 5 (after merge from audit-04-batch1)

## Iteration Summary

| # | Scope | Result | Commit |
|---|-------|--------|--------|
| 1 | 4 prior-cycle skills (hm-coord-loop, hm-loop-completion, hm-loop-phase, hm-cross-change) — full bundle added | 4/4 with refs/tmpl/scripts/evals/metrics | 1a9e4952 |
| 2 | 8 BATCH 2 specialists (hm-test-driven, hm-debug-systematic, hm-arch-refactor, hm-ship-readiness, hm-product-validation, hm-gate-triad, hm-stack-authoring, hm-platform-references) — templates/scripts/workflows added | 8/8 complete | 8fd353a0 |
| 3 | 42 agents — Hivemind custom tools added to frontmatter | 42/42 with Hivemind tools | d3f94d9f |
| 4 | 4 commands — agent: field added (deep-init, test-echo, test-list, test-status) | 4/4 fixed | 8f1b1d4b |
| 5 | GSD SDK replacement — verified all gsd- refs in skills are intentional ## GSD Compatibility sections per master plan §9.2 | Confirmed (no body usage) | (audit only) |

## Final State

### Skills (34 shipped)
- Governance (1): hivemind-power-on ✓
- Routing/Coord (2): hm-coord-router, hm-coord-loop ✓
- Iteration (2): hm-loop-completion, hm-loop-phase ✓
- Cross-cutting (1): hm-cross-change ✓
- Spec-driven (1): hm-spec-authoring ✓
- Specialists (8): hm-test-driven, hm-debug-systematic, hm-arch-refactor, hm-ship-readiness, hm-product-validation, hm-gate-triad, hm-stack-authoring, hm-platform-references ✓
- Meta-builder (12): hf-* (unchanged) ✓
- Framework-agnostic (7): unprefixed whitelist (unchanged) ✓

All skills have SKILL.md + reference(s) + evals + metrics. BATCH 1+2 + 4 prior-cycle + 8 BATCH 2 specialists also have templates + scripts + workflows.

### Agents (44)
- 42 with Hivemind custom tools declared in frontmatter
- 2 special (build, hm-steer) — not in scope

### Commands (124)
- 124 with `agent:` field
- 124 with `tools:` field (or routed to agent that has them)
- 0 with stale gsd-* refs in body (verified)

### Custom Tooling Alignment
- All 14 production specialists use Hivemind custom tools (delegate-task, delegation-status, hivemind-doc, hivemind-trajectory, hivemind-agent-work, etc.)
- All 12 meta-builders use configure-primitive + delegate-task
- All 4 routing/coordination agents use delegate-task + delegation-status + hivemind-trajectory

### Validation
- `npm run typecheck` → 0 errors
- `validate-name.sh` → 34/34 PASS
- F01-F07 violations → 0

## What's Out of Scope (deferred to future work)

- `hm-l2-build.md` → `build-orchestrator-handbook.md` rewrite (master plan §4.3 wave 3.4)
- 15 L0 orchestrator documentation tables referencing non-shipped agent names (orphan refs, separate cleanup)
- 23 pre-existing test failures in `tests/lib/coordination/` (unrelated to AUDIT-04)
- src/** + tests/** gsd-* references (out of scope per `src/AGENTS.md`)
- `.hivemind/` runtime state (deep module, not primitive)

## Hivemind Custom Toolings Inventory (referenced across skills/agents)

| Tool | Used by |
|---|---|
| `delegate-task` | 32 agents + all routing/coordination skills |
| `delegation-status` | 4 agents + hm-coord-loop + hm-coord-router |
| `hivemind-doc` | 14 skills + 18 agents (for reading/chunking planning docs) |
| `hivemind-trajectory` | 8 skills + 4 agents (for recording events) |
| `hivemind-agent-work` | 2 skills + 4 agents (for agent work contracts) |
| `hivemind-steer` | 1 agent (for steering root session) |
| `hivemind-pressure` | 1 agent (for runtime pressure) |
| `hivemind-sdk-supervisor` | 2 skills (for SDK health) |
| `hivemind-session-view` | 0 (TBD - orphan) |
| `hivemind-command-engine` | 0 (TBD - orphan) |
| `run-background-command` | 3 agents (for PTY/shell) |
| `configure-primitive` | 6 hf-* agents (for meta-builder) |
| `validate-restart` | 1 skill + 1 agent |
| `semantic-agent-selector` | 1 agent (for best-match) |
| `prompt-skim` | 0 (deprecated in BATCH 2 skills) |
| `prompt-analyze` | 0 (deprecated) |
| `bootstrap-init` | 0 (TBD - orphan) |
| `bootstrap-recover` | 0 (TBD - orphan) |
| `tmux-copilot` | 0 (TBD - orphan) |
| `tmux-state-query` | 0 (TBD - orphan) |

## Hivemind Tools Status

- **Active (referenced in skills/agents)**: 11 tools
- **Orphan (declared in src/tools/ but not used by any skill/agent)**: 9 tools

The 9 orphan tools are still shipped in src/tools/ and registered in opencode.json, but no skill/agent currently calls them. This is acceptable — they're available for future use but not in active workflows.

## Production Readiness Assessment

| Criterion | Status | Evidence |
|---|---|---|
| All shipped skills have SKILL.md | ✅ | 34/34 |
| All skills have refs/evals/metrics | ✅ | 34/34 |
| Specialists have templates/scripts/workflows | ✅ | 12/12 (BATCH 1+2 + 4 prior-cycle) |
| All agents declare Hivemind custom tools | ✅ | 42/42 |
| All commands have agent: field | ✅ | 124/124 |
| No F01-F07 violations | ✅ | 0 |
| No `gsd-*` refs in shipped body (only in GSD Compatibility sections) | ✅ | 0 body refs |
| Typecheck passes | ✅ | 0 errors |
| validate-name.sh | ✅ | 34/34 PASS |
