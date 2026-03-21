/**
 * Contract Store Types and Constants
 *
 * Type definitions and constants for contract persistence.
 *
 * @module agent-work-contract/engine/contract-store.types
 */

import type { ContractStoreOperations } from '../types.js'

/**
 * Directory name for contract storage.
 */
export const CONTRACT_DIR = 'agent-work-contract'

/**
 * ContractStore - Manages contract persistence with atomic operations.
 *
 * Implements CRUD operations for AgentWorkContract using proper-lockfile
 * for safe concurrent access and Zod validation on read.
 *
 * @example
 * ```typescript
 * const store = new ContractStore('/project/root')
 * await store.create(contract)
 * const retrieved = await store.get('contract-123')
 * ```
 */
export interface ContractStore extends ContractStoreOperations {}

/**
 * Constructor type for ContractStore.
 */
export type ContractStoreConstructor = new (baseDirectory: string) => ContractStore
