/**
 * HiveMind Init — Interactive project initialization.
 *
 * Creates:
 *   - .opencode/planning/ directory structure
 *   - index.md with template
 *   - active.md with LOCKED status
 *   - brain.json with initial state
 *   - config.json with governance preferences
 */

import { existsSync } from "node:fs"
import { join } from "node:path"
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

export async function initProject(
  directory: string,
  options: InitOptions = {}
): Promise<void> {
  const planningDir = join(directory, ".opencode", "planning")
  const brainPath = join(planningDir, "brain.json")

  // Guard: Check brain.json existence, not just directory.
  // The directory may exist from logger side-effects without full initialization.
  if (existsSync(brainPath)) {
    if (!options.silent) {
      log("⚠ HiveMind already initialized in this project.")
      log(`  Directory: ${planningDir}`)
      log("  Use 'hivemind status' to see current state.")
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

  // Save config
  await saveConfig(directory, config)

  // Initialize brain state
  const stateManager = createStateManager(directory)
  const sessionId = generateSessionId()
  const state = createBrainState(sessionId, config)
  await stateManager.save(state)

  if (!options.silent) {
    log("")
    log("✓ Planning directory created:")
    log(`  ${planningDir}/`)
    log("  ├── index.md      (project trajectory)")
    log("  ├── active.md     (current session)")
    log("  ├── brain.json    (machine state)")
    log("  ├── config.json   (governance settings)")
    log("  └── archive/      (completed sessions)")
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
    log("Add HiveMind to your opencode.json:")
    log('  "plugins": ["<path-to-hivemind-plugin>"]')
    log("")
  }
}
