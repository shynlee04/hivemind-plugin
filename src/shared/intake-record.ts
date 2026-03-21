/**
 * IntakeRecord — Canonical intake record across control-plane/runtime boundaries.
 *
 * This module is a backward-compatible barrel that re-exports from the decomposed
 * sub-modules. The actual implementation is split into:
 * - intake-record.types.ts: All interfaces and composed types
 * - intake-record.factory.ts: Factory functions
 * - intake-record.validation.ts: Validation logic
 * - intake-record.serialization.ts: Serialization utilities
 *
 * This file exists for backward compatibility and will be removed in a future version.
 */

// Re-export everything from decomposed modules
export * from './intake-record.types.js'
export * from './intake-record.factory.js'
export * from './intake-record.validation.js'
export * from './intake-record.serialization.js'
