import type { SessionInheritance } from './handler-types.js'
import type { StartWorkDecision } from '../features/session-entry/start-work-types.js'

export function resolveSessionInheritance(startWork: StartWorkDecision): SessionInheritance {
  if (startWork.sessionScope === 'sub-session') {
    return {
      sessionScope: startWork.sessionScope,
      promptMode: 'delegated',
      todoAuthority: startWork.purposeClass === 'gatekeeping' ? 'none' : 'delegated',
      handoffRequired: true,
    }
  }

  return {
    sessionScope: startWork.sessionScope,
    promptMode: 'full',
    todoAuthority: 'main',
    handoffRequired: startWork.purposeClass !== 'discovery',
  }
}
