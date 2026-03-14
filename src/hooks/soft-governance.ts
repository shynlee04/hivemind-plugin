/**
 * Resettable placeholder for runtime toast throttles.
 *
 * The revamp lane does not currently ship human-facing toast throttling, but the
 * function is restored so CLI/plugin integration can preserve the expected public surface.
 */
export function resetToastCooldowns(): void {
  // Intentionally empty until the human-facing governance layer is reattached.
}
