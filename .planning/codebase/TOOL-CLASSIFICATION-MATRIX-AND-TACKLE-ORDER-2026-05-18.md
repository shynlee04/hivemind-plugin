<!-- generated-by: gsd-doc-writer -->
# Tool Classification Matrix & Tackle Order — Cross-Cluster Synthesis

**Ngày:** 2026-05-18
**Bằng chứng:** L5 (source-code reading + external repo survey, không runtime proof)
**Phạm vi:** 3 clusters — A (Command Execution), B (PTY/Background Command), C (Delegation/Queue/Completion)
**Nguồn:** `COMMAND-EXECUTION-ANALYSIS`, `PTY-BACKGROUND-COMMAND-ANALYSIS`, `DELEGATION-QUEUE-ANALYSIS`, `external-repo-survey`, `CUSTOM-TOOLS-CRITERIA`

---

## A) Phân loại ma trận (Classification Matrix)

| # | Tool/Surface | Cluster | Hivemind Custom? | OpenCode Innate Equivalent? | External Pattern Match | Keep/Rework/Replace | Rationale |
|---|-------------|---------|-----------------|-----------------------------|----------------------|---------------------|-----------|
| 1 | `execute-slash-command` | A | ✅ Write-side tool | `session.command()` (blocked khi busy), TUI manual gõ | kdcokenny/opencode-background-agents dùng `session.prompt()` | **Rework** | Thiếu pre-dispatch validation, không check pressure, inline schema thay vì Zod |
| 2 | `hivemind-command-engine` | A | ✅ Read-side tool | Không có innate — discovery/preview là unique | shekohex/opencode-pty có `pty_list` nhưng chỉ PTY | **Keep** | Unique value: discovery, contract analysis, route preview với pressure gate |
| 3 | `command-engine/index.ts` | A | ✅ Core engine | N/A (internal routing) | — | **Keep** | 6-action switch rõ ràng, 223 LOC, dependency direction đúng |
| 4 | `command-engine/types.ts` | A | ✅ Type contracts | N/A | — | **Keep** | 175 LOC, leaf-like,PressureDecision import |
| 5 | `command-engine.schema.ts` | A | ✅ Zod validation | N/A | — | **Keep** | 32 LOC, clean |
| 6 | `run-background-command` | B | ✅ 5-action tool | `bash` tool (blocking only), `Task` tool (subagent) | shekohex/opencode-pty: `pty_spawn/write/read/list/kill` (5 tools riêng biệt) | **Keep** | Action routing đúng pattern C1, discriminated union Zod, delegation integration |
| 7 | `PtyManager` | B | ✅ Session lifecycle | Không có innate PTY | shekohex/opencode-pty: `PTYManager` singleton + sub-managers | **Keep** | Graceful degradation, bun-pty optional, ring buffer |
| 8 | `PtyBuffer` | B | ✅ Ring buffer | N/A | shekohex/opencode-pty: `RingBuffer` 50K lines, line-by-line storage | **Keep** | Offset-based incremental read, 20KB default, truncation tracking |
| 9 | `pty-runtime.ts` | B | ✅ Factory fallback | N/A | — | **Keep** | 25 LOC, try/catch → null, clean |
| 10 | `bun-pty.d.ts` | B | ✅ Ambient types | N/A | — | **Keep** | Cần thiết cho typecheck khi optional dep chưa install |
| 11 | `CommandDelegationHandler` | B/C | ✅ Dispatch handler | `session.create()` + `session.prompt()` cho SDK path | kdcokenny: SDK sub-session; shekohex: PTY-only | **Rework** | Triple path (SDK/PTY/headless) có divergent error handling, cần unified error contract |
| 12 | `delegate-task` | C | ✅ Tool entry-point | `Task` tool (blocking, single-level) | kdcokenny: `delegate` tool (WaiterModel) | **Keep** | WaiterModel + dual-signal completion superior to innate Task |
| 13 | `delegation-status` | C | ✅ Tool poll/status | `session.wait()`, `subscribe()` events | kdcokenny: `delegation_read` (blocking) | **Keep** | Non-blocking poll superior, nhưng cần unify TaskStatus ↔ DelegationStatus |
| 14 | `DelegationManager` | C | ✅ Core orchestrator | Không có innate equivalent | kdcokenny: `DelegationManager` (simpler); Temporal: Workflow orchestrator | **Rework** | ~500 LOC at cap, coupling bottleneck (8+ imports), cần extract dispatch strategy |
| 15 | `DelegationStateMachine` | C | ✅ Transition validator | N/A | Temporal: event-sourced state machine | **Keep** | Grace period timers, batch pruning, PTY-aware transitions |
| 16 | `buildDelegationQueueKey` (queue.ts) | C | ✅ Concurrency | Không có innate concurrency control | BullMQ: named queues + Redis semaphore | **Keep** | Cascade fallback (provider:model→model→agent:category→agent→category→default) |
| 17 | `CompletionDetector` | C | ✅ Event-driven completion | `session.idle` event (single source) | kdcokenny: `session.idle` + 15-min timeout | **Keep** | Dual-signal (event + polling stability) superior |
| 18 | `SdkDelegationHandler` | C | ✅ SDK polling | `session.create()` + `session.prompt()` + poll | kdcokenny: adaptive polling (không có stability tiers) | **Keep** | Adaptive intervals (active/base/idle/deep-idle) more sophisticated |
| 19 | `notification-handler.ts` | C | ✅ Terminal notification | `subscribe()` event listener | kdcokenny: `handleSessionIdle` + XML notification | **Rework** | Fire-and-forget + no retry loop, stale notification risk |
| 20 | `task-status.ts` | C | ✅ TaskStatus enum | N/A (harness-specific) | — | **Rework** | Phải unify với DelegationStatus, thiếu `timeout`/`dispatched` equivalents |
| 21 | `delegation-persistence.ts` | C | ✅ File I/O | N/A | kdcokenny: Markdown files; Temporal: event log | **Rework** | Duplicate `deriveSurface()`/`deriveRecoveryGuarantee()` vs state-machine.ts |

**Tóm tắt:** 21 surfaces → 14 Keep, 7 Rework, 0 Replace. Không có surface nào cần Replace hoàn toàn — mọi thứ đã implement có giá trị nhưng cần hardening.

---

## B) 9-Criteria Cross-Cluster Scorecard

| # | Criterion | Cluster A | Cluster B (inferred) | Cluster C | Worst | Priority Fix |
|---|-----------|-----------|----------------------|-----------|-------|-------------|
| 1 | Single Responsibility | 4 | 4 | 3 | **C (3)** | Extract dispatch strategy từ manager.ts |
| 2 | Type Safety | 5 | 4 | 4 | **B (4)** | Cluster B: ambient types thiếu IPty event type contracts |
| 3 | Error Handling | 3 | 3 | 2 | **C (2)** | Tạo `DelegationError` type với structured codes |
| 4 | Test Coverage | ? (~4) | 4 | 4 | **A (? ~4)** | Cluster A: cần verify schema tests tồn tại |
| 5 | CQRS Compliance | 4 | 4 | 3 | **C (3)** | Dual status system tạo semantic gap |
| 6 | Dependency Direction | 5 | 5 | 3 | **C (3)** | Manager là coupling bottleneck, cần strategy extraction |
| 7 | Consistency | 3 | 4 | 3 | **A/C (3)** | A: `command` vs `commandName` field naming; C: divergent error formats |
| 8 | Documentation | 5 | 4 | 4 | **B/C (4)** | B: spec alignment gaps; C: TaskStatus↔DelegationStatus undocumented |
| 9 | OpenCode Integration | 4 | 4 | 3 | **C (3)** | A: thiếu pre-dispatch validation; C: triple timeout race |

**Cluster averages:** A = 4.2/5 · B = 4.0/5 · C = 3.3/5

**Cluster B inference reasoning:** Source analysis sections A1-A8 cho thấy clean separation (PtyManager/PtyBuffer/pty-runtime mỗi file <120 LOC), Zod discriminated union schema, graceful fallback pattern, test coverage 33+ tests. Trừ error handling (catch-all null/false) và documentation (spec gap ở permission gate), Cluster B quality cao nhất về architecture.

**Worst performers:** C3 Error Handling (2/5), C6 Coupling (3/5), A7 Consistency (3/5).

---

## C) Conflicts & Overlaps Map

| ID | Conflict | Between | Severity | Evidence Ref |
|----|----------|---------|----------|-------------|
| CO-1 | Dual status type systems: `TaskStatus` vs `DelegationStatus` with incompatible states | `task-status.ts` ↔ `delegation/types.ts` | **CRITICAL** | Delegation Queue Analysis §C1 |
| CO-2 | Duplicate `deriveSurface()` / `deriveRecoveryGuarantee()` | `delegation-persistence.ts` ↔ `state-machine.ts` | HIGH | Delegation Queue Analysis §C2 |
| CO-3 | Triple dispatch path với divergent error formats | `sdk-delegation/handler` ↔ `command-delegation/handler` | HIGH | Delegation Queue Analysis §C3 |
| CO-4 | Three parallel timeout mechanisms racing | `state-machine` ↔ `sdk-handler` ↔ `detector` | MEDIUM | Delegation Queue Analysis §C4 |
| CO-5 | Write-side thiếu pre-dispatch validation | `execute-slash-command` ↔ `command-engine` | HIGH | Command Execution Analysis §C2.1 |
| CO-6 | Schema inconsistency: inline vs Zod | `execute-slash-command` (inline) ↔ `command-engine` (Zod) | MEDIUM | Command Execution Analysis §C2.2 |
| CO-7 | Field naming khác nhau: `command` vs `commandName` | `execute-slash-command` ↔ `hivemind-command-engine` | MEDIUM | Command Execution Analysis §C2.3 |
| CO-8 | Write-side thiếu pressure gate | `execute-slash-command` ↔ `runtime-pressure` | MEDIUM | Command Execution Analysis §C2.4 |
| CO-9 | Notification delivery fire-and-forget + no retry | `notification-handler.ts` ↔ session continuity | LOW | Delegation Queue Analysis §C5 |
| CO-10 | PTY buffer truncation is lossy — consumers must poll or accept data loss | `PtyBuffer` ↔ tool consumers | LOW | PTY Analysis §D3.4 |

**Tổng:** 10 conflicts → 1 CRITICAL, 3 HIGH, 4 MEDIUM, 2 LOW.

---

## D) Tackle Order (Khuyến nghị)

| Rank | ID | What to Fix | Cluster | Effort | Impact if Not Fixed | Dependencies | Phase Alignment |
|------|----|-------------|---------|--------|-------------------|--------------|-----------------|
| 1 | CO-1 | Unify `TaskStatus` ↔ `DelegationStatus` — tạo mapping table + shared type | C | M | Consumer parse wrong status, timeout delegations invisible | None | CP-PTY-02 (SDK session integration) |
| 2 | CO-2 | Extract shared `deriveSurface()` / `deriveRecoveryGuarantee()` to `src/coordination/delegation/types.ts` | C | S | Drift risk khi derivation rules change | None | CP-PTY-01 (pre-requisite) |
| 3 | CO-3 | Tạo `DelegationError` type với error codes, apply cho cả 3 dispatch paths | C | M | String-matching errors, monitoring impossible | CO-1 (status mapping) | CP-PTY-02 |
| 4 | CO-5 | `execute-slash-command` gọi `requireCommand()` từ command-engine trước dispatch | A | S | Blind dispatch command không tồn tại | None | CP-PTY-01 |
| 5 | CO-6 | Migrate execute-slash-command sang Zod schema thống nhất | A | S | Maintain 2 bộ validation | CO-5 | CP-PTY-01 |
| 6 | CO-7 | Unify field naming: `command` → `commandName` hoặc ngược lại | A | S | Agent confusion, wrong field used | CO-6 | CP-PTY-01 |
| 7 | CO-8 | Thêm pressure check vào execute-slash-command write-side | A | S | Dispatch khi system overloaded | CO-5 | CP-PTY-01 |
| 8 | CO-4 | Timer cleanup khi delegation pre-empted — cancel outstanding timers | C | S | Minor memory/timer leak | CO-3 | CP-PTY-02 |
| 9 | CO-9 | Thêm notification TTL + basic retry (1 retry) | C | S | Stale notification replayed after hours | CO-3 | CP-PTY-03 |
| 10 | CO-10 | Document PTY buffer lossy behavior trong tool description | B | S | Agent expects full output, gets truncated | None | CP-PTY-01 |
| 11 | — | Extract dispatch strategy từ `manager.ts` (strategy pattern) | C | L | manager.ts vượt 500 LOC cap, coupling bottleneck | CO-1, CO-3 | CP-PTY-03 |
| 12 | — | Structured delegation lifecycle logging (dispatch/complete/timeout/error events) | C | M | Debugging stuck delegation requires manual timer correlation | CO-3 | CP-PTY-04 |

**Effort legend:** S = Small (<1 day), M = Medium (1-3 days), L = Large (3-5 days).

---

## E) Recommended Approach

**Batch 1 (CP-PTY-01 pre-requisite, 2-3 ngày):** Fix CO-2 + CO-4 + CO-5 + CO-6 + CO-7 + CO-8 + CO-10 — tất cả small effort, zero dependencies, safe để làm song song với PTY MVP development. Checkpoint: typecheck pass, existing tests green, no behavioral change.

**Batch 2 (CP-PTY-02 alignment, 3-4 ngày):** Fix CO-1 + CO-3 + CO-8 — medium effort, CO-1 là CRITICAL blocker cho SDK integration. CO-1 phải done trước CO-3. Checkpoint: dual status unified, DelegationError type ship, integration test cho cả 3 dispatch paths pass.

**Batch 3 (CP-PTY-03/04 hardening, 4-5 ngày):** Fix CO-9 + CO-11 + CO-12 — larger effort, requires Batch 2 complete. Dispatch strategy extraction là largest item. Checkpoint: manager.ts dưới 400 LOC, structured logging visible trong delegation-status output, notification retry works.

---

*Tổng hợp: 2026-05-18 — 21 surfaces, 10 conflicts, 3 cluster averages: A=4.2 B=4.0 C=3.3*
