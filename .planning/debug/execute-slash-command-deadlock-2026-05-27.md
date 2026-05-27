---
status: diagnosed
trigger: "Phase 24.3.3 — 4 path tests on execute-slash-command: Path 1 (agent override) hangs, Path 2 (subtask) hangs-then-fires-after-abort, Path 3 (TUI pipeline) corrupts terminal, Path 4a/4b (natural language) clean error or crash"
created: 2026-05-27
updated: 2026-05-27
architecture_researched: true
---

## Current Focus

hypothesis: "Three independent vulnerabilities cause all 4 path failures: (H1) CR-01 deadlock — await session.prompt() blocks tool return; (H2) CR-02 agent hijack — selectAgent reroutes TUI commands to deadlocked Path 1 or corrupts TUI via interactive prompt; (H3) TUI re-entrancy — clearPrompt+appendPrompt+submitPrompt corrupts terminal state"

test: Code analysis complete — all 7 source files read, diffs from CR-01 and CR-02 verified, all 4 paths traced

## Symptoms

expected: All 4 dispatch paths produce correct output without hanging or terminal corruption

actual:
- Path 1 (agent override, agent=gsd-executor): Hangs forever — tool never returns
- Path 2 (subtask, agent=gsd-executor, subtask=true): Hangs until abort closes session — then dispatch fires (too late)
- Path 3 (TUI pipeline, no agent): TUI corruption, garbage escape characters, TUI frozen
- Path 4a (no match, command=show-me-stats): Clean error — works correctly
- Path 4b (fuzzy match, command=stats): Same corruption as Path 3

errors: Terminal escape code corruption, "resolve agent is not found" garbage in TUI

reproduction: Call execute-slash-command with gsd-stats as the command

started: After CR-01 (d41c3f98) and CR-02 (7e8d5f8b) commits

## Evidence

- timestamp: 2026-05-27
  checked: CR-01 commit diff — dispatch-command.ts
  found: Pre-CR-01 used `setTimeout(fn, 50)` then returned `{ success: true }` immediately. CR-01 removed setTimeout and made `await client.session.prompt()` synchronous inside the tool's execute() handler. The tool now awaits a session.prompt() on the SAME session that is executing it.
  implication: CR-01 introduces a reentrant deadlock — session is busy running the tool, tool awaits session.prompt(), neither can proceed.

- timestamp: 2026-05-27
  checked: CR-02 commit diff — execute-slash-command.ts
  found: CR-02 added `selectAgent()` at lines 184-195 (now current code), called with `validated.command` (single-word command name like "gsd-stats"). Before CR-02, no agent resolution existed — commands without explicit agent went directly to TUI pipeline.
  implication: CR-02 adds a second failure mode — agent resolution hijacks TUI commands or triggers interactive prompts mid-tool-execution.

- timestamp: 2026-05-27
  checked: Path 1 trace — agent override
  found: validated.agent="gsd-executor" → syntheticPromptAgent set → dispatchCommand called → `await client.session.prompt()` on ctx.sessionID (the session running this tool) → **DEADLOCK**. The tool's execute() handler is running within the session's tool-call processing context. session.prompt() waits for the session to be available. The session is waiting for the tool to return. Neither progresses.
  implication: H1 CONFIRMED — CR-01 regression directly causes Path 1 failure.

- timestamp: 2026-05-27
  checked: Path 2 trace — subtask dispatch
  found: validated.agent="gsd-executor", subtask=true → shouldDispatchSubtask=true → dispatchCommand called with subtask=true → `await client.session.prompt()` on ctx.sessionID → **DEADLOCK**. Same as Path 1 — session.prompt() blocks because the current session is mid-tool-execution. When the user aborts, the session closes/kills, freeing the session.prompt() call, which then fires (explaining "dispatch fires only AFTER abort signal").
  implication: H1 CONFIRMED for Path 2 as well. Abort unblocks the deadlock by killing the session — then the scheduled dispatch fires too late.

- timestamp: 2026-05-27
  checked: Path 3 trace — TUI pipeline, command="gsd-stats", no agent
  found: Stage 2 (line 184-195) calls selectAgent("gsd-stats", agents). extractKeywords("gsd-stats") = ["gsd-stats"] (single hyphenated keyword, NOT ["gsd", "stats"]). No agent name contains "gsd-stats" — agent names are like "gsd-executor", "gsd-debugger". So matches.length === 0. selectAgent falls through to createTuiPrompt() (line 53-57) — an INTERACTIVE @clack/prompts.text() prompt inside the tool's execute() handler. The interactive prompt corrupts TUI state.
  implication: H2 CONFIRMED — selectAgent triggers @clack/prompts interactive prompt mid-tool-execution, corrupting the TUI. This is the "resolve agent is not found" garbage.

- timestamp: 2026-05-27
  checked: Path 3 hypothesis verification
  found: The existing debug file claimed keywords for "gsd-progress" = ["gsd", "progress"]. This is INCORRECT — extractKeywords splits on whitespace, NOT hyphens. "gsd-progress" → ["gsd-progress"] (single keyword). The earlier analysis was based on faulty keyword extraction. Correction: for single-word commands (gsd-stats, gsd-progress, gsd-help, etc.), NO agents match because no agent name contains the ENTIRE command name as substring.
  implication: The existing debug's elimination of the createTuiPrompt hypothesis was WRONG. createTuiPrompt IS the cause of TUI corruption for Path 3.

- timestamp: 2026-05-27
  checked: Path 4a trace — no match, command="show-me-stats"
  found: resolveCommand fails with CommandNotFoundError thrown at line 168 of resolve-command.ts. This is thrown before selectAgent is reached (line 184). The catch block in execute-slash-command.ts handles it as an error return. Clean path — no corruption.
  implication: Path 4a works correctly because it fails early before reaching the dangerous code.

- timestamp: 2026-05-27
  checked: Path 4b trace — fuzzy match, command="stats"
  found: resolveCommand succeeds via substring matching (Stage 3) → commandBundle found. selectAgent("stats", agents): keywords=["stats"]. If any agent name or description contains "stats", a match is found, validated.agent gets set → rerouted to synthetic prompt path (Path 1) → DEADLOCK. If no agent matches → createTuiPrompt → TUI corruption (same as Path 3).
  implication: Path 4b either deadlocks (H1) or corrupts TUI (H2) — same root causes.

- timestamp: 2026-05-27
  checked: TUI submitPrompt re-entrancy (Lines 442-450)
  found: Even if selectAgent returns null (validated.agent stays undefined), syntheticPromptAgent is undefined, shouldDispatchSubtask is undefined, code reaches TUI path. Lines 442-450: clearPrompt() → appendPrompt() → submitPrompt(). submitPrompt() makes an HTTP POST to /tui/submit-prompt, injecting a new user message while the current tool is still executing. This causes conversation re-entrancy.
  implication: H3 — Even without H1/H2, the TUI submitPrompt path creates a secondary re-entrancy issue. However, Path 3 and 4b crash BEFORE reaching this code due to H2 (selectAgent corruption). This path is only reached when agent resolution doesn't match AND doesn't call createTuiPrompt — which requires the user-agent check (line 184) to fail.

## Eliminated

- hypothesis: "createTuiPrompt is never reached for gsd-* commands" (from existing debug)
  evidence: extractKeywords("gsd-stats") = ["gsd-stats"] (single hyphenated keyword, NOT ["gsd", "stats"]). No agent named "gsd-stats" exists. matches.length === 0 → createTuiPrompt IS called. The existing debug incorrectly assumed keywords split on hyphens (they split on whitespace only).
  timestamp: 2026-05-27

## Resolution

root_cause: **Three independent vulnerabilities cause all 4 path failures:**

  **PRIMARY (H1) — CR-01 deadlock:** Removing setTimeout(50) and making `await client.session.prompt()` synchronous inside the tool's execute() handler creates a reentrant deadlock. The session is busy processing the tool call. The tool awaits session.prompt() which needs the session to be free. Neither can proceed. Affects Path 1 (hangs forever) and Path 2 (hangs until abort unblocks the session).
  
  **SECONDARY (H2) — CR-02 agent hijack + interactive prompt:** 
  (a) selectAgent's keyword matching with single-word command names (e.g., "gsd-stats") produces ["gsd-stats"] as the only keyword. No agent name contains this substring. When matches.length === 0, selectAgent calls createTuiPrompt() — an interactive @clack/prompts.text() prompt — inside the tool's execute() handler, corrupting the TUI terminal state.
  (b) Even when matches are found, matched agents are assigned to validated.agent, rerouting TUI commands into the deadlocked Path 1 (synthetic prompt).
  
  **TERTIARY (H3) — TUI submitPrompt re-entrancy:** TUI path's clearPrompt → appendPrompt → submitPipeline creates conversation re-entrancy (new message in same session mid-tool-execution).

fix: Three fixes required (see below)

verification: Pending UAT — DO NOT COMMIT

files_changed:
  - src/tools/session/dispatch-command.ts (H1 — restored queueMicrotask deferral)
  - src/tools/session/execute-slash-command.ts (H1, H2 — selectAgent metadata-only, synthetic prompt path restored)
  - src/tools/session/semantic-agent-selector.ts (H2 — hyphen-aware keywords, prefix matching, removed createTuiPrompt)
  - tests/tools/semantic-agent-selector.test.ts (updated for new behavior)
  - tests/tools/execute-slash-command.test.ts (flushDeferred helper for deferred dispatch tests)
  - tests/tools/dispatch-command.test.ts (updated error test for deferred dispatch)

---

## ROOT CAUSE FOUND

### Root Cause Diagnosis

The `execute-slash-command` tool has **three independent vulnerabilities** introduced by CR-01 (d41c3f98) and CR-02 (7e8d5f8b), each causing different failure modes across the 4 path tests.

#### H1: CR-01 Deadlock (PRIMARY — affects Path 1, 2, partially 4b)

**File:** `src/tools/session/dispatch-command.ts:82-88`

**Mechanism:** Pre-CR-01, `dispatchCommand` used `setTimeout(fn, 50)` at the end — this returned `{ success: true }` immediately, allowing the tool's `execute()` handler to return. Then 50ms later, after the tool had returned and the session was free, the setTimeout callback called `client.session.prompt()` on the now-available session.

CR-01 removed the setTimeout and made the call synchronous:
```typescript
// CR-01 change (dispatch-command.ts):
// BEFORE: setTimeout(() => { client.session.prompt(...) }, 50); return { success: true }
// AFTER:  await client.session.prompt(...); return { success: true }
```

Now `await client.session.prompt()` on `ctx.sessionID` blocks because:
1. The session is processing the current tool call (this execute() handler)
2. `session.prompt()` cannot deliver a new message until the current turn completes
3. But the turn can't complete until the tool returns
4. The tool can't return until session.prompt() resolves
5. → **Deadlock**

**Evidence from pre-CR-01 code:** The original `setTimeout(50)` was NOT accidental. It was the intentional pattern to defer the dispatch until the tool returns and the session is free.

#### H2: CR-02 Agent Hijack + TUI Corruption (SECONDARY — affects Path 3, 4b)

**File:** `src/tools/session/semantic-agent-selector.ts:20-83`
**File:** `src/tools/session/execute-slash-command.ts:184-195`

**Two failure modes:**

**Mode A — Interactive prompt corruption:** For single-word commands like "gsd-stats":
- `selectAgent("gsd-stats", agents)` → `extractKeywords("gsd-stats")` → `["gsd-stats"]`
- Agent names like "gsd-executor" do NOT contain "gsd-stats" → `matches.length === 0`
- Falls to `createTuiPrompt({ type: "text", message: "No matching agent found..." })` (line 53)
- This calls `prompts.text()` from `@clack/prompts` — an **interactive terminal prompt** — INSIDE the tool's `execute()` handler
- The interactive prompt clashes with OpenCode's TUI rendering, causing escape code corruption and TUI freeze

**Note:** The existing debug file claimed this was impossible because "gsd" keyword matches all gsd-* agents. This analysis was **wrong** — `extractKeywords` splits on **whitespace** only, not hyphens. "gsd-stats" produces ONE keyword "gsd-stats", which no agent name contains. For commands with spaces (e.g., intent="show gsd stats"), keywords=["show", "gsd", "stats"] would match, but this code passes `validated.command` — which is the normalized single-word command name.

**Mode B — Wrong agent assignment:** When commands DO match agent names (e.g., "run-tests" matching an agent named "tester"), the matched agent is assigned to `validated.agent`, rerouting the dispatch from TUI pipeline into the deadlocked Path 1 (synthetic prompt). This means the command would deadlock even if it was meant for the right agent.

#### H3: TUI submitPrompt Re-entrancy (TERTIARY — TUI path only)

**File:** `src/tools/session/execute-slash-command.ts:442-450`

Even when Path 3 (TUI pipeline) is reached without agent resolution:
```typescript
await client.tui.clearPrompt()      // Clear TUI buffer
await client.tui.appendPrompt({...}) // Append command text
await client.tui.submitPrompt()      // Submit as new message
```

`submitPrompt()` POSTs to `/tui/submit-prompt`, injecting a new user message into the current session while the tool is still executing. This creates conversation re-entrancy — two turns fighting for the same session state machine.

#### Path 4a (clean error)

Path 4a works correctly because `resolveCommand` throws `CommandNotFoundError` BEFORE reaching the `selectAgent` call (line 184). The thrown error is caught by the `catch` block at line 473 and returns a clean error response. This path never encounters the dangerous code.

### Affected Paths

| Path | Symptom | Root Cause | Mechanism |
|------|---------|------------|-----------|
| **Path 1** (agent override) | Hangs forever | H1 (CR-01 deadlock) | await session.prompt() on same session |
| **Path 2** (subtask) | Hangs until abort | H1 (CR-01 deadlock) | Same deadlock; abort frees session, dispatch fires late |
| **Path 3** (no agent, gsd-stats) | TUI corruption, freeze | H2 (CR-02 interactive prompt) | selectAgent → createTuiPrompt → @clack/prompts.text() inside tool handler |
| **Path 4b** (fuzzy, stats) | TUI corruption OR deadlock | H2 (corruption) or H1 (deadlock) | Depends on whether any agent description matches "stats" |
| **Path 4a** (no match) | Clean error | None — works correctly | Fails before reaching dangerous code |

### Fix Strategy (Revised — Architecture-Correct)

#### Architecture Correction (from user)

The user clarified the correct architecture:

1. **Commands run on the MAIN session, NOT child sessions.** Pattern: tool returns → command appended to TUI pipeline (`appendPrompt` + `submitPrompt`) → main session processes the command.
2. **`@agent` prefix in TUI text does NOT work** for agent override via `appendPrompt()`. The agent override must be handled differently.
3. **`client.tui` pipeline is the correct dispatch mechanism** for slash commands. The `task` tool and `session.promptAsync()` do NOT work with slash commands.
4. **Child sessions are NOT the right path** for command dispatch.

This means the previous fix strategy (child sessions) was WRONG. The correct pattern is:

```
selectAgent (metadata only, no flow change) → store agent hint
  → tool returns immediately (no session.prompt() while mid-execution)
  → TUI appendPrompt + submitPrompt fires
  → main session processes the command
```

#### Fix 2 (CRITICAL — H2 selectAgent corruption)
**Files:** `src/tools/session/semantic-agent-selector.ts`, `src/tools/session/execute-slash-command.ts`

**The core insight: selectAgent must be PURELY INFORMATIONAL — it must NOT change the execution flow.**

Currently, `selectAgent()` at lines 184-195 has TWO bugs:
- **Bug A (in semantic-agent-selector.ts):** `extractKeywords()` doesn't split on hyphens, so `"gsd-stats"` → `["gsd-stats"]` (single keyword). No agent name contains `"gsd-stats"` → matches=0 → `createTuiPrompt()` → TUI corruption.
- **Bug B (in execute-slash-command.ts):** Line 193 `validated.agent = agentResult.agent` MUTATES the dispatch state, changing the flow from TUI pipeline to synthetic prompt path (H1 deadlock).

**Fix for Bug A (semantic-agent-selector.ts):**
1. Fix `extractKeywords()` to split on BOTH whitespace AND hyphens:
   - `"gsd-stats"` → `["gsd", "stats"]`
   - `"gsd-stats --help"` → `["gsd", "stats", "help"]`
2. Add prefix/lineage matching: gsd-* commands should preferentially match gsd-* agents
3. **Remove `createTuiPrompt()` entirely** — interactive prompts MUST NOT be called inside a tool's `execute()` handler. When no match is found, return `{ agent: null, score: 0, fallback: true, userSpecified: false }`.

**Fix for Bug B (execute-slash-command.ts lines 184-195):**
1. Run `selectAgent()` as before, but **do NOT set `validated.agent`** from the result
2. Store the selected agent name in a SEPARATE variable for metadata/informational purposes
3. The execution flow continues to the TUI pipeline (Path 3), regardless of whether selectAgent found a match
4. The agent info is included in return metadata but does NOT affect dispatch routing

```typescript
// Stage 2: Resolve agent from intent — INFORMATIONAL ONLY. Does NOT change dispatch flow.
let suggestedAgent: string | undefined
if (!validated.agent && !commandBundle?.agent && client && typeof client.app?.agents === "function") {
  const rawAgents = await getAppAgents(client)
  const normalizedAgents = rawAgents.map((a) => {
    if (typeof a === "string") return { name: a, description: "" }
    const obj = a as { name?: string; id?: string; description?: string }
    return { name: obj.name || obj.id || "", description: obj.description }
  }).filter((a) => a.name.length > 0)
  const agentResult = await selectAgent(validated.command, normalizedAgents)
  // NOTE: agentResult.agent is NOT assigned to validated.agent
  // It is stored as metadata only — does not change dispatch flow
  if (agentResult.agent) {
    suggestedAgent = agentResult.agent
  }
}
```

#### Fix 3 (— H1 synthetic prompt deadlock & H3 TUI re-entrancy)
**Files:** `src/tools/session/dispatch-command.ts`, `src/tools/session/execute-slash-command.ts`

**Architecture: The TUI pipeline IS the correct dispatch path for main-session commands.**

Path 1 (synthetic prompt) and Path 2 (subtask dispatch) both call `session.prompt()` on `ctx.sessionID` — the SAME session running the tool. This is always a deadlock because the session is busy processing the tool.

**Fix for H1 (synthetic prompt path at lines 240-285):**
- For Path 1 (explicit agent override from args.agent): The synthetic prompt path tries to dispatch via `session.prompt()`. This is inherently problematic because it calls `session.prompt()` on the same session.
- **Solution:** Replace the synthetic prompt direct `session.prompt()` call with the TUI pipeline. When the user explicitly provides an agent, construct the prompt text with agent info and go through the TUI pipeline (appendPrompt + submitPrompt). The key: the tool returns FIRST, then the TUI processes.

```typescript
if (syntheticPromptAgent) {
  const promptText = expandCommandArguments(commandBundle.body, validated.arguments ?? "")
  // Route through TUI pipeline instead of direct session.prompt()
  // This avoids the deadlock because the tool returns before TUI processes
  await client.tui.clearPrompt()
  await client.tui.appendPrompt({ body: { text: promptText } })
  await client.tui.submitPrompt()
  return { /* success response */ }
}
```

**Fix for H3 (TUI pipeline at lines 441-450):**
- The TUI pipeline (clearPrompt → appendPrompt → submitPrompt) is ALREADY the correct pattern. The issues are:
  1. It never reached this code for gsd-* commands because selectAgent set validated.agent and hijacked the flow to Path 1 (Fix 2 above)
  2. `@agent` prefix in the TUI text may not work for agent override
- **Solution:** With Fix 2 applied, the code WILL reach the TUI pipeline for commands without explicit agent override. The `@agent` prefix in line 382-384 only applies when `validated.agent` is set (from explicit `args.agent`), so it works as intended for explicit overrides.

#### Summary of Exact Code Changes

##### File 1: `src/tools/session/semantic-agent-selector.ts`

**Change 1a — Fix `extractKeywords()` to split on hyphens:**
```typescript
function extractKeywords(text: string): string[] {
  const stopWords = new Set(["command", "the", "a", "an", "for", "to", "in", "on", "of", "with", "by", "at", "from"])
  return text
    .toLowerCase()
    .split(/\s+/)
    .flatMap((word) => word.split("-"))  // NEW: split on hyphens too
    .map((word) => word.replace(/[^a-z0-9-]/g, ""))
    .filter((word) => word.length > 0 && !stopWords.has(word))
}
```

**Change 1b — Remove `createTuiPrompt()` and add prefix matching:**
```typescript
// After extracting keywords, filter agents with prefix matching first
const commandPrefix = intent.startsWith("gsd-") ? "gsd-" : null

// Filter agents with prefix preference
const matches = normalizedAgents.filter((agent) => {
  // Prefer same-lineage agents
  if (commandPrefix && !agent.name.startsWith(commandPrefix)) {
    return false  // Skip agents from different lineage
  }
  const nameMatch = keywords.some((keyword) =>
    agent.name.toLowerCase().includes(keyword)
  )
  const descMatch = keywords.some((keyword) =>
    agent.description?.toLowerCase().includes(keyword)
  )
  return nameMatch || descMatch
})

// NO createTuiPrompt — just return null when no match
if (matches.length === 0) {
  return { agent: null, score: 0, fallback: true, userSpecified: false }
}
```

Also remove the `import { createTuiPrompt }` at the top.

##### File 2: `src/tools/session/execute-slash-command.ts`

**Change 2a — Lines 183-195: Store selectAgent result as metadata only, not validated.agent:**
Replace:
```typescript
// Stage 2: Resolve agent from intent if none explicitly provided
if (!validated.agent && !commandBundle?.agent && client && typeof client.app?.agents === "function") {
  const rawAgents = await getAppAgents(client)
  const normalizedAgents = ...
  const agentResult = await selectAgent(validated.command, normalizedAgents)
  if (agentResult.agent) {
    validated.agent = agentResult.agent  // BUG: mutates flow
  }
}
```
With:
```typescript
// Stage 2: Resolve agent from intent — INFORMATIONAL ONLY
let suggestedAgent: string | undefined
if (!validated.agent && !commandBundle?.agent && client && typeof client.app?.agents === "function") {
  const rawAgents = await getAppAgents(client)
  const normalizedAgents = rawAgents.map((a) => {
    if (typeof a === "string") return { name: a, description: "" }
    const obj = a as { name?: string; id?: string; description?: string }
    return { name: obj.name || obj.id || "", description: obj.description }
  }).filter((a) => a.name.length > 0)
  const agentResult = await selectAgent(validated.command, normalizedAgents)
  if (agentResult.agent) {
    suggestedAgent = agentResult.agent  // Metadata only, does NOT change flow
  }
}
```

**Change 2b — Patch Path 1 (synthetic prompt) to use TUI pipeline instead of direct session.prompt():**
Replace lines 240-284 (the synthetic prompt dispatch that calls `dispatchCommand` with `sessionID: ctx.sessionID`) with:
```typescript
if (syntheticPromptAgent) {
  const promptText = expandCommandArguments(commandBundle.body, validated.arguments ?? "")
  
  // Route through TUI pipeline instead of direct session.prompt()
  // The tool returns before TUI processes the command — no deadlock
  await client.tui.clearPrompt()
  await client.tui.appendPrompt({ body: { text: promptText } })
  await client.tui.submitPrompt()
  
  return {
    output: [
      `✓ Command ${cmdDisplay} dispatched via TUI.`,
      `  Agent: ${syntheticPromptAgent}`,
      `  Description: ${commandBundle.description}`,
    ].join("\n"),
    metadata: buildSuccessMetadata(args, validated, "synthetic-parent-prompt", ...),
    error: false,
  } as ToolResult
}
```

**Change 2c — Include suggestedAgent in return metadata:**
Update the metadata construction to include `suggestedAgent` when available. This is a backwards-compatible change.

## Implementation Applied (2026-05-27) — AWAITING UAT

### Changes Made

#### dispatch-command.ts
- **H1 fix:** Replaced `await client.session.prompt()` (synchronous blocking) with `queueMicrotask(async () => { await client.session.prompt(...) })` 
- dispatchCommand now returns `{ success: true }` immediately; the actual dispatch fires on next microtask
- Agent format/existence validation still happens synchronously (before deferral)

#### semantic-agent-selector.ts
- **H2 Bug A fix:** `extractKeywords()` now splits on BOTH whitespace AND hyphens via `.flatMap((word) => word.split("-"))`. `"gsd-stats"` → `["gsd", "stats"]`
- **H2 Bug A fix:** Added prefix/lineage matching: `"gsd-stats"` preferentially matches gsd-* agents; `"hm-task"` matches hm-* agents
- **H2 Bug A fix:** **Removed `createTuiPrompt()` entirely.** No more interactive prompts inside tool handler. Returns `{agent: null, fallback: true}` on no match
- Added `STOP_WORDS` Set hoisted to module level

#### execute-slash-command.ts
- **H2 Bug B fix:** `selectAgent()` result stored as `suggestedAgent` local variable — does NOT mutate `validated.agent`. Execution flow unchanged
- **H1 fix:** Restored synthetic prompt path (subtask:false + agent) but routes through TUI pipeline (appendPrompt → submitPrompt) instead of direct `session.prompt()`. Avoids deadlock because tool returns before TUI processes
- **H1 fix:** Subtask dispatch path still uses `dispatchCommand()` with queueMicrotask deferral
- `resolvedAgent` computed as `validated.agent || commandBundle?.agent || suggestedAgent` for validation + metadata
- Removed `@agent` prefix from TUI prompt text (user confirmed @agent in text doesn't work)

#### Test updates
- `semantic-agent-selector.test.ts`: Removed createTuiPrompt mock. Updated tests for hyphen splitting, prefix matching, and no-interactive-prompt fallback. 7 tests.
- `execute-slash-command.test.ts`: Added `flushDeferred()` helper (setImmediate wait). Added after tool.execute() calls that trigger deferred dispatch. 14 tests pass.
- `dispatch-command.test.ts`: Updated "returns error envelope" test to reflect deferred dispatch (success: true always, errors to console.error). 6 tests pass.

### What is NOT changed / known limitations
1. `@agent` prefix in TUI prompt text was removed — user confirmed it doesn't work
2. Subtask dispatch and synthetic prompt paths still call `session.prompt()` on same session, but deferred via queueMicrotask
3. TUI pipeline (clearPrompt → appendPrompt → submitPrompt) on same session may still cause re-entrancy issues
4. No E2E runtime tests performed yet — only unit tests pass (2592/2594, 2 pre-existing skipped)

### Files Changed (diff summary)
```
 M src/tools/session/dispatch-command.ts
 M src/tools/session/execute-slash-command.ts
 M src/tools/session/semantic-agent-selector.ts
 M tests/tools/dispatch-command.test.ts
 M tests/tools/execute-slash-command.test.ts
 M tests/tools/semantic-agent-selector.test.ts
```
Plus debug file updates.
All changes UNCOMMITTED — waiting for UAT.

### Verification Plan

1. **H2 fix verification — TUI path:** Call `execute-slash-command [command=gsd-stats]` (no agent). Should reach TUI pipeline without corruption. The `@agent` prefix should NOT be in the prompt text (since validated.agent is not set by selectAgent). Return metadata confirms command dispatched to TUI.

2. **H2 fix verification — keyword extraction:** `extractKeywords("gsd-stats")` → `["gsd", "stats"]`. `selectAgent("gsd-stats", agents)` should match gsd-* agents like "gsd-executor" (via prefix "gsd" matching).

3. **H2 fix verification — no interactive prompt:** `selectAgent("xyz-unknown", agents)` returns `{ agent: null, score: 0, fallback: true, userSpecified: false }` without calling any interactive prompt.

4. **Path 1 fix verification:** Call `execute-slash-command [command=gsd-stats, agent=gsd-executor]`. Should return immediately (not hang). The synthetic prompt path should route through TUI pipeline, not direct session.prompt().

5. **Regression tests:** 
   - Run existing test suites: `npx vitest run tests/tools/semantic-agent-selector.test.ts`
   - Typecheck: `npx tsc --noEmit`
   - Verify no test regressions

6. **Stability:** Repeat each path 10+ times.
