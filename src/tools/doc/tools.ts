import { tool } from '@opencode-ai/plugin/tool'

import {
  readChunked,
  readSection,
  searchDocuments,
  skimDirectory,
  skimDocument,
} from '../../intelligence/doc/index.js'
import { error, success } from '../../shared/tool-response.js'
import { renderToolResult } from '../../shared/tool-helpers.js'
import { docActionPressureContracts, type HivemindDocToolArgs } from './types.js'

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
      const pressureContract = docActionPressureContracts[args.action]

      if (args.action === 'skim') {
        if (!args.filePath) {
          return renderToolResult(error('filePath is required for skim'))
        }

        const result = await skimDocument(projectRoot, args.filePath)
        context.metadata({
          title: `HiveMind doc skim ${result.path}`,
          metadata: { action: args.action },
        })
        return renderToolResult(success('Skimmed markdown document', result, { pressureContract }))
      }

      if (args.action === 'skim_directory') {
        if (!args.dirPath) {
          return renderToolResult(error('dirPath is required for skim_directory'))
        }

        const result = await skimDirectory(projectRoot, args.dirPath, args.globFilter)
        return renderToolResult(success('Skimmed markdown directory', result, { pressureContract }))
      }

      if (args.action === 'read') {
        if (!args.filePath) {
          return renderToolResult(error('filePath is required for read'))
        }

        if (!args.heading) {
          return renderToolResult(error('heading is required for read'))
        }

        const result = await readSection(projectRoot, args.filePath, args.heading)
        return renderToolResult(success('Read markdown section', result, { pressureContract }))
      }

      if (args.action === 'chunk') {
        if (!args.filePath) {
          return renderToolResult(error('filePath is required for chunk'))
        }

        const result = await readChunked(projectRoot, args.filePath, args.heading, args.maxTokens)
        return renderToolResult(success('Chunked markdown document', result, { pressureContract }))
      }

      if (!args.dirPath) {
        return renderToolResult(error('dirPath is required for search'))
      }

      if (!args.query) {
        return renderToolResult(error('query is required for search'))
      }

      const result = await searchDocuments(projectRoot, args.dirPath, args.query, args.globFilter)
      return renderToolResult(success('Searched markdown documents', result, { pressureContract }))
    },
  })
}
