import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { parse as parseYaml } from "yaml"
import { SkillRegistrySchema } from "../src/schemas/skill-registry.js"

describe("SkillRegistrySchema", () => {
  it("accepts skills/registry.yaml", () => {
    const raw = readFileSync("skills/registry.yaml", "utf-8")
    const parsed = parseYaml(raw)
    const result = SkillRegistrySchema.safeParse(parsed)

    assert.equal(result.success, true)
    if (!result.success) return

    assert.equal(result.data.source_of_truth, true)
    assert.equal(result.data.local_first_resolution, true)
    assert.ok(result.data.skills.length > 0)
  })

  it("rejects invalid bundle names", () => {
    const result = SkillRegistrySchema.safeParse({
      version: "1.0.0",
      source_of_truth: true,
      local_first_resolution: true,
      external_opt_in: true,
      skills: [
        {
          name: "invalid-skill",
          domain: "test",
          bundle: "invalid-bundle",
          knowledge_delta_score: 0.8,
          status: "active",
          owner: "hivemind-core",
          disclosure_level: "L1",
          triggers: [],
          supersedes: [],
          depends_on: [],
        },
      ],
    })

    assert.equal(result.success, false)
  })
})
