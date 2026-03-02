---
id: META01-SUB02
type: sub
scope: meta
title: "Prime Skill Redesign (Standards-Aligned)"
status: open
parent: META01
children: []
dependencies: [META01-SUB01]
tags: [prime-skill, progressive-disclosure, skill-creator, standards, runtime-loader]
created: 2026-03-03
last_updated: 2026-03-03
owner: hivefiver
session_ref: null
completion_pct: 0
---

# Prime Skill Redesign (Standards-Aligned)

> **Plan ID**: `META01-SUB02` | **Status**: `open` | **Parent**: [`META01-PLAN.md`](../META01-PLAN.md)
> **Depends on**: `META01-SUB01` (parity isolation must be clean first)
> **Atomics**: See `atomic-plan/META01-SUB02-A*-PLAN.md`

<context>
The `hivefiver-prime` skill was created in a previous session as a skeleton, then partially
filled with reference content BEFORE loading the skill-design standards (skill-creator,
meta-skill-creator, skill-judge, writing-skills). The concept is correct ("load-me-first"
entry point for hivefiver) but the implementation needs redesign per standards.

CRITICAL DESIGN INPUT: The operational mandate (tri-modal architecture, context continuity
protocols, documentation hygiene) provided by user MUST be incorporated into this skill's
design. This is the "declaration protocol" and "role boundaries" content that the prime skill
teaches agents at runtime.

The skill must also address OpenCode's runtime realities:
- Skills can't preload via frontmatter — only on-demand via skill() tool
- Skills persist entire session once loaded (never pruned)
- Agent body loads ONCE at session init, NOT per-turn
- Child sessions DON'T inherit skills — each loads fresh
- 5+ skills loaded = G-07 skill avalanche (anti-pattern)
</context>

---

## Goal

Redesign `hivefiver-prime` SKILL.md and references to pass `skill-judge` Grade B+ (96+/120)
while incorporating the operational mandate as the core behavioral contract that hivefiver
loads at every session start.

## Scope

| In Scope | Out of Scope |
|----------|-------------|
| `.opencode/skills/hivefiver-prime/SKILL.md` | Other hivefiver-* skills (improved in SUB03) |
| `.opencode/skills/hivefiver-prime/references/*` | Commands, workflows, templates |
| Operational mandate integration | Product code, src/, tests/ |
| Standards compliance (5 required sections) | SDK/server API access |
| Progressive disclosure design | hiveminder's prime skill (separate META02) |

---

## Standards Requirements (from loaded skills)

| Standard | Requirement | Current State |
|----------|------------|---------------|
| `skill-creator` | SKILL.md < 500L, refs for heavy content, only name+description in frontmatter | 232L ✅ but wrong section structure |
| `meta-skill-creator` | 5 required sections: Overview, Quick Ref, Common Mistakes, Delegation, References | Has 8 custom sections, missing standard 5 ❌ |
| `skill-judge` | Knowledge delta > 70%, description answers WHAT+WHEN+KEYWORDS | Description OK ✅, knowledge audit needed |
| `writing-skills` | TDD: test WITHOUT skill first, then write, then verify | Not done ❌ |
| `meta-skill-creator` | References need frontmatter: title, description, tags | Missing on all 3 refs ❌ |
| `skill-judge` | Anti-patterns section mandatory (specific NEVER list with reasons) | Missing ❌ |

## Atomic Tasks

| ID | Task | Status | Dep | Est | Method |
|----|------|--------|-----|-----|--------|
| A01 | Audit existing prime SKILL.md against skill-judge 8 dimensions | `open` | — | M | Investigation sub-session |
| A02 | Design restructured SKILL.md outline (5 standard sections + operational mandate) | `open` | A01 | M | Coordinator in main session |
| A03 | Research: OpenCode platform combos (Context7, sequential, 3 retries) | `open` | — | L | Research sub-session |
| A04 | Research: Context engineering guardrails (Tavily/verified sources) | `open` | — | M | Research sub-session |
| A05 | Research: Session hierarchy protocol (Context7 + codebase) | `open` | — | M | Research sub-session |
| A06 | Synthesize research into references (with proper frontmatter) | `open` | A03-A05 | L | Synthesis sub-session (iterative) |
| A07 | Write SKILL.md body (standards-aligned, < 500L) | `open` | A02+A06 | L | Executor session |
| A08 | TDD: Pressure test without skill → baseline behavior | `open` | A07 | M | Testing sub-session |
| A09 | TDD: Pressure test WITH skill → verify compliance | `open` | A08 | M | Testing sub-session |
| A10 | skill-judge evaluation → target Grade B+ (96+/120) | `open` | A09 | M | Evaluation sub-session |

**NOTE**: A03-A05 can run parallel. A08-A09 are sequential (RED→GREEN). A01 can parallel with A03-A05.

---

## Design Input: Operational Mandate Integration

The user-provided operational mandate defines three modes that the prime skill MUST teach:

| Mode | Prime Skill Coverage |
|------|---------------------|
| **Coordinator** (default in main session) | Role boundaries, hierarchy awareness, outline-not-execute, delegation doctrine |
| **Executor** (sub-sessions only) | Detail retrieval, conflict halt, granular task completion |
| **Research** (sub-sessions only) | Swarm methodology, synthesis, singular-perspective denial |

The prime skill also MUST teach:
- Context continuity protocols (compact → export → parse → purify → validate)
- Documentation hygiene (zero-trust on AGENTS.md/CLAUDE.md)
- Metacognitive baseline (hierarchical position, workflow validation, lineage clarity)

---

<decisions>

| # | Decision | Rationale | Date | Reversible? |
|---|----------|-----------|------|-------------|
| 1 | Redesign from standards, not patch existing | Current structure predates standards loading; restructuring is cheaper than patching | 2026-03-03 | YES |
| 2 | Keep existing reference content as DRAFT input | Already-written content is research material, not wasted work | 2026-03-03 | YES |
| 3 | Operational mandate = core of prime skill | User provided this as THE superseding behavioral contract for agents | 2026-03-03 | NO |

</decisions>

---

<findings>
<!-- Populated during research sub-sessions -->

- [2026-03-03] [STANDARDS] 4 skill-design skills loaded. Gap analysis completed (see Standards Requirements table above).
- [2026-03-03] [DRAFT] 3 reference stubs partially filled in previous session. Content is DRAFT quality — written before standards were loaded.

</findings>

---

<action_items>

- [ ] `BLOCKED` — Awaiting SUB01 completion (parity isolation) before starting
- [ ] `OPEN` — After SUB01: begin A01 (audit) + A03-A05 (research) in parallel
- [ ] `OPEN` — After research: A02 (design outline) → present for human confirmation

</action_items>

---

## Completion Criteria

- [ ] SKILL.md restructured with 5 standard sections + operational mandate integrated
- [ ] SKILL.md < 500 lines
- [ ] All references have frontmatter (title, description, tags)
- [ ] Knowledge delta > 70% (per skill-judge D1)
- [ ] Anti-patterns section present (per skill-judge D3)
- [ ] TDD baseline + compliance verified (per writing-skills)
- [ ] skill-judge Grade B+ (96+/120)
- [ ] **RESTART REQUIRED** before execution phase (A07+)

---

<symlinks>

- Parent: [`META01-PLAN.md`](../META01-PLAN.md)
- Depends on: [`META01-SUB01-PLAN.md`](META01-SUB01-PLAN.md)
- Feeds into: [`META01-SUB03-PLAN.md`](META01-SUB03-PLAN.md)
- Target skill: `.opencode/skills/hivefiver-prime/SKILL.md`
- Draft references: `.opencode/skills/hivefiver-prime/references/`
- Standards skills: `skill-creator`, `meta-skill-creator`, `skill-judge`, `writing-skills`
- Operational mandate source: user message (this session, embedded in META01-SUB02)

</symlinks>

---

<footer>

## Session Notes

- [2026-03-03] [MAIN] Sub-plan created. Standards gap analysis completed. Operational mandate captured as design input. No execution started.

## Next Actions

1. Wait for SUB01 completion
2. Spawn parallel: A01 (audit existing) + A03-A05 (research) sub-sessions
3. Present A02 (design outline) for human confirmation before ANY writing

## Context for Continuation

SUB02 is at `open`, blocked on SUB01. The operational mandate (tri-modal architecture) is the core design input. 4 standards skills are loaded and gap analysis is complete. Draft reference stubs exist but need restructuring. RESTART needed before execution phase.

</footer>
