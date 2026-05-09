# Expert: Hook Composition Internals

> OpenCode SDK v1.14.44 | Source: `packages/plugin/src/index.ts`, `packages/sdk/js/src/v2/gen/types.gen.ts`
> Classification: BEYOND-DOCS — not in official documentation

## Mental Model: Hook Execution Model

```
Plugin A hooks["tool.execute.before"] ──┐
                                         ├──→ Go Runtime Sequences ──→ Tool Executes
Plugin B hooks["tool.execute.before"] ──┘
                                         │
                    tool.execute.after ◄──┘ (same sequencing for post-hooks)
```

**There is no composition API.** Each plugin returns a flat `Hooks` object. Multi-plugin hook ordering is determined by `Config.plugin[]` array order in `opencode.json` — not by any priority system within the SDK.

---

## HC-1: Sequential Last-Write-Wins for Output Mutation

Every hook with an `output` parameter receives the **same mutable object reference**. The hook mutates it in place (`output.args = newValue`). When multiple plugins hook the same event, each receives the **accumulated output** from the previous hook in sequence.

```typescript
// ✅ CORRECT: Spread to preserve previous plugin's mutations
"tool.execute.before": async (input, output) => {
  output.args = { ...output.args, myExtraField: "value" }
}

// ❌ WRONG: Destroys previous plugin's mutations
"tool.execute.before": async (input, output) => {
  output.args = { myExtraField: "value" }  // everything else lost!
}
```

**Implication:** If you need to add to `output.args` without destroying what other plugins set, you MUST read and spread the existing value.

---

## HC-2: Event Hook is Fire-and-Forget Observer (32-40+ Types)

The `event` hook has **no `output` parameter** — it's a pure observer:

```typescript
event?: (input: { event: Event }) => Promise<void>
```

You receive ALL events with NO filtering capability. Must dispatch internally:

```typescript
event: async (input) => {
  switch (input.event.type) {
    case "session.created": /* handle */ break
    case "message.updated": /* handle */ break
    case "pty.exited": /* handle */ break
    // ... you get 32-40+ types whether you want them or not
  }
}
```

### Complete v1 Event Type List

| Category | Events |
|----------|--------|
| **Session** | `session.created`, `session.updated`, `session.deleted`, `session.status`, `session.idle`, `session.compacted`, `session.diff`, `session.error` |
| **Message** | `message.updated`, `message.removed`, `message.part.updated`, `message.part.removed` |
| **Permission** | `permission.updated`, `permission.replied` |
| **Tool/PTY** | `pty.created`, `pty.updated`, `pty.exited`, `pty.deleted` |
| **File/VCS** | `file.edited`, `file.watcher.updated`, `vcs.branch.updated` |
| **UI** | `tui.prompt.append`, `tui.command.execute`, `tui.toast.show` |
| **Server** | `server.connected`, `server.instance.disposed` |
| **Other** | `installation.updated`, `installation.update.available`, `lsp.client.diagnostics`, `lsp.updated`, `todo.updated`, `command.executed` |

### v2 Additional Events

`project.updated`, `global.disposed`, `message.part.delta`, `permission.asked`, `question.asked`, `question.replied`, `question.rejected`, `mcp.tools.changed`, `mcp.browser.open.failed`, `worktree.ready`, `worktree.failed`, `workspace.ready`, `workspace.failed`, `workspace.restore`, `workspace.status`, `tui.session.select`, plus `SyncEvent*` variants.

---

## HC-3: Exact Before→Execute→After Sequence

```
1. tool.definition hook     → modify description/parameters (LLM sees result)
2. LLM generates tool call
3. Go runtime validates args against JSON Schema
4. tool.execute.before hook → mutate args (runs AFTER schema validation!)
5. Tool execute() runs with (possibly mutated) args
6. tool.execute.after hook  → mutate title/output/metadata
```

**Critical insight:** `tool.definition` runs during prompt construction, NOT during tool execution. It modifies what the LLM sees about the tool. `tool.execute.before`/`after` wrap the actual execution.

```typescript
// ✅ Use tool.definition to hide tools or change their description
"tool.definition": async (input, output) => {
  if (input.toolID === "delegate-task") {
    output.description = "Delegate work to a specialist subagent"  // dynamic description
  }
}
```

---

## HC-4: Compaction Flow — Context Recovery Pipeline

When the context window fills:

```
Context Overflow Detected
  → compaction.auto (default: true) triggers
  → experimental.session.compacting hook fires
    → output.context[] appends to default prompt
    → output.prompt replaces entirely (DANGEROUS)
  → AI summarizes conversation
  → CompactionPart created with:
    → overflow: boolean (emergency vs planned)
    → tail_start_id: where verbatim window begins
    → auto: boolean (was this automatic?)
  → experimental.compaction.autocontinue hook fires
    → output.enabled = true (default: sends synthetic "continue")
    → Set false to inject your own recovery message
```

### Compaction Configuration (`opencode.json`)

```json
{
  "compaction": {
    "auto": true,
    "prune": true,
    "tail_turns": 2,
    "preserve_recent_tokens": 4000,
    "reserved": 2000
  }
}
```

**Harness pattern:** Use `context[]` to inject session continuity metadata so the LLM retains critical delegation state after compaction:

```typescript
"experimental.session.compacting": async (input, output) => {
  const continuity = await loadContinuityState(input.sessionID)
  output.context.push(`DELEGATION STATE: ${JSON.stringify(continuity.activeDelegations)}`)
}
```

---

## HC-5: Permission Override — Circuit Breaker Pattern

```typescript
"permission.ask": async (input, output) => {
  // Circuit breaker: auto-deny when budget exhausted
  if (await isBudgetExhausted(input.sessionID)) {
    output.status = "deny"
    return
  }

  // Trusted operations: auto-allow
  if (input.type === "bash" && input.pattern?.startsWith(".hivemind/")) {
    output.status = "allow"
    return
  }

  // Default: show prompt to user
  output.status = "ask"
}
```

**Three states:** `"ask"` (default, show prompt), `"allow"` (silently approve), `"deny"` (silently reject). The `Permission` type includes `metadata: { [key: string]: unknown }` with tool-specific context.

---

## HC-6: Environment Variable Injection Per-Tool-Call

```typescript
"shell.env": async (input, output) => {
  // Inject session context into every shell execution
  output.env.OPENCODE_SESSION_ID = input.sessionID ?? ""
  output.env.OPENCODE_CALL_ID = input.callID ?? ""
  output.env.OPENCODE_CWD = input.cwd
}
```

This fires **before every bash/shell execution**. Use this instead of modifying tool arguments for env var injection.

---

## HC-7: Chat Parameter Injection Per-Agent

```typescript
"chat.params": async (input, output) => {
  // Subagent sessions get lower temperature
  if (input.agent === "subagent") {
    output.temperature = 0.2
  }
  // Orchestrator gets higher temperature for exploration
  if (input.agent === "coordinator") {
    output.temperature = 0.5
  }
}
```

Receives full context: `sessionID`, `agent`, `model`, `provider`, `message`. Enables agent-specific profile switching.

---

## Cross-Stack References

- **For tool schema patterns:** → `references/expert/tool-internals.md`
- **For client-server protocol:** → `references/expert/client-server.md`
- **For hook API signatures:** → `references/api/plugin.md` (Hooks interface)
- **For testing hook behavior:** → `../stack-vitest/` (mock hook outputs)
- **For gate-lifecycle integration:** → `../../gate-lifecycle-integration/` (9-surface authority table)
