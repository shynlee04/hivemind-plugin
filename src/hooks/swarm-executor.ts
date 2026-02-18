/**
 * Swarm Executor — SDK-backed swarm spawning.
 *
 * Implements SwarmSdkExecutor interface for actual sub-agent spawning.
 * Lives in hooks/ to respect SDK boundary (lib/ is SDK-free).
 *
 * PATTERN: lib/ provides pure logic, hooks/ provides SDK materialization.
 */

import type { OpencodeClient } from "@opencode-ai/sdk"
import type { SwarmSdkExecutor } from "../lib/session-swarm.js"
import { createLogger, noopLogger } from "../lib/logging.js"
import { getEffectivePaths } from "../lib/paths.js"

// Lazily initialized logger
let loggerPromise: Promise<import("../lib/logging.js").Logger> | null = null

function getLogger(): Promise<import("../lib/logging.js").Logger> {
  if (loggerPromise) {
    return loggerPromise
  }
  
  loggerPromise = (async () => {
    try {
      // Get project root (current working directory)
      const projectRoot = process.cwd()
      const paths = getEffectivePaths(projectRoot)
      return await createLogger(paths.logsDir, "swarm-executor")
    } catch {
      return noopLogger
    }
  })()
  
  return loggerPromise
}

/**
 * Create an SDK-backed swarm executor.
 *
 * @param client - The OpenCode SDK client
 * @returns A SwarmSdkExecutor that can create sessions and send prompts
 */
export function createSwarmExecutor(client: OpencodeClient): SwarmSdkExecutor {
  return {
    async createSession(options: {
      title: string
      parentID: string
    }): Promise<{ id: string } | null> {
      try {
        const created = await client.session.create({
          body: {
            title: options.title,
            parentID: options.parentID,
          },
        })

        if (created?.data?.id) {
          return { id: created.data.id }
        }
        return null
      } catch (err) {
        const logger = await getLogger()
        logger.error(`[swarm-executor] Failed to create session: ${err instanceof Error ? err.message : String(err)}`)
        return null
      }
    },

    async sendPrompt(options: {
      sessionId: string
      noReply: boolean
      parts: Array<{ type: "text"; text: string }>
    }): Promise<void> {
      await client.session.prompt({
        path: { id: options.sessionId },
        body: {
          noReply: options.noReply,
          parts: options.parts,
        },
      })
    },
  }
}

/**
 * Get a swarm executor if SDK client is available.
 *
 * @returns SwarmSdkExecutor or null if SDK not available
 */
export function getSwarmExecutor(): SwarmSdkExecutor | null {
  // Import lazily to avoid circular deps
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { getClient } = require("./sdk-context.js")
  const client = getClient()

  if (!client) {
    return null
  }

  return createSwarmExecutor(client)
}
