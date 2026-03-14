# Phase 1 Governance Control-Plane Sub-Plan

> Status: Active subordinate packet
> Type: plan
> Authority: Subordinate to `/Users/apple/hivemind-plugin/PLAN.md`
> Phase: `Phase 1: Governance And Control-Plane Unification`
> Date: `2026-03-07`

## Objective

Define the safe Phase 1 route for ending the dual-control-plane condition without reopening broad runtime refactors.

This packet does not authorize implementation by itself. It narrows the next cycle, records current evidence, and requests the next operator authorization.

## Assumptions

1. Root [`PLAN.md`](/Users/apple/hivemind-plugin/PLAN.md) remains the sole human-readable SOT.
2. This cycle is planning and investigation only; no runtime code changes are authorized yet.
3. `src/**` is the intended final owner of runtime governance semantics.
4. `.opencode/**` may still contain donor logic, but only if the donor conditions in [`PLAN.md`](/Users/apple/hivemind-plugin/PLAN.md) remain satisfied.

## External Validation

Current official OpenCode docs confirm three relevant constraints:

1. Skills are loaded on demand and should be applied intentionally per task.
2. Plugins run from project/global plugin directories and execute their hooks in sequence.
3. Agents and subagents are distinct workflow surfaces, so planning, exploration, and execution should be routed deliberately rather than mixed.

These points support keeping `src` as the canonical control plane while treating `.opencode` runtime hooks as either fallback-only or removable.

## Commands

Read-only evidence gathering used in this cycle:

- `rg --files .opencode/plugins/hiveops-governance src/hooks src/lib src`
- `sed -n '1,220p' src/index.ts`
- `sed -n '1,260p' src/hooks/session-lifecycle.ts`
- `sed -n '1,260p' src/hooks/messages-transform.ts`
- `sed -n '1,240p' src/hooks/event-handler.ts`
- `sed -n '1,240p' src/hooks/compaction.ts`
- `sed -n '1,260p' .opencode/plugins/hiveops-governance/hooks/context-injection.ts`

Restricted-zone verification gates for a later execution cycle:

- `npm run typecheck`
- `npx tsx --test tests/injection-surface-ownership.test.ts`
- `npx tsx --test tests/child-session-injection-policy.test.ts`
- `npx tsx --test tests/tool-gate-readonly.test.ts`

## Scope Surfaces

Primary `src` surfaces:

- `src/index.ts`
- `src/hooks/session-lifecycle.ts`
- `src/hooks/messages-transform.ts`
- `src/hooks/event-handler.ts`
- `src/hooks/compaction.ts`
- directly imported governance helpers under `src/lib/**`

Primary `.opencode` surfaces:

- `.opencode/plugins/hiveops-governance/index.ts`
- `.opencode/plugins/hiveops-governance/hooks/context-injection.ts`
- `.opencode/plugins/hiveops-governance/hooks/entry-guard.ts`
- `.opencode/plugins/hiveops-governance/hooks/delegation.ts`
- `.opencode/plugins/hiveops-governance/hooks/events.ts`
- `.opencode/plugins/hiveops-governance/hooks/compaction.ts`
- `.opencode/plugins/hiveops-governance/hooks/intent-classifier.ts`

## Current Ownership Map

### `src` Current Ownership

- `src/index.ts`
  - canonical plugin assembly point
  - registers the active runtime hooks and tools
  - already behaves like the main governance control-plane entry

- `src/hooks/session-lifecycle.ts`
  - canonical `experimental.chat.system.transform` owner
  - compiles governance instruction, bootstrap, warning, onboarding, and status blocks
  - manages shared per-turn injection budgeting and child-session suppression

- `src/hooks/messages-transform.ts`
  - canonical `experimental.chat.messages.transform` owner on the `src` side
  - owns first-turn coherence, cognitive packing, off-track capture, checklist injection, and auto-realign reminders
  - queues recent-message and first-turn state mutations

- `src/hooks/event-handler.ts`
  - canonical `event` owner on the `src` side
  - bootstraps session profiles on `session.created`
  - tracks idle/file/session events and queues state-manifest mutations

- `src/hooks/compaction.ts`
  - canonical `experimental.session.compacting` owner on the `src` side
  - injects hierarchy, tasks, anchors, memories, and compaction-limit warnings into compacted context

- `src/lib/plugin-fallback-context.ts` and `src/lib/state-snapshot.ts`
  - notable because plugin fallback already depends on `src`-owned data readers and fallback context builders
  - this is evidence that useful fallback semantics already belong under `src`, not `.opencode`

### `.opencode` Current Ownership

- `.opencode/plugins/hiveops-governance/index.ts`
  - registers a second runtime control plane for `tool.execute.before`, `tool.execute.after`, `event`, `experimental.session.compacting`, and `experimental.chat.messages.transform`

- `.opencode/plugins/hiveops-governance/hooks/context-injection.ts`
  - fallback-only message injection path
  - reads unified snapshot from `src` helpers and injects a plugin governance message only when core injectors are unavailable

- `.opencode/plugins/hiveops-governance/hooks/entry-guard.ts`
  - script-driven entry detection and optional bootstrap execution
  - persists entry-detection results into plugin enforcement state

- `.opencode/plugins/hiveops-governance/hooks/delegation.ts`
  - plugin-side tool enforcement, scope blocking, delegation topology checks, and periodic health/audit script execution

- `.opencode/plugins/hiveops-governance/hooks/events.ts`
  - script-driven session start/end, TODO sync, and state-file validation hooks

- `.opencode/plugins/hiveops-governance/hooks/compaction.ts`
  - second compaction flow with handoff purification, schema validation, recovery retrieval, and fallback injection

- `.opencode/plugins/hiveops-governance/hooks/intent-classifier.ts`
  - first-user-message lineage classification and profile persistence

## Overlap And Coupling Risks

1. Per-turn overlap remains real even after the first de-dup slice.
   `src/hooks/session-lifecycle.ts` and `src/hooks/messages-transform.ts` are already canonical injectors, but `.opencode/.../context-injection.ts` still exists as a fallback message injector and `.opencode/index.ts` still registers a full second hook stack.

2. Entry/session bootstrap ownership is split.
   `src/hooks/event-handler.ts` writes session profiles on `session.created`, while `.opencode/.../entry-guard.ts` and `.opencode/.../intent-classifier.ts` also shape profile and lineage state through script-backed logic.

3. Compaction ownership is split.
   `src/hooks/compaction.ts` preserves hierarchy/task context directly, while `.opencode/.../compaction.ts` runs a separate purify/retrieve/validate/inject cycle.

4. Plugin fallback already depends on `src` internals.
   The plugin reads unified state via `src/lib/state-snapshot.ts` and builds fallback context with `src/lib/plugin-fallback-context.ts`, which means some of the valuable logic is already canonically moving into `src` even though the hook still lives in `.opencode`.

5. Delegation and health enforcement still form a second control plane.
   `.opencode/.../delegation.ts` and `.opencode/.../events.ts` remain active policy and script runners, not just passive mirrors.

## Donor / Delete / Unclear Ledger

### Likely Donor

- fallback context shaping logic already implemented under `src/lib/plugin-fallback-context.ts`
- unified snapshot reading in `src/lib/state-snapshot.ts`
- child-session minimization and shared-budget concepts where they reinforce existing `src` patterns instead of creating parallel ownership

### Likely Delete Or Retire

- `.opencode/plugins/hiveops-governance/index.ts` as a long-term full control-plane registrar
- plugin-side event chain as a required runtime owner
- plugin-side delegation enforcement as a permanent second policy plane
- plugin-side compaction flow as a second canonical compaction owner

### Needs Deeper Proof Before Any Decision

- script-backed entry detection from `entry-guard.ts`
- lineage persistence semantics in `intent-classifier.ts`
- any enforcement behavior that currently has no `src` equivalent but may still encode real policy value

## Three Route Options

1. Recommended: `surface-by-surface authority inventory`
   - run the next cycle as a bounded evidence and decision pass
   - classify each Phase 1 surface as `canonical src`, `fallback-only`, `donor`, or `delete`
   - stop before implementation and request one narrow execution slice authorization

2. Faster: `per-turn injector-only slice`
   - focus only on `session-lifecycle.ts`, `messages-transform.ts`, and plugin `context-injection.ts`
   - faster, but it leaves event/delegation/compaction split unresolved and risks falsely declaring Phase 1 “done”

3. Aggressive: `plugin control-plane collapse`
   - plan direct removal of `.opencode` control-plane ownership across entry, events, delegation, and compaction
   - highest risk because script-backed policy behaviors have not yet been fully inventoried

## Recommendation

Option 1 is the safest route because the evidence shows Phase 1 is not only a per-turn prompt problem. The second control plane still exists through plugin event, delegation, entry, and compaction hooks even when the fallback injector does not fire. A surface-by-surface authority inventory keeps the scope honest and lets us freeze ownership decisions before touching any restricted hook.

Option 2 is tempting because the injector conflict is the loudest symptom, but it would under-model the real architecture and likely cause another backward branch when plugin-side event or delegation behavior reappears later. Option 3 is the most direct path to simplification, but it is too aggressive for the current evidence level because some script-backed behaviors may still need to be migrated into `src` rather than simply removed.

## Success Criteria For The Next Cycle

The next authorized Phase 1 cycle should be considered successful only if it produces all of the following:

1. a per-surface authority ledger covering the listed `src` and `.opencode` files
2. a frozen classification of each surface as `canonical src`, `fallback-only`, `donor`, `delete`, or `unclear`
3. one recommended first execution slice small enough to verify with the existing restricted-zone gates
4. no runtime file edits yet

## Boundaries

- Always:
  - treat [`PLAN.md`](/Users/apple/hivemind-plugin/PLAN.md) as the only SOT
  - keep the next cycle inside Phase 1 governance/control-plane scope
  - validate unstable OpenCode/plugin/agent assumptions against current official sources

- Ask first:
  - any code change under `src/hooks/**` or `.opencode/plugins/**`
  - any change that alters hook registration order or runtime ownership
  - any new donor migration that crosses from `.opencode` into `src`

- Never:
  - treat this packet as equal authority to [`PLAN.md`](/Users/apple/hivemind-plugin/PLAN.md)
  - treat `.opencode` as a permanent required runtime layer without re-validation
  - open an implementation cycle from this packet without explicit operator authorization

## Requested Next Authorization

Authorize one of the following:

1. `Phase 1 Cycle 2A` — produce the per-surface authority ledger only
2. `Phase 1 Cycle 2B` — produce the authority ledger plus the first recommended execution slice
3. `Stop` — hold here and revise this packet first
