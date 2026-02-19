---
name: hivefiver-skill-auditor
description: Audit skills for phase coverage, staleness, and cross-domain inclusivity (dev + non-dev) with actionable remediation.
---

# HiveFiver Skill Auditor

Use this skill when building or maintaining HiveFiver bundles.

## Workflow
1. Inventory available skills from local directories.
2. Map skills to HiveFiver phases and domain lanes.
3. Detect overlap, staleness, and missing trigger coverage.
4. Propose install/create actions for missing lanes.
5. Produce remediation report with links and scripts.

## Required Coverage Lanes
- Dev engineering
- Marketing workflows
- Finance/reporting workflows
- Office/documentation workflows
- Web research and browsing workflows

## Discovery Strategy
- Prioritize local validated skills.
- Use `find-skills` for missing capabilities.
- Optionally consult curated external catalogs (for example skills.sh) and verify trust before adoption.

## References
- `references/audit-checklist.md`
- `references/skill-source-links.md`

## Template
- `templates/skill-audit-report.md`

## Script
- `scripts/audit-skill-coverage.sh`
