---
phase: CP-DT-01
status: issues_found
review_depth: standard
reviewed: 2026-05-18T00:00:00Z
files_reviewed: 38
files_reviewed_list:
  - src/plugin.ts
  - src/coordination/completion/detector.ts
  - src/coordination/delegation/types.ts
  - src/coordination/delegation/dispatcher.ts
  - src/coordination/delegation/coordinator.ts
  - src/coordination/delegation/slot-manager.ts
  - src/coordination/delegation/agent-resolver.ts
  - src/coordination/delegation/monitor.ts
  - src/coordination/delegation/escalation-timer.ts
  - src/coordination/delegation/notification-router.ts
  - src/coordination/delegation/lifecycle.ts
  - src/coordination/delegation/retry-handler.ts
  - src/coordination/delegation/manager.ts
  - src/coordination/delegation/manager-runtime.ts
  - src/features/auto-loop/index.ts
  - src/features/auto-loop/types.ts
  - src/features/ralph-loop/index.ts
  - src/features/ralph-loop/types.ts
  - src/tools/delegation/delegate-task.ts
  - src/tools/delegation/delegation-status.ts
  - src/tools/delegation/types.ts
  - tests/integration/delegation-v2-integration.test.ts
  - tests/lib/coordination/completion/detector-v2.test.ts
  - tests/lib/coordination/delegation/agent-resolver.test.ts
  - tests/lib/coordination/delegation/coordinator.test.ts
  - tests/lib/coordination/delegation/dispatcher.test.ts
  - tests/lib/coordination/delegation/escalation-timer.test.ts
  - tests/lib/coordination/delegation/full-pipeline.test.ts
  - tests/lib/coordination/delegation/manager-decomposition.test.ts
  - tests/lib/coordination/delegation/notification-router.test.ts
  - tests/lib/coordination/delegation/slot-manager.test.ts
  - tests/lib/features/auto-loop.test.ts
  - tests/lib/features/ralph-loop.test.ts
  - tests/tools/delegation/delegate-task-e2e.test.ts
  - tests/tools/delegation/delegate-task-v2.test.ts
  - tests/tools/delegation/delegation-status-v2.test.ts
  - tests/tools/delegate-task.test.ts
  - tests/tools/delegation-status.test.ts
findings:
  critical: 6
  warning: 2
  info: 0
  total: 8
---

# CP-DT-01 Code Review

## Scope

Đã review đối kháng ở mức `standard` cho 38 file source/test CP-DT-01 được liệt kê trong frontmatter. Context chính đã đọc: `AGENTS.md`, CP-DT-01 `SPEC`, `PATTERN`, và các summary `01..05`. Đã kiểm tra `.claude/skills/` và `.agents/skills/`; không có skill directory project-local ở hai đường dẫn này.

Trọng tâm review: luồng dispatch/control của delegate-task v2, plugin wiring, completion detection, cleanup concurrency, persistence, behavior của status/control tool, và độ tin cậy của test. Review này không sửa source/test và không chạy lệnh verification; đây là kết quả inspection code.

## Findings

### CRITICAL CR-01 — `delegate-task` có thể báo success dù không start native Task

**File:** `src/tools/delegation/delegate-task.ts:77-84`

**Why it matters:** Sau khi `coordinator.dispatch()` register một delegation, việc execute native Task lại là optional: `const nativeTask = options.nativeTask ?? context.task; if (nativeTask) await nativeTask(...)`. Trong OpenCode custom-tool context thật, nếu không có `context.task` seam được inject, tool vẫn trả success với delegation ID dù không child task nào được start. Đây là tái hiện đúng failure mode của CP-DT-01: parent tin rằng delegation đã dispatch, nhưng execution không bắt đầu.

**Concrete remediation:** Xử lý thiếu native Task capability như hard error, hoặc trả response `pending`/instruction-only rõ ràng để không bị hiểu nhầm là đã execute. Ví dụ:

```ts
const nativeTask = options.nativeTask ?? context.task
if (!nativeTask) {
  return renderToolResult(error(
    "[Harness] delegate-task cannot start native Task: OpenCode task seam is unavailable."
  ))
}
```

Nếu fallback theo kiểu instruction-return là ý định thiết kế, hãy dùng envelope riêng như `pending`/`requires_native_task` và không register active delegation cho đến khi native execution được xác nhận.

### CRITICAL CR-02 — Native Task failure làm rò active delegation và giữ slot mãi mãi

**File:** `src/tools/delegation/delegate-task.ts:67-87`; `src/coordination/delegation/coordinator.ts:35-49,89-100`

**Why it matters:** `createDelegateTaskTool()` gọi `coordinator.dispatch()` trước khi invoke native Task. Nếu `nativeTask(...)` throw, catch chỉ trả error response nhưng không chạy cleanup. Coordinator đã tạo active record, register notification routing, start monitoring, cài dual-signal watcher, và acquire slot. Slot đó không được release, khiến delegation sau có thể bị chặn sai và stale status vẫn hiện ra.

**Concrete remediation:** Thêm rollback/fail path trong coordinator và gọi khi native Task dispatch fail. Rollback phải stop monitor, unwatch detector, deregister notifications, release slot, transition lifecycle sang `error`, persist terminal record, và remove active tracking.

```ts
try {
  await nativeTask({ agent: args.agent, prompt: args.prompt, disabledTools: ["delegate-task", "task"] })
} catch (err) {
  coordinator.failDispatch?.(result.delegationId, err)
  return renderToolResult(error(`[Harness] Native Task dispatch failed: ${message}`))
}
```

### CRITICAL CR-03 — Một `DelegationMonitor` dùng chung sẽ hủy monitoring của các delegation trước đó

**File:** `src/plugin.ts:125-130`; `src/coordination/delegation/monitor.ts:18-31,45-55`

**Why it matters:** `setupDelegationModules()` tạo một instance `DelegationMonitor` duy nhất và inject vào `DelegationCoordinator`. `DelegationMonitor.start()` gọi ngay `this.stop()`, xóa toàn bộ timer của instance dùng chung đó. Vì vậy dispatch delegation B sẽ stop polling/escalation của delegation A. `onCompletion()` của bất kỳ delegation nào cũng stop timer dùng chung. Điều này vi phạm yêu cầu CP-DT-01 cho tối đa 10 concurrent delegations với progress/escalation độc lập, và khiến child bị stall trước đó có thể mất timeout monitoring.

**Concrete remediation:** Chuyển monitoring state sang keyed-by-`delegationId`, hoặc tạo monitor riêng cho từng delegation. `stop()` và `onCompletion()` phải nhận delegation ID và chỉ clear timer của delegation đó.

```ts
class DelegationMonitor {
  private readonly pollingTimers = new Map<string, NodeJS.Timeout[]>()
  start(delegationId: string, parentSessionId: string): void { /* no global stop */ }
  stop(delegationId: string): void { /* clear only this id */ }
  onCompletion(delegationId: string): void { this.stop(delegationId) }
}
```

Thêm test start hai delegation, complete một delegation, và chứng minh polling/escalation timers của delegation còn lại vẫn active.

### CRITICAL CR-04 — V2 completion detector chưa được wire vào plugin session hooks

**File:** `src/plugin.ts:149,176,235-239`; `src/coordination/delegation/manager.ts:70-78`; `src/coordination/completion/detector.ts:91-113`

**Why it matters:** CP-DT-01 yêu cầu hook events (`session.idle`, `session.error`, `session.deleted`) feed completion detection. Plugin có tạo v2 `delegationModules.detector`, nhưng hook consumers chỉ route session idle/deleted qua `delegationManager.handleSessionIdle/handleSessionDeleted()`. Facade chỉ forward các method này đến legacy runtime adapter. Detector của v2 coordinator không bao giờ được signal, và không có mapping từ child session event thật sang `signalCompletionEvent()` / `signalTerminalStatus()`. V2 delegation có thể kẹt `dispatched` vô hạn dù child đã complete.

**Concrete remediation:** Wire session lifecycle events vào path v2 lifecycle/coordinator. Hook cần tìm v2 delegation theo child session ID, mark terminal lifecycle status, và signal detector của coordinator bằng delegation ID. Đồng thời phải lưu child session ID thật (xem CR-01/CR-02), không dùng delegation ID làm `childSessionId`.

```ts
handleSessionIdle(sessionId) {
  runtime?.handleSessionIdle(sessionId)
  v2Coordinator.handleSessionIdle?.(sessionId)
}
```

Thêm integration test trong đó plugin event `session.idle` complete một plugin-wired v2 delegation mà không gọi tay `coordinator.handleCompletion()`.

### CRITICAL CR-05 — Terminal persistence ghi đè các record đã completed trước đó bằng active records hiện tại

**File:** `src/coordination/delegation/coordinator.ts:89-100`

**Why it matters:** Trong cleanup, persistence ghi `[...]this.active.values()` trước khi xóa completed delegation khỏi `active`. Snapshot này loại bỏ các lifecycle records đã completed trước đó vì chúng không còn trong `active`. Khi delegation A complete, persistence ghi `[A]`; khi delegation B complete sau đó, persistence ghi `[B]`, xóa A khỏi durable delegation file. Điều này phá compact survival, status lookup sau cleanup, và audit history.

**Concrete remediation:** Persist source-of-truth của lifecycle/state-machine, không persist transient active map. Thêm `list()` vào coordinator dependency hoặc để lifecycle own persistence. Tối thiểu, tính snapshot sau khi update lifecycle và include toàn bộ lifecycle records.

```ts
const allRecords = this.deps.lifecycle.list?.() ?? [...this.active.values()].map(e => e.record)
void this.deps.retryHandler.persistWithRetry(allRecords)
```

Thêm regression test: complete hai delegation tuần tự và assert persistence write thứ hai chứa cả hai terminal records.

### CRITICAL CR-06 — Control actions của `delegation-status` không cleanup coordinator resources và không thật sự restart/redirect native execution

**File:** `src/tools/delegation/delegation-status.ts:155-166`; `src/coordination/delegation/manager.ts:101-110`

**Why it matters:** Abort/cancel gọi lifecycle mutation trực tiếp, nhưng không stop coordinator monitor, không unwatch detector, không deregister notifications, không release slot, và không persist qua coordinator cleanup. Restart/redirect còn nghiêm trọng hơn: không abort/cancel original delegation trước, không link old/new records, và chỉ gọi `coordinator.dispatch()` — status tool này không invoke native Task seam, nên replacement delegation có thể được register mà không execute. Với real records, `prompt` không được lưu trên `Delegation`, nên restart/redirect có thể dispatch prompt rỗng.

**Concrete remediation:** Đưa control actions vào một coordinator/manager control API có đầy đủ cleanup và native dispatch semantics. Status tool chỉ nên là schema/authorization boundary mỏng.

```ts
await delegationManager.controlDelegation({
  delegationId,
  action,
  redirectAgent,
  restartPrompt,
  callerSessionId: sessionID,
})
```

Control API phải: reject terminal records, abort/terminate child khi cần, release slots, stop timers, persist terminal original, và với restart/redirect phải invoke cùng native Task path của delegate-task hoặc trả explicit non-executed instruction state.

### WARNING WR-01 — Tests assert manual coordinator completion thay vì plugin hook completion

**File:** `tests/integration/delegation-v2-integration.test.ts:44-46`; `tests/lib/coordination/delegation/full-pipeline.test.ts:61-68`

**Why it matters:** Integration tests complete v2 delegations bằng cách gọi trực tiếp `modules.coordinator.handleCompletion(...)` hoặc detector methods. Cách này bypass production plugin hook path, nơi `session.idle/deleted` events phải flow từ `src/plugin.ts` vào v2 completion. Đây là lý do CR-04 không bị bắt. Các test này tạo false confidence về runtime integration.

**Concrete remediation:** Thêm plugin-level test dispatch qua registered `delegate-task` tool, emit plugin event `session.idle` với child session ID, và assert status tool báo `completed` mà không gọi trực tiếp coordinator.

### WARNING WR-02 — Control-action tests không assert resource cleanup hoặc replacement execution

**File:** `tests/tools/delegation/delegation-status-v2.test.ts:75-108`; `tests/tools/delegation/delegate-task-e2e.test.ts:34-44`

**Why it matters:** Tests chỉ assert lifecycle methods được gọi hoặc coordinator dispatch mới được attempt. Chúng không verify slot release, monitor stop, detector unwatch, notification deregistration, original record terminal linkage, hoặc native Task invocation cho restart/redirect. Vì vậy CR-06 không được test bao phủ.

**Concrete remediation:** Mở rộng control tests để dùng harness thật với `SlotManager`/`DelegationCoordinator`, chạy abort/cancel/restart/redirect, và chứng minh: slot cũ được release, monitor cũ stopped, original record terminal, replacement native Task được invoke, và replacement record được link với original.

## Residual Risks

- CP-DT-01 summaries nói rõ live OpenCode native Task UAT vẫn còn thiếu. Code được review có nhiều điểm nơi mocked tests có thể pass dù native Task execution/completion thật chưa được wire.
- `manager-runtime.ts` vẫn 504 LOC, vượt project cap 500 LOC. Đây chủ yếu là legacy relocation, nhưng vẫn vi phạm module-size guideline nếu cap được enforce cơ học.
- `delegate-task` v2 dùng injected/optional native Task seam nhưng real OpenCode availability chưa được chứng minh trong code. Nên xem L1 runtime readiness là blocked cho đến khi live UAT verify seam này.

## Verification Notes

- Reviewer không chạy verification commands; artifact này là inspection-only.
- Không sửa source/test files.
- Verification khuyến nghị sau khi fix:
  - `npm run typecheck`
  - `npx vitest run tests/tools/delegation/ tests/lib/coordination/delegation/ tests/integration/delegation-v2-integration.test.ts --reporter=verbose`
  - A live OpenCode native Task smoke/UAT proving actual child execution and hook-driven completion.
