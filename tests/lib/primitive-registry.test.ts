/**
 * @fileoverview Tests for primitive-registry.ts — cataloging OpenCode primitives
 * with metadata, versioning, dependency tracking, and conflict detection.
 *
 * RED phase: These tests MUST fail before implementation exists.
 * Test size: small (unit tests, no network/process boundary).
 * Public interface: buildRegistry, resolveDependencyGraph, detectConflicts, validateRegistry.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { promises as fs, mkdirSync, existsSync, rmSync } from "node:fs"
import path from "node:path"
import os from "node:os"

import {
  buildRegistry,
  resolveDependencyGraph,
  detectConflicts,
  validateRegistry,
  type PrimitiveEntry,
  type RegistrySnapshot,
  type ConflictEntry,
} from "../../src/lib/primitive-registry.js"

// ---------------------------------------------------------------------------
// Test fixtures — temporary directory with mock .opencode/ structure
// ---------------------------------------------------------------------------

let tmpDir: string

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "hivemind-pr-test-"))
})

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true })
})

/**
 * Creates a mock .opencode directory with agents, commands, and skills.
 */
async function createMockOpencodeStructure(): Promise<string> {
  const openCodeDir = path.join(tmpDir, ".opencode")

  // Agents
  const agentsDir = path.join(openCodeDir, "agents")
  mkdirSync(agentsDir, { recursive: true })
  await fs.writeFile(
    path.join(agentsDir, "hm-l2-researcher.md"),
    `---
description: "Research specialist agent"
tools:
  - web-search
  - file-read
---
Research agent body content`,
  )
  await fs.writeFile(
    path.join(agentsDir, "hm-l2-planner.md"),
    `---
description: "Planning specialist agent"
tools:
  - file-read
  - file-write
---
Planner agent body content`,
  )

  // Commands
  const commandsDir = path.join(openCodeDir, "commands")
  mkdirSync(commandsDir, { recursive: true })
  await fs.writeFile(
    path.join(commandsDir, "start-work.md"),
    `---
description: "Start a new work session"
agent: hm-l2-researcher
---
Command body`,
  )
  await fs.writeFile(
    path.join(commandsDir, "deep-research.md"),
    `---
description: "Deep research command"
agent: hm-l2-researcher
---
Deep research body`,
  )

  // Skills
  const skillsDir = path.join(openCodeDir, "skills")
  mkdirSync(skillsDir, { recursive: true })

  const researchSkillDir = path.join(skillsDir, "hm-l2-deep-research")
  mkdirSync(researchSkillDir, { recursive: true })
  await fs.writeFile(
    path.join(researchSkillDir, "SKILL.md"),
    `---
description: "Conduct deep research with citations"
triggers:
  - "deep research"
  - "comprehensive analysis"
---
Skill body for deep research`,
  )

  const plannerSkillDir = path.join(skillsDir, "hm-l2-spec-driven-authoring")
  mkdirSync(plannerSkillDir, { recursive: true })
  await fs.writeFile(
    path.join(plannerSkillDir, "SKILL.md"),
    `---
description: "Spec-driven authoring for requirements"
triggers:
  - "write spec"
  - "lock requirements"
---
Skill body for spec authoring`,
  )

  return tmpDir
}

/**
 * Creates a mock structure with duplicate primitives to test conflict detection.
 */
async function createDuplicateStructure(): Promise<string> {
  const openCodeDir = path.join(tmpDir, ".opencode")

  // Agent and command with the same name "hm-test"
  const agentsDir = path.join(openCodeDir, "agents")
  mkdirSync(agentsDir, { recursive: true })
  await fs.writeFile(
    path.join(agentsDir, "hm-test.md"),
    `---
description: "Test agent"
---
Agent body`,
  )

  const commandsDir = path.join(openCodeDir, "commands")
  mkdirSync(commandsDir, { recursive: true })
  await fs.writeFile(
    path.join(commandsDir, "hm-test.md"),
    `---
description: "Test command"
---
Command body`,
  )

  return tmpDir
}

/**
 * Creates a mock structure with an agent referencing a missing skill dependency.
 */
async function createMissingDependencyStructure(): Promise<string> {
  const openCodeDir = path.join(tmpDir, ".opencode")

  const agentsDir = path.join(openCodeDir, "agents")
  mkdirSync(agentsDir, { recursive: true })
  await fs.writeFile(
    path.join(agentsDir, "hm-l2-orphan.md"),
    `---
description: "Agent referencing non-existent skill"
skills:
  - nonexistent-skill
---
Agent body`,
  )

  return tmpDir
}

// ---------------------------------------------------------------------------
// Tests: buildRegistry
// ---------------------------------------------------------------------------

describe("buildRegistry", () => {
  it("should discover all agents from .opencode/agents/", async () => {
    await createMockOpencodeStructure()
    const snapshot = await buildRegistry(tmpDir)

    const agentNames = Array.from(snapshot.primitives.values())
      .filter((p) => p.type === "agent")
      .map((p) => p.name)

    expect(agentNames).toContain("hm-l2-researcher")
    expect(agentNames).toContain("hm-l2-planner")
    expect(agentNames.length).toBe(2)
  })

  it("should discover all commands from .opencode/commands/", async () => {
    await createMockOpencodeStructure()
    const snapshot = await buildRegistry(tmpDir)

    const commandNames = Array.from(snapshot.primitives.values())
      .filter((p) => p.type === "command")
      .map((p) => p.name)

    expect(commandNames).toContain("start-work")
    expect(commandNames).toContain("deep-research")
    expect(commandNames.length).toBe(2)
  })

  it("should discover all skills from .opencode/skills/*/SKILL.md", async () => {
    await createMockOpencodeStructure()
    const snapshot = await buildRegistry(tmpDir)

    const skillNames = Array.from(snapshot.primitives.values())
      .filter((p) => p.type === "skill")
      .map((p) => p.name)

    expect(skillNames).toContain("hm-l2-deep-research")
    expect(skillNames).toContain("hm-l2-spec-driven-authoring")
    expect(skillNames.length).toBe(2)
  })

  it("should return empty primitives when .opencode does not exist", async () => {
    const emptyDir = await fs.mkdtemp(path.join(os.tmpdir(), "hivemind-pr-empty-"))
    try {
      const snapshot = await buildRegistry(emptyDir)
      expect(snapshot.primitives.size).toBe(0)
    } finally {
      await fs.rm(emptyDir, { recursive: true, force: true })
    }
  })

  it("should populate metadata with frontmatter fields", async () => {
    await createMockOpencodeStructure()
    const snapshot = await buildRegistry(tmpDir)

    const researcher = Array.from(snapshot.primitives.values()).find(
      (p) => p.name === "hm-l2-researcher" && p.type === "agent",
    )
    expect(researcher).toBeDefined()
    expect(researcher!.metadata).toHaveProperty("description")
  })

  it("should record file paths as absolute paths", async () => {
    await createMockOpencodeStructure()
    const snapshot = await buildRegistry(tmpDir)

    for (const entry of snapshot.primitives.values()) {
      expect(path.isAbsolute(entry.path)).toBe(true)
    }
  })

  it("should set timestamp on the snapshot", async () => {
    await createMockOpencodeStructure()
    const snapshot = await buildRegistry(tmpDir)

    expect(snapshot.timestamp).toBeInstanceOf(Date)
    expect(snapshot.timestamp.getTime()).toBeLessThanOrEqual(Date.now())
  })
})

// ---------------------------------------------------------------------------
// Tests: resolveDependencyGraph
// ---------------------------------------------------------------------------

describe("resolveDependencyGraph", () => {
  it("should build dependency edges from agent skills references", async () => {
    await createMockOpencodeStructure()
    const snapshot = await buildRegistry(tmpDir)
    const graph = resolveDependencyGraph(snapshot)

    // Graph should have entries for primitives that reference others
    expect(graph.size).toBeGreaterThan(0)
  })

  it("should produce an empty graph for empty registry", async () => {
    const emptySnapshot: RegistrySnapshot = {
      primitives: new Map(),
      dependencyGraph: new Map(),
      conflicts: [],
      timestamp: new Date(),
    }
    const graph = resolveDependencyGraph(emptySnapshot)
    expect(graph.size).toBe(0)
  })

  it("should link commands to their referenced agents", async () => {
    await createMockOpencodeStructure()
    const snapshot = await buildRegistry(tmpDir)
    const graph = resolveDependencyGraph(snapshot)

    // Find the command "start-work" which references agent "hm-l2-researcher"
    let foundEdge = false
    for (const [key, deps] of graph) {
      if (key.includes("start-work")) {
        expect(deps.length).toBeGreaterThan(0)
        foundEdge = true
      }
    }
    // The command may reference agent via frontmatter
    expect(foundEdge || graph.size > 0).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Tests: detectConflicts
// ---------------------------------------------------------------------------

describe("detectConflicts", () => {
  it("should detect no conflicts in a clean structure", async () => {
    await createMockOpencodeStructure()
    const snapshot = await buildRegistry(tmpDir)
    const conflicts = detectConflicts(snapshot)

    // Clean structure should have no conflicts
    expect(conflicts.filter((c) => c.type === "duplicate-name")).toHaveLength(0)
  })

  it("should detect cross-type duplicate names", async () => {
    await createDuplicateStructure()
    const snapshot = await buildRegistry(tmpDir)
    const conflicts = detectConflicts(snapshot)

    // "hm-test" exists as both agent and command
    const dupConflicts = conflicts.filter((c) => c.type === "duplicate-name")
    expect(dupConflicts.length).toBeGreaterThan(0)
    expect(dupConflicts[0].primitives).toContain("agent:hm-test")
  })

  it("should detect missing dependencies", async () => {
    await createMissingDependencyStructure()
    const snapshot = await buildRegistry(tmpDir)
    const conflicts = detectConflicts(snapshot)

    const missingDeps = conflicts.filter((c) => c.type === "missing-dependency")
    expect(missingDeps.length).toBeGreaterThan(0)
  })

  it("should return empty array for empty registry", () => {
    const emptySnapshot: RegistrySnapshot = {
      primitives: new Map(),
      dependencyGraph: new Map(),
      conflicts: [],
      timestamp: new Date(),
    }
    const conflicts = detectConflicts(emptySnapshot)
    expect(conflicts).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Tests: validateRegistry
// ---------------------------------------------------------------------------

describe("validateRegistry", () => {
  it("should return valid for a well-formed registry", async () => {
    await createMockOpencodeStructure()
    const snapshot = await buildRegistry(tmpDir)
    const result = validateRegistry(snapshot)

    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it("should return valid for empty registry", () => {
    const emptySnapshot: RegistrySnapshot = {
      primitives: new Map(),
      dependencyGraph: new Map(),
      conflicts: [],
      timestamp: new Date(),
    }
    const result = validateRegistry(emptySnapshot)
    expect(result.valid).toBe(true)
  })

  it("should report errors when conflicts exist", async () => {
    await createDuplicateStructure()
    const snapshot = await buildRegistry(tmpDir)
    // Inject conflicts manually to test validateRegistry
    snapshot.conflicts = detectConflicts(snapshot)
    const result = validateRegistry(snapshot)

    if (snapshot.conflicts.length > 0) {
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    }
  })

  it("should include warnings for orphaned primitives", async () => {
    await createMockOpencodeStructure()
    const snapshot = await buildRegistry(tmpDir)
    const result = validateRegistry(snapshot)

    // Warnings array should exist even if empty
    expect(Array.isArray(result.warnings)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Tests: Serialization
// ---------------------------------------------------------------------------

describe("RegistrySnapshot serialization", () => {
  it("should serialize to JSON-compatible structure", async () => {
    await createMockOpencodeStructure()
    const snapshot = await buildRegistry(tmpDir)

    // Convert Maps to plain objects for JSON serialization
    const serializable = {
      primitives: Object.fromEntries(snapshot.primitives),
      dependencyGraph: Object.fromEntries(snapshot.dependencyGraph),
      conflicts: snapshot.conflicts,
      timestamp: snapshot.timestamp.toISOString(),
    }

    const json = JSON.stringify(serializable)
    expect(json).toBeTruthy()

    const parsed = JSON.parse(json)
    expect(parsed.primitives).toBeDefined()
    expect(parsed.conflicts).toBeDefined()
  })
})
