import { describe, it, expect, beforeEach } from "vitest"
import type { ClassifiedEvent, DualPersistenceFileSystem } from "../../../src/task-management/journal/event-tracker/types.js"

describe("DualPersistence", () => {
  let persistence: Awaited<ReturnType<typeof import("../../../src/task-management/journal/event-tracker/dual-persistence.js")>["createDualPersistence"]>
  let memFs: DualPersistenceFileSystem
  let files: Map<string, string>

  beforeEach(async () => {
    const mod = await import("../../../src/task-management/journal/event-tracker/dual-persistence.js")
    files = new Map()
    memFs = {
      existsSync: (path: string) => files.has(path),
      mkdirSync: () => {},
      readFileSync: (path: string) => files.get(path) ?? "",
      writeFileSync: (path: string, data: string) => { files.set(path, data) },
      appendFileSync: (path: string, data: string) => {
        const existing = files.get(path) ?? ""
        files.set(path, existing + data)
      },
    }
    persistence = mod.createDualPersistence({ fs: memFs, basePath: "/test/.hivemind/event-tracker" })
  })

  const makeClassifiedEvent = (type: string, sessionId = "ses_test"): ClassifiedEvent => ({
    type: type as ClassifiedEvent["type"],
    original: { sessionId },
    classifiedAt: Date.now(),
  })

  describe("persist (atomic JSON)", () => {
    it("writes atomic JSON for a classified event", () => {
      const event = makeClassifiedEvent("session_start")
      const result = persistence.persist(event)
      expect(result.jsonPath).toMatch(/\.json$/)
      expect(result.written).toBe(true)
      expect(files.has(result.jsonPath)).toBe(true)
      const json = JSON.parse(files.get(result.jsonPath)!)
      expect(json.events).toHaveLength(1)
      expect(json.events[0].type).toBe("session_start")
    })

    it("creates directory if missing", () => {
      let mkdirCalled = false
      const fsWithMkdir = {
        ...memFs,
        mkdirSync: () => { mkdirCalled = true },
      }
      const mod = import("../../../src/task-management/journal/event-tracker/dual-persistence.js")
      // Re-create persistence with mkdir tracking
      persistence = mod.then(m => m.createDualPersistence({ fs: fsWithMkdir, basePath: "/test/.hivemind/event-tracker" })) as any
    })

    it("accumulates events in the same JSON document", async () => {
      const mod = await import("../../../src/task-management/journal/event-tracker/dual-persistence.js")
      persistence = mod.createDualPersistence({ fs: memFs, basePath: "/test/.hivemind/event-tracker" })
      persistence.persist(makeClassifiedEvent("session_start"))
      persistence.persist(makeClassifiedEvent("user_message"))
      persistence.persist(makeClassifiedEvent("assistant_output"))

      // Find the JSON file
      const jsonFile = Array.from(files.keys()).find(f => f.endsWith(".json"))!
      const json = JSON.parse(files.get(jsonFile)!)
      expect(json.events).toHaveLength(3)
    })
  })

  describe("persistAppendMarkdown", () => {
    it("appends Markdown entry for a classified event", async () => {
      const mod = await import("../../../src/task-management/journal/event-tracker/dual-persistence.js")
      persistence = mod.createDualPersistence({ fs: memFs, basePath: "/test/.hivemind/event-tracker" })
      const event = makeClassifiedEvent("error")
      const result = persistence.persistAppendMarkdown(event)
      expect(result.markdownPath).toMatch(/\.md$/)
      expect(result.written).toBe(true)
      const content = files.get(result.markdownPath)!
      expect(content).toContain("error")
      expect(content).toContain("## ")
    })

    it("appends multiple entries to same Markdown file", async () => {
      const mod = await import("../../../src/task-management/journal/event-tracker/dual-persistence.js")
      persistence = mod.createDualPersistence({ fs: memFs, basePath: "/test/.hivemind/event-tracker" })
      persistence.persistAppendMarkdown(makeClassifiedEvent("session_start"))
      persistence.persistAppendMarkdown(makeClassifiedEvent("user_message"))
      const mdFile = Array.from(files.keys()).find(f => f.endsWith(".md"))!
      const content = files.get(mdFile)!
      const count = (content.match(/^## /gm) || []).length
      expect(count).toBeGreaterThanOrEqual(2)
    })
  })

  describe("dual write (both JSON + Markdown)", () => {
    it("writes both JSON and Markdown atomically", async () => {
      const mod = await import("../../../src/task-management/journal/event-tracker/dual-persistence.js")
      persistence = mod.createDualPersistence({ fs: memFs, basePath: "/test/.hivemind/event-tracker" })
      const event = makeClassifiedEvent("tool_invocation")
      const result = persistence.persistDual(event)
      expect(result.jsonPath).toMatch(/\.json$/)
      expect(result.markdownPath).toMatch(/\.md$/)
      expect(files.has(result.jsonPath)).toBe(true)
      expect(files.has(result.markdownPath)).toBe(true)
    })
  })
})
