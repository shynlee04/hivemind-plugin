import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { join } from "node:path"
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, symlinkSync, realpathSync } from "node:fs"
import { tmpdir } from "node:os"

import { resolveSafeDocPath } from "../../../src/features/doc-intelligence/safety.js"

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

  it("throws with a Harness-prefixed error on symlink escape", () => {
    const secretPath = join(outsideRoot, "secret2.md")
    writeFileSync(secretPath, "x", "utf-8")
    const linkPath = join(projectRoot, "link2.md")
    symlinkSync(secretPath, linkPath)

    // Accept either [Harness] (from our realpath layer) or [Hivemind] (from
    // the underlying assertPathWithinRoot lexical/realpath layer). Both
    // signals indicate a path-traversal rejection, which is what matters.
    expect(() => resolveSafeDocPath(projectRoot, "link2.md", "write_lines"))
      .toThrow(/^\[(Harness|Hivemind)\]/)
  })
})
