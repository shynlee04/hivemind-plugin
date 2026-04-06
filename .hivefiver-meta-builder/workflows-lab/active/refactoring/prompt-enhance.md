# Prompt-Enhance Workflow

## Objective
Enhance a prompt through a layered pipeline while keeping all computation in tools and all session-state writes in the orchestrator.

## Session State Contract

- Session file: `.hivemind/state/session-content-prompt.md` (resolve as absolute path from workspace root)
- Patch directory: `.hivemind/state/.patches/`
- Sole writer: orchestrator via `session-patch` tool with explicit `sessionFilePath` argument on every call
- Lane agents return structured markdown or YAML only — they never write session state

## Phase 0: Skim

### Step 1: Initialize Session State
Ensure `.hivemind/state/session-context-prompt.md` exists (the prompt-enhance plugin creates this on event hook). If missing, run the event hook or create it with the standard frontmatter and section headings:
- `## What Happened So Far`
- `## Identified Risks`
- `## Task List`
- `## Deferred Items`
- `## Clarification Log`
- `## Final Output`

### Step 2: Run Skim Tools
Call `prompt-skim` with the raw user prompt text. Call `context-budget` with the session file path resolved as an absolute path from the workspace root.

### Step 3: Dispatch Prompt-Skimmer Agent
Give the skimmer agent:
- Raw prompt text
- `prompt-skim` output
- `context-budget` output
- Instruction: return Phase 0 summary only, do not write files

### Step 4: Patch Skim Summary
Call `session-patch` to write the skim summary to `## What Happened So Far` in the session file. Use the absolute path for `sessionFilePath`.

## Bridge

Use the skim result's `complexity_score` to choose lanes:

| Condition | Lanes |
|---|---|
| `complexity_score <= 3` | `prompt-analyzer`, `prompt-repackager` |
| `complexity_score >= 4 && complexity_score <= 6` | `prompt-analyzer`, `context-mapper`, `prompt-repackager` |
| `complexity_score >= 7` | `prompt-analyzer`, `context-mapper`, `risk-assessor`, `context-purifier`, `prompt-repackager` |

If `budget_pct < 50`, force all investigative work into subagents and skip optional deepening.

## Investigation Lanes

### prompt-analyzer Lane
Dispatch the `prompt-analyzer` agent with the original prompt text, skim summary, and instruction to return findings only.

In parallel, call `prompt-analyze` tool directly for deterministic scoring to use in the clarification gate.

### context-mapper Lane
Dispatch the `context-mapper` agent with the original prompt text, skim output, and instructions to verify only cited files or symbols in the repository.

### risk-assessor Lane
Dispatch the `risk-assessor` agent with the original prompt text and instruction to return only structured risks and mitigations.

### context-purifier Lane
Dispatch the `context-purifier` agent only for high-complexity (`complexity_score >= 7`) or high-flooding prompts.

## Clarification Gate

Build the clarification list from:
- `prompt-analyze` tool findings
- Lane agent findings

**Interactive mode:**
- Ask only unresolved, execution-blocking questions
- Patch `## Clarification Log` after each answer via `session-patch`

**CI-safe fallback:**
- If `CI=true` or no interactive question flow is available, skip questions
- Append unresolved assumptions to `## Deferred Items` as `unverified — review recommended` via `session-patch`

## Final Assembly

### Step 1: Dispatch Prompt-Repackager
Give the repackager agent:
- Original prompt
- Skim output
- `prompt-analyze` tool output
- All lane results
- Clarification decisions or CI fallback assumptions

The repackager returns a single payload with YAML frontmatter and XML sections:
- `<enhanced_prompt>`
- `<what_happened_so_far>`
- `<identified_risks>`
- `<task_list>`
- `<deferred_items>`

### Step 2: Patch Final Sections
Call `session-patch` for each section with the absolute `sessionFilePath`:
- Patch `## Final Output` with the repackager payload
- Patch `## Identified Risks` with the synthesized risk section
- Patch `## Task List` with the active task list
- Patch `## Deferred Items` with CI fallback assumptions or unresolved clarifications
