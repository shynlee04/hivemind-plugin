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

import { existsSync, readFileSync, writeFileSync, readdirSync, statSync } from "node:fs"
import { copyFile, mkdir, rm, cp } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const __dirname = dirname(fileURLToPath(import.meta.url))
import type { GovernanceMode, Language, ExpertLevel, OutputStyle, AutomationLevel } from "../schemas/config.js"
import { createConfig, isValidGovernanceMode, isValidLanguage, isValidExpertLevel, isValidOutputStyle, isValidAutomationLevel } from "../schemas/config.js"
import { createBrainState, generateSessionId } from "../schemas/brain-state.js"
import { createStateManager, saveConfig } from "../lib/persistence.js"
import { initializePlanningDirectory } from "../lib/planning-fs.js"
import { getEffectivePaths } from "../lib/paths.js"
import { migrateIfNeeded } from "../lib/migrate.js"

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
  automationLevel?: AutomationLevel
  requireCodeReview?: boolean
  enforceTdd?: boolean
  silent?: boolean
  force?: boolean
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
 * Extract commands and skills to .opencode directory.
 * Fulfills the "ecosystem integration" requirement.
 */
async function extractOpencodeAssets(directory: string, silent: boolean): Promise<void> {
  const opencodeDir = join(directory, ".opencode")
  const commandsDest = join(opencodeDir, "commands")
  const skillsDest = join(opencodeDir, "skills")

  await mkdir(commandsDest, { recursive: true })
  await mkdir(skillsDest, { recursive: true })

  const pkgRoot = join(__dirname, "..", "..") // dist/cli.js -> dist -> root
  const commandsSource = join(pkgRoot, "commands")
  const skillsSource = join(pkgRoot, "skills")

  // Copy Commands
  if (existsSync(commandsSource)) {
    const files = readdirSync(commandsSource).filter(f => f.endsWith(".md"))
    for (const file of files) {
      await copyFile(join(commandsSource, file), join(commandsDest, file))
    }
    if (!silent && files.length > 0) {
      log(`  ✓ Extracted ${files.length} commands to .opencode/commands/`)
    }
  }

  // Copy Skills
  if (existsSync(skillsSource)) {
    const skills = readdirSync(skillsSource).filter(f => {
      return statSync(join(skillsSource, f)).isDirectory()
    })
    for (const skill of skills) {
      await cp(join(skillsSource, skill), join(skillsDest, skill), { recursive: true })
    }
    if (!silent && skills.length > 0) {
      log(`  ✓ Extracted ${skills.length} skills to .opencode/skills/`)
    }
  }
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

  // Validate and set automation level
  const automationLevel = options.automationLevel ?? "assisted"
  if (!isValidAutomationLevel(automationLevel)) {
    log(`✗ Invalid automation level: ${automationLevel}`)
    log('  Valid: manual, guided, assisted, full, retard ("I am retard — lead me")')
    return
  }

  // Create .hivemind directory structure
  // (sessions, brain, plans, logs subdirectories are created by initializePlanningDirectory)

  // Create config with agent behavior
  const config = createConfig({
    governance_mode: automationLevel === "retard" ? "strict" : governanceMode,
    language,
    automation_level: automationLevel,
    agent_behavior: {
      language,
      expert_level: automationLevel === "retard" ? "beginner" : expertLevel,
      output_style: automationLevel === "retard" ? "skeptical" : outputStyle,
      constraints: {
        require_code_review: automationLevel === "retard" ? true : (options.requireCodeReview ?? false),
        enforce_tdd: options.enforceTdd ?? false,
        max_response_tokens: 2000,
        explain_reasoning: true,
        be_skeptical: automationLevel === "retard" ? true : (outputStyle === "skeptical"),
      },
    },
  })

  if (!options.silent) {
    log(`  Governance: ${config.governance_mode}`)
    log(`  Language: ${language}`)
    log(`  Expert Level: ${config.agent_behavior.expert_level}`)
    log(`  Output Style: ${config.agent_behavior.output_style}`)
    log(`  Automation: ${automationLevel}${automationLevel === "retard" ? ' ("I am retard — lead me")' : ""}`)
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

  // Auto-register plugin in opencode.json
  registerPluginInConfig(directory, options.silent ?? false)

  // Auto-inject HiveMind section into AGENTS.md / CLAUDE.md
  injectAgentsDocs(directory, options.silent ?? false)

  // Extract commands and skills to .opencode/
  await extractOpencodeAssets(directory, options.silent ?? false)

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

    if (automationLevel === "retard") {
      log("")
      log('🤯 "I AM RETARD" MODE ACTIVE:')
      log("   → Governance forced to STRICT")
      log("   → System will ARGUE BACK with evidence")
      log("   → Escalating pressure on every unresolved signal")
      log("   → Code review REQUIRED on all changes")
      log("   → Maximum handholding enabled")
    }

    log("")
    log("✅ Done! Open OpenCode in this project — HiveMind is active.")
    log("")
  }
}
