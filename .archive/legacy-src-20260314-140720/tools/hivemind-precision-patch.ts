import { extname } from "node:path"

import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"

import { ASTSurgeon, createTreeSitterFactory } from "../lib/code-intel/index.js"
import { toErrorOutput, toSuccessOutput } from "../lib/tool-response.js"

export function createHivemindPrecisionPatchTool(directory: string): ToolDefinition {
  return tool({
    description:
      "Patch a single symbol by name using AST byte ranges. Replaces exactly the matched symbol range.",
    args: {
      file_path: tool.schema.string().describe("Workspace-relative file path containing the symbol"),
      symbol_name: tool.schema.string().describe("Exact symbol name to replace"),
      new_code: tool.schema.string().describe("Replacement code for the matched symbol"),
    },
    async execute(args, _context) {
      const filePath = args.file_path.trim()
      const symbolName = args.symbol_name.trim()

      if (!filePath) {
        return toErrorOutput("file_path is required", "Provide a non-empty file_path")
      }
      if (!symbolName) {
        return toErrorOutput("symbol_name is required", "Provide a non-empty symbol_name")
      }

      const factory = createTreeSitterFactory()

      try {
        const extension = extname(filePath)
        if (extension) {
          await factory.preloadLanguageForExtension(extension)
        }

        const treeSitter = await factory.getInstance()
        const surgeon = new ASTSurgeon(directory, treeSitter)
        const patch = await surgeon.patchSymbol(filePath, symbolName, args.new_code)

        if (!patch.success) {
          return toErrorOutput(
            patch.error ?? `Failed to patch symbol '${symbolName}' in '${filePath}'`
          )
        }

        return toSuccessOutput(`Patched symbol '${symbolName}' in ${filePath}`, undefined, {
          filePath,
          symbolName,
          bytesChanged: patch.bytesChanged,
          backupBytes: Buffer.byteLength(patch.backup),
        })
      } catch (err) {
        return toErrorOutput(
          `Precision patch failed: ${err instanceof Error ? err.message : String(err)}`
        )
      } finally {
        factory.dispose()
      }
    },
  })
}
