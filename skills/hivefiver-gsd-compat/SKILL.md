---
name: hivefiver-gsd-compat
description: Map HiveFiver outputs into GSD-compatible lifecycle checkpoints with lineage-safe and evidence-linked artifacts.
---

# HiveFiver GSD Compat

Use this skill when teams need GSD lifecycle continuity without full framework mirroring.

## Workflow
1. Map spec sections to lifecycle nodes.
2. Validate lineage continuity (project -> milestone -> phase -> plan -> task -> verification).
3. Build phase gate matrix with inherited research confidence.
4. Export compatibility report for downstream tools.

## References
- `references/gsd-lifecycle-map.md`

## Template
- `templates/gsd-bridge-output.md`

## Script
- `scripts/generate-map-template.sh`
