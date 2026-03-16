import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

import {
  chunkMarkdownSections,
  estimateTokens,
  readMarkdownMetadata,
  readMarkdownOutline,
  readMarkdownSection,
} from './formats/md.js'
import { isMarkdownDocument, relativeProjectPath, safePath } from './safety.js'
import type { DocumentChunk, DocumentSearchResult, DocumentSkim, HeadingHierarchy } from './types.js'

async function readTextFile(absPath: string): Promise<string> {
  return readFile(absPath, 'utf-8')
}

async function scanMarkdownFiles(dirPath: string): Promise<string[]> {
  const results: string[] = []

  async function walk(currentPath: string): Promise<void> {
    let entries
    try {
      entries = await readdir(currentPath, { withFileTypes: true })
    } catch {
      return
    }

    for (const entry of entries) {
      const fullPath = join(currentPath, entry.name)
      if (entry.isDirectory()) {
        if (entry.name.startsWith('.') || entry.name === 'node_modules') {
          continue
        }
        await walk(fullPath)
        continue
      }

      if (entry.isFile() && isMarkdownDocument(fullPath)) {
        results.push(fullPath)
      }
    }
  }

  await walk(dirPath)
  return results
}

function flattenHeadings(entries: HeadingHierarchy[]): Array<{ text: string; line: number }> {
  const result: Array<{ text: string; line: number }> = []

  function walk(items: HeadingHierarchy[]): void {
    for (const item of items) {
      result.push({ text: item.text, line: item.line })
      walk(item.children)
    }
  }

  walk(entries)
  return result
}

export async function skimDocument(projectRoot: string, filePath: string): Promise<DocumentSkim> {
  const absPath = safePath(projectRoot, filePath)
  const content = await readTextFile(absPath)

  return {
    path: relativeProjectPath(projectRoot, absPath),
    metadata: readMarkdownMetadata(content),
    outline: readMarkdownOutline(content),
    lineCount: content.split('\n').length,
    tokenEstimate: estimateTokens(content),
  }
}

export async function skimDirectory(projectRoot: string, dirPath: string, globFilter?: string): Promise<DocumentSkim[]> {
  const absPath = safePath(projectRoot, dirPath)
  const files = await scanMarkdownFiles(absPath)
  const normalizedFilter = globFilter?.toLowerCase()
  const filteredFiles = normalizedFilter
    ? files.filter((file) => file.toLowerCase().endsWith(normalizedFilter))
    : files

  return Promise.all(filteredFiles.map((file) => skimDocument(projectRoot, file)))
}

export async function readSection(projectRoot: string, filePath: string, heading: string): Promise<string | null> {
  const absPath = safePath(projectRoot, filePath)
  const content = await readTextFile(absPath)
  return readMarkdownSection(content, heading)
}

export async function readChunked(
  projectRoot: string,
  filePath: string,
  heading?: string,
  maxTokens = 2000,
): Promise<DocumentChunk[]> {
  const absPath = safePath(projectRoot, filePath)
  const content = await readTextFile(absPath)
  const scopedContent = heading ? readMarkdownSection(content, heading) : content
  if (!scopedContent) {
    return []
  }
  return chunkMarkdownSections(scopedContent, maxTokens)
}

export async function searchDocuments(
  projectRoot: string,
  dirPath: string,
  query: string | RegExp,
  globFilter?: string,
): Promise<DocumentSearchResult[]> {
  const absPath = safePath(projectRoot, dirPath)
  const files = await scanMarkdownFiles(absPath)
  const normalizedFilter = globFilter?.toLowerCase()
  const filteredFiles = normalizedFilter
    ? files.filter((file) => file.toLowerCase().endsWith(normalizedFilter))
    : files
  const matcher = typeof query === 'string' ? new RegExp(query, 'gi') : query
  const results: DocumentSearchResult[] = []

  for (const file of filteredFiles) {
    const content = await readTextFile(file)
    const outline = readMarkdownOutline(content)
    const flattened = flattenHeadings(outline)
    const lines = content.split('\n')
    let headingIndex = 0
    let currentHeading = '(body)'

    for (let index = 0; index < lines.length; index += 1) {
      while (flattened[headingIndex] && flattened[headingIndex]!.line - 1 <= index) {
        currentHeading = flattened[headingIndex]!.text
        headingIndex += 1
      }

      matcher.lastIndex = 0
      const line = lines[index] ?? ''
      while (matcher.exec(line) !== null) {
        results.push({
          path: relativeProjectPath(projectRoot, file),
          heading: currentHeading,
          line: index + 1,
          snippet: line.trim().slice(0, 200),
        })
      }
    }
  }

  return results
}
