/**
 * File safety utilities for document operations.
 * 
 * Provides path validation, document type detection, and governance boundary enforcement.
 * 
 * @module doc-intel/safety
 */

import { extname, resolve, isAbsolute, relative } from "node:path"

//─── Constants ──────────────────────────────────────────────────────────────────

/**
 * File extensions that write operations are allowed on.
 * All other extensions are read-only.
 */
export const WRITABLE_EXTENSIONS = new Set([".md", ".xml", ".json", ".yaml", ".yml"])

/**
 * File extensions recognized as "documents" for skim/list/search.
 */
export const DOCUMENT_EXTENSIONS = new Set([".md", ".xml", ".json", ".yaml", ".yml", ".txt"])

/**
 * Governance-owned paths that remain read-only unless a privileged caller opts in.
 * Supports exact file matches and directory prefixes via `/**` suffix.
 */
export const GOVERNANCE_WRITE_DENYLIST = [
  ".hivemind/**",
  ".opencode/**",
  "opencode.json",
  "AGENTS.md",
  "CLAUDE.md",
  "src/AGENTS.md",
] as const

//─── Path Safety Functions ──────────────────────────────────────────────────────

/**
 * Resolve a path relative to the project root, preventing directory traversal.
 *
 * @param projectRoot - Absolute path to the project root.
 * @param filePath - Workspace-relative or absolute file path.
 * @returns Resolved absolute path.
 * @throws If the resolved path escapes the project root.
 */
export function safePath(projectRoot: string, filePath: string): string {
  const abs = isAbsolute(filePath) ? resolve(filePath) : resolve(projectRoot, filePath)
  if (!abs.startsWith(resolve(projectRoot))) {
    throw new Error(`Path traversal blocked: ${filePath} escapes project root`)
  }
  return abs
}

/**
 * Check whether the file extension permits write operations.
 *
 * @param filePath - File path to check.
 * @returns True if the extension is in the writable allowlist.
 */
export function isWritable(filePath: string): boolean {
  return WRITABLE_EXTENSIONS.has(extname(filePath).toLowerCase())
}

/**
 * Check whether the file extension is a recognized document type.
 *
 * @param filePath - File path to check.
 * @returns True if the extension is in the document extensions set.
 */
export function isDocument(filePath: string): boolean {
  return DOCUMENT_EXTENSIONS.has(extname(filePath).toLowerCase())
}

/**
 * Convert an absolute path to a normalized project-relative path.
 *
 * @param projectRoot - Absolute path to the project root.
 * @param absPath - Absolute path to normalize.
 * @returns Project-relative path with forward slashes.
 */
export function relativeProjectPath(projectRoot: string, absPath: string): string {
  return relative(resolve(projectRoot), absPath).replace(/\\/g, "/")
}

/**
 * Check whether a normalized project-relative path matches the governance denylist.
 *
 * @param normalizedPath - Project-relative path using forward slashes.
 * @returns Matching denylist pattern, if any.
 */
export function matchGovernanceWriteDenylist(normalizedPath: string): string | undefined {
  return GOVERNANCE_WRITE_DENYLIST.find((pattern) => {
    if (pattern.endsWith("/**")) {
      const prefix = pattern.slice(0, -3)
      return normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`)
    }
    return normalizedPath === pattern
  })
}

/**
 * Enforce the governance write boundary for privileged and non-privileged callers.
 *
 * @param projectRoot - Absolute path to the project root.
 * @param absPath - Absolute target path.
 * @param allowGovernance - Whether the caller may bypass governance denylist checks.
 * @throws If the path is governance-owned and allowGovernance is false.
 */
export function assertGovernanceWriteAllowed(projectRoot: string, absPath: string, allowGovernance = false): void {
  if (allowGovernance) return

  const normalizedPath = relativeProjectPath(projectRoot, absPath)
  const matchedPattern = matchGovernanceWriteDenylist(normalizedPath)
  if (matchedPattern) {
    throw new Error(
      `Write blocked for governance-owned path: ${normalizedPath} (matched ${matchedPattern}). Pass allowGovernance=true only for privileged callers.`,
    )
  }
}