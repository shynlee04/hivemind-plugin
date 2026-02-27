---
name: hivefiver-domain-pack-router
description: Route HiveFiver workflows across dev and non-dev domains using operational blueprints, domain packs, and deterministic output contracts.
---

# HiveFiver Domain Pack Router

Use this skill when a request extends beyond pure software implementation.

## Supported Domain Packs
- `dev`: app/platform engineering and integrations
- `marketing`: campaigns, content systems, growth ops
- `finance`: budgeting, forecasting, executive metrics
- `office-ops`: docs, spreadsheets, presentation/reporting pipelines
- `hybrid`: mixed-domain solutions

## Workflow
1. Detect domain intent and required outputs.
2. Select matching domain pack and capability set.
3. Attach required skills, commands, and workflow guards.
4. Emit operational blueprint (not full external API executor).
5. Persist domain routing decision for follow-up steps.

## Required Output
- `domain_pack`
- `capability_map`
- `workflow_recommendation`
- `required_skills`
- `required_gates`
- `artifact_plan`

## References
- `references/domain-pack-matrix.md`

## Template
- `templates/domain-pack-output.md`
