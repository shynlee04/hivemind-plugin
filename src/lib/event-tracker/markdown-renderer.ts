import type { SessionJourneyDocument, SessionJourneyEvent } from "./types.js"

/**
 * Normalizes untrusted scalar text for safe, bounded Markdown rendering.
 *
 * @param value - Raw text to render in Markdown metadata, list items, or table cells.
 * @returns Text with control characters collapsed, whitespace normalized, and length bounded.
 *
 * @example
 * ```ts
 * sanitizeMarkdownScalar("hello\nworld") // "hello world"
 * ```
 */
export function sanitizeMarkdownScalar(value: string): string {
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 2_000)
}

/**
 * Renders one bounded journey event block for a session artifact Markdown file.
 *
 * @param event - Event-tracker journey event to render.
 * @returns Markdown block preserving the historical event heading and metadata shape.
 *
 * @example
 * ```ts
 * const markdown = renderJourneyEventMarkdown(event)
 * markdown.startsWith("## ") // true
 * ```
 */
export function renderJourneyEventMarkdown(event: SessionJourneyEvent): string {
  return [
    `## ${sanitizeMarkdownScalar(event.title)}`,
    "",
    `- Timestamp: ${event.timestamp}`,
    `- Actor: ${sanitizeMarkdownScalar(event.actor)}`,
    `- Type: ${sanitizeMarkdownScalar(event.type)}`,
    `- Source: ${sanitizeMarkdownScalar(event.source)}`,
    `- State role: ${sanitizeMarkdownScalar(event.stateRole)}`,
    `- Summary: ${sanitizeMarkdownScalar(event.summary)}`,
  ].join("\n")
}

/**
 * Renders a complete event-tracker journey document to Markdown.
 *
 * @param document - Normalized event-tracker document to render.
 * @returns Markdown preserving the `# ses_`, counters, table-of-contents, and event sections.
 *
 * @example
 * ```ts
 * const markdown = renderDocumentMarkdown(document)
 * markdown.includes("## Table of Contents") // true
 * ```
 */
export function renderDocumentMarkdown(document: SessionJourneyDocument): string {
  const lineage = normalizeStringArray(document.lineage)
  const keyFindings = normalizeStringArray(document.keyFindings)
  const purposeClass = typeof document.purposeClass === "string" && document.purposeClass.trim().length > 0
    ? document.purposeClass
    : "unspecified"
  const resumable = typeof document.resumable === "boolean" ? document.resumable : true
  const rows = document.toc.map((entry) => (
    `| ${entry.index} | ${entry.timestamp} | ${escapeCell(entry.actor)} | ${entry.type} | ${escapeCell(entry.summary)} |`
  ))
  return [
    `# ${sanitizeMarkdownScalar(document.artifactStem)}`,
    "",
    `**Session ID:** ${sanitizeMarkdownScalar(document.sessionId)}`,
    `**Artifact Stem:** ${sanitizeMarkdownScalar(document.artifactStem)}`,
    `**Main Session ID:** ${sanitizeMarkdownScalar(document.mainSessionId ?? "")}`,
    `**Lineage:** ${lineage.length > 0 ? sanitizeMarkdownScalar(lineage.join(" → ")) : "None"}`,
    `**Purpose Class:** ${sanitizeMarkdownScalar(purposeClass)}`,
    `**Key Findings:** ${keyFindings.length > 0 ? sanitizeMarkdownScalar(keyFindings.join("; ")) : "None"}`,
    `**Resumable:** ${resumable}`,
    `**Updated:** ${document.updatedAt}`,
    `**Status:** ${document.status}`,
    `**eventCount:** ${document.counters.eventCount}`,
    `**sessionStartCount:** ${document.counters.sessionStartCount}`,
    `**sessionEndCount:** ${document.counters.sessionEndCount}`,
    `**Actors:** ${sanitizeMarkdownScalar(document.actors.join(", "))}`,
    `**Sub Sessions:** ${document.subSessions.length}`,
    `**Delegations:** ${document.delegations.length}`,
    `**Tools Used:** ${sanitizeMarkdownScalar(document.toolsUsed.map((tool) => tool.toolName).join(", "))}`,
    `**Last Output:** ${sanitizeMarkdownScalar(document.lastMessageOutput)}`,
    "",
    "---",
    "",
    "## Table of Contents",
    "",
    "| # | Timestamp | Actor | Type | Summary |",
    "|---|-----------|-------|------|---------|",
    ...rows,
    "",
    "---",
    ...document.events.flatMap((event) => [renderJourneyEventMarkdown(event), ""]),
  ].join("\n")
}

function escapeCell(value: string): string {
  return sanitizeMarkdownScalar(value).replace(/\|/g, "\\|")
}

function normalizeStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []
}
