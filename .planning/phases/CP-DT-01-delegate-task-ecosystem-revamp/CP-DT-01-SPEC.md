<!-- generated-by: gsd-doc-writer -->
# CP-DT-01 SPEC — Delegate-Task v2 System Specification

**Ngày:** 2026-05-18
**Giai đoạn:** CP-DT-01
**Phạm vi:** Docs/Spec ONLY (L5) — không code implementation trong giai đoạn này
**Tài liệu tiền đề:** CONTEXT.md, RESEARCH.md, PATTERN.md

---

## 1. Giới thiệu Hệ thống

### 1.1 delegate-task v2 LÀ GÌ

delegate-task v2 là một **preparation + post-processing wrapper** quanh OpenCode native Task tool, cung cấp orchestration layer cho subagent dispatch. Hivemind thêm value ở các layers trên native execution:

- **Category gates** — narrowing-only allow/ask decisions cho agent-category dispatch pairings
- **Concurrency control** — per-key queue gating, giới hạn 10 concurrent slots per main session
- **Safety ceiling** — configurable timeout enforcement với graduated escalation
- **Auto/ralph loops** — self-referential dev loop và validate-fix-redispatch cycle
- **Session tracking** — WRITE-ONLY event capture, hierarchy manifest, retry queue
- **Notification delivery** — route completion/progress/timeout messages đến đúng parent session

### 1.2 delegate-task v2 KHÔNG PHẢI LÀ

- Custom dispatch mechanism thay thế native Task tool
- Reimplementation của `promptAsync`-based dispatch (đã chứng minh broken — CONTEXT.md Section 2)
- God-object orchestrator (DelegationManager v1 — 504 LOC, ~15 imports)
- Polling-based completion detection (SdkDelegationHandler v1 — 324 LOC, 4-tier intervals)

### 1.3 Vấn đề cốt lõi đang giải quyết

delegate-task v1 **PROVEN BROKEN**: dispatch OK (trả về delegation ID ngay lập tức), nhưng child sessions **đóng băng** sau khi load skills — 0 tool calls sau 30 phút, cả 2 delegation attempts timeout ở 29m59s. Execution gap giữa plugin layer và OpenCode runtime là **architectural limitation** — không thể fix bằng code improvements.

**Nguồn:** CONTEXT.md Section 2.1, RESEARCH.md Section "Don't Hand-Roll", PATTERN.md AP-01

---

## 2. Yêu cầu Chức năng (Functional Requirements)

### 2.1 Phân tác và Giao phó (Dispatch & Delegation)

**REQ-DT-01: Preparation-Wrapper cho Native Task Tool**
> The system SHALL wrap OpenCode native Task tool bằng 3 giai đoạn: (1) Pre-flight checks — validate args, evaluate category gates, acquire concurrency slot, enforce depth limit; (2) Yield to native Task tool — trả instruction cho OpenCode runtime invoke native Task với `subagent_type` đã enrich; (3) Post-processing — hook observe completion, persist delegation record, release concurrency slot, route notification.

**Pattern ref:** P-01 (Preparation-Wrapper Pattern)
**Acceptance:** Mỗi dispatch đi qua 3 giai đoạn trên. Pre-flight từ chối dispatch nếu category gate deny, concurrency full, hoặc depth vượt giới hạn. Kết quả native Task tool trả về chứa `delegationId` metadata.

**REQ-DT-02: Đánh giá Category Gate**
> The system SHALL đánh giá category gate cho mỗi dispatch request, áp dụng narrowing-only allow/ask decisions. Khi gate deny, system SHALL ghi audit trail qua `recordCategoryGateask()` và trả về error message với agent name và category.

**Pattern ref:** P-01 (Pre-flight), PATTERN.md P-10 (decomposition — `dispatcher.ts`)
**Acceptance:** Gate deny blocks dispatch, audit record persisted, error message hiển thị agent + category. Giữ nguyên logic từ `category-gates.ts` (84 LOC).

**REQ-DT-03: Kiểm soát Đồng thời (Concurrency Control)**
> The system SHALL acquire concurrency slot từ `DelegationConcurrencyQueue` trước khi dispatch. Mỗi `queueKey` giới hạn 2 concurrent delegations. Tổng số active delegations per main session không vượt quá 10 slots. Khi acquire timeout (5000ms), system SHALL trả về error với thông tin queue hiện tại.

**Pattern ref:** P-01 (acquire slot), P-10 (coordinator wires queue)
**Acceptance:** Dispatch bị từ chối khi 10 slots active. Per-key limit = 2. Acquire timeout = 5000ms trả về error. Slot released khi completion detected, abort, hoặc cancel.

**REQ-DT-04: Thực thi Safety Ceiling**
> The system SHALL enforce configurable safety ceiling timeout. Mặc định `DEFAULT_SAFETY_CEILING_MS`. Khi delegation vượt safety ceiling, system SHALL mark timeout, release concurrency slot, và route timeout notification đến parent session.

**Pattern ref:** P-03 (Multi-Level Failure Detection — TERMINATE level), P-09 (abort trigger)
**Acceptance:** Timeout delegation → status = "timeout", concurrency slot released, parent nhận notification `⏰ [DT:{id}] timed out after {X}s`.

**REQ-DT-05: Giới hạn Depth**
> The system SHALL enforce max delegation depth `MAX_DELEGATION_DEPTH` (mặc định: 3). Khi depth hiện tại >= max, system SHALL reject dispatch và trả về error message với current depth và max depth.

**Pattern ref:** P-01 (depth check), P-10 (dispatcher responsibility)
**Acceptance:** Recursive delegation bị chặn ở depth >= 3. Error message hiển thị `Max delegation depth (3) reached`. Child agent config tự động set `delegate-task: false` và `task: false` để ngăn recursive delegation.

---

### 2.2 Giám sát và Theo dõi (Monitoring & Tracking)

**REQ-MT-01: Progressive Polling**
> The system SHALL inject thin-line status updates vào parent session context theo cadence leo thang: 30s → 45s → 60s → 90s → 120s → 180s (6 injections tổng cộng). Mỗi injection là một dòng compact (~50 chars) với format `[DT:{delegationId}] status={status} elapsed={X}s`. Tổng context budget cho toàn bộ lifecycle: ~300 chars. Polling tự dừng khi completion detected hoặc timeout.

**Pattern ref:** P-02 (Progressive Polling Pattern)
**Acceptance:** 6 status injections với đúng cadence timestamps. Mỗi injection ≤ 60 chars. Không có injection sau 180s hoặc sau completion. Injection format chứa delegation ID và elapsed time chính xác.

**REQ-MT-02: 4-Level Failure Detection**
> The system SHALL detect delegation stall ở 4 escalation levels: WARN (60s), NUDGE (120s), ALERT (180s), TERMINATE (300s). WARN/NUDGE/ALERT inject status line vào parent. TERMINATE mark timeout, release concurrency slot, stop monitoring. Sau TERMINATE, không có thêm injection hoặc monitoring cho delegation đó.

**Pattern ref:** P-03 (Multi-Level Failure Detection Pattern)
**Acceptance:** 4 levels fire đúng thresholds. WARN = `⚠`, NUDGE = `⚠`, ALERT = `🔴`, TERMINATE = `⛔`. TERMINATE cleanup: concurrency slot released, monitoring stopped, notification routed.

**REQ-MT-03: Dual-Signal Completion Detection**
> The system SHALL detect child session completion dựa trên hook events (`session.idle`, `session.error`, `session.deleted`) feed vào CompletionDetector — KHÔNG sử dụng polling. CompletionDetector register watcher cho mỗi active delegation, resolve promise khi terminal event received, timeout khi safety ceiling exceeded.

**Pattern ref:** P-04 (Dual-Signal Completion Pattern)
**Acceptance:** Completion detected within 2s của hook event fire. Timeout fallback khi không nhận hook event sau safety ceiling duration. Cached results cho late watcher registration. `session.idle` = completed, `session.error` = failed, `session.deleted` = cancelled.

**REQ-MT-04: Xác minh Thực thi (Execution Verification)**
> The system SHALL detect execution failure — child session được tạo nhưng không có first tool call trong 60 giây. Khi phát hiện, system SHALL inject WARN escalation message vào parent session context.

**Pattern ref:** P-03 (WARN level), RESEARCH.md "Common Pitfalls" Pitfall 1
**Acceptance:** 60s fallback trigger WARN message: `[DT:{id}] ⚠ No tool call detected after 60s`. Điều kiện detect: child session created + 0 tool calls sau 60s.

---

### 2.3 Thông báo và Giao diện (Notification & TUI)

**REQ-NT-01: Notification Format**
> The system SHALL format notifications theo 4 types: success (`✅`), failure (`❌`), progress (`🔄`), timeout (`⏰`). Mỗi notification chứa delegation ID và compact summary. Format chuẩn: `{icon} [DT:{delegationId}] {type message} — {summary}`.

**Pattern ref:** P-05 (Notification Router Pattern — formatNotification)
**Acceptance:** 4 notification types với đúng icon và format. Success chứa summary output. Failure chứa error message. Progress chứa current status. Timeout chứa elapsed time.

**REQ-NT-02: Routing thông báo chính xác**
> The system SHALL route notifications đến đúng parent session dựa trên `delegationId → parentSessionId` mapping. Khi 10 delegations chạy đồng thời, mỗi notification chỉ đến đúng parent session — không broadcast. Router SHALL deregister mapping khi delegation complete.

**Pattern ref:** P-05 (Notification Router Pattern)
**Acceptance:** Notification đến đúng parent ngay cả khi 10 delegations active đồng thời. Orphan delegation (parent not found) logged và skip. Deregister sau completion/timeout/abort.

**REQ-NT-03: Pending Notification Replay**
> The system SHALL replay pending notifications cho delegations completed trước khi parent session ready. Replay khi parent session active, theo thứ tự chronological.

**Pattern ref:** P-05 (replayPendingNotifications từ v1 `notification-handler.ts`)
**Acceptance:** Notifications queued khi parent unavailable, replayed khi parent active. Replay theo FIFO order. Pending queue bounded (max 50 notifications).

---

### 2.4 Điều khiển Phân tác (Delegation Control)

**REQ-DC-01: Abort Operation**
> The system SHALL cung cấp abort action cho active delegations: kill child session qua SDK `abortSession()`, mark delegation status = "aborted", release concurrency slot, stop polling + escalation timers, route "cancelled" notification đến parent.

**Pattern ref:** P-09 (Abort/Cancel/Restart Pattern — abort case)
**Acceptance:** Child session terminated, status = "aborted", slot released, timers cleaned, parent notified. Terminal delegations (completed/failed/timeout) không thể abort — trả error.

**REQ-DC-02: Cancel Operation**
> The system SHALL cung cấp cancel action: mark delegation status = "cancelled", release concurrency slot, stop monitoring. Child session KHÔNG bị kill — tiếp tục chạy nhưng delegation không còn tracked.

**Pattern ref:** P-09 (cancel case)
**Acceptance:** Status = "cancelled", slot released, monitoring stopped. Child session vẫn active (không abort). Parent nhận cancel notification.

**REQ-DC-03: Restart Operation**
> The system SHALL cung cấp restart action = abort + re-dispatch với same parameters (agent, prompt, title). Original delegation record marked "restarted", new delegation created với fresh session ID.

**Pattern ref:** P-09 (restart case)
**Acceptance:** Original child session aborted, new child session created với same agent + prompt. Original record = "restarted", new delegation ID generated. New delegation đi qua full pre-flight checks (category gate, concurrency, depth).

**REQ-DC-04: Redirect Operation**
> The system SHALL cung cấp redirect action: abort current delegation và dispatch mới với different agent/prompt nhưng cùng delegation context (queueKey, category, depth). Original delegation record linked đến redirect target.

**Pattern ref:** P-09 (extend — redirect = abort + new dispatch với linked context)
**Acceptance:** Original aborted, new delegation dispatched với different agent. Records linked qua `redirectedFrom` field. Same queueKey preserved nếu không override.

---

### 2.5 Tiếp tục và Xâu chuỗi (Resume & Chaining)

**REQ-RC-01: Session Resume**
> The system SHALL detect resumable sessions dựa trên 3 conditions: (1) `recoveryGuarantee = "resumable"`, (2) session still exists (not deleted), (3) session status không phải terminal (error/deleted). Khi resumable → reuse session ID, gửi continuation prompt (không lặp original prompt). Khi không resumable → tạo fresh session.

**Pattern ref:** P-06 (Session Resume Pattern)
**Acceptance:** Resume chỉ khi cả 3 conditions thỏa mãn. Continuation prompt không lặp original prompt. Fresh session tạo khi không resumable. Resume record linked đến original delegation.

**REQ-RC-02: Sequential Task Chaining**
> The system SHALL hỗ trợ sequential task chaining: completed task session ID → new task inherits context qua explicit result passing. DelegationTracker maintain chain history với `chainId`, step index, và per-step results. Mỗi step enrich prompt với previous completed results.

**Pattern ref:** P-07 (Sequential Chaining Pattern)
**Acceptance:** Chain step N receives enriched prompt với results từ steps 0..N-1. Chain history persisted. Failed step marks chain = "failed" (không auto-continue). Max chain length = 10 steps.

**REQ-RC-03: Compact Survival**
> The system SHALL persist delegation metadata ngoài context window — trong `.hivemind/state/` delegation records. Trước khi compact, inject survival manifest vào context continuation với format: `[DELEGATION SURVIVAL] id={id} parent={parentId} queueKey={key} agent={agent} status={status} task={summary}`. Sau compact, reload từ persistence.

**Pattern ref:** P-08 (Compact Survival Pattern)
**Acceptance:** Survival kit persisted sau mỗi state transition. Injection format đúng spec. Reload sau compact trả về valid `DelegationSurvivalKit`. Stale detection: nếu kit timestamp > 5 phút cũ, warn parent.

---

### 2.6 Tự động hóa (Auto/Loops)

**REQ-AL-01: Auto-Loop Integration**
> The system SHALL tích hợp auto-loop: self-referential dev loop với injected dispatcher/verifier. Outcomes: `completed`, `needs_continuation`, `failed`. Mỗi iteration là một delegation dispatch qua P-01 wrapper.

**Pattern ref:** RESEARCH.md "Standard Stack" — `auto-loop.ts` (146 LOC, giữ nguyên)
**Acceptance:** Auto-loop dispatch per iteration qua wrapper. Loop terminates khi outcome = "completed" hoặc "failed". `needs_continuation` triggers next iteration. Max iterations configurable (default: 5).

**REQ-AL-02: Ralph-Loop Integration**
> The system SHALL tích hợp ralph-loop: validate-fix-redispatch cycle với configurable cap (default 3). Mỗi iteration: dispatch → validate result → nếu fail, fix prompt → re-dispatch. Pure async function với injected validator/fixer.

**Pattern ref:** RESEARCH.md — `ralph-loop.ts` (182 LOC, giữ nguyên)
**Acceptance:** Ralph-loop respects cap (default 3). Validation pass → return result. Validation fail + cap not reached → fix + re-dispatch. Cap reached → return last failure.

---

## 3. Yêu cầu Phi chức năng (Non-Functional Requirements)

**NFR-01: Polling Overhead**
> The system SHALL giới hạn polling overhead trên main session context budget: tổng ≤ 300 chars cho toàn bộ delegation lifecycle (6 injections × ~50 chars). Không có injection vượt quá 80 chars.

**NFR-02: Delegation Record Persistence**
> The system SHALL guarantee delegation record persistence: records written trước khi dispatch returns, sync write qua `delegation-persistence.ts`. Write failure SHALL trigger retry queue (exponential backoff 1s→2s→4s→8s→16s, max 5 retries) với degraded fallback.

**Pattern ref:** PATTERN.md P-08, CONTEXT.md Section 3 (session-tracker retry queue)

**NFR-03: Concurrent Delegation Limit**
> The system SHALL hỗ trợ tối đa 10 concurrent delegation slots per main session. Per-key limit = 2 concurrent delegations. Routing table bounded tại 10 entries. Memory overhead cho routing: ≤ 1KB per delegation.

**NFR-04: Maximum Delegation Duration**
> The system SHALL terminate monitoring sau 300 giây (5 phút) — TERMINATE escalation level. Sau TERMINATE: polling stopped, escalation stopped, concurrency slot released, timeout notification routed. Delegation record marked "timeout".

**Pattern ref:** P-03 (TERMINATE threshold)

**NFR-05: Backward Compatibility**
> The system SHALL đọc v1 delegation records từ `.hivemind/state/` format mà không crash. V1 records SHALL mark `recoveryGuarantee: "non-resumable-after-restart"` vì v1 sessions không thể resume trong kiến trúc v2. Migration SHALL NOT modify existing v1 records.

**NFR-06: Module Size**
> Mỗi module SHALL NOT vượt quá 500 LOC. Total coordination sector target: ~1,600 LOC (giảm từ ~2,969 LOC hiện tại).

**Pattern ref:** PATTERN.md P-10 (God-Object Decomposition)

---

## 4. Ràng buộc Thiết kế (Design Constraints)

**DC-01 (RE-OPENED / RUNTIME BLOCKED 2026-05-18):** The system SHALL sử dụng chỉ một child-session dispatch backbone đã được verify. Native Task tool vẫn là mục tiêu ưu tiên, nhưng plugin custom tool SHALL NOT assume `context.task` hoặc mocked `nativeTask` injection. Cho tới khi có L1-L3 proof cho một API dispatch thật, `delegate-task` SHALL trả blocked/error response trung thực và SHALL NOT register fake delegation completion.

**Pattern ref:** AP-01, RESEARCH.md "Don't Hand-Roll"

**DC-02:** Plugin layer (`src/plugin.ts`) SHALL NOT own execution state. Plugin là thin composition root — wire dependencies, register tools + hooks.

**Pattern ref:** AP-05, CONTEXT.md Section 5.2

**DC-03:** Tất cả durable state SHALL go qua `src/task-management/` layer — delegation records, continuity store, survival kits. State path: `.hivemind/state/`.

**Pattern ref:** P-08, AP-05

**DC-04:** Hooks SHALL chỉ observe events (read-side) — không mutate delegation state trực tiếp. Mutation authority thuộc tools (write-side) được trigger bởi hook observations.

**Pattern ref:** P-04, CONTEXT.md Section 5.3 (CQRS model)

**DC-05:** CQRS model: tools = write-side (mutation authority), hooks = read-side (event observation). Không cross violation.

**DC-06:** Max module size: 500 LOC per file.

**DC-07:** Total coordination sector target: ~1,600 LOC (down from ~2,969).

**Pattern ref:** P-10 decomposition targets

**DC-08:** The system SHALL NOT throw `any` types. All errors sử dụng `[Harness]` prefix.

**DC-09:** TypeScript strict mode (`strict: true`, `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`).

---

## 5. Giao diện Công cụ (Tool Interface)

### 5.1 delegate-task v2 Tool Schema

```typescript
const DelegateTaskV2Schema = z.object({
  // === BẮT BUỘC ===
  agent: z.string().min(1).describe(
    "Tên agent từ .opencode/agents/ — được dùng làm subagent_type cho native Task tool"
  ),
  prompt: z.string().min(1).describe(
    "Prompt/instruction gửi đến child agent — KHÔNG lặp lại context đã có trong agent definition"
  ),

  // === TÙY CHỌN — Dispatch Control ===
  title: z.string().optional().describe(
    "Tiêu đề hiển thị cho delegation — default: 'Delegating to {agent}'"
  ),
  category: z.string().optional().describe(
    "Category gate key — nếu set, system đánh giá category gate trước dispatch"
  ),
  queueKey: z.string().optional().describe(
    "Concurrency queue key — delegations với cùng queueKey giới hạn 2 concurrent. Default: 'default'"
  ),
  safetyCeilingMs: z.number().positive().optional().describe(
    "Timeout tối đa cho delegation (ms) — override DEFAULT_SAFETY_CEILING_MS. Min: 30000, Max: 600000"
  ),
  depth: z.number().int().min(0).max(3).optional().describe(
    "Current delegation depth — system enforce MAX_DELEGATION_DEPTH. Default: auto-detect từ parent"
  ),

  // === TÙY CHỌN — Resume/Chaining ===
  sessionId: z.string().optional().describe(
    "Session ID để resume — nếu set, system attempt resume thay vì tạo mới. Phải có recoveryGuarantee: resumable"
  ),
  chainFromId: z.string().optional().describe(
    "Delegation ID của previous step — nếu set, system enrich prompt với results từ previous delegation"
  ),
  chainIndex: z.number().int().min(0).optional().describe(
    "Step index trong chain (0-based) — dùng với chainFromId. Default: 0 (single delegation)"
  ),

  // === TÙY CHỌN — Loop Integration ===
  loopType: z.enum(["auto", "ralph"]).optional().describe(
    "Loop type — nếu set, system wrap delegation trong auto-loop hoặc ralph-loop cycle"
  ),
  loopCap: z.number().int().min(1).max(10).optional().describe(
    "Max loop iterations. Default: auto=5, ralph=3"
  ),

  // === TÙY CHỌN — Tool Restriction ===
  disableTools: z.array(z.string()).optional().describe(
    "Danh sách tools disable trong child agent — default: ['delegate-task', 'task'] (chống recursive delegation)"
  )
})
```

### 5.2 delegation-status v2 Tool Schema

```typescript
const DelegationStatusV2Schema = z.object({
  // === QUERY MODE: Single delegation ===
  delegationId: z.string().optional().describe(
    "Truy vấn specific delegation bằng ID — returns full record"
  ),

  // === QUERY MODE: Filter ===
  status: z.enum([
    "pending", "running", "completed", "failed",
    "timeout", "aborted", "cancelled", "restarted"
  ]).optional().describe(
    "Filter delegations by status — returns matching records"
  ),
  parentSessionId: z.string().optional().describe(
    "Filter delegations by parent session — returns child delegations"
  ),

  // === QUERY MODE: List ===
  listActive: z.boolean().optional().describe(
    "Liệt kê tất cả active delegations (status = pending | running) — returns summary table"
  ),

  // === OUTPUT CONTROL ===
  includeChildren: z.boolean().optional().default(false).describe(
    "Bao gồm child session messages trong output. Default: false (chỉ metadata)"
  ),
  format: z.enum(["table", "json", "compact"]).optional().default("table").describe(
    "Output format. 'compact' = one-line per delegation, 'table' = aligned columns, 'json' = raw records"
  )
})
```

### 5.3 delegation-control Tool Schema (MỚI)

```typescript
const DelegationControlSchema = z.object({
  // === BẮT BUỘC ===
  delegationId: z.string().min(1).describe(
    "Delegation ID để control — phải ở non-terminal status (pending | running)"
  ),
  action: z.enum(["abort", "cancel", "restart", "redirect"]).describe(
    "Control action: abort (kill child), cancel (untrack), restart (kill + re-dispatch), redirect (kill + new agent)"
  ),

  // === REDIRECT-SPECIFIC ===
  redirectToAgent: z.string().optional().describe(
    "Agent name cho redirect action — BẮT BUỘC khi action = 'redirect'"
  ),
  redirectPrompt: z.string().optional().describe(
    "New prompt cho redirect — nếu không set, reuse original prompt"
  ),

  // === RESTART-SPECIFIC ===
  restartPrompt: z.string().optional().describe(
    "Override prompt cho restart — nếu không set, reuse original prompt"
  ),
  restartAgent: z.string().optional().describe(
    "Override agent cho restart — nếu không set, reuse original agent"
  ),

  // === GENERAL ===
  reason: z.string().optional().describe(
    "Lý do cho action — logged vào delegation record audit trail"
  )
})
```

---

## 6. Hook Yêu cầu (Hook Requirements)

### 6.1 Hook Registration

The system SHALL đăng ký 3 hooks tối thiểu cho completion observation:

```typescript
// Hook registration trong src/plugin.ts
hook("session.idle", handleSessionIdle)    // → child completed successfully
hook("session.error", handleSessionError)  // → child failed with error
hook("session.deleted", handleSessionDeleted) // → child session terminated
```

### 6.2 Hook Handler Flow

```
Hook event received
  → Extract sessionID from event
  → Lookup delegationId via DelegationTracker.findByChildSession(sessionID)
  → If found:
    → Feed CompletionDetector (P-04)
    → DelegationCoordinator.handleCompletion()
      → Mark delegation status (completed/failed/cancelled)
      → Release concurrency slot
      → Stop polling timers (P-02) + escalation timers (P-03)
      → Route notification via NotificationRouter (P-05)
      → Persist final delegation record
  → If not found:
    → Ignore (session không phải delegated child)
```

### 6.3 Session-Tracker Integration

Hooks SHALL route events đến session-tracker cho WRITE-ONLY capture. Delegation hooks và session-tracker hooks chạy song song — không phụ thuộc lẫn nhau.

**Assumption A2 (từ RESEARCH.md):** Hook `session.idle` fire khi child session hoàn thành task — CẦN RUNTIME VALIDATION. Fallback: nếu hooks không fire, progressive polling (P-02) vẫn inject status + TERMINATE escalation (P-03) đảm bảo bounded monitoring.

---

## 7. Tiêu chuẩn Chấp nhận (Acceptance Criteria)

### 7.1 Phân tác và Giao phó

| REQ ID | Acceptance Criteria | Mức bằng chứng | Pattern Ref |
|--------|-------------------|-----------------|-------------|
| REQ-DT-01 | Dispatch qua 3 giai đoạn (pre-flight → yield → post-process). Pre-flight reject khi gate deny. | L3: integration test verify native Task invoke | P-01 |
| REQ-DT-02 | Gate deny → audit record persisted + error message chứa agent + category. | L2: unit test category-gates.ts | P-01 |
| REQ-DT-03 | 11th concurrent delegation bị reject. Per-key = 2 limit enforced. | L2: unit test queue.ts | P-01, P-10 |
| REQ-DT-04 | Timeout delegation → status = "timeout", slot released, notification routed. | L3: integration test | P-03 |
| REQ-DT-05 | Depth ≥ 3 reject với error message. Child tools disabled. | L2: unit test | P-01 |

### 7.2 Giám sát và Theo dõi

| REQ ID | Acceptance Criteria | Mức bằng chứng | Pattern Ref |
|--------|-------------------|-----------------|-------------|
| REQ-MT-01 | 6 injections đúng cadence (30→45→60→90→120→180s). Mỗi ≤ 80 chars. Stop sau completion. | L3: timing test | P-02 |
| REQ-MT-02 | 4 levels fire đúng thresholds (60→120→180→300s). TERMINATE cleanup đầy đủ. | L3: timing test | P-03 |
| REQ-MT-03 | Completion detected trong 2s của hook event. Timeout fallback hoạt động. | L3: integration test | P-04 |
| REQ-MT-04 | 60s no-tool-call → WARN message injected. | L3: integration test | P-03 |

### 7.3 Thông báo và Điều khiển

| REQ ID | Acceptance Criteria | Mức bằng chứng | Pattern Ref |
|--------|-------------------|-----------------|-------------|
| REQ-NT-01 | 4 notification types với đúng icon + format. | L2: unit test | P-05 |
| REQ-NT-02 | 10 concurrent delegations → mỗi notification đến đúng parent. | L3: integration test | P-05 |
| REQ-NT-03 | Pending notifications replayed FIFO khi parent active. | L2: unit test | P-05 |
| REQ-DC-01 | Abort → child killed, status = "aborted", slot released, timers cleaned. | L3: integration test | P-09 |
| REQ-DC-02 | Cancel → status = "cancelled", monitoring stopped, child vẫn chạy. | L2: unit test | P-09 |
| REQ-DC-03 | Restart → new delegation created, original = "restarted". | L3: integration test | P-09 |
| REQ-DC-04 | Redirect → new agent dispatched, records linked qua `redirectedFrom`. | L3: integration test | P-09 |

### 7.4 Resume/Chaining và Tự động hóa

| REQ ID | Acceptance Criteria | Mức bằng chứng | Pattern Ref |
|--------|-------------------|-----------------|-------------|
| REQ-RC-01 | Resume chỉ khi 3 conditions thỏa mãn. Continuation prompt không lặp original. | L2: unit test | P-06 |
| REQ-RC-02 | Chain step N receives enriched prompt với results 0..N-1. Max 10 steps. | L3: integration test | P-07 |
| REQ-RC-03 | Survival kit persisted + reload sau compact. Stale detection > 5 phút. | L2: unit test | P-08 |
| REQ-AL-01 | Auto-loop terminates khi outcome = completed/failed. Max 5 iterations. | L2: unit test | auto-loop.ts |
| REQ-AL-02 | Ralph-loop respects cap (3). Validation fail → fix + re-dispatch. | L2: unit test | ralph-loop.ts |

---

## 8. Ngoài Phạm vi (Out of Scope)

- **Sidecar/dashboard UI** cho delegation monitoring — thuộc Q2 sidecar phase
- **Cross-project delegation** — delegation chỉ trong cùng project context
- **Multi-model delegation routing** — tất cả delegations dùng model từ agent config
- **manager.ts decomposition implementation** — SPEC định nghĩa target architecture; implementation thuộc plan phase tiếp theo
- **Actual code implementation** — phase này là L5 spec-only
- **SdkDelegationHandler removal** — chỉ remove khi v2 proven working trong runtime
- **DelegationStateMachine rewrite** — giữ nguyên, adapt feeding mechanism

---

## 9. Rủi ro và Giảm thiểu (Risks & Mitigations)

| Rủi ro | Xác suất | Tác động | Giảm thiểu |
|--------|----------|----------|------------|
| **R1:** Native Task tool không invoke được từ custom tool context (Assumption A1) | Trung bình | CAO — blocking | Runtime validation trước plan phase. Fallback: tool chaining hoặc return instruction pattern |
| **R2:** Hook events không fire cho child sessions tạo bởi native Task tool (Assumption A2) | Trung bình | CAO — completion detection fail | Progressive polling (P-02) + TERMINATE escalation (P-03) đảm bảo bounded monitoring ngay không có hooks |
| **R3:** Native Task tool result format khác expected | Thấp | TRUNG BÌNH — post-processing fail | Verify result format trong Wave 0 tests trước khi implement post-processing |
| **R4:** God-object decomposition tạo mini-god-object trong coordinator | Thấp | TRUNG BÌNH — lặp lại v1 problem | Coordinator ≤ 100 LOC, chỉ wire — không implement logic. Dependency injection |
| **R5:** Backward compatibility với v1 records bị break | Thấp | TRUNG BÌNH — data loss | V1 records mark `non-resumable-after-restart`. Migration chỉ đọc, không modify |
| **R6:** Race condition giữa hook completion và abort signal | Trung bình | THẤP — state inconsistency | Abort check delegation status trước khi execute. Terminal status = immutable |
| **R7:** Context budget exceed khi nhiều delegations inject simultaneously | Thấp | THẤP — parent session degraded | Max 10 delegations × 6 injections × 80 chars = 4,800 chars worst case. Within budget |

---

## 10. Phụ thuộc (Dependencies)

### 10.1 Internal Dependencies

| Dependency | Module | Status | Impact nếu thiếu |
|------------|--------|--------|-----------------|
| CompletionDetector | `src/coordination/completion/detector.ts` | ✅ Existing (157 LOC) | Cần adapt feeding mechanism |
| DelegationConcurrencyQueue | `src/coordination/concurrency/queue.ts` | ✅ Existing | Dùng trực tiếp |
| Category gates | `src/coordination/delegation/category-gates.ts` | ✅ Existing (84 LOC) | Dùng trực tiếp |
| Category gate audit | `src/coordination/delegation/category-gate-audit.ts` | ✅ Existing (41 LOC) | Dùng trực tiếp |
| DelegationPersistence | `src/task-management/continuity/delegation-persistence.ts` | ✅ Existing | Dùng trực tiếp |
| Session-Tracker | `src/features/session-tracker/` | ✅ 418/418 tests pass | WRITE-ONLY event capture |
| Auto-loop | `src/coordination/spawner/auto-loop.ts` | ✅ Existing (146 LOC) | Giữ nguyên, integrate qua P-01 |
| Ralph-loop | `src/coordination/spawner/ralph-loop.ts` | ✅ Existing (182 LOC) | Giữ nguyên, integrate qua P-01 |
| Session API | `src/shared/session-api.ts` | ✅ Existing (285 LOC) | Dùng cho notification delivery |

### 10.2 External Dependencies

| Dependency | Version | Purpose | Status |
|------------|---------|---------|--------|
| `@opencode-ai/plugin` | ^1.14.41 | Tool/Hook registration | ✅ package.json |
| `@opencode-ai/sdk` | ^1.14.41 | Session API, abort | ✅ package.json |
| `zod` | ^3.25.0 | Schema validation | ✅ package.json |
| OpenCode native Task tool | v1.14+ | Execution backbone | ⚠️ Assumption A1 — cần runtime validation |

### 10.3 Blocking Assumptions (cần validation trước implementation)

| Assumption | Cần validate bằng | Fallback nếu sai |
|------------|------------------|-----------------|
| A1: Native Task tool invoke từ custom tool context | Runtime test: custom tool return instruction → runtime auto-invoke Task | Tool chaining hoặc prompt-based Task invocation |
| A2: Hook events fire cho child sessions | Runtime test: create child qua Task → observe hook events | Polling-only monitoring (P-02 + P-03) |
| A3: Native Task inherit parent's directory/worktree | Runtime test: verify child session directory | Explicit pass-through qua spawn params |
| A4: Custom tool access native Task result metadata | Verify ToolContext shape từ SDK source | Hook-based result capture |
| A5: subagent_type chấp nhận bất kỳ .opencode/agents/ name | Runtime test: dispatch với custom agent name | Whitelist hoặc config-based routing |

---

**Tổng kết:** SPEC này định nghĩa 22 functional requirements (REQ-DT/MT/NT/DC/RC/AL), 6 non-functional requirements (NFR), 9 design constraints (DC), 3 tool schemas, và 7 rủi ro đã identify với mitigations. Mỗi requirement tham chiếu đến pattern từ PATTERN.md và có measurable acceptance criteria. Phase tiếp theo (implementation) sẽ sử dụng SPEC này làm contract để plan concrete work.
