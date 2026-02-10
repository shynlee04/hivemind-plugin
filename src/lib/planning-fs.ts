/**
 * Planning File System
 * Manages .opencode/planning/ directory structure
 */

import { readFile, writeFile, mkdir, readdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { parse, stringify } from "yaml";

export interface PlanningPaths {
  projectRoot: string;
  planningDir: string;
  indexPath: string;
  activePath: string;
  archiveDir: string;
  brainPath: string;
}

export function getPlanningPaths(projectRoot: string): PlanningPaths {
  const planningDir = join(projectRoot, ".opencode", "planning");
  return {
    projectRoot,
    planningDir,
    indexPath: join(planningDir, "index.md"),
    activePath: join(planningDir, "active.md"),
    archiveDir: join(planningDir, "archive"),
    brainPath: join(planningDir, "brain.json"),
  };
}

export interface ActiveMdContent {
  frontmatter: {
    session_id?: string;
    mode?: string;
    governance_status?: string;
    start_time?: number;
    last_updated?: number;
  };
  body: string;
}

export async function initializePlanningDirectory(
  projectRoot: string
): Promise<PlanningPaths> {
  const paths = getPlanningPaths(projectRoot);
  
  // Create directories
  await mkdir(paths.planningDir, { recursive: true });
  await mkdir(paths.archiveDir, { recursive: true });
  
  // Create index.md if not exists
  if (!existsSync(paths.indexPath)) {
    await writeFile(paths.indexPath, generateIndexTemplate());
  }
  
  // Create active.md if not exists
  if (!existsSync(paths.activePath)) {
    await writeFile(paths.activePath, generateActiveTemplate());
  }
  
  return paths;
}

export async function readActiveMd(
  projectRoot: string
): Promise<ActiveMdContent> {
  const paths = getPlanningPaths(projectRoot);
  
  try {
    const content = await readFile(paths.activePath, "utf-8");
    return parseActiveMd(content);
  } catch {
    return { frontmatter: {}, body: "" };
  }
}

export function parseActiveMd(content: string): ActiveMdContent {
  const yamlMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  
  if (yamlMatch) {
    try {
      const frontmatter = parse(yamlMatch[1]) || {};
      const body = yamlMatch[2].trim();
      return { frontmatter, body };
    } catch {
      // Fall through to default
    }
  }
  
  return { frontmatter: {}, body: content.trim() };
}

export async function writeActiveMd(
  projectRoot: string,
  content: ActiveMdContent
): Promise<void> {
  const paths = getPlanningPaths(projectRoot);
  const yamlContent = stringify(content.frontmatter);
  const fullContent = `---\n${yamlContent}---\n\n${content.body}`;
  await writeFile(paths.activePath, fullContent);
}

export async function archiveSession(
  projectRoot: string,
  sessionId: string,
  content: string
): Promise<void> {
  const paths = getPlanningPaths(projectRoot);
  const timestamp = new Date().toISOString().split("T")[0];
  const archiveFile = join(paths.archiveDir, `session_${timestamp}_${sessionId}.md`);
  await writeFile(archiveFile, content);
}

export async function updateIndexMd(
  projectRoot: string,
  summaryLine: string
): Promise<void> {
  const paths = getPlanningPaths(projectRoot);
  
  try {
    const content = await readFile(paths.indexPath, "utf-8");
    const timestamp = new Date().toISOString().split("T")[0];
    const entry = `- ${timestamp}: ${summaryLine}\n`;
    const updated = content + entry;
    await writeFile(paths.indexPath, updated);
  } catch {
    // If index doesn't exist, create it
    await writeFile(paths.indexPath, generateIndexTemplate() + summaryLine + "\n");
  }
}

export async function listArchives(projectRoot: string): Promise<string[]> {
  const paths = getPlanningPaths(projectRoot);
  
  try {
    const files = await readdir(paths.archiveDir);
    return files.filter((f) => f.endsWith(".md")).sort();
  } catch {
    return [];
  }
}

export function generateIndexTemplate(): string {
  return `# Project Trajectory

## Goals
<!-- High-level goals only -->
- 

## Constraints
<!-- Project-wide constraints -->
- 

## Session History
<!-- Auto-updated by compact_session -->
`;
}

export function generateActiveTemplate(): string {
  return `---
session_id: ""
mode: ""
governance_status: "LOCKED"
start_time: 0
last_updated: 0
---

# Active Session

## Current Focus
<!-- Updated via map_context -->

## Completed
<!-- Items marked [x] get archived -->

## Notes
<!-- Scratchpad - anything goes -->
`;
}

export async function resetActiveMd(projectRoot: string): Promise<void> {
  await writeFile(
    getPlanningPaths(projectRoot).activePath,
    generateActiveTemplate()
  );
}
