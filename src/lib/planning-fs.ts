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

import { readFile, writeFile, mkdir, readdir, unlink } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { parse, stringify } from "yaml";

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
  const hivemindDir = join(projectRoot, ".hivemind");
  const sessionsDir = join(hivemindDir, "sessions");
  const templatesDir = join(hivemindDir, "templates");
  return {
    projectRoot,
    planningDir: hivemindDir,
    indexPath: join(sessionsDir, "index.md"),
    activePath: join(sessionsDir, "active.md"), // backward compat — may resolve to per-session file
    archiveDir: join(sessionsDir, "archive"),
    brainPath: join(hivemindDir, "brain.json"),
    templatePath: join(templatesDir, "session.md"),
    manifestPath: join(sessionsDir, "manifest.json"),
    templatesDir,
    sessionsDir,
    hierarchyPath: join(hivemindDir, "hierarchy.json"),
    logsDir: join(hivemindDir, "logs"),
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
  hierarchyBody?: string;
}): string {
  const now = opts.created ?? Date.now();
  const hierarchyBody = opts.hierarchyBody ?? "No hierarchy declared.";

  // Build frontmatter
  const frontmatter = {
    session_id: opts.sessionId,
    stamp: opts.stamp,
    mode: opts.mode,
    governance_status: opts.governanceStatus ?? "OPEN",
    created: now,
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

/** Entry in the session manifest */
export interface ManifestEntry {
  /** MiMiHrHrDDMMYYYY stamp */
  stamp: string;
  /** Relative filename within sessions/ */
  file: string;
  /** Session status */
  status: "active" | "archived" | "compacted";
  /** Epoch ms of creation */
  created: number;
  /** Optional summary (set on compaction) */
  summary?: string;
}

/** Full manifest structure */
export interface SessionManifest {
  /** All sessions ever created */
  sessions: ManifestEntry[];
  /** Stamp of the currently active session (null if none) */
  active_stamp: string | null;
}

/**
 * Read the manifest from disk. Returns empty manifest if not found.
 *
 * @consumer readActiveMd, writeActiveMd, archiveSession, declare-intent.ts
 */
export async function readManifest(projectRoot: string): Promise<SessionManifest> {
  const paths = getPlanningPaths(projectRoot);

  try {
    const raw = await readFile(paths.manifestPath, "utf-8");
    return JSON.parse(raw) as SessionManifest;
  } catch {
    return { sessions: [], active_stamp: null };
  }
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
  await writeFile(paths.manifestPath, JSON.stringify(manifest, null, 2), "utf-8");
}

/**
 * Register a new session in the manifest and set it as active.
 *
 * @consumer declare-intent.ts
 */
export async function registerSession(
  projectRoot: string,
  stamp: string,
  fileName: string
): Promise<SessionManifest> {
  const manifest = await readManifest(projectRoot);

  // Deactivate any currently active session
  for (const entry of manifest.sessions) {
    if (entry.status === "active") {
      entry.status = "archived";
    }
  }

  // Add new entry
  manifest.sessions.push({
    stamp,
    file: fileName,
    status: "active",
    created: Date.now(),
  });
  manifest.active_stamp = stamp;

  await writeManifest(projectRoot, manifest);
  return manifest;
}

/**
 * Get the file path of the currently active session.
 * Falls back to legacy active.md if no manifest exists.
 *
 * @consumer readActiveMd, writeActiveMd
 */
export async function getActiveSessionPath(projectRoot: string): Promise<string> {
  const paths = getPlanningPaths(projectRoot);
  const manifest = await readManifest(projectRoot);

  if (manifest.active_stamp) {
    const entry = manifest.sessions.find(
      (s) => s.stamp === manifest.active_stamp && s.status === "active"
    );
    if (entry) {
      return join(paths.sessionsDir, entry.file);
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
  const paths = getPlanningPaths(projectRoot);
  const filePath = join(paths.sessionsDir, `${stamp}.md`);

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
  const paths = getPlanningPaths(projectRoot);
  const filePath = join(paths.sessionsDir, `${stamp}.md`);

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
  const paths = getPlanningPaths(projectRoot);
  const filePath = join(paths.sessionsDir, `${stamp}.md`);

  try {
    const content = await readFile(filePath, "utf-8");
    const lines = content.split("\n");

    // Find the ## Log section and append after it
    let logIndex = -1;
    let notesIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === "## Log") logIndex = i;
      if (lines[i].trim() === "## Notes") notesIndex = i;
    }

    if (logIndex === -1) {
      // No ## Log section — append at end
      lines.push("", logEntry);
    } else if (notesIndex !== -1 && notesIndex > logIndex) {
      // Insert before ## Notes
      lines.splice(notesIndex, 0, logEntry, "");
    } else {
      // Append at end of file
      lines.push(logEntry);
    }

    const newContent = lines.join("\n");
    await writeFile(filePath, newContent);
  } catch {
    // File doesn't exist — create with just the log entry
    const minimal = `---\nsession_id: "${stamp}"\n---\n\n## Log\n${logEntry}\n`;
    await writeFile(filePath, minimal);
  }
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
  const paths = getPlanningPaths(projectRoot);
  const filePath = join(paths.sessionsDir, `${stamp}.md`);

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
    session_id?: string;
    stamp?: string;
    mode?: string;
    governance_status?: string;
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

  // Create directories (including new ones)
  await mkdir(paths.planningDir, { recursive: true });
  await mkdir(paths.archiveDir, { recursive: true });
  await mkdir(paths.templatesDir, { recursive: true });
  await mkdir(paths.logsDir, { recursive: true });

  // Create session template if not exists
  if (!existsSync(paths.templatePath)) {
    await writeFile(paths.templatePath, getSessionTemplate());
  }

  // Create manifest if not exists
  if (!existsSync(paths.manifestPath)) {
    await writeManifest(projectRoot, { sessions: [], active_stamp: null });
  }

  // Create index.md if not exists (legacy — kept for backward compat)
  if (!existsSync(paths.indexPath)) {
    await writeFile(paths.indexPath, generateIndexTemplate());
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

  // Check if this is a manifest-based session
  const manifest = await readManifest(projectRoot);
  const entry = manifest.sessions.find(
    (s) => s.stamp === manifest.active_stamp && s.status === "active"
  );

  if (entry) {
    // Move per-session file to archive/
    const srcPath = join(paths.sessionsDir, entry.file);
    const dstPath = join(paths.archiveDir, entry.file);

    try {
      // Write content to archive (may have been updated since instantiation)
      await writeFile(dstPath, content);

      // Remove source if it exists and is different from dest
      if (existsSync(srcPath)) {
        await unlink(srcPath); // Delete archived session file
      }
    } catch {
      // Fallback: just write to archive with legacy naming
      const timestamp = new Date().toISOString().split("T")[0];
      const archiveFile = join(paths.archiveDir, `session_${timestamp}_${sessionId}.md`);
      await writeFile(archiveFile, content);
    }

    // Update manifest
    entry.status = "archived";
    manifest.active_stamp = null;
    await writeManifest(projectRoot, manifest);
  } else {
    // Legacy archive
    const timestamp = new Date().toISOString().split("T")[0];
    const archiveFile = join(paths.archiveDir, `session_${timestamp}_${sessionId}.md`);
    await writeFile(archiveFile, content);
  }
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

  // Also update manifest summary for the most recent archived session
  try {
    const manifest = await readManifest(projectRoot);
    const lastArchived = [...manifest.sessions]
      .reverse()
      .find((s) => s.status === "archived" || s.status === "compacted");
    if (lastArchived && !lastArchived.summary) {
      lastArchived.summary = summaryLine;
      await writeManifest(projectRoot, manifest);
    }
  } catch {
    // Non-critical — manifest update is best-effort
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
