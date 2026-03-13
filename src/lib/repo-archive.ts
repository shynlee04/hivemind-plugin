import { existsSync } from "node:fs"
import { mkdir } from "node:fs/promises"
import { join } from "node:path"

export interface RepoArchivePaths {
  root: string
  dateStamp: string
  consolidatedRoot: string
  consolidatedDateDir: string
  consolidatedGovernanceClusterDir: string
  consolidatedSessionClusterDir: string
  consolidatedTaskClusterDir: string
  consolidatedUtilityClusterDir: string
  deadCodeRoot: string
  deadCodeDateDir: string
  deadCodeSwarmClusterDir: string
  deprecatedScriptsRoot: string
  deprecatedScriptsDateDir: string
  skillsRoot: string
}

export interface RepoArchiveStatus {
  exists: boolean
  missingPaths: string[]
  paths: RepoArchivePaths
}

/**
 * Format a calendar date for repo archive bucket names.
 *
 * @param dateInput Optional date input. Defaults to the current date.
 * @returns Date stamp in YYYY-MM-DD format.
 */
export function formatRepoArchiveDate(dateInput: Date | string = new Date()): string {
  if (typeof dateInput === "string") {
    return dateInput.slice(0, 10)
  }
  return dateInput.toISOString().slice(0, 10)
}

/**
 * Resolve the root `.archive/` taxonomy used for strategic quarantine and legacy storage.
 *
 * @param projectRoot Absolute project root.
 * @param dateInput Optional date input for dated archive buckets.
 * @returns Fully resolved repo archive paths.
 */
export function getRepoArchivePaths(
  projectRoot: string,
  dateInput: Date | string = new Date(),
): RepoArchivePaths {
  const dateStamp = formatRepoArchiveDate(dateInput)
  const root = join(projectRoot, ".archive")
  const consolidatedRoot = join(root, "consolidated")
  const consolidatedDateDir = join(consolidatedRoot, dateStamp)
  const deadCodeRoot = join(root, "dead-code")
  const deadCodeDateDir = join(deadCodeRoot, dateStamp)
  const deprecatedScriptsRoot = join(root, "deprecated-scripts")
  const deprecatedScriptsDateDir = join(deprecatedScriptsRoot, dateStamp)
  const skillsRoot = join(root, "skills")

  return {
    root,
    dateStamp,
    consolidatedRoot,
    consolidatedDateDir,
    consolidatedGovernanceClusterDir: join(consolidatedDateDir, "governance-cluster"),
    consolidatedSessionClusterDir: join(consolidatedDateDir, "session-cluster"),
    consolidatedTaskClusterDir: join(consolidatedDateDir, "task-cluster"),
    consolidatedUtilityClusterDir: join(consolidatedDateDir, "utility-cluster"),
    deadCodeRoot,
    deadCodeDateDir,
    deadCodeSwarmClusterDir: join(deadCodeDateDir, "swarm-cluster"),
    deprecatedScriptsRoot,
    deprecatedScriptsDateDir,
    skillsRoot,
  }
}

/**
 * Inspect whether the repo-level archive taxonomy is present.
 *
 * @param projectRoot Absolute project root.
 * @param dateInput Optional date input for dated archive buckets.
 * @returns Status of the required archive surfaces.
 */
export function getRepoArchiveStatus(
  projectRoot: string,
  dateInput: Date | string = new Date(),
): RepoArchiveStatus {
  const paths = getRepoArchivePaths(projectRoot, dateInput)
  const requiredPaths = [
    paths.root,
    paths.consolidatedRoot,
    paths.consolidatedDateDir,
    paths.consolidatedGovernanceClusterDir,
    paths.consolidatedSessionClusterDir,
    paths.consolidatedTaskClusterDir,
    paths.consolidatedUtilityClusterDir,
    paths.deadCodeRoot,
    paths.deadCodeDateDir,
    paths.deadCodeSwarmClusterDir,
    paths.deprecatedScriptsRoot,
    paths.deprecatedScriptsDateDir,
    paths.skillsRoot,
  ]

  const missingPaths = requiredPaths.filter((candidate) => !existsSync(candidate))

  return {
    exists: missingPaths.length === 0,
    missingPaths,
    paths,
  }
}

/**
 * Create the repo-level archive taxonomy for the current strategic refactor cycle.
 *
 * @param projectRoot Absolute project root.
 * @param dateInput Optional date input for dated archive buckets.
 * @returns The ensured archive paths.
 */
export async function ensureRepoArchiveStructure(
  projectRoot: string,
  dateInput: Date | string = new Date(),
): Promise<RepoArchivePaths> {
  const paths = getRepoArchivePaths(projectRoot, dateInput)

  await mkdir(paths.consolidatedGovernanceClusterDir, { recursive: true })
  await mkdir(paths.consolidatedSessionClusterDir, { recursive: true })
  await mkdir(paths.consolidatedTaskClusterDir, { recursive: true })
  await mkdir(paths.consolidatedUtilityClusterDir, { recursive: true })
  await mkdir(paths.deadCodeSwarmClusterDir, { recursive: true })
  await mkdir(paths.deprecatedScriptsDateDir, { recursive: true })
  await mkdir(paths.skillsRoot, { recursive: true })

  return paths
}
