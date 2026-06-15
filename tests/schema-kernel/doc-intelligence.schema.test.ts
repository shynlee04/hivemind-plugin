import { describe, it, expect } from "vitest"
import { DocIntelligenceInputSchema } from "../../src/schema-kernel/doc-intelligence.schema.js"

/**
 * Regression guard for GAP-1 (P0) from 61.1-VERIFICATION.md.
 *
 * The 6 line/offset write actions (`write_lines`, `write_offset`, `insert_lines`,
 * `insert_offset`, `delete_lines`, `delete_offset`) are accepted by the router
 * (`line-offset-ops.ts`) and exported in `DocIntelligenceAction` (`types.ts`),
 * but were never added to the tool-path Zod schema
 * (`DocIntelligenceInputSchema` in `doc-intelligence.schema.ts`).
 *
 * An agent calling the `hivemind-doc` tool with any of these 6 actions was
 * rejected at the Zod boundary with "Invalid discriminator value" before
 * reaching the router. These tests prove the schema accepts each variant.
 *
 * Evidence label: `runtime-truthful` — exercises the real Zod schema parse.
 * Test size: `small` — single Zod schema assertion per case.
 */
describe("DocIntelligenceInputSchema — line/offset write actions (GAP-1)", () => {
  it("accepts write_lines with startLine, endLine, content", () => {
    const result = DocIntelligenceInputSchema.safeParse({
      action: "write_lines",
      path: "x",
      startLine: 1,
      endLine: 2,
      content: "new content",
    })
    expect(result.success).toBe(true)
  })

  it("accepts write_offset with offset, limit, content", () => {
    const result = DocIntelligenceInputSchema.safeParse({
      action: "write_offset",
      path: "x",
      offset: 0,
      limit: 5,
      content: "replacement",
    })
    expect(result.success).toBe(true)
  })

  it("accepts insert_lines with startLine, content", () => {
    const result = DocIntelligenceInputSchema.safeParse({
      action: "insert_lines",
      path: "x",
      startLine: 3,
      content: "inserted line",
    })
    expect(result.success).toBe(true)
  })

  it("accepts insert_offset with offset, content", () => {
    const result = DocIntelligenceInputSchema.safeParse({
      action: "insert_offset",
      path: "x",
      offset: 10,
      content: "inserted",
    })
    expect(result.success).toBe(true)
  })

  it("accepts delete_lines with startLine, endLine", () => {
    const result = DocIntelligenceInputSchema.safeParse({
      action: "delete_lines",
      path: "x",
      startLine: 1,
      endLine: 2,
    })
    expect(result.success).toBe(true)
  })

  it("accepts delete_offset with offset, limit", () => {
    const result = DocIntelligenceInputSchema.safeParse({
      action: "delete_offset",
      path: "x",
      offset: 5,
      limit: 3,
    })
    expect(result.success).toBe(true)
  })
})
