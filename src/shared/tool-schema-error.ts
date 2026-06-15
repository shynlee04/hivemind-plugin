/**
 * Action-aware Zod error formatter for plugin tool wrappers.
 *
 * ## Problem (NF-02 + Pattern A)
 *
 * Plugin tools like `hivemind-doc` expose a flat `args` schema via OpenCode's
 * `tool()` factory. Because the outer `args` schema is shared across all
 * actions of a discriminated-union inner schema, fields that are required
 * for SOME actions but not others (e.g. `heading` for `upsert` but not
 * for `skim`) are declared as `z.string().optional()`. The LLM agent sees
 * the outer shape and — trusting the outer declaration — sends a payload
 * that omits the per-action-required field. The inner Zod schema then
 * throws a bare error:
 *
 *   "Invalid input: expected string, received undefined" — path: ["heading"]
 *
 * The error gives no hint that `heading` is required for the action the
 * agent chose. The LLM retries 2-4 times before re-encoding the call.
 *
 * ## Solution
 *
 * `formatActionAwareZodError` takes the action (when known), the tool name,
 * the ZodError, and a per-tool `requiredHints` table. When the action has
 * an entry in `requiredHints`, the message names ALL required fields
 * (not just the first failing one — the LLM can fix them all at once).
 * When the action is missing or has no entry, the helper falls back to
 * Zod's `prettifyError` so the agent still gets a structured error.
 *
 * @module tool-schema-error
 */
import { z } from "zod"

import type { ToolResponse } from "./tool-response.js"
import { error } from "./tool-response.js"

/**
 * Per-tool table mapping action name to the list of fields the inner
 * schema requires for that action. The LLM-facing outer schema declares
 * these as optional (because the flat `args` shape cannot express
 * per-action-required fields), so the wrapper uses this table to surface
 * a clear hint when the LLM omits them.
 *
 * Example shape:
 *   {
 *     upsert: ["heading", "body"],
 *     append: ["heading", "content"],
 *     write:  ["heading", "body"],
 *   }
 */
export type RequiredHints = Record<string, readonly string[]>

export interface FormatActionAwareZodErrorInput {
  /** Action discriminator value (e.g. `"upsert"`). May be undefined when the LLM omitted it. */
  action: string | undefined
  /** Human-friendly tool name used in the error message. */
  toolName: string
  /** ZodError thrown by the inner schema's `safeParse`. */
  error: z.ZodError
  /** Per-action required-field table. */
  requiredHints: RequiredHints
}

/**
 * Build a `ToolResponse` error envelope whose `message` names the action,
 * the missing field(s), and a remediation hint.
 *
 * Behavior:
 * 1. If `action` is defined AND has an entry in `requiredHints`, format an
 *    action-aware message:
 *      "[Hivemind] {toolName}: action '{action}' requires {field1} (string)
 *       and {field2} (string). Got: undefined for '{field1}'."
 *    The "Got: undefined" suffix mirrors Zod's wording so the LLM can map
 *    it back to its own payload.
 * 2. Otherwise, fall back to `z.prettifyError` so the agent still gets a
 *    structured error envelope.
 *
 * The raw Zod issues are attached in `envelope.data.issues` so tool
 * consumers that want to inspect the structured failure can do so.
 */
export function formatActionAwareZodError(
  input: FormatActionAwareZodErrorInput,
): ToolResponse<{ issues: Array<{ path: PropertyKey[]; message: string }> }> {
  const { action, toolName, error: zodError, requiredHints } = input

  const issues = zodError.issues.map((issue) => ({
    path: issue.path,
    message: issue.message,
  }))

  if (action && Object.prototype.hasOwnProperty.call(requiredHints, action)) {
    const required = requiredHints[action]
    if (required && required.length > 0) {
      const list = required.map((f) => `'${f}' (string)`).join(" and ")
      const failingPath = issues[0]?.path?.[0]
      const failingClause = failingPath !== undefined && (typeof failingPath === "string" || typeof failingPath === "number")
        ? ` Got: undefined for '${String(failingPath)}'.`
        : ""
      const message = `[Hivemind] ${toolName}: action '${action}' requires ${list}.${failingClause}`
      return error(message, { issues })
    }
  }

  // Fallback: no per-action hint available. Use Zod's prettifyError so the
  // agent still gets a structured error rather than a JSON dump.
  const fallback = z.prettifyError(zodError)
  return error(`[Hivemind] ${toolName}: ${fallback}`, { issues })
}
