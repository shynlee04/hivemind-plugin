# Governance Checklists & Deviation Rules

> Load this reference in Mode 4 (IMPROVE) for delegation/session issues, and Mode 5 (REFACTOR) for governance compliance.
> Load ONLY the relevant section based on the specific governance concern.

---

## Table of Contents

1. [New Session Start Checklist](#1-new-session-start-checklist)
2. [Mid-Session Health Checklist](#2-mid-session-health-checklist)
3. [Session End / Compact Checklist](#3-session-end--compact-checklist)
4. [Delegation Health Checklist](#4-delegation-health-checklist)
5. [Deviation Classification Rules](#5-deviation-classification-rules)
6. [User Behavior Mitigation](#6-user-behavior-mitigation)

---

## 1. New Session Start Checklist

Run this checklist at every session start (fresh, post-compact, or manual restart).

```
SESSION START GATE
├── [ ] declare_intent fired with mode + focus
│   └── mode: plan_driven | quick_fix | exploration
├── [ ] map_context(trajectory) set with session description
├── [ ] STATE.md read (if exists) for cross-session continuity
│   └── If no STATE.md → first session, proceed with onboarding
├── [ ] Active plan/task identified from .hivemind/ state
│   └── recall_mems --query "active plan" --limit 3
├── [ ] Anchors loaded for critical persistent decisions
│   └── hivemind_anchor list
├── [ ] Agent confirms alignment with user before executing
│   └── Present: "Continuing from [last state]. Plan to [next action]. Proceed?"
└── [ ] No write operations before all above checks pass
```

**Why each step matters**:
- Without `declare_intent`: drift detection is OFF, entire session is untracked
- Without STATE.md read: agent repeats work from previous session
- Without anchor load: critical decisions (branch policy, architecture choices) are invisible
- Without user confirmation: agent may pursue stale or wrong trajectory

---

## 2. Mid-Session Health Checklist

Run these checks at intervals during the session.

```
EVERY 10 TURNS
├── [ ] scan_hierarchy → check drift_score
│   └── If drift_score < 60 → STOP, run think_back, realign
│   └── If drift_score < 40 → HALT, explain to user, request guidance
├── [ ] Verify active trajectory still matches user intent
│   └── If intent changed → map_context(trajectory) with new description
└── [ ] Check token usage estimate
    └── If >60% capacity → consider compact or skill unloading

EVERY DELEGATION
├── [ ] Full delegation packet (see Delegation Health below)
├── [ ] export_cycle after sub-agent returns
│   └── Never skip — even if result is "failure"
└── [ ] Validate result against return_schema before proceeding

EVERY FILE CREATION
├── [ ] File traces to active plan/task in hierarchy
├── [ ] File name follows naming convention (name-yyyy-mm-dd.ext)
└── [ ] Cross-references in file point to existing entities

EVERY SKILL LOAD
├── [ ] Skill load traces to current workflow step's skill_bundles
├── [ ] Only needed reference files loaded (not all)
└── [ ] Skill's workflow/router actually followed (not just loaded)
```

---

## 3. Session End / Compact Checklist

Run before any session close or compaction event.

```
SESSION END GATE
├── [ ] Temporary exports consolidated into trajectory
│   └── Any scratch notes → classify and save_mem or discard
├── [ ] Session memory classified
│   └── Categories: discovery / research / planning / implementing / debug / testing
├── [ ] STATE.md updated with:
│   ├── Decisions made (with rationale)
│   ├── Current blockers
│   ├── Session position (what was done, what's next)
│   └── Any deviation classifications (R1-R4) encountered
├── [ ] Off-track intentions saved to TODO-Pending
│   └── hivemind_session_memory todo_pending for deferred work
├── [ ] Planning artifacts updated if applicable
│   └── ROADMAP, REQUIREMENTS, active plan files
├── [ ] Anchors saved for critical decisions
│   └── hivemind_anchor save for any decisions that MUST survive
└── [ ] compact_session called with meaningful summary
    └── Summary should enable next session to resume without re-investigation
```

**Critical**: Compaction destroys conversation history. Everything not persisted to filesystem is LOST.

---

## 4. Delegation Health Checklist

Run for EVERY Task() delegation, no exceptions.

```
PRE-DELEGATION
├── [ ] Packet includes delegation_source: agent
│   └── Sub-agent MUST know it's delegated, not user-facing
├── [ ] Packet includes delegation_depth: N
│   └── Prevents infinite delegation chains
├── [ ] Packet includes parent_agent and parent_context_summary
│   └── Sub-agent understands WHY this task exists
├── [ ] Packet includes in_scope_paths + out_of_scope_paths
│   └── Scope boundaries are explicit, not implied
├── [ ] Packet includes measurable success_metrics
│   └── "File X exists" not "code works well"
├── [ ] Packet includes explicit return_schema
│   └── Fields: status, files_modified, evidence, issues (minimum)
├── [ ] Packet includes failure_policy
│   └── "STOP and return error" — not "try workaround"
└── [ ] Packet includes constraints
    └── What NOT to do is as important as what to do

POST-DELEGATION
├── [ ] Sub-agent result parsed against return_schema
│   └── If result doesn't match schema → flag D-12
├── [ ] Modified files checked against scope
│   └── If files outside scope → flag D-10
├── [ ] export_cycle called to persist intelligence
│   └── Even failed delegations produce useful information
├── [ ] Result validated against acceptance_criteria
│   └── Don't trust "status: success" — verify evidence
└── [ ] Hierarchy updated with delegation outcome
    └── map_context(action) with result summary
```

---

## 5. Deviation Classification Rules

When agents encounter unplanned situations during execution, classify and respond:

### R1: Bug (Auto-Fix)

**Trigger**: Broken behavior, type errors, runtime crashes, security vulnerabilities
**Action**: Fix immediately → test → verify → track with `[R1-Bug]` prefix
**Permission**: Automatic — no user approval needed
**Evidence**: Include before/after + test output in commit/report
**Example**: Type error in delegation packet construction; NPE in session loader

### R2: Missing Critical (Auto-Fix)

**Trigger**: Missing error handling, input validation, authentication check, rate limiting
**Action**: Add the missing piece → test → verify → track with `[R2-Critical]`
**Permission**: Automatic — critical safety gaps must be filled
**Evidence**: Show what was missing and why it's critical
**Example**: Workflow step with no error handler; delegation without failure_policy

### R3: Blocking (Auto-Fix)

**Trigger**: Missing dependency, wrong type signature, broken import, missing config
**Action**: Fix the blocker → verify it unblocks → track with `[R3-Blocking]`
**Permission**: Automatic — can't proceed without fixing
**Evidence**: Show what was blocking and what was done to unblock
**Example**: Missing template file referenced by workflow; broken skill registry entry

### R4: Architectural (STOP — Ask User)

**Trigger**: New schema design, switching libraries, breaking API contract, adding new service
**Action**: **STOP immediately** → present the decision with options → wait for user approval
**Permission**: MUST get user approval before proceeding
**Evidence**: Present problem, 2-3 options with tradeoffs, recommended path
**Example**: Changing workflow contract version; restructuring skill bundles; new agent role

### Decision Tree

```
Unplanned situation encountered
│
├── Crashes / breaks / security hole?
│   └── YES → R1 (fix now, report later)
│
├── Critical safety/validation gap?
│   └── YES → R2 (add now, report later)
│
├── Blocks progress entirely?
│   └── YES → R3 (unblock now, report later)
│
├── Changes architecture / contracts / APIs?
│   └── YES → R4 (STOP, ask user)
│
└── Unsure?
    └── R4 (STOP, ask user — always the safe choice)
```

---

## 6. User Behavior Mitigation

Users can self-inflict context poisoning. The framework must handle these scenarios:

### Scenario: Wall-of-Text Prompt

**What happens**: User dumps a massive unstructured prompt with nested ideas, references, and requirements.
**Risk**: Agent tries to address everything at once, causing D-02 (avalanche) and D-04 (artifact dump).
**Mitigation**:
1. Parse the prompt into discrete requirements (spec-distillation skill)
2. Classify each requirement by priority and complexity
3. Create a structured plan before executing anything
4. Address requirements one at a time in priority order

### Scenario: Mid-Session Topic Switch

**What happens**: User changes topic entirely without closing current context.
**Risk**: Previous context pollutes new topic decisions.
**Mitigation**:
1. Detect topic switch via intent comparison
2. Save current state with `compact_session` summary
3. Start new trajectory for new topic
4. Keep old trajectory accessible via `think_back`

### Scenario: Contradictory Instructions

**What happens**: User gives instructions that contradict earlier decisions or anchors.
**Risk**: Agent follows latest instruction, breaking previous commitments.
**Mitigation**:
1. Check new instruction against anchors and recent mems
2. If contradiction detected: present both positions to user
3. Get explicit "override previous decision" confirmation
4. Update anchors if decision changes

### Scenario: Random Agent Selection

**What happens**: User starts complex task with wrong agent (e.g., asks hivemaker for planning).
**Risk**: Agent operates outside its role boundaries, producing low-quality work.
**Mitigation**:
1. Agent checks its role boundaries against task type
2. If mismatch: suggest correct agent with routing reason
3. If user insists: proceed but flag as out-of-role
4. Include role mismatch in session report
