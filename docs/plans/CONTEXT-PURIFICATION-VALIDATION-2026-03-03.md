# Context Purification & Validation Synthesis — Compact Superiority

> **Document ID:** CONTEXT-PURIFICATION-VALIDATION-2026-03-03  
> **Phase:** P5  
> **Date:** 2026-03-03  
> **Scope:** Documentation/governance/architecture context purification only (no implementation)

**Terminology policy note:**
- **OpenCode terminology is canonical for project artifacts.**
- **Kilocode mode terminology is orchestration-only for this development environment.**

---

## Input Artifacts (Purification Basis)

- Architecture spec: [SPEC-COMPACT-SUPERIORITY-ARCHITECTURE-2026-03-03.md](SPEC-COMPACT-SUPERIORITY-ARCHITECTURE-2026-03-03.md:1)
- Entity map: [ENTITY-RELATIONAL-MAP-2026-03-03.md](ENTITY-RELATIONAL-MAP-2026-03-03.md:1)
- Explore1: [EXPLORE1-ARCH-STRUCTURE-2026-03-03.md](EXPLORE1-ARCH-STRUCTURE-2026-03-03.md:1)
- Explore2: [EXPLORE2-DOCS-COMMITS-DIRECTION-2026-03-03.md](EXPLORE2-DOCS-COMMITS-DIRECTION-2026-03-03.md:1)
- Governance baseline: [AGENTS.md](../../AGENTS.md:1), [AGENT_RULES.md](../../AGENT_RULES.md:1), [MASTER-NOTICE-BOARD.md](../../MASTER-NOTICE-BOARD.md:1)

---

## L0 Executive Purified Context

1. Compact rollout risk is currently governance-contract drift, not primarily new architecture invention ([EXPLORE2-...](EXPLORE2-DOCS-COMMITS-DIRECTION-2026-03-03.md:12)).
2. Five dominant conflict zones are already identified: confirmation policy, path canonicality, governance field semantics, source-of-truth multiplicity, and terminology drift ([EXPLORE2-...](EXPLORE2-DOCS-COMMITS-DIRECTION-2026-03-03.md:14)).
3. CQRS intent is strong and explicit in operational governance ([AGENTS.md](../../AGENTS.md:94), [AGENTS.md](../../AGENTS.md:98)).
4. CQRS enforcement is still unevenly operationalized (convention-heavy flush discipline) ([EXPLORE1-...](EXPLORE1-ARCH-STRUCTURE-2026-03-03.md:100), [EXPLORE1-...](EXPLORE1-ARCH-STRUCTURE-2026-03-03.md:138)).
5. Compaction authority is ambiguous between hook-centric runtime and separate engine path ([EXPLORE1-...](EXPLORE1-ARCH-STRUCTURE-2026-03-03.md:106), [EXPLORE1-...](EXPLORE1-ARCH-STRUCTURE-2026-03-03.md:225)).
6. Path governance must center on [getEffectivePaths()](../../src/lib/paths.ts:1) and avoid stale hardcoded paths ([AGENTS.md](../../AGENTS.md:96), [AGENT_RULES.md](../../AGENT_RULES.md:331)).
7. `.hivemind/state/hierarchy.json` is documented as legacy/deprecated, so references to `.hivemind/hierarchy.json` are stale ([AGENT_RULES.md](../../AGENT_RULES.md:100), [EXPLORE2-...](EXPLORE2-DOCS-COMMITS-DIRECTION-2026-03-03.md:63)).
8. Operational authority should preserve OpenCode-canonical artifact terminology, with mode aliases used only for environment orchestration mechanics ([SPEC-...](SPEC-COMPACT-SUPERIORITY-ARCHITECTURE-2026-03-03.md:23), [EXPLORE2-...](EXPLORE2-DOCS-COMMITS-DIRECTION-2026-03-03.md:149)).
9. Compact continuity concerns are real and historically tracked (post-compact injection/timing fixes) ([MASTER-NOTICE-BOARD.md](../../MASTER-NOTICE-BOARD.md:10), [MASTER-NOTICE-BOARD.md](../../MASTER-NOTICE-BOARD.md:47)).
10. Existing governance text has both clean operational baseline and older constitutional prose; role separation must be explicit ([AGENTS.md](../../AGENTS.md:5), [AGENT_RULES.md](../../AGENT_RULES.md:3)).
11. Canonical governance stack should prioritize active operational docs, then dated conflict deltas, then constitutional reference ([EXPLORE2-...](EXPLORE2-DOCS-COMMITS-DIRECTION-2026-03-03.md:133)).
12. Context purification gates for Phase 5 are already defined and usable as readiness checks ([EXPLORE1-...](EXPLORE1-ARCH-STRUCTURE-2026-03-03.md:200)).
13. Terminology normalization is partially defined but not fully enforced across active surfaces ([SPEC-...](SPEC-COMPACT-SUPERIORITY-ARCHITECTURE-2026-03-03.md:23), [EXPLORE2-...](EXPLORE2-DOCS-COMMITS-DIRECTION-2026-03-03.md:91)).
14. Entity-map claims contain useful structure but include statements requiring re-validation before treated as authoritative fact ([ENTITY-RELATIONAL-MAP-...](ENTITY-RELATIONAL-MAP-2026-03-03.md:23), [ENTITY-RELATIONAL-MAP-...](ENTITY-RELATIONAL-MAP-2026-03-03.md:324)).

---

## L1 Validated Facts (Evidence-Linked)

| ID | Validated Fact | Evidence |
|---|---|---|
| VF-01 | Compact Superiority documents an alias map for environment orchestration while preserving OpenCode terminology as canonical in project artifacts (`agents/subagents ↔ modes`, `delegation ↔ handoff`, `context window ↔ budget`). | [SPEC-...](SPEC-COMPACT-SUPERIORITY-ARCHITECTURE-2026-03-03.md:23) |
| VF-02 | Compact Superiority core is designed as CIS + RLE + AEM + PDF layered over existing system. | [SPEC-...](SPEC-COMPACT-SUPERIORITY-ARCHITECTURE-2026-03-03.md:45) |
| VF-03 | Active governance baseline mandates queue-centric state mutation and path centralization. | [AGENTS.md](../../AGENTS.md:94), [AGENTS.md](../../AGENTS.md:96) |
| VF-04 | Constitution also requires path centralization through [getEffectivePaths()](../../src/lib/paths.ts:1). | [AGENT_RULES.md](../../AGENT_RULES.md:331) |
| VF-05 | `.hivemind/state/hierarchy.json` is marked deprecated after migration. | [AGENT_RULES.md](../../AGENT_RULES.md:100) |
| VF-06 | Explore2 identifies confirmation-policy contradiction as a P0-class blocker. | [EXPLORE2-...](EXPLORE2-DOCS-COMMITS-DIRECTION-2026-03-03.md:100) |
| VF-07 | Explore2 identifies canonical path drift as a P0-class blocker. | [EXPLORE2-...](EXPLORE2-DOCS-COMMITS-DIRECTION-2026-03-03.md:103) |
| VF-08 | Explore1 confirms compaction authority split risk (engine path vs hook runtime path). | [EXPLORE1-...](EXPLORE1-ARCH-STRUCTURE-2026-03-03.md:106), [EXPLORE1-...](EXPLORE1-ARCH-STRUCTURE-2026-03-03.md:225) |
| VF-09 | Explore1 confirms queue flush is partially adopted and convention-based. | [EXPLORE1-...](EXPLORE1-ARCH-STRUCTURE-2026-03-03.md:26), [EXPLORE1-...](EXPLORE1-ARCH-STRUCTURE-2026-03-03.md:139) |
| VF-10 | Explore2 recommends an authority stack with operational [AGENTS.md](../../AGENTS.md:1) first, constitutional [AGENT_RULES.md](../../AGENT_RULES.md:1) as reference. | [EXPLORE2-...](EXPLORE2-DOCS-COMMITS-DIRECTION-2026-03-03.md:133) |
| VF-11 | MASTER-NOTICE-BOARD contains recorded post-compact context integrity fixes tied to injection timing and first-turn gating. | [MASTER-NOTICE-BOARD.md](../../MASTER-NOTICE-BOARD.md:10), [MASTER-NOTICE-BOARD.md](../../MASTER-NOTICE-BOARD.md:47) |
| VF-12 | Phase 5 already has a concrete purification verification checklist including CQRS, flush, compaction authority, budget consistency, staleness, and observability gates. | [EXPLORE1-...](EXPLORE1-ARCH-STRUCTURE-2026-03-03.md:200) |

---

## L2 Conflict Ledger

| Conflict ID | Source A | Source B | Impact | Resolution Recommendation |
|---|---|---|---|---|
| CL-01 Confirmation policy deadlock | Universal strict confirmation wording (as captured in Explore2 matrix) ([EXPLORE2-...](EXPLORE2-DOCS-COMMITS-DIRECTION-2026-03-03.md:61)) | Planned delegated sub-session deterministic execution without extra confirmation ([EXPLORE2-...](EXPLORE2-DOCS-COMMITS-DIRECTION-2026-03-03.md:62)) | P0 governance deadlock; inconsistent behavior across session types | Canonicalize three-session contract (main/sub/recovery) in one matrix and explicitly supersede legacy wording. |
| CL-02 Path canonicality drift | Stale lifecycle path reference to `.hivemind/hierarchy.json` as reported ([EXPLORE2-...](EXPLORE2-DOCS-COMMITS-DIRECTION-2026-03-03.md:63)) | Canonical path logic + deprecated legacy hierarchy path ([AGENTS.md](../../AGENTS.md:96), [AGENT_RULES.md](../../AGENT_RULES.md:100)) | P0 wrong-state reads/writes and false diagnostics | Enforce path lint gate: reject non-canonical `.hivemind/` paths unless explicitly marked legacy. |
| CL-03 Compaction authority split | Detached [executeCompaction()](../../src/lib/compaction-engine.ts:252) path risk ([EXPLORE1-...](EXPLORE1-ARCH-STRUCTURE-2026-03-03.md:106)) | Hook-centric runtime compaction behavior ([EXPLORE1-...](EXPLORE1-ARCH-STRUCTURE-2026-03-03.md:109)) | P0/P1 semantic divergence in compaction outcomes | Designate single canonical compaction executor and route all entrypoints through it. |
| CL-04 CQRS intent vs operational discipline | CQRS hard intent in governance docs ([AGENTS.md](../../AGENTS.md:98)) | Convention-based flush adoption and incomplete boundary enforcement ([EXPLORE1-...](EXPLORE1-ARCH-STRUCTURE-2026-03-03.md:100), [EXPLORE1-...](EXPLORE1-ARCH-STRUCTURE-2026-03-03.md:138)) | P1 non-deterministic mutation sequencing | Promote pre-write queue flush to framework-level hard gate, not per-tool convention. |
| CL-05 Governance state semantics ambiguity | `governance_mode` vs `governance_status` unresolved conflict ([EXPLORE2-...](EXPLORE2-DOCS-COMMITS-DIRECTION-2026-03-03.md:65)) | No explicit single field canonicalization in active baseline docs ([AGENTS.md](../../AGENTS.md:82), [AGENT_RULES.md](../../AGENT_RULES.md:60)) | P1 operator/runtime ambiguity and misinterpretation | Define one canonical field + migration mapping and deprecate alias semantics. |
| CL-06 Multi-surface source-of-truth drift | Dual agent/governance definitions across unsynced surfaces ([EXPLORE2-...](EXPLORE2-DOCS-COMMITS-DIRECTION-2026-03-03.md:66), [EXPLORE2-...](EXPLORE2-DOCS-COMMITS-DIRECTION-2026-03-03.md:124)) | Mixed operational vs constitutional documents with different granularity ([AGENTS.md](../../AGENTS.md:138), [AGENT_RULES.md](../../AGENT_RULES.md:351)) | P1 drift in enforcement expectations | Publish explicit SSoT stack and require periodic drift checks against it. |
| CL-07 Terminology drift | OpenCode-canonical and mode-alias terms are mixed without boundary control in active/historical docs ([EXPLORE2-...](EXPLORE2-DOCS-COMMITS-DIRECTION-2026-03-03.md:91)) | Terminology boundary policy required for Compact rollout ([EXPLORE2-...](EXPLORE2-DOCS-COMMITS-DIRECTION-2026-03-03.md:166), [SPEC-...](SPEC-COMPACT-SUPERIORITY-ARCHITECTURE-2026-03-03.md:23)) | P2 onboarding and policy interpretation friction | Enforce OpenCode-canonical glossary lint for active project artifacts; allow mode aliases only in orchestration-labeled sections. |

---

## L3 Deferred / Unverified Claims (Explicitly Not Canonical Yet)

| Claim | Current Source | Status | Why Deferred |
|---|---|---|---|
| “42% CQRS compliance with 10 violations” | [ENTITY-RELATIONAL-MAP-...](ENTITY-RELATIONAL-MAP-2026-03-03.md:23), [ENTITY-RELATIONAL-MAP-...](ENTITY-RELATIONAL-MAP-2026-03-03.md:324) | **UNVERIFIED** | Not re-validated against current code/telemetry within P5 scope. |
| “9 agents, 30+ skills, 25+ commands, 50+ libraries” inventory counts | [ENTITY-RELATIONAL-MAP-...](ENTITY-RELATIONAL-MAP-2026-03-03.md:12) | **UNVERIFIED** | Counts likely directionally useful but not audited in this subtask. |
| `symlink_contexts/` tree as active runtime structure | [SPEC-...](SPEC-COMPACT-SUPERIORITY-ARCHITECTURE-2026-03-03.md:306) | **UNVERIFIED** | Spec-level design; implementation existence not validated in this subtask. |
| “Replace innate OpenCode mechanisms” readiness | [SPEC-...](SPEC-COMPACT-SUPERIORITY-ARCHITECTURE-2026-03-03.md:5) | **DEFERRED** | Architectural intent only; rollout dependencies unresolved. |
| Fully synchronized commands/skills to canonical contracts | [EXPLORE2-...](EXPLORE2-DOCS-COMMITS-DIRECTION-2026-03-03.md:138) | **DEFERRED** | Explore2 itself identifies active drift and unresolved conflicts. |

---

## Symlink / Path Integrity Table

| Valid Path (Observed/Canonical) | Stale Path / Pattern | Proposed Canonical Path / Rule |
|---|---|---|
| [src/lib/paths.ts](../../src/lib/paths.ts:1) | Hardcoded direct `.hivemind/...` path strings in skills/docs | Resolve through [getEffectivePaths()](../../src/lib/paths.ts:1) only. |
| [src/lib/state-mutation-queue.ts](../../src/lib/state-mutation-queue.ts:1) | Direct writes bypassing queue contract | Route all writes via queue + enforced flush boundary. |
| `.hivemind/state/brain.json` ([SPEC-...](SPEC-COMPACT-SUPERIORITY-ARCHITECTURE-2026-03-03.md:338), [AGENT_RULES.md](../../AGENT_RULES.md:98)) | Legacy assumptions of flat state pathing | Keep state under `.hivemind/state/*` via path resolver. |
| `.hivemind/graph/trajectory.json` ([SPEC-...](SPEC-COMPACT-SUPERIORITY-ARCHITECTURE-2026-03-03.md:339), [AGENT_RULES.md](../../AGENT_RULES.md:92)) | Mixed references to legacy plan topology | Treat graph path as relational authority for lineage. |
| `.hivemind/state/hierarchy.json` marked deprecated ([AGENT_RULES.md](../../AGENT_RULES.md:100)) | `.hivemind/hierarchy.json` still referenced in stale lifecycle text ([EXPLORE2-...](EXPLORE2-DOCS-COMMITS-DIRECTION-2026-03-03.md:63)) | Replace stale refs with `.hivemind/state/hierarchy.json` only when legacy compatibility is required; otherwise consume graph lineage. |
| `.hivemind/` state-first topology ([EXPLORE2-...](EXPLORE2-DOCS-COMMITS-DIRECTION-2026-03-03.md:39)) | `.opencode/planning/...` assumptions | Mark `.opencode` planning paths historical/non-normative for Compact rollout. |
| `symlink_contexts/` design tree ([SPEC-...](SPEC-COMPACT-SUPERIORITY-ARCHITECTURE-2026-03-03.md:311)) | Unverified runtime linkage | Validate existence + ownership before declaring operational dependency. |

---

## Terminology Boundary Table (OpenCode Canonical + Orchestration Aliases)

| OpenCode Canonical Term (project artifacts) | Kilocode Orchestration Alias (environment-only) | Basis |
|---|---|---|
| agents/subagents | modes | [SPEC-...](SPEC-COMPACT-SUPERIORITY-ARCHITECTURE-2026-03-03.md:25), [EXPLORE2-...](EXPLORE2-DOCS-COMMITS-DIRECTION-2026-03-03.md:159) |
| delegation / delegation packet | handoff / handoff packet | [SPEC-...](SPEC-COMPACT-SUPERIORITY-ARCHITECTURE-2026-03-03.md:26), [EXPLORE2-...](EXPLORE2-DOCS-COMMITS-DIRECTION-2026-03-03.md:150) |
| context window | budget | [SPEC-...](SPEC-COMPACT-SUPERIORITY-ARCHITECTURE-2026-03-03.md:27), [EXPLORE2-...](EXPLORE2-DOCS-COMMITS-DIRECTION-2026-03-03.md:151) |
| front-facing coordinator agent | orchestrator mode behavior | [EXPLORE2-...](EXPLORE2-DOCS-COMMITS-DIRECTION-2026-03-03.md:85) |
| builder/executor agent | `code` / `debug` mode behavior | [EXPLORE2-...](EXPLORE2-DOCS-COMMITS-DIRECTION-2026-03-03.md:86) |
| research/explorer subagent | `ask` / research-mode behavior | [EXPLORE2-...](EXPLORE2-DOCS-COMMITS-DIRECTION-2026-03-03.md:87) |
| auto-compact continuation | continuity recovery session | [EXPLORE2-...](EXPLORE2-DOCS-COMMITS-DIRECTION-2026-03-03.md:89), [EXPLORE2-...](EXPLORE2-DOCS-COMMITS-DIRECTION-2026-03-03.md:152) |

---

## Canonical Source-of-Truth Stack (Ordered)

1. **Operational SSoT (authoritative for active execution):** [AGENTS.md](../../AGENTS.md:1)
2. **Phase-validated purification synthesis (this P5 contract):** [CONTEXT-PURIFICATION-VALIDATION-2026-03-03.md](CONTEXT-PURIFICATION-VALIDATION-2026-03-03.md:1)
3. **Conflict/canonicalization delta log (dated):** [EXPLORE2-...](EXPLORE2-DOCS-COMMITS-DIRECTION-2026-03-03.md:133) and linked cycle artifacts
4. **Constitutional reference (architectural philosophy):** [AGENT_RULES.md](../../AGENT_RULES.md:1)
5. **Chronological evidence trail (non-normative for policy semantics):** [MASTER-NOTICE-BOARD.md](../../MASTER-NOTICE-BOARD.md:1)

---

## Compact Rollout Blockers (P0 / P1 / P2)

| Priority | Blocker | Evidence | Required Unblock Action |
|---|---|---|---|
| P0 | Confirmation contract contradiction (main vs delegated sub-session behavior) | [EXPLORE2-...](EXPLORE2-DOCS-COMMITS-DIRECTION-2026-03-03.md:100), [EXPLORE2-...](EXPLORE2-DOCS-COMMITS-DIRECTION-2026-03-03.md:62) | Publish explicit session-type behavior contract and supersede conflicting legacy wording. |
| P0 | Canonical path drift (`.hivemind/hierarchy.json` stale reference class) | [EXPLORE2-...](EXPLORE2-DOCS-COMMITS-DIRECTION-2026-03-03.md:103), [AGENT_RULES.md](../../AGENT_RULES.md:100) | Add hard path lint + replace stale references in active skill/command docs. |
| P0 | Compaction execution authority split | [EXPLORE1-...](EXPLORE1-ARCH-STRUCTURE-2026-03-03.md:106), [EXPLORE1-...](EXPLORE1-ARCH-STRUCTURE-2026-03-03.md:225) | Choose one canonical compaction authority and codify in governance docs. |
| P1 | Dual governance semantics (`governance_mode` vs `governance_status`) | [EXPLORE2-...](EXPLORE2-DOCS-COMMITS-DIRECTION-2026-03-03.md:65) | Define single canonical field + migration note + alias deprecation date. |
| P1 | Source-of-truth fragmentation across docs/plans/skills/commands | [EXPLORE2-...](EXPLORE2-DOCS-COMMITS-DIRECTION-2026-03-03.md:124), [EXPLORE2-...](EXPLORE2-DOCS-COMMITS-DIRECTION-2026-03-03.md:138) | Enforce SSoT hierarchy with drift-check cadence and fail-close policy. |
| P1 | CQRS enforcement by convention instead of hard boundary | [EXPLORE1-...](EXPLORE1-ARCH-STRUCTURE-2026-03-03.md:100), [EXPLORE1-...](EXPLORE1-ARCH-STRUCTURE-2026-03-03.md:138) | Elevate queue flush to mandatory pre-write boundary invariant. |
| P2 | Terminology boundary drift (OpenCode canonical terms mixed with orchestration aliases without labeling) | [EXPLORE2-...](EXPLORE2-DOCS-COMMITS-DIRECTION-2026-03-03.md:91), [EXPLORE2-...](EXPLORE2-DOCS-COMMITS-DIRECTION-2026-03-03.md:166) | Apply OpenCode-canonical glossary policy and restrict mode aliases to orchestration-only metadata sections. |
| P2 | Spec-design elements not implementation-verified (`symlink_contexts/`) | [SPEC-...](SPEC-COMPACT-SUPERIORITY-ARCHITECTURE-2026-03-03.md:306) | Validate implementation existence before binding rollout dependencies to spec-only nodes. |

---

## Validation Verdict — Context Integrity Readiness

**Verdict: PARTIAL**

**Rationale (explicit):**
- **Ready:** Core governance intent, CQRS doctrine, path-centralization principle, and purification gates are clearly documented and cross-linked ([AGENTS.md](../../AGENTS.md:94), [AGENT_RULES.md](../../AGENT_RULES.md:331), [EXPLORE1-...](EXPLORE1-ARCH-STRUCTURE-2026-03-03.md:200)).
- **Not ready for full PASS:** P0 contradictions remain unresolved in confirmation policy, path canonicality, and compaction authority; these can produce non-deterministic operator/runtime behavior during Compact rollout ([EXPLORE2-...](EXPLORE2-DOCS-COMMITS-DIRECTION-2026-03-03.md:100), [EXPLORE2-...](EXPLORE2-DOCS-COMMITS-DIRECTION-2026-03-03.md:103), [EXPLORE1-...](EXPLORE1-ARCH-STRUCTURE-2026-03-03.md:106)).
- **Purification outcome:** Ambiguity is reduced and conflict surfaces are now explicit, prioritized, and traceable; final readiness requires closure of listed P0 blockers.
