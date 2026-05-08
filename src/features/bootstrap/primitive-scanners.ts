/**
 * @fileoverview Internal scanner helpers for primitive-registry.ts.
 * Extracted to keep primitive-registry.ts under 500 LOC.
 */

import { promises as fs, existsSync } from "node:fs"
import path from "node:path"
import matter from "gray-matter"
import type { PrimitiveEntry } from "./primitive-registry.js"

// ---------------------------------------------------------------------------
// File parsing
// ---------------------------------------------------------------------------

/**
 * Parses a primitive .md file with YAML frontmatter into a PrimitiveEntry.
 *
 * @param filePath - Absolute path to the .md file.
 * @param type - The primitive type.
 * @param name - The primitive name (filename without extension or directory name).
 * @returns A PrimitiveEntry or null if parsing fails.
 */
export async function parsePrimitiveFile(
  filePath: string,
  type: "agent" | "skill" | "command" | "tool" | "rule",
  name: string,
): Promise<PrimitiveEntry | null> {
  try {
    const content = await fs.readFile(filePath, "utf-8")
    const stat = await fs.stat(filePath)
    const parsed = matter(content)
    const fm = parsed.data as Record<string, unknown>

    const dependencies = extractDependencies(type, fm)
    const version = typeof fm.version === "string" ? fm.version : "0"

    return {
      type,
      name,
      path: filePath,
      version,
      dependencies,
      lastModified: stat.mtime,
      metadata: fm,
    }
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Scanners
// ---------------------------------------------------------------------------

/**
 * Scans .opencode/agents/ for .md files and adds them to the primitives map.
 */
export async function scanAgents(
  root: string,
  primitives: Map<string, PrimitiveEntry>,
): Promise<void> {
  const agentsDir = path.join(root, ".opencode", "agents")
  if (!existsSync(agentsDir)) return

  const files = await safeReaddir(agentsDir)
  for (const file of files) {
    if (!file.endsWith(".md")) continue
    const filePath = path.join(agentsDir, file)
    const entry = await parsePrimitiveFile(filePath, "agent", file.replace(/\.md$/, ""))
    if (entry) {
      primitives.set(`agent:${entry.name}`, entry)
    }
  }
}

/**
 * Scans .opencode/commands/ for .md files and adds them to the primitives map.
 */
export async function scanCommands(
  root: string,
  primitives: Map<string, PrimitiveEntry>,
): Promise<void> {
  const commandsDir = path.join(root, ".opencode", "commands")
  if (!existsSync(commandsDir)) return

  const files = await safeReaddir(commandsDir)
  for (const file of files) {
    if (!file.endsWith(".md")) continue
    const filePath = path.join(commandsDir, file)
    const entry = await parsePrimitiveFile(filePath, "command", file.replace(/\.md$/, ""))
    if (entry) {
      primitives.set(`command:${entry.name}`, entry)
    }
  }
}

/**
 * Scans .opencode/skills/{dir}/SKILL.md for skill files.
 */
export async function scanSkills(
  root: string,
  primitives: Map<string, PrimitiveEntry>,
): Promise<void> {
  const skillsDir = path.join(root, ".opencode", "skills")
  if (!existsSync(skillsDir)) return

  const entries = await safeReaddirWithTypes(skillsDir)
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const skillPath = path.join(skillsDir, entry.name, "SKILL.md")
    if (!existsSync(skillPath)) continue

    const parsed = await parsePrimitiveFile(skillPath, "skill", entry.name)
    if (parsed) {
      primitives.set(`skill:${parsed.name}`, parsed)
    }
  }
}

// ---------------------------------------------------------------------------
// Dependency extraction
// ---------------------------------------------------------------------------

/**
 * Extracts dependency keys from frontmatter fields based on primitive type.
 */
function extractDependencies(
  type: string,
  fm: Record<string, unknown>,
): string[] {
  const deps: string[] = []

  switch (type) {
    case "agent": {
      if (Array.isArray(fm.skills)) {
        for (const skill of fm.skills) {
          if (typeof skill === "string") deps.push(`skill:${skill}`)
        }
      }
      if (Array.isArray(fm.tools)) {
        for (const tool of fm.tools) {
          if (typeof tool === "string") deps.push(`tool:${tool}`)
        }
      }
      break
    }
    case "command": {
      if (typeof fm.agent === "string" && fm.agent.length > 0) {
        deps.push(`agent:${fm.agent}`)
      }
      break
    }
  }

  return deps
}

// ---------------------------------------------------------------------------
// Filesystem helpers
// ---------------------------------------------------------------------------

/**
 * Safely reads a directory, returning an empty array on error.
 */
async function safeReaddir(dir: string): Promise<string[]> {
  try {
    return await fs.readdir(dir)
  } catch {
    return []
  }
}

/**
 * Safely reads a directory with file types, returning an empty array on error.
 */
async function safeReaddirWithTypes(dir: string): Promise<import("node:fs").Dirent[]> {
  try {
    return await fs.readdir(dir, { withFileTypes: true })
  } catch {
    return []
  }
}
