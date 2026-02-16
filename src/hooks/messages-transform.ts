/**
 * Messages Transform Hook — Pre-stop checklist and context anchoring.
 * 
 * V3.0 Design:
 * - Uses PREPEND for anchor context (synthetic part, doesn't mutate user text)
 * - Uses APPEND for checklist (at end, before final message)
 * - pending_failure_ack checklist item RESTORED (safety critical)
 * - Research artifacts check REMOVED (was noise, not actionable)
 * 
 * P3: try/catch — never break message flow
 */

import { createStateManager, loadConfig } from "../lib/persistence.js"
import { loadTasks } from "../lib/manifest.js"
import { countCompleted, loadTree } from "../lib/hierarchy-tree.js"
import { estimateContextPercent, shouldCreateNewSession } from "../lib/session-boundary.js"
import { packCognitiveState } from "../lib/cognitive-packer.js"
import { loadGraphTasks, loadTrajectory } from "../lib/graph-io.js"
import { loadLastSessionContext, buildTransformedPrompt } from "../lib/session_coherence.js"
import { existsSync, readdirSync } from "fs"
import type { Message, Part } from "@opencode-ai/sdk"
import type { BrainState } from "../schemas/brain-state.js"

type MessagePart = {
  id?: string
  sessionID?: string
  messageID?: string
  type?: string
  text?: string
  synthetic?: boolean
  [key: string]: unknown
}

type MessageWithParts = {
  info: Message
  parts: Part[]
}

type LegacyMessage = {
  role?: string
  content?: string | MessagePart[]
  synthetic?: boolean
  [key: string]: unknown
}

export type MessageV2 = MessageWithParts | LegacyMessage

function isMessageWithParts(message: MessageV2): message is MessageWithParts {
  return (
    typeof message === "object" &&
    message !== null &&
    "info" in message &&
    "parts" in message &&
    Array.isArray((message as MessageWithParts).parts)
  )
}

// LOW #1: Magic number extracted for clarity
const MAX_CHECKLIST_CHARS = 1000

function buildChecklist(items: string[], maxChars: number): string {
  if (items.length === 0) return ""

  const lines = ["<system-reminder>", "CHECKLIST BEFORE STOPPING (Pre-Stop Conditional):"]
  lines.push("You are about to complete your turn. BEFORE you output your final message, you MUST verify:")
  for (const item of items) {
    const candidate = [...lines, `- [ ] ${item}`, "</system-reminder>"].join("\n")
    if (candidate.length > maxChars) break
    lines.push(`- [ ] ${item}`)
  }
  lines.push("If NO, you must execute these tools now. Do not stop your turn.")
  lines.push("</system-reminder>")
  return lines.join("\n")
}

function isEmptyPackedContext(xml: string): boolean {
  return (
    xml.includes('timestamp="1970-01-01T00:00:00.000Z"') &&
    xml.includes("<trajectory />") &&
    xml.includes('session=""')
  )
}

function isSyntheticMessage(message: MessageV2): boolean {
  if (isMessageWithParts(message)) {
    return message.parts.some(part => {
      if (part.type !== "text") return false
      return Boolean((part as MessagePart).synthetic)
    })
  }

  if (message.synthetic === true) return true
  if (!Array.isArray(message.content)) return false
  return message.content.some(part => part.synthetic === true)
}

function getLastNonSyntheticUserMessageIndex(messages: MessageV2[]): number {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i]
    const role = isMessageWithParts(message) ? message.info.role : message.role
    if (role === "user" && !isSyntheticMessage(message)) {
      return i
    }
  }
  return -1
}

/**
 * V3.0: Build anchor context as SEPARATE synthetic part.
 * Does NOT mutate user text - uses prependSyntheticPart instead.
 */
function buildAnchorContext(state: BrainState): string {
  const phase = state.hierarchy.trajectory || "Unset"
  const task = state.hierarchy.action || "Unset"
  const hierarchyStatus = state.metrics.context_updates > 0 ? "Active" : "Stale"

  return `[SYSTEM ANCHOR: ${phase} | Active Task: ${task} | Hierarchy: ${hierarchyStatus}]`
}

/**
 * V3.0: PREPEND synthetic part (anchor context at START).
 * Does NOT mutate user's original text - adds separate part.
 */
function prependSyntheticPart(message: MessageV2, text: string): void {
  if (isMessageWithParts(message)) {
    const firstPart = message.parts[0] as MessagePart | undefined
    const sessionID = firstPart?.sessionID ?? message.info.sessionID
    const messageID = firstPart?.messageID ?? message.info.id

    if (!sessionID || !messageID) return

    const syntheticPart: Part = {
      id: `hm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      sessionID,
      messageID,
      type: "text",
      text,
      synthetic: true,
      providerMetadata: {
        opencode: {
          ui_hidden: true
        }
      }
    } as Part
    // Prepend to start
    message.parts = [syntheticPart, ...message.parts]
    return
  }

  const syntheticPart: MessagePart = {
    type: "text",
    text,
    synthetic: true,
  }

  if (Array.isArray(message.content)) {
    message.content = [syntheticPart, ...message.content]
    return
  }

  if (typeof message.content === "string") {
    message.content = [
      syntheticPart,
      {
        type: "text",
        text: message.content,
      },
    ]
    return
  }

  message.content = [syntheticPart] // Fallback
}

/**
 * APPEND synthetic part (checklist at END).
 */
function appendSyntheticPart(message: MessageV2, text: string): void {
  if (isMessageWithParts(message)) {
    const firstPart = message.parts[0] as MessagePart | undefined
    const sessionID = firstPart?.sessionID ?? message.info.sessionID
    const messageID = firstPart?.messageID ?? message.info.id

    if (!sessionID || !messageID) return

    const syntheticPart: Part = {
      id: `hm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      sessionID,
      messageID,
      type: "text",
      text,
      synthetic: true,
      providerMetadata: {
        opencode: {
          ui_hidden: true
        }
      }
    } as Part
    // Append to end
    message.parts = [...message.parts, syntheticPart]
    return
  }

  const syntheticPart: MessagePart = {
    type: "text",
    text,
    synthetic: true,
  }

  if (Array.isArray(message.content)) {
    message.content = [...message.content, syntheticPart]
    return
  }

  if (typeof message.content === "string") {
    message.content = [
      {
        type: "text",
        text: message.content,
      },
      syntheticPart,
    ]
    return
  }

  message.content = [syntheticPart] // Fallback
}

export function createMessagesTransformHook(_log: { warn: (message: string) => Promise<void> }, directory: string) {
  const stateManager = createStateManager(directory)
  const injectedSessionIds = new Set<string>()

  return async (
    _input: {},
    output: { messages: MessageV2[] }
  ): Promise<void> => {
    try {
      if (!Array.isArray(output.messages)) return

      const config = await loadConfig(directory)
      if (config.governance_mode === "permissive") return

      const state = await stateManager.load()

      // === FIRST TURN: Session Coherence ===
      // Persistent marker-based gate (counter-independent).
      // Inject only when state exists and marker is false.
      const sessionId = state?.session?.id ?? ""
      const markerInjected = state?.first_turn_context_injected ?? false
      const canInjectForSession = sessionId.length > 0 && !injectedSessionIds.has(sessionId)

      if (state && !markerInjected && canInjectForSession) {
        const index = getLastNonSyntheticUserMessageIndex(output.messages)
        if (index >= 0) {
          try {
            // Extract user message text
            const userMessage = output.messages[index]
            let userMessageText = ""
            if (isMessageWithParts(userMessage)) {
              userMessageText = userMessage.parts.filter(p => p.type === "text").map(p => p.text || "").join(" ")
            } else if (typeof userMessage.content === "string") {
              userMessageText = userMessage.content
            } else if (Array.isArray(userMessage.content)) {
              userMessageText = userMessage.content.filter(p => p.type === "text").map(p => (p as MessagePart).text || "").join(" ")
            }

            // Load last session context (from archive if available)
            const lastSessionContext = await loadLastSessionContext(directory)

            // Build transformed prompt
            const transformedPrompt = buildTransformedPrompt(userMessageText, lastSessionContext, {
              maxTasks: 5,
              maxMems: 3,
              maxTodos: 10,
              includeAnchors: true,
              budget: 2500,
            })

            // Inject as synthetic part (prepend)
            prependSyntheticPart(output.messages[index], transformedPrompt)

            const updatedState: BrainState = {
              ...state,
              first_turn_context_injected: true,
            }
            await stateManager.save(updatedState)

            injectedSessionIds.add(sessionId)

            if (process.env.HIVEMIND_DEBUG_FIRST_TURN === "1") {
              console.log("\n🔗 [SESSION COHERENCE] First-turn context injected:")
              console.log("---")
              console.log(transformedPrompt)
              console.log("---\n")
            }

            // First-turn session coherence is exclusive.
            // Do not stack anchor/checklist injections in same transform pass.
            return
          } catch {
            // P3: never break message flow - silently fail
          }
        }
      }

        // Now safe to return early - first-turn already handled
      if (!state) return

      // === P0-6: Capture recent messages for cross-session continuity ===
      // Store last 6 messages in brain state for session split
      try {
        const recentMessages: Array<{ role: "user" | "assistant"; content: string }> = []
        for (const msg of output.messages) {
          // Determine role from message shape
          let role: string | undefined
          let content = ""
          
          if (isMessageWithParts(msg)) {
            role = msg.info?.role
            content = msg.parts.filter(p => p.type === "text").map(p => p.text || "").join(" ")
          } else {
            // LegacyMessage
            role = (msg as LegacyMessage).role
            const msgContent = (msg as LegacyMessage).content
            if (typeof msgContent === "string") {
              content = msgContent
            } else if (Array.isArray(msgContent)) {
              content = msgContent.filter(p => p.type === "text").map(p => (p as MessagePart).text || "").join(" ")
            }
          }
          
          if (role && (role === "user" || role === "assistant") && content) {
            recentMessages.push({ role: role as "user" | "assistant", content })
          }
        }
        
        // Keep only last 6 messages
        const trimmedMessages = recentMessages.slice(-6)
        
        // Save to brain state for session-split to use
        const updatedState: BrainState = {
          ...state,
          recent_messages: trimmedMessages,
        }
        await stateManager.save(updatedState)
      } catch {
        // P3: Never break message flow - silently fail
      }
      // === End P0-6 message capture ===

      const index = getLastNonSyntheticUserMessageIndex(output.messages)
      if (index >= 0) {

        // US-015: Cognitive Packer - inject packed XML state at START
        const packedContext = packCognitiveState(directory)
        if (!isEmptyPackedContext(packedContext)) {
          prependSyntheticPart(output.messages[index], packedContext)
        }

        // 1. V3.0: Contextual Anchoring via PREPEND (synthetic part, no mutation)
        const anchorHeader = buildAnchorContext(state)
        prependSyntheticPart(output.messages[index], anchorHeader)

        // 2. Pre-Stop Conditional Reminders (Inject Checklist at END)
        const items: string[] = []

        // Add standard governance checks
        if (!state.hierarchy.action) items.push("Action-level focus is missing (call map_context)")
        if (state.metrics.context_updates === 0) items.push("Is the file tree updated? (No map_context yet)")
        if (state.metrics.files_touched.length > 0) items.push("Have you forced an atomic git commit / PR for touched files?")

        // V3.0: RESTORED - pending_failure_ack checklist (safety critical)
        if (state.pending_failure_ack) {
          items.push("Acknowledge pending subagent failure (call export_cycle or map_context with blocked status)")
        }

        // US-016: Pending tasks - dual-read pattern (trajectory.json primary, tasks.json fallback)
        let pendingTaskCount = 0
        let paths
        try {
          paths = await import("../lib/paths.js").then(m => m.getEffectivePaths(directory))
        } catch {
          // If paths can't be loaded, skip graph-based checks
        }

        // LOW #2: Parallelize async - start tree loading in parallel with task checks
        const treePromise = loadTree(directory)
        
        // Primary: Read from graph/tasks.json filtered by trajectory.json active_task_ids
        // MEDIUM #2: Check BOTH graph files exist before using graph data
        if (paths && existsSync(paths.graphTrajectory) && existsSync(paths.graphTasks)) {
          // LOW #2: Load trajectory and graphTasks in parallel
          const [trajectoryState, graphTasks] = await Promise.all([
            loadTrajectory(directory),
            loadGraphTasks(directory)
          ])
          if (trajectoryState?.trajectory) {
            const activeTaskIds = new Set(trajectoryState.trajectory.active_task_ids)
            if (activeTaskIds.size > 0 && graphTasks?.tasks) {
              // MEDIUM #1: Defensive check for task.status before comparison
              const activeTasks = graphTasks.tasks.filter(task =>
                activeTaskIds.has(task.id) && task.status && task.status !== "complete" && task.status !== "invalidated"
              )
              pendingTaskCount = activeTasks.length
            }
          }
        }

        // Fallback: Read from flat tasks.json if graph not available or empty
        if (pendingTaskCount === 0) {
          const taskManifest = await loadTasks(directory)
          if (taskManifest && Array.isArray(taskManifest.tasks) && taskManifest.tasks.length > 0) {
            const pendingCount = taskManifest.tasks.filter(task => {
              const status = String(task.status ?? "pending").toLowerCase()
              return status !== "completed" && status !== "cancelled"
            }).length
            pendingTaskCount = pendingCount
          }
        }

        if (pendingTaskCount > 0) {
          items.push(`Review ${pendingTaskCount} pending task(s)`)
        }

        // Session Boundary check
        const role = (state.session?.role || "").toLowerCase()
        const contextPercent = estimateContextPercent(state.metrics.turn_count, config.auto_compact_on_turns)
        let completedBranchCount = 0
        // LOW #2: Use pre-loaded tree promise
        const tree = await treePromise
        if (tree.root) completedBranchCount = countCompleted(tree)

        // V3.0: Pass user_turn_count and compaction_count
        const boundaryRecommendation = shouldCreateNewSession({
          turnCount: state.metrics.turn_count,
          userTurnCount: state.metrics.user_turn_count,
          contextPercent,
          hierarchyComplete: completedBranchCount > 0,
          isMainSession: !role.includes("subagent"),
          hasDelegations: (state.cycle_log ?? []).some(entry => entry.tool === "task"),
          compactionCount: state.compaction_count ?? 0,
        })

        if (boundaryRecommendation.recommended) {
           items.push(`Session boundary reached: ${boundaryRecommendation.reason}`)
        }

        // US-016: Artifacts check - verify session artifacts are properly linked
        // Checks if session has been persisted to .hivemind/sessions/active/
        const sessionDir = directory.includes(".hivemind/sessions/")
          ? null // Already in session directory
          : paths?.activeDir
        if (sessionDir && state.session?.id) {
          // Session files are named {date}-{mode}-{slug}.md, not by session ID suffix
          // Check if ANY session file exists in active directory
          try {
            const sessionFiles = readdirSync(sessionDir).filter(f => f.endsWith('.md'))
            if (sessionFiles.length === 0) {
              items.push("Session not persisted to sessions/active/ (run declare_intent or compact_session)")
            }
          } catch {
            // Directory doesn't exist or can't be read
            items.push("Session not persisted to sessions/active/ (run declare_intent or compact_session)")
          }
        }

        const checklist = buildChecklist(items, MAX_CHECKLIST_CHARS)
        if (checklist) {
          appendSyntheticPart(output.messages[index], checklist)
        }
      }

    } catch {
      // P3: never break message flow
    }
  }
}
