export type SupervisorContext = {
  session_id: string
  status: string
  agent: string | null
  active_tools: string[]
  recent_events: string[]
  rendered_at: number
}

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
