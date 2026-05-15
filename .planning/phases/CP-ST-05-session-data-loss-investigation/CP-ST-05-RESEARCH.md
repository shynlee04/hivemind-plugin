# CP-ST-05 RESEARCH: Classification Logic Audit & Data Loss Scenarios

**Date:** 2026-05-15
**Researcher:** hm-l3-detective + hm-l3-deep-research

## Classification Logic Audit

### Current Code Paths (DUPLICATE — DRY Violation)

| Path | File | Lines | Gates | Result if All Fail |
|------|------|-------|-------|-------------------|
| A | `event-capture.ts:handleSessionCreated()` | 181-263 | SDK parentID (100ms×2), hierarchyIndex, pendingRegistry | Creates orphan directory + .md |
| B | `index.ts:ensureSessionReady()` | 142-235 | SDK parentID (100ms×2), hierarchyIndex, pendingRegistry | Creates orphan directory + .md |

### Gate Failure Analysis

| Gate | Failure Mode | Probability | Impact |
|------|-------------|-------------|--------|
| SDK parentID | `session.created` fires before SDK records parentID | HIGH | Child classified as MAIN |
| hierarchyIndex | No one called `registerChild()` before session.created | HIGH | Child classified as MAIN |
| pendingRegistry | Key mismatch: `call:${callID}` vs `childSessionID` | MEDIUM (partially fixed in CP-ST-04) | Child classified as MAIN |

### Data Loss Scenarios

| Scenario | Trigger | Data Lost | Recovery Possible? |
|----------|---------|-----------|-------------------|
| 1 | Child classified as MAIN → orphan directory created → cleanup deletes | Tool calls, results, assistant messages | NO (files deleted) |
| 2 | Child classified as MAIN → .md file written → no .json fallback | Session journey | NO (wrong format) |
| 3 | L2 child (grandchild) classified as MAIN → separate directory | Delegation chain broken | NO (hierarchy lost) |

## Architecture Violations

### CONCERNS.md Items Requiring Immediate Action

1. **1,035 LOC Monolith** (`index.ts`) — Must split into:
   - `bootstrap.ts` — session initialization logic
   - `classification.ts` — BEFORE-THE-FACT classification
   - `child-session-poller.ts` — polling logic (to be replaced)
   - `orphan-cleanup.ts` — cleanup with quarantine
   - `hierarchy-manifest.ts` — manifest management

2. **512 LOC Event Capture** (`event-capture.ts`) — Must split into:
   - `session-created-handler.ts` — classification + immediate .json write
   - `session-event-handler.ts` — idle/deleted/error events
   - `journey-recorder.ts` — tool call/result/message recording

3. **Race Condition** — 100ms retry loop is FUNDAMENTALLY FLAWED:
   - Cannot guarantee parentID availability
   - Creates orphan directories as side effect
   - Must be replaced with BEFORE-THE-FACT classification

4. **Dual Classification Paths** — DRY violation:
   - Both `handleSessionCreated()` and `ensureSessionReady()` duplicate logic
   - Must consolidate into single classification authority

## Proposed Architecture

### BEFORE-THE-FACT Classification Flow

```
Task tool fires (PreToolUse)
→ Classification decision: "This will create a child session"
→ Write classification record to pendingRegistry
→ Session created → session.created fires
→ Check classification record FIRST
→ If classified as child: write .json immediately, skip directory creation
→ If classified as main: create directory + .md file
```

### Immediate .json Write for Children

```typescript
// When child session is confirmed (L1 or L2):
const childFile = {
  sessionID,
  parentSessionID,
  delegationDepth: 1, // or 2 for L2
  status: "active",
  journey: [], // tool calls, results, assistant messages
  created: timestamp,
}
// Write to root main session directory: {rootMainID}/{sessionID}.json
```

### Quarantine Protocol

```
Orphan detected → Check hierarchy-manifest.json
→ If in manifest: NOT orphan, skip
→ If not in manifest: move to quarantine/ directory
→ Keep for 7 days before permanent deletion
→ Log audit trail
```

## Next Steps

1. Create SPEC.md with detailed requirements
2. Create PLAN.md with TDD tasks
3. Execute with gsd-executor agents
