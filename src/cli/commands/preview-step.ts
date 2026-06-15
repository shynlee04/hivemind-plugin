import type * as ClackPrompts from "@clack/prompts"

type PromptModule = typeof ClackPrompts

interface ConfigChange {
  type: "added" | "removed" | "changed"
  path: string
  detail: string
}

function diffConfig(
  oldObj: Record<string, unknown>,
  newObj: Record<string, unknown>,
  prefix = "",
): ConfigChange[] {
  const changes: ConfigChange[] = []
  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)])

  for (const key of allKeys) {
    const path = prefix ? `${prefix}.${key}` : key
    const oldVal = oldObj[key]
    const newVal = newObj[key]

    if (!(key in oldObj)) {
      changes.push({ type: "added", path, detail: formatValue(newVal) })
    } else if (!(key in newObj)) {
      changes.push({ type: "removed", path, detail: formatValue(oldVal) })
    } else if (typeof oldVal === "object" && typeof newVal === "object" && oldVal !== null && newVal !== null) {
      changes.push(...diffConfig(oldVal as Record<string, unknown>, newVal as Record<string, unknown>, path))
    } else if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changes.push({ type: "changed", path, detail: `${formatValue(oldVal)} → ${formatValue(newVal)}` })
    }
  }

  return changes
}

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return "null"
  if (typeof val === "string") return `"${val}"`
  if (typeof val === "boolean" || typeof val === "number") return String(val)
  return JSON.stringify(val)
}

/**
 * Show a diff preview of the config changes before writing.
 * Compares old config (or empty) with the new config and displays
 * added/removed/changed fields. User must confirm before write.
 *
 * @param prompts - Loaded clack prompts module.
 * @param oldConfig - Current config JSON string (or `"{}"` if none).
 * @param newConfig - New config JSON string.
 * @returns `true` if user confirms, `false` if cancelled.
 */
export async function stepDiffPreview(
  prompts: PromptModule,
  oldConfig: string,
  newConfig: string,
): Promise<boolean> {
  prompts.log.step("Configuration Preview")

  try {
    const oldParsed = JSON.parse(oldConfig) as Record<string, unknown>
    const newParsed = JSON.parse(newConfig) as Record<string, unknown>

    const changes = diffConfig(oldParsed, newParsed)

    if (changes.length === 0) {
      prompts.log.info("No changes to configuration.")
      return true
    }

    prompts.log.message(`Changes (${changes.length} fields):`)
    for (const change of changes) {
      const icon = change.type === "added" ? "+" : change.type === "removed" ? "-" : "~"
      prompts.log.message(`  ${icon} ${change.path}: ${change.detail}`)
    }
  } catch {
    // If diff fails, just show the full config
    prompts.log.info("New configuration:")
    prompts.log.message(newConfig)
  }

  const confirmed = await prompts.confirm({
    message: "Write this configuration?",
    initialValue: true,
  })

  return !prompts.isCancel(confirmed) && confirmed === true
}
