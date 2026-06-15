import { getAppAgents } from "../../shared/app-api.js"
import type { OpenCodeClient } from "../../shared/session-api.js"
import { enrichAgentFromPrimitives, parsePermissionRecord, parseToolBooleans } from "../spawner/agent-primitive-policy.js"
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
      throw new Error(`[Hivemind] Unknown delegation agent "${agentName}"`)
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

/**
 * Validate that an agent name exists in the OpenCode app registry with
 * graceful degradation when the server returns agents with missing fields.
 *
 * Extracted from `manager-runtime.ts` as part of REQ-01 consolidation.
 *
 * @param client - OpenCode SDK client with `app.log` for warning reporting
 * @param agent - Agent name to validate
 * @param projectRoot - Project root directory for agent enrichment
 * @returns Validated agent with enriched primitives
 */
export async function validateAgent(
  client: Pick<OpenCodeClient, "app">,
  agent: string,
  projectRoot: string,
): Promise<ValidatedAgent> {
  let agents: Array<Record<string, unknown>> | undefined

  try {
    agents = (await getAppAgents(client as OpenCodeClient)).filter(
      (entry): entry is Record<string, unknown> => !!entry && typeof entry === "object" && !Array.isArray(entry),
    )
  } catch (error) {
    // R-AGENT-01: OpenCode server's /agent endpoint occasionally returns agents
    // with missing required string fields, causing SDK Zod validation errors
    // ("expected string, received undefined"). We gracefully degrade to
    // unvalidated agent acceptance rather than blocking all delegation.
    const message = error instanceof Error ? error.message : String(error)
    if (message.includes("expected string, received undefined")) {
      void client.app?.log?.({
        body: {
          service: "delegation",
          level: "warn",
          message: `[Hivemind] Agent list validation skipped — server returned agents with missing fields. Proceeding with unvalidated agent "${agent}".`,
        },
      })
      return enrichAgentFromPrimitives({ name: agent }, projectRoot)
    }
    throw error
  }

  const validAgents = (agents ?? []).map((e) => ({
    name: typeof e.name === "string" ? e.name : "",
    provider: typeof e.provider === "string" ? e.provider : undefined,
    model: typeof e.model === "string" ? e.model : undefined,
    description: typeof e.description === "string" ? e.description : undefined,
    permission: parsePermissionRecord(e.permission),
    tools: parseToolBooleans(e.tools),
  })).filter((e) => e.name.length > 0)
  const names = validAgents.map((e) => e.name)
  if (!names.includes(agent)) {
    throw new Error(`[Hivemind] Invalid agent: "${agent}". Available: [${names.join(", ")}]`)
  }
  return enrichAgentFromPrimitives(validAgents.find((e) => e.name === agent) ?? { name: agent }, projectRoot)
}
