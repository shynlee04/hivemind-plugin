import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

const gitignoreFilterModuleHref = new URL("../../src/lib/code-intel/gitignore-filter.ts", import.meta.url).href

describe("Wave 4 Slice 2 RED - gitignore filter primitive", () => {
  it("exports createGitignoreFilter", async () => {
    const module = await import(gitignoreFilterModuleHref)
    assert.equal(typeof module.createGitignoreFilter, "function")
  })

  it("applies .gitignore rules plus default ignore patterns", async () => {
    const module = await import(gitignoreFilterModuleHref)
    const createGitignoreFilter = module.createGitignoreFilter as
      | ((projectRoot: string) => { isIgnored: (path: string) => boolean; getPatterns: () => string[] })
      | undefined

    assert.equal(typeof createGitignoreFilter, "function")
    if (!createGitignoreFilter) {
      throw new Error("Expected createGitignoreFilter export")
    }

    const projectRoot = await mkdtemp(join(tmpdir(), "hm-gitignore-filter-"))
    try {
      await writeFile(join(projectRoot, ".gitignore"), "dist/\n.env\n", "utf-8")

      const filter = createGitignoreFilter(projectRoot)

      assert.equal(filter.isIgnored("dist/app.js"), true)
      assert.equal(filter.isIgnored(".env"), true)
      assert.equal(filter.isIgnored("node_modules/pkg/index.js"), true)
      assert.equal(filter.isIgnored("src/index.ts"), false)
      assert.ok(filter.getPatterns().length > 0)
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })
})
