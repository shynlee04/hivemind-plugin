import { describe, it, expect, vi } from "vitest";
import { contextBudget } from "../../.opencode/tools/context-budget";
import * as fs from "fs";

vi.mock("fs");

describe("context-budget", () => {
  it("returns 100% when session file doesn't exist", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    const result = await contextBudget.execute({
      sessionFilePath: "/nonexistent/session.md",
    });
    expect(result.budget_pct).toBe(100);
    expect(result.compaction_count).toBe(0);
    expect(result.status).toBe("ok");
  });

  it("calculates budget from compaction_count", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(
      "---\ncompaction_count: 2\n---\ncontent"
    );
    const result = await contextBudget.execute({
      sessionFilePath: "/tmp/session.md",
    });
    expect(result.budget_pct).toBe(70); // 100 - 2*15
    expect(result.compaction_count).toBe(2);
    expect(result.status).toBe("ok");
  });

  it("floors at 0 for high compaction", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(
      "---\ncompaction_count: 10\n---\ncontent"
    );
    const result = await contextBudget.execute({
      sessionFilePath: "/tmp/session.md",
    });
    expect(result.budget_pct).toBe(0);
    expect(result.status).toBe("critical");
  });
});
