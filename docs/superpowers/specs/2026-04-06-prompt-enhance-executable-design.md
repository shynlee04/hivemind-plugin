# Design Spec: Prompt-Enhance Command — Executable via Task Tool

**Date:** 2026-04-06
**Status:** Draft — awaiting user review
**Author:** Brainstorming session
**Branch:** harness-experiment

---

## 1. Problem Statement

The `/hf-prompt-enhance` command exists as a command file (`hf-prompt-enhance.md`) that routes to `hivefiver-orchestrator`. The orchestrator reads a workflow `.md` file as reference text. Instead of executing phases via the Task tool, the orchestrator SIMULATES execution by writing fake `**Tool: X**` markdown blocks. No subagents spawn. No state persists. The pipeline never advances past Phase 0.

**Root cause:** Markdown workflow files are documentation, not executable logic. The orchestrator has `task: allow` permission but doesn't know to USE the Task tool — it reads the workflow as prose and simulates.

---

## 2. Architecture

### 2.1 Execution Model

```
User → /hf-prompt-enhance "prompt text"
    ↓
hivefiver-orchestrator (primary agent, task: allow)
    ↓
PHASE 0: Orchestrator reads session file + user prompt
    → Asks user: "Here's what I understand. Proceed?"
    → User: yes
    ↓
PHASE 0b: Task tool → prompt-skimmer subagent (fresh session)
    → Returns: complexity_score, key_entities, ambiguity_flags
    ↓
PHASE 1: Bridge (orchestrator if/else on complexity_score)
    ≤3: analyzer → repackager
    4-6: analyzer + context-mapper → repackager
    ≥7: analyzer + context-mapper + risk-assessor + context-purifier → repackager
    ↓
PHASE 2: Task tool → lanes (PARALLEL — single message, multiple tool calls)
    Each lane is a subagent with its own fresh session
    ↓
PHASE 3: Orchestrator synthesizes lane results
    If high complexity → Task tool → context-purifier (3rd-level subagent)
    ↓
PHASE 4: Clarification gate (orchestrator asks user questions)
    ↓
PHASE 5: Task tool → repackager subagent (fresh session)
    → Returns YAML frontmatter + XML-tagged body
    ↓
Orchestrator returns result to user
```

### 2.2 Key OpenCode Constraints

| Constraint | Impact on Design |
|---|---|
| Subagents do NOT inherit parent message history | Every Task tool call must serialize ALL context into the prompt string |
| `parentID` links exist but no message inheritance | Parent orchestrator must include user prompt + session file content + lane results in every subagent prompt |
| Multiple Task tool calls in ONE message = parallel subagents | Lanes spawn in parallel by calling Task tool multiple times in one response |
| `task_id` allows resuming a prior subagent session | For multi-turn lanes, orchestrator passes prior `task_id` |
| Session state is on-disk | Subagents read `.hivemind/state/session-context-prompt.md` via `read` tool |
| Subagent response returns `<task_result>` text to parent | Orchestrator collects results and decides next phase |

### 2.3 Session Context File

Location: `.hivemind/state/session-context-prompt.md`

Read by orchestrator at startup. Passed to each subagent as `## Session Context` section in the prompt. Updated by orchestrator after each phase via `edit` tool (not via session-patch tool — orchestrator has `edit: allow`).

---

## 3. What Changes

### 3.1 Modified: `hivefiver-orchestrator.md`

**Current:** Has anti-pattern section about "The Simulator" but the orchestrator still reads `prompt-enhance.md` workflow and simulates execution.

**Change:** Add explicit execution loop instructions:

```markdown
## Executing the Prompt-Enhance Pipeline

When the user invokes `/hf-prompt-enhance`, follow this exact sequence:

1. Read `.hivemind/state/session-context-prompt.md` (or create with defaults)
2. Present your understanding to the user, ask for confirmation
3. After confirmation, call the Task tool to spawn `prompt-skimmer` subagent
4. Read the skimmer result, apply bridge logic to choose lanes
5. Call the Task tool for each lane IN PARALLEL (multiple tool calls in one message)
6. Synthesize lane results
7. If complexity >= 7, call Task tool for `context-purifier` (3rd-level)
8. Present clarification questions to the user (one at a time)
9. After clarifications, call Task tool for `prompt-repackager`
10. Return the repackager's output to the user

CRITICAL: Use the ACTUAL Task tool. Do not write `**Tool: X**` or `**Input:**` blocks as text.
```

### 3.2 Deleted: None

No files are deleted. The workflow `.md` files remain as reference documentation. The fix is purely in the orchestrator's instruction set.

### 3.3 No new TypeScript code

The pipeline executes through the orchestrator's Task tool calls to subagents. No new `.ts` files needed. The existing tools (`prompt-skim.ts`, `prompt-analyze.ts`, `context-budget.ts`, `session-patch.ts`) remain for any programmatic analysis — but the primary execution path is Task tool → subagent.

---

## 4. What Stays

| Artifact | Role |
|----------|------|
| `hf-prompt-enhance.md` command | Entry point |
| `prompt-enhance.md` workflow | Reference documentation (orchestrator reads it, but MUST use Task tool, not simulate) |
| 6 lane agent `.md` files | Subagent definitions with permissions |
| 4 custom tools | Programmatic analysis (optional, subagents can use them) |
| `prompt-enhance.ts` plugin | Session lifecycle hooks |
| `.hivemind/state/session-context-prompt.md` | Session state file |

---

## 5. Validation Criteria

The command works end-to-end when:

1. User types `/hf-prompt-enhance "some prompt"`
2. Orchestrator presents understanding, asks for confirmation
3. At least ONE subagent spawns (visible in TUI as child session)
4. At least TWO phases execute (Phase 0 skim + Phase 2 lanes)
5. Session file is updated after each phase
6. Final output contains YAML frontmatter + XML-tagged sections
7. No `**Tool: X**` simulated blocks appear in the response

---

## 6. Deferred Items

| Item | Reason |
|------|--------|
| TypeScript state machine | Not needed yet — fix orchestrator instructions first |
| Auto-export session to disk | Manual `opencode export` works, no hook needed |
| LSP integration | Experimental, not required for core flow |
