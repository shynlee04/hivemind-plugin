import { extname, isAbsolute, relative, resolve } from 'node:path'

const MARKDOWN_EXTENSIONS = new Set(['.md', '.markdown'])

export function safePath(projectRoot: string, filePath: string): string {
  const resolvedRoot = resolve(projectRoot)
  const resolvedPath = isAbsolute(filePath) ? resolve(filePath) : resolve(projectRoot, filePath)

  if (!resolvedPath.startsWith(resolvedRoot)) {
    throw new Error(`Path traversal blocked: ${filePath} escapes project root`)
  }

  return resolvedPath
}

export function isMarkdownDocument(filePath: string): boolean {
  return MARKDOWN_EXTENSIONS.has(extname(filePath).toLowerCase())
}

export function relativeProjectPath(projectRoot: string, absPath: string): string {
  return relative(resolve(projectRoot), absPath).replace(/\\/g, '/')
}
