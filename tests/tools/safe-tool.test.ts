import { describe, it, expect, vi } from "vitest"
import { z } from "zod"
import { safeTool } from "../../.opencode/tools/safe-tool.ts"

describe("safe-tool", () => {
  it("preserves raw arg shapes without logging", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})

    const definition = safeTool({
      description: "raw-shape",
      args: {
        value: z.string(),
      },
      async execute() {
        return "ok"
      },
    })

    expect(definition.args.value._zod.def.type).toBe("string")
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })

  it("unwraps z.object args and logs a warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})

    const definition = safeTool({
      description: "wrapped-shape",
      args: z.object({
        value: z.string(),
      }) as unknown as Record<string, unknown>,
      async execute() {
        return "ok"
      },
    })

    expect(definition.args.value._zod.def.type).toBe("string")
    expect(warn).toHaveBeenCalledOnce()
    expect(warn.mock.calls[0]?.[0]).toContain("auto-unwrapping")
    warn.mockRestore()
  })
})
