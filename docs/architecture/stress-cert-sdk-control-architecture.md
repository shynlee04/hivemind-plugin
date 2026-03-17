# Stress-Cert SDK Control Architecture

## Purpose
This is the stable architecture source of truth for Phase 1 stress-cert work. It defines the selected control model, the ownership boundaries, the contract family, and the certification gates the implementation must satisfy.

## Chosen Control Model
- `SDK Supervisor Control Layer` is the orchestration authority.
- `Plugin Enforcement Kernel` is the in-band governance authority.
- `Tool Mutation Pack` is the only durable mutation path.
- `Core Domain Engines` remain pure logic.
- `Schema Kernel` becomes the contract authority.
- `CLI and command bridge` remain thin entry/adaptation surfaces.

## Layer Responsibilities
### 1. SDK Supervisor Control Layer
- Sector: `src/sdk-supervisor/`
- Responsibilities:
  - same-local-env OpenCode server/client management
  - instance registry
  - session registry
  - workflow scheduling
  - dependency graph and wave execution planning
  - concurrency leases
  - deadlock/watchdog supervision
  - freshness monitoring
  - restart recovery orchestration
  - event stream mirroring
- Constraints:
  - must not directly mutate `.hivemind/**`
  - must issue durable mutations through governed runtime tools

### 2. Plugin Enforcement Kernel
- Sectors: `src/plugin/`, `src/hooks/`
- Responsibilities:
  - `permission.ask`
  - `tool.execute.before`
  - `tool.execute.after`
  - `command.execute.before`
  - `chat.message`
  - `experimental.chat.system.transform`
  - `experimental.chat.messages.transform`
  - `event`
  - route/phase guard injection
  - delegated-output interception
  - compaction anchor preservation
  - runtime command bridging
- Constraints:
  - hooks are read/inject/intercept only
  - no durable hook-owned writes

### 3. Tool Mutation Pack
- Sector: `src/tools/`
- Responsibilities:
  - durable writes
  - user-visible runtime transitions
  - verification metadata on mutation results
- Phase 1 governed tools:
  - `hivemind_runtime_status`
  - `hivemind_runtime_command`
  - `hivemind_task`
  - `hivemind_trajectory`
  - `hivemind_handoff`
  - `hivemind_doc` remains read-only

### 4. Core Domain Engines
- Sectors: `src/core/`, `src/delegation/`, `src/recovery/`, `src/governance/`
- Responsibilities:
  - workflow authority
  - trajectory logic
  - delegation validation
  - recovery assessment
  - planning projection
- Constraints:
  - pure logic only
  - no prompt-owned behavior

### 5. Schema Kernel
- Sector: `src/schema-kernel/`
- Responsibilities:
  - machine-authoritative Phase 1 record contracts
  - validation/parsing helpers
  - record creation helpers where safe
- Phase 1 contract family:
  - `EntryKernelStateV1`
  - `RuntimeInvocationV1`
  - `TurnOutputEnvelopeV1`
  - `SupervisorInstanceRegistryV1`
  - `SessionRegistryV1`
  - `WorkflowExecutionGraphV1`
  - `WorkflowWaveStateV1`
  - `WorkflowGuardStateV1`
  - `DelegationReceiptV1`
  - `ArtifactFreshnessRegistryV1`
  - `DeadlockCheckpointV1`
  - `RecoveryReplayEnvelopeV1`

### 6. CLI And Command Bridge
- Sectors: `src/cli/`, `src/commands/`, `src/control-plane/`
- Responsibilities:
  - bootstrap/attach
  - intake
  - bundle routing
  - user-facing command adaptation
- Constraints:
  - orchestration decisions should migrate toward the supervisor
  - runtime mutation remains gatewayed through `hivemind_runtime_command`

## Public Surfaces
- Package exports remain:
  - `"."`
  - `"./plugin"`
- Public CLI remains:
  - `hm-init`
  - `hm-doctor`
  - `hm-settings`
  - `hm-harness`

## Runtime Rules
- All user entry resolves through the supervisor path.
- All durable mutations go through runtime tools.
- All delegated returns pass through `tool.execute.after` verification before parent continuation.
- All async mutation/delegation operations must bind to `context.abort` and supervisor timeout policy.
- All artifacts require timestamps and file-state verification inputs.
- Restart reconstruction must come from schema-kernel records and checkpoints.

## Truthful Implementation Status On 2026-03-17
- Present today:
  - entry/runtime/turn contracts exist in `src/shared/`
  - plugin hook registration already covers the intended enforcement surfaces
  - recovery, trajectory, workflow, and delegation modules exist as pre-supervisor building blocks
  - first-class `src/schema-kernel/` exists with additive Phase 1 contract schemas
  - first-class `src/sdk-supervisor/` exists with additive instance registry and health seams
- Missing today:
  - contract-backed concurrency/freshness/deadlock/replay authorities
  - status reporting for supervisor/freshness/watchdog state
  - supervisor-backed session/workflow/event orchestration

## Certification Gates
- Static gate: `npx tsc --noEmit`
- Repo gate: `npm test`
- Boundary gate: `npm run lint:boundary`
- Stress-cert gate:
  - concurrent session isolation
  - workflow wave/dependency scheduling
  - stale-reference handling
  - timeout/deadlock checkpointing
  - restart recovery replay
  - zero-trust delegated result verification

## Rejected Alternatives
- `Single-kernel only`
  - too weak for multi-workflow scheduling, concurrent sessions, restart supervision, and stale-artifact policing
- `Pure external SDK orchestration`
  - cannot replace plugin-native enforcement points
- `Second package in Phase 1`
  - adds packaging complexity before contract ownership is stable
