---
status: testing
phase: 02-auto-hooks-governance-mesh
source: [02-01-SUMMARY.md, 02-02-SUMMARY.md, 02-03-SUMMARY.md, 02-04-SUMMARY.md]
started: 2026-02-12T13:51:25Z
updated: 2026-02-12T13:51:25Z
---

## Current Test

number: 1
name: Turn-0 guidance appears immediately
expected: |
  In a fresh session, governance guidance appears from the first turn.
  You should not need to trigger extra warnings before seeing guidance context.
awaiting: user response

## Tests

### 1. Turn-0 guidance appears immediately
expected: In a fresh session, governance guidance appears from the first turn without waiting for warning conditions.
result: [pending]

### 2. Permissive mode stays informational
expected: In permissive mode, navigation/context hints remain visible, while warning-pressure escalation language stays suppressed.
result: [pending]

### 3. Idle drift toasts escalate
expected: Repeated idle/stale situations escalate toast severity from warning to error.
result: [pending]

### 4. Toast cooldown prevents spam
expected: Re-triggering the same governance condition quickly does not flood duplicate toasts during cooldown.
result: [pending]

### 5. Compaction toast remains info-only
expected: Compaction notices always render as informational feedback, never warning or error severity.
result: [pending]

### 6. IGNORED-tier triage is actionable
expected: At IGNORED escalation, guidance includes compact reason + current phase/action context + a concrete recovery command.
result: [pending]

### 7. Dual-framework conflict requires explicit choice
expected: When both GSD and Spec-kit markers exist, conflict guidance requires explicit framework-selection metadata before normal implementation flow is considered resolved.
result: [pending]

### 8. Conflict handling is simulated, not hard deny
expected: In strict conflict paths, messaging indicates pause/limited mode with rollback guidance, but plugin behavior remains non-hard-blocking.
result: [pending]

### 9. GSD phase goal is pinned in context
expected: When GSD roadmap phase is active, injected governance context prominently shows the active phase goal.
result: [pending]

### 10. Acknowledgment downgrades before full reset
expected: Acknowledging guidance reduces escalation pressure first, while full reset only happens after prerequisite completion.
result: [pending]

## Summary

total: 10
passed: 0
issues: 0
pending: 10
skipped: 0

## Gaps

[none yet]
