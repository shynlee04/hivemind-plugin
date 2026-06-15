/**
 * Shared before-hook utility for ToolDelegation & ToolCapture.
 *
 * Consolidates pollForChildSessions(), registerPendingDispatch(), and
 * writeImmediateChildFile() into a single shared module so both handlers
 * use the same polling and registration logic.
 *
 * @module session-tracker/capture/tool-before-helper
 */

import { getChildSessions } from "../../../shared/session-api.js"
import type { OpenCodeClient } from "../../../shared/session-api.js"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Dependencies required by the shared before-hook utility functions.
 *
 * All fields are optional to support gradual adoption — a caller that
 * only needs registration doesn't need childWriter, for example.
 */
export interface PollDeps {
  client: {
    app?: { log?: (msg: { body: { service: string; level: string; message: string; extra?: Record<string, unknown> } }) => void }
    session?: {
      children?(params: { path: { id: string } }): Promise<{ data?: Array<{ id: string; parentID?: string }> }>
    }
  }
  classifier: {
    registerChild(parentID: string, childID: string): void
    updatePendingWithChildID(callID: string, childID: string): void
    isChildRegistered(id: string): boolean
  }
  pendingRegistry?: {
    add(entry: { parentSessionID: string; callID: string; subagentType: string; timestamp: number; tool: string }): void
    get?(key: string): { subagentType?: string; tool?: string; childSessionID?: string } | undefined
    getByParent?(parentSessionID: string): Array<{ subagentType?: string; tool?: string; childSessionID?: string }> | undefined
  }
  childWriter?: {
    createChildFile(parentID: string, sessionID: string, metadata: Record<string, unknown>): Promise<void>
  }
  hierarchyIndex?: {
    registerChild(parentID: string, childID: string): void
    getDepth?(sessionID: string): number
  }
}

// ---------------------------------------------------------------------------
// registerPendingDispatch
// ---------------------------------------------------------------------------

/**
 * Registers a pending dispatch entry in the pending registry.
 *
 * Extracted from ToolDelegation.handleToolExecuteBefore() to be shared
 * with ToolCapture.handleToolExecuteBefore(). Creates a tracking entry
 * that persists across the delegation lifecycle for actor attribution.
 *
 * @param deps - Poll dependencies.
 * @param params - Registration parameters (sessionID, callID, subagentType, tool).
 */
export async function registerPendingDispatch(
  deps: PollDeps,
  params: {
    sessionID: string
    callID: string
    subagentType: string
    tool: string
  },
): Promise<void> {
  if (!deps.pendingRegistry) return
  deps.pendingRegistry.add({
    parentSessionID: params.sessionID,
    callID: params.callID,
    subagentType: params.subagentType || "unknown",
    timestamp: Date.now(),
    tool: params.tool ?? "task",
  })
}

// ---------------------------------------------------------------------------
// writeImmediateChildFile
// ---------------------------------------------------------------------------

/**
 * Writes a child .json file immediately when a child session is discovered.
 *
 * Called from pollForChildSessions() when a new child session ID is found.
 * Creates the on-disk child record proactively rather than waiting for
 * tool.execute.after or lifecycle events (REQ-62-03).
 *
 * @param deps - Poll dependencies (needs childWriter, hierarchyIndex, pendingRegistry).
 * @param sessionID - The discovered child session ID.
 * @param parentID - The parent session ID.
 * @param subagentType - Optional subagent type override.
 * @param delegationDepth - Optional delegation depth override.
 */
export async function writeImmediateChildFile(
  deps: Pick<PollDeps, "childWriter" | "hierarchyIndex" | "pendingRegistry">,
  sessionID: string,
  parentID: string,
  subagentType?: string,
  delegationDepth?: number,
  status?: string,
): Promise<void> {
  if (!deps.childWriter) return

  const now = new Date().toISOString()
  const pendingEntry = deps.pendingRegistry?.get?.(sessionID) ??
    (Array.isArray(deps.pendingRegistry?.getByParent?.(parentID))
      ? (deps.pendingRegistry?.getByParent?.(parentID) as Array<{ subagentType?: string; tool?: string; childSessionID?: string }>)[0]
      : deps.pendingRegistry?.getByParent?.(parentID)) as
      { subagentType?: string; tool?: string; childSessionID?: string } | undefined
  const agentType = subagentType ?? pendingEntry?.subagentType ?? "unknown"

  let depth = delegationDepth ?? 1
  if (deps.hierarchyIndex) {
    deps.hierarchyIndex.registerChild(parentID, sessionID)
    depth = delegationDepth ?? deps.hierarchyIndex.getDepth?.(sessionID) ?? 1
  }

  const delegationType = pendingEntry?.tool === "delegate-task" ? "async-spawn" as const
    : pendingEntry?.tool === "task" ? "native-task" as const
    : pendingEntry?.tool === "execute-slash-command" ? "slash-cmd" as const
    : "sdk-direct" as const

  const childStatus = status ?? "active"

  await deps.childWriter.createChildFile(parentID, sessionID, {
    sessionID,
    parentSessionID: parentID,
    delegationDepth: depth,
    delegatedBy: {
      agentName: agentType,
      model: "",
      tool: pendingEntry?.tool ?? "task",
      description: "",
      subagentType: agentType,
    },
    created: now,
    updated: now,
    status: childStatus,
    mainAgent: {
      name: agentType,
      model: "",
    },
    turns: [],
    children: [],
    journey: [],
    delegationType,
  })
}

// ---------------------------------------------------------------------------
// pollForChildSessions
// ---------------------------------------------------------------------------

/**
 * Polls client.session.children() to discover child sessions after dispatch.
 *
 * Extracted from ToolDelegation.pollForChildSessions() and enhanced to call
 * writeImmediateChildFile() on child discovery (REQ-62-03). Polls every 200ms
 * for up to 5 attempts. Fire-and-forget — never blocks the caller.
 *
 * @param deps - Poll dependencies.
 * @param parentID - The parent session ID to check children for.
 * @param callID - The tool call ID for pending registry cleanup.
 */
export async function pollForChildSessions(
  deps: PollDeps,
  parentID: string,
  callID: string,
): Promise<void> {
  const MAX_ATTEMPTS = 5
  const POLL_INTERVAL_MS = 200

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      // Feature-detect session.children() before calling
      if (!deps.client?.session) {
        return
      }
      const entries = await getChildSessions(deps.client as OpenCodeClient, parentID)
      const newChildren = entries.filter(
        (c) => c.sessionID && !deps.classifier.isChildRegistered(c.sessionID),
      )

      if (newChildren.length > 0) {
        for (const child of newChildren) {
          if (child.sessionID) {
            deps.classifier.registerChild(parentID, child.sessionID)
            deps.classifier.updatePendingWithChildID(callID, child.sessionID)

            // REQ-62-03: Immediately write child .json — don't wait
            // for tool.execute.after or lifecycle events.
            if (deps.childWriter && deps.hierarchyIndex) {
              await writeImmediateChildFile(
                { childWriter: deps.childWriter, hierarchyIndex: deps.hierarchyIndex, pendingRegistry: deps.pendingRegistry },
                child.sessionID,
                parentID,
              )
            }
          }
        }
        return
      }
    } catch {
      // Server API may not be ready — retry after interval
    }
    if (attempt < MAX_ATTEMPTS - 1) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))
    }
  }
}

// ---------------------------------------------------------------------------
// Re-exports from handlers/types.ts for backward compatibility
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// finalPollForChildSessions
// ---------------------------------------------------------------------------

/**
 * Post-execution final poll for child sessions.
 *
 * Called after delegation completes (tool.execute.after) to catch any
 * child sessions discovered late — particularly cancellation races where
 * the child was cleaned up before the main polling loop found it.
 *
 * This is a ONE-SHOT poll (1 attempt, no retry loop) because:
 * - The delegation has already completed
 * - If the child wasn't found in 5 attempts, one more attempt is unlikely
 * - But it costs nothing and catches edge cases
 *
 * @param deps - Poll dependencies (client, classifier, childWriter, etc.).
 * @param parentID - The parent session ID.
 */
export async function finalPollForChildSessions(
  deps: PollDeps,
  parentID: string,
): Promise<void> {
  try {
    // Feature-detect session.children() before calling
    if (!deps.client?.session) {
      return
    }
    const entries = await getChildSessions(deps.client as OpenCodeClient, parentID)
    const undiscovered = entries.filter(
      (c) => c.sessionID && !deps.classifier.isChildRegistered(c.sessionID),
    )
    for (const child of undiscovered) {
      if (child.sessionID) {
        deps.classifier.registerChild(parentID, child.sessionID)
        if (deps.childWriter && deps.hierarchyIndex) {
          await writeImmediateChildFile(
            { childWriter: deps.childWriter, hierarchyIndex: deps.hierarchyIndex, pendingRegistry: deps.pendingRegistry },
            child.sessionID,
            parentID,
          )
        }
      }
    }
  } catch {
    // Best-effort: failures are logged but not propagated
  }
}

// ---------------------------------------------------------------------------
// Re-exports from handlers/types.ts for backward compatibility
// ---------------------------------------------------------------------------

// Re-export writeImmediateChildFile from handlers/types for backward compat.
// When handlers/types.ts writeImmediateChildFile is refactored to use this
// module as the single source of truth, the re-export direction reverses.
export type { PollDeps as PollDepsType } from "./tool-before-helper.js"
