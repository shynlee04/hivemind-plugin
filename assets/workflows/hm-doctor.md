---
description: "Health check workflow: directory audit → config validation → frontmatter scan → git state → dependency check → report."
---

# hm-doctor

## Goal
Run comprehensive diagnostic checks across the Hivemind project to detect structural issues, config errors, and state inconsistencies.

## Agent Routing Table
| Role | Agent | Responsibility |
|------|-------|---------------|
| Diagnostics | hm-executor | Runs all checks, aggregates results, writes report |

## Execution Phases
1. **Directory Integrity**: Verify .opencode/, .hivemind/, .planning/ exist with .gitkeep registration. Check assets/ ↔ .opencode/ sync consistency.
2. **Config Validation**: Parse .hivemind/config.json and opencode.json for schema compliance.
3. **Frontmatter Scan**: Validate all agent .md files have required frontmatter (name, description, mode, tools). Validate command .md files have namespace, agent, description.
4. **Git State Check**: Verify working tree is clean, no merge conflicts, HEAD is on expected branch.
5. **Dependency Check**: Run `npm ls --depth=0` for missing or mismatched dependencies.
6. **Report**: Write hm-doctor-report.md with PASS/FAIL per check and actionable fixes.

## Exit Criteria
- Report written with per-check PASS/FAIL status.
- --fix flag applied automatic fixes for known issues.
- Summary of issues requiring manual intervention.
