---
phase: CP-DT-01
wave: 7
artifact: spec
date: 2026-05-18
status: draft-ready
evidence_level_required: L3 tests before merge, L1 runtime UAT before phase closure
---

# CP-DT-01 Wave 7 Spec — Runtime Orchestration

## Scope

Wave 7 dong cac runtime orchestration gaps con lai cua `delegate-task` sau Wave 6. Scope bao gom execution detection, polling/injection, result delivery, failure thresholds, control/resume, primitive discovery, va compact/endstream survival.

## Non-goals

- Khong thay the OpenCode native `task` tool.
- Khong them PTY/background command behavior vao `delegate-task`.
- Khong dua runtime state vao `.opencode/`.
- Khong claim live runtime proof neu chi co mock SDK/unit test.

## Requirements

### REQ-07-01 — First-action execution detection

Khi `delegate-task` dispatch child session, he thong phai ghi nhan trong vong 60 giay lieu child session co first tool/action/message execution signal hay khong.

Acceptance:

- Given SDK `promptAsync` accepted, When no tool/action/message execution signal appears by 60s, Then delegation state must include `executionState: "unconfirmed"` and a parent notification must be scheduled.
- Given first tool/action/message signal appears before 60s, Then delegation state must include `firstActionAt`, `executionState: "confirmed"`, va signal source.
- `promptAsync accepted` alone must not set `executionState: "confirmed"`.

### REQ-07-02 — Progressive polling and parent injection

Khi delegation dang chay, he thong phai poll/inject progress theo cadence: 30s, 45s, 60s, 90s, 120s, 180s.

Acceptance:

- Each cadence step must produce bounded progress summary or explicit no-progress summary.
- Parent notification must be delivered by available channel: `tui.appendPrompt` preferred, persisted pending notification fallback.
- TUI toast must fire when injection succeeds or when escalation threshold is crossed.

### REQ-07-03 — Failure thresholds

Khi child session khong co signal/result theo threshold, he thong phai escalate theo levels: 60s, 120s, 180s, 300s, 600s.

Acceptance:

- 60s: first-action warning.
- 120s: no-progress warning.
- 180s: parent intervention prompt.
- 300s: hard escalation with recommended abort/restart/redirect controls.
- 600s: terminal stalled state unless explicitly configured otherwise.

### REQ-07-04 — Completion and result extraction

Khi child session hoan thanh, he thong phai extract result summary va deliver ve parent.

Acceptance:

- Completion must require more than status-only when possible: assistant final message, tool/action count, or file-change evidence.
- Result payload must include `childSessionId`, `delegationId`, status, summary, final message excerpt, signals, and evidence level.
- Parent must receive result even if parent response stream already ended, via pending notification persistence and next-turn append.

### REQ-07-05 — Control and resume

`delegation-status` phai support clear status and control flows cho active/completed tasks.

Acceptance:

- `status` and backwards-compatible `get` must both return single delegation state.
- `list` must filter by status/category/session where available.
- `control.abort`, `control.cancel`, `control.restart`, `control.redirect` must preserve lineage and write audit metadata.
- Completed delegation must expose `continue` or `resume` path by `childSessionId` without losing child session context.

### REQ-07-06 — Slot isolation

He thong phai enforce toi da 10 active delegation slots per parent session.

Acceptance:

- Parent A and Parent B must have independent slot pools.
- The 11th active delegation for same parent must be rejected or queued according to configured queue policy.
- Completed/failed/cancelled delegations must release slots deterministically.

### REQ-07-07 — Primitive discovery

`delegate-task` phai validate agent availability against project and global OpenCode primitives.

Acceptance:

- Project `.opencode/agents` and `.opencode/agent` forms must be considered where present.
- Global OpenCode config directory must be considered when accessible.
- Missing agent errors must list searched scopes and safe remediation.

### REQ-07-08 — Compact/endstream survival

Delegation progress/result notifications must survive parent endstream and session compact.

Acceptance:

- Pending notification records must persist under `.hivemind/` state, not `.opencode/`.
- On next parent turn or compatible hook, pending records must be flushed once and marked delivered.
- Duplicate delivery must be prevented by idempotency key.

### REQ-07-09 — Deprecated overlap cleanup

Runtime code must not contain competing delegation paths that confuse ownership.

Acceptance:

- V2 coordinator/dispatcher/monitor ownership must be documented in code or module names.
- Legacy adapters must either delegate to canonical path or be marked deprecated with tests proving no production route depends on old behavior.
- Command delegation and PTY/background command lanes must remain separate.

## Evidence gates

- L3 required before code merge: focused Vitest tests for each requirement and `npm run typecheck`.
- L2 required before phase closure: integration test using real SDK client shape, not `context.task`.
- L1 required before final CP-DT-01 closure: live OpenCode UAT showing child session ID, first-action signal, parent injection/toast, result delivery, and one control/resume flow.

## Done definition

Wave 7 is done only when all REQ-07-01 through REQ-07-09 pass focused tests, typecheck passes, and runtime UAT blockers are recorded honestly with evidence level labels.
