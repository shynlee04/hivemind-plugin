---
status: verifying
trigger: "Session tracker không hiệu quả sau Phase 23.2 fix — last message của assistant trong main không được ghi lại, không ghi liên tiếp được requirements"
created: 2026-05-25T00:00:00.000Z
updated: 2026-05-25T16:35:00.000Z
---

## Current Focus

hypothesis: CONFIRMED — THREE-LAYER FAILURE causing lastMessage not captured for main sessions
test: 4 unit tests pass (lastMessage capture, child skip, empty guard, trim), typecheck clean
expecting: session.next.text.ended event delivers assistant text → frontmatter updated
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

## Evidence

- SDK type: `chat.message` hook = `{ message: UserMessage }` — chỉ có UserMessage, KHÔNG CÓ AssistantMessage
- `handleAssistantMessage()` trong message-capture.ts (line 199) là dead code — không bao giờ được trigger từ chat.message hook
- `session.next.text.ended` event (types.gen.d.ts:2476-2484) = `{ type, properties: { sessionID, text } }` — có assistant text nhưng bị discard ở event-capture.ts switch default case (line 131)
- `handleSessionIdle()` (line 306) đọc `pendingRegistry?.get(sessionID)?.lastMessage` — nhưng pendingRegistry.lastMessage KHÔNG BAO GIỜ được set cho main sessions
- `handleAssistantMessage()` writes trực tiếp vào frontmatter, KHÔNG vào pendingRegistry → idle-time read cũng fail
- TypeScript compiles clean after fix ✅
- All 5 test failures are PRE-EXISTING (not caused by this fix)

## Resolution

root_cause: THREE-LAYER FAILURE — (1) chat.message hook chỉ deliver UserMessage → handleAssistantMessage() dead code, (2) session.next.text.ended event có assistant text nhưng bị discard as "unknown" trong event-capture.ts switch, (3) handleSessionIdle() đọc từ pendingRegistry.lastMessage nhưng không bao giờ được populate cho main sessions
fix: Add `case "session.next.text.ended"` handler to event-capture.ts switch — extract properties.text → write to frontmatter as lastMessage. Document dead code in message-capture.ts.
verification: TypeScript typecheck passes, 4 new unit tests pass (lastMessage capture for main, child skip, empty text guard, whitespace trim), 0 new test failures
files_changed:
- src/features/session-tracker/capture/event-capture.ts (added switch case + handleSessionNextTextEnded method)
- src/features/session-tracker/capture/message-capture.ts (added dead code documentation to handleAssistantMessage)
