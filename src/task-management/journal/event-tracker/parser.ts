import type {
  JourneyEventType,
  ParsedDelegationTarget,
  ParsedSessionArtifact,
  ParsedSessionCounters,
  ParsedSessionExportMeta,
  ParsedSessionHeader,
  ParsedSessionJourneyMeta,
  ParsedSubSession,
  ParsedSessionTurn,
  ParsedToolInvocation,
  SessionJourneyCounters,
} from "./types.js"

function requiredString(value: unknown, field: string, source: "JSON" | "Markdown"): string {
  if (typeof value === "string" && value.trim()) {
    return value
  }
  throw new Error(`[Harness] Event-tracker ${source} missing required ${field}`)
}

function requiredStatus(value: unknown, source: "JSON" | "Markdown"): ParsedSessionJourneyMeta["status"] {
  if (value === "active" || value === "idle" || value === "completed") {
    return value
  }
  throw new Error(`[Harness] Event-tracker ${source} missing required status`)
}

function parseCounters(value: unknown): SessionJourneyCounters {
  if (typeof value !== "object" || value === null) {
    throw new Error("[Harness] Event-tracker JSON missing required counters")
  }
  const counter = value as Partial<Record<keyof SessionJourneyCounters, unknown>>
  return {
    eventCount: typeof counter.eventCount === "number" ? counter.eventCount : 0,
    sessionStartCount: typeof counter.sessionStartCount === "number" ? counter.sessionStartCount : 0,
    sessionEndCount: typeof counter.sessionEndCount === "number" ? counter.sessionEndCount : 0,
  }
}

function parseEventTypes(value: unknown): JourneyEventType[] {
  if (!Array.isArray(value)) {
    return []
  }
  return value
    .map((event) => (typeof event === "object" && event !== null ? (event as { type?: unknown }).type : undefined))
    .filter((type): type is JourneyEventType => (
      type === "session_start"
      || type === "session_updated"
      || type === "session_idle"
      || type === "session_end"
      || type === "session_event"
    ))
}

/** Parse required selective metadata from an event-tracker JSON read model. */
export function parseSessionJourneyJson(content: string): ParsedSessionJourneyMeta {
  let parsed: unknown
  try {
    parsed = JSON.parse(content) as unknown
  } catch {
    throw new Error("[Harness] Event-tracker JSON is not valid JSON")
  }
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("[Harness] Event-tracker JSON missing required sessionId")
  }
  const record = parsed as Record<string, unknown>
  return {
    sessionId: requiredString(record.sessionId, "sessionId", "JSON"),
    artifactStem: requiredString(record.artifactStem, "artifactStem", "JSON"),
    status: requiredStatus(record.status, "JSON"),
    counters: parseCounters(record.counters),
    eventTypes: parseEventTypes(record.events),
  }
}

function parseMarkdownCounter(markdown: string, name: keyof SessionJourneyCounters): number {
  const match = markdown.match(new RegExp(`\\*\\*${name}:\\*\\*\\s*(\\d+)`))
  return match?.[1] ? Number.parseInt(match[1], 10) : 0
}

/** Parse required selective metadata from an event-tracker Markdown read model. */
export function parseSessionJourneyMarkdown(markdown: string): ParsedSessionJourneyMeta {
  const sessionId = markdown.match(/\*\*Session ID:\*\*\s*(.+)/)?.[1]?.trim()
  const artifactStem = markdown.match(/\*\*Artifact Stem:\*\*\s*(.+)/)?.[1]?.trim()
  const status = markdown.match(/\*\*Status:\*\*\s*(.+)/)?.[1]?.trim()
  if (!sessionId) {
    throw new Error("[Harness] Event-tracker Markdown missing required Session ID")
  }
  if (!artifactStem) {
    throw new Error("[Harness] Event-tracker Markdown missing required Artifact Stem")
  }
  return {
    sessionId,
    artifactStem,
    status: requiredStatus(status, "Markdown"),
    counters: {
      eventCount: parseMarkdownCounter(markdown, "eventCount"),
      sessionStartCount: parseMarkdownCounter(markdown, "sessionStartCount"),
      sessionEndCount: parseMarkdownCounter(markdown, "sessionEndCount"),
    },
    eventTypes: Array.from(markdown.matchAll(/\|\s*\d+\s*\|\s*\d+\s*\|\s*[^|]+\|\s*([^|\s]+)\s*\|/g)).map((match) => match[1] as JourneyEventType),
  }
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
  const seconds = value.trim().match(/^([\d.]+)s$/)
  if (seconds?.[1]) return Math.round(Number.parseFloat(seconds[1]) * 1000)
  const ms = value.trim().match(/^(\d+)ms$/)
  return ms?.[1] ? Number.parseInt(ms[1], 10) : null
}

function splitTurns(markdown: string): string[] {
  return markdown.split(/^(?=## User)/m).filter((part) => part.trimStart().startsWith("## User"))
}

function extractUserMessage(block: string): string {
  return block.match(/##\s+User\s*\n([\s\S]*?)(?=\n---|\n##\s+Assistant|\n\*\*Tool:|$)/)?.[1]?.trim() ?? ""
}

function extractAssistantHeader(block: string): string {
  return block.match(/##\s+Assistant\s*\([^)]+\)/)?.[0] ?? ""
}

function extractAssistantContent(block: string, assistantHeader: string): string {
  if (!assistantHeader) return ""
  const escaped = assistantHeader.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  return block.match(new RegExp(`${escaped}\\s*\\n([\\s\\S]*)`))?.[1]?.trim() ?? ""
}

function parseAssistantMeta(header: string): Pick<ParsedSessionTurn, "agentName" | "model" | "durationMs"> {
  const body = header.match(/##\s+Assistant\s*\((.+?)\)/)?.[1]
  if (!body) return { agentName: "", model: "", durationMs: null }
  const [agentName = "", model = "", duration = ""] = body.split("·").map((part) => part.trim())
  return { agentName, model, durationMs: parseDurationMs(duration) }
}

function extractThinking(assistantContent: string): string | null {
  return assistantContent.match(/(?:_Thinking:_|\*\*Thinking:\*\*|###\s*Thinking|Thinking:)\s*\n([\s\S]*?)(?=\n\*\*Tool:|\n---|$)/)?.[1]?.trim() ?? null
}

function summarizeOutput(value: string): string {
  const trimmed = value.trim()
  return trimmed.length <= 500 ? trimmed : `${trimmed.slice(0, 499)}…`
}

function boundText(value: string, maxLength: number): string {
  const trimmed = value.trim()
  return trimmed.length <= maxLength ? trimmed : `…${trimmed.slice(-(maxLength - 1))}`
}

function extractToolInvocations(block: string): ParsedToolInvocation[] {
  const invocations: ParsedToolInvocation[] = []
  const toolBlocks = block.split(/(?=\*\*Tool(?::\*\*\s*|:\s*)[^\n*]+(?:\*\*)?)/g)
  for (const toolBlock of toolBlocks) {
    const toolName = toolBlock.match(/\*\*Tool(?::\*\*\s*|:\s*)([^\n*]+)(?:\*\*)?/)?.[1]?.trim()
    if (!toolName) continue
    const input = toolBlock.match(/\*\*Input:\*\*\s*\n```(?:json)?\s*\n([\s\S]*?)\n```/)?.[1]?.trim() ?? ""
    const output = toolBlock.match(/\*\*Output:\*\*\s*\n```\s*\n([\s\S]*?)\n```/)?.[1]?.trim() ?? ""
    invocations.push({ toolName, input, outputSummary: summarizeOutput(output) })
  }
  return invocations
}

function extractDelegations(invocations: ParsedToolInvocation[]): ParsedDelegationTarget[] {
  const delegations: ParsedDelegationTarget[] = []
  for (const invocation of invocations) {
    if (invocation.toolName !== "task") continue
    try {
      const parsed = JSON.parse(invocation.input) as Record<string, unknown>
      const delegatedTo = typeof parsed.agent === "string" ? parsed.agent : typeof parsed.subagent_type === "string" ? parsed.subagent_type : ""
      if (!delegatedTo) continue
      delegations.push({
        packetId: typeof parsed.packet_id === "string" ? parsed.packet_id : null,
        subSessionId: invocation.outputSummary.match(/task_id:\s*(ses_[A-Za-z0-9]+)/)?.[1] ?? null,
        delegatedTo,
        description: typeof parsed.description === "string" ? parsed.description : "",
        subagentType: typeof parsed.subagent_type === "string" ? parsed.subagent_type : delegatedTo,
      })
    } catch {
      // Malformed task payloads are not delegation evidence.
    }
  }
  return delegations
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter((value) => value.trim()).map((value) => value.trim())))
}

function extractAssistantActors(markdown: string): string[] {
  return Array.from(markdown.matchAll(/^##\s+Assistant\s*\(([^·)]+)/gm)).map((match) => match[1]?.trim() ?? "")
}

function extractActors(markdown: string, turns: ParsedSessionTurn[]): string[] {
  const users = turns.some((turn) => turn.userMessage) ? ["user"] : []
  const assistantActors = extractAssistantActors(markdown)
  const delegatedActors = turns.flatMap((turn) => turn.delegations.map((delegation) => delegation.subagentType || delegation.delegatedTo))
  return unique([...users, ...assistantActors, ...delegatedActors])
}

function extractLastAssistantOutput(markdown: string): string {
  const matches = Array.from(markdown.matchAll(/^##\s+Assistant\s*\([^)]+\)\s*\n/gm))
  const last = matches.at(-1)
  if (!last || last.index === undefined) return ""
  const start = last.index + last[0].length
  const nextUser = markdown.slice(start).search(/^---\s*\n\s*##\s+User\s*$/m)
  const content = nextUser >= 0 ? markdown.slice(start, start + nextUser) : markdown.slice(start)
  return boundText(content.replace(/\n{3,}/g, "\n\n"), 2_000)
}

function extractSubSessions(turns: ParsedSessionTurn[], sourceSessionId: string): ParsedSubSession[] {
  const bySession = new Map<string, ParsedSubSession>()
  for (const delegation of turns.flatMap((turn) => turn.delegations)) {
    if (!delegation.subSessionId) continue
    bySession.set(delegation.subSessionId, {
      sessionId: delegation.subSessionId,
      role: delegation.subagentType || delegation.delegatedTo,
      delegatedTo: delegation.delegatedTo,
      sourceSessionId,
      description: delegation.description,
    })
  }
  return Array.from(bySession.values())
}

function artifactStemFromSessionId(sessionId: string): string {
  const explicit = sessionId.match(/ses[_-]?([A-Za-z0-9]{4})/i)?.[1]
  const suffixSource = explicit ?? sessionId.replace(/[^A-Za-z0-9]/g, "").slice(-4)
  return `ses_${suffixSource.padEnd(4, "0").slice(0, 4).toLowerCase()}`
}

function buildExportMeta(header: ParsedSessionHeader, turns: ParsedSessionTurn[]): ParsedSessionExportMeta {
  return {
    title: header.title,
    artifactStem: artifactStemFromSessionId(header.sessionId || header.title),
    created: header.created,
    updated: header.updated,
    turnCount: turns.length,
  }
}

function count(turns: ParsedSessionTurn[]): ParsedSessionCounters {
  return {
    userMessageCount: turns.filter((turn) => turn.userMessage.length > 0).length,
    assistantOutputCount: turns.filter((turn) => turn.assistantContent.length > 0).length,
    toolCallCount: turns.reduce((sum, turn) => sum + turn.toolInvocations.length, 0),
    delegationCount: turns.reduce((sum, turn) => sum + turn.delegations.length, 0),
  }
}

/** Parse product-detox-style session Markdown into bounded metadata. */
export function parseProductDetoxSessionMarkdown(markdown: string): ParsedSessionArtifact {
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
  const header = parseHeader(markdown)
  return {
    header,
    turns,
    counters: count(turns),
    actors: extractActors(markdown, turns),
    mainSessionId: header.sessionId,
    subSessions: extractSubSessions(turns, header.sessionId),
    lastMessageOutput: extractLastAssistantOutput(markdown),
    meta: buildExportMeta(header, turns),
  }
}
