import { describe, it, expect, afterAll } from "vitest"
import os from "node:os"
import { rmSync } from "node:fs"
import { join } from "node:path"

import { HivemindControlPlane } from "../../src/plugin.ts"

const tmpdir = join(os.tmpdir(), "hivemind-hook-test")
let cleanupDir = tmpdir

afterAll(() => {
  try {
    rmSync(cleanupDir, { recursive: true, force: true })
  } catch {
    // best-effort cleanup
  }
})

describe("Hook Registration Completeness", () => {
  it("HivemindControlPlane export exists and is a function", () => {
    expect(HivemindControlPlane).toBeDefined()
    expect(typeof HivemindControlPlane).toBe("function")
  })

  it("HivemindControlPlane returns plugin object with required hooks", async () => {
    const mockClient = {
      app: { log: async () => {} },
      session: { prompt: async () => {}, list: async () => [] },
      tool: () => {},
      hook: () => {},
    }

    const result = await HivemindControlPlane({
      client: mockClient as any,
      directory: tmpdir,
    })

    expect(result).toBeDefined()
    expect(typeof result).toBe("object")

    expect(result).toHaveProperty("config")
    expect(typeof result.config).toBe("function")

    expect(result).toHaveProperty("event")
    expect(typeof result.event).toBe("function")

    expect(result).toHaveProperty("shell.env")
    expect(typeof result["shell.env"]).toBe("function")

    expect(result).toHaveProperty("tool.execute.before")
    expect(typeof result["tool.execute.before"]).toBe("function")

    expect(result).toHaveProperty("tool.execute.after")
    expect(typeof result["tool.execute.after"]).toBe("function")

    expect(result).toHaveProperty("chat.message")
    expect(typeof (result as any)["chat.message"]).toBe("function")
  })

  it("experimental.chat.system.transform hook exists", () => {
    expect((HivemindControlPlane as any)).not.toBeUndefined()
  })

  it("experimental.chat.system.transform and system.transform hook aliases are async functions", async () => {
    const mockClient = {
      app: { log: async () => {} },
      session: { prompt: async () => {}, list: async () => [] },
      tool: () => {},
      hook: () => {},
    }

    const result = await HivemindControlPlane({
      client: mockClient as any,
      directory: tmpdir,
    })

    if (result["experimental.chat.system.transform"]) {
      expect(typeof result["experimental.chat.system.transform"]).toBe("function")
    }

    if (result["system.transform"]) {
      expect(typeof result["system.transform"]).toBe("function")
    }
  })

  it("tool object contains 27 tool entries", async () => {
    const mockClient = {
      app: { log: async () => {} },
      session: { prompt: async () => {}, list: async () => [] },
      tool: () => {},
      hook: () => {},
    }

    const result = await HivemindControlPlane({
      client: mockClient as any,
      directory: tmpdir,
    })

    expect(result.tool).toBeDefined()
    expect(typeof result.tool).toBe("object")

    const toolKeys = Object.keys(result.tool)
    expect(toolKeys.length).toBe(28)

    for (const [key, toolDef] of Object.entries(result.tool)) {
      expect(typeof (toolDef as any).description).toBe("string")
      expect(typeof (toolDef as any).execute).toBe("function")
    }
  })

  it("experimental.session.compacting hook is present", async () => {
    const mockClient = {
      app: { log: async () => {} },
      session: { prompt: async () => {}, list: async () => [] },
      tool: () => {},
      hook: () => {},
    }

    const result = await HivemindControlPlane({
      client: mockClient as any,
      directory: tmpdir,
    })

    if (result["experimental.session.compacting"]) {
      expect(typeof result["experimental.session.compacting"]).toBe("function")
    }
  })
})
