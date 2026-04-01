---
date: 2026-04-01
title: HiveMind User Journey Map
description: Comprehensive mapping of 8 core user journeys through the HiveMind plugin, documenting triggers, tool chains, agent involvement, artifacts, and failure modes for testing.
---

# HiveMind User Journey Map

**Document Version:** 1.0  
**Last Updated:** 2026-04-01  
**Scope:** All 8 core user journeys for the HiveMind plugin

---

## Table of Contents

1. [Bootstrap Journey](#1-bootstrap-journey)
2. [Planning Journey](#2-planning-journey)
3. [Delegation Journey](#3-delegation-journey)
4. [Multi-Turn Journey](#4-multi-turn-journey)
5. [Debug Journey](#5-debug-journey)
6. [Cross-Session Journey](#6-cross-session-journey)
7. [Stress Journey](#7-stress-journey)
8. [Settings Journey](#8-settings-journey)

---

## 1. Bootstrap Journey

**User Installs Plugin → Runs hm-init → Configures Settings → Runs hm-doctor**

### Trigger

User performs one of:
- First installation: `npm install hivemind-context-governance` followed by `hm-init`
- Re-initialization: `hm-init --force` to reset configuration
- Brownfield detection: Plugin auto-detects existing project structure on first run

### Tools Invoked (in order)

| Step | Tool | Purpose |
|------|------|---------|
| 1 | `hivemind_runtime_command` | Execute `hm-init` command bundle |
| 2 | `hivemind_runtime_status` | Inspect runtime state after init |
| 3 | `hivemind_hm_setting` | Read current settings configuration |
| 4 | `hivemind_hm_doctor` | Run diagnostics to validate setup |

### Agents Involved

| Agent | Role | Action |
|-------|------|--------|
| **hiveminder** | Primary orchestrator | Coordinates bootstrap flow |
| **hivehealer** | Remediation specialist | Fixes issues detected by doctor |

### Expected Artifacts Produced

| Artifact | Location | Description |
|----------|----------|-------------|
| `.hivemind/config/initial-state.json` | Project root | Bootstrap state record |
| `.hivemind/activity/sessions/continuity.json` | `.hivemind/activity/sessions/` | Session persistence config |
| `.hivemind/state/runtime-snapshot.json` | `.hivemind/state/` | Runtime state at bootstrap |
| `opencode.json` (modified) | Project root | Plugin configuration updated |

### Bootstrap Flow Diagram

```
User: "hm-init"
    │
    ▼
┌─────────────────────────────────────────────┐
│  hivemind_runtime_command("hm-init")        │
│  ├── Detects greenfield vs brownfield       │
│  ├── Creates .hivemind/ directory structure │
│  ├── Initializes config/initial-state.json   │
│  └── Returns initialization report          │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│  hivemind_runtime_status                    │
│  ├── Verifies runtime attachment            │
│  ├── Checks trajectory subsystem            │
│  └── Returns runtime health report          │
└─────────────────────────────────────────────┘
    │
    ▼
User: "Configure language/expertise/governance"
    │
    ▼
┌─────────────────────────────────────────────┐
│  hivemind_hm_setting(group: "all")          │
│  ├── Writes settings to config              │
│  ├── Persists to .hivemind/config/         │
│  └── Returns updated configuration          │
└─────────────────────────────────────────────┘
    │
    ▼
User: "hm-doctor"
    │
    ▼
┌─────────────────────────────────────────────┐
│  hivemind_hm_doctor(scope: "all", fix: false) │
│  ├── Validates skills integrity            │
│  ├── Checks agents configuration            │
│  ├── Verifies paths and references          │
│  └── Returns diagnostic findings            │
└─────────────────────────────────────────────┘
```

### Failure Modes to Test

| Failure Mode | Trigger Condition | Expected Behavior | Test Verification |
|-------------|-------------------|-------------------|-------------------|
| **Missing dependencies** | Run `hm-init` without npm install | Error message with missing package list | Doctor reports `SCAN_RESULT: MISSING_DEPS` |
| **Corrupted config** | Manually edit config to invalid JSON | Auto-backup, offer restore | Doctor reports `CONFIG_CORRUPTED` |
| **Permission denied** | .hivemind dir read-only | Graceful error, skip non-writable paths | Reports `PERMISSION_ERROR` per path |
| **Stale context** | Bootstrap after long idle period | Detect drift, propose refresh | Doctor reports `CONTEXT_STALE` |
| **Worktree mismatch** | Run from wrong git worktree | Detect worktree isolation | Error: `WORKTREE_MISMATCH` |
| **Init race condition** | Two concurrent init calls | Second instance detects lock | Error: `INIT_IN_PROGRESS` |

---

## 2. Planning Journey

**User Describes Feature → Hiveminder Creates Trajectory → Hiveplanner Creates Tasks → Hivemaker Implements**

### Trigger

User performs one of:
- "I want to build a feature that..."
- "Let's add [capability] to [component]"
- "Plan the implementation of..."
- Attaches PRD or spec document via `hivemind_doc`

### Tools Invoked (in order)

| Step | Tool | Purpose |
|------|------|---------|
| 1 | `hivemind_doc` | Read and parse requirements document |
| 2 | `hivemind_trajectory` | Create new trajectory for feature work |
| 3 | `hivemind_task` | Create planning task(s) for hiveplanner |
| 4 | `hivemind_agent_work_create_contract` | Establish work contract |
| 5 | `hivemind_task` | Create implementation tasks for hivemaker |

### Agents Involved

| Agent | Role | Action |
|-------|------|--------|
| **hiveminder** | Primary orchestrator | Receives feature request, initiates planning |
| **hiveplanner** | Planning specialist | Decomposes requirements into tasks |
| **hivemaker** | Implementation specialist | Executes implementation tasks |
| **hivexplorer** | Codebase investigator | Provides codebase context to planner |

### Expected Artifacts Produced

| Artifact | Location | Description |
|----------|----------|-------------|
| `trajectory-{id}.json` | `.hivemind/activity/sessions/` | New trajectory record |
| `planning-{id}.md` | `.hivemind/plans/` | Feature planning document |
| `task-{id}.json` | `.hivemind/activity/` | Created tasks with dependencies |
| `work-contract-{id}.json` | `.hivemind/activity/agents/` | Agent work contract |
| `intent-extraction-{timestamp}.json` | `.hivemind/activity/codescan/intent-extraction/` | Parsed user intent |

### Planning Flow Diagram

```
User: "I want to build a feature that..."
    │
    ▼
┌─────────────────────────────────────────────┐
│  hiveminder (orchestrator)                  │
│  ├── Parses feature description             │
│  ├── Determines planning scope              │
│  └── Initiates trajectory                   │
│      hivemind_trajectory(action: "attach") │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│  hivemind_doc(skim/read)                    │
│  ├── If spec attached: read and extract     │
│  ├── Chunk large documents                  │
│  └── Return structured requirements         │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│  hiveplanner                                │
│  ├── Receives parsed requirements           │
│  ├── Decomposes into Epic > Feature > Story │
│  ├── Identifies dependencies                │
│  └── Creates planning document              │
│      hivemind_task(action: "create",         │
│                    kind: "task")            │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│  hivemind_agent_work_create_contract         │
│  ├── Creates work contract for implementation│
│  ├── Links tasks to trajectory              │
│  └── Establishes verification criteria      │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│  hivemaker                                  │
│  ├── Activates implementation tasks         │
│  ├── Executes code changes                  │
│  └── Marks tasks complete via               │
│      hivemind_task(action: "complete")      │
└─────────────────────────────────────────────┘
```

### Failure Modes to Test

| Failure Mode | Trigger Condition | Expected Behavior | Test Verification |
|-------------|-------------------|-------------------|-------------------|
| **Unclear requirements** | Vague feature description | Request clarification via questions | Returns `NEEDS_CLARIFICATION` |
| **Circular dependencies** | Tasks depend on each other cyclically | Detection and error report | Doctor reports `CIRCULAR_DEP` |
| **Scope creep** | Adding >5 features mid-plan | Warning, optional split | `SCOPE_CREEP_WARNING` |
| **Missing prerequisites** | Plan requires undefined base | Block until prerequisites exist | `MISSING_PREREQUISITE` |
| **Planning timeout** | Complex plan takes >5 minutes | Offer partial plan, continue async | `PLANNING_TIMEOUT` |
| **Trajectory limit** | >10 active trajectories | oldest auto-archived | `TRAJECTORY_LIMIT_REACHED` |

---

## 3. Delegation Journey

**Orchestrator Delegates to Subagent → Handoff Created → Subagent Works → Evidence Returned → Handoff Closed**

### Trigger

User or orchestrator performs one of:
- Orchestrator determines work is delegatable (>3 files, deep reads needed, etc.)
- Explicit request: "Delegate this to [agent type]"
- Automatic: Cross-cutting concern detected

### Delegation Decision Rules (from AGENTS.md)

**Delegate WHEN:**
- >3 files affected
- Deep reads needed for context
- Independent verification required
- Stale context detected
- Multiple concerns identified
- Explicit user request

**Do NOT Delegate:**
- Single-file edits
- <3 inline actions
- Unclear scope

### Tools Invoked (in order)

| Step | Tool | Purpose |
|------|------|---------|
| 1 | `hivemind_handoff` | Create delegation packet |
| 2 | `hivemind_agent_work_create_contract` | Create work contract |
| 3 | `hivemind_task` | Create delegation task |
| 4 | [Subagent execution] | Subagent performs work |
| 5 | `hivemind_handoff` (update) | Submit evidence |
| 6 | `hivemind_handoff` (validate) | Validate return contract |
| 7 | `hivemind_handoff` (close) | Close and archive handoff |

### Agents Involved

| Agent | Role | Action |
|-------|------|--------|
| **hiveminder** | Primary orchestrator | Makes delegation decision |
| **hivexplorer** | Codebase investigator | Delegated for deep reads |
| **hiveq** | Verification specialist | Delegated for verification |
| **code-skeptic** | Critical analysis | Delegated for review |
| **hitea** | Testing specialist | Delegated for test work |
| **hiverd** | External research | Delegated for research |

### Expected Artifacts Produced

| Artifact | Location | Description |
|----------|----------|-------------|
| `handoff-{id}.json` | `.hivemind/activity/handoff/` | Delegation packet |
| `delegation-{id}.json` | `.hivemind/activity/delegation/` | Delegation context |
| `evidence-{id}.json` | `.hivemind/activity/delegation/` | Returned evidence |
| `task-{id}.json` | `.hivemind/activity/` | Delegated task record |

### Delegation Flow Diagram

```
┌─────────────────────────────────────────────┐
│  hiveminder (orchestrator)                  │
│  ├── Evaluates delegation criteria           │
│  ├── Selects appropriate subagent            │
│  └── Initiates delegation                    │
│      hivemind_handoff(action: "create")     │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│  Delegation Packet Created                  │
│  ├── scope: bounded work description        │
│  ├── constraints: time/expertise limits     │
│  ├── memoryScope: what to carry forward     │
│  ├── successMetrics: return criteria        │
│  └── requiredEvidence: proof of completion  │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│  hivemind_agent_work_create_contract        │
│  ├── Links handoff to trajectory            │
│  ├── Creates task for subagent              │
│  └── Establishes verification contract       │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│  Subagent Execution                         │
│  ├── hivexplorer: reads specified files    │
│  ├── hiveq: runs verification checks       │
│  ├── code-skeptic: performs critical review │
│  └── hitea: executes test suite            │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│  Evidence Submission                        │
│  hivemind_handoff(action: "update")         │
│  ├── evidenceRefs: file paths, line numbers │
│  ├── summary: what was accomplished         │
│  └── nextSteps: follow-up recommendations  │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│  Validation                                 │
│  hivemind_handoff(action: "validate")       │
│  ├── Verifies requiredEvidence present      │
│  ├── Checks successMetrics alignment        │
│  └── Returns validation result              │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│  Close                                      │
│  hivemind_handoff(action: "close")         │
│  ├── Archives delegation packet              │
│  ├── Updates trajectory with findings       │
│  └── Returns final summary to orchestrator  │
└─────────────────────────────────────────────┘
```

### Failure Modes to Test

| Failure Mode | Trigger Condition | Expected Behavior | Test Verification |
|-------------|-------------------|-------------------|-------------------|
| **Scope creep in delegation** | Subagent expands work beyond bounds | Enforce scope, reject overflow | `SCOPE_EXCEEDED` |
| **Missing evidence** | Required evidence not provided | Block handoff close | `EVIDENCE_INCOMPLETE` |
| **Timeout** | Subagent exceeds time limit | Auto-terminate, return partial | `DELEGATION_TIMEOUT` |
| **Handoff during handoff** | Nested delegation attempted | Block or queue nested | `NESTED_DELEGATION_BLOCKED` |
| **Agent mismatch** | Wrong agent type selected | Cancel, reselect agent | `AGENT_TYPE_MISMATCH` |
| **Evidence contract violation** | Evidence doesn't match requiredEvidence | Reject, request specific evidence | `CONTRACT_VIOLATION` |
| **Stale context in delegation** | Context changed during delegation | Detect drift, offer restart | `CONTEXT_DRIFT_DETECTED` |

---

## 4. Multi-Turn Journey

**User Works Across 20+ Turns → Context Compacts → Trajectory Checkpoints → Tasks Persist**

### Trigger

User continues working without session reset:
- Sustained conversation across 20+ turns
- Context window approaching limit
- Explicit: "Continue working on..."

### Tools Invoked (in order)

| Step | Tool | Purpose |
|------|------|---------|
| 1 | `hivemind_trajectory` | Record turn events |
| 2 | `hivemind_journal` | Write session journal |
| 3 | `hivemind_task` | Update task status |
| 4 | `hivemind_agent_work_export_contract` | Export contract for compaction |
| 5 | `hivemind_trajectory` (checkpoint) | Create trajectory checkpoint |
| 6 | `hivemind_handoff` | Prepare continuity handoff |

### Agents Involved

| Agent | Role | Action |
|-------|------|--------|
| **hiveminder** | Primary orchestrator | Manages compaction decisions |
| **hiveplanner** | Planning specialist | Maintains task state |
| **hivexplorer** | Codebase investigator | Provides fresh context on restore |

### Expected Artifacts Produced

| Artifact | Location | Description |
|----------|----------|-------------|
| `compaction-{timestamp}.json` | `.hivemind/activity/sessions/` | Compaction event record |
| `trajectory-{id}-checkpoint-{n}.json` | `.hivemind/activity/sessions/` | Trajectory snapshot |
| `continuity.json` | `.hivemind/activity/sessions/` | Carry-forward state |
| `journey-events.md` | `.hivemind/activity/sessions/` | Session journal entries |

### Multi-Turn Flow Diagram

```
Turn 1-10: Normal Operation
    │
    ▼
┌─────────────────────────────────────────────┐
│  Turn events recorded                       │
│  hivemind_journal(eventType: "tool_call")  │
│  hivemind_journal(eventType: "user_message")│
└─────────────────────────────────────────────┘
    │
    ▼
Turn 11-15: Context Pressure Building
    │
    ▼
┌─────────────────────────────────────────────┐
│  hiveminder monitors context pressure        │
│  Session.compacting hook triggered          │
│  Compaction prompt customization active      │
└─────────────────────────────────────────────┘
    │
    ▼
Turn 16-20: Compaction Zone
    │
    ▼
┌─────────────────────────────────────────────┐
│  Compaction triggered (typically ~80%)      │
│  hivemind_agent_work_export_contract        │
│  ├── Exports contract as summary            │
│  └── Preserves task references              │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│  hivemind_trajectory(action: "checkpoint") │
│  ├── Creates trajectory snapshot            │
│  ├── Preserves decision points               │
│  └── Saves current task state                │
└─────────────────────────────────────────────┘
    │
    ▼
Turn 21+: Resume from Compaction
    │
    ▼
┌─────────────────────────────────────────────┐
│  Continuity payload loaded                  │
│  ├── Summary of prior work                  │
│  ├── Active task references                  │
│  └── Key decisions preserved                │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│  hivemind_task(action: "list")             │
│  └── Verify task state persists             │
└─────────────────────────────────────────────┘
```

### Failure Modes to Test

| Failure Mode | Trigger Condition | Expected Behavior | Test Verification |
|-------------|-------------------|-------------------|-------------------|
| **Premature compaction** | Compaction triggers too early | Disable auto-compaction below threshold | `COMPACTION_THRESHOLD` respected |
| **Lost context** | Critical info lost in compaction | Back-reference original trajectory | `CONTEXT_PRESERVED` verification |
| **Task state drift** | Task status inconsistent after compaction | Reconcile task state on resume | `TASK_STATE_CONSISTENT` |
| **Decision loss** | Key decisions not preserved | Trajectory captures decisions explicitly | `DECISION_TRACE_VERIFIED` |
| **Compaction loop** | Continuous compaction cycles | Cooldown period enforced | `COMPACTION_COOLDOWN` |
| **Session fork** | Resume creates duplicate trajectory | Single trajectory lineage | `TRAJECTORY_LINEAGE_SINGULAR` |

---

## 5. Debug Journey

**Something Breaks → Hivemind-system-debug → Trajectory Inspection → Rollback**

### Trigger

User performs one of:
- "Debug this issue"
- "Something is broken"
- Error detected in verification
- Test failure reported
- Runtime error observed

### Tools Invoked (in order)

| Step | Tool | Purpose |
|------|------|---------|
| 1 | `hivemind_hm_doctor` | Initial diagnostics |
| 2 | `hivemind_trajectory` | Inspect trajectory history |
| 3 | `hivemind_runtime_status` | Check current runtime state |
| 4 | `hivemind_system_debug` | Trigger debug-to-refactor transition |
| 5 | `hivemind_task` | Identify affected tasks |
| 6 | [rollback if needed] | Revert to checkpoint |

### Agents Involved

| Agent | Role | Action |
|-------|------|--------|
| **hiveminder** | Primary orchestrator | Coordinates debug flow |
| **hivehealer** | Remediation specialist | Performs repairs |
| **hivexplorer** | Codebase investigator | Investigates root cause |
| **code-skeptic** | Critical analysis | Questions assumptions |

### Expected Artifacts Produced

| Artifact | Location | Description |
|----------|----------|-------------|
| `debug-report-{id}.md` | `.hivemind/activity/` | Debug investigation report |
| `trajectory-inspection-{id}.json` | `.hivemind/activity/sessions/` | Trajectory analysis |
| `rollback-plan-{id}.json` | `.hivemind/activity/` | If rollback needed |
| `diagnostic-{timestamp}.json` | `.hivemind/activity/sessions/` | Diagnostic event |

### Debug Flow Diagram

```
User: "Debug this issue" / Error Detected
    │
    ▼
┌─────────────────────────────────────────────┐
│  hivemind_hm_doctor(scope: "all")           │
│  ├── Identifies symptom categories          │
│  ├── Runs targeted diagnostics              │
│  └── Returns structured findings            │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│  hivemind_trajectory(action: "inspect")    │
│  ├── Retrieves trajectory history           │
│  ├── Identifies last checkpoint             │
│  └── Locates decision points                │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│  hivemind_runtime_status                    │
│  ├── Checks current state                   │
│  ├── Identifies anomalies                   │
│  └── Returns health report                  │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│  hivemind_system_debug                      │
│  ├── Reproduces issue if possible           │
│  ├── Narrows scope to specific components   │
│  ├── Contains damage if spreading           │
│  └── Proposes fix approach                  │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│  Root Cause Identified                      │
│  ├── If fixable: hivehealer applies fix     │
│  └── If rollback needed:                   │
│      └── Revert to last good checkpoint    │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│  Verification                                │
│  hivemind_task(action: "verify")            │
│  └── Confirm issue resolved                 │
└─────────────────────────────────────────────┘
```

### Failure Modes to Test

| Failure Mode | Trigger Condition | Expected Behavior | Test Verification |
|-------------|-------------------|-------------------|-------------------|
| **Non-reproducible bug** | Issue not consistently triggered | Document as intermittent, monitor | `INTERMITTENT_ISSUE_LOGGED` |
| **Heisenbug** | Observation changes behavior | Isolation protocols | `OBSERVATION_EFFECT_DOCUMENTED` |
| **Rollback unavailable** | No valid checkpoint exists | Block rollback, manual intervention | `ROLLBACK_NOT_POSSIBLE` |
| **Debug loop** | Issue recurs after fix | Detect recurring pattern | `RECURRING_ISSUE_FLAG` |
| **Wrong root cause** | Assumption incorrect | Revisit investigation | `ROOT_CAUSE_REVISION` |
| **Scope expansion** | Debug uncovers additional issues | Triage and prioritize | `ADDITIONAL_ISSUES_CATALOGED` |
| **State corruption** | Runtime state inconsistent | Isolate, reset affected subsystem | `STATE_ISOLATED_FOR_RECOVERY` |

---

## 6. Cross-Session Journey

**Session A Creates Work → Session B Resumes → Trajectory Traversed → Tasks Verified**

### Trigger

User performs one of:
- "Resume my work from yesterday"
- New session attaches to existing trajectory
- Session ID provided: `opencode --session {id}`

### Tools Invoked (in order)

| Step | Tool | Purpose |
|------|------|---------|
| 1 | `hivemind_trajectory` | Attach to existing trajectory |
| 2 | `hivemind_task` | List and verify task states |
| 3 | `hivemind_agent_work_export_contract` | Export work contract |
| 4 | `hivemind_handoff` | Read continuity handoff |
| 5 | `hivemind_journal` | Read session history |

### Agents Involved

| Agent | Role | Action |
|-------|------|--------|
| **hiveminder** | Primary orchestrator | Coordinates session continuity |
| **hiveplanner** | Planning specialist | Verifies task alignment |
| **hivemaker** | Implementation specialist | Resumes implementation |

### Expected Artifacts Produced

| Artifact | Location | Description |
|----------|----------|-------------|
| `continuity.json` | `.hivemind/activity/sessions/` | Cross-session state |
| `handoff-{id}.json` | `.hivemind/activity/handoff/` | Continuity handoff |
| `session-{id}-resumed.json` | `.hivemind/activity/sessions/` | Resumption record |
| `task-verification-{id}.json` | `.hivemind/activity/` | Task state verification |

### Cross-Session Flow Diagram

```
Session A: Creates work (normal operations)
    │
    ▼
┌─────────────────────────────────────────────┐
│  Work progress recorded                     │
│  ├── Tasks created and updated              │
│  ├── Trajectory events captured              │
│  └── Continuity handoff prepared             │
│      hivemind_handoff(action: "create",     │
│        type: "continuity")                 │
└─────────────────────────────────────────────┘
    │
    ▼
Session A ends / Session B begins
    │
    ▼
┌─────────────────────────────────────────────┐
│  Session B starts                            │
│  hivemind_trajectory(action: "attach")     │
│  ├── Session ID provided or detected         │
│  ├── Existing trajectory located            │
│  └── Continuity context loaded              │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│  hivemind_task(action: "list")             │
│  ├── Retrieve all tasks for trajectory      │
│  ├── Verify task states                     │
│  └── Identify pending/complete status       │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│  hivemind_handoff(action: "read")          │
│  ├── Load continuity handoff                │
│  ├── Extract last decision context          │
│  └── Get next recommended action            │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│  hivemind_agent_work_export_contract        │
│  ├── Export work contract as summary        │
│  ├── Preserve active task references        │
│  └── Enable resumable state                │
└─────────────────────────────────────────────┘
    │
    ▼
Session B resumes operations
    │
    ▼
┌─────────────────────────────────────────────┐
│  hivemind_task(action: "verify")          │
│  └── Confirm task states still valid        │
└─────────────────────────────────────────────┘
```

### Failure Modes to Test

| Failure Mode | Trigger Condition | Expected Behavior | Test Verification |
|-------------|-------------------|-------------------|-------------------|
| **Trajectory not found** | Invalid/expired session ID | Error with recovery suggestions | `TRAJECTORY_NOT_FOUND` |
| **Task state conflict** | Task modified by concurrent session | Last-write-wins or merge | `TASK_CONFLICT_DETECTED` |
| **Stale continuity** | Handoff older than 48 hours | Flag for review, offer refresh | `CONTINUITY_STALE` |
| **Missing dependencies** | Prerequisite tasks no longer exist | Rebuild dependency chain | `DEPENDENCY_BROKEN` |
| **Context rot** | Code changed since last session | Detect and report drift | `CONTEXT_DRIFT_REPORTED` |
| **Session fork** | Same trajectory attached twice | Prevent duplicate attachment | `DUPLICATE_SESSION_BLOCKED` |
| **Expired session** | Session inactive >30 days | Archive, require new start | `SESSION_EXPIRED` |

---

## 7. Stress Journey

**Multiple Agents Working Simultaneously → Handoffs Overlapping → Trajectory Events Racing**

### Trigger

User performs one of:
- "Run this in parallel with that"
- Multiple `hm-*` commands invoked simultaneously
- Explicit parallel execution request
- Load testing scenario

### Tools Invoked (in order)

| Step | Tool | Purpose |
|------|------|---------|
| 1 | `hivemind_handoff` | Create parallel handoffs |
| 2 | `hivemind_trajectory` | Create parallel trajectory branches |
| 3 | `hivemind_task` | Create concurrent tasks |
| 4 | [Parallel execution] | Multiple agents execute |
| 5 | `hivemind_handoff` | Validate concurrent returns |
| 6 | `hivemind_trajectory` | Merge trajectory branches |

### Agents Involved

| Agent | Role | Action |
|-------|------|--------|
| **hiveminder** | Primary orchestrator | Coordinates parallel execution |
| **hivexplorer** | Codebase investigator | Parallel file analysis |
| **hiveq** | Verification specialist | Parallel verification |
| **hitea** | Testing specialist | Parallel test execution |
| **hiverd** | External research | Parallel research |

### Expected Artifacts Produced

| Artifact | Location | Description |
|----------|----------|-------------|
| `handoff-{id1}.json` | `.hivemind/activity/handoff/` | Handoff for stream 1 |
| `handoff-{id2}.json` | `.hivemind/activity/handoff/` | Handoff for stream 2 |
| `trajectory-branch-{id}.json` | `.hivemind/activity/sessions/` | Parallel trajectory branch |
| `merge-result-{id}.json` | `.hivemind/activity/` | Branch merge result |

### Stress Flow Diagram

```
User: Parallel execution request
    │
    ▼
┌─────────────────────────────────────────────┐
│  hiveminder evaluates parallel feasibility   │
│  ├── Checks resource availability           │
│  ├── Validates independence of work         │
│  └── Rejects if dependencies exist           │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│  Parallel handoffs created                   │
│  Stream 1: hivemind_handoff(action: "create")│
│  Stream 2: hivemind_handoff(action: "create")│
│  ...n: hivemind_handoff(action: "create")  │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│  Parallel trajectory branches                │
│  hivemind_trajectory(action: "attach")      │
│  ├── Branch A: Stream 1 work                │
│  └── Branch B: Stream 2 work                │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│  Concurrent execution                       │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│  │ Stream1 │ │ Stream2 │ │ StreamN │        │
│  │ Agent1  │ │ Agent2  │ │ AgentN  │        │
│  └─────────┘ └─────────┘ └─────────┘        │
│  ├── hx reads files                         │
│  ├── hq verifies                            │
│  └── hd researches                          │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│  Racing trajectory events                   │
│  └── Event ordering via timestamp/sequence │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│  Evidence collection                        │
│  hivemind_handoff(action: "update")         │
│  ├── Each stream submits evidence           │
│  └── No stream blocks another              │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│  Trajectory merge                           │
│  hivemind_trajectory(action: "traverse")    │
│  ├── Branch A merged into main              │
│  └── Branch B merged into main              │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│  Final validation                           │
│  hivemind_task(action: "verify")           │
│  └── All parallel results integrated        │
└─────────────────────────────────────────────┘
```

### Failure Modes to Test

| Failure Mode | Trigger Condition | Expected Behavior | Test Verification |
|-------------|-------------------|-------------------|-------------------|
| **Race condition** | Simultaneous writes to same file | File locking or merge detection | `RACE_DETECTED` |
| **Handoff collision** | Two handoffs claim same task | Task ownership dispute resolution | `HANDOFF_COLLISION` |
| **Trajectory fork** | Events create branching timeline | Detect and offer merge/rebase | `TRAJECTORY_FORKED` |
| **Resource exhaustion** | Too many parallel streams | Throttle at max parallel limit | `RESOURCE_LIMIT_REACHED` |
| **Deadlock** | Circular wait between streams | Timeout and rollback one stream | `DEADLOCK_DETECTED` |
| **Starvation** | One stream never completes | Fairness guarantee enforcement | `STARVATION_DETECTED` |
| **Inconsistent merge** | Branch merge produces invalid state | Rollback merge, manual resolution | `MERGE_INCONSISTENT` |
| **Event ordering violation** | Events arrive out of sequence | Sequence number enforcement | `ORDERING_VIOLATION` |

---

## 8. Settings Journey

**User Configures Language/Expertise/Governance → Settings Persist → Tools Respect Config**

### Trigger

User performs one of:
- "Set language to TypeScript"
- "I prefer detailed explanations"
- "Configure governance to strict mode"
- `hm-setting --group expertise --key detailLevel --value high`
- First-run settings questionnaire

### Tools Invoked (in order)

| Step | Tool | Purpose |
|------|------|---------|
| 1 | `hivemind_hm_setting` | Read current settings |
| 2 | `hivemind_hm_setting` | Update settings group |
| 3 | `hivemind_hm_doctor` | Validate settings consistency |
| 4 | `hivemind_runtime_status` | Verify settings applied |

### Agents Involved

| Agent | Role | Action |
|-------|------|--------|
| **hiveminder** | Primary orchestrator | Receives and validates settings |
| **hiveplanner** | Planning specialist | Adapts planning style to expertise |
| **hivemaker** | Implementation specialist | Adjusts implementation approach |
| **hiveq** | Verification specialist | Modifies verification rigor |

### Expected Artifacts Produced

| Artifact | Location | Description |
|----------|----------|-------------|
| `settings-{group}.json` | `.hivemind/config/` | Persisted settings group |
| `active-paths.json` | `.hivemind/pathing/` | Resolved path configuration |
| `settings-validation.json` | `.hivemind/activity/` | Settings validation report |

### Settings Groups

| Group | Keys | Description |
|-------|------|-------------|
| **language** | displayLanguage, codeLanguage, documentLanguage | All linguistic preferences |
| **expertise** | detailLevel, complexityTolerance, abstractionLevel | Technical expertise settings |
| **governance** | automationLevel, verificationRigor, rollbackPolicy | Governance preferences |
| **operation-mode** | sessionPersistence, compactionThreshold, delegationStrategy | Operational behavior |

### Settings Flow Diagram

```
User: Settings change request
    │
    ▼
┌─────────────────────────────────────────────┐
│  hivemind_hm_setting(group: "language",     │
│                       key: "displayLanguage",│
│                       value: "typescript")  │
│  ├── Validates setting value                │
│  ├── Checks for conflicts                  │
│  └── Persists to config                    │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│  Settings validation                        │
│  hivemind_hm_doctor(scope: "config")       │
│  ├── Ensures settings are well-formed      │
│  ├── Detects conflicting settings          │
│  └── Returns validation result             │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│  hivemind_runtime_status                    │
│  └── Confirms settings active in runtime   │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│  Tools respect new config                   │
│  ├── hivemind_task: uses expertise level   │
│  ├── hivemind_handoff: uses governance      │
│  └── hivemind_trajectory: uses language     │
└─────────────────────────────────────────────┘
```

### Failure Modes to Test

| Failure Mode | Trigger Condition | Expected Behavior | Test Verification |
|-------------|-------------------|-------------------|-------------------|
| **Invalid setting value** | Setting to invalid enum value | Reject with valid options | `INVALID_SETTING_VALUE` |
| **Conflicting settings** | Language=Python + expertise=beginner + governance=strict | Warn about conflicts | `SETTINGS_CONFLICT` |
| **Persistence failure** | Config file write blocked | Fall back to memory, warn | `SETTINGS_NOT_PERSISTED` |
| **Stale settings** | Settings file older than 7 days | Flag for review on use | `SETTINGS_STALE` |
| **Group mismatch** | Setting key doesn't exist in group | Error with valid keys | `SETTING_KEY_NOT_FOUND` |
| **Override conflict** | Global vs project settings clash | Project settings win | `OVERRIDE_RESOLVED` |
| **Settings corruption** | JSON malformed in config | Auto-restore from backup | `CORRUPTED_SETTINGS_RESTORED` |

---

## Appendix: Tool-Event Matrix

### Tool → Journey Coverage

| Tool | Bootstrap | Planning | Delegation | Multi-Turn | Debug | Cross-Session | Stress | Settings |
|------|-----------|----------|------------|------------|-------|---------------|--------|----------|
| `hivemind_runtime_status` | ✓ | | | ✓ | ✓ | | | ✓ |
| `hivemind_runtime_command` | ✓ | | | | | | | |
| `hivemind_doc` | | ✓ | | | | | | |
| `hivemind_task` | | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | |
| `hivemind_trajectory` | | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | |
| `hivemind_handoff` | | | ✓ | ✓ | | ✓ | ✓ | |
| `hivemind_journal` | | | | ✓ | | ✓ | | |
| `hivemind_hm_setting` | ✓ | | | | | | | ✓ |
| `hivemind_hm_doctor` | ✓ | | | | ✓ | | | ✓ |
| `hivemind_agent_work_create_contract` | | ✓ | ✓ | | | | | |
| `hivemind_agent_work_export_contract` | | | | ✓ | | ✓ | | |
| `hivemind_system_debug` | | | | | ✓ | | | |

### Agent → Journey Coverage

| Agent | Bootstrap | Planning | Delegation | Multi-Turn | Debug | Cross-Session | Stress | Settings |
|-------|-----------|----------|------------|------------|-------|---------------|--------|----------|
| hiveminder | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| hiveplanner | | ✓ | | ✓ | | ✓ | | ✓ |
| hivemaker | | ✓ | | | | ✓ | | ✓ |
| hivexplorer | | ✓ | ✓ | | ✓ | | ✓ | |
| hiveq | | | ✓ | | | | ✓ | ✓ |
| code-skeptic | | | ✓ | | ✓ | | | |
| architect | | ✓ | | | | | | |
| hitea | | | ✓ | | | | ✓ | |
| hiverd | | | ✓ | | | | ✓ | |
| hivehealer | ✓ | | | | ✓ | | | |

---

## Document Metadata

| Field | Value |
|-------|-------|
| **Version** | 1.0 |
| **Created** | 2026-04-01 |
| **Last Modified** | 2026-04-01 |
| **Author** | HiveMind Codebase Analysis |
| **Coverage** | 8 User Journeys, 7 Tools, 10 Agents |
| **Test Coverage** | 56 Failure Modes Documented |
