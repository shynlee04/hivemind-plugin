# Root Cause Analysis: delegate-task sessionID requirement

## Symptom
Agent không thể dùng `delegate-task` — tool check `parentSessionId` và error với message "requires OpenCode plugin runtime".

## Root Cause

### Flow hiện tại (SAI)

```
delegate-task execute()
  → context.sessionID (từ OpenCode plugin SDK — auto-injected)
  → ?? process.env.OPENCODE_SESSION_ID (env fallback)
  → if (!parentSessionId) ERROR: "requires OpenCode plugin runtime"
```

**Vấn đề:** OpenCode plugin SDK ALWAYS injects `context.sessionID` khi gọi `tool.execute()`. Không có trường hợp nào `sessionID` missing trong production runtime. Check và error là dead code gây hiểu lầm.

### Flow đúng

```
OpenCode runtime gọi custom tool execute()
  └─ plugin.ts tool.execute(rawArgs, context)
       └─ context.sessionID = "ses_xxx"  ← LUÔN có
            └─ coordinator.dispatch({ parentSessionId: context.sessionID })
                 └─ childSessionStarter.start({ parentSessionId })
                      └─ SDK createSession({ parentID })
                           └─ CHILD SESSION auto-linked đến parent
```

### Bằng chứng

1. **`@opencode-ai/plugin` types** (dist/index.d.ts:36-38): `context: { sessionID: string; directory: string }` — sessionID là string, KHÔNG optional
2. **`delegate-task.ts` execute()** nhận `context: ToolContext` với `sessionID?: string` — TypeScript sai, thực tế SDK luôn inject
3. **Test fake**: tests pass `{ sessionID: "ses_test" }` — mô phỏng đúng, không test case missing sessionID thật
4. **Session log**: OPENCODE_SESSION_ID env var không set → tool error. Nhưng trong runtime thật, env var là fallback, không phải primary source

### Fix proposal

1. Xoá check `!parentSessionId` — gây hiểu lầm, không bao giờ xảy ra trong runtime
2. Nếu giữ lại cho safety, fallback về `anon-` prefix thay vì error (giống native task tool không cần session context)
3. `parentSessionId` chỉ cần cho:
   - Notification routing (notificationRouter.register)
   - SDK child-session linking (createSession parentID)
   - Session slot management (slotManager)
4. Tất cả đều có fallback — không nên block tool vì thiếu session ID
