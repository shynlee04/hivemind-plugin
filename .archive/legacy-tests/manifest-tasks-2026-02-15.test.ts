import { describe, it, before, after } from "node:test";
import { strict as assert } from "node:assert";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { loadTasks, saveTasks } from "../../src/lib/manifest.js";
import type { TaskManifest } from "../../src/schemas/manifest.js";

describe("US-005: Manifest - Tasks Helpers", () => {
  let tempDir: string;

  before(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "hivemind-test-us005-"));
  });

  after(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("should save and load tasks manifest", async () => {
    const manifest: TaskManifest = {
      session_id: "sess-1",
      updated_at: 123456789,
      tasks: [
        { id: "t1", text: "Do it", status: "pending" }
      ]
    };

    await saveTasks(tempDir, manifest);
    const loaded = await loadTasks(tempDir);

    assert.deepEqual(loaded, manifest);
  });

  it("should return null if tasks manifest does not exist", async () => {
    const loaded = await loadTasks(join(tempDir, "subdir"));
    assert.equal(loaded, null);
  });
});
