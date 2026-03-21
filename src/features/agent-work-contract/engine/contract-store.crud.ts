/**
 * Contract Store CRUD Operations
 *
 * Create, Read, Update, Delete operations for contracts.
 *
 * @module agent-work-contract/engine/contract-store.crud
 */

import { access, open, readFile, rm, writeFile } from 'node:fs/promises'
import lockfile from 'proper-lockfile'
import { AgentWorkContractSchema } from '../schema/contract.js'
import type { AgentWorkContract } from '../schema/index.js'
import { ContractStoreBase, getForwardCompatFields, restoreForwardCompatFields } from './contract-store.base.js'

/**
 * CRUD operations for contract persistence.
 */
export class ContractStoreCrud extends ContractStoreBase {
  /**
   * Creates a new contract in the store.
   *
   * @param contract - The contract to create
   * @throws Error if contract already exists
   */
  async create(contract: AgentWorkContract): Promise<void> {
    await this.ensureDirectory()
    const filePath = this.getContractPath(contract.contractId)

    let handle
    try {
      handle = await open(filePath, 'wx')
      await handle.writeFile(JSON.stringify(contract, null, 2), 'utf-8')
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
        throw new Error(`Contract ${contract.contractId} already exists`)
      }

      throw error
    } finally {
      await handle?.close()
    }
  }

  /**
   * Retrieves a contract by ID from the store.
   *
   * @param contractId - The contract ID to retrieve
   * @returns The contract or null if not found
   */
  async get(contractId: string): Promise<AgentWorkContract | null> {
    await this.ensureDirectory()
    const filePath = this.getContractPath(contractId)

    try {
      const content = await readFile(filePath, 'utf-8')
      const parsed = JSON.parse(content) as Record<string, unknown>

      // Validate with Zod schema
      const validated = AgentWorkContractSchema.parse(parsed)

      return restoreForwardCompatFields(validated, parsed)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null
      }
      throw error
    }
  }

  /**
   * Updates an existing contract with partial updates.
   * Uses atomic file locking for safe concurrent updates.
   *
   * @param contractId - The contract ID to update
   * @param updates - Partial contract fields to update
   * @throws Error if contract not found
   */
  async update(contractId: string, updates: Partial<AgentWorkContract>): Promise<void> {
    await this.ensureDirectory()
    const filePath = this.getContractPath(contractId)

    // Check existence first
    try {
      await access(filePath)
    } catch {
      throw new Error(`Contract ${contractId} not found`)
    }

    // Acquire file lock for atomic read-modify-write
    const release = await lockfile.lock(filePath, { retries: 3 })

    try {
      // Read current state within lock
      const content = await readFile(filePath, 'utf-8')
      const existing = JSON.parse(content) as Record<string, unknown>
      const existingValidated = AgentWorkContractSchema.parse(existing)
      const forwardCompatFields = getForwardCompatFields(existing)
      const updateForwardCompatFields = getForwardCompatFields(updates as Record<string, unknown>)

      // Merge updates with existing contract
      const updated: AgentWorkContract = {
        ...existingValidated,
        ...updates,
        contractId: existingValidated.contractId, // Preserve immutable fields
        sessionId: existingValidated.sessionId,
        createdAt: existingValidated.createdAt,
        updatedAt: new Date().toISOString(), // Always update timestamp
      }

      // Validate merged result and restore forward-compat fields for persistence
      const validated = AgentWorkContractSchema.parse(updated)
      const final: Record<string, unknown> = {
        ...validated,
        ...forwardCompatFields,
        ...updateForwardCompatFields,
      }

      // Write updated contract atomically
      await writeFile(filePath, JSON.stringify(final, null, 2), 'utf-8')
    } finally {
      // Always release lock
      await release()
    }
  }

  /**
   * Deletes a contract from the store.
   *
   * @param contractId - The contract ID to delete
   * @throws Error if contract not found
   */
  async delete(contractId: string): Promise<void> {
    await this.ensureDirectory()
    const filePath = this.getContractPath(contractId)

    // Check existence first
    try {
      await access(filePath)
    } catch {
      throw new Error(`Contract ${contractId} not found`)
    }

    // Delete file
    await rm(filePath, { force: true })
  }
}
