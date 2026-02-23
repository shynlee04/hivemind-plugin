/**
 * Cycle4 Path-1 TDD - Blocker 1: Session-ID Parity Drift
 * 
 * Problem: state/tasks.json uses non-UUID session IDs (ses_...) while graph requires UUID
 * Fix: Normalize session IDs at write boundary, add canonical resolver
 * 
 * RED: These tests should FAIL until fix is implemented
 */

import { randomUUID } from "crypto"
import { existsSync } from "fs"
import { mkdir, rm, writeFile } from "fs/promises"
import { tmpdir } from "os"
import { join } from "path"
import { describe, it, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"

import { getEffectivePaths } from "../src/lib/paths.js"
import { addGraphMem, loadGraphMems } from "../src/lib/graph-io.js"
import type { MemNode } from "../src/schemas/graph-nodes.js"

// Import functions that will be implemented
import {
  normalizeSessionIdToUuid,
  resolveCanonicalSessionId,
} from "../src/lib/graph-io.js"

describe("Cycle4 Blocker 1: Session-ID Parity", () => {
  let testDir: string

  beforeEach(async () => {
    testDir = join(tmpdir(), `hivemind-test-${randomUUID()}`)
    await mkdir(testDir, { recursive: true })
    const paths = getEffectivePaths(testDir)
    await mkdir(paths.root, { recursive: true })
    await mkdir(paths.graphDir, { recursive: true })
  })

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true })
  })

  describe("normalizeSessionIdToUuid", () => {
    it("should return valid UUID if input is already UUID", () => {
      const validUuid = randomUUID()
      const result = normalizeSessionIdToUuid(validUuid)
      assert.strictEqual(result, validUuid)
    })

    it("should convert ses_ prefixed ID to deterministic UUID", () => {
      const sesId = "ses_abc123def456"
      const result = normalizeSessionIdToUuid(sesId)
      // Should produce a valid UUID v5 (version 5 = position 14 has '5')
      assert.match(result, /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    })

    it("should produce same UUID for same ses_ ID (deterministic)", () => {
      const sesId = "ses_xyz789"
      const result1 = normalizeSessionIdToUuid(sesId)
      const result2 = normalizeSessionIdToUuid(sesId)
      assert.strictEqual(result1, result2)
    })

    it("should produce different UUID for different ses_ IDs", () => {
      const sesId1 = "ses_first"
      const sesId2 = "ses_second"
      const result1 = normalizeSessionIdToUuid(sesId1)
      const result2 = normalizeSessionIdToUuid(sesId2)
      assert.notStrictEqual(result1, result2)
    })

    it("should handle unknown format by generating stable UUID", () => {
      const unknownId = "custom-format-123"
      const result = normalizeSessionIdToUuid(unknownId)
      // UUID v5 format (version 5 at position 14)
      assert.match(result, /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    })
  })

  describe("resolveCanonicalSessionId", () => {
    it("should resolve session_id from trajectory.json", async () => {
      const paths = getEffectivePaths(testDir)
      const validUuid = randomUUID()
      
      // Create trajectory.json with valid UUID session_id
      await writeFile(
        paths.graphTrajectory,
        JSON.stringify({
          version: "1.0.0",
          trajectory: {
            id: validUuid,
            session_id: validUuid,
            active_plan_id: null,
            active_phase_id: null,
            active_task_ids: [],
            intent: "test",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        }, null, 2)
      )

      const result = await resolveCanonicalSessionId(testDir, "ses_123")
      assert.strictEqual(result, validUuid)
    })

    it("should fallback to normalized UUID if trajectory missing", async () => {
      const result = await resolveCanonicalSessionId(testDir, "ses_456")
      // UUID v5 format (version 5 at position 14)
      assert.match(result, /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    })
  })

  describe("MemNode session_id FK validation", () => {
    it("should accept MemNode with valid UUID session_id", async () => {
      const paths = getEffectivePaths(testDir)
      const validSessionId = randomUUID()
      
      // Create trajectory with session_id
      await writeFile(
        paths.graphTrajectory,
        JSON.stringify({
          version: "1.0.0",
          trajectory: {
            id: validSessionId,
            session_id: validSessionId,
            active_plan_id: null,
            active_phase_id: null,
            active_task_ids: [],
            intent: "test",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        }, null, 2)
      )

      const mem: MemNode = {
        id: randomUUID(),
        session_id: validSessionId,
        origin_task_id: null,
        shelf: "test",
        type: "insight",
        content: "test content",
        relevance_score: 0.9,
        staleness_stamp: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const addedId = await addGraphMem(testDir, mem)
      assert.strictEqual(addedId, mem.id)
    })

    it("should reject MemNode with non-UUID session_id", async () => {
      const mem = {
        id: randomUUID(),
        session_id: "ses_123", // Non-UUID - should fail Zod validation
        origin_task_id: null,
        shelf: "test",
        type: "insight",
        content: "test content",
        relevance_score: 0.9,
        staleness_stamp: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as unknown as MemNode

      // Zod should reject this
      await assert.rejects(
        async () => addGraphMem(testDir, mem),
        /uuid/i
      )
    })
  })
})
