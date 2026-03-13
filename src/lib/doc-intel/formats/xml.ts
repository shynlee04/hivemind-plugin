import type { FormatWeaver, HeadingHierarchy, DocumentChunk } from "../types.js"

/**
 * XML FormatWeaver implementation (stub).
 * Full implementation pending - XML requires different section semantics than markdown.
 */
export const xmlWeaver: FormatWeaver = {
  format: 'xml',
  extensions: ['.xml'],

  readOutline: (_content: string): HeadingHierarchy[] => [],

  readSection: (_content: string, _id: string): string | null => {
    return null
  },

  upsertSection: (_content: string, _id: string, _newContent: string, _level?: number): string => {
    throw new Error('Not implemented for XML format yet')
  },

  writeSection: (_content: string, _id: string, _newContent: string): string => {
    throw new Error('Not implemented for XML format yet')
  },

  appendSection: (_content: string, _id: string, _newContent: string): string => {
    throw new Error('Not implemented for XML format yet')
  },

  insertSection: (_content: string, _afterId: string, _newId: string, _level: number, _body: string): string => {
    throw new Error('Not implemented for XML format yet')
  },

  deleteSection: (_content: string, _id: string): string => {
    throw new Error('Not implemented for XML format yet')
  },

  readMetadata: (_content: string): Record<string, unknown> | null => {
    return null
  },

  writeMetadata: (_content: string, _metadata: Record<string, unknown>): string => {
    throw new Error('Not implemented for XML format yet')
  },

  chunkBySections: (_content: string, _maxTokens: number): DocumentChunk[] => [],

  isWellFormed: (content: string): boolean => {
    try {
      const trimmed = content.trim()
      return trimmed.startsWith('<') && trimmed.endsWith('>')
    } catch {
      return false
    }
  },
}