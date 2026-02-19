---
name: "hivefiver-deploy"
description: "Alias command for /hivefiver deploy that validates environment readiness and deployment governance controls."
---

# HiveFiver Deploy Alias

Run `/hivefiver deploy` behavior.

## Required Behavior
1. Audit environment and secrets posture.
2. Validate release gate dependencies.
3. Emit deployment checklist and rollback prerequisites.

## Output Contract
- `alias_resolved_to`: `/hivefiver deploy`
- `next_command`: `/hivefiver-doctor`
