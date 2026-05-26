---
name: hm-l2-lineage-router
description: >
  Route tasks to correct hm-* skills based on intent classification. Maps task categories to skill
  loading bundles. Use when an agent needs to determine which hm-* skills to load for a given task.
  Triggers: "route task", "classify intent", "which skill to load", "task routing", "lineage routing",
  "skill bundle for task", "load skills for", "what skills do I need", "skill loading order",
  "determine skill lineage", "map task to skills", "skill selection for workflow".
  NOT for executing skills — only for determining which skills to load. Max 5 skills per bundle.
metadata:
  layer: "2"
  role: "domain-execution"
  pattern: P2
  version: "1.0.0"
  lineage: "hm-*"
  task-group: "how-to-implement"
  routes-to: ["hm-*"]
  input-from: ["hm-*"]
  consumed-by: ["hm-coordinating-loop", "hm-phase-execution", "hm-phase-loop", "hm-subagent-delegation-patterns"]
allowed-tools:
  - Read
  - Glob
  - Grep
---

## The Iron Law

```
Every task has a lineage. Route to the bundle that matches the task's category. Max 5 skills per bundle.
```

# Lineage Router

## Overview

Given a task intent, determine which hm-* skills should be loaded. This skill maps task categories to skill loading bundles. It does NOT execute skills — it only determines which skills to load and in what order.

**Seven task categories, seven skill bundles:**

| Category | Skills | Max |
|----------|--------|-----|
| Research | hm-detective + hm-deep-research + hm-tech-stack-ingest | 3 |
| Planning | hm-spec-driven-authoring + hm-planning-persistence | 2 |
| Execution | hm-phase-execution + hm-cross-cutting-change | 2 |
| Quality | hm-test-driven-execution + hm-gate-orchestrator | 2 |
| Debug | hm-debug + hm-completion-looping | 2 |
| Review | hm-production-readiness + hm-gate-orchestrator | 2 |
| Command Routing | hivemind-command-engine + execute-slash-command | 2 |

## On Load

1. Read `references/routing-map.md` — the complete routing map with priority ordering and dependency chains
2. Identify the task intent from the current context
3. Classify the task into one of the six categories

## Trigger Phrases

- "route task" / "route this task"
- "classify intent" / "classify task intent"
- "which skill to load" / "what skills do I need"
- "task routing" / "lineage routing"
- "skill bundle for task" / "load skills for"
- "skill loading order" / "determine skill lineage"
- "map task to skills" / "skill selection for workflow"

- "execute command" / "command dispatch"
- "slash command" / "command routing"
- "list commands" / "run command"
- "discover commands"

## Routing Map

### Category 1: Research Tasks

**Intent signals:** "investigate", "research", "find out", "analyze", "look into", "explore"

| Priority | Skill | Role |
|----------|-------|------|
| 1 | `hm-detective` | Codebase investigation (SCAN/READ/DEEP modes) |
| 2 | `hm-deep-research` | Version-matched deep research with citations |
| 3 | `hm-tech-stack-ingest` | Cache third-party docs for offline reference |

**Loading order:** hm-tech-stack-ingest (if stack cache needed) → hm-detective → hm-deep-research

### Category 2: Planning Tasks

**Intent signals:** "plan", "spec", "requirements", "design", "architect"

| Priority | Skill | Role |
|----------|-------|------|
| 1 | `hm-spec-driven-authoring` | Falsifiable requirements + acceptance criteria |
| 2 | `hm-planning-persistence` | 3-file external memory for multi-session planning |

**Loading order:** hm-planning-persistence (setup) → hm-spec-driven-authoring (content)

### Category 3: Execution Tasks

**Intent signals:** "implement", "build", "execute", "run the phase", "code"

| Priority | Skill | Role |
|----------|-------|------|
| 1 | `hm-phase-execution` | Wave-based parallelization + checkpoint recovery |
| 2 | `hm-cross-cutting-change` | Cross-pane modification safety for breaking changes |

**Loading order:** hm-phase-execution (primary) → hm-cross-cutting-change (when touching multiple layers)

### Category 4: Quality Tasks

**Intent signals:** "test", "verify", "quality", "validate", "TDD", "red-green-refactor"

| Priority | Skill | Role |
|----------|-------|------|
| 1 | `hm-test-driven-execution` | RED/GREEN/REFACTOR cycles with runtime truth |
| 2 | `hm-gate-orchestrator` | Quality gate triad pipeline (lifecycle → spec → evidence) |

**Loading order:** hm-test-driven-execution (implementation) → hm-gate-orchestrator (validation)

### Category 5: Debug Tasks

**Intent signals:** "debug", "fix", "broken", "failing", "error", "investigate issue"

| Priority | Skill | Role |
|----------|-------|------|
| 1 | `hm-debug` | Systematic debugging with persistent state |
| 2 | `hm-completion-looping` | Guardrail against premature completion claims |

**Loading order:** hm-debug (investigation) → hm-completion-looping (verification)

### Category 6: Review Tasks

**Intent signals:** "review", "audit", "readiness", "deploy check", "ship ready"

| Priority | Skill | Role |
|----------|-------|------|
| 1 | `hm-production-readiness` | Deployment safety verification (8 dimensions) |
| 2 | `hm-gate-orchestrator` | Quality gate triad for final approval |

**Loading order:** hm-production-readiness (evidence collection) → hm-gate-orchestrator (gate verification)

### Category 7: Command Routing & Execution

**Intent signals:** "execute command", "command dispatch", "slash command", "command routing", "list commands", "run command", "discover commands"

| Priority | Skill | Role |
|----------|-------|------|
| 1 | `hivemind-command-engine` | CQRS read-side — discover and analyze commands |
| 2 | `execute-slash-command` | Deterministic command execution (SDK POST /session/:id/command) |

**Loading order:** hivemind-command-engine first (list_commands for discovery), then execute-slash-command for selected command

**Notes:** Uses CQRS pattern — read-side (hivemind-command-engine) before write-side (execute-slash-command). Max 2 skills.

## Loading Rules

1. **Max 5 skills per bundle.** If a task needs more than 5, split the task.
2. **Load in priority order.** Lower-numbered skills load first.
3. **Respect dependencies.** If Skill B depends on Skill A's output, load A first.
4. **Classify before loading.** Determine the category before loading any skills.
5. **Multi-category tasks.** If a task spans 2 categories, load the primary category's bundle first, then add 1-2 skills from the secondary category (staying within the 5-skill limit).

### Multi-Category Decision Tree

```
Task spans 2 categories?
  → YES: Primary category gets full bundle (2-3 skills)
         Secondary category gets 1-2 skills from its bundle
         Total must be ≤ 5
  → NO:  Load single bundle (2-3 skills)

Task spans 3+ categories?
  → SPLIT THE TASK. No single task should span 3+ categories.
```

## Self-Correction

### Anti-Pattern 1: Overloading

**Detection:** More than 5 skills being loaded for a single task.
**Correction:** Split the task into subtasks. Each subtask gets its own bundle. Signal: "Task too broad — split into [A] and [B], then route each independently."

### Anti-Pattern 2: Wrong Lineage

**Detection:** Loading hf-* skills for an hm-* task, or vice versa.
**Correction:** This router handles hm-* lineage only. If the task is a meta-builder task (creating skills, agents, commands), route to hf-meta-builder instead. If the task is a product-dev task, use this router.

### Anti-Pattern 3: Missing Input

**Detection:** Task intent cannot be classified into any of the 6 categories.
**Correction:** If the task is genuinely new (e.g., "monitor production"), route to the closest category and flag: "No exact match. Routed to [closest category]. Verify the bundle covers the task's needs."

### Anti-Pattern 4: Stale Bundles

**Detection:** A loaded skill references another skill not in the current bundle, and the referenced skill is critical for the task.
**Correction:** Add the missing skill to the bundle if the total stays ≤ 5. If adding would exceed 5, remove the lowest-priority skill from the current bundle and document the trade-off.

## Quality Contract (HMQUAL Compliance)

| HMQUAL | Compliance | Evidence |
|--------|-----------|----------|
| HMQUAL-01 | Trigger phrases ≥7 in description | 12 trigger phrases in description |
| HMQUAL-02 | Self-correction with 4 anti-patterns | Overloading, Wrong Lineage, Missing Input, Stale Bundles |
| HMQUAL-03 | Cross-references to sibling skills | 13 skill references across 6 bundles + 4 consumer skills |
| HMQUAL-04 | Progressive disclosure | SKILL.md (routing map) + references/routing-map.md (detailed routing) |
| HMQUAL-05 | Evals with 3 scenarios | evals/evals.json — 3 trigger scenarios |
| HMQUAL-06 | Metrics scorecard | metrics/rich-gate-scorecard.md |
| HMQUAL-07 | Iron law enforcement | "Max 5 skills per bundle." |
| HMQUAL-08 | Honest RICH scoring | Scored in metrics/rich-gate-scorecard.md |

## Cross-References

| Related Skill | Boundary |
|---------------|----------|
| `hm-coordinating-loop` | Consumer — uses this router to determine skill bundles for delegated tasks |
| `hm-phase-execution` | Consumer — uses this router to determine execution-time skill loading |
| `hm-phase-loop` | Consumer — uses this router for iterative phase skill selection |
| `hm-subagent-delegation-patterns` | Consumer — uses this router to attach skill bundles to delegation packets |
| `hm-gate-orchestrator` | Referenced in Quality and Review bundles — the gate triad orchestrator |
