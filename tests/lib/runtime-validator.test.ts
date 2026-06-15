/**
 * Runtime validator tests — TDD RED phase
 *
 * Coverage:
 * 1. Circular dependencies in agent-command chain
 * 2. Circular dependencies in agent-skill chain
 * 3. Missing dependencies in resolution order
 * 4. Broken permission inheritance chains
 * 5. Misaligned agent pipeline positions
 * 6. Comprehensive RuntimeValidationReport
 * 7. Pass when no issues found
 */

import { describe, it, expect } from "vitest"
import {
  validateLoadingOrder,
  validateResolutionOrder,
  validateInheritanceChain,
  validatePipelinePosition,
  validateRuntime,
} from "../../src/features/bootstrap/runtime-validator.js"
import type { PrimitiveMap } from "../../src/features/bootstrap/cross-primitive-validator.js"

function makePrimitiveMap(overrides?: Partial<PrimitiveMap>): PrimitiveMap {
  return {
    agents: new Map(),
    commands: new Map(),
    skills: new Map(),
    tools: new Map(),
    mcpServers: new Map(),
    config: { instructions: [] },
    ...overrides,
  } as PrimitiveMap
}

describe("runtime-validator", () => {
  describe("validateLoadingOrder", () => {
    it("detects circular dependencies in agent-command chain", () => {
      const agents = new Map([
        ["agent-a", {
          frontmatter: { description: "Agent A", mode: "all" as const },
          body: "Invokes /command-c",
          filePath: ".opencode/agents/agent-a.md",
        }],
      ])
      const commands = new Map([
        ["command-c", {
          frontmatter: { description: "Command C", agent: "agent-a" },
          body: "Delegates to agent-a",
          filePath: ".opencode/commands/command-c.md",
        }],
      ])

      const result = validateLoadingOrder(makePrimitiveMap({ agents, commands }))
      expect(result.valid).toBe(false)
      expect(result.cycles.length).toBeGreaterThan(0)
      const cycleNames = result.cycles[0]
      expect(cycleNames).toContain("agent-a")
      expect(cycleNames).toContain("command-c")
    })

    it("does not treat natural language mentions as command dependencies", () => {
      const agents = new Map([
        ["conductor", {
          frontmatter: { description: "Conductor", mode: "primary" as const },
          body: "Can create a plan and coordinate work.",
          filePath: ".opencode/agents/conductor.md",
        }],
      ])
      const commands = new Map([
        ["plan", {
          frontmatter: { description: "Plan command", agent: "conductor" },
          body: "Plan work",
          filePath: ".opencode/commands/plan.md",
        }],
      ])

      const result = validateLoadingOrder(makePrimitiveMap({ agents, commands }))
      expect(result.valid).toBe(true)
      expect(result.cycles).toHaveLength(0)
    })

    it("detects circular dependencies in agent-skill chain", () => {
      const agents = new Map([
        ["agent-a", {
          frontmatter: { description: "Agent A", mode: "all" as const },
          body: 'skill("skill-s")',
          filePath: ".opencode/agents/agent-a.md",
        }],
      ])
      const skills = new Map([
        ["skill-s", {
          frontmatter: { name: "skill-s", description: "Skill S" },
          body: 'Delegate to @agent-a',
          directoryName: "skill-s",
          skillPath: ".opencode/skills/skill-s/SKILL.md",
        }],
      ])

      const result = validateLoadingOrder(makePrimitiveMap({ agents, skills }))
      expect(result.valid).toBe(false)
      expect(result.cycles.length).toBeGreaterThan(0)
    })

    it("passes when no circular dependencies exist", () => {
      const agents = new Map([
        ["agent-a", {
          frontmatter: { description: "Agent A", mode: "all" as const },
          body: "No references",
          filePath: ".opencode/agents/agent-a.md",
        }],
      ])

      const result = validateLoadingOrder(makePrimitiveMap({ agents }))
      expect(result.valid).toBe(true)
      expect(result.cycles).toHaveLength(0)
    })
  })

  describe("validateResolutionOrder", () => {
    it("detects missing dependencies", () => {
      const commands = new Map([
        ["command-c", {
          frontmatter: { description: "Command C", agent: "missing-agent" },
          body: "Uses missing agent",
          filePath: ".opencode/commands/command-c.md",
        }],
      ])

      const result = validateResolutionOrder(makePrimitiveMap({ commands }))
      expect(result.valid).toBe(false)
      expect(result.missing.length).toBeGreaterThan(0)
      expect(result.missing[0].target).toBe("missing-agent")
    })

    it("passes when all dependencies exist", () => {
      const agents = new Map([
        ["agent-a", {
          frontmatter: { description: "Agent A", mode: "all" as const },
          body: "",
          filePath: ".opencode/agents/agent-a.md",
        }],
      ])
      const commands = new Map([
        ["command-c", {
          frontmatter: { description: "Command C", agent: "agent-a" },
          body: "",
          filePath: ".opencode/commands/command-c.md",
        }],
      ])

      const result = validateResolutionOrder(makePrimitiveMap({ agents, commands }))
      expect(result.valid).toBe(true)
      expect(result.missing).toHaveLength(0)
    })
  })

  describe("validateInheritanceChain", () => {
    it("detects broken permission inheritance", () => {
      const agents = new Map([
        ["agent-a", {
          frontmatter: {
            description: "Agent A",
            mode: "all" as const,
            permission: { read: "allow" },
          },
          body: "",
          filePath: ".opencode/agents/agent-a.md",
        }],
      ])
      const config = {
        instructions: [],
        permission: { read: "ask" },
      }

      const result = validateInheritanceChain(makePrimitiveMap({ agents, config: config as any }))
      expect(result.valid).toBe(false)
      expect(result.broken.length).toBeGreaterThan(0)
    })

    it("allows agents to narrow globally allowed permissions", () => {
      const agents = new Map([
        ["critic", {
          frontmatter: {
            description: "Critic",
            mode: "subagent" as const,
            permission: { edit: "ask", task: "ask" },
          },
          body: "Review only",
          filePath: ".opencode/agents/critic.md",
        }],
      ])
      const config = {
        instructions: [],
        permission: { edit: "allow", task: "allow" },
      }

      const result = validateInheritanceChain(makePrimitiveMap({ agents, config: config as any }))
      expect(result.valid).toBe(true)
      expect(result.broken).toHaveLength(0)
    })

    it("passes when permissions are consistent", () => {
      const agents = new Map([
        ["agent-a", {
          frontmatter: {
            description: "Agent A",
            mode: "all" as const,
            permission: { read: "allow" },
          },
          body: "",
          filePath: ".opencode/agents/agent-a.md",
        }],
      ])
      const config = {
        instructions: [],
        permission: { read: "allow" },
      }

      const result = validateInheritanceChain(makePrimitiveMap({ agents, config: config as any }))
      expect(result.valid).toBe(true)
      expect(result.broken).toHaveLength(0)
    })
  })

  describe("validatePipelinePosition", () => {
    it("detects misaligned primary agent modes", () => {
      const agents = new Map([
        ["coordinator", {
          frontmatter: { description: "Coordinates all work across the system", mode: "primary" as const },
          body: "Coordinates work",
          filePath: ".opencode/agents/coordinator.md",
        }],
        ["orchestrator", {
          frontmatter: { description: "Coordinates tasks and delegates work across modules", mode: "primary" as const },
          body: "Also coordinates work",
          filePath: ".opencode/agents/orchestrator.md",
        }],
      ])

      const result = validatePipelinePosition(makePrimitiveMap({ agents }))
      expect(result.valid).toBe(false)
      expect(result.misaligned.length).toBeGreaterThan(0)
    })

    it("passes when pipeline positions are valid", () => {
      const agents = new Map([
        ["coordinator", {
          frontmatter: { description: "Coordinator", mode: "primary" as const },
          body: "Coordinates work",
          filePath: ".opencode/agents/coordinator.md",
        }],
        ["builder", {
          frontmatter: { description: "Builder", mode: "subagent" as const },
          body: "Builds things",
          filePath: ".opencode/agents/builder.md",
        }],
      ])

      const result = validatePipelinePosition(makePrimitiveMap({ agents }))
      expect(result.valid).toBe(true)
      expect(result.misaligned).toHaveLength(0)
    })
  })

  describe("validateRuntime", () => {
    it("returns comprehensive RuntimeValidationReport", () => {
      const result = validateRuntime(makePrimitiveMap())
      expect(result).toHaveProperty("valid")
      expect(result).toHaveProperty("loadingOrder")
      expect(result).toHaveProperty("resolutionOrder")
      expect(result).toHaveProperty("inheritanceChain")
      expect(result).toHaveProperty("pipelinePosition")
      expect(result).toHaveProperty("warnings")
    })

    it("passes when no issues found", () => {
      const agents = new Map([
        ["agent-a", {
          frontmatter: { description: "Agent A", mode: "all" as const },
          body: "",
          filePath: ".opencode/agents/agent-a.md",
        }],
      ])

      const result = validateRuntime(makePrimitiveMap({ agents }))
      expect(result.valid).toBe(true)
    })

    it("keeps restart validation passable when only advisory pipeline warnings exist", () => {
      const agents = new Map([
        ["conductor", {
          frontmatter: { description: "Coordinates all work across the system", mode: "primary" as const },
          body: "Coordinates work",
          filePath: ".opencode/agents/conductor.md",
        }],
        ["coordinator", {
          frontmatter: { description: "Coordinates tasks and delegates work across modules", mode: "primary" as const },
          body: "Coordinates work",
          filePath: ".opencode/agents/coordinator.md",
        }],
      ])

      const result = validateRuntime(makePrimitiveMap({ agents }))
      expect(result.pipelinePosition.valid).toBe(false)
      expect(result.valid).toBe(true)
    })
  })
})
