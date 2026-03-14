export interface HeadingHierarchy {
  level: number
  text: string
  line: number
  children: HeadingHierarchy[]
}

export interface DocumentChunk {
  heading: string | null
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

// ─── Write Operation Types ────────────────────────────────────────────────────────

/**
 * Result from a write operation — includes hash and operation ID for swarm traceability.
 */
export interface WriteResult {
  /** Whether the write changed the file */
  changed: boolean
  /** Number of bytes changed (delta) */
  bytesChanged: number
  /** SHA-256 hash of the file after write */
  hash: string
  /** Unique operation ID for audit trail */
  opId: string
}

/**
 * Signal returned when a file exceeds the chunk-write threshold.
 * Agents must write section-by-section instead of whole-file writes.
 */
export interface ChunkWriteSignal {
  status: 'chunk_required'
  message: string
  lineCount: number
  threshold: number
  outline: HeadingHierarchy[]
}

/**
 * Verification receipt for created documents.
 * Confirms the file was written and can be read back.
 */
export interface CreateVerificationReceipt {
  bytes: number
  lineCount: number
  retrieved: boolean
  readBackHash: string
  formatValidated: boolean
  nonEmptySatisfied: boolean
}

/**
 * Result from creating a new document.
 */
export interface CreateDocumentResult {
  path: string
  created: boolean
  hash: string
  opId: string
  receipt: CreateVerificationReceipt
}

/**
 * An operation for batch editing a single file.
 */
export interface BatchEditOp {
  heading: string
  op: 'write' | 'append' | 'delete' | 'upsert'
  body?: string
  level?: number
}

/**
 * An operation for batch multi-file editing.
 */
export interface BatchFileOp {
  path: string
  ops: BatchEditOp[]
}

/**
 * Result of a batch file operation.
 */
export interface BatchFileResult {
  path: string
  changed: boolean
  bytesChanged: number
  hash: string
  opId: string
  error?: string
}