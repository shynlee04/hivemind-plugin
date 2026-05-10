# Ecosystem Structure

The Hivefiver meta-builder ecosystem and its relationship to OpenCode runtime.

## Directory Map

```
.hivefiver-meta-builder/
├── skills-lab/active/refactoring/     ← Source of truth for skills
├── agents-lab/active/refactoring/     ← Source of truth for agents
├── commands-lab/active/refactoring/   ← Source of truth for commands
├── workflows-lab/active/refactoring/  ← Procedural logic
├── references-lab/active/refactoring/ ← Platform patterns
├── plans/                             ← Implementation plans
└── orchestrator/                      ← Coordinator definitions

.opencode/  ← Symlinks to labs (OpenCode reads here)
├── skills -> ../.hivefiver-meta-builder/skills-lab/active/refactoring
├── agents -> ../.hivefiver-meta-builder/agents-lab/active/refactoring
├── commands -> ../.hivefiver-meta-builder/commands-lab/active/refactoring
├── hivefiver/workflows -> ../../.hivefiver-meta-builder/workflows-lab/active/refactoring
└── hivefiver/references -> ../../.hivefiver-meta-builder/references-lab/active/refactoring
```

## Pipeline

```
.hivefiver-meta-builder/**-lab/active/refactoring/     ← EDIT HERE
        ↓ (symlinks, instant)
.opencode/{agents,commands,skills,hivefiver}/          ← LIVE TEST
        ↓ (when validated + graded)
TS runtime builder (opencode-harness npm package)      ← FINAL SHIP
        ↓ (when end-user configures)
User's opencode.json / opencode-harness.config.ts       ← RUNTIME COMPOSITION
```

## Key Rules

1. **Never edit `.opencode/` directly** — it is symlinks to the lab
2. **Every edit lands in the lab** — committed together with harness changes
3. **`.opencode/skills/` is canonical for OpenCode runtime** — but the lab is the source of truth
4. **Retired skills** go to `.hivefiver-meta-builder/skills-lab/retired/`

## Skill Naming Conventions

| Prefix | Scope | Example |
|--------|-------|---------|
| `hm-*` | Project / shared catalogue | `hm-coordinating-loop`, `hm-detective` |
| `hivefiver-*` | Meta-builder-group only | `hivefiver-use-authoring-skills`, `hivefiver-command-dev` |
| `gsd-*` | **Reserved for reference only** — do not use for new skills | `gsd-agent-composition` (to be re-authored) |

## Agent Hierarchy

| Level | Role | Examples |
|-------|------|----------|
| 1 | Primary Coordinator | `coordinator`, `conductor`, `hivefiver-orchestrator` |
| 2 | Pure Orchestrator | `hivefiver-skill-author`, `hivefiver-agent-builder` |
| 3 | Task-Completer | `builder`, `critic`, `researcher`, `explore` |
| — | Pure Swarm | `explore`, `gsd-codebase-mapper` |

## Permission Profile Rules

- Every agent frontmatter must declare `permission:` explicitly
- `bash:` must default to `ask` with explicit allow-list
- `task: ask` for level-3 task-completers
- `skill: "*": ask` + explicit allow-list
- Never `