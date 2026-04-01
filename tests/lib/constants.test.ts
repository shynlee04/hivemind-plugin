import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { MAX_DESCENDANTS_PER_ROOT } from "../../src/lib/types.js"

describe("core constants", () => {
  it("MAX_DESCENDANTS_PER_ROOT should be 10 per spec ARCH-008", () => {
    expect(MAX_DESCENDANTS_PER_ROOT).toBe(10)
  })

  it("doom_loop permission should be 'allow' per PERM-002", () => {
    const configPath = path.resolve(process.cwd(), "opencode.json")
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"))
    expect(config.permission?.doom_loop).toBe("allow")
  })
})
