/** Supported read-only document intelligence actions. */
export type DocIntelligenceAction = "skim" | "skim_directory" | "read" | "chunk" | "search"

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
}

/** Single full-text search match. */
export type DocSearchMatch = {
  /** Project-root-relative POSIX path for the matched document. */
  path: string
  /** One-based line number for the match. */
  line: number
  /** Trimmed matching line snippet. */
  snippet: string
}

/** Union of read-only document intelligence results. */
export type DocIntelligenceResult =
  | { action: "skim"; document: ParsedMarkdownDocument }
  | { action: "skim_directory"; documents: ParsedMarkdownDocument[] }
  | { action: "read"; path: string; content: string; characterCount: number; truncated: boolean }
  | { action: "chunk"; path: string; chunks: DocChunk[] }
  | { action: "search"; query: string; matches: DocSearchMatch[] }
