export type HookEffectKind = "observation" | "response-shaping" | "guard-decision"
export type HookOperation = HookEffectKind | "durable-write"

export type HookEffectClassification = {
  hook: string
  kind: HookEffectKind
  durableWriteAllowed: false
}

/**
 * Classifies known OpenCode hook effects according to the harness CQRS boundary.
 *
 * @param hook - OpenCode hook identifier.
 * @returns The hook effect classification used by tests and hook comments.
 */
export function classifyHookEffect(hook: string): HookEffectClassification {
  if (hook === "messages.transform" || hook === "shell.env" || hook === "tool.execute.after") {
    return { hook, kind: "response-shaping", durableWriteAllowed: false }
  }
  if (hook === "tool.execute.before") {
    return { hook, kind: "guard-decision", durableWriteAllowed: false }
  }
  return { hook, kind: "observation", durableWriteAllowed: false }
}

/**
 * Rejects hidden durable writes from hook execution contexts.
 *
 * @param input - Hook and attempted operation.
 * @throws A `[Harness]` error when a hook attempts a durable write.
 */
export function assertHookWriteBoundary(input: { hook: string; operation: HookOperation }): void {
  if (input.operation === "durable-write") {
    throw new Error(`[Harness] Hook ${input.hook} cannot perform durable-write operations.`)
  }
}
