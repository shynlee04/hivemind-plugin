import { z } from 'zod'

export const runtimeRecentEventSchema = z.object({
  eventKind: z.string(),
  source: z.string(),
  recordedAt: z.string(),
  summary: z.string(),
})

export type RuntimeRecentEvent = z.infer<typeof runtimeRecentEventSchema>
