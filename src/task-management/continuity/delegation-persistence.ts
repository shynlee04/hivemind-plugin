import { readdirSync, readFileSync, existsSync } from "node:fs"
import { dirname, join, resolve } from "node:path"

import { getContinuityStoragePath } from "./index.js"

import { ChildWriter } from "../../features/session-tracker/persistence/child-writer.js"
import { HierarchyManifestWriter } from "../../features/session-tracker/persistence/hierarchy-manifest.js"
import type { ChildSessionRecord, HierarchyManifest } from "../../features/session-tracker/types.js"
import type { Delegation, DelegationStatus, DelegationTerminalKind } from "../../shared/types.js"

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
    lastMessage: d.result ?? d.error,
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
    const projectRoot = dirname(dirname(storeDir)) // grandparent of the .hivemind/state directory (real project root)
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
        status: d.status,
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
  try {
    const storeDir = getDelegationStoreDirectory()
    const projectRoot = storeDir.includes(".hivemind") ? dirname(dirname(storeDir)) : storeDir
    const trackerRoot = resolve(projectRoot, ".hivemind", "session-tracker")
    if (!existsSync(trackerRoot)) {
      return []
    }

    const delegations: Delegation[] = []
    const rootDirs = readdirSync(trackerRoot, { withFileTypes: true })
      .filter((e) => e.isDirectory() && e.name.startsWith("ses"))
      .map((e) => e.name)

    const seenIds = new Set<string>()

    for (const rootId of rootDirs) {
      const manifestPath = resolve(trackerRoot, rootId, "hierarchy-manifest.json")
      if (existsSync(manifestPath)) {
        try {
          const raw = readFileSync(manifestPath, "utf-8")
          const manifest = JSON.parse(raw) as HierarchyManifest
          if (manifest.children) {
            for (const [childId, child] of Object.entries(manifest.children)) {
              if (seenIds.has(childId)) continue
              seenIds.add(childId)
              delegations.push({
                id: childId,
                parentSessionId: child.parentSessionID,
                childSessionId: childId,
                agent: child.subagentType ?? "unknown",
                status: child.status as DelegationStatus,
                createdAt: new Date(child.createdAt).getTime(),
                completedAt: child.status !== "active" && child.updatedAt ? new Date(child.updatedAt).getTime() : undefined,
                executionMode: "sdk",
                surface: "agent-delegation",
                recoveryGuarantee: "resumable",
                workingDirectory: projectRoot,
                ptySessionId: undefined,
                fallbackReason: undefined,
                queueKey: "",
                nestingDepth: child.delegationDepth ?? 1,
                terminalKind: child.status !== "active" ? (child.status as DelegationTerminalKind) : undefined,
                terminationSignal: undefined,
                explicitCancellation: false,
                lastMessageCount: 0,
                stablePollCount: 0,
              })
            }
          }
        } catch {
          // ignore manifest error, check files directly
        }
      }

      // Also scan direct child JSON files to be safe
      try {
        const files = readdirSync(resolve(trackerRoot, rootId), { withFileTypes: true })
        for (const file of files) {
          if (file.isFile() && file.name.endsWith(".json") && file.name !== "hierarchy-manifest.json" && file.name !== "session-continuity.json") {
            const childId = file.name.slice(0, -5)
            if (seenIds.has(childId)) continue
            seenIds.add(childId)
            const filePath = resolve(trackerRoot, rootId, file.name)
            try {
              const raw = readFileSync(filePath, "utf-8")
              const childRecord = JSON.parse(raw) as ChildSessionRecord
              
              let result: string | undefined
              let error: string | undefined
              if (childRecord.status === "completed") {
                result = childRecord.lastMessage
              } else if (childRecord.status === "error") {
                error = childRecord.lastMessage
              }

              let status: DelegationStatus = "running"
              if (childRecord.status === "completed") status = "completed"
              else if (childRecord.status === "error") status = "error"

              delegations.push({
                id: childRecord.sessionID,
                parentSessionId: childRecord.parentSessionID,
                childSessionId: childRecord.sessionID,
                agent: childRecord.mainAgent?.name ?? childRecord.delegatedBy?.subagentType ?? "unknown",
                status,
                result,
                error,
                createdAt: new Date(childRecord.created).getTime(),
                completedAt: childRecord.status !== "active" ? new Date(childRecord.updated).getTime() : undefined,
                executionMode: childRecord.delegatedBy?.tool === "task" ? "sdk" : "headless",
                surface: "agent-delegation",
                recoveryGuarantee: "resumable",
                workingDirectory: projectRoot,
                ptySessionId: undefined,
                fallbackReason: undefined,
                queueKey: "",
                nestingDepth: childRecord.delegationDepth,
                terminalKind: childRecord.status !== "active" ? (childRecord.status as DelegationTerminalKind) : undefined,
                terminationSignal: undefined,
                explicitCancellation: false,
                messageCount: childRecord.turns.length,
                actionCount: childRecord.turns.reduce((acc, t) => acc + (t.tools?.length ?? 0), 0),
                finalMessageExcerpt: childRecord.lastMessage,
                lastMessageCount: childRecord.turns.length,
                stablePollCount: 0,
              })
            } catch {
              // ignore
            }
          }
        }
      } catch {
        // ignore
      }
    }

    return delegations
  } catch (err) {
    return []
  }
}
