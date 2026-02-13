/**
 * Simple Levenshtein-based similarity ratio (0-1).
 * Used internally for section repetition detection.
 */
export function levenshteinSimilarity(a: string, b: string): number {
  if (a.length === 0 && b.length === 0) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  const maxLen = Math.max(a.length, b.length);

  // Optimization: if strings are very different in length, skip computation
  if (Math.abs(a.length - b.length) / maxLen > 0.5) return 0;

  // Simplified: use character overlap ratio instead of full Levenshtein
  // This is faster and sufficient for detecting "same content with minor edits"
  const aChars = new Set(a.split(""));
  const bChars = new Set(b.split(""));
  let overlap = 0;
  for (const c of aChars) {
    if (bChars.has(c)) overlap++;
  }
  const totalUnique = new Set([...aChars, ...bChars]).size;
  return totalUnique === 0 ? 1 : overlap / totalUnique;
}
