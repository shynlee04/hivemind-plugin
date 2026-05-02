/**
 * @fileoverview Failure classification for the recovery engine (REC-01).
 *
 * Defines 9 failure classes that cover all known failure modes for the harness.
 * The `classifyFailure` function maps Error objects or string messages to the
 * correct FailureClass using pattern-matching heuristics.
 *
 * @module recovery/failure-classes
 */

// ---------------------------------------------------------------------------
// Failure class type
// ---------------------------------------------------------------------------

/**
 * The 9 known failure classes for the harness recovery engine.
 *
 * | Class                     | Typical cause                                    |
 * |---------------------------|--------------------------------------------------|
 * | delegation-timeout        | Delegation exceeded budget without response      |
 * | delegation-crash          | Child process / session exited unexpectedly      |
 * | state-corruption          | Persisted state is malformed or unreadable       |
 * | pty-unrecoverable         | PTY slave process killed or non-resumable        |
 * | continuity-write-failure  | Filesystem write to continuity store failed      |
 * | sdk-session-lost          | OpenCode SDK session no longer exists            |
 * | permission-denied         | Insufficient filesystem or runtime permissions   |
 * | queue-deadlock            | Circular wait detected in concurrency queue      |
 * | unknown                   | Fallback for unrecognised failures               |
 */
export type FailureClass =
  | "delegation-timeout"
  | "delegation-crash"
  | "state-corruption"
  | "pty-unrecoverable"
  | "continuity-write-failure"
  | "sdk-session-lost"
  | "permission-denied"
  | "queue-deadlock"
  | "unknown"

/**
 * Ordered list of all 9 failure classes. Useful for iteration and validation.
 */
export const FAILURE_CLASSES: readonly FailureClass[] = [
  "delegation-timeout",
  "delegation-crash",
  "state-corruption",
  "pty-unrecoverable",
  "continuity-write-failure",
  "sdk-session-lost",
  "permission-denied",
  "queue-deadlock",
  "unknown",
] as const

// ---------------------------------------------------------------------------
// Classification patterns
// ---------------------------------------------------------------------------

/**
 * Mapping of FailureClass to an array of regex patterns that identify it.
 * Patterns are tested against the lowercased error message.
 * Order matters: first match wins.
 */
const CLASSIFICATION_PATTERNS: ReadonlyArray<{
  readonly failureClass: FailureClass
  readonly patterns: readonly RegExp[]
}> = [
  {
    failureClass: "delegation-timeout",
    patterns: [
      /delegation.*timed?\s*out/i,
      /timed?\s*out.*delegation/i,
      /timeout.*exceeded.*delegation/i,
    ],
  },
  {
    failureClass: "delegation-crash",
    patterns: [
      /delegation.*crash/i,
      /child\s+process\s+exited/i,
    ],
  },
  {
    failureClass: "state-corruption",
    patterns: [
      /state\s+corruption/i,
      /invalid\s+json.*(?:continuity|session)/i,
      /corrupt.*(?:file|state|store)/i,
    ],
  },
  {
    failureClass: "pty-unrecoverable",
    patterns: [
      /pty.*(?:unrecoverable|slave.*killed|exited.*unexpected)/i,
      /terminal.*non-resumable/i,
    ],
  },
  {
    failureClass: "continuity-write-failure",
    patterns: [
      /continuity\s+write\s+fail/i,
      /failed\s+to\s+(?:write|persist).*continuity/i,
    ],
  },
  {
    failureClass: "sdk-session-lost",
    patterns: [
      /sdk\s+session\s+lost/i,
      /session\s+id\s+not\s+found/i,
    ],
  },
  {
    failureClass: "permission-denied",
    patterns: [
      /eacces/i,
      /permission\s+denied/i,
      /eperm/i,
    ],
  },
  {
    failureClass: "queue-deadlock",
    patterns: [
      /queue\s+deadlock/i,
      /circular\s+wait.*semaphore/i,
      /deadlock\s+detect/i,
    ],
  },
]

// ---------------------------------------------------------------------------
// classifyFailure
// ---------------------------------------------------------------------------

/**
 * Classify an error into one of 9 FailureClass values.
 *
 * @param error - An Error object or string message to classify.
 * @returns The matching FailureClass, or `'unknown'` if no pattern matches.
 *
 * @example
 * ```typescript
 * classifyFailure(new Error('[Harness] Delegation timed out after 30000ms'))
 * // => 'delegation-timeout'
 *
 * classifyFailure('EACCES: permission denied')
 * // => 'permission-denied'
 *
 * classifyFailure('something unexpected')
 * // => 'unknown'
 * ```
 */
export function classifyFailure(error: Error | string): FailureClass {
  const message = error instanceof Error ? error.message : error
  if (!message || message.trim().length === 0) {
    return "unknown"
  }

  for (const { failureClass, patterns } of CLASSIFICATION_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(message)) {
        return failureClass
      }
    }
  }

  return "unknown"
}
