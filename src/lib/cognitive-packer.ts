import { existsSync, readFileSync } from "fs"

import type { MemNode, PhaseNode, TaskNode } from "../schemas/graph-nodes.js"
import {
  GraphMemsStateSchema,
  GraphTasksStateSchema,
  PlansStateSchema,
  TrajectoryStateSchema,
} from "../schemas/graph-state.js"
import { calculateRelevanceScore, isMemStale } from "./staleness.js"
import { getEffectivePaths } from "./paths.js"

const EPOCH_ISO = "1970-01-01T00:00:00.000Z"

type BrainLike = {
  metrics?: {
    drift_score?: unknown
  }
}

type PhaseRaw = {
  id?: unknown
  title?: unknown
  status?: unknown
  order?: unknown
  created_at?: unknown
  updated_at?: unknown
}

type PlanWithPhasesRaw = {
  id?: unknown
  phases?: unknown
}

function readJsonFile(filePath: string): unknown | null {
  if (!existsSync(filePath)) {
    return null
  }

  try {
    return JSON.parse(readFileSync(filePath, "utf-8")) as unknown
  } catch {
    return null
  }
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
}

function latestTimestamp(values: Array<string | null | undefined>): string {
  const normalized = values.filter((value): value is string => typeof value === "string" && value.length > 0)
  if (normalized.length === 0) {
    return EPOCH_ISO
  }

  return normalized.sort().at(-1) ?? EPOCH_ISO
}

function buildEmptyStateXml(session: string): string {
  return [
    `<hivemind_state timestamp="${EPOCH_ISO}" session="${escapeXml(session)}">`,
    "  <trajectory />",
    "  <context_summary>",
    "    <mems count=\"0\" relevant=\"0\" />",
    "    <files_touched count=\"0\" />",
    "    <drift_score value=\"0\" />",
    "  </context_summary>",
    "</hivemind_state>",
  ].join("\n")
}

function getDriftScore(projectRoot: string): number {
  const brainRaw = readJsonFile(getEffectivePaths(projectRoot).brain)
  if (brainRaw === null || typeof brainRaw !== "object") {
    return 0
  }

  const drift = (brainRaw as BrainLike).metrics?.drift_score
  if (typeof drift !== "number" || Number.isNaN(drift)) {
    return 0
  }

  return drift
}

function toPhaseNode(planId: string, raw: PhaseRaw): PhaseNode | null {
  if (
    typeof raw.id !== "string" ||
    typeof raw.title !== "string" ||
    typeof raw.order !== "number" ||
    (raw.status !== "pending" && raw.status !== "active" && raw.status !== "complete" && raw.status !== "blocked") ||
    typeof raw.created_at !== "string" ||
    typeof raw.updated_at !== "string"
  ) {
    return null
  }

  return {
    id: raw.id,
    plan_id: planId,
    title: raw.title,
    status: raw.status,
    order: raw.order,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  }
}

function getPlanPhaseIndex(plansRaw: unknown, validPlanIds: Set<string>): Map<string, PhaseNode> {
  const phaseById = new Map<string, PhaseNode>()
  if (plansRaw === null || typeof plansRaw !== "object") {
    return phaseById
  }

  const maybePlans = (plansRaw as { plans?: unknown }).plans
  if (!Array.isArray(maybePlans)) {
    return phaseById
  }

  for (const planRaw of maybePlans) {
    if (planRaw === null || typeof planRaw !== "object") {
      continue
    }

    const candidate = planRaw as PlanWithPhasesRaw
    if (typeof candidate.id !== "string" || !validPlanIds.has(candidate.id) || !Array.isArray(candidate.phases)) {
      continue
    }

    for (const phaseRaw of candidate.phases) {
      if (phaseRaw === null || typeof phaseRaw !== "object") {
        continue
      }

      const phase = toPhaseNode(candidate.id, phaseRaw as PhaseRaw)
      if (phase) {
        phaseById.set(phase.id, phase)
      }
    }
  }

  return phaseById
}

/**
 * Configuration options for packing cognitive state.
 * US-013: XML Compression with Budget
 */
export interface PackOptions {
  /** Maximum output size in characters. Default: 2000 */
  budget?: number
  /** Session ID to filter by */
  sessionId?: string
}

/**
 * Build mem XML lines for a given mem.
 */
function buildMemXmlLines(mem: MemNode, indent: string): string[] {
  return [
    `${indent}<mem id="${escapeXml(mem.id)}" shelf="${escapeXml(mem.shelf)}" type="${escapeXml(mem.type)}">`,
    `${indent}  ${escapeXml(mem.content)}`,
    `${indent}</mem>`,
  ]
}

/**
 * Pack the cognitive state into a dense XML string.
 * This is the "Context Compiler" - deterministic, no AI.
 *
 * @param projectRoot - The project root directory
 * @param options - Optional packing configuration (budget, sessionId)
 * @returns XML string for injection as synthetic context
 */
export function packCognitiveState(projectRoot: string, options?: PackOptions): string {
  const budget = options?.budget ?? 2000
  const sessionId = options?.sessionId
  const paths = getEffectivePaths(projectRoot)

  const trajectoryRaw = readJsonFile(paths.graphTrajectory)
  if (trajectoryRaw === null) {
    return buildEmptyStateXml(sessionId ?? "")
  }

  const trajectoryState = TrajectoryStateSchema.safeParse(trajectoryRaw)
  if (!trajectoryState.success || trajectoryState.data.trajectory === null) {
    return buildEmptyStateXml(sessionId ?? "")
  }

  const trajectory = trajectoryState.data.trajectory
  const resolvedSession = sessionId ?? trajectory.session_id
  if (sessionId && trajectory.session_id !== sessionId) {
    return buildEmptyStateXml(sessionId)
  }

  const plansRaw = readJsonFile(paths.graphPlans)
  const plansState = PlansStateSchema.safeParse(plansRaw)
  const plans = plansState.success ? [...plansState.data.plans].sort((a, b) => a.id.localeCompare(b.id)) : []

  const tasksRaw = readJsonFile(paths.graphTasks)
  const tasksState = GraphTasksStateSchema.safeParse(tasksRaw)
  const rawTasks = tasksState.success ? [...tasksState.data.tasks].sort((a, b) => a.id.localeCompare(b.id)) : []

  const memsRaw = readJsonFile(paths.graphMems)
  const memsState = GraphMemsStateSchema.safeParse(memsRaw)
  const rawMems = memsState.success ? [...memsState.data.mems].sort((a, b) => a.id.localeCompare(b.id)) : []

  // US-011: Apply pruneContaminated to filter false_path mems and invalidated tasks
  const { cleanMems, cleanTasks, prunedMems, prunedTasks } = pruneContaminated(rawMems, rawTasks)

  const validPlanIds = new Set(plans.map((plan) => plan.id))
  const phaseIndex = getPlanPhaseIndex(plansRaw, validPlanIds)

  const activePlan = trajectory.active_plan_id
    ? plans.find((plan) => plan.id === trajectory.active_plan_id) ?? null
    : null
  const activePhaseCandidate = trajectory.active_phase_id ? phaseIndex.get(trajectory.active_phase_id) ?? null : null
  const activePhase = activePlan && activePhaseCandidate && activePhaseCandidate.plan_id === activePlan.id
    ? activePhaseCandidate
    : null

  const taskById = new Map<string, TaskNode>(cleanTasks.map((task) => [task.id, task]))
  const activeTasks = trajectory.active_task_ids
    .map((taskId) => taskById.get(taskId))
    .filter((task): task is TaskNode => task !== undefined)
    .filter((task) => {
      if (!activePhase) {
        return true
      }
      return task.parent_phase_id === activePhase.id
    })

  const activeTaskIds = trajectory.active_task_ids

  // US-012: Filter stale mems (unless linked to active task)
  const staleMems: MemNode[] = []
  const freshMems: MemNode[] = []
  for (const mem of cleanMems) {
    if (isMemStale(mem, activeTaskIds)) {
      staleMems.push(mem)
    } else {
      freshMems.push(mem)
    }
  }

  const activeTaskSet = new Set(activeTasks.map((task) => task.id))
  const relatedMems = freshMems.filter((mem) => mem.origin_task_id !== null && activeTaskSet.has(mem.origin_task_id))

  const fileCount = new Set(activeTasks.flatMap((task) => task.file_locks)).size
  const driftScore = getDriftScore(projectRoot)
  const timestamp = latestTimestamp([
    trajectory.updated_at,
    activePlan?.updated_at,
    activePhase?.updated_at,
    ...activeTasks.map((task) => task.updated_at),
    ...relatedMems.map((mem) => mem.updated_at),
  ])

  // Build mems XML section
  const memLines: string[] = []
  for (const mem of freshMems) {
    memLines.push(...buildMemXmlLines(mem, "    "))
  }

  // Build base XML without mems
  const lines: string[] = []
  lines.push(`<hivemind_state timestamp="${escapeXml(timestamp)}" session="${escapeXml(resolvedSession)}" stale_dropped="${staleMems.length}" false_path_pruned="${prunedMems.length + prunedTasks.length}">`)

  lines.push(`  <trajectory id="${escapeXml(trajectory.id)}" intent="${escapeXml(trajectory.intent)}">`)
  if (activePlan) {
    lines.push(`    <active_plan id="${escapeXml(activePlan.id)}" title="${escapeXml(activePlan.title)}">`)
    if (activePhase) {
      lines.push(`      <active_phase id="${escapeXml(activePhase.id)}" title="${escapeXml(activePhase.title)}" order="${activePhase.order}">`)
      lines.push("        <active_tasks>")
      for (const task of activeTasks) {
        lines.push(
          `          <task id="${escapeXml(task.id)}" title="${escapeXml(task.title)}" status="${escapeXml(task.status)}" />`,
        )
      }
      lines.push("        </active_tasks>")
      lines.push("      </active_phase>")
    } else {
      lines.push("      <active_tasks>")
      for (const task of activeTasks) {
        lines.push(
          `        <task id="${escapeXml(task.id)}" title="${escapeXml(task.title)}" status="${escapeXml(task.status)}" />`,
        )
      }
      lines.push("      </active_tasks>")
    }
    lines.push("    </active_plan>")
  }
  lines.push("  </trajectory>")

  // Calculate current XML size without mems
  const baseXml = lines.join("\n")
  const closingTags = ["  <context_summary>", `    <mems count="${freshMems.length}" relevant="${relatedMems.length}" />`, `    <files_touched count="${fileCount}" />`, `    <drift_score value="${driftScore}" />`, "  </context_summary>", "</hivemind_state>"].join("\n")
  const baseSize = baseXml.length + closingTags.length + 1 // +1 for newline before closing

  // US-013: Budget-based compression - drop lowest relevance mems first
  let finalMems = freshMems
  const remainingBudget = budget - baseSize

  if (remainingBudget > 0 && memLines.length > 0) {
    const memsXmlSize = memLines.join("\n").length + 1 // +1 for newline

    if (memsXmlSize > remainingBudget) {
      // Sort mems by relevance score (ascending) - drop lowest first
      const memsWithScores = freshMems.map((mem) => ({
        mem,
        score: calculateRelevanceScore(mem, trajectory),
      }))
      memsWithScores.sort((a, b) => a.score - b.score)

      // Keep dropping lowest relevance mems until under budget
      const kept: MemNode[] = []
      let currentSize = 0
      // Iterate in reverse (highest relevance first)
      for (let i = memsWithScores.length - 1; i >= 0; i--) {
        const memXml = buildMemXmlLines(memsWithScores[i].mem, "    ").join("\n")
        const memSize = memXml.length + 1 // +1 for newline

        if (currentSize + memSize <= remainingBudget) {
          kept.push(memsWithScores[i].mem)
          currentSize += memSize
        }
      }
      finalMems = kept
    }
  }

  // Rebuild mems XML with final selection
  lines.push("  <mems>")
  for (const mem of finalMems) {
    lines.push(...buildMemXmlLines(mem, "    "))
  }
  lines.push("  </mems>")

  // PATCH-US-011: Anti-patterns section for amnesia prevention
  const ANTI_PATTERNS_BUDGET = 500
  const antiPatternsLines: string[] = []

  // Compress false_path mems
  const falsePaths = prunedMems.slice(0, 3)
  for (const mem of falsePaths) {
    const entry = `<avoid task="${mem.origin_task_id ?? "unknown"}">${escapeXml(mem.content.slice(0, 80))}</avoid>`
    if (antiPatternsLines.join("\n").length + entry.length > ANTI_PATTERNS_BUDGET) break
    antiPatternsLines.push(`  ${entry}`)
  }

  // Compress invalidated tasks
  for (const task of prunedTasks.slice(0, 2)) {
    const entry = `<avoid task="${task.id}">${escapeXml(task.title?.slice(0, 50) ?? "unknown")}</avoid>`
    if (antiPatternsLines.join("\n").length + entry.length > ANTI_PATTERNS_BUDGET) break
    antiPatternsLines.push(`  ${entry}`)
  }

  if (antiPatternsLines.length > 0) {
    lines.push("<anti_patterns>")
    lines.push(...antiPatternsLines)
    lines.push("</anti_patterns>")
  }

  lines.push("  <context_summary>")
  lines.push(`    <mems count="${freshMems.length}" relevant="${relatedMems.length}" />`)
  lines.push(`    <files_touched count="${fileCount}" />`)
  lines.push(`    <drift_score value="${driftScore}" />`)
  lines.push("  </context_summary>")
  lines.push("</hivemind_state>")

  return lines.join("\n")
}

/**
 * Prune contaminated nodes from the cognitive state.
 * "Time Machine" filter - removes false paths and invalidated tasks.
 *
 * @param mems - Array of MemNode to filter
 * @param tasks - Array of TaskNode to filter
 * @returns Clean and pruned node arrays
 */
export interface PrunedNodes {
  cleanMems: MemNode[]
  cleanTasks: TaskNode[]
  prunedMems: MemNode[]
  prunedTasks: TaskNode[]
}

export function pruneContaminated(
  mems: MemNode[],
  tasks: TaskNode[]
): PrunedNodes {
  // Filter out false_path mems - these are dead ends we don't want to follow
  const cleanMems: MemNode[] = []
  const prunedMems: MemNode[] = []

  for (const mem of mems) {
    if (mem.type === "false_path") {
      prunedMems.push(mem)
    } else {
      cleanMems.push(mem)
    }
  }

  // Filter out invalidated tasks - these are no longer valid
  const cleanTasks: TaskNode[] = []
  const prunedTasks: TaskNode[] = []

  for (const task of tasks) {
    if (task.status === "invalidated") {
      prunedTasks.push(task)
    } else {
      cleanTasks.push(task)
    }
  }

  // Debug logging for traceability
  console.debug(
    `[pruneContaminated] Pruned ${prunedMems.length} false_path mems, ${prunedTasks.length} invalidated tasks`
  )

  return {
    cleanMems,
    cleanTasks,
    prunedMems,
    prunedTasks,
  }
}
