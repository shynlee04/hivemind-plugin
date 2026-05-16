/**
 * Session writer for main session `.md` knowledge files.
 *
 * Creates and manages Markdown files with YAML frontmatter under
 * `.hivemind/session-tracker/{sessionID}/`. All writes use atomic rename.
 *
 * Uses `gray-matter` for frontmatter parsing and `yaml` for YAML serialization.
 *
 * @module session-tracker/persistence/session-writer
 */

import matter from "gray-matter"
import { stringify as yamlStringify } from "yaml"
import { readFile, writeFile, rename } from "node:fs/promises"
import { dirname } from "node:path"
import { ensureDirectory, atomicAppendMarkdown, safeSessionPath } from "./atomic-write.js"
import type { SessionRecord, JourneyEntry } from "../types.js"

// ---------------------------------------------------------------------------
// SessionWriter class
// ---------------------------------------------------------------------------

/**
 * Manages the main session `.md` knowledge file for a single session.
 *
 * Files are stored at:
 * `.hivemind/session-tracker/{sessionID}/{sessionID}.md`
 *
 * Writes are append-per-event (D-04) with atomic rename (D-03).
 */
export class SessionWriter {
  private projectRoot: string

  /**
   * @param deps - Injected dependencies.
   * @param deps.projectRoot - Absolute path to the project root.
   */
  constructor(deps: { projectRoot: string }) {
    this.projectRoot = deps.projectRoot
  }

  /**
   * Creates the session subdirectory under `.hivemind/session-tracker/`.
   *
   * @param sessionID - The session identifier.
   * @returns The absolute path to the created directory.
   */
  async createSessionDir(sessionID: string): Promise<string> {
    const dirPath = safeSessionPath(this.projectRoot, sessionID, "")
    await ensureDirectory(dirPath)
    return dirPath
  }

  /**
   * Gets the absolute path to the main session `.md` file.
   *
   * @param sessionID - The session identifier.
   * @returns Absolute path to the session .md file.
   */
  private getSessionFilePath(sessionID: string): string {
    return safeSessionPath(this.projectRoot, sessionID, `${sessionID}.md`)
  }

  /**
   * Writes the initial `.md` file with YAML frontmatter.
   *
   * @param sessionID - The session identifier.
   * @param metadata - Frontmatter data to write.
   * @returns Promise that resolves when the file is written.
   */
  async initializeSessionFile(
    sessionID: string,
    metadata: Partial<SessionRecord>,
  ): Promise<void> {
    const filePath = this.getSessionFilePath(sessionID)
    const frontmatter: Record<string, unknown> = {
      sessionID: metadata.sessionID ?? sessionID,
      created: metadata.created ?? new Date().toISOString(),
      updated: metadata.updated ?? new Date().toISOString(),
      parentSessionID: metadata.parentSessionID ?? null,
      delegationDepth: metadata.delegationDepth ?? 0,
      children: metadata.children ?? [],
      continuityIndex: metadata.continuityIndex ?? "session-continuity.json",
      status: metadata.status ?? "active",
    }

    const yamlStr = yamlStringify(frontmatter)
    const content = `---\n${yamlStr}---\n`

    // Atomic write (overwrite, not append) — WR-03 fix
    const tmpPath = `${filePath}.tmp.${Date.now()}`
    await ensureDirectory(dirname(filePath))
    await writeFile(tmpPath, content, "utf-8")
    await rename(tmpPath, filePath)
  }

  /**
   * Appends a user turn section to the session `.md` file.
   *
   * @param sessionID - The session identifier.
   * @param turnNumber - The one-based turn number.
   * @param content - The user's message content.
   * @returns Promise that resolves when the turn is appended.
   */
  async appendUserTurn(
    sessionID: string,
    turnNumber: number,
    content: string,
  ): Promise<void> {
    const filePath = this.getSessionFilePath(sessionID)
    const section = `## USER (turn ${turnNumber})\n\n${content}\n`
    await atomicAppendMarkdown(filePath, section)
  }

  /**
   * Appends a `main_l0_agent` section to the session `.md` file.
   *
   * @param sessionID - The session identifier.
   * @param agentName - The agent's display name.
   * @param model - The model identifier.
   * @param thinkingDuration - Optional thinking duration string (e.g. "19.7s").
   * @param content - Optional assistant response text content to capture.
   * @returns Promise that resolves when the section is appended.
   */
  async appendAgentBlock(
    sessionID: string,
    agentName: string,
    model: string,
    thinkingDuration?: string,
    content?: string,
  ): Promise<void> {
    const filePath = this.getSessionFilePath(sessionID)
    let section = `## main_l0_agent\n\n**name:** ${agentName}\n**model:** ${model}\n`
    if (thinkingDuration) {
      section += `**thinking_duration:** ${thinkingDuration}\n`
    }
    if (content) {
      section += `\n${content}\n`
    }
    section += "\n"
    await atomicAppendMarkdown(filePath, section)
  }

  /**
   * Appends a `### Tool:` subsection to the session `.md` file.
   *
   * @param sessionID - The session identifier.
   * @param toolName - The name of the tool invoked.
   * @param input - The tool's input arguments (will be JSON-stringified).
   * @param outputPruned - Optional pruned output to include.
   * @param error - Optional error message to include.
   * @returns Promise that resolves when the tool block is appended.
   */
  async appendToolBlock(
    sessionID: string,
    toolName: string,
    input: unknown,
    outputPruned?: string,
    error?: string,
  ): Promise<void> {
    const filePath = this.getSessionFilePath(sessionID)
    const inputJson = JSON.stringify(input, null, 2)
    let section = `### Tool: ${toolName}\n\n**Input:**\n\`\`\`json\n${inputJson}\n\`\`\`\n`

    if (outputPruned !== undefined) {
      section += `\n**Output:** (pruned)\n\`\`\`\n${outputPruned}\n\`\`\`\n`
    }
    if (error !== undefined) {
      section += `\n**Error:**\n\`\`\`\n${error}\n\`\`\`\n`
    }
    section += "\n"

    await atomicAppendMarkdown(filePath, section)
  }

  /**
   * Appends a compaction block to the session `.md` file (D-10).
   *
   * Captures the timestamp and references session-continuity.json for
   * post-compaction context recovery.
   *
   * @param sessionID - The session identifier.
   * @param block - The compaction block markdown content.
   * @returns Promise that resolves when the block is appended.
   */
  async appendCompactionBlock(sessionID: string, block: string): Promise<void> {
    const filePath = this.getSessionFilePath(sessionID)
    await atomicAppendMarkdown(filePath, block)
  }

  /**
   * Reads, merges, and atomically writes updated frontmatter.
   *
   * Parses existing YAML frontmatter via `gray-matter`, merges the provided
   * updates, and writes back atomically. Preserves body content.
   *
   * @param sessionID - The session identifier.
   * @param updates - Partial frontmatter fields to merge.
   * @returns Promise that resolves when the update is written.
   */
  async updateFrontmatter(
    sessionID: string,
    updates: Partial<SessionRecord>,
  ): Promise<void> {
    const filePath = this.getSessionFilePath(sessionID)
    const raw = await readFile(filePath, "utf-8")

    const parsed = matter(raw)
    const merged: Record<string, unknown> = { ...parsed.data, ...updates }

    const yamlStr = yamlStringify(merged)
    const content = `---\n${yamlStr}---\n${parsed.content.trim() ? parsed.content : ""}`

    // Direct atomic write — no re-read via atomicAppendMarkdown (DEFECT-06)
    const tmpPath = `${filePath}.tmp.${Date.now()}`
    await ensureDirectory(dirname(filePath))
    await writeFile(tmpPath, content, "utf-8")
    await rename(tmpPath, filePath)
  }

  /**
   * Appends a journey entry section to the session `.md` file.
   *
   * Journey entries record tool calls, results, and assistant messages
   * for audit and recovery purposes (CP-ST-05-02).
   *
   * @param sessionID - The session identifier.
   * @param entry - The journey entry to append.
   * @returns Promise that resolves when the entry is appended.
   */
  async appendJourneyEntry(
    sessionID: string,
    entry: JourneyEntry,
  ): Promise<void> {
    const filePath = this.getSessionFilePath(sessionID)
    const metadataStr = entry.metadata
      ? `\n**metadata:** ${JSON.stringify(entry.metadata)}`
      : ""
    const section =
      `## JOURNEY (${entry.timestamp})\n\n` +
      `**type:** ${entry.type}\n` +
      `**content:** ${entry.content}${metadataStr}\n\n`
    await atomicAppendMarkdown(filePath, section)
  }
}
