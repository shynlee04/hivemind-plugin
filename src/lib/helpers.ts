import type { PermissionRule } from "./types.js"

export function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value)
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

/**
 * Extract a human-readable error message from OpenCode SDK error objects.
 *
 * SDK error structures vary — this function checks all known shapes:
 *   - String error: used as-is
 *   - Named errors (UnknownError, MessageAbortedError): `error.data.message`
 *   - BadRequestError: `error.errors[]` array with `.message` or `.reason`
 *   - Fallback: includes error name if available
 */
function extractSdkErrorMessage(error: unknown): string {
  if (typeof error === "string") return error

  if (!isObject(error)) return "Unknown SDK error"

  // Shape 1: Named errors — { name: "UnknownError", data: { message: "..." } }
  const dataMessage = getNestedValue(error, ["data", "message"])
  if (typeof dataMessage === "string" && dataMessage.length > 0) {
    return dataMessage
  }

  // Shape 2: Validation arrays — { errors: [...] } or { error: [...] }
  const validationErrors = [getNestedValue(error, ["errors"]), getNestedValue(error, ["error"])]
  for (const errors of validationErrors) {
    if (!Array.isArray(errors) || errors.length === 0) {
      continue
    }

    const messages = errors
      .map((e) => {
        if (!isObject(e)) return JSON.stringify(e)
        return (
          (typeof e.message === "string" && e.message) ||
          (typeof e.reason === "string" && e.reason) ||
          JSON.stringify(e)
        )
      })
      .filter(Boolean)
    if (messages.length > 0) {
      return messages.join("; ")
    }
  }

  // Shape 3: Direct message at top level (rare but possible)
  const topLevelMessage = getNestedValue(error, ["message"])
  if (typeof topLevelMessage === "string" && topLevelMessage.length > 0) {
    return topLevelMessage
  }

  // Fallback: include error name if available
  const name = getNestedValue(error, ["name"])
  if (typeof name === "string" && name.length > 0) {
    return `${name}: ${JSON.stringify(error)}`
  }

  return `Unknown SDK error: ${JSON.stringify(error).slice(0, 200)}`
}

export function unwrapData<T = unknown>(response: unknown): T {
  if (isObject(response) && "error" in response && response.error) {
    const error = response.error
    const message = extractSdkErrorMessage(error)
    throw new Error(`[Harness] ${message}`)
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

export function buildPromptText(args: {
  description: string
  prompt: string
  category?: string
  scope?: string
  constraints?: string[]
  guidanceText?: string
  agent?: string
  requiredTools?: string[]
  mustNotDo?: string[]
  sessionContext?: string
}): string {
  const agent = args.agent ?? "builder"
  const requiredTools = args.requiredTools ?? []
  const mustNotTools = args.mustNotDo ?? []

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

  const sessionSection = args.sessionContext?.trim()
    ? `\n---\n## Session Context\n${args.sessionContext.trim()}`
    : ""

  return [task, expectedOutcome, requiredToolsSection, mustDo, mustNotDo, context].join("\n---\n") + sessionSection
}
