/**
 * Framework detector — identifies co-existing frameworks in a project root.
 *
 * Scans for framework marker files/directories and validates boundary claims
 * to detect potential conflicts between frameworks (GSD, BMAD, Speckit, Hivemind).
 *
 * @module framework-detector
 */

import { existsSync } from "node:fs"
import path from "node:path"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FrameworkMarker {
  /** Canonical framework identifier */
  name: string
  /** Files/directories that indicate this framework is present */
  configFiles: string[]
  /** Directories owned by this framework */
  boundaryDirs: string[]
  /** Prefix for generated configs to avoid name collisions */
  namespacePrefix: string
}

export interface DetectedFramework {
  marker: FrameworkMarker
  rootPath: string
  configPath: string | null
  boundaryPaths: string[]
}

export interface FrameworkDetectionResult {
  frameworks: DetectedFramework[]
  conflicts: string[]
  warnings: string[]
}

// ---------------------------------------------------------------------------
// Known framework markers
// ---------------------------------------------------------------------------

export const KNOWN_FRAMEWORKS: FrameworkMarker[] = [
  {
    name: "gsd",
    configFiles: [".planning/ROADMAP.md", ".planning/STATE.md"],
    boundaryDirs: [".planning"],
    namespacePrefix: "gsd",
  },
  {
    name: "bmad",
    configFiles: ["bmad.yaml"],
    boundaryDirs: ["bmad"],
    namespacePrefix: "bmad",
  },
  {
    name: "speckit",
    configFiles: ["speckit.json"],
    boundaryDirs: ["speckit"],
    namespacePrefix: "speckit",
  },
  {
    name: "hivemind",
    configFiles: [],
    boundaryDirs: [".opencode"],
    namespacePrefix: "hivemind",
  },
]

// ---------------------------------------------------------------------------
// Detection
// ---------------------------------------------------------------------------

/**
 * Scans a project root for known framework markers.
 *
 * @param projectRoot - Absolute or relative path to the project root
 * @returns Detection result with discovered frameworks, conflicts, and warnings
 */
export async function detectFrameworks(
  projectRoot: string,
): Promise<FrameworkDetectionResult> {
  const root = path.resolve(projectRoot)
  const frameworks: DetectedFramework[] = []
  const warnings: string[] = []

  for (const marker of KNOWN_FRAMEWORKS) {
    const detection = await detectSingleFramework(root, marker)
    if (detection) {
      frameworks.push(detection)
    }
  }

  const conflicts = validateBoundaries(frameworks)

  return { frameworks, conflicts, warnings }
}

async function detectSingleFramework(
  root: string,
  marker: FrameworkMarker,
): Promise<DetectedFramework | null> {
  let configPath: string | null = null
  const boundaryPaths: string[] = []

  // Check config files
  for (const file of marker.configFiles) {
    const filePath = path.join(root, file)
    if (existsSync(filePath)) {
      configPath = filePath
      break
    }
  }

  // Check boundary directories
  for (const dir of marker.boundaryDirs) {
    const dirPath = path.join(root, dir)
    if (existsSync(dirPath)) {
      boundaryPaths.push(dirPath)
    }
  }

  // Framework is present if any config file OR any boundary dir exists
  if (!configPath && boundaryPaths.length === 0) {
    return null
  }

  // If we found boundary dirs but no config file, use the first boundary dir as configPath
  if (!configPath && boundaryPaths.length > 0) {
    configPath = boundaryPaths[0]
  }

  return {
    marker,
    rootPath: root,
    configPath,
    boundaryPaths,
  }
}

// ---------------------------------------------------------------------------
// Boundary validation
// ---------------------------------------------------------------------------

/**
 * Validates that framework boundary claims do not overlap.
 *
 * @param frameworks - Detected frameworks to validate
 * @returns Array of conflict descriptions
 */
export function validateBoundaries(frameworks: DetectedFramework[]): string[] {
  const conflicts: string[] = []

  for (let i = 0; i < frameworks.length; i++) {
    for (let j = i + 1; j < frameworks.length; j++) {
      const a = frameworks[i]
      const b = frameworks[j]

      for (const boundaryA of a.boundaryPaths) {
        for (const boundaryB of b.boundaryPaths) {
          if (isOverlapping(boundaryA, boundaryB)) {
            conflicts.push(
              `Framework "${a.marker.name}" and "${b.marker.name}" have overlapping boundaries: "${boundaryA}" vs "${boundaryB}"`,
            )
          }
        }
      }
    }
  }

  return conflicts
}

function isOverlapping(a: string, b: string): boolean {
  const normalizedA = path.normalize(a)
  const normalizedB = path.normalize(b)

  if (normalizedA === normalizedB) return true

  // Check if one is a parent of the other
  const relA = path.relative(normalizedB, normalizedA)
  const relB = path.relative(normalizedA, normalizedB)

  if (!relA.startsWith("..") && !path.isAbsolute(relA)) return true
  if (!relB.startsWith("..") && !path.isAbsolute(relB)) return true

  return false
}
