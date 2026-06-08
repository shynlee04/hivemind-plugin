import { readFileSync } from "node:fs"

import matter from "gray-matter"

import { resolveDocPath, assertWritableExtension, assertGovernanceWriteAllowed, checkChunkThreshold } from "./safety.js"
import { lockedTransform } from "./concurrency.js"

/**
 * Read document metadata (YAML frontmatter for Markdown, top-level keys for other formats).
 *
 * @param projectRoot - Trusted project root.
 * @param filePath - Project-root-relative file path.
 * @returns Frontmatter as key-value record, or null if absent.
 */
export function readDocumentMetadata(
  projectRoot: string,
  filePath: string,
): Record<string, unknown> | null {
  const absPath = resolveDocPath(projectRoot, filePath)
  const content = readFileSync(absPath, "utf-8")

  const ext = filePath.toLowerCase().split(".").pop() || ""

  if (ext === "md" || ext === "mdx") {
    const parsed = matter(content)
    const frontmatter = parsed.data as Record<string, unknown>
    return Object.keys(frontmatter).length > 0 ? frontmatter : null
  }

  // For JSON/YAML/XML, attempt to extract metadata
  if (ext === "json") {
    try {
      const data = JSON.parse(content) as Record<string, unknown>
      const meta: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(data)) {
        if (typeof value !== "object" || value === null) {
          meta[key] = value
        }
      }
      return Object.keys(meta).length > 0 ? meta : null
    } catch {
      return null
    }
  }

  return null
}

/**
 * Write metadata to a document, preserving existing fields not specified in the update.
 *
 * @param projectRoot - Trusted project root.
 * @param filePath - Project-root-relative file path.
 * @param metadata - Key-value pairs to set.
 * @returns Write result with hash and opId.
 */
export async function writeDocumentMetadata(
  projectRoot: string,
  filePath: string,
  metadata: Record<string, unknown>,
): Promise<{ hash: string; opId: string }> {
  const absPath = resolveDocPath(projectRoot, filePath)
  assertWritableExtension(absPath)
  assertGovernanceWriteAllowed(absPath, projectRoot)

  // Check chunk threshold
  const thresholdCheck = checkChunkThreshold(absPath)
  if (thresholdCheck) {
    throw new Error(`[Harness] File exceeds chunk threshold (${thresholdCheck.lineCount} lines)`)
  }

  const result = await lockedTransform(absPath, (content) => {
    if (filePath.endsWith(".md") || filePath.endsWith(".mdx")) {
      return updateMarkdownFrontmatter(content, metadata)
    }
    if (filePath.endsWith(".json")) {
      return updateJsonMetadata(content, metadata)
    }
    return content
  })

  return { hash: result.hash, opId: result.opId }
}

/**
 * Delete a metadata field from a document.
 *
 * @param projectRoot - Trusted project root.
 * @param filePath - Project-root-relative file path.
 * @param field - Field name to remove.
 * @returns Write result with hash and opId.
 */
export async function deleteDocumentMetadataField(
  projectRoot: string,
  filePath: string,
  field: string,
): Promise<{ hash: string; opId: string }> {
  const absPath = resolveDocPath(projectRoot, filePath)
  assertWritableExtension(absPath)
  assertGovernanceWriteAllowed(absPath, projectRoot)

  const result = await lockedTransform(absPath, (content) => {
    if (filePath.endsWith(".md") || filePath.endsWith(".mdx")) {
      const parsed = matter(content)
      const frontmatter = parsed.data as Record<string, unknown>
      delete frontmatter[field]

      // Rebuild with updated frontmatter
      const updatedMatter = (matter as unknown as { stringify: (content: string, data: Record<string, unknown>, opts?: Record<string, unknown>) => string }).stringify(parsed.content, frontmatter)
      return updatedMatter
    }
    if (filePath.endsWith(".json")) {
      try {
        const data = JSON.parse(content) as Record<string, unknown>
        delete data[field]
        return JSON.stringify(data, null, 2) + "\n"
      } catch {
        return content
      }
    }
    return content
  })

  return { hash: result.hash, opId: result.opId }
}

/**
 * Update Markdown frontmatter, preserving existing fields.
 */
function updateMarkdownFrontmatter(content: string, metadata: Record<string, unknown>): string {
  const parsed = matter(content)
  const frontmatter = parsed.data as Record<string, unknown>

  for (const [key, value] of Object.entries(metadata)) {
    frontmatter[key] = value
  }

  // Use type assertion for gray-matter options compatibility
  return (matter as unknown as { stringify: (content: string, data: Record<string, unknown>, opts?: Record<string, unknown>) => string }).stringify(parsed.content, frontmatter)
}

/**
 * Update JSON metadata, preserving existing keys.
 */
function updateJsonMetadata(content: string, metadata: Record<string, unknown>): string {
  try {
    const data = JSON.parse(content) as Record<string, unknown>
    for (const [key, value] of Object.entries(metadata)) {
      data[key] = value
    }
    return JSON.stringify(data, null, 2) + "\n"
  } catch {
    return content
  }
}
