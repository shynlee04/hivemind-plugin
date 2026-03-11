/**
 * hivemind_doc — Document intelligence tool tests.
 *
 * Covers: DocWeaver extensions, doc-intel library functions,
 * and the hivemind_doc tool surface.
 */

import { describe, it, before, after } from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, writeFile, mkdir, rm, readFile } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"

import { DocWeaver, estimateTokens } from "../src/lib/code-intel/doc-weaver.js"

// ─── Test Fixtures ──────────────────────────────────────────────────────────────

const SAMPLE_MD = `---
title: Test Document
author: hivefiver
date: 2026-03-11
---

# Introduction

This is the introduction section.

## Background

Some background context here.

## Goals

- Goal 1
- Goal 2
- Goal 3

# Implementation

## Phase 1

Phase 1 details here.

### Sub-task A

Sub-task A content.

### Sub-task B

Sub-task B content.

## Phase 2

Phase 2 details here.

# Conclusion

Final thoughts.
`

const LARGE_MD = Array.from({ length: 700 }, (_, i) =>
  i % 50 === 0 ? `## Section ${Math.floor(i / 50) + 1}\n` : `Line ${i + 1} of content.\n`
).join("")

// ─── DocWeaver Extension Tests ──────────────────────────────────────────────────

describe("DocWeaver extensions", () => {
  const weaver = new DocWeaver()

  describe("readOutline", () => {
    it("should parse heading hierarchy correctly", () => {
      const outline = weaver.readOutline(SAMPLE_MD)
      assert.ok(outline.length > 0)

      const topLevel = outline.map(h => h.text)
      assert.ok(topLevel.includes("Introduction"))
      assert.ok(topLevel.includes("Implementation"))
      assert.ok(topLevel.includes("Conclusion"))
    })

    it("should nest child headings under parents", () => {
      const outline = weaver.readOutline(SAMPLE_MD)
      const intro = outline.find(h => h.text === "Introduction")
      assert.ok(intro)
      assert.ok(intro.children.length >= 2, "Introduction should have Background and Goals children")
    })
  })

  describe("readSectionContent", () => {
    it("should return the body of a section", () => {
      const body = weaver.readSectionContent(SAMPLE_MD, "Goals")
      assert.ok(body)
      assert.ok(body.includes("Goal 1"))
      assert.ok(body.includes("Goal 3"))
    })

    it("should return null for non-existent headings", () => {
      const body = weaver.readSectionContent(SAMPLE_MD, "Nonexistent")
      assert.equal(body, null)
    })
  })

  describe("patchSection", () => {
    it("should replace section body", () => {
      const patched = weaver.patchSection(SAMPLE_MD, "Goals", "New goals content")
      assert.ok(patched.includes("New goals content"))
      assert.ok(!patched.includes("Goal 1"))
      // Heading should be preserved
      assert.ok(patched.includes("## Goals"))
    })

    it("should return original if heading not found", () => {
      const patched = weaver.patchSection(SAMPLE_MD, "Nonexistent", "content")
      assert.equal(patched, SAMPLE_MD)
    })
  })

  describe("appendToSection", () => {
    it("should append content without replacing existing body", () => {
      const patched = weaver.appendToSection(SAMPLE_MD, "Goals", "- Goal 4")
      assert.ok(patched.includes("Goal 1"), "Original content should remain")
      assert.ok(patched.includes("Goal 4"), "Appended content should be present")
    })

    it("should return original if heading not found", () => {
      const patched = weaver.appendToSection(SAMPLE_MD, "Missing", "new content")
      assert.equal(patched, SAMPLE_MD)
    })
  })

  describe("insertAfterSection", () => {
    it("should insert a new section after the target", () => {
      const patched = weaver.insertAfterSection(SAMPLE_MD, "Goals", "Non-Goals", 2, "Things not in scope.")
      assert.ok(patched.includes("## Non-Goals"), "New heading should be present")
      assert.ok(patched.includes("Things not in scope."), "New body should be present")
      // Goals should still exist
      assert.ok(patched.includes("## Goals"))
      // Non-Goals should come after Goals section content
      const goalsIdx = patched.indexOf("## Goals")
      const nonGoalsIdx = patched.indexOf("## Non-Goals")
      assert.ok(nonGoalsIdx > goalsIdx, "Non-Goals should come after Goals")
    })
  })

  describe("deleteSection", () => {
    it("should remove the section and its body", () => {
      const patched = weaver.deleteSection(SAMPLE_MD, "Goals")
      assert.ok(!patched.includes("## Goals"), "Heading should be removed")
      assert.ok(!patched.includes("Goal 1"), "Body should be removed")
      // Other sections should remain
      assert.ok(patched.includes("## Background"))
      assert.ok(patched.includes("# Implementation"))
    })
  })

  describe("readFrontmatter", () => {
    it("should parse YAML frontmatter", () => {
      const fm = weaver.readFrontmatter(SAMPLE_MD)
      assert.ok(fm)
      assert.equal(fm.title, "Test Document")
      assert.equal(fm.author, "hivefiver")
      assert.equal(fm.date, "2026-03-11")
    })

    it("should return null if no frontmatter", () => {
      const fm = weaver.readFrontmatter("# Just a heading\n\nSome content.")
      assert.equal(fm, null)
    })
  })

  describe("writeFrontmatter", () => {
    it("should update existing frontmatter fields", () => {
      const patched = weaver.writeFrontmatter(SAMPLE_MD, { version: "2.0" })
      assert.ok(patched.includes("version: 2.0"))
      // Original fields should be preserved
      assert.ok(patched.includes("title: Test Document"))
    })

    it("should create frontmatter if none exists", () => {
      const content = "# Heading\n\nContent."
      const patched = weaver.writeFrontmatter(content, { title: "New" })
      assert.ok(patched.startsWith("---"))
      assert.ok(patched.includes("title: New"))
    })
  })

  describe("chunkByHeadings", () => {
    it("should split document into chunks", () => {
      const chunks = weaver.chunkByHeadings(SAMPLE_MD, 500)
      assert.ok(chunks.length > 1, "Should produce multiple chunks")
      for (const chunk of chunks) {
        assert.ok(chunk.tokenEstimate > 0)
        assert.ok(chunk.heading.length > 0)
      }
    })
  })
})

// ─── doc-intel Library Tests ────────────────────────────────────────────────────

describe("doc-intel library", () => {
  let tmpDir: string

  before(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "doc-intel-test-"))
    // Create test file structure
    await writeFile(join(tmpDir, "test.md"), SAMPLE_MD, "utf-8")
    await writeFile(join(tmpDir, "large.md"), LARGE_MD, "utf-8")
    await mkdir(join(tmpDir, "docs"), { recursive: true })
    await writeFile(join(tmpDir, "docs", "plan.md"), "# Plan\n\n## Step 1\n\nDo things.\n\n## Step 2\n\nDo more things.\n", "utf-8")
    await writeFile(join(tmpDir, "docs", "notes.md"), "---\ntitle: Notes\n---\n\n# Notes\n\n## Important\n\nDon't forget.\n", "utf-8")
    await writeFile(join(tmpDir, "code.ts"), "export const x = 1;\n", "utf-8")
  })

  after(async () => {
    await rm(tmpDir, { recursive: true, force: true })
  })

  // Dynamic import to avoid module-level import issues
  async function getDocIntel() {
    return import("../src/lib/doc-intel.js")
  }

  describe("skimDocument", () => {
    it("should return outline, metadata, and metrics", async () => {
      const { skimDocument } = await getDocIntel()
      const result = await skimDocument(tmpDir, "test.md")
      assert.ok(result.outline.length > 0)
      assert.ok(result.metadata)
      assert.equal(result.metadata?.title, "Test Document")
      assert.ok(result.lineCount > 0)
      assert.ok(result.tokenEstimate > 0)
    })
  })

  describe("skimDirectory", () => {
    it("should skim all documents in a directory", async () => {
      const { skimDirectory } = await getDocIntel()
      const results = await skimDirectory(tmpDir, "docs")
      assert.ok(results.length >= 2, `Expected at least 2 docs, got ${results.length}`)
    })

    it("should respect glob filter", async () => {
      const { skimDirectory } = await getDocIntel()
      const results = await skimDirectory(tmpDir, "docs", ".md")
      assert.ok(results.length >= 2)
    })
  })

  describe("readSection", () => {
    it("should read a specific section by heading", async () => {
      const { readSection } = await getDocIntel()
      const body = await readSection(tmpDir, "test.md", "Goals")
      assert.ok(body)
      assert.ok(body.includes("Goal 1"))
    })

    it("should return null for missing heading", async () => {
      const { readSection } = await getDocIntel()
      const body = await readSection(tmpDir, "test.md", "Missing")
      assert.equal(body, null)
    })
  })

  describe("readChunked", () => {
    it("should chunk a file into token-budget pieces", async () => {
      const { readChunked } = await getDocIntel()
      const chunks = await readChunked(tmpDir, "test.md", undefined, 500)
      assert.ok(chunks.length > 1)
    })
  })

  describe("readMetadata", () => {
    it("should extract frontmatter", async () => {
      const { readMetadata } = await getDocIntel()
      const meta = await readMetadata(tmpDir, "test.md")
      assert.ok(meta)
      assert.equal(meta.title, "Test Document")
    })
  })

  describe("generateTOC", () => {
    it("should generate a markdown table of contents", async () => {
      const { generateTOC } = await getDocIntel()
      const toc = await generateTOC(tmpDir, "test.md")
      assert.ok(toc.includes("Introduction"))
      assert.ok(toc.includes("Implementation"))
      assert.ok(toc.includes("Conclusion"))
    })
  })

  describe("writeSection", () => {
    it("should replace section body", async () => {
      const { writeSection, readSection } = await getDocIntel()
      // Use docs/plan.md to avoid modifying the main test file
      const result = await writeSection(tmpDir, "docs/plan.md", "Step 1", "Updated step 1 content.")
      assert.ok(!("status" in result), "Should not return chunk_required for small file")
      const successResult = result as { changed: boolean; bytesChanged: number }
      assert.ok(successResult.changed)
      assert.ok(successResult.bytesChanged > 0)

      const body = await readSection(tmpDir, "docs/plan.md", "Step 1")
      assert.ok(body?.includes("Updated step 1 content."))
    })

    it("should return chunk_required signal for large files", async () => {
      const { writeSection } = await getDocIntel()
      const result = await writeSection(tmpDir, "large.md", "Section 1", "new content")
      assert.ok("status" in result)
      assert.equal((result as { status: string }).status, "chunk_required")
    })

    it("should reject write on non-writable extensions", async () => {
      const { writeSection } = await getDocIntel()
      await assert.rejects(
        () => writeSection(tmpDir, "code.ts", "export", "new content"),
        /not writable/i,
      )
    })
  })

  describe("appendSection", () => {
    it("should append to section body", async () => {
      const { appendSection, readSection } = await getDocIntel()
      const result = await appendSection(tmpDir, "docs/plan.md", "Step 2", "Additional step 2 info.")
      assert.ok(result.changed)

      const body = await readSection(tmpDir, "docs/plan.md", "Step 2")
      assert.ok(body?.includes("Do more things."), "Original content should remain")
      assert.ok(body?.includes("Additional step 2 info."), "Appended content should be present")
    })
  })

  describe("insertSection", () => {
    it("should insert a new section after a heading", async () => {
      const { insertSection } = await getDocIntel()
      const result = await insertSection(tmpDir, "docs/plan.md", "Step 2", "Step 3", 2, "Final step content.")
      assert.ok(result.changed)

      const content = await readFile(join(tmpDir, "docs/plan.md"), "utf-8")
      assert.ok(content.includes("## Step 3"))
      assert.ok(content.includes("Final step content."))
    })
  })

  describe("deleteSection", () => {
    it("should delete a section by heading", async () => {
      const { deleteSection } = await getDocIntel()
      // Delete the Step 3 we just inserted
      const result = await deleteSection(tmpDir, "docs/plan.md", "Step 3")
      assert.ok(result.changed)

      const content = await readFile(join(tmpDir, "docs/plan.md"), "utf-8")
      assert.ok(!content.includes("## Step 3"), "Step 3 heading should be removed")
      assert.ok(!content.includes("Final step content."), "Step 3 body should be removed")
    })
  })

  describe("writeMetadata", () => {
    it("should set frontmatter fields", async () => {
      const { writeMetadata, readMetadata } = await getDocIntel()
      const result = await writeMetadata(tmpDir, "docs/notes.md", { version: "1.0" })
      assert.ok(result.changed)

      const meta = await readMetadata(tmpDir, "docs/notes.md")
      assert.ok(meta)
      assert.equal(meta.version, "1.0")
      assert.equal(meta.title, "Notes", "Existing fields should be preserved")
    })
  })

  describe("createDocument", () => {
    it("should create a new document with frontmatter", async () => {
      const { createDocument } = await getDocIntel()
      const result = await createDocument(tmpDir, "docs/new-doc.md", "New Document", { author: "test" })
      assert.ok(result.created)

      const content = await readFile(join(tmpDir, "docs/new-doc.md"), "utf-8")
      assert.ok(content.includes("# New Document"))
      assert.ok(content.includes("author: test"))
    })

    it("should reject creating over existing file", async () => {
      const { createDocument } = await getDocIntel()
      await assert.rejects(
        () => createDocument(tmpDir, "test.md", "Overwrite Attempt"),
        /already exists/i,
      )
    })
  })

  describe("searchDocuments", () => {
    it("should find keyword matches across files", async () => {
      const { searchDocuments } = await getDocIntel()
      const results = await searchDocuments(tmpDir, ".", "Goal")
      assert.ok(results.length > 0)
      assert.ok(results.some(r => r.snippet.includes("Goal")))
    })

    it("should support heading-only search", async () => {
      const { searchDocuments } = await getDocIntel()
      const results = await searchDocuments(tmpDir, "docs", "Step", { headingOnly: true })
      assert.ok(results.length > 0)
      for (const r of results) {
        assert.ok(r.snippet.includes("Step"), "All results should contain Step in heading line")
      }
    })
  })

  describe("listDocuments", () => {
    it("should list documents with metadata", async () => {
      const { listDocuments } = await getDocIntel()
      const docs = await listDocuments(tmpDir, "docs")
      assert.ok(docs.length >= 2)
      for (const doc of docs) {
        assert.ok(doc.path)
        assert.ok(doc.lineCount > 0)
        assert.ok(doc.sizeBytes > 0)
        assert.ok(doc.lastModified)
      }
    })
  })

  describe("path safety", () => {
    it("should block directory traversal", async () => {
      const { skimDocument } = await getDocIntel()
      await assert.rejects(
        () => skimDocument(tmpDir, "../../etc/passwd"),
        /traversal blocked/i,
      )
    })
  })
})

// ─── estimateTokens Tests ───────────────────────────────────────────────────────

describe("estimateTokens", () => {
  it("should estimate ~4 chars per token", () => {
    assert.equal(estimateTokens(""), 1) // minimum 1
    assert.equal(estimateTokens("1234"), 1)
    assert.equal(estimateTokens("12345678"), 2)
  })
})
