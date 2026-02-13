import { test } from "node:test";
import assert from "node:assert";
import { FileLock } from "../src/lib/persistence.js";
import { mkdtemp, rm, writeFile, utimes } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { existsSync } from "node:fs";

async function withTempDir(fn: (dir: string) => Promise<void>) {
  const dir = await mkdtemp(join(tmpdir(), "hivemind-lock-test-"));
  try {
    await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test("FileLock behavior", async (t) => {
  await t.test("acquires lock successfully", async () => {
    await withTempDir(async (dir) => {
      const lockPath = join(dir, "test.lock");
      const lock = new FileLock(lockPath);
      await lock.acquire();
      assert.ok(existsSync(lockPath), "Lock file should exist");
      await lock.release();
      assert.ok(!existsSync(lockPath), "Lock file should be removed");
    });
  });

  await t.test("waits for lock release", async () => {
    await withTempDir(async (dir) => {
      const lockPath = join(dir, "test.lock");
      const lock1 = new FileLock(lockPath);
      const lock2 = new FileLock(lockPath);

      await lock1.acquire();

      // Attempt to acquire with lock2 asynchronously
      const p2 = lock2.acquire();

      // Should not be resolved yet (give it a bit of time)

      setTimeout(() => lock1.release(), 200);

      await p2;
      assert.ok(existsSync(lockPath), "Lock2 should hold the lock");
      await lock2.release();
    });
  });

  await t.test("cleans up stale lock", async () => {
    await withTempDir(async (dir) => {
      const lockPath = join(dir, "test.lock");
      // Create a stale lock file (older than 5s)
      await writeFile(lockPath, "");
      const now = Date.now();
      const oldTime = (now - 10000) / 1000;
      await utimes(lockPath, oldTime, oldTime);

      const logs: string[] = [];
      const logger = { warn: (msg: string) => logs.push(msg) } as any;

      const lock = new FileLock(lockPath, logger);
      await lock.acquire();

      assert.ok(existsSync(lockPath), "Should acquire lock after cleanup");
      assert.ok(logs.some(l => l.includes("Removing stale lock")), "Should log stale lock removal");

      await lock.release();
    });
  });
});
