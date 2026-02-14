import { describe, it, before, after } from "node:test";
import { strict as assert } from "node:assert";
import { mkdtemp, readFile, rm } from "node:fs/promises";
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

  it("should create tasks.json when todo.updated event is received", async () => {
    const handler = createEventHandler(noopLogger, tempDir);
    const sessionID = "test-session-123";
    const todos = [
      { id: "1", text: "Task 1", status: "pending" },
      { id: "2", text: "Task 2", status: "completed" },
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
        assert.deepEqual(parsed.tasks, todos);
        assert.ok(parsed.updated_at > 0);
    } catch (err) {
        assert.fail(`Failed to read tasks.json: ${err}`);
    }
  });
});
