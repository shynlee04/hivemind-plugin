---
description: "Debugging workflow: load issue context → investigate codebase → formulate hypotheses → run reproduction tests → fix & verify."
---

# hm-debug

## Goal
Systematically investigate and resolve bugs, maintaining a hypothesis log to track diagnostics.

## Agent Routing Table
| Role | Agent | Responsibility |
|------|-------|---------------|
| Orchestrator | hm-debug-session-manager | Manages debug session state, coordinates debugger |
| Investigator | hm-debugger | Inspects logs, codebase, formulates hypotheses, writes fix |

## Execution Phases
1. **Load Context**: Parse error logs, stack traces, and steps to reproduce.
2. **Formulate Hypotheses**: Write a list of potential root causes to `DEBUG-SESSION.md`.
3. **Reproduction Case**: Write a failing unit/integration test to reproduce the bug.
4. **Investigation**: Inspect code logic, trace variable values, and test each hypothesis.
5. **Implement Fix**: Modify target code files to fix the issue.
6. **Verify Fix**: Ensure reproduction test passes (turns green) and no regressions occur.

## Checkpoint Protocol
| Checkpoint Type | Behavior |
|-----------------|----------|
| `decision` | Confirm root cause hypothesis before writing fix |
| `human-verify` | Verify bug fix against manual execution |

## Output Contract
- `DEBUG-SESSION.md` log containing hypothesis tracker and resolution details
- Working regression test code
