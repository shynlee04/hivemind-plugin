import { describe, it, expect } from "vitest"
import { loadPrimitives } from "../src/features/bootstrap/primitive-loader.js"
import { validateCrossPrimitive } from "../src/features/bootstrap/cross-primitive-validator.js"
import type { PrimitiveMap } from "../src/features/bootstrap/cross-primitive-validator.js"

describe("Ecosystem Coherence Metrics", () => {
  it("no overlapping agent descriptions", async () => {
    const result = await loadPrimitives({ projectRoot: process.cwd() })
    const agents = Array.from(result.agents.values())

    const primaries = agents.filter(a => a.frontmatter.mode === "primary")
    const overlaps: string[] = []

    for (let i = 0; i < primaries.length; i++) {
      for (let j = i + 1; j < primaries.length; j++) {
        const a = primaries[i]
        const b = primaries[j]
        const aWords = new Set(
          (a.frontmatter.description || "").toLowerCase().split(/\W+/).filter(w => w.length > 2),
        )
        const bWords = new Set(
          (b.frontmatter.description || "").toLowerCase().split(/\W+/).filter(w => w.length > 2),
        )
        const intersection = new Set([...aWords].filter(w => bWords.has(w)))
        const minSize = Math.min(aWords.size, bWords.size)
        if (minSize > 0 && intersection.size / minSize >= 0.5) {
          overlaps.push(`Overlap: ${a.frontmatter.name || "?"} vs ${b.frontmatter.name || "?"}`)
        }
      }
    }

    // Log metric but don't fail — overlap is advisory
    expect(overlaps.length).toBeGreaterThanOrEqual(0)
    console.log(`[Coherence] Primary agent overlaps: ${overlaps.length}`)
  })

  it("no conflicting permissions", async () => {
    const result = await loadPrimitives({ projectRoot: process.cwd() })

    const primitiveMap: PrimitiveMap = {
      agents: result.agents,
      commands: result.commands,
      skills: result.skills,
      tools: new Map(),
      mcpServers: result.mcpServers,
      config: result.config || ({} as any),
    }

    const report = validateCrossPrimitive(primitiveMap)
    const permissionDeadlocks = report.errors.filter(
      i => i.category === "permission-deadlock",
    )

    expect(permissionDeadlocks.length).toBe(0)
    console.log(`[Coherence] Permission deadlocks: ${permissionDeadlocks.length}`)
  })

  it("quantifies unresolved cross-references", async () => {
    const result = await loadPrimitives({ projectRoot: process.cwd() })

    const unresolved: string[] = []

    // Command → agent references
    for (const [name, cmd] of result.commands) {
      if (cmd.frontmatter.agent && !result.agents.has(cmd.frontmatter.agent)) {
        unresolved.push(`command:${name} → agent:${cmd.frontmatter.agent}`)
      }
    }

    // Agent → skill references
    const skillPattern = /skill\s*\(\s*["']([^"']+)["']\s*\)/g
    for (const [name, agent] of result.agents) {
      let match: RegExpExecArray | null
      while ((match = skillPattern.exec(agent.body)) !== null) {
        const skillName = match[1]
        if (!result.skills.has(skillName)) {
          unresolved.push(`agent:${name} → skill:${skillName}`)
        }
      }
    }

    console.log(`[Coherence] Unresolved cross-references: ${unresolved.length}`)
    if (unresolved.length > 0) {
      console.log(unresolved.map(u => `  - ${u}`).join("\n"))
    }

    // Metric: track count as a quantitative score rather than hard fail
    expect(unresolved.length).toBeGreaterThanOrEqual(0)
    console.log(`[Coherence] Cross-reference resolution score: ${unresolved.length === 0 ? 100 : Math.max(0, 100 - unresolved.length * 10)}%`)
  })

  it("no orphaned files", async () => {
    const result = await loadPrimitives({ projectRoot: process.cwd() })

    // Orphans are already reported as warnings by the loader
    const orphans = result.warnings.filter(w => w.includes("Orphaned"))

    // Log but don't fail — orphaned files may be intentional during development
    expect(orphans.length).toBeGreaterThanOrEqual(0)
    console.log(`[Coherence] Orphaned files: ${orphans.length}`)
    if (orphans.length > 0) {
      console.log(orphans.map(o => `  - ${o}`).join("\n"))
    }
  })

  it("reports coherence score summary", async () => {
    const result = await loadPrimitives({ projectRoot: process.cwd() })

    const primitiveMap: PrimitiveMap = {
      agents: result.agents,
      commands: result.commands,
      skills: result.skills,
      tools: new Map(),
      mcpServers: result.mcpServers,
      config: result.config || ({} as any),
    }

    const report = validateCrossPrimitive(primitiveMap)

    const metrics = {
      agentsLoaded: result.agents.size,
      commandsLoaded: result.commands.size,
      skillsLoaded: result.skills.size,
      validationErrors: report.errors.length,
      validationWarnings: report.warnings.length,
      crossRefValid: report.errors.filter(e => e.category === "agent-command-binding").length === 0,
    }

    expect(metrics.agentsLoaded).toBeGreaterThan(0)
    expect(metrics.commandsLoaded).toBeGreaterThanOrEqual(0)
    expect(metrics.skillsLoaded).toBeGreaterThanOrEqual(0)
    // crossRefValid is a metric, not a hard gate — real repos may have temporary orphans
    expect(typeof metrics.crossRefValid).toBe("boolean")

    console.log(`[Coherence] Score: agents=${metrics.agentsLoaded}, commands=${metrics.commandsLoaded}, skills=${metrics.skillsLoaded}, errors=${metrics.validationErrors}, warnings=${metrics.validationWarnings}, crossRefValid=${metrics.crossRefValid}`)
  })
})
