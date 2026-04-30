# CR-CONTEXT.md — Phase 18 Context Envelope

**Deliverable:** CR-01
**Date:** 2026-04-23
**Phase:** 18 (Playbook Phase CR)
**Status:** archived
**Archived reason:** Reclassified to skill-ecosystem workstream (SE-H2)
**Depends on:** Phase 17 (COMPLETE)
**Blocks:** Phase 19 (Rename Sprint), Phase 20 (Structural Changes), Phase 21-23
**Mode:** Research/Audit only — zero skill edits, zero src/ changes

---

## Phase Identity

- **Phase:** 18 (Playbook Phase CR)
- **Depends on:** Phase 17 (COMPLETE — C1-C5 resolved, tech-registry unified)
- **Blocks:** Phase 19 (Rename Sprint), Phase 20 (Structural Changes), Phase 21-23
- **Mode:** Research/Audit only — zero skill edits, zero src/ changes

## Phase Boundary

### IN Scope
- Every active skill in `.hivefiver-meta-builder/skills-lab/active/refactoring/` (24 skills)
- Every retired skill partial in `.hivefiver-meta-builder/skills-lab/retired/` (3 skills)
- Every third-party reference tree (`.opencode/get-shit-done/`, superpower/bmad trees)
- Every call-site of each skill (agent permissions, command bodies, workflow files)
- Fresh runtime probes for all inventory counts, LOC, eval coverage, trigger collisions
- Per-skill 6-NON audit grid (NON-1 through NON-6)
- Differential cluster gap map (G-A through G-D)
- Third-party pattern harvest (abstracted, attributed, no verbatim copy)
- Runtime-integration readiness assessment (soft `.md` → Zod-typed TS runtime)
- Tooling decision table per skill (no-change / description / body / bundle / rename / split / merge / create / retire)

### OUT of Scope
- `src/` code changes
- Agent or command refactors
- New skill authoring (patterns only — no new SKILL.md files)
- IDE-directory modifications
- Any mutation of active skill files

## Ecosystem Snapshot

[PROBE: `ls .hivefiver-meta-builder/skills-lab/active/refactoring/ | wc -l`] → [RESULT: 24] [DATE: 2026-04-23]

**Skill count verified: 24 active skills**

Total LOC across all SKILL.md files: 4,952 LOC

[PROBE: `for skill in .opencode/skills/*/SKILL.md; do wc -l < "$skill"; done | awk '{sum+=$1} END {print sum}'`] → [RESULT: 4952] [DATE: 2026-04-23]

Skills with evals: 5/24 (20.8%)
[PROBE: `for s in .opencode/skills/*/evals/; do ls $s 2>/dev/null | wc -l; done | awk '$1>0 {count++} END {print count+0}'`] → [RESULT: 5] [DATE: 2026-04-23]

Retired skills: 3
[PROBE: `ls .hivefiver-meta-builder/skills-lab/retired/`] → [RESULT: repomix-exploration-guide, repomix-explorer, research-operations] [DATE: 2026-04-23]

GSD workflow files: 78
[PROBE: `ls .opencode/get-shit-done/workflows/*.md | wc -l`] → [RESULT: 78] [DATE: 2026-04-23]

## Phase 17 Baseline

| Critical | Resolution | Status |
|----------|-----------|--------|
| C1 — `validate-gate.sh synthesize` pointed to retired skill | `skill-synthesis` restored from `retired/` → `active/refactoring/` | ✅ VERIFIED commit 5a8299a3 |
| C2 — 4 meta-builder depth stubs | All filled with 125–217 LOC real content + registered in Ref Map | ✅ VERIFIED commit 50044c41 |
| C3 — phantom `tech-stack.md` | Generated 81 LOC from packed repo metadata | ✅ VERIFIED in 17-04 |
| C4 — "empty" `project-structure.md` | Verified 674 LOC, not stub | ✅ VERIFIED no-op |
| C5 — duplicate skills across `.claude/` and `.opencode/` | `.claude/skills/` absent; IDE sync dirs gitignored | ✅ VERIFIED commit 06c30332 |
| **BONUS** — `.tech-registry.json` schema drift | Unified on `hm-detective` schema; SCAN mode added | ✅ VERIFIED commit 1e3bde8d |

## 6-NON Framework Reference

| ID | Failure Mode | What it looks like in a skill | Defence |
|----|--------------|-------------------------------|---------|
| **NON-1** | **Non-audit** — skill written without systematically auditing parent → child → state → stage across the 3-level-depth delegation model | Generic SKILL.md body with no evidence that the author walked the coordination tree; body repeats what the agent already knows | Mandatory pre-authoring audit pass that produces a `skill-audit-<name>.md` note with the parent/child/state/stage map. Skill body cites it. |
| **NON-2** | **Non-mapping** — no classification / grouping against the actual complex-project reality; skill exists in isolation from the skill ecosystem | SKILL.md has no "stacks with / clashes with" section; description is interchangeable with a sibling | Every skill must fill the delta-map (what it adds vs. nearest sibling) and register its stack-compatibility in `check-overlaps.sh`. |
| **NON-3** | **Non-starting-pipelines / non-cycles** — the skill teaches a monolithic procedure instead of placing itself inside a pipeline with explicit starts and cycles | "Do step 1, step 2, step 3" with no entry gate, no exit gate, no loop-back | Skill body must include: entry trigger, exit criterion, loop-back path for `DONE_WITH_CONCERNS`/`BLOCKED`, handoff envelope for the next stage. |
| **NON-4** | **Non-hierarchy** — skill has no opinion on which hierarchy layer picks it; ends up picked by both front-facing orchestrators and level-3 task-completers, producing opposite behaviour | `metadata.layer` missing or set incorrectly; description contains triggers that fire for both "plan X" and "do X" | Frontmatter must declare `metadata.layer` and `metadata.role`; description must contain at least one exclusion (`NOT for …`) that prevents cross-layer pickup. |
| **NON-5** | **Non-ecosystem-evaluation** — skill passes `validate-skill.sh` in isolation but was never evaluated as part of a stacked workflow | Skill works in trigger-query evals, fails the moment it is loaded with `coordinating-loop` + `planning-with-files` | Eval suite must include at least one *stacked* scenario reflecting a real GSD phase, not just isolated prompts. |
| **NON-6** | **Non-systematic pattern choice** — P1 / P2 / P3 picked ad-hoc; scripts bundled without edge-case coverage; references written without progressive disclosure | SKILL.md is 800 LOC of prose, or 40 LOC shell with 12 unused reference files | Pattern decision must be documented in `task_plan.md` with the four axes: size of body, number of decision branches, whether scripts are deterministic, whether reference loading needs progressive disclosure. |

> **Every phase deliverable must include a 6-NON defence table.** A skill that cannot show its defences in writing is not accepted, regardless of `skill-judge` grade.

## Differential Cluster Taxonomy

| Cluster | Description | Priority | Current State |
|---------|-------------|----------|---------------|
| **G-A** | Looping / guardrails / gatekeeping / self-verification / subagent delegation | HIGHEST | Partial — core skills exist as placeholders; completion-looping skill missing entirely |
| **G-B** | Spec-driven + test-driven development | HIGHEST | Mostly absent — eval-driven has a scaffold; spec-driven and test-driven need authoring |
| **G-C** | Research / investigation / synthesis | HIGH | Integration partially delivered by Phase 17; chaining + MCP patterns still missing |
| **G-D** | Debug / refactor / planning / execution | HIGH | Mostly absent — only `planning-with-files` exists |

## Research Chain

Canonical chain per Playbook VI.CR.6:
```
hm-detective (SCAN) → hm-deep-research (version-matched) → hm-synthesis (compression) → hm-skill-synthesis (pattern extraction)
```

## Hard Constraints

- Every claim grounded in fresh runtime probe (`ls`, `grep`, `wc -l`)
- Every finding mapped to at least one 6-NON mode AND one differential cluster
- No third-party content copied verbatim (I.6 violation aborts)
- Evidence is file-and-line-cite, not prose
- Max 20% "no change" rows in decision table (VI.CR.12 #4)

## Key Links

- **From:** CR-CONTEXT.md → **To:** `.hivefiver-meta-builder/skills-lab/active/refactoring/` **Via:** `ls runtime probe` **Pattern:** `ls .*skills-lab/active/refactoring`
- **From:** CR-CONTEXT.md → **To:** `.opencode/skills/` **Via:** `per-skill grep probes` **Pattern:** `SKILL\.md`
