/**
 * hivemind-codemap tool tests
 *
 * Tests the code intelligence tool factory and all action handlers.
 */

import { describe, it, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, rm, mkdir, writeFile, readFile } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { createHivemindCodemapTool } from "../../src/tools/hivemind-codemap.js"

const mockContext = {
  sessionID: "test-session",
  messageID: "test-message",
  agent: "test-agent",
  directory: "",
  worktree: "",
  abort: new AbortController().signal,
  metadata: () => {},
  ask: async () => {},
} as any

describe("hivemind-codemap tool", () => {
  let tmpDir: string

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "codemap-test-"))
    // Create minimal project structure
    await mkdir(join(tmpDir, "src"), { recursive: true })
    await writeFile(join(tmpDir, "src", "index.ts"), "export const hello = 'world'\n")
    await writeFile(join(tmpDir, "src", "utils.ts"), "export function add(a: number, b: number) { return a + b }\n")
    // Create .hivemind/codemap directory
    await mkdir(join(tmpDir, ".hivemind", "codemap"), { recursive: true })
  })

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true })
  })

  it("status returns exists=false when no codemap exists", async () => {
    const toolDef = createHivemindCodemapTool(tmpDir)
    const result = await toolDef.execute({ action: "status" }, mockContext)
    const parsed = JSON.parse(result as string)
    assert.strictEqual(parsed.status, "success")
    assert.strictEqual(parsed.metadata.exists, false)
  })

  it("scan creates codemap.json", async () => {
    const toolDef = createHivemindCodemapTool(tmpDir)
    const result = await toolDef.execute({ action: "scan" }, mockContext)
    const parsed = JSON.parse(result as string)
    assert.strictEqual(parsed.status, "success")
    assert.ok(parsed.message.includes("Scanned"))
    assert.ok(parsed.metadata.fileCount > 0)
  })

  it("status returns exists=true after scan", async () => {
    const toolDef = createHivemindCodemapTool(tmpDir)
    await toolDef.execute({ action: "scan" }, mockContext)
    const result = await toolDef.execute({ action: "status" }, mockContext)
    const parsed = JSON.parse(result as string)
    assert.strictEqual(parsed.status, "success")
    assert.strictEqual(parsed.metadata.exists, true)
    assert.ok(parsed.metadata.fileCount > 0)
  })

  it("search returns error when no compressed codemap exists", async () => {
    const toolDef = createHivemindCodemapTool(tmpDir)
    const result = await toolDef.execute({ action: "search", query: "hello" }, mockContext)
    const parsed = JSON.parse(result as string)
    assert.strictEqual(parsed.status, "error")
    assert.ok(parsed.error.includes("compressed") || parsed.suggestion?.includes("compress"))
  })

  it("search returns error when query is missing", async () => {
    const toolDef = createHivemindCodemapTool(tmpDir)
    const result = await toolDef.execute({ action: "search" }, mockContext)
    const parsed = JSON.parse(result as string)
    assert.strictEqual(parsed.status, "error")
    assert.ok(parsed.error.includes("query"))
  })

  it("inject returns error when no compressed codemap exists", async () => {
    const toolDef = createHivemindCodemapTool(tmpDir)
    const result = await toolDef.execute({ action: "inject" }, mockContext)
    const parsed = JSON.parse(result as string)
    assert.strictEqual(parsed.status, "error")
    assert.ok(parsed.error.includes("compressed") || parsed.suggestion?.includes("compress"))
  })

  it("compress returns error when no codemap exists", async () => {
    const toolDef = createHivemindCodemapTool(tmpDir)
    const result = await toolDef.execute({ action: "compress" }, mockContext)
    const parsed = JSON.parse(result as string)
    assert.strictEqual(parsed.status, "error")
    assert.ok(parsed.suggestion?.includes("scan"))
  })

  it("returns error for unknown action", async () => {
    const toolDef = createHivemindCodemapTool(tmpDir)
    const result = await toolDef.execute({ action: "invalid" as any }, mockContext)
    const parsed = JSON.parse(result as string)
    assert.strictEqual(parsed.status, "error")
    assert.ok(parsed.error.includes("Unknown"))
  })

  it("commit returns error when no compressed codemap exists", async () => {
    const toolDef = createHivemindCodemapTool(tmpDir)
    const result = await toolDef.execute({ action: "commit", message: "test commit" }, mockContext)
    const parsed = JSON.parse(result as string)
    assert.strictEqual(parsed.status, "error")
    assert.ok(parsed.error.includes("compressed") || parsed.suggestion?.includes("compress"))
  })

  it("compress returns error for legacy codemap format", async () => {
    // The scanProjectToCodeMap produces legacy format without version field
    // Compress requires full format with version, tokenCount, etc.
    const toolDef = createHivemindCodemapTool(tmpDir)
    await toolDef.execute({ action: "scan" }, mockContext)
    const result = await toolDef.execute({ action: "compress" }, mockContext)
    const parsed = JSON.parse(result as string)
    assert.strictEqual(parsed.status, "error")
    assert.ok(parsed.error.includes("legacy") || parsed.error.includes("format"))
  })
})
