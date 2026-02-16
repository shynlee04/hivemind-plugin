/**
 * Session Coherence Library — First-turn context retrieval and prompt transformation
 *
 * Pure TypeScript logic for:
 * - Detecting first turn of session
 * - Loading last session context
 * - Building transformed prompt
 *
 * This is the "subconscious engine" - no LLM-facing concerns.
 */

import { existsSync, readFileSync } from "fs"
import { getEffectivePaths } from "./paths.js"
import type { BrainState } from "../schemas/brain-state.js"
import type { HierarchyState } from "../schemas/hierarchy.js"
import type {
  LastSessionContext,
  PriorTask,
  PriorMem,
  PriorAnchor,
  FirstTurnConfig,
} from "../hooks/session_coherence/types.js"

/**
 * Default configuration for first-turn context retrieval
 */
const DEFAULT_CONFIG: FirstTurnConfig = {
  maxTasks: 5,
  maxMems: 3,
  maxTodos: 10,
  includeAnchors: true,
  budget: 2000,
}

/**
 * Detect if this is the first turn of a session.
 * First turn = turn_count === 0 in brain state.
 */
export function detectFirstTurn(state: BrainState | null): boolean {
  if (!state) return true
  return state.metrics.turn_count === 0
}

/**
 * Load last session context from .hivemind/
 * Retrieves trajectory, tasks, mems, and anchors from previous session.
 */
export async function loadLastSessionContext(
  projectRoot: string,
  config: FirstTurnConfig = DEFAULT_CONFIG
): Promise<LastSessionContext> {
  const paths = getEffectivePaths(projectRoot)

  // Default context if no prior session
  const defaultContext: LastSessionContext = {
    sessionId: "new",
    trajectory: null,
    activeTasks: [],
    pendingTodos: [],
    relevantMems: [],
    anchors: [],
    mode: null,
    lastCompactSummary: null,
  }

  try {
    // Load brain state for session info
    const brainExists = existsSync(paths.brain)
    if (!brainExists) {
      return defaultContext
    }

    const brainRaw = readFileSync(paths.brain, "utf-8")
    const brain: BrainState = JSON.parse(brainRaw)

    // Get hierarchy for trajectory
    let trajectory: string | null = null

    const hierarchyExists = existsSync(paths.hierarchy)
    if (hierarchyExists) {
      const hierarchyRaw = readFileSync(paths.hierarchy, "utf-8")
      const hierarchy: HierarchyState = JSON.parse(hierarchyRaw)
      trajectory = hierarchy.trajectory || hierarchy.tactic || hierarchy.action || null
    }

    // Load tasks (if exists)
    let activeTasks: PriorTask[] = []
    const tasksExists = existsSync(paths.tasks)
    if (tasksExists) {
      const tasksRaw = readFileSync(paths.tasks, "utf-8")
      const tasksData = JSON.parse(tasksRaw)
      const tasks = tasksData.tasks || tasksData || []
      activeTasks = tasks
        .filter((t: { status: string }) => t.status === "active" || t.status === "pending")
        .slice(0, config.maxTasks)
        .map((t: { id: string; content: string; status: string; stamp?: string }) => ({
          id: t.id,
          content: t.content,
          status: t.status,
          stamp: t.stamp || "",
        }))
    }

    // Load mems for relevant context
    let relevantMems: PriorMem[] = []
    const memsExists = existsSync(paths.mems)
    if (memsExists) {
      const memsRaw = readFileSync(paths.mems, "utf-8")
      const memsData = JSON.parse(memsRaw)
      const mems = memsData.mems || memsData || []
      relevantMems = mems
        .slice(0, config.maxMems)
        .map((m: { id: string; content: string; shelf: string; created_at?: string; createdAt?: string }) => ({
          id: m.id,
          content: m.content,
          shelf: m.shelf,
          createdAt: m.created_at || m.createdAt || new Date().toISOString(),
        }))
    }

    // Load anchors
    let anchors: PriorAnchor[] = []
    if (config.includeAnchors) {
      const anchorsExists = existsSync(paths.anchors)
      if (anchorsExists) {
        const anchorsRaw = readFileSync(paths.anchors, "utf-8")
        const anchorsData = JSON.parse(anchorsRaw)
        anchors = (anchorsData.anchors || anchorsData || []).map(
          (a: { key: string; value: string; timestamp?: string }) => ({
            key: a.key,
            value: a.value,
            timestamp: a.timestamp || new Date().toISOString(),
          })
        )
      }
    }

    return {
      sessionId: brain.session.id,
      trajectory,
      activeTasks,
      pendingTodos: [],
      relevantMems,
      anchors,
      mode: brain.session.mode,
      lastCompactSummary: brain.next_compaction_report,
    }
  } catch {
    // If anything fails, return default context
    return defaultContext
  }
}

/**
 * Build transformed prompt for first turn.
 * Includes:
 * - Last session context (trajectory, tasks, mems)
 * - Role reminder
 * - Configuration loading reminders
 * - Intent declaration guidance
 */
export function buildTransformedPrompt(
  userMessage: string,
  context: LastSessionContext,
  config: FirstTurnConfig = DEFAULT_CONFIG
): string {
  const sections: string[] = []

  // Header
  sections.push("<first_turn_context>")
  sections.push("SESSION COHERENCE: Resuming from previous session context")

  // Previous session info
  if (context.sessionId !== "new") {
    sections.push(`\n## Previous Session (${context.sessionId})`)
    sections.push(`Mode: ${context.mode || "unknown"}`)

    // Trajectory
    if (context.trajectory) {
      sections.push(`\n### Last Trajectory`)
      sections.push(context.trajectory)
    }

    // Active tasks
    if (context.activeTasks.length > 0) {
      sections.push(`\n### Active Tasks (from previous session)`)
      for (const task of context.activeTasks) {
        sections.push(`- [${task.status}] ${task.content} (${task.id})`)
      }
    }

    // Recent mems
    if (context.relevantMems.length > 0) {
      sections.push(`\n### Relevant Memories`)
      for (const mem of context.relevantMems) {
        sections.push(`[${mem.shelf}] ${mem.content.slice(0, 200)}...`)
      }
    }

    // Anchors
    if (context.anchors.length > 0 && config.includeAnchors) {
      sections.push(`\n### Anchors (immutable constraints)`)
      for (const anchor of context.anchors.slice(0, 5)) {
        sections.push(`- ${anchor.key}: ${anchor.value}`)
      }
    }

    // Last compact summary
    if (context.lastCompactSummary) {
      sections.push(`\n### Last Compact Summary`)
      sections.push(context.lastCompactSummary.slice(0, 300))
    }
  }

  // Role reminder
  sections.push("\n## Role Reminder")
  sections.push("You are operating in SESSION COHERENCE MODE.")
  sections.push("Act strategically (long-term goals) AND tactically (immediate actions).")
  sections.push("Use declare_intent, map_context, compact_session to manage session lifecycle.")

  // Configuration loading reminder
  sections.push("\n## Configuration Loading Reminder")
  sections.push("Before acting, consider:")
  sections.push("- Load relevant skills (skill tool)")
  sections.push("- Check config for user preferences")
  sections.push("- Use getEffectivePaths() for .hivemind/ paths")

  // Intent declaration guidance
  sections.push("\n## Intent Declaration")
  sections.push("If this is a new task, use declare_intent to set your trajectory.")
  sections.push("If continuing from previous session, acknowledge the prior context above.")

  // User message
  sections.push("\n## Your Message")
  sections.push(userMessage)

  // Closing
  sections.push("\n</first_turn_context>")

  // Truncate to budget
  let result = sections.join("\n")
  if (result.length > config.budget) {
    result = result.slice(0, config.budget - 30) + "...\n[truncated]"
  }

  return result
}

/**
 * Retrieve context reminders - helper for what tools/files to check
 */
export function retrieveContextReminders(): string {
  return `
Context Retrieval Reminders:
- Use scan_hierarchy to see current trajectory/tactic/action
- Use think_back to see recent decisions and anchors
- Use recall_mems to retrieve relevant memories by shelf
- Use todowrite to track pending tasks
- Check .hivemind/state/ for session metadata
`.trim()
}
