import yaml from "yaml"

/**
 * Render initial document content appropriate to the file extension.
 *
 * @param ext - File extension (e.g., ".md", ".json").
 * @param title - Document title.
 * @param metadata - Optional key-value metadata for frontmatter or top-level keys.
 * @returns Format-appropriate content string.
 */
export function renderInitialContent(
  ext: string,
  title: string,
  metadata?: Record<string, unknown>,
): string {
  const extLower = ext.toLowerCase()

  switch (extLower) {
    case ".md":
    case ".mdx": {
      const parts: string[] = []
      if (metadata && Object.keys(metadata).length > 0) {
        parts.push("---")
        for (const [key, value] of Object.entries(metadata)) {
          parts.push(`${key}: ${String(value)}`)
        }
        parts.push("---")
      }
      parts.push(`# ${title}`)
      return parts.join("\n") + "\n"
    }

    case ".json": {
      const jsonData: Record<string, unknown> = { title }
      if (metadata) {
        for (const [key, value] of Object.entries(metadata)) {
          jsonData[key] = value
        }
      }
      return JSON.stringify(jsonData, null, 2) + "\n"
    }

    case ".yaml":
    case ".yml": {
      const yamlData: Record<string, unknown> = { title }
      if (metadata) {
        for (const [key, value] of Object.entries(metadata)) {
          yamlData[key] = value
        }
      }
      return yaml.stringify(yamlData) + "\n"
    }

    case ".xml": {
      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<document>\n  <title>${escapeXml(title)}</title>\n`
      if (metadata) {
        for (const [key, value] of Object.entries(metadata)) {
          xml += `  <${escapeXml(key)}>${escapeXml(String(value))}</${escapeXml(key)}>\n`
        }
      }
      xml += "</document>\n"
      return xml
    }

    default:
      return `${title}\n`
  }
}

/**
 * Validate that content matches the expected format.
 *
 * @param ext - File extension (e.g., ".md", ".json").
 * @param content - Content to validate.
 * @returns True if content is valid for the format.
 */
export function validateContentFormat(ext: string, content: string): boolean {
  const extLower = ext.toLowerCase()

  switch (extLower) {
    case ".md":
    case ".mdx":
      // At least one heading present
      return /^#{1,6}\s+/m.test(content)

    case ".json":
      try {
        JSON.parse(content)
        return true
      } catch {
        return false
      }

    case ".yaml":
    case ".yml":
      try {
        yaml.parse(content)
        return true
      } catch {
        return false
      }

    case ".xml":
      return isWellFormedXml(content)

    default:
      return true
  }
}

/**
 * Escape XML special characters for element content.
 *
 * @param value - Raw string value.
 * @returns XML-safe string.
 */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

/**
 * Simple regex-based XML well-formedness check.
 *
 * @param content - XML content to validate.
 * @returns True if content appears to be well-formed XML.
 */
function isWellFormedXml(content: string): boolean {
  const trimmed = content.trim()

  // Must start with XML declaration or document element
  if (!trimmed.startsWith("<?xml") && !trimmed.startsWith("<")) return false

  // Must end with a closing document element
  if (!trimmed.endsWith(">")) return false

  // Check for matching root element
  const rootMatch = /^<\?xml[^>]*>\s*<(\w+)/.exec(trimmed) || /^<(\w+)/.exec(trimmed)
  if (!rootMatch) return false

  const rootName = rootMatch[1]
  const closingPattern = new RegExp(`</${escapeXmlForRegex(rootName)}\\s*>\\s*$`)
  if (!closingPattern.test(trimmed)) return false

  return true
}

/**
 * Escape a string for safe use in a regex pattern.
 *
 * @param str - String to escape.
 * @returns Regex-safe string.
 */
function escapeXmlForRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
