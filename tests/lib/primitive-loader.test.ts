import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { promises as fs, mkdirSync, writeFileSync, rmSync } from "node:fs"
import path from "node:path"
import { loadPrimitives, loadPrimitive } from "../../src/lib/primitive-loader.js"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TEMP_DIR = path.join(process.cwd(), ".tmp-test-primitive-loader")

function setupTempDir() {
  rmSync(TEMP_DIR, { recursive: true, force: true })
  mkdirSync(TEMP_DIR, { recursive: true })
}

function teardownTempDir() {
  rmSync(TEMP_DIR, { recursive: true, force: true })
}

function writeAgent(root: string, name: string, frontmatter: object, body = "# Agent prompt") {
  const dir = path.join(root, ".opencode", "agents")
  mkdirSync(dir, { recursive: true })
  const fm = Object.entries(frontmatter).map(([k, v]) => {
    if (typeof v === "string") return `${k}: "${v}"`
    return `${k}: ${v}`
  }).join("\n")
  writeFileSync(path.join(dir, `${name}.md`), `---\n${fm}\n---\n\n${body}\n`)
}

function writeCommand(root: string, name: string, frontmatter: object, body = "Run $ARGUMENTS") {
  const dir = path.join(root, ".opencode", "commands")
  mkdirSync(dir, { recursive: true })
  const fm = Object.entries(frontmatter).map(([k, v]) => {
    if (typeof v === "string") return `${k}: "${v}"`
    return `${k}: ${v}`
  }).join("\n")
  writeFileSync(path.join(dir, `${name}.md`), `---\n${fm}\n---\n\n${body}\n`)
}

function writeSkill(root: string, name: string, frontmatter: object, body = "# Skill content") {
  const dir = path.join(root, ".opencode", "skills", name)
  mkdirSync(dir, { recursive: true })
  const fm = Object.entries(frontmatter).map(([k, v]) => {
    if (typeof v === "string") return `${k}: "${v}"`
    return `${k}: ${v}`
  }).join("\n")
  writeFileSync(path.join(dir, "SKILL.md"), `---\n${fm}\n---\n\n${body}\n`)
}

function writeOpencodeJson(root: string, config: object) {
  writeFileSync(path.join(root, "opencode.json"), JSON.stringify(config, null, 2))
}

// ---------------------------------------------------------------------------
// loadPrimitives — scanning
// ---------------------------------------------------------------------------

describe("loadPrimitives", () => {
  beforeEach(() => setupTempDir())
  afterEach(() => teardownTempDir())

  it("scans .opencode/agents/ and returns Map of agent names to AgentFile", async () => {
    writeAgent(TEMP_DIR, "test-agent", { description: "A test agent" })
    const result = await loadPrimitives({ projectRoot: TEMP_DIR })
    expect(result.agents.size).toBe(1)
    expect(result.agents.has("test-agent")).toBe(true)
    const agent = result.agents.get("test-agent")!
    expect(agent.frontmatter.description).toBe("A test agent")
    expect(agent.body).toContain("Agent prompt")
    expect(agent.filePath).toContain("test-agent.md")
  })

  it("scans .opencode/commands/ and returns Map of command names to CommandFile", async () => {
    writeCommand(TEMP_DIR, "test-cmd", { description: "A test command" })
    const result = await loadPrimitives({ projectRoot: TEMP_DIR })
    expect(result.commands.size).toBe(1)
    expect(result.commands.has("test-cmd")).toBe(true)
    const cmd = result.commands.get("test-cmd")!
    expect(cmd.frontmatter.description).toBe("A test command")
    expect(cmd.body).toContain("Run $ARGUMENTS")
  })

  it("scans .opencode/skills/ and returns Map of skill names to SkillFile", async () => {
    writeSkill(TEMP_DIR, "test-skill", { name: "test-skill", description: "A test skill" })
    const result = await loadPrimitives({ projectRoot: TEMP_DIR })
    expect(result.skills.size).toBe(1)
    expect(result.skills.has("test-skill")).toBe(true)
    const skill = result.skills.get("test-skill")!
    expect(skill.frontmatter.name).toBe("test-skill")
    expect(skill.frontmatter.description).toBe("A test skill")
    expect(skill.directoryName).toBe("test-skill")
  })

  it("reads opencode.json and extracts config", async () => {
    writeOpencodeJson(TEMP_DIR, {
      $schema: "https://opencode.ai/config.json",
      default_agent: "test-agent",
      instructions: [".opencode/rules.md"],
    })
    const result = await loadPrimitives({ projectRoot: TEMP_DIR })
    expect(result.config).not.toBeNull()
    expect(result.config!.default_agent).toBe("test-agent")
  })

  it("handles missing directories gracefully (returns empty Maps)", async () => {
    const emptyDir = path.join(TEMP_DIR, "empty-project")
    mkdirSync(emptyDir, { recursive: true })
    const result = await loadPrimitives({ projectRoot: emptyDir })
    expect(result.agents.size).toBe(0)
    expect(result.commands.size).toBe(0)
    expect(result.skills.size).toBe(0)
    expect(result.mcpServers.size).toBe(0)
    expect(result.warnings.length).toBe(0)
  })

  it("does not warn about discovered files when opencode.json omits primitive registries", async () => {
    writeAgent(TEMP_DIR, "orphan-agent", { description: "Orphan agent" })
    writeOpencodeJson(TEMP_DIR, { $schema: "https://opencode.ai/config.json" })
    const result = await loadPrimitives({ projectRoot: TEMP_DIR })
    const orphanWarning = result.warnings.find(w => w.includes("orphan") || w.includes("not referenced"))
    expect(orphanWarning).toBeUndefined()
  })

  it("warns about orphaned files when an explicit primitive registry exists", async () => {
    writeAgent(TEMP_DIR, "orphan-agent", { description: "Orphan agent" })
    writeOpencodeJson(TEMP_DIR, { $schema: "https://opencode.ai/config.json", agent: {} })
    const result = await loadPrimitives({ projectRoot: TEMP_DIR })
    const orphanWarning = result.warnings.find(w => w.includes("orphan") || w.includes("not referenced"))
    expect(orphanWarning).toBeDefined()
  })

  it("warns about invalid frontmatter (schema validation failures)", async () => {
    // Write an agent with missing required description
    const dir = path.join(TEMP_DIR, ".opencode", "agents")
    mkdirSync(dir, { recursive: true })
    writeFileSync(path.join(dir, "bad-agent.md"), `---\nmode: primary\n---\n\n# Bad agent\n`)
    const result = await loadPrimitives({ projectRoot: TEMP_DIR })
    const invalidWarning = result.warnings.find(w => w.includes("invalid") || w.includes("validation") || w.includes("frontmatter"))
    expect(invalidWarning).toBeDefined()
  })

  it("loads multiple primitive types in one call", async () => {
    writeAgent(TEMP_DIR, "multi-agent", { description: "Multi agent" })
    writeCommand(TEMP_DIR, "multi-cmd", { description: "Multi command" })
    writeSkill(TEMP_DIR, "multi-skill", { name: "multi-skill", description: "Multi skill" })
    const result = await loadPrimitives({ projectRoot: TEMP_DIR })
    expect(result.agents.size).toBe(1)
    expect(result.commands.size).toBe(1)
    expect(result.skills.size).toBe(1)
  })

  it("accepts OpenCode skill metadata values beyond strings", async () => {
    const dir = path.join(TEMP_DIR, ".opencode", "skills", "rich-skill")
    mkdirSync(dir, { recursive: true })
    writeFileSync(path.join(dir, "SKILL.md"), `---
name: rich-skill
description: Skill with rich metadata
metadata:
  routes: [gate-a, gate-b]
  enabled: true
  weight: 2
---

# Rich skill
`)

    const result = await loadPrimitives({ projectRoot: TEMP_DIR })
    expect(result.skills.has("rich-skill")).toBe(true)
  })

  it("ignores OpenCode extension frontmatter keys when core fields are valid", async () => {
    const dir = path.join(TEMP_DIR, ".opencode", "skills", "tool-skill")
    mkdirSync(dir, { recursive: true })
    writeFileSync(path.join(dir, "SKILL.md"), `---
name: tool-skill
description: Skill with OpenCode tool metadata
metadata:
  min-tasks: 2
allowed-tools:
  - Read
  - Bash
---

# Tool skill
`)

    const result = await loadPrimitives({ projectRoot: TEMP_DIR })
    expect(result.skills.has("tool-skill")).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// loadPrimitive — single file
// ---------------------------------------------------------------------------

describe("loadPrimitive", () => {
  beforeEach(() => setupTempDir())
  afterEach(() => teardownTempDir())

  it("reads a single agent file and returns parsed AgentFile", async () => {
    writeAgent(TEMP_DIR, "single-agent", { description: "Single agent" })
    const filePath = path.join(TEMP_DIR, ".opencode", "agents", "single-agent.md")
    const result = await loadPrimitive(filePath, "agent")
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.frontmatter.description).toBe("Single agent")
      expect(result.data.filePath).toBe(filePath)
    }
  })

  it("reads a single command file and returns parsed CommandFile", async () => {
    writeCommand(TEMP_DIR, "single-cmd", { description: "Single command" })
    const filePath = path.join(TEMP_DIR, ".opencode", "commands", "single-cmd.md")
    const result = await loadPrimitive(filePath, "command")
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.frontmatter.description).toBe("Single command")
    }
  })

  it("reads a single skill file and returns parsed SkillFile", async () => {
    writeSkill(TEMP_DIR, "single-skill", { name: "single-skill", description: "Single skill" })
    const filePath = path.join(TEMP_DIR, ".opencode", "skills", "single-skill", "SKILL.md")
    const result = await loadPrimitive(filePath, "skill")
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.frontmatter.name).toBe("single-skill")
      expect(result.data.directoryName).toBe("single-skill")
    }
  })

  it("returns error for invalid frontmatter", async () => {
    const dir = path.join(TEMP_DIR, ".opencode", "agents")
    mkdirSync(dir, { recursive: true })
    const filePath = path.join(dir, "bad.md")
    writeFileSync(filePath, `---\nmode: primary\n---\n\n# Bad\n`)
    const result = await loadPrimitive(filePath, "agent")
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain("description")
    }
  })

  it("returns error for non-existent file", async () => {
    const filePath = path.join(TEMP_DIR, ".opencode", "agents", "nonexistent.md")
    const result = await loadPrimitive(filePath, "agent")
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Integration — real project .opencode/
// ---------------------------------------------------------------------------

describe("loadPrimitives integration", () => {
  it("loads from real project .opencode/ directory", async () => {
    const result = await loadPrimitives({ projectRoot: process.cwd() })
    // Real project has agents, commands, and skills
    expect(result.agents.size).toBeGreaterThan(0)
    expect(result.commands.size).toBeGreaterThan(0)
    expect(result.skills.size).toBeGreaterThan(0)
    // Config should be loaded
    expect(result.config).not.toBeNull()
  })
})
