# OpenCode Delegation & Context Engineering Patterns

> Condensed from OPENCODE-DETERMINISTIC-CONTEX-AGENT-DELEGATION.md + opencode-full-sdk-mechanism.md
> Last synced: 2026-03-01

---

## Progressive Context Injection (5 Layers)

Context is built incrementally — NOT dumped upfront.

### L1: Static System Instructions (always)
Agent prompt + provider prompt assembled at every LLM call. Plugins can reshape via `experimental.chat.system.transform` hook.

### L2: Walk-Up Instruction Discovery
`InstructionPrompt.resolve()` walks upward from file being read, finds `AGENTS.md` / `CLAUDE.md` / `CONTEXT.md`. Context injected **precisely when agent enters a new subdirectory** — not upfront.

Claim system prevents same file injected twice per turn.

### L3: Ephemeral Mid-Loop Reminders
On step > 1 with queued user messages, `SessionPrompt.loop()` wraps messages in `<system-reminder>` block. Ephemeral — never written to DB.

### L4: Plan-Mode Phase Injection
`insertReminders()` detects mode transitions (plan ↔ build), inserts phase-appropriate prompts. Plan mode gets full exploration → design → review → final-plan structure.

### L5: Plugin Hook on Every Message
`Plugin.trigger("chat.message", ...)` fires on every new user message — plugins can mutate content before DB commit.

---

## Context Rot Prevention

### Compaction
When tokens hit overflow threshold (model context - 20K buffer), `SessionCompaction.process()` sends history to **compaction agent** (all tools denied). Summary tagged `summary: true` = session boundary.

Structured summary format: Goal / Instructions / Discoveries / Accomplished / Files.

Plugin override: `experimental.session.compacting` hook.

### History Trimming
`filterCompacted()` walks messages in reverse, stops at last compaction boundary. Only post-compaction messages sent to model.

### Tool Output Pruning
`SessionCompaction.prune()` marks old tool outputs as `compacted`. Compacted outputs replaced with `"[Old tool result content cleared]"`. **Skills are protected from pruning.**

### Child Session Isolation
Child sessions get own `parentID` + hardcoded ruleset: `todowrite: deny`, `todoread: deny`, `task: deny`. Children CANNOT mutate parent's todo or spawn unauthorized sub-agents.

---

## State Across Sessions

### SQLite Persistence
All messages/parts stored in SQLite with upsert semantics. Session `parentID` creates persistent parent-child link.

### Task Resumption (`task_id`)
`TaskTool` accepts `task_id` parameter = prior session ID. Instead of fresh child session, continues existing session preserving all history.

### Compaction as Handoff
Summary structured for agent handoff: goal, instructions, discoveries, accomplished, files. Code comment: *"The summary will be used so another agent can read it and continue the work."*

### Session Permission Persistence
`Session.Info.permission` is full `PermissionNext.Ruleset[]` stored in DB. Child sessions carry constrained ruleset across restarts.

---

## Quality Gates via Permissions & Hooks

### Ruleset Evaluation Engine
`PermissionNext.evaluate()` finds **last matching rule** in merged ruleset (agent + session). Last-wins semantics.

Two-level delegation lattice: what agent allows ∩ what session allows.

### Tool-Level Gate (`ctx.ask`)
Every tool receives `ctx.ask()` in `Tool.Context`. Evaluates merged ruleset:
- `allow` → silent pass
- `deny` → `DeniedError` (halt)
- `ask` → suspend for human response

Error types: `RejectedError` (halt), `CorrectedError` (continue with feedback), `DeniedError` (config-denied).

### Plugin Permission Gate
Before blocking on human: `Plugin.trigger("permission.ask", ...)`. Plugin can auto-resolve to `allow`/`deny` — enabling CI-grade automated policies.

### Tool Execution Hooks
`tool.execute.before` / `tool.execute.after` wrap every tool call. Plugins can mutate args/output for sanitization, logging, or assertion gates.

### Doom Loop Detection
Last 3 tool calls identical → raises `permission: "doom_loop"` (default: `ask`). Set `doom_loop: deny` for hard-stop.

### Static Tool Removal
`PermissionNext.disabled()` removes tools with top-level `deny/*` from tool map BEFORE LLM sees them.

---

## Wave-Based Parallel Execution

### Task Tool: Forking Child Sessions
`TaskTool.execute()` creates child session with `Session.create({ parentID })`, calls `SessionPrompt.prompt()`, parent suspended while child runs.

### Natural Parallelism
LLM can return multiple `task` calls in one response → AI SDK executes them concurrently. Orchestrator agents invoke N tasks in one turn = Wave 1, then receive all results before generating Wave 2.

### Batch Tool
`BatchTool` accepts array of `{ tool, parameters }`, executes with `Promise.all()` (up to 25). Cannot call itself (prevents exponential fan-out).

### Dependency Tracking
Sequential LLM turns handle dependencies: Wave 1 results received → LLM reasons → Wave 2 emitted. Session loop's `while(true)` ensures each wave completes before next.

### Agent Permission Filter
`TaskTool` description built by filtering agents through `PermissionNext.evaluate("task", agentName)`. Denied agents excluded from description — LLM never sees them.

---

## SDK Session API (For Self-Delegation)

### CLI Delegation
```bash
opencode run --agent hivefiver --title "hivefiver:stage:X" "parsed prompt"
```

### SDK Delegation
```typescript
const child = await client.session.create({
  parentID: currentSessionID,
  title: "hivefiver:stage:spec",
  permission: stagePermissions["spec"]
});
await client.session.prompt({
  sessionID: child.id,
  agent: "hivefiver",
  parts: [{ type: "text", text: "workflow instructions..." }]
});
```

### Key Behaviors
- Child sessions DON'T inherit parent's loaded skills
- Each child loads skills fresh
- `task_id` parameter enables session resumption
- Permission rulesets persist in DB across restarts
