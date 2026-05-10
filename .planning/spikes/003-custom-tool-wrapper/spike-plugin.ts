import type { Plugin } from "@opencode-ai/plugin";
import { tool } from "@opencode-ai/plugin";

const plugin: Plugin = async (input) => {
  return {
    tool: {
      "spike_execute_slash_command": tool({
        description: "Executes an OpenCode slash command on the active session.",
        args: {
          command: tool.schema.string().describe("The command name without slash, e.g. test-echo"),
          arguments: tool.schema.string().describe("Arguments string")
        },
        async execute(args, ctx) {
          ctx.metadata({ title: `Executing /${args.command}` });
          
          try {
            const res = await input.client.session.command({
              path: { id: ctx.sessionID },
              body: {
                command: args.command,
                arguments: args.arguments,
                agent: ctx.agent
              }
            });
            
            return {
              output: `Command /${args.command} executed. Result ID: ${res.data?.info?.id || 'unknown'}.`,
              metadata: { responseId: res.data?.info?.id }
            };
          } catch (e: any) {
            return `Failed to execute: ${e?.message || e}`;
          }
        }
      })
    }
  };
};

export default { server: plugin };
