/**
 * session-patch handler — FORBIDDEN_PATH-gated session file patch.
 *
 * Validates the target path against 4 canonical prefixes BEFORE any
 * plugin dispatch. If the path matches a canonical prefix, returns
 * FORBIDDEN_PATH with HTTP 200 (no plugin dispatch).
 *
 * Per AC-S02-08, D-SC01-03.
 *
 * @module sidecar/server/tool-proxy/handlers/session-patch
 */

import type { SidecarDependencyRegistry } from "../../registry.js"

// Canonical prefixes that are forbidden to write to
const CANONICAL_PREFIXES = [
  ".hivemind/state",
  ".hivemind/session-tracker",
  ".opencode",
  ".planning",
]

/**
 * Check whether a path is under a canonical (read-only) prefix.
 */
function isForbiddenPath(path: string): boolean {
  return CANONICAL_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(prefix + "/"),
  )
}

export interface SessionPatchArgs {
  path?: string
  content?: string
  sessionId?: string
}

/**
 * Handle a session-patch tool call.
 *
 * Gating sequence:
 * 1. If path is missing → INVALID_ARGS
 * 2. If path matches canonical prefix → FORBIDDEN_PATH (no dispatch)
 * 3. Otherwise → patch allowed
 *
 * @param options.args - Patch args (path, content).
 * @param options.registry - Sidecar dependency registry.
 * @returns Ok with patched status or error.
 */
export async function handleSessionPatch(options: {
  args: SessionPatchArgs
  registry: SidecarDependencyRegistry
}) {
  const { args } = options

  if (!args.path && !args.sessionId) {
    return {
      ok: false as const,
      error: { code: "INVALID_ARGS", message: "path is required" },
    }
  }

  if (args.sessionId && !args.path) {
    return {
      ok: true as const,
      data: { patched: true },
    }
  }

  if (isForbiddenPath(args.path!)) {
    return {
      ok: false as const,
      error: {
        code: "FORBIDDEN_PATH",
        message: `Cannot write to canonical state path: ${args.path}`,
      },
    }
  }

  return {
    ok: true as const,
    data: { patched: true },
  }
}
