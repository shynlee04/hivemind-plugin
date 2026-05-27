---
description: "Execution workflow: wave detection → parallel execution → verification → summary. Routes through hm-executor and hm-verifier agents."
---

# hm-execute

## Goal
Execute all plans in a phase using wave-based parallel execution with atomic commits, deviation handling, and goal-backward verification.

## Agent Routing Table
| Role | Agent | Responsibility |
|------|-------|---------------|
| Execution | hm-executor | Atomic plan execution, commits, deviation handling |
| Verification | hm-verifier | Runs checks against plan must-haves |

## Execution Phases
1. **Wave detection**: Read wave assignments from plan frontmatter.
2. **Parallel execution**: Dispatch `hm-executor` instances for plans in the current wave. Ensure no file-write conflicts.
3. **Checkpoint handling**: Halt execution when checkpoints are encountered.
4. **Verification**: Invoke `hm-verifier` to verify completed tasks against must-haves.
5. **Summary**: Compile execution logs, commit hashes, and status into `SUMMARY.md`.

## Checkpoint Protocol
| Checkpoint Type | Behavior |
|-----------------|----------|
| `human-verify` | Verify visual changes, interactive states, or build output |
| `decision` | Choose remediation path on test/verification failure |

## Output Contract
- Phase `SUMMARY.md`
- Code commits (atomic, one per logical task)
- Verification verdict (PASS/FAIL)
