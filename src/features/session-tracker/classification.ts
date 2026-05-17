/**
 * Session classification logic extracted from index.ts.
 *
 * Provides dual-gate (SDK parentID + hierarchy index) plus Gate 3
 * (pending dispatch registry) classification for distinguishing
 * child sessions from main sessions.
 *
 * @module session-tracker/classification
 */

import type { HierarchyIndex } from "./persistence/hierarchy-index.js"
import type { PendingDispatchRegistry } from "./persistence/pending-dispatch-registry.js"

/**
 * Discriminated classification result — impossible to misroute.
 *
 * `kind: "root"` — explicit real root/main session confirmed by SDK root metadata.
 * `kind: "child"` — classified as child with known parent.
 * `kind: "unknownSub"` — all gates failed; defaults to child/sub treatment, never root.
 *
 * RC-3: `gate:"none"` is represented as `kind:"unknownSub"`, never as root/main.
 * Only an explicit real root/main user turn may create a main session directory.
 */
export type ClassificationResult =
  | { kind: "root"; gate: "sdk" }
  | { kind: "child"; parentID: string; gate: "sdk" | "hierarchy" | "pending" | "none" }
  | { kind: "unknownSub"; gate: "none" }

/**
 * Legacy shape for backward compatibility during migration.
 * Consumers that haven't been updated yet can use this helper.
 *
 * @deprecated Use `kind` discriminator instead.
 */
export interface LegacyClassificationResult {
  /** Parent session ID if classified as child, undefined if main session. */
  parentID: string | undefined
  /** How the classification was determined. */
  gate: "sdk" | "hierarchy" | "pending" | "none"
}

/**
 * Converts a discriminated ClassificationResult to the legacy shape.
 *
 * @param result - The new discriminated result.
 * @returns Legacy shape with parentID and gate.
 */
export function toLegacy(result: ClassificationResult): LegacyClassificationResult {
  if (result.kind === "child") {
    return { parentID: result.parentID, gate: result.gate }
  }
  return { parentID: undefined, gate: result.gate }
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
    // Gate 1: SDK parentID. A fetched session with null/undefined parentID is
    // a real root candidate, but hierarchy/pending child evidence below may
    // still override it during SDK race windows.
    let sdkReportedRoot = false
    let parentID: string | undefined
    try {
      const session = await getSessionSafely(sessionID)
      if (session && typeof session === "object" && "parentID" in session) {
        parentID = (session as { parentID?: string | null }).parentID ?? undefined
        sdkReportedRoot = parentID === undefined
      }
    } catch {
      // SDK call failed — proceed to hierarchy index fallback
    }

    if (parentID) {
      return { kind: "child", parentID, gate: "sdk" }
    }

    // Gate 2: Hierarchy index
    if (this.hierarchyIndex) {
      const hierarchyParent = this.hierarchyIndex.getParent(sessionID)
      if (hierarchyParent) {
        return { kind: "child", parentID: hierarchyParent, gate: "hierarchy" }
      }
    }

    // Gate 3: Pending dispatch registry
    if (this.pendingRegistry?.has(sessionID)) {
      const pendingEntry = this.pendingRegistry.get(sessionID)
      if (pendingEntry) {
        return { kind: "child", parentID: pendingEntry.parentSessionID, gate: "pending" }
      }
    }

    if (sdkReportedRoot) {
      return { kind: "root", gate: "sdk" }
    }

    // RC-3: All gates failed — unknown sessions become default-sub, NOT root.
    // Only an explicit real root/main user turn may create a main session directory.
    // This is the root-cause fix: `gate: "none"` maps to `kind: "unknownSub"`, never root.
    return { kind: "unknownSub", gate: "none" }
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
