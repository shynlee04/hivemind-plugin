---
name: debug-orchestration
description: "Coordinate multi-phase debugging sessions in HiveMind by routing LSP errors, test failures, and manual /debug triggers through event capture, context preservation, strategy selection, and resolution. Use when setting up automated debug responses, orchestrating complex debug workflows across sessions, or building debug automation pipelines with HiveMind swarm agents."
---

# Debug Orchestration

Coordinates the full debugging lifecycle — from event detection through resolution — using HiveMind sessions, anchors, memory, and swarm agents. Selects between systematic and parallel debugging strategies based on issue characteristics.

## Workflow

1. **Detect event** — capture LSP diagnostics, test failures, runtime errors, or manual `/debug` invocations
2. **Preserve context** — start a `hivemind_session` in `quick_fix` mode, save pre-debug state via `hivemind_anchor`
3. **Select strategy** — route to `systematic-debugging-hivemind` (reproducible/obvious) or `parallel-debugging-hivemind` (multiple plausible causes)
4. **Execute debug loop** — gather evidence, form hypothesis, test, verify; check drift with `hivemind_inspect`
5. **Resolve** — run `npm test && npx tsc --noEmit`, save solution to memory, cleanup anchors, export cycle

## Strategy Selection

```
Reproducible?
├── YES → Obvious root cause?
│   ├── YES → systematic-debugging-hivemind
│   └── NO  → parallel-debugging-hivemind
└── NO  → systematic-debugging-hivemind + extended evidence
```

## Event Hooks

Register in `src/hooks/event-handler.ts`:

```typescript
// LSP diagnostics trigger
"event": async ({ event }) => {
  if (event.type === "lsp.diagnostics.publish") {
    const errors = event.data.diagnostics.filter(d => d.severity === 1)
    if (errors.length > 0) await triggerDebugOrchestration({ source: "lsp", errors, file: event.data.uri })
  }
}
```

Test failures and manual `/debug` commands follow the same pattern — see `src/hooks/event-handler.ts` and `commands/debug.ts`.

## Context Preservation

```typescript
hivemind_session({ action: "start", mode: "quick_fix", focus: "Debug: [event_summary]" })
hivemind_anchor({ action: "save", key: "pre_debug_state", value: JSON.stringify(stateSnapshot) })
```

## Resolution Checklist

- [ ] Debug session started with `hivemind_session`
- [ ] Pre-debug state preserved via anchor
- [ ] Strategy selected and skills injected
- [ ] Verification passed (`npm test && npx tsc --noEmit`)
- [ ] Solution saved to `hivemind_memory` shelf `solutions`
- [ ] Debug anchors cleaned up
- [ ] Cycle exported via `hivemind_cycle`

## Constraints

- Never skip evidence gathering — always gather before fixing
- Never assume — verify each hypothesis
- Check drift regularly with `hivemind_inspect({ action: "drift" })`; compact if drift < 40

## File References

- `src/hooks/event-handler.ts` — event hooks
- `src/lib/session-swarm.ts` — swarm orchestration
- `commands/debug.ts` — manual debug command
- `src/lib/persistence.ts` — state management
