# DeepWiki Unresolved Query Packet

> Status update 2026-03-06: This file is now a mixed prompt-plus-reply evidence artifact, not a clean outbound packet. Local repo truth has moved forward since the original prompt: `CycleLogEntry.task_id` continuity is implemented and `hivemind_inspect.traverse` v1 now exists. If a fresh outbound DeepWiki packet is needed later, create a new file instead of reusing this one.

## Purpose

This packet is for OpenCode-native questions only. It assumes the current repository has already been reconciled locally and that stale local-structure questions should not be revisited.

## Settled Local Facts

Do not spend time re-answering these:

- `src/lib/injection-orchestrator.ts` exists.
- `src/lib/session-role.ts` exists.
- `.opencode/plugins/hiveops-governance/hooks/context-injection.ts` exists.
- budget hardening tests exist.
- `src/lib/compaction-engine.ts` uses `DEFAULT_COMPACTION_BUDGET`.
- `src/hooks/soft-governance.ts` already flushes mutations on tool boundaries.

## Current Repo Context

The repo still has live design questions in these slices:

- injection surfaces
  - `.opencode/plugins/hiveops-governance/hooks/context-injection.ts`
  - `src/hooks/session-lifecycle.ts`
  - `src/hooks/messages-transform.ts`
  - `src/lib/injection-orchestrator.ts`
- continuity
  - `src/hooks/soft-governance.ts`
  - `src/lib/session-split.ts`
  - `src/lib/session_coherence.ts`
  - `src/lib/compaction-engine.ts`
- session role and state
  - `src/lib/session-role.ts`
  - `src/schemas/brain-state.ts`

## Questions To Answer

### Q1: Child Session Prompt Behavior

For OpenCode child sessions created with `parentID`:

- what prompt/context inheritance is guaranteed by the runtime
- what is recomputed by hooks on the child session
- whether plugin hooks can cheaply distinguish child sessions from main sessions without expensive session lookups

### Q2: `task_id` Resumption Semantics

For `task_id`-based resumption:

- what prior messages are preserved
- whether synthetic parts are retained
- whether system transforms and messages transforms re-run on resume
- whether resumed sessions replay the last user message or only continue from persisted history

### Q3: Compaction and Resume Interaction

For sessions that compact and then continue:

- how compaction replay interacts with child sessions
- how compaction replay interacts with resumed `task_id` sessions
- whether synthetic parts or plugin-generated context can duplicate during compaction + resume sequences

### Q4: `tool.definition` Safety For Structured Output Hints

Can `tool.definition` be used safely to inject structured-output guidance for internal tools without confusing model behavior or causing schema/tool description drift?

Please answer with:

- what OpenCode guarantees
- what risks exist
- whether the better pattern is:
  - tool definition hinting
  - tool description text only
  - explicit runtime schema response validation
  - another native mechanism

### Q5: Session Kind / Parent Linkage Recovery

What is the cleanest OpenCode-native way inside plugin hooks to recover:

- whether a session is main vs child
- whether a session has `parentID`
- whether a session was resumed via `task_id`

The question is specifically about runtime access patterns and cost, not about redesigning my repo.

## What Not To Recommend

- Do not recommend adding a new plugin layer, tool family, SDK wrapper, or state system.
- Do not repeat file-existence or already-fixed budget/flush findings.
- Do not answer with generic agent-framework advice unless it is tied directly to OpenCode behavior.

## Required Output Format

1. Confirmed OpenCode-native behaviors
2. Unclear or unsupported assumptions
3. Recommended native integration patterns
4. Risks or caveats
5. Which of these questions still require empirical runtime validation

## Quality Bar

- Cite actual OpenCode behavior, not guesswork.
- Separate "documented behavior" from "likely but not guaranteed."
- Optimize for decisions that can shape a real refactor in this repo.

---

I now have comprehensive source-level evidence for all five questions. Here is the full analysis:

---

## 1. Confirmed OpenCode-Native Behaviors

### Q1: Child Session Prompt Behavior

**What is inherited at creation time:** A child session created with `parentID` is a **standalone DB row** with its own message history. The runtime stores `parentID` on the `Session.Info` record, but **no messages or prompt content are copied from the parent**. [0-cite-0](#0-cite-0) 

The `TaskTool` creates child sessions via `Session.create({ parentID: ctx.sessionID, ... })` and then issues a brand new `SessionPrompt.prompt()` call with the child session's ID and its own `parts` (the task prompt). The child gets a fresh user message and enters its own `loop()`. [0-cite-1](#0-cite-1) [0-cite-2](#0-cite-2) 

**What is recomputed by hooks on the child:** Every hook fires per-session. `experimental.chat.system.transform` fires in `LLM.stream()` with the child's `sessionID`. `experimental.chat.messages.transform` fires in the main `loop()` with the child's messages. `tool.execute.before` / `tool.execute.after` fire on every tool call in the child. **All hooks re-run independently for the child session — nothing is inherited from the parent's hook execution.** [0-cite-3](#0-cite-3) [0-cite-4](#0-cite-4) 

**Distinguishing child from main cheaply:** The `sessionID` is available in every hook input. From there, calling `client.session.get({ sessionID })` returns the `Session` object which has `parentID?: string`. If `parentID` is set, it's a child. **There is no cheaper built-in mechanism** — the SDK requires a `GET /session/:sessionID` call. However, this is a local SQLite query (not network I/O) since the plugin runs in-process. [0-cite-5](#0-cite-5) 

**Key gap:** `experimental.chat.messages.transform` receives `input: {}` — it does **not** receive `sessionID` in its input. `experimental.chat.system.transform` receives `input: { sessionID?: string; model: Model }` — the `sessionID` is optional. Inside `LLM.stream()`, it is passed as `{ sessionID: input.sessionID, model: input.model }`. [0-cite-6](#0-cite-6) [0-cite-3](#0-cite-3) 

**This means:** Your `messages.transform` hook cannot natively know which session it's operating on without inspecting `output.messages` for sessionID on the message info. Your `system.transform` hook can get `sessionID` from `input.sessionID`.

### Q2: `task_id` Resumption Semantics

The `task_id` in `TaskTool` is the child session's `id`. When `task_id` is passed: [0-cite-7](#0-cite-7) 

1. **Prior messages are preserved.** `Session.get(params.task_id)` loads the existing session. Then `SessionPrompt.prompt()` creates a **new** user message in that session and calls `loop()`. [0-cite-8](#0-cite-8) [0-cite-2](#0-cite-2) 

2. **All prior messages are loaded via `MessageV2.filterCompacted(MessageV2.stream(sessionID))`.** This includes synthetic parts, tool results, compaction summaries — everything that hasn't been compacted away. [0-cite-9](#0-cite-9) 

3. **`system.transform` and `messages.transform` re-run on resume.** The `loop()` calls them every iteration. System transform fires inside `LLM.stream()`. Messages transform fires at line 649 before each LLM call. [0-cite-4](#0-cite-4) 

4. **Resumed sessions do NOT replay the last user message.** A new user message is created by `SessionPrompt.prompt()` with the new prompt parts. The loop then picks up `lastUser` as the newly-created message. Previous messages are context only. [0-cite-10](#0-cite-10) 

### Q3: Compaction and Resume Interaction

**Compaction mechanics:** `filterCompacted` streams messages in reverse chronological order, stops at the first completed compaction boundary (a summary assistant message followed by its compaction user message), reverses, and returns only messages from the compaction point forward. [0-cite-11](#0-cite-11) 

**Compaction replay:** On auto-compaction with `overflow: true`, the compaction `process()` finds the most recent real user message before the compaction trigger, strips it from the compacted history, runs the compaction LLM, then **replays** that user message as a new user message post-compaction. This replay preserves `agent`, `model`, `format`, `tools`, `system`, `variant` from the original. [0-cite-12](#0-cite-12) [0-cite-13](#0-cite-13) 

**Child sessions:** Compaction operates only on the session it's called for. A child session compacts independently. There is no cross-session compaction interaction.

**Compaction + `task_id` resume risk:** If a child session compacts and is then resumed via `task_id`:
- `filterCompacted` truncates history at the compaction summary boundary
- A new user message is added
- `system.transform` and `messages.transform` re-run
- **Plugin-generated synthetic parts that were injected via `messages.transform` into pre-compaction messages are discarded** — they never existed in the DB, they were ephemeral mutations
- **However:** Plugin-injected parts that were persisted to DB (e.g., via `chat.message` hook) survive unless they were pre-compaction

**Duplication risk:** The `experimental.session.compacting` hook fires and allows injecting context into the compaction prompt. Post-compaction, the `system.transform` hook fires again for the next turn. If both inject the same content (e.g., HiveMind hierarchy), the model sees the hierarchy **both** inside the compaction summary text (authored by the compaction LLM) **and** in the system prompt (injected by `system.transform`). **This is a real duplication vector.** The `messages.transform` hook also re-runs, so any injections there also appear fresh. [0-cite-14](#0-cite-14) 

### Q4: `tool.definition` Safety For Structured Output Hints

The `tool.definition` hook fires in `ToolRegistry.tools()` for every tool, with `{ toolID }` as input and `{ description, parameters }` as mutable output. [0-cite-15](#0-cite-15) 

**What OpenCode guarantees:**
- The hook can modify `description` and `parameters` before they're sent to the model
- The modified values are passed through `ProviderTransform.schema()` then to `ai/tool()` with `jsonSchema()`
- The AI SDK validates tool call arguments against the `inputSchema` at execution time

**Risks:**
- **Schema drift:** If you modify `parameters` in `tool.definition`, you change what the model sees AND what the AI SDK validates against. If your hint changes the schema shape, tool calls will fail validation.
- **Description hinting is safer.** Modifying `description` only affects model prompting, not validation.
- **Parameters is dangerous for hints.** Mutating `parameters` to add "hint" fields means the model may try to fill them, and the underlying tool won't expect them (though JSON schema validation by the AI SDK should pass if they're optional).

**Recommended pattern:**
1. **Tool description text only** — safest for injecting structured output guidance. No schema/validation risk.
2. **`tool.definition` description mutation** — second best, same effect as above but more dynamic.
3. **Do not mutate `parameters`** for hint purposes — it couples to schema validation.
4. **Explicit runtime schema response validation** — not natively supported by the hook. You'd need `tool.execute.after` to validate/transform output, but that fires after execution, not before the model sees the schema. [0-cite-16](#0-cite-16) 

### Q5: Session Kind / Parent Linkage Recovery

**Available access patterns inside hooks:**

| Hook | `sessionID` available in input? | How to get it |
|---|---|---|
| `experimental.chat.system.transform` | Yes, `input.sessionID` (optional field) | Direct |
| `experimental.chat.messages.transform` | **No** | Must extract from `output.messages[0].info.sessionID` |
| `tool.execute.before` | Yes, `input.sessionID` | Direct |
| `tool.execute.after` | Yes, `input.sessionID` | Direct |
| `experimental.session.compacting` | Yes, `input.sessionID` | Direct |
| `event` | Varies by event type | `event.properties.sessionID` for session events | [0-cite-17](#0-cite-17) 

**Once you have `sessionID`:** Call `client.session.get({ sessionID })` via the SDK client. The response includes:
- `parentID?: string` — present only on child sessions
- `title` — prefixed with `"Child session - "` for auto-titled children [0-cite-18](#0-cite-18) 

**Is it a `task_id` resumed session?** There is no field on `Session.Info` that marks "this was resumed." The `task_id` is just the session ID. You can detect resume indirectly by checking if the session already has messages at the time your hook fires for a new user message. But there is **no first-class `resumed` flag** on the session object.

**Cost:** `client.session.get()` is a local HTTP fetch that goes through Hono → SQLite. It's cheap. For `messages.transform`, the overhead is extracting `sessionID` from message data first.

---

## 2. Unclear or Unsupported Assumptions

| Assumption | Status |
|---|---|
| `messages.transform` receives `sessionID` in input | **Unsupported.** Input is `{}`. Must extract from message data. |
| `system.transform` always has `sessionID` | **Partially supported.** It's `sessionID?: string` — optional. In `LLM.stream()` it's always passed, but in `Agent.generate()` it's omitted. |
| Child sessions inherit parent prompt/context | **False.** Children start empty. |
| Resumed `task_id` replays the last user message | **False.** A new user message is created. |
| `tool.definition` can safely modify parameters for hints | **Risky.** Modifying parameters changes validation schema. |
| Resumed sessions have a `resumed` flag | **Unsupported.** No such field exists. |

## 3. Recommended Native Integration Patterns

1. **Session kind detection:** Cache `Session.Info` by `sessionID` in your plugin's in-memory state. Fetch once per session lifecycle (on `session.created` event or first hook invocation), then check `parentID`. This avoids repeated lookups.

2. **`messages.transform` sessionID:** Extract `sessionID` from `output.messages[0]?.info.sessionID` at the top of the hook. This is guaranteed to be present since all messages belong to the same session.

3. **Compaction duplication prevention:** In your `experimental.session.compacting` hook, inject context into `output.context[]`. In your `system.transform` hook, check if the messages include a compaction summary (check for assistant messages with `summary: true`). If post-compaction, avoid injecting content that the compaction summary already contains.

4. **Tool definition hinting:** Use `description` mutation only. Do not touch `parameters` for hint purposes.

5. **Resume detection:** On `SessionPrompt.prompt()` for a `task_id` session, the `chat.message` hook fires with the new user message. At that point, check `output.messages` length or call `client.session.message.list()` to detect existing history.

## 4. Risks or Caveats

1. **Compaction + plugin context duplication** is the highest-risk item. The compaction LLM summarizes whatever context your hooks injected, then your hooks inject fresh context again. The model sees duplicated intent/hierarchy/governance signals.

2. **`messages.transform` having empty input `{}`** is a significant design gap for multi-session-aware plugins. Any workaround (extracting from messages) is brittle if the messages array is empty (shouldn't happen, but defensive code is warranted).

3. **`tool.definition` fires per-tool-init**, not per-turn. Tool definitions are resolved once via `resolveTools()` at the start of each loop step. If your `tool.definition` hook needs session-specific state, it has **no session context in its input** — it only gets `{ toolID }`. [0-cite-19](#0-cite-19) [0-cite-15](#0-cite-15) 

4. **Synthetic parts** (those with `synthetic: true`) are ephemeral within the loop — they're written to DB on creation but are treated as read-only context markers. They survive compaction replay if they're part of the replayed user message.

## 5. Questions Requiring Empirical Runtime Validation

| Question | Why |
|---|---|
| Whether `system.transform` `sessionID` is always defined in practice for plugin hooks during normal chat | The type says `optional`. Source shows it's passed in `LLM.stream()` but worth confirming it's never `undefined` in the child session path. |
| Exact behavior when `messages.transform` is called for a child session with zero prior messages | Edge case — first turn of a brand-new child. `output.messages` should have at least the new user message, but this should be validated. |
| Whether compaction summary text reliably includes plugin-injected context from `system.transform` | The compaction agent uses `system: []` (empty) and doesn't call `system.transform`. Plugin context only reaches compaction via `experimental.session.compacting`. So **`system.transform` injections are NOT in the compaction input** — they're only in regular turns. This needs empirical confirmation of whether models produce summaries that inadvertently echo system prompt content they saw in earlier turns. |
| Whether `tool.definition` mutations persist across loop steps within the same turn | `resolveTools()` is called every loop step, so `tool.definition` fires fresh each time. But if the plugin mutates the output object, confirm there's no caching. | [0-cite-20](#0-cite-20)
