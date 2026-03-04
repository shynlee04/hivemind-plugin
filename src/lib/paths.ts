/**
 * Centralized Path Resolver — Single Source of Truth
 *
 * Every .hivemind/ path in the codebase MUST resolve through this file.
 * Zero hardcoded join() calls for .hivemind/ paths should exist elsewhere.
 *
 * Target structure (v2.0.0):
 *   .hivemind/
 *   ├── INDEX.md
 *   ├── manifest.json
 *   ├── config.json
 *   │
 *   │  ── Level 0: Governance SOT (source of truth) ──
 *   ├── codemap/        → {future} codebase structure, deps, ownership
 *   ├── codewiki/       → {future} synthesized knowledge, patterns, decisions
 *   │
 *   │  ── Level 1-4: Operational entities ──
 *   ├── state/          → brain.json, hierarchy.json, anchors.json, tasks.json
 *   ├── memory/         → mems.json
 *   ├── sessions/       → manifest.json, active/, archive/exports/
 *   ├── plans/          → manifest.json
 *   ├── logs/
 *   ├── docs/
 *   └── templates/      → session.md
 */

import { basename, join, resolve, sep } from "path"
import { existsSync } from "fs"
import { readFile } from "fs/promises"

// ─── Constants ───────────────────────────────────────────────────────

/** Bumped when the .hivemind/ directory structure changes. */
export const STRUCTURE_VERSION = "2.0.0"

/** The root directory name — single definition. */
export const HIVEMIND_DIR = ".hivemind"

// ─── Types ───────────────────────────────────────────────────────────

export interface HivemindPaths {
  root: string              // .hivemind/
  config: string            // .hivemind/config.json
  index: string             // .hivemind/INDEX.md
  rootManifest: string      // .hivemind/manifest.json

  // state/ (hot — updated every turn)
  stateDir: string
  stateManifest: string
  brain: string             // state/brain.json
  hierarchy: string         // state/hierarchy.json
  anchors: string           // state/anchors.json
  tasks: string             // state/tasks.json

  // memory/ (warm — cross-session intelligence)
  memoryDir: string
  memoryManifest: string
  mems: string              // memory/mems.json

  // system/ (daemon runtime files)
  systemDir: string
  daemonPid: string         // system/daemon.pid
  cmdQueue: string          // system/cmd_queue.jsonl
  processingQueue: string   // system/processing.jsonl

  // sessions/
  sessionsDir: string
  sessionsManifest: string
  activeDir: string         // sessions/active/
  archiveDir: string        // sessions/archive/
  exportsDir: string        // sessions/archive/exports/

  // plans/
  plansDir: string
  plansManifest: string

  // graph/ (v3.0 relational graph structure)
  graphDir: string
  graphTrajectory: string   // graph/trajectory.json
  graphPlans: string        // graph/plans.json
  graphTasks: string        // graph/tasks.json
  graphMems: string         // graph/mems.json
  graphOrphans: string      // graph/orphans.json (quarantine for invalid nodes)
  graphPendingChanges: string // graph/pending-changes.json
  graphVerificationLedger: string // graph/verification-ledger.json

  // graph/codebase/ (v2.9 SOT pillars)
  graphCodebaseDir: string
  graphCodebaseCodewikiDir: string
  graphCodebaseCodemapDir: string
  graphCodebaseCodeIntelDir: string
  graphCodebaseRepoKnowledgeDir: string

  // graph/project/ (root project lineage)
  graphProjectDir: string
  graphProjectJson: string
  graphProjectRequirementsDir: string
  graphProjectRoadmapDir: string
  graphProjectResearchDir: string
  graphProjectResearchArchitectureDir: string
  graphProjectResearchStacksDir: string
  graphProjectResearchPatternsDir: string
  graphProjectResearchPitfallsDir: string
  graphProjectResearchContextDir: string
  graphProjectResearchSummaryDir: string

  // governance SOT — Level 0 {future: codewiki + codemap}
  // These directories exist in the structure from day one.
  // They are the codebase source-of-truth that GOVERNS everything below:
  //   codemap → plans → sessions → tasks → sub-tasks
  codemapDir: string        // codemap/ — codebase structure, deps, ownership
  codemapManifest: string   // codemap/manifest.json
  codemapJson: string       // codemap/codemap.json
  compressedCodemapJson: string // codemap/compressed-codemap.json
  codewikiDir: string       // codewiki/ — synthesized knowledge, patterns, decisions
  codewikiManifest: string  // codewiki/manifest.json

  // planning framework
  planTemplatesDir: string  // plans/templates/
  workflowsDir: string      // workflows/

  // other
  logsDir: string
  docsDir: string
  templatesDir: string
  sessionTemplate: string   // templates/session.md
}

export interface SessionPaths {
  sessionDir: string
  profile: string
}

/**
 * Legacy (v1.x) flat structure paths.
 * Kept for explicit migration tooling compatibility.
 */
export interface LegacyPaths {
  root: string
  brain: string
  hierarchy: string
  anchors: string
  mems: string
  config: string
  sessionsDir: string
  sessionsManifest: string
  archiveDir: string
  logsDir: string
  templatesDir: string
  sessionTemplate: string
}

// ─── Path Resolution ─────────────────────────────────────────────────

/**
 * Returns all .hivemind/ paths for the new v2.0.0 hierarchical structure.
 * Pure function — no I/O, no filesystem access.
 */
export function getHivemindPaths(projectRoot: string): HivemindPaths {
  const root = join(projectRoot, HIVEMIND_DIR)

  const stateDir = join(root, "state")
  const memoryDir = join(root, "memory")
  const sessionsDir = join(root, "sessions")
  const activeDir = join(sessionsDir, "active")
  const archiveDir = join(sessionsDir, "archive")
  const plansDir = join(root, "plans")
  const planTemplatesDir = join(plansDir, "templates")
  const workflowsDir = join(root, "workflows")
  const graphDir = join(root, "graph")
  const graphCodebaseDir = join(graphDir, "codebase")
  const graphCodebaseCodewikiDir = join(graphCodebaseDir, "codewiki")
  const graphCodebaseCodemapDir = join(graphCodebaseDir, "codemap")
  const graphCodebaseCodeIntelDir = join(graphCodebaseDir, "code-intel")
  const graphCodebaseRepoKnowledgeDir = join(graphCodebaseDir, "repoknowledge")
  const graphProjectDir = join(graphDir, "project")
  const graphProjectRequirementsDir = join(graphProjectDir, "requirements")
  const graphProjectRoadmapDir = join(graphProjectDir, "roadmap")
  const graphProjectResearchDir = join(graphProjectDir, "research")
  const graphProjectResearchArchitectureDir = join(graphProjectResearchDir, "architecture")
  const graphProjectResearchStacksDir = join(graphProjectResearchDir, "stacks")
  const graphProjectResearchPatternsDir = join(graphProjectResearchDir, "patterns")
  const graphProjectResearchPitfallsDir = join(graphProjectResearchDir, "pitfalls")
  const graphProjectResearchContextDir = join(graphProjectResearchDir, "context")
  const graphProjectResearchSummaryDir = join(graphProjectResearchDir, "summary")
  const codemapDir = join(root, "codemap")
  const codewikiDir = join(root, "codewiki")
  const logsDir = join(root, "logs")
  const docsDir = join(root, "docs")
  const templatesDir = join(root, "templates")

  return {
    root,
    config: join(root, "config.json"),
    index: join(root, "INDEX.md"),
    rootManifest: join(root, "manifest.json"),

    stateDir,
    stateManifest: join(stateDir, "manifest.json"),
    brain: join(stateDir, "brain.json"),
    hierarchy: join(stateDir, "hierarchy.json"),
    anchors: join(stateDir, "anchors.json"),
    tasks: join(stateDir, "tasks.json"),

    memoryDir,
    memoryManifest: join(memoryDir, "manifest.json"),
    mems: join(memoryDir, "mems.json"),

    systemDir: join(root, "system"),
    daemonPid: join(root, "system", "daemon.pid"),
    cmdQueue: join(root, "system", "cmd_queue.jsonl"),
    processingQueue: join(root, "system", "processing.jsonl"),

    sessionsDir,
    sessionsManifest: join(sessionsDir, "manifest.json"),
    activeDir,
    archiveDir,
    exportsDir: join(archiveDir, "exports"),

    plansDir,
    plansManifest: join(plansDir, "manifest.json"),
    planTemplatesDir,
    workflowsDir,

    graphDir,
    graphTrajectory: join(graphDir, "trajectory.json"),
    graphPlans: join(graphDir, "plans.json"),
    graphTasks: join(graphDir, "tasks.json"),
    graphMems: join(graphDir, "mems.json"),
    graphOrphans: join(graphDir, "orphans.json"),
    graphPendingChanges: join(graphDir, "pending-changes.json"),
    graphVerificationLedger: join(graphDir, "verification-ledger.json"),

    graphCodebaseDir,
    graphCodebaseCodewikiDir,
    graphCodebaseCodemapDir,
    graphCodebaseCodeIntelDir,
    graphCodebaseRepoKnowledgeDir,

    graphProjectDir,
    graphProjectJson: join(graphProjectDir, "project.json"),
    graphProjectRequirementsDir,
    graphProjectRoadmapDir,
    graphProjectResearchDir,
    graphProjectResearchArchitectureDir,
    graphProjectResearchStacksDir,
    graphProjectResearchPatternsDir,
    graphProjectResearchPitfallsDir,
    graphProjectResearchContextDir,
    graphProjectResearchSummaryDir,

    codemapDir,
    codemapManifest: join(codemapDir, "manifest.json"),
    codemapJson: join(codemapDir, "codemap.json"),
    compressedCodemapJson: join(codemapDir, "compressed-codemap.json"),
    codewikiDir,
    codewikiManifest: join(codewikiDir, "manifest.json"),

    logsDir,
    docsDir,
    templatesDir,
    sessionTemplate: join(templatesDir, "session.md"),
  }
}

/**
 * Returns deterministic paths for a single active session directory.
 */
export function getSessionPaths(projectRoot: string, sessionId: string): SessionPaths {
  const safeSessionId = sanitizeSessionStamp(sessionId) ?? sanitizeSessionFileName(sessionId)
  if (!safeSessionId) {
    throw new Error(`Invalid session id: ${sessionId}`)
  }

  const paths = getHivemindPaths(projectRoot)
  const sessionDir = join(paths.activeDir, safeSessionId)
  return {
    sessionDir,
    profile: join(sessionDir, "profile.json"),
  }
}

// ─── Structure Detection ─────────────────────────────────────────────

/**
 * Returns legacy flat structure paths for explicit migration commands.
 */
export function getLegacyPaths(projectRoot: string): LegacyPaths {
  const root = join(projectRoot, HIVEMIND_DIR)
  const sessionsDir = join(root, "sessions")
  const templatesDir = join(root, "templates")
  return {
    root,
    brain: join(root, "brain.json"),
    hierarchy: join(root, "hierarchy.json"),
    anchors: join(root, "anchors.json"),
    mems: join(root, "mems.json"),
    config: join(root, "config.json"),
    sessionsDir,
    sessionsManifest: join(sessionsDir, "manifest.json"),
    archiveDir: join(sessionsDir, "archive"),
    logsDir: join(root, "logs"),
    templatesDir,
    sessionTemplate: join(templatesDir, "session.md"),
  }
}

/**
 * Detects whether the project uses the legacy flat structure.
 * Used by explicit migration commands only (runtime pathing no longer branches).
 */
export function isLegacyStructure(projectRoot: string): boolean {
  const legacy = getLegacyPaths(projectRoot)
  const newPaths = getHivemindPaths(projectRoot)
  return existsSync(legacy.brain) && !existsSync(newPaths.stateDir)
}

/**
 * Returns true if the project has the new v2.0.0 structure.
 * Checks: state/ directory exists AND root manifest.json exists.
 */
export function isNewStructure(projectRoot: string): boolean {
  const paths = getHivemindPaths(projectRoot)
  return existsSync(paths.stateDir) && existsSync(paths.rootManifest)
}

/**
 * Returns true if .hivemind/ exists at all (any structure version).
 */
export function hivemindExists(projectRoot: string): boolean {
  return existsSync(join(projectRoot, HIVEMIND_DIR))
}

// ─── Effective Path Resolution (bridge for pre/post-migration) ───────

/**
 * Returns the correct paths for the CURRENT structure on disk.
 *
 * - If new v2.0.0 structure detected → returns getHivemindPaths() (state/brain.json, memory/mems.json, etc.)
 * - If legacy flat structure detected → returns HivemindPaths type but with legacy file locations
 * - If nothing exists (fresh) → returns getHivemindPaths() (new structure for fresh installs)
 *
 * All consumers should call this instead of hardcoded join() calls.
 * When migration runs (Task 4), files move → isNewStructure() flips → paths auto-update.
 */
export function getEffectivePaths(projectRoot: string): HivemindPaths {
  return getHivemindPaths(projectRoot)
}

// ─── Security: Session Path Sanitization ────────────────────────────

/** Safe characters for session stamps/filenames. */
const SAFE_SESSION_SEGMENT = /^[a-zA-Z0-9._-]+$/

/**
 * Validate a manifest-provided session file name.
 * Rejects any path-like values (e.g. "../x.md", "a/b.md", absolute paths).
 */
export function sanitizeSessionFileName(file: string): string | null {
  if (!file || typeof file !== "string") return null
  const trimmed = file.trim()
  if (!trimmed) return null

  const base = basename(trimmed)
  if (base !== trimmed) return null
  if (!SAFE_SESSION_SEGMENT.test(base)) return null
  return base
}

/**
 * Validate and normalize a session stamp (without extension).
 * Rejects path-like stamps and disallowed characters.
 */
export function sanitizeSessionStamp(stamp: string): string | null {
  if (!stamp || typeof stamp !== "string") return null
  const trimmed = stamp.trim()
  if (!trimmed) return null

  const withoutExt = trimmed.endsWith(".md") ? trimmed.slice(0, -3) : trimmed
  const base = basename(withoutExt)
  if (base !== withoutExt) return null
  if (!SAFE_SESSION_SEGMENT.test(base)) return null
  return base
}

/**
 * Safely join a validated filename under a base directory.
 * Returns null if the resulting path escapes the base directory.
 */
export function safeJoinWithin(baseDir: string, fileName: string): string | null {
  const safeFile = sanitizeSessionFileName(fileName)
  if (!safeFile) return null

  const candidate = resolve(baseDir, safeFile)
  const base = resolve(baseDir)
  if (candidate === base || candidate.startsWith(base + sep)) {
    return candidate
  }
  return null
}

// ─── Session Filename Builders ───────────────────────────────────────

/**
 * Slugify a trajectory string for use in filenames.
 * "Phase 03: .hivemind reorg" → "phase-03-hivemind-reorg"
 */
export function slugify(text: string, maxLength = 40): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")   // strip non-alphanumeric (keep spaces, hyphens)
    .replace(/\s+/g, "-")           // spaces → hyphens
    .replace(/-+/g, "-")            // collapse multiple hyphens
    .replace(/^-|-$/g, "")          // trim leading/trailing hyphens
    .slice(0, maxLength)
    .replace(/-$/, "")              // trim trailing hyphen after slice
}

/**
 * Build a human-readable session filename.
 * @param date  ISO date string or Date — only the YYYY-MM-DD part is used
 * @param mode  Session mode: plan_driven, quick_fix, exploration
 * @param trajectorySlug  Trajectory text (will be slugified if not already)
 * @returns e.g. "2026-02-13-plan_driven-phase-03-hivemind-reorg.md"
 */
export function buildSessionFilename(
  seed: string | Date,
  mode: string,
  trajectorySlug: string,
): string {
  void mode

  const safeTrajectory = slugify(trajectorySlug)
  const isUuidSeed =
    typeof seed === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(seed)

  const shouldUseSeed =
    typeof seed === "string" &&
    !/^\d{4}-\d{2}-\d{2}/.test(seed) &&
    !seed.includes("T")

  const seededSlug = isUuidSeed
    ? seed.toLowerCase()
    : shouldUseSeed
      ? slugify(seed, 64)
      : ""

  const safePart = seededSlug || safeTrajectory || "session"
  return `session-${safePart}.md`
}

/**
 * Build a human-readable archive filename.
 * Same format as session filename — archives are just moved session files.
 */
export function buildArchiveFilename(
  seed: string | Date,
  mode: string,
  trajectorySlug: string,
): string {
  return buildSessionFilename(seed, mode, trajectorySlug)
}

// ─── Active Session Resolution ───────────────────────────────────────

/**
 * Session manifest entry shape (minimal — just what we need for lookup).
 */
interface SessionManifestEntry {
  stamp: string
  file: string
  status: string
}

interface SessionManifest {
  sessions: SessionManifestEntry[]
  active_stamp: string | null
}

/**
 * Resolve the active session file path by reading the sessions manifest.
 * Returns null if no active session or manifest doesn't exist.
 *
 * This is the ONLY function in paths.ts that does I/O — it reads the
 * sessions manifest to find the active session's filename.
 */
export async function getActiveSessionPath(
  projectRoot: string,
): Promise<string | null> {
  const paths = getHivemindPaths(projectRoot)

  if (!existsSync(paths.sessionsManifest)) {
    return null
  }

  try {
    const raw = await readFile(paths.sessionsManifest, "utf-8")
    const manifest = JSON.parse(raw) as SessionManifest

    if (!manifest.active_stamp) {
      return null
    }

    // Find the entry matching the active stamp
    const entry = manifest.sessions.find(
      (s) => s.stamp === manifest.active_stamp,
    )
    if (!entry) {
      return null
    }

    // Active sessions live in sessions/active/ in the new structure
    return safeJoinWithin(paths.activeDir, entry.file)
  } catch {
    return null
  }
}

// ─── Directory List (for init / migration) ───────────────────────────

/**
 * Returns the list of all directories that must exist in the v2.0.0 structure.
 * Used by init and migration to create the full directory tree.
 */
export function getAllDirectories(projectRoot: string): string[] {
  const p = getHivemindPaths(projectRoot)
  return [
    p.root,
    p.stateDir,
    p.memoryDir,
    p.systemDir,
    p.sessionsDir,
    p.activeDir,
    p.archiveDir,
    p.exportsDir,
    p.plansDir,
    p.graphDir,
    p.graphCodebaseDir,
    p.graphCodebaseCodewikiDir,
    p.graphCodebaseCodemapDir,
    p.graphCodebaseCodeIntelDir,
    p.graphCodebaseRepoKnowledgeDir,
    p.graphProjectDir,
    p.graphProjectRequirementsDir,
    p.graphProjectRoadmapDir,
    p.graphProjectResearchDir,
    p.graphProjectResearchArchitectureDir,
    p.graphProjectResearchStacksDir,
    p.graphProjectResearchPatternsDir,
    p.graphProjectResearchPitfallsDir,
    p.graphProjectResearchContextDir,
    p.graphProjectResearchSummaryDir,
    p.codemapDir,
    p.codewikiDir,
    p.planTemplatesDir,
    p.workflowsDir,
    p.logsDir,
    p.docsDir,
    p.templatesDir,
  ]
}
