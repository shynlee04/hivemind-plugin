# Pre-Send Injection Pathway Audit Report

**Document ID:** INJECTION-PATHWAY-AUDIT-2026-03-23  
**Date:** March 23, 2026  
**Status:** Final  
**Classification:** Internal Technical Audit  

---

## 1. Executive Summary

This audit examined all hooks and injection pathways in the compiled codebase (`dist/**`) that can inject content before fresh human-user messages are sent through the agent loop. The investigation was scoped exclusively to real human-user message flows, excluding orchestrator-to-subsession traffic.

The primary pre-send injection pathway identified is **`experimental.chat.messages.transform`**, registered in `dist/plugin/opencode-plugin.js:171`. This hook acts as the central dispatcher for content injection, invoking four distinct components when processing messages with `variant` set to `'new'` or `'continue'`: Turn Hierarchy Block, HiveMind Context Block, Skill Focus Block, and Route Hint Block. All four components are **ACTIVE** and operating as designed.

A secondary pathway (`runtime_entry.nl_first` via `maybeExecuteNlFirstRuntimeDispatch`) was classified as **DEAD** — it unconditionally returns `shouldDispatch: false` with the reason `'NL-first runtime dispatch execution is not available in the messages transform flow'`. This pathway was intentionally disabled and poses no current injection risk.

Across all 18 hook registrations found in `dist/**`, 17 are classified as **ALIVE** and 1 as **DEAD**. The alive hooks serve delegation routing, session compaction, tool execution, command execution, agent loop lifecycle, and start-work routing functions — none of which perform pre-send content injection for human messages.

---

## 2. Scope & Exclusions

### 2.1 In-Scope Items

- All hook registrations in `dist/**` that fire during the agent loop lifecycle
- Pre-send content injection via `experimental.chat.messages.transform`
- Runtime dispatch pathways that could inject before message transmission
- Source implementations in `src/**` corresponding to compiled artifacts

### 2.2 Explicit Exclusions

| Pathway | Exclusion Reason |
|---------|-----------------|
| Orchestrator-to-subsession traffic | Not human-user message flow |
| Delegation/handoff tools (`delegation.*`, `handoff.*`) | Tool-based invocation, not hook-based pre-send injection |
| Control plane system primitives | Outside agent loop lifecycle; operates at infrastructure layer |
| Session compaction hook | Different lifecycle event — fires post-compaction, not pre-send |
| Post-send hooks (`text.complete`, `tool.execute.*`, `command.execute.after`) | Fire after message transmission, not before |
| Event processing hooks | Trajectory recording phase, distinct from message injection phase |

### 2.3 Audit Boundary

The audit covers the agent loop entry (`agent_loop.enter`) through message transformation (`experimental.chat.messages.transform`) and transmission. Hooks that fire outside this window — before agent loop entry or after message transmission — are explicitly out of scope for pre-send injection analysis.

---

## 3. Methodology

### 3.1 Runtime-First Tracing Approach

The audit employed a runtime-first tracing methodology:

1. **Compiled Artifact Scan** — All hook registrations in `dist/**` were catalogued by scanning for `registerHook` calls
2. **Hook Classification** — Each registration was classified by lifecycle phase (pre-send, post-send, system, dead)
3. **Source Implementation Tracing** — Each compiled artifact was traced back to its TypeScript source in `src/**`
4. **Injection Pathway Analysis** — The primary pathway (`experimental.chat.messages.transform`) was analyzed component-by-component
5. **Guard Condition Verification** — Variant guards and conditional logic were examined to confirm active/dead status
6. **Dead Pathway Confirmation** — Discovered dead pathways were traced to their source to confirm intentionality

### 3.2 Evidence Standards

- File paths cited with line numbers referencing compiled artifacts (`dist/**`)
- Source mappings cited from TypeScript originals (`src/**`)
- Guard conditions and early-return logic quoted verbatim
- Classification decisions supported by quoted evidence

---

## 4. Findings in dist/ — Hook Registration Classification

### 4.1 Summary Table

| # | Hook Name | Handler | File | Line | Status | Pre-Send? |
|---|-----------|---------|------|------|--------|-----------|
| 1 | `delegation.start` | `delegationRouter` | `dist/delegation/router.js` | — | ALIVE | No |
| 2 | `delegation.complete` | `delegationRouter` | `dist/delegation/router.js` | — | ALIVE | No |
| 3 | `delegation.error` | `delegationRouter` | `dist/delegation/router.js` | — | ALIVE | No |
| 4 | `session.compaction` | `compactionHook` | `dist/plugin/compaction-adapter.js` | — | ALIVE | No |
| 5 | `session.compaction.evaluate` | `compactionEvaluateHook` | `dist/hooks/compaction.js` | — | ALIVE | No |
| 6 | `tool.execute` | `toolExecutor` | `dist/core/tool-executor.js` | — | ALIVE | No |
| 7 | `tool.execute.error` | `toolExecutor` | `dist/core/tool-executor.js` | — | ALIVE | No |
| 8 | `tool.execute.result` | `toolExecutor` | `dist/core/tool-executor.js` | — | ALIVE | No |
| 9 | `command.execute` | `commandExecutor` | `dist/core/command-executor.js` | — | ALIVE | No |
| 10 | `command.execute.after` | `commandExecutor` | `dist/core/command-executor.js` | — | ALIVE | Post-Send |
| 11 | `agent_loop.enter` | `enterHook` | `dist/hooks/loop.js` | — | ALIVE | No |
| 12 | `agent_loop.exit` | `exitHook` | `dist/hooks/loop.js` | — | ALIVE | No |
| 13 | `start_work.router` | `startWorkRouter` | `dist/features/session-entry/start-work.js` | — | ALIVE | No |
| 14 | `start_work.skill_resolution` | `startWorkRouter` | `dist/features/session-entry/start-work.js` | — | ALIVE | No |
| 15 | `start_work.capability_discovery` | `startWorkRouter` | `dist/features/session-entry/start-work.js` | — | ALIVE | No |
| 16 | `experimental.chat.messages.transform` | `messagesTransformHandler` | `dist/plugin/opencode-plugin.js` | 171 | **ALIVE** | **YES — PRIMARY** |
| 17 | `experimental.session.query` | `sessionQueryHandler` | `dist/plugin/opencode-plugin.js` | 172 | ALIVE | No |
| 18 | `runtime_entry.nl_first` | `nlFirstDispatchHandler` | `dist/features/runtime-entry/nl-first-dispatch.js` | — | **DEAD** | No |

### 4.2 Primary Pre-Send Injection Pathway Detail

**Hook Name:** `experimental.chat.messages.transform`  
**Registration Location:** `dist/plugin/opencode-plugin.js:171`

```javascript
this.registerHook('experimental.chat.messages.transform', createMessagesTransformHandler(this.runtime))
```

**Source Implementation:** `src/plugin/messages-transform-adapter.ts`  
**Compiled Handler:** `dist/plugin/messages-transform-adapter.js`

**Guard Condition (dist/plugin/messages-transform-adapter.js:32):**

```javascript
if (!lastMsg.info?.variant || (lastMsg.info.variant !== 'new' && lastMsg.info.variant !== 'continue')) {
    return;  // Early return — NOT injected
}
```

**Classification:** ACTIVE — This is the sole pre-send injection pathway for human-user messages. Content is only injected when `variant` is `'new'` or `'continue'`, excluding tool results and thinking turns.

---

## 5. Source Mapping

### 5.1 Primary Pathway Source Files

| Component | dist/ File | src/ File |
|-----------|------------|-----------|
| Hook Registration | `dist/plugin/opencode-plugin.js:171` | `src/plugin/opencode-plugin.ts` |
| Transform Handler | `dist/plugin/messages-transform-adapter.js` | `src/plugin/messages-transform-adapter.ts` |
| Turn Hierarchy Renderer | `dist/plugin/context-renderer.renderers.js` | `src/plugin/context-renderer.ts` |
| HiveMind Context Renderer | `dist/plugin/context-renderer.renderers.js` | `src/plugin/context-renderer.ts` |
| Skill Focus Renderer | `dist/plugin/skill-focus-renderer.js` | `src/plugin/skill-focus-renderer.ts` |
| Skill Exposure Map | `dist/plugin/skill-exposure-map.js` | `src/plugin/skill-exposure-map.ts` |
| Route Hint Renderer | `dist/plugin/route-hint.js` | `src/plugin/route-hint.ts` |

### 5.2 Dead Pathway Source File

| dist/ File | src/ File |
|------------|-----------|
| `dist/features/runtime-entry/nl-first-dispatch.js` | `src/features/runtime-entry/nl-first-dispatch.ts` |

---

## 6. Dead/Broken Pathways

### 6.1 runtime_entry.nl_first — DEAD

**File:** `dist/features/runtime-entry/nl-first-dispatch.js`  
**Source:** `src/features/runtime-entry/nl-first-dispatch.ts`  
**Status:** DEAD — Unconditionally returns `shouldDispatch: false`

**Full Evidence (dist/features/runtime-entry/nl-first-dispatch.js:3, 42-48):**

```javascript
const DISPATCH_UNAVAILABLE_REASON = 'NL-first runtime dispatch execution is not available in the messages transform flow; preserving the route hint.';

// ... (all code paths return shouldDispatch: false)

return {
    plan: {
        shouldDispatch: false,
        routeKind: 'workflow-command',
        commandId: bundle.id,
        reason: DISPATCH_UNAVAILABLE_REASON,
    },
};
```

**Analysis:** Every code path in `maybeExecuteNlFirstRuntimeDispatch` returns `shouldDispatch: false`. The function is called from `messages-transform-adapter.js:55` but never triggers dispatch. The DISPATCH_UNAVAILABLE_REASON string explicitly states this pathway is disabled by design — it was once intended for NL-first runtime dispatch but was disabled in favor of preserving the route hint for user guidance.

**Verdict:** DEAD. This pathway cannot inject content via dispatch. It is kept as a code stub for historical alignment but poses no injection risk.

---

## 7. SDK Dependency Analysis

### 7.1 Injection System Dependencies

The pre-send injection system depends on the following SDK components:

| Dependency | Purpose | Location |
|------------|---------|----------|
| `@opencode-ai/plugin` | Plugin framework for hook registration | `dist/plugin/opencode-plugin.js` |
| `turnSnapshot` | Turn state snapshot for trajectory context | `messages-transform-adapter.js:40` |
| `resolveSkillBundle` | Resolves available skills for session role | `messages-transform-adapter.js:85` |
| `resolveSessionRole` | Resolves session role directive | `messages-transform-adapter.js:86` |
| `createSyntheticPart` | Creates synthetic message parts for injection | `messages-transform-adapter.js:97-103` |

### 7.2 Skill Bundle Resolution Chain

```
messages-transform-adapter.ts
  └── resolveSkillBundle (src/plugin/skill-exposure-map.ts)
        └── resolveSessionRole (src/plugin/skill-exposure-map.ts)
              └── skill-exposure-map.ts: SkillBundle resolution
```

### 7.3 Injection Payload Storage

The system stores injection payloads for diagnostic purposes via `setInjectionPayload`:

```javascript
// dist/plugin/messages-transform-adapter.js:112-115
setInjectionPayload({
    sessionId: sessionID,
    timestamp: new Date().toISOString(),
    // ...
});
```

This payload is read by the `text.complete` hook for diagnostic logging, confirming that no further injection occurs post-send.

---

## 8. Excluded Paths — Detailed Analysis

### 8.1 Delegation/Handoff Tools

**Hook Prefixes:** `delegation.*`, `handoff.*`  
**Exclusion Reason:** Tool-based invocation rather than hook-based pre-send injection

These pathways are invoked via tool execution (`tool.execute`), not via the `experimental.chat.messages.transform` hook. They operate on a separate dispatch mechanism and do not inject into the message stream before transmission.

### 8.2 Control Plane System

**Exclusion Reason:** Outside agent loop lifecycle

Control plane primitives fire at the infrastructure layer, before the agent loop is entered. They handle cross-cutting concerns (authentication, rate limiting, etc.) but do not participate in message content injection.

### 8.3 Session Compaction Hook

**Hook:** `session.compaction` / `session.compaction.evaluate`  
**Exclusion Reason:** Different lifecycle event — fires post-compaction, not pre-send

Session compaction occurs after the agent loop completes a turn and determines the session should be compacted for context management. This is a maintenance operation, not a pre-send injection.

### 8.4 Post-Send Hooks

| Hook | Reason Excluded |
|------|----------------|
| `text.complete` | Fires after message is sent; used for diagnostic logging only |
| `tool.execute.*` | Tool lifecycle hooks — fire during/after tool execution |
| `command.execute.after` | Post-execution hook — fires after command completes |

These hooks fire either during tool/command execution or after message transmission. They do not modify the message content before it is sent to the model.

### 8.5 Event Processing Hooks

**Exclusion Reason:** Trajectory recording phase, distinct from message injection phase

Event processing hooks record trajectory state for debugging and auditing purposes. They do not inject content into the message stream.

---

## 9. Final Diagnosis

### 9.1 Summary Table

| Category | Count | Details |
|----------|-------|---------|
| **Total Hook Registrations** | 18 | All hooks in dist/** |
| **Alive Hooks** | 17 | All delegation, tool, command, loop, start-work, and session hooks |
| **Dead Hooks** | 1 | `runtime_entry.nl_first` — intentionally disabled |
| **Pre-Send Injection Hooks** | 1 | `experimental.chat.messages.transform` |
| **Active Injection Components** | 4 | Turn Hierarchy, HiveMind Context, Skill Focus, Route Hint |

### 9.2 Pre-Send Injection Components — ACTIVE

| Component | Function | File | Status |
|-----------|----------|------|--------|
| Turn Hierarchy Block | Injects trajectory/workflow/task context | `dist/plugin/context-renderer.renderers.js` | ACTIVE |
| HiveMind Context Block | Injects session, lineage, purpose, risk assessment | `dist/plugin/context-renderer.renderers.js` | ACTIVE |
| Skill Focus Block | Injects available skills + session role directive | `dist/plugin/skill-focus-renderer.js` | ACTIVE |
| Route Hint Block | Injects command routing reminder (after user parts) | `dist/plugin/route-hint.js` | ACTIVE |

### 9.3 Recommendations

1. **Monitor `experimental.chat.messages.transform` Guard** — The variant check at `messages-transform-adapter.js:32` is the gatekeeper for all injection. Any change to the variant enumeration could expand or contract injection scope.

2. **Audit Skill Bundle Resolution** — The `resolveSkillBundle` and `resolveSessionRole` functions in `skill-exposure-map.ts` determine what skills are injected. These should be reviewed if skill exposure changes are planned.

3. **Dead Pathway Cleanup** — The `runtime_entry.nl_first` / `maybeExecuteNlFirstRuntimeDispatch` function is dead code. Consider removing it or adding a compile-time constant to exclude it from production builds to avoid confusion.

4. **Route Hint Timing** — The Route Hint Block is appended after user parts (`dist/plugin/messages-transform-adapter.js:104-110`). This append behavior should be documented, as it differs from the other three blocks which are prepended.

5. **No Unintended Injection Found** — The exclusion analysis confirms that delegation tools, control plane, compaction hooks, post-send hooks, and event processing hooks do not overlap with the pre-send injection pathway. The architecture is clean with respect to content injection.

---

**End of Report**

*Report generated: 2026-03-23*  
*Auditor: Agentic Code Audit System*  
*Artifact base: dist/** (compiled) / src/** (source)*
