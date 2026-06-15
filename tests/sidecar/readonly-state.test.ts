import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { afterEach, beforeEach, describe, expect, it } from "vitest"

import {
  isCanonicalStatePath,
  readCanonicalState,
  refuseCanonicalWrite,
} from "../../src/sidecar/readonly-state.js"

import {
  CANONICAL_PREFIXES,
  listCanonicalDirectory,
  createReadOnlyStateOptions,
} from "../../src/sidecar/readonly-state-extensions.js"

let projectRoot = ""

beforeEach(() => {
  projectRoot = mkdtempSync(join(tmpdir(), "sidecar-readonly-"))
  mkdirSync(join(projectRoot, ".hivemind", "state"), { recursive: true })
  mkdirSync(join(projectRoot, ".hivemind", "session-tracker"), { recursive: true })
  mkdirSync(join(projectRoot, ".opencode"), { recursive: true })
  mkdirSync(join(projectRoot, ".planning"), { recursive: true })
  mkdirSync(join(projectRoot, "src"), { recursive: true })
})

afterEach(() => {
  if (projectRoot) {
    rmSync(projectRoot, { recursive: true, force: true })
  }
})

describe("sidecar readonly-state — SIDECAR-03 enforcement", () => {
  describe("isCanonicalStatePath", () => {
    it("recognizes paths under .hivemind/state/", () => {
      const target = join(projectRoot, ".hivemind", "state", "delegations.json")
      expect(isCanonicalStatePath(target, { projectRoot })).toBe(true)
    })

    it("recognizes paths under .planning/", () => {
      const target = join(projectRoot, ".planning", "ROADMAP.md")
      expect(isCanonicalStatePath(target, { projectRoot })).toBe(true)
    })

    it("rejects paths under src/ (not canonical state)", () => {
      const target = join(projectRoot, "src", "plugin.ts")
      expect(isCanonicalStatePath(target, { projectRoot })).toBe(false)
    })

    it("rejects paths that escape the project root via traversal", () => {
      const target = join(projectRoot, "..", "outside.txt")
      expect(isCanonicalStatePath(target, { projectRoot })).toBe(false)
    })

    it("rejects absolute paths outside the project root", () => {
      const outsideRoot = mkdtempSync(join(tmpdir(), "outside-"))
      try {
        mkdirSync(join(outsideRoot, ".hivemind", "state"), { recursive: true })
        const target = join(outsideRoot, ".hivemind", "state", "fake.json")
        expect(isCanonicalStatePath(target, { projectRoot })).toBe(false)
      } finally {
        rmSync(outsideRoot, { recursive: true, force: true })
      }
    })
  })

  describe("readCanonicalState", () => {
    it("reads files under canonical state surfaces", () => {
      const target = join(projectRoot, ".hivemind", "state", "delegations.json")
      writeFileSync(target, '{"delegations":[]}', "utf8")
      expect(readCanonicalState(target, { projectRoot })).toBe('{"delegations":[]}')
    })

    it("throws [Hivemind] error when reading outside canonical state", () => {
      const target = join(projectRoot, "src", "plugin.ts")
      writeFileSync(target, "// not state", "utf8")
      expect(() => readCanonicalState(target, { projectRoot })).toThrow(
        /^\[Hivemind\] sidecar SIDECAR-03: read denied/,
      )
    })

    it("throws [Hivemind] error for traversal-escape paths", () => {
      const target = join(projectRoot, "..", "outside.txt")
      expect(() => readCanonicalState(target, { projectRoot })).toThrow(
        /^\[Hivemind\] sidecar SIDECAR-03: read denied/,
      )
    })
  })

  describe("refuseCanonicalWrite", () => {
    it("always throws [Hivemind] SIDECAR-03 — even for canonical state paths", () => {
      const target = join(projectRoot, ".hivemind", "state", "delegations.json")
      expect(() => refuseCanonicalWrite(target, { projectRoot })).toThrow(
        /^\[Hivemind\] sidecar SIDECAR-03: write to canonical state forbidden/,
      )
    })

    it("throws regardless of whether the path is canonical or not", () => {
      const target = join(projectRoot, "src", "plugin.ts")
      expect(() => refuseCanonicalWrite(target, { projectRoot })).toThrow(
        /^\[Hivemind\] sidecar SIDECAR-03/,
      )
    })

    it("never returns — typed as `never`", () => {
      const target = join(projectRoot, ".planning", "ROADMAP.md")
      let returned = false
      try {
        refuseCanonicalWrite(target, { projectRoot })
        returned = true
      } catch {
        returned = false
      }
      expect(returned).toBe(false)
    })
  })

  describe("extended CANONICAL_PREFIXES", () => {
    it("has exactly 4 prefixes", () => {
      expect(CANONICAL_PREFIXES).toHaveLength(4)
    })

    it("includes .hivemind/session-tracker", () => {
      expect(CANONICAL_PREFIXES).toContain(".hivemind/session-tracker")
    })

    it("includes .opencode", () => {
      expect(CANONICAL_PREFIXES).toContain(".opencode")
    })

    it("still includes .hivemind/state and .planning", () => {
      expect(CANONICAL_PREFIXES).toContain(".hivemind/state")
      expect(CANONICAL_PREFIXES).toContain(".planning")
    })

    it("isCanonicalStatePath returns true for all 4 prefixes", () => {
      const opts = { projectRoot }
      expect(isCanonicalStatePath(join(projectRoot, ".hivemind", "state", "x.json"), opts)).toBe(true)
      expect(isCanonicalStatePath(join(projectRoot, ".hivemind", "session-tracker", "y.json"), opts)).toBe(true)
      expect(isCanonicalStatePath(join(projectRoot, ".opencode", "z.json"), opts)).toBe(true)
      expect(isCanonicalStatePath(join(projectRoot, ".planning", "w.md"), opts)).toBe(true)
    })
  })

  describe("listCanonicalDirectory", () => {
    it("returns DirectoryEntry[] for canonical dirs", () => {
      const opts = { projectRoot }
      writeFileSync(join(projectRoot, ".planning", "STATE.md"), "state content", "utf8")
      const entries = listCanonicalDirectory(join(projectRoot, ".planning"), opts)
      expect(entries.length).toBeGreaterThan(0)
      const stateEntry = entries.find((e) => e.name === "STATE.md")
      expect(stateEntry).toBeDefined()
      expect(stateEntry!.type).toBe("file")
      expect(stateEntry!.size).toBeGreaterThan(0)
      expect(stateEntry!.mtime).toBeGreaterThan(0)
    })

    it("returns empty array for non-canonical paths", () => {
      const entries = listCanonicalDirectory(join(projectRoot, "src"), {
        projectRoot,
      })
      expect(entries).toEqual([])
    })

    it("returns empty array for nonexistent paths", () => {
      const entries = listCanonicalDirectory(
        join(projectRoot, ".hivemind", "session-tracker", "nonexistent"),
        { projectRoot },
      )
      expect(entries).toEqual([])
    })
  })
})
