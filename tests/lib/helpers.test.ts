import { describe, it, expect } from "vitest"
import { isObject, asString, stableStringify, makeToolSignature } from "../../src/lib/helpers.js"

describe("helpers smoke test", () => {
  it("isObject returns true for plain objects", () => {
    expect(isObject({ a: 1 })).toBe(true)
  })

  it("isObject returns false for null", () => {
    expect(isObject(null)).toBe(false)
  })

  it("isObject returns false for arrays", () => {
    expect(isObject([1, 2, 3])).toBe(false)
  })

  it("asString returns non-empty strings, undefined otherwise", () => {
    expect(asString("hello")).toBe("hello")
    expect(asString(42)).toBeUndefined()
    expect(asString(null)).toBeUndefined()
    expect(asString("")).toBeUndefined()
  })

  it("stableStringify produces deterministic JSON", () => {
    const a = { b: 2, a: 1 }
    const b = { a: 1, b: 2 }
    expect(stableStringify(a)).toBe(stableStringify(b))
  })

  it("makeToolSignature creates stable signatures", () => {
    const sig1 = makeToolSignature("read", { path: "/foo" })
    const sig2 = makeToolSignature("read", { path: "/foo" })
    expect(sig1).toBe(sig2)
  })
})
