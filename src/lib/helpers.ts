import type { PermissionRule } from "./types.js"

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

export function buildPromptText(args: {
  description: string
  prompt: string
  category?: string
  scope?: string
  constraints?: string[]
  guidanceText?: string
}): string {
  const lines = [`Task: ${args.description.trim()}`, "", args.prompt.trim()]

  if (args.category?.trim()) {
    lines.push("", `Category: ${args.category.trim()}`)
  }

  if (args.scope?.trim()) {
    lines.push("", `Scope: ${args.scope.trim()}`)
  }

  if (args.constraints && args.constraints.length > 0) {
    lines.push("", "Constraints:")
    for (const constraint of args.constraints) {
      lines.push(`- ${constraint}`)
    }
  }

  if (args.guidanceText?.trim()) {
    lines.push("", "Category guidance:", args.guidanceText.trim())
  }

  return lines.join("\n")
}
