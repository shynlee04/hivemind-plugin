import { createStateManager, loadConfig } from "../lib/persistence.js"

type MessagePart = {
  type?: string
  text?: string
  synthetic?: boolean
  [key: string]: unknown
}

export interface MessageV2 {
  role?: string
  content?: string | MessagePart[]
  synthetic?: boolean
  [key: string]: unknown
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

      const items: string[] = []
      if (!state.hierarchy.action) {
        items.push("Declare action-level focus before stopping")
      }

      const checklist = buildChecklist(items, 300)
      if (!checklist) return

      output.messages.push(syntheticSystemMessage(checklist))
    } catch {
      // P3: never break message flow
    }
  }
}
