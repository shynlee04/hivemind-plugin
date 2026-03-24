/**
 * Turn splitter — divides raw session markdown at `## User` boundaries.
 *
 * @module event-tracker/parser/splitter
 */

export function splitTurns(markdown: string): string[] {
  if (!markdown) return []

  // Split at each `## User` boundary, keeping the delimiter
  const parts = markdown.split(/^(?=## User)/m)

  // Only keep parts that start with `## User`
  const turns = parts.filter((p) => p.trimStart().startsWith('## User'))

  return turns
}
