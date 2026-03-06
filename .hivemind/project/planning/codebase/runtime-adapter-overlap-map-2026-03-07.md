# Runtime Adapter Overlap Map

Date: 2026-03-07
Status: active-audit
Type: runtime-overlap-map

## Purpose

Map the duplicated runtime adapter boundary between `src/**` and `.opencode/plugins/**` in enough detail that later refactor cycles can separate transport adapters from canonical runtime logic without guessing.

## Canonical Rule

- `src/**` owns canonical runtime logic
- `.opencode/plugins/**` should only own OpenCode adapter, transport, and fallback behavior

## Overlap Cluster A: Context Assembly

### Canonical src surfaces

- `src/hooks/messages-transform.ts`
- `src/hooks/session-lifecycle.ts`
- `src/lib/injection-orchestrator.ts`
- `src/lib/runtime-session-lineage.ts`
- `src/lib/budget.ts`
- `src/lib/cognitive-packer.ts`

### Plugin-side duplicate surface

- `.opencode/plugins/hiveops-governance/hooks/context-injection.ts`

### Current duplication

The plugin hook is not merely adapting message shapes. It:

- reads `src/lib/state-snapshot.ts`
- computes TODO, hierarchy, health, recovery, and advisory context
- reserves injection budget
- injects authoritative context into every turn

### Separation target

- `src/**` owns context assembly and governance semantics
- `.opencode/plugins/**` owns only message-shape adaptation and fallback dispatch when core runtime hooks are unavailable

## Overlap Cluster B: Governance Enforcement

### Canonical src surfaces

- `src/hooks/tool-gate.ts`
- `src/hooks/soft-governance.ts`
- `src/lib/gatekeeper.ts`
- `src/lib/detection.ts`
- `src/lib/session-role.ts`
- `src/lib/governance-instruction.ts`

### Plugin-side duplicate surface

- `.opencode/plugins/hiveops-governance/hooks/delegation.ts`

### Current duplication

The plugin hook currently performs:

- delegation topology blocking
- path/scope blocking
- dangerous command blocking
- turn-count-driven health checks
- trace and purge triggers

### Separation target

- `src/**` owns policy, governance state, and authoritative decision logic
- `.opencode/plugins/**` may intercept tool payloads and emit advisory telemetry, but should not remain the primary policy engine

## Overlap Cluster C: Lifecycle And Events

### Canonical src surfaces

- `src/hooks/event-handler.ts`
- `src/lib/session-engine.ts`
- `src/lib/state-mutation-queue.ts`
- `src/lib/fs/session-io.ts`
- `src/lib/fs/planning-ops.ts`

### Plugin-side duplicate surface

- `.opencode/plugins/hiveops-governance/hooks/events.ts`
- `.opencode/plugins/hiveops-governance/hooks/entry-guard.ts`
- `.opencode/plugins/hiveops-governance/hooks/compaction.ts`

### Current duplication

The plugin-side hooks currently participate in:

- session-start bootstrap behavior
- first-turn refresh
- handoff purification
- TODO sync
- schema validation triggers
- compaction recovery assembly

### Separation target

- `src/**` owns lifecycle governance and state transitions
- `.opencode/plugins/**` only bridges OpenCode events into canonical runtime services or fallback adapters

## Overlap Cluster D: State Snapshot Bridge

### Canonical src surfaces

- `src/lib/state-snapshot.ts`
- `src/lib/persistence.ts`
- `src/lib/paths.ts`
- `src/schemas/brain-state.ts`

### Plugin-side consumer

- `.opencode/plugins/hiveops-governance/hooks/context-injection.ts`

### Current duplication

The plugin path currently reads canonical runtime state directly and rebuilds context from it.

### Separation target

- keep `src/lib/state-snapshot.ts` canonical
- if plugin fallback survives later cycles, it should consume a minimal exported adapter interface, not re-own the semantics of state interpretation

## Overlap Cluster E: Registration And Load Order

### Canonical src surface

- `src/index.ts`

### Plugin-side surface

- `.opencode/plugins/hiveops-governance/index.ts`

### External validation

Official OpenCode plugin documentation confirms:

- project-level plugins are automatically loaded
- plugin hooks run in sequence
- local plugins are loaded before global/config plugins

### Refactor consequence

Because hooks run in sequence, a heavy project-local plugin can keep behaving like a second runtime control plane unless its responsibility is narrowed deliberately.

## Risk Ranking

### Highest risk

- context assembly overlap
- governance enforcement overlap

### Medium risk

- lifecycle and compaction overlap

### Lower risk

- plugin registration/load-order description
- exported adapter surface definition

## Recommended Detailed Refactor Order

1. keep source ownership and asset projection settled first
2. define adapter-separation contract for the runtime overlap clusters
3. separate context assembly semantics from transport adapters
4. separate governance policy from plugin interception
5. separate lifecycle state transitions from plugin event bridging
6. only then plan implementation slices for the hot hook files
