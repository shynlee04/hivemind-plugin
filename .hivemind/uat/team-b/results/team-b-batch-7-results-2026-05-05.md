# Team B — Batch 7 Results: Phase 2 Cross-Primitive (Delegation + PTY + Journal + Governance)

**Date:** 2026-05-05
**Phase:** 2 — Cross-Primitive Integration
**Trajectory:** `traj_uat_team_b_batch6` (active)
**Parent Session:** `ses_20bf160c2ffeK7CMIypDMSGK0h`

## Test 7.1: SDK Delegation + PTY Concurrent Execution

| Step | Tool | Input | Result | Verdict |
|------|------|-------|--------|---------|
| 1 | delegate-task | agent=hm-l2-general, safetyCeilingMs=60000 | status=running, delegationId=08aff8a9, executionMode=sdk, queueKey=agent:hm-l2-general | PASS |
| 2 | run-background-command | command=bash, sessionId=team-b-pty-batch7 | status=running, delegationId=6b2a3686, executionMode=pty, queueKey=category:command, ptySessionId=pty-c84e0e4c | PASS |
| 3 | delegation-status | delegationId=08aff8a9 (SDK) | status=running (poll 1) → status=completed (poll 2, 27.0s), result={"test":"team-b-batch7-cross-primitive","status":"ok"} | PASS |
| 4 | delegation-status | delegationId=6b2a3686 (PTY) | status=running, agent=command-runner | PASS |

**Key Observation:** SDK delegation (queueKey=agent:hm-l2-general) and PTY command (queueKey=category:command) ran on **different concurrency lanes** simultaneously — no queue contention.

## Test 7.2: Cross-Governance Chain (Trajectory + Pressure + Journal)

| Step | Tool | Input | Result | Verdict |
|------|------|-------|--------|---------|
| 1 | hivemind-trajectory | action=event, eventId=evt_batch7_delegation_dispatched | Event attached to active trajectory | PASS |
| 2 | hivemind-pressure | action=attach_event, tier=0, toolName=delegate-task | Pressure evidence attached, tier 0/steady/allow | PASS |
| 3 | session-journal-export | format=json, pipelineKey=batch7-cross-primitive | journalSummary: sessions=1, delegations=0 | PASS |
| 4 | hivemind-trajectory | action=checkpoint | Checkpoint created with full summary | PASS |

**Key Observation:** Journal export shows 0 delegations — SDK delegations are tracked in delegation-status, not in session-journal-export. These are separate tracking systems.

## Summary

| Metric | Value |
|--------|-------|
| Tests | 8 |
| PASS | 8 |
| FAIL | 0 |
| Findings | 1 |

## Findings

### FINDING-7.1: Journal Tracking Gap for SDK Delegations
- **Severity:** Low
- **Detail:** `session-journal-export` reports `delegations: 0` even after successful SDK delegation. SDK delegations are tracked via `delegation-status` tool, not in the session journal.
- **Impact:** Journal export cannot be used as a single source of truth for delegation history.

## Cross-Primitive Integration Validated

- delegate-task (SDK) → delegation-status (poll) → trajectory (event) → pressure (attach) → journal (export) — all in one chain, all at tier 0 steady
- SDK + PTY delegations run concurrently on separate queueKeys without contention
