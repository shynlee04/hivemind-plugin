---
name: plan-materialize-contract
version: 1.0.0
status: active
owner: hivefiver
created: 2026-03-03
runtime_target: .hivemind/plans
source_templates: .opencode/templates/planning
---

# Plan Materialize Contract

## Purpose

Define deterministic generation rules for runtime plan artifacts in `.hivemind/plans`.
This contract separates authoring templates (`.opencode/**`) from runtime state (`.hivemind/**`).

## Deterministic Rules

1. Authoring templates are maintained only in `.opencode/templates/planning`.
2. Runtime plan artifacts are generated only by `plan-materialize.sh`.
3. Runtime plan artifacts are written only to `.hivemind/plans`.
4. Legacy `.hivemind/plan/**` is non-authoritative and excluded from runtime writes.
5. Plan manifest updates are append-only unless `--force` is explicit.
6. Every generated plan creates a sibling validation artifact.
7. Every generated plan and validation artifact is eligible for SOT registration.

## Naming Rules

- Root: `META01-PLAN.md`, `PROJ01-PLAN.md`
- Sub: `META01-SUB01-PLAN.md`, `PROJ02-SUB03-PLAN.md`
- Atomic: `META01-SUB01-ATOMIC01.md`, `PROJ02-SUB03-ATOMIC02.md`
- Validation: `VALIDATION-META01.md`, `VALIDATION-META01-SUB01.md`

## Frontmatter Minimum

- `id`
- `parent`
- `status`
- `priority`
- `scope`
- `type`
- `tags`
- `symlink_context`
- `validation_log`
- `created`
- `last_sync`
- `completion_criteria`

## Allowed Status

- `active`
- `completed`
- `pivoting`
- `blocked`

## Allowed Priority

- `critical`
- `high`
- `normal`
- `low`

## Validation Requirements

1. Runtime file path resolves under `.hivemind/plans`.
2. Manifest entry exists and references generated files.
3. Plan id matches filename pattern.
4. Validation file exists and references the plan id.
5. No direct manual edits are assumed for generation path.

## Trigger Surfaces

- Direct script execution:
  - `bash .opencode/skills/hivefiver-coordination/scripts/plan-materialize.sh spawn ...`
  - `bash .opencode/skills/hivefiver-coordination/scripts/plan-materialize.sh quarantine-legacy`
- Slash command wrapper:
  - `/hivefiver-plan-spawn ...`
