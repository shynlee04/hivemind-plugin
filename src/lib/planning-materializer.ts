import { existsSync } from "node:fs"
import { readFile, writeFile } from "node:fs/promises"
import { join } from "path"
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
  const expectedRoot = join(directory, ".hivemind")
  const root = paths.root === expectedRoot ? expectedRoot : paths.root
  return join(root, "project", "planning")
}

async function loadPlanningFile(directory: string, fileName: string): Promise<{
  filePath: string
  content: string
  existedBefore: boolean
}> {
  const planningDir = getPlanningDir(directory)
  if (!existsSync(planningDir)) {
    await initializePlanningProjectDir(join(directory, ".hivemind"))
  }
  const filePath = join(planningDir, fileName)
  const existedBefore = existsSync(filePath)
  if (!existedBefore) {
    await initializePlanningProjectDir(join(directory, ".hivemind"))
  }
  const content = existsSync(filePath) ? await readFile(filePath, "utf-8") : ""
  return { filePath, content, existedBefore }
}

function sectionRange(lines: string[], heading: string): { start: number; end: number } | null {
  const headingIndex = lines.findIndex((line) => line.startsWith(heading))
  if (headingIndex === -1) {
    return null
  }
  const nextHeading = lines.findIndex((line, i) => i > headingIndex && line.startsWith("## "))
  return { start: headingIndex + 1, end: nextHeading === -1 ? lines.length : nextHeading }
}

function normalizeLines(content: string): string[] {
  const trimmed = content.trim()
  return trimmed ? trimmed.split("\n").map((line) => line.trimEnd()) : []
}

function getSectionLines(content: string, heading: string): string[] {
  const lines = content.split("\n")
  const range = sectionRange(lines, heading)
  return range ? lines.slice(range.start, range.end) : []
}

function sectionEmpty(lines: string[]): boolean {
  return lines.every((line) => {
    const value = line.trim()
    return value.length === 0 || (value.startsWith("<!--") && value.endsWith("-->"))
  })
}

function updateSection(content: string, heading: string, newContent: string, mode: "replace" | "append"): string {
  const lines = content.split("\n")
  const range = sectionRange(lines, heading)
  const incoming = normalizeLines(newContent)
  if (!range) {
    const appended = [...lines]
    if (appended.length > 0 && appended[appended.length - 1] !== "") {
      appended.push("")
    }
    appended.push(heading, ...incoming)
    return appended.join("\n")
  }
  if (mode === "replace") {
    const replacement = [...incoming]
    if (range.end < lines.length && replacement.length > 0 && replacement[replacement.length - 1] !== "") {
      replacement.push("")
    }
    return [...lines.slice(0, range.start), ...replacement, ...lines.slice(range.end)].join("\n")
  }
  const currentSection = lines.slice(range.start, range.end)
  const deduped = incoming.filter(
    (line) => line.trim().length > 0 && !currentSection.some((existing) => existing.trim() === line.trim()),
  )
  if (deduped.length === 0) {
    return content
  }
  const next = lines.slice(0, range.end)
  if (next.length > 0 && next[next.length - 1] !== "") {
    next.push("")
  }
  next.push(...deduped)
  if (range.end < lines.length) {
    next.push("")
  }
  return [...next, ...lines.slice(range.end)].join("\n")
}

async function persist(
  fileName: string,
  filePath: string,
  previous: string,
  next: string,
  existedBefore: boolean,
): Promise<MaterializationResult> {
  if (previous === next) {
    return { file: fileName, action: "unchanged", linesWritten: 0 }
  }
  const normalized = next.endsWith("\n") ? next : `${next}\n`
  await writeFile(filePath, normalized)
  return {
    file: fileName,
    action: existedBefore ? "updated" : "created",
    linesWritten: normalized.split("\n").length - 1,
  }
}

export async function materializeStateMd(directory: string, params: StateMdParams): Promise<MaterializationResult> {
  const { filePath, content, existedBefore } = await loadPlanningFile(directory, "STATE.md")
  let next = content
  if (params.currentPosition?.trim()) {
    next = updateSection(next, "## Current Position", params.currentPosition.trim(), "replace")
  }
  if (params.activeBlockers) {
    const blockers = params.activeBlockers.length > 0 ? params.activeBlockers.map((item) => `- ${item}`) : ["- None"]
    next = updateSection(next, "## Active Blockers", blockers.join("\n"), "replace")
  }
  if (params.recentDecisions && params.recentDecisions.length > 0) {
    const decisions = params.recentDecisions.map(({ decision, date, session_id }) => {
      const suffix = session_id ? ` (session: ${session_id})` : ""
      return `- [${date}] ${decision}${suffix}`
    })
    next = updateSection(next, "## Recent Decisions", decisions.join("\n"), "append")
  }
  if (params.sessionEntry) {
    const line = `- [${params.sessionEntry.date}] ${params.sessionEntry.summary} (session: ${params.sessionEntry.session_id})`
    next = updateSection(next, "## Session History", line, "append")
  }
  return persist("STATE.md", filePath, content, next, existedBefore)
}

export async function materializeProjectMd(
  directory: string,
  params: ProjectMdParams,
): Promise<MaterializationResult> {
  const { filePath, content, existedBefore } = await loadPlanningFile(directory, "PROJECT.md")
  let next = content
  if (params.trajectoryIntent?.trim() && sectionEmpty(getSectionLines(next, "## Purpose"))) {
    next = updateSection(next, "## Purpose", params.trajectoryIntent.trim(), "replace")
  }
  if (params.scope?.trim() && sectionEmpty(getSectionLines(next, "## Scope"))) {
    next = updateSection(next, "## Scope", params.scope.trim(), "replace")
  }
  if (params.keyDecisions && params.keyDecisions.length > 0) {
    next = updateSection(
      next,
      "## Key Decisions",
      params.keyDecisions.map((decision) => `- ${decision}`).join("\n"),
      "append",
    )
  }
  return persist("PROJECT.md", filePath, content, next, existedBefore)
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
  for (const line of getSectionLines(content, "## Phases")) {
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
  const next = updateSection(
    content,
    "## Phases",
    [
      "| Phase | Name | Status | Progress |",
      "|-------|------|--------|----------|",
      ...[...rows.values()]
        .sort((a, b) => a.number - b.number)
        .map((phase) => `| ${phase.number} | ${phase.name} | ${phase.status} | ${phase.progress}% |`),
    ].join("\n"),
    "replace",
  )
  return persist("ROADMAP.md", filePath, content, next, existedBefore)
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
