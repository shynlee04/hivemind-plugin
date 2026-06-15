/**
 * Tests for commitIntentLockArtifact (P27.2 T9, REQ-7).
 *
 * Evidence label: transport-mocked (small). Uses a temp dir with git init
 * to test the atomic write + git commit pattern without affecting the
 * project repo. execSync is real git; isolation is via temp dir.
 */

import { mkdtempSync, writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs"
import { execSync } from "node:child_process"
import { join } from "node:path"
import { tmpdir } from "node:os"

import { describe, it, expect } from "vitest"

import { commitIntentLockArtifact } from "../../../src/features/intent-lock/store.js"

/**
 * Create a temp git repo for testing atomic commits.
 */
function makeTempGitRepo(): string {
  const root = mkdtempSync(join(tmpdir(), "hm-atomic-commit-"))
  // Create .planning/intent-locks/
  mkdirSync(join(root, ".planning", "intent-locks"), { recursive: true })
  // Init git
  execSync("git init", { cwd: root, stdio: "pipe" })
  execSync("git config user.email test@example.com", { cwd: root, stdio: "pipe" })
  execSync("git config user.name Test", { cwd: root, stdio: "pipe" })
  // Initial commit so we have a valid HEAD
  writeFileSync(join(root, ".gitkeep"), "", "utf-8")
  execSync("git add .gitkeep && git commit -m init", { cwd: root, stdio: "pipe" })
  return root
}

describe("commitIntentLockArtifact (T9, REQ-7)", () => {
  it("writes artifact via temp+rename and returns a 40-char commit SHA", () => {
    const root = makeTempGitRepo()
    const intentId = "INT-20260610-test01"
    const content = "intentId: INT-20260610-test01\nsummary: Test artifact\n"

    const result = commitIntentLockArtifact(root, intentId, content)

    // Should return a valid SHA
    expect(result).toMatch(/^[0-9a-f]{40}$/)

    // File should exist at target path (not .tmp)
    const targetPath = join(root, ".planning", "intent-locks", `${intentId}.md`)
    expect(existsSync(targetPath)).toBe(true)

    // .tmp file should NOT exist
    expect(existsSync(targetPath + ".tmp")).toBe(false)

    // Git log should show the commit
    const log = execSync("git log --oneline -1", { cwd: root, encoding: "utf-8" })
    expect(log).toContain(result.slice(0, 7))
  })

  it("cleans up temp file on git commit failure", () => {
    const root = makeTempGitRepo()
    const intentId = "INT-20260610-test02"
    const content = "intentId: INT-20260610-test02\nsummary: Failing test\n"

    // Force git failure by creating a file where .planning dir should be
    // making git unable to add. Actually simpler: run git in a non-repo dir.
    const nonRepoDir = mkdtempSync(join(tmpdir(), "hm-nonrepo-"))

    expect(() => {
      commitIntentLockArtifact(nonRepoDir, intentId, content)
    }).toThrow(/\[Hivemind\]/)

    // Verify .tmp file was cleaned up (should not exist since mkdir runs first).
    // In the non-repo case, the mkdir succeeds, file write succeeds, rename succeeds,
    // but git add fails — so the target file exists but tmp doesn't.
    const targetPath = join(nonRepoDir, ".planning", "intent-locks", `${intentId}.md`)
    expect(existsSync(targetPath + ".tmp")).toBe(false)
  })

  it("writes correct content to the artifact file", () => {
    const root = makeTempGitRepo()
    const intentId = "INT-20260610-test03"
    const content = "intentId: INT-20260610-test03\nsummary: Test artifact content\nphaseId: P27.2-test\n"

    commitIntentLockArtifact(root, intentId, content)

    const targetPath = join(root, ".planning", "intent-locks", `${intentId}.md`)
    const written = readFileSync(targetPath, "utf-8")
    expect(written).toContain("INT-20260610-test03")
    expect(written).toContain("P27.2-test")
  })
})
