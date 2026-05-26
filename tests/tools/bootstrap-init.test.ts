import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

import { describe, expect, it } from "vitest"

import { bootstrapInit } from "../../src/tools/config/bootstrap-init.js"

const CANONICAL_HIVEMIND_DIRECTORIES = [
  "state",
  "delegation",
  "journal",
  "lineage",
  "daily-notes",
  "hm-brain",
  "hf-brain",
  "delegation-managements",
  "task-managements",
  "runtime",
  "artifacts",
  "sidecar",
  "logs",
  "poor-prompts",
  "uat",
  "manifests",
  "registries",
  "onboarding",
] as const

function createTempProject(): string {
  const projectRoot = mkdtempSync(join(tmpdir(), "hivemind-bootstrap-init-"))
  return projectRoot
}

describe("bootstrapInit", () => {
  it("creates tier-1 .hivemind directories with .gitkeep files and project-scope symlinks", async () => {
    const projectRoot = createTempProject()
    try {
      const result = await bootstrapInit({
        projectRoot,
        scope: "project",
        nonInteractive: true,
        config: {},
      })

      expect(result.effectiveScope).toBe("project")
      expect(readFileSync(join(projectRoot, ".hivemind", "configs.json"), "utf8")).toContain("$schema")
      for (const directory of CANONICAL_HIVEMIND_DIRECTORIES) {
        expect(existsSync(join(projectRoot, ".hivemind", directory, ".gitkeep")), directory).toBe(true)
      }
      expect(existsSync(join(projectRoot, ".opencode", "skills", "hivemind-power-on", "SKILL.md"))).toBe(true)
      expect(existsSync(join(projectRoot, ".opencode", "agents", "hm-orchestrator.md"))).toBe(true)
      expect(existsSync(join(projectRoot, ".opencode", "commands", "start-work.md"))).toBe(true)
      expect(lstatSync(join(projectRoot, ".opencode", "agents", "hm-orchestrator.md")).isSymbolicLink()).toBe(false)
    } finally {
      rmSync(projectRoot, { recursive: true, force: true })
    }
  })

  it("keeps .hivemind local while installing primitives to an explicit global scope", async () => {
    const projectRoot = createTempProject()
    const globalRoot = mkdtempSync(join(tmpdir(), "hivemind-bootstrap-global-"))
    try {
      const result = await bootstrapInit({
        projectRoot,
        scope: "global",
        globalConfigDir: globalRoot,
        nonInteractive: true,
        config: {},
      })

      expect(result.effectiveScope).toBe("global")
      expect(result.primitiveTargetRoot).toBe(globalRoot)
      expect(readFileSync(join(projectRoot, ".hivemind", "configs.json"), "utf8")).toContain("$schema")
      expect(existsSync(join(globalRoot, "skills", "hivemind-power-on", "SKILL.md"))).toBe(true)
      expect(lstatSync(join(globalRoot, "skills", "hivemind-power-on", "SKILL.md")).isSymbolicLink()).toBe(false)
    } finally {
      rmSync(projectRoot, { recursive: true, force: true })
      rmSync(globalRoot, { recursive: true, force: true })
    }
  })

  it("falls back to project scope when the explicit global path is unavailable", async () => {
    const projectRoot = createTempProject()
    const blockerFile = join(projectRoot, "global-blocker")
    try {
      writeFileSync(blockerFile, "block", "utf8")
      const result = await bootstrapInit({
        projectRoot,
        scope: "global",
        globalConfigDir: join(blockerFile, "nested"),
        nonInteractive: true,
        config: {},
      })

      expect(result.effectiveScope).toBe("project")
      expect(result.fallbackApplied).toBe(true)
      expect(result.fallbackReason).toContain("falling back")
      expect(readFileSync(join(projectRoot, ".hivemind", "configs.json"), "utf8")).toContain("$schema")
      expect(existsSync(join(projectRoot, ".opencode", "skills", "hivemind-power-on", "SKILL.md"))).toBe(true)
    } finally {
      rmSync(projectRoot, { recursive: true, force: true })
    }
  })

  it("preserves existing real files and existing configs.json byte-for-byte", async () => {
    const projectRoot = createTempProject()
    const existingConfig = "{\n  \"$schema\": \"./configs.schema.json\",\n  \"mode\": \"free-style\"\n}\n"
    try {
      mkdirSync(join(projectRoot, ".opencode", "skills"), { recursive: true })
      writeFileSync(join(projectRoot, ".opencode", "skills", "hm-skill"), "real file", "utf8")
      mkdirSync(join(projectRoot, ".hivemind"), { recursive: true })
      writeFileSync(join(projectRoot, ".hivemind", "configs.json"), existingConfig, "utf8")

      await bootstrapInit({
        projectRoot,
        scope: "project",
        nonInteractive: true,
        config: {},
      })

      expect(readFileSync(join(projectRoot, ".opencode", "skills", "hm-skill"), "utf8")).toBe("real file")
      expect(readFileSync(join(projectRoot, ".hivemind", "configs.json"), "utf8")).toBe(existingConfig)
    } finally {
      rmSync(projectRoot, { recursive: true, force: true })
    }
  })

  it("backs up the selected primitive target when version drift exists and skips backup on fresh install", async () => {
    const projectRoot = createTempProject()
    try {
      mkdirSync(join(projectRoot, ".hivemind", "state"), { recursive: true })
      mkdirSync(join(projectRoot, ".opencode", "skills", "hivemind-power-on"), { recursive: true })
      writeFileSync(join(projectRoot, ".opencode", "skills", "hivemind-power-on", "SKILL.md"), "old skill contents", "utf8")
      writeFileSync(join(projectRoot, ".hivemind", "state", "version.json"), '{"version":"0.0.1"}\n', "utf8")

      const result = await bootstrapInit({
        projectRoot,
        scope: "project",
        nonInteractive: true,
        config: {},
      })

      expect(result.backupPath).toBeTruthy()
      expect(readFileSync(join(projectRoot, ".hivemind", "state", "version.json"), "utf8")).toContain("0.1.0")

      const freshProject = createTempProject()
      try {
        const freshResult = await bootstrapInit({ projectRoot: freshProject, scope: "project", nonInteractive: true, config: {} })
        expect(freshResult.backupPath).toBeUndefined()
      } finally {
        rmSync(freshProject, { recursive: true, force: true })
      }
    } finally {
      rmSync(projectRoot, { recursive: true, force: true })
    }
  })

  it("refreshes configs.schema.json when version drift exists or generated content differs", async () => {
    const projectRoot = createTempProject()
    try {
      mkdirSync(join(projectRoot, ".hivemind", "state"), { recursive: true })
      writeFileSync(join(projectRoot, ".hivemind", "state", "version.json"), '{"version":"0.0.1"}\n', "utf8")
      writeFileSync(join(projectRoot, ".hivemind", "configs.schema.json"), '{"type":"stale"}\n', "utf8")

      await bootstrapInit({
        projectRoot,
        scope: "project",
        nonInteractive: true,
        config: {},
      })

      const refreshed = readFileSync(join(projectRoot, ".hivemind", "configs.schema.json"), "utf8")
      expect(refreshed).toContain('"$schema"')
      expect(refreshed).not.toContain('"type":"stale"')
    } finally {
      rmSync(projectRoot, { recursive: true, force: true })
    }
  })
})
