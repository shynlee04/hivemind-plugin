import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { createHivemindDocTool } from "../../src/tools/hivemind/hivemind-doc.js"

const mockCtx = {
  sessionID: "parent-session",
  agent: "gsd-executor",
  directory: process.cwd(),
  worktree: process.cwd(),
  abort: new AbortController().signal,
  metadata: () => ({}),
  ask: async () => ({ state: "approved" as const }),
}

function parseResult(raw: string): Record<string, unknown> {
  return JSON.parse(raw) as Record<string, unknown>
}

describe("hivemind-doc tool", () => {
  let root: string

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "hivemind-doc-tool-"))
    mkdirSync(join(root, "docs"), { recursive: true })
    writeFileSync(join(root, "docs", "guide.md"), "# Guide\nReadable content.")
  })

  afterEach(() => {
    rmSync(root, { recursive: true, force: true })
  })

  it("returns success envelopes for skim actions", async () => {
    const tool = createHivemindDocTool(root)
    const raw = await tool.execute({ action: "skim", path: "docs/guide.md" } as never, mockCtx)
    const result = parseResult(raw)

    expect(result.kind).toBe("success")
    expect(result.message).toBe("Doc intelligence action completed")
    expect(result.data).toMatchObject({ action: "skim", document: { path: "docs/guide.md" } })
  })

  it("returns error envelopes for path escapes", async () => {
    const tool = createHivemindDocTool(root)
    const raw = await tool.execute({ action: "read", path: "../secret.md" } as never, mockCtx)
    const result = parseResult(raw)

    expect(result.kind).toBe("error")
    expect(result.message).toContain("doc intelligence path escapes allowed root")
  })
})
