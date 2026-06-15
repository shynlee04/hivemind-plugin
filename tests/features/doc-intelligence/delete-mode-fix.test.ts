import { describe, it, expect } from "vitest"
import { afterEach, beforeEach } from "vitest"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { DocIntelligenceInputSchema } from "../../../src/schema-kernel/doc-intelligence.schema.js"
import { createHivemindDocTool } from "../../../src/tools/hivemind/hivemind-doc.js"

/**
 * F-19 — `delete` action's mode schema is a discriminated union.
 *
 * Before the fix, the inner Zod schema for `delete` accepted only
 * `mode: "file"` (or undefined) plus an optional `heading`. Calling
 * `delete` with `mode: "section"` was rejected, and calling it with
 * no fields at all silently produced a runtime error in the router
 * ("input.heading as string" → undefined → deleteSection threw).
 *
 * The fix replaces the flat object with a `z.union` whose variants
 * enforce the mode-specific required fields:
 *   - `mode: "section"` requires `heading`
 *   - `mode: "lines"`   requires `startLine` (and optionally `endLine`)
 *   - `mode: "file"`    requires nothing else
 *   - no `mode`         requires `heading` (backward compat — equivalent
 *                       to the implicit "section" mode)
 *
 * The outer wrapper at `src/tools/hivemind/hivemind-doc.ts` mirrors
 * the inner shape via `z.string().optional()` for `mode` (per the
 * Wave-1.5 type-parity lesson: outer tells the agent "string" and
 * lets the inner reject invalid combinations).
 *
 * Evidence label: `runtime-truthful` — every test exercises the real
 * inner Zod schema and the real `createHivemindDocTool` wrapper.
 * Test size: `small`.
 */
describe("F-19: delete action discriminated union (mode schema)", () => {
  const mockCtx = {
    sessionID: "parent-session",
    agent: "gsd-executor",
    directory: process.cwd(),
    worktree: process.cwd(),
    abort: new AbortController().signal,
    metadata: () => ({}),
    ask: async () => ({ state: "approved" as const }),
  } as never

  function parseResult(raw: string): Record<string, unknown> {
    return JSON.parse(raw) as Record<string, unknown>
  }

  function extractMessage(raw: string): string {
    const result = parseResult(raw)
    return typeof result.message === "string" ? result.message : ""
  }

  describe("inner schema (DocIntelligenceInputSchema)", () => {
    it("accepts mode:'section' with a heading", () => {
      const result = DocIntelligenceInputSchema.safeParse({
        action: "delete",
        path: "doc.md",
        mode: "section",
        heading: "Auth",
      })
      expect(result.success).toBe(true)
    })

    it("REJECTS mode:'section' without a heading (inner schema error)", () => {
      const result = DocIntelligenceInputSchema.safeParse({
        action: "delete",
        path: "doc.md",
        mode: "section",
      })
      expect(result.success).toBe(false)
    })

    it("accepts mode:'lines' with startLine (and optional endLine)", () => {
      const withEnd = DocIntelligenceInputSchema.safeParse({
        action: "delete",
        path: "doc.md",
        mode: "lines",
        startLine: 3,
        endLine: 5,
      })
      expect(withEnd.success).toBe(true)

      const withoutEnd = DocIntelligenceInputSchema.safeParse({
        action: "delete",
        path: "doc.md",
        mode: "lines",
        startLine: 3,
      })
      expect(withoutEnd.success).toBe(true)
    })

    it("REJECTS mode:'lines' without startLine", () => {
      const result = DocIntelligenceInputSchema.safeParse({
        action: "delete",
        path: "doc.md",
        mode: "lines",
      })
      expect(result.success).toBe(false)
    })

    it("accepts mode:'file' with no other fields", () => {
      const result = DocIntelligenceInputSchema.safeParse({
        action: "delete",
        path: "doc.md",
        mode: "file",
      })
      expect(result.success).toBe(true)
    })

    it("accepts no-mode + heading (backward compat — implicit section delete)", () => {
      const result = DocIntelligenceInputSchema.safeParse({
        action: "delete",
        path: "doc.md",
        heading: "Auth",
      })
      expect(result.success).toBe(true)
    })

    it("REJECTS no-mode + no-heading (the old silent-failure shape)", () => {
      const result = DocIntelligenceInputSchema.safeParse({
        action: "delete",
        path: "doc.md",
      })
      expect(result.success).toBe(false)
    })
  })

  describe("outer wrapper (hivemind-doc.ts)", () => {
    let root: string

    beforeEach(() => {
      root = mkdtempSync(join(tmpdir(), "f19-delete-mode-"))
    })

    afterEach(() => {
      rmSync(root, { recursive: true, force: true })
    })

    it("accepts mode:'section' + heading via the tool wrapper and deletes the section", async () => {
      const relPath = "doc.md"
      writeFileSync(
        join(root, relPath),
        ["# Top", "", "## Keep", "", "keep body", "", "## Remove", "", "remove body"].join("\n"),
        "utf-8",
      )

      const tool = createHivemindDocTool(root)
      const raw = await tool.execute(
        {
          action: "delete",
          path: relPath,
          mode: "section",
          heading: "Remove",
        } as never,
        mockCtx,
      ) as string
      const result = parseResult(raw)
      expect(result.kind).toBe("success")
      const content = require("node:fs").readFileSync(join(root, relPath), "utf-8")
      expect(content).toContain("keep body")
      expect(content).not.toContain("remove body")
    })

    it("accepts mode:'lines' + startLine/endLine via the tool wrapper and deletes the line range", async () => {
      const relPath = "doc.md"
      writeFileSync(
        join(root, relPath),
        ["# Top", "", "line3", "", "line5", "", "line7"].join("\n"),
        "utf-8",
      )

      const tool = createHivemindDocTool(root)
      const raw = await tool.execute(
        {
          action: "delete",
          path: relPath,
          mode: "lines",
          startLine: 3,
          endLine: 5,
        } as never,
        mockCtx,
      ) as string
      const result = parseResult(raw)
      expect(result.kind).toBe("success")
    })

    it("returns a structured [Hivemind]-prefixed error when mode:'section' is used without heading", async () => {
      const relPath = "doc.md"
      writeFileSync(join(root, relPath), "# Top\n", "utf-8")
      const tool = createHivemindDocTool(root)
      const raw = await tool.execute(
        {
          action: "delete",
          path: relPath,
          mode: "section",
        } as never,
        mockCtx,
      ) as string
      const result = parseResult(raw)
      // The wrapper catches the inner-schema throw and emits a structured error.
      expect(result.kind).toBe("error")
      // The wrapper catches the inner-schema throw and emits a [Hivemind]-prefixed
      // error telling the user to check the action's required fields.
      expect(extractMessage(raw)).toMatch(/Invalid doc-intelligence input/i)
    })
  })
})
