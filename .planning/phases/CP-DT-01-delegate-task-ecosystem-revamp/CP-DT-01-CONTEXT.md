<!-- generated-by: gsd-doc-writer -->
# CP-DT-01: Delegate-Task Ecosystem Revamp — Context Document

**Ngày:** 2026-05-18
**Phase:** CP-DT-01
**Trạng thái:** Chưa bắt đầu (READY, sau khi WS-SR hoàn thành)
**Blockers trước đây:** BOOT-07, WS-SR — đã RESOLVED

---

## 1. Tổng quan Hệ sinh thái Delegation Hiện tại

### 1.1 File Inventory

Hệ sinh thái delegate-task hiện tại bao gồm **16 module** với tổng cộng **~2,969 LOC**, trải rộng qua 5 thư mục chính:

| # | File | LOC | Vai trò | Key Exports |
|---|------|-----|---------|-------------|
| 1 | `src/coordination/delegation/manager.ts` | 504 | **God-object** — Orchestrator trung tâm cho WaiterModel dispatch. Đánh giá category gates, acquire concurrency slots, dispatch qua SDK hoặc command mode, recover pending delegations khi startup. | `DelegationManager` |
| 2 | `src/coordination/delegation/state-machine.ts` | 432 | In-memory delegation store + state-transition machinery (safety ceiling, grace period cleanup, pruning). Tách ra từ manager.ts (Phase 36). | `DelegationStateMachine`, `canTransitionDelegationStatus`, `buildDelegationResult`, `deriveDelegationSurface`, `deriveRecoveryGuarantee`, `withContractDefaults` |
| 3 | `src/coordination/delegation/types.ts` | 140 | Type definitions cho delegation lifecycle: status, surface, recovery guarantee, terminal kinds, Delegation interface. | `DelegationStatus`, `DelegationSurface`, `DelegationRecoveryGuarantee`, `DelegationTerminalKind`, `Delegation` |
| 4 | `src/coordination/delegation/category-gates.ts` | 84 | Category gate logic — narrowing-only allow/ask decisions cho agent-category dispatch pairings. | `resolveCategoryGateDecision`, `DEFAULT_CATEGORY_GATE_POLICY` |
| 5 | `src/coordination/delegation/category-gate-audit.ts` | 41 | Persist compact category-gate denial evidence qua continuity governance writer. | `recordCategoryGateask` |
| 6 | `src/coordination/sdk-delegation/handler.ts` | 324 | **SDK delegation handler** — Adaptive polling loop với message count stability tracking. Tích hợp CompletionDetector cho dual-signal completion, pre-spawn polling, safety ceiling enforcement. | `SdkDelegationHandler` |
| 7 | `src/coordination/spawner/spawn-request-builder.ts` | 136 | Xây dựng DelegationSpawnRequest, resolve permission profiles từ agent primitives. | `buildSdkSpawnRequest`, `resolveDelegationPermissionProfile`, `ValidatedAgent`, `DelegateParams` |
| 8 | `src/coordination/spawner/agent-primitive-policy.ts` | 51 | Parse agent metadata từ OpenCode SDK (tool booleans, permission records), enrich agent config từ primitives. | `parseToolBooleans`, `parsePermissionRecord`, `enrichAgentFromPrimitives` |
| 9 | `src/coordination/spawner/session-creator.ts` | 35 | Tạo child session qua `client.session.create()`, extract session ID. | `spawnDelegatedSession` |
| 10 | `src/coordination/spawner/ralph-loop.ts` | 182 | Ralph-loop orchestration — validate-fix-redispatch cycle, configurable cap (default 3). Pure async function với injected validator/fixer. | `ralphLoop`, `RalphValidation`, `RalphFixResult`, `RalphLoopResult` |
| 11 | `src/coordination/spawner/auto-loop.ts` | 146 | Auto-loop orchestration — self-referential dev loop với injected dispatcher/verifier. Outcomes: completed, needs_continuation, failed. | `autoLoop`, `AutoLoopVerification` |
| 12 | `src/coordination/completion/detector.ts` | 157 | **CompletionDetector** — Watches session lifecycle events (idle, error, deleted), implements dual-signal completion (message stability + idle signal), caches terminal results. | `CompletionDetector`, `CompletionSignal`, `CompletionResult` |
| 13 | `src/coordination/completion/notification-handler.ts` | 242 | Notification delivery cho parent sessions. Fire-and-forget SDK prompt delivery, pending notification replay. | `buildNotificationMessage`, `notifyDelegationTerminal`, `replayPendingNotifications`, `recordNotification`, `hasUndeliveredNotifications` |
| 14 | `src/tools/delegation/delegate-task.ts` | 75 | **Tool entrypoint** — `delegate-task` tool registered qua `@opencode-ai/plugin/tool`. Zod schema validation, renders standardized response envelope. | `createDelegateTaskTool` |
| 15 | `src/tools/delegation/delegation-status.ts` | 135 | **Status polling tool** — `delegation-status` tool. Filters by ID hoặc status, renders delegation records với redacted secrets. | `createDelegationStatusTool` |
| 16 | `src/shared/session-api.ts` | 285 | **Session API layer** — Wrapper cho OpenCode SDK session operations: create, get, prompt, promptAsync, messages, abort, status map, parent chain walking. | `createSession`, `getSession`, `sendPrompt`, `sendPromptAsync`, `getSessionMessages`, `getSessionMessageCount`, `abortSession`, `getSessionID`, `getParentID`, `walkParentChain`, `getSessionBehavioralProfile` |

### 1.2 Dependency Graph (Simplified)

```
delegate-task.ts (tool)
  └─→ DelegationManager (manager.ts)
        ├─→ DelegationStateMachine (state-machine.ts)
        │     └─→ delegation-persistence.ts [task-management]
        │     └─→ notification-handler.ts
        ├─→ SdkDelegationHandler (handler.ts)
        │     └─→ CompletionDetector (detector.ts)
        │     └─→ session-api.ts [shared]
        ├─→ resolveCategoryGateDecision (category-gates.ts)
        ├─→ recordCategoryGateask (category-gate-audit.ts)
        ├─→ spawnDelegatedSession (session-creator.ts)
        │     └─→ session-api.ts [shared]
        ├─→ buildSdkSpawnRequest (spawn-request-builder.ts)
        │     └─→ enrichAgentFromPrimitives (agent-primitive-policy.ts)
        ├─→ DelegationConcurrencyQueue [concurrency]
        └─→ runtime-policy.ts [shared]

delegation-status.ts (tool)
  └─→ DelegationManager → DelegationStateMachine
  └─→ delegation-persistence.ts [task-management]
```

### 1.3 Vấn đề Kiến trúc Chính

- **God-object:** `DelegationManager` (504 LOC) import từ ~15 module, nắm quá nhiều trách nhiệm: dispatch routing, category gate evaluation, concurrency gating, recovery, notification scheduling
- **State-machine tách nhưng vẫn coupling:** `DelegationStateMachine` (432 LOC) tách code nhưng DelegationManager vẫn forward toàn bộ public queries/operations qua nó
- **SdkDelegationHandler** (324 LOC) chứa adaptive polling logic phức tạp với 4 interval tiers — đây là thành phần **BROKEN** (xem Section 2)
- **Tổng LOC coordination:** ~2,969 LOC — vượt xa target architecture ~1,600 LOC cho coordination sector

---

## 2. Bằng chứng Lỗi Đã Chứng minh (Proven Failure Evidence)

### 2.1 Triệu chứng

**delegate-task v1 PROVEN BROKEN:** Dispatch OK (returns immediately với delegation ID) nhưng child sessions **đóng băng** sau khi khởi tạo.

Chi tiết cụ thể từ 2 lần delegation thực tế:

| Thông số | Giá trị quan sát |
|----------|-----------------|
| **Lần thử** | 2 delegation attempts |
| **Dispatch result** | OK — trả về delegation ID ngay lập tức |
| **Child session status** | Created, `promptAsync` trả HTTP 204 |
| **Child session behavior** | Load 3 skills rồi **DỪNG** |
| **Tool calls sau 30 phút** | **0 tool calls** |
| **Thời gian chờ** | Cả 2 timeout ở 29m59s |
| **promptAsync response** | HTTP 204 (no content) — dispatch layer OK |

### 2.2 Root Cause (Đã xác định một phần)

- **Dispatch layer:** HOẠT ĐỘNG — `promptAsync` trả 204, child session được tạo thành công
- **Execution layer:** **BROKEN** — child sessions nhận prompt, load skills, nhưng **không bao giờ thực thi tool call nào**
- **Nguyên nhân chính xác:** CHƯA XÁC ĐỊNH — child sessions load skills nhưng dừng ở đó, không vào execution loop

### 2.3 Hệ quả

- Hệ thống delegation hiện tại **KHÔNG THỂ SỬ DỤNG ĐƯỢC** cho production
- Tất cả agent workflows phụ thuộc delegation (hm-orchestrator, hm-coordinator, parallel agents) **đều broken**
- Session-tracker vẫn capture events chính xác — vấn đề nằm ở execution layer, không phải monitoring layer

---

## 3. Kiến thức Session-Tracker Áp dụng cho Delegation

### 3.1 Tổng quan CP-ST-06 (Session Tracker Root Cause Rewrite)

Phase CP-ST-06 đã hoàn thành rewrite session-tracker với **418/418 tests pass**. Các khái niệm và patterns đã chứng minh hoạt động đúng:

| Khái niệm | Mô tả | Áp dụng cho Delegation |
|-----------|-------|----------------------|
| **Session Classification** | Phân loại main/sub/standalone dựa trên environment variables (`OPENCODE_SESSION_ID`) | Delegation cần biết chính xác child session type để routing events đúng |
| **Child Session Recording** | Child writer persist child session data với retry queue (exponential backoff) | Delegation records cần persistence layer tương tự |
| **Hierarchy Manifest** | Track parent→child relationships qua `hierarchy-manifest.ts` | Delegation hierarchy cần map chính xác parent-child sessions |
| **Retry Queue** | `ChildWriteRetryQueue` với exponential backoff (1s→2s→4s→8s→16s), max 5 retries | Delegation persistence nên reuse pattern này |
| **Session Router** | Classify sessions: main/sub/standalone dựa trên env vars | Delegation dispatch cần detect parent context để set env vars đúng cho child |
| **Degraded Persistence** | Fallback write `retry-degraded.json` khi retry queue exhausted | Delegation nên có degraded mode tương tự |

### 3.2 Kiến trúc Session-Tracker có thể Reuse

```
src/features/session-tracker/
├── index.ts                    # Public API surface
├── types.ts                    # Bounded type definitions
├── capture/
│   ├── event-capture.ts        # Event capture với writeImmediateChildFile
│   └── pipeline.ts             # Classification → routing → persistence pipeline
├── persistence/
│   ├── child-writer.ts         # Child data persistence + retry queue integration
│   ├── retry-queue.ts          # Exponential backoff retry queue
│   └── hierarchy-manifest.ts   # Parent→child relationship tracking
├── routing/
│   └── session-router.ts       # Session classification logic
└── cleanup.ts                  # Lifecycle cleanup
```

### 3.3 Bài học từ CP-ST-06

1. **WRITE-ONLY pattern hoạt động tốt** — session-tracker chỉ capture và persist, không trigger side effects
2. **Retry queue với degraded fallback** — đảm bảo không mất data kể cả khi disk write fails
3. **Hierarchical manifest** — parent→child tracking đơn giản và hiệu quả
4. **418 tests cho một module** — testing density cao cho thấy coverage phải sâu cho từng thành phần
5. **Classification pipeline** — tách biệt rõ ràng giữa classification, routing, và persistence

---

## 4. Gap Analysis: OpenCode Native Task vs delegate-task

### 4.1 So sánh

| Tiêu chí | OpenCode Native `Task` Tool | Hivemind `delegate-task` (Custom Tool) |
|----------|---------------------------|---------------------------------------|
| **Cơ chế** | Built-in vào OpenCode runtime | Plugin-layer wrapper quanh `promptAsync` |
| **Độ tin cậy** | ✅ Hoạt động ổn định, đã verify | ❌ BROKEN — child sessions đóng băng |
| **Kiểm soát lifecycle** | OpenCode quản lý toàn bộ lifecycle | Plugin cố gắng quản lý qua polling + hooks |
| **Completion detection** | Native — OpenCode biết khi nào task done | Custom — adaptive polling với 4 interval tiers |
| **Session hierarchy** | Native parent→child tracking | Custom hierarchy manifest (session-tracker) |
| **Tool access** | Agent config xác định tools available | `agent-primitive-policy.ts` resolve permissions |
| **Concurrency** | OpenCode native scheduling | `DelegationConcurrencyQueue` per-key gating |
| **Category gates** | Không có — bất kỳ agent nào cũng gọi | `resolveCategoryGateDecision` narrowing-only |
| **Safety ceiling** | Không có built-in | `DEFAULT_SAFETY_CEILING_MS` configurable |
| **Auto/ralph loops** | Không có | `auto-loop.ts`, `ralph-loop.ts` |

### 4.2 Chênh lệch Kiến trúc Cốt lõi

Sự khác biệt quan trọng nhất:

- **Native Task** chạy **BÊN TRONG** OpenCode runtime — OpenCode có full control over child session lifecycle, tool execution, và completion signaling
- **delegate-task** chạy **QUA PLUGIN LAYER** — plugin gọi `promptAsync` (SDK wrapper) rồi poll để detect completion. Điều này tạo ra một **execution gap**: child session nhận prompt nhưng execution engine không được trigger đúng cách

### 4.3 Hướng Thiết kế v2

Thiết kế v2 **PHẢI** hoạt động HỢP VỚI OpenCode native capabilities, không chống lại chúng:

1. **Sử dụng native Task tool làm execution backbone** — không reimplement qua plugin layer
2. **Hivemind thêm value** ở layers trên: category gates, concurrency control, safety ceiling, auto/ralph loops, session tracking
3. **Không dùng `promptAsync`** làm primary dispatch mechanism — nó trả 204 và delegate execution cho runtime, nhưng plugin layer không có đủ control để đảm bảo execution xảy ra
4. **Hybrid approach:** Hivemind tools prepare context + constraints, native Task tool thực hiện execution

---

## 5. Ngữ cảnh Kiến trúc

### 5.1 Plugin Loading

- Hivemind plugin load qua `.opencode/plugins/harness-control-plane.ts`
- Plugin thin wrapper re-export `dist/`
- `src/plugin.ts` là composition root — wire dependencies, register tools + hooks

### 5.2 Tool và Hook Registration

```typescript
// Plugin pattern (từ src/plugin.ts)
import { tool } from "@opencode-ai/plugin/tool"
import { hook } from "@opencode-ai/plugin/hook"

// Tools = write-side (CQRS mutation authority)
const delegateTask = createDelegateTaskTool(delegationManager)
const delegationStatus = createDelegationStatusTool(delegationManager)

// Hooks = read-side (event observation, response shaping)
// Hooks observe lifecycle events, route to CompletionDetector
```

### 5.3 CQRS Model

| Layer | Vai trò | Ví dụ |
|-------|---------|-------|
| **Tools** (write-side) | Execute mutation commands | `delegate-task`, `delegation-status` |
| **Hooks** (read-side) | Observe events, shape responses | `session.idle`, `session.error`, `session.deleted` → CompletionDetector |
| **Coordination** | Orchestration logic | DelegationManager, CompletionDetector, ConcurrencyQueue |
| **Task-Management** | Durable state persistence | delegation-persistence.ts, continuity.ts |
| **Session-Tracker** | WRITE-ONLY event capture | event-capture.ts, child-writer.ts |

### 5.4 9-Surface Authority Model

Delegation ecosystem liên quan đến các surfaces sau:

| Surface | Authority | Module |
|---------|-----------|--------|
| **Tool registration** | `src/plugin.ts` | `tool()` từ `@opencode-ai/plugin` |
| **Hook registration** | `src/plugin.ts` | `hook()` từ `@opencode-ai/plugin` |
| **Dispatch orchestration** | `src/coordination/delegation/` | DelegationManager |
| **Completion detection** | `src/coordination/completion/` | CompletionDetector |
| **Session creation** | `src/shared/session-api.ts` | `createSession`, `sendPromptAsync` |
| **State persistence** | `src/task-management/continuity/` | delegation-persistence.ts |
| **Event capture** | `src/features/session-tracker/` | WRITE-ONLY |
| **Concurrency gating** | `src/coordination/concurrency/` | DelegationConcurrencyQueue |
| **Runtime policy** | `src/shared/runtime-policy.ts` | Safety ceiling, depth limits |

### 5.5 Ràng buộc Kiến trúc

- **Max 500 LOC per module** — DelegationManager hiện tại ở đúng giới hạn (504)
- **No circular dependencies** — dependency graph phải DAG
- **No `any` types** trong code mới
- **`[Harness]` prefix** trên tất cả thrown errors
- **Deep-clone-on-read** trong continuity store
- **`.hivemind/`** là canonical state root — **KHÔNG** lưu state trong `.opencode/`

---

## 6. Tổng kết và Khuyến nghị cho Phase CP-DT-01

### 6.1 Vấn đề Cốt lõi

Hệ sinh thái delegation hiện tại có **2,969 LOC** trải qua **16 module**, với một god-object `DelegationManager` phụ thuộc vào ~15 module khác. Execution layer qua `promptAsync` đã **CHỨNG MINH BROKEN** — child sessions load skills nhưng không execute tool calls.

### 6.2 Nguyên nhân Gốc

Plugin-layer `promptAsync` dispatch **không đủ quyền kiểm soát** execution lifecycle. OpenCode runtime quản lý execution, nhưng plugin chỉ nhận 204 response và phải poll để detect completion. Execution gap này không thể fix bằng polling improvements.

### 6.3 Hướng Giải quyết

1. **Không fix v1** — execution gap là architectural limitation, không phải bug
2. **Xây v2 dựa trên native Task tool** — sử dụng OpenCode's built-in subagent capability làm execution backbone
3. **Giữ Hivemind value-adds** — category gates, concurrency control, safety ceiling, auto/ralph loops, session tracking, notification delivery
4. **Reuse session-tracker patterns** — retry queue, hierarchy manifest, classification pipeline đã chứng minh hoạt động (418/418 tests)
5. **Giảm LOC** — coordination sector hiện tại ~2,969 LOC, target ~1,600 LOC
