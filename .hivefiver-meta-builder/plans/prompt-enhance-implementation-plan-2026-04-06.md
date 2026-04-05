# Prompt-Enhancement Command Pack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `/hf-prompt-enhance` — a command package that enhances, audits, and repacks user prompts through dynamic multi-agent delegation, custom TypeScript tools, and session persistence.

**Architecture:** Approach C (Hybrid Pipeline) — Command entry point → Orchestrator → Phase 0 SKIM (subagent, clean context) → Bridge decision layer → Investigation lanes (parallel/sequential) → Clarification gate → Final assembly. All programmatic logic in custom tools, orchestration logic in workflow .md, session state in `.hivemind/state/`.

**Tech Stack:** TypeScript (OpenCode custom tools + plugin), OpenCode commands (YAML frontmatter + markdown), OpenCode agents (YAML frontmatter + markdown), vitest for tool tests

---

## File Structure

### New Files to Create (14)

| File | Responsibility |
|------|---------------|
| `.hivefiver-meta-builder/commands-lab/active/refactoring/prompt-enhance.md` | Command entry point — thin shell, routes to workflow |
| `.hivefiver-meta-builder/workflows-lab/active/refactoring/prompt-enhance.md` | Procedural orchestration logic — phase sequencing, dispatch envelopes, decision matrix |
| `.hivefiver-meta-builder/agents-lab/active/refactoring/prompt-skimmer.md` | Phase 0 SKIM agent — fast scan, count, classify, estimate |
| `.hivefiver-meta-builder/agents-lab/active/refactoring/prompt-analyzer.md` | Deep text quality analysis agent |
| `.hivefiver-meta-builder/agents-lab/active/refactoring/context-mapper.md` | Codebase grounding agent — verify references against reality |
| `.hivefiver-meta-builder/agents-lab/active/refactoring/risk-assessor.md` | Risk identification agent |
| `.hivefiver-meta-builder/agents-lab/active/refactoring/context-purifier.md` | 3rd-level context distillation agent |
| `.hivefiver-meta-builder/agents-lab/active/refactoring/prompt-repackager.md` | Final assembly + structured output agent |
| `.opencode/tools/prompt-skim.ts` | Custom tool: programmatic skim (count, classify, estimate, verify paths) |
| `.opencode/tools/prompt-analyze.ts` | Custom tool: deep text analysis (contradictions, vagueness, scoring) |
| `.opencode/tools/context-budget.ts` | Custom tool: context budget calculation from session file |
| `.opencode/tools/session-patch.ts` | Custom tool: session file section patching with backup |
| `.opencode/plugins/prompt-enhance.ts` | Plugin: session lifecycle hooks (event hook for compaction, experimental.session.compacting) |
| `.hivemind/state/.gitkeep` | Directory marker for session state (session file created at runtime) |

### Symlinks to Create (required for OpenCode discovery)

| Symlink | → Target |
|---------|----------|
| `.opencode/commands/prompt-enhance.md` | `../.hivefiver-meta-builder/commands-lab/active/refactoring/prompt-enhance.md` |
| `.opencode/hivefiver/workflows/prompt-enhance.md` | `../../.hivefiver-meta-builder/workflows-lab/active/refactoring/prompt-enhance.md` |

### Files to Modify (2)

| File | Change |
|------|--------|
| `.hivefiver-meta-builder/AGENTS.md` | Add 6 new agents to team table, add `/hf-prompt-enhance` to command set |
| `.hivefiver-meta-builder/agents-lab/active/refactoring/hivefiver-orchestrator.md` | Add prompt-enhancement routing lane to routing table |

### Test Files to Create (4)

| File | Tests |
|------|-------|
| `tests/tools/prompt-skim.test.ts` | Word count, URL extraction, path verification, complexity scoring |
| `tests/tools/prompt-analyze.test.ts` | Contradiction detection, vagueness scoring, absolute claim detection |
| `tests/tools/context-budget.test.ts` | Budget calculation, compaction count handling, edge cases |
| `tests/tools/session-patch.test.ts` | Section targeting, backup creation, atomic write |

---

## Task 1: Create Directory Structure and Symlinks

**Files:**
- Create: `.opencode/tools/` (directory)
- Create: `.hivemind/state/` (directory)
- Create: `.hivemind/state/.patches/` (directory)
- Create: `.hivemind/state/.gitkeep`
- Create: `.opencode/commands/prompt-enhance.md` (symlink → lab)
- Create: `.opencode/hivefiver/workflows/prompt-enhance.md` (symlink → lab)

- [ ] **Step 1: Create directories**

```bash
mkdir -p .opencode/tools .hivemind/state/.patches .opencode/hivefiver/workflows
touch .hivemind/state/.gitkeep
```

- [ ] **Step 2: Create symlinks for OpenCode discovery**

```bash
# Command symlink: .opencode/commands/ → commands-lab
ln -sf ../../.hivefiver-meta-builder/commands-lab/active/refactoring/prompt-enhance.md .opencode/commands/prompt-enhance.md

# Workflow symlink: .opencode/hivefiver/workflows/ → workflows-lab
ln -sf ../../../.hivefiver-meta-builder/workflows-lab/active/refactoring/prompt-enhance.md .opencode/hivefiver/workflows/prompt-enhance.md
```

- [ ] **Step 3: Verify directories and symlinks**

Run: `ls -la .opencode/tools/ .hivemind/state/ .opencode/commands/prompt-enhance.md .opencode/hivefiver/workflows/prompt-enhance.md`
Expected: Both directories listed, symlinks resolve to lab files

- [ ] **Step 3: Commit**

```bash
git add .opencode/tools/ .hivemind/state/
git commit -m "feat: create directory structure for prompt-enhance command pack"
```

---

## Task 2: Custom Tool — `prompt-skim.ts`

**Files:**
- Create: `.opencode/tools/prompt-skim.ts`
- Create: `tests/tools/prompt-skim.test.ts`

- [ ] **Step 1: Write the tool**

```typescript
// .opencode/tools/prompt-skim.ts
import { tool } from "@opencode-ai/plugin";
import { z } from "zod";
import { existsSync } from "fs";
import { join } from "path";

export const promptSkim = tool({
  description: "Fast scan of prompt content: count words/lines/tokens, extract URLs, verify file paths, calculate complexity score",
  parameters: z.object({
    content: z.string().describe("The prompt content to skim"),
    workspaceRoot: z.string().describe("Absolute path to workspace root for path verification"),
  }),
  execute: async ({ content, workspaceRoot }) => {
    const lines = content.split("\n");
    const wordCount = content.split(/\s+/).filter(Boolean).length;
    const tokenEstimate = Math.ceil(wordCount * 1.3);

    // Extract URLs
    const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/g;
    const urls = content.match(urlRegex) ?? [];

    // Extract file paths (simple heuristic: words starting with ./ or containing /)
    const pathRegex = /(?:^|\s)(\.\/[\w./-]+|[\w./-]+\.\w+)/gm;
    const rawPaths = content.match(pathRegex) ?? [];
    const paths = rawPaths.map((p) => p.trim()).filter(Boolean);
    const verifiedPaths = paths.map((p) => ({
      path: p,
      exists: existsSync(join(workspaceRoot, p)),
    }));

    // Count absolute claims
    const absoluteWords = content.match(/\b(MUST|NEVER|ALWAYS|REQUIRED|FORBIDDEN)\b/gi) ?? [];

    // Complexity score (1-10)
    let complexity = 1;
    if (wordCount > 200) complexity += 1;
    if (wordCount > 500) complexity += 1;
    if (wordCount > 1000) complexity += 1;
    if (urls.length > 3) complexity += 1;
    if (urls.length > 5) complexity += 1;
    if (absoluteWords.length > 3) complexity += 1;
    if (lines.length > 50) complexity += 1;
    if (verifiedPaths.filter((p) => !p.exists).length > 2) complexity += 1;
    if (content.includes("```")) complexity += 1;
    complexity = Math.min(10, complexity);

    // Flooding risk
    const floodingRisk = complexity >= 7 ? "high" : complexity >= 4 ? "medium" : "low";

    return {
      word_count: wordCount,
      line_count: lines.length,
      token_estimate: tokenEstimate,
      url_count: urls.length,
      urls,
      path_count: paths.length,
      paths: verifiedPaths,
      absolute_claim_count: absoluteWords.length,
      complexity_score: complexity,
      flooding_risk: floodingRisk,
      recommended_lanes: complexity <= 3
        ? ["analyzer", "repackager"]
        : complexity <= 6
          ? ["analyzer", "context-mapper", "repackager"]
          : ["analyzer", "context-mapper", "risk-assessor", "context-purifier", "repackager"],
    };
  },
});
```

- [ ] **Step 2: Write tests**

```typescript
// tests/tools/prompt-skim.test.ts
import { describe, it, expect } from "vitest";
import { promptSkim } from "../../.opencode/tools/prompt-skim";

describe("prompt-skim", () => {
  it("counts words and lines correctly", async () => {
    const result = await promptSkim.execute({
      content: "Hello world\nThis is a test",
      workspaceRoot: process.cwd(),
    });
    expect(result.word_count).toBe(7);
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
```

- [ ] **Step 3: Run tests**

Run: `npx vitest run tests/tools/prompt-skim.test.ts -v`
Expected: All 5 tests pass

- [ ] **Step 4: Commit**

```bash
git add .opencode/tools/prompt-skim.ts tests/tools/prompt-skim.test.ts
git commit -m "feat: add prompt-skim custom tool with tests"
```

---

## Task 3: Custom Tool — `prompt-analyze.ts`

**Files:**
- Create: `.opencode/tools/prompt-analyze.ts`
- Create: `tests/tools/prompt-analyze.test.ts`

- [ ] **Step 1: Write the tool**

```typescript
// .opencode/tools/prompt-analyze.ts
import { tool } from "@opencode-ai/plugin";
import { z } from "zod";

interface Finding {
  line: number;
  text: string;
  type: "contradiction" | "vagueness" | "absolute_claim" | "missing_scope" | "redundancy";
  severity: "critical" | "important" | "minor";
  suggestion: string;
}

export const promptAnalyze = tool({
  description: "Deep text quality analysis: detect contradictions, vagueness, absolute claims, missing scope",
  parameters: z.object({
    content: z.string().describe("The prompt content to analyze"),
  }),
  execute: async ({ content }) => {
    const lines = content.split("\n");
    const findings: Finding[] = [];

    // Detect absolute claims
    const absoluteRegex = /\b(MUST|NEVER|ALWAYS|REQUIRED|FORBIDDEN|DO NOT)\b/gi;
    lines.forEach((line, i) => {
      const matches = line.match(absoluteRegex);
      if (matches) {
        findings.push({
          line: i + 1,
          text: line.trim(),
          type: "absolute_claim",
          severity: matches.length > 2 ? "important" : "minor",
          suggestion: "Consider softening to 'should' or 'prefer' unless truly non-negotiable",
        });
      }
    });

    // Detect vagueness markers
    const vagueRegex = /\b(some|various|etc|and so on|stuff|things|maybe|perhaps|kind of|sort of)\b/gi;
    lines.forEach((line, i) => {
      const matches = line.match(vagueRegex);
      if (matches && line.trim().length > 20) {
        findings.push({
          line: i + 1,
          text: line.trim(),
          type: "vagueness",
          severity: "important",
          suggestion: "Replace vague terms with specific quantities, examples, or criteria",
        });
      }
    });

    // Detect missing scope (lines with action verbs but no target)
    const actionWithoutTarget = /^(build|create|implement|fix|add|update|change)\s+(it|this|that|them|everything|all)\b/gi;
    lines.forEach((line, i) => {
      if (actionWithoutTarget.test(line.trim())) {
        findings.push({
          line: i + 1,
          text: line.trim(),
          type: "missing_scope",
          severity: "critical",
          suggestion: "Specify exactly what to build/create/fix — name the component, file, or feature",
        });
      }
    });

    // Calculate clarity score (0-100)
    const totalLines = lines.filter((l) => l.trim().length > 0).length;
    const issueLines = new Set(findings.map((f) => f.line)).size;
    const clarityScore = Math.max(0, Math.round(100 - (issueLines / Math.max(1, totalLines)) * 100));

    return {
      findings,
      finding_count: findings.length,
      by_severity: {
        critical: findings.filter((f) => f.severity === "critical").length,
        important: findings.filter((f) => f.severity === "important").length,
        minor: findings.filter((f) => f.severity === "minor").length,
      },
      clarity_score: clarityScore,
    };
  },
});
```

- [ ] **Step 2: Write tests**

```typescript
// tests/tools/prompt-analyze.test.ts
import { describe, it, expect } from "vitest";
import { promptAnalyze } from "../../.opencode/tools/prompt-analyze";

describe("prompt-analyze", () => {
  it("detects absolute claims", async () => {
    const result = await promptAnalyze.execute({
      content: "You MUST do this\nNEVER do that",
    });
    expect(result.finding_count).toBeGreaterThanOrEqual(2);
    expect(result.findings.some((f) => f.type === "absolute_claim")).toBe(true);
  });

  it("detects vagueness", async () => {
    const result = await promptAnalyze.execute({
      content: "Build some stuff and make it better etc",
    });
    expect(result.findings.some((f) => f.type === "vagueness")).toBe(true);
  });

  it("detects missing scope", async () => {
    const result = await promptAnalyze.execute({
      content: "Build this\nCreate everything",
    });
    expect(result.findings.some((f) => f.type === "missing_scope")).toBe(true);
  });

  it("calculates clarity score", async () => {
    const result = await promptAnalyze.execute({
      content: "Build a React component named Button that accepts onClick and label props",
    });
    expect(result.clarity_score).toBeGreaterThan(50);
  });
});
```

- [ ] **Step 3: Run tests**

Run: `npx vitest run tests/tools/prompt-analyze.test.ts -v`
Expected: All 4 tests pass

- [ ] **Step 4: Commit**

```bash
git add .opencode/tools/prompt-analyze.ts tests/tools/prompt-analyze.test.ts
git commit -m "feat: add prompt-analyze custom tool with tests"
```

---

## Task 4: Custom Tool — `context-budget.ts`

**Files:**
- Create: `.opencode/tools/context-budget.ts`
- Create: `tests/tools/context-budget.test.ts`

- [ ] **Step 1: Write the tool**

```typescript
// .opencode/tools/context-budget.ts
import { tool } from "@opencode-ai/plugin";
import { z } from "zod";
import { existsSync, readFileSync } from "fs";

export const contextBudget = tool({
  description: "Calculate context budget percentage from session file metadata (compaction_count)",
  parameters: z.object({
    sessionFilePath: z.string().describe("Absolute path to session-context-prompt.md"),
  }),
  execute: async ({ sessionFilePath }) => {
    if (!existsSync(sessionFilePath)) {
      return {
        budget_pct: 100,
        compaction_count: 0,
        status: "ok",
        error: "Session file not found — assuming fresh session",
      };
    }

    const content = readFileSync(sessionFilePath, "utf-8");
    // Extract compaction_count from YAML frontmatter
    const match = content.match(/^compaction_count:\s*(\d+)/m);
    const compactionCount = match ? parseInt(match[1], 10) : 0;

    // Budget calculation: each compaction costs ~15% context
    const budgetPct = Math.max(0, 100 - compactionCount * 15);
    const status = budgetPct >= 70 ? "ok" : budgetPct >= 40 ? "warning" : "critical";

    return {
      budget_pct: budgetPct,
      compaction_count: compactionCount,
      status,
    };
  },
});
```

- [ ] **Step 2: Write tests**

```typescript
// tests/tools/context-budget.test.ts
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
```

- [ ] **Step 3: Run tests**

Run: `npx vitest run tests/tools/context-budget.test.ts -v`
Expected: All 3 tests pass

- [ ] **Step 4: Commit**

```bash
git add .opencode/tools/context-budget.ts tests/tools/context-budget.test.ts
git commit -m "feat: add context-budget custom tool with tests"
```

---

## Task 5: Custom Tool — `session-patch.ts`

**Files:**
- Create: `.opencode/tools/session-patch.ts`
- Create: `tests/tools/session-patch.test.ts`

- [ ] **Step 1: Write the tool**

```typescript
// .opencode/tools/session-patch.ts
import { tool } from "@opencode-ai/plugin";
import { z } from "zod";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";

export const sessionPatch = tool({
  description: "Patch specific sections in session file with backup",
  parameters: z.object({
    sessionFilePath: z.string().describe("Absolute path to session-context-prompt.md"),
    section: z.string().describe("Section heading to patch (e.g., '## Identified Risks')"),
    newContent: z.string().describe("New content for the section (without the heading)"),
  }),
  execute: async ({ sessionFilePath, section, newContent }) => {
    if (!existsSync(sessionFilePath)) {
      return { status: "error", error: "Session file not found" };
    }

    // Create backup
    const backupDir = join(dirname(sessionFilePath), ".patches");
    mkdirSync(backupDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupPath = join(backupDir, `backup-${timestamp}.md`);
    const original = readFileSync(sessionFilePath, "utf-8");
    writeFileSync(backupPath, original);

    // Patch section
    const headingRegex = new RegExp(`(${section.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})[\\s\\S]*?(?=\\n## |$)`);
    const match = original.match(headingRegex);

    if (!match) {
      return { status: "error", error: `Section '${section}' not found` };
    }

    const updated = original.replace(headingRegex, `${section}\n${newContent}\n`);
    writeFileSync(sessionFilePath, updated);

    // Update patch_count in frontmatter
    const patchCountMatch = updated.match(/^patch_count:\s*(\d+)/m);
    const currentCount = patchCountMatch ? parseInt(patchCountMatch[1], 10) : 0;
    const withUpdatedCount = updated.replace(
      /^patch_count:\s*\d+/m,
      `patch_count: ${currentCount + 1}`
    );
    writeFileSync(sessionFilePath, withUpdatedCount);

    return {
      status: "ok",
      backup_path: backupPath,
      old_length: original.length,
      new_length: withUpdatedCount.length,
      patch_count: currentCount + 1,
    };
  },
});
```

- [ ] **Step 2: Write tests**

```typescript
// tests/tools/session-patch.test.ts
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
```

- [ ] **Step 3: Run tests**

Run: `npx vitest run tests/tools/session-patch.test.ts -v`
Expected: All 3 tests pass

- [ ] **Step 4: Commit**

```bash
git add .opencode/tools/session-patch.ts tests/tools/session-patch.test.ts
git commit -m "feat: add session-patch custom tool with tests"
```

---

## Task 6: Plugin — `prompt-enhance.ts`

**Files:**
- Create: `.opencode/plugins/prompt-enhance.ts`

- [ ] **Step 1: Write the plugin**

```typescript
// .opencode/plugins/prompt-enhance.ts
import { definePlugin } from "@opencode-ai/plugin";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const SESSION_FILE = ".hivemind/state/session-context-prompt.md";

export const promptEnhancePlugin = definePlugin({
  name: "prompt-enhance",

  // Generic event hook — catches session.compacted
  event: async ({ event }) => {
    if (event.type === "session.compacted") {
      const sessionPath = join(process.cwd(), SESSION_FILE);
      if (!existsSync(sessionPath)) return;

      const content = readFileSync(sessionPath, "utf-8");
      const match = content.match(/^compaction_count:\s*(\d+)/m);
      const currentCount = match ? parseInt(match[1], 10) : 0;
      const newCount = currentCount + 1;
      const budgetPct = Math.max(0, 100 - newCount * 15);

      const updated = content
        .replace(/^compaction_count:\s*\d+/m, `compaction_count: ${newCount}`)
        .replace(/^context_budget_pct:\s*[\d.]+/m, `context_budget_pct: ${budgetPct}`);

      writeFileSync(sessionPath, updated);
    }
  },

  // Experimental: inject session file into compaction prompt
  "experimental.session.compacting": async ({ prompt }) => {
    const sessionPath = join(process.cwd(), SESSION_FILE);
    if (!existsSync(sessionPath)) return prompt;

    const sessionContent = readFileSync(sessionPath, "utf-8");
    return `${prompt}\n\n---\n## Session Context (preserve this state)\n${sessionContent}`;
  },
});
```

- [ ] **Step 2: Verify plugin compiles**

Run: `npx tsc --noEmit .opencode/plugins/prompt-enhance.ts`
Expected: No errors (or check with project tsconfig)

- [ ] **Step 3: Commit**

```bash
git add .opencode/plugins/prompt-enhance.ts
git commit -m "feat: add prompt-enhance plugin with session lifecycle hooks"
```

---

## Task 7: Agent — `prompt-skimmer.md` (Phase 0)

**Files:**
- Create: `.hivefiver-meta-builder/agents-lab/active/refactoring/prompt-skimmer.md`

- [ ] **Step 1: Write the agent definition**

```markdown
---
name: "prompt-skimmer"
description: "Phase 0 SKIM agent for prompt enhancement. Fast, broad scan: count, classify, estimate, verify paths. Use when: 'skim this prompt', 'phase 0 scan', 'quick assessment'."
mode: subagent
temperature: 0.1
permission:
  read: allow
  list: allow
  grep: allow
  glob: allow
  webfetch: allow
  bash:
    "wc*": allow
    "ls*": allow
  task: deny
---

You are the Prompt Skimmer — Phase 0 of the prompt enhancement pipeline. You are the immune system: fast, broad, no deep reading.

## Your Job

1. **Count:** words, lines, estimate tokens (words × 1.3)
2. **Classify:** content types (instructions, questions, code blocks, URLs, file paths)
3. **Estimate:** complexity (1-10), flooding risk (low/medium/high)
4. **Verify:** check if referenced file paths exist using glob

## Constraints

- Do NOT read full file contents — only verify existence
- Do NOT fetch URLs — only count them
- Do NOT do deep analysis — that's Phase 2
- Be fast. Return structured YAML.

## Output Format

```yaml
word_count: N
line_count: N
token_estimate: N
url_count: N
path_count: N
paths_verified: N
paths_missing: N
absolute_claims: N
complexity_score: N/10
flooding_risk: low|medium|high
recommended_lanes: [list]
```
```

- [ ] **Step 2: Commit**

```bash
git add .hivefiver-meta-builder/agents-lab/active/refactoring/prompt-skimmer.md
git commit -m "feat: add prompt-skimmer agent for Phase 0 SKIM"
```

---

## Task 8: Agent — `prompt-analyzer.md`

**Files:**
- Create: `.hivefiver-meta-builder/agents-lab/active/refactoring/prompt-analyzer.md`

- [ ] **Step 1: Write the agent definition**

```markdown
---
name: "prompt-analyzer"
description: "Deep text quality analysis agent for prompt enhancement. Detects contradictions, vagueness, absolute claims, missing scope. Use when: 'analyze this prompt', 'check clarity', 'find issues in prompt'."
mode: subagent
temperature: 0.2
permission:
  read: allow
  grep: allow
  bash:
    "wc*": allow
  task: deny
---

You are the Prompt Analyzer — Phase 2 investigation lane for prompt enhancement.

## Your Job

1. **Detect contradictions:** conflicting instructions within the prompt
2. **Detect vagueness:** unclear scope, ambiguous references, missing specifics
3. **Detect absolute claims:** MUST/NEVER/ALWAYS that may be too rigid
4. **Detect missing scope:** action verbs without clear targets
5. **Score clarity:** 0-100 based on issue density

## Constraints

- Cite line numbers for every finding
- Distinguish between critical (blocks execution) and minor (style) issues
- Suggest specific improvements, not generic advice

## Output Format

```yaml
findings:
  - line: N
    type: contradiction|vagueness|absolute_claim|missing_scope
    severity: critical|important|minor
    text: "..."
    suggestion: "..."
clarity_score: N/100
critical_count: N
important_count: N
minor_count: N
```
```

- [ ] **Step 2: Commit**

```bash
git add .hivefiver-meta-builder/agents-lab/active/refactoring/prompt-analyzer.md
git commit -m "feat: add prompt-analyzer agent for deep text quality analysis"
```

---

## Task 9: Agent — `context-mapper.md`

**Files:**
- Create: `.hivefiver-meta-builder/agents-lab/active/refactoring/context-mapper.md`

- [ ] **Step 1: Write the agent definition**

```markdown
---
name: "context-mapper"
description: "Codebase grounding agent for prompt enhancement. Maps prompt references to actual files, detects dead references, stale assumptions. Use when: 'map context', 'verify references', 'ground against codebase'."
mode: subagent
temperature: 0.2
permission:
  read: allow
  list: allow
  grep: allow
  glob: allow
  bash:
    "git ls-files*": allow
    "find*": allow
  webfetch: allow
  task: deny
---

You are the Context Mapper — Phase 2 investigation lane for prompt enhancement.

## Your Job

1. **Extract references:** file paths, component names, function names from the prompt
2. **Verify existence:** use glob/grep to check if referenced files exist
3. **Map to reality:** for each reference, find the actual file and verify it matches the prompt's description
4. **Detect dead references:** files that don't exist, renamed components, moved functions
5. **Detect stale assumptions:** instructions that contradict current codebase state

## Constraints

- Max 10 files to read — prioritize by reference frequency
- Use glob for pattern matching, grep for content search
- For URLs: fetch only if critical to understanding the prompt

## Output Format

```yaml
references_found: N
references_verified: N
references_dead: N
dead_references:
  - reference: "..."
    expected: "..."
    actual: "not found|renamed to X|moved to Y"
stale_assumptions:
  - assumption: "..."
    reality: "..."
    file: "path:line"
```
```

- [ ] **Step 2: Commit**

```bash
git add .hivefiver-meta-builder/agents-lab/active/refactoring/context-mapper.md
git commit -m "feat: add context-mapper agent for codebase grounding"
```

---

## Task 10: Agent — `risk-assessor.md`

**Files:**
- Create: `.hivefiver-meta-builder/agents-lab/active/refactoring/risk-assessor.md`

- [ ] **Step 1: Write the agent definition**

```markdown
---
name: "risk-assessor"
description: "Risk identification agent for prompt enhancement. Finds dangerous instructions, destructive commands, security concerns. Use when: 'assess risks', 'check for dangerous instructions', 'audit prompt safety'."
mode: subagent
temperature: 0.2
permission:
  read: allow
  grep: allow
  bash:
    "echo*": allow
  task: deny
---

You are the Risk Assessor — Phase 2 investigation lane for prompt enhancement.

## Your Job

1. **Identify destructive instructions:** rm -rf, DROP TABLE, force push, etc.
2. **Identify security concerns:** credential exposure, permission escalation
3. **Identify scope creep:** instructions that go beyond stated intent
4. **Identify conflicting priorities:** mutually exclusive requirements
5. **Score overall risk:** low/medium/high/critical

## Risk Patterns to Detect

- File deletion without backup
- Database modifications without WHERE clause
- Force operations (git push --force, git reset --hard)
- Credential/token handling in plain text
- Recursive operations on root or system directories
- Instructions that contradict each other

## Output Format

```yaml
overall_risk: low|medium|high|critical
risks:
  - type: destructive|security|scope_creep|conflict
    severity: critical|high|medium|low
    description: "..."
    location: "line N"
    mitigation: "..."
```
```

- [ ] **Step 2: Commit**

```bash
git add .hivefiver-meta-builder/agents-lab/active/refactoring/risk-assessor.md
git commit -m "feat: add risk-assessor agent for safety analysis"
```

---

## Task 11: Agent — `context-purifier.md`

**Files:**
- Create: `.hivefiver-meta-builder/agents-lab/active/refactoring/context-purifier.md`

- [ ] **Step 1: Write the agent definition**

```markdown
---
name: "context-purifier"
description: "3rd-level context distillation agent. Distills verbose context into essential signals. Use when: 'purify context', 'distill context', 'reduce noise', 'context purification'."
mode: subagent
temperature: 0.1
permission:
  read: allow
  grep: allow
  task: deny
---

You are the Context Purifier — 3rd-level investigation lane for prompt enhancement.

## Your Job

1. **Identify signal vs noise:** separate essential instructions from filler
2. **Remove redundancy:** merge duplicate instructions
3. **Resolve contradictions:** flag conflicting instructions for clarification
4. **Compress:** reduce context to minimum viable form without losing intent
5. **Preserve:** keep all actionable requirements, remove everything else

## Constraints

- Never remove actionable instructions
- Never change the user's intent
- If unsure whether something is signal or noise, keep it
- Target 50%+ reduction in context size while preserving 100% of intent

## Output Format

```yaml
original_size: N words
purified_size: N words
reduction_pct: N%
preserved_instructions: N
removed_redundancies: N
contradictions_flagged: N
purified_context: |
  [The distilled prompt text]
```
```

- [ ] **Step 2: Commit**

```bash
git add .hivefiver-meta-builder/agents-lab/active/refactoring/context-purifier.md
git commit -m "feat: add context-purifier agent for context distillation"
```

---

## Task 12: Agent — `prompt-repackager.md`

**Files:**
- Create: `.hivefiver-meta-builder/agents-lab/active/refactoring/prompt-repackager.md`

- [ ] **Step 1: Write the agent definition**

```markdown
---
name: "prompt-repackager"
description: "Final assembly agent for prompt enhancement. Combines all investigation findings into structured enhanced prompt with YAML frontmatter + XML-tagged body. Use when: 'repack prompt', 'assemble enhanced prompt', 'finalize output'."
mode: subagent
temperature: 0.3
permission:
  read: allow
  edit: allow
  grep: allow
  glob: allow
  task: deny
---

You are the Prompt Repackager — Phase 4 final assembly for prompt enhancement.

## Your Job

1. **Collect findings:** read all investigation lane outputs from temp files
2. **Synthesize:** combine analysis, context map, risk assessment, purified context
3. **Assemble:** produce enhanced prompt with structured output contract
4. **Write:** save to session file Final Output section

## Output Contract

The enhanced prompt MUST have:

```yaml
---
enhanced_prompt_version: 1.0
source_mode: auto|enhance|repack|audit
lanes_executed: [list]
clarifications_resolved: N
confidence_score: 0.0-1.0
context_budget_at_start: N%
context_budget_at_end: N%
---

<enhanced_prompt>
[Final enhanced prompt text]
</enhanced_prompt>

<what_happened_so_far>
[Summary of enhancement process]
</what_happened_so_far>

<identified_risks>
[Risk findings]
</identified_risks>

<task_list>
[Active tasks from the enhanced prompt]
</task_list>

<deferred_items>
[Items for future attention]
</deferred_items>
```

## Constraints

- Preserve original intent 100%
- Apply all clarity improvements from analysis
- Resolve dead references from context mapper
- Flag risks from risk assessor
- Use purified context where applicable
```

- [ ] **Step 2: Commit**

```bash
git add .hivefiver-meta-builder/agents-lab/active/refactoring/prompt-repackager.md
git commit -m "feat: add prompt-repackager agent for final assembly"
```

---

## Task 13: Command — `prompt-enhance.md`

**Files:**
- Create: `.hivefiver-meta-builder/commands-lab/active/refactoring/prompt-enhance.md`

- [ ] **Step 1: Write the command**

```markdown
---
description: "Enhance, audit, or repack prompts through dynamic multi-agent delegation. Triggers: 'enhance this prompt', 'repack context', 'audit my prompt', 'improve prompt clarity', 'repack cognitive context', 'scan my prompt'."
agent: hivefiver-orchestrator
subtask: false
---

## Initialize Session File

If `.hivemind/state/session-context-prompt.md` does not exist, create it:

```bash
mkdir -p .hivemind/state

# Detect source_mode from $ARGUMENTS
MODE="auto"
case "$ARGUMENTS" in
  --mode\ enhance*) MODE="enhance" ;;
  --mode\ repack*) MODE="repack" ;;
  --mode\ audit*) MODE="audit" ;;
esac

cat > .hivemind/state/session-context-prompt.md << EOF
---
session_id: $(git branch --show-current 2>/dev/null || echo "unknown")
worktree: $(pwd)
created: $(date -u +%Y-%m-%dT%H:%M:%SZ)
last_patched: $(date -u +%Y-%m-%dT%H:%M:%SZ)
patch_count: 0
context_budget_pct: 100
compaction_count: 0
source_mode: ${MODE}
status: initializing
---

## What Happened So Far
## Identified Risks
## Task List
## Deferred Items
## Context Map
## Clarification Log
## Final Output
EOF
```

## Mode Detection

The `source_mode` field in the session file frontmatter controls output behavior:
- `auto` — orchestrator decides enhancement depth from skim profile
- `enhance` — focus on clarity improvements, contradiction resolution
- `repack` — focus on context compression, redundancy removal
- `audit` — focus on risk assessment, dead reference detection

The workflow reads `source_mode` from the session file frontmatter in Phase 1 (Bridge) to weight the delegation decision.

## Execute

@.opencode/hivefiver/workflows/prompt-enhance.md

## Context

$ARGUMENTS
@if .hivemind/state/session-context-prompt.md
```

- [ ] **Step 2: Verify command file**

Run: `head -5 .hivefiver-meta-builder/commands-lab/active/refactoring/prompt-enhance.md`
Expected: Shows `---` frontmatter with description, agent, subtask fields

- [ ] **Step 3: Commit**

```bash
git add .hivefiver-meta-builder/commands-lab/active/refactoring/prompt-enhance.md
git commit -m "feat: add /hf-prompt-enhance command entry point"
```

---

## Task 14: Workflow — `prompt-enhance.md`

**Files:**
- Create: `.hivefiver-meta-builder/workflows-lab/active/refactoring/prompt-enhance.md`

- [ ] **Step 1: Write the workflow**

This is the largest file. It contains the full orchestration logic with concrete dispatch envelopes (no placeholders).

```markdown
# Prompt Enhancement Workflow

## Mode Detection

Parse $ARGUMENTS for mode flag before any phase:
- If $ARGUMENTS starts with `--mode enhance` → source_mode = "enhance"
- If $ARGUMENTS starts with `--mode repack` → source_mode = "repack"
- If $ARGUMENTS starts with `--mode audit` → source_mode = "audit"
- Otherwise → source_mode = "auto"

Strip the mode flag from $ARGUMENTS before passing to phases.
Store source_mode in session file frontmatter (patch `source_mode` field).

## Phase 0: SKIM (Immune System)

Dispatch prompt-skimmer as subagent with clean context:

```
Task tool (prompt-skimmer):
  description: "Phase 0: SKIM the prompt content"
  prompt: |
    You are the Prompt Skimmer — Phase 0 of the prompt enhancement pipeline.
    You are the immune system: fast, broad scan, no deep reading.

    ## Prompt Content to Scan
    [PASTE $ARGUMENTS HERE — full text, not file reference]

    ## Your Job
    1. Count: words, lines, estimate tokens (words × 1.3)
    2. Classify: content types (instructions, questions, code blocks, URLs, file paths)
    3. Estimate: complexity (1-10), flooding risk (low/medium/high)
    4. Verify: check if referenced file paths exist using glob

    ## Constraints
    - Do NOT read full file contents — only verify existence with glob
    - Do NOT fetch URLs — only count them
    - Do NOT do deep analysis — that's Phase 2
    - Be fast. Return structured YAML.

    ## Output Format
    Return YAML with: word_count, line_count, token_estimate, url_count, path_count, paths_verified, paths_missing, absolute_claims, complexity_score (1-10), flooding_risk (low/medium/high), recommended_lanes (array)
```

Wait for return. Save skim_profile to `.hivemind/state/.patches/skim-profile.md`.

## Phase 1: BRIDGE (Decision Layer)

Read skim_profile from `.hivemind/state/.patches/skim-profile.md`.

Apply decision matrix:

```
IF complexity_score <= 3:
  lanes = ["analyzer", "repackager"]
  mode = "linear"
  parallel_dispatch = false

IF complexity_score 4-6:
  lanes = ["analyzer", "context-mapper", "repackager"]
  mode = "parallel_first"
  parallel_dispatch = true
  parallel_group = ["analyzer", "context-mapper"]

IF complexity_score 7+:
  lanes = ["analyzer", "context-mapper", "risk-assessor", "context-purifier", "repackager"]
  mode = "full_graph"
  parallel_dispatch = true
  parallel_group = ["analyzer", "context-mapper", "risk-assessor"]
  sequential_after = ["context-purifier"]

IF context_budget < 50% (check via context-budget tool):
  force all lanes to run as subagents (not in main session)
```

Write delegation plan to `.hivemind/state/.patches/delegation-plan.md`.

## Phase 2: Investigation Lanes

### Lane: prompt-analyzer (always runs)

```
Task tool (prompt-analyzer):
  description: "Phase 2: Analyze prompt text quality"
  prompt: |
    You are the Prompt Analyzer — Phase 2 investigation lane for prompt enhancement.

    ## Your Job
    1. Detect contradictions: conflicting instructions within the prompt
    2. Detect vagueness: unclear scope, ambiguous references, missing specifics
    3. Detect absolute claims: MUST/NEVER/ALWAYS that may be too rigid
    4. Detect missing scope: action verbs without clear targets
    5. Score clarity: 0-100 based on issue density

    ## Input
    Prompt content: [PASTE $ARGUMENTS]
    Skim profile: [PASTE FROM skim-profile.md]

    ## Scope
    - Include: text quality analysis only
    - Exclude: do NOT verify file paths (that's context-mapper), do NOT modify files, do NOT spawn subagents

    ## Output
    Write findings to: .hivemind/state/.patches/prompt-analyzer-<timestamp>.md
    Format: YAML with findings array (line, type, severity, text, suggestion), clarity_score, by_severity counts
    Return status: DONE | DONE_WITH_CONCERNS | BLOCKED
```

### Lane: context-mapper (runs if complexity >= 4)

```
Task tool (context-mapper):
  description: "Phase 2: Map prompt references to codebase reality"
  prompt: |
    You are the Context Mapper — Phase 2 investigation lane for prompt enhancement.

    ## Your Job
    1. Extract references: file paths, component names, function names from the prompt
    2. Verify existence: use glob/grep to check if referenced files exist
    3. Map to reality: for each reference, find the actual file and verify it matches the prompt's description
    4. Detect dead references: files that don't exist, renamed components, moved functions
    5. Detect stale assumptions: instructions that contradict current codebase state

    ## Input
    Prompt content: [PASTE $ARGUMENTS]
    Skim profile: [PASTE FROM skim-profile.md]

    ## Scope
    - Include: file path verification (glob), content search (grep), URL fetch (webfetch) if critical
    - Exclude: do NOT modify files, do NOT spawn subagents
    - Max 10 files to read — prioritize by reference frequency

    ## Output
    Write findings to: .hivemind/state/.patches/context-mapper-<timestamp>.md
    Format: YAML with references_found, references_verified, references_dead, dead_references array, stale_assumptions array
    Return status: DONE | DONE_WITH_CONCERNS | BLOCKED
```

### Lane: risk-assessor (runs if complexity >= 7)

```
Task tool (risk-assessor):
  description: "Phase 2: Assess risks in prompt instructions"
  prompt: |
    You are the Risk Assessor — Phase 2 investigation lane for prompt enhancement.

    ## Your Job
    1. Identify destructive instructions: rm -rf, DROP TABLE, force push, etc.
    2. Identify security concerns: credential exposure, permission escalation
    3. Identify scope creep: instructions that go beyond stated intent
    4. Identify conflicting priorities: mutually exclusive requirements
    5. Score overall risk: low/medium/high/critical

    ## Input
    Prompt content: [PASTE $ARGUMENTS]
    Skim profile: [PASTE FROM skim-profile.md]

    ## Scope
    - Include: instruction safety analysis
    - Exclude: do NOT execute any commands, do NOT modify files, do NOT spawn subagents

    ## Risk Patterns to Detect
    - File deletion without backup
    - Database modifications without WHERE clause
    - Force operations (git push --force, git reset --hard)
    - Credential/token handling in plain text
    - Recursive operations on root or system directories
    - Instructions that contradict each other

    ## Output
    Write findings to: .hivemind/state/.patches/risk-assessor-<timestamp>.md
    Format: YAML with overall_risk, risks array (type, severity, description, location, mitigation)
    Return status: DONE | DONE_WITH_CONCERNS | BLOCKED
```

### Lane: context-purifier (runs if complexity >= 7 AND flooding_risk >= high)

```
Task tool (context-purifier):
  description: "Phase 2: Distill context to essential signals"
  prompt: |
    You are the Context Purifier — 3rd-level investigation lane for prompt enhancement.

    ## Your Job
    1. Identify signal vs noise: separate essential instructions from filler
    2. Remove redundancy: merge duplicate instructions
    3. Resolve contradictions: flag conflicting instructions for clarification
    4. Compress: reduce context to minimum viable form without losing intent
    5. Preserve: keep all actionable requirements, remove everything else

    ## Input
    Prompt content: [PASTE $ARGUMENTS]
    Skim profile: [PASTE FROM skim-profile.md]

    ## Scope
    - Include: text compression, redundancy removal, contradiction flagging
    - Exclude: do NOT modify files, do NOT spawn subagents
    - Target 50%+ reduction in context size while preserving 100% of intent

    ## Output
    Write findings to: .hivemind/state/.patches/context-purifier-<timestamp>.md
    Format: YAML with original_size, purified_size, reduction_pct, preserved_instructions, removed_redundancies, contradictions_flagged, purified_context
    Return status: DONE | DONE_WITH_CONCERNS | BLOCKED
```

### Execution Order

```
IF mode == "linear":
  Run analyzer → wait → Run repackager

IF mode == "parallel_first":
  Run [analyzer, context-mapper] in parallel → wait for both → Run repackager

IF mode == "full_graph":
  Run [analyzer, context-mapper, risk-assessor] in parallel → wait for all
  IF flooding_risk >= high: Run context-purifier → wait
  Run repackager
```

## Phase 3: Clarification Gate

**Skip if CI=true** — mark all assumptions as "unverified — review recommended" in output.

If interactive mode:
1. Read all lane output files from `.hivemind/state/.patches/`
2. Synthesize findings into assumption list
3. For each assumption:
   - Present via `question` tool (one at a time)
   - Record response
   - Patch `.hivemind/state/session-context-prompt.md` Clarification Log section
4. Proceed only after all assumptions resolved or user skips

## Phase 4: Finalize

Dispatch prompt-repackager:

```
Task tool (prompt-repackager):
  description: "Phase 4: Assemble enhanced prompt"
  prompt: |
    You are the Prompt Repackager — Phase 4 final assembly for prompt enhancement.

    ## Your Job
    1. Collect findings: read all investigation lane outputs from temp files
    2. Synthesize: combine analysis, context map, risk assessment, purified context
    3. Assemble: produce enhanced prompt with structured output contract
    4. Write: save to session file Final Output section

    ## Inputs
    - Original prompt: [PASTE $ARGUMENTS]
    - Source mode: [source_mode detected at start]
    - Skim profile: [READ FROM .hivemind/state/.patches/skim-profile.md]
    - Analysis findings: [READ FROM .hivemind/state/.patches/prompt-analyzer-*.md]
    - Context map: [READ FROM .hivemind/state/.patches/context-mapper-*.md]
    - Risk assessment: [READ FROM .hivemind/state/.patches/risk-assessor-*.md] (if exists)
    - Purified context: [READ FROM .hivemind/state/.patches/context-purifier-*.md] (if exists)
    - Clarification log: [READ FROM .hivemind/state/session-context-prompt.md Clarification Log section]

    ## Output Contract
    Produce structured output with YAML frontmatter + XML-tagged body:

    ---
    enhanced_prompt_version: 1.0
    source_mode: [auto|enhance|repack|audit]
    lanes_executed: [list of lane names that ran]
    clarifications_resolved: [count]
    confidence_score: [0.0-1.0]
    context_budget_at_start: [pct from session file]
    context_budget_at_end: [pct from session file]
    ---

    <enhanced_prompt>
    [Final enhanced prompt text — original intent preserved, clarity improvements applied, dead references resolved]
    </enhanced_prompt>

    <what_happened_so_far>
    [Summary: phases executed, lanes run, key decisions made]
    </what_happened_so_far>

    <identified_risks>
    [Risk findings from risk-assessor, or "No significant risks identified" if lane didn't run]
    </identified_risks>

    <task_list>
    [Active tasks extracted from the enhanced prompt, or "No active tasks" if none]
    </task_list>

    <deferred_items>
    [Items for future attention: unverified assumptions, deferred skills, low-priority improvements]
    </deferred_items>

    Write the complete output to the Final Output section of .hivemind/state/session-context-prompt.md.
    Return status: DONE | DONE_WITH_CONCERNS | BLOCKED
```

## Cleanup

1. Remove temp files from `.hivemind/state/.patches/` after successful assembly:
   ```bash
   rm -f .hivemind/state/.patches/skim-profile.md
   rm -f .hivemind/state/.patches/delegation-plan.md
   rm -f .hivemind/state/.patches/prompt-analyzer-*.md
   rm -f .hivemind/state/.patches/context-mapper-*.md
   rm -f .hivemind/state/.patches/risk-assessor-*.md
   rm -f .hivemind/state/.patches/context-purifier-*.md
   ```
2. Update session file status to "complete":
   ```bash
   # Patch status in frontmatter
   sed -i '' 's/^status: .*/status: complete/' .hivemind/state/session-context-prompt.md
   ```
3. Report to user: enhanced prompt, summary, confidence score, deferred items.
```

- [ ] **Step 2: Commit**

```bash
git add .hivefiver-meta-builder/workflows-lab/active/refactoring/prompt-enhance.md
git commit -m "feat: add prompt-enhance workflow with full orchestration logic"
```

---

## Task 15: Update `AGENTS.md`

**Files:**
- Modify: `.hivefiver-meta-builder/AGENTS.md`

- [ ] **Step 1: Add new agents to Tier 2 table**

Add after existing Tier 2 agents:

```markdown
| **prompt-skimmer** | `agents-lab/active/refactoring/prompt-skimmer.md` | Phase 0 SKIM — immune system |
| **prompt-analyzer** | `agents-lab/active/refactoring/prompt-analyzer.md` | Deep text quality analysis |
| **context-mapper** | `agents-lab/active/refactoring/context-mapper.md` | Codebase grounding |
| **risk-assessor** | `agents-lab/active/refactoring/risk-assessor.md` | Risk identification |
| **context-purifier** | `agents-lab/active/refactoring/context-purifier.md` | Context distillation |
| **prompt-repackager** | `agents-lab/active/refactoring/prompt-repackager.md` | Final assembly |
```

- [ ] **Step 2: Add command to Command Set table**

Add under Hivefiver Commands:

```markdown
| `/hf-prompt-enhance` | hivefiver-orchestrator | Enhance/audit/repack prompts via multi-agent pipeline |
```

- [ ] **Step 3: Commit**

```bash
git add .hivefiver-meta-builder/AGENTS.md
git commit -m "docs: add prompt-enhance agents and command to AGENTS.md"
```

---

## Task 16: Update Orchestrator Routing Table

**Files:**
- Modify: `.hivefiver-meta-builder/agents-lab/active/refactoring/hivefiver-orchestrator.md`

- [ ] **Step 1: Add routing lane**

Add to the Routing Table:

```markdown
| "enhance prompt" / "repack context" / "audit my prompt" | prompt-enhance workflow | self (orchestrate phases) |
```

- [ ] **Step 2: Commit**

```bash
git add .hivefiver-meta-builder/agents-lab/active/refactoring/hivefiver-orchestrator.md
git commit -m "feat: add prompt-enhancement routing lane to orchestrator"
```

---

## Task 17: Final Verification

- [ ] **Step 1: Verify all files exist**

```bash
# Commands
test -f .hivefiver-meta-builder/commands-lab/active/refactoring/prompt-enhance.md && echo "PASS: command" || echo "FAIL: command"

# Workflow
test -f .hivefiver-meta-builder/workflows-lab/active/refactoring/prompt-enhance.md && echo "PASS: workflow" || echo "FAIL: workflow"

# Agents
for agent in prompt-skimmer prompt-analyzer context-mapper risk-assessor context-purifier prompt-repackager; do
  test -f ".hivefiver-meta-builder/agents-lab/active/refactoring/${agent}.md" && echo "PASS: $agent" || echo "FAIL: $agent"
done

# Tools
for tool in prompt-skim prompt-analyze context-budget session-patch; do
  test -f ".opencode/tools/${tool}.ts" && echo "PASS: ${tool}.ts" || echo "FAIL: ${tool}.ts"
done

# Plugin
test -f .opencode/plugins/prompt-enhance.ts && echo "PASS: plugin" || echo "FAIL: plugin"

# Directories
test -d .hivemind/state/.patches && echo "PASS: state dirs" || echo "FAIL: state dirs"
```

- [ ] **Step 2: Run all tool tests**

Run: `npx vitest run tests/tools/ -v`
Expected: All 15 tests pass (5 + 4 + 3 + 3)

- [ ] **Step 3: Verify symlinks resolve**

```bash
ls -la .opencode/commands/prompt-enhance.md 2>/dev/null && echo "PASS: command symlink" || echo "INFO: symlink may need setup"
```

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: prompt-enhance command pack — all files created and verified"
```

---

## Execution Order

Tasks are mostly sequential with some parallelism:

```
Task 1 (dirs) → Task 2-5 (tools, parallel) → Task 6 (plugin) → Task 7-12 (agents, parallel) → Task 13 (command) → Task 14 (workflow) → Task 15-16 (docs) → Task 17 (verify)
```

**Recommended order:** 1 → 2,3,4,5 (parallel) → 6 → 7,8,9,10,11,12 (parallel) → 13 → 14 → 15 → 16 → 17

---

## Verification

After all tasks complete:

```bash
# All agents have valid frontmatter
for agent in prompt-skimmer prompt-analyzer context-mapper risk-assessor context-purifier prompt-repackager; do
  echo "=== $agent ==="
  head -8 ".hivefiver-meta-builder/agents-lab/active/refactoring/${agent}.md"
  echo ""
done

# All tools export correctly
grep -l "export const" .opencode/tools/*.ts

# Plugin has both hooks
grep -c "session.compacted\|experimental.session.compacting" .opencode/plugins/prompt-enhance.ts

# Command references workflow
grep "prompt-enhance.md" .hivefiver-meta-builder/commands-lab/active/refactoring/prompt-enhance.md
```
