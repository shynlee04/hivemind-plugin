/**
 * Contract Store Archive Operations
 *
 * List and archive operations for contract retention management.
 *
 * @module agent-work-contract/engine/contract-store.archive
 */

import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { AgentWorkContract } from '../schema/index.js'
import { isMalformedContractError, isMissingFileError } from './contract-store.base.js'
import { ContractStoreCrud } from './contract-store.crud.js'

/**
 * Archive operations for contract persistence.
 */
export class ContractStoreArchive extends ContractStoreCrud {
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
          if (isMalformedContractError(error)) {
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
      if (isMissingFileError(error)) {
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

/**
 * ContractStore - Manages contract persistence with atomic operations.
 * Composed from CRUD and archive operations.
 */
export { ContractStoreArchive as ContractStore }
