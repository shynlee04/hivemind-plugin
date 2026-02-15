import { createStateManager, loadConfig } from "../lib/persistence.js"
import { loadTasks } from "../lib/manifest.js"
import { countCompleted, loadTree } from "../lib/hierarchy-tree.js"
import { estimateContextPercent, shouldCreateNewSession } from "../lib/session-boundary.js"
import type { Message, Part } from "@opencode-ai/sdk"

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


function buildAnchorContext(
  state: any,


): string {
  // Construct the "System Anchor" header
  // [SYSTEM ANCHOR: Phase 2 - Auth Debug | Active Task ID: #44 | Hierarchy: Stale]

  const phase = state.hierarchy.trajectory || "Unset"
  const task = state.hierarchy.action || "Unset"
  const hierarchyStatus = state.metrics.context_updates > 0 ? "Active" : "Stale"

  const header = `[SYSTEM ANCHOR: Phase ${phase} | Active Task: ${task} | Hierarchy: ${hierarchyStatus}]`

  return header
}

function wrapUserMessage(message: MessageV2, header: string): void {
  // Wraps user content like:
  // header
  // User Intent: "original content"

  if (isMessageWithParts(message)) {
    // Find text part
    const textPart = message.parts.find(p => p.type === "text")
    if (textPart && textPart.text) {
      textPart.text = `${header}\nUser Intent: "${textPart.text}"`
    }
    return
  }

  if (Array.isArray(message.content)) {
    const textPart = message.content.find(p => p.type === "text" && !p.synthetic)
    if (textPart && typeof textPart.text === "string") {
      textPart.text = `${header}\nUser Intent: "${textPart.text}"`
    } else if (message.content.length === 1 && typeof message.content[0] === "string") {
        // Handle legacy string array content? No, MessagePart is obj.
        // But let's handle if it was parsed as such.
        // Actually definition says content: string | MessagePart[].
    }
    return
  }

  if (typeof message.content === "string") {
    message.content = `${header}\nUser Intent: "${message.content}"`
  }
}

function appendSyntheticPart(message: MessageV2, text: string): void {
  // Appends to the END of the message parts
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
    }
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

  return async (
    _input: {},
    output: { messages: MessageV2[] }
  ): Promise<void> => {
    try {
      if (!Array.isArray(output.messages)) return

      const config = await loadConfig(directory)
      if (config.governance_mode === "permissive") return

      const state = await stateManager.load()
      if (!state) return


      const index = getLastNonSyntheticUserMessageIndex(output.messages)
      if (index >= 0) {

        // 1. Mind Control: Contextual Anchoring (Wrap User Message)
        const anchorHeader = buildAnchorContext(state, )
        wrapUserMessage(output.messages[index], anchorHeader)

        // 2. Pre-Stop Conditional Reminders (Inject Checklist at END)
        const items: string[] = []

        // Add standard governance checks
        if (!state.hierarchy.action) items.push("Action-level focus is missing (call map_context)")
        if (state.metrics.context_updates === 0) items.push("Is the file tree updated? (No map_context yet)")
        if (state.metrics.files_touched.length > 0) items.push("Have you forced an atomic git commit / PR for touched files?")

        // Pending tasks
        const taskManifest = await loadTasks(directory)
        if (taskManifest && Array.isArray(taskManifest.tasks) && taskManifest.tasks.length > 0) {
          const pendingCount = taskManifest.tasks.filter(task => {
            const status = String(task.status ?? "pending").toLowerCase()
            return status !== "completed" && status !== "cancelled"
          }).length
          if (pendingCount > 0) items.push(`Review ${pendingCount} pending task(s)`)
        }

        // Session Boundary check
        const role = (state.session.role || "").toLowerCase()
        const contextPercent = estimateContextPercent(state.metrics.turn_count, config.auto_compact_on_turns)
        let completedBranchCount = 0
        const tree = await loadTree(directory)
        if (tree.root) completedBranchCount = countCompleted(tree)

        const boundaryRecommendation = shouldCreateNewSession({
          turnCount: state.metrics.turn_count,
          contextPercent,
          hierarchyComplete: completedBranchCount > 0,
          isMainSession: !role.includes("subagent"),
          hasDelegations: (state.cycle_log ?? []).some(entry => entry.tool === "task"),
        })

        if (boundaryRecommendation.recommended) {
           items.push(`Session boundary reached: ${boundaryRecommendation.reason}`)
        }

        // Research artifacts check (if applicable, generic)
        items.push("Are research artifacts symlinked? (if created)")

        const checklist = buildChecklist(items, 1000) // Increased budget for checklist
        if (checklist) {
          appendSyntheticPart(output.messages[index], checklist)
        }
      }

    } catch {
      // P3: never break message flow
    }
  }
}
