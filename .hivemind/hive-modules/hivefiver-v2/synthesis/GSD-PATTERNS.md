# GSD Framework Patterns — Synthesis for HiveFiver V2

> **Source**: https://github.com/gsd-build/get-shit-done
> **Purpose**: Patterns to SYNTHESIZE (not copy) into HiveFiver's architecture
> **Created**: 2026-03-01
> **Status**: Research complete, synthesis pending

---

## 1. CLI Router Pattern (gsd-tools.cjs — 23KB)

Central CLI router with ~60+ commands organized by category. This is the pattern HiveFiver should adapt as `hivefiver-tools.cjs`.

### Command Categories

| Category | Commands | Purpose |
|----------|----------|---------|
| `state` | load, json, update, get, patch, advance-plan, record-metric, update-progress, add-decision, add-blocker, resolve-blocker, record-session | State CRUD + lifecycle |
| `phase` | next-decimal, add, insert, remove, complete | Phase lifecycle |
| `roadmap` | get-phase, analyze, update-plan-progress | Roadmap operations |
| `verify` | plan-structure, phase-completeness, references, commits, artifacts, key-links | Verification suite |
| `validate` | consistency, health (with --repair) | Validation + repair |
| `frontmatter` | get, set, merge, validate (with --schema) | YAML frontmatter CRUD |
| `template` | select, fill (summary, plan, verification) | Template operations |
| `scaffold` | context, uat, verification, phase-dir | Directory scaffolding |
| `init` | execute-phase, plan-phase, new-project, resume, verify-work (compound loaders) | Context initialization |

### Key Design Patterns

- **`--raw` flag**: Outputs JSON for programmatic consumption
- **`--cwd` flag**: Sandboxed working directory for subagent operation
- **Category.command routing**: `gsd-tools.cjs <category> <command> [args] [flags]`
- **Error handling**: Consistent error format across all commands
- **Compound init commands**: Load multiple context pieces in one call per workflow type

### HiveFiver Adaptation

Map to framework domain:
- `state` → Module state management (STATE.md CRUD)
- `stage` → Stage detection and routing (replaces route-stage.sh)
- `verify` → Asset contract verification (agents, commands, skills, workflows)
- `frontmatter` → YAML frontmatter validation for .md assets
- `init` → Compound context loaders per hivefiver stage

---

## 2. Library Module Architecture (bin/lib/ — 11 modules, ~180KB)

| File | Size | Purpose | HiveFiver Equivalent |
|------|------|---------|---------------------|
| state.cjs | 25KB | State CRUD, metrics, decisions, blockers, sessions | state.cjs (STATE.md ops) |
| phase.cjs | 29KB | Phase find, add, insert, remove, complete | stage.cjs (stage detection) |
| verify.cjs | 29KB | Structure, completeness, references, artifacts | verify.cjs (asset contracts) |
| commands.cjs | 18KB | Model resolution, commit, slugify, progress | — (not needed initially) |
| init.cjs | 23KB | Compound context loaders per workflow | init.cjs (stage context) |
| core.cjs | 16KB | Error handling, file I/O, parsing | core.cjs (same) |
| config.cjs | 5KB | Config management | — (use OpenCode config) |
| frontmatter.cjs | 12KB | Frontmatter CRUD with schema validation | frontmatter.cjs (same) |
| template.cjs | 7KB | Template fill operations | template.cjs (same) |
| milestone.cjs | 10KB | Milestone completion, requirements | — (not needed initially) |
| roadmap.cjs | 11KB | Roadmap get-phase, analyze | — (not needed initially) |

### Minimum Viable Lib for HiveFiver

Priority modules (MVP):
1. **core.cjs** — Error handling, file I/O, markdown parsing
2. **state.cjs** — STATE.md read/write/update
3. **stage.cjs** — Stage detection from hierarchy.json + STATE.md
4. **verify.cjs** — Asset contract validation (frontmatter, structure, parity)

---

## 3. Rich Agent Body Pattern (gsd-planner.md — 42KB)

The gold standard for structured, routed agent bodies using XML blocks.

### XML Block Architecture

| Block | Purpose | HiveFiver Equivalent |
|-------|---------|---------------------|
| `<role>` | What, who spawns, core responsibilities, mandatory reads | Role: meta-builder, spawned by user, framework-only scope |
| `<project_context>` | How to discover project state | STATE.md + hierarchy.json + skill outputs |
| `<context_fidelity>` | User decision honoring | Locked decisions from SPEC are NON-NEGOTIABLE |
| `<philosophy>` | Core principles | Framework-first, deterministic, evidence-based |
| `<discovery_levels>` | L0-L3 progressive research | L0: route, L1: skill body, L2: references, L3: full audit |
| `<task_breakdown>` | Task anatomy, types, sizing | Asset-level tasks (agent, command, skill, workflow) |
| `<dependency_graph>` | Needs/creates/checkpoint per task | Asset dependency chain: command → workflow → skill → agent |
| `<scope_estimation>` | Context budget | 50% target, 2-3 assets per session |
| `<execution_flow>` | Numbered steps with script calls | 13-step flow with hivefiver-tools.cjs calls |
| `<checkpoints>` | Human verification types | 90% checkpoint:human-verify, 9% decision, 1% action |
| `<structured_returns>` | Output format specs | PLANNING COMPLETE, BUILD COMPLETE, AUDIT REPORT |
| `<success_criteria>` | Completion checklist | Contract compliance + parity + evidence |

### Key Design Principles Extracted

1. **Plans are prompts** — The plan text IS the instruction for the executing agent
2. **Quality degradation curve** — More tasks = lower quality. Keep small batches.
3. **Goal-backward design** — Goal → Truths → Artifacts → Wiring → Key Links
4. **Verification loop** — Plan → Check → Revise → Re-check (max 3 iterations)
5. **Structured returns** — Machine-parseable output blocks, not narrative

---

## 4. Command Pattern (plan-phase.md)

### Frontmatter Fields

```yaml
---
name: plan-phase
description: "Plan a project phase with research and verification"
argument-hint: "[phase-number] [--auto] [--research] [--skip-research] [--gaps] [--skip-verify] [--prd <file>]"
agent: gsd-planner
allowed-tools: [bash, read, glob, grep, task, skill, write, edit]
---
```

### Body Structure

```markdown
<objective>
What this command achieves
</objective>

<execution_context>
@file references for context
</execution_context>

<context>
$ARGUMENTS parsing with flag handling
</context>

<process>
Delegates to workflow
</process>
```

### HiveFiver Adaptation

Each `/hivefiver <stage>` command should follow this pattern:
- Frontmatter: name, description, argument-hint, agent (hivefiver), allowed-tools
- Body: `<objective>`, `<context>` ($ARGUMENTS), `<process>` (delegates to stage logic)

---

## 5. Workflow Pattern (plan-phase.md workflow — 20KB)

### Structure

14 numbered steps with bash calls at each step:

```markdown
## Step 1: Initialize Context
!`hivefiver-tools.cjs init plan-phase --cwd $(pwd)`

## Step 2: Research (if needed)
Spawn Task() with:
<files_to_read>...</files_to_read>
<planning_context>...</planning_context>

## Step N: Verify
<quality_gate>
Run verification loop (max 3 iterations):
1. Generate plan
2. Check plan against criteria
3. Revise if needed
4. Re-check
</quality_gate>
```

### Key Patterns

- **Agent spawning via Task()** with structured XML blocks in prompt
- **Verification loop**: plan → check → revise → re-check (max 3 iterations)
- **Auto-advance option**: chains to next stage
- **Structured `offer_next` output**: suggests next command to user

---

## 6. Context Monitor Hook (gsd-context-monitor.js)

### Pattern

PostToolUse hook reading `/tmp/claude-ctx-{session_id}.json`:

| Threshold | Level | Action |
|-----------|-------|--------|
| 35% remaining | WARNING | "Context usage high" |
| 25% remaining | CRITICAL | "URGENT: Save work" |

### Design

- Debounce: 5 tool uses between warnings
- Severity escalation bypasses debounce
- Injects as `additionalContext` so agent sees it
- Reads usage from temp file written by session monitor

### HiveFiver Adaptation

Not needed immediately — OpenCode handles compaction. But useful pattern for future: monitor context budget and trigger self-delegation checkpoint when approaching limits.

---

## 7. State Management Pattern

### GSD State Structure

```json
{
  "projectInfo": { "name", "purpose", "techStack" },
  "currentPhase": { "number", "name", "status" },
  "phases": [{ "number", "name", "status", "tasks": [] }],
  "decisions": [{ "id", "decision", "rationale", "date" }],
  "blockers": [{ "id", "description", "status", "resolution" }],
  "metrics": { "totalTasks", "completed", "lastSession" }
}
```

### HiveFiver Adaptation

STATE.md structure (markdown, not JSON — aligns with .hivemind philosophy):
- Current Position table
- Architecture Model table
- Active Asset Inventory
- Decisions table
- Blockers table
- Change Log

---

## Synthesis Principles

These are NOT to be copied — they are to be SYNTHESIZED into HiveFiver's own philosophy:

1. **CLI-first execution** → Every workflow step callable via script
2. **State as source of truth** → Read state → act → update state → emit checkpoint
3. **Plans are prompts** → The plan text IS the instruction for the executing agent
4. **Goal-backward design** → Start from acceptance criteria, work backward
5. **Quality degradation curve** → Smaller batches = higher quality
6. **Structured returns** → Machine-parseable output, not narrative
7. **Verification loops** → Max 3 iterations: generate → check → revise
8. **Context budget awareness** → Track usage, checkpoint before overflow
9. **Compound init commands** → Load all needed context in one call per workflow
10. **Progressive research** → L0 route → L1 skill → L2 reference → L3 deep dive
