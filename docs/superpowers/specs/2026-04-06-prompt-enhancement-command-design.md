# Design Spec: Prompt-Enhancement Command Package

**Date:** 2026-04-06
**Status:** Reviewed — 12 issues found and fixed
**Author:** Hivefiver Orchestrator
**Branch:** harness-experiment
**Reviewers:** Architecture Validation Agent + Spec Review Agent (parallel dispatch)

---

## 1. Overview

A comprehensive `/hf-prompt-enhance` command package for OpenCode that serves as an intelligent orchestrator for improving user prompts through multi-agent delegation, custom tool execution, and iterative refinement.

### Core Capabilities

| Capability | Description |
|------------|-------------|
| **Cognitive Repacking** | Repack entire cognitive contexts (prompts, attachments, disk paths) into enhancement pipeline. Operationally: read all input material, classify by type, distill into structured sections, produce enhanced prompt with preserved intent but clarified scope. |
| **Context Mapping** | Map prompt references to codebase reality via `glob`/`grep` verification. Detect dead references, stale assumptions, and conflicting instructions. |
| **Structured Output** | YAML frontmatter + XML-tagged body: what-happened-so-far, risks, task list, deferred items |
| **Session Persistence** | `.hivemind/state/session-context-prompt.md` — appendable, erasable, updateable, patch-only edits. Located outside `.opencode/` to avoid file watcher interference and git noise. |
| **Dynamic Delegation** | Runtime subagent count based on complexity, with 3rd-level context purification |

### Architecture Approach

**Approach C: Hybrid Pipeline** — Command entry point → Orchestrator → Dynamic subagent graph built at runtime based on input complexity. Simple prompts get linear 2-agent pipeline. Complex prompts get multi-lane parallel graph with synthesis.

---

## 2. Architecture

### 2.1 Entity Relationships

```
User → /hf-prompt-enhance $ARGUMENTS
    ↓
Command (thin shell, subtask: false)
    ↓
hivefiver-orchestrator (main session)
    ↓
Phase 0: prompt-skim (subtask: true, IMMEDIATE — immune system)
    ↓
Phase 1: BRIDGE (orchestrator decision layer — translates skim → delegation graph)
    ↓
Phase 2: Investigation Lanes (parallel or sequential, subtask: true)
    ├── prompt-analyzer
    ├── context-mapper
    ├── risk-assessor
    └── context-purifier (3rd-level, conditional)
    ↓
Phase 3: Clarification Gate (one-at-a-time assumptions via question tool)
    ↓
Phase 4: Finalize (prompt-repackager assembles structured output)
```

### 2.2 Runtime Subtask Decision Engine

**Phase 0 SKIM is unconditional** — it always runs as `subtask: true` with clean context, regardless of the decision engine below. This is the immune system: it must run before any tainted state is evaluated.

The decision engine below applies to **Phase 2 investigation lanes only** (after the bridge):

| Condition | Threshold | Decision |
|-----------|-----------|----------|
| Context remaining | > 70% | `subtask: false` — keep in main session |
| Context remaining | 50-70% | `subtask: true` — delegate to specialist |
| Context remaining | < 50% | `subtask: true` — force delegation + agent switch |
| Attachments | > 3 files | `subtask: true` |
| Links in prompt | > 5 | `subtask: true` |
| Prompt confusion | High contradictions | `subtask: true` |
| Auto-compacts passed | ≥ 2 | `subtask: true` |
| Combined complexity | Multiple conditions | `subtask: true` + 3rd-level explore |

### 2.3 Phase 0: SKIM (The Immune System)

**Critical:** Phase 0 runs as `subtask: true` with a **clean context** — NOT in the main session. This prevents:
- Inheriting main session's context poisoning
- Flooding the main session with scan overhead
- Corrupting the delegation decision with tainted state

The skim agent does a fast, broad scan: count, classify, estimate, verify existence. No deep reading. No link fetching. No full file content.

### 2.4 Phase 1: BRIDGE (Decision Layer)

Takes the skim profile and translates it into actionable delegation decisions:

```
IF complexity_score <= 3:
  → Linear: analyzer → repackager → validator

IF complexity_score 4-6:
  → Parallel: [analyzer, context-mapper] → repackager → validator

IF complexity_score 7+:
  → Full graph: [analyzer, context-mapper, risk-assessor] (parallel)
  → 3rd-level context-purifier if flooding_risk >= high

IF mode == repack AND attachment_count > 2:
  → context-mapper → context-purifier (per attachment) → repackager
```

### 2.5 Phase 3: Clarification Gate

After all investigation lanes complete:
1. Orchestrator synthesizes findings
2. Extracts assumptions (things inferred but not verified)
3. Presents assumptions **one-at-a-time** via `question` tool (interactive mode)
4. Patches clarification log with responses
5. Only after all resolved → proceeds to finalization

**CI Safety:** Phase 3 is inherently interactive. In `CI=true` environments, the clarification gate is **skipped** and all assumptions are marked as "unverified — review recommended" in the output. The command should be documented as requiring interactive mode for full functionality.

---

## 3. Custom Tools (`.opencode/tools/`)

All programmatic logic lives in custom tools — NOT in agent instruction bodies, NOT in skills.

### 3.1 Tool Inventory

| Tool | File | Purpose |
|------|------|---------|
| `prompt-skim` | `.opencode/tools/prompt-skim.ts` | Phase 0: count, classify, estimate, verify paths |
| `prompt-analyze` | `.opencode/tools/prompt-analyze.ts` | Deep text quality analysis: contradictions, vagueness, absolute claims |
| `context-budget` | `.opencode/tools/context-budget.ts` | Calculate context budget % from session file metadata |
| `session-patch` | `.opencode/tools/session-patch.ts` | Patch specific sections in session file with backup |

### 3.2 Tool: prompt-skim

- Counts words, lines, estimates tokens
- Extracts URLs (count only, no fetch)
- Extracts file paths, verifies with `glob`/`existsSync`
- Counts absolute claims (MUST, NEVER, ALWAYS)
- Calculates complexity score (1-10)
- Determines flooding risk from context budget
- Returns: YAML skim_profile with recommended lanes

### 3.3 Tool: prompt-analyze

- Line-by-line analysis with severity scoring
- Detects: contradictions, vagueness, absolute claims, missing scope
- Returns: YAML analysis with findings, clarity score, suggested improvements

### 3.4 Tool: context-budget

- Reads session file frontmatter for `compaction_count` (maintained by plugin's `event` hook writing to disk)
- Calculates: `Math.max(0, 100 - (compaction_count * 15))` — floored at 0
- Returns: budget %, compaction count, status (ok/warning/critical)
- **Note:** No OpenCode platform API exposes compaction metadata to custom tools. The plugin hook writes `compaction_count` to the session file on each `session.compacted` event, and this tool reads it back.

### 3.5 Tool: session-patch

- Targets specific sections by heading
- Creates backup before modification
- Updates patch_count metadata
- Returns: status, old/new length

---

## 4. Plugin (`.opencode/plugins/prompt-enhance.ts`)

### 4.1 Hook: `event` (generic — catches `session.compacted`)

OpenCode does not expose `session.compacted` as a named hook key. It must be caught via the generic `event` hook:

```typescript
event: async ({ event }) => {
  if (event.type === "session.compacted") {
    // Increment compaction_count in session file
    // Recalculate context_budget_pct = Math.max(0, 100 - (count * 15))
  }
}
```

### 4.2 Hook: `experimental.session.compacting`

- Injects session file content into compaction prompt
- Ensures prompt enhancement state survives compaction

### 4.3 Session File Initialization

**NOT in a plugin hook.** The `command.executed` event fires AFTER command execution — too late for initialization. Instead, session file initialization happens in the **command body** as the first step:

```markdown
## Initialize Session File
If `.hivemind/state/session-context-prompt.md` does not exist:
  Create it with default structure (session_id from git branch, timestamps, empty sections)
```

This ensures the file exists before any `@file` references or tool calls attempt to read it.

---

## 5. Agent Definitions

### 5.1 New Agents

| Agent | File | Mode | Purpose |
|-------|------|------|---------|
| `prompt-skimmer` | `agents-lab/active/refactoring/prompt-skimmer.md` | subagent | Phase 0 SKIM — immune system |
| `prompt-analyzer` | `agents-lab/active/refactoring/prompt-analyzer.md` | subagent | Deep text quality analysis |
| `context-mapper` | `agents-lab/active/refactoring/context-mapper.md` | subagent | Ground references against codebase |
| `risk-assessor` | `agents-lab/active/refactoring/risk-assessor.md` | subagent | Identify risky instructions |
| `context-purifier` | `agents-lab/active/refactoring/context-purifier.md` | subagent | 3rd-level context distillation |
| `prompt-repackager` | `agents-lab/active/refactoring/prompt-repackager.md` | subagent | Final assembly + structured output |

### 5.2 Agent Permission Model

All agents use **only OpenCode native tools** — no skill dependencies, no MCP requirements:

| Tool | Permission | Used By |
|------|-----------|---------|
| `read` | allow | ALL |
| `list` | allow | skimmer, context-mapper |
| `grep` | allow | ALL |
| `glob` | allow | skimmer, context-mapper, purifier |
| `bash` | restricted (CI-safe only) | ALL |
| `edit` | allow | repackager (covers edit, write, patch, multiedit — these share the same permission domain) |
| `question` | allow | orchestrator (clarification gate) |
| `webfetch` | allow | context-mapper |
| `websearch` | ask | context-mapper (optional) |
| `lsp` | ask | context-mapper (optional) |
| `task` | ask | ALL subagents |
| `task` | allow | hivefiver-orchestrator (required for dispatching subagents) |
| `todowrite` | allow | orchestrator only |

**Note:** `patch` is NOT a separate permission key — it is controlled by `edit`. Granting `edit: allow` covers all file modifications including patch application.

### 5.3 Skills Status: ALL DEFERRED

| Skill Needed | Serves | Status |
|-------------|--------|--------|
| `prompt-investigation` | Deep codebase grounding | Deferred — no equivalent in lab |
| `context-integrity` | Poisoning detection | Deferred — not in lab |
| `harness-audit-generalized` | Generalized risk patterns | Deferred — current one is codebase-specific |
| `link-analyzer` | URL content classification | Deferred — not in lab |

**Native tool workarounds in place:** `grep`+`glob`+`webfetch` replace all deferred skills.

---

## 6. Command Definition

### 6.1 `/hf-prompt-enhance`

**File:** `.hivefiver-meta-builder/commands-lab/active/refactoring/prompt-enhance.md`

```markdown
---
description: "Enhance, audit, or repack prompts through dynamic multi-agent delegation. Triggers: 'enhance this prompt', 'repack context', 'audit my prompt', 'improve prompt clarity', 'repack cognitive context', 'scan my prompt'."
agent: hivefiver-orchestrator
subtask: false
---

## Initialize Session File
If `.hivemind/state/session-context-prompt.md` does not exist, create it with default structure.

## Execute
@.opencode/hivefiver/workflows/prompt-enhance.md

## Context
$ARGUMENTS
@if .hivemind/state/session-context-prompt.md
```

- `$ARGUMENTS` — captures user's prompt text, mode flag, or target reference
- `@` file reference to workflow — follows existing command pattern (see `hf-create.md`)
- `@` file reference to session file — included AFTER initialization ensures it exists
- Session file initialization in command body (not plugin hook) — avoids bootstrapping race
- `subtask: false` — entry point, runs in main session

### 6.2 Workflow File

**File:** `.hivefiver-meta-builder/workflows-lab/active/refactoring/prompt-enhance.md`

**Boundary clarification:** The workflow `.md` file contains **procedural orchestration logic** — which phases to run, in what order, with which agents. It does NOT contain data processing logic. Data processing (counting, classifying, calculating) lives in custom TypeScript tools (`.opencode/tools/`).

**Workflow file contains:**
- Phase sequencing (0 → 1 → 2 → 3 → 4)
- Dispatch envelopes for each subagent (full task text, scope, output format)
- Bridge decision matrix (IF/THEN logic for delegation graph construction)
- Clarification gate flow (question tool usage pattern)
- Finalization steps

**Custom tools contain:**
- Text analysis algorithms (contradiction detection, vagueness scoring)
- File path verification (glob/existsSync checks)
- Budget calculation (compaction_count → percentage)
- Session file patching (section targeting, backup, atomic write)

All bash commands in the workflow are CI-safe (`--no-pager`, no editors, no interactive modes).

---

## 7. Session Context File

### 7.1 Path

`.hivemind/state/session-context-prompt.md`

**Why not `.opencode/`:** The `.opencode/` directory is OpenCode's internal configuration directory. Placing mutable session state there creates:
1. File watcher interference — `file.watcher.updated` events trigger on every edit
2. Git noise — frequent changes to a tracked config directory cause merge conflicts across worktrees
3. Permission confusion — `.opencode/` is for static definitions, not runtime state

### 7.2 Structure

```markdown
---
session_id: <git-branch-name>
worktree: <relative-path>
created: <ISO-8601>
last_patched: <ISO-8601>
patch_count: 0
context_budget_pct: <calculated>
compaction_count: <number>
status: initializing
---

## What Happened So Far
## Identified Risks
## Task List
## Deferred Items
## Context Map
## Clarification Log
## Final Output
```

### 7.3 Patch Protocol

- Subagents write findings to temp files: `.hivemind/state/.patches/<agent>-<timestamp>.md`
- Orchestrator reads temp files and applies patches to session file using `edit` tool
- **No concurrent writes** — orchestrator is the sole writer, serializing all patch applications
- Temp files are cleaned up after successful application
- File is worktree-exclusive (branch-scoped)

---

## 8. Output Contract

### 8.1 Structured Format

```yaml
---
enhanced_prompt_version: 1.0
source_mode: auto|enhance|repack|audit
lanes_executed: [list]
clarifications_resolved: <count>
confidence_score: 0.0-1.0
context_budget_at_start: <pct>
context_budget_at_end: <pct>
---

<enhanced_prompt>
[Final enhanced prompt text]
</enhanced_prompt>

<what_happened_so_far>
[Summary]
</what_happened_so_far>

<identified_risks>
[Risk findings]
</identified_risks>

<task_list>
[Active tasks]
</task_list>

<deferred_items>
[Future attention items]
</deferred_items>
```

---

## 9. File Map

### 9.1 New Files to Create

| File | Type | Purpose |
|------|------|---------|
| `.hivefiver-meta-builder/commands-lab/active/refactoring/prompt-enhance.md` | Command | Entry point |
| `.hivefiver-meta-builder/workflows-lab/active/refactoring/prompt-enhance.md` | Workflow | Procedural orchestration logic |
| `.hivefiver-meta-builder/agents-lab/active/refactoring/prompt-skimmer.md` | Agent | Phase 0 SKIM |
| `.hivefiver-meta-builder/agents-lab/active/refactoring/prompt-analyzer.md` | Agent | Text analysis |
| `.hivefiver-meta-builder/agents-lab/active/refactoring/context-mapper.md` | Agent | Codebase grounding |
| `.hivefiver-meta-builder/agents-lab/active/refactoring/risk-assessor.md` | Agent | Risk assessment |
| `.hivefiver-meta-builder/agents-lab/active/refactoring/context-purifier.md` | Agent | Context distillation |
| `.hivefiver-meta-builder/agents-lab/active/refactoring/prompt-repackager.md` | Agent | Final assembly |
| `.opencode/tools/prompt-skim.ts` | Custom Tool | Programmatic skim |
| `.opencode/tools/prompt-analyze.ts` | Custom Tool | Programmatic analysis |
| `.opencode/tools/context-budget.ts` | Custom Tool | Budget calculation |
| `.opencode/tools/session-patch.ts` | Custom Tool | Session file patching |
| `.opencode/plugins/prompt-enhance.ts` | Plugin | Session lifecycle hooks (event, experimental.session.compacting) |
| `.hivemind/state/session-context-prompt.md` | Session File | Shared state bus (created on first run by command body) |

### 9.2 Modified Files

| File | Change |
|------|--------|
| `.hivefiver-meta-builder/AGENTS.md` | Add new agents to team table, add `/hf-prompt-enhance` to command set |
| `.hivefiver-meta-builder/agents-lab/active/refactoring/hivefiver-orchestrator.md` | Add prompt-enhancement routing lane |

---

## 10. Non-Interactive Shell Safety

All bash commands MUST:
- Use `--no-pager` for git commands
- Use `-f` for file operations
- Never use editors, pagers, or interactive modes
- Assume `CI=true` environment
- Use non-interactive flags (`-y`, `--yes`, `--non-interactive`)

**Banned:** `vim`, `nano`, `less`, `more`, `man`, `git add -p`, `git rebase -i`, `git commit` (without `-m`)

---

## 11. Deferred Items

| Item | Reason | Priority |
|------|--------|----------|
| Skill: `prompt-investigation` | No equivalent in lab | High |
| Skill: `context-integrity` | Not in lab | High |
| Skill: `harness-audit-generalized` | Current one is codebase-specific | Medium |
| Skill: `link-analyzer` | Not in lab | Medium |
| LSP integration | Experimental, requires env var | Low |
| websearch integration | Requires OPENCODE_ENABLE_EXA | Low |

---

## 12. Validation Checklist

- [x] All tools use only OpenCode native APIs (no MCP, no third-party)
- [x] All commands survive `CI=true` (non-interactive shell safety) — Phase 3 clarification gate skipped in CI mode
- [x] All agents have explicit permissions (no wildcards without reason)
- [x] Session file is worktree-exclusive (branch-scoped) — located at `.hivemind/state/`
- [x] Patch protocol prevents race conditions — orchestrator is sole writer, subagents use temp files
- [x] Clarification gate presents assumptions one-at-a-time
- [x] Output is structured YAML frontmatter + XML-tagged body
- [x] Phase 0 runs as subtask with clean context (immune system) — unconditional, bypasses decision engine
- [x] Bridge decision layer is programmatic (not agent judgment)
- [x] Skills are documented as deferred debt, not runtime dependencies

---

## 13. Review Findings (Resolved)

Two parallel subagents validated this spec against the true OpenCode architecture. 12 issues found, all fixed:

### Critical (would cause runtime failure)

| # | Issue | Fix Applied |
|---|-------|-------------|
| 1 | `mode: subtask` is not a valid OpenCode mode | Changed all 6 agents to `mode: subagent` |
| 2 | `session.compacted` named hook doesn't exist | Changed to generic `event` hook with type check |
| 3 | Bootstrapping race: session file doesn't exist at command start | Moved initialization to command body (not plugin hook) |
| 4 | `patch` permission is not independent | Removed from permission table — covered by `edit` |
| 5 | No compaction metadata API for tools | Plugin writes `compaction_count` to session file; tool reads it back |
| 6 | `.opencode/` as mutable state directory | Moved to `.hivemind/state/session-context-prompt.md` |

### Structural (would cause planning gaps)

| # | Issue | Fix Applied |
|---|-------|-------------|
| 7 | Phase 0 bypasses decision engine it supposedly feeds | Clarified: Phase 0 is unconditional, decision engine applies to Phase 2 only |
| 8 | Logic location ambiguous (TS tools vs workflow .md) | Added boundary clarification: workflow = orchestration, tools = data processing |
| 9 | Missing orchestrator `task` permission | Added `task: allow` for hivefiver-orchestrator |
| 10 | `question` tool interactive — CI safety gap | Added CI fallback: skip clarification gate, mark assumptions unverified |
| 11 | Command missing `@` reference to workflow file | Added `@.opencode/hivefiver/workflows/prompt-enhance.md` to command body |
| 12 | Cognitive Repacking undefined operationally | Added operational definition in Core Capabilities table |
