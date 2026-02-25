/**
 * Knowledge Commits — Phase 3, §6.4
 *
 * Create atomic git commits when code intelligence state changes.
 * Follows patterns from auto-commit.ts but specialized for
 * codemap and code-intel artifacts.
 */

import { execSync } from "node:child_process"
import { writeFileSync, existsSync, mkdirSync } from "node:fs"
import { join } from "node:path"

import type { CompressedCodemap } from "./compressed-codemap.js"

// ─── Types ──────────────────────────────────────────────────────────────

export interface KnowledgeCommitOptions {
  /** Override the default commit message */
  message?: string
  /** Whether to append [skip ci] to the commit (default: true) */
  skipCi?: boolean
  /** Optional task id for governance traceability */
  taskId?: string
}

export interface KnowledgeCommitResult {
  /** Whether the commit succeeded */
  success: boolean
  /** Human-readable result message */
  message: string
  /** Short commit hash on success */
  commitHash?: string
}

export interface LastKnowledgeCommit {
  hash: string
  date: string
  message: string
}

// ─── Constants ──────────────────────────────────────────────────────────

const DEFAULT_COMMIT_MESSAGE = "chore: update code intelligence state"
const KNOWLEDGE_DIR = ".hivemind/codebase/code-intel"

// ─── Core ───────────────────────────────────────────────────────────────

/**
 * Persist the current CompressedCodemap state and create an atomic
 * git commit if changes are detected.
 *
 * Writes two files:
 * - compressed-codemap.json — full codemap state
 * - codemap-summary.json — lightweight metadata for quick reads
 *
 * Only commits if there are actual changes to the knowledge directory.
 */
export async function commitKnowledgeState(
  projectRoot: string,
  codemap: CompressedCodemap,
  options: KnowledgeCommitOptions = {},
): Promise<KnowledgeCommitResult> {
  const knowledgeDir = join(projectRoot, KNOWLEDGE_DIR)
  const codemapPath = join(knowledgeDir, "compressed-codemap.json")
  const summaryPath = join(knowledgeDir, "codemap-summary.json")

  try {
    // Ensure knowledge directory exists
    if (!existsSync(knowledgeDir)) {
      mkdirSync(knowledgeDir, { recursive: true })
    }

    // Write full codemap state
    writeFileSync(codemapPath, JSON.stringify(codemap, null, 2), "utf-8")

    // Write lightweight summary
    const summary = buildSummary(codemap)
    writeFileSync(summaryPath, JSON.stringify(summary, null, 2), "utf-8")

    // Check if there are actual changes to commit
    const status = execGit(projectRoot, ["status", "--porcelain", "--", KNOWLEDGE_DIR])
    if (!status.trim()) {
      return { success: true, message: "No knowledge changes to commit" }
    }

    // Stage knowledge files only
    execGit(projectRoot, ["add", "--", KNOWLEDGE_DIR])

    // Build commit message
    const skipCi = options.skipCi !== false
    let message = options.message ?? DEFAULT_COMMIT_MESSAGE
    if (options.taskId) {
      message = `${message} [task:${options.taskId}]`
    }
    if (skipCi && !message.includes("[skip ci]")) {
      message += " [skip ci]"
    }

    // Commit
    execGit(projectRoot, ["commit", "-m", message])

    // Get commit hash
    const hash = execGit(projectRoot, ["rev-parse", "--short", "HEAD"]).trim()

    return {
      success: true,
      message: `Knowledge state committed: ${hash}`,
      commitHash: hash,
    }
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : String(error)
    return { success: false, message: `Knowledge commit failed: ${detail}` }
  }
}

/**
 * Check if knowledge state has uncommitted changes.
 */
export function hasKnowledgeChanged(projectRoot: string): boolean {
  try {
    const status = execGit(projectRoot, ["status", "--porcelain", "--", KNOWLEDGE_DIR])
    return status.trim().length > 0
  } catch {
    return false
  }
}

/**
 * Get the most recent knowledge commit info.
 * Returns null if no knowledge commits exist.
 */
export function getLastKnowledgeCommit(projectRoot: string): LastKnowledgeCommit | null {
  try {
    const log = execGit(projectRoot, [
      "log", "-1", "--format=%H|%aI|%s", "--", KNOWLEDGE_DIR,
    ])
    const trimmed = log.trim()
    if (!trimmed) return null

    const pipeIdx1 = trimmed.indexOf("|")
    const pipeIdx2 = trimmed.indexOf("|", pipeIdx1 + 1)
    if (pipeIdx1 === -1 || pipeIdx2 === -1) return null

    return {
      hash: trimmed.slice(0, pipeIdx1),
      date: trimmed.slice(pipeIdx1 + 1, pipeIdx2),
      message: trimmed.slice(pipeIdx2 + 1),
    }
  } catch {
    return null
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────

/** Build lightweight summary from codemap */
function buildSummary(codemap: CompressedCodemap): Record<string, unknown> {
  return {
    version: codemap.version,
    updatedAt: codemap.createdAt,
    fileCount: codemap.files.length,
    totalTokens: codemap.totalTokens,
    originalTotalTokens: codemap.originalTotalTokens,
    compressionRatio: codemap.compressionRatio,
    topFiles: codemap.files
      .slice()
      .sort((a, b) => b.originalTokenCount - a.originalTokenCount)
      .slice(0, 10)
      .map((f) => ({
        path: f.path,
        tokens: f.originalTokenCount,
        signatures: f.signatures.length,
      })),
  }
}

/** Execute a git command with array-based args (safe from injection) */
function execGit(projectRoot: string, args: string[]): string {
  const fullArgs = ["-C", projectRoot, ...args]
  return execSync(`git ${fullArgs.map(shellEscape).join(" ")}`, {
    encoding: "utf-8",
    timeout: 10000,
  })
}

/** Escape a shell argument */
function shellEscape(arg: string): string {
  // Wrap in single quotes, escape existing single quotes
  return `'${arg.replace(/'/g, "'\\''")}'`
}
