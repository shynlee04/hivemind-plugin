import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

const codeIntelModuleHref = new URL("../../src/lib/code-intel/index.ts", import.meta.url).href

type CodeMapEntry = { path: string }
type CodeMap = { files: CodeMapEntry[] }

type ScanFilesToCodeMap = (
  projectRoot: string,
  options?: {
    createFilter?: (root: string) => { isIgnored: (path: string) => boolean; getPatterns: () => string[] }
    isBinaryPathSafe?: (path: string) => boolean
    countTokens?: (content: string, path: string) => number
  },
) => Promise<CodeMap>

describe("Wave 4 Slice 3 RED - file-scanner pipeline contract", () => {
  it("exports scanFilesToCodeMap from src/lib/code-intel/index.ts", async () => {
    const codeIntel = await import(codeIntelModuleHref)
    assert.equal(typeof codeIntel.scanFilesToCodeMap, "function")
  })

  it("pipes gitignore/binary filters through token counter and codemap contract", async () => {
    const codeIntel = await import(codeIntelModuleHref)
    const scanFilesToCodeMap = codeIntel.scanFilesToCodeMap as ScanFilesToCodeMap | undefined

    assert.equal(typeof scanFilesToCodeMap, "function")
    if (!scanFilesToCodeMap) {
      throw new Error("Expected scanFilesToCodeMap export")
    }

    const projectRoot = await mkdtemp(join(tmpdir(), "hm-file-scanner-"))
    const tokenCounterCalls: string[] = []

    try {
      await mkdir(join(projectRoot, "src"), { recursive: true })
      await mkdir(join(projectRoot, "dist"), { recursive: true })
      await mkdir(join(projectRoot, "assets"), { recursive: true })

      await writeFile(join(projectRoot, "src", "alpha.ts"), "export const alpha = 1\n", "utf-8")
      await writeFile(join(projectRoot, "src", "beta.ts"), "export const beta = 2\n", "utf-8")
      await writeFile(join(projectRoot, "dist", "bundle.js"), "console.log('skip')\n", "utf-8")
      await writeFile(join(projectRoot, "assets", "logo.png"), "not-a-real-image", "utf-8")

      const createFilter = (_root: string) => ({
        isIgnored: (path: string) => path.startsWith("dist/"),
        getPatterns: () => ["dist/"],
      })

      const isBinaryPathSafe = (path: string) => !path.endsWith(".png")

      const countTokens = (_content: string, path: string) => {
        tokenCounterCalls.push(path)
        return 7
      }

      const codemap = await scanFilesToCodeMap(projectRoot, {
        createFilter,
        isBinaryPathSafe,
        countTokens,
      })

      assert.deepEqual(tokenCounterCalls.sort(), ["src/alpha.ts", "src/beta.ts"])
      assert.deepEqual(codemap, {
        files: [{ path: "src/alpha.ts" }, { path: "src/beta.ts" }],
      })
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })
})
