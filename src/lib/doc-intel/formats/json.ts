import type { FormatWeaver, HeadingHierarchy, DocumentChunk } from "../types.js"

/**
 * JSON FormatWeaver implementation (stub).
 * Full implementation pending - JSON requires different section semantics than markdown.
 */
export const jsonWeaver: FormatWeaver = {
  format: 'json',
  extensions: ['.json'],

  readOutline: (_content: string): HeadingHierarchy[] => [],

  readSection: (_content: string, _id: string): string | null => {
    return null
  },

  upsertSection: (_content: string, _id: string, _newContent: string, _level?: number): string => {
    throw new Error('Not implemented for JSON format yet')
  },

  writeSection: (_content: string, _id: string, _newContent: string): string => {
    throw new Error('Not implemented for JSON format yet')
  },

  appendSection: (_content: string, _id: string, _newContent: string): string => {
    throw new Error('Not implemented for JSON format yet')
  },

  insertSection: (_content: string, _afterId: string, _newId: string, _level: number, _body: string): string => {
    throw new Error('Not implemented for JSON format yet')
  },

  deleteSection: (_content: string, _id: string): string => {
    throw new Error('Not implemented for JSON format yet')
  },

  readMetadata: (_content: string): Record<string, unknown> | null => {
    return null
  },

  writeMetadata: (_content: string, _metadata: Record<string, unknown>): string => {
    throw new Error('Not implemented for JSON format yet')
  },

  chunkBySections: (_content: string, _maxTokens: number): DocumentChunk[] => [],

  isWellFormed: (content: string): boolean => {
    try {
      JSON.parse(content)
      return true
    } catch {
      return false
    }
  },
}