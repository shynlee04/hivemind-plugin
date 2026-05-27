---
description: "Verification workflow: load must-haves → execute checks → verify evidence → write report."
---

# hm-verify

## Goal
Perform a goal-backward verification of all completed tasks in a phase to certify truths, artifacts, and key links.

## Agent Routing Table
| Role | Agent | Responsibility |
|------|-------|---------------|
| Verification | hm-verifier | Runs automated checks, analyzes code, verifies links, writes report |

## Execution Phases
1. **Load Must-Haves**: Read `must_haves` frontmatter from all plans in the phase directory.
2. **Execute Checks**:
   - Run automated tests (`npm test`).
   - Run linter/compiler checks (`npx tsc --noEmit`).
3. **Verify Evidence**: Check that code components, functions, exports, and relationships exist as stated.
4. **Write Report**: Output findings to `.planning/phases/{{phase_id}}/VERIFICATION.md` using the `hm-verification` template.

## Checkpoint Protocol
| Checkpoint Type | Behavior |
|-----------------|----------|
| `human-verify` | Verify manual/visual checks (e.g. check on browser port) |

## Output Contract
- `VERIFICATION.md` report with PASS/FAIL status and evidence lines
