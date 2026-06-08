import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { join } from "node:path"
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"

import { computeContentHash } from "../../../src/features/doc-intelligence/concurrency.js"
import {
  writeLines,
  writeOffset,
  insertLines,
  insertOffset,
  deleteLines,
  deleteOffset,
} from "../../../src/features/doc-intelligence/index.js"
import { executeDocIntelligenceAction } from "../../../src/features/doc-intelligence/index.js"

/**
 * Line/offset write actions — TDD evidence.
 *
 * Evidence label: `runtime-truthful` — these tests exercise real file reads,
 * real lockedTransform writes, and real on-disk state changes through the
 * public doc-intelligence API surface.
 *
 * Test size: `small` — single unit, public seam, sub-millisecond.
 */

describe("write_lines — replace a range of lines", () => {
  let dir: string
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "doc-wlo-"))
  })
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it("replaces lines 2..3 with new content", async () => {
    writeFileSync(join(dir, "doc.md"), "line1\nline2\nline3\nline4\nline5", "utf-8")
    const result = await writeLines(dir, "doc.md", 2, 3, "REPLACED-A\nREPLACED-B")
    expect(result.hash).toMatch(/^[a-f0-9]{64}$/)
    expect(result.opId).toMatch(/^[a-f0-9]{12}$/)
    const content = readFileSync(join(dir, "doc.md"), "utf-8")
    expect(content).toBe("line1\nREPLACED-A\nREPLACED-B\nline4\nline5")
  })

  it("replaces a single line (startLine == endLine)", async () => {
    writeFileSync(join(dir, "doc.md"), "a\nb\nc", "utf-8")
    await writeLines(dir, "doc.md", 2, 2, "B-NEW")
    expect(readFileSync(join(dir, "doc.md"), "utf-8")).toBe("a\nB-NEW\nc")
  })

  it("replaces with multi-line content that adds lines", async () => {
    writeFileSync(join(dir, "doc.md"), "a\nb\nc", "utf-8")
    await writeLines(dir, "doc.md", 2, 2, "x\ny\nz")
    expect(readFileSync(join(dir, "doc.md"), "utf-8")).toBe("a\nx\ny\nz\nc")
  })

  it("throws when startLine is out of range", async () => {
    writeFileSync(join(dir, "doc.md"), "a\nb\nc", "utf-8")
    await expect(writeLines(dir, "doc.md", 0, 2, "x")).rejects.toThrow(/startLine/)
    await expect(writeLines(dir, "doc.md", 10, 12, "x")).rejects.toThrow(/startLine/)
  })

  it("throws when endLine is out of range", async () => {
    writeFileSync(join(dir, "doc.md"), "a\nb\nc", "utf-8")
    await expect(writeLines(dir, "doc.md", 1, 99, "x")).rejects.toThrow(/endLine/)
  })

  it("rejects on stale expectedHash", async () => {
    writeFileSync(join(dir, "doc.md"), "a\nb\nc", "utf-8")
    const staleHash = computeContentHash("totally different content")
    await expect(writeLines(dir, "doc.md", 1, 2, "x", staleHash)).rejects.toThrow(/[Ss]tale/)
  })

  it("succeeds on matching expectedHash", async () => {
    writeFileSync(join(dir, "doc.md"), "a\nb\nc", "utf-8")
    const currentHash = computeContentHash("a\nb\nc")
    await writeLines(dir, "doc.md", 1, 2, "x", currentHash)
    expect(readFileSync(join(dir, "doc.md"), "utf-8")).toBe("x\nc")
  })

  it("works on .json files", async () => {
    writeFileSync(join(dir, "data.json"), '{\n  "a": 1,\n  "b": 2,\n  "c": 3\n}\n', "utf-8")
    await writeLines(dir, "data.json", 2, 3, '  "x": 99,')
    const parsed = JSON.parse(readFileSync(join(dir, "data.json"), "utf-8"))
    expect(parsed).toEqual({ x: 99, c: 3 })
  })
})

describe("write_offset — replace a character range", () => {
  let dir: string
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "doc-wlo-"))
  })
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it("replaces a 5-character slice at offset 6", async () => {
    writeFileSync(join(dir, "doc.md"), "Hello World Foo Bar", "utf-8")
    await writeOffset(dir, "doc.md", 6, 5, "There")
    expect(readFileSync(join(dir, "doc.md"), "utf-8")).toBe("Hello There Foo Bar")
  })

  it("replaces with longer content (splice-in)", async () => {
    writeFileSync(join(dir, "doc.md"), "abcXYZdef", "utf-8")
    await writeOffset(dir, "doc.md", 3, 3, "LONGER")
    expect(readFileSync(join(dir, "doc.md"), "utf-8")).toBe("abcLONGERdef")
  })

  it("replaces with shorter content (splice-out)", async () => {
    writeFileSync(join(dir, "doc.md"), "abcLONGERdef", "utf-8")
    await writeOffset(dir, "doc.md", 3, 6, "X")
    expect(readFileSync(join(dir, "doc.md"), "utf-8")).toBe("abcXdef")
  })

  it("zero-length replacement at offset (inserts at offset)", async () => {
    writeFileSync(join(dir, "doc.md"), "abcdef", "utf-8")
    await writeOffset(dir, "doc.md", 3, 0, "X")
    expect(readFileSync(join(dir, "doc.md"), "utf-8")).toBe("abcXdef")
  })

  it("throws when offset is out of range", async () => {
    writeFileSync(join(dir, "doc.md"), "abc", "utf-8")
    await expect(writeOffset(dir, "doc.md", -1, 1, "x")).rejects.toThrow(/offset/)
    await expect(writeOffset(dir, "doc.md", 100, 1, "x")).rejects.toThrow(/offset/)
  })

  it("throws when offset+limit is out of range", async () => {
    writeFileSync(join(dir, "doc.md"), "abc", "utf-8")
    await expect(writeOffset(dir, "doc.md", 1, 99, "x")).rejects.toThrow(/offset\+limit/)
  })

  it("rejects on stale expectedHash", async () => {
    writeFileSync(join(dir, "doc.md"), "abc", "utf-8")
    const staleHash = computeContentHash("xxx")
    await expect(writeOffset(dir, "doc.md", 0, 1, "X", staleHash)).rejects.toThrow(/[Ss]tale/)
  })
})

describe("insert_lines — insert lines at line position", () => {
  let dir: string
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "doc-wlo-"))
  })
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it("inserts at line 2 and shifts subsequent content down", async () => {
    writeFileSync(join(dir, "doc.md"), "line1\nline2\nline3", "utf-8")
    await insertLines(dir, "doc.md", 2, "INSERTED")
    expect(readFileSync(join(dir, "doc.md"), "utf-8")).toBe("line1\nINSERTED\nline2\nline3")
  })

  it("inserts multi-line content", async () => {
    writeFileSync(join(dir, "doc.md"), "a\nb\nc", "utf-8")
    await insertLines(dir, "doc.md", 2, "x\ny\nz")
    expect(readFileSync(join(dir, "doc.md"), "utf-8")).toBe("a\nx\ny\nz\nb\nc")
  })

  it("inserts at start (line 1)", async () => {
    writeFileSync(join(dir, "doc.md"), "a\nb", "utf-8")
    await insertLines(dir, "doc.md", 1, "FIRST")
    expect(readFileSync(join(dir, "doc.md"), "utf-8")).toBe("FIRST\na\nb")
  })

  it("appends at end (line == total + 1)", async () => {
    writeFileSync(join(dir, "doc.md"), "a\nb\nc", "utf-8")
    await insertLines(dir, "doc.md", 4, "LAST")
    expect(readFileSync(join(dir, "doc.md"), "utf-8")).toBe("a\nb\nc\nLAST")
  })

  it("throws when startLine is out of range", async () => {
    writeFileSync(join(dir, "doc.md"), "a\nb", "utf-8")
    await expect(insertLines(dir, "doc.md", 0, "x")).rejects.toThrow(/startLine/)
    await expect(insertLines(dir, "doc.md", 99, "x")).rejects.toThrow(/startLine/)
  })
})

describe("insert_offset — insert text at character offset", () => {
  let dir: string
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "doc-wlo-"))
  })
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it("inserts at offset 3 and shifts subsequent content right", async () => {
    writeFileSync(join(dir, "doc.md"), "abcdef", "utf-8")
    await insertOffset(dir, "doc.md", 3, "XYZ")
    expect(readFileSync(join(dir, "doc.md"), "utf-8")).toBe("abcXYZdef")
  })

  it("inserts at start (offset 0)", async () => {
    writeFileSync(join(dir, "doc.md"), "world", "utf-8")
    await insertOffset(dir, "doc.md", 0, "hello ")
    expect(readFileSync(join(dir, "doc.md"), "utf-8")).toBe("hello world")
  })

  it("appends at end (offset == total length)", async () => {
    writeFileSync(join(dir, "doc.md"), "abc", "utf-8")
    await insertOffset(dir, "doc.md", 3, "DEF")
    expect(readFileSync(join(dir, "doc.md"), "utf-8")).toBe("abcDEF")
  })

  it("throws when offset is out of range", async () => {
    writeFileSync(join(dir, "doc.md"), "abc", "utf-8")
    await expect(insertOffset(dir, "doc.md", -1, "x")).rejects.toThrow(/offset/)
    await expect(insertOffset(dir, "doc.md", 99, "x")).rejects.toThrow(/offset/)
  })
})

describe("delete_lines — remove a range of lines", () => {
  let dir: string
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "doc-wlo-"))
  })
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it("deletes lines 2..3", async () => {
    writeFileSync(join(dir, "doc.md"), "a\nb\nc\nd\ne", "utf-8")
    await deleteLines(dir, "doc.md", 2, 3)
    expect(readFileSync(join(dir, "doc.md"), "utf-8")).toBe("a\nd\ne")
  })

  it("deletes a single line (startLine == endLine)", async () => {
    writeFileSync(join(dir, "doc.md"), "a\nb\nc", "utf-8")
    await deleteLines(dir, "doc.md", 2, 2)
    expect(readFileSync(join(dir, "doc.md"), "utf-8")).toBe("a\nc")
  })

  it("throws when startLine is out of range", async () => {
    writeFileSync(join(dir, "doc.md"), "a\nb", "utf-8")
    await expect(deleteLines(dir, "doc.md", 0, 1)).rejects.toThrow(/startLine/)
    await expect(deleteLines(dir, "doc.md", 99, 100)).rejects.toThrow(/startLine/)
  })

  it("throws when endLine < startLine", async () => {
    writeFileSync(join(dir, "doc.md"), "a\nb\nc", "utf-8")
    await expect(deleteLines(dir, "doc.md", 3, 1)).rejects.toThrow(/endLine/)
  })
})

describe("delete_offset — remove a character range", () => {
  let dir: string
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "doc-wlo-"))
  })
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it("deletes 5 characters at offset 6", async () => {
    writeFileSync(join(dir, "doc.md"), "Hello World Foo Bar", "utf-8")
    await deleteOffset(dir, "doc.md", 6, 5)
    expect(readFileSync(join(dir, "doc.md"), "utf-8")).toBe("Hello  Foo Bar")
  })

  it("deletes zero characters (no-op range)", async () => {
    writeFileSync(join(dir, "doc.md"), "abc", "utf-8")
    await deleteOffset(dir, "doc.md", 1, 0)
    expect(readFileSync(join(dir, "doc.md"), "utf-8")).toBe("abc")
  })

  it("throws when offset is out of range", async () => {
    writeFileSync(join(dir, "doc.md"), "abc", "utf-8")
    await expect(deleteOffset(dir, "doc.md", -1, 1)).rejects.toThrow(/offset/)
    await expect(deleteOffset(dir, "doc.md", 100, 1)).rejects.toThrow(/offset/)
  })

  it("throws when offset+limit is out of range", async () => {
    writeFileSync(join(dir, "doc.md"), "abc", "utf-8")
    await expect(deleteOffset(dir, "doc.md", 1, 99)).rejects.toThrow(/offset\+limit/)
  })
})

describe("line/offset write actions — router wiring", () => {
  let dir: string
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "doc-wlo-"))
  })
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it("write_lines action routes through the router", async () => {
    writeFileSync(join(dir, "doc.md"), "a\nb\nc", "utf-8")
    const result = await Promise.resolve(
      executeDocIntelligenceAction(dir, {
        action: "write_lines",
        path: "doc.md",
        startLine: 1,
        endLine: 2,
        content: "x",
      }),
    )
    expect(result.action).toBe("write_lines")
    if (result.action === "write_lines") {
      expect(result.hash).toMatch(/^[a-f0-9]{64}$/)
    }
    expect(readFileSync(join(dir, "doc.md"), "utf-8")).toBe("x\nc")
  })

  it("write_offset action routes through the router", async () => {
    writeFileSync(join(dir, "doc.md"), "abcdef", "utf-8")
    const result = await Promise.resolve(
      executeDocIntelligenceAction(dir, {
        action: "write_offset",
        path: "doc.md",
        offset: 0,
        limit: 3,
        content: "XYZ",
      }),
    )
    expect(result.action).toBe("write_offset")
    expect(readFileSync(join(dir, "doc.md"), "utf-8")).toBe("XYZdef")
  })

  it("insert_lines action routes through the router", async () => {
    writeFileSync(join(dir, "doc.md"), "a\nb", "utf-8")
    const result = await Promise.resolve(
      executeDocIntelligenceAction(dir, {
        action: "insert_lines",
        path: "doc.md",
        startLine: 2,
        content: "INSERTED",
      }),
    )
    expect(result.action).toBe("insert_lines")
    expect(readFileSync(join(dir, "doc.md"), "utf-8")).toBe("a\nINSERTED\nb")
  })

  it("insert_offset action routes through the router", async () => {
    writeFileSync(join(dir, "doc.md"), "abXYcd", "utf-8")
    const result = await Promise.resolve(
      executeDocIntelligenceAction(dir, {
        action: "insert_offset",
        path: "doc.md",
        offset: 2,
        content: "Z",
      }),
    )
    expect(result.action).toBe("insert_offset")
    expect(readFileSync(join(dir, "doc.md"), "utf-8")).toBe("abZXYcd")
  })

  it("delete_lines action routes through the router", async () => {
    writeFileSync(join(dir, "doc.md"), "a\nb\nc\nd", "utf-8")
    const result = await Promise.resolve(
      executeDocIntelligenceAction(dir, {
        action: "delete_lines",
        path: "doc.md",
        startLine: 2,
        endLine: 3,
      }),
    )
    expect(result.action).toBe("delete_lines")
    expect(readFileSync(join(dir, "doc.md"), "utf-8")).toBe("a\nd")
  })

  it("delete_offset action routes through the router", async () => {
    writeFileSync(join(dir, "doc.md"), "abcde", "utf-8")
    const result = await Promise.resolve(
      executeDocIntelligenceAction(dir, {
        action: "delete_offset",
        path: "doc.md",
        offset: 1,
        limit: 2,
      }),
    )
    expect(result.action).toBe("delete_offset")
    expect(readFileSync(join(dir, "doc.md"), "utf-8")).toBe("ade")
  })
})

describe("line/offset write actions — multi-format support", () => {
  let dir: string
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "doc-wlo-"))
  })
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it("works on .yaml", async () => {
    writeFileSync(join(dir, "data.yaml"), "name: test\nversion: 1\nauthor: alice\n", "utf-8")
    await writeLines(dir, "data.yaml", 2, 2, "version: 2")
    const content = readFileSync(join(dir, "data.yaml"), "utf-8")
    expect(content).toContain("version: 2")
    expect(content).not.toContain("version: 1")
  })

  it("works on .xml", async () => {
    writeFileSync(join(dir, "data.xml"), "<root>\n  <a>1</a>\n  <b>2</b>\n</root>\n", "utf-8")
    await insertLines(dir, "data.xml", 3, "  <c>3</c>")
    const content = readFileSync(join(dir, "data.xml"), "utf-8")
    expect(content).toContain("<c>3</c>")
  })
})
