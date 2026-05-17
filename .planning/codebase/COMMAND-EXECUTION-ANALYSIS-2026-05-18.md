# Phân Tích Cluster A: Command Execution

**Ngày phân tích:** 2026-05-18
**Phạm vi:** Command dispatch, discovery, contract analysis, route preview

---

## A) Source Doc — Chi tiết từng file nguồn

### A1. `src/tools/session/execute-slash-command.ts` (152 LOC)

| Khía cạnh | Chi tiết |
|-----------|----------|
| **Mục đích** | Write-side tool — dispatch slash command qua TUI prompt pipeline |
| **Exports** | `createExecuteSlashCommandTool(client): ToolDefinition` |
| **Args schema** | Inline `tool.schema` — `command` (string), `arguments?`, `agent?`, `model?` |
| **State** | Không có internal state. Stateless dispatch |
| **Errors** | Phân loại `bad_request | not_found | internal` dựa trên regex status code |
| **Dependencies** | `@opencode-ai/plugin` (`tool`, `PluginInput`, `ToolDefinition`), `client.tui.*` |
| **Key flow** | `clearPrompt()` → `appendPrompt({text})` → `submitPrompt()` |
| **Ghi chú** | KHÔNG dùng `session.command()` vì bị queue khi session đang busy. Dùng TUI path bypass |

### A2. `src/tools/hivemind/hivemind-command-engine.ts` (67 LOC)

| Khía cạnh | Chi tiết |
|-----------|----------|
| **Mục đích** | Read-side tool — discovery, contract analysis, context render, transform, preview |
| **Exports** | `createHivemindCommandEngineTool(projectRoot)`, `executeCommandEngineToolAction()`, `CommandEngineToolInputSchema` |
| **Args schema** | Delegated to `CommandEngineToolInputSchema` từ `src/schema-kernel/` |
| **State** | Không có. Mọi action delegate xuống `src/routing/command-engine/` |
| **Errors** | Catch-all → `renderToolResult(error(message))` |
| **Dependencies** | `src/routing/command-engine/index.js`, `src/schema-kernel/command-engine.schema.js`, `src/shared/tool-response.js`, `src/shared/tool-helpers.js` |
| **Actions** | `discover`, `analyze_contract`, `render_context`, `transform_messages`, `route_preview`, `list_commands` |

### A3. `src/routing/command-engine/index.ts` (223 LOC)

| Khía cạnh | Chi tiết |
|-----------|----------|
| **Mục đích** | Core engine — discovery, contract analysis, bounded context render, message transform, route preview |
| **Exports** | `discoverCommandBundles()`, `analyzeCommandContract()`, `renderCommandContext()`, `transformCommandMessages()`, `routeCommandPreview()`, `executeCommandEngineAction()`, `listCommands()`, re-export types |
| **State** | Không có durable state. Discovery gọi `loadPrimitives()` mỗi lần |
| **Errors** | `[Harness]` prefix errors khi `commandName` missing hoặc command not found |
| **Dependencies** | `src/features/bootstrap/primitive-loader.js`, `src/features/runtime-pressure/index.js`, `./types.js` |
| **Constants** | `DEFAULT_CONTEXT_LIMIT=4000`, `MAX_CONTEXT_LIMIT=16000`, `COMMAND_FAILURE_STATES` |
| **Internal helpers** | `requireCommand()`, `normalizeContextLimit()`, `resolveRouteStatus()` |

### A4. `src/routing/command-engine/types.ts` (175 LOC)

| Khía cạnh | Chi tiết |
|-----------|----------|
| **Mục đích** | Type contracts cho toàn bộ command-engine surface |
| **Key types** | `CommandBundle`, `CommandDiscoveryResult`, `CommandFailureState`, `CommandContractAnalysis`, `CommandContextRenderInput/Result`, `CommandMessage`, `CommandMessageTransformInput/Result`, `CommandRoutePreviewInput`, `CommandRoutePreview`, `CommandListEntry`, `CommandListResult`, `CommandEngineActionInput` |
| **Dependencies** | `src/features/runtime-pressure/types.js` — `PressureDecision` |

### A5. `src/schema-kernel/command-engine.schema.ts` (32 LOC)

| Khía cạnh | Chi tiết |
|-----------|----------|
| **Mục đích** | Zod validation cho command-engine tool input |
| **Schemas** | `CommandEngineActionSchema` (6 enum values), `CommandEngineMessageSchema`, `CommandEngineToolInputSchema` |
| **Inferred type** | `CommandEngineToolInput` |

### A6. `src/shared/types.ts` — Command-relevant parts

File này không chứa command-specific types. Task status, delegation, permissions, session types nằm ở đây nhưng không liên quan trực tiếp đến command execution flow.

---

## B) Data Flow

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                          AGENT (LLM)                                     │
│  "Tôi muốn chạy /gsd-stats"                                             │
└─────────────┬────────────────────────────┬───────────────────────────────┘
              │                            │
    ┌─────────▼──────────┐      ┌─────────▼──────────────────────────┐
    │ execute-slash-     │      │ hivemind-command-engine            │
    │ command (WRITE)    │      │ (READ)                             │
    │ `src/tools/session/│      │ `src/tools/hivemind/               │
    │ execute-slash-     │      │ hivemind-command-engine.ts`        │
    │ command.ts`        │      │                                    │
    └─────────┬──────────┘      └─────────┬──────────────────────────┘
              │                           │
              │  TUI SDK path             │ Zod validate → delegate
              │  (clearPrompt →           │
              │   appendPrompt →          ▼
              │   submitPrompt)   ┌───────────────────────────────────┐
              │                  │ executeCommandEngineAction()       │
              │                  │ `src/routing/command-engine/       │
              │                  │ index.ts`                          │
              │                  │                                    │
              │                  │ switch(action):                    │
              │                  │  discover ──► discoverCommandBundles()
              │                  │  list ──────► listCommands()        │
              │                  │  contract ──► analyzeCommandContract()
              │                  │  context ───► renderCommandContext()│
              │                  │  transform ─► transformMessages()  │
              │                  │  preview ───► routeCommandPreview()│
              │                  └───────┬───────────────────────────┘
              │                          │
              │              ┌───────────▼───────────┐
              │              │ loadPrimitives()       │
              │              │ `src/features/bootstrap│
              │              │ /primitive-loader.ts`  │
              │              │                        │
              │              │ Đọc `.opencode/        │
              │              │ commands/*.md`         │
              │              └───────────┬───────────┘
              │                          │
              │              ┌───────────▼───────────┐
              │              │ detectRuntimePressure()│
              │              │ `src/features/         │
              │              │ runtime-pressure/`     │
              │              └───────────────────────┘
              │
    ┌─────────▼──────────┐
    │ OpenCode TUI       │
    │ Prompt Pipeline    │
    │                    │
    │ Nhận prompt text,  │
    │ dispatch slash cmd │
    └────────────────────┘
```

**Luồng chính:**
1. Agent gọi `hivemind-command-engine` (discover/list) → khám phá commands có sẵn
2. Agent gọi `execute-slash-command` → dispatch qua TUI pipeline
3. `execute-slash-command` KHÔNG gọi `hivemind-command-engine` — hai tool hoàn toàn độc lập

---

## C) Conflicts — execute-slash-command vs command-engine

### C1. Trùng lặp chức năng

| Khía cạnh | execute-slash-command | hivemind-command-engine |
|-----------|----------------------|------------------------|
| **Vai trò CQRS** | Write-side (dispatch) | Read-side (discover/preview) |
| **Schema validation** | Inline `tool.schema` — KHÔNG dùng Zod schema riêng | Zod `CommandEngineToolInputSchema` |
| **Dependency path** | Chỉ `client.tui.*` — không gọi command-engine | `src/routing/command-engine/` → `primitive-loader` |
| **Command name field** | `command` (string) | `commandName` (optional string) |
| **Error handling** | Custom error classification with regex | Generic catch-all → shared envelope |
| **Metadata** | Direct output object với `metadata` và `output` | `renderToolResult(success/error(...))` |

### C2. Vấn đề thực sự

1. **Không có pre-dispatch validation:** `execute-slash-command` dispatch thẳng TUI mà KHÔNG kiểm tra command có tồn tại. Có thể gửi command không tồn tại → TUI báo lỗi, agent không biết trước
2. **Schema不一致:** Write-side dùng inline schema, read-side dùng Zod schema → maintain hai bộ validation
3. **Agent name field khác nhau:** `command` vs `commandName` → agent cần nhớ hai naming convention
4. **Không có pressure gate trên write-side:** `execute-slash-command` không check pressure, trong khi `route_preview` có `detectRuntimePressure()`
5. **Không có integration giữa hai tool:** `execute-slash-command` không gọi `command-engine` để validate trước khi dispatch

### C3. Đề xuất resolve

- `execute-slash-command` nên gọi `requireCommand()` từ `src/routing/command-engine/` trước khi dispatch
- Nên dùng chung Zod schema hoặc ít nhất thống nhất field naming
- Pressure check nên được apply ở cả write-side

---

## D) OpenCode Innate Compare

### D1. OpenCode built-in command dispatch

OpenCode có sẵn slash command dispatch qua:
- User gõ trực tiếp trong TUI prompt
- `session.command()` — NHƯNG bị queue khi session busy (đã document trong A1)

### D2. Hivemind thêm gì?

| Khả năng | OpenCode Innate | Hivemind |
|----------|----------------|----------|
| **Programmatic dispatch** | `session.command()` (blocking/queued) | `execute-slash-command` qua TUI pipeline (non-blocking) |
| **Command discovery** | Không có tool-level API | `hivemind-command-engine` discover/list |
| **Contract analysis** | Không có | `analyzeContract()` với failure states |
| **Route preview** | Không có | `routeCommandPreview()` với pressure check |
| **Context rendering** | Không có | `renderCommandContext()` với bounded limits |
| **Message transform** | Không có | `transformCommandMessages()` |
| **Agent/Model override** | Chỉ qua TUI manual | `@agent` và `model` args |

### D3. Giá trị cốt lõi

Hivemind command execution cluster cung cấp **agent-first command orchestration** — cho phép LLM agent discovery, preview, và dispatch commands một cách có cấu trúc thay vì blind dispatch. Đây là unique value mà OpenCode innate không có.

---

## E) 9 Criteria Scores (1-5)

| # | Tiêu chí | Score | Ghi chú |
|---|----------|-------|---------|
| 1 | **Single Responsibility** | 4 | Mỗi file có trách nhiệm rõ ràng. Trừ `index.ts` handle 6 actions trong switch |
| 2 | **Type Safety** | 5 | Zod schemas, TypeScript strict, typed exports. Không có `any` trong command flow |
| 3 | **Error Handling** | 3 | Write-side dùng regex classify errors (fragile). Read-side generic catch-all. Thiếu structured error codes |
| 4 | **Test Coverage** | ? | Cần kiểm tra tests/ thực tế. Dựa vào docs, schema tests tồn tại |
| 5 | **CQRS Compliance** | 4 | Rõ ràng write-side (dispatch) vs read-side (discover). Nhưng write-side thiếu pre-validation |
| 6 | **Dependency Direction** | 5 | Tool → routing → features. Không circular. Leaf-like shared stays leaf |
| 7 | **Consistency** | 3 | Field naming khác nhau (`command` vs `commandName`), schema approach khác nhau (inline vs Zod) |
| 8 | **Documentation** | 5 | JSDoc đầy đủ, AGENTS.md ở mỗi level, comments giải thích TUI vs session.command() |
| 9 | **OpenCode Integration** | 4 | TUI pipeline bypass là giải pháp đúng. Nhưng không có pre-dispatch validation |

**Trung bình:** ~4.2 / 5 (bỏ qua #4 vì cần runtime evidence)

---

*Phân tích Cluster A — command execution — 2026-05-18*
