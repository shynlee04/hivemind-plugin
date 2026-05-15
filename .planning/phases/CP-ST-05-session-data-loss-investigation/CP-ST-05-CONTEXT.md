# CP-ST-05 CONTEXT: Session Data Loss Investigation & Prevention

**Created:** 2026-05-15
**Trigger:** User report of lost session journeys — tool calls, results, assistant messages vanished after orphan cleanup
**Severity:** CRITICAL — data loss of session history

## Problem Statement

Session-tracker cleanup logic deletes orphan directories containing `.md` files with session journeys (tool calls, results, assistant message summaries). When a child session is incorrectly classified as MAIN, it:
1. Creates its own subdirectory
2. Writes journey to `.md` file (like main sessions do)
3. Cleanup logic later detects it as orphan → deletes entire directory
4. **All session history lost** — no `.json` fallback exists

## Evidence

### Live Evidence (project-continuity.json)
- `ses_1d4724bbcffefdRCvUQ2HQSiYi` recorded with `dir: "ses_1d4724bbcffefdRCvUQ2HQSiYi/"` and `mainFile: "ses_1d4724bbcffefdRCvUQ2HQSiYi.md"`
- Directory no longer exists on disk — cleanup deleted it
- No `.json` file exists under parent directory as fallback
- **Total data loss** for this session's journey

### Architecture Violations (CONCERNS.md)
1. **LOC Violation:** `index.ts` 1,035 LOC, `event-capture.ts` 512 LOC — both exceed 500 LOC cap
2. **Race Condition:** `setTimeout(r, 100)` retry loop for SDK parentID timing
3. **Fire-and-Forget Recovery:** `void delegationManager.recoverPending()` — no error handling
4. **Sync I/O on Hot Paths:** 165+ synchronous `fs` calls
5. **Polling-Based Detection:** Long-running timers per session
6. **No Structured Error Types:** 81 `new Error('[Harness] ...')` throws
7. **No Request Tracing:** No correlation IDs across operations

### Root Cause Chain
```
SDK timing issue → parentID not available → classification fails → child gets MAIN treatment
→ creates orphan directory + .md file → cleanup detects orphan → deletes directory
→ NO .json fallback written → session journey permanently lost
```

## CONCERNS.md Violations Summary

| Concern | Severity | Status |
|---------|----------|--------|
| Session Tracker 1,035 LOC monolith | Critical | Unfixed |
| Race condition in bootstrap (setTimeout 100ms) | Critical | Partially mitigated |
| Fire-and-forget recovery at startup | High | Unfixed |
| Sync filesystem I/O on hot paths (165+ calls) | High | Unfixed |
| Polling-based child detection | Medium | Unfixed |
| No structured error types (81 throw sites) | Medium | Unfixed |
| No request/operation tracing | Medium | Unfixed |
| No rate limiting on tool calls | Low | Unfixed |

## Decisions

### D-CP05-01: Quarantine Before Delete
Orphan directories MUST be moved to quarantine (`.hivemind/session-tracker/quarantine/`) before deletion, preserving `.md` files for recovery.

### D-CP05-02: Dual-Write During Transition
Until classification is 100% reliable, session journeys must be written to BOTH `.md` (for main sessions) AND `.json` (for all sessions) simultaneously.

### D-CP05-03: Cleanup Requires Manifest Verification
Orphan cleanup MUST check `hierarchy-manifest.json` before deleting any directory. If the session is registered in any manifest, it is NOT an orphan.

### D-CP05-04: Refactor Monolith Required
`index.ts` (1,035 LOC) and `event-capture.ts` (512 LOC) MUST be split into modules under 300 LOC each before further feature additions.

## Next Steps
1. Research: Full audit of cleanup logic and data loss scenarios
2. Spec: Quarantine protocol + dual-write strategy
3. Plan: Refactor monolith + implement safeguards
4. Execute: Implement fixes with TDD
5. Verify: Integration tests for cleanup safety
