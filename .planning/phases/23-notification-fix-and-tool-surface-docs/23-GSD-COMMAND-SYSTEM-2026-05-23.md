# GSD Command System — Deep Analysis

> **Source:** GSD Repomix output `5875fd23ec62fc70` — files docs/COMMANDS.md, docs/ARCHITECTURE.md §Component Architecture, docs/INVENTORY.md §Commands (67 shipped)
> **Date:** 2026-05-23
> **Evidence Level:** L3 (documented observation from GSD docs)
> **Audience:** Hivemind engineers seeking actionable insights for Hivemind's command engine

---

## 1. OVERVIEW

GSD ships **67 commands** (stored as `commands/gsd/*.md`) plus **88 workflow files** (`get-shit-done/workflows/*.md`). Commands are the user-facing entry points; workflows are the internal orchestration logic. [L29994-L29997]

The fundamental architecture:

```
User types /gsd-command → Command file loaded into context → Workflow orchestration → Subagent dispatch → State update
```

Every command file contains:
- **YAML frontmatter:** `name`, `description`, `allowed-tools`
- **Prompt body:** Bootstraps the corresponding workflow, references shared knowledge documents via `@-reference`
- **Flag/argument definitions:** Syntactic sugar parsed by the runtime

[L22068-L22076]

---

## 2. COMMAND CLASSIFICATION (67 Commands)

### 2.1 Namespace Meta-Skills (6 routers)

Keep eager skill-listing cost at ~120 tokens instead of ~2,150 for 86 skills:

| Command | Routes to | Token cost |
|---------|-----------|-----------|
| `/gsd-workflow` | Phase pipeline — discuss / plan / execute / verify / phase / progress | ~20 |
| `/gsd-project` | Project lifecycle — milestones, audits, summary | ~20 |
| `/gsd-quality` | Quality gates — code review, debug, audit, security, eval, ui | ~20 |
| `/gsd-context` | Codebase intelligence — map, graphify, docs, learnings | ~20 |
| `/gsd-manage` | Management — config, workspace, workstreams, thread, update, ship, inbox | ~20 |
| `/gsd-ideate` | Exploration & capture — explore, sketch, spike, spec, capture | ~20 |

[L30000-L30011]

**Routing mechanism:** Each namespace router's body contains a **routing table** — a Markdown table mapping intent keywords to concrete sub-skill commands. The model selects the namespace first, reads the routing table, then dispatches to the concrete command. [L22078-L22083]

**Key property:** Namespace skills are **additive** — every concrete command is still directly invocable. The routing layer is only a _cost optimization_, not an access control mechanism. [L23523]

**Description format:** Router descriptions use pipe-separated keyword tags (≤ 60 chars). Example: `"Phase pipeline router — discuss / plan / execute / verify / phase / progress."` This is based on Tool Attention research showing keyword-dense tags outperform prose at ~40% the token cost. [L22082-L22083]

### 2.2 Core Workflow Commands (20 commands)

The central pipeline — these are the commands that users run daily:

| Command | Role | Produces |
|---------|------|----------|
| `/gsd-new-project` | Initialize project with research + roadmap | PROJECT.md, REQUIREMENTS.md, ROADMAP.md, STATE.md, config.json |
| `/gsd-workspace` | Manage isolated workspace environments | WORKSPACE.md, .planning/, repo copies |
| `/gsd-discuss-phase` | Gather phase context via questions | {phase}-CONTEXT.md, DISCUSSION-LOG.md |
| `/gsd-mvp-phase` | Plan as vertical MVP slice | PLAN.md via SPIDR splitting |
| `/gsd-spec-phase` | Socratic spec refinement | SPEC.md with falsifiable requirements |
| `/gsd-ui-phase` | Generate UI design contract | {phase}-UI-SPEC.md |
| `/gsd-ai-integration-phase` | AI design contract + eval planning | AI-SPEC.md |
| `/gsd-plan-phase` | Research → plan → verify a phase | RESEARCH.md, PLAN.md, VALIDATION.md |
| `/gsd-plan-review-convergence` | Cross-AI plan convergence loop | Converged PLAN.md |
| `/gsd-ultraplan-phase` | [BETA] Offload planning to ultraplan cloud | External plan file → /gsd-import |
| `/gsd-spike` | Throwaway feasibility experiments | Spike findings, optional persistent skill |
| `/gsd-sketch` | UI/design HTML mockups | Sketch findings, optional persistent skill |
| `/gsd-execute-phase` | Wave-based plan execution | Code changes, commits, SUMMARY.md |
| `/gsd-verify-work` | Conversational UAT | UAT.md |
| `/gsd-ship` | Create PR, review, merge | PR |
| `/gsd-fast` | Inline task execution (no subagents) | Direct code changes |
| `/gsd-quick` | Quick task with GSD guarantees | Code + state + commits |
| `/gsd-ui-review` | 6-pillar visual audit | {phase}-UI-REVIEW.md |
| `/gsd-code-review` | Source code review | REVIEW.md |
| `/gsd-eval-review` | AI phase evaluation audit | EVAL-REVIEW.md |

[L30014-L30044]

### 2.3 Phase & Milestone Management (15 commands)

| Command | Role |
|---------|------|
| `/gsd-phase` | CRUD: add / insert / remove / edit phases in ROADMAP.md |
| `/gsd-add-tests` | Generate tests from UAT criteria |
| `/gsd-validate-phase` | Retroactive Nyquist validation gap filling |
| `/gsd-secure-phase` | Retroactive threat mitigation verification |
| `/gsd-audit-milestone` | Milestone DoD verification |
| `/gsd-audit-uat` | Cross-phase UAT/verification audit |
| `/gsd-audit-fix` | Autonomous audit-to-fix pipeline |
| `/gsd-complete-milestone` | Archive completed milestone |
| `/gsd-new-milestone` | Start new milestone cycle |
| `/gsd-milestone-summary` | Generate milestone summary |
| `/gsd-cleanup` | Archive phase dirs from completed milestones |
| `/gsd-manager` | Interactive command center |
| `/gsd-workstreams` | Parallel workstream management |
| `/gsd-autonomous` | Run all remaining phases autonomously |
| `/gsd-undo` | Safe git revert with phase manifest |

[L30046-L30065]

### 2.4 Session & Navigation (8 commands)

| Command | Role |
|---------|------|
| `/gsd-progress` | Project progress + next-action routing |
| `/gsd-capture` | Capture ideas/tasks/notes/seeds |
| `/gsd-stats` | Project statistics dashboard |
| `/gsd-pause-work` | Context handoff for mid-phase pauses |
| `/gsd-resume-work` | Full context restoration |
| `/gsd-explore` | Socratic ideation |
| `/gsd-review-backlog` | Promote backlog items to active milestone |
| `/gsd-thread` | Persistent context threads |

[L30067-L30082]

### 2.5 Codebase Intelligence (3 commands)

| Command | Role |
|---------|------|
| `/gsd-map-codebase` | Parallel codebase analysis (4 agents) |
| `/gsd-graphify` | Knowledge graph in .planning/graphs/ |
| `/gsd-extract-learnings` | Extract learnings from phase artifacts |

[L30084-L30088]

### 2.6 Review, Debug & Recovery (6 commands)

| Command | Role |
|---------|------|
| `/gsd-review` | Cross-AI peer review via external CLIs |
| `/gsd-debug` | Systematic debugging with persistent state |
| `/gsd-forensics` | Post-mortem for failed workflows |
| `/gsd-health` | Planning directory health diagnosis |
| `/gsd-import` | Import external plans with conflict detection |
| `/gsd-inbox` | Triage GitHub issues/PRs |

[L30090-L30099]

### 2.7 Docs, Profile & Utilities (9 commands)

| Command | Role |
|---------|------|
| `/gsd-docs-update` | Generate/verify project documentation |
| `/gsd-ingest-docs` | ADR/PRD/SPEC ingestion into .planning/ |
| `/gsd-profile-user` | Developer behavioral profiling |
| `/gsd-settings` | Workflow toggle config |
| `/gsd-config` | Advanced config (toggles/advanced/integrations/profile) |
| `/gsd-pr-branch` | Clean PR branch filtering .planning/ commits |
| `/gsd-surface` | Toggle skill profiles without reinstall |
| `/gsd-update` | Update GSD, sync skills across runtimes |
| `/gsd-help` | Command reference display |

[L30101-L30113]

---

## 3. COMMAND vs WORKFLOW DISTINCTION

This is a critical architectural pattern:

| Aspect | Command | Workflow |
|--------|---------|----------|
| **Location** | `commands/gsd/*.md` | `get-shit-done/workflows/*.md` |
| **Audience** | User-facing (slash commands) | Internal (orchestration logic) |
| **Content** | YAML frontmatter + bootstrap prompt | Step-by-step orchestration instructions |
| **Size budget** | No explicit cap | Tiered: XL=1700, LARGE=1500, DEFAULT=1000 lines |
| **Lifespan** | Stable, user-triggered | Internal, may be called by multiple commands |
| **Reference style** | `@` references to workflows | `@` references to references/*.md |

[L22085-L22105]

**Workflow size budget enforcement** is a notable GSD innovation:

| Tier | Line limit | Example workflows |
|------|-----------|-------------------|
| XL | 1700 | execute-phase, plan-phase, new-project |
| LARGE | 1500 | Multi-step planners, feature workflows |
| DEFAULT | 1000 | Focused single-purpose workflows |
| STRICT | 500 | discuss-phase.md only |

[L22100-L22110]

When a workflow exceeds its tier, GSD extracts:
- Per-mode bodies → `workflows/<name>/modes/<mode>.md`
- Templates → `workflows/<name>/templates/`
- Shared knowledge → `get-shit-done/references/`

The parent file becomes a thin dispatcher that Reads only the needed mode + template files. `workflows/discuss-phase/` is the canonical example with 9 mode files (power, all, auto, chain, text, batch, analyze, default, advisor). [L22110-L22116]

---

## 4. TWO-STAGE HIERARCHICAL ROUTING (v1.40)

### 4.1 The Problem

GSD ships 86+ concrete commands. In OpenCode/Claude Code, every slash command is listed in the system prompt as an available tool/skill. At ~25 tokens per description, 86 commands = ~2,150 tokens consumed every turn just for the listing — whether the user uses them or not. [L22078]

### 4.2 The Solution

Two layers:

1. **Stage 1 (Namespace Router):** 6 meta-skills, each ~20 tokens. Total: ~120 tokens.
   - The model sees only these 6 items in the eager listing
   - Each router's description briefly covers its domain

2. **Stage 2 (Routing Table):** Inside the selected router's body, a Markdown table maps intent → concrete sub-skill.
   - The model reads only ONE router's body (the one it selected)
   - Routing tables contain 5-15 entries, each ~2 lines

Net savings: ~2,150 tokens → ~240 tokens per turn (best case). ~90% reduction. [L22080-L22083]

### 4.3 Token Budget Interaction

GSD explicitly documents that the eager skill listing is only ONE of two recurring per-turn token costs. The other is MCP tool schemas from `.claude/settings.json`. Heavyweight MCP servers (browser, Mac-tools) can cost 20K+ tokens per turn — dwarfing what `model_profile` tuning saves. The two levers are additive. [L22085-L22090]

### 4.4 Hivemind Comparison

Hivemind's 19 commands are flat-listed. No two-stage routing exists. The `hivemind-command-engine` tool supports `discover` (list available commands), `list_commands`, `route_preview`, etc. But this is a _tool_-based discovery, not a _prompt-based_ routing layer.

---

## 5. WORKFLOW ARCHITECTURE (88 Workflows)

### 5.1 Orchestration Pattern

Every workflow follows:

```
1. Load context: gsd-sdk query init.<workflow> (returns JSON with project info, config, state)
2. Resolve model: gsd-sdk query resolve-model <agent-name> (returns opus/sonnet/haiku/inherit)
3. Spawn agent(s): Task/SubAgent call with agent prompt + context payload + model assignment
4. Collect results
5. Update state: gsd-sdk query state.update / state.patch / state.advance-plan
```

[L22277-L22294]

### 5.2 Internal Workflows (no user-facing command)

Some workflows are not directly callable by users — they are invoked by other workflows:

| Workflow | Purpose | Called by |
|----------|---------|-----------|
| `execute-plan.md` | Execute single PLAN.md | `execute-phase.md` (per-plan subagent) |
| `verify-phase.md` | Goal-backward verification | `execute-phase.md` (post-execution) |
| `transition.md` | Phase boundary checks + state advancement | `execute-phase.md`, `/gsd-progress --next` |
| `node-repair.md` | Failed task verification repair | `execute-plan.md` (recovery) |
| `diagnose-issues.md` | Parallel UAT gap analysis | `/gsd-verify-work` (auto-diagnosis) |

[L30136-L30139]

---

## 6. PLATFORM ADAPTERS

GSD's commands are installed differently per AI runtime. The installer translates from Claude Code's native format:

| Runtime | Command form | Agent format | Hook events |
|---------|-------------|-------------|-------------|
| Claude Code | `/gsd-command-name` (hyphen) | `agents/gsd-*.md` | PostToolUse, statusLine, SessionStart |
| OpenCode/Kilo | `/gsd-command-name` (hyphen) | `agents/gsd-*.md` (flat) | No GSD hooks |
| Gemini CLI | `/gsd:command-name` (colon) | `agents/gsd-*.md` | AfterTool instead of PostToolUse |
| Codex | `$gsd-command-name` | TOML config + skills | Hook tables in config.toml |
| Copilot | `/gsd-command-name` (hyphen) | `.agent.md` files | No GSD hooks |
| Cursor/Windsurf/Trae | `/gsd-command-name` (hyphen) | Skills-first + rule refs | No GSD hooks |

[L22680-L22740]

---

## 7. COMMAND FRONTMATTER STRUCTURE (Sample)

From `docs/AGENTS.md` and `docs/ARCHITECTURE.md`, the command frontmatter pattern is consistent:

```yaml
---
name: gsd-plan-phase
description: Create detailed phase plan (PLAN.md) with verification loop
tools: [Read, Write, Bash, Grep, Glob, WebFetch, mcp(context7)]
---
```

Notable: GSD commands do NOT have permission levels (allow/ask). They use a binary `tools` list. This is a significant difference from Hivemind's granular permission model.

---

## 8. COMPARISON WITH HIVEMIND COMMAND ENGINE

| Dimension | GSD | Hivemind | Advantage |
|-----------|-----|----------|-----------|
| **Command count** | 67 + 88 workflows = 155 total | 19 commands | GSD depth |
| **Two-stage routing** | Namespace meta-skills (v1.40) | None | GSD (token savings) |
| **Workflow separation** | Separate `workflows/` directory | Commands = workflows | GSD (reusability) |
| **Size budget** | Tiered enforcement per file | None | GSD |
| **Discovery mechanism** | Eager skill listing in system prompt | `hivemind-command-engine --action list_commands` | Hivemind (programmatic) |
| **Permission model** | Binary tools list (allow/not) | Granular allow/ask/ask | Hivemind |
| **Dispatch** | Native Task()/SubAgent calls | WaiterModel with dual-signal, task/delegate-task tools, session-stacking | Hivemind (flexibility) |
| **Subtask override** | Not supported | `subtask:true/false` + `agent` | Hivemind |
| **Runtime adaptation** | Install-time translation per runtime | Plugin-based with SDK composition | Equal (different approaches) |
| **File format** | Markdown with YAML frontmatter | OpenCode primitive JSON/YAML | Different (both valid) |

---

## 9. ACTIONABLE RECOMMENDATIONS FOR HIVEMIND

### RECOMMENDATION A: Namespace Meta-Skills (HIGH IMPACT)

**Problem:** Hivemind's 19 commands are listed flatly. As the list grows, token cost increases linearly.

**Solution:** Implement 3-4 namespace routers:

```
/hm-workflow  → Routes: discuss / plan / execute / verify / gate
/hm-project   → Routes: milestone / audit / summary / stats
/hm-manage    → Routes: config / thread / update / help
/hm-explore   → Routes: explore / capture / research
```

Each router body contains a routing table. The model sees 4 entries (~80 tokens) instead of 19 (~475 tokens).

**Concrete implementation:**
- Create `commands/gsd/ns-workflow.md`, `commands/gsd/ns-project.md`, etc.
- Each has description with pipe-separated keywords (≤ 60 chars)
- Body contains: `## Routing Table\n| If you want to… | Use this command |`
- All concrete commands remain directly invocable

### RECOMMENDATION B: Workflow Separation (MEDIUM IMPACT)

**Problem:** Hivemind commands mix entry-point and orchestration logic in the same file.

**Solution:** Split commands into entry-points (thin) + workflows (orchestration):

```
commands/hm-plan-phase.md     → 30 lines (loads workflow, passes args)
workflows/hm/plan-phase.md    → 400 lines (research → plan → verify loop)
```

This enables:
- Multiple commands to share the same workflow
- Workflows to be refactored without changing user-facing syntax
- Size budgeting and progressive disclosure

### RECOMMENDATION C: Size Budget Enforcement (LOW IMPACT)

**Problem:** No workflow file in Hivemind has a size limit. Files grow without constraint.

**Solution:** Adopt GSD's tiered size budget:

| Tier | Limit | Applies to |
|------|-------|-----------|
| XL | 1700 lines | orchestrators (phase-loop, coordinating-loop) |
| LARGE | 1500 lines | multi-step workflows (phase-execution) |
| DEFAULT | 1000 lines | single-purpose workflows |
| STRICT | 500 lines | discuss/explore workflows |

### RECOMMENDATION D: Command Inventory Test (LOW IMPACT)

GSD has `tests/command-count-sync.test.cjs` that locks command count against the filesystem. Adding a new command without updating INVENTORY.md fails CI. Hivemind should add a similar drift-guard for `.opencode/commands/` vs a master inventory.

---

## 10. KEY TAKEAWAYS

1. **GSD's 67/88 split is the right ratio** — thin commands + fat workflows. Hivemind's 19 mixed files should follow this pattern.
2. **Namespace routing is a 90% token savings** — trivial to implement, massive impact on system prompt density.
3. **Workflow size budget enforcement** prevents context bloat and forces decomposition.
4. **Hivemind's permission model + WaiterModel are strictly superior** to GSD's binary tool lists + Task() calls. Never regress on these.
5. **GSD's platform adaptation at install time** (transforming commands per runtime) is a pattern Hivemind might adopt for its `bootstrap-init` tool.
