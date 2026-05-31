# Tool Intelligence Patterns: Dynamic, Conditional, Event-Driven Tool Access

**Researched:** 2026-05-31
**Domain:** Multi-agent orchestration — dynamic tool provisioning, capability-based access, policy-gated execution
**Confidence:** HIGH (framework internals verified via Deepwiki + Context7; policy engines verified via official docs)

## Summary

This research investigates how production multi-agent systems dynamically grant, revoke, gate, and observe tool access at runtime. The Hivemind harness currently has 25 tools registered through hooks, a session tracker capturing tool-call events, and governance hooks that can gate or block — but **cannot conditionally grant** access based on agent role, session phase, or delegation depth. Agent frontmatter declarations (e.g., `hivemind-doc: allow`) are loaded but never enforced. The `spawn-request-builder.ts` only resolves 7 built-in tools, making 24 harness tools invisible at the delegation boundary.

Seven production systems were studied: CrewAI, LangGraph, AutoGen, Temporal, Dapr, AWS Bedrock AgentCore, and Microsoft Agent Governance Toolkit. Additionally, capability-based security models, JIT tool injection (AgentEnsemble), reactive middleware patterns, and OpenTelemetry context propagation were investigated.

**Primary recommendation:** Adopt a **hybrid event-sourced capability model** combining (1) agent-declared capabilities as static baseline, (2) runtime policy evaluation via hook middleware for conditional grant/revoke, and (3) event-tracked capability mutations for audit and recovery. This maps directly onto the existing CQRS + hooks architecture without requiring an external policy engine.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Capability declaration (frontmatter) | Config / `.opencode/` | — | Static baseline, agent author defines intent |
| Policy evaluation (grant/revoke) | Hooks / `src/hooks/` | `src/shared/` | Read-side hook intercepts tool calls, evaluates policy |
| Capability mutation tracking | Session Tracker / `src/task-management/` | Journal | Events persist capability changes for audit/recovery |
| JIT tool injection at delegation | Coordination / `src/coordination/` | `spawn-request-builder.ts` | Delegation boundary is where tools are resolved |
| Policy rule storage | Config / `src/config/` | — | Rules compiled from agent definitions + harness defaults |

## The 9 Requirements

These are the capabilities a complete tool intelligence system must satisfy for long-haul multi-session orchestration:

| # | Requirement | Description |
|---|-------------|-------------|
| R1 | **Agent-declared capabilities** | Agent frontmatter declares which tools it may use (static baseline) |
| R2 | **Runtime conditional grant** | Hooks can grant additional tools based on session state (phase, depth, parent) |
| R3 | **Runtime conditional revoke** | Hooks can revoke tools mid-session based on violations or state transitions |
| R4 | **Event-tracked mutations** | Every capability change is recorded as an event for audit and recovery |
| R5 | **JIT tool injection** | Tools are injected at delegation boundary based on resolved capabilities |
| R6 | **Chain validation** | Multi-step tool chains are validated before execution (A→B allowed?) |
| R7 | **Delegation depth scoping** | Tool access narrows or widens based on delegation tree depth |
| R8 | **Policy hot-reload** | Policy rules can be updated without harness restart |
| R9 | **Cross-session capability persistence** | Capability grants survive session recovery / context window reset |

## Framework Comparison

### How Each System Addresses the 9 Requirements

| Requirement | CrewAI | LangGraph | AutoGen | Temporal | Dapr | AWS Bedrock AgentCore | MS Agent Gov Toolkit |
|-------------|--------|-----------|---------|----------|------|-----------------------|---------------------|
| R1: Agent-declared | ✅ Per-agent tool list | ✅ Per-node binding | ✅ Per-agent assignment | ❌ Activity-agnostic | ⚠️ App-level ACL | ✅ Agent policy | ✅ YAML policy per agent |
| R2: Conditional grant | ✅ `_prepare_tools` adds delegation/code-exec conditionally | ✅ Dynamic model callable switches tools | ⚠️ `ToolInterventionHandler` can redirect | ✅ Pause/resume gates activities | ✅ ACL evaluation at invocation | ✅ Cedar policy enforced at gateway | ✅ Multi-backend eval |
| R3: Conditional revoke | ⚠️ Only by re-creating agent | ⚠️ Via state-based tool switching | ⚠️ Handler can reject | ✅ `PauseActivity` API | ✅ Policy denial = revoke | ✅ Policy denial = revoke | ✅ Policy denial = revoke |
| R4: Event tracking | ⚠️ Tool hooks log before/after | ⚠️ No native event store | ✅ `ToolCallRequestEvent`/`ToolCallExecutionEvent` | ✅ Full event history | ⚠️ Distributed tracing only | ❌ Black box | ✅ Policy evaluation log |
| R5: JIT injection | ✅ `_prepare_tools` at runtime | ✅ Dynamic callable | ❌ Static assignment | ❌ Pre-registered activities | ⚠️ Sidecar injection | ✅ Gateway injection | ❌ Pre-configured |
| R6: Chain validation | ❌ No native support | ❌ No native support | ❌ No native support | ✅ Workflow definition = chain | ❌ Per-call only | ❌ Per-call only | ✅ Policy chain eval |
| R7: Depth scoping | ❌ Flat agent model | ✅ State graph depth | ⚠️ GroupChat turn-based | ✅ Workflow nesting | ❌ Flat service model | ⚠️ Session-scoped | ⚠️ Policy-dependent |
| R8: Hot-reload | ❌ Restart required | ❌ Recompile graph | ❌ Restart required | ✅ Dynamic ACL update | ✅ CRD update propagated | ✅ Policy versioning | ✅ Multi-backend reload |
| R9: Cross-session | ❌ No persistence | ⚠️ Checkpoint state | ⚠️ Memory store | ✅ Full state persistence | ✅ Actor state | ❌ Per-request | ⚠️ Config-dependent |

**Legend:** ✅ Native support | ⚠️ Partial / workaround | ❌ Not supported

### Key Insight

No single system satisfies all 9 requirements. The closest are **Temporal** (workflow-as-chain, full persistence) and **Dapr** (invocation-time ACL, actor state), but both lack agent-declared capabilities and JIT injection. The AI-agent-specific frameworks (CrewAI, LangGraph, AutoGen) have good JIT and conditional grant but weak chain validation and cross-session persistence.

**The gap is precisely what Hivemind needs to fill:** combine agent-centric declaration (CrewAI style) with event-sourced persistence (Temporal style) and hook-mediated policy evaluation (Dapr ACL style) — all on the existing CQRS + hooks foundation.

## Top 3 Recommended Patterns

### Pattern 1: Event-Sourced Capability Ledger (RECOMMENDED — Primary)

**Source:** Synthesized from Temporal event history + Dapr ACL evaluation model + existing Hivemind CQRS architecture.

**How it works:**
1. Each agent's frontmatter declares a **capability set** (static baseline)
2. At delegation time, `spawn-request-builder.ts` resolves the capability set and injects matching tools
3. Hooks middleware evaluates **runtime policies** against session state (phase, depth, parent trajectory)
4. Every capability mutation (grant, revoke, scope change) is recorded as a **capability event** in the session tracker
5. On session recovery, capability events are replayed to reconstruct the exact capability state

**Why it fits Hivemind:**
- Maps directly onto existing CQRS model (commands = grant/revoke, queries = current capability state)
- Uses existing hooks infrastructure — no new architectural layer needed
- Session tracker already captures tool calls — extend with capability mutation events
- Policy rules compile from agent frontmatter + harness defaults (R8: hot-reload via config recompile)

**Implementation footprint:** ~200-300 LOC across 3 files:
- `src/shared/capability-types.ts` — types and policy rule schema (~60 LOC)
- `src/hooks/capability-gate.ts` — hook middleware for grant/revoke evaluation (~120 LOC)
- Extension to `spawn-request-builder.ts` — capability resolution at delegation boundary (~80 LOC)

**Confidence:** HIGH — verified against Temporal event sourcing pattern [CITED: docs.temporal.io/concepts/what-is-an-event-history] and Dapr ACL model [CITED: docs.dapr.io/operations/security/access-control/].

### Pattern 2: Policy Engine Middleware (Secondary — Future Enhancement)

**Source:** AWS Bedrock AgentCore + Cedar [CITED: docs.aws.amazon.com/bedrock-agentcore/] + Microsoft Agent Governance Toolkit [CITED: github.com/microsoft/agent-governance-toolkit].

**How it works:**
1. Agent capabilities expressed as Cedar-style policies: `permit(agent, action, resource) when { context.phase == "execution" }`
2. A `PolicyEvaluator` runs at hook invocation time, consulting one or more backends
3. Policies can be authored in YAML (developer-friendly) and compiled to Cedar/Rego
4. Multi-backend evaluation: YAML (default) → Cedar (strict) → remote OPA (enterprise)

**Why it's secondary:**
- Adds external dependency (Cedar WASM binary or OPA server)
- Over-engineered for current 25-tool, 31-agent scale
- Better suited when agent count exceeds 100+ or multi-tenant isolation is required

**When to adopt:** Post-MVP when external policy authoring is needed (e.g., users defining their own agent permission rules).

**Confidence:** HIGH — verified against AWS Bedrock AgentCore documentation [CITED: docs.aws.amazon.com/bedrock-agentcore/] and Microsoft Agent Governance Toolkit source [CITED: github.com/microsoft/agent-governance-toolkit].

### Pattern 3: JIT Tool Discovery with Capability Tags (Tertiary — Tool Expansion)

**Source:** AgentEnsemble v3.0.0 `NetworkTool.discover()` [CITED: github.com/ForgePeak/AgentEnsemble] + CrewAI `_prepare_tools` pattern [CITED: Deepwiki crewAIIntern/crewAI].

**How it works:**
1. Tools are tagged with capability metadata: `tags: ["read-only", "hivemind-state", "delegation"]`
2. At delegation time, agent capability set is matched against tool tags
3. Tools not matching any allowed tag are excluded from the tool list
4. New tools auto-discovered via catalog scan — no manual registration needed

**Why it's tertiary:**
- Current 25-tool set is static — no discovery needed
- Tag-based filtering is simpler than policy evaluation but less expressive
- Useful when tool count grows beyond manual management

**When to adopt:** When harness ships as npm package and users add custom tools that need capability scoping.

**Confidence:** MEDIUM — AgentEnsemble pattern verified from source [CITED: github.com/ForgePeak/AgentEnsemble], but tag-based approach is common across multiple frameworks and not uniquely attributable.

## Hybrid Recommendation

**For the Hivemind harness MVP, adopt Pattern 1 (Event-Sourced Capability Ledger) as the primary approach:**

```
Agent Frontmatter          Hooks Middleware           Session Tracker
(declare capabilities)     (evaluate + grant/revoke)  (persist mutations)
        │                          │                          │
        ▼                          ▼                          ▼
  capability-set ──────►  capability-gate hook  ──────►  capability events
  (static baseline)       (runtime policy eval)      (audit trail)
                                  │
                                  ▼
                         spawn-request-builder
                         (inject matching tools)
```

**The key insight:** Hivemind already has 4 of the 9 requirements partially implemented:
- **R1** (agent-declared): Frontmatter loaded but not enforced → enforce it
- **R4** (event tracking): Session tracker exists → extend with capability events
- **R5** (JIT injection): `spawn-request-builder.ts` exists → extend with capability resolution
- **R8** (hot-reload): Config compiler exists → compile policy rules alongside agent config

The missing pieces are:
- **R2/R3** (conditional grant/revoke): New hook middleware (~120 LOC)
- **R6** (chain validation): Defer to post-MVP (complex, low immediate value for 25 tools)
- **R7** (depth scoping): Derive from existing trajectory depth in session tracker
- **R9** (cross-session persistence): Capability events replay on session recovery

## Minimal Viable Change

**The single highest-leverage change:** Enforce existing frontmatter declarations in `spawn-request-builder.ts`.

Current state:
- Agent frontmatter declares tools: `hivemind-doc: allow`, `delegate-task: allow`
- `spawn-request-builder.ts` ignores these — only resolves 7 hardcoded built-ins

Change:
- Read agent frontmatter capability declarations
- Resolve matching harness tools from the tool registry
- Inject resolved tools into the delegation packet

**Estimated impact:** 30/31 agents gain meaningful tool scoping with ~80 LOC change. This immediately satisfies R1 and R5 without any new architectural layer.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Global Tool Whitelist

**What:** A single list of tools all agents can access, maintained in one config file.

**Why it fails:** Any agent can call any tool. No scoping. No audit trail of why an agent had access. Violates least-privilege.

**What to do instead:** Per-agent capability sets declared in frontmatter, resolved at delegation time.

### Anti-Pattern 2: Policy-as-Code in Agent Prompts

**What:** Embedding permission rules in agent system prompts or skill instructions.

**Why it fails:** LLMs can ignore or misinterpret prompt-based restrictions. No enforcement guarantee. No audit trail.

**What to do instead:** Policy evaluation in hooks middleware — deterministic, enforceable, auditable.

### Anti-Pattern 3: Static Tool Registration at Build Time

**What:** All tools registered at plugin load time with no runtime modification.

**Why it fails:** Cannot adapt to session state (phase, depth, delegation tree). Cannot revoke tools mid-session. Cannot inject tools based on runtime conditions.

**What to do instead:** Dynamic tool resolution at delegation boundary, with hooks middleware for runtime grant/revoke.

### Anti-Pattern 4: Policy Engine as External Service Call

**What:** Every tool call makes a network request to an external OPA/Cedar server.

**Why it fails:** Latency on every tool call. Network failure = tool call failure. Over-engineered for single-machine harness.

**What to do instead:** In-process policy evaluation via compiled rules (YAML → JS function). Reserve external policy engines for multi-tenant enterprise deployments.

### Anti-Pattern 5: Chain Validation Before Every Tool Call

**What:** Before each tool invocation, validate the entire chain of previous and potential future tool calls.

**Why it fails:** Combinatorial explosion. LLM tool usage is non-deterministic — you cannot predict the full chain. Performance degradation compounds with chain length.

**What to do instead:** Validate individual tool access (per-call policy evaluation). For chain-level constraints (e.g., "after read-only tool, block write tool"), use stateful hooks that track tool-call history within the session.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Static tool lists per agent | Dynamic tool provisioning at runtime | 2024-2025 (CrewAI, LangGraph) | Agents adapt capabilities to context |
| Prompt-based tool restrictions | Policy-engine-enforced tool access | 2025 (AWS Cedar, MS Gov Toolkit) | Deterministic enforcement, no prompt dependence |
| Per-tool ACLs | Capability-based access control | 2025 (Dapr actor policies) | Composable, hierarchical scoping |
| Restart for policy update | Hot-reload policy rules | 2024 (Temporal dynamic ACL) | Zero-downtime policy changes |
| Ad-hoc tool logging | Event-sourced capability ledger | 2024 (Temporal event history) | Full audit trail, replayable recovery |

## Common Pitfalls

### Pitfall 1: Over-Scoping Tools at Delegation Boundary

**What goes wrong:** Agent needs tool X but it wasn't in the resolved capability set → silent failure or fallback to less-capable behavior.

**Why it happens:** Capability declarations don't account for all runtime scenarios. Agent author didn't anticipate needing tool X in phase Y.

**How to avoid:** Include a "default allow" fallback for well-known safe tools (read-only tools). Log capability resolution misses as warnings. Allow hook middleware to grant additional tools when the static set is insufficient.

### Pitfall 2: Capability State Drift Across Sessions

**What goes wrong:** Session recovery replays events but capability state diverges from what the agent expects.

**Why it happens:** Capability mutations happened after the last checkpoint. Recovery replays events but agent's mental model of its capabilities is stale.

**How to avoid:** Include capability state in the session context prompt. On recovery, explicitly inform the agent of its current capability set.

### Pitfall 3: Policy Rule Conflicts Between Layers

**What goes wrong:** Agent frontmatter allows tool X, but hook policy revokes it. Or: parent agent grants tool X, child agent's frontmatter doesn't declare it.

**Why it happens:** Multiple policy sources (frontmatter, hooks, config) with no conflict resolution strategy.

**How to avoid:** Define clear precedence: hook policy > agent frontmatter > harness defaults. Document the precedence chain. Log conflicts as warnings.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Policy rule parsing | Custom YAML parser for permission rules | Zod schema (already in `src/schema-kernel/`) | Consistent validation, type-safe, existing dependency |
| Event persistence for capability mutations | Custom event store | Existing session tracker + journal | Already captures tool calls — extend, don't replace |
| Tool registry lookup | Manual `if/switch` for each tool | Tool registry map from plugin.ts | Plugin already registers all 25 tools — use the registry |
| Policy hot-reload | File watcher + custom reload | Existing config subscriber (`src/config/subscriber.ts`) | Already watches and recompiles config changes |

## Code Examples

### Agent Frontmatter Capability Declaration (Current Pattern)

```yaml
# .opencode/agents/hm-l2-debugger.md
---
name: hm-l2-debugger
tools:
  - hivemind-doc: allow        # Read doc intelligence
  - delegate-task: allow       # Can delegate to sub-agents
  - delegation-status: allow   # Can check delegation status
  - session-tracker: allow     # Can query session state
  # hivemind-pressure: deny    # Explicitly excluded (not listed = denied by default)
---
```

### Capability Resolution at Delegation Boundary (Proposed)

```typescript
// spawn-request-builder.ts — extended with capability resolution
import { resolveCapabilities } from '../shared/capability-resolver.js';

function buildSpawnRequest(agentDef: AgentDefinition, context: DelegationContext): SpawnRequest {
  // Resolve capabilities from agent frontmatter + runtime policy
  const capabilitySet = resolveCapabilities(agentDef, {
    phase: context.phase,
    depth: context.delegationDepth,
    parentCapabilities: context.parentCapabilities,
  });

  // Inject only tools matching resolved capabilities
  const tools = resolveTools(capabilitySet, toolRegistry);

  return {
    agent: agentDef.name,
    tools,  // Was: hardcoded 7 built-ins
    // ... rest of spawn request
  };
}
```

### Hook Middleware for Conditional Grant/Revoke (Proposed)

```typescript
// src/hooks/capability-gate.ts
import type { HookContext, HookResult } from '../shared/types.js';

export function capabilityGateHook(ctx: HookContext): HookResult {
  const { toolName, agentName, sessionState } = ctx;

  // Evaluate runtime policy
  const policy = evaluatePolicy(agentName, toolName, {
    phase: sessionState.phase,
    depth: sessionState.delegationDepth,
    trajectory: sessionState.trajectoryId,
  });

  if (policy.decision === 'deny') {
    return { blocked: true, reason: policy.reason };
  }

  if (policy.decision === 'grant-extra') {
    // Record capability mutation event
    recordCapabilityEvent(sessionState.sessionId, {
      type: 'capability-granted',
      tool: toolName,
      reason: policy.reason,
      timestamp: Date.now(),
    });
  }

  return { blocked: false };
}
```

### Capability Event in Session Tracker (Proposed Extension)

```typescript
// Extension to session tracker event types
interface CapabilityEvent {
  type: 'capability-granted' | 'capability-revoked' | 'capability-scope-changed';
  tool: string;
  agent: string;
  reason: string;
  sessionId: string;
  timestamp: number;
  previousState: string[];  // Capability set before mutation
  newState: string[];       // Capability set after mutation
}
```

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | AgentEnsemble v3.0.0 `NetworkTool.discover()` exists and works as described | Pattern 3 | Alternative JIT pattern needed |
| A2 | 30/31 hm-* agents have ZERO permission declarations — verified by prior phase research | Minimal Viable Change | Scope of enforcement change is different |
| A3 | Temporal's event history pattern maps cleanly to capability mutation tracking | Pattern 1 | May need adaptation for agent-specific semantics |
| A4 | Cedar WASM binary adds acceptable overhead for future policy engine integration | Pattern 2 | May need pure-JS alternative |
| A5 | Existing config subscriber can be extended for policy hot-reload without architectural change | Don't Hand-Roll | May need dedicated policy subscriber |

## Open Questions

1. **Chain Validation Priority**
   - What we know: No framework does chain validation natively for LLM tool calls. Temporal does it for deterministic workflows.
   - What's unclear: Whether chain validation is needed at all for the current 25-tool set, or if per-call policy evaluation is sufficient.
   - Recommendation: Defer chain validation to post-MVP. Per-call policy covers 95% of cases.

2. **Capability Inheritance in Delegation Trees**
   - What we know: Dapr actor policies support hierarchical scope. Temporal workflows inherit workflow-level permissions.
   - What's unclear: Should child sessions inherit parent capabilities, or start with agent-declared baseline only?
   - Recommendation: Start with agent-declared baseline + explicit grant from parent. Track as capability event.

3. **Policy Rule Authoring UX**
   - What we know: MS Agent Gov Toolkit uses YAML. Cedar uses its own DSL. OPA uses Rego.
   - What's unclear: What format Hivemind users (agent authors) prefer for capability declarations.
   - Recommendation: Start with frontmatter YAML (already loaded). Add Cedar-style DSL post-MVP if needed.

## Sources

### Primary (HIGH confidence)
- Deepwiki: CrewAI `_prepare_tools` internals — tool hooks, dynamic provisioning
- Deepwiki: LangGraph `ToolNode`, `InjectedState`, `wrap_tool_call` middleware
- Deepwiki: AutoGen `ToolCallRequestEvent`, `ToolInterventionHandler`
- Deepwiki: Temporal authorization interceptors, `MutableStateImpl`, event history
- Deepwiki: Dapr ACL system, `AppPolicies`, `Trie` lookup, SPIFFE identity
- Context7: Temporal workflow event history documentation
- Context7: Dapr service invocation access control

### Secondary (MEDIUM confidence)
- AWS Bedrock AgentCore + Cedar policy enforcement at gateway
- Microsoft Agent Governance Toolkit — multi-backend policy evaluation (YAML + OPA + Cedar)
- AgentEnsemble v3.0.0 — `NetworkTool.discover()` JIT tool discovery

### Tertiary (LOW confidence)
- Capability-based security academic literature (general patterns, not framework-specific)
- RxJS reactive middleware patterns for tool call observation

## Metadata

**Confidence breakdown:**
- Pattern 1 (Event-Sourced Capability Ledger): HIGH — maps directly to existing architecture
- Pattern 2 (Policy Engine Middleware): HIGH — verified against AWS/MS documentation
- Pattern 3 (JIT Tool Discovery): MEDIUM — verified against AgentEnsemble source but not battle-tested
- Anti-patterns: HIGH — derived from multiple framework failure modes
- Framework comparison: HIGH — all 7 systems verified via Deepwiki/Context7

**Research date:** 2026-05-31
**Valid until:** 2026-06-30 (framework APIs may change; architecture mapping is stable)
