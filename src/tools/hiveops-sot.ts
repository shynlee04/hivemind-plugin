/**
 * HiveOps source-of-truth artifact manager.
 *
 * This is the canonical `src` owner for the legacy `hiveops_sot` behavior.
 * The `.opencode/tool/hiveops_sot.ts` file remains only as a compatibility wrapper.
 *
 * @example Agent calls: hiveops_sot({ action: "register", path: "docs/plans/my-plan.md", tags: "plan,R1" })
 * @example Agent calls: hiveops_sot({ action: "search", query: "delegation" })
 * @example Agent calls: hiveops_sot({ action: "index" })
 */

import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs"
import { basename, extname, join, relative } from "node:path"

import { readManifest, writeManifest } from "../lib/manifest.js"
import { getHiveOpsPaths } from "../lib/hiveops-paths.js"

interface SotArtifact {
  id: string
  path: string
  title: string
  tags: string[]
  domain: string
  plan_id?: string
  node_id?: string
  type: "plan" | "spec" | "reference" | "synthesis" | "agent" | "command" | "skill" | "workflow" | "other"
  parent?: string
  children: string[]
  registered: number
  lastModified: number
  size: number
  stale: boolean
}

interface SotIndex {
  artifacts: SotArtifact[]
  version: number
  lastScan: number
  tagIndex: Record<string, string[]>
}

const DEFAULT_SOT_INDEX: SotIndex = {
  artifacts: [],
  version: 0,
  lastScan: 0,
  tagIndex: {},
}

const STALE_THRESHOLD_MS = 48 * 60 * 60 * 1000

/**
 * Load the SOT index from canonical storage.
 *
 * @param projectRoot - Project root used to resolve the SOT index file.
 * @returns Current SOT index, or an empty default when no index exists yet.
 */
async function loadSotIndex(projectRoot: string): Promise<SotIndex> {
  const { sotIndexFile } = getHiveOpsPaths(projectRoot)
  return readManifest(sotIndexFile, DEFAULT_SOT_INDEX)
}

/**
 * Persist the SOT index and rebuild tag lookups.
 *
 * @param projectRoot - Project root used to resolve the SOT index file.
 * @param state - SOT index to persist.
 * @returns Resolves when the write is complete.
 */
async function saveSotIndex(projectRoot: string, state: SotIndex): Promise<void> {
  const { sotIndexFile } = getHiveOpsPaths(projectRoot)
  const tagIndex: Record<string, string[]> = {}

  for (const artifact of state.artifacts) {
    for (const tag of artifact.tags) {
      if (!tagIndex[tag]) tagIndex[tag] = []
      tagIndex[tag].push(artifact.id)
    }
  }

  await writeManifest(sotIndexFile, {
    ...state,
    version: state.version + 1,
    lastScan: Date.now(),
    tagIndex,
  })
}

function generateId(filePath: string): string {
  return `sot-${basename(filePath, extname(filePath)).replace(/[^a-z0-9-]/gi, "-").toLowerCase()}`
}

function inferType(filePath: string): SotArtifact["type"] {
  if (filePath.includes("/plans/")) return "plan"
  if (filePath.includes("/agents/")) return "agent"
  if (filePath.includes("/commands/")) return "command"
  if (filePath.includes("/skills/")) return "skill"
  if (filePath.includes("/workflows/")) return "workflow"
  if (filePath.includes("/references/")) return "reference"
  if (filePath.includes("SPEC") || filePath.includes("spec")) return "spec"
  if (filePath.includes("SYNTHESIS") || filePath.includes("synthesis")) return "synthesis"
  return "other"
}

function extractTitle(content: string): string {
  const match = content.match(/^#\s+(.+)/m)
  return match ? match[1].trim() : ""
}

function inferDomain(filePath: string, content: string): string {
  const domainMatch = content.match(/\b(R[1-8])\b/)
  if (domainMatch) return domainMatch[1]
  if (filePath.includes("delegation") || filePath.includes("agent")) return "R1"
  if (filePath.includes("todo") || filePath.includes("workflow")) return "R2"
  if (filePath.includes("context") || filePath.includes("transform")) return "R3"
  if (filePath.includes("quality") || filePath.includes("gate") || filePath.includes("validation")) return "R4"
  if (filePath.includes("enforce") || filePath.includes("runtime")) return "R5"
  if (filePath.includes("session") || filePath.includes("export")) return "R6"
  if (filePath.includes("sot") || filePath.includes("artifact")) return "R7"
  if (filePath.includes("knowledge") || filePath.includes("synthesis")) return "R8"
  return "general"
}

export function createHiveOpsSotTool(fallbackDirectory: string): ToolDefinition {
  return tool({
    description:
      "Manage SOT (Source of Truth) artifacts — register, search, index, and detect staleness. " +
      "Produces grep-friendly, glob-searchable artifact registries for cross-agent knowledge synthesis.",
    args: {
      action: tool.schema
        .enum(["register", "search", "index", "scan", "stale", "tree", "export"])
        .describe("Action: register artifact, search, rebuild index, scan dirs, detect stale, show tree, or export"),
      path: tool.schema.string().optional().describe("File path to register or scan directory"),
      query: tool.schema.string().optional().describe("Search query for text/tag matching"),
      tags: tool.schema.string().optional().describe("Comma-separated tags"),
      domain: tool.schema.string().optional().describe("Domain filter: R1-R8"),
      parent: tool.schema.string().optional().describe("Parent artifact ID for hierarchical linking"),
      plan_id: tool.schema.string().optional().describe("Plan lineage ID (e.g. META01, PROJ01-SUB01)"),
      node_id: tool.schema.string().optional().describe("Optional node ID under plan lineage"),
    },
    async execute(args, context) {
      const projectRoot = context.directory || fallbackDirectory || "."
      const state = await loadSotIndex(projectRoot)

      switch (args.action) {
        case "register": {
          if (!args.path) return "ERROR: path is required for register"

          const fullPath = join(projectRoot, args.path)
          if (!existsSync(fullPath)) return `ERROR: File not found: ${args.path}`

          const stat = statSync(fullPath)
          const content = readFileSync(fullPath, "utf-8")
          const id = generateId(args.path)
          const existingIndex = state.artifacts.findIndex((artifact) => artifact.id === id)

          const artifact: SotArtifact = {
            id,
            path: args.path,
            title: extractTitle(content) || basename(args.path),
            tags: args.tags ? args.tags.split(",").map((tag) => tag.trim()).filter(Boolean) : [],
            domain: args.domain || inferDomain(args.path, content),
            plan_id: args.plan_id,
            node_id: args.node_id,
            type: inferType(args.path),
            parent: args.parent,
            children: [],
            registered: Date.now(),
            lastModified: stat.mtimeMs,
            size: stat.size,
            stale: Date.now() - stat.mtimeMs > STALE_THRESHOLD_MS,
          }

          if (args.parent) {
            const parentArtifact = state.artifacts.find((existing) => existing.id === args.parent)
            if (parentArtifact && !parentArtifact.children.includes(id)) {
              parentArtifact.children.push(id)
            }
          }

          if (existingIndex >= 0) {
            artifact.children = state.artifacts[existingIndex].children
            state.artifacts[existingIndex] = artifact
          } else {
            state.artifacts.push(artifact)
          }

          await saveSotIndex(projectRoot, state)
          return `Registered: ${id} — "${artifact.title}" [${artifact.type}] (${artifact.domain})${artifact.plan_id ? ` plan:${artifact.plan_id}` : ""}${artifact.node_id ? ` node:${artifact.node_id}` : ""} tags:[${artifact.tags.join(",")}]`
        }

        case "search": {
          if (!args.query) return "ERROR: query is required for search"
          const query = args.query.toLowerCase()
          const matches = state.artifacts.filter((artifact) => {
            return (
              artifact.title.toLowerCase().includes(query) ||
              artifact.path.toLowerCase().includes(query) ||
              artifact.tags.some((tag) => tag.toLowerCase().includes(query)) ||
              artifact.domain.toLowerCase().includes(query)
            )
          })

          if (matches.length === 0) return `No artifacts match "${args.query}"`
          return matches
            .map((artifact) => {
              return `[${artifact.type}] ${artifact.id} — "${artifact.title}" (${artifact.domain}) ${artifact.stale ? "[STALE]" : ""}\n  path: ${artifact.path}`
            })
            .join("\n\n")
        }

        case "scan": {
          const scanDir = args.path || "docs"
          const scanPath = join(projectRoot, scanDir)
          if (!existsSync(scanPath)) return `ERROR: Directory not found: ${scanDir}`

          let count = 0
          const scanRecursive = (directoryPath: string): void => {
            for (const entry of readdirSync(directoryPath, { withFileTypes: true })) {
              if (entry.name.startsWith(".") || entry.name === "node_modules") continue

              const fullEntryPath = join(directoryPath, entry.name)
              if (entry.isDirectory()) {
                scanRecursive(fullEntryPath)
                continue
              }

              if (![".md", ".yaml", ".json"].includes(extname(entry.name))) continue

              const relativePath = relative(projectRoot, fullEntryPath)
              const id = generateId(relativePath)
              if (state.artifacts.find((artifact) => artifact.id === id)) continue

              const content = readFileSync(fullEntryPath, "utf-8").slice(0, 2000)
              const stat = statSync(fullEntryPath)
              state.artifacts.push({
                id,
                path: relativePath,
                title: extractTitle(content) || entry.name,
                tags: [],
                domain: inferDomain(relativePath, content),
                plan_id: undefined,
                node_id: undefined,
                type: inferType(relativePath),
                children: [],
                registered: Date.now(),
                lastModified: stat.mtimeMs,
                size: stat.size,
                stale: Date.now() - stat.mtimeMs > STALE_THRESHOLD_MS,
              })
              count++
            }
          }

          scanRecursive(scanPath)
          await saveSotIndex(projectRoot, state)
          return `Scanned ${scanDir}: ${count} new artifacts registered (${state.artifacts.length} total)`
        }

        case "stale": {
          const staleItems = state.artifacts.filter((artifact) => {
            try {
              const fullPath = join(projectRoot, artifact.path)
              if (!existsSync(fullPath)) return true
              const stat = statSync(fullPath)
              artifact.lastModified = stat.mtimeMs
              artifact.stale = Date.now() - stat.mtimeMs > STALE_THRESHOLD_MS
              return artifact.stale
            } catch {
              return true
            }
          })

          await saveSotIndex(projectRoot, state)
          if (staleItems.length === 0) return "No stale artifacts (all updated within 48h)."

          return [
            `${staleItems.length} stale artifacts (>48h since modification):`,
            ...staleItems.map((artifact) => {
              const age = Math.round((Date.now() - artifact.lastModified) / (60 * 60 * 1000))
              return `  [${artifact.domain}] ${artifact.path} — ${age}h old`
            }),
          ].join("\n")
        }

        case "tree": {
          const roots = state.artifacts.filter((artifact) => !artifact.parent)
          if (roots.length === 0) return "No artifacts registered."

          const renderTree = (artifact: SotArtifact, depth: number): string => {
            const indent = "  ".repeat(depth)
            const icon = { plan: "P", spec: "S", reference: "R", synthesis: "K", agent: "A", command: "C", skill: "SK", workflow: "W", other: "?" }[artifact.type]
            let line = `${indent}[${icon}] ${artifact.id} (${artifact.domain})${artifact.stale ? " [STALE]" : ""}`

            for (const childId of artifact.children) {
              const child = state.artifacts.find((candidate) => candidate.id === childId)
              if (child) line += "\n" + renderTree(child, depth + 1)
            }

            return line
          }

          return roots.map((artifact) => renderTree(artifact, 0)).join("\n")
        }

        case "index": {
          await saveSotIndex(projectRoot, state)
          const byType: Record<string, number> = {}
          const byDomain: Record<string, number> = {}

          for (const artifact of state.artifacts) {
            byType[artifact.type] = (byType[artifact.type] || 0) + 1
            byDomain[artifact.domain] = (byDomain[artifact.domain] || 0) + 1
          }

          return [
            `SOT Index (v${state.version}): ${state.artifacts.length} artifacts`,
            `By type: ${Object.entries(byType).map(([key, value]) => `${key}:${value}`).join(", ")}`,
            `By domain: ${Object.entries(byDomain).map(([key, value]) => `${key}:${value}`).join(", ")}`,
            `Tags: ${Object.keys(state.tagIndex).length} unique tags`,
            `Stale: ${state.artifacts.filter((artifact) => artifact.stale).length}`,
          ].join("\n")
        }

        case "export": {
          const { sotExportFile } = getHiveOpsPaths(projectRoot)
          const lines = state.artifacts.map((artifact) => {
            return `${artifact.domain}\t${artifact.type}\t${artifact.plan_id || ""}\t${artifact.node_id || ""}\t${artifact.id}\t${artifact.path}\t${artifact.tags.join(",")}\t${artifact.title}`
          })

          writeFileSync(sotExportFile, ["domain\ttype\tplan_id\tnode_id\tid\tpath\ttags\ttitle", ...lines].join("\n"))
          return `Exported ${state.artifacts.length} artifacts to .hivemind/state/sot-export.tsv (grep/awk friendly)`
        }

        default:
          return `ERROR: Unknown action: ${args.action}`
      }
    },
  })
}
