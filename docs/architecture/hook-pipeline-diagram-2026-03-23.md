# HiveMind Hook Pipeline Diagram

> **Document ID**: `hook-pipeline-diagram-2026-03-23`
> **SOT**: `src/plugin/opencode-plugin.ts`, `src/hooks/event-handler.ts`, `src/plugin/messages-transform-adapter.ts`
> **Stub Status**: `nl-first-dispatch` returns `shouldDispatch: false` in all paths

---

## 1. Hook Registration Flow

```mermaid
flowchart TD
    subgraph Load["OpenCode Load Sequence"]
        A["OpenCode Server Start"] --> B["HiveMindPlugin factory"]
        B --> C["initSdkContext()"]
        C --> D["createEventHandler()"]
        D --> E["createTurnSnapshotLoader()"]
        E --> F["createMessagesTransformHandler()"]
        F --> G["createCompactionHandler()"]
    end

    subgraph Register["9 Hooks Registered"]
        H1["event"]
        H2["chat.message"]
        H3["permission.ask"]
        H4["tool.execute.before"]
        H5["tool.execute.after"]
        H6["shell.env"]
        H7["command.execute.before"]
        H8["experimental.chat.messages.transform"]
        H9["experimental.session.compacting"]
    end

    G --> Register
```

**Hook Registration Order (opencode-plugin.ts:59-165)**:

| # | Hook Key | Handler Created | Scope |
|---|----------|------------------|-------|
| 1 | `event` | `createEventHandler()` | Session |
| 2 | `chat.message` | Inline (lines 73-85) | Turn |
| 3 | `permission.ask` | Inline (lines 86-103) | Turn |
| 4 | `tool.execute.before` | Inline (lines 104-109) | Turn |
| 5 | `tool.execute.after` | Inline (lines 158-162) | Turn |
| 6 | `shell.env` | Inline (lines 110-116) | Turn |
| 7 | `command.execute.before` | Inline (lines 117-157) | Turn |
| 8 | `experimental.chat.messages.transform` | `createMessagesTransformHandler()` | Turn |
| 9 | `experimental.session.compacting` | `createCompactionHandler()` | Session |

---

## 2. Message Processing Pipeline

```mermaid
sequenceDiagram
    participant U as User Message
    participant CM as chat.message
    participant MT as messages.transform
    participant SW as resolveStartWork()
    participant CP as createHivemindContextPacket()
    participant CR as renderHivemindContext()
    participant LLM as LLM Call

    U->>CM: New turn begins
    CM->>CM: resetTurnSnapshot()
    Note over CM: Shows degraded mode toast<br/>if HiveMind unhealthy

    U->>MT: Transform message history
    MT->>MT: findLastUserMessage()
    MT->>SW: createStartWorkInput()
    SW->>SW: resolveStartWork()
    Note over SW: Purpose classification<br/>Lineage resolution<br/>Readiness gates

    SW->>MT: startWork decision
    MT->>MT: check nl-first-dispatch

    alt nl-first-dispatch
        MT->>MT: STUBBED: returns shouldDispatch: false
        Note over MT: All paths in nl-first-dispatch.ts<br/>return shouldDispatch: false
    end

    MT->>CP: createHivemindContextPacket()
    Note over CP: sessionId, snapshot, startWork,<br/>agentWorkPacket

    CP->>CR: renderHivemindContext()
    Note over CR: Builds context packet with:<br/>- trajectory_path<br/>- active_session<br/>- hivemind_context tag

    CR->>MT: <hivemind context>
    MT->>U: Inject synthetic parts
    U->>LLM: Enhanced message history
```

**Key Functions**:

| Function | Location | Purpose |
|----------|----------|---------|
| `resolveStartWork()` | `hooks/start-work/start-work-router.ts` | Purpose classification, lineage, readiness gates |
| `createHivemindContextPacket()` | `plugin/context-renderer.ts` | Builds canonical context packet |
| `renderHivemindContext()` | `plugin/context-renderer.ts` | Renders packet to string format |
| `maybeExecuteNlFirstRuntimeDispatch()` | `features/runtime-entry/nl-first-dispatch.ts` | **STUBBED** - always returns `shouldDispatch: false` |

---

## 3. Tool Execution Pipeline

```mermaid
flowchart LR
    subgraph Before["tool.execute.before"]
        TB["tool.execute.before hook"]
        TB --> TB1["isHivemindManagedTool?"]
        TB1 -->|"Yes"| RTE1["recordToolEvent()<br/>:pre"]
        TB1 -->|"No"| SKIP1["Skip"]
    end

    subgraph Execution["Tool Execution"]
        EX["[Tool Executes]"]
    end

    subgraph After["tool.execute.after"]
        TA["tool.execute.after hook"]
        TA --> TA1["isHivemindManagedTool?"]
        TA1 -->|"Yes"| RTE2["recordToolEvent()"]
        TA1 -->|"No"| SKIP2["Skip"]
    end

    TB --> EX --> TA
```

**Managed Tools** (`hooks/runtime-loader/tool-governance.ts`):

| Tool Name | Purpose |
|-----------|---------|
| `hivemind_runtime_status` | Runtime status reporting |
| `hivemind_runtime_command` | Command execution |
| `hivemind_task` | Task management |
| `hivemind_trajectory` | Trajectory tracking |
| `hivemind_handoff` | Agent handoff |
| `hivemind_doc` | Documentation access |
| `hivemind_agent_work_create_contract` | Contract creation |
| `hivemind_agent_work_export_contract` | Contract export |

---

## 4. Session Lifecycle Events

```mermaid
flowchart TD
    subgraph Events["Lifecycle Events"]
        SS["session.started"]
        SE["session.ended"]
        SC["session.compacted"]
        MA["message.added"]
        MU["message.updated"]
        TE["tool.executed"]
        CE["command.executed"]
        AC["agent.created"]
        TS["trajectory.started"]
        TE2["trajectory.ended"]
    end

    subgraph Handler["event Handler"]
        EH["event-hook"]
        EH --> EH1["extractAgentWorkEventPacket()"]
        EH1 --> EH2["loadRuntimeBindingsSnapshot()"]
        EH2 --> EH3["matchesActiveTrajectorySession()?"]
        EH3 -->|"No"| DROP["Drop event"]
        EH3 -->|"Yes"| EH4["recordTrajectoryEvent()"]
    end

    subgraph Compaction["session.compacted Special Path"]
        EH4 --> EH5["session.compacted?"]
        EH5 -->|"Yes"| CP["createRecoveryCheckpoint()"]
        CP --> CP1["Checkpoint for hm-harness"]
    end

    Events --> Handler
```

**Event Handler Logic** (`hooks/event-handler.ts:87-124`):

```
1. Extract agent-work event packet
2. Load runtime bindings snapshot
3. If no trajectoryId → DROP
4. If session not in trajectory → DROP
5. Record trajectory event with evidence refs
6. If session.compacted → create recovery checkpoint
```

---

## 5. Environment Injection

```mermaid
flowchart LR
    subgraph Shell["shell.env Hook"]
        SE["shell.env hook"]
        SE --> SS["turnSnapshot.getSnapshot()"]
    end

    subgraph EnvVars["Injected Environment Variables"]
        EV1["HIVEMIND_RUNTIME_ATTACHED=1"]
        EV2["HIVEMIND_ATTACHMENT_MODE"]
        EV3["HIVEMIND_ACTIVE_TRAJECTORY"]
        EV4["HIVEMIND_ACTIVE_WORKFLOW"]
    end

    SS -->|snapshot| SE
    SE -->|output.env| EV1
    SE -->|output.env| EV2
    SE -->|snapshot.trajectoryId| EV3
    SE -->|snapshot.workflowId| EV4
```

---

## 6. Permission Gate

```mermaid
flowchart TD
    subgraph Permission["permission.ask Hook"]
        PA["permission.ask hook"]
        PA --> PA1["metadata.tool?"]
        PA1 -->|"tool exists"| PA2["isHivemindManagedTool?"]
        PA2 -->|"Yes"| ALLOW["output.status = 'allow'"]
        PA2 -->|"No"| PA3["permission.type == 'write'?"]
        PA3 -->|"Yes"| TOAST["showGovernanceToast()<br/>mutation-gate"]
        PA3 -->|"No"| PASS["Pass through"]
    end
```

---

## 7. Command Execution Pipeline

```mermaid
flowchart TD
    subgraph Pre["command.execute.before Hook"]
        CE["command.execute.before"]
        CE --> CB["findSlashCommandBundle()"]
        CB -->|"Found"| CB1["turnSnapshot.getSnapshot()"]
        CB -->|"Not Found"| END["Return early"]
        CB1 --> CB2["Build tool_precedence_chain"]
        CB2 --> CB3["createSyntheticPart()"]
        CB3 --> CB4["output.parts.unshift()"]
    end
```

---

## 8. Complete Hook Execution Order (Per Turn)

```mermaid
sequenceDiagram
    participant OC as OpenCode
    participant HM as HiveMind Plugin

    Note over OC,HM: TURN START
    OC->>HM: session.started event
    HM->>HM: event handler → recordTrajectoryEvent()

    Note over OC,HM: MESSAGE PROCESSING
    OC->>HM: chat.message
    HM->>HM: resetTurnSnapshot()
    HM->>HM: showGovernanceToast() if degraded

    OC->>HM: shell.env
    HM->>HM: Inject HIVEMIND_* env vars

    OC->>HM: experimental.chat.messages.transform
    HM->>HM: resolveStartWork()
    HM->>HM: createHivemindContextPacket()
    HM->>HM: renderHivemindContext()
    Note over HM: nl-first-dispatch STUBBED<br/>returns shouldDispatch: false

    Note over OC,HM: TOOL EXECUTION (per tool)
    OC->>HM: tool.execute.before
    HM->>HM: recordToolEvent() if managed tool

    OC->>HM: [Tool executes]

    OC->>HM: tool.execute.after
    HM->>HM: recordToolEvent() if managed tool

    Note over OC,HM: COMMAND EXECUTION (if slash command)
    OC->>HM: command.execute.before
    HM->>HM: inject tool_precedence_chain

    Note over OC,HM: SESSION END
    OC->>HM: session.compacted event
    HM->>HM: event handler → createRecoveryCheckpoint()
```

---

## 9. Scope of Impact Matrix

| Hook | Turn | Session | Subsession | Notes |
|------|------|---------|------------|-------|
| `event` | — | ✅ | ✅ | All lifecycle events |
| `chat.message` | ✅ | — | — | Reset turn snapshot |
| `permission.ask` | ✅ | — | — | Auto-allow managed tools |
| `tool.execute.before` | ✅ | — | — | Pre-tool event recording |
| `tool.execute.after` | ✅ | — | — | Post-tool event recording |
| `shell.env` | ✅ | — | — | Env injection per turn |
| `command.execute.before` | ✅ | — | — | Pre-command context injection |
| `messages.transform` | ✅ | — | — | Primary injection pipeline |
| `session.compacting` | — | ✅ | ✅ | Recovery checkpoint creation |

---

## 10. Stubbed Code: `nl-first-dispatch`

**Location**: `src/features/runtime-entry/nl-first-dispatch.ts`

**All code paths return `shouldDispatch: false`**:

```typescript
// Line 47: Control plane primitive found
return { plan: { shouldDispatch: false, routeKind: 'control-plane', ... } }

// Line 59: No command available
return { plan: { shouldDispatch: false, routeKind: 'none', ... } }

// Line 70: Command bundle not found
return { plan: { shouldDispatch: false, routeKind: 'none', ... } }

// Line 80: Default fallback
return { plan: { shouldDispatch: false, routeKind: 'workflow-command', ... } }
```

**Impact**: The NL-first runtime dispatch mechanism is non-functional. The `dispatch.plan.shouldDispatch` check in `messages-transform-adapter.ts:84` never triggers, so the turn snapshot reset at line 87 (`turnSnapshot.resetTurnSnapshot()`) is never called after dispatch.

---

## Appendix: File References

| File | Lines | Role |
|------|-------|------|
| `src/plugin/opencode-plugin.ts` | 40-172 | Plugin factory, 9 hook registrations |
| `src/hooks/event-handler.ts` | 87-125 | Event routing to trajectory ledger |
| `src/plugin/messages-transform-adapter.ts` | 38-131 | Primary message injection pipeline |
| `src/plugin/compaction-adapter.ts` | 23-46 | Session compaction context |
| `src/features/runtime-entry/nl-first-dispatch.ts` | 32-86 | **STUBBED** dispatch logic |
| `src/plugin/runtime-snapshot.ts` | 20-35 | Per-turn snapshot caching |
