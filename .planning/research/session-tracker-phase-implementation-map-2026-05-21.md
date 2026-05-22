# Session-Tracker Phase Implementation Map

**Date:** 2026-05-21  
**Author:** gsd-advisor-researcher (subagent)  
**Scope:** Advisory synthesis for Phase 21 — Session-Tracker Design Fix  
**Primary evidence:** `.planning/ROADMAP.md`, `.planning/STATE.md`, `AGENTS.md`, `.planning/research/session-tracker-flaws-analysis-2026-05-21.md`, `.planning/research/phase-reordering-final-recommendation-2026-05-21.md`, current `src/features/session-tracker/**`, `src/tools/hivemind/**`, `src/hooks/**`

---

## 1. Phase Timeline Touching Session-Tracker

| Phase / Artifact | What it changed or decided | Why it matters to Phase 21 |
|---|---|---|
| `CP-ST-01` | Introduced session-tracker write path and file model | Phase 21 must preserve file-format compatibility unless explicitly re-spec'd |
| `CP-ST-02` | Added deeper classification / pending-dispatch behaviors | Phase 21 inherits classification and dispatch coupling, especially restart safety |
| `CP-ST-03` | Removed legacy event-tracker runtime path and purified plugin assembly | Confirms Phase 21 should not re-open plugin decomposition; that moved later |
| `CP-ST-04` | Added hierarchy manifest design, root-main routing, directory architecture decisions | Phase 21 must verify whether those decisions were actually wired into runtime, not merely designed |
| `CP-ST-05` | Investigated data-loss patterns and surfaced cross-contamination + runtime drift | Provides earlier runtime evidence that design correctness, not refactor cosmetics, is the real problem |
| `CP-ST-06` | Root-cause rewrite: session router, retry queue, root-main preservation, child capture, index shrink work | Phase 21 is not a blank slate; it must explain why production flaws still remain after CP-ST-06 completion claims |
| `Phase 13` | Prior defect-remediation pass, disk-truth-first correction | Shows earlier fixes over-trusted code and tests; Phase 21 must lock production-evidence gates explicitly |
| `Phase 16` | Upgraded read-side tools (`session-tracker`, `session-hierarchy`, `session-context`, `hivemind-session-view`) | These tools now depend on tracker persistence correctness, so Phase 21 affects read-side trustworthiness immediately |
| `P00.5` | Non-destructive prerequisite cleanup | Phase 21 assumes dead-code sweep happens before design fix, but Phase 21 itself is the first high-risk runtime change |
| `Phase 21 (ROADMAP current)` | Fix 16 design flaws: temp leak, manifest wire, recovery blindness, status consistency, persistence simplification | This is the active source of truth |
| `P22-P25` | Status/error, dispatch, trajectory/contract, pressure redesign | All are blocked or shaped by Phase 21 outputs and data contracts |
| `P26-P28` | Routing, hooks, auto-loop/PTy revamp | These consume session-tracker facts; wrong Phase 21 design propagates into routing and loop logic |
| `P34` | Module splits + legacy inventory | Structural splitting is intentionally delayed until after Phase 21 resolves design truth |

### Timeline interpretation

Phase 21 is a **correctness-revalidation phase**, not an initial implementation phase. The repo already contains multiple “complete” session-tracker phases, but the 2026-05-21 production-flaw analysis reopened the area with **16 active design flaws**, including two CRITICAL issues. Spec authoring must therefore treat earlier CP-ST phases as **historical inputs and constraints**, not proof of runtime correctness.

---

## 2. Runtime Surface Map

### 2.1 Write-side / mutation surfaces

| Surface | File(s) | Current role | Phase 21 relevance |
|---|---|---|---|
| Orchestrator / lifecycle assembly | `src/features/session-tracker/index.ts`, `initialization.ts` | Wires all tracker dependencies, performs startup sequencing, cleanup, retry flush, project continuity completeness | In scope; startup order currently mixes hierarchy rebuild, recovery init, project index init, orphan cleanup, and completeness repair |
| Main session lifecycle capture | `capture/event-capture.ts`, `capture/message-capture.ts`, `persistence/session-writer.ts` | Creates / updates root session markdown and continuity records | In scope indirectly; lifecycle writes must stay consistent with child and project indexes |
| Tool capture for main sessions | `capture/tool-capture.ts` | Captures tool blocks, task spawn metadata, project/session index updates, child file creation for root-owned task results | In scope; still updates child/session/project layers separately and does **not** write hierarchy manifest on the root-session path |
| Child delegation capture | `tool-delegation.ts`, `child-recorder.ts` | Captures child tool journeys, nested task delegation, manifest updates, status changes for child-owned flows | In scope; this is the only clearly-wired manifest writer path now visible, implying asymmetric behavior between root and child capture flows |
| Child record persistence | `persistence/child-writer.ts` | Creates / updates child `.json`, queues writes, tracks last assistant message, resolves root-main directory | In scope; fallback-to-immediate-parent behavior, stale queue reset strategy, and cross-file consistency are active risks |
| Session-local hierarchy/index persistence | `persistence/session-index-writer.ts`, `types.ts` | Writes `session-continuity.json` and hierarchy tree | In scope; project/read-side recovery depends on this remaining authoritative and complete |
| Project-global continuity persistence | `persistence/project-index-writer.ts`, `project-continuity.ts` | Writes `project-continuity.json`, repairs completeness by walking disk | In scope; current queue, status overwrites, and “repair-after-the-fact” strategy are directly implicated in F-01/F-05/F-08/F-14 |
| Hierarchy manifest persistence | `persistence/hierarchy-manifest.ts` | Writes flattened `hierarchy-manifest.json` under root main sessions | In scope; roadmap explicitly calls out manifest write failure as CRITICAL F-02 |
| In-memory classification state | `classification.ts`, `session-router.ts`, `persistence/hierarchy-index.ts`, `persistence/pending-dispatch-registry.ts` | Determines child vs root routing before I/O | In scope; restart survival and cross-process truth are core Phase 21 concerns |
| Recovery and replay context | `recovery/session-recovery.ts` | Reads project index, root markdown, child JSON, SDK messages | In scope; one-shot initialization and weak parseability checks are explicit flaw targets |

### 2.2 Read-side / consumer surfaces

| Consumer | File(s) | Dependency on tracker truth | Phase 21 impact |
|---|---|---|---|
| Session query tool | `src/tools/hivemind/session-tracker.ts` | Reads `project-continuity.json`, root markdown, child JSON, `hierarchy-manifest.json` | Broken tracker data immediately corrupts list/search/filter outputs |
| Hierarchy query tool | `src/tools/hivemind/session-hierarchy.ts` | Reads `session-continuity.json` + manifest | Manifest correctness is a direct dependency |
| Session aggregation tool | `src/tools/hivemind/session-context.ts` | Aggregates project index + per-session continuity | Status and depth consistency depend on Phase 21 fixes |
| Unified cross-root tool | `src/tools/hivemind/hivemind-session-view.ts` | Combines tracker data with delegations + trajectory | Currently only as trustworthy as `session-continuity.json` / project index truth |
| Event observer | `src/hooks/observers/session-tracker-consumer.ts` | Routes runtime session events into tracker | Hook is thin; durability problems belong to tracker internals |
| Tool pre-guard transform | `src/hooks/transforms/tool-before-guard.ts` | Routes task pre-dispatch into proactive child discovery | Pending-dispatch + child discovery correctness is downstream of Phase 21 routing decisions |
| Chat capture transform | `src/hooks/transforms/chat-message-capture.ts` | Routes messages into tracker | Misclassification or stale hierarchy silently drops child content |
| Hivemind governance / resume skill | `hivemind-power-on` skill + references | Describes session-tracker based discovery/resume workflow | Must stay aligned with actual tracker/runtime truth, not just tool contracts |

### 2.3 Cross-root and adjacent state surfaces

| Surface | File(s) / root | Relationship to Phase 21 |
|---|---|---|
| Delegation persistence | `src/task-management/continuity/delegation-persistence.ts`, `.hivemind/state/delegations.json` | Session tracker read-side tools combine this with tracker data; mismatched session IDs or stale state will confuse resume / hierarchy views |
| Trajectory ledger | `src/task-management/trajectory/ledger.ts`, `.hivemind/state/trajectory-ledger.json` | `hivemind-session-view` joins trajectory with tracker data; Phase 21 must keep IDs/status semantics coherent for Phase 24 |
| Shared session API wrappers | `src/shared/session-api.ts` | Tracker relies on SDK parent/session/message lookups; spec should lock what is considered authoritative when SDK and disk disagree |

---

## 3. Known Flaw Inventory vs Planned Phase 21 Scope

### 3.1 Active flaw set from 2026-05-21 analysis

| Bucket | Flaws | Current planned Phase 21 coverage | Advisory note |
|---|---|---|---|
| CRITICAL writer correctness | F-01 temp leak, F-02 manifest never writes | Explicitly in ROADMAP goal | Must be exit-gated with disk proof, not test-only proof |
| Recovery blindness / restart truth | F-04, F-07, F-08 | Explicitly in ROADMAP goal | Requires deciding what durable artifact is authoritative after restart |
| Status consistency | F-03, F-05, F-14 | Partially explicit (`status consistency`) | Spec must state canonical status owner and reconciliation rules |
| Persistence simplification | F-09 | Explicitly in ROADMAP goal | Needs bounded scope; do not collapse into premature module-split cleanup |
| Queue / edge safety | F-06, F-10, F-12, F-13 | Not called out in roadmap goal, but present in flaw set | Should be classified as either Phase 21 exit criteria or explicitly deferred with rationale |
| Validation / migration / dead code | F-11, F-15, F-16 | Not explicit in roadmap goal | Must be dispositioned in spec to avoid ambiguity and false “all 16 fixed” claims |

### 3.2 What earlier phases already changed

| Earlier phase | Delivered change | Residual gap now visible |
|---|---|---|
| CP-ST-04 | Introduced hierarchy manifest and root-main directory design | Production evidence says manifest is still not trustworthy enough to treat as authoritative |
| CP-ST-05 | Exposed disk-truth failures and cross-contamination | Proved runtime evidence must outrank source-level optimism |
| CP-ST-06 | Added session-router, retry queue, child recording, project continuity completeness repair | Current flaws show restart truth and multi-store consistency remain unresolved even after rewrite |
| Phase 16 | Built read-side tooling around session-tracker persistence | Increases blast radius: tracker correctness is now a platform dependency, not just a capture concern |

### 3.3 Scope conclusion

Phase 21 should be framed as: **“Make tracker persistence authoritative, restart-safe, and internally consistent enough that Phase 16 query tools and Phases 22–28 orchestration work can trust it.”** If the spec instead frames Phase 21 as a generic clean-up or another broad rewrite, it will lose the production-evidence focus that justified the reorder.

---

## 4. Impacted Downstream Tools / Agents / Workflows

| Downstream consumer | Why impacted | Severity |
|---|---|---|
| `session-tracker` tool (`list`, `search`, `filter`) | Reads project index + child JSON + manifest directly | High |
| `session-hierarchy` tool (`get-manifest`) | Assumes manifest exists and is correct | High |
| `session-context` aggregation | Depends on stable status/depth metadata | High |
| `hivemind-session-view` | Joins tracker data with delegations/trajectory | High |
| `hivemind-power-on` skill | Teaches session discovery/resume strategy from tracker artifacts | Medium-High |
| `tool.execute.before` proactive child discovery | Pending registry / classification accuracy affects child routing | High |
| `chat.message` capture for children | UnknownSub/child routing after restart can silently drop child data | High |
| Phase 22 status unification | Cannot unify task/delegation status if tracker status semantics remain split | High |
| Phase 23 delegate-task redesign | Needs tracker truth for child lineage, resumability, dispatch visibility | High |
| Phase 26 routing / intent loop | Routes based on session state and hierarchy awareness | Medium-High |
| Phase 28 auto-loop / PTY | Explicit roadmap dependency on session-tracker correctness | High |

---

## 5. Top 3 Remediation Strategies

### Strategy 1 — Canonical Persistence Contract First

**What:** Pick one canonical durable source per concern, then force all writes and read-side tools to obey it. Minimum concerns: hierarchy ownership, child routing, session status, restart rebuild source.  
**Evidence:** Current code writes related truth into `child .json`, `session-continuity.json`, `project-continuity.json`, and `hierarchy-manifest.json`; flaw analysis identifies unreconciled multi-store drift (F-02, F-05, F-08, F-14).  
**Pros:** Directly addresses production ambiguity; unblocks downstream phases.  
**Cons:** Requires explicit spec decisions and targeted regression rewrites.  
**Recommendation:** **Highest priority.** Phase 21 should not start implementation until the canonical ownership matrix is locked.

### Strategy 2 — Restart/Rebuild Truth Before Runtime Simplification

**What:** Make restart classification and recovery deterministic before simplifying persistence internals. Specifically cover hierarchy rebuild, project index staleness handling, unknownSub treatment after restart, and parseability/validation thresholds.  
**Evidence:** F-04/F-07/F-08/F-11 all center on rebuild/recovery correctness; Phase reordering explicitly elevated Phase 21 because production evidence exposed restart blindness.  
**Pros:** Prevents false success where live session looks good but restart loses lineage.  
**Cons:** Requires scenario-based tests and possibly disk fixtures, not only unit mocks.  
**Recommendation:** **Second priority, but mandatory in the same phase exit gate.**

### Strategy 3 — Bounded Simplification, Not Broad Rewrite

**What:** Reduce persistence complexity only where it directly removes flaw vectors (queue behavior, fallback routing, repair-after-the-fact completeness), while leaving structural split work for P34.  
**Evidence:** Roadmap moved module splitting to P34; flaw analysis marks over-engineering (F-09) as real but warns against solving design issues with cosmetic decomposition.  
**Pros:** Respects reordered plan; reduces risk of another large rewrite that reopens proven logic.  
**Cons:** Requires discipline to avoid “while we’re here” refactors.  
**Recommendation:** **Preferred implementation style.** Keep P21 focused on design-correctness and truth surfaces, not broad file shuffling.

### Evidence-backed recommendation

The best Phase 21 path is **Strategy 1 + Strategy 2 as the spec core, with Strategy 3 as the implementation boundary**. The production-flaw report and reordered roadmap agree that the real issue is not file size, async conversion, or plugin decomposition; it is that the tracker currently lacks a stable, restart-safe authority model. Phase 21 should therefore lock: canonical source ownership, restart rebuild semantics, and status/hierarchy reconciliation rules — then only simplify persistence where it directly removes one of the 16 identified flaw vectors.

---

## 6. Inputs Spec-Phase Must Lock Explicitly

1. **Canonical source-of-truth matrix** for: root session metadata, child session metadata, hierarchy tree, flattened hierarchy lookup, project-wide session index, status, delegation depth, and restart rebuild inputs.
2. **Conflict resolution order** when SDK parent metadata, hierarchy index, pending registry, session-continuity, and hierarchy-manifest disagree.
3. **Manifest contract**: is `hierarchy-manifest.json` authoritative, derivative, optional cache, or deprecated? Current code and current research disagree by implication.
4. **Status contract**: which component owns status transitions, which statuses are legal, and which stores may derive vs persist them.
5. **Restart/recovery contract**: what must be reconstructible from disk alone, what may depend on SDK, and what failures must surface instead of silently degrading.
6. **Fallback policy** for child writes when root-main resolution is unavailable: fail-fast, quarantine, retry, or temporary buffer — but no silent immediate-parent drift unless explicitly accepted.
7. **Phase 21 flaw disposition table**: for each F-01..F-16, mark `fix now`, `fix partially`, `defer to P22+`, or `close as no longer valid`, with evidence.
8. **Exit-gate evidence**: production-scenario simulation, restart scenario, manifest write proof, status reconciliation proof, and read-side tool trust proof.
9. **Interaction boundary with P22/P23/P28** so status types, delegate-task lineage, and auto-loop dependencies are not redefined later.
10. **Artifact conflict policy**: older Phase 21 async-I/O research (`phase-21-domain-research-2026-05-21.md`, `phase-21-advisor-analysis-2026-05-21.md`) is superseded by reordered roadmap and must not drive implementation.

---

## 7. Highest-Value Documents for Planning / Specing

1. `.planning/ROADMAP.md` — current Phase 21 scope and downstream dependencies  
2. `.planning/STATE.md` — active-phase truth and completed prior session-tracker work  
3. `.planning/research/session-tracker-flaws-analysis-2026-05-21.md` — 16-flaw production evidence  
4. `.planning/research/phase-reordering-final-recommendation-2026-05-21.md` — why Phase 21 moved first  
5. `.planning/phases/CP-ST-05-session-data-loss-investigation/CP-ST-05-EVIDENCE-REPORT.md` — evidence-truth warning against completion optimism  
6. `.planning/phases/CP-ST-06-session-tracker-root-cause-rewrite/CP-ST-06-CONTEXT.md` — prior locked decisions that may now need re-validation  
7. `.planning/phases/16-session-tracker-tool-intelligence-event-tracker-deprecation-/16-SPEC.md` — read-side surfaces Phase 21 must keep trustworthy  
8. `AGENTS.md` — current project-level phase context and state-root rules

---

## 8. Advisory Conclusion

Phase 21 should be treated as a **contract repair phase for session truth**, not as another generic tracker refactor. The write path, rebuild path, and read-side query tools are now tightly coupled. If the spec does not explicitly lock source-of-truth ownership and restart semantics, later phases will continue layering redesigns on top of contradictory persistence behavior.

The most important planning move is to convert the current “16 flaws” list into a **phase disposition matrix with explicit authority rules**. That will keep implementation bounded, make test design honest, and prevent stale Phase 21 async-I/O artifacts from re-poisoning the active scope.
