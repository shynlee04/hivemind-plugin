import { join } from "path";
import { stringify } from "yaml";
import { getAllDirectories, getEffectivePaths } from "../paths.js";
import { createLogger, noopLogger, type Logger } from "../logging.js";

void getAllDirectories;

export const planningFsLoggerPromises = new Map<string, Promise<Logger>>();

export function getPlanningFsLogger(projectRoot: string): Promise<Logger> {
  let loggerPromise = planningFsLoggerPromises.get(projectRoot);
  if (!loggerPromise) {
    const paths = getEffectivePaths(projectRoot);
    loggerPromise = createLogger(paths.logsDir, "planning-fs").catch(() => noopLogger);
    planningFsLoggerPromises.set(projectRoot, loggerPromise);
  }
  return loggerPromise;
}

export interface PlanningPaths {
  projectRoot: string;
  planningDir: string;
  indexPath: string;
  activePath: string;
  archiveDir: string;
  brainPath: string;
  templatePath: string;
  /** Backward-compatible alias to sessions manifest path. */
  manifestPath: string;
  /** Path to sessions manifest (.hivemind/sessions/manifest.json). */
  sessionsManifestPath: string;
  /** Path to plans manifest (.hivemind/plans/manifest.json). */
  plansManifestPath: string;
  templatesDir: string;
  sessionsDir: string;
  hierarchyPath: string;
  logsDir: string;
}

export function getPlanningPaths(projectRoot: string): PlanningPaths {
  const p = getEffectivePaths(projectRoot);
  const sessionsManifestPath = p.sessionsManifest;
  return {
    projectRoot,
    planningDir: p.root,
    indexPath: p.index,
    activePath: join(p.sessionsDir, "active.md"),
    archiveDir: p.archiveDir,
    brainPath: p.brain,
    templatePath: p.sessionTemplate,
    manifestPath: sessionsManifestPath,
    sessionsManifestPath,
    plansManifestPath: p.plansManifest,
    templatesDir: p.templatesDir,
    sessionsDir: p.sessionsDir,
    hierarchyPath: p.hierarchy,
    logsDir: p.logsDir,
  };
}

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
