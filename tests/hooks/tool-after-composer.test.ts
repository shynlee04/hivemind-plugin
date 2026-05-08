import { readFileSync } from "node:fs"
import { describe, expect, it, vi } from "vitest"

import { createToolExecuteAfterHook, resolveToolHookSessionId } from "../../src/hooks/transforms/tool-after-composer.js"

describe("tool-after composer", () => {
  it("resolves supported session id fields", () => {
    expect(resolveToolHookSessionId({ rootSessionID: "ses_root" })).toBe("ses_root")
  })

  it("injects guard metadata and returns projection facts without persistence callbacks", async () => {
    const output: { metadata?: unknown } = {}
    const toolGuardAfterHook = vi.fn(async (_input: unknown, target: typeof output) => {
      target.metadata = { _harness: { totalToolCalls: 1 } }
    })
    const hook = createToolExecuteAfterHook({
      toolGuardAfterHook,
      summarizeOutput: () => "ok",
    })

    const fact = await hook({ tool: "bash", args: { sessionID: "ses_root" } }, output)

    expect(output.metadata).toEqual({ _harness: { totalToolCalls: 1 } })
    expect(fact).toEqual(expect.objectContaining({ kind: "tool-execute-after" }))
  })

  it("does not import durable writers", () => {
    const source = readFileSync("src/hooks/transforms/tool-after-composer.ts", "utf-8")

    expect(source).not.toMatch(/createEventTrackerArtifactsFromHook|persistWorkflow|config-workflow|continuity/)
  })
})
