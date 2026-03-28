import { existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'

import type { PurposeClass } from '../event-tracker/types.js'
import {
  createSdkSymlink,
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
  const sessionsDir = join(projectRoot, '.hivemind', 'sessions')
  const journeyEventsDir = join(sessionsDir, 'journey-events')

  return {
    async resolve(sdkSessionId: string): Promise<string | null> {
      const existing = await findSessionBySdkId(sessionsDir, sdkSessionId)
      if (existing) {
        return existing
      }

      const directPath = getSessionPath(sessionsDir, sdkSessionId)
      if (!existsSync(directPath)) {
        return null
      }

      try {
        const session = await loadSession(sessionsDir, sdkSessionId)
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

      const sessionId = await initSession(sessionsDir, {
        sdkSessionId,
        lineage: defaults.lineage,
        purposeClass: defaults.purposeClass,
        agent: defaults.agent,
        parentSessionId: defaults.parentSessionId,
      })

      await createSdkSymlink(sessionsDir, sdkSessionId, sessionId)
      return sessionId
    },

    getSessionsDir(): string {
      return sessionsDir
    },
  }
}
