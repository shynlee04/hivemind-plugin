/**
 * HiveMind Init — One-command project initialization.
 *
 * Creates:
 *   - .hivemind/ directory structure
 *   - index.md with template
 *   - active.md with LOCKED status
 *   - brain.json with initial state
 *   - config.json with governance preferences
 *   - Auto-registers plugin in opencode.json
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { copyFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const __dirname = dirname(fileURLToPath(import.meta.url))
import type { GovernanceMode, Language, ExpertLevel, OutputStyle } from "../schemas/config.js"
import { createConfig, isValidGovernanceMode, isValidLanguage, isValidExpertLevel, isValidOutputStyle } from "../schemas/config.js"
import { createBrainState, generateSessionId } from "../schemas/brain-state.js"
import { createStateManager, saveConfig } from "../lib/persistence.js"
import { initializePlanningDirectory } from "../lib/planning-fs.js"

export interface InitOptions {
  language?: Language
  governanceMode?: GovernanceMode
  expertLevel?: ExpertLevel
  outputStyle?: OutputStyle
  requireCodeReview?: boolean
  enforceTdd?: boolean
  silent?: boolean
}

// eslint-disable-next-line no-console
const log = (msg: string) => console.log(msg)

const PLUGIN_NAME = "hivemind-context-governance"

/**
 * Auto-register the HiveMind plugin in opencode.json.
 * Creates the file if it doesn't exist.
 * Adds the plugin if not already registered.
 */
function registerPluginInConfig(directory: string, silent: boolean): void {
  // Check both opencode.json and opencode.jsonc
  let configPath = join(directory, "opencode.json")
  if (!existsSync(configPath)) {
    const jsoncPath = join(directory, "opencode.jsonc")
    if (existsSync(jsoncPath)) {
      configPath = jsoncPath
    }
  }

  let config: Record<string, unknown> = {}

  if (existsSync(configPath)) {
    try {
      let raw = readFileSync(configPath, "utf-8")
      // Strip single-line comments for JSONC support
      raw = raw.replace(/^\s*\/\/.*$/gm, "")
      // Strip trailing commas before } or ]
      raw = raw.replace(/,\s*([}\]])/g, "$1")
      config = JSON.parse(raw)
    } catch (err) {
      // Malformed JSON — warn and preserve, don't overwrite
      if (!silent) {
        log(`  ⚠ Could not parse ${configPath}: ${err instanceof Error ? err.message : err}`)
        log(`  ⚠ Creating new opencode.json (existing file preserved)`)
      }
      configPath = join(directory, "opencode.json")
      config = {}
    }
  }

  // Ensure plugin array exists
  if (!Array.isArray(config.plugin)) {
    config.plugin = []
  }

  const plugins = config.plugin as string[]

  // Check if already registered (exact match or versioned match)
  const alreadyRegistered = plugins.some(
    (p) => p === PLUGIN_NAME || p.startsWith(PLUGIN_NAME + "@")
  )

  if (alreadyRegistered) {
    if (!silent) {
      log(`  ✓ Plugin already registered in opencode.json`)
    }
    return
  }

  plugins.push(PLUGIN_NAME)
  config.plugin = plugins

  writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n", "utf-8")

  if (!silent) {
    log(`  ✓ Plugin registered in opencode.json`)
    log(`    → OpenCode will auto-install on next launch`)
  }
}

export async function initProject(
  directory: string,
  options: InitOptions = {}
): Promise<void> {
  const hivemindDir = join(directory, ".hivemind")
  const brainPath = join(hivemindDir, "brain.json")

  // Guard: Check brain.json existence, not just directory.
  // The directory may exist from logger side-effects without full initialization.
  if (existsSync(brainPath)) {
    if (!options.silent) {
      log("⚠ HiveMind already initialized in this project.")
      log(`  Directory: ${hivemindDir}`)
      log("  Use 'npx hivemind-context-governance status' to see current state.")
    }
    return
  }

  if (!options.silent) {
    log("")
    log("🐝 HiveMind Context Governance — Initialization")
    log("─".repeat(48))
  }

  // Validate and set governance mode
  const governanceMode = options.governanceMode ?? "assisted"
  if (!isValidGovernanceMode(governanceMode)) {
    log(`✗ Invalid governance mode: ${governanceMode}`)
    log("  Valid: permissive, assisted, strict")
    return
  }

  // Validate and set language
  const language = options.language ?? "en"
  if (!isValidLanguage(language)) {
    log(`✗ Invalid language: ${language}`)
    log("  Valid: en, vi")
    return
  }

  // Validate and set expert level
  const expertLevel = options.expertLevel ?? "intermediate"
  if (!isValidExpertLevel(expertLevel)) {
    log(`✗ Invalid expert level: ${expertLevel}`)
    log("  Valid: beginner, intermediate, advanced, expert")
    return
  }

  // Validate and set output style
  const outputStyle = options.outputStyle ?? "explanatory"
  if (!isValidOutputStyle(outputStyle)) {
    log(`✗ Invalid output style: ${outputStyle}`)
    log("  Valid: explanatory, outline, skeptical, architecture, minimal")
    return
  }

  // Create .hivemind directory structure
  // (sessions, brain, plans, logs subdirectories are created by initializePlanningDirectory)

  // Create config with agent behavior
  const config = createConfig({
    governance_mode: governanceMode,
    language,
    agent_behavior: {
      language,
      expert_level: expertLevel,
      output_style: outputStyle,
      constraints: {
        require_code_review: options.requireCodeReview ?? false,
        enforce_tdd: options.enforceTdd ?? false,
        max_response_tokens: 2000,
        explain_reasoning: true,
        be_skeptical: outputStyle === "skeptical",
      },
    },
  })

  if (!options.silent) {
    log(`  Governance: ${governanceMode}`)
    log(`  Language: ${language}`)
    log(`  Expert Level: ${expertLevel}`)
    log(`  Output Style: ${outputStyle}`)
    if (options.requireCodeReview) log("  ✓ Code review required")
    if (options.enforceTdd) log("  ✓ TDD enforced")
    log("")
  }

  // Create planning directory structure
  if (!options.silent) {
    log("Creating planning directory...")
  }
  await initializePlanningDirectory(directory)

  // Copy 10 Commandments to .hivemind
  const commandmentsSource = join(__dirname, "..", "..", "docs", "10-commandments.md")
  const commandmentsDest = join(hivemindDir, "10-commandments.md")
  await copyFile(commandmentsSource, commandmentsDest)
  if (!options.silent) {
    log(`  ✓ Copied 10 Commandments to ${hivemindDir}/`)
  }

  // Save config
  await saveConfig(directory, config)

  // Initialize brain state
  const stateManager = createStateManager(directory)
  const sessionId = generateSessionId()
  const state = createBrainState(sessionId, config)
  await stateManager.save(state)

  // Auto-register plugin in opencode.json
  registerPluginInConfig(directory, options.silent ?? false)

  if (!options.silent) {
    log("")
    log("✓ Planning directory created:")
    log(`  ${hivemindDir}/`)
    log("  ├── 10-commandments.md   (tool design reference)")
    log("  ├── sessions/")
    log("  │   ├── index.md         (project trajectory)")
    log("  │   ├── active.md        (current session)")
    log("  │   ├── manifest.json    (session registry)")
    log("  │   └── archive/         (completed sessions)")
    log("  ├── templates/")
    log("  │   └── session.md       (session template)")
    log("  ├── brain.json           (machine state)")
    log("  └── config.json          (governance settings)")
    log("")
    log(`Session ${sessionId} initialized.`)
    log(`Status: ${state.session.governance_status}`)
    log("")

    if (governanceMode === "strict") {
      log("🔒 STRICT MODE — agents must call declare_intent before writing.")
    } else if (governanceMode === "assisted") {
      log("🔔 ASSISTED MODE — agents get warnings but can proceed.")
    } else {
      log("🟢 PERMISSIVE MODE — agents work freely, activity tracked.")
    }

    log("")
    log("✅ Done! Open OpenCode in this project — HiveMind is active.")
    log("")
  }
}
