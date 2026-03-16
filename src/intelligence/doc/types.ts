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

export interface DocumentSkim {
  path: string
  metadata: Record<string, string> | null
  outline: HeadingHierarchy[]
  lineCount: number
  tokenEstimate: number
}

export interface DocumentSearchResult {
  path: string
  heading: string
  line: number
  snippet: string
}
