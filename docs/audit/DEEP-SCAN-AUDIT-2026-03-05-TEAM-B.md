# Deep-Scan Audit: HiveMind Plugin × OpenCode Ecosystem

## A) System Map (Depth + Width)

### A1. Entry-Points Inventory

| Entry Point | Repo | Downstream Path |
| --- | --- | --- |
| `opencode tui` / `opencode` CLI | opencode | `yargs` → `Server.listen()` → `Session.createNext()` → `SessionPrompt.loop()` |
| Desktop app (Tauri) | opencode | HTTP+SSE → `Server.App()` → same server routes |
| VS Code / Zed IDE extensions | opencode | HTTP+SSE → `Server.App()` |
| `@opencode-ai/sdk` client | opencode | HTTP+SSE → `Server.App()` |
| `npx hivemind-context-governance init` | hivemind-plugin | `src/cli.ts` → `initProject()` → `.hivemind/` dir creation |
| `/hivemind-scan`, `/hivemind-status`, `/hivemind-compact` | hivemind-plugin | Slash commands → OpenCode command dispatch → skill load |
| `HiveMindPlugin` factory (plugin load) | hivemind-plugin | OpenCode `Plugin.state()` → `import(plugin)` → `HiveMindPlugin(input)` → 6 hooks + 6 tools registered |
| `opencode.json` `plugin: [...]` config | opencode | `Plugin.state()` → `BunProc.install()` → `import(path)` → `fn(input)` |
| `tool/` or `tools/` dirs in config | opencode | `ToolRegistry.state` scans on first access |
| MCP server connections | opencode | `MCP.add()` → `MCP.tools()` merged into `ToolRegistry.tools()` |
| `Bus` internal events | opencode | `Bus.publish()` → all `hook.event?.(...)` listeners |
| `eventBus` (in-process) | hivemind-plugin | `fileWatcher.on("event")` → `eventBus.emitEvent()` → internal subscribers |

### A2. Lifecycle + Flow Diagrams

### Normal Flow (User Message → LLM Response)

```mermaid
sequenceDiagram
    participant U as "User (TUI/Desktop/IDE)"
    participant S as "Server (Hono)"
    participant SP as "SessionPrompt.prompt()"
    participant LP as "SessionPrompt.loop()"
    participant HM_SYS as "HiveMind: system.transform"
    participant HM_MSG as "HiveMind: messages.transform"
    participant LLM as "LLM (via ai SDK)"
    participant HM_BEFORE as "HiveMind: tool.execute.before"
    participant TOOL as "Tool.execute()"
    participant HM_AFTER as "HiveMind: tool.execute.after"

    U->>S: "POST /session/{id}/prompt"
    S->>SP: "SessionPrompt.prompt(input)"
    SP->>SP: "createUserMessage() + Session.touch()"
    SP->>LP: "loop({ sessionID })"
    LP->>LP: "start(): create AbortController"
    loop "while not finished"
        LP->>HM_SYS: "Plugin.trigger('experimental.chat.system.transform')"
        HM_SYS-->>LP: "output.system[] += <hivemind> block"
        LP->>HM_MSG: "Plugin.trigger('experimental.chat.messages.transform')"
        HM_MSG-->>LP: "output.messages transformed (checklist, anchors)"
        LP->>LLM: "LLM.stream(system, messages, tools)"
        LLM-->>LP: "streamed text/tool-calls"
        alt "Tool call"
            LP->>HM_BEFORE: "Plugin.trigger('tool.execute.before')"
            HM_BEFORE-->>LP: "advisory (never blocks)"
            LP->>TOOL: "tool.execute(args, ctx)"
            TOOL-->>LP: "result"
            LP->>HM_AFTER: "Plugin.trigger('tool.execute.after')"
            HM_AFTER-->>LP: "metrics updated, toasts emitted"
        end
    end
    LP-->>U: "final response (SSE stream)"
``` [0-cite-2](#0-cite-2) [0-cite-3](#0-cite-3)

#### Compaction Flow

```mermaid
sequenceDiagram
    participant LP as "SessionPrompt.loop()"
    participant SC as "SessionCompaction"
    participant HM_C as "HiveMind: session.compacting"
    participant CA as "Compaction Agent"
    participant BJ as "brain.json"
    participant HJ as "hierarchy.json"

    LP->>SC: "isOverflow(tokens, model)"
    SC-->>LP: "true"
    LP->>LP: "Queue CompactionPart on user message"
    LP->>SC: "SessionCompaction.process()"
    SC->>HM_C: "Plugin.trigger('experimental.session.compacting')"
    HM_C->>BJ: "load brain state"
    HM_C->>HJ: "load hierarchy tree"
    HM_C-->>SC: "output.context[] += hierarchy/anchors/mems preservation block"
    SC->>CA: "Invoke compaction agent with context"
    CA-->>SC: "Summary message (summary: true)"
    SC->>SC: "filterCompacted() excludes pre-summary messages"
    LP->>LP: "Continue loop with compacted context"
``` [0-cite-4](#0-cite-4) [0-cite-5](#0-cite-5)

### A3. Hook/Injection Matrix

| Hook | SDK Key | Location | Trigger | Ordering | Scope | Mutable State | Side Effects | Conflicts |
|---|---|---|---|---|---|---|---|---|
| Session Lifecycle | `experimental.chat.system.transform` | `src/hooks/session-lifecycle.ts` | Every LLM turn, before inference | First in `hooks[]` order | Session | `output.system[]` (append/prepend) | Queues state init mutations; checks stale sessions | Governance instruction injection duplicated with Compaction hook |
| Messages Transform | `experimental.chat.messages.transform` | `src/hooks/messages-transform.ts` | Every LLM turn, after system transform | After system hook | Session | `output.messages[]` (prepend/append parts) | Session coherence first-turn injection, cognitive state packing | May inject synthetic parts that confuse LLM if large |
| Tool Gate | `tool.execute.before` | `src/hooks/tool-gate.ts` | Before each tool call | Before tool exec | Tool call | `output.args` (technically mutable but unused) | Queues drift score updates | EXEMPT_TOOLS list mixes legacy + canonical names |
| Soft Governance | `tool.execute.after` | `src/hooks/soft-governance.ts` | After each tool call | After tool exec | Tool call | `output.title`, `output.output`, `output.metadata` | `queueStateMutation()`, toast emission, auto-commit, session-split | Module-scoped mutation queue is global singleton |
| Compaction | `experimental.session.compacting` | `src/hooks/compaction.ts` | On context window compaction | During compaction | Session | `output.context[]`, `output.prompt` | Queues clearing of `next_compaction_report` | Governance instruction injection (DUPLICATE of session-lifecycle) |
| Event Handler | `event` | `src/hooks/event-handler.ts` | On Bus events | Fan-out from `Plugin.init()` | Global | Internal brain state | Direct state manager writes OR queues | Bypasses CQRS for some paths | [0-cite-6](#0-cite-6) [0-cite-7](#0-cite-7)

### A4. Schema/Contract Map

| Schema | Defined In | Validator | Consumers | Drift Risk |
|---|---|---|---|---|
| `BrainState` | `hivemind-plugin/src/schemas/brain-state.ts` | None (plain TS interface) | All hooks, all tools, `StateManager` | **HIGH** — forward-migration via `??=` in `load()` means any field rename silently breaks |
| `HierarchyTree` | `hivemind-plugin/src/lib/hierarchy-tree.ts` | None | Session tool, hierarchy tool, compaction hook | MEDIUM — no lock, direct `readFile`/`writeFile` |
| `HiveMindConfig` | `hivemind-plugin/src/schemas/config.ts` | None (TS types only) | All hooks (re-read each invocation) | LOW — simple flat config |
| `ArtifactEvent` | `hivemind-plugin/src/schemas/events.ts` | Zod schema | `eventBus` (in-process) | LOW — but NOT used for SDK `Event` dispatch |
| `Session.Info` | `opencode/packages/opencode/src/session/index.ts` | Zod (`SessionTable`) | OpenCode core, SDK clients, plugins via `event` | LOW — schema-driven via Drizzle/SQLite |
| `MessageV2.Info` | `opencode/packages/opencode/src/session/message-v2.ts` | Discriminated union (Zod) | OpenCode core, processor, SDK | LOW |
| `Plugin` / `Hooks` | `opencode/packages/plugin/src/index.ts` | TypeScript interface only | Plugin loading in OpenCode core | **MEDIUM** — `@ts-expect-error` in core `Plugin.trigger()` |
| `ToolDefinition` | `opencode/packages/plugin/src/tool.ts` | Zod (parameter validation) | `ToolRegistry`, plugin tools | LOW |
| `DetectionState` | `hivemind-plugin/src/lib/detection.ts` | None | Soft governance hook, session lifecycle hook | **HIGH** — not formally validated on load | [0-cite-8](#0-cite-8) [0-cite-7](#0-cite-7) [0-cite-9](#0-cite-9)

### A5. Context Assembly Map

```mermaid
flowchart TD
    subgraph "Context Sources"
        SYS["SystemPrompt (OpenCode base)"]
        INST["InstructionPrompt (user AGENTS.md)"]
        AGENT["Agent-specific prompt"]
        GOV["HIVE_MASTER_GOVERNANCE_INSTRUCTION"]
        HIVEMIND["<hivemind> block (session-lifecycle.ts)"]
        CHECKLIST["Pre-stop checklist (messages-transform.ts)"]
        ANCHORS["<immutable-anchors> (anchors.json)"]
        COG["Cognitive state pack (cognitive-packer.ts)"]
        COHERENCE["First-turn context (session_coherence.ts)"]
        COMPACT["Compaction preservation block"]
    end

    subgraph "Transformations"
        BUDGET["Character budget cap (2500/4500)"]
        SECTIONS["assembleSections() priority ordering"]
        PRUNE["Tool output pruning (40K protect)"]
        FILTER["filterCompacted() (post-summary only)"]
        TRUNC["Truncate.output() per tool"]
    end

    subgraph "Sinks"
        LLM_CTX["LLM context window"]
        BRAIN["brain.json (metrics, detection state)"]
        HIER["hierarchy.json"]
        MEMS["mems.json"]
        LOGS["HiveMind.log"]
        SESSIONS["sessions/archive/*.md"]
    end

    SYS --> LLM_CTX
    INST --> LLM_CTX
    AGENT --> LLM_CTX
    GOV --> BUDGET --> LLM_CTX
    HIVEMIND --> SECTIONS --> BUDGET
    CHECKLIST --> LLM_CTX
    ANCHORS --> LLM_CTX
    COG --> LLM_CTX
    COHERENCE --> LLM_CTX
    COMPACT --> LLM_CTX
    PRUNE --> LLM_CTX
    FILTER --> LLM_CTX
    TRUNC --> LLM_CTX

    style GOV fill:#ffcccc,stroke:#cc0000
    style HIVEMIND fill:#ffffcc,stroke:#cccc00
```

**Corruption Risks Flagged:**

1. `HIVE_MASTER_GOVERNANCE_INSTRUCTION` is injected by BOTH `session-lifecycle.ts` (via `unshift`) AND `compaction.ts` (via `push`). Deduplication uses string marker matching, but if the marker text drifts even slightly, duplicates accumulate.
2. `messages-transform.ts` injects synthetic parts into the message array. If the LLM sees these as user messages, it can cause hallucinated tool calls.
3. `cognitive-packer.ts` reads from `graph/` files with no schema validation — corrupt graph state flows into LLM context.
4. First-turn coherence (`session_coherence.ts`) pulls from archived sessions via raw file parsing — if archive format changes, stale/corrupt data enters context. [0-cite-10](https://www.notion.so/Scan-and-audit-from-team-A-vs-B-319926f31a4d8062be19c9f8299ee95c?pvs=21) [0-cite-11](https://www.notion.so/Scan-and-audit-from-team-A-vs-B-319926f31a4d8062be19c9f8299ee95c?pvs=21) [0-cite-12](https://www.notion.so/Scan-and-audit-from-team-A-vs-B-319926f31a4d8062be19c9f8299ee95c?pvs=21)

### A6. Orchestrator Lineage Map

There are effectively **two event/state orchestration lineages**:

| Aspect | OpenCode Core | HiveMind Plugin |
| --- | --- | --- |
| **Event System** | `Bus` (internal pub/sub, typed via `BusEvent.define`) | `eventBus` (Node.js `EventEmitter` singleton, `ArtifactEvent` schema) |
| **State Persistence** | SQLite via Drizzle ORM (`SessionTable`, `MessageTable`, `PartTable`) | JSON files on disk (`brain.json`, `hierarchy.json`, `mems.json`) with custom `FileLock` |
| **Session Model** | `Session.Info` (UUID, timestamps, model, agent, parent) | `SessionState` inside `BrainState` (separate UUID, mode, governance_status) |
| **Tool Registry** | `ToolRegistry` (project-scoped `Instance.state`) | 6 HC5 tools registered as `plugin.tool` at init |
| **Compaction** | `SessionCompaction.process()` — invokes compaction agent, writes summary message | `createCompactionHook` — injects preservation context BEFORE OpenCode's compaction agent runs |
| **Pruning** | `SessionCompaction.prune()` — removes old tool outputs (40K protect) | No direct pruning; `hierarchy_prune` prunes hierarchy tree |
| **Context Assembly** | `SystemPrompt` + `InstructionPrompt` + `Plugin.trigger(system.transform)` | Injects `<hivemind>` block into `output.system[]` |
| **Metrics** | Token counts on `MessageV2.Assistant` (input/output/cache) | Turn counts, drift score, violation count, keyword flags in `BrainState.metrics` |
| **Memory** | No built-in cross-session memory | `mems.json` (shelf-organized) + `anchors.json` (immutable KV) |

**Critical Observation:** The two systems maintain **parallel session identities**. OpenCode's `sessionID` (from `Session.Info.id`) is passed into hooks as `input.sessionID`, but HiveMind creates its own `session.id` via `crypto.randomUUID()` in `BrainState`. These are never correlated. [0-cite-13](https://www.notion.so/Scan-and-audit-from-team-A-vs-B-319926f31a4d8062be19c9f8299ee95c?pvs=21) [0-cite-14](https://www.notion.so/Scan-and-audit-from-team-A-vs-B-319926f31a4d8062be19c9f8299ee95c?pvs=21)

---

## B) Risk Register + Edge Cases

### Priority 1: Critical

| # | Issue | Severity | Blast Radius | Files | Root Cause |
| --- | --- | --- | --- | --- | --- |
| **R1** | **Mutation queue is a global module-level singleton** — all sessions share one `mutationQueue[]` array. Concurrent sessions can have their mutations interleaved or lost. | Critical | All multi-session scenarios | `src/lib/state-mutation-queue.ts:94` | Module-scoped array, no session partitioning |
| **R2** | **`hierarchy.json` has no file locking** — `loadTree()`/`saveTree()` use raw `readFile`/`writeFile`. Concurrent hooks or tools can corrupt the file. | Critical | Any session with parallel tool calls | `src/lib/hierarchy-tree.ts:836-865` | Missing `FileLock` unlike `brain.json` |
| **R3** | **Dual session ID divergence** — OpenCode `sessionID` and HiveMind `BrainState.session.id` are never correlated. `event-handler.ts` receives OpenCode session IDs but `brain.json` tracks its own. | Critical | Session resume, cross-session coherence | `src/schemas/brain-state.ts:14`, `src/hooks/event-handler.ts` | Two independently generated UUIDs |
| **R4** | **`BrainState` has no runtime schema validation** — `load()` does `JSON.parse()` + inline `??=` migration. A corrupt `brain.json` missing a nested object (e.g., `metrics: null`) will throw at any hook access. | High | Any session after disk corruption | `src/lib/persistence.ts:159-201` | No Zod/schema parse on load |

### Priority 2: High

| # | Issue | Severity | Files | Root Cause |
| --- | --- | --- | --- | --- |
| **R5** | **`flushMutations` is only called from `hivemind_session` tool** — if the tool is never called, mutations accumulate indefinitely (up to `MAX_QUEUE_SIZE=100`, then FIFO drop). The soft governance hook queues mutations every tool call, but flush only happens at session tool boundaries. | High | `src/tools/hivemind-session.ts`, `src/lib/state-mutation-queue.ts:186` | Architectural gap — flush trigger too narrow |
| **R6** | **Governance instruction injection is duplicated** — `session-lifecycle.ts` does `output.system.unshift(HIVE_MASTER_GOVERNANCE_INSTRUCTION)` and `compaction.ts` does `output.context.push(...)`. The deduplication marker check works within each array but not across them. After compaction, the instruction can appear twice in context. | High | `src/hooks/session-lifecycle.ts:40-46`, `src/hooks/compaction.ts:40-45` | Two hooks independently inject the same content into different output arrays |
| **R7** | **`EXEMPT_TOOLS` and `WRITE_TOOLS` in tool-gate.ts mix legacy and canonical names** — e.g., `declare_intent`, `map_context`, `scan_hierarchy` are listed alongside `hivemind_inspect`. If agents use canonical HC5 names, they bypass exemption checks for the old names. | High | `src/hooks/tool-gate.ts:13-31` | Incomplete migration from legacy to HC5 |
| **R8** | **`deepMerge` in mutation queue replaces arrays** — this means `queueStateMutation({ payload: { metrics: { files_touched: ["new.ts"] } } })` replaces the entire `files_touched` array instead of appending. Any hook that intends to add items will silently lose existing data. | High | `src/lib/state-mutation-queue.ts:329-372` | Array-replace semantics in generic deep merge |

### Priority 3: Medium

| # | Issue | Severity | Files | Root Cause |
| --- | --- | --- | --- | --- |
| **R9** | **`eventBus` (HiveMind) and `Bus` (OpenCode) are two separate event systems** — `eventBus` only handles file-watcher events (`file:created/modified/deleted`). OpenCode's `Bus` handles session events. The `createEventHandler` hook bridges some OpenCode events but the mapping is partial. | Medium | `src/lib/event-bus.ts`, `src/hooks/event-handler.ts` | Two independent event systems |
| **R10** | **Config is re-read from disk on every hook invocation (Rule 6)** — this means 4+ filesystem reads per LLM turn just for config. No caching, no invalidation. | Medium | `src/hooks/session-lifecycle.ts:68`, `src/hooks/soft-governance.ts:193` | Correctness over performance trade-off |
| **R11** | **`sdk-context.ts` uses `process.cwd()` as fallback for log dir** — if the working directory changes mid-session, logs go to the wrong location. | Medium | `src/hooks/sdk-context.ts:29`, `src/lib/state-mutation-queue.ts:41` | Static module-level path resolution |
| **R12** | **Skills duplication between `skills/` (root) and `.opencode/skills/`** — both directories contain overlapping skill definitions. `syncOpencodeAssets()` copies from the package into `.opencode/skills/`, creating two divergent copies. | Medium | `skills/`, `.opencode/skills/` | Asset sync creates copies without version tracking |
| **R13** | **Plugin hook ordering is registration order, not priority-based** — `Plugin.trigger()` iterates `hooks[]` in load order. If multiple plugins register `tool.execute.after`, the execution order depends on when each was loaded, with no explicit priority. | Medium | `packages/opencode/src/plugin/index.ts:106-121` | Simple array iteration |

### Edge Cases

| Edge Case | Status | Risk |
| --- | --- | --- |
| Users sending walls of text | First-turn coherence injection can overflow character budget; `buildChecklist()` has `MAX_CHECKLIST_CHARS=1000` guard | Low |
| Concurrent sessions | **Broken** — module-scoped `mutationQueue[]` in `state-mutation-queue.ts` is shared across all sessions | Critical (R1) |
| Streaming partial outputs + tool calls interleaving | OpenCode's `SessionProcessor` handles this via part state machine (`pending→running→completed`). HiveMind hooks fire after each tool, so interleaving is safe. | Low |
| Plugin load order changes | No priority system. If HiveMind loads before or after another plugin that modifies `system.transform`, results are non-deterministic. | Medium (R13) |
| Backward compat for stored sessions | `brain.json` migration via `??=` is forward-only. No version downgrade path. Old `hierarchy.json` has no migration. | Medium |
| Retry loops causing duplicate writes | `flushMutations()` retains queue on error — subsequent retry will re-apply same mutations. If state was partially written, duplication occurs. | Medium |

---

## C) Refactor Blueprint

### Phase 1: Stop the Bleeding (Hardening)

1. **Session-scope the mutation queue** — Replace module-level `mutationQueue[]` with a `Map<sessionID, StateMutation[]>`. Partition `queueStateMutation()` and `flushMutations()` by session ID. This is the highest-priority fix.
    - File: `src/lib/state-mutation-queue.ts`
2. **Add `FileLock` to `hierarchy.json`** — Wrap `loadTree()`/`saveTree()` with the same `FileLock` pattern used by `StateManager`.
    - File: `src/lib/hierarchy-tree.ts`
3. **Add Zod validation to `BrainState` load** — Create a `BrainStateSchema` in `src/schemas/brain-state.ts` using Zod. Use `.safeParse()` in `StateManager.load()` and fall back to `createBrainState()` on validation failure.
    - Files: `src/schemas/brain-state.ts`, `src/lib/persistence.ts`
4. **Unify the EXEMPT_TOOLS list** — Remove all legacy tool names from `EXEMPT_TOOLS` and `WRITE_TOOLS` in `tool-gate.ts`. Use the 6 canonical HC5 names plus OpenCode built-in tool IDs only.
    - File: `src/hooks/tool-gate.ts`
5. **Fix governance instruction deduplication** — Move `HIVE_MASTER_GOVERNANCE_INSTRUCTION` injection to a single location (compaction hook should NOT inject it — it's already in the system prompt from session-lifecycle). Add a `Set`based dedup across all output arrays.
    - Files: `src/hooks/compaction.ts`, `src/hooks/session-lifecycle.ts`

### Phase 2: Schema Contracts (Contract-First)

1. **Introduce Zod schemas for all persisted types** — `BrainState`, `HierarchyTree`, `HiveMindConfig`, `SessionManifest`, `MemsState`, `AnchorsState`. Validate on every read, reject on every write.
    - Dir: `src/schemas/`
2. **Correlate session IDs** — Store `opencode_session_id` in `BrainState.session` when `input.sessionID` is provided in hooks. Use this for cross-referencing.
    - Files: `src/schemas/brain-state.ts`, `src/hooks/session-lifecycle.ts`, `src/hooks/event-handler.ts`
3. **Version `brain.json` schema explicitly** — Increment `BRAIN_STATE_VERSION` on every schema change. Write a migration registry (version → migration function) instead of inline `??=` patches.
    - Files: `src/schemas/brain-state.ts`, `src/lib/persistence.ts`

### Phase 3: Deterministic Context

1. **Centralize context assembly** — Create a `ContextAssembler` module that collects all injections (governance instruction, hivemind block, checklist, anchors, cognitive state) into a single pipeline with explicit priority ordering and a global budget.
    - New file: `src/lib/context-assembler.ts`
2. **Flush mutations on every tool boundary** — Hook `flushMutations()` into `tool.execute.after` instead of waiting for `hivemind_session` calls. This ensures state is persisted after every tool call.
    - Files: `src/hooks/soft-governance.ts`, `src/lib/state-mutation-queue.ts`
3. **Fix `deepMerge` array semantics** — For known array fields (`files_touched`, `keyword_flags`, `cycle_log`, `ratings`), concatenate instead of replace. Use a field-type registry.
    - File: `src/lib/state-mutation-queue.ts`

### Phase 4: Clean Boundaries

1. **Eliminate skills duplication** — Make `skills/` the canonical source. `.opencode/skills/` should be gitignored and regenerated from `syncOpencodeAssets()` with a content hash check.
    - Files: `src/cli/sync-assets.ts`, `.gitignore`
2. **Separate in-process event bus from OpenCode Bus** — Either remove the custom `eventBus` entirely (use only OpenCode's `Bus` events via the `event` hook) or document the clear boundary: `eventBus` = filesystem events only, `Bus` = session/message events.
    - Files: `src/lib/event-bus.ts`, `src/hooks/event-handler.ts`
3. **Establish SDK boundary enforcement** — Automate the "src/lib/ never imports @opencode-ai/plugin" rule with a lint/CI check.
    - File: `scripts/check-sdk-boundary.sh` (already exists — verify and enforce) [0-cite-20](https://www.notion.so/Scan-and-audit-from-team-A-vs-B-319926f31a4d8062be19c9f8299ee95c?pvs=21)

### Recommended Directory/Package Layout

```
hivemind-plugin/
├── src/
│   ├── schemas/          # Contract-first Zod schemas (BrainState, Config, Hierarchy, Events)
│   ├── lib/              # Pure logic, NO SDK imports
│   │   ├── persistence/  # StateManager, FileLock, atomic writes
│   │   ├── detection/    # Drift engine, signal compilation
│   │   ├── context/      # Context assembly, budget management
│   │   ├── planning/     # Session files, manifests, archives
│   │   └── memory/       # Mems, anchors, session coherence
│   ├── hooks/            # SDK hook factories (thin wrappers calling lib/)
│   ├── tools/            # SDK tool factories (thin wrappers calling lib/)
│   └── cli/              # CLI commands
├── skills/               # Canonical skill definitions (single source of truth)
├── commands/             # Slash command definitions
├── tests/
│   ├── unit/             # Pure lib/ tests
│   ├── integration/      # Hook + tool tests with mocked SDK
│   └── contract/         # Schema validation golden tests
└── .opencode/            # Generated (gitignored except for committed configs)
```

### Test Strategy

| Layer | What to test | Approach |
| --- | --- | --- |
| **Contract tests** | `BrainState`, `HierarchyTree`, `HiveMindConfig` schemas | Golden JSON fixtures parsed with Zod; assert round-trip fidelity |
| **Unit tests** | `detection.ts`, `brain-state.ts` helpers, `deepMerge`, `session-boundary.ts` | Pure function tests, no I/O |
| **Integration tests** | Hook factories with mocked `StateManager`, `loadConfig` | Verify correct `output.system[]` / `output.messages[]` mutations |
| **Golden-flow snapshots** |  |  |