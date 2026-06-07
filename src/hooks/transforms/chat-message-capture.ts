import type { SessionTracker } from "../../features/session-tracker/index.js"

/**
 * Dependencies for the chat-message-capture transform (AC-19).
 *
 * Injected at composition time from plugin.ts:
 *  - sessionTracker: SessionTracker instance
 *  - logWarn: optional logging callback
 */
export interface ChatMessageCaptureDeps {
  sessionTracker: Pick<SessionTracker, "handleChatMessage">
  logWarn?: (message: string, error: unknown) => void
}

/**
 * Extracted hook handler for chat.message capture (AC-19).
 *
 * Delegates all message observation to sessionTracker.handleChatMessage().
 * Best-effort — errors are caught and logged, never thrown to the runtime.
 *
 * Mirror of the original inline handler from plugin.ts (lines 238-254).
 *
 * @param deps - Typed dependencies injected from plugin.ts at composition time.
 * @returns An async function that receives (input, output) for chat.message.
 */
export function createChatMessageCapture(
  deps: ChatMessageCaptureDeps,
): (input: unknown, output: unknown) => Promise<void> {
  return async (input, output) => {
    try {
      await deps.sessionTracker.handleChatMessage(
        input as Parameters<typeof deps.sessionTracker.handleChatMessage>[0],
        output as Parameters<typeof deps.sessionTracker.handleChatMessage>[1],
      )
    } catch (err) {
      deps.logWarn?.("[Hivemind] Session tracker chat.message failed", err)
    }
  }
}
