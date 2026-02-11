# HiveMind Hooks Fix Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix HiveMind hooks to actually enforce governance - hooks currently log warnings but don't block tool execution or inject system prompt content properly.

**Root Cause Analysis:**
1. `tool.execute.before` hook doesn't return `{ allowed: boolean }` - only logs warnings, tools execute anyway
2. `experimental.chat.system.transform` hook doesn't inject content into `output.system` array
3. `chat.message` hook doesn't return any output, so sentiment signals aren't surfaced
4. `experimental.session.compacting` hook doesn't preserve hierarchy in compacted context

**Tech Stack:**
- OpenCode Plugin SDK v1.1.53
- TypeScript strict mode
- Existing test suite (76 assertions) must still pass

---

## Task 1: Fix tool.execute.before Hook Enforcement

**Files:**
- Modify: `src/index.ts:87-102`
- Test: `tests/tool-gate.test.ts`

**Step 1: Verify OpenCode plugin hook signature**

Read `/Users/apple/hivemind-plugin/node_modules/@opencode-ai/plugin/dist/index.d.ts` or check the SDK to understand the correct return type for `tool.execute.before`.

**Step 2: Update hook to actually block tools**

Replace current hook implementation:

```typescript
/**
 * Tool gate — configurable governance enforcement.
 * Actually blocks execution based on governance mode.
 */
"tool.execute.before": async (input) => {
  const result = await toolGateHook({
    sessionID: input.sessionID,
    tool: input.tool,
  })

  if (!result.allowed) {
    await log.warn(
      `GOVERNANCE BLOCK: ${result.error ?? "Operation blocked."} (tool: ${input.tool})`
    )
    // CRITICAL: Return rejection to actually block the tool
    return {
      allowed: false,
      error: result.error || "Operation blocked by governance"
    }
  }

  if (result.warning) {
    await log.warn(result.warning)
  }

  // Allow execution
  return { allowed: true }
}
```

**Step 3: Update createToolGateHook return type**

File: `src/hooks/tool-gate.ts:67-71`

Change return type to match what OpenCode expects:

```typescript
export interface ToolGateResult {
  allowed: boolean
  error?: string
  warning?: string
}
```

**Step 4: Run existing tests**

```bash
npm test
```

Expected: All 76 assertions still pass (we're just adding return statements)

**Step 5: Add integration test for blocking behavior**

File: `tests/integration.test.ts`

Add new test:

```typescript
async function test_strictModeBlocksWrites() {
  process.stderr.write("\n--- integration: strict mode blocks without intent ---\n")

  const dir = await setup()

  try {
    // Initialize in strict mode
    await initProject(dir, { governanceMode: "strict", language: "en" })

    const stateManager = createStateManager(dir)
    let state = await stateManager.load()
    assert(state?.session.governance_status === "LOCKED", "strict mode starts LOCKED")

    // Create a write tool instance
    const writeTool = tool({
      name: "write",
      description: "Test write tool",
      args: {
        content: tool.schema.string(),
        filePath: tool.schema.string()
      },
      async execute(args) {
        return `Wrote ${args.filePath}`
      }
    })

    // Simulate tool gate hook
    const toolGateHook = createToolGateHook(
      await createLogger(join(dir, "test-logs"), "test"),
      dir,
      await loadConfig(dir)
    )

    const result = await toolGateHook({
      sessionID: state.session.id,
      tool: "write"
    })

    assert(result.allowed === false, "tool gate should block in strict mode without intent")
    assert(result.error?.includes("SESSION LOCKED"), "error message should mention locked status")
  } finally {
    await cleanup()
  }
}
```

**Step 6: Commit blocking enforcement fix**

```bash
git add src/index.ts src/hooks/tool-gate.ts tests/integration.test.ts
git commit -m "fix: tool.execute.before hook now actually blocks execution"
```

---

## Task 2: Fix System Prompt Injection

**Files:**
- Modify: `src/index.ts:134-136`
- Modify: `src/hooks/session-lifecycle.ts:32-133`
- Test: `tests/integration.test.ts`

**Step 1: Verify system transform hook output parameter**

The `output` parameter in `experimental.chat.system.transform` is an object with a `system` array. We need to PUSH to it, not just call a function.

**Step 2: Fix session lifecycle hook to return injected content**

File: `src/hooks/session-lifecycle.ts:32-133`

Current code calls lines into void. Fix to actually modify output:

```typescript
export function createSessionLifecycleHook(
  log: Logger,
  directory: string,
  config: HiveMindConfig
) {
  const stateManager = createStateManager(directory)
  const BUDGET_CHARS = 1000

  return async (
    input: { sessionID?: string },
    output: { system: string[] }
  ): Promise<void> => {
    try {
      if (!input.sessionID) return

      // Load or create brain state
      let state = await stateManager.load()
      if (!state) {
        await initializePlanningDirectory(directory)
        const sessionId = generateSessionId()
        state = createBrainState(sessionId, config)
        await stateManager.save(state)
      }

      const lines: string[] = []
      lines.push("<hivemind-governance>")

      // Session status
      lines.push(
        `Session: ${state.session.governance_status} | Mode: ${state.session.mode} | Governance: ${state.session.governance_mode}`
      )

      // Hierarchy context
      if (state.hierarchy.trajectory) {
        lines.push(`Trajectory: ${state.hierarchy.trajectory}`)
      }
      if (state.hierarchy.tactic) {
        lines.push(`Tactic: ${state.hierarchy.tactic}`)
      }
      if (state.hierarchy.action) {
        lines.push(`Action: ${state.hierarchy.action}`)
      }

      // No hierarchy = prompt to declare intent
      if (
        !state.hierarchy.trajectory &&
        !state.hierarchy.tactic &&
        !state.hierarchy.action
      ) {
        if (config.governance_mode === "strict") {
          lines.push(
            "No intent declared. Use declare_intent to unlock session before writing."
          )
        } else {
          lines.push(
            "Tip: Use declare_intent to set your work focus for better tracking."
          )
        }
      }

      // Metrics summary
      lines.push(
        `Turns: ${state.metrics.turn_count} | Drift: ${state.metrics.drift_score}/100 | Files: ${state.metrics.files_touched.length}`
      )

      // Drift warning
      if (state.metrics.drift_score < 50) {
        lines.push(
          "⚠ High drift detected. Use map_context to re-focus."
        )
      }

      lines.push("</hivemind-governance>")

      // Inject mandatory agent behavior configuration
      const agentConfigPrompt = generateAgentBehaviorPrompt(config.agent_behavior)
      lines.push("")
      lines.push(agentConfigPrompt)

      // Budget enforcement
      let injection = lines.join("\n")
      if (injection.length > BUDGET_CHARS) {
        injection =
          injection.slice(0, BUDGET_CHARS - 30) +
          "\n</agent-configuration>"
        await log.warn(
          `System injection truncated: ${lines.join("\n").length} → ${injection.length} chars`
        )
      }

      // CRITICAL FIX: Actually push to output.system array
      output.system.push(injection)

      await log.debug(
        `Session lifecycle: injected ${injection.length} chars`
      )
    } catch (error) {
      // P3: Never break session lifecycle
      await log.error(`Session lifecycle hook error: ${error}`)
    }
  }
}
```

**Step 3: Update plugin entry point to pass output correctly**

File: `src/index.ts:134-136`

Ensure output is passed and modified:

```typescript
"experimental.chat.system.transform": async (input, output) => {
  await sessionLifecycleHook(input, output)
},
```

**Step 4: Add integration test for system prompt injection**

File: `tests/integration.test.ts`

```typescript
async function test_systemPromptInjection() {
  process.stderr.write("\n--- integration: system prompt injection ---\n")

  const dir = await setup()

  try {
    await initProject(dir, { governanceMode: "assisted", language: "en" })

    const stateManager = createStateManager(dir)
    const declareIntentTool = createDeclareIntentTool(dir)

    // Declare intent
    await declareIntentTool.execute({
      mode: "plan_driven",
      focus: "Test session"
    })

    let state = await stateManager.load()
    assert(state?.hierarchy.trajectory === "Test session", "trajectory set")

    // Simulate system transform hook
    const sessionLifecycleHook = createSessionLifecycleHook(
      await createLogger(join(dir, "test-logs"), "test"),
      dir,
      await loadConfig(dir)
    )

    const output = { system: [] }
    await sessionLifecycleHook(
      { sessionID: state.session.id },
      output
    )

    assert(output.system.length > 0, "system prompt should have content")
    assert(
      output.system[0].includes("<hivemind-governance>"),
      "system prompt should include governance block"
    )
    assert(
      output.system[0].includes("Trajectory: Test session"),
      "system prompt should include trajectory"
    )
  } finally {
    await cleanup()
  }
}
```

**Step 5: Commit system injection fix**

```bash
git add src/hooks/session-lifecycle.ts src/index.ts tests/integration.test.ts
git commit -m "fix: experimental.chat.system.transform now actually injects content"
```

---

## Task 3: Fix Compaction Hook to Preserve Hierarchy

**Files:**
- Modify: `src/hooks/compaction.ts`
- Test: `tests/integration.test.ts`

**Step 1: Read current compaction hook**

File: `src/hooks/compaction.ts`

**Step 2: Ensure compaction hook modifies output properly**

The `experimental.session.compacting` hook should preserve critical context. Fix if needed:

```typescript
export function createCompactionHook(log: Logger, directory: string) {
  const stateManager = createStateManager(directory)
  const BUDGET_TOKENS = 500

  return async (
    input: { sessionID?: string },
    output: { context?: string[] }
  ): Promise<void> => {
    try {
      if (!input.sessionID) return

      const state = await stateManager.load()
      if (!state) return

      // Build hierarchy summary to preserve across compaction
      const hierarchySummary: string[] = []

      if (state.hierarchy.trajectory) {
        hierarchySummary.push(`🎯 Trajectory: ${state.hierarchy.trajectory}`)
      }
      if (state.hierarchy.tactic) {
        hierarchySummary.push(`⚡ Tactic: ${state.hierarchy.tactic}`)
      }
      if (state.hierarchy.action) {
        hierarchySummary.push(`🔹 Action: ${state.hierarchy.action}`)
      }

      if (hierarchySummary.length > 0) {
        // Inject as a comment marker in the context
        const preservationMarker = `<!-- HiveMind Hierarchy Preserved: ${hierarchySummary.join(" | ")} -->`

        // CRITICAL: Actually modify output.context array if it exists
        if (output.context && Array.isArray(output.context)) {
          output.context.push(preservationMarker)
        }

        await log.info(
          `Compaction: Preserved hierarchy across context boundary`
        )
      }
    } catch (error) {
      // P3: Never break compaction
      await log.error(`Compaction hook error: ${error}`)
    }
  }
}
```

**Step 3: Update plugin entry point to pass context**

File: `src/index.ts:186-188`

```typescript
"experimental.session.compacting": async (input, output) => {
  await compactionHook(input, output)
},
```

**Step 4: Add compaction integration test**

```typescript
async function test_compactionPreservesHierarchy() {
  process.stderr.write("\n--- integration: compaction preserves hierarchy ---\n")

  const dir = await setup()

  try {
    await initProject(dir, { governanceMode: "assisted", language: "en" })

    const declareIntentTool = createDeclareIntentTool(dir)
    const mapContextTool = createMapContextTool(dir)

    // Set up full hierarchy
    await declareIntentTool.execute({
      mode: "plan_driven",
      focus: "Build feature"
    })
    await mapContextTool.execute({
      level: "tactic",
      content: "Implement component"
    })
    await mapContextTool.execute({
      level: "action",
      content: "Write test"
    })

    const stateManager = createStateManager(dir)
    const compactionHook = createCompactionHook(
      await createLogger(join(dir, "test-logs"), "test"),
      dir
    )

    const state = await stateManager.load()
    const output = { context: [] }

    await compactionHook(
      { sessionID: state.session.id },
      output
    )

    assert(
      output.context.length > 0,
      "compaction should preserve hierarchy marker"
    )
    assert(
      output.context[0].includes("Trajectory: Build feature"),
      "hierarchy should include trajectory"
    )
    assert(
      output.context[0].includes("Tactic: Implement component"),
      "hierarchy should include tactic"
    )
    assert(
      output.context[0].includes("Action: Write test"),
      "hierarchy should include action"
    )
  } finally {
    await cleanup()
  }
}
```

**Step 5: Commit compaction fix**

```bash
git add src/hooks/compaction.ts src/index.ts tests/integration.test.ts
git commit -m "fix: experimental.session.compacting now preserves hierarchy in context"
```

---

## Task 4: Verify All Tests Pass

**Step 1: Run full test suite**

```bash
npm test
```

Expected: All tests pass (76 existing + 3 new integration tests = 79 total)

**Step 2: Run TypeScript compilation**

```bash
npm run typecheck
```

Expected: Zero type errors

**Step 5: Test hooks manually**

```bash
# In a test directory with hivemind initialized
hivemind init --mode strict
# Try using a tool without declare_intent
# Should actually be blocked now (not just warned)
```

**Step 6: Commit test verification**

```bash
git add tests/
git commit -m "test: add integration tests for hook enforcement"
```

---

## Task 5: Update Documentation

**Files:**
- Modify: `AGENTS.md`
- Create: `docs/HOOKS.md`

**Step 1: Update AGENTS.md with actual enforcement behavior**

Add section on governance enforcement:

```markdown
## Governance Enforcement

HiveMind enforces governance through hooks that actually block execution (not just warn):

### Strict Mode
- Blocks ALL write tools until `declare_intent` is called
- Returns `{ allowed: false }` to prevent tool execution
- Agent MUST call `declare_intent` before proceeding

### Assisted Mode
- Warns when tools are used without declared intent
- Allows execution but logs warnings to `.opencode/planning/logs/`
- Guidance appears in system prompt

### Permissive Mode
- Silent tracking only
- No warnings or blocks
- Used for maximum agent autonomy
```

**Step 2: Create HOOKS.md reference**

Document how each hook works:

```markdown
# HiveMind Hooks Reference

## tool.execute.before
**Purpose:** Enforce governance by blocking or allowing tool execution
**Behavior:** Returns `{ allowed: boolean, error?: string }`
- `allowed: false` + `error` → Tool execution is blocked
- `allowed: true` → Tool proceeds normally

## experimental.chat.system.transform
**Purpose:** Inject governance context into system prompt
**Behavior:** Pushes content to `output.system` array
- Session status (LOCKED/OPEN)
- Hierarchy (trajectory/tactic/action)
- Drift warnings when score < 50

## experimental.session.compacting
**Purpose:** Preserve hierarchy across LLM context compaction
**Behavior:** Pushes preservation marker to `output.context` array
- Hierarchy comment survives context boundary
- Agent maintains focus after compaction
```

**Step 3: Commit documentation**

```bash
git add AGENTS.md docs/HOOKS.md
git commit -m "docs: document actual hook enforcement behavior"
```

---

## Success Criteria

- [ ] `tool.execute.before` hook returns `{ allowed: false }` to block execution
- [ ] `experimental.chat.system.transform` hook pushes to `output.system` array
- [ ] `experimental.session.compacting` hook preserves hierarchy in context
- [ ] All 79 tests pass (76 existing + 3 new integration tests)
- [ ] TypeScript compiles with zero errors
- [ ] Manual test: strict mode actually blocks tools without `declare_intent`
- [ ] Documentation updated with actual enforcement behavior

---

## Summary

This plan fixes 4 critical bugs where hooks were registered but didn't actually enforce behavior:

1. **Tool gate** logged warnings but didn't return rejection → Fixed
2. **System transform** called function but didn't modify output → Fixed
3. **Compaction** didn't preserve hierarchy in context → Fixed
4. **No tests** verified hooks actually worked → Added integration tests

After this implementation, HiveMind will actually enforce governance between every turn, not just at session start.
