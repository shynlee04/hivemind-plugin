# Event Wiring Matrix: Session Journal

**Date:** 2026-03-29
**Status:** proposed

---

## SDK Hook → Event Type → Handler → Data Extraction → Output Target

### Wired Events (Currently Active in Plugin)

| SDK Hook | Event Type | Handler | Data Extracted | Output Target | Status |
|----------|-----------|---------|----------------|---------------|--------|
| `event` | `session.idle` | `event-handler.ts` | `sessionID` from `event.properties` | `consolidated-writer.addEvent()` → `.hivemind/sessions/{id}.json` | WIRED |
| `event` | `session.compacted` | `event-handler.ts` | `trajectoryId`, `workflowId`, `taskIds` | `recovery/createRecoveryCheckpoint()` | WIRED (not journal) |
| `experimental.text.complete` | — | `text-complete-handler.ts` | `sessionID`, `output.text` | `consolidated-writer.addTurn()` + `addEvent()` + `incrementCounter()` + `addDiagnostic()` | WIRED |
| `experimental.text.complete` | — | `diagnostic-log.ts` | `sessionID`, `assistantText`, `purpose`, `injection` | `.hivemind/error-log/{sessionId}-{ts}.md` | WIRED (LEGACY) |
| `experimental.text.complete` | — | `session-inspection.ts` | `sessionID`, `assistantText` | `.hivemind/session-inspection/{id}/assistant-output.md` | WIRED (LEGACY) |
| `experimental.session.compacting` | compaction | `compaction-handler.ts` | `sessionID`, `context.length`, `prompt` | `consolidated-writer.addEvent()` + `incrementCounter()` | WIRED |
| `experimental.chat.system.transform` | — | `transform-handler.ts` | `sessionID`, `output.system[]` | `injection-store.setInjectionPayload()` | WIRED |

### Not-Wired Events (Handler Exists, Not Registered)

| SDK Hook | Event Type | Handler File | Data Available | Output Target | Status |
|----------|-----------|--------------|----------------|---------------|--------|
| `chat.message` | user_message | `chat-message-handler.ts` | `sessionID`, `agent`, `message.content`, `message.role` | `consolidated-writer.addTurn()` with `userMessage` populated | EXISTS, NOT WIRED |
| `tool.execute.after` | tool_invocation | `tool-execution-handler.ts` | `tool`, `sessionID`, `callID`, `args`, `title`, `output` | `consolidated-writer.addEvent()` + `incrementCounter('toolCallCount')` | EXISTS, NOT WIRED |

### Not-Wired Events (No Handler Exists)

| SDK Hook | Event Type | Purpose per User Spec | Status |
|----------|-----------|----------------------|--------|
| `event` | `session.started` | Create new session entry | Handler logic needs adding to `event-handler.ts` |
| `event` | `session.ended` | Mark session completed/abandoned | Handler logic needs adding to `event-handler.ts` |
| `event` | `session.error` | Log to error log with session id | Handler logic needs adding to `event-handler.ts` |
| `shell.env` | shell.env | "Research further" | WIRED for env vars only; no journal impact |
| `command.execute.before` | command.executed | "Brief actor + result" | WIRED for context injection; not journaling |

### Events Without SDK Hooks (Cannot Wire)

| User-Specified Event | SDK Hook Available? | Notes |
|---------------------|-------------------|-------|
| `file.edited` | NO | Not an SDK hook |
| `file.watcher.updated` | NO | Not an SDK hook |
| `lsp.client.diagnostics` | NO | Not an SDK hook |
| `lsp.updated` | NO | Not an SDK hook |
| `message.part.removed` | NO | Not an SDK hook |
| `message.part.updated` | NO | Not an SDK hook |
| `message.removed` | NO | Not an SDK hook |
| `message.updated` | NO | Not an SDK hook |
| `session.diff` | NO | Not an SDK hook |
| `session.status` | NO | Not an SDK hook |
| `session.updated` | NO | Not an SDK hook |
| `todo.updated` | NO | Not an SDK hook |
| `tui.prompt.append` | NO | Not an SDK hook |
| `tui.command.execute` | NO | Not an SDK hook |
| `tui.toast.show` | NO | Not an SDK hook |

**Note**: 14 of the user's 20+ specified event types have no corresponding SDK hook. These cannot be wired without a custom event bus, which is forbidden by project anti-patterns. The gap must be documented and accepted.

---

## Detailed Wiring Plan

### Hook: `chat.message` → User Message Capture

**Current state** in `opencode-plugin.ts`:
```typescript
'chat.message': async (_messageInput, _output) => {
  turnSnapshot.resetTurnSnapshot()
  const snapshot = await turnSnapshot.getSnapshot()
  // ... governance toast only
},
```

**Target state**:
```typescript
'chat.message': async (messageInput, output) => {
  // 1. Journal: capture user message
  await handleChatMessage(messageInput, output, directory)
    .catch(err => console.error('[session-journal] chat-message failed:', err))

  // 2. Existing: reset turn snapshot + governance toast
  turnSnapshot.resetTurnSnapshot()
  const snapshot = await turnSnapshot.getSnapshot()
  // ... governance toast
},
```

**Data flow**:
```
chat.message hook
  → messageInput.sessionID, messageInput.agent
  → output.message.role, output.message.content
  → handleChatMessage()
    → sessionResolver.resolveOrCreate(sdkSessionId)
    → consolidatedWriter.addTurn() with userMessage = output.message.content
    → consolidatedWriter.incrementCounter('userMessageCount')
```

### Hook: `tool.execute.after` → Tool Invocation Tracking

**Current state** in `opencode-plugin.ts`:
```typescript
'tool.execute.after': async (toolInput) => {
  if (isHivemindManagedTool(toolInput.tool)) {
    await recordToolEvent(directory, toolInput.sessionID, toolInput.tool)
  }
},
```

**Target state**:
```typescript
'tool.execute.after': async (toolInput) => {
  // 1. Journal: capture tool invocation
  await handleToolExecution(toolInput, toolInput, directory)
    .catch(err => console.error('[session-journal] tool-execution failed:', err))

  // 2. Existing: trajectory tracking
  if (isHivemindManagedTool(toolInput.tool)) {
    await recordToolEvent(directory, toolInput.sessionID, toolInput.tool)
  }
},
```

**Data flow**:
```
tool.execute.after hook
  → toolInput.tool, toolInput.sessionID, toolInput.callID, toolInput.args
  → handleToolExecution()
    → sessionResolver.resolveOrCreate(sdkSessionId)
    → consolidatedWriter.addEvent() with type='tool_invocation'
    → consolidatedWriter.incrementCounter('toolCallCount')
```

### Hook: `event` → Session Lifecycle Events

**Current state**: Only `session.idle` handled.

**Target state**: Add `session.started`, `session.ended` handling.

```typescript
// In event-handler.ts
if (event.type === 'session.started') {
  const sessionId = (event.properties as { sessionID?: string })?.sessionID
  if (sessionId) {
    await sessionResolver.resolveOrCreate(sessionId, {
      lineage: 'hiveminder',
      purposeClass: 'implementation',
      agent: 'unknown',
    })
  }
}

if (event.type === 'session.ended') {
  const sessionId = (event.properties as { sessionID?: string })?.sessionID
  if (sessionId) {
    const semanticId = await sessionResolver.resolve(sessionId)
    if (semanticId) {
      await consolidatedWriter.updateStatus(sessionsDir, semanticId, 'completed')
    }
  }
}
```

### Hook: `experimental.text.complete` → Remove Legacy Calls

**Current state** (in `opencode-plugin.ts` lines 226-267):
```typescript
'experimental.text.complete': async (input, output) => {
  // ... legacy calls
  await upsertSessionInspectionExport(...)  // REMOVE
  await writeDiagnosticLog(...)             // REMOVE
  await createTextCompleteHandler(...)       // KEEP
},
```

**Target state**:
```typescript
'experimental.text.complete': async (input, output) => {
  const sessionId = input.sessionID
  const assistantText = typeof output.text === 'string' ? output.text : ''
  if (!sessionId || assistantText.length === 0) return

  // Consolidated journal only (legacy removed)
  await createTextCompleteHandler({ directory })(
    { sessionID: sessionId, messageID: '', partID: '' },
    { text: assistantText },
  ).catch(err => console.error('[session-journal] text-complete handler failed:', err))
},
```

---

## Event → Journey-Events Markdown Mapping

| Event Type | Journey-Events Section | Format |
|-----------|----------------------|--------|
| `user_message` | `## Turn N — User Message` | Plain text block |
| `assistant_output` | `## Turn N — Assistant Output` | Fenced code or plain text |
| `tool_invocation` | `## Tool Batch: {toolName} (Turn N)` | Table: Tool \| Action \| Result |
| `delegation_created` | `## Delegations` section | Summary with sub-session link |
| `delegation_returned` | `## Delegations` section | Appended result |
| `compaction` | `## Turn N — Compaction` | Context length + prompt |
| `session_start` | Header metadata | `**Started:** {timestamp}` |
| `session_end` | Header metadata | `**Ended:** {timestamp}` |
| `error` | `## Turn N — Error` OR `error-logs/` | Error message + context |
| `injection` | Metadata block | `**Actors:** {agents}` |

---

## Counter Increment Matrix

| Counter | Incremented By | Hook | Condition |
|---------|---------------|------|-----------|
| `userMessageCount` | `chat-message-handler.ts` | `chat.message` | `message.role === 'user'` |
| `assistantOutputCount` | `text-complete-handler.ts` | `experimental.text.complete` | `assistantText.length > 0` |
| `toolCallCount` | `tool-execution-handler.ts` | `tool.execute.after` | Always |
| `delegationCount` | (not yet implemented) | — | When delegation tracking is wired |
| `compactionCount` | `compaction-handler.ts` | `experimental.session.compacting` | Always |
| `turnCount` | `consolidated-writer.addTurn()` | — | Every `addTurn()` call |
