---
description: "Run gatekeeping, review, and verification with traceable evidence and an explicit verdict."
agent: hiveq
subtask: true
---

# HM Verify

## Objective
Evaluate whether the current work satisfies review, verification, and readiness requirements for promotion or continuation.

## Context
- Arguments: `$ARGUMENTS`
- Trigger: purpose class `gatekeeping`
- Output focus: verdict, findings, and follow-up routing

## Process
1. Read the current continuity and evidence state.
2. Run the verification workflow against the expected outputs.
3. Emit findings, verdict, and the next required action.

## Output Contract
- verdict
- findings
- missing_evidence
- next_command
