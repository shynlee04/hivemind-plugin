---
phase: 23
title: "Notification Redesign Gap Plan — Surface Truth, Fix Steps, Live Test Design"
status: gap-plan
created: 2026-05-23
source: live-test session-ses_1ab8, SDK v1.14.44 verification, notification-handler.ts audit
---

# 23-GAP-PLAN-NOTIFICATION.md

## 1. Symptom Registry (Surface Truth Only — No Conclusions)

### BUG 1: `sendPrompt()` Creates `## USER` Turn Instead of Transient Notification

| Field | Value |
|-------|-------|
| **Symptom** | `sendPrompt()` with `noReply: true` tạo `## USER` turn trong session body. User thấy notification như user input. |
| **Evidence source** | ses_1ab8.md:3111-3114: `"✓ Command /gsd-stats dispatched as synthetic parent prompt. Note: synthetic parent prompt creates a ## USER turn in the session body."` |
| **Code path** | `notification-handler.ts:223-229` → `sendPrompt(client, parentSessionID, body)` với `body = { noReply: !isUrgent, parts: [{ type: "text", text: message, synthetic: true }] }` |
| **SDK contract** | `client.session.prompt({ body: { noReply: true } })` trả về `Promise<UserMessage>` — luôn tạo user turn. `synthetic: true` là property của TextPart, KHÔNG ảnh hưởng đến role của message. **GIẢI PHÁP: `session.promptAsync()` (wraps `POST /session/:id/prompt_async`) — fire-and-forget, returns 204 No Content, agent thấy message, stream chạy tiếp, không wait AI response.** |

---

## API Reference (Verified from opencode.ai/docs/server/)

### Sessions

| Method | Path | Description | Notes |
|--------|------|-------------|-------|
| POST | `/session/:id/message` | Send message + wait for response | body: `{ messageID?, model?, agent?, noReply?, system?, tools?, parts }` → `{ info: Message, parts: Part[] }` |
| POST | `/session/:id/prompt_async` | **Send message async (no wait)** | body: same as message → **returns 204 No Content** ← KEY FOR INJECTION |
| POST | `/session/:id/command` | Execute slash command | body: `{ messageID?, agent?, model?, command, arguments }` → `{ info: Message, parts: Part[] }` |
| POST | `/session/:id/shell` | Run shell command | body: `{ agent, model?, command }` → `{ info: Message, parts: Part[] }` |

### TUI

| Method | Path | Description | Notes |
|--------|------|-------------|-------|
| POST | `/tui/show-toast` | Show toast notification | body: `{ title?, message, variant }` — transient, user-visible |
| POST | `/tui/append-prompt` | Append text to prompt | **DO NOT USE** — puts text in USER INPUT |
| POST | `/tui/submit-prompt` | Submit current prompt | Submits whatever is in the input field |
| POST | `/tui/clear-prompt` | Clear prompt input | Clears input field |

### Messages (Read)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/session/:id/message` | List messages: `query: { limit? }` → `[{ info: Message, parts: Part[] }]` |
| GET | `/session/:id/message/:messageID` | Get message details: → `{ info: Message, parts: Part[] }` |

### Key Insight

**`POST /session/:id/prompt_async` là endpoint duy nhất inject message vào session mà không block.** `session.promptAsync()` trong SDK wraps endpoint này. Không giống `session.prompt()` (chờ response), `prompt_async` gửi message, agent thấy context, và return ngay lập tức (204 No Content). Stream không bị interrupt.

---
| **Current 23-01 plan** | Đã add `synthetic: true` vào parts nhưng **KHÔNG giải quyết root issue**: vẫn tạo user turn. |
| **User impact** | Pollution: notification hiện ra như user input, agent invisible. User confusion. |
| **SDK LIMITATION** | `session.prompt()` **KHÔNG có** API để inject message mà không tạo turn. Không có `session.injectMessage()` hay `session.sendSystemNotification()`. |

### BUG 2: Permission Denial for Stacked Sub-Agents

| Field | Value |
|-------|-------|
| **Symptom** | `[Harness] Access denied for delegation: caller session not in owner lineage` |
| **Evidence source** | ses_1ab8.md:2179, 6657, 6810 — xuất hiện 3 lần trong same session. |
| **Code path** | `manager-runtime.ts:339-362` → `canSessionAccessDelegation()` |
| **Logic (lines 339-362)** | Checks: (1) `delegation.parentSessionId === callerSessionId`, (2) `recordedDelegationId === delegation.id`, (3) sibling relationship. **KHÔNG** check grandchild → parent chain. |
| **Called from** | `delegation-status.ts:155`, `delegation-status.ts:180`, `delegation-status.ts:189`, `run-background-command.ts:89` |
| **User impact** | Sub-agent được delegate từ child session không thể query delegation status. Stacked delegations broken. |

### BUG 3: Session-Tracker Cannot Find Child Sessions (DEFERRED)

| Field | Value |
|-------|-------|
| **Symptom** | `session-tracker get-status(sessionId=ses_1c33...) → "Session status not found"` |
| **Evidence source** | ses_1ab8.md:381, 6811. "Child sessions created by delegate-task are NOT found via session-tracker. They exist on disk but the tool API fails." |
| **Root** | `session-tracker.ts:151-168` (`handleGetStatus`) reads `session-continuity.json` từ disk. SDK child sessions không được session-tracker hooks observe → file không tồn tại. |
| **Decision** | **DEFER** — user confirms đây là separate feature cluster. Không fix trong phase 23 này. |
| **Tracking** | Move to Phase 25+ (session-tracker integration). |

---

## 2. Current Code Path Analysis

### Call Chain (notification-handler.ts → SDK)

```
notifyParentSession() [notification-handler.ts:192-236]
  ├── buildNotificationMessage(task) [25-79] → tạo string message
  ├── reactivateSessionStream(client, parentSessionID) [104-116]
  │     └── sendPrompt(client, sessionID, { noReply: true, parts: [{ synthetic: true }] }) [109]
  │           └── client.session.prompt() [session-api.ts:161]
  │                 → RETURNS UserMessage (!!!) — tạo ## USER turn
  ├── [urgent path] appendTuiPrompt(client, text) [217]
  │     └── client.tui.appendPrompt() [session-api.ts:209-210]
  │           → WRONG: appends to USER INPUT FIELD, gây pollution
  └── sendPrompt(client, parentSessionID, body) [229]
        └── body = { noReply: !isUrgent, parts: [{ synthetic: true }] }
              └── client.session.prompt() [session-api.ts:161]
                    → RETURNS UserMessage — tạo ## USER turn dù có synthetic:true
```

### File:line Reference

| File | Lines | Role |
|------|-------|------|
| `notification-handler.ts` | 192-236 | `notifyParentSession()` — main notification dispatch |
| `notification-handler.ts` | 104-116 | `reactivateSessionStream()` — stream reactivation |
| `notification-handler.ts` | 260-282 | `notifyDelegationTerminal()` — terminal state notification |
| `notification-handler.ts` | 25-79 | `buildNotificationMessage()` — message construction |
| `session-api.ts` | 145-178 | `sendPrompt()` — SDK wrapper |
| `session-api.ts` | 208-211 | `appendTuiPrompt()` — TUI append (WRONG USE) |
| `session-api.ts` | 220-223 | `showTuiToast()` — toast (UNDERUSED) |
| `manager-runtime.ts` | 339-362 | `canSessionAccessDelegation()` — permission check |
| `manager.ts` | 307-310 | `canSessionAccessDelegation()` — delegation manager proxy |

---

## 3. SDK API Facts (Confirmed from anomalyco/opencode v1.14.44 — Do Not Hallucinate)

### API: `client.tui.showToast()`

```typescript
// Type signature (confirmed from SDK source)
client.tui.showToast({
  body: {
    message: string,              // Toast message text
    variant?: "success" | "error" | "info" | "warning"  // Optional: visual style
  }
}) → Promise<boolean>
```

**Behavior:**
- Creates transient toast notification in TUI
- **User-visible** — user sees toast message in their terminal UI
- **Agent-invisible** — agent's context does NOT receive this message
- **Non-invasive** — no turn created, no input pollution
- Returns `true` on success

**Use case:** Silent injection for:
- Progress updates ("Task started: generating spec")
- Non-terminal status changes ("Waiting for child delegation to complete...")
- Info messages that don't need agent action

### API: `client.session.prompt()`

```typescript
// Type signature (confirmed from SDK source)
client.session.prompt({
  body: {
    noReply?: boolean,                            // true→UserMessage, false→AssistantMessage
    parts: Array<{ type: "text", text: string }>,  // Message content
    model?: { providerID: string, modelID: string }  // Optional: model override
  }
}) → Promise<UserMessage | AssistantMessage>
```

**Behavior:**
- `noReply: true` → Creates and returns `UserMessage`. This ADDS a `## USER` turn to session history. Agent does NOT auto-respond.
- `noReply: false` → Creates and returns `AssistantMessage`. This ADDS an `## ASSISTANT` turn. Agent DOES auto-respond (if streaming is active).
- `parts[].synthetic?: boolean` — This is a `TextPart` property, NOT a message-level property. It does NOT affect message role. It only serves as a filter hint for downstream consumers (e.g., `message-capture.ts:356` already filters `synthetic: true` parts).
- `Promise<UserMessage|AssistantMessage>` — The return type reflects the actual message role created, confirming that `noReply: true` ALWAYS produces UserMessage.

**Critical Insight:** There is NO `session.injectMessage()` or `session.sendNotification()` API. The SDK does NOT support silent message injection that bypasses role assignment.

### API: `client.tui.appendPrompt()`

```typescript
client.tui.appendPrompt({
  body: { text: string }
}) → Promise<boolean>
```

**Behavior:**
- Appends text to the user's **input field** (where user types commands)
- **POLLUTES** user input — user sees notification text in their prompt
- **DO NOT USE** for notifications — this is for user-facing prompt suggestions

### SDK LIMITATIONS (Must Document)

| Missing API | Impact | Workaround |
|-------------|--------|------------|
| No `session.injectMessage()` | Cannot inject message without creating a turn | Use `tui.showToast()` for silent. For completion/failure, must use `session.prompt({ noReply: false })` which creates AssistantMessage. |
| No `session.sendSystemNotification()` | No system-level notification channel | Toast is the only transient option. |
| `synthetic: true` is TextPart-only | Does NOT change message role | Cannot rely on it to skip turn creation. |

---

## 4. Hypothesis (For Testing — Not Fix Yet)

### H1: `sendPrompt()` với `noReply: true` LUÔN tạo UserMessage bất kể `synthetic: true`

**Test:** Call `client.session.prompt({ body: { noReply: true, parts: [{ type: "text", text: "test", synthetic: true }] } })` — check return value type.

**Prediction:** Returns `UserMessage`. `## USER` turn appears in session messages.

**Evidence:** SDK signature confirms `noReply: true → UserMessage`. This is deterministic, not heuristic.

**Decision:** If CONFIRMED → `synthetic: true` fix alone cannot solve Bug 1. Need mechanism change.

### H2: Toast notification có đủ cho silent injection không?

**Test:** Call `client.tui.showToast({ body: { message: "Delegation started", variant: "info" } })` — check:
1. User sees toast in TUI?
2. Agent context does NOT contain toast message?
3. No new turn created?

**Prediction:** Toast is transient. User sees it. Agent ignores it. No turn created.

**Success:** User receives progress feedback without session pollution.

**Limitation:** Toast disappears. Cannot persist for later review. Agent never sees it.

### H3: `session.prompt({ noReply: false })` với `synthetic: true` có inject message không?

**Test:** Call with `noReply: false` and `synthetic: true` in parts — check:
1. Trả về `AssistantMessage` hay vẫn là `UserMessage`?
2. Agent có tự động xử lý message không?

**Prediction:** `noReply: false` → AssistantMessage. Agent sẽ respond vì nó thấy như assistant message mới.

**Risk:** Có thể trigger AI response loop. Cần stream reactivation trước + follow-up prompt để tránh agent phản hồi sai.

---

## 5. Fix Steps (Live Test After Each Step — No Skip)

### Step 1: Silent Injection → `tui.showToast()`

**What:** Thay thế `sendPrompt()` với `noReply: true` path bằng `tui.showToast()` cho tất cả non-terminal notifications (started, progress, waiting).

**Files to change:**
- `notification-handler.ts` — `notifyParentSession()` lines 192-236
- `session-api.ts` — `showTuiToast()` already exists at lines 220-223 (chỉ verify signature)
- `notification-handler.ts` — `notifyDelegationTerminal()` lines 260-282 (chỉ terminal path)

**Design:**

```typescript
// Non-terminal (silent) — DÙNG TOAST, KHÔNG dùng sendPrompt
export function notifyParentSessionSilent(
  client: OpenCodeClient,
  task: TaskNotification
): Promise<boolean> {
  return showTuiToast(client, formatToastMessage(task))
}

// Terminal notification path — keep sendPrompt for now (will fix in Step 2)
export async function notifyParentSession(
  client: OpenCodeClient,
  parentSessionID: string,
  task: TaskNotification,
  toastFn?: ToastFn,
  options?: { urgent?: boolean }
): Promise<boolean> {
  // ... giữ nguyên nhưng đảm bảo:
  // 1. Luôn gọi toast trước
  // 2. sendPrompt CHỈ dùng cho terminal states
  
  // Toast cho mọi trường hợp
  try {
    if (toastFn) toastFn(formatToastMessage(task))
    await showTuiToast(client, formatToastMessage(task))
  } catch { /* best-effort */ }
  
  // Terminal states → dùng sendPrompt (sẽ fix ở Step 2)
  if (task.status === "completed" || task.status === "failed") {
    await reactivateSessionStream(client, parentSessionID)
    // TODO Step 2: thay sendPrompt bằng append message mechanism
    await sendPrompt(client, parentSessionID, {
      noReply: false,  // Changed from !isUrgent — để tạo AssistantMessage
      parts: [{ type: "text", text: buildNotificationMessage(task), synthetic: true }],
    })
  }
  
  return true
}
```

**Removed:**
- `reactivateSessionStream()` cho non-terminal (không cần — toast không cần stream)
- `appendTuiPrompt()` — removed completely (gây pollution)
- `sendPrompt()` cho non-terminal (không cần — toast đủ)

**Live Test:**

```bash
# 1. Run a delegation task
# 2. User should see toast: "▶ Task: generating spec started (gsd-spec-agent)"
# 3. User should NOT see any ## USER turn added to session
# 4. Agent should NOT see the toast message
```

**Verification:**
- [ ] Toast appears in TUI for "started" status
- [ ] No `## USER` turn created
- [ ] Agent context is clean (no notification text)
- [ ] `npx vitest run tests/lib/coordination/completion/notification-handler.test.ts` passes
- [ ] `npm run typecheck` passes

---

### Step 2: Completion/Failure → Append Message + Auto-Send

**What:** Cho `completed` / `failed` status, cần gửi notification dưới dạng message agent sẽ thấy và xử lý. Vì SDK không có `session.injectMessage()`, giải pháp là:

1. **Toast trước** — user thấy kết quả ngay (từ Step 1)
2. **`session.prompt({ noReply: false })`** — tạo AssistantMessage với `synthetic: true`. Agent sẽ thấy message này.
3. **Auto-trigger** — Vì `noReply: false`, agent context sẽ nhận được message và có thể respond nếu đang active.

**Files to change:**
- `notification-handler.ts` — terminal notification path

**Design:**

```typescript
// Terminal notification — inject as AssistantMessage
async function notifyTerminal(
  client: OpenCodeClient,
  parentSessionID: string,
  task: TaskNotification,
): Promise<boolean> {
  // 1. Reactivate stream (parent session must be active)
  await reactivateSessionStream(client, parentSessionID)
  
  // 2. Toast first — user sees immediately
  try {
    await showTuiToast(client, formatToastMessage(task))
  } catch { /* best-effort */ }
  
  // 3. Inject as AssistantMessage — agent sees it
  // noReply: false → creates AssistantMessage
  // synthetic: true → message-capture.ts filters from tracker
  try {
    await sendPrompt(client, parentSessionID, {
      noReply: false,
      parts: [{ type: "text", text: buildNotificationMessage(task), synthetic: true }],
    })
  } catch {
    queuePendingNotification(parentSessionID, task)
    return false
  }
  
  return true
}
```

**Parent session after delegation completes must auto-resume.**
- Nếu parent session STOPPED (stream ended) → reactivate trước, sau đó inject message → agent tự xử lý.
- Nếu parent session IDLE (đang chờ) → inject message → agent nhận context và respond.

**RISK:** Agent có thể respond với nội dung không mong muốn vào message synthetic. Cần test live.

**Live Test:**

```bash
# 1. Dispatch delegation from parent
# 2. Wait for delegation to complete
# 3. Parent session should:
#    a. Resume (if stopped)
#    b. Receive notification as context
#    c. Agent does NOT start processing automatically (just receives context)
```

**Verification:**
- [ ] Toast appears for completion/failure
- [ ] Parent session resumes
- [ ] Notification message appears in parent session context
- [ ] Parent agent does NOT auto-respond/hallucinate
- [ ] No `## USER` turn created — only Assistant message

---

### Step 3: Stream Reactivation — Fix `reactivateSessionStream()`

**What:** `reactivateSessionStream()` hiện tại dùng `sendPrompt({ noReply: true, parts: [{ text: "", synthetic: true }] })`. Cần verify rằng empty synthetic prompt:
- Không tạo turn mới
- Không trigger AI loop
- Chỉ reactivate session stream

**Nếu SDK không reactivate session bằng empty prompt → cần mechanism khác.**

**Alternative approach:** Dùng `getSessionStatusMap()` kiểm tra session state trước, nếu stopped → abort và re-create?

**SDK LIMITATION check:** SDK không có `session.resume()` API. Cần test live với empty prompt.

**Live Test:**

```bash
# 1. Start delegation, wait for parent to stop streaming
# 2. Call reactivateSessionStream()
# 3. Check if parent session can receive new messages
# 4. Check if empty prompt creates any turn
```

**Verification:**
- [ ] Empty synthetic prompt does NOT create turn
- [ ] Parent session can receive messages after reactivation
- [ ] AI loop NOT triggered unnecessarily

---

### Step 4: Permission Inheritance — Fix `canSessionAccessDelegation()`

**What:** Mở rộng permission check để stacked sub-agents có thể truy cập delegation records của parent chain.

**Files to change:**
- `manager-runtime.ts` — `canSessionAccessDelegation()` lines 339-362

**Design:**

```typescript
canSessionAccessDelegation(
  callerSessionId: string | undefined,
  delegation: Delegation | undefined,
): boolean {
  if (!callerSessionId || !delegation) return false
  
  // Case 1: Direct parent
  if (delegation.parentSessionId === callerSessionId) return true
  
  const recordedDelegationId = this.state.getDelegationIdForSession(callerSessionId)
  if (!recordedDelegationId) return false
  
  // Case 2: Same delegation
  if (recordedDelegationId === delegation.id) return true
  
  const recordedDelegation = this.state.get(recordedDelegationId)
  if (!recordedDelegation) return false
  
  // Case 3: Sibling relationship (existing)
  if (recordedDelegation.parentSessionId === delegation.childSessionId
      || recordedDelegation.childSessionId === delegation.parentSessionId) {
    return true
  }
  
  // NEW: Case 4: Grandchild → grandparent chain traversal
  // recordedDelegation.childSessionId === callerSessionId
  // delegation.parentSessionId === recordedDelegation.parentSessionId parent
  // → Walk UP the delegation chain to find if delegation is in lineage
  if (recordedDelegation.parentSessionId === delegation.childSessionId
      || recordedDelegation.parentSessionId === delegation.parentSessionId) {
    return true
  }
  
  // NEW: Case 5: Walk full parent chain
  // Stacked: ses_1 (parent) → ses_2 (child/delegate-task) → ses_3 (grandchild/delegate-task)
  // ses_3 calls delegation-status → needs access to ses_2's delegation
  if (delegation.childSessionId === recordedDelegation.parentSessionId
      || this.isInParentChain(recordedDelegation.parentSessionId, delegation)) {
    return true
  }
  
  return false
}

// NEW: Walk delegation chain from caller up to root
private isInParentChain(
  checkSessionId: string,
  targetDelegation: Delegation,
): boolean {
  let currentSessionId = checkSessionId
  const visited = new Set<string>()
  
  while (currentSessionId) {
    if (visited.has(currentSessionId)) break
    visited.add(currentSessionId)
    
    const delegationId = this.state.getDelegationIdForSession(currentSessionId)
    if (!delegationId) break
    
    const delegation = this.state.get(delegationId)
    if (!delegation) break
    
    if (delegation.parentSessionId === targetDelegation.parentSessionId
        || delegation.id === targetDelegation.id) {
      return true
    }
    
    currentSessionId = delegation.parentSessionId
  }
  
  return false
}
```

**Live Test:**

```bash
# 1. Parent session dispatches child via delegate-task (ses_2)
# 2. Child dispatches grandchild via delegate-task (ses_3)
# 3. Grandchild calls delegation-status → should see:
#    - Own delegation
#    - Parent's delegation  
#    - Grandparent's delegation
# 4. Grandchild calls delegate-task → should succeed
```

**Verification:**
- [ ] Grandchild can read sibling delegations
- [ ] Grandchild can write/edit/task without "Access denied"
- [ ] Grandparent's delegations visible to grandchild
- [ ] Security: unrelated sessions still blocked
- [ ] Existing tests pass

---

## 6. Complex Live Test Case

### Test: Full Delegation Lifecycle with Notification Delivery

**Setup:** Plugin đã build, terminal với OpenCode session active.

**Steps:**

```
1. START: Parent session dispatches gsd-spec-agent:
   /task agent=gsd-spec-agent task="Generate spec for notification module"
   
2. VERIFY Step 1 (Toast silent injection):
   - User sees toast: "▶ Delegation: gsd-spec-agent started (gsd-spec-agent)"
   - Parent session: NO ## USER turn added
   - Agent context: NO notification text visible
   
3. CHILD dispatches grandchild:
   Child session calls delegate-task to gsd-debugger
   
4. VERIFY Step 4 (Permission inheritance):
   - Grandchild calls delegation-status → sees parent AND grandparent delegations
   - Grandchild calls delegate-task → succeeds (no "Access denied")
   
5. WAIT for grandchild completion:
   
6. VERIFY Step 2 (Terminal notification):
   - User sees toast: "✓ Delegation: gsd-debugger completed (...)"
   - Parent session resumes (if stopped)
   - Parent receives notification as context
   - Parent agent does NOT hallucinate auto-response
   
7. WAIT for child completion:
   
8. VERIFY Step 2 (Terminal notification - chain):
   - User sees toast: "✓ Delegation: gsd-spec-agent completed (...)"
   - Parent receives final notification
```

**Expected behavior:**
- All notifications delivered via toast (user-visible, agent-invisible)
- Terminal notifications create context in parent session
- Permission inheritance works for stacked delegations
- No `## USER` turn created by notifications
- No input pollution from `appendTuiPrompt()`

**Failure conditions:**
- Toast not shown → SDK call failed → check `showTuiToast` error handling
- Permission denied → blocked at `canSessionAccessDelegation()` → need chain traversal
- Parent agent hallucinates on synthetic message → need follow-up prompt or `noReply: true` fallback
- Stream reactivation creates turn → `synthetic: true` not effective → need alternative reactivation

---

## Step Completion Results

### ✅ Step 1: Silent Context Injection — FIX COMMITTED (2026-05-23)

| Area | Result |
|------|--------|
| **SDK Verification** | V1 SDK confirmed. APIs: `session.promptAsync()` (204 No Content), `tui.showToast()`, `session.prompt()`. |
| **Code Changes** | `notification-handler.ts`: toast + promptAsync logic confirmed correct. `coordinator.ts`: **ADDED `notifyParentSession("started")` call** after `lifecycle.transition("running")` (line 123-131). |
| **Tests** | Typecheck: clean. Build: success. Delegation: 164/164 pass. Notification: 7/7 pass. Full suite: 2415/2417 pass (2 pre-existing). |
| **Root Cause** | CONFIRMED: `notifyParentSession()` was never called from coordinator.ts (the actual runtime dispatch path). manager-runtime.ts has the call but is dead code. |
| **Fix applied** | `coordinator.ts`: import `notifyParentSession` + `if (this.deps.client) { void notifyParentSession(client, parentSessionId, { status: "started" }) }` after lifecycle transition. Commit: `41cba301`. |
| **Awaiting** | Live UAT — user rebuilds plugin, runs delegate-task, verifies toast in parent TUI |

### 📋 Step 2: Completion/Failure Notification — PENDING
### 📋 Step 3: Stream Reactivation — PENDING  
### 📋 Step 4: Permission Inheritance — PENDING

---

## Live Test: Agent-Work-Contract + Trajectory Audit + Context Injection Verification

**Test được chạy trong session riêng qua `delegate-task`. VỪA audit VỪA verify context injection + TUI notification.**

**Yêu cầu agent thực thi:**

```
## Audit Agent-Work-Contract + Trajectory + Verify Context Injection

### Task 1: Audit (ghi vào phase folder)
Audit và review toàn bộ agent-work-contract và trajectory trong project. GHI KẾT QUẢ TRỰC TIẾP VÀO:
`.planning/phases/25-trajectory-agent-work-contract-redesign/25-AUDIT-2026-05-23.md`

Phân tích:
1. Design errors — thiết kế hiện tại sai sót gì?
2. Feature integration — các feature integrate với nhau thế nào?
3. Mechanisms — cơ chế hoạt động có phù hợp architecture không?
4. Existing features — so sánh với features đã dựng, có overlap không?
5. Cluster context — đọc ROADMAP.md và STATE.md
6. Phase readiness — phase 25 cần thay đổi gì?

Source files: src/task-management/trajectory/, src/shared/types.ts, .planning/ROADMAP.md, .planning/STATE.md

### Task 2: Verify Context Injection (QUAN TRỌNG)
Trong quá trình chạy audit, CHÚ Ý:
1. TUI notification: có toast hiện lên không? (▶ Task started)
2. Context injection: có message nào được inject vào session context không?
3. SO SÁNH: kết quả từ context injection vs chủ động gọi `delegation-status poll`
   - Injection có thông tin gì?
   - Poll có thông tin gì?
   - Có khác nhau không? Injection có thiếu field gì so với poll không?

### Return
1. Audit file tại phase 25 (25-AUDIT-2026-05-23.md)
2. Báo cáo context injection:
   - Có toast không?
   - Có context injection không?
   - So sánh injection vs poll delegation-status
```

| Step | File | Lines | Change |
|------|------|-------|--------|
| 1 | `notification-handler.ts` | 183-195 | `notifyParentSession()`: toast + promptAsync implementation **CONFIRMED CORRECT** |
| 1 | `manager-runtime.ts` | 205-207 | **NEW: Thêm `notifyParentSession(client, ...)` "started" call** sau `sendPromptAsync()` success |
| 1 | `session-api.ts` | 220-223 | Verified `showTuiToast()` signature matches SDK |
| 1 | `tests/.../notification-handler.test.ts` | — | 17 tests pass |
| 1 | `tests/.../manager-runtime.test.ts` | — | Add test for started notification |
| 2 | `notification-handler.ts` | 192-236 | Terminal path: use `noReply: false` for completion/failure |
| 2 | `notification-handler.ts` | 260-282 | `notifyDelegationTerminal()`: same pattern |
| 3 | `notification-handler.ts` | 104-116 | `reactivateSessionStream()`: verify empty prompt behavior |
| 4 | `manager-runtime.ts` | 339-362 | `canSessionAccessDelegation()`: add chain traversal |
| 4 | `manager.ts` | 307-310 | Proxy pass-through (likely no change needed) |
| — | `tests/lib/coordination/completion/notification-handler.test.ts` | — | Update tests for new behavior |
| — | `tests/lib/coordination/delegation/manager-runtime.test.ts` | — | Add permission chain tests |

## Appendix B: Rollback Plan

If any step fails live test:

1. **Step 1 fails (toast not working):** Revert to `sendPrompt()` but use `getSessionMessageCount()` baseline check to detect turn creation. Log warning instead of hard error.
2. **Step 2 fails (agent hallucinates):** Switch to `noReply: true` + polling. Agent checks for pending notifications via explicit tool call, not auto-context injection.
3. **Step 3 fails (reactivation creates turn):** Replace empty prompt with `session.status()` polling + `session.prompt()` with noop context. Or accept that parent must be idle (not stopped).
4. **Step 4 fails (permission gap):** Add explicit allowlist mode where root session can grant blanket access to all descendants.

---

## Appendix C: SDK API Truth Table

| API | Input | Returns | Turn Created? | Agent Visible? | Use For |
|-----|-------|---------|--------------|----------------|---------|
| `tui.showToast()` | `{ message, variant }` | `boolean` | **NO** | **NO** | Silent injection (progress, status) |
| `session.prompt({ noReply: true })` | `{ parts }` | `UserMessage` | **YES — ## USER** | YES | Deprecated — DO NOT USE for notifications |
| `session.prompt({ noReply: false })` | `{ parts }` | `AssistantMessage` | **YES — ## ASSISTANT** | YES | Completion/failure notification (Step 2) |
| `tui.appendPrompt()` | `{ text }` | `boolean` | NO (but pollutes input) | NO (user field) | **DO NOT USE** — gây pollution |
