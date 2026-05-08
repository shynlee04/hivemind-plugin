import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

import { describe, expect, it } from "vitest"

import { bootstrapInit } from "../../src/tools/config/bootstrap-init.js"
import { bootstrapRecover } from "../../src/tools/config/bootstrap-recover.js"

function createTempProject(): string {
  const projectRoot = mkdtempSync(join(tmpdir(), "hivemind-bootstrap-recover-"))
  mkdirSync(join(projectRoot, ".hivefiver-meta-builder", "skills-lab", "active", "refactoring", "hm-skill"), { recursive: true })
  mkdirSync(join(projectRoot, ".hivefiver-meta-builder", "agents-lab", "active", "refactoring"), { recursive: true })
  mkdirSync(join(projectRoot, ".hivefiver-meta-builder", "commands-lab", "active", "refactoring"), { recursive: true })
  writeFileSync(join(projectRoot, ".hivefiver-meta-builder", "skills-lab", "active", "refactoring", "hm-skill", "SKILL.md"), "# skill\n", "utf8")
  writeFileSync(join(projectRoot, ".hivefiver-meta-builder", "agents-lab", "active", "refactoring", "hm-agent.md"), "---\nname: hm-agent\n---\n", "utf8")
  writeFileSync(join(projectRoot, ".hivefiver-meta-builder", "commands-lab", "active", "refactoring", "hm-command.md"), "---\ndescription: cmd\n---\n", "utf8")
  return projectRoot
}

describe("bootstrapRecover", () => {
  it("repairs missing project-scope symlinks", async () => {
    const projectRoot = createTempProject()
    try {
      await bootstrapInit({ projectRoot, scope: "project", nonInteractive: true, config: {} })
      unlinkSync(join(projectRoot, ".opencode", "skills", "hm-skill"))
      unlinkSync(join(projectRoot, ".opencode", "agents", "hm-agent.md"))
      unlinkSync(join(projectRoot, ".opencode", "commands", "hm-command.md"))

      const result = await bootstrapRecover({ projectRoot, scope: "project" })
      expect(result.counts.skills.repaired).toBe(1)
      expect(result.counts.agents.repaired).toBe(1)
      expect(result.counts.commands.repaired).toBe(1)
    } finally {
      rmSync(projectRoot, { recursive: true, force: true })
    }
  })

  it("repairs only the selected global primitive scope", async () => {
    const projectRoot = createTempProject()
    const globalRoot = mkdtempSync(join(tmpdir(), "hivemind-bootstrap-recover-global-"))
    try {
      await bootstrapInit({ projectRoot, scope: "global", globalConfigDir: globalRoot, nonInteractive: true, config: {} })
      unlinkSync(join(globalRoot, "skills", "hm-skill"))
      unlinkSync(join(globalRoot, "agents", "hm-agent.md"))
      unlinkSync(join(globalRoot, "commands", "hm-command.md"))

      const result = await bootstrapRecover({ projectRoot, scope: "global", globalConfigDir: globalRoot })
      expect(result.effectiveScope).toBe("global")
      expect(result.counts.skills.repaired).toBe(1)
      expect(result.counts.agents.repaired).toBe(1)
      expect(result.counts.commands.repaired).toBe(1)
    } finally {
      rmSync(projectRoot, { recursive: true, force: true })
      rmSync(globalRoot, { recursive: true, force: true })
    }
  })

  it("skips real-file conflicts without overwriting contents", async () => {
    const projectRoot = createTempProject()
    try {
      await bootstrapInit({ projectRoot, scope: "project", nonInteractive: true, config: {} })
      unlinkSync(join(projectRoot, ".opencode", "skills", "hm-skill"))
      writeFileSync(join(projectRoot, ".opencode", "skills", "hm-skill"), "keep-me", "utf8")

      const result = await bootstrapRecover({ projectRoot, scope: "project" })
      expect(result.counts.skills.file).toBe(1)
      expect(result.counts.skills.repaired).toBe(0)
      expect(readFileSync(join(projectRoot, ".opencode", "skills", "hm-skill"), "utf8")).toBe("keep-me")
    } finally {
      rmSync(projectRoot, { recursive: true, force: true })
    }
  })

  it("recreates broken symlinks to the correct relative target", async () => {
    const projectRoot = createTempProject()
    try {
      await bootstrapInit({ projectRoot, scope: "project", nonInteractive: true, config: {} })
      unlinkSync(join(projectRoot, ".opencode", "skills", "hm-skill"))
      symlinkSync("../wrong-target", join(projectRoot, ".opencode", "skills", "hm-skill"))

      const result = await bootstrapRecover({ projectRoot, scope: "project" })
      expect(result.counts.skills.broken).toBe(1)
      expect(result.counts.skills.repaired).toBe(1)
    } finally {
      rmSync(projectRoot, { recursive: true, force: true })
    }
  })
})
