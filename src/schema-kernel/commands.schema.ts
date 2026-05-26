import { z } from "zod"

export const ExecuteSlashCommandSchema = z.object({
  command: z.string().min(1).max(200).regex(/^[a-z][a-z0-9-]*$/).describe("Command name (lowercase alphanumeric + hyphens)"),
  arguments: z.string().max(10000).optional().default(""),
  agent: z.string().regex(/^[a-z][a-z0-9-]*$/).optional().describe("Agent override name"),
  model: z.string().regex(/^[a-zA-Z0-9]+\/[a-zA-Z0-9._-]+$/).optional().describe("Model override (provider/modelID format)"),
  subtask: z.boolean().optional().default(false),
  commandSource: z.enum(["user", "agent", "system"]).optional().default("user"),
  trackExecution: z.boolean().optional().default(true),
  parentSessionID: z.string().optional(),
})

export type ExecuteSlashCommandInput = z.infer<typeof ExecuteSlashCommandSchema>
