# Governance And Control-Plane Unification Audit
## Phase 1 Entry Point Document (Symlink Reference)

**Date**: 2026-03-08  
**Session ID**: e8030263-bc7b-4e5a-9243-79c00da428bd  
**Status**: 🔴 ACTIVE AUDIT — Reference for Phase 1 Execution  
**Scope**: 4 Sectors × 4 Domains Analysis Matrix  
**Purpose**: Definitive guide for execution flows, tool usage, and delegation decisions

---

## Executive Summary

The HiveMind plugin ecosystem operates with **parallel governance systems** (Plugin A: `src/` runtime + Plugin B: `.opencode/` overlay) that register for the same hook events without coordination protocol. This audit maps the 4×4 intersection matrix to clarify:

1. **Intent Detection & Dependencies** — What must exist before execution
2. **Delegation & Role-Awareness** — Agent topology and prerequisites
3. **Session Lineage & Workflows** — Interconnected session patterns
4. **Governance & Control** — Enforcement layers and blocking conditions

---

## The 4×4 Analysis Matrix

### Sector 1: Meta Concepts (Commands, Agents, Skills, Chaining)

| Domain | Analysis | Key Findings |
|--------|----------|--------------|
| **1.1 Intent Detection** | Commands load deterministic scripts via shell exec (`detect-entry.sh`, `classify-intent.sh`). CLI init sets STATE files in `.hivemind/` which agents auto-fetch. | Shell-based intent classification has **3 independent mechanisms**: `scripts/classify-intent.sh`, `.opencode/plugins/intent-classifier.ts`, and `src/lib/session-intent-classifier.ts`. No single source of truth. |
| **1.2 Delegation** | Agents have defined roles in `REGISTRY.md`: hivefiver/hiveminder (primary), hivemaker/hivehealer/hiveplanner (subagent), hiveq/hivexplorer/hiverd/hitea (specialized). | Sub-agents **bypass ALL plugin hooks** (documented constraint PP-01). Child sessions operate WITHOUT governance. |
| **1.3 Session Lineage** | Lineage classification chain: `detect-entry.sh` → `classify-intent.sh` → plugin persistence → internal lib. | **3 independent classifiers** may produce different results. Lineage not captured in `chat.params` hook (missing). |
| **1.4 Governance** | Skills define capabilities but selection is agent-discretionary, not role-enforced. | 34 skill directories = suggestions, not constraints. Workflow YAML files have no runtime interpreter. |

**Sector 1 Critical Dependency**: `scripts/detect-entry.sh` must run before any intent classification. Returns `entry_condition`: `bootstrap_required` | `classify_required` | `ready`.

---

### Sector 2: `.opencode/` — Plugins & Tools

| Domain | Analysis | Key Findings |
|--------|----------|--------------|
| **2.1 Intent Detection** | **Entry Guard Hook** (`entry-guard.ts`) runs `detect-entry.sh` on `session.created`. Falls back if `src/hooks/event-handler.ts` absent. | Cache mechanism: `coreRuntimeEntryOwnerPresent(worktree)` checks for canonical src ownership. **BUT**: Only applies to entry-guard, not intent-classifier or context-injection. |
| **2.2 Delegation** | **Delegation Hook** (`delegation.ts`) enforces topology on `tool.execute.before` for `task` tool. Calls `gx-enforce.sh`, `gx-trace-check.sh`. | Tracks delegation chain in `EnforcementState.delegationChain` (in-memory only — **lost on restart**). |
| **2.3 Session Lineage** | **Intent Classifier Hook** persists to session profile. **Context Injection Hook** has `coreRuntimeHooksPresent()` fallback check. | Profile storage: `.hivemind/sessions/active/<id>/profile.json`. No parent→child session ID linkage. |
| **2.4 Governance** | **Tool Execute Hooks** (before/after) run `gx-enforce.sh`, `gx-health-compute.sh`, `gx-mid-guard.sh`, `gx-auto-purge.sh`. | **Dual-gate problem**: Both Plugin A (`tool-gate.ts`) and Plugin B (`delegation.ts`) evaluate permissions with different criteria. |

**Sector 2 Hook Registration Matrix**:

```
Event                           Plugin A (src/)                    Plugin B (.opencode/)
─────────────────────────────────────────────────────────────────────────────────────────────────
session.created                 eventHandler                       entryGuardHook + eventHook
messages.transform              messagesTransformHook              intentClassifierHook + contextInjectionHook
tool.execute.before             toolGateHook                       toolExecuteBeforeHook (delegation)
tool.execute.after              softGovernanceHook                 toolExecuteAfterHook (health compute)
experimental.session.compacting compactionHook                     compactionHook (handoff purify)
```

---

### Sector 3: `src/` — Libs, Hooks, Schemas, Tools

#### 3.1 Core Session & Governance Libraries

| File | Purpose | Governance Role |
|------|---------|-----------------|
| `session-engine.ts` | Session lifecycle (start/update/close/resume) | **Primary session state manager** — creates `BrainState` |
| `session-governance.ts` | Signal compilation for lifecycle hook | Builds governance signals, warnings, framework lines |
| `session-intent-classifier.ts` | Pattern-matching intent classification | 6 categories: discovery, research, planning, implementing, debug, testing |
| `runtime-session-lineage.ts` | Parent/child session resolution via SDK | Resolves `parentID` from SDK, caches in `runtimeSessionLineageCache` |
| `gatekeeper.ts` | Hard programmatic enforcement | Validates `BrainState` against governance rules (5 checks) |
| `hierarchy-tree.ts` | Navigable hierarchy with timestamps | 1385 lines — tree CRUD, queries, staleness detection, rendering |
| `injection-orchestrator.ts` | Context budget management | Tracks injection across 3 channels: `core-system`, `core-message`, `plugin-message` |
| `sot-governance.ts` | Source-of-truth change tracking | Pending changes queue, verification ledger, git diff signatures |
| `state-mutation-queue.ts` | Deferred write system | Serializes writes to `brain.json` from multiple trigger points |

#### 3.2 Intent Detection Dependencies (Sector 3)

**Before any tool execution**:
1. `detect-entry.sh` must confirm `entry_condition != bootstrap_required`
2. `classify-intent.sh` OR `session-intent-classifier.ts` must resolve lineage
3. `BrainState` must load from `.hivemind/state/brain.json`
4. Hierarchy tree must exist (or be created) via `hierarchy-tree.ts`

#### 3.3 Delegation Chain (Sector 3)

```
Main Session → hivemind_session delegate → session-split.ts → 
  creates child session → swarm-executor.ts → 
    handoffs/ stores delegation packet (JSON+MD) → 
      hivemind_cycle export captures state
```

**Critical Gap**: `handoffs/` are **write-only** — no automated pickup mechanism (Finding D1).

#### 3.4 Governance Gates (Sector 3)

| Gate | Location | Trigger | Enforcement |
|------|----------|---------|-------------|
| Tool Gate | `hooks/tool-gate.ts` | `tool.execute.before` | **Advisory only** — logs warnings, cannot block (SDK limitation) |
| Gatekeeper | `lib/gatekeeper.ts` | Tool actions, session lifecycle | Programmatic validation, returns `passed: boolean` |
| Soft Governance | `hooks/soft-governance.ts` | `tool.execute.after` | Drift detection, chain breaks, violation tracking |
| SOT Governance | `lib/sot-governance.ts` | Tool calls | Pending changes queue, verification ledger |

---

### Sector 4: `.hivemind/` — States & Output

#### 4.1 State Entity Architecture

| Entity | Location | Managed By | Size | Critical For |
|--------|----------|-----------|------|--------------|
| `BrainState` | `state/brain.json` | `state-mutation-queue.ts` | 277KB | Session-scoped governance |
| `EnforcementState` | In-memory (.opencode/) | `plugins/hiveops-governance/utils.ts` | ~2KB | Plugin lifecycle |
| `HierarchyTree` | `state/hierarchy.json` | `hierarchy-tree.ts` | 1.2KB | Cross-session trajectory |
| `GraphState` | `graph/tasks.json`, `mems.json`, `trajectory.json` | `graph/writer.ts`, `graph-io.ts` | 32KB+6KB+0.5KB | Knowledge graph |
| `SessionManifest` | `sessions/manifest.json` | `manifest.ts` | 44B | Session index |
| `Config` | `config.json` | `persistence.ts` | 556B | Governance mode, language |

#### 4.2 Intent Detection Prerequisites

```
HiveMind Session Start Flow:
┌─────────────────────────────────────────────────────────────┐
│ 1. Check .hivemind/config.json exists                       │
│    └─ If NO: Run auto-init.sh → create scaffold             │
├─────────────────────────────────────────────────────────────┤
│ 2. Load BrainState from state/brain.json                    │
│    └─ If stale session: Archive old state                   │
├─────────────────────────────────────────────────────────────┤
│ 3. Run detect-entry.sh → determine entry_condition          │
│    ├─ bootstrap_required → Run auto-init.sh                 │
│    ├─ classify_required → Run classify-intent.sh            │
│    └─ ready → Proceed                                       │
├─────────────────────────────────────────────────────────────┤
│ 4. Classify intent → Resolve lineage (hivefiver/hiveminder) │
│    └─ Persist to session profile                            │
├─────────────────────────────────────────────────────────────┤
│ 5. Initialize/Load hierarchy tree                           │
│    └─ Create root node if empty                             │
├─────────────────────────────────────────────────────────────┤
│ 6. Session ready for execution                              │
└─────────────────────────────────────────────────────────────┘
```

#### 4.3 Delegation State Flow

```
Delegation Packet Structure (Zod schema):
┌─────────────────────────────────────────────────────────────┐
│ intent_id: UUID (links to hierarchy node)                   │
│ source_command: string (which command triggered)            │
│ target_agent: string (from REGISTRY.md)                     │
│ target_workflow: string (YAML workflow file)                │
│ skills_to_load: string[]                                    │
│ scope: { include_paths[], exclude_paths[], max_files? }     │
│ constraints: string[]                                       │
│ success_metrics: string[]                                   │
│ acceptance_criteria: string[]                               │
│ required_evidence: { kind, description, required }[]        │
│ failure_policy: { on_partial, on_failure, max_retries }     │
└─────────────────────────────────────────────────────────────┘
```

#### 4.4 Governance Enforcement Points

| Check Point | File | Condition | Blocks? |
|-------------|------|-----------|---------|
| Entry Guard | `.opencode/plugins/entry-guard.ts` | `entry_condition == bootstrap_required` | No (auto-init) |
| Intent Classification | Multiple (see 1.1) | Lineage unresolved | No (defaults) |
| Tool Gate | `src/hooks/tool-gate.ts` | Governance mode + tool policy | **No** (SDK limitation) |
| Delegation Enforcement | `.opencode/plugins/delegation.ts` | Topology validation + scope check | **YES** (throws Error) |
| Gatekeeper | `src/lib/gatekeeper.ts` | 5 checks on BrainState | Returns `passed: boolean` |
| Soft Governance | `src/hooks/soft-governance.ts` | Drift, chain breaks, violations | Logs only |

---

## Cross-Sector Dependency Graph

### Execution Order Dependencies

```
Mutation Trigger Points:
├── session-lifecycle.ts → session state changes
├── messages-transform.ts → intent classification
├── soft-governance.ts → violation tracking
├── tool-gate.ts → tool execution metadata
├── session-engine.ts → session lifecycle
└── state-mutation-queue.ts → serialized writes

Write Flow:
1. Component calls queueMutation()
2. Mutation added to in-memory queue
3. Debounced flush (default 100ms)
4. Write to brain.json atomically
5. Emit state:mutated event
```

### Session Lineage Awareness Flow

```
Session Entry → Intent Classification → Agent Resolution → Execution
     ↓                    ↓                      ↓              ↓
detect-entry.sh    3 mechanisms         REGISTRY.md      Tool Gate
                         ↓                      ↓         + Delegation
                   shell script                 ↓              ↓
                   plugin hook             Allowed tools    Enforcement
                   internal lib                +            (some blocks)
                                          Delegation scope
```

---

## Critical Findings by Domain

### Domain 1: Intent Detection & Dependencies — 🔴 CRITICAL

| Finding | ID | Impact | Mitigation |
|---------|-----|--------|------------|
| Triple intent classification | AP-9 | Inconsistent lineage resolution | Pick 1 mechanism (TypeScript lib), remove shell script |
| Session entry race condition | C1 | Both plugins init state independently | Implement coordinator pattern |
| No parent→child session linkage | D5 | Cannot trace delegation chains | Add `parent_session_id` to BrainState |

### Domain 2: Delegation & Role-Awareness — 🔴 CRITICAL

| Finding | ID | Impact | Mitigation |
|---------|-----|--------|------------|
| Delegation chain in-memory only | D2 | Lost on plugin restart | Persist to `.hivemind/sessions/active/<id>/delegation.json` |
| Handoffs write-only | D1 | Exported intelligence never re-imported | Implement handoff pickup mechanism |
| Sub-agents bypass hooks | PP-01 | Child sessions without governance | Document constraint, minimize sub-agent work |

### Domain 3: Session Lineage & Workflows — 🟡 HIGH

| Finding | ID | Impact | Mitigation |
|---------|-----|--------|------------|
| Workflow YAML no interpreter | AP-2 | Declared processes not enforced | Build runtime interpreter or convert to code |
| Sequential delegation YAML (7KB) | D3 | Complex flow without executor | Implement interpreter or simplify |
| Session manifest empty (44B) | D4 | No session index maintained | Populate manifest on session create/close |

### Domain 4: Governance & Control — 🔴 CRITICAL

| Finding | ID | Impact | Mitigation |
|---------|-----|--------|------------|
| Dual governance plugins | C1-C6 | Parallel execution, no coordination | **Unify into single plugin** (P0) |
| Dual state tracking | AP-10 | BrainState + EnforcementState drift | Merge into single state store |
| Tool gate cannot block | AP-4 | SDK limitation, advisory only | Work with OpenCode team or accept constraint |
| SOT governance opt-in | AP-5 | Agents must choose to validate | Make mandatory at hook level |

---

## Phase 1 Execution Guide

### Tool Usage Matrix

| Tool | Sector | Domain | Prerequisites | When to Use |
|------|--------|--------|---------------|-------------|
| `hivemind_session start` | src/tools | Lineage | Config exists | New session entry |
| `hivemind_session delegate` | src/tools | Delegation | Active session, target agent | Spawn sub-agent |
| `hivemind_inspect deep` | src/tools | Governance | Active session | Verify state integrity |
| `hiveops_gate check` | .opencode/tool | Governance | Gate ID (G0-G4) | Quality validation |
| `hivemind_cycle export` | src/tools | Lineage | Session has data | Create handoff |
| `hivemind_hierarchy` | src/tools | Intent | Hierarchy exists | Navigate tree |
| `hivemind_plan create` | src/tools | Intent | Trajectory declared | Create sub-plan |

### Delegation Decision Tree

```
Should I delegate this task?
│
├─ Is the task > 200 lines of code? ─────────────── YES → Delegate to hivemaker
│
├─ Does it require research/analysis? ────────────── YES → Delegate to hiverd
│
├─ Is it a bug fix with clear repro? ───────────── YES → Delegate to hivehealer
│
├─ Does it need planning/architecture? ──────────── YES → Delegate to hiveplanner
│
├─ Is it verification/testing? ──────────────────── YES → Delegate to hiveq
│
├─ Is it exploration/investigation? ─────────────── YES → Delegate to hivexplorer
│
└─ Is it a simple, self-contained task? ─────────── NO → Execute directly
```

### Entry Contributors Sequence

```
New Contributor Onboarding:
1. Run detect-entry.sh → Confirm state_exists
2. Run classify-intent.sh → Determine if hivefiver or hiveminder context
3. Load appropriate agent profile from REGISTRY.md
4. Initialize session with hivemind_session start
5. Run hivemind_inspect scan → Verify setup complete
6. Declare intent with appropriate trajectory/tactic/action
7. Begin execution with governance tools active
```

---

## Appendix A: File Reference Map

### Core Governance Files

| Category | Path | Lines | Purpose |
|----------|------|-------|---------|
| **Plugin Entry** | `src/index.ts` | ~200 | Plugin A registration |
| **Plugin Entry** | `.opencode/plugins/hiveops-governance/index.ts` | ~100 | Plugin B registration |
| **Session Engine** | `src/lib/session-engine.ts` | 669 | Session lifecycle |
| **Intent Classifier** | `src/lib/session-intent-classifier.ts` | 144 | Pattern matching |
| **Gatekeeper** | `src/lib/gatekeeper.ts` | 159 | Hard validation |
| **Hierarchy** | `src/lib/hierarchy-tree.ts` | 1385 | Tree operations |
| **Tool Gate** | `src/hooks/tool-gate.ts` | 458 | Advisory enforcement |
| **Delegation** | `.opencode/plugins/hiveops-governance/hooks/delegation.ts` | 217 | Topology enforcement |
| **Entry Guard** | `.opencode/plugins/hiveops-governance/hooks/entry-guard.ts` | 152 | Bootstrap logic |

### Schema Definitions

| Schema | Path | Lines | Defines |
|--------|------|-------|---------|
| Delegation Packet | `src/schemas/delegation-packet.ts` | 45 | Zod schema for handoffs |
| Governance Constitution | `src/schemas/governance-constitution.ts` | 59 | Rules, checklists |
| Brain State | `src/schemas/brain-state.ts` | ~800 | Session state |
| Graph Nodes | `src/schemas/graph-nodes.ts` | ~600 | Task/memory structures |

---

## Appendix B: State Mutation Queue Flow

```
Mutation Trigger Points:
├── session-lifecycle.ts → session state changes
├── messages-transform.ts → intent classification
├── soft-governance.ts → violation tracking
├── tool-gate.ts → tool execution metadata
├── session-engine.ts → session lifecycle
└── state-mutation-queue.ts → serialized writes

Write Flow:
1. Component calls queueMutation()
2. Mutation added to in-memory queue
3. Debounced flush (default 100ms)
4. Write to brain.json atomically
5. Emit state:mutated event
```

---

**Document Classification**: Symlink Reference  
**Next Action**: Load this document in Phase 1 initialization to resolve tool usage, execution chains, and delegation decisions.

**Related Documents**:
- `hivemind-comprehensive-audit-report.md` (689 lines — detailed findings)
- `PLAN.md` (Project roadmap)
- `.opencode/agents/REGISTRY.md` (Agent topology)
