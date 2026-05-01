import { describe, expect, it } from "vitest"

import { classifyRuntimePressure, getPressureBand } from "../../../src/lib/runtime-pressure/index.js"

describe("runtime pressure model — Phase 67 contract band mapping", () => {
  // Source: 57-CONTRACT-2026-04-30.md §"Pressure Bands"
  //   Steady   = 0, 1
  //   Advisory = 2, 3, 4
  //   Gated    = 5, 6, 7
  //   Blocking = 8, 9
  it("maps steady = tiers 0-1 only (per planning contract)", () => {
    expect(getPressureBand(0)).toBe("steady")
    expect(getPressureBand(1)).toBe("steady")
  })

  it("maps advisory = tiers 2-4 (tier 2 is advisory, NOT steady)", () => {
    expect(getPressureBand(2)).toBe("advisory")
    expect(getPressureBand(3)).toBe("advisory")
    expect(getPressureBand(4)).toBe("advisory")
  })

  it("maps gated = tiers 5-7", () => {
    expect(getPressureBand(5)).toBe("gated")
    expect(getPressureBand(6)).toBe("gated")
    expect(getPressureBand(7)).toBe("gated")
  })

  it("maps blocking = tiers 8-9", () => {
    expect(getPressureBand(8)).toBe("blocking")
    expect(getPressureBand(9)).toBe("blocking")
  })

  it("clamps untrusted scores into safe tier classifications", () => {
    expect(classifyRuntimePressure({ score: -5 })).toEqual({ tier: 0, band: "steady" })
    expect(classifyRuntimePressure({ score: 1.9 })).toEqual({ tier: 1, band: "steady" })
    expect(classifyRuntimePressure({ score: 2.0 })).toEqual({ tier: 2, band: "advisory" })
    expect(classifyRuntimePressure({ score: 4.9 })).toEqual({ tier: 4, band: "advisory" })
    expect(classifyRuntimePressure({ score: 99 })).toEqual({ tier: 9, band: "blocking" })
    expect(classifyRuntimePressure({ score: Number.NaN })).toEqual({ tier: 0, band: "steady" })
  })

  it("treats explicit tier values verbatim (no rounding)", () => {
    expect(classifyRuntimePressure({ tier: 2 })).toEqual({ tier: 2, band: "advisory" })
    expect(classifyRuntimePressure({ tier: 5 })).toEqual({ tier: 5, band: "gated" })
    expect(classifyRuntimePressure({ tier: 8 })).toEqual({ tier: 8, band: "blocking" })
  })
})
