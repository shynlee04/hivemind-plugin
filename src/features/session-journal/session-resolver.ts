import { existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'

import { getJourneyEventsPath, getSessionsDir, truncateSessionId } from '../event-tracker/paths.js'
import type { PurposeClass } from '../event-tracker/types.js'
import {
  findSessionBySdkId,
  getSessionPath,
  initSession,
  loadSession,
} from '../event-tracker/consolidated-writer.js'

export interface SessionDefaults {
  lineage: 'hivefiver' | 'hiveminder'
  purposeClass: PurposeClass
  agent: string
  parentSessionId?: string | null
}

export interface SessionResolver {
  resolve(sdkSessionId: string): Promise<string | null>
  resolveOrCreate(sdkSessionId: string, defaults: SessionDefaults): Promise<string>
  getSessionsDir(): string
}

export function createSessionResolver(projectRoot: string): SessionResolver {
  const sessionsDir = getSessionsDir(projectRoot)
  const journeyEventsDir = getJourneyEventsPath(projectRoot)

  return {
    async resolve(sdkSessionId: string): Promise<string | null> {
      const truncatedId = truncateSessionId(sdkSessionId)
      const existing = await findSessionBySdkId(sessionsDir, truncatedId)
      if (existing) {
        return existing
      }

      const directPath = getSessionPath(sessionsDir, truncatedId)
      if (!existsSync(directPath)) {
        return null
      }

      try {
        const session = await loadSession(sessionsDir, truncatedId)
        return session.sessionId
      } catch {
        return null
      }
    },

    async resolveOrCreate(sdkSessionId: string, defaults: SessionDefaults): Promise<string> {
      await mkdir(journeyEventsDir, { recursive: true })

      const existing = await this.resolve(sdkSessionId)
      if (existing) {
        return existing
      }

      return initSession(sessionsDir, {
        sessionId: truncateSessionId(sdkSessionId),
        lineage: defaults.lineage,
        purposeClass: defaults.purposeClass,
        agent: defaults.agent,
        parentSessionId: defaults.parentSessionId,
      })
    },

    getSessionsDir(): string {
      return sessionsDir
    },
  }
}
