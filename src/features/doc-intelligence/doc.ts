import {
  readChunked,
  readSection,
  searchDocuments,
  skimDirectory,
  skimDocument,
} from '../../intelligence/doc/index.js'
import { docActionPressureContracts, type HivemindDocToolArgs } from '../../tools/doc/types.js'

export type DocFeatureResult =
  | { kind: 'error'; message: string }
  | {
      kind: 'success'
      message: string
      data: Record<string, unknown>
      metadata?: {
        title: string
        metadata: Record<string, unknown>
      }
    }

export async function executeHivemindDocAction(
  projectRoot: string,
  args: HivemindDocToolArgs,
): Promise<DocFeatureResult> {
  const pressureContract = docActionPressureContracts[args.action]

  if (args.action === 'skim') {
    if (!args.filePath) {
      return { kind: 'error', message: 'filePath is required for skim' }
    }

    const result = await skimDocument(projectRoot, args.filePath)
    return {
      kind: 'success',
      message: 'Skimmed markdown document',
      data: { result, pressureContract },
      metadata: {
        title: `HiveMind doc skim ${result.path}`,
        metadata: { action: args.action },
      },
    }
  }

  if (args.action === 'skim_directory') {
    if (!args.dirPath) {
      return { kind: 'error', message: 'dirPath is required for skim_directory' }
    }

    const result = await skimDirectory(projectRoot, args.dirPath, args.globFilter)
    return {
      kind: 'success',
      message: 'Skimmed markdown directory',
      data: { result, pressureContract },
    }
  }

  if (args.action === 'read') {
    if (!args.filePath) {
      return { kind: 'error', message: 'filePath is required for read' }
    }

    if (!args.heading) {
      return { kind: 'error', message: 'heading is required for read' }
    }

    const result = await readSection(projectRoot, args.filePath, args.heading)
    return {
      kind: 'success',
      message: 'Read markdown section',
      data: { result, pressureContract },
    }
  }

  if (args.action === 'chunk') {
    if (!args.filePath) {
      return { kind: 'error', message: 'filePath is required for chunk' }
    }

    const result = await readChunked(projectRoot, args.filePath, args.heading, args.maxTokens)
    return {
      kind: 'success',
      message: 'Chunked markdown document',
      data: { result, pressureContract },
    }
  }

  if (!args.dirPath) {
    return { kind: 'error', message: 'dirPath is required for search' }
  }

  if (!args.query) {
    return { kind: 'error', message: 'query is required for search' }
  }

  const result = await searchDocuments(projectRoot, args.dirPath, args.query, args.globFilter)
  return {
    kind: 'success',
    message: 'Searched markdown documents',
    data: { result, pressureContract },
  }
}
