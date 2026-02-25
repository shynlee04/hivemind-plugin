/**
 * Pattern-First Search — Phase 3, §6.3
 *
 * Find code patterns (functions, types, exports, imports) in
 * a CompressedCodemap without reading full source files.
 *
 * All searches operate on pre-extracted signatures, achieving
 * <10ms latency for typical codebases.
 */

import type { CompressedCodemap, CompressedFileInfo, Signature } from "./compressed-codemap.js"

// ─── Types ──────────────────────────────────────────────────────────────

export interface PatternQuery {
  /** Function name to find (exact or substring) */
  functionName?: string
  /** Class, interface, or type alias name */
  typeName?: string
  /** Exported symbol name */
  exportName?: string
  /** Import source module path */
  importSource?: string
  /** Regex pattern to match against signature text */
  signaturePattern?: RegExp
}

export interface PatternMatch {
  /** File where the match was found */
  filePath: string
  /** The matching signature */
  signature: Signature
  /** Relevance score 0-1 (1 = exact match) */
  relevance: number
}

// ─── Matching Engine ────────────────────────────────────────────────────

/**
 * Score how well a signature matches a query.
 * Returns 0 for no match, up to 1.0 for exact match.
 */
function matchSignatureToQuery(sig: Signature, query: PatternQuery): number {
  let score = 0
  let checks = 0

  if (query.functionName) {
    checks++
    if (sig.type === "function" && sig.name === query.functionName) {
      score += 1
    } else if (sig.type === "function" && sig.name.toLowerCase().includes(query.functionName.toLowerCase())) {
      score += 0.5
    }
  }

  if (query.typeName) {
    checks++
    const isTypeish = sig.type === "class" || sig.type === "interface" || sig.type === "type"
    if (isTypeish && sig.name === query.typeName) {
      score += 1
    } else if (isTypeish && sig.name.toLowerCase().includes(query.typeName.toLowerCase())) {
      score += 0.5
    }
  }

  if (query.exportName) {
    checks++
    if (sig.exported && sig.name === query.exportName) {
      score += 1
    } else if (sig.exported && sig.name.toLowerCase().includes(query.exportName.toLowerCase())) {
      score += 0.5
    }
  }

  if (query.signaturePattern) {
    checks++
    if (query.signaturePattern.test(sig.signature)) {
      score += 1
    }
  }

  if (checks === 0) return 0
  return score / checks
}

/**
 * Check if a file's imports match an importSource query.
 */
function matchImportSource(file: CompressedFileInfo, importSource: string): boolean {
  return file.imports.some((imp) => imp.includes(importSource))
}

// ─── Core Search ────────────────────────────────────────────────────────

/**
 * Search for code patterns in a CompressedCodemap.
 *
 * Supports searching by:
 * - Function name (exact or substring)
 * - Type/class/interface name
 * - Export name
 * - Import source module
 * - Regex pattern on signature text
 *
 * Returns matches sorted by relevance (highest first).
 *
 * @param codemap - The compressed codemap to search
 * @param query - Search criteria (at least one field required)
 * @returns Sorted array of PatternMatch results
 */
export function searchPatterns(
  codemap: CompressedCodemap,
  query: PatternQuery,
): PatternMatch[] {
  // Validate query has at least one criterion
  const hasQuery =
    query.functionName ||
    query.typeName ||
    query.exportName ||
    query.importSource ||
    query.signaturePattern
  if (!hasQuery) return []

  const matches: PatternMatch[] = []

  for (const file of codemap.files) {
    // Import-source filter: only return signatures from files matching the import
    if (query.importSource) {
      if (matchImportSource(file, query.importSource)) {
        for (const sig of file.signatures) {
          // Also check other criteria if provided
          const otherQuery: PatternQuery = { ...query, importSource: undefined }
          const hasOther = otherQuery.functionName || otherQuery.typeName || otherQuery.exportName || otherQuery.signaturePattern
          if (hasOther) {
            const relevance = matchSignatureToQuery(sig, otherQuery)
            if (relevance > 0) {
              matches.push({ filePath: file.path, signature: sig, relevance: Math.min(1, relevance + 0.2) })
            }
          } else {
            // Import-only query: return all sigs from matching file
            matches.push({ filePath: file.path, signature: sig, relevance: 0.7 })
          }
        }
      }
      continue
    }

    // Signature-based matching
    for (const sig of file.signatures) {
      const relevance = matchSignatureToQuery(sig, query)
      if (relevance > 0) {
        matches.push({ filePath: file.path, signature: sig, relevance })
      }
    }
  }

  // Sort by relevance descending, then by file path for stability
  matches.sort((a, b) => {
    if (b.relevance !== a.relevance) return b.relevance - a.relevance
    return a.filePath.localeCompare(b.filePath)
  })

  return matches
}

// ─── Convenience Functions ──────────────────────────────────────────────

/** Find functions by name (exact or substring match) */
export function findFunction(codemap: CompressedCodemap, name: string): PatternMatch[] {
  return searchPatterns(codemap, { functionName: name })
}

/** Find classes, interfaces, or type aliases by name */
export function findType(codemap: CompressedCodemap, name: string): PatternMatch[] {
  return searchPatterns(codemap, { typeName: name })
}

/** Find exported symbols by name */
export function findExport(codemap: CompressedCodemap, name: string): PatternMatch[] {
  return searchPatterns(codemap, { exportName: name })
}

/** Find signatures matching a regex pattern */
export function findByPattern(codemap: CompressedCodemap, pattern: RegExp): PatternMatch[] {
  return searchPatterns(codemap, { signaturePattern: pattern })
}

/** Find files that import from a specific module */
export function findImporters(codemap: CompressedCodemap, source: string): PatternMatch[] {
  return searchPatterns(codemap, { importSource: source })
}
