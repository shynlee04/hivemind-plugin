---
description: "Audit workflow: check file layout → trace lineage → validate configurations → fix primitive drift."
---

# hm-audit

## Goal
Audit workspace state, verify naming/lineage compliance, check configs, and resolve primitive drift.

## Agent Routing Table
| Role | Agent | Responsibility |
|------|-------|---------------|
| Audit | hm-ecologist | Scans workspace files, maps layout, checks naming standards |
| Fixer | hm-intel-updater | Resolves configuration drift, syncs primitive changes |

## Execution Phases
1. **Structure Audit**: Scan `.opencode/`, `.hivemind/`, and `.planning/` files against naming taxonomy.
2. **Lineage Audit**: Verify that all commands map to actual workflows and agents in the routing tables.
3. **Config Validation**: Validate `opencode.json` and `.hivemind/governance/config.json` against Zod schemas.
4. **Fix/Sync**: If `--fix` is passed, auto-correct naming format, generate missing symlinks/files, and write audit report.

## Checkpoint Protocol
| Checkpoint Type | Behavior |
|-----------------|----------|
| `decision` | Choose whether to auto-fix identified audit issues |
| `human-verify` | Review audit report and drift logs |

## Exit Criteria
- AUDIT-REPORT.md details all structural, configuration, and lineage compliance issues.
- All non-compliant files identified and synced/reported.
