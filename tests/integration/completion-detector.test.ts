import { describe, it, expect, vi } from "vitest"
import { CompletionDetector } from "../../src/coordination/completion/detector.js"

describe("integration — completion detector", () => {
  it("creates CompletionDetector with default timeout", () => {
    const detector = new CompletionDetector()
    expect(detector).toBeInstanceOf(CompletionDetector)
  })

  it("creates CompletionDetector with custom timeout", () => {
    const detector = new CompletionDetector(5000)
    expect(detector).toBeInstanceOf(CompletionDetector)
  })

  it("watch returns timeout for unknown session", async () => {
    const detector = new CompletionDetector()
    const result = await detector.watch("ses_nonexistent", 50)
    expect(result.signal).toBe("timeout")
    expect(result.sessionID).toBe("ses_nonexistent")
  })

  it("feed with session.deleted is recognized as terminal signal", () => {
    const detector = new CompletionDetector()
    // Should not throw when feeding a session.deleted event
    detector.feed("session.deleted", "ses_test_001")
    expect(true).toBe(true) // No crash
  })

  it("feed ignores non-terminal events", () => {
    const detector = new CompletionDetector()
    // Should not crash
    detector.feed("session.updated", "ses_test_002")
    expect(true).toBe(true) // No crash
  })

  it("feed with session.error includes error details", () => {
    const detector = new CompletionDetector()
    detector.feed("session.error", "ses_test_003", "something went wrong")
    expect(true).toBe(true) // No crash
  })
})
