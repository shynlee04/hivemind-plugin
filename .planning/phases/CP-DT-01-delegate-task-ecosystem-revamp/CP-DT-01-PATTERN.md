<!-- generated-by: gsd-doc-writer -->
# CP-DT-01: Delegate-Task Ecosystem Revamp — Pattern Catalog

**Ngày:** 2026-05-18
**Phase:** CP-DT-01
**Tài liệu tiền đề:** CP-DT-01-CONTEXT.md, CP-DT-01-RESEARCH.md

---

## 1. Giới thiệu

Tài liệu này định nghĩa **10 design patterns** cho hệ sinh thái delegate-task v2. Mỗi pattern giải quyết một bài toán cụ thể được phát hiện qua phân tích CONTEXT.md (bằng chứng lỗi v1, god-object analysis) và RESEARCH.md (native Task tool capability, hook-based observation).

**Nguyên tắc nền tảng:** delegate-task v2 là **preparation + post-processing wrapper** quanh OpenCode native Task tool. KHÔNG reimplement dispatch qua `promptAsync`. Hivemind thêm value ở layers trên: category gates, concurrency control, safety ceiling, auto/ralph loops, session tracking.

**Nguồn tham chiếu kiến trúc:**
- CQRS model: `.planning/codebase/ARCHITECTURE.md:48-68`
- 9-surface authority: `.planning/codebase/ARCHITECTURE.md:218-268`
- CompletionDetector v1: `src/coordination/completion/detector.ts` (157 LOC)
- DelegationManager god-object: `src/coordination/delegation/manager.ts` (504 LOC)

---

## 2. Pattern Catalog

### P-01: Preparation-Wrapper Pattern

**Bài toán:** delegate-task v2 cần thêm value (category gates, concurrency, safety ceiling) mà KHÔNG thay thế execution backbone của OpenCode native Task tool.

**Giải pháp:** Tool `delegate-task` v2 hoạt động như một wrapper 3 giai đoạn: (1) Pre-flight checks — validate args, evaluate category gates, acquire concurrency slot, enforce depth limit; (2) Yield to native Task tool — trả instruction cho OpenCode runtime invoke native Task với `subagent_type` đã enrich; (3) Post-processing — hook observe completion, persist delegation record, release concurrency slot, route notification.

```typescript
// Pseudocode — delegate-task v2 tool flow
async function executeDelegateTaskV2(args: DelegateTaskArgs, ctx: ToolContext) {
  // === PRE-FLIGHT (Hivemind value-add) ===
  const gateResult = resolveCategoryGateDecision(args.agent, args.category)
  if (gateResult === "deny") {
    await recordCategoryGateask(args.agent, args.category, ctx.sessionID)
    return { title: "Gate Denied", output: `Category gate denied for ${args.agent}` }
  }

  const queueKey = buildDelegationQueueKey(args)
  const slot = await concurrencyQueue.acquire(queueKey, { limit: 2, acquireTimeoutMs: 5000 })

  const depth = delegationTracker.currentDepth(ctx.sessionID)
  if (depth >= MAX_DELEGATION_DEPTH) {
    concurrencyQueue.release(queueKey)
    return { title: "Depth Exceeded", output: `Max delegation depth (${MAX_DELEGATION_DEPTH}) reached` }
  }

  const delegationId = generateDelegationId()
  delegationTracker.register(delegationId, { parentId: ctx.sessionID, agent: args.agent, queueKey })

  // === YIELD TO NATIVE TASK TOOL ===
  // Return instruction — OpenCode runtime invoke native Task tool
  return {
    title: `Delegating to ${args.agent}`,
    output: `Prepared delegation ${delegationId}. Execute with Task tool.`,
    metadata: { delegationId, subagent_type: args.agent, queueKey, safetyCeilingMs }
  }
}
```

**Đánh đổi:**
- (+) Execution reliability — native Task tool quản lý lifecycle, không có execution gap
- (+) Hivemind giữ value-adds — category gates, concurrency, depth limits
- (-) Phụ thuộc native Task tool API — phải validate result format (Open Question #1 từ RESEARCH.md)
- (-) Tool chaining limitation — nếu runtime không hỗ trợ auto-invoke Task từ custom tool return

**Áp dụng:** Mọi lần dispatch subagent trong v2 — đây là entry point duy nhất.

---

### P-02: Progressive Polling Pattern

**Bài toán:** Parent session cần biết tình trạng delegation mà không overwhelm context budget. V1 dùng adaptive polling 4-tier trong `SdkDelegationHandler` (324 LOC) — quá phức tạp và không đáng tin cậy.

**Giải pháp:** Thin-line status injections vào parent session context theo cadence leo thang: 30s → 45s → 60s → 90s → 120s → 180s. Mỗi injection là một dòng compact với delegation ID, status, elapsed time. Tổng context budget: ~6 dòng × ~50 chars = ~300 chars cho toàn bộ lifecycle.

```typescript
// Pseudocode — Progressive Polling
type PollingCadence = readonly number[] // milliseconds
const PROGRESSIVE_CADENCE: PollingCadence = [30_000, 45_000, 60_000, 90_000, 120_000, 180_000]

interface PollingState {
  delegationId: string
  nextCadenceIndex: number
  timerId: ReturnType<typeof setTimeout> | null
}

function scheduleNextPoll(state: PollingState, parentSessionId: string): void {
  if (state.nextCadenceIndex >= PROGRESSIVE_CADENCE.length) return // Stop after 180s

  const delayMs = PROGRESSIVE_CADENCE[state.nextCadenceIndex]
  state.timerId = setTimeout(async () => {
    const status = delegationTracker.getStatus(state.delegationId)
    if (status === "completed" || status === "failed" || status === "timeout") return // Done

    const elapsed = PROGRESSIVE_CADENCE[state.nextCadenceIndex] / 1000
    await injectStatusLine(parentSessionId, `[DT:${state.delegationId}] status=${status} elapsed=${elapsed}s`)

    state.nextCadenceIndex++
    scheduleNextPoll(state, parentSessionId)
  }, delayMs)
}
```

**Đánh đổi:**
- (+) Context budget controlled — ~300 chars total, không grow linear
- (+) Parent nhận status updates mà không cần polling tool
- (-) Still context consumption — 6 dòng thêm vào parent context
- (-) Timer management complexity — cần cleanup khi delegation complete

**Áp dụng:** Mỗi active delegation. Polling tự dừng khi hook detect completion (P-04) hoặc timeout (P-03).

---

### P-03: Multi-Level Failure Detection Pattern

**Bài toán:** Delegation có thể stall ở nhiều mức độ khác nhau. V1 chỉ có single-level safety ceiling timeout — không phân biệt "đang chạy chậm" vs. "đóng băng hoàn toàn".

**Giải pháp:** 4 escalation levels với response khác nhau:

| Level | Threshold | Response | Mô tả |
|-------|-----------|----------|-------|
| WARN | 60s | Inject status line | "Delegation đang lâu hơn dự kiến" |
| NUDGE | 120s | Inject nudge message | "Delegation có thể cần can thiệp" |
| ALERT | 180s | Inject alert + suggestion | "Khuyến nghị kiểm tra hoặc cancel" |
| TERMINATE | 300s | Mark timeout + cleanup | "Delegation timeout — dừng monitoring" |

```typescript
// Pseudocode — Failure Escalation
type EscalationLevel = "warn" | "nudge" | "alert" | "terminate"

const ESCALATION_THRESHOLDS: Record<EscalationLevel, number> = {
  warn: 60_000, nudge: 120_000, alert: 180_000, terminate: 300_000
}

function evaluateEscalation(delegationId: string, startedAt: number): EscalationLevel | null {
  const elapsed = Date.now() - startedAt
  if (elapsed >= ESCALATION_THRESHOLDS.terminate) return "terminate"
  if (elapsed >= ESCALATION_THRESHOLDS.alert) return "alert"
  if (elapsed >= ESCALATION_THRESHOLDS.nudge) return "nudge"
  if (elapsed >= ESCALATION_THRESHOLDS.warn) return "warn"
  return null
}

async function handleEscalation(level: EscalationLevel, delegationId: string, parentId: string): Promise<void> {
  switch (level) {
    case "warn": return injectStatusLine(parentId, `[DT:${delegationId}] ⚠ Running longer than expected`)
    case "nudge": return injectStatusLine(parentId, `[DT:${delegationId}] ⚠ Consider checking or intervening`)
    case "alert": return injectStatusLine(parentId, `[DT:${delegationId}] 🔴 Recommend cancel or investigate`)
    case "terminate":
      await delegationTracker.markTimeout(delegationId)
      await concurrencyQueue.release(tracker.getQueueKey(delegationId))
      return injectStatusLine(parentId, `[DT:${delegationId}] ⛔ Timed out — monitoring stopped`)
  }
}
```

**Đánh đổi:**
- (+) Graduated response — không terminate prematurely
- (+) Terminates at 300s — bounded monitoring window
- (-) Thresholds hardcoded — nên configurable qua RuntimePolicy
- (-) Additional timer coordination với P-02 polling

**Áp dụng:** Mỗi active delegation. Escalation triggered bởi timer, stopped khi completion detected (P-04) hoặc cancel (P-09).

---

### P-04: Dual-Signal Completion Pattern

**Bài toán:** Phát hiện chính xác khi nào child session hoàn thành task. V1 dùng CompletionDetector (`src/coordination/completion/detector.ts`, 157 LOC) với dual-signal: message count stability + idle signal. Pattern này vẫn valid cho v2 nhưng cần adapt cho native Task tool context.

**Giải pháp:** Completion = terminal event từ hooks (`session.idle` | `session.error` | `session.deleted`) + optional verification. V2 giữ CompletionDetector nhưng chuyển từ polling-based sang hook-only event feeding.

```typescript
// Pseudocode — Dual-Signal Completion v2 (adapted từ detector.ts)
// CompletionDetector giữ nguyên interface, chỉ thay đổi feeding mechanism
class CompletionDetectorV2 {
  private watchers = new Map<string, Watcher>()
  private cachedResults = new Map<string, CompletionResult>()

  // Fed EXCLUSIVELY by hooks — không còn polling
  feed(eventType: string, sessionID: string, error?: string): void {
    const signal: CompletionSignal | undefined = {
      "session.idle": "idle",
      "session.error": "error",
      "session.deleted": "deleted",
    }[eventType]
    if (!signal) return

    const result: CompletionResult = { signal, sessionID, error }
    const watcher = this.watchers.get(sessionID)
    if (watcher) {
      clearTimeout(watcher.timeoutId)
      this.watchers.delete(sessionID)
      watcher.resolve(result)
    } else {
      // Cache cho late registration
      if (signal !== "idle") this.cachedResults.set(sessionID, result)
    }
  }

  // DelegationTracker register watcher cho active delegation
  async watch(sessionID: string, timeoutMs: number): Promise<CompletionResult> {
    const cached = this.cachedResults.get(sessionID)
    if (cached) { this.cachedResults.delete(sessionID); return cached }

    return new Promise<CompletionResult>((resolve) => {
      const timeoutId = setTimeout(() => {
        this.watchers.delete(sessionID)
        resolve({ signal: "timeout", sessionID })
      }, timeoutMs)
      this.watchers.set(sessionID, { resolve, timeoutId })
    })
  }
}
```

**Đánh đổi:**
- (+) Proven pattern — v1 CompletionDetector đã test kỹ
- (+) Hook-only feeding — loại bỏ polling overhead
- (-) Phụ thuộc hook event propagation — Open Question #2 từ RESEARCH.md (child sessions có trigger hooks không?)
- (-) Late watcher edge case — cached results cần cleanup

**Áp dụng:** Mỗi active delegation. Hook events (`session.idle`, `session.error`, `session.deleted`) feed detector. DelegationTracker awaits completion promise.

---

### P-05: Notification Router Pattern

**Bài toán:** Khi nhiều delegations chạy đồng thời (max 10 slots), notifications phải route đến đúng parent session. V1 dùng `notification-handler.ts` (242 LOC) với fire-and-forget delivery — cần cải thiện routing precision.

**Giải pháp:** Notification router map `delegationId → parentSessionId` và route 4 loại notifications: success, failure, progress, timeout. Mỗi notification type có format khác nhau.

```typescript
// Pseudocode — Notification Router
type NotificationType = "success" | "failure" | "progress" | "timeout"

interface NotificationRouter {
  // Map delegation → parent (set khi register delegation)
  register(delegationId: string, parentSessionId: string): void
  // Route notification đến đúng parent
  route(delegationId: string, type: NotificationType, payload: NotificationPayload): Promise<void>
  // Cleanup khi delegation complete
  deregister(delegationId: string): void
}

async function routeNotification(
  router: NotificationRouter,
  delegationId: string,
  type: NotificationType,
  payload: NotificationPayload
): Promise<void> {
  const parentId = router.getParent(delegationId)
  if (!parentId) return // Orphan delegation — log và skip

  const message = formatNotification(type, delegationId, payload)
  await sendPrompt(client, parentId, { content: message }) // NOT promptAsync
}

function formatNotification(type: NotificationType, id: string, payload: NotificationPayload): string {
  switch (type) {
    case "success": return `✅ [DT:${id}] completed — ${payload.summary}`
    case "failure": return `❌ [DT:${id}] failed — ${payload.error}`
    case "progress": return `🔄 [DT:${id}] ${payload.message}`
    case "timeout": return `⏰ [DT:${id}] timed out after ${payload.elapsedMs / 1000}s`
  }
}
```

**Đánh đổi:**
- (+) Precise routing — mỗi notification đến đúng parent
- (+) Type-aware formatting — different message cho different outcomes
- (-) Memory for routing table — Map<delegationId, parentSessionId> grow linear
- (-) `sendPrompt` blocking — notification delivery chậm có thể delay cleanup

**Áp dụng:** Mỗi delegation completion event trigger notification routing. Max 10 concurrent delegations nên routing table bounded.

---

### P-06: Session Resume Pattern

**Bài toán:** Khi delegation bị gián đoạn (context overflow, harness restart, network issue), cần resume session thay vì tạo mới — context đã được build, prompt đã được process.

**Giải pháp:** Detect resumable session dựa trên: session still exists, status = `idle` (not `error`/`deleted`), delegation record có `recoveryGuarantee: "resumable"`. Nếu resumable → reuse session ID, gửi continuation prompt. Nếu không → tạo fresh session.

```typescript
// Pseudocode — Session Resume
interface ResumeCheck {
  canResume: boolean
  reason: string
  sessionId?: string
}

async function checkResumable(
  delegationId: string,
  delegationRecord: Delegation,
  client: OpenCodeClient
): Promise<ResumeCheck> {
  // 1. Check recovery guarantee
  if (delegationRecord.recoveryGuarantee !== "resumable") {
    return { canResume: false, reason: "recovery_guarantee_not_resumable" }
  }

  // 2. Check session still exists
  const session = await getSession(client, delegationRecord.childSessionId)
  if (!session) {
    return { canResume: false, reason: "session_not_found" }
  }

  // 3. Check session not in terminal state
  if (session.status === "error" || session.status === "deleted") {
    return { canResume: false, reason: `session_${session.status}` }
  }

  return { canResume: true, reason: "resumable", sessionId: delegationRecord.childSessionId }
}

async function resumeOrRestart(
  delegationId: string,
  originalPrompt: string,
  continuationContext: string
): Promise<string> {
  const record = delegationTracker.get(delegationId)
  const check = await checkResumable(delegationId, record, client)

  if (check.canResume && check.sessionId) {
    // Resume: gửi continuation prompt, KHÔNG lặp lại original prompt
    await sendPrompt(client, check.sessionId, {
      content: `Continue from where you left off. ${continuationContext}`
    })
    return check.sessionId
  } else {
    // Fresh start
    const newSession = await spawnDelegatedSession(client, { parentID: record.parentSessionId })
    await sendPrompt(client, newSession, { content: originalPrompt })
    return newSession
  }
}
```

**Đánh đổi:**
- (+) Context preservation — không mất work đã done
- (+) Bounded criteria — chỉ resume khi đủ điều kiện
- (-) Resume prompt crafting — continuation context cần chính xác
- (-) Session state uncertainty — không biết chính xác child đã làm gì trước khi stall

**Áp dụng:** Khi harness restart recovery hoặc delegation timeout + auto-retry.

---

### P-07: Sequential Chaining Pattern

**Bài toán:** Nhiều task cần thực hiện tuần tự — task sau cần kết quả từ task trước. Cần truyền context/results giữa các delegations mà không mất data.

**Giải pháp:** Completed task session ID → new task inherit context qua explicit result passing. DelegationTracker maintain chain history.

```typescript
// Pseudocode — Sequential Chaining
interface DelegationChain {
  chainId: string
  steps: ChainStep[]
  currentStepIndex: number
}

interface ChainStep {
  delegationId: string
  agent: string
  prompt: string
  status: "pending" | "running" | "completed" | "failed"
  result?: string // Captured từ child session output
}

async function executeChainStep(chain: DelegationChain): Promise<void> {
  const currentStep = chain.steps[chain.currentStepIndex]
  const previousResults = chain.steps
    .slice(0, chain.currentStepIndex)
    .filter(s => s.status === "completed" && s.result)
    .map(s => `### Result from ${s.agent}:\n${s.result}`)
    .join("\n\n")

  // Enrich prompt với previous results
  const enrichedPrompt = previousResults
    ? `${currentStep.prompt}\n\n---\n**Previous step results:**\n${previousResults}`
    : currentStep.prompt

  // Dispatch delegation với enriched prompt
  const delegationId = await dispatchDelegation(currentStep.agent, enrichedPrompt)

  // Await completion
  const result = await completionDetector.watch(delegationId, safetyCeilingMs)
  currentStep.status = result.signal === "idle" ? "completed" : "failed"

  if (currentStep.status === "completed") {
    currentStep.result = await captureChildResult(delegationId)
    chain.currentStepIndex++
  }
}
```

**Đánh đổi:**
- (+) Explicit context passing — không phụ thuộc implicit session state
- (+) Chain history — full audit trail của sequential delegation
- (-) Context growth — mỗi step thêm previous results vào prompt
- (-) Sequential bottleneck — không parallelize được trong chain

**Áp dụng:** Multi-step workflows (research → analysis → synthesis), ralph-loop retry chains.

---

### P-08: Compact Survival Pattern

**Bài toán:** Context window overflow trong delegations — khi child session compact, critical delegation metadata (delegationId, parentSessionId, queueKey, status) có thể bị mất.

**Giải pháp:** Persist delegation metadata ngoài context window — trong `.hivemind/state/` delegation records. Trước khi compact, inject survival manifest vào context continuation. Sau khi compact, reload từ persistence.

```typescript
// Pseudocode — Compact Survival
interface DelegationSurvivalKit {
  delegationId: string
  parentSessionId: string
  queueKey: string
  startedAt: number
  currentStatus: DelegationStatus
  agent: string
  taskSummary: string // Compact description của current task
}

// Persist trước khi compact có thể xảy ra
function persistSurvivalKit(kit: DelegationSurvivalKit): void {
  // Write to .hivemind/state/delegation-survival/{delegationId}.json
  delegationPersistence.writeSurvivalKit(kit)
}

// Inject vào context continuation prompt
function buildSurvivalInjection(kit: DelegationSurvivalKit): string {
  return `[DELEGATION SURVIVAL] id=${kit.delegationId} parent=${kit.parentSessionId} ` +
    `queueKey=${kit.queueKey} agent=${kit.agent} status=${kit.currentStatus} ` +
    `task=${kit.taskSummary} — Continue this delegation.`
}

// Reload sau compact
function reloadSurvivalKit(delegationId: string): DelegationSurvivalKit | null {
  return delegationPersistence.readSurvivalKit(delegationId)
}
```

**Đánh đổi:**
- (+) Delegation metadata survive compaction
- (+) File-based persistence — không phụ thuộc in-memory state
- (-) I/O overhead — write survival kit mỗi lần status change
- (-) Stale data risk — survival kit có thể outdated nếu compaction xảy ra giữa writes

**Áp dụng:** Cross-cutting concern — mọi active delegation nên có survival kit persisted.

---

### P-09: Abort/Cancel/Restart Pattern

**Bài toán:** Delegating agent cần control in-flight delegations: abort (kill child session), cancel (mark cancelled, don't kill), restart (kill + re-dispatch với same params). Signal phải propagate đến child sessions.

**Giải pháp:** `delegation-control` tool (hoặc sub-commands trong `delegation-status`) với 3 actions. Abort signal propagate qua OpenCode SDK `abortSession()`. Cancel là state-only change. Restart = abort + re-dispatch.

```typescript
// Pseudocode — Abort/Cancel/Restart
type ControlAction = "abort" | "cancel" | "restart"

async function executeDelegationControl(
  delegationId: string,
  action: ControlAction,
  tracker: DelegationTracker,
  concurrencyQueue: DelegationConcurrencyQueue,
  client: OpenCodeClient
): Promise<ControlResult> {
  const record = tracker.get(delegationId)
  if (!record) return { success: false, error: "Delegation not found" }
  if (record.status === "completed" || record.status === "failed") {
    return { success: false, error: `Cannot ${action} terminal delegation (${record.status})` }
  }

  switch (action) {
    case "abort":
      // Kill child session + release resources
      await abortSession(client, record.childSessionId)
      tracker.markAborted(delegationId)
      concurrencyQueue.release(record.queueKey)
      return { success: true, message: `Aborted ${delegationId}` }

    case "cancel":
      // State-only change — child session continues but delegation is cancelled
      tracker.markCancelled(delegationId)
      concurrencyQueue.release(record.queueKey)
      return { success: true, message: `Cancelled ${delegationId} (child may still run)` }

    case "restart":
      // Abort + re-dispatch với same params
      await abortSession(client, record.childSessionId)
      concurrencyQueue.release(record.queueKey)
      tracker.markRestarted(delegationId)
      // Re-dispatch handled by caller (re-invoke delegate-task v2)
      return { success: true, message: `Restarting ${delegationId}` }
  }
}
```

**Đánh đổi:**
- (+) Delegator retains control — không fire-and-forget
- (+) Resource cleanup guaranteed — concurrency slots released
- (-) Race conditions — abort arrive khi child session vừa complete
- (-) Restart prompt ambiguity — same params có thể không yield same results (state changed)

**Áp dụng:** Delegating agent gọi khi escalation (P-03) reach ALERT/TERMINATE hoặc khi user cancel.

---

### P-10: God-Object Decomposition Pattern

**Bài toán:** `DelegationManager` (504 LOC, ~15 imports) là god-object — nắm quá nhiều trách nhiệm: dispatch routing, category gate evaluation, concurrency gating, recovery, notification scheduling. Refactor phải tách theo **responsibility boundary**, không chỉ move code.

**Giải pháp:** Tách thành 4 focused modules, mỗi cái < 200 LOC:

| Module | Trách nhiệm | LOC target | Replaces (từ manager.ts) |
|--------|------------|------------|--------------------------|
| `dispatcher.ts` | Dispatch routing + pre-flight checks | ~180 | Dispatch logic, category gate calls, depth check |
| `tracker.ts` | Delegation state tracking + query | ~150 | State queries, status transitions, record management |
| `notifier.ts` | Notification routing + delivery | ~120 | Notification scheduling, pending replay |
| `coordinator.ts` | Orchestration: wire dispatcher + tracker + notifier | ~100 | Startup recovery, lifecycle coordination |

```typescript
// Pseudocode — Decomposed architecture
// coordinator.ts (~100 LOC) — thin orchestrator, wires components
class DelegationCoordinator {
  constructor(
    private readonly dispatcher: DelegationDispatcher,    // dispatch routing
    private readonly tracker: DelegationTracker,            // state tracking
    private readonly notifier: NotificationRouter,          // notification routing
    private readonly concurrencyQueue: DelegationConcurrencyQueue,  // concurrency
    private readonly completionDetector: CompletionDetector // completion
  ) {}

  async dispatch(params: DelegateParams): Promise<DelegationResult> {
    const delegationId = await this.dispatcher.prepare(params) // Pre-flight checks
    await this.tracker.register(delegationId, params)          // State registration
    const result = await this.dispatcher.execute(delegationId)  // Native Task invoke
    return result
  }

  async handleCompletion(sessionId: string, signal: CompletionSignal): Promise<void> {
    const delegationId = this.tracker.findByChildSession(sessionId)
    if (!delegationId) return

    this.tracker.markComplete(delegationId, signal)
    this.concurrencyQueue.release(this.tracker.getQueueKey(delegationId))
    await this.notifier.route(delegationId, mapSignalToNotificationType(signal), {})
  }
}
```

**Đánh đổi:**
- (+) Mỗi module < 200 LOC — dễ test, dễ reason
- (+) Single responsibility — mỗi module có 1 job
- (+) Dependency injection — coordinator wires, modules don't import each other
- (-) More files to maintain — 4 files thay vì 1
- (-) Coordinator still needs careful design — risk of becoming mini-god-object

**Áp dụng:** Foundation pattern — decomposition enables tất cả patterns khác hoạt động đúng.

---

## 3. Tương tác Pattern

### 3.1 Map Tương tác

```
P-10 (Decomposition) ← NỀN TẢNG — phải refactor trước khi patterns khác implement đúng
  │
  ├── P-01 (Wrapper) → P-02 (Polling): wrapper initiate polling sau khi dispatch
  │     └── P-02 → P-03 (Failure): polling trigger escalation checks
  │           └── P-03 → P-09 (Abort): escalation "terminate" trigger abort
  │
  ├── P-04 (Completion) → P-05 (Notification): completion trigger notification routing
  │     └── P-05 → P-02: notification stops polling (deregister)
  │     └── P-05 → P-03: notification stops escalation (cleanup timer)
  │
  ├── P-06 (Resume) + P-07 (Chaining): compose — resume interrupted chain step
  │     └── P-06 → P-04: resume re-registers completion watcher
  │     └── P-07 → P-01: chain step dispatch qua wrapper
  │
  └── P-08 (Compact Survival): CROSS-CUTTING — tất cả patterns cần survival kit
        └── P-08 → P-06: survival kit enable resume sau compact
        └── P-08 → P-07: survival kit preserve chain state
```

### 3.2 Mô tả Tương tác chi tiết

**P-01 + P-02 (Wrapper → Polling):**
Sau khi `delegate-task` v2 dispatch delegation (P-01), nó khởi tạo progressive polling (P-02) cho delegation đó. Polling schedule gắn với delegation lifecycle — stopped khi completion detected.

**P-02 + P-03 (Polling → Failure Detection):**
Mỗi polling interval cũng evaluate escalation levels (P-03). Nếu elapsed > threshold, escalation response được inject thay vì regular status line. Sau 300s, polling và escalation đều stop.

**P-04 + P-05 (Completion → Notification):**
Khi hook observe completion event → CompletionDetector (P-04) resolve watcher promise → DelegationCoordinator handleCompletion → NotificationRouter (P-05) route notification đến parent session. Notification format depends on signal type (success/failure/timeout).

**P-06 + P-07 (Resume + Chaining):**
Khi chain step interrupted → check resumability (P-06) → nếu resumable, resume session và continue chain (P-07). Nếu không resumable → restart chain step từ đầu với enriched context (previous results preserved trong chain history).

**P-08 với tất cả patterns (Cross-cutting):**
Compact survival (P-08) phải work với mọi pattern. DelegationCoordinator persist survival kit sau mỗi state transition. Polling state, escalation level, chain history, notification routing table — tất cả nên survive compaction.

**P-09 với P-02/P-03 (Abort stops monitoring):**
Khi abort/cancel triggered (P-09), polling timers (P-02) và escalation timers (P-03) cleanup. Concurrency slot released. Notification routed (P-05) với "cancelled" type.

**P-10 là foundational:**
Decomposition (P-10) phải happen trước. God-object `DelegationManager` không cho phép implement patterns khác đúng cách — quá nhiều coupling. Sau khi tách, mỗi module implement đúng pattern được assign.

---

## 4. Anti-Patterns cần Tránh

### AP-01: `promptAsync` Dispatch (CHỨNG MINH BROKEN)

**Bằng chứng:** CONTEXT.md Section 2 — 2 delegation attempts, cả 2 timeout ở 29m59s, child sessions load 3 skills rồi DỪNG, 0 tool calls sau 30 phút. `promptAsync` trả HTTP 204 nhưng không guarantee execution.

**Tại sao:** Plugin layer không có quyền kiểm soát execution engine. Execution gap là **architectural limitation**, không phải bug.

**Thay thế:** P-01 (Preparation-Wrapper) — dùng native Task tool cho execution.

**Nguồn:** `src/shared/session-api.ts:181-193` (sendPromptAsync), `src/coordination/sdk-delegation/handler.ts` (324 LOC, adaptive polling).

---

### AP-02: Fire-and-Forget không Monitoring

**Bằng chứng:** V1 dispatch trả về ngay lập tức với delegation ID, nhưng không có mechanism nào guarantee parent session biết khi nào child hoàn thành — trừ polling.

**Tại sao:** Parent session block trên WaiterModel promise, nhưng nếu child stall, parent wait indefinitely.

**Thay thế:** P-02 (Progressive Polling) + P-03 (Failure Detection) + P-04 (Dual-Signal Completion).

---

### AP-03: Single-Level Timeout

**Bằng chứng:** V1 chỉ có `DEFAULT_SAFETY_CEILING_MS` — một timeout duy nhất cho toàn bộ delegation lifecycle. Không phân biệt "đang chạy chậm" vs. "đóng băng hoàn toàn".

**Tại sao:** Binary timeout (running vs. timeout) không cho parent agent đủ thông tin để quyết định can thiệp.

**Thay thế:** P-03 (Multi-Level Failure Detection) — 4 escalation levels với graduated response.

---

### AP-04: Notification Broadcast

**Bằng chứng:** `notification-handler.ts` (242 LOC) fire-and-forget deliver — không route đến đúng parent khi multiple delegations active.

**Tại sao:** Broadcast có nghĩa là parent nhận notifications cho delegations không phải của mình.

**Thay thế:** P-05 (Notification Router) — route dựa trên delegationId → parentSessionId map.

---

### AP-05: State trong Plugin Layer

**Bằng chứng:** Kiến trúc CQRS xác định: tools là write-side, hooks là read-side, `src/plugin.ts` là thin composition root. State persistence thuộc `src/task-management/`.

**Tại sao:** Plugin layer không nên hold state — nó wire dependencies, không own data.

**Thay thế:** State trong `.hivemind/state/` qua `delegation-persistence.ts` (task-management layer).

---

### AP-06: Blocking Delegator

**Bằng chứng:** V1 WaiterModel `await` completion promise trong tool execution — delegating agent block cho đến khi child complete hoặc timeout.

**Tại sao:** Blocking delegator không thể handle multiple concurrent delegations hoặc perform other work trong khi chờ.

**Thay thế:** P-01 returns immediately với delegation ID. P-04 handles completion asynchronously qua hooks. P-02 injects status updates không blocking.

---

## 5. Tóm tắt

| Pattern | Bài toán chính | Module chính | LOC target |
|---------|---------------|-------------|------------|
| P-01 | Preparation + native Task wrapper | `delegate-task.ts` v2 | ~120 |
| P-02 | Progressive status injection | `polling-scheduler.ts` (new) | ~80 |
| P-03 | Graduated failure detection | `escalation-evaluator.ts` (new) | ~60 |
| P-04 | Hook-based dual-signal completion | `detector.ts` (adapted) | ~160 |
| P-05 | Precise notification routing | `notification-router.ts` (new) | ~100 |
| P-06 | Session resume detection | `resume-checker.ts` (new) | ~80 |
| P-07 | Sequential chain execution | `chain-executor.ts` (new) | ~100 |
| P-08 | Context compaction survival | `survival-kit.ts` (new) | ~60 |
| P-09 | Abort/cancel/restart control | `delegation-control.ts` (new) | ~80 |
| P-10 | God-object decomposition | `coordinator.ts` + sub-modules | ~430 |

**Tổng estimated LOC mới:** ~1,270 LOC (trong coordination sector)
**V1 LOC removed:** ~2,969 LOC (manager.ts 504 + handler.ts 324 + state-machine.ts 432 + others)
**Target LOC reduction:** coordination sector từ ~2,969 xuống ~1,600 — đạt target trong CONTEXT.md.
