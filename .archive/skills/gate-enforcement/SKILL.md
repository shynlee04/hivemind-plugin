---
name: gate-enforcement
description: "Quality gate definitions, pass/fail logic, escalation rules for each gate type."
---

# Gate Enforcement

Use this skill when executing and interpreting quality gates for the HiveMind framework.

## Gate Definitions

### Unit Test Gate
- **Command**: `npm test`
- **Pass**: Output contains `# fail 0` and exit code 0
- **Fail**: Any test failure or non-zero exit code
- **Escalation**: Report failing test names and file paths

### Type Check Gate
- **Command**: `npx tsc --noEmit`
- **Pass**: Empty output (no errors)
- **Fail**: Any TypeScript error
- **Escalation**: Report error count, affected files, error categories

### Release Safety Gate
- **Command**: `npm run guard:public`
- **Pass**: Exit code 0
- **Fail**: Non-zero exit code
- **Escalation**: Report which checks failed (secrets detection, file inclusion, etc.)

### LOC Limit Gate
- **Command**: `wc -l {target_files}`
- **Pass**: All files ≤ 550 LOC
- **Fail**: Any file > 550 LOC
- **Escalation**: Report file name, current LOC, and overage amount

### CQRS Compliance Gate
- **Command**: `grep -r "stateManager.save" src/hooks/`
- **Pass**: 0 matches (no hook-side state writes)
- **Fail**: Any match found
- **Escalation**: Report file and line number of each violation

## Gate Execution Protocol

1. Announce which gate is being executed.
2. Run the command and capture full output.
3. Apply pass/fail logic.
4. Include raw command output in the report (do not summarize — include actual text).
5. If FAIL, include escalation details.

## Gate Composition

When running multiple gates (e.g., `all`), execute in this order:
1. Type Check (fastest, catches compile errors)
2. Unit Tests (medium, catches logic errors)
3. LOC Limits (fast, catches structural issues)
4. CQRS Compliance (fast, catches architecture violations)
5. Release Safety (slowest, catches deployment issues)

Stop on first FAIL only if `--fail-fast` is specified. Otherwise, run all gates and report aggregate.

## Gate Result Format

```
Gate: [gate_id]
Command: [exact command run]
Exit Code: [0 or non-zero]
Output: [raw command output — full, not summarized]
Verdict: PASS | FAIL
Details: [escalation info if FAIL]
```
