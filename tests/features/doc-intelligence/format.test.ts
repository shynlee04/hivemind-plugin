import { describe, it, expect } from "vitest"
import { XMLParser } from "fast-xml-parser"

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

    // ─── 61.2.1 GAP-B — REQ-FORMAT-06 (fast-xml-parser in source) ──────
    // The runtime `isWellFormedXml` in format.ts used a regex heuristic
    // (line 132 pre-fix). The regex accepts ANY content that starts with
    // `<?xml` or `<` and ends with `>`, with a matching `</root>` suffix —
    // meaning a payload with TWO root elements (regex: matches the LAST
    // closing root, parser strict: invalid) silently passes the runtime
    // gate. These tests are the regression guard for migrating to
    // fast-xml-parser at the runtime gate (was previously test-only per
    // 61.2-VERIFICATION §2.1 REQ-FORMAT-06).

    it("isWellFormedXml uses real parser for valid XML (parses without throwing)", () => {
      // Sanity: the same XML must parse cleanly via the real XMLParser
      // (proves the test fixture is genuinely well-formed, not a regex-soft case).
      const fixture = '<?xml version="1.0" encoding="UTF-8"?><document><title>OK</title></document>'
      const parser = new XMLParser()
      const parsed = parser.parse(fixture)
      expect(parsed.document.title).toBe("OK")
      // And the runtime validator agrees.
      expect(validateContentFormat(".xml", fixture)).toBe(true)
    })

    it("isWellFormedXml returns false for malformed XML using real parser", () => {
      // Malformed: TWO root elements. The pre-fix regex heuristic is fooled:
      //   - Starts with "<?xml" ✓
      //   - Ends with ">" ✓
      //   - Has matching "</doc>" at end ✓
      // So the regex returns true. A real (strict) XML parser rejects
      // multiple root elements. After the fast-xml-parser migration, the
      // runtime validator must return false.
      const malformed = '<?xml version="1.0"?><doc></doc><doc></doc>'
      expect(validateContentFormat(".xml", malformed)).toBe(false)
    })
  })
})
