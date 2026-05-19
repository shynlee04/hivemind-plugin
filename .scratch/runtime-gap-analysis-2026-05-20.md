# Runtime Gap Analysis — 2026-05-20

## Source of Truth: Session ses_1bec

## Finding 1: delegate-task tool IS wired for runtime — misleading dead code

**delegate-task.ts:23-25** defines:
```
UNSUPPORTED_NATIVE_TASK_MESSAGE = "[Harness] delegate-task runtime child-session dispatch is blocked..."
```

**This message is DEAD CODE.** It is exported (line 87) but **never referenced** in the `execute()` function (lines 41-79). The actual execution path is:

```
execute() → coordinator.dispatch() → createSdkChildSessionStarter.start()
  → client.session.create()  ✓ (SDK surface, available at plugin runtime)
  → client.session.promptAsync()  ✓ (SDK surface, available at plugin runtime)
```

**Evidence:**
- `PluginInput.client` type = `ReturnType<typeof createOpencodeClient>` (plugin/dist/index.d.ts:37) — IS an SDK client
- Witness: delegation coordinator tests PASS (16/16), delegation tool tests PASS (33/33)
- The `UNSUPPORTED_NATIVE_TASK_MESSAGE` is a stale artifact from when the tool attempted `ToolContext.task` (which OpenCode plugin SDK doesn't expose). The tool was refactored to use `coordinator.dispatch()` → SDK client path, but the constant was never removed.

**Impact:** Every agent that reads `delegate-task.ts` source sees this message and concludes "the tool is blocked." This is the #1 cause of agents not using delegation tools.

---

## Finding 2: 20+ custom tools registered — zero discoverability

`plugin.ts:383-406` registers these tools:
```
delegate-task, delegation-status, run-background-command, prompt-skim,
prompt-analyze, session-patch, execute-slash-command, session-journal-export,
hivemind-doc, hivemind-trajectory, hivemind-pressure, hivemind-sdk-supervisor,
hivemind-command-engine, session-tracker, session-hierarchy, session-context,
hivemind-agent-work-create, hivemind-agent-work-export, configure-primitive,
validate-restart, bootstrap-init, bootstrap-recover
```

But NO agent instruction anywhere says: "These are the custom tools available. Here's what each does and when to use it."

The `hivemind-power-on` skill (loaded first by all L0/L1 agents) only covers session governance — it says nothing about available custom tools.

**Impact:** Agents don't know the tools exist. They fall back to reading source code.

---

## Finding 3: Agent analysis paralysis in ses_1bec

Session transcript shows:
1. `hivemind-power-on` loaded ✓
2. Found delegate-task.ts via glob ✓
3. Read delegate-task.ts → saw `UNSUPPORTED_NATIVE_TASK_MESSAGE` ❌ (agent stopped here)
4. Read types.ts, delegation-status.ts → more reading
5. **Session ended — zero custom tools invoked**

The agent never called `delegate-task`, `session-tracker`, `session-hierarchy`, or any other custom tool.

---

## Summary of Gaps

| # | Issue | Type | Fix |
|---|-------|------|-----|
| 1 | `UNSUPPORTED_NATIVE_TASK_MESSAGE` is dead code but misleads agents | Signal-to-noise | Remove or update the message |
| 2 | No agent instructions list available custom tools | Discoverability | Add tool catalog to hivemind-power-on or create agent instructions |
| 3 | Agents read source instead of using tools | Behavior | Fix (1)+(2) → agents know tools exist and are safe to use |
| 4 | `client.session.create()` + `promptAsync()` runtime behavior unproven | Verification | Need a live integration test (UAT) to confirm SDK client session ops work from inside a plugin tool execute() handler |
