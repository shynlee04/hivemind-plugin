---
name: "harness-overview"
description: "Quick reference guide for the OpenCode harness — architecture, agent catalog, tool catalog, commands, configuration, and file conventions. Essential orientation for any agent joining the harness."
---

# Harness Overview

## Architecture: 8-Layer Control Plane

```
┌─────────────────────────────────┐
│  1. Skills      (behavior mods) │
│  2. Agents      (role players)  │
│  3. Tools       (capabilities)  │
│  4. Commands    (user triggers) │
│  5. Config      (opencode.json)│
│  6. Files       (working memory)│
│  7. Wisdom      (cross-session) │
│  8. Guard Rails (safety net)    │
└─────────────────────────────────┘
```

Each layer is independent and composable. Skills modify behavior, agents execute, tools provide capability, commands trigger workflows.

## Agent Catalog

| Agent | Role | When to Use |
|-------|------|-------------|
| conductor | Orchestrates multi-agent workflows | Complex tasks needing coordination |
| researcher | Explores codebase, gathers facts | Investigation, discovery, context-building |
| builder | Implements changes, writes code | Feature work, bug fixes, refactoring |
| critic | Reviews, tests, validates | Quality gates, testing, code review |

**Routing rule**: If task complexity > 3 steps → conductor. If purely exploratory → researcher. If implementation is clear → builder. If verification needed → critic.

## Tool Catalog

| Tool | Purpose |
|------|---------|
| delegate-task | Plugin-provided tool the conductor uses to launch specialist work under controlled permissions and session rules |
| context-checkpoint_save | Standalone tool that saves agent context at critical points |
| context-checkpoint_restore | Standalone tool that restores previously saved agent context |

### Plugin Hook Control Plane

- Circuit breaker behavior lives in the plugin hook control plane, not as a standalone tool
- Compaction preservation lives in the plugin hook control plane to protect critical context during session compaction
- Metadata enrichment lives in the plugin hook control plane to attach orchestration context to delegated work

## Command Catalog

| Command | Purpose |
|---------|---------|
| /ultrawork | Enter deep focus mode and drive each specialist phase through `delegate-task` |
| /start-work | Execute pending plan phases through controlled delegation |
| /plan | Create or update `task_plan.md` in the project root, then hand execution to `/start-work` |
| /harness-doctor | Diagnose harness health — check config, skills, and plugin control path |

## Configuration

### Root `opencode.json` (canonical harness config)
```json
{
  "$schema": "https://opencode.ai/config.json",
  "instructions": [
    "./.opencode/rules/harness-rules.md"
  ],
  "plugin": [
    "./.opencode/plugins/harness-control-plane.ts"
  ],
  "permission": {
    "read": "allow",
    "edit": "ask",
    "task": "ask",
    "skill": "allow"
  },
  "compaction": {
    "auto": true,
    "prune": true,
    "reserved": 15000
  }
}
```

### Auto-detected (no config needed)
- Project type (from package.json, Cargo.toml, go.mod, etc.)
- Test framework (from existing test files)
- Lint/format tools (from devDependencies)
- Git branch and status

## File Conventions

Runtime planning files live in the project root so the harness stays portable across repos. The root `opencode.json` is the canonical runtime config for the standalone pack. If this harness bundle also contains `.opencode/planning/*`, treat those files as harness-development artifacts for this experiment only, not as runtime requirements.

| File | Purpose | Lifecycle |
|------|---------|-----------|
| `task_plan.md` | Phase tracker for current task | Created in project root at task start, deleted at task end |
| `findings.md` | Accumulated research discoveries | Created in project root during research, consumed during build |
| `progress.md` | Timestamped session log | Appended in project root throughout task, archived at end |
| .harness/wisdom/ | Cross-session learnings | Persistent, cleaned weekly |
| .harness/wisdom/learnings.md | Facts and conventions | Persistent |
| .harness/wisdom/decisions.md | Architecture decisions | Persistent |
| .harness/wisdom/issues.md | Known problems and fixes | Persistent |

## Quick Start

1. Read `.harness/wisdom/` for project context
2. Check project-root `task_plan.md` for any in-progress work
3. Use the right agent for the job
4. Follow planning-with-files skill for complex tasks
5. Write learnings to wisdom when done
