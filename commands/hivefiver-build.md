---
name: "hivefiver-build"
description: "Alias command for /hivefiver build that locks implementation handoff to TDD and plan-graph continuity."
---

# HiveFiver Build Alias

Run `/hivefiver build` behavior.

## Required Behavior
1. Verify plan graph connectivity.
2. Enforce TDD posture (`explicit` or `hidden assist`).
3. Confirm tooling package compatibility.
4. Block build handoff if unresolved high-risk ambiguity exists.

## Output Contract
- `alias_resolved_to`: `/hivefiver build`
- `next_command`: `/hivefiver-gsd-bridge`
