/**
 * Planning File System
 * Manages .hivemind/ directory structure with per-session files, manifest, and guards.
 *
 * Architecture:
 * - Template system: templates/session.md regulates naming, format, sections
 * - Per-session instances: sessions/{stamp}.md instantiated from template
 * - Manifest: sessions/manifest.json replaces index.md as session registry
 * - Read-before-write guard: FileGuard tracks read state, enforces re-read before write
 * - Same-session = append-only: content within a session's ## Log section
 *
 * Backward compatibility:
 * - All existing exports preserved with same signatures
 * - readActiveMd/writeActiveMd now resolve via manifest to find active session file
 * - activePath in PlanningPaths still works (resolves to active session file)
 */

import { readFile, writeFile, mkdir, readdir, rename } from "fs/promises";
import { existsSync } from "fs";
import { basename, dirname, join } from "path";
import { parse, stringify } from "yaml";
import {
  buildArchiveFilename,
  getAllDirectories,
  getEffectivePaths,
} from "./paths.js";
import {
  ensureCoreManifests,
  createDefaultSessionManifest,
  deduplicateSessionManifest,
  readManifest as readTypedManifest,
  registerSessionInManifest,
  type SessionManifest as RelationalSessionManifest,
  type SessionManifestEntry,
  writeManifest as writeTypedManifest,
} from "./manifest.js";
import { createStateManager } from "./persistence.js";
import { loadAnchors } from "./anchors.js";

// ============================================================
// Section 1: Path Resolution
// ============================================================

export interface PlanningPaths {
  projectRoot: string;
  planningDir: string;
  indexPath: string;
  activePath: string;
  archiveDir: string;
  brainPath: string;
  /** Path to the session template file */
  templatePath: string;
  /** Path to the manifest file (JSON session registry) */
  manifestPath: string;
  /** Path to the templates directory */
  templatesDir: string;
  /** Path to the sessions directory */
  sessionsDir: string;
  /** Path to hierarchy.json */
  hierarchyPath: string;
  /** Path to logs directory */
  logsDir: string;
}

export function getPlanningPaths(projectRoot: string): PlanningPaths {
  const p = getEffectivePaths(projectRoot);
  return {
    projectRoot,
    planningDir: p.root,
    indexPath: p.index,
    activePath: join(p.sessionsDir, "active.md"), // backward compat — may resolve to per-session file
    archiveDir: p.archiveDir,
    brainPath: p.brain,
    templatePath: p.sessionTemplate,
    manifestPath: p.sessionsManifest,
    templatesDir: p.templatesDir,
    sessionsDir: p.sessionsDir,
    hierarchyPath: p.hierarchy,
    logsDir: p.logsDir,
  };
}

// ============================================================
// Section 2: Session Template
// ============================================================

/**
 * Generate the session template content.
 * This defines the structure every session file must follow.
 *
 * @consumer initializePlanningDirectory, instantiateSession
 */
export function getSessionTemplate(): string {
  return `---
session_id: ""
stamp: ""
mode: ""
governance_status: "LOCKED"
created: 0
last_updated: 0
---

# Session: {stamp}

## Hierarchy
<!-- Rendered from hierarchy.json — do not edit manually -->

## Log
<!-- Append-only within same session. Chronological. -->

## Notes
<!-- Scratchpad — anything goes -->
`;
}

/**
 * Instantiate a session file from the template with concrete values.
 *
 * @consumer declare-intent.ts
 */
export function instantiateSession(opts: {
  sessionId: string;
  stamp: string;
  mode: string;
  governanceStatus?: string;
  created?: number;
  trajectory?: string;
  tactic?: string;
  action?: string;
  linkedPlans?: string[];
  turns?: number;
  drift?: number;
  hierarchyBody?: string;
}): string {
  const now = opts.created ?? Date.now();
  const hierarchyBody = opts.hierarchyBody ?? "No hierarchy declared.";
  const nowIso = new Date(now).toISOString();

  // Build frontmatter
  const frontmatter = {
    id: opts.sessionId,
    session_id: opts.sessionId,
    stamp: opts.stamp,
    type: "session",
    mode: opts.mode,
    governance: opts.governanceStatus ?? "OPEN",
    governance_status: opts.governanceStatus ?? "OPEN",
    trajectory: opts.trajectory ?? "",
    tactic: opts.tactic ?? "",
    action: opts.action ?? "",
    status: "active",
    created: nowIso,
    last_activity: nowIso,
    turns: opts.turns ?? 0,
    drift: opts.drift ?? 100,
    linked_plans: opts.linkedPlans ?? [],
    created_epoch: now,
    last_updated: now,
  };
  const yamlContent = stringify(frontmatter);

  return `---
${yamlContent}---

# Session: ${opts.stamp}

## Hierarchy
${hierarchyBody}

## Log
<!-- Session started: ${new Date(now).toISOString()} -->

## Notes
`;
}

// ============================================================
// Section 3: Manifest (Session Registry)
// ============================================================

/** Entry in the session manifest (relational layer type). */
export type ManifestEntry = SessionManifestEntry;

/** Full manifest structure (relational layer type). */
export type SessionManifest = RelationalSessionManifest;

/**
 * Read the manifest from disk. Returns empty manifest if not found.
 *
 * @consumer readActiveMd, writeActiveMd, archiveSession, declare-intent.ts
 */
export async function readManifest(projectRoot: string): Promise<SessionManifest> {
  const paths = getPlanningPaths(projectRoot);

  const manifest = await readTypedManifest<SessionManifest>(
    paths.manifestPath,
    createDefaultSessionManifest(),
  );
  return deduplicateSessionManifest(manifest);
}

/**
 * Write the manifest to disk.
 *
 * @consumer registerSession, archiveSession, compact-session.ts
 */
export async function writeManifest(
  projectRoot: string,
  manifest: SessionManifest
): Promise<void> {
  const paths = getPlanningPaths(projectRoot);
  await writeTypedManifest(paths.manifestPath, deduplicateSessionManifest(manifest));
}

/**
 * Register a new session in the manifest and set it as active.
 *
 * @consumer declare-intent.ts
 */
export async function registerSession(
  projectRoot: string,
  stamp: string,
  fileName: string,
  meta?: {
    created?: number
    mode?: string
    trajectory?: string
    linkedPlans?: string[]
  },
): Promise<SessionManifest> {
  const manifest = await readManifest(projectRoot);

  const updated = registerSessionInManifest(manifest, {
    stamp,
    file: fileName,
    created: meta?.created ?? Date.now(),
    mode: meta?.mode,
    trajectory: meta?.trajectory,
    linked_plans: meta?.linkedPlans ?? [],
  });

  await writeManifest(projectRoot, updated);
  return updated;
}

/**
 * Get the file path of the currently active session.
 * Falls back to legacy active.md if no manifest exists.
 *
 * @consumer readActiveMd, writeActiveMd
 */
export async function getActiveSessionPath(projectRoot: string): Promise<string> {
  const paths = getPlanningPaths(projectRoot);
  const effective = getEffectivePaths(projectRoot)
  const manifest = await readManifest(projectRoot);

  if (manifest.active_stamp) {
    const entry = manifest.sessions.find(
      (s) => s.stamp === manifest.active_stamp && s.status === "active"
    );
    if (entry) {
      const activePath = join(effective.activeDir, entry.file)
      if (existsSync(activePath)) return activePath
      return join(paths.sessionsDir, entry.file)
    }
  }

  // Fallback: legacy active.md
  return paths.activePath;
}

// ============================================================
// Section 4: Read-Before-Write Guard (FileGuard)
// ============================================================

/** Tracks file read state for write enforcement */
export interface FileGuard {
  /** Stamp of session file last read */
  last_read_stamp: string;
  /** Line count at read time */
  last_read_line_count: number;
  /** Epoch ms of last read */
  last_read_time: number;
}

/**
 * Create a FileGuard from a session file read.
 *
 * @consumer readSessionFile
 */
export function createFileGuard(stamp: string, lineCount: number): FileGuard {
  return {
    last_read_stamp: stamp,
    last_read_line_count: lineCount,
    last_read_time: Date.now(),
  };
}

// ============================================================
// Section 5: Session File I/O (New Architecture)
// ============================================================

async function resolveSessionFilePathByStamp(
  projectRoot: string,
  stamp: string,
): Promise<string> {
  const paths = getPlanningPaths(projectRoot)
  const manifest = await readManifest(projectRoot)
  const entry = manifest.sessions.find((s) => s.stamp === stamp)

  if (entry) {
    if (entry.status === "active") {
      const activePath = join(getEffectivePaths(projectRoot).activeDir, entry.file)
      if (existsSync(activePath)) return activePath
    }

    const archivedPath = join(paths.archiveDir, entry.file)
    if (existsSync(archivedPath)) return archivedPath

    const sessionPath = join(paths.sessionsDir, entry.file)
    if (existsSync(sessionPath)) return sessionPath
  }

  const sanitizedStamp = basename(stamp)
  const byStampInActiveDir = join(getEffectivePaths(projectRoot).activeDir, `${sanitizedStamp}.md`)
  if (existsSync(byStampInActiveDir)) return byStampInActiveDir

  const byStampInSessionsDir = join(paths.sessionsDir, `${sanitizedStamp}.md`)
  if (existsSync(byStampInSessionsDir)) return byStampInSessionsDir

  return byStampInActiveDir
}

/**
 * Read a session file by stamp, returning parsed content.
 * Updates the FileGuard with read metadata.
 *
 * @consumer readActiveMd (delegates here for manifest-based sessions)
 */
export async function readSessionFile(
  projectRoot: string,
  stamp: string
): Promise<ActiveMdContent> {
  const filePath = await resolveSessionFilePathByStamp(projectRoot, stamp)

  try {
    const content = await readFile(filePath, "utf-8");
    return parseActiveMd(content);
  } catch {
    return { frontmatter: {}, body: "" };
  }
}

/**
 * Write to a session file with read-before-write enforcement.
 *
 * If the session_id in the file matches the current session (same stamp),
 * only appending to the ## Log section is allowed.
 *
 * @consumer writeActiveMd (delegates here for manifest-based sessions)
 */
export async function writeSessionFile(
  projectRoot: string,
  stamp: string,
  content: ActiveMdContent
): Promise<void> {
  const filePath = await resolveSessionFilePathByStamp(projectRoot, stamp)
  await mkdir(dirname(filePath), { recursive: true })

  const yamlContent = stringify(content.frontmatter);
  const fullContent = `---\n${yamlContent}---\n\n${content.body}`;

  await writeFile(filePath, fullContent);
}

/**
 * Append a log entry to the active session file's ## Log section.
 * Enforces append-only within the same session.
 *
 * @consumer map-context.ts
 */
export async function appendToSessionLog(
  projectRoot: string,
  stamp: string,
  logEntry: string
): Promise<void> {
  const filePath = await resolveSessionFilePathByStamp(projectRoot, stamp)

  try {
    const content = await readFile(filePath, "utf-8")
    let lines = content.split("\n")

    // Get max lines from config (default to 50 if not available)
    let maxLines = 50
    try {
      const configPath = getEffectivePaths(projectRoot).config
      if (existsSync(configPath)) {
        const configContent = await readFile(configPath, "utf-8")
        const config = JSON.parse(configContent)
        if (config.max_active_md_lines) {
          maxLines = config.max_active_md_lines
        }
      }
    } catch {
      // Fallback to default if config read fails
    }

    // Check if we need to compact the log
    const logLineCount = countLogLines(lines)
    if (logLineCount >= maxLines) {
      lines = compactLogSection(lines, maxLines)
    }

    // Find the ## Log section and append after it
    let logIndex = -1
    let notesIndex = -1
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === "## Log") logIndex = i
      if (lines[i].trim() === "## Notes") notesIndex = i
    }

    if (logIndex === -1) {
      // No ## Log section — append at end
      lines.push("", logEntry)
    } else if (notesIndex !== -1 && notesIndex > logIndex) {
      // Insert before ## Notes
      lines.splice(notesIndex, 0, logEntry, "")
    } else {
      // Append at end of file
      lines.push(logEntry)
    }

    const newContent = lines.join("\n")
    await writeFile(filePath, newContent)
  } catch {
    // File doesn't exist — create with just the log entry
    const minimal = `---\nsession_id: "${stamp}"\n---\n\n## Log\n${logEntry}\n`
    await writeFile(filePath, minimal)
  }
}

/** Count number of log lines in the session file */
function countLogLines(lines: string[]): number {
  let logIndex = -1
  let notesIndex = -1
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === "## Log") logIndex = i
    if (lines[i].trim() === "## Notes") notesIndex = i
  }

  if (logIndex === -1) return 0
  
  const logStart = logIndex + 1
  const logEnd = notesIndex !== -1 ? notesIndex : lines.length
  
  let count = 0
  for (let i = logStart; i < logEnd; i++) {
    if (lines[i].trim()) count++
  }
  
  return count
}

/** Compact the log section to keep only the most recent lines */
function compactLogSection(lines: string[], maxLines: number): string[] {
  let logIndex = -1
  let notesIndex = -1
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === "## Log") logIndex = i
    if (lines[i].trim() === "## Notes") notesIndex = i
  }

  if (logIndex === -1) return lines
  
  const logStart = logIndex + 1
  const logEnd = notesIndex !== -1 ? notesIndex : lines.length
  
  // Extract and filter log lines
  const logLines: string[] = []
  for (let i = logStart; i < logEnd; i++) {
    if (lines[i].trim()) logLines.push(lines[i])
  }

  // Keep only the most recent lines
  const keptLines = logLines.slice(-Math.floor(maxLines * 0.8)) // Keep 80% of max lines when compacting
  
  // Replace old log section with compacted version
  const before = lines.slice(0, logStart)
  const after = lines.slice(logEnd)
  
  return [...before, ...keptLines, ...after]
}

/**
 * Update the ## Hierarchy section of a session file.
 * This is NOT append-only — hierarchy is regenerated from the tree.
 *
 * @consumer map-context.ts, declare-intent.ts
 */
export async function updateSessionHierarchy(
  projectRoot: string,
  stamp: string,
  hierarchyBody: string
): Promise<void> {
  const filePath = await resolveSessionFilePathByStamp(projectRoot, stamp)

  try {
    const content = await readFile(filePath, "utf-8");
    const lines = content.split("\n");

    // Find ## Hierarchy and ## Log sections
    let hierStart = -1;
    let logStart = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === "## Hierarchy") hierStart = i;
      if (lines[i].trim() === "## Log") logStart = i;
    }

    if (hierStart !== -1 && logStart !== -1 && logStart > hierStart) {
      // Replace everything between ## Hierarchy and ## Log
      const before = lines.slice(0, hierStart + 1);
      const after = lines.slice(logStart);
      const newContent = [...before, hierarchyBody, "", ...after].join("\n");
      await writeFile(filePath, newContent);
    }
  } catch {
    // Silently fail — file may not exist yet
  }
}

// ============================================================
// Section 6: Legacy API (Backward Compatible)
// ============================================================

export interface ActiveMdContent {
  frontmatter: {
    id?: string;
    session_id?: string;
    stamp?: string;
    type?: string;
    mode?: string;
    governance?: string;
    governance_status?: string;
    trajectory?: string;
    tactic?: string;
    action?: string;
    status?: string;
    last_activity?: string;
    turns?: number;
    drift?: number;
    linked_plans?: string[];
    start_time?: number;
    last_updated?: number;
    created?: number;
    date?: string;
    meta_key?: string;
    role?: string;
    by_ai?: boolean;
  };
  body: string;
}

export async function initializePlanningDirectory(
  projectRoot: string
): Promise<PlanningPaths> {
  const paths = getPlanningPaths(projectRoot);
  const effective = getEffectivePaths(projectRoot)

  // Create full v2 directory tree
  for (const dir of getAllDirectories(projectRoot)) {
    await mkdir(dir, { recursive: true })
  }

  // Keep legacy sessions/ helpers for backward compatibility
  await mkdir(paths.sessionsDir, { recursive: true })
  await mkdir(paths.archiveDir, { recursive: true })

  // Ensure root and folder manifests exist
  await ensureCoreManifests(effective)

  // Create session template if not exists
  if (!existsSync(paths.templatePath)) {
    await writeFile(paths.templatePath, getSessionTemplate());
  }

  // Create placeholder tasks file if missing
  if (!existsSync(effective.tasks)) {
    await writeFile(effective.tasks, JSON.stringify({ tasks: [], active_task_id: null, updated_at: Date.now() }, null, 2))
  }

  // Create manifest if not exists
  if (!existsSync(paths.manifestPath)) {
    await writeManifest(projectRoot, { sessions: [], active_stamp: null });
  }

  // Create root INDEX.md (hop-or-continue entry)
  if (!existsSync(paths.indexPath)) {
    await generateIndexMd(projectRoot)
  }

  // Create legacy sessions/index.md if not exists (kept for backward compat)
  const legacySessionsIndex = join(paths.sessionsDir, "index.md")
  if (!existsSync(legacySessionsIndex)) {
    await writeFile(legacySessionsIndex, generateIndexTemplate())
  }

  // Create active.md if not exists (legacy — kept for backward compat)
  if (!existsSync(paths.activePath)) {
    await writeFile(paths.activePath, generateActiveTemplate());
  }

  return paths;
}

export async function readActiveMd(
  projectRoot: string
): Promise<ActiveMdContent> {
  const paths = getPlanningPaths(projectRoot);

  // Try manifest-based resolution first
  const manifest = await readManifest(projectRoot);
  if (manifest.active_stamp) {
    const entry = manifest.sessions.find(
      (s) => s.stamp === manifest.active_stamp && s.status === "active"
    );
    if (entry) {
      return readSessionFile(projectRoot, entry.stamp);
    }
  }

  // Fallback: legacy active.md
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

export function parseSessionFrontmatter(content: string): Record<string, unknown> {
  return parseActiveMd(content).frontmatter;
}

export function updateSessionFrontmatter(
  content: string,
  updates: Record<string, unknown>
): string {
  const parsed = parseActiveMd(content)
  const nextFrontmatter = {
    ...parsed.frontmatter,
    ...updates,
  }
  const yamlContent = stringify(nextFrontmatter)
  return `---\n${yamlContent}---\n\n${parsed.body}`
}

export async function writeActiveMd(
  projectRoot: string,
  content: ActiveMdContent
): Promise<void> {
  const paths = getPlanningPaths(projectRoot);

  // Try manifest-based resolution
  const manifest = await readManifest(projectRoot);
  if (manifest.active_stamp) {
    const entry = manifest.sessions.find(
      (s) => s.stamp === manifest.active_stamp && s.status === "active"
    );
    if (entry) {
      await writeSessionFile(projectRoot, entry.stamp, content);
      return;
    }
  }

  // Fallback: legacy active.md
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
  const effective = getEffectivePaths(projectRoot)

  // Check if this is a manifest-based session
  const manifest = await readManifest(projectRoot);
  const entry = manifest.sessions.find(
    (s) => s.stamp === manifest.active_stamp && s.status === "active"
  );

  if (entry) {
    const sourceCandidates = [
      join(effective.activeDir, entry.file),
      join(paths.sessionsDir, entry.file),
    ]
    const srcPath = sourceCandidates.find((p) => existsSync(p))

    const archiveFileName = /^\d{4}-\d{2}-\d{2}-/.test(entry.file)
      ? entry.file
      : buildArchiveFilename(new Date(entry.created || Date.now()), entry.mode || "plan_driven", entry.trajectory || "session")
    const dstPath = join(paths.archiveDir, archiveFileName)

    let archiveContent = content
    archiveContent = updateSessionFrontmatter(archiveContent, {
      id: entry.stamp,
      session_id: entry.stamp,
      stamp: entry.stamp,
      type: "session",
      mode: entry.mode ?? "plan_driven",
      trajectory: entry.trajectory ?? "",
      status: "archived",
      last_activity: new Date().toISOString(),
      linked_plans: entry.linked_plans,
    })

    if (srcPath && srcPath !== dstPath) {
      await mkdir(dirname(dstPath), { recursive: true })
      await rename(srcPath, dstPath)
    }
    await writeFile(dstPath, archiveContent)

    entry.status = "archived"
    entry.file = archiveFileName
    manifest.active_stamp = null
    await writeManifest(projectRoot, manifest)
  } else {
    // Legacy archive
    const timestamp = new Date().toISOString().split("T")[0];
    const archiveFile = join(paths.archiveDir, `session_${timestamp}_${sessionId}.md`);
    await writeFile(
      archiveFile,
      updateSessionFrontmatter(content, {
        id: sessionId,
        session_id: sessionId,
        type: "session",
        status: "archived",
        last_activity: new Date().toISOString(),
      })
    );
  }
}

export async function generateIndexMd(projectRoot: string): Promise<string> {
  const paths = getPlanningPaths(projectRoot)
  const stateManager = createStateManager(projectRoot)
  const state = await stateManager.load()
  const manifest = await readManifest(projectRoot)
  const anchorsState = await loadAnchors(projectRoot)

  const mode = state?.session.mode ?? "(none)"
  const governance = state?.session.governance_status ?? "(none)"
  const trajectory = state?.hierarchy.trajectory ?? "(none)"
  const tactic = state?.hierarchy.tactic ?? "(none)"
  const turns = state?.metrics.turn_count ?? 0
  const drift = state?.metrics.drift_score ?? 100

  // Read recent summaries from manifest (authoritative source)
  const recentSummaries = manifest.sessions
    .filter((s) => s.summary && (s.status === "archived" || s.status === "compacted"))
    .sort((a, b) => b.created - a.created)
    .slice(0, 3)
    .reverse()
    .map((s) => {
      const date = new Date(s.created).toISOString().split("T")[0]
      return `- ${date}: ${s.summary}`
    })

  const lines = [
    "---",
    "type: index",
    "structure_version: \"2.0.0\"",
    `generated: ${new Date().toISOString()}`,
    "---",
    "# .hivemind — Context Governance State",
    "",
    "## Current State",
    `- Mode: ${mode} | Governance: ${governance}`,
    `- Trajectory: ${trajectory}`,
    `- Tactic: ${tactic}`,
    `- Turns: ${turns} | Drift: ${drift}/100`,
    `- Active: ${manifest.active_stamp ?? "(none)"}`,
    "",
    "## Quick Navigation",
    "- sessions/active/",
    "- sessions/archive/",
    "- state/",
    "- memory/mems.json",
  ]

  for (const anchor of anchorsState.anchors.slice(0, 3)) {
    lines.push(`- [${anchor.key}] ${anchor.value}`)
  }

  if (recentSummaries.length > 0) {
    lines.push("", "## Recent Session Summaries")
    lines.push(...recentSummaries)
  }

  const content = lines.slice(0, 30).join("\n") + "\n"
  await writeFile(paths.indexPath, content)
  return content
}

export async function updateIndexMd(
  projectRoot: string,
  summaryLine: string
): Promise<void> {
  // Update manifest summary for the most recent session without a summary
  try {
    const manifest = await readManifest(projectRoot);
    // Prefer archived/compacted, fall back to any session
    const target = [...manifest.sessions]
      .reverse()
      .find((s) => !s.summary && (s.status === "archived" || s.status === "compacted"))
      ?? [...manifest.sessions].reverse().find((s) => !s.summary);
    if (target) {
      target.summary = summaryLine;
      await writeManifest(projectRoot, manifest);
    }
  } catch {
    // Non-critical — manifest update is best-effort
  }

  // Regenerate root INDEX.md from manifest (authoritative source)
  await generateIndexMd(projectRoot)
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
date: ""
meta_key: ""
role: ""
by_ai: true
---

# Active Session

## Current Focus
<!-- Updated via map_context -->

## Plan
<!-- Living plan — tracks trajectory/tactic/action hierarchy -->

## Completed
<!-- Items marked [x] get archived -->

## Notes
<!-- Scratchpad - anything goes -->
`;
}

export function getExportDir(projectRoot: string): string {
  return join(getPlanningPaths(projectRoot).archiveDir, "exports");
}

export async function resetActiveMd(projectRoot: string): Promise<void> {
  const paths = getPlanningPaths(projectRoot);

  // Reset manifest active stamp
  try {
    const manifest = await readManifest(projectRoot);
    manifest.active_stamp = null;
    await writeManifest(projectRoot, manifest);
  } catch {
    // Non-critical
  }

  // Reset legacy active.md
  await writeFile(paths.activePath, generateActiveTemplate());
}
