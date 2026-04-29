---
name: hm-l2-skill-router
description: >
  Maps agent task domains to hm-* skill loading bundles with priority ordering. Used by hm-orchestrator
  and hm-coordinator to determine which skills to load for incoming product-dev tasks. Triggers:
  "load skills for task", "map domain to skills", "skill loading bundle", "which hm skills",
  "product-dev skill router", "hm skill dispatch", "route task to hm skills", "determine skill bundle",
  "hm skill selection", "agent skill loading", "skill dispatch map", "task-to-skill mapping".
  NOT for executing skills — only for determining which hm-* skills to load. Max 3 skills per bundle.
metadata:
  layer: "2"
  role: "domain-execution"
  pattern: P2
  version: "1.0.0"
  lineage: "hm-*"
  task-group: "how-to-implement"
  routes-to: ["hm-*"]
  input-from: ["hm-orchestrator", "hm-coordinator"]
  consumed-by: ["hm-coordinating-loop", "hm-phase-execution", "hm-subagent-delegation-patterns"]
allowed-tools:
  - Read
  - Glob
  - Grep
---

# The Iron Law

```
Map every task domain to the correct hm-* skill bundle. Max 3 skills per bundle. Priority ordering is binding.
```

# HM Skill Router

## Overview

This router maps agent task domains to hm-* skill loading bundles. It is used by hm-orchestrator and hm-coordinator to dispatch skills before task execution. It does NOT execute skills — it only determines which skills to load and in what priority order.

This is a **dispatch router** — it bridges the gap between task classification (from hm-lineage-router) and concrete skill loading. While hm-lineage-router classifies task intent into broad categories, hm-skill-router provides the exact skill bundle with priority ordering.

**Twelve task domains, twelve skill bundles:**

| Domain | Skills | Max |
|--------|--------|-----|
| Research | hm-detective + hm-deep-research | 2 |
| Planning | hm-spec-driven-authoring + hm-planning-persistence | 2 |
| Implementation | hm-phase-execution + hm-cross-cutting-change | 2 |
| Quality | hm-test-driven-execution + hm-gate-orchestrator | 2 |
| Debug | hm-debug + hm-completion-looping | 2 |
| Review | hm-production-readiness | 1 |
| Architecture | hm-refactor + hm-roadmap-maintainability | 2 |
| Analysis | hm-requirements-analysis + hm-product-validation | 2 |
| Integration | hm-production-readiness + hm-cross-cutting-change | 2 |
| Brainstorm | hm-brainstorm | 1 |
| Ecosystem | hm-feature-ecosystem | 1 |
| Closure | hm-completion-looping + hm-test-driven-execution | 2 |

## On Load

1. Read `references/routing-map.md` — the complete dispatch map with domain signal tables and loading rules
2. Identify the task domain from the delegation context
3. Classify the task into one of the twelve domains
4. Return the skill bundle with priority ordering

## Trigger Phrases

- "load skills for task" / "what skills do I need for this task"
- "map domain to skills" / "which hm skills for this domain"
- "skill loading bundle" / "skill dispatch map"
- "product-dev skill router" / "hm skill dispatch"
- "route task to hm skills" / "determine skill bundle"
- "hm skill selection" / "agent skill loading"
- "task-to-skill mapping" / "skill routing table"

## Domain Dispatch Map

### Domain 1: Research

**Intent signals:** "investigate", "research", "find out", "analyze", "look into", "explore", "gather information"

| Priority | Skill | Role |
|----------|-------|------|
| 1 | `hm-detective` | Codebase investigation (SCAN/READ/DEEP modes) |
| 2 | `hm-deep-research` | Version-matched deep research with citations |

**Loading order:** hm-detective (codebase first) → hm-deep-research (external evidence)

### Domain 2: Planning

**Intent signals:** "plan", "spec", "write requirements", "design the interface", "architect"

| Priority | Skill | Role |
|----------|-------|------|
| 1 | `hm-spec-driven-authoring` | Falsifiable requirements + acceptance criteria |
| 2 | `hm-planning-persistence` | 3-file external memory for multi-session planning |

**Loading order:** hm-planning-persistence (setup) → hm-spec-driven-authoring (produce spec)

### Domain 3: Implementation

**Intent signals:** "implement", "build", "execute", "code", "write", "run the phase"

| Priority | Skill | Role |
|----------|-------|------|
| 1 | `hm-phase-execution` | Wave-based parallelization + checkpoint recovery |
| 2 | `hm-cross-cutting-change` | Cross-pane modification safety |

**Loading order:** hm-phase-execution (dispatch) → hm-cross-cutting-change (when touching multiple layers)

### Domain 4: Quality

**Intent signals:** "test", "verify", "validate quality", "TDD", "red-green-refactor", "check coverage"

| Priority | Skill | Role |
|----------|-------|------|
| 1 | `hm-test-driven-execution` | RED/GREEN/REFACTOR with runtime truth |
| 2 | `hm-gate-orchestrator` | Quality gate triad pipeline |

**Loading order:** hm-test-driven-execution (implement) → hm-gate-orchestrator (validate)

### Domain 5: Debug

**Intent signals:** "debug", "fix", "broken", "failing", "error", "investigate issue", "root cause"

| Priority | Skill | Role |
|----------|-------|------|
| 1 | `hm-debug` | Systematic debugging with persistent state |
| 2 | `hm-completion-looping` | Guardrail against premature completion claims |

**Loading order:** hm-debug (investigate) → hm-completion-looping (verify fix)

### Domain 6: Review

**Intent signals:** "review", "audit", "readiness", "deploy check", "ship ready", "pre-release"

| Priority | Skill | Role |
|----------|-------|------|
| 1 | `hm-production-readiness` | Deployment safety verification (8 dimensions) |

**Note:** Single-skill bundle. Review tasks are focused on deployment safety.

### Domain 7: Architecture

**Intent signals:** "refactor", "clean up", "restructure", "architecture review", "technical debt", "code organization"

| Priority | Skill | Role |
|----------|-------|------|
| 1 | `hm-refactor` | Surgical vs structural refactoring decisions |
| 2 | `hm-roadmap-maintainability` | Long-term maintainability scoring |

**Loading order:** hm-refactor (decide scope) → hm-roadmap-maintainability (evaluate trade-offs)

### Domain 8: Analysis

**Intent signals:** "analyze requirements", "diagnose gaps", "validate requirements", "find contradictions", "product validation"

| Priority | Skill | Role |
|----------|-------|------|
| 1 | `hm-requirements-analysis` | Formal requirements gap diagnosis |
| 2 | `hm-product-validation` | Product-lens validation against user impact |

**Loading order:** hm-requirements-analysis (detect gaps) → hm-product-validation (validate against users)

### Domain 9: Integration

**Intent signals:** "integrate", "cross-phase verification", "connect systems", "E2E flow", "integration check"

| Priority | Skill | Role |
|----------|-------|------|
| 1 | `hm-production-readiness` | Deployment safety verification |
| 2 | `hm-cross-cutting-change` | Cross-pane modification safety |

**Loading order:** hm-cross-cutting-change (safety check) → hm-production-readiness (integration verification)

### Domain 10: Brainstorm

**Intent signals:** "brainstorm", "ideation", "figure out what to build", "explore ideas", "clarify requirements"

| Priority | Skill | Role |
|----------|-------|------|
| 1 | `hm-brainstorm` | Structured ideation bridging intent to requirements brief |

**Note:** Single-skill bundle. Brainstorming is a focused creative domain.

### Domain 11: Ecosystem

**Intent signals:** "feature ecosystem", "cross-dependency", "feature ordering", "dependency graph", "interdependent features"

| Priority | Skill | Role |
|----------|-------|------|
| 1 | `hm-feature-ecosystem` | Feature dependency graph validation and ordering |

**Note:** Single-skill bundle. Ecosystem analysis is a specialized domain.

### Domain 12: Closure

**Intent signals:** "complete", "finish", "wrap up", "verify completion", "final check", "done"

| Priority | Skill | Role |
|----------|-------|------|
| 1 | `hm-completion-looping` | Guardrail against premature completion claims |
| 2 | `hm-test-driven-execution` | Final RED/GREEN/REFACTOR verification |

**Loading order:** hm-completion-looping (verify completion) → hm-test-driven-execution (re-verify with tests)

## Loading Rules

1. **Max 3 skills per bundle.** If a task genuinely needs more, split into subtasks.
2. **Load in priority order.** Priority 1 loads first, then Priority 2, then Priority 3.
3. **Trigger matching is inclusive.** If the task text matches any intent signal for a domain, load that bundle.
4. **Single-domain preference.** Default to one domain. Only cross-load when intent signals span 2 domains.
5. **Domain overlap resolution.** When signals match multiple domains (e.g., "analyze" = Analysis OR Research), use the primary verb match. Analyze requirements → Analysis. Analyze codebase → Research.

### Multi-Domain Resolution

```
Task spans 2 domains?
  → YES: Primary domain gets full bundle (1-2 skills)
         Secondary domain adds 1 skill
         Total must be ≤ 3
  → NO:  Load single domain bundle (1-2 skills)

Task spans 3+ domains?
  → SPLIT THE TASK. One task = one domain (or two at most).
```

### Domain-to-Lineage Routing

This router works downstream from hm-lineage-router. The lineage router provides the broad category classification; this router provides the exact skill bundle:

```
hm-lineage-router (6 broad categories)
       ↓
hm-skill-router (12 granular domains → exact skill bundles)
       ↓
Agent loads skills and executes
```

**Example chain:** "I need to analyze why users are dropping off at the checkout" → hm-lineage-router classifies as Research → hm-skill-router maps to Research domain → bundles hm-detective + hm-deep-research.

## Self-Correction

### Anti-Pattern 1: Domain Ambiguity

**Detection:** Task signals match 3+ domains with no clear primary (e.g., "investigate the failing architecture and plan a fix with tests").
**Correction:** Pick the PRIMARY action verb. "Fix" = Debug (primary). Secondary: Architecture (hm-refactor). Do not load all 3 domains. Signal: "Domain ambiguity detected. Primary action is [X]. Loading [domain] bundle. Consider splitting into subtasks if all domains need deep coverage."

### Anti-Pattern 2: Wrong Router

**Detection:** Task is a meta-builder task (creating skills/agents/commands) but hm-skill-router is being invoked.
**Correction:** This router handles hm-* product-dev tasks only. Route meta-builder tasks to hf-skill-router instead. Signal: "Meta-builder task detected. This is not a product-dev task. Use hf-skill-router for meta-builder dispatch."

### Anti-Pattern 3: Bundle Overload

**Detection:** More than 3 skills loaded for a single task after multi-domain resolution.
**Correction:** Enforce the hard cap. Remove the lowest-priority skill from the secondary domain. If skills are still >3, split the task. Signal: "Bundle exceeds 3-skill limit. Removed [skill] from secondary domain. Consider splitting task if critical coverage is lost."

### Anti-Pattern 4: Stale Dispatch

**Detection:** Loaded skill has been renamed, moved, or retired but is still in the bundle map.
**Correction:** Verify skill existence before dispatch. If a skill is missing, fall back to the closest alternative in the same domain or flag for bundle update. Signal: "Skill [name] not found. Falling back to [alternative]. Bundle map needs update — flag for hm-skill-router maintenance."

## Cross-References

| Related Skill | Boundary |
|---------------|----------|
| `hm-lineage-router` | Upstream router — classifies task intent into 6 broad categories before hm-skill-router maps to exact bundles |
| `hm-coordinating-loop` | Consumer — uses this router to determine skill bundles for coordinated multi-agent tasks |
| `hm-phase-execution` | Consumer — uses this router to attach skill bundles to phase execution dispatch |
| `hm-subagent-delegation-patterns` | Consumer — uses this router to determine which skills subagents need |
| `hf-skill-router` | Sibling router — handles hf-* meta-builder dispatch (complementary lineage) |

## Quality Contract (HMQUAL Compliance)

| HMQUAL | Compliance | Evidence |
|--------|-----------|----------|
| HMQUAL-01 | Trigger phrases ≥5 in description | 12 trigger phrases in description |
| HMQUAL-02 | Self-correction with 4 anti-patterns | Domain Ambiguity, Wrong Router, Bundle Overload, Stale Dispatch |
| HMQUAL-03 | Cross-references to sibling skills | 5 cross-referenced skills + 12 domain skills referenced |
| HMQUAL-04 | Progressive disclosure | SKILL.md (dispatch map) + references/routing-map.md (detailed signal tables) |
| HMQUAL-05 | Evals with 3+ scenarios | evals/evals.json — 6 trigger scenarios |
| HMQUAL-06 | Metrics scorecard | metrics/rich-gate-scorecard.md |
| HMQUAL-07 | Iron law enforcement | "Max 3 skills per bundle. Priority ordering is binding." |
| HMQUAL-08 | Honest RICH scoring | Scored in metrics/rich-gate-scorecard.md |
