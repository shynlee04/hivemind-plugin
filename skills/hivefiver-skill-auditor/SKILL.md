---
name: hivefiver-skill-auditor
description: Audit skill coverage, staleness, and cross-domain inclusivity for HiveFiver v2 with remediation and trust-reviewed discovery actions.
---

# HiveFiver Skill Auditor

Use this skill while building or maintaining HiveFiver packs.

## Workflow
1. Inventory local skills and classify by lane.
2. Map skills to HiveFiver phases and workflow surfaces.
3. Detect overlap, staleness, and missing trigger coverage.
4. Recommend install/create actions for missing lanes.
5. Produce remediation report with references and scripts.

## Required Coverage Lanes
- Dev engineering
- Marketing workflows
- Finance/reporting workflows
- Office/documentation workflows
- Web research and browsing workflows

## Discovery Strategy
- Prioritize local validated skills.
- Use `find-skills` for missing capability lanes.
- Use trusted external catalogs (for example `skills.sh`) with trust review.

## References
- `references/audit-checklist.md`
- `references/skill-source-links.md`

## Template
- `templates/skill-audit-report.md`

## Script
- `scripts/audit-skill-coverage.sh`
