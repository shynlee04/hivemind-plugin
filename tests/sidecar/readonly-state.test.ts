import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { afterEach, beforeEach, describe, expect, it } from "vitest"

import {
  isCanonicalStatePath,
  readCanonicalState,
  refuseCanonicalWrite,
} from "../../src/sidecar/readonly-state.js"

let projectRoot = ""

beforeEach(() => {
  projectRoot = mkdtempSync(join(tmpdir(), "sidecar-readonly-"))
  mkdirSync(join(projectRoot, ".hivemind", "state"), { recursive: true })
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

    it("throws [Harness] error when reading outside canonical state", () => {
      const target = join(projectRoot, "src", "plugin.ts")
      writeFileSync(target, "// not state", "utf8")
      expect(() => readCanonicalState(target, { projectRoot })).toThrow(
        /^\[Harness\] sidecar SIDECAR-03: read denied/,
      )
    })

    it("throws [Harness] error for traversal-escape paths", () => {
      const target = join(projectRoot, "..", "outside.txt")
      expect(() => readCanonicalState(target, { projectRoot })).toThrow(
        /^\[Harness\] sidecar SIDECAR-03: read denied/,
      )
    })
  })

  describe("refuseCanonicalWrite", () => {
    it("always throws [Harness] SIDECAR-03 — even for canonical state paths", () => {
      const target = join(projectRoot, ".hivemind", "state", "delegations.json")
      expect(() => refuseCanonicalWrite(target, { projectRoot })).toThrow(
        /^\[Harness\] sidecar SIDECAR-03: write to canonical state forbidden/,
      )
    })

    it("throws regardless of whether the path is canonical or not", () => {
      const target = join(projectRoot, "src", "plugin.ts")
      expect(() => refuseCanonicalWrite(target, { projectRoot })).toThrow(
        /^\[Harness\] sidecar SIDECAR-03/,
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
})
