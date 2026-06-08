import { resolveDocPath, toRootRelativePath, assertWritableExtension, assertGovernanceWriteAllowed, checkChunkThreshold, assertFileSizeWithinLimit } from "./safety.js"
import { lockedTransform } from "./concurrency.js"
import { patchSectionBody, findSectionRange } from "./write-ops.js"
import type { BatchOpResult, ChunkRequiredSignal, SectionEditOp } from "./types.js"

function isChunkSignal(result: { results: BatchOpResult[]; hash: string } | ChunkRequiredSignal): result is ChunkRequiredSignal {
  return "status" in result && result.status === "chunk_required"
}

/**
 * Batch section edits on a single file — all operations applied atomically.
 *
 * @param projectRoot - Trusted project root.
 * @param filePath - Project-root-relative file path.
 * @param ops - Array of section edit operations.
 * @returns Batch results with per-op change info and final file hash.
 */
export async function batchSectionEdits(
  projectRoot: string,
  filePath: string,
  ops: SectionEditOp[],
): Promise<{ results: BatchOpResult[]; hash: string } | ChunkRequiredSignal> {
  const absPath = resolveDocPath(projectRoot, filePath)
  assertWritableExtension(absPath)
  assertGovernanceWriteAllowed(absPath, projectRoot)

  const thresholdCheck = checkChunkThreshold(absPath)
  if (thresholdCheck) return thresholdCheck

  assertFileSizeWithinLimit(absPath)

  const results = await lockedTransform(absPath, (content) => {
    let currentContent = content

    for (const op of ops) {
      switch (op.op) {
        case "write": {
          currentContent = patchSectionBody(currentContent, op.heading, op.body)
          break
        }
        case "append": {
          const sectionRange = findSectionRange(currentContent, op.heading)
          if (sectionRange) {
            const lines = currentContent.split(/\r?\n/)
            const appendLine = lines[sectionRange.endLine] !== undefined ? sectionRange.endLine : lines.length
            lines.splice(appendLine, 0, "", op.content)
            currentContent = lines.join("\n")
          }
          break
        }
        case "delete": {
          const sectionRange = findSectionRange(currentContent, op.heading)
          if (sectionRange) {
            const lines = currentContent.split(/\r?\n/)
            lines.splice(sectionRange.startLine - 1, sectionRange.endLine - sectionRange.startLine + 1)
            currentContent = lines.join("\n")
          }
          break
        }
      }
    }

    return currentContent
  })

  const batchResults: BatchOpResult[] = ops.map((op) => ({
    opId: results.opId,
    hash: results.hash,
    path: toRootRelativePath(projectRoot, absPath),
    heading: "op" in op && "heading" in op ? (op as { heading: string }).heading : "",
    changed: results.changed,
    bytesChanged: results.bytesChanged,
  }))

  return { results: batchResults, hash: results.hash }
}

/**
 * Batch multi-file edits — per-file lockedTransform with Promise.all.
 * Best-effort: one file failure does not block others.
 *
 * @param projectRoot - Trusted project root.
 * @param fileOps - Array of file operations.
 * @returns Per-file results with optional errors.
 */
export async function batchMultiFileEdits(
  projectRoot: string,
  fileOps: Array<{ path: string; ops: SectionEditOp[] }>,
): Promise<{ results: Array<{ path: string; ops: BatchOpResult[]; error?: string }> }> {
  const results = await Promise.all(
    fileOps.map(async (fileOp) => {
      try {
        const batchResult = await batchSectionEdits(projectRoot, fileOp.path, fileOp.ops)
        if (isChunkSignal(batchResult)) {
          return { path: fileOp.path, ops: [], error: `Chunk required: ${batchResult.lineCount} lines` }
        }
        return { path: fileOp.path, ops: batchResult.results }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return { path: fileOp.path, ops: [], error: message }
      }
    }),
  )

  return { results }
}
