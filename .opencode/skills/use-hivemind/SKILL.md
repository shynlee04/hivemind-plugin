---
name: use-hivemind
description: Master session entry router. Detects lineage (orchestrator vs executor), checks context health, routes to correct domain router. Blocks when context is degraded. Loads skill batches dynamically based on plan, workflow, and task context. Every agent session must start here.
---

# use-hivemind

Front door to the HiveMind skill ecosystem. Performs three gatekeeping functions before any work proceeds: context integrity verification, intent classification, and routing. If context is degraded, blocks work and delegates recovery. Never implements — routes only.

---

## HARD-GATE: Context Integrity Gate — EVERY PROMPT

On EVERY user prompt — new session, resume, mid-conversation, or after any interruption — run this gate BEFORE interpreting the prompt or taking ANY action.

### Step 1: Workflow State Check
```bash
ls .hivemind/activity/state/ 2>/dev/null
cat .hivemind/activity/sessions/continuity.json 2>/dev/null
```
- Is there an active workflow? What phase?
- What tasks are pending, active, delegated, verifying?

### Step 2: Orchestration State Check
```bash
ls .hivemind/activity/delegation/ 2>/dev/null
cat .hivemind/activity/delegation/registry.json 2>/dev/null
```
- Are there agents currently dispatched?
- Are there returns waiting for synthesis?
- Are there blocked routes unresolved?

### Step 3: Artifacts and Documents Check
```bash
find .hivemind/activity/ -name "*.json" -mtime -1 2>/dev/null
ls .hivemind/activity/handoff/ 2>/dev/null
```
- Do artifacts from prior turns still exist?
- Do they match what the user is now asking about?

### Step 4: Conversation Context Assessment
- What did the user ask in their LAST prompt?
- Was work in progress that this prompt continues, modifies, or abandons?
- Does this prompt arrive into an existing workflow or start a new one?

### Step 5: Decision
| State Found | Action |
|-------------|--------|
| Active workflow + this prompt continues it | Resume workflow — do NOT start fresh |
| Active workflow + this prompt changes direction | Transition workflow — emit checkpoint, then route |
| Active delegations pending | WAIT for returns before acting on new prompt |
| No active state | Treat as fresh start — route normally |
| Stale/corrupt state | Run context full mode before routing |

**NEVER skip this gate.** An agent that acts without checking context integrity is an agent that has abandoned its role as orchestrator.

---

## HARD-GATE: Intent Classification — Phase 0

Every session begins with explicit intent classification. Never assume intent from prior turns.

### Step 0: Intent Verbalization
> "I detect a **[research / implementation / investigation / evaluation / fix / open-ended]** request — [reason]. My approach: **[explore -> answer / plan -> execute / clarify first / etc.]**."

### Step 1: Classify from Current Message Only

| Intent | Signal Words | Route |
|--------|-------------|-------|
| Research | "explain", "how does", "what is" | Explore -> Answer |
| Implementation | "add", "create", "build", "implement" | Plan -> Execute |
| Investigation | "check", "why", "debug", "failing" | Isolate -> Diagnose |
| Evaluation | "what do you think", "should we", "compare" | Clarify -> Evaluate |
| Fix | "broken", "error", "crash", "regression" | Diagnose -> Fix |
| Open-ended | "refactor", "migrate", "redesign", "rebuild" | Clarify -> Ideate |

### Step 1.5: Turn-Local Intent Reset (MANDATORY)
Re-classify from the current message only. Prior turn context informs but never overrides. Current message wins. Always.

### Step 2: Context-Completion Gate
ALL three must be true before proceeding:
1. User's goal is stated or inferable (can write one-sentence problem statement)
2. Relevant context is available (domain, stack, constraints known)
3. No blocking ambiguity remains (zero unresolved HIGH-IMPACT questions)

If any fails -> ask ONE targeted question. Do not batch questions.

**Full protocol:** `references/intent-classification.md`

---

## Role Detector

Before routing, determine session position:

| Lineage | Role | Routes To |
|---------|------|-----------|
| **Orchestrator** | Coordinates, delegates, never reads deep | Domain routers |
| **Executor** | Implements bounded work, writes code | Implementation skills |

Detection: check session context for explicit role. If unclear, ask: "Are you orchestrating or executing?"

Orchestrator loads domain routers only. Executor loads depth skills within a domain.

**Full protocol:** `references/role-boundaries.md`

---

## Context Rot Defense

5 distrust levels govern how much to trust current context:

| Level | Meaning | Action |
|-------|---------|--------|
| CLEAN | All sources corroborate | Proceed with full confidence |
| SUSPECT | Some docs stale or unverified | Verify critical claims before routing |
| DEGRADED | Multiple sources conflict | Delegate fresh context probe |
| POLLUTED | Stale material everywhere | Quarantine, escalate, block implementation |
| POISONED | Nothing trustworthy | Block all work, require human intervention |

**Rule:** Code wins over docs. Always. Check source first, git second, build output third. Only then check documentation.

**Full protocol:** `references/context-rot-defense.md`

---

## Routing Decision Table

| Request Type | Route To | Description |
|-------------|----------|-------------|
| Delegation work | `use-hivemind-delegation` | Splitting work across subagents, handoff packets |
| Skill creation/audit | `use-hivemind-skill-authoring` | Authoring, auditing, or refactoring skills |
| Git memory operations | `use-hivemind-git-memory` | Commit-based memory encoding, semantic retrieval |
| Research questions | `use-hivemind-research` | Multi-source investigation, evidence grading |
| Planning work | `use-hivemind-planning` | Plan lifecycle, phase decomposition |
| Debug/recovery | `hivemind-system-debug` | Debug delegation, remediation, recovery |
| Architecture decisions | `hivemind-patterns` | Pattern selection, anti-pattern detection |
| Investigation & synthesis | `hivemind-synthesis` | Codebase, sessions, activity analysis |
| Simple questions | Execute inline | Answer directly — no skill loading |

**Routing decision:** Match request intent to table. If ambiguous, ask one clarifying question.

---

## Anti-Patterns Summary

| # | Anti-Pattern | One-Line Fix |
|---|-------------|-------------|
| 1 | Delegating without context gate | Always run Context Integrity Gate first |
| 2 | Accepting "done" without evidence | Demand evidence bundle — no evidence = not done |
| 3 | Reading code yourself as orchestrator | Dispatch investigator swarm, read synthesis only |
| 4 | Over-parallelization with shared state | Sequential when state is shared, parallel only with independence proof |
| 5 | How-to-implement in delegation packet | Specify scope, constraints, success criteria — never exact code |

**Full compendium:** `references/anti-patterns-compendium.md`

---

## Reference Navigation

Load reference files conditionally — only when the specific domain is needed:

| Reference File | Load When | Do NOT Load Alongside |
|---------------|-----------|----------------------|
| `references/intent-classification.md` | Ambiguous intent, multi-intent messages, edge cases | — |
| `references/context-rot-defense.md` | Context feels stale, distrust assessment needed | — |
| `references/role-boundaries.md` | Lineage confusion, delegation threshold decisions | — |
| `references/orchestrator-mandate.md` | Mission clarification, behavioral rules, investigation swarm patterns | — |
| `references/agent-roles.md` | Agent selection, role boundary clarification | — |
| `references/anti-patterns-compendium.md` | Anti-pattern review, error prevention | — |
| `references/verification-before-completion.md` | Completion claims, evidence requirements | — |
| `templates/load-template.md` | Dynamic batch composition, conditional loading | — |

---

## Batch Composition

| Layer | Purpose | When Loaded |
|-------|---------|-------------|
| Entry | Session router | Always first (`use-hivemind`) |
| Domain | Domain router | Task enters domain |
| Depth | Implementation skills | Methodology needed |

Rules: Entry first, always. Domain when task enters a domain. Depth based on methodology demands. Drop irrelevant skills.

---

## Terminal State

- Context integrity verified (or recovery delegated)
- Intent classified (or ambiguity resolved)
- Lineage identified (orchestrator or executor)
- Domain skill loaded for current phase
- Ready for dispatch
