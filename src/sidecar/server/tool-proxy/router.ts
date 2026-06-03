/**
 * TOOL_HANDLERS dispatch map — explicit whitelist for 7 write tool proxies.
 *
 * Per D-SC02-09: TOOL_HANDLERS is an explicit whitelist. Adding an 8th tool
 * requires adding a new entry to this map + a new POST route stub in
 * routes/tools.ts. The whitelist is the source of truth; routes/tools.ts
 * enumerates it at module load to assert the invariant.
 *
 * @module sidecar/server/tool-proxy/router
 */

import type { SidecarDependencyRegistry } from "../registry.js"

import { ERROR_CODES } from "../routes/types.js"

// ── Tool handler type ────────────────────────────────────────

/**
 * Signature for a tool handler function.
 *
 * @typeParam TArgs   - Parsed request arguments.
 * @typeParam TResult - Response data type on success.
 */
export type ToolHandler<TArgs = unknown, TResult = unknown> = (
  args: TArgs,
  registry: SidecarDependencyRegistry,
) => Promise<
  | { ok: true; data: TResult }
  | { ok: false; error: { code: string; message: string } }
>

// ── Create handler helper (stub factory) ─────────────────────

/**
 * Create a stub handler that resolves to a success with default data.
 * Used in W1 before real handler implementations exist (W2).
 */
function stubHandler(name: string): ToolHandler {
  return async () => {
    return { ok: true, data: { [name]: true } }
  }
}

// ── TOOL_HANDLERS map (7 stubs, replaced with real in W2) ────

/**
 * Registered write tool handlers. Each entry maps a tool name to its
 * async handler function. Stub entries are replaced with real handler
 * imports in W2.
 */
export const TOOL_HANDLERS: Record<string, ToolHandler> = {
  "delegate-task": stubHandler("delegationId"),
  "delegation-status": stubHandler("status"),
  "execute-slash-command": stubHandler("output"),
  "hivemind-trajectory": stubHandler("events"),
  "hivemind-session-view": stubHandler("sessionId"),
  "session-patch": stubHandler("patched"),
  "hivemind-command-engine": stubHandler("routes"),
}

// ── Dispatch function ────────────────────────────────────────

export interface DispatchOptions {
  registry: SidecarDependencyRegistry
  toolName: string
  args: unknown
}

/**
 * Dispatch a tool call to the registered TOOL_HANDLERS entry.
 *
 * @param options - Dispatch options including tool name, args, and registry.
 * @returns Tool response or UNKNOWN_TOOL error.
 */
export async function dispatchToolHandler(
  options: DispatchOptions,
): Promise<
  | { ok: true; data: unknown }
  | { ok: false; error: { code: string; message: string } }
> {
  const handler = TOOL_HANDLERS[options.toolName]
  if (!handler) {
    return {
      ok: false,
      error: {
        code: ERROR_CODES.UNKNOWN_TOOL,
        message: `Unknown tool: ${options.toolName}`,
      },
    }
  }
  return handler(options.args, options.registry)
}

/**
 * List of registered write tool names, derived from TOOL_HANDLERS keys.
 * Used by routes/tools.ts and handler.test.ts to assert the whitelist invariant.
 */
export const REGISTERED_WRITE_TOOLS = Object.keys(
  TOOL_HANDLERS,
) as Array<keyof typeof TOOL_HANDLERS>
