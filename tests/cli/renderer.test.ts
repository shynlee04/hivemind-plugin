import {
  renderError,
  renderJson,
  renderTable,
  renderHelp,
  type CliCommand,
} from "../../src/cli/renderer.js"

describe("cli/renderer — PH40-03 context renderer for terminal output", () => {
  describe("renderError", () => {
    it("prefixes [Hivemind] when the message does not already include it", () => {
      expect(renderError("Something exploded")).toContain("[Hivemind]")
      expect(renderError("Something exploded")).toContain("Something exploded")
    })

    it("does not double-prefix [Hivemind] when the message already starts with it", () => {
      const out = renderError("[Hivemind] Already prefixed")
      // Should appear exactly once.
      const matches = out.match(/\[Hivemind\]/g) ?? []
      expect(matches).toHaveLength(1)
    })

    it("prepends [Hivemind] when the prefix appears mid-string but not at the start", () => {
      // Regression: previously used .includes(HARNESS_PREFIX), which let a
      // handler return `{ error: "Something about [Hivemind] internals" }`
      // and silently bypass the prefix-at-start contract documented in JSDoc.
      const out = renderError("Something about [Hivemind] internals")
      expect(out.startsWith("[Hivemind] ")).toBe(true)
      expect(out).toContain("Something about [Hivemind] internals")
    })
  })

  describe("renderJson", () => {
    it("returns deterministic, indented JSON", () => {
      const out = renderJson({ z: 1, a: 2 })
      expect(out).toContain('"a": 2')
      expect(out).toContain('"z": 1')
      expect(out.endsWith("}")).toBe(true)
    })

    it("preserves nested objects + arrays", () => {
      const out = renderJson({ items: [1, 2, 3], nested: { ok: true } })
      expect(JSON.parse(out)).toEqual({ items: [1, 2, 3], nested: { ok: true } })
    })
  })

  describe("renderTable", () => {
    it("renders a header row and aligns columns by max-width", () => {
      const out = renderTable(
        ["id", "status"],
        [
          ["del-001", "running"],
          ["del-2", "completed"],
        ],
      )
      const lines = out.split("\n")
      // Header + 2 data rows minimum
      expect(lines.length).toBeGreaterThanOrEqual(3)
      expect(lines[0]).toContain("id")
      expect(lines[0]).toContain("status")
      // Column alignment: each row should have the same length as the header
      const headerLength = lines[0]?.length ?? 0
      for (const line of lines) {
        expect(line.length).toBe(headerLength)
      }
    })

    it("returns an empty-data marker when rows is empty", () => {
      const out = renderTable(["id"], [])
      expect(out).toContain("(no rows)")
    })

    it("rejects rows whose width does not match the header with [Hivemind] error", () => {
      expect(() =>
        renderTable(["id", "status"], [["del-001"]]),
      ).toThrow("[Hivemind]")
    })
  })

  describe("renderHelp", () => {
    it("lists every registered command name + summary", () => {
      const commands: CliCommand[] = [
        {
          name: "delegate-status",
          summary: "Show delegation status",
          handler: async () => ({ exitCode: 0 }),
        },
        {
          name: "journal",
          summary: "Query the session journal",
          handler: async () => ({ exitCode: 0 }),
          aliases: ["j"],
        },
      ]

      const out = renderHelp(commands)

      expect(out).toContain("delegate-status")
      expect(out).toContain("Show delegation status")
      expect(out).toContain("journal")
      expect(out).toContain("Query the session journal")
    })

    it("includes alias hints inline for commands that have them", () => {
      const commands: CliCommand[] = [
        {
          name: "journal",
          summary: "Query the session journal",
          handler: async () => ({ exitCode: 0 }),
          aliases: ["j"],
        },
      ]

      const out = renderHelp(commands)

      expect(out).toMatch(/journal.*\(j\)|journal.*alias.*j/i)
    })

    it("returns a placeholder when no commands are registered", () => {
      const out = renderHelp([])
      expect(out).toContain("(no commands registered)")
    })
  })
})
