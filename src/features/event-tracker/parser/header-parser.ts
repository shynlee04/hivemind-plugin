/**
 * Session header parser — extracts title, sessionId, created, updated
 * from raw session markdown.
 *
 * @module event-tracker/parser/header-parser
 */

import type { ParsedHeader } from './types.js'
import { createEmptyHeader } from './types.js'

export function parseSessionHeader(markdown: string): ParsedHeader {
  const header = createEmptyHeader()

  if (!markdown) return header

  // Title: first `# ` heading line
  const titleMatch = markdown.match(/^#\s+(.+)$/m)
  if (titleMatch) {
    header.title = titleMatch[1].trim()
  }

  // Session ID — matches `**Session ID:** value` on a single line.
  // Field values must not contain newlines; inline markdown chars (*, .) are safe.
  const sessionMatch = markdown.match(/\*\*Session ID:\*\*\s*(.+)/)
  if (sessionMatch) {
    header.sessionId = sessionMatch[1].trim()
  }

  // Created
  const createdMatch = markdown.match(/\*\*Created:\*\*\s*(.+)/)
  if (createdMatch) {
    header.created = createdMatch[1].trim()
  }

  // Updated
  const updatedMatch = markdown.match(/\*\*Updated:\*\*\s*(.+)/)
  if (updatedMatch) {
    header.updated = updatedMatch[1].trim()
  }

  return header
}
