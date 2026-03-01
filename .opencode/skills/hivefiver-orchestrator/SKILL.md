---
name: hivefiver-orchestrator
description: "Use when navigating between hivefiver stages or selecting operation mode. Defers to hivefiver-mode for routing and hivefiver-coordination for quality gates."
---

# HiveFiver Orchestrator

Lightweight navigator for HiveFiver. Delegates routing and quality to specialized skills.

## Mode Router

This skill now delegates to hivefiver-mode and hivefiver-coordination:

| Mode | Delegates To |
|------|-------------|
| `guard` | hivefiver-coordination for quality gates |
| `audit` | hivefiver-coordination for validation |
| `route` | hivefiver-mode for stage detection |
| `build` | hivefiver-mode + hivefiver-coordination |

## Stage Markers

`start → intake → spec → architect → build → audit → doctor`

Track current stage in hierarchy.json.

## Execution Protocol

1. Load hivefiver-mode for stage detection
2. Use route-stage.sh to determine current stage
3. Load hivefiver-coordination for quality gates
4. Use quality-check.sh before claiming completion

## NEVER

1. Load ALL references at once — use mode router
2. Skip Gate 0 alignment check
3. Build skills from scratch without find-skill first
4. Claim completion without quality evidence
5. Delegate without using delegation template
