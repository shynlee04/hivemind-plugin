# Unified Agent Development Workflow: Integrated Skill Guide

**Version:** 1.0.0  
**Date:** 2026-03-20  
**Framework:** OpenCode + HiveMind

---

## 1) Skill Integration Overview

### 1.1 Purpose of Each Skill

| Skill | Source | Purpose | Core Function |
|-------|--------|---------|---------------|
| `subagent-driven-development` | superpowers (obra) | Task decomposition + delegation methodology | Breaks work into delegable units, defines session boundaries |
| `deep-agents-orchestration` | langchain-skills | Multi-agent coordination | Orchestrates parallel execution, manages state between agents |
| `validate-implementation-plan` | skills.sh (b-mendoza) | Pre-execution gate | Verifies plan completeness, requirement traceability, risk assessment |
| `verification-before-completion` | superpowers (obra) | Completion gate | Evidence collection, final audit, quality assurance |

### 1.2 Responsibility Matrix

| Phase | Owner | Supporting Skills | Boundary |
|-------|-------|------------------|----------|
| **Intake** | `validate-implementation-plan` | — | Validates plan before any implementation begins |
| **Decomposition** | `subagent-driven-development` | `deep-agents-orchestration` | Breaks work into delegable units |
| **Delegation** | `subagent-driven-development` | — | Creates sub-sessions with scoped briefs |
| **Orchestration** | `deep-agents-orchestration` | `subagent-driven-development` | Coordinates multi-agent execution |
| **TDD Execution** | Sub-agents (delegated) | `verify-before-completion` | RED→GREEN→REFACTOR cycles |
| **Validation** | `validate-implementation-plan` | `verify-before-completion` | Gate at each phase |
| **Completion** | `verify-before-completion` | — | Final evidence collection |

### 1.3 Handoff Map

```
REQUEST INTAKE
     ↓
[validate-implementation-plan] ──→ VALIDATED PLAN ──→ PLAN NOT VALID
     ↓                                    ↓               ↓
[subagent-driven-development]         REVISION        STOP / ESCALATE
     ↓                                    ↑
DECOMPOSITION ──→ DEPENDENCY GRAPH        │
     ↓                                    │
[deep-agents-orchestration]              │
     ↓                                    │
SUB-AGENT CREATION ──→ PARALLEL/SEQUENTIAL EXECUTION (ALL DELEGATED)
     ↓
[verify-before-completion] @ each milestone
     ↓
FINAL COMPLETION + AUDIT
```

### 1.4 Overlap Resolution

| Overlap Point | Skills Involved | Resolution |
|---------------|----------------|------------|
| **Task sizing** | `subagent-driven` + `deep-agents` | `subagent-driven` owns sizing rules; `deep-agents` applies orchestration pattern |
| **Context packaging** | `subagent-driven` + `deep-agents` | `subagent-driven` defines the package structure; `deep-agents` handles transport |
| **Validation gates** | `validate-plan` + `verify-before-completion` | `validate-plan` = pre-execution gate; `verify-before-completion` = post-execution gate |
| **Delegation criteria** | `subagent-driven` alone | No overlap; `deep-agents` only orchestrates already-delegated work |

---

## 2) Unified Workflow Architecture

### 2.1 End-to-End Lifecycle

```
┌─────────────────────────────────────────────────────────────────────┐
│                    UNIFIED WORKFLOW LIFECYCLE                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────┐    ┌─────────────┐    ┌────────────────┐            │
│  │  INTAKE  │───▶│  VALIDATE   │───▶│  DECOMPOSE     │            │
│  │  Request │    │  PLAN       │    │  Tasks        │            │
│  └──────────┘    └─────────────┘    └────────────────┘            │
│                                              │                       │
│                                              ▼                       │
│  ┌──────────┐    ┌─────────────┐    ┌────────────────┐            │
│  │  AUDIT   │◀───│  VERIFY +   │◀───│  DELEGATE +    │            │
│  │  + CLOSE │    │  COMPLETE   │    │  ORCHESTRATE   │            │
│  └──────────┘    └─────────────┘    └────────────────┘            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Skill Invocation Order

| Step | Skill | Mandatory? | Gate? | Output |
|------|-------|-----------|-------|--------|
| 1 | `validate-implementation-plan` | **YES** | YES | Validated Plan |
| 2 | `subagent-driven-development` | YES | NO | Task Graph + Delegation Briefs |
| 3 | `deep-agents-orchestration` | IF parallel | NO | Orchestration Map |
| 4 | **Implementation via DELEGATED sub-agents** | YES | NO | Code + Tests |
| 5 | `verify-before-completion` | **YES** | YES | Evidence Package |

### 2.3 Mandatory Gates vs Optional Enhancements

| Gate | Type | Who Runs | Blocking? |
|------|------|----------|-----------|
| Plan Validation | **MANDATORY** | Main session | YES - cannot proceed without |
| Milestone Verification | **MANDATORY** | Main session | YES - blocks next phase |
| Final Completion | **MANDATORY** | Main session | YES - cannot close without |
| Parallel Orchestration | OPTIONAL | `deep-agents` | NO - enhances throughput |
| Advanced Handoff | OPTIONAL | Sub-agents | NO - improves context |

### 2.4 Happy Path

1. Request received
2. `validate-implementation-plan` validates plan → PASS
3. `subagent-driven-development` decomposes into tasks
4. Tasks sized and dependency graph created
5. If parallel work → `deep-agents-orchestration` activates
6. **ALL implementation delegated to sub-agents** (NEVER main session)
7. Each milestone → `verify-before-completion` gates
8. Final verification → evidence collected
9. Audit → lessons recorded

### 2.5 Error Recovery Path

```
PLAN VALIDATION FAILS
     ↓
Return to requestor with gap list
     ↓
Revised plan re-submitted
     ↓
VALIDATE again

DELEGATION FAILURE (TaskTool fails)
     ↓
Retry with simpler prompt → Different agent → client.session.create()
     ↓
All delegation failed → LOG FAILURE + REPORT TO USER
     ↓
NEVER: Main session executes implementation inline

SUB-AGENT FAILURE
     ↓
Capture evidence of what failed
     ↓
Escalate to main session
     ↓
Main session determines: retry with fixed brief OR abort
     ↓
RETRY with corrected brief (NOT main session implementation)

VERIFICATION FAILURE
     ↓
Identify failing criteria
     ↓
Return to implementation phase with specific fixes
     ↓
Re-delegate fixes to sub-agent
     ↓
Re-verify before proceeding
```

---

## 3) Main Session vs Sub-Session Model

### 3.1 Session Types Defined

| Attribute | Main Session | Sub-Session (Sub-Agent) |
|-----------|-------------|------------------------|
| **Role** | Orchestrator only | Implementation only |
| **Writes code** | **NEVER** | **ALWAYS** |
| **Runs tests** | **NEVER** | **ALWAYS** |
| **Modifies files** | **NEVER** | **ALWAYS** |
| **Authority** | Full decision-making | Bounded by brief |
| **Scope** | End-to-end ownership | Task-scoped execution |
| **Context** | Full project state | Scoped package only |

### 3.2 The Iron Rule: DELEGATE EVERYTHING

```
IF task involves ANY of:
  - Writing code
  - Running tests
  - Modifying files
  - Building features
  - Fixing bugs
  - Refactoring
  - Running linters/formatters
  - Any implementation work

THEN → DELEGATE TO SUB-AGENT
       NO EXCEPTIONS
       MAIN SESSION NEVER TOUCHES CODE
```

**ONLY inline execution (direct user response):**
- Answering questions
- Explaining concepts
- Summarizing findings
- Reading files to understand context for orchestration

### 3.3 Decision Authority Matrix

| Decision Type | Main Session | Sub-Session |
|---------------|--------------|-------------|
| **Plan validity** | OWNER | Can flag concerns |
| **Task decomposition** | OWNER | Cannot decompose further |
| **Delegation** | OWNER | Cannot delegate further |
| **Implementation** | **NEVER** | OWNER within brief |
| **TDD approach** | **NEVER** | OWNER within brief |
| **Verification** | OWNER | Co-operator |
| **Escalation** | RECEIVER | TRIGGERER |

### 3.4 Context Package (Passed Down via Brief)

```
DELEGATION BRIEF
├── sessionId: parent session for handoff
├── taskId: unique task identifier
├── scope:
│   ├── inScope: explicit task list
│   └── outOfScope: explicit exclusions
├── artifacts:
│   ├── required: must-produce list
│   └── optional: nice-to-have
├── tests:
│   ├── required: boolean
│   ├── location: file path
│   └── runCommand: command to execute
├── evidence:
│   ├── requiredArtifacts: what sub must return
│   └── completionTemplate: format for return
├── escalation:
│   ├── triggers: when to escalate
│   └── abortSignal: honor context.abort
└── OpenCode context:
    ├── worktree: worktree root
    ├── directory: project root
    └── abort: AbortSignal
```

### 3.5 What Each Session Must Never Do

| Main Session Must Never | Sub-Session Must Never |
|------------------------|----------------------|
| Write code | Expand scope beyond brief |
| Run tests | Mark complete without evidence |
| Modify files | Write tests that conflict with brief |
| Implement features | Delegate to another agent |
| **Execute implementation inline** | Return non-JSON output |

### 3.6 When to Create Sub-Sessions

```
CREATE SUB-SESSION WHEN:
├── Task involves ANY implementation work (always for non-user-response)
├── Task can execute independently
├── Task size > 5 minutes
├── Task requires different expertise
├── Parallel execution would speed up
├── Task boundary is clear
└── Context can be fully packaged in brief

KEEP IN MAIN SESSION WHEN:
├── Task is pure orchestration (planning, decomposing)
├── Task is direct user response (answering, explaining)
├── Reading files to understand context
└── Writing orchestration logic
```

### 3.7 Escalation Protocol

```
ESCALATION TRIGGER (sub-session)
     ↓
Capture: what, why, evidence
     ↓
Format: escalation brief
     ↓
Send to main session via structured output
     ↓

MAIN SESSION RESPONSE
├── Acknowledge receipt
├── Assess: retry with fixed brief, reassign, or abort
├── If retry: provide corrected brief
├── If reassign: new brief issued to different sub-agent
├── If abort: return evidence + close
└── NEVER: Implement inline (violates iron rule)
```

### 3.8 OpenCode-Optimized Delegation

| Concern | OpenCode Pattern | Implementation |
|---------|-----------------|----------------|
| **Session creation** | `TaskTool` spawns sub-agent | `task` tool with agent type |
| **Context transport** | Structured brief via prompt | Use delegation brief template |
| **Result aggregation** | Main validates sub-agent output | Require JSON with `success` field |
| **State sync** | `trajectory` for history | Log events via `hivemind_trajectory` |
| **Abort handling** | `context.abort` signal | Honor in sub-agent loops |
| **Zero-trust validation** | `tool.execute.after` hook | Validate JSON before accepting |

---

## 4) Delegation Framework

### 4.1 Delegation Decision Tree

```
START: Task received
     │
     ▼
Is this direct user response only?
     │
     ├── YES → Execute inline (main session)
     │          (answers, explanations)
     │
     └── NO → DELEGATE TO SUB-AGENT (always)
              │
              ▼
         Use TaskTool
              │
              ▼
         Package context brief
              │
              ▼
         Sub-agent executes
              │
              ▼
         Zero-trust validation
              │
              ▼
         Passed?
              ├── YES → Accept result
              │
              └── NO → Fallback chain
                         │
                         ▼
                    Retry with fixed brief
                         │
                         ▼
                    Different agent
                         │
                         ▼
                    client.session.create()
                         │
                         ▼
                    All failed?
                         ├── NO → Success
                         └── YES → LOG + REPORT
                                    │
                                    ▼
                            NEVER inline execution
```

### 4.2 Task Sizing Rules

| Size | Duration | Sub-Session? | TDD Expectation |
|------|----------|-------------|-----------------|
| **XS** | < 5 min | **YES** (delegate) | Single test file |
| **S** | 5-15 min | **YES** | One test suite |
| **M** | 15-30 min | **YES** | Full RED→GREEN→REFACTOR |
| **L** | 30-60 min | **YES** | Complete TDD cycle |
| **XL** | 1-2 hours | **YES** | Multi-file TDD with milestones |
| **XXL** | > 2 hours | **YES** (split) | Multi-sub-session with gates |

### 4.3 Dependency Handling

```
DEPENDENCY TYPES:
├── Sequential: A must complete before B
│   └── Handle: Chain sub-agents with gate between
│
├── Conditional: A must pass before B starts
│   └── Handle: Verification gate between sub-agents
│
├── Parallel: A and B can run simultaneously
│   └── Handle: Parallel sub-agents via deep-agents orchestration
│
└── Shared: A and B share state
    └── Handle: Consolidate into single sub-agent
```

### 4.4 Sequencing vs Parallelization Rules

| Condition | Action |
|-----------|--------|
| Independent tasks, > 2 units | Parallelize with orchestration |
| Independent tasks, ≤ 2 units | Sequential, simpler |
| Dependent tasks | Chain with verification gates |
| Mixed dependencies | Pipeline with stage gates |
| Shared state | Consolidate, no parallel |

### 4.5 Handoff Contract (Delegation Brief Template)

```markdown
## Sub-Agent Brief: [Task Name]

**Brief ID:** [ID]
**Parent Session:** [session ID]
**Created:** YYYY-MM-DD HH:MM

---

## Context
[What main session knows that sub-agent needs]

## Specific Task
[Exact implementation ask]

## Files
- **Read:** [files to read for context]
- **Modify:** [files to change]
- **Create:** [files to make]

## Tests
- **Run:** [test command]
- **Expected:** [pass/fail criteria]
- **Coverage target:** [X]%

## Constraints
- [Boundaries]
- [What NOT to do]

## OpenCode Context
```json
{
  "worktree": "[worktree root]",
  "directory": "[project root]",
  "agent": "[gsd-executor|gsd-debugger|explore|general]"
}
```

## Expected Output Format
```json
{
  "success": true/false,
  "artifacts": ["files created"],
  "summary": "what was done",
  "testResults": "test output",
  "evidence": {
    "completedAt": "ISO-8601",
    "duration": "Xm Ys",
    "filesChanged": ["list"]
  }
}
```

## Escalation Triggers
- Blocked > 15 minutes
- Context missing
- Scope unclear
- Tests failing unexpectedly

## Completion Template
Return filled:
```json
{
  "success": boolean,
  "artifacts": string[],
  "summary": string,
  "testResults": string,
  "evidence": object
}
```
```

### 4.6 Review Responsibilities

| Review Type | Who Performs | Trigger | Action on Fail |
|-------------|--------------|---------|----------------|
| **Brief review** | Sub-agent on receipt | Before starting | Request clarification via escalation |
| **Mid-point check** | Main session | At milestone | Course correct or escalate |
| **Completion review** | Main session | On return | Validate JSON, verify evidence |
| **Integration review** | Main session | After merge | Validate combined result |

### 4.7 Failure Handling and Retry Logic

| Failure Mode | Action | Retry Policy |
|--------------|--------|--------------|
| **TaskTool timeout** | Respawn with narrower brief | Max 2 retries |
| **Invalid JSON output** | Zero-trust rejects, request respawn | Max 3 retries |
| **Sub-agent crashes** | Log, return evidence | Main decides: new brief or abort |
| **Tests fail on return** | Reject, return for fixes | Max 2 retries, then escalate |
| **Scope creep detected** | Reject entirely | Cannot expand, must re-brief |
| **All delegation failed** | Report to user | **NEVER execute inline** |

### 4.8 Over-Delegation and Under-Delegation

| Anti-Pattern | Symptom | Fix |
|--------------|---------|-----|
| **Under-delegation** | Main session doing implementation work | Iron rule: delegate ALL implementation |
| **Over-delegation** | 10+ tiny sub-agents for simple task | Consolidate into M-L sized tasks |
| **Ambiguous ownership** | "I thought you were doing X" | Explicit scope in brief |
| **Vague brief** | Sub-agent asks many questions | Invest in brief quality before delegating |
| **No verification gate** | Sub-agent returns, assumed done | Mandatory verification before "done" |

---

## 5) TDD Integration

### 5.1 TDD Cycle with Delegation

```
┌─────────────────────────────────────────────────────────────┐
│                    TDD INTEGRATION CYCLE                     │
│                    (ALL VIA DELEGATION)                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌─────────┐    ┌─────────┐    ┌─────────────┐            │
│   │   RED   │───▶│  GREEN  │───▶│  REFACTOR   │            │
│   │  Phase  │    │  Phase  │    │   Phase    │            │
│   └────┬────┘    └────┬────┘    └──────┬──────┘            │
│        │              │                 │                    │
│        ▼              ▼                 ▼                    │
│   validate-      [DELEGATED TO         deep-agents           │
│   implementation-  SUB-AGENT]          orchestrates          │
│   plan                              refactor               │
│        │              │                 │                    │
│        │              ▼                 │                    │
│        │         verify-before-         │                    │
│        │         completion             │                    │
│        │              │                 │                    │
│        └──────────────┴──────────────────┘                    │
│                         │                                     │
│                         ▼                                     │
│                    verify-before-                             │
│                    completion @ milestone                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Skill Roles in TDD

| Phase | Primary Owner | Support | Sub-Agent Task |
|-------|---------------|---------|----------------|
| **RED** | `validate-implementation-plan` | — | Verify test requirements |
| **GREEN** | **DELEGATED to sub-agent** | — | Write minimal code to pass |
| **REFACTOR** | **DELEGATED to sub-agent** | `deep-agents` | Coordinate cross-file refactors |
| **GATE** | `verify-before-completion` | — | Evidence collection at each phase |

### 5.3 TDD Guidance by Scenario

#### New Feature

```
1. validate-implementation-plan:
   [ ] Feature requirements → test requirements traced
   [ ] Test coverage targets defined
   [ ] Happy path + edge case tests specified

2. subagent-driven-development:
   [ ] Feature decomposed to testable units
   [ ] Test-first ordering established
   [ ] Dependencies mapped

3. DELEGATE each unit to sub-agent:
   RED: Write failing test for smallest unit (sub-agent)
   GREEN: Minimal implementation to pass (sub-agent)
   REFACTOR: Clean code, maintain tests (sub-agent)

4. verify-before-completion:
   [ ] All tests pass
   [ ] Coverage meets target
   [ ] No regression in existing tests
```

#### Bug Fix

```
1. validate-implementation-plan:
   [ ] Bug scenario → test case written FIRST
   [ ] Regression test requirements specified
   [ ] Edge cases around bug identified

2. subagent-driven-development:
   [ ] Bug isolated to specific unit
   [ ] Fix scoped to minimal change

3. DELEGATE to sub-agent:
   RED: Write failing test reproducing bug (sub-agent)
   GREEN: Fix to pass test (sub-agent)
   REFACTOR: No refactor on bug fix (sub-agent)

4. verify-before-completion:
   [ ] Bug reproduction test passes
   [ ] Regression tests pass
   [ ] No new warnings introduced
```

#### Refactor

```
1. validate-implementation-plan:
   [ ] Refactor scope + boundaries defined
   [ ] Behavioral preservation requirements specified
   [ ] Test coverage required to ensure no regression

2. subagent-driven-development:
   [ ] Refactor decomposed by risk level
   [ ] High-risk areas identified
   [ ] Verification milestones set

3. DELEGATE to sub-agent(s):
   GREEN: Keep existing tests passing (sub-agent)
   REFACTOR: Change structure, update tests if API changes (sub-agent)

4. verify-before-completion:
   [ ] All tests pass
   [ ] Behavioral tests unchanged
   [ ] Performance within tolerance
```

#### High-Risk Change

```
1. validate-implementation-plan:
   [ ] Risk assessment performed
   [ ] Mitigation strategies specified
   [ ] Rollback criteria defined

2. subagent-driven-development:
   [ ] Change broken into reversible units
   [ ] Each unit independently verifiable

3. DELEGATE to sub-agent(s):
   [ ] Smaller TDD cycles per unit
   [ ] Verification at each unit
   [ ] Integration test between units

4. verify-before-completion:
   [ ] Full test suite passes
   [ ] Risk criteria met
   [ ] Rollback plan ready
```

---

## 6) Validation System

### 6.1 Three-Stage Validation Framework

| Stage | When | Owner | Blocking? |
|-------|------|-------|-----------|
| **Pre-Execution** | Before any code written | `validate-implementation-plan` | **YES** |
| **In-Progress** | At milestones | Sub-agent + main session | **YES** |
| **Post-Execution** | After implementation | `verify-before-completion` | **YES** |

### 6.2 Pre-Execution Validation (validate-implementation-plan)

| Element | Required Inputs | Validation Criteria | Evidence Required |
|---------|-----------------|---------------------|-------------------|
| **Plan Structure** | Implementation plan document | Complete sections, proper format | Pass/Fail checklist |
| **Requirements Traceability** | Requirements + plan | Each requirement mapped to task | Trace matrix |
| **Task Decomposition** | Task list | Atomic, independent, ordered | Dependency graph |
| **Risk Assessment** | Plan + context | Risks identified, mitigations specified | Risk register |
| **TDD Requirements** | Test plan | Tests specified before implementation | Test list |
| **Success Criteria** | Acceptance criteria | Specific, measurable, testable | Criteria checklist |

**Failure Conditions:**
- Missing required sections → Return for revision
- Unmapped requirements → Return for trace
- Unrealistic task sizing → Return for re-scoping
- No TDD plan → Cannot proceed

**Remediation:** Return to requestor with specific gaps

**Approval Condition:** ALL criteria green → Signed validation artifact

### 6.3 In-Progress Validation

| Milestone | Validator | Criteria | Evidence |
|-----------|-----------|----------|----------|
| **Task start** | Sub-agent | Brief understood, scope clear | Acknowledgment in output |
| **Test written** | Sub-agent | RED phase complete | Failing test file |
| **Implementation complete** | Sub-agent | GREEN phase complete | Passing tests |
| **Refactor complete** | Sub-agent | Tests still passing | Test output |
| **Integration** | Main session | Components work together | Integration test output |

### 6.4 Post-Execution Validation (verify-before-completion)

| Element | Criteria | Evidence | Failure Action |
|---------|----------|----------|----------------|
| **Tests pass** | All new + existing tests passing | Test output | Fix or re-delegate |
| **Coverage** | Meets target % | Coverage report | Add tests or re-delegate |
| **No warnings** | Lint/typecheck clean | Lint output | Fix or re-delegate |
| **Code diff** | Minimal change, focused | Diff review | Revise scope |
| **Acceptance criteria** | All met | Checklist signed | Implement missing |
| **Artifacts** | All required present | File list | Generate or escalate |

### 6.5 Validation Evidence Requirements

| Phase | Artifact | Format | Preserved Where |
|-------|----------|--------|-----------------|
| Pre-execution | Validation report | JSON | Trajectory + evidence store |
| In-progress | Milestone receipts | Signed MD | Trajectory |
| Post-execution | Evidence package | ZIP/MD | Evidence store + trajectory |

---

## 7) Tooling Guidance

### 7.1 Tool Matrix by Phase

| Phase | Required Tools | Optional Tools | Who Uses |
|-------|---------------|----------------|----------|
| **Intake** | `read`, `glob`, `grep` | `hivemind_task` | Main session |
| **Validation** | `read`, `grep`, `TaskTool` | Markdown lint | Main session |
| **Decomposition** | `read`, `glob`, `grep`, `hivemind_task` | — | Main session |
| **Delegation** | `TaskTool` (task tool) | `client.session` | Main session |
| **Implementation** | Sub-agent does this | — | **Sub-agent** |
| **TDD Execution** | Sub-agent does this | — | **Sub-agent** |
| **Verification** | Sub-agent runs tests | Coverage tools | **Sub-agent** |
| **Completion** | `hivemind_handoff`, `bash` (git) | Artifact tools | Main session |

### 7.2 OpenCode Tools for Delegation

| Tool | Command | Purpose | User |
|------|---------|---------|------|
| `TaskTool` | `{name: "task", args: {...}}` | Spawn sub-agent | Main session |
| `client.session.create()` | SDK call | External session | Control plane |
| `tool.execute.after` | Hook | Zero-trust validation | Plugin |

### 7.3 Required Tool Descriptions

#### Repository Inspection (Main Session)

| Tool | Command | Purpose | Success | Failure |
|------|---------|---------|---------|---------|
| `read` | `read filePath` | Read files | Content retrieved | File not found |
| `glob` | `glob pattern` | Find files | File list | Pattern no match |
| `grep` | `grep pattern include` | Search code | Matches found | No matches |

#### Test Running (Delegated to Sub-Agent)

| Tool | Command | Purpose | Success | Failure |
|------|---------|---------|---------|---------|
| `bash` | `npm test` | Run test suite | All pass | Any fail |
| `bash` | `npx vitest` | Run vitest | All pass | Any fail |
| `bash` | `pytest` | Run pytest | All pass | Any fail |

#### Linting + Formatting (Delegated to Sub-Agent)

| Tool | Command | Purpose | Success | Failure |
|------|---------|---------|---------|---------|
| `bash` | `npm run lint` | ESLint/rubocop | Clean | Errors |
| `bash` | `npm run format` | Prettier/black | No diff | Diff found |
| `bash` | `ruff check .` | Ruff linter | Clean | Errors |

#### Static Analysis (Delegated to Sub-Agent)

| Tool | Command | Purpose | Success | Failure |
|------|---------|---------|---------|---------|
| `bash` | `npm run typecheck` | TypeScript check | Clean | Errors |
| `bash` | `mypy` | Python type check | Clean | Errors |

---

## 8) Conflict-Avoidance and Compatibility Matrix

### 8.1 Skill-to-Skill Conflict Matrix

| Skill Pair | Conflict Type | Mitigation |
|------------|--------------|------------|
| `subagent-driven` + `deep-agents` | Overlap in delegation | `subagent-driven` owns delegation, `deep-agents` orchestrates |
| `validate-plan` + `verify-before-completion` | Overlap in validation | Pre-execution vs post-execution gates |
| `deep-agents` + `verify-before-completion` | Orchestration vs verification | Sequential, not nested |

### 8.2 Common Failure Modes

| Failure Mode | Symptom | Root Cause | Prevention |
|--------------|---------|------------|------------|
| **Validation skip** | Implementation without plan | Time pressure | Mandatory gate |
| **Delegation bypass** | Main session does implementation | "Just this once" | Iron rule enforcement |
| **Scope creep** | Sub-agent expands work | Vague brief | Explicit scope + evidence |
| **Verification skip** | "Done" without evidence | Trust without proof | Mandatory checklist |
| **Context loss** | Sub-agent forgets context | Poor brief | Structured brief template |
| **Duplicate work** | Two agents do same task | Poor coordination | Orchestrator role |

### 8.3 Ownership Assignment

| Concern | Owner | Support | Cannot Override |
|---------|-------|---------|-----------------|
| Plan validity | `validate-plan` | — | Any phase |
| Task sizing | `subagent-driven` | — | Orchestration |
| Delegation | `subagent-driven` | — | — |
| Orchestration | `deep-agents` | — | Brief scope |
| TDD execution | **Sub-agent** | Main session | Brief scope |
| Completion | `verify-before-completion` | — | Evidence |

### 8.4 Lean Integration Principles

1. **No redundant process** — Each skill adds unique value
2. **No ceremonial gates** — Only mandatory blockers
3. **No overlap in execution** — Clear ownership
4. **No duplicate artifacts** — Single source of truth
5. **No trust without evidence** — Verify everything

---

## 9) Workflow Variants

### 9.1 Small Bug Fix

| Attribute | Value |
|-----------|-------|
| **Depth** | Shallow |
| **Delegate?** | **YES** (delegate even small tasks) |
| **Validation** | Minimal — bug reproduction test |
| **TDD** | RED: test first, GREEN: minimal fix |
| **Completion** | Single verification gate |

**Steps:**
1. Validate plan (fast)
2. Delegate bug reproduction test to sub-agent
3. Delegate fix to same or different sub-agent
4. Verify test passes + no regression
5. Complete

### 9.2 Medium Feature

| Attribute | Value |
|-----------|-------|
| **Depth** | Medium |
| **Delegate?** | **YES** — all implementation delegated |
| **Validation** | Plan validation + milestone |
| **TDD** | Full RED→GREEN→REFACTOR per unit |
| **Completion** | Two gates: milestone + final |

**Steps:**
1. Validate implementation plan
2. Decompose into 2-4 tasks
3. Delegate each task to sub-agent with TDD
4. Milestone verification
5. Integration verification
6. Final verification

### 9.3 Large Feature (Multi-Session)

| Attribute | Value |
|-----------|-------|
| **Depth** | Deep — multi-sub-agent |
| **Delegate?** | **YES** — parallel sub-agents |
| **Validation** | Plan + each milestone + final |
| **TDD** | TDD per sub-agent + integration tests |
| **Completion** | Gate per sub-agent + integration gate |

**Steps:**
1. Validate full plan
2. Decompose into parallelizable units
3. Create sub-agent briefs with scoped tasks
4. Parallel delegation with TDD
5. Each sub-agent: milestone verification
6. Orchestrate integration
7. Integration verification
8. Final completion verification

### 9.4 Refactor with Safety Constraints

| Attribute | Value |
|-----------|-------|
| **Depth** | Medium-High |
| **Delegate?** | **YES** — delegate even refactors |
| **Validation** | Plan + behavioral preservation |
| **TDD** | Tests must remain passing |
| **Completion** | Full regression suite |

**Steps:**
1. Validate refactor plan (with tests required)
2. Identify behavioral contracts
3. Delegate with TDD constraint: no behavior change
4. Verify all tests pass
5. Verify no performance regression
6. Complete with evidence

### 9.5 Exploratory Spike

| Attribute | Value |
|-----------|-------|
| **Depth** | Variable |
| **Delegate?** | **YES** — delegate investigation |
| **Validation** | Light — spike scope defined |
| **TDD** | Optional — learning first |
| **Completion** | Knowledge captured, not code |

**Steps:**
1. Define spike scope (timeboxed)
2. Delegate investigation to sub-agent
3. Sub-agent explores with loose process
4. Capture learnings in document
5. Discard experimental code (or delegate cleanup)
6. Report findings

### 9.6 Legacy Code Change

| Attribute | Value |
|-----------|-------|
| **Depth** | High — high risk |
| **Delegate?** | **YES** — with strong test coverage |
| **Validation** | Plan + safety + integration |
| **TDD** | Add tests BEFORE change |
| **Completion** | Full verification |

**Steps:**
1. Assess existing test coverage
2. Delegate characterization tests if needed
3. Validate plan with safety constraints
4. Delegate implementation with TDD
5. Full regression suite via sub-agent
6. Extended verification

---

## 10) Templates and Reusable Artifacts

### 10.1 Task Intake Template

```markdown
## Task Intake: [Task Name]

**Date:** YYYY-MM-DD
**Requestor:** [Name]
**Priority:** [P1/P2/P3]

### Request
[Brief description of what is needed]

### Context
[Relevant background, links to specs, PRDs]

### Constraints
- Technical constraints
- Timeline constraints
- Quality constraints

### Success Criteria
- Criterion 1
- Criterion 2

### Risk Assessment
[Initial risk assessment]

### Recommended Approach
[Main session orchestrates, sub-agents implement]
```

### 10.2 Implementation Plan Template

```markdown
## Implementation Plan: [Feature/Change Name]

**Task ID:** [ID]
**Version:** [N]
**Last Updated:** YYYY-MM-DD

### Overview
[2-3 sentence summary]

### Requirements Traceability

| Requirement | Task(s) | Test(s) | Status |
|-------------|---------|---------|--------|
| REQ-001 | Task 1.1, 1.2 | TEST-001 | Pending |
| REQ-002 | Task 2.1 | TEST-002 | Pending |

### Task Decomposition

#### Task 1: [Name]
**Owner:** Sub-agent
**Size:** [XS/S/M/L/XL]
**Dependencies:** [List]
**TDD Requirements:** [Tests required]

#### Task 2: [Name]
...

### Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| R1 | Low | High | [Plan] |

### Verification Milestones

| Milestone | Criteria | Gate |
|-----------|----------|------|
| M1 | Tests written | validate-plan |
| M2 | Core implementation | verify-before |
| M3 | Full implementation | verify-before |

### Acceptance Criteria
- [ ] AC-1
- [ ] AC-2
```

### 10.3 Validated Implementation Plan

```markdown
## Validated Plan: [Name]

**Validation Date:** YYYY-MM-DD
**Validated By:** validate-implementation-plan
**Status:** APPROVED / REVISION REQUIRED

### Validation Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| Complete sections | PASS/FAIL | [Notes] |
| Requirements mapped | PASS/FAIL | [Notes] |
| Tasks atomic | PASS/FAIL | [Notes] |
| Risks assessed | PASS/FAIL | [Notes] |
| TDD requirements | PASS/FAIL | [Notes] |
| Success criteria | PASS/FAIL | [Notes] |

### Gaps Identified
- Gap 1
- Gap 2

### Approval
**Can Proceed:** YES / NO

### Validation Evidence
```json
{
  "planId": "[ID]",
  "validatedAt": "[ISO timestamp]",
  "validator": "validate-implementation-plan",
  "status": "APPROVED",
  "gate": "PRE-EXECUTION"
}
```
```

### 10.4 Delegation Brief Template

```markdown
## Sub-Agent Brief: [Task Name]

**Brief ID:** [ID]
**Parent Session:** [session ID]
**Agent Type:** [gsd-executor|gsd-debugger|explore|general]

---

## Context
[What main session knows that sub-agent needs]

## Specific Task
[Exact implementation ask]

## Files
- **Read:** [files to read]
- **Modify:** [files to change]
- **Create:** [files to make]

## Tests
- **Run:** [test command]
- **Expected:** [pass/fail criteria]
- **Coverage target:** [X]%

## Constraints
- [Boundaries]
- [What NOT to do]

## OpenCode Context
```json
{
  "worktree": "[worktree root]",
  "directory": "[project root]",
  "agent": "[agent type]"
}
```

## Expected Output Format
```json
{
  "success": true/false,
  "artifacts": ["files created"],
  "summary": "what was done",
  "testResults": "test output",
  "evidence": {
    "completedAt": "ISO-8601",
    "duration": "Xm Ys",
    "filesChanged": ["list"]
  }
}
```

## Escalation Triggers
- Blocked > 15 minutes
- Context missing
- Scope unclear
```

### 10.5 Sub-Agent Progress Report

```markdown
## Progress Report: [Brief ID]

**Report Time:** YYYY-MM-DD HH:MM
**Expected Completion:** [Time]

### Progress
- [ ] Task 1: [Status] — [Notes]
- [ ] Task 2: [Status] — [Notes]

### Blockers
- [ ] None
- [ ] [Blocker description]

### Context Status
- [ ] Healthy
- [ ] Warning: [Issue]
- [ ] Critical: [Issue]

### Next Steps
1. [Step]
2. [Step]

### Confidence
- [ ] On track
- [ ] May need extension
- [ ] Will escalate
```

### 10.6 Test Plan Template

```markdown
## Test Plan: [Feature/Change Name]

**Associated Task:** [Task ID]
**Coverage Target:** [X]%

### Test Categories

#### Unit Tests
| Test | File | Pre-condition | Expected |
|------|------|---------------|----------|
| UT-001 | [file] | [state] | [result] |

#### Integration Tests
| Test | File | Components | Expected |
|------|------|------------|----------|
| IT-001 | [file] | A + B | [result] |

#### Regression Tests
| Test | File | Coverage | Status |
|------|------|----------|--------|
| RT-001 | [file] | [area] | [PASS/FAIL pre] |

### TDD Order
1. [Test 1] — [Rationale]
2. [Test 2] — [Rationale]

### Run Commands
- Unit: [command]
- Integration: [command]
- Full: [command]
```

### 10.7 Completion Verification Checklist

```markdown
## Verification Checklist: [Task/Feature Name]

**Date:** YYYY-MM-DD
**Verified By:** verify-before-completion

### Pre-Verification
- [ ] All code committed
- [ ] All tests pass locally
- [ ] Lint clean

### Functional Verification
- [ ] Acceptance criteria 1 met (evidence: [link])
- [ ] Acceptance criteria 2 met (evidence: [link])

### Test Verification
- [ ] New tests written (count: N)
- [ ] All tests pass (evidence: [paste output])
- [ ] Coverage target met (actual: X%, target: Y%)
- [ ] No regression in existing tests

### Code Quality
- [ ] TypeScript/Type check clean
- [ ] Lint clean
- [ ] Minimal diff (focused change)

### Documentation
- [ ] Code commented (if required)
- [ ] README updated (if needed)

### Evidence Package
- [ ] Test output
- [ ] Coverage report
- [ ] Code diff

### Final Sign-off
**Status:** APPROVED / REJECTED
**Verifier Signature:** _______________
```

### 10.8 Final Completion Report

```markdown
## Final Completion Report: [Task/Feature]

**Task ID:** [ID]
**Completed:** YYYY-MM-DD
**Duration:** [X hours/days]

### Summary
[2-3 sentence summary of what was delivered]

### Deliverables
| Deliverable | Status | Evidence |
|-------------|--------|----------|
| [Item 1] | Complete | [link] |
| [Item 2] | Complete | [link] |

### Metrics
- Tasks Completed: N
- Tests Written: N
- Test Coverage: X%
- Files Changed: N

### Verification Summary
- [ ] Pre-execution validation: PASSED
- [ ] In-progress verification: PASSED (N milestones)
- [ ] Post-execution verification: PASSED

### Issues Logged
| Issue | Resolution |
|-------|------------|
| [Issue 1] | [Resolution] |

### Lessons Learned
- [What went well]
- [What could improve]

### Approval
**Status:** COMPLETE / INCOMPLETE
**Approved By:** _______________
```

### 10.9 Post-Task Audit Report

```markdown
## Post-Task Audit: [Task ID]

**Audit Date:** YYYY-MM-DD
**Task Completed:** [Date]
**Auditor:** [Name]

### Audit Scope
[What was audited]

### Evidence Collected
- [Evidence 1]
- [Evidence 2]

### Audit Findings

#### Process Adherence
| Step | Required | Performed | Compliant |
|------|----------|-----------|-----------|
| Plan validation | YES | YES/NO | PASS/FAIL |
| TDD cycle | YES | YES/NO | PASS/FAIL |
| Milestone verification | YES | YES/NO | PASS/FAIL |
| Final verification | YES | YES/NO | PASS/FAIL |

#### Quality Indicators
| Indicator | Target | Actual | Status |
|-----------|--------|--------|--------|
| Test coverage | X% | Y% | PASS/FAIL |
| Lint errors | 0 | N | PASS/FAIL |

#### Delegation Effectiveness
| Aspect | Assessment |
|--------|------------|
| Brief quality | [Rating] |
| Scope adherence | [Rating] |
| Evidence quality | [Rating] |

### Issues Identified
| Issue | Severity | Remediation |
|-------|----------|-------------|
| [Issue] | H/M/L | [Action] |

### Recommendations
1. [Recommendation 1]
2. [Recommendation 2]

### Audit Score
| Dimension | Score (1-5) |
|-----------|-------------|
| Process adherence | |
| Output quality | |
| Evidence completeness | |
| Lesson capture | |
| **Overall** | |

### Signature
**Auditor:** _______________
**Date:** _______________
```

---

## 11) Audit-After Framework

### 11.1 What to Inspect

| Category | Items to Check | Source |
|----------|---------------|--------|
| **Process** | All gates followed | Trajectory |
| **Output** | Code matches plan | Diff |
| **Evidence** | All required artifacts present | Evidence store |
| **Tests** | Coverage, pass/fail, quality | Test output |
| **Delegation** | Briefs scoped, results returned | Briefs + completions |

### 11.2 Evidence to Collect

| Evidence Type | Tool/Command | Preserved |
|---------------|--------------|-----------|
| Validation report | JSON from validate-plan | Evidence store |
| Test output | `npm test > test.log` | Evidence store |
| Coverage report | `npm run coverage` | Evidence store |
| Lint output | `npm run lint > lint.log` | Evidence store |
| Code diff | `git diff` | Trajectory |
| Completion reports | From sub-agents | Trajectory |
| Final verification | Checklist signed | Evidence store |

### 11.3 Mistakes to Look For

| Category | Mistake | Detection |
|----------|---------|-----------|
| **Validation** | Plan not validated before implementation | Missing validation artifact |
| **Delegation** | Main session did implementation (IRON RULE VIOLATION) | Diff shows main session changes |
| **TDD** | Tests written after code | Git history analysis |
| **Verification** | Evidence missing | Checklist incomplete |
| **Scope** | Work expanded beyond brief | Diff larger than brief scope |

### 11.4 Detecting Iron Rule Violation

| Signal | Indicator | Check |
|--------|-----------|-------|
| Main session writes code | Diff shows changes without sub-agent | Verify all implementation via TaskTool |
| Main session runs tests | Test output from main session | Verify via sub-agent delegation |

### 11.5 Detecting Weak Validation

| Signal | Indicator | Check |
|--------|-----------|-------|
| Plan validation | Passed too quickly | Time from submit to approved |
| Verification | Same evidence for all tasks | Cookie-cutter reports |

### 11.6 Detecting False "Done"

| Signal | Indicator | Check |
|--------|-----------|-------|
| Missing evidence | Checklist incomplete | Final verification |
| Tests skipped | Coverage << target | Coverage report |
| No regression | Existing tests not run | Test output |

### 11.7 Post-Task Audit Checklist

- [ ] Evidence package complete
- [ ] All validation gates passed
- [ ] All verification checklists signed
- [ ] Test coverage meets target
- [ ] No iron rule violations (main session never wrote code)
- [ ] Lessons documented
- [ ] Recommendations actionable

### 11.8 Audit Scoring Rubric

| Score | Grade | Definition |
|-------|-------|------------|
| 5 | Exceptional | Exceeded standards in all dimensions |
| 4 | Good | Met standards, minor improvements noted |
| 3 | Acceptable | Met minimum standards, issues non-critical |
| 2 | Marginal | Missed some standards, remediation needed |
| 1 | Failed | Major gaps including iron rule violation |

---

## 12) Operational Rules and Guardrails

### 12.1 Non-Negotiable Rules

| Rule | Rationale | Enforced By |
|------|-----------|-------------|
| **NEVER implement inline** | Iron rule - main session is orchestrator only | All phases |
| **Never delegate without scoped brief** | Prevents scope creep | Brief template required |
| **Never mark done without evidence** | Prevents false "done" | verify-before-completion gate |
| **Never skip TDD** | Ensures testability | TDD requirements in brief |
| **Never allow sub-agent to expand scope** | Maintains control | Brief scope boundaries |
| **Never accept vague escalations** | Enables proper response | Escalation template required |

### 12.2 Anti-Patterns

| Anti-Pattern | Description | Correct |
|--------------|-------------|---------|
| **Main session writes code** | Violates iron rule | Delegate ALL implementation |
| **Validation theater** | Validating without real check | Real validation with evidence |
| **Brief and forget** | Delegating without monitoring | Mid-point check |
| **Evidence theater** | Collecting evidence without review | Review all evidence |
| **TDD lip service** | Calling it TDD but writing tests after | RED→GREEN→REFACTOR |
| **Verification skip** | Checking but no pass/fail criteria | Mandatory checklist |

### 12.3 Smell List

| Smell | Indicator | Action |
|-------|-----------|--------|
| **Vague brief** | Sub-agent asks many questions | Rework brief before continuing |
| **Scope creep** | Diff significantly larger than brief | Reject, re-scope |
| **Iron rule violation** | Main session changes in diff | Immediate audit |
| **Evidence gaps** | Missing artifacts in completion | Reject completion |
| **Test debt** | Coverage declining | Add tests before continuing |

### 12.4 Recovery Actions

| Breakdown | Symptoms | Recovery |
|-----------|----------|----------|
| **Iron rule violation** | Main session wrote code | Audit, revert, re-delegate |
| **Validation failure** | Implementation diverging from plan | Return to plan, re-validate |
| **TDD breakdown** | Tests failing, no red-green | Pause, fix tests, re-TDD |
| **Verification failure** | Final checklist incomplete | Return to implementation |
| **Delegation failure** | Sub-agents returning poor quality | Bring work back to orchestration, re-delegate |

---

## 13) Reference Section

### 13.1 Skill Sources

| Skill | Source | Install Command |
|-------|--------|-----------------|
| `subagent-driven-development` | superpowers (obra) | `npx skills add https://github.com/obra/superpowers --skill subagent-driven-development` |
| `deep-agents-orchestration` | langchain-skills | `npx skills add https://github.com/langchain-ai/langchain-skills --skill deep-agents-orchestration` |
| `validate-implementation-plan` | skills.sh (b-mendoza) | `https://skills.sh/b-mendoza/agent-skills/validate-implementation-plan` |
| `verification-before-completion` | superpowers (obra) | `npx skills add https://github.com/obra/superpowers --skill verification-before-completion` |

### 13.2 Skill Intended Use

| Skill | Intended Use | NOT For |
|-------|--------------|---------|
| `subagent-driven-development` | Task decomposition, delegation briefs, session boundaries | Writing code, implementation |
| `deep-agents-orchestration` | Multi-agent coordination, parallel execution, state management | Single-threaded work, simple tasks |
| `validate-implementation-plan` | Pre-execution validation, requirement traceability | Post-execution verification |
| `verification-before-completion` | Completion gates, evidence collection, final audit | Planning, decomposition |

### 13.3 OpenCode Tool Mapping

| Delegation Action | OpenCode Tool | Notes |
|-----------------|---------------|-------|
| Spawn sub-agent | `TaskTool` | Primary delegation |
| External session | `client.session.create()` | Fallback |
| Validate output | `tool.execute.after` hook | Zero-trust |
| Track state | `hivemind_trajectory` | Evidence logging |

### 13.4 Fallback Chain Summary

```
Implementation needed
     │
     ▼
TaskTool → Sub-agent executes
     │
     ▼
Failed? → Retry with fixed brief
     │
     ▼
Failed? → Different agent type
     │
     ▼
Failed? → client.session.create()
     │
     ▼
Failed? → LOG + REPORT TO USER
     │
     ▼
NEVER: Execute inline
```

### 13.5 Compatibility Notes

| Note | Description |
|------|-------------|
| **OpenCode compatibility** | All skills work with OpenCode's `TaskTool` and session model |
| **HiveMind integration** | Skills integrate with HiveMind trajectory and evidence systems |
| **Stack budget** | These 4 skills together use 4 stack slots — consider activating sequentially |
| **Iron rule** | Main session NEVER implements — only orchestrates |

### 13.6 Integration Principles Summary

1. **validate-implementation-plan** = gatekeeper before work starts
2. **subagent-driven-development** = decomposition + delegation authority
3. **deep-agents-orchestration** = coordination of parallel/sub-agents
4. **verification-before-completion** = gatekeeper after work completes
5. **Iron Rule** = main session NEVER implements, only orchestrates

---

**Document End**
