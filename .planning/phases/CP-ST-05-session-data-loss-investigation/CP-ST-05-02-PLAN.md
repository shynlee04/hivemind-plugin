# CP-ST-05-02-PLAN: Single Classification Authority + Journey Recording

**Wave:** 2/3
**Requirements:** R-CP05-03, R-CP05-04

## Tasks

### Task 1: Remove Duplicate Classification from ensureSessionReady (TDD)
**File:** `src/features/session-tracker/index.ts`

**What:** Remove all classification logic from `ensureSessionReady()`. It should ONLY bootstrap root main sessions that already exist in project-continuity.json.

**Test First:**
```typescript
// Test: ensureSessionReady does NOT classify child sessions
it('ensureSessionReady skips child sessions even when SDK parentID is null', async () => {
  const tracker = new SessionTracker({ ... })
  tracker.pendingRegistry.recordClassification({
    parentSessionID: 'parent-123',
    sessionId: 'child-456',
    delegationDepth: 1
  })
  
  await tracker.ensureSessionReady('child-456')
  
  expect(sessionWriter.createSessionDir).not.toHaveBeenCalled()
})
```

**Implementation:**
- Remove Gates 1-3 from `ensureSessionReady()`
- Only check: is this session already in project-continuity.json?
- If yes: skip (already bootstrapped)
- If no: create directory (root main session only)

### Task 2: Journey Recording for Child Sessions (TDD)
**File:** `src/features/session-tracker/capture/event-capture.ts`

**What:** Record tool calls, results, and assistant messages to child session `.json` files.

**Test First:**
```typescript
// Test: Tool call in child session recorded to journey
it('records tool execute to child session journey', async () => {
  const capture = new EventCapture({ ... })
  await capture.recordToolExecute({
    sessionId: 'child-456',
    toolName: 'Read',
    input: { path: '/test' },
    timestamp: Date.now()
  })
  
  const childFile = await readJson('/tmp/test/root-main/child-456.json')
  expect(childFile.journey).toHaveLength(1)
  expect(childFile.journey[0].type).toBe('tool_call')
})
```

**Implementation:**
- Add `recordToolExecute()`, `recordToolResult()`, `recordAssistantMessage()` methods
- Each method appends to journey array in child `.json` file
- Use atomic rename pattern for safety

### Task 3: Journey Recording for Main Sessions (TDD)
**File:** `src/features/session-tracker/capture/event-capture.ts`

**What:** Ensure main session `.md` files also record journey entries consistently.

**Test First:**
```typescript
// Test: Tool call in main session recorded to journey
it('records tool execute to main session journey', async () => {
  // Similar test for main sessions
})
```

**Implementation:**
- Unified journey recording interface
- Main sessions: append to `.md` file (existing behavior)
- Child sessions: append to `.json` journey array (new behavior)

## Verification

- [ ] `npm run typecheck` passes
- [ ] `npx vitest run tests/features/session-tracker/` passes
- [ ] ensureSessionReady no longer classifies child sessions
- [ ] Journey entries recorded for both main and child sessions
