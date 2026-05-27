---
status: diagnosed
trigger: "execute-slash-command TUI crash — garbage characters '65M32M' and system hang when dispatching GSD commands"
created: 2026-05-27
updated: 2026-05-27
---

## Current Focus

hypothesis: "Three distinct vulnerabilities in execute-slash-command cause the TUI crash: (1) session.prompt() on current session while mid-tool-execution, (2) loose agent keyword matching selects wrong agent, (3) TUI submitPrompt() causes conversation re-entrancy"

test: Code analysis complete — all three dispatch paths analyzed

## Symptoms

expected: execute-slash-command dispatches `/gsd-progress` (or any GSD command) and the command executes cleanly in the TUI

actual: Terminal shows garbage characters like "65M32M" and the whole system hangs

errors: No formal error messages — TUI becomes unresponsive, terminal output corrupted

reproduction: Run any GSD command through execute-slash-command without explicit agent/subtask override

started: Observed during normal development workflow

## Eliminated

- hypothesis: "createTuiPrompt() in semantic-agent-selector.ts causes TUI state corruption"
  evidence: For `/gsd-progress`, keywords ["gsd", "progress"] match almost all gsd-* agents via name.includes("gsd"). Since matches.length > 0, createTuiPrompt() is never reached. The @clack/prompts interactive prompt only triggers when no agents match the intent, and even then, it has a !isTTY guard that prevents hanging. This hypothesis is **refuted** for the primary crash path.
  timestamp: 2026-05-27

- hypothesis: "resolveCommand() + getAppAgents() I/O overload is the primary cause"
  evidence: While the I/O load is real (90 commands + 75 agents + 34 skills = ~199 file reads with gray-matter + Zod, plus 1 HTTP call), the 5-second TTL cache prevents repeated reloads, and I/O overload alone would produce a timeout, not terminal garbage characters. The I/O load is a contributing factor for latency but NOT the root cause of the character corruption or hang.
  timestamp: 2026-05-27

## Evidence

- timestamp: 2026-05-27
  checked: execute-slash-command.ts agent resolution block (line 184-195)
  found: Agent resolution requires `!validated.agent && !commandBundle?.agent && typeof client.app?.agents === "function"`. For gsd-progress (no agent in frontmatter), this condition is TRUE. `client.app.agents()` is confirmed as a valid SDK v1 method (GET /agent). The agent resolution block IS entered.
  implication: Agent resolution will attempt to match every GSD command against 75 agents.

- timestamp: 2026-05-27
  checked: semantic-agent-selector.ts keyword matching (line 40-48)
  found: `selectAgent("gsd-progress", 75 agents)` extracts keywords ["gsd", "progress"]. ALL gsd-* agents match because their names contain "gsd". The first matched agent (highest score) gets assigned to validated.agent.
  implication: selectAgent ALWAYS returns an agent for gsd-* commands — the FIRST alphabetically/scored gsd agent gets selected, which is almost certainly the WRONG agent for the command. The command is dispatched to the wrong specialist agent.

- timestamp: 2026-05-27
  checked: Path 1 dispatch — synthetic parent prompt (lines 240-284)
  found: When agent is found, `syntheticPromptAgent` is set. `dispatchCommand()` is called with `client.session.prompt()` on `ctx.sessionID` (the CURRENT session). This injects a new user message into the SAME session that is mid-tool-execution.
  implication: **CRITICAL** — session.prompt() on the current session while the AI is processing a tool call creates a recursive conversation state conflict. The session cannot process new input while a tool is executing.

- timestamp: 2026-05-27
  checked: dispatch-command.ts session.prompt call (line 83-87)
  found: `client.session.prompt({ path: { id: sessionID }, body: { parts }, ... })` — sends the FULL command body as prompt text to the current session. The body can be 46+ lines (gsd-progress is 46 lines) with embedded file references.
  implication: The injected prompt is LARGE and the current session state machine was not designed to receive new input during tool execution.

- timestamp: 2026-05-27
  checked: Path 3 TUI dispatch (lines 442-450)
  found: `client.tui.clearPrompt()` → `client.tui.appendPrompt()` → `client.tui.submitPrompt()`. submitPrompt() makes an HTTP POST to `/tui/submit-prompt`, which causes the TUI to submit the prompt text as a NEW user message.
  implication: **CRITICAL** — Even if agent resolution fails (e.g., client.app.agents() throws or returns empty), the TUI submitPrompt() path also creates a conversation re-entrancy. The TUI processes this new input while still rendering the old tool's output.

- timestamp: 2026-05-27
  checked: "65M32M" garbage character pattern
  found: "65M32M" appears to be terminal escape code corruption. When bash commands within GSD workflows output Unicode characters (progress bars, block characters like ██) through the TUI pipeline during a state conflict, the terminal rendering engine produces garbled output. The raw bytes of Unicode characters (U+2588 = █, 0xE2 0x96 0x88 in UTF-8) interspersed with ANSI escape sequences produce this pattern when the TUI's rendering pipeline is mid-reset.
  implication: The garbage characters are a SYMPTOM of the conversation re-entrancy, not a separate bug.

- timestamp: 2026-05-27
  checked: File counts confirmed in .opencode/
  found: 90 command .md files (in `.opencode/command/`), 75 agent .md files (in `.opencode/agents/`), 34 skill directories (in `.opencode/skills/*/SKILL.md`). Combined I/O: ~199+ file reads with gray-matter parsing and Zod validation per call.
  implication: The `primitive-loader.ts` reads ALL agents (for cross-reference validation) even when only commands are needed. This unnecessary I/O multiplies latency.

- timestamp: 2026-05-27
  checked: gsd-progress command frontmatter
  found: No `agent:` field, no `subtask:` field. Frontmatter only has description, argument-hint, requires, and tools.
  implication: Command falls through to agent resolution. Without agent resolution, it would go to TUI pipeline.

## Resolution

root_cause: **Conversation re-entrancy via session.prompt() on the current session while mid-tool-execution.** When execute-slash-command dispatches a command through Path 1 (synthetic parent prompt), it calls `client.session.prompt()` on `ctx.sessionID` — the SAME session currently running the tool. This injects a new user message while the AI is still processing the original tool call, creating a recursive conversation state conflict. The TUI terminal rendering produces garbage characters because the rendering pipeline is corrupted by the dual input/output streams. The loose keyword matching in `selectAgent()` (where "gsd" matches all gsd-* agents) ensures every gsd-* command gets erroneously assigned to the first matched agent, triggering Path 1 instead of a clean delegation.

fix: Three fixes required (see Recommended Fix section)

verification: Pending human verification

files_changed:
  - src/tools/session/execute-slash-command.ts (primary)
  - src/tools/session/semantic-agent-selector.ts (secondary)
  - src/features/bootstrap/primitive-loader.ts (optimization)

---

## Issue: Conversation re-entrancy via session.prompt() on current session

### Evidence
1. `execute-slash-command.ts` line 242-249: When `syntheticPromptAgent` is set, calls `dispatchCommand()` with `sessionID: ctx.sessionID` (the CURRENT session)
2. `dispatch-command.ts` line 83: `client.session.prompt()` on the current session while tool execution is in progress
3. SDK v1.15.10 `session.prompt()` injects a message into the session via HTTP API
4. The AI is mid-tool-execution when this happens — the session state machine is in "processing tool" state
5. SDK method confirmed: `client.app.agents()` (v1 SDK) at `sdk.gen.js:576` calls `GET /agent`

### Root Cause Analysis
The fundamental problem is that **all three dispatch paths** in `execute-slash-command.ts` mutate the conversation state of the current session while tool execution is in progress:

- **Path 1** (lines 240-284): `client.session.prompt()` on current session — injects message mid-execution
- **Path 2** (lines 288-371): `client.session.prompt()` with subtask — may create child session but still mutates parent session
- **Path 3** (lines 442-450): `client.tui.submitPrompt()` — submits new user message mid-execution

The "65M32M" garbage characters are terminal escape code corruption from bash/Unicode output (GSD progress commands use Unicode block characters ██ which are encoded as 3-byte UTF-8 sequences 0xE2 0x96 0x88) that get mixed into the TUI's rendering pipeline during the state conflict.

### Hypothesis Testing Results

| Hypothesis | Verdict | Rationale |
|------------|---------|-----------|
| H1: createTuiPrompt() TUI state corruption | **REFUTED** | Keyword "gsd" matches all gsd-* agents, so createTuiPrompt() is never reached for gsd-* commands. TTY guard prevents hanging when reached. |
| H2: submitPrompt() conversation turn conflict | **CONFIRMED (Path 3)** | submitPrompt() injects new message mid-execution, creating conversation re-entrancy. But for gsd-* commands, Path 1 is actually taken, not Path 3. |
| H3: resolveCommand + getAppAgents I/O overload | **CONTRIBUTING FACTOR** | 199+ file reads is real but causes timeout, not garbage characters. Caching mitigates repeated calls. |

**Additional finding:** The agent resolution logic has a severe bug — the keyword "gsd" matches ALL gsd-* agents indiscriminately. `selectAgent()` returns the first matched agent (e.g., "gsd-debugger"), which then receives the full command body as a synthetic parent prompt. This means:
- `/gsd-progress` gets dispatched to "gsd-debugger" (or whatever gsd agent matches first)
- The WRONG agent executes the command
- The command body (46 lines + embedded references) is sent to the wrong specialist

### Verdict
**PRIMARY ROOT CAUSE:** Conversation re-entrancy — calling `session.prompt()` on the current session while mid-tool-execution (Path 1, line 242). 

**TERTIARY ROOT CAUSE:** TUI submitPrompt() conversation re-entrancy (Path 3, line 450) — affects commands where agent resolution fails.

**CONTRIBUTING FACTOR:** Loose keyword matching in `selectAgent()` assigns wrong agents to commands (semantic-agent-selector.ts:40-48).

**CONTRIBUTING FACTOR:** `loadPrimitives()` reads 75 agent + 34 skill files unnecessarily when only command discovery is needed (primitive-loader.ts:80-84).

### Recommended Fix

#### Fix 1 (CRITICAL — execute-slash-command.ts)
**File:** `src/tools/session/execute-slash-command.ts`
**Lines:** 240-284 and 442-450

**Problem:** `session.prompt()` is called on `ctx.sessionID` (current session) while mid-tool-execution.

**Fix:** Before dispatching through Path 1 or Path 3, create a CHILD session. Dispatch the command to the child session instead. This isolates the command execution from the current tool execution.

```typescript
// BEFORE (line 242):
const dispatchResult = await dispatchCommand({
  client,
  sessionID: ctx.sessionID,  // BUG: current session
  agent: syntheticPromptAgent,
  promptText,
  subtask: false,
  directory: ctx.directory,
})

// AFTER: Create child session first, then dispatch to child
const childSession = await createSession(client, {
  title: `cmd-${validated.command}-${Date.now()}`,
  parentID: ctx.sessionID,
  directory: ctx.directory,
})
const childSessionID = getSessionID(childSession)
const dispatchResult = await dispatchCommand({
  client,
  sessionID: childSessionID,  // FIX: use child session
  agent: syntheticPromptAgent,
  promptText,
  subtask: false,
  directory: ctx.directory,
})
```

Same pattern for Path 3 (line 442-450): create a child session before `clearPrompt()/appendPrompt()/submitPrompt()`.

#### Fix 2 (HIGH — semantic-agent-selector.ts)
**File:** `src/tools/session/semantic-agent-selector.ts`
**Lines:** 40-48

**Problem:** Keyword "gsd" matches ALL gsd-* agents because `agent.name.includes(keyword)` matches any agent whose name contains "gsd". This makes the `selectAgent` function useless for gsd-* commands — it always returns the first alphabetic gsd agent.

**Fix:** Add prefix-based filtering to disqualify lineage prefixes that don't match the command namespace:

```typescript
const matches = normalizedAgents.filter((agent) => {
  // Skip agents that belong to a different lineage than the command
  // GSD commands should only be matched to GSD agents
  const commandPrefix = intent.startsWith("gsd-") ? "gsd-" : null
  if (commandPrefix && !agent.name.startsWith(commandPrefix)) {
    return false
  }
  const nameMatch = keywords.some((keyword) =>
    agent.name.toLowerCase().includes(keyword)
  )
  const descMatch = keywords.some((keyword) =>
    agent.description?.toLowerCase().includes(keyword)
  )
  return nameMatch || descMatch
})
```

Alternatively, skip agent resolution entirely when the command has frontmatter that doesn't specify agent — this is what `commandBundle?.agent` already guards for.

#### Fix 3 (MEDIUM — primitive-loader.ts)
**File:** `src/features/bootstrap/primitive-loader.ts`
**Lines:** 80-84

**Problem:** `discoverCommandBundles()` scans agents and skills even when only commands are needed.

**Fix:** Add a filter parameter to skip unnecessary scans:

```typescript
export async function loadPrimitives(options: LoaderOptions & { 
  filter?: { agents?: boolean; commands?: boolean; skills?: boolean }
}): Promise<LoadResult> {
  const filter = options.filter ?? { agents: true, commands: true, skills: true }
  if (filter.agents) await scanAgents(root, result, options.globalConfigPath)
  if (filter.commands) await scanCommands(root, result, options.globalConfigPath)
  if (filter.skills) await scanSkills(root, result, options.globalConfigPath)
  // ...
}
```

### Risk Assessment

| Fix | Risk | Mitigation |
|-----|------|------------|
| Fix 1 (child session) | LOW — Child sessions are designed for isolation. Creates a new session per command invocation. | Ensure cleanup/abort on failure. Verify session limit isn't exceeded for rapid command invocations. |
| Fix 2 (prefix filter) | LOW — Makes agent matching more specific. Falls back to current behavior if no prefix match. | Test with hm-*, hf-*, gsd-* commands to verify correct agent selection. |
| Fix 3 (filter parameter) | LOW — Only affects I/O, not behavior. Keeps backward compatibility by defaulting all=true. | Test that backward compatibility holds for callers that need all primitives. |

**Combined risk:** LOW. The fixes are independent and don't change the tool's public API. The child session fix is the most critical — without it, ALL command dispatches through Path 1 or Path 3 risk conversation corruption.
