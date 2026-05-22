---
phase: 21-session-tracker-design-fix
type: hotfix
status: pending-live-verification
date: 2026-05-21
commits:
  - 5690b670
linked_debug_session: session-hierarchy-deleg
---

## Hotfix: Gate 0 pendingCount > 1 bail — double classification

### Bug
When main session delegates 2+ tasks consecutively via task tool (1-2s apart), `handleSessionCreated()` Gate 0 bailed at `pendingCount > 1` guard (`event-capture.ts:181-189`). Consumed `session.created` without classification → child written as root directory.

### Fix applied (5690b670)
- Removed `pendingCount === 1` ternary guard
- Removed `pendingCount > 1` bail
- Replaced with single `getAnyActiveEntry()` call — classifies as child whenever `byParent.size > 0`
- Falls through to SDK retry + Gates 2/3 for defense-in-depth

### Verification status
- [x] Unit tests pass (445 session-tracker tests)
- [x] Full regression pass (2371 tests)
- [ ] LIVE TEST — user needs to run real runtime scenario with rapid delegations
- [ ] Confirm no orphan root directories created
- [ ] Confirm child .json files contain correct tracking data

**DO NOT close this until live-test is confirmed by user.**
