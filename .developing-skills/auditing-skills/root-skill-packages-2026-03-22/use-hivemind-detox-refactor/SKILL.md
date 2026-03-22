---
name: use-hivemind-detox-refactor
description: Route HiveMind detox work to verified audit, refactor, debug, governance, and AGENTS recovery bundles without trusting polluted built-in routes by default.
---

# use-hivemind-detox-refactor

Use this skill when working on the HiveMind framework itself and the task is about detoxing, auditing, refactoring, isolating, or replacing polluted built-in skill and governance flows.

## Use This For

- skill detox, audit, doctoring, refactor, or rewrite inside HiveMind
- context-rot, false-enforcement, delegation, hierarchy, git-memory, or governance skill cleanup
- meta-builder cleanup for skills, commands, agents, or AGENTS governance when the target is HiveMind itself

## Do Not Use This For

- ordinary product implementation outside HiveMind skill/governance surfaces
- generic git, planning, delegation, or verification requests
- routing into archived or deprecated HiveMind skills

## Core Rules

1. Treat root `skills/` plus verified `src/**` authority as truth.
2. Treat `.opencode/**` as projection evidence only.
3. Never inherit `MUST LOAD`, `auto-run`, or `do not proceed` prose unless active `src/**` behavior backs it.
4. Never route to missing, generic, or deprecated targets.
5. Prefer the smallest detox bundle and the minimum external helper lane.

## Accepted Detox Concerns

- `entry_router_contamination`
- `false_enforcement_or_auto_run_claims`
- `missing_route_targets`
- `projection_drift_or_stale_support_files`
- `cross_bundle_ownership_leak`
- `meta_builder_overreach`
- `governance_doc_drift`
- `git_memory_continuity_breakage`
- `delegation_protocol_breakage`

## Routing Bundles

| Concern | Route | External Helper Lead |
|---|---|---|
| entry, context, verification contamination | Bundle A | `context-map` -> `systematic-debugging` |
| delegation, hierarchy, authority routing | Bundle B | `context-map` -> `code-architecture-review` |
| git memory and continuity routes | Bundle C | `context-map` -> `systematic-debugging` |
| meta-builder overreach | Bundle D | `skill-review` or `writing-skills` -> `review-and-refactor` |
| archive/deprecated lineage only | Bundle E | `context-map` |
| AGENTS governance recovery | Cross-bundle support | `create-agentsmd` -> `technical-writer` |

Read `references/bundle-map.md` for bundle ownership and `references/defect-taxonomy.md` for guard behavior.

## Protocol

1. Classify the request into one accepted detox concern.
2. Map it to the smallest matching bundle.
3. Load only the minimum external helper lane needed for that bundle.
4. Verify that every live built-in route target exists in active root `skills/`.
5. If a route depends on projection-only evidence or missing targets, stop auto-routing and classify it as detox-required.
6. Return a bounded next action using `templates/router-output.md`.

## Immediate Refusals

- Missing targets such as `permission-design`, `profile management`, `governance enforcement`, `Domain specialist`, `use-hivemind-session-resume`, `session-memory-resume`, or `delegation-handoff`
- Any live route into `skills/_archived/**` or `skills/_deprecated_hive/**`
- Any claim that `.opencode/**` is the remediation authority

## Terminal State

- The concern is classified.
- The correct detox bundle is identified.
- The minimum safe helper lane is chosen.
- Blocked routes and source-remediation follow-ups are made explicit.
