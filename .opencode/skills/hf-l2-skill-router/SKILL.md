---
name: hf-l2-skill-router
description: >
  Maps meta-builder task domains to hf-* skill loading bundles with priority ordering. Used by hf-orchestrator
  and hf-coordinator to determine which skills to load for meta-builder tasks. Triggers:
  "load hf skills for task", "map meta-builder domain to skills", "hf skill loading bundle",
  "which hf skills", "meta-builder skill router", "hf skill dispatch", "route meta-builder task",
  "determine hf skill bundle", "hf skill selection", "meta-builder skill dispatch map",
  "task-to-hf-skill mapping", "hf routing table", "load skills for meta builder".
  NOT for executing skills — only for determining which hf-* skills to load. Max 3 skills per bundle.
  FLEXIBLE lineage — may route to hm-* skills for cross-validation when no hf-* skill covers the domain.
metadata:
  layer: "2"
  role: "domain-execution"
  pattern: P2
  version: "1.0.0"
  lineage: "hf-*"
  task-group: "how-to-implement"
  routes-to: ["hf-*", "hm-*"]
  input-from: ["hf-l0-orchestrator", "hf-l1-coordinator"]
  consumed-by: ["hf-l2-meta-builder", "hm-l2-coordinating-loop"]
  flexibility: "FLEXIBLE — may route to hm-* skills for cross-validation"
allowed-tools:
  - Read
  - Glob
  - Grep
---

# The Iron Law

```
Map every meta-builder task domain to the correct hf-* skill bundle. Max 3 skills per bundle. Priority ordering is binding. Cross-route to hm-* only when no hf-* skill covers the domain.
```

# HF Skill Router

## Overview

This router maps meta-builder task domains to hf-* skill loading bundles. It is used by hf-orchestrator and hf-coordinator to dispatch skills before meta-builder task execution. It does NOT execute skills — it only determines which skills to load and in what priority order.

This is a **dispatch router** specifically for the meta-builder lineage. While hm-l2-skill-router handles product-dev domains, hf-l2-skill-router handles meta-concept creation, auditing, and assembly domains.

**FLEXIBLE lineage note:** This router may route to hm-* skills for cross-validation when no hf-* skill covers the domain. The FLEXIBLE designation means hm-* skills are allowed as secondary/fill-in bundles, not primary.

**Eight task domains, eight skill bundles:**

| Domain | Skills | Max |
|--------|--------|-----|
| Agent Building | hf-l2-agents-and-subagents-dev + hf-l2-agent-composition | 2 |
| Skill Authoring | hf-l2-use-authoring-skills + hf-l2-skill-synthesis | 2 |
| Command Dev | hf-l2-command-dev + hf-l2-command-parser | 2 |
| Tool Building | hf-l2-custom-tools-dev | 1 |
| Audit | hf-l2-use-authoring-skills + hf-l2-agents-md-sync + gate-l3-evidence-truth | 3 |
| Refactor | hf-l2-agents-md-sync + hm-l2-refactor | 2 |
| Synthesis | hf-l2-skill-synthesis + hm-l3-synthesis | 2 |
| Delegation | hf-l2-delegation-gates | 1 |

## On Load

1. Read `references/routing-map.md` — the complete dispatch map with domain signal tables and loading rules
2. Identify the task domain from the delegation context
3. Classify the task into one of the eight domains
4. Return the skill bundle with priority ordering
5. If cross-routing to hm-* skills, note the FLEXIBLE lineage justification

## Trigger Phrases

- "load hf skills for task" / "which hf skills do I need"
- "map meta-builder domain to skills" / "hf skill loading bundle"
- "meta-builder skill router" / "hf skill dispatch"
- "route meta-builder task" / "determine hf skill bundle"
- "hf skill selection" / "meta-builder skill dispatch map"
- "task-to-hf-skill mapping" / "hf routing table"
- "load skills for meta builder" / "which skills for creating agents"
- "meta-builder dispatch" / "load hf bundle"

## Domain Dispatch Map

### Domain 1: Agent Building

**Intent signals:** "create an agent", "add an agent", "write a subagent", "agent frontmatter", "define agent permissions", "agent composition"

| Priority | Skill | Role |
|----------|-------|------|
| 1 | `hf-l2-agents-and-subagents-dev` | Agent architecture, permissions, subagent dispatch protocols |
| 2 | `hf-l2-agent-composition` | XML markup grammar, step protocols, structured return formats |

**Loading order:** hf-l2-agents-and-subagents-dev (architecture + permissions) → hf-l2-agent-composition (composition format)

### Domain 2: Skill Authoring

**Intent signals:** "create a skill", "write a SKILL.md", "audit this skill", "skill frontmatter", "skill package", "synthesize a skill"

| Priority | Skill | Role |
|----------|-------|------|
| 1 | `hf-l2-use-authoring-skills` | Skill quality framework, TDD for skills, cross-platform compatibility |
| 2 | `hf-l2-skill-synthesis` | Pattern extraction from repos, eval frameworks, skill scaffolds |

**Loading order:** hf-l2-use-authoring-skills (quality framework) → hf-l2-skill-synthesis (pattern extraction)

### Domain 3: Command Dev

**Intent signals:** "create a command", "add a command", "write a custom command", "$ARGUMENTS parsing", "command with bash injection"

| Priority | Skill | Role |
|----------|-------|------|
| 1 | `hf-l2-command-dev` | Command structure, YAML frontmatter, $ARGUMENTS, !bash, non-interactive shell safety |
| 2 | `hf-l2-command-parser` | Propositional command parsing, named arguments, flag extraction |

**Loading order:** hf-l2-command-dev (structure + safety) → hf-l2-command-parser (argument parsing)

### Domain 4: Tool Building

**Intent signals:** "create a custom tool", "build an OpenCode plugin", "write a tool with Zod", "add a plugin hook"

| Priority | Skill | Role |
|----------|-------|------|
| 1 | `hf-l2-custom-tools-dev` | Tool definitions with Zod schemas, plugin lifecycle hooks, CLI scripts |

**Note:** Single-skill bundle. Tool building is a focused domain.

### Domain 5: Audit

**Intent signals:** "audit skills", "audit agents", "audit commands", "drift detection", "quality compliance", "structural integrity", "audit project"

| Priority | Skill | Role |
|----------|-------|------|
| 1 | `hf-l2-use-authoring-skills` | Cross-primitive quality scoring |
| 2 | `hf-l2-agents-md-sync` | Drift detection between AGENTS.md and actual state |
| 3 | `gate-l3-evidence-truth` | Terminal evidence gate — validates audit findings have runtime proof |

**Loading order:** hf-l2-use-authoring-skills (quality check) → hf-l2-agents-md-sync (drift check) → gate-l3-evidence-truth (evidence validation)

### Domain 6: Refactor

**Intent signals:** "refactor skills", "refactor agents", "clean up meta-concepts", "restructure skill", "reduce technical debt in skills"

| Priority | Skill | Role |
|----------|-------|------|
| 1 | `hf-l2-agents-md-sync` | Sync pattern for meta-concept refactoring |
| 2 | `hm-l2-refactor` | Surgical vs structural refactoring decisions (FLEXIBLE cross-route) |

**Loading order:** hf-l2-agents-md-sync (sync scope) → hm-l2-refactor (refactoring methodology)

**FLEXIBLE note:** hm-l2-refactor is a product-dev skill. Cross-routed because no hf-* skill covers structural refactoring methodology. This is a documented, intentional cross-lineage route.

### Domain 7: Synthesis

**Intent signals:** "synthesize from GitHub", "extract patterns from repo", "build skill from codebase", "compress skills", "generate evals from patterns"

| Priority | Skill | Role |
|----------|-------|------|
| 1 | `hf-l2-skill-synthesis` | Pattern extraction, classification, eval frameworks from repos |
| 2 | `hm-l3-synthesis` | Tiered reduction, artifact compression (FLEXIBLE cross-route) |

**Loading order:** hf-l2-skill-synthesis (extract patterns) → hm-l3-synthesis (compress findings)

**FLEXIBLE note:** hm-l3-synthesis is a product-dev research skill. Cross-routed for its artifact compression methodology which applies to skill synthesis output.

### Domain 8: Delegation

**Intent signals:** "delegation gates", "pre-delegation authorization", "capability matrix", "agent permissions", "handoff boundary", "delegation approval"

| Priority | Skill | Role |
|----------|-------|------|
| 1 | `hf-l2-delegation-gates` | Pre-delegation authorization, capability matrices, handoff approval |

**Note:** Single-skill bundle. Delegation gates are a focused security domain.

## Loading Rules

1. **Max 3 skills per bundle.** If a task genuinely needs more, split into subtasks.
2. **Load in priority order.** Priority 1 loads first, then Priority 2, then Priority 3.
3. **Trigger matching is inclusive.** If the task text matches any intent signal for a domain, load that bundle.
4. **Single-domain preference.** Default to one domain. Only cross-load when intent signals span 2 domains.
5. **Domain overlap resolution.** When signals match multiple domains, use the primary action verb.
6. **FLEXIBLE cross-routing.** hm-* skills are allowed when no hf-* skill covers the domain. Document the justification. Never make hm-* the primary — hf-* skills are primary in this router.
7. **Depth qualification is mandatory.** All skill names use `{lineage}-{depth}-{name}` format.

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

### Lineage Boundary

```
Meta-builder task → hf-l2-skill-router → hf-* bundles (FLEXIBLE hm-* cross-routes)
Product-dev task  → hm-l2-skill-router → hm-* bundles
```

## Self-Correction

### Anti-Pattern 1: Domain Ambiguity

**Detection:** Task signals match 3+ domains with no clear primary.
**Correction:** Pick the PRIMARY action verb. Split if necessary. Signal: "Task spans 3 domains. Split into subtasks and route each independently."

### Anti-Pattern 2: Wrong Router

**Detection:** Task is a product-dev task but hf-l2-skill-router is being invoked.
**Correction:** Route product-dev tasks to hm-l2-skill-router instead. Signal: "Product-dev task detected. Use hm-l2-skill-router."

### Anti-Pattern 3: Unjustified Cross-Routing

**Detection:** Cross-routing to hm-* skills without documentation or when an hf-* skill covers the domain.
**Correction:** Verify that no hf-* skill can serve the need. Signal: "Unjustified cross-route to [hm-skill]. [hf-skill] already covers this domain."

### Anti-Pattern 4: Bundle Overload

**Detection:** More than 3 skills loaded after multi-domain resolution or cross-routing.
**Correction:** Enforce the hard cap. Remove the lowest-priority skill. Signal: "Bundle exceeds 3-skill limit. Consider splitting task."

## Cross-References

| Related Skill | Boundary |
|---------------|----------|
| `hm-l2-skill-router` | Sibling router — handles hm-* product-dev dispatch |
| `hf-l2-meta-builder` | Consumer — uses this router for meta-builder tasks |
| `hm-l2-coordinating-loop` | Consumer — uses this router for coordinated dispatch |
| `hm-l2-lineage-router` | Upstream classifier — provides broad task categories |
| `hf-l2-use-authoring-skills` | Referenced in Skill Authoring and Audit domains |
| `hf-l2-agents-md-sync` | Referenced in Audit and Refactor domains |
| `gate-l3-evidence-truth` | Referenced in Audit domain — terminal evidence gate |
| `hm-l2-refactor` | FLEXIBLE cross-route in Refactor domain |
| `hm-l3-synthesis` | FLEXIBLE cross-route in Synthesis domain |

## Quality Contract (HMQUAL Compliance)

| HMQUAL | Compliance | Evidence |
|--------|-----------|----------|
| HMQUAL-01 | Trigger phrases ≥8 | 16 trigger phrases in description |
| HMQUAL-02 | Self-correction with 4 anti-patterns | Domain Ambiguity, Wrong Router, Unjustified Cross-Routing, Bundle Overload |
| HMQUAL-03 | Cross-references to sibling skills | 9 cross-referenced skills |
| HMQUAL-04 | Progressive disclosure | SKILL.md + references/routing-map.md |
| HMQUAL-05 | Evals with 6+ scenarios | evals/evals.json — 6 trigger scenarios |
| HMQUAL-06 | Metrics scorecard | metrics/rich-gate-scorecard.md |
| HMQUAL-07 | Iron law enforcement | "Max 3 skills per bundle. Priority ordering is binding." |
| HMQUAL-08 | Honest RICH scoring | Scored in metrics/rich-gate-scorecard.md |
