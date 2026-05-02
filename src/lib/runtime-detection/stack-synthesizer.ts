import { buildCodemap, type Codemap } from "./codemap.js"
import { scanCodebase, type CodeScanResult } from "./codescan.js"
import { detectFrameworks, type FrameworkDetectionResult } from "../framework-detector.js"

/**
 * A fully synthesized technology stack profile for a project.
 *
 * Combines codemap, code scan, and framework detection into a single
 * summary with an inferred project type.
 *
 * @property projectType - The primary project type (e.g. "nextjs", "typescript", "unknown").
 * @property codemap - Structural summary of the source tree.
 * @property scan - Language, framework, and complexity detection results.
 * @property frameworks - Detailed framework detection results.
 * @property warnings - Aggregated warnings from all sub-scans.
 * @property synthesizedAt - ISO timestamp of when the synthesis was performed.
 */
export type SynthesizedStack = {
  projectType: string
  codemap: Codemap
  scan: CodeScanResult
  frameworks: FrameworkDetectionResult
  warnings: string[]
  synthesizedAt: string
}

/**
 * Synthesize a complete technology stack profile by running all detection in parallel.
 *
 * Executes codemap building, framework detection, and code scanning concurrently,
 * then derives a project type from the combined results.
 *
 * @param projectRoot - Absolute path to the project root directory.
 * @returns A {@link SynthesizedStack} with all detection results aggregated.
 *
 * @example
 * ```typescript
 * const stack = await synthesizeTechStack("/path/to/project")
 * console.log(stack.projectType, stack.warnings)
 * ```
 */
export async function synthesizeTechStack(projectRoot: string): Promise<SynthesizedStack> {
  const [codemap, frameworkResult, scan] = await Promise.all([
    buildCodemap(projectRoot),
    detectFrameworks(projectRoot),
    scanCodebase(projectRoot),
  ])

  const warnings = [...scan.warnings, ...frameworkResult.warnings]

  const projectType = deriveProjectType(scan, frameworkResult)

  return {
    projectType,
    codemap,
    scan,
    frameworks: frameworkResult,
    warnings,
    synthesizedAt: new Date().toISOString(),
  }
}

/**
 * Derive the primary project type from scan and framework results.
 *
 * Priority order:
 * 1. First framework from code scan (`scan.frameworks`)
 * 2. First framework from framework detection (`frameworkResult.frameworks`)
 * 3. Detected language from code scan
 * 4. `"unknown"` fallback
 *
 * @param scan - Code scan results.
 * @param frameworkResult - Framework detection results.
 * @returns A string identifying the primary project type.
 */
function deriveProjectType(
  scan: CodeScanResult,
  frameworkResult: FrameworkDetectionResult,
): string {
  if (scan.frameworks.length > 0) {
    return scan.frameworks[0]
  }
  if (frameworkResult.frameworks.length > 0) {
    return frameworkResult.frameworks[0].marker.name
  }
  if (scan.language !== "unknown") {
    return scan.language
  }
  return "unknown"
}
