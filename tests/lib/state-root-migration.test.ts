import { execSync } from "node:child_process"
import { dirname, resolve } from "node:path"
import { readFileSync } from "node:fs"

import { describe, it, expect } from "vitest"

import {
  getCanonicalStateDir,
  getLegacyStateDir,
  getContinuityStoragePath,
} from "../../src/task-management/continuity/index.js"
import { getDelegationsFilePath } from "../../src/task-management/continuity/delegation-persistence.js"

const PROJECT_ROOT = process.cwd()

/**
 * Q6 State Root Migration verification tests.
 *
 * Validates that all state writers target `.hivemind/` exclusively,
 * no `.opencode/state/` write paths remain in source, and gitignore
 * rules are in place for runtime state directories.
 */
describe("Q6 State Root Migration", () => {
  describe("HIVEMIND-ROOT-01: canonical state paths", () => {
    it("continuity store targets .hivemind/state/ as canonical path", () => {
      const canonicalDir = getCanonicalStateDir()
      expect(canonicalDir).toContain(".hivemind")
      expect(canonicalDir).toContain("state")
      expect(canonicalDir).not.toContain(".opencode")
    })

    it("continuity storage path resolves to canonical .hivemind/state/", () => {
      const storagePath = getContinuityStoragePath()
      expect(storagePath).toContain(".hivemind")
      expect(storagePath).toContain("state")
      expect(storagePath).toContain("session-continuity.json")
      expect(storagePath).not.toContain(".opencode")
    })

    it("delegation persistence writes to .hivemind/state/", () => {
      const delegationsPath = getDelegationsFilePath()
      const continuityPath = getContinuityStoragePath()

      // Delegation file should be in same directory as continuity file
      expect(delegationsPath).toContain(".hivemind")
      expect(delegationsPath).toContain("state")
      expect(delegationsPath).toContain("delegations.json")
      expect(delegationsPath).not.toContain(".opencode")

      // Both should share the same parent directory
      expect(dirname(delegationsPath)).toBe(dirname(continuityPath))
    })
  })

  describe("HIVEMIND-ROOT-02: backward compatibility bridge", () => {
    it("legacy path constant exists for read-only compatibility", () => {
      const legacyDir = getLegacyStateDir()
      expect(legacyDir).toContain(".opencode")
      expect(legacyDir).toContain("hivemind")

      // Canonical path must be different from legacy
      const canonicalDir = getCanonicalStateDir()
      expect(canonicalDir).not.toBe(legacyDir)
    })

    it("source files only reference .opencode/state in backward-compat constants", () => {
      // grep for any .opencode state reference in src/ .ts files
      const result = execSync(
        'grep -rn "\\.opencode.*state" src/ --include="*.ts" || true',
        { encoding: "utf-8", cwd: PROJECT_ROOT },
      ).trim()

      if (!result) return // No references at all — clean

      // Allow only the explicit backward-compat constant declarations
      // in continuity.ts (CANONICAL_STATE_DIR/LEGACY_STATE_DIR)
      const lines = result.split("\n")
      for (const line of lines) {
        // Allow: const LEGACY_STATE_DIR = resolve(..., ".opencode", "state", "hivemind")
        // Allow: references to LEGACY_STATE_DIR constant
        const isLegacyConstantDef = line.includes("LEGACY_STATE_DIR") && line.includes("resolve")
        const isLegacyConstantRef = line.includes("LEGACY_STATE_DIR") || line.includes("resolveLegacyFilePath")

        if (!isLegacyConstantDef && !isLegacyConstantRef) {
          // Any other reference to .opencode/state is a violation
          expect.fail(`Unexpected .opencode/state reference: ${line}`)
        }
      }
    })
  })

  describe("HIVEMIND-ROOT-03: gitignore rules for runtime state", () => {
    it(".hivemind/state/ is in .gitignore", () => {
      const gitignore = readFileSync(resolve(PROJECT_ROOT, ".gitignore"), "utf-8")
      expect(gitignore).toContain(".hivemind/state/")
    })

    it(".hivemind/journal/ artifacts are in .gitignore", () => {
      const gitignore = readFileSync(resolve(PROJECT_ROOT, ".gitignore"), "utf-8")
      expect(gitignore).toContain(".hivemind/journal")
    })
  })
})
