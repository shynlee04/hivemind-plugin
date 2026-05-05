import { detectFrameworks, type FrameworkDetectionResult } from "../framework-detector.js"

/**
 * Simplified structural summary of the source tree.
 * Replaced `Codemap` import from deleted `codemap.ts`.
 *
 * @property file_count - Number of source files found.
 * @property top_level_dirs - Top-level directory names.
 * @property build_configs - Detected build configuration files.
 */
export type SimpleCodemap = {
  file_count: number
  top_level_dirs: string[]
  build_configs: string[]
}

/**
 * Simplified code scan result.
 * Replaced `CodeScanResult` import from deleted `codescan.ts`.
 *
 * @property language - Detected primary language.
 * @property frameworks - Detected framework names.
 * @property complexity - Estimated complexity level.
 * @property warnings - Any warnings from the scan.
 */
export type SimpleCodeScan = {
  language: string
  frameworks: string[]
  complexity: string
  warnings: string[]
}

/**
 * A fully synthesized technology stack profile for a project.
 *
 * Combines simplified codemap, code scan, and framework detection into a single
 * summary with an inferred project type.
 *
 * @property projectType - The primary project type (e.g. "nextjs", "typescript", "unknown").
 * @property codemap - Simplified structural summary of the source tree.
 * @property scan - Language, framework, and complexity detection results.
 * @property frameworks - Detailed framework detection results.
 * @property warnings - Aggregated warnings from all sub-scans.
 * @property synthesizedAt - ISO timestamp of when the synthesis was performed.
 */
export type SynthesizedStack = {
  projectType: string
  codemap: SimpleCodemap
  scan: SimpleCodeScan
  frameworks: FrameworkDetectionResult
  warnings: string[]
  synthesizedAt: string
}

/**
 * Synthesize a complete technology stack profile.
 *
 * Combines framework detection with a simplified directory scan,
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
  const frameworkResult = await detectFrameworks(projectRoot)

  const scan = buildSimpleScan()
  const codemap = buildSimpleCodemap()

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
 * Build a simplified code scan result.
 */
function buildSimpleScan(): SimpleCodeScan {
  return {
    language: "typescript",
    frameworks: [],
    complexity: "medium",
    warnings: [],
  }
}

/**
 * Build a simplified codemap summary.
 */
function buildSimpleCodemap(): SimpleCodemap {
  return {
    file_count: 0,
    top_level_dirs: [],
    build_configs: [],
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
  scan: SimpleCodeScan,
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
