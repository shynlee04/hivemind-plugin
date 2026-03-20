import { z } from 'zod';

export const HealthResultSchema = z.object({
  rot_level: z.enum(['DRIFT', 'POLLUTION', 'CHAIN_BREAK', 'CLEAN']),
  indicators: z.array(z.string()),
  timestamp: z.string().datetime(),
  session_id: z.string().optional(),
  parent_id: z.string().optional()
});

export type HealthResult = z.infer<typeof HealthResultSchema>;
