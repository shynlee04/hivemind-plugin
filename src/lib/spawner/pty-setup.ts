import type { PtyManager } from "../pty/pty-manager.js"
import type { PtySpawnRequest } from "../pty/pty-types.js"
import type { DelegationSpawnResult } from "./spawner-types.js"

type SpawnHeadlessResult = {
  childSessionId: string
}

type StartDelegationRuntimeArgs = {
  ptyManager: Pick<PtyManager, "spawn">
  request: PtySpawnRequest
  spawnHeadless: () => Promise<SpawnHeadlessResult>
}

export async function startDelegationRuntime(
  args: StartDelegationRuntimeArgs,
): Promise<DelegationSpawnResult> {
  try {
    const ptySession = args.ptyManager.spawn(args.request)
    return {
      childSessionId: ptySession.id,
      executionMode: "pty",
      workingDirectory: ptySession.cwd,
      ptySessionId: ptySession.id,
    }
  } catch (error) {
    const headlessSession = await args.spawnHeadless()
    const fallbackReason = error instanceof Error ? error.message : String(error)

    return {
      childSessionId: headlessSession.childSessionId,
      executionMode: "headless",
      workingDirectory: args.request.cwd,
      fallbackReason,
    }
  }
}
