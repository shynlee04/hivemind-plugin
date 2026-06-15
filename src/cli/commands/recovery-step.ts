import { existsSync, readFileSync, writeFileSync, renameSync, mkdirSync } from "node:fs"
import { dirname } from "node:path"

import type * as ClackPrompts from "@clack/prompts"

import { getDefaultConfigs } from "../../schema-kernel/hivemind-configs.schema.js"

type PromptModule = typeof ClackPrompts

/**
 * Check if configs.json exists and offer recovery if missing.
 * If the file is missing, creates a minimal default config and logs a message.
 * If the file exists but is invalid JSON, offers to back up and recreate.
 *
 * @param configsPath - Absolute path to `.hivemind/configs.json`.
 * @param prompts - Loaded clack prompts module (null = non-interactive).
 * @returns `true` if recovery was performed, `false` if config was already valid.
 */
export async function stepRecoveryCheck(
  configsPath: string,
  prompts: PromptModule | null,
): Promise<boolean> {
  if (existsSync(configsPath)) {
    // Validate existing config
    try {
      const raw = readFileSync(configsPath, "utf8")
      JSON.parse(raw)
      return false // Config is valid, no recovery needed
    } catch {
      // Invalid JSON — offer recovery
      if (prompts === null) {
        // Non-interactive: back up and recreate with full defaults
        const backupPath = `${configsPath}.backup.${Date.now()}`
        renameSync(configsPath, backupPath)
        const defaults = getDefaultConfigs()
        writeFileSync(configsPath, JSON.stringify(defaults, null, 2) + "\n", "utf8")
        console.log(`[Hivemind] Backed up corrupt config to ${backupPath}`)
        return true
      }

      const shouldRecover = await prompts.confirm({
        message: "Existing configs.json is invalid. Back up and recreate with defaults?",
        initialValue: true,
      })

      if (shouldRecover && !prompts.isCancel(shouldRecover)) {
        const backupPath = `${configsPath}.backup.${Date.now()}`
        renameSync(configsPath, backupPath)
        const defaults = getDefaultConfigs()
        writeFileSync(configsPath, JSON.stringify(defaults, null, 2) + "\n", "utf8")
        console.log(`[Hivemind] Backed up corrupt config to ${backupPath}`)
        return true
      }

      return false
    }
  }

  // Config doesn't exist — create with full defaults
  mkdirSync(dirname(configsPath), { recursive: true })
  const defaults = getDefaultConfigs()
  writeFileSync(configsPath, JSON.stringify(defaults, null, 2) + "\n", "utf8")
  console.log(`[Hivemind] Created default configs.json at ${configsPath}`)
  return true
}
