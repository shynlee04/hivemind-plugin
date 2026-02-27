---
name: hiveq-verify
description: Verify phase or task completion against acceptance criteria using
  goal-backward analysis.
owner_agent: hiveq
kind: router
execution_context: workflows/hiveq-verification-pipeline.yaml
required_skills:
  - verification-methodology
required_templates:
  - templates/verification-report-template.md
required_references:
  - references/quality-gate-definitions.md
required_prompts:
  - prompts/verification-criteria.md
chain_group: hiveq
group: hiveq
entry_gate: session_declared
---
# HiveQ Verify

## Objective

Verify that a phase, task, or deliverable meets its acceptance criteria. Uses goal-backward analysis: start from what SHOULD be true, then trace evidence to confirm it IS true.

## Process

1. **Extract criteria** — Load acceptance criteria from the planning artifact for the target phase/task.
2. **Collect evidence** — Run commands (`npm test`, `npx tsc --noEmit`), read files, grep for patterns.
3. **Goal-backward analysis** — For each criterion, trace from expected outcome → actual evidence → verdict.
4. **Produce verdict** — PASS/FAIL per criterion with supporting evidence.

## Arguments

- `$ARGUMENTS` — The phase, task ID, or deliverable to verify (e.g., "Phase B session intelligence", "T3 enhanced export").

## Output

A verification report using `verification-report-template.md` with:
- Target phase/task identification
- Acceptance criteria list with IDs
- Evidence collected per criterion (command output, file contents)
- PASS/FAIL verdict per criterion
- Overall verdict with blocking issues listed
