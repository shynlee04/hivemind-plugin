# HiveMind Skill Packages — Revised Master Plan for Context Intelligence and Skill-System Architecture

**Date:** 2026-03-19  
**Status:** Revised planning authority for the current skill-pack cycle  
**Primary scope:** Pack 1 `context-intelligence` + companion authoring and audit posture  
**Audience:** HiveMind maintainers, future pack authors, end users creating skills in mixed-agent environments

---

## Table of Contents

- [1. Executive Framing](#1-executive-framing)
- [2. Skill-System Philosophy](#2-skill-system-philosophy)
- [3. System Boundaries and Authority Model](#3-system-boundaries-and-authority-model)
- [4. Context Intelligence Pack Architecture](#4-context-intelligence-pack-architecture)
- [5. Pattern Model and Composition Rules](#5-pattern-model-and-composition-rules)
- [6. Branching and Milestone Plan](#6-branching-and-milestone-plan)
- [7. Pack and Skill Inventory Recommendations](#7-pack-and-skill-inventory-recommendations)
- [8. Hivemind-Specific Skill-Writing and Audit Guidance](#8-hivemind-specific-skill-writing-and-audit-guidance)
- [9. Evaluation and TDD Strategy](#9-evaluation-and-tdd-strategy)
- [10. Documentation, Naming, and Packaging Standards](#10-documentation-naming-and-packaging-standards)
- [11. Operational Safeguards](#11-operational-safeguards)
- [12. Refactor / Consolidate / Migrate / Remove Framework](#12-refactor--consolidate--migrate--remove-framework)
- [13. Risks and Anti-Patterns](#13-risks-and-anti-patterns)
- [14. Recommended Next Actions](#14-recommended-next-actions)
- [15. Source Inputs and Research Notes](#15-source-inputs-and-research-notes)

---

## 1. Executive Framing

### 1.1 What this plan is solving

HiveMind needs a skill system that improves context integrity instead of adding another layer of noise. The system must work at two levels at once:

1. **Pack level** — architecture, branching, milestones, packaging, compatibility, evaluation, and safe rollout.
2. **Individual skill level** — triggering quality, skill boundaries, references, stacking logic, auditing rules, TDD expectations, and behavior under degraded context.

This revised plan is the implementation blueprint for both levels simultaneously.

### 1.2 What previous attempts got wrong

Previous planning and draft implementation strands failed in predictable ways:

| Failure | Why it failed | Required correction |
|---------|---------------|---------------------|
| Context intelligence became bloated | The entry skill tried to contain routing, governance, recovery, delegation, and workflow depth at once | Keep Pack 1 entry thin; move operational depth into branches |
| Pack planning collapsed into single-skill planning | The system was discussed as if one skill could solve entry, workflow, delegation, and governance | Treat pack design and skill design as separate but linked planning layers |
| Progressive disclosure was referenced but not enforced | References were stacked too deeply and too eagerly | Keep a 1-level reference horizon and on-demand loading only |
| Degree of freedom was not controlled | Some sections were too vague to help; others were overly deterministic | Calibrate flexibility by fragility, authority risk, and error cost |
| Evaluation arrived too late | Drafting happened before test baselines and failure modes were defined | Use TDD for skills and packs, not just code |
| End-user pack authoring was under-modeled | Planning focused only on this repo and not on future consumers | Define rules that survive outside this codebase |
| Context integrity was treated as style | Context rot, hierarchy collapse, stale governance, and framework collisions were not treated as structural risk | Treat context intelligence as a reliability system |

### 1.3 Architectural stance of this revision

This revision adopts the following non-negotiable posture:

1. **Pack 1 is an entry-defense and routing pack, not a deep handbook.**
2. **The pack system is branch-oriented, not pile-oriented.** New roles create bounded branches, not more weight inside one entry skill.
3. **Context intelligence is a support harness, not a second governance regime.** It must narrow, denoise, and recover, not dominate.
4. **Determinism is reserved for truly authoritative elements only.** Examples: naming rules, packaging rules, frontmatter stability, authority resolution protocol, evaluation gates.
5. **Pack design must remain compatible with HiveMind, OpenCode, GSD, and mixed IDE agent surfaces.**
6. **Every stable skill must be test-backed, reviewable, and auditable.**

### 1.4 Immediate strategic outcome

The immediate output of this plan is a pack architecture that enables HiveMind to ship:

- a **thin Pattern 1 router** for context-aware session framing,
- a set of **Pattern 2 branch skills** for normal operational narrowing,
- a set of **Pattern 3 specialist skills** for fragile or authority-sensitive depth,
- a separate **companion pack** for authoring, auditing, packaging, refactoring, and migration.

---

## 2. Skill-System Philosophy

### 2.1 Progressive disclosure

Progressive disclosure is not decorative. It is the main control against token waste, confused routing, and false certainty.

| Layer | What loads | Purpose | Rule |
|------|-------------|---------|------|
| L0 | name + description | Trigger discovery | Must describe WHAT, WHEN, and distinguishing conditions |
| L1 | `SKILL.md` core body | Session framing or bounded procedure | Must stay load-attractive and decision-oriented |
| L2 | `references/`, `templates/`, `scripts/` | Depth, examples, deterministic helpers | Load only when the branch decision is already made |

**Design consequence:** the pack must narrow from broad entry to bounded operational depth without loading everything at once.

### 2.2 Degree of freedom

Degree of freedom is the allowed range of adaptation inside a skill.

| Level | Use when | Example |
|------|----------|---------|
| High | Multiple valid paths exist and premature constraint would harm reasoning | Entry routing, ambiguity assessment, delegation/no-delegation decision |
| Medium | The work is narrow enough for a preferred shape, but local adaptation still matters | Workflow branch, delegation branch, investigation branch |
| Low | Errors are fragile, expensive, or authority-sensitive | Frontmatter format, naming rules, evaluation gate criteria, reference depth rule |

**Operating rule:** a skill must never be more rigid than the problem requires, and never more vague than the problem can tolerate.

### 2.3 The three-pattern model

#### Pattern 1 — High-level routing

Pattern 1 skills answer: *What kind of session is this, what is the likely context shape, and what should happen next?*

They should:

- remain broad without becoming empty,
- frame session type and context integrity,
- decide whether to branch, stack, delegate, or stop,
- avoid operational depth except for safe entry checks.

#### Pattern 2 — Classification and domain branches

Pattern 2 skills answer: *Now that the session shape is known, what branch of work are we actually in?*

They should:

- provide stepwise workflow shape,
- specify what artifacts to inspect,
- define branch-specific QA and validation,
- recommend templates and references,
- stay narrower than Pattern 1 but shallower than Pattern 3.

#### Pattern 3 — Deep expertise and fragile interpretation

Pattern 3 skills answer: *This case is sensitive, conflicted, degraded, or authority-heavy; how do we resolve it safely?*

They should:

- use TOCs and in-text jump links,
- keep structure strict and navigable,
- prefer references and assets over inline text sprawl,
- handle uncertainty, ambiguity, and same-level authority conflict explicitly.

### 2.4 One-level reference horizon

HiveMind will use a **1-level reference horizon**:

- `SKILL.md` may point to files in `references/`, `templates/`, or `scripts/`.
- A reference file must not require another reference file to be understood.
- Long, deep material must be sharded inside the pack and surfaced through a local `index.md`, not a reference chain.

This prevents A → B → C loading cascades that destroy context locality.

### 2.5 Stacking philosophy

Agents may load up to **3 skills per entry/turn**. The stack must preserve room for workflow, testing, framework, or role-specific needs.

**Default stack model:**

1. one Pattern 1 entry skill,
2. up to one Pattern 2 branch skill,
3. up to one Pattern 3 specialist skill.

If more is needed, the session should delegate or defer rather than continue stacking.

### 2.6 QA-first interaction model

Most skills in this system should behave in the following order:

1. clarify intent and uncertainty,
2. perform short-step investigation,
3. escalate to deeper research only if justified,
4. confirm the frame and findings,
5. recommend or execute the plan,
6. run a progress and evaluation loop.

This interaction model is part of the architecture, not optional style guidance.

---

## 3. System Boundaries and Authority Model

### 3.1 Pack ecosystem boundary

The revised HiveMind skill ecosystem has two major lanes:

| Lane | Purpose | Role |
|------|---------|------|
| `context-intelligence` | Entry defense, context routing, recovery awareness, safe branch selection | Pack 1, must-load at meaningful entry points |
| Companion authoring pack | Skill writing, auditing, evaluation, packaging, consolidation, migration, removal | Separate pack; canonical candidate remains `meta-builder-hivemind` |

The companion authoring pack must not replace or absorb Pack 1.

### 3.2 Hivemind-specific boundary rules

1. HiveMind remains **OpenCode-first**, but not OpenCode-only in awareness.
2. Runtime and generated surfaces such as `.hivemind/` and `dist/` are not authoring truth.
3. Root and nested governance files must be interpreted by scope, freshness, and authority, not by filename prestige alone.
4. GSD remains a legitimate framework surface and must not be shadowed by redundant HiveMind ceremony.

### 3.3 Compatibility stance

The pack system must operate safely across:

- HiveMind-specific repo conventions,
- OpenCode plugin surfaces,
- GSD agents and workflows,
- adjacent IDE surfaces such as `.claude`, `.codex`, `.cursor`, `.roo`, `.qwen`, `.gemini`, `.agent`, and related mirrors,
- future end-user environments that will not share this repo’s exact file tree.

### 3.4 Authority conflict posture

When same-level authority sources disagree, skills must:

1. recognize conflict instead of forcing a decision,
2. inspect freshness, scope, and evidence,
3. prefer the **latest valid same-level authority** only when that preference is logically justified,
4. surface uncertainty explicitly when no safe resolution exists.

---

## 4. Context Intelligence Pack Architecture

### 4.1 Pack mission

The Context Intelligence Pack exists to improve context integrity in multi-layered development environments by:

- defending against context rot, pollution, and false authority,
- helping agents preserve hierarchy and breadth/depth awareness,
- improving session routing and branch selection,
- protecting the main session from unnecessary investigative sprawl,
- supporting deterministic elements where they are genuinely authoritative.

### 4.2 Pack shape

```text
skills/
└── context-intelligence/
    ├── SKILL.md
    ├── references/
    │   ├── 01-session-routing.md
    │   ├── 02-context-state-and-recovery-thresholds.md
    │   ├── 03-stack-and-delegation-decisions.md
    │   └── index.md
    ├── scripts/
    │   └── discovery-*        # optional and read-only by default
    └── templates/
        └── context-checklist.md
```

Pattern 2 and Pattern 3 branches live as separate sibling skill directories, not as ever-expanding content inside the Pattern 1 entry skill.

### 4.3 Core architecture decisions

| Decision | Why it exists |
|---------|---------------|
| Entry skill stays thin | Entry routing is harmed by depth overload |
| Session taxonomy is explicit | Main session, resumed session, delegated session, and degraded session need different treatment |
| Rot detection is always-aware but not always-deep | Constant paranoia is noisy; constant awareness is useful |
| Pack depth is branch-driven | Different problem shapes require different guidance bundles |
| Context recovery is conditional | Recovery content should not load unless degradation signals justify it |

### 4.4 Pattern 1 anchor skill

**Stable anchor:** `context-intelligence`  
**Working role example:** `Hivemind-runtime-context` as the conceptual top-level router persona within the pack.

This skill should determine:

- whether the session is user-facing, resumed, delegated, interrupted, degraded, or recovered,
- whether branch loading is necessary,
- whether stacking is justified,
- whether deeper work should be delegated instead of explored inline,
- whether the main session should stop and confirm rather than act.

### 4.5 Pack-level structure across patterns

| Pattern | Pack role in Context Intelligence | Loading posture |
|---------|----------------------------------|-----------------|
| Pattern 1 | Entry routing, session framing, stack discipline, context integrity awareness | Broad, thin, must-load at meaningful entry points |
| Pattern 2 | Branch-specific operational narrowing | Conditional load after Pattern 1 classification |
| Pattern 3 | Recovery, governance-sensitive resolution, migration, or conflict-sensitive depth | Specialist load only when risk or ambiguity warrants it |

### 4.6 What is core vs optional vs future expansion

| Component | Status | Why |
|----------|--------|-----|
| `context-intelligence` | Core | Required entry router and context defense frame |
| `context-intelligence-delegation` | Core | Delegation is a first-class reality in HiveMind and GSD workflows |
| `context-intelligence-workflow` | Core | Workflow hierarchy is central to pack value |
| `context-intelligence-recovery` | Core but conditional | Recovery is essential capability but should not load by default |
| `context-intelligence-governance-resolution` | Optional early specialist | Needed when AGENTS/CLAUDE/GEMINI/governance collisions are active |
| `context-intelligence-tech-research-bridge` | Future | Useful when codebase investigation and external tech synthesis must be coordinated |
| `context-intelligence-history-mapping` | Future | Useful for long-lived repos with heavy archival and branch history |
| intent-capture branch | Future | Better placed after entry and branch skeleton is stable |

---

## 5. Pattern Model and Composition Rules

### 5.1 Pattern 1 responsibilities

Pattern 1 entry skills must do the following and no more:

1. classify session state,
2. assess context confidence,
3. recommend stack shape,
4. recommend delegation or main-session preservation where needed,
5. identify when no extra skill is necessary.

### 5.2 Pattern 2 responsibilities

Pattern 2 branch skills must:

- narrow the domain or operating lane,
- specify artifacts to inspect,
- define short procedural flow,
- define branch-specific QA checks,
- point to templates and shallow references.

### 5.3 Pattern 3 responsibilities

Pattern 3 specialist skills must:

- handle fragile, high-cost, or ambiguous cases,
- define authority conflict rules,
- separate confidence, evidence, and uncertainty,
- provide stop-and-confirm thresholds.

### 5.4 Stacking rules

| Situation | Recommended action |
|----------|--------------------|
| Fresh but normal session | Load Pattern 1 only |
| Session clearly falls into one operational lane | Load Pattern 1 + one Pattern 2 |
| Risk, ambiguity, or degradation is materially present | Load Pattern 1 + one Pattern 2 + one Pattern 3 |
| More than 3 skills seem necessary | Delegate or split the work; do not keep stacking |
| Deep exploration threatens to pollute the main thread | Delegate a sub-session and reintegrate summary output |

### 5.5 No-load rules

A good entry router must often decide **not** to load more skills. That is a success case, not a miss.

Do not load extra skills when:

- the task is simple and stable,
- context integrity is high,
- no branch-specific discipline is required,
- the user’s intent is already narrow and operationally clear,
- additional loading would add explanation without improving decisions.

### 5.6 Delegation rules

Delegate instead of exploring inline when:

- the investigation is likely to require multiple tool calls and broad discovery,
- the main session needs to preserve strategic clarity,
- the work crosses branches or frameworks and needs bounded research,
- there is governance ambiguity that needs isolated inspection,
- the return can be summarized as evidence instead of conversation sprawl.

### 5.7 Skill composition rules

1. A skill may assume the pattern above it, but it must not duplicate it.
2. Pattern 2 skills may reference Pattern 1 concepts, but should not restate Pattern 1 routing logic.
3. Pattern 3 skills may assume prior narrowing and should not re-teach the whole system.
4. Composition must be horizontal at the reference layer. Skills may align, but references should not chain.

---

## 6. Branching and Milestone Plan

### 6.1 Main branch themes

| Branch lane | Purpose |
|------------|---------|
| `main` | Stable shipped skills and approved docs |
| `feature/context-intelligence-core` | Pattern 1 router and core entry references |
| `feature/context-intelligence-branches` | Pattern 2 and Pattern 3 branch implementation |
| `feature/meta-builder-hivemind` | Companion pack for authoring, audit, and packaging |
| `feature/skill-evals-and-gates` | TDD harnesses, evaluation assets, pressure tests |

### 6.2 Milestone sequence

| Milestone | Goal | Main output | Dependency |
|-----------|------|-------------|------------|
| M0 | Finalize pack and branch architecture | This plan + stable naming posture | none |
| M1 | Ship thin Pattern 1 router | `context-intelligence/SKILL.md` + 3 shallow references | M0 |
| M2 | Ship core Pattern 2 branches | delegation + workflow branch skills | M1 |
| M3 | Ship first Pattern 3 specialist | recovery branch with TOC and thresholds | M1 |
| M4 | Ship companion authoring/audit pack posture | meta-builder naming, writing, audit, migration rules | M1 plus naming freeze checkpoint |
| M5 | Cross-pack evaluation and packaging hardening | stress tests, judge rubric, promotion rules | M2-M4 |
| M6 | Optional expansions | governance-resolution, history-mapping, tech-research bridge | only after M5 evidence |

### 6.3 Conditional branches

| Conditional branch | Trigger for creation | Keep out of initial core because |
|--------------------|--------------------|---------------------------------|
| Governance resolution specialist | Active AGENTS/CLAUDE/GEMINI or multi-charter confusion | It is fragile specialist depth, not universal entry logic |
| Tech research bridge | Repeated need to connect repo investigation with external stack synthesis | Requires stronger evaluation and may compete with research skills |
| History mapping | Repeated confusion from archives, forks, and same-level dated plans | Too heavy for initial core and should be proven by real failure modes |
| Intent capture lane | Entry prompts routinely fail because user goals remain underspecified | Better built after core routing signals are validated |

### 6.4 Framework-specific variants

Framework-aware variants are allowed only when the difference is meaningful and stable.

Allowed examples:

- OpenCode-first variant notes,
- GSD workflow alignment notes,
- cross-IDE surface awareness notes.

Not allowed in the core:

- separate pack forks for every framework,
- names that imply framework authority the pack does not own,
- duplicated packs that differ only by platform branding.

### 6.5 Environment-specific variants

Environment-specific guidance should stay inside references unless it crosses a threshold of real operational difference. Variants may exist for:

- local repo vs global skill installation,
- monorepo vs single-package repo,
- shallow vs archive-heavy repository history,
- low-trust or degraded session environments.

### 6.6 Order of work

1. stabilize naming and branch boundaries,
2. write the Pattern 1 router and its reference skeleton,
3. add branch skills for delegation and workflow,
4. add recovery specialist depth,
5. build the authoring/audit companion pack in parallel with evaluation harnesses,
6. add future branches only after evidence shows repeated unmet need.

---

## 7. Pack and Skill Inventory Recommendations

### 7.1 Recommended pack inventory

| Pack | Role | Pattern center | Status |
|------|------|----------------|--------|
| `context-intelligence` | Entry routing and context defense | Pattern 1 | Core |
| `meta-builder-hivemind` | Skill authoring, auditing, packaging, migration | Cross-pattern companion | Planned |
| `hivemind-skill-writer` | Accepted alias for the companion pack | Alias only | Transitional |

### 7.2 Context Intelligence skill inventory

| Skill | Pattern | Purpose | When to load | When not to load | Main references | Must avoid |
|------|---------|---------|--------------|------------------|-----------------|------------|
| `context-intelligence` | P1 | Session framing, context confidence, stack decisions, no-load decisions | Meaningful entry, resume, compaction recovery, unclear scope | When the session is trivial and already narrow | session routing, state thresholds, stack decisions | Becoming a giant handbook |
| `context-intelligence-delegation` | P2 | Delegation shape, scope inheritance, handoff validation, return integration | Delegating or receiving delegated work | When no delegation exists | handoff packet template, delegation QA checklist | Replacing project workflow logic |
| `context-intelligence-workflow` | P2 | Workflow hierarchy, phase shape, validation order, milestone posture | Multi-phase work, planning-to-execution transitions, orchestration tasks | Single short tasks with no phase complexity | workflow branch matrix, planning/TDD template map | Becoming a planning megaskill |
| `context-intelligence-recovery` | P3 | Rot severity model, recovery posture, trust rebuilding, stop-and-confirm thresholds | Degraded context, ambiguity, resumed partial state, polluted signals | Clean fresh sessions | recovery thresholds, isolation checklist | Default loading, panic-heavy behavior |
| `context-intelligence-governance-resolution` | P3 | Resolve governance collisions across `AGENTS.md`, framework docs, nested charters, stale mirrors | Conflicting authority or hierarchy confusion | Stable single-charter sessions | authority comparison matrix, freshness heuristic | Claiming certainty without evidence |

### 7.3 Companion pack skill inventory

The companion pack should be a separate implementation lane with its own stable pack identity.

| Skill | Pattern role | Purpose | Must avoid |
|------|---------------|---------|------------|
| `meta-builder-hivemind` / `hivemind-skill-writer` | Companion router | Guide HiveMind-specific skill writing, audit, packaging, migration, and removal | Trying to replace Pack 1 context routing |
| `skill-audit-hivemind` | Specialist branch | Audit pack and skill quality, collisions, determinism, overlap, and authority claims | Becoming a generic style linter |
| `skill-migration-hivemind` | Specialist branch | Refactor, consolidate, shard, alias, migrate, or remove skills safely | Triggering before an audit exists |

### 7.4 Cross-skill chaining scenarios that must be supported

1. **Context as governance** → `context-intelligence` + governance-resolution branch.
2. **Use-case branch to delegation** → `context-intelligence` + delegation branch.
3. **Workflow branch plus evaluation** → `context-intelligence` + workflow branch + evaluation companion skill.
4. **Deep codebase investigation plus tech research** → `context-intelligence` + branch + external research companion.
5. **Main-session framing plus delegated sub-session investigation plus reintegration** → Pattern 1 entry router + delegation branch + return-summary protocol.

---

## 8. Hivemind-Specific Skill-Writing and Audit Guidance

### 8.1 Writing standards for this ecosystem

Every new HiveMind skill should meet all of the following:

1. **It solves a distinct boundary problem.**
2. **Its description contains WHAT, WHEN, and differentiating context.**
3. **Its degree of freedom is intentional.**
4. **Its reference layer is one level deep.**
5. **Its instructions are interactive before action-heavy.**
6. **Its deterministic claims are reserved for authoritative or fragile domains.**
7. **Its language explains uncertainty explicitly.**
8. **Its design is compatible with mixed frameworks rather than hostile to them.**

### 8.2 Writing standards for future end users

End users who create skills later in their own environments should be able to adopt these rules without knowing this repo’s internals.

That means HiveMind skills should teach reusable methods such as:

- how to classify a session before acting,
- how to decide whether to stack or branch,
- how to audit a skill without collapsing into style-only review,
- how to keep references shallow and names stable,
- how to distinguish useful determinism from brittle ceremony.

### 8.3 Audit standards for existing skills

When auditing an existing skill, inspect the following dimensions:

| Dimension | What to inspect |
|----------|-----------------|
| Trigger clarity | Would the right prompts actually activate it? |
| Knowledge delta | Does it contain expert value or token waste? |
| Boundary clarity | Does it duplicate another skill’s role? |
| Degree-of-freedom calibration | Is it too rigid or too vague? |
| Reference discipline | Does it chain references or dump too much inline? |
| Compatibility | Does it collide with OpenCode, GSD, or mixed framework norms? |
| Evaluation readiness | Can its benefit be tested, observed, and compared? |

### 8.4 Preventing dumb determinism

Do not write a rule as absolute merely because it sounds tidy.

Absolute language is allowed when dealing with:

- frontmatter stability,
- naming format,
- reference depth constraints,
- stop-and-confirm gates for dangerous ambiguity,
- known runtime/generated surface boundaries.

Absolute language is **not** justified for:

- generic repo structure assumptions,
- framework preference claims without evidence,
- speculative authority resolution,
- broad procedural statements that vary by environment.

### 8.5 Avoiding overlap and selection confusion

Before approving a new skill, ask:

1. What exact role does it play in P1, P2, or P3?
2. What currently stable skill would a user confuse it with?
3. Should this be a branch, a reference, an alias, or a new pack?
4. Does it create a new load decision, or merely duplicate an old one?

If the answer to question 4 is duplication, the skill should not ship as a new top-level entity.

### 8.6 Interaction standard for resulting skills

The resulting skills should be:

- confidence-building without false confidence,
- concise in steps but rich in reasoning,
- QA-first and no-assumption by default,
- willing to investigate briefly before planning deeply,
- capable of preserving the main session by delegating deeper work,
- explicit about when to stop, narrow, ask, or recover.

---

## 9. Evaluation and TDD Strategy

### 9.1 Evaluation posture

Evaluation is comparative and scenario-based. A skill pack that works only in clean ideal conditions is not ready.

### 9.2 Quality rubric

Use the pack evaluation rubric already drafted for the revamp and combine it with skill-level quality judgment.

#### Pack-level rubric

| Dimension | Weight | Meaning |
|----------|--------|---------|
| Trigger clarity | 20 | Right pack loads, wrong pack does not |
| Degree-of-freedom control | 15 | Flexibility and strictness are well-calibrated |
| Branch clarity | 15 | Pattern 1 / 2 / 3 boundaries are visible |
| Context-rot defense | 20 | Pack survives degraded or polluted context |
| Cross-framework resilience | 10 | Pack sees mixed surfaces without inheriting them blindly |
| TDD and eval readiness | 10 | Failure cases and validation lanes are runnable |
| Packaging discipline | 10 | Naming, reference depth, and asset rules hold |

#### Skill-level rubric

Use a combined quality lens informed by the local `skill-judge`, `writing-skills`, and `skill-creator` references:

| Dimension | Why it matters |
|----------|----------------|
| Knowledge delta | Prevents token waste |
| Mindset and procedure transfer | Teaches how to think and what domain-specific steps matter |
| Anti-pattern quality | Teaches what not to do and why |
| Description quality | Determines whether the skill is even discoverable |
| Progressive disclosure quality | Keeps the skill operationally usable |
| Practical usability | Supports real work instead of abstract advice |

### 9.3 TDD workflow for skills

Every skill should follow a skill-specific RED → GREEN → REFACTOR loop.

#### RED

- identify a real failure scenario,
- capture the user-style prompt or degraded condition,
- run the task without the skill or with the old skill,
- document the exact miss, confusion, collision, or hallucination risk.

#### GREEN

- write the minimum skill content needed to address the observed failure,
- rerun the scenario,
- confirm that the failure is reduced without adding new confusion.

#### REFACTOR

- tighten trigger language,
- remove redundancy,
- split or shard if it became too large,
- verify reference depth, stack fit, and composition hygiene.

### 9.4 Pressure-test lanes

The pack and its skills must be stress-tested under:

| Lane | Expected proof |
|------|----------------|
| Baseline no-skill | Shows current failure or confusion mode |
| With-pack run | Shows meaningful improvement |
| Delegated-session stress | Scope boundaries stay explicit |
| Mid-session degradation stress | Session recovery stays sane |
| Pollution stress | False authority is downgraded, not obeyed blindly |
| Cross-framework stress | Mixed surfaces are recognized without collision |
| End-user environment stress | Pack logic still makes sense outside this repo |
| Governance ambiguity stress | Same-level conflicts do not produce false certainty |

### 9.5 Promotion gates

| Gate | Requirement |
|------|-------------|
| Draft readiness | Role is clear, naming is stable enough, and load shape is attractive |
| Branch readiness | At least one real failure scenario and one passing branch scenario exist |
| Promotion readiness | Pack-level score ≥ 80/100 and skill-level judge score ≥ 90/120 target band or equivalent threshold |
| Reference-skill readiness | The skill has proven reusable value, test evidence, and a stable template or chain pattern |

### 9.6 Reference-skill graduation

A skill should graduate into a **reference skill** only when:

1. it has repeated successful use,
2. its trigger behavior is stable,
3. its structure is useful as a template for new end users,
4. its chain links do not create selection confusion.

---

## 10. Documentation, Naming, and Packaging Standards

### 10.1 Naming principles

1. Use kebab-case.
2. Prefer role nouns or problem nouns over vague action labels.
3. Keep one canonical pack id and preserve aliases as aliases only.
4. Do not create names that imply authority the pack does not own.
5. Widen the system by branch, not by endlessly widening one pack name.

### 10.2 Current naming posture

| Name | Status | Meaning |
|------|--------|---------|
| `context-intelligence` | Stable target | Pack 1 entry pack |
| `meta-builder-hivemind` | Draft canonical candidate | Companion authoring and audit pack |
| `hivemind-skill-writer` | Accepted alias | User-facing shorthand until naming freeze |

### 10.3 Packaging logic

```text
skill-name/
├── SKILL.md
├── references/
│   ├── 01-*.md
│   ├── 02-*.md
│   └── index.md
├── scripts/
│   └── discovery-*.sh | .ts | .py
├── templates/
│   └── *.md
└── assets/
    └── only when materially useful
```

### 10.4 Sharding rules

| Content size | Rule |
|-------------|------|
| Thin entry skill | keep `SKILL.md` compact and decision-oriented |
| Mid-depth branch | allow bounded references and templates |
| Specialist depth | shard into numbered files plus `index.md`, TOC, and jump links |

### 10.5 Frontmatter stability

Stable frontmatter matters because pack identity and discoverability depend on it.

Required stable fields for HiveMind skill packages should include at minimum:

- `name`
- `description`

Allowed additional fields may include:

- `version`
- `tags`
- `stacking`
- `entry`
- `references`

These extra fields should remain stable once adopted; changing them casually creates routing drift.

### 10.6 TOCs and jump links

Pattern 3 skills and long planning docs should always provide:

- a Table of Contents,
- explicit section anchors,
- jump links for recovery, thresholds, and authority-resolution sections,
- local sharding rather than inline text dumping.

### 10.7 Reference, template, and asset organization

| Surface | Use for | Must avoid |
|---------|---------|------------|
| `references/` | Explanation, decision matrices, branch detail | Reference chains |
| `templates/` | Output structures, checklists, handoff forms | Heavy prose duplicated from `SKILL.md` |
| `assets/` | Rare static support files | Becoming a second document system |
| `scripts/` | Deterministic helper logic and safe exploration | Risky mutation by default |

---

## 11. Operational Safeguards

### 11.1 Git and worktree practices

The plan and the resulting skills must promote:

1. atomic git commits for planning and implementation changes,
2. branch-per-milestone or branch-per-lane work,
3. `.worktrees` or worktree-based isolation when large experiments are needed,
4. a clean separation between discovery, planning, and mutation.

### 11.2 Discovery-first shell posture

Default script posture must be read-only and exploratory.

**Preferred shell patterns:**

```bash
find . \
  -not -path '*/node_modules/*' \
  -not -path '*/.git/*' \
  -not -path '*/dist/*' \
  -not -path '*/coverage/*' \
  -not -path '*/.cache/*' \
  -not -path '*/.hivemind/*' \
  -type f
```

```bash
git log --oneline --decorate -20
```

```bash
find . -type f | grep -E 'AGENTS\.md|CLAUDE\.md|GEMINI\.md|README\.md'
```

### 11.3 Safe inspection expectations

Skills should encourage:

- hierarchy-aware code-tree inspection,
- exclusion of noisy directories,
- regex-based lookup before hardcoded path assumptions,
- fuzzy matching when folder or filename variance is likely,
- default read-only exploration unless mutation is explicitly required.

### 11.4 Multi-environment handling

Scripts and skill guidance should assume that:

- some users operate in monorepos,
- some install skills globally,
- some use mirrored framework directories,
- some environments have weak shell capabilities or inconsistent cert stores,
- some platforms differ in layout but still represent the same role concepts.

### 11.5 Historical context mapping

Skills should encourage techniques such as:

- reading recent git history before acting on a stale-looking artifact,
- comparing timestamps and commit evidence when same-level files conflict,
- treating dated plans as advisory unless explicitly promoted,
- maintaining context maps of stable authority vs archive/history surfaces.

### 11.6 Safe recovery from degraded context

When context is incomplete or degraded, the safe operating sequence is:

1. pause and classify the degradation,
2. gather minimal evidence,
3. re-anchor user intent and current state,
4. avoid mutation until confidence is restored,
5. escalate to recovery specialist guidance only when needed.

---

## 12. Refactor / Consolidate / Migrate / Remove Framework

### 12.1 Decision rules

| Situation | Action | Reason |
|----------|--------|--------|
| Skill duplicates another stable role | Consolidate or remove | Reduces selection confusion |
| Skill is too large for its pattern role | Shard into pattern-correct pieces | Restores progressive disclosure |
| Skill mostly repeats model-known material | Remove or rewrite | Poor knowledge delta |
| Skill conflicts with GSD or legitimate framework behavior | Refactor or isolate | Compatibility matters |
| Skill is useful but misplaced in the wrong pack | Migrate | Pack boundary clarity |
| Skill is obsolete but historically relevant | Deprecate and archive | Preserve history without keeping it live |

### 12.2 Consolidation criteria

Consolidate skills when they:

- share the same operating role,
- overlap heavily in triggers,
- compete for the same user prompt shape,
- create duplicate references or boundary claims.

Do **not** consolidate when they:

- occupy different pattern roles,
- have meaningfully different risk profiles,
- serve different entry conditions or different session states.

### 12.3 Migration framework

1. audit the existing skill,
2. classify it against the pattern model,
3. map overlaps and conflicts,
4. define a TDD migration baseline,
5. move or shard it into the correct pack or branch,
6. validate that routing and stack behavior improved.

### 12.4 Remove framework

Removal is appropriate when a skill:

- provides no meaningful knowledge delta,
- creates false determinism,
- duplicates another live skill’s value,
- causes routing confusion that outweighs any benefit,
- depends on stale assumptions about repo or framework shape.

### 12.5 Alias framework

Aliases are allowed only when they reduce adoption friction without creating parallel pack identities. Example:

- `hivemind-skill-writer` may remain an accepted alias while `meta-builder-hivemind` is the candidate canonical name.

Alias rules:

1. the alias must not become a separate pack,
2. the alias must point to the same conceptual boundary,
3. the alias must be retired or frozen deliberately, not accidentally.

---

## 13. Risks and Anti-Patterns

### 13.1 What must not happen

| Anti-pattern | Why it is dangerous |
|-------------|---------------------|
| One giant master skill | Destroys routing clarity and progressive disclosure |
| Loading many vague skills at entry | Consumes context without useful narrowing |
| Branches that duplicate each other | Causes load confusion and poor trigger quality |
| Specialist depth in Pattern 1 | Pollutes every session with low-frequency content |
| Brittle absolute path assumptions | Breaks in end-user environments and mixed frameworks |
| Ceremonial determinism | Adds false confidence and obstructs work |
| Testing that proves nothing | Produces fake readiness |
| Governance overreach | Collides with legitimate framework surfaces |
| Accidental over-automation | Encourages mutation before sufficient understanding |

### 13.2 Bad skill-pack behavior this plan is designed to prevent

1. **Entry router becomes the entire operating manual.**
2. **Delegation logic loads even when no delegation exists.**
3. **Recovery logic behaves like panic mode in clean sessions.**
4. **Authoring pack collides with planning or TDD packs instead of coordinating with them.**
5. **Skills claim authoritative resolution when the evidence is mixed or stale.**
6. **Skills teach humans and models to obey directory names instead of actual authority.**

### 13.3 Hallucination and overreach risks

The plan explicitly guards against:

- invented authority claims,
- overconfident freshness resolution,
- assuming that generated/runtime surfaces are authoring truth,
- interpreting all framework files as equally authoritative,
- treating every vague prompt as justification for deep branch loading.

---

## 14. Recommended Next Actions

### 14.1 Immediate next steps

1. Freeze this document as the current planning blueprint.
2. Use it to rewrite the thin Pattern 1 `context-intelligence` skill.
3. Define the first failing TDD scenarios for:
   - fresh session routing,
   - delegated sub-session scope,
   - resumed/degraded session recovery.
4. Stabilize the companion pack naming decision boundary without minting extra names.

### 14.2 What should be drafted first

Draft in this order:

1. `context-intelligence/SKILL.md`
2. `context-intelligence/references/01-session-routing.md`
3. `context-intelligence/references/03-stack-and-delegation-decisions.md`
4. `context-intelligence-delegation/SKILL.md`
5. `context-intelligence-workflow/SKILL.md`
6. `context-intelligence-recovery/SKILL.md`

### 14.3 What must be validated before expansion

Before any optional or future branch is approved, validate that:

1. Pattern 1 stays thin and useful.
2. Pattern 2 branches do not compete with each other.
3. Pattern 3 depth is invoked only when risk warrants it.
4. The stack remains within the 3-skill entry constraint.
5. Pack logic still works in a degraded or partially pruned session.
6. Companion pack guidance does not clash with planning or TDD workflows.

### 14.4 Promotion-ready implementation sequence

| Step | Outcome |
|------|---------|
| Draft P1 router | Entry discipline becomes concrete |
| Add branch skills | Pack becomes operational |
| Add recovery specialist | Safe degraded-context handling becomes real |
| Run pressure tests | Confidence comes from evidence, not prose |
| Build companion authoring pack | End-user skill creation becomes coherent |
| Promote stable templates | Future pack and skill writing becomes faster and safer |

---

## 15. Source Inputs and Research Notes

### 15.1 Local source inputs applied

- `docs/draft-notes/context-intelligence-entry-pack-plan-2026-03-19.md`
- `docs/draft-notes/setting-the-theme.md`
- `docs/skill-revamp/architecture.md`
- `docs/skill-revamp/progress.md`
- `docs/skill-revamp/eval-tracking.md`
- `docs/skill-revamp/planning/skill-pack-naming/name-of-skill-planning.md`
- `docs/HIVEMIND-FRAMEWORK-AUDIT-CRITERIA.md`

### 15.2 External reference inputs applied

The plan incorporated directly accessible local copies or installed skills for:

- Softaworks `skill-judge`
- Obra `writing-skills`
- Anthropic `skill-creator`

### 15.3 Accessibility note

The `skills.sh` Vercel Labs `skill-creator` page was attempted during planning but was not directly readable in this environment because of local SSL certificate verification failure. No details were fabricated from that inaccessible fetch. The plan instead relied on the locally available external skill references and the already-drafted local revamp materials that explicitly encode progressive disclosure and degree-of-freedom concerns.

### 15.4 Planning conclusion

This master plan is intentionally stricter about boundaries, branching, evaluation, and safety than earlier drafts. That strictness is directed at architecture, not at user workflows. The aim is to produce a skill system that is more intelligent, more context-aware, and less noisy across both this repository and future end-user environments.
