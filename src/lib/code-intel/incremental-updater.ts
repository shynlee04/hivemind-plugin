import { readFile, stat } from "node:fs/promises"
import { createHash } from "node:crypto"
import { join } from "node:path"

import { countTokens } from "./token-counter.js"
import { hasSecrets, getSecretTypes } from "./secret-detector.js"
import { detectLanguage } from "./file-scanner.js"
import type { CodeMap, CodeMapEntry } from "./codemap-io.js"

// ─── Types ──────────────────────────────────────────────────────────────

export interface UpdateResult {
  filePath: string
  changeType: "created" | "modified" | "deleted"
  tokenDelta: number
  signatureDelta: number
  timestamp: string
}

export type UpdateListener = (result: UpdateResult) => void

// ─── Incremental Updater ────────────────────────────────────────────────

export class IncrementalUpdater {
  private projectRoot: string
  private listeners: UpdateListener[] = []

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot
  }

  /** Build a new CodeMapEntry for a single file */
  async buildEntry(relativePath: string): Promise<CodeMapEntry | null> {
    const absolutePath = join(this.projectRoot, relativePath)

    let content: string
    try {
      content = await readFile(absolutePath, "utf-8")
    } catch {
      return null
    }

    let fileStat: { size: number, mtime: Date }
    try {
      fileStat = await stat(absolutePath)
    } catch {
      return null
    }

    const hash = createHash("sha256").update(content).digest("hex")
    const lineCount = content.length === 0 ? 0 : content.split("\n").length
    const tokenCount = countTokens(content)
    const fileHasSecrets = hasSecrets(content)
    const fileSecretTypes = fileHasSecrets ? getSecretTypes(content) : []

    return {
      filePath: relativePath,
      language: detectLanguage(relativePath),
      hash,
      size: fileStat.size,
      lineCount,
      tokenCount,
      hasSecrets: fileHasSecrets,
      secretTypes: fileSecretTypes,
      lastModified: fileStat.mtime.toISOString(),
    }
  }

  /** Update a single file in the codemap — returns delta */
  async updateFile(codemap: CodeMap, filePath: string): Promise<UpdateResult> {
    const existingIndex = codemap.files.findIndex((f) => f.filePath === filePath)
    const oldEntry = existingIndex >= 0 ? codemap.files[existingIndex] : null
    const newEntry = await this.buildEntry(filePath)

    let changeType: UpdateResult["changeType"]
    let tokenDelta = 0

    if (!newEntry) {
      // File deleted or unreadable
      if (oldEntry) {
        codemap.files.splice(existingIndex, 1)
        tokenDelta = -oldEntry.tokenCount
      }
      changeType = "deleted"
    } else if (!oldEntry) {
      // New file
      codemap.files.push(newEntry)
      tokenDelta = newEntry.tokenCount
      changeType = "created"
    } else {
      // Modified — check hash
      if (oldEntry.hash === newEntry.hash) {
        // No actual change
        return {
          filePath,
          changeType: "modified",
          tokenDelta: 0,
          signatureDelta: 0,
          timestamp: new Date().toISOString(),
        }
      }
      tokenDelta = newEntry.tokenCount - oldEntry.tokenCount
      codemap.files[existingIndex] = newEntry
      changeType = "modified"
    }

    // Recompute stats
    codemap.totalFiles = codemap.files.length
    codemap.totalTokens = codemap.files.reduce((sum, f) => sum + f.tokenCount, 0)
    codemap.totalSize = codemap.files.reduce((sum, f) => sum + f.size, 0)

    const result: UpdateResult = {
      filePath,
      changeType,
      tokenDelta,
      signatureDelta: 0, // Phase 2 will populate when signatures are extracted
      timestamp: new Date().toISOString(),
    }

    // Notify listeners
    for (const listener of this.listeners) {
      try {
        listener(result)
      } catch {
        // Listener errors should not break the updater
      }
    }

    return result
  }

  /** Remove a file from the codemap */
  async removeFile(codemap: CodeMap, filePath: string): Promise<UpdateResult> {
    const existingIndex = codemap.files.findIndex((f) => f.filePath === filePath)
    let tokenDelta = 0

    if (existingIndex >= 0) {
      tokenDelta = -codemap.files[existingIndex].tokenCount
      codemap.files.splice(existingIndex, 1)
      codemap.totalFiles = codemap.files.length
      codemap.totalTokens = codemap.files.reduce((sum, f) => sum + f.tokenCount, 0)
      codemap.totalSize = codemap.files.reduce((sum, f) => sum + f.size, 0)
    }

    const result: UpdateResult = {
      filePath,
      changeType: "deleted",
      tokenDelta,
      signatureDelta: 0,
      timestamp: new Date().toISOString(),
    }

    for (const listener of this.listeners) {
      try {
        listener(result)
      } catch {
        // swallow
      }
    }

    return result
  }

  /** Get files whose hash differs from current disk state */
  async getStaleFiles(codemap: CodeMap): Promise<string[]> {
    const stale: string[] = []

    for (const entry of codemap.files) {
      const absolutePath = join(this.projectRoot, entry.filePath)
      try {
        const content = await readFile(absolutePath, "utf-8")
        const currentHash = createHash("sha256").update(content).digest("hex")
        if (currentHash !== entry.hash) {
          stale.push(entry.filePath)
        }
      } catch {
        // File deleted or unreadable = stale
        stale.push(entry.filePath)
      }
    }

    return stale
  }

  /** Subscribe to update events */
  onUpdate(callback: UpdateListener): () => void {
    this.listeners.push(callback)
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index >= 0) {
        this.listeners.splice(index, 1)
      }
    }
  }
}
