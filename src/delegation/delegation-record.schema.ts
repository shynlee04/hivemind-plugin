/**
 * Delegation Record Schema Validation
 *
 * Zod schema for validating DelegationHandoffRecord at parse time.
 * Ensures structural integrity before data propagates through the system.
 *
 * @module delegation/delegation-record.schema
 */

import { z } from 'zod'

/**
 * Evidence item kind enum
 */
const DELEGATION_EVIDENCE_KINDS = ['command_output', 'file_diff', 'test_report', 'trace', 'citation'] as const

/**
 * Status enum for handoff records
 */
const HANDOFF_STATUSES = ['open', 'validated', 'closed'] as const

/**
 * Zod schema for DelegationEvidenceRecord
 */
export const DelegationEvidenceRecordSchema = z.object({
  kind: z.enum(DELEGATION_EVIDENCE_KINDS).describe('Type of evidence item'),
  description: z.string().describe('Human-readable description of evidence'),
  createdAt: z.string().describe('ISO timestamp when evidence was created'),
})

/**
 * Zod schema for DelegationPacket
 */
export const DelegationPacketSchema = z.object({
  delegationId: z.string().optional().describe('Unique delegation identifier'),
  sourceSessionId: z.string().describe('Session that created the delegation'),
  targetSessionId: z.string().describe('Session that should receive the delegation'),
  sourceAgent: z.string().describe('Agent that created the delegation'),
  targetAgent: z.string().describe('Agent that should receive the delegation'),
  trajectoryId: z.string().optional().describe('Associated trajectory ID'),
  workflowId: z.string().describe('Associated workflow ID'),
  taskIds: z.array(z.string()).describe('Task IDs in scope'),
  subtaskIds: z.array(z.string()).describe('Subtask IDs in scope'),
  scope: z.string().describe('Description of delegation scope'),
  constraints: z.array(z.string()).describe('Constraints on the delegation'),
  memoryScope: z.array(z.string()).describe('Memory accessible to delegation'),
  successMetrics: z.array(z.string()).describe('Metrics for success'),
  evidenceContractId: z.string().optional().describe('Evidence contract ID'),
  requiredEvidence: z.array(
    z.object({
      kind: z.enum(DELEGATION_EVIDENCE_KINDS),
      description: z.string(),
      required: z.boolean(),
    }),
  ).describe('Required evidence items'),
  returnContract: z.string().describe('Contract for return data'),
  returnGate: z.string().optional().describe('Gate condition for return'),
  resumeTarget: z.string().optional().describe('Target for resume'),
  pressureContractId: z.string().describe('Pressure contract ID'),
})

/**
 * Zod schema for DelegationHandoffRecord
 */
export const DelegationHandoffRecordSchema = z.object({
  id: z.string().describe('Unique handoff record ID'),
  createdAt: z.string().describe('ISO timestamp of creation'),
  updatedAt: z.string().describe('ISO timestamp of last update'),
  status: z.enum(HANDOFF_STATUSES).describe('Current handoff status'),
  summary: z.string().describe('Summary of the delegation'),
  nextSteps: z.array(z.string()).describe('Recommended next steps'),
  packet: DelegationPacketSchema,
  evidence: z.array(DelegationEvidenceRecordSchema),
  closeSummary: z.string().optional().describe('Summary on close'),
})

/**
 * Validation result type
 */
export type DelegationRecordValidationResult =
  | { ok: true; value: z.infer<typeof DelegationHandoffRecordSchema> }
  | { ok: false; error: string; issues: z.ZodIssue[] }

/**
 * Validate a raw JSON object against the DelegationHandoffRecord schema
 */
export function validateDelegationRecord(
  data: unknown,
): DelegationRecordValidationResult {
  const result = DelegationHandoffRecordSchema.safeParse(data)

  if (result.success) {
    return { ok: true, value: result.data }
  }

  return {
    ok: false,
    error: 'SCHEMA_VALIDATION_FAILED',
    issues: result.error.issues,
  }
}

/**
 * Format Zod issues for diagnostic output
 */
export function formatValidationIssues(issues: z.ZodIssue[]): string {
  return issues
    .map((issue) => {
      const path = issue.path.length > 0 ? ` at ${issue.path.join('.')}` : ''
      return `${issue.message}${path}`
    })
    .join('; ')
}
