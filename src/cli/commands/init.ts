import type * as ClackPrompts from "@clack/prompts"
import { join } from "node:path"
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, copyFileSync } from "node:fs"

import { bootstrapInit } from "../../tools/config/bootstrap-init.js"
import type { BootstrapConfigInput, BootstrapInitResult, BootstrapScope } from "../../schema-kernel/bootstrap.schema.js"
import { resolveProjectRoot, parseScopeFlag, getStringFlag, hasHelpFlag } from "../shared.js"
import type { HivemindConfigs } from "../../schema-kernel/hivemind-configs.schema.js"
import { readConfigs } from "../../schema-kernel/hivemind-configs.schema.js"
import type { CliCommand, CliCommandContext, CliRouterResult } from "../router.js"
import { resolvePackageAssetsRoot, resolveOpenCodeRoot } from "../../features/bootstrap/structure.js"
import { loadPreset, listPresets } from "../../features/bootstrap/preset-loader.js"
import { deepMerge } from "../../shared/helpers.js"
import {
  stepRecoveryCheck,
  stepProfileSelection,
  stepLanguageAndCommunication,
  stepExpertiseAndBehavior,
  stepWorkflowToggles,
  stepGovernanceAndSafety,
  stepAdvanced,
  stepDiffPreview,
  stepAtomicWrite,
} from "./init-steps.js"

type PromptModule = typeof ClackPrompts

type InitCommandDeps = {
  bootstrapInitFn: typeof bootstrapInit
  loadPrompts: () => Promise<PromptModule | null>
  resolveProjectRoot: (explicitRoot?: string) => string | null
  isInteractiveTerminal: () => boolean
  backupPrimitives: (targetRoot: string, assetsRoot: string) => void
}

/**
 * Lazy-load `@clack/prompts` for the interactive init wizard.
 *
 * Falls back gracefully if the module is unavailable (e.g., during CI or
 * partial install), logging a warning and enabling non-interactive mode.
 *
 * @returns The loaded prompts module, or null if unavailable.
 *
 * @example
 * ```ts
 * const prompts = await loadClackPrompts()
 * if (prompts === null) { /* fallback *\/ }
 * ```
 */
export async function loadClackPrompts(): Promise<PromptModule | null> {
  try {
    return await import("@clack/prompts")
  } catch {
    console.warn("[Hivemind] @clack/prompts unavailable; falling back to non-interactive mode.")
    return null
  }
}

/**
 * Create the BOOT-02 `init` CLI command.
 *
 * The command is a thin router handler: it resolves the project root, decides
 * between non-interactive defaults and the TTY wizard, then delegates all
 * filesystem mutation to {@link bootstrapInit} with an explicit scope contract.
 *
 * @param deps - Optional injectable dependencies for tests.
 * @returns The `init` command implementation.
 *
 * @example
 * ```ts
 * const command = createInitCommand()
 * ```
 */
export function createInitCommand(deps: Partial<InitCommandDeps> = {}): CliCommand {
  const resolvedDeps: InitCommandDeps = {
    bootstrapInitFn: deps.bootstrapInitFn ?? bootstrapInit,
    loadPrompts: deps.loadPrompts ?? loadClackPrompts,
    resolveProjectRoot: deps.resolveProjectRoot ?? resolveProjectRoot,
    isInteractiveTerminal: deps.isInteractiveTerminal ?? (() => Boolean(process.stdout.isTTY && !process.env.CI)),
    backupPrimitives: deps.backupPrimitives ?? backupExistingPrimitives,
  }

  return {
    name: "init",
    summary: "Initialize local .hivemind state and install OpenCode primitive symlinks.",
    handler: async (ctx) => handleInit(ctx, resolvedDeps),
  }
}

/**
 * Canonical BOOT-02 `init` command export.
 *
 * @example
 * ```ts
 * const result = await initCmd.handler({ flags: { yes: true }, positionals: [], argv: ["init", "--yes"] })
 * ```
 */
export const initCmd = createInitCommand()

async function handleInit(ctx: CliCommandContext, deps: InitCommandDeps): Promise<CliRouterResult> {
  if (hasHelpFlag(ctx.flags)) {
    return { exitCode: 0, output: renderInitHelp() }
  }

  const explicitRoot = getStringFlag(ctx.flags, "root")
  const projectRoot = deps.resolveProjectRoot(explicitRoot)
  if (projectRoot === null) {
    return { exitCode: 64, error: "[Hivemind] Unable to resolve a project root from --root, package.json, or .hivemind." }
  }

  const scopeResult = parseScopeFlag(ctx.flags.scope)
  if (!scopeResult.success) {
    return { exitCode: 64, error: scopeResult.error }
  }

  const nonInteractive = Boolean(ctx.flags.yes === true || ctx.flags.y === true || process.env.CI || !deps.isInteractiveTerminal())
  let scope: BootstrapScope = scopeResult.scope
  let config: BootstrapConfigInput = {}

  // --preset=<name>: apply a named preset without interactive wizard
  const presetFlag = getStringFlag(ctx.flags, "preset")
  if (presetFlag) {
    // Validate preset exists
    const available = listPresets().map((p) => p.name)
    if (!available.includes(presetFlag)) {
      return {
        exitCode: 64,
        error: `[Hivemind] Unknown preset "${presetFlag}". Available: ${available.join(", ")}`,
      }
    }

    const presetConfig = loadPreset(presetFlag)

    // In interactive mode, show diff preview and confirm before writing
    if (!nonInteractive) {
      const prompts = await deps.loadPrompts()
      if (prompts === null) {
        return { exitCode: 0, output: "Initialization cancelled." }
      }

      prompts.intro(`hivemind init --preset ${presetFlag}`)

      const configsPath = join(projectRoot, ".hivemind", "configs.json")
      const existingConfig = readConfigs(projectRoot)

      // Deep merge: existing values preserved, preset values override
      // But preserve governance section from existing config (never touched by wizard)
      const governanceToPreserve = existingConfig.governance
      const mergedConfig = deepMerge(existingConfig as Record<string, unknown>, presetConfig as Record<string, unknown>) as HivemindConfigs
      mergedConfig.governance = governanceToPreserve

      const oldConfig = existsSync(configsPath)
        ? readFileSync(configsPath, "utf-8")
        : "{}"
      const newConfig = JSON.stringify(mergedConfig, null, 2)

      const confirmed = await stepDiffPreview(prompts, oldConfig, newConfig)
      if (!confirmed) {
        prompts.cancel("Initialization cancelled.")
        return { exitCode: 0, output: "Initialization cancelled." }
      }

      await stepAtomicWrite(configsPath, mergedConfig)
      prompts.outro("Preset configuration saved. Continuing with bootstrap...")
    } else {
      // Non-interactive: read existing config, deep merge with preset, preserve governance
      const configsPath = join(projectRoot, ".hivemind", "configs.json")
      const existingConfig = readConfigs(projectRoot)
      const governanceToPreserve = existingConfig.governance
      const mergedConfig = deepMerge(existingConfig as Record<string, unknown>, presetConfig as Record<string, unknown>) as HivemindConfigs
      mergedConfig.governance = governanceToPreserve
      await stepAtomicWrite(configsPath, mergedConfig)
    }

    config = {
      conversation_language: presetConfig.conversation_language,
      documents_and_artifacts_language: presetConfig.documents_and_artifacts_language,
      mode: presetConfig.mode,
      user_expert_level: presetConfig.user_expert_level,
      delegation_systems: presetConfig.delegation_systems,
    }

    // Skip the interactive wizard — go straight to bootstrap
    try {
      const result = await deps.bootstrapInitFn({
        projectRoot,
        scope,
        nonInteractive,
        config,
      })
      return {
        exitCode: 0,
        output: renderInitSuccess(result),
      }
    } catch (cause) {
      return {
        exitCode: 1,
        error: cause instanceof Error ? cause.message : String(cause),
      }
    }
  }

  if (!nonInteractive) {
    // Interactive mode: use new step-by-step wizard
    const prompts = await deps.loadPrompts()
    if (prompts === null) {
      return { exitCode: 0, output: "Initialization cancelled." }
    }

    prompts.intro("hivemind init")

    // Step 0: Recovery Check
    const configsPath = join(projectRoot, ".hivemind", "configs.json")
    await stepRecoveryCheck(configsPath, prompts)

    // Step 1: Profile Selection — start from existing config (preserves all current values)
    const existingConfig = readConfigs(projectRoot)
    const governanceToPreserve = existingConfig.governance
    const presetName = await stepProfileSelection(prompts)

    // If user selected a preset, deep merge preset ON TOP of existing config
    const baseConfig: Partial<HivemindConfigs> = presetName
      ? deepMerge(existingConfig as Record<string, unknown>, loadPreset(presetName) as Record<string, unknown>) as HivemindConfigs
      : existingConfig

    // Steps 2-6: Interactive configuration — user modifies values on top of base
    const interactiveConfig: Partial<HivemindConfigs> = { ...baseConfig }
    await stepLanguageAndCommunication(prompts, interactiveConfig)
    await stepExpertiseAndBehavior(prompts, interactiveConfig)
    await stepWorkflowToggles(prompts, interactiveConfig)
    await stepGovernanceAndSafety(prompts, interactiveConfig)
    await stepAdvanced(prompts, interactiveConfig)

    // Preserve governance section from existing config (never touched by wizard)
    interactiveConfig.governance = governanceToPreserve

    // Step 7: Diff Preview
    const oldConfig = existsSync(configsPath)
      ? readFileSync(configsPath, "utf-8")
      : "{}"
    const newConfig = JSON.stringify(interactiveConfig, null, 2)
    const confirmed = await stepDiffPreview(prompts, oldConfig, newConfig)

    if (!confirmed) {
      prompts.cancel("Initialization cancelled.")
      return { exitCode: 0, output: "Initialization cancelled." }
    }

    // Step 8: Atomic Write + Validate
    await stepAtomicWrite(configsPath, interactiveConfig)

    prompts.outro("Configuration saved. Continuing with bootstrap...")

    // Map interactive config to BootstrapConfigInput for bootstrapInit
    config = {
      conversation_language: interactiveConfig.conversation_language,
      documents_and_artifacts_language: interactiveConfig.documents_and_artifacts_language,
      mode: interactiveConfig.mode,
      user_expert_level: interactiveConfig.user_expert_level,
      delegation_systems: interactiveConfig.delegation_systems,
    }

    // Scope selection
    const scopeSelect = await prompts.select({
      message: "Primitive install scope — where primitives are installed",
      initialValue: scope,
      options: [
        { value: "project", label: "project", hint: "install in current project (default)" },
        { value: "global", label: "global", hint: "use OpenCode global config directory" },
      ],
    })

    if (!prompts.isCancel(scopeSelect)) {
      scope = scopeSelect as BootstrapScope
    }

    // Backup existing primitives before install (interactive project scope only).
    // This prevents overwriting user-customized shipped primitives.
    if (scope === "project") {
      const openCodeRoot = resolveOpenCodeRoot(projectRoot)
      const assetsRoot = resolvePackageAssetsRoot()
      deps.backupPrimitives(openCodeRoot, assetsRoot)
    }

    // Backup user's opencode.json before writing shipped template.
    // The shipped version contains only structural fields ($schema, lsp, plugin, etc.);
    // user-provider configs (API keys, models) are client-side.
    const userConfigPath = join(projectRoot, "opencode.json")
    const backupConfigPath = join(projectRoot, "opencode.json.backup")
    if (existsSync(userConfigPath) && !existsSync(backupConfigPath)) {
      copyFileSync(userConfigPath, backupConfigPath)
      // Don't delete user's config — backup coexists
    }
  }

  try {
    const result = await deps.bootstrapInitFn({
      projectRoot,
      scope,
      nonInteractive,
      config,
    })

    return {
      exitCode: 0,
      output: renderInitSuccess(result),
    }
  } catch (cause) {
    return {
      exitCode: 1,
      error: cause instanceof Error ? cause.message : String(cause),
    }
  }
}

/**
 * Primitive types that the package ships in `assets/` and may need
 * backing up during an interactive reinstall.
 */
const BACKUP_PRIMITIVE_TYPES = [
  "agents",
  "commands",
  "skills",
  "references",
  "templates",
  "agent-instructions",
  "workflows",
] as const

/**
 * Back up existing user primitives before a fresh install.
 *
 * For each primitive type, checks which files in the target directory
 * have the same name as shipped files in `assets/{type}/`. Those matching
 * files are moved to a `.backup/` subdirectory with a timestamp suffix.
 * User-only files (not in assets) are left untouched.
 *
 * @param targetRoot - The OpenCode root directory (e.g. `{projectRoot}/.opencode`).
 * @param assetsRoot - The package's `assets/` directory path.
 */
export function backupExistingPrimitives(targetRoot: string, assetsRoot: string): void {
  const timestamp = Date.now().toString(36)

  for (const type of BACKUP_PRIMITIVE_TYPES) {
    const sourceDir = join(assetsRoot, type)
    const targetDir = join(targetRoot, type)

    if (!existsSync(sourceDir) || !existsSync(targetDir)) {
      continue
    }

    let sourceFiles: string[]
    try {
      sourceFiles = readdirSync(sourceDir)
    } catch {
      continue
    }

    let targetFiles: string[]
    try {
      targetFiles = readdirSync(targetDir)
    } catch {
      continue
    }

    const sourceNames = new Set(sourceFiles)
    const backupDir = join(targetDir, ".backup")
    let backupCreated = false

    for (const fileName of targetFiles) {
      // Skip .backup directory and hidden files
      if (fileName === ".backup" || fileName.startsWith(".")) {
        continue
      }

      // Only back up files that we ship (same name in assets)
      if (!sourceNames.has(fileName)) {
        continue
      }

      const targetPath = join(targetDir, fileName)
      if (!existsSync(targetPath)) {
        continue
      }

      if (!backupCreated) {
        mkdirSync(backupDir, { recursive: true })
        backupCreated = true
      }

      const backupPath = join(backupDir, `${fileName}.${timestamp}`)
      renameSync(targetPath, backupPath)
      console.log(`[Hivemind] Backed up: ${type}/${fileName} → .backup/${fileName}.${timestamp}`)
    }
  }
}

function renderInitSuccess(result: BootstrapInitResult): string {
  const lines = [
    "Hivemind init complete",
    `Project root: ${result.projectRoot}`,
    `Requested scope: ${result.requestedScope}`,
    `Effective scope: ${result.effectiveScope}`,
  ]

  if (result.fallbackApplied && result.fallbackReason) {
    lines.push(`Scope fallback: ${result.fallbackReason}`)
  }

  lines.push(`Primitive target: ${result.primitiveTargetRoot}`)
  return lines.join("\n")
}

function renderInitHelp(): string {
  const presets = listPresets().map((p) => p.name)
  const presetList = presets.length > 0 ? presets.join(", ") : "(none available)"

  return [
    "Usage: hivemind init [--yes|-y] [--root=<path>] [--scope=project|global] [--preset=<name>]",
    "",
    "Flags:",
    "  --yes, -y           Run non-interactively with BOOT-02 defaults",
    "  --root=<path>       Resolve bootstrap state relative to an explicit project root",
    "  --scope=<mode>      Install primitives into project or global OpenCode scope",
    "  --preset=<name>     Apply a named preset config (skip interactive wizard)",
    "",
    "Available presets:",
    `  ${presetList}`,
  ].join("\n")
}


