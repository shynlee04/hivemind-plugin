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
