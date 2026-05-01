import {
  renderError,
  renderJson,
  renderTable,
  renderHelp,
  type CliCommand,
} from "../../src/cli/renderer.js"

describe("cli/renderer — PH40-03 context renderer for terminal output", () => {
  describe("renderError", () => {
    it("prefixes [Harness] when the message does not already include it", () => {
      expect(renderError("Something exploded")).toContain("[Harness]")
      expect(renderError("Something exploded")).toContain("Something exploded")
    })

    it("does not double-prefix [Harness] when the message already includes it", () => {
      const out = renderError("[Harness] Already prefixed")
      // Should appear exactly once.
      const matches = out.match(/\[Harness\]/g) ?? []
      expect(matches).toHaveLength(1)
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

    it("rejects rows whose width does not match the header with [Harness] error", () => {
      expect(() =>
        renderTable(["id", "status"], [["del-001"]]),
      ).toThrow("[Harness]")
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
