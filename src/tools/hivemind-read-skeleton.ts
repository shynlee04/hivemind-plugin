import { extname } from "node:path"

import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"

import { ASTSurgeon, createTreeSitterFactory } from "../lib/code-intel/index.js"
import { toErrorOutput, toSuccessOutput } from "../lib/tool-response.js"

export function createHivemindReadSkeletonTool(directory: string): ToolDefinition {
  return tool({
    description:
      "Extract AST skeleton for a source file. Returns imports, exports, signatures, and token counts.",
    args: {
      file_path: tool.schema
        .string()
        .describe("Workspace-relative file path to analyze (for example: src/lib/foo.ts)"),
    },
    async execute(args, _context) {
      const filePath = args.file_path.trim()
      if (!filePath) {
        return toErrorOutput("file_path is required", "Provide a non-empty file_path")
      }

      const factory = createTreeSitterFactory()

      try {
        const extension = extname(filePath)
        if (extension) {
          await factory.preloadLanguageForExtension(extension)
        }

        const treeSitter = await factory.getInstance()
        const surgeon = new ASTSurgeon(directory, treeSitter)
        const skeleton = await surgeon.extractSkeleton(filePath)

        if (!skeleton) {
          return toErrorOutput(`Unable to extract skeleton for: ${filePath}`)
        }

        return toSuccessOutput(`Extracted skeleton for ${filePath}`, undefined, {
          path: skeleton.path,
          imports: skeleton.imports,
          exports: skeleton.exports,
          signatures: skeleton.signatures,
          compressedView: skeleton.compressedView,
          originalTokens: skeleton.originalTokens,
          skeletonTokens: skeleton.skeletonTokens,
        })
      } catch (err) {
        return toErrorOutput(
          `Skeleton extraction failed: ${err instanceof Error ? err.message : String(err)}`
        )
      } finally {
        factory.dispose()
      }
    },
  })
}
