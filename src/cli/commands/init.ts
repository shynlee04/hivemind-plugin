import type * as ClackPrompts from "@clack/prompts"
import { dirname, resolve } from "node:path"
import { existsSync } from "node:fs"

import { bootstrapInit } from "../../tools/config/bootstrap-init.js"
import type { BootstrapConfigInput, BootstrapInitResult, BootstrapScope } from "../../schema-kernel/bootstrap.schema.js"
import type {
  SupportedLanguage,
  HivemindMode,
  UserExpertLevel,
  DelegationSystems,
} from "../../schema-kernel/hivemind-configs.schema.js"
import type { CliCommand, CliCommandContext, CliRouterResult } from "../router.js"

type PromptModule = typeof ClackPrompts

type InitCommandDeps = {
  bootstrapInitFn: typeof bootstrapInit
  loadPrompts: () => Promise<PromptModule>
  resolveProjectRoot: (explicitRoot?: string) => string | null
  isInteractiveTerminal: () => boolean
}

/**
 * Lazy-load `@clack/prompts` for the interactive init wizard.
 *
 * @returns The loaded prompts module.
 *
 * @example
 * ```ts
 * const prompts = await loadClackPrompts()
 * ```
 */
export async function loadClackPrompts(): Promise<PromptModule> {
  return import("@clack/prompts")
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
    return { exitCode: 64, error: "[Harness] Unable to resolve a project root from --root, package.json, or .hivemind." }
  }

  const scopeResult = parseScopeFlag(ctx.flags.scope)
  if (!scopeResult.success) {
    return { exitCode: 64, error: scopeResult.error }
  }

  const nonInteractive = Boolean(ctx.flags.yes === true || ctx.flags.y === true || process.env.CI || !deps.isInteractiveTerminal())
  let scope: BootstrapScope = scopeResult.scope
  let config: BootstrapConfigInput = {}

  if (!nonInteractive) {
    const promptResult = await promptForInitConfig(deps.loadPrompts)
    if (promptResult === null) {
      return { exitCode: 0, output: "Initialization cancelled." }
    }
    scope = promptResult.scope
    config = promptResult.config
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

async function promptForInitConfig(
  loadPrompts: () => Promise<PromptModule>,
): Promise<{ scope: BootstrapScope; config: BootstrapConfigInput } | null> {
  const prompts = await loadPrompts()
  prompts.intro("hivemind init")

  const conversationLanguage = await prompts.select({
    message: "Conversation language",
    initialValue: "en",
    options: [
      { value: "en", label: "English" },
      { value: "vi", label: "Vietnamese" },
      { value: "zh", label: "Chinese" },
      { value: "ja", label: "Japanese" },
    ],
  })
  if (prompts.isCancel(conversationLanguage)) {
    prompts.cancel("Initialization cancelled.")
    return null
  }

  const artifactLanguage = await prompts.select({
    message: "Documents and artifacts language",
    initialValue: "en",
    options: [
      { value: "en", label: "English" },
      { value: "vi", label: "Vietnamese" },
      { value: "zh", label: "Chinese" },
      { value: "ja", label: "Japanese" },
    ],
  })
  if (prompts.isCancel(artifactLanguage)) {
    prompts.cancel("Initialization cancelled.")
    return null
  }

  const mode = await prompts.select({
    message: "Working mode",
    initialValue: "expert-advisor",
    options: [
      { value: "expert-advisor", label: "expert-advisor", hint: "guided, structured default" },
      { value: "hivemind-powered", label: "hivemind-powered", hint: "stricter orchestration" },
      { value: "free-style", label: "free-style", hint: "lighter guardrails" },
    ],
  })
  if (prompts.isCancel(mode)) {
    prompts.cancel("Initialization cancelled.")
    return null
  }

  const expertLevel = await prompts.select({
    message: "User expertise level",
    initialValue: "intermediate-high-level",
    options: [
      { value: "clumsy-vibecoder", label: "clumsy-vibecoder" },
      { value: "beginner-friendly", label: "beginner-friendly" },
      { value: "intermediate-high-level", label: "intermediate-high-level" },
      { value: "architecture-driven", label: "architecture-driven" },
      { value: "absolute-expert", label: "absolute-expert" },
    ],
  })
  if (prompts.isCancel(expertLevel)) {
    prompts.cancel("Initialization cancelled.")
    return null
  }

  const delegationSystems = await prompts.multiselect({
    message: "Delegation systems",
    required: false,
    initialValues: ["native_task", "delegate_task"],
    options: [
      { value: "native_task", label: "native_task" },
      { value: "delegate_task", label: "delegate_task" },
      { value: "background_delegation", label: "background_delegation" },
    ],
  })
  if (prompts.isCancel(delegationSystems)) {
    prompts.cancel("Initialization cancelled.")
    return null
  }

  const scope = await prompts.select({
    message: "Primitive install scope",
    initialValue: "project",
    options: [
      { value: "project", label: "project", hint: "default" },
      { value: "global", label: "global", hint: "use OpenCode global config" },
    ],
  })
  if (prompts.isCancel(scope)) {
    prompts.cancel("Initialization cancelled.")
    return null
  }

  prompts.outro(`Using ${scope} primitive scope.`)
  const selected = new Set(delegationSystems as string[])
  const normalizedScope = scope as BootstrapScope
  const normalizedConversationLanguage = conversationLanguage as SupportedLanguage
  const normalizedArtifactLanguage = artifactLanguage as SupportedLanguage
  const normalizedMode = mode as HivemindMode
  const normalizedExpertLevel = expertLevel as UserExpertLevel
  const normalizedDelegationSystems: DelegationSystems = {
    native_task: selected.has("native_task"),
    delegate_task: selected.has("delegate_task"),
    background_delegation: selected.has("background_delegation"),
  }
  return {
    scope: normalizedScope,
    config: {
      conversation_language: normalizedConversationLanguage,
      documents_and_artifacts_language: normalizedArtifactLanguage,
      mode: normalizedMode,
      user_expert_level: normalizedExpertLevel,
      delegation_systems: normalizedDelegationSystems,
    },
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
  return [
    "Usage: hivemind init [--yes|-y] [--root=<path>] [--scope=project|global]",
    "",
    "Flags:",
    "  --yes, -y       Run non-interactively with BOOT-02 defaults",
    "  --root=<path>   Resolve bootstrap state relative to an explicit project root",
    "  --scope=<mode>  Install primitives into project or global OpenCode scope",
  ].join("\n")
}

function resolveProjectRoot(explicitRoot?: string): string | null {
  if (explicitRoot?.trim()) {
    const resolved = resolve(explicitRoot)
    return hasProjectMarkers(resolved) ? resolved : null
  }

  let current = process.cwd()
  while (true) {
    if (hasProjectMarkers(current)) {
      return current
    }
    const parent = dirname(current)
    if (parent === current) {
      return null
    }
    current = parent
  }
}

function hasProjectMarkers(directory: string): boolean {
  return existsSync(resolve(directory, "package.json")) || existsSync(resolve(directory, ".hivemind"))
}

function getStringFlag(flags: Record<string, string | boolean>, key: string): string | undefined {
  const value = flags[key]
  return typeof value === "string" ? value : undefined
}

function hasHelpFlag(flags: Record<string, string | boolean>): boolean {
  return flags.help === true || flags.h === true
}

function parseScopeFlag(rawScope: string | boolean | undefined):
  | { success: true; scope: BootstrapScope }
  | { success: false; error: string } {
  if (rawScope === undefined) {
    return { success: true, scope: "project" }
  }
  if (rawScope === "project" || rawScope === "global") {
    return { success: true, scope: rawScope }
  }
  return { success: false, error: `[Harness] Invalid scope: ${String(rawScope)}` }
}
