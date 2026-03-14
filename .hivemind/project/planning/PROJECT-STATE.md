# Project State

> Rolling operational snapshot for the generated planning ledger.

## Current Position
Cycle 3A is active: planning authority normalization is restoring the generated ledger, collapsing the root plan backlog, and protecting compatibility until later lineage import/quarantine.

## Current Focus
Phase 00-control-plane is active.

## Active Blockers
- Root `docs/plans/` backlog must be normalized into one active set plus archived history.
- `.hivemind/project/planning/` must stay additive while `STATE.md` compatibility remains in use.
- Session import/quarantine is intentionally deferred until the next cycle closes this planning tranche.

## Recent Decisions
- Keep the three-tier authority stack fixed:
  - root `AGENTS.md` -> dated governance doc
  - root `PLAN.md` -> dated master plan
  - `.hivemind/project/planning/` -> generated operational ledger
- Keep `STATE.md` as a compatibility mirror during Cycle 3A.
- Keep `.hivemind/sessions/archive/` compatibility-only until writer authority remap.
