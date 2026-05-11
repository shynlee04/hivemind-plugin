import { tool } from "@opencode-ai/plugin"
import type { PluginInput, ToolDefinition } from "@opencode-ai/plugin"

/**
 * Creates the execute-slash-command tool.
 * 
 * This tool allows an agent to programmatically dispatch a slash command
 * (e.g., built-in commands or custom `.opencode/commands/*.md` commands)
 * to the active session. The command will execute natively, and any workflow,
 * agent routing, or primitive stacking defined in the command will trigger.
 */
export const createExecuteSlashCommandTool = (client: PluginInput["client"]): ToolDefinition => {
  return tool({
    description: "Executes an OpenCode slash command on the active session. This is equivalent to a user typing '/command arg' in the TUI.",
    args: {
      command: tool.schema.string().describe("The command name without the leading slash (e.g., 'gsd-stats', 'hf-create')"),
      arguments: tool.schema.string().optional().describe("Optional arguments string to pass to the command (e.g., 'my-new-skill')")
    },
    async execute(args, ctx) {
      ctx.metadata({ title: `Executing /${args.command}` })
      
      try {
        const res = await client.session.command({
          path: { id: ctx.sessionID },
          body: {
            command: args.command,
            arguments: args.arguments || "",
            agent: ctx.agent
          }
        })
        
        return {
          output: `Successfully executed /${args.command}. Response ID: ${res.data?.info?.id || 'unknown'}`,
          metadata: { responseId: res.data?.info?.id, command: args.command }
        }
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error)
        return `Failed to execute command /${args.command}: ${msg}`
      }
    }
  })
}
