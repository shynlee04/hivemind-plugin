import { existsSync } from "fs"
import { mkdir, readFile, readdir, rename, unlink, writeFile } from "fs/promises"
import { basename, dirname, join } from "path"
import { parse, stringify } from "yaml"
import {
  buildArchiveFilename,
  buildSessionFilename,
  getAllDirectories,
  getHivemindPaths,
  getLegacyPaths,
  isLegacyStructure,
  isNewStructure,
  sanitizeSessionFileName,
  STRUCTURE_VERSION,
} from "./paths.js"
import {
  createDefaultSessionManifest,
  deduplicateSessionManifest,
  ensureCoreManifests,
  readManifest,
  writeManifest,
  type SessionManifest,
  type SessionManifestEntry,
} from "./manifest.js"

interface LoggerLike {
  info?: (msg: string) => Promise<void> | void
  warn?: (msg: string) => Promise<void> | void
  error?: (msg: string) => Promise<void> | void
}

interface MoveOp {
  from: string
  to: string
}

export interface MigrationResult {
  migrated: boolean
  reason: string
  movedFiles: string[]
  errors: string[]
}

function toIso(ts: number): string {
  return new Date(ts).toISOString()
}

async function safeLog(log: LoggerLike | undefined, level: keyof LoggerLike, message: string): Promise<void> {
  const fn = log?.[level]
  if (!fn) return
  await fn(message)
}

async function moveWithRollback(op: MoveOp, stack: MoveOp[]): Promise<void> {
  if (!existsSync(op.from)) return
  await mkdir(dirname(op.to), { recursive: true })
  await rename(op.from, op.to)
  stack.push(op)
}

async function rollbackMoves(moves: MoveOp[]): Promise<void> {
  for (const op of [...moves].reverse()) {
    try {
      if (!existsSync(op.to)) continue
      await mkdir(dirname(op.from), { recursive: true })
      await rename(op.to, op.from)
    } catch {
      // best effort rollback
    }
  }
}

function parseFrontmatter(content: string): { frontmatter: Record<string, unknown>; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!match) {
    return { frontmatter: {}, body: content }
  }

  try {
    const fm = parse(match[1]) || {}
    return { frontmatter: fm, body: match[2] ?? "" }
  } catch {
    return { frontmatter: {}, body: content }
  }
}

function ensureSessionFrontmatter(
  content: string,
  entry: SessionManifestEntry,
): string {
  const parsed = parseFrontmatter(content)
  const created = entry.created || Date.now()
  const fm = {
    id: String(parsed.frontmatter.id ?? parsed.frontmatter.session_id ?? entry.stamp),
    session_id: String(parsed.frontmatter.session_id ?? parsed.frontmatter.id ?? entry.stamp),
    stamp: String(parsed.frontmatter.stamp ?? entry.stamp),
    type: "session",
    mode: String(parsed.frontmatter.mode ?? entry.mode ?? "plan_driven"),
    governance: String(parsed.frontmatter.governance ?? parsed.frontmatter.governance_status ?? "assisted"),
    governance_status: String(parsed.frontmatter.governance_status ?? parsed.frontmatter.governance ?? "OPEN"),
    trajectory: String(parsed.frontmatter.trajectory ?? entry.trajectory ?? ""),
    tactic: String(parsed.frontmatter.tactic ?? ""),
    action: String(parsed.frontmatter.action ?? ""),
    status: entry.status,
    created: String(parsed.frontmatter.created ?? toIso(created)),
    last_activity: String(parsed.frontmatter.last_activity ?? toIso(Date.now())),
    turns: Number(parsed.frontmatter.turns ?? 0),
    drift: Number(parsed.frontmatter.drift ?? 100),
    linked_plans: Array.isArray(parsed.frontmatter.linked_plans)
      ? parsed.frontmatter.linked_plans
      : entry.linked_plans,
  }

  return `---\n${stringify(fm)}---\n\n${parsed.body.trimStart()}`
}

function isHumanReadableSessionFile(file: string): boolean {
  return /^\d{4}-\d{2}-\d{2}-/.test(file)
}

async function readLegacySessionManifest(path: string): Promise<SessionManifest> {
  if (!existsSync(path)) return createDefaultSessionManifest()
  try {
    const manifest = await readManifest<SessionManifest>(path, createDefaultSessionManifest())
    return deduplicateSessionManifest(manifest)
  } catch {
    return createDefaultSessionManifest()
  }
}

function chooseSessionFilename(entry: SessionManifestEntry): string {
  const safeExistingFile = sanitizeSessionFileName(entry.file)
  if (safeExistingFile && isHumanReadableSessionFile(safeExistingFile)) return safeExistingFile
  const created = new Date(entry.created || Date.now())
  const mode = entry.mode || "plan_driven"
  const trajectory = entry.trajectory || "session"
  if (entry.status === "active") {
    return buildSessionFilename(created, mode, trajectory)
  }
  return buildArchiveFilename(created, mode, trajectory)
}

async function migrateSessions(
  projectRoot: string,
  ops: MoveOp[],
): Promise<SessionManifest> {
  const legacy = getLegacyPaths(projectRoot)
  const paths = getHivemindPaths(projectRoot)
  const manifest = await readLegacySessionManifest(legacy.sessionsManifest)
  const deduped = deduplicateSessionManifest(manifest)
  const migratedEntries: SessionManifestEntry[] = []

  for (const entry of deduped.sessions) {
    const fileName = chooseSessionFilename(entry)
    const safeExistingFile = sanitizeSessionFileName(entry.file)
    const sourceCandidates = [
      safeExistingFile ? join(legacy.sessionsDir, safeExistingFile) : "",
      safeExistingFile ? join(paths.sessionsDir, safeExistingFile) : "",
      safeExistingFile ? join(paths.activeDir, safeExistingFile) : "",
      safeExistingFile ? join(paths.archiveDir, safeExistingFile) : "",
    ]
    const source = sourceCandidates.find((p) => p && existsSync(p))
    if (!source) {
      migratedEntries.push({ ...entry, file: fileName })
      continue
    }

    const targetDir = entry.status === "active" ? paths.activeDir : paths.archiveDir
    const target = join(targetDir, fileName)
    if (source !== target) {
      await moveWithRollback({ from: source, to: target }, ops)
    }

    const content = await readFile(target, "utf-8")
    await writeFile(target, ensureSessionFrontmatter(content, { ...entry, file: fileName }), "utf-8")
    migratedEntries.push({ ...entry, file: fileName })
  }

  const normalized = deduplicateSessionManifest({
    sessions: migratedEntries,
    active_stamp: deduped.active_stamp,
  })

  await writeManifest(paths.sessionsManifest, normalized)
  return normalized
}

async function writeRootIndex(projectRoot: string, sessionManifest: SessionManifest): Promise<void> {
  const p = getHivemindPaths(projectRoot)
  let mode = "(unknown)"
  let status = "(unknown)"
  let trajectory = "(none)"
  let turns = 0
  let drift = 100

  if (existsSync(p.brain)) {
    try {
      const raw = await readFile(p.brain, "utf-8")
      const brain = JSON.parse(raw) as {
        session?: { mode?: string; governance_status?: string }
        hierarchy?: { trajectory?: string }
        metrics?: { turn_count?: number; drift_score?: number }
      }
      mode = brain.session?.mode ?? mode
      status = brain.session?.governance_status ?? status
      trajectory = brain.hierarchy?.trajectory ?? trajectory
      turns = brain.metrics?.turn_count ?? turns
      drift = brain.metrics?.drift_score ?? drift
    } catch {
      // best effort
    }
  }

  const lines = [
    "---",
    "type: index",
    `structure_version: \"${STRUCTURE_VERSION}\"`,
    `generated: ${new Date().toISOString()}`,
    "---",
    "# .hivemind — Context Governance State",
    "",
    "## Current State",
    `- Mode: ${mode} | Status: ${status}`,
    `- Trajectory: ${trajectory}`,
    `- Turns: ${turns} | Drift: ${drift}/100`,
    `- Active stamp: ${sessionManifest.active_stamp ?? "(none)"}`,
    "",
    "## Quick Navigation",
    "- state/brain.json",
    "- state/hierarchy.json",
    "- state/anchors.json",
    "- sessions/active/",
    "- sessions/archive/",
    "- memory/mems.json",
  ]

  await writeFile(p.index, lines.join("\n") + "\n", "utf-8")
}

export async function migrateIfNeeded(
  projectRoot: string,
  logger?: LoggerLike,
): Promise<MigrationResult> {
  const errors: string[] = []
  const movedFiles: string[] = []

  if (isNewStructure(projectRoot)) {
    return { migrated: false, reason: "already-new-structure", movedFiles, errors }
  }

  if (!isLegacyStructure(projectRoot)) {
    return { migrated: false, reason: "not-legacy", movedFiles, errors }
  }

  const legacy = getLegacyPaths(projectRoot)
  const p = getHivemindPaths(projectRoot)
  const ops: MoveOp[] = []

  await safeLog(logger, "info", "Migration: legacy structure detected, starting upgrade")

  try {
    for (const dir of getAllDirectories(projectRoot)) {
      await mkdir(dir, { recursive: true })
    }

    const knownMoves: MoveOp[] = [
      { from: legacy.brain, to: p.brain },
      { from: join(legacy.root, "brain.json.bak"), to: join(p.stateDir, "brain.json.bak") },
      { from: legacy.hierarchy, to: p.hierarchy },
      { from: legacy.anchors, to: p.anchors },
      { from: legacy.mems, to: p.mems },
      { from: join(legacy.root, "10-commandments.md"), to: join(p.docsDir, "10-commandments.md") },
    ]

    for (const op of knownMoves) {
      if (!existsSync(op.from)) continue
      await moveWithRollback(op, ops)
      movedFiles.push(`${basename(op.from)} -> ${op.to.replace(projectRoot + "/", "")}`)
    }

    const sessionsManifest = await migrateSessions(projectRoot, ops)
    await ensureCoreManifests(p)
    await writeRootIndex(projectRoot, sessionsManifest)

    // remove old flat files if they still exist and were not moved
    for (const stale of [legacy.brain, legacy.hierarchy, legacy.anchors, legacy.mems]) {
      if (!existsSync(stale)) continue
      try {
        await unlink(stale)
      } catch {
        // best effort
      }
    }

    // move loose session markdown files from sessions/ into active/ if any remain
    if (existsSync(legacy.sessionsDir)) {
      try {
        const leftovers = await readdir(legacy.sessionsDir)
        for (const file of leftovers) {
          if (!file.endsWith(".md")) continue
          if (file === "active.md" || file === "index.md") continue
          const from = join(legacy.sessionsDir, file)
          const to = join(p.activeDir, file)
          if (existsSync(from) && from !== to) {
            await moveWithRollback({ from, to }, ops)
          }
        }
      } catch {
        // best effort
      }
    }

    await safeLog(logger, "info", `Migration: completed (${movedFiles.length} files moved)`)

    return {
      migrated: true,
      reason: "legacy-migrated",
      movedFiles,
      errors,
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    errors.push(msg)
    await safeLog(logger, "error", `Migration failed: ${msg}. Rolling back.`)
    await rollbackMoves(ops)
    return {
      migrated: false,
      reason: "migration-failed",
      movedFiles: [],
      errors,
    }
  }
}
