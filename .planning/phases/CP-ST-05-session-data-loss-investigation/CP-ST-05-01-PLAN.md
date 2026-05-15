# CP-ST-05-01-PLAN: BEFORE-THE-FACT Classification + Immediate .json Write

**Wave:** 1/3
**Requirements:** R-CP05-01, R-CP05-02

## Tasks

### Task 1: PreToolUse Classification Hook (TDD)
**File:** `src/hooks/transforms/session-classification-hook.ts`

**What:** Create a PreToolUse hook that detects when task tool is about to fire and records classification intent.

**Test First:**
```typescript
// Test: Task tool fires → classification recorded
it('records child classification before task tool dispatch', async () => {
  const registry = new PendingDispatchRegistry()
  const hook = createSessionClassificationHook(registry)
  
  await hook.onPreToolUse({
    toolName: 'Task',
    sessionId: 'parent-123',
    input: { subagentType: 'general', prompt: 'do work' }
  })
  
  expect(registry.hasPendingClassification('parent-123')).toBe(true)
})
```

**Implementation:**
- Hook intercepts Task tool calls
- Records: parentSessionID, expectedChildSessionID (if known), delegationDepth
- Writes to pendingRegistry with TTL (5 minutes)

### Task 2: Update handleSessionCreated to Check Classification First (TDD)
**File:** `src/features/session-tracker/capture/event-capture.ts`

**What:** Modify `handleSessionCreated()` to check classification record BEFORE any other gate.

**Test First:**
```typescript
// Test: Child session with classification record → no directory created
it('writes .json immediately when classification record exists', async () => {
  const registry = new PendingDispatchRegistry()
  registry.recordClassification({
    parentSessionID: 'parent-123',
    expectedChildSessionID: 'child-456',
    delegationDepth: 1
  })
  
  const capture = new EventCapture({ ..., pendingRegistry: registry })
  await capture.handleSessionCreated('child-456')
  
  expect(sessionWriter.createSessionDir).not.toHaveBeenCalled()
  expect(childWriter.createChildFile).toHaveBeenCalledWith('parent-123', 'child-456', ...)
})
```

**Implementation:**
- New Gate 0: Check pendingRegistry for classification record
- If found: write .json immediately, skip directory creation
- If not found: proceed to existing gates (SDK, hierarchyIndex, pendingRegistry)

### Task 3: Immediate .json Write with Delegation Depth (TDD)
**File:** `src/features/session-tracker/persistence/child-writer.ts`

**What:** Extend `createChildFile()` to include delegation depth and journey array.

**Test First:**
```typescript
// Test: L1 child has delegationDepth: 1
it('writes L1 child with delegationDepth 1', async () => {
  const writer = new ChildWriter({ rootDir: '/tmp/test' })
  await writer.createChildFile('parent-123', 'child-456', {
    delegationDepth: 1,
    subagentType: 'general'
  })
  
  const file = await readJson('/tmp/test/parent-123/child-456.json')
  expect(file.delegationDepth).toBe(1)
})

// Test: L2 child has delegationDepth: 2
it('writes L2 child with delegationDepth 2', async () => {
  // Similar test for L2
})
```

**Implementation:**
- Add `delegationDepth` field to child file schema
- Add `journey: []` array for recording tool calls/results/messages
- Resolve root main directory for file placement (use HierarchyIndex)

## Verification

- [ ] `npm run typecheck` passes
- [ ] `npx vitest run tests/features/session-tracker/` passes
- [ ] New tests cover classification-first flow
- [ ] No directories created for child sessions in integration test
