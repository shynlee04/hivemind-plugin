/**
 * Tests for continuity-aware soft-start (P27.2 T11, D-15).
 *
 * Evidence label: runtime-truthful (small). Tests the public seam of
 * setContinuityExplicit and the soft-start skip behavior.
 */

import { describe, it, expect, beforeEach } from "vitest"

import {
  setContinuityExplicit,
  isContinuityExplicit,
  resetContinuityTracking,
} from "../../../src/features/intent-lock/session-start.js"

describe("continuityExplicit tracking (T11, D-15)", () => {
  beforeEach(() => {
    resetContinuityTracking()
  })

  it("returns false for unknown sessionId", () => {
    expect(isContinuityExplicit("ses_unknown")).toBe(false)
  })

  it("returns true after explicit Resume is set", () => {
    setContinuityExplicit("ses_123", true)
    expect(isContinuityExplicit("ses_123")).toBe(true)
  })

  it("returns false after TIMEOUT default Resume", () => {
    setContinuityExplicit("ses_456", false)
    expect(isContinuityExplicit("ses_456")).toBe(false)
  })

  it("reset clears all entries", () => {
    setContinuityExplicit("ses_789", true)
    expect(isContinuityExplicit("ses_789")).toBe(true)
    resetContinuityTracking()
    expect(isContinuityExplicit("ses_789")).toBe(false)
  })

  it("multiple sessions are tracked independently", () => {
    setContinuityExplicit("ses_a", true)
    setContinuityExplicit("ses_b", false)
    expect(isContinuityExplicit("ses_a")).toBe(true)
    expect(isContinuityExplicit("ses_b")).toBe(false)
  })
})
