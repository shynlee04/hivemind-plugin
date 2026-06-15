import { existsSync, readFileSync, readdirSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

import type { HivemindConfigs } from "../../schema-kernel/hivemind-configs.schema.js"

/**
 * @module preset-loader
 *
 * Load configuration presets from `assets/templates/configs-presets/`.
 * Presets provide pre-configured HivemindConfigs for common workflows.
 *
 * Preset JSON files are partial configs — they are merged with schema
 * defaults via `HivemindConfigsSchema.parse()` at write time.
 *
 * @example
 * ```ts
 * import { loadPreset, listPresets } from "./preset-loader.js"
 *
 * const presets = listPresets()
 * // [{ name: "default", label: "Default", description: "..." }, ...]
 *
 * const config = loadPreset("expert")
 * // Partial<HivemindConfigs> with expert-level settings
 * ```
 */

/**
 * Metadata for a single preset, returned by {@link listPresets}.
 */
export interface PresetMeta {
  /** Preset filename without `.json` extension (e.g., `"default"`). */
  name: string
  /** Human-readable label from the preset's `"label"` field, or fallback to name. */
  label: string
  /** Description from the preset's `"description"` field, or fallback to empty. */
  description: string
}

/**
 * Resolved absolute path to the `assets/templates/configs-presets/` directory.
 */
const PRESETS_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../assets/templates/configs-presets",
)

/**
 * List all available configuration presets.
 *
 * Scans the presets directory for `.json` files and extracts metadata
 * from each preset's top-level `label` and `description` fields.
 *
 * @returns Array of preset metadata, sorted by name.
 *
 * @example
 * ```ts
 * const presets = listPresets()
 * for (const p of presets) {
 *   console.log(`${p.name}: ${p.description}`)
 * }
 * ```
 */
export function listPresets(): PresetMeta[] {
  if (!existsSync(PRESETS_DIR)) {
    return []
  }

  let files: string[]
  try {
    files = readdirSync(PRESETS_DIR).filter((f) => f.endsWith(".json"))
  } catch {
    return []
  }

  return files
    .map((file) => {
      const name = file.replace(/\.json$/, "")
      try {
        const raw = JSON.parse(readFileSync(join(PRESETS_DIR, file), "utf8")) as Record<string, unknown>
        return {
          name,
          label: typeof raw.label === "string" ? raw.label : name,
          description: typeof raw.description === "string" ? raw.description : "",
        }
      } catch {
        return { name, label: name, description: "" }
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Load a configuration preset by name.
 *
 * Returns the raw partial config object from the preset file.
 * The caller should merge this with schema defaults before writing.
 *
 * @param presetName - The preset name (filename without `.json`).
 * @returns Partial HivemindConfigs from the preset file.
 * @throws If the preset file does not exist or contains invalid JSON.
 *
 * @example
 * ```ts
 * const config = loadPreset("default")
 * // { conversation_language: "en", mode: "expert-advisor", ... }
 * ```
 */
export function loadPreset(presetName: string): Partial<HivemindConfigs> {
  const presetPath = join(PRESETS_DIR, `${presetName}.json`)

  if (!existsSync(presetPath)) {
    throw new Error(`[Hivemind] Preset not found: ${presetName} (looked at ${presetPath})`)
  }

  try {
    const raw = readFileSync(presetPath, "utf8")
    const parsed = JSON.parse(raw) as Record<string, unknown>

    // Strip metadata fields that are not part of HivemindConfigs
    const { label: _label, description: _description, ...config } = parsed
    void _label
    void _description

    return config as Partial<HivemindConfigs>
  } catch (cause) {
    throw new Error(
      `[Hivemind] Failed to load preset "${presetName}": ${cause instanceof Error ? cause.message : String(cause)}`,
    )
  }
}
