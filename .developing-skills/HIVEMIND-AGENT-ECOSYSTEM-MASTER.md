# HiveMind Agent Ecosystem — Master Workflow Reference

**Date:** 2026-03-23
**Source:** Deep research into OpenCode agent system, GSD framework patterns, HiveMind delegation ecosystem
**Purpose:** Single source of truth for agent interactions, delegation loops, checkpoints, skill loading, tool usage, and edge case handling

---

## 1. Agent Inventory

| Agent | File | Mode | Role | Hidden | Can Edit | Terminal? |
|-------|------|------|------|--------|----------|-----------|
| hiveminder | hiveminder.md | primary | Primary orchestrator, user-facing | false | NO | NO |
| architect | architect.md | all | System design authority | false | NO | NO |
| code-skeptic | code-skeptic.md | subagent | Critical analysis | true | NO | NO |
| hiveq | hiveq.md | subagent | Verification specialist | true | NO | NO |
| hivemaker | hivemaker.md | subagent | Implementation specialist | true | YES | NO |
| hiveplanner | hiveplanner.md | subagent | Planning specialist | true | YES | NO |
| hivexplorer | hivexplorer.md | subagent | Repository investigator | true | NO | **YES** |
| hiverd | hiverd.md | subagent | External research | true | NO | **YES** |
| hivehealer | hivehealer.md | subagent | Remediation specialist | true | YES | NO |
| hitea | hitea.md | subagent | Testing infrastructure | true | YES | NO |
| handoff | handoff.md | all | Complex workflow orchestrator | false | YES | NO |

**Terminal agents** (hivexplorer, hiverd) never delegate to other agents. They are leaf nodes.

---

## 2. Agent Interaction Matrix

### Who Can Call Whom

| From \ To | hiveminder | architect | code-skeptic | hiveq | hivemaker | hiveplanner | hivexplorer | hiverd | hivehealer | hitea | handoff |
|-----------|-----------|-----------|-------------|-------|-----------|-------------|-------------|--------|------------|-------|---------|
| **hiveminder** | YES | YES | YES | YES | YES | YES | YES | YES | YES | YES | YES |
| **architect** | — | — | YES | YES | — | — | YES | — | — | — | — |
| **code-skeptic** | — | — | — | YES | — | — | YES | — | — | — | — |
| **hiveq** | — | — | — | — | YES | — | YES | — | — | — | — |
| **hivemaker** | — | — | — | YES | — | — | YES | — | — | — | — |
| **hiveplanner** | — | — | — | — | — | — | YES | YES | — | — | — |
| **hivexplorer** | — | — | — | — | — | — | — | — | — | — | — |
| **hiverd** | — | — | — | — | — | — | — | — | — | — | — |
| **hivehealer** | — | — | — | YES | — | — | YES | — | — | — | — |
| **hitea** | — | — | — | YES | — | — | YES | — | — | — | — |
| **handoff** | YES | YES | YES | YES | YES | YES | YES | YES | YES | YES | YES |

---

## 3. Delegation Loops

### 3.1 Main Implementation Loop

```
USER → hiveminder
  │
  ├─→ architect (design)
  │     ├─→ hivexplorer (codebase patterns) → architect
  │     ├─→ code-skeptic (challenge design) → architect
  │     │     └─→ hivexplorer (deeper investigation) → code-skeptic
  │     └─→ hiveq (validate feasibility) → architect
  │
  ├─→ hivemaker (implement)
  │     ├─→ hivexplorer (code context) → hivemaker
  │     └─→ hiveq (self-verify) → hivemaker
  │
  ├─→ hiveq (verify implementation)
  │     ├─→ hivexplorer (verification context) → hiveq
  │     │
  │     ├─ IF gaps_found:
  │     │   └─→ hivemaker (fix) → hiveq (re-verify)
  │     │         └─ IF fail again → hiveminder (escalate)
  │     │               └─→ code-skeptic (root cause) → hiveminder
  │     │                     └─→ hivemaker (fix with new context)
  │     │
  │     └─ IF passed → hiveminder (done)
  │
  └─→ code-skeptic (post-implementation review)
        ├─→ hivexplorer (investigation) → code-skeptic
        └─→ hiveminder (report)
              ├─→ hiveq (verify findings)
              └─→ hivemaker (fix critical) → hiveq (verify)
```

**Max iterations:** 3 per fix cycle
**Escalation:** Same slice fails twice → re-plan. >50% parallel failure → stop all.

### 3.2 TDD Loop (Red-Green-Refactor)

```
USER → hiveminder (TDD request)
  │
  ├─→ hitea (RED: write failing tests)
  │     ├─→ hivexplorer (code context) → hitea
  │     └─ GATE: tests must actually fail
  │
  ├─→ hivemaker (GREEN: implement)
  │     ├─→ hivexplorer (implementation context) → hivemaker
  │     └─ GATE: all tests pass + tsc clean
  │
  ├─→ hivemaker (REFACTOR: clean up)
  │     └─ GATE: all tests still pass
  │
  ├─→ hiveq (final verification)
  │     └─ GATE: all must-haves verified
  │
  └─→ hitea (regression tests)
        └─ GATE: no regressions
```

**Phase transitions:** Red→Green (failing output), Green→Refactor (all pass), Refactor→Done (still pass)
**Failure:** Green fails 3x → escalate to code-skeptic → architect → re-implement

### 3.3 Debug Loop

```
USER → hiveminder (bug report)
  │
  └─→ hivehealer (diagnose)
        ├─→ hivexplorer (codebase context) → hivehealer
        │
        ├─ REPRODUCE: Confirm bug is real
        ├─ NARROW: Isolate failing component
        ├─ CONTAIN: Apply smallest safe fix
        ├─ EVIDENCE: Prove fix works
        │
        └─→ hiveq (verify fix) → hivehealer
              │
              ├─ IF passed → hiveminder (done)
              └─ IF failed → hivehealer (re-diagnose)
                    └─ IF 3 attempts fail → hiveminder (blocked)
                          └─ IF design flaw → architect → hivemaker → hiveq
```

### 3.4 Research Loop

```
USER → hiveminder (research question)
  │
  ├─→ hivexplorer (internal codebase) [PARALLEL]
  │     └─ Returns: codebase investigation report
  │
  ├─→ hiverd (external ecosystem) [PARALLEL]
  │     └─ Returns: external research report
  │
  └─→ hiveplanner (synthesize into plan)
        ├─→ hivexplorer (additional context) → hiveplanner
        ├─→ hiverd (additional research) → hiveplanner
        └─ Returns: plan with steps, deps, packets
              └─→ hiveminder (route plan execution)
```

**Parallel rule:** hivexplorer + hiverd are independent (no shared state)

### 3.5 Audit Loop

```
USER → hiveminder (code review request)
  │
  └─→ code-skeptic (review)
        ├─→ hivexplorer (investigation) → code-skeptic
        └─→ hiveminder (report findings)
              ├─ Critical → hivemaker (immediate fix) → hiveq (verify)
              ├─ High → hiveplanner (plan fix) → hivemaker → hiveq
              └─ Medium/Low → track in todo
```

### 3.6 Complex Multi-Phase Loop (via handoff)

```
USER → hiveminder → handoff (complex workflow)
  │
  ├─ Phase 1: PLANNING → hiveplanner
  ├─ Phase 2: DESIGN → architect
  ├─ Phase 3: IMPLEMENTATION → hivemaker (per step)
  ├─ Phase 4: VERIFICATION → hiveq
  ├─ Phase 5: REVIEW → code-skeptic
  │
  └─ GATE between each phase → RETURN to hiveminder
```

---

## 4. Parallel vs Sequential Rules

### Can Dispatch in Parallel

| Pair | Why |
|------|-----|
| hivexplorer + hiverd | Independent: local code vs external docs, no shared state |
| code-skeptic + hiveq | Independent: assumption challenge vs requirement verification, both read-only |
| Multiple hivexplorer | Different directories, no shared mutations |

### Must Be Sequential

| Sequence | Why |
|----------|-----|
| architect → code-skeptic | code-skeptic needs architect's design to challenge |
| hivemaker → hiveq | hiveq verifies hivemaker's implementation |
| hitea → hivemaker (TDD) | Tests must exist before implementation |
| hivexplorer → hiveplanner | hiveplanner uses hivexplorer's findings |

### Depends on Mode

| Pair | TDD Mode | Standard Mode |
|------|----------|---------------|
| hivemaker + hitea | Sequential: hitea → hivemaker | Sequential: hivemaker → hitea |

---

## 5. Escalation Paths

| Source | Trigger | Routes To |
|--------|---------|-----------|
| hiveq | Architectural issue | hiveminder → architect |
| hiveq | Same slice fails 2x | hiveminder → hiveplanner (re-plan) |
| hiveq | >50% parallel failure | hiveminder → stop all → re-plan |
| hivehealer | Design flaw | hiveminder → architect |
| hivehealer | 3 diagnostic failures | hiveminder → code-skeptic |
| code-skeptic | Critical issue | hiveminder → hivemaker (immediate) |
| hivemaker | Architecture decision needed | hiveminder → architect |
| hivemaker | 3 fix attempts fail | hiveminder → hivehealer |
| Any agent | `blocked` return | hiveminder analyzes and re-routes |

---

## 6. Three-Checkpoint System

Every agent validates at 3 points:

### Checkpoint 1: Context Validation (before work)

Core checks (all agents):
- Delegation packet has all required fields
- Scope is bounded and clear
- Prerequisites satisfied
- No forbidden scope (framework assets for implementation agents)

### Checkpoint 2: Execution Validation (during work)

Core checks (all agents):
- Staying within delegated scope
- No analysis paralysis (5+ reads without writes for implementation agents)
- Auto-fix limit not exceeded (3 attempts for hivemaker/hivehealer)
- Terminal agents not delegating

### Checkpoint 3: Output Validation (before return)

Core checks (all agents):
- Evidence bundle present (not just claims)
- Evidence matches expected return schema
- Status accurate (completed only if all fields populated)
- All claims backed by file:line or command output

### Agent-Specific Checkpoint Highlights

| Agent | CP1 Key Check | CP2 Key Check | CP3 Key Check |
|-------|--------------|---------------|---------------|
| hiveminder | Routing correctness | Failure rate <50% | Evidence schema match |
| hivemaker | Target files + design exist | Write activity (not stuck reading) | tsc + test + lint + build pass |
| hiveq | Goal defined, claims available | Three-level verification running | Verdict has evidence, score calculated |
| hivexplorer | Question clear, read-only | Multi-location checks | File:line for every claim |
| hivehealer | Error defined, scope bounded | Diagnosis before fix | Fix resolves error, no regressions |
| hiverd | Question defined | Source hierarchy respected | URLs cited, contradictions noted |
| architect | Problem defined | Trade-offs explicit | Interfaces typed, no implementation code |
| code-skeptic | Scope defined, critique-only | Assumptions extracted | File:line for every claim |
| hitea | Code read, test framework known | Tests can fail (not tautological) | Tests executed, edge cases covered |
| hiveplanner | Goal clear | Dependencies analyzed, steps bounded | Every step has target agent + criteria |
| handoff | Package complete | Phase transitions gated | All phases complete, recovery recorded |

---

## 7. Skill Loading Matrix

### Core Skill (All Agents Load)

`use-hivemind-delegation` — delegation packet structure, routing rules, return contracts

### Per-Agent Skills

| Agent | Skills | When Loaded |
|-------|--------|-------------|
| hiveminder | + hivemind-gatekeeping-delegation, context-intelligence-entry, git-continuity-memory | Multi-iteration loops, session start, resume |
| architect | + course-correction-delegation, clean-architecture, senior-architect | Audit, every design, ADRs |
| code-skeptic | + course-correction-delegation | Audit |
| hiveq | + tdd-delegation, verification-before-completion | TDD verification, every verification |
| hivemaker | + tdd-delegation, clean-code, refactor | TDD, always, refactoring |
| hiveplanner | + writing-plans, breakdown-plan | Plan authoring, task decomposition |
| hivexplorer | + research-delegation, context-map, hivemind-codemap | Multi-source, file discovery, structural analysis |
| hiverd | + research-delegation, hivemind-research-tools | Multi-source, MCP-based research |
| hivehealer | + course-correction-delegation, systematic-debugging, hivemind-system-debug | Complex debug, every debug, detox work |
| hitea | + tdd-delegation, qa-test-planner, test-driven-development | TDD, test plan, test-first |
| handoff | + hivemind-gatekeeping-delegation, git-continuity-memory, hivemind-codemap, context-intelligence-entry, hivemind-atomic-commit, course-correction-delegation | Multi-phase, recovery, mapping, health, commits, cross-domain |

### Loading Anti-Patterns

- NEVER load all skills at start (context bloat)
- NEVER load domain skills in orchestrator (those are for dispatched agents)
- ALWAYS load use-hivemind-delegation first (base for all other delegation skills)
- ALWAYS load use-hivemind-delegation at return (contract compliance)

---

## 8. Tool Access Matrix

### Built-in Tools

| Tool | hiveminder | architect | code-skeptic | hiveq | hivemaker | hiveplanner | hivexplorer | hiverd | hivehealer | hitea | handoff |
|------|-----------|-----------|-------------|-------|-----------|-------------|-------------|--------|------------|-------|---------|
| Read | ✓ (scoped) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| Write | — | ✓ | — | — | ✓ | ✓ | — | — | ✓ | ✓ | ✓ |
| Edit | — | — | — | — | ✓ | ✓ | — | — | ✓ | ✓ | ✓ |
| Bash | limited | limited | limited | limited | full | limited | limited | — | full | full | limited |
| Task | ✓ (all) | 3 agents | 2 agents | 2 agents | 2 agents | 2 agents | — | — | 2 agents | 2 agents | 10 agents |
| Skill | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| TodoRead | ✓ | — | — | — | — | — | — | — | — | — | ✓ |
| TodoWrite | ✓ | — | — | — | — | — | — | — | — | — | ✓ |
| WebFetch | — | ✓ | — | — | — | — | — | ✓ | — | — | ✓ |
| WebSearch | ✓ | — | — | — | — | — | — | ✓ | — | — | ✓ |
| CodeSearch | ✓ | — | — | — | — | — | — | ✓ | — | — | ✓ |

### MCP Tools

| MCP Server | hiveminder | architect | code-skeptic | hiveq | hivemaker | hiveplanner | hivexplorer | hiverd | hivehealer | hitea | handoff |
|-----------|-----------|-----------|-------------|-------|-----------|-------------|-------------|--------|------------|-------|---------|
| gitmcp_* | — | ✓ | — | ✓ | — | ✓ | ✓ | ✓ | — | — | ✓ |
| context7_* | — | ✓ | — | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | ✓ |
| repomix_* | — | — | — | — | — | — | ✓ | — | — | — | ✓ |
| deepwiki_* | — | — | — | — | — | — | — | ✓ | — | — | ✓ |
| brave-search_* | — | — | — | — | — | — | — | ✓ | — | — | ✓ |

### Research Tool Priority

| Priority | Tool | Use For | Agent |
|----------|------|---------|-------|
| 1st | CodeSearch | SDK/API patterns | hivemaker, hivexplorer |
| 1st | Context7 | Library documentation | hivexplorer, hiverd |
| 2nd | WebFetch | Official docs | hiverd, architect |
| 3rd | WebSearch | Ecosystem discovery | hiverd, hiveminder |
| 3rd | Brave Summarizer | Quick overview | hiverd |

---

## 9. Session Dynamics

### Main Session (hiveminder as primary)

- User-facing conversation
- Manages TodoRead/TodoWrite for progress tracking
- Dispatches to subagents via Task tool
- Receives evidence from subagents
- Synthesizes and reports to user

### Sub-Session (any agent as subagent)

- Isolated context (fresh start, no parent conversation)
- Receives delegation packet from parent
- Executes bounded work
- Returns evidence bundle to parent
- Context does NOT persist between sub-sessions (except via git commits)

### Context Flow

```
Main Session (hiveminder)
  │
  ├─ Creates delegation packet (context injection)
  │
  ├─→ Task(agent, prompt_with_packet)
  │     │
  │     └─ Sub-session (isolated)
  │           ├─ Reads packet
  │           ├─ Loads skills
  │           ├─ Executes work
  │           └─ Returns evidence
  │
  ├─ Receives evidence
  ├─ Validates against expected return
  └─ Synthesizes or re-delegates
```

### Long-Haul Session Edge Cases

**Context Compaction:**
- OpenCode triggers compaction at ~80% context
- Critical state preserved via git commits
- Recovery: load git-continuity-memory, find last commit, resume

**Session Interruption:**
- User closes session mid-workflow
- Recovery: git log shows commits as recovery points
- Handoff agent manages resume from last checkpoint

**Permission Conflict:**
- Agent A tries to call Agent B without permission
- Resolution: agent returns `blocked`, hiveminder re-routes

**Scope Drift:**
- Agent discovers work outside scope mid-execution
- Resolution: return `partial` with what's done, hiveminder creates new packet

**Cascading Failure:**
- >50% parallel agents fail
- Resolution: stop all, re-plan decomposition, present to user

---

## 10. Handoff vs Hiveminder Decision

| Scenario | Handler |
|----------|---------|
| Simple delegation (1-2 agents, sequential) | hiveminder |
| Complex workflow (3+ phases, gatekeeper needed) | handoff |
| Cross-domain transitions | handoff |
| Context recovery from git | handoff |
| TDD loop | hiveminder |
| Debug loop | hiveminder |
| Research + synthesis | hiveminder |
| Refactoring across slices | handoff |
| Multi-agent parallel with integration verification | handoff |
