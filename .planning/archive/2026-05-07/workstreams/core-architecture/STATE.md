---
id: WS-CA
type: state
created: 2026-05-06
updated: 2026-05-06
status: active
lineage: shared
---

# WS-CA: Core Architecture — State

## Current Phase: CA-02 (PLANNED ✅ — 2 plans, 2 waves)

### CA-02 Planning
- **Status:** Ready to execute
- **Plans:** 2 (Wave 1: core module, Wave 2: integration)
- **CA-02-01:** Core types + profiles lookup + resolution + unit tests (Wave 1)
- **CA-02-02:** Hooks + plugin + delegation + category gates integration (Wave 2, depends on 01)
- **Requirements mapped:** REQ-CA02-01 through REQ-CA02-09 (all 9 covered)
- **Decisions covered:** D-01 through D-14 (all 14 addressed)

### CA-02 Context (Carried Forward)
- **CA-02-CONTEXT**: Behavioral profile system designed (commit `1f261894`)
  - Mode→behavior mapping: static lookup table with 4-field behavioral profile
  - Language config injection via system.transform hook
  - Profile merge: config-first with runtime fallback into unified ResolvedBehavioralProfile
  - Consumers: system.transform, task/coordination tools, category gates (skillFilter)
  - Discuss mode: included as profile signal (dispatch deferred to WS-4)

### CA-01 Results (Carried Forward)
- **CA-01-01**: Schema expanded to skeleton v2 §9.1 (44 tests, commit `75339362`)
- **CA-01-02**: Config subscriber + runtime binding (8 tests, commits `660537d5`, `89e11dfd`)
- **Decisions completed**: D-CONF-01, D-CONF-04, D-CONF-05, D-BIND-01, D-BIND-02

## Next Phase: CA-03 (Workflow Toggle Runtime Binding)

## Source Decisions

From WS-1 Restructuring CONTEXT.md (2026-05-06):
- D-CONF-01..05: configs.json full schema, behavioral profiles, loading rules
- D-BIND-01..03: Subscription-based runtime binding model
- D-CRUD-01..05: CRUD operation lifecycle
- D-LIFECYCLE-01..02: Lifecycle integration requirements

## Verification Baseline

- `npm run typecheck` — 0 errors
- `npm test` — 1656 passed, 2 failed (pre-existing session-journal) (2026-05-06)
- `npm run build` — Pass
- Schema tests — 44 passed (hivemind-configs.schema.test.ts)
- Config subscriber tests — 8 passed (config-subscriber.test.ts)

