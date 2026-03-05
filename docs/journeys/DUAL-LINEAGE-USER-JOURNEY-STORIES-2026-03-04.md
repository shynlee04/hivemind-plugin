# Dual-Lineage User Journey: Separate Spaces, Shared Entry Sequence

This document defines the **entry journey** that precedes lineage routing, and clarifies the **two totally separate spaces** that must never be conflated.

---

## The Core Architecture: Two Separate Spaces

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    UNIVERSAL ENTRY SEQUENCE (Shared)                        │
│  State Detection → Context Coherence → Auto-Init → Declare Intent          │
│       ↓                                                                       │
│  Progressive Research-Synthesis Loop (QA → Investigate → QA → Surface)       │
│       ↓                                                                       │
│  Minimal Context Gathering (glob/search/grep - just enough, no flooding)     │
│       ↓                                                                       │
│                         LINEAGE ROUTER                                      │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
              ┌────────────────┴────────────────┐
              ▼                                 ▼
┌─────────────────────────────┐    ┌──────────────────────────────┐
│   HIVE-FIVER SPACE          │    │   HIVEMINDER SPACE           │
│   (Framework/Tooling)       │    │   (Project Implementation)   │
├─────────────────────────────┤    ├──────────────────────────────┤
│ • Skills/commands/workflows │    │ • External SDKs/libraries    │
│ • Agent shaping             │    │ • src/ code implementation   │
│ • Governance hardening      │    │ • Feature delivery           │
│ • OpenCode primitives       │    │ • Project-level planning     │
│ • Custom tool healers       │    │ • Product milestones         │
└─────────────────────────────┘    └──────────────────────────────┘
```

**Critical Principle**: These are not two branches of the same planning stream. They are **two totally separate spaces** with different artifacts, different planning logic, and different execution patterns.

---

## 1. Universal Entry Sequence (Pre-Routing)

Any entry condition must be handled by this sequence before lineage routing occurs:

### Entry Conditions (All Must Be Handled)
- Mid-workflow return (unfinished business)
- Brand new user (no state)
- Absurd/chaotic prompt
- Wall-of-text dump
- Testing project while framework still incomplete
- No state register exists (auto-init required)

### Entry Sequence Steps

1. **State Detection** (bash check)
   - Check for existing session state
   - Detect prior lineage if available
   - Assess coherence level

2. **Context Coherence Check**
   - Verify if context is recoverable
   - Check for contradictions or drift
   - Validate session continuity

3. **Auto-Init (if no state)**
   - Create profile.json
   - Establish baseline state
   - Set agent: "unresolved" until declare_intent fires

4. **Declare Intent**
   - Lock in mode (plan_driven / quick_fix / exploration)
   - Establish trajectory anchor
   - Begin drift tracking

5. **Progressive Research-Synthesis Loop** (Iterative until clear)
   ```
   QA → Delegate Investigate/Research → QA again → Surface Requirements
   ```
   - First QA: Frame ambiguity, identify gaps
   - Investigation: hiverd research, hivexplorer codebase analysis
   - Second QA: Test assumptions, validate findings
   - Surface: Produce requirements bundle
   - Loop continues until requirements are explicit enough for reliable delegation

6. **Minimal Context Gathering**
   - Targeted glob/search/grep (just enough, no flooding)
   - Context collectors prevent hallucination and workflow entry failure
   - Critical: Without proper delegation to explorers/collectors, context floods like this message

7. **Route to Lineage**
   - Decision point: Hive-Fiver or Hiveminder
   - No shared planning artifacts after this point

---

## 2. Hive-Fiver Space (Framework Lineage)

**Role**: Meta-builder, framework doctor, quality gatekeeper
**Scope**: Tools, skills, commands, workflows, agents, OpenCode primitives
**Does NOT**: Direct project feature implementation (that's Hiveminder)

### Hive-Fiver GSD Workflow Pattern

```
/gsd:new-project
    │
    ├── Questions → Research → Requirements → Roadmap
    │
    └── FOR EACH PHASE:
            │
            ├─ /gsd:discuss-phase (Lock in preferences)
            │
            ├─ /gsd:plan-phase (Research + Plan + Verify)
            │   ├── Phase Researcher (x4 parallel)
            │   │   ├── Stack researcher
            │   │   ├── Features researcher  
            │   │   ├── Architecture researcher
            │   │   └── Pitfalls researcher
            │   │
            │   ├── Planner (reads PROJECT.md, REQUIREMENTS.md, CONTEXT.md, RESEARCH.md)
            │   │
            │   ├── Plan Checker ──> PASS? ──> PLAN files
            │   │                     No (loop up to 3x)
            │   │
            │   └── Nyquist Validation (test coverage mapping before code)
            │
            ├─ /gsd:execute-phase (Parallel execution by wave)
            │   ├── Wave 1: Independent plans (fresh 200K context per executor)
            │   ├── Wave 2: Depends on Wave 1
            │   └── Verifier checks against phase goals
            │
            └─ /gsd:verify-work (Manual UAT)
                    │
                    ├── PASS ──> VERIFICATION.md
                    └── FAIL ──> Issues logged
```

### Hive-Fiver Can "Doctor" Hiveminder
- Improve OpenCode innate primitives
- Set up healers (custom tools only - no more)
- Provide framework-level guardrails
- BUT: Cannot directly implement features in src/

---

## 3. Hiveminder Space (Project Lineage)

**Role**: Project implementation, feature delivery
**Scope**: src/ codebase, external SDKs, libraries, product milestones
**Does NOT**: Framework tooling (that's Hive-Fiver)

### Hiveminder GSD Workflow Pattern

Same pattern as Hive-Fiver but applied to project implementation:
- Project-level planning (not framework planning)
- External SDK integration
- Feature implementation in src/
- Product milestone delivery

### Critical Difference
While the workflow pattern is similar, the **artifact space is completely separate**:
- Hive-Fiver: `skills/`, `commands/`, `workflows/`, `.opencode/`
- Hiveminder: `src/`, external dependencies, product code

---

## 4. Planning Artifacts: Same Pattern, Different Universes

The planning artifact structure looks similar but exists in **two parallel universes**:

### Artifact Pattern (Applied separately to each lineage)
```
.planning/
  PROJECT.md              # Vision and context (always lineage-specific)
  REQUIREMENTS.md         # Scoped v1/v2 requirements with IDs
  ROADMAP.md              # Phase breakdown with status tracking
  STATE.md                # Decisions, blockers, session memory
  config.json             # Workflow configuration
  MILESTONES.md           # Completed milestone archive
  research/               # Domain research
  todos/
    pending/              # Captured ideas awaiting work
    done/                 # Completed todos
  debug/                  # Active debug sessions
    resolved/             # Archived debug sessions
  phases/
    XX-phase-name/
      XX-YY-PLAN.md       # Atomic execution plans
      XX-YY-SUMMARY.md    # Execution outcomes and decisions
      CONTEXT.md          # Implementation preferences
      RESEARCH.md         # Ecosystem research findings
      VERIFICATION.md     # Post-execution verification results
```

### Key Insight
- Same artifact **pattern** is reused (GSD methodology)
- Same **granular control** with conditional parallelism
- BUT: **Different files, different locations, different ownership**
- Never assume one lineage's `PROJECT.md` relates to the other's

---

## 5. Delegation Levels and Tool Integration

### Two-Level Delegation System

**Level 1: Task Delegation** (coordinator to agents)
- Hiveminder or Hive-Fiver routes to subagents
- Clear handoff documents with constraints
- State validation before context transfer

**Level 2: Todo/Task Tool Schematic** (within agent execution)
- Tasks and todo tasks tool must work together schematically
- Task coordination across sub-tasks
- Dynamic todo list expansion as work progresses

### Entry-to-Delegation Chain

```
User Entry (any condition)
    ↓
State Detection → Context Coherence → Auto-Init → Declare Intent
    ↓
Progressive Research-Synthesis (QA cycles until requirements surface)
    ↓
Minimal Context Gathering (targeted, non-flooding)
    ↓
Lineage Router
    ↓
    ├─→ Hive-Fiver → Framework asset planning/execution
    │
    └─→ Hiveminder → Project implementation planning/execution
```

---

## 6. Edge Cases and Anti-Patterns

### E1: Context Flooding by Over-Collection
**Problem**: Without proper delegation to context collectors/explorers, every turn injects massive context.
**Solution**: Strict demand-driven collection; QA → Investigate → QA pattern; minimal targeted glob/search.

### E2: False Same-Stream Hallucination
**Problem**: AI assumes both lineages share the same planning artifacts.
**Reality**: Two totally separate spaces. Similar workflow patterns, completely separate files.

### E3: Mid-Workflow Dual Opening
**Problem**: User testing project while framework still incomplete; two lineages need simultaneous attention.
**Solution**: Clear session isolation per lineage; explicit routing decisions; no cross-contamination.

### E4: Task/Todo Tool Breakage
**Problem**: Tasks and todo tasks tool not working together schematically.
**Solution**: Coordinator maintains master task list; sub-tasks delegated with clear constraints; dynamic expansion tracked.

### E5: Workflow Entry Failure
**Problem**: Without context collectors/research delegation, system hallucinates and fails to enter proper workflow.
**Solution**: Progressive research-synthesis loop mandatory before any planning/execution.

---

## 8A. Deterministic Entry Sequence Coupling (DOCs-ENTRY-2026-03-05)

This section maps each entry step to concrete scripts, tools, commands, and agents for deterministic execution.

### ENTRY-STEP-01: State Detection

| Component | Type | Action | Output |
|-----------|------|--------|--------|
| [`scripts/detect-entry.sh`](scripts/detect-entry.sh) | Script | Check for `.hivemind/sessions/active/` and `.hivemind/state/brain.json` | Exit codes: 0=existing, 1=no-state, 2=corrupt |
| [`hivemind-context`](src/tools/hivemind-context.ts) | Tool | Read session profile and lineage state | `{ session_id, lineage, agent, coherence }` |
| Mode: `ask` | Agent | Execute targeted introspection if needed | Scope confirmation |

**Coupling Contract**:
```
ENTRY-STEP-01 OUTPUT → ENTRY-STEP-02 INPUT
```

---

### ENTRY-STEP-02: Context Coherence Check (CC-CHK-01)

| Component | Type | Action | Output |
|-----------|------|--------|--------|
| [`src/hooks/session-coherence/`](src/hooks/session-coherence/) | Hook | Validate session continuity | `{ coherent: boolean, drift_score: number }` |
| [`src/lib/detection.ts`](src/lib/detection.ts) | Lib | Run governance counters | `{ drift, compaction, out_of_order, evidence_pressure }` |
| [`commands/hivemind-context.md`](commands/hivemind-context.md) | Command | Inject context state | Coherence report |

**Deterministic Logic**:
- If `drift_score > 0.7` → Trigger `declare_intent` (ENTRY-STEP-04)
- If `drift_score 0.3-0.7` → Log warning, continue with enhanced monitoring
- If `drift_score < 0.3` → Proceed to ENTRY-STEP-03

---

### ENTRY-STEP-03: Auto-Init (if no state)

| Component | Type | Action | Output |
|-----------|------|--------|--------|
| [`scripts/auto-init.sh`](scripts/auto-init.sh) | Script | Bootstrap session directory | `.hivemind/sessions/active/<session-id>/profile.json` |
| [`src/hooks/event-handler.ts`](src/hooks/event-handler.ts) | Hook | Fire `session.created` event | profile.json with `agent: "unresolved"` |
| [`src/lib/paths.ts`](src/lib/paths.ts) | Lib | `getSessionPaths()` for session-specific paths | SessionPaths object |

**Critical**: Profile must have `agent: "unresolved"` until `declare_intent` fires.

---

### ENTRY-STEP-04: Declare Intent (DCL-INT-01)

| Component | Type | Action | Output |
|-----------|------|--------|--------|
| [`src/tools/hivemind-declare.ts`](src/tools/hivemind-declare.ts) | Tool | Lock in mode + trajectory | `{ mode, focus, trajectory_anchor }` |
| [`scripts/classify-intent.sh`](scripts/classify-intent.sh) | Script | Classify user intent | `{ intent_type: plan_driven | quick_fix | exploration }` |
| [`commands/hivemind-delegate.md`](commands/hivemind-delegate.md) | Command | Prepare delegation packet | Delegation context |

**Required Fields from Intent Declaration**:
- `mode`: One of `plan_driven`, `quick_fix`, `exploration`
- `focus`: What the user wants to accomplish
- `lineage`: `hive-fiver` or `hiveminder` (explicit routing decision)

---

### ENTRY-STEP-05: Progressive Research-Synthesis Loop (PRS-LOOP-01)

```
┌─────────────────────────────────────────────────────────────────┐
│  QA (Frame) → Delegate Investigate → QA (Validate) → Surface   │
│       ↑                                      │                 │
│       └──────────── Loop until clear ─────────┘                 │
└─────────────────────────────────────────────────────────────────┘
```

| Component | Type | Action | Output |
|-----------|------|--------|--------|
| [`commands/hiverd-research.md`](commands/hiverd-research.md) | Command | External ecosystem research | Research bundle |
| [`commands/hivefiver-discovery.md`](commands/hivefiver-discovery.md) | Command | Framework capability discovery | Capability matrix |
| `hivexplorer` | Agent | Codebase analysis (read-only) | Evidence report |
| `hiverd` | Agent | External research (terminal) | Synthesis bundle |
| [`commands/hiveq-gate-check.md`](commands/hiveq-gate-check.md) | Command | QA validation | PASS/FAIL with gaps |

**Loop Termination Criteria**:
1. Requirements are explicit enough for reliable delegation
2. All identified gaps have been assigned to sub-agents
3. QA validates readiness → Surface requirements bundle

**Max Iterations**: 3 (after 3, escalate to `hiveplanner` for synthesis)

---

### ENTRY-STEP-06: Minimal Context Gathering (MCG-01)

| Component | Type | Action | Output |
|-----------|------|--------|--------|
| `list_files` | Tool | Targeted directory listing | FileManifest |
| `codebase_search` | Tool | Semantic search (not flooding) | Relevant snippets |
| `search_files` | Tool | Regex search for patterns | Matched locations |
| `read_file` | Tool | Specific file reads with ranges | Context bundle |

**Critical Rules**:
- NEVER use `glob "**/*.md"` for context gathering
- Target specific paths only: `src/lib/`, `commands/`, `scripts/`
- Max 5 files per gathering round
- Prefer semantic search (`codebase_search`) over regex when possible

---

### ENTRY-STEP-07: Lineage Router

| Component | Type | Action | Output |
|-----------|------|--------|--------|
| [`scripts/classify-intent.sh`](scripts/classify-intent.sh) | Script | Final lineage determination | `{ lineage: hive-fiver | hiveminder }` |
| `hierarchy_manage` | Tool | Record routing decision | Hierarchy node with lineage ID |

**Routing Determinism**:
- If scope includes `.opencode/`, `skills/`, `commands/`, `workflows/` → `hive-fiver`
- If scope includes `src/`, external SDKs, product features → `hiveminder`
- If BOTH → Two separate sessions (one per lineage)

---

## 8B. Command + Agent Coupling Matrix (ROUTING-MATRIX-01)

### Pre-Routing Phase (Shared Sequence)

| Entry Step | Scripts | Tools | Commands | Agents |
|------------|---------|-------|----------|--------|
| ENTRY-STEP-01 | `detect-entry.sh` | `hivemind-context` | — | Mode: `ask` |
| ENTRY-STEP-02 | — | `detection.ts` hooks | `hivemind-context` | — |
| ENTRY-STEP-03 | `auto-init.sh` | `event-handler.ts` | — | — |
| ENTRY-STEP-04 | `classify-intent.sh` | `hivemind-declare` | `hivemind-delegate` | — |
| ENTRY-STEP-05 | — | — | `hiverd-research`, `hiveq-gate-check` | `hiverd`, `hivexplorer` |
| ENTRY-STEP-06 | — | `list_files`, `codebase_search`, `search_files`, `read_file` | — | — |
| ENTRY-STEP-07 | `classify-intent.sh` | `hierarchy_manage` | — | — |

---

### Post-Routing: Hive-Fiver Space

| Phase | Commands | Tools | Agents |
|-------|----------|-------|--------|
| Intake | `hivefiver-intake.md` | `hivemind-ideate` | `hivefiver` |
| Discovery | `hivefiver-discovery.md` | `hivefiver-integration` | `hivexplorer` |
| Architect | `hivefiver-architect.md` | `plan-fs`, `planning-materializer` | `hiveplanner` |
| Build | `hivefiver-build.md` | `hivefiver-integration` | `hivemaker` |
| Doctor | `hivefiver-doctor.md` | `doctor-recovery` | `hivehealer` |
| Verify | `hiveq-verify.md` | `detection.ts` | `hiveq` |
| Audit | `hivefiver-audit.md` | `gatekeeper` | `hiveq` |

---

### Post-Routing: Hiveminder Space

| Phase | Commands | Tools | Agents |
|-------|----------|-------|--------|
| Clarify | `hivemind-clarify.md` | `session-intent-classifier` | `hiveplanner` |
| Delegate | `hivemind-delegate.md` | `hierarchy-tree` | `hiveminder` |
| Debug Trigger | `hivemind-debug-trigger.md` | `tool-gate` | `hivehealer` |
| Debug Verify | `hivemind-debug-verify.md` | `detection.ts` | `hiveq` |
| Context | `hivemind-context.md` | `cognitive-packer` | — |
| Compact | `hivemind-compact.md` | `compaction-engine` | — |

---

### Strict Separation Rules

1. **Hive-Fiver NEVER touches**: `src/` (except docs/tests during refactor)
2. **Hiveminder NEVER creates**: `skills/`, `commands/`, `workflows/`, `.opencode/`
3. **Cross-lineage**: Hive-Fiver can "doctor" Hiveminder via primitives only — never direct implementation

---

## 8C. Handoff Workflow Contract (HANDOFF-CONTRACT-01)

All delegation packets MUST include these fields:

| Field ID | Field Name | Type | Required | Description |
|----------|------------|------|----------|-------------|
| HANDOFF-FIELD-01 | `task_id` | string | YES | Unique identifier: `TASK-<timestamp>-<lineage>` |
| HANDOFF-FIELD-02 | `scope` | string[] | YES | Exact paths/files in scope. Wildcards: `src/lib/**` only |
| HANDOFF-FIELD-03 | `constraints` | object | YES | `{ boundaries: string[], forbidden: string[], max_tokens: number }` |
| HANDOFF-FIELD-04 | `evidence` | string | YES | Prior evidence collected (summarized, max 500 chars) |
| HANDOFF-FIELD-05 | `acceptance` | object | YES | `{ criteria: string[], verification_method: string }` |
| HANDOFF-FIELD-06 | `hard_stop` | object | YES | `{ condition: string, max_iterations: number, escalate_to: agent }` |
| HANDOFF-FIELD-07 | `context_summary` | string | NO | Prior context (max 1000 chars) |
| HANDOFF-FIELD-08 | `parent_task_id` | string | NO | Parent task for nested delegation |

---

### Handoff Packet Example

```json
{
  "task_id": "TASK-20260305-hivefiver-001",
  "scope": [
    ".opencode/skills/hivefiver-prime/",
    "commands/hivefiver-*.md"
  ],
  "constraints": {
    "boundaries": [".opencode/**", "docs/journeys/**"],
    "forbidden": ["src/**", "agents/**/*.md"],
    "max_tokens": 8000
  },
  "evidence": "Prime skill validation scripts exist. Gap: coupling matrix missing.",
  "acceptance": {
    "criteria": [
      "Matrix documents all entry-to-agent couplings",
      "Each step has script/tool/command reference"
    ],
    "verification_method": "Cross-reference with DUAL-LINEAGE-USER-JOURNEY-STORIES"
  },
  "hard_stop": {
    "condition": "npx tsc --noEmit passes OR 3 build attempts exhausted",
    "max_iterations": 3,
    "escalate_to": "hivehealer"
  }
}
```

---

## 8D. Granularity Control (GRANULARITY-CTRL-01)

### When to Split Subtasks

| Trigger Condition | Action | Rationale |
|------------------|--------|-----------|
| Task scope > 3 directories | Split into separate tasks | Context fragmentation risk |
| Estimated tokens > 10K | Split by phase | Context window limits |
| Dependencies identified | Split with `parent_task_id` | Parallel execution possible |
| Different agent type required | Split with distinct `escalate_to` | Specialist delegation |

---

### Handoff Packet Minimums

| Metric | Minimum | Maximum |
|--------|---------|---------|
| `scope` items | 1 | 5 |
| `acceptance.criteria` | 1 | 3 |
| `context_summary` | 0 | 1000 chars |
| Evidence summary | 100 chars | 500 chars |

---

### Stop Conditions (Hard Stops)

| Stop ID | Condition | Action |
|---------|-----------|--------|
| STOP-01 | `npx tsc --noEmit` fails | Log error, escalate to `hivehealer` |
| STOP-02 | Max iterations reached | Log partial, escalate to coordinator |
| STOP-03 | Context drift detected | Trigger `declare_intent` re-entry |
| STOP-04 | Scope violation detected | Reject handoff, request resend |
| STOP-05 | Agent returns `agent:unresolved` | Re-delegate with enhanced context |

---

## 8E. Deterministic Entry/Handoff Acceptance Checklist (CHECKLIST-ENTRY-01)

### Pre-Handoff Validation

- [ ] **CHECK-ENTRY-01**: `scripts/detect-entry.sh` returns 0 (existing session)
- [ ] **CHECK-ENTRY-02**: Context coherence score < 0.3 OR `declare_intent` has fired
- [ ] **CHECK-ENTRY-03**: If new session, `profile.json` exists with `agent: "unresolved"`
- [ ] **CHECK-ENTRY-04**: `declare_intent` has fired with valid `mode` and `focus`
- [ ] **CHECK-ENTRY-05**: Progressive research loop completed (or max iterations reached)
- [ ] **CHECK-ENTRY-06**: Context gathering used targeted tools, NOT bulk glob

### Handoff Packet Validation

- [ ] **CHECK-HANDOFF-01**: All required fields present (HANDOFF-FIELD-01 through 06)
- [ ] **CHECK-HANDOFF-02**: `scope` contains valid paths within lineage boundaries
- [ ] **CHECK-HANDOFF-03**: `constraints.forbidden` does not include lineage's owned paths
- [ ] **CHECK-HANDOFF-04**: `hard_stop.max_iterations` is set (default: 3)
- [ ] **CHECK-HANDOFF-05**: `acceptance.criteria` are measurable (not vague)

### Post-Handoff Validation

- [ ] **CHECK-POST-01**: Agent acknowledges handoff (returns valid task_id)
- [ ] **CHECK-POST-02**: First tool execution occurs within 2 turns
- [ ] **CHECK-POST-03**: Hard stop condition is checked on every turn
- [ ] **CHECK-POST-04**: On STOP, escalation path is respected

---

## 8F. Two-Level Delegation Explicit Protocol (DELEGATION-PROTOCOL-01)

### Level 1: Coordinator Tasking

```
Coordinator (hiveminder/hivefiver)
    │
    ├── Creates handoff packet with HANDOFF-FIELD-* (all required)
    │
    ├── Selects target agent based on ROUTING-MATRIX-01
    │
    └── Dispatches via `new_task` with:
        - mode: agent-slug
        - message: handoff packet context
        - todos: initial todo list from packet
```

### Level 2: Agent Todo/Task Execution

```
Agent (hivemaker/hivehealer/etc)
    │
    ├── Reads handoff packet constraints
    │
    ├── Executes within scope boundaries
    │
    ├── Updates TODO list after each significant step
    │
    ├── Respects hard_stop conditions
    │
    └── Returns completion or escalation
```

### Coupling Rules

| Rule ID | Description |
|---------|-------------|
| DEL-RULE-01 | Coordinator MUST NOT execute within agent scope directly |
| DEL-RULE-02 | Agent MUST NOT expand scope without re-delegation |
| DEL-RULE-03 | Handoff packet is immutable once dispatched |
| DEL-RULE-04 | Escalation re-creates handoff with `parent_task_id` |

---

## 7. Journey Contract

### Pre-Routing (Shared Sequence)
- [ ] State detection via bash check
- [ ] Context coherence validation
- [ ] Auto-init if state missing
- [ ] Intent declaration
- [ ] Progressive research-synthesis (iterative QA cycles)
- [ ] Minimal context gathering (non-flooding)
- [ ] Explicit lineage routing

### Post-Routing (Separate Spaces)
- [ ] No shared planning artifacts
- [ ] No shared knowledge synthesis artifacts after routing
- [ ] GSD workflow pattern applied independently per lineage
- [ ] Granular phase control with conditional parallelism
- [ ] Two-level delegation (tasks + todo tools)
- [ ] Clear handoff documents with constraints

### Cross-Lineage Interaction
- [ ] Hive-Fiver can doctor Hiveminder (primitives, healers)
- [ ] Hiveminder focuses on src/ implementation
- [ ] No framework asset creation in Hiveminder
- [ ] No direct feature work in Hive-Fiver

---

## 8. Acceptance Criteria

This journey spec is correct when:

1. **Entry sequence handles all conditions**: mid-workflow, new user, absurd prompts, wall-of-text, missing state
2. **Progressive research-synthesis is mandatory**: QA → Investigate → QA loop until requirements surface
3. **Context flooding is prevented**: minimal targeted collection, demand-driven
4. **Lineage spaces are totally separate**: no shared planning or synthesis artifacts after routing
5. **GSD workflow pattern is applied**: granular phases with conditional parallelism per lineage
6. **Two-level delegation works**: coordinator tasks + agent todo tools integrated schematically
7. **Hive-Fiver doctors Hiveminder**: framework improvements flow to project lineage, but boundaries remain clear

---

**Result**: Correct understanding of two separate spaces with shared entry sequence, proper GSD workflow patterns, and contamination-free lineage separation.
