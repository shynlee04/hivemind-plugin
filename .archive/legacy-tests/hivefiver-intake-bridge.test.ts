import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { describe, it } from "node:test"
import { join } from "node:path"

import {
  buildHiveFiverDiscoveryProfile,
  classifyHiveFiverIntent,
  routeHiveFiverStage,
} from "../src/lib/hivefiver-intake.js"

function runScript(scriptPath: string, text: string): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn("bash", [scriptPath, text], {
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"],
    })

    let stdout = ""
    let stderr = ""

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk)
    })
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk)
    })
    child.on("close", (code) => {
      resolve({ code, stdout, stderr })
    })
  })
}

describe("hivefiver intake bridge", () => {
  it("classifies broken-system requests toward doctor flow", () => {
    const result = classifyHiveFiverIntent("fix broken governance hook regression")
    assert.equal(result.intent, "fix_broken")
    assert.equal(result.next_command, "/hivefiver-doctor")
    assert.equal(result.pipeline_id, "doctor_fix")
    assert.notEqual(result.confidence, "none")
  })

  it("builds a guided-discovery profile without creating runtime authority", () => {
    const profile = buildHiveFiverDiscoveryProfile("Toi muon lam plugin opencode voi schema va hook")
    assert.equal(profile.language, "bilingual")
    assert.match(profile.maturity, /^L[1-3]$/)
    assert.match(profile.guidance, /^(high|medium|low)$/)
  })

  it("routes explicit hivefiver stages without shell-only logic", () => {
    const result = routeHiveFiverStage("audit")
    assert.equal(result.route_type, "explicit")
    assert.equal(result.next_command, "/hivefiver-audit")
  })

  it("bridges classify-intent.sh to canonical src-owned logic", async () => {
    const scriptPath = join(process.cwd(), ".opencode", "skills", "hivefiver-mode", "scripts", "classify-intent.sh")
    const result = await runScript(scriptPath, "fix broken audit pipeline")
    assert.equal(result.code, 0)
    const parsed = JSON.parse(result.stdout)
    assert.equal(parsed.intent, "fix_broken")
    assert.equal(parsed.next_command, "/hivefiver-doctor")
  })

  it("bridges guided-discovery.sh to canonical src-owned logic", async () => {
    const scriptPath = join(process.cwd(), ".opencode", "skills", "hivefiver-mode", "scripts", "guided-discovery.sh")
    const result = await runScript(scriptPath, "what is hivefiver and how do i start")
    assert.equal(result.code, 0)
    const parsed = JSON.parse(result.stdout)
    assert.equal(typeof parsed.guidance, "string")
    assert.equal(typeof parsed.language, "string")
  })

  it("bridges route-stage.sh to canonical src-owned logic", async () => {
    const scriptPath = join(process.cwd(), ".opencode", "skills", "hivefiver-mode", "scripts", "route-stage.sh")
    const result = await runScript(scriptPath, "stabilize the failing governance pipeline")
    assert.equal(result.code, 0)
    const parsed = JSON.parse(result.stdout)
    assert.equal(parsed.route_type, "intent")
    assert.equal(parsed.next_command, "/hivefiver-doctor")
  })
})
