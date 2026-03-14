import { createHash } from "node:crypto"

export interface ContextFragment {
  id?: string
  source?: string
  content: string
  temporary?: boolean
  created_at?: number
}

export interface ContextPurificationResult {
  consolidated: string[]
  retained_fingerprints: string[]
  deduped_count: number
  purged_temporary_count: number
}

function normalizeContent(content: string): string {
  return content
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
}

export function fingerprintContext(content: string): string {
  return createHash("sha256").update(normalizeContent(content)).digest("hex")
}

export function dedupeContextLines(lines: string[]): { lines: string[]; deduped_count: number } {
  const seen = new Set<string>()
  const deduped: string[] = []
  let removed = 0

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue
    const hash = fingerprintContext(line)
    if (seen.has(hash)) {
      removed += 1
      continue
    }
    seen.add(hash)
    deduped.push(raw)
  }

  return { lines: deduped, deduped_count: removed }
}

export function purifyContextFragments(
  fragments: ContextFragment[],
  existingFingerprints: Set<string> = new Set()
): ContextPurificationResult {
  const retained: string[] = []
  const retainedFingerprints: string[] = []
  let dedupedCount = 0
  let purgedTemporaryCount = 0

  for (const fragment of fragments) {
    const content = fragment.content?.trim()
    if (!content) continue

    const hash = fingerprintContext(content)
    if (existingFingerprints.has(hash)) {
      dedupedCount += 1
      if (fragment.temporary) {
        purgedTemporaryCount += 1
      }
      continue
    }

    existingFingerprints.add(hash)
    retainedFingerprints.push(hash)
    retained.push(content)
    if (fragment.temporary) {
      purgedTemporaryCount += 1
    }
  }

  return {
    consolidated: retained,
    retained_fingerprints: retainedFingerprints,
    deduped_count: dedupedCount,
    purged_temporary_count: purgedTemporaryCount,
  }
}

export function consolidateTemporaryPayloads(
  fragments: ContextFragment[],
  maxItems = 6
): string[] {
  if (fragments.length === 0) return []

  return fragments
    .filter((fragment) => fragment.temporary)
    .slice(-maxItems)
    .map((fragment, index) => {
      const source = fragment.source ? `[${fragment.source}] ` : ""
      return `${index + 1}. ${source}${fragment.content.trim()}`
    })
}
