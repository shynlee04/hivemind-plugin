# Hivemind Architectural Principle — Mirror, Not Owner

**Date:** 2026-06-04
**Source:** User architectural correction during `/hivemind-setup` design
**Status:** Binding principle for all future Hivemind work

---

## The Principle

> **Hivemind does not own state. It mirrors selective events emitted by the OpenCode API.**

Hivemind is a **runtime composition engine** (harness), not a platform. Where the harness has its own version of an OpenCode concept, that is a **flaw to be abolished**, not a feature to be documented.

---

## Application to the Hivemind Architecture

### session-tracker (current FLAW)
- **Current state:** records AND exposes state. Has its own session record, hierarchy, manifest, project continuity.
- **Correct state:** subscribes to OpenCode SDK events (`session.created`, `session.deleted`, `session.completed`, `session.error`, etc.), records a selective mirror, exposes a read view of those events.
- **Symptom of flaw:** The recent S5/S5b/S5c panel-spawn bug chain. SessionManager was constructing its own state (pane tracking) instead of reflecting OpenCode's session lifecycle.
- **Action:** Audit `src/features/session-tracker/` and `src/task-management/continuity/` — identify what is duplicated state vs what is genuine mirror, abolish the duplicates.

### trajectory (TBD — needs audit)
- If trajectory is "history of which tools ran when", it could be a mirror.
- If it includes state, judgments, or decision trees, it might be a flaw.
- **Action:** Audit. Distinguish: (a) recorded events from OpenCode, (b) inferred relationships (legitimate), (c) duplicated state (flaw).

### agent-work-contract (TBD)
- Contracts are about agreements, not state. May be valid Hivemind concept.
- BUT: if it tracks "which session has which contract" and that overlaps with OpenCode's session metadata, it's a flaw.
- **Action:** Audit.

### project-continuity (TBD)
- "Continuity" suggests state preservation. Should be derived from OpenCode's session continuity.
- **Action:** Audit. If it duplicates OpenCode's session state, abolish.

### workspace (if it exists)
- User said: Hivemind owns no OpenCode runtime. Workspace is OpenCode's domain.
- **Action:** If `.hivemind/workspace/` exists, abolish. Use OpenCode's `OPENCODE_WORKSPACE_ID` (when set) or the default single-workspace model.

### tmux integration (PARTIALLY VALID)
- tmux is a terminal multiplexer, not an OpenCode concept. Hivemind's tmux integration provides **panel observability** of OpenCode's session lifecycle — this is a legitimate mirror+view function.
- BUT: if the harness spawns its own tmux server or maintains its own pane state that isn't tied to OpenCode's session ID, it's a flaw.
- **Action:** Verify that the tmux integration is keyed on `session.id` (OpenCode's authoritative ID), not on Hivemind's own internal IDs.

---

## Mapping to Audit Tracks

| Audit track | Mirror-or-owner verdict |
|---|---|
| T1 (tool surface) | Tools should query OpenCode SDK for session state, not maintain their own. |
| T2 (session-tracker) | **FLAW** — must become pure mirror. |
| T3 (tmux integration) | **PARTIALLY VALID** — must be keyed on OpenCode session ID. |
| T4 (engine/lib topology) | N/A — engines process events; they can be Hivemind's own. |
| T5 (schema unification) | The "status" field should be OpenCode's status enum, not Hivemind's. |
| T6 (progressive disclosure) | Query the OpenCode SDK progressively, not a duplicated store. |
| T7 (edge cases: parallel sessions) | OpenCode's port allocation + session routing is the source of truth. Hivemind should query it. |
| T8 (tool consolidation) | Remove tools that maintain duplicated state; keep tools that query/mirror. |
| T9 (delegation intelligence) | Query OpenCode SDK for `session.messages`, `session.tools`, etc. — don't maintain a parallel log. |

---

## Affected Work-in-Progress

1. **S5c fix (commit 74275d28)** — added `createSessionPersistence` to write `.hivemind/state/tmux-sessions/<sid>.json`. Under the mirror-not-owner principle, this is **also a flaw** — the persistence file duplicates session ID → pane ID mapping that should come from the live tmux-server state.
   - **Decision needed:** keep persistence (idempotency for tmux restart) or abolish (query tmux-server live via `tmux list-panes`).
   - **Leaning toward:** keep as ephemeral cache, not durable state. Cache lifetime = single opencode session.

2. **SessionManager construction with persistence** (S5b wiring + S5c fix) — needs review under the new principle.

3. **`.hivemind/session-tracker/`** — the entire 24+ session directories. Are they mirrors of OpenCode SDK calls, or duplicated state? Needs audit.

4. **`.hivemind/state/session-continuity.json`** — duplicated state? Should be derived from OpenCode's session export.

5. **`.hivemind/state/delegations.json`** — Hivemind's own concept (delegations are Hivemind-specific, not OpenCode's). This may be VALID (not a flaw).

---

## Decision Framework (for future work)

When adding any new state, persistence, or tracking to Hivemind, ask:

1. **Can I get this from the OpenCode SDK instead of maintaining my own?**
   - YES → mirror only; cache briefly for performance
   - NO → is it a Hivemind-specific concept (e.g., delegation)?
     - YES → Hivemind owns it legitimately
     - NO (it duplicates OpenCode) → abolish

2. **Does this state serve a query that OpenCode SDK can answer?**
   - YES → expose the SDK call as a tool, don't duplicate
   - NO (genuine Hivemind concern) → keep

3. **When OpenCode's state changes, does Hivemind's state stay in sync?**
   - YES (via event subscription) → legitimate mirror
   - NO (drift possible) → abolish or treat as ephemeral

---

## Impact on Open Audit

The 9-track audit now has a new lens: **"Is this concept duplicated from OpenCode?"** Most tracks (T1, T2, T5, T6, T7, T8, T9) need re-auditing with this lens. T3 (tmux) needs verification. T4 (engines) is N/A.

The re-audited output should be a list of Hivemind concepts to **abolish** vs **keep** vs **mirror-only**.

---

## Related: Locked Q6 Decision

This principle is **consistent with** the locked Q6 governance decision (`docs/proposals/VALIDATION-DECISIONS-2026-04-25.md`):
- `.hivemind/` is the canonical internal state root
- `.opencode/` is ONLY for OpenCode primitives (agents, skills, commands)
- The two have different write authority

The new principle goes further: even within `.hivemind/`, **most state should be ephemeral mirrors**, not durable copies.

---

## Open Questions

1. **Scope of abolition:** do we abolish ALL `.hivemind/state/` files, or only the duplicated ones? Some may be legitimate (delegations, contract data).
2. **Migration path:** for state we're abolishing, do we keep `.hivemind/state/` for back-compat or wipe?
3. **Performance trade-off:** live SDK queries for every tool call — is this acceptable latency? Need a cache layer.
4. **Test seam:** if we abolish duplicated state, do we lose unit-test seams that mock it?
