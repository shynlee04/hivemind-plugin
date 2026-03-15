import { describe, it, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { tmpdir } from "node:os"

import { initProject } from "../../src/cli/init.js"
import { buildLifecycleLineageSnapshot } from "../../src/lib/graph-io.js"
import { getEffectivePaths } from "../../src/lib/paths.js"

const GRAPH_VERSION = "1.0.0"

const IDS = {
  trajectory: "10111111-1111-4111-8111-111111111111",
  session: "20222222-2222-4222-8222-222222222222",
  project: "30333333-3333-4333-8333-333333333333",
  milestone: "40444444-4444-4444-8444-444444444444",
  phase: "50555555-5555-4555-8555-555555555555",
  plan: "60666666-6666-4666-8666-666666666666",
  task: "70777777-7777-4777-8777-777777777777",
  verification: "80888888-8888-4888-8888-888888888888",
  mem: "90999999-9999-4999-8999-999999999999",
} as const

function nowIso(): string {
  return new Date().toISOString()
}

async function writeJson(filePath: string, data: unknown): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true })
  await writeFile(filePath, JSON.stringify(data, null, 2))
}

describe("RED: lifecycle lineage snapshot explicit chain presence", () => {
  let dir: string

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "hm-lineage-snapshot-red-"))
    await initProject(dir, { governanceMode: "assisted", language: "en", silent: true })
  })

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  it("RED: snapshot exposes complete project->milestone->phase->plan->task->verification presence chain", async () => {
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
        intent: "lineage snapshot red",
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
          title: "Plan for lineage snapshot",
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
          title: "Task with full lineage",
          status: "pending",
          file_locks: [],
          created_at: ts,
          updated_at: ts,
          plan_id: IDS.plan,
          project_id: IDS.project,
          milestone_id: IDS.milestone,
        },
      ],
    })

    await writeJson(paths.graphMems, {
      version: GRAPH_VERSION,
      mems: [
        {
          id: IDS.mem,
          session_id: IDS.session,
          origin_task_id: IDS.task,
          shelf: "verification",
          type: "insight",
          content: "verification evidence",
          relevance_score: 0.9,
          staleness_stamp: ts,
          created_at: ts,
          updated_at: ts,
          verification_id: IDS.verification,
        },
      ],
    })

    const snapshot = await buildLifecycleLineageSnapshot(dir)
    const chainPresence = (snapshot as unknown as { chain_presence?: Record<string, unknown> }).chain_presence

    assert.deepEqual(
      chainPresence,
      {
        project: true,
        milestone: true,
        phase: true,
        plan: true,
        task: true,
        verification: true,
      },
      "RED expected: lifecycle snapshot should expose explicit chain_presence booleans for project->milestone->phase->plan->task->verification",
    )
  })
})
