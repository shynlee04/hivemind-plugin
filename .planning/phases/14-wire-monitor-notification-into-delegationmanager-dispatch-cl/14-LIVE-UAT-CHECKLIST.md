# Phase 14 Live UAT Checklist — Plan 14-04

**Phase:** `14-wire-monitor-notification-into-delegationmanager-dispatch-cl`  
**Plan:** `14-04`  
**Created:** 2026-05-19  
**Evidence level:** L1 only when pasted output/screenshots from a live OpenCode TUI are attached below.

## Status Summary

- **Automated gates:** tracked in `14-04-SUMMARY.md`.
- **Live TUI UAT:** BLOCKED / NOT PROVEN until a human runs the live OpenCode TUI checks and pastes evidence here.
- **Important limitation:** unit and integration tests can prove formatting, routing objects, monitor cadence, and control APIs, but they cannot prove visible parent TUI delivery in a real OpenCode runtime.

## 1. Success Notification Visible in Parent TUI

### Goal

Confirm a real `delegate-task` dispatch produces a visible parent-session notification after child completion.

### Setup

1. Start a real OpenCode TUI session with this plugin loaded.
2. From the parent session, invoke `delegate-task` with a short task that reports a concise result.
3. Keep the parent TUI visible until the delegated child reports completion.

### Expected Result

The parent prompt receives a `<system_reminder>` block similar to:

```text
<system_reminder>[DT:{delegationId}] ...</system_reminder>
```

The visible message must include enough data to identify:

- delegation ID
- delegated agent
- elapsed time and/or tool/action count
- completion status
- summary/result text
- timestamp or equivalent ordering context

### Evidence Paste Slot

```text
Paste parent TUI output here:

```

### Result

- [ ] PASS — visible in parent TUI
- [ ] FAIL — not visible
- [x] BLOCKED / NOT PROVEN — live OpenCode TUI evidence not collected in this subagent context

## 2. Progressive Injection Cadence Verification

### Goal

Verify long-running delegation progress/failure checkpoint injection follows the Phase 14 cadence without infinite spam.

### Live Steps

1. Dispatch a delegated task that runs long enough to observe status/failure checkpoints.
2. Observe whether status/injection events appear around the expected monitor cadence.
3. Confirm no repeated injection spam continues after final failure/stop conditions.

### Expected Cadence

- Progress/status observation cadence: `30s → 45s → 60s → 90s → 120s → 180s`
- Failure checkpoints: `60s → 120s → 180s → 300s`
- Auto-abort/no assistant message boundary: `600s`

### Evidence Paste Slot

```text
Paste timestamped TUI/session output here:

```

### Result

- [ ] PASS — cadence observed live
- [ ] FAIL — cadence incorrect or spam observed
- [x] BLOCKED / NOT PROVEN — live OpenCode TUI evidence not collected in this subagent context

## 3. Failure Checkpoint Behavior Verification

### Goal

Confirm a stalled/no-action delegation escalates through failure checkpoints and stops cleanly after final handling.

### Live Steps

1. Dispatch a task likely to stall or perform no observable action.
2. Observe failure checkpoint messages in the parent TUI.
3. Confirm final failure/auto-abort behavior is visible and does not corrupt the delegation record.
4. Query `delegation-status` for the delegation ID after failure.

### Expected Result

- Failure levels increase only when action count does not progress.
- Final failure is reported without endless injections.
- `delegation-status` reports a terminal or blocked state consistent with the observed failure.

### Evidence Paste Slot

```text
Paste failure checkpoint output and delegation-status output here:

```

### Result

- [ ] PASS — failure checkpoint behavior observed live
- [ ] FAIL — failure checkpoint behavior incorrect
- [x] BLOCKED / NOT PROVEN — live OpenCode TUI evidence not collected in this subagent context

## 4. Parent Routing / Two-Parent-Session Caveat

### Goal

Verify notification content from parent session A does not appear in parent session B when two parent sessions have active delegations.

### Caveat

Phase 14 research found the OpenCode SDK TUI append surface does not expose a historical `sessionID` target parameter for `tui.appendPrompt`. Routing can be tracked by delegation ID and parent session ID in Hivemind state, but live proof is still required to confirm the active TUI receives only the correct notification.

### Live Steps

1. Open two real OpenCode parent TUI sessions with the plugin loaded.
2. Start one delegation from parent A and one delegation from parent B.
3. Observe both parent TUI sessions through completion/failure.
4. Confirm no notification from A appears in B and no notification from B appears in A.

### Evidence Paste Slot

```text
Paste parent A output here:

Paste parent B output here:

```

### Result

- [ ] PASS — two-parent routing proven live
- [ ] FAIL — cross-parent notification leak observed
- [x] BLOCKED / NOT PROVEN — live two-parent OpenCode TUI evidence not collected in this subagent context

## 5. Unavailable-Runtime Fallback Statement

If a live OpenCode TUI runtime is unavailable, Phase 14 MUST NOT claim L1 runtime readiness. Mark live UAT as:

```text
BLOCKED / NOT PROVEN: live OpenCode TUI runtime evidence was not collected. Automated gates provide L2/L3 confidence only; visible parent TUI delivery and two-parent routing remain human UAT items.
```

## 6. Evidence Paste Slots

### Environment

```text
OpenCode version:
Plugin package/build version:
Command used to start TUI:
Date/time:
Operator:
```

### Successful Delegation Evidence

```text
Delegation ID:
Parent session ID:
Child/delegated session ID:
Observed parent TUI notification:
```

### Progressive / Failure Evidence

```text
Delegation ID:
Timestamped checkpoints:
Final state:
delegation-status output:
```

### Two-Parent Routing Evidence

```text
Parent A session ID:
Parent B session ID:
Delegation A ID:
Delegation B ID:
Observed routing result:
```

## Final Human Sign-Off

- [ ] Approved with pasted L1 evidence
- [ ] Failed — requires gap closure plan
- [x] Blocked / not proven in this subagent execution context
