import { describe, it, expect } from "vitest"

describe("AgentRegistry", () => {
  describe("parseAgentFrontmatter", () => {
    it("should extract permission rules from agent md frontmatter", async () => {
      const { parseAgentFrontmatter } = await import("../../src/lib/agent-registry.js")

      const md = `---
description: "Research agent"
mode: subagent
permission:
  edit: deny
  write: deny
  bash: deny
  webfetch: allow
---

You are a researcher.`

      const config = parseAgentFrontmatter(md)
      expect(config.permission).toEqual({
        edit: "deny",
        write: "deny",
        bash: "deny",
        webfetch: "allow",
      })
    })

    it("should extract temperature from frontmatter", async () => {
      const { parseAgentFrontmatter } = await import("../../src/lib/agent-registry.js")

      const md = `---
description: "Builder agent"
temperature: 0.15
mode: subagent
---

Build things.`

      const config = parseAgentFrontmatter(md)
      expect(config.temperature).toBe(0.15)
    })

    it("should return undefined permission when frontmatter has no permission", async () => {
      const { parseAgentFrontmatter } = await import("../../src/lib/agent-registry.js")

      const md = `---
description: "Simple agent"
---

Just a prompt.`

      const config = parseAgentFrontmatter(md)
      expect(config.permission).toBeUndefined()
    })

    it("should parse nested permission with glob patterns", async () => {
      const { parseAgentFrontmatter } = await import("../../src/lib/agent-registry.js")

      const md = `---
permission:
  bash:
    "*": ask
    "git status*": allow
    "rm *": deny
---

Prompt.`

      const config = parseAgentFrontmatter(md)
      expect(config.permission).toEqual({
        bash: {
          "*": "ask",
          "git status*": "allow",
          "rm *": "deny",
        },
      })
    })

    it("should return empty config when no frontmatter exists", async () => {
      const { parseAgentFrontmatter } = await import("../../src/lib/agent-registry.js")

      const md = `Just a prompt with no frontmatter at all.`

      const config = parseAgentFrontmatter(md)
      expect(config.description).toBeUndefined()
      expect(config.permission).toBeUndefined()
      expect(config.temperature).toBeUndefined()
      expect(config.mode).toBeUndefined()
    })

    it("should extract mode from frontmatter", async () => {
      const { parseAgentFrontmatter } = await import("../../src/lib/agent-registry.js")

      const md = `---
mode: subagent
---

Prompt.`

      const config = parseAgentFrontmatter(md)
      expect(config.mode).toBe("subagent")
    })

    it("should extract steps from frontmatter", async () => {
      const { parseAgentFrontmatter } = await import("../../src/lib/agent-registry.js")

      const md = `---
steps: 60
---

Prompt.`

      const config = parseAgentFrontmatter(md)
      expect(config.steps).toBe(60)
    })

    it("should extract all fields from a complete agent definition", async () => {
      const { parseAgentFrontmatter } = await import("../../src/lib/agent-registry.js")

      const md = `---
description: "Full agent"
mode: primary
temperature: 0.3
steps: 80
hidden: true
permission:
  edit: deny
  write: deny
  bash: ask
  task: deny
---

Full prompt.`

      const config = parseAgentFrontmatter(md)
      expect(config.description).toBe("Full agent")
      expect(config.mode).toBe("primary")
      expect(config.temperature).toBe(0.3)
      expect(config.steps).toBe(80)
      expect(config.hidden).toBe(true)
      expect(config.permission).toEqual({
        edit: "deny",
        write: "deny",
        bash: "ask",
        task: "deny",
      })
    })
  })

  describe("getPermissionForTool", () => {
    it("should return the permission value for a tool", async () => {
      const { getPermissionForTool } = await import("../../src/lib/agent-registry.js")

      const permission = { edit: "deny", bash: "allow" }
      expect(getPermissionForTool(permission, "edit")).toBe("deny")
      expect(getPermissionForTool(permission, "bash")).toBe("allow")
    })

    it("should return undefined for unknown tool", async () => {
      const { getPermissionForTool } = await import("../../src/lib/agent-registry.js")

      const permission = { edit: "deny" }
      expect(getPermissionForTool(permission, "unknown")).toBeUndefined()
    })

    it("should return undefined when permission is undefined", async () => {
      const { getPermissionForTool } = await import("../../src/lib/agent-registry.js")

      expect(getPermissionForTool(undefined, "edit")).toBeUndefined()
    })
  })

  describe("isToolDenied", () => {
    it("should return true when tool is denied", async () => {
      const { isToolDenied } = await import("../../src/lib/agent-registry.js")

      const permission = { edit: "deny", bash: "allow" }
      expect(isToolDenied(permission, "edit")).toBe(true)
      expect(isToolDenied(permission, "bash")).toBe(false)
    })

    it("should return true when nested wildcard is deny", async () => {
      const { isToolDenied } = await import("../../src/lib/agent-registry.js")

      const permission = { bash: { "*": "deny", "git status*": "allow" } }
      expect(isToolDenied(permission, "bash")).toBe(true)
    })

    it("should return false when permission is undefined", async () => {
      const { isToolDenied } = await import("../../src/lib/agent-registry.js")

      expect(isToolDenied(undefined, "edit")).toBe(false)
    })
  })
})
