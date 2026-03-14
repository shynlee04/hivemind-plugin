/**
 * Selective Source Injector — Phase 3, §6.2
 *
 * Selects source code (signatures or full) from CompressedCodemap
 * based on file_locks in active tasks, within a token budget.
 *
 * Consumed by cognitive-packer.ts to build <source_code> XML section.
 */

import type { CompressedCodemap, CompressedFileInfo, Signature } from "./compressed-codemap.js"

// ─── Types ──────────────────────────────────────────────────────────────

export interface SelectedFile {
  /** Relative file path */
  path: string
  /** How the source was injected */
  injectionType: "signature" | "full" | "range"
  /** Token cost of this injection */
  tokens: number
  /** Rendered text content (signatures or full-source marker) */
  content: string
  /** Line range for "range" injection type */
  lineRange?: { start: number; end: number }
}

export interface SourceSelection {
  /** Files selected for injection */
  files: SelectedFile[]
  /** Total tokens consumed */
  totalTokens: number
  /** Remaining budget after selection */
  budgetRemaining: number
}

// ─── Constants ──────────────────────────────────────────────────────────

/** Files below this token count are injected in full */
const SMALL_FILE_THRESHOLD = 500

/** Minimum per-file budget allocation */
const MIN_PER_FILE_BUDGET = 200

// ─── Helpers ────────────────────────────────────────────────────────────

/** Render signatures as human-readable text */
function renderSignatures(signatures: Signature[]): string {
  return signatures
    .map((sig) => {
      const parts: string[] = []
      if (sig.docstring) parts.push(`/** ${sig.docstring} */`)
      parts.push(sig.signature)
      return parts.join("\n")
    })
    .join("\n\n")
}

/** Score file relevance — exported symbols weigh more */
function scoreFileRelevance(file: CompressedFileInfo): number {
  const exportedSigs = file.signatures.filter((s) => s.exported).length
  const totalSigs = file.signatures.length
  return exportedSigs * 2 + totalSigs
}
/** Minimal XML escaping */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

// ─── Core ───────────────────────────────────────────────────────────────

/**
 * Select source code for context injection based on file locks and budget.
 *
 * Algorithm (from architecture spec §6.2):
 * 1. Start with files in task.file_locks
 * 2. For each file:
 *    - If file is small (<500 tokens) → inject full source marker
 *    - If compressed token count < per-file budget → inject signatures
 *    - Otherwise → inject top exported signatures within budget
 * 3. Sort by relevance (files with most exports/signatures first)
 * 4. Stop when budget exhausted
 */
export function selectSourceForInjection(
  codemap: CompressedCodemap,
  fileLocks: string[],
  budget: number,
): SourceSelection {
  if (fileLocks.length === 0 || budget <= 0) {
    return { files: [], totalTokens: 0, budgetRemaining: budget }
  }

  // Build lookup and filter to locked files present in codemap
  const lockedFileSet = new Set(fileLocks)
  const lockedFiles = codemap.files.filter((f) => lockedFileSet.has(f.path))

  // Sort by relevance — most signatures/exports first
  lockedFiles.sort((a, b) => scoreFileRelevance(b) - scoreFileRelevance(a))

  // Compute per-file budget (fair share, with minimum)
  const perFileBudget = lockedFiles.length > 0
    ? Math.max(MIN_PER_FILE_BUDGET, Math.floor(budget / lockedFiles.length))
    : budget

  const result: SelectedFile[] = []
  let totalTokens = 0

  for (const file of lockedFiles) {
    const remaining = budget - totalTokens
    if (remaining <= 0) break

    const effectiveBudget = Math.min(perFileBudget, remaining)
    const selected = selectFileContent(file, effectiveBudget)

    if (selected) {
      result.push(selected)
      totalTokens += selected.tokens
    }
  }

  return {
    files: result,
    totalTokens,
    budgetRemaining: budget - totalTokens,
  }
}

/**
 * Select content for a single file within the given budget.
 * Returns null if nothing fits.
 */
function selectFileContent(file: CompressedFileInfo, budget: number): SelectedFile | null {
  // Case 1: Small file → full source marker
  if (file.originalTokenCount <= SMALL_FILE_THRESHOLD && file.originalTokenCount <= budget) {
    return {
      path: file.path,
      injectionType: "full",
      tokens: file.originalTokenCount,
      content: renderSignatures(file.signatures),
    }
  }

  // Case 2: All signatures fit → inject signatures
  if (file.tokenCount <= budget) {
    const content = renderSignatures(file.signatures)
    return {
      path: file.path,
      injectionType: "signature",
      tokens: file.tokenCount,
      content,
    }
  }

  // Case 3: Signatures exceed budget → inject top signatures by priority
  const sorted = [...file.signatures].sort((a, b) => {
    // Exported first, then by position
    if (a.exported !== b.exported) return a.exported ? -1 : 1
    return a.lineStart - b.lineStart
  })

  // Use proportional token cost per signature (based on file's actual tokenCount)
  // This is more accurate than estimating from rendered text length
  const perSigTokens = file.signatures.length > 0
    ? Math.ceil(file.tokenCount / file.signatures.length)
    : file.tokenCount

  const partial: Signature[] = []
  let partialTokens = 0

  for (const sig of sorted) {
    if (partialTokens + perSigTokens > budget) break
    partial.push(sig)
    partialTokens += perSigTokens
  }

  if (partial.length === 0) return null

  const first = partial[0]
  const last = partial[partial.length - 1]

  return {
    path: file.path,
    injectionType: "range",
    tokens: partialTokens,
    content: renderSignatures(partial),
    lineRange: { start: first.lineStart, end: last.lineEnd },
  }
}

// ─── XML Rendering ──────────────────────────────────────────────────────

/**
 * Render a SourceSelection as XML for the cognitive packer's
 * <source_code> section.
 *
 * Returns empty string if no files selected.
 */
export function renderSourceSelectionXml(selection: SourceSelection, budget: number): string {
  if (selection.files.length === 0) return ""

  const lines: string[] = []
  lines.push(`  <source_code budget_used="${selection.totalTokens}" budget_total="${budget}">`)

  for (const file of selection.files) {
    lines.push(`    <locked_file path="${escapeXml(file.path)}" tokens="${file.tokens}" type="${file.injectionType}">`)

    if (file.injectionType === "full") {
      lines.push("      <full_source />")
    } else {
      // Render each signature line
      const sigLines = file.content.split("\n").filter((l) => l.trim().length > 0)
      for (const sigLine of sigLines) {
        lines.push(`      ${escapeXml(sigLine)}`)
      }
    }

    if (file.lineRange) {
      lines.push(`      <line_range start="${file.lineRange.start}" end="${file.lineRange.end}" />`)
    }

    lines.push("    </locked_file>")
  }

  lines.push("  </source_code>")
  return lines.join("\n")
}
