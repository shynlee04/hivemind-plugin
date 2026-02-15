import { describe, it, before, after } from "node:test";
import { strict as assert } from "node:assert";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createEventHandler } from "../../src/hooks/event-handler.js";
import { getEffectivePaths } from "../../src/lib/paths.js";
import type { Logger } from "../../src/lib/logging.js";

const noopLogger: Logger = {
  info: async () => {},
  warn: async () => {},
  error: async () => {},
  debug: async () => {},
  log: async () => {},
};

describe("US-004: Event Handler - todo.updated", () => {
  let tempDir: string;

  before(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "hivemind-test-us004-"));
  });

  after(async () => {
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
          // session_id might be undefined in the object if not provided
          assert.equal(parsed.session_id, "unknown");
      } catch (err) {
          assert.fail(`Failed to read tasks.json: ${err}`);
      }
  });
});
