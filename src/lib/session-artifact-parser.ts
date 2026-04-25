export type ParsedSessionHeader = {
  title: string
  sessionId: string
  created: string
  updated: string
}

export type ParsedToolInvocation = {
  toolName: string
  input: string
  outputSummary: string
  timestamp?: string
}

export type ParsedDelegationTarget = {
  packetId: string | null
  delegatedTo: string
  description: string
  subagentType: string
}

export type ParsedSessionTurn = {
  turnNumber: number
  userMessage: string
  assistantContent: string
  thinking: string | null
  agentName: string
  model: string
  durationMs: number | null
  toolInvocations: ParsedToolInvocation[]
  delegations: ParsedDelegationTarget[]
}

export type ParsedSessionCounters = {
  userMessageCount: number
  assistantOutputCount: number
  toolCallCount: number
  delegationCount: number
}

export type ParsedSessionArtifact = {
  header: ParsedSessionHeader
  turns: ParsedSessionTurn[]
  counters: ParsedSessionCounters
}

function emptyHeader(): ParsedSessionHeader {
  return { title: "", sessionId: "", created: "", updated: "" }
}

function parseHeader(markdown: string): ParsedSessionHeader {
  const header = emptyHeader()
  header.title = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? ""
  header.sessionId = markdown.match(/\*\*Session ID:\*\*\s*(.+)/)?.[1]?.trim() ?? ""
  header.created = markdown.match(/\*\*Created:\*\*\s*(.+)/)?.[1]?.trim() ?? ""
  header.updated = markdown.match(/\*\*Updated:\*\*\s*(.+)/)?.[1]?.trim() ?? ""
  return header
}

function parseDurationMs(value: string): number | null {
  const trimmed = value.trim()
  const seconds = trimmed.match(/^([\d.]+)s$/)
  if (seconds?.[1]) {
    return Math.round(Number.parseFloat(seconds[1]) * 1000)
  }
  const ms = trimmed.match(/^(\d+)ms$/)
  return ms?.[1] ? Number.parseInt(ms[1], 10) : null
}

function splitTurns(markdown: string): string[] {
  if (!markdown.trim()) {
    return []
  }
  return markdown.split(/^(?=## User)/m).filter((part) => part.trimStart().startsWith("## User"))
}

function extractUserMessage(block: string): string {
  return block.match(/##\s+User\s*\n([\s\S]*?)(?=\n---|\n##\s+Assistant|\n\*\*Tool:|$)/)?.[1]?.trim() ?? ""
}

function extractAssistantHeader(block: string): string {
  return block.match(/##\s+Assistant\s*\([^)]+\)/)?.[0] ?? ""
}

function extractAssistantContent(block: string, assistantHeader: string): string {
  if (!assistantHeader) {
    return ""
  }
  const escaped = assistantHeader.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  return block.match(new RegExp(`${escaped}\\s*\\n([\\s\\S]*)`))?.[1]?.trim() ?? ""
}

function parseAssistantMeta(header: string): Pick<ParsedSessionTurn, "agentName" | "model" | "durationMs"> {
  const body = header.match(/##\s+Assistant\s*\((.+?)\)/)?.[1]
  if (!body) {
    return { agentName: "", model: "", durationMs: null }
  }
  const [agentName = "", model = "", duration = ""] = body.split("·").map((part) => part.trim())
  return { agentName, model, durationMs: parseDurationMs(duration) }
}

function extractThinking(assistantContent: string): string | null {
  const match = assistantContent.match(/(?:_Thinking:_|\*\*Thinking:\*\*|###\s*Thinking|Thinking:)\s*\n([\s\S]*?)(?=\n\*\*Tool:|\n---|$)/)
  return match?.[1]?.trim() ?? null
}

function summarizeOutput(value: string): string {
  const trimmed = value.trim()
  return trimmed.length <= 500 ? trimmed : `${trimmed.slice(0, 499)}…`
}

function extractToolInvocations(block: string): ParsedToolInvocation[] {
  const invocations: ParsedToolInvocation[] = []
  const toolBlocks = block.split(/(?=\*\*Tool:\s*[^*]+?\s*\*\*)/g)
  for (const toolBlock of toolBlocks) {
    const toolName = toolBlock.match(/\*\*Tool:\s*([^*]+?)\s*\*\*/)?.[1]?.trim()
    if (!toolName) {
      continue
    }
    const input = toolBlock.match(/\*\*Input:\*\*\s*\n```(?:json)?\s*\n([\s\S]*?)\n```/)?.[1]?.trim() ?? ""
    const output = toolBlock.match(/\*\*Output:\*\*\s*\n```\s*\n([\s\S]*?)\n```/)?.[1]?.trim() ?? ""
    invocations.push({
      toolName,
      input,
      outputSummary: summarizeOutput(output),
    })
  }
  return invocations
}

function extractDelegations(invocations: ParsedToolInvocation[]): ParsedDelegationTarget[] {
  const delegations: ParsedDelegationTarget[] = []
  for (const invocation of invocations) {
    if (invocation.toolName !== "task") {
      continue
    }
    try {
      const parsed = JSON.parse(invocation.input) as Record<string, unknown>
      const agent = typeof parsed.agent === "string" ? parsed.agent : ""
      if (!agent) {
        continue
      }
      delegations.push({
        packetId: typeof parsed.packet_id === "string" ? parsed.packet_id : null,
        delegatedTo: agent,
        description: typeof parsed.description === "string" ? parsed.description : "",
        subagentType: typeof parsed.subagent_type === "string" ? parsed.subagent_type : agent,
      })
    } catch {
      // Malformed task payloads are not delegation evidence.
    }
  }
  return delegations
}

function count(turns: ParsedSessionTurn[]): ParsedSessionCounters {
  return {
    userMessageCount: turns.filter((turn) => turn.userMessage.length > 0).length,
    assistantOutputCount: turns.filter((turn) => turn.assistantContent.length > 0).length,
    toolCallCount: turns.reduce((sum, turn) => sum + turn.toolInvocations.length, 0),
    delegationCount: turns.reduce((sum, turn) => sum + turn.delegations.length, 0),
  }
}

/** Parse a markdown session artifact into bounded metadata, turns, tools, and delegation evidence. */
export function parseSessionArtifactMarkdown(markdown: string): ParsedSessionArtifact {
  const turns = splitTurns(markdown).map((block, index) => {
    const assistantHeader = extractAssistantHeader(block)
    const assistantContent = extractAssistantContent(block, assistantHeader)
    const toolInvocations = extractToolInvocations(block)
    return {
      turnNumber: index + 1,
      userMessage: extractUserMessage(block),
      assistantContent,
      thinking: extractThinking(assistantContent),
      ...parseAssistantMeta(assistantHeader),
      toolInvocations,
      delegations: extractDelegations(toolInvocations),
    }
  })

  return { header: parseHeader(markdown), turns, counters: count(turns) }
}
