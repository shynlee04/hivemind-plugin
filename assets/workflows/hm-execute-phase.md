---
description: "Phase execution workflow: wave detection → parallel execution → verification → summary. Routes through hm-executor (primary) and hm-verifier (secondary)."
---

# hm-execute-phase

## Goal

Execute all plans in a phase using wave-based parallel execution with atomic commits, deviation handling, and goal-backward verification.

## Agent Routing Table

| Role | Agent | Responsibility |
|------|-------|---------------|
| Execution | hm-executor | Atomic plan execution, code commits, deviation handling |
| Verification | hm-verifier | Goal-backward verification against plan must_haves |

## Execution Phases

1. **Wave detection**: Read PLAN.md frontmatter, extract wave assignments, group plans by wave. Plans within the same wave with no file conflicts run in parallel.

2. **Parallel execution**: For each wave, spawn hm-executor instances for each plan. Verify no file_modified overlap between plans before parallel dispatch.

3. **Checkpoint handling**: If plan has checkpoints, halt after each checkpoint and wait for resolution before continuing.

4. **Verification**: After all plans in phase execute, spawn hm-verifier to run goal-backward validation against plan must_haves.

5. **Summary**: Compile execution results, deviation log, and verification verdict into SUMMARY.md.

## Deviation Handling Protocol

| Severity | Action |
|----------|--------|
| Bug fix (Rule 1) | Fix inline, add tests, document in SUMMARY.md |
| Missing critical functionality (Rule 2) | Add inline, document in SUMMARY.md |
| Blocking issue (Rule 3) | Fix inline or route to checkpoint if unresolved |
| Architectural change (Rule 4) | STOP, return checkpoint for user decision |

## Wave Conflict Detection

Before parallel dispatch within a wave, check for file_modified overlap between plans:

```bash
# Compare modified file lists across plans in the same wave
# If overlap found, serialize those plans or split into sub-waves
```

## Output Contract

- Phase SUMMARY.md with execution results, deviation log, verification verdict
- Verification report (PASS/FAIL with evidence)
- Per-task commit hashes recorded in SUMMARY.md
- Execution logs for each plan

<!-- Phase 24.5 TODO: Full workflow implementation with agent dispatch logic, wave detection, and error recovery -->
