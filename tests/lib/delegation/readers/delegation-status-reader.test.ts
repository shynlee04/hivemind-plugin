/**
 * Tests for DelegationStatusReader interface — contract verification.
 *
 * REQ-C6-02: Both reader implementations must satisfy the interface.
 */
import { describe, it, expect } from "vitest"
import { SessionTrackerStatusReader } from "../../../../src/tools/delegation/readers/session-tracker-reader.js"
import { LegacyPersistenceStatusReader } from "../../../../src/tools/delegation/readers/legacy-reader.js"

describe("DelegationStatusReader interface contract", () => {
  it("SessionTrackerStatusReader should implement readChildren method", () => {
    const reader = new SessionTrackerStatusReader()
    expect(typeof reader.readChildren).toBe("function")
  })

  it("SessionTrackerStatusReader should implement readDelegation method", () => {
    const reader = new SessionTrackerStatusReader()
    expect(typeof reader.readDelegation).toBe("function")
  })

  it("LegacyPersistenceStatusReader should implement readChildren method", () => {
    const reader = new LegacyPersistenceStatusReader()
    expect(typeof reader.readChildren).toBe("function")
  })

  it("LegacyPersistenceStatusReader should implement readDelegation method", () => {
    const reader = new LegacyPersistenceStatusReader()
    expect(typeof reader.readDelegation).toBe("function")
  })

  it("SessionTrackerStatusReader.readChildren should return Promise<Delegation[]>", async () => {
    const reader = new SessionTrackerStatusReader()
    const result = await reader.readChildren("nonexistent-root", "/tmp")
    expect(Array.isArray(result)).toBe(true)
  })

  it("LegacyPersistenceStatusReader.readChildren should return Promise<Delegation[]>", async () => {
    const reader = new LegacyPersistenceStatusReader()
    const result = await reader.readChildren("nonexistent-parent", "/tmp")
    expect(Array.isArray(result)).toBe(true)
  })
})
