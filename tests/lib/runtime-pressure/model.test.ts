import { describe, expect, it } from "vitest"

import { classifyRuntimePressure, getPressureBand } from "../../../src/lib/runtime-pressure/index.js"

describe("runtime pressure model", () => {
  it("maps tiers 0-9 into the four pressure bands", () => {
    expect([0, 1, 2].map((tier) => getPressureBand(tier as 0 | 1 | 2))).toEqual(["steady", "steady", "steady"])
    expect([3, 4].map((tier) => getPressureBand(tier as 3 | 4))).toEqual(["advisory", "advisory"])
    expect([5, 6, 7].map((tier) => getPressureBand(tier as 5 | 6 | 7))).toEqual(["gated", "gated", "gated"])
    expect([8, 9].map((tier) => getPressureBand(tier as 8 | 9))).toEqual(["blocking", "blocking"])
  })

  it("clamps untrusted scores into safe tier classifications", () => {
    expect(classifyRuntimePressure({ score: -5 })).toEqual({ tier: 0, band: "steady" })
    expect(classifyRuntimePressure({ score: 4.9 })).toEqual({ tier: 4, band: "advisory" })
    expect(classifyRuntimePressure({ score: 99 })).toEqual({ tier: 9, band: "blocking" })
  })
})
