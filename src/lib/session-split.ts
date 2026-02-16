import { mkdir, writeFile } from "fs/promises"
import { join } from "path"
import type { Logger } from "./logging.js"
import type { HiveMindConfig } from "../schemas/config.js"
import type { BrainState } from "../schemas/brain-state.js"
import { loadTree, countCompleted, getAncestors } from "./hierarchy-tree.js"
import { estimateContextPercent, shouldCreateNewSession } from "./session-boundary.js"
import { generateExportData, generateJsonExport, generateMarkdownExport } from "./session-export.js"
import { getExportDir } from "./planning-fs.js"
import { createDetectionState, resetGovernanceCounters } from "./detection.js"

type ToastVariant = "info" | "warning" | "error"

const AUTO_SPLIT_TRIGGER_TOOLS = new Set(["map_context", "export_cycle", "scan_hierarchy"])

type SessionCreateClient = {
  session?: {
    create?: (args: {
      directory: string
      title: string
      parentID: string
      initialPrompts: string[]
    }) => Promise<{ id?: unknown }>
  }
}

export interface SplitConfig {
  log: Logger
  hiveMindConfig: Pick<HiveMindConfig, "automation_level" | "auto_compact_on_turns">
  sessionID: string
  triggerTool: string
  client: SessionCreateClient | null | undefined
  emitToast: (opts: {
    key: string
    message: string
    variant: ToastVariant
    eventType?: string
  }) => Promise<boolean>
}

export interface SplitResult {
  state: BrainState
  createdSessionId: string
  reason: string
}

export async function maybeCreateNonDisruptiveSessionSplit(
  directory: string,
  brain: BrainState,
  config: SplitConfig
): Promise<SplitResult | null> {
  const { log, hiveMindConfig, sessionID, triggerTool, client, emitToast } = config

  if (hiveMindConfig.automation_level !== "full") return null
  if (!AUTO_SPLIT_TRIGGER_TOOLS.has(triggerTool)) return null
  if (brain.pending_failure_ack) return null

  const role = (brain.session.role || "").toLowerCase()
  const isMainSession = !role.includes("subagent")
  if (!isMainSession) return null

  const hasDelegations = (brain.cycle_log ?? []).some((entry) => entry.tool === "task")
  const contextPercent = estimateContextPercent(
    brain.metrics.turn_count,
    hiveMindConfig.auto_compact_on_turns
  )

  let completedBranchCount = 0
  let treeFocusPath = ""
  try {
    const tree = await loadTree(directory)
    if (tree.root) {
      completedBranchCount = countCompleted(tree)
      if (tree.cursor) {
        const path = getAncestors(tree.root, tree.cursor).map((node) => node.content).join(" > ")
        if (path) treeFocusPath = path
      }
    }
  } catch {
    return null
  }

  const boundary = shouldCreateNewSession({
    turnCount: brain.metrics.turn_count,
    userTurnCount: brain.metrics.user_turn_count,
    contextPercent,
    hierarchyComplete: completedBranchCount > 0,
    isMainSession,
    hasDelegations,
    compactionCount: brain.compaction_count ?? 0,
  })

  if (!boundary.recommended) return null

  if (!client?.session?.create) {
    await log.debug("Auto split skipped: SDK client.session.create unavailable")
    return null
  }

  try {
    const summary = `Auto split: ${boundary.reason}`
    const exportData = generateExportData(brain, summary)
    const exportDir = getExportDir(directory)
    await mkdir(exportDir, { recursive: true })
    const stamp = new Date().toISOString().split("T")[0]
    const baseName = `session_${stamp}_${brain.session.id}_autosplit`
    const body = [
      summary,
      brain.hierarchy.trajectory ? `Trajectory: ${brain.hierarchy.trajectory}` : "",
      brain.hierarchy.tactic ? `Tactic: ${brain.hierarchy.tactic}` : "",
      brain.hierarchy.action ? `Action: ${brain.hierarchy.action}` : "",
    ].filter(Boolean).join("\n")

    await writeFile(join(exportDir, `${baseName}.json`), generateJsonExport(exportData))
    await writeFile(join(exportDir, `${baseName}.md`), generateMarkdownExport(exportData, body))

    const focus =
      brain.hierarchy.action ||
      brain.hierarchy.tactic ||
      brain.hierarchy.trajectory ||
      treeFocusPath ||
      "Continuation"
    
    // P0-6: Build recent_dialogue XML from captured messages
    const recentMessages = brain.recent_messages ?? []
    const recentDialogueXml = recentMessages.length > 0
      ? `<recent_dialogue>\n${recentMessages.map(m => `${m.role}: ${m.content.slice(0, 500)}`).join('\n\n')}\n</recent_dialogue>`
      : ""
    
    // P0-6: Include session_lineage to tell LLM why it was split
    const sessionLineageXml = `<session_lineage parent_session="${sessionID}" reason="${boundary.reason}" />`
    
    const context = [
      "=== HiveMind Context (Session Split) ===",
      sessionLineageXml,
      `Focus: ${focus}`,
      brain.hierarchy.trajectory ? `Trajectory: ${brain.hierarchy.trajectory}` : "",
      brain.hierarchy.tactic ? `Tactic: ${brain.hierarchy.tactic}` : "",
      brain.hierarchy.action ? `Action: ${brain.hierarchy.action}` : "",
      recentDialogueXml,
      `Turn 0 Context: ${boundary.reason}`,
      "=== End Context ===",
    ].filter(Boolean).join("\n")

    const created = await client.session.create({
      directory,
      title: `HiveMind split: ${focus}`,
      parentID: sessionID,
      initialPrompts: [context],
    })
    const createdSessionId = typeof created?.id === "string" ? created.id : "unknown"

    await emitToast({
      key: "session_split:info",
      message: `Boundary reached. Started continuation session ${createdSessionId}.`,
      variant: "info",
      eventType: "session_split",
    })

    const now = Date.now()
    const resetDetection = createDetectionState()
    const splitState: BrainState = {
      ...brain,
      session: {
        ...brain.session,
        start_time: now,
        last_activity: now,
        date: new Date(now).toISOString().split("T")[0],
      },
      metrics: {
        ...brain.metrics,
        turn_count: 0,
        drift_score: 100,
        files_touched: [],
        consecutive_failures: 0,
        consecutive_same_section: 0,
        last_section_content: "",
        tool_type_counts: resetDetection.tool_type_counts,
        keyword_flags: [],
        write_without_read_count: 0,
        governance_counters: resetGovernanceCounters(brain.metrics.governance_counters, {
          full: true,
          prerequisitesCompleted: Boolean(
            brain.hierarchy.trajectory &&
            brain.hierarchy.tactic &&
            brain.hierarchy.action
          ),
        }),
      },
      complexity_nudge_shown: false,
      // P0-6: Reset recent_messages for new session (will be repopulated on next turn)
      recent_messages: [],
    }

    await log.info(`[autosplit] Created non-disruptive session ${createdSessionId} (${boundary.reason})`)
    return {
      state: splitState,
      createdSessionId,
      reason: boundary.reason,
    }
  } catch (error: unknown) {
    await log.warn(
      `Auto split skipped: ${error instanceof Error ? error.message : String(error)}`
    )
    return null
  }
}
