/**
 * Session classification logic extracted from index.ts.
 *
 * Provides dual-gate (SDK parentID + hierarchy index) plus Gate 3
 * (pending dispatch registry) classification for distinguishing
 * child sessions from main sessions.
 *
 * @module session-tracker/classification
 */

import type { OpenCodeClient } from "../../shared/session-api.js"
import type { HierarchyIndex } from "./persistence/hierarchy-index.js"
import type { PendingDispatchRegistry } from "./persistence/pending-dispatch-registry.js"

/**
 * Result of session classification.
 */
export interface ClassificationResult {
  /** Parent session ID if classified as child, undefined if main session. */
  parentID: string | undefined
  /** How the classification was determined. */
  gate: "sdk" | "hierarchy" | "pending" | "none"
}

/**
 * Classifies sessions as child or main using a three-gate fallback chain.
 */
export class SessionClassifier {
  private hierarchyIndex: HierarchyIndex | undefined
  private pendingRegistry: PendingDispatchRegistry | undefined

  /**
   * @param deps - Injected dependencies.
   */
  constructor(deps: {
    client: OpenCodeClient
    hierarchyIndex?: HierarchyIndex
    pendingRegistry?: PendingDispatchRegistry
  }) {
    this.hierarchyIndex = deps.hierarchyIndex
    this.pendingRegistry = deps.pendingRegistry
  }

  /**
   * Classifies a session as child or main using three-gate fallback.
   *
   * Gate 1: SDK parentID (fastest — avoids disk I/O).
   * Gate 2: Hierarchy index (fallback when SDK doesn't report parentID).
   * Gate 3: Pending dispatch registry (race condition guard).
   *
   * @param sessionID - The session to classify.
   * @param getSessionSafely - Function to fetch session from SDK.
   * @returns Classification result with parentID and gate used.
   */
  async classify(
    sessionID: string,
    getSessionSafely: (id: string) => Promise<unknown>,
  ): Promise<ClassificationResult> {
    // Gate 1: SDK parentID
    let parentID: string | undefined
    try {
      const session = await getSessionSafely(sessionID)
      parentID = (session as { parentID?: string } | undefined)?.parentID
    } catch {
      // SDK call failed — proceed to hierarchy index fallback
    }

    if (parentID) {
      return { parentID, gate: "sdk" }
    }

    // Gate 2: Hierarchy index
    if (this.hierarchyIndex) {
      const hierarchyParent = this.hierarchyIndex.getParent(sessionID)
      if (hierarchyParent) {
        return { parentID: hierarchyParent, gate: "hierarchy" }
      }
    }

    // Gate 3: Pending dispatch registry
    if (this.pendingRegistry?.has(sessionID)) {
      const pendingEntry = this.pendingRegistry.get(sessionID)
      if (pendingEntry) {
        return { parentID: pendingEntry.parentSessionID, gate: "pending" }
      }
    }

    return { parentID: undefined, gate: "none" }
  }

  /**
   * Updates the hierarchy index when a child session is discovered.
   *
   * @param parentID - The parent session ID.
   * @param childID - The child session ID.
   */
  registerChild(parentID: string, childID: string): void {
    this.hierarchyIndex?.registerChild(parentID, childID)
  }

  /**
   * Updates the pending registry with a real child ID.
   *
   * @param callID - The tool call ID.
   * @param childID - The discovered child session ID.
   */
  updatePendingWithChildID(callID: string, childID: string): void {
    this.pendingRegistry?.updateWithChildID(callID, childID)
  }

  /**
   * Checks if a child is already registered in the hierarchy index.
   *
   * @param childID - The child session ID.
   * @returns `true` if already registered.
   */
  isChildRegistered(childID: string): boolean {
    return this.hierarchyIndex?.isChild(childID) ?? false
  }
}
