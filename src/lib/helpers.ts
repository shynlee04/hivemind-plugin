import type { PermissionRule } from "./types.js"

const RESTRICTED_TOOLS_PER_AGENT: Record<string, string[]> = {
  researcher: ["edit", "write", "bash", "task", "skill", "webfetch", "websearch"],
  critic: ["edit", "write", "task", "skill"],
}

export function isToolRestrictedForAgent(toolName: string, agent: string): boolean {
  const restricted = RESTRICTED_TOOLS_PER_AGENT[agent]
  if (!restricted) return false
  return restricted.includes(toolName)
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value)
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function getNestedValue(value: unknown, path: string[]): unknown {
  let current: unknown = value
  for (const key of path) {
    if (!isObject(current) || !(key in current)) {
      return undefined
    }
    current = current[key]
  }
  return current
}

export function unwrapData<T = unknown>(response: unknown): T {
  if (isObject(response) && "error" in response && response.error) {
    const error = response.error
    const message =
      typeof error === "string"
        ? error
        : String(getNestedValue(error, ["message"]) ?? "Unknown SDK error")
    throw new Error(message)
  }
  if (isObject(response) && "data" in response && response.data !== undefined) {
    return response.data as T
  }
  return response as T
}

export function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined
}

export function getPromptToolCompatibility(
  permissionRules: PermissionRule[]
): Record<string, boolean> | undefined {
  const tools: Record<string, boolean> = {}

  for (const rule of permissionRules) {
    if (rule.action !== "deny") {
      continue
    }
    tools[rule.permission] = false
  }

  return Object.keys(tools).length > 0 ? tools : undefined
}

export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`
  }
  const entries = Object.entries(value).sort(([left], [right]) => left.localeCompare(right))
  return `{${entries
    .map(([key, entryValue]) => `${JSON.stringify(key)}:${stableStringify(entryValue)}`)
    .join(",")}}`
}

export function makeToolSignature(toolName: string, args: unknown): string {
  try {
    return `${toolName}:${stableStringify(args)}`
  } catch {
    return `${toolName}:<unserializable>`
  }
}

const AGENT_REQUIRED_TOOLS: Record<string, string[]> = {
  researcher: ["read", "glob", "grep", "webfetch", "websearch"],
  builder: ["read", "glob", "grep", "edit", "write", "bash"],
  critic: ["read", "glob", "grep", "bash"],
}

const AGENT_MUST_NOT: Record<string, string[]> = {
  researcher: ["edit", "write", "bash", "task", "skill", "webfetch", "websearch"],
  builder: [],
  critic: ["edit", "write", "task", "skill"],
}

export function buildPromptText(args: {
  description: string
  prompt: string
  category?: string
  scope?: string
  constraints?: string[]
  guidanceText?: string
  agent?: string
}): string {
  const agent = args.agent ?? "builder"
  const requiredTools = AGENT_REQUIRED_TOOLS[agent] ?? AGENT_REQUIRED_TOOLS["builder"]
  const mustNotTools = AGENT_MUST_NOT[agent] ?? []

  const task = `TASK: ${args.description.trim()}\n${args.prompt.trim()}`

  const expectedOutcome = args.guidanceText?.trim()
    ? `EXPECTED OUTCOME: ${args.guidanceText.trim()}`
    : "EXPECTED OUTCOME: Complete the task as described"

  const requiredToolsSection = `REQUIRED TOOLS: ${requiredTools.join(", ")}`

  const mustDo =
    args.constraints && args.constraints.length > 0
      ? `MUST DO:\n${args.constraints.map((c) => `- ${c}`).join("\n")}`
      : "MUST DO: Follow the task instructions precisely"

  const mustNotDo =
    mustNotTools.length > 0
      ? `MUST NOT DO:\n${mustNotTools.map((m) => `- ${m}`).join("\n")}`
      : "MUST NOT DO: None specified"

  const contextParts: string[] = []
  if (args.scope?.trim()) contextParts.push(`scope: ${args.scope.trim()}`)
  if (args.category?.trim()) contextParts.push(`category: ${args.category.trim()}`)
  contextParts.push(`agent: ${agent}`)
  const context =
    contextParts.length > 0
      ? `CONTEXT: ${contextParts.join(", ")}`
      : "CONTEXT: No additional context"

  return [task, expectedOutcome, requiredToolsSection, mustDo, mustNotDo, context].join("\n---\n")
}
