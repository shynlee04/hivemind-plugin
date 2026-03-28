# Orchestration Master Plan — External Integration + Skill Expansion

**Date:** 2026-03-28
**Branch:** v2.9.5-detox-dev
**Skills root:** `.developing-skills/refactored-skills/`
**Orchestrator:** hiveminder (this agent)
**Methodology:** research → synthesis → audit → gate → plan → implement (batches) → verify

---

## Phase Overview

```
Phase 0: Orchestration Setup (THIS DOCUMENT)
  │
Phase 1: Research Collection [WAVE 1]
  ├─ hiverd batch A: Code Review + Refactor (5 repos)
  ├─ hiverd batch B: Planning + Execution (5 repos)
  └─ hiverd batch C: Architecture + Research (5 repos)
  │
Phase 2: Synthesis + Internal Audit [WAVE 2]
  ├─ Synthesize research → pattern matrix, asset catalog, gap map
  ├─ hivexplorer: Internal audit of 15 skills against skill-judge criteria
  └─ code-skeptic: Conflict/overlap/anti-pattern identification
  │
Phase 3: Pattern Gate [GATE]
  └─ Orchestrator decides: Pattern 1 (high-level guide) / Pattern 3 (conditional details) / Hybrid per skill
  │
Phase 4: Integration Planning [WAVE 3]
  ├─ hiveplanner: Integration plan — which external patterns to adopt
  └─ architect: Architecture decisions for 2 new skills
  │
Phase 5: Implementation [BATCHES 1-4]
  ├─ Batch 1: hivemind-architecture (NEW) + hivemind-patterns expansion
  ├─ Batch 2: hivemind-execution (NEW) + hivemind-refactor expansion
  ├─ Batch 3: use-hivemind-planning + use-hivemind-tdd expansion
  └─ Batch 4: review/gatekeeping/delegation + cross-skill consistency
  │
Phase 6: Verification [WAVE 5]
  └─ hiveq + code-skeptic: Full verification pass
```

---

## Phase 1: Research Collection [WAVE 1]

### Batch A — Code Review + Refactor Skills

| # | Source | Skill | URL |
|---|--------|-------|-----|
| A1 | wshobson/agents | code-review-excellence | https://github.com/wshobson/agents/tree/91fe43e152e96a55a264fc1afdf44cd4db2a38d4/plugins/developer-essentials/skills/code-review-excellence |
| A2 | wshobson/agents | multi-reviewer-patterns | https://github.com/wshobson/agents/tree/91fe43e152e96a55a264fc1afdf44cd4db2a38d4/plugins/agent-teams/skills/multi-reviewer-patterns |
| A3 | sickn33/antigravity-awesome-skills | code-review-checklist | https://github.com/sickn33/antigravity-awesome-skills/blob/main/skills/code-review-checklist/SKILL.md |
| A4 | sickn33/antigravity-awesome-skills | code-refactoring-refactor-clean | https://github.com/sickn33/antigravity-awesome-skills/tree/main/skills/code-refactoring-refactor-clean |
| A5 | sickn33/antigravity-awesome-skills | codebase-cleanup-deps-audit | https://github.com/sickn33/antigravity-awesome-skills/tree/main/skills/codebase-cleanup-deps-audit |

**Target skills to enhance:** hivemind-refactor, hivemind-patterns, code-skeptic agent
**Pattern approach:** Pattern 3 (conditional details) — core review workflow in SKILL.md, advanced patterns in references/

### Batch B — Planning + Execution Skills

| # | Source | Skill | URL |
|---|--------|-------|-----|
| B1 | github/awesome-copilot | breakdown-feature-implementation | https://github.com/github/awesome-copilot/tree/main/skills/breakdown-feature-implementation |
| B2 | obra/superpowers | executing-plans | https://github.com/obra/superpowers/tree/main/skills/executing-plans |
| B3 | github/awesome-copilot | breakdown-plan | https://github.com/github/awesome-copilot/tree/main/skills/breakdown-plan |
| B4 | github/awesome-copilot | breakdown-feature-prd | https://github.com/github/awesome-copilot/tree/main/skills/breakdown-feature-prd |
| B5 | github/awesome-copilot | breakdown-test | https://github.com/github/awesome-copilot/tree/main/skills/breakdown-test |

**Target skills to enhance:** use-hivemind-planning, use-hivemind-tdd, use-hivemind-delegation
**New skill:** hivemind-execution (for hivemaker + hivehealer agents)
**Pattern approach:** Pattern 1 (high-level guide) — execution flow in SKILL.md, detailed breakdown in references/

### Batch C — Architecture + Research Skills

| # | Source | Skill | URL |
|---|--------|-------|-----|
| C1 | github/awesome-copilot | architecture-blueprint-generator | https://github.com/github/awesome-copilot/tree/main/skills/architecture-blueprint-generator |
| C2 | Jeffallan/claude-skills | architecture-designer | https://github.com/Jeffallan/claude-skills/tree/main/skills/architecture-designer |
| C3 | pproenca/dot-skills | clean-architecture | https://github.com/pproenca/dot-skills/tree/master/skills/.experimental/clean-architecture |
| C4 | mattpocock/skills | improve-codebase-architecture | https://github.com/mattpocock/skills/tree/main/improve-codebase-architecture |
| C5 | github/awesome-copilot | autoresearch | https://github.com/github/awesome-copilot/blob/main/skills/autoresearch/SKILL.md |

**Target skills to enhance:** hivemind-patterns, use-hivemind-research
**New skill:** hivemind-architecture (for architect agent)
**Pattern approach:** Pattern 3 (conditional details) — architecture decisions in SKILL.md, pattern catalogs in references/

---

## Phase 2: Synthesis + Internal Audit [WAVE 2]

### Research Synthesis (orchestrator consumes)

After all 3 hiverd batches return, synthesize:

1. **Pattern Matrix** — What patterns each external repo uses (structure, progressive disclosure, bundled resources)
2. **Asset Catalog** — Unique templates, scripts, workflows, commands that could be adapted
3. **Gap Map** — What our 15 skills lack vs what external repos provide
4. **Anti-Pattern Catalog** — What external repos do poorly (to avoid)

### Internal Audit (delegated)

| Agent | Scope | What to check |
|-------|-------|---------------|
| hivexplorer | All 15 skills | Line count, TOC quality, YAML description quality, progressive disclosure compliance, knowledge delta |
| code-skeptic | Cross-skill | Conflicts between skills, duplicate content, missing cross-references, anti-pattern violations |

**Output:** `.hivemind/activity/codescan/wave-2/` — unified gap report

---

## Phase 3: Pattern Gate [GATE]

### Pattern Decision Framework (from skills-essential-knowledge.md)

| Pattern | Structure | When to Apply |
|---------|-----------|---------------|
| **Pattern 1** | High-level guide with references | Skills with clear workflows, few variants. SKILL.md = flow, references = details. |
| **Pattern 2** | Domain-specific organization | Skills spanning multiple domains (not applicable — our skills are domain-specific). |
| **Pattern 3** | Conditional details | Skills with advanced features loaded on-demand. SKILL.md = core + decision tree, references = advanced. |

### Initial Pattern Assignments (subject to adjustment after synthesis)

| Skill | Pattern | Rationale |
|-------|---------|-----------|
| `hivemind-architecture` (NEW) | **Pattern 3** | Architecture decisions need conditional loading (pattern catalog, anti-pattern catalog loaded based on domain) |
| `hivemind-execution` (NEW) | **Pattern 1** | Execution workflow is linear, details in references |
| `hivemind-refactor` | **Pattern 3** | Refactor techniques loaded conditionally by smell type |
| `hivemind-patterns` | **Pattern 3** | Pattern catalog already exists, expand with architecture patterns |
| `use-hivemind-planning` | **Pattern 1** | Planning lifecycle is sequential, breakdown details in references |
| `use-hivemind-tdd` | **Pattern 1** | TDD loop is well-defined, strategy details in references |
| `hivemind-gatekeeping` | **Pattern 1** | Gate checks are procedural, evidence details in references |
| `hivemind-system-debug` | **Pattern 3** | Debug techniques loaded by failure type |
| `hivemind-spec-driven` | **Pattern 1** | Spec workflow is linear |
| `use-hivemind-delegation` | **Pattern 3** | Delegation modes loaded conditionally |
| `use-hivemind-context` | **Pattern 1** | Trust check is sequential |
| `use-hivemind-research` | **Pattern 3** | Research methods loaded by topic type |
| `hivemind-atomic-commit` | **Pattern 1** | Commit flow is linear |
| `hivemind-codemap` | **Pattern 1** | Scan flow is sequential |
| `use-hivemind-git-memory` | **Pattern 1** | Memory operations are procedural |
| `use-hivemind` | **Pattern 1** | Routing is sequential |

### Gate Criteria

- Pattern decisions validated against research synthesis
- No skill assigned Pattern 2 (domain-specific organization doesn't fit our structure)
- All Pattern 3 skills have clear decision trees in SKILL.md
- All Pattern 1 skills have clear workflow references

---

## Phase 4: Integration Planning [WAVE 3]

### hiveplanner delegation

**Input:** Research synthesis + gap report + pattern assignments
**Output:** Integration plan with:
- Which external assets to adapt (templates, scripts, workflows)
- Which external patterns to adopt (structure, loading triggers, anti-patterns)
- Which to reject (redundant, conflicting, low-knowledge-delta)
- Reference file additions per skill
- New reference files to create

### architect delegation

**Input:** Research synthesis for architecture skills (C1-C4)
**Output:** Design for:
- `hivemind-architecture` skill: SKILL.md structure, reference files, templates
- `hivemind-execution` skill: SKILL.md structure, reference files, templates
- Integration with existing `hivemind-patterns` (architecture patterns as new reference)

---

## Phase 5: Implementation [BATCHES]

### Batch 1 — hivemind-architecture (NEW) + hivemind-patterns expansion

| Task | Agent | Scope |
|------|-------|-------|
| Create hivemind-architecture/SKILL.md | hivemaker | Full skill creation with Pattern 3 structure |
| Create hivemind-architecture/references/ | hivemaker | architecture-patterns.md, architecture-decision-record.md, scalability-patterns.md |
| Create hivemind-architecture/templates/ | hivemaker | architecture-decision.md, blueprint-template.md |
| Expand hivemind-patterns/references/ | hivemaker | Add architecture-patterns.md (from C1-C4 synthesis) |
| Update hivemind-patterns/SKILL.md | hivemaker | Add conditional loading triggers for architecture patterns |

### Batch 2 — hivemind-execution (NEW) + hivemind-refactor expansion

| Task | Agent | Scope |
|------|-------|-------|
| Create hivemind-execution/SKILL.md | hivemaker | Full skill creation with Pattern 1 structure |
| Create hivemind-execution/references/ | hivemaker | execution-workflow.md, code-quality-standards.md, clean-code-checklist.md |
| Create hivemind-execution/templates/ | hivemaker | execution-packet.md, quality-gate.md |
| Expand hivemind-refactor/references/ | hivemaker | Add code-review-checklist.md (from A3), codebase-cleanup-audit.md (from A5) |
| Update hivemind-refactor/SKILL.md | hivemaker | Add Pattern 3 conditional loading for refactor techniques |

### Batch 3 — Planning + TDD expansion

| Task | Agent | Scope |
|------|-------|-------|
| Expand use-hivemind-planning/references/ | hivemaker | Add feature-breakdown.md, prd-template.md (from B1-B4) |
| Expand use-hivemind-tdd/references/ | hivemaker | Add test-breakdown.md (from B5) |
| Update use-hivemind-planning/SKILL.md | hivemaker | Add execution flow references |
| Update use-hivemind-tdd/SKILL.md | hivemaker | Add breakdown references |

### Batch 4 — Review/Gatekeeping/Delegation + Cross-skill consistency

| Task | Agent | Scope |
|------|-------|-------|
| Expand hivemind-gatekeeping/references/ | hivemaker | Add review-gate.md, integration-checkpoint.md |
| Expand use-hivemind-delegation/references/ | hivemaker | Add execution-delegation.md, review-delegation.md |
| Cross-skill consistency check | hivexplorer | Verify all cross-references valid after expansions |
| Update hiveminder-operation-guidelines.md | hivemaker | Add new skills, updated architecture |

---

## Phase 6: Verification [WAVE 5]

### Verification Checklist

| Check | Agent | Pass Condition |
|-------|-------|----------------|
| All 17 skills have valid YAML frontmatter | hiveq | name + description present |
| All skills have TOC | hiveq | ## Table of Contents present |
| All skills have parent field | hiveq | parent: use-hivemind or appropriate |
| All Bundled Resources complete | hiveq | Every file in references/ templates/ listed |
| No self-references | code-skeptic | Skill doesn't route to itself |
| No duplicate sections | code-skeptic | Each section appears once |
| Cross-references valid | code-skeptic | All referenced skills exist |
| Knowledge delta positive | code-skeptic | No redundant content |
| Pattern compliance | hiveq | Pattern 1 = workflow refs, Pattern 3 = decision trees |
| YAML description quality | hiveq | Third-person, specific triggers, ≤200 chars |

---

## Execution Constraints

1. **Wave 1 runs in parallel.** 3 hiverd batches are independent — no shared state.
2. **Waves are sequential.** No wave proceeds without prior wave's synthesis.
3. **Batches are sequential within Phase 5.** Each batch must be verified before next begins.
4. **User transfers manually.** After each batch completes, user copies to `.opencode/skills/` and restarts.
5. **No how-to-implement in packets.** Each agent gets process guidance, not code specifics.
6. **Evidence required.** Every delegation must return file paths, line counts, grep verification.
7. **All output in `.developing-skills/refactored-skills/`.** Never touch `.opencode/skills/`.

---

## Success Criteria

- [ ] 15 external repos downloaded and synthesized
- [ ] Pattern matrix complete with assignments per skill
- [ ] 2 new skills created (hivemind-architecture, hivemind-execution)
- [ ] 5+ existing skills expanded with external patterns
- [ ] All 17 skills pass verification checklist
- [ ] hiveminder-operation-guidelines.md updated
- [ ] Cross-skill consistency verified
- [ ] Knowledge delta positive across all skills

---

## Carry-Forward — Wave 1 Complete

### Key Findings (≤5 items)

| # | Key Finding |
|---|-------------|
| 1 | **Pattern decision reinforced:** 10/15 external skills are Pattern 1 (monolithic), 3 are Pattern 2 (chain/references), 2 are Pattern 3 (conditional). Our Pattern 1/3 hybrid assignments are correct. |
| 2 | **Highest-value external assets:** ADR template (architecture-designer), 42-rule clean architecture catalog, INVEST/Fibonacci estimation (breakdown-plan), ISTQB test design (breakdown-test), code review checklists (50+ items), dependency audit workflow |
| 3 | **hivemind-architecture needs:** ADR template, architecture pattern selection matrix, NFR checklist with quantified targets, database selection matrix, clean architecture rule catalog, system design template |
| 4 | **hivemind-execution needs:** SOLID principle application examples (multilanguage), refactoring ROI formula, code quality metrics matrix, review dimension allocation, severity calibration scoring |
| 5 | **use-hivemind-planning/tdd need:** Priority × Value matrix, Given/When/Then acceptance criteria, dependency type taxonomy, test design techniques (ISTQB), quality gates with entry/exit criteria |

### Blocked Routes
- None identified from research phase

### Recommended Next Action
- Dispatch Wave 2: Internal audit of all 15 skills against skill-judge criteria from skills-essential-knowledge.md

---

## Session Continuity

If this session disconnects, resume from:
- **Checkpoint:** `.hivemind/activity/plans/orchestration-master-plan-2026-03-28-v2.md`
- **Continuity:** `.hivemind/activity/sessions/continuity.json`
- **Delegation registry:** `.hivemind/activity/delegation/registry.json`
