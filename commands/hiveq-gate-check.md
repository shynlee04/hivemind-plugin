---
name: hiveq-gate-check
description: Run a specific quality gate and produce structured pass/fail result.
owner_agent: hiveq
kind: router
execution_context: workflows/hiveq-gate-enforcement.yaml
required_skills:
  - gate-enforcement
required_templates:
  - templates/gate-checklist-template.md
chain_group: hiveq
group: hiveq
entry_gate: session_declared
---

# HiveQ Gate Check

## Objective

Execute a specific quality gate command and produce a structured PASS/FAIL result with parsed output.

## Available Gates

| Gate ID | Command | Pass Condition |
|---------|---------|---------------|
| `unit-tests` | `npm test` | 0 failures |
| `type-check` | `npx tsc --noEmit` | 0 errors |
| `release-safety` | `npm run guard:public` | Exit code 0 |
| `loc-check` | `wc -l` on target files | All ≤550 LOC |
| `cqrs-check` | `grep -r "stateManager.save" src/hooks/` | 0 matches |

## Arguments

- `$ARGUMENTS` — Gate ID to run (e.g., "unit-tests", "type-check", "release-safety", "all").

## Process

1. Identify gate(s) to run from arguments.
2. Execute gate command(s).
3. Parse output for pass/fail determination.
4. Produce structured result with raw command output included.

## Output

A gate check result with:
- Gate ID and command executed
- Raw command output
- PASS/FAIL verdict
- Failure details if applicable (which tests failed, which files exceed LOC)
