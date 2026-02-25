import { readFile, writeFile, mkdir, rename } from "fs/promises";
import { existsSync } from "fs";
import { dirname, join, extname, basename } from "path";
import { parse, stringify } from "yaml";
import {
  buildArchiveFilename,
  getEffectivePaths,
  safeJoinWithin,
  sanitizeSessionFileName,
  sanitizeSessionStamp,
} from "../paths.js";
import {
  createDefaultSessionManifest,
  deduplicateSessionManifest,
  readManifest as readTypedManifest,
  registerSessionInManifest,
  type SessionManifest as RelationalSessionManifest,
  type SessionManifestEntry,
  writeManifest as writeTypedManifest,
} from "../manifest.js";
import { type Logger } from "../logging.js";
import { getPlanningFsLogger, getPlanningPaths } from "./planning-paths.js";

export type ManifestEntry = SessionManifestEntry;
export type SessionManifest = RelationalSessionManifest;

export async function readManifest(projectRoot: string): Promise<SessionManifest> {
  const paths = getPlanningPaths(projectRoot);
  const manifest = await readTypedManifest<SessionManifest>(
    paths.manifestPath,
    createDefaultSessionManifest(),
  );
  return deduplicateSessionManifest(manifest);
}

export async function writeManifest(
  projectRoot: string,
  manifest: SessionManifest,
): Promise<void> {
  const paths = getPlanningPaths(projectRoot);
  await writeTypedManifest(paths.manifestPath, deduplicateSessionManifest(manifest));
}

export async function registerSession(
  projectRoot: string,
  stamp: string,
  fileName: string,
  meta?: {
    created?: number;
    mode?: string;
    trajectory?: string;
    linkedPlans?: string[];
    sessionId?: string;
  },
): Promise<SessionManifest> {
  const safeFile = sanitizeSessionFileName(fileName);
  if (!safeFile) {
    throw new Error(`Invalid session filename: ${fileName}`);
  }

  const manifest = await readManifest(projectRoot);

  const updated = registerSessionInManifest(manifest, {
    stamp,
    file: safeFile,
    created: meta?.created ?? Date.now(),
    mode: meta?.mode,
    trajectory: meta?.trajectory,
    session_id: meta?.sessionId,
    linked_plans: meta?.linkedPlans ?? [],
  });

  const logger: Logger = await getPlanningFsLogger(projectRoot);
  await logger.debug(
    `[registerSession] Registering session: ${stamp} ID: ${meta?.sessionId ?? "none"}`,
  );
  await logger.debug(
    `[registerSession] Updated manifest entry: ${JSON.stringify(updated.sessions.find((s) => s.stamp === stamp) ?? null)}`,
  );

  await writeManifest(projectRoot, updated);
  return updated;
}

export async function getActiveSessionPath(projectRoot: string): Promise<string> {
  const paths = getPlanningPaths(projectRoot);
  const effective = getEffectivePaths(projectRoot);
  const manifest = await readManifest(projectRoot);

  if (manifest.active_stamp) {
    const entry = manifest.sessions.find(
      (s) => s.stamp === manifest.active_stamp && s.status === "active",
    );
    if (entry) {
      const safeFile = sanitizeSessionFileName(entry.file);
      if (!safeFile) {
        return paths.activePath;
      }

      const activePath = safeJoinWithin(effective.activeDir, safeFile);
      if (activePath && existsSync(activePath)) return activePath;

      const sessionsPath = safeJoinWithin(paths.sessionsDir, safeFile);
      if (sessionsPath) return sessionsPath;
    }
  }

  return paths.activePath;
}

export interface FileGuard {
  last_read_stamp: string;
  last_read_line_count: number;
  last_read_time: number;
}

export function createFileGuard(stamp: string, lineCount: number): FileGuard {
  return {
    last_read_stamp: stamp,
    last_read_line_count: lineCount,
    last_read_time: Date.now(),
  };
}

async function resolveSessionFilePathByStamp(
  projectRoot: string,
  stamp: string,
): Promise<string> {
  const paths = getPlanningPaths(projectRoot);
  const effective = getEffectivePaths(projectRoot);
  const manifest = await readManifest(projectRoot);
  const safeStamp = sanitizeSessionStamp(stamp) ?? "invalid-stamp";
  const entry = manifest.sessions.find((s) => s.stamp === safeStamp);

  if (entry) {
    const safeFile = sanitizeSessionFileName(entry.file);
    if (!safeFile) {
      const fallback = safeJoinWithin(effective.activeDir, `${safeStamp}.md`);
      return fallback ?? join(effective.activeDir, "invalid-stamp.md");
    }

    if (entry.status === "active") {
      const activePath = safeJoinWithin(effective.activeDir, safeFile);
      if (activePath && existsSync(activePath)) return activePath;
    }

    const archivedPath = safeJoinWithin(paths.archiveDir, safeFile);
    if (archivedPath && existsSync(archivedPath)) return archivedPath;

    const sessionPath = safeJoinWithin(paths.sessionsDir, safeFile);
    if (sessionPath && existsSync(sessionPath)) return sessionPath;
  }

  const byStampInActiveDir = safeJoinWithin(effective.activeDir, `${safeStamp}.md`);
  if (byStampInActiveDir && existsSync(byStampInActiveDir)) return byStampInActiveDir;

  const byStampInSessionsDir = safeJoinWithin(paths.sessionsDir, `${safeStamp}.md`);
  if (byStampInSessionsDir && existsSync(byStampInSessionsDir)) return byStampInSessionsDir;

  return byStampInActiveDir ?? join(effective.activeDir, "invalid-stamp.md");
}

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
    summary?: string;
  };
  body: string;
}

export async function readSessionFile(
  projectRoot: string,
  stamp: string,
): Promise<ActiveMdContent> {
  const filePath = await resolveSessionFilePathByStamp(projectRoot, stamp);

  try {
    const content = await readFile(filePath, "utf-8");
    return parseActiveMd(content);
  } catch {
    return { frontmatter: {}, body: "" };
  }
}

export async function writeSessionFile(
  projectRoot: string,
  stamp: string,
  content: ActiveMdContent,
): Promise<void> {
  const filePath = await resolveSessionFilePathByStamp(projectRoot, stamp);
  await mkdir(dirname(filePath), { recursive: true });

  const yamlContent = stringify(content.frontmatter);
  const fullContent = `---\n${yamlContent}---\n\n${content.body}`;

  await writeFile(filePath, fullContent);
}

export async function appendToSessionLog(
  projectRoot: string,
  stamp: string,
  logEntry: string,
): Promise<void> {
  const filePath = await resolveSessionFilePathByStamp(projectRoot, stamp);

  try {
    const content = await readFile(filePath, "utf-8");
    let lines = content.split("\n");

    let maxLines = 50;
    try {
      const configPath = getEffectivePaths(projectRoot).config;
      if (existsSync(configPath)) {
        const configContent = await readFile(configPath, "utf-8");
        const config = JSON.parse(configContent);
        if (config.max_active_md_lines) {
          maxLines = config.max_active_md_lines;
        }
      }
    } catch {
      // noop
    }

    const logLineCount = countLogLines(lines);
    if (logLineCount >= maxLines) {
      lines = compactLogSection(lines, maxLines);
    }

    let logIndex = -1;
    let notesIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === "## Log") logIndex = i;
      if (lines[i].trim() === "## Notes") notesIndex = i;
    }

    if (logIndex === -1) {
      lines.push("", logEntry);
    } else if (notesIndex !== -1 && notesIndex > logIndex) {
      lines.splice(notesIndex, 0, logEntry, "");
    } else {
      lines.push(logEntry);
    }

    const newContent = lines.join("\n");
    await writeFile(filePath, newContent);
  } catch {
    const minimal = `---\nsession_id: "${stamp}"\n---\n\n## Log\n${logEntry}\n`;
    await writeFile(filePath, minimal);
  }
}

function countLogLines(lines: string[]): number {
  let logIndex = -1;
  let notesIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === "## Log") logIndex = i;
    if (lines[i].trim() === "## Notes") notesIndex = i;
  }

  if (logIndex === -1) return 0;

  const logStart = logIndex + 1;
  const logEnd = notesIndex !== -1 ? notesIndex : lines.length;

  let count = 0;
  for (let i = logStart; i < logEnd; i++) {
    if (lines[i].trim()) count++;
  }

  return count;
}

function compactLogSection(lines: string[], maxLines: number): string[] {
  let logIndex = -1;
  let notesIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === "## Log") logIndex = i;
    if (lines[i].trim() === "## Notes") notesIndex = i;
  }

  if (logIndex === -1) return lines;

  const logStart = logIndex + 1;
  const logEnd = notesIndex !== -1 ? notesIndex : lines.length;

  const logLines: string[] = [];
  for (let i = logStart; i < logEnd; i++) {
    if (lines[i].trim()) logLines.push(lines[i]);
  }

  const keptLines = logLines.slice(-Math.floor(maxLines * 0.8));
  const before = lines.slice(0, logStart);
  const after = lines.slice(logEnd);

  return [...before, ...keptLines, ...after];
}

export async function updateSessionHierarchy(
  projectRoot: string,
  stamp: string,
  hierarchyBody: string,
): Promise<void> {
  const filePath = await resolveSessionFilePathByStamp(projectRoot, stamp);

  try {
    const content = await readFile(filePath, "utf-8");
    const lines = content.split("\n");

    let hierStart = -1;
    let logStart = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === "## Hierarchy") hierStart = i;
      if (lines[i].trim() === "## Log") logStart = i;
    }

    if (hierStart !== -1 && logStart !== -1 && logStart > hierStart) {
      const before = lines.slice(0, hierStart + 1);
      const after = lines.slice(logStart);
      const newContent = [...before, hierarchyBody, "", ...after].join("\n");
      await writeFile(filePath, newContent);
    }
  } catch {
    // noop
  }
}

export async function readActiveMd(projectRoot: string): Promise<ActiveMdContent> {
  const paths = getPlanningPaths(projectRoot);

  const manifest = await readManifest(projectRoot);
  if (manifest.active_stamp) {
    const entry = manifest.sessions.find(
      (s) => s.stamp === manifest.active_stamp && s.status === "active",
    );
    if (entry) {
      return readSessionFile(projectRoot, entry.stamp);
    }
  }

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
      // fall through
    }
  }

  return { frontmatter: {}, body: content.trim() };
}

export function parseSessionFrontmatter(content: string): Record<string, unknown> {
  return parseActiveMd(content).frontmatter;
}

export function updateSessionFrontmatter(
  content: string,
  updates: Record<string, unknown>,
): string {
  const parsed = parseActiveMd(content);
  const nextFrontmatter = {
    ...parsed.frontmatter,
    ...updates,
  };
  const yamlContent = stringify(nextFrontmatter);
  return `---\n${yamlContent}---\n\n${parsed.body}`;
}

export async function writeActiveMd(
  projectRoot: string,
  content: ActiveMdContent,
): Promise<void> {
  const paths = getPlanningPaths(projectRoot);

  const manifest = await readManifest(projectRoot);
  if (manifest.active_stamp) {
    const entry = manifest.sessions.find(
      (s) => s.stamp === manifest.active_stamp && s.status === "active",
    );
    if (entry) {
      await writeSessionFile(projectRoot, entry.stamp, content);
      return;
    }
  }

  const yamlContent = stringify(content.frontmatter);
  const fullContent = `---\n${yamlContent}---\n\n${content.body}`;
  await writeFile(paths.activePath, fullContent);
}

export async function archiveSession(
  projectRoot: string,
  sessionId: string,
  content: string,
): Promise<void> {
  const paths = getPlanningPaths(projectRoot);
  const effective = getEffectivePaths(projectRoot);

  const manifest = await readManifest(projectRoot);
  const entry = manifest.sessions.find(
    (s) => s.stamp === manifest.active_stamp && s.status === "active",
  );

  if (entry) {
    const safeEntryFile = sanitizeSessionFileName(entry.file);
    const sourceCandidates = [
      safeEntryFile ? safeJoinWithin(effective.activeDir, safeEntryFile) : null,
      safeEntryFile ? safeJoinWithin(paths.sessionsDir, safeEntryFile) : null,
    ];
    const srcPath = sourceCandidates.find((p) => p && existsSync(p));

    const sessionSeed = Array.isArray(entry.session_id)
      ? (entry.session_id[0] ?? entry.stamp)
      : (entry.session_id ?? entry.stamp);

    const baseArchiveFileName =
      safeEntryFile ||
      buildArchiveFilename(
        sessionSeed || sessionId,
        entry.mode || "plan_driven",
        entry.trajectory || "session",
      );

    let archiveFileName = baseArchiveFileName;
    let counter = 1;
    while (existsSync(join(paths.archiveDir, archiveFileName))) {
      const ext = extname(baseArchiveFileName);
      const name = basename(baseArchiveFileName, ext);
      archiveFileName = `${name}-${counter}${ext}`;
      counter++;
    }
    const dstPath = join(paths.archiveDir, archiveFileName);

    let archiveContent = content;
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
    });

    if (srcPath && srcPath !== dstPath) {
      await mkdir(dirname(dstPath), { recursive: true });
      await rename(srcPath, dstPath);
    }
    await writeFile(dstPath, archiveContent);

    entry.status = "archived";
    entry.file = archiveFileName;
    manifest.active_stamp = null;
    await writeManifest(projectRoot, manifest);
  } else {
    const baseArchiveFileName = buildArchiveFilename(sessionId, "plan_driven", "session");
    let archiveFileName = baseArchiveFileName;
    let counter = 1;
    while (existsSync(join(paths.archiveDir, archiveFileName))) {
      const ext = extname(baseArchiveFileName);
      const name = basename(baseArchiveFileName, ext);
      archiveFileName = `${name}-${counter}${ext}`;
      counter++;
    }
    const archiveFile = join(paths.archiveDir, archiveFileName);
    await writeFile(
      archiveFile,
      updateSessionFrontmatter(content, {
        id: sessionId,
        session_id: sessionId,
        type: "session",
        status: "archived",
        last_activity: new Date().toISOString(),
      }),
    );
  }
}
