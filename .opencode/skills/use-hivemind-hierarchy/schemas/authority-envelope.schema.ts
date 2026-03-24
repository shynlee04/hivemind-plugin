import { z } from 'zod';

export const AuthorityEnvelopeSchema = z.object({
  role: z.enum(['orchestrator', 'executor', 'verifier', 'researcher']),
  permissions: z.array(z.string()),
  constraints: z.array(z.string()),
  granted_by: z.string(),
  granted_at: z.string().datetime(),
  expires_at: z.string().datetime().optional()
});

export const RoleBoundarySchema = z.object({
  role: z.enum(['orchestrator', 'executor', 'verifier', 'researcher']),
  can: z.array(z.string()),
  cannot: z.array(z.string()),
  active: z.boolean(),
  validated_at: z.string().datetime().optional()
});

export const AuthorityValidationSchema = z.object({
  is_compliant: z.boolean(),
  role: z.string(),
  action: z.string(),
  violations: z.array(z.string()),
  allowed: z.array(z.string()),
  checked_at: z.string().datetime()
});

export type AuthorityEnvelope = z.infer<typeof AuthorityEnvelopeSchema>;
export type RoleBoundary = z.infer<typeof RoleBoundarySchema>;
export type AuthorityValidation = z.infer<typeof AuthorityValidationSchema>;
