/**
 * Calculate the Levenshtein similarity ratio between two strings (0-1).
 * 1 means identical, 0 means completely different.
 * Formula: 1 - (levenshteinDistance / maxLength)
 */
export function calculateSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  const m = a.length;
  const n = b.length;
  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= m; i++) matrix[i] = [i];
  for (let j = 0; j <= n; j++) matrix[0][j] = j;

  // Compute Levenshtein distance
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  const distance = matrix[m][n];
  const maxLength = Math.max(m, n);

  return 1 - (distance / maxLength);
}

// Deprecated alias for backward compatibility until refactor complete
export const levenshteinSimilarity = calculateSimilarity;
