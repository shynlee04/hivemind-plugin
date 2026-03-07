# Restart Message Template

**PURPOSE**: Deterministic template for composing the restart suggestion message. Fill ALL fields before presenting to user.

---

## [FILL] Restart Suggestion

I've detected that this session may have started with the wrong configuration. Here's what I've gathered:

### What You Asked For

> [PASTE: user's original intent, as understood]

### Why This Session Can't Serve It Well

[EXPLAIN: specific mismatch — lineage/domain/tool/command]

| Current Setup | Needed Setup |
|---------------|-------------|
| Orchestrator: [current] | Orchestrator: [recommended] |
| Agent type: [current] | Agent type: [recommended] |
| Available tools: [current] | Required tools: [needed] |

### Context I've Gathered

[LIST: any useful context collected during this session that would help the next session]

- Key fact 1: ...
- Key fact 2: ...
- Decision made: ...
- File state: ...

### Recommended Action

**Copy the message below and start a new session with [RECOMMENDED COMBO]:**

```
[COMPOSE: the exact message the user should paste into the new session]
[Include: intent + context payload + any gathered facts]
```

---

## Template Rules

1. **NEVER omit the "Why" section** — user needs to understand the mismatch
2. **ALWAYS include gathered context** — don't waste the work done in this session
3. **ALWAYS provide the copy-paste message** — make it zero-effort for the user
4. **NEVER attempt to fix the session** — compose and STOP
5. **Include tool availability** — if the mismatch is platform-based, note which tools are needed
