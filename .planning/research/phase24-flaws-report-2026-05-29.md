# Phase 24.x — Flaws Report

**Analysis Date:** 2026-05-29
**Focus:** Specific bugs, broken assumptions, and quality defects found during forensic cross-reference

---

## FLAW-01: SPEC Q-04 vs GAP Execution Contradiction

**Severity:** HIGH
**Type:** Spec violation (unflagged by integration review)

### Description
The SPEC (`24.2-SPEC.md`) requires Q-04: *"No agent body contains looping/gating/hierarchy logic."* The integration review (`24.2-INTEGRATION-REVIEW.md`) claims all 30 agents PASS this check (see §2.2, "Body Quality: CLEAN").

However, the GAP plans (GAP-01, GAP-02, GAP-03) **intentionally appended** XML-tagged sections containing gating logic:

| Section | Agent | Added By |
|---|---|---|
| `<checkpoint_protocol>` | hm-executor | GAP-01 Task 1 |
| `<decision_coverage_gate>` | hm-plan-checker | GAP-01 Task 5 |
| `<fix_scope_rules>` | hm-code-fixer | GAP-01 Task 6 |
| `<package_legitimacy_gate>` | hm-security-auditor | GAP-03 Task 6 |
| `<quality_gate_triad>` | hm-orchestrator | GAP-03 Task 14 |
| `<evidence_hierarchy>` | hm-verifier | GAP-01 Task 3 |

### Evidence
```bash
# 19 of 31 agents contain loop/gate/checkpoint references
# Aggregated hits across all agents: 189+ occurrences
```

### Impact
The integration review claimed "PASS" but the GAP execution actively violated Q-04. Either:
1. The GAP plans should have been exempt from Q-04 (door left open without documentation), or
2. The integration review needs to be re-run against the post-GAP state

**Recommendation:** Either amend Q-04 to allow protocol-level gating (vs orchestration-level gating), or move all gate sections out of agent bodies. The distinction between "programmatic gate" and "procedural gate" was never clearly defined in the spec.

---

## FLAW-02: 10 Agents Still Reference `gsd-sdk` / `gsd`

**Severity:** MEDIUM
**Type:** Legacy dependency (D-02 debt, not fully closed)

### Description
Despite GAP plans claiming to remove GSD references, 10 agents still contain `gsd-sdk` or `gsd` references. The `gaps-and-debts-tracking.md` says "Remove all legacy GSD references from updated files" as a future action item, but the GAP plans did NOT fully accomplish this.

### File Evidence

**hm-architect.md:**
```
References "GSD" in architecture comparison sections
```

**hm-codebase-mapper.md:**
```
References GSD patterns and methodology names
```

**hm-executor.md:**
```
Contains `gsd-sdk` TBD references in state_updates section
(TODO items referencing `gsd-sdk query state.*` patterns)
```

**hm-l0-orchestrator.md:**
```
Multiple references to GSD workflow routing patterns
Contains 97 loop/gate references — possible GSD XML pattern carryover
```

### Impact
- If `gsd-sdk` commands don't exist in the Hivemind runtime, these references are dead code in agent instructions
- New agents reading these files may try to call non-existent CLI tools
- These references prevent clean namespace separation per D-24-01

**Recommendation:** Audit and replace all `gsd-sdk` text references with Hivemind-native equivalents or `TBD: {feature}` annotations.

---

## FLAW-03: 10 TODO/FIXME Items Remain in 4 Agent Files

**Severity:** LOW
**Type:** Incomplete implementation

### Description
Plans 01-05 claimed "No TODO comment placeholders remain" (verified with zero results at time of execution). But the GAP phase and subsequent modifications reintroduced TODOs.

### File Evidence
- `.hivefiver-meta-builder/agents-lab/active/refactoring/hm-codebase-mapper.md` — **5 TODOs**
- `.hivefiver-meta-builder/agents-lab/active/refactoring/hm-executor.md` — **2 TODOs**
- `.hivefiver-meta-builder/agents-lab/active/refactoring/hm-verifier.md` — **2 TODOs**
- `.hivefiver-meta-builder/agents-lab/active/refactoring/hm-planner.md` — **1 TODO**

**Total: 10 TODO/FIXME items across 4 agent files**

### Impact
- Agents reading their own profiles may encounter "TODO: implement X" instructions
- Downstream agent behaviors are undefined for unimplemented features

**Recommendation:** Sweep all agent files for remaining TODO patterns and resolve or document as known gaps.

---

## FLAW-04: hm-l0-orchestrator.md Bloat (806 lines — 61% over limit)

**Severity:** MEDIUM
**Type:** Module size violation

### Description
CONVENTIONS.md enforces a 500 LOC module limit. `hm-l0-orchestrator.md` is 806 lines.

### File Evidence
```
.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l0-orchestrator.md — 806 lines
.opencode/agents/hm-l0-orchestrator.md — 806 lines (reflected copy)
```

### Impact
- Violates the documented size constraint
- 806 lines in a single agent file means excessive cognitive load for runtime agent processing
- Contains 97 loop/gate references — likely mixing orchestration logic vs agent profile concerns

**Recommendation:** Split into sub-components or extract the orchestration patterns into a separate reference document.

---

## FLAW-05: 6 Phase Directories Empty (24.4–24.9)

**Severity:** HIGH
**Type:** Governance gap / orphan deliverables

### Description
6 of 7 sub-phase directories for Phase 24 contain only `.gitkeep` files. No SPECs, PLANS, RESEARCH, or SUMMARIES exist.

| Directory | Contents | Work Delivered Elsewhere? |
|---|---|---|
| `24.4-references-templates-system/` | `.gitkeep` only | Partial — artifact-schema.md created by 24.2 |
| `24.5-workflow-files-architecture/` | `.gitkeep` only | No — 3-layer routing is missing |
| `24.6-build-hm-commands/` | `.gitkeep` only | Yes — 99 commands exist, untraced |
| `24.7-primitives-asset-schema/` | `.gitkeep` only | Yes — schemas in `src/schema-kernel/` |
| `24.8-primitives-install-extraction/` | `.gitkeep` only | Unknown |
| `24.9-bootstrap-init-flow/` | `.gitkeep` only | Yes — bootstrap tools exist |

### Impact
- Cannot verify what was supposed to be built vs what was delivered
- 99 commands, 31 agents, and bootstrap tools are "orphan deliverables" — they exist in the codebase without governance traceability
- Future maintenance has no reference documents to understand design decisions

**Recommendation:** Retroactively create planning documents for phases with orphan deliverables, or formally archive the empty directories with status notes.

---

## ⚠️ CODE VERIFICATION CORRECTIONS (2026-05-29)

The following document claims were VERIFIED against live code and corrected:

| Claim in Document | Code Truth | Fix |
|---|---|---|
| FLAW-09: "3-layer routing missing workflow layer" — CRITICAL | `.opencode/workflows/` has **106 files** (103 hm-* + 3 others). Workflow layer EXISTS. | **Reclassify from CRITICAL to LOW** — workflows exist, the gap is they may not be formally integrated |
| Root phase 24 directory "empty" | ✅ CORRECT — only `.gitkeep` | No change needed |
| `hm-l2-planner` and `hm-l2-auditor` in governance config | ❌ config has 7 agents, NOT 9. No `hm-l2-planner` or `hm-l2-auditor` | **Correct count: 7 dead agent refs** |
| Only `execute-slash-command.ts` violates 500 LOC | **8 files exceed 500 LOC**, worst is `delegation-status.ts` (734) | This is a **systemic** problem, not isolated |
| Commands: 106 total (99 hm + 7 hf) | **118 total** — missing 12 non-hm/hf commands (test, harness, deep, ultrawork, sync, start, plan) | Count correction |
| `assets/` not analyzed | `assets/` has 43 agents, 137 commands, 34 skills, 106 workflows — this is the **source-of-truth for asset sync** | Add to analysis scope |
| Root-level dirs: src/ + .opencode/ | Also need: `assets/`, `scripts/`, `bin/`, `sidecar/`, `eval/`, `docs/`, `planning/`, `.archive/` | Expand scan scope |

## FLAW-06: TESTING.md Coverage Thresholds Are Wrong

**Severity:** CRITICAL
**Type:** Documentation drift

### Description
`.planning/codebase/TESTING.md` line 28-34 documents coverage thresholds as:
```typescript
thresholds: {
  statements: 85,
  branches: 72,
  functions: 85,
  lines: 85,
}
```

However, the actual `vitest.config.ts` (lines 22-27) has:
```typescript
thresholds: {
  statements: 90,
  branches: 80,
  functions: 90,
  lines: 90,
}
```

The thresholds were raised by Phase 48.4.1 (2026-04-30) but TESTING.md was never updated.

### Impact
- Developers relying on TESTING.md will target wrong thresholds
- The documented 85/72/85/85 would pass code that actually fails the 90/80/90/90 gate
- This is the most actionable flaw — a simple documentation update

**Recommendation:** Update TESTING.md to reflect current thresholds of 90/80/90/90.

---

## FLAW-07: CONVENTIONS.md tsconfig Location Error

**Severity:** LOW
**Type:** Documentation inaccuracy

### Description
CONVENTIONS.md line 23: `"src/tsconfig.json defines strict mode with strict: true"`

The tsconfig.json is at the project root, not in `src/`. There is no `src/tsconfig.json`.

**Recommendation:** Update CONVENTIONS.md to reference `tsconfig.json` at project root.

---

## FLAW-08: CONVENTIONS.md Missing tests/tools/ Directory

**Severity:** LOW
**Type:** Documentation omission

### Description
CONVENTIONS.md §"Testing Conventions" says tests are in `tests/` mirroring `src/` structure. But `tests/tools/` exists with 26 test files and is not documented. The actual test tree is:

```
tests/
├── lib/        (unit tests — documented)
├── tools/      (tool tests — NOT documented)
├── integration/ (integration tests — documented)
├── features/   (feature tests — documented)
├── sidecar/    (sidecar tests — documented)
└── eval/       (eval tests — documented)
```

### Impact
Minor documentation gap. New developers won't know `tests/tools/` exists.

**Recommendation:** Add `tests/tools/` to CONVENTIONS.md and TESTING.md directory listings.

---

## FLAW-09: 3-Layer Routing Missing Workflow Layer

**Severity:** CRITICAL
**Type:** Architecture gap

### Description
The 24.2 RESEARCH.md adopts GSD's 3-layer routing (Command → Workflow → Agent) as the core Hivemind architecture pattern. However:

1. No `.opencode/workflows/` directory exists with formal workflow files
2. Commands route directly to agents without orchestration workflow files
3. The middle layer that GSD uses for step-by-step orchestration is absent

### File Evidence
```bash
# Commands exist: 99+ files in .opencode/commands/
# Agents exist: 31 files in .opencode/agents/
# WORKFLOWS MISSING: No .opencode/workflows/hm-* orchestration files
```

### Impact
- Commands must contain orchestration logic that should be in workflows
- This is the exact architectural anti-pattern that 24.2 RESEARCH.md warned against
- Agent profiles must handle routing decisions that should be in workflow files

**Recommendation:** Either create the workflow layer or formally document that Hivemind uses 2-layer routing (Command → Agent) and update all architecture docs accordingly.

---

## FLAW-10: GAP Plans Added XML Tags That Violate Agent Body Convention

**Severity:** MEDIUM
**Type:** Style inconsistency

### Description
The baseline plans (01-05) used plain markdown `## Section` headings. The GAP plans (GAP-01, -02, -03) appended XML-style tags (`<documentation_lookup>`, `<task_commit_protocol>`, `<evidence_hierarchy>`, etc.). This creates a mixed format within individual agent files:

```
## Role                              (markdown heading)
... plain markdown body ...

<documentation_lookup>               (XML tag)
... XML body ...
</documentation_lookup>

## Success Criteria                  (markdown heading)
... more markdown ...
```

### File Evidence
All 31 agent files have this mixed format. The XML sections appear AFTER the markdown sections.

### Impact
- Inconsistent styling makes agent files harder to parse
- Some OpenCode tools may interpret XML tags differently than markdown headings
- Research.md specifically recommended AGAINST GSD's XML tags (LINE 531: "Use plain markdown ## Section headings for minimalism. GSD's XML tags are a convention, not a requirement.")

**Recommendation:** Convert XML tags to markdown headings (`## Documentation Lookup`, `## Task Commit Protocol`) for consistency, or formally adopt XML tags as the Hivemind convention and update all docs.

---

## Flaw Summary

| ID | Severity | Type | File(s) |
|---|---|---|---|
| FLAW-01 | HIGH | SPEC violation | `24.2-SPEC.md` Q-04 vs GAP-01/-02/-03 |
| FLAW-02 | MEDIUM | Legacy dependency | 10 agent files with `gsd-sdk`/`gsd` refs |
| FLAW-03 | LOW | Incomplete | 4 agent files with 10 TODOs |
| FLAW-04 | MEDIUM | Size violation | `hm-l0-orchestrator.md` (806 lines) |
| FLAW-05 | HIGH | Governance gap | 6 empty phase directories |
| FLAW-06 | **CRITICAL** | Doc drift | `TESTING.md` vs `vitest.config.ts` thresholds |
| FLAW-07 | LOW | Doc inaccuracy | `CONVENTIONS.md` tsconfig location |
| FLAW-08 | LOW | Doc omission | Missing `tests/tools/` in docs |
| FLAW-09 | **CRITICAL** | Architecture gap | Missing 3-layer workflow middle layer |
| FLAW-10 | MEDIUM | Style inconsistency | Mixed markdown/XML in agent bodies |

---

## Overall Assessment

**6 of 10 flaws actionable immediately** (FLAW-03, FLAW-06, FLAW-07, FLAW-08 are simple doc fixes; FLAW-02, FLAW-04, FLAW-10 are moderate rework).

**2 CRITICAL** flaws (FLAW-06: documented thresholds wrong; FLAW-09: missing architectural layer).

**2 HIGH** flaws (FLAW-01: spec contradiction; FLAW-05: governance gaps).
