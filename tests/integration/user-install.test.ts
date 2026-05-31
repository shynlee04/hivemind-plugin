import { execSync } from "node:child_process"
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { describe, it, expect, beforeAll, afterAll } from "vitest"

const PROJECT_ROOT = process.cwd()
const TMP_DIR = resolve(PROJECT_ROOT, "tests/integration/.tmp-user-install")

describe("E2E Integration — user install simulation", () => {
  beforeAll(() => {
    rmSync(TMP_DIR, { recursive: true, force: true })
    mkdirSync(TMP_DIR, { recursive: true })
  })

  afterAll(() => {
    rmSync(TMP_DIR, { recursive: true, force: true })
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
