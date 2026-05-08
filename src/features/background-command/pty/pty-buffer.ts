import type { PtyReadResult } from "./pty-types.js"

type PtyBuffer = {
  append(chunk: string): void
  readSince(offset: number): PtyReadResult
  snapshot(): PtyReadResult
}

export function createPtyBuffer(maxChars = 20000): PtyBuffer {
  const cap = Number.isFinite(maxChars) ? Math.max(1, Math.floor(maxChars)) : 20000

  let content = ""
  let nextOffset = 0
  let truncationCatchupOffset: number | undefined

  function trimToCap(): void {
    if (content.length <= cap) {
      return
    }

    content = content.slice(content.length - cap)
    truncationCatchupOffset = nextOffset
  }

  function currentStartOffset(): number {
    return nextOffset - content.length
  }

  return {
    append(chunk: string): void {
      if (chunk.length === 0) {
        return
      }

      content += chunk
      nextOffset += chunk.length
      trimToCap()
    },

    readSince(offset: number): PtyReadResult {
      const requestedOffset = Number.isFinite(offset) ? Math.max(0, Math.floor(offset)) : 0
      const startOffset = currentStartOffset()
      const effectiveOffset = Math.max(requestedOffset, startOffset)
      const truncated =
        requestedOffset < startOffset ||
        (truncationCatchupOffset !== undefined && requestedOffset < truncationCatchupOffset)

      if (truncationCatchupOffset !== undefined && requestedOffset >= truncationCatchupOffset) {
        truncationCatchupOffset = undefined
      }

      return {
        content: content.slice(effectiveOffset - startOffset),
        nextOffset,
        truncated,
      }
    },

    snapshot(): PtyReadResult {
      return {
        content,
        nextOffset,
        truncated: currentStartOffset() > 0 || truncationCatchupOffset !== undefined,
      }
    },
  }
}
