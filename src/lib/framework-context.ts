import { access, readFile } from "fs/promises"
import { constants } from "fs"
import { join } from "path"

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
  const planningDir = join(directory, ".planning")
  if (!(await pathExists(planningDir))) {
    return null
  }

  const statePath = join(planningDir, "STATE.md")
  const roadmapPath = join(planningDir, "ROADMAP.md")
  if (!(await pathExists(statePath)) || !(await pathExists(roadmapPath))) {
    return null
  }

  const [stateContent, roadmapContent] = await Promise.all([
    readFile(statePath, "utf-8"),
    readFile(roadmapPath, "utf-8"),
  ])

  const activePhase = parseActivePhase(stateContent)
  return extractPhaseGoalFromRoadmap(roadmapContent, activePhase)
}

export async function detectFrameworkContext(directory: string): Promise<FrameworkContext> {
  const gsdPath = join(directory, ".planning")
  const specKitPath = join(directory, ".spec-kit")

  const [hasGsd, hasSpecKit] = await Promise.all([
    pathExists(gsdPath),
    pathExists(specKitPath),
  ])

  const mode = classifyMode(hasGsd, hasSpecKit)
  const gsdPhaseGoal = hasGsd ? await extractCurrentGsdPhaseGoal(directory) : null

  let activePhase: string | null = null
  if (hasGsd) {
    const statePath = join(gsdPath, "STATE.md")
    if (await pathExists(statePath)) {
      const stateContent = await readFile(statePath, "utf-8")
      activePhase = parseActivePhase(stateContent)
    }
  }

  return {
    mode,
    hasGsd,
    hasSpecKit,
    gsdPath: hasGsd ? gsdPath : null,
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
