/**
 * Helper functions for the create-contract tool.
 *
 * @module create-contract-tool/helpers
 */

import { randomUUID } from 'node:crypto'

import type { ToolContext } from '@opencode-ai/plugin/tool'

import { HIVEMIND_AGENT_WORK_CREATE_CONTRACT_TOOL_ID } from './create-contract-tool.schema.js'

/**
 * Resolves the effective project root directory.
 *
 * @param projectRoot - The configured project root path
 * @param context - The tool execution context
 * @returns The resolved project root (worktree if available, otherwise configured root)
 */
export function resolveProjectRoot(projectRoot: string, context: ToolContext): string {
  return context.worktree && context.worktree.length > 0 ? context.worktree : projectRoot
}

/**
 * Creates metadata for tool execution tracking.
 *
 * @param title - Display title for the operation
 * @param context - The tool execution context
 * @param action - The action being performed ('create' or 'update')
 * @param contractId - The contract identifier
 * @returns Object containing title and metadata for tracking
 */
export function createMetadata(
  title: string,
  context: ToolContext,
  action: 'create' | 'update',
  contractId: string,
): { title: string; metadata: Record<string, unknown> } {
  return {
    title,
    metadata: {
      toolId: HIVEMIND_AGENT_WORK_CREATE_CONTRACT_TOOL_ID,
      action,
      contractId,
      sessionID: context.sessionID,
      agent: context.agent,
      directory: context.directory,
      worktree: context.worktree,
    },
  }
}

/**
 * Requests user permission to edit the contract file.
 *
 * @param context - The tool execution context
 * @param action - The action being performed ('create' or 'update')
 * @param contractId - The contract identifier
 */
export async function askToEditContract(
  context: ToolContext,
  action: 'create' | 'update',
  contractId: string,
): Promise<void> {
  await context.ask({
    permission: 'edit',
    patterns: [`.hivemind/agent-work-contract/${contractId}.json`],
    always: ['*'],
    metadata: {
      toolId: HIVEMIND_AGENT_WORK_CREATE_CONTRACT_TOOL_ID,
      action,
      contractId,
      sessionID: context.sessionID,
      agent: context.agent,
      directory: context.directory,
      worktree: context.worktree,
    },
  })
}

/**
 * Generates a new contract ID for create operations.
 *
 * @param sessionID - The session identifier to base the contract ID on
 * @returns A unique contract identifier string
 */
export function buildCreateContractId(sessionID: string): string {
  const sanitizedSessionId = sessionID.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 48) || 'session'
  return `awc-${sanitizedSessionId}-${Date.now()}-${randomUUID()}`
}
