# Migration Strategy Reference

**Status:** Reference Only (NOT an active plan)
**Date Created:** 2026-04-04
**Purpose:** Synthesize validated patterns from the audit plan and PRD for use by the active 6-phase plan in `.skills-lab/task_plan.md`

---

## 1. Active Plan Pointer

**The active implementation plan is at `.skills-lab/task_plan.md`** — a 6-phase plan covering Foundation Reset → CLI Substrate → Runtime Composition → Category System → Eval Harness → Selective Migration.

This file is a reference artifact. It captures patterns worth preserving and patterns worth discarding from the three archived plans:

- `plans/.archive/audit-plan-2026-04-03.md` — Skill ecosystem audit
- `plans/.archive/plan-2026-04-03.md` — Meta-builder ecosystem implementation
- `plans/.archive/expert-eval-plan-2026-04-03.md` — Eval ecosystem
- `plans/.archive/implementation-2026-04-03.md` — Detailed implementation steps

---

## 2. Good Patterns to KEEP from the Audit Plan

### 2.1 Gate Script Concept

Each skill pack has executable bash gate scripts that block progression. This is the strongest enforcement pattern and must be preserved in the CLI substrate.

| Gate Script | Blocks If |
|-------------|-----------|
| `scripts/preflight.sh "<request>"` | Empty request, skill not found, routing unclear |
| `scripts/intent-verify.sh --probe` | Stop conditions unmet |
| `scripts/check-complete.sh` | Phases incomplete, goal empty |
| `scripts/check-gate.sh <session> G1-G5` | Tasks missing, envelopes invalid |
| `scripts/validate-gate.sh <action> "<request>" <dir>` | Intent empty, validators missing |

**Migration Action:** Port these to `bin/lib/` as Node.js modules but keep bash versions as fallback. The CLI substrate (`hivemind-tools check <gate>`) should invoke either version.

### 2.2 Eval Harness Structure

The eval harness structure is validated and should be preserved:

```
eval-harness/
├── eval_runner.py          # Core runner
├── run-all.sh              # Full suite runner
├── fixtures/               # Mock state per test
├── chain-evals/            # End-to-end chain tests
├── results/                # Benchmark output
└── benchmark.json          # Aggregated metrics
```

**Migration Action:** Rebuild in `bin/lib/eval.cjs` with same structure. The `hivemind-tools eval run` command wraps this.

### 2.3 Hierarchical Loading Order

The 5-layer loading hierarchy is validated:

```
LAYER 0: meta-builder (Router)
LAYER 1: user-intent-interactive-loop (Front Agent)
LAYER 2: planning-with-files (Persistent Memory)
LAYER 3: coordinating-loop (Coordination)
LAYER 4: use-authoring-skills (Domain Execution)
```

**Migration Action:** This becomes the runtime composition engine's default loading sequence.

### 2.4 56-Flaw Analysis Methodology

The comprehensive flaw analysis that categorized issues by severity (CRITICAL, HIGH, MEDIUM, LOW) with root cause and fix is a reusable QA pattern.

**Migration Action:** Bake into `hivemind-tools eval run --audit` as a standard QA command.

---

## 3. Good Patterns to KEEP from the PRD

### 3.1 Feature Matrix (F01-F22)

The feature matrix with priority levels (P0/P1/P2) provides clear implementation ordering. The expanded scope (F17-F22) covers CLI substrate, runtime composition, background agents, categories, session recovery, and dual packaging.

### 3.2 KPI Targets

| KPI | Target |
|-----|--------|
| Skill trigger accuracy | >95% |
| Routing correctness | 100% clear, >80% ambiguous |
| End-to-end chain success | >90% |
| Eval pass rate | >95% |
| Runtime composition latency | <500ms p95 |

### 3.3 Quality Standards

| Standard | Value |
|----------|-------|
| Module LOC | <=500 |
| Plugin entry LOC | <100 |
| Skills per stack | <=3 |
| SKILL.md | <=500 lines |
| Eval cases per skill | >=8 |

### 3.4 User Personas

Platform Engineer, Skill Author, DevOps Engineer, Team Lead, New User — these personas inform CLI design, eval scenarios, and documentation structure.

---

## 4. What to DISCARD

### 4.1 The 20-Step Plan (Superseded)

The archived `plan-2026-04-03.md` has a 20-step plan (Step 1-20 with "STOP & COMMIT" checkpoints). This has been superseded by the 6-phase plan in `.skills-lab/task_plan.md`. The 20-step plan was too granular for a PRD-level document and mixed implementation details with product requirements.

**Discard entirely.** The 6-phase plan is the authority.

### 4.2 Detailed Fixture Descriptions

The archived `expert-eval-plan-2026-04-03.md` contains detailed eval fixture specifications (mock intent.json, task_plan.md, loaded-skills.json structures). These belong in implementation, not in planning documents.

**Discard from planning.** Will be recreated during Phase 5 (Eval Harness) of the active plan.

### 4.3 Static .md Agent Patterns

The archived `implementation-2026-04-03.md` treats skills as static `.md` files with copy-paste code blocks. The V3 architecture requires runtime build-on-demand — agents compose prompts dynamically, not from static templates.

**Discard the static approach.** Templates become reference material loaded on-demand, not the skill itself.

### 4.4 Skill-Pack-Only Scope

The entire framing of "meta-builder skill ecosystem" is too narrow. The project is a full platform harness. The PRD v2.0 corrects this.

**Discard the narrow framing.** Use "HiveMind V3 Platform Harness" as the project identity.

---

## 5. Cross-Reference Map

| Archived Source | Good Pattern | Active Phase |
|----------------|-------------|-------------|
| audit-plan § Gate scripts | Gate enforcement | Phase 2 (CLI Substrate) |
| audit-plan § Eval structure | Eval harness layout | Phase 5 (Eval Harness) |
| audit-plan § Hierarchical loading | LAYER 0-4 sequence | Phase 3 (Runtime Composition) |
| audit-plan § 56-flaw methodology | QA audit command | Phase 5 (Eval Harness) |
| PRD § F01-F16 feature matrix | Feature priorities | All phases |
| PRD § KPI targets | Success metrics | Phase 5+6 (Validation) |
| PRD § Quality standards | Boundary constraints | All phases |
| eval-plan § Chain eval scenarios | E2E test design | Phase 5 (Eval Harness) |

---

## 6. Key Decisions (LOCKED)

| Decision | Answer | Source |
|----------|--------|--------|
| Project scope | Full platform harness | AGENTS.md, task_plan.md |
| Agent definitions | Runtime build-on-demand | AGENTS.md |
| CLI architecture | Centralized Node.js router | task_plan.md Phase 2 |
| Distribution | Dual: npm SDK + npx git | task_plan.md Phase 5 |
| Eval infrastructure | Integrated into CLI | task_plan.md Phase 5 |
| Active plan authority | `.skills-lab/task_plan.md` | This document |
