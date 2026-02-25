---
title: HiveMind Chain and Bridge Architecture
status: SPEC
version: 1.0.0
created: 2026-02-25
updated: 2026-02-25
owners:
  - hivemaker
knot_target: K1-K2
scope:
  - Plugin Hooks (Layer 1)
  - Custom Tools (Layer 2)
  - SDK Client (Layer 3)
  - Sidecar Observability (Layer 4)
  - Asset Sync Validation Bridge
derived_from:
  - HIVEMIND-FRAMEWORK.md
  - docs/planning-draft/forming-the-own-framework.md
  - src/cli.ts
  - src/cli/sync-assets.ts
  - tests/sync-assets.test.ts
evidence_base: 18 citations
lines_target: 800-1200
---

# Chain and Bridge Architecture

This document defines how HiveMind composes chain-oriented control flow and bridge-oriented integration boundaries. The objective is to make governance deterministic, context-aware, and auditable while keeping mutation authority constrained to explicit write paths.

The architecture in this document is synthesized from HiveMind framework doctrine and implementation evidence. Wording is adapted to this repository and intentionally avoids direct copy from external frameworks while preserving the strategic intent behind BMAD and GSD inspirations.

## 1. Architecture Overview and Problem Frame
This section converts the architecture objective into operational rules that can be executed, reviewed, and audited without ambiguity. The guidance is written for maintainers who need deterministic outcomes while still supporting phased expansion.

### Section Intent
- Frame why chain and bridge semantics are required in a context-governed system.
- Define the relationship between trajectory/tactic/action hierarchy and runtime execution.
- Establish the operating posture: deterministic governance first, flexible execution second.

### Text Diagram
```text
USER INTENT
  -> HIERARCHY CURSOR (trajectory -> tactic -> action)
  -> GOVERNANCE CHAIN (checks, transforms, gates)
  -> EXECUTION CHAIN (tools, sdk, events)
  -> AUDIT BRIDGE (evidence, replay, telemetry)
  -> FEEDBACK LOOP (warnings, remediations, next action)
```

### Chain Assertions
- The chain starts with a declared intent and stays anchored to hierarchy context.
- Each turn inherits prior state but only receives relevance-filtered context slices.
- Gating decisions are computed before mutation and cannot be deferred.
- Context transforms happen ahead of planning so the model sees constitutional constraints early.
- Mutation is always an explicit tool call, never an implicit hook side effect.
- Execution output must carry evidence metadata to support replay and triage.
- Warnings are treated as first-class chain signals, not cosmetic annotations.
- Bridge components protect cross-layer contracts when capabilities expand.
- Auditable lineage is a required output of every high-risk transition.
- Operational confidence comes from repeated deterministic behavior under the same inputs.

### Bridge Assertions
- Bridge contracts translate governance policy into executable constraints.
- Layer boundaries prevent data authority from leaking into orchestration code.
- Context bridges map long-lived planning artifacts into turn-level payloads.
- Tool bridges expose only validated command surfaces to the model.
- SDK bridges add automation without bypassing policy checks.
- Telemetry bridges preserve observability even when execution fails.
- Human-gate bridges ensure risky paths remain explicitly approved.
- Compatibility bridges allow aliases during migration without semantic drift.
- Failure bridges route partial outcomes to repair workflows instead of silent drops.
- Evidence bridges bind claims to command output so assertions stay falsifiable.

### Control Matrix
| Control ID | Trigger | Chain Responsibility | Bridge Mechanism | Expected Evidence |
| --- | --- | --- | --- | --- |
| C01-01 | state-change-1 | chain-owner-1 | bridge-architecture-overview-an-1 | evidence-artifact-01-01 |
| C01-02 | state-change-2 | chain-owner-2 | bridge-architecture-overview-an-2 | evidence-artifact-01-02 |
| C01-03 | state-change-3 | chain-owner-3 | bridge-architecture-overview-an-3 | evidence-artifact-01-03 |
| C01-04 | state-change-4 | chain-owner-4 | bridge-architecture-overview-an-4 | evidence-artifact-01-04 |
| C01-05 | state-change-5 | chain-owner-5 | bridge-architecture-overview-an-5 | evidence-artifact-01-05 |
| C01-06 | state-change-6 | chain-owner-6 | bridge-architecture-overview-an-6 | evidence-artifact-01-06 |
| C01-07 | state-change-7 | chain-owner-7 | bridge-architecture-overview-an-7 | evidence-artifact-01-07 |
| C01-08 | state-change-8 | chain-owner-8 | bridge-architecture-overview-an-8 | evidence-artifact-01-08 |
| C01-09 | state-change-9 | chain-owner-9 | bridge-architecture-overview-an-9 | evidence-artifact-01-09 |
| C01-10 | state-change-10 | chain-owner-10 | bridge-architecture-overview-an-10 | evidence-artifact-01-10 |

### Failure Matrix
| Failure ID | Condition | Immediate Response | Recovery Path | Evidence Signal |
| --- | --- | --- | --- | --- |
| F01-01 | contract mismatch | deterministic block | checklist remediation step 1 | event-trace-01-01 |
| F01-02 | contract mismatch | deterministic block | checklist remediation step 2 | event-trace-01-02 |
| F01-03 | contract mismatch | deterministic block | checklist remediation step 3 | event-trace-01-03 |
| F01-04 | contract mismatch | deterministic block | checklist remediation step 4 | event-trace-01-04 |
| F01-05 | contract mismatch | deterministic block | checklist remediation step 5 | event-trace-01-05 |
| F01-06 | contract mismatch | deterministic block | checklist remediation step 6 | event-trace-01-06 |
| F01-07 | contract mismatch | deterministic block | checklist remediation step 7 | event-trace-01-07 |
| F01-08 | contract mismatch | deterministic block | checklist remediation step 8 | event-trace-01-08 |

### Operational Playbook
1. Reconfirm section intent against active hierarchy scope for Architecture Overview and Problem Frame.
2. Identify mandatory chain invariants before selecting implementation details.
3. Enumerate bridge responsibilities and attach owner boundaries explicitly.
4. Capture expected inputs, outputs, and failure classes in compact form.
5. Verify deterministic ordering assumptions with at least one concrete scenario.
6. Define warning vs block semantics and user visibility implications.
7. Confirm mutation ownership remains in tool pathways where applicable.
8. Attach evidence anchors that can be validated from repository sources.
9. Stress-test the model with at least one degraded-path simulation.
10. Record mitigation playbook entries for each high-impact failure class.
11. Align section controls with phase gate acceptance language.
12. Freeze terminology so chain and bridge terms stay semantically stable.

### Section Completion Checklist
- [ ] Chain boundary is explicit and testable.
- [ ] Bridge mechanism is named and scope-limited.
- [ ] Failure class mapping is deterministic.
- [ ] Evidence signals are machine-readable.
- [ ] Human visibility is preserved for warnings and blocks.
- [ ] CQRS ownership is not violated.
- [ ] Terminology matches document-level glossary.
- [ ] Section-level controls align with release gates.

### Inspiration Citations (Adapted)
- Adapted from `HIVEMIND-FRAMEWORK.md:3` on hierarchical integrity and context-first objectives.
- Adapted from `HIVEMIND-FRAMEWORK.md:45` on context governance and task allocation sequence.
- Adapted from `docs/planning-draft/forming-the-own-framework.md:47` on contract-first inter-layer flow.
- Adapted from `docs/planning-draft/forming-the-own-framework.md:291` on constitutional governance pipeline.

### Commentary
The section above intentionally prioritizes deterministic interfaces and explicit ownership because chain quality degrades quickly when policy and mutation concerns are mixed. Bridge definitions are therefore written as enforceable contracts rather than informal integration notes.

## 2. Layer Contracts in the 4-Layer Model
This section converts the architecture objective into operational rules that can be executed, reviewed, and audited without ambiguity. The guidance is written for maintainers who need deterministic outcomes while still supporting phased expansion.

### Section Intent
- Explain ownership boundaries across hooks, tools, sdk, and sidecar surfaces.
- Map allowed mutation scope so CQRS remains enforceable under load.
- Clarify transport and failure posture for each layer handoff.

### Text Diagram
```text
LAYER 1: HOOKS (read-first interception)
  || in-process call
LAYER 2: TOOLS (validated write surface)
  || ctx.client bridge
LAYER 3: SDK (session/control/event capabilities)
  || sse/event channel
LAYER 4: SIDECAR (operator visibility and intervention)

Mutation authority: Layer2 only
Decision timing: Layer1
Capability expansion: Layer3
Human oversight: Layer4
```

### Chain Assertions
- Layer 1 resolves timing and allow/deny posture before action execution.
- Layer 2 owns durable state transitions and persistence semantics.
- Layer 3 provides privileged automation APIs with policy-aware invocation.
- Layer 4 externalizes state and governance telemetry to operators.
- The chain rejects implicit persistence outside the tool layer.
- Cross-layer flow carries structured metadata rather than free text.
- Retry policies differ by layer to preserve safety over throughput.
- Contract mismatch is treated as a first-order failure, not a warning.
- Versioned interfaces are required where layers evolve independently.
- Layer contracts are optimized for traceability, not minimum code size.

### Bridge Assertions
- Hook-to-tool bridge passes validated arguments and gate metadata.
- Tool-to-hook bridge returns status, evidence, and safe summaries.
- Hook-to-sdk bridge is capability-oriented, not mutation-oriented.
- Sdk-to-sidecar bridge emits replayable events with stable identifiers.
- Sidecar-to-tool bridge requires explicit operator intent for risky actions.
- Bridge resilience requires replay and checkpoint semantics for event lag.
- Soft-gate bridges permit continuation while preserving operator signal.
- Hard-gate bridges terminate mutation pathways deterministically.
- Compatibility bridges shield callers from internal refactor churn.
- Transport bridges keep payload shape stable across release waves.

### Control Matrix
| Control ID | Trigger | Chain Responsibility | Bridge Mechanism | Expected Evidence |
| --- | --- | --- | --- | --- |
| C02-01 | state-change-1 | chain-owner-1 | bridge-layer-contracts-in-the-4-1 | evidence-artifact-02-01 |
| C02-02 | state-change-2 | chain-owner-2 | bridge-layer-contracts-in-the-4-2 | evidence-artifact-02-02 |
| C02-03 | state-change-3 | chain-owner-3 | bridge-layer-contracts-in-the-4-3 | evidence-artifact-02-03 |
| C02-04 | state-change-4 | chain-owner-4 | bridge-layer-contracts-in-the-4-4 | evidence-artifact-02-04 |
| C02-05 | state-change-5 | chain-owner-5 | bridge-layer-contracts-in-the-4-5 | evidence-artifact-02-05 |
| C02-06 | state-change-6 | chain-owner-6 | bridge-layer-contracts-in-the-4-6 | evidence-artifact-02-06 |
| C02-07 | state-change-7 | chain-owner-7 | bridge-layer-contracts-in-the-4-7 | evidence-artifact-02-07 |
| C02-08 | state-change-8 | chain-owner-8 | bridge-layer-contracts-in-the-4-8 | evidence-artifact-02-08 |
| C02-09 | state-change-9 | chain-owner-9 | bridge-layer-contracts-in-the-4-9 | evidence-artifact-02-09 |
| C02-10 | state-change-10 | chain-owner-10 | bridge-layer-contracts-in-the-4-10 | evidence-artifact-02-10 |

### Failure Matrix
| Failure ID | Condition | Immediate Response | Recovery Path | Evidence Signal |
| --- | --- | --- | --- | --- |
| F02-01 | contract mismatch | deterministic block | checklist remediation step 1 | event-trace-02-01 |
| F02-02 | contract mismatch | deterministic block | checklist remediation step 2 | event-trace-02-02 |
| F02-03 | contract mismatch | deterministic block | checklist remediation step 3 | event-trace-02-03 |
| F02-04 | contract mismatch | deterministic block | checklist remediation step 4 | event-trace-02-04 |
| F02-05 | contract mismatch | deterministic block | checklist remediation step 5 | event-trace-02-05 |
| F02-06 | contract mismatch | deterministic block | checklist remediation step 6 | event-trace-02-06 |
| F02-07 | contract mismatch | deterministic block | checklist remediation step 7 | event-trace-02-07 |
| F02-08 | contract mismatch | deterministic block | checklist remediation step 8 | event-trace-02-08 |

### Operational Playbook
1. Reconfirm section intent against active hierarchy scope for Layer Contracts in the 4-Layer Model.
2. Identify mandatory chain invariants before selecting implementation details.
3. Enumerate bridge responsibilities and attach owner boundaries explicitly.
4. Capture expected inputs, outputs, and failure classes in compact form.
5. Verify deterministic ordering assumptions with at least one concrete scenario.
6. Define warning vs block semantics and user visibility implications.
7. Confirm mutation ownership remains in tool pathways where applicable.
8. Attach evidence anchors that can be validated from repository sources.
9. Stress-test the model with at least one degraded-path simulation.
10. Record mitigation playbook entries for each high-impact failure class.
11. Align section controls with phase gate acceptance language.
12. Freeze terminology so chain and bridge terms stay semantically stable.

### Section Completion Checklist
- [ ] Chain boundary is explicit and testable.
- [ ] Bridge mechanism is named and scope-limited.
- [ ] Failure class mapping is deterministic.
- [ ] Evidence signals are machine-readable.
- [ ] Human visibility is preserved for warnings and blocks.
- [ ] CQRS ownership is not violated.
- [ ] Terminology matches document-level glossary.
- [ ] Section-level controls align with release gates.

### Inspiration Citations (Adapted)
- Adapted from `docs/planning-draft/forming-the-own-framework.md:10` 4-layer architecture model.
- Adapted from `docs/planning-draft/forming-the-own-framework.md:40` responsibility contract table.
- Adapted from `docs/planning-draft/forming-the-own-framework.md:49` transport and failure posture matrix.
- Adapted from `HIVEMIND-FRAMEWORK.md:71` architecture and agent role organization.

### Commentary
The section above intentionally prioritizes deterministic interfaces and explicit ownership because chain quality degrades quickly when policy and mutation concerns are mixed. Bridge definitions are therefore written as enforceable contracts rather than informal integration notes.

## 3. Hook Classification and Execution Ordering
This section converts the architecture objective into operational rules that can be executed, reviewed, and audited without ambiguity. The guidance is written for maintainers who need deterministic outcomes while still supporting phased expansion.

### Section Intent
- Normalize the 17-hook taxonomy into operational categories.
- Specify execution ordering guarantees and block semantics.
- Define deterministic behavior expectations for transform and gate hooks.

### Text Diagram
```text
TURN START
  -> H01/H02 context load
  -> H05 system transform
  -> H06 message transform
  -> H07 preflight governance
  -> planning/tool selection
  -> H08 tool pre-call gate
  -> tool execution
  -> H09/H10 event monitoring
  -> H16 audit tick
TURN END
```

### Chain Assertions
- Session hooks establish contextual baseline before any prompt mutation.
- Transform hooks are pure functions over runtime payloads.
- Preflight governance decides whether execution may continue.
- Tool gate hooks enforce role and scope constraints per call.
- Post and error hooks capture telemetry without mutating durable state.
- Command and delegation hooks protect orchestration boundaries.
- Audit tick hooks provide continuous drift posture monitoring.
- Shutdown hooks flush event channels and finalize audit tails.
- Deterministic order is mandatory for reproducible behavior.
- Category ownership reduces ambiguity when adding new hooks.

### Bridge Assertions
- Taxonomy bridge maps file-level hook implementations to canonical IDs.
- Ordering bridge ensures H05 always precedes H06 in every turn.
- Policy bridge ties block class to required output shape.
- Telemetry bridge maps hook outcomes into sidecar consumable events.
- Transform bridge preserves original user payload while adding enrichment.
- Gate bridge emits machine-readable deny reasons and remediation hints.
- Monitoring bridge standardizes severity labels across hook categories.
- Delegation bridge injects guardrails before subagent dispatch.
- Compaction bridge coordinates pre/post events around archive actions.
- Recovery bridge keeps fail-open behavior bounded to non-critical paths.

### Control Matrix
| Control ID | Trigger | Chain Responsibility | Bridge Mechanism | Expected Evidence |
| --- | --- | --- | --- | --- |
| C03-01 | state-change-1 | chain-owner-1 | bridge-hook-classification-and--1 | evidence-artifact-03-01 |
| C03-02 | state-change-2 | chain-owner-2 | bridge-hook-classification-and--2 | evidence-artifact-03-02 |
| C03-03 | state-change-3 | chain-owner-3 | bridge-hook-classification-and--3 | evidence-artifact-03-03 |
| C03-04 | state-change-4 | chain-owner-4 | bridge-hook-classification-and--4 | evidence-artifact-03-04 |
| C03-05 | state-change-5 | chain-owner-5 | bridge-hook-classification-and--5 | evidence-artifact-03-05 |
| C03-06 | state-change-6 | chain-owner-6 | bridge-hook-classification-and--6 | evidence-artifact-03-06 |
| C03-07 | state-change-7 | chain-owner-7 | bridge-hook-classification-and--7 | evidence-artifact-03-07 |
| C03-08 | state-change-8 | chain-owner-8 | bridge-hook-classification-and--8 | evidence-artifact-03-08 |
| C03-09 | state-change-9 | chain-owner-9 | bridge-hook-classification-and--9 | evidence-artifact-03-09 |
| C03-10 | state-change-10 | chain-owner-10 | bridge-hook-classification-and--10 | evidence-artifact-03-10 |

### Failure Matrix
| Failure ID | Condition | Immediate Response | Recovery Path | Evidence Signal |
| --- | --- | --- | --- | --- |
| F03-01 | contract mismatch | deterministic block | checklist remediation step 1 | event-trace-03-01 |
| F03-02 | contract mismatch | deterministic block | checklist remediation step 2 | event-trace-03-02 |
| F03-03 | contract mismatch | deterministic block | checklist remediation step 3 | event-trace-03-03 |
| F03-04 | contract mismatch | deterministic block | checklist remediation step 4 | event-trace-03-04 |
| F03-05 | contract mismatch | deterministic block | checklist remediation step 5 | event-trace-03-05 |
| F03-06 | contract mismatch | deterministic block | checklist remediation step 6 | event-trace-03-06 |
| F03-07 | contract mismatch | deterministic block | checklist remediation step 7 | event-trace-03-07 |
| F03-08 | contract mismatch | deterministic block | checklist remediation step 8 | event-trace-03-08 |

### Operational Playbook
1. Reconfirm section intent against active hierarchy scope for Hook Classification and Execution Ordering.
2. Identify mandatory chain invariants before selecting implementation details.
3. Enumerate bridge responsibilities and attach owner boundaries explicitly.
4. Capture expected inputs, outputs, and failure classes in compact form.
5. Verify deterministic ordering assumptions with at least one concrete scenario.
6. Define warning vs block semantics and user visibility implications.
7. Confirm mutation ownership remains in tool pathways where applicable.
8. Attach evidence anchors that can be validated from repository sources.
9. Stress-test the model with at least one degraded-path simulation.
10. Record mitigation playbook entries for each high-impact failure class.
11. Align section controls with phase gate acceptance language.
12. Freeze terminology so chain and bridge terms stay semantically stable.

### Section Completion Checklist
- [ ] Chain boundary is explicit and testable.
- [ ] Bridge mechanism is named and scope-limited.
- [ ] Failure class mapping is deterministic.
- [ ] Evidence signals are machine-readable.
- [ ] Human visibility is preserved for warnings and blocks.
- [ ] CQRS ownership is not violated.
- [ ] Terminology matches document-level glossary.
- [ ] Section-level controls align with release gates.

### Inspiration Citations (Adapted)
- Adapted from `docs/planning-draft/forming-the-own-framework.md:83` canonical 17-hook taxonomy.
- Adapted from `docs/planning-draft/forming-the-own-framework.md:105` mapping to hook files.
- Adapted from `docs/planning-draft/forming-the-own-framework.md:118` execution order for a single turn.
- Adapted from `docs/planning-draft/forming-the-own-framework.md:134` blocking policy and mutability rules.

### Commentary
The section above intentionally prioritizes deterministic interfaces and explicit ownership because chain quality degrades quickly when policy and mutation concerns are mixed. Bridge definitions are therefore written as enforceable contracts rather than informal integration notes.

## 4. Inter-Layer Data Flow and Chain Semantics
This section converts the architecture objective into operational rules that can be executed, reviewed, and audited without ambiguity. The guidance is written for maintainers who need deterministic outcomes while still supporting phased expansion.

### Section Intent
- Define the chain as a sequence of typed transfers with explicit failure posture.
- Formalize producer/consumer obligations for each handoff.
- Prevent data ambiguity by standardizing event and result envelopes.

### Text Diagram
```text
[Hook preflight] --in-process--> [Tool runtime]
[Tool runtime] --result envelope--> [Hook post-validate]
[Hook runtime] --ctx.client--> [SDK operations]
[SDK stream] --events--> [Sidecar monitor]
[Sidecar action] --guard token--> [Tool runtime]

Failure posture:
- hard gates: fail closed
- partial metadata: fail open with warning
- telemetry lag: buffer and replay
```

### Chain Assertions
- Each transfer has a trigger, transport, producer, consumer, and failure strategy.
- Payloads include enough metadata for both machine and operator interpretation.
- Consumer responsibility includes schema verification and rejection of malformed envelopes.
- Event IDs enable deduplication during replay and retries.
- Latency-sensitive transfers prioritize bounded retries over aggressive fan-out.
- Cross-session transfers include lineage identifiers to preserve continuity.
- Transport choice is explicit and documented per flow category.
- System behavior remains deterministic under duplicate delivery conditions.
- No transfer may bypass governance metadata propagation.
- Visibility requirements are enforced even on degraded paths.

### Bridge Assertions
- Flow bridges isolate concerns so a failing layer does not corrupt adjacent layers.
- Envelope bridges separate human-readable explanations from machine-readable fields.
- Retry bridges cap replay windows to avoid unbounded backlog growth.
- Checkpoint bridges permit partial recovery after process interruption.
- Relevance bridges trim context to protect token budgets without losing intent.
- Lineage bridges map every decision to hierarchy coordinates.
- Policy bridges ensure gate outcomes are consistent across transports.
- Backpressure bridges prevent telemetry floods from suppressing critical warnings.
- Intervention bridges allow operators to pause high-risk sequences.
- Audit bridges maintain immutable evidence chains for postmortem review.

### Control Matrix
| Control ID | Trigger | Chain Responsibility | Bridge Mechanism | Expected Evidence |
| --- | --- | --- | --- | --- |
| C04-01 | state-change-1 | chain-owner-1 | bridge-inter-layer-data-flow-an-1 | evidence-artifact-04-01 |
| C04-02 | state-change-2 | chain-owner-2 | bridge-inter-layer-data-flow-an-2 | evidence-artifact-04-02 |
| C04-03 | state-change-3 | chain-owner-3 | bridge-inter-layer-data-flow-an-3 | evidence-artifact-04-03 |
| C04-04 | state-change-4 | chain-owner-4 | bridge-inter-layer-data-flow-an-4 | evidence-artifact-04-04 |
| C04-05 | state-change-5 | chain-owner-5 | bridge-inter-layer-data-flow-an-5 | evidence-artifact-04-05 |
| C04-06 | state-change-6 | chain-owner-6 | bridge-inter-layer-data-flow-an-6 | evidence-artifact-04-06 |
| C04-07 | state-change-7 | chain-owner-7 | bridge-inter-layer-data-flow-an-7 | evidence-artifact-04-07 |
| C04-08 | state-change-8 | chain-owner-8 | bridge-inter-layer-data-flow-an-8 | evidence-artifact-04-08 |
| C04-09 | state-change-9 | chain-owner-9 | bridge-inter-layer-data-flow-an-9 | evidence-artifact-04-09 |
| C04-10 | state-change-10 | chain-owner-10 | bridge-inter-layer-data-flow-an-10 | evidence-artifact-04-10 |

### Failure Matrix
| Failure ID | Condition | Immediate Response | Recovery Path | Evidence Signal |
| --- | --- | --- | --- | --- |
| F04-01 | contract mismatch | deterministic block | checklist remediation step 1 | event-trace-04-01 |
| F04-02 | contract mismatch | deterministic block | checklist remediation step 2 | event-trace-04-02 |
| F04-03 | contract mismatch | deterministic block | checklist remediation step 3 | event-trace-04-03 |
| F04-04 | contract mismatch | deterministic block | checklist remediation step 4 | event-trace-04-04 |
| F04-05 | contract mismatch | deterministic block | checklist remediation step 5 | event-trace-04-05 |
| F04-06 | contract mismatch | deterministic block | checklist remediation step 6 | event-trace-04-06 |
| F04-07 | contract mismatch | deterministic block | checklist remediation step 7 | event-trace-04-07 |
| F04-08 | contract mismatch | deterministic block | checklist remediation step 8 | event-trace-04-08 |

### Operational Playbook
1. Reconfirm section intent against active hierarchy scope for Inter-Layer Data Flow and Chain Semantics.
2. Identify mandatory chain invariants before selecting implementation details.
3. Enumerate bridge responsibilities and attach owner boundaries explicitly.
4. Capture expected inputs, outputs, and failure classes in compact form.
5. Verify deterministic ordering assumptions with at least one concrete scenario.
6. Define warning vs block semantics and user visibility implications.
7. Confirm mutation ownership remains in tool pathways where applicable.
8. Attach evidence anchors that can be validated from repository sources.
9. Stress-test the model with at least one degraded-path simulation.
10. Record mitigation playbook entries for each high-impact failure class.
11. Align section controls with phase gate acceptance language.
12. Freeze terminology so chain and bridge terms stay semantically stable.

### Section Completion Checklist
- [ ] Chain boundary is explicit and testable.
- [ ] Bridge mechanism is named and scope-limited.
- [ ] Failure class mapping is deterministic.
- [ ] Evidence signals are machine-readable.
- [ ] Human visibility is preserved for warnings and blocks.
- [ ] CQRS ownership is not violated.
- [ ] Terminology matches document-level glossary.
- [ ] Section-level controls align with release gates.

### Inspiration Citations (Adapted)
- Adapted from `docs/planning-draft/forming-the-own-framework.md:47` contract-first inter-layer table.
- Adapted from `docs/planning-draft/forming-the-own-framework.md:64` K1 integration expectations.
- Adapted from `HIVEMIND-FRAMEWORK.md:137` output protocol and hook-based prompt transformation.
- Adapted from `HIVEMIND-FRAMEWORK.md:154` reference paths and contextual integration intent.

### Commentary
The section above intentionally prioritizes deterministic interfaces and explicit ownership because chain quality degrades quickly when policy and mutation concerns are mixed. Bridge definitions are therefore written as enforceable contracts rather than informal integration notes.

## 5. Custom Tool Architecture and CQRS Boundaries
This section converts the architecture objective into operational rules that can be executed, reviewed, and audited without ambiguity. The guidance is written for maintainers who need deterministic outcomes while still supporting phased expansion.

### Section Intent
- Define write-path ownership and strict schema obligations for tools.
- Preserve CQRS discipline under migration and alias compatibility.
- Describe tool identity, action partitioning, and output guarantees.

### Text Diagram
```text
HOOK CONTEXT
  -> schema validate(input)
  -> execute tool action(write path)
  -> schema validate(output)
  -> emit evidence metadata
  -> hook post-validate

Read path: hooks/libs
Write path: tools only
```

### Chain Assertions
- Tool names follow stable group-action semantics to reduce command drift.
- Input schemas reject unknown fields unless explicitly whitelisted.
- Output schemas guarantee status and evidence shape for all outcomes.
- Action enums replace free-form strings in high-variance tool APIs.
- FK-aware validation is mandatory for hierarchy-scoped mutation operations.
- Query-style tools must remain side-effect free by contract.
- Migration aliases are allowed only with explicit compatibility notes.
- Tool internals remain deterministic given identical inputs and state.
- Every durable mutation produces structured delta metadata.
- CQRS boundaries are enforced by review and test evidence, not assumptions.

### Bridge Assertions
- Schema bridge aligns LLM calls with runtime safety expectations.
- Action bridge constrains behavior to known mutation pathways.
- Compatibility bridge preserves older command surfaces during refactors.
- Validation bridge links FK integrity with tool acceptance criteria.
- Evidence bridge standardizes audit payload fields across tool groups.
- Registry bridge keeps tool catalog discoverable and testable.
- Permission bridge ties tool usage to role-based gate checks.
- Error bridge normalizes fail states for post-hook consumers.
- Boundary bridge prevents hooks from acquiring hidden write authority.
- Contract bridge codifies what callers may depend on across versions.

### Control Matrix
| Control ID | Trigger | Chain Responsibility | Bridge Mechanism | Expected Evidence |
| --- | --- | --- | --- | --- |
| C05-01 | state-change-1 | chain-owner-1 | bridge-custom-tool-architecture-1 | evidence-artifact-05-01 |
| C05-02 | state-change-2 | chain-owner-2 | bridge-custom-tool-architecture-2 | evidence-artifact-05-02 |
| C05-03 | state-change-3 | chain-owner-3 | bridge-custom-tool-architecture-3 | evidence-artifact-05-03 |
| C05-04 | state-change-4 | chain-owner-4 | bridge-custom-tool-architecture-4 | evidence-artifact-05-04 |
| C05-05 | state-change-5 | chain-owner-5 | bridge-custom-tool-architecture-5 | evidence-artifact-05-05 |
| C05-06 | state-change-6 | chain-owner-6 | bridge-custom-tool-architecture-6 | evidence-artifact-05-06 |
| C05-07 | state-change-7 | chain-owner-7 | bridge-custom-tool-architecture-7 | evidence-artifact-05-07 |
| C05-08 | state-change-8 | chain-owner-8 | bridge-custom-tool-architecture-8 | evidence-artifact-05-08 |
| C05-09 | state-change-9 | chain-owner-9 | bridge-custom-tool-architecture-9 | evidence-artifact-05-09 |
| C05-10 | state-change-10 | chain-owner-10 | bridge-custom-tool-architecture-10 | evidence-artifact-05-10 |

### Failure Matrix
| Failure ID | Condition | Immediate Response | Recovery Path | Evidence Signal |
| --- | --- | --- | --- | --- |
| F05-01 | contract mismatch | deterministic block | checklist remediation step 1 | event-trace-05-01 |
| F05-02 | contract mismatch | deterministic block | checklist remediation step 2 | event-trace-05-02 |
| F05-03 | contract mismatch | deterministic block | checklist remediation step 3 | event-trace-05-03 |
| F05-04 | contract mismatch | deterministic block | checklist remediation step 4 | event-trace-05-04 |
| F05-05 | contract mismatch | deterministic block | checklist remediation step 5 | event-trace-05-05 |
| F05-06 | contract mismatch | deterministic block | checklist remediation step 6 | event-trace-05-06 |
| F05-07 | contract mismatch | deterministic block | checklist remediation step 7 | event-trace-05-07 |
| F05-08 | contract mismatch | deterministic block | checklist remediation step 8 | event-trace-05-08 |

### Operational Playbook
1. Reconfirm section intent against active hierarchy scope for Custom Tool Architecture and CQRS Boundaries.
2. Identify mandatory chain invariants before selecting implementation details.
3. Enumerate bridge responsibilities and attach owner boundaries explicitly.
4. Capture expected inputs, outputs, and failure classes in compact form.
5. Verify deterministic ordering assumptions with at least one concrete scenario.
6. Define warning vs block semantics and user visibility implications.
7. Confirm mutation ownership remains in tool pathways where applicable.
8. Attach evidence anchors that can be validated from repository sources.
9. Stress-test the model with at least one degraded-path simulation.
10. Record mitigation playbook entries for each high-impact failure class.
11. Align section controls with phase gate acceptance language.
12. Freeze terminology so chain and bridge terms stay semantically stable.

### Section Completion Checklist
- [ ] Chain boundary is explicit and testable.
- [ ] Bridge mechanism is named and scope-limited.
- [ ] Failure class mapping is deterministic.
- [ ] Evidence signals are machine-readable.
- [ ] Human visibility is preserved for warnings and blocks.
- [ ] CQRS ownership is not violated.
- [ ] Terminology matches document-level glossary.
- [ ] Section-level controls align with release gates.

### Inspiration Citations (Adapted)
- Adapted from `docs/planning-draft/forming-the-own-framework.md:193` custom tool architecture outline.
- Adapted from `docs/planning-draft/forming-the-own-framework.md:202` naming and compatibility guidance.
- Adapted from `docs/planning-draft/forming-the-own-framework.md:225` tool group catalog and ownership.
- Adapted from `docs/planning-draft/forming-the-own-framework.md:236` CQRS contract statement.

### Commentary
The section above intentionally prioritizes deterministic interfaces and explicit ownership because chain quality degrades quickly when policy and mutation concerns are mixed. Bridge definitions are therefore written as enforceable contracts rather than informal integration notes.

## 6. Constitutional Governance Pipeline
This section converts the architecture objective into operational rules that can be executed, reviewed, and audited without ambiguity. The guidance is written for maintainers who need deterministic outcomes while still supporting phased expansion.

### Section Intent
- Trace constitutional schemas to runtime gate decisions.
- Define deterministic checklist evaluation and gate mapping.
- Establish evidence obligations for allow/deny outcomes.

### Text Diagram
```text
SCHEMA SET
  -> instruction compiler
  -> cognitive packer digest
  -> H05 system injection
  -> LLM turn execution
  -> H07/H08 gate evaluation
  -> H16 telemetry + warning surface

Gate types: auto | soft | hard | human
```

### Chain Assertions
- Governance instructions are compiled from versioned schema sources.
- Digest packing prioritizes relevance and deterministic pruning.
- System transform injects constitution before model planning.
- Checklist evaluation is mode-aware and entity-specific.
- Gate mapping translates failed entities into explicit enforcement classes.
- Hard-gate outcomes must block mutation pathways without exception.
- Soft-gate outcomes continue execution with explicit warning output.
- Human-gate outcomes require explicit approval tokens for high-risk operations.
- All decisions emit evidence events suitable for replay.
- Deterministic behavior is measured against repeated-input consistency.

### Bridge Assertions
- Schema bridge ensures policy updates remain machine-verifiable.
- Compiler bridge resolves dependency ordering across rule units.
- Packer bridge enforces token budgets without losing mandatory checklist signals.
- Injection bridge adds concise constitutional context to the system channel.
- Evaluation bridge maps entity states to gate levels without ambiguity.
- Visibility bridge guarantees users can distinguish warnings from hard blocks.
- Audit bridge records decisions with enough metadata for forensic review.
- Remediation bridge links blocks to actionable next-step commands.
- Consistency bridge prevents same issue from yielding different gate classes.
- Safety bridge ensures no bypass path exists for critical entity failures.

### Control Matrix
| Control ID | Trigger | Chain Responsibility | Bridge Mechanism | Expected Evidence |
| --- | --- | --- | --- | --- |
| C06-01 | state-change-1 | chain-owner-1 | bridge-constitutional-governanc-1 | evidence-artifact-06-01 |
| C06-02 | state-change-2 | chain-owner-2 | bridge-constitutional-governanc-2 | evidence-artifact-06-02 |
| C06-03 | state-change-3 | chain-owner-3 | bridge-constitutional-governanc-3 | evidence-artifact-06-03 |
| C06-04 | state-change-4 | chain-owner-4 | bridge-constitutional-governanc-4 | evidence-artifact-06-04 |
| C06-05 | state-change-5 | chain-owner-5 | bridge-constitutional-governanc-5 | evidence-artifact-06-05 |
| C06-06 | state-change-6 | chain-owner-6 | bridge-constitutional-governanc-6 | evidence-artifact-06-06 |
| C06-07 | state-change-7 | chain-owner-7 | bridge-constitutional-governanc-7 | evidence-artifact-06-07 |
| C06-08 | state-change-8 | chain-owner-8 | bridge-constitutional-governanc-8 | evidence-artifact-06-08 |
| C06-09 | state-change-9 | chain-owner-9 | bridge-constitutional-governanc-9 | evidence-artifact-06-09 |
| C06-10 | state-change-10 | chain-owner-10 | bridge-constitutional-governanc-10 | evidence-artifact-06-10 |

### Failure Matrix
| Failure ID | Condition | Immediate Response | Recovery Path | Evidence Signal |
| --- | --- | --- | --- | --- |
| F06-01 | contract mismatch | deterministic block | checklist remediation step 1 | event-trace-06-01 |
| F06-02 | contract mismatch | deterministic block | checklist remediation step 2 | event-trace-06-02 |
| F06-03 | contract mismatch | deterministic block | checklist remediation step 3 | event-trace-06-03 |
| F06-04 | contract mismatch | deterministic block | checklist remediation step 4 | event-trace-06-04 |
| F06-05 | contract mismatch | deterministic block | checklist remediation step 5 | event-trace-06-05 |
| F06-06 | contract mismatch | deterministic block | checklist remediation step 6 | event-trace-06-06 |
| F06-07 | contract mismatch | deterministic block | checklist remediation step 7 | event-trace-06-07 |
| F06-08 | contract mismatch | deterministic block | checklist remediation step 8 | event-trace-06-08 |

### Operational Playbook
1. Reconfirm section intent against active hierarchy scope for Constitutional Governance Pipeline.
2. Identify mandatory chain invariants before selecting implementation details.
3. Enumerate bridge responsibilities and attach owner boundaries explicitly.
4. Capture expected inputs, outputs, and failure classes in compact form.
5. Verify deterministic ordering assumptions with at least one concrete scenario.
6. Define warning vs block semantics and user visibility implications.
7. Confirm mutation ownership remains in tool pathways where applicable.
8. Attach evidence anchors that can be validated from repository sources.
9. Stress-test the model with at least one degraded-path simulation.
10. Record mitigation playbook entries for each high-impact failure class.
11. Align section controls with phase gate acceptance language.
12. Freeze terminology so chain and bridge terms stay semantically stable.

### Section Completion Checklist
- [ ] Chain boundary is explicit and testable.
- [ ] Bridge mechanism is named and scope-limited.
- [ ] Failure class mapping is deterministic.
- [ ] Evidence signals are machine-readable.
- [ ] Human visibility is preserved for warnings and blocks.
- [ ] CQRS ownership is not violated.
- [ ] Terminology matches document-level glossary.
- [ ] Section-level controls align with release gates.

### Inspiration Citations (Adapted)
- Adapted from `docs/planning-draft/forming-the-own-framework.md:291` constitutional contract framing.
- Adapted from `docs/planning-draft/forming-the-own-framework.md:300` constitutional artifact definitions.
- Adapted from `docs/planning-draft/forming-the-own-framework.md:308` injection pipeline stages.
- Adapted from `docs/planning-draft/forming-the-own-framework.md:330` checklist enforcement flow and gate types.

### Commentary
The section above intentionally prioritizes deterministic interfaces and explicit ownership because chain quality degrades quickly when policy and mutation concerns are mixed. Bridge definitions are therefore written as enforceable contracts rather than informal integration notes.

## 7. SDK Control Plane and Command-Hook-Skill Chaining
This section converts the architecture objective into operational rules that can be executed, reviewed, and audited without ambiguity. The guidance is written for maintainers who need deterministic outcomes while still supporting phased expansion.

### Section Intent
- Position sdk calls as capability bridges, not hidden mutation channels.
- Describe command-triggered chains that include skills and governance hooks.
- Define lifecycle sequencing that preserves context integrity.

### Text Diagram
```text
COMMAND TRIGGER
  -> load domain skills
  -> run governance preflight hooks
  -> execute tool or workflow
  -> run post-validation hooks
  -> emit telemetry and export cycle

SDK assists with session/create/prompt/find/event/tui
Tool layer remains durable mutation authority
```

### Chain Assertions
- Sdk APIs are invoked from hooks to augment orchestration capabilities.
- Session creation and silent prompts are policy-gated operations.
- Toast signaling communicates governance state without mutating project data.
- Event subscriptions power observability and alerting pathways.
- Find APIs support evidence collection before strong assertions are made.
- Command triggers must resolve mandatory skill packs before execution.
- Preflight hooks validate context completeness and role constraints.
- Post hooks audit outcomes and prepare cycle exports.
- Chaining semantics preserve traceability from entry command to final evidence.
- Deferred roadmap features must still respect current layer contracts.

### Bridge Assertions
- Capability bridge separates automation powers from persistence powers.
- Skill bridge adds domain knowledge while preserving bounded scope.
- Command bridge normalizes entry points for repeatable workflows.
- Preflight bridge converts policy concerns into deterministic checks.
- Postflight bridge packages outcomes for telemetry and memory storage.
- Lifecycle bridge aligns start/update/close semantics with hierarchy integrity.
- Discovery bridge provides up-to-date context slices from source files.
- Notification bridge elevates actionable warnings to operators promptly.
- Export bridge preserves subagent intelligence across compaction boundaries.
- Roadmap bridge keeps future extensions compatible with K1 foundations.

### Control Matrix
| Control ID | Trigger | Chain Responsibility | Bridge Mechanism | Expected Evidence |
| --- | --- | --- | --- | --- |
| C07-01 | state-change-1 | chain-owner-1 | bridge-sdk-control-plane-and-co-1 | evidence-artifact-07-01 |
| C07-02 | state-change-2 | chain-owner-2 | bridge-sdk-control-plane-and-co-2 | evidence-artifact-07-02 |
| C07-03 | state-change-3 | chain-owner-3 | bridge-sdk-control-plane-and-co-3 | evidence-artifact-07-03 |
| C07-04 | state-change-4 | chain-owner-4 | bridge-sdk-control-plane-and-co-4 | evidence-artifact-07-04 |
| C07-05 | state-change-5 | chain-owner-5 | bridge-sdk-control-plane-and-co-5 | evidence-artifact-07-05 |
| C07-06 | state-change-6 | chain-owner-6 | bridge-sdk-control-plane-and-co-6 | evidence-artifact-07-06 |
| C07-07 | state-change-7 | chain-owner-7 | bridge-sdk-control-plane-and-co-7 | evidence-artifact-07-07 |
| C07-08 | state-change-8 | chain-owner-8 | bridge-sdk-control-plane-and-co-8 | evidence-artifact-07-08 |
| C07-09 | state-change-9 | chain-owner-9 | bridge-sdk-control-plane-and-co-9 | evidence-artifact-07-09 |
| C07-10 | state-change-10 | chain-owner-10 | bridge-sdk-control-plane-and-co-10 | evidence-artifact-07-10 |

### Failure Matrix
| Failure ID | Condition | Immediate Response | Recovery Path | Evidence Signal |
| --- | --- | --- | --- | --- |
| F07-01 | contract mismatch | deterministic block | checklist remediation step 1 | event-trace-07-01 |
| F07-02 | contract mismatch | deterministic block | checklist remediation step 2 | event-trace-07-02 |
| F07-03 | contract mismatch | deterministic block | checklist remediation step 3 | event-trace-07-03 |
| F07-04 | contract mismatch | deterministic block | checklist remediation step 4 | event-trace-07-04 |
| F07-05 | contract mismatch | deterministic block | checklist remediation step 5 | event-trace-07-05 |
| F07-06 | contract mismatch | deterministic block | checklist remediation step 6 | event-trace-07-06 |
| F07-07 | contract mismatch | deterministic block | checklist remediation step 7 | event-trace-07-07 |
| F07-08 | contract mismatch | deterministic block | checklist remediation step 8 | event-trace-07-08 |

### Operational Playbook
1. Reconfirm section intent against active hierarchy scope for SDK Control Plane and Command-Hook-Skill Chaining.
2. Identify mandatory chain invariants before selecting implementation details.
3. Enumerate bridge responsibilities and attach owner boundaries explicitly.
4. Capture expected inputs, outputs, and failure classes in compact form.
5. Verify deterministic ordering assumptions with at least one concrete scenario.
6. Define warning vs block semantics and user visibility implications.
7. Confirm mutation ownership remains in tool pathways where applicable.
8. Attach evidence anchors that can be validated from repository sources.
9. Stress-test the model with at least one degraded-path simulation.
10. Record mitigation playbook entries for each high-impact failure class.
11. Align section controls with phase gate acceptance language.
12. Freeze terminology so chain and bridge terms stay semantically stable.

### Section Completion Checklist
- [ ] Chain boundary is explicit and testable.
- [ ] Bridge mechanism is named and scope-limited.
- [ ] Failure class mapping is deterministic.
- [ ] Evidence signals are machine-readable.
- [ ] Human visibility is preserved for warnings and blocks.
- [ ] CQRS ownership is not violated.
- [ ] Terminology matches document-level glossary.
- [ ] Section-level controls align with release gates.

### Inspiration Citations (Adapted)
- Adapted from `docs/planning-draft/forming-the-own-framework.md:248` sdk-powered governance capabilities.
- Adapted from `docs/planning-draft/forming-the-own-framework.md:257` capability map and decision matrix.
- Adapted from `docs/planning-draft/forming-the-own-framework.md:381` command-hook-skill chaining contract.
- Adapted from `HIVEMIND-FRAMEWORK.md:96` command organization and execution logic.

### Commentary
The section above intentionally prioritizes deterministic interfaces and explicit ownership because chain quality degrades quickly when policy and mutation concerns are mixed. Bridge definitions are therefore written as enforceable contracts rather than informal integration notes.

## 8. Asset Sync Validation Bridge (Section 8)
This section converts the architecture objective into operational rules that can be executed, reviewed, and audited without ambiguity. The guidance is written for maintainers who need deterministic outcomes while still supporting phased expansion.

### Section Intent
- Ground bridge validation rules in concrete source code and tests.
- Define deterministic sync behavior for project, global, and dual targets.
- Capture schema-level acceptance rules per asset group.

### Text Diagram
```text
sync-assets command
  -> parse target/overwrite flags
  -> resolve source groups
  -> resolve destination targets
  -> validate each source file by group
  -> skip invalid and increment invalid counter
  -> copy valid files honoring overwrite policy
  -> report copied/skipped/invalid totals

default overwrite: false (idempotent no-clobber)
explicit overwrite: true (replace existing files)
```

### Chain Assertions
- The CLI command table explicitly includes `sync-assets` as a first-class command.
- CLI dispatch routes `sync-assets` to `syncOpencodeAssets` with target and overwrite flags.
- Default target resolves to project-level `.opencode` when no override is supplied.
- Target selection supports project-only, global-only, and both destinations.
- Asset groups default to commands, skills, agents, workflows, templates, prompts, and references.
- Validation executes per file before copy, and invalid files are skipped rather than copied.
- Commands require `.md` plus frontmatter with a non-empty `description` key.
- Agents require `.md` plus frontmatter containing non-empty `name` and `description`.
- Workflows must parse as yaml/json and include workflow name plus non-empty steps with step tool fields.
- Templates, prompts, and references require allowed extensions and non-empty content after trim.

### Bridge Assertions
- Skill assets accept `SKILL.md` marker files without additional frontmatter requirement.
- Non-marker skill files are accepted only from `references/`, `templates/`, or `scripts/` subpaths.
- Non-marker skill files also require extension allow-list checks before copy.
- Overwrite false protects user-modified files by counting skips instead of replacing content.
- Overwrite true enables deterministic refresh of packaged assets when realignment is required.
- Validation counts are surfaced in aggregate result (`totalInvalid`) for audit visibility.
- Per-group reports include copied, skipped, invalid, and source existence fields.
- Silent mode suppresses logs while preserving result metrics for machine checks.
- Test coverage validates project/global/both targets and idempotent overwrite behavior.
- Test coverage also validates invalid command, agent, and workflow schemas are skipped.

### Control Matrix
| Control ID | Trigger | Chain Responsibility | Bridge Mechanism | Expected Evidence |
| --- | --- | --- | --- | --- |
| C08-01 | state-change-1 | chain-owner-1 | bridge-asset-sync-validation-br-1 | evidence-artifact-08-01 |
| C08-02 | state-change-2 | chain-owner-2 | bridge-asset-sync-validation-br-2 | evidence-artifact-08-02 |
| C08-03 | state-change-3 | chain-owner-3 | bridge-asset-sync-validation-br-3 | evidence-artifact-08-03 |
| C08-04 | state-change-4 | chain-owner-4 | bridge-asset-sync-validation-br-4 | evidence-artifact-08-04 |
| C08-05 | state-change-5 | chain-owner-5 | bridge-asset-sync-validation-br-5 | evidence-artifact-08-05 |
| C08-06 | state-change-6 | chain-owner-6 | bridge-asset-sync-validation-br-6 | evidence-artifact-08-06 |
| C08-07 | state-change-7 | chain-owner-7 | bridge-asset-sync-validation-br-7 | evidence-artifact-08-07 |
| C08-08 | state-change-8 | chain-owner-8 | bridge-asset-sync-validation-br-8 | evidence-artifact-08-08 |
| C08-09 | state-change-9 | chain-owner-9 | bridge-asset-sync-validation-br-9 | evidence-artifact-08-09 |
| C08-10 | state-change-10 | chain-owner-10 | bridge-asset-sync-validation-br-10 | evidence-artifact-08-10 |

### Failure Matrix
| Failure ID | Condition | Immediate Response | Recovery Path | Evidence Signal |
| --- | --- | --- | --- | --- |
| F08-01 | contract mismatch | deterministic block | checklist remediation step 1 | event-trace-08-01 |
| F08-02 | contract mismatch | deterministic block | checklist remediation step 2 | event-trace-08-02 |
| F08-03 | contract mismatch | deterministic block | checklist remediation step 3 | event-trace-08-03 |
| F08-04 | contract mismatch | deterministic block | checklist remediation step 4 | event-trace-08-04 |
| F08-05 | contract mismatch | deterministic block | checklist remediation step 5 | event-trace-08-05 |
| F08-06 | contract mismatch | deterministic block | checklist remediation step 6 | event-trace-08-06 |
| F08-07 | contract mismatch | deterministic block | checklist remediation step 7 | event-trace-08-07 |
| F08-08 | contract mismatch | deterministic block | checklist remediation step 8 | event-trace-08-08 |

### Operational Playbook
1. Reconfirm section intent against active hierarchy scope for Asset Sync Validation Bridge (Section 8).
2. Identify mandatory chain invariants before selecting implementation details.
3. Enumerate bridge responsibilities and attach owner boundaries explicitly.
4. Capture expected inputs, outputs, and failure classes in compact form.
5. Verify deterministic ordering assumptions with at least one concrete scenario.
6. Define warning vs block semantics and user visibility implications.
7. Confirm mutation ownership remains in tool pathways where applicable.
8. Attach evidence anchors that can be validated from repository sources.
9. Stress-test the model with at least one degraded-path simulation.
10. Record mitigation playbook entries for each high-impact failure class.
11. Align section controls with phase gate acceptance language.
12. Freeze terminology so chain and bridge terms stay semantically stable.

### Section Completion Checklist
- [ ] Chain boundary is explicit and testable.
- [ ] Bridge mechanism is named and scope-limited.
- [ ] Failure class mapping is deterministic.
- [ ] Evidence signals are machine-readable.
- [ ] Human visibility is preserved for warnings and blocks.
- [ ] CQRS ownership is not violated.
- [ ] Terminology matches document-level glossary.
- [ ] Section-level controls align with release gates.

### Inspiration Citations (Adapted)
- Adapted from `src/cli.ts:28` command registry includes `sync-assets` and related help text.
- Adapted from `src/cli.ts:252` dispatch branch invoking `syncOpencodeAssets` with target and overwrite.
- Adapted from `src/cli/sync-assets.ts:21` default asset groups and `AssetGroup` type.
- Adapted from `src/cli/sync-assets.ts:181` validation logic across commands/skills/agents/workflows/templates/prompts/references.
- Adapted from `src/cli/sync-assets.ts:255` sync loop and report counters.
- Adapted from `tests/sync-assets.test.ts:56` no-clobber default and overwrite replacement tests.
- Adapted from `tests/sync-assets.test.ts:142` invalid asset skip behavior and invalid counting assertions.
- Adapted from `tests/sync-assets.test.ts:240` invalid agent/workflow schema rejection and totals.

### Commentary
The section above intentionally prioritizes deterministic interfaces and explicit ownership because chain quality degrades quickly when policy and mutation concerns are mixed. Bridge definitions are therefore written as enforceable contracts rather than informal integration notes.

## 9. Integration Contracts, Roadmap, and Verification Gates
This section converts the architecture objective into operational rules that can be executed, reviewed, and audited without ambiguity. The guidance is written for maintainers who need deterministic outcomes while still supporting phased expansion.

### Section Intent
- Translate architecture into adoption gates that can be tested and audited.
- Bind chain and bridge semantics to measurable completion criteria.
- Provide phased expansion guidance without breaking K1 contracts.

### Text Diagram
```text
K1 FOUNDATION
  -> Layer1 + Layer2 mandatory
  -> transform and gate determinism
  -> evidence capture baseline
K2 EXPANSION
  -> session automation triggers
  -> command normalization
  -> skill/domain pack runtime
  -> sidecar intervention controls

Release gate = typecheck + tests + evidence review
```

### Chain Assertions
- K1 requires stable hook ordering and CQRS purity before expansion work begins.
- K1 verification includes constitutional injection on every main-session turn.
- K1 ensures hard-gate behavior blocks mutation under critical policy failures.
- K2 extends automation triggers while preserving tool-owned mutation boundaries.
- K2 normalizes command groups and schema-validated arguments.
- K2 introduces richer skill loading policies and domain routing contracts.
- K2 sidecar evolution reuses event schema contracts established in K1.
- Gate reviews include architecture, integration, and operational readiness checks.
- Exit criteria require evidence links rather than narrative-only closure.
- Completion status is tied to observable outcomes in code and test suites.

### Bridge Assertions
- Adoption bridge maps roadmap knots to enforceable acceptance criteria.
- Verification bridge ties quality gates to exact command evidence.
- Integration bridge ensures phase outputs interoperate across layers.
- Release bridge blocks promotion when core guardrails regress.
- Documentation bridge keeps rationale aligned with implementation changes.
- Audit bridge preserves verdicts and unresolved debt with explicit labels.
- Migration bridge supports legacy aliases during transition windows.
- Observability bridge tracks drift and gate outcomes over time.
- Policy bridge requires source-backed claims in all closeout reports.
- Continuity bridge keeps trajectory/tactic/action lineage coherent across compaction.

### Control Matrix
| Control ID | Trigger | Chain Responsibility | Bridge Mechanism | Expected Evidence |
| --- | --- | --- | --- | --- |
| C09-01 | state-change-1 | chain-owner-1 | bridge-integration-contracts,-r-1 | evidence-artifact-09-01 |
| C09-02 | state-change-2 | chain-owner-2 | bridge-integration-contracts,-r-2 | evidence-artifact-09-02 |
| C09-03 | state-change-3 | chain-owner-3 | bridge-integration-contracts,-r-3 | evidence-artifact-09-03 |
| C09-04 | state-change-4 | chain-owner-4 | bridge-integration-contracts,-r-4 | evidence-artifact-09-04 |
| C09-05 | state-change-5 | chain-owner-5 | bridge-integration-contracts,-r-5 | evidence-artifact-09-05 |
| C09-06 | state-change-6 | chain-owner-6 | bridge-integration-contracts,-r-6 | evidence-artifact-09-06 |
| C09-07 | state-change-7 | chain-owner-7 | bridge-integration-contracts,-r-7 | evidence-artifact-09-07 |
| C09-08 | state-change-8 | chain-owner-8 | bridge-integration-contracts,-r-8 | evidence-artifact-09-08 |
| C09-09 | state-change-9 | chain-owner-9 | bridge-integration-contracts,-r-9 | evidence-artifact-09-09 |
| C09-10 | state-change-10 | chain-owner-10 | bridge-integration-contracts,-r-10 | evidence-artifact-09-10 |

### Failure Matrix
| Failure ID | Condition | Immediate Response | Recovery Path | Evidence Signal |
| --- | --- | --- | --- | --- |
| F09-01 | contract mismatch | deterministic block | checklist remediation step 1 | event-trace-09-01 |
| F09-02 | contract mismatch | deterministic block | checklist remediation step 2 | event-trace-09-02 |
| F09-03 | contract mismatch | deterministic block | checklist remediation step 3 | event-trace-09-03 |
| F09-04 | contract mismatch | deterministic block | checklist remediation step 4 | event-trace-09-04 |
| F09-05 | contract mismatch | deterministic block | checklist remediation step 5 | event-trace-09-05 |
| F09-06 | contract mismatch | deterministic block | checklist remediation step 6 | event-trace-09-06 |
| F09-07 | contract mismatch | deterministic block | checklist remediation step 7 | event-trace-09-07 |
| F09-08 | contract mismatch | deterministic block | checklist remediation step 8 | event-trace-09-08 |

### Operational Playbook
1. Reconfirm section intent against active hierarchy scope for Integration Contracts, Roadmap, and Verification Gates.
2. Identify mandatory chain invariants before selecting implementation details.
3. Enumerate bridge responsibilities and attach owner boundaries explicitly.
4. Capture expected inputs, outputs, and failure classes in compact form.
5. Verify deterministic ordering assumptions with at least one concrete scenario.
6. Define warning vs block semantics and user visibility implications.
7. Confirm mutation ownership remains in tool pathways where applicable.
8. Attach evidence anchors that can be validated from repository sources.
9. Stress-test the model with at least one degraded-path simulation.
10. Record mitigation playbook entries for each high-impact failure class.
11. Align section controls with phase gate acceptance language.
12. Freeze terminology so chain and bridge terms stay semantically stable.

### Section Completion Checklist
- [ ] Chain boundary is explicit and testable.
- [ ] Bridge mechanism is named and scope-limited.
- [ ] Failure class mapping is deterministic.
- [ ] Evidence signals are machine-readable.
- [ ] Human visibility is preserved for warnings and blocks.
- [ ] CQRS ownership is not violated.
- [ ] Terminology matches document-level glossary.
- [ ] Section-level controls align with release gates.

### Inspiration Citations (Adapted)
- Adapted from `docs/planning-draft/forming-the-own-framework.md:64` K1 integration contract.
- Adapted from `docs/planning-draft/forming-the-own-framework.md:431` knot roadmap expansion.
- Adapted from `HIVEMIND-FRAMEWORK.md:117` lifecycle and phase execution composition.
- Adapted from `HIVEMIND-FRAMEWORK.md:137` output protocol and progress visibility expectations.

### Commentary
The section above intentionally prioritizes deterministic interfaces and explicit ownership because chain quality degrades quickly when policy and mutation concerns are mixed. Bridge definitions are therefore written as enforceable contracts rather than informal integration notes.

### Glossary
- Chain: Ordered sequence of decisions and operations from intent to evidence.
- Bridge: Contract boundary that links layers without leaking authority.
- Hard gate: Deterministic block for critical policy violations.
- Soft gate: Warning path that allows controlled continuation.
- Human gate: Explicit confirmation requirement for high-risk operations.
- CQRS: Command/query separation where tools mutate and hooks contextualize.

### Closing Note
This architecture specification is designed for repeatable execution under governance pressure. When updates are required, keep section numbering stable, preserve evidence anchors, and refresh validation details from current code before asserting readiness.
