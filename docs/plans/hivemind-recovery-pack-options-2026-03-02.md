# Hivemind Recovery Pack (Plugin-Only) - Options and Recommended Path

Date: 2026-03-02
Owner: hivefiver
Scope: `.opencode/**`, `.hivemind/**`, `docs/**` only
Out of scope: `src/**`, `tests/**`, SDK/core runtime edits

## Objective

Create a deterministic, stateful pack that is stronger than GSD for HiveMind remediation by enforcing strict delegation depth, semantic validation, graph-synced TODO state, and searchable SOT exports.

## Option Matrix

### Option A (Recommended): GX-Pack (Governed eXecution Pack)

- Strategy: Build a dedicated plugin-only pack with hard gate enforcement and deterministic state transitions.
- Why better than GSD: Adds mandatory runtime gate calls for every turn phase, explicit depth-bound delegation packets, and SOT-first export schemas as first-class constraints.
- Components:
  - Commands: `hivemind-recover`, `hivemind-validate-semantic`, `hivemind-profile-build`, `hivemind-sot-chain`
  - Workflows: `hivemind-recover-loop.yaml`, `semantic-validation-pipeline.yaml`, `session-handoff-purification.yaml`
  - Skills: `hivemind-recovery-pack`, `hivemind-semantic-validator`, `hivemind-profile-constructor`
  - Scripts: entry/mid/todo/handoff/export deterministic scripts under `.opencode/skills/hivefiver-coordination/scripts/`
  - Schemas: `.hivemind/state/todo-graph.json`, `.hivemind/state/runtime-profile.json`, `.hivemind/exports/*.jsonl`

### Option B: Extend Existing HiveFiver Toolchain Only

- Strategy: Incrementally patch current scripts and commands without introducing a dedicated pack identity.
- Benefit: Lowest change volume.
- Risk: Blended responsibilities and weaker operator ergonomics; higher drift risk across scattered assets.

### Option C: GSD-Compatible Mirror Pack

- Strategy: Clone GSD-style lifecycle structure with minor HiveMind naming changes.
- Benefit: Familiar patterns.
- Risk: Lower fit for HiveMind governance constraints, and less deterministic than a purpose-built pack.

## Expert Choice

Choose **Option A (GX-Pack)**.

It is the best path because it keeps every control surface explicit and local to plugin assets while introducing stronger deterministic controls than GSD: strict L2/L3 delegation boundaries, semantic chain validation, and mandatory SOT registration on output. This gives you operational leverage to fix HiveMind with auditable, replayable state.

Options B and C are weaker for your goal. Option B under-specifies ownership and tends to reintroduce drift because controls remain fragmented. Option C inherits external assumptions and does not align tightly with HiveMind-specific continuity constraints, especially around graph-synced TODO and context purification.

## GX-Pack Architecture

## 1) Delegation Topology

- L2 `hiveminder`: orchestrates strategy, routes work, owns TODO graph.
- L3 `hivemaker`: restricted to investigation/review/research only.
- Monitor gatekeeper (`hiveq` profile): validates TDD/spec/edge coverage before stage promotion.

Enforcement contract:

- Delegation depth max = 3.
- L3 forbidden from critical-path execution edits.
- Every delegation packet includes objective, scope, constraints, return schema.

## 2) Deterministic Tooling

Lifecycle scripts (non-overlapping triggers):

1. `gx-entry-guard.sh` - session entry, policy hash check, state lock.
2. `gx-mid-guard.sh` - mid-session drift scan and depth guard.
3. `gx-todo-sync.sh` - on TODO mutation; graph-sync and 40-subtask cap.
4. `gx-semantic-validate.sh` - before stage close; validates command->workflow->skill intent alignment.
5. `gx-handoff-purify.sh` - pre-export transform and conflict filtering.
6. `gx-sot-register.sh` - final output indexing, JSONL export, searchable registry update.

## 3) Runtime Profile Auto-Construction

Algorithm:

1. Read intent + current hierarchy node + policy version.
2. Resolve role envelope (L2/L3).
3. Compute allowed capabilities from policy allowlist.
4. Build deterministic profile ID from hash of intent+scope+policy.
5. Persist profile to `.hivemind/state/runtime-profile.json`.
6. Attach profile to delegation packet and enforce in gatekeeper.

## 4) Stateful TODO and Continuity

- Source of truth: `.hivemind/state/todo-graph.json`
- Invariants:
  - max 40 subtasks per parent
  - one active task at a time
  - hard-stop node required
  - bidirectional links to hierarchy nodes
- Session handoff schema: `.opencode/schemas/handoff.schema.json`
- Export format: `.hivemind/exports/<date>-handoff.jsonl`

## 5) Semantic Validation (Replacing Mechanical-Only Checks)

Semantic checks:

- command purpose matches workflow stage intent
- workflow gates match declared acceptance criteria
- skill trigger text aligns with delegated objective
- return schema is machine-parseable and complete

Fail-close behavior:

- Any semantic mismatch blocks stage completion.
- Required remediation artifact is generated before retry.

## Rollout (3 Phases)

### Phase 1 - Skeleton + Policy Lock

- Deliver policy files, scripts scaffold, and schema stubs.
- Exit gate: deterministic dry-run replay returns identical outputs for repeated inputs.

### Phase 2 - Continuity + Semantic Validator

- Deliver TODO graph sync, handoff purifier, semantic chain validator.
- Exit gate: 5-session replay with zero orphan tasks and zero schema violations.

### Phase 3 - SOT Hardening + Operator UX

- Deliver searchable exports, SOT index chain, operator commands.
- Exit gate: audit can trace any decision from output -> handoff -> TODO -> hierarchy node.

## Validation Gates

- G0 Scope Integrity: no edits outside `.opencode/**`, `.hivemind/**`, `docs/**`
- G1 Spec Integrity: acceptance criteria declared per stage
- G2 Orchestration Integrity: explicit dependencies + depth constraints
- G3 Evidence Integrity: script outputs and schema validations attached
- G4 Export Integrity: handoff and SOT artifacts linked and searchable

## Immediate Build Queue (Deterministic)

1. Add `gx-*` script stubs in coordination scripts folder.
2. Add `hivemind-recover` and `hivemind-profile-build` commands.
3. Add `hivemind-recovery-pack` skill with references and anti-pattern blocks.
4. Add TODO graph state file and handoff schema.
5. Wire stage workflows to new semantic validator and SOT register steps.
