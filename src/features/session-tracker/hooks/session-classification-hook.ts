/**
 * PreToolUse session classification hook (CP-ST-05-01, Task 1).
 *
 * Intercepts Task tool calls at PreToolUse time and records classification
 * intent in the PendingDispatchRegistry BEFORE the child session is created.
 * This enables BEFORE-THE-FACT child session classification, preventing the
 * race condition where child sessions are misclassified as MAIN.
 *
 * @module session-tracker/hooks/session-classification-hook
 */

import type { PendingDispatchRegistry } from "../persistence/pending-dispatch-registry.js"

/**
 * Dependencies for the session classification hook.
 */
export interface SessionClassificationHookDeps {
  /** The pending dispatch registry for classification records. */
  pendingRegistry: PendingDispatchRegistry
  /** The parent session ID (the session dispatching the task). */
  parentSessionID: string
  /** Optional warning logger. */
  logWarn?: (message: string, error: unknown) => void
}

/**
 * Input shape for the onPreToolUse handler.
 */
export interface PreToolUseInput {
  /** The tool name being invoked (e.g. "Task", "read"). */
  toolName: string
  /** The session ID invoking the tool. */
  sessionId: string
  /** The tool input arguments. */
  input: Record<string, unknown>
}

/**
 * Creates a PreToolUse hook handler that records classification intent
 * when the Task tool is about to fire.
 *
 * @param deps - Injected dependencies.
 * @returns An object with onPreToolUse method.
 */
export function createSessionClassificationHook(
  deps: SessionClassificationHookDeps,
): { onPreToolUse: (input: PreToolUseInput) => Promise<void> } {
  return {
    async onPreToolUse(input: PreToolUseInput): Promise<void> {
      if (input.toolName !== "Task") {
        return
      }

      try {
        const args = input.input
        const subagentType = (args.subagentType as string) || (args.subagent_type as string) || "unknown"
        const description = (args.description as string) || ""
        const delegationDepth = (args.delegationDepth as number) ?? 1

        deps.pendingRegistry.add({
          parentSessionID: deps.parentSessionID,
          callID: `pretooluse-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
          subagentType,
          timestamp: Date.now(),
          delegationDepth,
          description,
        })
      } catch (err) {
        deps.logWarn?.(
          "[Harness] Session tracker: classification hook failed",
          err,
        )
      }
    },
  }
}
