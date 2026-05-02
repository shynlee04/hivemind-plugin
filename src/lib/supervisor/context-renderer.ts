/**
 * Rendered supervisor context for a session.
 *
 * A compact view of session state suitable for dashboard rendering.
 *
 * @property session_id - The session identifier.
 * @property status - Current session status string.
 * @property agent - Name of the active agent, or null.
 * @property active_tools - List of currently active tool names.
 * @property recent_events - List of recent event descriptions.
 * @property rendered_at - Unix timestamp of when the context was rendered.
 */
export type SupervisorContext = {
  session_id: string
  status: string
  agent: string | null
  active_tools: string[]
  recent_events: string[]
  rendered_at: number
}

/**
 * Render a supervisor context from session state inputs.
 *
 * Creates a compact snapshot of session state for dashboard display.
 * Missing optional fields default to null (agent) or empty arrays
 * (active_tools, recent_events).
 *
 * @param input - Session state inputs.
 * @param input.sessionId - The session identifier.
 * @param input.status - Current session status.
 * @param input.agent - Optional agent name.
 * @param input.activeTools - Optional list of active tool names.
 * @param input.recentEvents - Optional list of recent event descriptions.
 * @returns A {@link SupervisorContext} snapshot.
 *
 * @example
 * ```typescript
 * const ctx = renderSupervisorContext({
 *   sessionId: "session-123",
 *   status: "active",
 *   agent: "hm-executor",
 *   activeTools: ["bash", "edit"],
 * })
 * ```
 */
export function renderSupervisorContext(input: {
  sessionId: string
  status: string
  agent?: string | null
  activeTools?: string[]
  recentEvents?: string[]
}): SupervisorContext {
  return {
    session_id: input.sessionId,
    status: input.status,
    agent: input.agent ?? null,
    active_tools: input.activeTools ?? [],
    recent_events: input.recentEvents ?? [],
    rendered_at: Date.now(),
  }
}
