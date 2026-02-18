/**
 * Session Coherence Library — First-turn context retrieval and prompt transformation
 *
 * Pure TypeScript logic for:
 * - Detecting first turn of session
 * - Loading last session context (from ARCHIVED session after compact)
 * - Building transformed prompt
 *
 * This is the "subconscious engine" - no LLM-facing concerns.
 */

import { existsSync, readFileSync, readdirSync } from "fs"
import { join } from "path"
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
import { DEFAULT_CONTEXT_BUDGET } from "./budget.js"

/**
 * Default configuration for first-turn context retrieval
 */
const DEFAULT_CONFIG: FirstTurnConfig = {
  maxTasks: 5,
  maxMems: 3,
  maxTodos: 10,
  includeAnchors: true,
  budget: DEFAULT_CONTEXT_BUDGET,
}

/**
 * Detect if this is the first turn of a session.
 * First turn = turn_count === 0 in brain state.
 */
export function detectFirstTurn(state: BrainState | null): boolean {
  if (!state) return true
  // turn_count can increase from internal tool activity before first user turn.
  // user_turn_count is the more reliable signal for "first user message".
  return state.metrics.user_turn_count === 0 || state.metrics.turn_count === 0
}

/**
 * Find the most recent archived session file.
 * Returns path to the archived session file, or null if none found.
 */
function findMostRecentArchivedSession(archiveDir: string): string | null {
  if (!existsSync(archiveDir)) return null

  try {
    const files = readdirSync(archiveDir)
      .filter(f => f.endsWith(".md"))
      .sort()
      .reverse() // Most recent first

    return files.length > 0 ? join(archiveDir, files[0]) : null
  } catch {
    return null
  }
}

/**
 * Load context from an archived session file.
 */
function loadFromArchivedSession(archivePath: string): Partial<LastSessionContext> {
  try {
    const content = readFileSync(archivePath, "utf-8")

    // Extract session ID from filename (e.g., "2026-02-16-plan_driven-something.md")
    const filename = archivePath.split("/").pop() || "unknown"

    // Try to extract session info from archived content
    // Look for patterns like "Session ID:" or "## Session" in the markdown
    const sessionIdMatch = content.match(/Session[:\s]+([^\n]+)/i)
    const sessionId = sessionIdMatch ? sessionIdMatch[1].trim() : filename

    // Extract trajectory/tactic/action from the archived session
    const trajectoryMatch = content.match(/Trajectory[:\s]+([^\n]+)/i)
    const tacticMatch = content.match(/Tactic[:\s]+([^\n]+)/i)
    const actionMatch = content.match(/Action[:\s]+([^\n]+)/i)

    const trajectory = trajectoryMatch?.[1]?.trim()
      || tacticMatch?.[1]?.trim()
      || actionMatch?.[1]?.trim()
      || null

    // Extract mode if present
    const modeMatch = content.match(/Mode[:\s]+([^\n]+)/i)
    const mode = modeMatch?.[1]?.trim() || null

    // Try to find active tasks in the archived content
    const taskRegex = /- \[([^\]]+)\] ([^\(]+)\(([^)]+)\)/g
    const taskMatches = content.match(taskRegex)
    const activeTasks: PriorTask[] = []
    if (taskMatches) {
      for (const match of taskMatches.slice(0, 5)) {
        const statusMatch = match.match(/- \[([^\]]+)\]/)
        const contentMatch = match.match(/- \[[^\]]+\] ([^\(]+)/)
        const idMatch = match.match(/\(([^)]+)\)/)
        if (statusMatch && contentMatch) {
          activeTasks.push({
            status: statusMatch[1],
            content: contentMatch[1].trim(),
            id: idMatch?.[1] || "",
            stamp: "",
          })
        }
      }
    }

    return {
      sessionId,
      trajectory,
      mode,
      activeTasks,
    }
  } catch {
    return {}
  }
}

/**
 * Load last session context from .hivemind/
 * IMPORTANT: After compact_session, load from ARCHIVED session, not current files.
 * The current brain.json is the NEW session, not the previous one.
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
    // First, check if there's an archived session
    // This is the KEY FIX: after compact, we load from archive, not current files
    const archivePath = findMostRecentArchivedSession(paths.archiveDir)

    if (archivePath) {
      // Load from archived session
      const archivedContext = loadFromArchivedSession(archivePath)

      // Also try to load current state for additional context (mems, anchors)
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
        sessionId: archivedContext.sessionId || "archived",
        trajectory: archivedContext.trajectory || null,
        activeTasks: archivedContext.activeTasks || [],
        pendingTodos: [],
        relevantMems,
        anchors,
        mode: archivedContext.mode as string | null,
        lastCompactSummary: archivedContext.trajectory ? `Resumed from archived session: ${archivedContext.sessionId}` : null,
      }
    }

    // Fallback: Load from current files (for initial/new sessions without archives)
    // Load brain state for session info
    const brainExists = existsSync(paths.brain)
    if (!brainExists) {
      return defaultContext
    }

    const brainRaw = readFileSync(paths.brain, "utf-8")
    const brain: BrainState = JSON.parse(brainRaw)

    // Skip if this is a brand new session (turn_count === 0 AND no archive)
    // This handles the case where there's no prior context
    if (brain.metrics.turn_count === 0 && !archivePath) {
      return defaultContext
    }

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

/**
 * Context Confidence Scoring — Phase 2: Context Clarification Framework
 *
 * Calculates confidence score based on multiple factors:
 * - Turn count (new sessions need more context)
 * - Context completeness (are trajectory, tasks, mems loaded?)
 * - User message clarity (intent from message)
 * - Recent changes (files modified since last session)
 * - Drift score (context drift from previous session)
 */

/**
 * Confidence level thresholds
 */
export const CONFIDENCE_LEVELS = {
  HIGH: 95,   // 95% - 100%: Proceed normally
  MEDIUM: 80, // 80% - 95%: Gather more context + clarification
  LOW: 80,    // < 80%: Use commands/skills for context
}

/**
 * Calculate context confidence score (0-100)
 *
 * @param state - Brain state from .hivemind/state/brain.json
 * @param projectRoot - Project root directory (required for path checks)
 * @returns Confidence score (0-100)
 */
export function calculateContextConfidence(
  state: BrainState,
  projectRoot: string
): number {
  let score = 100

  // 1. Turn count penalty (10%)
  if (state.metrics.turn_count === 0) {
    score -= 10
  }

  // 2. Context completeness check (30%)
  const effectivePaths = getEffectivePaths(projectRoot)
  if (!effectivePaths) {
    // If paths can't be loaded, assume incomplete context
    score -= 15
  } else {
    // Check graph files exist
    if (!existsSync(effectivePaths.graphTrajectory)) {
      score -= 10
    }
    if (!existsSync(effectivePaths.graphTasks)) {
      score -= 10
    }
    if (!existsSync(effectivePaths.graphMems)) {
      score -= 5
    }
  }

  // 3. User message clarity check (25%)
  // Note: BrainState doesn't have last_user_message, so we use turn_count as proxy
  // For actual message clarity, this should be passed from the hook
  if (state.metrics.turn_count === 0) {
    // First turn - assume message needs more context
    score -= 10
  }

  // 4. Recent changes check (20%)
  // Simplified: if turn_count is low and files_touched is empty, assume no recent changes
  if (state.metrics.turn_count <= 2 && state.metrics.files_touched.length === 0) {
    score -= 10
  }

  // 5. Drift score penalty (15%)
  if (state.metrics.drift_score > 50) {
    const driftPenalty = Math.min(state.metrics.drift_score - 50, 15)
    score -= driftPenalty
  }

  // Clamp to valid range
  return Math.max(0, Math.min(100, score))
}

/**
 * Determine context action based on confidence score
 *
 * @param confidence - Confidence score (0-100)
 * @returns Action: "proceed", "gather", or "clarify"
 */
export function getContextAction(confidence: number): "proceed" | "gather" | "clarify" {
  if (confidence >= CONFIDENCE_LEVELS.HIGH) {
    return "proceed"
  } else if (confidence >= CONFIDENCE_LEVELS.MEDIUM) {
    return "gather"
  } else {
    return "clarify"
  }
}

/**
 * Get confidence breakdown - detailed analysis for debugging
 *
 * @param state - Brain state
 * @param projectRoot - Project root directory (required for path checks)
 * @returns Object with score breakdown and recommendations
 */
export function getConfidenceBreakdown(
  state: BrainState,
  projectRoot: string
): {
  score: number
  breakdown: Record<string, number>
  recommendations: string[]
  action: "proceed" | "gather" | "clarify"
} {
  let score = 100
  const breakdown: Record<string, number> = {}
  const recommendations: string[] = []

  // Turn count analysis
  if (state.metrics.turn_count === 0) {
    score -= 10
    breakdown.turnCount = -10
    recommendations.push("First turn: Load last session context")
  } else {
    breakdown.turnCount = 0
  }

  // Context completeness analysis
  const effectivePaths = getEffectivePaths(projectRoot)
  if (!effectivePaths) {
    score -= 15
    breakdown.contextCompleteness = -15
    recommendations.push("Paths unavailable: Cannot verify context completeness")
  } else {
    let completenessPenalty = 0
    if (!existsSync(effectivePaths.graphTrajectory)) {
      completenessPenalty += 10
      recommendations.push("Missing graph/trajectory.json: Load trajectory context")
    }
    if (!existsSync(effectivePaths.graphTasks)) {
      completenessPenalty += 10
      recommendations.push("Missing graph/tasks.json: Load task context")
    }
    if (!existsSync(effectivePaths.graphMems)) {
      completenessPenalty += 5
      recommendations.push("Missing graph/mems.json: Load memory context")
    }
    score -= completenessPenalty
    breakdown.contextCompleteness = -completenessPenalty
  }

  // User message clarity analysis
  // Note: BrainState doesn't have last_user_message, so we use turn_count as proxy
  // For actual message clarity, this should be passed from the hook
  let clarityPenalty = 0
  if (state.metrics.turn_count === 0) {
    clarityPenalty += 10
    recommendations.push("First turn: Consider gathering more user context")
  }
  score -= clarityPenalty
  breakdown.userMessageClarity = -clarityPenalty

  // Recent changes analysis
  if (state.metrics.turn_count <= 2 && state.metrics.files_touched.length === 0) {
    score -= 10
    breakdown.recentChanges = -10
    recommendations.push("No recent file changes: Consider loading full context")
  } else {
    breakdown.recentChanges = 0
  }

  // Drift score analysis
  let driftPenalty = 0
  if (state.metrics.drift_score > 50) {
    driftPenalty = Math.min(state.metrics.drift_score - 50, 15)
    score -= driftPenalty
    breakdown.driftScore = -driftPenalty
    recommendations.push(`High drift score (${state.metrics.drift_score}): Use scan_hierarchy to verify context`)
  } else {
    breakdown.driftScore = 0
  }

  return {
    score,
    breakdown,
    recommendations,
    action: getContextAction(score),
  }
}

/**
 * Type exports for confidence scoring
 */
export type ConfidenceLevel = "proceed" | "gather" | "clarify"
export type ConfidenceBreakdown = {
  score: number
  breakdown: Record<string, number>
  recommendations: string[]
  action: ConfidenceLevel
}
