/**
 * Sentiment Detection Module
 *
 * Type definitions for sentiment signals used by brain-state.
 * Runtime detection functions removed (dead code) — preserved in git history.
 * Re-add when sentiment analysis is wired into hooks/tools.
 */

export interface SentimentSignal {
  type: "negative_keyword" | "failure_phrase" | "cancellation" | "confusion"
  matched_text: string
  timestamp: number
  turn_number: number
  source: "user" | "agent"
}
