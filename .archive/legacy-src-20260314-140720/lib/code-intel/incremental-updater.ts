import { readFile, stat } from "node:fs/promises"
import { createHash } from "node:crypto"
import { join } from "node:path"

import { countTokens } from "./token-counter.js"
import { hasSecrets, getSecretTypes } from "./secret-detector.js"
import { detectLanguage } from "./file-scanner.js"
import { compressSingleFile, computeCompressionRatio, type CompressedCodemap } from "./compressed-codemap.js"
import type { CodeMap, CodeMapEntry } from "./codemap-io.js"
import type { TreeSitterInstance } from "./tree-sitter-loader.js"

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
  private treeSitter: TreeSitterInstance | null

  constructor(projectRoot: string, treeSitter: TreeSitterInstance | null = null) {
    this.projectRoot = projectRoot
    this.treeSitter = treeSitter
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
  async updateFile(
    codemap: CodeMap,
    filePath: string,
    compressedCodemap?: CompressedCodemap | null,
  ): Promise<UpdateResult> {
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

    // Phase 7 AST State Sync — patch CompressedCodemap synchronously
    let signatureDelta = 0
    if (compressedCodemap && newEntry) {
      const compIndex = compressedCodemap.files.findIndex((f) => f.path === filePath)
      const oldCompEntry = compIndex >= 0 ? compressedCodemap.files[compIndex] : null

      const newCompEntry = await compressSingleFile(
        filePath,
        this.projectRoot,
        newEntry.language,
        this.treeSitter,
      )

      if (newCompEntry) {
        signatureDelta = newCompEntry.signatures.length - (oldCompEntry?.signatures.length || 0)
        if (compIndex >= 0) {
          compressedCodemap.files[compIndex] = newCompEntry
        } else {
          compressedCodemap.files.push(newCompEntry)
        }
      }

      // Recompute compressed stats
      compressedCodemap.totalTokens = compressedCodemap.files.reduce((sum, f) => sum + f.tokenCount, 0)
      compressedCodemap.originalTotalTokens = compressedCodemap.files.reduce((sum, f) => sum + f.originalTokenCount, 0)
      if (compressedCodemap.originalTotalTokens > 0) {
        compressedCodemap.compressionRatio = computeCompressionRatio(
          compressedCodemap.originalTotalTokens,
          compressedCodemap.totalTokens,
        )
      }
    }

    const result: UpdateResult = {
      filePath,
      changeType,
      tokenDelta,
      signatureDelta,
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
  async removeFile(
    codemap: CodeMap,
    filePath: string,
    compressedCodemap?: CompressedCodemap | null,
  ): Promise<UpdateResult> {
    const existingIndex = codemap.files.findIndex((f) => f.filePath === filePath)
    let tokenDelta = 0
    let signatureDelta = 0

    if (existingIndex >= 0) {
      tokenDelta = -codemap.files[existingIndex].tokenCount
      codemap.files.splice(existingIndex, 1)
      codemap.totalFiles = codemap.files.length
      codemap.totalTokens = codemap.files.reduce((sum, f) => sum + f.tokenCount, 0)
      codemap.totalSize = codemap.files.reduce((sum, f) => sum + f.size, 0)
    }

    // Phase 7 — remove from CompressedCodemap too
    if (compressedCodemap) {
      const compIndex = compressedCodemap.files.findIndex((f) => f.path === filePath)
      if (compIndex >= 0) {
        signatureDelta = -compressedCodemap.files[compIndex].signatures.length
        compressedCodemap.files.splice(compIndex, 1)
        compressedCodemap.totalTokens = compressedCodemap.files.reduce((sum, f) => sum + f.tokenCount, 0)
        compressedCodemap.originalTotalTokens = compressedCodemap.files.reduce((sum, f) => sum + f.originalTokenCount, 0)
        if (compressedCodemap.originalTotalTokens > 0) {
          compressedCodemap.compressionRatio = computeCompressionRatio(
            compressedCodemap.originalTotalTokens,
            compressedCodemap.totalTokens,
          )
        }
      }
    }

    const result: UpdateResult = {
      filePath,
      changeType: "deleted",
      tokenDelta,
      signatureDelta,
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
