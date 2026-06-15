/**
 * Reads delegation data from hierarchy-manifest.json (session-tracker format).
 *
 * REQ-C6-02: Implements DelegationStatusReader for the new persistence format.
 * Validates entries with Zod schemas before constructing Delegation objects.
 *
 * @module tools/delegation/readers/session-tracker-reader
 */

import { readFile } from "node:fs/promises"
import type { Delegation } from "../../../coordination/delegation/types.js"
import type { DelegationStatusReader } from "./types.js"
import { HierarchyManifestChildSchema, hierarchyChildToDelegation, type HierarchyManifestChildValidated } from "./types.js"

export class SessionTrackerStatusReader implements DelegationStatusReader {
  async readChildren(parentSessionId: string, projectRoot: string): Promise<Delegation[]> {
    try {
      // Find the root session that contains hierarchy-manifest.json
      const manifestPath = `${projectRoot}/.hivemind/session-tracker`
      const entries = await this.listFiles(manifestPath)
      if (!entries) return []

      for (const entry of entries) {
        const manifestFile = `${manifestPath}/${entry}/hierarchy-manifest.json`
        try {
          const raw = await readFile(manifestFile, "utf-8")
          const manifest = JSON.parse(raw)
          const allChildren = manifest.children ?? {}
          const children: Delegation[] = []

          for (const [childSessionId, child] of Object.entries(allChildren)) {
            const parsed = HierarchyManifestChildSchema.safeParse(child)
            if (!parsed.success) continue
            const childMeta = parsed.data as HierarchyManifestChildValidated
            if (childMeta.parentSessionID === parentSessionId) {
              children.push(hierarchyChildToDelegation(childSessionId, childMeta, projectRoot))
            }
          }

          if (children.length > 0) return children
        } catch {
          // manifest file doesn't exist or is invalid — try next
        }
      }
      return []
    } catch {
      return []
    }
  }

  async readDelegation(delegationId: string, projectRoot: string): Promise<Delegation | null> {
    try {
      const manifestPath = `${projectRoot}/.hivemind/session-tracker`
      const entries = await this.listFiles(manifestPath)
      if (!entries) return null

      for (const entry of entries) {
        const manifestFile = `${manifestPath}/${entry}/hierarchy-manifest.json`
        try {
          const raw = await readFile(manifestFile, "utf-8")
          const manifest = JSON.parse(raw)
          const allChildren = manifest.children ?? {}
          const child = allChildren[delegationId]
          if (!child) continue

          const parsed = HierarchyManifestChildSchema.safeParse(child)
          if (!parsed.success) continue
          const childMeta = parsed.data as HierarchyManifestChildValidated
          return hierarchyChildToDelegation(delegationId, childMeta, projectRoot)
        } catch {
          // manifest file doesn't exist or is invalid — try next
        }
      }
      return null
    } catch {
      return null
    }
  }

  private async listFiles(dirPath: string): Promise<string[] | null> {
    try {
      const { readdir } = await import("node:fs/promises")
      return await readdir(dirPath)
    } catch {
      return null
    }
  }
}
