/**
 * Shared injection payload store.
 * 
 * messages-transform-adapter writes what it injected here.
 * text.complete reads it to include in the diagnostic log.
 * 
 * The store is keyed by sessionId and cleared after text.complete reads it.
 */

export interface InjectionPayload {
  sessionId: string
  timestamp: string
  agent: string
  purposeClass: string
  sessionState: string
  skillBundle: { name: string; description: string }[]
  sessionRole: 'orchestrate' | 'specialist' | 'standalone'
  skillFocusBlock: string
  turnHierarchyBlock: string
  contextBlock: string
  routeHintBlock?: string
  variant: string
}

const store = new Map<string, InjectionPayload>()

export function setInjectionPayload(payload: InjectionPayload): void {
  store.set(payload.sessionId, payload)
}

export function getAndClearInjectionPayload(sessionId: string): InjectionPayload | undefined {
  const payload = store.get(sessionId)
  store.delete(sessionId)
  return payload
}
