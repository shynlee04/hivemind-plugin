---
id: WS-CA
type: roadmap
created: 2026-05-06
updated: 2026-05-06
status: active
lineage: shared
---

# WS-CA: Core Architecture — Roadmap

**Purpose:** Absorb HER (harness-ecosystem-recovery) + WS-1 state architecture fixes + WS-3 primitive registry + configs.json runtime binding into a single coherent workstream.

**Dependency Order:** Core Architecture must complete before Agent Workflows can bind to registries.

## Phase Overview

| Phase | Title | Status | Dependencies |
|-------|-------|--------|-------------|
| CA-01 | configs.json Schema Expansion + Runtime Binding | PLANNED | WS-1 (COMPLETE) |
| CA-02 | Behavioral Profile System + Mode Dispatch | PLANNED | CA-01 |
| CA-03 | Workflow Toggle Runtime Binding | PLANNED | CA-01 |
| CA-04 | CRUD Ownership Modules + Lifecycle Verification | PLANNED | CA-01, CA-02 |

## Checkpoint

- **CP-CA-1:** configs.json full schema operational, readConfigs() wired into runtime
- **CP-CA-2:** Mode → behavioral profile mapping produces observable behavior changes
- **CP-CA-3:** Every workflow toggle has a concrete runtime consumer
- **CP-CA-4:** Every .hivemind/ subdirectory has an owning module with typed CRUD

## Downstream Unblocks

Once Core Architecture is complete:
- **Agent Workflows** → can register primitives, bind delegation modes
- **User Experience** → can expose config in CLI/sidecar
- **HER-3** → can follow state architecture patterns

## Decision References

All decisions from WS-1 Restructuring CONTEXT.md apply:
- D-CONF-01..05: configs.json schema and loading rules
- D-BIND-01..03: Schema-to-runtime binding model
- D-CRUD-01..05: CRUD lifecycle
- D-LIFECYCLE-01..02: Lifecycle integration requirements
