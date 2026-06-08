import { existsSync, readFileSync, readdirSync, statSync } from "node:fs"

import { resolveDocPath, toRootRelativePath, DOCUMENT_EXTENSIONS, hasAllowedExtension } from "./safety.js"
import type { XrefLink } from "./types.js"

const MARKDOWN_LINK_PATTERN = /\[([^\]]*)\]\(([^)]+)\)/g

/**
 * Analyze cross-references in all supported documents under a directory.
 * Discovers local Markdown links and reports valid/broken status.
 *
 * @param projectRoot - Trusted project root.
 * @param dirPath - Project-root-relative directory path.
 * @returns Array of cross-reference link entries.
 */
export function analyzeCrossReferences(
  projectRoot: string,
  dirPath: string,
): XrefLink[] {
  const absPath = resolveDocPath(projectRoot, dirPath)
  const links: XrefLink[] = []

  const files = collectDocumentFiles(absPath)

  for (const filePath of files) {
    const content = readFileSync(filePath, "utf-8")
    const lines = content.split(/\r?\n/)
    const relPath = toRootRelativePath(projectRoot, filePath)

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      let match: RegExpExecArray | null

      // Reset regex state for each line
      MARKDOWN_LINK_PATTERN.lastIndex = 0

      while ((match = MARKDOWN_LINK_PATTERN.exec(line)) !== null) {
        const text = match[1]
        const target = match[2].trim()

        // Skip external URLs and anchors
        if (target.startsWith("http://") || target.startsWith("https://") || target.startsWith("#") || target.startsWith("mailto:")) {
          continue
        }

        // Skip reference-style links [text][ref]
        if (target.startsWith("[") && target.endsWith("]")) {
          continue
        }

        // Resolve target against the source file's directory
        const sourceDir = filePath.substring(0, filePath.lastIndexOf("/") + 1)
        const targetPath = resolveTargetPath(sourceDir, target)
        const valid = existsSync(targetPath)

        links.push({
          from: relPath,
          to: target,
          line: i + 1,
          text,
          valid,
        })
      }
    }
  }

  return links
}

/**
 * Resolve a relative link target against the source file directory.
 */
function resolveTargetPath(sourceDir: string, target: string): string {
  if (target.startsWith("/")) {
    return target
  }
  // Remove anchor fragment for resolution
  const pathOnly = target.split("#")[0]
  // Handle relative paths
  const segments = [...sourceDir.split("/").filter(Boolean), ...pathOnly.split("/").filter(Boolean)]
  const resolved: string[] = []

  for (const seg of segments) {
    if (seg === ".") continue
    if (seg === "..") {
      resolved.pop()
    } else {
      resolved.push(seg)
    }
  }

  return "/" + resolved.join("/")
}

/**
 * Collect all document files recursively from a path.
 */
function collectDocumentFiles(startPath: string): string[] {
  const files: string[] = []

  const s = statSync(startPath)
  if (s.isFile()) {
    if (hasAllowedExtension(startPath, DOCUMENT_EXTENSIONS)) {
      files.push(startPath)
    }
    return files
  }

  function walk(dir: string): void {
    const entries = readdirSync(dir, { withFileTypes: true })
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const fullPath = `${dir}/${entry.name}`
      if (entry.isDirectory()) {
        walk(fullPath)
      } else if (hasAllowedExtension(fullPath, DOCUMENT_EXTENSIONS)) {
        files.push(fullPath)
      }
    }
  }

  walk(startPath)
  return files
}
