/**
 * Contract Store Base
 *
 * Base class with constructor, directory operations, and error detection.
 *
 * @module agent-work-contract/engine/contract-store.base
 */

import { access, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { ZodError } from 'zod'
import { AgentWorkContractSchema } from '../schema/contract.js'
import type { AgentWorkContract } from '../schema/index.js'
import { CONTRACT_DIR } from './contract-store.types.js'

/**
 * Extracts unknown top-level fields for forward compatibility.
 *
 * @param value - Raw parsed contract content
 * @returns Unknown fields not represented in the current schema
 */
function getForwardCompatFields(value: Record<string, unknown>): Record<string, unknown> {
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
function restoreForwardCompatFields(
  validated: AgentWorkContract,
  raw: Record<string, unknown>,
): AgentWorkContract {
  return {
    ...validated,
    ...getForwardCompatFields(raw),
  } as AgentWorkContract
}

/**
 * Detects missing-file errors from filesystem operations.
 *
 * @param error - Unknown thrown value
 * @returns True when the error represents a missing file
 */
function isMissingFileError(error: unknown): boolean {
  return (error as NodeJS.ErrnoException).code === 'ENOENT'
}

/**
 * Detects malformed stored-contract errors that should not abort listing.
 *
 * @param error - Unknown thrown value
 * @returns True when the stored contract cannot be parsed or validated
 */
function isMalformedContractError(error: unknown): boolean {
  return error instanceof SyntaxError || error instanceof ZodError
}

/**
 * Base class for ContractStore providing directory and error utilities.
 */
export abstract class ContractStoreBase {
  protected readonly contractDirectory: string

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
  protected async ensureDirectory(): Promise<void> {
    await mkdir(this.contractDirectory, { recursive: true })
  }

  /**
   * Gets the file path for a contract ID.
   */
  protected getContractPath(contractId: string): string {
    return join(this.contractDirectory, `${contractId}.json`)
  }

  /**
   * Checks if a contract file exists.
   */
  protected async contractExists(contractId: string): Promise<boolean> {
    try {
      await access(this.getContractPath(contractId))
      return true
    } catch {
      return false
    }
  }

  /**
   * @returns The forward compat fields extractor
   */
  protected getForwardCompatFieldsFn() {
    return getForwardCompatFields
  }

  /**
   * @returns The restore forward compat fields function
   */
  protected getRestoreForwardCompatFieldsFn() {
    return restoreForwardCompatFields
  }

  /**
   * @returns The missing file error detector
   */
  protected getIsMissingFileErrorFn() {
    return isMissingFileError
  }

  /**
   * @returns The malformed contract error detector
   */
  protected getIsMalformedContractErrorFn() {
    return isMalformedContractError
  }
}

export { getForwardCompatFields, restoreForwardCompatFields, isMissingFileError, isMalformedContractError }
