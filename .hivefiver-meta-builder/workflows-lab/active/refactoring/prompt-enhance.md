# Prompt-Enhance Workflow

## Objective
Enhance a prompt through a layered pipeline while keeping all computation in tools and all session-state writes in the orchestrator.

## Session State Contract
- Session file (absolute): `join(process.cwd(), '.hivemind/state/session-context-prompt.md')` — always resolved as an absolute path; never relative.
- Patch directory (absolute): `join(process.cwd(), '.hivemind/state/.patches/')` — always resolved as an absolute path.
- Sole writer: orchestrator via `session-patch` with explicit `sessionFilePath: join(process.cwd(), '.hivemind/state/session-context-prompt.md')` on every call.
- Lane agents return structured markdown or YAML only

## Phase 0: Skim
1. Call `prompt-skim` with the raw user prompt and workspace root.
2. Call `context-budget` with `sessionFilePath: join(process.cwd(), '.hivemind/state/session-context-prompt.md')` (absolute path).
3. Dispatch `prompt-skimmer` with the raw prompt plus the `prompt-skim` and `context-budget` outputs; it returns the Phase 0 summary only.
4. Patch `## What Happened So Far` with that delegated skim summary.

## Bridge
Use the skim result and budget result to choose lanes:

| Condition | Lanes |
|---|---|
| `complexity_score <= 3` | `prompt-analyzer`, `prompt-repackager` |
| `complexity_score >= 4 && complexity_score <= 6` | `prompt-analyzer`, `context-mapper`, `prompt-repackager` |
| `complexity_score >= 7` | `prompt-analyzer`, `context-mapper`, `risk-assessor`, `context-purifier`, `prompt-repackager` |

If `budget_pct < 50`, force all investigative work into subagents and skip optional deepening.

## Investigation Lanes

### prompt-analyzer
Dispatch the `prompt-analyzer` agent with:
- original prompt text
- skim summary
- instruction to return findings only

In parallel with any other bridge-selected lanes, also call `prompt-analyze` directly so the workflow gets deterministic scoring for the clarification gate.

### context-mapper
Dispatch the `context-mapper` agent with the original prompt text, skim output, and instructions to verify only cited files or symbols.

### risk-assessor
Dispatch the `risk-assessor` agent with the original prompt text and instruction to return only structured risks and mitigations.

### context-purifier
Dispatch the `context-purifier` agent only for high-complexity or high-flooding prompts.

## Clarification Gate
Build the clarification list from:
- `prompt-analyze` findings
- lane agent findings

Interactive mode:
- ask only the unresolved, execution-blocking questions
- patch `## Clarification Log` after each answer

CI-safe fallback:
- if `CI=true`, or no interactive question flow is available, skip questions
- append unresolved assumptions to `## Deferred Items` as `unverified — review recommended`

## Final Assembly
Dispatch `prompt-repackager` with:
- original prompt
- skim output
- `prompt-analyze` output
- lane results
- clarification decisions or CI fallback assumptions

The repackager returns a single payload with YAML frontmatter and these XML sections:
- `<enhanced_prompt>`
- `<what_happened_so_far>`
- `<identified_risks>`
- `<task_list>`
- `<deferred_items>`

Patch `## Final Output` with that payload using `session-patch` with explicit `sessionFilePath: join(process.cwd(), '.hivemind/state/session-context-prompt.md')`.
Patch `## Identified Risks`, `## Task List`, and `## Deferred Items` with the synthesized final sections, each via `session-patch` with the same absolute `sessionFilePath` argument.
