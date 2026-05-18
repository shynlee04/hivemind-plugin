import { getAppAgents } from "../../shared/app-api.js"
import type { OpenCodeClient } from "../../shared/session-api.js"
import { enrichAgentFromPrimitives } from "../spawner/agent-primitive-policy.js"
import { resolveDelegationPermissionProfile, type DelegateParams, type ValidatedAgent } from "../spawner/spawn-request-builder.js"
import type { DelegationPermissionProfile } from "../spawner/spawner-types.js"

export interface AgentResolverOptions {
  client: Pick<OpenCodeClient, "app">
  projectRoot: string
}

/** Resolves app agents and their least-privilege delegation permission profile. */
export class AgentResolver {
  constructor(private readonly options: AgentResolverOptions) {}

  /** Validate that an agent exists in the OpenCode app registry. */
  async resolve(agentName: string): Promise<ValidatedAgent> {
    const agents = await getAppAgents(this.options.client as OpenCodeClient)
    const matched = agents.map(toValidatedAgent).find((agent) => agent.name === agentName)
    if (!matched) {
      throw new Error(`[Harness] Unknown delegation agent "${agentName}"`)
    }
    return enrichAgentFromPrimitives(matched, this.options.projectRoot)
  }

  /** Build the prompt-time permission profile for a validated agent. */
  buildPermissionProfile(
    agent: ValidatedAgent,
    params: Pick<DelegateParams, "agent" | "title" | "prompt">,
  ): DelegationPermissionProfile {
    return resolveDelegationPermissionProfile(params, agent)
  }

  /** Disable recursive delegation tools inside delegated agents. */
  buildDisabledTools(): Record<string, boolean> {
    return { "delegate-task": false, task: false }
  }
}

function toValidatedAgent(value: unknown): ValidatedAgent {
  const record = typeof value === "object" && value !== null ? value as Record<string, unknown> : {}
  const name = typeof record.name === "string" ? record.name : ""
  const provider = typeof record.provider === "string" ? record.provider : undefined
  const model = typeof record.model === "string" ? record.model : undefined
  const description = typeof record.description === "string" ? record.description : undefined
  const permission = typeof record.permission === "object" && record.permission !== null
    ? record.permission as Record<string, unknown>
    : undefined
  const tools = readBooleanRecord(record.tools)
  return { name, provider, model, description, permission, tools }
}

function readBooleanRecord(value: unknown): Record<string, boolean> | undefined {
  if (typeof value !== "object" || value === null) return undefined
  const entries = Object.entries(value as Record<string, unknown>)
    .filter((entry): entry is [string, boolean] => typeof entry[1] === "boolean")
  return entries.length > 0 ? Object.fromEntries(entries) : undefined
}
