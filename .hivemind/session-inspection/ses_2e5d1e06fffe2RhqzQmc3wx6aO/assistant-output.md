# Session Inspection Export

- ses_id: `ses_2e5d1e06fffe2RhqzQmc3wx6aO`
- prepared_at: `2026-03-23T10:15:28.790Z`

## Assistant Output

---

## HOOK INVENTORY REPORT

**Status:** `completed`

### Registered Hooks in `opencode-plugin.ts`

| # | Hook Name | Source Location | Compiled | Wired | Status | Purpose |
|---|-----------|-----------------|----------|-------|--------|---------|
| 1 | `event` | `src/hooks/event-handler.ts` | ✅ `dist/hooks/event-handler.js` | ✅ | **ALIVE** | Bridges runtime events into trajectory ledger |
| 2 | `chat.message` | Inline in `src/plugin/opencode-plugin.ts` | ✅ `dist/plugin/opencode-plugin.js` | ✅ | **ALIVE** | Resets turn snapshot, shows degraded mode warning |
| 3 | `permission.ask` | Inline + `src/hooks/runtime-loader/tool-governance.ts` | ✅ | ✅ | **ALIVE** | Auto-allows HiveMind managed tools, surfaces mutation toasts |
| 4 | `tool.execute.before` | Inline + `src/hooks/runtime-loader/tool-governance.ts` | ✅ `dist/hooks/runtime-loader/tool-governance.js` | ✅ | **ALIVE** | Records managed-tool execution intent |
| 5 | `tool.execute.after` | Inline + `src/hooks/runtime-loader/tool-governance.ts` | ✅ | ✅ | **ALIVE** | Post-tool state capture |
| 6 | `shell.env` | Inline in `src/plugin/opencode-plugin.ts` | ✅ | ✅ | **ALIVE** | Injects HiveMind env vars (HIVEMIND_RUNTIME_ATTACHED, etc.) |
| 7 | `command.execute.before` | Inline in `src/plugin/opencode-plugin.ts` | ✅ | ✅ | **ALIVE** | Pre-command context injection via synthetic parts |
| 8 | `experimental.text.complete` | Inline + `src/sdk-supervisor/index.ts` | ✅ | ✅ | **ALIVE** | Session inspection export + diagnostic logging |
| 9 | `experimental.chat.messages.transform` | `src/plugin/messages-transform-adapter.ts` | ✅ `dist/plugin/messages-transform-adapter.js` | ✅ | **ALIVE** | Injects HiveMind context, turn hierarchy, skill focus before user messages |
| 10 | `experimental.session.compacting` | `src/plugin/compaction-adapter.ts` | ✅ `dist/plugin/compaction-adapter.js` | ✅ | **ALIVE** | Injects context during session compaction |

---

### Context Injection Analysis

**Where is context injected before user messages?**

| Hook | Injection Point | Content Injected |
|------|-----------------|------------------|
| `experimental.chat.messages.transform` | Last user message parts (prepended) | Turn hierarchy, HiveMind context packet, skill focus block |
| `command.execute.before` | Command input parts (prepended) | Command context (trajectory, workflow, task_ids, tool_precedence) |

**Content Injection Order (messages.transform):**
1. `turnHierarchyPacket` - turn depth, type, trajectory path
2. `packet` - HiveMind context (session state, purpose, pressure contract)
3. `skillFocusPacket` (conditional) - resolved skills based on agent/purpose
4. User's original message parts
5. `routeReminder` (conditional) - route hint for non-dispatched turns

---

### DEAD/Orphan References in AGENTS.md

| Reference | Location | Status | Evidence |
|-----------|----------|--------|----------|
| `context-injection/` folder | `src/hooks/AGENTS.md` line 12 | **DEAD** | Folder does not exist. Functionality moved to `messages-transform-adapter.ts` |
| `prompt-transformation/` folder | `src/hooks/AGENTS.md` line 13 | **DEAD** | Folder does not exist. Functionality moved to `messages-transform-adapter.ts` |
| `runtime-bridge/` folder | `src/hooks/AGENTS.md` line 14 | **DEAD** | Folder does not exist. Functionality inline in plugin |
| `governance-layer.ts` file | `src/hooks/AGENTS.md` line 42 | **DEAD** | File `src/hooks/context-injection/governance-layer.ts` does not exist |
| `system.transform` hook | `src/plugin/AGENTS.md` line 48 | **RETIRED** | Phase 11 removed duplicate system-transform. Listed as "✅ Retired" |

---

### Hook-to-Module Mapping

```
opencode-plugin.ts (assembly)│
├── event → createEventHandler()
│   └── src/hooks/event-handler.ts
│       └── Imports: trajectory, contract-store, recovery
│
├── chat.message → inline
│   └── src/plugin/runtime-snapshot.ts (TurnSnapshotLoader)
│   └── src/hooks/soft-governance.ts (showGovernanceToast)
│
├── permission.ask → inline
│   └── src/hooks/runtime-loader/tool-governance.ts (isHivemindManagedTool)
│
├── tool.execute.before → inline
│   └── src/hooks/runtime-loader/tool-governance.ts (recordToolEvent)
│
├── tool.execute.after → inline│   └── src/hooks/runtime-loader/tool-governance.ts (recordToolEvent)
│
├── shell.env → inline
│   └── src/plugin/runtime-snapshot.ts (TurnSnapshotLoader)
│
├── command.execute.before → inline
│   └── src/commands/slash-command/index.ts (findSlashCommandBundle)
│   └── src/plugin/context-renderer.ts (renderToolPrecedence)
│   └── src/plugin/synthetic-parts.ts (createSyntheticPart)
│
├── experimental.text.complete → inline
│   └── src/sdk-supervisor/index.ts (upsertSessionInspectionExport, writeDiagnosticLog)
│
├── experimental.chat.messages.transform → createMessagesTransformHandler()
│   └── src/plugin/messages-transform-adapter.ts
│       └── src/hooks/start-work/start-work-router.ts (resolveStartWork)
│       └── src/features/runtime-entry/nl-first-dispatch.ts
│       └── src/plugin/context-renderer.ts
│
└── experimental.session.compacting → createCompactionHandler()└── src/plugin/compaction-adapter.ts
    └── src/plugin/context-renderer.ts
    └── src/plugin/input-helpers.ts
```

---

### Supporting Modules (Not Hooks, But Referenced)

| Module | Purpose | Status |
|--------|---------|--------|
| `src/hooks/sdk-context.ts` | SDK client/shell reference caching | **ALIVE** |
| `src/hooks/soft-governance.ts` | Toast notifications via SDK client | **ALIVE** |
| `src/hooks/start-work/` | Session entry orchestrator (called by messages.transform) | **ALIVE** |
| `src/hooks/auto-slash-command/` | Auto-detect and route slash commands | **ALIVE** (exported but not wired directly in plugin) |
| `src/hooks/workflow-integration/` | Workflow continuity helper | **ALIVE** (called by event handler) |
| `src/features/agent-work-contract/hooks/` | Contract event/preservation helpers | **ALIVE** (called by event handler and compaction adapter) |

---

### Artifacts

**File:** `src/hooks/AGENTS.md` - Contains 4 DEAD references (context-injection/, prompt-transformation/, runtime-bridge/, governance-layer.ts)

**Recommendation:** Update `src/hooks/AGENTS.md` to reflect actual folder structure:
- Remove `context-injection/`, `prompt-transformation/`, `runtime-bridge/` from the sub-module table
- Add note that context injection now happens via `messages.transform` hook in `src/plugin/messages-transform-adapter.ts`