import { randomUUID } from "node:crypto"
import { access, mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"
import { getEffectivePaths } from "../lib/paths.js"
import { toErrorOutput, toSuccessOutput } from "../lib/tool-response.js"
import { z } from "zod"

const BrainBootstrapSchema = z.object({
  sessionId: z.uuid(),
  lineage: z.literal("unresolved"),
  mode: z.literal("exploration"),
  turnCount: z.number().int().nonnegative(),
  driftScore: z.number().min(0).max(100),
  compactionCount: z.number().int().nonnegative(),
  outOfOrderCount: z.number().int().nonnegative(),
  evidencePressure: z.number().int().nonnegative(),
  lastActivity: z.iso.datetime(),
  createdAt: z.iso.datetime(),
  version: z.string().min(1),
})

const HierarchyBootstrapSchema = z.object({
  trajectory: z.object({
    id: z.uuid(),
    status: z.literal("awaiting_intent"),
    content: z.string(),
    createdAt: z.iso.datetime(),
  }),
  tactics: z.array(z.never()),
  actions: z.array(z.never()),
  version: z.string().min(1),
})

const ProfileSchema = z.object({
  sessionId: z.uuid(),
  lineage: z.literal("unresolved"),
  mode: z.literal("exploration"),
  createdAt: z.iso.datetime(),
  lastActivity: z.iso.datetime(),
  version: z.string().min(1),
})

const PackageSchema = z.object({
  version: z.string().min(1),
})

interface BootstrapAccumulator {
  createdDirectories: string[]
  createdFiles: string[]
  reusedFiles: string[]
  repairedFiles: string[]
}

/**
 * Create the hivemind_bootstrap tool.
 *
 * @description Ensures required HiveMind state directories and bootstrap files
 * exist so entry-guard hooks can run safely. Operation is idempotent by default
 * and supports force recreation when requested.
 *
 * @param directory - Project root directory from OpenCode runtime.
 * @returns Tool definition for HiveMind state bootstrap.
 *
 * @example
 * ```typescript
 * const bootstrap = createHivemindBootstrapTool(process.cwd())
 * ```
 */
export function createHivemindBootstrapTool(directory: string): ToolDefinition {
  return tool({
    description: "Bootstrap HiveMind state files for new session",
    args: {
      force: tool.schema
        .boolean()
        .optional()
        .default(false)
        .describe("Force recreation of state files"),
    },
    async execute({ force }) {
      try {
        return await runBootstrap(directory, force)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return toErrorOutput(`Bootstrap failed: ${message}`)
      }
    },
  })
}

async function runBootstrap(directory: string, force: boolean): Promise<string> {
  const paths = getEffectivePaths(directory)
  const anchorsDir = join(paths.root, "anchors")
  const memsDir = join(paths.root, "mems")

  const result: BootstrapAccumulator = {
    createdDirectories: [],
    createdFiles: [],
    reusedFiles: [],
    repairedFiles: [],
  }

  const requiredDirs = [paths.stateDir, paths.activeDir, anchorsDir, memsDir]
  for (const dirPath of requiredDirs) {
    const existed = await pathExists(dirPath)
    await mkdir(dirPath, { recursive: true })
    if (!existed) {
      result.createdDirectories.push(dirPath)
    }
  }

  const version = await loadPackageVersion(directory)
  const now = new Date().toISOString()

  const existingBrain = await readJsonFile(paths.brain)
  const parsedBrain = BrainBootstrapSchema.safeParse(existingBrain)
  const sessionId = !force && parsedBrain.success
    ? parsedBrain.data.sessionId
    : randomUUID()

  const brainPayload = BrainBootstrapSchema.parse({
    sessionId,
    lineage: "unresolved",
    mode: "exploration",
    turnCount: 0,
    driftScore: 100,
    compactionCount: 0,
    outOfOrderCount: 0,
    evidencePressure: 0,
    lastActivity: now,
    createdAt: !force && parsedBrain.success ? parsedBrain.data.createdAt : now,
    version,
  })

  await ensureJsonStateFile(paths.brain, brainPayload, parsedBrain.success, force, result)

  const existingHierarchy = await readJsonFile(paths.hierarchy)
  const parsedHierarchy = HierarchyBootstrapSchema.safeParse(existingHierarchy)
  const hierarchyPayload = HierarchyBootstrapSchema.parse({
    trajectory: {
      id: !force && parsedHierarchy.success ? parsedHierarchy.data.trajectory.id : randomUUID(),
      status: "awaiting_intent",
      content: !force && parsedHierarchy.success
        ? parsedHierarchy.data.trajectory.content
        : "Awaiting user intent",
      createdAt: !force && parsedHierarchy.success
        ? parsedHierarchy.data.trajectory.createdAt
        : now,
    },
    tactics: [],
    actions: [],
    version,
  })

  await ensureJsonStateFile(paths.hierarchy, hierarchyPayload, parsedHierarchy.success, force, result)

  const sessionDir = join(paths.activeDir, sessionId)
  const sessionDirExisted = await pathExists(sessionDir)
  await mkdir(sessionDir, { recursive: true })
  if (!sessionDirExisted) {
    result.createdDirectories.push(sessionDir)
  }

  const profilePath = join(sessionDir, "profile.json")
  const existingProfile = await readJsonFile(profilePath)
  const parsedProfile = ProfileSchema.safeParse(existingProfile)
  const profilePayload = ProfileSchema.parse({
    sessionId,
    lineage: "unresolved",
    mode: "exploration",
    createdAt: !force && parsedProfile.success ? parsedProfile.data.createdAt : now,
    lastActivity: now,
    version,
  })

  await ensureJsonStateFile(profilePath, profilePayload, parsedProfile.success, force, result)

  return toSuccessOutput("HiveMind state bootstrap completed", sessionId, {
    force,
    sessionId,
    version,
    createdDirectories: result.createdDirectories,
    createdFiles: result.createdFiles,
    reusedFiles: result.reusedFiles,
    repairedFiles: result.repairedFiles,
    stateFiles: {
      brain: paths.brain,
      hierarchy: paths.hierarchy,
      profile: profilePath,
    },
  })
}

async function ensureJsonStateFile<T>(
  filePath: string,
  payload: T,
  currentIsValid: boolean,
  force: boolean,
  result: BootstrapAccumulator
): Promise<void> {
  if (force) {
    await writeJsonAtomic(filePath, payload)
    result.createdFiles.push(filePath)
    return
  }

  if (!(await pathExists(filePath))) {
    await writeJsonAtomic(filePath, payload)
    result.createdFiles.push(filePath)
    return
  }

  if (!currentIsValid) {
    await writeJsonAtomic(filePath, payload)
    result.repairedFiles.push(filePath)
    return
  }

  result.reusedFiles.push(filePath)
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

async function loadPackageVersion(projectRoot: string): Promise<string> {
  const packageJsonPath = join(projectRoot, "package.json")
  try {
    const raw = await readFile(packageJsonPath, "utf8")
    const parsed = JSON.parse(raw) as unknown
    const validated = PackageSchema.safeParse(parsed)
    if (validated.success) {
      return validated.data.version
    }
  } catch {
    // Fall through to default value.
  }
  return "0.0.0"
}

async function readJsonFile(path: string): Promise<unknown | null> {
  if (!(await pathExists(path))) {
    return null
  }

  try {
    const raw = await readFile(path, "utf8")
    return JSON.parse(raw) as unknown
  } catch {
    return null
  }
}

async function writeJsonAtomic(path: string, data: unknown): Promise<void> {
  const tempPath = `${path}.tmp-${process.pid}-${Date.now()}-${randomUUID()}`
  const payload = JSON.stringify(data, null, 2)

  try {
    await writeFile(tempPath, payload, "utf8")
    await rename(tempPath, path)
  } catch (error) {
    await unlink(tempPath).catch(() => {})
    throw error
  }
}
