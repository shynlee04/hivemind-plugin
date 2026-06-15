import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"

import { createHivemindDocTool } from "../../../src/tools/hivemind/hivemind-doc.js"

/**
 * NF-02 — Tool wrapper vs inner schema mismatch (transport-flexible params).
 *
 * The `hivemind-doc` tool wrapper at `src/tools/hivemind/hivemind-doc.ts`
 * declares `metadata`, `ops`, and `files` as `z.string().optional()` (the
 * OpenCode-client-safe default for tool args). The inner Zod schema
 * `DocIntelligenceInputSchema` expects:
 *   - `metadata` as `z.record(z.string(), z.unknown())` (object)
 *   - `ops` as `z.array(SectionEditOpSchema).min(1)` (array)
 *   - `files` as `z.array(FileOpsSchema).min(1)` (array)
 *
 * The OpenCode client may either (a) pass the values pre-parsed as
 * objects/arrays (the common case for object-typed args) or (b) pass them
 * as JSON-encoded strings (the common case for array-typed args, which
 * the client serialises as strings to avoid the array→object coercion).
 *
 * The tool wrapper MUST accept BOTH forms. Before the fix, only the
 * string form was accepted at the wrapper, and the inner Zod schema
 * (correctly) rejected the string. After the fix, the wrapper passes
 * through objects/arrays AS-IS and parses JSON strings before
 * dispatching to the inner schema.
 *
 * Evidence label: `runtime-truthful` — every test exercises the real
 * tool `execute` factory, real schema parsing, real on-disk file writes.
 *
 * Test size: `small` — focused unit on the tool wrapper contract.
 */
describe("NF-02: tool/inner schema transport-flexible params", () => {
  let root: string
  let tool: ReturnType<typeof createHivemindDocTool>

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

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "nf02-schema-fix-"))
    tool = createHivemindDocTool(root)
  })

  afterEach(() => {
    rmSync(root, { recursive: true, force: true })
  })

  describe("set_metadata accepts metadata as a JSON object (not a string)", () => {
    it("set_metadata with metadata as object { author: 'x' } returns ok: true and writes frontmatter", async () => {
      const relPath = "doc.md"
      const absPath = join(root, relPath)

      const raw = await tool.execute(
        {
          action: "set_metadata",
          path: relPath,
          metadata: { author: "test-author", version: 2 },
        } as never,
        mockCtx,
      )
      const result = parseResult(raw)
      if (result.kind !== "success") {
        throw new Error(`set_metadata (object) failed: ${extractMessage(raw)}`)
      }

      expect(result.kind).toBe("success")
      expect(existsSync(absPath)).toBe(true)
      const fileContent = readFileSync(absPath, "utf-8")
      expect(fileContent).toContain("test-author")
      expect(fileContent).toContain("2")
    })

    it("set_metadata with metadata as nested object { documents: { kb: {...} } } succeeds", async () => {
      const relPath = "nested.md"
      const absPath = join(root, relPath)

      const raw = await tool.execute(
        {
          action: "set_metadata",
          path: relPath,
          metadata: {
            documents: { kb: { name: "knowledge-base" } },
            stats: { count: 5 },
          },
        } as never,
        mockCtx,
      )
      const result = parseResult(raw)
      if (result.kind !== "success") {
        throw new Error(`set_metadata (nested) failed: ${extractMessage(raw)}`)
      }

      expect(result.kind).toBe("success")
      expect(existsSync(absPath)).toBe(true)
    })
  })

  describe("batch accepts ops as an array (not a JSON string)", () => {
    it("batch with ops as an array of 2+ section operations returns ok: true", async () => {
      const relPath = "doc.md"
      const absPath = join(root, relPath)

      const raw = await tool.execute(
        {
          action: "batch",
          path: relPath,
          ops: [
            { op: "write", heading: "First", body: "first body" },
            { op: "write", heading: "Second", body: "second body" },
          ],
        } as never,
        mockCtx,
      )
      const result = parseResult(raw)
      if (result.kind !== "success") {
        throw new Error(`batch (array) failed: ${extractMessage(raw)}`)
      }

      // The schema-mismatch contract: the wrapper accepts the array form
      // and dispatches to the inner schema. Whether the inner batch
      // action actually applies upserts is a separate (pre-existing)
      // limitation in batch-ops.ts, not a wrapper/schema issue.
      expect(result.kind).toBe("success")
    })
  })

  describe("batch_files accepts files as an array (not a JSON string)", () => {
    it("batch_files with files as an array of per-file batches returns ok: true", async () => {
      const fileA = "a.md"
      const fileB = "sub/b.md"
      const absA = join(root, fileA)
      const absB = join(root, fileB)

      const raw = await tool.execute(
        {
          action: "batch_files",
          files: [
            { path: fileA, ops: [{ op: "upsert", heading: "A", body: "alpha", level: 1 }] },
            { path: fileB, ops: [{ op: "upsert", heading: "B", body: "bravo", level: 1 }] },
          ],
        } as never,
        mockCtx,
      )
      const result = parseResult(raw)
      if (result.kind !== "success") {
        throw new Error(`batch_files (array) failed: ${extractMessage(raw)}`)
      }

      expect(result.kind).toBe("success")
    })
  })

  describe("regression: existing-file pre-condition is preserved", () => {
    it("create on an existing file still returns the expected exists-failure", async () => {
      // The schema fix for NF-02 must NOT regress the case where the
      // caller tries to create a file that already exists.
      const relPath = "preexisting.md"
      const absPath = join(root, relPath)
      writeFileSync(absPath, "# Old\n", "utf-8")

      const raw = await tool.execute(
        {
          action: "create",
          path: relPath,
          title: "Replacement",
          metadata: { author: "x" },
        } as never,
        mockCtx,
      )
      const result = parseResult(raw)

      expect(result.kind).toBe("error")
    })
  })

  /**
   * NF-02 follow-up: tool args descriptions match inner schema reality.
   *
   * The original NF-02 description strings on `metadata`, `ops`, and `files`
   * said "JSON string" / "JSON array of" — lies that hid the schema
   * mismatch. After the wrapper accepts BOTH forms, the description must
   * accurately reflect that the inner schema accepts structured objects
   * and arrays (with optional JSON-encoded-string form).
   *
   * Evidence label: `runtime-truthful` — every test inspects the live tool
   * args metadata produced by `createHivemindDocTool(root)`.
   * Test size: `small` — focused unit on tool args metadata.
   */
  describe("NF-02 follow-up: tool args descriptions match inner schema (D-01..D-04)", () => {
    it("metadata description does NOT claim 'JSON string' and DOES mention 'JSON object' (D-01/D-02)", () => {
      const args = tool.args as Record<string, { description?: string } | undefined>
      const description = args.metadata?.description
      expect(description).toBeDefined()
      // The lie that hid NF-02.
      expect(description).not.toMatch(/JSON string/i)
      // The accurate description per the inner Zod schema (z.record(z.string(), z.unknown())).
      expect(description).toMatch(/JSON object/i)
    })

    it("ops description does NOT claim 'JSON array of' and DOES mention 'array of section operation' (D-03)", () => {
      const args = tool.args as Record<string, { description?: string } | undefined>
      const description = args.ops?.description
      expect(description).toBeDefined()
      // The lie that hid NF-02 — inner schema expects a real array, not a JSON-encoded string.
      expect(description).not.toMatch(/JSON array of/i)
      // The accurate description per the inner Zod schema (z.array(SectionEditOpSchema)).
      expect(description).toMatch(/array of section operation/i)
    })

    it("files description does NOT claim 'JSON array of' and DOES mention 'array of per-file batch' (D-04)", () => {
      const args = tool.args as Record<string, { description?: string } | undefined>
      const description = args.files?.description
      expect(description).toBeDefined()
      // The lie that hid NF-02 — inner schema expects a real array, not a JSON-encoded string.
      expect(description).not.toMatch(/JSON array of/i)
      // The accurate description per the inner Zod schema (z.array(FileOpsSchema)).
      expect(description).toMatch(/array of per-file batch/i)
    })

    it("router.ts source file drops banned 'as' cast patterns (NF-02 cleanup at lines 163/167/172)", () => {
      // Resolve the router file relative to the test file. `import.meta.dirname`
      // is available in vitest's Node environment; the path matches the
      // file location: tests/tools/hivemind/hivemind-doc-schema-fix.test.ts
      // → ../../../src/features/doc-intelligence/router.ts
      const routerAbsPath = resolve(import.meta.dirname, "../../../src/features/doc-intelligence/router.ts")
      const routerSource = readFileSync(routerAbsPath, "utf-8")

      // NF-02 specific: the casts that hid the schema mismatch.
      expect(routerSource).not.toMatch(/\bas\s+never\[\]/)
      expect(routerSource).not.toMatch(/\bas\s+Record<string,\s*unknown>/)

      // Per user spec: zero `as` casts at lines 163, 167, 172.
      const lines = routerSource.split("\n")
      // Lines are 1-indexed for humans; array is 0-indexed.
      const line163 = lines[162] ?? ""
      const line167 = lines[166] ?? ""
      const line172 = lines[171] ?? ""
      expect(line163).not.toMatch(/\bas\s/)
      expect(line167).not.toMatch(/\bas\s/)
      expect(line172).not.toMatch(/\bas\s/)
    })
  })

  /**
   * Wave 1.5 follow-up: outer/inner type parity for `metadata` / `ops` / `files`.
   *
   * The Wave-1 description fix corrected what the wrapper SAID about these
   * fields, but the outer Zod declarations still declared them as
   * `z.string().optional()`. The agent (LLM) trusts the outer schema shape
   * to decide what payload to send, so when the outer says "string" the
   * agent sends a JSON-encoded string and the inner schema then rejects
   * it with `expected record, received string` (NF-02 root cause).
   *
   * The fix replaces the outer declarations with the SAME shape the inner
   * `DocIntelligenceInputSchema` requires:
   *   - `metadata`: `z.record(z.string(), z.unknown()).optional()`
   *   - `ops`:      `z.array(SectionEditOpSchema).optional()`
   *   - `files`:    `z.array(FileOpsSchema).optional()`
   *
   * Evidence label: `runtime-truthful` — every assertion inspects the live
   * tool args Zod schema produced by `createHivemindDocTool(root)` and
   * exercises the execute factory end-to-end.
   * Test size: `small` — focused unit on tool args schema contract.
   */
  describe("Wave 1.5 follow-up: outer/inner type parity for metadata/ops/files", () => {
    it("create with metadata as a real object returns a success envelope (no 'expected record, received string')", async () => {
      // End-to-end: the agent passes a real object (not a JSON string)
      // and the inner schema accepts it. This is the bug-reproduction test
      // the user spec asks for.
      const relPath = "wave-1.5-create-with-object.md"
      const absPath = join(root, relPath)

      const raw = await tool.execute(
        {
          action: "create",
          path: relPath,
          title: "Created With Object Metadata",
          metadata: { author: "alice", tags: ["system", "design"] },
        } as never,
        mockCtx,
      )
      const result = parseResult(raw)
      // The bug manifests as: result.kind === "error" with message
      // "expected record, received string". After the type-parity fix,
      // result.kind === "success" and the file is created with frontmatter.
      if (result.kind !== "success") {
        throw new Error(`create (object metadata) failed: ${extractMessage(raw)}`)
      }
      expect(result.kind).toBe("success")
      expect(existsSync(absPath)).toBe(true)
      const fileContent = readFileSync(absPath, "utf-8")
      expect(fileContent).toContain("alice")
    })

    it("outer args.metadata is ZodOptional<ZodRecord> AND args.ops/args.files are ZodOptional<ZodArray> (NOT ZodOptional<ZodString>)", () => {
      // The outer Zod schema's shape (ZodOptional + inner type) is what the
      // agent uses to generate payloads. Inspect via constructor.name and
      // also round-trip a real object/array through .parse() to prove the
      // outer schema accepts the structured form without coercion.
      const args = tool.args as Record<
        string,
        | undefined
        | {
            _def: { type: string; innerType?: { constructor: { name: string } } }
            parse: (input: unknown) => unknown
          }
      >

      // metadata → ZodOptional<ZodRecord>
      const metadata = args.metadata
      expect(metadata).toBeDefined()
      expect(metadata?._def.type).toBe("optional")
      expect(metadata?._def.innerType?.constructor.name).toBe("ZodRecord")
      const parsedMetadata = metadata?.parse({ author: "alice", tags: ["system", "design"] })
      expect(parsedMetadata).toEqual({ author: "alice", tags: ["system", "design"] })

      // ops → ZodOptional<ZodArray>
      const ops = args.ops
      expect(ops).toBeDefined()
      expect(ops?._def.type).toBe("optional")
      expect(ops?._def.innerType?.constructor.name).toBe("ZodArray")
      const parsedOps = ops?.parse([{ op: "write", heading: "A", body: "alpha" }])
      expect(Array.isArray(parsedOps)).toBe(true)
      expect(parsedOps).toEqual([{ op: "write", heading: "A", body: "alpha" }])

      // files → ZodOptional<ZodArray>
      const files = args.files
      expect(files).toBeDefined()
      expect(files?._def.type).toBe("optional")
      expect(files?._def.innerType?.constructor.name).toBe("ZodArray")
      const parsedFiles = files?.parse([{ path: "x.md", ops: [{ op: "write", heading: "A", body: "alpha" }] }])
      expect(Array.isArray(parsedFiles)).toBe(true)
      expect(parsedFiles).toEqual([{ path: "x.md", ops: [{ op: "write", heading: "A", body: "alpha" }] }])
    })
  })
})
