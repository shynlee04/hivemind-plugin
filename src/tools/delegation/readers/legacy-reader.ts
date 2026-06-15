/**
 * Reads delegation data from delegations.json (legacy persistence format).
 *
 * REQ-C6-02: Implements DelegationStatusReader for the old persistence format.
 * Validates entries with Zod schemas before constructing Delegation objects.
 *
 * @module tools/delegation/readers/legacy-reader
 */

import { readFile } from "node:fs/promises"
import { join } from "node:path"
import type { Delegation } from "../../../coordination/delegation/types.js"
import type { DelegationStatusReader } from "./types.js"
import { LegacyDelegationRecordSchema, legacyRecordToDelegation, type LegacyDelegationRecordValidated } from "./types.js"

export class LegacyPersistenceStatusReader implements DelegationStatusReader {
  async readChildren(parentSessionId: string, projectRoot: string): Promise<Delegation[]> {
    try {
      const delegations = await this.readDelegationsFile(projectRoot)
      return delegations
        .filter((d) => d.parentSessionId === parentSessionId)
        .map((d) => legacyRecordToDelegation(d, projectRoot))
    } catch {
      return []
    }
  }

  async readDelegation(delegationId: string, projectRoot: string): Promise<Delegation | null> {
    try {
      const delegations = await this.readDelegationsFile(projectRoot)
      const match = delegations.find(
        (d) => d.id === delegationId || d.childSessionId === delegationId,
      )
      return match ? legacyRecordToDelegation(match, projectRoot) : null
    } catch {
      return null
    }
  }

  private async readDelegationsFile(projectRoot: string): Promise<LegacyDelegationRecordValidated[]> {
    const filePath = join(projectRoot, ".hivemind", "state", "delegations.json")
    try {
      const raw = await readFile(filePath, "utf-8")
      const records = JSON.parse(raw)
      if (!Array.isArray(records)) return []

      const validated: LegacyDelegationRecordValidated[] = []
      for (const record of records) {
        const parsed = LegacyDelegationRecordSchema.safeParse(record)
        if (parsed.success) {
          validated.push(parsed.data)
        }
      }
      return validated
    } catch {
      return []
    }
  }
}
