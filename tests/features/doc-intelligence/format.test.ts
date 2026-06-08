import { describe, it, expect } from "vitest"

import { renderInitialContent, validateContentFormat } from "../../../src/features/doc-intelligence/format.js"

describe("format", () => {
  describe("renderInitialContent", () => {
    it("renders Markdown with heading", () => {
      const result = renderInitialContent(".md", "Test Title")
      expect(result).toContain("# Test Title")
    })

    it("renders Markdown with frontmatter when metadata provided", () => {
      const result = renderInitialContent(".md", "Test", { version: "1", author: "Me" })
      expect(result).toContain("---")
      expect(result).toContain("version: 1")
      expect(result).toContain("author: Me")
      expect(result).toContain("# Test")
    })

    it("renders valid JSON", () => {
      const result = renderInitialContent(".json", "Config", { version: "1" })
      const parsed = JSON.parse(result)
      expect(parsed.title).toBe("Config")
      expect(parsed.version).toBe("1")
    })

    it("renders valid YAML", () => {
      const result = renderInitialContent(".yaml", "Config", { version: "1" })
      expect(result).toContain("title: Config")
      expect(result).toContain("version: \"1\"")
    })

    it("renders valid XML", () => {
      const result = renderInitialContent(".xml", "Config", { version: "1" })
      expect(result).toContain('<?xml version="1.0"')
      expect(result).toContain("<title>Config</title>")
      expect(result).toContain("<version>1</version>")
      expect(result).toContain("</document>")
    })
  })

  describe("validateContentFormat", () => {
    it("validates Markdown with heading", () => {
      expect(validateContentFormat(".md", "# Hello")).toBe(true)
      expect(validateContentFormat(".md", "No heading")).toBe(false)
    })

    it("validates JSON", () => {
      expect(validateContentFormat(".json", '{"title":"T"}')).toBe(true)
      expect(validateContentFormat(".json", "invalid json")).toBe(false)
    })

    it("validates YAML", () => {
      expect(validateContentFormat(".yaml", "title: T")).toBe(true)
      expect(validateContentFormat(".yml", "title: T")).toBe(true)
    })

    it("validates XML", () => {
      expect(validateContentFormat(".xml", '<?xml version="1.0"?><doc><title>T</title></doc>')).toBe(true)
    })
  })
})
