import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { join } from "node:path"
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, symlinkSync, realpathSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"

import { resolveSafeDocPath, matchGovernanceDenylist } from "../../../src/features/doc-intelligence/safety.js"
import { createDocument, writeSectionBody, upsertSection, appendSection, insertSection, deleteSection, deleteFile, searchAndReplace } from "../../../src/features/doc-intelligence/write-ops.js"
import { writeDocumentMetadata, deleteDocumentMetadataField } from "../../../src/features/doc-intelligence/metadata-ops.js"
import { batchSectionEdits } from "../../../src/features/doc-intelligence/batch-ops.js"

/**
 * Symlink traversal protection — TDD evidence.
 *
 * Evidence label: `runtime-truthful` — these tests create real symlinks with
 * `symlinkSync`, exercise the real `resolveSafeDocPath` path-resolution
 * pipeline, and assert that path-traversal attacks are rejected with the
 * expected error message prefix.
 *
 * Test size: `small` — single function under test, real filesystem symlinks.
 */

describe("resolveSafeDocPath — symlink traversal protection", () => {
  let projectRoot: string
  let outsideRoot: string

  beforeEach(() => {
    projectRoot = mkdtempSync(join(tmpdir(), "doc-symlink-proj-"))
    outsideRoot = mkdtempSync(join(tmpdir(), "doc-symlink-out-"))
  })

  afterEach(() => {
    rmSync(projectRoot, { recursive: true, force: true })
    rmSync(outsideRoot, { recursive: true, force: true })
  })

  it("allows a normal in-scope file", () => {
    writeFileSync(join(projectRoot, "doc.md"), "hello", "utf-8")
    const resolved = resolveSafeDocPath(projectRoot, "doc.md", "write_lines")
    expect(resolved.endsWith("doc.md")).toBe(true)
  })

  it("allows a file inside a normal in-scope subdirectory", () => {
    mkdirSync(join(projectRoot, "sub"))
    writeFileSync(join(projectRoot, "sub", "doc.md"), "hello", "utf-8")
    const resolved = resolveSafeDocPath(projectRoot, "sub/doc.md", "write_lines")
    expect(resolved).toBe(join(projectRoot, "sub", "doc.md"))
  })

  it("rejects a symlink whose target is OUTSIDE the project root (existing file)", () => {
    // Create a real file outside the project root
    const secretPath = join(outsideRoot, "secret.md")
    writeFileSync(secretPath, "outside content", "utf-8")

    // Create a symlink inside the project root pointing to the outside file
    const linkPath = join(projectRoot, "sneaky.md")
    symlinkSync(secretPath, linkPath)

    expect(() => resolveSafeDocPath(projectRoot, "sneaky.md", "write_lines"))
      .toThrow(/[Ss]ymlink|resolves outside|escapes/)
  })

  it("rejects a symlink to an outside DIRECTORY containing a file", () => {
    mkdirSync(join(outsideRoot, "external"))
    writeFileSync(join(outsideRoot, "external", "leak.md"), "outside", "utf-8")

    const linkPath = join(projectRoot, "leak-link")
    symlinkSync(join(outsideRoot, "external"), linkPath)

    expect(() => resolveSafeDocPath(projectRoot, "leak-link/leak.md", "write_lines"))
      .toThrow(/[Ss]ymlink|resolves outside|escapes/)
  })

  it("rejects a relative symlink that escapes the project root", () => {
    // Place a file in a sibling temp dir, then make a relative symlink that
    // points through the parent to reach it.
    const sibling = mkdtempSync(join(tmpdir(), "doc-symlink-sib-"))
    try {
      const target = join(sibling, "target.md")
      writeFileSync(target, "data", "utf-8")

      const linkPath = join(projectRoot, "rel-escape")
      // ../<sibling-basename>/target.md resolves from the link's parent
      const rel = `../${sibling.split("/").pop()}/target.md`
      symlinkSync(rel, linkPath)

      expect(() => resolveSafeDocPath(projectRoot, "rel-escape", "write_lines"))
        .toThrow(/[Ss]ymlink|resolves outside|escapes/)
    } finally {
      rmSync(sibling, { recursive: true, force: true })
    }
  })

  it("allows a symlink whose target is INSIDE the project root", () => {
    writeFileSync(join(projectRoot, "real.md"), "real content", "utf-8")
    const linkPath = join(projectRoot, "alias.md")
    symlinkSync(join(projectRoot, "real.md"), linkPath)

    const resolved = resolveSafeDocPath(projectRoot, "alias.md", "write_lines")
    const realProject = realpathSync(projectRoot)
    const realResolved = realpathSync(resolved)
    expect(realResolved.startsWith(realProject)).toBe(true)
  })

  it("rejects a new (non-existent) file path whose PARENT is a symlink to outside", () => {
    // Parent dir is a symlink to outside
    const outsideDir = join(outsideRoot, "fake-parent")
    mkdirSync(outsideDir)
    const parentLink = join(projectRoot, "fake-parent")
    symlinkSync(outsideDir, parentLink)

    expect(() => resolveSafeDocPath(projectRoot, "fake-parent/brand-new.md", "write_lines"))
      .toThrow(/[Ss]ymlink|resolves outside|escapes/)
  })

  it("throws with a [Hivemind]-prefixed error on symlink escape", () => {
    const secretPath = join(outsideRoot, "secret2.md")
    writeFileSync(secretPath, "x", "utf-8")
    const linkPath = join(projectRoot, "link2.md")
    symlinkSync(secretPath, linkPath)

    // Accept either [Hivemind] (from our realpath layer) or [Hivemind] (from
    // the underlying assertPathWithinRoot lexical/realpath layer). Both
    // signals indicate a path-traversal rejection, which is what matters.
    expect(() => resolveSafeDocPath(projectRoot, "link2.md", "write_lines"))
      .toThrow(/^\[Hivemind\]/)
  })

  // ─── Wave 1 GAP-2 — callsite-level action-name coverage (RED) ────────────
  // Each new case invokes the actual migrated op (createDocument, etc.)
  // with a symlink path that points to an outside file. The op MUST:
  //   1. throw with the new [Hivemind] <op>: ... format produced by
  //      resolveSafeDocPath (operation-name appears in the error)
  //   2. NOT mutate the outside target (the real proof — symlink write
  //      would have silently written through to the outside file)
  //
  // Before migration, the ops use resolveDocPath (no operation-name
  // awareness), and the underlying assertPathWithinRoot throws
  // [Hivemind] <boundary> path escapes ... — which does NOT include
  // the operation name. The strict regex `^\[Hivemind\] <op>:` therefore
  // RED-fails on the pre-migration code, and passes only after
  // resolveSafeDocPath is wired in with the correct operation label.
  //
  // Evidence: runtime-truthful (real symlinkSync + realpathSync + real
  // file read-back to detect mutation of the outside target).

  it("createDocument throws [Hivemind] create: when the path is a symlink to outside", async () => {
    const outsideTarget = join(outsideRoot, "create-target.md")
    const original = "ORIGINAL-CONTENT-NOT-MUTATED\n"
    writeFileSync(outsideTarget, original, "utf-8")

    const linkPath = join(projectRoot, "create-link.md")
    symlinkSync(outsideTarget, linkPath)

    await expect(
      createDocument(projectRoot, "create-link.md", "Sneaky"),
    ).rejects.toThrow(/^\[Hivemind\] create:/)

    expect(readFileSync(outsideTarget, "utf-8")).toBe(original)
  })

  it("writeSectionBody throws [Hivemind] write: when the path is a symlink to outside", async () => {
    const outsideTarget = join(outsideRoot, "write-target.md")
    const original = "# Title\n\nORIGINAL\n"
    writeFileSync(outsideTarget, original, "utf-8")

    const linkPath = join(projectRoot, "write-link.md")
    symlinkSync(outsideTarget, linkPath)

    await expect(
      writeSectionBody(projectRoot, "write-link.md", "Title", "BODY"),
    ).rejects.toThrow(/^\[Hivemind\] write:/)

    expect(readFileSync(outsideTarget, "utf-8")).toBe(original)
  })

  it("upsertSection throws [Hivemind] upsert: when the path is a symlink to outside", async () => {
    const outsideTarget = join(outsideRoot, "upsert-target.md")
    const original = "# Title\n\nORIGINAL\n"
    writeFileSync(outsideTarget, original, "utf-8")

    const linkPath = join(projectRoot, "upsert-link.md")
    symlinkSync(outsideTarget, linkPath)

    await expect(
      upsertSection(projectRoot, "upsert-link.md", "Title", "BODY"),
    ).rejects.toThrow(/^\[Hivemind\] upsert:/)

    expect(readFileSync(outsideTarget, "utf-8")).toBe(original)
  })

  it("appendSection throws [Hivemind] append: when the path is a symlink to outside", async () => {
    const outsideTarget = join(outsideRoot, "append-target.md")
    const original = "# Title\n\nORIGINAL\n"
    writeFileSync(outsideTarget, original, "utf-8")

    const linkPath = join(projectRoot, "append-link.md")
    symlinkSync(outsideTarget, linkPath)

    await expect(
      appendSection(projectRoot, "append-link.md", "Title", "EXTRA"),
    ).rejects.toThrow(/^\[Hivemind\] append:/)

    expect(readFileSync(outsideTarget, "utf-8")).toBe(original)
  })

  it("insertSection throws [Hivemind] insert: when the path is a symlink to outside", async () => {
    const outsideTarget = join(outsideRoot, "insert-target.md")
    const original = "# Title\n\nORIGINAL\n"
    writeFileSync(outsideTarget, original, "utf-8")

    const linkPath = join(projectRoot, "insert-link.md")
    symlinkSync(outsideTarget, linkPath)

    await expect(
      insertSection(projectRoot, "insert-link.md", "Title", "New", 2, "BODY"),
    ).rejects.toThrow(/^\[Hivemind\] insert:/)

    expect(readFileSync(outsideTarget, "utf-8")).toBe(original)
  })

  it("deleteSection throws [Hivemind] delete: when the path is a symlink to outside", async () => {
    const outsideTarget = join(outsideRoot, "delete-target.md")
    const original = "# Title\n\nORIGINAL\n"
    writeFileSync(outsideTarget, original, "utf-8")

    const linkPath = join(projectRoot, "delete-link.md")
    symlinkSync(outsideTarget, linkPath)

    await expect(
      deleteSection(projectRoot, "delete-link.md", "Title"),
    ).rejects.toThrow(/^\[Hivemind\] delete:/)

    expect(readFileSync(outsideTarget, "utf-8")).toBe(original)
  })

  it("writeDocumentMetadata throws [Hivemind] set_metadata: when the path is a symlink to outside", async () => {
    const outsideTarget = join(outsideRoot, "set-meta-target.md")
    const original = "---\ntitle: x\n---\n# Body\n"
    writeFileSync(outsideTarget, original, "utf-8")

    const linkPath = join(projectRoot, "set-meta-link.md")
    symlinkSync(outsideTarget, linkPath)

    await expect(
      writeDocumentMetadata(projectRoot, "set-meta-link.md", { title: "MUTATED" }),
    ).rejects.toThrow(/^\[Hivemind\] set_metadata:/)

    expect(readFileSync(outsideTarget, "utf-8")).toBe(original)
  })

  it("deleteDocumentMetadataField throws [Hivemind] delete_metadata: when the path is a symlink to outside", async () => {
    const outsideTarget = join(outsideRoot, "del-meta-target.md")
    const original = "---\ntitle: x\nkeep: y\n---\n# Body\n"
    writeFileSync(outsideTarget, original, "utf-8")

    const linkPath = join(projectRoot, "del-meta-link.md")
    symlinkSync(outsideTarget, linkPath)

    await expect(
      deleteDocumentMetadataField(projectRoot, "del-meta-link.md", "title"),
    ).rejects.toThrow(/^\[Hivemind\] delete_metadata:/)

    expect(readFileSync(outsideTarget, "utf-8")).toBe(original)
  })

  it("batchSectionEdits throws [Hivemind] batch: when the path is a symlink to outside", async () => {
    const outsideTarget = join(outsideRoot, "batch-target.md")
    const original = "# Title\n\nORIGINAL\n"
    writeFileSync(outsideTarget, original, "utf-8")

    const linkPath = join(projectRoot, "batch-link.md")
    symlinkSync(outsideTarget, linkPath)

    await expect(
      batchSectionEdits(projectRoot, "batch-link.md", [
        { op: "write", heading: "Title", body: "MUTATED" },
      ]),
    ).rejects.toThrow(/^\[Hivemind\] batch:/)

    expect(readFileSync(outsideTarget, "utf-8")).toBe(original)
  })

  // ─── 61.2.1 GAP-A — REQ-SAFE-08 (deleteFile) + REQ-SAFE-09 (searchAndReplace) ─
  // deleteFile and searchAndReplace in write-ops.ts still use the lexical
  // resolveDocPath at the time of writing. They MUST be migrated to
  // resolveSafeDocPath so the operation name is observable AND the realpath
  // layer is enforced. These tests are the regression guard for the migration.

  it("deleteFile throws [Hivemind] delete_file: when the path is a symlink to outside", async () => {
    const outsideTarget = join(outsideRoot, "delete-file-target.md")
    const original = "# Title\n\nORIGINAL\n"
    writeFileSync(outsideTarget, original, "utf-8")

    const linkPath = join(projectRoot, "delete-file-link.md")
    symlinkSync(outsideTarget, linkPath)

    await expect(
      deleteFile(projectRoot, "delete-file-link.md"),
    ).rejects.toThrow(/^\[Hivemind\] delete_file:/)

    expect(readFileSync(outsideTarget, "utf-8")).toBe(original)
  })

  it("searchAndReplace throws [Hivemind] search_and_replace: when the path is a symlink to outside", async () => {
    const outsideTarget = join(outsideRoot, "search-replace-target.md")
    const original = "# Title\n\nORIGINAL\n"
    writeFileSync(outsideTarget, original, "utf-8")

    const linkPath = join(projectRoot, "search-replace-link.md")
    symlinkSync(outsideTarget, linkPath)

    await expect(
      searchAndReplace(projectRoot, "search-replace-link.md", "ORIGINAL", "MUTATED"),
    ).rejects.toThrow(/^\[Hivemind\] search_and_replace:/)

    expect(readFileSync(outsideTarget, "utf-8")).toBe(original)
  })

  // ─── Wave 1 GAP-2 — `ignore`-backed governance denylist coverage (RED) ──
  // matchGovernanceDenylist must classify all governance-rooted paths
  // (.hivemind/**, .opencode/**, AGENTS.md, CLAUDE.md) as blocked, and
  // ordinary src/ paths as allowed. Backed by the `ignore` library.

  it("matchGovernanceDenylist blocks governance-rooted paths (positive coverage)", () => {
    expect(matchGovernanceDenylist(".hivemind/state/foo.json")).toBe(true)
    expect(matchGovernanceDenylist(".opencode/agents/build.md")).toBe(true)
    expect(matchGovernanceDenylist("AGENTS.md")).toBe(true)
    expect(matchGovernanceDenylist("CLAUDE.md")).toBe(true)
  })

  it("matchGovernanceDenylist allows ordinary src/ paths (negative coverage)", () => {
    expect(matchGovernanceDenylist("src/index.ts")).toBe(false)
    expect(matchGovernanceDenylist("docs/plan/overview.md")).toBe(false)
  })
})
