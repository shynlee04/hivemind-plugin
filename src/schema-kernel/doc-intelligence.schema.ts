import { z } from "zod"

/** Zod schema for read-only document intelligence actions. */
export const DocIntelligenceActionSchema = z.enum(["skim", "skim_directory", "read", "chunk", "search"])

/** Zod schema for the hivemind-doc tool input. */
export const DocIntelligenceInputSchema = z.object({
  action: DocIntelligenceActionSchema,
  path: z.string().min(1),
  query: z.string().min(1).optional(),
  maxCharacters: z.number().int().positive().optional(),
  maxResults: z.number().int().positive().optional(),
})

/** Inferred input type for document intelligence tool requests. */
export type DocIntelligenceSchemaInput = z.infer<typeof DocIntelligenceInputSchema>
