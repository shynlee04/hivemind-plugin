import { describe, it, expect } from "vitest";
import { promptSkim } from "../../.opencode/tools/prompt-skim";

describe("prompt-skim", () => {
  it("counts words and lines correctly", async () => {
    const result = await promptSkim.execute({
      content: "Hello world\nThis is a test",
      workspaceRoot: process.cwd(),
    });
    expect(result.word_count).toBe(6);
    expect(result.line_count).toBe(2);
  });

  it("extracts URLs", async () => {
    const result = await promptSkim.execute({
      content: "Check https://example.com and https://github.com/test/repo",
      workspaceRoot: process.cwd(),
    });
    expect(result.url_count).toBe(2);
    expect(result.urls).toContain("https://example.com");
  });

  it("counts absolute claims", async () => {
    const result = await promptSkim.execute({
      content: "You MUST do this. NEVER do that. ALWAYS verify.",
      workspaceRoot: process.cwd(),
    });
    expect(result.absolute_claim_count).toBe(3);
  });

  it("calculates complexity score for simple content", async () => {
    const result = await promptSkim.execute({
      content: "Simple prompt",
      workspaceRoot: process.cwd(),
    });
    expect(result.complexity_score).toBe(1);
    expect(result.flooding_risk).toBe("low");
  });

  it("recommends lanes based on complexity", async () => {
    const simple = await promptSkim.execute({
      content: "Simple prompt",
      workspaceRoot: process.cwd(),
    });
    expect(simple.recommended_lanes).toContain("analyzer");
    expect(simple.recommended_lanes).toContain("repackager");
  });
});
