/**
 * Intent-lock PostToolUse toast handler (AC-40, AC-41).
 *
 * Runs in the PostToolUse chain to surface user-visible feedback when the
 * PreToolUse gate blocks a tool. The hook layer (PreToolUse) cannot show
 * toasts because it has no `client` access — see AD-3 in the SPEC. This
 * handler operates in the plugin layer where the SDK client is available.
 *
 * Per AD-1:
 * - The PreToolUse gate enriches `IntentLockBlockedError` with `guidance`.
 * - The error propagates out of the PreToolUse chain.
 * - This PostToolUse handler catches it and fires a `warning` toast.
 *
 * This handler also exports `activateGateToast` for the plugin to call
 * when a session's gate first becomes active (AC-40).
 */

import { showTuiToast, type OpenCodeClient } from "../../shared/session-api.js"
import { IntentLockBlockedError, type IntentState } from "../../features/intent-lock/types.js"
import { loadToastTemplates } from "../../features/intent-lock/locales/toast-templates.js"
import { getFreshConfig } from "../../config/subscriber.js"

/**
 * Resolve locale for toast strings from the project config.
 * Falls back to "en" on error or missing config.
 */
function resolveToastLocale(projectRoot?: string): string {
  if (!projectRoot) return "en"
  try {
    const config = getFreshConfig(projectRoot)
    const lang = config.conversation_language as string | undefined
    if (lang === "vi" || lang === "zh" || lang === "ja" || lang === "ko" ||
        lang === "fr" || lang === "de" || lang === "es" || lang === "th" ||
        lang === "id") {
      return lang
    }
  } catch {
    // Fall through
  }
  return "en"
}

/**
 * Build a locale-aware toast message from a template.
 */
function resolveTemplate(template: string, vars: Record<string, string>): string {
  let result = template
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), value)
  }
  return result
}

/**
 * Create a PostToolUse handler that catches `IntentLockBlockedError` from
 * the PreToolUse gate and fires a `warning` toast (AC-41).
 *
 * Toast message uses locale-keyed templates (T25).
 *
 * @param client - OpenCode SDK client (must have `tui.showToast`).
 * @returns Async `(input, output) => void` handler.
 */
export function createIntentLockToastHandler(
  client: OpenCodeClient,
): (input: unknown, output: unknown) => Promise<void> {
  return async (_input: unknown, output: unknown) => {
    const outputRecord = output as Record<string, unknown> | undefined
    const error = outputRecord?.error as Error | undefined

    if (!error || !(error instanceof IntentLockBlockedError)) return

    const evidenceList = error.guidance.requiredEvidence.join(", ")
    // No projectRoot passed — locale defaults to English (backward compat for existing tests).
    const templates = loadToastTemplates("en")
    const message = resolveTemplate(templates.gateBlocked, {
      toolName: error.toolName ?? "unknown",
      evidenceList,
    })

    await showTuiToast(client, message, "warning")
  }
}

/**
 * Fire a `info` toast when the gate first activates for a new session (AC-40).
 *
 * Uses locale-keyed templates (T25).
 *
 * @param client - OpenCode SDK client.
 * @param currentState - The state the gate is now in.
 * @param projectRoot - Optional project root for locale resolution.
 */
export async function activateGateToast(
  client: OpenCodeClient,
  currentState: IntentState,
  projectRoot?: string,
): Promise<void> {
  const locale = resolveToastLocale(projectRoot)
  const templates = loadToastTemplates(locale)
  const message = resolveTemplate(templates.gateActive, {
    currentState: String(currentState),
  })

  await showTuiToast(client, message, "info")
}
