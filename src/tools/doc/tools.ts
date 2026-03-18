import { tool } from '@opencode-ai/plugin'

import { executeHivemindDocAction } from '../../features/doc-intelligence/doc.js'
import { error, success } from '../../shared/tool-response.js'
import { renderToolResult } from '../../shared/tool-helpers.js'
import type { HivemindDocToolArgs } from './types.js'

const s = tool.schema

export function createHivemindDocTool(projectRoot: string): ReturnType<typeof tool> {
  return tool({
    description:
      'Read-only document intelligence for markdown project artifacts. ' +
      'Use this to skim outlines, read sections, chunk large documents, and search docs without mutating files.',
    args: {
      action: s.enum(['skim', 'skim_directory', 'read', 'chunk', 'search']).describe('Read-only document action to execute.'),
      filePath: s.string().optional().describe('Workspace-relative markdown file path for skim/read/chunk actions.'),
      dirPath: s.string().optional().describe('Workspace-relative directory path for skim_directory or search actions.'),
      heading: s.string().optional().describe('Exact markdown heading text for targeted section reads.'),
      maxTokens: s.number().int().positive().optional().describe('Maximum tokens per chunk for chunk reads.'),
      query: s.string().optional().describe('Plain-text search query for search actions.'),
      globFilter: s.string().optional().describe('Optional extension filter such as .md or .markdown.'),
    },
    async execute(args: HivemindDocToolArgs, context) {
      const result = await executeHivemindDocAction(projectRoot, args)
      if (result.kind === 'error') {
        return renderToolResult(error(result.message))
      }
      if (result.metadata) {
        context.metadata(result.metadata)
      }
      return renderToolResult(success(result.message, result.data))
    },
  })
}
