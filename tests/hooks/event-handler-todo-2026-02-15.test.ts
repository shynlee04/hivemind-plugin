import { describe, it, before, after } from "node:test";
import { strict as assert } from "node:assert";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createEventHandler } from "../../src/hooks/event-handler.js";
import { getEffectivePaths } from "../../src/lib/paths.js";
import type { Logger } from "../../src/lib/logging.js";
import { clearMutationQueue, flushTaskManifestMutations } from "../../src/lib/state-mutation-queue.js";

const noopLogger: Logger = {
  info: async () => {},
  warn: async () => {},
  error: async () => {},
  debug: async () => {},
};

describe("US-004: Event Handler - todo.updated", () => {
  let tempDir: string;

  before(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "hivemind-test-us004-"));
    clearMutationQueue();
  });

  after(async () => {
    clearMutationQueue();
    await rm(tempDir, { recursive: true, force: true });
  });

  it("should create tasks.json when todo.updated event is received with valid data", async () => {
    const handler = createEventHandler(noopLogger, tempDir);
    const sessionID = "test-session-123";
    const todos = [
      { id: "1", content: "Task 1", status: "pending", priority: "high" },
      { id: "2", content: "Task 2", status: "completed", priority: "medium" },
    ];

    const event = {
      type: "todo.updated",
      properties: {
        sessionID,
        todos,
      },
    };

    // Cast event to any because we are mocking the event structure
    await handler({ event: event as any });
    await flushTaskManifestMutations();

    const tasksPath = getEffectivePaths(tempDir).tasks;

    // Check if file exists
    try {
        const content = await readFile(tasksPath, "utf-8");
        const parsed = JSON.parse(content);

        assert.equal(parsed.session_id, sessionID);
        assert.equal(parsed.tasks.length, 2);
        assert.equal(parsed.tasks[0].id, "1");
        assert.equal(parsed.tasks[0].text, "Task 1");
        assert.equal(parsed.tasks[0].content, "Task 1");
        assert.equal(parsed.tasks[0].status, "pending");
        assert.equal(parsed.tasks[0].priority, "high");
        assert.equal(parsed.tasks[0].hivefiver_action, "init");
        assert.equal(parsed.tasks[0].max_validation_attempts, 10);
        assert.equal(parsed.tasks[0].evidence_confidence, "partial");
        assert.equal(parsed.tasks[0].auto_initiate, true);
        assert.equal(parsed.tasks[0].requires_permission, false);
        assert.equal(Array.isArray(parsed.tasks[0].next_step_menu), true);
        assert.ok(parsed.tasks[0].next_step_menu.length > 0);
        assert.equal(typeof parsed.tasks[0].related_entities.workflow_id, "string");
        assert.equal(parsed.tasks[1].text, "Task 2");
        assert.equal(parsed.tasks[1].status, "completed");
        assert.ok(parsed.updated_at > 0);
        assert.ok(parsed.tasks[0].updated_at > 0);
    } catch (err) {
        assert.fail(`Failed to read tasks.json: ${err}`);
    }
  });

  it("should NOT create tasks.json if todos are missing", async () => {
    // Ensure file doesn't exist or we can track modification
    // Let's use a new temp dir or just delete the file?
    // Using a new subdir for isolation would be better but I can just delete tasks.json
    const tasksPath = getEffectivePaths(tempDir).tasks;
    await rm(tasksPath, { force: true });

    const handler = createEventHandler(noopLogger, tempDir);
    const event = {
      type: "todo.updated",
      properties: {
        sessionID: "sess-no-todos",
        // no todos
      },
    };

    await handler({ event: event as any });

    try {
        await stat(tasksPath);
        assert.fail("tasks.json should not exist");
    } catch (err: any) {
        assert.equal(err.code, "ENOENT", "File should not exist");
    }
  });

  it("should handle missing sessionID gracefully and support legacy text payload", async () => {
      const tasksPath = getEffectivePaths(tempDir).tasks;
      await rm(tasksPath, { force: true });

      const handler = createEventHandler(noopLogger, tempDir);
      const todos = [{ id: "3", text: "Task 3", status: "pending" }];
      const event = {
        type: "todo.updated",
        properties: {
          // no sessionID
          todos,
        },
      };

      await handler({ event: event as any });
      await flushTaskManifestMutations();

      try {
          const content = await readFile(tasksPath, "utf-8");
          const parsed = JSON.parse(content);

          // Check that tasks are saved
          assert.equal(parsed.tasks.length, 1);
          assert.equal(parsed.tasks[0].id, "3");
          assert.equal(parsed.tasks[0].text, "Task 3");
          assert.equal(parsed.tasks[0].content, "Task 3");
          assert.equal(parsed.tasks[0].status, "pending");
          assert.equal(parsed.tasks[0].priority, "medium");
          assert.equal(parsed.tasks[0].max_validation_attempts, 10);
          // session_id might be undefined in the object if not provided
          assert.equal(parsed.session_id, "unknown");
      } catch (err) {
          assert.fail(`Failed to read tasks.json: ${err}`);
      }
  });

  it("normalizes todo aliases from camelCase/snake_case payload fields", async () => {
    const tasksPath = getEffectivePaths(tempDir).tasks;
    await rm(tasksPath, { force: true });

    const handler = createEventHandler(noopLogger, tempDir);
    const event = {
      type: "todo.updated",
      properties: {
        sessionID: "sess-alias-1",
        todos: [
          {
            id: "alias-task-1",
            content: "Alias task",
            dependencyIds: ["dep-a"],
            acceptanceCriteria: ["criterion-a"],
            recommendedSkills: ["skill-a"],
            canonicalCommand: "hivefiver-start",
            relatedEntities: {
              planId: "plan-1",
              phaseId: "phase-1",
              graphTaskId: "graph-1",
              storyId: "story-1",
            },
          },
        ],
      },
    };

    await handler({ event: event as any });
    await flushTaskManifestMutations();

    const content = await readFile(tasksPath, "utf-8");
    const parsed = JSON.parse(content);
    assert.deepEqual(parsed.tasks[0].dependencies, ["dep-a"]);
    assert.deepEqual(parsed.tasks[0].acceptance_criteria, ["criterion-a"]);
    assert.deepEqual(parsed.tasks[0].recommended_skills, ["skill-a"]);
    assert.equal(parsed.tasks[0].canonical_command, "hivefiver-start");
    assert.equal(parsed.tasks[0].related_entities.plan_id, "plan-1");
    assert.equal(parsed.tasks[0].related_entities.phase_id, "phase-1");
    assert.equal(parsed.tasks[0].related_entities.graph_task_id, "graph-1");
    assert.equal(parsed.tasks[0].related_entities.story_id, "story-1");
    assert.equal(typeof parsed.tasks[0].related_entities.workflow_id, "string");
  });

  it("sanitizes invalid numeric meta fields and keeps known-command tasks non-forced", async () => {
    const tasksPath = getEffectivePaths(tempDir).tasks;
    await rm(tasksPath, { force: true });

    const handler = createEventHandler(noopLogger, tempDir);
    const event = {
      type: "todo.updated",
      properties: {
        sessionID: "sess-sanitize-1",
        todos: [
          {
            id: "sanitize-1",
            content: "/hivefiver research verify",
            validationAttempts: -7,
            maxValidationAttempts: -3,
            menuStep: -2,
            menuTotal: -1,
          },
        ],
      },
    };

    await handler({ event: event as any });
    await flushTaskManifestMutations();

    const content = await readFile(tasksPath, "utf-8");
    const parsed = JSON.parse(content);
    assert.equal(parsed.tasks[0].validation_attempts, 0);
    assert.equal(parsed.tasks[0].max_validation_attempts, 10);
    assert.equal(parsed.tasks[0].menu_step, undefined);
    assert.equal(parsed.tasks[0].menu_total, undefined);
    assert.equal(parsed.tasks[0].canonical_command, undefined);
  });

  it("applies permission-gated metadata for build-intent tasks", async () => {
    const tasksPath = getEffectivePaths(tempDir).tasks;
    await rm(tasksPath, { force: true });

    const handler = createEventHandler(noopLogger, tempDir);
    const event = {
      type: "todo.updated",
      properties: {
        sessionID: "sess-build-policy",
        todos: [
          {
            id: "build-1",
            content: "please build this feature now",
          },
        ],
      },
    };

    await handler({ event: event as any });
    await flushTaskManifestMutations();

    const content = await readFile(tasksPath, "utf-8");
    const parsed = JSON.parse(content);
    assert.equal(parsed.tasks[0].hivefiver_action, "build");
    assert.equal(parsed.tasks[0].auto_initiate, false);
    assert.equal(parsed.tasks[0].requires_permission, true);
    assert.equal(typeof parsed.tasks[0].permission_prompt, "string");
    assert.ok(parsed.tasks[0].permission_prompt.includes("/hivefiver build"));
    assert.equal(Array.isArray(parsed.tasks[0].next_step_menu), true);
    assert.ok(parsed.tasks[0].next_step_menu[0].requiresPermission);
  });
});
