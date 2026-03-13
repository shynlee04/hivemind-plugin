export interface HeadingHierarchy {
  level: number
  text: string
  line: number
  children: HeadingHierarchy[]
}

export interface DocumentChunk {
  heading: string| null
  content: string
  tokenEstimate: number
  startLine: number
  endLine: number
}

export interface FormatWeaver {
  readonly format: 'md' | 'xml' | 'json' | 'yaml'
  readonly extensions: string[]
  readOutline(content: string): HeadingHierarchy[]
  readSection(content: string, id: string): string | null
  upsertSection(content: string, id: string, newContent: string, level?: number): string
  writeSection(content: string, id: string, newContent: string): string
  appendSection(content: string, id: string, newContent: string): string
  insertSection(content: string, afterId: string, newId: string, level: number, body: string): string
  deleteSection(content: string, id: string): string
  readMetadata(content: string): Record<string, unknown> | null
  writeMetadata(content: string, metadata: Record<string, unknown>): string
  chunkBySections(content: string, maxTokens: number): DocumentChunk[]
  isWellFormed(content: string): boolean
}