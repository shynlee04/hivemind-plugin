import { readFileSync, readdirSync, statSync } from "node:fs"

import { resolveDocPath, toRootRelativePath, DOCUMENT_EXTENSIONS, hasAllowedExtension } from "./safety.js"
import { chunkMarkdownDocument } from "./chunker.js"
import type { ContextSection } from "./types.js"

/**
 * Extract relevance-scored context sections from documents under a directory.
 *
 * @param projectRoot - Trusted project root.
 * @param dirPath - Project-root-relative directory path.
 * @param query - Natural language query for relevance scoring.
 * @param tokenBudget - Maximum total token estimate across returned sections.
 * @returns Context sections sorted by descending relevance, within token budget.
 */
export function extractContext(
  projectRoot: string,
  dirPath: string,
  query: string,
  tokenBudget?: number,
): ContextSection[] {
  const absPath = resolveDocPath(projectRoot, dirPath)
  const budget = tokenBudget ?? 4000
  const queryTerms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2)
  const allSections: ContextSection[] = []

  const files = collectDocumentFiles(absPath)

  for (const filePath of files) {
    try {
      const content = readFileSync(filePath, "utf-8")
      const relPath = toRootRelativePath(projectRoot, filePath)
      const chunks = chunkMarkdownDocument(relPath, content)

      for (const chunk of chunks) {
        const relevanceScore = scoreRelevance(chunk.content, queryTerms)
        if (relevanceScore > 0) {
          allSections.push({
            path: relPath,
            heading: chunk.heading,
            content: chunk.content,
            relevanceScore,
            tokenEstimate: chunk.estimatedTokens,
          })
        }
      }
    } catch {
      // Skip unreadable files
      continue
    }
  }

  // Sort descending by relevance score
  allSections.sort((a, b) => b.relevanceScore - a.relevanceScore)

  // Select sections within token budget
  const result: ContextSection[] = []
  let totalTokens = 0

  for (const section of allSections) {
    if (budget > 0 && totalTokens + section.tokenEstimate > budget) {
      continue
    }
    result.push(section)
    totalTokens += section.tokenEstimate
  }

  return result
}

/**
 * Score a section's relevance to query terms using simple TF-style frequency count.
 *
 * @param content - Section content.
 * @param queryTerms - Tokenized query terms (lowercase, >2 chars).
 * @returns Relevance score (sum of term frequencies).
 */
function scoreRelevance(content: string, queryTerms: string[]): number {
  const lowerContent = content.toLowerCase()
  let score = 0

  for (const term of queryTerms) {
    // Count occurrences
    let pos = 0
    let count = 0
    while ((pos = lowerContent.indexOf(term, pos)) !== -1) {
      count++
      pos += term.length
    }
    score += count
  }

  return score
}

/**
 * Collect all document files recursively from a path.
 */
function collectDocumentFiles(startPath: string): string[] {
  const files: string[] = []

  const s = statSync(startPath)
  if (s.isFile()) {
    if (hasAllowedExtension(startPath, DOCUMENT_EXTENSIONS)) {
      files.push(startPath)
    }
    return files
  }

  function walk(dir: string): void {
    const entries = readdirSync(dir, { withFileTypes: true })
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const fullPath = `${dir}/${entry.name}`
      if (entry.isDirectory()) {
        walk(fullPath)
      } else if (hasAllowedExtension(fullPath, DOCUMENT_EXTENSIONS)) {
        files.push(fullPath)
      }
    }
  }

  walk(startPath)
  return files
}
