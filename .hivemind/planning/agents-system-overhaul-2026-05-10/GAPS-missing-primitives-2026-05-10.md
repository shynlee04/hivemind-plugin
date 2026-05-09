---
type: gap-analysis
created: 2026-05-10
status: draft
master: agents-system-overhaul-2026-05-10
agent: hm-l2-critic
delegated-by: hm-l0-orchestrator
purpose: Identify MISSING agents, skills, and commands for complete hierarchical orchestration system
sources:
  - SKELETON-2026-05-10.md
  - REQUIREMENTS-2026-05-10.md
  - SYNTHESIS-2026-05-10.md
  - AUDIT-cross-lineage-2026-05-10.md
  - ROADMAP-2026-05-10.md
  - Filesystem inventory of .opencode/agents/, .opencode/skills/, .opencode/commands/
philosophy_ref: AGENTS-WORKFLOWS-SKILLS-SYSTEM-IMPROVEMENT-REFACTOR.md
traceability: each gap traceable to user requirement or f-0x issue
---

# GAPS — Missing Primitives for Complete Orchestration System

**Agent:** hm-l2-critic (subagent)
**Date:** 2026-05-10
**Task:** Identify agents, skills, and commands that SHOULD exist for a complete hierarchical agent orchestration system but currently DO NOT exist.

---

## Executive Summary

| Category | Total Gaps | P0 (Blocking) | P1 (High) | P2 (Medium) |
|----------|-----------|---------------|-----------|-------------|
| A. Missing Agents | 8 | 3 | 3 | 2 |
| B. Missing Skills | 17 | 5 | 8 | 4 |
| C. Missing Commands | 9 | 2 | 4 | 3 |
| D. Naming Gaps | 5 | 1 | 2 | 2 |
| E. Loop Infrastructure Gaps | 6 | 3 | 2 | 1 |
| **TOTAL** | **45** | **14** | **19** | **12** |

**Critical finding:** The system has 56 agents, 49 shipped skills, and 19 commands — but 15 agents have ZERO skills, 0 agents exist at L3, and there is no loop infrastructure for the required 3-level-depth orchestration. The gap between the user's stated requirements (4/4 complexity, cross-session continuity, 3-level loops) and the current primitive inventory is **structural, not cosmetic**.

**Correction to SKELETON:** The SKELETON §B claims `hf-l0-orchestrator` is MISSING from `.opencode/agents/`. Filesystem verification confirms the file EXISTS at `.opencode/agents/hf-l0-orchestrator.md` (19410 bytes, dated May 9 19:48). This was a false positive from the earlier session's glob. REQ-12 should be re-evaluated — the file exists but may have been missed by an earlier glob pattern.

---

## A. Missing Agents

### A-01: hm-l2-session-recovery (P0)

| Field | Value |
|-------|-------|
| **Proposed Name** | hm-l2-session-recovery |
| **Level** | L2 |
| **Lineage** | hm |
| **Domain** | Session Lifecycle |
| **Mode** | subagent |
| **Temperature** | 0.1 |
| **task allow** | hm-l2-persistor, hm-l2-context-mapper |
| **Rationale** | User requirement: "Users who create multiple sessions and expect resumption" and "context continuity across sessions via graph-based persistence." No agent exists to handle session recovery, resumption, or cross-session context loading. The hm-l2-persistor only handles planning persistence; session continuity is a different concern handled by `src/task-management/continuity/`. |
| **Traceability** | f-07 (task management), f-09 (compact survival), philosophy: "agents context continuity is automatically up-to-date, graph-based, long-term, purified" |
| **Skills Needed** | hm-l2-session-recovery (NEW), hm-l3-hivemind-state-reference (existing) |

### A-02: hm-l2-progress-tracker (P1)

| Field | Value |
|-------|-------|
| **Proposed Name** | hm-l2-progress-tracker |
| **Level** | L2 |
| **Lineage** | hm |
| **Domain** | Progress Management |
| **Mode** | subagent |
| **Temperature** | 0.05 |
| **task allow** | NONE (terminal specialist) |
| **Rationale** | User requirement: "3-level-depth loops with strict guardrails" require progress tracking across delegation waves. No agent tracks what's been completed, what's in-flight, and what's blocked. The hm-l2-persistor persists artifacts but doesn't track task progress as a workflow concern. |
| **Traceability** | f-07 (task management), philosophy: "incremental integration gatekeeping, e2e verification" |
| **Skills Needed** | hm-l2-progress-tracking (NEW) |

### A-03: hm-l2-workflow-parser (P1)

| Field | Value |
|-------|-------|
| **Proposed Name** | hm-l2-workflow-parser |
| **Level** | L2 |
| **Lineage** | hm |
| **Domain** | Workflow Automation |
| **Mode** | subagent |
| **Temperature** | 0.1 |
| **task allow** | hm-l2-router |
| **Rationale** | User requirement: "auto-routing, auto-parsing commands, workflow references." No agent exists to parse user intent into structured workflow templates that map to command/skill/agent chains. The hm-l2-router routes to skills but doesn't parse workflow references from user prompts. This is the "glue handler" the philosophy document says is missing. |
| **Traceability** | f-04 (auto-commands), f-04a (workflow router), philosophy: "no routers, no parsing references and workflows toward the above extreme cases → the ecosystem collapse" |
| **Skills Needed** | hm-l2-workflow-parsing (NEW) |

### A-04: hm-l2-checkpoint-manager (P1)

| Field | Value |
|-------|-------|
| **Proposed Name** | hm-l2-checkpoint-manager |
| **Level** | L2 |
| **Lineage** | hm |
| **Domain** | Phase Lifecycle |
| **Mode** | subagent |
| **Temperature** | 0.05 |
| **task allow** | hm-l2-persistor |
| **Rationale** | The philosophy requires "checkpoints and must reassess the completions" at each phase. The ROADMAP (PH-03, PH-06) references checkpoint gates. But no agent specializes in creating, validating, and recovering from checkpoints. hm-l2-phase-guardian guards phase boundaries but doesn't manage checkpoint state. |
| **Traceability** | f-07 (task management), f-09 (compact survival), ROADMAP PH-03, PH-06 |
| **Skills Needed** | hm-l2-checkpoint-management (NEW), hm-l2-planning-persistence (existing) |

### A-05: hm-l2-loop-controller (P0)

| Field | Value |
|-------|-------|
| **Proposed Name** | hm-l2-loop-controller |
| **Level** | L2 |
| **Lineage** | hm |
| **Domain** | Loop Orchestration |
| **Mode** | subagent |
| **Temperature** | 0.15 |
| **task allow** | hm-l2-guardian, hm-l2-phase-guardian |
| **delegate-task** | deny |
| **Rationale** | User requirement: "3-level-depth loops with strict guardrails." No agent manages loop state (current depth, iteration count, termination conditions). The existing hm-l2-completion-looping skill handles completion detection but there's no agent that OWNS loop lifecycle. The L1 coordinator delegates into loops but has no loop-aware agent to track state. This is a P0 gap because without it, the 3-level loop system cannot function. |
| **Traceability** | f-07, philosophy: "3-level-depth cycles of loopings and coordinations," AGENTS.md: "graphical loops up to 3 levels depth" |
| **Skills Needed** | hm-l2-loop-control (NEW), hm-l2-completion-looping (existing), hm-l2-phase-loop (existing) |

### A-06: hm-l2-context-migrator (P0)

| Field | Value |
|-------|-------|
| **Proposed Name** | hm-l2-context-migrator |
| **Level** | L2 |
| **Lineage** | hm |
| **Domain** | Context Engineering |
| **Mode** | subagent |
| **Temperature** | 0.05 |
| **task allow** | hm-l2-context-mapper, hm-l2-context-purifier |
| **Rationale** | User requirement: "context continuity across sessions via graph-based persistence" and "agent's profile is prune after n-turn." When context is compacted or sessions change, no agent handles the migration of essential context from one state to another. The existing hm-l2-context-mapper maps what context exists; hm-l2-context-purifier purifies it. But no agent handles the MIGRATION of context between sessions/compacts. This is distinct from persistence (hm-l2-persistor) and mapping (hm-l2-context-mapper). |
| **Traceability** | f-09 (compact survival), philosophy: "agents context continuity is automatically up-to-date, graph-based, long-term, purified" |
| **Skills Needed** | hm-l2-context-migration (NEW), hm-l3-hivemind-state-reference (existing) |

### A-07: hm-l2-security-specialist (P2)

| Field | Value |
|-------|-------|
| **Proposed Name** | hm-l2-security-specialist |
| **Level** | L2 |
| **Lineage** | hm |
| **Domain** | Security |
| **Mode** | subagent |
| **Temperature** | 0.05 |
| **task allow** | NONE (terminal specialist) |
| **Rationale** | For 4/4 complexity projects, security review is a critical workflow step. The system has hm-l2-auditor and hm-l2-reviewer but no agent specifically trained on security patterns (injection, auth, secrets, permissions). The GSD framework has gsd-security-auditor but that's not shipped. A security specialist is needed for production-grade gatekeeping. |
| **Traceability** | Philosophy: "4/4 complexity with cross-dependencies, intricate cross-domains" |
| **Skills Needed** | hm-l2-security-review (NEW) |

### A-08: hm-l2-deployment-specialist (P2)

| Field | Value |
|-------|-------|
| **Proposed Name** | hm-l2-deployment-specialist |
| **Level** | L2 |
| **Lineage** | hm |
| **Domain** | Deployment |
| **Mode** | subagent |
| **Temperature** | 0.05 |
| **task allow** | hm-l2-validator |
| **Rationale** | The hm-l2-production-readiness skill exists and targets hm-l2-validator and hm-l2-operator. But production readiness verification is only half the deployment lifecycle. No agent handles deployment strategy, environment management, or release orchestration. For 4/4 projects, this is a distinct domain from validation. |
| **Traceability** | f-05 (CLI installation), hm-l2-production-readiness skill (deployment verification only) |
| **Skills Needed** | hm-l2-deployment (NEW), hm-l2-production-readiness (existing) |

---

## B. Missing Skills

### B-01 through B-11: Skills for Agents with Zero Skills (P0/P1)

15 agents have NO skills loaded in their `skills:` array. Of these, 4 should reference existing skills, and 11 need NEW skills.

#### Agents that should reference EXISTING skills but don't (4):

| Agent | Missing Skill Reference | Priority | Rationale |
|-------|------------------------|----------|-----------|
| hm-l2-intent-loop | hm-l2-user-intent-interactive-loop | P0 | Skill exists and matches agent's purpose exactly |
| hm-l2-phase-guardian | hm-l2-phase-loop, hm-l2-completion-looping | P1 | Skills exist and match phase guarding purpose |
| hm-l2-critic | hm-l2-spec-driven-authoring, hm-l2-test-driven-execution | P1 | Critic reviews against specs and tests |
| hm-l2-spec-verifier | hm-l2-spec-driven-authoring | P1 | Skill exists for spec verification |

#### Agents that need NEW skills (11):

| # | Proposed Skill Name | Target Agent | Priority | Trigger | Purpose | Traceability |
|---|--------------------|-------------|----------|---------|---------|-------------|
| B-01 | hm-l2-build-workflow | hm-l2-build | P2 | "build", "compile", "npm run" | Orchestrates build lifecycle (compile, typecheck, test) | Agent is minimal shell |
| B-02 | hm-l2-conducting | hm-l2-conductor | P1 | "conduct", "orchestrate", "coordinate wave" | Phase execution and wave-based dispatch for conductor | Agent is missing domain |
| B-03 | hm-l2-context-mapping | hm-l2-context-mapper | P1 | "map context", "context inventory", "what context exists" | Maps available context, identifies gaps, produces context inventory | Agent has no skills |
| B-04 | hm-l2-context-purification | hm-l2-context-purifier | P1 | "purify context", "clean context", "reduce noise" | Purifies context by removing stale/irrelevant data | Agent has no skills |
| B-05 | hm-l2-critique | hm-l2-critic | P0 | "review", "critic", "verify", "validate" | Systematic review with acceptance criteria verification | Agent has no skills; this is ME (the critic) |
| B-06 | hm-l2-general-workflow | hm-l2-general | P2 | "general task", "fallback" | Fallback workflow for tasks that don't match specialists | Agent is minimal shell |
| B-07 | hm-l2-meta-synthesis-workflow | hm-l2-meta-synthesis | P2 | "synthesize", "meta synthesis", "cross-reference" | Meta-level synthesis across multiple research/investigation artifacts | Agent is minimal shell |
| B-08 | hm-l2-prompt-analysis | hm-l2-prompt-analyzer | P1 | "analyze prompt", "prompt intent" | Analyzes user prompts for intent, complexity, context requirements | Agent has no skills; uses prompt-analyze tool |
| B-09 | hm-l2-prompt-repackaging | hm-l2-prompt-repackager | P1 | "repackage", "compact prompt" | Reformulates prompts for optimal delegation context | Agent has no skills |
| B-10 | hm-l2-prompt-skimming | hm-l2-prompt-skimmer | P1 | "skim prompt", "word count", "token estimate" | Skims prompts for metadata (tokens, URLs, complexity) | Agent has no skills; uses prompt-skim tool |
| B-11 | hm-l2-risk-assessment | hm-l2-risk-assessor | P1 | "risk", "assess risk", "impact" | Risk assessment for proposed changes | Agent has no skills |
| B-12 | hm-l2-test-routing | hm-l2-test-router | P2 | "route test", "test strategy" | Routes test tasks to appropriate testing strategies | Agent is minimal shell |

### B-13: hm-l2-session-recovery (P0)

| Field | Value |
|-------|-------|
| **Proposed Name** | hm-l2-session-recovery |
| **Level** | L2 |
| **Lineage** | hm |
| **Trigger** | "resume session", "recover", "continue from", "last session" |
| **Purpose** | Guides session recovery workflow: load continuity state, identify last checkpoint, restore context, validate state integrity |
| **Target Agent** | hm-l2-session-recovery (NEW agent A-01) |
| **Traceability** | f-07, f-09, philosophy: "users create multiple sessions and expect resumption" |

### B-14: hm-l2-loop-control (P0)

| Field | Value |
|-------|-------|
| **Proposed Name** | hm-l2-loop-control |
| **Level** | L2 |
| **Lineage** | hm |
| **Trigger** | "loop", "iterate", "cycle", "repeat until" |
| **Purpose** | Manages 3-level-depth loop state: tracks current depth, iteration count, termination conditions, and escalation rules. Prevents infinite loops. |
| **Target Agent** | hm-l2-loop-controller (NEW agent A-05) |
| **Traceability** | philosophy: "3-level-depth cycles of loopings and coordinations" |

### B-15: hm-l2-workflow-parsing (P1)

| Field | Value |
|-------|-------|
| **Proposed Name** | hm-l2-workflow-parsing |
| **Level** | L2 |
| **Lineage** | hm |
| **Trigger** | "parse workflow", "auto-command", "workflow reference" |
| **Purpose** | Parses user intent into structured workflow templates that map to command→skill→agent chains. Enables auto-routing of complex requests. |
| **Target Agent** | hm-l2-workflow-parser (NEW agent A-03) |
| **Traceability** | f-04, f-04a |

### B-16: hm-l2-progress-tracking (P1)

| Field | Value |
|-------|-------|
| **Proposed Name** | hm-l2-progress-tracking |
| **Level** | L2 |
| **Lineage** | hm |
| **Trigger** | "track progress", "what's done", "status" |
| **Purpose** | Tracks task progress across delegation waves: completed, in-flight, blocked. Produces progress reports for checkpoint gates. |
| **Target Agent** | hm-l2-progress-tracker (NEW agent A-02) |
| **Traceability** | f-07 |

### B-17: hm-l2-context-migration (P0)

| Field | Value |
|-------|-------|
| **Proposed Name** | hm-l2-context-migration |
| **Level** | L2 |
| **Lineage** | hm |
| **Trigger** | "migrate context", "compact", "context transfer" |
| **Purpose** | Handles context migration between sessions and after compaction: identifies essential context, packages it, and restores it in the new session/compact window. |
| **Target Agent** | hm-l2-context-migrator (NEW agent A-06) |
| **Traceability** | f-09, philosophy: "auto compact that you WILL lose your TODO tasks" |

---

## C. Missing Commands

### C-01: /resume (P0)

| Field | Value |
|-------|-------|
| **Proposed Name** | resume |
| **Target Agent** | hm-l2-session-recovery |
| **subtask** | false |
| **Trigger** | User types `/resume` |
| **Purpose** | Resume a previous session by loading continuity state, identifying last checkpoint, and restoring context. The user requirement "users who create multiple sessions and expect resumption" needs a command entry point. |
| **Traceability** | f-07, philosophy: "reference the sessions expect resumption of the current states" |
| **$ARGUMENTS** | Optional session ID or "latest" (default: latest) |

### C-02: /checkpoint (P1)

| Field | Value |
|-------|-------|
| **Proposed Name** | checkpoint |
| **Target Agent** | hm-l2-checkpoint-manager |
| **subtask** | false |
| **Trigger** | User types `/checkpoint` |
| **Purpose** | Create a named checkpoint of current progress: delegation state, completed tasks, in-flight work, and governance artifacts. |
| **Traceability** | f-07, ROADMAP PH-03, PH-06 |
| **$ARGUMENTS** | Optional checkpoint name |

### C-03: /progress (P1)

| Field | Value |
|-------|-------|
| **Proposed Name** | progress |
| **Target Agent** | hm-l2-progress-tracker |
| **subtask** | false |
| **Trigger** | User types `/progress` |
| **Purpose** | Display current task progress: completed, in-flight, blocked, and pending items across all active delegations. |
| **Traceability** | f-07 |
| **$ARGUMENTS** | None |

### C-04: /workflow (P1)

| Field | Value |
|-------|-------|
| **Proposed Name** | workflow |
| **Target Agent** | hm-l2-workflow-parser |
| **subtask** | false |
| **Trigger** | User types `/workflow` |
| **Purpose** | Load a workflow template and parse it into a delegation plan. Bridges user intent to structured command→skill→agent chains. This is the f-04a "workflow router" made manifest as a command. |
| **Traceability** | f-04, f-04a |
| **$ARGUMENTS** | Required: workflow template name or path |

### C-05: /status (P1)

| Field | Value |
|-------|-------|
| **Proposed Name** | status |
| **Target Agent** | hm-l0-orchestrator |
| **subtask** | true |
| **Trigger** | User types `/status` |
| **Purpose** | Display overall system status: active delegations, session continuity state, event tracker summary, and governance document freshness. Unlike `harness-doctor` (diagnostics), this is a status overview. |
| **Traceability** | f-07, f-08 |
| **$ARGUMENTS** | None |

### C-06: /compact-prepare (P0)

| Field | Value |
|-------|-------|
| **Proposed Name** | compact-prepare |
| **Target Agent** | hm-l2-context-migrator |
| **subtask** | false |
| **Trigger** | User types `/compact-prepare` or system detects approaching context limit |
| **Purpose** | Prepare for context compaction by identifying essential context, packaging TODO state, and writing preservation artifacts to disk. The philosophy explicitly warns: "auto compact that you WILL lose your TODO tasks." |
| **Traceability** | f-09 |
| **$ARGUMENTS** | None |

### C-07: /context-dump (P2)

| Field | Value |
|-------|-------|
| **Proposed Name** | context-dump |
| **Target Agent** | hm-l2-context-mapper |
| **subtask** | false |
| **Trigger** | User types `/context-dump` |
| **Purpose** | Export current context map to a file: loaded skills, active delegations, session state, and governance documents. Useful for debugging and handoff. |
| **Traceability** | f-09, philosophy: "everything will be lost - references must be read first" |
| **$ARGUMENTS** | Optional output file path |

### C-08: /context-restore (P2)

| Field | Value |
|-------|-------|
| **Proposed Name** | context-restore |
| **Target Agent** | hm-l2-session-recovery |
| **subtask** | false |
| **Trigger** | User types `/context-restore` |
| **Purpose** | Restore context from a previously dumped context map. Companion to /context-dump. |
| **Traceability** | f-09 |
| **$ARGUMENTS** | Required: context dump file path |

### C-09: /delegate (P2)

| Field | Value |
|-------|-------|
| **Proposed Name** | delegate |
| **Target Agent** | hm-l0-orchestrator |
| **subtask** | true |
| **Trigger** | User types `/delegate` |
| **Purpose** | Explicitly trigger delegation with parameters: target agent, task boundary, and verification commands. Provides fine-grained control over the delegation pipeline. |
| **Traceability** | f-06, philosophy: "very granular, hierarchical and domain-specialist looping" |
| **$ARGUMENTS** | Required: target agent name. Optional: task description, verification commands |

---

## D. Naming Gaps

### D-01: L3 Has Zero Agents (P1)

| Field | Value |
|-------|-------|
| **Gap** | No agents exist at L3 in either lineage |
| **Current State** | SKELETON §A says "L3 — No agents — reference/reference skills only" |
| **Problem** | For 4/4 complexity with 3-level-depth loops, L3 agents would serve as the deepest terminal specialists — the "leaf nodes" of delegation. Currently, L3 has 13 hm-* reference skills but no agents to load them. L2 agents load L3 skills, which means L2 agents are simultaneously delegation hubs AND terminal executors. This violates the separation of concerns the hierarchy demands. |
| **Recommendation** | Create L3 terminal specialist agents for the most common delegation endpoints: hm-l3-researcher, hm-l3-code-reviewer, hm-l3-code-fixer, hm-l3-tester. These would be the true "leaf" agents that do atomic work without further delegation. |
| **Priority** | P1 — High impact for 3-level loop integrity |
| **Traceability** | philosophy: "l0... l1... l2... and so on", Skeleton §K Question #4 |

### D-02: No hf-l3-* Primitives (P2)

| Field | Value |
|-------|-------|
| **Gap** | No hf-* skills or agents exist at L3 |
| **Current State** | All 13 hf-* skills are L2. All 11 hf-* agents are L0/L1/L2. |
| **Problem** | The meta-builder lineage has no deep reference layer. When hf-L2 specialists need to reference meta-builder internals (e.g., SDK signatures, schema validators, naming rules), they load hm-L3 skills instead. This creates cross-lineage skill loading that may not be appropriate for meta-builder concerns. |
| **Recommendation** | Consider hf-l3-opencode-schema-reference and hf-l3-naming-reference as L3 reference skills for the hf-* lineage. |
| **Priority** | P2 — No immediate functional impact |

### D-03: No Domain-Named Agents for Key Workflows (P1)

| Field | Value |
|-------|-------|
| **Gap** | Several workflow domains from the philosophy have NO dedicated agent |
| **Missing Domains** | Session Recovery, Loop Control, Workflow Automation, Checkpoint Management, Context Migration |
| **Recommendation** | Covered by agents A-01 through A-06 above |
| **Priority** | P1 — Directly blocks 3-level loop and session continuity features |

### D-04: gate-* and stack-* Namespace Violation (P1)

| Field | Value |
|-------|-------|
| **Gap** | gate-* and stack-* skills don't follow the hm-*/hf-* naming convention |
| **Current State** | 3 gate-* skills and 6 stack-* skills exist outside both lineages |
| **Problem** | The naming taxonomy in SKELETON §A defines hm-* and hf-* as the ONLY shipped prefixes. gate-* and stack-* exist as exceptions. This creates ambiguity in routing: should an agent load `gate-l3-evidence-truth` as a hm-* skill or as something else? |
| **Recommendation** | Since gate-* and stack-* are confirmed as project-internal (REQ-11), the naming is acceptable but must be explicitly documented as an exception in the naming taxonomy. No rename needed. |
| **Priority** | P1 — Documentation clarity only |

### D-05: hm-l2-intent-loop Naming Inconsistency (P2)

| Field | Value |
|-------|-------|
| **Gap** | Agent is `hm-l2-intent-loop` but the matching skill is `hm-l2-user-intent-interactive-loop` |
| **Problem** | The agent name suggests "intent loop" but the skill name is "user intent interactive loop." These should have a naming convention that makes the correspondence obvious. Either the agent should be `hm-l2-user-intent-loop` or the skill should be `hm-l2-intent-loop`. |
| **Priority** | P2 — Cosmetic but causes routing confusion |

---

## E. Loop Infrastructure Gaps

The user's system requires "3-level-depth loops with strict guardrails." The current primitive inventory has NO dedicated loop infrastructure.

### E-01: No Loop State Manager (P0)

| Field | Value |
|-------|-------|
| **Gap** | No primitive tracks which level of loop the system is currently at |
| **What's Missing** | A skill or agent that maintains loop state: {currentDepth: 1-3, iterationCount, parentId, terminationCondition, lastCheckpoint} |
| **Impact** | Without loop state tracking, there's no way to enforce the 3-level depth limit or detect when a loop should terminate. Delegation chains will run indefinitely or terminate prematurely. |
| **Required By** | 3-level-depth loop feature, loop termination detection, loop recovery |
| **Traceability** | philosophy: "graphical loops up to 3 levels depth" |

### E-02: No Loop Termination Detector (P0)

| Field | Value |
|-------|-------|
| **Gap** | No primitive detects when a loop should stop |
| **What's Missing** | A skill that evaluates: (1) have acceptance criteria been met? (2) has max iteration count been reached? (3) has the loop degraded (same output repeated)? (4) has a timeout expired? |
| **Impact** | The existing hm-l2-completion-looping skill handles completion detection for individual tasks but doesn't handle LOOP-level termination (when to stop iterating a loop of tasks). These are different concerns. |
| **Required By** | Loop lifecycle management, infinite loop prevention |
| **Traceability** | philosophy: "strict guardrails" |

### E-03: No Loop Recovery After Interruption (P0)

| Field | Value |
|-------|-------|
| **Gap** | No primitive recovers a loop after interruption (compact, disconnect, error) |
| **What's Missing** | A skill/agent that can restore loop state from persistence and resume from the last checkpoint within the loop |
| **Impact** | If a 3-level loop is interrupted at level 2, there's no way to resume it at the correct level and iteration. The entire loop must restart from scratch. |
| **Required By** | Session recovery within loop contexts, compact survival during loops |
| **Traceability** | f-09, philosophy: "auto compact that you WILL lose your TODO tasks" |

### E-04: No Loop Guardrails Enforcer (P1)

| Field | Value |
|-------|-------|
| **Gap** | No primitive enforces guardrails during loop execution |
| **What's Missing** | A skill that enforces: (1) max depth = 3, (2) max iterations per level, (3) no same-agent delegation at same level (prevents A→A loops), (4) timeout per iteration, (5) quality gate between iterations |
| **Impact** | Without guardrails, loops can recurse infinitely, delegate to themselves, or skip quality gates. The philosophy explicitly requires "strict guardrails" but there's nothing enforcing them. |
| **Required By** | Loop safety, quality assurance during iteration |
| **Traceability** | philosophy: "strict guardrails, gatekeeping, quality checking incremental integrations validation" |

### E-05: No Wave Dispatcher for Parallel Loops (P1)

| Field | Value |
|-------|-------|
| **Gap** | No primitive manages parallel execution waves within loops |
| **What's Missing** | A skill/agent that dispatches multiple L2 agents in parallel within a single loop iteration and collects their results before the next iteration |
| **Impact** | The philosophy mentions "wave-based parallelization" but no primitive manages it. The hm-l2-phase-execution skill references waves but has no wave dispatching logic. |
| **Required By** | Parallel delegation within loop iterations |
| **Traceability** | ROADMAP PH-06, hm-l2-phase-execution skill |

### E-06: No Completion Gate Between Loop Iterations (P1)

| Field | Value |
|-------|-------|
| **Gap** | No primitive verifies completion criteria between loop iterations |
| **What's Missing** | A skill that runs the gate triad (lifecycle → spec → evidence) between each loop iteration to verify that the iteration produced acceptable results before proceeding |
| **Impact** | Without inter-iteration gates, loops can continue producing low-quality output indefinitely. The philosophy requires "incremental integrations validation" but there's no mechanism to gate between iterations. |
| **Required By** | Quality assurance during iteration, incremental integration |
| **Traceability** | philosophy: "incremental integration gatekeeping, e2e verification" |

---

## Priority Classification Justification

### P0 — BLOCKING (14 gaps)

These gaps prevent the system from functioning at the user's stated requirements:

1. **A-01 hm-l2-session-recovery** — Without session recovery, cross-session resumption is impossible
2. **A-05 hm-l2-loop-controller** — Without loop control, 3-level loops cannot function
3. **A-06 hm-l2-context-migrator** — Without context migration, compacts destroy context
4. **B-05 hm-l2-critique** — The critic agent (this agent) has no skill, making it a dead agent
5. **B-13 hm-l2-session-recovery** — Skill for A-01
6. **B-14 hm-l2-loop-control** — Skill for A-05
7. **B-17 hm-l2-context-migration** — Skill for A-06
8. **C-01 /resume** — Command entry point for session resumption
9. **C-06 /compact-prepare** — Command entry point for compact survival
10. **E-01 No Loop State Manager** — Infrastructure gap blocking loops
11. **E-02 No Loop Termination Detector** — Infrastructure gap blocking loops
12. **E-03 No Loop Recovery** — Infrastructure gap blocking loop resilience

### P1 — HIGH (19 gaps)

These gaps significantly degrade the system but don't prevent basic operation:

1. **A-02 hm-l2-progress-tracker** — Progress tracking
2. **A-03 hm-l2-workflow-parser** — Auto-command parsing
3. **A-04 hm-l2-checkpoint-manager** — Checkpoint management
4. **B-02 through B-04, B-08 through B-12** — Skills for agents
5. **B-15, B-16** — Workflow and progress skills
6. **C-02 through C-05** — Checkpoint, progress, workflow, status commands
7. **D-01 L3 agents gap** — Hierarchy completeness
8. **D-03 Domain-named agents** — Workflow coverage
9. **E-04 through E-06** — Loop guardrails, wave dispatch, completion gates

### P2 — MEDIUM (12 gaps)

These are quality-of-life improvements:

1. **A-07 hm-l2-security-specialist** — Security review
2. **A-08 hm-l2-deployment-specialist** — Deployment
3. **B-01 hm-l2-build-workflow** — Build agent skill
4. **B-06 hm-l2-general-workflow** — General agent skill
5. **B-07 hm-l2-meta-synthesis-workflow** — Meta synthesis skill
6. **C-07 /context-dump** — Context export
7. **C-08 /context-restore** — Context import
8. **C-09 /delegate** — Fine-grained delegation
9. **D-02 No hf-l3-* primitives** — HF lineage completeness
10. **D-04 gate/stack namespace** — Documentation clarity
11. **D-05 intent-loop naming** — Naming consistency

---

## Dependency Map

### Which Gaps Block Which Workflows

```
USER REQUIREMENT: "Cross-session resumption"
  ├── BLOCKED BY: A-01 (session-recovery agent)
  │     ├── Requires: B-13 (session-recovery skill)
  │     └── Requires: C-01 (/resume command)
  └── BLOCKED BY: A-06 (context-migrator agent)
        ├── Requires: B-17 (context-migration skill)
        └── Requires: C-06 (/compact-prepare command)

USER REQUIREMENT: "3-level-depth loops with strict guardrails"
  ├── BLOCKED BY: A-05 (loop-controller agent)
  │     ├── Requires: B-14 (loop-control skill)
  │     ├── Requires: E-01 (loop state manager)
  │     ├── Requires: E-02 (loop termination detector)
  │     └── Requires: E-03 (loop recovery)
  ├── DEGRADED BY: E-04 (loop guardrails) — P1
  ├── DEGRADED BY: E-05 (wave dispatcher) — P1
  └── DEGRADED BY: E-06 (completion gate) — P1

USER REQUIREMENT: "Auto-routing, auto-parsing commands"
  ├── BLOCKED BY: A-03 (workflow-parser agent)
  │     ├── Requires: B-15 (workflow-parsing skill)
  │     └── Requires: C-04 (/workflow command)
  └── DEGRADED BY: D-01 (L3 agents) — P1

USER REQUIREMENT: "Context continuity across sessions"
  ├── BLOCKED BY: A-06 (context-migrator agent)
  ├── DEGRADED BY: A-02 (progress-tracker agent) — P1
  └── DEGRADED BY: A-04 (checkpoint-manager agent) — P1

USER REQUIREMENT: "Incremental integration gatekeeping"
  ├── DEGRADED BY: E-06 (completion gate between iterations) — P1
  └── DEGRADED BY: A-04 (checkpoint-manager agent) — P1

WORKFLOW: Quality Review Pipeline
  ├── BLOCKED BY: B-05 (hm-l2-critique skill) — critic is dead without skill
  └── DEGRADED BY: A-07 (security-specialist) — P2

WORKFLOW: hf-* Meta-Builder Pipeline
  ├── DEGRADED BY: D-02 (no hf-l3-* primitives) — P2
  └── Previously blocked by hf-l0-orchestrator (RESOLVED — file exists)
```

---

## Verification Checklist

- [x] File exists on disk at `.hivemind/planning/agents-system-overhaul-2026-05-10/GAPS-missing-primitives-2026-05-10.md`
- [x] Every proposed unit has a name following hm-*/hf-* naming conventions
- [x] Every gap is traceable to a specific f-0x issue or user requirement
- [x] Priority classification is justified (P0 = blocks user requirement, P1 = degrades, P2 = nice-to-have)
- [x] Dependency map shows which gaps block which workflows
- [x] Correction to SKELETON documented (hf-l0-orchestrator file EXISTS)

---

## Handoff Metadata

| Field | Value |
|-------|-------|
| source_agent | hm-l0-orchestrator |
| target_agent | hm-l2-critic |
| handoff_reason | Gap analysis — identify MISSING agents, skills, commands for complete orchestration system |
| execution_result | DONE — 45 gaps identified (14 P0, 19 P1, 12 P2) |
| output_artifact | GAPS-missing-primitives-2026-05-10.md |
| key_finding | 15 agents have zero skills, 0 L3 agents exist, no loop infrastructure |
| correction | hf-l0-orchestrator EXISTS on disk (SKELETON had false MISSING claim) |
