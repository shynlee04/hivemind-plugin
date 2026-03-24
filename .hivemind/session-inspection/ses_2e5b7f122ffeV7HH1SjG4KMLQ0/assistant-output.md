# Session Inspection Export

- ses_id: `ses_2e5b7f122ffeV7HH1SjG4KMLQ0`
- prepared_at: `2026-03-23T10:42:30.858Z`

## Assistant Output

Now I have a comprehensive understanding. Let me provide the complete analysis:

---

# Pre-Send Human-User Message Injection Audit: Excluded Pathways Analysis

## Context: The Pre-Send Flow

The **pre-send human-user message injection** refers to `experimental.chat.messages.transform` (in `src/plugin/messages-transform-adapter.ts`), which:

1. Finds the **last user message** in the message history
2. Injects **synthetic parts** (turn hierarchy, context packet, skill focus, route hint) **BEFORE** the user's message parts are sent to the LLM
3. Executes **BEFORE** each turn's user message is sent to the model

---

## EXCLUDED PATHWAY ANALYSIS

```
EXCLUDED-001:
  pathway: Delegation/Handoff System
  files:
    - src/delegation/delegation-packet.ts
    - src/delegation/delegation-store.ts
    - src/tools/handoff/index.ts
    - src/tools/handoff/tools.ts
    - src/features/handoff/handoff.ts
  purpose: Creates, stores, and manages delegation handoff records for sub-session workflows. 
           Exposed to agents via `hivemind_handoff` tool which allows creating, inspecting, 
           validating, and closing resumable handoffs with evidence requirements.
  exclusion_reason: "Orchestrator-to-subsession traffic only"
  evidence:
    - delegation-packet.ts:18-29 defines DelegationPacket with sourceSessionId/targetSessionId
    - delegation-store.ts:132-153 creates handoffs with status lifecycle: open→validated→closed
    - tools.ts:14 uses enum ['create','read','list','update','validate','close'] for actions
    - handoff.ts:89-270 executes actions via tool.execute (WRITE-side, not message injection)
    - This is a TOOL (write-side), not a HOOK (read-side/intercept)
    - Per AGENTS.md: "src/tools/ — Write-side — 6 structured agent-callable tools"
    - Tool execution happens AFTER message send, when agent calls the tool
    - No synthetic part injection occurs - handoff data is returned as tool JSON output
  potential_overlap: NONE — Tools are call-response, not pre-send injection
```

```
EXCLUDED-002:
  pathway: Control Plane System
  files:
    - src/control-plane/index.ts
    - src/control-plane/control-plane-registry.ts
    - src/control-plane/control-plane-handler.ts
    - src/control-plane/control-plane-intake.ts
    - src/control-plane/sdk-runtime.ts
    - src/features/runtime-entry/harness.ts
    - src/features/runtime-entry/attachment.ts
  purpose: Gate/intake system for CLI commands (hm-init, hm-doctor, hm-harness, hm-settings).
           Operates OUTSIDE the agent loop. Manages first-run, repair entry, and readiness probes.
  exclusion_reason: "Outside the message send flow — operates at CLI level, not agent loop level"
  evidence:
    - src/AGENTS.md:39-43 states Control Plane operates "outside the agent loop"
    - control-plane-handler.ts:21-31 routes to handlers like runHarnessHandler
    - harness.ts:164-232 runHarnessCommand creates a FAKE session ses_harness_<timestamp>
    - harness.ts:171-182 executes command bundle with artificial session for DIAGNOSTIC purposes
    - AGENTS.md: "hm-harness is currently a readiness and diagnostic surface, not authoritative proof"
    - attachment.ts is purely re-export module for backward compatibility
    - Control plane hooks (hm-*) are slash commands invoked by user or system, not message hooks
    - SDK Usage Rules: "Code in src/cli/ and src/control-plane/ MUST ONLY import from @opencode-ai/sdk"
  potential_overlap: NONE — Control plane is strictly outside agent loop
```

```
EXCLUDED-003:
  pathway: Session Compaction Hook
  files:
    - src/plugin/compaction-adapter.ts
    - src/plugin/context-renderer.compaction-renderers.ts
    - dist/plugin/compaction-adapter.js
  purpose: Injects HiveMind context into compaction prompt when 
           experimental.session.compacting fires
  exclusion_reason: "Runs on session.compacting event, not on message send"
  evidence:
    - compaction-adapter.ts:23-45 creates handler for session.compacting hook
    - Hook signature: async (compactionInput, output) => output.context.push(renderedContext)
    - renderHivemindContext at line 43 renders context for COMPACTION PROMPT
    - Compaction happens when OpenCode compresses message history to save context
    - Compaction is a separate lifecycle event from message send
    - AGENTS.md: "session.compacting ✅ Adopted — Compaction context"
    - Compaction modifies the context array passed to compaction summarization,
      not the message history that gets sent with each turn
  potential_overlap: NONE — Different hook, different purpose, different timing
```

```
EXCLUDED-004:
  pathway: Post-Send Hooks
  files:
    - src/plugin/opencode-plugin.ts:165-202 (experimental.text.complete)
    - src/plugin/opencode-plugin.ts:106-111 (tool.execute.before)
    - src/plugin/opencode-plugin.ts:160-164 (tool.execute.after)
    - src/plugin/opencode-plugin.ts:119-159 (command.execute.before)
    - src/hooks/event-handler.ts (event hook)
  purpose: Various hooks that fire AFTER or INDEPENDENTLY of message send
  exclusion_reason: "Post-response or lifecycle hooks, not pre-send injection"
  evidence:
    - experimental.text.complete (line 165-202):
      * Fires when assistant TEXT OUTPUT is complete
      * Reads injection payload stored by messages.transform
      * Writes diagnostic log
      * Session inspection export
      * Happens AFTER model generates response
    
    - tool.execute.before (line 106-111):
      * Fires BEFORE tool execution
      * Records tool:pre event for trajectory
      * Tool execution happens mid-turn after model decides to call tool
      * NOT related to user message injection
    
    - tool.execute.after (line 160-164):
      * Fires AFTER tool execution completes
      * Records trajectory event
      * Happens AFTER tool result, before next model call
      * NOT related to user message pre-send
    
    - command.execute.before (line 119-159):
      * Fires BEFORE slash command execution
      * Injects <hivemind-command-context> via synthetic part
      * BUT: This is for COMMAND context, not USER MESSAGE context
      * Command context is for hm-* CLI commands, not agent conversation
      * Different message flow
    
    - event hook (event-handler.ts):
      * Records trajectory events for lifecycle: session.started, session.ended, etc.
      * Creates recovery checkpoint on session.compacted
      * Event recording is ASYNC, happens across session lifecycle
      * NOT message injection
  potential_overlap: command.execute.before DOES inject synthetic parts, but:
    - Targeted at COMMAND execution context, not user message flow
    - Different trigger condition (slash command vs. user message)
    - If audit scope includes ANY synthetic injection, this is AMBIGUOUS
```

```
EXCLUDED-005:
  pathway: Session Entry / Start-Work System
  files:
    - src/hooks/start-work/start-work-router.ts
    - src/hooks/start-work/start-work-router-helpers.ts
    - src/features/session-entry/*.ts
  purpose: Purpose classification, lineage resolution, readiness gates, trajectory 
           assessment for session entry. Decides entry routing only.
  exclusion_reason: "Session entry lifecycle, not message send flow. Reads state and 
                    recommends actions but does not inject into messages."
  evidence:
    - start-work-router.ts:38-189 resolveStartWork() aggregates 25+ fields of routing decision
    - Purpose: "decides entry routing only" per AGENTS.md
    - Does NOT inject into message history — only makes decisions
    - messages-transform-adapter.ts:71-77 CALLS resolveStartWork to GET decisions
    - Start-work is a READER that informs the writer (messages-transform)
    - AGENTS.md: "hooks/ — Read-side/intercept — inject context and enforce in-band guards"
    - But start-work is read/CLASSIFY, not write/INJECT
    - Core/session/ was REMOVED — session lifecycle now in hooks/start-work/
  potential_overlap: NONE — Clear separation between decision logic (start-work) 
                     and injection logic (messages-transform)
```

```
EXCLUDED-006:
  pathway: Trajectory Recording System
  files:
    - src/core/trajectory/index.ts
    - src/tools/trajectory/index.ts
  purpose: Trajectory ledger, events, checkpoints, assessment. State authority for
           tracking session history across turns.
  exclusion_reason: "State management (write to .hivemind/state/trajectory-ledger.json), 
                    not message injection"
  evidence:
    - trajectory/index.ts: Record trajectory events to ledger file
    - Tool hivemind_trajectory is WRITE-side (like handoff tool)
    - Events recorded via recordTrajectoryEvent() in event-handler.ts
    - Happens asynchronously after lifecycle events
    - NOT part of message send pipeline
  potential_overlap: NONE — Trajectory is state, not message content
```

```
EXCLUDED-007:
  pathway: Workflow Management / Task Lifecycle
  files:
    - src/core/workflow-management/task-lifecycle.ts
    - src/core/workflow-management/workflow-*.ts
    - src/tools/task/index.ts
  purpose: Workflow authority, task lifecycle state (pending/in_progress/complete).
           Task records stored in .hivemind/state/tasks.json
  exclusion_reason: "State management for task tracking, not message injection"
  evidence:
    - task-lifecycle.ts:180-353 defines task state transitions
    - Workflow management is WRITE-side, persistent state
    - Tool hivemind_task manages task state via tool execution
    - AGENTS.md: "tools/ — Write-side — 6 structured agent-callable tools"
    - Not a hook, not pre-send
  potential_overlap: NONE — Clear write-side state management
```

```
EXCLUDED-008:
  pathway: SDK Context System
  files:
    - src/hooks/sdk-context.ts
  purpose: Caches SDK client/shell references for hook-local use
  exclusion_reason: "Infrastructure for hooks, not injection itself"
  evidence:
    - sdk-context.ts:11-76 caches and provides access to PluginInput references
    - Provides getClient(), getShell(), getServerUrl() utilities
    - No injection logic — purely support infrastructure
  potential_overlap: NONE — Support infrastructure, not injection pathway
```

---

## AMBIGUOUS PATHWAYS (Potential Overlap)

```
EXCLUDED-AMB-001:
  pathway: command.execute.before injection
  files:
    - src/plugin/opencode-plugin.ts:119-159
  ambiguity: "Injects synthetic parts, but for COMMAND context, not user message"
  details:
    - Hook fires: BEFORE slash command execution (e.g., hm-init, hm-plan)
    - Injection: Creates <hivemind-command-context> with trajectory/workflow/task_ids
    - Uses: createSyntheticPart() — SAME mechanism as messages.transform
    - But: Targeted at COMMAND bundle execution, not conversation turns
    
    DIFFERENCE FROM messages.transform:
    - messages.transform: Injects into LAST USER MESSAGE for LLM consumption
    - command.execute.before: Injects into command execution context for hm-* tools
    
    POTENTIAL OVERLAP IF:
    - User sends a message that triggers automatic command detection
    - Or if command context somehow bleeds into message context
    
    EVIDENCE IT'S DIFFERENT:
    - command.execute.before checks findSlashCommandBundle() at line 120
    - Only injects if command bundle exists
    - Tool precedence chain is for hivemind_runtime_command execution
    - AGENTS.md separates "command context" from "message context"
    
    VERDICT: Likely NOT overlapping, but audit scope should clarify if 
             "pre-send human-user message" includes command-triggered flows
```

```
EXCLUDED-AMB-002:
  pathway: shell.env injection
  files:
    - src/plugin/opencode-plugin.ts:112-118
  ambiguity: "Injects environment variables, not message content — but changes runtime context"
  details:
    - Hook fires: Every turn before message send
    - Injection: Sets HIVEMIND_RUNTIME_ATTACHED, HIVEMIND_ATTACHMENT_MODE, etc.
    - These env vars are visible to agent and could influence behavior
    
    DIFFERENCE FROM messages.transform:
    - shell.env modifies environment, not message content
    - Environment vars are implicit context, not explicit message injection
    
    VERDICT: NOT message injection, but could be considered "pre-send context influence"
             if audit scope includes environmental context
```

---

## Summary: Why Each Pathway is Excluded

| Pathway | Type | Pre-Send? | Reason |
|---------|------|-----------|--------|
| Delegation/Handoff | Tool (Write) | NO | Tool execution is call-response, post message send |
| Control Plane | CLI System | NO | Outside agent loop entirely |
| Session Compaction | Hook | NO | Different event (compaction vs message send) |
| Post-Send Hooks | Hook | NO | Fire AFTER response or mid-turn after model call |
| Start-Work | Read-side | NO | Decision logic, not injection |
| Trajectory | State Write | NO | Async event recording, not message content |
| Task Lifecycle | State Write | NO | Task management, not message content |
| SDK Context | Infrastructure | NO | Support system, not injection |

---

## Key Finding: Is There ANY Overlap?

**NO — the pathways are cleanly separated:**

1. **`experimental.chat.messages.transform`** — The ONLY pre-send injection hook for human-user messages
   - Located at `src/plugin/messages-transform-adapter.ts`
   - Uses `createSyntheticPart()` to inject `<hivemind-turn-hierarchy>`, `<hivemind>`, and optionally `<hivemind-route-hint>`
   - ONLY injects into last user message's parts array

2. **All other synthetic part creation** via `command.execute.before` is for COMMAND context, not USER message context

3. **The architecture follows CQRS strictly:**
   - Hooks (read-side) inject context
   - Tools (write-side) mutate state
   - Control plane operates outside agent loop
   - Events record lifecycle changes asynchronously

**False Negatives Assessment:** No significant false negatives. The exclusion is accurate because:
- Tool execution happens via agent calling the tool, not pre-send
- Control plane is CLI-level, not agent-level
- Compaction is compaction-specific
- Post-send hooks clearly fire after or mid-turn after model interaction
- State management is clearly write-side