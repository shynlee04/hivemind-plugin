# Session Inspection Export

- ses_id: `ses_2de4198c6ffeEqnNUBWBLcXA1y`
- prepared_at: `2026-03-24T21:30:01.310Z`

## Assistant Output

## Testing Report

**Status:** `completed`
**TDD Phase:** RED — test fails for missing behavior

### Test File Created
- `tests/hooks/session-idle-handler.test.ts`

### Test Execution
| Suite | Tests | Passing | Failing | Runner |
|-------|-------|---------|---------|--------|
| `handleSessionIdleEvent` | 1 | 0 | 1 | vitest |

### Failure Evidence
```
TypeError: handleSessionIdleEvent is not a function
  ❯ tests/hooks/session-idle-handler.test.ts:55:11
```

### What the Test Verifies (GREEN target)
When `handleSessionIdleEvent` is exported from `src/hooks/event-handler.ts`:
1. Creates/loads session file at `.hivemind/sessions/{sessionId}.json`
2. Appends `{ type: 'session.idle' }` to the `events` array
3. Real file system, no mocks

### Delegation Output
`.hivemind/activity/delegation/phase-p4b-test6-red.json`

### Next Action
**GREEN phase:** Export `handleSessionIdleEvent(event, projectRoot)` from `src/hooks/event-handler.ts` that writes `session.idle` to the session's events array via `addEvent` from `consolidated-writer.ts`.