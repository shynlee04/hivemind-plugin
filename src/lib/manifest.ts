/**
 * Manifest Layer — typed relational manifests for .hivemind/
 *
 * This module centralizes manifest schemas and CRUD behavior so relationships
 * are explicit and traversable (no implicit "hope the agent remembers").
 */

import { existsSync } from "fs"
import { mkdir, readFile, rename, writeFile } from "fs/promises"
import { dirname } from "path"
import { STRUCTURE_VERSION, getEffectivePaths, type HivemindPaths } from "./paths.js"
import type { TaskManifest } from "../schemas/manifest.js"

// ─── Core Relationship Trace (SOT -> materialization chain) ────────────────

export type CoreNode = "codemap" | "codewiki" | "plans" | "sessions" | "tasks" | "sub_tasks"
export type CoreRelation = "governs" | "materializes"

export interface CoreRelationship {
  from: CoreNode
  to: CoreNode
  relation: CoreRelation
}

export function getCoreMaterializationChain(): CoreRelationship[] {
  return [
    { from: "codemap", to: "plans", relation: "governs" },
    { from: "codewiki", to: "plans", relation: "governs" },
    { from: "plans", to: "sessions", relation: "materializes" },
    { from: "sessions", to: "tasks", relation: "materializes" },
    { from: "tasks", to: "sub_tasks", relation: "materializes" },
  ]
}

// ─── Root-level manifests ───────────────────────────────────────────────────

export interface RootManifest {
  version: string
  structure_format: typeof STRUCTURE_VERSION
  created: number
  sub_manifests: string[]
  governance_sot: {
    codemap: { manifest: string; role: "source_of_truth" }
    codewiki: { manifest: string; role: "source_of_truth" }
  }
  materialization_chain: CoreRelationship[]
}

export interface StateManifest {
  files: Array<{ name: string; purpose: string; last_modified: number }>
}

export type SessionStatus = "active" | "archived" | "compacted" | "suspended" | string

export interface SessionManifestEntry {
  stamp: string
  file: string
  status: SessionStatus
  created: number
  updated_at_epoch?: number
  created_at_iso?: string
  updated_at_iso?: string
  contract_version?: string
  summary?: string
  mode?: string
  trajectory?: string
  session_id?: string | string[] | string[]
  linked_plans: string[]
}

export interface SessionManifest {
  sessions: SessionManifestEntry[]
  active_stamp: string | null
}

export type PlanType = "root" | "sub" | "atomic"
export type PlanStatus = "pending" | "active" | "complete" | "blocked"
export type PlanValidationState = "pending" | "validated" | "failed" | "skipped"
export type PlanDomain = "frontend" | "backend" | "api" | "data" | "persistence" | "hooks" | "sdk" | "meta" | "infra"
export type PlanPurpose = "discovery" | "research" | "planning" | "implementation" | "testing" | "verification" | "debugging"

export interface PlanManifestEntry {
  id: string
  type: PlanType
  prefix: string                // META01, PROJ01-SUB01, etc.
  status: PlanStatus
  created: number
  updated_at_epoch?: number
  created_at_iso?: string
  updated_at_iso?: string
  contract_version?: string
  slug: string
  path: string                  // relative path within plans/
  parent_id: string | null      // FK to parent plan
  root_id: string | null        // FK to root plan
  linked_sessions: string[]
  linked_graph_plan_id: string | null  // FK to graph/plans.json
  domain: PlanDomain
  purpose: PlanPurpose
  validation_state: PlanValidationState
  dependencies: string[]        // other plan IDs
}

export interface PlanManifest {
  plans: PlanManifestEntry[]
}

export interface MemoryManifest {
  shelves: Record<string, { count: number; last_updated: number }>
}

// Level 0 SOT manifests (future-facing placeholders)
export interface CodemapManifest {
  version: string
  source_of_truth: true
  generated_at: number
  nodes: Array<{ id: string; path: string; kind: string; hash?: string }>
}

export interface CodewikiManifest {
  version: string
  source_of_truth: true
  generated_at: number
  articles: Array<{ id: string; title: string; path: string; tags: string[] }>
}

// Task graph manifests (Phase 05 execution layer, type-safe now)
export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled" | "blocked"
export type FileAction = "create" | "update" | "delete" | "rename" | "move" | "read" | "execute" | "other"

export interface SubTaskManifestEntry {
  id: string
  stamp: string
  status: TaskStatus
  description: string
  agent: "main" | "subagent"
  tools_used: string[]
  files_touched: Array<{ path: string; action: FileAction }>
  linked_artifacts: string[]
  started_at: number
  completed_at?: number
  commit_hash?: string
  last_message_digest?: string
  metadata_commit_count: number
}

export interface TaskManifestEntry {
  id: string
  stamp: string
  status: TaskStatus
  description: string
  session_stamp: string
  linked_plan_ids: string[]
  linked_sot: Array<"codemap" | "codewiki">
  sub_tasks: SubTaskManifestEntry[]
  created: number
  updated: number
}

export interface TaskGraphManifest {
  tasks: TaskManifestEntry[]
  active_task_id: string | null
  updated_at: number
}

const MANIFEST_CONTRACT_VERSION = "1.1.0"

// ─── Generic CRUD ───────────────────────────────────────────────────────────

export async function readManifest<T>(manifestPath: string, fallback?: T): Promise<T> {
  try {
    const raw = await readFile(manifestPath, "utf-8")
    return JSON.parse(raw) as T
  } catch (err: unknown) {
    if (fallback !== undefined) {
      return fallback
    }
    throw err
  }
}

export async function writeManifest<T>(manifestPath: string, data: T): Promise<void> {
  await mkdir(dirname(manifestPath), { recursive: true })
  const tempPath = `${manifestPath}.tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  await writeFile(tempPath, JSON.stringify(data, null, 2), "utf-8")
  await rename(tempPath, manifestPath)
}

// ─── Defaults ───────────────────────────────────────────────────────────────

export function createDefaultRootManifest(paths: HivemindPaths, created = Date.now()): RootManifest {
  return {
    version: "1.0.0",
    structure_format: STRUCTURE_VERSION,
    created,
    sub_manifests: [
      paths.stateManifest,
      paths.memoryManifest,
      paths.sessionsManifest,
      paths.plansManifest,
      paths.codemapManifest,
      paths.codewikiManifest,
    ],
    governance_sot: {
      codemap: { manifest: paths.codemapManifest, role: "source_of_truth" },
      codewiki: { manifest: paths.codewikiManifest, role: "source_of_truth" },
    },
    materialization_chain: getCoreMaterializationChain(),
  }
}

export function createDefaultStateManifest(now = Date.now()): StateManifest {
  return {
    files: [
      { name: "brain.json", purpose: "runtime state and governance counters", last_modified: now },
      { name: "hierarchy.json", purpose: "hierarchy tree and cursor", last_modified: now },
      { name: "anchors.json", purpose: "immutable anchors", last_modified: now },
      { name: "tasks.json", purpose: "tasks and sub-task graph", last_modified: now },
    ],
  }
}

export function createDefaultSessionManifest(): SessionManifest {
  return { sessions: [], active_stamp: null }
}

export function createDefaultPlanManifest(): PlanManifest {
  return { plans: [] }
}

export function createDefaultMemoryManifest(): MemoryManifest {
  return { shelves: {} }
}

export function createDefaultTaskGraphManifest(now = Date.now()): TaskGraphManifest {
  return { tasks: [], active_task_id: null, updated_at: now }
}

export function createDefaultCodemapManifest(now = Date.now()): CodemapManifest {
  return {
    version: "1.0.0",
    source_of_truth: true,
    generated_at: now,
    nodes: [],
  }
}

export function createDefaultCodewikiManifest(now = Date.now()): CodewikiManifest {
  return {
    version: "1.0.0",
    source_of_truth: true,
    generated_at: now,
    articles: [],
  }
}

// ─── Session manifest operations ────────────────────────────────────────────

function uniq(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))]
}

function rankStatus(status: SessionStatus): number {
  if (status === "active") return 3
  if (status === "compacted") return 2
  if (status === "archived") return 1
  return 0
}

function mergeSessionEntry(a: SessionManifestEntry, b: SessionManifestEntry): SessionManifestEntry {
  const status = rankStatus(a.status) >= rankStatus(b.status) ? a.status : b.status
  const summary = b.summary ?? a.summary
  const mode = b.mode ?? a.mode
  const trajectory = b.trajectory ?? a.trajectory
  const file = b.file || a.file

  const sessionIdA = Array.isArray(a.session_id) ? a.session_id : (a.session_id ? [a.session_id] : []);
  const sessionIdB = Array.isArray(b.session_id) ? b.session_id : (b.session_id ? [b.session_id] : []);
  const sessionIds = uniq([...sessionIdA, ...sessionIdB]);
  const createdAtIso = a.created_at_iso ?? b.created_at_iso
  const updatedAtEpoch = Math.max(a.updated_at_epoch ?? 0, b.updated_at_epoch ?? 0) || undefined
  const updatedAtIso = b.updated_at_iso ?? a.updated_at_iso
  const contractVersion = b.contract_version ?? a.contract_version

  return {
    stamp: a.stamp,
    file,
    status,
    created: Math.min(a.created, b.created),
    updated_at_epoch: updatedAtEpoch,
    created_at_iso: createdAtIso,
    updated_at_iso: updatedAtIso,
    contract_version: contractVersion,
    summary,
    mode,
    trajectory,
    session_id: sessionIds.length === 1 ? sessionIds[0] : (sessionIds.length > 0 ? sessionIds : undefined),
    linked_plans: uniq([...(a.linked_plans ?? []), ...(b.linked_plans ?? [])]),
  }
}

function stampSessionTemporalFields(
  entry: SessionManifestEntry,
  now = Date.now(),
): SessionManifestEntry {
  return {
    ...entry,
    created_at_iso: entry.created_at_iso ?? new Date(entry.created).toISOString(),
    updated_at_epoch: now,
    updated_at_iso: new Date(now).toISOString(),
    contract_version: MANIFEST_CONTRACT_VERSION,
  }
}

function stampPlanTemporalFields(
  entry: PlanManifestEntry,
  now = Date.now(),
): PlanManifestEntry {
  return {
    ...entry,
    created_at_iso: entry.created_at_iso ?? new Date(entry.created).toISOString(),
    updated_at_epoch: now,
    updated_at_iso: new Date(now).toISOString(),
    contract_version: MANIFEST_CONTRACT_VERSION,
  }
}

function normalizeSessionEntry(entry: SessionManifestEntry): SessionManifestEntry {
  return {
    ...entry,
    linked_plans: uniq(entry.linked_plans ?? []),
  }
}

export function deduplicateSessionManifest(manifest: SessionManifest): SessionManifest {
  const byStamp = new Map<string, SessionManifestEntry>()

  for (const raw of manifest.sessions) {
    const entry = normalizeSessionEntry(raw)
    const existing = byStamp.get(entry.stamp)
    if (!existing) {
      byStamp.set(entry.stamp, entry)
      continue
    }
    byStamp.set(entry.stamp, mergeSessionEntry(existing, entry))
  }

  const sessions = [...byStamp.values()].sort((a, b) => a.created - b.created)
  const validActive = manifest.active_stamp && byStamp.has(manifest.active_stamp) ? manifest.active_stamp : null

  let activeStamp = validActive
  if (!activeStamp) {
    const latestActive = [...sessions].reverse().find((s) => s.status === "active")
    activeStamp = latestActive?.stamp ?? null
  }

  const normalizedSessions = sessions.map((entry) => {
    if (activeStamp && entry.stamp === activeStamp) {
      return { ...entry, status: "active" }
    }
    if (entry.status === "active") {
      return { ...entry, status: "archived" }
    }
    return entry
  })

  return {
    sessions: normalizedSessions,
    active_stamp: activeStamp,
  }
}

export interface RegisterSessionInput {
  stamp: string
  file: string
  created?: number
  mode?: string
  trajectory?: string
  session_id?: string
  linked_plans?: string[]
}

export function registerSessionInManifest(
  manifest: SessionManifest,
  input: RegisterSessionInput,
): SessionManifest {
  const now = Date.now()
  const normalized = deduplicateSessionManifest(manifest)
  const sessions = normalized.sessions.map((entry) =>
    entry.status === "active" ? { ...entry, status: "archived" } : entry,
  )

  const existingIndex = sessions.findIndex((s) => s.stamp === input.stamp)
  const nextEntry = stampSessionTemporalFields({
    stamp: input.stamp,
    file: input.file,
    status: "active",
    created: input.created ?? now,
    mode: input.mode,
    trajectory: input.trajectory,
    session_id: input.session_id,
    linked_plans: uniq(input.linked_plans ?? []),
  }, now)

  if (existingIndex >= 0) {
    const merged = mergeSessionEntry(sessions[existingIndex], nextEntry)
    sessions[existingIndex] = stampSessionTemporalFields(
      {
        ...merged,
        status: "active",
      },
      now,
    )
  } else {
    sessions.push(nextEntry)
  }

  return deduplicateSessionManifest({
    sessions,
    active_stamp: input.stamp,
  })
}

export interface LinkSessionToPlanResult {
  sessionsManifest: SessionManifest
  plansManifest: PlanManifest
  linked: boolean
}

export function linkSessionToPlan(
  sessionsManifest: SessionManifest,
  plansManifest: PlanManifest,
  sessionStamp: string,
  planId: string,
): LinkSessionToPlanResult {
  const now = Date.now()
  const sessionDeduped = deduplicateSessionManifest(sessionsManifest)
  const sessionIndex = sessionDeduped.sessions.findIndex((s) => s.stamp === sessionStamp)
  const planIndex = plansManifest.plans.findIndex((p) => p.id === planId)

  if (sessionIndex < 0 || planIndex < 0) {
    return {
      sessionsManifest: sessionDeduped,
      plansManifest,
      linked: false,
    }
  }

  const nextSessions = [...sessionDeduped.sessions]
  const targetSession = nextSessions[sessionIndex]
  nextSessions[sessionIndex] = stampSessionTemporalFields({
    ...targetSession,
    linked_plans: uniq([...(targetSession.linked_plans ?? []), planId]),
  }, now)

  const nextPlans = [...plansManifest.plans]
  const targetPlan = nextPlans[planIndex]
  nextPlans[planIndex] = stampPlanTemporalFields({
    ...targetPlan,
    linked_sessions: uniq([...(targetPlan.linked_sessions ?? []), sessionStamp]),
  }, now)

  return {
    sessionsManifest: {
      sessions: nextSessions,
      active_stamp: sessionDeduped.active_stamp,
    },
    plansManifest: {
      plans: nextPlans,
    },
    linked: true,
  }
}

export interface MemLike {
  shelf: string
  created_at: number
}

export interface MemsLikeState {
  mems: MemLike[]
}

export function updateMemoryManifest(
  manifest: MemoryManifest,
  memsState: MemsLikeState,
): MemoryManifest {
  const nextShelves: MemoryManifest["shelves"] = { ...manifest.shelves }
  const grouped = new Map<string, { count: number; last_updated: number }>()

  for (const mem of memsState.mems) {
    const current = grouped.get(mem.shelf)
    if (!current) {
      grouped.set(mem.shelf, { count: 1, last_updated: mem.created_at })
      continue
    }
    grouped.set(mem.shelf, {
      count: current.count + 1,
      last_updated: Math.max(current.last_updated, mem.created_at),
    })
  }

  for (const [shelf, data] of grouped.entries()) {
    nextShelves[shelf] = data
  }

  for (const shelf of Object.keys(nextShelves)) {
    if (!grouped.has(shelf)) {
      nextShelves[shelf] = {
        count: 0,
        last_updated: nextShelves[shelf].last_updated,
      }
    }
  }

  return { shelves: nextShelves }
}

// ─── Bootstrap helper ───────────────────────────────────────────────────────

export async function ensureCoreManifests(paths: HivemindPaths): Promise<void> {
  if (!existsSync(paths.rootManifest)) {
    await writeManifest(paths.rootManifest, createDefaultRootManifest(paths))
  }
  if (!existsSync(paths.stateManifest)) {
    await writeManifest(paths.stateManifest, createDefaultStateManifest())
  }
  if (!existsSync(paths.sessionsManifest)) {
    await writeManifest(paths.sessionsManifest, createDefaultSessionManifest())
  }
  if (!existsSync(paths.plansManifest)) {
    await writeManifest(paths.plansManifest, createDefaultPlanManifest())
  }
  if (!existsSync(paths.memoryManifest)) {
    await writeManifest(paths.memoryManifest, createDefaultMemoryManifest())
  }
  if (!existsSync(paths.codemapManifest)) {
    await writeManifest(paths.codemapManifest, createDefaultCodemapManifest())
  }
  if (!existsSync(paths.codewikiManifest)) {
    await writeManifest(paths.codewikiManifest, createDefaultCodewikiManifest())
  }
}

// ─── Task Manifest Helpers ──────────────────────────────────────────────────

/**
 * @deprecated Use `loadGraphTasks` from `src/lib/graph-io.ts` instead.
 */
export async function loadTasks(directory: string): Promise<TaskManifest | null> {
  const path = getEffectivePaths(directory).tasks
  return readManifest<TaskManifest | null>(path, null)
}

/**
 * @deprecated Use `saveGraphTasks`/`addGraphTask` from `src/lib/graph-io.ts` instead.
 */
export async function saveTasks(directory: string, manifest: TaskManifest): Promise<void> {
  const path = getEffectivePaths(directory).tasks
  await writeManifest(path, manifest)
}
