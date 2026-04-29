---
phase: SE-13
workstream: skill-ecosystem
status: NOT STARTED
depends_on:
  - SE-12
blocks:
  - AS-10
created: 2026-04-29
---

# SE-13: Hivemind Engine Contracts — Context

## Phase Goal
Create reference skills that document how to interact with Hivemind custom engines and state. Agents loading these skills can navigate `.hivemind/` state directories, understand delegation protocols, and use custom engines correctly. Both lineages get their own engine contract skill.

## Starting State
- SE-12 completed: TOOL-CAPABILITY-MATRIX.md exists, all skills declare tool requirements
- Skills currently know nothing about `.hivemind/` state, task queues, delegation styles, or custom engines
- The Hivemind runtime already has these engines (documented in AGENTS.md and architecture docs), but no skills reference them:
  - **`.hivemind/state/`** — continuity.json, delegations.json, session-continuity.json
  - **`.hivemind/state/planning/`** — task persistence via hm-planning-persistence
  - **`.hivemind/event-tracker/`** — session journals and event timeline
  - **Task management:** concurrency.ts (keyed semaphore), queue-key validation
  - **Delegation styles:** WaiterModel (always-background), dual-signal completion detection
  - **Custom engines:** completion-detector.ts, lifecycle-manager.ts, runtime-policy.ts, delegation-manager.ts
  - **Session API:** session-api.ts (typed OpenCode SDK wrappers)
- Agents operating in Hivemind runtime have no skill-level documentation for these systems
- No skill references `.hivemind/` paths or engine APIs

## Deliverables
1. **`hm-hivemind-state-reference` SKILL.md** — Product-dev lineage engine contract covering:
   - `.hivemind/` directory structure and all state files
   - Delegation protocol reference: WaiterModel dispatch, dual-signal completion, delegation-status polling
   - Task queue reference: concurrency, queue-key validation, task status transitions
   - Session continuity: how to persist/resume across sessions
   - Custom engine APIs: completion-detector, lifecycle-manager, runtime-policy
   - Read-only access patterns for hm-agents (they consume state, don't mutate it)
2. **`hf-hivemind-state-reference` SKILL.md** — Cross-lineage variant for meta-builder agents covering:
   - Same `.hivemind/` state documentation as hm-* variant
   - Additional context on how hf-* agents interact with state (e.g., hf-agents-md-sync reads state to detect drift)
   - Delegation protocol access for hf-orchestrator (L0 delegates to hf-specialists via the same protocols)
3. Both skills must pass RICH-8 scorecard (≥ 6/8).

## Acceptance Criteria
- [ ] `hm-hivemind-state-reference` SKILL.md created, passes RICH-8 scorecard
- [ ] `hf-hivemind-state-reference` SKILL.md created, passes RICH-8 scorecard
- [ ] `.hivemind/` directory structure fully documented with file descriptions
- [ ] Delegation protocol reference complete: WaiterModel, dual-signal completion, delegation-status polling
- [ ] Task queue reference complete: concurrency model, queue-key validation, task status transitions
- [ ] Custom engine APIs documented: completion-detector, lifecycle-manager, runtime-policy
- [ ] Session API wrappers documented (session-api.ts)
- [ ] Read/write access boundaries documented per agent depth (L0 read, L1 conditional write, L2 read-only)
- [ ] Cross-reference to SE-12: tools used for engine interaction are declared in TOOL-CAPABILITY-MATRIX.md

## Known Risks
- Engine contracts must stay in sync with `src/lib/` code — if engines change, contracts must be updated
- `.hivemind/` structure may evolve during other workstreams (milestone phases) — contracts may drift
- hf-* variant must not expose internal-only details (gate-* skills are THIS PROJECT ONLY per D-02)
- Reference skills are typically read-only; documenting mutation-capable engines creates a different skill pattern
- Both skills must be kept synchronized (same facts, different lineage framing)

## Skills/Agents Involved
- **Creates:** `hm-hivemind-state-reference` (new), `hf-hivemind-state-reference` (new)
- **References:** `src/lib/` engine code (read-only, verify facts)
- **References:** SE-12 TOOL-CAPABILITY-MATRIX.md (cross-reference tool requirements)
