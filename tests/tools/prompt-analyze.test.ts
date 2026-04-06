import { describe, it, expect } from "vitest";
import { promptAnalyze } from "../../.opencode/tools/prompt-analyze";

describe("prompt-analyze", () => {
  it("flags absolute claims and missing scope", async () => {
    const result = await promptAnalyze.execute({
      content: "Build this now. You MUST ship it today.",
    });

    expect(result.finding_count).toBeGreaterThanOrEqual(2);
    expect(result.findings.some((finding) => finding.type === "missing_scope")).toBe(true);
    expect(result.findings.some((finding) => finding.type === "absolute_claim")).toBe(true);
  });

  it("flags vague instructions", async () => {
    const result = await promptAnalyze.execute({
      content: "Please improve some things and make it better somehow.",
    });

    expect(result.findings.some((finding) => finding.type === "vagueness")).toBe(true);
  });

  it("flags simple contradictory requirements", async () => {
    const result = await promptAnalyze.execute({
      content: "Use TypeScript for the plugin. Do not use TypeScript for the plugin.",
    });

    expect(result.findings.some((finding) => finding.type === "contradiction")).toBe(true);
    expect(result.by_severity.important).toBeGreaterThanOrEqual(1);
  });

  it("gives clearer prompts a higher score", async () => {
    const result = await promptAnalyze.execute({
      content: "Update src/plugin.ts to add a new event hook and verify it with vitest.",
    });

    expect(result.clarity_score).toBeGreaterThan(60);
    expect(result.by_severity.critical).toBe(0);
  });
});
