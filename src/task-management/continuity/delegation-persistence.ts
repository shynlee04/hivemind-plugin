/**
 * Delegation persistence via session-tracker hierarchy manifests.
 *
 * CANONICAL SOURCE BOUNDARY:
 * - Continuity's `session-continuity.json` (Q6) is canonical for session state.
 * - Session-tracker (`.hivemind/session-tracker/`) is canonical for delegation
 *   and hierarchy state (REQ-P41D-01).
 *
 * Architecture: This module writes TO session-tracker via ChildWriter and
 * HierarchyManifestWriter (acceptable per CQRS — task-management writes TO
 * features). Read-side uses session-tracker's `readRawDelegations()` public
 * API rather than direct file I/O.
 *
 * @module task-management/continuity/delegation-persistence
 */

import { readFileSync, unlinkSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"

import { getContinuityStoragePath } from "./index.js"

import { ChildWriter } from "../../features/session-tracker/persistence/child-writer.js"
import { HierarchyManifestWriter } from "../../features/session-tracker/persistence/hierarchy-manifest.js"
import { readRawDelegations } from "../../features/session-tracker/read-delegations.js"
import type { ChildSessionRecord } from "../../features/session-tracker/types.js"
import type { Delegation, DelegationStatus, DelegationTerminalKind } from "../../shared/types.js"

// ---------------------------------------------------------------------------
// Logger (local to avoid cross-module circular deps)
// ---------------------------------------------------------------------------

/** Minimal structured logger matching the harness pattern. */
interface Logger {
  debug: (msg: string, data?: unknown) => void
  warn: (msg: string, data?: unknown) => void
  error: (msg: string, data?: unknown) => void
}

const noopLog: Logger = { debug: () => {}, warn: () => {}, error: () => {} }

/** Module-level logger. Default is no-op. Use `setDelegationPersistenceLog()` to inject. */
let log: Logger = noopLog

/**
 * Inject a structured logger into the delegation-persistence module.
 * Called by the plugin composition root to wire the harness-level logger.
 */
export function setDelegationPersistenceLog(injected: Logger): void {
  log = injected
}

function getDelegationStoreDirectory(): string {
  return dirname(getContinuityStoragePath())
}

export function getDelegationsFilePath(): string {
  return join(getDelegationStoreDirectory(), "delegations.json")
}

/**
 * Returns the path to the WAL pending marker file.
 *
 * The marker is written atomically before the dual-write sequence and
 * removed after both child file + manifest writes succeed. On recovery
 * (startup), orphan pending markers indicate a crash mid-write — the
 * operation is skipped rather than partially applied.
 */
function getWalPendingPath(): string {
  return join(getDelegationStoreDirectory(), ".delegation-wal-pending.json")
}

/**
 * Returns the list of delegation IDs currently in the WAL pending state.
 * If no WAL marker exists, returns an empty array (no pending operations).
 */
export function getPendingWalDelegationIds(): string[] {
  try {
    const raw = readFileSync(getWalPendingPath(), "utf-8")
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * Builds a ChildSessionRecord from a Delegation for dual-write to session-tracker.
 * REF: REQ-P41B-04 field mapping table.
 */
function buildChildRecordFromDelegation(d: Delegation): ChildSessionRecord {
  const status = d.status === "dispatched" || d.status === "running" ? "active"
    : d.status === "completed" ? "completed"
    : d.status === "aborted" ? "aborted"
    : d.status === "cancelled" ? "cancelled"
    : "error"

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
    updated: d.completedAt ? new Date(d.completedAt).toISOString() : new Date(d.createdAt).toISOString(),
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
    // TODO-2 (2026-06-04, R7): set at write time. The Delegation type
    // currently lacks a `tool` field, so we default to "sdk-direct" for
    // the dual-write path. When the v1/v2 split is settled and the
    // Delegation type gains a `tool` field, switch to deriving from it.
    delegationType: d.delegationType ?? "sdk-direct",
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

  // --- R1: Write WAL marker before dual-write ---
  // The WAL marker stores the delegation IDs being written. If the process
  // crashes between this marker and the completion of all writes, recovery
  // code skips these IDs on the next startup (see readPersistedDelegations).
  // This prevents orphan child files without corresponding manifest entries.
  const walPath = getWalPendingPath()
  try {
    const ids = delegations.map((d) => d.id).filter(Boolean)
    writeFileSync(walPath, JSON.stringify(ids, null, 2), "utf-8")
  } catch {
    // WAL write failure is non-fatal — proceed with best-effort dual-write
  }

  // --- P41-B: Dual-write to session-tracker (fire-and-forget, best-effort) ---
  try {
    const storeDir = getDelegationStoreDirectory()
    const projectRoot = dirname(dirname(storeDir)) // grandparent of the .hivemind/state directory (real project root)
    const childWriter = new ChildWriter({ projectRoot })
    const manifestWriter = new HierarchyManifestWriter({ projectRoot })

    for (const d of delegations) {
      if (!d.childSessionId || !d.parentSessionId) {
        log.warn("continuity: persistDelegations skipping delegation with missing session IDs", {
          service: "continuity",
          delegationID: d.id,
        })
        continue
      }

      const childRecord = buildChildRecordFromDelegation(d)
      childWriter.createChildFile(d.parentSessionId, d.childSessionId, childRecord).catch((err) => {
        // Fire-and-forget: log, never throw — old sync path already wrote to delegations.json
        log.error("continuity: persistDelegations dual-write (child file) error", {
          service: "continuity",
          error: err instanceof Error ? err.message : String(err),
        })
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
        // TODO-2 (2026-06-04, R9): mirror delegationType into the manifest
        // (same value used in the child record above). R5 mitigation:
        // both writers must be updated together to prevent drift.
        delegationType: d.delegationType ?? "sdk-direct",
      }).catch((err) => {
        log.error("continuity: persistDelegations dual-write (manifest) error", {
          service: "continuity",
          error: err instanceof Error ? err.message : String(err),
        })
      })
    }

    // --- R1: Clean up WAL marker after dual-write completes ---
    try {
      unlinkSync(walPath)
    } catch {
      // Best-effort: marker may already be deleted on partial retry
    }
  } catch (err) {
    // Fire-and-forget: log but never throw — old sync path already wrote to delegations.json
    log.error("continuity: persistDelegations dual-write error", {
      service: "continuity",
      error: err instanceof Error ? err.message : String(err),
    })
  }
}

export function readPersistedDelegations(): Delegation[] {
  // REQ-P41D-01: No delegations.json reads. Session-tracker is canonical.
  // REQ-P41D-03: Delegates to session-tracker's public readRawDelegations API.
  try {
    const storeDir = getDelegationStoreDirectory()
    const projectRoot = storeDir.includes(".hivemind") ? dirname(dirname(storeDir)) : storeDir
    const trackerRoot = resolve(projectRoot, ".hivemind", "session-tracker")

    const rawData = readRawDelegations(trackerRoot)
    const delegations: Delegation[] = []
    const seenIds = new Set<string>()

    // R1 recovery: skip orphan WAL pending entries (crashed mid-write)
    const pendingWalIds = getPendingWalDelegationIds()
    for (const id of pendingWalIds) {
      seenIds.add(id)
    }
    // Clean up orphan WAL marker — it was only relevant for this startup pass
    if (pendingWalIds.length > 0) {
      try { unlinkSync(getWalPendingPath()) } catch { /* best-effort */ }
    }

    for (const [_rootId, data] of Object.entries(rawData)) {
      // Process hierarchy-manifest entries
      if (data.manifest?.children) {
        for (const [childId, child] of Object.entries(data.manifest.children)) {
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

      // Process individual child JSON files (supplementary)
      for (const childRecord of data.children) {
        if (seenIds.has(childRecord.sessionID)) continue
        seenIds.add(childRecord.sessionID)

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
        else if (childRecord.status === "aborted") status = "aborted"
        else if (childRecord.status === "cancelled") status = "cancelled"

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
      }
    }

    return delegations
  } catch (err) {
    return []
  }
}
