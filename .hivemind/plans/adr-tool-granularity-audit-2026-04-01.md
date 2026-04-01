# ADR: Tool Granularity & Composability Audit

**Date:** 2026-04-01
**Status:** proposed
**Scope:** 12 HiveMind agent tools
**Auditor:** architect (with code-skeptic challenge)

---

## Context

HiveMind ships 12 agent-callable tools. The user asks: **Are tools well-designed in granularity? Can they stack and chain? Are they use-case-specific with routing and combinations?**

This audit reads every tool implementation, types file, barrel export, and SDK docs to produce an evidence-based granularity matrix.

---

## GRANULARITY MATRIX

### Per-Tool Verdicts

| # | Tool | Args | Actions | File LOC | Verdict | Score | Rationale |
|---|------|------|---------|----------|---------|-------|-----------|
| 1 | `hivemind_runtime_status` | 0 | 1 | 82* | **JUST-RIGHT** | 8/10 | Zero-arg status probe. Different pressure contract (`steady-state`) and purpose classes (`discovery`, `gatekeeping`) from runtime_command. Lightweight "am I attached?" check. |
| 2 | `hivemind_runtime_command` | **21** | 1 | 82* | **TOO-COARSE** | 3/10 | 21 schema fields. Conflates command execution with profile injection. `intakeEvidence` (5 nested fields) is feature-specific. 9 profile fields should be read from runtime bindings, not passed by LLM. |
| 3 | `hivemind_doc` | 7 | 5 | 35 | **JUST-RIGHT** | 9/10 | Clean action routing. Every arg is relevant to at least 2 actions. Read-only. Focused concern. |
| 4 | `hivemind_task` | 9 | 7 | 42 | **JUST-RIGHT** | 9/10 | Canonical CRUD-like action pattern. Good ID chain support. Pressure contracts vary by action mutation class. |
| 5 | `hivemind_trajectory` | 13 | 6 | 49 | **BORDERLINE** | 7/10 | 13 args is the upper limit. Action routing keeps it manageable. Different state authority from handoff. `inspect`/`traverse` are read-only; `attach`/`checkpoint`/`event`/`close` are mutation. |
| 6 | `hivemind_handoff` | 22 | 6 | 54 | **BORDERLINE** | 6/10 | 22 args but decomposed into 6 focused interfaces (each ≤6 fields). Intersection type pattern works for TypeScript but LLM sees flat args. **`validate` action triggers side effects** — misleading name. |
| 7 | `hivemind_journal` | 4 | 6 | 196 | **JUST-RIGHT** | 8/10 | 4 top-level args. `payload` object is event-type-dependent but well-typed. Single write-side entry point. Good CQRS discipline. |
| 8 | `hivemind_agent_work_create_contract` | 10 | 2 | 155 | **TOO-COARSE** | 5/10 | `workflow.tasks` is a nested task graph (8 fields per task) passed as a single argument. LLM must construct complex data structure in one shot. Create/update have different required fields but share one Zod schema. |
| 9 | `hivemind_agent_work_export_contract` | 2 | 2 | 67 | **JUST-RIGHT** | 9/10 | Clean, focused, minimal. Two format options. Read-side complement to create. |
| 10 | `hivemind_hm_init` | 2 | 1 | 78 | **JUST-RIGHT** | 9/10 | Simple bootstrap tool. Two args (mode, force). Proposes actions without writing. |
| 11 | `hivemind_hm_doctor` | 2 | 1 | 109 | **JUST-RIGHT** | 9/10 | Simple diagnostics. Two args (scope, fix). Structured findings output. |
| 12 | `hivemind_hm_setting` | 6 | 1 | 220 | **BORDERLINE** | 6/10 | 6 args is fine, but `dashboard=true` triggers a CQRS violation: writes `dashboard-spec.json` to `.hivemind/activity/state/`. Dashboard rendering is not a tool concern. |

*runtime_status and runtime_command share a file (82 lines total)

### Summary Statistics

| Verdict | Count | Tools |
|---------|-------|-------|
| JUST-RIGHT | 7 | doc, task, journal, export_contract, hm_init, hm_doctor, runtime_status |
| BORDERLINE | 3 | trajectory, handoff, hm_setting |
| TOO-COARSE | 2 | runtime_command, agent_work_create_contract |
| TOO-FINE | 0 | (none) |

---

## COMPOSABILITY ANALYSIS

### ID Chain Graph

```
OpenCode Context (sessionId)
        │
        ▼
hivemind_trajectory ──── attach ────→ trajectoryId
        │                                 │
        │                                 ▼
        │                    hivemind_handoff ──── create ────→ handoffId
        │                          │
        │                          │ consumes: trajectoryId, workflowId, taskIds
        │                          │
        ▼                          ▼
hivemind_task ──── create ────→ taskId
        │
        │ consumes: workflowId
        │
        ▼
hivemind_agent_work_create_contract ──── create ────→ contractId
        │
        │ consumes: sessionId
        │
        ▼
hivemind_agent_work_export_contract ──── reads ────→ contractId (input)
```

### ID Producer/Consumer Matrix

| ID | Producer | Consumer(s) | Gap? |
|----|----------|-------------|------|
| `sessionId` | OpenCode context | trajectory, handoff, journal, create_contract | None |
| `trajectoryId` | trajectory (attach) | trajectory, handoff | None |
| `workflowId` | **EXTERNAL** (not produced by any tool) | task, trajectory, handoff | **GAP** — workflow creation is not tool-accessible |
| `taskId` | task (create) | task, trajectory, handoff | None |
| `handoffId` | handoff (create) | handoff | None |
| `contractId` | create_contract (create) | create_contract, export_contract | None |

### Always-Together Sequences

These tool call sequences always occur in order. They are candidates for combined higher-level tools:

| Sequence | Frequency | Combined Name? |
|----------|-----------|----------------|
| `task.create` → `trajectory.attach` → `handoff.create` | High (delegation flow) | Could be `hivemind_delegate` |
| `create_contract.create` → `export_contract` (summary) | High (compaction flow) | Could be `hivemind_compact_contract` |
| `hm_init` → `hm_doctor` | Low (bootstrap only) | Keep separate — different triggers |
| `runtime_status` → `runtime_command` | Medium (pre-check before command) | Keep separate — different pressure contracts |

### Never-Together Pairs

These tools are never called in the same logical flow. They should stay separate:

| Tool A | Tool B | Reason |
|--------|--------|--------|
| `doc` | `handoff` | Read-only intelligence vs delegation mutation |
| `journal` | `hm_init` | Session tracking vs project bootstrap |
| `export_contract` | `hm_doctor` | Contract read vs diagnostics |

### Conditional Routing

6 tools use the `action` enum pattern for routing:

| Tool | Action Count | Routing Pattern |
|------|-------------|-----------------|
| `doc` | 5 | File ops: skim/read/chunk/search/skim_directory |
| `task` | 7 | CRUD lifecycle: create→list→get→activate→rotate→verify→complete |
| `trajectory` | 6 | Session lifecycle: inspect→traverse→attach→checkpoint→event→close |
| `handoff` | 6 | Delegation lifecycle: create→read→list→update→validate→close |
| `journal` | 6 (event types) | Event dispatch by eventType |
| `create_contract` | 2 | Create/update toggle |

**Assessment:** The action-based routing pattern is well-suited for this tool set. Each tool manages a single domain entity (task, trajectory, handoff, doc, journal, contract) with operations that share most of the arg schema. Splitting these into separate tools per action would create a coordination problem for agents.

---

## STACKING OPPORTUNITIES

### 1. MERGE: `runtime_command` profile resolution (CRITICAL)

**Problem:** 9 of 21 args are profile fields (`language`, `expertLevel`, `governanceMode`, etc.) that exist in the runtime bindings snapshot.

**Solution:** Remove profile fields from tool schema. Read them from runtime bindings inside the feature executor (`executeHivemindRuntimeCommand`).

**Result:** 21 args → ~3 args (`command`, `arguments`, `userMessage`)

**Impact:** Agents no longer need to pass 9 irrelevant profile fields per command invocation.

### 2. EXTRACT: `intakeEvidence` from `runtime_command` (HIGH)

**Problem:** `intakeEvidence` is a 5-field nested object exclusive to the `guided-onboarding` preset. It's a feature-specific concern baked into a general-purpose command dispatcher.

**Solution:** Either:
- (A) Absorb into `hm_setting` as an intake completion action
- (B) Create a dedicated `hm_intake` tool

**Result:** Removes the most complex nested object from the command tool.

### 3. EXTRACT: Workflow task graph from `create_contract` (HIGH)

**Problem:** The `workflow.tasks` argument accepts a full task graph (8 fields per task) in a single shot. LLMs construct complex data structures poorly in one pass.

**Solution:** Create `hivemind_agent_work_update_workflow` tool for task graph mutations (add task, update status, set dependencies).

**Result:** `create_contract` becomes `rawIntent` + top-level metadata only. Workflow mutations are incremental.

### 4. FIX: `handoff.validate` naming (MEDIUM)

**Problem:** `validate` action triggers side effects (`syncDelegationContinuity`, `recordHandoffEvent`). The name implies a read-only query.

**Solution:** Rename to `activate` or `dispatch`.

### 5. FIX: `hm_setting` dashboard CQRS violation (MEDIUM)

**Problem:** `dashboard=true` writes `dashboard-spec.json` to `.hivemind/activity/state/`. This is rendering output, not config data.

**Solution:** Remove `dashboard` arg from tool. Move `buildHmSettingDashboardProof` to a hook that observes tool output. Side-car reads from tool return value, not disk.

### REJECTED Proposals

| Proposal | Rejection Reason |
|----------|-----------------|
| Merge `runtime_status` into `runtime_command` | Different pressure contracts, purpose classes, agent intents |
| Split `handoff` into lifecycle + query | Interface decomposition already handles arg complexity; splitting creates coordination problem |
| Merge `trajectory` with `handoff` | Different state authorities (`trajectory` vs `delegation`), different lifecycles |
| Split `create_contract` create/update into two tools | Action pattern is clean; the problem is workflow nesting, not create/update co-location |

---

## COMPOSABILITY SCORE PER TOOL

| Tool | Score | Justification |
|------|-------|---------------|
| `hivemind_doc` | **9** | Clean action routing. Every arg relevant. Read-only. Stacks with any tool for context gathering. |
| `hivemind_task` | **9** | Clean CRUD lifecycle. Good ID chain. `taskId` feeds trajectory, handoff, and contract tools. |
| `hivemind_agent_work_export_contract` | **9** | Minimal (2 args). Clean read-side complement. `contractId` input from create_contract. |
| `hivemind_hm_init` | **9** | Simple bootstrap. Produces project state for hm_doctor and hm_setting. |
| `hivemind_hm_doctor` | **9** | Simple diagnostics. Follows hm_init. Produces findings for agent decision-making. |
| `hivemind_runtime_status` | **8** | Zero-arg status check. Always safe to call. Output feeds runtime_command decisions. |
| `hivemind_journal` | **8** | 4 args. Good CQRS discipline. Single write-side entry point. sessionId input from context. |
| `hivemind_trajectory` | **7** | 13 args at upper limit. Good action routing. `trajectoryId` feeds handoff. State authority separation from handoff is correct. |
| `hivemind_hm_setting` | **6** | 6 args OK, but dashboard mode is a CQRS violation. Rendering logic doesn't belong in a tool. |
| `hivemind_handoff` | **6** | 22 args but well-decomposed. `validate` name is misleading (has side effects). Intersection type pattern is good TypeScript but LLM sees flat args. |
| `hivemind_agent_work_create_contract` | **5** | Workflow task graph is too complex for single-shot LLM construction. Create/update have different required fields but share one schema. |
| `hivemind_runtime_command` | **3** | 21 args. Conflates command execution with profile injection. `intakeEvidence` is feature-specific. LLM must pass 9 irrelevant profile fields per invocation. |

**Average composability score: 7.4/10**

---

## RECOMMENDED RESTRUCTURING

### Priority 1 — CRITICAL (Do First)

| Change | Tool(s) | Impact |
|--------|---------|--------|
| Strip profile fields from `runtime_command` schema | runtime_command | 21→3 args |
| Read profile from runtime bindings in executor | runtime_command | No LLM burden |

### Priority 2 — HIGH

| Change | Tool(s) | Impact |
|--------|---------|--------|
| Extract `intakeEvidence` from `runtime_command` | runtime_command → hm_setting or new hm_intake | Remove complex nested object |
| Extract workflow task graph mutations | create_contract → new `hivemind_agent_work_update_workflow` | Incremental task graph building |
| Rename `handoff.validate` → `handoff.activate` | handoff | Accurate semantics |

### Priority 3 — MEDIUM

| Change | Tool(s) | Impact |
|--------|---------|--------|
| Remove `dashboard` arg from `hm_setting` | hm_setting | Fix CQRS violation |
| Move dashboard rendering to hook | hm_setting → hooks | Separation of concerns |

### Priority 4 — LOW (No Action)

| Tool | Action | Reason |
|------|--------|--------|
| `runtime_status` | Keep as-is | Zero-arg status probe serves a unique purpose |
| `doc` | Keep as-is | Clean action routing, right-sized |
| `task` | Keep as-is | Model CRUD lifecycle pattern |
| `journal` | Keep as-is | Single write-side entry point |
| `trajectory` | Keep as-is | Correct state authority separation |
| `handoff` | Keep as-is (with rename) | Interface decomposition sufficient |
| `export_contract` | Keep as-is | Minimal and focused |
| `hm_init` | Keep as-is | Simple bootstrap |
| `hm_doctor` | Keep as-is | Simple diagnostics |

---

## TRADE-OFF ANALYSIS

### Decision: Action-based routing vs. separate tools per operation

**Context:** 6 of 12 tools use `action` enum for routing.

| Option | Pros | Cons |
|--------|------|------|
| **Action-based routing (current)** | Single tool name for agents to learn; shared arg schema; consistent pattern; catalog metadata is per-tool | Flat arg list looks large; some args irrelevant per action |
| **Separate tools per action** | Cleaner arg schemas per tool; LLM sees only relevant args | 12 tools → 30+ tools; coordination problem; catalog bloat; agents must learn 30+ names |
| **Hybrid: action routing + context-aware arg filtering** | Best of both: single tool name, filtered schema per action | Requires custom schema resolution; not supported by OpenCode SDK today |

**Decision:** Keep action-based routing. The hybrid approach is the ideal future state but requires SDK changes. The current pattern is well-understood by agents and consistent across the tool set.

### Decision: Interface decomposition vs. flat args

**Context:** Handoff uses intersection types; other tools use flat interfaces.

| Option | Pros | Cons |
|--------|------|------|
| **Interface decomposition (handoff pattern)** | TypeScript type safety; ≤10 fields per interface; JSDoc per interface | LLM sees flat args anyway; intersection types are invisible to agents |
| **Flat interfaces (other tools pattern)** | Simple; no indirection | God interfaces if not careful |

**Decision:** Both are acceptable. The handoff decomposition is good for developer readability but provides no LLM benefit. Keep it for documentation value but don't extend the pattern to other tools.

---

## VERIFICATION CRITERIA

For hiveq to verify this audit:

1. **Arg counts verified:** `rg "tool\.schema\." src/tools/*/tools.ts | wc -l` per tool
2. **Action counts verified:** `rg "enum\(\[" src/tools/*/tools.ts` per tool
3. **ID chain verified:** Trace `taskId`/`trajectoryId`/`handoffId`/`contractId` producers and consumers across all tool execute functions
4. **CQRS violation verified:** `rg "writeFileSync\|writeFile" src/tools/hivefiver-setting/` should find the dashboard write
5. **Side effects in validate verified:** Read `src/features/handoff/handoff.ts` for `syncDelegationContinuity` call during validate action
6. **Profile fields verified:** `rg "language\|expertLevel\|governanceMode\|automationLevel\|outputStyle\|preferredUserName\|artifactLanguage" src/tools/runtime/tools.ts` should show 9 profile fields in schema

---

## IMPLEMENTATION GUIDANCE (for hivemaker)

### Step 1: Strip profile fields from runtime_command

In `src/tools/runtime/tools.ts`, the tool schema at lines 47-71 should be reduced to:
- `command` (required)
- `arguments` (optional)
- `userMessage` (optional)

Move the 9 profile fields to `executeHivemindRuntimeCommand` in `src/features/runtime-observability/status.ts`, reading from the runtime bindings snapshot.

### Step 2: Extract intakeEvidence

Move the `intakeEvidence` object and its 5 fields out of the runtime_command schema. Options:
- (A) Add an `intake` action to `hm_setting` tool
- (B) Create a new `hivemind_hm_intake` tool

### Step 3: Create workflow mutation tool

Create `src/tools/agent-work-workflow/tools.ts` with a new tool `hivemind_agent_work_update_workflow`:
- Args: `contractId`, `action` (add_task, update_task_status, set_dependencies, update_phase)
- This handles incremental task graph mutations
- `create_contract` only accepts `rawIntent` + top-level metadata

### Step 4: Rename handoff.validate → handoff.activate

In `src/tools/handoff/types.ts`, change:
```typescript
type HivemindHandoffAction = 'create' | 'read' | 'list' | 'update' | 'activate' | 'close'
```
Update all references in handoff feature executor.

### Step 5: Extract dashboard from hm_setting

Remove `dashboard` arg from `src/tools/hivefiver-setting/tools.ts`. Move `buildHmSettingDashboardProof` and `writeFileSync` to a hook in `src/hooks/`.
