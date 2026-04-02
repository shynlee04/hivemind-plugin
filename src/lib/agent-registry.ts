export type PermissionValue = "allow" | "deny" | "ask" | Record<string, string>

export type AgentConfig = {
  description?: string
  mode?: string
  temperature?: number
  steps?: number
  hidden?: boolean
  permission?: Record<string, PermissionValue>
  model?: string
}

export function parseAgentFrontmatter(markdown: string): AgentConfig {
  const config: AgentConfig = {}

  const frontmatterMatch = markdown.match(/^---\s*\n([\s\S]*?)\n---/)
  if (!frontmatterMatch) {
    return config
  }

  const frontmatter = frontmatterMatch[1]
  const lines = frontmatter.split("\n")
  let currentKey = ""
  let currentObj: Record<string, unknown> | null = null
  let skipUntil = -1

  for (let i = 0; i < lines.length; i++) {
    if (i < skipUntil) continue
    const line = lines[i]
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue

    const colonIndex = trimmed.indexOf(":")
    if (colonIndex === -1) continue

    const key = trimmed.substring(0, colonIndex).trim()
    const value = trimmed.substring(colonIndex + 1).trim()

    if (!line.startsWith(" ") && !line.startsWith("\t")) {
      if (currentKey && currentObj) {
        if (currentKey === "permission") {
          config.permission = currentObj as Record<string, PermissionValue>
        }
      }
      currentKey = key
      currentObj = {}

      if (key === "description") {
        config.description = value.replace(/^"(.*)"$/, "$1")
      } else if (key === "mode") {
        config.mode = value
      } else if (key === "temperature") {
        config.temperature = parseFloat(value)
      } else if (key === "steps") {
        config.steps = parseInt(value, 10)
      } else if (key === "hidden") {
        config.hidden = value === "true"
      } else if (key === "model") {
        config.model = value.replace(/^"(.*)"$/, "$1")
      }
    } else if (currentKey === "permission" && currentObj) {
      if (value) {
        const pKey = key
        const pValue = value.replace(/^"(.*)"$/, "$1") as string
        currentObj[pKey] = pValue
      } else {
        const subKey = key
        const subObj: Record<string, string> = {}
        let lastSubLine = i + 1
        for (let j = i + 1; j < lines.length; j++) {
          const subLine = lines[j]
          if (!subLine.startsWith("  ") && !subLine.startsWith("\t")) break
          if (!subLine.startsWith("    ")) break
          const subColon = subLine.trim().indexOf(":")
          if (subColon === -1) continue
          const sKey = subLine.trim().substring(0, subColon).trim().replace(/^"(.*)"$/, "$1")
          const sVal = subLine.trim().substring(subColon + 1).trim().replace(/^"(.*)"$/, "$1")
          subObj[sKey] = sVal
          lastSubLine = j + 1
        }
        if (Object.keys(subObj).length > 0) {
          currentObj[subKey] = subObj
        }
        skipUntil = lastSubLine
      }
    }
  }

  if (currentKey === "permission" && currentObj) {
    config.permission = currentObj as Record<string, PermissionValue>
  }

  return config
}

export function getPermissionForTool(
  permission: Record<string, PermissionValue> | undefined,
  toolName: string
): PermissionValue | undefined {
  if (!permission) return undefined
  return permission[toolName]
}

export function isToolDenied(
  permission: Record<string, PermissionValue> | undefined,
  toolName: string
): boolean {
  const value = getPermissionForTool(permission, toolName)
  if (value === "deny") return true
  if (typeof value === "object" && value && value["*"] === "deny") return true
  return false
}
