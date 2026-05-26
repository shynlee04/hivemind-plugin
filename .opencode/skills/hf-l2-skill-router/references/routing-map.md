# Routing Map — hf-l2-skill-router

## Overview

Complete routing map for hf-l2-skill-router: meta-builder task domains → hf-* skill bundles with priority ordering, multi-domain resolution, exclusion rules, and FLEXIBLE cross-route documentation.

## Domain Definitions

### Agent Building
**Signals:** "create an agent", "add an agent", "write a subagent", "agent frontmatter", "define agent permissions", "agent composition"
**Bundle:** hf-l2-agents-and-subagents-dev → hf-l2-agent-composition

### Skill Authoring
**Signals:** "create a skill", "write a SKILL.md", "audit this skill", "skill frontmatter", "skill package", "synthesize a skill"
**Bundle:** hf-l2-use-authoring-skills → hf-l2-skill-synthesis

### Command Dev
**Signals:** "create a command", "add a command", "write a custom command", "$ARGUMENTS parsing", "command with bash injection"
**Bundle:** hf-l2-command-dev → hf-l2-command-parser

### Tool Building
**Signals:** "create a custom tool", "build an OpenCode plugin", "write a tool with Zod", "add a plugin hook"
**Bundle:** hf-l2-custom-tools-dev (single-skill)

### Audit
**Signals:** "audit skills", "audit agents", "audit commands", "drift detection", "quality compliance", "structural integrity"
**Bundle:** hf-l2-use-authoring-skills → hf-l2-agents-md-sync → gate-l3-evidence-truth

### Refactor
**Signals:** "refactor skills", "refactor agents", "clean up meta-concepts", "reduce technical debt in skills"
**Bundle:** hf-l2-agents-md-sync → hm-l2-refactor (FLEXIBLE cross-route)
**FLEXIBLE justification:** No hf-* skill covers structural refactoring methodology.

### Synthesis
**Signals:** "synthesize from GitHub", "extract patterns from repo", "build skill from codebase", "compress skills"
**Bundle:** hf-l2-skill-synthesis → hm-l3-synthesis (FLEXIBLE cross-route)
**FLEXIBLE justification:** No hf-* skill covers tiered artifact compression.

### Delegation
**Signals:** "delegation gates", "pre-delegation authorization", "capability matrix", "handoff boundary"
**Bundle:** hf-l2-delegation-gates (single-skill)

## Multi-Domain Resolution

| Combination | Primary | Secondary Add | Total |
|-------------|---------|---------------|-------|
| Audit + Refactor | Audit (3) | None (cap) | 3 |
| Agent Building + Audit | Agent Building (2) | hf-l2-use-authoring-skills (1) | 3 |
| Skill Authoring + Synthesis | Skill Authoring (2) | hm-l3-synthesis (1) | 3 |

**Rule:** Primary gets full bundle. Secondary adds 1 skill. Total ≤ 3.

## Exclusion Rules

| Task Type | Route To |
|-----------|---------|
| Product-dev | hm-l2-skill-router |
| Simple file ops | No skill needed |
| Git operations | No skill needed |
| Conversational | No skill needed |

## FLEXIBLE Cross-Routes

| Domain | Skill | Justification |
|--------|-------|---------------|
| Refactor | hm-l2-refactor | No hf-* structural refactoring methodology |
| Synthesis | hm-l3-synthesis | No hf-* artifact compression |

**Rules:** hm-* secondary only. Must document justification. Must verify no hf-* alternative. Counts toward 3-skill limit.
