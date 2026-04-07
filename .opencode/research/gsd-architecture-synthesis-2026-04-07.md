# GSD (Get-Shit-Done) — Complete Architecture Synthesis

**Date:** 2026-04-07  
**Source:** `/tmp/gsd-full/` (local clone of `https://github.com/gsd-build/get-shit-done`)  
**Purpose:** Build a real audit skill — understanding GSD's execution model, context continuity, temp folder structure, and subsession message auto-export.

---

## 1. System Architecture Overview

GSD is a **meta-prompting, context engineering, and spec-driven development system** for 11 AI coding runtimes (Claude Code, OpenCode, Gemini, Kilo, Codex, Copilot, Antigravity, Cursor, Windsurf, Augment, Trae).

### Three-Layer Architecture

| Layer | What | Where |
|-------|------|-------|
| **Commands** (68 files) | User-facing slash commands (`/gsd-execute-phase`, `/gsd-plan-phase`, etc.) | `commands/gsd/*.md` |
| **Workflows** (68 files) | Detailed step-by-step instructions that commands delegate to | `get-shit-done/workflows/*.md` |
| **Agents** (23 files) | Specialist subagent definitions with tool permissions | `agents/*.md` |
| **SDK** (45 TS files) | TypeScript library for programmatic GSD control | `sdk/src/` |
| **CLI** (226KB install.js + gsd-tools.cjs) | Cross-platform installer + state management CLI | `bin/` + `get-shit-done/bin/` |
| **References** (33 files) | Pattern libraries, gate taxonomy, continuation format | `get-shit-done/references/` |
| **Templates** (30+ files) | Output document templates | `get-shit-done/templates/` |
| **Hooks** (9 files) | Runtime hooks for context monitoring, session state | `hooks/` |

---

## 2. Agent Execution Model (bash → parse → connect → launch → fail-resume-with-ID)

### 2.1 The Core Pattern

GSD agents follow a **strict execution lifecycle**:

```
User invokes /gsd-<command>
  → Command reads workflow file (@~/.claude/get-shit-done/workflows/<name>.md)
    → Workflow runs `gsd-tools.cjs init <operation>` (bash)
      → Parses JSON init output (parse)
        → Loads context files from disk (connect)
          → Spawns subagent(s) with structured prompts (launch)
            → Subagent hits checkpoint OR completes
              → If checkpoint: return structured message, wait for user
              → If complete: commit, create SUMMARY.md, update STATE.md
              → If fail: create .continue-here.md, checkpoint with ID
```

### 2.2 The Init Pattern (Every Workflow Starts Here)

Every workflow begins with a standardized bash init call:

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init execute-phase "${PHASE_ARG}")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

The `@file:` prefix handles large JSON results — gsd-tools writes to a temp file and returns `@file:/path/to/result.json` instead of stdout.

**Init returns structured JSON** with:
- `phase_found`, `phase_dir`, `phase_number`, `phase_name`
- `plans`, `incomplete_plans`, `plan_count`
- `executor_model`, `verifier_model` (resolved from config profiles)
- `commit_docs`, `parallelization`, `branching_strategy`
- `state_exists`, `roadmap_exists`
- `response_language` (for i18n)

### 2.3 Subagent Spawning Pattern

Commands spawn agents using the `Task()` API:

```
Task(
  prompt=filled_prompt_with_files_to_read,
  subagent_type="gsd-executor",
  model="{resolved_model}",
  description="Execute plan {phase}-{plan}"
)
```

**Key design:** Agents load their OWN context via `<files_to_read>` blocks in the prompt — the orchestrator does NOT inline large files. This keeps orchestrator context lean (~15%) while giving each subagent full context (100%).

### 2.4 Checkpoint / Fail-Resume Protocol

When an agent hits a checkpoint, it returns a **structured message**:

```markdown
## CHECKPOINT REACHED

**Type:** [human-verify | decision | human-action]
**Plan:** {phase}-{plan}
**Progress:** {completed}/{total} tasks complete

### Completed Tasks
| Task | Name | Commit | Files |
| 1 | [name] | [hash] | [files] |

### Current Task
**Task {N}:** [name]
**Status:** [blocked | awaiting verification]
**Blocked by:** [specific]
```

**Continuation agents** are spawned with `<completed_tasks>` in their prompt:
1. Verify previous commits exist (`git log --oneline -5`)
2. DO NOT redo completed tasks
3. Start from resume point
4. Handle based on checkpoint type

### 2.5 The `.continue-here.md` Anti-Pattern File

When work is interrupted mid-phase, GSD creates `.continue-here.md` in the phase directory:

```yaml
---
phase: XX-name
task: 3
total_tasks: 7
status: in_progress
last_updated: 2025-01-15T14:30:00Z
---
```

Sections: `<current_state>`, `<completed_work>`, `<remaining_work>`, `<decisions_made>`, `<blockers>`, `<context>`, `<next_action>`.

**Critical:** When resuming, the execute-phase workflow MANDATORILY reads this file and requires the agent to demonstrate understanding of each blocking anti-pattern before proceeding — not just acknowledge it.

---

## 3. Command → Workflow Mapping

### 3.1 Command Structure (Thin Shell)

Commands are **thin delegation wrappers** (~30-70 lines each):

```yaml
---
name: gsd:execute-phase
description: Execute all plans in a phase with wave-based parallelization
argument-hint: "<phase-number> [--wave N] [--gaps-only] [--interactive]"
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash, Task, TodoWrite, AskUserQuestion]
---
<objective>
Execute all plans in a phase using wave-based parallel execution.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-phase.md
@~/.claude/get-shit-done/references/ui-brand.md
</execution_context>

<process>
Execute the execute-phase workflow from @~/.claude/get-shit-done/workflows/execute-phase.md end-to-end.
</process>
```

**Pattern:** Command defines objective + lists workflow file → says "Execute the workflow end-to-end" → workflow file contains ALL actual logic.

### 3.2 Key Commands

| Command | Purpose | Workflow |
|---------|---------|----------|
| `gsd:discuss-phase` | Gather context via questioning | `discuss-phase.md` (3 variants) |
| `gsd:plan-phase` | Create PLAN.md with verification loop | `plan-phase.md` (43KB+) |
| `gsd:execute-phase` | Wave-based parallel execution | `execute-phase.md` (51KB+) |
| `gsd:verify-work` | Conversational UAT testing | `verify-work.md` |
| `gsd:validate-phase` | Nyquist validation gap filling | `validate-phase.md` |
| `gsd:audit-fix` | Autonomous audit-to-fix pipeline | `audit-fix.md` |
| `gsd:audit-milestone` | Milestone completion audit | `audit-milestone.md` |
| `gsd:debug` | Systematic debugging | `debug.md` |

### 3.3 Flag Handling

Commands document flags but **flags are only active when literally present in `$ARGUMENTS`**:

```
- `--wave N` is active only if the literal `--wave` token is present
- Do not infer that a flag is active just because it is documented
```

---

## 4. Context Continuity Mechanisms

### 4.1 Dual-Layer State System

| Layer | Purpose | File |
|-------|---------|------|
| **Durable JSON** | Machine-readable state, config, metrics | `.planning/config.json`, `.planning/STATE.md` |
| **In-memory Maps** | Runtime session tracking | (SDK `state.ts`) |

### 4.2 Context Monitor Hook (`hooks/gsd-context-monitor.js`)

**Mechanism:**
1. Statusline hook writes metrics to `/tmp/claude-ctx-{session_id}.json`
2. Context monitor reads metrics after each tool use (PostToolUse hook)
3. When remaining context drops below thresholds, injects warning as `additionalContext`

**Thresholds:**
- **WARNING** (remaining ≤ 35%): Agent should wrap up current task
- **CRITICAL** (remaining ≤ 25%): Agent should stop immediately, save state

**Debounce:** 5 tool uses between warnings. Severity escalation (WARNING → CRITICAL) bypasses debounce.

**GSD-aware messaging:** When `.planning/STATE.md` exists, the warning tells the agent "GSD state is already tracked in STATE.md" — no need to write handoff files.

### 4.3 Session State Hook (`hooks/gsd-session-state.sh`)

**OPT-IN:** Only active when `config.json` has `hooks.community: true`.

Injects the first 20 lines of `STATE.md` on every session start for orientation.

### 4.4 The `gsd-tools.cjs` State CLI

All state operations go through `gsd-tools.cjs`:

```bash
# Initialize operation context
node gsd-tools.cjs init execute-phase "3"

# State management
node gsd-tools.cjs state advance-plan
node gsd-tools.cjs state update-progress
node gsd-tools.cjs state record-metric --phase "03" --plan "01" --duration "120"
node gsd-tools.cjs state add-decision --phase "03" --summary "Chose JWT over sessions"
node gsd-tools.cjs state record-session --stopped-at "Completed 03-01"

# Config
node gsd-tools.cjs config-get workflow._auto_chain_active
node gsd-tools.cjs config-set workflow.auto_advance true

# Model resolution
node gsd-tools.cjs resolve-model gsd-executor --raw

# Commit routing
node gsd-tools.cjs commit "feat(03-01): add dashboard" --files src/Dashboard.tsx
node gsd-tools.cjs commit-to-subrepo "feat(03-01): add API" --files backend/api.ts frontend/view.tsx
```

### 4.5 Context Budget Rules

| Context Window | Subagent Output Reading | SUMMARY.md | VERIFICATION.md |
|---------------|------------------------|------------|-----------------|
| < 500k (200k model) | Frontmatter only | Frontmatter only | Frontmatter only |
| >= 500k (1M model) | Full body permitted | Full body permitted | Full body permitted |

**Degradation tiers:** PEAK (0-30%) → GOOD (30-50%) → DEGRADING (50-70%) → POOR (70%+)

---

## 5. Temp Folder / `.planning/` Structure

### 5.1 Directory Layout

```
.planning/
├── config.json                    # Project config (mode, parallelization, workflow flags)
├── STATE.md                       # Current state (position, decisions, blockers, metrics)
├── ROADMAP.md                     # Phase definitions with success criteria
├── REQUIREMENTS.md                # Requirements with traceability table
├── PROJECT.md                     # Project definition
├── phases/
│   ├── 01-foundation/
│   │   ├── 01-01-PLAN.md          # Execution plan
│   │   ├── 01-01-SUMMARY.md       # Execution results
│   │   ├── 01-01-VERIFICATION.md  # Verification report
│   │   ├── 01-01-VALIDATION.md    # Nyquist validation map
│   │   ├── 01-01-CONTEXT.md       # User decisions from discuss-phase
│   │   ├── 01-01-RESEARCH.md      # Technical research
│   │   ├── .continue-here.md      # Resume handoff (deleted after resume)
│   │   └── deferred-items.md      # Out-of-scope discoveries
│   ├── 02-authentication/
│   │   └── ...
│   └── XX-name/
│       └── ...
├── debug/
│   └── {slug}.md                  # Debug session state
└── codebase/                      # Codebase maps (generated by gsd-codebase-mapper)
```

### 5.2 Key File Purposes

| File | Purpose | Created By |
|------|---------|------------|
| `STATE.md` | Single source of truth for project state | gsd-tools.cjs state commands |
| `ROADMAP.md` | Phase definitions, goals, success criteria | gsd-roadmapper agent |
| `REQUIREMENTS.md` | Requirements with `[x]` checkboxes | gsd-planner / init workflow |
| `PLAN.md` | Task-level execution plan | gsd-planner agent |
| `SUMMARY.md` | Execution results, deviations, decisions | gsd-executor agent |
| `VERIFICATION.md` | Goal-backward verification report | gsd-verifier agent |
| `VALIDATION.md` | Nyquist test verification map | gsd-nyquist-auditor |
| `CONTEXT.md` | Locked user decisions | gsd-discuss-phase |
| `RESEARCH.md` | Technical research findings | gsd-phase-researcher |
| `.continue-here.md` | Resume handoff (temporary) | Executor on interruption |

---

## 6. Subsession Message Auto-Export

### 6.1 How It Works

GSD does **NOT** use a generic "auto-export all messages" mechanism. Instead, it uses **structured return formats** from subagents:

1. **Executor returns:** `## PLAN COMPLETE` or `## CHECKPOINT REACHED` with structured tables
2. **Verifier returns:** `## Verification Complete` with status + score + gaps
3. **Plan-checker returns:** `## VERIFICATION PASSED` or `## ISSUES FOUND`
4. **Debugger returns:** `## ROOT CAUSE FOUND` or `## DEBUG COMPLETE`

The orchestrator parses these **structured markdown markers** from the subagent's final output — not from raw message streams.

### 6.2 SDK Event Stream (For Programmatic Use)

The SDK has a full **event stream** system (`sdk/src/event-stream.ts`) that emits typed events:

```typescript
enum GSDEventType {
  SessionInit, SessionComplete, SessionError,
  AssistantText, ToolCall, ToolProgress, ToolUseSummary,
  TaskStarted, TaskProgress, TaskNotification,
  CostUpdate, APIRetry, RateLimit, StatusChange, CompactBoundary,
  PhaseStart, PhaseStepStart, PhaseStepComplete, PhaseComplete,
  WaveStart, WaveComplete,
  MilestoneStart, MilestoneComplete,
  InitStart, InitStepStart, InitStepComplete, InitComplete, InitResearchSpawn,
}
```

**Transports** consume these events and can write to files, WebSockets, etc. The `cli-transport.ts` and `ws-transport.ts` implementations handle CLI output and WebSocket streaming respectively.

### 6.3 Cost Tracking

Per-session cost buckets in `types.ts`:
```typescript
interface CostTracker {
  sessions: Map<string, CostBucket>;  // keyed by session_id
  cumulativeCostUsd: number;
  activeSessionId?: string;
}
```

---

## 7. Gate System

GSD uses **4 gate types** across all workflows:

| Gate | Purpose | When | Recovery |
|------|---------|------|----------|
| **Pre-flight** | Validate preconditions | Before starting | Fix missing precondition |
| **Revision** | Quality loop with cap | After producer | Address feedback, re-evaluate (max 3 iterations) |
| **Escalation** | Surface to human | Unresolvable | Developer chooses action |
| **Abort** | Terminate to prevent damage | Critical failure | Investigate, fix, restart from checkpoint |

**Revision loop stall detection:** If issue count does not decrease between consecutive iterations, escalate early.

---

## 8. Audit-Specific Patterns

### 8.1 `gsd:audit-fix` — Autonomous Audit-to-Fix Pipeline

```
Run audit → Parse findings → Classify (auto-fixable | manual-only | skip)
  → For each auto-fixable (up to --max):
    → Spawn executor agent for fix
    → Run tests
    → If pass: commit with finding ID
    → If fail: revert, STOP pipeline
  → Report summary
```

**Key:** Pipeline stops on FIRST test failure — no cascading fixes.

### 8.2 `gsd:audit-milestone` — Milestone Completion Audit

1. Initialize milestone context (`gsd-tools.cjs init milestone-op`)
2. Read all phase VERIFICATION.md files
3. Spawn `gsd-integration-checker` for cross-phase wiring
4. **3-source cross-reference** for requirements:
   - REQUIREMENTS.md traceability table
   - Phase VERIFICATION.md requirements tables
   - SUMMARY.md frontmatter `requirements_completed`
5. Status determination matrix (satisfied/partial/unsatisfied/orphaned)
6. Nyquist compliance discovery
7. Aggregate into `v{version}-MILESTONE-AUDIT.md`

### 8.3 `gsd:validate-phase` — Nyquist Validation

Three states:
- (A) VALIDATION.md exists → audit and fill gaps
- (B) No VALIDATION.md, SUMMARY.md exists → reconstruct from artifacts
- (C) Phase not executed → exit with guidance

Output: updated VALIDATION.md + generated test files.

### 8.4 `gsd-verifier` — Goal-Backward Verification

**4-level artifact verification:**
1. **Exists** — file present
2. **Substantive** — not a stub (min_lines, patterns)
3. **Wired** — imported AND used
4. **Data Flowing** — upstream data source produces real data (not empty arrays)

**Status classification:** `passed` | `gaps_found` | `human_needed`

**Critical rule:** `passed` is ONLY valid when human verification section is EMPTY.

---

## 9. SDK Architecture

### 9.1 Core Classes

| Class | Purpose |
|-------|---------|
| `PhaseRunner` | State machine: discuss → research → plan → plan-check → execute → verify → advance |
| `InitRunner` | New project init: setup → config → PROJECT.md → parallel research → synthesis → requirements → roadmap |
| `GSDTools` | Bridge to `gsd-tools.cjs` CLI (all .planning/ state operations) |
| `ContextEngine` | Context file resolution and loading |
| `EventStream` | Typed event emission with transport handlers |
| `PromptFactory` | Build agent prompts from workflow/template files |
| `PromptSanitizer` | Clean prompts for security |

### 9.2 Session Execution

```typescript
// Session runner uses Anthropic Agent SDK query()
const queryStream = query({
  prompt: `Execute this plan:\n\n${plan.objective}`,
  options: {
    systemPrompt: { type: 'preset', preset: 'claude_code', append: executorPrompt },
    settingSources: ['project'],
    allowedTools,
    permissionMode: 'bypassPermissions',
    maxTurns: 50,
    maxBudgetUsd: 5.0,
  },
});
```

### 9.3 Model Resolution

Priority: explicit model option > config `model_profile` > SDK default

Profile map: `balanced` → `claude-sonnet-4-6`, `quality` → `claude-opus-4-6`, `speed` → `claude-haiku-4-5`

---

## 10. Installer Architecture (`bin/install.js`)

The installer is **~5000+ lines** and handles:

### 10.1 Runtime Support Matrix

| Runtime | Config Dir | Command Format | Agent Format |
|---------|-----------|----------------|--------------|
| Claude Code | `~/.claude/` | `skills/gsd-*/SKILL.md` | `agents/*.md` |
| OpenCode | `~/.config/opencode/` | `command/gsd-*.md` (flattened) | `agents/*.md` + `mode: subagent` |
| Gemini | `~/.gemini/` | `commands/gsd/*.toml` | `agents/*.md` (Gemini tool names) |
| Kilo | `~/.config/kilo/` | `command/gsd-*.md` (flattened) | `agents/*.md` + permission blocks |
| Codex | `~/.codex/` | `skills/gsd-*/SKILL.md` | `agents/*.toml` + `config.toml` |
| Copilot | `.github/` | `skills/gsd-*/SKILL.md` | `agents/*.agent.md` |
| Cursor | `~/.cursor/` | `skills/gsd-*/SKILL.md` | `agents/*.md` |
| Windsurf | `~/.codeium/windsurf/` | `skills/gsd-*/SKILL.md` | `agents/*.md` |
| Augment | `~/.augment/` | `skills/gsd-*/SKILL.md` | `agents/*.md` |
| Trae | `~/.trae/` | `skills/gsd-*/SKILL.md` | `agents/*.md` |
| Antigravity | `~/.gemini/antigravity/` | `skills/gsd-*/SKILL.md` | `agents/*.md` |

### 10.2 Conversion Pipeline

For each runtime, the installer:
1. Copies commands/agents/references/templates from source
2. Replaces path references (`~/.claude/` → runtime-specific paths)
3. Converts frontmatter (tool names, field names, format)
4. Converts tool references in body text
5. Neutralizes agent references ("Claude" → "the agent", "CLAUDE.md" → runtime equivalent)
6. Handles runtime-specific quirks (Gemini `${VAR}` escaping, Copilot CONV-06/07, etc.)

---

## 11. Key Patterns for Building an Audit Skill

### 11.1 What to Replicate

1. **Thin command → thick workflow** pattern
2. **Init-first** pattern (always call `gsd-tools.cjs init <op>` before any logic)
3. **Structured return formats** (markdown markers for orchestrator parsing)
4. **Checkpoint protocol** (human-verify, decision, human-action)
5. **Gate taxonomy** (pre-flight, revision, escalation, abort)
6. **Context budget awareness** (frontmatter-only reads at <500k tokens)
7. **Deviation tracking** (auto-fix rules 1-3, ask on rule 4)
8. **Per-task atomic commits** with finding IDs for traceability

### 11.2 What NOT to Replicate

1. **The 5000-line installer** — this is runtime-specific plumbing
2. **TOML parser for Codex** — unless building Codex support
3. **11-runtime conversion functions** — pick your target runtime
4. **The full event stream** — unless building programmatic SDK integration

### 11.3 Critical File References for Audit Skill

| File | Why It Matters |
|------|---------------|
| `agents/gsd-executor.md` | Core execution pattern, deviation rules, checkpoint protocol |
| `agents/gsd-verifier.md` | 4-level verification, gap structuring, override system |
| `agents/gsd-plan-checker.md` | 11-dimension plan verification, revision loop |
| `agents/gsd-nyquist-auditor.md` | Test generation, debug loop, escalation |
| `get-shit-done/workflows/audit-fix.md` | Audit-to-fix pipeline flow |
| `get-shit-done/workflows/audit-milestone.md` | 3-source cross-reference, integration checking |
| `get-shit-done/references/checkpoints.md` | Checkpoint types, automation reference, anti-patterns |
| `get-shit-done/references/gates.md` | Gate taxonomy (4 types) |
| `get-shit-done/references/context-budget.md` | Context management rules |
| `get-shit-done/references/continuation-format.md` | Next-step presentation format |
| `get-shit-done/references/git-integration.md` | Per-task commit strategy, sub-repo support |
| `hooks/gsd-context-monitor.js` | Context awareness injection mechanism |

---

## 12. Summary: The GSD Philosophy

GSD is built on these principles:

1. **Orchestrator routes, specialists execute** — never mix coordination with implementation
2. **Context is budgeted, not infinite** — read depth scales with window size
3. **State is on disk, not in memory** — `.planning/` files are the single source of truth
4. **Verification is goal-backward, not task-forward** — start from "what should be true" and verify
5. **Checkpoints are for humans, not machines** — if it has CLI/API, Claude does it
6. **Commits are atomic outcomes, not process diaries** — per-task commits with finding IDs
7. **Gates prevent waste** — pre-flight blocks entry, revision loops with caps, escalation for ambiguity, abort for danger
8. **Continuation is structured, not ad-hoc** — `.continue-here.md` with mandatory comprehension verification
