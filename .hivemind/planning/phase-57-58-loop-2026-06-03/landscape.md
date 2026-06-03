[LANGUAGE: Write this file in en per Language Governance.]
# Landscape — Phase 57 & 58 Loop (2026-06-03)

**Session:** phase-57-58-loop-2026-06-03
**Orchestrator:** hm-l0-orchestrator (front-facing strategist)
**Mode:** gsd-* lineage (per user explicit request)
**Generated:** 2026-06-03

---

## 1. User Intent

User explicitly requested the canonical 11-checkpoint phase loop (`Scout → CRUD → Trajectory → SPEC → CONTEXT → RESEARCH → PATTERNS → PLAN → EXECUTE → VERIFY → SHIP`) for both phases 57 and 58, executed via `execute-slash-command` invoking the corresponding gsd-* command at each checkpoint. Lineage: **gsd-*** (consistent with user instruction "be consistent if you use gsd command - go with gsd agents").

---

## 2. Phase Inventory (Codebase Reality)

### Phase 57 — `tmux-debug-audit`
- **Directory:** `.planning/phases/57-tmux-debug-audit/` — **EMPTY** (no SPEC, no CONTEXT, no PLAN)
- **ROADMAP.md:** **NOT PRESENT** (line 510 references P58 as depending on P57, but P57 is not declared)
- **STATE.md:411:** "Assigned 58 not 57: SDK skipped 57 because empty leftover dir exists (not in ROADMAP)"
- **Real nature:** Debug-phase placeholder; user-facing intent is unclear
- **Known issues to address:** (a) phase not in ROADMAP, (b) empty dir, (c) P58 depends on it (broken dependency chain)
- **Recommended action:** CRUD via `gsd-phase` — either delete placeholder dir, mark as `merged-into-58`, or re-spec it as a docs-only audit phase

### Phase 58 — `tmux-orchestration-programmatic-pool-interactive-delegate-cl`
- **Directory:** `.planning/phases/58-tmux-orchestration-programmatic-pool-interactive-delegate-cl/`
- **Files present:** `58-SPEC.md` (252 lines, 6 requirements REQ-58-01..06, 13 acceptance criteria, ambiguity 0.075 ≤ 0.20 ✅), `58-CONTEXT.md` (271 lines, 17 implementation decisions D-58-01..17)
- **ROADMAP.md:510-520:** Phase 58 entry present with goal, depends-on Phase 57 (broken), "TBD" plan status
- **STATE.md:411:** Phase 58 added 2026-06-03; **4 known issues** in entry that need `gsd-phase edit` remediation:
  1. (a) phase name is full description string, should be `tmux-orchestration-programmatic-pool-interactive-delegate`
  2. (b) goal is "To be planned", should be the 6-gap text
  3. (c) depends on Phase 57 which does not exist
  4. (d) duplicate `56-*` phase dirs (`56-tmux-just-works-integration` and `56-tmux-stress-test-real-world-workflow`)
- **Status:** SPEC ✅, CONTEXT ✅, next = PATTERNS → PLAN → EXECUTE → VERIFY → SHIP
- **Scope:** 6 architectural gaps (G1–G6) → 6 BATS scenarios at slots 61–66; 1 new types file; 1 new method; 1 new optional field; 1 new method on session-tracker; 2 new event types; 3 new actions on tmux-copilot; 1 new action on delegation-status; 1 policy comment; 1 helper extension

---

## 3. Domains Activated

| Domain | Phase 57 | Phase 58 | Specialist |
|--------|----------|----------|------------|
| Lifecycle | CRUD (placeholder mgmt) | CRUD edit (4 known issues) | gsd-planner via `gsd-phase` |
| Research | Optional (audit-style) | P51–P55 in-tree synthesis (already done) | gsd-phase-researcher via `gsd-research` |
| Patterns | N/A | BATS test patterns + frozen-contract format | gsd-pattern-mapper via `gsd-plan-phase` (internal) |
| Planning | N/A | PLAN.md with task breakdown | gsd-planner via `gsd-plan-phase` |
| Planning QA | N/A | Plan correctness verification | gsd-plan-checker (auto-loops in plan-phase) |
| Implementation | N/A (docs-only) | 6 BATS + 1 new types file + 4 wiring changes | gsd-executor via `gsd-execute-phase` |
| Quality / Verification | N/A | 13 acceptance criteria + 3,203+ vitest regression | gsd-verifier via `gsd-verify-work` |
| Ship | N/A | PR + CI audit | gsd-shipper via `gsd-ship` |

---

## 4. Wave Ordering

**Wave 0 (Housekeeping — can run in parallel):**
- W0-A: `gsd-phase edit 58` — fix 4 known issues in P58 entry
- W0-B: `gsd-phase` CRUD on P57 — decide placeholder fate (delete | merge-into-58 | re-spec as docs-only)

**Wave 1 (Phase 58 — Planning Pipeline, sequential dependency):**
- W1-A: `gsd-research 58` (research agent)
- W1-B: `gsd-plan-phase 58` (auto-runs `gsd-pattern-mapper` first, then `gsd-planner`, then loops `gsd-plan-checker` until PASS)

**Wave 2 (Phase 58 — Execution, can run waves internally):**
- W2-A: `gsd-execute-phase 58` (wave-based: implementation + 6 BATS + wiring + vitest regression + tsc)
- W2-B: `gsd-verify-work 58` (verifier: 13 acceptance criteria + L1 BATS evidence + 3,203 vitest regression + tsc clean)
- W2-C: `gsd-ship 58` (PR creation)

**Phase 57 wave:** If W0-B decides to re-spec P57 as a docs-only audit, then a small planning wave (SPEC-only, no execution) may follow. If W0-B deletes the placeholder, no further work.

---

## 5. Path Decisions

| Wave | Path | Rationale |
|------|------|-----------|
| W0-A, W0-B | **fast-path** (direct to gsd-planner via execute-slash-command) | Single-specialist CRUD, no multi-wave coordination needed |
| W1-A | **fast-path** (direct to gsd-phase-researcher) | Single research deliverable |
| W1-B | **fast-path** (direct to gsd-planner) | Single planning deliverable; `gsd-plan-phase` internally orchestrates pattern-mapper + planner + plan-checker loop |
| W2-A | **fast-path** (direct to gsd-executor) | Single execution deliverable; gsd-executor internally does wave-based parallelization + atomic commits |
| W2-B | **fast-path** (direct to gsd-verifier) | Single verification deliverable |
| W2-C | **fast-path** (direct to gsd-shipper) | Single ship deliverable |

**Cross-lineage (hf-*):** NOT applicable — task is gsd-* development, not meta-concept work.

---

## 6. Delegation Targets (gsd-* commands to invoke)

For each checkpoint, the L0 orchestrator will dispatch via `execute-slash-command`:

| Checkpoint | Command | Target agent (internal) |
|-----------|---------|-------------------------|
| W0-A | `gsd-phase edit 58` | gsd-planner |
| W0-B | `gsd-phase remove 57` OR `gsd-phase` placeholder resolution | gsd-planner |
| W1-A | `gsd-research 58` | gsd-phase-researcher |
| W1-B | `gsd-plan-phase 58` | gsd-planner (auto-orchestrates pattern-mapper + plan-checker) |
| W2-A | `gsd-execute-phase 58` | gsd-executor |
| W2-B | `gsd-verify-work 58` | gsd-verifier |
| W2-C | `gsd-ship 58` | gsd-shipper |

**Total dispatches:** 7-8 sequential commands, with W0-A and W0-B parallelizable.

---

## 7. Artifact Expectations

| Phase | Artifact | Type | Evidence Level | Path |
|-------|----------|------|----------------|------|
| W0-A | Updated ROADMAP.md P58 entry | docs | L5 | `.planning/ROADMAP.md:510-520` |
| W0-B | Resolved P57 placeholder | docs | L5 | `.planning/phases/57-tmux-debug-audit/` (or removed) |
| W1-A | `58-RESEARCH.md` | research | L5 | `.planning/phases/58-tmux-orchestration-programmatic-pool-interactive-delegate-cl/58-RESEARCH.md` |
| W1-B | `58-PATTERNS.md` + `58-PLAN.md` + `58-PLAN-CHECK.md` | patterns + plan | L5 + L4 | `.planning/phases/58-.../58-PATTERNS.md`, `58-PLAN.md`, `58-PLAN-CHECK.md` |
| W2-A | `58-SUMMARY.md` + 6 BATS files + source changes | code + tests | L1 (BATS runtime proof) | `src/`, `tests/scripts/tmux/61-66-*.bats`, `58-SUMMARY.md` |
| W2-B | `58-VERIFICATION.md` | verification | L1+L2 | `.planning/phases/58-.../58-VERIFICATION.md` |
| W2-C | PR URL | ship | L1 | GitHub PR |

**Atomic commits:** Mandatory after each wave per AGENTS.md governance. Each BATS file + source edit = 1 commit; 6 BATS × ~2 commits each (impl + test) + wiring commits = ~15-20 atomic commits for P58.

---

## 8. Quality Gate Triad (post-execute)

Per `.opencode/rules/universal-rules.md` §5, all returns pass the triad:

1. **Lifecycle Integration Gate** (`gate-l3-lifecycle-integration`): 9-surface CQRS compliance — `src/features/tmux/*` integration; `src/coordination/delegation/*` integration; `src/plugin.ts:920` wiring; 27-tool-key invariant preserved.
2. **Spec Compliance Gate** (`gate-l3-spec-compliance`): 6 requirements (G1–G6) traced to acceptance criteria; SPEC.md bidirectional traceability; EARS criteria validation; anti-pattern scan (no `any`, no new tool keys, no new deps).
3. **Evidence Truth Gate** (`gate-l3-evidence-truth`): BATS slots 61–66 pass with fresh runtime proof (not mocked); 3,203+ vitest regression passes; tsc --noEmit clean; native-task-tool grep-absence verified.

---

## 9. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| P58 BATS slot 61 conflicts with P56 slot 61 (per CONTEXT.md:242) | High | Medium | P58 G1 may need renumber to slot 67; documented in CONTEXT |
| P57 placeholder is unresolvable (no SPEC, no CONTEXT) | High | Low | W0-B resolves by deletion or docs-only re-spec |
| `__getDelegationsForTesting` test seam introduces linting risk | Medium | Low | `__`-prefix convention already used in 3 places (P54, P53, P25.1) |
| Dual `56-*` phase dirs on disk (per STATE.md:411) | Confirmed | Low | Note in W0-B resolution; out of scope for P58 |
| 3,203+ vitest regression risk on `manager.ts` changes | Medium | High | Atomic commits + per-wave regression check; abort if any vitest fails |
| L1 BATS runtime depends on real tmux daemon | Confirmed | Medium | BATS slots use real `tmux new-session`; documented in helpers.bash |
| 27-tool-key invariant at risk if tmux-copilot zod union refactor slips | Low | High | Acceptance criterion: tsc clean + hook-registration test passes |

---

## 10. Authorization Required from User

Per `.planning/AGENTS.md` §3: "Planning docs SHALL NOT authorize runtime code, .opencode/** primitive, or .hivemind/** state mutation unless the current phase/user authorization explicitly allows it."

**Phase 58 EXECUTE involves runtime mutations:**
- New file: `src/coordination/delegation/pool-types.ts` (~60 LOC)
- Modified files: `src/coordination/delegation/manager.ts`, `src/tools/delegation/delegate-task.ts`, `src/tools/delegation/delegation-status.ts`, `src/tools/tmux-copilot.ts`, `src/features/session-tracker/tool-delegation.ts`, `src/features/session-tracker/types.ts`, `src/features/session-tracker/index.ts`, `src/plugin.ts:920`, `src/sidecar/sse-pool.ts`
- New test files: 6 BATS scenarios at `tests/scripts/tmux/61-66-*.bats`
- New test seam: `__getDelegationsForTesting` in DelegationManager
- New event types: `delegation-dispatched`, `delegation-terminal` in session-tracker

**Question to user before W2-A dispatch:** Confirm proceed with execution scope, or scope down to planning-only?

---

## 11. Execution Sequence (Proposed)

1. **W0-A + W0-B** (parallel, fast): Housekeeping CRUD on P57 + fix P58 entry
2. **W1-A** (sequential, research): `gsd-research 58`
3. **W1-B** (sequential, plan): `gsd-plan-phase 58` (auto PATTERNS + plan-checker loop)
4. **[PAUSE for user confirmation]** — present PLAN.md for review
5. **W2-A** (execute, conditional on user approval)
6. **W2-B** (verify)
7. **W2-C** (ship)

---

## 12. Verification Checklist (post-loop)

- [ ] W0-A: ROADMAP.md P58 entry corrected (name, goal, dependency, no duplicate 56-* refs)
- [ ] W0-B: P57 placeholder resolved
- [ ] W1-A: 58-RESEARCH.md committed
- [ ] W1-B: 58-PATTERNS.md, 58-PLAN.md, 58-PLAN-CHECK.md committed
- [ ] W2-A: 6 BATS files pass + source code + tsc clean + vitest regression clean
- [ ] W2-B: 13 acceptance criteria verified, 6 gaps closed, gate triad PASS
- [ ] W2-C: PR created with atomic commits preserved

---

*Landscape generated 2026-06-03 by hm-l0-orchestrator. Awaiting user authorization to begin Wave 0 + Wave 1 (planning pipeline). Wave 2 (execute) requires explicit user confirmation per .planning/AGENTS.md §3.*
