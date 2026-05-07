# Command vs Workflow vs Session/Task Continuity Map — 2026-05-07

**Document type:** Architecture map artifact  
**Route:** Option 3 — Sector Governance Foundation Phase  
**Status:** Docs-only map; not runtime implementation evidence  
**Evidence level:** L5 documentation evidence only

---

## Purpose

This map separates command execution, workflow orchestration, and session/task continuity so future phases do not conflate routing, state, and runtime lifecycle responsibilities.

---

## Source Evidence

| Source | Evidence Summary |
|---|---|
| `.planning/codebase/ARCHITECTURE.md:87-114` | Tools expose write-side command/mutation operations. |
| `.planning/codebase/ARCHITECTURE.md:115-134` | Hooks observe/react to lifecycle events and are read-side only. |
| `.planning/codebase/ARCHITECTURE.md:271-315` | Delegation, PTY/background command, prompt enhancement, event observation, and state management flows are distinct. |
| `.planning/REQUIREMENTS.md:42-56` | Governance/registry path marks auto-commands and workflow router as missing. |
| `.planning/REQUIREMENTS.md:73-82` | Critical gaps include f-04 routing, bootstrap, language wiring, and lifecycle gate criteria. |
| `.planning/ROADMAP.md:22-27` | CA-04 restructures bootstrap, runtime wiring, state ownership, and lifecycle audit into ordered sub-phases. |

---

## Lifecycle / Pipeline Categorization

| Category | Definition | Primary Surface | Lifecycle Owner | Pipeline Role | Current Status |
|---|---|---|---|---|---|
| Command | Explicit invocations that parse arguments and call tools/CLI behavior. | `src/tools/`, `src/cli/`, `.opencode/commands/` | Tool/CLI owners | Entry or mutation operation | f-04 auto-command engine missing; CLI init missing. |
| Workflow | Multi-step routed process with gates, actors, and phase authorization. | `.planning/`, command engine, future router | L0/L1 coordinator concepts + runtime router | Sequencing and guardrail layer | Managed loop documented; auto-router missing. |
| Session Continuity | Preservation of root/child session context, compaction, lineage, and recovery. | `.hivemind/state/`, `src/lib/continuity.ts`, session journal | Continuity/session lifecycle modules | Runtime memory and recovery layer | Partial; typed owners incomplete. |
| Task Continuity | Delegation status, task result retrieval, queues, completion detection, and notifications. | `src/lib/delegation-manager.ts`, `src/tools/delegation-status.ts`, `.hivemind/state/delegations.json` | Delegation manager/state modules | WaiterModel work tracking | Partial; future routing and task-plus lifecycle gaps remain. |
| Gate Evidence | Proof that lifecycle, spec, and runtime behavior match claims. | `.planning/checklists/`, gate skills, tests | Gate triad | Acceptance/blocking layer | Docs-only L5 in this phase. |

---

## Actor / Consumer / Purpose Map

| Actor | Produces | Consumes | Purpose | Boundary |
|---|---|---|---|---|
| Human user | Intent, authorization, judgment | Roadmap/state summaries and gate results | Authorize one managed cycle at a time. | Does not supply runtime proof by assertion alone. |
| L0 orchestrator | Routing and authorization framing | User intent, roadmap, state | Route tasks and enforce gates. | Must not implement specialist work. |
| L1 coordinator | Wave dispatch and checkpoint gates | Roadmap phases, checklists, specialist reports | Sequence subagent work and verify handoffs. | Must stop on gate failures. |
| L2 specialist | Domain artifact or implementation within scope | Task packet, source refs, required skills | Execute bounded specialist work. | Cannot exceed task scope. |
| Command engine | Parsed command/workflow decisions | Commands, arguments, workflow config | Convert user-command intent into bounded actions. | Future phase; not proven here. |
| Tool layer | Mutations and write-side operations | Tool schemas, runtime state APIs | Perform authorized changes. | CQRS write-side only. |
| Hook layer | Observations, guards, response shaping | OpenCode events, runtime state reads | Observe lifecycle and guard behavior. | No durable writes. |
| Continuity modules | Durable continuity records | Sessions, delegations, state root | Recover context across sessions/restarts. | Must write only to `.hivemind/`. |
| Gate triad | PASS/FAIL/BLOCK verdicts | Specs, lifecycle docs, evidence | Prevent false readiness claims. | Evidence gate blocks docs-only runtime claims. |

---

## Naming Conventions

| Realm | Convention | Rationale |
|---|---|---|
| Product-dev skills/agents | `hm-*` | Strict Hivemind lineage for product/harness workflows. |
| Meta-builder primitives | `hf-*` | Flexible meta-concept authoring lineage. |
| Internal quality gates | `gate-*` | Project-only quality triad and gate references. |
| Stack references | `stack-*` | External package/framework reference skills. |
| Planning artifacts | `<name>-YYYY-MM-DD.md` within categorized `.planning/<group>/` directories | Date-stamped artifact tracking and category separation. |
| Runtime state | `.hivemind/**` | Canonical Q6 state root. |
| OpenCode primitives | `.opencode/**` | Primitive-only runtime configuration surface. |

---

## Falsifiable Requirements

### REQ-CWS-01: Command/Workflow/Continuity Separation
**Source:** `.planning/codebase/ARCHITECTURE.md:87-134`; `.planning/codebase/ARCHITECTURE.md:271-315`; lifecycle categorization at this artifact lines 31-38.  
**Condition:** The map SHALL distinguish command, workflow, session continuity, and task continuity as separate categories.  
**Acceptance Criteria:** Given this artifact, when a reviewer inspects the categorization table, then each category has distinct surface, owner, and pipeline role.  
**Verification Method:** Documentation inspection.  
**Status:** locked

### REQ-CWS-02: Actor/Consumer/Purpose Coverage
**Source:** `.planning/codebase/ARCHITECTURE.md:209-245`; `.planning/codebase/ARCHITECTURE.md:339-353`; actor map at this artifact lines 43-53.  
**Condition:** The map SHALL provide actor/consumer/purpose coverage for the human, coordinator, specialist, command, tool, hook, continuity, and gate actors.  
**Acceptance Criteria:** Given this artifact, when a reviewer inspects the actor map, then each actor has produces, consumes, purpose, and boundary fields.  
**Verification Method:** Documentation inspection.  
**Status:** locked

### REQ-CWS-03: Future Runtime Claims Blocked
**Source:** `.planning/REQUIREMENTS.md:73-82`; `.planning/ROADMAP.md:29-47`; source evidence table at this artifact lines 20-25.  
**Condition:** The map SHALL classify f-04 routing, CLI init, and continuity management improvements according to the missing/partial status in source evidence.  
**Acceptance Criteria:** Given the source evidence table and categorization table, when a reviewer checks status, then missing/partial surfaces are not presented as delivered.  
**Verification Method:** Documentation inspection against `.planning/REQUIREMENTS.md:73-82`.  
**Status:** locked

---

## Acceptance Matrix

| REQ ID | Source quote/path | Positive | Negative | Boundary | Integration | Verification method | Coverage state |
|---|---|---|---|---|---|---|---|
| REQ-CWS-01 | `.planning/codebase/ARCHITECTURE.md:87-134`; `.planning/codebase/ARCHITECTURE.md:271-315`; this artifact lines 31-38 | Categorization table separates command, workflow, session continuity, task continuity, and gate evidence with distinct surfaces/owners/roles. | A row collapses command execution into workflow orchestration or session/task continuity into one owner without distinction. | Gate evidence is adjacent to runtime surfaces but remains a blocking/evidence category, not a mutation surface. | Maps tools, hooks, state modules, command engine, and planning gates into one lifecycle pipeline view. | Documentation inspection of lifecycle categorization table. | mapped |
| REQ-CWS-02 | `.planning/codebase/ARCHITECTURE.md:209-245`; `.planning/codebase/ARCHITECTURE.md:339-353`; this artifact lines 43-53 | Actor table lists human, L0, L1, L2, command engine, tool layer, hook layer, continuity modules, and gate triad with produces/consumes/purpose/boundary fields. | Any named actor lacks a boundary or the table authorizes an actor to mutate outside its allowed surface. | Future new actor types require a produces/consumes/purpose/boundary row before phase authorization. | Aligns hierarchy actors with CQRS tool/hook/state boundaries. | Documentation inspection of actor/consumer/purpose map. | mapped |
| REQ-CWS-03 | `.planning/REQUIREMENTS.md:73-82`; `.planning/ROADMAP.md:29-47`; this artifact lines 20-25 | Missing f-04 routing, CLI init, and partial continuity surfaces are marked missing, partial, future, or blocked. | The map presents f-04 routing, CLI init, or continuity improvements as delivered runtime capabilities. | Docs-only O3 map may prepare future routing but cannot authorize runtime edits or readiness claims. | Cross-checks roadmap O3/CA-04 sequencing with requirements gaps and lifecycle categories. | Documentation inspection against `.planning/REQUIREMENTS.md:73-82` and `.planning/ROADMAP.md:29-47`. | mapped |

---

## Future Phase Routing

1. Bootstrap/init CLI SHALL wait for dedicated phase authorization and SDK/CLI checkpointing.
2. Config realm cleanup SHALL reconcile command/workflow/session settings without collapsing state roots.
3. Routing workflow foundation SHALL define f-04 intent classification and workflow router before runtime edits.
4. Session/task continuity management SHALL define owners and evidence gates before state mutation work.
