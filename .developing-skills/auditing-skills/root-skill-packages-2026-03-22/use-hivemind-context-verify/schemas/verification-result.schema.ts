import { z } from 'zod';

export const GateResultSchema = z.object({
  passed: z.boolean(),
  evidence: z.string(),
  command: z.string(),
  exit_code: z.number().optional()
});

export const VerificationResultSchema = z.object({
  build: GateResultSchema,
  test: GateResultSchema,
  git: GateResultSchema,
  overall: z.enum(['PASS', 'FAIL']),
  blocked: z.boolean(),
  timestamp: z.string().datetime()
});

export type GateResult = z.infer<typeof GateResultSchema>;
export type VerificationResult = z.infer<typeof VerificationResultSchema>;
