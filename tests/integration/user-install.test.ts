import { execSync } from "node:child_process"
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { describe, it, expect, beforeAll, afterAll } from "vitest"

const PROJECT_ROOT = process.cwd()

/**
 * Pre-existing test pollution cleanup (one-time, runs once per test process).
 *
 * Historical `user-install.test.ts` hardcoded a temp dir under
 * `tests/integration/.tmp-user-install/` and could leave it behind on test
 * failure because `afterAll` is not guaranteed to run. That path is
 * dangerously close to the production-path template (`tests/integration/`)
 * used by other tooling and was polluting the working tree. Any pre-existing
 * pollution from a previous run is removed here as a one-shot cleanup
 * before the test process begins.
 *
 * `tests/integration/.hivemind/` is the actual production path template
 * (Q6 — `.hivemind/` is the internal state root). Tests must never write
 * there, so any stale state from a previous run is also removed.
 */
const LEGACY_TMP_DIR = resolve(PROJECT_ROOT, "tests/integration/.tmp-user-install")
const LEGACY_HIVEMIND_DIR = resolve(PROJECT_ROOT, "tests/integration/.hivemind")
rmSync(LEGACY_TMP_DIR, { recursive: true, force: true })
rmSync(LEGACY_HIVEMIND_DIR, { recursive: true, force: true })

// Per-process unique temp dir (mkdtempSync guarantees no collisions across
// concurrent vitest workers, and the dir is fully removed in afterAll).
let TMP_DIR: string

describe("E2E Integration — user install simulation", () => {
  beforeAll(() => {
    TMP_DIR = mkdtempSync(join(tmpdir(), "hivemind-user-install-"))
  })

  afterAll(() => {
    // try/catch (not try/finally — vitest's afterAll is the boundary here)
    // to guarantee cleanup even on test failure or process interruption.
    if (TMP_DIR) {
      try {
        rmSync(TMP_DIR, { recursive: true, force: true })
      } catch {
        // Best-effort cleanup; nothing the test process can do if the OS
        // is refusing the unlink (e.g. EBUSY on Windows). The directory
        // lives under os.tmpdir() and is reclaimed by the OS on reboot.
      }
    }
  })

  it("simulates a clean npm-install and postinstall asset extraction in consumer project", () => {
    // 1. Create a dummy consumer package.json
    const dummyPackage = {
      name: "dummy-consumer-project",
      version: "1.0.0",
      type: "module",
      scripts: {
        postinstall: `node ${resolve(PROJECT_ROOT, "scripts/sync-assets.js")} --mode=install`
      }
    }
    writeFileSync(join(TMP_DIR, "package.json"), JSON.stringify(dummyPackage, null, 2))

    // 2. Execute postinstall simulation with INIT_CWD set to our temporary directory.
    // This mimics npm running the postinstall hook with INIT_CWD pointing to the consumer project root.
    execSync(`node ${resolve(PROJECT_ROOT, "scripts/sync-assets.js")} --mode=install`, {
      env: {
        ...process.env,
        INIT_CWD: TMP_DIR
      },
      cwd: PROJECT_ROOT
    })

    // 3. Verify that shipped primitives from assets/ are correctly extracted to consumer's .opencode/ folder
    const targetDirs = ["agents", "skills", "commands", "workflows", "references", "templates"]
    for (const kind of targetDirs) {
      const destPath = join(TMP_DIR, ".opencode", kind)
      expect(existsSync(destPath)).toBe(true)
    }

    // 4. Verify that version.json was written to consumer's .hivemind/state/
    const versionPath = join(TMP_DIR, ".hivemind", "state", "version.json")
    expect(existsSync(versionPath)).toBe(true)

    const versionJson = JSON.parse(readFileSync(versionPath, "utf-8"))
    const sourcePkg = JSON.parse(readFileSync(resolve(PROJECT_ROOT, "package.json"), "utf-8"))
    expect(versionJson.version).toBe(sourcePkg.version)
  }, 30000)

  it("registers the plugin tools and hooks without runtime errors", async () => {
    const { default: plugin } = await import("../../dist/plugin.js")
    expect(typeof plugin.server).toBe("function")

    // Verify calling plugin returns expected interface or does not throw
    const mockClient = {
      app: {
        log: () => Promise.resolve(),
      },
      tool: () => {},
      hook: () => {},
    } as any

    const result = await plugin.server({
      client: mockClient,
      directory: TMP_DIR,
    })
    expect(result).toBeDefined()
    expect(result.tool).toBeDefined()
    expect(result.tool["delegate-task"]).toBeDefined()
  }, 30000)
})
