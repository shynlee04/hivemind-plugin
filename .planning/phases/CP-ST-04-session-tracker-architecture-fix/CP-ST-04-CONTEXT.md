# Phase CP-ST-04: Session-Tracker Architecture Fix — Context

**Created:** 2026-05-13
**Status:** Research complete → Proceeding to SPEC
**Root cause:** PendingDispatchRegistry key mismatch (`call:${callID}` vs `childSessionID`)

## Root Cause Summary

`PendingDispatchRegistry.add()` stores entries keyed by `call:${parentCallID}` but `has()` queries by `childSessionID`. The bridge `updateWithChildID()` only fires after a 200ms polling loop discovers the child — too late. The synchronous `session.created` event arrives before the registry is bridged, causing Gate 3 to fail. Child session classified as MAIN → orphan directory created.

## Decisions

### D-01: BEFORE-THE-FACT Classification (Not Polling)

**Decision:** When `tool.execute.before` fires for `tool === "task"`, the system MUST pre-classify the expected child as a sub-session BEFORE the SDK creates it. This requires:
- A `PreDispatchRegistry` entry at PreToolUse time with the parent's `callID`
- The classification decision is made at PreToolUse — the session WILL be a child
- No polling needed — the decision is architectural, not discovered

### D-02: Directory Creation — Turn 1 Only

**Decision:** A session gets its own directory ONLY when:
- The session has a real user turn (turnCount === 1 from user message, NOT tool delegation)
- The session is classified as ROOT (no parent session)

All tool-delegated sessions (task tool) are ALWAYS children — stored as `.json` files under their **ROOT** main session's directory. Not under immediate parent (L1 has no dir).

### D-03: Root Main Session — Canonical Directory Owner

**Decision:** All sub-sessions (L1 child, L2 grandchild) are stored as `{childSessionID}.json` files directly under the ROOT main session's directory. The root main session is the canonical directory owner for the entire delegation tree.

Example:
```
.hivemind/session-tracker/
├── project-continuity.json
├── ses_ROOT123/                          ← L0 main (has dir, user turn 1)
│   ├── ses_ROOT123.md
│   ├── session-continuity.json
│   ├── ses_CHILD456.json                 ← L1 child (.json, not dir)
│   └── ses_GRANDCHILD789.json            ← L2 grandchild (.json, not dir)
```

### D-04: Fix PendingDispatchRegistry Key Structure

**Decision:** Add a reverse lookup — `parentCallID → Set<childSessionID>` — so `has(childSessionID)` can check all pending entries regardless of key. Or simpler: index by `parentSessionID` directly at PreToolUse time, since we know the parent session.

### D-05: Classify Before Directory Creation

**Decision:** All code paths that call `ensureSessionReady()` (which creates directories) MUST check classification FIRST. If the session is classified as a child, skip directory creation entirely. Classification happens in:
1. `handleChatMessage()` — checks before calling `ensureSessionReady()`
2. `handleSessionCreated()` — checks before writing session files
3. `ensureSessionReady()` — internally checks before `mkdir`

### D-06: Immediate I/O for Child Sessions

**Decision:** Child session `.json` files must be written immediately when the child session is created — not deferred. The `session.created` handler must write the child `.json` file under the root main directory synchronously (or as close to synchronous as async allows).

### D-07: Strict Hierarchy Manifest

**Decision:** A `hierarchy-manifest.json` in the root main session directory tracks:
- All children (L1, L2, ...) with parent references
- Status of each child (active, completed, error, aborted, cancelled)
- Turn counts per child
- Delegation depth

This manifest is the authoritative source for the session tree — replacing ad-hoc gate decisions.

### D-08: Resume Logic

**Decision:** Only root main sessions can be resumed. Children exist only within their main session context. When a main session resumes, the hierarchy manifest is loaded and child sessions are reconstructed from their `.json` files.

## Non-Goals

- Do NOT change OpenCode SDK behavior
- Do NOT add new npm dependencies
- Do NOT change the public API of session-tracker tools
- Do NOT remove the existing gate system — overlay the BEFORE-THE-FACT classification on top

## References

- `.hivemind/planning/session-tracker-gap-audit-2026-05-13/research.md` — root cause analysis
- `src/features/session-tracker/index.ts` — `ensureSessionReady()`, `handleChatMessage()`
- `src/features/session-tracker/capture/event-capture.ts` — `handleSessionCreated()`
- `src/features/session-tracker/persistence/pending-dispatch-registry.ts` — key mismatch
- `src/hooks/transforms/tool-before-guard.ts` — PreToolUse hook
