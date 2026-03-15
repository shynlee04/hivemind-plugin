import { describe, it } from "node:test";
import assert from "node:assert";

import {
  DelegationNodeSchema,
  MilestoneNodeSchema,
  ProjectNodeSchema,
  SessionNodeSchema,
  SubtaskNodeSchema,
  TaskNodeSchema,
  TrajectoryExportSchema,
  UnifiedStatusSchema,
  VerificationNodeSchema,
} from "../../src/schemas/graph-nodes.js";
import {
  DelegationsStateSchema,
  MilestonesStateSchema,
  ProjectsStateSchema,
  SessionsStateSchema,
  SubtasksStateSchema,
  TrajectoryExportsStateSchema,
  VerificationsStateSchema,
} from "../../src/schemas/graph-state.js";

const NOW = "2026-02-25T07:00:00.000Z";
const PROJECT_ID = "11111111-1111-4111-8111-111111111111";
const MILESTONE_ID = "22222222-2222-4222-8222-222222222222";
const PLAN_ID = "33333333-3333-4333-8333-333333333333";
const PHASE_ID = "44444444-4444-4444-8444-444444444444";
const TASK_ID = "55555555-5555-4555-8555-555555555555";
const SUBTASK_ID = "66666666-6666-4666-8666-666666666666";
const SESSION_ID = "77777777-7777-4777-8777-777777777777";
const DELEGATION_ID = "88888888-8888-4888-8888-888888888888";
const TRAJECTORY_ID = "99999999-9999-4999-8999-999999999999";
const EXPORT_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const VERIFICATION_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

function makeValidProject(overrides: Record<string, unknown> = {}) {
  return {
    id: PROJECT_ID,
    title: "Co-Design Sprint",
    description: "Unified node schema rollout",
    status: "active",
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

function makeValidMilestone(overrides: Record<string, unknown> = {}) {
  return {
    id: MILESTONE_ID,
    project_id: PROJECT_ID,
    title: "Schema Sprint",
    description: "Deliver relational schema layer",
    status: "in_progress",
    order: 0,
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

function makeValidTask(overrides: Record<string, unknown> = {}) {
  return {
    id: TASK_ID,
    parent_phase_id: PHASE_ID,
    title: "Implement graph schemas",
    status: "in_progress",
    file_locks: ["src/schemas/graph-nodes.ts"],
    created_at: NOW,
    updated_at: NOW,
    plan_id: PLAN_ID,
    milestone_id: MILESTONE_ID,
    project_id: PROJECT_ID,
    ...overrides,
  };
}

function makeValidSubtask(overrides: Record<string, unknown> = {}) {
  return {
    id: SUBTASK_ID,
    task_id: TASK_ID,
    session_id: SESSION_ID,
    type: "execution",
    title: "Add schema definitions",
    status: "active",
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

function makeValidSession(overrides: Record<string, unknown> = {}) {
  return {
    id: SESSION_ID,
    mode: "plan_driven",
    status: "active",
    parent_session_id: null,
    trajectory_id: TRAJECTORY_ID,
    compaction_count: 2,
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

function makeValidDelegation(overrides: Record<string, unknown> = {}) {
  return {
    id: DELEGATION_ID,
    session_id: SESSION_ID,
    task_id: TASK_ID,
    agent_type: "build",
    level: "worker",
    status: "complete",
    outcome: "success",
    findings: "Implemented schema set",
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

function makeValidExport(overrides: Record<string, unknown> = {}) {
  return {
    id: EXPORT_ID,
    session_id: SESSION_ID,
    trajectory_id: TRAJECTORY_ID,
    task_ids: [TASK_ID],
    summary: "Schema sprint completed",
    decisions: ["Use unified status enum"],
    anchors_snapshot: [{ key: "sprint", value: "co-design" }],
    created_at: NOW,
    ...overrides,
  };
}

function makeValidVerification(overrides: Record<string, unknown> = {}) {
  return {
    id: VERIFICATION_ID,
    task_id: TASK_ID,
    plan_id: PLAN_ID,
    type: "test",
    status: "pass",
    evidence: "All tests passing",
    command: "npm test",
    output_excerpt: "ok",
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

describe("co-design sprint schemas", () => {
  it("UnifiedStatusSchema accepts all values and rejects invalid strings", () => {
    const validValues = [
      "pending",
      "in_progress",
      "active",
      "complete",
      "blocked",
      "invalidated",
      "cancelled",
    ];

    for (const value of validValues) {
      const result = UnifiedStatusSchema.safeParse(value);
      assert.equal(result.success, true);
    }

    assert.equal(UnifiedStatusSchema.safeParse("done").success, false);
  });

  it("ProjectNodeSchema validates required fields", () => {
    assert.equal(ProjectNodeSchema.safeParse(makeValidProject()).success, true);
    assert.equal(ProjectNodeSchema.safeParse(makeValidProject({ title: "" })).success, false);
    assert.equal(ProjectNodeSchema.safeParse(makeValidProject({ id: undefined })).success, false);
  });

  it("MilestoneNodeSchema requires project_id and non-negative order", () => {
    assert.equal(MilestoneNodeSchema.safeParse(makeValidMilestone()).success, true);
    assert.equal(
      MilestoneNodeSchema.safeParse(makeValidMilestone({ project_id: undefined })).success,
      false
    );
    assert.equal(MilestoneNodeSchema.safeParse(makeValidMilestone({ order: -1 })).success, false);
  });

  it("TaskNodeSchema remains backward compatible and supports new optional fields", () => {
    const legacyTask = {
      id: TASK_ID,
      parent_phase_id: PHASE_ID,
      title: "Legacy task payload",
      status: "complete",
      file_locks: [],
      created_at: NOW,
      updated_at: NOW,
    };

    assert.equal(TaskNodeSchema.safeParse(legacyTask).success, true);
    assert.equal(
      TaskNodeSchema.safeParse(
        makeValidTask({
          classification: "feature",
          description: "Detailed task brief",
          acceptance_criteria: ["schema compiles", "tests pass"],
          dependencies: [MILESTONE_ID],
          priority: "high",
        })
      ).success,
      true
    );
    assert.equal(TaskNodeSchema.safeParse(makeValidTask({ classification: "invalid" })).success, false);
  });

  it("Graph-state containers parse new node collections", () => {
    assert.equal(
      ProjectsStateSchema.safeParse({
        version: "1.0.0",
        projects: [makeValidProject()],
      }).success,
      true
    );
    assert.equal(
      MilestonesStateSchema.safeParse({
        version: "1.0.0",
        milestones: [makeValidMilestone()],
      }).success,
      true
    );
    assert.equal(
      SubtasksStateSchema.safeParse({
        version: "1.0.0",
        subtasks: [makeValidSubtask()],
      }).success,
      true
    );
    assert.equal(
      SessionsStateSchema.safeParse({
        version: "1.0.0",
        sessions: [makeValidSession()],
      }).success,
      true
    );
    assert.equal(
      DelegationsStateSchema.safeParse({
        version: "1.0.0",
        delegations: [makeValidDelegation()],
      }).success,
      true
    );
    assert.equal(
      TrajectoryExportsStateSchema.safeParse({
        version: "1.0.0",
        exports: [makeValidExport()],
      }).success,
      true
    );
    assert.equal(
      VerificationsStateSchema.safeParse({
        version: "1.0.0",
        verifications: [makeValidVerification()],
      }).success,
      true
    );
  });

  it("SubtaskNodeSchema validates types and required FKs", () => {
    assert.equal(SubtaskNodeSchema.safeParse(makeValidSubtask()).success, true);

    const validTypes = [
      "discussion",
      "research",
      "investigation",
      "validation",
      "execution",
      "review",
      "loop",
      "gatekeeping",
    ];

    for (const type of validTypes) {
      assert.equal(SubtaskNodeSchema.safeParse(makeValidSubtask({ type })).success, true);
    }

    assert.equal(SubtaskNodeSchema.safeParse(makeValidSubtask({ type: "handoff" })).success, false);
    assert.equal(SubtaskNodeSchema.safeParse(makeValidSubtask({ task_id: undefined })).success, false);
  });

  it("SessionNodeSchema handles optional parent and default compaction_count", () => {
    assert.equal(SessionNodeSchema.safeParse(makeValidSession()).success, true);
    assert.equal(SessionNodeSchema.safeParse(makeValidSession({ parent_session_id: undefined })).success, true);

    const parsed = SessionNodeSchema.parse(
      makeValidSession({
        compaction_count: undefined,
      })
    );

    assert.equal(parsed.compaction_count, 0);
  });

  it("DelegationNodeSchema validates level enum and nullable outcome", () => {
    assert.equal(DelegationNodeSchema.safeParse(makeValidDelegation()).success, true);
    assert.equal(DelegationNodeSchema.safeParse(makeValidDelegation({ outcome: null })).success, true);

    const levels = ["orchestrator", "specialist", "worker"];
    for (const level of levels) {
      assert.equal(DelegationNodeSchema.safeParse(makeValidDelegation({ level })).success, true);
    }
  });

  it("TrajectoryExportSchema applies defaults for arrays", () => {
    const result = TrajectoryExportSchema.parse(
      makeValidExport({
        task_ids: undefined,
        decisions: undefined,
        anchors_snapshot: undefined,
      })
    );

    assert.deepEqual(result.task_ids, []);
    assert.deepEqual(result.decisions, []);
    assert.deepEqual(result.anchors_snapshot, []);
  });

  it("VerificationNodeSchema validates type/status enums and optional evidence", () => {
    assert.equal(VerificationNodeSchema.safeParse(makeValidVerification()).success, true);

    const types = ["test", "type_check", "lint", "manual", "code_review", "integration"];
    for (const type of types) {
      assert.equal(VerificationNodeSchema.safeParse(makeValidVerification({ type })).success, true);
    }

    const statuses = ["pending", "pass", "fail", "skipped"];
    for (const status of statuses) {
      assert.equal(VerificationNodeSchema.safeParse(makeValidVerification({ status })).success, true);
    }

    assert.equal(
      VerificationNodeSchema.safeParse(
        makeValidVerification({
          evidence: undefined,
          command: undefined,
          output_excerpt: undefined,
        })
      ).success,
      true
    );
  });
});
