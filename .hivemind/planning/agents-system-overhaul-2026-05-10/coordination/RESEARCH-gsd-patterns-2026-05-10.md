# RESEARCH: GSD Framework Architecture Patterns

**Agent:** hm-l2-researcher  
**Domain:** Research — GSD pattern extraction for Hivemind agent system overhaul  
**Date:** 2026-05-10  
**Status:** COMPLETED  

---

## Table of Contents

1. [Agent YAML Frontmatter Schema](#1-agent-yaml-frontmatter-schema)
2. [Agent Body Structure Patterns](#2-agent-body-structure-patterns)
3. [Skill SKILL.md Format and Progressive Disclosure](#3-skill-skillmd-format-and-progressive-disclosure)
4. [Command YAML Format and $ARGUMENTS Parsing](#4-command-yaml-format-and-arguments-parsing)
5. [Planning Workflow and State Persistence](#5-planning-workflow-and-state-persistence)
6. [Quality Gate Enforcement Patterns](#6-quality-gate-enforcement-patterns)
7. [Delegation Lifecycle Patterns](#7-delegation-lifecycle-patterns)
8. [Key Patterns to Adopt for Hivemind](#8-key-patterns-to-adopt-for-hivemind)
9. [Key Patterns to Avoid](#9-key-patterns-to-avoid)

---

## 1. Agent YAML Frontmatter Schema

### Canonical Schema (from GSD upstream + local analysis)

Source: `gsd-build/get-shit-done` repo agents, local `.hivefiver-meta-builder/agents-lab/active/refactoring/gsd-*.md`

```yaml
---
name: gsd-<specialist-name>          # REQUIRED. String. Must match filename without .md
description: <1-2 sentence purpose>   # REQUIRED. String. Used by orchestrator for routing
mode: subagent                        # RUNTIME-SPECIFIC. Only for OpenCode/Kilo. Not in Claude Code
tools:                                # REQUIRED for Claude Code. List of allowed tools
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
  - mcp__context7__*
color: <yellow|blue|green|red>       # OPTIONAL. Terminal color for agent output
# hooks:                              # OPTIONAL. PostToolUse hooks (commented out in most agents)
#   PostToolUse:
#     - matcher: "Write|Edit"
#       hooks:
#         - type: command
#           command: "npx eslint --fix $FILE 2>/dev/null || true"
---
```

### Field-by-Field Analysis

| Field | Required | Type | Purpose | Hivemind Notes |
|-------|----------|------|---------|----------------|
| `name` | Yes | string | Must match filename. Format: `gsd-<role>` | Hivemind uses `hm-l2-<role>`, `hf-l2-<role>` |
| `description` | Yes | string | 1-2 sentences. Used by orchestrator for agent selection | Critical for routing — must be descriptive |
| `mode` | Runtime-specific | string | `subagent` for OpenCode/Kilo. Absent in Claude Code | Hivemind always uses OpenCode — always include |
| `tools` | Yes (CC) | list | Tool whitelist for agent | Hivemind uses STRICT/FLEXIBLE lineage rules |
| `color` | Optional | string | Terminal color for agent output banners | Nice UX touch for terminal |
| `hooks` | Optional | object | PostToolUse hooks (auto-lint, etc.) | Not currently used in Hivemind |

### Evidence

- `gsd-executor.md:1-4` — `name`, `description`, `mode: subagent`
- `gsd-planner.md:1-4` — same pattern
- `gsd-debugger.md:1-4` — same pattern
- `gsd-code-reviewer.md:1-4` — same pattern
- Upstream GSD repo `agents/gsd-executor.md` shows `tools: Read, Write, Edit, Bash, Grep, Glob, mcp__context7__*` and `color: yellow`
- DeepWiki confirms: `tests/agent-frontmatter.test.cjs` validates `name`, `description`, `tools`, `color`

---

## 2. Agent Body Structure Patterns

### Common Body Structure (ALL GSD agents)

Every GSD agent body follows a consistent XML-tagged section pattern:

```markdown
<role>
  You are a GSD <specialist>. <1-2 sentence summary of role>.
  
  Spawned by:
  - `/gsd-<command>` orchestrator (primary context)
  - <other spawn contexts>
  
  Your job: <specific deliverable statement>
  
  @<path-to-mandatory-initial-read>
</role>

<documentation_lookup>
  Context7 MCP resolution order (MCP first, CLI fallback via npx)
</documentation_lookup>

<project_context>
  Read ./AGENTS.md if exists. Follow project-specific guidelines.
  Project skills discovery from .claude/skills/ or .agents/skills/
</project_context>

<execution_flow>
  <step name="load_project_state" priority="first">
    Load execution context via gsd-sdk or filesystem reads
  </step>
  
  <step name="core_task" priority="normal">
    Main specialist work
  </step>
  
  <step name="return_results" priority="last">
    Write artifacts, return structured completion marker
  </step>
</execution_flow>
```

### Role-Specific Body Patterns

#### Specialist Agent (gsd-executor, gsd-debugger, gsd-planner)
- **Role block:** Describes specialist capability + who spawns it
- **Required reading:** References loaded via `@<path>` syntax
- **Execution flow:** Named steps with priority ordering
- **Completion marker:** `## PLAN COMPLETE`, `## PLANNING COMPLETE`, `## DEBUG COMPLETE`
- **Tool usage:** Heavy — Read, Write, Edit, Bash, Grep, Glob

#### Reviewer/Verifier Agent (gsd-code-reviewer, gsd-verifier)
- **Adversarial stance block:** Explicit adversarial framing ("assume code has bugs")
- **Required classification system:** BLOCKER/WARNING/FAILED findings
- **Common failure modes:** Anti-pattern list for the agent to avoid
- **Evidence-first:** Every finding must have file:line evidence

#### Orchestrator Agent (embedded in workflows, not separate files)
- GSD uses **workflow files** (`get-shit-done/workflows/*.md`) as orchestrators, NOT agent files
- Workflows are loaded by commands and handle: parse args → spawn agents → collect results → update state
- The orchestrator stays **thin** — ~15% context budget, delegates 100% fresh context to subagents

### Key Structural Patterns

1. **XML-tagged sections:** `<role>`, `<execution_flow>`, `<step>`, `<project_context>` etc.
2. **Priority-ordered steps:** `priority="first|normal|last"` within `<execution_flow>`
3. **File reference syntax:** `@<absolute-path>` for loading reference content
4. **Completion markers:** Standardized `## ALL_CAPS_MARKER` H2 headings
5. **Adversarial framing:** Reviewer/verifier agents explicitly told to assume failure
6. **Agent contracts:** Each agent has documented completion markers (see `agent-contracts.md`)

---

## 3. Skill SKILL.md Format and Progressive Disclosure

### SKILL.md Format

Source: Local `.hivefiver-meta-builder/skills-lab/active/refactoring/gsd-plan-phase/SKILL.md`

```yaml
---
name: gsd-<skill-name>
description: "<brief description for trigger matching>"
---
```

### Body Structure

```markdown
<objective>
  What the skill achieves. Default flow description.
  Flag/modifier documentation.
  Orchestrator role summary.
</objective>

<execution_context>
  @<path-to-workflow-file>
  @<path-to-ui-brand-reference>
</execution_context>

<runtime_note>
  Runtime-specific adaptations (e.g., Copilot vs AskUserQuestion)
</runtime_note>

<context>
  Phase: $ARGUMENTS
  Flags documentation with --flag descriptions.
  Active flag derivation rules.
</context>

<process>
  Execute the <workflow-name> workflow from @<path> end-to-end.
  Preserve all workflow gates.
</process>
```

### Progressive Disclosure Pattern

GSD skills use a **4-layer progressive disclosure** architecture:

| Layer | File | Purpose | Token Cost |
|-------|------|---------|------------|
| **L1: SKILL.md** | Skill entry point | Objective, context, flags, process pointer | ~50 lines |
| **L2: Workflow** | `get-shit-done/workflows/*.md` | Full orchestration logic with step-by-step process | 200-1700 lines |
| **L3: References** | `get-shit-done/references/*.md` | Domain-specific guidance (debugger-philosophy, gates, etc.) | 50-500 lines each |
| **L4: Templates/Scripts** | `get-shit-done/templates/`, `get-shit-done/bin/` | Scaffold generators, CLI tools | Variable |

**Key principle:** Skills are thin wrappers that delegate to workflows. Workflows are the heavy orchestration logic. References provide domain expertise on demand.

### How Skills Reference Agents

Skills don't directly reference agents. Instead:
1. Skill loads a **workflow** via `<execution_context>`
2. Workflow defines **which agents** to spawn and how
3. Workflow uses `<available_agent_types>` block to list valid agents
4. Agent spawning happens through runtime-native `Task()` (Claude Code) or `delegate-task` (OpenCode)

### Evidence

- `gsd-plan-phase/SKILL.md:1-49` — Complete skill file
- `gsd-execute-phase/SKILL.md:1-53` — Complete skill file  
- `get-shit-done/workflows/execute-phase.md:1-80` — Workflow loads agents
- Both skills use `<process>` block that says "Execute the <workflow> from @<path> end-to-end"

---

## 4. Command YAML Format and $ARGUMENTS Parsing

### Command YAML Frontmatter (Claude Code format)

Source: Upstream `gsd-build/get-shit-done` repo `commands/gsd/plan-phase.md`

```yaml
---
name: gsd:plan-phase                    # Namespace:command-name format
description: Create detailed phase plan (PLAN.md) with verification loop
argument-hint: "[phase] [--auto] [--research] [--skip-research] [--gaps] ..."
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - Agent
  - AskUserQuestion
  - WebFetch
  - mcp__context7__*
---
```

### Command YAML Frontmatter (OpenCode format)

Source: Local `.hivefiver-meta-builder/commands-lab/active/refactoring/start-work.md`

```yaml
---
description: "Execute a task plan with full orchestration..."
agent: hm-l2-conductor                  # Target agent for OpenCode
subtask: false                           # Whether this is a subtask delegation
---
```

### Field Comparison

| Field | Claude Code | OpenCode | Purpose |
|-------|------------|----------|---------|
| `name` | `gsd:command-name` | Absent | Namespace + command name |
| `description` | Yes | Yes | User-facing description |
| `argument-hint` | Yes | Absent | Help text for arguments |
| `allowed-tools` | Yes (list) | Absent | Tool whitelist |
| `agent` | Absent | Yes | Target agent name |
| `subtask` | Absent | Yes | Whether subtask delegation |

### $ARGUMENTS Parsing Pattern

GSD commands receive user arguments via `$ARGUMENTS` variable. The parsing pattern is:

1. **First positional token** → `PHASE_ARG` (e.g., phase number)
2. **Named flags** → extracted by literal token presence check
   - `--wave N` → `WAVE_FILTER`
   - `--gaps-only` → boolean
   - `--interactive` → boolean
   - `--research` → force-refresh
   - `--skip-research` → skip research step

**Critical rule from GSD:** "Active flags must be derived from `$ARGUMENTS`. A flag is active ONLY when its literal token appears in `$ARGUMENTS`. Do not infer that a flag is active just because it is documented."

### Evidence

- Upstream `commands/gsd/execute-phase.md` — `name`, `allowed-tools`, `argument-hint`
- Upstream `commands/gsd/plan-phase.md` — same pattern
- Local `start-work.md` — OpenCode format with `agent` and `subtask`
- Local `plan.md` — OpenCode format
- `get-shit-done/workflows/execute-phase.md:54-64` — $ARGUMENTS parsing step

---

## 5. Planning Workflow and State Persistence

### The GSD Workflow Loop

```
discuss → plan → execute → verify → (optional: code-review → ship)
```

Detailed per-stage:

| Stage | Command | What Happens | Artifacts Produced |
|-------|---------|--------------|-------------------|
| **Init** | `/gsd-new-project` | Creates project structure | `PROJECT.md`, `ROADMAP.md`, `STATE.md`, `REQUIREMENTS.md` |
| **Discuss** | `/gsd-discuss-phase` | Interactive requirements gathering | `CONTEXT.md` (user decisions, deferred items, discretion areas) |
| **Research** | (embedded in plan-phase) | Technical research for phase | `RESEARCH.md` |
| **Plan** | `/gsd-plan-phase` | Creates executable plans | `PLAN.md` files (1-N per phase) |
| **Execute** | `/gsd-execute-phase` | Wave-based plan execution | `SUMMARY.md` per plan, git commits |
| **Verify** | `/gsd-verify-work` | Goal-backward verification | `VERIFICATION.md` |
| **Review** | `/gsd-code-review` | Adversarial code review | `REVIEW.md` |
| **Ship** | `/gsd-ship` | PR creation | PR on GitHub |

### State Files

| File | Purpose | Format | Who Writes | Who Reads |
|------|---------|--------|------------|-----------|
| `PROJECT.md` | Project vision, tech stack, constraints | Markdown + frontmatter | `/gsd-new-project` | All agents |
| `ROADMAP.md` | Phase list, status, requirements mapping | Markdown + frontmatter | `/gsd-phase`, `/gsd-complete-milestone` | All agents |
| `STATE.md` | Session memory: decisions, blockers, position | Markdown + frontmatter | Executors, verifiers | All agents |
| `REQUIREMENTS.md` | Scoped requirements with IDs | Markdown | `/gsd-new-project`, `/gsd-discuss-phase` | Planners, verifiers |
| `CONTEXT.md` | Per-phase user decisions (locked/deferred/discretion) | Markdown | `/gsd-discuss-phase` | Planners |
| `PLAN.md` | Executable task breakdown with frontmatter | Markdown + YAML frontmatter | `gsd-planner` | `gsd-executor` |
| `SUMMARY.md` | What happened during execution | Markdown + frontmatter | `gsd-executor` | `gsd-verifier` |
| `VERIFICATION.md` | Goal achievement report | Markdown | `gsd-verifier` | Orchestrator |
| `REVIEW.md` | Code review findings | Markdown | `gsd-code-reviewer` | Orchestrator |
| `RESEARCH.md` | Technical research findings | Markdown | `gsd-phase-researcher` | `gsd-planner` |

### PLAN.md Frontmatter Schema

```yaml
---
phase: 01-foundation           # Phase identifier
plan: 1                         # Plan number within phase
type: execute                   # "execute" or "tdd"
wave: 1                         # Execution wave (for parallelization)
depends_on: [P01-0]            # Plan IDs this depends on
files_modified: [src/x.ts]     # Files this plan touches
autonomous: true                # true = no checkpoints
requirements: [AUTH-01]        # Requirement IDs from ROADMAP
must_haves:                     # Goal-backward verification criteria
  - "User can authenticate"
user_setup: []                  # Human-required setup items
---
```

### Evidence

- `get-shit-done/workflows/execute-phase.md:1-80` — Workflow with plan frontmatter loading
- `agent-contracts.md:44-60` — Handoff contracts (Planner → Executor, Executor → Verifier)
- DeepWiki: "GSD maintains several state files in the `.planning/` directory"
- Upstream `docs/COMMANDS.md` — Full command lifecycle documentation

---

## 6. Quality Gate Enforcement Patterns

### Gate Types

GSD uses **structured gate prompts** (from `references/gate-prompts.md`):

| Pattern | Options | Use Case |
|---------|---------|----------|
| `approve-revise-abort` | Approve / Request changes / Abort | Plan approval, gap closure |
| `yes-no` | Yes / No | Confirm re-plan, commit |
| `stale-continue` | Refresh / Continue anyway | Staleness warnings |
| `yes-no-pick` | Yes all / Let me pick / No | Item inclusion |
| `multi-option-failure` | Retry / Skip / Rollback / Abort | Build failures |
| `multi-option-escalation` | Accept gaps / Re-plan / Debug / Retry | Max retries exceeded |
| `multi-option-gaps` | Auto-fix / Override / Manual / Skip | Verification gaps |

### Verification Pattern (from gsd-verifier)

1. **Goal-backward verification:** Start from what phase SHOULD deliver, verify it ACTUALLY exists
2. **Do NOT trust SUMMARY.md:** Verify against code, not agent claims
3. **Classification system:** Every truth resolves to VERIFIED / FAILED (BLOCKER) / UNCERTAIN (WARNING)
4. **Adversarial stance:** "Assume the phase goal was not achieved until evidence proves it"
5. **Escalation gate:** Unresolvable gaps surfaced to developer for decision

### Plan Verification Loop (from gsd-plan-checker)

After planning, GSD runs a verification loop:
1. Spawn `gsd-plan-checker` to validate plan quality
2. If issues found → iterate (max N times)
3. Only proceed to execution after plan passes verification

### Decision Coverage Gates

GSD enforces decision coverage via `CONTEXT.md`:
- **Locked decisions (D-01, D-02)** — MUST be implemented exactly
- **Deferred ideas** — MUST NOT appear in plans
- **Agent's discretion** — Agent chooses, documents

### Evidence

- `references/gate-prompts.md:1-60` — Gate patterns with options
- `gsd-verifier.md:1-50` — Adversarial verification stance
- `gsd-planner.md:44-66` — Context fidelity and decision gates
- Upstream `docs/ARCHITECTURE.md` — "Validation architecture (Nyquist layer)"

---

## 7. Delegation Lifecycle Patterns

### Three-Layer Architecture

```
┌─────────────────────────────────┐
│  COMMAND LAYER                  │  commands/gsd/*.md
│  (User entry point)             │  - YAML frontmatter
│  - Receives $ARGUMENTS          │  - Loads workflow
│  - Delegates to workflow        │  - Returns result
└──────────────┬──────────────────┘
               │
┌──────────────▼──────────────────┐
│  WORKFLOW LAYER                 │  get-shit-done/workflows/*.md
│  (Orchestrator)                 │  - Parses args
│  - Discovers context            │  - Spawns agents
│  - Spawns specialist agents     │  - Collects results
│  - Manages state updates        │  - Handles checkpoints
└──────┬──────────┬──────────────┘
       │          │
┌──────▼───┐ ┌────▼─────┐ ┌──────────┐
│  AGENT   │ │  AGENT   │ │  AGENT   │  agents/*.md
│ (fresh   │ │ (fresh   │ │ (fresh   │  - Each gets 200K context
│ context) │ │ context) │ │ context) │  - Structured completion markers
└──────────┘ └──────────┘ └──────────┘
```

### Delegation Flow (execute-phase example)

1. **Command** `/gsd-execute-phase` receives `$ARGUMENTS`
2. **Workflow** `execute-phase.md` is loaded
3. Workflow **parses args** (phase, flags)
4. Workflow **initializes** via `gsd-sdk query init.execute-phase`
5. Workflow **discovers plans** in phase directory
6. Workflow **groups plans into waves** based on dependency analysis
7. For each wave:
   a. **Spawn agent** `Task(subagent_type="gsd-executor", prompt=<constructed>)`
   b. Agent gets **fresh 200K context** with full plan + project context
   c. Agent **executes plan** atomically, commits per task
   d. Agent **writes SUMMARY.md** and returns completion marker
   e. Workflow **collects result**, handles checkpoints if needed
8. After all waves complete: **verification** via `gsd-verifier`
9. State updates: ROADMAP.md, STATE.md

### Context Budget Management

- **Orchestrator:** ~15% of context budget (lean coordination only)
- **Subagents:** 100% fresh context each (full 200K window)
- **Key principle:** "Orchestrator coordinates, not executes"
- **Fallback rule:** If completion signal not received, verify via filesystem + git state

### Completion Markers (from agent-contracts.md)

Every GSD agent returns a standardized completion marker as H2 heading:

| Agent | Marker |
|-------|--------|
| gsd-planner | `## PLANNING COMPLETE` |
| gsd-executor | `## PLAN COMPLETE`, `## CHECKPOINT REACHED` |
| gsd-debugger | `## DEBUG COMPLETE`, `## ROOT CAUSE FOUND`, `## CHECKPOINT REACHED` |
| gsd-verifier | `## Verification Complete` |
| gsd-code-reviewer | Produces `REVIEW.md` artifact |

### Agent Spawning (Runtime-Specific)

| Runtime | Spawning Mechanism |
|---------|-------------------|
| Claude Code | `Task(subagent_type="gsd-<name>", prompt=..., model=...)` |
| OpenCode | `delegate-task` with agent name + prompt |
| Copilot | Sequential inline execution (parallel spawning unreliable) |
| Gemini CLI | Task spawning |

### Evidence

- `get-shit-done/workflows/execute-phase.md:1-80` — Full orchestration logic
- `references/agent-contracts.md:1-60` — Agent registry with completion markers
- Upstream `docs/ARCHITECTURE.md` — Three-layer component architecture diagram
- DeepWiki: "The delegation lifecycle involves a workflow orchestrator spawning an agent"

---

## 8. Key Patterns to Adopt for Hivemind

### 8.1 Completion Markers (HIGH VALUE)

**What:** Standardized `## ALL_CAPS_MARKER` H2 headings for agent completion signals.  
**Why:** Hivemind's WaiterModel dual-signal completion could benefit from structured text markers in addition to the existing `delegation-status` tool.  
**Adoption:** Every hm-* agent should return a known completion marker. Gate skills already use PASS/FAIL — align with GSD's pattern.

### 8.2 Adversarial Stance for Reviewers (HIGH VALUE)

**What:** Reviewer/verifier agents explicitly told "assume failure until evidence proves otherwise."  
**Why:** Prevents rubber-stamp reviews. Hivemind's `hm-l2-critic` and `gate-*` skills should use this framing.  
**Adoption:** Add `<adversarial_stance>` blocks to all reviewer/verifier/critic agent definitions.

### 8.3 Three-Layer Command → Workflow → Agent Architecture (HIGH VALUE)

**What:** Commands are thin entry points that load workflows. Workflows orchestrate agents. Agents execute.  
**Why:** Separates routing concerns (command), orchestration logic (workflow), and execution (agent). Each layer has clear boundaries.  
**Adoption:** Hivemind commands already follow this pattern partially. Formalize with explicit workflow references in SKILL.md files.

### 8.4 Plan Frontmatter with Requirements Traceability (MEDIUM VALUE)

**What:** PLAN.md files carry `requirements: [REQ-01, REQ-02]` arrays linking tasks to requirements.  
**Why:** Enables bidirectional traceability. Verifiers can check that every requirement was addressed.  
**Adoption:** Hivemind gate-spec-compliance skill already does gap detection — this frontmatter pattern would formalize it.

### 8.5 Context Fidelity / Decision Gates (MEDIUM VALUE)

**What:** Locked decisions MUST be implemented exactly. Deferred ideas MUST NOT appear. Agent's discretion documented.  
**Why:** Prevents scope creep and ensures user intent is preserved through delegation chains.  
**Adoption:** Hivemind's `hm-l2-spec-driven-authoring` and delegation packets should formalize decision categories.

### 8.6 Wave-Based Parallel Execution (MEDIUM VALUE)

**What:** Plans grouped into dependency-aware waves. Each wave spawns parallel agents.  
**Why:** Efficient context usage — orchestrator uses ~15%, agents get 100% fresh each.  
**Adoption:** Hivemind's `hm-l2-phase-execution` skill already supports this pattern conceptually.

### 8.7 Agent Contracts Registry (MEDIUM VALUE)

**What:** A single document listing every agent's role, completion markers, and handoff schemas.  
**Why:** Enables orchestrators to reliably detect completion without guessing.  
**Adoption:** Hivemind's `hm-l3-integration-contracts` skill serves a similar purpose — add completion markers to it.

### 8.8 Structured Gate Prompts (LOW VALUE)

**What:** Pre-defined prompt patterns for common decision points (approve/revise/abort, yes/no, etc.)  
**Why:** Ensures consistent UX across different agents/workflows.  
**Adoption:** Nice-to-have for Hivemind's interactive commands but not critical for shipped product.

---

## 9. Key Patterns to AVOID

### 9.1 GSD SDK Dependency (gsd-sdk CLI calls)

**What:** GSD workflows extensively use `gsd-sdk query <command>` for state initialization, validation, and updates.  
**Why to avoid:** Hivemind is a **runtime composition engine** that ships as an npm package. Users won't have `gsd-sdk`. Hivemind uses its own tools (delegate-task, delegation-status, etc.) for state management.  
**Alternative:** Hivemind tools and shared modules handle state persistence directly.

### 9.2 Absolute Path References (`@/Users/apple/...`)

**What:** GSD agents use `@<absolute-path>` to load reference files.  
**Why to avoid:** Absolute paths are machine-specific. Hivemind agents run in any project directory.  
**Alternative:** Use relative paths from project root, or load content through OpenCode skills system.

### 9.3 Claude Code Tool Names in Agent Definitions

**What:** GSD agents reference `Task()`, `AskUserQuestion`, `TodoWrite` which are Claude Code-specific.  
**Why to avoid:** Hivemind targets OpenCode runtime. Must use `delegate-task`, OpenCode's native tools.  
**Alternative:** Agent definitions should use runtime-agnostic XML sections. Runtime-specific adaptations go in `<runtime_note>` blocks.

### 9.4 `tools:` Whitelist in Agent Frontmatter

**What:** GSD specifies tool lists per agent in frontmatter.  
**Why to avoid:** Hivemind uses **lineage-based tool rules** (hm STRICT, hf FLEXIBLE) via `hm-l3-tool-capability-matrix` skill, not per-agent whitelists.  
**Alternative:** Tool permissions derived from lineage + hierarchy, not individual agent config.

### 9.5 Heavy Workflow Files (1700+ lines)

**What:** GSD's `execute-phase.md` workflow is 1700+ lines.  
**Why to avoid:** Context budget risk. Hivemind's phase execution is handled by the runtime (delegation manager, completion detector) in `src/`, not in prompt text.  
**Alternative:** Heavy orchestration logic belongs in `src/coordination/` TypeScript, not in prompt workflows.

### 9.6 `.planning/` as State Directory

**What:** GSD uses `.planning/` for all state files.  
**Why to avoid:** Hivemind uses `.hivemind/` per Q6 architectural decision. `.planning/` is governance only.  
**Alternative:** `.hivemind/state/` for runtime state, `.planning/` for governance docs only.

### 9.7 Flat Agent Namespace (`gsd-*`)

**What:** All GSD agents use flat `gsd-` prefix regardless of hierarchy.  
**Why to avoid:** Hivemind has a **hierarchical namespace** (hm-l0, hm-l1, hm-l2, hm-l3) reflecting delegation authority.  
**Alternative:** Maintain hm-*/hf-*/gate-*/stack-* lineage prefixes with L-level indicators.

---

## Summary Statistics

| Dimension | Count |
|-----------|-------|
| GSD agents analyzed | 10+ (planner, executor, debugger, code-reviewer, verifier, phase-researcher, plan-checker, codebase-mapper, etc.) |
| GSD skills analyzed | 2 (plan-phase, execute-phase) |
| GSD commands analyzed | 4 (plan-phase, execute-phase, start-work, plan) |
| GSD workflows analyzed | 1 (execute-phase, 1700+ lines) |
| State files documented | 10 (PROJECT.md, ROADMAP.md, STATE.md, etc.) |
| Gate patterns documented | 7 |
| Completion markers documented | 20+ |

## Citations

1. **GSD GitHub Repository:** `gsd-build/get-shit-done` — https://github.com/gsd-build/get-shit-done
2. **GSD Architecture Doc:** `docs/ARCHITECTURE.md` in upstream repo — Retrieved 2026-05-10
3. **GSD Commands Reference:** `docs/COMMANDS.md` in upstream repo — Retrieved 2026-05-10
4. **GSD Configuration Reference:** `docs/CONFIGURATION.md` in upstream repo — Retrieved 2026-05-10
5. **DeepWiki Analysis:** `gsd-build/get-shit-done` — Queried 2026-05-10
6. **Local Agent Files:** `.hivefiver-meta-builder/agents-lab/active/refactoring/gsd-*.md` — Read 2026-05-10
7. **Local Skill Files:** `.hivefiver-meta-builder/skills-lab/active/refactoring/gsd-*/SKILL.md` — Read 2026-05-10
8. **Local GSD References:** `.opencode/get-shit-done/references/*.md` — Read 2026-05-10
9. **Local GSD Workflows:** `.opencode/get-shit-done/workflows/*.md` — Read 2026-05-10

## Knowledge Gaps

- **GSD v2 architecture:** The `gsd-build/gsd-2` repo exists with a different architecture (`.gsd/` directory, auto mode, web interface). Not investigated in this research cycle. May contain additional patterns for autonomous execution.
- **gsd-sdk internals:** The CLI tool's TypeScript source was not investigated. Understanding its state management patterns could inform Hivemind's `src/task-management/` design.
- **Cross-AI review:** GSD's `/gsd-review` command routes plans to external AI CLIs for review. The implementation details of this cross-model review pattern were not fully investigated.

## Recommendations

1. **Adopt completion markers** as standard protocol for all hm-* agent return values (aligns with existing WaiterModel dual-signal)
2. **Adopt adversarial stance framing** for all gate-* and hm-l2-critic/reviewer agents
3. **Formalize the three-layer architecture** (command → workflow → agent) in Hivemind's SKILL.md templates
4. **Add plan frontmatter requirements traceability** to support gate-spec-compliance bidirectional checks
5. **Create an agent contracts registry** (extension of hm-l3-integration-contracts) with completion markers
6. **Avoid GSD-SDK dependency** — use Hivemind's own TypeScript runtime for state management
7. **Avoid absolute paths** — all references should be project-relative or skill-relative
