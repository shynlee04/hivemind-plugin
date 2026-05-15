# CP-ST-05 CONTEXT: Session Data Loss Investigation & Prevention

**Created:** 2026-05-15
**Trigger:** User report of lost session journeys — tool calls, results, assistant messages vanished
**Severity:** CRITICAL — data loss of session history, architecture violations

## Problem Statement (CORRECTED)

**Vấn đề KHÔNG PHẢI là "orphan bị xóa" — mà là classification logic HOÀN TOÀN SAI.**

Child sessions (L1, L2) **KHÔNG BAO GIỜ được tạo directory**. Chúng phải:
1. Ghi trực tiếp vào `.json` files dưới root main session directory
2. Phân cấp rõ ràng L1 hay L2 (vì L1 có thể delegate sâu thêm tới L2)
3. Bắt đầu ghi nhận live journey ngay khi session được tạo (tool calls, results, assistant messages)

Nhưng hiện tại:
- Classification logic dựa vào 3 gates (SDK parentID, hierarchyIndex, pendingRegistry)
- **Tất cả 3 gates đều là RACE CONDITIONS** — có thể fail đồng thời
- Khi cả 3 gates fail → child bị classify là MAIN → tạo orphan directory + `.md` file
- Cleanup logic sau đó phát hiện orphan → XÓA directory → **MẤT VĨNH VIỄN session journey**

## Root Cause Analysis

### Code Path 1: `event-capture.ts:handleSessionCreated()` (lines 181-263)
```typescript
// Gate 1: SDK parentID — 100ms retry loop (2 attempts)
// Gate 2: hierarchyIndex.isChild() — chưa ai register
// Gate 3: pendingRegistry.has() — key mismatch bug
// → All fail → creates orphan directory + .md file
```

### Code Path 2: `index.ts:ensureSessionReady()` (lines 142-235)
```typescript
// Gate 1: SDK parentID — 100ms retry loop (2 attempts)  
// Gate 2: hierarchyIndex.isChild() — chưa ai register
// Gate 3: pendingRegistry.has() — key mismatch bug
// → All fail → creates orphan directory + .md file
```

### Race Condition Chain
```
Task tool fires → Session created → session.created event fires
→ SDK parentID chưa có sẵn (race với task tool completion)
→ hierarchyIndex chưa được populate (chưa ai gọi registerChild)
→ pendingRegistry key mismatch (call:${callID} vs childSessionID)
→ Cả 3 gates FAIL → Child bị classify là MAIN
→ Tạo orphan directory + viết journey vào .md file
→ Cleanup logic phát hiện orphan → XÓA directory
→ KHÔNG có .json fallback → MẤT VĨNH VIỄN session history
```

## Evidence

### Live Evidence (project-continuity.json)
- `ses_1d4724bbcffefdRCvUQ2HQSiYi` recorded with `dir: "ses_1d4724bbcffefdRCvUQ2HQSiYi/"` and `mainFile: "ses_1d4724bbcffefdRCvUQ2HQSiYi.md"`
- Directory no longer exists on disk — cleanup deleted it
- No `.json` file exists under parent directory as fallback
- **Total data loss** for this session's journey

### Architecture Violations (CONCERNS.md)
1. **LOC Violation:** `index.ts` 1,035 LOC, `event-capture.ts` 512 LOC — both exceed 500 LOC cap
2. **Race Condition:** `setTimeout(r, 100)` retry loop for SDK parentID timing — FUNDAMENTAL FLAW
3. **Fire-and-Forget Recovery:** `void delegationManager.recoverPending()` — no error handling
4. **Sync I/O on Hot Paths:** 165+ synchronous `fs` calls
5. **Polling-Based Detection:** Long-running timers per session
6. **No Structured Error Types:** 81 `new Error('[Harness] ...')` throws
7. **No Request Tracing:** No correlation IDs across operations
8. **Two Classification Paths:** Both `handleSessionCreated()` and `ensureSessionReady()` duplicate logic — DRY violation

## CONCERNS.md Violations Summary

| Concern | Severity | Status |
|---------|----------|--------|
| Session Tracker 1,035 LOC monolith | Critical | Unfixed |
| Race condition in bootstrap (setTimeout 100ms) | Critical | **FUNDAMENTAL FLAW** |
| Dual classification paths (DRY violation) | Critical | Unfixed |
| Fire-and-forget recovery at startup | High | Unfixed |
| Sync filesystem I/O on hot paths (165+ calls) | High | Unfixed |
| Polling-based child detection | Medium | Unfixed |
| No structured error types (81 throw sites) | Medium | Unfixed |
| No request/operation tracing | Medium | Unfixed |
| No rate limiting on tool calls | Low | Unfixed |

## Decisions

### D-CP05-01: BEFORE-THE-FACT Classification
Classification MUST happen at PreToolUse time (BEFORE session is created), not after session.created fires. The task tool handler knows it's creating a child session — this information must be captured IMMEDIATELY.

### D-CP05-02: Single Classification Authority
Only ONE code path should classify sessions. Remove duplicate logic between `handleSessionCreated()` and `ensureSessionReady()`. Single source of truth.

### D-CP05-03: Immediate .json Write for ALL Children
When a child session is created (L1 or L2), it MUST:
1. Write `.json` file immediately under root main session directory
2. Track delegation depth (L1 vs L2)
3. Begin recording journey (tool calls, results, assistant messages) to the .json file
4. NEVER create a directory

### D-CP05-04: Quarantine Before Delete
Orphan directories MUST be moved to quarantine (`.hivemind/session-tracker/quarantine/`) before deletion, preserving `.md` files for recovery.

### D-CP05-05: Refactor Monolith Required
`index.ts` (1,035 LOC) and `event-capture.ts` (512 LOC) MUST be split into modules under 300 LOC each before further feature additions.

### D-CP05-06: Hierarchy Manifest as Authority
`hierarchy-manifest.json` in each root main directory is the authoritative source for session tree. Cleanup MUST check manifest before deleting anything.

## Next Steps
1. **Research:** Full audit of classification logic and data loss scenarios
2. **Spec:** BEFORE-THE-FACT classification protocol + immediate .json write
3. **Plan:** Refactor monolith + implement safeguards
4. **Execute:** Implement fixes with TDD
5. **Verify:** Integration tests for classification safety + cleanup quarantine
