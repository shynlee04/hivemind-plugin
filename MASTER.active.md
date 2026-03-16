# HiveMind Architecture Recovery Master Plan - 2026-03-17

## Summary
- Chosen strategy: `Auto-recovering single kernel`, `Hard prune` surface policy, `Full certification` scope.
- Core distinction: `entry` and `runtime` are separate. `Entry` is the kernel transition that detects state, auto-recovers, and gates a session. `Runtime` is every later provider-bound request, whether from a user, a main session, or a delegated sub-session.
- Core recovery rule: if `.hivemind/` is missing, the kernel auto-runs `init`; if broken or lineage-invalid, the kernel auto-runs `doctor`; after either path the system enters `qa-pending` and no normal workflow continues until QA passes.
- Core settings rule: `init` seeds the first canonical parameter set once; `settings` is the only post-bootstrap authority allowed to change configurable parameters.
- Core trajectory rule: trajectory is not a thin ledger. It is the deterministic bridge engine that governs traversal, pivots, workflow unlocks, SOT relations, artifact ancestry, and chain-aware freshness.
- New addition: after every completed runtime turn, the system emits a native-feeling assistant message plus a paired structured turn-output schema. Sub-session outputs use the same family but are delegation-aware and link back to the parent chain. These exports become the long-haul memory, handoff, investigation, and resume substrate.

## Current Traversal Loop - 2026-03-17
- Fresh validation checkpoint:
  - `npx tsc --noEmit` passes
  - `npm test` is currently blocked by repo-time assumptions that `.opencode/**` exists in the framework worktree
- User authority correction:
  - `.opencode/**` is not framework source truth
  - `.opencode/**` is a user-local runtime projection created at first run
  - repo-time checks must not read or require `.opencode/**`
- Active bounded slice:
  - move projection ownership into `hm-init` / auto-init / repair flows
  - remove repo-time mirror assumptions from tests and boundary scripts
  - keep `harness` diagnostic rather than projection-writing
  - reconcile touched framework-agent contracts with the corrected boundary
  - enforce stable non-date-stamped SOT/governance paths and use symlinked compatibility entries instead of parallel authority text
- Completed bounded slice:
  - `.opencode/**` repo-time assumptions removed from the current test/boundary path
  - `hm-init` / auto-init now create user-side runtime projection
  - `hm-doctor` re-syncs runtime projection on healthy recovery
  - `harness` no longer writes `.opencode/**` implicitly
  - current verification gate is green again: `npm test`, `npx tsc --noEmit`, and `npm run build`

## Strategic Options
- `Option A: Auto-recovering single kernel`
One kernel owns detect -> auto-init/auto-doctor -> QA gate -> runtime release.
- `Option B: Formalized hybrid`
Keep the mixed model of hidden bootstrap, explicit recovery commands, and surface-level sync, but document and fence it.
- `Option C: Split products`
Separate plugin/runtime/context-harness into different packages before the authority graph is repaired.

`Option A` is the correct path because the failure mode is authority collision, not lack of features. The current repo already proves this in [runtime-attachment.ts](/Users/apple/hivemind-plugin/.worktrees/ecosystem-revamp/src/shared/runtime-attachment.ts#L297), [command-routing.ts](/Users/apple/hivemind-plugin/.worktrees/ecosystem-revamp/src/cli/command-routing.ts#L23), [control-plane-handler.ts](/Users/apple/hivemind-plugin/.worktrees/ecosystem-revamp/src/control-plane/control-plane-handler.ts#L61), and the shallow response contracts in [tool-response.ts](/Users/apple/hivemind-plugin/.worktrees/ecosystem-revamp/src/shared/tool-response.ts#L1) and [command-types.ts](/Users/apple/hivemind-plugin/.worktrees/ecosystem-revamp/src/commands/slash-command/command-types.ts#L89). A single kernel preserves determinism while still allowing automatic recovery and native-feeling outputs.

`Option B` keeps multiple surfaces claiming first-mover rights and would preserve the same drift under cleaner wording. `Option C` may be useful later, but splitting packages before schema ownership, lineage control, trajectory logic, runtime invocation modeling, and turn-output exports are stabilized would spread the same ambiguity across more boundaries. The plan therefore assumes `Option A` and rejects `B/C` for this branch.

## Non-Negotiable Architecture Rules
- No agent or surface may continue normal work when state is `uninitialized`, `repair-required`, `lineage-invalid`, `qa-pending`, or `blocked`.
- Only the entry kernel may auto-run `init` or `doctor`.
- Hooks remain read/inject only.
- Tools remain mutation primitives.
- Commands remain intent initiators and routers.
- Skills remain knowledge lenses, never hidden runtime engines.
- `.hivemind/` remains generated runtime state, never an authoring surface.
- Root `agents/`, `commands/`, `workflows/`, and `skills/` remain source authority; `.opencode/**` remains projection only.
- No schema field may exist without one owner, one validator, one write path, one consumer map, and one test family.
- No workflow may execute unless its gate registry says it is unlocked.
- No child session may silently rewrite higher-order runtime enforcement.
- No drift or staleness judgment may rely primarily on raw turn count or wall-clock time.

## Canonical Schema Program
- `EntryKernelStateV1`
Tracks detection result, auto-recovery action, QA status, release status, and block reason.
- `BootstrapProfileV1`
Stores first-run user answers, selectable options, provenance, and acceptance evidence.
- `SettingsAuthorityV1`
Stores all mutable configuration after bootstrap and is the sole path for parameter changes.
- `AgentRuntimeRegistryV1`
Registers agent mode (`all`, `primary`, `sub`), role, scope, attended workflows, lineage rights, delegation rights, verification obligations, and runtime-enforcement authority.
- `LineageSessionGraphV1`
Registers the two lineages, main vs sub-session identity, parent-child bindings, delegation origin, and main-session control over children.
- `IntentPurposeTaxonomyV1`
Separates intent classification from purpose-driven workflow categories.
- `WorkflowGateRegistryV1`
Defines workflow classes, activation guards, prerequisite chains, QA exit rules, and resume policy.
- `TrajectoryEngineV1`
Owns traversal, pivots, attach/resume/create/defer/refuse decisions, ancestry, environment factors, and workflow activation bridging.
- `SotRegistryV1`
Registers SOT entities, schematic sections, ownership, ancestors, subscriptions, and validation state.
- `ArtifactChainIndexV1`
Registers artifact level, chain membership, method ID, parent/ancestor relations, source workflow, invalidation events, and freshness rules.
- `DelegationContractV1`
Extends the current delegation packet with hierarchy, lineage, parent authority, child-session limits, authorized transitions, freshness preconditions, and QA return obligations.
- `RuntimeInvocationV1`
Represents each provider-bound API request after entry. Key fields: `invocationId`, `invokerClass`, `sessionId`, `parentSessionId`, `sessionScope`, `agentMode`, `lineage`, `trajectoryId`, `workflowId`, `taskIds`, `subtaskIds`, `gateState`, `sotRefs`, `artifactRefs`, `delegationId`, `requestReason`.
- `TurnOutputEnvelopeV1`
Represents the structured result of a completed runtime turn. Key fields: `turnId`, `invocationId`, `sessionId`, `parentSessionId`, `sessionScope`, `agentId`, `agentMode`, `lineage`, `delegationId`, `trajectoryId`, `workflowId`, `taskIds`, `subtaskIds`, `status`, `qaState`, `pivot`, `rationale`, `workflowEffects`, `dependencyEffects`, `sotEffects`, `artifactRefs`, `toolEvidence`, `handoffSummary`, `followups`, `resumeHints`.
- `TurnExportProjectionV1`
Deterministic export format for `TurnOutputEnvelopeV1` into YAML and Markdown. YAML is machine-first; Markdown is human-native. Both must be generated from the same source envelope, never authored separately.

## Boundary Model
- `Entry boundary`
A new session, resumed session, or lineage repair path enters the kernel first. The kernel detects state, auto-runs `init` or `doctor` if required, then halts in `qa-pending` until released.
- `Runtime boundary`
Every new LLM-provider request is a runtime invocation, not a new entry by default. Runtime invocations must consume the already-established `EntryKernelStateV1`, `LineageSessionGraphV1`, `TrajectoryEngineV1`, and `WorkflowGateRegistryV1`.
- `Turn-output boundary`
Every completed runtime invocation must emit `TurnOutputEnvelopeV1`. The user-facing assistant message remains natural language, but the envelope is the machine authority for long-haul continuity, investigation, handoff, trajectory updates, and workflow/task dependency management.
- `Sub-session boundary`
Sub-session turn outputs use the same schema family as main sessions, but must carry `parentSessionId`, `delegationId`, parent-control references, and delegated return obligations.
- `Settings boundary`
`init` seeds the baseline once. Thereafter only `settings` may change configurable parameters, including behind-the-scenes toggles that affect routing or automation.
- `Agent boundary`
Agent schemas must be runtime-registered, not prose-only. They must encode hierarchy mode, role, attended workflows, lineage rights, session authority, and whether they are main or delegated child.
- `Trajectory boundary`
Trajectory owns deterministic traversal and pivot logic based on project state, complexity, framework/language context, SOT readiness, artifact ancestry, workflow gates, and validated user interventions.
- `SOT boundary`
If an entity is declared SOT, it must be updated through its registered schematic sections and relationship graph. SOT mutations may trigger subscriptions and invalidate downstream artifacts.
- `Freshness boundary`
Freshness is judged first by chain identity, artifact level, method ID, ancestor relation, dependency change, SOT mutation, workflow completion state, and validated user interruption. Time-based checks are secondary only.

## Public API / Interface Changes
- `hivemind_runtime_status`
Becomes a pure read report with sections: `entryState`, `qaState`, `runtimeState`, `lineageSessionState`, `workflowGateState`, `trajectoryState`, `surfaceState`, `recommendedNext`.
- `hivemind_runtime_command`
Becomes the only mutation gateway for control-plane transitions and must be able to auto-dispatch `hm-init` or `hm-doctor` under kernel authority.
- `hm-init`
Seeds `BootstrapProfileV1`, `SettingsAuthorityV1`, and the initial runtime graph; it must not be bypassed by hidden bootstrap.
- `hm-doctor`
Repairs and rebinds broken runtime state and must return `qa-pending` on success, not `ready`.
- `hm-settings`
Becomes the sole public/configurable mutation path after bootstrap.
- `loadRuntimeBindingsSnapshot()`
Must become pure read logic.
- `resolveCliInvocation()`
Must distinguish neutral commands from entry commands and may never fall through to `init`.
- `ToolResponse<T>`
Must stop being the highest-order output contract for long-haul behavior; it becomes a thin transport wrapper only.
- `CommandExecutionResult`
Must either embed or reference `TurnOutputEnvelopeV1` so command completions participate in the same continuity model.
- `PluginRuntimePlan`
Must add explicit `runtimeInvocation` and `turnOutputProjection` sections so the plugin/runtime layer stops conflating entry planning with runtime completion.

## Automatic Export Rules
- After every completed main-session turn, auto-generate one YAML export and one Markdown export from `TurnOutputEnvelopeV1`.
- After every completed sub-session turn, auto-generate the same pair plus parent/delegation links.
- Exports are projections, not authoring surfaces.
- Exports must be indexed into `ArtifactChainIndexV1` and linked into `TrajectoryEngineV1`.
- Exported messages must support investigations, handoffs, workflow updates, and resume without forcing full conversation replay.
- Export generation must happen after completion and before release of the next dependent workflow state.

## Cycle Program
### Cycle 0: Taxonomy And Truth Lock
- Create stable-path SOT artifacts:
  - `docs/architecture/entry-runtime-constitution.md`
  - `docs/architecture/schema-family-map.md`
  - `docs/architecture/agent-lineage-session-model.md`
  - `docs/architecture/trajectory-sot-artifact-engine.md`
  - `docs/architecture/runtime-turn-output-model.md`
  - `docs/audits/surface-authority-gap-audit.md`
  - `docs/testing/certification-gate-map.md`
- If dated compatibility paths are needed for transition, keep them as symlinks to the stable authority files rather than promoting them to SOT.
- Freeze vocabulary for entry, runtime invocation, turn output, lineage, session, workflow, trajectory, SOT, artifact, and gate.
- Inventory every current writer, entry surface, runtime surface, schema owner, and overclaiming public surface.
- Exit gate: no undefined term and no unknown writer remain.
- Authorization: required before Cycle 1.

### Cycle 1: Entry Kernel And QA Constitution
- Redefine recovery as detect -> auto-init/auto-doctor -> `qa-pending` -> release.
- Freeze the meaning of `qa-pending`, `qa-passed`, `qa-failed`, `ready`, `blocked`.
- Require every other surface to defer to the kernel on missing, broken, or lineage-invalid state.
- Exit gate: recovery policy is singular and no read path mutates.
- Authorization: required before Cycle 2.

### Cycle 2: Schema Family Expansion
- Replace the earlier thin schema framing with the full state model above.
- Map ownership and relationships between `BootstrapProfileV1`, `SettingsAuthorityV1`, `AgentRuntimeRegistryV1`, `LineageSessionGraphV1`, `WorkflowGateRegistryV1`, `TrajectoryEngineV1`, `SotRegistryV1`, `ArtifactChainIndexV1`, `DelegationContractV1`, `RuntimeInvocationV1`, `TurnOutputEnvelopeV1`, and `TurnExportProjectionV1`.
- Exit gate: every persisted field family has one owner and one relationship map.
- Authorization: required before Cycle 3.

### Cycle 3: Agent, Session, And Invocation Governance Reset
- Normalize agent schemas across `all`, `primary`, and `sub`.
- Normalize the two lineages, main/sub-session control semantics, child-session limits, and delegation-aware runtime enforcement.
- Separate entry state from runtime invocation state in all plugin, command, and tool contracts.
- Exit gate: agents, lineages, session scopes, and provider-bound runtime invocations are machine-registered.
- Authorization: required before Cycle 4.

### Cycle 4: Trajectory, SOT, Artifact, And Turn-Output Constitution
- Promote trajectory from ledger-only to deterministic bridge engine.
- Register SOTs, schematic sections, subscriptions, artifact ancestry, pivot reasons, workflow unlock conditions, and turn-output linking.
- Replace naive stale heuristics with chain-aware freshness rules.
- Define native turn-output projections and their automatic export behavior.
- Exit gate: workflow activation and resume depend on explicit trajectory/SOT/artifact/turn-output relations.
- Authorization: required before Cycle 5.

### Cycle 5: Surface, Export, And Runtime Normalization
- Align commands, workflows, settings flows, runtime status, runtime command, plugin hooks, provider-bound runtime invocations, and turn-output exports with the new authority graph.
- Hard-prune or demote surfaces that still overclaim behavior or bypass gates.
- Exit gate: visible surfaces, runtime invocations, and exported turn artifacts describe the same system.
- Authorization: required before Cycle 6.

### Cycle 6: Certification Readiness
- Reframe stress tests and acceptance gates around deterministic recovery, entry/runtime separation, lineage-aware delegation, chain-aware freshness, turn-output continuity, and SOT-governed workflow unlocks.
- Reopen feature work only after certification gates pass.
- Exit gate: the architecture can absorb new complexity without reintroducing hidden authority paths.

## Test Cases And Acceptance Scenarios
- Clean repo session start auto-runs `init`, enters `qa-pending`, and does not proceed into normal workflow until QA passes.
- Broken or lineage-invalid runtime auto-runs `doctor`, enters `qa-pending`, and records recovery provenance.
- `runtime_status`, plugin load, `--help`, and neutral runtime reads create no files.
- `settings` is the only successful post-bootstrap path for configurable parameter changes.
- Main-session runtime invocation and delegated sub-session runtime invocation are both recorded as `RuntimeInvocationV1`, with correct lineage, session authority, and workflow gate context.
- Every completed main-session turn emits one `TurnOutputEnvelopeV1` plus deterministic YAML and Markdown exports.
- Every completed sub-session turn emits the same export family plus parent/delegation links.
- Child sessions cannot overwrite higher-order runtime enforcement without an explicit escalation workflow.
- Workflow activation fails when required SOTs, ancestor artifacts, same-chain freshness conditions, or required prior turn-output evidence are not satisfied.
- User intervention between turns invalidates the appropriate artifact chain and blocks unsafe continuation.
- Surface parity verifies that every visible command is backed by real behavior or explicitly demoted.
- Stress-test suites pass for deterministic recovery, delegation integrity, context freshness, trajectory/SOT activation logic, and turn-output continuity.

## Assumptions And Defaults
- Default install model remains single-package and OpenCode-native.
- Default recovery posture is automatic under kernel authority, followed by mandatory QA.
- Default surface policy remains `Hard prune`.
- Default certification scope remains end-to-end before feature work resumes.
- Native-feeling assistant prose remains the user-visible surface; structured turn-output schemas remain the machine authority behind it.

## External Anchors
- [OpenCode Plugins](https://opencode.ai/docs/plugins/)
- [OpenCode Config](https://opencode.ai/docs/config/)
- [OpenCode Commands](https://opencode.ai/docs/commands/)
- [OpenCode Skills](https://opencode.ai/docs/skills/)
- [Anthropic: Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- [GSD User Guide](https://raw.githubusercontent.com/gsd-build/get-shit-done/main/docs/USER-GUIDE.md)
