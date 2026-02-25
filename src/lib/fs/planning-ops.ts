import { mkdir, readdir, readFile, rm, writeFile } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { parse } from "yaml";
import {
  ensureCoreManifests,
  deduplicateSessionManifest,
  type SessionManifest as RelationalSessionManifest,
  type SessionManifestEntry,
  writeManifest as writeTypedManifest,
} from "../manifest.js";
import { getEffectivePaths, getAllDirectories } from "../paths.js";
import { createStateManager } from "../persistence.js";
import { loadAnchors } from "../anchors.js";
import {
  getPlanningFsLogger,
  getPlanningPaths,
  getSessionTemplate,
  type PlanningPaths,
} from "./planning-paths.js";
import {
  parseSessionFrontmatter,
  readManifest,
  writeManifest,
} from "./session-io.js";

export async function initializePlanningDirectory(
  projectRoot: string,
): Promise<PlanningPaths> {
  const paths = getPlanningPaths(projectRoot);
  const effective = getEffectivePaths(projectRoot);

  for (const dir of getAllDirectories(projectRoot)) {
    await mkdir(dir, { recursive: true });
  }

  await mkdir(paths.sessionsDir, { recursive: true });
  await mkdir(paths.archiveDir, { recursive: true });

  await ensureCoreManifests(effective);

  if (!existsSync(paths.templatePath)) {
    await writeFile(paths.templatePath, getSessionTemplate());
  }

  if (!existsSync(effective.tasks)) {
    await writeFile(
      effective.tasks,
      JSON.stringify(
        {
          session_id: "unknown",
          updated_at: Date.now(),
          tasks: [],
        },
        null,
        2,
      ),
    );
  }

  if (!existsSync(paths.manifestPath)) {
    await writeManifest(projectRoot, { sessions: [], active_stamp: null });
  }

  if (!existsSync(paths.indexPath)) {
    await generateIndexMd(projectRoot);
  }

  const legacySessionsIndex = join(paths.sessionsDir, "index.md");
  if (!existsSync(legacySessionsIndex)) {
    await writeFile(legacySessionsIndex, generateIndexTemplate());
  }

  if (!existsSync(paths.activePath)) {
    await writeFile(paths.activePath, generateActiveTemplate());
  }

  return paths;
}

export async function generateIndexMd(projectRoot: string): Promise<string> {
  const paths = getPlanningPaths(projectRoot);
  const stateManager = createStateManager(projectRoot);
  const state = await stateManager.load();
  const manifest = await readManifest(projectRoot);
  const anchorsState = await loadAnchors(projectRoot);

  const mode = state?.session.mode ?? "(none)";
  const governance = state?.session.governance_status ?? "(none)";
  const trajectory = state?.hierarchy.trajectory ?? "(none)";
  const tactic = state?.hierarchy.tactic ?? "(none)";
  const turns = state?.metrics.turn_count ?? 0;
  const drift = state?.metrics.drift_score ?? 100;

  const recentSummaries = manifest.sessions
    .filter((s) => s.summary && (s.status === "archived" || s.status === "compacted"))
    .sort((a, b) => b.created - a.created)
    .slice(0, 3)
    .reverse()
    .map((s) => {
      const date = new Date(s.created).toISOString().split("T")[0];
      return `- ${date}: ${s.summary}`;
    });

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
  ];

  for (const anchor of anchorsState.anchors.slice(0, 3)) {
    lines.push(`- [${anchor.key}] ${anchor.value}`);
  }

  if (recentSummaries.length > 0) {
    lines.push("", "## Recent Session Summaries");
    lines.push(...recentSummaries);
  }

  const content = lines.slice(0, 30).join("\n") + "\n";
  await writeFile(paths.indexPath, content);
  return content;
}

export async function updateIndexMd(
  projectRoot: string,
  summaryLine: string,
): Promise<void> {
  try {
    const manifest = await readManifest(projectRoot);
    const target =
      [...manifest.sessions]
        .reverse()
        .find((s) => !s.summary && (s.status === "archived" || s.status === "compacted")) ??
      [...manifest.sessions].reverse().find((s) => !s.summary);
    if (target) {
      target.summary = summaryLine;
      await writeManifest(projectRoot, manifest);
    }
  } catch {
    // noop
  }

  await generateIndexMd(projectRoot);
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

export async function pruneOldArchives(
  directory: string,
  maxArchives: number = 20,
): Promise<number> {
  const archives = await listArchives(directory);
  if (maxArchives <= 0) {
    return 0;
  }

  if (archives.length <= maxArchives) {
    return 0;
  }

  const paths = getPlanningPaths(directory);
  const sorted = [...archives].sort();
  const toDelete = sorted.slice(0, sorted.length - maxArchives);

  for (const archive of toDelete) {
    await rm(join(paths.archiveDir, archive), { force: true });
  }

  return toDelete.length;
}

export async function getArchiveStats(directory: string): Promise<{
  totalArchives: number;
  oldestArchive: string | null;
  newestArchive: string | null;
}> {
  const archives = (await listArchives(directory)).sort();

  if (archives.length === 0) {
    return {
      totalArchives: 0,
      oldestArchive: null,
      newestArchive: null,
    };
  }

  return {
    totalArchives: archives.length,
    oldestArchive: archives[0] ?? null,
    newestArchive: archives[archives.length - 1] ?? null,
  };
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

  try {
    const manifest = await readManifest(projectRoot);
    manifest.active_stamp = null;
    await writeManifest(projectRoot, manifest);
  } catch {
    // noop
  }

  await writeFile(paths.activePath, generateActiveTemplate());
}

export async function regenerateManifests(projectRoot: string): Promise<void> {
  const paths = getPlanningPaths(projectRoot);
  const logger = await getPlanningFsLogger(projectRoot);

  await ensureCoreManifests(getEffectivePaths(projectRoot));

  const sessions: SessionManifestEntry[] = [];
  let activeStamp: string | null = null;

  const scanDir = async (
    dir: string,
    defaultStatus: "active" | "archived" | "compacted",
  ) => {
    try {
      if (!existsSync(dir)) return;
      const files = await readdir(dir);
      for (const file of files) {
        if (!file.endsWith(".md")) continue;
        const content = await readFile(join(dir, file), "utf-8");
        try {
          const fm = parseSessionFrontmatter(content) as Partial<SessionManifestEntry>;
          const fallback = parse(content) as Record<string, unknown>;

          if (fm.stamp || fm.session_id || fallback.stamp || fallback.session_id) {
            const stamp = fm.stamp || fm.session_id || fallback.stamp || fallback.session_id;
            const status = fm.status || defaultStatus;
            sessions.push({
              stamp: String(stamp),
              file,
              status,
              created: fm.created || Date.now(),
              summary: fm.summary,
              mode: fm.mode,
              trajectory: fm.trajectory,
              linked_plans: fm.linked_plans || [],
            });

            if (status === "active") {
              activeStamp = String(stamp);
            }
          }
        } catch (e) {
          await logger.warn(
            `[regenerateManifests] Failed to parse frontmatter for ${join(dir, file)}. Skipping. ${e instanceof Error ? e.message : String(e)}`,
          );
        }
      }
    } catch (e) {
      await logger.warn(
        `[regenerateManifests] Failed to scan directory ${dir}. Skipping. ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  };

  await scanDir(paths.sessionsDir, "active");
  await scanDir(paths.archiveDir, "archived");

  const manifest: RelationalSessionManifest = {
    sessions,
    active_stamp: activeStamp,
  };

  const deduped = deduplicateSessionManifest(manifest);
  await writeTypedManifest(paths.manifestPath, deduped);
}
