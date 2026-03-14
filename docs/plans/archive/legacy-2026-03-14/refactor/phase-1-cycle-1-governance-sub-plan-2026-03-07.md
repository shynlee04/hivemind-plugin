# Phase 1 Cycle 1 Governance Sub-Plan

**Date**: 2026-03-07
**Category**: `SOT-subordinate`
**Status**: `sub-plan`
**Authority**: Subordinate to root `PLAN.md` only

---

## Objective

Open the first Phase 1 cycle for governance and control-plane unification without entering implementation.

This packet exists to answer one narrow question:

> Which current governance behaviors belong in the future `src`-owned control plane, which plugin-side behaviors look removable, and which behaviors still need deeper proof before any code migration or deletion is authorized?

This cycle is planning and investigation only.
It does **not** authorize runtime edits.

---

## Assumptions

1. `src/` remains the leading candidate for canonical control-plane ownership because the main plugin entry already registers the runtime hooks from `src/index.ts`.
2. `.opencode/plugins/hiveops-governance/` is still an active operational plane because OpenCode project-local plugins auto-load from `.opencode/plugins/` and their hooks run in sequence.
3. The plugin `experimental.chat.messages.transform` hook is currently intended as fallback-only because `context-injection.ts` returns early when core runtime hooks are present.
4. Any plugin behavior that relies on shell scripts may preserve useful policy intent while still being an unacceptable final control-plane implementation.
5. This cycle ends at a human authorization gate for the first implementation-capable slice.

If any assumption is materially wrong, update `PLAN.md` before authorizing execution.

---

## Commands

Planning and evidence commands used or expected for this phase:

- Inspect hook registrations: `rg -n "experimental.chat.messages.transform|experimental.session.compacting|tool.execute.before|tool.execute.after|event:" src .opencode/plugins/hiveops-governance`
- Read canonical runtime entry: `sed -n '1,220p' src/index.ts`
- Read core hook surfaces: `sed -n '1,260p' src/hooks/session-lifecycle.ts`
- Read core hook surfaces: `sed -n '1,280p' src/hooks/messages-transform.ts`
- Read core hook surfaces: `sed -n '1,260p' src/hooks/event-handler.ts`
- Read core hook surfaces: `sed -n '1,260p' src/hooks/compaction.ts`
- Read plugin hook surfaces: `sed -n '1,260p' .opencode/plugins/hiveops-governance/index.ts`
- Read plugin hook surfaces: `sed -n '1,280p' .opencode/plugins/hiveops-governance/hooks/context-injection.ts`
- Read plugin hook surfaces: `sed -n '1,260p' .opencode/plugins/hiveops-governance/hooks/entry-guard.ts`
- Read plugin hook surfaces: `sed -n '1,260p' .opencode/plugins/hiveops-governance/hooks/delegation.ts`
- Read plugin hook surfaces: `sed -n '1,260p' .opencode/plugins/hiveops-governance/hooks/events.ts`
- Read plugin hook surfaces: `sed -n '1,260p' .opencode/plugins/hiveops-governance/hooks/compaction.ts`
- Read plugin hook surfaces: `sed -n '1,260p' .opencode/plugins/hiveops-governance/hooks/intent-classifier.ts`

Verification commands for later authorized implementation cycles:

- Typecheck: `npm run typecheck`
- Boundary checks: `npm run lint:boundary`
- Test suite: `npm test`
- Build parity check: `npm run build`

---

## Project Structure

Phase 1 touches only the governance/control-plane surfaces below:

- Canonical runtime entry: `src/index.ts`
- Core prompt/control hooks: `src/hooks/session-lifecycle.ts`, `src/hooks/messages-transform.ts`
- Core event and compaction hooks: `src/hooks/event-handler.ts`, `src/hooks/compaction.ts`
- Core governance tracking hooks: `src/hooks/tool-gate.ts`, `src/hooks/soft-governance.ts`
- Plugin entry: `.opencode/plugins/hiveops-governance/index.ts`
- Plugin overlap hooks: `.opencode/plugins/hiveops-governance/hooks/context-injection.ts`, `.opencode/plugins/hiveops-governance/hooks/entry-guard.ts`, `.opencode/plugins/hiveops-governance/hooks/delegation.ts`, `.opencode/plugins/hiveops-governance/hooks/events.ts`, `.opencode/plugins/hiveops-governance/hooks/compaction.ts`, `.opencode/plugins/hiveops-governance/hooks/intent-classifier.ts`

No other surfaces are in scope for this cycle.

---

## Boundaries

- Always:
  - Keep `PLAN.md` as the only authority source.
  - Use MCP or web-backed docs for unstable OpenCode/plugin/agent assumptions.
  - Treat plugin code and shell scripts as evidence, not as automatic design authority.
  - Stop before any implementation-capable cycle begins.

- Ask first:
  - Any code edit in `src/**` or `.opencode/**`
  - Any deletion or disablement of plugin hooks
  - Any change that alters session bootstrap, compaction, or tool execution semantics

- Never:
  - Collapse planning and implementation into the same cycle
  - Accept plugin-shell behavior as canonical merely because it is wired
  - Open multiple execution agents on overlapping hook files in the same cycle

---

## Approach Options

### Option A: `src`-canonical convergence with plugin minimization

Treat `src` as the destination control plane now.
Use Phase 1 only to decide which plugin behaviors survive as temporary fallback wrappers, which policy ideas migrate into `src`, and which plugin behaviors are deleted after proof.

### Option B: dual-plane stabilization

Keep both `src` and `.opencode` active, but tighten the boundaries and leave both in place longer.
This reduces near-term churn but preserves long-term ambiguity and makes every later hook decision harder to prove.

### Option C: plugin-first extraction

Treat the plugin as the richer implementation and gradually absorb it into `src`.
This is attractive if script wiring appears comprehensive, but it risks adopting contaminated or shell-coupled behavior as architecture.

### Recommended

Use **Option A**.
It matches the current root `PLAN.md`, the runtime registration shape in `src/index.ts`, and the existing fallback guard in plugin context injection.

---

## Preliminary Ownership Matrix

| Behavior Family | Current `src` Owner | Plugin Overlap | Preliminary Disposition | Reason |
|---|---|---|---|---|
| Per-turn governance and prompt injection | `src/hooks/session-lifecycle.ts`, `src/hooks/messages-transform.ts` | `hooks/context-injection.ts`, `hooks/intent-classifier.ts` | `src canonical`, plugin fallback only | `src` already owns the main registration path; plugin context injection exits early when core hooks are present |
| Session bootstrap and identity seeding | `src/hooks/event-handler.ts` | `hooks/entry-guard.ts`, `hooks/events.ts` | donor semantics only | bootstrap and lineage classification matter, but plugin shell-script execution is not yet proven as final architecture |
| Tool governance and delegation enforcement | `src/hooks/tool-gate.ts`, `src/hooks/soft-governance.ts` | `hooks/delegation.ts` | mixed: policy donor, implementation suspect | core path is advisory and tracked; plugin path still blocks and shells out, which conflicts with current canonical direction |
| Compaction preservation and recovery | `src/hooks/compaction.ts` | `hooks/compaction.ts` | donor semantics only | plugin recovery ideas may be useful, but hook ownership is already duplicated |
| Event-driven side effects and state sync | `src/hooks/event-handler.ts` | `hooks/events.ts` | needs deeper proof | plugin events run many scripts with operational value, but not all belong in the future runtime control plane |

---

## Preliminary Donor vs Delete vs Deeper-Proof Matrix

### Donor semantics to evaluate

- entry detection and lineage classification intent
- compaction recovery and handoff synthesis intent
- selective event-side operational checks that support validation without becoming a second runtime owner
- delegation and scope policy rules, but not necessarily the current script-blocking mechanism

### Likely deletion or demotion candidates

- plugin-side permanent ownership of `experimental.chat.messages.transform`
- plugin-side permanent ownership of `experimental.session.compacting`
- plugin-side hard-blocking governance as the primary enforcement plane
- any shell-script path that duplicates already-canonical `src` logic without adding unique safety value

### Needs deeper proof before classification

- whether any `gx-*` event scripts must remain operationally active after `src` becomes sole runtime owner
- whether lineage classification should live in runtime hooks, tools, or a separate bootstrap path
- whether plugin-side recovery data can be reduced to evidence generation rather than hook-time mutation

---

## Success Criteria

This cycle is complete when all are true:

1. The active Phase 1 surfaces are explicitly mapped to one ownership question.
2. The plugin overlap areas are grouped into `donor semantics`, `likely deletion/demotion`, or `needs deeper proof`.
3. The next implementation-capable slice is narrowed enough to fit in one authorized cycle.
4. This packet stays subordinate to `PLAN.md` and does not claim final authority.
5. The cycle ends by requesting explicit authorization for the next slice instead of beginning implementation.

---

## Open Questions

1. Should the first implementation-capable Phase 1 slice target prompt injection ownership first, or event/bootstrap ownership first?
2. Which `gx-*` script behaviors are required as operational evidence generators even if hook ownership moves fully into `src`?
3. Does lineage classification remain necessary at hook time, or should it be converted into an explicit tool-driven or packet-driven decision?

---

## Stop Condition

Stop after saving this packet and reporting the recommended next authorized cycle.

Do **not** edit runtime code, delete plugin paths, or open an implementation subagent from this packet alone.
