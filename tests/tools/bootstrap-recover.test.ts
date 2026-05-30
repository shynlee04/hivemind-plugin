import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

import { describe, expect, it } from "vitest"

import { bootstrapInit } from "../../src/tools/config/bootstrap-init.js"
import { bootstrapRecover } from "../../src/tools/config/bootstrap-recover.js"

const TIMEOUT_30S = 30_000

function createTempProject(): string {
  const projectRoot = mkdtempSync(join(tmpdir(), "hivemind-bootstrap-recover-"))
  return projectRoot
}

describe("bootstrapRecover", () => {
  it("repairs missing project-scope symlinks", { timeout: TIMEOUT_30S }, async () => {
    const projectRoot = createTempProject()
    try {
      await bootstrapInit({ projectRoot, scope: "project", nonInteractive: true, config: {} })
      rmSync(join(projectRoot, ".opencode", "skills", "hivemind-power-on"), { recursive: true, force: true })
      rmSync(join(projectRoot, ".opencode", "agents", "hm-orchestrator.md"), { force: true })
      rmSync(join(projectRoot, ".opencode", "commands", "start-work.md"), { force: true })
      rmSync(join(projectRoot, ".opencode", "workflows", "hm-discuss.md"), { force: true })
      rmSync(join(projectRoot, ".opencode", "references", "hm-gate-triad.md"), { force: true })
      rmSync(join(projectRoot, ".opencode", "templates", "hm-plan.md"), { force: true })

      const result = await bootstrapRecover({ projectRoot, scope: "project" })
      expect(result.counts.skills.repaired).toBe(1)
      expect(result.counts.agents.repaired).toBe(1)
      expect(result.counts.commands.repaired).toBe(1)
      expect(result.counts.workflows.repaired).toBe(1)
      expect(result.counts.references.repaired).toBe(1)
      expect(result.counts.templates.repaired).toBe(1)
    } finally {
      rmSync(projectRoot, { recursive: true, force: true })
    }
  })

  it("repairs only the selected global primitive scope", { timeout: TIMEOUT_30S }, async () => {
    const projectRoot = createTempProject()
    const globalRoot = mkdtempSync(join(tmpdir(), "hivemind-bootstrap-recover-global-"))
    try {
      await bootstrapInit({ projectRoot, scope: "global", globalConfigDir: globalRoot, nonInteractive: true, config: {} })
      rmSync(join(globalRoot, "skills", "hivemind-power-on"), { recursive: true, force: true })
      rmSync(join(globalRoot, "agents", "hm-orchestrator.md"), { force: true })
      rmSync(join(globalRoot, "commands", "start-work.md"), { force: true })
      rmSync(join(globalRoot, "workflows", "hm-discuss.md"), { force: true })
      rmSync(join(globalRoot, "references", "hm-gate-triad.md"), { force: true })
      rmSync(join(globalRoot, "templates", "hm-plan.md"), { force: true })

      const result = await bootstrapRecover({ projectRoot, scope: "global", globalConfigDir: globalRoot })
      expect(result.effectiveScope).toBe("global")
      expect(result.counts.skills.repaired).toBe(1)
      expect(result.counts.agents.repaired).toBe(1)
      expect(result.counts.commands.repaired).toBe(1)
      expect(result.counts.workflows.repaired).toBe(1)
      expect(result.counts.references.repaired).toBe(1)
      expect(result.counts.templates.repaired).toBe(1)
    } finally {
      rmSync(projectRoot, { recursive: true, force: true })
      rmSync(globalRoot, { recursive: true, force: true })
    }
  })

  it("skips real-file conflicts without overwriting contents", { timeout: TIMEOUT_30S }, async () => {
    const projectRoot = createTempProject()
    try {
      await bootstrapInit({ projectRoot, scope: "project", nonInteractive: true, config: {} })
      rmSync(join(projectRoot, ".opencode", "skills", "hivemind-power-on"), { recursive: true, force: true })
      mkdirSync(join(projectRoot, ".opencode", "skills", "hivemind-power-on"), { recursive: true })
      writeFileSync(join(projectRoot, ".opencode", "skills", "hivemind-power-on", "SKILL.md"), "keep-me", "utf8")

      const result = await bootstrapRecover({ projectRoot, scope: "project" })
      expect(result.counts.skills.ok).toBeGreaterThanOrEqual(1)
      expect(result.counts.skills.repaired).toBe(0)
      expect(readFileSync(join(projectRoot, ".opencode", "skills", "hivemind-power-on", "SKILL.md"), "utf8")).toBe("keep-me")
    } finally {
      rmSync(projectRoot, { recursive: true, force: true })
    }
  })

  it("recreates broken symlinks to the correct relative target", { timeout: TIMEOUT_30S }, async () => {
    const projectRoot = createTempProject()
    try {
      await bootstrapInit({ projectRoot, scope: "project", nonInteractive: true, config: {} })
      rmSync(join(projectRoot, ".opencode", "skills", "hivemind-power-on"), { recursive: true, force: true })
      symlinkSync("../wrong-target", join(projectRoot, ".opencode", "skills", "hivemind-power-on"))

      const result = await bootstrapRecover({ projectRoot, scope: "project" })
      expect(result.counts.skills.broken).toBe(1)
      expect(result.counts.skills.repaired).toBe(1)
    } finally {
      rmSync(projectRoot, { recursive: true, force: true })
    }
  })
})
