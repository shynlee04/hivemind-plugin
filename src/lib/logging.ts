/**
 * TUI-safe logging
 * File-based logging only - never use console.log
 */

import { createWriteStream } from "fs";
import { mkdir } from "fs/promises";
import { dirname } from "path";

export interface Logger {
  debug: (message: string) => Promise<void>;
  info: (message: string) => Promise<void>;
  warn: (message: string) => Promise<void>;
  error: (message: string) => Promise<void>;
}

export async function createLogger(
  logDir: string,
  service: string
): Promise<Logger> {
  const logFile = `${logDir}/${service}.log`;
  
  // Ensure log directory exists
  try {
    await mkdir(dirname(logFile), { recursive: true });
  } catch {
    // Directory may already exist
  }
  
  const stream = createWriteStream(logFile, { flags: 'a' });

  // Handle stream errors silently
  stream.on('error', () => {
    // Fail silently - logging should never break the application
  });

  async function log(level: string, message: string): Promise<void> {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
    try {
      if (!stream.write(line)) {
        await new Promise<void>((resolve) => stream.once('drain', resolve));
      }
    } catch {
      // Fail silently - logging should never break the application
    }
  }
  
  return {
    debug: (msg) => log("debug", msg),
    info: (msg) => log("info", msg),
    warn: (msg) => log("warn", msg),
    error: (msg) => log("error", msg),
  };
}

// No-op logger for when logging is disabled
export const noopLogger: Logger = {
  debug: async () => {},
  info: async () => {},
  warn: async () => {},
  error: async () => {},
};
