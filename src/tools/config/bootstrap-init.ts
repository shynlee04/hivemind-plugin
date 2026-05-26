import { accessSync, constants, cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"

import { tool } from "@opencode-ai/plugin/tool"

import { DEFAULT_CONFIG_JSON, GITKEEP_FILE, PRIMITIVE_TYPES, TIER_1_DIRECTORIES, resolveHiveMindRoot, resolvePackageAssetsRoot, resolveOpenCodeRoot } from "../../features/bootstrap/structure.js"
import { renderToolResult } from "../../shared/tool-helpers.js"
import { error, success } from "../../shared/tool-response.js"
import { generateHivemindConfigsJsonSchema, writeConfigJsonSchema } from "../../schema-kernel/generate-config-json-schema.js"
import { BootstrapInitInputSchema, type BootstrapInitInput, type BootstrapInitResult, type BootstrapScope } from "../../schema-kernel/bootstrap.schema.js"

type PrimitiveKind = (typeof PRIMITIVE_TYPES)[number]

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
 * Create the OpenCode write-side `bootstrap-init` tool.
 *
 * The tool validates BOOT-02 init input, then delegates all filesystem work to
 * {@link bootstrapInit}. Invalid scope or root input is rejected before any
 * mutation occurs.
 *
 * @returns An OpenCode tool definition for BOOT-02 bootstrap init.
 *
 * @example
 * ```ts
 * const tool = createBootstrapInitTool()
 * ```
 */
export function createBootstrapInitTool(): ReturnType<typeof tool> {
  const s = tool.schema
  return tool({
    description: "Create BOOT-02 local .hivemind surfaces and install project/global OpenCode primitive symlinks with project-scope fallback when global install is unavailable.",
    args: {
      projectRoot: s.string().describe("Project root receiving local .hivemind artifacts"),
      scope: s.string().describe("Primitive install scope: project or global"),
      nonInteractive: s.boolean().describe("Whether init is running in --yes/CI mode"),
      globalConfigDir: s.string().describe("Optional explicit OpenCode global config path"),
      config: s.object({}).describe("Optional wizard-derived config values"),
    },
    async execute(rawArgs): Promise<string> {
      const parsed = BootstrapInitInputSchema.safeParse(rawArgs)
      if (!parsed.success) {
        return renderToolResult(error("Invalid bootstrap-init arguments", { issues: parsed.error.issues }))
      }

      try {
        const result = await bootstrapInit(parsed.data)
        return renderToolResult(success("Bootstrap init completed", result))
      } catch (cause) {
        return renderToolResult(error(cause instanceof Error ? cause.message : String(cause)))
      }
    },
  })
}

/**
 * Initialize a project's BOOT-02 bootstrap surfaces.
 *
 * This creates the local `.hivemind/` Tier-1 directories, writes gitkeep files,
 * installs `configs.json`, ships `configs.schema.json`, updates
 * `.hivemind/state/version.json`, and installs primitive symlinks into either the
 * project `.opencode/` root or the selected global OpenCode config root.
 * Existing user files are preserved; non-symlink targets are never overwritten.
 *
 * @param input - Validated init request including project root, requested scope, and optional wizard config.
 * @returns Detailed init result including requested/effective scope and fallback status.
 *
 * @example
 * ```ts
 * const result = await bootstrapInit({ projectRoot: process.cwd(), scope: "project", nonInteractive: true, config: {} })
 * console.log(result.effectiveScope)
 * ```
 */
export async function bootstrapInit(input: BootstrapInitInput): Promise<BootstrapInitResult> {
  const projectRoot = resolve(input.projectRoot)
  const hiveMindRoot = resolveHiveMindRoot(projectRoot)
  const versionFilePath = join(hiveMindRoot, "state", "version.json")
  const configsPath = join(hiveMindRoot, "configs.json")
  const schemaPath = join(hiveMindRoot, "configs.schema.json")
  const scope = resolveBootstrapScope(projectRoot, input.scope, input.globalConfigDir)
  const sources = listPrimitiveSources()
  const currentVersion = readInstalledPackageVersion()
  const previousVersion = readTrackedVersion(versionFilePath)

  const created = {
    hiveMindDirectories: 0,
    gitkeepFiles: 0,
    primitiveFiles: 0,
    configsJson: false,
    configSchemaJson: false,
    versionFile: false,
  }
  const existing = {
    hiveMindDirectories: 0,
    primitiveEntries: 0,
    configsJson: existsSync(configsPath),
    configSchemaJson: existsSync(schemaPath),
  }

  mkdirSync(hiveMindRoot, { recursive: true })
  for (const directory of TIER_1_DIRECTORIES) {
    const directoryPath = join(hiveMindRoot, directory)
    if (existsSync(directoryPath)) {
      existing.hiveMindDirectories += 1
    } else {
      mkdirSync(directoryPath, { recursive: true })
      created.hiveMindDirectories += 1
    }

    const gitkeepPath = join(directoryPath, GITKEEP_FILE)
    if (!existsSync(gitkeepPath)) {
      writeFileSync(gitkeepPath, "", "utf8")
      created.gitkeepFiles += 1
    }
  }

  let backupPath: string | undefined
  if (previousVersion !== null && previousVersion !== currentVersion) {
    backupPath = backupPrimitiveTarget(scope.primitiveTargetRoot)
  }

  if (!existsSync(configsPath)) {
    writeFileSync(configsPath, renderConfigJson(input.config, input.nonInteractive), "utf8")
    created.configsJson = true
  }

  const schemaDriftDetected = shouldRefreshSchemaArtifact(schemaPath)
  if (schemaDriftDetected) {
    writeConfigJsonSchema(projectRoot)
    created.configSchemaJson = true
  }

  const hadVersionFile = existsSync(versionFilePath)
  writeVersionFile(versionFilePath, currentVersion)
  created.versionFile = !hadVersionFile || previousVersion !== currentVersion

  for (const primitive of sources) {
    const targetPath = resolvePrimitiveTargetPath(scope.primitiveTargetRoot, primitive)
    const isNew = !existsSync(targetPath)
    copyPrimitive(targetPath, primitive.sourcePath)
    if (isNew) {
      created.primitiveFiles += 1
    } else {
      existing.primitiveEntries += 1
    }
  }

  return {
    projectRoot,
    requestedScope: scope.requestedScope,
    effectiveScope: scope.effectiveScope,
    fallbackApplied: scope.fallbackApplied,
    fallbackReason: scope.fallbackReason,
    primitiveTargetRoot: scope.primitiveTargetRoot,
    backupPath,
    created,
    existing,
  }
}

function shouldRefreshSchemaArtifact(schemaPath: string): boolean {
  if (!existsSync(schemaPath)) {
    return true
  }

  const currentContents = readFileSync(schemaPath, "utf8")
  const expectedContents = `${JSON.stringify(generateHivemindConfigsJsonSchema(), null, 2)}\n`
  return currentContents !== expectedContents
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

function readInstalledPackageVersion(): string {
  const packageJsonPath = new URL("../../../package.json", import.meta.url)
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as { version?: string }
  return packageJson.version ?? "0.0.0"
}

function readTrackedVersion(versionFilePath: string): string | null {
  if (!existsSync(versionFilePath)) return null
  try {
    const parsed = JSON.parse(readFileSync(versionFilePath, "utf8")) as { version?: string }
    return typeof parsed.version === "string" ? parsed.version : null
  } catch {
    return null
  }
}

function writeVersionFile(versionFilePath: string, version: string): void {
  mkdirSync(dirname(versionFilePath), { recursive: true })
  writeFileSync(versionFilePath, `${JSON.stringify({ version }, null, 2)}\n`, "utf8")
}

function renderConfigJson(config: BootstrapInitInput["config"], nonInteractive: boolean): string {
  if (nonInteractive || Object.keys(config).length === 0) {
    return DEFAULT_CONFIG_JSON
  }

  return `${JSON.stringify({ $schema: "./configs.schema.json", ...config }, null, 2)}\n`
}

function backupPrimitiveTarget(primitiveTargetRoot: string): string | undefined {
  if (!existsSync(primitiveTargetRoot)) return undefined
  const backupPath = join(dirname(primitiveTargetRoot), `.opencode-backup-${new Date().toISOString().slice(0, 10)}`)
  if (!existsSync(backupPath)) {
    cpSync(primitiveTargetRoot, backupPath, { recursive: true })
  }
  return backupPath
}

function listPrimitiveSources(): PrimitiveSource[] {
  const assetsRoot = resolvePackageAssetsRoot()
  const sources: PrimitiveSource[] = []

  for (const kind of PRIMITIVE_TYPES) {
    const sourceRoot = join(assetsRoot, kind)
    if (!existsSync(sourceRoot)) continue
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
  const singularMap: Record<string, string> = {
    agents: "agent",
    skills: "skill",
    commands: "command",
  }
  const singular = singularMap[primitive.kind]
  if (singular) {
    const singularDir = join(primitiveTargetRoot, singular)
    if (existsSync(singularDir)) {
      return join(singularDir, primitive.name)
    }
  }
  return join(primitiveTargetRoot, primitive.kind, primitive.name)
}

function copyPrimitive(targetPath: string, sourcePath: string): void {
  mkdirSync(dirname(targetPath), { recursive: true })
  try {
    const stat = lstatSync(targetPath)
    if (stat.isSymbolicLink()) {
      rmSync(targetPath, { recursive: true, force: true })
    } else {
      const backupPath = targetPath + ".backup"
      rmSync(backupPath, { recursive: true, force: true })
      renameSync(targetPath, backupPath)
    }
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && err.code !== "ENOENT") {
      rmSync(targetPath, { recursive: true, force: true })
    }
  }
  cpSync(sourcePath, targetPath, { recursive: true })
}
