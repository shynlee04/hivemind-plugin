# Phase 1 Governance And Control-Plane Audit — Hierarchical Umbrella

> **Status**: Active reference audit
> **Authority**: `PLAN.md` §7 `Phase 1`
> **Last Verified**: `2026-03-08`
> **Scope**: `P1-A` runtime prompt authority · `P1-B` entry and intent authority · `P1-C` delegation and blocking authority · `P1-D` state manifestation, compaction, and session-end ownership · `P1-E` command and agent contract normalization · `P1-F` platform-integrity and symlink gate

---

## 1. Executive Summary

Phase 1 is no longer treated here as one flat refactor wave.

It is a dependency-aware umbrella that starts with runtime governance authority, then moves outward into entry and intent ownership, delegation and blocking, governance-critical state manifestation, command and agent contract normalization, and finally the platform-integrity gate needed to close routing claims safely.

This audit is the canonical Phase 1 reference document subordinate to [`PLAN.md`](/Users/apple/hivemind-plugin/PLAN.md). It does not authorize implementation by itself. Its purpose is to freeze the Phase 1 lane map, classify current packets, and separate:

- direct runtime blockers
- dependent follow-ons
- adjacent integrity gates

## 2. Evidence Baseline

The current Phase 1 baseline remains:

- 6 dual hook collision points across plugin and `src` governance flows.
- 3 intent-classification paths with different semantics:
  - plugin lineage via `classify-intent.sh`
  - plugin persistence via `intent-classifier.ts`
  - `src` session-purpose classification via `session-intent-classifier.ts`
- 2 independent governance state authorities:
  - `brain.json`
  - `enforcement.json`
- partial command normalization in root `commands/`:
  - 5 commands already use `skill_loading` and `entry_handling`
- remaining legacy command surfaces:
  - 21 root command files still use `required_skills` or `entry_gate`
  - 27 mirrored `.opencode/commands` files still use `required_skills` or `entry_gate`
- platform-integrity drift:
  - 40 broken symlinks under adapter skill directories because they target `.agents/skills/*` paths that do not exist in this repo

Current official OpenCode docs still support the key operating assumptions used in this audit:

- plugins auto-load from project-local `.opencode/plugins/` and hooks run in sequence
- skills are discovered from `.opencode/skills/`, `.claude/skills/`, and `.agents/skills/`
- agents and subagents are separate workflow surfaces with different operating roles

Sources:

- [Plugins](https://opencode.ai/docs/plugins/)
- [Skills](https://opencode.ai/docs/skills/)
- [Agents](https://dev.opencode.ai/docs/agents/)

## 3. Before, Active, Next

### Before

- [`PLAN.md`](/Users/apple/hivemind-plugin/PLAN.md) was hardened as the sole refactor SOT.
- [`phase-1-cycle-1-governance-sub-plan-2026-03-07.md`](/Users/apple/hivemind-plugin/docs/plans/refactor/phase-1-cycle-1-governance-sub-plan-2026-03-07.md) opened the first bounded governance cycle.
- Commit `697b07a` closed the first narrow implementation-capable subset by demoting plugin prompt-path intent classification to fallback-only when core hooks are present.
- [`phase-1-cycle-2-prompt-injection-ownership-sub-plan-2026-03-07.md`](/Users/apple/hivemind-plugin/docs/plans/refactor/phase-1-cycle-2-prompt-injection-ownership-sub-plan-2026-03-07.md) defined that prompt-boundary slice.

### Active

- This audit is freezing the hierarchical lane map and packet status model for Phase 1.

### Next

1. `P1-B` entry and intent authority
2. `P1-C` delegation and blocking authority
3. `P1-D` state manifestation plus compaction/session-end ownership
4. `P1-E` command and agent contract normalization
5. `P1-F` platform-integrity and symlink gate

## 4. Umbrella Lane Map

| Lane | Primary Question | Classification | Depends On | Blocks | Current Status |
|---|---|---|---|---|---|
| `P1-A` | Which runtime hook surfaces own per-turn governance injection and fallback semantics? | direct runtime blocker | Phase 0 | `P1-B`, `P1-C`, `P1-D` | active lane with completed subset 1 |
| `P1-B` | Who owns session entry, bootstrap detection, profile writes, and lineage vs purpose classification? | direct runtime blocker | `P1-A` framing | `P1-C`, `P1-D`, `P1-E` | next decision lane |
| `P1-C` | Where do delegation topology, path scope, and hard-stop governance rules live? | direct runtime blocker | `P1-A`, informed by `P1-B` | `P1-D`, `P1-E` | next decision lane |
| `P1-D` | How do governance-critical state writes, compaction, and session-end ownership collapse to one authority? | direct runtime blocker | `P1-B`, `P1-C` | Phase 2 | queued runtime lane |
| `P1-E` | How do commands and agent contracts stop behaving like peer governance authorities? | dependent follow-on | `P1-B`, `P1-C` | Phase 3 | deferred packet |
| `P1-F` | Which symlink and adapter-surface defects block skill-routing or command-surface integrity claims? | adjacent integrity gate | runs with `P1-E` evidence gathering | `P1-E` closeout, Phase 3a | required gate, not universal blocker |

### Runtime Dependency Chain Inside The Umbrella

The runtime side of the umbrella is finer-grained than the lane names suggest:

1. prompt/control authority must be frozen first
2. then entry, bootstrap, and intent ownership can be decided safely
3. then blocking and delegation authority can move into `src`
4. then governance-critical state merge, compaction, and session closeout can be collapsed

That runtime chain is why `P1-E` and `P1-F` are linked to Phase 1 but do not lead it.

## 5. Lane Details

### `P1-A` Runtime Prompt And Control-Plane Authority

**Question**:
Which prompt/control surfaces remain active governance owners on every turn, and which plugin behavior must be demoted to fallback-only or removed?

**Current evidence**:

- `[direct runtime blocker]` `messages.transform` is still dual-registered across plugin and core.
- `[direct runtime blocker]` system prompt governance and plugin message-level governance still share budget without one semantic owner.
- `[completed subset]` plugin `intent-classifier.ts` now exits when core hooks are present, via commit `697b07a`.
- `[dependent follow-on]` broad removal of `coreRuntimeHooksPresent()` is not yet safe until later lanes freeze entry, delegation, and state ownership.

**What is executable now**:

- bounded prompt-surface ownership fixes that do not redefine entry, state, or delegation authority

**What must wait**:

- deleting plugin prompt hooks entirely
- removing fallback semantics altogether

**Lane close criteria**:

- canonical prompt/control authority is fully frozen in `src`
- remaining plugin prompt behavior is either explicitly fallback-only or retired
- no file-existence guard is the thing deciding long-term governance ownership

### `P1-B` Entry And Intent Authority

**Question**:
Who owns `session.created`, bootstrap detection, lineage persistence, and the separation between lineage routing and session-purpose classification?

**Current evidence**:

- `[direct runtime blocker]` `entry-guard.ts`, `events.ts`, and `event-handler.ts` still create competing first-movers on session start.
- `[direct runtime blocker]` plugin `profile.json` writes happen only through plugin intent classification, while `src` purpose classification does something different entirely.
- `[direct runtime blocker]` `hivefiver-start.md` is a third entry path that can bypass hook ownership.
- `[dependent follow-on]` the earlier absorb-everything directive to merge all intent classification at once is too coarse; lineage routing and session-mode classification must be separated before unification.

**What is executable next**:

- a decision packet that freezes one owner for:
  - bootstrap detection
  - session profile writes
  - lineage classification
  - session-purpose classification boundaries

**What must wait**:

- broad command/agent contract normalization
- state merge that assumes entry and lineage ownership are already frozen

**Lane close criteria**:

- one authority owns session entry and bootstrap side effects
- lineage routing output and session-purpose output are explicitly separate
- `profile.json` authority is either migrated, demoted, or scheduled for retirement with no ambiguity

### `P1-C` Delegation And Blocking Authority

**Question**:
Where do topology, scope, and hard-stop governance rules live once Phase 1 is done?

**Current evidence**:

- `[direct runtime blocker]` GX-Pack is still the only surface that can hard-block tool execution.
- `[direct runtime blocker]` `src/hooks/tool-gate.ts` remains advisory while plugin delegation can throw.
- `[direct runtime blocker]` `types.ts` carries topology and path-scope rules that are not yet canonical `src` contracts.
- `[dependent follow-on]` agent markdown profiles still describe roles, but runtime blocking must be frozen before command or agent contract cleanup can be trusted.

**What is executable after `P1-B`**:

- a bounded authority move that gives `src` the blocking contract for topology and scope

**What must wait**:

- large-scale agent frontmatter cleanup
- command normalization that assumes those rules are already canonical

**Lane close criteria**:

- blocking power for scope and delegation resides in `src`
- one topology and path-scope contract is canonical
- plugin-side delegation logic is fallback-only, donor-only, or retired

### `P1-D` State Manifestation, Compaction, And Session-End Ownership

**Question**:
How do governance-critical state writes, compaction, and session closeout stop diverging across plugin and core surfaces?

**Current evidence**:

- `[direct runtime blocker]` `brain.json` and `enforcement.json` model overlapping governance state independently.
- `[direct runtime blocker]` turn counts and lineage fields can diverge across those state surfaces.
- `[direct runtime blocker]` compaction and session-end behavior are still dual-owned across plugin and core.
- `[dependent follow-on]` full identity and store rationalization remains Phase 2, but the governance-critical merge needed to end control-plane drift belongs here.

**What is executable after `P1-B` and `P1-C`**:

- a bounded state-authority packet for governance-critical fields only
- a bounded compaction/session-end packet if state ownership is already frozen

**What must wait**:

- broader `.hivemind/` identity normalization
- non-governance store cleanup

**Lane close criteria**:

- governance-critical duplicated state no longer diverges as peer authorities
- compaction has one owner
- session closeout and handoff governance are not double-fired

### `P1-E` Command And Agent Contract Normalization

**Question**:
How do root commands and agent contracts reflect the frozen Phase 1 runtime model without acting like a second governance authority?

**Current evidence**:

- `[dependent follow-on]` 5 root commands already use `skill_loading` and `entry_handling`:
  - `hivemind-clarify.md`
  - `hivemind-context.md`
  - `hivemind-delegate.md`
  - `hivemind-pre-stop.md`
  - `hivemind-scan.md`
- `[dependent follow-on]` 21 root command files still use `required_skills` or `entry_gate`.
- `[dependent follow-on]` 27 mirrored `.opencode/commands` files still use legacy command frontmatter.
- `[dependent follow-on]` `.opencode/agents/hiveminder.md` still exposes `required_skills`, showing agent-contract drift is real.
- `[dependent follow-on]` 9 commands exist only in `.opencode/commands/`, so they must be treated as compat exceptions, mirrors, or retirement candidates rather than peer authorities.
- `[owner/mirror evidence]` runtime and sync code already distinguish canonical versus legacy HiveFiver command surfaces through `legacy-compat` handling in `src/lib/hivefiver-integration.ts` and `src/cli/sync-assets.ts`.
- `[owner/mirror evidence]` the root command set already diverged into partial normalization while mirrored `.opencode/commands` lag, so these surfaces cannot be treated as peer authorities.

**What is executable after `P1-B` and `P1-C`**:

- a subordinate `P1-E` packet that normalizes root commands first, then resolves mirrored command policy, then updates agent contract surfaces
- a subordinate `P1-E` packet that also separates canonical command normalization from legacy-compat exception handling

**What must wait**:

- creating `src/lib/skill-loader.ts` or other runtime-facing helper modules unless `P1-B` and `P1-C` prove they are still needed
- claiming Phase 1 command closure before the platform-integrity gate is run

**Lane close criteria**:

- command and agent surfaces no longer redefine governance decisions that belong to runtime
- owner/mirror roles are explicit for root versus mirrored command surfaces
- root and mirrored command policy is aligned, retired, or explicitly separated

### `P1-F` Platform-Integrity And Symlink Gate

**Question**:
Which broken links and phantom skill references make command or skill-routing claims unsafe?

**Current evidence**:

- `[adjacent integrity gate]` 40 symlinks are broken under adapter skill directories.
- `[adjacent integrity gate]` those broken links point at `.agents/skills/*` targets that do not exist in this repo.
- `[adjacent integrity gate]` current official skill discovery rules include `.opencode/skills`, `.claude/skills`, and `.agents/skills`, so broken adapter links are not cosmetic.
- `[adjacent integrity gate]` this gate is coupled to command and skill-routing claims, not to every runtime hook refactor.

**What is executable alongside `P1-E`**:

- inventory and classification of broken links
- explicit decisions for each adapter surface:
  - repair
  - delete
  - defer with gate

**What must wait**:

- full ecosystem cleanup beyond the minimal gate needed to close `P1-E`

**Lane close criteria**:

- skill-routing claims are backed by real targets or explicit deferral
- no Phase 1 packet claims platform integrity while broken links remain unaccounted for

## 6. Packet Classification Map

| Document | Lane | Packet Status | Role |
|---|---|---|---|
| [`phase-1-governance-control-plane-audit.md`](/Users/apple/hivemind-plugin/docs/plans/refactor/phase-1-governance-control-plane-audit.md) | umbrella | `active packet` | canonical Phase 1 reference audit |
| [`phase-1-cycle-1-governance-sub-plan-2026-03-07.md`](/Users/apple/hivemind-plugin/docs/plans/refactor/phase-1-cycle-1-governance-sub-plan-2026-03-07.md) | umbrella framing | `completed subset` | initial scoping packet that opened Phase 1 safely |
| [`phase-1-governance-control-plane-sub-plan-2026-03-07.md`](/Users/apple/hivemind-plugin/docs/plans/refactor/phase-1-governance-control-plane-sub-plan-2026-03-07.md) | umbrella framing | `obsolete packet` | duplicate framing packet that should not compete with the cycle-1 packet |
| [`phase-1-cycle-2-prompt-injection-ownership-sub-plan-2026-03-07.md`](/Users/apple/hivemind-plugin/docs/plans/refactor/phase-1-cycle-2-prompt-injection-ownership-sub-plan-2026-03-07.md) | `P1-A` | `completed subset` | narrow prompt-boundary packet already implemented in `697b07a` |
| [`phase-1-command-agent-refactor-spec-2026-03-07.md`](/Users/apple/hivemind-plugin/docs/plans/refactor/phase-1-command-agent-refactor-spec-2026-03-07.md) | `P1-E` | `deferred packet` | subordinate command/agent lane packet that must wait for runtime authority freeze |
| [`phase-1-progress.md`](/Users/apple/hivemind-plugin/docs/plans/refactor/phase-1-progress.md) | `P1-E` evidence | evidence only | proof of partial root command normalization, not authority |

## 7. What Is Superseded

The earlier flat directives are superseded in two important ways:

- broad absorb/delete lists are no longer treated as executable in one wave
- the earlier command/agent spec is no longer allowed to behave like an independent Phase 1 master packet

Replacement rule:

- each lane must first freeze authority boundaries
- then produce one bounded subordinate packet
- then request authorization before execution

## 8. Phase 1 Close Criteria

Phase 1 is closed only when all are true:

- one `src`-owned governance flow remains active across runtime prompt/control, entry, delegation/blocking, governance-critical state, compaction, and session-end governance behavior
- no `.opencode` runtime governance hook remains an active control-plane authority
- fallback-by-file-existence semantics are eliminated or explicitly retired
- command and agent contract surfaces no longer compete with runtime governance decisions
- any command or skill-routing claim has passed the `P1-F` gate or carries an explicit deferred decision recorded in [`PLAN.md`](/Users/apple/hivemind-plugin/PLAN.md)

---

> **End of Phase 1 Umbrella Audit**
> Next action: open the `P1-B` decision packet under the authority of [`PLAN.md`](/Users/apple/hivemind-plugin/PLAN.md)
