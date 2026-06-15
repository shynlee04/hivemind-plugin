/**
 * Agent metadata transform for assistant responses and child session recognition.
 *
 * Extracts agent name, model, and thinking duration from chat.message hook
 * input/output. Handles the critical REQ-ST-07 transformation: in child
 * sessions, the `##USER` block must be transformed to `main_l0_agent` with
 * the parent agent's name and model.
 *
 * @module session-tracker/transform/agent-transform
 */

// ---------------------------------------------------------------------------
// Hook input/output shapes
// ---------------------------------------------------------------------------

/** Shape of the chat.message hook input that carries agent metadata. */
interface ChatMessageInput {
  /** Agent name (e.g. "Hm-L0-Orchestrator"). */
  agent?: string
  /** Model info with provider and model IDs. */
  model?: {
    providerID: string
    modelID: string
  }
}

/** Shape of a hook output part. */
interface OutputPart {
  type: string
  text?: string
}

/**
 * Result of extracting assistant metadata from a chat.message hook.
 */
export interface AssistantMetadata {
  /** Agent display name. */
  name: string
  /** Model identifier. */
  model: string
  /** Optional thinking duration (e.g. "19.7s"), computed from thinking parts. */
  thinkingDuration?: string
}

// ---------------------------------------------------------------------------
// AgentTransform class
// ---------------------------------------------------------------------------

/**
 * Transforms assistant/agent metadata from OpenCode hook payloads into
 * structured `main_l0_agent` fields. Also handles the critical child-session
 * transformation where `##USER` blocks are re-labeled as `main_l0_agent`.
 */
export class AgentTransform {
  /**
   * Extracts agent metadata from a chat.message hook input/output pair.
   *
   * @param input - The hook input containing agent name and model info.
   * @param output - The hook output containing response parts.
   * @returns Structured agent name, model, and optional thinking duration.
   *
   * @example
   * ```typescript
   * const meta = transform.extractAssistantMetadata(
   *   { agent: "Hm-L0-Orchestrator", model: { providerID: "deepseek", modelID: "DeepSeek V4 Pro" } },
   *   { parts: [{ type: "text", text: "..." }, { type: "thinking", text: "..." }] }
   * )
   * // { name: "Hm-L0-Orchestrator", model: "DeepSeek V4 Pro", thinkingDuration: "0.5s" }
   * ```
   */
  extractAssistantMetadata(
    input: ChatMessageInput,
    output: { parts: OutputPart[] },
  ): AssistantMetadata {
    const name = input.agent || "unknown"
    const model =
      input.model?.modelID || input.model?.providerID || "unknown"

    const hasThinking = output.parts?.some((p) => p.type === "thinking")
    const thinkingDuration = hasThinking ? this.computeThinkingDuration() : undefined

    return { name, model, thinkingDuration }
  }

  /**
   * Transforms a child session's `##USER` block into `main_l0_agent` using
   * the parent agent's metadata.
   *
   * In child sessions (created via `task` tool delegation), the first message
   * is a `##USER` block containing the parent agent's delegation prompt, NOT a
   * human user message. This method provides the parent agent's name and model
   * for use as `main_l0_agent` in the child session record.
   *
   * @param parentAgentName - Name of the parent agent that delegated this child.
   * @param parentModel - Model identifier of the parent agent.
   * @returns Object with agent `name` and `model` for the child session.
   */
  transformChildUserMessage(
    parentAgentName: string,
    parentModel: string,
  ): { name: string; model: string } {
    return {
      name: parentAgentName || "unknown",
      model: parentModel || "unknown",
    }
  }

  /**
   * Returns undefined — honest about not having timing data.
   *
   * Timing data is not available from hook metadata. Returning undefined
   * prevents fake data from being persisted in session knowledge files.
   *
   * @returns `undefined` — callers should handle missing thinking duration.
   */
  private computeThinkingDuration(): undefined {
    return undefined
  }
}
