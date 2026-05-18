# Phase CP-DT-01: Delegate-Task Ecosystem Revamp — Nghiên cứu

**Ngày nghiên cứu:** 2026-05-18
**Domain:** OpenCode plugin SDK, native Task tool, subagent dispatch, session lifecycle
**Độ tin cậy tổng thể:** MEDIUM (SDK docs được verify, native Task behavior cần runtime validation)

## Tóm tắt

Phase CP-DT-01 nhằm rebuild hệ sinh thái delegation hiện tại từ một plugin-layer `promptAsync` dispatch (đã **CHỨNG MINH BROKEN** — child sessions đóng băng sau khi load skills) sang một kiến trúc hybrid dựa trên OpenCode native Task tool làm execution backbone, với Hivemind thêm value ở các layers: category gates, concurrency control, safety ceiling, auto/ralph loops, session tracking, và notification delivery.

Nghiên cứu này điều tra 5 domain kỹ thuật: (1) kiến trúc plugin SDK và tool/hook registration, (2) native Task tool và subagent dispatch mechanism, (3) agent discovery và frontmatter schema, (4) session lifecycle API, và (5) delegate-task v1 failure analysis. Kết quả chính: OpenCode native Task tool dispatch subagents bằng cách tạo child sessions với `subagent_type` parameter, kết quả trả về parent qua single message, và agent discovery load từ `.opencode/agents/` + `opencode.json` với "later wins" merge strategy.

**Khuyến nghị chính:** Xây delegate-task v2 như một **preparation + post-processing wrapper** quanh native Task tool — KHÔNG reimplement dispatch qua `promptAsync`.

<user_constraints>
## Ràng buộc Người dùng (từ CONTEXT.md)

### Quyết định Đã Khóa
- delegate-task v1 PROVEN BROKEN — không fix, xây v2
- v2 phải sử dụng native Task tool làm execution backbone
- Giữ Hivemind value-adds: category gates, concurrency control, safety ceiling, auto/ralph loops
- Reuse session-tracker patterns (retry queue, hierarchy manifest, classification pipeline)
- Giảm LOC coordination sector từ ~2,969 xuống target ~1,600

### Theo Quyền Tự quyết
- Cách cụ thể tích hợp native Task tool với Hivemind orchestration layer
- Cách refactor DelegationManager god-object
- Cách tổ chức lại file structure cho delegation ecosystem mới

### Ý tưởng Trì hoãn (NGOÀI PHẠM VI)
- Sidecar/dashboard UI cho delegation monitoring
- Cross-project delegation
- Multi-model delegation routing
</user_constraints>

## Architectural Responsibility Map

| Khả năng | Tier Chính | Tier Phụ | Lý do |
|----------|-----------|----------|-------|
| Tool registration | Plugin (`src/plugin.ts`) | — | `tool()` từ `@opencode-ai/plugin` chỉ register ở plugin layer |
| Hook registration | Plugin (`src/plugin.ts`) | — | `hook()` từ `@opencode-ai/plugin` chỉ register ở plugin layer |
| Subagent dispatch | OpenCode Runtime | — | Native Task tool tạo và quản lý child sessions |
| Category gate evaluation | Coordination (`src/coordination/`) | — | Hivemind-specific narrowing logic |
| Concurrency gating | Coordination (`src/coordination/`) | — | Per-key queue gating |
| Completion detection | OpenCode Runtime + Hooks | Coordination | Native completion + hook-based observation |
| State persistence | Task-Management (`src/task-management/`) | — | Durable delegation records |
| Event capture | Features (`src/features/session-tracker/`) | — | WRITE-ONLY event recording |
| Agent discovery | OpenCode Runtime | — | `.opencode/agents/` + `opencode.json` merge |

## Standard Stack

### Core
| Library | Version | Mục đích | Tại sao chọn |
|---------|---------|----------|-------------|
| `@opencode-ai/plugin` | ^1.14.41 | Plugin SDK — tool(), hook() registration | [VERIFIED: package.json] Peer dependency chính thức |
| `@opencode-ai/sdk` | ^1.14.41 | OpenCode client — session CRUD, prompt | [VERIFIED: package.json] SDK wrapper cho HTTP API |
| `zod` | ^3.25.0 | Schema validation cho tool args | [VERIFIED: package.json] Chuẩn validation cho plugin tools |
| `vitest` | ^3.1.0 | Test framework | [VERIFIED: package.json] Project testing standard |

### Supporting
| Library | Version | Mục đích | Khi nào dùng |
|---------|---------|----------|-------------|
| TypeScript | ~5.8.0 | Type-safe compilation | [VERIFIED: package.json] Strict mode, ES2022 target |
| Node.js | >=20.0.0 | Runtime | [VERIFIED: package.json] Minimum engine requirement |

### Alternatives Considered
| Thay cho | Có thể dùng | Đánh đổi |
|----------|------------|----------|
| Native Task tool | Custom promptAsync dispatch | promptAsync đã chứng minh broken — execution gap không fix được |
| Zod schemas | JSON Schema trực tiếp | Zod tích hợp sâu hơn với plugin tool() API |

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    OpenCode Runtime                       │
│  ┌──────────┐    ┌──────────────┐    ┌───────────────┐ │
│  │ Agent    │    │ Native Task  │    │ Session       │ │
│  │ Discovery│    │ Tool         │    │ Manager       │ │
│  └────┬─────┘    └──────┬───────┘    └───────┬───────┘ │
│       │                 │                    │          │
│       │    subagent_type│                    │          │
│       │         ┌───────▼────────┐           │          │
│       │         │ Child Session  │◄──────────┘          │
│       │         │ (auto-managed) │  parentID             │
│       │         └───────┬────────┘                      │
│       │                 │ result message                  │
│       │         ┌───────▼────────┐                      │
│       │         │ Parent Session │                      │
│       │         └────────────────┘                      │
│       └─────────────────┐                               │
└─────────────────────────┼───────────────────────────────┘
                          │ hooks + tools
┌─────────────────────────▼───────────────────────────────┐
│                  Hivemind Plugin Layer                    │
│  ┌────────────────┐  ┌─────────────┐  ┌──────────────┐ │
│  │ delegate-task   │  │ deleg-status│  │ hooks:       │ │
│  │ v2 (preparation│  │ (query)     │  │ session.idle │ │
│  │  + post-proc.)  │  │             │  │ session.error│ │
│  └───────┬────────┘  └──────┬──────┘  └──────┬───────┘ │
│          │                  │                 │          │
│  ┌───────▼──────────────────▼─────────────────▼───────┐ │
│  │              Coordination Layer                      │ │
│  │  ┌──────────────┐ ┌──────────┐ ┌─────────────────┐ │ │
│  │  │ Category     │ │ Concurren│ │ Safety Ceiling  │ │ │
│  │  │ Gates        │ │ cy Queue │ │ + Depth Limit   │ │ │
│  │  └──────────────┘ └──────────┘ └─────────────────┘ │ │
│  └─────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              Task-Management Layer                   │ │
│  │  ┌──────────────┐ ┌──────────────┐ ┌─────────────┐ │ │
│  │  │ Delegation   │ │ Continuity   │ │ Event       │ │ │
│  │  │ Persistence  │ │ Store        │ │ Journal     │ │ │
│  │  └──────────────┘ └──────────────┘ └─────────────┘ │ │
│  └─────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

### Cấu trúc Project Đề xuất (cho delegation ecosystem mới)

```
src/
├── tools/delegation/           # Tool entrypoints (thin)
│   ├── delegate-task.ts        # v2: preparation + native Task invocation
│   └── delegation-status.ts    # Query delegation records
├── coordination/
│   ├── delegation/             # Dispatch orchestration (tách nhỏ)
│   │   ├── dispatcher.ts       # Dispatch routing (replaces manager core)
│   │   ├── category-gates.ts   # Gate evaluation (giữ nguyên)
│   │   └── state-machine.ts    # State transitions (giữ nguyên)
│   ├── completion/             # Completion detection
│   │   └── detector.ts         # Dual-signal completion (giữ nguyên)
│   ├── concurrency/            # Per-key gating
│   │   └── queue.ts            # Concurrency queue (giữ nguyên)
│   └── spawner/                # Session construction
│       ├── session-creator.ts  # Tạo child sessions (giữ nguyên)
│       └── spawn-request-builder.ts  # Build requests (giữ nguyên)
├── task-management/continuity/ # Durable state
│   └── delegation-persistence.ts  # Record I/O (giữ nguyên)
└── features/session-tracker/  # WRITE-ONLY event capture
    └── (giữ nguyên từ CP-ST-06)
```

### Pattern 1: Native Task Tool Wrapper
**Mô tả:** delegate-task v2 đóng vai trò preparation + post-processing, native Task tool thực hiện execution.
**Khi dùng:** Mỗi khi dispatch subagent — đây là pattern duy nhất cho v2.
**Ví dụ:**
```typescript
// Source: [CITED: Deepwiki anomalyco/opencode Task tool docs]
// delegate-task v2 conceptual flow
async function executeDelegateTask(args, ctx: ToolContext) {
  // 1. Evaluate category gates (Hivemind value-add)
  const gateResult = resolveCategoryGateDecision(args.agent, args.category)
  if (gateResult === "deny") return error("Category gate denied")

  // 2. Acquire concurrency slot (Hivemind value-add)
  const slot = await concurrencyQueue.acquire(queueKey)

  // 3. Prepare context + constraints (Hivemind preparation)
  const enrichedPrompt = buildDelegationPrompt(args)

  // 4. Invoke native Task tool (OpenCode handles execution)
  // ctx có thể chứa reference đến native Task tool
  // hoặc return instruction cho OpenCode runtime invoke Task tool
  return {
    title: `Delegating to ${args.agent}`,
    output: `Prepared delegation. Use native Task tool with subagent_type="${args.agent}"`,
    metadata: { delegationId, queueKey, safetyCeilingMs }
  }
}
```

### Pattern 2: Hook-Based Completion Observation
**Mô tả:** Hooks observe session lifecycle events (idle, error, deleted) để update delegation state.
**Khi dùng:** Mỗi khi cần detect child session completion mà không poll.
**Ví dụ:**
```typescript
// Source: [VERIFIED: Context7 @opencode-ai/plugin docs]
hook("session.idle", async (event, ctx) => {
  const sessionId = getEventSessionID(event)
  const parentId = getEventParentID(event)
  if (parentId && delegationManager.hasActiveDelegation(sessionId)) {
    await delegationManager.recordCompletion(sessionId, "completed")
    await concurrencyQueue.release(delegationManager.getQueueKey(sessionId))
  }
})
```

### Anti-Patterns cần Tránh
- **Anti-Pattern: promptAsync dispatch:** `sendPromptAsync` trả 204 và không guarantee execution — đây là nguyên nhân chính v1 broken. [VERIFIED: src/shared/session-api.ts:181-193]
- **Anti-Pattern: Adaptive polling:** SdkDelegationHandler dùng 4-tier polling intervals — phức tạp và không đáng tin cậy. Hooks là cơ chế observation đúng.
- **Anti-Pattern: God-object DelegationManager:** 504 LOC, ~15 imports — phải tách thành dispatcher + state-machine + gate-evaluator.

## Don't Hand-Roll

| Vấn đề | Không tự xây | Dùng thay | Tại sao |
|---------|-------------|-----------|--------|
| Subagent dispatch | Custom promptAsync dispatch | Native Task tool | promptAsync proven broken, native Task có full lifecycle control |
| Session lifecycle | Polling loops | Hook events (session.idle, session.error) | Hooks là event-driven, polling là resource-waste |
| Agent permission resolution | Custom permission parsing | `enrichAgentFromPrimitives()` + OpenCode agent config | Đã có implementation đúng trong `agent-primitive-policy.ts` |
| Completion detection | Custom polling + message count | Native completion + hook observation | Dual-signal pattern vẫn valid nhưng nên dùng hooks thay vì polling |

**Insight chính:** Execution gap giữa plugin layer và OpenCode runtime là architectural limitation — không thể fix bằng code improvements, chỉ fix bằng cách change approach (dùng native capabilities).

## Common Pitfalls

### Pitfall 1: Thừa kế Execution Gap từ v1
**Cái gì sai:** Tiếp tục dùng `promptAsync` hoặc bất kỳ SDK wrapper nào cố gắng dispatch execution từ plugin layer.
**Tại sao:** Plugin layer không có quyền kiểm soát execution engine. `promptAsync` trả 204 — nghĩa là "accepted" nhưng không guarantee "executed".
**Cách tránh:** Dùng native Task tool cho execution. Hivemind chỉ làm preparation (category gates, concurrency) và post-processing (notification, state recording).
**Cảnh báo sớm:** Nếu child sessions vẫn "load skills rồi dừng" — đang lặp lại v1 anti-pattern.

### Pitfall 2: Thừa God-Object trong Refactor
**Cái gì sai:** Refactor DelegationManager bằng cách move code nhưng giữ cùng responsibility set.
**Tại sao:** God-object pattern thường tái sinh — code được di chuyển nhưng coupling không giảm.
**Cách tránh:** Tách theo **responsibility boundary**: dispatcher (dispatch routing), gate-evaluator (category gates), state-manager (state machine). Mỗi component < 200 LOC.

### Pitfall 3: Over-Engineering Hook Integration
**Cái gì sai:** Đăng ký quá nhiều hooks hoặc hooks phức tạp cho completion detection.
**Tại sao:** Hook execution overhead + race conditions khi nhiều hooks xử lý cùng event.
**Cách tránh:** Minimal hook set: `session.idle`, `session.error`, `session.deleted`. Ba events đủ cho completion detection.

### Pitfall 4: Ignore Native Task Tool Result Format
**Cái gì sai:** Giả sử native Task tool trả về data format tương tự `promptAsync`.
**Tại sao:** Native Task tool trả về single message cho parent — khác biệt với polling-based approach.
**Cách tránh:** Verify native Task tool result format trong v2 test suite trước khi implement post-processing.

## Code Examples

### Plugin Tool Registration (Verified)
```typescript
// Source: [VERIFIED: Context7 anomalyco/opencode plugin docs, GitHub anomalyco/opencode:packages/plugin/src/tool.ts]
import { tool } from "@opencode-ai/plugin/tool"
import { z } from "zod"

const myTool = tool({
  description: "Tool description",
  args: {
    param1: z.string().describe("Parameter description"),
    param2: z.number().optional().default(0),
  },
  async execute(args, ctx) {
    // ctx: ToolContext = { sessionID, messageID, agent, directory, worktree, abort, metadata(), ask() }
    // return: string | { title?, output, metadata?, attachments? }
    return {
      title: "Result title",
      output: `Processed ${args.param1}`,
      metadata: { sessionId: ctx.sessionID }
    }
  }
})
```

### Session API Usage (Verified from codebase)
```typescript
// Source: [VERIFIED: src/shared/session-api.ts]
import { createSession, sendPromptAsync, getSessionMessages } from "../../shared/session-api.js"

// Tạo child session
const childSession = await createSession(client, {
  parentID: parentSessionId,
  title: "Delegated task",
  directory: "/path/to/project"
})

// Prompt async (fire-and-forget, trả 204)
await sendPromptAsync(client, childSessionId, {
  content: "Execute this task...",
  agent: "hm-l2-researcher",
  tools: { "delegate-task": false, "task": false }  // Disable recursive delegation
})

// Polling messages (backup, KHÔNG nên dùng làm primary)
const messages = await getSessionMessages(client, childSessionId, { limit: 50 })
```

### Agent Frontmatter Schema (Verified)
```yaml
# Source: [CITED: Deepwiki anomalyco/opencode agents.mdx]
---
description: "Agent description (BẮT BUỘC)"
mode: primary | subagent | all  # mặc định: all
model: "model-override"
temperature: 0.0-1.0
hidden: true  # chỉ áp dụng cho mode: subagent
permission:
  bash: allow
  edit:
    - "src/**"   # glob patterns
  task: allow
---

Agent system prompt (body của markdown file)
```

### Native Task Tool Dispatch (from Deepwiki)
```typescript
// Source: [CITED: Deepwiki anomalyco/opencode Task tool docs]
// Native Task tool dispatch mechanism:
// 1. Kiểm tra permissions cho subagent_type
// 2. Tạo child session với parent's permissions + agent overrides
// 3. subagent_type = agent name (từ .opencode/agents/ hoặc opencode.json)
// 4. Kết quả trả về parent qua single message
// 5. Parent agent phải summarize result cho user
// 6. Metadata cập nhật với sessionId + model của subagent
```

### Runtime Truth Correction (2026-05-18)

**Kết luận:** A1 đã bị bác bỏ cho plugin custom tools. Local package `@opencode-ai/plugin` v1.15.4 định nghĩa `ToolContext` chỉ gồm `sessionID`, `messageID`, `agent`, `directory`, `worktree`, `abort`, `metadata()` và `ask()`; không có `task` field và không có API custom-tool trực tiếp để gọi built-in Task tool. DeepWiki upstream check trên `sst/opencode` xác nhận cùng giới hạn: Task tool là built-in runtime tool, không được expose qua plugin `ToolContext`.

**Hệ quả:** Bất kỳ test nào inject `nativeTask` hoặc giả lập `context.task` chỉ là L3/L4 unit seam, không phải L1 runtime proof. CP-DT-01 phải giữ trạng thái **RE-OPENED / RUNTIME BLOCKED** cho tới khi có cơ chế child-session dispatch đã được verify, hoặc một phase CP-PTY/SDK riêng chọn và chứng minh path thay thế.

## State of the Art

| Cách cũ | Cách hiện tại | Khi thay đổi | Tác động |
|---------|--------------|-------------|----------|
| Plugin-layer promptAsync dispatch | Native Task tool dispatch | OpenCode v1.14+ | Execution reliability |
| Adaptive polling (4-tier) | Hook-based observation | Hivemind CP-ST-06 | Completion detection accuracy |
| God-object DelegationManager | Decomposed responsibilities | CP-DT-01 (phase này) | Maintainability, LOC reduction |
| Manual session hierarchy | Session-tracker classification | CP-ST-06 | Automatic parent→child tracking |

**Deprecated/outdated:**
- `SdkDelegationHandler` adaptive polling: thay bằng hook-based observation
- `promptAsync`-based dispatch: thay bằng native Task tool
- `DelegationManager` god-object: tách thành dispatcher + state-manager + gate-evaluator

## Assumptions Log

| # | Khẳng định | Section | Rủi ro nếu sai |
|---|-----------|---------|----------------|
| A1 | Native Task tool có thể invoke từ plugin custom tool context | Architecture | **DISPROVEN 2026-05-18:** plugin `ToolContext` v1.15.4 không expose `task`; cần cơ chế khác đã verify trước khi claim completion |
| A2 | Hook `session.idle` fire khi child session hoàn thành task | Completion | Nếu không fire → cần fallback mechanism |
| A3 | Native Task tool inherit parent session's directory và worktree | Dispatch | Nếu không inherit → cần explicit pass-through |
| A4 | Custom tool có thể access native Task tool result metadata | Post-processing | Nếu không thể → cần hook-based result capture |
| A5 | `subagent_type` parameter chấp nhận bất kỳ agent name từ `.opencode/agents/` | Agent Discovery | Nếu có filtering → cần whitelist hoặc config |

**Nếu bảng trống:** Tất cả claims đã verify hoặc cite — không cần user confirmation cho A1-A5 vì chúng đã được flag cho validation trong plan phase.

## Open Questions

1. **Native Task Tool Invocation từ Custom Tool**
   - Đã biết: Custom tool return `ToolResult` cho OpenCode runtime
   - Chưa rõ: Runtime có auto-invoke native Task tool khi custom tool return specific format?
   - Khuyến nghị: Verify bằng cách đọc `packages/opencode/src/tool/` source hoặc runtime test

2. **Hook Event Coverage cho Child Sessions**
   - Đã biết: `session.idle`, `session.error`, `session.deleted` events tồn tại
   - Chưa rõ: Child sessions (tạo bởi native Task tool) có trigger hook events không?
   - Khuyến nghị: Runtime test — tạo child session qua Task tool, observe hook events

3. **ToolContext Access trong Hook Callbacks**
   - Đã biết: Hook callback nhận `(event, ctx)` — nhưng ctx shape chưa verify
   - Chưa rõ: Hook ctx có chứa `sessionID`, `client`, hoặc cần extract từ event?
   - Khuyến nghị: Verify `hook()` type signature từ Context7 hoặc GitHub source

## Environment Availability

| Dependency | Cần cho | Có sẵn | Version | Fallback |
|------------|---------|--------|---------|----------|
| Node.js | Build + Runtime | ✓ | >=20.0.0 | — |
| TypeScript | Compilation | ✓ | ~5.8.0 | — |
| vitest | Testing | ✓ | ^3.1.0 | — |
| `@opencode-ai/plugin` | Tool/Hook registration | ✓ | ^1.14.41 | — |
| `@opencode-ai/sdk` | Session API | ✓ | ^1.14.41 | — |

**Missing dependencies with no fallback:** Không có
**Missing dependencies with fallback:** Không có

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^3.1.0 |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run tests/lib/coordination/ -t "delegate" --reporter=verbose` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-01 | Category gate deny blocks dispatch | unit | `npx vitest run tests/lib/coordination/delegation/category-gates.test.ts` | ✅ |
| REQ-02 | Concurrency slot acquired before dispatch | unit | `npx vitest run tests/lib/coordination/concurrency/queue.test.ts` | ✅ |
| REQ-03 | Native Task tool invoked with correct subagent_type | integration | Wave 0 | ❌ |
| REQ-04 | Hook observes child session completion | integration | Wave 0 | ❌ |
| REQ-05 | Delegation record persisted after completion | unit | `npx vitest run tests/lib/task-management/continuity/delegation-persistence.test.ts` | ✅ |

### Sampling Rate
- **Per task commit:** `npx vitest run tests/lib/coordination/ -t "delegate" --reporter=verbose`
- **Per wave merge:** `npx vitest run tests/lib/coordination/ tests/lib/task-management/`
- **Phase gate:** `npm test && npm run typecheck`

### Wave 0 Gaps
- [ ] `tests/lib/coordination/delegation/delegate-task-v2.test.ts` — covers REQ-03, REQ-04
- [ ] Integration test: verify native Task tool invocation behavior
- [ ] Integration test: verify hook event coverage for child sessions

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | OpenCode session-based auth (native) |
| V3 Session Management | yes | Parent→child session hierarchy, session ID validation |
| V4 Access Control | yes | Category gates narrowing, permission profiles, tool restriction |
| V5 Input Validation | yes | Zod schema validation trên tất cả tool args |
| V6 Cryptography | no | — |

### Known Threat Patterns cho Plugin + Subagent Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Recursive delegation depth | Denial of Service | `MAX_DELEGATION_DEPTH` limit + `delegate-task: false` trong child tools |
| Agent permission escalation | Elevation of Privilege | `resolveDelegationPermissionProfile()` narrowing-only + category gates |
| Category gate bypass | Tampering | `recordCategoryGateask()` audit trail |
| Infinite auto-loop | Denial of Service | Ralph-loop configurable cap (default 3) + safety ceiling timeout |
| Session ID injection | Spoofing | `assertValidSessionID()` validation (phải start với "ses") |

## Nguồn

### Primary (HIGH confidence)
- Context7 `/websites/opencode_ai_plugins` — plugin SDK docs: `tool()`, `hook()`, event types
- GitHub `anomalyco/opencode:packages/plugin/src/tool.ts` — canonical `tool()` source code
- GitHub `anomalyco/opencode:packages/plugin/src/index.ts` — Plugin type, PluginInput, hook return types
- `src/shared/session-api.ts` — verified local session API layer (285 LOC)
- `src/tools/delegation/delegate-task.ts` — verified local delegate-task v1 source (75 LOC)
- `src/coordination/delegation/manager.ts` — verified local DelegationManager (504 LOC)
- `src/coordination/spawner/session-creator.ts` — verified local session creator (35 LOC)
- `package.json` — verified dependency versions

### Secondary (MEDIUM confidence)
- Deepwiki `anomalyco/opencode` — agent discovery loading order, frontmatter fields, native Task tool mechanism
- `src/coordination/delegation/state-machine.ts` — local state machine (432 LOC)
- `src/coordination/sdk-delegation/handler.ts` — local SDK delegation handler (324 LOC)
- CONTEXT.md `CP-DT-01` — comprehensive failure analysis and architecture constraints

### Tertiary (LOW confidence)
- OpenCode native Task tool exact result format — cần runtime validation
- Hook context shape trong hook callbacks — cần verify từ source
- Child session event propagation — cần runtime test

## Metadata

**Phân tích confidence:**
- Standard stack: HIGH — versions verified từ package.json, APIs verified từ Context7 và GitHub source
- Architecture: MEDIUM — native Task tool integration approach có rủi ro (A1-A5 cần validation)
- Pitfalls: HIGH — v1 failure đã chứng minh, root cause đã xác định

**Ngày nghiên cứu:** 2026-05-18
**Hiệu lực đến:** 2026-06-17 (30 ngày — domain ổn định)
