# AGENTS.md — Hivefiver Meta-Builder Module

## Project Overview

Hivefiver is the **meta-builder module** of the HiveMind Framework. It creates, audits, stacks, and extends OpenCode soft concepts: skills, agents, commands, tools, workflows, and references.

**This is NOT a project-builder.** That's Hiveminder's domain. Hivefiver builds the building blocks.

### The Three Entities

| Entity | Role | Boundary |
|--------|------|----------|
| **OpenCode** | Agent coding harness CLI — the platform/OS | Native capabilities: agents, commands, skills, tools, plugins |
| **HiveMind** | Parent framework wrapping OpenCode | Houses both Hivefiver + Hiveminder |
| **Hivefiver** | Meta-builder module | Creates/audits/stacks OpenCode concepts. Tests in labs, ships as TS runtime |
| **Hiveminder** | Project-builder agent lineage | Handles "let's build a NextJS app" — DO NOT TOUCH |

### What Hivefiver Delivers

- **Agent definitions** (`.md` files with YAML frontmatter, permissions, execution flows)
- **Command definitions** (thin shells referencing workflow files)
- **Skill packages** (SKILL.md + references/ + scripts/ + templates/)
- **Workflow files** (procedural logic executed by agents)
- **Reference files** (platform docs, patterns, best practices)

### Testing → Shipping Pipeline

```
.hivefiver-meta-builder/**-lab/  ← Source of truth (edit here)
        ↓ symlinks
.opencode/{agents,commands,skills,hivefiver}/  ← Live testing (OpenCode reads here)
        ↓ when validated
TS runtime builder (opencode-harness npm package)  ← Final shipping format
```

---

## Lab Structure

```
.hivefiver-meta-builder/
├── agents-lab/active/refactoring/     ← Agent definitions (source of truth)
├── commands-lab/active/refactoring/   ← Command definitions (source of truth)
├── skills-lab/active/refactoring/     ← Skill packages (source of truth)
├── workflows-lab/active/refactoring/  ← Workflow files (procedural logic)
├── references-lab/active/refactoring/ ← Reference docs (platform patterns)
├── plans/                             ← Implementation plans
└── orchestrator/                      ← Coordinator definitions
```

### Symlinks (`.opencode/` → labs)

| `.opencode/` path | → Lab directory |
|---|---|
| `.opencode/agents/` | `../.hivefiver-meta-builder/agents-lab/active/refactoring/` |
| `.opencode/commands/` | `../.hivefiver-meta-builder/commands-lab/active/refactoring/` |
| `.opencode/skills/` | `../.hivefiver-meta-builder/skills-lab/active/refactoring/` |
| `.opencode/hivefiver/workflows/` | `../../.hivefiver-meta-builder/workflows-lab/active/refactoring/` |
| `.opencode/hivefiver/references/` | `../../.hivefiver-meta-builder/references-lab/active/refactoring/` |

**Edit in labs → instantly visible via `.opencode/` symlinks for live testing.**

---

## Agent Team

### Tier 1: Primary Agents (user interacts directly via Tab key)

| Agent | File | Role |
|-------|------|------|
| **hivefiver-orchestrator** | `agents-lab/active/refactoring/hivefiver-orchestrator.md` | Meta-builder routing brain. Receives requests → classifies intent → delegates to specialists → two-stage review → reports. |
| **coordinator** | `agents-lab/active/refactoring/coordinator.md` | Interactive orchestrator. Task management, delegation, parallel execution. |
| **conductor** | `agents-lab/active/refactoring/conductor.md` | Command execution workhorse. Intent classification, wisdom system, delegate-task routing. |

### Tier 2: Specialist Subagents (dispatched by primaries)

| Agent | File | Role |
|-------|------|------|
| **hivefiver-skill-author** | `agents-lab/active/refactoring/hivefiver-skill-author.md` | Creates/audits/repairs skills. Enforces agentskills.io principles. |
| **hivefiver-agent-builder** | `agents-lab/active/refactoring/hivefiver-agent-builder.md` | Creates/audits/repairs agent definitions. Explicit permissions, execution flows. |
| **hivefiver-command-builder** | `agents-lab/active/refactoring/hivefiver-command-builder.md` | Creates/audits/repairs commands. Non-interactive shell safety, $ARGUMENTS, !bash. |
| **builder** | `agents-lab/active/refactoring/builder.md` | Atomic code implementation. Reads before writes, follows patterns. |
| **critic** | `agents-lab/active/refactoring/critic.md` | Quality verification. Ruthless review, correctness validation. |
| **researcher** | `agents-lab/active/refactoring/researcher.md` | Deep investigation. Evidence collection, pattern discovery. |

### Tier 3: Fast Subagents

| Agent | File | Role |
|-------|------|------|
| **explore** | `agents-lab/active/refactoring/explore.md` | Fast codebase scan. Lightweight, high-throughput. |

### Tier 4: Prompt-Enhance Lane Agents

| Agent | File | Role |
|-------|------|------|
| **prompt-skimmer** | `agents-lab/active/refactoring/prompt-skimmer.md` | Phase 0 skim for prompt-enhancement routing. |
| **prompt-analyzer** | `agents-lab/active/refactoring/prompt-analyzer.md` | Deep text-quality lane for prompts. |
| **context-mapper** | `agents-lab/active/refactoring/context-mapper.md` | Grounds prompt references in repo reality. |
| **risk-assessor** | `agents-lab/active/refactoring/risk-assessor.md` | Flags destructive, security, and scope risks. |
| **context-purifier** | `agents-lab/active/refactoring/context-purifier.md` | Distills noisy prompts without changing intent. |
| **prompt-repackager** | `agents-lab/active/refactoring/prompt-repackager.md` | Produces the final YAML+XML enhanced prompt payload. |

---

## Command Set

### Hivefiver Commands (hf-*)

| Command | Agent | Purpose |
|---------|-------|---------|
| `/hf-create` | hivefiver-orchestrator | Create skill/agent/command/tool via specialist routing |
| `/hf-audit` | hivefiver-orchestrator | Audit meta-concepts for quality, overlaps, dead refs |
| `/hf-stack` | hivefiver-orchestrator | Stack 2-3 skills with loading order validation |
| `/hf-prompt-enhance` | hivefiver-orchestrator | Enhance, audit, or repack prompts via skim → bridge → lanes → assembly |

### Existing Commands (updated)

| Command | Agent | Status |
|---------|-------|--------|
| `/start-work` | conductor | Updated with $ARGUMENTS, bash injection, skill loading |
| `/plan` | coordinator | Updated with $ARGUMENTS, bash injection |
| `/ultrawork` | conductor | Updated with bash injection, skill loading |
| `/deep-init` | coordinator | Keep as-is |
| `/harness-doctor` | coordinator | Keep as-is |

---

## Delegation Protocol

### The Dispatch Envelope

```
Task tool (<specialist>):
  description: "Task N: [name]"
  prompt: |
    You are [role]. Your task: [FULL TASK TEXT]

    ## Context
    [Scene-setting — where this fits, why it matters]

    ## Scope
    - Include: [specific files/paths]
    - Exclude: [what NOT to touch]

    ## Output Format
    - Status: DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED
    - [Specific output requirements]
```

**NEVER pass session history to subagents. Construct exact context.**

### Status Protocol

| Status | Meaning | Action |
|--------|---------|--------|
| DONE | Complete, verified | Proceed |
| DONE_WITH_CONCERNS | Complete but doubts | Read concerns → address if correctness, note if observation |
| NEEDS_CONTEXT | Knowledge gap | Provide context → re-dispatch |
| BLOCKED | Cannot proceed | Assess: context? model? size? plan? → escalate if needed |

### Two-Stage Review

1. **Stage 1: Spec Compliance** — Does output match requirements? Nothing extra? Nothing missing?
2. **Stage 2: Code Quality** — Well-built? Clean? Following patterns?

**Stage 1 MUST pass before Stage 2.**

---

## Iron Laws

1. **NO DIRECT CREATION WITHOUT DELEGATION** — Route to specialists. Never create skills/agents/commands directly.
2. **NO STACK WITHOUT A REASON** — Max 3 skills per stack. Explain why each is needed.
3. **NO SUBAGENT WITHOUT CONSTRUCTED CONTEXT** — Full task text, scene-setting, scope. Never session history.
4. **NO SKILL WITHOUT TRIGGER PHRASES** — Description is the only thing agents see. Must contain specific user phrases.
5. **EVERY COMMAND SURVIVES CI=true** — No TTY-dependent operations. Non-interactive shell safety.

---

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **The Executor** — creating directly | Writing SKILL.md or agent files yourself | STOP. Delegate to specialist. |
| **The Hoarder** — loading 4+ skills | Context blown, skills ignored | Max 3. Explain why each is needed. |
| **The Improviser** — ignoring routing table | Routed wrong, task failed | Trust the table. Fix the table if wrong. |
| **The Context Polluter** — passing session history | Subagent prompt includes "earlier in conversation" | Construct fresh context: task text + scene-setting + scope |
| **The File Referrer** — "read the plan file" | Subagent told to read file path | Paste full task text into the prompt. Always. |
| **The Hallucinator** — inventing architecture | Making assumptions without evidence | Ground in lineage. Read session exports. Verify with grep. |

---

## Worktree Strategy

| Worktree | Branch | Purpose |
|----------|--------|---------|
| `harness-experiment` | `harness-experiment` | Main development worktree. Labs + symlinks live here. |
| `hivefiver-v2` | `feature/hivefiver-agent-command-v2` | Agent+command package development. |
| `hivefiver-packs` | `feature/hivefiver-agent-command-packs` | Alternative package worktree. |

**Each worktree can have its own lab state.** Symlinks point to local labs within that worktree.

---

## Testing Workflow

1. **Edit in labs** — `.hivefiver-meta-builder/**-lab/active/refactoring/`
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
5. Read `.hivefiver-meta-builder/plans/` for current plans
6. Resume from where you left off
