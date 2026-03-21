/**
 * HiveMind Error Type Hierarchy
 *
 * Formal error type hierarchy for consistent error handling across the codebase.
 * All errors are typed and carry structured metadata for diagnostics.
 *
 * @module shared/errors
 */

/**
 * Base class for all HiveMind runtime errors.
 * Carries structured error metadata for debugging and error tracking.
 */
export class RuntimeError extends Error {
  public readonly code: string
  public readonly context: Record<string, unknown>
  public readonly timestamp: string

  constructor(message: string, code: string, context: Record<string, unknown> = {}) {
    super(message)
    this.name = this.constructor.name
    this.code = code
    this.context = context
    this.timestamp = new Date().toISOString()

    // Maintains proper stack trace for where error was thrown (V8 engines)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack,
    }
  }
}

/**
 * Validation errors occur when data fails schema validation.
 * Used by Zod validation failures and custom validation logic.
 */
export class ValidationError extends RuntimeError {
  public readonly zodIssues?: unknown

  constructor(message: string, context: Record<string, unknown> = {}, zodIssues?: unknown) {
    super(message, 'VALIDATION_ERROR', context)
    this.name = 'ValidationError'
    this.zodIssues = zodIssues
  }
}

/**
 * Not found errors occur when a requested resource doesn't exist.
 * Used for missing files, records, or configurations.
 */
export class NotFoundError extends RuntimeError {
  public readonly resourceType: string
  public readonly resourceId: string

  constructor(resourceType: string, resourceId: string, context: Record<string, unknown> = {}) {
    super(
      `${resourceType} not found: ${resourceId}`,
      'NOT_FOUND',
      { resourceType, resourceId, ...context },
    )
    this.name = 'NotFoundError'
    this.resourceType = resourceType
    this.resourceId = resourceId
  }
}

/**
 * Schema migration errors occur during schema version upgrades.
 * Used when reading legacy data formats that require migration.
 */
export class SchemaMigrationError extends RuntimeError {
  public readonly fromVersion: string | null
  public readonly toVersion: string

  constructor(message: string, fromVersion: string | null, toVersion: string, context: Record<string, unknown> = {}) {
    super(message, 'SCHEMA_MIGRATION_ERROR', { fromVersion, toVersion, ...context })
    this.name = 'SchemaMigrationError'
    this.fromVersion = fromVersion
    this.toVersion = toVersion
  }
}

/**
 * Corruption errors occur when persistent state is unreadable or invalid.
 * Used when JSON parsing fails or schema validation detects corrupted data.
 * These errors should be surfaced (not silently masked) so repair flows can run.
 */
export class CorruptionError extends RuntimeError {
  public readonly resourceType: string
  public readonly resourcePath: string | null

  constructor(
    message: string,
    resourceType: string,
    resourcePath: string | null = null,
    context: Record<string, unknown> = {},
  ) {
    super(message, 'TASK_LEDGER_CORRUPTION', { resourceType, resourcePath, ...context })
    this.name = 'CorruptionError'
    this.resourceType = resourceType
    this.resourcePath = resourcePath
  }
}

/**
 * Delegation errors occur in delegation store operations.
 */
export class DelegationError extends RuntimeError {
  public readonly delegationId: string | null

  constructor(message: string, delegationId: string | null, context: Record<string, unknown> = {}) {
    super(message, 'DELEGATION_ERROR', { delegationId, ...context })
    this.name = 'DelegationError'
    this.delegationId = delegationId
  }
}

/**
 * Sync errors occur during runtime surface synchronization.
 */
export class SyncError extends RuntimeError {
  public readonly operation: 'mirror' | 'delete' | 'backup' | 'protect'

  constructor(message: string, operation: SyncError['operation'], context: Record<string, unknown> = {}) {
    super(message, 'SYNC_ERROR', { operation, ...context })
    this.name = 'SyncError'
    this.operation = operation
  }
}

/**
 * Result type for operations that can fail with structured errors.
 * Replaces raw null returns with explicit error states.
 */
export type Result<T, E extends RuntimeError = RuntimeError> =
  | { ok: true; value: T }
  | { ok: false; error: E }

/**
 * Create a successful result
 */
export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value }
}

/**
 * Create a failed result
 */
export function err<E extends RuntimeError>(error: E): Result<never, E> {
  return { ok: false, error }
}
