# Session Inspection Export

- ses_id: `ses_2e5d5262cffeowkhpcgpVnfc5p`
- prepared_at: `2026-03-23T10:25:33.534Z`

## Assistant Output

## Workflow Complete

### Report Generated

**Location:** `docs/reports/hook-lifecycle-trace-2026-03-23.md`

### Summary Findings

#### Hook Classification bySDK Dependency

| Category | Count | Hooks |
|----------|-------|-------|
| **Hybrid (SDK Types)** | 2 | `event`, `experimental.chat.messages.transform` |
| **Plugin-Only** | 8 | `chat.message`, `permission.ask`, `tool.execute.before/after`, `shell.env`, `command.execute.before`, `experimental.session.compacting`, `experimental.text.complete` |

#### Hook Classification by Status

| Status | Count | Details |
|--------|-------|---------|
| **ALIVE** | 10 | All registered hooks compiled and wired |
| **DEAD** | 6 | 4 folder references + 2 source files |

#### Human User Message Detection

The `experimental.chat.messages.transform` hook uses a **variant filter** to distinguish human user messages:

```typescript
if (!lastMsg.info?.variant || (lastMsg.info.variant !== 'new' && lastMsg.info.variant !== 'continue')) {
  return  // Skip - not human user
}
```

- `'new'` → Human user starting fresh conversation → **INJECTS**
- `'continue'` → Human user continuing conversation → **INJECTS**
- Other/no variant → Tool results, thinking, orchestrator → **SKIPS**

#### Dead References to Clean Up

1. **AGENTS.md** references non-existent folders:
   - `context-injection/`
   - `prompt-transformation/`
   - `runtime-bridge/`
   - `governance-layer.ts`

2. **Source files compiled but not wired:**
   - `src/plugin/messages-transform.ts`
   - `src/plugin/system-transform.ts`

3. **Legacy tool grant IDs in command-bundles.ts:**
   - `prompt-transformation`
   - `context-injection`