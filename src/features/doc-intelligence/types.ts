/** Supported document intelligence actions — read, write, batch, metadata, and analysis. */
export type DocIntelligenceAction =
  // Read (original — parity preserved)
  | "skim" | "skim_directory" | "read" | "chunk"
  // Read (new)
  | "read_lines" | "read_offset"
  // Write
  | "create" | "write" | "upsert" | "append" | "insert" | "delete"
  // Batch
  | "batch" | "batch_files"
  // Metadata
  | "metadata" | "set_metadata" | "delete_metadata"
  // Hierarchy
  | "toc" | "outline"
  // Search (extended)
  | "search"
  // Code inspect
  | "inspect"
  // Cross-reference
  | "xref"
  // Index
  | "index"
  // Context extraction
  | "context"

/** Heading metadata extracted from a Markdown document. */
export type DocHeading = {
  /** Markdown heading depth from 1 through 6. */
  depth: number
  /** Plain heading text without leading hash markers. */
  text: string
  /** One-based source line where the heading begins. */
  line: number
  /** Stable slug derived from heading text. */
  slug: string
}

/** Lightweight parsed representation of a Markdown document. */
export type ParsedMarkdownDocument = {
  /** Project-root-relative POSIX path for the document. */
  path: string
  /** Frontmatter parsed with gray-matter. */
  frontmatter: Record<string, unknown>
  /** Best-effort document title from frontmatter or first heading. */
  title: string | null
  /** Markdown heading outline in source order. */
  outline: DocHeading[]
  /** Number of user-visible words in the body. */
  wordCount: number
  /** Number of characters in the full source content. */
  characterCount: number
}

/** Options controlling Markdown chunk creation. */
export type DocChunkOptions = {
  /** Maximum characters per chunk before paragraph-level splitting is attempted. */
  maxCharacters?: number
}

/** Heading-aware content segment returned by the chunk action. */
export type DocChunk = {
  /** Stable root-relative chunk id. */
  id: string
  /** Project-root-relative POSIX path for the source document. */
  path: string
  /** One-based sequence number within the source document. */
  index: number
  /** Nearest heading text for this chunk, when available. */
  heading: string | null
  /** One-based start line in the source document. */
  startLine: number
  /** One-based end line in the source document. */
  endLine: number
  /** Chunk text content. */
  content: string
  /** Character count for chunk content. */
  characterCount: number
  /** Approximate token count using a conservative four-chars-per-token heuristic. */
  estimatedTokens: number
  /** Full heading path breadcrumb from root to this chunk's heading. e.g. ["Installation", "Prerequisites", "Node.js"] */
  headingPath: string[]
  /** Heading depth (1-6) of the nearest parent heading, or 0 for preamble. */
  depth: number
  /** Direct parent heading text, or null for top-level sections. */
  parentHeading: string | null
  /** Frontmatter metadata carried into each chunk for context. */
  frontmatter: Record<string, unknown>
}

/** Input accepted by the document intelligence router. */
export type DocIntelligenceInput = {
  /** Action to execute. */
  action: DocIntelligenceAction
  /** File or directory path scoped to the project root. */
  path: string
  /** Search query for the search action. */
  query?: string
  /** Maximum characters for read and chunk actions. */
  maxCharacters?: number
  /** Maximum match count for search actions. */
  maxResults?: number
  /** Optional format filter for skim_directory. */
  format?: "md" | "json" | "yaml" | "xml"
  /** Optional heading parameter for targeted section read. */
  heading?: string
  /** Optional regex flag for search. */
  regex?: boolean
  /** Optional heading-only flag for search. */
  headingOnly?: boolean
}

/** Single full-text search match with heading context. */
export type DocSearchMatch = {
  /** Project-root-relative POSIX path for the matched document. */
  path: string
  /** One-based line number for the match. */
  line: number
  /** Trimmed matching line snippet. */
  snippet: string
  /** Nearest heading above the match (for context). */
  heading: string | null
}

/** Verification receipt for create operations. */
export type WriteReceipt = {
  opId: string
  hash: string
  path: string
  created: boolean
}

/** Result from a write/upsert/append/insert operation. */
export type SectionWriteResult = {
  opId: string
  hash: string
  path: string
  heading: string
  changed: boolean
  bytesChanged: number
}

/** Result from a delete operation (section or file). */
export type DeleteResult = {
  opId: string
  path: string
  deleted: boolean
  mode: "section" | "file"
}

/** Signal returned when file exceeds chunk threshold. */
export type ChunkRequiredSignal = {
  status: "chunk_required"
  path: string
  lineCount: number
  threshold: number
  outline: DocHeading[]
}

/** Line-range read result. */
export type LineReadResult = {
  path: string
  content: string
  startLine: number
  endLine: number
  totalLines: number
  hash: string
}

/** Offset-based read result. */
export type OffsetReadResult = {
  path: string
  content: string
  offset: number
  limit: number
  totalCharacters: number
}

/** A single section edit operation within a batch. */
export type SectionEditOp =
  | { op: "write"; heading: string; body: string }
  | { op: "upsert"; heading: string; body: string; level?: number }
  | { op: "append"; heading: string; content: string }
  | { op: "insert"; afterHeading: string; newHeading: string; level: number; body: string }
  | { op: "delete"; heading: string }

/** Single-file batch edit result per operation. */
export type BatchOpResult = SectionWriteResult | DeleteResult | { op: string; error: string }

/** JSDoc block with paired declaration. */
export type JsDocBlock = {
  /** The raw JSDoc comment text (including /** ... *\/). */
  comment: string
  /** Name of the next declaration after this block. */
  pairedName: string | null
}

/** Extracted export symbol. */
export type ExportSymbol = {
  name: string
  kind: "function" | "class" | "interface" | "type" | "variable" | "const"
  line: number
}

/** Function or method signature. */
export type FunctionSignature = {
  name: string
  params: string[]
  returnType: string | null
  line: number
}

/** Full code inspection result. */
export type CodeInspectionResult = {
  path: string
  jsdocBlocks: JsDocBlock[]
  comments: string[]
  exports: ExportSymbol[]
  signatures: FunctionSignature[]
}

/** Heading with nested children for tree structure. */
export type DocHeadingTree = DocHeading & { children: DocHeadingTree[] }

/** Single cross-reference link entry. */
export type XrefLink = {
  from: string
  to: string
  line: number
  text: string
  valid: boolean
}

/** Single document index entry. */
export type DocumentIndexEntry = {
  path: string
  title: string | null
  headingPath: string
  lineCount: number
  sizeBytes: number
  hash: string
  lastModified: string
  headingCount: number
  linkCount: number
}

/** Relevance-scored section for context extraction. */
export type ContextSection = {
  path: string
  heading: string | null
  content: string
  relevanceScore: number
  tokenEstimate: number
}

/** Union of all document intelligence results. */
export type DocIntelligenceResult =
  // Read (original — shapes preserved)
  | { action: "skim"; document: ParsedMarkdownDocument }
  | { action: "skim_directory"; documents: ParsedMarkdownDocument[] }
  | { action: "read"; path: string; content: string; characterCount: number; truncated: boolean }
  | { action: "chunk"; path: string; chunks: DocChunk[] }
  // Read (extended)
  | { action: "read_lines"; result: LineReadResult }
  | { action: "read_offset"; result: OffsetReadResult }
  // Write
  | { action: "create"; result: WriteReceipt }
  | { action: "write"; result: SectionWriteResult }
  | { action: "upsert"; result: SectionWriteResult }
  | { action: "append"; result: SectionWriteResult }
  | { action: "insert"; result: SectionWriteResult }
  | { action: "delete"; result: DeleteResult | ChunkRequiredSignal }
  // Batch
  | { action: "batch"; results: BatchOpResult[]; hash: string }
  | { action: "batch_files"; results: Array<{ path: string; ops: BatchOpResult[]; error?: string }> }
  // Metadata
  | { action: "metadata"; metadata: Record<string, unknown> | null }
  | { action: "set_metadata"; hash: string; opId: string }
  | { action: "delete_metadata"; hash: string; opId: string }
  // Hierarchy
  | { action: "toc"; toc: string }
  | { action: "outline"; flat: DocHeading[]; tree: DocHeadingTree[] }
  // Search (extended with heading context)
  | { action: "search"; query: string; matches: DocSearchMatch[] }
  // Code inspect
  | { action: "inspect"; result: CodeInspectionResult }
  // Cross-reference
  | { action: "xref"; links: XrefLink[] }
  // Index
  | { action: "index"; entries: DocumentIndexEntry[] }
  // Context extraction
  | { action: "context"; sections: ContextSection[] }
