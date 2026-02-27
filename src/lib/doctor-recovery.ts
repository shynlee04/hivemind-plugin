import { copyFile, mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises"
import { existsSync } from "node:fs"
import { dirname, join, relative } from "node:path"
import { getEffectivePaths } from "./paths.js"
import { createDefaultSessionManifest, type SessionManifest, type SessionManifestEntry } from "./manifest.js"

export type DoctorMode = "report" | "repair"

export interface DoctorIssue {
  code: string
  severity: "info" | "warn" | "error"
  message: string
  evidence: Record<string, unknown>
}

export interface DoctorRunOptions {
  mode?: DoctorMode
  dryRun?: boolean
  hardReset?: boolean
}

export interface DoctorRunResult {
  mode: DoctorMode
  broken: boolean
  generatedAt: string
  selectedSessionId: string | null
  issues: DoctorIssue[]
  actions: string[]
  repaired: boolean
  reportPath: string
  lineageRepairPath?: string
  forensicsDir?: string
}

interface SessionFileInfo {
  id: string
  file: string
  status: "active" | "archived"
  created: number
}

const SESSION_FILE_PATTERN = /^session-([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\.md$/i

function nowIso(): string {
  return new Date().toISOString()
}

async function readJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const raw = await readFile(path, "utf-8")
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, JSON.stringify(value, null, 2), "utf-8")
}

async function listSessionFiles(baseDir: string, status: "active" | "archived"): Promise<SessionFileInfo[]> {
  if (!existsSync(baseDir)) return []

  const entries = await readdir(baseDir, { withFileTypes: true })
  const out: SessionFileInfo[] = []

  for (const entry of entries) {
    if (!entry.isFile()) continue
    const match = entry.name.match(SESSION_FILE_PATTERN)
    if (!match) continue

    const fullPath = join(baseDir, entry.name)
    const st = await stat(fullPath)
    out.push({
      id: match[1],
      file: fullPath,
      status,
      created: st.mtimeMs,
    })
  }

  return out
}

function chooseActiveSession(
  activeIds: string[],
  brainSessionId: string | undefined,
  trajectorySessionId: string | undefined,
): string | null {
  if (brainSessionId && activeIds.includes(brainSessionId)) return brainSessionId
  if (trajectorySessionId && activeIds.includes(trajectorySessionId)) return trajectorySessionId
  return activeIds[0] ?? null
}

function toSessionManifest(
  sessionsDir: string,
  allFiles: SessionFileInfo[],
  selectedActiveId: string | null,
): SessionManifest {
  const manifest = createDefaultSessionManifest()

  const sessions: SessionManifestEntry[] = allFiles
    .sort((a, b) => a.created - b.created)
    .map((file) => ({
      stamp: file.id,
      file: relative(sessionsDir, file.file).replaceAll("\\", "/"),
      status: file.id === selectedActiveId ? "active" : "archived",
      created: file.created,
      session_id: file.id,
      linked_plans: [],
    }))

  manifest.sessions = sessions
  manifest.active_stamp = selectedActiveId
  return manifest
}

function renderActiveMd(payload: {
  sessionId: string
  mode: string
  governanceStatus: string
  startTime: number
  date: string
  lastUpdated: number
  trajectory: string
  tactic: string
  action: string
}): string {
  return [
    "---",
    `session_id: \"${payload.sessionId}\"`,
    `mode: \"${payload.mode}\"`,
    `governance_status: \"${payload.governanceStatus}\"`,
    `start_time: ${payload.startTime}`,
    `last_updated: ${payload.lastUpdated}`,
    `date: \"${payload.date}\"`,
    "meta_key: \"\"",
    "role: \"\"",
    "by_ai: true",
    "---",
    "",
    "# Active Session",
    "",
    "## Current Focus",
    payload.action || "(none)",
    "",
    "## Plan",
    `- Trajectory: ${payload.trajectory || "(none)"}`,
    `- Tactic: ${payload.tactic || "(none)"}`,
    `- Action: ${payload.action || "(none)"}`,
    "",
    "## Completed",
    "<!-- Items marked [x] get archived -->",
    "",
    "## Notes",
    "<!-- Scratchpad -->",
    "",
  ].join("\n")
}

async function ensureForensics(paths: ReturnType<typeof getEffectivePaths>): Promise<string> {
  const stamp = nowIso().replaceAll(":", "-")
  const forensicsDir = join(paths.root, "recovery", `forensics-${stamp}`)
  await mkdir(forensicsDir, { recursive: true })

  const candidates = [
    paths.sessionsManifest,
    join(paths.sessionsDir, "active.md"),
    paths.brain,
    paths.graphTrajectory,
    paths.graphTasks,
    paths.graphMems,
    paths.graphOrphans,
  ]

  for (const file of candidates) {
    if (!existsSync(file)) continue
    const rel = relative(paths.root, file)
    const dest = join(forensicsDir, rel)
    await mkdir(dirname(dest), { recursive: true })
    await copyFile(file, dest)
  }

  return forensicsDir
}

export async function runDoctorRecovery(directory: string, options: DoctorRunOptions = {}): Promise<DoctorRunResult> {
  const mode = options.mode ?? "report"
  const dryRun = options.dryRun ?? false
  const hardReset = options.hardReset ?? false
  const generatedAt = nowIso()

  const paths = getEffectivePaths(directory)
  const issues: DoctorIssue[] = []
  const actions: string[] = []

  const [brain, trajectory, sessionsManifest] = await Promise.all([
    readJson<Record<string, unknown>>(paths.brain, {}),
    readJson<Record<string, unknown>>(paths.graphTrajectory, {}),
    readJson<SessionManifest>(paths.sessionsManifest, createDefaultSessionManifest()),
  ])

  const brainSessionId = (brain.session as Record<string, unknown> | undefined)?.id as string | undefined
  const trajectorySessionId = ((trajectory.trajectory as Record<string, unknown> | undefined)?.session_id as string | undefined)

  const activeFiles = await listSessionFiles(paths.activeDir, "active")
  const archivedFiles = await listSessionFiles(paths.archiveDir, "archived")
  const allFiles = [...activeFiles, ...archivedFiles]
  const activeIds = activeFiles.map((entry) => entry.id)

  if ((sessionsManifest.sessions?.length ?? 0) === 0 && allFiles.length > 0) {
    issues.push({
      code: "SESSION_MANIFEST_EMPTY_WITH_SESSION_FILES",
      severity: "error",
      message: "sessions manifest is empty while session files exist",
      evidence: { files: allFiles.length, activeFiles: activeFiles.length },
    })
  }

  const activeMdRaw = existsSync(join(paths.sessionsDir, "active.md"))
    ? await readFile(join(paths.sessionsDir, "active.md"), "utf-8")
    : ""
  const hasBlankActiveMd = activeMdRaw.includes('session_id: ""')
  if (hasBlankActiveMd && Boolean(brainSessionId)) {
    issues.push({
      code: "ACTIVE_MD_BLANK_WITH_BRAIN_SESSION",
      severity: "error",
      message: "active.md is blank while brain has active session",
      evidence: { brainSessionId },
    })
  }

  if (brainSessionId && trajectorySessionId && brainSessionId !== trajectorySessionId) {
    issues.push({
      code: "BRAIN_TRAJECTORY_SESSION_MISMATCH",
      severity: "warn",
      message: "brain.session.id differs from trajectory.session_id",
      evidence: { brainSessionId, trajectorySessionId },
    })
  }

  const selectedSessionId = (() => {
    const selected = chooseActiveSession(activeIds, brainSessionId, trajectorySessionId)
    if (selected) return selected
    if (hardReset && allFiles.length > 0) {
      const latest = [...allFiles].sort((a, b) => b.created - a.created)[0]
      return latest.id
    }
    return null
  })()
  if (!selectedSessionId && allFiles.length > 0) {
    issues.push({
      code: "NO_ACTIVE_SESSION_SELECTION",
      severity: "warn",
      message: "no active session selected; no active session files were found",
      evidence: { activeFiles: activeFiles.length, archivedFiles: archivedFiles.length },
    })
  }

  if (mode === "repair") {
    actions.push("build_doctor_report")
    actions.push("snapshot_forensics")
    actions.push("rebuild_sessions_manifest")
    actions.push("rewrite_active_md")
    actions.push("realign_brain_trajectory_session")

    let forensicsDir: string | undefined
    if (!dryRun) {
      forensicsDir = await ensureForensics(paths)
      const rebuiltManifest = toSessionManifest(paths.sessionsDir, allFiles, selectedSessionId)
      await writeJson(paths.sessionsManifest, rebuiltManifest)

      if (selectedSessionId) {
        const nextBrain = { ...brain }
        const session = ((nextBrain.session ?? {}) as Record<string, unknown>)
        session.id = selectedSessionId
        session.last_activity = Date.now()
        nextBrain.session = session
        await writeJson(paths.brain, nextBrain)

        const nextTrajectory = { ...trajectory }
        const trajectoryNode = ((nextTrajectory.trajectory ?? {}) as Record<string, unknown>)
        trajectoryNode.session_id = selectedSessionId
        trajectoryNode.updated_at = nowIso()
        nextTrajectory.trajectory = trajectoryNode
        await writeJson(paths.graphTrajectory, nextTrajectory)

        const hierarchy = (nextBrain.hierarchy ?? {}) as Record<string, unknown>
        const modeValue = typeof session.mode === "string" ? session.mode : "plan_driven"
        const governanceStatus = typeof session.governance_status === "string" ? session.governance_status : "OPEN"
        const startTime = typeof session.start_time === "number" ? session.start_time : Date.now()
        const date = typeof session.date === "string" && session.date.length > 0 ? session.date : nowIso().slice(0, 10)

        const activeMd = renderActiveMd({
          sessionId: selectedSessionId,
          mode: modeValue,
          governanceStatus,
          startTime,
          date,
          lastUpdated: Date.now(),
          trajectory: String(hierarchy.trajectory ?? ""),
          tactic: String(hierarchy.tactic ?? ""),
          action: String(hierarchy.action ?? ""),
        })
        await writeFile(join(paths.sessionsDir, "active.md"), activeMd, "utf-8")
      }

      const lineageRepair = {
        generated_at: generatedAt,
        selected_session_id: selectedSessionId,
        hard_reset: hardReset,
        dry_run: dryRun,
        issues,
        actions,
        notes: [
          "sessions manifest rebuilt from on-disk session files",
          "active.md rewritten from canonical state",
          "brain/trajectory session ids aligned",
        ],
      }

      await mkdir(join(paths.root, "recovery"), { recursive: true })
      await writeJson(join(paths.root, "recovery", "lineage-repair.json"), lineageRepair)

      const report = {
        generated_at: generatedAt,
        mode,
        dry_run: dryRun,
        hard_reset: hardReset,
        broken: issues.some((issue) => issue.severity === "error"),
        selected_session_id: selectedSessionId,
        issues,
        actions,
        forensics_dir: forensicsDir,
      }
      await writeJson(join(paths.root, "recovery", "doctor-report.json"), report)

      return {
        mode,
        broken: report.broken,
        generatedAt,
        selectedSessionId,
        issues,
        actions,
        repaired: true,
        reportPath: join(paths.root, "recovery", "doctor-report.json"),
        lineageRepairPath: join(paths.root, "recovery", "lineage-repair.json"),
        forensicsDir,
      }
    }
  }

  const report = {
    generated_at: generatedAt,
    mode,
    dry_run: dryRun,
    hard_reset: hardReset,
    broken: issues.some((issue) => issue.severity === "error"),
    selected_session_id: selectedSessionId,
    issues,
    actions,
  }

  await mkdir(join(paths.root, "recovery"), { recursive: true })
  await writeJson(join(paths.root, "recovery", "doctor-report.json"), report)

  return {
    mode,
    broken: report.broken,
    generatedAt,
    selectedSessionId,
    issues,
    actions,
    repaired: false,
    reportPath: join(paths.root, "recovery", "doctor-report.json"),
  }
}
