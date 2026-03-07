# Phase 1 E Command And Agent Contract Normalization Packet

> **Status**: Deferred subordinate packet
> **Authority**: [`PLAN.md`](/Users/apple/hivemind-plugin/PLAN.md) §7 `Phase 1` and [`phase-1-governance-control-plane-audit.md`](/Users/apple/hivemind-plugin/docs/plans/refactor/phase-1-governance-control-plane-audit.md)
> **Lane**: `P1-E`
> **Date**: `2026-03-07`
> **Last Verified**: `2026-03-08`
> **Depends On**: `P1-B` entry and intent authority, `P1-C` delegation and blocking authority, `P1-F` gate for closeout

---

## 1. Charter

This packet no longer acts as a standalone Phase 1 execution specification.

It is now the subordinate packet for `P1-E`, the command and agent contract normalization lane inside the Phase 1 umbrella. Its job is to normalize command and agent surfaces after runtime governance authority is frozen, not before.

This packet does not authorize runtime hook edits, state-schema merges, or new `src/lib/*` helper modules by itself.

## 2. Why This Packet Was Re-Scoped

The earlier version of this spec treated command and agent refactoring as if it could lead Phase 1.

That is now rejected for two reasons:

1. command and agent contracts are downstream of runtime governance decisions about entry, intent, delegation, and blocking
2. root `commands/` and mirrored `.opencode/commands/` already show owner/mirror drift, so they cannot be treated as peer authority surfaces

The result is:

- runtime governance stays first in `P1-A` through `P1-D`
- command and agent normalization moves to `P1-E`
- platform-integrity defects gate `P1-E` closeout through `P1-F`

`P1-E` is the umbrella lane label introduced by the restructured Phase 1 audit.
It is intentionally a downstream lane, not a pre-existing repo category.

## 3. Current Evidence

### Partial Root Normalization Already Exists

The following root commands already use `skill_loading` and `entry_handling`:

- `commands/hivemind-clarify.md`
- `commands/hivemind-context.md`
- `commands/hivemind-delegate.md`
- `commands/hivemind-pre-stop.md`
- `commands/hivemind-scan.md`

This proves the root command surface is already acting like the evolving owner surface.

### Legacy Command Surface Still Remains

- 21 root command files still use `required_skills` or `entry_gate`
- 27 mirrored `.opencode/commands` files still use `required_skills` or `entry_gate`
- `.opencode/agents/hiveminder.md` still contains `required_skills`
- 9 commands exist only in `.opencode/commands/` and therefore cannot be treated as peer root authorities:
  - `compact.md`
  - `gx-profile.md`
  - `gx-recover.md`
  - `gx-steer.md`
  - `gx-validate.md`
  - `hitea.md`
  - `hitea-arena.md`
  - `hitea-fuzz.md`
  - `hitea-mutate.md`

This proves command and agent contract normalization is incomplete and still split across owner and mirror surfaces.

### Canonical Versus Legacy HiveFiver Surfaces Already Exist In Code

The repo already distinguishes canonical and legacy HiveFiver command surfaces in runtime and sync logic:

- `src/lib/hivefiver-integration.ts` tracks legacy command names such as `hivefiver-start`, `hivefiver-intake`, and `hivefiver-doctor`
- `src/cli/sync-assets.ts` supports a `legacy-compat` profile and reports `canonical only` when legacy commands are excluded
- `tests/sync-assets.test.ts` verifies that core sync excludes `hivefiver-start.md` while retaining canonical HiveFiver commands

That means `P1-E` must split canonical root command normalization from legacy-compat exception handling.

### Current Official OpenCode Constraints

Validated against current official docs:

- skills are discovered from `.opencode/skills`, `.claude/skills`, and `.agents/skills`
- project-local plugins auto-load from `.opencode/plugins/`
- primary agents and subagents are separate operating surfaces

Sources:

- [Skills](https://opencode.ai/docs/skills/)
- [Plugins](https://opencode.ai/docs/plugins/)
- [Agents](https://dev.opencode.ai/docs/agents/)

## 4. `P1-E` Scope

### In Scope

- root command contract normalization after runtime authority is frozen
- mirrored `.opencode/commands` policy resolution
- agent contract cleanup where command or skill-loading rules currently drift
- aligning command and agent surfaces to owner/mirror semantics

### Out Of Scope

- deciding runtime authority for entry, intent, blocking, compaction, or governance state
- introducing new runtime modules unless a prior runtime lane proves they are still required
- broad platform-adapter cleanup beyond the integrity gate needed to close `P1-E`

## 5. Lane Structure

### `P1-E1` Owner And Mirror Declaration

Freeze these rules first:

- root `commands/` are the working owner surface
- `.opencode/commands/` are mirrors, donors, or retirement candidates
- agent markdown surfaces must not redefine runtime governance decisions
- legacy-compat commands must be tracked as exceptions, not mistaken for canonical owners

### `P1-E2` Root Command Normalization

Normalize the remaining root command surfaces so they stop using legacy frontmatter patterns that compete with the runtime governance model.

Priority order:

1. `hivemind-*` commands still using `required_skills` or `entry_gate`
2. `hiveq-*`, `hiverd-*`, `hivefiver-*`, and `hiveminder-*` root commands

Inside the HiveFiver set, split work into:

- canonical command surfaces that should align with the owner model
- legacy-compat exception surfaces such as `hivefiver-start.md`, `hivefiver-intake.md`, and `hivefiver-doctor.md`

### `P1-E3` Mirrored Command Policy

For every mirrored command in `.opencode/commands/`, choose one:

- align to the normalized root owner contract
- demote to mirror-only
- retire if the mirror no longer serves a justified platform role

For `.opencode`-only commands, choose one:

- keep as explicit compat exception
- relocate under a clearer legacy/compat model
- retire if unsupported by the root-owned asset strategy

### `P1-E4` Agent Contract Cleanup

Normalize agent frontmatter and command-facing contract language only after `P1-C` freezes blocking and delegation authority.

This prevents markdown agent files from acting like hidden governance sources.

### `P1-E5` Process Continuity And Skill-Loading Adoption

Adopt process-continuity or skill-loading improvements only where they still match the runtime authority decisions from `P1-B` and `P1-C`.

This means the earlier proposal to create:

- `src/lib/skill-loader.ts`
- `src/lib/entry-handler.ts`
- `src/lib/process-continuity.ts`
- `src/lib/complexity-router.ts`
- `src/hooks/auto-continue.ts`

is deferred until the upstream runtime lanes prove those modules are still necessary and correctly scoped.

## 6. Prerequisites And Stop Conditions

`P1-E` must not execute until all are true:

- `P1-B` has frozen entry and intent authority
- `P1-C` has frozen delegation and blocking authority
- owner/mirror roles are explicit for root versus mirrored command surfaces

`P1-E` may gather evidence before those prerequisites close, but it may not claim command or agent contract completion.

Hard stop conditions:

- a command edit would redefine runtime governance instead of reflecting it
- a mirrored `.opencode/commands` file is being treated as peer authority
- a legacy-compat command is being normalized as if it were canonical
- a skill-routing claim cannot pass the `P1-F` integrity gate

## 7. Verification Targets

`P1-E` is closed only when all are true:

- no root command that remains in scope relies on `required_skills` or `entry_gate` as the effective control model
- mirrored `.opencode/commands` surfaces are aligned, demoted, or explicitly retired
- agent contract surfaces do not compete with frozen runtime governance decisions
- any skill-routing or adapter claim has passed the `P1-F` integrity gate

## 8. Packet Status Map

| Item | Status | Meaning |
|---|---|---|
| this packet | `deferred packet` | valid subordinate lane packet, but not executable yet |
| `phase-1-progress.md` | evidence only | proves partial root normalization already happened |
| earlier core-infrastructure module proposals | deferred ideas | not approved runtime work until upstream lanes freeze |

## 9. Next Action

The next action for this packet is not implementation.

The next action is to keep this packet subordinate while the umbrella opens:

1. `P1-B` decision packet
2. `P1-C` decision packet
3. `P1-F` gate packet for later closeout

Only after those exist may `P1-E` become implementation-capable.
