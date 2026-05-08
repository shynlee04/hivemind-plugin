import type { OpenCodeClient } from "./session-api.js"

import { getNestedValue, unwrapData } from "./helpers.js"

/**
 * Reads the OpenCode app agent registry through the canonical SDK wrapper seam.
 *
 * @param client - OpenCode SDK client supplied by the plugin runtime.
 * @returns Agent registry entries when the SDK returns an array or an `{ agents }` payload.
 *
 * @example
 * ```typescript
 * const agents = await getAppAgents(client)
 * ```
 */
export async function getAppAgents(client: OpenCodeClient): Promise<unknown[]> {
  const response = unwrapData(await client.app.agents())
  if (Array.isArray(response)) {
    return response
  }

  const agents = getNestedValue(response, ["agents"])
  return Array.isArray(agents) ? agents : []
}
