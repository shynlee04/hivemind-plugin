import { existsSync } from "node:fs"
import { readFile } from "node:fs/promises"
import { join, relative } from "path"
import { readSection, upsertSection } from "./doc-intel.js"
import { initializePlanningProjectDir } from "./fs/planning-ops.js"
import { getEffectivePaths } from "./paths.js"

export interface MaterializationResult {
  file: string
  action: "created" | "updated" | "unchanged"
  linesWritten: number
}

export interface StateMdParams {
  currentPosition?: string
  activeBlockers?: string[]
  recentDecisions?: Array<{ decision: string; date: string; session_id?: string }>
  sessionEntry?: { session_id: string; summary: string; date: string }
}

export interface ProjectMdParams {
  trajectoryIntent?: string
  currentPosition?: string
  scope?: string
  keyDecisions?: string[]
}

export interface RoadmapMdParams {
  phases?: Array<{ number: number; name: string; status: string; progress: number }>
}

export interface SessionStateParams {
  sessionId: string
  summary: string
  trajectoryIntent?: string
  anchors?: Array<{ key: string; value: string }>
  hierarchy?: { trajectory?: string; tactic?: string; action?: string }
}

function getPlanningDir(directory: string): string {
  const paths = getEffectivePaths(directory)
  return paths.projectPlanningDir
}

async function loadPlanningFile(directory: string, fileName: string): Promise<{
  filePath: string
  content: string
  existedBefore: boolean
}> {
  const planningDir = getPlanningDir(directory)
  if (!existsSync(planningDir)) {
    await initializePlanningProjectDir(getEffectivePaths(directory).root)
  }
  const filePath = join(planningDir, fileName)
  const existedBefore = existsSync(filePath)
  if (!existedBefore) {
    await initializePlanningProjectDir(getEffectivePaths(directory).root)
  }
  const content = existsSync(filePath) ? await readFile(filePath, "utf-8") : ""
  return { filePath, content, existedBefore }
}

function normalizeLines(content: string): string[] {
  const trimmed = content.trim()
  return trimmed ? trimmed.split("\n").map((line) => line.trimEnd()) : []
}

function sectionEmpty(content: string | null): boolean {
  return normalizeLines(content ?? "").every((line) => {
    const value = line.trim()
    return value.length === 0 || (value.startsWith("<!--") && value.endsWith("-->"))
  })
}

function toWorkspacePath(directory: string, filePath: string): string {
  return relative(directory, filePath)
}

async function applySectionUpdate(
  directory: string,
  filePath: string,
  heading: string,
  newContent: string,
  mode: "replace" | "append",
): Promise<void> {
  const workspacePath = toWorkspacePath(directory, filePath)

  if (mode === "replace") {
    const result = await upsertSection(directory, workspacePath, heading, newContent)
    if ("status" in result) {
      throw new Error(result.message)
    }
    return
  }

  const currentSection = normalizeLines(await readSection(directory, workspacePath, heading) ?? "")
  const incoming = normalizeLines(newContent)
  const deduped = incoming.filter(
    (line) => line.trim().length > 0 && !currentSection.some((existing) => existing.trim() === line.trim()),
  )
  if (deduped.length === 0) {
    return
  }

  const merged = currentSection.length > 0
    ? `${currentSection.join("\n")}\n\n${deduped.join("\n")}`
    : deduped.join("\n")

  const result = await upsertSection(directory, workspacePath, heading, merged)
  if ("status" in result) {
    throw new Error(result.message)
  }
}

async function finalizeMaterialization(
  fileName: string,
  filePath: string,
  previous: string,
  existedBefore: boolean,
): Promise<MaterializationResult> {
  const next = existsSync(filePath) ? await readFile(filePath, "utf-8") : ""
  if (previous === next) {
    return { file: fileName, action: "unchanged", linesWritten: 0 }
  }
  return {
    file: fileName,
    action: existedBefore ? "updated" : "created",
    linesWritten: next.endsWith("\n") ? next.split("\n").length - 1 : next.split("\n").length,
  }
}

export async function materializeStateMd(directory: string, params: StateMdParams): Promise<MaterializationResult> {
  const { filePath, content, existedBefore } = await loadPlanningFile(directory, "STATE.md")
  if (params.currentPosition?.trim()) {
    await applySectionUpdate(directory, filePath, "Current Position", params.currentPosition.trim(), "replace")
  }
  if (params.activeBlockers) {
    const blockers = params.activeBlockers.length > 0 ? params.activeBlockers.map((item) => `- ${item}`) : ["- None"]
    await applySectionUpdate(directory, filePath, "Active Blockers", blockers.join("\n"), "replace")
  }
  if (params.recentDecisions && params.recentDecisions.length > 0) {
    const decisions = params.recentDecisions.map(({ decision, date, session_id }) => {
      const suffix = session_id ? ` (session: ${session_id})` : ""
      return `- [${date}] ${decision}${suffix}`
    })
    await applySectionUpdate(directory, filePath, "Recent Decisions", decisions.join("\n"), "append")
  }
  if (params.sessionEntry) {
    const line = `- [${params.sessionEntry.date}] ${params.sessionEntry.summary} (session: ${params.sessionEntry.session_id})`
    await applySectionUpdate(directory, filePath, "Session History", line, "append")
  }
  return finalizeMaterialization("STATE.md", filePath, content, existedBefore)
}

export async function materializeProjectMd(
  directory: string,
  params: ProjectMdParams,
): Promise<MaterializationResult> {
  const { filePath, content, existedBefore } = await loadPlanningFile(directory, "PROJECT.md")
  const workspacePath = toWorkspacePath(directory, filePath)
  if (params.trajectoryIntent?.trim() && sectionEmpty(await readSection(directory, workspacePath, "Purpose"))) {
    await applySectionUpdate(directory, filePath, "Purpose", params.trajectoryIntent.trim(), "replace")
  }
  if (params.scope?.trim() && sectionEmpty(await readSection(directory, workspacePath, "Scope"))) {
    await applySectionUpdate(directory, filePath, "Scope", params.scope.trim(), "replace")
  }
  if (params.keyDecisions && params.keyDecisions.length > 0) {
    await applySectionUpdate(
      directory,
      filePath,
      "Key Decisions",
      params.keyDecisions.map((decision) => `- ${decision}`).join("\n"),
      "append",
    )
  }
  return finalizeMaterialization("PROJECT.md", filePath, content, existedBefore)
}

export async function materializeRoadmapMd(
  directory: string,
  params: RoadmapMdParams,
): Promise<MaterializationResult> {
  const { filePath, content, existedBefore } = await loadPlanningFile(directory, "ROADMAP.md")
  if (!params.phases || params.phases.length === 0) {
    return { file: "ROADMAP.md", action: "unchanged", linesWritten: 0 }
  }
  const rows = new Map<number, { number: number; name: string; status: string; progress: number }>()
  for (const line of normalizeLines(await readSection(directory, toWorkspacePath(directory, filePath), "Phases") ?? "")) {
    const trimmed = line.trim()
    if (!trimmed.startsWith("|") || trimmed.startsWith("| Phase ") || trimmed.includes("---")) {
      continue
    }
    const columns = trimmed.split("|").map((cell) => cell.trim()).filter((cell) => cell.length > 0)
    const number = Number(columns[0])
    if (!Number.isFinite(number) || columns.length < 4) {
      continue
    }
    rows.set(number, {
      number,
      name: columns[1],
      status: columns[2],
      progress: Number(String(columns[3]).replace("%", "")) || 0,
    })
  }
  for (const phase of params.phases) {
    rows.set(phase.number, phase)
  }
  await applySectionUpdate(
    directory,
    filePath,
    "Phases",
    [
      "| Phase | Name | Status | Progress |",
      "|-------|------|--------|----------|",
      ...[...rows.values()]
        .sort((a, b) => a.number - b.number)
        .map((phase) => `| ${phase.number} | ${phase.name} | ${phase.status} | ${phase.progress}% |`),
    ].join("\n"),
    "replace",
  )
  return finalizeMaterialization("ROADMAP.md", filePath, content, existedBefore)
}

export async function materializeFromSessionState(
  directory: string,
  params: SessionStateParams,
): Promise<MaterializationResult[]> {
  const today = new Date().toISOString().slice(0, 10)
  const anchors = params.anchors ?? []
  const currentPosition = [params.hierarchy?.trajectory, params.hierarchy?.tactic]
    .filter((part): part is string => Boolean(part?.trim()))
    .join(" → ")

  const stateResult = await materializeStateMd(directory, {
    currentPosition: currentPosition || undefined,
    activeBlockers: anchors.filter((anchor) => anchor.key.toLowerCase().includes("blocker")).map((anchor) => anchor.value),
    recentDecisions: anchors
      .filter((anchor) => anchor.key.toLowerCase().includes("decision"))
      .map((anchor) => ({ decision: anchor.value, date: today, session_id: params.sessionId })),
    sessionEntry: { session_id: params.sessionId, summary: params.summary, date: today },
  })

  const projectResult = await materializeProjectMd(directory, {
    trajectoryIntent: params.trajectoryIntent,
  })

  return [stateResult, projectResult]
}
