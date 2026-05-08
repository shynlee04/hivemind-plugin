import { describe, expect, it } from "vitest"

import { summarizePluginToolOutput } from "../../src/shared/plugin-tool-output-summary.js"

describe("summarizePluginToolOutput", () => {
  it("redacts secrets and removes control characters", () => {
    const summary = summarizePluginToolOutput("token=abc123\nnext")

    expect(summary).not.toContain("abc123")
    expect(summary).not.toContain("\n")
  })

  it("caps summaries to the plugin limit", () => {
    expect(summarizePluginToolOutput("x".repeat(500))).toHaveLength(240)
  })
})
