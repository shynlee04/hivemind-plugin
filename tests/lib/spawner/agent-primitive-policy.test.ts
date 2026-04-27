import { describe, it, expect } from "vitest"
import { parseToolBooleans, parsePermissionRecord } from "../../../src/lib/spawner/agent-primitive-policy.js"

describe("parseToolBooleans", () => {
  it("returns parsed boolean map for valid boolean record entries", () => {
    const result = parseToolBooleans({ read: true, write: false, grep: true })
    expect(result).toEqual({ read: true, write: false, grep: true })
  })

  it("returns undefined for non-object input (string)", () => {
    expect(parseToolBooleans("not-an-object")).toBeUndefined()
  })

  it("returns undefined for non-object input (array)", () => {
    expect(parseToolBooleans([1, 2, 3])).toBeUndefined()
  })

  it("returns undefined for null input", () => {
    expect(parseToolBooleans(null)).toBeUndefined()
  })

  it("returns undefined for undefined input", () => {
    expect(parseToolBooleans(undefined)).toBeUndefined()
  })

  it("returns undefined for primitive number input", () => {
    expect(parseToolBooleans(42)).toBeUndefined()
  })

  it("filters out non-boolean values from the record", () => {
    const result = parseToolBooleans({ read: true, count: "not-boolean", write: false })
    expect(result).toEqual({ read: true, write: false })
  })

  it("returns undefined when all values are non-boolean", () => {
    const result = parseToolBooleans({ a: "string", b: 123, c: null })
    expect(result).toBeUndefined()
  })

  it("returns empty object for empty record (no boolean entries)", () => {
    // Empty record has 0 entries, filter produces 0, entries.length === 0 → undefined
    const result = parseToolBooleans({})
    expect(result).toBeUndefined()
  })
})

describe("parsePermissionRecord", () => {
  it("returns parsed object for valid record input", () => {
    const result = parsePermissionRecord({ allow: ["read", "write"], deny: ["delete"] })
    expect(result).toEqual({ allow: ["read", "write"], deny: ["delete"] })
  })

  it("returns undefined for non-object string input", () => {
    expect(parsePermissionRecord("not-an-object")).toBeUndefined()
  })

  it("returns undefined for array input", () => {
    expect(parsePermissionRecord([1, 2, 3])).toBeUndefined()
  })

  it("returns undefined for null input", () => {
    expect(parsePermissionRecord(null)).toBeUndefined()
  })

  it("returns undefined for undefined input", () => {
    expect(parsePermissionRecord(undefined)).toBeUndefined()
  })

  it("returns undefined for primitive number input", () => {
    expect(parsePermissionRecord(42)).toBeUndefined()
  })
})
