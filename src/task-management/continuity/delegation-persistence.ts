import { dirname, join } from "node:path"

import { getContinuityStoragePath } from "./index.js"

import { ChildWriter } from "../../features/session-tracker/persistence/child-writer.js"
import { HierarchyManifestWriter } from "../../features/session-tracker/persistence/hierarchy-manifest.js"
import type { ChildSessionRecord } from "../../features/session-tracker/types.js"
import type { Delegation } from "../../shared/types.js"

function getDelegationStoreDirectory(): string {
  return dirname(getContinuityStoragePath())
}

export function getDelegationsFilePath(): string {
  return join(getDelegationStoreDirectory(), "delegations.json")
}

/**
 * Builds a ChildSessionRecord from a Delegation for dual-write to session-tracker.
 * REF: REQ-P41B-04 field mapping table.
 */
function buildChildRecordFromDelegation(d: Delegation): ChildSessionRecord {
  const status = d.status === "dispatched" || d.status === "running" ? "active"
    : d.status === "completed" ? "completed"
    : "error" // timeout / error both map to error

  return {
    sessionID: d.childSessionId,
    parentSessionID: d.parentSessionId,
    delegationDepth: d.nestingDepth ?? 1,
    delegatedBy: {
      agentName: d.agent,
      model: "",
      tool: "task",
      description: d.prompt ?? "",
      subagentType: "",
    },
    created: new Date(d.createdAt).toISOString(),
    updated: d.completedAt ? new Date(d.completedAt).toISOString() : new Date().toISOString(),
    status,
    mainAgent: { name: d.agent, model: "" },
    turns: [],
    children: [],
    // 7 new gap fields (P41-B)
    queueKey: d.queueKey || undefined,
    terminalKind: d.terminalKind,
    recoveryGuarantee: d.recoveryGuarantee,
    executionMode: d.executionMode,
  }
}

export function persistDelegations(delegations: Delegation[]): void {
  // G-4 (REQ-21-13): Delegations are ALWAYS persisted — removed commit_docs gate.
  // commit_docs schema field is KEPT for GSD framework (162+ refs).
  // The gate was a CA-03 design error: commit_docs controls git commits, not delegation persistence.
  //
  // If opt-out is needed in future, add a separate `persist_delegations` config field.
  //
  // REQ-P41D-01: No delegations.json file I/O. Session-tracker is canonical.

  // --- P41-B: Dual-write to session-tracker (fire-and-forget, best-effort) ---
  try {
    const storeDir = getDelegationStoreDirectory()
    const projectRoot = dirname(storeDir) // parent of the .hivemind/state directory
    const childWriter = new ChildWriter({ projectRoot })
    const manifestWriter = new HierarchyManifestWriter({ projectRoot })

    for (const d of delegations) {
      if (!d.childSessionId || !d.parentSessionId) {
        console.warn(`[Harness] persistDelegations dual-write: skipping delegation ${d.id} — missing session IDs`)
        continue
      }

      const childRecord = buildChildRecordFromDelegation(d)
      childWriter.createChildFile(d.parentSessionId, d.childSessionId, childRecord).catch((err) => {
        // Fire-and-forget: log, never throw — old sync path already wrote to delegations.json
        console.error(`[Harness] persistDelegations dual-write (child file): ${err instanceof Error ? err.message : String(err)}`)
      })

      manifestWriter.addChild({
        rootMainSessionID: d.parentSessionId, // fallback — correct for depth-1; regeneratable from continuity
        childSessionID: d.childSessionId,
        parentSessionID: d.parentSessionId,
        delegationDepth: d.nestingDepth ?? 1,
        delegatedBy: d.agent,
        subagentType: "",
        childFile: `${d.childSessionId}.json`,
      }).catch((err) => {
        console.error(`[Harness] persistDelegations dual-write (manifest): ${err instanceof Error ? err.message : String(err)}`)
      })
    }
  } catch (err) {
    // Fire-and-forget: log but never throw — old sync path already wrote to delegations.json
    console.error(`[Harness] persistDelegations dual-write error: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export function readPersistedDelegations(): Delegation[] {
  // REQ-P41D-01: No delegations.json reads. Session-tracker is canonical.
  return []
}
