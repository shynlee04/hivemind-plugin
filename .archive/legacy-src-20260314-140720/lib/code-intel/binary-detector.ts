import { extname } from "node:path"

const BINARY_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".ico",
  ".svg",
  ".woff",
  ".woff2",
  ".ttf",
  ".otf",
  ".eot",
  ".pdf",
  ".zip",
  ".gz",
  ".tar",
  ".7z",
  ".mp3",
  ".mp4",
  ".mov",
  ".avi",
  ".webm",
  ".wasm",
  ".exe",
  ".dll",
  ".dylib",
  ".so",
])

export function isBinaryPathSafe(filePath: string): boolean {
  const extension = extname(filePath).toLowerCase()
  if (!extension) {
    return true
  }

  return !BINARY_EXTENSIONS.has(extension)
}
