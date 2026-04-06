# Harness Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 8 confirmed bugs, consolidate duplicate code, and gate noisy hooks — resulting in a functional harness where every component helps an AI agent complete its workflow.

**Architecture:** 5 sequential phases: consolidate dead code → fix critical bugs → fix functional bugs → rebuild models → verify zero regressions. Each phase is a self-contained, testable increment.

**Tech Stack:** TypeScript (ES2022, strict, verbatimModuleSyntax), OpenCode SDK (`@opencode-ai/plugin`), Zod (via `tool.schema`), vitest.

---

## File Map

| File | Phase | Action |
|------|-------|--------|
| `.opencode/tools/prompt-skim.ts` | 1 | DELETE |
| `.opencode/tools/prompt-analyze.ts` | 1 | DELETE |
| `.opencode/tools/context-budget.ts` | 1 | DELETE |
| `.opencode/tools/session-patch.ts` | 1 | DELETE |
| `.opencode/tools/safe-tool.ts` | 1 | DELETE |
| `tests/tools/prompt-skim.test.ts` | 1 | DELETE |
| `tests/tools/prompt-analyze.test.ts` | 1 | DELETE |
| `tests/tools/context-budget.test.ts` | 1 | DELETE |
| `tests/tools/session-patch.test.ts` | 1 | DELETE |
| `tests/tools/safe-tool.test.ts` | 1 | DELETE |
| `tests/plugins/prompt-enhance.test.ts` | 1 | DELETE |
| `tests/tools/prompt-skim-tool.test.ts` | 1 | RENAME → `prompt-skim.test.ts` |
| `tests/tools/prompt-analyze-tool.test.ts` | 1 | RENAME → `prompt-analyze.test.ts` |
| `tests/tools/context-budget-tool.test.ts` | 1 | RENAME → `context-budget.test.ts` |
| `tests/tools/session-patch-tool.test.ts` | 1 | RENAME → `session-patch.test.ts` |
| `src/plugins/prompt-enhance.ts` | 2 | MODIFY — remove double-count, fix regex |
| `src/tools/session-patch/tools.ts` | 2 | MODIFY — anchor regex |
| `.opencode/agents/hivefiver-orchestrator.md` | 2 | MODIFY — fix agent names |
| `src/tools/prompt-analyze/tools.ts` | 3 | MODIFY — cross-line contradictions |
| `src/hooks/system-transform.ts` | 3 | MODIFY — gate by delegation |
| `src/plugin.ts` | 3-4 | MODIFY — remove system-transform wiring, remove event forwarding |
| `src/tools/context-budget/tools.ts` | 4 | MODIFY — rebuild model |
| `src/tools/prompt-skim/tools.ts` | 4 | MODIFY — remove recommended_lanes |
| `tests/plugins/prompt-enhance-fixed.test.ts` | 2-5 | CREATE — corrected compaction test |
| `tests/integration/prompt-enhance-pipeline.test.ts` | 5 | MODIFY — add double-count prevention test |

---

## Phase 1: Consolidate — Delete Dead Code, Establish Clean Baseline

### Task 1.1: Delete `.opencode/tools/` dead duplicates

**Files:**
- DELETE: `.opencode/tools/prompt-skim.ts`
- DELETE: `.opencode/tools/prompt-analyze.ts`
- DELETE: `.opencode/tools/context-budget.ts`
- DELETE: `.opencode/tools/session-patch.ts`
- DELETE: `.opencode/tools/safe-tool.ts`

- [ ] **Step 1: Verify these files are NOT imported anywhere**

Run:
```bash
grep -r "\.opencode/tools/" src/ tests/ --include="*.ts" | grep -v "\.test\.ts"
```
Expected: No matches in `src/`. Matches only in old test files (the ones we'll delete next).

- [ ] **Step 2: Delete all 5 files**

Run:
```bash
rm .opencode/tools/prompt-skim.ts .opencode/tools/prompt-analyze.ts .opencode/tools/context-budget.ts .opencode/tools/session-patch.ts .opencode/tools/safe-tool.ts
```

- [ ] **Step 3: Verify tests that import these files will fail**

Run:
```bash
npm test 2>&1 | grep "FAIL"
```
Expected: 5 test files fail (the ones importing from `.opencode/tools/`).

- [ ] **Step 4: Commit**

```bash
git add -A .opencode/tools/
git commit -m "cleanup: delete .opencode/tools/ dead duplicates

These 5 files are inferior copies of src/tools/ implementations:
- @ts-nocheck vs src/tools/ strict mode
- Raw object returns vs structured envelope
- No schema validation vs Schema.parse()
- Singleton exports vs factory pattern
- Missing fields (verdict, description, old_value, timestamp)

src/tools/ is the canonical source — wired into HarnessControlPlane,
tested with schema validation, and follows the SDK's tool.schema pattern."
```

### Task 1.2: Delete duplicate test files

**Files:**
- DELETE: `tests/tools/prompt-skim.test.ts`
- DELETE: `tests/tools/prompt-analyze.test.ts`
- DELETE: `tests/tools/context-budget.test.ts`
- DELETE: `tests/tools/session-patch.test.ts`
- DELETE: `tests/tools/safe-tool.test.ts`
- DELETE: `tests/plugins/prompt-enhance.test.ts`

- [ ] **Step 1: Delete old test files that imported from `.opencode/tools/`**

Run:
```bash
rm tests/tools/prompt-skim.test.ts tests/tools/prompt-analyze.test.ts tests/tools/context-budget.test.ts tests/tools/session-patch.test.ts tests/tools/safe-tool.test.ts tests/plugins/prompt-enhance.test.ts
```

- [ ] **Step 2: Run tests — only *-tool.test.ts files remain**

Run:
```bash
npm test 2>&1 | tail -10
```
Expected: Tests pass (only `-tool.test.ts` files running), count drops by ~25 tests.

- [ ] **Step 3: Commit**

```bash
git add -A tests/
git commit -m "cleanup: delete duplicate test files

Delete 6 test files that imported from deleted .opencode/tools/:
- tests/tools/prompt-skim.test.ts
- tests/tools/prompt-analyze.test.ts
- tests/tools/context-budget.test.ts
- tests/tools/session-patch.test.ts
- tests/tools/safe-tool.test.ts
- tests/plugins/prompt-enhance.test.ts (masked double-count bug)

Canonical tests (*-tool.test.ts) remain — they test src/tools/
with schema validation, structured envelope, and richer coverage."
```

### Task 1.3: Rename `*-tool.test.ts` → `*.test.ts`

**Files:**
- RENAME: `tests/tools/prompt-skim-tool.test.ts` → `tests/tools/prompt-skim.test.ts`
- RENAME: `tests/tools/prompt-analyze-tool.test.ts` → `tests/tools/prompt-analyze.test.ts`
- RENAME: `tests/tools/context-budget-tool.test.ts` → `tests/tools/context-budget.test.ts`
- RENAME: `tests/tools/session-patch-tool.test.ts` → `tests/tools/session-patch.test.ts`

- [ ] **Step 1: Rename all 4 test files**

Run:
```bash
mv tests/tools/prompt-skim-tool.test.ts tests/tools/prompt-skim.test.ts
mv tests/tools/prompt-analyze-tool.test.ts tests/tools/prompt-analyze.test.ts
mv tests/tools/context-budget-tool.test.ts tests/tools/context-budget.test.ts
mv tests/tools/session-patch-tool.test.ts tests/tools/session-patch.test.ts
```

- [ ] **Step 2: Run tests — all pass**

Run:
```bash
npm test 2>&1 | tail -10
```
Expected: All tests pass, clean naming.

- [ ] **Step 3: Commit**

```bash
git add tests/tools/
git commit -m "cleanup: rename *-tool.test.ts to *.test.ts

Drop the -tool suffix noise now that .opencode/tools/ duplicates
are deleted. Single test file per tool, clean naming."
```

---

## Phase 2: Critical Fixes — HIGH Severity Bugs

### Task 2.1: Fix double-compaction counting

**Files:**
- Modify: `src/plugins/prompt-enhance.ts` — remove `event` hook's `session.compacted` handling
- Create: `tests/plugins/prompt-enhance-compaction.test.ts` — test single-compaction path

- [ ] **Step 1: Read current prompt-enhance.ts**

Read `src/plugins/prompt-enhance.ts` and identify:
- The `event` handler that checks `evt?.["type"] === "session.compacted"` and calls `recordCompaction()`
- The `experimental.session.compacting` handler that also calls `recordCompaction()`
- The `recordCompaction()` helper function

- [ ] **Step 2: Remove the `session.compacted` handling from `event` hook**

Change the `event` handler to ONLY ensure state file exists, NOT call `recordCompaction()`:

```typescript
// BEFORE (in event handler):
event: async (input: unknown) => {
  ensurePromptEnhanceState(process.cwd());
  const evt = (input as { event?: Record<string, unknown> })?.event;
  if (evt?.["type"] === "session.compacted") {
    const { sessionFilePath } = ensurePromptEnhanceState(process.cwd());
    recordCompaction(sessionFilePath);
  }
},

// AFTER:
event: async () => {
  ensurePromptEnhanceState(process.cwd());
},
```

The `experimental.session.compacting` hook remains as the SINGLE compaction path.

- [ ] **Step 3: Write test verifying single-compaction path**

Create `tests/plugins/prompt-enhance-compaction.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { PromptEnhancePlugin } from "../../src/plugins/prompt-enhance.js"

describe("prompt-enhance compaction tracking", () => {
  const testDir = join(tmpdir(), "prompt-enhance-compaction-test")
  const originalCwd = process.cwd()

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true })
    process.chdir(testDir)
  })

  afterEach(() => {
    process.chdir(originalCwd)
    rmSync(testDir, { recursive: true, force: true })
  })

  it("session.compacting hook increments compaction_count by 1", async () => {
    const plugin = await PromptEnhancePlugin()
    const stateFile = join(testDir, ".hivemind/state/session-context-prompt.md")

    // Initialize state file
    mkdirSync(join(testDir, ".hivemind/state"), { recursive: true })
    writeFileSync(stateFile, "---\ncompaction_count: 0\ncontext_budget_pct: 100\n---\n")

    // Trigger session.compacting
    const mockOutput = { context: [] as string[] }
    await (plugin as any)["experimental.session.compacting"]({}, mockOutput)

    const content = readFileSync(stateFile, "utf-8")
    expect(content).toContain("compaction_count: 1")
    expect(content).toContain("context_budget_pct: 85")
  })

  it("event hook does NOT increment compaction for session.compacted events", async () => {
    const plugin = await PromptEnhancePlugin()
    const stateFile = join(testDir, ".hivemind/state/session-context-prompt.md")

    // Initialize state file
    mkdirSync(join(testDir, ".hivemind/state"), { recursive: true })
    writeFileSync(stateFile, "---\ncompaction_count: 0\ncontext_budget_pct: 100\n---\n")

    // Trigger event hook with session.compacted — should NOT increment
    await (plugin as any).event({ event: { type: "session.compacted" } })

    const content = readFileSync(stateFile, "utf-8")
    expect(content).toContain("compaction_count: 0")
    expect(content).toContain("context_budget_pct: 100")
  })

  it("both hooks together do NOT double-count", async () => {
    const plugin = await PromptEnhancePlugin()
    const stateFile = join(testDir, ".hivemind/state/session-context-prompt.md")

    mkdirSync(join(testDir, ".hivemind/state"), { recursive: true })
    writeFileSync(stateFile, "---\ncompaction_count: 0\ncontext_budget_pct: 100\n---\n")

    // Trigger BOTH hooks (simulating what OpenCode does)
    await (plugin as any).event({ event: { type: "session.compacted" } })
    const mockOutput = { context: [] as string[] }
    await (plugin as any)["experimental.session.compacting"]({}, mockOutput)

    const content = readFileSync(stateFile, "utf-8")
    expect(content).toContain("compaction_count: 1")
    expect(content).toContain("context_budget_pct: 85")
    // NOT: compaction_count: 2, budget: 70
  })
})
```

- [ ] **Step 4: Run the new test**

Run:
```bash
npx vitest run tests/plugins/prompt-enhance-compaction.test.ts -v
```
Expected: 3/3 PASS. If the double-count test fails, that means the fix in Step 2 didn't work.

- [ ] **Step 5: Commit**

```bash
git add src/plugins/prompt-enhance.ts tests/plugins/prompt-enhance-compaction.test.ts
git commit -m "fix: eliminate double-compaction counting

Remove session.compacted handling from event hook. Keep only
experimental.session.compacting as the single compaction path.

Before: 1 compaction → count=2, budget=70% (WRONG)
After:  1 compaction → count=1, budget=85% (CORRECT)

Added 3 tests: single increment, event hook no-op, both-hooks no-double."
```

### Task 2.2: Fix session-patch heading corruption

**Files:**
- Modify: `src/tools/session-patch/tools.ts` — anchor regex to line start
- Modify: `tests/tools/session-patch.test.ts` — update test for new output shape

- [ ] **Step 1: Fix the regex anchor**

In `src/tools/session-patch/tools.ts`, find:
```typescript
const headingRegex = new RegExp(
  `(${escapedSection})[\\s\\S]*?(?=\\n## |$)`,
)
```

Change to:
```typescript
const headingRegex = new RegExp(
  `(?:^|\\n)(${escapedSection})[\\s\\S]*?(?=\\n## |$)`,
)
```

This ensures `## [Section]` only matches at line start (after `\n` or `^`), not as a substring inside `### [Section]`.

- [ ] **Step 2: Update the return value to capture the right old_value**

Find:
```typescript
const record: SessionPatchRecord = {
  section: args.section,
  old_value: match[0].replace(args.section, "").trim(),
  ...
}
```

Change to:
```typescript
const record: SessionPatchRecord = {
  section: args.section,
  old_value: match[1].replace(args.section, "").trim(),
  ...
}
```

`match[1]` now captures the section content (since we added a non-capturing group `(?:^|\n)`).

- [ ] **Step 3: Run tests**

Run:
```bash
npx vitest run tests/tools/session-patch.test.ts -v
```
Expected: All tests pass, including the regex-special character test.

- [ ] **Step 4: Commit**

```bash
git add src/tools/session-patch/tools.ts tests/tools/session-patch.test.ts
git commit -m "fix: anchor session-patch regex to line start

## [Section] no longer matches inside ### [Section].
Regex now requires line start: (?:^|\n)(section)[\s\S]*?(?=\n## |$)

Before: patching '## [Special]' corrupted '### [Special]' content
After:  only exact heading-level matches, no corruption"
```

### Task 2.3: Fix orchestrator agent references

**Files:**
- Modify: `.opencode/agents/hivefiver-orchestrator.md` — fix agent names in execution loop

- [ ] **Step 1: Read the execution loop section**

Read `.opencode/agents/hivefiver-orchestrator.md` and find the `## Executing the Prompt-Enhance Pipeline` section.

- [ ] **Step 2: Replace phantom agent names with existing agents**

The execution loop currently references: `prompt-skimmer`, `prompt-analyzer`, `context-mapper`, `risk-assessor`, `prompt-repackager`.

Replace with existing agents:
- `prompt-skimmer` → `researcher`
- `prompt-analyzer` → `critic`
- `context-mapper` → `researcher`
- `risk-assessor` → `critic`
- `prompt-repackager` → `builder`

Update the Task tool calls accordingly:
```
### Phase 0: Skim
1. Call Task tool → agent: researcher, prompt: "Skim this prompt...

### Investigation Lanes (parallel)
1. Task → agent: critic, prompt: "Analyze this prompt...
2. Task → agent: researcher, prompt: "Map this prompt's context...
3. Task → agent: critic, prompt: "Assess safety and risk...

### Phase: Repackage
1. Task → agent: builder, prompt: "Repackage this prompt...
```

- [ ] **Step 3: Commit**

```bash
git add .opencode/agents/hivefiver-orchestrator.md
git commit -m "fix: orchestrator references existing agents only

Replace phantom agent names (prompt-skimmer, prompt-analyzer,
context-mapper, risk-assessor, prompt-repackager) with existing
agents: researcher, critic, builder.

Before: Task tool calls would fail with 'unknown agent'
After:  all Task calls route to defined agents with task: allow"
```

---

## Phase 3: Functional Fixes — MEDIUM Severity Bugs

### Task 3.1: Gate system-transform by delegation metadata

**Files:**
- Modify: `src/hooks/system-transform.ts` — add delegation check
- Modify: `src/plugin.ts` — update hook wiring

- [ ] **Step 1: Gate the transform**

In `src/hooks/system-transform.ts`, add:

```typescript
import { getDelegationMeta } from "../lib/state.js"

/**
 * Transforms the system prompt by injecting the prompt-enhance output
 * contract ONLY for sessions with prompt-enhance delegation metadata.
 *
 * @param systemPrompt - The current system prompt text
 * @param sessionID - Current session identifier
 * @returns The transformed system prompt (unchanged if not prompt-enhance)
 */
export function transformSystemPrompt(systemPrompt: string, sessionID?: string): string {
  // Gate: only inject for sessions with delegation metadata
  if (!sessionID) {
    return systemPrompt
  }
  try {
    const delegation = getDelegationMeta(sessionID)
    // If no delegation meta, this is a normal session — no contract needed
    if (!delegation || !delegation.agent) {
      return systemPrompt
    }
  } catch {
    // Continuity not initialized yet — skip injection
    return systemPrompt
  }

  return `${systemPrompt}\n\n${CONTRACT_TEMPLATE}`
}
```

- [ ] **Step 2: Update the hook in plugin.ts**

Find the `system.transform` hook in `src/plugin.ts` and update it to pass `sessionID`:

```typescript
"system.transform": async (input: { sessionID?: string }, output: { systemPrompt: string }) => {
  const sessionID = input.sessionID
  output.systemPrompt = transformSystemPrompt(output.systemPrompt, sessionID)
},
```

- [ ] **Step 3: Add a test for gating behavior**

Add to `tests/integration/prompt-enhance-pipeline.test.ts`:

```typescript
it("system-transform injects zero text for non-delegated sessions", () => {
  // No delegation meta set — transform should return unchanged
  const result = transformSystemPrompt("You are a helper.", undefined)
  expect(result).toBe("You are a helper.")
})
```

- [ ] **Step 4: Run tests**

Run:
```bash
npm test 2>&1 | tail -10
```
Expected: All pass.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/system-transform.ts src/plugin.ts tests/integration/prompt-enhance-pipeline.test.ts
git commit -m "fix: gate system-transform by delegation metadata

system-transform now only injects the prompt-enhance output contract
into sessions that have delegation metadata. Normal sessions (no
delegation) receive their system prompt unchanged.

Before: 804 chars of dead text injected into EVERY session
After:  zero injection for non-prompt-enhance sessions"
```

### Task 3.2: Fix prompt-analyze cross-line contradiction detection

**Files:**
- Modify: `src/tools/prompt-analyze/tools.ts` — add cross-line comparison
- Modify: `tests/tools/prompt-analyze.test.ts` — add cross-line test

- [ ] **Step 1: Add cross-line contradiction detection**

In `src/tools/prompt-analyze/tools.ts`, after the per-line analysis loop, add:

```typescript
// Cross-line contradiction detection
const allLines = lines.map(l => l.trim()).filter(Boolean)
for (let i = 0; i < allLines.length; i++) {
  for (let j = i + 1; j < allLines.length; j++) {
    const hasContradiction = CONTRADICTION_PAIRS.some(
      ([left, right]) => left.test(allLines[i]) && right.test(allLines[j])
    )
    if (hasContradiction) {
      // Avoid duplicate: check if we already flagged this pair
      const alreadyFlagged = findings.some(
        f => f.type === "contradiction" &&
             (f.line === i + 1 || f.line === j + 1)
      )
      if (!alreadyFlagged) {
        findings.push({
          line: i + 1,
          text: allLines[i],
          description: `Contradicts line ${j + 1}: "${allLines[j].slice(0, 60)}"`,
          type: "contradiction",
          severity: "important",
          suggestion: "Split conflicting requirements or choose one instruction path.",
        })
      }
    }
  }
}
```

- [ ] **Step 2: Add cross-line test**

In `tests/tools/prompt-analyze.test.ts`, add:

```typescript
it("detects contradictions that span multiple lines", async () => {
  const tool = createPromptAnalyzeTool(process.cwd())
  const raw = await tool.execute(
    { content: "Use TypeScript for the plugin.\nDo not use TypeScript for the plugin." },
    mockCtx,
  )
  const result = parseResult(raw) as Record<string, unknown>
  expect(result.data.findings.some(
    (f: { type: string }) => f.type === "contradiction"
  )).toBe(true)
})
```

- [ ] **Step 3: Run tests**

Run:
```bash
npx vitest run tests/tools/prompt-analyze.test.ts -v
```
Expected: All pass including new cross-line test.

- [ ] **Step 4: Commit**

```bash
git add src/tools/prompt-analyze/tools.ts tests/tools/prompt-analyze.test.ts
git commit -m "fix: detect cross-line contradictions in prompt-analyze

Before: only detected contradictions within a single line
After:  compares all line pairs (O(n²)) for contradictory requirements

Example: 'Use TypeScript' on line 1 + 'Do not use TypeScript' on line 2
now detected as contradiction (previously missed)"
```

---

## Phase 4: Rebuild & Polish — LOW Severity Issues

### Task 4.1: Remove system-transform wiring and event forwarding from plugin.ts

**Files:**
- Modify: `src/plugin.ts` — remove system-transform import and hook, remove PromptEnhancePlugin event forwarding

- [ ] **Step 1: Remove system-transform import and hook**

In `src/plugin.ts`:
- Remove: `import { transformSystemPrompt } from "./hooks/system-transform.js"`
- Remove the entire `"system.transform"` hook block

- [ ] **Step 2: Remove PromptEnhancePlugin event forwarding**

Find where `promptEnhancePlugin.event` is forwarded in the `event` handler. Remove the forwarding call. Keep the lifecycle manager event handling.

- [ ] **Step 3: Run tests**

Run:
```bash
npm test 2>&1 | tail -10
```
Expected: All pass.

- [ ] **Step 4: Commit**

```bash
git add src/plugin.ts
git commit -m "cleanup: remove system-transform wiring and event forwarding

Remove system.transform hook from plugin.ts (gating moved to hook itself).
Remove PromptEnhancePlugin event forwarding (double-count fix moved
compaction tracking entirely to session.compacting hook)."
```

### Task 4.2: Remove prompt-skim recommended_lanes

**Files:**
- Modify: `src/tools/prompt-skim/tools.ts` — remove `recommended_lanes` field
- Modify: `src/schema-kernel/prompt-enhance.schema.ts` — remove `recommended_lanes` from PromptSkimResultSchema
- Modify: `tests/tools/prompt-skim.test.ts` — remove recommended_lanes assertions
- Modify: `tests/schema-kernel/prompt-enhance.schema.test.ts` — remove recommended_lanes from valid record

- [ ] **Step 1: Remove from tool**

In `src/tools/prompt-skim/tools.ts`, remove the `recommended_lanes` field from the returned result object.

- [ ] **Step 2: Remove from schema**

In `src/schema-kernel/prompt-enhance.schema.ts`, remove:
```typescript
recommended_lanes: z.array(z.string()),
```

- [ ] **Step 3: Update tests**

Remove any test assertions that check `recommended_lanes`.

- [ ] **Step 4: Run tests**

Run:
```bash
npm test 2>&1 | tail -10
```
Expected: All pass.

- [ ] **Step 5: Commit**

```bash
git add src/tools/prompt-skim/tools.ts src/schema-kernel/prompt-enhance.schema.ts tests/
git commit -m "cleanup: remove recommended_lanes from prompt-skim

Field referenced non-existent agents (context-mapper, risk-assessor,
context-purifier). Removing eliminates phantom references."
```

### Task 4.3: Rebuild context-budget with real data

**Files:**
- Modify: `src/tools/context-budget/tools.ts` — read actual session state

- [ ] **Step 1: Rebuild the calculation**

Replace the fake linear model with reading actual compaction state from OpenCode's continuity store. The tool should:

1. Read the session file to get `compaction_count`
2. Instead of `100 - n * 15`, calculate based on actual tracked message sizes if available, or fall back to reporting the raw compaction count with status thresholds

For now, keep the tool functional by reading real compaction_count but reporting status based on count ranges:
- `count === 0` → status: "ok", message: "Fresh session, full context available"
- `count <= 2` → status: "warning", message: "Session compacted N times, monitor context"
- `count > 2` → status: "critical", message: "Session compacted N times, context heavily reduced"

- [ ] **Step 2: Update the schema**

In `src/schema-kernel/prompt-enhance.schema.ts`, update `ContextBudgetRecordSchema`:
- Keep: `budget_pct`, `compaction_count`, `status`
- Keep optional: `remaining_estimate?`, `risk_level?`
- Change: `budget_pct` is now a soft indicator (based on status thresholds, not fake math)

- [ ] **Step 3: Update tests**

Update `tests/tools/context-budget.test.ts` to expect the new status-based model instead of the fake linear calculation.

- [ ] **Step 4: Run tests**

Run:
```bash
npm test 2>&1 | tail -10
```
Expected: All pass.

- [ ] **Step 5: Commit**

```bash
git add src/tools/context-budget/tools.ts src/schema-kernel/prompt-enhance.schema.ts tests/tools/context-budget.test.ts
git commit -m "fix: rebuild context-budget with status-based model

Replace fake linear model (100 - n*15) with status-based thresholds:
- count 0: ok (fresh session)
- count 1-2: warning (monitor context)
- count >2: critical (context heavily reduced)

Reports actual compaction state, not fictional percentages."
```

---

## Phase 5: Verification — Zero Regressions

### Task 5.1: Full test suite + quality gates

**Files:**
- No source changes — verification only

- [ ] **Step 1: Run full test suite**

Run:
```bash
npm test 2>&1
```
Expected: All tests pass, no failures.

- [ ] **Step 2: Run typecheck**

Run:
```bash
npm run typecheck 2>&1
```
Expected: Exit code 0, no errors.

- [ ] **Step 3: Run build**

Run:
```bash
npm run build 2>&1
```
Expected: Exit code 0, `dist/` produced.

- [ ] **Step 4: Verify zero dead text injection**

Check that `src/plugin.ts` no longer has `system.transform` hook wired, and `system-transform.ts` gates by delegation:

```bash
grep -n "system.transform" src/plugin.ts
```
Expected: No matches.

- [ ] **Step 5: Verify no double-count path**

```bash
grep -n "session.compacted" src/plugins/prompt-enhance.ts
```
Expected: No matches (only `session.compacting` in the plugin).

- [ ] **Step 6: Final commit if any changes**

```bash
git status --short
```
If dirty, commit.

- [ ] **Step 7: Summary**

Run:
```bash
git log --oneline --not origin/harness-experiment | wc -l
```
Report the total number of commits on this branch.

---

## Self-Review

### Spec Coverage Check

| Requirement | Task | Status |
|-------------|------|--------|
| DEAD-01: Delete .opencode/tools/ | Task 1.1 | ✅ |
| DEAD-02: Delete duplicate tests | Task 1.2 | ✅ |
| DEAD-03: Delete prompt-enhance.test.ts | Task 1.2 | ✅ |
| TEST-01: Rename *-tool.test.ts | Task 1.3 | ✅ |
| HIGH-01: Fix double-compaction | Task 2.1 | ✅ |
| HIGH-02: Fix session-patch regex | Task 2.2 | ✅ |
| HIGH-03: Fix orchestrator agents | Task 2.3 | ✅ |
| MED-01: Gate system-transform | Task 3.1 | ✅ |
| MED-02: Cross-line contradictions | Task 3.2 | ✅ |
| LOW-01: Rebuild context-budget | Task 4.3 | ✅ |
| LOW-02: Remove recommended_lanes | Task 4.2 | ✅ |
| LOW-03: Remove system-transform wiring | Task 4.1 | ✅ |
| LOW-04: Remove event forwarding | Task 4.1 | ✅ |
| QUAL-01: Zero dead text | Task 5.1 Step 4 | ✅ |
| QUAL-02: Double-count tested | Task 2.1 Step 3 | ✅ |
| QUAL-03: typecheck passes | Task 5.1 Step 2 | ✅ |
| QUAL-04: test passes | Task 5.1 Step 1 | ✅ |
| QUAL-05: build passes | Task 5.1 Step 3 | ✅ |

**18/18 requirements mapped. Zero gaps.**

### Placeholder Scan
No TBD, TODO, or "implement later" found in plan.

### Type Consistency
- `parseResult(raw)` used consistently in tests for JSON envelope parsing
- `mockCtx` defined in each test file with required ToolContext shape
- `SessionPatchRecord` type consistent between schema and tool
- `PromptSkimResult` no longer has `recommended_lanes` after Task 4.2

---

## Execution Handoff

Plan complete. Two execution options:

**1. Subagent-Driven (recommended)** — Fresh subagent per task, two-stage review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
