# Live Steering Protocols for Multi-Level Agent Delegation

**Enhancing OpenCode's Orchestration Model with Non-Disruptive Session Control**

---

## Abstract

Multi-agent delegation systems face a fundamental tension: orchestrators need real-time visibility and course-correction capability, but intervention mechanisms routinely disrupt child session lifecycles, corrupt delegation state, and break continuity guarantees. This paper examines three live steering primitives available in the OpenCode ecosystem — inbox injection, system transform injection, and session-patch file mutation — and demonstrates that each carries a distinct disruption profile that must be matched to session lifecycle phase. We identify the critical architectural distinction between synchronous `prompt()` and asynchronous `promptAsync()` SDK calls as the single most consequential design decision for delegation survivability. Building on these findings, we propose a **Unified Steering Protocol (USP)** that combines status polling, message injection, system transforms, and file patching into a standardized, phase-aware control plane. We introduce a **Steering Decision Engine** that selects mechanisms based on session depth, lifecycle phase, and disruption tolerance. Finally, we formalize a **Three-Level Coordination Model** with depth semantics, prescribing two-level delegation as the default and reserving three-level hierarchies for supervisor agent counts exceeding seven. The protocol is specified with Zod schemas, TypeScript implementation patterns, and Architecture Decision Records (ADRs) suitable for direct integration into OpenCode-based harnesses.

---

## 1. Introduction

### 1.1 Problem Statement

OpenCode's delegation model enables agents to spawn child sessions that execute bounded tasks and report back. This model works well for fire-and-forget workloads but breaks down when orchestrators need to:

1. **Redirect** a child session mid-execution based on new information
2. **Inject** context or constraints discovered after dispatch
3. **Suppress** harmful behavior detected through status polling
4. **Recover** from partial failures without session termination

Current steering mechanisms exist as disconnected primitives with no standardized protocol governing their use. Engineers choose ad-hoc approaches that either under-steer (orphaned sessions producing irrelevant output) or over-steer (disrupting child lifecycles and losing accumulated context).

### 1.2 Motivation

The HiveMind V3 harness (`opencode-harness`) has identified this gap through extensive runtime operation. Five custom tools (`background`, `delegate-task`, `prompt-skim`, `prompt-analyze`, `session-patch`) and eight plugin hooks (`event`, `system.transform`, `messages.transform`, `shell.env`, `session.compacting`, `tool.execute.before`, `tool.execute.after`) provide the building blocks, but no protocol combines them into a coherent steering strategy.

### 1.3 Current Limitations

| Limitation | Impact |
|------------|--------|
| No phase-aware mechanism selection | System transforms inject during compaction, losing context |
| `prompt()` kills child sessions on parent turn end | Delegation state corruption, orphaned work |
| No standardized message format | Incompatible injection payloads across tools |
| Depth-unlimited delegation | Context explosion beyond 3 levels, budget exhaustion |
| No disruption budget tracking | Cascading failures from aggressive steering |

### 1.4 Contributions

This paper contributes:
1. A systematic analysis of three live steering mechanisms with disruption profiles
2. A Unified Steering Protocol (USP) with Zod-specified message formats
3. A Steering Decision Engine architecture with mechanism selection logic
4. A formalized Three-Level Coordination Model with depth semantics
5. Implementation patterns using OpenCode SDK surfaces
6. Architecture Decision Records (ADRs) for engineering teams

---

## 2. Background

### 2.1 OpenCode's Delegation Model

OpenCode provides a session-based execution model where each session has a unique identifier, optional parent relationship, and independent lifecycle. The SDK exposes key surfaces:

```typescript
// Session creation with parent linkage
const child = await client.session.create({
  body: { parentID: parentSessionID, title: "Research task" },
  query: { directory: projectRoot },
})

// Status polling across all sessions
const statusMap = await client.session.status()
// Returns: { [sessionID]: { type: "idle" | "busy" | "retry" } }

// Message retrieval
const messages = await client.session.messages({
  path: { id: sessionID },
  query: { limit: 50 },
})
```

The critical distinction lies in two prompt methods:

```typescript
// SYNCHRONOUS — waits for response, ties child to parent lifecycle
const response = await client.session.prompt({
  path: { id: sessionID },
  body: { messages: [{ role: "user", content: "Analyze this..." }] },
})
// ⚠️ When parent's turn ends, child session is deleted.

// ASYNCHRONOUS — returns 204 immediately, child survives independently
await client.session.promptAsync({
  path: { id: sessionID },
  body: { messages: [{ role: "user", content: "Analyze this..." }] },
})
// ✅ Child session persists beyond parent's turn boundary.
```

**ADR-001: Always Use `promptAsync()` for Background Delegation**

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Context** | Background delegation requires child sessions to survive parent turn completion. `prompt()` creates a synchronous dependency that deletes the child when the parent's turn ends. |
| **Decision** | All background delegation must use `promptAsync()`. Synchronous `prompt()` is reserved only for interactive, foreground user-facing turns where session co-termination is intentional. |
| **Consequences** | Child sessions maintain independent lifecycle. Orchestrator must poll status or await completion notifications. Slightly more complex coordination but eliminates orphaned-session data loss. |

### 2.2 HiveMind's Extensions

The HiveMind V3 harness extends OpenCode with:

- **Continuity Store**: Durable JSON persistence (`continuity.ts`) tracking session metadata, delegation lineage, and lifecycle state across restarts.
- **Lifecycle Manager**: State machine (`lifecycle-manager.ts`) managing session phases: `created → queued → dispatching → running → completed | failed`.
- **Injection Engine**: Runtime evaluation (`injection-engine.ts`) of candidate injections (skills, rules, commands, tools) based on session context, delegation route, and governance state.
- **Governance Engine**: Rule-based policy enforcement (`governance-engine.ts`) with warn/escalate/block actions scoped to `tool.execute.before`.
- **Background Manager**: Process lifecycle management for long-running delegation tasks.

### 2.3 SDK Surfaces Used for Steering

| SDK Surface | Steering Role |
|-------------|---------------|
| `client.session.status()` | Poll child session state |
| `client.session.messages()` | Inspect accumulated context |
| `client.session.promptAsync()` | Inject steering messages |
| `client.app.log()` | Structured logging of steering events |
| `client.tui.showToast()` | User-visible steering notifications |
| `permission.ask` | Gate steering-induced mutations |

---

## 3. Architecture Analysis: Current Steering Mechanisms

Three mechanisms currently exist for live steering. Each operates at a different abstraction layer and carries distinct disruption characteristics.

### 3.1 Mechanism 1: Inbox Injection (OMO Pattern)

**How it works**: Messages are appended directly to a session's message queue, appearing as if the user typed them.

```typescript
// Conceptual pattern (OpenCode internal)
await injectInboxMessage(sessionID, {
  role: "user",
  content: "Pivot: focus only on the injection engine gaps.",
  metadata: { source: "steering-protocol", turnID: currentTurn },
})
```

**Disruption profile**:
| Attribute | Value |
|-----------|-------|
| **Timing sensitivity** | Low — safe at any phase |
| **Context preservation** | High — child retains all prior state |
| **Execution interruption** | None — child processes message at next natural turn |
| **Risk** | Message may be ignored if child is deep in tool execution loop |
| **Best for** | Course corrections, priority updates, scope narrowing |

**Strengths**: Minimal disruption, natural conversational flow, no lifecycle interference.

**Weaknesses**: No guarantee of immediate processing. If the child is mid-tool-call (e.g., running tests), the message queues until the tool returns. For headless background agents with long tool chains, steering latency can exceed minutes.

### 3.2 Mechanism 2: System Transform Injection (HiveMind Pattern)

**How it works**: The `system.transform` hook intercepts system prompt construction and injects additional context. Combined with `experimental.chat.system.transform`, it can modify prompts per-turn.

```typescript
// From create-core-hooks.ts
event: (event, context) => {
  // ... lifecycle event processing
}

system.transform: async (evaluation, context) => {
  const sessionID = context.sessionID
  if (!sessionID) return
  if (!continuity) return

  const injections = evaluateInjections({
    sessionID,
    phase: "session-start",
    agent: resolvedAgent,
    category: resolvedCategory,
    delegation: delegationMeta,
    route: delegationRoute,
  })

  if (!hasAnyInjection(evaluation.injections)) return
  // Mutate evaluation.injections to add skills, rules, commands, tools
}
```

**Disruption profile**:
| Attribute | Value |
|-----------|-------|
| **Timing sensitivity** | High — only applies at session-start or compaction boundary |
| **Context preservation** | Medium — transforms system prompt but doesn't erase conversation history |
| **Execution interruption** | Medium — injected rules/skills alter agent behavior from next turn |
| **Risk** | Injecting during active execution causes behavior shift mid-task; may invalidate current work trajectory |
| **Best for** | Phase transitions, role changes, capability additions |

**Strengths**: Powerful — can add skills, commands, tools, and rules dynamically. Survives across compaction boundaries when applied at session-start phase.

**Weaknesses**: Timing-critical. If injected during `compaction` phase, the system prompt is being compressed and injections may be lost. The injection engine evaluates candidates against governance state, so blocked injections fail silently unless audit logs are checked.

### 3.3 Mechanism 3: Session-Patch File Mutation (HiveMind Pattern)

**How it works**: The `session-patch` tool writes structured patches to continuity files, which are read by hooks and the lifecycle manager on next evaluation cycle.

```typescript
// Session-patch tool writes to continuity store
await patchSession(sessionID, {
  metadata: {
    status: "redirected",
    constraints: ["focus: injection-engine only"],
    updatedAt: Date.now(),
  },
})
```

**Disruption profile**:
| Attribute | Value |
|-----------|-------|
| **Timing sensitivity** | Low — durable, survives restarts |
| **Context preservation** | High — patches augment, don't replace |
| **Execution interruption** | Low — patches are read opportunistically by hooks |
| **Risk** | Stale patches accumulate; no TTL mechanism exists |
| **Best for** | Persistent state changes, recovery metadata, cross-session continuity |

**Strengths**: Durable — patches survive session compaction and platform restarts. Integrates with continuity store for cross-session recovery.

**Weaknesses**: Eventually consistent — there's no guarantee when the patch will be read. No TTL means stale patches can mislead future sessions. Currently lacks a structured schema for patch content.

### 3.4 Mechanism Comparison Matrix

| Dimension | Inbox | System Transform | Session Patch |
|-----------|-------|-----------------|---------------|
| **Immediacy** | Medium (queued) | High (next turn) | Low (eventual) |
| **Durability** | None (in-memory) | Per-turn | High (persisted) |
| **Disruption** | Minimal | Moderate | Minimal |
| **Scope** | Single message | Full system prompt | Metadata only |
| **Governance** | None | Injection engine | Manual |
| **Phase-safe** | All phases | Session-start only | All phases |
| **Recovery** | Lost on restart | Lost on restart | Survives restart |

---

## 4. Proposed Protocol: Unified Steering Protocol (USP)

### 4.1 Design Goals

1. **Phase-aware**: Mechanism selection respects session lifecycle phase
2. **Non-disruptive**: Steering never invalidates completed child work
3. **Traceable**: Every steering event is logged and auditable
4. **Composable**: Multiple mechanisms can be combined safely
5. **Bounded**: Steering budgets prevent cascading disruption

### 4.2 Protocol Message Schema (Zod)

```typescript
import { tool } from "@opencode-ai/plugin"
const s = tool.schema

// Steering mechanism identifier
const SteeringMechanism = s.enum([
  "inbox",           // Message injection
  "system-transform", // System prompt modification
  "session-patch",   // Continuity file mutation
])

// Steering action types
const SteeringAction = s.enum([
  "redirect",        // Change task focus
  "narrow",          // Reduce scope
  "broaden",         // Expand scope
  "pause",           // Suspend execution
  "resume",          // Resume after pause
  "abort",           // Terminate with cleanup
  "inject-skill",    // Add a skill dynamically
  "inject-rule",     // Add a governance rule
])

// Core steering message
const SteeringMessage = s.object({
  sessionID: s.string().min(1).describe("Target child session"),
  mechanism: SteeringMechanism.describe("How to deliver the steering"),
  action: SteeringAction.describe("What change to apply"),
  payload: s.string().min(1).describe("Human-readable steering instruction"),
  metadata: s.object({
    turnID: s.string().optional().describe("Orchestrator turn reference"),
    parentSessionID: s.string().optional(),
    rootSessionID: s.string().optional(),
    depth: s.number().int().min(0).max(3).describe("Delegation depth level"),
    disruptionBudget: s.number().int().min(0).describe("Remaining steering budget"),
    timestamp: s.number().int().describe("Epoch milliseconds"),
  }),
})

type SteeringMessage = s.infer<typeof SteeringMessage>

// Steering response (from child or system)
const SteeringResponse = s.object({
  accepted: s.boolean().describe("Whether steering was applied"),
  mechanism: SteeringMechanism,
  appliedAt: s.number().int().describe("When steering took effect"),
  priorState: s.string().optional().describe("Child's state before steering"),
  impact: s.enum(["none", "context-shift", "work-invalidated"]).describe(
    "Effect on accumulated work"
  ),
  error: s.string().optional(),
})

type SteeringResponse = s.infer<typeof SteeringResponse>
```

### 4.3 Injection Mechanism Selection

```typescript
/**
 * Select the optimal steering mechanism based on session phase and constraints.
 *
 * @param phase     Current lifecycle phase of the target session
 * @param urgency   How quickly the steering must take effect
 * @param durability Whether steering must survive restart
 * @returns         Selected mechanism or null if steering is unsafe
 */
function selectMechanism(
  phase: SessionLifecyclePhase,
  urgency: "immediate" | "deferred",
  durability: boolean
): SteeringMechanism | null {
  // Never steer during dispatching — session state is unstable
  if (phase === "dispatching") return null

  // Session-patch for durable, deferred steering
  if (durability && urgency === "deferred") return "session-patch"

  // System-transform for immediate steering at phase boundaries
  if (urgency === "immediate" && (phase === "created" || phase === "completed")) {
    return "system-transform"
  }

  // Inbox for all other cases — safest default
  return "inbox"
}
```

### 4.4 State Tracking

Every steering event updates the continuity record:

```typescript
type SteeringEvent = {
  id: string             // `steer_${epoch}_${random}`
  sessionID: string
  mechanism: SteeringMechanism
  action: SteeringAction
  payload: string
  appliedAt: number
  impact: "none" | "context-shift" | "work-invalidated"
}

type ExtendedContinuityMetadata = SessionContinuityMetadata & {
  steeringHistory: SteeringEvent[]
  disruptionBudget: number
}
```

The continuity store appends (never overwrites) steering events, enabling full audit trails.

### 4.5 Non-Disruption Guarantees

The protocol enforces three invariants:

1. **Invariant 1 (Work Preservation)**: Steering mechanisms must never invalidate work products already committed to artifacts. If a redirect would invalidate prior work, the protocol returns `impact: "work-invalidated"` and requires explicit orchestrator confirmation.

2. **Invariant 2 (Phase Safety)**: System-transform injections are only applied during `created`, `completed`, or `compaction` phases. During `running` phase, the protocol falls back to inbox injection.

3. **Invariant 3 (Budget Exhaustion)**: Each session has a `disruptionBudget` counter (default: 5). Each steering event decrements it. At zero, only inbox messages are permitted (lowest-disruption mechanism).

---

## 5. Implementation Patterns

### 5.1 OpenCode SDK Integration

```typescript
import type { createOpencodeClient } from "@opencode-ai/sdk"

type SteeringControllerDeps = {
  client: ReturnType<typeof createOpencodeClient>
  continuityStore: ContinuityStore
  log: (msg: string, meta?: Record<string, unknown>) => void
}

export class SteeringController {
  constructor(private deps: SteeringControllerDeps) {}

  /**
   * Execute a steering operation end-to-end: select mechanism,
   * apply it, track the event, and return the response.
   */
  async steer(
    sessionID: string,
    action: SteeringAction,
    payload: string,
    opts: { urgency?: "immediate" | "deferred"; durable?: boolean } = {}
  ): Promise<SteeringResponse> {
    const { client, continuityStore, log } = this.deps
    const urgency = opts.urgency ?? "deferred"
    const durable = opts.durable ?? false

    // 1. Read session phase
    const record = continuityStore.get(sessionID)
    const phase = record?.metadata.lifecycle?.phase ?? "running"

    // 2. Select mechanism
    const mechanism = selectMechanism(phase, urgency, durable)
    if (!mechanism) {
      return {
        accepted: false,
        mechanism: "inbox",
        appliedAt: Date.now(),
        impact: "none",
        error: "No safe steering mechanism available for current phase",
      }
    }

    // 3. Apply steering based on mechanism
    let appliedAt = Date.now()
    let impact: SteeringResponse["impact"] = "none"

    switch (mechanism) {
      case "inbox": {
        // Inbox injection — message appears as user input
        await client.session.promptAsync({
          path: { id: sessionID },
          body: { messages: [{ role: "user", content: payload }] },
        })
        impact = "context-shift"
        break
      }

      case "system-transform": {
        // Update continuity metadata — hooks will pick it up at next phase boundary
        continuityStore.update(sessionID, (meta) => ({
          ...meta,
          constraints: [...(meta.constraints ?? []), payload],
          updatedAt: Date.now(),
        }))
        impact = "context-shift"
        break
      }

      case "session-patch": {
        // Patch continuity file directly
        continuityStore.patch(sessionID, {
          metadata: {
            steeringHistory: [
              ...(record?.metadata.steeringHistory ?? []),
              {
                id: `steer_${Date.now()}`,
                sessionID,
                mechanism,
                action,
                payload,
                appliedAt,
                impact,
              },
            ],
          },
        })
        break
      }
    }

    // 4. Log the steering event
    log(`Steering applied: ${action}`, {
      sessionID,
      mechanism,
      phase,
      impact,
    })

    // 5. Emit user notification if disruption is significant
    if (impact === "work-invalidated") {
      client.app.log("[Steering] Work invalidation detected", { sessionID, action })
    }

    return {
      accepted: true,
      mechanism,
      appliedAt,
      impact,
    }
  }
}
```

### 5.2 HiveMind Tool Integration

The `session-patch` tool serves as the primary steering interface for agents:

```typescript
// From tools/session-patch/index.ts
import { tool } from "@opencode-ai/plugin"
const s = tool.schema

export function createSessionPatchTool(cwd: string) {
  return tool({
    description: "Patch session continuity metadata for steering and recovery",
    args: {
      sessionID: s.string().describe("Target session to patch"),
      action: s.enum(["redirect", "narrow", "broaden", "pause", "resume", "abort"]),
      payload: s.string().describe("Steering instruction or state update"),
    },
    async execute(args, context) {
      const patch = {
        action: args.action,
        payload: args.payload,
        appliedAt: Date.now(),
        appliedBy: context.agent,
      }

      // Write to continuity store
      // Hooks will observe and act on the patch
      return JSON.stringify({ status: "applied", patch })
    },
  })
}
```

### 5.3 Governance-Governed Steering

The governance engine can block steering actions that violate policies:

```typescript
// Governance rule: prevent abort of deep delegation without parent confirmation
mutateGovernanceRule({
  type: "upsert",
  source: "steering-protocol",
  rule: {
    id: "steering-abort-gate",
    scope: "tool.execute.before",
    condition: {
      toolNames: ["session-patch"],
    },
    action: {
      type: "escalate",
      message: "Abort steering requires parent session confirmation",
      escalation: {
        channel: "parent",
        severity: "high",
      },
    },
  },
})
```

---

## 6. Three-Level Coordination Model

### 6.1 Depth Semantics

HiveMind enforces `MAX_DESCENDANTS_PER_ROOT = 10` and `MAX_DEPTH = 3`. However, research through extensive delegation packet analysis reveals that the optimal depth depends on agent count, not capability.

| Depth | Name | When to Use | Disruption Risk |
|-------|------|-------------|-----------------|
| **1** | Direct | Single specialist task | None |
| **2** | Coordinated | 2-7 parallel specialists | Low — single parent can track all children |
| **3** | Supervised | 7+ specialists requiring mid-tier supervisors | Medium — grandparent has indirect visibility |

### 6.2 The Supervisor Count Heuristic

**Rule**: Use depth-2 delegation when the orchestrator manages ≤7 direct children. Escalate to depth-3 only when the number of *supervisor agents* (not leaf workers) exceeds 7.

**Rationale**:
- At depth-2, the orchestrator has direct status visibility into all children via `client.session.status()`.
- At depth-3, the orchestrator only sees mid-tier supervisors. Leaf worker status must be relayed, adding latency and failure modes.
- The number 7 derives from cognitive load research (Miller's Law) and is validated by HiveMind's `MAX_DESCENDANTS_PER_ROOT = 10` with margin for failure recovery.

### 6.3 Depth-3 Architecture

When depth-3 is warranted:

```
Root Orchestrator (depth 0)
  ├── Supervisor A (depth 1) — manages domain X
  │     ├── Worker A1 (depth 2)
  │     ├── Worker A2 (depth 2)
  │     └── Worker A3 (depth 2)
  ├── Supervisor B (depth 1) — manages domain Y
  │     ├── Worker B1 (depth 2)
  │     └── Worker B2 (depth 2)
  └── Supervisor C (depth 1) — manages domain Z
        └── Worker C1 (depth 2)
```

**Critical**: All steering to depth-2 workers flows through their depth-1 supervisor. Direct root-to-worker steering breaks the supervision chain and causes state divergence.

**ADR-002: Steering Flow in Depth-3 Hierarchies**

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Context** | In three-level delegation, direct root-to-leaf steering creates state divergence: the mid-tier supervisor's mental model of the child's task diverges from the child's actual task after root steering. |
| **Decision** | All steering to depth-2 workers must flow through their depth-1 supervisor. The root sends steering messages to the supervisor, which relays (and optionally adapts) them to the leaf worker. Exception: emergency abort (disruption budget = 0) may bypass the chain. |
| **Consequences** | Steering latency increases by one hop but supervision chain remains consistent. Supervisors must implement relay logic. Emergency abort provides safety valve. |

---

## 7. Live Steering Mechanisms: Detailed Comparison

### 7.1 Disruption Budget Framework

Each steering mechanism consumes budget based on its disruption level:

| Mechanism | Budget Cost | Rationale |
|-----------|-------------|-----------|
| Inbox injection | 1 | Minimal — message queues naturally |
| System transform (session-start) | 2 | Moderate — changes agent capabilities |
| System transform (running) | 4 | High — mid-execution behavior change |
| Session patch | 1 | Minimal — eventual consistency |
| Emergency abort | 5 (full budget) | Maximum — terminates all work |

### 7.2 Mechanism Selection Decision Tree

```
Is session in 'dispatching' phase?
  ├─ Yes → DEFER steering (no safe mechanism)
  └─ No
       │
       ▼
Is durability required (must survive restart)?
  ├─ Yes → SESSION-PATCH
  └─ No
       │
       ▼
Is immediate effect required?
  ├─ Yes
  │    │
  │    ▼
  │  Is session in phase boundary (created/completed/compacting)?
  │    ├─ Yes → SYSTEM-TRANSFORM
  │    └─ No → INBOX (fallback — system-transform unsafe during running)
  │
  └─ No (deferred is acceptable)
       │
       ▼
     INBOX (safest default for non-urgent steering)
```

---

## 8. Steering Decision Engine

### 8.1 Architecture

The Steering Decision Engine (SDE) is a stateless function that takes session context and returns a steering plan. It sits between the orchestrator's intent and the mechanism execution layer.

```
┌─────────────────────────────────────────────────────────┐
│                    Orchestrator Intent                    │
│  "Narrow Worker A3 to focus on injection-engine gaps"    │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              Steering Decision Engine                    │
│                                                          │
│  1. Read session context (phase, depth, budget)          │
│  2. Evaluate governance rules                            │
│  3. Select mechanism via decision tree                   │
│  4. Build steering message (Zod-validated)               │
│  5. Return plan { mechanism, message, expectedImpact }   │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                  Mechanism Executor                      │
│                                                          │
│  ┌──────────┐  ┌──────────────────┐  ┌───────────────┐  │
│  │  Inbox   │  │ System-Transform │  │ Session-Patch │  │
│  │ Injector │  │    Injector      │  │   Mutator     │  │
│  └────┬─────┘  └────────┬─────────┘  └──────┬────────┘  │
│       │                 │                    │            │
│       ▼                 ▼                    ▼            │
│  client.session   continuity.store    continuity.patch   │
│  .promptAsync()   system.transform    file mutation      │
└─────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│               Response Collector                         │
│                                                          │
│  - Poll status until change detected                     │
│  - Verify steering applied (impact assessment)           │
│  - Update disruption budget                              │
│  - Log steering event to continuity                      │
└─────────────────────────────────────────────────────────┘
```

### 8.2 Decision Engine Implementation

```typescript
type SDEContext = {
  sessionID: string
  phase: SessionLifecyclePhase
  depth: number
  disruptionBudget: number
  governanceRules: GovernanceRule[]
  urgency: "immediate" | "deferred"
  durabilityRequired: boolean
}

type SteeringPlan = {
  mechanism: SteeringMechanism
  message: SteeringMessage
  expectedImpact: "none" | "context-shift" | "work-invalidated"
  governanceBlocked: boolean
  governanceReason?: string
}

/**
 * Steering Decision Engine — pure function from context to plan.
 */
export function decideSteering(
  context: SDEContext,
  action: SteeringAction,
  payload: string
): SteeringPlan {
  // 1. Check governance
  const govResult = evaluateGovernance({
    scope: "tool.execute.before",
    sessionID: context.sessionID,
    toolName: action,
  })

  if (govResult.blocks.length > 0) {
    return {
      mechanism: "inbox",
      message: { /* ... */ } as SteeringMessage,
      expectedImpact: "none",
      governanceBlocked: true,
      governanceReason: govResult.blocks.map(b => b.message).join("; "),
    }
  }

  // 2. Select mechanism
  const mechanism = selectMechanism(
    context.phase,
    context.urgency,
    context.durabilityRequired
  )

  if (!mechanism) {
    return {
      mechanism: "inbox",
      message: { /* ... */ } as SteeringMessage,
      expectedImpact: "none",
      governanceBlocked: true,
      governanceReason: "No safe mechanism available for current phase",
    }
  }

  // 3. Assess impact
  let impact: SteeringPlan["expectedImpact"] = "context-shift"
  if (action === "abort") impact = "work-invalidated"
  if (action === "redirect" && context.phase === "running") impact = "work-invalidated"
  if (action === "narrow" || action === "broaden") impact = "context-shift"

  // 4. Build message
  const message: SteeringMessage = {
    sessionID: context.sessionID,
    mechanism,
    action,
    payload,
    metadata: {
      depth: context.depth,
      disruptionBudget: context.disruptionBudget,
      timestamp: Date.now(),
    },
  }

  return {
    mechanism,
    message,
    expectedImpact: impact,
    governanceBlocked: false,
  }
}
```

### 8.3 Decision Flow for Depth-3 Hierarchies

```
Orchestrator wants to steer Worker A3 (depth 2)
                    │
                    ▼
        Is Worker A3 directly visible?
        (i.e., is orchestrator the parent?)
                    │
          ┌─────────┴─────────┐
          │                   │
         Yes                 No
          │                   │
          ▼                   ▼
    Direct steering    Find supervisor
    via SDE            (Supervisor A)
                            │
                            ▼
                     Steer Supervisor A:
                     "Relay to A3: narrow to
                      injection-engine gaps"
                            │
                            ▼
                     Supervisor A relays
                     via its own SDE instance
```

---

## 9. Edge Cases: Permissions, Tool Conflicts, and Multi-Actor Interference

The steering protocol operates within a complex ecosystem where multiple actors — built-in agents, subagents, user-defined skills, custom tools, plugin hooks, MCP servers, and permission rules — all compete to read, write, and mutate session state. This section analyzes the failure modes that arise when these actors intersect with steering, and proposes protocol extensions to handle them.

### 9.1 The Permission Matrix: Actors × Surfaces × Mutations

Every steering action traverses a matrix of permission surfaces. A single steering event may touch:

| Surface | Actor | Permission Key | Mutation Type |
|---------|-------|---------------|---------------|
| **Built-in Agents** | Build, Plan, General, Explore | `task`, `edit`, `bash` | Read/write files, run commands, launch subagents |
| **User-Defined Agents** | `opencode.json` agents, `.opencode/agents/*.md` | `permission` (per-agent) | Custom tool access, model overrides, prompt injection |
| **Skills** | `SKILL.md` files across 6 discovery paths | `skill` | Load instructions, modify agent behavior |
| **Built-in Tools** | `edit`, `write`, `bash`, `read`, `grep`, `glob`, `list`, `lsp`, `patch`, `skill`, `todowrite`, `webfetch`, `websearch`, `question` | Per-tool permission keys | File I/O, search, network, user interaction |
| **Custom Tools** | `.opencode/tools/*.ts`, plugins | Tool name (may shadow built-ins) | Arbitrary code execution, state mutation |
| **Plugin Hooks** | `tool.execute.before/after`, `system.transform`, `messages.transform`, `session.compacting`, `event`, `permission.ask` | Hook scope | Read-only interception or state mutation |
| **MCP Servers** | User-configured local/remote MCP servers | `mcp_*` glob patterns | External API calls, database queries, third-party state |
| **Permissions** | Global + per-agent rules | `edit`, `bash`, `skill`, `task`, `question`, `external_directory`, `doom_loop` | Allow/deny/ask gating |

**The Conflict**: When steering injects a message, skill, or rule, any of these actors may:
1. **Block** it (permission = `"deny"`)
2. **Delay** it (permission = `"ask"` — user must approve)
3. **Override** it (custom tool shadows built-in, plugin hook intercepts)
4. **Ignore** it (skill disabled for agent, MCP server disabled)
5. **Corrupt** it (multiple actors mutate same state concurrently)

### 9.2 The `permission.ask` Edge Case: YOLO vs. Approval Gates

The protocol currently states:

> | `permission.ask` | Gate steering-induced mutations |

This assumes the user has approval gates enabled. However, two realities break this assumption:

#### 9.2.1 YOLO Mode: No Approval Gates

Many users run OpenCode with all permissions set to `"allow"`:

```jsonc
{
  "permission": "allow"  // YOLO mode — everything runs without approval
}
```

In this mode, `permission.ask` never fires. Steering actions execute immediately with no human oversight. This creates a **silent disruption risk**: a steering message like `"abort and switch to database migration"` executes instantly, potentially invalidating hours of accumulated work without any checkpoint or recovery path.

**Protocol Extension — YOLO-Aware Steering**:

```typescript
type PermissionMode = "yolo" | "ask" | "deny"

async function detectPermissionMode(): Promise<PermissionMode> {
  const config = await client.config.get()
  const perm = config.data?.permission

  if (perm === "allow" || perm?.["*"] === "allow") return "yolo"
  if (perm === "deny" || perm?.["*"] === "deny") return "deny"
  return "ask"
}

// Adjust steering based on mode
function yoloAwareSteer(mode: PermissionMode, action: SteeringAction) {
  if (mode === "yolo" && action === "abort") {
    // In YOLO mode, abort is dangerous — no approval gate exists
    // Fall back to "pause" + "redirect" instead of hard abort
    return { action: "pause" as const, followUp: "redirect" }
  }
  return { action }
}
```

**Design Principle**: In YOLO mode, the protocol must be **more conservative**, not less. Without human approval gates, the protocol itself becomes the safety net. Destructive actions (`abort`, `redirect` during active work) should be downgraded to non-destructive equivalents (`pause`, `narrow`).

#### 9.2.2 The Approval Hang Problem

When `permission.ask` is active, steering actions wait for user approval. If the user is absent (e.g., background delegation overnight), the session hangs indefinitely.

**Protocol Extension — Timed Permission Escalation**:

```typescript
type TimedPermissionResult =
  | { status: "approved" }
  | { status: "denied" }
  | { status: "timeout"; fallbackAction: "pause" | "proceed" | "inbox-fallback" }

async function askWithTimeout(
  action: SteeringAction,
  timeoutMs: number = 300_000, // 5 minutes
  fallback: TimedPermissionResult["fallbackAction"] = "inbox-fallback"
): Promise<TimedPermissionResult> {
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    const status = await checkPermissionStatus()
    if (status === "approved") return { status: "approved" }
    if (status === "denied") return { status: "denied" }
    await sleep(2000) // Poll every 2s
  }

  // Timeout — apply fallback
  return { status: "timeout", fallbackAction: fallback }
}
```

**Fallback Strategy**:
| Fallback | When to Use | Effect |
|----------|-------------|--------|
| `pause` | High-risk steering (abort, redirect) | Session pauses until user returns |
| `proceed` | Low-risk steering (narrow, broaden) | Action executes without approval after timeout |
| `inbox-fallback` | System-transform or session-patch blocked | Degrades to inbox injection (lowest disruption) |

### 9.3 The `question` Tool: A Superior Alternative to `permission.ask` for Steering

The `question` tool allows agents to ask the user multi-choice or single-choice questions with adjustable timeouts. This is more expressive than binary `permission.ask` (allow/deny) and provides better UX for steering decisions.

#### 9.3.1 Design: Steering Questions with Multiple Options

Instead of `"Do you allow this steering action?"` (binary), the protocol uses:

```typescript
import { tool } from "@opencode-ai/plugin"
const s = tool.schema

const SteeringQuestion = s.object({
  question: s.string().describe("What should we do?"),
  header: s.string().describe("Steering context label"),
  options: s.array(s.object({
    label: s.string(),       // "Narrow scope", "Continue as-is", "Abort and pivot"
    description: s.string(), // Explains trade-offs
    action: s.enum(["narrow", "continue", "abort-pivot", "pause"]),
  })).min(2).max(4),
  timeout: s.number().default(60).describe("Auto-select best option after N seconds"),
})

type SteeringQuestion = s.infer<typeof SteeringQuestion>
```

**Example Question**:

```typescript
{
  question: "Worker A3 has spent 45 minutes on injection-engine tests. New findings suggest the lifecycle-manager is the actual bottleneck. How should we proceed?",
  header: "Steering Decision",
  options: [
    {
      label: "Narrow scope (Recommended)",
      description: "Redirect A3 to lifecycle-manager. Injection-engine work is preserved but paused.",
      action: "narrow",
    },
    {
      label: "Continue as-is",
      description: "Let A3 finish injection-engine work. We'll address lifecycle-manager in the next turn.",
      action: "continue",
    },
    {
      label: "Abort and pivot",
      description: "Stop A3's current work entirely. Start fresh on lifecycle-manager. Loses 45 min of work.",
      action: "abort-pivot",
    },
  ],
  timeout: 120, // 2 minutes
}
```

#### 9.3.2 Auto-Selection with Best-Choice Heuristics

When the timeout expires without user response, the protocol selects the **least disruptive** option:

```typescript
function selectDefaultOption(options: SteeringQuestion["options"]): number {
  // Score each option by disruption level (lower = safer)
  const disruptionScores: Record<string, number> = {
    "continue": 0,   // No change
    "narrow": 1,     // Reduces scope, preserves partial work
    "pause": 2,      // Suspends but doesn't discard
    "broaden": 2,    // Expands scope, may dilute focus
    "abort-pivot": 4, // Destroys accumulated work
  }

  let bestIndex = 0
  let bestScore = Infinity

  for (let i = 0; i < options.length; i++) {
    const score = disruptionScores[options[i].action] ?? 3
    if (score < bestScore) {
      bestScore = score
      bestIndex = i
    }
  }

  return bestIndex // Index of least disruptive option
}
```

#### 9.3.3 Integration with Steering Decision Engine

The SDE now has a fourth mechanism option:

```typescript
const SteeringMechanism = s.enum([
  "inbox",
  "system-transform",
  "session-patch",
  "question",  // NEW: User-facing steering question with auto-selection
])

// In decideSteering():
if (action === "redirect" || action === "abort") {
  // High-impact actions benefit from user input
  // But only if permission mode isn't "yolo" (no approval infrastructure)
  const permMode = await detectPermissionMode()
  if (permMode !== "yolo") {
    return {
      mechanism: "question",
      message: buildSteeringQuestion(context, action, payload),
      expectedImpact: impact,
      governanceBlocked: false,
    }
  }
  // Fallback to inbox for YOLO mode
  return { mechanism: "inbox", message: ..., expectedImpact: impact }
}
```

### 9.4 Tool Conflict Resolution: Built-in vs. Custom vs. Plugin vs. MCP

When multiple tool definitions compete for the same name, the steering protocol must know which actor's tool is actually executing.

#### 9.4.1 Precedence Rules (from OpenCode platform reference)

| Conflict Type | Winner | Rationale |
|--------------|--------|-----------|
| Custom tool vs. built-in tool (same name) | **Custom tool** | Custom tools override built-ins by design |
| Plugin tool vs. built-in tool (same name) | **Plugin tool** | Plugin tools take precedence |
| MCP tool vs. built-in tool (same name) | **MCP tool** | MCP tools registered with server name prefix, but if shadowed, MCP wins |
| Multiple custom tools (same name, different files) | **Last loaded** | Load order determines winner |
| Agent permission denies tool | **Tool removed** | `permission.task` with `"deny"` removes tool from Task tool description entirely |

#### 9.4.2 Steering Impact: Which Tool Actually Runs?

When the protocol sends a steering message like `"run the session-patch tool"`, the actual execution depends on:

```
Steering Intent: "session-patch"
         │
         ▼
  Is there a custom tool named "session-patch"?
  ├─ Yes → Custom tool runs (may have different behavior than expected)
  └─ No
       │
       ▼
  Is there a plugin tool named "session-patch"?
  ├─ Yes → Plugin tool runs
  └─ No
       │
       ▼
  Is "session-patch" a built-in tool?
  ├─ Yes → Built-in runs
  └─ No → Steering FAILS silently (tool not found)
```

**Protocol Extension — Tool Resolution Verification**:

Before applying steering that depends on a specific tool, the protocol verifies tool identity:

```typescript
async function verifyToolIdentity(
  toolName: string,
  sessionID: string
): Promise<{ exists: boolean; source: "custom" | "plugin" | "builtin" | "mcp"; shadowed: boolean }> {
  const tools = await client.tool.ids()
  const allTools = tools.data ?? []

  const matches = allTools.filter(t => t.name === toolName || t.name.endsWith(`_${toolName}`))

  if (matches.length === 0) return { exists: false, source: "builtin", shadowed: false }

  // Multiple matches = shadowing detected
  const primary = matches[0]
  const isShadowed = matches.length > 1

  if (primary.name.includes("mcp_")) return { exists: true, source: "mcp", shadowed: isShadowed }
  if (primary.source === "plugin") return { exists: true, source: "plugin", shadowed: isShadowed }
  if (primary.source === "custom") return { exists: true, source: "custom", shadowed: isShadowed }

  return { exists: true, source: "builtin", shadowed: isShadowed }
}
```

**Steering Behavior on Shadow Detection**:
| Scenario | Protocol Action |
|----------|----------------|
| Tool doesn't exist | Log warning, fall back to inbox injection |
| Tool is shadowed (multiple definitions) | Log audit event, use primary definition, warn orchestrator |
| Tool source doesn't match expected source | Degrade to session-patch (file-level mutation, bypasses tool layer) |

### 9.5 Plugin Hook Interference: The Soft Interceptor Pattern

Plugin hooks act as **soft interceptors** that can modify, block, or amplify steering actions. The protocol must account for hook execution order and mutation semantics.

#### 9.5.1 Hook Execution Order and Steering Impact

| Hook | Phase | Steering Impact | Mutation Capability |
|------|-------|----------------|-------------------|
| `tool.execute.before` | Pre-execution | Can transform tool args, block execution | Write-side (mutates `output.args`) |
| `tool.execute.after` | Post-execution | Can observe results, inject follow-up actions | Read-side only (observe) |
| `system.transform` | Session start / compaction | Can inject skills, rules, tools into system prompt | Write-side (mutates `evaluation.injections`) |
| `messages.transform` | Message history processing | Can modify message content before LLM sees it | Write-side (mutates message history) |
| `session.compacting` | Context compression | Can inject context into compaction prompt | Write-side (mutates `output.prompt` or `output.context`) |
| `permission.ask` | Pre-mutation approval | Can gate or allow steering actions | Write-side (mutates approval decision) |
| `event` | All lifecycle events | Can observe and react to steering events | Read-side (publish notifications) |

#### 9.5.2 The Hook Conflict Scenario

**Scenario**: A steering action uses `session-patch` to redirect a worker. Three hooks fire:

1. **Hook A** (`tool.execute.before`): Transforms the patch args to add a timestamp
2. **Hook B** (`system.transform`): Injects a new skill based on the patch content
3. **Hook C** (`messages.transform`): Modifies the message history to remove the steering context

**Result**: The patch is applied, a skill is injected, but the message history no longer shows why the steering happened. The child session has no record of the steering event — creating an **audit gap**.

**Protocol Extension — Hook-Aware Steering**:

```typescript
type HookImpact = {
  hookName: string
  mutationType: "transform" | "block" | "amplify" | "observe"
  auditPreserved: boolean
}

async function assessHookImpact(
  sessionID: string,
  steeringAction: SteeringAction
): Promise<HookImpact[]> {
  const hooks = await getActiveHooks(sessionID)
  const impacts: HookImpact[] = []

  for (const hook of hooks) {
    if (hook.name === "tool.execute.before") {
      impacts.push({
        hookName: hook.name,
        mutationType: "transform",
        auditPreserved: hook.preservesAudit ?? true, // Default: assume preserved
      })
    }
    if (hook.name === "messages.transform") {
      impacts.push({
        hookName: hook.name,
        mutationType: "transform",
        auditPreserved: false, // Message transforms can erase audit trail
      })
    }
    // ... assess other hooks
  }

  return impacts
}

// Before applying steering, check if audit trail will be preserved
function isSteeringAuditSafe(impacts: HookImpact[]): boolean {
  const auditErasers = impacts.filter(i => !i.auditPreserved)
  return auditErasers.length === 0
}
```

**If audit is not preserved**, the protocol writes a **parallel audit record** to the continuity store:

```typescript
// Parallel audit: write steering event to continuity even if message history is modified
async function writeParallelAuditRecord(
  sessionID: string,
  steeringAction: SteeringAction,
  hookImpacts: HookImpact[]
) {
  await continuityStore.append(sessionID, {
    type: "steering-audit",
    action: steeringAction,
    appliedAt: Date.now(),
    hooksFired: hookImpacts.map(h => h.hookName),
    auditGap: !isSteeringAuditSafe(hookImpacts),
  })
}
```

### 9.6 MCP Server Variance: User-Configured vs. Harness-Managed

Users may have MCP servers that HiveMind doesn't know about. These external tools can:
1. **Consume steering-related state** (e.g., a database MCP server reads continuity files)
2. **Produce steering-adjacent effects** (e.g., a GitHub MCP server creates issues based on session state)
3. **Interfere with steering** (e.g., a Sentry MCP server errors out, causing the session to retry and lose steering context)

**Protocol Extension — MCP-Aware Steering**:

```typescript
async function getMCPRiskProfile(sessionID: string): Promise<{ highRisk: string[]; lowRisk: string[] }> {
  const mcpStatus = await client.mcp.get()
  const highRisk = ["database", "filesystem", "session-store"] // MCP servers that read/write state
  const lowRisk = ["search", "docs", "code-examples"] // Read-only, non-stateful MCPs

  const activeServers = Object.keys(mcpStatus.data ?? {}).filter(name => mcpStatus.data[name].enabled)

  return {
    highRisk: activeServers.filter(s => highRisk.some(hr => s.includes(hr))),
    lowRisk: activeServers.filter(s => lowRisk.some(lr => s.includes(lr))),
  }
}

// Adjust steering based on MCP risk
function mcpAwareSteer(risk: { highRisk: string[] }, action: SteeringAction) {
  if (risk.highRisk.length > 0 && action === "redirect") {
    // High-risk MCPs may have in-flight operations tied to current task
    // Add a "complete current MCP operation" step before redirect
    return {
      action: "pause",
      postPause: "complete-mcp-operations",
      then: "redirect",
    }
  }
  return { action }
}
```

### 9.7 The "Soft Interceptor" Pipeline: Putting It All Together

All the edge cases above converge into a **Soft Interceptor Pipeline** that every steering action must traverse:

```
Steering Intent
       │
       ▼
┌──────────────────────────────────────┐
│  1. Permission Mode Detection        │
│     YOLO → Conservative downgrade    │
│     Ask  → Timed approval + fallback │
│     Deny → Block immediately         │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│  2. Tool Resolution Verification     │
│     Is the expected tool available?  │
│     Is it shadowed?                  │
│     Fail → Fall back to inbox        │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│  3. Hook Impact Assessment           │
│     Which hooks fire?                │
│     Is audit trail preserved?        │
│     No → Write parallel audit record │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│  4. MCP Risk Profiling               │
│     High-risk MCPs active?           │
│     Yes → Pause + complete MCP ops   │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│  5. User Question (Optional)         │
│     Present multi-choice options     │
│     Timeout → Auto-select safest     │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│  6. Mechanism Selection & Execution  │
│     Inbox / Transform / Patch        │
│     Apply steering                   │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│  7. Post-Steering Verification       │
│     Poll status until change detected│
│     Update disruption budget         │
│     Log to continuity store          │
└──────────────────────────────────────┘
```

**Key Invariants of the Pipeline**:
1. **No step mutates session state except Step 6** (Steps 1-5 are read-only assessment)
2. **Any step can abort** the pipeline and return `{ accepted: false, reason: string }`
3. **Step 5 (User Question) is optional** — only triggered for high-impact actions (`redirect`, `abort`)
4. **Step 7 always runs** — even if steering fails, the attempt is logged

### 9.8 ADR-004: YOLO-Aware Steering Requires Conservative Downgrades

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Context** | When users run with `"permission": "allow"` (YOLO mode), there are no approval gates to catch destructive steering actions. The protocol itself must act as the safety net. |
| **Decision** | In YOLO mode, destructive actions (`abort`, `redirect` during active work) are downgraded to non-destructive equivalents (`pause`, `narrow`). The `question` tool is used for high-impact decisions even in YOLO mode, with auto-selection of the safest option on timeout. |
| **Consequences** | YOLO users experience slightly slower steering (extra verification steps) but avoid catastrophic work loss. The protocol logs a warning each time it downgrades an action, making the user aware of the risk. |

### 9.9 ADR-005: The `question` Tool Replaces Binary `permission.ask` for Steering Decisions

| Field | Value |
|-------|-------|
| **Status** | Proposed |
| **Context** | `permission.ask` is binary (allow/deny), which doesn't capture the nuanced decisions steering requires. The `question` tool supports multi-choice options with descriptions, timeouts, and auto-selection. |
| **Decision** | For high-impact steering actions (`redirect`, `abort`, `inject-skill`), use the `question` tool instead of `permission.ask`. Present 2-4 options with trade-off descriptions. Auto-select the least disruptive option on timeout. |
| **Consequences** | Better UX — users understand the implications of each choice. Timeout-based auto-selection prevents hanging sessions. However, this requires the `question` tool to be enabled (it's disabled for subagents by default). A protocol-level override may be needed to enable it for steering orchestrators. |

---

## 10. Evaluation Criteria

To measure the protocol's effectiveness, we propose these metrics:

### 10.1 Steering Latency

**Definition**: Time from steering intent to measurable effect in child session behavior.

| Mechanism | Expected Latency | Measurement |
|-----------|-----------------|-------------|
| Inbox | 10s-120s (tool execution dependent) | Message timestamp → next tool call with new context |
| System Transform | 0-5s (next turn boundary) | Hook execution → system prompt change confirmed |
| Session Patch | 30s-∞ (eventual) | Patch write → hook read latency |

### 10.2 Disruption Rate

**Definition**: Percentage of steering events that invalidate accumulated child work.

```
Disruption Rate = (steering events with impact="work-invalidated") / (total steering events)
```

Target: <5% for production systems.

### 10.3 Budget Exhaustion Rate

**Definition**: Percentage of sessions that exhaust their disruption budget.

```
Exhaustion Rate = (sessions with budget=0) / (total active sessions)
```

Target: <2%. High rates indicate over-steering or incorrect initial budgets.

### 10.4 Mechanism Appropriateness

**Definition**: Percentage of steering events where the selected mechanism matches the decision tree output.

```
Appropriateness = (correct mechanism selections) / (total steering events)
```

Target: >95%. Deviations should be logged as protocol violations.

### 10.5 Depth-3 Steering Consistency

**Definition**: Percentage of depth-2 steering events that flow through the supervisor chain.

```
Consistency = (supervisor-relayed steering) / (total depth-2 steering events)
```

Target: >98%. Direct root-to-leaf steering (excluding emergency aborts) is a protocol violation.

### 10.6 Pipeline Pass Rate

**Definition**: Percentage of steering events that successfully traverse the Soft Interceptor Pipeline (Section 9.7) without abort.

```
Pipeline Pass Rate = (steering events completing all 7 pipeline steps) / (total steering attempts)
```

Target: >90%. Failures should be categorized by abort stage (permission, tool, hook, MCP, or execution).

### 10.7 Question Tool Engagement Rate

**Definition**: Percentage of `question`-based steering interactions where the user actively selects an option (vs. timeout auto-selection).

```
Engagement Rate = (user-selected options) / (total question-based steering events)
```

Target: >60%. Low rates suggest timeouts are too short or questions are poorly framed.

---

## 11. Limitations and Future Work

### 11.1 Current Limitations

1. **No TTL for session patches**: Stale patches accumulate in continuity files with no automatic cleanup. A TTL mechanism with expiration timestamps is needed.

2. **Steering during compaction**: The compaction phase compresses message history. Steering messages injected during compaction may be lost or compressed away. The protocol currently defers all steering during compaction, which creates blind spots.

3. **Single-platform scope**: The protocol is designed for OpenCode's session model. Extending to other platforms (Claude Code, Cursor) requires mapping their session abstractions to the USP model.

4. **No multi-cast steering**: Steering a group of sibling sessions requires individual calls. A multicast primitive would reduce orchestrator overhead for broadcast-style updates.

5. **Governance engine scope**: Currently limited to `tool.execute.before`. Steering-specific scopes (e.g., `steering.before`) would enable finer-grained policy control.

### 11.2 Future Work

1. **Adaptive disruption budgets**: Instead of fixed budgets, use ML-based prediction of steering necessity based on session trajectory and task complexity.

2. **Steering replay**: A replay mechanism that can reapply steering sequences to recovered or forked sessions.

3. **Cross-platform protocol adapter**: A translation layer that maps USP messages to platform-specific steering primitives.

4. **Steering conflict detection**: When multiple orchestrators (or the same orchestrator at different turns) issue conflicting steering commands, a conflict resolution protocol is needed.

5. **Formal verification**: Model the steering protocol as a state machine and verify invariants (work preservation, phase safety, budget exhaustion) using formal methods.

6. **Hook audit declaration**: A convention where plugin hooks declare `preservesAudit: boolean` in their metadata, enabling the protocol to accurately assess audit gap risk.

7. **Question tool for subagents**: Enable the `question` tool for steering orchestrator agents (it's disabled for subagents by default) via protocol-level permission override.

---

## 12. Conclusion

Live steering is the missing primitive that transforms OpenCode's delegation model from fire-and-forget into a truly interactive orchestration system. This paper has shown that three existing mechanisms — inbox injection, system transform, and session patch — each serve distinct roles in the steering spectrum, and that a unified protocol combining them with phase-aware selection, governance gates, and disruption budgets provides a practical path forward.

The critical architectural insight is that `promptAsync()` (not `prompt()`) is the foundation for all background delegation — a single design decision that determines whether child sessions survive parent turn completion or are silently terminated. Building on this foundation, the Steering Decision Engine provides a pure-function interface for mechanism selection, while the Three-Level Coordination Model formalizes when depth-3 delegation is warranted (supervisor count > 7) and how steering must flow through supervision chains.

The protocol is implementable today using OpenCode's SDK surfaces (`client.session.*`, `client.app.log()`, `permission.ask`), HiveMind's continuity store and injection engine, and the governance framework for policy enforcement. We provide Zod schemas, TypeScript implementations, and Architecture Decision Records ready for integration.

For engineering teams building multi-agent systems on OpenCode, this protocol provides the missing control plane: the ability to guide, correct, and recover from delegation in real time without disrupting the very sessions that do the work.

---

## 13. References

### Primary Sources

1. **HiveMind V3 Architecture Proposal** — `docs/draft/architecture-proposal-hivemind-v3.md`. Feature-to-code mapping for background agents, auto-loop, delegation chains, and continuity persistence.

2. **OpenCode SDK** — `.repo-sdk-packed/opencode-api-sdk.xml`. Authoritative reference for `client.session.*`, `client.app.log()`, `tool.schema`, plugin hooks, and `promptAsync()` endpoint.

3. **Oh-My-OpenAgent Reference** — HiveMind skill providing complete OMO repo as packed reference for inbox injection patterns and tech-stack analysis.

4. **HiveMind Continuity Store** — `src/lib/continuity.ts`. Durable JSON persistence with deep-clone-on-read, governance state tracking, and session metadata management.

5. **HiveMind Injection Engine** — `src/lib/injection-engine.ts`. Runtime injection evaluation with candidate matching, governance blocking, and audit logging.

6. **HiveMind Governance Engine** — `src/lib/governance-engine.ts`. Rule-based policy enforcement with warn/escalate/block actions, violation tracking, and injection governance.

7. **HiveMind Delegation Packet** — `src/lib/delegation-packet.ts`. Status transition table, artifact packet construction, and parent chain resolution.

8. **HiveMind Session API** — `src/lib/session-api.ts`. Typed OpenCode SDK wrappers including `sendPrompt()` (synchronous) and `sendPromptAsync()` (asynchronous) with lifecycle documentation.

9. **HiveMind Plugin** — `src/plugin.ts`. Composition root wiring hooks and tools, background manager instantiation, and lifecycle manager hydration.

10. **HiveMind Type Definitions** — `src/lib/types.ts`. Complete type system including `SessionContinuityMetadata`, `DelegationMeta`, `RuntimePolicy`, `SessionPolicyOverride`, and governance types.

### OpenCode Platform References

11. **OpenCode Agents** — Built-in agents (Build, Plan, General, Explore), custom agent definitions, subagent invocation, task permissions, and agent lifecycle. Source: `.claude/skills/opencode-platform-reference/references/opencode-agents.md`.

12. **OpenCode Skills** — `SKILL.md` discovery paths, frontmatter validation, permission configuration, and skill loading via the `skill` tool. Source: `.claude/skills/opencode-platform-reference/references/opencode-skills.md`.

13. **OpenCode Built-in Tools** — Complete tool catalog (`edit`, `write`, `bash`, `read`, `grep`, `glob`, `list`, `lsp`, `patch`, `skill`, `todowrite`, `webfetch`, `websearch`, `question`) with permission configuration. Source: `.claude/skills/opencode-platform-reference/references/opencode-built-in-tools.md`.

14. **OpenCode Custom Tools** — Tool definition patterns, TypeScript/JavaScript/Python examples, context injection, and name collision handling. Source: `.claude/skills/opencode-platform-reference/references/opencode-custom-tools.md`.

15. **OpenCode Plugins** — Plugin hooks (`event`, `system.transform`, `messages.transform`, `tool.execute.before/after`, `session.compacting`, `shell.env`), SDK client usage, and plugin lifecycle. Source: `.claude/skills/opencode-platform-reference/references/opencode-plugins.md`.

16. **OpenCode SDK** — Full API reference: sessions, messages, agents, tools, MCP, events, TUI, auth. Source: `.claude/skills/opencode-platform-reference/references/opencode-sdk.md`.

17. **OpenCode Server** — HTTP API endpoints, OpenAPI spec, session management, prompt/prompt_async distinction, and event streaming. Source: `.claude/skills/opencode-platform-reference/references/opencode-server.md`.

18. **OpenCode MCP Servers** — Local/remote MCP configuration, OAuth authentication, glob pattern management, and per-agent MCP enablement. Source: `.claude/skills/opencode-platform-reference/references/opencode-mcp-servers.md`.

19. **OpenCode Permissions** — Permission matrix (`edit`, `bash`, `skill`, `task`, `question`, `external_directory`, `doom_loop`), wildcard patterns, agent overrides, and YOLO mode analysis. Source: `.claude/skills/opencode-platform-reference/references/opencode-permissions.md`.

20. **OpenCode Rules** — AGENTS.md loading precedence, custom instruction files, remote URL loading, and Claude Code compatibility. Source: `.claude/skills/opencode-platform-reference/references/opencode-rules.md`.

### Research Artifacts

21. **Forensic Session Analysis** — `attempt-fix-1.md`. Git history analysis, commit timestamps, and file modification patterns from Phase 02 execution.

22. **Bundle Scan Findings** — `attmp-fix-trial-2-fail.md`. Cross-skill conflicts, phantom references, and dead code identification from skill pack analysis.

23. **Plugin Diagnostic Report** — `plugin-diagnostic.md`. Hook early-return patterns, continuity state requirements, and tool execution path analysis.

### External References

24. **Miller, G.A. (1956)** — "The Magical Number Seven, Plus or Minus Two." *Psychological Review*, 63(2), 81-97. Basis for the supervisor count heuristic in depth-3 delegation.

25. **OpenCode Plugin Specification** — `@opencode-ai/plugin` package. Tool definition API, hook contract, and plugin lifecycle.

---

## Appendix A: Architecture Decision Records

### ADR-001: Always Use `promptAsync()` for Background Delegation

**Context**: Background delegation requires child sessions to survive parent turn completion. The synchronous `prompt()` endpoint creates a request-response cycle that ties the child's lifecycle to the parent's turn. When the parent's turn ends, the child session is deleted, losing all accumulated context and partial work.

**Decision**: All background delegation must use `promptAsync()`. This endpoint returns HTTP 204 immediately, allowing the child session to execute independently. The parent polls status via `client.session.status()` and receives completion notifications via the `event` hook.

**Consequences**:
- Child sessions maintain independent lifecycle
- Orchestrator must implement status polling or event-driven completion detection
- Slightly more complex coordination but eliminates orphaned-session data loss
- Synchronous `prompt()` is reserved for interactive, foreground user-facing turns

### ADR-002: Steering Flow in Depth-3 Hierarchies

**Context**: In three-level delegation hierarchies, the root orchestrator has no direct visibility into depth-2 workers. Steering a depth-2 worker directly from the root creates state divergence: the mid-tier supervisor's model of the worker's task diverges from the worker's actual task after root steering.

**Decision**: All steering to depth-2 workers must flow through their depth-1 supervisor. The root sends steering messages to the supervisor, which relays (and optionally adapts) them to the leaf worker. Exception: emergency abort (disruption budget = 0) may bypass the chain.

**Consequences**:
- Steering latency increases by one hop
- Supervisors must implement relay logic
- Supervision chain remains consistent
- Emergency abort provides safety valve for critical failures

### ADR-003: Phase-Safe System Transform Injection

**Context**: System-transform injections modify the agent's system prompt, which governs its behavior for the entire session. Injecting during the `running` phase can cause mid-execution behavior changes that invalidate work in progress.

**Decision**: System-transform injections are only applied during `created`, `completed`, or `compacting` phases. During `running` phase, the protocol falls back to inbox injection. This ensures the agent receives new capabilities or constraints at natural phase boundaries, not mid-task.

**Consequences**:
- Some steering latency increase (wait for phase boundary)
- Work-in-progress is never invalidated by capability changes
- Injection engine must evaluate candidates at each phase boundary, not continuously

### ADR-004: YOLO-Aware Steering Requires Conservative Downgrades

**Context**: When users run with `"permission": "allow"` (YOLO mode), there are no approval gates to catch destructive steering actions. The protocol itself must act as the safety net.

**Decision**: In YOLO mode, destructive actions (`abort`, `redirect` during active work) are downgraded to non-destructive equivalents (`pause`, `narrow`). The `question` tool is used for high-impact decisions even in YOLO mode, with auto-selection of the safest option on timeout.

**Consequences**:
- YOLO users experience slightly slower steering (extra verification steps) but avoid catastrophic work loss
- The protocol logs a warning each time it downgrades an action, making the user aware of the risk
- The permission mode is detected at steering time, not cached, so users who switch modes mid-session get appropriate behavior

### ADR-005: The `question` Tool Replaces Binary `permission.ask` for Steering Decisions

**Context**: `permission.ask` is binary (allow/deny), which doesn't capture the nuanced decisions steering requires. The `question` tool supports multi-choice options with descriptions, timeouts, and auto-selection.

**Decision**: For high-impact steering actions (`redirect`, `abort`, `inject-skill`), use the `question` tool instead of `permission.ask`. Present 2-4 options with trade-off descriptions. Auto-select the least disruptive option on timeout.

**Consequences**:
- Better UX — users understand the implications of each choice
- Timeout-based auto-selection prevents hanging sessions
- The `question` tool is disabled for subagents by default; a protocol-level permission override is required to enable it for steering orchestrators
- Question framing quality matters — poorly worded options lead to user confusion or mistrust

---

## Appendix B: Complete Protocol Message Examples

### B.1 Inbox Injection — Scope Narrowing

```json
{
  "sessionID": "ses_abc123",
  "mechanism": "inbox",
  "action": "narrow",
  "payload": "Focus only on the injection-engine.ts evaluation logic. Skip the governance engine work — it's already verified.",
  "metadata": {
    "turnID": "turn_42",
    "parentSessionID": "ses_parent789",
    "rootSessionID": "ses_root001",
    "depth": 2,
    "disruptionBudget": 3,
    "timestamp": 1744200000000
  }
}
```

### B.2 System Transform — Skill Injection at Phase Boundary

```json
{
  "sessionID": "ses_def456",
  "mechanism": "system-transform",
  "action": "inject-skill",
  "payload": "Load the 'deep-research' skill for this session. It provides repomix integration and codebase analysis patterns.",
  "metadata": {
    "turnID": "turn_43",
    "parentSessionID": "ses_parent789",
    "rootSessionID": "ses_root001",
    "depth": 1,
    "disruptionBudget": 4,
    "timestamp": 1744200060000
  }
}
```

### B.3 Session Patch — Persistent State Update

```json
{
  "sessionID": "ses_ghi789",
  "mechanism": "session-patch",
  "action": "redirect",
  "payload": "Switch from injection-engine to lifecycle-manager. The engine work is complete; priority has shifted to lifecycle phase transitions.",
  "metadata": {
    "turnID": "turn_44",
    "parentSessionID": "ses_parent789",
    "rootSessionID": "ses_root001",
    "depth": 2,
    "disruptionBudget": 2,
    "timestamp": 1744200120000
  }
}
```

---

*Paper version: 2.0 — Edge Case Analysis & Soft Interceptor Pipeline | Date: 2026-04-09 | Authors: HiveMind Research Team*
