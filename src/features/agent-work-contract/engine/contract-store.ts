/**
 * Contract Store
 *
 * Contract persistence layer with atomic write operations.
 * Uses proper-lockfile for safe concurrent file access.
 * Persists to .hivemind/agent-work-contract/ directory.
 *
 * @module agent-work-contract/engine/contract-store
 */

import { access, mkdir, open, readFile, rm, writeFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import lockfile from 'proper-lockfile'
import { ZodError } from 'zod'
import { AgentWorkContractSchema } from '../schema/contract.js'
import type { AgentWorkContract } from '../schema/index.js'
import type { ContractStoreOperations } from '../types.js'

/**
 * Directory name for contract storage.
 */
const CONTRACT_DIR = 'agent-work-contract'

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
export class ContractStore implements ContractStoreOperations {
  private readonly contractDirectory: string

  /**
   * Extracts unknown top-level fields for forward compatibility.
   *
   * @param value - Raw parsed contract content
   * @returns Unknown fields not represented in the current schema
   */
  private getForwardCompatFields(value: Record<string, unknown>): Record<string, unknown> {
    const schemaKeys = new Set(Object.keys(AgentWorkContractSchema.shape))
    const forwardCompatFields: Record<string, unknown> = {}

    for (const key of Object.keys(value)) {
      if (!schemaKeys.has(key)) {
        forwardCompatFields[key] = value[key]
      }
    }

    return forwardCompatFields
  }

  /**
   * Reattaches unknown fields after schema validation strips them.
   *
   * @param validated - Schema-validated contract
   * @param raw - Raw parsed contract content
   * @returns Validated contract with forward-compatible fields restored
   */
  private restoreForwardCompatFields(
    validated: AgentWorkContract,
    raw: Record<string, unknown>,
  ): AgentWorkContract {
    return {
      ...validated,
      ...this.getForwardCompatFields(raw),
    } as AgentWorkContract
  }

  /**
   * Creates a new ContractStore instance.
   *
   * @param baseDirectory - The base directory (typically project root)
   */
  constructor(baseDirectory: string) {
    this.contractDirectory = join(baseDirectory, '.hivemind', CONTRACT_DIR)
  }

  /**
   * Ensures the contract storage directory exists.
   * Creates the directory tree if it doesn't exist.
   */
  private async ensureDirectory(): Promise<void> {
    await mkdir(this.contractDirectory, { recursive: true })
  }

  /**
   * Gets the file path for a contract ID.
   */
  private getContractPath(contractId: string): string {
    return join(this.contractDirectory, `${contractId}.json`)
  }

  /**
   * Detects missing-file errors from filesystem operations.
   *
   * @param error - Unknown thrown value
   * @returns True when the error represents a missing file
   */
  private isMissingFileError(error: unknown): boolean {
    return (error as NodeJS.ErrnoException).code === 'ENOENT'
  }

  /**
   * Detects malformed stored-contract errors that should not abort listing.
   *
   * @param error - Unknown thrown value
   * @returns True when the stored contract cannot be parsed or validated
   */
  private isMalformedContractError(error: unknown): boolean {
    return error instanceof SyntaxError || error instanceof ZodError
  }

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

      return this.restoreForwardCompatFields(validated, parsed)
    } catch (error) {
      if (this.isMissingFileError(error)) {
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
      const forwardCompatFields = this.getForwardCompatFields(existing)

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
      const final: Record<string, unknown> = { ...validated, ...forwardCompatFields }
      
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

  /**
   * Lists all contracts for a given session.
   *
   * @param sessionId - The session ID to list contracts for
   * @returns Array of contracts for the session
   */
  async list(sessionId: string): Promise<AgentWorkContract[]> {
    await this.ensureDirectory()
    
    try {
      const files = await readdir(this.contractDirectory)
      const contracts: AgentWorkContract[] = []

      for (const file of files) {
        if (!file.endsWith('.json')) continue
        if (file === 'archived') continue // Skip archived directory

        const contractId = file.replace('.json', '')
        let contract: AgentWorkContract | null

        try {
          contract = await this.get(contractId)
        } catch (error) {
          if (this.isMalformedContractError(error)) {
            continue
          }

          throw error
        }
        
        if (contract && contract.sessionId === sessionId) {
          contracts.push(contract)
        }
      }

      return contracts
    } catch (error) {
      if (this.isMissingFileError(error)) {
        return []
      }
      throw error
    }
  }

  /**
   * Archives a contract (soft delete with retention).
   * Archives are stored in a separate subdirectory for potential recovery.
   *
   * @param contractId - The contract ID to archive
   * @throws Error if contract not found
   */
  async archive(contractId: string): Promise<void> {
    await this.ensureDirectory()
    
    const contract = await this.get(contractId)
    if (!contract) {
      throw new Error(`Contract ${contractId} not found`)
    }

    // Create archive directory
    const archiveDir = join(this.contractDirectory, 'archived')
    await mkdir(archiveDir, { recursive: true })

    // Move to archive
    const sourcePath = this.getContractPath(contractId)
    const archivePath = join(archiveDir, `${contractId}.json`)
    
    const content = await readFile(sourcePath, 'utf-8')
    await writeFile(archivePath, content, 'utf-8')
    await rm(sourcePath, { force: true })
  }
}
