import assert from "node:assert/strict"
import { describe, it } from "node:test"

const codeIntelModuleHref = new URL("../../src/lib/code-intel/index.ts", import.meta.url).href

type DocWeaverType = {
  readOutline: (content: string) => Array<{
    level: number
    text: string
    children: Array<{ level: number; text: string }>
  }>
  patchSection: (content: string, heading: string, newContent: string) => string
  chunkByHeadings: (content: string, maxChunkTokens: number) => Array<{
    heading: string
    level: number
    content: string
    tokenEstimate: number
  }>
}

describe("Phase 7 — DocWeaver", () => {
  it("readOutline builds heading hierarchy", async () => {
    const mod = await import(codeIntelModuleHref)
    const DocWeaver = mod.DocWeaver as new () => DocWeaverType

    const weaver = new DocWeaver()
    const outline = weaver.readOutline([
      "# Root",
      "Intro",
      "## Child",
      "Details",
      "### Leaf",
      "Deep details",
      "## Sibling",
      "More",
    ].join("\n"))

    assert.equal(outline.length, 1)
    assert.equal(outline[0].text, "Root")
    assert.equal(outline[0].children.length, 2)
    assert.equal(outline[0].children[0].text, "Child")
  })

  it("patchSection replaces content for a middle section", async () => {
    const mod = await import(codeIntelModuleHref)
    const DocWeaver = mod.DocWeaver as new () => DocWeaverType

    const weaver = new DocWeaver()
    const content = [
      "# Title",
      "Old title content",
      "",
      "## API",
      "Old api content",
      "",
      "## Notes",
      "Notes text",
    ].join("\n")

    const patched = weaver.patchSection(content, "API", "New API body")
    assert.ok(patched.includes("## API\nNew API body"))
    assert.ok(!patched.includes("Old api content"))
    assert.ok(patched.includes("## Notes"))
  })

  it("patchSection handles final section at end of document", async () => {
    const mod = await import(codeIntelModuleHref)
    const DocWeaver = mod.DocWeaver as new () => DocWeaverType

    const weaver = new DocWeaver()
    const content = [
      "# Main",
      "Intro",
      "",
      "## Last",
      "Tail",
    ].join("\n")

    const patched = weaver.patchSection(content, "Last", "Rewritten tail")
    assert.ok(patched.endsWith("## Last\nRewritten tail\n\n"))
  })

  it("chunkByHeadings respects token budget", async () => {
    const mod = await import(codeIntelModuleHref)
    const DocWeaver = mod.DocWeaver as new () => DocWeaverType

    const weaver = new DocWeaver()
    const content = [
      "# Intro",
      "A".repeat(220),
      "",
      "## Details",
      "B".repeat(260),
    ].join("\n")

    const chunks = weaver.chunkByHeadings(content, 30)
    assert.ok(chunks.length >= 2)
    for (const chunk of chunks) {
      assert.ok(chunk.tokenEstimate <= 30)
    }
  })
})
