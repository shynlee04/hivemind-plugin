import type { SessionStateKind, StartWorkInput } from './start-work-types.js'

export function detectSessionState(input: StartWorkInput): SessionStateKind {
  if (input.sessionScope === 'sub-session') {
    return 'sub-session'
  }

  if (input.hasHandoff) {
    return 'continuation'
  }

  if (input.hasWorkflow) {
    return 'ongoing'
  }

  return 'fresh'
}

export function detectContinuityAlerts(input: StartWorkInput): string[] {
  if (input.sessionScope === 'sub-session' && !input.hasHandoff && (input.taskIds?.length ?? 0) === 0) {
    return ['missing-task-link']
  }

  return []
}
