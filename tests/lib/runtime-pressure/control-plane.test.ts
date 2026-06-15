import { describe, expect, it } from "vitest"

import { detectRuntimePressure } from "../../../src/features/runtime-pressure/index.js"

describe("runtime pressure control plane", () => {
  it("allows steady pressure actions", () => {
    expect(detectRuntimePressure({ tier: 1, toolName: "delegate-task" })).toMatchObject({ outcome: "allow", band: "steady" })
  })

  it("advises during advisory pressure", () => {
    expect(detectRuntimePressure({ tier: 4, toolName: "run-background-command" })).toMatchObject({ outcome: "advise", band: "advisory" })
  })

  it("advises for gated mutating or executing tools (soft governance default)", () => {
    expect(detectRuntimePressure({ tier: 6, toolName: "session-patch" })).toMatchObject({ outcome: "advise", band: "gated" })
    expect(detectRuntimePressure({ tier: 6, toolName: "run-background-command" })).toMatchObject({ outcome: "advise", band: "gated" })
  })

  it("advises high-pressure mutations and reads (soft governance default)", () => {
    expect(detectRuntimePressure({ tier: 9, toolName: "configure-primitive" })).toMatchObject({ outcome: "advise", band: "blocking" })
    expect(detectRuntimePressure({ tier: 9, toolName: "hivemind-doc" })).toMatchObject({ outcome: "advise", band: "blocking" })
  })
})
