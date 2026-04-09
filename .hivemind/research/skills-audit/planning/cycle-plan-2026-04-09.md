# Skills Audit — Cycle Plan for Next 2-3 Delegation Rounds
> **Date:** 2026-04-09
> **Status:** ACTIVE — awaiting user authorization per cycle
> **Goal:** Assess bundles (scripts, references, assets) for overlap, gaps, pair-mapping, edge cases, and red fail cases. Then SET ASIDE skills so agents + commands become next target.

## HiveMind Philosophy Alignment

This cycle plan follows the 4 philosophies:

| Philosophy | How Applied in This Plan |
|-----------|------------------------|
| **1. Hierarchical Superiority** | SOT evidence must exist before child handling. Cycle 1 must complete inventory before Cycle 2 can assess gaps. |
| **2. Collaborative Domain** | Each cycle's output is a `.md` file that subsequent cycles READ (not session history). Agents report ack → synthesis → tracking. |
| **3. Strategically Measurable** | Every cycle produces quantitative + qualitative metrics. No "done" without pass counts, gap counts, overlap counts. |
| **4. Iteratively Granular** | Each cycle breaks into granular sub-tasks dispatched to specialists. Max 3 validation loops. |

---

## CYCLE 1: Bundle Deep Scan — What Exists, What Conflicts, What Lacks

### Purpose
Go inside every skill's `scripts/`, `references/`, `assets/` directories. Catalog what actually exists on disk vs. what SKILL.md claims exists. Find conflicts, overlaps, and missing bundles.

### Delegation Pattern: 4 parallel specialists → 1 synthesis

| Subagent | Scope | Output File |
|----------|-------|-------------|
| **Bundle Auditor A** | Meta-concept skills: `meta-builder`, `use-authoring-skills`, `agents-and-subagents-dev`, `command-dev`, `custom-tools-dev`, `skill-synthesis`, `agent-authorization` | `inventory/bundle-scan-meta-concepts-2026-04-09.md` |
| **Bundle Auditor B** | Orchestration skills: `coordinating-loop`, `phase-loop`, `planning-with-files`, `user-intent-interactive-loop` | `inventory/bundle-scan-orchestration-2026-04-09.md` |
| **Bundle Auditor C** | Platform/reference skills: `opencode-platform-reference`, `opencode-non-interactive-shell`, `oh-my-openagent-reference` | `inventory/bundle-scan-platform-2026-04-09.md` |
| **Bundle Auditor D** | Remaining skills: `harness-audit`, `harness-delegation-inspection`, `command-parser`, `hm-deep-research`, `eval-harness` | `inventory/bundle-scan-remaining-2026-04-09.md` |

### What Each Auditor MUST Produce

For EVERY skill in their batch:

```
## SKILL: [name]
### scripts/
| Script | Exists? | Lines | Purpose | Called From | Dependencies |
|--------|---------|-------|---------|------------|-------------|

### references/
| File | Exists? | Lines | Purpose | Required/Mandatory | Covers What |

### assets/
| File | Exists? | Purpose |

### Discrepancies
- [SKILL.md claims X but file doesn't exist]
- [File exists but SKILL.md doesn't reference it]

### Conflicts
- [Script A in skill-1 does same thing as Script B in skill-2]

### Gaps
- [Skill needs a script for X but doesn't have one]
- [Reference file covers X but should also cover Y]
```

### Aggregate Output
- Total scripts, references, assets across all 20 skills
- Conflict pairs (same function in 2+ skills)
- Missing bundles (skills that need scripts/references but don't have them)
- Phantom references (SKILL.md points to files that don't exist)

### Success Criteria
- [ ] Every file in every scripts/, references/, assets/ cataloged
- [ ] Every discrepancy between SKILL.md claims and disk reality documented
- [ ] Cross-skill script conflict pairs identified
- [ ] Gap list produced for Cycle 2

---

## CYCLE 2: Pair Mapping + Agent Assignment + Domain Matrix

### Purpose
Using Cycle 1 output + audit results, build the definitive:
- **Pair-of-3** (front-facing agent skill set)
- **Pair-of-2** (subagent delegated skill set)
- **Agent ↔ Skill assignment matrix**
- **Domain coverage map with edge cases**

### Delegation Pattern: 2 parallel specialists → 1 synthesis

| Subagent | Scope | Output File |
|----------|-------|-------------|
| **Pair Mapper** | Read Cycle 1 bundle scan + audit results. Build pair-of-3 and pair-of-2 configurations. Map which agents should load which skills. | `planning/pair-mapping-2026-04-09.md` |
| **Edge Case Analyst** | Read all SKILL.md bodies + references. Identify: (1) domains not covered, (2) edge cases no skill handles, (3) red fail cases where skills would produce wrong output. | `planning/edge-case-analysis-2026-04-09.md` |

### What Pair Mapper MUST Produce

```
## Front-Facing Pair-of-3 Configurations

### Config A: Meta-Concept Creation
| Position | Skill | Agent | Why |
|----------|-------|-------|-----|
| Router | meta-builder | hivefiver-orchestrator | Classifies intent |
| Specialist | [skill] | [agent] | [reason] |
| Validator | [skill] | [agent] | [reason] |

### Config B: Project Orchestration
...

### Config C: Deep Research
...

## Subagent Pair-of-2 Configurations

### Config D: Skill Authoring
| Position | Skill | Agent |
|----------|-------|-------|
| Specialist | use-authoring-skills | hivefiver-skill-author |
| Reference | [skill] | [agent] |

### Config E: Agent Building
...

## Agent ↔ Skill Matrix

| Agent | Skills They Load | Skills They Delegate To Others |
|-------|-----------------|-------------------------------|

## Skill Loading Order (per hierarchy)
Layer 0: [skills loaded at startup]
Layer 1: [skills loaded by front-facing agents]
Layer 2: [skills loaded by subagents]
Layer 3: [reference-only skills]
```

### What Edge Case Analyst MUST Produce

```
## Domain Coverage Map

| Domain | Skills Covering | Coverage Level | Gaps |
|--------|----------------|---------------|------|

## Red Fail Cases (skills produce WRONG output)

| Case | Skill | Input | Expected | Actual Wrong Output | Root Cause |
|------|-------|-------|----------|-------------------|------------|

## Unhandled Edge Cases

| Edge Case | No Skill Handles | Should Be In |
|-----------|-----------------|-------------|

## Skills That Lack (known missing)

| What's Missing | Description | Would Belong To Group |
|----------------|-------------|----------------------|
| TDD for skills | No skill teaches test-driven skill development | Group 2 |
| Spec-driven skill creation | No skill teaches spec-first approach | Group 2 |
| Skill composition patterns | No skill teaches how to stack/combine | Group 1 |
```

### Success Criteria
- [ ] At least 3 front-facing pair-of-3 configurations documented
- [ ] At least 4 subagent pair-of-2 configurations documented
- [ ] Complete agent ↔ skill assignment matrix
- [ ] At least 5 red fail cases identified
- [ ] Missing skills list with domain classification

---

## CYCLE 3: Final Synthesis — Lock Skills, Prepare for Agents+Commands

### Purpose
Synthesize Cycle 1 + Cycle 2 into a final state document. Mark skills as STABLE (set aside), NEEDS_WORK (track for later), or REMOVED. Produce the handoff brief for the agents+commands audit.

### Delegation Pattern: 1 specialist (synthesis only, no new investigation)

| Subagent | Scope | Output File |
|----------|-------|-------------|
| **Synthesizer** | Read ALL Cycle 1 + Cycle 2 outputs. Produce final status document. | `synthesis/final-skills-status-2026-04-09.md` |

### What Synthesizer MUST Produce

```
## Skills Final Status

| Skill | Status | Confidence | Action Needed | Next Phase |
|-------|--------|-----------|--------------|-----------|
| [20 rows] | STABLE / NEEDS_WORK / REMOVED | [1-10] | [none / description rewrite / merge / split] | [skills / agents / commands] |

## Bundle Health Summary
- Total scripts: X | Conflicts: Y | Gaps: Z
- Total references: X | Overlaps: Y | Phantom refs: Z
- Total assets: X | Missing: Y

## What Was Lacking (for future cycles, NOT this one)
1. [TDD skill — noted, deferred]
2. [Spec-driven creation — noted, deferred]
3. [...]

## Handoff Brief for Agents+Commands Audit
- Skills audit is DONE (set aside)
- [N] skills STABLE — ready for agents to reference
- [N] skills NEEDS_WORK — tracked but not blocking
- [N] skills REMOVED — deleted or merged
- Agents audit should assess: [which agents reference which skills, which commands trigger which skills]
```

### Success Criteria
- [ ] Every skill has a final status (STABLE/NEEDS_WORK/REMOVED)
- [ ] Bundle health metrics are quantitative
- [ ] Handoff brief for agents+commands audit is complete
- [ ] Skills audit is formally CLOSED

---

## Execution Rules

1. **Each cycle requires user authorization** before dispatching subagents
2. **Cycle N+1 reads Cycle N output from files** — never from session context
3. **Subagents produce files** — orchestrator does not synthesize inline
4. **Max 3 validation loops** per cycle (Philosophy 4)
5. **Quantitative metrics required** before marking cycle DONE (Philosophy 3)
6. **After Cycle 3, skills are SET ASIDE** — next target is agents + commands

## Files This Plan Produces

```
.hivemind/research/skills-audit/
├── inventory/
│   ├── skills-inventory-2026-04-09.md          ← DONE
│   ├── bundle-scan-meta-concepts-2026-04-09.md ← Cycle 1
│   ├── bundle-scan-orchestration-2026-04-09.md ← Cycle 1
│   ├── bundle-scan-platform-2026-04-09.md      ← Cycle 1
│   └── bundle-scan-remaining-2026-04-09.md     ← Cycle 1
├── synthesis/
│   ├── cross-batch-findings-2026-04-09.md      ← DONE
│   └── final-skills-status-2026-04-09.md       ← Cycle 3
├── planning/
│   ├── refactoring-plan-2026-04-09.md          ← DONE
│   ├── cycle-plan-2026-04-09.md                ← THIS FILE
│   ├── pair-mapping-2026-04-09.md              ← Cycle 2
│   └── edge-case-analysis-2026-04-09.md        ← Cycle 2
└── references/
    └── authoring-best-practices-index-2026-04-09.md ← DONE
```
