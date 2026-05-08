import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { assertPathWithinRoot, resolveScopedPath } from "../../../src/shared/security/path-scope.js"

describe("path scope", () => {
  let root: string
  let outside: string

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "path-scope-root-"))
    outside = mkdtempSync(join(tmpdir(), "path-scope-outside-"))
  })

  afterEach(() => {
    rmSync(root, { recursive: true, force: true })
    rmSync(outside, { recursive: true, force: true })
  })

  it("allows valid project-local relative paths", () => {
    expect(resolveScopedPath(root, "session.md")).toBe(resolve(root, "session.md"))
  })

  it("allows canonical .hivemind state and event-tracker paths", () => {
    expect(assertPathWithinRoot(root, ".hivemind/state/session-continuity.json", "runtime state"))
      .toBe(resolve(root, ".hivemind/state/session-continuity.json"))
    expect(assertPathWithinRoot(root, ".hivemind/event-tracker/ses_test.json", "event tracker"))
      .toBe(resolve(root, ".hivemind/event-tracker/ses_test.json"))
  })

  it("rejects traversal outside the allowed root", () => {
    expect(() => assertPathWithinRoot(root, "../outside.md", "session patch"))
      .toThrow('[Harness] session patch path escapes allowed root: ../outside.md')
  })

  it("rejects absolute cross-root paths", () => {
    const target = join(outside, "session.md")
    expect(() => assertPathWithinRoot(root, target, "session patch"))
      .toThrow("[Harness] session patch path escapes allowed root:")
  })

  it("rejects symlink-resolved cross-root paths when detectable", () => {
    const outsideFile = join(outside, "session.md")
    writeFileSync(outsideFile, "# session")
    const linkPath = join(root, "linked-session.md")
    symlinkSync(outsideFile, linkPath)

    expect(() => assertPathWithinRoot(root, linkPath, "session patch"))
      .toThrow("[Harness] session patch path escapes allowed root:")
  })
})
