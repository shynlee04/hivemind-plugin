/**
 * Session naming service — single source of truth for generating and parsing
 * all OpenCode session titles across the harness.
 *
 * Produces machine-parsable titles in the format:
 * `{framework}/{workflow}/{classification}/{agent}/{purpose}@{depth}`
 *
 * This is a pure-logic, zero-dependency utility module. No file I/O,
 * no runtime dependencies, no imports from other harness modules.
 *
 * @module shared/session-naming
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Input parameters for generating a session title. */
export interface NamingInput {
  /** Framework prefix: "hm" or "gsd". */
  framework: string
  /** Workflow type: "governance", "delegate", "planning", "execute", "spawn". */
  workflow: string
  /** Classification: "root", "child", "grandchild", or "fork". */
  classification: "root" | "child" | "grandchild" | "fork"
  /** Agent name: e.g. "gsd-auditor", "gsd-planner", "hm-l2-researcher". */
  agent: string
  /** Short kebab-case description: e.g. "audit-phase23". */
  purpose: string
  /** Delegation depth: 0 = root, 1 = child, 2 = grandchild, etc. */
  depth: number
}

/** Parsed result from a session title string. */
export interface ParsedNaming {
  /** Framework prefix extracted from the title. */
  framework: string
  /** Workflow type extracted from the title. */
  workflow: string
  /** Classification extracted from the title. */
  classification: string
  /** Agent name extracted from the title. */
  agent: string
  /** Purpose extracted from the title. */
  purpose: string
  /** Depth extracted from the title. */
  depth: number
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generates a machine-parsable session title from structured input.
 *
 * Format: `{framework}/{workflow}/{classification}/{agent}/{purpose}@{depth}`
 *
 * @param input - Structured naming input parameters.
 * @returns Formatted session title string.
 *
 * @example
 * ```typescript
 * generateSessionTitle({
 *   framework: "hm",
 *   workflow: "governance",
 *   classification: "root",
 *   agent: "gsd-auditor",
 *   purpose: "audit-phase23",
 *   depth: 0,
 * })
 * // Returns: "hm/governance/root/gsd-auditor/audit-phase23@0"
 * ```
 */
export function generateSessionTitle(input: NamingInput): string {
  const purpose = sanitizePurpose(input.purpose)
  const depth = Math.max(0, Math.floor(input.depth))
  return `${input.framework}/${input.workflow}/${input.classification}/${input.agent}/${purpose}@${depth}`
}

/**
 * Parses a session title string back into structured naming fields.
 *
 * Returns `null` for:
 * - Fewer than 5 slash-separated segments
 * - Last segment missing `@` character
 * - Empty segments
 * - Non-numeric depth value
 *
 * @param title - The session title string to parse.
 * @returns Parsed naming fields, or `null` if the title is invalid.
 *
 * @example
 * ```typescript
 * parseSessionTitle("hm/delegate/child/gsd-researcher/research-mcp-patterns@1")
 * // Returns: {
 * //   framework: "hm",
 * //   workflow: "delegate",
 * //   classification: "child",
 * //   agent: "gsd-researcher",
 * //   purpose: "research-mcp-patterns",
 * //   depth: 1,
 * // }
 * ```
 */
export function parseSessionTitle(title: string): ParsedNaming | null {
  if (!title || typeof title !== "string") return null

  const segments = title.split("/")
  if (segments.length !== 5) return null

  const [framework, workflow, classification, agent, lastSegment] = segments

  // Validate no empty segments
  if (!framework || !workflow || !classification || !agent || !lastSegment) {
    return null
  }

  // Last segment must contain '@' separator
  const atIndex = lastSegment.lastIndexOf("@")
  if (atIndex === -1 || atIndex === 0) return null

  const purpose = lastSegment.slice(0, atIndex)
  const depthStr = lastSegment.slice(atIndex + 1)

  if (!purpose || !depthStr) return null

  const depth = Number(depthStr)
  if (!Number.isInteger(depth) || isNaN(depth) || depth < 0) return null

  return {
    framework,
    workflow,
    classification,
    agent,
    purpose,
    depth,
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Sanitizes a purpose string: lowercase, spaces→hyphens, strip non-alphanumeric except hyphens.
 *
 * @param raw - Raw purpose string to sanitize.
 * @returns Sanitized kebab-case string.
 */
function sanitizePurpose(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
}
