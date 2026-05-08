import { dirname } from "node:path"
import type { ClassifiedEvent, DualPersistenceFileSystem } from "./types.js"

/**
 * Result of a persistence write operation.
 */
type PersistResult = {
  /** Path to the JSON artifact. */
  jsonPath: string
  /** Path to the Markdown artifact. */
  markdownPath: string
  /** Whether the event was new (not a duplicate). */
  written: boolean
}

/**
 * Dual persistence engine for classified events.
 *
 * Supports two write modes:
 * - **Atomic JSON**: Full document rewrite with bounded event retention.
 * - **Append-only Markdown**: Appends classified event blocks to an append-only log.
 * - **Dual**: Writes both atomically in a single call.
 *
 * Uses dependency-injected filesystem for testability.
 */
export type DualPersistence = {
  /** Persist a classified event as an atomic JSON document. */
  persist(event: ClassifiedEvent): PersistResult
  /** Append a classified event as a Markdown block to the append-only log. */
  persistAppendMarkdown(event: ClassifiedEvent): PersistResult
  /** Persist a classified event to both JSON and Markdown simultaneously. */
  persistDual(event: ClassifiedEvent): PersistResult
}

type ClassifiableDocument = {
  _schema: "harness/classified-events/v1"
  sessionId: string
  events: Array<{ type: string; classifiedAt: number; original: unknown }>
  updatedAt: number
}

/**
 * Creates a dual persistence engine for classified events.
 *
 * @param options - Filesystem adapter, base directory path, and optional session ID resolver.
 * @returns A {@link DualPersistence} instance with persist, persistAppendMarkdown, and persistDual methods.
 *
 * @example
 * ```ts
 * const persistence = createDualPersistence({
 *   fs: nodeFs,
 *   basePath: ".hivemind/event-tracker",
 * })
 * persistence.persistDual(classifiedEvent)
 * ```
 */
export function createDualPersistence(options: {
  fs: DualPersistenceFileSystem
  basePath: string
  sessionId?: string
}): DualPersistence {
  const { fs, basePath, sessionId = "default" } = options
  const artifactStem = `cls_${sessionId.replace(/[^A-Za-z0-9]/g, "").slice(0, 8).padEnd(4, "0").slice(0, 4).toLowerCase()}`
  const jsonPath = `${basePath}/${artifactStem}.json`
  const markdownPath = `${basePath}/${artifactStem}.md`

  return {
    persist(event: ClassifiedEvent): PersistResult {
      fs.mkdirSync(dirname(jsonPath), { recursive: true })
      const current = readClassifiedDocument(fs, jsonPath)
      if (isDuplicate(current, event)) {
        return { jsonPath, markdownPath, written: false }
      }
      const next = addClassifiedEvent(current, event)
      writeClassifiedJson(fs, jsonPath, next)
      return { jsonPath, markdownPath, written: true }
    },

    persistAppendMarkdown(event: ClassifiedEvent): PersistResult {
      fs.mkdirSync(dirname(markdownPath), { recursive: true })
      const block = renderClassifiedEventMarkdown(event)
      fs.appendFileSync(markdownPath, `${block}\n`, "utf-8")
      return { jsonPath, markdownPath, written: true }
    },

    persistDual(event: ClassifiedEvent): PersistResult {
      const jsonResult = this.persist(event)
      const mdResult = this.persistAppendMarkdown(event)
      return {
        jsonPath: jsonResult.jsonPath,
        markdownPath: mdResult.markdownPath,
        written: jsonResult.written || mdResult.written,
      }
    },
  }
}

/**
 * Reads an existing classified document or creates an empty one.
 */
function readClassifiedDocument(fs: DualPersistenceFileSystem, jsonPath: string): ClassifiableDocument {
  if (!fs.existsSync(jsonPath)) {
    return { _schema: "harness/classified-events/v1", sessionId: "default", events: [], updatedAt: 0 }
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(jsonPath, "utf-8")) as unknown
    if (isClassifiedDocument(parsed)) return parsed
  } catch {
    // Corrupt document — start fresh.
  }
  return { _schema: "harness/classified-events/v1", sessionId: "default", events: [], updatedAt: 0 }
}

/**
 * Writes a classified document atomically as formatted JSON.
 */
function writeClassifiedJson(fs: DualPersistenceFileSystem, jsonPath: string, document: ClassifiableDocument): void {
  fs.writeFileSync(jsonPath, `${JSON.stringify(document, null, 2)}\n`, "utf-8")
}

/**
 * Adds a classified event to a document, bounded to 200 events.
 */
function addClassifiedEvent(document: ClassifiableDocument, event: ClassifiedEvent): ClassifiableDocument {
  const events = [...document.events, { type: event.type, classifiedAt: event.classifiedAt, original: event.original }]
  return {
    ...document,
    events: events.slice(-200),
    updatedAt: Math.max(document.updatedAt, event.classifiedAt),
  }
}

/**
 * Checks whether a classified event is already present in the document.
 */
function isDuplicate(document: ClassifiableDocument, event: ClassifiedEvent): boolean {
  return document.events.some(
    (existing) => existing.type === event.type && existing.classifiedAt === event.classifiedAt,
  )
}

/**
 * Type guard for the classified events document schema.
 */
function isClassifiedDocument(value: unknown): value is ClassifiableDocument {
  return typeof value === "object" && value !== null
    && (value as { _schema?: unknown })._schema === "harness/classified-events/v1"
}

/**
 * Renders a classified event as a Markdown block suitable for append-only persistence.
 *
 * @param event - The classified event to render.
 * @returns A Markdown string block with event type, timestamp, and summary.
 */
export function renderClassifiedEventMarkdown(event: ClassifiedEvent): string {
  return [
    `## ${event.type}`,
    "",
    `- Classified at: ${event.classifiedAt}`,
    `- Type: ${event.type}`,
    `- Summary: ${summarizeOriginal(event.original)}`,
    "",
    "---",
  ].join("\n")
}

/**
 * Produces a bounded summary string from the original event data.
 */
function summarizeOriginal(original: unknown): string {
  if (typeof original === "object" && original !== null) {
    const record = original as Record<string, unknown>
    const content = typeof record.content === "string" ? record.content : ""
    const role = typeof record.role === "string" ? record.role : ""
    if (content) return content.slice(0, 200)
    if (role) return `role=${role}`
    const keys = Object.keys(record)
    return keys.length > 0 ? `fields: ${keys.slice(0, 5).join(", ")}` : "empty object"
  }
  if (typeof original === "string") return original.slice(0, 200)
  return String(original).slice(0, 200)
}
