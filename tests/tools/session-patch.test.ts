import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { sessionPatch } from "../../.opencode/tools/session-patch";
import { readFileSync, writeFileSync, unlinkSync, mkdirSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

describe("session-patch", () => {
  const testDir = join(tmpdir(), "session-patch-test");
  const sessionFile = join(testDir, "session.md");

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true });
    writeFileSync(
      sessionFile,
      `---\npatch_count: 0\n---\n\n## Identified Risks\nold risk content\n\n## Other Section\nother content\n`
    );
  });

  afterEach(() => {
    try {
      unlinkSync(sessionFile);
      rmSync(testDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  it("patches a section and creates backup", async () => {
    const result = await sessionPatch.execute({
      sessionFilePath: sessionFile,
      section: "## Identified Risks",
      newContent: "new risk content",
    });
    expect(result.status).toBe("ok");
    expect(result.patch_count).toBe(1);

    const updated = readFileSync(sessionFile, "utf-8");
    expect(updated).toContain("new risk content");
    expect(updated).not.toContain("old risk content");
  });

  it("returns error for non-existent section", async () => {
    const result = await sessionPatch.execute({
      sessionFilePath: sessionFile,
      section: "## Nonexistent",
      newContent: "content",
    });
    expect(result.status).toBe("error");
  });

  it("returns error for missing file", async () => {
    const result = await sessionPatch.execute({
      sessionFilePath: "/nonexistent/file.md",
      section: "## Test",
      newContent: "content",
    });
    expect(result.status).toBe("error");
  });
});
