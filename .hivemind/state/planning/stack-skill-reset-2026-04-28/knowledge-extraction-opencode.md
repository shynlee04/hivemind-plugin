# Deep Knowledge Extraction: stack-opencode
## Source: bundled/opencode-sdk-plugin.md (20,546 lines, SDK v1.14.28)
## Extracted: 2026-04-28

---

## HOOK COMPOSITION INTERNALS

### HC-1: No Composition API — Flat Per-Plugin Hooks
**Source:** Lines 235, 382-493 (Plugin type + Hooks interface)
**What:** Each plugin returns a single Hooks object. No priority, ordering, or composition API within SDK. Hook execution order for multi-plugin setups is determined by Go runtime's Config.plugin[] array order.
**Anti-pattern:** Writing a plugin that assumes it runs first or last in the hook chain.

### HC-2: Sequential Last-Write-Wins for Output Mutation
**Source:** Lines 393-493 (all hook signatures with output parameter)
**What:** All hooks with `output` receive the same mutable object reference. Sequential mutation, field-level last-write-wins. No deep merge.
**Anti-pattern:** Assuming deep merge. If Plugin A sets `{ args: { a: 1 } }` and Plugin B sets `{ args: { b: 2 } }`, Plugin B REPLACES the entire args object. Must spread: `output.args = { ...output.args, b: 2 }`.

### HC-3: Event Hook is Fire-and-Forget Observer (32-40+ Types)
**Source:** Lines 383, 4859-4892
**What:** `event` hook has NO output parameter — pure observer. Receives ALL events (no filtering). v1 has 32+ types, v2 has 40+ including SyncEvent* variants. Full list includes: server.instance.disposed, message.updated, message.part.updated, permission.updated, session.status, session.idle, session.compacted, file.edited, todo.updated, command.executed, pty.created/exited/deleted, tui.prompt.append, etc.
**Anti-pattern:** Assuming you can subscribe to specific event types. Must pattern-match input.event.type yourself.

### HC-4: Exact Before→Execute→After Sequence
**Source:** Lines 425-440
**What:** 1) tool.execute.before fires (can mutate args), 2) Tool executes with mutated args, 3) tool.execute.after fires (can mutate result). Separate tool.definition hook runs during LLM prompt construction, NOT during execution.
**Anti-pattern:** Putting execution logic in tool.definition. It runs during prompt construction, not tool execution.

### HC-5: Compaction Trigger and Customization
**Source:** Lines 456-466, 16116-16137
**What:** Triggered when context window fills (compaction.auto defaults true). Hook receives { sessionID } → output { context: string[], prompt?: string }. context[] appends to default prompt. prompt replaces entirely. CompactionPart has overflow:boolean (emergency vs planned) and tail_start_id (where verbatim window begins).
**Anti-pattern:** Setting prompt without understanding it replaces the ENTIRE compaction system prompt. Use context[] to append.

### HC-6: Autocontinue Post-Compaction
**Source:** Lines 467-484
**What:** After compaction, runtime adds synthetic "continue" message. Hook can disable it: output.enabled = false. Input includes overflow:boolean (emergency indicator). Critical for harness: disable autocontinue and inject your own recovery message with delegation state.
**Anti-pattern:** Disabling autocontinue without providing your own recovery mechanism — LLM simply stops.

### HC-7: Permission Override via permission.ask
**Source:** Line 420
**What:** Hook can silently override permission decisions: output.status = "allow"|"deny"|"ask". Full Permission object includes pattern, type, sessionID, metadata. Can implement circuit breaker patterns.
**Anti-pattern:** Setting output.status = "allow" for all permissions. Always inspect input.type and input.pattern.

### HC-8: chat.params for LLM Parameter Injection
**Source:** Lines 406-419
**What:** Mutate temperature, topP, topK, maxOutputTokens per-session/agent/model. Receives full context (sessionID, agent, model, provider, message).
**Anti-pattern:** Modifying options without spreading: output.options = { ...output.options, custom: true }.

### HC-9: shell.env Per-Tool-Call Environment Injection
**Source:** Lines 429-432
**What:** Fires before every bash execution. Inject env vars with callID and sessionID context. Clean way to pass session context to child processes.
**Anti-pattern:** Using tool.execute.before to inject env vars when shell.env is the dedicated hook.

### HC-10: command.execute.before for Slash Command Pre-Processing
**Source:** Lines 421-424
**What:** Fires before slash command executes. Inject Part[] into conversation. arguments is raw string (not structured data).
**Anti-pattern:** Assuming arguments is structured — needs parsing.

---

## TOOL DEFINITION & SCHEMA VALIDATION

### TS-1: tool() is Identity Function with Zero Validation
**Source:** packages/plugin/src/tool.ts (lines 669-676)
**What:** Pure TypeScript identity function — returns input unchanged. All type safety is compile-time only. Zero runtime validation.
**Anti-pattern:** Assuming tool() validates or registers anything. Build your own runtime validation.

### TS-2: tool.schema = Full Zod, But Complex Features Silently Break
**Source:** packages/plugin/src/tool.ts line 676; import at line 638
**What:** tool.schema = z (entire Zod library). BUT: z.transform(), .refine(), z.lazy() may silently produce incorrect JSON Schema or fail when the Go runtime converts for LLM tool-calling. Only z.string(), z.number(), z.boolean(), z.array(), z.enum(), z.object(), z.optional() are reliably converted.
**Anti-pattern:** Don't use z.transform(), .refine() with complex logic, or z.lazy() in tool args. LLM will never produce values that satisfy transforms.

### TS-3: ToolResult Must Be string or {output, metadata} — No Auto-Serialization
**Source:** packages/plugin/src/tool.ts line 667
**What:** Type is string | { output: string; metadata?: { [key: string]: any } }. No auto-serialization of objects/numbers/undefined. Returning anything else produces undefined runtime behavior.
**Anti-pattern:** Returning raw objects, numbers, or undefined from execute(). Always return string or { output: string }.

### TS-4: context.metadata() is Fire-and-Forget Display Setter
**Source:** packages/plugin/src/tool.ts line 656
**What:** Synchronous void function. Sets tool's TUI title in real-time. Only affects current invocation. metadata dict stored in session event stream.
**Anti-pattern:** Expecting metadata() to persist across calls. Don't put large payloads in metadata — bloats session.

### TS-5: context.ask() Returns Effect, NOT Promise
**Source:** packages/plugin/src/tool.ts lines 657, 660-665
**What:** Returns Effect.Effect<void>, not Promise. Triggers permission flow (not question flow). CANNOT await directly. Must use Effect.runPromise() or Effect combinators.
**Anti-pattern:** Writing await context.ask(input) — won't work because Effect.Effect is not a Promise.

### TS-6: Validation in Go Runtime, Not Plugin
**Source:** ToolStatePending at line 4392; hook at line 425
**What:** Lifecycle: LLM call → Go runtime creates ToolStatePending → validates against JSON Schema → if valid, tool.execute.before fires → execute() called. tool.execute.before runs AFTER schema validation — plugins can inject args that bypass type checks.
**Anti-pattern:** Relying on args being valid in execute() — they can be mutated by tool.execute.before hooks.

### TS-7: Abort Signal is Cooperative, Not Forced
**Source:** packages/plugin/src/tool.ts line 655; packages/sdk/js/src/process.ts lines 20390-20407
**What:** Standard AbortSignal triggered on session abort. Kills child processes (SIGTERM→SIGKILL). Does NOT auto-cancel async operations in execute() — must cooperatively check context.abort.aborted.
**Anti-pattern:** Ignoring abort signal. Cancelled sessions leave zombie processes.

### TS-8: tool.execute.after Can Rewrite Tool Output
**Source:** packages/plugin/src/index.ts lines 433-440
**What:** Post-execution hook can modify title, output string, and metadata. Other plugins can read and log tool output. This is how output truncation works (tool_output.max_lines/max_bytes config).
**Anti-pattern:** Putting sensitive data in tool output assuming it's private. Other plugins can see it.

### TS-9: ToolState 4-State Machine with Time Tracking
**Source:** packages/sdk/js/src/v2/gen/types.gen.ts lines 15204-15259
**What:** Pending(input, raw) → Running(input, title?) → Completed(input, output, title, metadata, time) | Error(input, error, metadata?, time). Completed.metadata is REQUIRED (always provided by runtime even if empty).
**Anti-pattern:** Detecting failure by checking for absent metadata — Completed always has it.

---

## CLIENT-SERVER PROTOCOL

### CP-1: v2 SDK Has Workspace Isolation + Session Restore
**What:** v2 SDK adds workspace isolation, session-restore, and sync endpoints not in v1. Use v2 for harness features.
**Implication:** Always use v2 client for delegation/session management.

### CP-2: SSE is Primary Event Bus
**What:** Subscribe to /event or /global/event for real-time events. Not HTTP polling. Primary integration point.
**Implication:** Harness event tracking should use SSE subscriptions, not polling.

### CP-3: prompt_async for Fire-and-Forget Message Injection
**What:** POST /session/{id}/prompt_async sends messages without waiting for response. Enables programmatic message injection.
**Implication:** Use for delegation dispatch without blocking.

### CP-4: Part-Level Mutations for Live Streaming
**What:** PATCH .../part/{partID} enables live tool result streaming during execution.
**Implication:** Use for real-time progress updates in long-running tools.

### CP-5: Session Status: idle/busy/retry (No Terminal State)
**What:** Sessions have 3 states: idle, busy, retry. No "completed" state — sessions live until deleted.
**Implication:** Session lifecycle management must handle non-terminal states. Sessions are long-lived.

### CP-6: No Structured Output Validation in SDK
**What:** SDK doesn't validate LLM structured output — Go server handles parsing. SDK receives results.
**Implication:** Structured output errors surface as ToolStateError, not SDK exceptions.

### CP-7: x-opencode-directory Header for Multi-Project Routing
**What:** Request interceptor converts x-opencode-directory header to query params for multi-project support.
**Implication:** Always include directory header for plugin API calls targeting specific projects.

### CP-8: Permission Auto-Allow for Delegation Tools
**What:** permission.ask hook can auto-allow specific tool patterns — enables delegation tools to bypass user prompts.
**Implication:** Harness can auto-allow trusted operations for subagent sessions.

### CP-9: Tool Results Support Structured Metadata
**What:** Use { output, metadata } shape for delegation status. Metadata persists in tool state.
**Implication:** Return structured results from delegation tools with status metadata.
