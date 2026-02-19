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

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { copyFile, mkdir, rm, writeFile } from "node:fs/promises"
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
import {
  auditHiveFiverAssets,
  seedHiveFiverOnboardingTasks,
} from "../lib/hivefiver-integration.js"

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
const HIVEFIVER_PRIMARY_AGENT_TOOLS = {
  read: true,
  glob: true,
  grep: true,
  task: true,
  skill: true,
  webfetch: true,
  websearch: true,
  bash: true,
} as const

const DEFAULT_COMMANDMENTS_MARKDOWN = `# 10 Commandments

1. Declare intent before implementation.
2. Keep trajectory -> tactic -> action aligned.
3. Verify evidence before claiming completion.
4. Prefer deterministic workflows over ad-hoc execution.
5. Track decisions and dependencies in persistent state.
6. Use incremental checkpoints for long sessions.
7. Validate with tests and type checks before release.
8. Preserve context across compaction and handoff.
9. Escalate when confidence drops or ambiguity rises.
10. Close every cycle with explicit summary and next steps.
`

function resolveOpencodeConfigPath(directory: string): string {
  const candidates = [
    join(directory, ".opencode", "opencode.json"),
    join(directory, ".opencode", "opencode.jsonc"),
    join(directory, "opencode.json"),
    join(directory, "opencode.jsonc"),
  ]

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate
  }

  return join(directory, ".opencode", "opencode.json")
}

function writeOpencodeConfig(configPath: string, config: Record<string, unknown>): void {
  mkdirSync(dirname(configPath), { recursive: true })
  writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n", "utf-8")
}

async function seedTenCommandments(directory: string): Promise<void> {
  const paths = getEffectivePaths(directory)
  const commandmentsSource = join(__dirname, "..", "..", "docs", "10-commandments.md")
  const commandmentsDest = join(paths.docsDir, "10-commandments.md")

  await mkdir(paths.docsDir, { recursive: true })

  if (existsSync(commandmentsSource)) {
    await copyFile(commandmentsSource, commandmentsDest)
    return
  }

  await writeFile(commandmentsDest, DEFAULT_COMMANDMENTS_MARKDOWN, "utf-8")
}

/**
 * Auto-register the HiveMind plugin in opencode.json.
 * Creates the file if it doesn't exist.
 * Adds the plugin if not already registered.
 */
function registerPluginInConfig(directory: string, silent: boolean): void {
  let configPath = resolveOpencodeConfigPath(directory)
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
      configPath = join(directory, ".opencode", "opencode.json")
      config = {}
    }
  }

  // Ensure plugin array exists
  if (!Array.isArray(config.plugin)) {
    config.plugin = []
  }

  const plugins = (config.plugin as unknown[]).filter((value): value is string => typeof value === "string")
  const hiveMindPluginPattern = new RegExp(`(^|[\\\\/])${PLUGIN_NAME}(?:@.+)?$`)
  const isHiveMindPlugin = (value: string) => hiveMindPluginPattern.test(value)
  const firstHiveMindIndex = plugins.findIndex(isHiveMindPlugin)

  const nextPlugins: string[] = []
  let hiveMindInserted = false

  for (let index = 0; index < plugins.length; index++) {
    const value = plugins[index]
    if (!isHiveMindPlugin(value)) {
      nextPlugins.push(value)
      continue
    }

    if (!hiveMindInserted && index === firstHiveMindIndex) {
      nextPlugins.push(PLUGIN_NAME)
      hiveMindInserted = true
    }
  }

  if (!hiveMindInserted) {
    nextPlugins.push(PLUGIN_NAME)
  }

  const changed =
    nextPlugins.length !== plugins.length ||
    nextPlugins.some((value, index) => value !== plugins[index])

  if (!changed) {
    if (!silent) {
      log(`  ✓ Plugin already registered in opencode.json`)
    }
    return
  }

  config.plugin = nextPlugins
  writeOpencodeConfig(configPath, config)

  if (!silent) {
    log(`  ✓ Plugin registered in opencode.json`)
    log(`    → OpenCode will auto-install on next launch`)
  }
}

/**
 * Ensure opencode.json has HiveFiver v2 defaults:
 * - primary hivefiver agent profile
 * - MCP stack placeholders for guided setup
 */
function ensureHiveFiverDefaultsInOpencode(directory: string, silent: boolean): void {
  const configPath = resolveOpencodeConfigPath(directory)

  let config: Record<string, unknown> = {}
  if (existsSync(configPath)) {
    try {
      let raw = readFileSync(configPath, "utf-8")
      raw = raw.replace(/^\s*\/\/.*$/gm, "")
      raw = raw.replace(/,\s*([}\]])/g, "$1")
      config = JSON.parse(raw)
    } catch {
      config = {}
    }
  }

  const agentConfig =
    typeof config.agent === "object" && config.agent !== null
      ? (config.agent as Record<string, unknown>)
      : {}
  const hivefiverConfig =
    typeof agentConfig.hivefiver === "object" && agentConfig.hivefiver !== null
      ? (agentConfig.hivefiver as Record<string, unknown>)
      : {}

  hivefiverConfig.mode = "primary"
  const existingTools =
    typeof hivefiverConfig.tools === "object" && hivefiverConfig.tools !== null
      ? (hivefiverConfig.tools as Record<string, unknown>)
      : {}
  hivefiverConfig.tools = {
    ...HIVEFIVER_PRIMARY_AGENT_TOOLS,
    ...existingTools,
  }
  agentConfig.hivefiver = hivefiverConfig
  config.agent = agentConfig

  const mcpConfig =
    typeof config.mcp === "object" && config.mcp !== null
      ? (config.mcp as Record<string, unknown>)
      : {}
  if (!mcpConfig.deepwiki) {
    mcpConfig.deepwiki = {
      type: "remote",
      url: "https://mcp.deepwiki.com/mcp",
      enabled: true,
      timeout: 15000,
    }
  }
  if (!mcpConfig.context7) {
    mcpConfig.context7 = {
      type: "remote",
      url: "https://mcp.context7.com/mcp",
      enabled: false,
      timeout: 15000,
    }
  }
  if (!mcpConfig.tavily) {
    mcpConfig.tavily = {
      type: "remote",
      url: "https://mcp.tavily.com/mcp",
      enabled: false,
      timeout: 15000,
    }
  }
  if (!mcpConfig.exa) {
    mcpConfig.exa = {
      type: "remote",
      url: "https://YOUR-EXA-MCP-ENDPOINT",
      enabled: false,
      timeout: 15000,
    }
  }
  if (!mcpConfig.repomix) {
    mcpConfig.repomix = {
      type: "local",
      command: ["npx", "-y", "repomix", "--mcp"],
      enabled: false,
    }
  }
  config.mcp = mcpConfig

  writeOpencodeConfig(configPath, config)
  if (!silent) {
    log("  ✓ Applied HiveFiver v2 defaults to opencode.json")
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
  const configPath = resolveOpencodeConfigPath(directory)
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

  writeOpencodeConfig(configPath, config)

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

function logHiveFiverAuditResult(
  audit: ReturnType<typeof auditHiveFiverAssets>,
  silent: boolean
): void {
  if (silent) return

  const missingRootCount =
    audit.rootMissing.commands.length + audit.rootMissing.skills.length + audit.rootMissing.workflows.length
  const missingOpencodeCount =
    audit.opencodeMissing.commands.length + audit.opencodeMissing.skills.length + audit.opencodeMissing.workflows.length

  log("HiveFiver Integration Audit:")
  log(`  Source root: ${audit.sourceRoot}`)
  if (!audit.hasCriticalGaps) {
    log("  ✓ Pack integrated across root and .opencode assets")
  } else {
    log(`  ⚠ Missing root assets: ${missingRootCount}`)
    log(`  ⚠ Missing .opencode assets: ${missingOpencodeCount}`)
    if (audit.rootMissing.commands.length > 0) {
      log(`    - root commands missing: ${audit.rootMissing.commands.length}`)
    }
    if (audit.rootMissing.skills.length > 0) {
      log(`    - root skills missing: ${audit.rootMissing.skills.length}`)
    }
    if (audit.rootMissing.workflows.length > 0) {
      log(`    - root workflows missing: ${audit.rootMissing.workflows.length}`)
    }
    if (audit.opencodeMissing.commands.length > 0) {
      log(`    - .opencode commands missing: ${audit.opencodeMissing.commands.length}`)
    }
    if (audit.opencodeMissing.skills.length > 0) {
      log(`    - .opencode skills missing: ${audit.opencodeMissing.skills.length}`)
    }
    if (audit.opencodeMissing.workflows.length > 0) {
      log(`    - .opencode workflows missing: ${audit.opencodeMissing.workflows.length}`)
    }
  }
  for (const recommendation of audit.recommendations) {
    log(`  → ${recommendation}`)
  }
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
    await initializePlanningDirectory(directory)

    // Existing user upgrade path: keep state, refresh OpenCode assets, AND ensure plugin is registered
    await syncOpencodeAssets(directory, {
      target: "both",
      overwrite: true,
      clean: true,
      silent: options.silent ?? false,
      onLog: options.silent ? undefined : log,
    })
    
    // Ensure plugin is registered in opencode.json (this was missing!)
    registerPluginInConfig(directory, options.silent ?? false)
    ensureHiveFiverDefaultsInOpencode(directory, options.silent ?? false)

    const existingStateManager = createStateManager(directory)
    const existingState = await existingStateManager.load()
    await seedHiveFiverOnboardingTasks(directory, existingState?.session.id ?? "unknown")
    logHiveFiverAuditResult(auditHiveFiverAssets(directory), options.silent ?? false)

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
    await seedTenCommandments(directory)
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
    ensureHiveFiverDefaultsInOpencode(directory, options.silent ?? false)

    // Apply profile permissions to opencode.json
    updateOpencodeJsonWithProfile(directory, options.profile, options.silent ?? false)

    // Auto-inject HiveMind section into AGENTS.md / CLAUDE.md
    injectAgentsDocs(directory, options.silent ?? false)

    // Sync OpenCode assets (.opencode/{commands,skills,...}) for first-time users
    await syncOpencodeAssets(directory, {
      target: "both",
      overwrite: true,
      clean: true,
      silent: options.silent ?? false,
      onLog: options.silent ? undefined : log,
    })

    await seedHiveFiverOnboardingTasks(directory, sessionId)
    logHiveFiverAuditResult(auditHiveFiverAssets(directory), options.silent ?? false)

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
  await seedTenCommandments(directory)
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
  ensureHiveFiverDefaultsInOpencode(directory, options.silent ?? false)

  // Auto-inject HiveMind section into AGENTS.md / CLAUDE.md
  injectAgentsDocs(directory, options.silent ?? false)

  // Sync OpenCode assets (.opencode/{commands,skills,...}) for first-time users
  await syncOpencodeAssets(directory, {
    target: "both",
    overwrite: true,
    clean: true,
    silent: options.silent ?? false,
    onLog: options.silent ? undefined : log,
  })

  await seedHiveFiverOnboardingTasks(directory, sessionId)
  logHiveFiverAuditResult(auditHiveFiverAssets(directory), options.silent ?? false)

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
    log("   HiveFiver v2 quickstart: `/hivefiver init` then `/hivefiver spec`.")
    log("")
  }
}
