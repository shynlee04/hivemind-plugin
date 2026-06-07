/**
 * DelegationStatusReader interface and Zod schemas for persistence validation.
 *
 * REQ-C6-02: Provides runtime type safety at persistence boundaries.
 * Two implementations: SessionTrackerStatusReader (new format) and
 * LegacyPersistenceStatusReader (old format).
 *
 * @module tools/delegation/readers/types
 */

import { z } from "zod"
import type { Delegation } from "../../../coordination/delegation/types.js"
import type { DelegationStatus, DelegationTerminalKind } from "../../../coordination/delegation/types.js"

// ---------------------------------------------------------------------------
// DelegationStatusReader interface
// ---------------------------------------------------------------------------

/**
 * Interface for reading delegation data from different persistence formats.
 *
 * Both implementations read from project-local JSON files and return
 * Delegation[] arrays for consumption by the delegation-status tool.
 */
export interface DelegationStatusReader {
  /**
   * Read all child delegations for a parent session.
   *
   * @param parentSessionId - The parent session ID to search for children.
   * @param projectRoot - The project root path.
   * @returns Array of Delegation records for matching children.
   */
  readChildren(parentSessionId: string, projectRoot: string): Promise<Delegation[]>

  /**
   * Read a single delegation by ID.
   *
   * @param delegationId - The delegation ID to look up.
   * @param projectRoot - The project root path.
   * @returns The Delegation record, or null if not found.
   */
  readDelegation(delegationId: string, projectRoot: string): Promise<Delegation | null>
}

// ---------------------------------------------------------------------------
// Zod schemas for hierarchy-manifest.json format
// ---------------------------------------------------------------------------

/**
 * Zod schema for hierarchy-manifest.json children entries.
 *
 * Validates the runtime shape of each child entry in the manifest's
 * `children` record. Used by SessionTrackerStatusReader to validate
 * parsed JSON before constructing Delegation objects.
 */
export const HierarchyManifestChildSchema = z.object({
  parentSessionID: z.string(),
  status: z.string(),
  subagentType: z.string().optional(),
  delegationDepth: z.number().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
  childFile: z.string().optional(),
  rootMainSessionID: z.string().optional(),
  delegatedBy: z.string().optional(),
  turnCount: z.number().optional(),
  // optional discriminator (R2 mitigation — use
  // .optional() so existing manifest entries without the field still parse).
  // Source: src/features/session-tracker/types.ts DelegationType
  delegationType: z.enum(["async-spawn", "native-task", "slash-cmd", "sdk-direct"]).optional(),
})

export type HierarchyManifestChildValidated = z.infer<typeof HierarchyManifestChildSchema>

// ---------------------------------------------------------------------------
// Zod schemas for delegations.json (legacy) format
// ---------------------------------------------------------------------------

/**
 * Zod schema for delegations.json entries.
 *
 * Validates the runtime shape of each delegation record in the legacy
 * persistence format. Used by LegacyPersistenceStatusReader to validate
 * parsed JSON before constructing Delegation objects.
 */
export const LegacyDelegationRecordSchema = z.object({
  id: z.string(),
  parentSessionId: z.string().optional(),
  childSessionId: z.string().optional(),
  agent: z.string().optional(),
  status: z.string(),
  createdAt: z.number().optional(),
  completedAt: z.number().optional(),
  result: z.string().optional(),
  error: z.string().optional(),
  executionMode: z.string().optional(),
  surface: z.string().optional(),
  recoveryGuarantee: z.string().optional(),
  workingDirectory: z.string().optional(),
  nestingDepth: z.number().optional(),
  terminalKind: z.string().optional(),
  terminationSignal: z.string().optional(),
  explicitCancellation: z.boolean().optional(),
  messageCount: z.number().optional(),
  toolCallCount: z.number().optional(),
  actionCount: z.number().optional(),
  finalMessageExcerpt: z.string().optional(),
})

export type LegacyDelegationRecordValidated = z.infer<typeof LegacyDelegationRecordSchema>

// ---------------------------------------------------------------------------
// Helper: Convert validated hierarchy child to Delegation
// ---------------------------------------------------------------------------

/**
 * Converts a validated HierarchyManifestChild to a Delegation record.
 *
 * @param childSessionId - The child session ID (key in the children map).
 * @param child - The validated child entry from the manifest.
 * @param projectRoot - The project root path.
 * @returns A Delegation record suitable for the delegation-status tool.
 */
export function hierarchyChildToDelegation(
  childSessionId: string,
  child: HierarchyManifestChildValidated,
  projectRoot: string,
): Delegation {
  return {
    id: childSessionId,
    parentSessionId: child.parentSessionID,
    childSessionId,
    agent: child.subagentType ?? "unknown",
    status: child.status as DelegationStatus,
    createdAt: new Date(child.createdAt).getTime(),
    completedAt: child.status !== "active" && child.updatedAt ? new Date(child.updatedAt).getTime() : undefined,
    executionMode: "sdk",
    surface: "agent-delegation",
    recoveryGuarantee: "resumable",
    workingDirectory: projectRoot,
    ptySessionId: undefined,
    fallbackReason: undefined,
    queueKey: "",
    nestingDepth: child.delegationDepth ?? 1,
    terminalKind: child.status !== "active" ? (child.status as DelegationTerminalKind) : undefined,
    terminationSignal: undefined,
    explicitCancellation: false,
    lastMessageCount: 0,
    stablePollCount: 0,
    // (2026-06-04, MVD §12.4 read-side enrichment): propagate
    // delegationType from the validated child record to the resulting
    // Delegation. The Zod schema uses z.string() (intentionally — R2
    // mitigation allows any string for forward compat) so we cast to
    // the 4-literal union via unknown. The set of valid values is
    // defined in DelegationType (src/features/session-tracker/types.ts).
    delegationType: child.delegationType as Delegation["delegationType"],
  }
}

/**
 * Converts a validated legacy delegation record to a Delegation record.
 *
 * @param record - The validated legacy record from delegations.json.
 * @param projectRoot - The project root path.
 * @returns A Delegation record suitable for the delegation-status tool.
 */
export function legacyRecordToDelegation(
  record: LegacyDelegationRecordValidated,
  projectRoot: string,
): Delegation {
  return {
    id: record.id,
    parentSessionId: record.parentSessionId ?? "",
    childSessionId: record.childSessionId ?? record.id,
    agent: record.agent ?? "unknown",
    status: record.status as DelegationStatus,
    result: record.result,
    error: record.error,
    createdAt: record.createdAt ?? Date.now(),
    completedAt: record.completedAt,
    executionMode: (record.executionMode as "sdk" | "pty" | "headless") ?? "sdk",
    surface: record.surface as import("../../../coordination/delegation/types.js").DelegationSurface | undefined,
    recoveryGuarantee: record.recoveryGuarantee as import("../../../coordination/delegation/types.js").DelegationRecoveryGuarantee | undefined,
    workingDirectory: record.workingDirectory ?? projectRoot,
    ptySessionId: undefined,
    fallbackReason: undefined,
    queueKey: "",
    nestingDepth: record.nestingDepth ?? 1,
    terminalKind: record.terminalKind as DelegationTerminalKind | undefined,
    terminationSignal: record.terminationSignal,
    explicitCancellation: record.explicitCancellation ?? false,
    lastMessageCount: 0,
    stablePollCount: 0,
    messageCount: record.messageCount,
    toolCallCount: record.toolCallCount,
    actionCount: record.actionCount,
    finalMessageExcerpt: record.finalMessageExcerpt,
  }
}
