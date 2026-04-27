const SENSITIVE_FIELD_PATTERN = /(api[_-]?key|token|password|secret|authorization|credential)/i

const DEFAULT_PRESERVE_FIELDS = new Set([
  "id",
  "delegationId",
  "sessionId",
  "sessionID",
  "parentSessionId",
  "childSessionId",
  "queueKey",
  "ptySessionId",
  "workingDirectory",
  "category",
  "createdAt",
  "completedAt",
  "timestamp",
  "status",
  "executionMode",
  "surface",
  "recoveryGuarantee",
])

/**
 * Redact common secret-bearing substrings from text while preserving surrounding context.
 *
 * @param value - Text that may contain synthetic or real credential patterns.
 * @returns Text with credential values replaced by deterministic placeholders.
 *
 * @example
 * ```typescript
 * redactTextSecrets('OPENAI_API_KEY=sk-test-123')
 * // 'OPENAI_API_KEY=[REDACTED:API_KEY]'
 * ```
 */
export function redactTextSecrets(value: string): string {
  return value
    .replace(/\b([A-Z0-9_]*API[_-]?KEY)\s*=\s*([^\s,;]+)/gi, "$1=[REDACTED:API_KEY]")
    .replace(/\b(authorization\s*:\s*bearer\s+)([^\s,;]+)/gi, "$1[REDACTED:TOKEN]")
    .replace(/\b([A-Z0-9_]*TOKEN)\s*=\s*([^\s,;]+)/gi, "$1=[REDACTED:TOKEN]")
    .replace(/\b([A-Z0-9_]*PASSWORD)\s*=\s*([^\s,;]+)/gi, "$1=[REDACTED:PASSWORD]")
    .replace(/\b([A-Z0-9_]*SECRET)\s*=\s*([^\s,;]+)/gi, "$1=[REDACTED:SECRET]")
}

/**
 * Clone a value and redact configured boundary fields without mutating the caller object.
 *
 * @typeParam T - Value shape to clone and redact.
 * @param value - Object, array, or primitive crossing a persistence/output boundary.
 * @param options - Field names to redact as text plus optional fields to preserve.
 * @returns A redacted clone with the same JSON shape.
 *
 * @example
 * ```typescript
 * const safe = redactBoundaryFields({ result: 'TOKEN=abc', id: 'del-1' }, {
 *   redactFieldNames: ['result'],
 * })
 * // { result: 'TOKEN=[REDACTED:TOKEN]', id: 'del-1' }
 * ```
 */
export function redactBoundaryFields<T>(
  value: T,
  options: { redactFieldNames: readonly string[]; preserveFieldNames?: readonly string[] },
): T {
  const redactFields = new Set(options.redactFieldNames)
  const preserveFields = new Set([...DEFAULT_PRESERVE_FIELDS, ...(options.preserveFieldNames ?? [])])

  return redactUnknown(value, redactFields, preserveFields) as T
}

/**
 * Recursively clone and redact unknown JSON-like data.
 *
 * @param value - Value to clone.
 * @param redactFields - Field names whose string values should be text-redacted.
 * @param preserveFields - Field names that must remain operationally intact.
 * @param fieldName - Current field name, if traversing an object.
 * @returns Cloned and redacted value.
 */
function redactUnknown(
  value: unknown,
  redactFields: ReadonlySet<string>,
  preserveFields: ReadonlySet<string>,
  fieldName?: string,
): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => redactUnknown(entry, redactFields, preserveFields))
  }
  if (value && typeof value === "object") {
    const output: Record<string, unknown> = {}
    for (const [key, entryValue] of Object.entries(value)) {
      output[key] = redactUnknown(entryValue, redactFields, preserveFields, key)
    }
    return output
  }
  if (typeof value !== "string" || !fieldName || preserveFields.has(fieldName)) {
    return value
  }
  if (SENSITIVE_FIELD_PATTERN.test(fieldName)) {
    return placeholderForField(fieldName)
  }
  if (redactFields.has(fieldName)) {
    return redactTextSecrets(value)
  }
  return value
}

/**
 * Choose a deterministic placeholder from a sensitive field name.
 *
 * @param fieldName - Field name that matched the sensitive-key pattern.
 * @returns Placeholder describing the redacted credential class.
 */
function placeholderForField(fieldName: string): string {
  if (/api[_-]?key/i.test(fieldName)) return "[REDACTED:API_KEY]"
  if (/password/i.test(fieldName)) return "[REDACTED:PASSWORD]"
  if (/secret/i.test(fieldName)) return "[REDACTED:SECRET]"
  return "[REDACTED:TOKEN]"
}
