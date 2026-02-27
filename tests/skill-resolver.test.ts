import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import {
  loadSkillRegistry,
  resolveSkills,
  resolveLocalFirstSkillPath,
  isDisclosureAllowed,
} from "../src/lib/skill-registry.js"

describe("skill resolver", () => {
  it("loads and validates root skill registry", () => {
    const registry = loadSkillRegistry(process.cwd())
    assert.ok(registry.skills.length > 0)
    assert.equal(registry.local_first_resolution, true)
  })

  it("filters selection by bundle, disclosure, and token budget", () => {
    const registry = loadSkillRegistry(process.cwd())

    const result = resolveSkills(registry, {
      requestedSkills: ["hivemind-governance", "creative-ideating-room"],
      allowedBundles: ["governance-core", "planning-core"],
      maxDisclosureLevel: "L1",
      tokenBudget: 700,
      estimatedTokensPerSkill: 600,
      includeExperimental: false,
    })

    assert.equal(result.selected.length, 1)
    assert.equal(result.selected[0]?.name, "hivemind-governance")
    assert.ok(result.skipped.some((item) => item.name === "creative-ideating-room"))
  })

  it("prefers root skill path before mirror", () => {
    const temp = mkdtempSync(join(tmpdir(), "hm-skill-resolver-"))

    const rootSkillPath = join(temp, "skills", "demo-skill")
    mkdirSync(rootSkillPath, { recursive: true })
    writeFileSync(join(rootSkillPath, "SKILL.md"), "# root\n", "utf-8")

    const mirrorSkillPath = join(temp, ".opencode", "skills", "demo-skill")
    mkdirSync(mirrorSkillPath, { recursive: true })
    writeFileSync(join(mirrorSkillPath, "SKILL.md"), "# mirror\n", "utf-8")

    const resolved = resolveLocalFirstSkillPath(temp, "demo-skill")
    assert.equal(resolved, join(rootSkillPath, "SKILL.md"))
  })

  it("enforces disclosure ordering", () => {
    assert.equal(isDisclosureAllowed("L1", "L2"), true)
    assert.equal(isDisclosureAllowed("L3", "L1"), false)
  })
})
