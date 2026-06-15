import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import * as YAML from "yaml"
import { XMLParser } from "fast-xml-parser"

import { createHivemindDocTool } from "../../../src/tools/hivemind/hivemind-doc.js"

/**
 * End-to-end integration tests for the 6 new line/offset actions exposed
 * by the `hivemind-doc` tool. Tests run against the real factory
 * (`createHivemindDocTool(projectRoot)`), real temp directories, real file
 * parsers, and real `lockedTransform` — no mocks.
 *
 * Evidence label: `runtime-truthful`. Public seam is the tool's `execute`
 * return value (JSON envelope) and the on-disk file after the call.
 */
describe("hivemind-doc integration: line/offset actions", () => {
  let tmpDir: string
  let tool: ReturnType<typeof createHivemindDocTool>
  const ctx = { sessionID: "test-session" } as never

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "hivemind-doc-int-"))
    tool = createHivemindDocTool(tmpDir)
  })
  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true })
  })

  describe("write_lines", () => {
    it("md", async () => {
      writeFileSync(join(tmpDir, "test.md"), "# Title\n\nLine 1\nLine 2\n")
      const raw = await tool.execute({ action: "write_lines", path: "test.md", startLine: 3, endLine: 3, content: "Replaced" } as never, ctx)
      const result = JSON.parse(raw) as { kind: string; data?: { action: string } }
      expect(result.kind).toBe("success")
      expect(result.data?.action).toBe("write_lines")
      expect(readFileSync(join(tmpDir, "test.md"), "utf-8")).toContain("Replaced")
    })
    it("json", async () => {
      writeFileSync(join(tmpDir, "test.json"), '{\n  "key": "value"\n}\n')
      const raw = await tool.execute({ action: "write_lines", path: "test.json", startLine: 2, endLine: 2, content: '  "key": "replaced"' } as never, ctx)
      const result = JSON.parse(raw) as { kind: string }
      expect(result.kind).toBe("success")
      const parsed = JSON.parse(readFileSync(join(tmpDir, "test.json"), "utf-8")) as { key: string }
      expect(parsed.key).toBe("replaced")
    })
    it("yaml", async () => {
      writeFileSync(join(tmpDir, "test.yaml"), "name: test\n")
      const raw = await tool.execute({ action: "write_lines", path: "test.yaml", startLine: 1, endLine: 1, content: "name: replaced" } as never, ctx)
      const result = JSON.parse(raw) as { kind: string }
      expect(result.kind).toBe("success")
      const parsed = YAML.parse(readFileSync(join(tmpDir, "test.yaml"), "utf-8")) as { name: string }
      expect(parsed.name).toBe("replaced")
    })
    it("xml", async () => {
      writeFileSync(join(tmpDir, "test.xml"), "<?xml version=\"1.0\"?>\n<root>\n  <item>1</item>\n</root>\n")
      const raw = await tool.execute({ action: "write_lines", path: "test.xml", startLine: 3, endLine: 3, content: "  <item>99</item>" } as never, ctx)
      const result = JSON.parse(raw) as { kind: string }
      expect(result.kind).toBe("success")
      const parser = new XMLParser()
      const parsed = parser.parse(readFileSync(join(tmpDir, "test.xml"), "utf-8")) as { root: { item: number } }
      expect(parsed.root.item).toBe(99)
    })
  })

  describe("write_offset", () => {
    it("md", async () => {
      const initial = "# Title\nReplaceable content here.\nMore lines.\n"
      writeFileSync(join(tmpDir, "test.md"), initial)
      const start = initial.indexOf("Replaceable")
      const end = start + "Replaceable".length
      const raw = await tool.execute({ action: "write_offset", path: "test.md", offset: start, limit: end - start, content: "Updated" } as never, ctx)
      const result = JSON.parse(raw) as { kind: string }
      expect(result.kind).toBe("success")
      const after = readFileSync(join(tmpDir, "test.md"), "utf-8")
      expect(after).toContain("Updated content here.")
      expect(after).not.toContain("Replaceable")
    })
    it("json", async () => {
      const initial = '{"name":"test","value":42}\n'
      writeFileSync(join(tmpDir, "test.json"), initial)
      const start = initial.indexOf("test")
      const end = start + "test".length
      const raw = await tool.execute({ action: "write_offset", path: "test.json", offset: start, limit: end - start, content: "replaced" } as never, ctx)
      const result = JSON.parse(raw) as { kind: string }
      expect(result.kind).toBe("success")
      const parsed = JSON.parse(readFileSync(join(tmpDir, "test.json"), "utf-8")) as { name: string; value: number }
      expect(parsed.name).toBe("replaced")
      expect(parsed.value).toBe(42)
    })
    it("yaml", async () => {
      const initial = "name: test\nvalue: 42\n"
      writeFileSync(join(tmpDir, "test.yaml"), initial)
      const start = initial.indexOf("test")
      const end = start + "test".length
      const raw = await tool.execute({ action: "write_offset", path: "test.yaml", offset: start, limit: end - start, content: "replaced" } as never, ctx)
      const result = JSON.parse(raw) as { kind: string }
      expect(result.kind).toBe("success")
      const parsed = YAML.parse(readFileSync(join(tmpDir, "test.yaml"), "utf-8")) as { name: string; value: number }
      expect(parsed.name).toBe("replaced")
      expect(parsed.value).toBe(42)
    })
    it("xml", async () => {
      const initial = '<?xml version="1.0"?><root><name>test</name><v>one</v></root>\n'
      writeFileSync(join(tmpDir, "test.xml"), initial)
      const start = initial.indexOf("test")
      const end = start + "test".length
      const raw = await tool.execute({ action: "write_offset", path: "test.xml", offset: start, limit: end - start, content: "replaced" } as never, ctx)
      const result = JSON.parse(raw) as { kind: string }
      expect(result.kind).toBe("success")
      const parser = new XMLParser()
      const parsed = parser.parse(readFileSync(join(tmpDir, "test.xml"), "utf-8")) as { root: { name: string; v: string } }
      expect(parsed.root.name).toBe("replaced")
      expect(parsed.root.v).toBe("one")
    })
  })

  describe("insert_lines", () => {
    it("md", async () => {
      writeFileSync(join(tmpDir, "test.md"), "# Title\nLine A\nLine B\n")
      const raw = await tool.execute({ action: "insert_lines", path: "test.md", startLine: 2, content: "Inserted" } as never, ctx)
      const result = JSON.parse(raw) as { kind: string }
      expect(result.kind).toBe("success")
      const after = readFileSync(join(tmpDir, "test.md"), "utf-8")
      expect(after).toContain("Inserted\nLine A")
    })
    it("json", async () => {
      writeFileSync(join(tmpDir, "test.json"), '{\n  "items": [1, 2, 3],\n}\n')
      const raw = await tool.execute({ action: "insert_lines", path: "test.json", startLine: 3, content: '  "inserted": true' } as never, ctx)
      const result = JSON.parse(raw) as { kind: string }
      expect(result.kind).toBe("success")
      const parsed = JSON.parse(readFileSync(join(tmpDir, "test.json"), "utf-8")) as { items: number[]; inserted: boolean }
      expect(parsed.inserted).toBe(true)
      expect(parsed.items).toEqual([1, 2, 3])
    })
    it("yaml", async () => {
      writeFileSync(join(tmpDir, "test.yaml"), "items:\n  - 1\n  - 2\n")
      const raw = await tool.execute({ action: "insert_lines", path: "test.yaml", startLine: 1, content: "name: test" } as never, ctx)
      const result = JSON.parse(raw) as { kind: string }
      expect(result.kind).toBe("success")
      const parsed = YAML.parse(readFileSync(join(tmpDir, "test.yaml"), "utf-8")) as { name: string; items: number[] }
      expect(parsed.name).toBe("test")
      expect(parsed.items).toEqual([1, 2])
    })
    it("xml", async () => {
      writeFileSync(join(tmpDir, "test.xml"), "<?xml version=\"1.0\"?>\n<root>\n  <a>first</a>\n  <b>second</b>\n</root>\n")
      // Insert at line 3 (the line containing <a>) so the new <c> child becomes
      // a sibling of <a> and <b> inside <root>.
      const raw = await tool.execute({ action: "insert_lines", path: "test.xml", startLine: 3, content: "  <c>zero</c>" } as never, ctx)
      const result = JSON.parse(raw) as { kind: string }
      expect(result.kind).toBe("success")
      const parser = new XMLParser()
      const parsed = parser.parse(readFileSync(join(tmpDir, "test.xml"), "utf-8")) as { root: { a: string; b: string; c: string } }
      expect(parsed.root.c).toBe("zero")
      expect(parsed.root.a).toBe("first")
      expect(parsed.root.b).toBe("second")
    })
  })

  describe("insert_offset", () => {
    it("md", async () => {
      const initial = "# Title\nBody line.\n"
      writeFileSync(join(tmpDir, "test.md"), initial)
      const offset = initial.indexOf("Body")
      const raw = await tool.execute({ action: "insert_offset", path: "test.md", offset, content: "INSERTED " } as never, ctx)
      const result = JSON.parse(raw) as { kind: string }
      expect(result.kind).toBe("success")
      expect(readFileSync(join(tmpDir, "test.md"), "utf-8")).toContain("INSERTED Body")
    })
    it("json", async () => {
      const initial = '{"name":"test","value":42}\n'
      writeFileSync(join(tmpDir, "test.json"), initial)
      const raw = await tool.execute({ action: "insert_offset", path: "test.json", offset: 1, content: '"extra":true,' } as never, ctx)
      const result = JSON.parse(raw) as { kind: string }
      expect(result.kind).toBe("success")
      const parsed = JSON.parse(readFileSync(join(tmpDir, "test.json"), "utf-8")) as { name: string; value: number; extra: boolean }
      expect(parsed.extra).toBe(true)
      expect(parsed.name).toBe("test")
      expect(parsed.value).toBe(42)
    })
    it("yaml", async () => {
      const initial = "name: test\nvalue: 42\n"
      writeFileSync(join(tmpDir, "test.yaml"), initial)
      const raw = await tool.execute({ action: "insert_offset", path: "test.yaml", offset: initial.length, content: "added: yes\n" } as never, ctx)
      const result = JSON.parse(raw) as { kind: string }
      expect(result.kind).toBe("success")
      const parsed = YAML.parse(readFileSync(join(tmpDir, "test.yaml"), "utf-8")) as { name: string; value: number; added: string }
      expect(parsed.name).toBe("test")
      expect(parsed.value).toBe(42)
      expect(parsed.added).toBe("yes")
    })
    it("xml", async () => {
      const initial = '<?xml version="1.0"?><root><a>first</a></root>\n'
      writeFileSync(join(tmpDir, "test.xml"), initial)
      const offset = initial.indexOf("</a>") + "</a>".length
      const raw = await tool.execute({ action: "insert_offset", path: "test.xml", offset, content: "<b>second</b>" } as never, ctx)
      const result = JSON.parse(raw) as { kind: string }
      expect(result.kind).toBe("success")
      const parser = new XMLParser()
      const parsed = parser.parse(readFileSync(join(tmpDir, "test.xml"), "utf-8")) as { root: { a: string; b: string } }
      expect(parsed.root.a).toBe("first")
      expect(parsed.root.b).toBe("second")
    })
  })

  describe("delete_lines", () => {
    it("md", async () => {
      writeFileSync(join(tmpDir, "test.md"), "# Title\nKEEP\nDELETE-ME\nKEEP2\n")
      const raw = await tool.execute({ action: "delete_lines", path: "test.md", startLine: 3, endLine: 3 } as never, ctx)
      const result = JSON.parse(raw) as { kind: string }
      expect(result.kind).toBe("success")
      const after = readFileSync(join(tmpDir, "test.md"), "utf-8")
      expect(after).not.toContain("DELETE-ME")
      expect(after).toContain("KEEP")
      expect(after).toContain("KEEP2")
    })
    it("json", async () => {
      writeFileSync(join(tmpDir, "test.json"), '{\n  "key1": "v1",\n  "key2": "v2"\n}\n')
      const raw = await tool.execute({ action: "delete_lines", path: "test.json", startLine: 2, endLine: 2 } as never, ctx)
      const result = JSON.parse(raw) as { kind: string }
      expect(result.kind).toBe("success")
      const after = readFileSync(join(tmpDir, "test.json"), "utf-8")
      expect(after).not.toContain("key1")
      expect(after).toContain("key2")
    })
    it("yaml", async () => {
      writeFileSync(join(tmpDir, "test.yaml"), "name: test\nremove: yes\nvalue: 42\n")
      const raw = await tool.execute({ action: "delete_lines", path: "test.yaml", startLine: 2, endLine: 2 } as never, ctx)
      const result = JSON.parse(raw) as { kind: string }
      expect(result.kind).toBe("success")
      const parsed = YAML.parse(readFileSync(join(tmpDir, "test.yaml"), "utf-8")) as { name: string; value: number }
      expect(parsed.name).toBe("test")
      expect(parsed.value).toBe(42)
      expect((parsed as Record<string, unknown>).remove).toBeUndefined()
    })
    it("xml", async () => {
      writeFileSync(join(tmpDir, "test.xml"), "<?xml version=\"1.0\"?>\n<root>\n  <item>1</item>\n  <item>2</item>\n</root>\n")
      const raw = await tool.execute({ action: "delete_lines", path: "test.xml", startLine: 4, endLine: 4 } as never, ctx)
      const result = JSON.parse(raw) as { kind: string }
      expect(result.kind).toBe("success")
      const parser = new XMLParser()
      const parsed = parser.parse(readFileSync(join(tmpDir, "test.xml"), "utf-8")) as { root: { item: number } }
      expect(parsed.root.item).toBe(1)
    })
  })

  describe("delete_offset", () => {
    it("md", async () => {
      const initial = "# Title\nKEEPKEEP\nMore.\n"
      writeFileSync(join(tmpDir, "test.md"), initial)
      const start = initial.indexOf("KEEP")
      const raw = await tool.execute({ action: "delete_offset", path: "test.md", offset: start, limit: 4 } as never, ctx)
      const result = JSON.parse(raw) as { kind: string }
      expect(result.kind).toBe("success")
      const after = readFileSync(join(tmpDir, "test.md"), "utf-8")
      expect(after).toContain("KEEP")
      expect(after).not.toContain("KEEPKEEP")
    })
    it("json", async () => {
      const initial = '{"name":"test","value":42}\n'
      writeFileSync(join(tmpDir, "test.json"), initial)
      // Delete the full `,"value":42` key-value so the remaining JSON is valid.
      const start = initial.indexOf(',"value":42')
      const raw = await tool.execute({ action: "delete_offset", path: "test.json", offset: start, limit: ',"value":42'.length } as never, ctx)
      const result = JSON.parse(raw) as { kind: string }
      expect(result.kind).toBe("success")
      const parsed = JSON.parse(readFileSync(join(tmpDir, "test.json"), "utf-8")) as { name: string }
      expect(parsed.name).toBe("test")
    })
    it("yaml", async () => {
      const initial = "name: test\nremove: yes\nvalue: 42\n"
      writeFileSync(join(tmpDir, "test.yaml"), initial)
      const start = initial.indexOf("remove")
      const raw = await tool.execute({ action: "delete_offset", path: "test.yaml", offset: start, limit: "remove: yes\n".length } as never, ctx)
      const result = JSON.parse(raw) as { kind: string }
      expect(result.kind).toBe("success")
      const parsed = YAML.parse(readFileSync(join(tmpDir, "test.yaml"), "utf-8")) as { name: string; value: number }
      expect(parsed.name).toBe("test")
      expect(parsed.value).toBe(42)
    })
    it("xml", async () => {
      const initial = '<?xml version="1.0"?><root><a>keep</a><b>drop</b></root>\n'
      writeFileSync(join(tmpDir, "test.xml"), initial)
      const start = initial.indexOf("<b>drop</b>")
      const raw = await tool.execute({ action: "delete_offset", path: "test.xml", offset: start, limit: "<b>drop</b>".length } as never, ctx)
      const result = JSON.parse(raw) as { kind: string }
      expect(result.kind).toBe("success")
      const parser = new XMLParser()
      const parsed = parser.parse(readFileSync(join(tmpDir, "test.xml"), "utf-8")) as { root: { a: string; b?: string } }
      expect(parsed.root.a).toBe("keep")
      expect(parsed.root.b).toBeUndefined()
    })
  })

  describe("schema validation", () => {
    it("rejects write_lines without startLine", async () => {
      writeFileSync(join(tmpDir, "test.md"), "x")
      const raw = await tool.execute({ action: "write_lines", path: "test.md", endLine: 1, content: "y" } as never, ctx)
      const result = JSON.parse(raw) as { kind: string; message?: string }
      expect(result.kind).toBe("error")
      expect(result.message ?? "").toMatch(/startLine/i)
    })
    it("rejects write_offset without limit", async () => {
      writeFileSync(join(tmpDir, "test.md"), "x")
      const raw = await tool.execute({ action: "write_offset", path: "test.md", offset: 0, content: "y" } as never, ctx)
      const result = JSON.parse(raw) as { kind: string; message?: string }
      expect(result.kind).toBe("error")
      expect(result.message ?? "").toMatch(/limit/i)
    })
    it("rejects insert_lines without content", async () => {
      writeFileSync(join(tmpDir, "test.md"), "x")
      const raw = await tool.execute({ action: "insert_lines", path: "test.md", startLine: 1 } as never, ctx)
      const result = JSON.parse(raw) as { kind: string; message?: string }
      expect(result.kind).toBe("error")
      expect(result.message ?? "").toMatch(/content/i)
    })
    it("rejects insert_offset without offset", async () => {
      writeFileSync(join(tmpDir, "test.md"), "x")
      const raw = await tool.execute({ action: "insert_offset", path: "test.md", content: "y" } as never, ctx)
      const result = JSON.parse(raw) as { kind: string; message?: string }
      expect(result.kind).toBe("error")
      expect(result.message ?? "").toMatch(/offset/i)
    })
    it("rejects delete_lines without endLine", async () => {
      writeFileSync(join(tmpDir, "test.md"), "x")
      const raw = await tool.execute({ action: "delete_lines", path: "test.md", startLine: 1 } as never, ctx)
      const result = JSON.parse(raw) as { kind: string; message?: string }
      expect(result.kind).toBe("error")
      expect(result.message ?? "").toMatch(/endLine/i)
    })
    it("rejects delete_offset without limit", async () => {
      writeFileSync(join(tmpDir, "test.md"), "x")
      const raw = await tool.execute({ action: "delete_offset", path: "test.md", offset: 0 } as never, ctx)
      const result = JSON.parse(raw) as { kind: string; message?: string }
      expect(result.kind).toBe("error")
      expect(result.message ?? "").toMatch(/limit/i)
    })
  })
})
