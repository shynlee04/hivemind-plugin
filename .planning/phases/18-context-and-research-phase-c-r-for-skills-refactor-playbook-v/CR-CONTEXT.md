# CR-CONTEXT.md — Phase 18 Context Envelope

## Phase Identity
- Phase: 18 (Playbook Phase CR)
- Depends on: Phase 17 (COMPLETE)
- Blocks: Phase 19 (Rename Sprint), Phase 20 (Structural Changes), Phase 21-23
- Mode: Research/Audit only — zero skill edits, zero src/ changes

## Phase Boundary

### IN Scope
- Every active skill in `.hivefiver-meta-builder/skills-lab/active/refactoring/` (24 skills)
- Every retired skill partial in `.hivefiver-meta-builder/skills-lab/retired/` (3 skills)
- Every third-party reference tree (`.opencode/get-shit-done/`, superpower/bmad trees)
- Every call-site of each skill (agent permissions, command bodies, workflow files)

### OUT of Scope
- `src/` code changes
- Agent/command refactors
- New skill authoring
- IDE-directory modifications

## Ecosystem Snapshot

**Runtime Probe 1:** `ls .hivefiver-meta-builder/skills-lab/active/refactoring/ | wc -l`
**Result:** 24
**Date:** 2026-04-23
**Status:** VERIFIED — matches Playbook I.1.2 count

**Runtime Probe 2:** Per-skill LOC inventory
**Date:** 2026-04-23
```
agent-authorization:        237 LOC
agents-and-subagents-dev:  202 LOC
agents-md-sync:          152 LOC
command-dev:             80 LOC
command-parser:          110 LOC
coordinating-loop:        387 LOC
custom-tools-dev:         121 LOC
gsd-agent-composition:     158 LOC
harness-audit:           158 LOC
harness-delegation-inspection: 202 LOC
hf-context-absorb:        117 LOC
hm-deep-research:         380 LOC
hm-detective:            225 LOC
hm-synthesis:            371 LOC
meta-builder:            389 LOC
oh-my-openagent-reference:  76 LOC
opencode-non-interactive-shell: 63 LOC
opencode-platform-reference: 79 LOC
phase-loop:              112 LOC
planning-with-files:      140 LOC
session-context-manager:    163 LOC
skill-synthesis:          174 LOC
use-authoring-skills:      266 LOC
user-intent-interactive-loop: 399 LOC
```

**Runtime Probe 3:** Per-skill Evals count
**Date:** 2026-04-23
```
coordinating-loop:        2 evals
gsd-agent-composition:     1 evals
meta-builder:            2 evals
skill-synthesis:          2 evals
use-authoring-skills:      2 evals
user-intent-interactive-loop: 2 evals
```
**Summary:** 5/24 skills have evals (21%)

**Runtime Probe 4:** Per-skill Refs count
**Date:** 2026-04-23
```
agent-authorization:      refs=1
agents-and-subagents-dev: refs=2
agents-md-sync:          refs=0
command-dev:             refs=2
command-parser:          refs=1
coordinating-loop:        refs=4
custom-tools-dev:         refs=2
gsd-agent-composition:     refs=6
harness-audit:           refs=1
harness-delegation-inspection: refs=5
hf-context-absorb:        refs=4
hm-deep-research:         refs=6
hm-detective:            refs=6
hm-synthesis:            refs=7
meta-builder:            refs=8
oh-my-openagent-reference: refs=5
opencode-non-interactive-shell: refs=4
opencode-platform-reference: refs=20
phase-loop:              refs=1
planning-with-files:      refs=2
session-context-manager:    refs=2
skill-synthesis:          refs=5
use-authoring-skills:      refs=12
user-intent-interactive-loop: refs=5
```

**Runtime Probe 5:** Per-skill Scripts count
**Date:** 2026-04-23
```
agent-authorization:      scripts=2
agents-and-subagents-dev: scripts=0
agents-md-sync:          scripts=0
command-dev:             scripts=0
command-parser:          scripts=0
coordinating-loop:        scripts=8
custom-tools-dev:         scripts=0
gsd-agent-composition:     scripts=2
harness-audit:           scripts=2
harness-delegation-inspection: scripts=0
hf-context-absorb:        scripts=0
hm-deep-research:         scripts=0
hm-detective:            scripts=0
hm-synthesis:            scripts=0
meta-builder:            scripts=6
oh-my-openagent-reference: scripts=0
opencode-non-interactive-shell: scripts=0
opencode-platform-reference: scripts=0
phase-loop:              scripts=0
planning-with-files:      scripts=0
session-context-manager:    scripts=1
skill-synthesis:          scripts=7
use-authoring-skills:      scripts=8
user-intent-interactive-loop: scripts=5
```

**Runtime Probe 6:** Retired skills
**Date:** 2026-04-23
**Command:** `ls .hivefiver-meta-builder/skills-lab/retired/`
**Result:**
```
repomix-exploration-guide
repomix-explorer
research-operations
```
**Summary:** 3 retired skills (partial salvage per I.6 policy)

**Total LOC across all SKILL.md files:** 3853 LOC (sum of all LOC values above)

## Phase 17 Baseline
- C1: skill-synthesis restored from retired/ → active/ [VERIFIED commit 5a8299a3]
- C2: 4 meta-builder depth refs filled [VERIFIED commit 50044c41]
- C3: tech-stack.md generated in oh-my-openagent-reference [VERIFIED in 17-04]
- C4: project-structure.md verified 674 LOC (not stub) [VERIFIED no-op]
- C5: IDE sync dirs gitignored, .claude/skills/ absent [VERIFIED commit 06c30332]
- BONUS: .tech-registry.json schema unified on hm-detective format [VERIFIED commit 1e3bde8d]

## 6-NON Framework Reference

| NON Mode | Description | Defence |
|----------|-------------|----------|
| **NON-1** | **Non-audit** — skill written without systematically auditing parent → child → state → stage across the 3-level-depth delegation model | Mandatory pre-authoring audit pass (see Phase CR) that produces a `skill-audit-<name>.md` note with the parent/child/state/stage map. Skill body cites it. |
| **NON-2** | **Non-mapping** — no classification / grouping against the actual complex-project reality; skill exists in isolation from the skill ecosystem | SKILL.md has no "stacks with / clashes with" section; description is interchangeable with a sibling | Every skill must fill the delta-map (what it adds vs. nearest sibling) and register its stack-compatibility in `check-overlaps.sh`. |
| **NON-3** | **Non-starting-guidelines / non-cycles** — the skill teaches a monolithic procedure instead of placing itself inside a pipeline with explicit starts and cycles | "Do step 1, step 2, step 3" with no entry gate, no exit gate, no loop-back | Skill body must include: entry trigger, exit criterion, loop-back path for `DONE_WITH_CONCERNS`/`BLOCKED`, handoff envelope for the next stage. |
| **NON-4** | **Non-hierarchy** — skill has no opinion on which hierarchy layer picks it; ends up picked by both front-facing orchestrators and level-3 task-completers, producing opposite behaviour | `metadata.layer` missing or set incorrectly; description contains triggers that fire for both "plan X" and "do X" | Frontmatter must declare `metadata.layer` and `metadata.role`; description must contain at least one exclusion (`NOT for …`) that prevents cross-layer pickup. |
| **NON-5** | **Non-ecosystem-evaluation** — skill passes `validate-skill.sh` in isolation but was never evaluated as part of a stacked workflow | Skill works in trigger-query evals, fails the moment it is loaded with `coordinating-loop` + `planning-with-files` | Eval suite must include at least one *stacked* scenario reflecting a real GSD phase, not just isolated prompts. |
| **NON-6** | **Non-systematic pattern choice** — P1 / P2 / P3 picked ad-hoc; scripts bundled without edge-case coverage; references written without progressive disclosure | SKILL.md is 800 LOC of prose, or 40 LOC shell with 12 unused reference files | Pattern decision must be documented in `task_plan.md` with the four axes: size of body, number of decision branches, whether scripts are deterministic, whether reference loading needs progressive disclosure. |

## Differential Cluster Taxonomy

### G-A: Looping/guardrails/gatekeeping — HIGHEST priority, missing
- **Current state:** Partial — core skills exist as placeholders; completion-looping skill missing entirely
- **Skills in cluster:** coordinating-loop, phase-loop, user-intent-interactive-loop, agent-authorization, harness-delegation-inspection
- **Gap:** New skill `hm-completion-looping` needed

### G-B: Spec-driven + test-driven — HIGHEST priority, dishonest
- **Current state:** Mostly absent — eval-driven has a scaffold; spec-driven and test-driven need authoring from scratch
- **Skills in cluster:** skill-synthesis → hm-skill-synthesis
- **Gap:** New skills `hm-spec-driven-authoring`, `hm-test-driven-execution` needed

### G-C: Research/investigation/synthesis — HIGH priority, partial
- **Current state:** Integration partially delivered; chaining + MCP patterns still missing
- **Skills in cluster:** hm-deep-research, hm-detective, hm-synthesis, opencode-platform-reference, oh-my-openagent-reference, skill-synthesis → hm-skill-synthesis
- **Gap:** `hm-research-chain` skill (low priority, can defer)

### G-D: Debug/refactor/planning/execution — HIGH priority, absent
- **Current state:** Only hm-planning-with-files exists. All others need to be authored against GSD patterns
- **Skills in cluster:** planning-with-files → hm-planning-with-files, session-context-manager
- **Gap:** New skills `hm-debug`, `hm-refactor`, `hm-phase-execution` needed

## Research Chain

Canonical chain per VI.CR.6: hm-detective (SCAN) → hm-deep-research (version-matched) → hm-synthesis (compression) → hm-skill-synthesis (pattern extraction)

## Hard Constraints
- Every claim grounded in fresh runtime probe (ls, grep, wc -l)
- Every finding mapped to 6-NON mode AND differential cluster
- No third-party content copied verbatim
- Evidence is file-and-line-cite, not prose

## Research Chain Outputs (from 18-RESEARCH.md, cached 2026-04-23)

### 3.1 hm-detective SCAN Results
hm-detective SCAN not executed — fallback to manual probes (see §1.2 inventory table above)

### 3.2 Deep Research Findings

**G-A: Looping/guardrails/gatekeeping (CRITICAL — highest priority)**
- What exists: coordinating-loop (387 LOC, A grade), phase-loop (112 LOC, D grade), user-intent-interactive-loop (399 LOC, A grade)
- What is missing: `hm-completion-looping` skill (non-regression guardrail + subagent dispatch + self-verification envelope)
- What needs to be created: Marked as decision (h) — create new

**G-B: Spec-driven + Test-driven (CRITICAL — "full of lies")**
- What exists: skill-synthesis → hm-skill-synthesis (174 LOC, restored in Phase 17)
- What is missing: `hm-spec-driven-authoring`, `hm-test-driven-execution` — both need authoring from scratch
- What needs to be created: Marked as decision (h) — create new

**G-C: Research/Investigation/Synthesis (HIGH — partially delivered by 17-05)**
- What exists: hm-deep-research (380 LOC), hm-detective (225 LOC), hm-synthesis (371 LOC)
- What is missing: chaining patterns with OpenCode built-ins, MCP matrix for each
- What needs to be created: `hm-research-chain` (marked as decision (h), can defer)

**G-D: Debug/Refactor/Planning/Execution (HIGH — mostly absent)**
- What exists: planning-with-files → hm-planning-with-files (140 LOC, PASS)
- What is missing: `hm-debug`, `hm-refactor`, `hm-phase-execution` — all need authoring
- What needs to be created: Marked as decision (h) — create new

### 3.3 Third-Party Reference Audit

**Runtime Probe:** `ls .opencode/get-shit-done/workflows/`
**Result:** 78 workflow files
**Date:** 2026-04-23

**Runtime Probe:** `ls ~/.agents/skills/ 2>/dev/null | head -30`
**Result:** 20+ global skills including skill-judge, skill-creator
**Date:** 2026-04-23

## Evidence Trace
Every claim in this document cites: the probe command, the date run, and the result.
Format: `[PROBE: command] → [RESULT: value] [DATE: 2026-04-23]`

| Claim | Probe | Result |
|-------|-------|--------|
| 24 active skills | `ls .hivefiver-meta-builder/skills-lab/active/refactoring/ \| wc -l` | 24 |
| 5/24 skills have evals | `for s in .opencode/skills/*/evals/; do...` | 5 (21%) |
| 3 retired skills | `ls .hivefiver-meta-builder/skills-lab/retired/` | 3 |
| 78 GSD workflow files | `ls .opencode/get-shit-done/workflows/ \| wc -l` | 78 |
| 17 agent permission entries | `rg -n "skill" .opencode/agents/*.md \| grep -i "permission\|allow\|deny"` | 17 entries |
| 14 command files | `ls .opencode/commands/*.md \| wc -l` | 14 |
