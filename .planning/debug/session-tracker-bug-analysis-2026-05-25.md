# Session Tracker Bug Analysis Report
# Phase 23.2 — Surgical Remediation
# Date: 2026-05-25

## Executive Summary

**Critical Finding**: Session tracker ghi lại bị FAIL vì 4 root causes đã được confirm qua live UAT. File `session-1a56.md` (manual export) so sánh với file ghi lại cho thấy **last message của assistant MISSING** và **requirements không được ghi liên tiếp** do 4 bugs:

1. **Bug D** — Actor attribution fail (agent name, model empty)
2. **Bug A** — Root `.md` `children: []` never populated
3. **Bug C** — Manifest `turnCount: 0` for all children
4. **Bug B** — Compaction summary "unavailable" for children

---

## Comparison: Manual Export vs Session Tracker Output

### File Comparison

| File | Manual Export | Session Tracker | Status |
|------|---------------|-----------------|--------|
| `session-ses_1a56.md` | ✅ EXISTS (~500+ lines) | ❌ NOT FOUND | **MISSING** |

### Content Analysis

#### Manual Export (`session-ses_1a56.md`)
- **Last message**: Assistant response present with full context
- **Requirements**: All 5 REQs from SPEC documented (REQ-23.2-01 through REQ-23.2-05)
- **Turns**: ~15 turns recorded with proper actor attribution
- **Children**: 1 child session (`ses_1a568fc64ffewzaevtVCfDic5Z`) properly tracked
- **Turn count**: Child shows 15 turns in manifest

#### Session Tracker Output (`.hivemind/session-tracker/...`)
- **Last message**: **NOT RECORDED** in tracked session
- **Requirements**: **NOT PRESENT** in session file
- **Turns**: Only 1 turn recorded (turn 19)
- **Children**: Child exists in `hierarchy-manifest.json` but root `.md` `children: []`
- **Turn count**: Child shows `turnCount: 0` despite 15 actual turns

---

## Root Cause Analysis

### Bug D: Actor Attribution Fail (CRITICAL)

**Root Cause**: `child-recorder.ts:105` và `:120` sử dụng `input.agent` và `input.model` từ hook payload — **payload này KHÔNG CÓ** delegation metadata.

**Evidence**:
- `hierarchy-manifest.json`: Child entry has `"delegatedBy": { "agentName": "gsd-code-reviewer", "model": "", "subagentType": "gsd-code-reviewer" }`
- Child `.json` turns show `"actor": "unknown"` and `"model": ""`

**File Locations**:
- `src/features/session-tracker/child-recorder.ts:105` — `actor: input.agent || "unknown"`
- `src/features/session-tracker/child-recorder.ts:120` — `model: input.model || ...`

**Fix Required**: Propagate delegation context from `writeImmediateChildFile` to `childWriter.setChildDelegationContext()` (Plan 1, Plan-Remediation:105-120)

---

### Bug A: Root `.md` Children Array Never Populated (HIGH)

**Root Cause**: **NO CODE PATH** updates root `.md` frontmatter `children` array after initialization to `[]`.

**Evidence**:
- `hierarchy-manifest.json`: Contains child `ses_1a568fc64ffewzaevtVCfDic5Z`
- Root `.md` (if exists): `children: []`

**File Locations**:
- `src/features/session-tracker/capture/event-capture.ts:306-410` — `updateFrontmatter` calls only update status/lastMessage, never children
- `src/features/session-tracker/persistence/session-writer.ts:213` — `updateFrontmatter` method

**Fix Required**: Add `addChildRef()` method to `session-writer.ts` and call from `event-capture.ts:522` after `manifestWriter.addChild()` (Plan 2, Plan-Remediation:98-125)

---

### Bug C: Manifest turnCount Always 0 (MEDIUM)

**Root Cause**: `hierarchy-manifest.ts:84` và `:204` hardcode `turnCount: 0` — **no code path updates it**.

**Evidence**:
- Child `.json` has 15 turns in `turns` array
- `hierarchy-manifest.json` child entry: `"turnCount": 0`

**File Locations**:
- `src/features/session-tracker/persistence/hierarchy-manifest.ts:84` — `addChild()` hardcodes turnCount
- `src/features/session-tracker/persistence/hierarchy-manifest.ts:204` — `generateFromContinuity()` hardcodes turnCount

**Fix Required**: Add `updateTurnCount()` method and call after each `appendChildTurn` (Plan 3, Plan-Remediation:158-202)

---

### Bug B: Compaction Shows "Summary Unavailable" (MEDIUM)

**Root Cause**: `resolveCompactionFromMessages` fails for child sessions because SDK message API operates on parent context; no fallback to child `.json`.

**Evidence**:
- Session shows `"**Compaction occurred — summary unavailable.**\n"` in journey

**File Locations**:
- `src/features/session-tracker/capture/event-capture.ts:764-793` — `resolveCompactionFromMessages`

**Fix Required**: Add fallback to read child `.json` and extract last assistant turn (Plan 4, Plan-Remediation:216-272)

---

## Why Last Message Not Recorded

**Direct Cause**: Session tracker only records turns when events fire through the capture hooks. But:

1. **Context injection**: TUI shows `[DT:dt-1779636306831-dkwu9r] 🔄 running` — this IS a context injection
2. **Hook payload**: The `input` object in hooks lacks the delegation context (agent name, model)
3. **Event timing**: The session may have ended before all turns were flushed to the tracker

**Root Cause Chain**:
```
delegate-task dispatch
  ↓
Context injection (TUI notification)
  ↓
Hook fires with empty input.agent / input.model
  ↓
ChildRecorder uses "unknown" / "" as fallback
  ↓
Turn recorded with wrong attribution
  ↓
Session completes
  ↓
Last message NOT captured (hook didn't fire for final assistant turn)
```

---

## Why Requirements Not Recorded Continuously

**Direct Cause**: Session tracker is **EVENT-DRIVEN**, not **STATE-DRIVEN**. It only records:
- Tool calls (via `ToolCaptureHook`)
- Messages (via `MessageCaptureHook`)
- Session lifecycle events (via `SessionHook`)

**Missing**: No mechanism to record:
- Requirements from user prompt
- Continuous state updates
- Cross-session context propagation

**Root Cause**: The session tracker was designed to capture **tool and message events**, not **semantic content** like requirements. The `input` object contains raw tool/message data, not extracted requirements.

---

## Fix Recommendations

### Priority 1: Bug D — Actor Attribution (CRITICAL)
**Impact**: Without correct actor attribution, session history is meaningless for audit/compliance.

**Implementation**:
1. Modify `pending-dispatch-registry.ts:218` — Don't remove on PostToolUse, extend TTL
2. Add `setChildDelegationContext()` to `child-writer.ts`
3. Update `child-recorder.ts:105` and `:120` to use propagated context

### Priority 2: Bug A — Root Children Array (HIGH)
**Impact**: Root `.md` is unreliable for determining child sessions.

**Implementation**:
1. Add `addChildRef()` to `session-writer.ts`
2. Call from `event-capture.ts:522` after child creation

### Priority 3: Bug C — Turn Count (MEDIUM)
**Impact**: Manifest doesn't reflect actual progress.

**Implementation**:
1. Add `updateTurnCount()` to `hierarchy-manifest.ts`
2. Call after each turn append

### Priority 4: Bug B — Compaction Summary (MEDIUM)
**Impact**: Compaction history is lost for children.

**Implementation**:
1. Add `readChildData()` to `child-writer.ts`
2. Fallback in `resolveCompactionFromMessages()`

---

## Verification Plan

### Automated Tests
```bash
npm run typecheck    # Must pass
npm test             # All 454+ tests must pass
```

### Live UAT
1. Start root session
2. Dispatch child via `delegate-task`
3. Let child complete 3-5 turns
4. Verify:
   - Root `.md` `children` array populated ✅
   - `hierarchy-manifest.json` `turnCount` matches actual turns ✅
   - Child turns show correct `actor` (not "unknown") ✅
   - Child turns show correct `model` (not empty) ✅
   - Compaction shows real summary (not "unavailable") ✅

---

## Conclusion

The session tracker bug is **NOT a single bug** but **4 interconnected bugs** in the capture system:

1. **Missing state propagation** (Bug D) — Delegation context not passed to hooks
2. **Missing state mutation** (Bug A) — No code updates root `.md` children array
3. **Missing state update** (Bug C) — No code updates turn count
4. **Missing fallback** (Bug B) — No fallback for child session compaction

**All 4 must be fixed** for session tracker to work correctly. The fixes are outlined in `PLAN-REMEDIATION-2026-05-24.md` and follow a wave-based approach (Plan 1, 2, 3 in Wave 1; Plan 4 in Wave 2, depends on Plan 1).

**Next Steps**:
1. Execute Plan 1 (Bug D) — Registry race + actor attribution
2. Execute Plan 2 (Bug A) — Root children array
3. Execute Plan 3 (Bug C) — Turn count
4. Execute Plan 4 (Bug B) — Compaction summary
5. Verify all 5 SPEC requirements pass

---

## Files Involved

| File | Changes | Plan |
|------|---------|------|
| `src/features/session-tracker/persistence/pending-dispatch-registry.ts` | Stop premature removal | 1 |
| `src/features/session-tracker/persistence/child-writer.ts` | Add delegation context methods | 1, 4 |
| `src/features/session-tracker/persistence/hierarchy-manifest.ts` | Add updateTurnCount() | 3 |
| `src/features/session-tracker/capture/event-capture.ts` | Propagate delegation context | 1, 4 |
| `src/features/session-tracker/capture/child-recorder.ts` | Use propagated context | 1 |
| `src/features/session-tracker/persistence/session-writer.ts` | Add addChildRef() | 2 |
| `src/features/session-tracker/types.ts` | No changes needed | - |
