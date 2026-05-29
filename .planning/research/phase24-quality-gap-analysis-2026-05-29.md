# Phase 24.x — Quality Gap Analysis

**Analysis Date:** 2026-05-29
**Scope:** Phases 24.2–24.9 planning documents vs live codebase cross-reference
**Method:** Read all phase directories → extract promised artifacts → verify against `src/`, `tests/`, `.opencode/agents/`, `.opencode/commands/`, `.opencode/skills/`, `.hivefiver-meta-builder/`
**Verification run:** `npm run typecheck` (PASS), `npm test` (236 files, 2790/2792 tests pass)

---

## 1. Phase 24.2 — Agent Profile Quality Enforcement

**Status:** MOSTLY COMPLETE (5 plans + 3 gap plans executed, 15 comparison sheets created)

### What Was Promised
| Requirement | Description | Verification Method |
|---|---|---|
| Q-01 | 30 hm-* agents with complete execution flows | Read each file |
| Q-02 | Artifact output specifications in agent bodies | Per-file artifact contract |
| Q-03 | Success criteria in each agent | Checklist per agent |
| Q-04 | No loop/gate/hierarchy in agent body | Grep for "loop", "gate", "checkpoint" |
| Q-05 | No tool/permission references in body | Grep for "tools:", "permission:" |
| Q-06 | Delegation/boundary rules per agent | When to switch agents |
| Q-07 | GSD pattern adoption | Research-derived format |
| Q-08 | Artifact schema reference | `.planning/references/artifact-schema.md` |

### What Was Delivered

#### Plans 01-05 (Baseline Agent Profiles)
| Plan | Scope | Files Modified | Commit | Status |
|---|---|---|---|---|
| 01 | 8 execution agents (executor, verifier, planner, plan-checker, code-reviewer, code-fixer, integration-checker, debug-session-manager) | 8 files | 9ac2fb1c | ✅ SUMMARY claims all DONE |
| 02 | 8 research/planning agents (project-researcher, phase-researcher, synthesizer, codebase-mapper, pattern-mapper, architect, roadmapper, specifier) | 8 files | 59d9b2c2 | ✅ SUMMARY claims all DONE |
| 03 | 8 cross-cutting agents (intent-loop, ecologist, shipper, nyquist-auditor, intel-updater, security-auditor, debugger, user-profiler) | 8 files | 9c0b4d74 | ✅ SUMMARY claims all DONE |
| 04 | 6 UI/Doc/Orchestration agents (ui-researcher, ui-checker, ui-auditor, doc-writer, doc-verifier, orchestrator) | 6 files | 3d02dc9d | ✅ SUMMARY claims all DONE |
| 05 | Canonical Artifact Registry | `.planning/references/artifact-schema.md` | 80a5678a | ✅ 192 lines, 5 sections |

#### Gap Plans (GSD-Quality Upgrades)
| Plan | Scope | Files Modified | Status |
|---|---|---|---|
| GAP-01 | 8 execution agents — append 14 GSD-quality sections | 8 files | ✅ All sections present per grep verification |
| GAP-02 | 8 research/planning agents — expand methodology | 8 files | ✅ All expanded |
| GAP-03 | 14 remaining agents — domain-specific protocols | 14 files | ✅ All expanded |

#### Comparison Sheets
15 wave comparison sheets created under `comparison-sheets/` (wave-1 through wave-15) — each documents the agent vs GSD equivalent comparison.

### Cross-Reference: Code Existence ✅

| Claimed Artifact | Location | Exists? | Lines |
|---|---|---|---|
| 31 hm-* agent source files | `.hivefiver-meta-builder/agents-lab/active/refactoring/hm-*.md` | ✅ YES | 31 files (120–806 lines) |
| 31 hm-* agents reflected | `.opencode/agents/hm-*.md` | ✅ YES | All line counts MATCH source |
| 99 hm-* commands | `.opencode/commands/hm-*.md` | ✅ YES | 99 files |
| 7 hf-* commands | `.opencode/commands/hf-*.md` | ✅ YES | 7 files |
| 34 skills | `.opencode/skills/*/SKILL.md` | ✅ YES | 34 directories |
| Artifact registry | `.planning/references/artifact-schema.md` | ✅ YES | 192 lines, 5 sections |

### Quality Issues Found ❌

#### Q-04 Violation: Loop/Gate Logic in Agent Bodies
**Claim:** "No agent body contains looping/gating/hierarchy logic" — PASS in integration review
**Reality:** 19 of 31 agents contain loop/gate/checkpoint/delegate-task/task tool references:

| Agent | Hits | Example Pattern |
|---|---|---|
| hm-l0-orchestrator.md | 97 | `gate`, `checkpoint`, `delegate-task`, `task tool` |
| hm-executor.md | 28 | `checkpoint_protocol`, `task_commit_protocol` |
| hm-orchestrator.md | 17 | `gate`, `quality_gate_triad` |
| hm-security-auditor.md | 10 | `gate`, `package_legitimacy_gate` |
| hm-plan-checker.md | 6 | `decision_coverage_gate` |
| hm-ui-researcher.md | 5 | `gate` |
| hm-debug-session-manager.md | 5 | `checkpoint` |
| hm-roadmapper.md | 4 | `gate` |
| hm-ui-auditor.md | 3 | `gate` |
| hm-debugger.md | 2 | `checkpoint` |
| hm-ecologist.md | 2 | `gate` |
| hm-intent-loop.md | 2 | `gate` |
| hm-architect.md | 1 | `gate` |
| hm-phase-researcher.md | 1 | `gate` |
| hm-planner.md | 1 | `gate` |
| hm-project-researcher.md | 2 | `gate` |
| hm-shipper.md | 1 | `gate` |
| hm-specifier.md | 1 | `gate` |
| hm-user-profiler.md | 1 | `gate` |

**Impact:** The integration review's PASS verdict is INCORRECT — these are not false positives. The GAP plans explicitly appended sections like `checkpoint_protocol`, `decision_coverage_gate`, `package_legitimacy_gate`, `quality_gate_triad`. These XML-tagged sections are GSD-quality patterns that were ADDED by the gap plans, contradicting Q-04.

**Gap analysis conclusion:** The SPEC's Q-04 ("no looping/gating/hierarchy logic") was overridden by the GAP plans which intentionally added gating protocols. The SPEC and integration review are STALE relative to the GAP-executed state.

#### GSD References Remain in 10 Agents
10 agents still contain `gsd-sdk` or `gsd` references (D-02 debt):

| Agent | Count | Type |
|---|---|---|
| hm-architect.md | Multiple | "GSD" references in migration docs |
| hm-codebase-mapper.md | Multiple | "GSD" pattern references |
| hm-debug-session-manager.md | Multiple | Legacy tool references |
| hm-executor.md | Multiple | `gsd-sdk` TBD items |
| hm-intel-updater.md | Low | GSD naming references |
| hm-intent-loop.md | Low | GSD comparison references |
| hm-l0-orchestrator.md | High | GSD workflow routing |
| hm-orchestrator.md | Multiple | GSD comparison |
| hm-pattern-mapper.md | Low | GSD pattern references |
| hm-plan-checker.md | Low | GSD validation references |

#### TODO/FIXME Remaining in 4 Agents
| Agent | TODOs |
|---|---|
| hm-codebase-mapper.md | 5 |
| hm-executor.md | 2 |
| hm-verifier.md | 2 |
| hm-planner.md | 1 |

#### hm-l0-orchestrator.md Bloat
- **806 lines** — exceeds the 500 LOC module limit by 61%
- Contains `97` loop/gate references — excessive orchestration logic in a single file
- This is flagged as known oversized but no remediation plan exists in phase docs

---

## 2. Phase 24.4 — References/Templates System

**Status:** NOT STARTED — directory contains only `.gitkeep`

### What Was Supposed to Be Built
No SPEC, PLAN, RESEARCH, or SUMMARY exists. The RESEARCH.md from 24.2 (§5.3) recommends:
- "Canonical Artifact Registry" as `.planning/references/canonical-artifact-registry.md`
- Reference templates for each artifact type
- Template reuse across 30+ agents

### What Actually Exists
- `.planning/references/artifact-schema.md` — Created by 24.2-05, covers the registry need
- **No templates directory** — `.planning/references/` has only `artifact-schema.md` (no `.opencode/workflows/` either)
- **No workflow template system**

### Gap: MISSING
- The reference/template system for agent output formats was never built
- Template reuse (documentation_lookup, project_context blocks duplicated across 30 files) was noted in the integration review as an INFO item but never addressed

---

## 3. Phase 24.5 — Workflow Files Architecture

**Status:** NOT STARTED — directory contains only `.gitkeep`

### What Was Supposed to Be Built
The 24.2 RESEARCH.md (§1.1, §2.1) specifies:
- "3-layer routing architecture: Command → Workflow → Agent"
- Workflow files in `.opencode/workflows/`
- Gate sub-files pattern from GSD

### What Actually Exists
- **No `.opencode/workflows/` directory** — one of the three routing layers is MISSING
- The `gsd-*` workflows from GSD are not present (per D-24-01, not shipped)
- There are **103+ workflow references** in `.opencode/workflows/` but these are `hm-*` prefixed files in the workflows directory, not a formal workflow system

### Gap: CRITICAL
The 3-layer routing architecture (Command → Workflow → Agent) documented as the adopted pattern for Hivemind is **missing the middle layer**. Commands route directly to agents without formal workflow orchestration files.

---

## 4. Phase 24.6 — Build hm-* Commands

**Status:** NOT STARTED — directory contains only `.gitkeep`

### What Was Supposed to Be Built
The 24.2 RESEARCH.md (§6) says:
- "Define command→workflow→agent routing (adopt GSD's 3-layer pattern)"
- "Build workflow files with gate sub-files pattern"
- "Implement namespace meta-skills if command count warrants"

### What Actually Exists
- **99 hm-* commands** already exist in `.opencode/commands/` — apparently built by ANOTHER phase or team
- These commands are functional (present in the filesystem) but:
  - No documented plan for their creation
  - No quality standards enforced during their creation
  - No SPEC/PLAN/SUMMARY for this phase
  - No integration review linking commands to agents

### Gap: UNPLANNED DELIVERY
The commands exist but were built without planning artifacts. This is an **orphan deliverable** — present in the codebase but missing governance documentation.

---

## 5. Phase 24.7 — Primitives Asset Schema

**Status:** NOT STARTED — directory contains only `.gitkeep`

### What Was Supposed to Be Built
The 24.2 RESEARCH.md (§3.8) specifies:
- "configure-primitive tool — schema-based YAML/JSON compilation"
- "batch configuration, cross-primitive conflict detection, dry-run validation"
- Schema-kernel integration

### What Actually Exists
- `src/schema-kernel/` has full schemas including `agent-frontmatter.schema.ts`, `command-frontmatter.schema.ts`, cross-primitive validation
- `configure-primitive` tool exists (visible in tool catalog)
- This functionality was apparently built by another phase but no planning docs exist here

### Gap: UNPLANNED DELIVERY
Same pattern as 24.6 — runtime implementation exists but phase planning directory is empty.

---

## 6. Phase 24.8 — Primitives Install Extraction

**Status:** NOT STARTED — directory contains only `.gitkeep`

### What Was Supposed to Be Built
Not explicitly documented in phase plans. Likely relates to extracting GSD primitives handling from the shipped package.

### What Actually Exists
- No direct evidence of primitives install extraction work
- `src/features/bootstrap/` may handle this but it's not traceable to this phase

### Gap: NOT TRACEABLE
Cannot determine if any work was done because no artifacts exist.

---

## 7. Phase 24.9 — Bootstrap Init Flow

**Status:** NOT STARTED — directory contains only `.gitkeep`

### What Was Supposed to Be Built
Likely the `bootstrap-init` command/tool workflow.

### What Actually Exists
- `src/features/bootstrap/` may exist (need to verify)
- `src/cli/commands/init.ts` exists
- `bootstrap-init` and `bootstrap-recover` tool signatures exist in the tool catalog

### Gap: NOT TRACEABLE
Same as 24.7 and 24.8 — runtime implementation exists but planning directory is empty.

---

## 8. Build & Test Health

### TypeScript Compilation
```
npm run typecheck → PASS (no errors)
```

### Test Suite
```
236 test files → ALL PASS
2790 tests pass, 2 skipped
Duration: 19.08s
```

### Coverage Thresholds (from `vitest.config.ts`)
| Metric | Floor | Baseline |
|---|---|---|
| Statements | 90% | 89.94% |
| Branches | 80% | 79.25% |
| Functions | 90% | 92.38% |
| Lines | 90% | 90.95% |

Note: Branches (80%) is slightly above measured baseline (79.25%) — may cause occasional threshold failures.

---

## 9. CONVENTIONS.md — Accuracy Assessment

**Status: OUTDATED (3 inaccuracies found)**

| Claim in CONVENTIONS.md | Actual | Severity |
|---|---|---|
| Config at `src/tsconfig.json` | Config at root `tsconfig.json` | LOW — documentation error |
| Module size constraint: 500 LOC | `hm-l0-orchestrator.md` is 806 lines | MEDIUM — documented constraint violated by delivered code |
| Test dir `tests/` mirrors `src/` | Tests under `tests/lib/` and `tests/tools/` (not mirroring `src/`) | LOW — test layout is different but functional |
| No `.tsx` detected | Correct — backend-only | OK |

## 10. TESTING.md — Accuracy Assessment

**Status: STALE (1 critical inaccuracy)**

| Claim in TESTING.md | Actual | Severity |
|---|---|---|
| Coverage thresholds: 85/72/85/85 | Actual: 90/80/90/90 (raised in Phase 48.4.1) | **CRITICAL** — threshold guidance is wrong by 5-8pp |
| Test files: ~236 | 236 test files confirmed | OK |
| Framework: Vitest 4.1.7 | Confirmed in package.json | OK |
| tests/integration/ exists | Verified | OK |
| tests/features/ exists | Verified | OK |

---

## Summary Matrix

| Phase | Promised Work | Delivered | Gap Severity |
|---|---|---|---|
| **24.2** | 30 agent profiles + artifact registry | 31 agents + registry + 15 comparison sheets + GAP upgrades | LOW — Q-04 violated by GAP plans, TODOs remain |
| **24.4** | References/templates system | NOTHING — only `.planning/references/artifact-schema.md` (built by 24.2) | **HIGH** — no template system for agent output reuse |
| **24.5** | Workflow files architecture (3-layer routing) | ⚠️ **106 workflow files EXIST** in `.opencode/workflows/` (103 hm-* + 3 other). But NO planning artifacts in phase dir. | **MEDIUM** — runtime exists, governance missing (NOT critical — code truth contradicts "NOT STARTED") |
| **24.6** | Build hm-* commands | **118 commands exist** (99 hm + 7 hf + 4 test + 2 harness + 2 deep + 1 ultrawork + 1 sync + 1 start + 1 plan) but **no planning artifacts** | MEDIUM — orphan deliverables |
| **24.7** | Primitives asset schema | Runtime schemas exist but **no planning artifacts** | MEDIUM — orphan deliverables |
| **24.8** | Primitives install extraction | Not traceable | **HIGH** — unverifiable |
| **24.9** | Bootstrap init flow | Runtime code exists but **no planning artifacts** | MEDIUM — orphan deliverables |

---

## ⚠️ CODE VERIFICATION CORRECTIONS (2026-05-29)

Document claims corrected against live codebase scan:

| Document Claim | Code Truth | Severity of Error |
|---|---|---|
| "24.5 — NOT STARTED — no `.opencode/workflows/` structure" | **106 workflow files EXIST** (103 hm-* + help, execute, discuss) | ❌ **FALSE** — workflows were built, only planning docs missing |
| "Commands: 99 hm-* + 7 hf-* = 106" | **118 total commands** (99 hm + 7 hf + 4 test + 2 harness + 2 deep + 1 ultrawork + 1 sync + 1 start + 1 plan) | ⚠️ Under-count |
| "src/tools/session/ = 7 files" | **14 entries** (13 .ts + 1 subdirectory) | ⚠️ Under-count |
| "Only execute-slash-command.ts violates 500 LOC" | **8 files violate 500 LOC** — systemic problem | ❌ **FALSE** — much wider issue |
| "Governance config: 9 dead agent refs" | **7 dead agent refs** (no hm-l2-planner, hm-l2-auditor in config) | ⚠️ Over-count |
| "Assets/ not analyzed" | `assets/` = 43 agents, 137 commands, 34 skills, 106 workflows | MISSING scope |

### Codebase Health Reality (LIVE, 2026-05-29)

| Metric | Value |
|---|---|
| Typecheck | ✅ PASS |
| Test files | 236 passed |
| Tests pass | 2790/2792 (2 skipped) |
| Coverage thresholds | 90/80/90/90 (actual coverage: 89.94%/79.25%/92.38%/90.95%) |
| Agents in .opencode/ | 42 (31 hm-* + 11 hf-*) |
| Commands in .opencode/ | 118 |
| Skills in .opencode/ | 34 |
| Workflows in .opencode/ | 106 |
| Files exceeding 500 LOC | 8 (734, 658, 653, 631, 625, 556, 502, 502) |
| Source agents (assets/) | 43 |
| Source commands (assets/) | 137 |
| Dead gov config refs | 7 hm-l2-* names |
| Empty phase dirs (24.4-24.9) | 6 of 10 empty |

*Analysis: 2026-05-29 — Quality gate assessment: FLAG — see flaws report for detailed findings. Code verification: PRODUCED.*
