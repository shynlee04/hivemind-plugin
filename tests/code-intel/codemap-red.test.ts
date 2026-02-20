import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

const codeIntelModuleHref = new URL("../../src/lib/code-intel/index.ts", import.meta.url).href

function getOrderedPaths(input: unknown): string[] {
  if (!input || typeof input !== "object") return []
  const candidate = input as { files?: unknown }
  if (!Array.isArray(candidate.files)) return []
  return candidate.files
    .map((entry) => {
      if (!entry || typeof entry !== "object") return ""
      const row = entry as { path?: unknown }
      return typeof row.path === "string" ? row.path : ""
    })
    .filter((path) => path.length > 0)
}

describe("Wave 4 Slice 1 RED - code-intel codemap contract", () => {
  it("exports scanProjectToCodeMap and loadCodeMap from src/lib/code-intel/index.ts", async () => {
    const codeIntel = await import(codeIntelModuleHref)
    assert.equal(typeof codeIntel.scanProjectToCodeMap, "function")
    assert.equal(typeof codeIntel.loadCodeMap, "function")
  })

  it("keeps codemap I/O file ordering deterministic across repeated writes", async () => {
    const codeIntel = await import(codeIntelModuleHref)
    const scanProjectToCodeMap = codeIntel.scanProjectToCodeMap as
      | ((projectRoot: string, codemapRoot: string) => Promise<unknown>)
      | undefined
    const loadCodeMap = codeIntel.loadCodeMap as ((codemapRoot: string) => Promise<unknown>) | undefined

    assert.equal(typeof scanProjectToCodeMap, "function")
    assert.equal(typeof loadCodeMap, "function")
    if (!scanProjectToCodeMap || !loadCodeMap) {
      throw new Error("Expected scanProjectToCodeMap and loadCodeMap exports")
    }

    const projectRoot = await mkdtemp(join(tmpdir(), "hm-codemap-project-"))
    const codemapRoot = await mkdtemp(join(tmpdir(), "hm-codemap-store-"))

    try {
      await mkdir(join(projectRoot, "src"), { recursive: true })
      await writeFile(join(projectRoot, "src", "zeta.ts"), "export const zeta = 1\n")
      await writeFile(join(projectRoot, "src", "alpha.ts"), "export const alpha = 1\n")
      await writeFile(join(projectRoot, "README.md"), "# codemap ordering test\n")

      await scanProjectToCodeMap(projectRoot, codemapRoot)
      const firstLoad = await loadCodeMap(codemapRoot)
      const firstOrder = getOrderedPaths(firstLoad)

      await scanProjectToCodeMap(projectRoot, codemapRoot)
      const secondLoad = await loadCodeMap(codemapRoot)
      const secondOrder = getOrderedPaths(secondLoad)

      assert.ok(firstOrder.length > 0, "expected codemap to include at least one file path")
      assert.deepEqual(secondOrder, firstOrder)
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
      await rm(codemapRoot, { recursive: true, force: true })
    }
  })
})
