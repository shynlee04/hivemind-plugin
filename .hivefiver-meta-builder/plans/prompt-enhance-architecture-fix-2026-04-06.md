# Prompt-Enhance Architecture Fix Plan

> **Root cause:** The original plan assumed workflow markdown would auto-execute tools and session context would auto-flow to subagents. Neither is true. The orchestrator only has `delegate-task`. Custom tools must be invoked THROUGH delegate-task prompts. Session context must be explicitly appended to subagent prompts.

## Architecture Corrections Required

### Fix #1: Session context must be appended to every subagent prompt

**File:** `src/lib/helpers.ts` — add `sessionContext` parameter to `buildPromptText()`

```typescript
export function buildPromptText(args: {
  description: string
  prompt: string
  category?: string
  scope?: string
  constraints?: string[]
  guidanceText?: string
  agent?: string
  requiredTools?: string[]
  mustNotDo?: string[]
  sessionContext?: string  // NEW: content from session-context-prompt.md
}): string {
```

When `sessionContext` is provided, append it as a `## Session Context` section at the end of the built prompt.

### Fix #2: Orchestrator must read session file and pass it as constraint

**File:** `.hivefiver-meta-builder/workflows-lab/active/refactoring/prompt-enhance.md`

The workflow must instruct the orchestrator to:
1. `cat .hivemind/state/session-context-prompt.md` to read current state
2. Pass the content as a `constraints` entry when calling `delegate-task`
3. Use `delegate-task` (NOT direct tool calls) for all lane dispatching

### Fix #3: session-patch must be invoked via delegate-task to a builder agent

Since the orchestrator can't call tools directly, it must delegate to a builder agent with instructions to run `session-patch`:

```
Task tool (builder):
  description: "Patch session state"
  prompt: |
    Run the session-patch tool to update the session file.
    sessionFilePath: <absolute path>
    section: "## What Happened So Far"
    newContent: <skim summary>
```

### Fix #4: Filename consistency

**File:** All references must use `.hivemind/state/session-context-prompt.md` (not `session-content-prompt.md`).

### Fix #5: Custom tools must be accessible to delegated agents

The lane agents (prompt-analyzer, context-mapper, etc.) need read access to the custom tools. Since they're subagents with `task: ask`, they can't call tools. **The tool calls must happen in the orchestrator's delegate-task prompts**, not inside the agents.

## Corrected Execution Flow

```
User: /hf-prompt-enhance "my prompt text"
  ↓
hivefiver-orchestrator reads workflow.md
  ↓
Phase 0: Orchestrator reads session file via bash (cat)
  ↓
Orchestrator calls delegate-task(researcher) with:
  - prompt: "Run prompt-skim tool on: <user prompt>"
  - constraints: ["session context: <file content>"]
  ↓
Researcher runs prompt-skim tool, returns result
  ↓
Orchestrator calls delegate-task(builder) with:
  - prompt: "Run session-patch tool to update ## What Happened So Far"
  ↓
Bridge: Orchestrator reads skim result, chooses lanes
  ↓
Each lane: delegate-task(researcher/builder) with session context in constraints
  ↓
Clarification: Orchestrator asks questions, patches via delegate-task(builder)
  ↓
Assembly: delegate-task(builder) with repackager instructions
  ↓
Report to user
```

---

## Implementation Tasks (TDD)

### Task A: Add sessionContext to buildPromptText

**Test first:**
```typescript
// tests/lib/helpers.test.ts — add to existing buildPromptText tests
it("appends session context when provided", () => {
  const result = buildPromptText({
    description: "Test task",
    prompt: "Do the thing",
    sessionContext: "## What Happened\nSession started.",
  });

  expect(result).toContain("## Session Context");
  expect(result).toContain("## What Happened");
  expect(result).toContain("Session started.");
});

it("omits session context section when not provided", () => {
  const result = buildPromptText({
    description: "Test task",
    prompt: "Do the thing",
  });

  expect(result).not.toContain("## Session Context");
});
```

**Then implement** the `sessionContext` parameter in `buildPromptText()`.

### Task B: Fix workflow to use delegate-task pattern

**No code changes — just rewrite the workflow markdown** to:
1. Use `delegate-task` for all tool invocations
2. Read session file via bash before each phase
3. Pass session content as constraints to delegate-task
4. Fix filename typo (`session-context-prompt.md` throughout)

### Task C: Add session-context injection to delegate-task protocol

**Test first:**
```typescript
// tests/lib/session-api.test.ts or new test file
it("includes session context in delegated prompts", async () => {
  // Verify that when constraints include session context,
  // the built prompt text contains it
  const prompt = buildPromptText({
    description: "Patch session",
    prompt: "Update the file",
    constraints: ["session context: ## What Happened\nInitialized"],
  });

  expect(prompt).toContain("session context");
  expect(prompt).toContain("Initialized");
});
```

This test verifies the constraint passthrough works (it should already — constraints are passed through, but we need to prove the session context flows).

### Task D: Rewrite prompt-enhance workflow with correct delegation

Replace the entire workflow file with one that:
1. Uses `delegate-task` for ALL tool invocations
2. Reads session file before each phase
3. Passes session context as constraints
4. Uses builder agents for session-patch calls
5. Uses researcher agents for prompt-skim/prompt-analyze calls
6. Has explicit prompt text for each delegation that includes tool invocation instructions

---

## Execution Order

```
Task A (sessionContext param + tests) → Task C (constraint passthrough test) → Task B (workflow rewrite) → Task D (full delegation workflow)
```

Tasks A and C are implementation-level fixes (code changes).
Tasks B and D are architecture-level fixes (workflow rewrite).

---

## Non-Negotiables

1. **NO direct tool calls from workflow** — everything goes through `delegate-task`
2. **Session context MUST be read and passed** to every subagent via constraints
3. **Filename**: `.hivemind/state/session-context-prompt.md` (consistent everywhere)
4. **buildPromptText must accept sessionContext** as optional parameter
5. **Tests first** for every code change
6. **Commit after each task**: `phase: what changed — why it matters`
