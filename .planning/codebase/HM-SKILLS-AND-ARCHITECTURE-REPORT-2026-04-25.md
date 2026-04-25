# hm-* Skills State & Architecture Decisions Report

**Analysis Date:** 2026-04-25
**Source:** `.opencode/skills/hm-*/`, `.planning/phases/16.4-*`, `.planning/phases/26-*` through `30-*`, `docs/draft/`, `docs/plans/`

---

## 1. Complete hm-* Skills Inventory

25 hm-* skills found in `.opencode/skills/`. Each assessed for tier, lineage cluster, and production readiness.

### Core Orchestration Skills (Layer 1, role: orchestrator)

| Skill | Description | Tier | RICH Status | Cluster | Key Gaps |
|-------|-------------|------|-------------|---------|----------|
| `hm-coordinating-loop` | Multi-agent dispatch with validation gates and handoff protocols | SUBSTANTIVE | BLOCKED (Phase 30) | G-A | Needs third-party crawl evidence for RICH PASS |
| `hm-meta-builder` | Routes OpenCode meta-concept requests to specialist authors | SUBSTANTIVE | N/A | G-D | Strong references (12), evals, scripts |
| `hm-phase-execution` | Execute GSD-style phase plans with wave-based parallelization | THIN | BLOCKED (Phase 29) | G-D | Needs evals, deeper evidence |
| `hm-research-chain` | Orchestrate canonical research chain: detect→research→synthesize→artifact | THIN | PARTIAL (Phase 28) | G-C | Has evals/scripts/references but RICH incomplete |
| `hm-user-intent-interactive-loop` | Probe unclear user intent across long sessions | SUBSTANTIVE | BLOCKED (Phase 30) | G-A | 6 references, 4 scripts, 2 evals; needs RICH crawl |

### Domain-Execution Skills (Layer 2, role: domain-execution)

| Skill | Description | Tier | RICH Status | Cluster | Key Gaps |
|-------|-------------|------|-------------|---------|----------|
| `hm-completion-looping` | Guardrail workflows against regression with non-completion detection | SUBSTANTIVE | BLOCKED (Phase 30) | G-A | Only stacked-scenario carrier; body depth modest |
| `hm-debug` | Systematic debugging with persistent state across context resets | THIN | BLOCKED (Phase 29) | G-D | Needs deeper third-party evidence |
| `hm-deep-research` | Version-matched deep research with MCP tools and citation tracking | THIN | PARTIAL (Phase 28) | G-C | Lacks eval/script packages |
| `hm-detective` | Investigate codebases with SCAN, READ, and DEEP reading modes | THIN | PARTIAL (Phase 28) | G-C | Lacks eval/script packages |
| `hm-phase-loop` | Manage iterative phase loops with entry/exit gates and checkpoint recovery | THIN | BLOCKED (Phase 30) | G-A | Needs evals and deeper bundled resources |
| `hm-planning-with-files` | Persist task state across sessions with 3-file external memory system | THIN | BLOCKED (Phase 29) | G-D | HOLLOW in Phase 18 context |
| `hm-refactor` | Decide between surgical and structural refactoring with scope/safety/rollback | THIN | BLOCKED (Phase 29) | G-D | Has evals + refs; needs deeper evidence |
| `hm-research-chain` | (See Orchestration above) | — | — | — | — |
| `hm-spec-driven-authoring` | Turn PRD/spec into falsifiable requirements and acceptance criteria | SUBSTANTIVE | PARTIAL (Phase 27) | G-B | Rewritten in Phase 27; v1.2.0; RICH partial |
| `hm-synthesis` | Compress research findings into actionable artifacts with tiered reduction | THIN | PARTIAL (Phase 28) | G-C | Lacks eval/script packages |
| `hm-test-driven-execution` | Test-first implementation with RED/GREEN/REFACTOR cycles | SUBSTANTIVE | PARTIAL (Phase 27) | G-B | Rewritten in Phase 27; v1.2.0; RICH partial |

### Platform/Infrastructure Skills (Reference & Audit)

| Skill | Description | Tier | RICH Status | Cluster | Key Gaps |
|-------|-------------|------|-------------|---------|----------|
| `hm-opencode-platform-reference` | Complete OpenCode platform docs (agents, plugins, SDK, tools, permissions) | SUBSTANTIVE | N/A | Ref | Read-only reference; 8+ reference files |
| `hm-opencode-project-audit` | Audit OpenCode projects across skills, commands, tools, permissions | SUBSTANTIVE | BLOCKED (Phase 29) | G-D | Has scripts, assets, profiles; needs RICH |
| `hm-opencode-project-inspection` | Inspect OpenCode project state across skills/agents/commands/tools | SUBSTANTIVE | N/A | G-D | Has scripts; similar to audit but different scope |
| `hm-opencode-non-interactive-shell` | Shell non-interactive strategy for headless agent execution | SUBSTANTIVE | BLOCKED (Phase 29) | G-D | Has evals, 4 references, scripts |
| `hm-omo-reference` | Complete oh-my-openagent architecture as packed reference | SUBSTANTIVE | N/A | Ref | Read-only reference skill |

### Specialist Skills (Authoring, Meta, Support)

| Skill | Description | Tier | RICH Status | Cluster | Key Gaps |
|-------|-------------|------|-------------|---------|----------|
| `hm-agent-composition` | Compose specialist agents from user intent using XML markup grammar | THIN | BLOCKED (Phase 29) | G-D | Has refs/evals/scripts; needs deeper crawl |
| `hm-agents-md-sync` | Detect and fix drift between AGENTS.md and actual codebase state | HOLLOW | BLOCKED (Phase 29) | G-D | No refs, no evals, weak evidence |
| `hm-command-parser` | Parse $ARGUMENT propositional commands from OpenCode command strings | HOLLOW | BLOCKED (Phase 29) | G-D | No evals; cycle/audit/context gaps |
| `hm-skill-synthesis` | Synthesize skills from GitHub repos, classify patterns, build templates | THIN | N/A | G-C | Has refs, evals.json; needs deeper evidence |
| `hm-subagent-delegation-patterns` | Document and apply subagent delegation patterns for OpenCode | SUBSTANTIVE | BLOCKED (Phase 30) | G-A | Has refs, evals, scripts; RICH incomplete |

### Summary Statistics

| Metric | Value |
|--------|-------|
| Total hm-* skills | 25 |
| EXEMPLAR | 0 |
| SUBSTANTIVE | 11 |
| THIN | 12 |
| HOLLOW | 2 |
| Skills with eval JSON | 7 |
| Skills with scripts | 14 |
| Skills with references | 18 |
| Skills passing RICH gate | 0 (all BLOCKED or PARTIAL) |
| Layer 1 (orchestrator) | 5 |
| Layer 2 (domain-execution) | 14 |
| Reference/infrastructure | 5 |
| Specialist/authoring | 5 |

### Skill Dependency Map

```
hm-meta-builder → hm-agent-composition, hm-command-parser, hm-skill-synthesis
hm-coordinating-loop → hm-completion-looping, hm-subagent-delegation-patterns
hm-phase-execution → hm-phase-loop, hm-planning-with-files
hm-research-chain → hm-deep-research, hm-detective, hm-synthesis
hm-opencode-project-audit → hm-opencode-platform-reference, hm-opencode-project-inspection
hm-user-intent-interactive-loop → hm-coordinating-loop (handoff)
```

---

## 2. Phase 16.4 Architectural Decisions

**Source:** `.planning/phases/16.4-harness-architecture-baseline-migration-control-plane/`

### 14 Locked Requirements

Phase 16.4 established 14 requirements (P16.4-01 through P16.4-14) covering:

1. **Stale-decision validation register** — Decision register with `valid`/`partial`/`stale`/`rejected`/`needs-research` verdicts
2. **Soft CQRS architecture rule** — Replace global "tools write, hooks read" with case-by-case mutation authority
3. **State ownership model** — Canonical, derived, projected, archived, future/optional state categories
4. **Runtime classification framework** — 5 runtime classes with actor/consumer/task/workflow matrix
5. **Lifecycle ownership rule** — Named lifecycle owners with forbidden-duplicate-authority rule
6. **Component map and code-tree baseline** — Supersedes stale Phase 11 assumptions
7. **Hiveminder/Hivefiver boundary clarification** — Neither is a soft harness
8. **OpenCode platform conformance** — Evidence-backed platform constraints vs conventions
9. **Concept-migration control plane** — Gates for product-detox concept migration
10. **First-big-win selection** — Session journal + execution lineage bridge selected
11. **Human/agent collaboration model** — Required views for coordinator/sidecar
12. **Memory and retrieval taxonomy** — 8 memory categories classified
13. **GUI/Hivefive sidecar compatibility** — Sidecar may read/query/render/request, never write canonical state
14. **Architecture validation guards** — Fact-reporting scripts with explicit classification

### 12 Key Decisions (D-01 through D-24)

| Decision | Summary | Impact |
|----------|---------|--------|
| D-01 to D-05 | Validation artifact design: decision register + guard scripts | Prevents stale doc poisoning |
| D-06 to D-10 | Target code-tree authority: 16.4 supersedes Phase 11 | Phase 11 architecture is stale |
| D-11 to D-16 | State/memory: `.hivemind/` preferred canonical root, `.opencode/state/` is migration input | Bridges state roots |
| D-17 to D-20 | Runtime classification: actor/consumer/task/workflow matrix | Replaces lifecycle-only model |
| D-21 to D-24 | First-big-win: session journal + execution lineage bridge selected | Delegation manifest paused |

### Decision Register Verdicts

| ID | Claim | Verdict |
|----|-------|---------|
| REG-01 | Global tools-write/hooks-read CQRS | **stale** — Replace with mutation authority matrix |
| REG-02 | Hooks cannot mutate outputs | **rejected** — Bounded hook mutation allowed |
| REG-03 | Hiveminder/Hivefiver are soft harnesses | **rejected** — Neither is a soft harness |
| REG-04 | Phase 11 target tree is authoritative | **stale** — Superseded by 16.4 baseline |
| REG-05 | Nonexistent/stale file claims are reusable | **rejected** — Must verify live files |
| REG-06 | notification-handler.ts is dead | **stale** — Still active in terminal transitions |
| REG-07 | Product-detox READY items can be brought wholesale | **rejected** — Concept migration only |
| REG-08 | plugin.ts should remain thin composition root | **valid** — Keep thin |
| REG-09 | src/ is hard, .opencode/ is soft | **valid** — Preserve boundary |
| REG-10 | .opencode/state/opencode-harness/ is current reality | **valid** — Migration input, not target |
| REG-11 | .hivemind/ is preferred canonical root | **valid** — Needs bridge before switch |
| REG-12 | Platform-sensitive claims need revalidation | **needs-research** — Re-check before implementation |

---

## 3. CQRS Decisions — Validation Status: RESOLVED

**Source:** `16.4-DECISION-REGISTER.md`, `16.4-ARCHITECTURE-BASELINE.md`

### Concern C1 Resolution

Global "tools write, hooks read" CQRS has been formally marked **stale** (REG-01) and **rejected** for hooks-can't-mutate (REG-02).

**Replacement:** Case-by-case mutation authority matrix with 9 surfaces:
- Tool surface → validate, call library, write state, return result
- tool.execute.before → validate/block/mutate tool args
- tool.execute.after → append metadata/projections
- messages.transform → transform/hydrate messages
- event hook → observe + bounded idempotent side effects
- Library persistence → own canonical JSON writes
- SDK wrapper → create/query through typed wrappers
- Fact-reporting script → read-only checks
- Sidecar/read model → read/query/render/request only

**Key constraint:** Every mutation surface declares owner, persistence target, idempotency rule, and recovery behavior.

---

## 4. Runtime Classification — Validation Status: RESOLVED

**Source:** `16.4-ARCHITECTURE-BASELINE.md` lines 51-59

Five runtime classes defined with full matrix:

| Runtime Class | Triggering Surface | Actor | Consumer |
|---------------|-------------------|-------|----------|
| Session initiation | User starts/resumes session | Human + coordinator | Coordinator, hooks, sidecar |
| Mid-flow intervention | User changes intent/interrupts | Human/coordinator | Coordinator + active subagents |
| Post-completion | Delegation reaches terminal state | Manager/handler/hook | Human, coordinator, future journal |
| Delegated subtask | delegate-task dispatches | Front-facing agent; child agent | Parent coordinator + status tools |
| Background command | run-background-command dispatches | Agent/tool caller | Coordinator/status tool |

---

## 5. Soft vs Hard Harness Distinction — Validation Status: RESOLVED

**Source:** `16.4-ARCHITECTURE-BASELINE.md` lines 125-132

**Locked definition:**
- **Hard Harness** = npm package source (`src/`): plugin assembly, hooks, tools, lib runtime owners, shared, schema-kernel
- **Soft Meta-Concepts** = user-configurable (`.opencode/`): skills, agents, commands, rules, permissions
- **Hiveminder** = built-in meta-concept/runtime-integration module (code-first, schema-defined, SDK-backed, config-oriented)
- **Hivefiver** = end-user meta-builder module for OpenCode primitives
- **Neither is a soft harness**
- `.md` files are transition-stage artifacts toward runtime-integrated code

---

## 6. Migration Plan Status

**Source:** `docs/plans/migration-plan-detox-to-harness-2026-04-24.md`, `16.4-MIGRATION-CONTROL-PLANE.md`

### Current Status: Concept-First Migration Active

- Migration plan from v2.9.5-detox-dev (~15,000 LOC) → harness (~4,100 LOC) exists
- Phase 16.4 locked concept-migration-only approach: no product-detox code is copied as-is
- 11 candidate concepts mapped through migration gates (session-journal, trajectory, task, event-tracker, etc.)
- **Selected first-big-win:** Session journal + execution lineage bridge (D-21, D-22)
- **Paused:** Delegation manifest/notification mediation until baseline gates exist (D-23)

### Candidate Concept Matrix (from 16.4-MIGRATION-CONTROL-PLANE.md)

| Concept | Conflict Risk | Status |
|---------|--------------|--------|
| event-tracker | Medium | Concept extraction only |
| session-journal | Low/Medium | Selected first-big-win |
| trajectory | Medium | Deferred |
| task | Medium | Deferred |
| agent-work-contract | Medium/High | Requires future gate |
| runtime-entry | Medium | Deferred |
| session-entry | Low/Medium | Deferred |
| workflow-management | High | Use as concept input only |
| .hivemind | High | Needs taxonomy + bridge |
| apps/side-car | High | Future, requires approval gate |

---

## 7. Phases 26-30 Status (hm-* Quality Lineage)

**Source:** `.planning/phases/26-*/`, `27-*/`, `28-*/`, `29-*/`, `30-*/`

### Phase 26: Synthesize All hm-* Skills Debts/Gaps/Conflicts
- **Status:** COMPLETE (synthesis phase)
- **Output:** `26-PLAYBOOK.md` (binding quality contract), `26-ECOLOGY-AUDIT.md` (31 skills inventoried), `26-EXECUTION-ROADMAP.md`
- **Quality tiers established:** EXEMPLAR, SUBSTANTIVE, THIN, HOLLOW
- **D1-D8 dimensions defined:** Trigger Accuracy, Body Depth, 6-NON Defence, Eval Coverage, Reference Completeness, Integration Wiring, Platform Compatibility, Self-Correction
- **RICH gate added:** Requires top-3 third-party crawl + bundled resource review + Pattern 1/2/3 decisions

### Phase 27: G-B Quality Assurance (hm-spec-driven-authoring, hm-test-driven-execution)
- **Status:** COMPLETE but RICH-BLOCKED
- **Targets:** `hm-spec-driven-authoring` (v1.2.0), `hm-test-driven-execution` (v1.2.0)
- **Work done:** Skills rewritten with deeper body, evidence schema, demonstration packs
- **RICH status:** PARTIAL — third-party crawl evidence incomplete

### Phase 28: G-C Research Lineage (deep-research, detective, synthesis, research-chain)
- **Status:** PARTIAL/BLOCKED
- **Targets:** `hm-deep-research`, `hm-detective`, `hm-synthesis`, `hm-research-chain`
- **RICH status:** PARTIAL — `skills.volces.com@deep-research` returned 404; per-skill BLOCKED on deep-research third-party crawl

### Phase 29: G-D Execution Lineage (debug, refactor, phase-execution, planning, command-parser, agents-md-sync, etc.)
- **Status:** PARTIAL/BLOCKED
- **Targets:** 11 skills including `hm-debug`, `hm-refactor`, `hm-phase-execution`, `hm-planning-with-files`, `hm-command-parser`, `hm-agent-composition`, `hm-agents-md-sync`, `hm-opencode-project-audit`, `hm-opencode-project-inspection`, `hm-opencode-non-interactive-shell`, `hm-opencode-platform-reference`
- **RICH status:** PARTIAL — partial hardening applied, full PASS blocked by incomplete per-skill crawls

### Phase 30: G-A Guardrail Lineage (completion-looping, coordinating-loop, phase-loop, delegation-patterns, user-intent)
- **Status:** BLOCKED
- **Targets:** `hm-completion-looping`, `hm-coordinating-loop`, `hm-phase-loop`, `hm-subagent-delegation-patterns`, `hm-user-intent-interactive-loop`
- **RICH status:** RICH PASS: 0 — all five targets BLOCKED for missing third-party crawl/adoption evidence
- **Recovery plan:** Requires guardrail/delegation/loop orchestration crawling, bundled-resource review, Pattern 1/2/3 decisions

---

## 8. Identified Gaps and Unresolved Decisions

### Critical Gaps

1. **No hm-* skill has achieved RICH PASS** — All 25 skills are BLOCKED or PARTIAL at the RICH quality gate. The D1-D8-only scores are insufficient for production-grade skills.

2. **Hollow skills need complete rewrite:**
   - `hm-agents-md-sync` — No references, no evals, weak evidence
   - `hm-command-parser` — No evals; cycle/audit/context gaps

3. **Eval coverage is the dominant ecosystem gap** — 18 of 31 skills have zero eval JSON files.

4. **Phase 30 (guardrail lineage) is fully blocked** — The 5 most critical orchestration skills (`hm-coordinating-loop`, `hm-phase-loop`, `hm-subagent-delegation-patterns`, `hm-completion-looping`, `hm-user-intent-interactive-loop`) cannot pass RICH without third-party crawl evidence that previous sessions failed to obtain.

### Unresolved Architecture Decisions

5. **`.hivemind/` state root migration** — Preferred canonical root defined (D-11) but no implementation exists. Current `.opencode/state/opencode-harness/` remains the writer. Bridge design deferred.

6. **Delegation manifest/notification mediation** — Important but paused (D-23). Resumes after state ownership, runtime classification, and journal/lineage decisions lock.

7. **Session journal + execution lineage bridge** — Selected as first-big-win (D-21, D-22) but not yet implemented. This is the recommended next phase after 16.4.

8. **Sidecar/GUI implementation** — Boundaries defined (read-only projections, no canonical writes) but implementation entirely deferred.

9. **Vector memory and graph query** — Classified as future/optional. No implementation. Requires schemas, privacy, rebuild, and authority gates.

10. **`delegation-manager.ts` exceeds 500 LOC** — Locked at 510 lines. Decision to split after deeper module design. No current plan to act.

### Open RICH Gate Blockers

11. **`skills.volces.com@deep-research` unavailable** — Third-party crawl for research skills returned 404. Cannot complete Phase 28 RICH PASS without alternative source.

12. **Pattern 1/2/3 decisions missing for most skills** — Adoption/adapt/reject decisions for third-party patterns are not documented for the majority of hm-* skills.

---

## 9. Concern Validation Summary

| # | Concern | Status | Resolution |
|---|---------|--------|------------|
| C1 | Global CQRS read/write/query separation | **RESOLVED** | Replaced with case-by-case mutation authority matrix (REG-01 stale, REG-02 rejected) |
| C2 | Mutation constraints across surfaces | **RESOLVED** | 9-surface mutation authority matrix with owner/target/idempotency/recovery |
| C3 | Hiveminder/Hivefiver not soft harness | **RESOLVED** | Explicitly locked: neither is a soft harness; `.md` is transitional |
| C4 | Runtime classification lacks actors/consumers | **RESOLVED** | 5 runtime classes with full actor/consumer/task/workflow matrix |
| C5 | Harness component understanding shallow | **RESOLVED** | Component map + OpenCode platform conformance validated against evidence |
| C6 | Agent-led collaboration needs active task stems/memory | **PARTIALLY RESOLVED** | Model defined; implementation deferred to session journal bridge (first-big-win) |
| C7 | User-facing guidance/sidecar needs safe read models | **PARTIALLY RESOLVED** | Boundaries defined; implementation deferred. Sidecar may never write canonical state. |

---

## 10. Key Source Documents Reference

| Document | Path | Purpose |
|----------|------|---------|
| Decision Register | `.planning/phases/16.4-*/16.4-DECISION-REGISTER.md` | 12 verdicts on inherited claims |
| Architecture Baseline | `.planning/phases/16.4-*/16.4-ARCHITECTURE-BASELINE.md` | Mutation matrix, state ownership, runtime classes |
| Migration Control Plane | `.planning/phases/16.4-*/16.4-MIGRATION-CONTROL-PLANE.md` | Product-detox concept gates |
| First-Big-Win Scorecard | `.planning/phases/16.4-*/16.4-FIRST-BIG-WIN-SCORECARD.md` | Session journal selected |
| SPEC | `.planning/phases/16.4-*/16.4-SPEC.md` | 14 locked requirements |
| CONTEXT | `.planning/phases/16.4-*/16.4-CONTEXT.md` | D-01 through D-24 decisions |
| RESEARCH | `.planning/phases/16.4-*/16.4-RESEARCH.md` | 548-line evidence gathering |
| PLAYBOOK | `.planning/phases/26-*/26-PLAYBOOK.md` | D1-D8 quality dimensions + RICH gate |
| Ecology Audit | `.planning/phases/26-*/26-ECOLOGY-AUDIT.md` | 31-skill inventory with tier scoring |
| Migration Plan | `docs/plans/migration-plan-detox-to-harness-2026-04-24.md` | Detox→harness migration (stale CQRS assumptions) |
| Architecture Proposal | `docs/draft/architecture-proposal-hivemind-v3.md` | Historical proposal (evidence input only per REG-04) |

---

*Report generated: 2026-04-25 by gsd-codebase-mapper subagent*
