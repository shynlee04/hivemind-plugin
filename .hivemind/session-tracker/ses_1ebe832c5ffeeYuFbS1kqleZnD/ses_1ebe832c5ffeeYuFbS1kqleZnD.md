### Tool: task

**Input:**
```json
{
  "description": "Debug CP-ST-01 session tracker failure",
  "subagent_type": "gsd-debug-session-manager",
  "task_id": "ses_1ebe39941ffecHehSRcc13IqeD"
}
```

**Output:** (pruned)
```
task_id: ses_1ebe39941ffecHehSRcc13IqeD
```


## USER (turn 4)

<objective>
Create executable phase prompts (PLAN.md files) for a roadmap phase with integrated research and verification.

**Default flow:** Research (if needed) → Plan → Verify → Done

**Research-only mode (`--research-phase <N>`):** Spawn `gsd-phase-researcher` for phase `N`, write `RESEARCH.md`, then exit before the planner runs. Useful for cross-phase research, doc review before committing to a planning approach, and correction-without-replanning loops where iterating on research alone is dramatically cheaper than re-spawning the planner. Replaces the deleted `/gsd-research-phase` command (#3042).

**Research-only modifiers:**
- **No flag** — when `RESEARCH.md` already exists, prompt the user to choose `update / view / skip`.
- **`--research`** — force-refresh: re-spawn the researcher unconditionally, no prompt. Skips the existing-RESEARCH.md menu.
- **`--view`** — view-only: print existing `RESEARCH.md` to stdout. Does not spawn the researcher. Cheapest mode for the correction-without-replanning loop. If no `RESEARCH.md` exists yet, errors with a hint to drop `--view`.

**Orchestrator role:** Parse arguments, validate phase, research domain (unless skipped), spawn gsd-planner, verify with gsd-plan-checker, iterate until pass or max iterations, present results.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/plan-phase.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/ui-brand.md
</execution_context>

<runtime_note>
**Copilot (VS Code):** Use `vscode_askquestions` wherever this workflow calls `question`. They are equivalent — `vscode_askquestions` is the VS Code Copilot implementation of the same interactive question API. Do not skip questioning steps because `question` appears unavailable; use `vscode_askquestions` instead.
</runtime_note>

<context>
Phase number: < just distill and decomplex these ```/Users/apple/hivemind-plugin-private/.planning/phases/CP-ST-01-session-tracker-revamp
/Users/apple/hivemind-plugin-private/.planning/phases/CP-ST-01-session-tracker-revamp/.gitkeep
/Users/apple/hivemind-plugin-private/.planning/phases/CP-ST-01-session-tracker-revamp/01-CONTEXT.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-ST-01-session-tracker-revamp/01-DISCUSSION-LOG.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-ST-01-session-tracker-revamp/01-RESEARCH.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-ST-01-session-tracker-revamp/01-SPEC.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-ST-01-session-tracker-revamp/CP-ST-01-01-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-ST-01-session-tracker-revamp/CP-ST-01-01-SUMMARY.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-ST-01-session-tracker-revamp/CP-ST-01-02-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-ST-01-session-tracker-revamp/CP-ST-01-02-SUMMARY.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-ST-01-session-tracker-revamp/CP-ST-01-03-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-ST-01-session-tracker-revamp/CP-ST-01-03-SUMMARY.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-ST-01-session-tracker-revamp/CP-ST-01-04-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-ST-01-session-tracker-revamp/CP-ST-01-REVIEW.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-ST-01-session-tracker-revamp/CP-ST-01-UAT.md ``` dettach the advanced - research and get what fundamental @.hivemind/planning/debug/sessions/session-continuity-event-tracker-journal-2026-05-10.md  -  now that the TUI is broken with js dist build that is broken do not regress further> (optional — auto-detects next unplanned phase if omitted)

**Flags:**
- `--research` — Force re-research even if RESEARCH.md exists
- `--skip-research` — Skip research, go straight to planning
- `--gaps` — Gap closure mode (reads VERIFICATION.md, skips research)
- `--skip-verify` — Skip verification loop
- `--prd <file>` — Use a PRD/acceptance criteria file instead of discuss-phase. Parses requirements into CONTEXT.md automatically. Skips discuss-phase entirely.
- `--reviews` — Replan incorporating cross-AI review feedback from REVIEWS.md (produced by `/gsd-review`)
- `--text` — Use plain-text numbered lists instead of TUI menus (required for `/rc` remote sessions)
- `--mvp` — Vertical MVP mode. Planner organizes tasks as feature slices (UI→API→DB) instead of horizontal layers. On Phase 1 of a new project, also emits `SKELETON.md` (Walking Skeleton). Can be persisted on a phase via `**Mode:** mvp` in ROADMAP.md.

Normalize phase input in step 2 before any directory lookups.
</context>

<process>
Execute end-to-end.
Preserve all workflow gates (validation, research, planning, verification loop, routing).
</process> get the folder subdir created and  being able to create dot md with appended context as said in @.hivemind/planning/debug/sessions/session-continuity-event-tracker-journal-2026-05-10.md first detach everything else minimal mvp 

### Tool: task

**Input:**
```json
{
  "description": "Audit CP-ST-01 source modules",
  "subagent_type": "hm-l2-scout",
  "task_id": "ses_1ebd373b1ffeDa7AJ7KJIPShVE"
}
```

**Output:** (pruned)
```
task_id: ses_1ebd373b1ffeDa7AJ7KJIPShVE
```

