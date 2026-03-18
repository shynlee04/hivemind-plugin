# HiveMind SKILL PACKAGES — Revised Master Plan

**Date:** 2026-03-19  
**Status:** REVISED PLANNING  
**Author:** Based on user guidance + planning docs audit

---

## 1. Executive Framing

### What This Plan Solves

The HiveMind plugin needs a skill-pack architecture that handles:
- Front-facing entry complexity (multiple agent roles, delegated subagents)
- Long-session context drift and degradation
- Context rot, pollution, and poisoning in multi-agent IDE environments
- Mixed platform surfaces (`.opencode`, `.claude`, `.codex`, `.agent`)
- Workflow hierarchy and deterministic enforcement
- Without becoming another bloated governance layer

### What Previous Attempts Got Wrong

| Failure | Why It Failed |
|---------|---------------|
| **Bloated context-intelligence** | Tried to be everything at once — 6 references, L1-L4 escalation, ceremony |
| **Standalone delegation/workflow skills** | Created as P1 when they should be P2/P3 branches |
| **No TDD validation** | Wrote skills without failing tests first |
| **Ignored degree of freedom** | Made everything mandatory instead of conditional |
| **Forgot progressive disclosure** | Loaded heavy skills when light routing was needed |

### Architectural Stance

```
┌─────────────────────────────────────────────────────────────────┐
│                    ARCHITECTURAL PRINCIPLES                        │
├─────────────────────────────────────────────────────────────────┤
│  1. P1 skills are THIN routers, not heavy packs                 │
│  2. Branches live UNDER P1, not beside it                       │
│  3. TDD is NON-NEGOTIABLE — no skill without failing test       │
│  4. Max 3 skills at entry — preserve room for GSD and others    │
│  5. 1-level reference horizon — no reference chains              │
│  6. Progressive disclosure — load depth only when triggered       │
│  7. GSD is legitimate — hivemind-* overlay supports, not replaces│
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Skill-System Philosophy

### Progressive Disclosure

| Level | Trigger | Content | Token Budget |
|-------|---------|---------|--------------|
| **L1** | Always on entry | Name + Description | ~100 tokens |
| **L2** | On trigger match | SKILL.md body | ~500 lines |
| **L3** | Explicit request | references/, scripts/, templates/ | As needed |

**Critical:** The agent sees ALL skill descriptions first. Description = WHAT + WHEN + KEYWORDS. Vague description = skill never triggers.

### Degree of Freedom Control

| Level | When to Use | Example |
|-------|--------------|---------|
| **HIGH** | Multiple valid paths, principle-driven | Entry routing, architecture decisions |
| **MEDIUM** | Preferred patterns exist, adaptation normal | Workflow branches, delegation |
| **LOW** | Fragile or high-cost errors | Naming rules, evaluation rules |

### The 3 Patterns System

#### Pattern 1: High-Level Routing (P1)
- **Role:** Must-load entry frame that routes to appropriate branches
- **Shape:** Thin SKILL.md (~100 lines), references only on demand
- **Philosophy:** Breadth-oriented, supports progressive disclosure without becoming vague
- **Must answer:** What kind of session is this? What branch should load?

#### Pattern 2: Domain/Classification (P2)
- **Role:** Narrow the work once situation is known
- **Shape:** Mid-depth references, templates, bounded guidance
- **Philosophy:** One level deeper than P1, step-by-step workflow shape
- **Examples:** Delegation branch, workflow coordination branch

#### Pattern 3: Specialist Depth (P3)
- **Role:** Deep expertise for fragile situations
- **Shape:** TOC + in-text jumps, strongly organized, constrained vertical depth
- **Philosophy:** Expert-only knowledge, used when problem requires serious depth
- **Examples:** AGENTS.md maintenance, context rot recovery, pack migration

### Stacking Rules

```
ENTRY STACK (max 3 skills):
├── context-intelligence (P1) — ALWAYS if context-aware
├── [branch skill] (P2) — if situation warrants
└── [specialist skill] (P3) — if depth required

hivemind-skill-writer does NOT count against stack (stacking: 0)
```

### Reference Rules

- **ONLY 1-level deep** from SKILL.md
- No reference chains (reference A cannot reference B)
- Use TOC + in-text jumps for deeper content
- Shard long documents into numbered files with `index.md`

---

## 3. Pack Architecture

### Context Intelligence Pack Overview

```
context-intelligence/                    # P1 - Entry Pack (THIN)
├── SKILL.md                            # Lightweight router only
└── references/                         # Branch entry points
    ├── 01-session-routing.md           # → Delegation branch
    ├── 02-workflow-routing.md          # → Workflow branch  
    ├── 03-recovery-routing.md          # → Recovery branch
    └── index.md

context-intelligence-delegation/         # P2 - Branch
├── SKILL.md                            # Delegation-specific guidance
└── references/
    └── ...

context-intelligence-workflow/           # P2 - Branch
├── SKILL.md
└── references/
    └── ...

context-intelligence-recovery/           # P3 - Specialist
├── SKILL.md
└── references/
    └── ...
```

### Skill Tree Across Patterns

| Pattern | Skill | Purpose | When to Load |
|---------|-------|---------|--------------|
| **P1** | `context-intelligence` | Entry routing, session type detection | Always on context-aware entry |
| **P1** | `hivemind-skill-writer` | Meta-builder, skill authoring | When creating/auditing skills |
| **P2** | `context-intelligence-delegation` | Scope rules, handoff packets | When delegated or delegating |
| **P2** | `context-intelligence-workflow` | Phase management, transition gates | When executing workflows |
| **P3** | `context-intelligence-recovery` | Rot detection, trust rebuilding | When context degradation suspected |

### What Is Core vs Optional vs Future Expansion

| Component | Status | Rationale |
|-----------|--------|-----------|
| `context-intelligence` (P1 router) | **CORE** | Must-load entry |
| `context-intelligence-delegation` (P2) | **CORE** | Common delegation scenario |
| `context-intelligence-workflow` (P2) | **CORE** | Common workflow scenario |
| `context-intelligence-recovery` (P3) | **OPTIONAL** | Only when degraded |
| Intent capture skill | **FUTURE** | User intent detection |
| QA skills | **FUTURE** | Quality assurance flows |
| Cross-reference intelligence | **FUTURE** | Understanding skill relationships |

---

## 4. Branching and Milestone Plan

### Implementation Branches

```
skill-revamp/
├── main                              # Stable skills
├── feature/context-intelligence       # P1 router + P2 branches
└── feature/skill-writer-enhancement  # hivemind-skill-writer improvements
```

### Milestone Sequence

| Milestone | What | Deliverable | Validation |
|-----------|------|-------------|------------|
| **M1** | P1 router for context-intelligence | Thin SKILL.md that routes to branches | TDD: Session type detection works |
| **M2** | Delegation branch (P2) | Scope rules, handoff packets | TDD: Delegation scenarios pass |
| **M3** | Workflow branch (P2) | Phase management, gates | TDD: Workflow scenarios pass |
| **M4** | Recovery branch (P3) | Rot detection, trust rebuilding | TDD: Degraded session recovery |
| **M5** | Integration & audit | Full stack, Skill-Judge eval | All tests pass, ≤3 skills load |

### Conditional Branches and Future Expansions

| Branch | Condition | Expansion Path |
|--------|-----------|----------------|
| Intent capture | User needs intent detection | New P2 skill |
| QA skills | Quality assurance workflow | New P2/P3 skills |
| Cross-reference intelligence | Skill conflict detection | New P1/P2 skills |

### Dependencies and Order of Work

```
M1 (P1 router) → M2 (Delegation) → M3 (Workflow) → M4 (Recovery) → M5 (Integration)
     ↓               ↓                  ↓                  ↓
  Standalone    Depends on M1      Depends on M1      Depends on M1
```

---

## 5. Skill Inventory Recommendations

### Candidate Skills for Context-Intelligence Pack

#### P1: context-intelligence (REVISED — THIN ROUTER)

**File:** `skills/context-intelligence/SKILL.md`

**What it does:**
- Detects session type (FRESH/RESUMED/DELEGATED/DEGRADED/INTERRUPTED/RECOVERED)
- Routes to appropriate P2/P3 branch based on session type
- Provides always-active context rot warning signals
- Does NOT try to be everything — just routes

**When to load:**
- Every context-aware session start
- After compaction
- When delegation scope unclear
- When context drift suspected

**What it references:**
- `references/01-session-routing.md` — Decision matrix for which branch to load

**What it does NOT contain:**
- Detailed delegation rules (→ delegation branch)
- Workflow phase definitions (→ workflow branch)
- Recovery protocols (→ recovery branch)

#### P2: context-intelligence-delegation

**File:** `skills/context-intelligence-delegation/SKILL.md`

**What it does:**
- Scope inheritance rules
- Handoff packet format
- Zero-trust receipt validation
- Chain of command

**When to load:**
- When receiving delegated task
- When granting delegation
- When validating subagent return

#### P2: context-intelligence-workflow

**File:** `skills/context-intelligence-workflow/SKILL.md`

**What it does:**
- Phase lifecycle management
- Transition gate validation
- Milestone tracking
- Parallel coordination rules

**When to load:**
- When executing multi-phase workflows
- When phase transition occurs
- When milestone completion needs validation

#### P3: context-intelligence-recovery

**File:** `skills/context-intelligence-recovery/SKILL.md`

**What it does:**
- Context rot detection (severity 0-4)
- Trust scoring and recovery
- Emergency isolation protocols
- Authority rebuilding

**When to load:**
- When context degradation suspected
- When severity > 1 detected
- When recovery protocol needed

### Skills to Avoid Creating

| Skill | Why Not |
|-------|---------|
| Heavy standalone context-intelligence | Was bloated, added ceremony |
| Delegation as standalone P1 | Should be P2 under context-intelligence |
| Workflow as standalone P1 | Should be P2 under context-intelligence |

---

## 6. Hivemind-Specific Skill-Writing and Audit Guidance

### Standards for Writing Skills in This Ecosystem

1. **Description MUST answer:** WHAT + WHEN + KEYWORDS
2. **Iron Law:** NO SKILL WITHOUT FAILING TEST FIRST
3. **Progressive disclosure:** L1 → L2 → L3 on trigger
4. **Reference depth:** ONLY 1 level
5. **Stacking:** Max 3 at entry (P1 doesn't count if it's the router)
6. **Freedom calibration:** Match specificity to fragility

### How to Avoid Conflicts and Brittle Determinism

| Anti-Pattern | Prevention |
|--------------|------------|
| Overlapping skills | Clear P1/P2/P3 boundaries |
| Brittle absolute paths | Use regex, fuzzy matching where safe |
| Deterministic ceremony | Only mandate where fragility requires it |
| Reference chains | 1-level only, use TOC/jumps |
| Token waste | Expert knowledge only, delete redundant |

### How End Users Should Benefit

1. **hivemind-skill-writer** is the meta-builder — teaches HOW to write skills
2. **context-intelligence** shows the pattern — P1 router + P2/P3 branches
3. **Reference templates** demonstrate proper structure
4. **TDD workflow** ensures quality before shipping

---

## 7. Evaluation and TDD Strategy

### Quality Metrics (from Skill-Judge)

| Dimension | Max | Focus |
|-----------|-----|-------|
| D1: Knowledge Delta | 20 | Expert knowledge not in model |
| D2: Mindset + Procedures | 15 | Thinking patterns + domain workflows |
| D3: Anti-Pattern Quality | 15 | Specific NEVER lists with WHY |
| D4: Spec Compliance | 15 | Description = WHAT + WHEN + KEYWORDS |
| D5: Progressive Disclosure | 15 | Layering with triggers |
| D6: Freedom Calibration | 15 | Match specificity to fragility |
| D7: Pattern Recognition | 10 | Follows established pattern |
| D8: Practical Usability | 15 | Decision trees, fallbacks, edge cases |

**Target:** 90%+ (108/120) for production-ready skills

### TDD Workflow for Skills

```
┌─────────────────────────────────────────────────────────────────┐
│                        RED PHASE                                  │
│  1. Identify failing scenario (real user prompt that fails)      │
│  2. Write test prompt for the scenario                           │
│  3. Run WITHOUT skill — observe exact failure mode                │
│  4. Document: What should have happened but didn't               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                        GREEN PHASE                                │
│  1. Write MINIMAL skill addressing specific failure               │
│  2. Run WITH skill — observe pass                                │
│  3. Verify failure mode is resolved                               │
│  4. Document: What changed and why                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                        REFACTOR PHASE                             │
│  1. Remove duplication                                           │
│  2. Tighten trigger accuracy                                     │
│  3. Ensure reference depth compliance                            │
│  4. Validate stacking ≤ 3                                        │
└─────────────────────────────────────────────────────────────────┘
```

### Stress Test Cases

| Scenario | What It Tests |
|----------|---------------|
| Fresh session | P1 router detects correctly |
| Delegated subagent | Scope boundaries respected |
| Resumed after gap | Continuity without hallucination |
| Degraded context | Recovery branch triggers |
| Mixed platform surfaces | Cross-framework recognition |
| Context polluted | Stop-and-confirm protocol |

---

## 8. Documentation and Packaging Standards

### Naming Principles

- Use kebab-case
- Descriptive names over generic verbs
- Role or problem nouns over action nouns
- No giant umbrella names
- Stable canonical names — don't rename frequently

### Sharding Rules

| Content Length | Shard Strategy |
|----------------|----------------|
| < 100 lines | Single file |
| 100-300 lines | File with inline sections |
| 300+ lines | Numbered files + `index.md` |

### Frontmatter Standard

```yaml
---
name: skill-name-with-kebab-case
description: >
  Use when [specific triggering conditions].
  Describes [what skill does].
  Keywords: trigger, words, here
version: 1.0.0
tags: [pattern, type, gsd]
stacking: 1  # 0 for meta-builder, 1 for P1, 2+ for P2/P3
entry: after-context-intelligence  # if applicable
references:
  - 01-topic.md
  - 02-topic.md
---
```

### TOC and Jump Links

For P3 skills or long documents:
```markdown
# Table of Contents
- [Section 1](#section-1)
- [Section 2](#section-2)

---

## Section 1
Content here...

## Section 2  
Content here...
```

### Assets Organization

```
skill-name/
├── SKILL.md
├── references/
│   ├── 01-topic.md
│   └── index.md
├── scripts/           # Only if needed
│   └── discovery*.sh   # Read-only by default
└── templates/        # Only if needed
    └── *.md
```

---

## 9. Operational Safeguards

### Git and Worktree Practices

1. **Atomic commits:** Plan + code together
2. **Worktree isolation:** When uncertain about changes, use `.worktree`
3. **Branch per milestone:** `feature/context-intelligence`, `feature/delegation-branch`

### Safe Discovery Scripts

```bash
# SAFE — Read-only discovery
ls -la src/
git log --oneline -10
find . -name "*.ts" -not -path "*/node_modules/*"

# UNSAFE — Never by default
rm -rf
git push --force
```

### Hierarchy-Aware Inspection

1. **Shell commands for tree inspection:**
   ```bash
   # Full tree excluding noise
   find . -not -path "*/node_modules/*" \
          -not -path "*/.git/*" \
          -not -path "*/dist/*" \
          -not -path "*/.hivemind/*" \
          -type f | head -50
   ```

2. **Platform-specific awareness:**
   - `.opencode/` — Primary for this project
   - `.hivemind/` — Runtime output only
   - `dist/` — Build output only

### Time and Date Awareness

- When same-level entities conflict, prefer **latest valid authority**
- Document timestamps vs git history — verify consistency
- Date conflict resolution is contextual, not absolute

---

## 10. Refactor / Consolidate / Migrate / Remove Framework

### Decision Rules

| Situation | Decision | Rationale |
|-----------|----------|-----------|
| Skill overlaps with GSD | **DON'T CREATE** | GSD is legitimate |
| Skill adds ceremony | **REFACTOR** or **REMOVE** | Ceremony = bad |
| Skill is bloated | **SHARD** into P1 + branches | Progressive disclosure |
| Skill is redundant with model knowledge | **REMOVE** | Waste of tokens |
| Skill conflicts with another | **CONSOLIDATE** or **ISOLATE** | Clear boundaries |

### Consolidation Criteria

When to consolidate multiple skills:
- They serve the same P1/P2/P3 role
- They have overlapping triggers
- They reference each other excessively

When to keep separate:
- Different P1/P2/P3 roles
- Different trigger conditions
- Different loading contexts

### Migration Path

For existing skills that need migration:
1. **Audit** — Run Skill-Judge evaluation
2. **Classify** — Keep / Refactor / Consolidate / Migrate / Remove
3. **Plan** — Write migration plan with TDD tests
4. **Execute** — Implement changes
5. **Validate** — Ensure no regression

---

## 11. Risks and Anti-Patterns

### What Must NOT Happen

| Anti-Pattern | Why It Fails |
|---------------|--------------|
| One giant master skill | Becomes bloated, ceremony-heavy |
| Duplicated pack roles | Confusion about which to load |
| Entry packs with mandatory ceremonies | Adds friction, not value |
| Specialist packs loaded by default | Wastes context window |
| Reference chains (A→B→C) | Breaks progressive disclosure |
| Brittle absolute paths | Fails across environments |
| Ignoring GSD framework | Reinvents wheel, causes conflicts |

### Examples of Bad Behavior This Plan Prevents

1. **Context-intelligence trying to be everything:**
   - Previous attempt had 6 references, L1-L4 layers
   - Now: Thin P1 router that just routes to branches

2. **Delegation as standalone P1:**
   - Should be P2 under context-intelligence
   - Now: Branch skill loaded when delegation detected

3. **No TDD validation:**
   - Skills written without failing tests first
   - Now: RED-GREEN-REFACTOR is NON-NEGOTIABLE

4. **Max stack violation:**
   - Loading 5+ skills at entry
   - Now: Max 3 at entry, P1 doesn't count if router

---

## 12. Recommended Next Actions

### Immediate (Before Writing Any Code)

1. **User reviews this plan** — Confirm understanding of P1/P2/P3 system
2. **Define first TDD test case** — What failing scenario does P1 router need to address?
3. **Sketch P1 router structure** — What does the thin SKILL.md look like?

### Phase 1: Context-Intelligence P1 Router

| Step | Task | Deliverable |
|------|------|-------------|
| 1.1 | Write TDD test for session type detection | Failing test prompt |
| 1.2 | Write thin P1 router SKILL.md | Routes to branches only |
| 1.3 | Write session-routing reference | Decision matrix |
| 1.4 | Validate with test | Test passes |

### Phase 2: Delegation Branch (P2)

| Step | Task | Deliverable |
|------|------|-------------|
| 2.1 | Write TDD test for delegation scenario | Failing test prompt |
| 2.2 | Write delegation branch SKILL.md | Scope rules, handoff format |
| 2.3 | Validate with test | Test passes |

### Phase 3: Workflow Branch (P2)

| Step | Task | Deliverable |
|------|------|-------------|
| 3.1 | Write TDD test for workflow scenario | Failing test prompt |
| 3.2 | Write workflow branch SKILL.md | Phase management |
| 3.3 | Validate with test | Test passes |

### Phase 4: Recovery Branch (P3)

| Step | Task | Deliverable |
|------|------|-------------|
| 4.1 | Write TDD test for recovery scenario | Failing test prompt |
| 4.2 | Write recovery branch SKILL.md | Rot detection, trust rebuild |
| 4.3 | Validate with test | Test passes |

### Phase 5: Integration

| Step | Task | Deliverable |
|------|------|-------------|
| 5.1 | Full stack test | ≤3 skills load |
| 5.2 | Skill-Judge evaluation | All skills ≥90% |
| 5.3 | GSD alignment check | GSD still works |
| 5.4 | User acceptance | User approves |

---

## Summary: What We Learned

| What I Did Wrong | What Should Happen |
|------------------|---------------------|
| Created bloated context-intelligence with 6 refs | P1 = thin router, branches are separate skills |
| Created delegation/workflow as standalone | They are P2 branches under P1 |
| Skipped TDD | RED-GREEN-REFACTOR is mandatory |
| Ignored degree of freedom | Only mandate where fragility requires |
| Added ceremony | Context defense should enable, not obstruct |

---

**Next:** Awaiting user review of this plan before proceeding to implementation.
