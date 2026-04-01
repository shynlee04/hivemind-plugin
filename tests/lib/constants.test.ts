import { describe, it, expect } from "vitest"
import { MAX_DESCENDANTS_PER_ROOT } from "../../src/lib/types.js"

describe("core constants", () => {
  it("MAX_DESCENDANTS_PER_ROOT should be 10 per spec ARCH-008", () => {
    expect(MAX_DESCENDANTS_PER_ROOT).toBe(10)
  })
})
