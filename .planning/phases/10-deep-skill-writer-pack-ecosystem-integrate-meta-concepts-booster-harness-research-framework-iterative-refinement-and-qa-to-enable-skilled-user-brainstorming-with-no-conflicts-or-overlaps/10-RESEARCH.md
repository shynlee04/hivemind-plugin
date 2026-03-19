# Phase 10: Deep-skill-writer-pack Ecosystem - Research

**Researched:** 2026-03-19
**Domain:** Skill-pack ecosystem architecture, TDD methodology for skills, meta-concept integration
**Confidence:** HIGH (verified against multiple authoritative sources)

## Summary

Phase 10 focuses on evolving the `hivemind-skill-writer` pack into a complete ecosystem that enables skilled users to author, audit, and iterate on skills with zero conflicts or overlaps. This requires integrating three critical meta-concepts: booster/harness patterns for agent intelligence augmentation, TDD methodology specifically adapted for skill authoring, and self-improving agent patterns for continuous skill quality enhancement.

The research reveals that HiveMind already has foundational elements in place (`hivemind-skill-writer` P1 router skill, the three-pattern system, TDD workflow references, and Skill-Judge evaluation matrix). The challenge is completing the ecosystem with proper integration points, no-load rules, and recursive quality improvement loops.

**Primary recommendation:** Build the Phase 10 ecosystem as an **extension mechanism** to the existing `hivemind-skill-writer` P1 router, adding iterative refinement loops, conflict detection, and skill quality metrics while maintaining the stacking budget of 3 skills maximum.

---

## User Constraints

Copied from implicit requirements in ROADMAP Phase 10:
- **Goal:** Integrate meta-concepts (booster/harness), research framework, iterative refinement, and QA to enable skilled user brainstorming with no conflicts or overlaps
- **Dependencies:** Phase 9 must complete first (context-intelligence ecosystem operational)
- **Constraint:** Must remain non-breaking to existing workflows and skill loads

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PH10-01 | Integrate booster/harness meta-concepts into skill architecture | See "Booster/Harness Meta-Concepts" section |
| PH10-02 | Implement TDD methodology for skill authoring | See "Writing-Skills TDD Methodology" section |
| PH10-03 | Add iterative refinement loops for skill quality | See "Self-Improving Agent Pattern" section |
| PH10-04 | Enable skilled user brainstorming without conflicts | See "Conflict Detection Patterns" section |
| PH10-05 | Complete QA evaluation harness | See "Skill-Judge Evaluation System" section |

---

## Standard Stack

### Core Technologies

| Library/Pattern | Version | Purpose | Why Standard |
|-----------------|---------|---------|--------------|
| `hivemind-skill-writer` | 1.0.0 | P1 routing skill for skill authoring | Already deployed, stable P1 pattern |
| Three-Pattern System | 1.0.0 | P1/P2/P3 depth classification | Proven architecture for skill depth |
| `writing-skills` | superpowers | TDD methodology for skill creation | RED-GREEN-REFACTOR adapted for documentation |
| `self-improving-agent` | .roo/.qwen reference | Continuous learning from feedback | Hooks-based self-correction pattern |

### Supporting Patterns

| Pattern | Purpose | When to Use |
|----------|---------|-------------|
| Booster/Harness | Augment agent intelligence non-breakingly | When skills need to enhance without conflict |
| NO-LOAD Rules | Prevent skill activation in wrong contexts | Entry skill decision logic |
| Knowledge Delta | Expert-only knowledge over redundant content | Skill content optimization |
| Stacking Discipline | Max 3 skills loaded per turn | Context budget management |

### Integration Points

| From | To | Connection Type |
|------|-----|-----------------|
| `context-intelligence` | `hivemind-skill-writer` | Entry state check, trust threshold |
| `hivemind-skill-writer` | Skill-Judge evaluation | Quality scoring integration |
| `writing-skills` TDD | Skill creation workflow | Baseline → GREEN validation |
| `self-improving-agent` hooks | Skill evolution | Post-complete pattern extraction |

---

## Architecture Patterns

### Pattern 1: Booster/Harness Meta-Concepts

**What:** Light meta-concepts that augment agent intelligence without hard-state architectures (stateless handoffs, progressive disclosure, context awareness).

**When to use:** When skills need to enhance agent capabilities without:
- Adding governance burden
- Creating framework collision
- Breaking existing tool flows

**Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│                    SKILL-WRITER ECOSYSTEM                       │
├─────────────────────────────────────────────────────────────┤
│                                                                │
│   Entry: context-intelligence (P1)                            │
│       │                                                        │
│       ├── context-intelligence checks:                         │
│       │   • Session state (fresh/resumed/delegated/degraded)   │
│       │   • Trust score (minimum threshold)                    │
│       │   • Stack budget (≤3skills)                            │
│       │   • Entry state validity                               │
│       │                                                        │
│       └── If pass → hivemind-skill-writer (P1)                │
│              │                                                 │
│              ├── Task detection:                               │
│              │   • create skill → anatomy + patterns          │
│              │   • audit skill → quality matrix               │
│              │   • refactor skill → TDD workflow               │
│              │   • package skill → agent activation           │
│              │                                                 │
│              └── If cross-pack → spawn subagent                │
│                                                                │
│   Booster Layer (non-breaking):                               │
│       • context-intelligence (1 slot)                          │
│       • hivemind-skill-writer (0 slots - meta skill)          │
│       • Available: 2 more slots                               │
│                                                                │
└─────────────────────────────────────────────────────────────┘
```

**Key insight:** The "booster" concept comes from `.planning/skill-module/progress.md` line 100: "non-breaking harness boosting for agent intelligence". This means skills that augment without creating governance conflict or overlapping with existing packs.

### Pattern 2: Writing-Skills TDD Methodology

**What:** Test-driven development methodology specifically adapted for skill documentation quality.

**When to use:** ALL skill creation and modification - mandatory workflow.

**RED-GREEN-REFACTOR for Skills:**

```markdown
## RED Phase - Capture Failing Scenario

**Question:** What specific scenario does NOT work without this skill?

Format:
```markdown
## Failing Scenario: [Name]

### Input
[What triggers the scenario]

### Expected Behavior
[What should happen]

### Without Skill
[What actually happens - THE FAILURE]

### Evidence
[How to verify this fails]
```

Run baseline WITHOUT skill:
1. Clear any skill loading
2. Execute the test prompt
3. Observe and document the exact failure
4. Capture evidence (output, errors, behavior)

## GREEN Phase - Write Minimal Skill

Address ONLY the failure scenario. Do not add features.

Checklist:
- [ ] Does this address the failing scenario?
- [ ] Is this the minimum needed?
- [ ] Does this introduce ceremony?
- [ ] Does this conflict with existing skills?

## REFACTOR Phase - Close Loopholes

- Remove duplication with existing skills
- Tighten trigger descriptions
- Validate structure (reference depth=1, stacking≤3, frontmatter complete)
- Run Skill-Judge evaluation
```

**Source:** Verified against `writing-skills` superpowers skill (User-level skill with TDD adaptation)

### Pattern 3: Self-Improving Agent Integration

**What:** Hooks-based self-correction pattern that learns from skill experience.

**When to use:** Post-skill-completion evolution, continuous quality improvement.

**Architecture (from `.roo/skills/self-improving-agent/SKILL.md`):**

```
┌─────────────────────────────────────────────────────────────┐
│                    SELF-IMPROVEMENT LOOP                       │
├─────────────────────────────────────────────────────────────┤
│                                                                │
│   Skill Event → Extract Experience → Abstract Pattern → Update│
│        │                  │                │         │          │
│        ▼                  ▼                ▼         ▼          │
│   ┌─────────────────────────────────────────────────────┐      │
│   │              MULTI-MEMORY SYSTEM                     │      │
│   ├─────────────────────────────────────────────────────┤      │
│   │  Semantic Memory   │  Episodic Memory  │ Working Memory│   │
│   │  (Patterns/Rules)  │  (Experiences)    │  (Current)     │   │
│   └─────────────────────────────────────────────────────┘      │
│                                                                │
│   ┌─────────────────────────────────────────────────────┐      │
│   │              FEEDBACK LOOP                            │      │
│   │  User Feedback → Confidence Update → Pattern Adapt   │      │
│   └─────────────────────────────────────────────────────┘      │
│                                                                │
└─────────────────────────────────────────────────────────────┘
```

**Integration with hivemind-skill-writer:**

| Hook | When | Action |
|------|------|--------|
| `before_skill_audit` | Pre-audit | Log session context, validate skill structure |
| `after_skill_create` | Post-create | Extract pattern, update semantic memory |
| `on_validation_fail` | Skill-Judge <3.5 | Trigger refinement loop |

### Pattern 4: NO-LOAD Rules and FAIL Signals

**What:** Critical decision logic for when to NOT activate a skill.

**When to use:** Entry skills (P1) must decide NOT to activate in many cases.

**NO-LOAD Rules (from `hivemind-skill-writer/SKILL.md`):**

```markdown
## NO-LOAD Rules (Critical)

A P1 router must often decide NOT to activate. This is a success case, not a miss.

**DO NOT activate when:**
- Context depth exceeds 70% — skill operations will exhaust remaining context
- Session state is "degraded" or "interrupted" — defer to context-rot-recovery first
- Task is trivial (e.g., "fix typo in skill") — no specialist depth needed
- Another hivemind-skill-writer instance is already running — prevent duplicate activation
- Stack budget is exhausted (3 skills already loaded) — wait for slot

**FAIL signals — stop immediately when:**
- Entry state is "unknown" — cannot safely route without context-intelligence
- Trust score below threshold — skill work may cause harm
- Context rot severity ≥ 7 — degradation will corrupt skill output
- Cross-framework conflict detected — .claude/.codex collision without clear authority
```

**Implementation:** These rules prevent harmful skill activation and must be implemented in the P1 routing logic of `context-intelligence` before delegating to `hivemind-skill-writer`.

### Pattern 5: Knowledge Delta Principle

**What:** The core formula for skill content optimization.

**Formula:**
```
Good Skill = Expert-only Knowledge − What Claude Already Knows
```

| Knowledge Type | Definition | Treatment |
|----------------|------------|-----------|
| **Expert** | Claude genuinely doesn't know this | MUST keep — this is the Skill's value |
| **Activation** | Claude knows but may not think of | Keep if brief — serves as reminder |
| **Redundant** | Claude definitely knows this | DELETE — wastes tokens |

**Anti-patterns:**

```markdown
## NEVER Do

- **NEVER** explain what Claude already knows ("what is X", "how to write a for-loop")
- **NEVER** give high scores for well-formatted but redundant content
- **NEVER** let length impress you — a 50-line Skill can outperform 500-line
- **NEVER** forgive vague descriptions — poor description = skill never triggers
- **NEVER** put "when to use" only in body — description is what Agent sees first
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|--------------|-----|
| Skill creation TDD workflow | Custom baseline testing | `writing-skills` superpowers | Already validated methodology |
| Quality scoring | Hand-coded evaluation matrix | Skill-Judge dimensions (120-point system) | Established 5-dimension framework |
| Pattern classification | Ad-hoc P1/P2/P3 definitions | Three-pattern system from `hivemind-skill-writer` | Proven depth classification |
| Self-improvement hooks | Custom hook system | `self-improving-agent` hook patterns | Already architected multi-memory system |
| Conflict detection | Manual overlap checking | Context-intelligence entry checks | Prevents stack overflow |

---

## Common Pitfalls

### Pitfall 1: The Giant Skill Anti-Pattern

**What goes wrong:** Creating one giant master skill that tries to own every pack, branch, and specialist path.

**Why it happens:** Natural temptation to centralize all skill knowledge in one place.

**How to avoid:** Use the three-pattern system strictly:
- P1 = High-level routing only (<200 lines)
- P2 = Domain-specific (200-500 lines)
- P3 = Expertise depth (>500 lines OR heavy references)

**Warning signs:**
- SKILL.md exceeding 500 lines without being P3
- Multiple P2 concepts merged into one skill
- Routing logic in P2/P3 skills

### Pitfall 2: Ceremony Creep

**What goes wrong:** Skills add workflow friction that makes users avoid loading them.

**Why it happens:** Over-engineering validation and setup steps.

**How to avoid:** Follow the P1 principle from `hivemind-skill-writer`:
- Entry pack stays load-attractive and load-cheap
- If it becomes too ceremonial, users will avoid it

**Warning signs:**
- More than 3 mandatory steps before skill activation
- Required configuration before skill can work
- Essential features hidden behind setup

### Pitfall 3: Redundant Knowledge

**What goes wrong:** Skill content duplicates what Claude already knows.

**Why it happens:** Authors write comprehensive documentation without considering knowledge delta.

**How to avoid:** Apply the Knowledge Delta test:
1. Ask: "Does Claude genuinely not know this?"
2. If Claude might know it: keep brief or delete
3. If Claude definitely knows it: delete immediately

**Warning signs:**
- Explaining basic concepts (for-loops, function definitions)
- Well-formatted but content-free sections
- Length that doesn't add unique value

### Pitfall 4: Cross-Framework Authority Confusion

**What goes wrong:** Skills from different frameworks (.claude, .cursor, .opencode) conflict and create governance pollution.

**Why it happens:** Skills copy/pasted across frameworks without adaptation.

**How to avoid:** Implement the cross-framework surface model from `architecture.md`:
- `.opencode` = Primary local ecosystem (not sole authority)
- Other framework surfaces = Detect as variants and compatibility surfaces
- Generated/runtime surfaces = Not direct authoring authority

**Warning signs:**
- Skills referencing framework-specific paths without detection
- Authority claims without freshness/validity checks
- Multiple surfaces claiming same authority

### Pitfall 5: Stacking Violation

**What goes wrong:** Loading more than 3 skills at entry, exhausting context budget.

**Why it happens:** Not tracking stacking discipline across packs.

**How to avoid:** Implement stack counting:
```
context-intelligence (1) — always
hivemind-skill-writer (0) — meta skill, doesn't count
Available: 2 more slots for specialist skills
```

**Warning signs:**
- More than 3 skills loaded at session start
- Context depth exceeding 70% before skill operations
- Skills calling other skills without stack awareness

---

## Code Examples

### P1 Routing Logic (Verified)

```typescript
// Source: hivemind-skill-writer/SKILL.md routing logic

/**
 * P1 Router Decision Tree
 * Must implement NO-LOAD checks before activation
 */

function shouldActivateHivemindSkillWriter(
  context: SessionContext,
  task: DetectedTask
): { activate: boolean; reason: string } {
  
  // NO-LOAD Rule 1: Context budget check
  if (context.depthPercent > 70) {
    return { activate: false, reason: 'context_exhausted' };
  }
  
  // NO-LOAD Rule 2: Session state check
  if (context.state === 'degraded' || context.state === 'interrupted') {
    return { activate: false, reason: 'defer_to_recovery' };
  }
  
  // NO-LOAD Rule 3: Stack budget check
  const currentStack = context.loadedSkills.filter(s => s.stacking > 0);
  if (currentStack.length >= 3) {
    return { activate: false, reason: 'stack_limit_reached' };
  }
  
  // NO-LOAD Rule 4: Trivial task check
  if (task.complexity === 'trivial') {
    return { activate: false, reason: 'no_specialist_needed' };
  }
  
  // NO-LOAD Rule 5: Trust threshold check
  if (context.trustScore < MINIMUM_TRUST_THRESHOLD) {
    return { activate: false, reason: 'trust_below_threshold' };
  }
  
  // FAIL Signal: Entry state unknown
  if (context.entryState === 'unknown') {
    return { activate: false, reason: 'cannot_route_without_ci' };
  }
  
  // FAIL Signal: Context rot severity
  if (context.rotSeverity >= 7) {
    return { activate: false, reason: 'rot_will_corrupt_output' };
  }
  
  // All checks passed
  return { activate: true, reason: 'valid_activation' };
}
```

### Skill-Judge Evaluation (Verified)

```typescript
// Source: hivemind-skill-writer/references/05-skill-quality-matrix.md

/**
 * 120-point evaluation system across 5 dimensions
 */

interface SkillJudgeScores {
  triggerAccuracy: number;      // 25% weight (0-5 scale)
  actionCoherence: number;      // 25% weight (0-5 scale)
  referenceIntegrity: number;  // 20% weight (0-5 scale)
  nonRedundancy: number;        // 15% weight (0-5 scale)
  edgeCaseCoverage: number;     // 15% weight (0-5 scale)
}

function calculateOverallScore(scores: SkillJudgeScores): number {
  return (
    scores.triggerAccuracy * 0.25 +
    scores.actionCoherence * 0.25 +
    scores.referenceIntegrity * 0.20 +
    scores.nonRedundancy * 0.15 +
    scores.edgeCaseCoverage * 0.15
  );
}

function getGrade(score: number): 'EXCELLENT' | 'GOOD' | 'ACCEPTABLE' | 'NEEDS_WORK' {
  if (score >= 4.5) return 'EXCELLENT';
  if (score >= 4.0) return 'GOOD';
  if (score >= 3.0) return 'ACCEPTABLE';
  return 'NEEDS_WORK';
}

// Release criteria: All must be met
const RELEASE_CRITERIA = {
  overallScore: { min: 3.5, weight: 'primary' },
  triggerAccuracy: { min: 3.0, weight: 'required' },
  actionCoherence: { min: 4.0, weight: 'required' },
  referenceIntegrity: { min: 3.0, weight: 'required' },
  nonRedundancy: { min: 3.0, weight: 'required' },
  edgeCaseCoverage: { min: 3.0, weight: 'required' }
};
```

### TDD Workflow for Skills (Verified)

```markdown
<!-- Source: writing-skills superpowers skill -->

## TDD Cycle for Skills

### RED Phase
1. Create pressure scenarios (3+ combined pressures for discipline skills)
2. Run scenarios WITHOUT skill - document baseline behavior verbatim
3. Identify patterns in rationalizations/failures
4. Capture failure evidence

### GREEN Phase
1. Name uses only letters, numbers, hyphens
2. YAML frontmatter with name and description (max 1024 chars)
3. Description starts with "Use when..."
4. Keywords for searchability
5. Address specific baseline failures
6. Run scenarios WITH skill - verify compliance

### REFACTOR Phase
1. Identify NEW rationalizations
2. Add explicit counters for discipline skills
3. Build rationalization table
4. Create red flags list
5. Re-test until bulletproof
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single giant governance skill | Three-pattern system (P1/P2/P3) | 2026-03 | Reduces context burden, enables specialist loading |
| Ad-hoc skill quality | Skill-Judge 120-point matrix | 2026-03 | Enables objective quality scoring |
| Implicit knowledge (assumed) | Knowledge Delta principle | 2026-03 | Removes redundant content from skills |
| Manual skill testing | Writing-Skills TDD methodology | superpowers | Baseline→GREEN validation mandatory |
| Static skill content | Self-improving agent hooks | .roo/.qwen | Continuous pattern extraction and evolution |

**Deprecated/outdated:**
- Narrative skill documentation (no TDD validated)
- Skills without NO-LOAD rules (harmful activation risk)
- P1 skills >200 lines (not thin enough)
- Skills with >1 level reference depth (navigation complexity)

---

## Open Questions

1. **Cross-Pack Coordination Protocol**
   - What we know: P1 skills stack up to 3, context-intelligence integrates with all packs
   - What's unclear: Exact handoff protocol between `hivemind-skill-writer` and specialist P3 packs
   - Recommendation: Define explicit subagent spawn decision tree in agent activation matrix

2. **Self-Improvement Loop Frequency**
   - What we know: Hooks can trigger on skill completion/error
   - What's unclear: Optimal frequency for pattern extraction without context pollution
   - Recommendation: Implement confidence threshold (only extract patterns with confidence >0.8)

3. **Conflict Detection Automation**
   - What we know: Skill-Judge evaluates non-redundancy dimension
   - What's unclear: Real-time conflict detection during brainstorming sessions
   - Recommendation: Build cross-pack overlap matrix into `context-intelligence` entry checks

4. **Brainstorm Session Integration**
   - What we know: Phase 10 enables "skilled user brainstorming"
   - What's unclear: How brainstorming triggers skill loading vs. remaining skill-agnostic
   - Recommendation: Define explicit brainstorm signal detection in `hivemind-skill-writer` routing

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (project uses Node/Bun stack) |
| Config file | `vitest.config.ts` |
| Quick run command | `npm test -- --reporter=verbose` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PH10-01 | Booster/harness integration | unit | `vitest run tests/skill-writer/booster-harness.test.ts` | ❌ Wave 0 |
| PH10-02 | TDD workflow validation | integration | `vitest run tests/skill-writer/tdd-workflow.test.ts` | ❌ Wave 0 |
| PH10-03 | Iterative refinement loop | unit | `vitest run tests/skill-writer/refinement-loop.test.ts` | ❌ Wave 0 |
| PH10-04 | Conflict detection | unit | `vitest run tests/skill-writer/conflict-detection.test.ts` | ❌ Wave 0 |
| PH10-05 | Skill-Judge evaluation | unit | `vitest run tests/skill-writer/skill-judge.test.ts` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm test -- --reporter=verbose`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `tests/skill-writer/booster-harness.test.ts` — covers PH10-01
- [ ] `tests/skill-writer/tdd-workflow.test.ts` — covers PH10-02
- [ ] `tests/skill-writer/refinement-loop.test.ts` — covers PH10-03
- [ ] `tests/skill-writer/conflict-detection.test.ts` — covers PH10-04
- [ ] `tests/skill-writer/skill-judge.test.ts` — covers PH10-05
- [ ] `vitest.config.ts` — shared test config(verify existing)

---

## Sources

### Primary (HIGH confidence)

- `opencode/skills/hivemind-skill-writer/SKILL.md` — Core P1 router skill (verified 2026-03-19)
- `opencode/skills/hivemind-skill-writer/references/03-three-patterns.md` — Pattern classification system
- `opencode/skills/hivemind-skill-writer/references/04-tdd-workflow.md` — RED-GREEN-REFACTOR for skills
- `opencode/skills/hivemind-skill-writer/references/05-skill-quality-matrix.md` — Skill-Judge 120-point system
- `opencode/skills/hivemind-skill-writer/references/06-agent-activation.md` — Subagent command patterns
- `superpowers/writing-skills/SKILL.md` — TDD methodology for skill authoring
- `superpowers/test-driven-development/SKILL.md` — Core TDD cycle validation

### Secondary (MEDIUM confidence)

- `.planning/skill-module/architecture.md` — Three-pattern pack model (verified 2026-03-19)
- `.planning/skill-module/progress.md` — Cycle and packet tracking
- `.planning/skill-module/index.md` — Planning branch navigation
- `skills/harness-architecture/SKILL.md` — Booster/harness meta-concepts
- `.roo/skills/self-improving-agent/SKILL.md` — Hooks-based self-correction pattern

### Tertiary (LOW confidence - marked for validation)

- `docs/research/opencode-meta-concepts-verified-2026-03-03.md` — Progressive disclosure patterns (needs fresh validation against current OpenCode docs)
- WebSearch results for "OpenCode skills progressive disclosure 2026" — requires verification against official docs

---

## Appended Bundle — GSD Script, Checklist, Integrity, Metrics, and Harness Notes

This appended section captures the requested bundle without changing the existing plan documents.

### 1. Easy-to-learn script bundle

#### GSD learning scripts

```bash
# Load planning/state context in one place
node get-shit-done/bin/gsd-tools.cjs state load

# Resolve a phase directory deterministically
node get-shit-done/bin/gsd-tools.cjs find-phase 10

# Gather workflow-specific initialization context
node get-shit-done/bin/gsd-tools.cjs init execute-phase 10

# Verify references in a planning artifact
node get-shit-done/bin/gsd-tools.cjs verify references .planning/phases/.../10-PLAN.md
```

#### HiveMind learning scripts

```bash
# Trace HiveMind, OpenCode, and runtime paths
node bin/hivemind-tools.cjs trace-paths --json

# Validate the HiveMind ecosystem chain
node bin/hivemind-tools.cjs ecosystem-check --json

# Inspect current sessions without mutation
node bin/hivemind-tools.cjs inspect sessions --json
```

#### Safe discovery scripts

```bash
find . \
  -not -path '*/node_modules/*' \
  -not -path '*/dist/*' \
  -not -path '*/.git/*' \
  -type f
```

```bash
git log --oneline --decorate -20
```

```bash
find . -type f | grep -E 'AGENTS\.md|README\.md|config\.json|opencode\.jsonc?'
```

### 2. Integrity checklist bundle

#### Planning integrity

- [ ] `PROJECT.md`, `ROADMAP.md`, and `STATE.md` roles stay distinct
- [ ] phase references resolve to real files
- [ ] `.planning/` gitignore policy is documented if relevant
- [ ] branching assumptions are explicit when phase/milestone strategy is discussed

#### Skill-pack integrity

- [ ] pack boundaries are explicit
- [ ] no-load rules exist for entry skills
- [ ] reference depth remains 1 level
- [ ] deterministic checks are separated from human-facing guidance
- [ ] overlap with existing skills/packs is checked before adding new ones

#### Runtime and authority integrity

- [ ] `.opencode/**` is treated as projection or mirror input, not universal authority
- [ ] `.hivemind/**` is treated as runtime output, not authoring truth
- [ ] `bin/` and `src/hooks/` are described as mechanism surfaces, not just docs
- [ ] config-driven variation is documented rather than hidden

### 3. Metrics bundle

| Metric | Meaning | How to inspect |
|-------|---------|----------------|
| command determinism | repeated shell logic has been centralized | inspect `gsd-tools.cjs` and `hivemind-tools.cjs` usage |
| reference integrity | references and links resolve | run `verify references` and manual path checks |
| planning integrity | planning docs and config agree | `state load`, roadmap/phase commands |
| runtime integrity | runtime/install state is structurally valid | `ecosystem-check`, `validate` |
| stack discipline | pack and skill loads stay bounded | manual audit against pack rules |
| git hygiene | commits capture outcomes rather than noisy process churn | compare work to git integration guidance |
| conflict hygiene | no duplicate ownership across packs/skills | audit map before adding new skill surfaces |

### 4. Meta-framework concepts to preserve

- **Booster** = light enhancement that improves decisions without taking over runtime authority
- **Harness** = bounded mechanism that shapes routing/checks without becoming a second workflow engine
- **Prompt contract vs runtime engine** = markdown commands/workflows/skills explain behavior; tools/hooks/plugins enforce or inspect behavior
- **Cross-framework humility** = visible framework surfaces are inputs, not automatic authority
- **OpenCode-first authority** = HiveMind remains OpenCode-first even while learning from GSD patterns

### 5. Deterministic harness notes

Use these repo surfaces as the main references for future harness-oriented writing:

- `get-shit-done/workflows/help.md` — lifecycle, `.planning/` layout, common workflows
- `get-shit-done/bin/gsd-tools.cjs` — deterministic planning helper command surface
- `get-shit-done/references/planning-config.md` — `.planning/config.json` behavior and branching implications
- `get-shit-done/references/git-integration.md` — atomic commit timing and “commit outcomes, not process”
- `bin/hivemind-tools.cjs` — path tracing, validation, inspection, and source audit
- `src/hooks/soft-governance.ts` — SDK-first runtime governance signal pattern
- `AGENTS.md` — authority, shipped surfaces, generated/runtime surfaces, and SDK-first rules

### 6. Practical teaching rule for future docs

When documenting a concept in this phase area, always answer:

1. where the mechanism actually lives,
2. who controls it,
3. whether it is advisory, deterministic, runtime, or generated,
4. what conflict it avoids,
5. what script or checklist the user can run to inspect it safely.

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — existing HiveMind skill-writer pack is deployed and documented
- Architecture: HIGH — three-pattern system and TDD workflow are validated in reference files
- Pitfalls: HIGH — identified from existing skill-writer documentation
- Integration patterns: MEDIUM — cross-pack coordination needs explicit protocol definition
- Self-improvement: MEDIUM — hooks pattern exists but frequency optimization unclear

**Research date:** 2026-03-19
**Valid until:** 30 days (stable architecture, pattern system well-established)
