import assert from "node:assert/strict"
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { test } from "node:test"

import { initProject } from "../../src/cli/init.js"
import { getEffectivePaths } from "../../src/lib/paths.js"
import { resumeSession } from "../../src/lib/session-engine.js"

test("resumeSession uses effective sessionsDir for listing exports", async () => {
  const dir = await mkdtemp(join(tmpdir(), "hm-resume-path-"))

  try {
    await initProject(dir, { governanceMode: "assisted", language: "en", silent: true })

    const sessionsDir = getEffectivePaths(dir).sessionsDir
    const legacySessionsDir = join(dir, "sessions")
    await mkdir(sessionsDir, { recursive: true })
    await mkdir(legacySessionsDir, { recursive: true })
    await writeFile(join(sessionsDir, "session-test.json"), "{}", "utf-8")
    await writeFile(join(legacySessionsDir, "session-legacy.json"), "{}", "utf-8")

    const result = await resumeSession(dir, "")
    assert.equal(result.success, false)
    assert.equal(result.action, "resume")
    assert.equal(result.error, "sessionId required")
    assert.equal(result.data.availableCount, 1)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
