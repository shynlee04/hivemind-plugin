import { appendFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'

import { getErrorLogsPath } from '../event-tracker/paths.js'

export interface ErrorLogEntry {
  sessionId: string
  timestamp: string
  level: 'error' | 'warn'
  message: string
  context?: Record<string, unknown>
}

export async function appendError(projectRoot: string, entry: ErrorLogEntry): Promise<void> {
  const errorLogsDir = getErrorLogsPath(projectRoot)
  await mkdir(errorLogsDir, { recursive: true })
  const logFile = join(errorLogsDir, `${entry.sessionId}.log`)
  const line = `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}${entry.context ? ` ${JSON.stringify(entry.context)}` : ''}\n`
  await appendFile(logFile, line, 'utf-8')
}
