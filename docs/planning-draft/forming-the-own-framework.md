## § HiveMind 4-Layer Architecture

**Status:** SPEC COMPLETE

> Inspired by GSD command orchestration and BMAD boundary discipline, adapted to HiveMind's context-first hierarchy and iterative governance loops.
> 

HiveMind is a hybrid execution system with four interacting layers. Each layer has a strict contract so context can move upward while control and governance can move downward without ambiguity.

```
                 USER / COMMAND ENTRY
                         |
                         v
   +------------------------------------------------------------+
   | Layer 1: Plugin Hooks (reactive runtime)                  |
   | - session lifecycle, transforms, governance, tool-gate    |
   +-----------------------+------------------------------------+
                           | function calls + in-process events
                           v
   +------------------------------------------------------------+
   | Layer 2: Custom Tools (LLM-callable mutation surface)      |
   | - hivemind_* tools with zod input/output contracts         |
   +-----------------------+------------------------------------+
                           | ctx.client SDK bridge
                           v
   +------------------------------------------------------------+
   | Layer 3: SDK Client (inside plugin via ctx.client)         |
   | - session.create/prompt/find/tui/event.subscribe           |
   +-----------------------+------------------------------------+
                           | SSE + client API
                           v
   +------------------------------------------------------------+
   | Layer 4: Sidecar TUI (OpenTUI dashboard; planned)          |
   | - observability, warnings, timeline, intervention controls |
   +------------------------------------------------------------+
```

### Layer responsibility contract

| Layer | Primary ownership | Allowed mutation | Input contract | Output contract |
| --- | --- | --- | --- | --- |
| 1. Hooks | Runtime interception, context assembly, governance enforcement | Ephemeral request/response context only | Turn events, tool calls, messages | Transformed prompt, blocked/allowed decisions, telemetry |
| 2. Tools | Durable state transitions in `.hivemind/` and graph stores | Persistent state mutations (write path) | Zod-validated args + resolved context | Structured mutation result + audit metadata |
| 3. SDK | Cross-session automation and runtime capabilities | Session/control actions via API | Plugin context (`ctx`) + auth runtime | Session/task operations, search results, UI signals |
| 4. Sidecar TUI | Operator visibility and intervention UX | UI-local state + user-triggered actions | SSE stream + governance telemetry | Human feedback, triage actions, diagnostics |

### Inter-layer data flow (contract-first)

| Flow | Trigger | Transport | Producer | Consumer | Failure posture |
| --- | --- | --- | --- | --- | --- |
| Hook -> Tool | LLM calls a `hivemind_*` tool | in-process function call | Hook/tool-gate | Tool runtime | Fail-closed for hard governance gates |
| Tool -> Hook | Tool response returns | structured payload | Tool runtime | response hooks | Fail-open with warning if metadata is partial |
| Hook -> SDK | Automation required (session spawn/search/toast) | `ctx.client.*` call | Hook modules | SDK client | Retry once, then soft-gate warning |
| SDK -> Sidecar | Telemetry/warnings/status push | SSE/event bus | SDK/event stream | OpenTUI sidecar | Buffer + replay from last checkpoint |
| Sidecar -> Tool | Human-approved action from dashboard | command/tool invocation | Sidecar action router | Tool runtime | Require human-gate token before mutation |

### Ownership boundaries

- Hooks own *decision timing* (when/if an action may happen).
- Tools own *state mutation correctness* (what changes and how recorded).
- SDK owns *capability expansion* (session/control/search/notify).
- TUI owns *human observability and intervention* (never hidden mutation).

### Integration contract for K1+

- Layer 1 + Layer 2 are mandatory for K1 delivery.
- Layer 3 is mandatory for auto-new-session and silent governance prompts.
- Layer 4 can ship incrementally, but must consume the same event schema as Layer 1/3.

---

<!-- K1-CRITICAL -->

## § Hook Classification & Ordering

**Status:** SPEC COMPLETE

> Inspired by BMAD execution guardrails and GSD quality checkpoints, adapted to HiveMind's read-first hooks and write-only tool boundary.
> 

This section defines a canonical hook taxonomy for 17 hook types, execution order, mutability limits, and K1 wiring for prompt transforms.

### Canonical hook taxonomy (17 types)

| Hook ID | Hook type (canonical) | Category | May block | Mutation scope |
| --- | --- | --- | --- | --- |
| H01 | `session.init` | Context Injection | No | runtime-only |
| H02 | `session.resume` | Context Injection | No | runtime-only |
| H03 | `session.compaction.pre` | Governance Enforcement | Yes | runtime-only |
| H04 | `session.compaction.post` | Event Monitoring | No | runtime-only |
| H05 | `experimental.chat.system.transform` | Message Transformation | Yes | transformed system prompt |
| H06 | `experimental.chat.messages.transform` | Message Transformation | Yes | transformed message list |
| H07 | `chat.preflight` | Governance Enforcement | Yes | runtime-only |
| H08 | `tool.call.pre` | Tool Interception | Yes | runtime-only |
| H09 | `tool.call.post` | Event Monitoring | No | runtime-only |
| H10 | `tool.call.error` | Event Monitoring | No | runtime-only |
| H11 | `command.pre` | Governance Enforcement | Yes | runtime-only |
| H12 | `command.post` | Event Monitoring | No | runtime-only |
| H13 | `agent.delegate.pre` | Governance Enforcement | Yes | runtime-only |
| H14 | `agent.delegate.post` | Event Monitoring | No | runtime-only |
| H15 | `event.stream.receive` | Event Monitoring | No | runtime-only |
| H16 | `governance.audit.tick` | Governance Enforcement | Soft only | runtime-only |
| H17 | `shutdown.flush` | Event Monitoring | No | runtime-only |

### Mapping to existing HiveMind hook files

| Existing file | Primary category | Canonical hooks owned |
| --- | --- | --- |
| `src/hooks/session-lifecycle.ts` | Context Injection | H01, H02, H03, H04 |
| `src/hooks/messages-transform.ts` | Message Transformation | H05, H06 |
| `src/hooks/soft-governance.ts` | Governance Enforcement | H07, H16 |
| `src/hooks/compaction.ts` | Governance Enforcement / Monitoring | H03, H04 |
| `src/hooks/event-handler.ts` | Event Monitoring | H09, H10, H12, H14, H15, H17 |
| `src/hooks/tool-gate.ts` | Tool Interception | H08 |
| `src/hooks/sdk-context.ts` | Context Injection | H01, H02 support wiring |
| `src/hooks/swarm-executor.ts` | Governance + Delegation | H13, H14 |

### Execution order (single turn)

```
Turn Start
  -> H01/H02 session context load
  -> H05 system transform (constitution + hierarchy digest)
  -> H06 messages transform (user message + task mapping rewrite)
  -> H07 chat preflight governance decision
  -> If allowed: LLM/tool planning
  -> H08 tool pre-call gate (for each tool)
  -> Tool executes (write path)
  -> H09/H10 post/error events
  -> H16 governance tick + drift warning
Turn End
```

### Blocking policy

| Stage | Block class | Typical reason | Required output |
| --- | --- | --- | --- |
| H05/H06 | Hard block | Transform contract invalid, missing required governance envelope | Structured error + remediation hint |
| H07 | Hard or soft block | Missing mandatory entities, drift too high, chain broken | Gate decision object + next steps |
| H08 | Hard block | Tool forbidden in current role/scope | Gate denial + allowed alternatives |
| H16 | Soft block only | Context decay, stale anchors, warning thresholds crossed | Toast/warning + recommended command |

### Ownership and mutability rules

| Hook category | Can write `.hivemind` state | Can call SDK | Can rewrite prompts/messages | Must remain deterministic |
| --- | --- | --- | --- | --- |
| Context Injection | No | Yes | No | Yes |
| Governance Enforcement | No | Yes | No | Yes |
| Message Transformation | No | No (except read-only context fetch) | Yes | Yes (pure transform) |
| Event Monitoring | No | Yes | No | Yes |
| Tool Interception | No | No | No | Yes |

Hooks are read-first and deterministic. Any durable mutation must occur in a tool call.

### K1 wiring for transform hooks

<!-- K1-CRITICAL -->
`experimental.chat.system.transform` (H05) MUST:

1. Inject constitutional digest from the compiler/packer output.
2. Append active hierarchy cursor (`trajectory`, `tactic`, `action`) and gate mode.
3. Include required checklist summary (missing/passing entities only; concise).
4. Fail closed if constitutional payload is malformed.

`experimental.chat.messages.transform` (H06) MUST:

1. Preserve original user message verbatim in payload metadata.
2. Add a transformed envelope that maps prompt -> inferred task linkage -> governance reminders.
3. Append only relevant context slices (recency + hierarchy relevance), not full history.
4. Fail open with warning when enrichment data is unavailable, but never drop user message.

### Two-transform contract (no duplication)

| Concern | Owned by H05 (system) | Owned by H06 (messages) |
| --- | --- | --- |
| Constitutional rules | Yes | No |
| Role/profile governance | Yes | No |
| User prompt normalization | No | Yes |
| Task extraction hints | No | Yes |
| Cross-turn context digest | Yes (headers) | Yes (selected slices) |
| Entity checklist verdict | Yes (summary) | Yes (per-turn reminders) |

### K1 acceptance checks for hook wiring

- Transform order is deterministic: H05 always before H06.
- H05 and H06 execute on every main-session turn.
- H05/H06 do not write persistent state.
- Tool gate (H08) sees transformed governance metadata before tool execution.
- Drift/warning telemetry from H16 reaches toast pipeline.

---

## § Custom Tool Architecture

**Status:** OUTLINE ONLY (K2+ detail deferred)

> Inspired by BMAD tri-modal validation and GSD tool discipline, adapted to HiveMind CQRS where tools mutate and hooks contextualize.
> 

### Naming and identity

- Canonical pattern: `hivemind_{group}_{action}`.
- Compatibility aliases allowed during migration (example: `hivemind_session` routes to `hivemind_session_update` family internally).
- Group names remain stable: `session`, `cognitive`, `memory`, `hierarchy`, `delegation`, `inspector`.

### Required schema contract

Every tool must provide:

1. Zod input schema (strict object; no unknown keys unless explicit pass-through).
2. Zod output schema (status, message, evidence metadata).
3. Action enum where applicable to avoid free-form command drift.
4. FK/ID validation for hierarchy/session scoped operations.

### Tool context flow

```
Hook preflight context
  -> tool schema validate
  -> tool action execute (write path)
  -> structured result (state delta + evidence)
  -> hook post-validate + telemetry
```

### Tool group catalog

| Group | Primary tools | Mutation responsibility |
| --- | --- | --- |
| Session | `declare_intent`, `map_context`, `compact_session` | Session lifecycle and hierarchy cursor updates |
| Cognitive | `scan_hierarchy`, `save_anchor`, `think_back` | Anchor/cognitive graph adjustments and retrieval state |
| Memory | `save_mem`, `recall_mems` | Durable memory writes/queries with shelf constraints |
| Hierarchy | `prune`, `migrate`, `status` | Tree structure maintenance |
| Delegation | `export_cycle` | Subagent result archival and lineage linking |
| Inspector | `check_drift`, `self_rate` | Governance diagnostics and self-state signals |

### CQRS contract

- Hooks: read-only contextual projection and gatekeeping.
- Tools: write-path commands with explicit state transitions.
- Query-style tools may exist, but return immutable views and never mutate graph/session files.

### K1 guardrail note

Even in outline phase, K1 requires that new governance tools follow full Zod contracts before merge.

---

## § SDK-Powered Governance Capabilities

**Status:** OUTLINE ONLY (K2+ detail deferred)

> Inspired by GSD orchestration APIs and BMAD workflow manifests, adapted to HiveMind's in-plugin SDK control plane.
> 

`ctx.client` provides an internal control surface that hooks can use without exposing direct mutation logic to prompts.

### Capability map

| Capability | API surface | Primary use in governance |
| --- | --- | --- |
| Session bootstrap | `session.create(...)` | Auto-new-session when stale/threshold conditions trigger |
| Silent prompt injection | `session.prompt({ noReply: true })` | Inject governance/context packets without user-facing noise |
| UX signaling | `tui.showToast(...)` | Warn on drift, gate failures, missing prerequisites |
| Real-time watch | `event.subscribe(...)` | Track tool and lifecycle events for dashboards and alerts |
| Code discovery | `find.text`, `find.files` | On-demand evidence scan before planning or enforcement |

### Decision matrix: SDK vs Hook vs Tool

| Need | Use Hook | Use Tool | Use SDK |
| --- | --- | --- | --- |
| Rewrite prompt context | Yes | No | No |
| Persist hierarchy/memory state | No | Yes | Optional wrapper only |
| Spawn or route session programmatically | No | Optional (trigger) | Yes |
| Notify user/operator in UI | Optional trigger | No | Yes (`tui`) |
| Real-time telemetry stream | Optional handler | No | Yes (`event.subscribe`) |

### K1-aligned scenarios

- Auto-new-session (Knot 2 precursor): evaluate stale conditions in hook, create session via SDK, write official state via tool.
- Governance nudge: hook emits soft-gate warning, SDK toast informs user, no mutation occurs.
- Evidence scan: hook requests `find.*` via SDK for quick context validation before hard gate decision.

### Constraint

SDK calls may orchestrate behavior, but persistent data authority remains in tool layer.

---

<!-- K1-CRITICAL -->

## § Constitutional Governance Contract

**Status:** SPEC COMPLETE

> Inspired by BMAD success/failure gate discipline and GSD checkpoint rigor, adapted to HiveMind constitutional schemas and hierarchy-linked enforcement.
> 

This contract defines how constitutional schemas become runtime governance behavior on every turn.

### K1 constitutional artifacts

| Artifact | Role | Produced by | Consumed by |
| --- | --- | --- | --- |
| `GovernanceInstruction` | Canonical rule payload for turn execution | Compiler from schema + state | H05 system transform |
| `ConstitutionalRule` | Atomic policy units with severity and scope | Schema set in `src/schemas/` | Compiler + gate engine |
| `EntityChecklist` | Mandatory entity verification per context mode | Checklist evaluator | H05/H07/H16 and tool-gate metadata |

### Governance injection pipeline

```
Constitutional Schemas
   -> Instruction Compiler
      -> Cognitive Packer (digest + relevance filter)
         -> H05 system transform inject
            -> LLM turn execution
               -> H07/H08 gate evaluation
                  -> H16 warning/audit telemetry
```

### Pipeline stage contracts

| Stage | Input | Output | Must fail when |
| --- | --- | --- | --- |
| Schema load | Versioned governance schema files | Parsed schema objects | Schema parse error or missing required rule set |
| Compiler | Schema objects + runtime state | `GovernanceInstruction` bundle | Rule dependency graph invalid |
| Packer | Instruction bundle + relevance context | Compact digest payload | Digest exceeds hard size budget and cannot prune safely |
| H05 inject | Digest payload | System instruction block | Block malformed or missing checklist summary |
| Gate engine | Turn intent + checklist + severity map | auto/soft/hard/human gate decision | Decision cannot be computed deterministically |

### Entity checklist enforcement flow

<!-- K1-CRITICAL -->

1. Determine operating mode (`plan_driven`, `quick_fix`, `exploration`).
2. Resolve required entities for mode and scope (session, hierarchy, planning SOT, optional code-intel).
3. Evaluate each entity as `present`, `stale`, `missing`, or `inconsistent`.
4. Map failed entities to gate level:
    - `auto-gate`: self-healable via safe tool action.
    - `soft-gate`: warn and continue with constrained execution.
    - `hard-gate`: block mutation/tool path until fixed.
    - `human-gate`: require explicit user confirmation for risky/destructive path.
5. Emit checklist verdict into H05 summary and H07/H08 gate metadata.
6. Record evidence event for audit trail and sidecar telemetry.

### Gate types adapted for HiveMind

| Gate type | Trigger pattern | Enforcement owner | User visibility | Typical outcome |
| --- | --- | --- | --- | --- |
| Auto-gate | Missing derivable metadata or stale cache that can be rebuilt safely | Hook + safe tool chain | Optional toast | Auto-remediate then continue |
| Soft-gate | Drift/context concerns without immediate safety risk | Hook governance layer | Toast + recommendation | Continue with warning |
| Hard-gate | Contract violation, missing critical entities, forbidden tool scope | Hook/tool-gate | Explicit block response | Stop execution until repaired |
| Human-gate | High-risk operation (destructive/security/billing boundary) | Hook + user confirmation step | Explicit prompt required | Wait for user approval token |

### Success metrics (K1)

✅ Every main turn includes constitutional digest via H05.
✅ Checklist verdict is computed and visible in governance metadata.
✅ Gate decision is deterministic for the same inputs.
✅ Hard-gate violations block tool mutation path.
✅ Soft-gate warnings reach user surface (toast/message).
✅ Governance evidence events are emitted for audit replay.

### Failure modes (K1)

❌ System transform executes without constitutional payload.
❌ Messages transform injects context not linked to active hierarchy.
❌ Gate severity mapping is ambiguous (same issue resolves to different gate types).
❌ Hook performs persistent mutation directly (CQRS breach).
❌ Checklist reports pass when required entities are missing.
❌ Hard-gate condition emits warning only and allows mutation.

### Constitutional invariants

- Determinism over creativity in governance path.
- Relevance-first context packing over maximal context dumping.
- Human override only for explicit high-risk gates.
- Full auditability of every allow/block decision.

---

## § Command-Hook-Skill Chaining

**Status:** OUTLINE ONLY (K2+ detail deferred)

> Inspired by GSD command-to-workflow delegation, adapted to HiveMind where commands are entry points, hooks are guardrails, and skills are domain intelligence modules.
> 

### Command taxonomy (proposed)

| Group | Purpose | Example command family |
| --- | --- | --- |
| `session/` | Session start/update/close flows | `hivemind-session-*` |
| `planning/` | Spec, roadmap, phase planning pipelines | `hivefiver-spec-*` |
| `code-intel/` | Scan/map/watch/reindex knowledge paths | `hivemind-code-*` |
| `governance/` | Gates, audits, drift, constitution diagnostics | `hivemind-govern-*` |
| `delegation/` | Subagent dispatch/export and cycle management | `hivemind-delegate-*` |
| `settings/` | Profiles, configs, environment and safety controls | `hivemind-config-*` |

### Chaining contract

```
Command trigger
  -> resolve skill set (domain knowledge injection)
  -> run hook preflight (governance/context checks)
  -> execute tool or workflow action
  -> run hook post-validate
  -> export cycle + emit telemetry
```

### Skill consumption model

- Commands decide which domain pack/skills are required.
- Hooks enforce that mandatory governance skills are present before risky operations.
- Skills provide policy and procedural context but do not mutate durable state.

### Lifecycle chaining (target behavior)

1. Command is invoked by user or automation.
2. Relevant skills load and inject bounded expertise.
3. Hook layer validates context integrity and entity checklist.
4. Tool executes mutation/query within CQRS boundaries.
5. Hook layer validates outcomes and emits warnings/blocks.
6. Results are exported with lineage for replay and review.

### K1 note

For K1, only the governance-critical command paths need strict chaining; full command group normalization is deferred to Knots 2-5.

---

## Next: Framework Expansion Roadmap

**Knot 2 - Session Automation and Triggering**

- Define auto-new-session trigger matrix (time, drift, task closure, risk boundary).
- Specify SDK + tool handshake for safe session spawning and ownership transfer.

**Knot 3 - Command System Refactor**

- Normalize command groups and argument schemas.
- Introduce command manifest with dependency declarations and gate metadata.

**Knot 4 - Skill and Domain Pack Runtime**

- Formalize skill loading policy, compatibility checks, and cache lifecycle.
- Define domain-pack router contracts across dev and non-dev workflows.

**Knot 5 - Sidecar OpenTUI Control Plane**

- Define telemetry schema and SSE channel contracts.
- Specify intervention controls (pause, retry, force human-gate, export trace).

**Cross-knot hardening items**

- Add conformance checklist for hook determinism and CQRS purity.
- Add migration guide from legacy aliases to canonical `hivemind_{group}_{action}` naming.
- Add evidence model for audits, replay, and release gate sign-off.