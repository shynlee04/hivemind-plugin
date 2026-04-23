# Ecosystem Structure

## What LLMs Don't Know

The Hivefiver ecosystem is NOT a collection of individual files. It's a **pipeline**: labs → symlinks → `.opencode/` → TS runtime. Understanding this structure is critical for any delegation or inspection work.

---

## The Three Entities

| Entity | Role | Boundary |
|--------|------|----------|
| **OpenCode** | Agent coding harness CLI — the platform/OS | Native capabilities: agents, commands, skills, tools, plugins |
| **HiveMind** | Parent framework wrapping OpenCode | Houses both Hivefiver + Hiveminder |
| **Hivefiver** | Meta-builder module | Creates/audits/stacks OpenCode concepts. Tests in labs, ships as TS runtime |
| **Hiveminder** | Project-builder agent lineage | Handles "let's build a NextJS app" — DO NOT TOUCH |

---

## The Pipeline

```
.hivefiver-hm-meta-builder/**-lab/     ← Source of truth (edit here)
        ↓ symlinks
.opencode/{agents,commands,skills}/  ← Live testing (OpenCode reads here)
        ↓ when validated
TS runtime builder (opencode-harness) ← Final shipping format
```

### Symlink Map

| `.opencode/` path | → Lab directory |
|---|---|
| `.opencode/agents/` | `../.hivefiver-hm-meta-builder/agents-lab/active/refactoring/` |
| `.opencode/commands/` | `../.hivefiver-hm-meta-builder/commands-lab/active/refactoring/` |
| `.opencode/skills/` | `../.hivefiver-hm-meta-builder/skills-lab/active/refactoring/` |
| `.opencode/hivefiver/workflows/` | `../../.hivefiver-hm-meta-builder/workflows-lab/active/refactoring/` |
| `.opencode/hivefiver/references/` | `../../.hivefiver-hm-meta-builder/references-lab/active/refactoring/` |

**Edit in labs → instantly visible via `.opencode/` symlinks for live testing.**

---

## Lab Structure

```
.hivefiver-hm-meta-builder/
├── agents-lab/
│   ├── active/refactoring/          ← Agent definitions (source of truth)
│   └── orchestrator/                ← Coordinator definitions
├── commands-lab/
│   ├── active/refactoring/          ← Command definitions (source of truth)
│   └── research-analysis-group/     ← Research commands
├── skills-lab/
│   ├── active/
│   │   ├── improvement-packages-spec-*.md
│   │   ├── improvement-spec-v2-*.md
│   │   └── refactoring/             ← Skill packages (source of truth)
│   ├── enforcement-gap-analysis-*.md
│   ├── findings.md
│   ├── progress.md
│   └── task_plan.md
├── workflows-lab/
│   └── active/refactoring/          ← Workflow files (procedural logic)
├── references-lab/
│   └── active/refactoring/          ← Reference docs (platform patterns)
│       ├── git-workflow/
│       ├── HIVEFIVER-PLAYBOOK.md    ← Quality standard
│       └── long-term-memory/
├── plans/                           ← Implementation plans
└── orchestrator/                    ← Coordinator definitions
```

---

## Agent Team

### Tier 1: Primary Agents (user interacts directly via Tab key)

| Agent | File | Role |
|-------|------|------|
| **hivefiver-orchestrator** | `agents-lab/active/refactoring/hivefiver-orchestrator.md` | Meta-builder routing brain |
| **coordinator** | `agents-lab/active/refactoring/coordinator.md` | Interactive orchestrator |
| **conductor** | `agents-lab/active/refactoring/conductor.md` | Command execution workhorse |

### Tier 2: Specialist Subagents

| Agent | File | Role |
|-------|------|------|
| **hivefiver-skill-author** | `agents-lab/active/refactoring/hivefiver-skill-author.md` | Creates/audits/repairs skills |
| **hivefiver-agent-builder** | `agents-lab/active/refactoring/hivefiver-agent-builder.md` | Creates/audits/repairs agents |
| **hivefiver-command-builder** | `agents-lab/active/refactoring/hivefiver-command-builder.md` | Creates/audits/repairs commands |
| **builder** | `agents-lab/active/refactoring/builder.md` | Atomic code implementation |
| **critic** | `agents-lab/active/refactoring/critic.md` | Quality verification |
| **researcher** | `agents-lab/active/refactoring/researcher.md` | Deep investigation |

### Tier 3: Fast Subagents

| Agent | File | Role |
|-------|------|------|
| **explore** | `agents-lab/active/refactoring/explore.md` | Fast codebase scan |

### Tier 4: Prompt-Enhance Lane Agents

| Agent | File | Role |
|-------|------|------|
| **prompt-skimmer** | `agents-lab/active/refactoring/prompt-skimmer.md` | Phase 0 skim |
| **prompt-analyzer** | `agents-lab/active/refactoring/prompt-analyzer.md` | Deep text-quality lane |
| **context-mapper** | `agents-lab/active/refactoring/context-mapper.md` | Ground references in repo reality |
| **risk-assessor** | `agents-lab/active/refactoring/risk-assessor.md` | Flag risks |
| **context-purifier** | `agents-lab/active/refactoring/context-purifier.md` | Distill noisy prompts |
| **prompt-repackager** | `agents-lab/active/refactoring/prompt-repackager.md` | Final YAML+XML payload |

---

## Command Set

### Hivefiver Commands (hf-*)

| Command | Agent | Purpose |
|---------|-------|---------|
| `/hf-create` | hivefiver-orchestrator | Create skill/agent/command/tool |
| `/hf-audit` | hivefiver-orchestrator | Audit meta-concepts |
| `/hf-stack` | hivefiver-orchestrator | Stack 2-3 skills |
| `/hf-prompt-enhance` | hivefiver-orchestrator | Enhance/audit/repack prompts |

### Existing Commands

| Command | Agent | Status |
|---------|-------|--------|
| `/start-work` | conductor | Updated with $ARGUMENTS, bash injection |
| `/plan` | coordinator | Updated with $ARGUMENTS |
| `/ultrawork` | conductor | Updated with bash injection |
| `/deep-init` | coordinator | Keep as-is |
| `/harness-doctor` | coordinator | Keep as-is |

---

## Skill Packages

### Current Skills (in skills-lab/active/refactoring/)

| Skill | Pattern | Purpose |
|-------|---------|---------|
| **hivefiver-delegation-gates** | P1 | Authorization framework with checkpoint gates |
| **hivefiver-hivefiver-agents-and-subagents-dev** | P2 | Agent architecture and subagent dispatch |
| **hivefiver-hivefiver-command-dev** | P2 | Command structure and non-interactive shell |
| **hm-hm-command-parser** | P1 | $ARGUMENT parsing |
| **hm-hm-coordinating-loop** | P2 | Multi-agent coordination with validation gates |
| **hivefiver-custom-tools-dev** | P2 | Plugin SDK and custom tool architecture |
| **hm-opencode-project-audit** | P1 | OpenCode project audit orchestrator |
| **hm-meta-builder** | P1 | Routing brain for meta-concept requests |
| **hm-omo-reference** | P3 | Full OpenCode repo reference |
| **hm-opencode-non-interactive-shell** | P1 | Shell safety patterns |
| **hm-opencode-platform-reference** | P3 | Complete platform documentation |
| **hm-phase-loop** | P1 | Iterative phase execution |
| **hm-planning-with-files** | P1 | 3-file external memory system |
| **repomix-exploration-guide** | P1 | Repomix cheat sheet |
| **repomix-explorer** | P1 | Repomix CLI usage |
| **session-context-manager** | P2 | Session persistence across phases |
| **hm-skill-synthesis** | P3 | GitHub ingestion → skill generation |
| **hivefiver-use-authoring-skills** | P3 | Skill authoring principles |
| **hm-user-intent-interactive-loop** | P2 | Intent clarification and delegation |

---

## Worktree Strategy

| Worktree | Branch | Purpose |
|----------|--------|---------|
| `harness-experiment` | `harness-experiment` | Main development. Labs + symlinks live here. |
| `hivefiver-v2` | `feature/hivefiver-agent-command-v2` | Agent+command package development. |
| `hivefiver-packs` | `feature/hivefiver-agent-command-packs` | Alternative package worktree. |

---

## Testing Workflow

1. **Edit in labs** — `.hivefiver-hm-meta-builder/**-lab/active/refactoring/`
2. **Test via symlinks** — `.opencode/` resolves to lab directories
3. **Validate** — Run OpenCode commands, verify agents load, check skill triggers
4. **Commit** — Changes in labs are committed to git
5. **Ship** — When validated, pack into TS runtime builder

---

## Session Recovery

If interrupted:
1. `git worktree list` — find your worktrees
2. `cd` to the right worktree
3. `git status` — see what was in progress
4. `git log --oneline -5` — see recent commits
5. Read `.hivefiver-hm-meta-builder/plans/` for current plans
6. Resume from where you left off

---

## What LLMs Get Wrong

| Wrong Assumption | Reality |
|-----------------|---------|
| "Edit files in .opencode/" | Edit in labs. `.opencode/` is symlinks. |
| "Skills are standalone" | Skills are packages: SKILL.md + references/ + scripts/ |
| "Agents are independent" | Agents are part of a tiered team with delegation protocols |
| "Commands execute directly" | Commands are thin shells referencing workflow files |
| "The ecosystem is flat" | It's a pipeline: labs → symlinks → .opencode/ → TS runtime |
| "I can create new skills freely" | Max 3 skills per stack. Must have trigger phrases. |
