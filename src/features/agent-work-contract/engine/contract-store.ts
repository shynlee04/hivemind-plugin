/**
 * Contract Store
 *
 * Contract persistence layer with atomic write operations.
 * Uses proper-lockfile for safe concurrent file access.
 * Persists to .hivemind/agent-work-contract/ directory.
 *
 * @module agent-work-contract/engine/contract-store
 */

// Re-export the composed class for backward compatibility
export { ContractStore } from './contract-store.archive.js'

// Re-export types for external consumers
export { CONTRACT_DIR } from './contract-store.types.js'
