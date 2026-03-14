# Ecosystem Control Master Plan

Date: 2026-03-07
Status: active-master
Type: master-plan

## Goal

Control the refactor as one ecosystem across authored source, execution/control, persisted results, and lineage/governance planes while keeping current runtime cleanup inside one subordinate execution workstream.

## Primary Decision

The project now uses an ecosystem-control model with an explicit execution constitution.

That means:

- the top-level master governs the whole system
- implementation work is only allowed through approved workstreams
- runtime context cleanup remains active, but only as Workstream B inside that system
- governance and lifecycle implementation stay closed until the ecosystem control plane promotes them

## Ecosystem Planes

### Plane 1: Source

Canonical authored surfaces:

- `src/**`
- root framework asset folders

Derived or projected surfaces:

- `.opencode/**`

### Plane 2: Execution And Control

Automatic control machinery:

- init and sync paths
- runtime hooks
- tools and tool registry
- plugin adapters and fallback hooks

### Plane 3: Result And Persistence

Generated or accumulated surfaces:

- `.hivemind/state/**`
- `.hivemind/sessions/**`
- `.hivemind/graph/**`
- `.hivemind/project/planning/**`
- handoffs and checkpoints

### Plane 4: Lineage And Governance

Coordination surfaces:

- `hivefiver`
- `hiveminder`
- shared entry rules
- AGENTS and contamination guardrails

## Execution Constitution

The ecosystem master now governs two modes of work:

1. planning/control work
2. implementation work

Implementation work must follow:

- `docs/plans/ecosystem-subagent-tdd-execution-constitution-2026-03-07.md`
- explicit workstream-local gates
- bounded write scopes
- red-green verification
- PASS/FAIL review before promotion

## Workstreams

### Workstream A: Source Authority And Projection

Focus:

- authored source vs derived mirror
- init and sync projection
- asset readiness and asset parity

Status:

- planning-only

### Workstream B: Runtime Context Consolidation

Focus:

- context injection overlap
- plugin fallback thinning
- shared injection ownership in `src/**`

Status:

- active implementation workstream

Current direction:

- harness-first is complete
- consolidation and truth compilation are now active before any further context extraction is considered

### Workstream C: Governance And Delegation Consolidation

Focus:

- `tool-gate`
- `soft-governance`
- plugin delegation overlap

Status:

- closed for implementation

### Workstream D: Lifecycle And Event Consolidation

Focus:

- event handling
- compaction and entry guard
- handoff/session lifecycle overlap

Status:

- closed for implementation

### Workstream E: Planning-Root And Continuity Governance

Focus:

- readable planning SOT
- checkpoint and handoff classification
- planning-root precedence

Status:

- active planning workstream

### Workstream F: Lineage And Operator Surface Alignment

Focus:

- AGENTS
- lineage docs
- operator-facing journey and scope language

Status:

- active planning workstream

## Precedence Rules

1. the ecosystem master governs all subordinate workstreams
2. workstream-local gates only control their own workstream
3. runtime work cannot become the de facto master plan again
4. `.hivemind` remains a result surface, not the origin surface
5. no fourth state store
6. no casual lineage merge
7. no governance or lifecycle implementation before explicit promotion
8. Workstream B must use harness-first TDD for its next implementation tranche

## Current Recommendation

Keep Workstream B active, but keep it subordinate.

The execution constitution is now installed and the first harness-first packet has completed.

The next top-level move is to use `01-34-PLAN.md` as the consolidation review gate, with `01-33-PLAN.md` and `docs/plans/ecosystem-truth-compilation-register-2026-03-07.md` as the current Workstream B stabilization packet.
