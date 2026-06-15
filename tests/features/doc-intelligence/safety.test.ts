import { describe, it, expect } from "vitest"
import { join } from "node:path"
import { mkdtempSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"

import { assertWritableExtension, assertGovernanceWriteAllowed, checkChunkThreshold, assertFileSizeWithinLimit, WRITABLE_EXTENSIONS, GOVERNANCE_WRITE_DENYLIST } from "../../../src/features/doc-intelligence/safety.js"

function createTempFile(name: string, content: string): string {
  const dir = mkdtempSync(join(tmpdir(), "doc-safety-"))
  const filePath = join(dir, name)
  writeFileSync(filePath, content, "utf-8")
  return filePath
}

describe("safety", () => {
  describe("assertWritableExtension", () => {
    it("accepts .md files", () => {
      expect(() => assertWritableExtension("/test/file.md")).not.toThrow()
    })

    it("rejects .ts files", () => {
      expect(() => assertWritableExtension("/test/file.ts")).toThrow(/not writable/)
    })

    it("rejects .py files", () => {
      expect(() => assertWritableExtension("/test/file.py")).toThrow(/not writable/)
    })
  })

  describe("assertGovernanceWriteAllowed", () => {
    it("blocks .hivemind/** paths", () => {
      expect(() => assertGovernanceWriteAllowed("/repo/.hivemind/state/config.json", "/repo")).toThrow(/denylist/)
    })

    it("blocks .opencode/** paths", () => {
      expect(() => assertGovernanceWriteAllowed("/repo/.opencode/agents/hm-agent.md", "/repo")).toThrow(/denylist/)
    })

    it("allows non-denylisted paths", () => {
      expect(() => assertGovernanceWriteAllowed("/repo/docs/test.md", "/repo")).not.toThrow()
    })

    it("allows governance paths when allowGovernance is true", () => {
      expect(() => assertGovernanceWriteAllowed("/repo/.hivemind/state/config.json", "/repo", true)).not.toThrow()
    })

    it("has correct denylist entries", () => {
      expect(GOVERNANCE_WRITE_DENYLIST).toContain(".hivemind/**")
      expect(GOVERNANCE_WRITE_DENYLIST).toContain("AGENTS.md")
    })
  })

  describe("checkChunkThreshold", () => {
    it("returns null for small files", () => {
      const filePath = createTempFile("small.md", "line1\nline2\nline3\n")
      const result = checkChunkThreshold(filePath)
      expect(result).toBeNull()
    })

    it("returns signal for files over 600 lines", () => {
      const lines = Array.from({ length: 700 }, (_, i) => `line ${i + 1}`)
      const content = lines.join("\n")
      const filePath = createTempFile("large.md", content)
      const result = checkChunkThreshold(filePath)
      expect(result).not.toBeNull()
      if (result) {
        expect(result.status).toBe("chunk_required")
        expect(result.lineCount).toBeGreaterThan(600)
        expect(result.threshold).toBe(600)
      }
    })

    it("returns null for non-existent files", () => {
      expect(checkChunkThreshold("/nonexistent/file.md")).toBeNull()
    })
  })

  describe("assertFileSizeWithinLimit", () => {
    it("accepts files within limit", () => {
      const filePath = createTempFile("small.md", "hello")
      expect(() => assertFileSizeWithinLimit(filePath)).not.toThrow()
    })

    it("throws for non-existent files (skips check)", () => {
      expect(() => assertFileSizeWithinLimit("/nonexistent/file.md")).not.toThrow()
    })
  })

  describe("WRITABLE_EXTENSIONS", () => {
    it("includes expected extensions", () => {
      expect(WRITABLE_EXTENSIONS.has(".md")).toBe(true)
      expect(WRITABLE_EXTENSIONS.has(".json")).toBe(true)
      expect(WRITABLE_EXTENSIONS.has(".yaml")).toBe(true)
      expect(WRITABLE_EXTENSIONS.has(".yml")).toBe(true)
      expect(WRITABLE_EXTENSIONS.has(".xml")).toBe(true)
    })
  })
})
