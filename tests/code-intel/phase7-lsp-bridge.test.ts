import assert from "node:assert/strict"
import { describe, it } from "node:test"

const codeIntelModuleHref = new URL("../../src/lib/code-intel/index.ts", import.meta.url).href

type LSPBridgeType = {
  isAvailable: () => boolean
  getBlastRadius: (filePath: string, line: number, col: number) => Promise<Array<{
    filePath: string
    line: number
    column: number
    text: string
  }>>
  getDefinition: (filePath: string, line: number, col: number) => Promise<{
    filePath: string
    line: number
    column: number
  } | null>
}

describe("Phase 7 — LSPBridge", () => {
  it("gracefully degrades when client is null", async () => {
    const mod = await import(codeIntelModuleHref)
    const LSPBridge = mod.LSPBridge as new (client: unknown | null) => LSPBridgeType

    const bridge = new LSPBridge(null)
    assert.equal(bridge.isAvailable(), false)
    assert.deepEqual(await bridge.getBlastRadius("src/a.ts", 1, 1), [])
    assert.equal(await bridge.getDefinition("src/a.ts", 1, 1), null)
  })

  it("returns empty/null when client methods throw", async () => {
    const mod = await import(codeIntelModuleHref)
    const LSPBridge = mod.LSPBridge as new (client: unknown | null) => LSPBridgeType

    const bridge = new LSPBridge({
      async findReferences() {
        throw new Error("boom")
      },
      async getDefinition() {
        throw new Error("boom")
      },
    })

    assert.deepEqual(await bridge.getBlastRadius("src/a.ts", 1, 1), [])
    assert.equal(await bridge.getDefinition("src/a.ts", 1, 1), null)
  })

  it("maps reference/definition responses into stable shapes", async () => {
    const mod = await import(codeIntelModuleHref)
    const LSPBridge = mod.LSPBridge as new (client: unknown | null) => LSPBridgeType

    const bridge = new LSPBridge({
      async findReferences() {
        return [
          { filePath: "src/a.ts", line: 4, column: 2, text: "alpha()" },
          { uri: "src/b.ts", line: 9, column: 1, text: "alpha()" },
        ]
      },
      async getDefinition() {
        return { path: "src/def.ts", line: 2, column: 5 }
      },
    })

    const refs = await bridge.getBlastRadius("src/a.ts", 1, 1)
    assert.equal(refs.length, 2)
    assert.equal(refs[0].filePath, "src/a.ts")
    assert.equal(refs[1].filePath, "src/b.ts")

    const def = await bridge.getDefinition("src/a.ts", 1, 1)
    assert.ok(def)
    assert.equal(def.filePath, "src/def.ts")
    assert.equal(def.line, 2)
    assert.equal(def.column, 5)
  })
})
