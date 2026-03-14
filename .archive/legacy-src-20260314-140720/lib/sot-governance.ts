import { randomUUID } from "node:crypto"
import { existsSync } from "node:fs"

import { readManifest, writeManifest } from "./manifest.js"
import { getEffectivePaths } from "./paths.js"
import { createEvent, eventBus } from "./event-bus.js"
import {
  type PendingChangeNode,
  PendingChangeNodeSchema,
} from "../schemas/graph-nodes.js"
import {
  type PendingChangesState,
  PendingChangesStateSchema,
} from "../schemas/graph-state.js"

export interface VerificationLedgerEntry {
  id: string
  pending_change_id: string
  project_id: string
  status: "verified" | "rejected"
  git_diff_signature: string
  watcher_event_id: string
  commit_hash: string
  notes?: string
  created_at: string
}

export interface VerificationLedgerState {
  version: string
  records: VerificationLedgerEntry[]
}

export interface QueuePendingChangeInput {
  project_id: string
  entity_type: PendingChangeNode["entity_type"]
  entity_id: string
  change_summary: string
  change_payload: Record<string, unknown>
  dependencies?: string[]
  git_diff_signature: string
  watcher_event_id: string
  commit_hash?: string | null
}

export interface VerifyPendingChangeInput {
  pending_change_id: string
  status: "verified" | "rejected"
  git_diff_signature: string
  watcher_event_id: string
  commit_hash: string
  notes?: string
}

const DEFAULT_PENDING_CHANGES_STATE: PendingChangesState = {
  version: "1.0.0",
  pending_changes: [],
}

const DEFAULT_VERIFICATION_LEDGER: VerificationLedgerState = {
  version: "1.0.0",
  records: [],
}

function parsePendingChangesState(raw: unknown): PendingChangesState {
  const parsed = PendingChangesStateSchema.safeParse(raw)
  return parsed.success ? parsed.data : DEFAULT_PENDING_CHANGES_STATE
}

export async function loadPendingChanges(projectRoot: string): Promise<PendingChangesState> {
  const path = getEffectivePaths(projectRoot).graphPendingChanges
  const raw = await readManifest<unknown>(path, DEFAULT_PENDING_CHANGES_STATE)
  return parsePendingChangesState(raw)
}

export async function savePendingChanges(
  projectRoot: string,
  state: PendingChangesState
): Promise<void> {
  const path = getEffectivePaths(projectRoot).graphPendingChanges
  await writeManifest(path, state)
}

export async function loadVerificationLedger(projectRoot: string): Promise<VerificationLedgerState> {
  const path = getEffectivePaths(projectRoot).graphVerificationLedger
  return readManifest<VerificationLedgerState>(path, DEFAULT_VERIFICATION_LEDGER)
}

export async function saveVerificationLedger(
  projectRoot: string,
  state: VerificationLedgerState
): Promise<void> {
  const path = getEffectivePaths(projectRoot).graphVerificationLedger
  await writeManifest(path, state)
}

export async function queuePendingChange(
  projectRoot: string,
  input: QueuePendingChangeInput
): Promise<PendingChangeNode> {
  const now = new Date().toISOString()
  const next: PendingChangeNode = {
    id: randomUUID(),
    project_id: input.project_id,
    entity_type: input.entity_type,
    entity_id: input.entity_id,
    change_summary: input.change_summary,
    change_payload: input.change_payload,
    dependencies: input.dependencies ?? [],
    status: "queued",
    git_diff_signature: input.git_diff_signature,
    watcher_event_id: input.watcher_event_id,
    commit_hash: input.commit_hash ?? null,
    created_at: now,
    updated_at: now,
  }

  const validNode = PendingChangeNodeSchema.parse(next)
  const state = await loadPendingChanges(projectRoot)
  const merged: PendingChangesState = {
    ...state,
    pending_changes: [...state.pending_changes, validNode],
  }
  await savePendingChanges(projectRoot, merged)
  eventBus.emitEvent(
    createEvent(
      "pending_change:queued",
      {
        pendingChangeId: validNode.id,
        entityType: validNode.entity_type,
        entityId: validNode.entity_id,
        gitDiffSignature: validNode.git_diff_signature,
      },
      "sot-governance"
    )
  )
  return validNode
}

export async function verifyPendingChange(
  projectRoot: string,
  input: VerifyPendingChangeInput
): Promise<{ updated: PendingChangeNode | null; ledgerEntry: VerificationLedgerEntry | null }> {
  const state = await loadPendingChanges(projectRoot)
  const index = state.pending_changes.findIndex((entry) => entry.id === input.pending_change_id)
  if (index < 0) {
    return { updated: null, ledgerEntry: null }
  }

  const current = state.pending_changes[index]
  const now = new Date().toISOString()
  const updated: PendingChangeNode = {
    ...current,
    status: input.status,
    git_diff_signature: input.git_diff_signature,
    watcher_event_id: input.watcher_event_id,
    commit_hash: input.commit_hash,
    verification_notes: input.notes,
    verified_at: now,
    updated_at: now,
  }
  state.pending_changes[index] = PendingChangeNodeSchema.parse(updated)
  await savePendingChanges(projectRoot, state)

  const ledger = await loadVerificationLedger(projectRoot)
  const ledgerEntry: VerificationLedgerEntry = {
    id: randomUUID(),
    pending_change_id: input.pending_change_id,
    project_id: updated.project_id,
    status: input.status,
    git_diff_signature: input.git_diff_signature,
    watcher_event_id: input.watcher_event_id,
    commit_hash: input.commit_hash,
    notes: input.notes,
    created_at: now,
  }
  ledger.records.push(ledgerEntry)
  await saveVerificationLedger(projectRoot, ledger)
  eventBus.emitEvent(
    createEvent(
      "pending_change:verified",
      {
        pendingChangeId: updated.id,
        status: updated.status === "rejected" ? "rejected" : "verified",
        commitHash: input.commit_hash,
        watcherEventId: input.watcher_event_id,
        gitDiffSignature: input.git_diff_signature,
      },
      "sot-governance"
    )
  )

  return { updated, ledgerEntry }
}

function resolveEntityStorePath(projectRoot: string, change: PendingChangeNode): string {
  const paths = getEffectivePaths(projectRoot)
  switch (change.entity_type) {
    case "codewiki":
      return `${paths.graphCodebaseCodewikiDir}/entities.json`
    case "codemap":
      return `${paths.graphCodebaseCodemapDir}/entities.json`
    case "code-intel":
      return `${paths.graphCodebaseCodeIntelDir}/entities.json`
    case "repoknowledge":
      return `${paths.graphCodebaseRepoKnowledgeDir}/entities.json`
    case "project":
      return paths.graphProjectJson
    case "requirement":
      return `${paths.graphProjectRequirementsDir}/entities.json`
    case "roadmap":
      return `${paths.graphProjectRoadmapDir}/entities.json`
    case "research":
      return `${paths.graphProjectResearchDir}/entities.json`
    default:
      return `${paths.graphDir}/entities.json`
  }
}

function dependenciesApplied(
  pendingChanges: PendingChangeNode[],
  node: PendingChangeNode
): boolean {
  return node.dependencies.every((dependencyId) =>
    pendingChanges.some((entry) => entry.id === dependencyId && entry.status === "applied")
  )
}

export function isTerminalNode(
  pendingChanges: PendingChangeNode[],
  nodeId: string
): boolean {
  return !pendingChanges.some((entry) => entry.dependencies.includes(nodeId))
}

export async function applyVerifiedPendingChange(
  projectRoot: string,
  pendingChangeId: string
): Promise<{ applied: boolean; reason?: string }> {
  const pendingState = await loadPendingChanges(projectRoot)
  const index = pendingState.pending_changes.findIndex((entry) => entry.id === pendingChangeId)
  if (index < 0) {
    return { applied: false, reason: "pending_change_not_found" }
  }

  const node = pendingState.pending_changes[index]
  if (node.status !== "verified") {
    return { applied: false, reason: "pending_change_not_verified" }
  }
  if (!dependenciesApplied(pendingState.pending_changes, node)) {
    return { applied: false, reason: "dependency_chain_incomplete" }
  }

  const storePath = resolveEntityStorePath(projectRoot, node)
  const now = new Date().toISOString()
  const paths = getEffectivePaths(projectRoot)

  if (storePath === paths.graphProjectJson) {
    const existingProject = await readManifest<Record<string, unknown>>(storePath, {
      version: "1.0.0",
      id: node.project_id,
      created_at: now,
    })
    await writeManifest(storePath, {
      ...existingProject,
      ...node.change_payload,
      id: node.project_id,
      updated_at: now,
      last_change_id: node.id,
    })
  } else {
    const existingStore = await readManifest<Record<string, unknown>>(storePath, { entities: {} })
    const entities =
      typeof existingStore.entities === "object" && existingStore.entities !== null
        ? { ...(existingStore.entities as Record<string, unknown>) }
        : {}
    const previous =
      typeof entities[node.entity_id] === "object" && entities[node.entity_id] !== null
        ? (entities[node.entity_id] as Record<string, unknown>)
        : {}

    entities[node.entity_id] = {
      ...previous,
      ...node.change_payload,
      entity_id: node.entity_id,
      updated_at: now,
      last_change_id: node.id,
    }
    await writeManifest(storePath, { version: "1.0.0", entities })
  }

  pendingState.pending_changes[index] = {
    ...node,
    status: "applied",
    applied_at: now,
    updated_at: now,
  }
  await savePendingChanges(projectRoot, pendingState)

  return { applied: true }
}

export async function markPendingChangeStale(
  projectRoot: string,
  pendingChangeId: string
): Promise<{ stale: boolean; reason?: string }> {
  const state = await loadPendingChanges(projectRoot)
  const index = state.pending_changes.findIndex((entry) => entry.id === pendingChangeId)
  if (index < 0) {
    return { stale: false, reason: "pending_change_not_found" }
  }

  if (!isTerminalNode(state.pending_changes, pendingChangeId)) {
    return { stale: false, reason: "only_terminal_node_can_be_marked_stale" }
  }

  const node = state.pending_changes[index]
  state.pending_changes[index] = {
    ...node,
    verification_notes: [
      node.verification_notes ?? "",
      "staleness:terminal-node-only",
    ]
      .filter(Boolean)
      .join(" | "),
    updated_at: new Date().toISOString(),
  }
  await savePendingChanges(projectRoot, state)
  return { stale: true }
}

export async function ensureSotGovernanceFiles(projectRoot: string): Promise<void> {
  const paths = getEffectivePaths(projectRoot)

  const now = new Date().toISOString()
  const entityStores = [
    `${paths.graphCodebaseCodewikiDir}/entities.json`,
    `${paths.graphCodebaseCodemapDir}/entities.json`,
    `${paths.graphCodebaseCodeIntelDir}/entities.json`,
    `${paths.graphCodebaseRepoKnowledgeDir}/entities.json`,
    `${paths.graphProjectRequirementsDir}/entities.json`,
    `${paths.graphProjectRoadmapDir}/entities.json`,
    `${paths.graphProjectResearchDir}/entities.json`,
  ]
  for (const entityStorePath of entityStores) {
    if (!existsSync(entityStorePath)) {
      await writeManifest(entityStorePath, {
        version: "1.0.0",
        entities: {},
        updated_at: now,
      })
    }
  }

  if (!existsSync(paths.graphProjectJson)) {
    await writeManifest(paths.graphProjectJson, {
      version: "1.0.0",
      id: randomUUID(),
      created_at: now,
      updated_at: now,
    })
  }

  if (!existsSync(paths.graphPendingChanges)) {
    await savePendingChanges(projectRoot, DEFAULT_PENDING_CHANGES_STATE)
  }
  if (!existsSync(paths.graphVerificationLedger)) {
    await saveVerificationLedger(projectRoot, DEFAULT_VERIFICATION_LEDGER)
  }
}
