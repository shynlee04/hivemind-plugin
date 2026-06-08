---
name: hf-meta-builder-core
description: >
  Routes requests about OpenCode meta-concepts (skills, agents, commands,
  tools) to specialist authors in the Hivemind harness. Use when the user
  asks to "create a meta-builder", "add a hf-* agent", "configure
  hf-coordinator", "audit meta-builder lineage", or needs to navigate
  the hf-* specialist library. Classifies intent, navigates step-by-step,
  reports back. Does NOT create, edit, or execute domain work itself. Use
  when the user asks to "create a skill", "add an agent", "define a
  command", "write a custom tool", "audit a skill", "fix skill
  frontmatter", "author a workflow", or "stack authoring skills". The
  hf- lineage is FLEXIBLE per the 22-category prefix taxonomy. NOT for:
  hm-coord-router (intent classification for the L0 orchestrator);
  hivemind-power-on (session discovery and resume).
metadata:
  role: "router"
  pattern: "P2-Navigation"
  realm: "doc"
  version: "5.0.0"
  lineage: "hivemind"
  orientation: "how-to-process"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
---

# Meta-Builder Core

## Overview

Routes requests about OpenCode meta-concepts (skills, agents, commands,
tools) to the right specialist in the Hivemind hf-* library. Receives
intent, classifies, navigates step-by-step, reports back. Does NOT
create, edit, or execute domain work.

**When to load this skill:** the user wants to create, audit, stack, or
configure any OpenCode meta-concept but hasn't gone directly to a
specialist. This skill figures out what they need and routes them.

**When NOT to load this skill:** the user's request already matches a
specialist skill directly (e.g., they said "audit this skill" and
`hf-use-authoring-skills` is available). Route directly instead. For
runtime state or session recovery, use `hivemind-power-on`. For
intent-classification at the L0 entry point, use `hm-coord-router`.

### What This Skill Handles

| Concept  | What gets produced                              | Where it lives (source of truth) |
|----------|--------------------------------------------------|----------------------------------|
| Skills   | `SKILL.md` + optional `references/`, `assets/`  | `assets/skills/<name>/`          |
| Agents   | `.md` with frontmatter, permissions, flows       | `assets/agents/<name>.md`        |
| Commands | Thin shells with `$ARGUMENTS` parsing, agent binding | `assets/commands/<name>.md`  |
| Tools    | Zod schema designs, plugin hook patterns, lifecycle | `assets/agents/<builder>.md` + `src/` for custom tools |

**Source/deploy rule (per `.opencode/AGENTS.md`):** edit in `assets/`,
then `node scripts/sync-assets.js` mirrors to `.opencode/`. The
`.opencode/` directory is the deploy copy, not the source of truth.

### What This Skill Does NOT Handle

| Not this skill                              | Route to instead              |
|---------------------------------------------|-------------------------------|
| "Build a NextJS app" / "Add an API endpoint" | Project domain agents         |
| "Fix a TypeScript bug in `src/`"            | Builder or reviewer agent     |
| "Run the test suite"                        | Direct execution              |
| "Explain how React hooks work"              | Web search or direct answer   |
| Session discovery / resume                  | `hivemind-power-on`           |
| L0 intent classification                    | `hm-coord-router`             |

## Principles

- **Iterative few-step interactive** — one step, validate, show user,
  confirm, proceed. NOT autonomous long-horizon execution.
- **No direct execution** — route to specialists. Never create skills,
  agents, or commands yourself from this skill.
- **Max 3 skills per stack** — context window is shared. If you cannot
  explain why each skill is needed in one sentence, do not load it.
- **Standalone-first** — every meta-concept works with OpenCode alone.
  Hivemind runtime is bonus, not required.
- **Edit in `assets/`, test via `node scripts/sync-assets.js`** — source
  of truth is `assets/`. `.opencode/` is the deploy copy.

## Routing Table

| User intent                                              | Route to                          | Notes                         |
|----------------------------------------------------------|-----------------------------------|-------------------------------|
| "create a skill" / `/hf-create`                          | `hf-use-authoring-skills`         | Skill lifecycle + quality     |
| "audit this skill" / `/hf-audit`                         | `hf-use-authoring-skills`         | Quality + naming compliance   |
| "fix skill frontmatter" / "drop the `metadata.layer`"   | `hf-use-authoring-skills`         | Frontmatter surgery           |
| "create an agent" / "add a hf-* agent"                   | `hf-agents-and-subagents-dev`     | Agent definition + permissions |
| "define a command" / "set up a command"                  | `hf-command-dev`                  | Command shell + $ARGUMENTS     |
| "parse $ARGUMENTS" / "command parser"                    | `hf-command-parser`               | Propositional argument parser |
| "build a custom tool" / "add a tool the LLM can call"    | `hf-custom-tools-dev`             | Zod schema + plugin hook      |
| "author a workflow"                                      | `hf-use-authoring-skills`         | Workflow frontmatter + body   |
| "configure hf-coordinator" / "audit meta-builder lineage" | `hf-naming-syndicate`            | Prefix + lineage compliance   |
| "stack skills" / "combine skills" / `/hf-stack`          | this skill + target skills        | Max 3 per stack, self-routes  |
| "synthesize skills from GitHub" / "create skills from a repo" | `hf-skill-synthesis`         | Repo ingestion + extraction   |
| "detect drift between AGENTS.md and codebase"            | `hf-agents-md-sync`               | Sync audit + targeted edits   |
| "load hf skills for task"                                | `hf-skill-router`                 | Cross-lineage routing         |
| "enforce pre-delegation authorization"                   | `hf-delegation-gates`             | Capability matrix + gates     |
| "design an agent interface"                              | `hf-agent-composition`            | 3+ designs + synthesis        |
| "compose a specialist workflow from user intent"         | `hf-agent-composition`            | XML markup + step protocols   |
| ambiguous / "help me figure out" / "I'm not sure"        | `hm-coord-router`                 | Upstream L0 intent classifier |
| out of scope for any row above                           | do NOT activate this skill        | Route to owning specialist     |

**Fallback:** if a specialist skill is missing or broken, report
findings to the user and recommend manual creation. Do not improvise.

**Not for me:** if the request does not match any row above, do NOT
activate this skill. Route to the appropriate specialist directly.

## The Iron Law

```
NO STACK WITHOUT A REASON
```

Max 3 skills per stack. If you cannot explain why each skill is needed
in one sentence, do not load it. Context window is shared — every
unnecessary skill dilutes the ones that matter.

## Cross-References (shipped-only)

| Skill                     | Boundary                                        |
|---------------------------|-------------------------------------------------|
| `hm-coord-router`         | Upstream L0 intent classifier (different role)  |
| `hm-coord-loop`           | Multi-agent dispatch (when 3+ tasks parallel)   |
| `hm-platform-references`  | Routes platform/SDK questions to one skill      |
| `hm-config-governance`    | Config-driven governance rule editing           |
| `hm-gate-triad`           | 3-gate quality sequence (lifecycle → spec → evidence) |
| `hivemind-power-on`       | Session discovery + resume (load first)         |
| `hm-test-driven`          | TDD cycle (specialist example)                  |
| `hm-debug-systematic`     | Debug cycle (specialist example)                |
| `hm-arch-refactor`        | Architecture + refactor (specialist example)    |
| `hf-naming-syndicate`     | Prefix + lineage compliance (governance)        |
| `hf-use-authoring-skills` | Skill lifecycle + quality + frontmatter surgery |
| `hf-skill-router`         | Cross-lineage skill loading bundle selector     |

## GSD Compatibility

This skill is the canonical replacement for the gsd-* meta-builder
flow. If the loading agent has legacy gsd-* references, use this table:

| Legacy gsd-* primitive        | Hivemind equivalent                  |
|-------------------------------|--------------------------------------|
| `gsd-meta-builder`            | this skill (`hf-meta-builder-core`)  |
| `gsd-skill-authoring` flow    | `hf-use-authoring-skills`            |
| `gsd-agent-authoring` flow    | `hf-agents-and-subagents-dev`        |
| `gsd-command-authoring` flow  | `hf-command-dev`                     |
| `gsd-tool-authoring` flow     | `hf-custom-tools-dev`                |
| `gsd-skill-synthesis`         | `hf-skill-synthesis`                 |
| `gsd-naming-conventions`      | `hf-naming-syndicate`                |
| `gsd-context-engine`          | `hm-platform-references`             |

The hf-* lineage is FLEXIBLE per the 22-category prefix taxonomy and
covers all authoring, syncing, and synthesis concerns for OpenCode
meta-concepts.

## Validation Gate

Before declaring any meta-concept task complete:

- [ ] Output matches requirements (nothing extra, nothing missing)
- [ ] Output references shipped skills only (no archived l2/l3)
- [ ] No `metadata.layer: "0|2|3"` in shipped frontmatter
- [ ] No deprecated v1 product name tokens (see `hf-naming-syndicate` for the forbidden list)
- [ ] Description is third-person with 5+ trigger phrases
- [ ] Pattern and realm declared in frontmatter
- [ ] Committed to git with descriptive message
- [ ] TODO list created showing completion status
- [ ] User has confirmed delivery
