import { describe, it } from "node:test"
import assert from "node:assert/strict"

import { isMemStale, type TTSConfig } from "../src/lib/staleness.js"
import type { MemNode } from "../src/schemas/graph-nodes.js"

const NOW = "2026-02-19T12:00:00.000Z"
const ACTIVE_SESSION_ID = "11111111-1111-4111-8111-111111111111"
const OTHER_SESSION_ID = "22222222-2222-4222-8222-222222222222"
const ACTIVE_TASK_ID = "33333333-3333-4333-8333-333333333333"
const INACTIVE_TASK_ID = "44444444-4444-4444-8444-444444444444"

function makeMem(overrides: Partial<MemNode> = {}): MemNode {
  return {
    id: "55555555-5555-4555-8555-555555555555",
    session_id: ACTIVE_SESSION_ID,
    origin_task_id: null,
    shelf: "test",
    type: "insight",
    content: "relational staleness test",
    relevance_score: 0.5,
    staleness_stamp: "2026-02-18T12:00:00.000Z",
    created_at: "2026-02-17T12:00:00.000Z",
    updated_at: "2026-02-18T12:00:00.000Z",
    ...overrides,
  }
}

describe("Relational staleness semantics (Phase 4.5 RED)", () => {
  it("AC1: cross-session mem should not be marked stale by timestamp", () => {
    const mem = makeMem({
      session_id: OTHER_SESSION_ID,
      staleness_stamp: "2020-01-01T00:00:00.000Z",
    })

    const stale = isMemStale(mem, [], { now: NOW, activeSessionId: ACTIVE_SESSION_ID })

    assert.equal(
      stale,
      false,
      "cross-session mem must remain fresh even when timestamp is old",
    )
  })

  it("AC2: same-session but inactive branch/task should be stale by lineage scope", () => {
    const mem = makeMem({
      session_id: ACTIVE_SESSION_ID,
      origin_task_id: INACTIVE_TASK_ID,
      staleness_stamp: "2099-01-01T00:00:00.000Z",
    })

    const stale = isMemStale(mem, [ACTIVE_TASK_ID], { now: NOW })

    assert.equal(
      stale,
      true,
      "inactive same-session lineage should be stale even if timestamp is in future",
    )
  })

  it("AC3: active task linkage should force fresh", () => {
    const mem = makeMem({
      origin_task_id: ACTIVE_TASK_ID,
      staleness_stamp: "2020-01-01T00:00:00.000Z",
    })

    const stale = isMemStale(mem, [ACTIVE_TASK_ID], { now: NOW })

    assert.equal(stale, false)
  })

  it("AC4: timestamp is tie-breaker only for same-lineage and no-linkage contexts", () => {
    const staleMem = makeMem({
      session_id: ACTIVE_SESSION_ID,
      origin_task_id: null,
      staleness_stamp: "2020-01-01T00:00:00.000Z",
    })
    const freshMem = makeMem({
      id: "66666666-6666-4666-8666-666666666666",
      session_id: ACTIVE_SESSION_ID,
      origin_task_id: null,
      staleness_stamp: "2099-01-01T00:00:00.000Z",
    })

    assert.equal(isMemStale(staleMem, [], { now: NOW }), true)
    assert.equal(isMemStale(freshMem, [], { now: NOW }), false)
  })

  it("AC5: semantic flags (false_path/user_discarded/superseded) win over timestamp", () => {
    const falsePathMem = makeMem({
      type: "false_path",
      staleness_stamp: "2099-01-01T00:00:00.000Z",
    })

    const userDiscardedMem = {
      ...makeMem({
        id: "77777777-7777-4777-8777-777777777777",
        staleness_stamp: "2099-01-01T00:00:00.000Z",
      }),
      user_discarded: true,
    } as MemNode

    const supersededMem = {
      ...makeMem({
        id: "88888888-8888-4888-8888-888888888888",
        staleness_stamp: "2099-01-01T00:00:00.000Z",
      }),
      superseded: true,
    } as MemNode

    assert.equal(isMemStale(falsePathMem, [], { now: NOW }), true)
    assert.equal(isMemStale(userDiscardedMem, [], { now: NOW }), true)
    assert.equal(isMemStale(supersededMem, [], { now: NOW }), true)
  })

  it("AC6: cross-session timestamps are informational only", () => {
    const mem = makeMem({
      session_id: OTHER_SESSION_ID,
      staleness_stamp: "1990-01-01T00:00:00.000Z",
    })

    const cfg = {
      now: NOW,
      activeSessionId: ACTIVE_SESSION_ID,
    } as TTSConfig

    const stale = isMemStale(mem, [], cfg)

    assert.equal(stale, false, "cross-session timestamp should not drive staleness")
  })
})
