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
  version: "2.0.0"
  lineage: "hm-*"
  task-group: "how-to-implement"
  routes-to: ["hm-*", "gate-*"]
  input-from: ["hm-l0-orchestrator", "hm-l1-coordinator"]
  consumed-by: ["hm-l2-coordinating-loop", "hm-l2-phase-execution", "hm-l2-subagent-delegation-patterns"]
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

This is a **dispatch router** — it bridges the gap between task classification (from hm-l2-lineage-router) and concrete skill loading. While hm-l2-lineage-router classifies task intent into broad categories, hm-l2-skill-router provides the exact skill bundle with priority ordering and depth-qualified names.

**Twelve task domains, twelve skill bundles:**

| Domain | Skills | Max |
|--------|--------|-----|
| Research | hm-l3-detective + hm-l3-deep-research + hm-l3-tech-stack-ingest | 3 |
| Planning | hm-l2-spec-driven-authoring + hm-l2-planning-persistence | 2 |
| Implementation | hm-l2-phase-execution + hm-l2-cross-cutting-change | 2 |
| Quality | hm-l2-test-driven-execution + hm-l2-gate-orchestrator | 2 |
| Debug | hm-l2-debug + hm-l2-completion-looping | 2 |
| Review | hm-l2-production-readiness + gate-l3-evidence-truth | 2 |
| Architecture | hm-l2-refactor + hm-l2-roadmap-maintainability | 2 |
| Analysis | hm-l2-requirements-analysis + hm-l2-product-validation | 2 |
| Brainstorm | hm-l2-brainstorm + hm-l2-user-intent-interactive-loop | 2 |
| Ecosystem | hm-l2-feature-ecosystem | 1 |
| Guardrail | hm-l2-phase-loop + hm-l2-completion-looping | 2 |
| Research Chain | hm-l3-research-chain + hm-l3-synthesis | 2 |

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
- "which skills do I load" / "bundle dispatch"

## Domain Dispatch Map

### Domain 1: Research

**Intent signals:** "investigate", "research", "find out", "analyze codebase", "look into", "explore", "gather information"

| Priority | Skill | Role |
|----------|-------|------|
| 1 | `hm-l3-detective` | Codebase investigation (SCAN/READ/DEEP modes) |
| 2 | `hm-l3-deep-research` | Version-matched deep research with citations |
| 3 | `hm-l3-tech-stack-ingest` | Cache third-party docs for offline reference |

**Loading order:** hm-l3-tech-stack-ingest (cache deps) → hm-l3-detective (scan codebase) → hm-l3-deep-research (external evidence)

### Domain 2: Planning

**Intent signals:** "plan", "spec", "write requirements", "design the interface", "architect", "spec-driven"

| Priority | Skill | Role |
|----------|-------|------|
| 1 | `hm-l2-spec-driven-authoring` | Falsifiable requirements + acceptance criteria |
| 2 | `hm-l2-planning-persistence` | 3-file external memory for multi-session planning |

**Loading order:** hm-l2-planning-persistence (setup) → hm-l2-spec-driven-authoring (produce spec)

### Domain 3: Implementation

**Intent signals:** "implement", "build", "execute", "code", "write", "run the phase"

| Priority | Skill | Role |
|----------|-------|------|
| 1 | `hm-l2-phase-execution` | Wave-based parallelization + checkpoint recovery |
| 2 | `hm-l2-cross-cutting-change` | Cross-pane modification safety |

**Loading order:** hm-l2-phase-execution (dispatch) → hm-l2-cross-cutting-change (when touching multiple layers)

### Domain 4: Quality

**Intent signals:** "test", "verify", "validate quality", "TDD", "red-green-refactor", "check coverage"

| Priority | Skill | Role |
|----------|-------|------|
| 1 | `hm-l2-test-driven-execution` | RED/GREEN/REFACTOR with runtime truth |
| 2 | `hm-l2-gate-orchestrator` | Quality gate triad pipeline |

**Loading order:** hm-l2-test-driven-execution (implement) → hm-l2-gate-orchestrator (validate)

### Domain 5: Debug

**Intent signals:** "debug", "fix", "broken", "failing", "error", "investigate issue", "root cause"

| Priority | Skill | Role |
|----------|-------|------|
| 1 | `hm-l2-debug` | Systematic debugging with persistent state |
| 2 | `hm-l2-completion-looping` | Guardrail against premature completion claims |

**Loading order:** hm-l2-debug (investigate) → hm-l2-completion-looping (verify fix)

### Domain 6: Review

**Intent signals:** "review", "audit", "readiness", "deploy check", "ship ready", "pre-release", "evidence check"

| Priority | Skill | Role |
|----------|-------|------|
| 1 | `hm-l2-production-readiness` | Deployment safety verification (8 dimensions) |
| 2 | `gate-l3-evidence-truth` | Terminal evidence gate (L1-L5 hierarchy) |

**Loading order:** hm-l2-production-readiness (collect evidence) → gate-l3-evidence-truth (terminal gate)

### Domain 7: Architecture

**Intent signals:** "refactor", "clean up", "restructure", "architecture review", "technical debt", "code organization"

| Priority | Skill | Role |
|----------|-------|------|
| 1 | `hm-l2-refactor` | Surgical vs structural refactoring decisions |
| 2 | `hm-l2-roadmap-maintainability` | Long-term maintainability scoring |

**Loading order:** hm-l2-refactor (decide scope) → hm-l2-roadmap-maintainability (evaluate trade-offs)

### Domain 8: Analysis

**Intent signals:** "analyze requirements", "diagnose gaps", "validate requirements", "find contradictions", "product validation"

| Priority | Skill | Role |
|----------|-------|------|
| 1 | `hm-l2-requirements-analysis` | Formal requirements gap diagnosis |
| 2 | `hm-l2-product-validation` | Product-lens validation against user impact |

**Loading order:** hm-l2-requirements-analysis (detect gaps) → hm-l2-product-validation (validate against users)

### Domain 9: Brainstorm

**Intent signals:** "brainstorm", "ideation", "figure out what to build", "explore ideas", "clarify requirements", "I have a vague idea"

| Priority | Skill | Role |
|----------|-------|------|
| 1 | `hm-l2-brainstorm` | Structured ideation bridging intent to requirements brief |
| 2 | `hm-l2-user-intent-interactive-loop` | Interactive probing for ambiguous intent |

**Loading order:** hm-l2-brainstorm (ideation) → hm-l2-user-intent-interactive-loop (if intent remains unclear)

### Domain 10: Ecosystem

**Intent signals:** "feature ecosystem", "cross-dependency", "feature ordering", "dependency graph", "interdependent features"

| Priority | Skill | Role |
|----------|-------|------|
| 1 | `hm-l2-feature-ecosystem` | Feature dependency graph validation and ordering |

**Note:** Single-skill bundle. Ecosystem analysis is a specialized domain.

### Domain 11: Guardrail

**Intent signals:** "guardrail", "phase loop", "loop until", "iterate phase", "exit criteria", "entry gate", "loop guard"

| Priority | Skill | Role |
|----------|-------|------|
| 1 | `hm-l2-phase-loop` | Iterative phase execution with entry/exit criteria |
| 2 | `hm-l2-completion-looping` | Guardrail against premature completion claims |

**Loading order:** hm-l2-phase-loop (manage iterations) → hm-l2-completion-looping (verify completion)

### Domain 12: Research Chain

**Intent signals:** "research chain", "ingest stack", "detect codebase", "synthesize findings", "multi-stage research", "compact findings"

| Priority | Skill | Role |
|----------|-------|------|
| 1 | `hm-l3-research-chain` | Orchestrate full research pipeline (ingest→detect→research→synthesize) |
| 2 | `hm-l3-synthesis` | Compress findings into actionable artifacts |

**Loading order:** hm-l3-research-chain (orchestrate) → hm-l3-synthesis (compress and deliver)

## Loading Rules

1. **Max 3 skills per bundle.** If a task genuinely needs more, split into subtasks.
2. **Load in priority order.** Priority 1 loads first, then Priority 2, then Priority 3.
3. **Trigger matching is inclusive.** If the task text matches any intent signal for a domain, load that bundle.
4. **Single-domain preference.** Default to one domain. Only cross-load when intent signals span 2 domains.
5. **Domain overlap resolution.** When signals match multiple domains (e.g., "analyze" = Analysis OR Research), use the primary verb match. Analyze requirements → Analysis. Analyze codebase → Research.
6. **Depth qualification is mandatory.** All skill names use `{lineage}-{depth}-{name}` format. This ensures the correct skill file is loaded regardless of future renames.

### Multi-Domain Resolution

```
Task spans 2 domains?
  → YES: Primary domain gets full bundle (1-3 skills)
         Secondary domain adds 1 skill
         Total must be ≤ 3
  → NO:  Load single domain bundle (1-3 skills)

Task spans 3+ domains?
  → SPLIT THE TASK. One task = one domain (or two at most).
```

### Domain-to-Lineage Routing

This router works downstream from hm-l2-lineage-router. The lineage router provides the broad category classification; this router provides the exact skill bundle with depth-qualified names:

```
hm-l2-lineage-router (6 broad categories)
       ↓
hm-l2-skill-router (12 granular domains → exact skill bundles)
       ↓
Agent loads skills and executes
```

**Example chain:** "I need to analyze why users are dropping off at the checkout" → hm-l2-lineage-router classifies as Research → hm-l2-skill-router maps to Research domain → bundles hm-l3-detective + hm-l3-deep-research + hm-l3-tech-stack-ingest.

## Self-Correction

### Anti-Pattern 1: Domain Ambiguity

**Detection:** Task signals match 3+ domains with no clear primary (e.g., "investigate the failing architecture and plan a fix with tests").
**Correction:** Pick the PRIMARY action verb. "Fix" = Debug (primary). Secondary: Architecture (hm-l2-refactor). Do not load all 3 domains. Signal: "Domain ambiguity detected. Primary action is [X]. Loading [domain] bundle. Consider splitting into subtasks if all domains need deep coverage."

### Anti-Pattern 2: Wrong Router

**Detection:** Task is a meta-builder task (creating skills/agents/commands) but hm-l2-skill-router is being invoked.
**Correction:** This router handles hm-* product-dev tasks only. Route meta-builder tasks to hf-l2-skill-router instead. Signal: "Meta-builder task detected. This is not a product-dev task. Use hf-l2-skill-router for meta-builder dispatch."

### Anti-Pattern 3: Bundle Overload

**Detection:** More than 3 skills loaded for a single task after multi-domain resolution.
**Correction:** Enforce the hard cap. Remove the lowest-priority skill from the secondary domain. If skills are still >3, split the task. Signal: "Bundle exceeds 3-skill limit. Removed [skill] from secondary domain. Consider splitting task if critical coverage is lost."

### Anti-Pattern 4: Stale Dispatch

**Detection:** Loaded skill has been renamed, moved, or retired but is still in the bundle map.
**Correction:** Verify skill existence before dispatch. If a skill is missing, fall back to the closest alternative in the same domain or flag for bundle update. Signal: "Skill [name] not found. Falling back to [alternative]. Bundle map needs update — flag for hm-l2-skill-router maintenance."

## Cross-References

| Related Skill | Boundary |
|---------------|----------|
| `hm-l2-lineage-router` | Upstream router — classifies task intent into 6 broad categories before hm-l2-skill-router maps to exact bundles |
| `hm-l2-coordinating-loop` | Consumer — uses this router to determine skill bundles for coordinated multi-agent tasks |
| `hm-l2-phase-execution` | Consumer — uses this router to attach skill bundles to phase execution dispatch |
| `hm-l2-subagent-delegation-patterns` | Consumer — uses this router to determine which skills subagents need |
| `hf-l2-skill-router` | Sibling router — handles hf-* meta-builder dispatch (complementary lineage) |
| `hm-l2-gate-orchestrator` | Referenced in Quality domain — orchestrates the gate triad pipeline |
| `gate-l3-evidence-truth` | Referenced in Review domain — terminal evidence gate |

## Quality Contract (HMQUAL Compliance)

| HMQUAL | Compliance | Evidence |
|--------|-----------|----------|
| HMQUAL-01 | Trigger phrases ≥8 in description | 16 trigger phrases in description |
| HMQUAL-02 | Self-correction with 4 anti-patterns | Domain Ambiguity, Wrong Router, Bundle Overload, Stale Dispatch |
| HMQUAL-03 | Cross-references to sibling skills | 7 cross-referenced skills + 12 domain skills referenced |
| HMQUAL-04 | Progressive disclosure | SKILL.md (dispatch map) + references/routing-map.md (detailed signal tables) |
| HMQUAL-05 | Evals with 6+ scenarios | evals/evals.json — 6 trigger scenarios (3 positive, 2 negative, 1 boundary) |
| HMQUAL-06 | Metrics scorecard | metrics/rich-gate-scorecard.md |
| HMQUAL-07 | Iron law enforcement | "Max 3 skills per bundle. Priority ordering is binding." |
| HMQUAL-08 | Honest RICH scoring | Scored in metrics/rich-gate-scorecard.md |
