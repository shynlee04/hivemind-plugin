# Src Canonical Runtime Adapter Separation Contract

Date: 2026-03-07
Status: active-contract
Type: runtime-contract

## Purpose

Define the target split between canonical runtime ownership in `src/**` and adapter/fallback behavior in `.opencode/plugins/**`.

## Contract Summary

- `src/**` owns runtime semantics
- `.opencode/plugins/**` owns transport and boundary adaptation
- fallback behavior in `.opencode/plugins/**` is allowed only when canonical runtime surfaces are unavailable
- plugin hooks must not remain a second primary policy engine

## Detailed Separation Rules

### Rule 1: Context Assembly

Canonical owner:

- `src/hooks/messages-transform.ts`
- `src/hooks/session-lifecycle.ts`
- supporting runtime helpers under `src/lib/**`

Plugin target:

- adapt OpenCode message payloads
- invoke fallback-only assembly if canonical runtime hooks are unavailable

Plugin must not:

- remain the primary owner of turn context semantics
- independently redefine hierarchy/health/TODO/recovery interpretation

### Rule 2: Governance And Delegation Policy

Canonical owner:

- `src/hooks/tool-gate.ts`
- `src/hooks/soft-governance.ts`
- `src/lib/gatekeeper.ts`
- `src/lib/detection.ts`

Plugin target:

- boundary interception
- advisory telemetry
- optional wrapper checks that delegate to canonical policy surfaces

Plugin must not:

- stay the only place that blocks or shapes delegation policy
- remain the main source of path/scope policy semantics

### Rule 3: Lifecycle And Event Governance

Canonical owner:

- `src/hooks/event-handler.ts`
- `src/lib/session-engine.ts`
- `src/lib/state-mutation-queue.ts`
- `src/lib/fs/session-io.ts`

Plugin target:

- translate OpenCode events into canonical runtime calls
- provide fallback-only wrappers if canonical runtime event handling is absent

Plugin must not:

- remain the primary lifecycle engine for session start, handoff, compaction, or TODO/state transitions

### Rule 4: State Snapshot Reading

Canonical owner:

- `src/lib/state-snapshot.ts`
- `src/lib/persistence.ts`
- `src/lib/paths.ts`

Plugin target:

- consume narrow exported adapter outputs when needed

Plugin must not:

- stay responsible for semantically rebuilding runtime truth from raw state files as a primary control path

## Cycle 3 Detailed Refactor Clusters

### Cluster 1: Context Injection Boundary

Files:

- `src/hooks/messages-transform.ts`
- `src/hooks/session-lifecycle.ts`
- `.opencode/plugins/hiveops-governance/hooks/context-injection.ts`

Planning objective:

- separate context semantics from payload adaptation

### Cluster 2: Governance Policy Boundary

Files:

- `src/hooks/tool-gate.ts`
- `src/hooks/soft-governance.ts`
- `.opencode/plugins/hiveops-governance/hooks/delegation.ts`

Planning objective:

- separate policy ownership from tool interception

### Cluster 3: Lifecycle Boundary

Files:

- `src/hooks/event-handler.ts`
- `.opencode/plugins/hiveops-governance/hooks/events.ts`
- `.opencode/plugins/hiveops-governance/hooks/compaction.ts`
- `.opencode/plugins/hiveops-governance/hooks/entry-guard.ts`

Planning objective:

- separate lifecycle/state transitions from event bridging

## Non-Goals

- do not rewrite the hot hook files in this cycle
- do not change runtime JSON authority
- do not revisit source-vs-mirror policy
- do not collapse lineages

## Cycle 3 Success Condition

The refactor is detailed enough when later implementation planning can isolate context, governance, and lifecycle overlap into separate bounded code slices instead of one broad “merge plugin into src” effort.
