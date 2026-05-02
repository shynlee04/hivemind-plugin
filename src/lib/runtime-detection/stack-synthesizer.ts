import { buildCodemap, type Codemap } from "./codemap.js"
import { scanCodebase, type CodeScanResult } from "./codescan.js"
import { detectFrameworks, type FrameworkDetectionResult } from "../framework-detector.js"

export type SynthesizedStack = {
  projectType: string
  codemap: Codemap
  scan: CodeScanResult
  frameworks: FrameworkDetectionResult
  warnings: string[]
  synthesizedAt: string
}

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
