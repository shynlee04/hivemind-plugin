import { describe, expect, it } from "vitest"
import { z } from "zod"

import { formatActionAwareZodError } from "../../src/shared/tool-schema-error.js"

/**
 * NF-02 + Pattern A follow-up: action-aware Zod error formatter.
 *
 * When an LLM calls a tool with an `action` and the inner Zod schema requires
 * per-action fields that the outer schema declared as `z.string().optional()`,
 * the LLM receives a bare Zod error like:
 *   "expected string, received undefined" — path: ["heading"]
 *
 * The error gives no hint that `heading` is required for `action: "upsert"`.
 * The LLM retries 2-4 times before re-encoding the call.
 *
 * `formatActionAwareZodError` takes the action, the ZodError, and a per-tool
 * `requiredHints` table. It returns a `ToolResponse` envelope whose `message`
 * names the action + the missing field + the expected type + a remediation
 * hint. The LLM now sees the actionable message on the first failure.
 *
 * Evidence label: `runtime-truthful` — every test exercises the real helper
 * with a real `z.ZodError` produced by `safeParse` on a Zod schema.
 * Test size: `small`.
 */
describe("formatActionAwareZodError", () => {
  // Reusable inner schema that requires `heading` for `upsert` only.
  const innerSchema = z.discriminatedUnion("action", [
    z.object({ action: z.literal("skim"), path: z.string() }),
    z.object({
      action: z.literal("upsert"),
      path: z.string(),
      heading: z.string().min(1),
      body: z.string(),
    }),
  ])

  // Per-action required-field table — what the tool docs would say.
  const requiredHints: Record<string, string[]> = {
    upsert: ["heading", "body"],
  }

  it("returns a ToolResponse with kind=error", () => {
    const result = innerSchema.safeParse({ action: "upsert", path: "x.md" })
    expect(result.success).toBe(false)
    if (result.success) return

    const envelope = formatActionAwareZodError({
      action: "upsert",
      toolName: "hivemind-doc",
      error: result.error,
      requiredHints,
    })

    expect(envelope.kind).toBe("error")
    expect(typeof envelope.message).toBe("string")
    expect(envelope.message.length).toBeGreaterThan(0)
  })

  it("names the action and the missing field when the Zod path matches a required field", () => {
    const result = innerSchema.safeParse({ action: "upsert", path: "x.md" })
    if (result.success) throw new Error("expected safeParse to fail")

    const envelope = formatActionAwareZodError({
      action: "upsert",
      toolName: "hivemind-doc",
      error: result.error,
      requiredHints,
    })

    // The message must surface the action, the field, and a remediation hint.
    expect(envelope.message).toContain("upsert")
    expect(envelope.message).toContain("heading")
  })

  it("lists ALL required fields for the action in the message (not just the first failure)", () => {
    // Per docs: upsert requires both `heading` AND `body`. Even if the
    // first failure is `heading`, the message should tell the LLM that
    // BOTH are required so it doesn't ping-pong one-fix-at-a-time.
    const result = innerSchema.safeParse({ action: "upsert", path: "x.md" })
    if (result.success) throw new Error("expected safeParse to fail")

    const envelope = formatActionAwareZodError({
      action: "upsert",
      toolName: "hivemind-doc",
      error: result.error,
      requiredHints,
    })

    expect(envelope.message).toContain("heading")
    expect(envelope.message).toContain("body")
  })

  it("includes the tool name in the message", () => {
    const result = innerSchema.safeParse({ action: "upsert", path: "x.md" })
    if (result.success) throw new Error("expected safeParse to fail")

    const envelope = formatActionAwareZodError({
      action: "upsert",
      toolName: "hivemind-doc",
      error: result.error,
      requiredHints,
    })

    expect(envelope.message).toContain("hivemind-doc")
  })

  it("falls back to a generic message when the action is undefined", () => {
    const result = innerSchema.safeParse({ path: "x.md" })
    if (result.success) throw new Error("expected safeParse to fail")

    const envelope = formatActionAwareZodError({
      action: undefined,
      toolName: "hivemind-doc",
      error: result.error,
      requiredHints,
    })

    // Should still be a valid error envelope — just without the action hint.
    expect(envelope.kind).toBe("error")
    expect(envelope.message).toContain("hivemind-doc")
  })

  it("falls back to a generic message when the action has no requiredHints entry", () => {
    const result = innerSchema.safeParse({ action: "skim", path: 42 })
    if (result.success) throw new Error("expected safeParse to fail")

    const envelope = formatActionAwareZodError({
      action: "skim",
      toolName: "hivemind-doc",
      error: result.error,
      requiredHints,
    })

    // skim has no requiredHints entry → fallback message.
    expect(envelope.kind).toBe("error")
    // Falls back to Zod's prettified error rather than a per-action hint.
    expect(typeof envelope.message).toBe("string")
    expect(envelope.message.length).toBeGreaterThan(0)
  })

  it("attaches the raw Zod issues in envelope.data for tool consumers that want to inspect", () => {
    const result = innerSchema.safeParse({ action: "upsert", path: "x.md" })
    if (result.success) throw new Error("expected safeParse to fail")

    const envelope = formatActionAwareZodError({
      action: "upsert",
      toolName: "hivemind-doc",
      error: result.error,
      requiredHints,
    })

    // Data is optional in ToolResponse, but when present should contain issues.
    expect(envelope.data).toBeDefined()
    const data = envelope.data as { issues?: Array<{ path: (string | number)[]; message: string }> }
    expect(Array.isArray(data.issues)).toBe(true)
    expect(data.issues!.length).toBeGreaterThan(0)
  })
})
