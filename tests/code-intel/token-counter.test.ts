import { describe, it } from "node:test"
import assert from "node:assert/strict"

const codeIntelModuleHref = new URL("../../src/lib/code-intel/index.ts", import.meta.url).href

type CountTokens = (input: string, options?: { provider?: (content: string) => number }) => number

function deterministicFallback(input: string): number {
  const normalized = input.trim()
  if (normalized.length === 0) return 0
  return Math.max(1, Math.ceil(normalized.length / 4))
}

describe("Wave 4 Slice 3 RED - token-counter contract", () => {
  it("exports countTokens from src/lib/code-intel/index.ts", async () => {
    const codeIntel = await import(codeIntelModuleHref)
    assert.equal(typeof codeIntel.countTokens, "function")
  })

  it("uses deterministic fallback when provider path throws", async () => {
    const codeIntel = await import(codeIntelModuleHref)
    const countTokens = codeIntel.countTokens as CountTokens | undefined

    assert.equal(typeof countTokens, "function")
    if (!countTokens) {
      throw new Error("Expected countTokens export")
    }

    const input = "export const greeting = 'hello hivemind'"
    const throwingProvider = (): number => {
      throw new Error("provider unavailable")
    }

    const first = countTokens(input, { provider: throwingProvider })
    const second = countTokens(input, { provider: throwingProvider })

    assert.equal(first, deterministicFallback(input))
    assert.equal(second, deterministicFallback(input))
    assert.equal(second, first)
  })
})
