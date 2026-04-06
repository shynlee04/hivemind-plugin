import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { existsSync, mkdirSync, rmSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { PromptEnhancePlugin } from "../../.opencode/plugins/prompt-enhance";

type CompactingInput = Record<string, unknown>;
type CompactingOutput = { context: string[] };

describe("prompt-enhance plugin", () => {
  const testDir = join(tmpdir(), "prompt-enhance-test");
  const stateFile = join(testDir, ".hivemind/state/session-context-prompt.md");
  const patchesDir = join(testDir, ".hivemind/state/.patches");

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true });
    process.chdir(testDir);
  });

  afterEach(() => {
    try {
      rmSync(join(testDir, ".hivemind"), { recursive: true, force: true });
      rmSync(testDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  it("creates state file on init", async () => {
    const plugin = await PromptEnhancePlugin();
    await plugin.event?.({});

    expect(existsSync(stateFile)).toBe(true);
  });

  it("creates patches directory on init", async () => {
    const plugin = await PromptEnhancePlugin();
    await plugin.event?.({});

    expect(existsSync(patchesDir)).toBe(true);
  });

  it("initializes with correct frontmatter and sections", async () => {
    const plugin = await PromptEnhancePlugin();
    await plugin.event?.({});

    const content = readFileSync(stateFile, "utf-8");

    expect(content).toContain("patch_count: 0");
    expect(content).toContain("compaction_count: 0");
    expect(content).toContain("context_budget_pct: 100");
    expect(content).toContain("status: idle");
    expect(content).toContain("## What Happened So Far");
    expect(content).toContain("## Identified Risks");
    expect(content).toContain("## Task List");
    expect(content).toContain("## Deferred Items");
    expect(content).toContain("## Clarification Log");
    expect(content).toContain("## Final Output");
  });

  it("is idempotent - does not overwrite existing file", async () => {
    const plugin = await PromptEnhancePlugin();
    await plugin.event?.({});

    const originalContent = readFileSync(stateFile, "utf-8");
    const modifiedContent = originalContent.replace("Session initialized.", "Custom content");
    writeFileSync(stateFile, modifiedContent);

    await plugin.event?.({});

    const afterContent = readFileSync(stateFile, "utf-8");
    expect(afterContent).toBe(modifiedContent);
    expect(afterContent).not.toContain("Session initialized.");
    expect(afterContent).toContain("Custom content");
  });

  it("compaction increments count and reduces budget", async () => {
    const plugin = await PromptEnhancePlugin();
    await plugin.event?.({});

    const output: CompactingOutput = { context: [] };
    await plugin["experimental.session.compacting"]?.({} as CompactingInput, output);

    const content = readFileSync(stateFile, "utf-8");
    expect(content).toContain("compaction_count: 1");
    expect(content).toContain("context_budget_pct: 85");
  });

  it("compaction injects session snapshot into output context", async () => {
    const plugin = await PromptEnhancePlugin();
    await plugin.event?.({});

    const output: CompactingOutput = { context: [] };
    await plugin["experimental.session.compacting"]?.({} as CompactingInput, output);

    expect(Array.isArray(output.context)).toBe(true);
    expect(output.context.length).toBeGreaterThan(0);
    expect(output.context[0]).toContain("## Prompt-Enhance Session Context");
    expect(output.context[0]).toContain("```md");
    expect(output.context[0]).toContain("compaction_count: 1");
  });

  it("compaction budget floors at 0", async () => {
    const plugin = await PromptEnhancePlugin();
    await plugin.event?.({});

    // Set budget low to test floor
    const content = readFileSync(stateFile, "utf-8");
    const modified = content.replace("context_budget_pct: 100", "context_budget_pct: 10");
    writeFileSync(stateFile, modified);

    const output: CompactingOutput = { context: [] };
    await plugin["experimental.session.compacting"]?.({} as CompactingInput, output);

    const afterContent = readFileSync(stateFile, "utf-8");
    expect(afterContent).toContain("context_budget_pct: 0");
  });

  it("compaction handles multiple compactions correctly", async () => {
    const plugin = await PromptEnhancePlugin();
    await plugin.event?.({});

    const output1: CompactingOutput = { context: [] };
    await plugin["experimental.session.compacting"]?.({} as CompactingInput, output1);

    const output2: CompactingOutput = { context: [] };
    await plugin["experimental.session.compacting"]?.({} as CompactingInput, output2);

    const content = readFileSync(stateFile, "utf-8");
    expect(content).toContain("compaction_count: 2");
    expect(content).toContain("context_budget_pct: 70");
  });
});
