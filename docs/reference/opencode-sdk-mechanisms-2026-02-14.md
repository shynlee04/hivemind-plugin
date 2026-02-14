# OpenCode SDK - Key Mechanisms for Agent Control

## 1. Between-Turn Context Injection

| Mechanism | Hook | Purpose |
|-----------|------|---------|
| `insertReminders` | `session.prompt` | Injects synthetic parts into user messages each turn |
| `experimental.session.compacting` | Plugin hook | Customize context preserved across compaction |

**Key:** Context injected WITHOUT agent stop - goes directly to next turn prompt.

---

## 2. Session Tree (Parent-Child)

```
Sessions linked via parentID
- client.session.list() → all sessions
- client.session.children({ sessionID }) → direct children
- Full tree: build manually from list
```

---

## 3. Tool Execution Chaining

```ts
// Hook after tool runs → trigger follow-up
"tool.execute.after": async (input, output) => {
  if (input.tool === "write" && output.success) {
    await triggerValidation(output.args.filePath)
  }
}
```

---

## 4. TUI Toasts - NOT Decorative

- Can include actions (e.g., "Go to session")
- Triggered via: `client.tui.showToast()`
- Events: `tui.toast.show`

---

## 5. TODO Tasks

| Tool | Permission | Purpose |
|------|------------|---------|
| `todowrite` | Required | Create/update tasks |
| `todoread` | Required | Read task list |
| SDK: `session.todo()` | - | Get session tasks |

**Note:** Disabled for subagents by default.

---

## 6. Plugin Hooks for Sessions

| Hook | Fires On |
|------|----------|
| `session.created` | New session |
| `session.compacted` | After compaction |
| `session.updated` | Session change |
| `session.idle` | Session idle |
| `experimental.session.compacting` | Before compaction prompt |

---

## 7. Agent Modes

| Mode | Behavior |
|------|----------|
| `build` | Default agent, executes tools |
| `plan` | Disallows edit tools, only plan files |

Switching between modes injects prompts automatically.

---

## Key Takeaways for HiveMind

1. **Use `experimental.session.compacting`** to inject HiveMind context into compaction
2. **Use `tool.execute.after`** to chain actions (e.g., auto-export after task)
3. **Use `todowrite`/`todoread`** for task tracking (already exists in OpenCode!)
4. **TUI toasts** can show actionable items, not just notifications
5. **Session tree** can track parent-child session relationships

---

*Source: DeepWiki Q&A - anomalyco/opencode SDK analysis*
