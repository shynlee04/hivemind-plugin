# CP-DT-01 Research — SDK Capabilities & Feasibility Analysis
> Ngày: 2026-05-18 | Nghiên cứu: @opencode-ai/plugin v1.15.4 + @opencode-ai/sdk v1.15.4

## 1. Session APIs (đã xác nhận từ source code)

| API | Chữ ký | Dùng cho delegate-task |
|-----|--------|----------------------|
| `session.create({ parentID, title, agent, permission, ... })` | ✅ | Tạo child session với parentID — **đã implement** |
| `session.promptAsync({ sessionID, parts: [...], agent, tools })` | ✅ | Dispatch task đến child session — **đã implement** |
| `session.prompt({ sessionID, parts: [...], noReply: true })` | ✅ | **Inject message vào main session** — CHƯA implement |
| `session.messages({ sessionID })` | ✅ | Đọc messages từ child session để polling — **đã implement một phần** |
| `session.abort({ path: { id } })` | ✅ | Cancel child session — CHƯA implement trong tools |
| `session.list({ directory })` | ✅ | Liệt kê sessions — hữu ích cho discovery |

## 2. Injection Mechanisms (PHÁT HIỆN QUAN TRỌNG)

### 2.1 Thin-line injection vào TUI
**Phát hiện:** OpenCode có event `tui.prompt.append` với type `"tui.prompt.append"` và properties `{ text: string }`.

```typescript
// From sdk.gen.d.ts:
export type EventTuiPromptAppend = {
    id: string;
    type: "tui.prompt.append";
    properties: {
        text: string;
    };
};
```

**Cơ chế:** Plugin server-side có thể gửi event này qua event system để append text vào prompt TUI của main session. Đây là cơ chế CHÍNH XÁC cho thin-line injection.

### 2.2 Toast notification
**Phát hiện:** OpenCode có event `tui.toast.show`:
```typescript
export type EventTuiToastShow = {
    id: string;
    type: "tui.toast.show";
    properties: {
        title?: string;
        message: string;
        variant: "info" | "success" | "warning" | "error";
        duration?: number;
    };
};
```

### 2.3 Session message injection (backup approach)
Có thể dùng `client.session.prompt({ noReply: true, parts: [{ type: "text", text: "..." }] })` để inject system message vào session — nhưng đây là USER message, không phải system notification.

## 3. Hooks khả dụng cho delegate-task

| Hook | Dùng cho |
|------|---------|
| `event` | Lắng nghe `session.idle`, `session.error`, `session.compacted` trên child sessions |
| `experimental.session.compacting` | Inject delegation context khi compact xảy ra (compact survival) |
| `tool.execute.before` | Intercept tool calls, đếm tool/bash/skill counters |
| `tool.execute.after` | Ghi nhận tool results |

## 4. Session Events (từ event system)

Các events có thể lắng nghe để theo dõi child session:
- `session.created` — child session được tạo
- `session.idle` — child session completed (KHÔNG busy, KHÔNG error)
- `session.error` — child session có lỗi
- `session.compacted` — child session bị compact
- `session.deleted` — child session bị xóa
- `session.updated` — child session được update

## 5. Feasibility Matrix cho từng yêu cầu

| Yêu cầu | Khả thi? | Cơ chế |
|---------|---------|--------|
| Tạo child session với permissions | ✅ | `session.create({ parentID, permission })` |
| Polling chủ động theo pha | ✅ | `session.messages()` + `setInterval` |
| Thin-line injection vào TUI | ✅ | `tui.prompt.append` event |
| Toast notification | ✅ | `tui.toast.show` event |
| Completion detection (3 điều kiện) | ✅ | `session.messages()` → parse parts |
| Failure thresholds (4 ngưỡng) | ✅ | Timer + event listening |
| TUI completion message append | ✅ | `session.prompt({ noReply: true })` cho ended session |
| Control tools (abort/cancel/restart) | ✅ | `session.abort()` + `session.promptAsync()` |
| Resume/chain tasks | ✅ | Reuse `session.promptAsync()` với cùng childSessionID |
| Compact survival | ✅ | `experimental.session.compacting` hook |
| 10 slots concurrent | ✅ | Điều chỉnh `perKeyLimit` |

## 6. Plugin Architecture cho injection

Plugin cần capture `client` từ `PluginInput` để:
1. Gọi `client.session.prompt()` cho injection
2. Gọi `client.session.messages()` cho polling
3. Đăng ký `event` hook để lắng nghe child session events
4. Đăng ký `experimental.session.compacting` hook

```typescript
// Pattern cho plugin
export const DelegateTaskPlugin: Plugin = async (input) => {
  const { client } = input;
  
  // Lưu client vào module-level closure để tools có thể dùng
  setGlobalClient(client);
  
  return {
    tool: { ... },
    event: async ({ event }) => { ... },
    "experimental.session.compacting": async (input, output) => { ... }
  };
};
```

## 7. Kết luận

**Tất cả 10 gaps đều KHẢ THI** với SDK hiện tại. Các cơ chế tồn tại:
- `tui.prompt.append` → thin-line injection ✅
- `tui.toast.show` → toast notification ✅
- `session.prompt({ noReply })` → message injection ✅
- `event` hook → session lifecycle tracking ✅
- `experimental.session.compacting` → compact survival ✅
