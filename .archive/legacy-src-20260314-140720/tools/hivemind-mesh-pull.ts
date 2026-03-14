import { extname } from "node:path"

import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"

import { ASTSurgeon, createTreeSitterFactory, LSPBridge } from "../lib/code-intel/index.js"
import { toErrorOutput, toSuccessOutput } from "../lib/tool-response.js"

function resolveLspClient(context: unknown): unknown | null {
  if (!context || typeof context !== "object") return null
  const value = context as Record<string, unknown>

  if (value.lspClient) return value.lspClient
  if (value.lsp) return value.lsp

  const sdk = value.sdk
  if (sdk && typeof sdk === "object") {
    const sdkValue = sdk as Record<string, unknown>
    if (sdkValue.lspClient) return sdkValue.lspClient
    if (sdkValue.lsp) return sdkValue.lsp
  }

  return null
}

export function createHivemindMeshPullTool(directory: string): ToolDefinition {
  return tool({
    description:
      "Combine LSP blast-radius references with AST skeleton extraction for impacted files.",
    args: {
      file_path: tool.schema.string().describe("Workspace-relative file path of the symbol location"),
      line: tool.schema.number().int().min(1).describe("1-based line number"),
      column: tool.schema.number().int().min(1).describe("1-based column number"),
      max_files: tool.schema
        .number()
        .int()
        .min(1)
        .max(25)
        .optional()
        .describe("Optional cap on skeleton extraction count (default 10)"),
    },
    async execute(args, context) {
      const filePath = args.file_path.trim()
      if (!filePath) {
        return toErrorOutput("file_path is required", "Provide a non-empty file_path")
      }

      const factory = createTreeSitterFactory()
      const lspBridge = new LSPBridge(resolveLspClient(context))
      const maxFiles = args.max_files ?? 10

      try {
        const references = await lspBridge.getBlastRadius(filePath, args.line, args.column)
        const fileSet = new Set<string>([filePath])

        for (const reference of references) {
          if (fileSet.size >= maxFiles) break
          if (reference.filePath) {
            fileSet.add(reference.filePath)
          }
        }

        for (const target of fileSet) {
          const extension = extname(target)
          if (extension) {
            await factory.preloadLanguageForExtension(extension)
          }
        }

        const treeSitter = await factory.getInstance()
        const surgeon = new ASTSurgeon(directory, treeSitter)
        const skeletons = []

        for (const target of fileSet) {
          const skeleton = await surgeon.extractSkeleton(target)
          if (skeleton) {
            skeletons.push(skeleton)
          }
        }

        return toSuccessOutput(
          `Pulled mesh for ${filePath}: ${references.length} references, ${skeletons.length} skeletons`,
          undefined,
          {
            filePath,
            line: args.line,
            column: args.column,
            lspAvailable: lspBridge.isAvailable(),
            references,
            skeletons,
          }
        )
      } catch (err) {
        return toErrorOutput(
          `Mesh pull failed: ${err instanceof Error ? err.message : String(err)}`
        )
      } finally {
        factory.dispose()
      }
    },
  })
}
