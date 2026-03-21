/**
 * Serialization utilities for IntakeRecord.
 */

import type { IntakeRecord } from './intake-record.types.js'
import { validateIntakeRecord } from './intake-record.validation.js'

/**
 * Serializes an IntakeRecord to JSON string.
 *
 * Safe for persistence (SC-01 scenario).
 */
export function serializeIntakeRecord(record: IntakeRecord): string {
  return JSON.stringify(record)
}

/**
 * Deserializes an IntakeRecord from JSON string.
 *
 * Validates the record and returns it if valid.
 * Returns null if validation fails.
 */
export function deserializeIntakeRecord(json: string): IntakeRecord {
  const parsed = JSON.parse(json) as unknown
  const result = validateIntakeRecord(parsed)
  if (!result.valid) {
    throw new Error(`Invalid IntakeRecord: ${result.errors.join('; ')}`)
  }
  return parsed as IntakeRecord
}
