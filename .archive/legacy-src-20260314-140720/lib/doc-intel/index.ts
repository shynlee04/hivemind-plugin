// Types
export type { HeadingHierarchy, DocumentChunk, FormatWeaver } from "./types.js"

// Format implementations
export { mdWeaver } from "./formats/md.js"
export { xmlWeaver } from "./formats/xml.js"
export { jsonWeaver } from "./formats/json.js"
export { yamlWeaver } from "./formats/yaml.js"

// Utility functions from markdown weaver
export { estimateTokens } from "./formats/md.js"

// Format registry for extension-based lookup
import type { FormatWeaver } from "./types.js"
import { mdWeaver } from "./formats/md.js"
import { xmlWeaver } from "./formats/xml.js"
import { jsonWeaver } from "./formats/json.js"
import { yamlWeaver } from "./formats/yaml.js"

const FORMAT_REGISTRY: Record<string, FormatWeaver> = {
  '.md': mdWeaver,
  '.markdown': mdWeaver,
  '.xml': xmlWeaver,
  '.json': jsonWeaver,
  '.yaml': yamlWeaver,
  '.yml': yamlWeaver,
}

/**
 * Get the appropriate FormatWeaver for a file extension.
 *
 * @param ext - File extension (with or without leading dot)
 * @returns FormatWeaver for the extension, or undefined if not supported
 */
export function getWeaver(ext: string): FormatWeaver | undefined {
  const normalized = ext.startsWith('.') ? ext : `.${ext}`
  return FORMAT_REGISTRY[normalized.toLowerCase()]
}

/**
 * Get all supported file extensions.
 *
 * @returns Array of supported extensions (with leading dots)
 */
export function getSupportedExtensions(): string[] {
  return Object.keys(FORMAT_REGISTRY)
}

/**
 * Check if a file extension is supported.
 *
 * @param ext - File extension (with or without leading dot)
 * @returns True if the extension is supported
 */
export function isExtensionSupported(ext: string): boolean {
  const normalized = ext.startsWith('.') ? ext : `.${ext}`
  return normalized.toLowerCase() in FORMAT_REGISTRY
}