import type { OpenCodeClient } from "../session-api.js"
import { createSession, getSessionID } from "../session-api.js"
import type { DelegationSpawnRequest } from "./spawner-types.js"

type PermissionRule = {
  permission: string
  action: "allow" | "deny"
}

type SpawnDelegatedSessionArgs = {
  client: OpenCodeClient
  request: DelegationSpawnRequest
}

type SpawnDelegatedSessionResult = {
  childSession: Record<string, unknown>
  childSessionId: string
}

const WRITE_CAPABLE_PERMISSION_RULES: PermissionRule[] = [
  { permission: "read", action: "allow" },
  { permission: "edit", action: "allow" },
  { permission: "write", action: "allow" },
  { permission: "bash", action: "allow" },
  { permission: "glob", action: "allow" },
  { permission: "grep", action: "allow" },
  { permission: "delegate-task", action: "deny" },
  { permission: "task", action: "deny" },
]

export async function spawnDelegatedSession(
  args: SpawnDelegatedSessionArgs,
): Promise<SpawnDelegatedSessionResult> {
  const childSession = await createSession(args.client, {
    parentID: args.request.parentSessionId,
    title: args.request.title,
    directory: args.request.workingDirectory,
    permission: WRITE_CAPABLE_PERMISSION_RULES,
  })

  const childSessionId = getSessionID(childSession)
  if (!childSessionId) {
    throw new Error("[Harness] Child session creation did not return a session ID.")
  }

  return {
    childSession,
    childSessionId,
  }
}
