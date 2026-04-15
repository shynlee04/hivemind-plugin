import type { OpenCodeClient } from "./session-api.js"
import type { CapturedResult, ToolCallSummary } from "./types.js"
import { getSessionMessages } from "./session-api.js"

const MAX_RESULT_TEXT_LENGTH = 10240
const MAX_TOOL_CALL_ARGS_LENGTH = 200
const MAX_TOOL_CALL_SUMMARIES = 50

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

function getMessageRole(message: unknown): string | undefined {
  if (!isRecord(message)) return undefined
  if (typeof message.role === "string") return message.role
  const info = isRecord(message.info) ? message.info : undefined
  if (info && typeof info.role === "string") return info.role
  return undefined
}

type NormalizedToolPart = {
  tool: string
  args?: unknown
  output?: unknown
  status?: string
}

function getPartToolName(part: Record<string, unknown>): string | undefined {
  return typeof part.tool === "string"
    ? part.tool
    : typeof part.name === "string"
      ? part.name
      : undefined
}

function getPartState(part: Record<string, unknown>): Record<string, unknown> | undefined {
  return isRecord(part.state) ? part.state : undefined
}

function normalizeToolPart(part: unknown): NormalizedToolPart | undefined {
  if (!isRecord(part)) return undefined
  const type = part.type
  if (type !== "tool-call" && type !== "tool_call" && type !== "tool") return undefined

  const tool = getPartToolName(part)
  if (!tool) return undefined

  const state = getPartState(part)
  const args = state?.input ?? part.arguments ?? part.args
  const output = state?.output ?? part.output ?? part.text
  const status = typeof state?.status === "string" ? state.status : undefined

  return { tool, args, output, status }
}

function stringifyPartValue(value: unknown, maxLength: number): string | undefined {
  if (value === undefined || value === null) return undefined
  if (typeof value === "string") {
    return truncateToMax(value, maxLength)
  }

  try {
    return truncateToMax(JSON.stringify(value), maxLength)
  } catch {
    return undefined
  }
}

export function extractAssistantText(messages: unknown[]): string {
  let combined = ""
  for (const msg of messages) {
    if (!isRecord(msg) || getMessageRole(msg) !== "assistant") continue
    const parts = isArray(msg.parts) ? msg.parts : []
    for (const part of parts) {
      if (!isRecord(part)) continue
      if (part.type === "text" && typeof part.text === "string") {
        combined += part.text
      }
    }
  }
  return truncateResultText(combined)
}

export function extractToolCallSummary(messages: unknown[]): ToolCallSummary[] {
  const summaries: ToolCallSummary[] = []
  for (const msg of messages) {
    if (!isRecord(msg) || getMessageRole(msg) !== "assistant") continue
    const parts = isArray(msg.parts) ? msg.parts : []
    for (const part of parts) {
      const normalized = normalizeToolPart(part)
      if (!normalized) continue

      summaries.push({
        tool: normalized.tool,
        args: stringifyPartValue(normalized.args, MAX_TOOL_CALL_ARGS_LENGTH),
        output: stringifyPartValue(normalized.output, MAX_RESULT_TEXT_LENGTH),
        status: normalized.status,
      })
      if (summaries.length >= MAX_TOOL_CALL_SUMMARIES) return summaries
    }
  }
  return summaries
}

export function extractArtifactPaths(messages: unknown[]): string[] {
  const paths: string[] = []
  const seen = new Set<string>()
  const recognizedTools = new Set(["Write", "Edit", "read", "write"])

  for (const msg of messages) {
    if (!isRecord(msg) || getMessageRole(msg) !== "assistant") continue
    const parts = isArray(msg.parts) ? msg.parts : []
    for (const part of parts) {
      const normalized = normalizeToolPart(part)
      if (!normalized) continue

      const toolName = normalized.tool
      if (!recognizedTools.has(toolName)) continue
      const args = isRecord(normalized.args) ? normalized.args : undefined
      if (!args) continue
      const path = typeof args.filePath === "string" ? args.filePath
        : typeof args.path === "string" ? args.path
        : undefined
      if (path && !seen.has(path)) {
        seen.add(path)
        paths.push(path)
      }
    }
  }
  return paths
}

export function extractGitCommits(messages: unknown[]): string[] {
  const commits: string[] = []
  const seen = new Set<string>()
  const shaPattern = /[0-9a-f]{7,40}/g

  const collectMatches = (text: string): void => {
    const matches = text.matchAll(shaPattern)
    for (const match of matches) {
      const sha = match[0]
      if (!seen.has(sha)) {
        seen.add(sha)
        commits.push(sha)
      }
    }
  }

  for (const msg of messages) {
    if (!isRecord(msg)) continue
    const parts = isArray(msg.parts) ? msg.parts : []
    for (const part of parts) {
      if (!isRecord(part)) continue
      // Check tool-result parts for SHAs in output text
      if (part.type === "tool-result" || part.type === "tool_result" || part.type === "result") {
        const output = typeof part.output === "string" ? part.output
          : typeof part.text === "string" ? part.text
          : ""
        collectMatches(output)
      }

      const normalized = normalizeToolPart(part)
      if (normalized && (normalized.tool === "bash" || normalized.tool === "Bash")) {
        const args = isRecord(normalized.args) ? normalized.args : undefined
        const cmd = typeof args?.command === "string" ? args.command : ""
        if (cmd.includes("git commit")) {
          const outputText = stringifyPartValue(normalized.output, MAX_RESULT_TEXT_LENGTH)
          if (outputText) {
            collectMatches(outputText)
          }
        }
      }
    }
  }
  return commits
}

export async function captureSubsessionResult(
  client: OpenCodeClient,
  sessionID: string,
): Promise<CapturedResult> {
  try {
    const messages = await getSessionMessages(client, sessionID)
    return {
      resultText: extractAssistantText(messages),
      artifactPaths: extractArtifactPaths(messages),
      gitCommits: extractGitCommits(messages),
      toolCallSummary: extractToolCallSummary(messages),
      messageCount: messages.length,
      capturedAt: Date.now(),
    }
  } catch {
    return {
      resultText: "",
      artifactPaths: [],
      gitCommits: [],
      toolCallSummary: [],
      messageCount: 0,
      capturedAt: Date.now(),
      partial: true,
    }
  }
}

export function captureProcessResult(stdout: string, stderr: string): CapturedResult {
  const combined = stdout + (stderr ? "\n" + stderr : "")
  return {
    resultText: truncateResultText(combined),
    artifactPaths: [],
    gitCommits: [],
    toolCallSummary: [],
    messageCount: 1,
    capturedAt: Date.now(),
  }
}

export function truncateResultText(text: string): string {
  if (text.length > MAX_RESULT_TEXT_LENGTH) {
    return text.slice(0, MAX_RESULT_TEXT_LENGTH) + "...[truncated]"
  }
  return text
}

function truncateToMax(text: string, maxLength: number): string {
  if (text.length > maxLength) {
    return text.slice(0, maxLength) + "..."
  }
  return text
}
