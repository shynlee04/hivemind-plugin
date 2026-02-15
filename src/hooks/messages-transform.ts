import { createStateManager, loadConfig } from "../lib/persistence.js"
import { loadAnchors } from "../lib/anchors.js"
import { countCompleted, getAncestors, loadTree } from "../lib/hierarchy-tree.js"
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

  const lines = ["<system-reminder>", "CHECKLIST BEFORE STOPPING:"]
  for (const item of items) {
    const candidate = [...lines, `- [ ] ${item}`, "</system-reminder>"].join("\n")
    if (candidate.length > maxChars) break
    lines.push(`- [ ] ${item}`)
  }
  lines.push("</system-reminder>")
  return lines.join("\n")
}

function syntheticSystemMessage(text: string): MessageV2 {
  return {
    role: "system",
    synthetic: true,
    content: [
      {
        type: "text",
        text,
        synthetic: true,
      },
    ],
  }
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
  anchors: Array<{ key: string; value: string; created_at: number }>,
  maxChars: number
): string {
  if (anchors.length === 0) return ""

  const sorted = [...anchors].sort((a, b) => b.created_at - a.created_at).slice(0, 3)
  const lines = ["<anchor-context>"]
  for (const anchor of sorted) {
    const candidate = [...lines, `- [${anchor.key}]: ${anchor.value}`, "</anchor-context>"].join("\n")
    if (candidate.length > maxChars) break
    lines.push(`- [${anchor.key}]: ${anchor.value}`)
  }
  lines.push("</anchor-context>")
  return lines.length > 2 ? lines.join("\n") : ""
}

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
    }
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

  message.content = [syntheticPart]
}

async function buildFocusPath(directory: string, fallback: { trajectory: string; tactic: string; action: string }): Promise<string> {
  const tree = await loadTree(directory)
  if (tree.root && tree.cursor) {
    const ancestors = getAncestors(tree.root, tree.cursor)
    if (ancestors.length > 0) {
      return ancestors.map(node => node.content).join(" > ")
    }
  }

  return [fallback.trajectory, fallback.tactic, fallback.action].filter(Boolean).join(" > ")
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

      const anchorsState = await loadAnchors(directory)
      const anchorContext = buildAnchorContext(anchorsState.anchors, 200)
      if (anchorContext) {
        const index = getLastNonSyntheticUserMessageIndex(output.messages)
        if (index >= 0) {
          const focusPath = await buildFocusPath(directory, state.hierarchy)
          const continuityLines = [anchorContext]
          if (focusPath) {
            continuityLines.unshift(`<focus>${focusPath}</focus>`)
          }
          prependSyntheticPart(output.messages[index], continuityLines.join("\n"))
        }
      }

      const items: string[] = []
      if (!state.hierarchy.action) {
        items.push("Action-level focus is missing (call map_context)")
      }
      if (state.metrics.context_updates === 0) {
        items.push("No map_context updates yet in this session")
      }
      if (state.pending_failure_ack) {
        items.push("Acknowledge pending subagent failure")
      }
      if (state.metrics.files_touched.length > 0) {
        items.push("Create a git commit for touched files")
      }

      const role = (state.session.role || "").toLowerCase()
      const contextPercent = estimateContextPercent(
        state.metrics.turn_count,
        config.auto_compact_on_turns
      )

      let completedBranchCount = 0
      const tree = await loadTree(directory)
      if (tree.root) {
        completedBranchCount = countCompleted(tree)
      }

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

      const checklist = buildChecklist(items, 300)
      if (!checklist) return

      const index = getLastNonSyntheticUserMessageIndex(output.messages)
      if (index >= 0) {
        prependSyntheticPart(output.messages[index], checklist)
        return
      }

      // Legacy compatibility fallback. New SDK shape should inject into parts above.
      output.messages.push(syntheticSystemMessage(checklist))
    } catch {
      // P3: never break message flow
    }
  }
}
