import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { join } from "node:path"
import {
  mkdtempSync,
  writeFileSync,
  readFileSync,
  rmSync,
  realpathSync,
  readdirSync,
  symlinkSync,
} from "node:fs"
import { tmpdir } from "node:os"

import {
  generateOpId,
  computeContentHash,
  lockedTransform,
  lockedTransformSync,
} from "../../../src/features/doc-intelligence/concurrency.js"

/**
 * concurrency — TDD evidence for the GAP-5 realpath fix.
 *
 * Evidence label: `runtime-truthful` — every test exercises real
 * `proper-lockfile` behavior through the public `lockedTransform` /
 * `lockedTransformSync` API on a real `mkdtempSync` directory.
 *
 * Test size: `medium` — real FS persistence boundary + cross-process lock.
 *
 * Background: `proper-lockfile@4.1.2` with `realpath: false` causes
 * "Lock file is already being held" on macOS because the temp
 * directory `/var/folders/.../T` resolves to `/private/var/folders/.../T`
 * via realpath. The lockfile is created at the unresolved path but the
 * unlock check (and second lock) re-resolve the path, missing the lock.
 *
 * The fix is `realpath: true` in every `lockSync` call so both lock
 * acquisition AND release use the same canonical path.
 */
describe("concurrency", () => {
  describe("generateOpId", () => {
    it("returns a 12-character hex string", () => {
      const id = generateOpId()
      expect(id).toMatch(/^[a-f0-9]{12}$/)
    })

    it("produces unique values", () => {
      const ids = new Set(Array.from({ length: 100 }, () => generateOpId()))
      expect(ids.size).toBe(100)
    })
  })

  describe("computeContentHash", () => {
    it("returns SHA-256 hex digest", () => {
      const hash = computeContentHash("test")
      // Known SHA-256 of "test"
      expect(hash).toBe("9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08")
    })

    it("produces different hashes for different content", () => {
      const hash1 = computeContentHash("hello")
      const hash2 = computeContentHash("world")
      expect(hash1).not.toBe(hash2)
    })
  })

  describe("lockedTransformSync", () => {
    it("writes content and returns changed=true", () => {
      const dir = mkdtempSync(join(tmpdir(), "doc-lock-"))
      const filePath = join(dir, "test.md")
      writeFileSync(filePath, "original", "utf-8")

      const result = lockedTransformSync(filePath, () => "modified content that is longer")
      expect(result.changed).toBe(true)
      expect(result.hash).toMatch(/^[a-f0-9]{64}$/)
      expect(result.opId).toMatch(/^[a-f0-9]{12}$/)
      expect(result.bytesChanged).toBeGreaterThan(0)
      expect(readFileSync(filePath, "utf-8")).toBe("modified content that is longer")

      rmSync(dir, { recursive: true, force: true })
    })

    it("returns changed=false when content unchanged", () => {
      const dir = mkdtempSync(join(tmpdir(), "doc-lock-"))
      const filePath = join(dir, "test.md")
      writeFileSync(filePath, "same", "utf-8")

      const result = lockedTransformSync(filePath, (content) => content)
      expect(result.changed).toBe(false)
      expect(result.bytesChanged).toBe(0)

      rmSync(dir, { recursive: true, force: true })
    })

    it("throws on stale-file hash mismatch", () => {
      const dir = mkdtempSync(join(tmpdir(), "doc-lock-"))
      const filePath = join(dir, "test.md")
      writeFileSync(filePath, "content", "utf-8")

      expect(() => {
        lockedTransformSync(filePath, (c) => c + "more", { expectedHash: "wronghash" })
      }).toThrow(/hash mismatch/)

      rmSync(dir, { recursive: true, force: true })
    })
  })

  /**
   * GAP-5: realpath-mismatch regression tests.
   *
   * The macOS `/var/folders/.../T` ↔ `/private/var/folders/.../T` realpath
   * divergence causes `lockSync(path, { realpath: false })` to leak lock
   * state across calls. The next lock attempt is rejected with
   * "Lock file is already being held".
   *
   * These tests pass when `concurrency.ts` uses `realpath: true`.
   * They fail (with the exact production error) when `realpath: false`
   * is used — confirming the reproduction matches the real bug.
   */
  describe("lockedTransform — realpath fix (GAP-5)", () => {
    let dir: string
    let filePath: string

    beforeEach(() => {
      dir = mkdtempSync(join(tmpdir(), "doc-lock-repro-"))
      filePath = join(dir, "doc.md")
      writeFileSync(filePath, "initial", "utf-8")
    })

    afterEach(() => {
      rmSync(dir, { recursive: true, force: true })
    })

    it("succeeds when called twice in succession on the same path (sync variant)", () => {
      // First call acquires + releases the lock cleanly.
      const r1 = lockedTransformSync(filePath, (content) => `${content} + first`)
      expect(r1.changed).toBe(true)
      expect(readFileSync(filePath, "utf-8")).toBe("initial + first")

      // Second call must also succeed. Before the fix, this throws
      // "Lock file is already being held" because the first lockfile
      // (created at the unresolved tmp path) was orphaned.
      const r2 = lockedTransformSync(filePath, (content) => `${content} + second`)
      expect(r2.changed).toBe(true)
      expect(readFileSync(filePath, "utf-8")).toBe("initial + first + second")
    })

    it("succeeds when called twice in succession on the same path (async variant)", async () => {
      const r1 = await lockedTransform(filePath, async (content) => `${content} + a1`)
      expect(r1.changed).toBe(true)

      const r2 = await lockedTransform(filePath, async (content) => `${content} + a2`)
      expect(r2.changed).toBe(true)
      expect(readFileSync(filePath, "utf-8")).toBe("initial + a1 + a2")
    })

    it("serializes concurrent async calls on the same path without leaking state", async () => {
      // `lockSync` is single-attempt (no retries) — the second concurrent
      // caller is expected to throw immediately. The contract proven by
      // this test is that the lock IS held during the first call (no
      // overlap), AND that a follow-up sequential call still works
      // (no leaked lock state). The follow-up call is the real
      // regression guard for GAP-5.
      const settled = await Promise.allSettled([
        lockedTransform(filePath, async (c) => `${c} | A`),
        lockedTransform(filePath, async (c) => `${c} | B`),
      ])

      const fulfilled = settled.filter((s) => s.status === "fulfilled")
      const rejected = settled.filter((s) => s.status === "rejected")
      // Exactly one wins, the other loses (single-attempt lock).
      expect(fulfilled.length).toBe(1)
      expect(rejected.length).toBe(1)
      // The losing call must throw a clean `[Hivemind]` lock-busy
      // error, not an unhandled rejection from a leaked state.
      const rejection = rejected[0]
      if (rejection.status === "rejected") {
        const msg = rejection.reason instanceof Error ? rejection.reason.message : String(rejection.reason)
        expect(msg).toMatch(/\[Hivemind\].*lock/i)
      }

      // The real regression guard: a follow-up sequential call must
      // succeed (no leaked lock from the rejected concurrent attempt).
      const followup = await lockedTransform(filePath, async (c) => `${c} | C`)
      expect(followup.changed).toBe(true)
      expect(readFileSync(filePath, "utf-8")).toMatch(/ \| C$/)
    })

    it("releases the lock on completion — no orphan lockfiles remain in the temp dir", () => {
      lockedTransformSync(filePath, (c) => `${c} !`)

      // After the call, the directory must contain ONLY the original
      // file and the .tmp file must have been renamed away. No orphan
      // `*.lock` files from a leaked proper-lockfile acquisition.
      // proper-lockfile stores lockfiles in the directory of the file
      // being locked (e.g. "doc.md.lock" or in a hidden subdir).
      const siblings = readdirSync(dir)
      const lockLeaks = siblings.filter((name) => /\.lock$/.test(name))
      expect(lockLeaks).toEqual([])
      // And the temp write target (.tmp) must be gone after rename.
      const tmpLeaks = siblings.filter((name) => /\.tmp$/.test(name))
      expect(tmpLeaks).toEqual([])
    })

    it("works through a symlink in the tmp realpath-divergent namespace", () => {
      // On macOS the test dir (returned by `tmpdir()`) may live at
      // /var/folders/.../T and resolve via realpath to
      // /private/var/folders/.../T. A symlink pointing to the file
      // from the realpath-divergent namespace is the worst case for
      // the bug. We construct it from `realpathSync(dir)` so the test
      // works on both Linux and macOS.
      //
      // Contract: `lockSync` with `realpath: true` resolves the
      // symlink to its target's realpath before storing/releasing
      // the lock, so the second call uses the same canonical lock
      // (no "Lock file is already being held" error).
      //
      // Note: `lockedTransformSync` writes via temp+rename, and
      // `rename` does NOT follow symlinks — it replaces the symlink
      // itself with a regular file. So we read back through the
      // symlink path, which now points at the renamed file with the
      // new content.
      const realDir = realpathSync(dir)
      const linkPath = join(realDir, "alias.md")
      symlinkSync("doc.md", linkPath)

      // First call — must succeed and not leave a leaked lock.
      const r1 = lockedTransformSync(linkPath, (c) => `${c} [via symlink]`)
      expect(r1.changed).toBe(true)
      expect(readFileSync(linkPath, "utf-8")).toBe("initial [via symlink]")

      // Second call — this is the GAP-5 regression guard. Before the
      // fix, the lockfile was orphaned at the unresolved tmp path and
      // this call threw "Lock file is already being held".
      const r2 = lockedTransformSync(linkPath, (c) => `${c} [twice]`)
      expect(r2.changed).toBe(true)
      expect(readFileSync(linkPath, "utf-8")).toBe("initial [via symlink] [twice]")
    })
  })
})
