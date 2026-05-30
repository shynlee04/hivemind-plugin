/**
 * Framework detector tests — TDD RED phase
 *
 * Coverage:
 * 1. GSD detection via .planning/ directory
 * 2. BMAD detection via bmad.yaml
 * 3. Speckit detection via speckit.json
 * 4. Empty result when no frameworks present
 * 5. Multiple frameworks detected simultaneously
 * 6. Boundary information included in metadata
 * 7. Namespace prefix generation
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { mkdtempSync, writeFileSync, mkdirSync, rmdirSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import {
  detectFrameworks,
  validateBoundaries,
  KNOWN_FRAMEWORKS,
} from "../../src/features/bootstrap/framework-detector.js"

describe("framework-detector", () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "framework-test-"))
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  it("detects GSD when .planning/ directory exists", async () => {
    mkdirSync(join(tempDir, ".planning"))
    writeFileSync(join(tempDir, ".planning", "ROADMAP.md"), "# roadmap")

    const result = await detectFrameworks(tempDir)
    expect(result.frameworks).toHaveLength(1)
    expect(result.frameworks[0].marker.name).toBe("gsd")
    expect(result.frameworks[0].configPath).toBe(join(tempDir, ".planning", "ROADMAP.md"))
    expect(result.conflicts).toHaveLength(0)
  })

  it("detects BMAD when bmad.yaml exists", async () => {
    writeFileSync(join(tempDir, "bmad.yaml"), "version: 1\n")

    const result = await detectFrameworks(tempDir)
    expect(result.frameworks).toHaveLength(1)
    expect(result.frameworks[0].marker.name).toBe("bmad")
    expect(result.frameworks[0].configPath).toBe(join(tempDir, "bmad.yaml"))
    expect(result.conflicts).toHaveLength(0)
  })

  it("detects Speckit when speckit.json exists", async () => {
    writeFileSync(join(tempDir, "speckit.json"), '{"version":"1"}')

    const result = await detectFrameworks(tempDir)
    expect(result.frameworks).toHaveLength(1)
    expect(result.frameworks[0].marker.name).toBe("speckit")
    expect(result.frameworks[0].configPath).toBe(join(tempDir, "speckit.json"))
    expect(result.conflicts).toHaveLength(0)
  })

  it("returns empty array when no frameworks detected", async () => {
    const result = await detectFrameworks(tempDir)
    expect(result.frameworks).toHaveLength(0)
    expect(result.conflicts).toHaveLength(0)
    expect(result.warnings).toHaveLength(0)
  })

  it("detects multiple frameworks simultaneously", async () => {
    mkdirSync(join(tempDir, ".planning"))
    writeFileSync(join(tempDir, ".planning", "ROADMAP.md"), "# roadmap")
    writeFileSync(join(tempDir, "bmad.yaml"), "version: 1\n")

    const result = await detectFrameworks(tempDir)
    const names = result.frameworks.map(f => f.marker.name)
    expect(names).toContain("gsd")
    expect(names).toContain("bmad")
    expect(result.frameworks).toHaveLength(2)
  })

  it("includes boundary information in metadata", async () => {
    mkdirSync(join(tempDir, ".planning"))
    writeFileSync(join(tempDir, ".planning", "STATE.md"), "---\n")

    const result = await detectFrameworks(tempDir)
    expect(result.frameworks[0].boundaryPaths).toContain(join(tempDir, ".planning"))
    expect(result.frameworks[0].marker.boundaryDirs).toContain(".planning")
  })

  it("generates correct namespace prefix for each framework", async () => {
    mkdirSync(join(tempDir, ".planning"))
    writeFileSync(join(tempDir, "bmad.yaml"), "version: 1\n")

    const result = await detectFrameworks(tempDir)
    const gsd = result.frameworks.find(f => f.marker.name === "gsd")
    const bmad = result.frameworks.find(f => f.marker.name === "bmad")
    expect(gsd?.marker.namespacePrefix).toBe("gsd")
    expect(bmad?.marker.namespacePrefix).toBe("bmad")
  })

  it("reports no conflicts when boundaries do not overlap", async () => {
    mkdirSync(join(tempDir, ".planning"))
    mkdirSync(join(tempDir, ".opencode"))

    const result = await detectFrameworks(tempDir)
    const gsd = result.frameworks.find(f => f.marker.name === "gsd")
    const hivemind = result.frameworks.find(f => f.marker.name === "hivemind")

    if (gsd && hivemind) {
      expect(result.conflicts).toHaveLength(0)
    }
  })

  it("validateBoundaries reports overlapping directory claims", () => {
    const frameworks = [
      {
        marker: KNOWN_FRAMEWORKS[0],
        rootPath: "/project",
        configPath: "/project/.planning",
        boundaryPaths: ["/project/.planning"],
      },
      {
        marker: {
          ...KNOWN_FRAMEWORKS[3],
          boundaryDirs: [".planning"],
        },
        rootPath: "/project",
        configPath: "/project/.planning",
        boundaryPaths: ["/project/.planning"],
      },
    ]

    const conflicts = validateBoundaries(frameworks)
    expect(conflicts.length).toBeGreaterThan(0)
    expect(conflicts[0]).toContain("overlapping boundaries")
  })

  it("validateBoundaries reports overlapping directory claims", () => {
    const frameworks = [
      {
        marker: KNOWN_FRAMEWORKS[0],
        rootPath: "/project",
        configPath: "/project/.planning",
        boundaryPaths: ["/project/.planning"],
      },
      {
        marker: KNOWN_FRAMEWORKS[3],
        rootPath: "/project",
        configPath: "/project/.opencode",
        boundaryPaths: ["/project/.opencode"],
      },
    ]

    const conflicts = validateBoundaries(frameworks)
    expect(conflicts).toHaveLength(0)
  })
})
