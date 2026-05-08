import type { OpenCodeClient } from "../../shared/session-api.js"
import { createSession, getSessionID } from "../../shared/session-api.js"
import type { DelegationSpawnRequest } from "./spawner-types.js"

type SpawnDelegatedSessionArgs = {
  client: OpenCodeClient
  request: DelegationSpawnRequest
}

type SpawnDelegatedSessionResult = {
  childSession: Record<string, unknown>
  childSessionId: string
  allowedTools: readonly string[]
}

export async function spawnDelegatedSession(
  args: SpawnDelegatedSessionArgs,
): Promise<SpawnDelegatedSessionResult> {
  const childSession = await createSession(args.client, {
    parentID: args.request.parentSessionId,
    title: args.request.title,
    directory: args.request.workingDirectory,
  })

  const childSessionId = getSessionID(childSession)
  if (!childSessionId) {
    throw new Error("[Harness] Child session creation did not return a session ID.")
  }

  return {
    childSession,
    childSessionId,
    allowedTools: args.request.permissionProfile.tools,
  }
}
