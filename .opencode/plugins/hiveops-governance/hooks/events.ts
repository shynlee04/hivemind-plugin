/**
 * HiveMind Governance Plugin — Event Hook (FULLY WIRED)
 *
 * Deterministic script triggers on OpenCode events:
 *
 * session.created/started → gx-entry-guard.sh + gx-first-turn-refresh.sh
 * session.completed/idle  → gx-handoff-purify.sh + gx-sot-register.sh
 * todo.updated            → gx-todo-sync.sh
 * file.edited/created     → gx-schema-sync.sh validate (on .hivemind/state/ files)
 *
 * Cross-platform: macOS + Linux + Windows (Git Bash / WSL)
 */

import type { EnforcementState } from "../types"
import { runGxScript, runGxScriptAsync } from "../utils"
import { coreRuntimeEntryOwnerPresent } from "./entry-guard"

/**
 * Build the plugin event hook.
 *
 * @param state Plugin enforcement state and worktree context.
 * @returns Event hook that keeps session-start GX scripts fallback-only.
 */
export function buildEventHook(state: {
  current: EnforcementState
  save: (s: EnforcementState) => void
  worktree: string
}) {
  // Track whether session-start scripts already ran (idempotency)
  let sessionBootstrapped = false

  return async ({ event }: { event: any }) => {
    if (!event || !event.type) return

    switch (event.type) {
      // ── SESSION START ──────────────────────────────────────────────────
      // Chain 1: gx-entry-guard.sh → builds runtime-profile.json
      // Chain 2: gx-first-turn-refresh.sh → validates all state files
      case "session.created":
      case "session.started": {
        if (coreRuntimeEntryOwnerPresent(state.worktree)) {
          return
        }

        // Reset enforcement state
        state.current = {
          ...state.current,
          sessionId: event.properties?.sessionID || state.current.sessionId,
          turnCount: 0,
          delegationChain: [],
          scopeViolations: [],
          lastCheckpoint: Date.now(),
        }
        state.save(state.current)

        // Run session bootstrap scripts (once per session)
        if (!sessionBootstrapped) {
          sessionBootstrapped = true

          // 1. Build runtime profile (determines agent capabilities)
          runGxScript(state.worktree, "gx-entry-guard.sh")

          // 2. Validate all state files are fresh + valid
          runGxScript(state.worktree, "gx-first-turn-refresh.sh")
        }
        break
      }

      // ── SESSION END ────────────────────────────────────────────────────
      // Chain 5: gx-handoff-purify.sh → builds purified handoff archive
      //          gx-sot-register.sh   → indexes artifacts (stub, Phase 3)
      case "session.completed":
      case "session.idle": {
        state.save(state.current)

        // Build purified handoff for next session
        runGxScriptAsync(state.worktree, "gx-handoff-purify.sh")

        // Register in SOT index (stub until R5)
        runGxScriptAsync(state.worktree, "gx-sot-register.sh")

        // Reset bootstrap flag for next session
        sessionBootstrapped = false
        break
      }

      // ── TODO CHANGED ───────────────────────────────────────────────────
      // Chain 3: gx-todo-sync.sh → syncs TODO items ↔ hierarchy nodes
      case "todo.updated": {
        state.current = {
          ...state.current,
          lastCheckpoint: Date.now(),
        }

        // Sync TODO state with hierarchy graph
        const action = event.properties?.action || "sync"
        const itemId = event.properties?.item_id || ""
        runGxScript(state.worktree, "gx-todo-sync.sh", [action, itemId])
        break
      }

      // ── FILE EDITED ────────────────────────────────────────────────────
      // Chain 7: gx-schema-sync.sh validate → validates schema on state file writes
      case "file.edited":
      case "file.created": {
        const filePath = (event.properties?.path || "") as string
        state.current = {
          ...state.current,
          lastCheckpoint: Date.now(),
        }

        // Only validate schema for .hivemind/state/ JSON files
        if (filePath && filePath.includes(".hivemind/state/") && filePath.endsWith(".json")) {
          runGxScriptAsync(state.worktree, "gx-schema-sync.sh", ["validate", filePath])
        }
        break
      }
    }
  }
}
