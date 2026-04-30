import { z } from "zod"

/** Zod schema for command-engine actions. */
export const CommandEngineActionSchema = z.enum([
  "discover",
  "analyze_contract",
  "render_context",
  "transform_messages",
  "route_preview",
])

/** Zod schema for command-engine message roles. */
export const CommandEngineMessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string(),
})

/** Zod schema for the `hivemind-command-engine` tool input. */
export const CommandEngineToolInputSchema = z.object({
  action: CommandEngineActionSchema,
  commandName: z.string().min(1).optional(),
  arguments: z.string().optional(),
  context: z.unknown().optional(),
  messages: z.array(CommandEngineMessageSchema).optional(),
  maxCharacters: z.number().optional(),
  score: z.number().optional(),
  tier: z.number().optional(),
})

/** Inferred command-engine tool input. */
export type CommandEngineToolInput = z.infer<typeof CommandEngineToolInputSchema>
