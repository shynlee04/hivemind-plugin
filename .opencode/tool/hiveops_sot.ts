/**
 * HiveOps SOT (Source of Truth) Artifact Manager — Framework-Level Custom Tool
 *
 * Manages chained SOT artifacts with:
 * - Artifact registration and discovery
 * - Hierarchy-based linking (doc → parent → children)
 * - Searchable metadata tagging
 * - Staleness detection
 * - Export to grep-friendly, glob-friendly formats
 *
 * Namespace: hiveops_* (framework layer)
 * Covers R7: SOT Artifact Management + R8: Knowledge Synthesis
 *
 * @example Agent calls: hiveops_sot({ action: "register", path: "docs/plans/my-plan.md", tags: "plan,R1" })
 * @example Agent calls: hiveops_sot({ action: "search", query: "delegation" })
 * @example Agent calls: hiveops_sot({ action: "index" })
 */

import { tool } from "@opencode-ai/plugin"
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs"
import { join, relative, extname, basename } from "node:path"

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

const STATE_DIR = ".hivemind/state"
const SOT_FILE = "sot-index.json"
const STALE_THRESHOLD_MS = 48 * 60 * 60 * 1000 // 48 hours

function loadSotIndex(dir: string): SotIndex {
  const path = join(dir, STATE_DIR, SOT_FILE)
  if (!existsSync(path)) return { artifacts: [], version: 0, lastScan: 0, tagIndex: {} }
  try {
    return JSON.parse(readFileSync(path, "utf-8"))
  } catch {
    return { artifacts: [], version: 0, lastScan: 0, tagIndex: {} }
  }
}

function saveSotIndex(dir: string, state: SotIndex): void {
  const stateDir = join(dir, STATE_DIR)
  if (!existsSync(stateDir)) mkdirSync(stateDir, { recursive: true })
  state.version++
  state.lastScan = Date.now()
  // Rebuild tag index
  state.tagIndex = {}
  for (const art of state.artifacts) {
    for (const tag of art.tags) {
      if (!state.tagIndex[tag]) state.tagIndex[tag] = []
      state.tagIndex[tag].push(art.id)
    }
  }
  writeFileSync(join(stateDir, SOT_FILE), JSON.stringify(state, null, 2))
}

function generateId(path: string): string {
  return `sot-${basename(path, extname(path)).replace(/[^a-z0-9-]/gi, "-").toLowerCase()}`
}

function inferType(path: string): SotArtifact["type"] {
  if (path.includes("/plans/")) return "plan"
  if (path.includes("/agents/")) return "agent"
  if (path.includes("/commands/")) return "command"
  if (path.includes("/skills/")) return "skill"
  if (path.includes("/workflows/")) return "workflow"
  if (path.includes("/references/")) return "reference"
  if (path.includes("SPEC") || path.includes("spec")) return "spec"
  if (path.includes("SYNTHESIS") || path.includes("synthesis")) return "synthesis"
  return "other"
}

function extractTitle(content: string): string {
  const match = content.match(/^#\s+(.+)/m)
  return match ? match[1].trim() : ""
}

function inferDomain(path: string, content: string): string {
  const domainMatch = content.match(/\b(R[1-8])\b/)
  if (domainMatch) return domainMatch[1]
  if (path.includes("delegation") || path.includes("agent")) return "R1"
  if (path.includes("todo") || path.includes("workflow")) return "R2"
  if (path.includes("context") || path.includes("transform")) return "R3"
  if (path.includes("quality") || path.includes("gate") || path.includes("validation")) return "R4"
  if (path.includes("enforce") || path.includes("runtime")) return "R5"
  if (path.includes("session") || path.includes("export")) return "R6"
  if (path.includes("sot") || path.includes("artifact")) return "R7"
  if (path.includes("knowledge") || path.includes("synthesis")) return "R8"
  return "general"
}

export default tool({
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
    const dir = context.directory || "."
    const state = loadSotIndex(dir)

    switch (args.action) {
      case "register": {
        if (!args.path) return "ERROR: path is required for register"
        const fullPath = join(dir, args.path)
        if (!existsSync(fullPath)) return `ERROR: File not found: ${args.path}`

        const stat = statSync(fullPath)
        const content = readFileSync(fullPath, "utf-8")
        const id = generateId(args.path)
        const existing = state.artifacts.findIndex((a) => a.id === id)

        const artifact: SotArtifact = {
          id,
          path: args.path,
          title: extractTitle(content) || basename(args.path),
          tags: args.tags ? args.tags.split(",").map((t) => t.trim()) : [],
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

        // Wire parent-child
        if (args.parent) {
          const parentArt = state.artifacts.find((a) => a.id === args.parent)
          if (parentArt && !parentArt.children.includes(id)) {
            parentArt.children.push(id)
          }
        }

        if (existing >= 0) {
          artifact.children = state.artifacts[existing].children
          state.artifacts[existing] = artifact
        } else {
          state.artifacts.push(artifact)
        }

        saveSotIndex(dir, state)
        return `Registered: ${id} — "${artifact.title}" [${artifact.type}] (${artifact.domain})${artifact.plan_id ? ` plan:${artifact.plan_id}` : ""}${artifact.node_id ? ` node:${artifact.node_id}` : ""} tags:[${artifact.tags.join(",")}]`
      }

      case "search": {
        if (!args.query) return "ERROR: query is required for search"
        const q = args.query.toLowerCase()
        const matches = state.artifacts.filter((a) => {
          return (
            a.title.toLowerCase().includes(q) ||
            a.path.toLowerCase().includes(q) ||
            a.tags.some((t) => t.toLowerCase().includes(q)) ||
            a.domain.toLowerCase().includes(q)
          )
        })

        if (matches.length === 0) return `No artifacts match "${args.query}"`
        return matches
          .map((a) => `[${a.type}] ${a.id} — "${a.title}" (${a.domain}) ${a.stale ? "[STALE]" : ""}\n  path: ${a.path}`)
          .join("\n\n")
      }

      case "scan": {
        const scanDir = args.path || "docs"
        const scanPath = join(dir, scanDir)
        if (!existsSync(scanPath)) return `ERROR: Directory not found: ${scanDir}`

        let count = 0
        const scanRecursive = (d: string) => {
          for (const entry of readdirSync(d, { withFileTypes: true })) {
            if (entry.name.startsWith(".") || entry.name === "node_modules") continue
            const full = join(d, entry.name)
            if (entry.isDirectory()) {
              scanRecursive(full)
            } else if ([".md", ".yaml", ".json"].includes(extname(entry.name))) {
              const relPath = relative(dir, full)
              const id = generateId(relPath)
              if (!state.artifacts.find((a) => a.id === id)) {
                const content = readFileSync(full, "utf-8").slice(0, 2000)
                const stat = statSync(full)
                state.artifacts.push({
                  id,
                  path: relPath,
                  title: extractTitle(content) || entry.name,
                  tags: [],
                  domain: inferDomain(relPath, content),
                  plan_id: undefined,
                  node_id: undefined,
                  type: inferType(relPath),
                  children: [],
                  registered: Date.now(),
                  lastModified: stat.mtimeMs,
                  size: stat.size,
                  stale: Date.now() - stat.mtimeMs > STALE_THRESHOLD_MS,
                })
                count++
              }
            }
          }
        }

        scanRecursive(scanPath)
        saveSotIndex(dir, state)
        return `Scanned ${scanDir}: ${count} new artifacts registered (${state.artifacts.length} total)`
      }

      case "stale": {
        const staleItems = state.artifacts.filter((a) => {
          try {
            const fullPath = join(dir, a.path)
            if (!existsSync(fullPath)) return true
            const stat = statSync(fullPath)
            a.lastModified = stat.mtimeMs
            a.stale = Date.now() - stat.mtimeMs > STALE_THRESHOLD_MS
            return a.stale
          } catch {
            return true
          }
        })

        saveSotIndex(dir, state)
        if (staleItems.length === 0) return "No stale artifacts (all updated within 48h)."
        return [
          `${staleItems.length} stale artifacts (>48h since modification):`,
          ...staleItems.map((a) => {
            const age = Math.round((Date.now() - a.lastModified) / (60 * 60 * 1000))
            return `  [${a.domain}] ${a.path} — ${age}h old`
          }),
        ].join("\n")
      }

      case "tree": {
        const roots = state.artifacts.filter((a) => !a.parent)
        if (roots.length === 0) return "No artifacts registered."

        const renderTree = (art: SotArtifact, depth: number): string => {
          const indent = "  ".repeat(depth)
          const icon = { plan: "P", spec: "S", reference: "R", synthesis: "K", agent: "A", command: "C", skill: "SK", workflow: "W", other: "?" }[art.type]
          let line = `${indent}[${icon}] ${art.id} (${art.domain})${art.stale ? " [STALE]" : ""}`
          for (const childId of art.children) {
            const child = state.artifacts.find((a) => a.id === childId)
            if (child) line += "\n" + renderTree(child, depth + 1)
          }
          return line
        }

        return roots.map((r) => renderTree(r, 0)).join("\n")
      }

      case "index": {
        saveSotIndex(dir, state)
        const byType: Record<string, number> = {}
        const byDomain: Record<string, number> = {}
        for (const a of state.artifacts) {
          byType[a.type] = (byType[a.type] || 0) + 1
          byDomain[a.domain] = (byDomain[a.domain] || 0) + 1
        }
        return [
          `SOT Index (v${state.version}): ${state.artifacts.length} artifacts`,
          `By type: ${Object.entries(byType).map(([k, v]) => `${k}:${v}`).join(", ")}`,
          `By domain: ${Object.entries(byDomain).map(([k, v]) => `${k}:${v}`).join(", ")}`,
          `Tags: ${Object.keys(state.tagIndex).length} unique tags`,
          `Stale: ${state.artifacts.filter((a) => a.stale).length}`,
        ].join("\n")
      }

      case "export": {
        // Export as grep-friendly plain text
        const lines = state.artifacts.map((a) => {
          return `${a.domain}\t${a.type}\t${a.plan_id || ""}\t${a.node_id || ""}\t${a.id}\t${a.path}\t${a.tags.join(",")}\t${a.title}`
        })
        const exportPath = join(dir, STATE_DIR, "sot-export.tsv")
        writeFileSync(exportPath, ["domain\ttype\tplan_id\tnode_id\tid\tpath\ttags\ttitle", ...lines].join("\n"))
        return `Exported ${state.artifacts.length} artifacts to ${STATE_DIR}/sot-export.tsv (grep/awk friendly)`
      }

      default:
        return `ERROR: Unknown action: ${args.action}`
    }
  },
})
