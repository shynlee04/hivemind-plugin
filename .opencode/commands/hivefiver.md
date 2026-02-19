---
name: "hivefiver"
description: "HiveFiver v2 meta-builder root command. Route /hivefiver <action> to deterministic workflows with adaptive tutoring and governance gates."
argument-hint: "<action> [args]"
---

# HiveFiver Root Command

Use this command as the canonical entry point:
- `/hivefiver init`
- `/hivefiver spec`
- `/hivefiver architect`
- `/hivefiver workflow`
- `/hivefiver build`
- `/hivefiver validate`
- `/hivefiver deploy`
- `/hivefiver research`
- `/hivefiver audit`
- `/hivefiver tutor`

## Action Router
1. Parse `$1` as action. If missing, default to `init`.
2. If action is unknown, route to `/hivefiver init` and emit remediation choices.
3. Keep legacy compatibility by recognizing old commands and aliases.

## Routing Matrix
- `init` -> `/hivefiver-start` + `/hivefiver-intake`
- `spec` -> `/hivefiver-specforge`
- `architect` -> `/hivefiver-skillforge`
- `workflow` -> `/hivefiver-skillforge` + workflow selector
- `build` -> `/hivefiver-gsd-bridge`
- `validate` -> `/hivefiver-ralph-bridge`
- `deploy` -> `/hivefiver-doctor` (environment readiness mode)
- `research` -> `/hivefiver-research`
- `audit` -> `/hivefiver-doctor`
- `tutor` -> `/hivefiver-tutor`

## Chat-First Tab Contract
Return outputs in this fixed structure:
1. `[📋 Spec]`
2. `[🔧 Build]`
3. `[🧪 Validate]`
4. `[🚀 Deploy]`
5. `[📚 Tutor]`

Each tab must include:
- progress meter (`[███░░░░░░]` style)
- current gate status
- next action options (multiple choice)

## Governance Rules
- No execution without context gate + evidence gate.
- No confidence above `partial` when MCP stack has unresolved gaps.
- Process guarantee only after all gates pass.

## Output Contract
Return:
- `resolved_action`
- `resolved_command`
- `resolved_workflow`
- `persona_lane`
- `domain_lane`
- `progress_state`
- `next_step_options`
