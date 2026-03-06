import { access, readFile } from "fs/promises"
import { constants } from "fs"
import { join } from "path"
import { getEffectivePaths } from "./paths.js"

export type FrameworkMode = "gsd" | "spec-kit" | "both" | "none"

export interface FrameworkContext {
  mode: FrameworkMode
  hasGsd: boolean
  hasSpecKit: boolean
  gsdPath: string | null
  specKitPath: string | null
  activePhase: string | null
  activeSpecPath: string | null
  gsdPhaseGoal: string | null
}

export interface FrameworkSelectionOption {
  id: "use-gsd" | "use-spec-kit" | "override-session" | "cancel-task"
  label: "Use GSD" | "Use Spec-kit" | "Proceed with override this session" | "Cancel current task"
  requiredMetadata: Array<"active_phase" | "active_spec_path" | "acceptance_note">
}

export interface FrameworkSelectionMenu {
  mode: FrameworkMode
  conflict: boolean
  options: FrameworkSelectionOption[]
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK)
    return true
  } catch {
    return false
  }
}

async function resolveGsdPlanningRoot(directory: string): Promise<string | null> {
  const paths = getEffectivePaths(directory)
  const canonicalPlanningRoot = paths.projectPlanningDir
  if (await pathExists(canonicalPlanningRoot)) {
    return canonicalPlanningRoot
  }

  const legacyPlanningRoot = join(directory, ".planning")
  if (await pathExists(legacyPlanningRoot)) {
    return legacyPlanningRoot
  }

  return null
}

async function readPlanningSignals(planningDir: string | null): Promise<{
  activePhase: string | null
  phaseGoal: string | null
}> {
  if (!planningDir) {
    return { activePhase: null, phaseGoal: null }
  }

  const statePath = join(planningDir, "STATE.md")
  const roadmapPath = join(planningDir, "ROADMAP.md")
  if (!(await pathExists(statePath)) || !(await pathExists(roadmapPath))) {
    return { activePhase: null, phaseGoal: null }
  }

  const [stateContent, roadmapContent] = await Promise.all([
    readFile(statePath, "utf-8"),
    readFile(roadmapPath, "utf-8"),
  ])

  const activePhase = parseActivePhase(stateContent)
  return {
    activePhase,
    phaseGoal: extractPhaseGoalFromRoadmap(roadmapContent, activePhase),
  }
}

function classifyMode(hasGsd: boolean, hasSpecKit: boolean): FrameworkMode {
  if (hasGsd && hasSpecKit) return "both"
  if (hasGsd) return "gsd"
  if (hasSpecKit) return "spec-kit"
  return "none"
}

function parseActivePhase(stateContent: string): string | null {
  const currentPosition = stateContent.match(/Phase\s+([0-9]+(?:\.[0-9]+)?)\s+of/i)
  if (currentPosition) {
    return currentPosition[1].padStart(2, "0")
  }

  const currentFocus = stateContent.match(/Current focus:\s*Phase\s+([0-9]+(?:\.[0-9]+)?)/i)
  if (currentFocus) {
    return currentFocus[1].padStart(2, "0")
  }

  return null
}

function extractPhaseGoalFromRoadmap(
  roadmapContent: string,
  activePhase: string | null
): string | null {
  if (!activePhase) return null

  const lines = roadmapContent.split("\n")
  const normalized = String(Number(activePhase))
  let phaseHeaderIndex = -1

  for (let i = 0; i < lines.length; i++) {
    const headingMatch = lines[i].match(/^##\s+Phase\s+([0-9]+(?:\.[0-9]+)?)\s*:/)
    if (!headingMatch) continue
    if (headingMatch[1] === activePhase || headingMatch[1] === normalized) {
      phaseHeaderIndex = i
      break
    }
  }

  if (phaseHeaderIndex === -1) return null

  for (let i = phaseHeaderIndex + 1; i < lines.length; i++) {
    if (lines[i].startsWith("## ")) break
    const goalMatch = lines[i].match(/^\*\*Goal:\*\*\s*(.+)$/)
    if (goalMatch) {
      return goalMatch[1].trim()
    }
  }

  return null
}

export async function extractCurrentGsdPhaseGoal(directory: string): Promise<string | null> {
  const paths = getEffectivePaths(directory)
  const canonicalSignals = await readPlanningSignals(paths.projectPlanningDir)
  if (canonicalSignals.phaseGoal) {
    return canonicalSignals.phaseGoal
  }

  const legacyPlanningRoot = join(directory, ".planning")
  const legacySignals = await readPlanningSignals(legacyPlanningRoot)
  return legacySignals.phaseGoal
}

export async function detectFrameworkContext(directory: string): Promise<FrameworkContext> {
  const gsdPath = await resolveGsdPlanningRoot(directory)
  const specKitPath = join(directory, ".spec-kit")

  const [hasGsd, hasSpecKit] = await Promise.all([
    Promise.resolve(gsdPath !== null),
    pathExists(specKitPath),
  ])

  const mode = classifyMode(hasGsd, hasSpecKit)
  const paths = getEffectivePaths(directory)
  const canonicalSignals = await readPlanningSignals(paths.projectPlanningDir)
  const legacySignals = await readPlanningSignals(join(directory, ".planning"))
  const activePhase = canonicalSignals.activePhase ?? legacySignals.activePhase
  const gsdPhaseGoal = canonicalSignals.phaseGoal ?? legacySignals.phaseGoal

  return {
    mode,
    hasGsd,
    hasSpecKit,
    gsdPath,
    specKitPath: hasSpecKit ? specKitPath : null,
    activePhase,
    activeSpecPath: hasSpecKit ? specKitPath : null,
    gsdPhaseGoal,
  }
}

export function buildFrameworkSelectionMenu(context: FrameworkContext): FrameworkSelectionMenu {
  return {
    mode: context.mode,
    conflict: context.mode === "both",
    options: [
      {
        id: "use-gsd",
        label: "Use GSD",
        requiredMetadata: ["active_phase"],
      },
      {
        id: "use-spec-kit",
        label: "Use Spec-kit",
        requiredMetadata: ["active_spec_path"],
      },
      {
        id: "override-session",
        label: "Proceed with override this session",
        requiredMetadata: ["acceptance_note"],
      },
      {
        id: "cancel-task",
        label: "Cancel current task",
        requiredMetadata: [],
      },
    ],
  }
}
