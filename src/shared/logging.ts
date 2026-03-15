/**
 * Logging utilities
 * Consistent logging across HiveMind — augmented with SDK client.app.log() when available.
 *
 * Authority: src/shared/AGENTS.md (sdk-first principle)
 */

import { withClient } from '../hooks/sdk-context.js'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LOG_PREFIX = '[HiveMind]'

function formatMessage(level: LogLevel, msg: string): string {
  return `${LOG_PREFIX} ${level.toUpperCase()}: ${msg}`
}

/**
 * Send a log message to the SDK app log if the client is available.
 * Falls back silently — SDK logging is best-effort.
 */
async function sendToSdkLog(level: LogLevel, msg: string): Promise<void> {
  await withClient(async (client) => {
    await client.app.log({
      body: {
        service: 'hivemind',
        level,
        message: formatMessage(level, msg),
      },
    })
  })
}

export const log = {
  debug: (msg: string, ...args: unknown[]): void => {
    if (process.env.HIVEMIND_DEBUG) {
      console.debug(formatMessage('debug', msg), ...args)
      void sendToSdkLog('debug', msg)
    }
  },
  
  info: (msg: string, ...args: unknown[]): void => {
    console.info(formatMessage('info', msg), ...args)
    void sendToSdkLog('info', msg)
  },
  
  warn: (msg: string, ...args: unknown[]): void => {
    console.warn(formatMessage('warn', msg), ...args)
    void sendToSdkLog('warn', msg)
  },
  
  error: (msg: string, ...args: unknown[]): void => {
    console.error(formatMessage('error', msg), ...args)
    void sendToSdkLog('error', msg)
  },
}
