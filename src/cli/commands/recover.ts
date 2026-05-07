import { dirname, resolve } from "node:path"
import { existsSync } from "node:fs"

import { bootstrapRecover } from "../../tools/bootstrap-recover.js"
import type { BootstrapRecoverResult, BootstrapScope } from "../../schema-kernel/bootstrap.schema.js"
import type { CliCommand, CliCommandContext, CliRouterResult } from "../router.js"

type RecoverCommandDeps = {
  bootstrapRecoverFn: typeof bootstrapRecover
  resolveProjectRoot: (explicitRoot?: string) => string | null
}

/**
 * Create the BOOT-02 `recover` CLI command.
 *
 * The command resolves the project root, validates `--scope`, and delegates all
 * symlink repair work to {@link bootstrapRecover}. It remains non-interactive and
 * idempotent, surfacing the effective scope used by the underlying tool.
 *
 * @param deps - Optional injectable dependencies for tests.
 * @returns The `recover` command implementation.
 *
 * @example
 * ```ts
 * const command = createRecoverCommand()
 * ```
 */
export function createRecoverCommand(deps: Partial<RecoverCommandDeps> = {}): CliCommand {
  const resolvedDeps: RecoverCommandDeps = {
    bootstrapRecoverFn: deps.bootstrapRecoverFn ?? bootstrapRecover,
    resolveProjectRoot: deps.resolveProjectRoot ?? resolveProjectRoot,
  }

  return {
    name: "recover",
    summary: "Repair missing or broken BOOT-02 primitive symlinks.",
    handler: async (ctx) => handleRecover(ctx, resolvedDeps),
  }
}

/**
 * Canonical BOOT-02 `recover` command export.
 *
 * @example
 * ```ts
 * const result = await recoverCmd.handler({ flags: {}, positionals: [], argv: ["recover"] })
 * ```
 */
export const recoverCmd = createRecoverCommand()

async function handleRecover(ctx: CliCommandContext, deps: RecoverCommandDeps): Promise<CliRouterResult> {
  if (hasHelpFlag(ctx.flags)) {
    return { exitCode: 0, output: renderRecoverHelp() }
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

  try {
    const result = await deps.bootstrapRecoverFn({
      projectRoot,
      scope: scopeResult.scope,
    })
    return { exitCode: 0, output: renderRecoverOutput(result) }
  } catch (cause) {
    return { exitCode: 70, error: cause instanceof Error ? cause.message : String(cause) }
  }
}

function renderRecoverOutput(result: BootstrapRecoverResult): string {
  const summarize = (label: string, counts: BootstrapRecoverResult["counts"]["agents"]): string => {
    const okTotal = counts.ok
    const repairedTotal = counts.repaired
    const skippedTotal = counts.file
    return `${label}: OK ${okTotal} | REPAIRED ${repairedTotal} | SKIPPED ${skippedTotal}`
  }

  const lines = [
    "Hivemind recover complete",
    `Requested scope: ${result.requestedScope}`,
    `Effective scope: ${result.effectiveScope}`,
    summarize("agents", result.counts.agents),
    summarize("skills", result.counts.skills),
    summarize("commands", result.counts.commands),
  ]

  if (result.fallbackApplied && result.fallbackReason) {
    lines.push(`Scope fallback: ${result.fallbackReason}`)
  }
  if (result.warnings.length > 0) {
    lines.push(`Skipped real files: ${result.warnings.join(", ")}`)
  }
  return lines.join("\n")
}

function renderRecoverHelp(): string {
  return [
    "Usage: hivemind recover [--root=<path>] [--scope=project|global]",
    "",
    "Recover repairs only missing/broken BOOT-02 primitive symlinks and never overwrites real files.",
  ].join("\n")
}

function resolveProjectRoot(explicitRoot?: string): string | null {
  const candidate = explicitRoot?.trim() ? resolve(explicitRoot) : process.cwd()
  let current = candidate
  while (true) {
    if (existsSync(resolve(current, "package.json")) || existsSync(resolve(current, ".hivemind"))) {
      return current
    }
    const parent = dirname(current)
    if (parent === current) return null
    current = parent
  }
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

function getStringFlag(flags: Record<string, string | boolean>, key: string): string | undefined {
  const value = flags[key]
  return typeof value === "string" ? value : undefined
}

function hasHelpFlag(flags: Record<string, string | boolean>): boolean {
  return flags.help === true || flags.h === true
}
