/**
 * Categories of user intent recognized by the classifier.
 *
 * - `"research"` — Information gathering and investigation tasks.
 * - `"implementation"` — Code creation and feature development.
 * - `"review"` — Code review and audit tasks.
 * - `"debug"` — Bug fixing and troubleshooting.
 * - `"documentation"` — Documentation writing tasks.
 * - `"delegation"` — Task delegation and sub-agent spawning.
 * - `"unknown"` — No matching intent detected.
 */
export type IntentCategory =
  | "research"
  | "implementation"
  | "review"
  | "debug"
  | "documentation"
  | "delegation"
  | "unknown"

/** @internal Keyword pattern registry for intent classification. */
const INTENT_KEYWORDS: ReadonlyArray<{ category: IntentCategory; patterns: RegExp[] }> = [
  {
    category: "research",
    patterns: [
      /\bresearch\b/i,
      /\binvestigate\b/i,
      /\bfind\b/i,
      /\bexplore\b/i,
      /\blook\s+up\b/i,
      /\bgather\s+information\b/i,
      /\barticles?\b/i,
    ],
  },
  {
    category: "review",
    patterns: [
      /\bcode\s+review\b/i,
      /\bpr\s+review\b/i,
      /\breview\b/i,
      /\baudit\b/i,
      /\bevaluate\b/i,
    ],
  },
  {
    category: "debug",
    patterns: [
      /\bfix\b/i,
      /\bdebug\b/i,
      /\bsolve\b/i,
      /\brepair\b/i,
      /\btroubleshoot\b/i,
      /\bcrash\b/i,
      /\berror\b/i,
      /\bbroken\b/i,
    ],
  },
  {
    category: "documentation",
    patterns: [
      /\bwrite\s+readme\b/i,
      /\bdocument\b/i,
      /\breadme\b/i,
      /\bdoc\b/i,
      /\bwiki\b/i,
      /\bcomment\b/i,
      /\bwrite\s+docs\b/i,
    ],
  },
  {
    category: "delegation",
    patterns: [
      /\bdelegate\b/i,
      /\bspawn\b/i,
      /\bsub-agent\b/i,
      /\bsubtask\b/i,
      /\bassign\s+to\b/i,
      /\bhivemind\b/i,
    ],
  },
  {
    category: "implementation",
    patterns: [
      /\bimplement\b/i,
      /\bbuild\b/i,
      /\bcreate\b/i,
      /\bdevelop\b/i,
      /\badd\s+feature\b/i,
      /\bwrite\s+(code|function|test|class|component|module|endpoint)\b/i,
    ],
  },
]

/**
 * Classify a user's text input into an intent category.
 *
 * Scans the input for keyword patterns matching known intent categories.
 * Returns the first matching category in priority order, or `"unknown"`
 * if no patterns match.
 *
 * @param text - The user's input text to classify.
 * @returns The detected {@link IntentCategory}.
 *
 * @example
 * ```typescript
 * classifyIntent("research the best ORM for TypeScript") // "research"
 * classifyIntent("fix the login bug")                    // "debug"
 * classifyIntent("implement user auth")                  // "implementation"
 * classifyIntent("random text")                          // "unknown"
 * ```
 */
export function classifyIntent(text: string): IntentCategory {
  const lower = text.toLowerCase()
  for (const entry of INTENT_KEYWORDS) {
    if (entry.patterns.some((p) => p.test(lower))) {
      return entry.category
    }
  }
  return "unknown"
}
