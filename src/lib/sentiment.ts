/**
 * Sentiment Detection Module
 *
 * Detects negative signals in agent/user communication to trigger
 * context refresh when drift is detected.
 *
 * Signals:
 *   - Negative keywords: stop, wrong, no, bad, incorrect, confused
 *   - Agent failure phrases: "I apologize", "you are right", "I was wrong"
 *   - Cancellation patterns: "cancel", "abort", "start over"
 */

export interface SentimentSignal {
  type: "negative_keyword" | "failure_phrase" | "cancellation" | "confusion"
  matched_text: string
  timestamp: number
  turn_number: number
  source: "user" | "agent"
}

/**
 * Negative keywords that indicate problems.
 *
 * Short keywords (≤5 chars) use word-boundary regex to prevent false positives
 * like "no" matching "no issues" or "error" matching "error handling".
 * Benign phrases are excluded via negative-lookahead.
 */
const NEGATIVE_KEYWORD_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\bstop\b(?!\s+(worrying|there))/i, label: "stop" },
  { pattern: /\bwrong\b/i, label: "wrong" },
  { pattern: /\bno\b(?!\s+(issues?|errors?|problems?|worries|need|thanks|longer|more))/i, label: "no" },
  { pattern: /\bbad\b(?!\s+(→|->|to))/i, label: "bad" },
  { pattern: /\bincorrect\b/i, label: "incorrect" },
  { pattern: /\bconfused\b/i, label: "confused" },
  { pattern: /\bconfusion\b/i, label: "confusion" },
  { pattern: /\bmistake\b/i, label: "mistake" },
  { pattern: /\berror\b(?!\s+(handling|boundary|boundaries|message|code|type|class|object|page|recovery|log))/i, label: "error" },
  { pattern: /\bbroken\b/i, label: "broken" },
  { pattern: /not working/i, label: "not working" },
  { pattern: /doesn't work/i, label: "doesn't work" },
  { pattern: /isn't working/i, label: "isn't working" },
]

/** Agent failure admission phrases */
const FAILURE_PHRASES = [
  "i apologize",
  "you are right",
  "i was wrong",
  "my mistake",
  "i misunderstood",
  "i made an error",
  "that was incorrect",
  "i see the issue now",
  "you're correct",
  "i should have",
]

/** Cancellation/restart patterns */
const CANCELLATION_PATTERNS = [
  "cancel",
  "abort",
  "start over",
  "begin again",
  "scratch that",
  "forget that",
  "never mind",
  "nevermind",
  "let's restart",
  "do over",
]

/** Confusion indicators */
const CONFUSION_PATTERNS = [
  "i'm confused",
  "i am confused",
  "this is confusing",
  "doesn't make sense",
  "not making sense",
  "unclear",
  "i don't understand",
  "i do not understand",
  "what do you mean",
  "can you explain",
]

/**
 * Detect sentiment signals in text
 */
export function detectSentiment(
  text: string,
  turnNumber: number,
  source: "user" | "agent" = "user"
): SentimentSignal[] {
  const signals: SentimentSignal[] = []
  const lowerText = text.toLowerCase()
  const timestamp = Date.now()

  // Check negative keywords (regex-based with word boundaries)
  for (const { pattern, label } of NEGATIVE_KEYWORD_PATTERNS) {
    if (pattern.test(lowerText)) {
      signals.push({
        type: "negative_keyword",
        matched_text: label,
        timestamp,
        turn_number: turnNumber,
        source,
      })
    }
  }

  // Check failure phrases
  for (const phrase of FAILURE_PHRASES) {
    if (lowerText.includes(phrase)) {
      signals.push({
        type: "failure_phrase",
        matched_text: phrase,
        timestamp,
        turn_number: turnNumber,
        source,
      })
    }
  }

  // Check cancellation patterns
  for (const pattern of CANCELLATION_PATTERNS) {
    if (lowerText.includes(pattern)) {
      signals.push({
        type: "cancellation",
        matched_text: pattern,
        timestamp,
        turn_number: turnNumber,
        source,
      })
    }
  }

  // Check confusion patterns
  for (const pattern of CONFUSION_PATTERNS) {
    if (lowerText.includes(pattern)) {
      signals.push({
        type: "confusion",
        matched_text: pattern,
        timestamp,
        turn_number: turnNumber,
        source,
      })
    }
  }

  return signals
}

/**
 * Check if text contains any negative sentiment
 */
export function hasNegativeSentiment(text: string): boolean {
  return detectSentiment(text, 0).length > 0
}

/**
 * Get sentiment summary for display
 */
export function getSentimentSummary(signals: SentimentSignal[]): string {
  if (signals.length === 0) {
    return "No negative signals detected"
  }

  const byType = signals.reduce(
    (acc, signal) => {
      acc[signal.type] = (acc[signal.type] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const parts: string[] = []
  if (byType["negative_keyword"]) parts.push(`${byType["negative_keyword"]} negative keywords`)
  if (byType["failure_phrase"]) parts.push(`${byType["failure_phrase"]} failure admissions`)
  if (byType["cancellation"]) parts.push(`${byType["cancellation"]} cancellations`)
  if (byType["confusion"]) parts.push(`${byType["confusion"]} confusion indicators`)

  return parts.join(", ")
}
