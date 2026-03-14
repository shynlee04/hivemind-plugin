/**
 * hivemind_codemap — Code Intelligence Tool
 *
 * Provides code analysis operations: scan, compress, status, search, inject, commit.
 * Operates on .hivemind/codemap/ directory.
 *
 * Design:
 *   1. Iceberg — minimal args, system handles storage
 *   2. Context Inference — project root from tool factory
 *   3. Signal-to-Noise — structured JSON output
 */

import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"
import { existsSync } from "node:fs"
import { readFile, writeFile } from "node:fs/promises"

import { getEffectivePaths } from "../lib/paths.js"
import { toSuccessOutput, toErrorOutput } from "../lib/tool-response.js"
import {
  scanProjectToCodeMap,
  loadCodeMap,
  loadCodeMapFromDir,
  computeCodeMapStats,
  compressCodemap,
  searchPatterns,
  findFunction,
  findType,
  findExport,
  findImporters,
  selectSourceForInjection,
  renderSourceSelectionXml,
  commitKnowledgeState,
  getLastKnowledgeCommit,
} from "../lib/code-intel/index.js"
import type { CompressedCodemap } from "../lib/code-intel/compressed-codemap.js"
import type { PatternMatch } from "../lib/code-intel/pattern-search.js"

export function createHivemindCodemapTool(directory: string): ToolDefinition {
  return tool({
    description:
      "Manage code intelligence: scan project, compress signatures, search patterns, inject context, commit knowledge state. " +
      "Actions: scan, compress, status, search, inject, commit.",
    args: {
      action: tool.schema
        .enum(["scan", "compress", "status", "search", "inject", "commit"])
        .describe("What to do: scan | compress | status | search | inject | commit"),
      query: tool.schema
        .string()
        .optional()
        .describe("For search: pattern to find (function name, type name, etc.)"),
      search_type: tool.schema
        .enum(["function", "type", "export", "importer", "pattern"])
        .optional()
        .describe("For search: what kind of symbol to find"),
      budget: tool.schema
        .number()
        .optional()
        .describe("For inject: max token budget (default 4000)"),
      file_locks: tool.schema
        .string()
        .optional()
        .describe("For inject: comma-separated list of file paths to prioritize"),
      message: tool.schema
        .string()
        .optional()
        .describe("For commit: commit message"),
    },
    async execute(args, _context) {
      switch (args.action) {
        case "scan":
          return handleScan(directory)
        case "compress":
          return handleCompress(directory)
        case "status":
          return handleStatus(directory)
        case "search":
          return handleSearch(directory, args)
        case "inject":
          return handleInject(directory, args)
        case "commit":
          return handleCommit(directory, args)
        default:
          return toErrorOutput(`Unknown action: ${args.action}`)
      }
    },
  })
}

// ─── Handlers ─────────────────────────────────────────────────────────────

async function handleScan(directory: string): Promise<string> {
  const paths = getEffectivePaths(directory)
  const result = await scanProjectToCodeMap(directory, paths.codemapDir)
  return toSuccessOutput(
    `Scanned ${result.files.length} files to codemap`,
    undefined,
    { fileCount: result.files.length, codemapPath: paths.codemapJson }
  )
}

async function handleCompress(directory: string): Promise<string> {
  const paths = getEffectivePaths(directory)

  if (!existsSync(paths.codemapJson)) {
    return toErrorOutput("No codemap found. Run 'scan' first.", "Use action: scan")
  }

  try {
    const codemap = await loadCodeMap(paths.codemapJson)

    // Check if codemap has full format (with version field)
    if (!codemap.version) {
      return toErrorOutput(
        "Codemap is in legacy format. Full scan with file-scanner required for compression.",
        "The legacy scanner only produces file paths. Run a full scan to get token counts and metadata."
      )
    }

    const compressed = await compressCodemap(codemap, { projectRoot: directory })

    await writeFile(
      paths.compressedCodemapJson,
      JSON.stringify(compressed, null, 2) + "\n",
      "utf-8"
    )

    return toSuccessOutput(
      `Compressed ${compressed.files.length} files (${compressed.totalTokens} tokens, ${compressed.compressionRatio}% reduction)`,
      undefined,
      {
        outputPath: paths.compressedCodemapJson,
        files: compressed.files.length,
        totalTokens: compressed.totalTokens,
        originalTokens: compressed.originalTotalTokens,
        compressionRatio: compressed.compressionRatio,
      }
    )
  } catch (err) {
    return toErrorOutput(
      `Compression failed: ${err instanceof Error ? err.message : String(err)}`
    )
  }
}

async function handleStatus(directory: string): Promise<string> {
  const paths = getEffectivePaths(directory)
  const hasCodemap = existsSync(paths.codemapJson)
  const hasCompressed = existsSync(paths.compressedCodemapJson)

  if (!hasCodemap) {
    return toSuccessOutput("No codemap exists. Run 'scan' to create one.", undefined, {
      exists: false,
      compressed: false,
    })
  }

  const codemap = await loadCodeMapFromDir(paths.codemapDir)
  const stats = computeCodeMapStats(
    codemap.files.map((f) => ({
      filePath: f.path,
      language: "",
      hash: "",
      size: 0,
      lineCount: 0,
      tokenCount: 0,
      hasSecrets: false,
      secretTypes: [],
      lastModified: new Date().toISOString(),
    }))
  )

  let lastCommit = null
  try {
    lastCommit = await getLastKnowledgeCommit(directory)
  } catch {
    /* no commits yet */
  }

  return toSuccessOutput("Codemap status", undefined, {
    exists: true,
    compressed: hasCompressed,
    fileCount: stats.totalFiles,
    lastKnowledgeCommit: lastCommit,
    codemapPath: paths.codemapJson,
    compressedPath: hasCompressed ? paths.compressedCodemapJson : null,
  })
}

async function handleSearch(
  directory: string,
  args: { query?: string; search_type?: string }
): Promise<string> {
  if (!args.query?.trim()) {
    return toErrorOutput("query is required for search", "Provide a pattern to search for")
  }

  const paths = getEffectivePaths(directory)

  if (!existsSync(paths.compressedCodemapJson)) {
    return toErrorOutput("No compressed codemap. Run 'compress' first.", "Use action: compress")
  }

  const raw = await readFile(paths.compressedCodemapJson, "utf-8")
  const compressed = JSON.parse(raw) as CompressedCodemap

  let matches: PatternMatch[]
  const searchType = args.search_type || "function"

  switch (searchType) {
    case "function":
      matches = findFunction(compressed, args.query)
      break
    case "type":
      matches = findType(compressed, args.query)
      break
    case "export":
      matches = findExport(compressed, args.query)
      break
    case "importer":
      matches = findImporters(compressed, args.query)
      break
    case "pattern":
      matches = searchPatterns(compressed, { signaturePattern: new RegExp(args.query, "i") })
      break
    default:
      return toErrorOutput(`Unknown search_type: ${searchType}`)
  }

  const top = matches.slice(0, 10)

  return toSuccessOutput(
    `Found ${matches.length} matches (showing top ${top.length})`,
    undefined,
    {
      totalMatches: matches.length,
      matches: top.map((m) => ({
        file: m.filePath,
        name: m.signature.name,
        type: m.signature.type,
        signature: m.signature.signature,
        relevance: m.relevance,
      })),
    }
  )
}

async function handleInject(
  directory: string,
  args: { budget?: number; file_locks?: string }
): Promise<string> {
  const paths = getEffectivePaths(directory)

  if (!existsSync(paths.compressedCodemapJson)) {
    return toErrorOutput("No compressed codemap. Run 'compress' first.", "Use action: compress")
  }

  const raw = await readFile(paths.compressedCodemapJson, "utf-8")
  const compressed = JSON.parse(raw) as CompressedCodemap

  const fileLocks = args.file_locks
    ? args.file_locks.split(",").map((s) => s.trim())
    : []
  const budget = args.budget || 4000

  const selection = selectSourceForInjection(compressed, fileLocks, budget)
  const xml = renderSourceSelectionXml(selection, budget)

  return toSuccessOutput(
    `Selected ${selection.files.length} files within ${budget} token budget`,
    undefined,
    {
      selectedFiles: selection.files.length,
      totalTokens: selection.totalTokens,
      budgetRemaining: selection.budgetRemaining,
      xml,
    }
  )
}

async function handleCommit(
  directory: string,
  args: { message?: string }
): Promise<string> {
  const paths = getEffectivePaths(directory)

  if (!existsSync(paths.compressedCodemapJson)) {
    return toErrorOutput(
      "No compressed codemap to commit. Run 'compress' first.",
      "Use action: compress"
    )
  }

  try {
    const raw = await readFile(paths.compressedCodemapJson, "utf-8")
    const compressed = JSON.parse(raw) as CompressedCodemap

    const result = await commitKnowledgeState(directory, compressed, {
      message: args.message || "chore(code-intel): update knowledge state",
    })

    if (!result.commitHash) {
      return toSuccessOutput(result.message, undefined, {
        committed: false,
        reason: result.message,
      })
    }

    return toSuccessOutput(
      `Knowledge committed: ${result.commitHash}`,
      result.commitHash,
      { committed: true, commitHash: result.commitHash, message: result.message }
    )
  } catch (err) {
    return toErrorOutput(`Commit failed: ${err instanceof Error ? err.message : String(err)}`)
  }
}
