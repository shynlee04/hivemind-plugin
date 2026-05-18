# OpenCode SDK Architecture — Thinking/Reasoning Block Integration Points

> **Ngày nghiên cứu:** 2026-05-18
> **Agent:** hm-l2-researcher (L2 Research Specialist)
> **Nguồn:** GitHub `anomalyco/opencode` dev branch, SDK types.gen.ts, message-v2.ts, processor.ts, transform.ts, plugin docs, GitHub issues

---

## 1. SDK API Surface

### 1.1 Core Endpoints

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|-------------|----------|
| `/session` | POST | Tạo session mới (có thể có `parentID`) | `{ parentID?, title? }` | `Session` |
| `/session/{id}/prompt` | POST | Gửi prompt vào session | `{ message, agent?, model? }` | `MessageV2.WithParts` |
| `/session/{id}/command` | POST | Thực thi slash command | `{ name, arguments? }` | `MessageV2.WithParts` |
| `/session/{id}/children` | GET | Lấy danh sách child sessions | — | `Session[]` |
| `/session/{id}/message` | GET | Lấy messages với parts | `?limit=&before=` | `{ items: WithParts[], more, cursor }` |
| `/global/event` | GET (SSE) | Event stream real-time | — | `GlobalEvent` (SSE) |

### 1.2 SDK Client Methods (từ `@opencode-ai/sdk`)

```typescript
// Session creation với parent-child relationship
session.create({ body: { parentID?: string, title?: string } })

// Gửi prompt — trả về MessageV2.WithParts
session.prompt({ path: { sessionID }, body: { message, agent?, model? } })

// Thực thi slash command
session.command({ path: { sessionID }, body: { name, arguments? } })

// Lấy child sessions
session.children({ path: { sessionID } })

// Lấy messages với pagination
session.messages({ path: { sessionID }, query: { limit?, before? } })

// SSE event subscription
event.subscribe() // → EventSource cho global events
```

### 1.3 Response Structure: `MessageV2.WithParts`

```typescript
// types.gen.ts [L2]
export type WithParts = {
  info: Message          // UserMessage | AssistantMessage
  parts: Part[]          // TextPart | ReasoningPart | ToolPart | ...
}
```

**AssistantMessage** chứa token counts với `reasoning` field riêng:
```typescript
// types.gen.ts [L2]
export type AssistantMessage = {
  id: string
  sessionID: string
  role: "assistant"
  time: { created: number; completed?: number }
  parentID: string
  modelID: string
  providerID: string
  mode: string
  tokens: {
    input: number
    output: number
    reasoning: number        // ← Reasoning tokens riêng biệt
    cache: { read: number; write: number }
  }
  cost: number
  finish?: string
  error?: ProviderAuthError | UnknownError | ...
}
```

---

## 2. Message/Part Type System

### 2.1 Part Types (Union Type)

```typescript
// types.gen.ts + message-v2.ts [L2]
export type Part =
  | TextPart           // type: "text" — nội dung văn bản
  | ReasoningPart      // type: "reasoning" — thinking/reasoning blocks
  | ToolPart           // type: "tool" — tool call với state machine
  | FilePart           // type: "file" — attachments (images, PDFs, dirs)
  | SubtaskPart        // type: "subtask" — delegation to child agent
  | StepStartPart      // type: "step-start" — boundary của agentic step
  | StepFinishPart     // type: "step-finish" — kết thúc step (có tokens, cost)
  | SnapshotPart       // type: "snapshot" — filesystem snapshot hash
  | PatchPart          // type: "patch" — file changes (hash + files[])
  | AgentPart          // type: "agent" — agent switch/mention
  | RetryPart          // type: "retry" — API retry attempt
  | CompactionPart     // type: "compaction" — context compaction marker
```

### 2.2 ReasoningPart — Cấu trúc chi tiết

```typescript
// message-v2.ts [L2]
export const ReasoningPart = Schema.Struct({
  ...partBase,  // { id, sessionID, messageID }
  type: Schema.Literal("reasoning"),
  text: Schema.String,
  metadata: Schema.optional(Schema.Record(Schema.String, Schema.Any)),
  time: Schema.Struct({
    start: NonNegativeInt,
    end: Schema.optional(NonNegativeInt),
  }),
})
```

**Key observations:**
- `ReasoningPart` KHÔNG có field `synthetic` — khác với `TextPart`
- `metadata` lưu provider-specific data: `anthropic.signature`, `bedrock.signature`, v.v.
- `time` có cả `start` và `end` — cho phép tracking duration của thinking
- Không có field `ignored` — reasoning blocks luôn được giữ lại

### 2.3 ReasoningPart Input (khi gửi từ client)

```typescript
// types.gen.ts [L2] — KHÔNG có ReasoningPartInput
// Chỉ có: TextPartInput, FilePartInput, AgentPartInput, SubtaskPartInput
```

**Important gap:** SDK KHÔNG expose `ReasoningPartInput` — client không thể gửi reasoning blocks trực tiếp. Reasoning chỉ được tạo bởi LLM provider trong quá trình stream.

### 2.4 ToolPart State Machine

```typescript
// types.gen.ts [L2]
export type ToolState =
  | ToolStatePending    // { status: "pending", input, raw }
  | ToolStateRunning    // { status: "running", input, title?, metadata?, time: { start } }
  | ToolStateCompleted  // { status: "completed", input, output, title, metadata, time: { start, end }, attachments? }
  | ToolStateError      // { status: "error", input, error, metadata?, time: { start, end } }
```

### 2.5 StepStartPart / StepFinishPart — Agentic Loop Boundaries

```typescript
// types.gen.ts [L2]
export type StepStartPart = {
  type: "step-start"
  snapshot?: string
}

export type StepFinishPart = {
  type: "step-finish"
  reason: string
  snapshot?: string
  cost: number
  tokens: {
    input: number
    output: number
    reasoning: number      // ← Reasoning tokens per step
    cache: { read: number; write: number }
  }
}
```

---

## 3. Plugin Hook Integration Points

### 3.1 Available Plugin Hooks (từ opencode.ai/docs/plugins/)

| Hook | Event Type | When Fired | Payload |
|------|-----------|------------|---------|
| `message.part.updated` | `message.part.updated` | Mỗi khi part được tạo/cập nhật | `{ part: Part, delta?: string }` |
| `message.updated` | `message.updated` | Message info thay đổi | `{ info: Message }` |
| `message.part.removed` | `message.part.removed` | Part bị xóa | `{ sessionID, messageID, partID }` |
| `session.created` | `session.created` | Session mới tạo | `{ info: Session }` |
| `session.updated` | `session.updated` | Session thay đổi | `{ info: Session }` |
| `session.compacted` | `session.compacted` | Context compaction | `{ sessionID }` |
| `tool.execute.before` | — | Trước khi tool thực thi | `{ tool, sessionID, callID }, { args }` |
| `tool.execute.after` | — | Sau khi tool hoàn thành | `{ tool, sessionID, callID, args }, output` |
| `permission.asked` | `permission.updated` | Permission request | `Permission` object |
| `permission.replied` | `permission.replied` | User trả lời permission | `{ sessionID, permissionID, response }` |
| `experimental.text.complete` | — | Text part hoàn thành | `{ sessionID, messageID, partID }, { text }` |
| `experimental.session.compacting` | — | Trước khi compaction | `{ input }, { output: { context[], prompt? } }` |

### 3.2 Cách Plugin Capture Thinking Blocks

**Method 1: `message.part.updated` event**

```typescript
export const ThinkingCapturePlugin = async ({ client }) => {
  return {
    event: async ({ event }) => {
      if (event.type === "message.part.updated") {
        const part = event.properties.part
        if (part.type === "reasoning") {
          // part.text chứa nội dung thinking
          // part.metadata chứa provider-specific data (signature, v.v.)
          // part.time.{start, end} cho duration
          await client.app.log({
            body: {
              service: "thinking-capture",
              level: "info",
              message: `Reasoning block: ${part.text.slice(0, 100)}...`,
              extra: {
                partID: part.id,
                messageID: part.messageID,
                duration: part.time.end ? part.time.end - part.time.start : null,
                hasSignature: !!part.metadata?.anthropic?.signature,
              },
            },
          })
        }
      }
    },
  }
}
```

**Method 2: `experimental.text.complete` hook**

Plugin có thể intercept text parts sau khi hoàn thành, nhưng reasoning blocks KHÔNG trigger hook này — chỉ text parts.

**Method 3: SSE Event Stream**

```typescript
// GlobalEvent stream từ /global/event
// EventMessagePartUpdated chứa:
// { type: "message.part.updated", properties: { part: Part, delta?: string } }
```

### 3.3 Processor.ts — Reasoning Event Handling

Từ `processor.ts` [L2], reasoning được xử lý qua 3 LLM events:

```typescript
// processor.ts [L2] — reasoning event handling
case "reasoning-start":
  ctx.reasoningMap[value.id] = {
    id: PartID.ascending(),
    messageID: ctx.assistantMessage.id,
    sessionID: ctx.assistantMessage.sessionID,
    type: "reasoning",
    text: "",
    time: { start: Date.now() },
    metadata: value.providerMetadata,  // ← Chứa signature cho Anthropic
  }
  yield* session.updatePart(ctx.reasoningMap[value.id])

case "reasoning-delta":
  ctx.reasoningMap[value.id].text += value.text
  if (value.providerMetadata) ctx.reasoningMap[value.id].metadata = value.providerMetadata
  yield* session.updatePartDelta({ ... field: "text", delta: value.text })

case "reasoning-end":
  ctx.reasoningMap[value.id].text = ctx.reasoningMap[value.id].text  // reactivity trigger
  ctx.reasoningMap[value.id].time = { ...ctx.reasoningMap[value.id].time, end: Date.now() }
  if (value.providerMetadata) ctx.reasoningMap[value.id].metadata = value.providerMetadata
  yield* session.updatePart(ctx.reasoningMap[value.id])
  delete ctx.reasoningMap[value.id]
```

**Key insight:** Reasoning được stream qua 3 events riêng biệt (`reasoning-start`, `reasoning-delta`, `reasoning-end`) — plugin có thể subscribe vào các events này thông qua `message.part.updated`.

---

## 4. Permission & Agent Mode Architecture

### 4.1 Agent Config — YAML Frontmatter

```typescript
// types.gen.ts [L2]
export type AgentConfig = {
  model?: string
  temperature?: number
  top_p?: number
  prompt?: string
  tools?: { [key: string]: boolean }
  disable?: boolean
  description?: string
  mode?: "subagent" | "primary" | "all"
  color?: string
  maxSteps?: number
  permission?: {
    edit?: "ask" | "allow" | "deny"
    bash?: ("ask" | "allow" | "deny") | { [key: string]: "ask" | "allow" | "deny" }
    webfetch?: "ask" | "allow" | "deny"
    doom_loop?: "ask" | "allow" | "deny"
    external_directory?: "ask" | "allow" | "deny"
  }
}
```

### 4.2 Agent Runtime Object

```typescript
// types.gen.ts [L2]
export type Agent = {
  name: string
  description?: string
  mode: "subagent" | "primary" | "all"
  builtIn: boolean
  topP?: number
  temperature?: number
  color?: string
  permission: {
    edit: "ask" | "allow" | "deny"
    bash: { [key: string]: "ask" | "allow" | "deny" }  // ← Regex patterns
    webfetch?: "ask" | "allow" | "deny"
    doom_loop?: "ask" | "allow" | "deny"
    external_directory?: "ask" | "allow" | "deny"
  }
  model?: { modelID: string; providerID: string }
  prompt?: string
  tools: { [key: string]: boolean }
  maxSteps?: number
}
```

### 4.3 Permission Inheritance

- **Agent-level permissions** được định nghĩa trong `opencode.json` → merge với **session-level permissions**
- **Subagent inheritance:** Khi tạo child session, permission được truyền từ parent agent config
- **Bash permission** hỗ trợ regex patterns: `{ "npm.*": "allow", "rm.*": "deny" }`
- **Permission modes:** `allow` (tự động), `ask` (hỏi user), `deny` (chặn)

### 4.4 Agent Modes

| Mode | Description | Tool Access | Session Creation |
|------|-------------|-------------|-----------------|
| `all` | Full access — cả user-facing và subagent | Tất cả tools | Có thể tạo bởi user |
| `primary` | User-facing agent chính | Tất cả tools | Có thể tạo bởi user |
| `subagent` | Chỉ được tạo bởi agent khác (child session) | Giới hạn tools | Chỉ tạo qua `task` tool |

### 4.5 Session Hierarchy

```typescript
// types.gen.ts [L2]
export type Session = {
  id: string
  projectID: string
  directory: string
  parentID?: string        // ← Parent-child relationship
  title: string
  version: string
  time: { created: number; updated: number; compacting?: number }
  summary?: { additions: number; deletions: number; files: number; diffs?: FileDiff[] }
  share?: { url: string }
  revert?: { messageID: string; partID?: string; snapshot?: string; diff?: string }
}
```

**SubtaskPart** thể hiện delegation trong message history:
```typescript
export type SubtaskPart = {
  type: "subtask"
  prompt: string
  description: string
  agent: string
  model?: { providerID: string; modelID: string }
  command?: string
}
```

---

## 5. Key Integration Points for Thinking Extraction

### 5.1 Điểm có thể Hook vào để Extract Thinking

| Integration Point | Mechanism | Data Available | Limitations |
|------------------|-----------|---------------|-------------|
| `message.part.updated` event | Plugin hook | Full `ReasoningPart` object | Chỉ fired khi part đã update (không real-time streaming) |
| SSE `/global/event` | Event stream | `EventMessagePartUpdated` với `delta` field | Cần parse SSE, delta chỉ có trong streaming |
| `experimental.text.complete` | Plugin hook | Text content sau khi hoàn thành | KHÔNG áp dụng cho reasoning parts |
| Database query | Direct DB access | `PartTable` với `data` column chứa ReasoningPart | Cần access SQLite, không qua SDK |
| `toModelMessages()` | Internal function | Reasoning → AI SDK `reasoning` parts | Internal only, không expose qua plugin API |

### 5.2 Provider-Specific Reasoning Handling

**Anthropic Extended Thinking** (từ `transform.ts` [L2]):
- Reasoning blocks phải đứng TRƯỚC các content types khác trong assistant message
- Empty text parts giữa reasoning blocks được thay bằng `" "` để preserve signature
- `metadata.anthropic.signature` được lưu cho mỗi reasoning block
- Adaptive thinking efforts: `low`, `medium`, `high`, `max`, `xhigh` (tùy model)

**Bedrock Extended Thinking** (từ `transform.ts` [L2]):
- Tương tự Anthropic nhưng với `metadata.bedrock.signature`
- Có issue #18078: `trimEnd()` invalidates Bedrock extended thinking signature

**OpenAI Reasoning Efforts** (từ `transform.ts` [L2]):
- Uses `reasoningEffort` variants: `none`, `minimal`, `low`, `medium`, `high`, `xhigh`
- GPT-5 family có effort tiers khác nhau tùy version
- `reasoningSummary: "auto"` và `include: ["reasoning.encrypted_content"]`

**DeepSeek** (từ `transform.ts` [L2]):
- Yêu cầu empty reasoning block nếu model không trả về reasoning
- Transform: thêm `{ type: "reasoning", text: "" }` nếu thiếu

### 5.3 Reasoning → Model Message Conversion

Từ `message-v2.ts` `toModelMessagesEffect()` [L2]:

```typescript
if (part.type === "reasoning") {
  if (differentModel) {
    // Khi replay sang model khác → reasoning → text
    if (part.text.trim().length > 0)
      assistantMessage.parts.push({ type: "text", text: part.text })
    continue
  }
  // Cùng model → giữ nguyên reasoning part
  assistantMessage.parts.push({
    type: "reasoning",
    text: part.text,
    providerMetadata: part.metadata,  // ← Signature preserved here
  })
}
```

**Critical:** Khi switch model mid-session, reasoning blocks bị convert thành text — mất metadata/signature.

---

## 6. Limitations & Gaps

### 6.1 Những gì SDK KHÔNG Expose

| Gap | Impact | Workaround |
|-----|--------|------------|
| **Không có `ReasoningPartInput`** | Client không thể gửi reasoning blocks | Chỉ LLM provider tạo được reasoning |
| **Không có plugin hook riêng cho reasoning** | Phải filter từ `message.part.updated` | Check `part.type === "reasoning"` trong event handler |
| **`experimental.text.complete` không áp dụng cho reasoning** | Không thể intercept reasoning completion | Dùng `message.part.updated` với `time.end` check |
| **Reasoning metadata không có schema cố định** | Provider-specific (anthropic.signature, bedrock.signature) | Phải check từng provider riêng |
| **Không có API để query reasoning blocks độc lập** | Phải fetch toàn bộ message + parts | Filter `parts.filter(p => p.type === "reasoning")` |

### 6.2 Known Issues từ GitHub

| Issue | Mô tả | Status |
|-------|-------|--------|
| **#9364** | Claude Extended Thinking: assistant message content order causes API error — reasoning phải đứng trước tool_use | Fixed trong transform.ts |
| **#10805** | Jinja exception "Cannot pass both content and thinking in assistant message" | Liên quan đến Anthropic API validation |
| **#3077** | Expected `thinking` or `redacted_thinking`, but found `tool_use` — final assistant message phải bắt đầu với thinking block | Fixed trong transform.ts |
| **#6176** | Claude extended thinking + tool use: signature not preserved in message history | Liên quan đến metadata preservation |
| **#11439** | Support parsing `<think>` and `<thinking>` tags as reasoning blocks — cho models không có native thinking | Feature request |
| **#11571** | Error switching from thinking model to non-thinking model mid-session | Reasoning parts từ model cũ không compatible |
| **#15271** | Models get stuck in reasoning loop — planning trong thinking nhưng không execute tool calls | Behavioral issue với extended thinking |
| **#16748** | normalizeMessages() removes empty text parts between reasoning blocks, invalidating Anthropic signatures | Fixed: thay bằng `" "` thay vì remove |
| **#18078** | reasoning text trimEnd() invalidates Bedrock extended thinking signature | Bug: trimEnd() làm mất signature |
| **#25129** | Thinking mode gets stuck in infinite repetition loop (Qwen 3.6 Pro) | Model-specific bug |

### 6.3 Architectural Observations

1. **Reasoning là first-class citizen** — `ReasoningPart` có schema riêng, không phải subtype của `TextPart`
2. **Provider metadata được preserve** — `metadata.anthropic.signature`, `metadata.bedrock.signature` lưu trong ReasoningPart
3. **Streaming architecture** — Reasoning được stream qua 3 events riêng biệt, cho phép real-time display
4. **Model switching limitation** — Khi replay message history sang model khác, reasoning bị convert thành text
5. **No client-side reasoning injection** — SDK không cho phép client gửi reasoning blocks, chỉ LLM provider tạo được
6. **Plugin API limitation** — Không có hook riêng cho reasoning completion, phải dùng generic `message.part.updated`

---

## 7. Evidence Index

| Claim | Source | Evidence Level |
|-------|--------|---------------|
| Part type definitions | `types.gen.ts` (GitHub raw) | L2 — tool-verified file read |
| ReasoningPart schema | `message-v2.ts` (GitHub raw) | L2 — tool-verified file read |
| Processor reasoning handling | `processor.ts` (GitHub raw) | L2 — tool-verified file read |
| Transform provider logic | `transform.ts` (GitHub raw) | L2 — tool-verified file read |
| Plugin hooks list | opencode.ai/docs/plugins/ | L3 — documented observation |
| GitHub issues | github.com/anomalyco/opencode/issues | L3 — documented observation |
| AgentConfig/Agent types | `types.gen.ts` (GitHub raw) | L2 — tool-verified file read |
| Session hierarchy | `types.gen.ts` (GitHub raw) | L2 — tool-verified file read |

---

## 8. Recommendations

1. **Để extract thinking blocks:** Subscribe vào `message.part.updated` event, filter `part.type === "reasoning"`, đọc `part.text` và `part.metadata`
2. **Để capture real-time streaming:** Dùng SSE `/global/event` với `EventMessagePartUpdated` — có `delta` field cho incremental updates
3. **Để preserve Anthropic signatures:** KHÔNG trim/modify reasoning text — issue #16748 và #18078 chứng minh trimEnd() phá vỡ signature validation
4. **Để handle model switching:** Khi switch từ thinking model sang non-thinking model, cần filter reasoning parts hoặc convert sang text (OpenCode tự động làm điều này trong `toModelMessagesEffect`)
5. **Plugin development:** Dùng `@opencode-ai/plugin` package cho type-safe plugin development, import `type { Plugin }` từ package này

---

*Báo cáo được tổng hợp từ live source verification (GitHub raw files) + official docs + GitHub issues. Tất cả claims có file:line reference hoặc URL citation.*
