Here is the surgical refactor, traced from the actual code.

## The Noise Anatomy: What Exactly Hits the Agent Per Turn

Every user message triggers **4 hooks** that independently call `loadRuntimeBindingsSnapshot(directory)` (which reads from disk, loads trajectory ledger, inspects workflow authority each time) and inject **6 competing XML blocks**:

```mermaid
graph TD
    subgraph "Per-turn noise (current state)"
        H1["chat.message (L58)"] -->|"disk read #1"| I1["<opencode-runtime-knowledge>"]
        H1 --> I2["<hivemind-session-context>"]

        H2["system.transform (L157)"] -->|"disk read #2"| I3["<opencode-runtime-knowledge> DUPLICATE"]
        H2 --> I4["<hivemind-kernel-packet> (27 fields)"]

        H3["messages.transform (L186)"] -->|"disk read #3"| I5["<opencode-runtime-knowledge> DUPLICATE"]
        H3 --> I6["<hivemind-lineage-refresh> (18 fields)"]
        H3 --> I7["<hivemind-route-bridge> (rules)"]

        H4["event handler"] -->|"disk read #4"| I8["trajectory event write"]
    end
``` [3-cite-0](#3-cite-0) [3-cite-1](#3-cite-1) [3-cite-2](#3-cite-2) 

The agent sees **~70 key=value lines** of context per turn, with `trajectory=`, `workflow=`, `lineage=`, `governance_mode=`, `language=` each appearing **3 times** across the blocks. Plus 4 hardcoded rule strings in `<hivemind-route-bridge>` that compete with the system transform's governance signals. [3-cite-3](#3-cite-3) [3-cite-4](#3-cite-4) [3-cite-5](#3-cite-5) 

## The Dead Weight: Code That Runs But Nobody Consumes

`createPluginRuntimePlan()` calls **12 functions** per turn but only **3 outputs** are actually used by the plugin: [3-cite-6](#3-cite-6) 

| Function called | Output used by plugin? |
|---|---|
| `resolveStartWork()` | Only via `messageTransform` and `routeReminder` |
| `buildStartWorkEntryKernel()` | Only for `routeReminder` |
| `buildRuntimeAttachmentEntryKernel()` | **NO** — `entryKernel` is computed but never read by any hook |
| `createAutoSlashCommandPlan()` | Only for `commandPreview` |
| `buildPluginContext()` | **NO** — computed, returned, never consumed |
| `renderOpencodeKnowledgePacket()` | Yes, but duplicates what `chat.message` already injected |
| `createSystemTransform()` | **NO** — `promptPacket.systemPacket` is returned but `system.transform` hook already injects it independently |
| `createMessagesTransform()` | Yes — this is the actual `messageTransform` |
| `previewSlashCommandBundle()` | **NO** — `commandPreview` is returned but never consumed |
| `createRuntimeInvocation()` | **NO** — computed, returned, never consumed |
| `createTurnOutputProjection()` | **NO** — computed, returned, never consumed |
| `createRuntimeSurfaceRegistry()` | **NO** — computed, returned, never consumed |
| `createCoreHooks()` | **NO** — computed, returned, never consumed |
| `buildContextInjectionPlan()` | **NO** — in metadata, never consumed |

That's **10 out of 14** computations wasted per turn. [3-cite-7](#3-cite-7) 

## The Indirection Tax

```
opencode-plugin.ts
  → src/plugin/system-transform.ts (1-line wrapper)
    → src/hooks/prompt-transformation/transform-runtime-prompt.ts (1-line wrapper)
      → src/context/prompt-packet/prompt-compiler.ts (actual logic)
        → src/context/prompt-packet/prompt-packet-normalize.ts
        → src/context/prompt-packet/prompt-packet-renderers.ts
```

Five files to render one XML block. And the same chain exists for `messages-transform.ts`. [3-cite-8](#3-cite-8) [3-cite-9](#3-cite-9) [3-cite-10](#3-cite-10) 

The `runtime-bridge/` layer (7 files) wraps hooks in `RuntimeHookBridgeDefinition` with instruction loaders — but the plugin **never calls any bridge**. They're only consumed by `surface-registry.ts` to build a `RuntimeSurfaceEntry[]` that is returned from `createPluginRuntimePlan()` and **never consumed**. [3-cite-11](#3-cite-11) [3-cite-12](#3-cite-12) 

Re-export chains in `src/hooks/start-work/`: [3-cite-13](#3-cite-13) 

Re-export chains in `src/shared/`: [3-cite-14](#3-cite-14) [3-cite-15](#3-cite-15) 

---

## The Surgical Refactor: One Phase, Three Cuts

### Cut 1: Collapse to ONE injection point, ONE state load

**Delete** the `chat.message` context injection (lines 71-99) and the `experimental.chat.system.transform` hook entirely. Keep only `experimental.chat.messages.transform` as the single injection point, and `experimental.session.compacting` for compaction survival.

**Cache** `loadRuntimeBindingsSnapshot()` per turn — it currently reads from disk, loads trajectory ledger, and inspects workflow authority **4 times per turn**. [3-cite-16](#3-cite-16) 

**Merge** the 6 XML blocks into ONE:

```xml
<hivemind context_version="v1">
  session_id=...
  lineage=...
  trajectory=...
  workflow=...
  task_ids=...
  entry_state=ready|uninitialized|repair-required
  purpose=research|planning|implementation|...
  risk=none|gated|blocked
  route_command=hm-plan (if any)
  governance_mode=assisted
  language=en
</hivemind>
```

That's ~12 fields instead of ~70. One block instead of 6. One disk read instead of 4.

### Cut 2: Gut `createPluginRuntimePlan()` — keep only what's consumed

Replace the 14-function orchestration with direct calls to the 3 things actually used:

```typescript
// BEFORE: 14 functions, 10 unused outputs
const runtimePlan = await createPluginRuntimePlan(hugeInput)
const messagePacket = runtimePlan.data?.messageTransform
const routeReminder = buildRouteReminder(runtimePlan.data)
const knowledgePacket = runtimePlan.data?.opencodeKnowledgePacket

// AFTER: 3 direct calls
const startWork = resolveStartWork(startWorkInput)
const contextBlock = renderUnifiedContext(snapshot, startWork)  // new: single renderer
const routeHint = startWork.requiredCommandId                   // just the command ID
```

**Delete these files entirely:**
- `src/plugin/runtime-plan.ts` — the 14-function orchestrator
- `src/plugin/surface-registry.ts` — builds unused `RuntimeSurfaceEntry[]`
- `src/plugin/create-core-hooks.ts` — builds unused `HookDescriptor[]`
- `src/plugin/plugin-types.ts` — types for the deleted orchestrator (keep only `PluginRuntimeInput` if needed)
- `src/shared/turn-output.ts` — `TurnExportProjectionV1` is never consumed by any hook
- `src/shared/runtime-invocation.ts` — re-export of unused invocation
- `src/shared/lifecycle-spine.ts` — lifecycle types only consumed by deleted code [3-cite-17](#3-cite-17) [3-cite-18](#3-cite-18) [3-cite-19](#3-cite-19) 

**Delete these directories entirely:**
- `src/hooks/runtime-bridge/` — 7 files, zero consumers from the plugin
- `src/hooks/context-injection/` — `buildContextInjectionPlan()` is a 3-line function only consumed by deleted `runtime-plan.ts`
- `src/hooks/prompt-transformation/` — collapse `createSyntheticPart`, `findLastUserMessage`, `getMessageText` into `src/plugin/` directly; delete the `transformRuntimePrompt` wrapper [3-cite-20](#3-cite-20) [3-cite-21](#3-cite-21) 

**Delete these re-export shims:**
- `src/hooks/start-work/purpose-classifier.ts` → import from `src/features/session-entry/` directly
- `src/hooks/start-work/lineage-router.ts` → same
- `src/hooks/start-work/readiness-gates.ts` → same
- `src/hooks/start-work/session-state.ts` → same
- `src/hooks/start-work/start-work-types.ts` → same

### Cut 3: Flatten the domain structure

**Current:** 18 top-level `src/` domains. **Target:** 7.

| Current domain | Verdict | Reason |
|---|---|---|
| `src/plugin/` | **KEEP** (simplified) | Plugin assembly — the only real entry point |
| `src/tools/` | **KEEP** | 6 SDK tools — clean, working |
| `src/core/` | **KEEP** | `trajectory/` and `workflow-management/` — real state management |
| `src/features/` | **KEEP** | `session-entry/`, `runtime-entry/`, `doc-intelligence/`, `handoff/`, `trajectory/`, `workflow/` — actual business logic |
| `src/commands/` | **KEEP** | Slash command bundles — registered runtime surfaces |
| `src/control-plane/` | **KEEP** | `hm-init`, `hm-doctor`, `hm-harness` — real CLI operations |
| `src/shared/` | **KEEP** (pruned) | Paths, logging, tool-response, bootstrap-profile, entry-kernel-state — real utilities |
| `src/cli/` | **KEEP** | CLI entry points |
| `src/hooks/` | **DELETE** (flatten) | Move `sdk-context.ts`, `soft-governance.ts`, `event-handler.ts` into `src/plugin/`. Delete everything else. |
| `src/context/` | **DELETE** (inline) | `prompt-packet/` renderers move into a single `src/plugin/context-renderer.ts` |
| `src/governance/` | **DELETE** | `planning-projection.ts` writes to `.hivemind/` — non-authoritative projection |
| `src/intelligence/` | **EVALUATE** | `doc/` may be needed by `hivemind_doc` tool |
| `src/delegation/` | **KEEP** (if tools use it) | `DelegationPacket` and `delegation-store` — used by handoff tool |
| `src/recovery/` | **KEEP** | Recovery checkpoint creation — used by event handler |
| `src/schema-kernel/` | **DELETE** | Type definitions only consumed by deleted code and tests |
| `src/sdk-supervisor/` | **DELETE** | `instance-registry`, `health`, `runtime-status` — only consumed by deleted `surface-registry` |
| `src/plugin-handlers/` | **EVALUATE** | `category-routing`, `command-resolution`, `tool-resolution` — check if tools use them |
| `src/tui/` | **KEEP** | Dashboard UI — separate concern | [3-cite-22](#3-cite-22) [3-cite-23](#3-cite-23) [3-cite-24](#3-cite-24) 

---

## The Target `opencode-plugin.ts`

After the refactor, the plugin assembly becomes:

```typescript
// ~80 lines instead of ~300
export const HiveMindPlugin: Plugin = async (input) => {
  const directory = input.directory
  initSdkContext(input)
  let cachedSnapshot: RuntimeBindingsSnapshot | null = null

  async function getSnapshot() {
    if (!cachedSnapshot) cachedSnapshot = await loadRuntimeBindingsSnapshot(directory)
    return cachedSnapshot
  }

  return {
    event: createEventHandler(directory),
    tool: { /* 6 tools — unchanged */ },

    'chat.message': async (messageInput, _output) => {
      cachedSnapshot = null  // invalidate cache for new turn
      const snapshot = await getSnapshot()
      if (snapshot.hasHivemind && !snapshot.hivemindHealthy) {
        await showGovernanceToast('degraded-mode', '...', 'warning')
      }
      // NO context injection here — system.transform or messages.transform handles it
    },

    'permission.ask': async (permissionInput, output) => { /* unchanged */ },
    'tool.execute.before': async (toolInput) => { /* unchanged */ },
    'tool.execute.after': async (toolInput) => { /* unchanged */ },
    'shell.env': async (_input, output) => { /* unchanged, uses getSnapshot() */ },
    'command.execute.before': async (commandInput, output) => { /* unchanged */ },

    'experimental.chat.system.transform': async (systemInput, output) => {
      const snapshot = await getSnapshot()
      const startWork = resolveStartWork(buildStartWorkInput(snapshot, ''))
      output.system.push(renderUnifiedContext(snapshot, startWork))
      // ONE block. ONE push. Done.
    },

    'experimental.chat.messages.transform': async (_input, output) => {
      // Only inject route hint if a command is required
      const snapshot = await getSnapshot()
      const lastMsg = findLastUserMessage(output.messages)
      if (!lastMsg) return
      const startWork = resolveStartWork(buildStartWorkInput(snapshot, getMessageText(lastMsg)))
      if (startWork.requiredCommandId) {
        lastMsg.parts = [
          createSyntheticPart(sessionID, messageID,
            `<hivemind-route command="${startWork.requiredCommandId}" risk="${startWork.riskLevel}" />`
          ),
          ...(lastMsg.parts ?? [])
        ]
      }
    },

    'experimental.session.compacting': async (compactionInput, output) => {
      const snapshot = await getSnapshot()
      output.context.push(renderUnifiedContext(snapshot, null))
      // ONE block for compaction survival
    },
  }
}
```

---

## File Count Impact

| Category | Before | After |
|---|---|---|
| Files deleted | — | ~35 files |
| Directories deleted | — | 6 (`hooks/runtime-bridge/`, `hooks/context-injection/`, `hooks/prompt-transformation/`, `schema-kernel/`, `sdk-supervisor/`, `governance/`) |
| XML blocks per turn | 6 | 1 (+ optional route hint) |
| Disk reads per turn | 4 | 1 |
| `key=value` lines per turn | ~70 | ~12 |
| Functions in per-turn orchestration | 14 | 2 (`resolveStartWork` + `renderUnifiedContext`) |

---

## What Stays Untouched

- **6 SDK tools** — `hivemind_doc`, `hivemind_runtime_status`, `hivemind_runtime_command`, `hivemind_task`, `hivemind_trajectory`, `hivemind_handoff` [3-cite-25](#3-cite-25) 
- **`src/core/`** — trajectory ledger, workflow management — real state
- **`src/features/session-entry/`** — `resolveStartWork()`, `classifyPurpose()`, `resolveLineage()` — the actual entry intelligence logic (it's clean, stateless, and useful) [3-cite-26](#3-cite-26) 
- **`src/features/runtime-entry/`** — `loadRuntimeBindingsSnapshot()`, settings management — real disk I/O
- **`src/commands/slash-command/`** — command bundle registration
- **`src/control-plane/`** — `hm-init`, `hm-doctor`, `hm-harness`
- **`skills/`** — portable markdown skills
- **`showGovernanceToast()`** — the only push-based signal that's correctly throttled and non-polluting [3-cite-27](#3-cite-27)