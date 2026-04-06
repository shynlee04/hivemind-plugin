# Prompt-Enhance Command Pack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `/hf-prompt-enhance` as a thin command + workflow-driven prompt-enhancement pipeline that reuses the working tool baseline, adds the missing analysis/orchestration pieces, and fixes the audit findings.

**Architecture:** Keep the flow thin and layered: `/hf-prompt-enhance` command → workflow/orchestrator → Phase 0 skim → bridge → investigation lanes → clarification gate → final assembly. The orchestrator is the only writer to `.hivemind/state/session-context-prompt.md`; custom tools do the computation; subagents return structured results only.

**Tech Stack:** Markdown command/workflow/agent definitions, TypeScript custom tools, OpenCode plugin hooks, vitest, existing `safeTool(...)` wrapper

---

## Current Repo Baseline

Treat these as working baseline. Do **not** recreate them from scratch, do **not** replace them with new APIs, and do **not** “fix” the prompt-skim test back to seven words:

- Existing tools:
  - `.opencode/tools/prompt-skim.ts`
  - `.opencode/tools/context-budget.ts`
  - `.opencode/tools/session-patch.ts`
  - `.opencode/tools/safe-tool.ts`
- Existing tests:
  - `tests/tools/prompt-skim.test.ts`
  - `tests/tools/context-budget.test.ts`
  - `tests/tools/session-patch.test.ts`
  - `tests/tools/safe-tool.test.ts`
- Existing state marker:
  - `.hivemind/state/.gitkeep`

## Remaining Delta

Only plan the missing pieces and the required touch points:

- Create: `.opencode/tools/prompt-analyze.ts`
- Create: `tests/tools/prompt-analyze.test.ts`
- Create: `.opencode/plugins/prompt-enhance.ts`
- Create: `.hivefiver-meta-builder/commands-lab/active/refactoring/prompt-enhance.md`
- Create: `.hivefiver-meta-builder/workflows-lab/active/refactoring/prompt-enhance.md`
- Create: `.hivefiver-meta-builder/agents-lab/active/refactoring/prompt-skimmer.md`
- Create: `.hivefiver-meta-builder/agents-lab/active/refactoring/prompt-analyzer.md`
- Create: `.hivefiver-meta-builder/agents-lab/active/refactoring/context-mapper.md`
- Create: `.hivefiver-meta-builder/agents-lab/active/refactoring/risk-assessor.md`
- Create: `.hivefiver-meta-builder/agents-lab/active/refactoring/context-purifier.md`
- Create: `.hivefiver-meta-builder/agents-lab/active/refactoring/prompt-repackager.md`
- Modify: `.hivefiver-meta-builder/AGENTS.md`
- Modify: `.hivefiver-meta-builder/agents-lab/active/refactoring/hivefiver-orchestrator.md`
- Ensure runtime patch directory exists before writes: `.hivemind/state/.patches/`

## Non-Negotiable Corrections

- Use `safeTool(...)` for custom tools. Do not introduce `tool({ parameters: ... })` directly.
- Follow the repo plugin pattern: `import type { Plugin } from "@opencode-ai/plugin"` + `export const PromptEnhancePlugin: Plugin = async () => ({ event: async () => {}, "experimental.session.compacting": async () => {} })`. Do not use `definePlugin`.
- Do not use unsupported `@if` command syntax.
- **Single-writer contract**: The orchestrator (workflow) is the **sole writer** to `.hivemind/state/session-content-prompt.md` session content sections (`## What Happened So Far`, `## Identified Risks`, `## Task List`, `## Deferred Items`, `## Clarification Log`, `## Final Output`). The plugin (`prompt-enhance.ts`) may only maintain frontmatter lifecycle metadata (`patch_count`, `compaction_count`, `context_budget_pct`, `status`) needed for compaction/accounting. Lane agents and repackager return structured content only — they never write session state.
- The workflow calls `prompt-skim`, `prompt-analyze`, `context-budget`, and `session-patch` for computation or patching. Prompt bodies do not duplicate that logic.
- Session state patches must target markdown headings: `## What Happened So Far`, `## Identified Risks`, `## Task List`, `## Deferred Items`, `## Clarification Log`, and `## Final Output`.
- Use repo commit messages: `phase: what changed — why it matters`.
- Preserve the final output contract: YAML frontmatter + XML-tagged sections.
- Preserve the CI-safe clarification fallback.
- Treat `.hivefiver-meta-builder/**-lab/active/refactoring/` as the source of truth. `.opencode/commands`, `.opencode/hivefiver/workflows`, and `.opencode/agents` are directory symlinks that must be verified, not duplicated.

---

## File Map

| File | Responsibility |
|---|---|
| `.opencode/tools/prompt-analyze.ts` | New text-analysis tool built with `safeTool(...)` |
| `tests/tools/prompt-analyze.test.ts` | Coverage for contradictions, vagueness, missing scope, absolute claims, and clarity scoring |
| `.opencode/plugins/prompt-enhance.ts` | Session bootstrap + compaction hook support for prompt-enhance state |
| `.hivefiver-meta-builder/commands-lab/active/refactoring/prompt-enhance.md` | Thin `/hf-prompt-enhance` shell that points at workflow |
| `.hivefiver-meta-builder/workflows-lab/active/refactoring/prompt-enhance.md` | Orchestration logic for skim/bridge/lanes/clarification/final assembly |
| `.hivefiver-meta-builder/agents-lab/active/refactoring/prompt-skimmer.md` | Phase 0 skim agent |
| `.hivefiver-meta-builder/agents-lab/active/refactoring/prompt-analyzer.md` | Deep text-quality lane |
| `.hivefiver-meta-builder/agents-lab/active/refactoring/context-mapper.md` | Repo-grounding lane |
| `.hivefiver-meta-builder/agents-lab/active/refactoring/risk-assessor.md` | Safety/risk lane |
| `.hivefiver-meta-builder/agents-lab/active/refactoring/context-purifier.md` | Distillation lane |
| `.hivefiver-meta-builder/agents-lab/active/refactoring/prompt-repackager.md` | Final assembly lane returning the YAML+XML payload |
| `.hivefiver-meta-builder/AGENTS.md` | Register command + six agents |
| `.hivefiver-meta-builder/agents-lab/active/refactoring/hivefiver-orchestrator.md` | Route prompt-enhancement requests to the new workflow |

---

### Task 1: Verify baseline and add the missing `prompt-analyze` tool

**Files:**
- Create: `.opencode/tools/prompt-analyze.ts`
- Create: `tests/tools/prompt-analyze.test.ts`
- Verify only: `.opencode/tools/prompt-skim.ts`
- Verify only: `tests/tools/prompt-skim.test.ts`
- Verify only: `.opencode/tools/context-budget.ts`
- Verify only: `.opencode/tools/session-patch.ts`
- Verify only: `.opencode/tools/safe-tool.ts`

- [ ] **Step 1: Run the baseline tool tests before adding anything**

Run: `npx vitest run tests/tools/prompt-skim.test.ts tests/tools/context-budget.test.ts tests/tools/session-patch.test.ts tests/tools/safe-tool.test.ts`
Expected: PASS. `prompt-skim` keeps `word_count === 6` for `"Hello world\nThis is a test"`.

- [ ] **Step 2: Write the failing `prompt-analyze` test first**

```typescript
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
```

- [ ] **Step 3: Run the new test to confirm failure**

Run: `npx vitest run tests/tools/prompt-analyze.test.ts`
Expected: FAIL because `.opencode/tools/prompt-analyze.ts` does not exist yet.

- [ ] **Step 4: Implement the new tool with the repo wrapper pattern**

```typescript
// @ts-nocheck — plugin types expect Zod v3 shapes; we have Zod v4 installed
import { z } from "zod";
import { safeTool } from "./safe-tool.ts";

type FindingType = "absolute_claim" | "vagueness" | "missing_scope" | "contradiction";
type Severity = "critical" | "important" | "minor";

type Finding = {
  line: number;
  text: string;
  type: FindingType;
  severity: Severity;
  suggestion: string;
};

const absolutePattern = /\b(MUST|NEVER|ALWAYS|REQUIRED|FORBIDDEN|DO NOT)\b/gi;
const vaguePattern = /\b(some|various|etc\.?|somehow|maybe|perhaps|things|stuff)\b/gi;
const missingScopePattern = /\b(build|create|fix|update|change|improve)\s+(this|that|it|everything|all)\b/i;
const contradictionPairs: Array<[RegExp, RegExp]> = [
  [/\b(use|enable|include|add)\b/i, /\b(do not use|disable|exclude|remove)\b/i],
  [/\b(always|must)\b/i, /\b(never|must not|do not)\b/i],
];

export const promptAnalyze = safeTool({
  description: "Analyze prompt content for contradictions, vagueness, missing scope, and clarity signals",
  args: {
    content: z.string().describe("Prompt text to analyze"),
  },
  execute: async ({ content }) => {
    const lines = content.split("\n");
    const findings: Finding[] = [];

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const trimmed = line.trim();

      if (!trimmed) {
        return;
      }

      if (absolutePattern.test(trimmed)) {
        findings.push({
          line: lineNumber,
          text: trimmed,
          type: "absolute_claim",
          severity: "minor",
          suggestion: "Keep hard requirements only where they are truly non-negotiable.",
        });
      }

      absolutePattern.lastIndex = 0;

      if (vaguePattern.test(trimmed)) {
        findings.push({
          line: lineNumber,
          text: trimmed,
          type: "vagueness",
          severity: "important",
          suggestion: "Replace vague wording with explicit files, outcomes, or constraints.",
        });
      }

      vaguePattern.lastIndex = 0;

      if (missingScopePattern.test(trimmed)) {
        findings.push({
          line: lineNumber,
          text: trimmed,
          type: "missing_scope",
          severity: "critical",
          suggestion: "Name the exact file, component, command, or workflow being changed.",
        });
      }

      const hasContradiction = contradictionPairs.some(([left, right]) => left.test(trimmed) && right.test(trimmed));

      if (hasContradiction) {
        findings.push({
          line: lineNumber,
          text: trimmed,
          type: "contradiction",
          severity: "important",
          suggestion: "Split conflicting requirements or choose one instruction path before execution.",
        });
      }
    });

    const nonEmptyLineCount = lines.filter((line) => line.trim().length > 0).length;
    const uniqueIssueLines = new Set(findings.map((finding) => finding.line)).size;
    const clarityScore = Math.max(0, Math.round(100 - (uniqueIssueLines / Math.max(1, nonEmptyLineCount)) * 100));

    return {
      findings,
      finding_count: findings.length,
      by_severity: {
        critical: findings.filter((finding) => finding.severity === "critical").length,
        important: findings.filter((finding) => finding.severity === "important").length,
        minor: findings.filter((finding) => finding.severity === "minor").length,
      },
      clarity_score: clarityScore,
    };
  },
});
```

- [ ] **Step 5: Run the focused tool tests**

Run: `npx vitest run tests/tools/prompt-analyze.test.ts tests/tools/prompt-skim.test.ts`
Expected: PASS. The new analyzer passes, and the prompt-skim baseline still reports 6 words.

- [ ] **Step 6: Commit**

```bash
git add .opencode/tools/prompt-analyze.ts tests/tools/prompt-analyze.test.ts
git commit -m "phase: add prompt-analyze tool — fill the only missing custom analysis primitive"
```

---

### Task 2: Add prompt-enhance plugin state support without changing the harness plugin pattern

**Files:**
- Create: `.opencode/plugins/prompt-enhance.ts`

- [ ] **Step 1: Write the plugin with the current repo export style**

```typescript
import type { Plugin } from "@opencode-ai/plugin";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const STATE_FILE = ".hivemind/state/session-context-prompt.md";

function ensurePromptEnhanceState(workspaceRoot: string) {
  const sessionFilePath = join(workspaceRoot, STATE_FILE);
  const patchesDirPath = join(dirname(sessionFilePath), ".patches");

  mkdirSync(dirname(sessionFilePath), { recursive: true });
  mkdirSync(patchesDirPath, { recursive: true });

  if (!existsSync(sessionFilePath)) {
    writeFileSync(
      sessionFilePath,
      `---\npatch_count: 0\ncompaction_count: 0\ncontext_budget_pct: 100\nstatus: idle\n---\n\n## What Happened So Far\nSession initialized.\n\n## Identified Risks\nNone yet.\n\n## Task List\nNone yet.\n\n## Deferred Items\nNone yet.\n\n## Clarification Log\nNone yet.\n\n## Final Output\nPending.\n`
    );
  }

  return { sessionFilePath, patchesDirPath };
}

export const PromptEnhancePlugin: Plugin = async () => {
  return {
    event: async () => {
      ensurePromptEnhanceState(process.cwd());
    },

    "experimental.session.compacting": async (_input, output) => {
      const { sessionFilePath } = ensurePromptEnhanceState(process.cwd());
      const current = readFileSync(sessionFilePath, "utf-8");
      const countMatch = current.match(/^compaction_count:\s*(\d+)/m);
      const currentCount = countMatch ? Number.parseInt(countMatch[1], 10) : 0;
      const nextCount = currentCount + 1;
      const nextBudget = Math.max(0, 100 - nextCount * 15);

      const updated = current
        .replace(/^compaction_count:\s*\d+/m, `compaction_count: ${nextCount}`)
        .replace(/^context_budget_pct:\s*\d+/m, `context_budget_pct: ${nextBudget}`);

      writeFileSync(sessionFilePath, updated);

      const sessionSnapshot = updated.length > 4000
        ? `${updated.slice(0, 4000)}\n\n[truncated session snapshot]`
        : updated;

      output.context = Array.isArray(output.context) ? output.context : [];
      output.context.push(
        [
          "## Prompt-Enhance Session Context",
          `Session file: ${sessionFilePath}`,
          "",
          "```md",
          sessionSnapshot,
          "```",
        ].join("\n")
      );
    },
  };
};
```

- [ ] **Step 2: Type-check the plugin file in project context**

Run: `npm run typecheck`
Expected: PASS. No `definePlugin`, no unsupported imports, no type errors introduced by the new plugin.

- [ ] **Step 3: Commit**

```bash
git add .opencode/plugins/prompt-enhance.ts
git commit -m "phase: add prompt-enhance plugin shell — initialize state and compaction metadata safely"
```

---

### Task 3: Create the thin command and the workflow that uses tools for computation

**Files:**
- Create: `.hivefiver-meta-builder/commands-lab/active/refactoring/prompt-enhance.md`
- Create: `.hivefiver-meta-builder/workflows-lab/active/refactoring/prompt-enhance.md`

- [ ] **Step 1: Write the thin command file**

```markdown
---
description: "Enhance, audit, or repack a prompt through skim, investigation lanes, clarification gating, and structured final assembly. Triggers: 'enhance this prompt', 'audit this prompt', 'repack this prompt'."
agent: hivefiver-orchestrator
subtask: true
---

<objective>
Run the prompt-enhancement workflow without embedding business logic in the command body.
</objective>

<execution_context>
@.opencode/hivefiver/workflows/prompt-enhance.md
</execution_context>

<context>
$ARGUMENTS
</context>

<process>
Execute the prompt-enhance workflow end-to-end.
Keep the command thin.
Initialize `.hivemind/state/session-context-prompt.md` and `.hivemind/state/.patches/` if missing.
Do not use unsupported `@if` syntax.
</process>
```

- [ ] **Step 2: Write the workflow with tool-driven computation and a single session-state writer**

```markdown
# Prompt-Enhance Workflow

## Objective
Enhance a prompt through a layered pipeline while keeping all computation in tools and all session-state writes in the orchestrator.

## Session State Contract
- Session file (absolute): `join(process.cwd(), '.hivemind/state/session-context-prompt.md')` — always resolved as an absolute path; never relative.
- Patch directory (absolute): `join(process.cwd(), '.hivemind/state/.patches/')` — always resolved as an absolute path.
- Sole writer: orchestrator via `session-patch` with explicit `sessionFilePath: join(process.cwd(), '.hivemind/state/session-context-prompt.md')` on every call.
- Lane agents return structured markdown or YAML only

## Phase 0: Skim
1. Call `prompt-skim` with the raw user prompt and workspace root.
2. Call `context-budget` with `sessionFilePath: join(process.cwd(), '.hivemind/state/session-context-prompt.md')` (absolute path).
3. Dispatch `prompt-skimmer` with the raw prompt plus the `prompt-skim` and `context-budget` outputs; it returns the Phase 0 summary only.
4. Patch `## What Happened So Far` with that delegated skim summary.

## Bridge
Use the skim result and budget result to choose lanes:

| Condition | Lanes |
|---|---|
| `complexity_score <= 3` | `prompt-analyzer`, `prompt-repackager` |
| `complexity_score >= 4 && complexity_score <= 6` | `prompt-analyzer`, `context-mapper`, `prompt-repackager` |
| `complexity_score >= 7` | `prompt-analyzer`, `context-mapper`, `risk-assessor`, `context-purifier`, `prompt-repackager` |

If `budget_pct < 50`, force all investigative work into subagents and skip optional deepening.

## Investigation Lanes

### prompt-analyzer
Dispatch the `prompt-analyzer` agent with:
- original prompt text
- skim summary
- instruction to return findings only

In parallel with any other bridge-selected lanes, also call `prompt-analyze` directly so the workflow gets deterministic scoring for the clarification gate.

### context-mapper
Dispatch the `context-mapper` agent with the original prompt text, skim output, and instructions to verify only cited files or symbols.

### risk-assessor
Dispatch the `risk-assessor` agent with the original prompt text and instruction to return only structured risks and mitigations.

### context-purifier
Dispatch the `context-purifier` agent only for high-complexity or high-flooding prompts.

## Clarification Gate
Build the clarification list from:
- `prompt-analyze` findings
- lane agent findings

Interactive mode:
- ask only the unresolved, execution-blocking questions
- patch `## Clarification Log` after each answer

CI-safe fallback:
- if `CI=true`, or no interactive question flow is available, skip questions
- append unresolved assumptions to `## Deferred Items` as `unverified — review recommended`

## Final Assembly
Dispatch `prompt-repackager` with:
- original prompt
- skim output
- `prompt-analyze` output
- lane results
- clarification decisions or CI fallback assumptions

The repackager returns a single payload with YAML frontmatter and these XML sections:
- `<enhanced_prompt>`
- `<what_happened_so_far>`
- `<identified_risks>`
- `<task_list>`
- `<deferred_items>`

Patch `## Final Output` with that payload using `session-patch` with explicit `sessionFilePath: join(process.cwd(), '.hivemind/state/session-context-prompt.md')`.
Patch `## Identified Risks`, `## Task List`, and `## Deferred Items` with the synthesized final sections, each via `session-patch` with the same absolute `sessionFilePath` argument.
```

- [ ] **Step 3: Verify the command and workflow render correctly**

Run: `npx vitest run tests/tools/prompt-analyze.test.ts && python - <<'PY'
from pathlib import Path
for path in [
    Path('.hivefiver-meta-builder/commands-lab/active/refactoring/prompt-enhance.md'),
    Path('.hivefiver-meta-builder/workflows-lab/active/refactoring/prompt-enhance.md'),
]:
    text = path.read_text()
    assert 'prompt-enhance' in text
    assert '@if' not in text
assert Path('.opencode/commands').is_symlink()
assert Path('.opencode/hivefiver/workflows').is_symlink()
assert 'subtask: true' in Path('.hivefiver-meta-builder/commands-lab/active/refactoring/prompt-enhance.md').read_text()
print('PASS')
PY`
Expected: PASS. The command/workflow mention the prompt-enhance flow and contain no `@if`.

- [ ] **Step 4: Commit**

```bash
git add .hivefiver-meta-builder/commands-lab/active/refactoring/prompt-enhance.md .hivefiver-meta-builder/workflows-lab/active/refactoring/prompt-enhance.md
git commit -m "phase: add prompt-enhance command and workflow — keep orchestration thin and tool-driven"
```

---

### Task 4: Add the six prompt-enhancement agents with structured-output-only contracts

**Files:**
- Create: `.hivefiver-meta-builder/agents-lab/active/refactoring/prompt-skimmer.md`
- Create: `.hivefiver-meta-builder/agents-lab/active/refactoring/prompt-analyzer.md`
- Create: `.hivefiver-meta-builder/agents-lab/active/refactoring/context-mapper.md`
- Create: `.hivefiver-meta-builder/agents-lab/active/refactoring/risk-assessor.md`
- Create: `.hivefiver-meta-builder/agents-lab/active/refactoring/context-purifier.md`
- Create: `.hivefiver-meta-builder/agents-lab/active/refactoring/prompt-repackager.md`

- [ ] **Step 1: Write `prompt-skimmer.md`**

```markdown
---
name: "prompt-skimmer"
description: "Phase 0 skim agent for prompt enhancement. Use when you need a fast scan before deeper analysis."
mode: subagent
temperature: 0.1
instruction: [.opencode/rules/*.md]
permission:
  read: allow
  glob: allow
  grep: allow
  bash:
    "git ls-files*": allow
  task: deny
---

Return a skim summary only. Do not write files. Do not ask questions. Do not spawn subagents.
```

- [ ] **Step 2: Write `prompt-analyzer.md`**

```markdown
---
name: "prompt-analyzer"
description: "Deep prompt-analysis lane for contradictions, vagueness, missing scope, and clarity issues."
mode: subagent
temperature: 0.1
instruction: [.opencode/rules/*.md]
permission:
  read: allow
  grep: allow
  task: deny
---

Return findings only with line references, severity, and suggestions. Do not write session state.
```

- [ ] **Step 3: Write `context-mapper.md`**

```markdown
---
name: "context-mapper"
description: "Ground prompt references against the current repository and report dead or stale references."
mode: subagent
temperature: 0.1
instruction: [.opencode/rules/*.md]
permission:
  read: allow
  glob: allow
  grep: allow
  bash:
    "git ls-files*": allow
  task: deny
---

Return verified references, dead references, and stale assumptions only. Do not patch session files.
```

- [ ] **Step 4: Write `risk-assessor.md`**

```markdown
---
name: "risk-assessor"
description: "Safety lane for prompt enhancement. Flags destructive, security, and scope-creep risks."
mode: subagent
temperature: 0.1
instruction: [.opencode/rules/*.md]
permission:
  read: allow
  grep: allow
  task: deny
---

Return risk entries with severity and mitigation only. Never execute or suggest forceful operations as defaults.
```

- [ ] **Step 5: Write `context-purifier.md`**

```markdown
---
name: "context-purifier"
description: "Distillation lane for prompt enhancement. Compresses noisy prompts without changing intent."
mode: subagent
temperature: 0.1
instruction: [.opencode/rules/*.md]
permission:
  read: allow
  grep: allow
  task: deny
---

Return a reduced prompt candidate plus preserved constraints. Do not modify any files.
```

- [ ] **Step 6: Write `prompt-repackager.md`**

```markdown
---
name: "prompt-repackager"
description: "Final assembly lane for prompt enhancement. Returns the enhanced prompt payload with YAML frontmatter and XML-tagged sections."
mode: subagent
temperature: 0.2
instruction: [.opencode/rules/*.md]
permission:
  read: allow
  task: deny
---

Return one final payload only. Do not write session state.

Required output:

---
enhanced_prompt_version: 1
source_mode: auto|enhance|repack|audit
lanes_executed: []
clarifications_resolved: 0
confidence_score: 0.0
context_budget_at_start: 100
context_budget_at_end: 100
---

<enhanced_prompt>
Rewrite the user prompt with clearer scope, verified references, and preserved intent.
</enhanced_prompt>

<what_happened_so_far>
Phase 0 skim ran, bridge selected lanes, clarification decisions were applied, and the prompt was repackaged.
</what_happened_so_far>

<identified_risks>
List only the confirmed prompt risks and their mitigations, or state that no significant risks were found.
</identified_risks>

<task_list>
List the active tasks implied by the enhanced prompt in execution order.
</task_list>

<deferred_items>
List CI-fallback assumptions, unresolved clarifications, or intentionally deferred follow-ups.
</deferred_items>
```

- [ ] **Step 7: Verify frontmatter and output-contract presence**

Run: `python - <<'PY'
from pathlib import Path
files = [
  Path('.hivefiver-meta-builder/agents-lab/active/refactoring/prompt-skimmer.md'),
  Path('.hivefiver-meta-builder/agents-lab/active/refactoring/prompt-analyzer.md'),
  Path('.hivefiver-meta-builder/agents-lab/active/refactoring/context-mapper.md'),
  Path('.hivefiver-meta-builder/agents-lab/active/refactoring/risk-assessor.md'),
  Path('.hivefiver-meta-builder/agents-lab/active/refactoring/context-purifier.md'),
  Path('.hivefiver-meta-builder/agents-lab/active/refactoring/prompt-repackager.md'),
]
for path in files:
    text = path.read_text()
    assert text.startswith('---\n')
assert Path('.opencode/agents').is_symlink()
assert '<enhanced_prompt>' in files[-1].read_text()
print('PASS')
PY`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add .hivefiver-meta-builder/agents-lab/active/refactoring/prompt-skimmer.md .hivefiver-meta-builder/agents-lab/active/refactoring/prompt-analyzer.md .hivefiver-meta-builder/agents-lab/active/refactoring/context-mapper.md .hivefiver-meta-builder/agents-lab/active/refactoring/risk-assessor.md .hivefiver-meta-builder/agents-lab/active/refactoring/context-purifier.md .hivefiver-meta-builder/agents-lab/active/refactoring/prompt-repackager.md
git commit -m "phase: add prompt-enhancement agents — keep lane output structured and side-effect free"
```

---

### Task 5: Register the new flow in Hivefiver metadata and routing

**Files:**
- Modify: `.hivefiver-meta-builder/AGENTS.md`
- Modify: `.hivefiver-meta-builder/agents-lab/active/refactoring/hivefiver-orchestrator.md`

- [ ] **Step 1: Update `.hivefiver-meta-builder/AGENTS.md`**

Add the six agents to the specialist table and add the command entry:

```markdown
| **prompt-skimmer** | `agents-lab/active/refactoring/prompt-skimmer.md` | Phase 0 skim for prompt-enhancement routing. |
| **prompt-analyzer** | `agents-lab/active/refactoring/prompt-analyzer.md` | Deep text-quality lane for prompts. |
| **context-mapper** | `agents-lab/active/refactoring/context-mapper.md` | Grounds prompt references in repo reality. |
| **risk-assessor** | `agents-lab/active/refactoring/risk-assessor.md` | Flags destructive, security, and scope risks. |
| **context-purifier** | `agents-lab/active/refactoring/context-purifier.md` | Distills noisy prompts without changing intent. |
| **prompt-repackager** | `agents-lab/active/refactoring/prompt-repackager.md` | Produces the final YAML+XML enhanced prompt payload. |
```

```markdown
| `/hf-prompt-enhance` | hivefiver-orchestrator | Enhance, audit, or repack prompts via skim → bridge → lanes → assembly |
```

- [ ] **Step 2: Update orchestrator routing**

Add a prompt-enhancement row to the routing table and make the control rule explicit:

```markdown
| "enhance this prompt" / "audit this prompt" / "repack this prompt" | `prompt-enhance` workflow | self (orchestrate lanes, own session-state writes) |
```

Also add one line under the execution flow: `For prompt-enhancement work, the orchestrator patches session state; subagents return structured results only.`

- [ ] **Step 3: Verify both metadata files mention the new flow**

Run: `python - <<'PY'
from pathlib import Path
agents = Path('.hivefiver-meta-builder/AGENTS.md').read_text()
orch = Path('.hivefiver-meta-builder/agents-lab/active/refactoring/hivefiver-orchestrator.md').read_text()
assert '/hf-prompt-enhance' in agents
assert 'prompt-repackager' in agents
assert 'enhance this prompt' in orch
assert 'session-state writes' in orch
print('PASS')
PY`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add .hivefiver-meta-builder/AGENTS.md .hivefiver-meta-builder/agents-lab/active/refactoring/hivefiver-orchestrator.md
git commit -m "phase: register prompt-enhance flow — route the new command and lane agents correctly"
```

---

### Task 6: Run end-to-end verification for the prompt-enhance slice

- [ ] **Step 1: Run the tool test suite**

Run: `npx vitest run tests/tools`
Expected: PASS. Existing tests still pass, including `prompt-skim` word count of 6, and the new `prompt-analyze` tests cover contradictions as well.

- [ ] **Step 2: Run repository typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Verify required files and runtime state paths**

Run: `python - <<'PY'
from pathlib import Path
required = [
  '.opencode/tools/prompt-analyze.ts',
  'tests/tools/prompt-analyze.test.ts',
  '.opencode/plugins/prompt-enhance.ts',
  '.hivefiver-meta-builder/commands-lab/active/refactoring/prompt-enhance.md',
  '.hivefiver-meta-builder/workflows-lab/active/refactoring/prompt-enhance.md',
  '.hivefiver-meta-builder/agents-lab/active/refactoring/prompt-skimmer.md',
  '.hivefiver-meta-builder/agents-lab/active/refactoring/prompt-analyzer.md',
  '.hivefiver-meta-builder/agents-lab/active/refactoring/context-mapper.md',
  '.hivefiver-meta-builder/agents-lab/active/refactoring/risk-assessor.md',
  '.hivefiver-meta-builder/agents-lab/active/refactoring/context-purifier.md',
  '.hivefiver-meta-builder/agents-lab/active/refactoring/prompt-repackager.md',
]
for item in required:
    assert Path(item).exists(), item
assert Path('.opencode/agents').is_symlink()
assert Path('.opencode/commands').is_symlink()
assert Path('.opencode/hivefiver/workflows').is_symlink()
assert Path('.hivemind/state/.gitkeep').exists()
print('PASS')
PY`
Expected: PASS.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "phase: verify prompt-enhance slice — confirm tool, workflow, agent, and metadata integration"
```

---

## Execution Order

```text
Task 1 → Task 2 → Task 3 → Task 4 → Task 5 → Task 6
```

This stays intentionally linear because the workflow and metadata depend on the new tool and agent contracts being settled first.

---

## Self-Review

### Spec coverage
- Thin `/hf-prompt-enhance` command preserved, using symlinked workflow path `@.opencode/hivefiver/workflows/prompt-enhance.md`: Task 3
- Workflow/orchestrator → skim → bridge → lanes → clarification gate → final assembly preserved: Task 3
- Session state path uses explicit absolute paths via `join(process.cwd(), '.hivemind/state/session-context-prompt.md')` on all `context-budget` and `session-patch` calls: Tasks 2 and 3
- **Single-writer contract**: orchestrator is sole writer of session content sections; plugin maintains frontmatter lifecycle metadata only (`patch_count`, `compaction_count`, `context_budget_pct`, `status`): Non-Negotiable Corrections + Task 2
- Custom tool set preserved (`prompt-skim`, `prompt-analyze`, `context-budget`, `session-patch`): Tasks 1 and 3
- YAML frontmatter + XML-tagged final output preserved: Task 4 (`prompt-repackager`) and Task 3 (workflow patching)
- CI-safe clarification fallback preserved: Task 3
- Existing working tools/tests treated as baseline, not scratch work: baseline section + Task 1
- Audit corrections encoded (`safeTool`, no `definePlugin`, no `@if`, absolute-path tool invocations, orchestrator-only session writes, heading-based session patches, lab-source-of-truth + symlink verification, compaction context injection via normalized `output.context`, corrected command entrypoint, prompt-skim baseline stays at 6 words): non-negotiable corrections + affected tasks

### Placeholder scan
- No `TODO`, `TBD`, `implement later`, or “similar to above” placeholders remain.
- Every file path is explicit.
- Every task includes concrete commands and expected outcomes.

### Consistency check
- Plugin pattern matches current repo style (`Plugin` export, not `definePlugin`).
- Tool pattern matches current repo style (`safeTool(...)`, `args`, `execute`).
- Command structure matches the existing Hivefiver command style (`<objective>`, `<execution_context>`, `<context>`, `<process>`).
- Session-state ownership is consistent: orchestrator patches session content sections via `session-patch` with absolute `sessionFilePath`; plugin only touches frontmatter lifecycle metadata; agents only return structured results.
- All `context-budget` and `session-patch` invocations specify absolute paths via `join(process.cwd(), '.hivemind/state/session-context-prompt.md')`.
- Command references the symlinked workflow at `@.opencode/hivefiver/workflows/prompt-enhance.md`, not a worktree-pinned absolute path.

---

Plan complete and saved to `.hivefiver-meta-builder/plans/prompt-enhance-implementation-plan-2026-04-06.md`. Two execution options:

**1. Subagent-Driven (recommended)** - dispatch a fresh subagent per task, review between tasks

**2. Inline Execution** - execute tasks in one session with checkpoints

Which approach?
