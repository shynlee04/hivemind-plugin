type TokenProvider = (content: string) => number

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

export function countTokens(input: string, options?: { provider?: TokenProvider }): number {
  const provider = options?.provider
  if (!provider) {
    return deterministicFallback(input)
  }

  try {
    const count = normalizeCount(provider(input))
    if (count === null) {
      return deterministicFallback(input)
    }

    return count
  } catch {
    return deterministicFallback(input)
  }
}
