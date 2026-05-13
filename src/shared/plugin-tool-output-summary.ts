import { redactTextSecrets } from "./security/redaction.js"

const TOOL_OUTPUT_SUMMARY_LIMIT = 240

/**
 * Builds a redacted, single-line summary for plugin tool completion metadata.
 *
 * @param output - Raw tool output value returned by OpenCode.
 * @returns A redacted summary capped to the plugin metadata limit.
 *
 * @example
 * ```typescript
 * summarizePluginToolOutput({ ok: true })
 * ```
 */
export function summarizePluginToolOutput(output: unknown): string {
  const raw = typeof output === "string" ? output : JSON.stringify(output ?? "completed")
  const redacted = redactTextSecrets(raw ?? "completed")
  const normalized = redacted.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim()
  if (!normalized) return "completed"
  return normalized.length <= TOOL_OUTPUT_SUMMARY_LIMIT ? normalized : `${normalized.slice(0, TOOL_OUTPUT_SUMMARY_LIMIT - 1)}…`
}
