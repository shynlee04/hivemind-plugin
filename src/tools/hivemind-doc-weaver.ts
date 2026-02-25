import { readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"

import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"

import { DocWeaver } from "../lib/code-intel/index.js"
import { toErrorOutput, toSuccessOutput } from "../lib/tool-response.js"

export function createHivemindDocWeaverTool(directory: string): ToolDefinition {
  return tool({
    description:
      "Patch a markdown section by heading and rewrite only that section body.",
    args: {
      file_path: tool.schema.string().describe("Workspace-relative markdown file path"),
      heading: tool.schema.string().describe("Exact heading text to patch"),
      new_content: tool.schema.string().describe("Replacement section body content"),
    },
    async execute(args, _context) {
      const filePath = args.file_path.trim()
      const heading = args.heading.trim()

      if (!filePath) {
        return toErrorOutput("file_path is required", "Provide a non-empty file_path")
      }
      if (!heading) {
        return toErrorOutput("heading is required", "Provide a non-empty heading")
      }

      const absolutePath = join(directory, filePath)
      const docWeaver = new DocWeaver()

      try {
        const original = await readFile(absolutePath, "utf-8")
        const patched = docWeaver.patchSection(original, heading, args.new_content)

        if (patched === original) {
          return toErrorOutput(
            `No section changes applied for heading '${heading}' in ${filePath}`,
            "Confirm the heading exists and is an exact text match"
          )
        }

        await writeFile(absolutePath, patched, "utf-8")

        return toSuccessOutput(`Patched heading '${heading}' in ${filePath}`, undefined, {
          filePath,
          heading,
          bytesChanged: Math.abs(Buffer.byteLength(patched) - Buffer.byteLength(original)),
        })
      } catch (err) {
        return toErrorOutput(
          `Doc weaving failed: ${err instanceof Error ? err.message : String(err)}`
        )
      }
    },
  })
}
