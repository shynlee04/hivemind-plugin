import type { DelegationSpawnRequest } from "./spawner-types.js"
import { DEFAULT_SAFETY_CEILING_MS } from "../types.js"

type ValidatedAgent = { name: string; provider?: string; model?: string; category?: string }

type DelegateParams = {
  parentSessionId: string
  agent: string
  prompt: string
  title?: string
  safetyCeilingMs?: number
  workingDirectory?: string
  worktree?: string
  provider?: string
  model?: string
  category?: string
}

export type { ValidatedAgent, DelegateParams }

/**
 * Build a canonical SDK spawn request from delegation dispatch parameters.
 */
export function buildSdkSpawnRequest(
  params: DelegateParams,
  agent: ValidatedAgent,
  workingDirectory: string,
): DelegationSpawnRequest {
  return {
    parentSessionId: params.parentSessionId,
    agent: agent.name,
    title: params.title ?? `Delegation: ${agent.name}`,
    prompt: params.prompt,
    workingDirectory,
    executionMode: "sdk",
    safetyCeilingMs: params.safetyCeilingMs ?? DEFAULT_SAFETY_CEILING_MS,
    permissionProfile: {
      mode: "write-capable",
      tools: ["read", "edit", "write", "bash", "glob", "grep"],
    },
  }
}
