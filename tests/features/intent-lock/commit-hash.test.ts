/**
 * Tests for getScopedCommitHash (P27.2 T10, REQ-8, D-05).
 *
 * Evidence label: transport-mocked (small). Uses a temp git repo to verify
 * SHA resolution without affecting the project repo.
 */

import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs"
import { execSync } from "node:child_process"
import { join } from "node:path"
import { tmpdir } from "node:os"

import { describe, it, expect } from "vitest"

import { getScopedCommitHash } from "../../../src/features/intent-lock/worktree.js"

/**
 * Create a temp git repo with a single commit, returning { root, headSha }.
 */
function makeTempRepo(): { root: string; headSha: string } {
  const root = mkdtempSync(join(tmpdir(), "hm-commit-hash-"))
  mkdirSync(join(root, "subdir"), { recursive: true })

  execSync("git init", { cwd: root, stdio: "pipe" })
  execSync("git config user.email test@example.com", { cwd: root, stdio: "pipe" })
  execSync("git config user.name Test", { cwd: root, stdio: "pipe" })

  writeFileSync(join(root, "README.md"), "# Test\n", "utf-8")
  execSync("git add README.md && git commit -m 'init'", { cwd: root, stdio: "pipe" })

  const sha = execSync("git rev-parse HEAD", { cwd: root, encoding: "utf-8" }).trim()
  return { root, headSha: sha }
}

describe("getScopedCommitHash (T10, REQ-8)", () => {
  it("returns a 40-char hex string in a main checkout", () => {
    const { root, headSha } = makeTempRepo()
    const result = getScopedCommitHash(root)

    expect(result).toMatch(/^[0-9a-f]{40}$/)
    expect(result).toBe(headSha)
  })

  it("matches the output of git rev-parse HEAD", () => {
    const { root } = makeTempRepo()
    const result = getScopedCommitHash(root)

    const expected = execSync("git rev-parse HEAD", { cwd: root, encoding: "utf-8" }).trim()
    expect(result).toBe(expected)
  })
})
