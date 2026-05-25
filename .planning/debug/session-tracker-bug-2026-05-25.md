---
status: fixing
trigger: "Session tracker không hiệu quả sau Phase 23.2 fix — last message của assistant trong main không được ghi lại, không ghi liên tiếp được requirements"
created: 2026-05-25T00:00:00.000Z
updated: 2026-05-25T18:00:00.000Z
---

## Current Focus

hypothesis: CONFIRMED — PREVIOUS FIX WAS WRONG. `session.next.text.ended` DOES NOT EXIST in the OpenCode SDK. The REAL fix is SDK message fallback in `handleSessionIdle()`.
test: 25 tests pass (23 existing + 2 new SDK fallback tests), typecheck clean
expecting: When `session.idle` fires, `handleSessionIdle()` falls back to `getSessionMessages()` SDK call to extract last assistant text → frontmatter updated with lastMessage
next_action: await human verification in live session

## Symptoms

expected: session tracker ghi đầy đủ tất cả messages (assistant + user)
actual: last message của assistant trong main KHÔNG được ghi lại, không ghi liên tiếp requirements
errors: assistant message có thể hiển thị nhưng lastMessage frontmatter không update
reproduction: manual export vs session tracker comparison
started: sau Phase 23.2 fix

## Eliminated

- Bug do phase 23.2 code bị revert (code vẫn còn, không có revert)
- Bug do OpenCode chat.message hook không fire (hook fire bình thường qua logs)
- Bug do sessionWriter.updateFrontmatter() thất bại (function hoạt động đúng, vấn đề ở caller)
- Bug do extractTextContent() chỉ lấy 1 giá trị text/content (root cause sâu hơn — extractTextContent hoạt động đúng nhưng KHÔNG BAO GIỜ được gọi cho assistant messages)
- **PREVIOUS FIX WAS WRONG:** `session.next.text.ended` event DOES NOT EXIST in the OpenCode SDK (`@opencode-ai/sdk`). The SDK's `Event` union type includes: `session.created`, `session.updated`, `session.deleted`, `session.idle`, `session.error`, `session.status`, `session.compacted`, `session.diff`. There is NO `session.next.text.ended`. The `handleSessionNextTextEnded()` method and its switch case are DEAD CODE — they will never be reached at runtime.
- The REAL root cause: `handleSessionIdle()` reads `pendingRegistry?.get(sessionID)?.lastMessage` which is NEVER populated for main sessions (only for child sessions via delegation tracking).

## Evidence

- SDK type: `chat.message` hook = `{ message: UserMessage }` — chỉ có UserMessage, KHÔNG CÓ AssistantMessage
- `handleAssistantMessage()` trong message-capture.ts (line 199) là dead code — không bao giờ được trigger từ chat.message hook
- **SDK EVENT TYPE ANALYSIS** (from `node_modules/@opencode-ai/sdk/dist/gen/types.gen.d.ts`):
  - Available session events: `session.created`, `session.updated`, `session.deleted`, `session.idle`, `session.error`, `session.status`, `session.compacted`, `session.diff`
  - `session.next.text.ended`: **NOT FOUND** — does not exist in the SDK
- `handleSessionIdle()` (line 299) đọc `pendingRegistry?.get(sessionID)?.lastMessage` — nhưng pendingRegistry.lastMessage KHÔNG BAO GIỜ được set cho main sessions
- `getSessionMessages()` SDK call (already used by `backfillChildTurnsFromSdk` and `resolveCompactionFromMessages`) can retrieve assistant text — this is the CORRECT approach
- `handleAssistantMessage()` writes trực tiếp vào frontmatter, KHÔNG vào pendingRegistry → idle-time read cũng fail
- TypeScript compiles clean after correct fix ✅
- All 5 test failures are PRE-EXISTING (not caused by this fix)
- 2 new tests pass: SDK fallback lastMessage capture, and graceful failure handling

## Resolution

root_cause_corrected: The previous root cause analysis was WRONG about `session.next.text.ended` existing as an event. The ACTUAL root cause is: **`handleSessionIdle()` for main sessions reads `lastMessage` from `pendingRegistry`, but the pending registry is ONLY populated for child sessions (via `handleToolExecuteBefore` delegation tracking). For main sessions, the registry is always empty, so `lastMessage` is never captured.** Additionally, the `chat.message` hook only delivers `UserMessage` (not `AssistantMessage`), so `handleAssistantMessage()` in message-capture.ts is dead code for main sessions. There is no dedicated event that delivers completed assistant text — the SDK must be queried directly via `getSessionMessages()`.

fix: Add SDK message fallback in `event-capture.ts :: handleSessionIdle()` — when `pendingRegistry.lastMessage` is empty for a main session, call `getSessionMessages(this.client, sessionID)` to extract the last assistant message's text content (using the same `extractTextFromSdkMessage` helper already used by `backfillChildTurnsFromSdk`). Document `handleSessionNextTextEnded()` as dead code since `session.next.text.ended` does not exist in the SDK.

verification: TypeScript typecheck passes, 25 tests pass (23 existing + 2 new SDK fallback tests), 0 new test failures (same 5 pre-existing)
files_changed:
- src/features/session-tracker/capture/event-capture.ts (add SDK message fallback in handleSessionIdle, update dead code docs for handleSessionNextTextEnded)
- tests/features/session-tracker/capture/event-capture.test.ts (add getSessionMessages mock, add 2 test cases: SDK fallback capture, graceful failure)
- .planning/debug/session-tracker-bug-2026-05-25.md (update with corrected root cause)
