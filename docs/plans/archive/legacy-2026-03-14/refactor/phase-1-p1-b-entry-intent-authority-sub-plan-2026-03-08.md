# Phase 1 P1-B Entry And Intent Authority Sub-Plan

**Date**: `2026-03-08`
**Category**: `SOT-subordinate`
**Status**: `decision packet`
**Authority**: Subordinate to root [`PLAN.md`](/Users/apple/hivemind-plugin/PLAN.md) and the active Phase 1 umbrella audit at [`phase-1-governance-control-plane-audit.md`](/Users/apple/hivemind-plugin/docs/plans/refactor/phase-1-governance-control-plane-audit.md)
**Lane**: `P1-B`

---

## Objective

Freeze the Phase 1 `P1-B` decision boundary for entry and intent authority without reopening broad runtime refactors.

This packet answers one narrow question:

> Which surface should own session entry/bootstrap side effects, and how should lineage routing stay separate from session-purpose classification before any later unification work is authorized?

This packet is planning-only.
It does **not** authorize runtime code edits by itself.

## Why `P1-B` Is Separate

The current system uses the word "intent" for two different jobs:

1. `lineage routing`
   - determine `hivefiver`, `hiveminder`, or `unresolved`
2. `session purpose classification`
   - determine `discovery`, `research`, `planning`, `implementing`, `debug`, or `testing`

Those jobs currently live on different surfaces and fire at different times.

If they are merged too early, Phase 1 will flatten runtime routing, purpose inference, and command-stage behavior into one oversized change.
That is exactly what this packet avoids.

## Current Evidence

### Competing First-Movers On Session Start

Three different surfaces currently act first on session start:

1. `.opencode/plugins/hiveops-governance/hooks/entry-guard.ts`
   - runs `scripts/detect-entry.sh`
   - conditionally runs `scripts/auto-init.sh`
   - writes `entryDetection`, `classificationPending`, and `classificationDone` into plugin enforcement state
2. `.opencode/plugins/hiveops-governance/hooks/events.ts`
   - resets enforcement state on `session.created` and `session.started`
   - runs `gx-entry-guard.sh`
   - runs `gx-first-turn-refresh.sh`
3. `src/hooks/event-handler.ts`
   - creates `sessions/active/<session-id>/profile.json`
   - writes unresolved profile data on `session.created`

That means entry side effects are already split before the first user message arrives.

### Current Bootstrap Chain

`scripts/detect-entry.sh` decides between:

- `bootstrap_required`
- `classify_required`
- `ready`

It derives that by inspecting:

- `.hivemind/state/brain.json`
- `.hivemind/state/hierarchy.json`
- `.hivemind/sessions/active/*/profile.json`

`scripts/auto-init.sh` can create all three.

The repo also already has a `src` bootstrap surface in `src/tools/hivemind-bootstrap.ts` that creates:

- `brain.json`
- `hierarchy.json`
- `profile.json`

So the bootstrap concern is duplicated across:

- plugin shell bootstrap
- `src` tool bootstrap
- partial `src` event bootstrap

### Current Intent Split

Plugin lineage classification:

- `.opencode/plugins/hiveops-governance/hooks/intent-classifier.ts`
- runs `scripts/classify-intent.sh`
- writes `lineage` and `agent` into `profile.json`
- now exits early when core prompt hooks are present

`src` purpose classification:

- `src/lib/session-intent-classifier.ts`
- pure function
- classifies session purpose and recommends mode/output style
- does **not** persist lineage and does **not** claim agent routing ownership

### Staleness Risk

Because plugin lineage classification is now fallback-only while `src/hooks/event-handler.ts` still creates unresolved profiles on session start:

- `profile.json` can remain unresolved even when `src` is active
- `detect-entry.sh` still prioritizes `profile.json` lineage over `brain.json`
- any future consumer that treats `profile.json` as fresh lineage truth can drift

### Legacy Command Bypass

`commands/hivefiver-start.md` still runs its own startup and classifier scripts.

That makes it an adjacent `P1-E` concern with `P1-B` implications:

- it matters to entry/intent integrity
- it should **not** become the owner of entry or lineage decisions for runtime Phase 1

## Touched Surfaces

Primary runtime surfaces:

- `.opencode/plugins/hiveops-governance/hooks/entry-guard.ts`
- `.opencode/plugins/hiveops-governance/hooks/events.ts`
- `.opencode/plugins/hiveops-governance/hooks/intent-classifier.ts`
- `src/hooks/event-handler.ts`
- `src/lib/session-intent-classifier.ts`
- `src/tools/hivemind-bootstrap.ts`

Script surfaces:

- `scripts/detect-entry.sh`
- `scripts/auto-init.sh`
- `scripts/classify-intent.sh`

Adjacent exception surface:

- `commands/hivefiver-start.md`

## Decision Options

### Option A: Plugin-First Entry Owner

Keep plugin entry hooks as the authority and make `src` read their outputs.

Why not:

- keeps the second runtime control plane alive
- leaves `src` event handling subordinate to plugin shell orchestration
- conflicts with the Phase 1 umbrella target

### Option B: Split `src` Ownership, Recommended

Make `src` the owner of session entry/bootstrap side effects first, while keeping lineage routing and session-purpose classification explicitly separate for one more slice.

This means:

- `src` owns session-start bootstrap and profile creation
- plugin entry hooks become fallback-only or no-op when canonical `src` entry ownership is active
- lineage routing remains a separate question from purpose classification
- no broad classifier merge yet

Why this is best:

- smallest change that removes the current first-mover race
- reuses existing `src` bootstrap machinery instead of inventing a third bootstrap path
- preserves the narrowness needed before `P1-C` and `P1-D`

### Option C: Big-Bang Entry Plus Intent Merge

Merge bootstrap, lineage routing, and purpose classification into one unified `src` classifier/entry flow now.

Why not:

- too many concerns at once
- would entangle `P1-B`, `P1-C`, and `P1-D`
- raises the risk of silently breaking later command and state packets

## Frozen `P1-B` Decisions

1. `src` is the intended final owner of session entry/bootstrap side effects.
2. `lineage routing` and `session-purpose classification` remain distinct concerns in `P1-B`.
3. `src/lib/session-intent-classifier.ts` is treated as a purpose classifier, not a lineage classifier.
4. `profile.json` lineage writes are governance-relevant and cannot remain an undefined fallback side effect.
5. `commands/hivefiver-start.md` is an adjacent legacy/compat surface and must not define runtime authority.

## Donor / Fallback / Delete Matrix

| Surface | Classification | Reason |
|---|---|---|
| `src/hooks/event-handler.ts` session-created profile bootstrap | `canonical-owner-candidate` | already active in `src`, needs expansion rather than replacement |
| `src/tools/hivemind-bootstrap.ts` bootstrap payload logic | `donor-to-src-runtime` | already canonical `src` logic for brain/hierarchy/profile creation |
| `src/lib/session-intent-classifier.ts` | `retain-separate` | purpose inference only; do not overload with lineage yet |
| `scripts/detect-entry.sh` | `donor-candidate` | useful deterministic probe, but must not keep plugin as owner |
| `scripts/auto-init.sh` | `temporary donor candidate` | may help bridge bootstrap parity, but long-term owner should be `src` |
| `scripts/classify-intent.sh` | `temporary donor candidate` | still useful for lineage-only routing until a later explicit replacement decision |
| `.opencode/.../hooks/entry-guard.ts` | `fallback-only then delete` | currently useful only as plugin bootstrap owner, which `P1-B` is removing |
| `.opencode/.../hooks/events.ts` session-start branch | `delete or deep-proof` | duplicates session start ownership and adds gx side effects outside the `src` model |
| `.opencode/.../hooks/intent-classifier.ts` | `fallback-only temporary` | already demoted when core hooks are present; not a long-term owner |
| `commands/hivefiver-start.md` | `P1-E compat exception` | adjacent bypass surface, not runtime owner |

## Safest Next Narrow Slice

The next implementation-capable slice after this packet should be:

### `P1-B.1` Session-Created Owner Normalization

Goal:

- make `src` the only active owner of session-created bootstrap side effects

Bounded shape:

1. expand `src/hooks/event-handler.ts` or a `src` helper it calls so `session.created` can establish the minimal canonical bootstrap state, not just unresolved profile creation
2. use existing `src` bootstrap logic as the source for that minimal state rather than preserving plugin shell bootstrap as the owner
3. make plugin `entry-guard.ts` and the session-start branch of `events.ts` observably no-op whenever canonical `src` entry ownership is active
4. do **not** change lineage routing semantics yet
5. do **not** merge `classify-intent.sh` with `session-intent-classifier.ts` yet

Why this slice first:

- it removes the first-mover race
- it unblocks later decisions about lineage writes without forcing them into the same commit

## Explicit Non-Goals For The Next Slice

- no broad `brain.json` versus `enforcement.json` merge
- no delegation/blocking migration
- no command contract normalization
- no removal of all plugin fallback logic
- no unified lineage-plus-purpose classifier

## Verification Targets For The Future Execution Cycle

Existing commands:

- `npm run typecheck`
- `npm test`
- `npm run build`

Recommended targeted tests for the future slice:

- `tests/plugin-entry-owner-boundary.test.ts`
  - prove plugin entry hooks stay silent when canonical `src` entry ownership is active
- `tests/session-created-bootstrap.test.ts`
  - prove `session.created` yields canonical minimal bootstrap state from `src`
- `tests/session-purpose-vs-lineage-boundary.test.ts`
  - prove purpose classification does not overwrite lineage-routing state

Retain current protection:

- `npx tsx --test tests/plugin-intent-classifier-boundary.test.ts`

## Stop Conditions

Stop and reopen the packet if any of these become necessary:

- merging lineage routing with session-purpose classification
- editing command or agent markdown to compensate for unresolved runtime ownership
- broad `.hivemind/` identity normalization beyond governance-critical entry state
- carrying plugin session-start gx scripts forward without proving they belong in the final `src` model

## End State For `P1-B`

`P1-B` is closed only when all are true:

1. one `src` surface owns session-created bootstrap side effects
2. lineage routing and purpose classification are explicitly separated
3. `profile.json` lineage authority is no longer an undefined fallback artifact
4. plugin entry hooks are fallback-only, donor-only, or retired
5. the lane is ready to hand off to `P1-C` and `P1-D` without ambiguity

---

**Ready next cycle**: open the authorized implementation-capable slice `P1-B.1` for session-created owner normalization only.
