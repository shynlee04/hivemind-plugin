import { tool } from "@opencode-ai/plugin"

type ToolInput = {
  description: string
  args: Record<string, unknown>
  execute: (...args: any[]) => Promise<unknown>
}

function extractRawShape(args: Record<string, unknown>) {
  const def = (args as { _zod?: { def?: { type?: string; shape?: unknown } } })._zod?.def
  if (def?.type !== "object") {
    return undefined
  }

  return typeof def.shape === "function" ? (def.shape as () => unknown)() : def.shape
}

export function safeTool<T extends ToolInput>(input: T) {
  const rawShape = extractRawShape(input.args)

  if (rawShape && typeof rawShape === "object" && !Array.isArray(rawShape)) {
    console.warn(
      `[OpenCode tool:${input.description}] args was declared as z.object(...). Expected a raw Zod shape; auto-unwrapping for TUI compatibility.`
    )

    return tool({
      ...input,
      args: rawShape as T["args"],
    })
  }

  return tool(input)
}
