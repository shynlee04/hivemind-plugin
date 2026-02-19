---
name: "hivefiver-skillforge"
description: "Discover, audit, and compose robust skill packs for HiveFiver v2 including cross-domain non-dev lanes and deterministic automation bundles."
---

# HiveFiver SkillForge

## Purpose
Build the right skill package for the selected persona/domain lane and requested workflow complexity.

## Discovery Order
1. Core HiveFiver skills.
2. Project-native skills.
3. Trusted external catalogs (for example `skills.sh`) with trust review.

## Required Domain Lanes
- dev
- marketing
- finance
- office-ops
- hybrid

## Bundling Rules
- include references/templates/scripts where available
- include deterministic workflow bindings
- include fallback skills for commandless execution

## Required Checkpoint
```ts
map_context({ level: "action", content: "HiveFiver v2 skill package assembly" })
save_mem({ shelf: "project-intel", content: "Cross-domain skill package generated", tags: ["hivefiver", "skills", "v2"] })
```

## Output Contract
Return:
- `skill_inventory`
- `coverage_matrix`
- `gaps`
- `recommended_installs`
- `workflow_bindings`
- `next_command`: `/hivefiver workflow`
