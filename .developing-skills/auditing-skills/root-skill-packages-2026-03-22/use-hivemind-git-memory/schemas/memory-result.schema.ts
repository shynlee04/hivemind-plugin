import { z } from 'zod';

export const MemoryAnchorSchema = z.object({
  hash: z.string(),
  subject: z.string(),
  date: z.string().datetime(),
  intent: z.string().optional(),
  session_id: z.string().optional()
});

export const MemoryResultSchema = z.object({
  memory: z.array(MemoryAnchorSchema),
  query: z.string(),
  count: z.number(),
  retrieved_at: z.string().datetime()
});

export const EncodeResultSchema = z.object({
  hash: z.string(),
  intent: z.string(),
  session_id: z.string(),
  marker_file: z.string(),
  encoded_at: z.string().datetime()
});

export type MemoryAnchor = z.infer<typeof MemoryAnchorSchema>;
export type MemoryResult = z.infer<typeof MemoryResultSchema>;
export type EncodeResult = z.infer<typeof EncodeResultSchema>;
