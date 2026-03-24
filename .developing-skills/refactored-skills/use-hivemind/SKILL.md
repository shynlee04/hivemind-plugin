---
name: use-hivemind
description: |
  Master session entry router. Detects lineage (hivefiver vs hiveminder), checks context health, routes to correct domain router. Blocks when context is degraded. Max 3 skills in stack. Every agent session must start here.
---

# use-hivemind

This is the front door to the HiveMind skill ecosystem. Every agent turn — whether a fresh session, a resume after compaction, or a mid-conversation framework reference — must enter through this skill. It performs three critical gatekeeping functions before any work proceeds: lineage detection (who am I and what kind of work is this), context health verification (is the session state trustworthy), and routing (which domain router handles the request). If context is degraded, it blocks all work and delegates recovery. If lineage is ambiguous, it asks one clarifying question. It never implements — it routes only.

## Purpose

- Session entry point for all agent turns
- Lineage detection: hiveminder (orchestrator) vs hivefiver (executor)
- Context health gate before any work proceeds
- Load-3 constraint enforcement (1 entry + 1 domain + 1 depth)
- Routing to correct domain router based on request type

## When to Activate

| Trigger | Example Phrases |
|---------|----------------|
| Session start | "help me", "start working", "continue", "begin" |
| Post-compaction | After `/clear`, context feels unclear, session resumes |
| Framework reference | User mentions "hivemind", "hive", "framework", "skill system" |
| Lineage confusion | "which lineage", "who should do this", "am I building framework or project" |
| Stack confusion | "too many skills", "which skills loaded", "stack overflow" |
| Skill routing | "what skill do I use for X", "route me" |
| Delegation intent | "delegate", "handoff", "send to subagent" |
| Verification gate | "am I done", "verify this", "before merge" |
| Context rot | "lost context", "forgot what I was doing", "context seems wrong" |
| Explicit activation | "use hivemind", "load hivemind framework" |

## Routing Matrix

| Request Type | Route To | Description |
|-------------|----------|-------------|
| Delegation work | `use-hivemind-delegation` | Splitting work across subagents, handoff packets, return contracts |
| Skill creation/audit | `use-hivemind-skill-writer` | Authoring, auditing, or refactoring HiveMind skills |
| Git memory operations | `use-hivemind-git-memory` | Commit-based memory encoding, semantic retrieval, continuity |
| Multi-stage refactor | `use-hivemind-detox-refactor` | Framework refactor, recovery, detox across context and code |
| Research questions | `use-hivemind-research` | Multi-source investigation, evidence grading, synthesis |
| Planning work | `plan-engineering` | Plan lifecycle, phase decomposition, execution tracking |
| Simple questions | Execute inline | Answer directly without routing — no skill loading needed |

**Routing decision:** Match the request intent to the table above. If the request spans multiple categories, pick the primary intent. If ambiguous, ask one clarifying question.

## Load-3 Constraint

The skill stack has a hard maximum of **3 active skills**. Every load must follow this formula:

| Slot | Purpose | Example |
|------|---------|---------|
| 1 — Entry | This skill (`use-hivemind`) | Always loaded first |
| 2 — Domain | Domain router for the request type | `use-hivemind-delegation`, `plan-engineering`, etc. |
| 3 — Depth | Implementation skill within the domain | `tdd-delegation`, `hivemind-atomic-commit`, etc. |

**Enforcement rules:**

- Before loading any skill, count current active skills
- If stack is already at 3 → defer, do not load another skill
- If stack exceeds 3 → stop, ask user to resolve (unload one skill) before proceeding
- This skill itself occupies slot 1 — the remaining 2 slots are for domain + depth

## Lineage Detection

Two lineages exist in the HiveMind ecosystem. Detect which one applies before routing:

| Lineage | Role | Characteristics | Routes To |
|---------|------|-----------------|-----------|
| **Hiveminder** | Orchestrator | Coordinates work, delegates to subagents, never reads deep | Domain routers (`use-hivemind-delegation`, `plan-engineering`, etc.) |
| **Hivefiver** | Executor | Implements bounded work, writes code, produces artifacts | Implementation skills (`tdd-delegation`, `hivemind-atomic-commit`, etc.) |

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
- **Delegate immediately** to `context-intelligence-entry` for recovery
- Report: `blocked` — context degraded, recovery delegated

**If context health passes:**

- Proceed to lineage detection, then routing

## Step-by-Step Protocol

```
0. CHECK STACK     → If ≥3 active skills, DEFER (wait for slot)
1. DETECT          → Is this session start, post-compaction, or framework reference?
2. CONTEXT GATE    → Run context health assessment
3. IF DEGRADED     → Route to `context-intelligence-entry`, STOP
4. IDENTIFY LINEAGE → Hiveminder (orchestrator) or Hivefiver (executor)?
5. CLASSIFY REQUEST → Match to routing matrix
6. LOAD DOMAIN     → Load the domain router (slot 2)
7. EXECUTE         → Domain router handles depth skill loading (slot 3)
```

## Anti-Patterns

| Anti-Pattern | Why It Fails | Correct Behavior |
|-------------|-------------|-----------------|
| Loading >3 skills | Stack budget exceeded, context overload | Enforce load-3, defer excess |
| Skipping entry router | No lineage check, no context gate | Always start here |
| Doing deep reads inline | Orchestrator should not scan code | Delegate to `hivexplorer` or equivalent |
| Implementing in router | Routing ≠ execution | Route to specialist, never implement |
| Loading depth skill without domain | Missing domain context | Always load domain router first |
| Answering "what is hivemind" inline | Bypasses routing | Route to appropriate specialist |
| Loading multiple domain routers | Conflicting routing paths | Pick primary intent, route once |

## Platform Detection

This skill is **platform-agnostic**. It works in OpenCode, Claude Code, Cursor, Gemini CLI, and any agent system that supports skill loading. Platform-specific behaviors (stack budget enforcement, skill loading mechanism) are handled by the platform layer, not by this skill.

| Platform | Stack Budget | Skill Loading |
|----------|-------------|---------------|
| OpenCode | 3 max | `skill` tool |
| Claude Code | 3 max | CLAUDE.md or skill tool |
| Cursor | Platform-defined | Rules system |
| Gemini CLI | Platform-defined | Context system |
| Custom | 3 recommended | Platform-specific |

## Terminal State

- Lineage identified (hiveminder or hivefiver)
- Context health verified (or recovery delegated)
- Domain router loaded (slot 2)
- Ready for depth skill load (slot 3) or inline execution

## No-Load Conditions

Do not load this skill — defer or block — when:

| Condition | Action |
|-----------|--------|
| Stack already at 3 skills | Defer until a slot opens |
| Context health fails | Block, delegate to `context-intelligence-entry` |
| Another entry router is active | Defer to the active router |
| Authority unclear (conflicting SOT) | Escalate before routing |
| Simple question, no routing needed | Answer inline, do not load skills |

## Independence Rules

- Self-contained routing logic — no external dependencies beyond skill names
- No implementation — routes only, never executes work
- No deep reads — context assessment is shallow (session state, not code inspection)
- No mutation — this skill never writes files, modifies state, or commits
