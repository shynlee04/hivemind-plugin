import { mkdirSync, writeFileSync, renameSync } from "node:fs"
import { dirname } from "node:path"
import { randomBytes } from "node:crypto"

import type { HivemindConfigs } from "../../schema-kernel/hivemind-configs.schema.js"
import { HivemindConfigsSchema } from "../../schema-kernel/hivemind-configs.schema.js"

/**
 * Validate config against schema and write atomically (temp + rename).
 * Writes to a temp file first, validates, then renames to the target path.
 *
 * @param configsPath - Absolute path to `.hivemind/configs.json`.
 * @param config - The config object to write.
 * @throws If validation fails or write fails.
 */
export async function stepAtomicWrite(
  configsPath: string,
  config: Partial<HivemindConfigs>,
): Promise<void> {
  // Validate against schema (fill defaults)
  const validated = HivemindConfigsSchema.parse(config)

  // Atomic write: temp file + rename
  const tempPath = `${configsPath}.tmp.${randomBytes(8).toString("hex")}`
  const configDir = dirname(configsPath)
  mkdirSync(configDir, { recursive: true })

  try {
    writeFileSync(tempPath, `${JSON.stringify(validated, null, 2)}\n`, "utf8")
    renameSync(tempPath, configsPath)
  } catch (cause) {
    // Clean up temp file on failure
    try {
      const { unlinkSync } = await import("node:fs")
      unlinkSync(tempPath)
    } catch {
      // Ignore cleanup errors
    }
    throw new Error(
      `[Hivemind] Failed to write configs.json: ${cause instanceof Error ? cause.message : String(cause)}`,
    )
  }

  console.log(`[Hivemind] Configuration written to ${configsPath}`)
}
