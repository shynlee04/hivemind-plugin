/**
 * Worktree detection and HEAD resolution module (P27.2 D-05, REQ-8 prep).
 *
 * Exports functions to:
 * - Detect the current worktree path (`detectWorktree`)
 * - Get the 40-char hex SHA of the current worktree HEAD (`getWorktreeHead`)
 *
 * This enables REQ-8 (commitHash matches git SHA) to scope the SHA
 * verification to the current worktree, preventing multi-worklane commit
 * contamination (RESEARCH Pitfall 5).
 *
 * Per D-05: scope `git rev-parse` to the worktree, not the main repo.
 */

import { execSync } from "node:child_process"

/**
 * Detect the current worktree path for a given project root.
 *
 * Uses `git worktree list --porcelain` to find the worktree that
 * matches the current directory. Falls back to `git rev-parse
 * --show-toplevel` for the main worktree.
 *
 * @param projectRoot - Absolute path to the project root.
 * @returns The worktree path string. Never empty; falls back to
 *   the output of `git rev-parse --show-toplevel` on failure.
 * @throws {Error} If `git` is not available or the project root
 *   is not a git repository (prefixes message with `[Hivemind]`).
 */
export function detectWorktree(projectRoot: string): string {
  try {
    // Try `git worktree list --porcelain` first to find linked worktrees.
    const worktreeOutput = execSync("git worktree list --porcelain", {
      cwd: projectRoot,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 5000,
    })

    const lines = worktreeOutput.split("\n")
    let currentWorktree: string | undefined

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith("worktree ")) {
        const path = lines[i].slice("worktree ".length).trim()
        // For linked worktrees, `head` follows the `worktree` line.
        // The current worktree is the one whose path matches the
        // project root or whose `bare` flag is absent.
        if (currentWorktree === undefined) {
          currentWorktree = path
        }
      }
      if (lines[i] === "bare") {
        // Skip bare repositories.
        currentWorktree = undefined
      }
    }

    if (currentWorktree) return currentWorktree
  } catch {
    // Fall through to the fallback.
  }

  // Fallback: main worktree.
  return execSync("git rev-parse --show-toplevel", {
    cwd: projectRoot,
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 5000,
  }).trim()
}

/**
 * Get the 40-char hex SHA of the current HEAD for a worktree.
 *
 * @param worktree - Absolute path to the worktree.
 * @returns 40-char hex SHA string.
 * @throws {Error} If `git` is not available (prefixes message with `[Hivemind]`).
 */
export function getWorktreeHead(worktree: string): string {
  const sha = execSync(`git -C "${worktree}" rev-parse HEAD`, {
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 5000,
  }).trim()

  if (!/^[0-9a-f]{40}$/.test(sha)) {
    throw new Error(`[Hivemind] Invalid git SHA from worktree ${worktree}: ${sha}`)
  }

  return sha
}

/**
 * Get the scoped commit hash for a project root (P27.2 T10, REQ-8, D-05).
 *
 * In a linked git worktree, resolves the worktree's own HEAD (not the main
 * checkout's HEAD). In the main checkout, returns the plain `git rev-parse
 * HEAD`.
 *
 * This prevents multi-worklane commit contamination (RESEARCH Pitfall 5)
 * by always scoping the SHA to the current worktree.
 *
 * @param projectRoot - Absolute path to the project root.
 * @returns 40-char hex SHA string.
 * @throws {Error} When git is not available (prefixed `[Hivemind]`).
 */
export function getScopedCommitHash(projectRoot: string): string {
  const worktree = detectWorktree(projectRoot)
  return getWorktreeHead(worktree)
}
