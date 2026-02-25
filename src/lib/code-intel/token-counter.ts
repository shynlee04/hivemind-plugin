import { readFile } from "node:fs/promises"

type Encoding = "cl100k_base" | "approximation"

const PRIMARY_ENCODING = "cl100k_base"

let cachedEncoder: { encode: (text: string) => number[] } | null | undefined
let activeEncoding: Encoding = PRIMARY_ENCODING

function deterministicFallback(input: string): number {
  const normalized = input.trim()
  if (normalized.length === 0) {
    return 0
  }

  return Math.max(1, Math.ceil(normalized.length / 4))
}

function normalizeCount(value: number): number | null {
  if (!Number.isFinite(value)) {
    return null
  }

  if (value <= 0) {
    return 0
  }

  return Math.ceil(value)
}

function getEncoder(): { encode: (text: string) => number[] } | null {
  if (cachedEncoder !== undefined) {
    return cachedEncoder
  }

  try {
    // Dynamic import at runtime — tiktoken may not be available in all environments
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const tiktoken = require("tiktoken") as { get_encoding: (name: string) => { encode: (text: string) => number[] } }
    cachedEncoder = tiktoken.get_encoding(PRIMARY_ENCODING)
    activeEncoding = PRIMARY_ENCODING
  } catch {
    cachedEncoder = null
    activeEncoding = "approximation"
  }

  return cachedEncoder
}

export function countTokens(content: string): number {
  // Legacy compat: second arg may be an options object with provider
  const legacyOptions = arguments[1] as { provider?: (value: string) => number } | undefined
  const legacyProvider = legacyOptions?.provider
  if (legacyProvider) {
    try {
      const count = normalizeCount(legacyProvider(content))
      if (count !== null) {
        return count
      }
    } catch {
      return deterministicFallback(content)
    }
  }

  const encoder = getEncoder()
  if (!encoder) {
    return deterministicFallback(content)
  }

  try {
    const count = normalizeCount(encoder.encode(content).length)
    if (count === null) {
      cachedEncoder = null
      activeEncoding = "approximation"
      return deterministicFallback(content)
    }

    activeEncoding = PRIMARY_ENCODING
    return count
  } catch {
    cachedEncoder = null
    activeEncoding = "approximation"
    return deterministicFallback(content)
  }
}

export async function countTokensForFile(filePath: string): Promise<number> {
  const content = await readFile(filePath, "utf-8")
  return countTokens(content)
}

export function getEncoding(): string {
  getEncoder()
  return activeEncoding
}
