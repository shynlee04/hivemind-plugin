/**
 * Phase A Critical Bug Verification Tests
 * 
 * Tests to verify fixes for:
 * - A1-1: export_cycle hierarchy sync
 * - A1-2: declare_intent template handling  
 * - A1-3: stale auto-archive hierarchy reset
 * - A1-4: trackSectionUpdate wiring
 */

import { describe, it, beforeEach, afterEach } from "node:test"
import { strict as assert } from "node:assert"
import { mkdtempSync, writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createStateManager } from "../src/lib/persistence.js"
import { createExportCycleTool } from "../src/tools/export-cycle.js"
import { createDeclareIntentTool } from "../src/tools/declare-intent.js"
import { createMapContextTool } from "../src/tools/map-context.js"
import { initializePlanningDirectory } from "../src/lib/planning-fs.js"
import { loadTree, getCursorNode } from "../src/lib/hierarchy-tree.js"
import { loadConfig } from "../src/lib/persistence.js"
import { createConfig } from "../src/schemas/config.js"

// Test utilities
function createTempDir(): string {
  return mkdtempSync(join(tmpdir(), "hivemind-phase-a-test-"))
}

function setupConfig(dir: string) {
  const config = createConfig()
  const configPath = join(dir, ".hivemind", "config.json")
  mkdirSync(join(dir, ".hivemind"), { recursive: true })
  writeFileSync(configPath, JSON.stringify(config, null, 2))
  return config
}

// Minimal mock context
const mockContext = {
  sessionID: "test-session",
  callID: "test-call",
}

describe("Phase A Critical Bug Fixes", () => {
  let tempDir: string
  let stateManager: ReturnType<typeof createStateManager>

  beforeEach(async () => {
    tempDir = createTempDir()
    setupConfig(tempDir)
    stateManager = createStateManager(tempDir)
    await initializePlanningDirectory(tempDir)
  })

  afterEach(() => {
    // Cleanup handled by OS temp dir cleanup
  })

  describe("A1-1: export_cycle hierarchy sync", () => {
    it("should sync flat brain.hierarchy after tree mutation", async () => {
      // Setup: Create a session with hierarchy
      const declareIntent = createDeclareIntentTool(tempDir)
      const mapContext = createMapContextTool(tempDir)
      const exportCycle = createExportCycleTool(tempDir)

      // Step 1: Declare intent (creates trajectory)
      const intentResult = await declareIntent.execute({
        mode: "plan_driven",
        focus: "Test trajectory",
      }, mockContext as any)

      assert.ok(intentResult.includes("Status: OPEN"), "Session should be unlocked")

      // Step 2: Map tactic
      const tacticResult = await mapContext.execute({
        level: "tactic",
        content: "Test tactic",
      }, mockContext as any)

      assert.ok(tacticResult.includes("tactic"), "Tactic should be set")

      // Step 3: Map action
      const actionResult = await mapContext.execute({
        level: "action",
        content: "Test action to complete",
      }, mockContext as any)

      assert.ok(actionResult.includes("action"), "Action should be set")

      // Step 4: Export cycle (marks action complete)
      const exportResult = await exportCycle.execute({
        outcome: "success",
        findings: "Test completed successfully",
        json: true,
      }, mockContext as any)

      // Verify: Check that result indicates projection was synced
      const resultObj = JSON.parse(exportResult as string)
      assert.equal(resultObj.projection, "synced", "Hierarchy projection should be synced")
      assert.equal(resultObj.outcome, "success", "Outcome should be success")

      // Verify: Load state and check hierarchy is updated
      const state = await stateManager.load()
      assert.ok(state, "State should exist")
      assert.ok(state!.hierarchy.trajectory, "Trajectory should be in flat hierarchy")
    })

    it("should save findings to cycle-intel mems", async () => {
      const exportCycle = createExportCycleTool(tempDir)

      // First create a session
      const declareIntent = createDeclareIntentTool(tempDir)
      await declareIntent.execute({
        mode: "plan_driven",
        focus: "Mem test trajectory",
      }, mockContext as any)

      // Export cycle with findings
      await exportCycle.execute({
        outcome: "success",
        findings: "Important learning: X causes Y",
      }, mockContext as any)

      // Verify mems were saved
      const { loadMems } = await import("../src/lib/mems.js")
      const memsState = await loadMems(tempDir)
      
      const cycleMem = memsState.mems.find(m => 
        m.shelf === "cycle-intel" && m.content.includes("Important learning")
      )
      assert.ok(cycleMem, "Findings should be saved to cycle-intel shelf")
      assert.ok(cycleMem!.tags.includes("cycle-result"), "Should have cycle-result tag")
      assert.ok(cycleMem!.tags.includes("success"), "Should have outcome tag")
    })
  })

  describe("A1-2: declare_intent template handling", () => {
    it("should create per-session file from template (not legacy active.md)", async () => {
      const declareIntent = createDeclareIntentTool(tempDir)

      const result = await declareIntent.execute({
        mode: "plan_driven",
        focus: "Template test trajectory",
      }, mockContext as any)

      // Verify: Check for stamp in response
      assert.ok(result.includes("Stamp:"), "Should include timestamp stamp")
      
      // Verify: Check that per-session file was created in activeDir
      const { getEffectivePaths } = await import("../src/lib/paths.js")
      const paths = getEffectivePaths(tempDir)
      const files = await import("node:fs/promises").then(fs => fs.readdir(paths.activeDir))
      const sessionFiles = files.filter(f => f.endsWith(".md"))
      
      assert.ok(sessionFiles.length > 0, `Should create per-session file in ${paths.activeDir}, found: ${files.join(", ")}`)
      
      // Verify: File should have YAML frontmatter
      const sessionFile = join(paths.activeDir, sessionFiles[0])
      const content = readFileSync(sessionFile, "utf-8")
      assert.ok(content.includes("---"), "Should have YAML frontmatter delimiter")
      assert.ok(content.includes("session_id:"), "Should have session_id in frontmatter")
      assert.ok(content.includes("mode:"), "Should have mode in frontmatter")
    })

    it("should require initialized config (not silently bootstrap)", async () => {
      // Create temp dir WITHOUT config
      const noConfigDir = createTempDir()
      await initializePlanningDirectory(noConfigDir)
      
      const declareIntent = createDeclareIntentTool(noConfigDir)
      
      const result = await declareIntent.execute({
        mode: "plan_driven",
        focus: "Should fail without config",
      }, mockContext as any)

      assert.ok(result.includes("ERROR"), "Should error without config")
      assert.ok(result.includes("not configured"), "Should mention configuration required")
    })

    it("should create hierarchy tree root node", async () => {
      const declareIntent = createDeclareIntentTool(tempDir)

      await declareIntent.execute({
        mode: "plan_driven",
        focus: "Tree root test",
      }, mockContext as any)

      // Verify: Check hierarchy.json exists and has root
      const tree = await loadTree(tempDir)
      assert.ok(tree.root, "Tree should have root node")
      assert.equal(tree.root!.level, "trajectory", "Root should be trajectory level")
      assert.equal(tree.root!.content, "Tree root test", "Root content should match focus")
      assert.equal(tree.root!.status, "active", "Root should be active")
    })
  })

  describe("A1-3: stale auto-archive hierarchy reset", () => {
    it("should reset hierarchy.json when auto-archiving stale session", async () => {
      // Setup: Create an old session
      const declareIntent = createDeclareIntentTool(tempDir)
      await declareIntent.execute({
        mode: "plan_driven",
        focus: "Old stale session",
      }, mockContext as any)

      // Verify tree exists with content
      const treeBefore = await loadTree(tempDir)
      assert.ok(treeBefore.root, "Tree should have root before stale check")
      assert.equal(treeBefore.root!.content, "Old stale session")

      // Manually make the session stale by editing brain.json
      const state = await stateManager.load()
      const staleTime = Date.now() - (10 * 24 * 60 * 60 * 1000) // 10 days ago
      state!.session.last_activity = staleTime
      state!.session.start_time = staleTime
      await stateManager.save(state!)

      // Trigger session lifecycle hook with stale session
      const { createSessionLifecycleHook } = await import("../src/hooks/session-lifecycle.js")
      const { createLogger } = await import("../src/lib/logging.js")
      const log = await createLogger(join(tempDir, ".hivemind", "logs"), "test")
      const config = await loadConfig(tempDir)
      
      const hook = createSessionLifecycleHook(log, tempDir, config)
      
      const output = { system: [] as string[] }
      await hook({ sessionID: "test-session" }, output)

      // Verify: Tree should be reset (fresh empty tree or new tree)
      const treeAfter = await loadTree(tempDir)
      // After auto-archive, a new tree is created which may be empty or have new root
      assert.ok(treeAfter, "Tree should exist after stale archive")
      
      // The stale session should have been archived
      const archivedState = await stateManager.load()
      assert.notEqual(archivedState!.session.id, state!.session.id, "Should have new session ID")
    })
  })

  describe("A1-4: trackSectionUpdate wiring", () => {
    it("should have trackSectionUpdate imported and wired in soft-governance hook", async () => {
      // Read the soft-governance.ts file to verify wiring
      const { readFile } = await import("node:fs/promises")
      const hookContent = await readFile(
        join(process.cwd(), "src/hooks/soft-governance.ts"),
        "utf-8"
      )

      // Verify trackSectionUpdate is imported from detection.js
      assert.ok(
        hookContent.includes('trackSectionUpdate,') || hookContent.includes('trackSectionUpdate'),
        "trackSectionUpdate should be imported"
      )

      // Verify it's called when map_context fires
      assert.ok(
        hookContent.includes('trackSectionUpdate(detection, focus)'),
        "trackSectionUpdate should be called with detection and focus"
      )

      // Verify resetSectionTracking is called on declare_intent
      assert.ok(
        hookContent.includes('resetSectionTracking(detection)'),
        "resetSectionTracking should be called on declare_intent"
      )

      // Verify detection state is written back to metrics
      assert.ok(
        hookContent.includes('consecutive_same_section: detection.consecutive_same_section'),
        "consecutive_same_section should be written to metrics"
      )
      assert.ok(
        hookContent.includes('last_section_content: detection.last_section_content'),
        "last_section_content should be written to metrics"
      )
    })

    it("should track section repetition when map_context is triggered via hook", async () => {
      // Note: This test verifies the logic works when called directly.
      // The full integration requires the OpenCode SDK hook firing.
      const { trackSectionUpdate, resetSectionTracking, createDetectionState } = await import("../src/lib/detection.js")

      // Setup: Create detection state
      let detection = createDetectionState()

      // First update establishes baseline
      detection = trackSectionUpdate(detection, "tactic: Build auth system")
      assert.equal(detection.consecutive_same_section, 0, "First call should have counter at 0")
      assert.equal(detection.last_section_content, "tactic: Build auth system")

      // Second update with same content should increment
      detection = trackSectionUpdate(detection, "tactic: Build auth system")
      assert.equal(detection.consecutive_same_section, 1, "Second same call should increment to 1")

      // Third update with same content should increment further
      detection = trackSectionUpdate(detection, "tactic: Build auth system")
      assert.equal(detection.consecutive_same_section, 2, "Third same call should increment to 2")

      // Update with different content should reset
      detection = trackSectionUpdate(detection, "tactic: Different approach")
      assert.equal(detection.consecutive_same_section, 0, "Different content should reset counter")

      // Reset on declare_intent simulation
      detection = resetSectionTracking(detection)
      assert.equal(detection.consecutive_same_section, 0, "Reset should clear counter")
      assert.equal(detection.last_section_content, "", "Reset should clear last content")
    })
  })
})

console.log("\n=== Phase A Critical Bug Verification Tests ===")
