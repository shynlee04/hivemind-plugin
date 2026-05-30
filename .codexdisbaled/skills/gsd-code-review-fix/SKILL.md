---
name: "gsd-code-review-fix"
description: "Auto-fix issues found by code review in REVIEW.md. Spawns fixer agent, commits each fix atomically, produces REVIEW-FIX.md summary."
metadata:
  short-description: "Auto-fix issues found by code review in REVIEW.md. Spawns fixer agent, commits each fix atomically, produces REVIEW-FIX.md summary."
---

<codex_skill_adapter>
## A. Skill Invocation
- This skill is invoked by mentioning `$gsd-code-review-fix`.
- Treat all user text after `$gsd-code-review-fix` as `{{GSD_ARGS}}`.
- If no arguments are present, treat `{{GSD_ARGS}}` as empty.

## B. AskUserQuestion → request_user_input Mapping
GSD workflows use `AskUserQuestion` (Claude Code syntax). Translate to Codex `request_user_input`:

Parameter mapping:
- `header` → `header`
- `question` → `question`
- Options formatted as `"Label" — description` → `{label: "Label", description: "description"}`
- Generate `id` from header: lowercase, replace spaces with underscores

Batched calls:
- `AskUserQuestion([q1, q2])` → single `request_user_input` with multiple entries in `questions[]`

Multi-select workaround:
- Codex has no `multiSelect`. Use sequential single-selects, or present a numbered freeform list asking the user to enter comma-separated numbers.

Execute mode fallback:
- When `request_user_input` is rejected (Execute mode), present a plain-text numbered list and pick a reasonable default.

## C. Task() → spawn_agent Mapping
GSD workflows use `Task(...)` (Claude Code syntax). Translate to Codex collaboration tools:

Direct mapping:
- `Task(subagent_type="X", prompt="Y")` → `spawn_agent(agent_type="X", message="Y")`
- `Task(model="...")` → omit (Codex uses per-role config, not inline model selection)
- `fork_context: false` by default — GSD agents load their own context via `<files_to_read>` blocks

Parallel fan-out:
- Spawn multiple agents → collect agent IDs → `wait(ids)` for all to complete

Result parsing:
- Look for structured markers in agent output: `CHECKPOINT`, `PLAN COMPLETE`, `SUMMARY`, etc.
- `close_agent(id)` after collecting results from each agent
</codex_skill_adapter>

<objective>
Auto-fix issues found by code review. Reads REVIEW.md from the specified phase, spawns gsd-code-fixer agent to apply fixes, and produces REVIEW-FIX.md summary.

Arguments:
- Phase number (required) — which phase's REVIEW.md to fix (e.g., "2" or "02")
- `--all` (optional) — include Info findings in fix scope (default: Critical + Warning only)
- `--auto` (optional) — enable fix + re-review iteration loop, capped at 3 iterations

Output: {padded_phase}-REVIEW-FIX.md in phase directory + inline summary of fixes applied
</objective>

<execution_context>
@/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.codex/get-shit-done/workflows/code-review-fix.md
</execution_context>

<context>
Phase: {{GSD_ARGS}} (first positional argument is phase number)

Optional flags parsed from {{GSD_ARGS}}:
- `--all` — Include Info findings in fix scope. Default behavior fixes Critical + Warning only.
- `--auto` — Enable fix + re-review iteration loop. After applying fixes, re-run code-review at same depth. If new issues found, iterate. Cap at 3 iterations total. Without this flag, single fix pass only.

Context files (AGENTS.md, REVIEW.md, phase state) are resolved inside the workflow via `gsd-tools init phase-op` and delegated to agent via config blocks.
</context>

<process>
This command is a thin dispatch layer. It parses arguments and delegates to the workflow.

Execute the code-review-fix workflow from @/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.codex/get-shit-done/workflows/code-review-fix.md end-to-end.

The workflow (not this command) enforces these gates:
- Phase validation (before config gate)
- Config gate check (workflow.code_review)
- REVIEW.md existence check (error if missing)
- REVIEW.md status check (skip if clean/skipped)
- Agent spawning (gsd-code-fixer)
- Iteration loop (if --auto, capped at 3 iterations)
- Result presentation (inline summary + next steps)
</process>
