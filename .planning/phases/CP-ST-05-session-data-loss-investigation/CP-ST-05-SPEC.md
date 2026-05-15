# CP-ST-05 SPEC: Session Data Loss Prevention

**Date:** 2026-05-15
**Phase:** CP-ST-05
**Depends On:** CP-ST-04 (COMPLETE)

## Requirements

### R-CP05-01: BEFORE-THE-FACT Classification
**SHALL** classify sessions as child or main BEFORE `session.created` event fires, using PreToolUse hook detection.

**Acceptance Criteria:**
- [ ] Task tool handler records classification intent in pendingRegistry BEFORE dispatch
- [ ] `session.created` handler checks classification FIRST, before any directory creation
- [ ] No directory created for sessions classified as child
- [ ] Test: 100 consecutive child sessions → 0 directories created

### R-CP05-02: Immediate .json Write for Children
**SHALL** write child session `.json` file immediately upon `session.created`, under root main session directory.

**Acceptance Criteria:**
- [ ] L1 children: `{rootMainID}/{childID}.json` with `delegationDepth: 1`
- [ ] L2 children: `{rootMainID}/{childID}.json` with `delegationDepth: 2`
- [ ] File contains: sessionID, parentSessionID, delegationDepth, status, journey array, timestamps
- [ ] Test: Child session created → .json file exists within 1 second

### R-CP05-03: Journey Recording for All Sessions
**SHALL** record tool calls, results, and assistant messages to session files for ALL sessions (main and child).

**Acceptance Criteria:**
- [ ] Main sessions: journey recorded in `.md` file (existing behavior)
- [ ] Child sessions: journey recorded in `.json` file (new behavior)
- [ ] Journey entries include: timestamp, type (tool_call/tool_result/assistant_message), content
- [ ] Test: Tool call in child session → journey entry appears in .json

### R-CP05-04: Single Classification Authority
**SHALL** have exactly ONE code path responsible for session classification.

**Acceptance Criteria:**
- [ ] Remove duplicate classification logic from `ensureSessionReady()`
- [ ] `handleSessionCreated()` is the ONLY classification path
- [ ] Test: No directory created by `ensureSessionReady()` for child sessions

### R-CP05-05: Quarantine Protocol
**SHALL** move orphan directories to quarantine before deletion, with manifest verification.

**Acceptance Criteria:**
- [ ] Orphan detection checks `hierarchy-manifest.json` first
- [ ] Orphans moved to `.hivemind/session-tracker/quarantine/`
- [ ] Quarantine entries logged with timestamp and reason
- [ ] Test: Orphan detected → moved to quarantine, not deleted

### R-CP05-06: Monolith Refactor
**SHALL** split `index.ts` (1,035 LOC) and `event-capture.ts` (512 LOC) into modules under 300 LOC.

**Acceptance Criteria:**
- [ ] `index.ts` < 300 LOC
- [ ] `event-capture.ts` < 300 LOC
- [ ] New modules: `bootstrap.ts`, `classification.ts`, `orphan-cleanup.ts`, `hierarchy-manifest.ts`
- [ ] All existing tests pass
- [ ] Test: `npm run typecheck` passes with zero errors

## Non-Requirements

- Does NOT address sync I/O on hot paths (separate phase)
- Does NOT address structured error types (separate phase)
- Does NOT address request tracing (separate phase)

## Evidence Level

- **L2:** Unit tests for classification logic
- **L3:** Integration tests for session creation flow
- **L4:** Live session test with tool delegation
