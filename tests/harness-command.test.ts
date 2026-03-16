import assert from "node:assert/strict"
import { createServer } from "node:http"
import { access, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, it } from "node:test"

import { initProject } from "../src/cli/init.js"
import { runHarnessCommand } from "../src/cli/harness.js"

describe("harness command", () => {
  it("prefers runtime recovery commands over attach guidance when the server is healthy but HiveMind bootstrap is missing", async () => {
    const dir = await mkdtemp(join(tmpdir(), "hm-harness-missing-bootstrap-"))
    const server = createServer((req, res) => {
      if (req.url === "/global/health") {
        res.writeHead(200, { "content-type": "application/json" })
        res.end(JSON.stringify({ healthy: true, version: "test-opencode" }))
        return
      }
      res.writeHead(404)
      res.end()
    })

    try {
      await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()))
      const address = server.address()
      if (!address || typeof address === "string") {
        throw new Error("failed to bind test server")
      }

      const result = await runHarnessCommand(dir, {
        serverUrl: `http://127.0.0.1:${address.port}`,
      })

      const report = result.commandResult.report as { next_command?: string }

      assert.equal(result.healthy, true)
      assert.equal(result.commandResult.closeoutStatus, "blocked")
      assert.equal(report.next_command, "hm-init")
      assert.deepEqual(result.recommendedCommands, ["hm-init", "hm-doctor", "opencode serve"])
      await assert.rejects(access(join(dir, ".opencode")))
    } finally {
      server.close()
      await rm(dir, { recursive: true, force: true })
    }
  })

  it("checks server health and writes meta-module artifacts", async () => {
    const dir = await mkdtemp(join(tmpdir(), "hm-harness-"))
    const server = createServer((req, res) => {
      if (req.url === "/global/health") {
        res.writeHead(200, { "content-type": "application/json" })
        res.end(JSON.stringify({ healthy: true, version: "test-opencode" }))
        return
      }
      res.writeHead(404)
      res.end()
    })

    try {
      await initProject(dir, { presetId: "guided-onboarding", silent: true })
      await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()))
      const address = server.address()
      if (!address || typeof address === "string") {
        throw new Error("failed to bind test server")
      }

      const result = await runHarnessCommand(dir, {
        serverUrl: `http://127.0.0.1:${address.port}`,
      })

      assert.equal(result.healthy, true)
      assert.equal(result.version, "test-opencode")
      assert.equal(result.currentPhase, "00-control-plane")
      assert.equal(result.currentGate, "Runtime entry attachment and CLI recovery")
      assert.equal(result.recommendedCommands[0].startsWith("opencode attach"), true)
      assert.equal(result.metaArtifacts.healthStatus.endsWith(".md"), true)
    } finally {
      server.close()
      await rm(dir, { recursive: true, force: true })
    }
  })

  it("prefers hm-doctor recovery guidance when runtime state is damaged even if the server is healthy", async () => {
    const dir = await mkdtemp(join(tmpdir(), "hm-harness-damaged-state-"))
    const server = createServer((req, res) => {
      if (req.url === "/global/health") {
        res.writeHead(200, { "content-type": "application/json" })
        res.end(JSON.stringify({ healthy: true, version: "test-opencode" }))
        return
      }
      res.writeHead(404)
      res.end()
    })

    try {
      await initProject(dir, { presetId: "guided-onboarding", silent: true })
      await writeFile(join(dir, ".hivemind", "state", "trajectory-ledger.json"), "{not-json")
      await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()))
      const address = server.address()
      if (!address || typeof address === "string") {
        throw new Error("failed to bind test server")
      }

      const result = await runHarnessCommand(dir, {
        serverUrl: `http://127.0.0.1:${address.port}`,
      })

      const report = result.commandResult.report as { next_command?: string }

      assert.equal(result.healthy, true)
      assert.equal(result.commandResult.closeoutStatus, "blocked")
      assert.equal(report.next_command, "hm-doctor")
      assert.deepEqual(result.recommendedCommands, ["hm-doctor", "hm-harness", "opencode serve"])
    } finally {
      server.close()
      await rm(dir, { recursive: true, force: true })
    }
  })
})
