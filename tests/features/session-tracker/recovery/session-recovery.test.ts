/**
 * Integration-level tests for session recovery and reconsumption.
 *
 * Tests the SessionRecovery class which enables agents to rebuild context
 * after disconnection by reading persisted tracker files and querying the
 * OpenCode SDK REST API.
 *
 * @module tests/features/session-tracker/recovery/session-recovery
 */

import { describe, it, expect, afterEach } from "vitest"
import { mkdir, writeFile, rm } from "node:fs/promises"
import { resolve } from "node:path"
import { tmpdir } from "node:os"

import { SessionRecovery } from "../../../../src/features/session-tracker/recovery/session-recovery.js"

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

/**
 * Creates a fresh test root directory with the session-tracker structure.
 */
async function setupTrackerRoot(testID: string): Promise<string> {
  const root = resolve(tmpdir(), `hivemind-rec-test-${testID}-${Date.now()}`)
  const trackerRoot = resolve(root, ".hivemind", "session-tracker")
  await mkdir(trackerRoot, { recursive: true })
  return root
}

/**
 * Creates a valid project-continuity.json file.
 */
async function writeProjectIndex(root: string, sessions: Record<string, unknown>): Promise<void> {
  const trackerRoot = resolve(root, ".hivemind", "session-tracker")
  await mkdir(trackerRoot, { recursive: true })
  await writeFile(
    resolve(trackerRoot, "project-continuity.json"),
    JSON.stringify({
      version: "2.0",
      projectRoot: root,
      lastUpdated: new Date().toISOString(),
      sessions,
      chronologicalOrder: Object.keys(sessions),
    }, null, 2),
    "utf-8",
  )
}

afterEach(async () => {
  // Cleanup is best-effort — test roots in tmpdir
})

describe("SessionRecovery", () => {
  describe("initialize()", () => {
    it("returns a session map when project-continuity.json is valid", async () => {
      const root = await setupTrackerRoot("init-valid")
      await writeProjectIndex(root, {
        ses_test001: {
          dir: "ses_test001/",
          mainFile: "ses_test001.md",
          continuityIndex: "ses_test001/session-continuity.json",
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          status: "active",
          childCount: 0,
          totalDelegationDepth: 0,
        },
      })

      const recovery = new SessionRecovery({
        client: null as unknown as never,
        projectRoot: root,
      })
      const sessionMap = await recovery.initialize()

      expect(sessionMap).instanceOf(Map)
      expect(sessionMap.size).toBe(1)
      expect(sessionMap.has("ses_test001")).toBe(true)

      await rm(root, { recursive: true, force: true })
    })

    it("returns an empty map when project-continuity.json is missing", async () => {
      const root = await setupTrackerRoot("init-missing")

      const recovery = new SessionRecovery({
        client: null as unknown as never,
        projectRoot: root,
      })
      const sessionMap = await recovery.initialize()

      expect(sessionMap).instanceOf(Map)
      expect(sessionMap.size).toBe(0)

      await rm(root, { recursive: true, force: true })
    })

    it("returns an empty map when project-continuity.json is corrupt", async () => {
      const root = await setupTrackerRoot("init-corrupt")
      const trackerRoot = resolve(root, ".hivemind", "session-tracker")
      await writeFile(
        resolve(trackerRoot, "project-continuity.json"),
        "not valid json{{{",
        "utf-8",
      )

      const recovery = new SessionRecovery({
        client: null as unknown as never,
        projectRoot: root,
      })
      const sessionMap = await recovery.initialize()

      expect(sessionMap).instanceOf(Map)
      expect(sessionMap.size).toBe(0)

      await rm(root, { recursive: true, force: true })
    })
  })

  describe("reconsumeSession()", () => {
    it("returns gap analysis comparing persisted file with SDK messages", async () => {
      const root = await setupTrackerRoot("reconsume")
      const trackerRoot = resolve(root, ".hivemind", "session-tracker")
      const sessionID = "ses_reco_test"
      const sessionDir = resolve(trackerRoot, sessionID)
      await mkdir(sessionDir, { recursive: true })
      await writeFile(
        resolve(sessionDir, `${sessionID}.md`),
        `---\nsessionID: ${sessionID}\nstatus: active\n---\n\n## USER (turn 1)\n\nHello\n`,
        "utf-8",
      )

      const mockClient = {
        session: {
          messages: async () => [
            { role: "user", content: "Hello" },
            { role: "user", content: "Second message" },
          ],
        },
      }
      const recovery = new SessionRecovery({
        client: mockClient as unknown as never,
        projectRoot: root,
      })
      const result = await recovery.reconsumeSession(sessionID)

      expect(result).toBeDefined()
      expect(result.sessionID).toBe(sessionID)
      expect(Array.isArray(result.missingMessages)).toBe(true)
      expect(Array.isArray(result.persistedMessages)).toBe(true)

      await rm(root, { recursive: true, force: true })
    })
  })

  describe("rebuildSessionContext()", () => {
    it("combines persisted file content with SDK message data", async () => {
      const root = await setupTrackerRoot("rebuild")
      const trackerRoot = resolve(root, ".hivemind", "session-tracker")
      const sessionID = "ses_rebuild_test"
      const sessionDir = resolve(trackerRoot, sessionID)
      await mkdir(sessionDir, { recursive: true })
      await writeFile(
        resolve(sessionDir, `${sessionID}.md`),
        `---\nsessionID: ${sessionID}\nstatus: active\n---\n\n## USER (turn 1)\n\nFirst message\n`,
        "utf-8",
      )

      const mockClient = {
        session: {
          messages: async () => [
            { role: "user", content: "First message" },
            { role: "assistant", content: "Response" },
          ],
        },
      }
      const recovery = new SessionRecovery({
        client: mockClient as unknown as never,
        projectRoot: root,
      })
      const context = await recovery.rebuildSessionContext(sessionID)

      expect(context).toBeDefined()
      expect(context.sessionID).toBe(sessionID)
      expect(context.fileContent).toBeDefined()
      expect(Array.isArray(context.messages)).toBe(true)

      await rm(root, { recursive: true, force: true })
    })
  })

  describe("isSessionFileParseable()", () => {
    it("returns true for a valid .md file", async () => {
      const root = await setupTrackerRoot("parse-ok")
      const trackerRoot = resolve(root, ".hivemind", "session-tracker")
      const sessionID = "ses_parse_test"
      const sessionDir = resolve(trackerRoot, sessionID)
      await mkdir(sessionDir, { recursive: true })
      const mdPath = resolve(sessionDir, `${sessionID}.md`)
      await writeFile(
        mdPath,
        `---\nsessionID: ${sessionID}\nstatus: active\n---\n\nContent here\n`,
        "utf-8",
      )

      const recovery = new SessionRecovery({
        client: null as unknown as never,
        projectRoot: root,
      })
      const result = await recovery.isSessionFileParseable(mdPath)
      expect(result).toBe(true)

      await rm(root, { recursive: true, force: true })
    })

    it("returns false for a nonexistent file", async () => {
      const root = await setupTrackerRoot("parse-missing")
      const recovery = new SessionRecovery({
        client: null as unknown as never,
        projectRoot: root,
      })
      const result = await recovery.isSessionFileParseable(
        resolve(root, ".hivemind", "session-tracker", "nonexistent", "file.md"),
      )
      expect(result).toBe(false)

      await rm(root, { recursive: true, force: true })
    })
  })
})
