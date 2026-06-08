import { existsSync, readFileSync, statSync, realpathSync } from "node:fs"
import { dirname, extname, relative, resolve, sep } from "node:path"

import type { ChunkRequiredSignal, DocHeading } from "./types.js"
import { assertPathWithinRoot } from "../../shared/security/path-scope.js"

/** Extensions allowed for write/create/delete operations. */
export const WRITABLE_EXTENSIONS = new Set([".md", ".json", ".yaml", ".yml", ".xml"])

/** Extensions recognized for read/skim/search operations. */
export const DOCUMENT_EXTENSIONS = new Set([".md", ".mdx", ".json", ".yaml", ".yml", ".xml", ".txt"])

/** Line-count threshold above which writes return a chunk_required signal. */
export const CHUNK_WRITE_THRESHOLD = 600

/** Maximum file size in bytes (10 MB) — prevents DoS from large file reads. */
export const MAX_FILE_SIZE = 10 * 1024 * 1024

/**
 * Governance write denylist patterns.
 * Exact file matches and `/**`-suffixed directory prefixes.
 */
export const GOVERNANCE_WRITE_DENYLIST = [
  ".hivemind/**",
  ".opencode/**",
  "opencode.json",
  "AGENTS.md",
  "CLAUDE.md",
  "src/AGENTS.md",
] as const

/**
 * Resolve a document path within the project root.
 *
 * @param projectRoot - Trusted project root.
 * @param candidate - Caller-provided file or directory path.
 * @returns Absolute in-scope path.
 */
export function resolveDocPath(projectRoot: string, candidate: string): string {
  return assertPathWithinRoot(projectRoot, candidate, "doc intelligence")
}

/**
 * Resolve a document path with defense-in-depth symlink-traversal protection.
 *
 * Layers a realpath check on top of the lexical check performed by
 * `assertPathWithinRoot`. If the candidate file exists, its realpath is
 * resolved via `realpathSync.native` (OS-level, follows the full symlink
 * chain) and the resolved path is verified to stay inside the realpath of
 * the project root. If the candidate does not exist (new file case), the
 * nearest existing parent is resolved and checked instead — preventing
 * escapes via parent-directory symlinks.
 *
 * @param projectRoot - Trusted project root.
 * @param candidate - Caller-provided file or directory path.
 * @param operation - Operation name (for the `[Harness]` error prefix).
 * @returns Absolute in-scope path whose realpath stays inside the project root.
 * @throws {Error} When the resolved realpath escapes the project root.
 */
export function resolveSafeDocPath(projectRoot: string, candidate: string, operation: string): string {
  // Layer 1: lexical + realpath check from shared path-scope (handles `..` escapes)
  const absPath = resolveDocPath(projectRoot, candidate)

  // Layer 2: defense-in-depth — explicit realpath on the target or its parent.
  // For an existing file we resolve the file itself; for a brand-new file we
  // resolve the nearest existing parent so a parent-dir symlink to outside
  // is also caught.
  const realProjectRoot = existsSync(projectRoot) ? realpathSync.native(projectRoot) : resolve(projectRoot)
  const target = existsSync(absPath) ? absPath : dirname(absPath)
  if (!existsSync(target)) {
    return absPath
  }
  const realTarget = realpathSync.native(target)

  const isInside = realTarget === realProjectRoot || realTarget.startsWith(realProjectRoot + sep)
  if (!isInside) {
    throw new Error(`[Harness] ${operation}: path '${candidate}' resolves outside project root via symlink`)
  }
  return absPath
}

/**
 * Convert an absolute path to deterministic project-root-relative POSIX format.
 *
 * @param projectRoot - Trusted project root.
 * @param filePath - Absolute file path inside the project root.
 * @returns POSIX-style relative path.
 */
export function toRootRelativePath(projectRoot: string, filePath: string): string {
  return relative(projectRoot, filePath).split(sep).join("/")
}

/**
 * Check whether a file path uses an extension in the given set.
 *
 * @param filePath - Absolute or relative file path.
 * @param extensions - Set of valid extensions (e.g. WRITABLE_EXTENSIONS).
 * @returns True when the file extension is in the set.
 */
export function hasAllowedExtension(filePath: string, extensions: Set<string>): boolean {
  return extensions.has(extname(filePath).toLowerCase())
}

/**
 * Throws if file extension is not in WRITABLE_EXTENSIONS.
 *
 * @param filePath - Absolute file path to check.
 * @throws {Error} When extension is not writable.
 */
export function assertWritableExtension(filePath: string): void {
  if (!hasAllowedExtension(filePath, WRITABLE_EXTENSIONS)) {
    const ext = extname(filePath).toLowerCase()
    throw new Error(`[Harness] File type not writable: ${ext}`)
  }
}

/**
 * Throws if normalized relative path matches governance denylist.
 *
 * @param filePath - Absolute file path to check.
 * @param projectRoot - Trusted project root.
 * @param allowGovernance - If true, bypass denylist check.
 * @throws {Error} When path matches governance denylist and allowGovernance is false.
 */
export function assertGovernanceWriteAllowed(
  filePath: string,
  projectRoot: string,
  allowGovernance = false,
): void {
  if (allowGovernance) return

  const relPath = toRootRelativePath(projectRoot, filePath)

  for (const pattern of GOVERNANCE_WRITE_DENYLIST) {
    if (pattern.endsWith("/**")) {
      // Directory prefix pattern
      const prefix = pattern.slice(0, -3)
      if (relPath.startsWith(prefix)) {
        throw new Error(`[Harness] Governance denylist blocks write to: ${relPath}`)
      }
    } else {
      // Exact file match
      if (relPath === pattern || relPath.endsWith(`/${pattern}`)) {
        throw new Error(`[Harness] Governance denylist blocks write to: ${relPath}`)
      }
    }
  }
}

/**
 * Returns ChunkRequiredSignal if file exceeds CHUNK_WRITE_THRESHOLD lines, or null.
 *
 * @param filePath - Absolute file path to check.
 * @param outline - Document heading outline for the signal.
 * @returns ChunkRequiredSignal if file is too large, null otherwise.
 */
export function checkChunkThreshold(filePath: string, outline: DocHeading[] = []): ChunkRequiredSignal | null {
  if (!existsSync(filePath)) return null

  const lines = readFileSync(filePath, "utf-8").split(/\r?\n/).length

  if (lines > CHUNK_WRITE_THRESHOLD) {
    return {
      status: "chunk_required",
      path: filePath,
      lineCount: lines,
      threshold: CHUNK_WRITE_THRESHOLD,
      outline,
    }
  }

  return null
}

/**
 * Throws if file stat size exceeds MAX_FILE_SIZE (skips if not exists).
 *
 * @param filePath - Absolute file path to check.
 * @throws {Error} When file size exceeds MAX_FILE_SIZE.
 */
export function assertFileSizeWithinLimit(filePath: string): void {
  if (!existsSync(filePath)) return

  const stats = statSync(filePath)
  if (stats.size > MAX_FILE_SIZE) {
    throw new Error(`[Harness] File exceeds maximum size: ${stats.size} bytes (limit: ${MAX_FILE_SIZE})`)
  }
}
