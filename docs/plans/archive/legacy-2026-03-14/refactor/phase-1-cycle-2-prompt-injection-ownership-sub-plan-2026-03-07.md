# Phase 1 Cycle 2 Prompt Injection Ownership Sub-Plan

**Date**: 2026-03-07
**Category**: `SOT-subordinate`
**Status**: `implementation-capable-sub-plan`
**Authority**: Subordinate to root `PLAN.md` only

---

## Objective

Define the first implementation-capable Phase 1 slice for prompt injection ownership only.

This slice answers one narrow question:

> How do we make `src` the sole canonical owner of prompt injection semantics while preserving only a strictly bounded plugin fallback path?

This packet is specific enough to authorize a narrow implementation cycle next.
It does **not** itself authorize code edits.

---

## Assumptions

1. Prompt injection is already architected as three channels in the shared ledger:
   - `core-system`
   - `core-message`
   - `plugin-message`
2. `src/hooks/session-lifecycle.ts` is the canonical owner of system-surface governance injection.
3. `src/hooks/messages-transform.ts` is the canonical owner of message-surface context, anchor, coherence, and checklist injection.
4. `.opencode/plugins/hiveops-governance/hooks/context-injection.ts` is intended to be fallback-only, but the plugin still remains a second operational plane because it also couples prompt-path behavior to plugin-side intent classification and enforcement state.
   That includes profile-write side effects through `hooks/intent-classifier.ts`.
5. The safest first execution slice is ownership normalization and fallback demotion only, not event/bootstrap or delegation refactors.

If any assumption proves false during execution preparation, stop and reopen the design decision before editing code.

---

## Objective Success Criteria

This slice is done only when all are true:

1. Prompt injection ownership is explicitly split into:
   - `src` canonical system injection
   - `src` canonical message injection
   - plugin fallback-only transport with no peer ownership
2. No plugin path injects prompt context when core runtime hooks are active.
3. The canonical marker and budget logic are consistent across all prompt channels.
4. The prompt-injection implementation slice can be verified without touching event/bootstrap ownership.
5. The cycle remains narrow enough to fit one atomic implementation commit.
6. Plugin prompt-path side effects that shape routing state are either explicitly preserved as temporary fallback behavior or removed from this slice.

---

## Commands

Focused evidence commands for this slice:

- Hook registration map:
  `rg -n "experimental.chat.system.transform|experimental.chat.messages.transform" src .opencode/plugins/hiveops-governance`
- Canonical system injection:
  `sed -n '1,260p' src/hooks/session-lifecycle.ts`
- Canonical message injection:
  `sed -n '340,720p' src/hooks/messages-transform.ts`
- Shared injection ledger:
  `sed -n '1,260p' src/lib/injection-orchestrator.ts`
- Governance markers:
  `sed -n '1,240p' src/lib/governance-instruction.ts`
- Plugin fallback injection:
  `sed -n '1,260p' .opencode/plugins/hiveops-governance/hooks/context-injection.ts`
- Plugin fallback context builder:
  `sed -n '1,260p' src/lib/plugin-fallback-context.ts`
- Plugin hook registration:
  `sed -n '1,220p' .opencode/plugins/hiveops-governance/index.ts`
- Plugin prompt-path classifier:
  `sed -n '1,220p' .opencode/plugins/hiveops-governance/hooks/intent-classifier.ts`

Verification commands for the later authorized execution cycle:

- Typecheck: `npm run typecheck`
- Boundary checks: `npm run lint:boundary`
- Full test suite: `npm test`
- Build parity: `npm run build`
- Focused tests, if added:
  `npx tsx --test tests/*.test.ts`

---

## Project Structure

Only these files are in scope for the next implementation-capable cycle:

- `src/hooks/session-lifecycle.ts`
- `src/hooks/messages-transform.ts`
- `src/lib/injection-orchestrator.ts`
- `src/lib/governance-instruction.ts`
- `.opencode/plugins/hiveops-governance/hooks/context-injection.ts`
- `.opencode/plugins/hiveops-governance/hooks/intent-classifier.ts`
- `.opencode/plugins/hiveops-governance/index.ts`

Optional supporting evidence only:

- `src/lib/plugin-fallback-context.ts`
- tests directly related to injection ownership or fallback behavior

Out of scope:

- `src/hooks/event-handler.ts`
- `src/hooks/compaction.ts`
- `.opencode/plugins/hiveops-governance/hooks/events.ts`
- `.opencode/plugins/hiveops-governance/hooks/entry-guard.ts`
- `.opencode/plugins/hiveops-governance/hooks/delegation.ts`

---

## Code Style

The target style for this slice is explicit single-owner routing, with fallback behavior visible at the boundary instead of hidden in parallel logic.

```ts
if (coreRuntimeHooksPresent(worktree)) {
  return
}

if (presence.core_system || presence.core_message || presence.plugin_message) {
  return
}

// Fallback-only transport below this line.
```

Preferred style rules:

- owner decision first
- fallback check second
- budget reservation third
- mutation last

---

## Testing Strategy

Execution for this slice should add or update only ownership/fallback tests, not broad lifecycle coverage.

Testing levels:

- unit or focused integration tests for prompt channel ownership
- regression test for plugin fallback remaining silent when core hooks are active
- regression test for shared-ledger behavior across `core-system`, `core-message`, and `plugin-message`
- existing repo-wide verification after focused tests pass

Required verification intent:

- prove no duplicate injection when core hooks are active
- prove plugin fallback still works when canonical core hooks are unavailable
- prove child-session minimization behavior is not regressed accidentally

---

## Boundaries

- Always:
  - keep changes confined to prompt injection ownership
  - preserve the shared injection ledger as the single budget authority
  - preserve fallback capability until replacement proof exists
  - update JSDoc when changing any touched function

- Ask first:
  - any edit that expands into event/bootstrap or compaction ownership
  - any deletion of plugin files instead of demotion to no-op/fallback
  - any new dependency or shell-script redesign

- Never:
  - mix prompt injection changes with event/delegation cleanup
  - make the plugin a peer prompt owner again
  - remove fallback without proof that core-only behavior is safe

---

## Approaches

### Option A: strict src ownership with explicit plugin demotion

Keep all canonical prompt semantics in `src`.
Reduce plugin prompt-path logic to a visibly bounded fallback transport that activates only when core hooks are absent and no prompt channel is already present.

### Option B: absorb plugin prompt semantics into src before demotion

Pull plugin-side intent-classification and fallback semantics into `src` first, then simplify the plugin.
This may recover useful ideas, but it increases slice size and makes proof harder.

### Option C: delete plugin prompt injection immediately

Remove plugin prompt injection now and trust `src` completely.
This is the cleanest shape, but it is too risky for the first implementation-capable slice because fallback behavior still exists by design.

### Recommended

Use **Option A**.
It is the smallest slice, matches the current shared-ledger architecture, and preserves fallback while clearly demoting it.

---

## Design

### Ownership Model

`src/hooks/session-lifecycle.ts` owns system prompt governance.

`src/hooks/messages-transform.ts` owns message-surface context injection:

- first-turn coherence
- clarification packet
- first-turn confirmation
- cognitive packed state
- anchor fallback
- pre-stop checklist
- governance reminders moved into the message channel

`.opencode/plugins/hiveops-governance/hooks/context-injection.ts` must remain fallback transport only:

- no ownership of canonical semantics
- no prompt injection when core runtime hooks are present
- no prompt injection when any prompt channel is already present
- no hidden secondary decision path that competes with `src`

### Plugin Prompt-Path Coupling

The plugin prompt path is not only fallback transport today.
It also couples first-user-message lineage classification through `hooks/intent-classifier.ts` in the same `experimental.chat.messages.transform` registration path.
That classifier mutates enforcement state and persists lineage/agent information into session profile files, so the plugin still shapes routing state from within the prompt hook path.

That coupling is why prompt injection ownership is still a valid Phase 1 problem even though the plugin context block already returns early in some cases.

### First Execution Slice

The next implementation-capable cycle should do only this:

1. make the ownership contract explicit in code and tests
2. ensure plugin prompt injection path is visibly fallback-only
3. gate `intent-classifier.ts` behind the same fallback boundary or remove it from the always-on prompt path
4. decide whether prompt-path lineage classification remains temporarily tolerated or is extracted from this slice
5. avoid touching event, compaction, or delegation logic

---

## Execution Slice Definition

If the next cycle is authorized for implementation, its owned files should be:

- `src/hooks/session-lifecycle.ts`
- `src/hooks/messages-transform.ts`
- `src/lib/injection-orchestrator.ts`
- `.opencode/plugins/hiveops-governance/hooks/context-injection.ts`
- `.opencode/plugins/hiveops-governance/hooks/intent-classifier.ts`
- related injection ownership tests only

The execution cycle should stop immediately if:

- ownership cannot be proven without editing event/bootstrap files
- plugin fallback semantics depend on hidden event-side state not already in scope
- profile-write side effects cannot be isolated without reopening bootstrap/routing design
- the test shape requires wider lifecycle rewrites

Preferred first proof move:

- change the plugin `experimental.chat.messages.transform` path so it becomes observably no-op whenever core hooks are active
- apply the same boundary to `intent-classifier.ts`, not only to `context-injection.ts`
- avoid changing canonical `src` injection behavior in the first execution commit unless tests prove it is necessary

---

## Acceptance Criteria For The Next Implementation Cycle

The next implementation cycle should be approved only if it can satisfy:

1. one clear code owner for system injection
2. one clear code owner for message injection
3. one clearly demoted plugin fallback path
4. a documented decision on prompt-path lineage classification side effects
5. fresh tests covering core-active and core-absent cases
6. repo verification commands run before completion claim

---

## Open Questions

1. Should plugin-side intent classification and profile writes be preserved in the prompt path for now, or separated immediately from prompt transport?
2. Do we need a dedicated test seam for `coreRuntimeHooksPresent()` to prove fallback behavior deterministically?
3. Is the first execution commit better framed as ownership clarification only, or ownership clarification plus prompt-path test hardening?

---

## Stop Condition

Stop after saving this packet, committing it atomically, and requesting explicit authorization for the implementation cycle.

Do **not** edit runtime code from this packet alone.
