# GX-Pack — Trajectory

> **Created:** 2026-03-02
> **Module:** gx-pack (Governed eXecution Pack)
> **Parent:** hivefiver-v2 (ALL 6 phases COMPLETE — inherits enforcement architecture)
> **Spec SOT:** `docs/plans/SPEC-GX-PACK-CONTEXT-ENGINE-2026-03-02.md`

---

## Objective

Build a deterministic, stateful context engineering engine that steers HiveMind plugin refactoring through agent delegation, ensures context continuity across sessions, and replaces mechanical validation with semantic chain validation.

---

## Phase Definitions

### Phase 1: Skeleton + Policy Lock

**Goal:** Foundation assets exist, runtime profile builds deterministically, context injection works.

| # | Milestone | Description | Exit Criterion |
|---|-----------|-------------|----------------|
| 1.1 | Module state files | STATE.md + TRAJECTORY.md linked to spec | Machine-parseable, linked to spec |
| 1.2 | Skill created | gx-context-engine SKILL.md + script stubs + references | SKILL.md has trigger text, scripts executable |
| 1.3 | Commands created | gx-steer, gx-recover, gx-validate, gx-profile | All have `<enforcement>` blocks with `!`cmd`` injection |
| 1.4 | Workflows created | recover-loop, semantic-pipeline, session-handoff | Entry/exit criteria, numbered steps, offer_next |
| 1.5 | Context injection hook | messages.transform in plugin | Injects governance context on every LLM turn |
| 1.6 | Entry guard script | gx-entry-guard.sh | Produces identical profile for identical inputs |
| 1.7 | TODO enhancement | hiveops_todo 40-cap + HARD STOP | Rejects >40 subtasks, enforces last-item HARD STOP |

**Gate:** `gx-entry-guard.sh` deterministic + `messages.transform` injects context + plugin compiles.

### Phase 2: Continuity + Semantic Validator

**Goal:** Bidirectional TODO-graph sync, drift detection, semantic validation, export purification all working.

| # | Milestone | Description | Exit Criterion |
|---|-----------|-------------|----------------|
| 2.1 | TODO-graph sync | gx-todo-sync.sh bidirectional | Hierarchy change -> TODO updated; TODO complete -> hierarchy marked |
| 2.2 | Mid-guard | gx-mid-guard.sh drift + depth | Warns at drift >40%, blocks at depth exceeded |
| 2.3 | Semantic validator | gx-semantic-validate.sh | Catches command->workflow->skill mismatches |
| 2.4 | Handoff purifier | gx-handoff-purify.sh | Strips noise, extracts decisions, validates schema |
| 2.5 | hivemaker L3 fix | edit scope tightened | `edit: "*": deny`, explicit allowlist only |
| 2.6 | hiveq monitor | TDD/spec/edge checking | Can verify coverage, has VETO power |

**Gate:** 5-session replay with zero orphan tasks, zero schema violations, zero semantic mismatches.

### Phase 3: SOT Hardening + Operator UX

**Goal:** Full traceability from output to SOT artifact. Delegation audit trail. JSONL searchable exports.

| # | Milestone | Description | Exit Criterion |
|---|-----------|-------------|----------------|
| 3.1 | SOT registration | gx-sot-register.sh automatic | Every export auto-registers in SOT index |
| 3.2 | JSONL export | hiveops_sot JSONL + chaining | `.hivemind/exports/` populated with grep-friendly JSONL |
| 3.3 | Export purification | hiveops_export enhancement | Handoff includes purified content + SOT link |
| 3.4 | Delegation audit trail | JSONL in plugin | `.hivemind/state/delegation-audit.jsonl` tracks all delegations |
| 3.5 | Traceability proof | End-to-end | output -> handoff -> TODO -> hierarchy -> SOT traceable |

**Gate:** End-to-end traceability audit passes. Any decision traceable from output to SOT artifact.

---

## Quality Gates

| Gate | Name | Criteria |
|------|------|----------|
| G0 | Scope Integrity | No edits outside `.opencode/**`, `.hivemind/**`, `docs/**` |
| G1 | Spec Integrity | Acceptance criteria declared per deliverable |
| G2 | Orchestration Integrity | Dependencies explicit, depth constraints enforced |
| G3 | Evidence Integrity | Script outputs and schema validations attached |
| G4 | Export Integrity | Handoff and SOT artifacts linked and searchable |

---

## Decision Log

| # | Decision | Rationale |
|---|----------|-----------|
| D37 | GX-Pack selected over GSD mirror + incremental patch | Stronger deterministic enforcement: semantic validation, graph-synced TODO, SOT-first export |
| D38 | Scripts bundled WITHIN skill, chained from SKILL.md | Skill is unit of deployment; skill orchestrates script execution order |
| D39 | Phase 1 starts from module state + skill skeleton | Foundation-first: state tracking before building mechanisms |

---

## Key Files

| Purpose | File |
|---------|------|
| Spec (SOT) | `docs/plans/SPEC-GX-PACK-CONTEXT-ENGINE-2026-03-02.md` |
| Options matrix | `docs/plans/hivemind-recovery-pack-options-2026-03-02.md` |
| This trajectory | `.hivemind/hive-modules/gx-pack/TRAJECTORY.md` |
| Module state | `.hivemind/hive-modules/gx-pack/STATE.md` |
| Parent module | `.hivemind/hive-modules/hivefiver-v2/STATE.md` |
