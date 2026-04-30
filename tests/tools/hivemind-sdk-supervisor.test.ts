import { describe, expect, it } from "vitest"

import { executeSdkSupervisorToolAction } from "../../src/tools/hivemind-sdk-supervisor.js"

describe("hivemind-sdk-supervisor tool", () => {
  it("executes readiness through validated tool input", async () => {
    const result = await executeSdkSupervisorToolAction({ action: "readiness", tier: 9 })

    expect(result).toEqual(expect.objectContaining({ action: "readiness", ready: false }))
  })
})
