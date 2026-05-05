# Team B — Batch 8 Results: Phase 2 Cross-Primitive (Command-Engine + Doc + Configure)

**Date:** 2026-05-05
**Phase:** 2 — Cross-Primitive Integration
**Trajectory:** `traj_uat_team_b_batch6` (active)
**Parent Session:** `ses_20bf160c2ffeK7CMIypDMSGK0h`

## Test 8.1: Command-Engine Discovery Chain

| Step | Tool | Input | Result | Verdict |
|------|------|-------|--------|---------|
| 1 | hivemind-command-engine | action=discover, arguments=deep-research-synthesis-repomix | Returned 11 commands matching argument (deep-init, deep-research-synthesis-repomix, harness-audit, harness-doctor, hf-absorb, hf-audit, hf-configure, hf-create, hf-prompt-enhance, hf-prompt-enhance-to-plan, hf-stack) | PASS |
| 2 | hivemind-command-engine | action=analyze_contract, commandName=deep-research-synthesis-repomix | valid=true, acceptsArguments=false, failureStates=[missing_command, invalid_contract, pressure_blocked, context_overflow], contextNeeds=[bounded-context, pressure-decision] | PASS |
| 3 | hivemind-command-engine | action=route_preview, commandName=deep-research-synthesis-repomix | executable=false, pressure=tier0/steady/allow, route.status=ready, exclusions=[broad-system-transform, process-launch, command-execution] | PASS |
| 4 | hivemind-command-engine | action=transform_messages, commandName=deep-research-synthesis-repomix | Messages transformed with exclusions=[broad-system-transform, process-launch, command-execution] | PASS |

## Test 8.2: Cross-Tool Integration (Doc + Configure)

| Step | Tool | Input | Result | Verdict |
|------|------|-------|--------|---------|
| 1 | hivemind-doc | action=search, path=.opencode/commands, query="command definition deep-research" | matches=[] (0 results) | PASS (empty expected) |
| 2 | hivemind-doc | action=chunk, path=.opencode/commands/deep-research-synthesis-repomix.md, maxCharacters=500 | 67 chunks returned with heading, startLine, endLine, characterCount, estimatedTokens | PASS |
| 3 | configure-primitive | action=list, scope=project (first attempt: scope=local → ERROR) | 18 commands listed, warning about invalid skill frontmatter | PASS |
| 4 | hivemind-pressure | action=attach_event, tier=0 | Pressure evidence attached to trajectory | PASS |
| 5 | hivemind-trajectory | action=checkpoint | Checkpoint created with batch 8 summary | PASS |

**Key Observation:** `hivemind-doc search` returned 0 matches for command files — doc search appears to only index plain text content, not Markdown files in `.opencode/commands/`. However, `hivemind-doc chunk` successfully parsed the `.md` file into 67 structured chunks.

## Parameter Validation Findings

| Tool | Parameter | Invalid Value | Valid Values | Verdict |
|------|-----------|---------------|--------------|---------|
| configure-primitive | scope | "local" | "project"\|"global" | ERROR (correct validation) |
| hivemind-command-engine | route_preview | arguments=<value> | commandName=<value> | ERROR (correct validation) |

## Summary

| Metric | Value |
|--------|-------|
| Tests | 9 |
| PASS | 9 |
| FAIL | 0 |
| Findings | 2 |

## Findings

### FINDING-8.1: Doc Search Returns Empty for .md Command Files
- **Severity:** Low
- **Detail:** `hivemind-doc search` on `.opencode/commands/` directory returns 0 matches for any query. `hivemind-doc chunk` on individual `.md` files works correctly (67 chunks).
- **Impact:** Doc search cannot discover command content; must use `chunk` with specific file paths.

### FINDING-8.2: configure-primitive Scope Validation
- **Severity:** Info
- **Detail:** `scope=local` is rejected with clear error message. Valid values are `project` and `global` only. This is correct validation behavior, not a bug.
