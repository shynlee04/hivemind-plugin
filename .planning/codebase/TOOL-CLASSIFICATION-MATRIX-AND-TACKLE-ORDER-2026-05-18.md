# Tool Classification Matrix & Tackle Order — Utility & Ecosystem Lens

**Ngày:** 2026-05-18 (rewrite từ LOC-based sang utility-based evaluation)
**Bằng chứng:** L5 (source-code reading + OpenCode SDK research via deepwiki/context7 + external repo survey)
**Phạm vi:** Toàn bộ tool surface — delegation, session-tracker, command-engine, PTY/background-command
**Nguồn:** `DELEGATE-TASK-DEEP-ARCHITECTURAL-AUDIT`, 3 Cluster Analyses, OpenCode SDK primitives research, session-tracker reference analysis
**Supersedes:** Bản LOC-based evaluation trước đó (cùng commit `39a3403d`)

---

## 0) Evaluation Framework

Mỗi surface được đánh giá trên **4 trục**, mỗi trục 1-5:

| Trục | Câu hỏi | Score 1 | Score 5 |
|------|---------|---------|---------|
| **OpenCode Harmony** | Surface hòa hợp thế nào với OpenCode SDK/innate tools? Có duplicate hoặc fight runtime? | Duplicate innate, fight runtime, bypass SDK contracts | Unique capability, complement SDK, extend đúng plugin contract |
| **Hivemind Philosophy** | Surface tuân thủ behavioral profiles, delegation mode, guardrails, CQRS observer? | Violates guardrails, no pressure awareness, write-in-hooks | Guardrail-aware, pressure-gated, CQRS clean, behavioral profile compliant |
| **Unique Value** | Surface cung cấp gì mà OpenCode innate KHÔNG có? Không thể thay bằng `Task` tool, `bash`, hoặc `session.prompt()`? | Completely replaceable by innate tools | Irreplaceable: WaiterModel, dual-signal, adaptive polling, PTY lifecycle |
| **Session-Tracker Parity** | Surface đạt modular/CQRS/dependency-injection parity với session-tracker (reference "done right")? | Monolith, tight coupling, no DI, god-object | Modular subdirectory, CQRS observer, DI via constructor, hooks own no write logic |

**Verdict logic:**
- Score ≥ 16 → **Keep** (ship as-is, minor polish)
- Score 12-15 → **Rework** (valuable but needs structural fix)
- Score < 12 → **Replace** (questionable value, major rework or remove)

---

## A) Surface-by-Surface Utility Analysis

### Surface 1: `delegate-task` tool (`src/tools/delegation/delegate-task.ts`)

| Trục | Score | Evidence |
|------|-------|----------|
| OpenCode Harmony | **4** | Plugin `tool()` contract đúng: Zod schema, `ToolContext` injection, `isOpenCodeRuntimeAvailable()` guard. Không fight `Task` tool — Hivemind delegate-task chạy **parallel** với innate Task, không replace nó. WaiterModel "always-background" là value ADD trên nền innate blocking Task. |
| Hivemind Philosophy | **5** | Pressure-aware: `requirePressureScore()` gate trước dispatch. Category gates: agent/category validation. Queue-key validation. Safety ceiling timer. Full behavioral profile integration. |
| Unique Value | **5** | **Irreplaceable.** OpenCode innate `Task` tool: blocking, single-level, no concurrency control, no queue-key, no category gates, no pressure gates, no safety ceiling, no WaiterModel dual-signal completion. Hivemind delegate-task: always-background WaiterModel, dual-signal (event + polling stability), adaptive polling intervals, concurrency queue with cascade fallback, category gates, pressure gates, safety ceiling timers. |
| Session-Tracker Parity | **3** | Entry-point thin (~250 LOC) — parity tốt. Nhưng dispatch xuống manager.ts (~580 LOC god-object) phá parity. Cần extract dispatch strategy như session-tracker extract capture/persistence/recovery. |

**Total: 17/20 → KEEP** — Core value proposition. Dispatch strategy extraction là polish, không phải blocker.

---

### Surface 2: `delegation-status` tool (`src/tools/delegation/delegation-status.ts`)

| Trục | Score | Evidence |
|------|-------|----------|
| OpenCode Harmony | **4** | Read-side poll tool — không conflict với innate. OpenCode có `session.wait()` (blocking) nhưng Hivemind cung cấp non-blocking poll + structured metadata (child refs, pipeline key). Complement, không duplicate. |
| Hivemind Philosophy | **4** | Read-side CQRS đúng: tool chỉ đọc state, không mutate. Nhưng dual status system (TaskStatus ↔ DelegationStatus) tạo semantic gap cho agents consuming output. |
| Unique Value | **4** | OpenCode innate: `session.wait()` blocking, `subscribe()` event-only. Hivemind: non-blocking poll, structured delegation records, child hierarchy, pipeline key export, session journal cross-reference. Value-add rõ ràng. |
| Session-Tracker Parity | **3** | Functional đúng, nhưng status type unification thiếu. Session-tracker có clean `SessionRecord` ↔ `ChildSessionRecord` contract — delegation cần tương tự. |

**Total: 15/20 → KEEP (borderline rework)** — Status type unification là hardening cần thiết.

---

### Surface 3: `DelegationManager` (`src/coordination/delegation/manager.ts`)

| Trục | Score | Evidence |
|------|-------|----------|
| OpenCode Harmony | **3** | Sử dụng `sessions.create()` + `sessions.prompt()` đúng SDK path, nhưng triple dispatch (SDK/PTY/headless) có divergent error handling. SDK contract tuân thủ, PTY path bypass SDK notification. |
| Hivemind Philosophy | **4** | Category gates, queue integration, state machine wiring, completion detection — đầy đủ. Nhưng coupling cao: 8+ imports, spawner, concurrency, completion, state-machine, category, session-api. |
| Unique Value | **4** | Không có innate equivalent. OpenCode không có delegation orchestrator — chỉ có `session.create()` primitives. Hivemind manager orchestrate: dispatch → concurrency → state → completion → notification → persistence. Unique layer. |
| Session-Tracker Parity | **2** | God-object ~580 LOC — session-tracker reference tách ra: `index.ts` (barrel), `capture/`, `hooks/`, `persistence/`, `recovery/`, `transform/`. Manager cần tương tự: extract dispatch strategy, persistence, notification thành sub-modules. |

**Total: 13/20 → REWORK** — Valuable orchestration layer nhưng coupling + LOC cần decompose theo session-tracker pattern.

---

### Surface 4: `SdkDelegationHandler` (`src/coordination/delegation/sdk-delegation/handler.ts`)

| Trục | Score | Evidence |
|------|-------|----------|
| OpenCode Harmony | **5** | Direct SDK consumer: `sessions.create()`, `sessions.prompt()`, poll loop. Full alignment với OpenCode SDK primitives. Không bypass, không workaround. |
| Hivemind Philosophy | **4** | Adaptive polling intervals (active=2s, base=5s, idle=15s, deep-idle=30s) — sophisticated hơn innate. Nhưng grace period timer race với state-machine timer (CO-4). |
| Unique Value | **5** | **Irreplaceable.** Adaptive polling với stability tiers là innovation: không chỉ poll, mà detect "stable" state trước claim completion. OpenCode innate: single `session.idle` event, no stability detection. |
| Session-Tracker Parity | **3** | Functional clean, nhưng cần DI cho poll intervals (hiện hardcoded). Session-tracker injects `config` qua constructor. |

**Total: 17/20 → KEEP** — SDK polling layer là technical advantage.

---

### Surface 5: `CommandDelegationHandler` (`src/coordination/delegation/command-delegation/handler.ts`)

| Trục | Score | Evidence |
|------|-------|----------|
| OpenCode Harmony | **3** | Triple dispatch path: SDK/PTY/headless. PTY path dùng bun-pty (optional dep), headless fallback `child_process`. Error handling divergent giữa paths — không có unified error contract. |
| Hivemind Philosophy | **3** | Category gate integration đúng. Nhưng error propagation不一致: PTY path trả `null` trên failure, SDK path throw, headless path catch-all. Agents không thể handle uniformly. |
| Unique Value | **4** | PTY command delegation là unique — OpenCode innate không có PTY lifecycle management. Graceful fallback bun-pty → child_process → error là valuable. |
| Session-Tracker Parity | **2** | Triple path divergent = coupling problem. Session-tracker reference: hooks chỉ observe, không dispatch. CommandDelegationHandler vừa observe vừa dispatch — vi phạm CQRS separation. |

**Total: 12/20 → REWORK** — PTY value unique nhưng error contract cần unify, CQRS separation cần fix.

---

### Surface 6: `DelegationStateMachine` (`src/coordination/delegation/state-machine.ts`)

| Trúc | Score | Evidence |
|------|-------|----------|
| OpenCode Harmony | **5** | Pure state validator — không touch SDK. Valid transitions only. Không fight runtime. |
| Hivemind Philosophy | **5** | Grace period timers, batch pruning, PTY-aware transitions, timeout tracking. Full guardrail compliance. |
| Unique Value | **5** | **Irreplaceable.** OpenCode không có delegation state machine. Hivemind: formal transition validation, grace period, timeout cascade, batch pruning. Critical for delegation correctness. |
| Session-Tracker Parity | **4** | Pure function module, no side effects, DI via config. Close to session-tracker parity. |

**Total: 19/20 → KEEP** — Gold standard. State machine là foundation của delegation correctness.

---

### Surface 7: `CompletionDetector` (`src/coordination/completion/detector.ts`)

| Trục | Score | Evidence |
|------|-------|----------|
| OpenCode Harmony | **4** | Complement innate `session.idle` event. Dual-signal (event + polling stability) superior. Không fight runtime. |
| Hivemind Philosophy | **5** | Event-driven + polling stability = dual-signal completion detection. Pressure-aware: stability threshold scales với pressure score. Full behavioral profile integration. |
| Unique Value | **5** | **Irreplaceable.** OpenCode innate: single `session.idle` event, no stability detection, no pressure scaling. Hivemind: dual-signal, stability tiers, pressure-scaled thresholds, completion event journaling. |
| Session-Tracker Parity | **4** | Observer pattern đúng, DI clean, modular. Session-tracker parity tốt. |

**Total: 18/20 → KEEP** — Technical advantage over innate.

---

### Surface 8: `run-background-command` tool (`src/features/background-command/`)

| Trục | Score | Evidence |
|------|-------|----------|
| OpenCode Harmony | **5** | Plugin `tool()` contract: Zod discriminated union, 5-action routing (spawn/write/read/list/kill), `ToolContext` injection. Clean plugin citizen. |
| Hivemind Philosophy | **4** | Delegation integration: spawn action tạo delegation record, list action filters by delegation. Nhưng pressure gate thiếu ở spawn action (chỉ check bun-pty available, không check system load). |
| Unique Value | **5** | **Irreplaceable.** OpenCode innate `bash`: blocking only, no session persistence, no background lifecycle. Hivemind: 5-action PTY lifecycle, ring buffer output, session persistence, graceful degradation. |
| Session-Tracker Parity | **3** | Feature module đúng pattern. Nhưng PtyManager singleton (không DI) khác với session-tracker constructor injection. |

**Total: 17/20 → KEEP** — Unique PTY lifecycle management.

---

### Surface 9: `PtyManager` + `PtyBuffer` (`src/features/background-command/`)

| Trục | Score | Evidence |
|------|-------|----------|
| OpenCode Harmony | **5** | Graceful degradation: `bun-pty` optional dep, try/catch → null fallback, headless `child_process` fallback. Không require bun-pty. |
| Hivemind Philosophy | **4** | Ring buffer với offset-based incremental read, truncation tracking, 20KB default. Nhưng singleton pattern (không DI) — khác với behavioral profile injection pattern. |
| Unique Value | **5** | **Irreplaceable.** Không có innate PTY manager. shekohex/opencode-pty có PTY nhưng là standalone MCP server, không integrate delegation/completion. Hivemind: PTY + delegation + completion + persistence = unique stack. |
| Session-Tracker Parity | **3** | Modular file separation đúng. Nhưng singleton + no DI = parity gap vs session-tracker constructor injection. |

**Total: 17/20 → KEEP** — PTY infrastructure là competitive advantage.

---

### Surface 10: `hivemind-command-engine` tool (`src/routing/command-engine/`)

| Trục | Score | Evidence |
|------|-------|----------|
| OpenCode Harmony | **5** | Unique: discovery, contract analysis, route preview. Không có innate equivalent. OpenCode không expose command discovery API cho tools. |
| Hivemind Philosophy | **5** | Pressure-gated: `requirePressureScore()` gate cho write-side actions. Read-side actions (discover, list) không cần pressure. Clean CQRS: read vs write separation. |
| Unique Value | **5** | **Irreplaceable.** OpenCode innate: không có command discovery, contract analysis, route preview, pressure gating cho command dispatch. Completely unique surface. |
| Session-Tracker Parity | **4** | 6-action switch rõ ràng, Zod schema, type contracts. Modular. Clean dependency direction. |

**Total: 19/20 → KEEP** — Gold standard. Unique value, clean architecture.

---

### Surface 11: `execute-slash-command` tool (`src/routing/command-execution/`)

| Trục | Score | Evidence |
|------|-------|----------|
| OpenCode Harmony | **3** | `session.command()` (blocked khi busy) — Hivemind bypass bằng direct command engine invoke. Valuable (non-blocking dispatch) nhưng cần acknowledgment: đây là intentional bypass vì innate API bị block. |
| Hivemind Philosophy | **3** | Write-side tool THIẾU: (1) pre-dispatch validation — không verify command tồn tại trước dispatch, (2) pressure gate — không check system load, (3) inline schema — không dùng Zod như command-engine. 3 missing guardrails. |
| Unique Value | **4** | Non-blocking command dispatch vs innate blocking. Nhưng unique value bị giảm bởi thiếu validation — agent có thể dispatch nonexistent command silently. |
| Session-Tracker Parity | **2** | Inline schema, no validation, no pressure awareness — xa parity với session-tracker observer pattern. |

**Total: 12/20 → REWORK** — Valuable non-blocking dispatch nhưng thiếu 3 critical guardrails.

---

### Surface 12: `notification-handler.ts`

| Trục | Score | Evidence |
|------|-------|----------|
| OpenCode Harmony | **4** | Complement `subscribe()` event — terminal notification sau delegation complete. Không fight runtime. |
| Hivemind Philosophy | **3** | Fire-and-forget: no retry, no TTL, no delivery tracking. Notification có thể replay stale sau hours nếu process restart. Guardrail: nên có delivery guarantee. |
| Unique Value | **3** | OpenCode innate: `subscribe()` event cho session state changes. Hivemind notification: terminal-specific notification (sound, title). Value marginal — có thể implement bằng innate hook. |
| Session-Tracker Parity | **2** | No retry, no TTL, fire-and-forget — xa session-tracker persistence pattern. |

**Total: 12/20 → REWORK** — Marginal value, delivery guarantee missing.

---

### Surface 13: `task-status.ts`

| Trục | Score | Evidence |
|------|-------|----------|
| OpenCode Harmony | **3** | Harness-specific enum — không map 1:1 với OpenCode session states. Dual system: TaskStatus (harness) vs DelegationStatus (delegation) tạo consumer confusion. |
| Hivemind Philosophy | **4** | States đúng về mặt semantics (pending → dispatched → running → completed/failed/timeout). Nhưng thiếu `dispatched` state alignment với DelegationStatus. |
| Unique Value | **3** | OpenCode innate: không có task status enum (chỉ session states). Value: structured status cho delegation lifecycle. Nhưng dual system giảm value — consumers phải handle 2 type systems. |
| Session-Tracker Parity | **2** | Dual type system = inconsistency. Session-tracker: single `SessionRecord` type contract. |

**Total: 12/20 → REWORK** — Must unify with DelegationStatus.

---

### Surface 14: `delegation-persistence.ts`

| Trục | Score | Evidence |
|------|-------|----------|
| OpenCode Harmony | **5** | File I/O persistence — không touch SDK. Pure infrastructure. |
| Hivemind Philosophy | **4** | Durable JSON persistence đúng pattern. Nhưng duplicate `deriveSurface()`/`deriveRecoveryGuarantee()` với state-machine.ts — drift risk. |
| Unique Value | **4** | Delegation record I/O — không có innate equivalent. Recovery support: `readPersistedDelegations()` cho harness restart. |
| Session-Tracker Parity | **3** | Session-tracker: `persistence/child-writer.ts` + `persistence/retry-queue.ts` — modular, retry support. Delegation persistence: single file, no retry queue. Parity gap. |

**Total: 16/20 → KEEP** — Valuable persistence, minor dedup needed.

---

### Surface 15: `buildDelegationQueueKey` (`src/coordination/concurrency/queue.ts`)

| Trục | Score | Evidence |
|------|-------|----------|
| OpenCode Harmony | **5** | Không conflict innate — OpenCode không có concurrency control cho delegations. |
| Hivemind Philosophy | **5** | Cascade fallback (provider:model→model→agent:category→agent→category→default) — sophisticated queue routing. Full behavioral profile integration via category system. |
| Unique Value | **5** | **Irreplaceable.** OpenCode innate: không có delegation concurrency control, không có queue-key routing, không có cascade fallback. BullMQ-level sophistication without Redis dependency. |
| Session-Tracker Parity | **4** | Pure function, testable, no side effects. Clean. |

**Total: 19/20 → KEEP** — Gold standard. Unique concurrency layer.

---

## B) Summary Matrix

| # | Surface | Harmony | Philosophy | Unique | Parity | **Total** | **Verdict** |
|---|---------|---------|------------|--------|--------|-----------|-------------|
| 6 | DelegationStateMachine | 5 | 5 | 5 | 4 | **19** | KEEP ★ |
| 10 | hivemind-command-engine | 5 | 5 | 5 | 4 | **19** | KEEP ★ |
| 15 | Queue Key | 5 | 5 | 5 | 4 | **19** | KEEP ★ |
| 7 | CompletionDetector | 4 | 5 | 5 | 4 | **18** | KEEP ★ |
| 1 | delegate-task | 4 | 5 | 5 | 3 | **17** | KEEP |
| 4 | SdkDelegationHandler | 5 | 4 | 5 | 3 | **17** | KEEP |
| 8 | run-background-command | 5 | 4 | 5 | 3 | **17** | KEEP |
| 9 | PtyManager+PtyBuffer | 5 | 4 | 5 | 3 | **17** | KEEP |
| 14 | delegation-persistence | 5 | 4 | 4 | 3 | **16** | KEEP |
| 2 | delegation-status | 4 | 4 | 4 | 3 | **15** | KEEP (rework status types) |
| 3 | DelegationManager | 3 | 4 | 4 | 2 | **13** | REWORK |
| 5 | CommandDelegationHandler | 3 | 3 | 4 | 2 | **12** | REWORK |
| 11 | execute-slash-command | 3 | 3 | 4 | 2 | **12** | REWORK |
| 12 | notification-handler | 4 | 3 | 3 | 2 | **12** | REWORK |
| 13 | task-status | 3 | 4 | 3 | 2 | **12** | REWORK |

**Totals:** 9 KEEP (≥16), 6 REWORK (12-15), 0 REPLACE (<12)

---

## C) Tackle Order — Utility-Prioritized

Thứ tự ưu tiên dựa trên **utility impact** (không phải effort/LOC):

### Priority 1: Guardrail Gaps (protects agent experience)

| Rank | Surface | What | Why utility-first |
|------|---------|------|-------------------|
| P1-1 | `execute-slash-command` | Thêm `requireCommand()` validation + pressure gate + Zod schema | Agent dispatching nonexistent command = silent failure = trust erosion. Guardrail trước khi feature. |
| P1-2 | `CommandDelegationHandler` | Unified error contract cho 3 dispatch paths (SDK/PTY/headless) | Agents không thể handle errors uniformly = brittle delegation = reduced trust. |
| P1-3 | `task-status.ts` | Unify TaskStatus ↔ DelegationStatus, add mapping table | Dual status = consumer confusion = agents parse wrong state = wrong decisions. |

### Priority 2: Structural Decomposition (enables future work)

| Rank | Surface | What | Why utility-first |
|------|---------|------|-------------------|
| P2-1 | `DelegationManager` | Extract dispatch strategy + notification + persistence thành sub-modules | God-object = mọi future change touch same file = regression risk. Decompose theo session-tracker pattern. |
| P2-2 | `delegation-persistence` | Deduplicate `deriveSurface()`/`deriveRecoveryGuarantee()` + add retry queue | Drift risk + no retry = data loss on write failure. Session-tracker parity. |
| P2-3 | `notification-handler` | Add TTL + 1 retry + delivery tracking | Stale notification = agent confusion. Minimal delivery guarantee. |

### Priority 3: Polish (nice-to-have)

| Rank | Surface | What | Why utility-first |
|------|---------|------|-------------------|
| P3-1 | `delegation-status` | Add structured error metadata in poll response | Agents debugging stuck delegations cần structured error context. |
| P3-2 | `SdkDelegationHandler` | DI cho poll intervals (hardcoded → config-injected) | Session-tracker parity. Enables pressure-scaled polling in future. |
| P3-3 | `PtyManager` | Constructor injection thay vì singleton | Session-tracker parity. Enables testability. |

---

## D) OpenCode Ecosystem Harmony Assessment

### Hivemind surfaces vs OpenCode innate — harmony map

```
                    ┌─────────────────────────────────────────────────────┐
                    │           OPENCODE INNATE CAPABILITIES              │
                    ├─────────────┬──────────────┬───────────────────────┤
                    │ Task Tool   │ bash Tool    │ SDK Session API       │
                    │ (blocking)  │ (blocking)   │ create/prompt/wait    │
                    └──────┬──────┴──────┬───────┴──────────┬────────────┘
                           │             │                  │
          ┌────────────────┼─────────────┼──────────────────┼────────────┐
          │                │             │                  │            │
    ┌─────┴──────┐  ┌──────┴─────┐ ┌─────┴──────┐  ┌───────┴──────┐    │
    │ delegate-  │  │ run-bg-    │ │ completion │  │ SDK         │    │
    │ task       │  │ command    │ │ detector   │  │ delegation  │    │
    │ (Waiter-   │  │ (PTY       │ │ (dual-     │  │ handler     │    │
    │  Model)    │  │  lifecycle)│ │  signal)   │  │ (adaptive   │    │
    │            │  │            │ │            │  │  polling)   │    │
    │ ADDS:      │  │ ADDS:      │ │ ADDS:      │  │ ADDS:       │    │
    │ - always-  │  │ - 5-action │ │ - stability│  │ - 4-tier   │    │
    │   bg       │  │   lifecycle│ │   detection│  │   intervals│    │
    │ - queue    │  │ - ring buf │ │ - pressure │  │ - stability│    │
    │ - category │  │ - fallback │ │   scaling  │  │   tiers    │    │
    │ - pressure │  │            │ │ - journal  │  │ - SDK-only │    │
    └────────────┘  └────────────┘ └────────────┘  └────────────┘    │
                                                                      │
          HIVEMIND: EXTENDS INNATE — NEVER REPLACES                   │
          └───────────────────────────────────────────────────────────┘
```

### Key insight: Hivemind là **extension layer**, không phải replacement

Mỗi Hivemind surface **adds capabilities** mà OpenCode innate không có:
- **delegate-task**: thêm WaiterModel, concurrency, category gates trên nền innate `Task` tool
- **run-background-command**: thêm PTY lifecycle trên nền innate `bash` tool
- **CompletionDetector**: thêm dual-signal stability detection trên nền innate `session.idle`
- **SdkDelegationHandler**: thêm adaptive polling trên nền innate `sessions.create/prompt/wait`
- **Queue system**: thêm concurrency control — innate không có
- **State machine**: thêm formal transition validation — innate không có

**Không có surface nào duplicate innate capability mà không add value.** Đây là harmony.

---

## E) Conflicts That Matter (utility-impacting only)

Bỏ qua naming/LOC conflicts. Giữ lại những conflicts ảnh hưởng **agent experience**:

| ID | Conflict | Utility Impact | Priority |
|----|----------|---------------|----------|
| UC-1 | Dual status: TaskStatus ↔ DelegationStatus | Agents parse wrong state → wrong delegation decisions | **P1** |
| UC-2 | Triple dispatch divergent errors | Agents cannot handle errors uniformly → brittle error recovery | **P1** |
| UC-3 | execute-slash-command lacks pre-dispatch validation | Silent failure on nonexistent command → trust erosion | **P1** |
| UC-4 | Notification fire-and-forget | Stale notification after restart → agent confusion | **P2** |
| UC-5 | Duplicate deriveSurface/deriveRecoveryGuarantee | Drift risk → inconsistent recovery behavior | **P2** |

---

## F) Recommended Batches

**Batch 1 — Guardrails (2-3 ngày, P1):** Fix UC-1 + UC-2 + UC-3
- Unify TaskStatus ↔ DelegationStatus
- Create DelegationError type, apply cho 3 dispatch paths
- Add requireCommand() + pressure gate + Zod cho execute-slash-command
- **Checkpoint:** typecheck pass, existing tests green, no behavioral change

**Batch 2 — Decomposition (4-5 ngày, P2):** Fix UC-4 + UC-5 + DelegationManager decomposition
- Extract dispatch strategy từ manager.ts
- Deduplicate deriveSurface/deriveRecoveryGuarantee
- Add notification TTL + 1 retry
- **Checkpoint:** manager.ts < 400 LOC, session-tracker parity

**Batch 3 — Polish (2-3 ngày, P3):** DI injection + structured error metadata
- Constructor injection cho poll intervals, PtyManager
- Structured error context trong delegation-status response
- **Checkpoint:** session-tracker parity score ≥ 4 cho mọi surface

---

*Tổng hợp: 2026-05-18 — 15 surfaces evaluated, 9 KEEP (≥16), 6 REWORK (12-15), 0 REPLACE. Harmony principle: extend innate, never replace.*
