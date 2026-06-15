import { describe, expect, it } from "vitest"

import { executeSdkSupervisorToolAction } from "../../src/tools/hivemind/hivemind-sdk-supervisor.js"

describe("hivemind-sdk-supervisor tool", () => {
  it("executes readiness through validated tool input", async () => {
    const result = await executeSdkSupervisorToolAction({ action: "readiness", tier: 9 })

    // Tier 9 → blocking band → unknownToolFallback returns "advise" (soft-governance default).
    // Source: ready = outcome === "allow" || outcome === "advise" → true
    expect(result).toEqual(expect.objectContaining({ action: "readiness", ready: true }))
  })
})
