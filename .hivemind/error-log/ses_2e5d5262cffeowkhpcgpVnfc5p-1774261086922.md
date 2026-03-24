---
session_id: ses_2e5d5262cffeowkhpcgpVnfc5p
timestamp: 2026-03-23T10:18:06.920Z
purpose: planning
session_state: ready
trajectory: none
workflow: none
agent: unset
---

## Assistant Output

---

## Lifecycle Trace Report: MethodTracing Hooks Before User Messages

### Classification Summary

| Hook | Status | Where Injects | Human User Filter |
|------|--------|---------------|-------------------|
| `experimental.chat.messages.transform` | **ALIVE** | Last user message parts (prepended) | `variant === 'new' \|\| variant === 'continue'` |
| `chat.message` | **ALIVE** | Resets turn snapshot | All sessions |
| `command.execute.before` | **ALIVE** | Command input parts (prepended) | Slash commands only |
| `event` | **ALIVE** | Trajectory ledger | All events |
| `tool.execute.before` | **ALIVE** | Tool intent recording | HiveMind tools only |
| `tool.execute.after` | **ALIVE** | Post-tool state capture | HiveMind tools only |
| `shell.env` | **ALIVE** | Environment variables | All sessions |
| `permission.ask` | **ALIVE** | Permission interception | Write operations |
| `experimental.session.compacting` | **ALIVE** | Compaction context | Session compaction |
| `experimental.text.complete` | **ALIVE** | Session inspection export | Text completion |

---

## 1. ALIVE Hooks (Compiled + Wired)

### Primary User Message Injection Hook: `experimental.chat.messages.transform`

**Status: ALIVE**

**Lifecycle Pipeline:**
```
OpenCode SDKcalls→ experimental.chat.messages.transform│opencode-plugin.ts line 189│↓
↓createMessagesTransformHandler()│messages-transform-adapter.ts line 40-161│↓
↓findLastUserMessage()│Find last user message in history│↓
↓Variant Filter│Lines 54-58│Filter: variant === 'new' || 'continue'│
↓resolveStartWork()│start-work-router.ts│Purpose classification, lineage│↓
↓Inject Synthetic Parts│Lines 135-145│Prepend to lastUserMessage.parts│
```

**Variant Filter (Human User Detection):**
```typescript
// Only inject on genuine user turns and subagent handoffs — skip tool results and thinking turns
const lastMsg = lastUserMessage as { info?: { variant?: string } }
if (!lastMsg.info?.variant || (lastMsg.info.variant !== 'new' && lastMsg.info.variant !== 'continue')) {
  return
}
```

**Injection Order (BEFORE user message):**
```
lastUserMessage.parts = [
  turnHierarchyPacket,   // <hivemind-turn-hierarchy>...
  hivemindContextPacket, // <hivemind context_version="v1">...skillFocusPacket,    // <available_skills>... (conditional)
  ...originalUserParts,  // User's actual message
  routeReminder,         // <hivemind-route-hint>... (conditional)
]
```

**Files Involved (All ALIVE in dist/):**
| Source | Dist | Purpose |
|--------|------|---------|
| `src/plugin/opencode-plugin.ts` | `dist/plugin/opencode-plugin.js` | Hook registration |
| `src/plugin/messages-transform-adapter.ts` | `dist/plugin/messages-transform-adapter.js` | Handler logic |
| `src/plugin/synthetic-parts.ts` | `dist/plugin/synthetic-parts.js` | Part creation |
| `src/plugin/context-renderer.*.ts` | `dist/plugin/context-renderer.*.js` | Context packet rendering |
| `src/plugin/skill-focus-renderer.ts` | `dist/plugin/skill-focus-renderer.js` | Skill block rendering |
| `src/hooks/start-work/start-work-router.ts` | `dist/hooks/start-work/*.js` | Session entry routing |

---

## 2. DEAD References (Orphan/Stale)

### Dead Folder References in AGENTS.md

| Reference | Location | Status | Evidence |
|-----------|----------|--------|----------|
| `context-injection/` | `src/hooks/AGENTS.md` line 12 | **DEAD** |Folder does not exist |
| `prompt-transformation/` | `src/hooks/AGENTS.md` line 13 | **DEAD** | Folder does not exist |
| `runtime-bridge/` | `src/hooks/AGENTS.md` line 14 | **DEAD** | Folder does not exist |
| `governance-layer.ts` | `src/hooks/AGENTS.md` line 42 | **DEAD** | File does not exist |

### Dead Source Files (Compiled but Not Wired)

| File | Status | Evidence |
|------|--------|----------|
| `src/plugin/messages-transform.ts` | **DEAD** | Compiled to `dist/plugin/messages-transform.js` but never imported in `opencode-plugin.ts` |
| `src/plugin/system-transform.ts` | **DEAD** | Compiled to `dist/plugin/system-transform.js` but never imported in `opencode-plugin.ts` |

These files export `createMessagesTransform()` and `createSystemTransform()` but arereplaced by `createMessagesTransformHandler()` which uses a different approach.

### Dead Tool Grant IDs in command-bundles.ts

```typescript
// These IDs reference non-existent hook folders:
toolGrantIds: ['prompt-transformation', 'context-injection'],// line 14
toolGrantIds: ['prompt-transformation'],// line 68
toolGrantIds: ['prompt-transformation', 'workflow-integration'],// lines 85, 102
toolGrantIds: ['context-injection', 'workflow-integration'],  // line 119
```

These tool grant IDs reference legacy hook folders that no longer exist.

---

## 3. Hook Pipeline Mapping

### Injection Before User Messages

```
┌─────────────────────────────────────────────────────────────────┐
│OpenCode SDK│
└─────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│ experime
