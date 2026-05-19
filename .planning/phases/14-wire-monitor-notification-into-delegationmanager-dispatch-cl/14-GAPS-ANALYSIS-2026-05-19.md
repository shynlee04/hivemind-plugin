# Phase 14: Gap Analysis — Spec vs. Implementation

**Date:** 2026-05-19
**Source:** Code review của 8 spec requirements + context decisions + yêu cầu gốc của người dùng
**Evidence:** `src/coordination/delegation/*.ts`, `src/tools/delegation/*.ts`, `src/plugin.ts`, `session-ses_1c50.md`

---

## Tổng quan

Phase 14 đã implement được ~65% spec requirements. Còn **3 CRITICAL gaps**, **2 MEDIUM gaps**, **2 MINOR gaps** cần khắc phục trước khi live UAT có ý nghĩa.

---

## CRITICAL GAPS

### GAP-C1: True Session Resume (Requirement 5)

| | |
|---|---|
| **Spec yêu cầu** | "resume với existing session ID, context bảo tồn, prompt đơn giản, có thể đổi agent name" |
| **Implementation hiện tại** | `manager.ts:167-173`: `controlDelegation("resume")` → abort old delegation → dispatch **new** child session với ID khác |
| **Vấn đề** | Resume tạo session mới, mất context. Chain cũng abort+dispatch chứ không append vào session cũ. |
| **File** | `src/coordination/delegation/manager.ts:158-195` |

**Yêu cầu fix:** Resuming một delegation có `executionState === "confirmed"` (tools đã chạy) phải:
1. Dùng lại `childSessionId` của delegation cũ
2. Gửi prompt mới vào session đó (qua `sendPromptAsync`)
3. Bảo tồn context từ task trước
4. Cập nhật record mới với `resumedFrom: delegation.id`

---

### GAP-C2: Session-Ended Delivery + Resume (Requirement 3)

| | |
|---|---|
| **Spec yêu cầu** | "nếu main session đã end stream nó sẽ gởi message đi và resume session" |
| **Implementation hiện tại** | `plugin.ts:160-166`: `deliver` chỉ gọi `appendTuiPrompt` + `showTuiToast`. Nếu session ended → delivery returns false → `NotificationRouter.queuePending()` persist vào continuity. **Không code path nào check pending notifications khi session resume.** |
| **Vấn đề** | Session `ses_1c50` chứng minh: research hoàn thành, file tạo ra, nhưng **không có notification nào gửi về main session**. Main session ended stream → pending notification ở continuity → không ai đọc lại. |
| **File** | `src/plugin.ts:100-127` (persistPendingDelegationNotifications), `src/task-management/continuity/index.ts` |

**Yêu cầu fix:** 
1. `route()` cần phát hiện nếu parent session ended (delivery failed)
2. Tạo recovery mechanism: khi plugin init hoặc session resume → replay pending notifications
3. Gửi message resume vào main session nếu cần

---

### GAP-C3: Rich Notification Missing Fields (Requirement 3)

| | |
|---|---|
| **Spec yêu cầu** | "block thông báo kết quả của phiên delegation … task …. tóm tắt …. result… path…. được đọc tại… timestamp - file changes:…" |
| **Implementation hiện tại** | `notification-formatter.ts:31-36`: `formatDelegationNotification` chỉ có delegationId, agent, duration, toolCount, summaryPreview |
| **Vấn đề** | Thiếu: (1) `workingDirectory`/path, (2) file changes indicators, (3) explicit timestamp trong notification text. Người dùng không biết file kết quả ở đâu. |
| **File** | `src/coordination/delegation/notification-formatter.ts:31-36` |

**Yêu cầu fix:** Bổ sung vào `formatDelegationNotification`:
- `path` — working directory hoặc file path
- `fileChanges` — danh sách file đã modified (từ completion-detector)
- `timestamp` — explicit thời gian hoàn thành

---

## MEDIUM GAPS

### GAP-M1: Chain-Append to Completed Session (Requirement 5)

| | |
|---|---|
| **Spec yêu cầu** | "hoàn toàn có thể chủ động tạo một task mới nối tiếp các completed task bằng cách sử dụng lại session id cũ" |
| **Implementation hiện tại** | `coordinator.ts:220-237`: `chain()` tạo sequential delegations mới. `manager.controlDelegation(action:"chain")` abort+dispatch. **Không có "append to completed session" nào.** |
| **Vấn đề** | Chain action mất context của completed task. Orchestrator/coordinator phải re-send context. |
| **File** | `src/coordination/delegation/coordinator.ts:220-237` |

**Yêu cầu fix:** Tương tự GAP-C1: chain cần append prompt vào child session cũ (đã completed) thay vì tạo session mới.

---

### GAP-M2: Adjust-Prompt / Change-Agent Tools (Requirement 5)

| | |
|---|---|
| **Spec yêu cầu** | "abort/cancel và restart và điều chỉnh prompt, thay đổi agents" |
| **Implementation hiện tại** | 5 actions: abort, cancel, restart, resume, chain. **Không có adjust-prompt, không có change-agent.** |
| **Vấn đề** | Restart có restartPrompt workaround nhưng mất context. Change-agent không tồn tại. |
| **File** | `src/tools/delegation/delegation-status.ts:11-16` (DelegationControlSchema) |

**Yêu cầu fix:** Thêm 2 actions `adjust-prompt` và `change-agent` vào DelegationControlSchema.
- `adjust-prompt`: gửi prompt bổ sung vào child session đang running (qua `sendPromptAsync`)
- `change-agent`: abort + restart với agent mới (nhưng giữ session ID nếu runtime cho phép)

---

### GAP-M3: Tools-running >1min vs. Last-tool-idle >60s (Requirement 4)

| | |
|---|---|
| **Spec yêu cầu** | "có tools ghi nhận chạy ở phía trên và chạy được trên 1 phút" |
| **Implementation hiện tại** | `completion-detector.ts:17`: `DEFAULT_TOOL_IDLE_MS = 60_000` — kiểm tra **last tool activity cách đây >60s**, không phải **tools đã chạy tổng >1 phút** |
| **Vấn đề** | 6 tool calls trong 10s rồi idle → trigger completion dù tools chưa chạy >1 phút. Khớp spec một phần nhưng semantics khác. |
| **File** | `src/coordination/delegation/completion-detector.ts:17,191-204` |

**Yêu cầu fix:** Thêm `totalToolActivityDuration` tracking. Completion chỉ trigger khi:
1. `lastToolActivity > idleThreshold` (current)
2. **VÀ** `totalToolActivityDuration > 60000` (new: tổng thời gian tools active)

---

## MINOR GAPS

### GAP-N1: Redundant TUI Toast (Requirement 3)

| | |
|---|---|
| **Spec yêu cầu** | Notification append trực tiếp vào TUI |
| **Implementation** | `plugin.ts:162-164`: append TUI prompt + show TUI toast "Delegation ${type} delivered" |
| **Vấn đề** | Toast thông báo "delivered" là noise — system_reminder block đã notify rồi. Có thể gây confusion. |
| **Fix** | Bỏ toast hoặc đổi thành debug-level log. |

---

### GAP-N2: No Pending Notification Replay on Session Start

| | |
|---|---|
| **Spec yêu cầu** | (implied by "ghi nhận thông báo append TUI message") |
| **Implementation** | `persistPendingDelegationNotifications` ghi vào continuity nhưng **không ai đọc pendingNotifications khi session start** |
| **Vấn đề** | Session resume không nhận được pending notifications từ session trước |
| **Fix** | Thêm plugin init path: check continuity.pendingNotifications → replay vào TUI |

---

## Boundary Check: delegate-task vs. Các Chức Năng Khác

| Chức năng | delegate-task | native task tool | background-command | PTY-command | slash-command |
|---|---|---|---|---|---|
| **Cơ chế** | OpenCode SDK child-session | OpenCode native subagent | headless shell (node:child_process) | PTY shell (bun-pty) | OpenCode TUI prompt |
| **Mục đích** | Async delegation có kiểm soát, monitoring, notification | Delegation đơn giản không monitoring | Chạy CLI command background | Chạy interactive shell | Chạy lệnh OpenCode |
| **Monitoring** | ✅ Progressive polling 30→45→60→90→120→180s | ❌ Không | ❌ Output polling | ❌ Output polling | N/A |
| **Failure detection** | ✅ 60→120→180→300s checkpoint | ❌ | ❌ | ❌ | N/A |
| **Notification** | ✅ TUI system_reminder | ❌ | ❌ | ❌ | N/A |
| **Control tools** | ✅ abort, cancel, restart, resume, chain | ❌ | ✅ terminate | ✅ terminate | N/A |
| **Context preservation** | ✅ Session ID tracking | ❌ Mới mỗi lần | N/A | N/A | N/A |
| **SDK integration** | ✅ sendPromptAsync, session.messages() | ✅ Native | ❌ | ❌ (Bun-only) | ✅ |

**Kết luận:** delegate-task **không chồng chéo** với native task, background-command, PTY, hay slash-command. Mỗi cái có domain riêng:
- `delegate-task` = **async agent delegation có kiểm soát** (monitoring, failure detection, notification, resume/chain)
- `task` native tool = **fire-and-forget subagent** (không monitoring)
- `background-command` = **CLI execution** (không agent)
- `PTY` = **interactive shell** (Bun-only, không agent)
- `slash-command` = **OpenCode built-in commands** (không delegation)

---

## Tổng hợp: Phase 14 Delivery Score

| Requirement | Status | Evidence |
|---|---|---|
| R1: Automatic Progressive Polling | ✅ DONE | monitor.ts:89-114, POLLING_CADENCE |
| R2: Failure Checkpoint Detection | ✅ DONE | escalation-timer.ts, monitor.ts:107-111,116-127 |
| R3: TUI Notification Delivery | ⚠ PARTIAL (C2, C3) | plugin.ts:160-166, notification-formatter.ts |
| R4: Completion Detection | ⚠ PARTIAL (M3) | completion-detector.ts |
| R5: Delegation Control Tools | ⚠ PARTIAL (C1, M1, M2) | manager.ts:158-195, delegation-status.ts |
| R6: Session Slot Management | ✅ DONE | slot-manager.ts:42-48 (maxSlots=10) |
| R7: Remove Deprecated Code | ✅ DONE | Verified grep results |
| R8: OpenCode SDK Research | ✅ DONE | RESEARCH.md |

**Tổng: 4/8 DONE, 4/8 PARTIAL**

---

## Khuyến nghị Phase 15

Phase 15 nên tập trung vào **3 CRITICAL gaps**:

1. **15-01: True Session Resume + Chain-Append** (fix C1, M1)
   - Resume/reuse child session ID thay vì tạo mới
   - Chain append vào completed session
   
2. **15-02: Session-Ended Delivery + Pending Replay** (fix C2, N2)
   - Detect parent session ended
   - Replay pending notifications when session resumes
   - Optionally resume parent session

3. **15-03: Rich Notifications + Tools Duration** (fix C3, M2, M3)
   - Thêm path, fileChanges, timestamp vào notification
   - Thêm adjust-prompt, change-agent
   - totalToolActivityDuration tracking

Không cần phase mới cho: GAP-N1 (toast noise) — fix trong 1 dòng.
