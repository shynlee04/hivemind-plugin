# Testing Report — Compaction Event Logging

**Scope:** Compaction hook → consolidated session JSON events array
**Test File Created:** `tests/integration/compaction-consolidated.test.ts`

## Test Suites

| Suite | Tests | Passing | Failing | Coverage |
|-------|-------|---------|---------|----------|
| compaction-consolidated | 1 | 0 | 1 | RED phase |

## Test Execution

```
$ npx tsx --test tests/integration/compaction-consolidated.test.ts

✖ logs compaction event to events array (15.68ms)
ℹ tests 1
ℹ pass 0
ℹ fail 1

TypeError: handleCompaction is not a function
    at TestContext.<anonymous> (compaction-consolidated.test.ts:43:9)
```

## Edge Cases Covered

| Case | Test | Status |
|------|------|--------|
| Session file created with compaction event | logs compaction event to events array | ✗ FAIL (RED) |

## What the Test Verifies

When `handleCompaction` fires with SDK input:
- Session file is created at `.hivemind/sessions/{sessionId}.json`
- `events` array has exactly 1 entry
- `events[0].type` equals `'compaction'`

## Why It Fails (Correct RED Behavior)

`src/hooks/compaction-handler.ts` exports `createCompactionJournalHandler` (factory) but does NOT export a standalone `handleCompaction(input, output, projectRoot)` function. The integration test imports the non-existent function, producing:

```
TypeError: handleCompaction is not a function
```

## GREEN Phase Requirements

Add to `src/hooks/compaction-handler.ts`:
```typescript
export async function handleCompaction(
  input: { sessionID: string },
  output: { context: string[]; prompt?: string },
  projectRoot: string
): Promise<void> {
  const sessionId = input.sessionID
  if (!sessionId) return

  const sessionsDir = join(projectRoot, '.hivemind', 'sessions')
  await mkdir(sessionsDir, { recursive: true })

  // Create session if not exists, then add event
  // Pattern: handleTextComplete in text-complete-handler.ts
}
```

## Gaps

- Existing compaction-handler.test.ts asserts markdown (`## compaction`) but handler writes JSON — stale
- No vitest installed in project; `text-complete-consolidated.test.ts` imports vitest (broken)
