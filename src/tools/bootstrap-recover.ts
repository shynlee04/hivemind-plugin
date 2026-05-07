import { accessSync, constants, existsSync, lstatSync, mkdirSync, readlinkSync, readdirSync, symlinkSync, unlinkSync } from "node:fs"
import { dirname, join, relative, resolve } from "node:path"

import { tool } from "@opencode-ai/plugin"

import { PRIMITIVE_TYPES, resolveMetaBuilderRoot, resolveOpenCodeRoot } from "../lib/bootstrap-structure.js"
import { renderToolResult } from "../shared/tool-helpers.js"
import { error, success } from "../shared/tool-response.js"
import { BootstrapRecoverInputSchema, type BootstrapRecoverInput, type BootstrapRecoverResult, type BootstrapScope } from "../schema-kernel/bootstrap.schema.js"

type PrimitiveKind = (typeof PRIMITIVE_TYPES)[number]
type RecoverStatus = "ok" | "missing" | "broken" | "file"

type PrimitiveSource = {
  kind: PrimitiveKind
  name: string
  sourcePath: string
}

type ScopeResolution = {
  requestedScope: BootstrapScope
  effectiveScope: BootstrapScope
  primitiveTargetRoot: string
  fallbackApplied: boolean
  fallbackReason?: string
}

/**
 * Create the OpenCode write-side `bootstrap-recover` tool.
 *
 * The tool validates scope/root input, then delegates symlink repair work to
 * {@link bootstrapRecover}. Invalid inputs are rejected before any mutation occurs.
 *
 * @returns An OpenCode tool definition for BOOT-02 primitive recovery.
 *
 * @example
 * ```ts
 * const tool = createBootstrapRecoverTool()
 * ```
 */
export function createBootstrapRecoverTool(): ReturnType<typeof tool> {
  const s = tool.schema
  return tool({
    description: "Repair missing or broken BOOT-02 OpenCode primitive symlinks for the requested project/global scope without overwriting real files.",
    args: {
      projectRoot: s.string().describe("Project root used to resolve local .hivemind and source-of-truth primitive roots"),
      scope: s.string().describe("Primitive repair scope: project or global"),
      globalConfigDir: s.string().describe("Optional explicit OpenCode global config path"),
    },
    async execute(rawArgs): Promise<string> {
      const parsed = BootstrapRecoverInputSchema.safeParse(rawArgs)
      if (!parsed.success) {
        return renderToolResult(error("Invalid bootstrap-recover arguments", { issues: parsed.error.issues }))
      }

      try {
        const result = await bootstrapRecover(parsed.data)
        return renderToolResult(success("Bootstrap recover completed", result))
      } catch (cause) {
        return renderToolResult(error(cause instanceof Error ? cause.message : String(cause)))
      }
    },
  })
}

/**
 * Repair BOOT-02 primitive symlinks for the requested scope.
 *
 * The recover flow walks the meta-builder primitive source roots, classifies each
 * expected target as `OK`, `MISSING`, `BROKEN`, or `FILE`, recreates only missing
 * or broken symlinks, and leaves every real file untouched.
 *
 * @param input - Validated recover request including project root and requested primitive scope.
 * @returns Detailed repair counts plus requested/effective scope information.
 *
 * @example
 * ```ts
 * const result = await bootstrapRecover({ projectRoot: process.cwd(), scope: "project" })
 * console.log(result.counts.skills.repaired)
 * ```
 */
export async function bootstrapRecover(input: BootstrapRecoverInput): Promise<BootstrapRecoverResult> {
  const projectRoot = resolve(input.projectRoot)
  const scope = resolveBootstrapScope(projectRoot, input.scope, input.globalConfigDir)
  const warnings: string[] = []
  const counts = {
    agents: { ok: 0, missing: 0, broken: 0, file: 0, repaired: 0 },
    skills: { ok: 0, missing: 0, broken: 0, file: 0, repaired: 0 },
    commands: { ok: 0, missing: 0, broken: 0, file: 0, repaired: 0 },
  }

  for (const primitive of listPrimitiveSources(projectRoot)) {
    const targetPath = resolvePrimitiveTargetPath(scope.primitiveTargetRoot, primitive)
    const status = classifyPrimitiveTarget(targetPath, primitive.sourcePath)
    counts[primitive.kind][status] += 1

    if (status === "missing" || status === "broken") {
      repairPrimitiveSymlink(targetPath, primitive.sourcePath)
      counts[primitive.kind].repaired += 1
      continue
    }

    if (status === "file") {
      warnings.push(`${primitive.kind}:${primitive.name}`)
    }
  }

  return {
    projectRoot,
    requestedScope: scope.requestedScope,
    effectiveScope: scope.effectiveScope,
    fallbackApplied: scope.fallbackApplied,
    fallbackReason: scope.fallbackReason,
    primitiveTargetRoot: scope.primitiveTargetRoot,
    counts,
    warnings,
  }
}

function resolveBootstrapScope(
  projectRoot: string,
  requestedScope: BootstrapScope,
  explicitGlobalConfigDir?: string,
): ScopeResolution {
  if (requestedScope === "project") {
    return {
      requestedScope,
      effectiveScope: "project",
      primitiveTargetRoot: resolveOpenCodeRoot(projectRoot),
      fallbackApplied: false,
    }
  }

  const globalRoot = resolve(explicitGlobalConfigDir ?? process.env.OPENCODE_CONFIG_DIR ?? `${process.env.HOME || "/tmp"}/.config/opencode`)
  try {
    mkdirSync(globalRoot, { recursive: true })
    accessSync(globalRoot, constants.W_OK)
    return {
      requestedScope,
      effectiveScope: "global",
      primitiveTargetRoot: globalRoot,
      fallbackApplied: false,
    }
  } catch {
    return {
      requestedScope,
      effectiveScope: "project",
      primitiveTargetRoot: resolveOpenCodeRoot(projectRoot),
      fallbackApplied: true,
      fallbackReason: "Global OpenCode config path is unavailable or not writable; falling back to project scope.",
    }
  }
}

function listPrimitiveSources(projectRoot: string): PrimitiveSource[] {
  const metaBuilderRoot = resolveMetaBuilderRoot(projectRoot)
  const sources: PrimitiveSource[] = []

  const roots: Record<PrimitiveKind, string[]> = {
    agents: [join(metaBuilderRoot, "agents"), join(metaBuilderRoot, "agents-lab", "active", "refactoring")],
    skills: [join(metaBuilderRoot, "skills"), join(metaBuilderRoot, "skills-lab", "active", "refactoring")],
    commands: [join(metaBuilderRoot, "commands"), join(metaBuilderRoot, "commands-lab", "active", "refactoring")],
  }

  for (const kind of PRIMITIVE_TYPES) {
    const sourceRoot = roots[kind].find((candidate) => existsSync(candidate))
    if (!sourceRoot) continue
    for (const entry of readdirSync(sourceRoot)) {
      const sourcePath = join(sourceRoot, entry)
      if (kind === "skills") {
        if (existsSync(join(sourcePath, "SKILL.md"))) {
          sources.push({ kind, name: entry, sourcePath })
        }
        continue
      }

      if (entry.endsWith(".md") && lstatSync(sourcePath).isFile()) {
        sources.push({ kind, name: entry, sourcePath })
      }
    }
  }

  return sources
}

function resolvePrimitiveTargetPath(primitiveTargetRoot: string, primitive: PrimitiveSource): string {
  return join(primitiveTargetRoot, primitive.kind, primitive.name)
}

function classifyPrimitiveTarget(targetPath: string, expectedSourcePath: string): RecoverStatus {
  let stat: ReturnType<typeof lstatSync>
  try {
    stat = lstatSync(targetPath)
  } catch {
    return "missing"
  }

  if (!stat.isSymbolicLink()) {
    return "file"
  }

  const resolvedLink = resolve(dirname(targetPath), readlinkSync(targetPath))
  if (resolvedLink !== expectedSourcePath || !existsSync(resolvedLink)) {
    return "broken"
  }

  return "ok"
}

function repairPrimitiveSymlink(targetPath: string, sourcePath: string): void {
  mkdirSync(dirname(targetPath), { recursive: true })
  try {
    lstatSync(targetPath)
    unlinkSync(targetPath)
  } catch {
    // Missing target is fine — recover will create it.
  }
  symlinkSync(relative(dirname(targetPath), sourcePath), targetPath)
}
