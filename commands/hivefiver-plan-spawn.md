---
description: Deterministically materialize runtime plan nodes into .hivemind/plans from planning templates.
agent: hivefiver
subtask: true
---

<enforcement>
Gate check (auto-executed):
!`bash .opencode/skills/hivefiver-coordination/scripts/gate-check.sh architect .`

Runtime enforcement pre-turn (auto-executed):
!`bash .opencode/skills/hivefiver-coordination/scripts/runtime-gate.sh pre-turn .`

Pipeline state (auto-executed):
!`bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh read .`

If gate check reports `allowed: false`, STOP and return the gate reason.
</enforcement>

<objective>
Materialize runtime plan artifacts programmatically in `.hivemind/plans`.
Never hand-author runtime plan files.
</objective>

<context>
Arguments: `$ARGUMENTS`

Contract:
@.opencode/templates/planning/PLAN-MATERIALIZE-CONTRACT-2026-03-03.md

Templates:
@.opencode/templates/planning/root-plan.template.md
@.opencode/templates/planning/sub-plan.template.md
@.opencode/templates/planning/atomic-plan.template.md
@.opencode/templates/planning/validation-plan.template.md

Runtime target:
@.hivemind/plans/manifest.json
</context>

<process>
Expected argument format:

`<PLAN_ID> <scope> "<title>" [--parent <PLAN_ID>] [--priority <level>] [--status <state>] [--tags <csv>] [--force]`

Run deterministic materializer:

!`bash .opencode/skills/hivefiver-coordination/scripts/plan-materialize.sh spawn $ARGUMENTS --workdir .`

After generation, return generated file paths and manifest confirmation.

Run post-turn enforcement:

!`bash .opencode/skills/hivefiver-coordination/scripts/runtime-gate.sh post-turn .`
</process>

<output_contract>
Return:
- generated: boolean
- plan_id: string
- plan_file: string
- validation_file: string
- manifest: string
- sot_registration: boolean
</output_contract>
