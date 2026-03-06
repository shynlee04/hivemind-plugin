# Roadmap

## Phases

| Phase | Name | Status | Progress |
|-------|------|--------|----------|
| 1 | Bootstrap and composition audit | in_progress | 70% |
| 2 | Planning-root normalization | in_progress | 40% |
| 3 | Manual Devin packet wave | pending | 0% |
| 4 | Resynced long-haul master-plan replacement | pending | 0% |
| 5 | Planning-root population and workflow contract hardening | pending | 0% |
| 6 | Runtime return: QA/research workflow and deferred harness work | pending | 0% |

## Phase Notes

### Phase 1: Bootstrap and composition audit

- Trace how `.hivemind` is created during reset/init.
- Map what later runtime hooks and tools create, mutate, or derive.
- Separate deterministic state writers from readable SOT projections.

### Phase 2: Planning-root normalization

- Normalize code and guidance to `.hivemind/project/planning`.
- Keep `.planning/` as compatibility-only where needed during transition.
- Seed and enforce planning-local configuration and directory contracts.

### Phase 3: Manual Devin packet wave

- Author fresh dated question packets locally.
- Carry only validated local facts into Devin.
- Treat returned answers as synthesis input, not truth, until validated locally.

### Phase 4: Resynced long-haul master-plan replacement

- Merge March 6 baseline, composition audit, planning-root redesign, and validated external synthesis.
- Replace stale mixed packets and outdated future-tense items.

### Phase 5: Planning-root population and workflow contract hardening

- Populate codebase, phases, research, todos, and debug contracts as live SOT.
- Define the project-level workflow contract for phase planning, execution, verification, and milestone closeout.

### Phase 6: Runtime return

- Resume the deferred QA/research workflow contract implementation.
- Add direct GX-Pack fallback runtime coverage once the import surface is stable.
- Continue deeper prompt-surface cleanup only behind the current ownership and child-session tests.
