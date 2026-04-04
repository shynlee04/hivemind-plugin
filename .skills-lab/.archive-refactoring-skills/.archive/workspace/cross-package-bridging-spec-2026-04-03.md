# Cross-Package Bridging Spec — Meta-Builder Harness

**Date:** 2026-04-03
**Status:** DRAFT — awaiting integration validation
**Authority:** Integration blueprint for all skill packs in the meta-builder harness
**Location:** `.skills-lab/refactoring-skills/workspace/cross-package-bridging-spec-2026-04-03.md`

---

## Table of Contents

1. [Overview](#1-overview)
2. [Skill Pack Inventory](#2-skill-pack-inventory)
3. [Dependency Graph](#3-dependency-graph)
4. [Shared Conventions](#4-shared-conventions)
5. [Cross-Reference Matrix](#5-cross-reference-matrix)
6. [State Sharing Protocol](#6-state-sharing-protocol)
7. [Stacking Rules](#7-stacking-rules)
8. [Handoff Protocol](#8-handoff-protocol)
9. [Conflict Detection](#9-conflict-detection)
10. [HiveMind v3 Alignment](#10-hivemind-v3-alignment)
11. [OpenCode Concept Mapping](#11-opencode-concept-mapping)
12. [Integration Test Scenarios](#12-integration-test-scenarios)
13. [Next Milestones](#13-next-milestones)

---

## 1. Overview

### What the Meta-Builder Harness Is

The meta-builder harness is a system of four completed skill packs that work together to enable an Agent to build, coordinate, plan, and execute complex multi-session development work. It is not a single skill — it is a **composition of skills** that share conventions, state files, and handoff protocols.

The four packs form two layers:

| Layer | Packs | Purpose |
|-------|-------|---------|
| **Foundation** | `use-authoring-skills` | Meta-skill for creating, auditing, and improving all other skills |
| **Execution** | `user-intent-interactive-loop`, `coordinating-loop`, `planning-with-files` | User engagement, multi-agent orchestration, filesystem-based planning |

### Why Bridging Matters

Without explicit bridging, skill packs drift into:
- **Scope overlap** — two skills claim the same trigger phrases
- **Contradictory instructions** — one skill says "always X", another says "never X"
- **State corruption** — multiple skills writing to the same file with different formats
- **Orphaned context** — handoffs that lose critical information between skills

This spec prevents all four by defining: what each pack owns, how they reference each other, how state flows between them, and which combinations are valid.

### Design Principles (from `essentials.md`)

1. **Framework Integrity** — single core framework, no conflicts
2. **Progressive Disclosure** — breadth first, depth on demand
3. **Readiness and Depth** — TDD, spec-driven, orchestrator-ready
4. **Deterministic Design** — platform-agnostic, context-intelligent
5. **Meta-Framework Awareness** — hierarchical access, reusable scripts
6. **Tone & Language** — logical, schematic, professional
7. **Concision vs. Completeness** — progressive disclosure, never omit specificity

---

## 2. Skill Pack Inventory

### Completed Packs (4)

| Pack | Location | Files | Lines | SKILL.md | Refs | Scripts | Templates | Hooks | Pattern |
|------|----------|-------|-------|----------|------|---------|-----------|-------|---------|
| `use-authoring-skills` | `.opencode/skills/use-authoring-skills/` | 24 | ~5,067 | 337 | 12 | 4 | 4 | 3 | P1 (Routing) |
| `user-intent-interactive-loop` | `.opencode/skills/user-intent-interactive-loop/` | 5 | 1,433 | 245 | 4 | 0 | 0 | 0 | P2 (Domain) |
| `coordinating-loop` | `.opencode/skills/coordinating-loop/` | 7 | 1,207 | 173 | 4 | 2 | 0 | 0 | P1 (Routing) |
| `planning-with-files` | `.opencode/skills/planning-with-files/` | 11 | 1,805 | 275 | 4 | 3 | 3 | 0 | P2 (Domain) |
| **TOTAL** | | **47** | **~9,512** | **1,030** | **24** | **9** | **7** | **3** | |

### Reference File Detail

#### use-authoring-skills (12 refs)
| File | Purpose |
|------|---------|
| `references/01-skill-anatomy.md` | Directory structure, naming, version policy |
| `references/02-frontmatter-standard.md` | Field schema, validation, examples |
| `references/03-three-patterns.md` | P1/P2/P3 architecture patterns |
| `references/04-tdd-workflow.md` | RED-GREEN-REFACTOR for skills |
| `references/05-skill-quality-matrix.md` | 5-dimension scoring rubric |
| `references/06-cross-platform-activation.md` | Platform compatibility patterns |
| `references/07-iterative-refinement.md` | Iteration loop, worked examples |
| `references/08-conflict-detection.md` | Overlap types, detection protocol |
| `references/09-script-authoring.md` | Writing bundled scripts |
| `references/10-eval-lifecycle.md` | Eval-driven skill development |
| `references/11-description-optimization.md` | Trigger accuracy optimization |
| `references/12-anti-deception.md` | Gatekeeping and refusal intelligence |

#### user-intent-interactive-loop (4 refs)
| File | Purpose |
|------|---------|
| `references/01-question-protocols.md` | Question types, sequencing, stop conditions |
| `references/02-context-preservation.md` | Persistence, recovery, compaction |
| `references/03-brainstorming-patterns.md` | Divergence/convergence, option generation |
| `references/04-long-session-management.md` | Budget management, checkpoint strategy |

#### coordinating-loop (4 refs + 2 scripts)
| File | Purpose |
|------|---------|
| `references/01-handoff-protocols.md` | Context transfer between agents |
| `references/02-sequential-vs-parallel.md` | Execution mode decision framework |
| `references/03-parent-child-cycles.md` | Nested agent lifecycle management |
| `references/04-ralph-loop-integration.md` | Scripting patterns, hooks, automation |
| `scripts/coordination-check.sh` | Validates coordination state and gates |
| `scripts/loop-status.sh` | Reports current loop phase and progress |

#### planning-with-files (4 refs + 3 scripts + 3 templates)
| File | Purpose |
|------|---------|
| `references/01-file-structure.md` | Full schema for planning files |
| `references/02-session-lifecycle.md` | Session recovery, compaction, restart |
| `references/03-goal-refresh.md` | Goal-refresh mechanism |
| `references/04-cross-platform-hooks.md` | Platform-specific hook configurations |
| `scripts/init-session.sh` | Creates all three planning files |
| `scripts/check-complete.sh` | Verifies all phases complete |
| `scripts/session-catchup.py` | Recovers state from git history |
| `templates/task_plan.md` | Phase tracking template |
| `templates/findings.md` | Research storage template |
| `templates/progress.md` | Session logging template |

### Not Yet Built

| Pack | Group | Priority | Status |
|------|-------|----------|--------|
| `use-authoring-commands` | GROUP 2 | Medium | Not started |
| `use-authoring-agents` | GROUP 2 | Medium | Not started |
| `use-authoring-tools` | GROUP 2 | Medium | Not started |
| `use-authoring-workflows` | GROUP 2 | Low | Not started |
| `tech-to-feature-synthesis` | GROUP 1 | High | Not started |
| `deep-investigation` | GROUP 1 | High | Not started |
| Meta-builder parent skill | Orchestrator | High | Not started |

---

## 3. Dependency Graph

### Visual Dependency Map

```
                    ┌─────────────────────────┐
                    │   use-authoring-skills  │  (P1 — Routing, Foundation)
                    │   Meta-skill authoring  │
                    └──────┬──────┬──────┬────┘
                           │      │      │
              loads ───────┘      │      └────── loads
                           ┌──────▼──────┐
                           │planning-with│
                           │   -files    │  (P2 — Domain, Shared Infrastructure)
                           └──────┬──────┘
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
    loads ────┘         loads ────┘         loads ────┘
              │                   │                   │
    ┌─────────▼─────────┐ ┌──────▼──────┐ ┌──────────▼──────────┐
    │user-intent-       │ │coordinating-│ │gcc (external skill) │
    │interactive-loop   │ │   loop      │ │                     │
    │(P2 — Domain)      │ │(P1 — Routing│ │Git-backed memory    │
    └───────────────────┘ └─────────────┘ └─────────────────────┘
```

### Dependency Table

| Skill | Depends On | Dependency Type | What It Uses |
|-------|-----------|-----------------|--------------|
| `use-authoring-skills` | `planning-with-files` | Required | task_plan.md, findings.md, progress.md for long-running authoring |
| `use-authoring-skills` | `gcc` | Required | Git-backed memory for authoring state |
| `use-authoring-skills` | `skill-creator`, `skill-development`, `writing-skills` | Required | Skill creation primitives |
| `use-authoring-skills` | `skill-judge`, `skill-review` | Required | Audit/refactor primitives |
| `user-intent-interactive-loop` | `planning-with-files` | Required | Multi-session planning files |
| `user-intent-interactive-loop` | `dispatching-parallel-agents` | Required | Parallel task execution |
| `user-intent-interactive-loop` | `coordinating-loop` | Sibling | Orchestration patterns |
| `user-intent-interactive-loop` | `gcc` | Required | Git-backed memory |
| `coordinating-loop` | `user-intent-interactive-loop` | Sibling | User intent capture before coordination |
| `coordinating-loop` | `planning-with-files` | Required | Long-running planning files |
| `coordinating-loop` | `dispatching-parallel-agents` | Required | Parallel dispatch patterns |
| `coordinating-loop` | `gcc` | Required | Coordination state persistence |
| `planning-with-files` | `coordinating-loop` | Sibling | Subagent dispatch for planning tasks |
| `planning-with-files` | `user-intent-interactive-loop` | Sibling | Requirement clarification before planning |
| `planning-with-files` | `gcc` | Required | Git-backed memory across sessions |

### Dependency Rules

1. **No circular hard dependencies** — sibling skills reference each other but do not require each other to function independently
2. **`planning-with-files` is the shared infrastructure layer** — all other skills depend on it for state persistence
3. **`use-authoring-skills` is the foundation** — it creates and improves all other skills but does not depend on them at runtime
4. **External skills** (`gcc`, `dispatching-parallel-agents`, `skill-creator`, etc.) are not part of this harness but are required dependencies

---

## 4. Shared Conventions

### 4.1 Terminology Mandate

All skill packs MUST use consistent terminology. This is non-negotiable and enforced by `use-authoring-skills` reference `06-cross-platform-activation.md`.

| Concept | Use | Never Use |
|---------|-----|-----------|
| AI entity | "Agent" | Claude, GPT, Gemini |
| Config file | "AGENTS.md" | CLAUDE.md, CLAUDE.local.md |
| Package manager | "your package manager" | npm, yarn, pnpm |
| Test runner | "your test framework" | Jest, Vitest, Mocha |
| Language | "your language" | TypeScript, Python |
| Config file | "config file" | opencode.json, .claude/settings.json |

### 4.2 Frontmatter Standards

All SKILL.md files follow the same frontmatter schema (from `findings.md` locked decisions):

| Field | Required | Constraints |
|-------|----------|-------------|
| `name` | Yes | Max 64 chars, lowercase + hyphens, matches directory name |
| `description` | Yes | Max 1024 chars, starts with "Use when...", includes trigger keywords |
| `metadata` | Optional | Key-value pairs for discovery/stacking |
| `allowed-tools` | Optional | Space-delimited pre-approved tools |
| `license` | Optional | Short name or file reference |
| `compatibility` | **BANNED** | User explicitly rejected this field |

### 4.3 Progressive Disclosure

All skill packs follow the same progressive disclosure pattern:

| Tier | Location | Content | Size Target |
|------|----------|---------|-------------|
| **Tier 1** | SKILL.md body | Routing, quick reference, anti-patterns, cross-refs | <500 lines |
| **Tier 2** | `references/` | Deep material, worked examples, full protocols | 100-400 lines each |
| **Tier 3** | `templates/` | Copy-paste templates for immediate use | Variable |
| **Tier 4** | `scripts/` | Executable validation and automation | Variable |
| **Tier 5** | `hooks/` | Platform-specific hook configurations | Variable |

**Rule:** The SKILL.md body must be self-sufficient for basic use. References are loaded only when the Agent needs depth.

### 4.4 Gate System

All skill packs use programmatic, measurable gates. Gates are boolean or scoring — never subjective.

| Gate | Phase | Measure | Pass Criteria |
|------|-------|---------|---------------|
| G1 | Context Scouting | Quality scores for all files | All issues ranked by severity |
| G2 | Deep Audit | Duplication quantified, gaps cataloged | Overlap matrix complete |
| G3 | Architecture Design | Token budget, ownership model | Structure with progressive tiers |
| G4 | Implementation | Cross-file duplication, contradictions | Duplication <5%, contradictions = 0 |
| G5 | Validation | Real scenario test, trigger rate | Line counts verified, dead links = 0 |
| G6 | Bridging | Cross-package linkage spec | Convention established for sibling packs |

**Enforcement:** All gates must pass before proceeding. Failure loops back to that phase (ralph-loop compatible).

### 4.5 Planning-with-Files Discipline

Every skill pack that performs multi-session work MUST maintain three files:

| File | Purpose | Update Frequency |
|------|---------|-----------------|
| `task_plan.md` | Phase tracker, goals, locked decisions | Every phase change |
| `findings.md` | Discovered facts, research results | Every 2-3 discoveries |
| `progress.md` | Timestamped actions, decisions, recovery state | Every meaningful action |

**Read-before-decide rule:** Re-read `task_plan.md` for goals and `findings.md` for facts before any major decision.

### 4.6 Write-to-Disk Every Turn

Coherence is lost between turns by default. The only defense is persistent write-to-disk. Every skill pack encodes this rule:

- `use-authoring-skills`: Rule #13 in Operating Discipline
- `user-intent-interactive-loop`: Session Persistence Protocol
- `coordinating-loop`: Recovery Protocol
- `planning-with-files`: Core Pattern (Context Window = RAM, Filesystem = Disk)

---

## 5. Cross-Reference Matrix

### Skill-to-Skill References

| From Skill | To Skill | What It Shares | Reference Location |
|-----------|----------|----------------|-------------------|
| `use-authoring-skills` | `planning-with-files` | Long-running authoring state | "Required Skill Loads" table |
| `use-authoring-skills` | `gcc` | Git-backed memory | "Required Skill Loads" table |
| `use-authoring-skills` | `skill-creator` | Skill creation primitives | "Required Skill Loads" table |
| `use-authoring-skills` | `skill-judge` | Audit primitives | "Required Skill Loads" table |
| `use-authoring-skills` | `coordinating-loop` | Cross-package integration section | "Cross-Package Integration" section |
| `user-intent-interactive-loop` | `planning-with-files` | Multi-session planning | "Required Skill Loads" table |
| `user-intent-interactive-loop` | `coordinating-loop` | Orchestration patterns | "Cross-References" table |
| `user-intent-interactive-loop` | `dispatching-parallel-agents` | Parallel execution | "Required Skill Loads" table |
| `user-intent-interactive-loop` | `gcc` | Git-backed memory | "Required Skill Loads" table |
| `coordinating-loop` | `user-intent-interactive-loop` | User intent capture | "Required Skill Loads" table |
| `coordinating-loop` | `planning-with-files` | Long-running planning | "Required Skill Loads" table |
| `coordinating-loop` | `dispatching-parallel-agents` | Parallel dispatch | "Required Skill Loads" table |
| `coordinating-loop` | `gcc` | Coordination state | "Required Skill Loads" table |
| `planning-with-files` | `coordinating-loop` | Subagent dispatch | "Coordinating Skills" section |
| `planning-with-files` | `user-intent-interactive-loop` | Requirement clarification | "Coordinating Skills" section |
| `planning-with-files` | `gcc` | Git-backed memory | "Coordinating Skills" section |

### Shared Resource Ownership

| Resource | Owner | Consumers | Format |
|----------|-------|-----------|--------|
| `task_plan.md` | `planning-with-files` | All 4 packs | Markdown with `## Goal`, `## Current Phase`, `## Phases` |
| `findings.md` | `planning-with-files` | All 4 packs | Markdown with `## Research Findings`, `## Technical Decisions` |
| `progress.md` | `planning-with-files` | All 4 packs | Markdown with `## Session: <date>`, timestamped entries |
| `gcc` memory | `gcc` (external) | All 4 packs | Git-backed index.yaml |
| Terminology | `use-authoring-skills` | All 4 packs | Mandate table in SKILL.md body |
| Gate system | `use-authoring-skills` | All 4 packs | 6-gate structure in SKILL.md body |
| Anti-patterns | Each pack | Each pack (own set) | Numbered list in SKILL.md body |

### Reference File Cross-Links

| Reference File | Pack | Cross-Links To |
|---------------|------|----------------|
| `08-conflict-detection.md` | `use-authoring-skills` | All sibling packs (detection protocol) |
| `06-cross-platform-activation.md` | `use-authoring-skills` | All packs (terminology mandate) |
| `02-context-preservation.md` | `user-intent-interactive-loop` | `planning-with-files` (persistence protocol) |
| `01-handoff-protocols.md` | `coordinating-loop` | All packs (context transfer) |
| `04-cross-platform-hooks.md` | `planning-with-files` | All packs (hook configurations) |

---

## 6. State Sharing Protocol

### 6.1 The Three Planning Files

All skill packs share the same three planning files at the project root. These are the **single source of truth** for cross-skill state.

#### task_plan.md — The Goal Anchor

```markdown
## Goal
<One sentence. The north star.>

## Current Phase
Phase N of M: <phase name>

## Phases
- [ ] Phase 1: <name> — **Status:** pending
- [x] Phase 2: <name> — **Status:** complete

## Decisions Made
| Decision | Rationale | Date |

## Errors Encountered
| Error | Attempt | Resolution |
```

**Ownership:** `planning-with-files` defines the schema. All packs write to it but only `planning-with-files` creates it. Re-read before every major decision.

#### findings.md — The Knowledge Store

```markdown
## Requirements
## Research Findings
## Technical Decisions
## Issues Encountered
## Resources
```

**Critical rule:** Web/search/browser results go here, NOT in `task_plan.md`. `task_plan.md` is auto-read by hooks; untrusted content there amplifies on every tool call.

#### progress.md — The Session Log

```markdown
## Session: 2026-04-03
### Phase 1: <name> — **Status:** complete
## Test Results
## Error Log
```

**Ownership:** `planning-with-files` defines the schema. All packs append timestamped entries.

### 6.2 GCC (Git-Backed Memory)

`gcc` provides git-backed memory that survives session clears. All skill packs use it for:

| Data Type | Storage Method | Recovery |
|-----------|---------------|----------|
| Session intent | `gcc commit "intent: <description>"` | `gcc recover` |
| Phase checkpoints | `gcc commit "checkpoint: phase N complete"` | `gcc log` |
| Decision records | `gcc commit "decision: <description>"` | `gcc log` |

**Rule:** GCC commits are supplementary to planning files, not replacements. Planning files are the primary state; GCC is the recovery backup.

### 6.3 State Flow Diagram

```
User Intent
    │
    ▼
user-intent-interactive-loop (PROBE → UNDERSTAND)
    │
    ├── writes intent to → progress.md
    ├── commits to → gcc
    │
    ▼
planning-with-files (PLAN)
    │
    ├── creates → task_plan.md, findings.md, progress.md
    ├── writes phases → task_plan.md
    │
    ▼
coordinating-loop (DISPATCH)
    │
    ├── reads task_plan.md for scope
    ├── dispatches subagents with handoff context
    ├── monitors → progress.md updates
    │
    ▼
use-authoring-skills (if skill creation needed)
    │
    ├── reads findings.md for context
    ├── writes skill files
    ├── validates with scripts/
    │
    ▼
Integration (all packs)
    │
    ├── updates progress.md with results
    ├── updates task_plan.md phase status
    ├── commits final state to gcc
```

### 6.4 State Mutation Rules

1. **Only one pack writes to a planning file at a time** — sequential writes, no concurrent mutation
2. **Read before write** — always read the current file state before appending
3. **Timestamp all entries** — every progress.md entry includes a timestamp
4. **Never overwrite** — always append, never replace existing content
5. **Phase transitions are atomic** — mark old phase complete, then mark new phase in_progress

---

## 7. Stacking Rules

### 7.1 Valid Combinations

| Combination | When to Use | Example Scenario |
|-------------|-------------|-----------------|
| `use-authoring-skills` + `planning-with-files` | Creating or auditing a skill over multiple sessions | "Build a new skill for API documentation" |
| `user-intent-interactive-loop` + `planning-with-files` | Vague request requiring clarification and structured planning | "Help me improve our codebase" |
| `user-intent-interactive-loop` + `coordinating-loop` | Long session with delegation needs | "Figure out what I want, then delegate the work" |
| `coordinating-loop` + `planning-with-files` | Multi-agent coordination with persistent state | "Dispatch 3 agents to audit different parts of the codebase" |
| `use-authoring-skills` + `coordinating-loop` | Creating multiple skills in parallel | "Create 4 new skills for our team" |
| All 4 packs | Complex multi-session project requiring skill creation | "Build a complete skill system for our project" |

### 7.2 Stacking Order

Skills stack in a specific order based on the workflow phase:

```
Phase 1: Intent Capture
  → user-intent-interactive-loop (PROBE, UNDERSTAND)

Phase 2: Planning
  → planning-with-files (PLAN — creates task_plan.md, findings.md, progress.md)

Phase 3: Coordination
  → coordinating-loop (DISPATCH — decides sequential vs parallel, launches agents)

Phase 4: Execution
  → use-authoring-skills (if skill creation is the task)
  → Or direct execution (if the task is code changes)

Phase 5: Integration
  → coordinating-loop (INTEGRATE — merges results, validates gates)
  → planning-with-files (UPDATE — marks phases complete)
```

### 7.3 Invalid Combinations

| Combination | Why Invalid | Correct Approach |
|-------------|-------------|-----------------|
| `coordinating-loop` alone (no planning) | No persistent state for multi-agent work | Always pair with `planning-with-files` |
| `user-intent-interactive-loop` alone (for execution) | It probes intent, doesn't execute | Pair with `coordinating-loop` or execute directly |
| `use-authoring-skills` without `planning-with-files` (for complex skills) | No goal anchor for multi-session work | Always pair for skills requiring >5 tool calls |
| Two packs claiming the same trigger | Scope overlap causes confusion | Use `use-authoring-skills` `08-conflict-detection.md` to resolve |

### 7.4 Stacking Decision Flowchart

```
User request received
    │
    ▼
Is the request vague or underspecified?
    ├── Yes → Load user-intent-interactive-loop first
    │         Probe until intent is clear
    │         Then continue below
    │
    └── No → Continue
              │
              ▼
Does the task require >5 tool calls?
    ├── Yes → Load planning-with-files
    │         Create task_plan.md, findings.md, progress.md
    │
    └── No → Execute directly (no stacking needed)
              │
              ▼
Are there multiple independent tasks?
    ├── Yes → Load coordinating-loop
    │         Decide sequential vs parallel
    │         Dispatch with handoff protocols
    │
    └── No → Execute sequentially
              │
              ▼
Is the task about creating/improving skills?
    ├── Yes → Load use-authoring-skills
    │         Follow TDD workflow, quality gates
    │
    └── No → Execute with standard patterns
```

---

## 8. Handoff Protocol

### 8.1 Context Transfer Between Skills

When one skill hands off to another, the following context MUST be transferred:

| Element | Required | Source | Example |
|---------|----------|--------|---------|
| User's original intent | Yes | `progress.md` or user message | "Build a skill for API documentation" |
| Constraints | Yes | `findings.md` or user message | "Under 500 lines, universal terminology" |
| Success criteria | Yes | `task_plan.md` or user confirmation | "Skill passes quality score ≥4.5" |
| Current state | Yes | `task_plan.md` (phase), `progress.md` (actions) | "Phase 2 of 5, 3 files created" |
| What NOT to do | Yes | `findings.md` (decisions) | "Do NOT use compatibility field" |
| Files to read | Yes | `task_plan.md` (key files) | "Read references/01-skill-anatomy.md first" |
| Files to write | Yes | `task_plan.md` (expected outputs) | "Write SKILL.md and references/06.md" |

### 8.2 Handoff Message Template

```
## Handoff: <source skill> → <target skill>

### Intent
<User's original intent, verbatim>

### Context
- Current phase: <phase N of M>
- What's been done: <summary>
- What's blocking: <if any>

### Constraints
- <constraint 1>
- <constraint 2>

### Success Criteria
- <criterion 1>
- <criterion 2>

### Files to Read
- <file path 1>
- <file path 2>

### Files to Write
- <file path 1>
- <file path 2>

### What NOT to Do
- <anti-pattern 1>
- <anti-pattern 2>
```

### 8.3 Handoff Between Agent Levels

| Handoff Type | From | To | Context Size | What's Included |
|-------------|------|----|-------------|-----------------|
| Front → Child | Front Agent | Child Agent | Focused (not full history) | Task, scope, constraints, success criteria, verification step |
| Child → Front | Child Agent | Front Agent | Summary | Results, files changed, blockers, verification status |
| Skill → Skill | One skill pack | Another skill pack | Structured (handoff template) | Intent, context, constraints, success criteria, file paths |
| Session → Session | Interrupted session | New session | Full recovery | Read task_plan.md → findings.md → progress.md → git diff |

### 8.4 Handoff Validation

Before accepting a handoff, the receiving skill MUST:

1. Verify the user's intent is clear (if not, return to PROBE)
2. Verify constraints are explicit (if not, ask for clarification)
3. Verify success criteria are measurable (if not, define them)
4. Verify file paths exist or are creatable (if not, report error)
5. Write a receipt to `progress.md` confirming handoff acceptance

---

## 9. Conflict Detection

### 9.1 Five Conflict Types

| Type | What It Looks Like | Detection Method | Resolution |
|------|-------------------|-----------------|------------|
| **Scope overlap** | Two skills claim the same trigger phrases | Grep trigger phrases across all SKILL.md descriptions | Assign primary owner, cross-reference from secondary |
| **Contradictory instructions** | One says "always X", another "never X" | Compare "When to Load/Use" sections | `use-authoring-skills` `08-conflict-detection.md` protocol |
| **Shared state mutation** | Both write to same file with different formats | Compare handoff paths and file schemas | Define single owner per file, others append only |
| **Boundary violation** | A depth skill has routing logic (or vice versa) | Check for IF/THEN routing in P2 skills | Move routing to P1 skill, keep depth in P2 |
| **Dependency cycle** | A requires B, B requires A | Trace dependency chains | Break cycle by making one dependency optional/sibling |

### 9.2 Detection Protocol

```
Step 1: Collect all SKILL.md files
Step 2: Extract description fields (trigger surface)
Step 3: Grep for overlapping trigger phrases
Step 4: Compare "When to Load/Use" sections for contradictions
Step 5: Map file write operations per skill
Step 6: Check for shared file mutation
Step 7: Trace dependency chains for cycles
Step 8: Report findings in conflict matrix
```

### 9.3 Known Conflicts (Resolved)

| Conflict | Skills Involved | Resolution | Status |
|----------|----------------|------------|--------|
| Terminology inconsistency | All packs (pre-cleanup) | `use-authoring-skills` terminology mandate | ✅ Resolved |
| Planning file schema drift | `user-intent-interactive-loop` vs `planning-with-files` | `planning-with-files` owns schema, others follow | ✅ Resolved |
| Gate system duplication | `use-authoring-skills` vs `coordinating-loop` | `use-authoring-skills` defines gates, `coordinating-loop` references | ✅ Resolved |

### 9.4 Known Conflicts (Open)

| Conflict | Skills Involved | Impact | Priority |
|----------|----------------|--------|----------|
| `planning-with-files` SKILL.md has duplicated "Error Discipline" and "Read vs Write Decision Matrix" sections (lines 146-247 are byte-identical duplicates of lines 196-257) | `planning-with-files` internal | Wastes tokens, confusing | Medium |
| `coordinating-loop` and `user-intent-interactive-loop` both reference `dispatching-parallel-agents` with slightly different guidance on when to use it | `coordinating-loop` vs `user-intent-interactive-loop` | Minor inconsistency | Low |

---

## 10. HiveMind v3 Alignment

### 10.1 Skills as Configuration

Per the HiveMind v3 architecture (`docs/draft/architecture-proposal-hivemind-v3.md`), skills are **configuration**, not code:

```
CAN BE CONFIGURATION:
- Skill definitions (markdown in `skills/`)
```

The meta-builder skill packs align with this principle:
- All skill packs are pure markdown (no compiled code)
- They define behavior through instructions, not implementation
- They are consumed by the Agent at runtime, not executed as code

### 10.2 Tools as Write Side

HiveMind v3 enforces CQRS: tools are the write side. The meta-builder harness respects this:

| HiveMind v3 Concept | Meta-Builder Equivalent |
|---------------------|------------------------|
| `hivemind_delegation` tool | `coordinating-loop` dispatch patterns |
| `hivemind_trajectory` tool | `planning-with-files` progress.md tracking |
| `hivemind_task` tool | `planning-with-files` task_plan.md phases |
| `hivemind_runtime_command` tool | `coordinating-loop` scripts (coordination-check.sh, loop-status.sh) |

### 10.3 Hooks as Read Side

HiveMind v3 hooks are the read side — they observe and enrich without mutating state:

| HiveMind v3 Hook | Meta-Builder Equivalent |
|------------------|------------------------|
| `chat.message` hook | `planning-with-files` cross-platform hooks (UserPromptSubmit, PreToolUse) |
| `tool.execute.before` hook | `use-authoring-skills` hooks/pre-tool-use.sh |
| `tool.execute.after` hook | `use-authoring-skills` hooks/post-tool-use.sh |
| `experimental.session.compacting` hook | `user-intent-interactive-loop` long-session-management |

### 10.4 Architecture Mapping

```
HiveMind v3 Layer          Meta-Builder Skill Pack
─────────────────────────  ─────────────────────────
skills/ (config)           All 4 skill packs (markdown)
tools/ (write side)        coordinating-loop dispatch + planning-with-files file writes
hooks/ (read side)         use-authoring-skills hooks + planning-with-files hooks
agents/ (config)           user-intent-interactive-loop (defines agent roles)
commands/ (config)         coordinating-loop scripts (coordination-check.sh, etc.)
workflows/ (config)        planning-with-files (task_plan.md phases)
continuity/ (state)        planning-with-files (task_plan.md, findings.md, progress.md) + gcc
delegation/ (routing)      coordinating-loop (sequential vs parallel decision)
```

### 10.5 Alignment Gaps

| Gap | Description | Impact | Resolution Path |
|-----|-------------|--------|----------------|
| No formal tool definitions | Meta-builder skills instruct the Agent but don't define OpenCode tools | Skills rely on built-in tools only | GROUP 2 skills (use-authoring-tools) will address this |
| No plugin assembly | Skills are markdown, not a compiled plugin | Skills work on any platform but lack SDK integration | Meta-builder parent skill will bridge this |
| No CQRS enforcement at skill level | Skills both read and write planning files | Potential state corruption if multiple skills write simultaneously | Stacking rules (Section 7) prevent concurrent writes |

---

## 11. OpenCode Concept Mapping

### 11.1 Concept-to-Trigger Map

OpenCode provides 10 core concepts. Each maps to specific skill triggers:

| OpenCode Concept | What It Is | Skill Trigger | Example |
|-----------------|------------|---------------|---------|
| **Agents** | AI entity definitions with system prompts | `user-intent-interactive-loop` (defines Front/Parent/Child roles) | "Set up a specialist agent for code review" |
| **Tools** | Built-in and custom capabilities | `coordinating-loop` (decides which tools to use) | "Use the search tool to find patterns" |
| **Commands** | CLI command bundles | `coordinating-loop` scripts | "Run the coordination check script" |
| **Configs** | Platform configuration files | `planning-with-files` (cross-platform hooks) | "Configure hooks for this platform" |
| **Skills** | Markdown-based behavioral instructions | `use-authoring-skills` (creates/audits skills) | "Create a new skill for API docs" |
| **Rules** | Behavioral constraints | `use-authoring-skills` (anti-deception, gatekeeping) | "Enforce the no-compatibility-field rule" |
| **Permissions** | Access control profiles | `coordinating-loop` (child agent scope boundaries) | "This child agent can only read src/" |
| **Custom Tools** | User-defined tool implementations | `use-authoring-skills` (future: use-authoring-tools) | "Build a custom tool for code analysis" |
| **MCP Servers** | External service connections | `user-intent-interactive-loop` (deep investigation) | "Search the web for current information" |
| **LSP Servers** | Language server protocol | `planning-with-files` (file structure analysis) | "Analyze the codebase structure" |

### 11.2 Concept Consumption by Skill Pack

| Skill Pack | Agents | Tools | Commands | Configs | Skills | Rules | Permissions | Custom Tools | MCP | LSP |
|-----------|--------|-------|----------|---------|--------|-------|-------------|-------------|-----|-----|
| `use-authoring-skills` | — | — | — | Configs | ✅ Primary | ✅ Primary | — | Future | — | — |
| `user-intent-interactive-loop` | ✅ Primary | ✅ | — | — | — | — | — | ✅ | — | — |
| `coordinating-loop` | ✅ | ✅ | ✅ | — | — | — | ✅ | — | — | — |
| `planning-with-files` | — | — | ✅ | ✅ | — | — | — | — | — | ✅ |

### 11.3 Trigger Priority

When multiple OpenCode concepts could apply, the priority order is:

1. **Skills** — Always check if a skill applies first (this spec's primary concern)
2. **Agents** — If the task requires a specific agent role
3. **Tools** — If the task requires a specific capability
4. **Commands** — If the task requires a CLI operation
5. **Configs** — If the task requires platform configuration
6. **Rules** — If the task requires behavioral constraints
7. **Permissions** — If the task requires access control
8. **Custom Tools** — If the task requires a user-defined tool
9. **MCP Servers** — If the task requires external services
10. **LSP Servers** — If the task requires language analysis

---

## 12. Integration Test Scenarios

### Scenario 1: Skill Creation from Vague Request

**Skills exercised:** `user-intent-interactive-loop` → `planning-with-files` → `use-authoring-skills` → `coordinating-loop`

**Flow:**
1. User says: "I need a better skill system"
2. `user-intent-interactive-loop` probes: "What aspect — creation, discovery, quality?"
3. User clarifies: "Quality — I want to audit existing skills"
4. `planning-with-files` creates task_plan.md with phases
5. `use-authoring-skills` loads, follows TDD workflow
6. `coordinating-loop` dispatches subagents to audit each skill
7. Results integrated, progress.md updated, gcc committed

**Validation gates:**
- [ ] Intent captured verbatim in progress.md
- [ ] task_plan.md has ≥3 phases with status tracking
- [ ] Each audited skill has a quality score in findings.md
- [ ] Final report written to disk
- [ ] GCC commit with summary

### Scenario 2: Multi-Agent Codebase Investigation

**Skills exercised:** `coordinating-loop` → `planning-with-files` → `user-intent-interactive-loop`

**Flow:**
1. User says: "Find all bugs in the authentication module"
2. `planning-with-files` creates planning files
3. `coordinating-loop` assesses: 3 independent subdomains (login, session, permissions)
4. Decision: parallel dispatch (independent, no shared files, 3+ tasks)
5. 3 child agents dispatched with handoff context
6. Results integrated, conflicts checked
7. `user-intent-interactive-loop` updates user with findings

**Validation gates:**
- [ ] Each child agent received focused prompt (not full history)
- [ ] No shared file mutation between child agents
- [ ] Integration report written to findings.md
- [ ] User received specific update (not vague "made progress")

### Scenario 3: Session Recovery After Interruption

**Skills exercised:** `planning-with-files` → `user-intent-interactive-loop` → `coordinating-loop`

**Flow:**
1. Session interrupted mid-task
2. New session starts, `planning-with-files` recovery protocol:
   - Read task_plan.md → findings.md → progress.md
   - Run session-catchup.py
   - Cross-reference with git diff
   - Reconcile state
3. `user-intent-interactive-loop` re-confirms intent with user
4. `coordinating-loop` resumes from last passed gate

**Validation gates:**
- [ ] All 3 planning files read before any action
- [ ] Git diff reconciled with progress.md
- [ ] User re-confirmed intent
- [ ] Resumed from correct phase (not from memory)

### Scenario 4: Skill Conflict Resolution

**Skills exercised:** `use-authoring-skills` → `coordinating-loop`

**Flow:**
1. Two skills detected with overlapping triggers
2. `use-authoring-skills` loads `08-conflict-detection.md`
3. Runs detection protocol (grep, compare, map)
4. Identifies conflict type (scope overlap)
5. Assigns primary owner, updates secondary to cross-reference
6. `coordinating-loop` validates no other conflicts exist

**Validation gates:**
- [ ] Conflict type correctly identified
- [ ] Primary owner assigned
- [ ] Secondary skill updated with cross-reference
- [ ] No remaining overlapping triggers

### Scenario 5: Long-Running Feature Development

**Skills exercised:** All 4 packs in full stack

**Flow:**
1. User says: "Build a complete skill system for our project"
2. `user-intent-interactive-loop` probes scope, constraints, success criteria
3. `planning-with-files` creates comprehensive task_plan.md (7 phases)
4. `coordinating-loop` dispatches parallel agents for independent phases
5. `use-authoring-skills` creates each skill with TDD workflow
6. After each phase: progress.md updated, user notified
7. After all phases: integration test, quality scoring, gcc commit

**Validation gates:**
- [ ] All 7 phases tracked in task_plan.md
- [ ] Each skill passes quality score ≥4.0
- [ ] No cross-file duplication >5%
- [ ] No contradictions between skills
- [ ] User received updates at each phase boundary
- [ ] Final state committed to gcc

### Scenario 6: Skill Audit and Improvement Cycle

**Skills exercised:** `use-authoring-skills` → `planning-with-files` → `coordinating-loop`

**Flow:**
1. User says: "Audit all 4 skill packs and fix issues"
2. `use-authoring-skills` loads quality matrix (5 dimensions)
3. `planning-with-files` creates audit plan
4. `coordinating-loop` dispatches parallel auditors (one per pack)
5. Each auditor scores all 5 dimensions
6. Results aggregated, gaps identified
7. Fix plan created, fixes delegated
8. Re-score validates improvement

**Validation gates:**
- [ ] All 4 packs scored on all 5 dimensions
- [ ] Scores recorded in findings.md
- [ ] Fix plan addresses lowest-scoring dimensions first
- [ ] Re-score shows improvement (or explains why not)

---

## 13. Next Milestones

### What's Built (Milestone 1 — ✅ COMPLETE)

| Deliverable | Status | Files | Lines |
|-------------|--------|-------|-------|
| `use-authoring-skills` | ✅ | 24 | ~5,067 |
| `user-intent-interactive-loop` | ✅ | 5 | 1,433 |
| `coordinating-loop` | ✅ | 7 | 1,207 |
| `planning-with-files` | ✅ | 11 | 1,805 |
| Cross-package bridging spec (this document) | ✅ | 1 | ~700 |
| **Total** | | **48** | **~10,200** |

### What's Next (Priority Order)

#### Milestone 2: GROUP 2 Domain Skills (Medium Priority)

| Skill | Purpose | Dependencies | Estimated Effort |
|-------|---------|-------------|-----------------|
| `use-authoring-commands` | Author CLI command bundles | `use-authoring-skills` | 2-3 days |
| `use-authoring-agents` | Author agent definitions | `use-authoring-skills` | 2-3 days |
| `use-authoring-tools` | Author custom tools | `use-authoring-skills` | 3-4 days |
| `use-authoring-workflows` | Author workflow templates | `use-authoring-skills`, `coordinating-loop` | 3-4 days |

#### Milestone 3: GROUP 1 Remaining Skills (High Priority)

| Skill | Purpose | Dependencies | Estimated Effort |
|-------|---------|-------------|-----------------|
| `tech-to-feature-synthesis` | Deep investigation + feature synthesis | All GROUP 1 + GROUP 2 | 4-5 days |
| `deep-investigation` | Systematic codebase investigation | `coordinating-loop`, `planning-with-files` | 2-3 days |
| TDD skill | Test-driven development methodology | `planning-with-files` | 1-2 days |
| Spec-driven skill | Specification-driven development | `planning-with-files` | 1-2 days |

#### Milestone 4: Meta-Builder Parent + Integration (High Priority)

| Deliverable | Purpose | Dependencies | Estimated Effort |
|-------------|---------|-------------|-----------------|
| Meta-builder parent skill | Orchestrator that routes between all skills | All GROUP 1 + GROUP 2 | 3-4 days |
| Integration test suite | Automated validation of multi-skill workflows | This bridging spec | 2-3 days |
| Validation gate | Real creation scenario end-to-end test | Integration test suite | 1-2 days |

#### Milestone 5: OpenCode Platform Integration (Low Priority)

| Deliverable | Purpose | Dependencies | Estimated Effort |
|-------------|---------|-------------|-----------------|
| OpenCode docs consumption | Embed 20 OpenCode concept docs into skills | GROUP 2 skills | 2-3 days |
| Hook configurations | Platform-specific hook setups | `planning-with-files` | 1-2 days |
| Plugin assembly | Compiled plugin packaging | Meta-builder parent | 2-3 days |

### Priority Rationale

1. **GROUP 1 remaining skills first** — They complete the execution layer needed for real work
2. **GROUP 2 domain skills second** — They extend the authoring capability to all OpenCode concepts
3. **Meta-builder parent third** — It needs all child skills to exist before it can route between them
4. **OpenCode integration last** — It's platform-specific polish on top of universal skill architecture

### Blocking Dependencies

```
Milestone 2 (GROUP 2) requires: Milestone 1 ✅ (complete)
Milestone 3 (GROUP 1 remaining) requires: Milestone 1 ✅ (complete)
Milestone 4 (Meta-builder parent) requires: Milestone 2 + Milestone 3
Milestone 5 (OpenCode integration) requires: Milestone 4
```

---

## Appendix A: File Path Index

### Active Skill Packs (`.opencode/skills/`)

```
.opencode/skills/
├── use-authoring-skills/          (24 files: SKILL.md + 12 refs + 4 scripts + 4 templates + 3 hooks)
├── user-intent-interactive-loop/  (5 files: SKILL.md + 4 refs)
├── coordinating-loop/             (7 files: SKILL.md + 4 refs + 2 scripts)
└── planning-with-files/           (11 files: SKILL.md + 4 refs + 3 scripts + 3 templates)
```

### Source Materials (`.skills-lab/`)

```
.skills-lab/
├── meta-builder-architecture-2026-04-03.md
├── findings.md
├── progress.md
├── task_plan.md
├── realignment-2026-04-03.md
└── refactoring-skills/
    ├── users-prompting-workspace-resources/ (essentials.md + 20 OpenCode docs)
    └── workspace/ (batch-outputs, knowledge, master-plan)
```

### Architecture Documents (`docs/draft/`)

```
docs/draft/
└── architecture-proposal-hivemind-v3.md
```

---

## Appendix B: Glossary

| Term | Definition |
|------|-----------|
| **Agent** | The AI entity executing the skill (universal term, not platform-specific) |
| **Front Agent** | The primary agent managing the user relationship |
| **Parent Agent** | An agent that manages child agent sessions |
| **Child Agent** | An agent executing a scoped task |
| **Skill Pack** | A directory containing SKILL.md + references + scripts + templates |
| **Meta-Builder** | The system of skill packs that builds and coordinates other skills |
| **GROUP 1** | Specialist implementation skills (user-intent, coordination, planning) |
| **GROUP 2** | Domain-parked exclusive skills (authoring commands, agents, tools, workflows) |
| **GROUP 3** | Shared concept-specific skills (stackable) |
| **Gate** | A programmatic, measurable checkpoint that must pass before proceeding |
| **Ralph-loop** | A loop-until-pass pattern with acceptance criteria |
| **GCC** | Git-backed memory system for session continuity |
| **CQRS** | Command Query Responsibility Segregation (tools = write, hooks = read) |
| **Progressive Disclosure** | Presenting information in tiers: breadth first, depth on demand |
| **Handoff** | The transfer of context between skills or agents |
| **Stacking** | Combining multiple skill packs in a single workflow |

---

**Document Status:** DRAFT — awaiting integration validation
**Next Review:** After first multi-skill integration test
**Owner:** Meta-Builder Architecture Team
**Last Updated:** 2026-04-03
