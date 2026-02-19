---
name: hivefiver-gsd-compat
description: Map HiveFiver outputs into GSD-compatible lifecycle checkpoints with deterministic lineage and evidence-linked gates.
---

# HiveFiver GSD Compat

Use this skill when teams need GSD lifecycle continuity.

## Workflow
1. Map spec sections to lifecycle nodes.
2. Validate lineage continuity (project -> milestone -> phase -> plan -> task -> verification).
3. Build phase gate matrix with inherited research confidence.
4. Export compatibility report for downstream tools.

## Determinism Rules
- Preserve phase ordering.
- Preserve evidence confidence lineage.
- Emit remediation actions for failed gates.

## References
- `references/gsd-lifecycle-map.md`

## Template
- `templates/gsd-bridge-output.md`

## Script
- `scripts/generate-map-template.sh`
