import { describe, it, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"

import {
  auditHiveFiverAssets,
  detectAutoRealignment,
  seedHiveFiverOnboardingTasks,
} from "../../src/lib/hivefiver-integration.js"
import { loadTasks } from "../../src/lib/manifest.js"

describe("HiveFiver integration helpers", () => {
  let dir: string

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "hm-hivefiver-integr-"))
    await mkdir(join(dir, "commands"), { recursive: true })
    await mkdir(join(dir, "skills"), { recursive: true })
    await mkdir(join(dir, "workflows"), { recursive: true })
    await mkdir(join(dir, ".opencode", "commands"), { recursive: true })
    await mkdir(join(dir, ".opencode", "skills"), { recursive: true })
    await mkdir(join(dir, ".opencode", "workflows"), { recursive: true })
  })

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  it("detects auto-realignment when no command is provided", () => {
    const result = detectAutoRealignment("please help me plan this project")
    assert.equal(result.shouldRealign, true)
    assert.equal(result.reason, "no_command_detected")
    assert.equal(typeof result.recommendedCommand, "string")
    assert.ok(result.recommendedSkills.length > 0)
  })

  it("detects unknown slash commands and suggests fallback", () => {
    const result = detectAutoRealignment("/totally-unknown do this")
    assert.equal(result.shouldRealign, true)
    assert.equal(result.reason, "unknown_command_detected")
    assert.deepEqual(result.unknownCommands, ["totally-unknown"])
  })

  it("does not force realignment when known command is used", () => {
    const result = detectAutoRealignment("/hivefiver-research verify mcp")
    assert.equal(result.shouldRealign, false)
    assert.equal(result.reason, "known_command_detected")
  })

  it("audits missing assets across root and .opencode", () => {
    const audit = auditHiveFiverAssets(dir, { sourceRoot: dir })
    assert.equal(audit.hasCriticalGaps, true)
    assert.ok(audit.rootMissing.commands.length > 0)
    assert.ok(audit.opencodeMissing.skills.length > 0)
  })

  it("seeds onboarding tasks with related entities", async () => {
    const sessionId = "session-test-1"
    const result = await seedHiveFiverOnboardingTasks(dir, sessionId)

    assert.equal(result.updated, true)
    assert.ok(result.created >= 3)

    const manifest = await loadTasks(dir)
    assert.ok(manifest)
    assert.equal(manifest?.session_id, sessionId)
    assert.ok((manifest?.tasks.length ?? 0) >= 3)

    const first = manifest?.tasks.find((task) => task.id === "hivefiver-bootstrap")
    assert.ok(first)
    assert.equal(first?.source, "init.seed")
    assert.equal(first?.related_entities?.session_id, sessionId)
    assert.ok(Array.isArray(first?.recommended_skills))
  })

  it("reports healthy audit once required files are present", async () => {
    const files = [
      "commands/hivefiver-start.md",
      "commands/hivefiver-intake.md",
      "commands/hivefiver-specforge.md",
      "commands/hivefiver-research.md",
      "commands/hivefiver-skillforge.md",
      "commands/hivefiver-gsd-bridge.md",
      "commands/hivefiver-ralph-bridge.md",
      "commands/hivefiver-doctor.md",
      "skills/hivefiver-persona-routing/SKILL.md",
      "skills/hivefiver-spec-distillation/SKILL.md",
      "skills/hivefiver-mcp-research-loop/SKILL.md",
      "skills/hivefiver-gsd-compat/SKILL.md",
      "skills/hivefiver-ralph-tasking/SKILL.md",
      "skills/hivefiver-bilingual-tutor/SKILL.md",
      "skills/hivefiver-skill-auditor/SKILL.md",
      "workflows/hivefiver-vibecoder.yaml",
      "workflows/hivefiver-enterprise.yaml",
      "workflows/hivefiver-mcp-fallback.yaml",
      ".opencode/commands/hivefiver-start.md",
      ".opencode/commands/hivefiver-intake.md",
      ".opencode/commands/hivefiver-specforge.md",
      ".opencode/commands/hivefiver-research.md",
      ".opencode/commands/hivefiver-skillforge.md",
      ".opencode/commands/hivefiver-gsd-bridge.md",
      ".opencode/commands/hivefiver-ralph-bridge.md",
      ".opencode/commands/hivefiver-doctor.md",
      ".opencode/skills/hivefiver-persona-routing/SKILL.md",
      ".opencode/skills/hivefiver-spec-distillation/SKILL.md",
      ".opencode/skills/hivefiver-mcp-research-loop/SKILL.md",
      ".opencode/skills/hivefiver-gsd-compat/SKILL.md",
      ".opencode/skills/hivefiver-ralph-tasking/SKILL.md",
      ".opencode/skills/hivefiver-bilingual-tutor/SKILL.md",
      ".opencode/skills/hivefiver-skill-auditor/SKILL.md",
      ".opencode/workflows/hivefiver-vibecoder.yaml",
      ".opencode/workflows/hivefiver-enterprise.yaml",
      ".opencode/workflows/hivefiver-mcp-fallback.yaml",
    ]

    for (const file of files) {
      const path = join(dir, file)
      await mkdir(dirname(path), { recursive: true })
      await writeFile(path, "stub")
    }

    const audit = auditHiveFiverAssets(dir, { sourceRoot: dir })
    assert.equal(audit.hasCriticalGaps, false)
  })
})
