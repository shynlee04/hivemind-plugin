# CP-ST-05-03-PLAN: Quarantine Protocol + Monolith Refactor

**Wave:** 3/3
**Requirements:** R-CP05-05, R-CP05-06

## Tasks

### Task 1: Quarantine Protocol (TDD)
**File:** `src/features/session-tracker/persistence/orphan-quarantine.ts`

**What:** Move orphan directories to quarantine instead of deleting, with manifest verification.

**Test First:**
```typescript
// Test: Orphan moved to quarantine, not deleted
it('moves orphan directory to quarantine', async () => {
  const quarantine = new OrphanQuarantine({ trackerRoot: '/tmp/test' })
  await quarantine.quarantineOrphan('orphan-session-id')
  
  expect(fs.existsSync('/tmp/test/orphan-session-id')).toBe(false)
  expect(fs.existsSync('/tmp/test/quarantine/orphan-session-id')).toBe(true)
})

// Test: Session in manifest is NOT quarantined
it('skips session registered in hierarchy manifest', async () => {
  // Test implementation
})
```

**Implementation:**
- `OrphanQuarantine` class with `quarantineOrphan()`, `isInManifest()`, `cleanupOld()` methods
- Quarantine directory: `.hivemind/session-tracker/quarantine/`
- Manifest check: read `hierarchy-manifest.json` before quarantining
- Auto-cleanup: remove quarantined entries older than 7 days

### Task 2: Extract bootstrap.ts from index.ts (TDD)
**File:** `src/features/session-tracker/bootstrap.ts`

**What:** Extract session initialization logic from `index.ts` (1,035 LOC → target <300 LOC).

**Implementation:**
- Move `ensureSessionReady()`, `initialize()`, `getSessionSafely()` to `bootstrap.ts`
- Move `copyForkedChildren()`, `getSessionChildren()` to `bootstrap.ts`
- Update imports in `index.ts`

### Task 3: Extract classification.ts from index.ts (TDD)
**File:** `src/features/session-tracker/classification.ts`

**What:** Extract remaining classification logic from `index.ts`.

**Implementation:**
- Move `handleChatMessage()`, `handleToolExecuteAfter()` classification paths
- Move `pollForChildSessions()` (to be replaced by Gate 0)
- Update imports in `index.ts`

### Task 4: Extract orphan-cleanup.ts from index.ts (TDD)
**File:** `src/features/session-tracker/orphan-cleanup.ts`

**What:** Extract orphan cleanup logic and integrate with quarantine protocol.

**Implementation:**
- Move `cleanupOrphanedSessions()` to `orphan-cleanup.ts`
- Integrate with `OrphanQuarantine` class
- Update imports in `index.ts`

## Verification

- [ ] `npm run typecheck` passes
- [ ] `npx vitest run tests/features/session-tracker/` passes
- [ ] `index.ts` < 300 LOC
- [ ] `event-capture.ts` < 300 LOC
- [ ] All existing tests pass
- [ ] Quarantine directory created and functional
