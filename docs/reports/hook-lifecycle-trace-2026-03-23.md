# Hook Lifecycle Trace Report

**Generated:** 2026-03-23  
**Scope:** Method tracing hooks that inject before fresh user messages  
**Source:** `src/hooks/`, `src/plugin/`, `dist/`

---

## Executive Summary

| Category | Count |
|----------|-------|
| **Total Hooks Registered** | 10 |
| **ALIVE (Compiled + Wired)** | 10 |
| **DEAD (Orphan/Stale)** | 6 |
| **SDK-Dependent** | 3 |
| **Plugin-Only** | 7 |

---

## 1. Hook Inventory

### 1.1 ALIVE Hooks (10)

| # | Hook Name | Injection Point | SDK Dep | Purpose |
|---|-----------|-----------------|---------|---------|
| 1 | `experimental.chat.messages.transform` | Last user message parts (prepended) | Hybrid (`Part` type) | Injects HiveMind context, turn hierarchy, skill focus before user messages |
| 2 | `experimental.session.compacting` | Compaction prompt | Plugin-only | Injects workflow context during session compaction |
| 3 | `chat.message` | Turn snapshot reset | Plugin-only | Resets turn snapshot, shows degraded mode warning |
| 4 | `event` | Trajectory ledger | Hybrid (`Event` type) | Bridges runtime events into trajectory |
| 5 | `tool.execute.before` | Tool intent recording | Plugin-only | Records managed-tool execution intent |
| 6 | `tool.execute.after` | Post-tool state capture | Plugin-only | Post-tool state observation |
| 7 | `shell.env` | Environment variables | Plugin-only | Injects HIVEMIND_* env vars |
| 8 | `command.execute.before` | Command input parts (prepended) | Plugin-only | Injects command context via synthetic parts |
| 9 | `permission.ask` | Permission interception | Plugin-only | Auto-allows HiveMind managed tools |
| 10 | `experimental.text.complete` | Session inspection export | Plugin-only | Exports session text for inspection |

### 1.2 DEAD References (6)

| # | Type | Reference | Location | Status |
|---|------|-----------|----------|--------|
| 1 | Folder | `src/hooks/context-injection/` | AGENTS.md line 12 | **DEAD** - Does not exist |
| 2 | Folder | `src/hooks/prompt-transformation/` | AGENTS.md line 13 | **DEAD** - Does not exist |
| 3 | Folder | `src/hooks/runtime-bridge/` | AGENTS.md line 14 | **DEAD** - Does not exist |
| 4 | File | `src/hooks/context-injection/governance-layer.ts` | AGENTS.md line 42 | **DEAD** - Does not exist |
| 5 | Source | `src/plugin/messages-transform.ts` | Compiled but not wired | **DEAD** - Orphan export |
| 6 | Source | `src/plugin/system-transform.ts` | Compiled but not wired | **DEAD** - Orphan export |

---

## 2. Human User Message Detection

### 2.1 Variant Filter Logic

**Location:** `src/plugin/messages-transform-adapter.ts` lines 54-58

```typescript
// Only inject on genuine user turns and subagent handoffs — skip tool results and thinking turns
const lastMsg = lastUserMessage as { info?: { variant?: string } }
if (!lastMsg.info?.variant || (lastMsg.info.variant !== 'new' && lastMsg.info.variant !== 'continue')) {
  return// Skip injection
}
```

### 2.2 Variant Classification

| Variant | Source | Injects Context | Notes |
|---------|--------|-----------------|-------|
| `'new'` | Human user starting fresh conversation | **YES** | Primary human user entry |
| `'continue'` | Human user continuing conversation | **YES** | Human user follow-up |
| (no variant) | Tool results, thinking turns | *NO* | Skipped - not human user |
| `'tool_result'` | Tool execution results | *NO* | Skipped - orchestrator output |
| `'thinking'` | Agent internal reasoning | *NO* | Skipped - internal |

### 2.3 Injection Pipeline

```
OpenCode SDK
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│ experimental.chat.messages.transform                            │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Step 1: findLastUserMessage(messages)                       │ │
│ │         └─► Find the last message with role='user'        │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Step 2: Variant Filter                                      │ │
│ │         └─► variant === 'new' || variant === 'continue'   │ │
│ │         └─► HUMAN USER messages only                       │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Step 3: resolveStartWork(input)                             │ │
│ │         ├─► assessTrajectoryEntrySync()                    │ │
│ │         ├─► classifyPurpose(userMessage)                   │ │
│ │         └─► resolveReadinessGates()                        │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Step 4: Build Injection Packets                             │ │
│ │         ├─► renderTurnHierarchy()     → <hivemind-turn-hierarchy>│
│ │         ├─► renderHivemindContext()   → <hivemind>              │
│ │         └─► renderSkillFocusBlock()   → <available_skills>│ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Step 5: Prepend to lastUserMessage.parts                    │ │
│ │         [turnHierarchy, context, skillFocus, ...userParts]  │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. SDK vs Plugin Dependency Classification

### 3.1 Dual-Plane Architecture

The codebase follows a strict dual-plane architecture:

| Plane | Package | Scope | API |
|--------|---------|-------|-----|
| **Control Plane** | `@opencode-ai/sdk` | Outside agent loop | `createOpencode`, `createOpencodeClient`, `OpencodeClient` |
| **Execution Plane** | `@opencode-ai/plugin` | Inside agent loop | `Plugin`, `tool()`, hook APIs, `context.*` |

### 3.2 Hook Classification by Dependency

#### SDK-Dependent (Hybrid - Uses SDK Types)

| Hook | SDK Import | Plugin Import | Notes |
|------|------------|---------------|-------|
| `event` | `Event` type | - | Uses SDK `Event` type for hook signature |
| `experimental.chat.messages.transform` | `Part` type | - | Uses SDK `Part` type for message part structure |

**Note:** These hooks use **SDK types** (`Event`, `Part`) which are shared between packages. They don't import SDK client-creation functions, so they execute in the Plugin context.

#### Plugin-Only (No SDK Dependencies)

| Hook | SDK Import | Plugin Import | Notes |
|------|------------|---------------|-------|
| `experimental.session.compacting` | - | - | Pure business logic |
| `chat.message` | - | - | Uses cached client via sdk-context |
| `tool.execute.before` | - | - | Pure business logic |
| `tool.execute.after` | - | - | Pure business logic |
| `shell.env` | - | - | Pure business logic |
| `command.execute.before` | - | - | Pure business logic |
| `permission.ask` | - | - | Uses cached client via sdk-context |
| `experimental.text.complete` | - | - | Pure business logic |

### 3.3 Client API Access Pattern

Hooks access `client.*` APIs through the cached `sdk-context.ts`:

```typescript
// src/hooks/sdk-context.ts
let cachedClient: PluginInput['client'] | null = null

export function initSdkContext(input: PluginInput) {
  cachedClient = input.client// From Plugin initialization
}

export function getClient(): PluginInput['client'] | null {
  return cachedClient
}
```

**Hooks using client APIs:**
- `chat.message` → `client.tui.showToast()` via `showGovernanceToast()`
- `permission.ask` → Uses cached client for permission handling

---

## 4. Source-to-Dist Pipeline Mapping

### 4.1 Primary Injection Hook Pipeline

```
src/plugin/opencode-plugin.ts
│├─ import { createMessagesTransformHandler } from './messages-transform-adapter.js'│├─ const messagesTransform = createMessagesTransformHandler({ ... })
│└─ 'experimental.chat.messages.transform': messagesTransform
          │
          ▼
dist/plugin/opencode-plugin.js (line 189)
          │
          ▼
src/plugin/messages-transform-adapter.ts
│├─ import { findLastUserMessage, createSyntheticPart } from './synthetic-parts.js'
│├─ import { resolveStartWork } from '../hooks/start-work/start-work-router.js'
│└─ export function createMessagesTransformHandler(deps) { ... }
          │
          ▼
dist/plugin/messages-transform-adapter.js
          │
          ├─► src/plugin/synthetic-parts.ts → dist/plugin/synthetic-parts.js
          │    └─ createSyntheticPart(sessionID, messageID, text)
          │
          ├─► src/plugin/context-renderer.ts → dist/plugin/context-renderer.js
          │    ├─ renderTurnHierarchy()
          │    └─ renderHivemindContext()
          │
          ├─► src/plugin/skill-focus-renderer.ts → dist/plugin/skill-focus-renderer.js│    └─ renderSkillFocusBlock()
          │
          └─► src/hooks/start-work/start-work-router.ts → dist/hooks/start-work/start-work-router.js
               └─ resolveStartWork()
```

### 4.2 Complete Hook Registration Map

```
HiveMindPlugin (opencode-plugin.ts)
│
├── Hook: event││   └─► src/hooks/event-handler.ts
│        ├─ import { Event } from '@opencode-ai/sdk'
│        ├─ import { loadTrajectoryLedger } from '../core/trajectory/index.js'
│        └─ import { recordTrajectoryEvent } from '../core/trajectory/index.js'
│
├── Hook: chat.message
│   └─► inline implementation│        ├─ turnSnapshot.resetTurnSnapshot()
│        └─ showGovernanceToast() from '../hooks/soft-governance.js'
│
├── Hook: permission.ask
│   └─► inline implementation
│        ├─ isHivemindManagedTool() from '../hooks/runtime-loader/tool-governance.js'
│        └─ showGovernanceToast() from '../hooks/soft-governance.js'
│
├── Hook: tool.execute.before
│   └─► inline implementation
│        └─ recordToolEvent() from '../hooks/runtime-loader/tool-governance.js'
│
├── Hook: tool.execute.after
│   └─► inline implementation
│        └─ recordToolEvent() from '../hooks/runtime-loader/tool-governance.js'
│
├── Hook: shell.env
│   └─► inline implementation
│        └─ TurnSnapshotLoader from './runtime-snapshot.js'
│
├── Hook: command.execute.before
│   └─► inline implementation
│        ├─ findSlashCommandBundle() from '../commands/slash-command/index.js'
│        ├─ renderToolPrecedence() from './context-renderer.js'
│        └─ createSyntheticPart() from './synthetic-parts.js'
│
├── Hook: experimental.text.complete
│   └─► inline implementation│        ├─ upsertSessionInspectionExport() from '../sdk-supervisor/index.js'
│        └─ writeDiagnosticLog() from '../sdk-supervisor/index.js'
│
├── Hook: experimental.chat.messages.transform
│   └─► createMessagesTransformHandler() from './messages-transform-adapter.js'
│        ├─ resolveStartWork() from '../hooks/start-work/start-work-router.js'
│        ├─ maybeExecuteNlFirstRuntimeDispatch() from '../features/runtime-entry/nl-first-dispatch.js'
│        └─ renderHivemindContext(), renderTurnHierarchy() from './context-renderer.js'
│
└── Hook: experimental.session.compacting
    └─► createCompactionHandler() from './compaction-adapter.js'
         └─ renderCompactionPreservationContext() from './context-renderer.js'
```

---

## 5. Dead Code Analysis

### 5.1 Dead Folder References in AGENTS.md

**File:** `src/hooks/AGENTS.md`

```markdown
| Sub-Module | Hook Events | Purpose |
|------------|-------------|---------|
| `start-work/` | `chat.message` (implied) | Purpose classification...| context-injection/` | `system.transform` | System prompt enrichment...    ← DEAD
| `prompt-transformation/` | `messages.transform` | Synthetic part injection...   ← DEAD
| `runtime-bridge/` | `command.execute.before` | Load command assets...        ← DEAD
```

**Evidence:** These folders do not exist in `src/hooks/`. The functionality has been consolidated:

| Dead Reference | Replaced By |
|----------------|--------------|
| `context-injection/` | `src/plugin/messages-transform-adapter.ts` |
| `prompt-transformation/` | `src/plugin/synthetic-parts.ts` |
| `runtime-bridge/` | Inline in `opencode-plugin.ts` |
| `governance-layer.ts` | `src/plugin/context-renderer.ts` |

### 5.2 Dead Source Files (Compiled but Not Wired)

**Files:**
- `src/plugin/messages-transform.ts` → `dist/plugin/messages-transform.js` (NOT IMPORTED)
- `src/plugin/system-transform.ts` → `dist/plugin/system-transform.js` (NOT IMPORTED)

**Evidence:** These files export `createMessagesTransform()` and `createSystemTransform()` but are never imported in `opencode-plugin.ts`. The actual implementation uses `createMessagesTransformHandler()` from `messages-transform-adapter.ts`.

### 5.3 Dead Tool Grant IDs

**File:** `src/commands/slash-command/command-bundles.ts`

```typescript
toolGrantIds: ['prompt-transformation', 'context-injection'],  // line 14
toolGrantIds: ['prompt-transformation'],                       // line 68
toolGrantIds: ['prompt-transformation', 'workflow-integration'], // lines 85, 102
toolGrantIds: ['context-injection', 'workflow-integration'],   // line 119
```

**Issue:** `prompt-transformation` and `context-injection` are legacy tool grant IDs that no longer map to existing hook folders.

---

## 6. Recommendations

### 6.1 Documentation Updates

1. **Update `src/hooks/AGENTS.md`:**
   - Remove `context-injection/`, `prompt-transformation/`, `runtime-bridge/` from the sub-module table
   - Update to reflect that context injection now happens via `messages.transform` hook in `src/plugin/messages-transform-adapter.ts`
   - Correct the file weight table to remove `governance-layer.ts`

### 6.2 Code Cleanup

2. **Remove dead source files:**
   - `src/plugin/messages-transform.ts`
   - `src/plugin/system-transform.ts`

3. **Update `command-bundles.ts`:**
   - Replace legacy `toolGrantIds` with correct identifiers or remove if unused

### 6.3 ARCHITECTURE.md Updates

4. **Update architecture documentation:**
   - Document that `messages-transform-adapter.ts` is the single source of truth for message context injection
   - Document the variant filter logic (`new`, `continue`) for human user detection
   - Add SDK vs Plugin dependency boundary documentation

---

## 7. Appendix

### 7.1 File Locations

| Category | Source | Dist |
|----------|--------|------|
| Plugin Entry | `src/plugin/opencode-plugin.ts` | `dist/plugin/opencode-plugin.js` |
| Message Transform | `src/plugin/messages-transform-adapter.ts` | `dist/plugin/messages-transform-adapter.js` |
| Synthetic Parts | `src/plugin/synthetic-parts.ts` | `dist/plugin/synthetic-parts.js` |
| Context Renderer | `src/plugin/context-renderer*.ts` | `dist/plugin/context-renderer*.js` |
| Event Handler | `src/hooks/event-handler.ts` | `dist/hooks/event-handler.js` |
| Start-Work Router | `src/hooks/start-work/start-work-router.ts` | `dist/hooks/start-work/start-work-router.js` |
| Tool Governance | `src/hooks/runtime-loader/tool-governance.ts` | `dist/hooks/runtime-loader/tool-governance.js` |

### 7.2 Hook Variant Filtering Flow

```
User Message Arrives
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│ findLastUserMessage(messages)                                   │
│ └─► Find last message with role='user'                          │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│ Variant Check                                                    │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ if (variant === 'new' || variant === 'continue')           │ │
│ │   → HUMAN USER → PROCEED with injection                     │ │
│ │ else│ │
│ │   → SKIP injection, return early│ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼ (Human User Only)
┌─────────────────────────────────────────────────────────────────┐
│ resolveStartWork(input)                                          │
│ ├─► classifyPurpose(userMessage)                                │
│ ├─► assessTrajectoryEntrySync()                                 │
│ └─► resolveReadinessGates()                                    │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│ Build & Inject Packets                                           │
│ ├─► turnHierarchyPacket→ <hivemind-turn-hierarchy>       │
│ ├─► hivemindContextPacket  → <hivemind>                          │
│ ├─► skillFocusPacket (conditional) → <available_skills>          │
│ └─► routeReminder (conditional) → <hivemind-route-hint>         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Verification

### 8.1 Compilation Status

All ALIVE hooks show compiled output in `dist/`:

```bash
$ ls dist/hooks/ dist/plugin/
dist/hooks/:
auto-slash-command/  event-handler.js  runtime-loader/  soft-governance.js
event-handler.d.ts    index.js          sdk-context.d.ts  start-work/
event-handler.d.ts.map  index.d.ts     sdk-context.js    workflow-integration/
event-handler.js.map     index.d.ts.map sdk-context.js.mapsdk-context.d.ts.map

dist/plugin/:
compaction-adapter.js           context-renderer.renderers.js    route-hint.js
context-renderer.builder.js     context-renderer.types.js       runtime-prompt.js
context-renderer.compaction-renderers.js  evidence-reporter.js   runtime-snapshot.js
context-renderer.constants.js   input-helpers.js                skill-exposure-map.js
context-renderer.js             messages-transform-adapter.js    skill-focus-renderer.js
context-renderer.renderers.d.ts messages-transform.js           synthetic-parts.js
opencode-plugin.js              route-hint.d.ts                 system-transform.js
```

### 8.2 Registration Verification

All 10 hooks registered in `opencode-plugin.ts`:

```typescript
return {
  event: async (eventInput) => { ... },'chat.message': async (...) => { ... },
  'permission.ask': async (...) => { ... },
  'tool.execute.before': async (...) => { ... },
  'shell.env': async (...) => { ... },
  'command.execute.before': async (...) => { ... },
  'tool.execute.after': async (...) => { ... },
  'experimental.text.complete': async (...) => { ... },
  'experimental.chat.messages.transform': messagesTransform,
  'experimental.session.compacting': compactionHandler,
}
```

---

**End of Report**
