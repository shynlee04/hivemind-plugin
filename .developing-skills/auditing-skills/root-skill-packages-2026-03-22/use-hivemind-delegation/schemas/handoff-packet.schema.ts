import { z } from 'zod';

export const ParentContextSchema = z.object({
  session_id: z.string(),
  link_timestamp: z.string().datetime()
});

export const ResultContractSchema = z.object({
  format: z.enum(['json', 'text', 'structured']),
  required_fields: z.array(z.string()),
  success_criteria: z.string().optional()
});

export const DelegationChainSchema = z.object({
  delegator: z.string(),
  executor: z.string(),
  created_at: z.string().datetime()
});

export const HandoffPacketSchema = z.object({
  version: z.string(),
  scope: z.string(),
  parent_context: ParentContextSchema,
  result_contract: ResultContractSchema,
  delegation_chain: DelegationChainSchema,
  expires_at: z.string().datetime().optional()
});

export type HandoffPacket = z.infer<typeof HandoffPacketSchema>;
