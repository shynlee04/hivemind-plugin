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
  loadPrompts: () => Promise<PromptModule | null>
  resolveProjectRoot: (explicitRoot?: string) => string | null
  isInteractiveTerminal: () => boolean
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
    console.warn("[Harness] @clack/prompts unavailable; falling back to non-interactive mode.")
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

/**
 * LANGUAGE_OPTIONS array for language select prompts.
 * Maps language codes to human-readable labels with native names.
 */
const LANGUAGE_OPTIONS = [
  { value: "en" as const, label: "English", hint: "Default" },
  { value: "vi" as const, label: "Tiếng Việt", hint: "Vietnamese" },
  { value: "zh" as const, label: "中文", hint: "Chinese" },
  { value: "fr" as const, label: "Français", hint: "French" },
  { value: "ja" as const, label: "日本語", hint: "Japanese" },
  { value: "ko" as const, label: "한국어", hint: "Korean" },
  { value: "de" as const, label: "Deutsch", hint: "German" },
  { value: "es" as const, label: "Español", hint: "Spanish" },
  { value: "th" as const, label: "ไทย", hint: "Thai" },
  { value: "id" as const, label: "Bahasa Indonesia", hint: "Indonesian" },
]

/**
 * EXPERTISE_OPTIONS array for the expertise level select prompt.
 */
const EXPERTISE_OPTIONS = [
  { value: "clumsy-vibecoder" as const, label: "clumsy-vibecoder", hint: "new to coding, needs handholding" },
  { value: "beginner-friendly" as const, label: "beginner-friendly", hint: "some experience" },
  { value: "intermediate-high-level" as const, label: "intermediate-high-level", hint: "comfortable with tech (default)" },
  { value: "architecture-driven" as const, label: "architecture-driven", hint: "wants architecture-level decisions" },
  { value: "absolute-expert" as const, label: "absolute-expert", hint: "expert, minimal explanation" },
]

/**
 * Delegation mode option labels with descriptive hints.
 */
const DELEGATION_OPTIONS = [
  { value: "native_task" as const, label: "native_task", hint: "basic subagent dispatch (default)" },
  { value: "delegate_task" as const, label: "delegate_task", hint: "advanced delegation with context stacking (default)" },
  { value: "background_delegation" as const, label: "background_delegation", hint: "fire-and-forget background tasks" },
]

/**
 * SCOPE_OPTIONS array for the scope select prompt.
 */
const SCOPE_OPTIONS = [
  { value: "project" as const, label: "project", hint: "install in current project (default)" },
  { value: "global" as const, label: "global", hint: "use OpenCode global config directory" },
]

async function promptForInitConfig(
  loadPrompts: () => Promise<PromptModule | null>,
): Promise<{ scope: BootstrapScope; config: BootstrapConfigInput } | null> {
  const prompts = await loadPrompts()
  if (prompts === null) {
    // Dynamic import failed — treat as cancellation (non-interactive fallback
    // is handled upstream in handleInit).
    return null
  }

  prompts.intro("hivemind init")

  const result = await prompts.group(
    {
      conversationLanguage: () => prompts.select({
        message: "Conversation language — language the AI uses to talk to you",
        initialValue: "en",
        options: LANGUAGE_OPTIONS.map((opt) => ({
          value: opt.value,
          label: `${opt.label} (${opt.value})`,
          hint: opt.hint,
        })),
      }),
      artifactLanguage: () => prompts.select({
        message: "Documents and artifacts language — language for written artifacts",
        initialValue: "en",
        options: LANGUAGE_OPTIONS.map((opt) => ({
          value: opt.value,
          label: `${opt.label} (${opt.value})`,
          hint: opt.hint,
        })),
      }),
      mode: () => prompts.select({
        message: "Working mode — operational style",
        initialValue: "expert-advisor",
        options: [
          { value: "expert-advisor", label: "expert-advisor", hint: "guided, structured default" },
          { value: "hivemind-powered", label: "hivemind-powered", hint: "full multi-agent orchestration" },
          { value: "free-style", label: "free-style", hint: "minimal guardrails, maximum freedom" },
        ],
      }),
      expertLevel: () => prompts.select({
        message: "User expertise level — experience with development",
        initialValue: "intermediate-high-level",
        options: EXPERTISE_OPTIONS.map((opt) => ({
          value: opt.value,
          label: opt.label,
          hint: opt.hint,
        })),
      }),
      delegationSystems: () => prompts.multiselect({
        message: "Delegation systems — subagent dispatch methods",
        required: false,
        initialValues: ["native_task", "delegate_task"],
        options: DELEGATION_OPTIONS.map((opt) => ({
          value: opt.value,
          label: opt.label,
          hint: opt.hint,
        })),
      }),
      scope: () => prompts.select({
        message: "Primitive install scope — where primitives are installed",
        initialValue: "project",
        options: SCOPE_OPTIONS.map((opt) => ({
          value: opt.value,
          label: opt.label,
          hint: opt.hint,
        })),
      }),
    },
    {
      onCancel: () => {
        prompts.cancel("Initialization cancelled.")
        return
      },
    },
  )

  if (prompts.isCancel(result)) {
    return null
  }

  prompts.outro(`Using ${result.scope} primitive scope.`)

  const selected = new Set(result.delegationSystems as string[])
  const normalizedScope = result.scope as BootstrapScope
  const normalizedDelegationSystems: DelegationSystems = {
    native_task: selected.has("native_task"),
    delegate_task: selected.has("delegate_task"),
    background_delegation: selected.has("background_delegation"),
  }

  return {
    scope: normalizedScope,
    config: {
      conversation_language: result.conversationLanguage as SupportedLanguage,
      documents_and_artifacts_language: result.artifactLanguage as SupportedLanguage,
      mode: result.mode as HivemindMode,
      user_expert_level: result.expertLevel as UserExpertLevel,
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
