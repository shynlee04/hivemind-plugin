# Phase 09: Non-Breaking Skills Ecosystem - Research

**Researched:** 2026-03-19  
**Domain:** OpenCode Skills System Architecture + Context Intelligence Pack Design  
**Confidence:** HIGH

## Summary

Phase 09 addresses the design and implementation of a non-breaking skills ecosystem for HiveMind, comprising two packs: **Context Intelligence Pack** (Pack 1 - entry routing) and **Companion Pack** (Pack 2 - skill authoring/audit). The core insight is that previous attempts failed by making P1 skills too heavy (6 references, L1-L4 escalation) instead of thin routers that branch to P2/P3 specialist skills. The OpenCode skills system supports progressive disclosure with L1 (~100 tokens for metadata), L2 (~500 lines for SKILL.md body), and L3 (on-demand references/scripts). The 3-pattern model (P1: High-Level Routing, P2: Domain/Classification, P3: Specialist Depth) combined with session taxonomy (Fresh/Resumed/Delegated/Degraded/Interrupted/Recovered) and context rot defense provides the foundation for a robust, non-breaking skill architecture.

**Primary recommendation:** Build `context-intelligence` as a thin P1 router (~100 lines SKILL.md) that routes to P2/P3 branch skills based on session type detection. Fix `hivemind-skill-writer` by reducing to P1 only (remove broken reference and P2 content). Apply TDD workflow (RED-GREEN-REFACTOR) before writing any new skill.

---

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Context Intelligence Pack (Pack 1) MUST be the must-load entry
- Companion Pack (Pack 2) handles skill authoring, auditing, packaging
- 3-Pattern Model is the design system
- Session Taxonomy has 6 types (Fresh, Resumed, Delegated, Degraded, Interrupted, Recovered)
- Non-breaking, deterministic, incremental approach across width AND depth
- GSD = LEGITIMATE (`.opencode/get-shit-done/`, `gsd-*.md` agents)
- hive-* = POLLUTION (deprecated skills already moved to `_deprecated_hive/`)

### Claude's Discretion
- Specific implementation details of the thin P1 router
- Branch names and exact structure
- TDD test scenarios
- Stress test implementation

### Deferred Ideas (OUT OF SCOPE)
- Intent capture skill (future expansion)
- QA skills (future expansion)
- Cross-reference intelligence (future expansion)

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| OpenCode Skills Plugin | Latest | Skill discovery and loading | Official OpenCode plugin system |
| `hivemind-skill-writer` | 1.0.0 (broken) | Meta-builder for HiveMind skills | User-facing alias until naming frozen |
| `context-intelligence` | Planned | Pack 1 entry router | Must-load entry defense |
| `context-intelligence-delegation` | Planned | P2 delegation branch | Core delegation scenario |
| `context-intelligence-workflow` | Planned | P2 workflow branch | Core workflow scenario |
| `context-intelligence-recovery` | Planned | P3 recovery branch | Optional when degraded |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `agent-role-boundary` | Existing | Diamond role model enforcement | Role clarity needed |
| `platform-adapter` | Existing | Cross-platform mechanics mapping | Multi-platform support |
| `spec-distillation` | Existing | Requirements → structured specs | Noisy/contradictory requirements |
| `research-methodology` | Existing | Multi-source investigation | Research tasks |
| `ralph-tasking` | Existing | PRD JSON + beads graphs | Ralph-compatible output |
| `harness-architecture` | Existing | OpenCode SDK harness architecture | SDK decision making |

### OpenCode Skills System (Verified via Context7)
| Property | Specification | Source |
|----------|---------------|--------|
| L1 token budget | ~100 tokens (name + description) | Context7: opencode-skills |
| L2 content | SKILL.md body (~500 lines) | Context7: opencode-skills |
| L3 trigger | Explicit request | Context7: opencode-skills |
| Max entry stack | 3 skills | Architecture docs |
| Reference depth | 1 level only | Architecture docs |
| Description min | 20 characters | Context7: opencode-skills |
| Name format | kebab-case, alphanumeric + hyphens | Context7: opencode-skills |

**Installation:** Skills auto-discovered from `.opencode/skills/` directories. No explicit install needed.

---

## Architecture Patterns

### Recommended Project Structure

```
skills/
├── context-intelligence/              # P1 - Entry Pack (THIN)
│   ├── SKILL.md                      # ~100 lines, routes only
│   └── references/
│       └── 01-session-routing.md     # Decision matrix
│
├── context-intelligence-delegation/   # P2 - Branch
│   ├── SKILL.md                      # ~100-200 lines
│   └── references/
│       └── ...
│
├── context-intelligence-workflow/     # P2 - Branch
│   ├── SKILL.md
│   └── references/
│       └── ...
│
├── context-intelligence-recovery/     # P3 - Specialist
│   ├── SKILL.md
│   └── references/
│       └── ...
│
├── hivemind-skill-writer/            # Companion Pack - NEEDS FIX
│   ├── SKILL.md                      # Currently 218 lines, P1/P2 MISMATCH
│   └── references/
│       ├── 01-skill-anatomy.md       # 249 lines - P2 content
│       ├── 02-frontmatter-standard.md # 309 lines - P2 content
│       ├── 03-three-patterns.md       # 281 lines - P2 content
│       ├── 04-tdd-workflow.md         # 318 lines - P2 content
│       ├── 05-skill-quality-matrix.md # 339 lines - P2 content
│       ├── index.md                   # 114 lines - P2 content
│       └── [MISSING] 06-knowledge-delta.md # Referenced but doesn't exist
│
├── _deprecated_hive/                  # Deprecated skills (do not use)
│   ├── context-integrity/
│   ├── entry-resolution/
│   ├── delegation-framework/
│   ├── evidence-discipline/
│   ├── wrong-start-resolver/
│   ├── verification-methodology/
│   └── meta-builder-governance/
│
├── agent-role-boundary/              # Existing - Good structure
├── platform-adapter/                 # Existing - Good structure
├── spec-distillation/                # Existing - Good structure
├── research-methodology/             # Existing - Good structure
├── ralph-tasking/                   # Existing - Good structure
└── harness-architecture/            # Existing - Good structure
```

### Pattern 1: High-Level Routing (P1)

**What:** Thin SKILL.md (~100 lines) that routes to P2/P3 branches based on session type.

**When to use:** Every context-aware session start, after compaction, when delegation scope unclear, when context drift suspected.

**Shape:**
```markdown
---
name: context-intelligence
description: >
  Use when entering a session, after compaction, or when context state is unclear.
  Detects session type and routes to appropriate context branch.
  Keywords: fresh, resumed, delegated, degraded, interrupted, recovered, context
---

# Context Intelligence (P1 Router)

## Session Type Detection

Evaluate session state:

| Signal | Type Detected |
|--------|---------------|
| No prior state | FRESH |
| Prior state exists, recent | RESUMED |
| Explicit bounded scope | DELEGATED |
| Drift score low / context loss visible | DEGRADED |
| Partial actions exist | INTERRUPTED |
| State rebuilt after issue | RECOVERED |

## Routing Rules

- FRESH → broad entry, no deep branch
- RESUMED → check for stale context
- DELEGATED → load context-intelligence-delegation
- DEGRADED → load context-intelligence-recovery
- INTERRUPTED → load context-intelligence-workflow
- RECOVERED → verify state anchors, then proceed

## Always-Active Warnings

Context rot signals (watch for):
- Governance ambiguity: multiple surfaces competing
- Load pressure: auto-loaded mandatory surfaces
- Propagation breadth: inheritance of bad signals
- Freshness conflict: same-level entities disagree

## References

- `references/01-session-routing.md` — Full decision matrix
```

### Pattern 2: Domain/Classification (P2)

**What:** Mid-depth references, templates, bounded guidance for narrowed situations.

**When to use:** After P1 routes to delegation, workflow, or other domain.

**Shape:** ~100-200 lines SKILL.md + references for depth.

### Pattern 3: Specialist Depth (P3)

**What:** Expert-only knowledge for fragile situations.

**When to use:** When context degradation is severe, when specialist recovery is needed.

**Shape:** TOC + in-text jumps, strongly organized, constrained vertical depth.

### Anti-Patterns to Avoid

- **One giant master skill:** Becomes bloated, ceremony-heavy
- **P1 with P2 depth:** hivemind-skill-writer has 1828 lines of P2 content in P1
- **Reference chains:** A→B→C breaks progressive disclosure
- **Loading all references upfront:** Wastes context budget
- **Mandatory ceremonies:** Context defense should enable, not obstruct
- **Specialist packs loaded by default:** Only load P3 when severity warrants

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session type detection | Custom routing logic | P1 router pattern | Standardized detection matrix |
| Context rot defense | Custom "governance" skill | context-intelligence + branches | Proven non-breaking approach |
| Skill authoring | ad-hoc skill writing | hivemind-skill-writer + TDD | Skill-Judge metrics ensure quality |
| Cross-platform mapping | Platform-specific conditionals | platform-adapter skill | Conditional loading per platform |
| Delegation scope | Custom handoff format | context-intelligence-delegation | Standard scope rules + packet format |

**Key insight:** The 3-pattern model exists to prevent the "one giant skill" anti-pattern. Each pattern has a specific role: P1=routing, P2=narrowing, P3=specialist depth. Don't mix patterns.

---

## Common Pitfalls

### Pitfall 1: P1 Skill Bloating
**What goes wrong:** Skills like original `context-intelligence` tried to be everything (6 references, L1-L4 escalation).

**Why it happens:** Confusion between routing (P1) and doing (P2/P3).

**How to avoid:** P1 SKILL.md max ~100 lines. References only on demand.

**Warning signs:** SKILL.md >200 lines, more than 3 references in P1 skill.

### Pitfall 2: Reference Chain Breaking
**What goes wrong:** references/01.md references references/02.md, breaking 1-level depth rule.

**Why it happens:** Content sharded incorrectly, logical dependencies spanning files.

**How to avoid:** Use TOC + in-text jumps within a single file, not cross-file references.

**Warning signs:** Any reference file that says "see X reference" where X is another reference.

### Pitfall 3: Broken Reference in Skill
**What goes wrong:** SKILL.md references a file that doesn't exist (hivemind-skill-writer references missing 06-knowledge-delta.md).

**Why it happens:** Content removed but reference not updated.

**How to avoid:** Validate all references exist before shipping. Run broken-link checks.

**Warning signs:** Reference count mismatch, missing files in references/ directory.

### Pitfall 4: Max Stack Violation
**What goes wrong:** Loading 5+ skills at entry, exhausting context budget.

**Why it happens:** No discipline on stacking, every skill marked as "important".

**How to avoid:** Max 3 skills at entry. P1 router doesn't count if it's the routing mechanism.

**Warning signs:** Entry load >3 skills, context budget warnings.

### Pitfall 5: TDD Skipped
**What goes wrong:** Skills written without failing tests first, leading to mismatch between skill and actual needs.

**Why it happens:** Pressure to ship, assumption that skill "looks right" means it works.

**How to avoid:** RED-GREEN-REFACTOR is NON-NEGOTIABLE. Write failing test, write minimal skill, verify pass.

**Warning signs:** Skill exists without corresponding test scenario.

---

## Code Examples

### OpenCode SKILL.md Frontmatter (Verified via Context7)

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
---

# Skill Name

## Purpose
[What this skill does]

## When to Activate
[Triggers and conditions]

## Core Content
[Body ~100-500 lines]
```

### OpenCode Plugin Tool Registration Pattern (Verified via Context7)

```typescript
// From Context7: opencode-skills plugin
const tools: Record<string, any> = {}

for (const skill of skills) {
  tools[skill.toolName] = tool({
    description: skill.description,
    args: {},
    async execute(args, toolCtx) {
      const sendSilentPrompt = (text: string) =>
        ctx.client.session.prompt({
          path: { id: toolCtx.sessionID },
          body: {
            noReply: true,
            parts: [{ type: "text", text }],
          },
        })

      await sendSilentPrompt(`The "${skill.name}" skill is loading\n${skill.name}`)
      await sendSilentPrompt(`Base directory for this skill: ${skill.fullPath}\n\n${skill.content}`)

      return `Launching skill: ${skill.name}`
    }
  })
}
```

### Session Type Detection Matrix

```
Session Start
    │
    ├── NO prior state?
    │   └── Type: FRESH → Broad entry, no deep branch
    │
    ├── Prior state exists?
    │   ├── Recent (turns < 5)?
    │   │   └── Type: RESUMED → Check for stale context
    │   │
    │   └── Older / gap detected?
    │       └── Type: DELEGATED → Load delegation branch
    │
    ├── Explicit bounded scope?
    │   └── Type: DELEGATED → Load context-intelligence-delegation
    │
    ├── Drift signals visible?
    │   ├── Low drift score (< 50)?
    │   │   └── Type: DEGRADED → Load context-intelligence-recovery
    │   │
    │   └── Partial actions exist?
    │       └── Type: INTERRUPTED → Load context-intelligence-workflow
    │
    └── State rebuilt after issue?
        └── Type: RECOVERED → Verify anchors, then proceed
```

### Context Rot Detection Signals

```
CONTEXT ROT DIMENSIONS:

| Dimension | Detection Signal | Severity |
|-----------|-----------------|----------|
| Governance ambiguity | Multiple surfaces claim authority | HIGH |
| Deterministic enforcement | Wrong tests/scripts/hooks pushing bad behavior | HIGH |
| Load pressure | Auto-loaded mandatory surfaces detected | MEDIUM |
| Action enablement | Bad context triggering wrong writes | HIGH |
| Propagation breadth | Inheritance chain amplifying bad signals | MEDIUM |
| Freshness conflict | Same-level entities disagree, timestamps conflict | MEDIUM |
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Heavy P1 (6+ refs) | Thin P1 router (~100 lines) | 2026-03-19 | Non-blocking entry |
| L1-L4 escalation | 3-pattern model (P1/P2/P3) | 2026-03-19 | Clear boundaries |
| Mandatory ceremonies | Conditional loading | 2026-03-19 | Context budget preserved |
| P1/P2/P3 confusion | Explicit pattern labeling | 2026-03-19 | Correct skill selection |
| hivemind-* as legitimate | hivemind-* as pollution | 2026-03-19 | GSD is the standard |

**Deprecated/outdated:**
- `context-integrity` (moved to `_deprecated_hive/`) — Too heavy, L1-L4 escalation
- `entry-resolution` (moved to `_deprecated_hive/`) — 6-step ceremony instead of thin routing
- `delegation-framework` (moved to `_deprecated_hive/`) — Should be P2 branch, not standalone
- `evidence-discipline` (moved to `_deprecated_hive/`) — Ceremony, not enabling
- `wrong-start-resolver` (moved to `_deprecated_hive/`) — Duplicate functionality
- `verification-methodology` (moved to `_deprecated_hive/`) — Ceremony
- `meta-builder-governance` (moved to `_deprecated_hive/`) — Framework overlap

---

## Open Questions

1. **Token budget for P1 SKILL.md**
   - What we know: ~100 lines recommended, ~500 lines for L2
   - What's unclear: Actual token budget varies by model context window
   - Recommendation: Target <100 lines for P1, verify with actual context measurement

2. **Branch naming convention**
   - What we know: `context-intelligence-delegation`, `context-intelligence-workflow`, `context-intelligence-recovery`
   - What's unclear: Whether to use `context-intel-*` shorthand or full names
   - Recommendation: Keep full names for clarity; short aliases can be frontmatter tags

3. **hivemind-skill-writer fix approach**
   - What we know: 1828 lines total, broken reference to 06-knowledge-delta.md, P1/P2 mismatch
   - What's unclear: Whether to fix in place or create new skill
   - Recommendation: Option A (fix existing) per progress.md — remove broken ref, reduce to P1 routing only

4. **Stress test implementation**
   - What we know: SPEC-A through SPEC-F exist in STRESS-TEST.md, 4 waves defined
   - What's unclear: How to run automated tests vs manual scenarios
   - Recommendation: Start with Wave 1 (SPEC-A1-A4: Entry Point Integrity) as manual validation

5. **Evaluation scoring threshold**
   - What we know: 90%+ (108/120) for production-ready per eval-tracking.md
   - What's unclear: Whether current broken hivemind-skill-writer can be salvaged to this standard
   - Recommendation: Audit current state, likely needs complete rewrite vs fix

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Manual TDD + Skill-Judge scoring |
| Config file | None — skill validation is manual until automation added |
| Quick run command | `npx skills add <skill> && skill-judge` (when available) |
| Full suite command | Manual evaluation using 120-point rubric |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Validation Method | File Exists? |
|--------|----------|-----------|-------------------|---------------|
| REQ-09-01 | P1 router detects session type correctly | TDD RED | Write failing test prompt | N/A |
| REQ-09-02 | P1 router routes to correct branch | TDD RED | Write failing test prompt | N/A |
| REQ-09-03 | hivemind-skill-writer has <100 lines | Unit | Line count check | ✅ (218 lines - FAIL) |
| REQ-09-04 | hivemind-skill-writer has no broken refs | Unit | File existence check | ❌ (06-knowledge-delta missing) |
| REQ-09-05 | Entry stack ≤3 skills | Integration | Load sequence test | N/A |
| REQ-09-06 | Reference depth = 1 level | Unit | Path depth check | N/A |
| REQ-09-07 | SPEC-A1 Cold Start passes | Stress | Manual validation | N/A |
| REQ-09-08 | SPEC-A2 State Corruption Detection passes | Stress | Manual validation | N/A |
| REQ-09-09 | SPEC-B1 Taxonomy Conflict Resolution passes | Stress | Manual validation | N/A |
| REQ-09-10 | SPEC-C1 Drift Detection Activation passes | Stress | Manual validation | N/A |

### Sampling Rate
- **Per task commit:** Manual skill-judge scoring (108/120 threshold)
- **Per wave merge:** Full STRESS-TEST.md validation
- **Phase gate:** All REQ-09-XX tests pass

### Wave 0 Gaps
- [ ] `tests/skill-validation.test.ts` — Validates P1/P2/P3 boundaries
- [ ] `tests/hivemind-skill-writer-broken-refs.test.ts` — Checks for missing references
- [ ] `tests/stacking-compliance.test.ts` — Verifies max 3 skills at entry
- [ ] `tests/reference-depth.test.ts` — Validates 1-level reference horizon
- Framework install: `npx skills add` — if skills CLI available

---

## Skill Inventory

### Skills Status Summary

| Skill | Lines | Pattern | Status | Action Required |
|-------|-------|---------|--------|-----------------|
| `hivemind-skill-writer` | 218 (1828 total) | P1/P2 MISMATCH | BROKEN | Fix: reduce to P1 only, remove broken ref |
| `agent-role-boundary` | 99 | P1 | GOOD | Keep as-is |
| `platform-adapter` | 83 | P1 | GOOD | Keep as-is |
| `spec-distillation` | 87 | P1 | GOOD | Keep as-is |
| `research-methodology` | 69 | P1 | GOOD | Keep as-is |
| `ralph-tasking` | 87 | P1 | GOOD | Keep as-is |
| `harness-architecture` | 52 | P1 | GOOD | Keep as-is |
| `context-integrity` | 129 | N/A | DEPRECATED | In `_deprecated_hive/` |
| `entry-resolution` | 147 | N/A | DEPRECATED | In `_deprecated_hive/` |
| `delegation-framework` | N/A | N/A | DEPRECATED | In `_deprecated_hive/` |
| `evidence-discipline` | N/A | N/A | DEPRECATED | In `_deprecated_hive/` |
| `wrong-start-resolver` | N/A | N/A | DEPRECATED | In `_deprecated_hive/` |
| `verification-methodology` | N/A | N/A | DEPRECATED | In `_deprecated_hive/` |
| `meta-builder-governance` | N/A | N/A | DEPRECATED | In `_deprecated_hive/` |

### Skills to Create

| Skill | Pattern | Purpose | Priority |
|-------|---------|---------|----------|
| `context-intelligence` | P1 | Thin router for session type detection | M1 - CRITICAL |
| `context-intelligence-delegation` | P2 | Delegation scope rules, handoff packets | M2 |
| `context-intelligence-workflow` | P2 | Phase management, transition gates | M3 |
| `context-intelligence-recovery` | P3 | Context rot detection, trust rebuilding | M4 (optional) |

### Skills to Fix

| Skill | Issue | Fix Approach |
|-------|-------|--------------|
| `hivemind-skill-writer` | P1/P2 mismatch (218 lines in SKILL.md, 1828 total), broken reference to 06-knowledge-delta.md | Option A: Fix as P1+P2 hybrid — reduce SKILL.md to <100 lines, keep essential references only, add cross-skill paths |

---

## Stress Test Alignment

### SPEC Categories and Skill Coverage

| Category | Specifications | Skill Coverage | Validation Method |
|----------|---------------|---------------|-------------------|
| **A: Entry Point Integrity** | A1 Cold Start, A2 State Corruption, A3 Orphaned Session, A4 Ambiguous Intent | `context-intelligence` (P1 router) | Manual per STRESS-TEST.md |
| **B: Classification & Routing** | B1 Taxonomy Conflict, B2 Keyword Gaming, B3 Novel Intent | `context-intelligence` + branches | Manual per STRESS-TEST.md |
| **C: Context Integrity** | C1 Drift Detection, C2 Post-Compaction Recovery, C3 Stale Context, C4 Cross-Domain Isolation | `context-intelligence-recovery` (P3) | Manual per STRESS-TEST.md |
| **D: Orchestration & Execution** | D1 Workflow Chain, D2 Wave-Based, D3 Safety Guards, D4 Delegation Packets, D5 Parallel/Sequential, D6 Handoff Evidence | `context-intelligence-workflow` (P2) | Manual per STRESS-TEST.md |
| **E: Session Continuity** | E1 Session Persistence, E2 Concurrent Sessions, E3 Dependency Management | Framework-level | Manual per STRESS-TEST.md |
| **F: Phase & Boundary** | F1 Planning-Implementation, F2 Phase Context Injection | `context-intelligence-workflow` (P2) | Manual per STRESS-TEST.md |

### Stress Test Waves (from STRESS-TEST.md)

```
WAVE 1: Foundational Survival (Entry Point Tests)
├── SPEC-A1: Cold Start Detection — BLOCKER
├── SPEC-A2: State Corruption Detection — BLOCKER
├── SPEC-A3: Orphaned Session Detection — HIGH
└── SPEC-A4: Ambiguous Intent Resolution — HIGH
Pass Criteria: System can bootstrap fresh and recover from corruption

WAVE 2: Classification & Routing (Core Function Tests)
├── SPEC-B1: Taxonomy Conflict Resolution — P0
├── SPEC-B2: Keyword Gaming Resistance — P1
├── SPEC-B3: Novel Intent Handling — P0
├── SPEC-C1: Drift Detection — P0
└── SPEC-C2: Post-Compaction Recovery — P0
Pass Criteria: Classification produces consistent, defensible routing

WAVE 3: Orchestration Stress (Complex Workflow Tests)
├── SPEC-D1: Workflow Chain Execution — P0
├── SPEC-D2: Wave-Based Execution — P0
├── SPEC-D3: Safety Guard Enforcement — P0
├── SPEC-D4: Delegation Packet Execution — P1
└── SPEC-F1: Planning-Implementation Boundary — P1
Pass Criteria: Complex workflows execute correctly with safety enforcement

WAVE 4: Continuity & Quality (Trust Tests)
├── SPEC-E1: Session Persistence — P0
├── SPEC-E2: Multiple Concurrent Sessions — P1
├── SPEC-E3: Session Dependency Management — P1
├── SPEC-D6: Handoff Evidence Validation — P0
├── SPEC-C3: Stale Context Detection — P0
├── SPEC-G1: Attachment Processing — P1
└── SPEC-G2: Token Budget Enforcement — P1
Pass Criteria: Sessions persist correctly; evidence validated; quality gates enforced
```

---

## Milestone Plan

### Milestone 1: P1 Router for context-intelligence
| Task | Deliverable | Validation |
|------|-------------|------------|
| M1.1: Write TDD test for session type detection | Failing test prompt | Test fails without skill |
| M1.2: Write thin P1 router SKILL.md (~100 lines) | Routes to branches only | Lines <100 |
| M1.3: Write session-routing reference | Decision matrix | File exists |
| M1.4: Validate with test | Test passes | TDD GREEN |

### Milestone 2: Delegation Branch (P2)
| Task | Deliverable | Validation |
|------|-------------|------------|
| M2.1: Write TDD test for delegation scenario | Failing test prompt | Test fails without skill |
| M2.2: Write delegation branch SKILL.md | Scope rules, handoff format | Lines <200 |
| M2.3: Validate with test | Test passes | TDD GREEN |

### Milestone 3: Workflow Branch (P2)
| Task | Deliverable | Validation |
|------|-------------|------------|
| M3.1: Write TDD test for workflow scenario | Failing test prompt | Test fails without skill |
| M3.2: Write workflow branch SKILL.md | Phase management | Lines <200 |
| M3.3: Validate with test | Test passes | TDD GREEN |

### Milestone 4: Recovery Branch (P3)
| Task | Deliverable | Validation |
|------|-------------|------------|
| M4.1: Write TDD test for recovery scenario | Failing test prompt | Test fails without skill |
| M4.2: Write recovery branch SKILL.md | Rot detection, trust rebuild | Lines <300 |
| M4.3: Validate with test | Test passes | TDD GREEN |

### Milestone 5: Integration & Audit
| Task | Deliverable | Validation |
|------|-------------|------------|
| M5.1: Full stack test | ≤3 skills load | Manual verification |
| M5.2: Skill-Judge evaluation | All skills ≥90% (108/120) | Scoring rubric |
| M5.3: GSD alignment check | GSD still works | Regression test |
| M5.4: Stress test validation | SPEC-A through SPEC-F pass | Manual per waves |

### Dependency Chain
```
M1 (P1 router) → M2 (Delegation) → M3 (Workflow) → M4 (Recovery) → M5 (Integration)
     ↓               ↓                  ↓                  ↓
  Standalone    Depends on M1      Depends on M1      Depends on M1
```

---

## Evaluation Rubric

### Skill-Judge Quality Metrics (120 points)

| Dimension | Max | Focus | What Good Looks Like |
|-----------|-----|-------|---------------------|
| D1: Knowledge Delta | 20 | Expert knowledge not in model | Gap between skill and model knowledge is clear |
| D2: Mindset + Procedures | 15 | Thinking patterns + domain workflows | Mental models explicitly stated |
| D3: Anti-Pattern Quality | 15 | Specific NEVER lists with WHY | Anti-patterns have root cause explained |
| D4: Spec Compliance | 15 | Description = WHAT + WHEN + KEYWORDS | Description triggers correctly |
| D5: Progressive Disclosure | 15 | Layering with triggers | L1 → L2 → L3 on demand |
| D6: Freedom Calibration | 15 | Match specificity to fragility | HIGH/MEDIUM/LOW matches task type |
| D7: Pattern Recognition | 10 | Follows established pattern | P1/P2/P3 role is clear |
| D8: Practical Usability | 15 | Decision trees, fallbacks, edge cases | Can use without clarification |

### Scoring Thresholds

| Grade | Percentage | Points | Action |
|-------|------------|--------|--------|
| A | 90%+ | 108+ | Production-ready |
| B | 80-89% | 96-107 | Minor improvements |
| C | 70-79% | 84-95 | Clear improvement path |
| D | 60-69% | 72-83 | Significant issues |
| F | <60% | <72 | Fundamental redesign needed |

### Pack-Level Evaluation

| Metric | Target | Measurement |
|--------|--------|-------------|
| Entry stack count | ≤3 skills | Manual count at entry |
| P1 SKILL.md lines | <100 lines | Line count |
| Reference depth | 1 level only | Path inspection |
| Broken references | 0 | File existence check |
| Stress test pass rate | ≥80% per wave | Manual per STRESS-TEST.md |
| Skill-Judge average | ≥90% | Scoring rubric |

---

## Sources

### Primary (HIGH confidence)
- Context7: `/malhashemi/opencode-skills` — OpenCode skills plugin, progressive disclosure, L1/L2/L3 layers
- `docs/skill-revamp/architecture.md` — 3-pattern model, session taxonomy, pack boundary
- `docs/skill-revamp/MASTER-PLAN.md` — Full implementation plan with milestones
- `docs/testing/STRESS-TEST.md` — SPEC-A through SPEC-F stress test matrix

### Secondary (MEDIUM confidence)
- `docs/skill-revamp/progress.md` — hivemind-skill-writer audit findings (1828 lines, broken ref)
- `docs/skill-revamp/eval-tracking.md` — Evaluation rubric (100 points)
- `docs/skill-revamp/index.md` — Skill revamp status

### Tertiary (LOW confidence)
- Source files in `skills/_deprecated_hive/` — For understanding what NOT to do
- User notes in `docs/draft-notes/setting-the-theme.md` — Needs verification against actual skill behavior

---

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — Verified via Context7 official docs, architecture docs match
- Architecture: HIGH — 3-pattern model proven in MASTER-PLAN, implementation guidance clear
- Pitfalls: HIGH — All pitfalls documented with prevention strategies from lessons learned
- Stress Test Alignment: MEDIUM — SPEC matrix exists, manual validation required
- Evaluation Rubric: HIGH — 120-point system from Skill-Judge, targets clear

**Research date:** 2026-03-19  
**Valid until:** 2026-04-18 (30 days for stable architecture, 7 days for fast-moving if significant changes)

**Key findings from audit:**
1. `hivemind-skill-writer` is BROKEN (1828 lines, P1/P2 mismatch, missing 06-knowledge-delta.md)
2. 7 deprecated skills moved to `_deprecated_hive/` — do not use
3. 6 existing skills (`agent-role-boundary`, `platform-adapter`, `spec-distillation`, `research-methodology`, `ralph-tasking`, `harness-architecture`) are well-structured — keep as-is
4. P1 router (`context-intelligence`) needs to be built from scratch as thin router (~100 lines)
5. TDD workflow (RED-GREEN-REFACTOR) is NON-NEGOTIABLE before writing any new skill

**Next steps for planner:**
1. Create thin P1 router for `context-intelligence` per M1
2. Fix `hivemind-skill-writer` per progress.md Option A
3. Build P2/P3 branches incrementally per milestones
4. Validate all stress tests per STRESS-TEST.md
