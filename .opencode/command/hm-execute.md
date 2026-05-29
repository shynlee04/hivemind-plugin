---
namespace: hm
agent: hm-executor
subtask: false
description: "Execute a created phase plan using TDD, atomic commits, and regression checks."
argument-hint: "<phase-number> [--only-wave <wave>] [--dry-run]"
requires: ["hm-plan"]
validation-gates: ["lifecycle-gate", "evidence-truth-gate"]
output-templates: ["hm-verification.md"]
coordination-model: "waiter-model"
completion-signals: ["execution-completed"]
tools:
  read: true
  write: true
  bash: true
  glob: true
  grep: true
  agent: true
---

<objective>
Execute implementation waves defined in PLAN.md sequentially, applying TDD (Red/Green/Refactor), atomic commits per task, and full-suite regression verification after every wave.

**How it works:**
1. Load PLAN.md and verify wave status — confirm no partially completed waves exist
2. Read $ARGUMENTS and hm-sdk config to determine execution mode (wave, dry-run, or gaps-only)
3. Execute each task in the current wave through the TDD cycle — write failing test, implement minimal code, refactor while keeping green
4. Validate task completion against its defined acceptance criteria and run targeted tests
5. Commit the task atomically — stage only task files, commit with traceable message
6. Run full test suite for regression detection at end of each wave
7. Advance to the next wave until all PLAN.md waves are complete
8. Write SUMMARY.md capturing commit hashes, test results, and deviation log

**Output:** `{phase_dir}/SUMMARY.md` — task statuses, commit hashes, test pass/fail per wave, deferred issues
</objective>

<execution_context>
Workflow files are loaded on-demand in the <process> section below — not upfront.
Do not pre-load any workflow files before reading the mode routing instructions.
</execution_context>

<context>
Phase ID: $ARGUMENTS (required — first positional argument)
Optional flags:
  --only-wave <wave>    Execute only the specified wave, skip others
  --dry-run             Simulate execution — report what would happen, write nothing
  --gaps-only           Skip completed tasks, execute only unresolved gap tasks

Routed agent: hm-executor. Plan is resolved in-workflow using `hm-sdk query phase-op` and roadmap/state tool calls.
</context>

<process>
**Mode routing:**
```bash
EXEC_MODE=$(hm-sdk query config-get workflow.exec_mode 2>/dev/null || echo "wave")
```

If `--dry-run` is in $ARGUMENTS:
  Read and execute `.opencode/workflows/hm-execute-dry-run.md` if available, or simulate wave execution without file mutations.
  Report what each task would do, which files it would touch, and expected test impact. Write NO files.

Otherwise, if `--gaps-only` is in $ARGUMENTS:
  Read and execute `.opencode/workflows/hm-execute-gaps.md` if available, or resolve only tasks whose completion status is unresolved.
  Skip completed tasks. Execute only gap tasks.

Otherwise (`"wave"` / unset / any other value):
  Read and execute `.opencode/workflows/hm-execute.md` end-to-end.

  The workflow processes tasks wave by wave:
  1. **Initialize** — load PLAN.md, verify no stale wave state, check that hm-plan prereq is met
  2. **Execute wave** — for each task: TDD Red (failing test) → Green (minimal passing code) → Refactor (clean while green)
  3. **Task validation** — verify task-specific acceptance criteria, run targeted tests
  4. **Atomic commit** — stage only files touched by the task, commit with `feat(phase-{N}): {task} — {summary}`
  5. **Regression check** — run `npm run test` (or equivalent) after each wave; if regressions found, roll back or invoke hm-debug
  6. **Advance wave** — mark wave complete, load next PLAN.md wave; repeat until all done
  7. **Write SUMMARY.md** — document shipped work, file changes, test pass/fail, deviation log
  8. **Complete execution** — commit SUMMARY.md, update session state, notify completion

**MANDATORY:** Read the appropriate workflow file BEFORE taking any action. The objective and success_criteria sections in this command file are summaries — the workflow file contains the complete step-by-step process with all required TDD behaviors, validation checks, and commit patterns. Do not improvise from the summary.

**Lazy loading:** Sub-workflow templates (verification templates, commit templates) are loaded inside the appropriate steps of the active workflow. Do not load them here.

**Dual-signal handoff:** After execution completes, `hm-verify` checks dual-signal completion. The executor must leave evidence artifacts (commit hashes, test logs, run outputs) for the verifier to inspect. See `.opencode/references/hm-dual-signal-completion.md`.
</process>

<success_criteria>
- All PLAN.md waves executed in correct dependency order
- TDD cycle (Red → Green → Refactor) followed for every implementation task
- Each task committed atomically — never multiple tasks in one commit
- No file mutations outside the active task's declared scope
- Full test suite passes at end of every wave — zero regressions introduced
- SUMMARY.md created with completion statuses, commit hashes, and test results
- Execution artifacts committed to git alongside the command output
- Downstream verifier evidence ready (commit hashes, test run logs, deviation notes)
- Out-of-scope discoveries logged to deferred-items.md, NOT fixed inline
</success_criteria>

<critical_rules>
- **Anti-pattern — batch commits:** Never bundle multiple tasks into one commit. If tests fail for task N, fix task N in isolation. Do not combine N and N+1.
- **Anti-pattern — scope creep:** Do not modify files outside the active task's scope even if they appear broken. Log untargeted issues to deferred-items.md.
- **Anti-pattern — skipped regression:** The full test suite must run at end of each wave. Skipping invalidates the wave's quality guarantee.
- **Anti-pattern — silent failure:** If a task's tests fail after 3 fix attempts, STOP. Document the failure in task status. Do not advance to the next task.
- **Guardrail — dry-run immutability:** In --dry-run mode, the agent must not write, modify, or delete any files. Report-only.
- **Guardrail — evidence trail:** Every commit must be traceable to a specific task. Use `feat(phase-{N}): implement {task} — {summary}` format.
- **Guardrail — deviation logging:** Use Rule 1/2/3 (auto-fix bugs, add missing critical functionality, fix blocking issues) autonomously. Use Rule 4 (architectural changes) — STOP and escalate.
</critical_rules>
