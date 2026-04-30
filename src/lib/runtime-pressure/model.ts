import type { PressureBand, PressureClassification, PressureClassificationInput, PressureTier } from "./types.js"

/**
 * Return the pressure band for a clamped 0-9 tier.
 *
 * @param tier - Runtime pressure tier from 0 through 9.
 * @returns The escalation band assigned to the tier.
 *
 * @example
 * ```typescript
 * getPressureBand(6) // "gated"
 * ```
 */
export function getPressureBand(tier: PressureTier): PressureBand {
  if (tier <= 2) return "steady"
  if (tier <= 4) return "advisory"
  if (tier <= 7) return "gated"
  return "blocking"
}

/**
 * Classify runtime pressure into a tier and escalation band.
 *
 * @param input - Direct tier or numeric score to clamp into the 0-9 range.
 * @returns A pure pressure classification.
 */
export function classifyRuntimePressure(input: PressureClassificationInput = {}): PressureClassification {
  const tier = clampPressureTier(input.tier ?? input.score ?? 0)
  return { tier, band: getPressureBand(tier) }
}

/**
 * Clamp a numeric pressure value into the 0-9 integer tier range.
 *
 * @param value - Untrusted numeric pressure value.
 * @returns Safe pressure tier.
 */
export function clampPressureTier(value: number): PressureTier {
  if (!Number.isFinite(value)) return 0
  const clamped = Math.max(0, Math.min(9, Math.trunc(value)))
  return clamped as PressureTier
}
