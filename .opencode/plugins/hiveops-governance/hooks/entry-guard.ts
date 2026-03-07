/**
 * @deprecated DISABLED 2026-03-08 — This plugin is disabled in opencode.json.
 * Reason: References nonexistent GX-Pack scripts, deep cross-layer imports,
 * and duplicates governance already handled by canonical src/hooks/*.
 * Canonical replacement: src/hooks/ (session-lifecycle, soft-governance,
 * tool-gate, compaction, event-handler, messages-transform).
 * See AGENTS.md §Dual-Injection Systems for context.
 *
 * --- Original description ---
 * HiveMind Governance Plugin — Entry Guard Hook
 *
 * Fires on session.created/session.started.
 * Runs scripts/detect-entry.sh and conditionally scripts/auto-init.sh.
 * Persists deterministic entry detection result into enforcement state for
 * downstream context injection.
 */

import { existsSync } from "node:fs"
import { join } from "node:path"
import type { EnforcementState, EntryDetection } from "../types"
import { runNonInteractiveScript } from "../utils"

const DETECT_ENTRY_SCRIPT = "scripts/detect-entry.sh"
const AUTO_INIT_SCRIPT = "scripts/auto-init.sh"
let coreRuntimeEntryOwnerCache: { worktree: string; present: boolean } | null = null

function runScript(worktree: string, relativeScriptPath: string, args: string[] = []): string | null {
  const stdout = runNonInteractiveScript(worktree, relativeScriptPath, args, 8000)
  if (stdout !== null) return stdout
  console.warn(`[hiveops][entry-guard] Script failed: ${relativeScriptPath}`)
  return null
}

function parseDetectionResult(raw: string | null): EntryDetection | null {
  if (!raw) return null

  const jsonMatch = raw.match(/\{[\s\S]*\}\s*$/)
  if (!jsonMatch) return null

  try {
    const parsed = JSON.parse(jsonMatch[0]) as {
      state_exists?: unknown
      lineage?: unknown
      hierarchy_status?: unknown
      trajectory_status?: unknown
      entry_condition?: unknown
    }

    const lineage =
      parsed.lineage === "hivefiver" || parsed.lineage === "hiveminder" ? parsed.lineage : "unresolved"

    const entryCondition =
      parsed.entry_condition === "bootstrap_required" ||
        parsed.entry_condition === "classify_required" ||
        parsed.entry_condition === "ready"
        ? parsed.entry_condition
        : "bootstrap_required"

    return {
      state_exists: parsed.state_exists === true,
      lineage,
      hierarchy_status:
        typeof parsed.hierarchy_status === "string" ? parsed.hierarchy_status : "missing",
      trajectory_status:
        typeof parsed.trajectory_status === "string" ? parsed.trajectory_status : "missing",
      entry_condition: entryCondition,
      detected_at: Date.now(),
    }
  } catch {
    return null
  }
}

/**
 * Detect whether canonical src session-created ownership is present.
 *
 * Plugin session-start hooks must become fallback-only once the src event
 * handler exists for the current worktree.
 *
 * @param worktree Project root being evaluated.
 * @returns `true` when the canonical src event owner is present.
 */
export function coreRuntimeEntryOwnerPresent(worktree: string): boolean {
  if (process.env.GX_FORCE_PLUGIN_ENTRY_BOOTSTRAP === "1") {
    return false
  }
  if (coreRuntimeEntryOwnerCache && coreRuntimeEntryOwnerCache.worktree === worktree) {
    return coreRuntimeEntryOwnerCache.present
  }

  const present = existsSync(join(worktree, "src/hooks/event-handler.ts"))
  coreRuntimeEntryOwnerCache = { worktree, present }
  return present
}

/**
 * Build the plugin session-start entry guard hook.
 *
 * @param state Plugin enforcement state and worktree context.
 * @returns Event hook that runs plugin bootstrap only when src ownership is absent.
 */
export function buildEntryGuardHook(state: {
  current: EnforcementState
  save: (s: EnforcementState) => void
  worktree: string
}) {
  return async ({ event }: { event: any }) => {
    if (!event || (event.type !== "session.created" && event.type !== "session.started")) {
      return
    }
    if (coreRuntimeEntryOwnerPresent(state.worktree)) {
      return
    }

    const detectRaw = runScript(state.worktree, DETECT_ENTRY_SCRIPT, [state.worktree])
    let detection = parseDetectionResult(detectRaw)

    if (!detection) {
      console.warn("[hiveops][entry-guard] detect-entry.sh returned no parseable JSON")
      return
    }

    let bootstrapExecuted = false
    if (detection.entry_condition === "bootstrap_required") {
      const initRaw = runScript(state.worktree, AUTO_INIT_SCRIPT, [state.worktree])
      bootstrapExecuted = initRaw !== null

      const postInitDetectRaw = runScript(state.worktree, DETECT_ENTRY_SCRIPT, [state.worktree])
      const postInitDetection = parseDetectionResult(postInitDetectRaw)
      if (postInitDetection) {
        detection = postInitDetection
      }
    }

    const sessionId =
      event.properties?.sessionID || event.properties?.info?.id || state.current.sessionId || "unknown"

    const classificationPending = detection.entry_condition === "classify_required"
    const classificationDone = detection.entry_condition === "ready" && detection.lineage !== "unresolved"

    state.current = {
      ...state.current,
      sessionId,
      entryDetection: {
        ...detection,
        bootstrap_executed: bootstrapExecuted,
      },
      classificationPending,
      classificationDone,
      intentClassification: undefined,
      lastCheckpoint: Date.now(),
    }

    state.save(state.current)

    console.info(
      `[hiveops][entry-guard] entry_condition=${detection.entry_condition} lineage=${detection.lineage}`,
    )
  }
}
