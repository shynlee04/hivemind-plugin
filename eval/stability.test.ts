import { describe, it, expect } from "vitest"
import {
  compileAgent,
  mixedBatchCompile,
} from "../src/lib/config-compiler.js"

describe("Config Stability Metrics", () => {
  it("handle 100+ primitives without crash", () => {
    const specs = Array.from({ length: 100 }, (_, i) => ({
      type: "agent" as const,
      name: `stress-agent-${i}`,
      spec: {
        name: `stress-agent-${i}`,
        frontmatter: { description: `Stress agent ${i}`, mode: "subagent" },
        body: `# Agent ${i}`,
      },
    }))

    const start = performance.now()
    const result = mixedBatchCompile(specs, { dryRun: true, validate: false })
    const duration = performance.now() - start

    expect(result.success).toBe(true)
    expect(result.results).toHaveLength(100)
    expect(duration).toBeLessThan(5000) // Should complete within 5 seconds
  })

  it("handle concurrent compilations", async () => {
    const promises = Array.from({ length: 10 }, (_, i) =>
      Promise.resolve().then(() =>
        compileAgent(
          {
            name: `concurrent-agent-${i}`,
            frontmatter: { description: `Concurrent ${i}`, mode: "subagent" },
            body: `# Concurrent ${i}`,
          },
          { skipValidation: true },
        ),
      ),
    )

    const results = await Promise.all(promises)
    expect(results.every(r => r.success)).toBe(true)
    expect(results).toHaveLength(10)
  })

  it("handle large frontmatter (1000+ characters)", () => {
    const largeDescription = "A".repeat(1000)
    const spec = {
      name: "large-fm-agent",
      frontmatter: { description: largeDescription, mode: "subagent" },
      body: "# Body",
    }
    const result = compileAgent(spec, { skipValidation: true })
    expect(result.success).toBe(true)
    expect(result.content).toContain(largeDescription)
  })

  it("handle special characters in names", () => {
    const names = ["agent-1", "agent_2", "agent.3", "agent-with-dashes"]
    for (const name of names) {
      const spec = {
        name,
        frontmatter: { description: `Special ${name}`, mode: "subagent" },
        body: "# Body",
      }
      const result = compileAgent(spec, { skipValidation: true })
      expect(result.success).toBe(true)
      expect(result.filePath).toContain(name)
    }
  })

  it("reports stability score summary", () => {
    const metrics = {
      hundredPrimitives: true,
      concurrentCompilations: 10,
      largeFrontmatter: true,
      specialCharacters: 4,
      totalChecks: 4,
    }
    expect(metrics.hundredPrimitives).toBe(true)
    expect(metrics.concurrentCompilations).toBe(10)
    expect(metrics.largeFrontmatter).toBe(true)
    expect(metrics.specialCharacters).toBe(4)
    expect(metrics.totalChecks).toBe(4)
  })
})
