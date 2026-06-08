import { describe, it, expect } from "vitest"
import { join } from "node:path"
import { mkdtempSync, writeFileSync, readFileSync, rmSync, existsSync } from "node:fs"
import { tmpdir } from "node:os"

import { generateOpId, computeContentHash, lockedTransformSync } from "../../../src/features/doc-intelligence/concurrency.js"

describe("concurrency", () => {
  describe("generateOpId", () => {
    it("returns a 12-character hex string", () => {
      const id = generateOpId()
      expect(id).toMatch(/^[a-f0-9]{12}$/)
    })

    it("produces unique values", () => {
      const ids = new Set(Array.from({ length: 100 }, () => generateOpId()))
      expect(ids.size).toBe(100)
    })
  })

  describe("computeContentHash", () => {
    it("returns SHA-256 hex digest", () => {
      const hash = computeContentHash("test")
      // Known SHA-256 of "test"
      expect(hash).toBe("9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08")
    })

    it("produces different hashes for different content", () => {
      const hash1 = computeContentHash("hello")
      const hash2 = computeContentHash("world")
      expect(hash1).not.toBe(hash2)
    })
  })

  describe("lockedTransformSync", () => {
    it("writes content and returns changed=true", () => {
      const dir = mkdtempSync(join(tmpdir(), "doc-lock-"))
      const filePath = join(dir, "test.md")
      writeFileSync(filePath, "original", "utf-8")

      const result = lockedTransformSync(filePath, () => "modified content that is longer")
      expect(result.changed).toBe(true)
      expect(result.hash).toMatch(/^[a-f0-9]{64}$/)
      expect(result.opId).toMatch(/^[a-f0-9]{12}$/)
      expect(result.bytesChanged).toBeGreaterThan(0)
      expect(readFileSync(filePath, "utf-8")).toBe("modified content that is longer")

      rmSync(dir, { recursive: true, force: true })
    })

    it("returns changed=false when content unchanged", () => {
      const dir = mkdtempSync(join(tmpdir(), "doc-lock-"))
      const filePath = join(dir, "test.md")
      writeFileSync(filePath, "same", "utf-8")

      const result = lockedTransformSync(filePath, (content) => content)
      expect(result.changed).toBe(false)
      expect(result.bytesChanged).toBe(0)

      rmSync(dir, { recursive: true, force: true })
    })

    it("throws on stale-file hash mismatch", () => {
      const dir = mkdtempSync(join(tmpdir(), "doc-lock-"))
      const filePath = join(dir, "test.md")
      writeFileSync(filePath, "content", "utf-8")

      expect(() => {
        lockedTransformSync(filePath, (c) => c + "more", { expectedHash: "wronghash" })
      }).toThrow(/hash mismatch/)

      rmSync(dir, { recursive: true, force: true })
    })
  })
})
