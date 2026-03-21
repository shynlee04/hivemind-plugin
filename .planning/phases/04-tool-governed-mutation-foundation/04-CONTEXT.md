# Phase 4: Live Validation and Continuity Hardening - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning
**Source:** Autonomous mode - process infrastructure defaults

<domain>
## Phase Boundary

Phase 4 establishes live validation and continuity hardening as permanent completion criteria. It does not add new product features - it makes the evidence-lane discipline from VER-01/VER-02/VER-03 and continuity behavior validation part of the standard module completion workflow. This phase closes the gap between "code written" and "evidence provided."

</domain>

<decisions>
## Implementation Decisions

### Validation Lane Standards
- Phase 4 implements VER-02: verification lanes must distinguish local diagnostics, integration checks, and live official-interface proof.
- Phase 4 implements VER-03: completion claims must not be documentation-only certainty.
- Phase 4 implements SURF-02: operator-facing surfaces must remain coherent across docs and implementation.

### Continuity Behavior Validation
- Continuity/recovery behavior must be validated against the real runtime path.
- Compaction, repair, and attach flows must be tested with evidence.
- Session continuity claims require [non-live evidence] labeling when live proof is unavailable.

### Evidence Labeling Discipline
- All completion artifacts must distinguish between: local diagnostics, integration checks, live official-interface proof.
- Runtime-facing claims without live proof must be explicitly labeled [non-live evidence].
- Phase 3's BOUNDED-SLICE-TEMPLATE must include evidence lane specification.

### Claude's Discretion
- Specific validation harness implementation details are at executor's discretion.
- Specific continuity test scenarios are at executor's discretion within VER-01 constraints.
- Specific evidence lane boundaries are at executor's discretion based on module complexity.

</decisions>

<codebase>
## Existing Code Insights

### Evidence Patterns from Phase 1-3
- Phase 1 established proof-gate requiring `live official-interface proof` for runtime claims
- Phase 3 BOUNDED-SLICE-TEMPLATE requires evidence specification per module
- MODULE-INVENTORY documents 29 modules with dependency ordering

### Validation Infrastructure Needs
- Local diagnostics: existing test/validation tooling
- Integration checks: module seam testing
- Live proof: official OpenCode boundary testing

### Continuity Patterns to Validate
- Session compaction behavior
- Repair flows
- Attach/detach sequences

</codebase>

<specifics>
## Specific Ideas

No specific validation scenarios beyond those implied by VER-01/VER-02/VER-03. Implementation uses existing test infrastructure where possible.

</specifics>

<deferred>
## Deferred Ideas

- Specific validation harness implementation - deferred to execution planning
- Specific continuity test scenarios - deferred to execution planning
- Specific evidence lane thresholds - deferred to per-module context

</deferred>
