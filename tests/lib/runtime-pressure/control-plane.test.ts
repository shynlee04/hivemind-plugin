import { describe, expect, it } from "vitest"

import { detectRuntimePressure } from "../../../src/features/runtime-pressure/index.js"

describe("runtime pressure control plane", () => {
  it("allows steady pressure actions", () => {
    expect(detectRuntimePressure({ tier: 1, toolName: "delegate-task" })).toMatchObject({ outcome: "allow", band: "steady" })
  })

  it("advises during advisory pressure", () => {
    expect(detectRuntimePressure({ tier: 4, toolName: "run-background-command" })).toMatchObject({ outcome: "advise", band: "advisory" })
  })

  it("requires approval for gated mutating or executing tools", () => {
    expect(detectRuntimePressure({ tier: 6, toolName: "session-patch" })).toMatchObject({ outcome: "require_approval", band: "gated" })
    expect(detectRuntimePressure({ tier: 6, toolName: "run-background-command" })).toMatchObject({ outcome: "require_approval", band: "gated" })
  })

  it("blocks high-pressure mutations and defers high-pressure reads", () => {
    expect(detectRuntimePressure({ tier: 9, toolName: "configure-primitive" })).toMatchObject({ outcome: "block", band: "blocking" })
    expect(detectRuntimePressure({ tier: 9, toolName: "hivemind-doc" })).toMatchObject({ outcome: "defer", band: "blocking" })
  })
})
