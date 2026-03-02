/**
 * HiveMind Governance Plugin — Event Hook (SDK-ALIGNED v2)
 *
 * Deterministic script triggers on OpenCode events.
 *
 * SDK Event Types (from @opencode-ai/sdk types.gen.d.ts):
 *
 * session.created  → { info: Session }          → gx-entry-guard.sh + gx-first-turn-refresh.sh
 * session.idle     → { sessionID: string }       → gx-handoff-purify.sh + gx-sot-register.sh
 * todo.updated     → { sessionID, todos: Todo[] } → gx-todo-sync.sh
 * file.edited      → { file: string }            → gx-schema-sync.sh validate
 * file.watcher.updated → { file, event: "add"|"change"|"unlink" } → gx-schema-sync.sh validate
 *
 * Cross-platform: macOS + Linux + Windows (Git Bash / WSL)
 */

import { writeFileSync, mkdirSync, existsSync } from "node:fs"
import { join } from "node:path"
import type { EnforcementState } from "../types"
import { runGxScript, runGxScriptAsync } from "../utils"

export function buildEventHook(state: {
  current: EnforcementState
  save: (s: EnforcementState) => void
  worktree: string
}) {
  // Track whether session-start scripts already ran (idempotency)
  let sessionBootstrapped = false

  return async ({ event }: { event: any }) => {
    if (!event || !event.type) return

    // ── SMOKE TEST: Log every event to marker file ──
    try {
      const markerDir = join(state.worktree, ".hivemind", "state")
      if (!existsSync(markerDir)) mkdirSync(markerDir, { recursive: true })
      const markerPath = join(markerDir, "plugin-smoke-test.json")
      const marker = {
        last_event: event.type,
        timestamp: new Date().toISOString(),
        epoch: Date.now(),
        total_events_seen: (state.current.turnCount || 0),
      }
      writeFileSync(markerPath, JSON.stringify(marker, null, 2), "utf-8")
    } catch {
      // Never crash the plugin for smoke test
    }

    switch (event.type) {
      // ── SESSION START ──────────────────────────────────────────────────
      // SDK: EventSessionCreated → { type: "session.created", properties: { info: Session } }
      // Session.id = the session ID
      case "session.created": {
        const sessionId = event.properties?.info?.id || state.current.sessionId

        // Reset enforcement state
        state.current = {
          ...state.current,
          sessionId,
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

      // ── SESSION IDLE / END ──────────────────────────────────────────────
      // SDK: EventSessionIdle → { type: "session.idle", properties: { sessionID: string } }
      // Note: "session.completed" does NOT exist — "session.idle" is the end signal
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
      // SDK: EventTodoUpdated → { type: "todo.updated", properties: { sessionID, todos: Todo[] } }
      // Todo = { content: string, status: string, priority: string, id: string }
      case "todo.updated": {
        state.current = {
          ...state.current,
          lastCheckpoint: Date.now(),
        }

        // Sync TODO state with hierarchy graph
        // Pass the todos count as context for the sync script
        const todosCount = Array.isArray(event.properties?.todos) ? event.properties.todos.length : 0
        runGxScript(state.worktree, "gx-todo-sync.sh", ["sync", String(todosCount)])
        break
      }

      // ── FILE EDITED ────────────────────────────────────────────────────
      // SDK: EventFileEdited → { type: "file.edited", properties: { file: string } }
      // Note: property is "file", NOT "path"
      case "file.edited": {
        const filePath = (event.properties?.file || "") as string
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

      // ── FILE WATCHER (covers file creation) ────────────────────────────
      // SDK: EventFileWatcherUpdated → { type: "file.watcher.updated", properties: { file, event: "add"|"change"|"unlink" } }
      case "file.watcher.updated": {
        const filePath = (event.properties?.file || "") as string
        const fileEvent = event.properties?.event as string

        if (fileEvent === "add" || fileEvent === "change") {
          state.current = {
            ...state.current,
            lastCheckpoint: Date.now(),
          }

          // Only validate schema for .hivemind/state/ JSON files
          if (filePath && filePath.includes(".hivemind/state/") && filePath.endsWith(".json")) {
            runGxScriptAsync(state.worktree, "gx-schema-sync.sh", ["validate", filePath])
          }
        }
        break
      }
    }
  }
}
