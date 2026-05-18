# Phase 14: Wire Monitor/Notification into DelegationManager.dispatch — Context

**Phase:** 14-wire-monitor-notification-into-delegationmanager-dispatch-cl
**Date:** 2026-05-19
**Domain:** Tự động hóa giám sát delegation, thông báo TUI, failure checkpoints, và control tools

---

## Domain

Phase này cung cấp hệ thống giám sát tự động cho delegate-task — thay thế polling thủ công bằng progressive injection cadence (30→45→60→90→120→180s), failure checkpoint detection (60→120→180→300s), TUI notification delivery, và delegation control tools (abort/cancel/restart/resume/chain/adjust-prompt/change-agent). Mục tiêu: async delegation có kiểm soát trong khi delegator vẫn rảnh tay điều phối luồng chính với users.

## Spec Lock

SPEC.md đã lock 8 requirements. Không re-ask WHAT — chỉ capture HOW decisions.

## Decisions

### 1. Monitor Wiring: Inline trong Dispatch Path
- **Decision:** Gọi `monitor.start()` trực tiếp trong `manager-runtime.ts` sau khi `sendPromptAsync()` resolve thành công.
- **Rationale:** Đơn giản, dễ test, dễ trace. Codebase đã có partial wiring — chỉ cần hoàn thiện.
- **Impact:** `DelegationMonitor.start(delegationId, parentSessionId)` được gọi từ dispatch path, không qua hook infrastructure.

### 2. Failure Checkpoint Detection: Real-time Hooks + Progressive Injection
- **Decision:** Dùng `tool.execute.after` hook để đếm tool calls real-time (in-memory counter). Monitor đọc counter tại các checkpoint.
- **Injection cadence:** 30s → 45s → 60s → 90s → 120s → 180s
- **Injection format:** Thin-line status — session ID, delegated agent, status, tool/bash/skill/action counts. Minimal, deterministic.
- **Failure logic:**
  - 60s: Failure level 1 nếu action count không thay đổi so với baseline (0)
  - 120s: Failure level 2 nếu action count không thay đổi so với level 1
  - 180s: Failure level 3 (hard failure) nếu action count không thay đổi so với level 2
  - 300s: Failure level 4 (final) → **STOP injecting** sau mức này
- **Post-300s behavior:** Nếu tools vẫn ghi nhận action mới → stop observing (task phức tạp). Nếu sau thêm 300s (total 600s) vẫn không có assistant last message → auto-abort.
- **Session-tracker knowledge:** Áp dụng từ `.hivemind/session-tracker/` cho accurate tracking.

### 3. TUI Notification Delivery: Direct Append với System Header
- **Completion detection = 3 conditions:**
  1. Tools running >1 phút
  2. Assistant last message exists (summary/report từ agent)
  3. File changes detected (nếu task mutate files/artifacts)
- **Success notification format:** System header + delegation ID + summary + result + path + timestamp + file changes
- **Delivery mechanism:**
  - Main session live → append trực tiếp vào TUI (no queue)
  - Session ended → send message + resume session
- **Failure notification:** 2 cấp — (a) executed-running-fail, (b) fail từ threshold
- **Routing:** Notification append vào đúng parent session trong số 10 slots

### 4. Control Tools: Full Suite + Resume/Chain
- **Tools:** abort, cancel, restart, adjust-prompt, change-agent, resume, chain
- **Resume logic:** Nếu level 1 success (tools đã chạy) → resume với existing session ID, context bảo tồn, prompt đơn giản, có thể đổi agent name
- **Chain logic:** Append new task vào completed delegation's session → L0/L1 agents có context từ task trước, không hallucinate
- **Design principle:** Không delegate lại phiên mới nếu session đã chạy — resume với session ID cũ để bảo tồn context

### 5. Session Slot Management: 10 Slots per Main Session
- **Decision:** Track active delegations per `parentSessionId`. Reject dispatch khi 10 slots active.
- **Routing:** Notifications append vào đúng parent session — tránh lạc sang session khác đang vận hành song song.

### 6. Escalation-Timer Rewrite
- **Decision:** Xóa hoàn toàn logic WARN→NUDGE→ALERT→TERMINATE. Viết lại thành progressive injection + failure checkpoint detector.
- **New file:** `progressive-monitor.ts` hoặc refactor `escalation-timer.ts` thành `failure-checkpoint.ts`

### 7. Notification Router Integration
- **Decision:** `notificationRouter.register(delegationId, parentSessionId)` gọi sau delegation registration.
- **Format:** `<system_reminder>` block cho OpenCode compatibility.

## Canonical Refs

- `14-SPEC.md` — Locked requirements (8 items)
- `src/coordination/delegation/manager-runtime.ts` — Dispatch path, partial monitor wiring
- `src/coordination/delegation/manager.ts` — Public facade
- `src/coordination/delegation/monitor.ts` — Current monitor (cần refactor)
- `src/coordination/delegation/escalation-timer.ts` — Design sai, cần viết lại
- `src/coordination/delegation/notification-router.ts` — TUI notification routing
- `src/coordination/delegation/completion-detector.ts` — Completion detection
- `src/coordination/delegation/types.ts` — Delegation contracts
- `.hivemind/session-tracker/` — Session tracking knowledge
- `src/plugin.ts` — Hook registration (`tool.execute.after`)

## Code Context

### Reusable Assets
- `DelegationMonitor` class — cần refactor cho progressive injection
- `NotificationRouter` class — cần wire vào dispatch path
- `CompletionDetector` — dual-signal pattern, cần extend cho 3-condition logic
- `tool.execute.after` hook — đã registered, dùng cho real-time action counting
- `session.messages()` API — parse `Message[]` và `Part[]` để đếm tool calls

### Patterns
- Inline wiring trong dispatch path (không qua hooks)
- In-memory counter cho real-time action tracking
- `<system_reminder>` block cho TUI notifications
- Session ID preservation cho resume/chain operations

## Deferred Ideas

- Sidecar/dashboard UI — belongs to Q2 sidecar phase
- Cross-session delegation chaining across different parent sessions — only same-parent chain supported
- PTY/background-command delegation — belongs to CP-PTY phases

## Folded Todos

(none)

## Reviewed Todos

(none)

---

*Phase: 14-wire-monitor-notification-into-delegationmanager-dispatch-cl*
*Context created: 2026-05-19*
*Next step: /gsd-plan-phase 14 — implementation planning với decisions đã lock*
