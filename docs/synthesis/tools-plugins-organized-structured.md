Yes, you can split your `hivemind_doc` tool into smaller sub-tools organized in a folder structure. The OpenCode tool system supports this pattern through several approaches:

## Option 1: Main Tool with Sub-Tool Delegation

Create a main `hivemind_doc` tool that delegates to specialized sub-tools:

```typescript
// tools/hivemind_doc/index.ts
import { Tool } from "@/tool/tool"
import { MarkdownTool } from "./markdown"
import { JsonTool } from "./json"
import { YamlTool } from "./yaml"
import { XmlTool } from "./xml"

export const HivemindDocTool = Tool.define("hivemind_doc", async () => {
  const subTools = {
    markdown: await MarkdownTool.init(),
    json: await JsonTool.init(),
    yaml: await YamlTool.init(),
    xml: await XmlTool.init()
  }

  return {
    description: "Unified document intelligence tool",
    parameters: z.object({
      action: z.enum(["skim", "read", "write", ...]),
      format: z.enum(["markdown", "json", "yaml", "xml"]),
      ...otherParams
    }),
    execute: async (args, ctx) => {
      const tool = subTools[args.format]
      return await tool.execute(args, ctx)
    }
  }
})
```

## Option 2: Plugin-Based Multiple Tools

Register multiple related tools through the plugin system [1](#0-0) :

```typescript
// .opencode/plugins/hivemind-doc.ts
import { type Plugin, tool } from "@opencode-ai/plugin"
import { markdownTools } from "./tools/markdown"
import { jsonTools } from "./tools/json"

export const HivemindDocPlugin: Plugin = async (ctx) => {
  return {
    tool: {
      ...markdownTools,
      ...jsonTools,
      // Register each sub-tool separately
      "hivemind_doc.read": tool({
        description: "Read document content",
        args: { /* schema */ },
        execute: async (args, context) => { /* implementation */ }
      }),
      "hivemind_doc.write": tool({
        description: "Write document content", 
        args: { /* schema */ },
        execute: async (args, context) => { /* implementation */ }
      })
    }
  }
}
```

## Option 3: Tool Registry Pattern

Follow the pattern used in `packages/opencode/src/tool/registry.ts` [2](#0-1) :

```typescript
// tools/hivemind-doc/registry.ts
export { MarkdownReadTool } from "./markdown/read"
export { MarkdownWriteTool } from "./markdown/write"
export { JsonTool } from "./json"
export { YamlTool } from "./yaml"
export { XmlTool } from "./xml"

// Main registration
export const HivemindDocTools = {
  "hivemind_doc.markdown.read": MarkdownReadTool,
  "hivemind_doc.markdown.write": MarkdownWriteTool,
  "hivemind_doc.json": JsonTool,
  // ... etc
}
```

## Recommended Structure

```
.opencode/tools/hivemind-doc/
├── index.ts              # Main tool entry point
├── markdown/
│   ├── read.ts
│   ├── write.ts
│   └── index.ts
├── json/
│   ├── crud.ts
│   └── index.ts
├── yaml/
│   ├── crud.ts
│   └── index.ts
├── xml/
│   ├── crud.ts
│   └── index.ts
└── shared/
    ├── types.ts
    ├── utils.ts
    └── validation.ts
```

The tool system's `Tool.define` function [3](#0-2)  supports async initialization, allowing you to load and configure sub-tools dynamically while maintaining a clean separation of concerns.

## Notes

- Each sub-tool should implement the `Tool.Info` interface [4](#0-3) 
- Consider using the plugin approach if you want tools to be individually discoverable
- The main tool approach provides a unified interface while keeping implementation modular
- All approaches maintain compatibility with the existing tool execution context [5](#0-4) 

Wiki pages you might want to explore:
- [Core Application (anomalyco/opencode)](/wiki/anomalyco/opencode#2)

### Citations

**File:** packages/plugin/src/tool.ts (L29-38)
```typescript
export function tool<Args extends z.ZodRawShape>(input: {
  description: string
  args: Args
  execute(args: z.infer<z.ZodObject<Args>>, context: ToolContext): Promise<string>
}) {
  return input
}
tool.schema = z

export type ToolDefinition = ReturnType<typeof tool>
```

**File:** packages/opencode/src/tool/registry.ts (L1-32)
```typescript
import { PlanExitTool } from "./plan"
import { QuestionTool } from "./question"
import { BashTool } from "./bash"
import { EditTool } from "./edit"
import { GlobTool } from "./glob"
import { GrepTool } from "./grep"
import { BatchTool } from "./batch"
import { ReadTool } from "./read"
import { TaskTool } from "./task"
import { TodoWriteTool, TodoReadTool } from "./todo"
import { WebFetchTool } from "./webfetch"
import { WriteTool } from "./write"
import { InvalidTool } from "./invalid"
import { SkillTool } from "./skill"
import type { Agent } from "../agent/agent"
import { Tool } from "./tool"
import { Instance } from "../project/instance"
import { Config } from "../config/config"
import path from "path"
import { type ToolContext as PluginToolContext, type ToolDefinition } from "@opencode-ai/plugin"
import z from "zod"
import { Plugin } from "../plugin"
import { WebSearchTool } from "./websearch"
import { CodeSearchTool } from "./codesearch"
import { Flag } from "@/flag/flag"
import { Log } from "@/util/log"
import { LspTool } from "./lsp"
import { Truncate } from "./truncation"

import { ApplyPatchTool } from "./apply_patch"
import { Glob } from "../util/glob"
import { pathToFileURL } from "url"
```

**File:** packages/opencode/src/tool/tool.ts (L16-26)
```typescript
  export type Context<M extends Metadata = Metadata> = {
    sessionID: string
    messageID: string
    agent: string
    abort: AbortSignal
    callID?: string
    extra?: { [key: string]: any }
    messages: MessageV2.WithParts[]
    metadata(input: { title?: string; metadata?: M }): void
    ask(input: Omit<PermissionNext.Request, "id" | "sessionID" | "tool">): Promise<void>
  }
```

**File:** packages/opencode/src/tool/tool.ts (L27-43)
```typescript
  export interface Info<Parameters extends z.ZodType = z.ZodType, M extends Metadata = Metadata> {
    id: string
    init: (ctx?: InitContext) => Promise<{
      description: string
      parameters: Parameters
      execute(
        args: z.infer<Parameters>,
        ctx: Context,
      ): Promise<{
        title: string
        metadata: M
        output: string
        attachments?: Omit<MessageV2.FilePart, "id" | "sessionID" | "messageID">[]
      }>
      formatValidationError?(error: z.ZodError): string
    }>
  }
```

**File:** packages/opencode/src/tool/tool.ts (L48-88)
```typescript
  export function define<Parameters extends z.ZodType, Result extends Metadata>(
    id: string,
    init: Info<Parameters, Result>["init"] | Awaited<ReturnType<Info<Parameters, Result>["init"]>>,
  ): Info<Parameters, Result> {
    return {
      id,
      init: async (initCtx) => {
        const toolInfo = init instanceof Function ? await init(initCtx) : init
        const execute = toolInfo.execute
        toolInfo.execute = async (args, ctx) => {
          try {
            toolInfo.parameters.parse(args)
          } catch (error) {
            if (error instanceof z.ZodError && toolInfo.formatValidationError) {
              throw new Error(toolInfo.formatValidationError(error), { cause: error })
            }
            throw new Error(
              `The ${id} tool was called with invalid arguments: ${error}.\nPlease rewrite the input so it satisfies the expected schema.`,
              { cause: error },
            )
          }
          const result = await execute(args, ctx)
          // skip truncation for tools that handle it themselves
          if (result.metadata.truncated !== undefined) {
            return result
          }
          const truncated = await Truncate.output(result.output, {}, initCtx?.agent)
          return {
            ...result,
            output: truncated.content,
            metadata: {
              ...result.metadata,
              truncated: truncated.truncated,
              ...(truncated.truncated && { outputPath: truncated.outputPath }),
            },
          }
        }
        return toolInfo
      },
    }
  }
```
