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
import { copyFile, mkdir, rm } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const __dirname = dirname(fileURLToPath(import.meta.url))
import type { GovernanceMode, Language, ExpertLevel, OutputStyle, AutomationLevel, ProfilePresetKey, OpenCodeSettings } from "../schemas/config.js"
import {
  AUTOMATION_LEVELS,
  EXPERT_LEVELS,
  GOVERNANCE_MODES,
  LANGUAGES,
  OUTPUT_STYLES,
  PROFILE_PRESETS,
  createConfig,
  isValidGovernanceMode,
  isValidLanguage,
  isValidExpertLevel,
  isValidOutputStyle,
  isValidProfilePreset,
  isCoachAutomation,
  normalizeAutomationInput,
  normalizeAutomationLabel,
} from "../schemas/config.js"
import { createBrainState, generateSessionId } from "../schemas/brain-state.js"
import { createStateManager, saveConfig } from "../lib/persistence.js"
import { initializePlanningDirectory } from "../lib/planning-fs.js"
import { getEffectivePaths } from "../lib/paths.js"
import { migrateIfNeeded } from "../lib/migrate.js"
import { syncOpencodeAssets } from "./sync-assets.js"
import type { AssetSyncTarget } from "./sync-assets.js"
import { createTree, saveTree } from "../lib/hierarchy-tree.js"

// ── HiveMind Section for AGENTS.md / CLAUDE.md ──────────────────────────

const HIVEMIND_SECTION_MARKER = "<!-- HIVEMIND-GOVERNANCE-START -->"
const HIVEMIND_SECTION_END_MARKER = "<!-- HIVEMIND-GOVERNANCE-END -->"

/**
 * Generates the HiveMind section to append to AGENTS.md or CLAUDE.md.
 * This survives model changes, compaction, and chaos — any AI agent reads AGENTS.md.
 */
function generateHiveMindAgentsSection(): string {
  return `
${HIVEMIND_SECTION_MARKER}

## HiveMind Context Governance

This project uses **HiveMind** for AI session management. It prevents drift, tracks decisions, and preserves memory across sessions.

### Required Workflow

1. **START** every session with:
   \`\`\`
   declare_intent({ mode: "plan_driven" | "quick_fix" | "exploration", focus: "What you're working on" })
   \`\`\`
2. **UPDATE** when switching focus:
   \`\`\`
   map_context({ level: "trajectory" | "tactic" | "action", content: "New focus" })
   \`\`\`
3. **END** when done:
   \`\`\`
   compact_session({ summary: "What was accomplished" })
   \`\`\`

### Available Tools (10)

| Group | Tools |
|-------|-------|
| Core | \`declare_intent\`, \`map_context\`, \`compact_session\` |
| Cognitive Mesh | \`scan_hierarchy\`, \`save_anchor\`, \`think_back\` |
| Memory | \`save_mem\`, \`recall_mems\` |
| Hierarchy | \`hierarchy_manage\` |
| Delegation | \`export_cycle\` |

### Why It Matters

- **Without \`declare_intent\`**: Drift detection is OFF, work is untracked
- **Without \`map_context\`**: Context degrades every turn, warnings pile up
- **Without \`compact_session\`**: Intelligence lost on session end
- **\`save_mem\` + \`recall_mems\`**: Persistent memory across sessions — decisions survive

### State Files

- \`.hivemind/state/brain.json\` — Machine state (do not edit manually)
- \`.hivemind/state/hierarchy.json\` — Decision tree
- \`.hivemind/sessions/\` — Session files and archives

${HIVEMIND_SECTION_END_MARKER}
`
}

/**
 * Inject HiveMind section into AGENTS.md and/or CLAUDE.md.
 * - Creates the file if it doesn't exist
 * - Appends section if not already present
 * - Updates section if already present (idempotent)
 */
export function injectAgentsDocs(directory: string, silent: boolean): void {
  const targetFiles = ["AGENTS.md", "CLAUDE.md"]

  for (const filename of targetFiles) {
    const filePath = join(directory, filename)
    const section = generateHiveMindAgentsSection()

    if (existsSync(filePath)) {
      const existing = readFileSync(filePath, "utf-8")

      // Already has HiveMind section — update it (idempotent)
      if (existing.includes(HIVEMIND_SECTION_MARKER)) {
        const startIdx = existing.indexOf(HIVEMIND_SECTION_MARKER)
        const endIdx = existing.indexOf(HIVEMIND_SECTION_END_MARKER)
        if (endIdx > startIdx) {
          const updated = existing.substring(0, startIdx) +
            section.trim() + "\n" +
            existing.substring(endIdx + HIVEMIND_SECTION_END_MARKER.length)
          writeFileSync(filePath, updated, "utf-8")
          if (!silent) {
            log(`  ✓ Updated HiveMind section in ${filename}`)
          }
        }
        continue
      }

      // Append section to existing file
      const updated = existing.trimEnd() + "\n" + section
      writeFileSync(filePath, updated, "utf-8")
      if (!silent) {
        log(`  ✓ Appended HiveMind section to ${filename}`)
      }
    }
    // Do NOT create the file if it doesn't exist — only inject into existing files
  }
}

export interface InitOptions {
  language?: Language
  governanceMode?: GovernanceMode
  expertLevel?: ExpertLevel
  outputStyle?: OutputStyle
  automationLevel?: AutomationLevel | string
  requireCodeReview?: boolean
  enforceTdd?: boolean
  syncTarget?: AssetSyncTarget
  overwriteAssets?: boolean
  silent?: boolean
  force?: boolean
  /** Profile preset to apply (beginner, intermediate, advanced, expert, coach) */
  profile?: ProfilePresetKey
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

/**
 * Apply a profile preset to generate config and OpenCode settings.
 * When a profile is provided, it overrides individual options.
 */
function applyProfilePreset(
  profileKey: ProfilePresetKey,
  options: InitOptions
): { config: ReturnType<typeof createConfig>; opencodeSettings: OpenCodeSettings } {
  const preset = PROFILE_PRESETS[profileKey]

  // Normalize automation level from options if provided
  const normalizedAutomationLevel = options.automationLevel 
    ? normalizeAutomationInput(options.automationLevel) 
    : null

  // Apply preset to config - preset values take precedence over individual options
  const config = createConfig({
    governance_mode: options.governanceMode ?? preset.governance_mode,
    language: options.language ?? "en",
    automation_level: normalizedAutomationLevel ?? preset.automation_level,
    agent_behavior: {
      language: options.language ?? "en",
      expert_level: options.expertLevel ?? preset.expert_level,
      output_style: options.outputStyle ?? preset.output_style,
      constraints: {
        require_code_review: options.requireCodeReview ?? preset.require_code_review,
        enforce_tdd: options.enforceTdd ?? preset.enforce_tdd,
        max_response_tokens: 2000,
        explain_reasoning: true,
        be_skeptical: preset.output_style === "skeptical",
      },
    },
    profile: profileKey,
  })

  // Generate OpenCode settings with profile permissions
  const opencodeSettings: OpenCodeSettings = {
    default_permissions: preset.permissions,
  }

  return { config, opencodeSettings }
}

/**
 * Update opencode.json with profile-specific permissions.
 * Integrates with existing registerPluginInConfig logic.
 */
function updateOpencodeJsonWithProfile(
  directory: string,
  profileKey: ProfilePresetKey,
  silent: boolean
): void {
  const preset = PROFILE_PRESETS[profileKey]
  const configPath = join(directory, "opencode.json")
  let config: Record<string, unknown> = {}

  if (existsSync(configPath)) {
    try {
      let raw = readFileSync(configPath, "utf-8")
      // Strip single-line comments for JSONC support
      raw = raw.replace(/^\s*\/\/.*$/gm, "")
      // Strip trailing commas before } or ]
      raw = raw.replace(/,\s*([}\]])/g, "$1")
      config = JSON.parse(raw)
    } catch {
      // ignore parse errors - will use empty config
    }
  }

  // Add default permissions for HiveMind agents based on profile
  config.permission = {
    ...(config.permission as Record<string, unknown> | undefined),
    ...preset.permissions,
  }

  writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n", "utf-8")

  if (!silent) {
    log(`  ✓ Applied ${preset.label} profile permissions to opencode.json`)
  }
}

/**
 * Print success message after initialization.
 * Shared by both profile and manual configuration paths.
 */
async function printInitSuccess(
  directory: string,
  config: ReturnType<typeof createConfig>,
  sessionId: string,
  state: ReturnType<typeof createBrainState>,
  silent: boolean
): Promise<void> {
  if (silent) return

  const p = getEffectivePaths(directory)
  const hivemindDir = p.root

  log("")
  log("✓ Planning directory created:")
  log(`  ${hivemindDir}/`)
  log("  ├── INDEX.md             (root state entry point)")
  log("  ├── state/               (brain, hierarchy, anchors, tasks)")
  log("  ├── memory/              (mems + manifest)")
  log("  ├── sessions/")
  log("  │   ├── active/          (current session file)")
  log("  │   ├── manifest.json    (session registry)")
  log("  │   └── archive/         (completed sessions)")
  log("  ├── plans/               (plan registry)")
  log("  ├── codemap/             (SOT manifest)")
  log("  ├── codewiki/            (SOT manifest)")
  log("  ├── docs/                (10-commandments.md)")
  log("  ├── templates/")
  log("  │   └── session.md       (session template)")
  log("  ├── logs/                (runtime logs)")
  log("  └── config.json          (governance settings)")
  log("")
  log(`Session ${sessionId} initialized.`)
  log(`Status: ${state.session.governance_status}`)
  log("")

  if (config.governance_mode === "strict") {
    log("🔒 STRICT MODE — agents must call declare_intent before writing.")
  } else if (config.governance_mode === "assisted") {
    log("🔔 ASSISTED MODE — agents get warnings but can proceed.")
  } else {
    log("🟢 PERMISSIVE MODE — agents work freely, activity tracked.")
  }

  if (isCoachAutomation(config.automation_level)) {
    log("")
    log("🤯 COACH MODE ACTIVE:")
    log("   → Governance forced to STRICT")
    log("   → System will ARGUE BACK with evidence")
    log("   → Escalating pressure on every unresolved signal")
    log("   → Code review REQUIRED on all changes")
    log("   → Maximum guidance enabled")
  }

  log("")
  log("✅ Done! Open OpenCode in this project — HiveMind is active.")
  log("")
}

export async function initProject(
  directory: string,
  options: InitOptions = {}
): Promise<void> {
  let p = getEffectivePaths(directory)
  const hivemindDir = p.root

  // --force: Remove existing .hivemind directory for clean re-init
  if (options.force) {
    if (existsSync(hivemindDir)) {
      await rm(hivemindDir, { recursive: true, force: true })
      if (!options.silent) {
        log("🔄 Removed existing .hivemind/ directory for fresh init")
      }
    }
  }

  const migration = await migrateIfNeeded(directory)
  if (migration.migrated && !options.silent) {
    log(`🔄 Migrated legacy .hivemind structure (${migration.movedFiles.length} files moved)`)
  }

  p = getEffectivePaths(directory)
  const brainPath = p.brain

  // Guard: Check brain.json existence, not just directory.
  // The directory may exist from logger side-effects without full initialization.
  if (existsSync(brainPath)) {
    // Existing user upgrade path: keep state, refresh OpenCode assets, AND ensure plugin is registered
    await syncOpencodeAssets(directory, {
      target: options.syncTarget ?? "project",
      overwrite: options.overwriteAssets ?? false,
      silent: options.silent ?? false,
      onLog: options.silent ? undefined : log,
    })
    
    // Ensure plugin is registered in opencode.json (this was missing!)
    registerPluginInConfig(directory, options.silent ?? false)

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

  // ── Profile Preset Path ─────────────────────────────────────────────────────
  // When a profile is provided, it drives all configuration values
  if (options.profile && isValidProfilePreset(options.profile)) {
    const preset = PROFILE_PRESETS[options.profile]
    
    if (!options.silent) {
      log(`  Profile: ${preset.label}`)
      log(`  ${preset.description}`)
      log("")
    }

    const { config } = applyProfilePreset(options.profile, options)

    if (!options.silent) {
      log(`  Governance: ${config.governance_mode}`)
      log(`  Language: ${config.language}`)
      log(`  Expert Level: ${config.agent_behavior.expert_level}`)
      log(`  Output Style: ${config.agent_behavior.output_style}`)
      log(`  Automation: ${normalizeAutomationLabel(config.automation_level)}${isCoachAutomation(config.automation_level) ? " (max guidance)" : ""}`)
      if (config.agent_behavior.constraints.require_code_review) log("  ✓ Code review required")
      if (config.agent_behavior.constraints.enforce_tdd) log("  ✓ TDD enforced")
      log("")
    }

    // Create planning directory structure
    if (!options.silent) {
      log("Creating planning directory...")
    }
    await initializePlanningDirectory(directory)

    // Copy 10 Commandments to .hivemind
    const commandmentsSource = join(__dirname, "..", "..", "docs", "10-commandments.md")
    const commandmentsDest = join(p.docsDir, "10-commandments.md")
    await mkdir(p.docsDir, { recursive: true })
    await copyFile(commandmentsSource, commandmentsDest)
    if (!options.silent) {
      log(`  ✓ Copied 10 Commandments to ${p.docsDir}/`)
    }

    // Save config
    await saveConfig(directory, config)

    // Initialize brain state
    const stateManager = createStateManager(directory)
    const sessionId = generateSessionId()
    const state = createBrainState(sessionId, config)
    await stateManager.save(state)

    // Initialize empty hierarchy tree (required for session-lifecycle hook)
    await saveTree(directory, createTree())

    // Auto-register plugin in opencode.json
    registerPluginInConfig(directory, options.silent ?? false)

    // Apply profile permissions to opencode.json
    updateOpencodeJsonWithProfile(directory, options.profile, options.silent ?? false)

    // Auto-inject HiveMind section into AGENTS.md / CLAUDE.md
    injectAgentsDocs(directory, options.silent ?? false)

    // Sync OpenCode assets (.opencode/{commands,skills,...}) for first-time users
    await syncOpencodeAssets(directory, {
      target: options.syncTarget ?? "project",
      overwrite: options.overwriteAssets ?? false,
      silent: options.silent ?? false,
      onLog: options.silent ? undefined : log,
    })

    await printInitSuccess(directory, config, sessionId, state, options.silent ?? false)
    return
  }

  // ── Manual Configuration Path (existing logic) ──────────────────────────────
  
  // Validate and set governance mode
  const governanceMode = options.governanceMode ?? "assisted"
  if (!isValidGovernanceMode(governanceMode)) {
    log(`✗ Invalid governance mode: ${governanceMode}`)
    log(`  Valid: ${GOVERNANCE_MODES.join(", ")}`)
    return
  }

  // Validate and set language
  const language = options.language ?? "en"
  if (!isValidLanguage(language)) {
    log(`✗ Invalid language: ${language}`)
    log(`  Valid: ${LANGUAGES.join(", ")}`)
    return
  }

  // Validate and set expert level
  const expertLevel = options.expertLevel ?? "intermediate"
  if (!isValidExpertLevel(expertLevel)) {
    log(`✗ Invalid expert level: ${expertLevel}`)
    log(`  Valid: ${EXPERT_LEVELS.join(", ")}`)
    return
  }

  // Validate and set output style
  const outputStyle = options.outputStyle ?? "explanatory"
  if (!isValidOutputStyle(outputStyle)) {
    log(`✗ Invalid output style: ${outputStyle}`)
    log(`  Valid: ${OUTPUT_STYLES.join(", ")}`)
    return
  }

  // Validate and set automation level
  const rawAutomationLevel = options.automationLevel ?? "assisted"
  const automationLevel = normalizeAutomationInput(rawAutomationLevel)
  if (!automationLevel) {
    log(`✗ Invalid automation level: ${rawAutomationLevel}`)
    log(`  Valid: ${AUTOMATION_LEVELS.join(", ")}`)
    return
  }

  // Create .hivemind directory structure
  // (sessions, brain, plans, logs subdirectories are created by initializePlanningDirectory)

  // Create config with agent behavior
  const config = createConfig({
    governance_mode: isCoachAutomation(automationLevel) ? "strict" : governanceMode,
    language,
    automation_level: automationLevel,
    auto_commit: automationLevel === "full" || isCoachAutomation(automationLevel),
    agent_behavior: {
      language,
      expert_level: isCoachAutomation(automationLevel) ? "beginner" : expertLevel,
      output_style: isCoachAutomation(automationLevel) ? "skeptical" : outputStyle,
      constraints: {
        require_code_review: isCoachAutomation(automationLevel) ? true : (options.requireCodeReview ?? false),
        enforce_tdd: options.enforceTdd ?? false,
        max_response_tokens: 2000,
        explain_reasoning: true,
        be_skeptical: isCoachAutomation(automationLevel) ? true : (outputStyle === "skeptical"),
      },
    },
  })

  if (!options.silent) {
    log(`  Governance: ${config.governance_mode}`)
    log(`  Language: ${language}`)
    log(`  Expert Level: ${config.agent_behavior.expert_level}`)
    log(`  Output Style: ${config.agent_behavior.output_style}`)
    log(`  Automation: ${normalizeAutomationLabel(automationLevel)}${isCoachAutomation(automationLevel) ? " (max guidance)" : ""}`)
    if (config.agent_behavior.constraints.require_code_review) log("  ✓ Code review required")
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
  const commandmentsDest = join(p.docsDir, "10-commandments.md")
  await mkdir(p.docsDir, { recursive: true })
  await copyFile(commandmentsSource, commandmentsDest)
  if (!options.silent) {
    log(`  ✓ Copied 10 Commandments to ${p.docsDir}/`)
  }

  // Save config
  await saveConfig(directory, config)

  // Initialize brain state
  const stateManager = createStateManager(directory)
  const sessionId = generateSessionId()
  const state = createBrainState(sessionId, config)
  await stateManager.save(state)

  // Initialize empty hierarchy tree (required for session-lifecycle hook)
  await saveTree(directory, createTree())

  // Auto-register plugin in opencode.json
  registerPluginInConfig(directory, options.silent ?? false)

  // Auto-inject HiveMind section into AGENTS.md / CLAUDE.md
  injectAgentsDocs(directory, options.silent ?? false)

  // Sync OpenCode assets (.opencode/{commands,skills,...}) for first-time users
  await syncOpencodeAssets(directory, {
    target: options.syncTarget ?? "project",
    overwrite: options.overwriteAssets ?? false,
    silent: options.silent ?? false,
    onLog: options.silent ? undefined : log,
  })

  if (!options.silent) {
    log("")
    log("✓ Planning directory created:")
    log(`  ${hivemindDir}/`)
    log("  ├── INDEX.md             (root state entry point)")
    log("  ├── state/               (brain, hierarchy, anchors, tasks)")
    log("  ├── memory/              (mems + manifest)")
    log("  ├── sessions/")
    log("  │   ├── active/          (current session file)")
    log("  │   ├── manifest.json    (session registry)")
    log("  │   └── archive/         (completed sessions)")
    log("  ├── plans/               (plan registry)")
    log("  ├── codemap/             (SOT manifest)")
    log("  ├── codewiki/            (SOT manifest)")
    log("  ├── docs/                (10-commandments.md)")
    log("  ├── templates/")
    log("  │   └── session.md       (session template)")
    log("  ├── logs/                (runtime logs)")
    log("  └── config.json          (governance settings)")
    log("")
    log(`Session ${sessionId} initialized.`)
    log(`Status: ${state.session.governance_status}`)
    log("")

    if (config.governance_mode === "strict") {
      log("🔒 STRICT MODE — agents must call declare_intent before writing.")
    } else if (config.governance_mode === "assisted") {
      log("🔔 ASSISTED MODE — agents get warnings but can proceed.")
    } else {
      log("🟢 PERMISSIVE MODE — agents work freely, activity tracked.")
    }

    if (isCoachAutomation(automationLevel)) {
      log("")
      log("🤯 COACH MODE ACTIVE:")
      log("   → Governance forced to STRICT")
      log("   → System will ARGUE BACK with evidence")
      log("   → Escalating pressure on every unresolved signal")
      log("   → Code review REQUIRED on all changes")
      log("   → Maximum guidance enabled")
    }

    log("")
    log("✅ Done! Open OpenCode in this project — HiveMind is active.")
    log("")
  }
}
