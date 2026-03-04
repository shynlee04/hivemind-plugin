# Agent Registry — Non-Destructive Pivot
**Date**: 2026-03-04
**Canonical Location**: `.opencode/agents/`
**Mirror**: `agents/` (root — sync manually or via CI)

## Agents

| Agent | Mode | Lineage | Delegatable By | Terminal? | Mirror Synced? |
|-------|------|---------|---------------|-----------|----------------|
| hivefiver | primary | meta-builder | user direct | No | Yes |
| hivefiver-reserved | primary | meta-builder | user direct | No | No (backup-only in canonical path) |
| hiveminder | primary | project | user direct | No | Yes |
| hivemaker | subagent | shared | hivefiver, hiveminder | No | Yes (mode discrepancy: .opencode=subagent, root=all) |
| hivehealer | all | shared | hivefiver, hiveminder | No | Yes |
| hiveplanner | all | shared | hivefiver, hiveminder | No | Yes |
| hiveq | all | shared | hivefiver, hiveminder, hiveplanner | Yes (read-only) | Yes |
| hivexplorer | subagent (hidden) | shared | all agents | Yes (read-only) | Yes |
| hiverd | all | shared | hivefiver, hiveminder, hiveplanner | Yes | Yes |
| hitea | all | testing | hivefiver | No | Yes |

## Discrepancies Log

| Agent | Field | .opencode/ value | agents/ value | Resolution |
|-------|-------|-----------------|---------------|------------|
| hivefiver | file | was emergency 181L, now reserved 543L | 543L | RESOLVED — promoted reserved to canonical |
| hivemaker | mode | subagent | all | NOTED — .opencode/ is authoritative, root mirror may diverge |
| hitea | presence | exists | exists | RESOLVED — already mirrored in root |

## Sync Rule
`.opencode/agents/*.md` -> `agents/*.md` (one-way sync, .opencode is source of truth)
