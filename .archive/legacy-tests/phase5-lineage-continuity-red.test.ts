import { describe, it, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, rm, mkdir, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { tmpdir } from "node:os"

import { initProject } from "../src/cli/init.js"
import { getEffectivePaths } from "../src/lib/paths.js"
import { loadGraphMems, loadGraphTasks } from "../src/lib/graph-io.js"

const GRAPH_VERSION = "1.0.0"

const IDS = {
  trajectory: "11111111-1111-4111-8111-111111111111",
  session: "22222222-2222-4222-8222-222222222222",
  project: "33333333-3333-4333-8333-333333333333",
  milestone: "44444444-4444-4444-8444-444444444444",
  phase: "55555555-5555-4555-8555-555555555555",
  plan: "66666666-6666-4666-8666-666666666666",
  missingPlan: "77777777-7777-4777-8777-777777777777",
  task: "88888888-8888-4888-8888-888888888888",
  verification: "99999999-9999-4999-8999-999999999999",
  mem: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
} as const

function nowIso(): string {
  return new Date().toISOString()
}

async function writeJson(filePath: string, data: unknown): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true })
  await writeFile(filePath, JSON.stringify(data, null, 2))
}

describe("Phase 5 RED: explicit project/milestone/verification lineage continuity", () => {
  let dir: string

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "hm-phase5-lineage-red-"))
    await initProject(dir, { governanceMode: "assisted", language: "en", silent: true })
  })

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  it("RED: loadGraphTasks should quarantine tasks when project->milestone->phase->plan lineage is broken", async () => {
    const paths = getEffectivePaths(dir)
    const ts = nowIso()

    await writeJson(paths.graphTrajectory, {
      version: GRAPH_VERSION,
      trajectory: {
        id: IDS.trajectory,
        session_id: IDS.session,
        active_plan_id: IDS.plan,
        active_phase_id: IDS.phase,
        active_task_ids: [IDS.task],
        intent: "phase5 lineage red",
        created_at: ts,
        updated_at: ts,
      },
    })

    await writeJson(paths.graphPlans, {
      version: GRAPH_VERSION,
      plans: [
        {
          id: IDS.plan,
          trajectory_id: IDS.trajectory,
          title: "Plan A",
          status: "active",
          created_at: ts,
          updated_at: ts,
          project_id: IDS.project,
          milestone_id: IDS.milestone,
          phases: [{ id: IDS.phase }],
        },
      ],
    })

    await writeJson(paths.graphTasks, {
      version: GRAPH_VERSION,
      tasks: [
        {
          id: IDS.task,
          parent_phase_id: IDS.phase,
          title: "Task with unresolved plan lineage",
          status: "pending",
          file_locks: [],
          created_at: ts,
          updated_at: ts,
          plan_id: IDS.missingPlan,
          milestone_id: IDS.milestone,
          project_id: IDS.project,
        },
      ],
    })

    const tasks = await loadGraphTasks(dir, { enabled: true })

    assert.equal(
      tasks.tasks.length,
      0,
      "RED expected: task should be quarantined when plan/milestone/project lineage is unresolved; current FK validation only checks parent_phase_id",
    )
  })

  it("RED: loadGraphMems should quarantine verification evidence without explicit verification FK continuity", async () => {
    const paths = getEffectivePaths(dir)
    const ts = nowIso()

    await writeJson(paths.graphTrajectory, {
      version: GRAPH_VERSION,
      trajectory: {
        id: IDS.trajectory,
        session_id: IDS.session,
        active_plan_id: IDS.plan,
        active_phase_id: IDS.phase,
        active_task_ids: [IDS.task],
        intent: "phase5 verification red",
        created_at: ts,
        updated_at: ts,
      },
    })

    await writeJson(paths.graphTasks, {
      version: GRAPH_VERSION,
      tasks: [
        {
          id: IDS.task,
          parent_phase_id: IDS.phase,
          title: "Task with verification evidence",
          status: "pending",
          file_locks: [],
          created_at: ts,
          updated_at: ts,
        },
      ],
    })

    await writeJson(paths.graphMems, {
      version: GRAPH_VERSION,
      mems: [
        {
          id: IDS.mem,
          session_id: IDS.task,
          origin_task_id: IDS.task,
          shelf: "verification",
          type: "insight",
          content: "verification artifact",
          relevance_score: 0.9,
          staleness_stamp: ts,
          created_at: ts,
          updated_at: ts,
          verification_id: IDS.verification,
        },
      ],
    })

    const mems = await loadGraphMems(dir, { enabled: true })

    assert.equal(
      mems.mems.length,
      0,
      "RED expected: verification evidence should require explicit verification node FK continuity; current FK validation only checks origin_task_id/session_id",
    )
  })
})
