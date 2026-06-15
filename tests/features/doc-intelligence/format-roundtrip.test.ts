import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import * as YAML from "yaml"
import { XMLParser, XMLBuilder } from "fast-xml-parser"
import { writeLines, writeOffset, insertLines, deleteLines } from "../../../src/features/doc-intelligence/line-offset-ops.js"

describe("format-roundtrip", () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "format-roundtrip-"))
  })
  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true })
  })

  describe("writeLines", () => {
    it("preserves JSON parseability", async () => {
      const path = "test.json"
      const content = `{\n  "name": "test",\n  "items": [1, 2, 3]\n}\n`
      writeFileSync(join(tmpDir, path), content)

      // Replace line 3 (the items array) with a new array
      await writeLines(tmpDir, path, 3, 3, '  "items": [4, 5, 6]')

      const result = readFileSync(join(tmpDir, path), "utf-8")
      const parsed = JSON.parse(result)
      expect(parsed.name).toBe("test")
      expect(parsed.items).toEqual([4, 5, 6])
    })

    it("preserves YAML parseability", async () => {
      const path = "test.yaml"
      const content = `name: test\nitems:\n  - 1\n  - 2\n  - 3\n`
      writeFileSync(join(tmpDir, path), content)

      // Replace the last item with two new items
      await writeLines(tmpDir, path, 5, 5, "  - 4\n  - 5")

      const result = readFileSync(join(tmpDir, path), "utf-8")
      const parsed = YAML.parse(result)
      expect(parsed.name).toBe("test")
      expect(parsed.items).toEqual([1, 2, 4, 5])
    })

    it("preserves XML well-formedness", async () => {
      const path = "test.xml"
      const content = `<?xml version="1.0"?>\n<root>\n  <item>1</item>\n  <item>2</item>\n</root>\n`
      writeFileSync(join(tmpDir, path), content)

      await writeLines(tmpDir, path, 3, 3, "  <item>99</item>")

      const result = readFileSync(join(tmpDir, path), "utf-8")
      const parser = new XMLParser()
      const parsed = parser.parse(result)
      expect(parsed.root.item).toContain(99)
    })
  })

  describe("writeOffset", () => {
    it("preserves JSON parseability", async () => {
      const path = "test.json"
      const content = `{"name":"test","value":42}\n`
      writeFileSync(join(tmpDir, path), content)

      // Replace "test" with "replaced"
      const start = content.indexOf('"test"')
      const end = start + '"test"'.length
      await writeOffset(tmpDir, path, start, end - start, '"replaced"')

      const result = readFileSync(join(tmpDir, path), "utf-8")
      const parsed = JSON.parse(result)
      expect(parsed.name).toBe("replaced")
      expect(parsed.value).toBe(42)
    })

    it("preserves YAML parseability", async () => {
      const path = "test.yaml"
      const content = "name: test\nvalue: 42\n"
      writeFileSync(join(tmpDir, path), content)

      const start = content.indexOf("test")
      const end = start + "test".length
      await writeOffset(tmpDir, path, start, end - start, "replaced")

      const result = readFileSync(join(tmpDir, path), "utf-8")
      const parsed = YAML.parse(result)
      expect(parsed.name).toBe("replaced")
    })

    it("preserves XML well-formedness", async () => {
      const path = "test.xml"
      const content = `<?xml version="1.0"?><root><name>test</name></root>\n`
      writeFileSync(join(tmpDir, path), content)

      const start = content.indexOf("test")
      const end = start + "test".length
      await writeOffset(tmpDir, path, start, end - start, "replaced")

      const result = readFileSync(join(tmpDir, path), "utf-8")
      const parser = new XMLParser()
      const parsed = parser.parse(result)
      expect(parsed.root.name).toBe("replaced")
    })
  })

  describe("insertLines", () => {
    it("preserves JSON parseability", async () => {
      const path = "test.json"
      const content = `{\n  "items": [1, 2, 3],\n}\n`
      writeFileSync(join(tmpDir, path), content)

      // Insert a property before the closing brace (line 3)
      await insertLines(tmpDir, path, 3, '  "inserted": true\n')

      const result = readFileSync(join(tmpDir, path), "utf-8")
      const parsed = JSON.parse(result)
      expect(parsed.inserted).toBe(true)
      expect(parsed.items).toEqual([1, 2, 3])
    })

    it("preserves YAML parseability", async () => {
      const path = "test.yaml"
      const content = "items:\n  - 1\n  - 2\n"
      writeFileSync(join(tmpDir, path), content)

      // Insert at line 1
      await insertLines(tmpDir, path, 1, "name: test\n")

      const result = readFileSync(join(tmpDir, path), "utf-8")
      const parsed = YAML.parse(result)
      expect(parsed.name).toBe("test")
      expect(parsed.items).toEqual([1, 2])
    })
  })

  describe("deleteLines", () => {
    it("preserves JSON parseability", async () => {
      const path = "test.json"
      const content = `{\n  "key1": "value1",\n  "key2": "value2"\n}\n`
      writeFileSync(join(tmpDir, path), content)

      await deleteLines(tmpDir, path, 2, 2)

      const result = readFileSync(join(tmpDir, path), "utf-8")
      const parsed = JSON.parse(result)
      expect(parsed.key1).toBeUndefined()
      expect(parsed.key2).toBe("value2")
    })
  })
})
