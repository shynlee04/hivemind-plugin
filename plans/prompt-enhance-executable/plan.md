# Prompt-Enhance Executable Design

**Branch:** `fix-prompt-enhance-executable-pipeline`
**Description:** Make the prompt-enhance pipeline genuinely executable — real subagent spawning, Zod-validated tool contracts, system/message transform hooks, and verifiable output.

## Goal
The `/hf-prompt-enhance` command currently produces fake `**Tool: X**` markdown blocks instead of executing via the Task tool. This plan fixes the orchestrator instructions, engineers 4 custom tools with proper Zod schemas in `src/tools/`, adds `system.transform`/`messages.transform` hooks for contract injection, and provides end-to-end verifiability — all shipped as part of the npm package.

## Implementation Steps

### Step 1: Define Zod schemas for prompt-enhance contracts
**Files:** `src/schema-kernel/prompt-enhance.schema.ts`, `src/schema-kernel/index.ts`
**What:** Create the schema-kernel Zod contracts that define the input/output shapes for the entire pipeline:
- `PromptSkimResultSchema` — wordCount, lineCount, estimatedTokens, urls[], paths[], complexityScore (1-10), verdict
- `PromptAnalysisFindingSchema` — type (contradiction|vagueness|missingScope|absoluteClaim), location, severity, description, suggestion
- `ContextBudgetRecordSchema` — compactionCount, budgetPct, remainingEstimate, riskLevel
- `SessionPatchRecordSchema` — section, oldValue, newValue, backupPath, timestamp
- `EnhancedPromptOutputSchema` — YAML frontmatter fields + XML body sections (the final output contract)
- `PipelineStateSchema` — currentPhase, phaseResults[], blockers[], readyForNextPhase
**Testing:** `npx vitest run tests/schema-kernel/prompt-enhance.schema.test.ts` — verify `safeParse` accepts valid records and rejects malformed ones for each schema.

### Step 2: Engineer 4 custom tools in `src/tools/` with Zod args
**Files:** 
- `src/tools/prompt-skim/types.ts`, `src/tools/prompt-skim/tools.ts`, `src/tools/prompt-skim/index.ts`
- `src/tools/prompt-analyze/types.ts`, `src/tools/prompt-analyze/tools.ts`, `src/tools/prompt-analyze/index.ts`
- `src/tools/context-budget/types.ts`, `src/tools/context-budget/tools.ts`, `src/tools/context-budget/index.ts`
- `src/tools/session-patch/types.ts`, `src/tools/session-patch/tools.ts`, `src/tools/session-patch/index.ts`
**What:** 
Each tool follows the established factory pattern:
```typescript
export function createPromptSkimTool(projectRoot: string): ReturnType<typeof tool> {
  return tool({
    description: '...',
    args: { /* tool.schema Zod definitions */ },
    async execute(args, context) { /* calls action handler, returns renderToolResult(success/error) */ }
  })
}
```
- `prompt-skim` — word/line/token counting, URL extraction, path verification, complexity scoring
- `prompt-analyze` — line-by-line analysis: contradictions, vagueness, missing scope, absolute claims
- `context-budget` — reads compaction_count from session file, calculates budget %, remaining estimate
- `session-patch` — patches sections in session file with automatic backup

Each tool's args derive from the Step 1 Zod schemas (compose via intersection or direct use). Each action handler returns `{ kind, message, data?, metadata? }` rendered via `renderToolResult()`.
**Testing:** `npx vitest run tests/tools/prompt-skim.test.ts` (etc.) — unit tests for each tool's execute path, verifying Zod arg validation, happy-path results, and error rendering.

### Step 3: Register tools in HarnessControlPlane plugin
**Files:** `src/plugin.ts`
**What:** Import the 4 factory functions and add them to the `tool` object in `HarnessControlPlane`:
```typescript
tool: {
  hivemind_delegate_task: ...,
  hivemind_prompt_skim: createPromptSkimTool(directory),
  hivemind_prompt_analyze: createPromptAnalyzeTool(directory),
  hivemind_context_budget: createContextBudgetTool(directory),
  hivemind_session_patch: createSessionPatchTool(directory),
}
```
**Testing:** `npm run build` succeeds, `npx tsc --noEmit` passes. Tools appear in `client.tool.ids()` at runtime.

### Step 4: Add explicit execution loop to `hivefiver-orchestrator.md`
**Files:** `.opencode/agents/hivefiver-orchestrator.md`
**What:** Add the phase-by-phase Task tool calling sequence to the orchestrator agent definition. This is the critical fix that stops simulation behavior:

```
## Executing the Prompt-Enhance Pipeline

When routing to the prompt-enhance workflow, you MUST execute each phase via the Task tool. 
Never write **Tool: X** blocks. Never simulate. Always call delegate-task with the actual 
agent name and prompt.

### Phase 0: Skim
1. Call Task → agent: prompt-skimmer, prompt: "Analyze this prompt: {userPrompt}"
2. Parse result. If complexityScore < 3 → skip to Bridge.

### Bridge Decision  
1. Evaluate complexity. If simple → skip Investigation Lanes.
2. If complex → continue to Investigation.

### Investigation Lanes (parallel)
1. Call Task → agent: prompt-analyzer, prompt: "Analyze text: {userPrompt}"
2. Call Task → agent: context-mapper, prompt: "Map context: {userPrompt}"
3. Call Task → agent: risk-assessor, prompt: "Assess risk: {userPrompt}"

### Clarification Gate
1. Review lane results. If ambiguities remain → ask user questions.
2. If clear → continue.

### Phase: Repackage
1. Call Task → agent: prompt-repackager, prompt: "Repackage with findings: {laneResults}"
2. Write enhanced output to session file.

### Report
1. Summarize what was done, what changed, confidence level.
```

Also reinforce the anti-pattern section: "NEVER write `**Tool: X**` output blocks. ALWAYS call the Task tool."
**Testing:** Manually trigger `/hf-prompt-enhance` and verify child session files appear in `.hivemind/sessions/` with distinct `ses_*` IDs (not just markdown simulation).

### Step 5: Implement `system.transform` hook
**Files:** `src/hooks/system-transform.ts`, `src/plugin.ts`
**What:** Create a `system.transform` hook that injects prompt-enhance contracts into the system message when a session is flagged for prompt enhancement. The hook:
1. Reads the Zod schemas from the schema kernel
2. Injects a contract block into the system prompt describing the expected output format (YAML frontmatter + XML body structure)
3. Adds validation instructions telling the agent what constitutes a valid enhanced prompt

This makes prompt design "executable" — the agent receives structured output requirements at the system level, not just in agent instructions.
**Testing:** Start a session with prompt-enhance flag, inspect the transformed system message contains the contract injection. Unit test the hook with mock system prompts.

### Step 6: Implement `messages.transform` hook
**Files:** `src/hooks/messages-transform.ts`, `src/plugin.ts`
**What:** Create a `messages.transform` hook that:
1. Scans message history for prompt-enhance triggers
2. Injects context packets (session state, hierarchy position, route hints) before the agent processes the enhanced prompt
3. Ensures message ordering preserves the contract-injected system prompt as the authority

Follows the existing pattern in the parent repo: `transformRuntimePrompt(input)` → delegates to the runtime prompt transformation pipeline.
**Testing:** Unit test with mock message arrays, verifying context injection doesn't break message ordering. Integration test: trigger prompt-enhance mid-session and verify transformed messages include required context.

### Step 7: Implement `session.compacted` event handler in prompt-enhance plugin
**Files:** `src/plugins/prompt-enhance.ts`
**What:** Add a generic `event` hook listener for `session.compacted` events:
```typescript
event: async (event) => {
  if (event.type === 'session.compacted') {
    // Increment compaction_count in session context file
    // Recalculate context_budget_pct
  }
}
```
This supplements the existing `experimental.session.compacting` hook to track compaction accurately whether it's initiated by OpenCode or externally triggered.
**Testing:** Trigger session compaction, verify `compaction_count` increments in `.hivemind/state/session-context-prompt.md`. Verify `context_budget_pct` recalculates correctly.

### Step 8: Resolve dual plugin divergence
**Files:** `src/plugins/prompt-enhance.ts`, `.opencode/plugins/prompt-enhance.ts`
**What:** Confirm `src/plugins/prompt-enhance.ts` is the single source of truth. If `.opencode/plugins/prompt-enhance.ts` exists as a separate file, replace it with a symlink back to `src/plugins/prompt-enhance.ts`. Remove any `@ts-nocheck` divergence — ensure the single file compiles cleanly.
**Testing:** `npm run build` succeeds, no duplicate behavior at runtime. `npx tsc --noEmit` passes without `@ts-nocheck` suppression.

### Step 9: End-to-end integration tests
**Files:** `tests/e2e/prompt-enhance-pipeline.test.ts`
**What:** Integration tests that verify the full pipeline:
1. Orchestrator receives a prompt → routes to prompt-enhance workflow
2. Phase 0 (Skim) executes via Task tool → result matches `PromptSkimResultSchema`
3. Investigation Lanes execute in parallel → each result matches expected schema
4. Session file is patched correctly via `session-patch` tool
5. Final output contains all required XML sections per `EnhancedPromptOutputSchema`
6. `system.transform` hook injects contracts into system message
7. `messages.transform` hook injects context packets

These are NOT mocked — they use the real tool factories, real schema validation, and real session file I/O. Only the OpenCode server interaction is simulated via mock PluginContext.
**Testing:** `npx vitest run tests/e2e/prompt-enhance-pipeline.test.ts` — all tests pass. `npm run test:coverage` shows coverage for the new tool and hook files.

---

## Dependencies & Order

```
Step 1 (schemas) → Step 2 (tools) → Step 3 (register tools)
                                                    ↓
Step 4 (orchestrator instructions) ────────────────→ Step 9 (E2E tests)
                                                    ↑
Step 5 (system.transform) ─────────────────────────┘
Step 6 (messages.transform) ───────────────────────┘
Step 7 (compacted event) ──────────────────────────┘
Step 8 (plugin divergence) ────────────────────────┘
```

Steps 1→2→3 are sequential (schemas before tools before registration). Steps 4–8 are parallel after Step 3. Step 9 gates the merge (all E2E tests must pass).

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Zod v3/v4 mismatch in worktree tools | Use `tool.schema` (Zod re-export from SDK) consistently — never import `z` from `zod` directly in tool files |
| Orchestrator still simulates after instructions added | E2E test verifies child sessions are spawned; if not, the orchestrator agent needs further reinforcement |
| `system.transform` / `messages.transform` hooks may not exist in this OpenCode version | Verify hook availability in SDK docs before implementation; fall back to agent-instruction-only approach if hooks unavailable |
| Module size creep (>500 LOC per file) | Split tool action handlers into separate `actions.ts` files; keep tool definitions <50 LOC each |

## Success Criteria

1. `/hf-prompt-enhance` spawns real subagents (verifiable via `.hivemind/sessions/` child files)
2. All 4 tools callable via plugin, Zod-validated, with unit test coverage
3. `system.transform` injects output contracts into system messages
4. `messages.transform` injects context packets into message history
5. Session compaction tracking is accurate (both `compacting` and `compacted` events)
6. Zero `@ts-nocheck` in shipped tool files
7. E2E pipeline test passes with real tool execution
8. `npm run build` + `npx tsc --noEmit` + `npm test` all pass cleanly
