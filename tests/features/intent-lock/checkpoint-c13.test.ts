/**
 * Tests for C1.3 classification confirmation (P27.2 T8, REQ-4).
 *
 * Evidence label: runtime-truthful (small).
 */

import { describe, it, expect } from "vitest"
import { askClassificationConfirmation } from "../../../src/features/intent-lock/session-start.js"

describe("askClassificationConfirmation (C1.3)", () => {
  it("returns ACCEPTED when confidence >= 0.6", () => {
    const result = askClassificationConfirmation("/tmp", "ses_test", {
      category: "CODE_TOUCH",
      confidence: 0.85,
    })
    expect(result.status).toBe("ACCEPTED")
    if (result.status === "ACCEPTED") {
      expect(result.category).toBe("CODE_TOUCH")
    }
  })

  it("returns RECLASSIFY when confidence < 0.6", () => {
    const result = askClassificationConfirmation("/tmp", "ses_test", {
      category: "EXPLORATION",
      confidence: 0.3,
    })
    expect(result.status).toBe("RECLASSIFY")
    if (result.status === "RECLASSIFY") {
      expect(result.previousCategory).toBe("EXPLORATION")
    }
  })

  it("returns ACCEPTED for confidence exactly 0.6", () => {
    const result = askClassificationConfirmation("/tmp", "ses_test", {
      category: "RESEARCH",
      confidence: 0.6,
    })
    expect(result.status).toBe("ACCEPTED")
  })

  it("returns RECLASSIFY for confidence 0.0 (no keywords matched)", () => {
    const result = askClassificationConfirmation("/tmp", "ses_test", {
      category: "CODE_TOUCH",
      confidence: 0.0,
    })
    expect(result.status).toBe("RECLASSIFY")
  })
})
