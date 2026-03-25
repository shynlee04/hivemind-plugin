/**
 * Tool execution hook handler.
 *
 * Writes a tool_invocation event to the consolidated session file on `tool.execute.after` hook.
 * Uses consolidated writer for atomic writes to single JSON file per session.
 *
 * @module hooks/tool-execution-handler
 */

import { existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import {
  addEvent,
  incrementCounter,
  initSession,
  getSessionPath,
  findSessionBySdkId,
  createSdkSymlink,
} from '../features/event-tracker/consolidated-writer.js'

/**
 * Standalone handler for tool execution events.
 * Creates a consolidated session file at `.hivemind/sessions/{semanticId}.json`
 * with the SDK session ID stored in metadata for cross-referencing.
 *
 * @param input - SDK hook input with tool name, sessionID, callID, and args
 * @param output - SDK hook output with title, output, and metadata
 * @param projectRoot - Project root directory
 */
export async function handleToolExecution(
  input: { tool: string; sessionID: string; callID: string; args: any },
  output: { title: string; output: string; metadata: any },
  projectRoot: string,
): Promise<void> {
  const sdkSessionId = input.sessionID
  if (!sdkSessionId) return

  const sessionsDir = join(projectRoot, '.hivemind', 'sessions')
  await mkdir(sessionsDir, { recursive: true })

  // Resolve semantic session ID: try by SDK ID first, then direct path, then create
  let semanticSessionId: string | null = null

  // 1. Try finding existing session by SDK session ID in metadata
  semanticSessionId = await findSessionBySdkId(sessionsDir, sdkSessionId)

  // 2. Try loading by direct path (backwards compat with SDK-named files)
  if (!semanticSessionId) {
    const directPath = getSessionPath(sessionsDir, sdkSessionId)
    if (existsSync(directPath)) {
      semanticSessionId = sdkSessionId
    }
  }

  if (!semanticSessionId) {
    // Create new session with semantic name, store SDK ID in metadata
    semanticSessionId = await initSession(sessionsDir, {
      lineage: 'hiveminder',
      purposeClass: 'implementation',
      agent: 'unknown',
      sdkSessionId,
    })

    // Create backwards-compat symlink from SDK ID to semantic file
    await createSdkSymlink(sessionsDir, sdkSessionId, semanticSessionId)
  }

  // Add tool invocation event
  await addEvent(sessionsDir, {
    sessionId: semanticSessionId,
    event: {
      turnNumber: 0,
      type: 'tool_invocation',
      importance: 'medium',
      timestamp: new Date().toISOString(),
      toolName: input.tool,
      callID: input.callID,
      data: {
        title: output.title,
        args: input.args,
      },
    } as any,
  })

  // Increment tool call counter (resilient for partial session files)
  try {
    await incrementCounter(sessionsDir, semanticSessionId, 'toolCallCount', 1)
  } catch {
    // Session file may lack counters structure — non-critical
    console.error('[tool-execution-handler] incrementCounter failed for session:', semanticSessionId)
  }
}
