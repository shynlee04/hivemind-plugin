import { readdirSync, readFileSync, statSync } from "node:fs"
import { extname, relative, sep } from "node:path"

import { assertPathWithinRoot } from "../security/path-scope.js"
import { chunkMarkdownDocument } from "./chunker.js"
import { parseMarkdownDocument } from "./parser.js"
import type { DocIntelligenceInput, DocIntelligenceResult, DocSearchMatch, ParsedMarkdownDocument } from "./types.js"

const MARKDOWN_EXTENSIONS = new Set([".md", ".mdx"])
const DEFAULT_MAX_READ_CHARACTERS = 20000
const DEFAULT_MAX_SEARCH_RESULTS = 50

/**
 * Execute a read-only document intelligence action inside the project root boundary.
 *
 * @param projectRoot - Trusted project root for path security.
 * @param input - Action request to execute.
 * @returns Action-specific document intelligence result.
 * @throws {Error} When the requested path escapes the project root or action arguments are invalid.
 *
 * @example
 * ```typescript
 * const result = executeDocIntelligenceAction(process.cwd(), { action: "skim", path: "README.md" })
 * ```
 */
export function executeDocIntelligenceAction(
  projectRoot: string,
  input: DocIntelligenceInput,
): DocIntelligenceResult {
  switch (input.action) {
    case "skim": {
      const filePath = resolveDocPath(projectRoot, input.path)
      return { action: "skim", document: skimFile(projectRoot, filePath) }
    }
    case "skim_directory": {
      const directoryPath = resolveDocPath(projectRoot, input.path)
      return { action: "skim_directory", documents: listMarkdownFiles(directoryPath).map((file) => skimFile(projectRoot, file)) }
    }
    case "read": {
      const filePath = resolveDocPath(projectRoot, input.path)
      const content = readFileSync(filePath, "utf-8")
      const maxCharacters = input.maxCharacters ?? DEFAULT_MAX_READ_CHARACTERS
      return {
        action: "read",
        path: toRootRelativePath(projectRoot, filePath),
        content: content.slice(0, maxCharacters),
        characterCount: content.length,
        truncated: content.length > maxCharacters,
      }
    }
    case "chunk": {
      const filePath = resolveDocPath(projectRoot, input.path)
      const content = readFileSync(filePath, "utf-8")
      return {
        action: "chunk",
        path: toRootRelativePath(projectRoot, filePath),
        chunks: chunkMarkdownDocument(toRootRelativePath(projectRoot, filePath), content, {
          maxCharacters: input.maxCharacters,
        }),
      }
    }
    case "search": {
      if (!input.query?.trim()) {
        throw new Error("[Harness] doc intelligence search requires a non-empty query")
      }
      const startPath = resolveDocPath(projectRoot, input.path)
      return {
        action: "search",
        query: input.query,
        matches: searchMarkdown(projectRoot, startPath, input.query, input.maxResults ?? DEFAULT_MAX_SEARCH_RESULTS),
      }
    }
  }
}

/**
 * Resolve a requested document path while preserving the doc-intelligence error boundary name.
 *
 * @param projectRoot - Trusted project root.
 * @param candidate - Caller-provided file or directory path.
 * @returns Absolute in-scope path.
 */
function resolveDocPath(projectRoot: string, candidate: string): string {
  return assertPathWithinRoot(projectRoot, candidate, "doc intelligence")
}

/**
 * Read and skim a Markdown file.
 *
 * @param projectRoot - Trusted project root.
 * @param filePath - Absolute document path.
 * @returns Parsed document metadata.
 */
function skimFile(projectRoot: string, filePath: string): ParsedMarkdownDocument {
  return parseMarkdownDocument(toRootRelativePath(projectRoot, filePath), readFileSync(filePath, "utf-8"))
}

/**
 * Recursively list Markdown files in deterministic root-relative order.
 *
 * @param startPath - Absolute file or directory path to inspect.
 * @returns Absolute Markdown file paths sorted deterministically.
 */
function listMarkdownFiles(startPath: string): string[] {
  const stats = statSync(startPath)
  if (stats.isFile()) return isMarkdownFile(startPath) ? [startPath] : []
  return readdirSync(startPath, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name))
    .flatMap((entry) => {
      const entryPath = `${startPath}/${entry.name}`
      if (entry.isDirectory()) return listMarkdownFiles(entryPath)
      return isMarkdownFile(entryPath) ? [entryPath] : []
    })
}

/**
 * Search Markdown files for a case-insensitive query without building an index.
 *
 * @param projectRoot - Trusted project root.
 * @param startPath - Absolute file or directory path.
 * @param query - Query string to find.
 * @param maxResults - Maximum matches to return.
 * @returns Search matches in deterministic path and line order.
 */
function searchMarkdown(projectRoot: string, startPath: string, query: string, maxResults: number): DocSearchMatch[] {
  const normalizedQuery = query.toLowerCase()
  const matches: DocSearchMatch[] = []

  for (const filePath of listMarkdownFiles(startPath)) {
    const lines = readFileSync(filePath, "utf-8").split(/\r?\n/)
    lines.forEach((line, index) => {
      if (matches.length >= maxResults) return
      if (line.toLowerCase().includes(normalizedQuery)) {
        matches.push({ path: toRootRelativePath(projectRoot, filePath), line: index + 1, snippet: line.trim() })
      }
    })
    if (matches.length >= maxResults) break
  }

  return matches
}

/**
 * Check whether a path uses a Markdown extension supported by Phase 55.
 *
 * @param filePath - Absolute or relative file path.
 * @returns True when the file is Markdown or MDX.
 */
function isMarkdownFile(filePath: string): boolean {
  return MARKDOWN_EXTENSIONS.has(extname(filePath).toLowerCase())
}

/**
 * Convert an absolute path to deterministic project-root-relative POSIX format.
 *
 * @param projectRoot - Trusted project root.
 * @param filePath - Absolute file path inside the project root.
 * @returns POSIX-style relative path.
 */
function toRootRelativePath(projectRoot: string, filePath: string): string {
  return relative(projectRoot, filePath).split(sep).join("/")
}
