/**
 * Transform hook handler.
 *
 * Captures the injection payload on `system.transform` hook for session journal.
 * Thin handler — delegates to injection-store only, no business logic.
 *
 * @module hooks/transform-handler
 */

import { setInjectionPayload } from '../plugin/injection-store.js'

/** Dependencies injected into the transform handler factory. */
export interface TransformHandlerDeps {
  directory: string
}

/**
 * Creates a handler for the `system.transform` hook.
 *
 * @param deps Dependencies (directory path for session journal root).
 * @returns Async handler function matching the SDK hook signature.
 */
export function createTransformHandler(_deps: TransformHandlerDeps) {
  return async (input: { sessionID?: string }, output: { system: string[] }): Promise<void> => {
    const sessionId = input.sessionID
    if (!sessionId) return

    const contextBlock = output.system.join('\n')

    const payload = {
      sessionId,
      timestamp: new Date().toISOString(),
      agent: 'system-transform',
      purposeClass: 'system',
      sessionState: 'active',
      skillBundle: [],
      sessionRole: 'standalone' as const,
      skillFocusBlock: '',
      turnHierarchyBlock: '',
      contextBlock,
      variant: 'system-transform',
    }

    try { setInjectionPayload(payload) } catch {}
  }
}
