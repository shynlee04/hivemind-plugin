# Roadmap

> Source: Master Plan v2.1 (`docs/plans/2026-02-27-hybrid-ab-master-plan.md`)
> Priority Model: 3-RANK Problem Hierarchy
> Execution Model: Iterative traversal, dependency-driven, not linear

## Phases

| Phase | Name | RANK | Status | Progress | Gate |
|-------|------|------|--------|----------|------|
| 0 | Brownfield Codebase Mapping | — | ✅ complete | 100% | 7 docs, 2944 lines |
| β / S2-01 | Context Injection Remediation | 1 | pending | 0% | <1200 tokens/turn, 0 P0 duplication |
| γ / S2-02 | Tools & Mechanism Hygiene | 2 | blocked_by_S2-01 | 0% | 0 unintended .hivemind/ writes |
| δ / S2-03 | Auto-Session + Memory Lifecycle | 3 | blocked_by_S2-01_S2-02 | 0% | Auto-session §3A implemented |
| S2-MIL | Sector-2 Robust/Safe Milestone (Hard Unlock) | — | blocked_by_S2-01_S2-02_S2-03 | 0% | All S2 transition guards + reality evidence satisfied |
| ε / S1-01 | Progressive Disclosure | — | BLOCKED_by_S2-MIL | 0% | L0-L3 loader + token budgets |
| ζ / S1-02 | Code Intelligence + Observability | — | BLOCKED_by_S2-MIL | 0% | codemap/codewiki populated |
| S1-03 | Sector-1 Capability Expansion (post-ζ scope) | — | BLOCKED_by_S2-MIL | 0% | Phase plan approved after S2 unlock |

## Locked Phase Order

`S2-01 -> S2-02 -> S2-03 -> S2-MIL -> S1-01 -> S1-02 -> S1-03`

- `S2-MIL` is a hard unlock milestone. No Sector-1 implementation phase may start or close before `S2-MIL` passes.
- Static lint/type gates alone are insufficient for phase closure; each closure must include agent/workflow run evidence artifacts.

## Dependency Graph

```
[DONE] Wave 1 -> Wave α -> Phase 0
                           |
                           v
                        S2-01 -> S2-02 -> S2-03 -> S2-MIL (HARD UNLOCK)
                                                     |
                                                     +-- if S2-MIL = PASS --> S1-01 -> S1-02 -> S1-03
                                                     |
                                                     +-- if S2-MIL != PASS --> Sector-1 remains BLOCKED
```

## Transition Guards (Phase Boundary Enforcement)

At every phase boundary, enforce these anti-pattern gates before advancing:

- `D-02`: no bypass of required plan/gate sequence.
- `D-07`: no unvalidated structural/governance changes crossing boundary.
- `D-10`: no progression on stale or unresolved artifacts.
- `D-13`: no broken dependency chain; parent/child order must remain intact.
- `D-14`: no session-rot carryover; drift/context must be realigned before promotion.

Boundary closeout requires both:

- static checks (`npm test`, `npx tsc --noEmit`, plus phase-specific checks), and
- reality-validation artifacts from real agent/workflow runs (run logs, execution traces, and linked evidence anchors).

## Phase Details

### Phase 0: Brownfield Codebase Mapping ✅

**Deliverables** (all in `.hivemind/project/planning/codebase/`):
- `STACK.md` (240L) — Languages, frameworks, dependencies, build tools
- `ARCHITECTURE.md` (459L) — Layer map, init sequence, dependency flow, injection pipeline
- `CONVENTIONS.md` (710L) — 11 convention areas, 7 inconsistencies documented
- `CONCERNS.md` (424L) — 22 concerns (3 P0, 6 P1, 8 P2, 5 P3)
- `INTEGRATIONS.md` (235L) — Zero external services, fully offline
- `STRUCTURE.md` (310L) — Full directory tree with file/line counts
- `TESTING.md` (566L) — 2 harness styles, 6 mock patterns, 10 guidelines

**Meta-Concern**: This mapping was done manually by dispatching AI agents. The framework itself should automate this via its code-intel engines (`hivemind_codemap`, `hivemind_read_skeleton`, `hivemind_mesh_pull`), hooks, and schema graph. The fact that it cannot is a gap that feeds into Wave ζ.

### Wave β: Context Injection Remediation (RANK 1)

**Objective**: Eliminate duplication and pollution across context channels.

| Knot | Task | Surfaces | Status |
|------|------|----------|--------|
| β.1 | Remove P0 duplications (checklist, confirmation) | session-lifecycle.ts, messages-transform.ts | pending |
| β.2 | Remove P0 pollution (task block, ignored counter, tool hints) | session-lifecycle.ts, helpers | pending |
| β.3 | Conditionalize MT-03 auto-realign | messages-transform.ts | pending |
| β.4 | Wire Wave α libs into safe insertion points | event-consumers.ts, event-handler.ts, session-engine.ts | pending |
| β.5 | Add cross-channel dedup | session-lifecycle.ts, messages-transform.ts, shared utility | pending |
| β.6 | Verify with isolated tests + typecheck | tests/*, npm test, tsc | pending |

**Acceptance**: Steady-state <1200 tokens/turn, 0 P0 duplications, 0 P0 pollution, Wave α wired.

### Wave γ: Tools & Mechanism Hygiene (RANK 2)

5 knots covering event listener audit, zombie JSON cleanup, tool naming conflicts, deterministic export contracts.

### Wave δ: Auto-Session + Memory Lifecycle (RANK 3)

6 knots covering auto-new-session (§3A), memory auto-classification, category sorting, STATE.md auto-persistence, TODO-Pending routing.

### Wave ε: Progressive Disclosure

4 knots covering skill-loader resolver, L0-L3 escalation, token budgets.

### Wave ζ: Code Intelligence + Observability

4 knots covering codemap auto-scan, codewiki auto-generation, chain trace logging, context-poisoning failure signatures.

## Prior Completed Work

| Deliverable | Status | Evidence |
|-------------|--------|----------|
| Wave 1A: 12/12 router commands with required_references + required_prompts | ✅ | anchor `wave-1-completion` |
| Wave 1B: `.hivemind/project/planning/` bootstrapped | ✅ | anchor `wave-1-completion` |
| Smart Merge Sync | ✅ | anchor `smart-merge-sync` |
| Framework Auditor Skill Pack (10 files, 2811L) | ✅ | anchor `framework-auditor-complete` |
| Wave 2-P0 Audit Blockers (S-01, D-07, D-12) | ✅ | anchor `audit-2026-02-28` |
| Wave α libs (3 files, bug-free, UNWIRED) | ✅ code / ❌ integration | anchor `wave-alpha-complete-2026-02-28` |
| Config dead code removal | ✅ | anchor `wave-alpha-complete-2026-02-28` |
| Master Plan v2.1 (595L) | ✅ | anchor `master-plan-v2.1-complete` |
| Context injection 3-agent trace | ✅ | research cache 2026-02-28 |
| Gate baseline: 1386 PASS / 0 FAIL, 215/215 tests, 0 tsc errors | ✅ | anchor `wave-1-completion` |
