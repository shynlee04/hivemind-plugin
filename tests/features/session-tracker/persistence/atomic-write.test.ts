/**
 * Tests for atomic write helpers.
 *
 * Verifies crash-safe atomic write operations using write-to-temp + fs.rename().
 * Uses a real temporary directory for filesystem operations.
 */

import { mkdtempSync, readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import {
  atomicWriteJson,
  atomicAppendMarkdown,
  ensureDirectory,
  sanitizeSessionID,
  safeSessionPath,
} from "../../../../src/features/session-tracker/persistence/atomic-write.js"

let tmpDir: string

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "st-atomic-write-"))
})

afterEach(() => {
  // Clean up temp directory
  const fs = require("node:fs")
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

// ---------------------------------------------------------------------------
// atomicWriteJson tests
// ---------------------------------------------------------------------------

describe("atomicWriteJson", () => {
  it("creates a file with correct JSON content", async () => {
    const filePath = join(tmpDir, "test.json")
    const data = { foo: "bar", count: 42, nested: { deep: true } }

    await atomicWriteJson(filePath, data)

    const raw = readFileSync(filePath, "utf-8")
    const parsed = JSON.parse(raw)
    expect(parsed).toEqual(data)
  })

  it("writes JSON with 2-space indentation", async () => {
    const filePath = join(tmpDir, "test.json")
    await atomicWriteJson(filePath, { key: "value" })

    const raw = readFileSync(filePath, "utf-8")
    expect(raw).toContain('  "key"')
  })

  it("overwrites existing file atomically", async () => {
    const filePath = join(tmpDir, "test.json")
    const initial = { version: 1 }
    const updated = { version: 2 }

    await atomicWriteJson(filePath, initial)
    expect(JSON.parse(readFileSync(filePath, "utf-8"))).toEqual(initial)

    await atomicWriteJson(filePath, updated)
    expect(JSON.parse(readFileSync(filePath, "utf-8"))).toEqual(updated)
  })

  it("handles arrays as data", async () => {
    const filePath = join(tmpDir, "test.json")
    await atomicWriteJson(filePath, [1, 2, 3])

    const parsed = JSON.parse(readFileSync(filePath, "utf-8"))
    expect(parsed).toEqual([1, 2, 3])
  })

  it("does not leave .tmp files behind on success", async () => {
    const filePath = join(tmpDir, "test.json")
    await atomicWriteJson(filePath, { ok: true })

    // No .tmp files should remain
    const files = require("node:fs").readdirSync(tmpDir)
    const tmpFiles = files.filter((f: string) => f.includes(".tmp"))
    expect(tmpFiles).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// atomicAppendMarkdown tests
// ---------------------------------------------------------------------------

describe("atomicAppendMarkdown", () => {
  it("creates the file if it does not exist", async () => {
    const filePath = join(tmpDir, "notes.md")
    const content = "# Hello\n\nWorld."

    await atomicAppendMarkdown(filePath, content)

    const raw = readFileSync(filePath, "utf-8")
    expect(raw).toBe(content)
  })

  it("appends content to an existing file with newline separator", async () => {
    const filePath = join(tmpDir, "notes.md")
    writeFileSync(filePath, "# Section 1\n")

    await atomicAppendMarkdown(filePath, "## Section 2\n\nMore content.")

    const raw = readFileSync(filePath, "utf-8")
    // Should contain both sections
    expect(raw).toContain("# Section 1")
    expect(raw).toContain("## Section 2")
    expect(raw).toContain("More content.")
  })

  it("preserves existing content while appending", async () => {
    const filePath = join(tmpDir, "notes.md")
    const existing = "First line.\nSecond line.\n"
    writeFileSync(filePath, existing)

    await atomicAppendMarkdown(filePath, "Third line.")

    const raw = readFileSync(filePath, "utf-8")
    expect(raw.startsWith(existing.trim()) || raw.startsWith(existing)).toBe(true)
    expect(raw).toContain("Third line.")
  })
})

// ---------------------------------------------------------------------------
// ensureDirectory tests
// ---------------------------------------------------------------------------

describe("ensureDirectory", () => {
  it("creates a directory if it does not exist", async () => {
    const dirPath = join(tmpDir, "nested", "dirs")
    await ensureDirectory(dirPath)

    expect(existsSync(dirPath)).toBe(true)
  })

  it("does not throw if directory already exists", async () => {
    const dirPath = join(tmpDir, "existing")
    mkdirSync(dirPath)

    await expect(ensureDirectory(dirPath)).resolves.toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// sanitizeSessionID tests
// ---------------------------------------------------------------------------

describe("sanitizeSessionID", () => {
  it("returns valid session IDs unchanged", () => {
    const id = "ses_1ed9df1adffe2hbJudz3sK60y3"
    expect(sanitizeSessionID(id)).toBe(id)
  })

  it("strips characters that are not alphanumeric, underscore, or hyphen", () => {
    const dirty = "ses_abc/../123"
    const clean = sanitizeSessionID(dirty)
    expect(clean).not.toContain("/")
    expect(clean).not.toContain(".")
  })

  it("rejects IDs shorter than 3 characters after sanitization", () => {
    expect(() => sanitizeSessionID("ab")).toThrow()
    expect(() => sanitizeSessionID("a")).toThrow()
    expect(() => sanitizeSessionID("")).toThrow()
  })

  it("accepts valid IDs with hyphens and underscores", () => {
    const id = "ses_test-id_123"
    expect(sanitizeSessionID(id)).toBe(id)
  })
})

// ---------------------------------------------------------------------------
// safeSessionPath tests
// ---------------------------------------------------------------------------

describe("safeSessionPath", () => {
  it("constructs a path under the session tracker root", () => {
    const result = safeSessionPath(
      "/my/project",
      "ses_abc123456789",
      "session.md",
    )
    expect(result).toContain(".hivemind/session-tracker/ses_abc123456789/session.md")
    expect(result.startsWith("/my/project/.hivemind/session-tracker")).toBe(true)
  })

  it("rejects path traversal via ../ in sessionID", () => {
    expect(() =>
      safeSessionPath("/my/project", "../etc", "file"),
    ).toThrow()
  })

  it("rejects path traversal via ../ in filename", () => {
    expect(() =>
      safeSessionPath("/my/project", "ses_valid123456789", "../../file"),
    ).toThrow()
  })

  it("rejects session IDs containing path separators", () => {
    expect(() =>
      safeSessionPath(
        "/my/project",
        "ses_test/path/traversal",
        "file.md",
      ),
    ).toThrow()
  })

  it("rejects session IDs containing backslash path separators", () => {
    expect(() =>
      safeSessionPath(
        "C:\\Users\\project",
        "ses_backslash\\test",
        "file.md",
      ),
    ).toThrow()
  })

  it("rejects filename containing path traversal", () => {
    expect(() =>
      safeSessionPath("/my/project", "ses_valid123456789", "../escaped.md"),
    ).toThrow()
  })

  it("rejects empty sessionID", () => {
    expect(() =>
      safeSessionPath("/my/project", "", "file.md"),
    ).toThrow(/Invalid session ID/)
  })

  it("rejects single character sessionID", () => {
    expect(() =>
      safeSessionPath("/my/project", "x", "file.md"),
    ).toThrow(/Invalid session ID/)
  })

  it("accepts very long sessionIDs (up to 256 chars)", () => {
    const longID = "ses_" + "a".repeat(247) // total 251 chars, within typical limits
    const result = safeSessionPath("/my/project", longID, "file.md")
    expect(result).toContain(longID)
    expect(result.startsWith("/my/project/.hivemind/session-tracker")).toBe(true)
  })

  it("sanitizes unicode characters from sessionID", () => {
    const result = safeSessionPath("/my/project", "ses_ünicode★test", "file.md")
    // Unicode characters stripped by sanitizeSessionID, leaving only alphanumeric
    expect(result).not.toContain("ü")
    expect(result).not.toContain("★")
    expect(result).toContain("ses_nicodetest") // alphanumeric chars preserved
  })

  it("rejects sessionIDs that sanitize to fewer than 3 characters", () => {
    // "★★" would sanitize to "" (stripped of non-alphanumeric)
    expect(() =>
      safeSessionPath("/my/project", "★☆", "file.md"),
    ).toThrow(/Invalid session ID/)
  })

  it("ensures resolved path stays within tracker root even with tricky inputs", () => {
    // After sanitization strips special chars, the path should still be within root
    const result = safeSessionPath(
      "/my/project",
      "ses_tricky_input_12345",
      "file.md",
    )
    expect(result).toBe(
      require("node:path").resolve("/my/project/.hivemind/session-tracker/ses_tricky_input_12345/file.md"),
    )
  })
})
