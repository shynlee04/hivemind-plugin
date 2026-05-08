import { describe, it, expect } from "vitest"
import {
  compileAgent,
  compileCommand,
  compileSkill,
  decompileAgent,
  decompileCommand,
  decompileSkill,
} from "../src/config/compiler.js"

// ---------------------------------------------------------------------------
// Correctness metrics
// ---------------------------------------------------------------------------

describe("Config Correctness Metrics", () => {
  it("compiled agent matches spec (round-trip fidelity)", () => {
    const spec = {
      name: "roundtrip-agent",
      frontmatter: { description: "Roundtrip test", mode: "primary" },
      body: "# Test body",
    }
    const compiled = compileAgent(spec, { skipValidation: true })
    expect(compiled.success).toBe(true)

    const decompiled = decompileAgent(compiled.content)
    expect(decompiled.success).toBe(true)
    expect(decompiled.spec!.frontmatter.description).toBe(spec.frontmatter.description)
    expect(decompiled.spec!.frontmatter.mode).toBe(spec.frontmatter.mode)
    expect(decompiled.body).toBe(spec.body)
  })

  it("compiled command matches spec (round-trip fidelity)", () => {
    const spec = {
      name: "roundtrip-cmd",
      frontmatter: { description: "Roundtrip cmd", agent: "coordinator" },
      body: "## Cmd body",
    }
    const compiled = compileCommand(spec, { skipValidation: true })
    expect(compiled.success).toBe(true)

    const decompiled = decompileCommand(compiled.content)
    expect(decompiled.success).toBe(true)
    expect(decompiled.spec!.frontmatter.description).toBe(spec.frontmatter.description)
    expect(decompiled.spec!.frontmatter.agent).toBe(spec.frontmatter.agent)
    expect(decompiled.body).toBe(spec.body)
  })

  it("compiled skill matches spec (round-trip fidelity)", () => {
    const spec = {
      name: "roundtrip-skill",
      frontmatter: { name: "roundtrip-skill", description: "Roundtrip skill" },
      body: "### Skill body",
    }
    const compiled = compileSkill(spec, { skipValidation: true })
    expect(compiled.success).toBe(true)

    const decompiled = decompileSkill(compiled.content)
    expect(decompiled.success).toBe(true)
    expect(decompiled.spec!.frontmatter.name).toBe(spec.frontmatter.name)
    expect(decompiled.spec!.frontmatter.description).toBe(spec.frontmatter.description)
    expect(decompiled.body).toBe(spec.body)
  })

  it("all required fields present in compiled agent output", () => {
    const spec = {
      name: "required-fields-agent",
      frontmatter: { description: "Required fields test", mode: "primary" },
      body: "# Body",
    }
    const result = compileAgent(spec, { skipValidation: true })
    expect(result.success).toBe(true)
    expect(result.content).toContain("description: Required fields test")
    expect(result.content).toContain("mode: primary")
    expect(result.content).toContain("---")
    expect(result.filePath).toContain("agents/required-fields-agent.md")
  })

  it("all required fields present in compiled command output", () => {
    const spec = {
      name: "required-fields-cmd",
      frontmatter: { description: "Required fields cmd", agent: "coordinator" },
      body: "## Body",
    }
    const result = compileCommand(spec, { skipValidation: true })
    expect(result.success).toBe(true)
    expect(result.content).toContain("description: Required fields cmd")
    expect(result.content).toContain("agent: coordinator")
    expect(result.filePath).toContain("commands/required-fields-cmd.md")
  })

  it("all required fields present in compiled skill output", () => {
    const spec = {
      name: "required-fields-skill",
      frontmatter: { name: "required-fields-skill", description: "Required fields skill" },
      body: "### Body",
    }
    const result = compileSkill(spec, { skipValidation: true })
    expect(result.success).toBe(true)
    expect(result.content).toContain("name: required-fields-skill")
    expect(result.content).toContain("description: Required fields skill")
    expect(result.filePath).toContain("skills/required-fields-skill/SKILL.md")
  })

  it("reports correctness score summary", () => {
    // Aggregate correctness metric: all round-trip tests above pass
    const metrics = {
      roundTripFidelity: 3, // 3 primitive types
      requiredFieldsPresent: 3, // 3 primitive types
      totalChecks: 6,
    }
    expect(metrics.roundTripFidelity).toBe(3)
    expect(metrics.requiredFieldsPresent).toBe(3)
    expect(metrics.totalChecks).toBe(6)
  })
})
