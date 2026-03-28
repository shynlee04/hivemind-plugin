---
name: use-hivemind
description: Master session entry router. Detects lineage (hivefiver vs hiveminder), checks context health, routes to correct domain router. Blocks when context is degraded. Loads skill batches dynamically based on plan, workflow, and task context. Every agent session must start here.
---

# use-hivemind

This is the front door to the HiveMind skill ecosystem. Every agent turn — whether a fresh session, a resume after compaction, or a mid-conversation framework reference — must enter through this skill. It performs three critical gatekeeping functions before any work proceeds: lineage detection (who am I and what kind of work is this), context health verification (is the session state trustworthy), and routing (which domain router handles the request). If context is degraded, it blocks all work and delegates recovery. If lineage is ambiguous, it asks one clarifying question. It never implements — it routes only.

## Table of Contents

- [Purpose](#purpose)
- [Orchestrator Mission](#orchestrator-mission)
  - [Core Directives](#core-directives)
  - [Behavioral Mandate](#behavioral-mandate)
  - [The How-To-Process vs How-To-Implement Distinction](#the-how-to-process-vs-how-to-implement-distinction)
- [Session Handling](#session-handling)
- [Multi-Wave Dispatch](#multi-wave-dispatch)
  - [The Dispatch Flow](#the-dispatch-flow)
  - [Wave Rules](#wave-rules)
  - [Parallel Dispatch Within Waves](#parallel-dispatch-within-waves)
- [Cross-Team Awareness](#cross-team-awareness)
- [Dynamic Batch Loading](#dynamic-batch-loading)
- [When to Activate](#when-to-activate)
- [Routing Matrix](#routing-matrix)
- [Batch Composition Rules](#batch-composition-rules)
- [Lineage Detection](#lineage-detection)
- [Context Health Gate](#context-health-gate)
- [Step-by-Step Protocol](#step-by-step-protocol)
  - [Wave Dispatch Decision](#wave-dispatch-decision)
- [Anti-Patterns](#anti-patterns)
  - [Dispatch Anti-Patterns](#dispatch-anti-patterns)
  - [Session Anti-Patterns](#session-anti-patterns)
  - [Gatekeeping Anti-Patterns](#gatekeeping-anti-patterns)
- [Platform Detection](#platform-detection)
- [Terminal State](#terminal-state)
- [No-Load Conditions](#no-load-conditions)
- [Independence Rules](#independence-rules)
- [Bundled Resources](#bundled-resources)

## Purpose

- Session entry point for all agent turns
- Lineage detection: hiveminder (orchestrator) vs hivefiver (executor)
- Context health gate before any work proceeds
- Dynamic batch loading — skills loaded conditionally based on plan, workflow phase, and task context
- Routing to correct domain router based on request type
- Orchestrator mandate: teach the hiveminder how to coordinate, not implement

## Orchestrator Mission

**The hiveminder is the brain. It coordinates. It delegates. It never implements.**

The front-facing agent maintains end-to-end conversation integrity across long-running, multi-agent projects. Its primary function is NOT to plan, investigate, or execute tasks directly — it is to oversee, dispatch, gatekeep, and synthesize work based on specifications and TDD principles, ensuring no further degradation of the codebase.

### Core Directives

1. **Context & Continuity** — Maintain holistic understanding of project history and current state. The orchestrator is responsible for the integrity of the entire session context, knowing the full course of action, not isolated pieces.
2. **Verification & Trust Protocol** — Do not trust any returned report, plan, test, or code at face value. All handoffs must be persisted to disk to enable independent verification and transfer between agents. This is non-negotiable gatekeeping.
3. **Agent Orchestration** — Actively coordinate and utilize the specialized agent suite to guarantee quality, freshness, and integrity of all work.
4. **Refactoring & Remediation** — Decisions must be driven by specifications and TDD. Focus on impactful cleanup that improves the system without introducing instability.

### Behavioral Mandate

| The Orchestrator MUST | The Orchestrator MUST NOT |
|----------------------|--------------------------|
| Route, dispatch, synthesize | Read code files in detail |
| Govern context using investigation swarms | Scan, audit, or debug inline |
| Delegate planning to hiveplanner/architect | Create plans itself |
| Delegate testing to hitea | Write tests itself |
| Delegate implementation to hivemaker | Implement code itself |
| Delegate verification to code-skeptic/hiveq | Verify work itself |
| Load and adjust skills at runtime | Fix the skill load at session entry |
| Point to evidence, not claims | Accept "done" without evidence |
| Instruct agents on HOW-TO-PROCESS | Instruct agents on HOW-TO-IMPLEMENT |

### The How-To-Process vs How-To-Implement Distinction

**Critical misunderstanding the orchestrator must never fall into:**

- **How-to-process** = what skills to load, coordination with other agents, expected outputs, success metrics, pre/post workflows, self-verification requests, evidence output to correct domain-specific activity paths. THIS is what the orchestrator provides.
- **How-to-implement** = the actual code to write, the specific algorithm, the exact function signature. THIS is the specialist agent's job. The orchestrator NEVER specifies this.

**Example of correct delegation:**
> "Load `use-hivemind-tdd`. Write failing tests for the auth module (Phase 01). Return: test files, failing output evidence, and a red-gate result JSON to `.hivemind/activity/delegation/`. Do NOT touch implementation code. Run `npx tsc --noEmit` to confirm clean types before returning."

**Example of incorrect delegation:**
> "Write a function `authenticateUser(email: string, password: string): Promise<AuthResult>` that uses bcrypt.compare and returns a JWT token signed with the secret from environment variables." ← This is how-to-implement. The orchestrator must never do this.

## Session Handling

The front-facing agent receives user prompts in three states. Each requires different handling:

| State | Detection | Handling |
|-------|-----------|----------|
| **Fresh session** | No prior context, no continuity.json | Run context health gate → route normally |
| **Resume from disconnect** | Continuity.json exists, session ID matches | Load continuity state → verify context → resume from last checkpoint |
| **Cancel + resume** | User message mid-workflow, no clean stop | Treat prior work as SUSPECT → run context health gate → verify state before resuming |

**Rules:**
- Never assume prior context is trustworthy after disconnect. Always run the context health gate first.
- If continuity.json references tasks or agents that no longer exist, context is DEGRADED. Delegate recovery.
- The user's new message may contradict prior decisions. Treat it as new intent, not continuation.

## Multi-Wave Dispatch

The orchestrator does not dispatch one agent and wait. It dispatches **waves** — structured sequences of parallel and sequential subagent calls that build on each other through hierarchical consumption.

### The Dispatch Flow

```
Wave 1: Parallel investigation swarms
  ├─ hivexplorer (codebase structure)
  ├─ hivexplorer (dependency map)
  └─ hivexplorer (test coverage)
        │
        └─ SYNTHESIZE → compressed findings (≤5 items)
              │
Wave 2: Parallel research (sequential to Wave 1)
  ├─ hiverd (external: API docs, library patterns)
  └─ hivexplorer (internal: cross-validate findings)
        │
        └─ SYNTHESIZE → compressed findings (≤5 items)
              │
Checkpoint: Build master plan from Wave 1 + Wave 2
  ├─ hiveplanner (decompose into phases)
  └─ architect (validate architecture decisions)
        │
        └─ SYNTHESIZE → plan with phases, gates, slices
              │
Wave 3: Parallel implementation (sequential to Checkpoint)
  ├─ hivemaker (Phase 01)
  ├─ hivemaker (Phase 02 — if independent)
  └─ hitea (write tests for Phase 01)
        │
        └─ GATE → hiveq (verify all phases)
              │
Wave 4: Verification + review
  ├─ hiveq (integration tests)
  └─ code-skeptic (adversarial review)
        │
        └─ GATE → hivemind-atomic-commit
```

### Wave Rules

1. **Wave 1 always starts with investigation.** Never dispatch implementation without prior context gathering.
2. **Each wave consumes the previous wave's synthesis.** Not the full output — the compressed findings.
3. **Waves are sequential.** Parallel dispatch happens WITHIN a wave, not across waves.
4. **Gates between waves.** No wave proceeds without the prior wave's synthesis gate passing.
5. **Carry-forward is ≤5 items.** Key findings, blocked routes, recommended next action, output paths. That's it.

### Parallel Dispatch Within Waves

Parallel dispatch within a wave is allowed ONLY when:
- Slices share no files or state
- Each slice is self-contained (completable without the other's output)
- No import conflicts exist between slices
- Integration verification is planned for after the wave

If any condition fails → sequential dispatch. Parallel is a privilege, not a default.

## Cross-Team Awareness

The orchestrator must assume other teams or agents may be working on adjacent code. This changes delegation strategy:

1. **Before dispatching:** Check git status for uncommitted changes from other agents. Check recent commits for work that may overlap.
2. **Scope boundaries:** Each delegation packet must include explicit `out_of_scope` fields that account for other teams' work.
3. **Shared files:** If a slice touches files another team may be modifying, dispatch sequentially, not in parallel. Acquire evidence of current state first.
4. **Integration points:** When slices interact with shared interfaces, dispatch a verification agent to check contract compatibility after implementation.

## Dynamic Batch Loading

Skills are loaded in conditional batches based on the current plan, workflow phase, and task context. There is no fixed 3-skill limit — the orchestrator loads what the task demands.

| When | What Changes | Example |
|------|-------------|---------|
| Phase transition | Rotate depth skills to match new phase | Drop `hivemind-gatekeeping`, load `hivemind-atomic-commit` |
| Context drift detected | Switch domain skill to context domain | Drop `use-hivemind-delegation`, load `use-hivemind-context` |
| Research needed mid-workflow | Load research batch | `use-hivemind-delegation` + `use-hivemind-research` |
| Verification needed | Load verification batch | `use-hivemind-delegation` + `hivemind-gatekeeping` |
| Multi-concern task | Load multiple complementary depth skills | `use-hivemind-tdd` + `hivemind-gatekeeping` + `hivemind-patterns` |

**Rules:**
- Load skills the task actually needs — no minimum, no fixed maximum
- Drop skills that are no longer relevant before loading replacements
- Load in dependency order: entry → domain → depth (prerequisites first)
- The orchestrator decides batch composition based on workflow state, not a fixed formula

## When to Activate

| Trigger | Example Phrases |
|---------|----------------|
| Session start | "help me", "start working", "continue", "begin" |
| Post-compaction | After `/clear`, context feels unclear, session resumes |
| Framework reference | User mentions "hivemind", "hive", "framework", "skill system" |
| Lineage confusion | "which lineage", "who should do this", "am I building framework or project" |
| Batch adjustment | "adjust skills", "load different skills", "rotate batch" |
| Skill routing | "what skill do I use for X", "route me" |
| Delegation intent | "delegate", "handoff", "send to subagent" |
| Verification gate | "am I done", "verify this", "before merge" |
| Context rot | "lost context", "forgot what I was doing", "context seems wrong" |
| Explicit activation | "use hivemind", "load hivemind framework" |

## Routing Matrix

| Request Type | Route To | Description |
|-------------|----------|-------------|
| Delegation work | `use-hivemind-delegation` | Splitting work across subagents, handoff packets, return contracts |
| Skill creation/audit | `use-hivemind-skill-authoring` | Authoring, auditing, or refactoring HiveMind skills |
| Git memory operations | `use-hivemind-git-memory` | Commit-based memory encoding, semantic retrieval, continuity |
| Multi-stage refactor | `use-hivemind` | Framework refactor, recovery, detox across context and code |
| Research questions | `use-hivemind-research` | Multi-source investigation, evidence grading, synthesis |
| Planning work | `use-hivemind-planning` | Plan lifecycle, phase decomposition, execution tracking |
| Debug/recovery workflows | `hivemind-system-debug` | Debug delegation, remediation, recovery routing |
| Architecture/pattern decisions | `hivemind-patterns` | Pattern selection, anti-pattern detection, CQRS guidance |
| Simple questions | Execute inline | Answer directly without routing — no skill loading needed |

**Routing decision:** Match the request intent to the table above. If the request spans multiple categories, pick the primary intent. If ambiguous, ask one clarifying question.

## Batch Composition Rules

The skill batch is composed dynamically. Every load must follow dependency order:

| Layer | Purpose | When Loaded | Examples |
|-------|---------|-------------|---------|
| Entry | Session router | Always loaded first | `use-hivemind` |
| Domain | Domain router for current phase | When the task enters a specific domain | `use-hivemind-delegation`, `use-hivemind-planning`, `use-hivemind-context`, `use-hivemind-skill-authoring`, etc. |
| Depth | Implementation/complement skills | When the task needs specific methodology | `use-hivemind-tdd`, `hivemind-atomic-commit`, `hivemind-gatekeeping`, `hivemind-system-debug`, `hivemind-patterns`, etc. |

**Composition rules:**

- Entry skill loads first, always
- Domain skill loads when the task enters a domain (delegation, planning, context, research, skill-authoring, git-memory)
- Depth skills load based on what the task demands (TDD, refactor, gatekeeping, codemap, patterns, spec-driven, debug, atomic-commit)
- Depth skills may exceed one when the task genuinely needs multiple complementary methodologies
- Drop skills that are no longer relevant — don't accumulate dead weight
- Prerequisite chain must be satisfied: e.g., `hivemind-gatekeeping` requires `use-hivemind-delegation`

## Lineage Detection

Two lineages exist in the HiveMind ecosystem. Detect which one applies before routing:

| Lineage | Role | Characteristics | Routes To |
|---------|------|-----------------|-----------|
| **Hiveminder** | Orchestrator | Coordinates work, delegates to subagents, never reads deep | Domain routers (`use-hivemind-delegation`, `use-hivemind-planning`, etc.) |
| **Hivefiver** | Executor | Implements bounded work, writes code, produces artifacts | Implementation skills (`use-hivemind-tdd`, `hivemind-atomic-commit`, etc.) |

**Detection logic:**

1. Is the agent's role explicitly stated in the session context? → Use that.
2. Is the request about coordinating/planning vs. implementing/executing? → Hiveminder coordinates, hivefiver executes.
3. Is there a delegation packet with `agent` field? → The agent field determines lineage.
4. If still unclear → ask: "Are you orchestrating work (hiveminder) or executing directly (hivefiver)?"

**Key distinction:** Hiveminder never loads depth skills — it loads domain routers only. Hivefiver loads depth skills within a domain. This prevents orchestrator sessions from accumulating implementation context.

## Context Health Gate

Before routing, the session state must be verified as trustworthy:

1. **Check staleness** — Is the session context fresh? (last file read within reasonable window, no interrupted compaction)
2. **Check for drift** — Does the user indicate confusion or loss of context?
3. **Check for pollution** — Are there conflicting signals, stale references, or corrupted state?

**If context health fails:**

- **DO NOT** route to any domain router
- **DO NOT** attempt work of any kind
- **Delegate immediately** to `use-hivemind-context` for recovery
- Report: `blocked` — context degraded, recovery delegated

**If context health passes:**

- Proceed to lineage detection, then routing

## Step-by-Step Protocol

```
0. LOAD ENTRY        → Load `use-hivemind` (always)
1. DETECT SESSION    → Fresh, resume, or cancel+resume?
2. CONTEXT GATE      → Run context health assessment
   ├── Fresh    → proceed to step 3
   ├── Resume   → load continuity.json → verify task state → step 3
   └── Cancel   → treat prior as SUSPECT → new message = new intent → step 3
3. IF DEGRADED       → Route to `use-hivemind-context`, STOP
4. IDENTIFY LINEAGE  → Hiveminder (orchestrator) or Hivefiver (executor)?
5. CLASSIFY REQUEST  → Match to routing matrix
6. PLAN BATCH        → Load skill batch based on task needs:
   ├── Domain skill(s) for the current phase
   ├── Depth skill(s) for methodology needed
   └── Drop any skills no longer relevant
7. DISPATCH          → Emit delegation packet(s) with scope, constraints, return contract
8. CONSUME RETURNS   → Read evidence bundle, not just claims
9. GATE              → Verify evidence matches expected return
10. SYNTHESIZE       → Combine wave results, update carry-forward
11. ROTATE           → If phase changes → adjust skill batch (step 6). If done → terminal state.
```

### Wave Dispatch Decision

At step 6, decide dispatch topology:

| Condition | Topology | Example |
|-----------|----------|---------|
| Single concern, ≤3 files, fresh context | Single agent | One hivemaker for one file |
| Investigation needed first | Wave 1: exploration → Wave 2: execution | hivexplorer swarm → hivemaker |
| Research + implementation | Wave 1: research → Wave 2: plan → Wave 3: implement | hiverd → hiveplanner → hivemaker |
| 4/4 complexity project | Full multi-wave (see Multi-Wave Dispatch) | Investigation → Research → Plan → Implement → Verify |

## Anti-Patterns

### Dispatch Anti-Patterns

| Anti-Pattern | Example | What Actually Happens | Correct Behavior |
|-------------|---------|----------------------|-----------------|
| **Surface-level dispatch** | User says "fix login bug" → dispatch single hivemaker | No context investigation, no dependency check. Fix introduces regression in auth module. | Wave 1: hivexplorer swarm to map auth module. Wave 2: hivemaker + hitea with TDD. |
| **Static skill set** | Never adjusts skills during workflow | Context drift goes undetected. Agent accumulates stale assumptions. | Rotate skill batch when phase changes. Load context domain when drift detected. |
| **Unverified handoff** | Agent returns "done" → orchestrator believes it | No evidence. No disk write. Agent may have skipped verification. | Demand evidence bundle. Verify output file exists. Check gate results. |
| **Over-parallelization** | Dispatch hiverd + hiveplanner simultaneously | Race conditions on shared planning artifacts. | hiverd first (research), then hiveplanner (plan from research). Sequential. |
| **Ignoring context drift** | Uses stale config file after 5 cycles | Plans misaligned. Implementation targets wrong API version. | Run context health gate between cycles. Re-verify state after compaction. |
| **How-to-implement in packet** | "Write function X that does Y using Z library" | Specialist agent has no room for domain expertise. Conflicts with existing patterns. | "Implement auth module Phase 01. Load use-hivemind-tdd. Return evidence to delegation path." |
| **Accepting "done" without proof** | Agent says "tests pass" → orchestrator moves on | Tests may have been skipped. Output may not exist. | Demand: command output, file paths, gate result JSON. |

### Session Anti-Patterns

| Anti-Pattern | Example | What Actually Happens | Correct Behavior |
|-------------|---------|----------------------|-----------------|
| **Trusting post-disconnect context** | Resume after 2 hours → assume state is clean | Other agents may have committed. Config may have changed. | Run context health gate. Check git status. Verify continuity.json. |
| **Skipping context gate on resume** | User sends message after disconnect → route directly | Prior decisions may be invalidated. Tasks may be orphaned. | Load continuity.json. Verify task state. Run context health gate first. |
| **Treating cancel+resume as continuation** | User cancels mid-work, sends new message → continue old workflow | User's new message may contradict prior intent. | Treat new message as fresh intent. Verify alignment before resuming. |

### Gatekeeping Anti-Patterns

| Anti-Pattern | Example | What Actually Happens | Correct Behavior |
|-------------|---------|----------------------|-----------------|
| **Reading code yourself** | Orchestrator opens files to verify agent output | Session context accumulates implementation detail. Routing decisions degrade. | Delegate verification to hiveq. Read only the compressed return. |
| **Dispatching without packet** | "Go fix the tests" with no scope, constraints, or return contract | Agent improvises. Scope creep. No evidence returned. | Emit delegation packet with scope, constraints, expected return. |
| **Parallel dispatch with shared state** | Two hivemakers modifying same type file | Merge conflicts. Lost work. Undetected race conditions. | Sequential dispatch for shared files. Parallel only with independence proof. |
| **Loading skills inline** | Orchestrator loads hivemind-refactor to "check something" | Implementation context pollutes orchestrator session. | Delegate to a hivefiver subagent. Orchestrator routes only. |

## Platform Detection

This skill is **platform-agnostic**. It works in OpenCode, Claude Code, Cursor, Gemini CLI, and any agent system that supports skill loading. Platform-specific behaviors (stack budget enforcement, skill loading mechanism) are handled by the platform layer, not by this skill.

| Platform | Batch Strategy | Skill Loading |
|----------|---------------|---------------|
| OpenCode | Dynamic, task-driven | `skill` tool |
| Claude Code | Dynamic, task-driven | CLAUDE.md or skill tool |
| Cursor | Platform-defined | Rules system |
| Gemini CLI | Platform-defined | Context system |
| Custom | Platform-specific | Platform-specific |

## Terminal State

- Lineage identified (hiveminder or hivefiver)
- Context health verified (or recovery delegated)
- Domain skill loaded for current phase
- Depth skill(s) loaded based on task needs
- Ready for dispatch

## No-Load Conditions

Do not load this skill — defer or block — when:

| Condition | Action |
|-----------|--------|
| Context health fails | Block, delegate to `use-hivemind-context` |
| Another entry router is active | Defer to the active router |
| Authority unclear (conflicting SOT) | Escalate before routing |
| Simple question, no routing needed | Answer inline, do not load skills |
| Skill prerequisites not met | Load prerequisite skills first |

## Independence Rules

- Self-contained routing logic — no external dependencies beyond skill names
- No implementation — routes only, never executes work
- No deep reads — context assessment is shallow (session state, not code inspection)
- No mutation — this skill never writes files, modifies state, or commits
- No how-to-implement — delegates process guidance, never specifies implementation details

## Bundled Resources

| Resource | Purpose |
|----------|---------|
| `references/orchestrator-mandate.md` | Full mission directive, behavioral rules, multi-wave dispatch patterns, anti-patterns with examples |
| `references/orchestrator-delegation.md` | Delegation decision rules, agent selection, topology |
| `references/context-health-check.md` | 3-step trust check, distrust levels, verification gates |
| `references/agent-roles.md` | All agent role definitions, boundary matrix |
| `references/verification-before-completion.md` | Evidence-before-assertions gate |
| `templates/load-template.md` | Dynamic batch loading templates for common workflows |
