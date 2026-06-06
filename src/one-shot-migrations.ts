/**
 * One-shot data migrations and init-time recovery operations.
 *
 * Each function runs at most once per project directory (sentinel-file guard)
 * and is fire-and-forget from the plugin composition root — a failure never
 * blocks plugin initialisation.
 *
 * @module one-shot-migrations
 */

import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"

import type { OpenCodeClient } from "./shared/session-api.js"
import { listSessionContinuity, patchSessionContinuity } from "./task-management/continuity/index.js"
import { enrichContinuityListWithTracker } from "./task-management/continuity/continuity-reader.js"
import { appendTuiPrompt } from "./shared/session-api.js"
import { getManualOverrideState } from "./features/session-tracker/index.js"

// ---------------------------------------------------------------------------
// CP-ST-03 D-03: Remove legacy .hivemind/event-tracker/
// ---------------------------------------------------------------------------

/**
 * Remove the legacy `.hivemind/event-tracker/` directory if it still exists.
 *
 * Guarded by a sentinel file so it runs at most once per project directory.
 * Failures are logged but never thrown — this is best-effort cleanup.
 *
 * @param projectDirectory - Absolute path to the project root.
 * @param client - OpenCode SDK client for TUI logging (may be partial).
 */
export function runEventTrackerMigration(projectDirectory: string, client: OpenCodeClient): void {
  const sentinelPath = join(projectDirectory, ".hivemind", "state", "event-tracker-migration-done")
  const legacyDir = join(projectDirectory, ".hivemind", "event-tracker")
  try {
    if (existsSync(sentinelPath)) return
    if (existsSync(legacyDir)) {
      rmSync(legacyDir, { recursive: true, force: true })
      const stateDir = join(projectDirectory, ".hivemind", "state")
      if (!existsSync(stateDir)) mkdirSync(stateDir, { recursive: true })
      writeFileSync(sentinelPath, new Date().toISOString(), "utf-8")
      void client.app?.log?.({
        body: {
          service: "migration",
          level: "info",
          message: "[Harness] CP-ST-03: removed legacy .hivemind/event-tracker/",
        },
      })
    }
  } catch (err) {
    void client.app?.log?.({
      body: {
        service: "migration",
        level: "warn",
        message: "[Harness] CP-ST-03: legacy event-tracker migration failed",
        extra: { error: err instanceof Error ? err.message : String(err) },
      },
    })
  }
}

// ---------------------------------------------------------------------------
// P41-D D-02, D-03: Remove legacy delegations.json + session-continuity.json
// ---------------------------------------------------------------------------

/**
 * Remove legacy `.hivemind/state/delegations.json` and `session-continuity.json`
 * files that were replaced by the session-tracker subsystem.
 *
 * Guarded by a sentinel file so it runs at most once per project directory.
 * Failures are logged but never thrown — this is best-effort cleanup.
 *
 * @param projectDirectory - Absolute path to the project root.
 * @param client - OpenCode SDK client for TUI logging (may be partial).
 */
export function runLegacyFileMigration(projectDirectory: string, client: OpenCodeClient): void {
  const sentinelPath = join(projectDirectory, ".hivemind", "state", "delegations-migration-done")
  const delegationsPath = join(projectDirectory, ".hivemind", "state", "delegations.json")
  const continuityPath = join(projectDirectory, ".hivemind", "state", "session-continuity.json")
  try {
    if (existsSync(sentinelPath)) return
    let deletedAny = false
    if (existsSync(delegationsPath)) {
      rmSync(delegationsPath, { force: true })
      deletedAny = true
    }
    if (existsSync(continuityPath)) {
      rmSync(continuityPath, { force: true })
      deletedAny = true
    }
    if (deletedAny) {
      const stateDir = join(projectDirectory, ".hivemind", "state")
      if (!existsSync(stateDir)) mkdirSync(stateDir, { recursive: true })
      writeFileSync(sentinelPath, new Date().toISOString(), "utf-8")
      void client.app?.log?.({
        body: {
          service: "migration",
          level: "info",
          message: "[Harness] P41-D: removed legacy .hivemind/state/delegations.json and session-continuity.json",
        },
      })
    }
  } catch (err) {
    void client.app?.log?.({
      body: {
        service: "migration",
        level: "warn",
        message: "[Harness] P41-D: legacy file migration failed",
        extra: { error: err instanceof Error ? err.message : String(err) },
      },
    })
  }
}

// ---------------------------------------------------------------------------
// Init-time pending notification drain
// ---------------------------------------------------------------------------

/**
 * Drain pending delegation notifications from ALL continuity records
 * and replay them into the TUI via appendTuiPrompt. Called at plugin init
 * to recover notifications that were queued while the parent session was ended.
 *
 * Best-effort: failures during replay are silently ignored — the continuity
 * array is cleared regardless to prevent duplicate replay on next init.
 *
 * Double-notification prevention: the lifecycle handler already calls
 * patchSessionContinuity(sessionID, { pendingNotifications: [] }) during
 * session.created/session.updated events. The init-time drain also clears
 * after replay. Since both use patchSessionContinuity to write and
 * listSessionContinuity to read fresh data each time, whichever runs first
 * clears the array and the other sees empty. No duplicate notifications.
 *
 * @param client - OpenCode SDK client for TUI operations.
 * @param projectDirectory - Absolute path to the project root (optional).
 */
export async function replayPendingDelegationNotifications(client: OpenCodeClient, projectDirectory?: string): Promise<void> {
  const allSessions = listSessionContinuity()
  const sessionRecords = projectDirectory
    ? await enrichContinuityListWithTracker(Object.values(allSessions), projectDirectory)
    : Object.values(allSessions)
  for (const record of sessionRecords) {
    const pending = record.metadata.pendingNotifications ?? []
    if (pending.length === 0) continue
    const sessionId = record.sessionID
    if (!sessionId) continue
    for (const notification of pending) {
      // P58 (G5, REQ-58-05, D-58-11): respect manualOverride flag — if a human
      // operator has taken over the session, do NOT auto-inject orchestrator
      // notifications. The sessionId is the parent session that owns the
      // notification; if a take-over was issued, suppress the replay.
      const overrideState = getManualOverrideState(sessionId)
      if (overrideState?.manualOverride === true) {
        continue
      }
      const line = notification.resultPreview ??
        `Delegation ${notification.metadata?.delegationId ?? "unknown"} ${notification.status}`
      try {
        await appendTuiPrompt(client, line)
      } catch {
        break  // best-effort: stop replay on first failure
      }
    }
    patchSessionContinuity(sessionId, { pendingNotifications: [] })
  }
}
