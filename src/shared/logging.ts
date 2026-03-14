/**
 * Logging utilities
 * Consistent logging across HiveMind
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LOG_PREFIX = '[HiveMind]'

function formatMessage(level: LogLevel, msg: string): string {
  return `${LOG_PREFIX} ${level.toUpperCase()}: ${msg}`
}

export const log = {
  debug: (msg: string, ...args: unknown[]): void => {
    if (process.env.HIVEMIND_DEBUG) {
      console.debug(formatMessage('debug', msg), ...args)
    }
  },
  
  info: (msg: string, ...args: unknown[]): void => {
    console.info(formatMessage('info', msg), ...args)
  },
  
  warn: (msg: string, ...args: unknown[]): void => {
    console.warn(formatMessage('warn', msg), ...args)
  },
  
  error: (msg: string, ...args: unknown[]): void => {
    console.error(formatMessage('error', msg), ...args)
  },
}
