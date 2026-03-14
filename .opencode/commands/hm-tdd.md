---
description: "Enforce a red-green-refactor execution path with failing tests first and evidence-based completion."
agent: hiveq
subtask: true
---

# HM TDD

## Objective
Drive test-first execution so implementation work remains traceable, bounded, and reviewable.

## Context
- Arguments: `$ARGUMENTS`
- Trigger: purpose class `tdd`
- Output focus: red-green-refactor progress plus next routing

## Process
1. Establish failing tests or missing acceptance criteria.
2. Route implementation only after the red phase is explicit.
3. Return green-state evidence and refactor follow-up requirements.

## Output Contract
- failing_tests
- passing_tests
- refactor_notes
- next_command
