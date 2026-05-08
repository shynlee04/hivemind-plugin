import { spawnSync } from "node:child_process"
import { existsSync, lstatSync, readFileSync, readdirSync, readlinkSync } from "node:fs"
import { dirname, resolve, join } from "node:path"

import { DOCTOR_CHECKS, GITKEEP_FILE, PRIMITIVE_TYPES, resolveHiveMindRoot, resolveMetaBuilderRoot, resolveOpenCodeRoot, TIER_1_DIRECTORIES } from "../../features/bootstrap/structure.js"
import { validateConfigsFile } from "../../schema-kernel/hivemind-configs.schema.js"
import { generateHivemindConfigsJsonSchema } from "../../schema-kernel/generate-config-json-schema.js"
import type { BootstrapScope } from "../../schema-kernel/bootstrap.schema.js"
import { renderTable } from "../renderer.js"
import type { CliCommand, CliCommandContext, CliRouterResult } from "../router.js"

type DoctorCheckName = (typeof DOCTOR_CHECKS)[number]
type DoctorStatus = "PASS" | "FAIL" | "WARN"
type DoctorRow = { check: DoctorCheckName; status: DoctorStatus; details: string }
type HealthScript = "typecheck" | "test"
type HealthCommandResult = { exitCode: number; output?: string }

type DoctorCommandDeps = {
  resolveProjectRoot: (explicitRoot?: string) => string | null
  resolveSdk: () => string
  runHealthCommand: (script: HealthScript, projectRoot: string) => HealthCommandResult
  countSourceModules: (projectRoot: string) => number
}

/**
 * Create the BOOT-02 `doctor` CLI command.
 *
 * The command performs read-only validation of local `.hivemind` structure,
 * selected-scope primitive symlinks, config presence/parseability, SDK
 * availability, typecheck/test health, and source module inventory. It never
 * writes, repairs, or mutates filesystem state.
 *
 * @param deps - Optional injectable dependencies for tests.
 * @returns The `doctor` command implementation.
 *
 * @example
 * ```ts
 * const command = createDoctorCommand()
 * ```
 */
export function createDoctorCommand(deps: Partial<DoctorCommandDeps> = {}): CliCommand {
  const resolvedDeps: DoctorCommandDeps = {
    resolveProjectRoot: deps.resolveProjectRoot ?? resolveProjectRoot,
    resolveSdk: deps.resolveSdk ?? (() => import.meta.resolve("@opencode-ai/plugin")),
    runHealthCommand: deps.runHealthCommand ?? runHealthCommand,
    countSourceModules: deps.countSourceModules ?? countSourceModules,
  }

  return {
    name: "doctor",
    summary: "Run BOOT-02 health checks for structure, symlinks, config, and SDK.",
    handler: async (ctx) => handleDoctor(ctx, resolvedDeps),
  }
}

/**
 * Canonical BOOT-02 `doctor` command export.
 *
 * @example
 * ```ts
 * const result = await doctorCmd.handler({ flags: {}, positionals: [], argv: ["doctor"] })
 * ```
 */
export const doctorCmd = createDoctorCommand()

async function handleDoctor(ctx: CliCommandContext, deps: DoctorCommandDeps): Promise<CliRouterResult> {
  if (hasHelpFlag(ctx.flags)) {
    return { exitCode: 0, output: renderDoctorHelp() }
  }

  const explicitRoot = getStringFlag(ctx.flags, "root")
  const projectRoot = deps.resolveProjectRoot(explicitRoot)
  if (projectRoot === null) {
    return { exitCode: 64, error: "[Harness] Unable to resolve a project root from --root, package.json, or .hivemind." }
  }

  const selectedCheck = getStringFlag(ctx.flags, "check")
  if (selectedCheck !== undefined && !DOCTOR_CHECKS.includes(selectedCheck as DoctorCheckName)) {
    return { exitCode: 64, error: `[Harness] Invalid doctor check: ${selectedCheck}` }
  }

  const scopeResult = parseScopeFlag(ctx.flags.scope)
  if (!scopeResult.success) {
    return { exitCode: 64, error: scopeResult.error }
  }

  const checks = selectedCheck === undefined
    ? [...DOCTOR_CHECKS]
    : [selectedCheck as DoctorCheckName]

  const rows = checks.map((check) => runDoctorCheck(check, projectRoot, scopeResult.scope, deps))
  const hasFailure = rows.some((row) => row.status === "FAIL")
  return {
    exitCode: hasFailure ? 1 : 0,
    output: renderDoctorOutput(rows, projectRoot, scopeResult.scope),
  }
}

function runDoctorCheck(
  check: DoctorCheckName,
  projectRoot: string,
  scope: BootstrapScope,
  deps: DoctorCommandDeps,
): DoctorRow {
  switch (check) {
    case "structure":
      return runStructureCheck(projectRoot)
    case "symlinks":
      return runSymlinkCheck(projectRoot, scope)
    case "config":
      return runConfigCheck(projectRoot)
    case "sdk":
      return runSdkCheck(deps)
    case "typecheck":
      return runCommandCheck("typecheck", projectRoot, deps)
    case "tests":
      return runCommandCheck("tests", projectRoot, deps)
    case "modules":
      return runModulesCheck(projectRoot, deps)
  }
}

function runStructureCheck(projectRoot: string): DoctorRow {
  const hiveMindRoot = resolveHiveMindRoot(projectRoot)
  const missing = TIER_1_DIRECTORIES
    .map((directory) => join(hiveMindRoot, directory, GITKEEP_FILE))
    .filter((candidate) => !existsSync(candidate))
  return missing.length === 0
    ? { check: "structure", status: "PASS", details: "All BOOT-02 Tier-1 directories and .gitkeep files are present." }
    : { check: "structure", status: "FAIL", details: `Missing: ${missing.join(", ")}` }
}

function runSymlinkCheck(projectRoot: string, scope: BootstrapScope): DoctorRow {
  const primitiveTargetRoot = scope === "global"
    ? resolve(process.env.OPENCODE_CONFIG_DIR ?? `${process.env.HOME || "/tmp"}/.config/opencode`)
    : resolveOpenCodeRoot(projectRoot)
  const metaBuilderRoot = resolveMetaBuilderRoot(projectRoot)
  const missing: string[] = []
  const broken: string[] = []
  const realFiles: string[] = []

  for (const kind of PRIMITIVE_TYPES) {
    const rootCandidates = {
      agents: [join(metaBuilderRoot, "agents"), join(metaBuilderRoot, "agents-lab", "active", "refactoring")],
      skills: [join(metaBuilderRoot, "skills"), join(metaBuilderRoot, "skills-lab", "active", "refactoring")],
      commands: [join(metaBuilderRoot, "commands"), join(metaBuilderRoot, "commands-lab", "active", "refactoring")],
    }[kind]
    const sourceRoot = rootCandidates.find((candidate) => existsSync(candidate))
    if (!sourceRoot) continue
    for (const entry of readdirSync(sourceRoot)) {
      const sourcePath = join(sourceRoot, entry)
      if (kind === "skills" && !existsSync(join(sourcePath, "SKILL.md"))) continue
      if (kind !== "skills" && (!entry.endsWith(".md") || !lstatSync(sourcePath).isFile())) continue

      const targetPath = join(primitiveTargetRoot, kind, entry)
      try {
        const stat = lstatSync(targetPath)
        if (!stat.isSymbolicLink()) {
          realFiles.push(targetPath)
          continue
        }
        const linkedPath = resolve(dirname(targetPath), readlinkSync(targetPath))
        if (linkedPath !== sourcePath || !existsSync(linkedPath)) {
          broken.push(targetPath)
        }
      } catch {
        missing.push(targetPath)
      }
    }
  }

  if (missing.length === 0 && broken.length === 0 && realFiles.length === 0) {
    return { check: "symlinks", status: "PASS", details: `All expected ${scope} primitive symlinks resolve correctly.` }
  }

  if (missing.length === 0 && broken.length === 0) {
    return { check: "symlinks", status: "WARN", details: `Real files preserved by recovery policy: ${realFiles.join(", ")}` }
  }

  const details = [
    missing.length > 0 ? `Missing: ${missing.join(", ")}` : null,
    broken.length > 0 ? `Broken: ${broken.join(", ")}` : null,
    realFiles.length > 0 ? `Real files: ${realFiles.join(", ")}` : null,
  ].filter(Boolean).join(" | ")

  return { check: "symlinks", status: "FAIL", details }
}

function runConfigCheck(projectRoot: string): DoctorRow {
  const hiveMindRoot = resolveHiveMindRoot(projectRoot)
  const schemaPath = join(hiveMindRoot, "configs.schema.json")
  if (!existsSync(schemaPath)) {
    return { check: "config", status: "FAIL", details: `Missing ${schemaPath}` }
  }
  try {
    const parsedSchema = JSON.parse(readFileSync(schemaPath, "utf8")) as Record<string, unknown>
    const expectedSchema = generateHivemindConfigsJsonSchema()
    if (JSON.stringify(parsedSchema) !== JSON.stringify(expectedSchema)) {
      return { check: "config", status: "FAIL", details: "configs.schema.json does not match the canonical generated runtime contract." }
    }
    const configValidation = validateConfigsFile(projectRoot)
    if (!configValidation.success) {
      return { check: "config", status: "FAIL", details: configValidation.error }
    }
    return { check: "config", status: "PASS", details: "configs.json is schema-valid and configs.schema.json matches the canonical generated runtime contract." }
  } catch (cause) {
    return { check: "config", status: "FAIL", details: cause instanceof Error ? cause.message : String(cause) }
  }
}

function runSdkCheck(deps: DoctorCommandDeps): DoctorRow {
  try {
    const resolved = deps.resolveSdk()
    return { check: "sdk", status: "PASS", details: `Resolved @opencode-ai/plugin at ${resolved}` }
  } catch (cause) {
    return { check: "sdk", status: "FAIL", details: cause instanceof Error ? cause.message : String(cause) }
  }
}

function runCommandCheck(check: "typecheck" | "tests", projectRoot: string, deps: DoctorCommandDeps): DoctorRow {
  const script: HealthScript = check === "tests" ? "test" : "typecheck"
  const result = deps.runHealthCommand(script, projectRoot)
  if (result.exitCode === 0) {
    return { check, status: "PASS", details: `npm run ${script} passed.` }
  }

  return {
    check,
    status: "FAIL",
    details: `npm run ${script} failed with exit code ${result.exitCode}.${summarizeCommandOutput(result.output)}`,
  }
}

function runModulesCheck(projectRoot: string, deps: DoctorCommandDeps): DoctorRow {
  const count = deps.countSourceModules(projectRoot)
  return count > 0
    ? { check: "modules", status: "PASS", details: `${count} TypeScript source modules found under src/.` }
    : { check: "modules", status: "FAIL", details: "No TypeScript source modules found under src/." }
}

function runHealthCommand(script: HealthScript, projectRoot: string): HealthCommandResult {
  const command = script === "test" ? ["test"] : ["run", "typecheck"]
  const result = spawnSync("npm", command, {
    cwd: projectRoot,
    encoding: "utf8",
    env: { ...process.env, CI: "true" },
  })
  return {
    exitCode: result.status ?? 1,
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`,
  }
}

function countSourceModules(projectRoot: string): number {
  const srcRoot = join(projectRoot, "src")
  if (!existsSync(srcRoot)) return 0
  return countTypeScriptFiles(srcRoot)
}

function countTypeScriptFiles(directory: string): number {
  let count = 0
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = join(directory, entry.name)
    if (entry.isDirectory()) {
      count += countTypeScriptFiles(entryPath)
      continue
    }
    if (entry.isFile() && entry.name.endsWith(".ts") && !entry.name.endsWith(".d.ts")) {
      count += 1
    }
  }
  return count
}

function summarizeCommandOutput(output: string | undefined): string {
  if (!output?.trim()) return ""
  const summary = output.replace(/\s+/g, " ").trim().slice(0, 300)
  return ` Output: ${summary}`
}

function renderDoctorOutput(rows: DoctorRow[], projectRoot: string, scope: BootstrapScope): string {
  const verdict = rows.some((row) => row.status === "FAIL") ? "FAILURES DETECTED" : "ALL CHECKS PASS"
  const table = renderTable(
    ["Check", "Status", "Details"],
    rows.map((row) => [row.check, row.status, row.details]),
  )
  return [
    "Hivemind Health Check",
    `Project root: ${projectRoot}`,
    `Primitive scope: ${scope}`,
    "",
    table,
    "",
    `Verdict: ${verdict}`,
  ].join("\n")
}

function renderDoctorHelp(): string {
  return [
    "Usage: hivemind doctor [--root=<path>] [--scope=project|global] [--check=structure|symlinks|config|sdk|typecheck|tests|modules]",
    "",
    "Doctor is read-only. It validates local structure/config, the selected primitive scope, SDK availability, typecheck, tests, and module inventory.",
  ].join("\n")
}

function resolveProjectRoot(explicitRoot?: string): string | null {
  const candidate = explicitRoot?.trim() ? resolve(explicitRoot) : process.cwd()
  let current = candidate
  while (true) {
    if (existsSync(join(current, "package.json")) || existsSync(join(current, ".hivemind"))) {
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
