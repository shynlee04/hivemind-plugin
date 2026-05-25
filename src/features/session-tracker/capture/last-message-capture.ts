/**
 * Continuous assistant response text tracking via event hook.
 *
 * Listens for `message.updated` and `message.part.updated` events from
 * the OpenCode `event` hook to build a live cache of the latest assistant
 * response text per session. Eliminates the need to poll `getSessionMessages()`
 * in `handleSessionIdle()` for last-message fallback.
 *
 * The cache is bounded to 5 entries (FIFO eviction) to prevent unbounded
 * memory growth over long plugin lifetimes.
 *
 * @module session-tracker/capture/last-message-capture
 */

import { asString, getNestedValue } from "../../../shared/helpers.js"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Per-entry shape in the bounded message cache. */
interface LastMessageEntry {
  /** The session this message belongs to. */
  sessionID: string
  /** The latest captured assistant text for this message. */
  lastText: string
}

// ---------------------------------------------------------------------------
// LastMessageCapture class
// ---------------------------------------------------------------------------

/**
 * Continuously tracks the latest assistant response text from
 * `message.updated` / `message.part.updated` events.
 *
 * Maintains a bounded FIFO cache keyed by `messageID` with at most
 * 5 entries. Provides lookup by sessionID for `handleSessionIdle()`.
 *
 * The optional `onLastMessageUpdate` callback allows wiring to
 * `SessionWriter.updateFrontmatter()` for continuous `.md` frontmatter
 * updates as text streams in.
 */
export class LastMessageCapture {
  /** Bounded cache: messageID → { sessionID, lastText }. */
  private messages: Map<string, LastMessageEntry> = new Map()

  /** FIFO insertion order tracking for bounded eviction. */
  private insertionOrder: string[] = []

  /** Maximum number of message entries before FIFO eviction. */
  private readonly maxEntries = 5

  /** Optional callback invoked when a non-empty text update arrives. */
  private readonly onLastMessageUpdate?: (sessionID: string, text: string) => void

  /**
   * @param deps - Optional dependencies.
   * @param deps.onLastMessageUpdate - Callback invoked when a non-empty
   *   assistant text part is captured. Receives the sessionID and the
   *   full text. Useful for wiring to `SessionWriter.updateFrontmatter()`.
   */
  constructor(deps?: {
    onLastMessageUpdate?: (sessionID: string, text: string) => void
  }) {
    this.onLastMessageUpdate = deps?.onLastMessageUpdate
  }

  /**
   * Handles an event from the OpenCode `event` hook pipeline.
   *
   * Processes:
   * - `message.updated` — registers a new message entry when the role is
   *   `"assistant"`, using `event.properties.info.id` as the key.
   * - `message.part.updated` — updates the tracked `lastText` for an
   *   existing message when the part type is `"text"`. Invokes the
   *   `onLastMessageUpdate` callback when the accumulated text is non-empty.
   *
   * All other event types are silently ignored.
   *
   * @param event - Raw event payload from the OpenCode event hook.
   */
  handleEvent(event: Record<string, unknown>): void {
    const eventType = asString(getNestedValue(event, ["type"]))

    if (eventType === "message.updated") {
      this.handleMessageUpdated(event)
    } else if (eventType === "message.part.updated") {
      this.handleMessagePartUpdated(event)
    }
  }

  /**
   * Processes a `message.updated` event.
   *
   * Extracts the role, messageID, and sessionID from the event properties.
   * If the role is `"assistant"`, registers the messageID in the bounded
   * cache with an empty `lastText` (accumulated later via part updates).
   *
   * @param event - The raw event payload.
   */
  private handleMessageUpdated(event: Record<string, unknown>): void {
    const properties = getNestedValue(event, ["properties"]) as Record<string, unknown> | undefined
    if (!properties) return

    const info = getNestedValue(properties, ["info"]) as Record<string, unknown> | undefined
    if (!info) return

    const role = asString(info.role)
    if (role !== "assistant") return

    const messageID = asString(info.id)
    const sessionID = asString(info.sessionID)
    if (!messageID || !sessionID) return

    // Register or update the entry. If already tracked, just update sessionID.
    if (!this.messages.has(messageID)) {
      // FIFO eviction: remove oldest entry when at capacity
      if (this.messages.size >= this.maxEntries) {
        const oldest = this.insertionOrder.shift()
        if (oldest) {
          this.messages.delete(oldest)
        }
      }
      this.insertionOrder.push(messageID)
    }

    this.messages.set(messageID, { sessionID, lastText: "" })
  }

  /**
   * Processes a `message.part.updated` event.
   *
   * Extracts the `messageID` and part data from the event. If the part
   * type is `"text"` and the messageID is already tracked in the cache,
   * appends the new text to the existing `lastText`. Invokes the
   * `onLastMessageUpdate` callback when the accumulated text is non-empty.
   *
   * @param event - The raw event payload.
   */
  private handleMessagePartUpdated(event: Record<string, unknown>): void {
    const properties = getNestedValue(event, ["properties"]) as Record<string, unknown> | undefined
    if (!properties) return

    const part = getNestedValue(properties, ["part"]) as Record<string, unknown> | undefined
    if (!part) return

    const partType = asString(part.type)
    if (partType !== "text") return

    const messageID = asString(part.messageID)
    if (!messageID) return

    const entry = this.messages.get(messageID)
    if (!entry) return

    // part.text is already accumulated text (not delta) — replace, don't append
    const text = asString(part.text) ?? ""
    if (!text) return

    entry.lastText = text

    // Invoke callback if the accumulated text is non-empty
    if (text.trim().length > 0) {
      this.onLastMessageUpdate?.(entry.sessionID, text)
    }
  }

  /**
   * Retrieves the latest tracked assistant text for a given session.
   *
   * Iterates through tracked entries in insertion order (most recent last)
   * and returns the first matching non-empty `lastText`. Returns `undefined`
   * if no assistant text has been tracked for this session.
   *
   * @param sessionID - The session identifier to look up.
   * @returns The latest assistant text, or `undefined` if not found.
   */
  getLastMessage(sessionID: string): string | undefined {
    // Iterate in reverse insertion order to find the most recent message
    for (let i = this.insertionOrder.length - 1; i >= 0; i--) {
      const messageID = this.insertionOrder[i]
      const entry = this.messages.get(messageID)
      if (entry && entry.sessionID === sessionID && entry.lastText.trim().length > 0) {
        return entry.lastText
      }
    }
    return undefined
  }

  /**
   * Removes all tracked message entries for a given session.
   *
   * Called when a session terminates (session.deleted, session.error) to
   * free cache space and prevent stale text from being returned for
   * recycled session IDs.
   *
   * @param sessionID - The session identifier to clear.
   */
  clearSession(sessionID: string): void {
    const toRemove: string[] = []
    for (const [messageID, entry] of this.messages) {
      if (entry.sessionID === sessionID) {
        toRemove.push(messageID)
      }
    }
    for (const messageID of toRemove) {
      this.messages.delete(messageID)
      const idx = this.insertionOrder.indexOf(messageID)
      if (idx !== -1) {
        this.insertionOrder.splice(idx, 1)
      }
    }
  }
}
