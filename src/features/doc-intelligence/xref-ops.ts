import { existsSync, readFileSync, readdirSync, statSync } from "node:fs"

import { resolveDocPath, toRootRelativePath, DOCUMENT_EXTENSIONS, hasAllowedExtension } from "./safety.js"
import { parseHeadings } from "./heading-index.js"
import { fuzzyMatchHeadings } from "./read-ops.js"
import { slugifyHeading } from "./parser.js"
import type { XrefLink } from "./types.js"

const MARKDOWN_LINK_PATTERN = /\[([^\]]*)\]\(([^)]+)\)/g
const FRAGMENT_SUGGESTION_LIMIT = 3

/**
 * Analyze cross-references in all supported documents under a directory.
 * Discovers local Markdown links and reports valid/broken status.
 *
 * Each link is returned as a discriminated `XrefLink`:
 *   - `kind: "ok"`                — file exists, fragment (if any) resolves
 *   - `kind: "file_not_found"`    — target file does not exist on disk
 *   - `kind: "fragment_not_found"`— file exists, but `#anchor` does not
 *                                   match any heading; `data.suggestions`
 *                                   carries the top 3 closest heading
 *                                   names by Levenshtein distance.
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

        links.push(analyzeOneLink(relPath, filePath, target, i + 1, text))
      }
    }
  }

  return links
}

/**
 * Analyze a single link target. The target is `path[#anchor]`; we resolve
 * the path against the source file's directory, then if a fragment is
 * present and the file exists we validate the fragment against the
 * target file's headings.
 */
function analyzeOneLink(
  from: string,
  sourceAbsPath: string,
  target: string,
  line: number,
  text: string,
): XrefLink {
  const sourceDir = sourceAbsPath.substring(0, sourceAbsPath.lastIndexOf("/") + 1)
  const targetPath = resolveTargetPath(sourceDir, target)

  if (!existsSync(targetPath)) {
    return {
      kind: "file_not_found",
      from,
      to: target,
      line,
      text,
      valid: false,
    }
  }

  // Parse the target as `path#anchor`. resolveTargetPath already strips
  // the fragment for the path resolution, so we re-derive it here.
  const hashIndex = target.indexOf("#")
  const fragment = hashIndex >= 0 ? target.slice(hashIndex + 1) : null

  if (fragment === null) {
    return {
      kind: "ok",
      from,
      to: target,
      line,
      text,
      valid: true,
      fragment: null,
    }
  }

  // File exists, fragment present — validate against the target file's
  // headings. Use the Wave-2 `parseHeadings` module so the parser
  // contract is shared with chunker / hierarchy / indexer (NF-06).
  let targetContent: string
  try {
    targetContent = readFileSync(targetPath, "utf-8")
  } catch {
    // If we can't read the file (permissions, race), fall back to
    // file_not_found — better than silently claiming the fragment is OK.
    return {
      kind: "file_not_found",
      from,
      to: target,
      line,
      text,
      valid: false,
    }
  }
  const targetHeadings = parseHeadings(targetContent)
  const headingTexts = targetHeadings.map((h) => h.text)
  const fragmentSlug = slugifyHeading(fragment)
  const matched = headingTexts.some((headingText) => {
    if (headingText.toLowerCase() === fragment.toLowerCase()) return true
    if (slugifyHeading(headingText) === fragmentSlug && fragmentSlug.length > 0) return true
    return false
  })

  if (matched) {
    return {
      kind: "ok",
      from,
      to: target,
      line,
      text,
      valid: true,
      fragment,
    }
  }

  return {
    kind: "fragment_not_found",
    from,
    to: target,
    line,
    text,
    valid: false,
    fragment,
    data: {
      suggestions: fuzzyMatchHeadings(fragment, headingTexts, FRAGMENT_SUGGESTION_LIMIT),
    },
  }
}

/**
 * Resolve a relative link target against the source file directory.
 * Strips the `#anchor` portion before path resolution.
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
