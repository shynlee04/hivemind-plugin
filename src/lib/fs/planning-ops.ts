import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
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

const PROJECT_PLANNING_TEMPLATES: Record<string, string> = {
  "PROJECT.md": `# Project Vision

> Canonical readable planning root for HIVEMIND.

## Purpose
Stabilize HIVEMIND as a deterministic OpenCode-native orchestration framework with clean lineage routing, low-context drift, and reusable workflow contracts.

## Scope
- In scope:
  - \`.hivemind\` runtime composition and planning-root design
  - OpenCode-native session/workflow/delegation behavior
  - readable planning and governance source-of-truth under this directory
- Out of scope:
  - platform-specific sidecars as primary architecture
  - ad-hoc state stores outside the March 6 authority split

## Key Decisions
- JSON remains the deterministic runtime-state format for session, graph, hierarchy, and governance state.
- Markdown remains the readable source-of-truth for planning, decisions, milestones, and long-haul continuity.
- \`.hivemind/project/planning\` is the canonical readable planning root; legacy \`.planning/\` is compatibility-only.
- Dual-lineage work stays separated first and synthesized only after the overlap is explicit.
`,
  "REQUIREMENTS.md": `# Requirements

> Active long-haul requirements for the planning-root and orchestration redesign.

## Active Requirements

| ID | Description | Phase | Status |
|----|-------------|-------|--------|
| HM-PLAN-001 | Establish \`.hivemind/project/planning\` as the canonical readable planning root in code and docs. | 1 | in_progress |
| HM-PLAN-002 | Preserve the March 6 authority split without creating a fourth state store. | 1 | locked |
| HM-PLAN-003 | Separate deterministic runtime state from readable planning/governance SOT. | 1 | in_progress |
| HM-PLAN-004 | Produce fresh manual Devin packets for runtime semantics, planning-root design, and continuity/delegation questions. | 2 | pending |
| HM-PLAN-005 | Normalize long-haul planning artifacts so init/bootstrap, workflows, and handoffs point to one planning hierarchy. | 2 | pending |
`,
  "ROADMAP.md": `# Roadmap

> Strategic execution order for the current long-haul resync.

## Phases

| Phase | Name | Status | Progress |
|-------|------|--------|----------|
| 1 | Bootstrap and composition audit | in_progress | 60% |
| 2 | Planning-root normalization | in_progress | 35% |
| 3 | Manual Devin packet wave | pending | 0% |
| 4 | Long-haul master-plan replacement | pending | 0% |
| 5 | Post-resync implementation return | pending | 0% |
`,
  "STATE.md": `# Project State

> Cross-session planning SOT. Runtime truth still lives in JSON authorities.

## Current Position
The March 6 implementation baseline is complete. The active pivot is a deeper architectural resync on how init/bootstrap and later automation form \`.hivemind\`, how readable planning should be structured, and how external synthesis should be packetized for manual Devin handoff.

## Active Blockers
- Direct GX-Pack fallback runtime coverage still lacks a stable import/test harness.
- Planning-root consumers still include legacy \`.planning/\` assumptions.
- Readable planning root is scaffolded but not yet fully normalized into live SOT.

## Recent Decisions
- Keep the March 6 authority split locked: injection = cognitive packer, navigation = hierarchy tree, metadata = brain state.
- Keep child-session lineage runtime-only until a later explicit decision reopens persistence.
- Use \`.hivemind/project/planning\` as the canonical readable planning root.
- Use fresh dated question packets for manual Devin research loops instead of reusing mixed prompt-plus-reply artifacts.

## Session History
- [2026-03-06] Completed the child-session minimization tranche and state-authority rationalization pass.
- [2026-03-06] Pivoted from immediate runtime cleanup to deeper planning/composition resynchronization.
`,
  "MILESTONES.md": `# Milestones

> Archive completed long-haul milestones here after they clear verification.

## Completed
- 2026-03-06: task_id continuity, traverse v1, prompt-surface ownership lock, tool-gate advisory demotion, child-session minimization, and state-authority rationalization pass.
`,
};

const PROJECT_PLANNING_CONFIG = {
  version: "2026-03-06",
  planning_root: ".hivemind/project/planning",
  readable_sot_root: ".hivemind/project/planning",
  runtime_state_root: ".hivemind",
  storage_model: {
    runtime_state: "json",
    readable_sot: "markdown",
  },
  lineage_policy: {
    primary_lineages: ["hivefiver", "hiveminder"],
    synthesis_rule: "analyze separately first, synthesize only after overlap is explicit",
  },
  migration_policy: {
    gsd_model: "adapted",
    legacy_roots: [".planning"],
    legacy_mode: "compatibility_only",
  },
  research_policy: {
    deepwiki_mode: "manual_packet_only",
    devin_mode: "manual_packet_only",
    local_repo_truth_precedence: true,
  },
}

const PROJECT_PLANNING_SUBDIRS = [
  "research",
  join("todos", "pending"),
  join("todos", "done"),
  join("debug", "active"),
  join("debug", "resolved"),
  "codebase",
  "phases",
] as const;

export async function initializePlanningProjectDir(
  rootDir: string,
): Promise<{ created: boolean; path: string }> {
  const planningDir = join(rootDir, "project", "planning");
  let created = false;

  if (!existsSync(planningDir)) {
    await mkdir(planningDir, { recursive: true });
    created = true;
  }

  for (const [fileName, content] of Object.entries(PROJECT_PLANNING_TEMPLATES)) {
    const filePath = join(planningDir, fileName);
    if (!existsSync(filePath)) {
      await writeFile(filePath, content);
      created = true;
    }
  }

  for (const subDir of PROJECT_PLANNING_SUBDIRS) {
    const fullSubDir = join(planningDir, subDir);
    if (!existsSync(fullSubDir)) {
      await mkdir(fullSubDir, { recursive: true });
      created = true;
    }

    const gitkeepPath = join(fullSubDir, ".gitkeep");
    if (!existsSync(gitkeepPath)) {
      await writeFile(gitkeepPath, "");
      created = true;
    }
  }

  const configPath = join(planningDir, "config.json");
  if (!existsSync(configPath)) {
    await writeFile(configPath, JSON.stringify(PROJECT_PLANNING_CONFIG, null, 2) + "\n");
    created = true;
  }

  return { created, path: planningDir };
}

/**
 * Ensure the canonical runtime/planning prerequisites exist without
 * re-materializing readability projections.
 *
 * This is the lighter-weight startup path for runtime/session flows that need
 * manifests, templates, task state, and canonical planning roots, but should
 * not behave like full project initialization.
 */
export async function ensurePlanningRuntimeReady(
  projectRoot: string,
): Promise<PlanningPaths> {
  const paths = getPlanningPaths(projectRoot);
  const effective = getEffectivePaths(projectRoot);

  for (const dir of getAllDirectories(projectRoot)) {
    await mkdir(dir, { recursive: true });
  }

  await initializePlanningProjectDir(join(projectRoot, ".hivemind"));
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

  return paths;
}

export async function initializePlanningDirectory(
  projectRoot: string,
): Promise<PlanningPaths> {
  const paths = await ensurePlanningRuntimeReady(projectRoot);

  if (!existsSync(paths.manifestPath)) {
    await writeManifest(projectRoot, { sessions: [], active_stamp: null });
  }

  // Readability projections are no longer eager startup outputs.
  // Root INDEX.md and sessions/index.md should be materialized on demand by
  // explicit projection/update flows instead of shaping bootstrap formation.
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
