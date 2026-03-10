# Phase 1 P1-C.1 OpenCode Tool Isolation Packet

**Date**: `2026-03-10`
**Category**: `SOT-subordinate`
**Status**: `decision packet`
**Authority**: Subordinate to root [`PLAN.md`](/Users/apple/hivemind-plugin/PLAN.md) and the dated Phase 1 audit artifact at [`phase1-audit-report-2026-03-08.md`](/Users/apple/hivemind-plugin/docs/audits/phase1-audit-report-2026-03-08.md)
**Lane**: `P1-C.1`

---

## Objective

Freeze the Phase 1 `P1-C.1` boundary for the remaining `.opencode/tool/*` surfaces before any migration or deletion work is authorized.

This packet answers one narrow question:

> Which residual `.opencode/tool/*` surfaces are still carrying governance or state authority, which `src/**` surfaces should absorb that authority, and which OpenCode-facing layers may survive only as temporary transport wrappers?

This packet is decision-only.
It does **not** authorize runtime code edits by itself.

## Why `P1-C.1` Is Separate

The remaining `.opencode/tool/*` layer is not one problem.

There are two different debt classes:

1. direct `.hivemind/state` authority
   - `hiveops_gate.ts`
   - `hiveops_sot.ts`
   - `hiveops_todo.ts`
2. artifact-path orchestration coupled to state reads
   - `hiveops_export.ts`

If those are migrated as though they are the same kind of runtime debt, Phase 1 risks mixing governance enforcement, artifact indexing, task-state modeling, and export/handoff behavior into one oversized refactor.

That is exactly what this packet avoids.

## Current Evidence

### Runtime Registration Boundary

All four files are OpenCode custom tools:

- they import `tool` from `@opencode-ai/plugin`
- they export a `tool(...)` definition
- they use tool context such as `context.directory` and `context.agent`

Current OpenCode docs verify:

- project custom tools are defined in `.opencode/tools/`
- project plugins are defined in `.opencode/plugins/`
- plugins and tools are loaded by the runtime from those project directories

Current repo evidence plus external validation also confirm that the singular `.opencode/tool/` directory is still backward-compatible rather than necessarily dead:

- this repo still keeps the custom tools in `.opencode/tool/`
- current OpenCode compatibility behavior still supports singular directory names for backward compatibility

Implication:

- the registration layer is OpenCode-specific
- the business logic is not inherently OpenCode-specific and can be extracted into `src`
- the singular directory name is not by itself proof that these tools are inactive

### Direct State Writers

#### `hiveops_gate.ts`

Evidence:

- defines `STATE_DIR = ".hivemind/state"` and `GATE_FILE = "gates.json"`
- `saveGateState()` writes to `join(stateDir, GATE_FILE)`

Owned logic:

- gate definitions `G0` to `G4`
- pass/fail/check/status/reset/criteria state machine
- evidence attachment and failure recording

#### `hiveops_sot.ts`

Evidence:

- defines `STATE_DIR = ".hivemind/state"` and `SOT_FILE = "sot-index.json"`
- `saveSotIndex()` writes to `.hivemind/state/sot-index.json`
- export action writes `.hivemind/state/sot-export.tsv`

Owned logic:

- artifact registration
- tag index maintenance
- stale detection
- scan/search/tree/export behavior

#### `hiveops_todo.ts`

Evidence:

- defines `STATE_DIR = ".hivemind/state"` and `TODO_FILE = "todo.json"`
- `saveTodoState()` writes to `.hivemind/state/todo.json`

Owned logic:

- TODO state machine
- dependency and reverse-dependency tracking
- 40-active-item cap
- HARD STOP warning behavior

### Artifact-Path Writer

#### `hiveops_export.ts`

Evidence:

- writes handoffs under `.hivemind/handoffs`
- writes checkpoints under `.hivemind/checkpoints`
- reads `.hivemind/state/gates.json`
- reads `.hivemind/state/todo.json`

Owned logic:

- handoff payload assembly
- checkpoint snapshot assembly
- markdown + JSON artifact emission
- recent handoff discovery and readback

This is **not** a direct `.hivemind/state` writer, but it is coupled to state files that should not remain owned by `.opencode/tool/*`.

## Closest Canonical `src` Owners

### `hiveops_gate.ts`

Closest canonical owner:

- [`src/lib/gatekeeper.ts`](/Users/apple/hivemind-plugin/src/lib/gatekeeper.ts)
- [`src/lib/plan-validation.ts`](/Users/apple/hivemind-plugin/src/lib/plan-validation.ts)

Reason:

- this is the existing `src` governance enforcement surface
- it already defines pass/fail style validation semantics over canonical runtime state
- `plan-validation.ts` is the existing `src` surface closest to acceptance-criteria and evidence-oriented validation
- any gate-record persistence that survives Phase 1 should be owned by `src`, not a plugin-local state file writer

Constraint:

- `gatekeeper.ts` is not a drop-in replacement yet
- `P1-C.2` must extract or rebuild gate-record storage under `src` rather than copying `gates.json` forward uncritically

### `hiveops_sot.ts`

Closest canonical owner:

- [`src/lib/sot-governance.ts`](/Users/apple/hivemind-plugin/src/lib/sot-governance.ts)

Reason:

- this is already the `src` source-of-truth governance surface
- it owns pending-change and verification-ledger logic tied to canonical graph/runtime authority
- artifact indexing should be absorbed into `src` governance rather than remain a parallel `.hivemind/state/sot-index.json` authority

Constraint:

- `src/lib/sot-governance.ts` currently focuses on change verification, not artifact indexing
- `P1-C.2` must decide whether to extend this module or add a narrow helper under `src/lib/` without creating a second SOT authority

### `hiveops_todo.ts`

Closest canonical owner bundle:

- [`src/hooks/event-handler.ts`](/Users/apple/hivemind-plugin/src/hooks/event-handler.ts)
- [`src/lib/state-mutation-queue.ts`](/Users/apple/hivemind-plugin/src/lib/state-mutation-queue.ts)
- [`src/schemas/manifest.ts`](/Users/apple/hivemind-plugin/src/schemas/manifest.ts)
- [`src/tools/hivemind-plan.ts`](/Users/apple/hivemind-plugin/src/tools/hivemind-plan.ts)
- [`src/tools/hivemind-session-memory.ts`](/Users/apple/hivemind-plugin/src/tools/hivemind-session-memory.ts)

Reason:

- the live `src` direction is already moving TODO/task intent into task manifests and graph-backed task state instead of a separate `.hivemind/state/todo.json`
- `event-handler.ts` already translates `todo.updated` into canonical task-manifest mutations
- `state-mutation-queue.ts` and `manifest.ts` define the canonical write path and shape for task data
- `hivemind-session-memory.ts` already owns TODO-Pending queue behavior for off-track work instead of preserving a separate runtime TODO silo

Constraint:

- there is no one-file `src` replacement today
- `P1-C.2` must avoid preserving `todo.json` as a fourth task authority

### `hiveops_export.ts`

Closest canonical owner bundle:

- [`src/lib/session-export.ts`](/Users/apple/hivemind-plugin/src/lib/session-export.ts)
- [`src/tools/hivemind-cycle.ts`](/Users/apple/hivemind-plugin/src/tools/hivemind-cycle.ts)
- checkpoint snapshots in [`src/lib/state-mutation-queue.ts`](/Users/apple/hivemind-plugin/src/lib/state-mutation-queue.ts)

Reason:

- these are the current `src` export/archive surfaces
- export and checkpoint/handoff behavior belongs with canonical session/export ownership, not with a plugin-local state-coupled tool family
- `state-mutation-queue.ts` already owns canonical checkpoint snapshots inside runtime state, so plugin-local checkpoint files should not remain a separate authority path

Constraint:

- `session-export.ts` currently handles session archive/export, not handoff/checkpoint artifact emission
- `P1-C.2` must either extend canonical export ownership or add a narrow pure helper in `src/lib/` for handoff/checkpoint generation

## Frozen Classification Matrix

| Surface | Debt Class | Closest `src` owner | Disposition |
|---|---|---|---|
| `.opencode/tool/hiveops_gate.ts` | `direct-state-writer debt` | `src/lib/gatekeeper.ts` | `migrate business logic into src; wrapper temporary only if runtime requires` |
| `.opencode/tool/hiveops_sot.ts` | `direct-state-writer debt` | `src/lib/sot-governance.ts` | `migrate business logic into src; wrapper temporary only if runtime requires` |
| `.opencode/tool/hiveops_todo.ts` | `direct-state-writer debt` | `event-handler.ts` + `state-mutation-queue.ts` + `manifest.ts` + `hivemind-plan.ts` | `rebuild into canonical src task authority; do not preserve todo.json as active authority` |
| `.opencode/tool/hiveops_export.ts` | `artifact-path debt` | `src/lib/session-export.ts` + `src/tools/hivemind-cycle.ts` | `migrate or rebuild into src export ownership; wrapper temporary only if runtime requires` |

## Frozen `P1-C.1` Decisions

1. Direct `.hivemind/state` writes must leave `.opencode/tool/*`.
2. `hiveops_gate.ts`, `hiveops_sot.ts`, and `hiveops_todo.ts` are not merely wrappers; they still own business logic and state authority that must move to `src`.
3. `hiveops_export.ts` is not a direct state-writer, but it is still residual non-`src` authority because it assembles and emits canonical handoff/checkpoint artifacts from plugin-local logic.
4. OpenCode-specific `tool()` registration is not itself a reason to preserve business logic outside `src`.
5. Temporary wrappers are permitted only as transport layers with zero business rules and zero direct `.hivemind/state` writes.
6. `hiveops_todo.ts` must not be migrated by preserving `.hivemind/state/todo.json` as a long-term active store.
7. `P1-C.2` should assume full deletion bias and grant wrapper survival only where runtime loading genuinely requires it.

## Compatibility Pressure Check

Active-surface scans for this cycle did **not** find live command, workflow, or config references requiring `hiveops_gate`, `hiveops_sot`, or `hiveops_todo` as durable compatibility contracts.

Implication:

- wrapper pressure is lower than it first appeared
- deletion bias should be treated as the default for those three surfaces once `src` absorbs the surviving business logic
- `hiveops_export.ts` may still justify a brief wrapper if OpenCode needs a named transport entrypoint during handoff/cycle cutover

## Three Disposition Paths

### Option A: Keep All Four Tools And Slowly Thin Them

Why reject as default:

- preserves too much `.opencode` authority during Phase 1
- keeps state and artifact semantics outside canonical `src` ownership longer than necessary
- invites another compatibility layer to become de facto runtime truth

### Option B: Full Deletion Bias With Temporary Wrapper Exceptions

Why accept:

- matches the Phase 1 umbrella target in `PLAN.md`
- lets `src` absorb the real business logic first
- allows narrow survival only where OpenCode tool registration still needs a transport layer

### Option C: Immediate Delete-Without-Bridge

Why reject as default:

- too risky before `P1-C.2` rebuilds the accepted logic into `src`
- would collapse operator surfaces before canonical replacements exist
- fits only if a specific tool is proven already dead, which this packet does not claim

## Best Path And Why The Others Are Worse

Option B is the best path because it reduces authority aggressively without pretending the registration boundary and the business-logic boundary are the same thing. The local evidence shows all four files are still real tool definitions using `@opencode-ai/plugin`, and the current OpenCode docs still describe project-level custom tools and plugins as first-class runtime surfaces. That means a clean Phase 1 cut is not “delete the files first and hope,” but “move the meaning into `src`, then leave only zero-logic transport wrappers where the runtime still needs an OpenCode entry point.”

Option A fails because it keeps the exact ambiguity this phase is trying to end: `.opencode` would remain a semi-canonical control plane while `src` tries to absorb policy piecemeal. Option C fails because it skips the migration discipline the repo now needs; it would remove operator-facing surfaces before `src` owns equivalent behavior. Option B is the only path that is aggressive on authority reduction while still evidence-backed and compatible with current OpenCode runtime mechanics.

## Safest Next Narrow Slices

The next implementation-capable slices after this packet should be:

### `P1-C.2a` Gate / SOT / Export Extraction And Wrapper Demotion

Goal:

- move or rebuild gate, SOT, and export business logic under `src`
- eliminate direct `.opencode` ownership from the clearest surviving control-plane debts first
- leave only temporary OpenCode transport wrappers where strictly required

Bounded shape:

1. extract shared pure logic from `hiveops_gate.ts`, `hiveops_sot.ts`, and `hiveops_export.ts` into `src/lib/` and `src/tools/` ownership paths
2. route state mutation through canonical `src` persistence or queue paths
3. demote surviving `.opencode/tool/*` files to transport-only wrappers if OpenCode still needs them
4. delete donor surfaces that no longer meet the donor conditions after extraction
5. do **not** reopen `P1-D` state-shape migration in the same slice

Why this slice first:

- gate, SOT, and export already have plausible `src` landing zones
- they reduce real control-plane debt without waiting for full task-state reconciliation

### `P1-C.2b` TODO Authority Replacement

Goal:

- remove `hiveops_todo.ts` without preserving `todo.json` as a shadow runtime authority

Bounded shape:

1. freeze the canonical TODO/task owner bundle under `src`
2. reroute surviving concepts into plan/task manifests, graph tasks, or TODO-Pending where appropriate
3. delete `hiveops_todo.ts` after reroute
4. do **not** carry forward `.hivemind/state/todo.json` as long-term runtime SOT

Dependency:

- this slice should align with `P1-D.1` state-authority freeze rather than pretending TODO ownership is already clean

## Explicit Non-Goals For The Next Execution Slices

- no bootstrap/profile authority rewrite
- no lineage-separated state-path migration
- no command/agent normalization
- no broad prompt-hook refactor
- no new long-lived `.hivemind/state/*.json` authority introduced as a “temporary” bridge

## Verification Targets For The Future Execution Slices

Minimum required:

- `npx tsc --noEmit`
- targeted tests for any new `src` gate/SOT/TODO/export ownership surfaces
- static grep checks proving `.opencode/tool/*` no longer writes directly into `.hivemind/state` for the migrated slice
- diff review proving any surviving `.opencode/tool/*` file is wrapper-only and path-resolution-safe

External validation used for this packet:

- OpenCode Custom Tools: <https://opencode.ai/docs/custom-tools/>
- OpenCode Plugins: <https://opencode.ai/docs/plugins/>
- OpenCode Config: <https://opencode.ai/docs/config/>
- DeepWiki answer for `anomalyco/opencode` custom tool directory compatibility (singular vs plural path support), queried on `2026-03-10`
