/**
 * Soft governance — runtime toast throttling via SDK showToast().
 *
 * Uses the SDK client's showToast() to surface non-blocking governance
 * signals to the user, replacing the previous no-op placeholder.
 *
 * Authority: src/hooks/AGENTS.md, src/plugin/AGENTS.md (sdk-first principle)
 */

import { withClient } from './sdk-context.js'

/** Cooldown tracking per toast category (ms) */
const toastCooldowns = new Map<string, number>()

/** Minimum interval between toasts of the same category (5 seconds) */
const TOAST_COOLDOWN_MS = 5_000

/**
 * Show a governance toast to the user if the SDK client is available.
 * Throttled per category to avoid spamming.
 *
 * @param category - Toast category for throttling (e.g. 'mutation-gate', 'workflow-warning')
 * @param message - Message to display
 */
export async function showGovernanceToast(category: string, message: string): Promise<void> {
  const now = Date.now()
  const lastShown = toastCooldowns.get(category) ?? 0

  if (now - lastShown < TOAST_COOLDOWN_MS) {
    return
  }

  toastCooldowns.set(category, now)

  await withClient(async (client) => {
    await client.tui.showToast({
      body: { message, variant: 'info' },
    })
  })
}

/**
 * Reset all toast cooldowns. Called on SDK context reset.
 */
export function resetToastCooldowns(): void {
  toastCooldowns.clear()
}
