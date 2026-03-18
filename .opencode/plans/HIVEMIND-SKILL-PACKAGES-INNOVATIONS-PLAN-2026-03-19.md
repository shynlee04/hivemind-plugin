# HiveMind SKILL PACKAGES Innovations — Master Plan
## Date: 2026-03-19
## Phase: Planning & Architectural Design

---

# 1. CONTEXT AND PURPOSE

## 1.1 What This Plan Covers

This plan establishes the **HiveMind Skill Packages framework** — a collection of inter-related skills designed to:

1. **Context-Intelligence Pack**: Defend against context rot, pollution, and poisoning in multi-agent IDE environments
2. **HiveMind-Skill-Writer**: Meta-builder skill for authoring, auditing, and packaging HiveMind-specific skills
3. **Progressive Disclosure System**: Skills that load depth incrementally based on entry situations, roles, and context states

## 1.2 Design Philosophy

The framework follows three foundational **Patterns** that govern skill stacking and loading:

| Pattern | Name | When to Use | Behavior |
|---------|------|------------|----------|
| **Pattern 1** | High-Level Routing | Multiple stacking scenarios, runtime-context decisions | Entry skills that route to specialized skills based on session state |
| **Pattern 2** | Domain-Specific Classification | Step-by-step workflows, phase-planning | Branching skills that classify situations and load domain-specific references |
| **Pattern 3** | Vertical Expertise | Skills maintenance, AGENTS.md auditing, framework authoring | When depth is needed, conditionally loaded with references |

## 1.3 Entry Situations Matrix

Skills must activate based on these session states:

| Entry Type | Indicators | Pattern | Stacking |
|------------|------------|---------|----------|
| Fresh session | First message, new session ID | Pattern 1 | Minimal initial load → progressive disclosure |
| Resumed | Continuation after context window | Pattern 1+2 | Verify state → load recovery refs if needed |
| Delegated | Subagent context, explicit scope | Pattern 2 | Load delegation scope refs |
| Degraded | Pruned context, gaps, inconsistencies | Pattern 1+3 | Full context assessment → recovery |
| Post-cancel | Partial state, mid-turn interrupted | Pattern 1+2 | Rebuild state → verify completion |
| Late-session | Extended session, accumulated context | Pattern 1+3 | Full rot assessment |

## 1.4 Degree of Freedom (Progressive Disclosure)

Each skill has a **Degree of Freedom** — how much freedom the agent has to select, load, or skip:

| DoF Level | Behavior | Example |
|------------|----------|---------|
| **Mandatory** | Always loads at entry | Context-intelligence entry |
| **Conditional** | Loads on specific triggers | Delegation scope on delegation |
| **On-Demand** | Only when explicitly needed | Context rot recovery |
| **Opt-In** | Agent chooses when to load | Meta-builder for skill authoring |

---

# 2. THE THREE PATTERNS IN DEPTH

## 2.1 Pattern 1: High-Level Routing (Load-Balancing Entry Skills)

**Purpose**: Route to appropriate specialized skills based on session state classification

**Structure**:
```
context-intelligence/
├── SKILL.md                    # L1 mandatory entry (~100 words)
├── references/
│   ├── entry-state-matrix.md   # Session state classification
│   ├── context-rot-model.md    # Rot detection & scoring
│   └── platform-surface.md     # Cross-platform awareness
```

**Activation Logic**:
- L1 always loaded at meaningful entry points
- L2 loaded when delegation detected
- L3 loaded when workflow invoked
- L4 loaded when context drift suspected

## 2.2 Pattern 2: Domain-Specific Classification (Step-by-Step Branching)

**Purpose**: Classify situations and load domain-specific templates, scripts, and references

**Structure**:
```
delegation-intelligence/
├── SKILL.md                    # Entry with branching logic
├── references/
│   ├── scope-inheritance.md    # What to inherit vs. isolate
│   ├── chain-of-command.md     # Authority escalation
│   └── anti-patterns.md        # Scope bleed, creep, abandonment
```

**Branching Rules**:
- When delegated: Load scope-inheritance + chain-of-command
- When workflow: Load phase-planning + verification templates
- When platform mismatch: Load cross-platform surface refs

## 2.3 Pattern 3: Vertical Expertise (Audit & Maintenance)

**Purpose**: Deep expertise skills for framework maintenance, skill auditing, AGENTS.md governance

**Structure**:
```
meta-builder-hivemind/
├── SKILL.md                    # Entry with conditional deep loading
├── references/
│   ├── skill-quality-matrix.md  # Scoring dimensions
│   ├── triple-pattern.md        # Pattern 1/2/3 stacking rules
│   ├── progressive-disclosure.md # DoF loading strategy
│   └── auditing-protocol.md     # Skill audit methodology
```

**Activation**: Only when:
- Authoring new HiveMind skill
- Auditing existing skills
- Refactoring skill packages
- Packaging skill bundles

---

# 3. CONTEXT-INTELLIGENCE PACK — PACKAGE 1

## 3.1 Design Principles

```
┌─────────────────────────────────────────────────────────────────┐
│              CONTEXT-INTELLIGENCE ENTRY PACK                    │
├─────────────────────────────────────────────────────────────────┤
│  Primary: Context rot defense (detection, scoring, recovery)     │
│  Secondary: Non-breaking harness boost for agent intelligence    │
│  Tertiary:  Foundation for specialized workflow packs            │
│  Constraint: Never force deep loading — progressive disclosure   │
└─────────────────────────────────────────────────────────────────┘
```

### 3.1.1 Context Rot Taxonomy

| Level | Name | Indicators | Response |
|-------|------|------------|----------|
| 0 | CLEAN | All signals consistent | Continue normal ops |
| 1 | SUSPECT | Minor inconsistencies | Verify before critical actions |
| 2 | DEGRADED | Significant drift | Pause, assess, recover |
| 3 | POLLUTED | Major conflicts | Stop, isolate, rebuild |
| 4 | POISONED | Dangerous signals | Emergency stop + user alert |

### 3.1.2 Trust Scoring Matrix

| Signal | Trust Score | Weight |
|--------|-------------|--------|
| Live SDK/plugin behavior | 100% | 1.0 |
| User confirmation | 100% | 1.0 |
| Git-verified file | 95% | 0.9 |
| Type-checked code | 90% | 0.8 |
| Documentation | 50% | 0.5 |
| Inherited context | 40% | 0.4 |
| Unverified claims | 10% | 0.1 |
| Contradictory signals | 0% | 0.0 |

**Formula**: `Effective Trust = Σ(Signal × Weight) / Σ(Weight)`
**Threshold**: If Effective Trust < 0.6 → Context Rot suspected

## 3.2 Package Structure

```
skills/context-intelligence/
├── SKILL.md                         # MUST-LOAD entry (L1 ~100 words)
├── references/
│   ├── 01-entry-state-matrix.md    # Session state recognition
│   ├── 02-context-rot-taxonomy.md   # Severity model + detection
│   ├── 03-trust-scoring.md         # Trust evaluation system
│   ├── 04-platform-surface.md       # Cross-platform awareness
│   ├── 05-safe-discovery-patterns.md # Tree inspection, regex
│   └── 06-load-surface-matrix.md    # skills/, .opencode/skills, etc.
├── templates/
│   └── context-triage-report.md      # Trust report template
└── scripts/
    ├── detect-rot.sh                # Context rot detection
    └── assess-trust.sh              # Trust scoring assessment
```

## 3.3 Entry Skill Core (SKILL.md)

**L1 Content (~100 words)**:
```yaml
---
name: context-intelligence-entry
description: Use at session start, after compaction, when detecting drift, or when delegation scope is unclear. Defends against context rot, pollution, and poisoning in multi-agent IDE environments.
---

# Context-Intelligence Entry Pack

## Purpose
Always-activated defense against context rot in complex IDE-based, multi-agent, multi-workflow environments.

## Entry State Matrix

| State | Indicators | Required Action |
|-------|------------|-----------------|
| NEW | First message, fresh context | Full context map |
| RESUMED | Mid-session, prior state exists | Verify continuity |
| DEGRADED | Pruned, gaps, inconsistencies | Assess damage |
| DELEGATED | Subagent context | Verify inherited scope |
| INTERRUPTED | Post-cancellation | Re-establish truth |

## Context Rot Defense (Never Skip)

1. OBSERVE — Note all context signals before acting
2. ASSESS — Score trust using Trust Matrix
3. VERIFY — Run discovery if signals inconsistent
4. CONFIRM — User confirmation for high-impact actions
5. RECOVER — Follow recovery protocol if trust < 0.6
```

---

# 4. HIVEMIND-SKILL-WRITER PACKAGE — PACKAGE 2 (META-BUILDER)

## 4.1 Purpose

HiveMind-Skill-Writer is a **meta-builder** skill that guides:
- Creating new HiveMind-specific skills
- Auditing existing skills for conflicts, drift, deterministic issues
- Refactoring and consolidating skill packages
- Packaging skills for distribution

## 4.2 Skill Anatomy Template

```
skill-name/
├── SKILL.md                    # Required entry point (Zod schema for args)
├── references/                 # Heavy documentation (progressive disclosure)
│   ├── topic-a.md
│   └── topic-b.md
├── scripts/                    # Discovery/assessment scripts
└── templates/                # Reusable templates
```

## 4.3 SKILL.md Frontmatter Standard

```yaml
---
name: skill-name-with-hyphens
description: Use when [specific triggering conditions] — third person, max 1024 chars
---

# Skill Title

## Purpose
One sentence explaining core principle.

## When to Use
- Trigger condition 1
- Trigger condition 2

## When NOT to Use
- Situations where this would conflict
- Edge cases where this is wrong

## Quick Reference
| Scenario | Action |
|----------|--------|
| Case A | Do X |
| Case B | Do Y |

## Example
[One excellent example, not multi-language]

## References
- `references/topic-a.md` — Detailed explanation
```

## 4.4 Quality Checklist

### Before Writing
- [ ] Is this a reusable pattern across projects?
- [ ] Would I reference this in multiple contexts?
- [ ] Is it broader than project-specific?
- [ ] Can automation handle mechanical parts?
- [ ] Does it conflict with existing HiveMind skills?
- [ ] Does it follow Pattern 1/2/3 correctly?

### During Writing
- [ ] Name uses letters, numbers, hyphens only
- [ ] Description triggers on specific conditions
- [ ] Overview states core principle in 1-2 sentences
- [ ] Includes "when NOT to use"
- [ ] Has one excellent example
- [ ] Quick reference table for scanning
- [ ] No ceremony or friction for GSD workflows
- [ ] Progressive disclosure via references

### After Writing
- [ ] Run baseline test without skill
- [ ] Document exact failure cases addressed
- [ ] Verify no conflicts with existing skills
- [ ] Check Pattern 1/2/3 stacking is correct
- [ ] Validate against skill-judge criteria

## 4.5 Anti-Conflict Rules

When creating HiveMind skills, AVOID:

| Anti-Pattern | Problem | Resolution |
|--------------|---------|-------------|
| Duplicate entry points | Multiple skills claim same trigger | Consolidate or clearly differentiate |
| Conflicting directives | Two skills give opposite guidance | Create routing layer or pick winner |
| Deterministic brittleness | Hardcoded paths that break | Use regex, patterns, fuzzy matching |
| Ceremony overhead | Mandatory steps before action | Make opt-in, not mandatory |
| Context pollution | Skill introduces false signals | Validate against trust matrix |
| Lock-in | Forces specific framework | Be platform-agnostic by default |

## 4.6 Package Structure

```
skills/hivemind-skill-writer/
├── SKILL.md                            # Entry skill (meta-builder)
├── references/
│   ├── 01-skill-quality-matrix.md       # Scoring dimensions (from skill-judge)
│   ├── 02-triple-pattern.md             # Pattern 1/2/3 stacking rules
│   ├── 03-progressive-disclosure.md     # DoF loading strategy
│   ├── 04-auditing-protocol.md          # Skill audit methodology
│   ├── 05-skill-writing-guide.md        # How to write skills (from writing-skills)
│   ├── 06-conflict-detection.md          # Finding skill conflicts
│   └── 07-packaging-patterns.md          # Bundling skills for distribution
└── templates/
    ├── skill-template.md                 # New skill template
    └── audit-report.md                  # Audit report template
```

---

# 5. PACKAGE 3: DELEGATION-INTELLIGENCE (DEPENDENT ON PACK 1)

## 5.1 Purpose

Pattern 2 skill for delegation scenarios. Loads when delegation detected.

## 5.2 Scope Rules

| Element | Inherit? | Rationale |
|---------|----------|-----------|
| Task description | YES | Core mandate |
| Constraints | YES | Operating bounds |
| Success criteria | YES | Target definition |
| Parent session state | NO | Privacy, isolation |
| Unrelated context | NO | Scope containment |
| Authority to delegate further | NO | Chain of command |

## 5.3 Chain of Command

1. **ORIGINAL AUTHORITY** — User or top-level agent
2. **PRIMARY DELEGATOR** — First-level delegate with full context
3. **SUBAGENT** — Limited scope, task-specific

**Rule**: Each level can only delegate what it received + its own additions

## 5.4 Anti-Patterns

| Pattern | Problem |
|---------|---------|
| Scope Bleed | Parent context leaking into subagent |
| Scope Creep | Subagent taking initiative beyond scope |
| Scope Abandonment | Subagent ignoring constraints |

---

# 6. PACKAGE 4: CONTEXT-ROT-RECOVERY (DEPENDENT ON PACK 1)

## 6.1 Recovery Protocols

### Protocol Alpha (Self-Recovery)
1. Isolate suspicious context
2. Rebuild from nearest clean source
3. Cross-verify with git history
4. Continue if trust > 0.7

### Protocol Beta (User-Assisted)
1. Stop execution
2. Present evidence of rot
3. Request user confirmation
4. Follow user guidance

### Protocol Gamma (Emergency)
1. Halt all actions
2. Alert user with evidence
3. Await explicit instruction
4. Document incident

## 6.2 Chaining of Skills & Scripts for Recovery

When context confusion detected, this chain helps:
1. Bash the hierarchy → `tree -L 3 -I node_modules`
2. Check git mapping → `git log --oneline -20`
3. Verify file existence → `test -f && echo exists`
4. Check timestamps → `git log -1 --format="%ai" -- <filename>`
5. Rebuild context → Load from authoritative sources only

---

# 7. CROSS-FRAMEWORK AWARENESS

## 7.1 Platform Surface Matrix

| Directory | Platform | Contains |
|-----------|----------|----------|
| `.agent/skills/` | General agent | Skill packages |
| `.claude/` | Claude Code | Configuration, skills |
| `.codex/skills/` | Codex | Skills, agents |
| `.cursor/` | Cursor | Configuration |
| `.gemini/` | Gemini | Configuration |
| `.roo/skills/` | Roo | Skills |
| `.qwen/skills/` | Qwen | Skills |
| `.opencode/skills/` | OpenCode | Skills, agents, plugins |
| `.hivemind/` | HiveMind | Runtime state (not authoring) |

## 7.2 Discovery Patterns (Safe Scripts Only)

**Tree Inspection** (excludes noise):
```bash
tree -L 3 -I 'node_modules|.git|dist|.hivemind' <path>
```

**File Type Counting**:
```bash
find <path> -type f -name '*.ts' | wc -l
```

**Regex Path Matching**:
```bash
find . -type f -name '*.md' | grep -E '(AGENTS|README|TODO)'
```

**Never Use** (mutation by default):
- `rm -rf` unless explicitly requested
- `mv` with overwrite
- `sed -i` for in-place edits

---

# 8. IMPLEMENTATION PHASES

## Phase 1: Context-Intelligence Entry Pack (Foundation)
| Task | Deliverable | Exit Gate |
|------|-------------|-----------|
| 1.1 Create entry SKILL.md | `skills/context-intelligence/SKILL.md` | User approves L1 content |
| 1.2 Create entry-state-matrix | `references/01-entry-state-matrix.md` | Classification accurate |
| 1.3 Create context-rot-taxonomy | `references/02-context-rot-taxonomy.md` | Severity levels clear |
| 1.4 Create trust-scoring | `references/03-trust-scoring.md` | Formula validated |
| 1.5 Create platform-surface | `references/04-platform-surface.md` | Cross-platform awareness |
| 1.6 Create safe-discovery-patterns | `references/05-safe-discovery-patterns.md` | Scripts are read-only |
| 1.7 Create load-surface-matrix | `references/06-load-surface-matrix.md` | Surface inventory complete |
| 1.8 Create triage template | `templates/context-triage-report.md` | Report format clear |
| 1.9 Integration test | Full skill loads correctly | npm test passes |

## Phase 2: HiveMind-Skill-Writer (Meta-Builder)
| Task | Deliverable | Exit Gate |
|------|-------------|-----------|
| 2.1 Create meta-builder SKILL.md | `skills/hivemind-skill-writer/SKILL.md` | TDD workflow clear |
| 2.2 Create skillquality-matrix | `references/01-skill-quality-matrix.md` | Scoring dimensions set |
| 2.3 Create triple-pattern | `references/02-triple-pattern.md` | Pattern stacking clear |
| 2.4 Create progressive-disclosure | `references/03-progressive-disclosure.md` | DoF levels defined |
| 2.5 Create auditing-protocol | `references/04-auditing-protocol.md` | Audit steps clear |
| 2.6 Create skill-writing-guide | `references/05-skill-writing-guide.md` | Writing process clear |
| 2.7 Create conflict-detection | `references/06-conflict-detection.md` | Conflicts detectable |
| 2.8 Create packaging-patterns | `references/07-packaging-patterns.md` | Distribution clear |
| 2.9 Create templates | `templates/skill-template.md`, `templates/audit-report.md` | Templates usable |

## Phase 3: Delegation-Intelligence (Pattern 2)
| Task | Deliverable | Exit Gate |
|------|-------------|-----------|
| 3.1 Create delegation SKILL.md | `skills/delegation-intelligence/SKILL.md` | Scope rules clear |
| 3.2 Create scope-inheritance | `references/scope-inheritance.md` | Inheritance matrix clear |
| 3.3 Create chain-of-command | `references/chain-of-command.md` | Authority levels set |
| 3.4 Create anti-patterns | `references/delegation-anti-patterns.md` | Violations detectable |

## Phase 4: Context-Rot-Recovery (Pattern 3)
| Task | Deliverable | Exit Gate |
|------|-------------|-----------|
| 4.1 Create recovery SKILL.md | `skills/context-rot-recovery/SKILL.md` | Recovery protocols clear |
| 4.2 Create recovery scripts | `scripts/recover-context.sh` | Self-heal when possible |
| 4.3 Create emergency protocols | `references/emergency-protocols.md` | Gamma protocol defined |

## Phase 5: Integration & Testing
| Task | Deliverable | Exit Gate |
|------|-------------|-----------|
| 5.1 Skill stacking validation | Patterns 1/2/3 work together | No circular deps |
| 5.2 Non-breaking verification | npm test passes | Zero regressions |
| 5.3 Cross-platform test | Skills work on all platforms | Per platform matrix |
| 5.4 Conflict audit | No conflicts between packages | skill-judge clean |

---

# 9. EXTERNAL SKILL REFERENCES (TO LOAD FOR CONTEXT)

When building these skills, reference these external skills:

| Skill | Purpose | When to Load |
|-------|---------|--------------|
| `skill-creator` (skills.sh) | Progressive disclosure + DoF concepts | When writing meta-builder |
| `skill-judge` (softaworks) | Quality metrics for auditing | When creating audit protocol |
| `writing-skills` (obra/superpowers) | TDD approach to skill writing | When building skill-writer |
| `skill-creator` (anthropics) | Deep skill authoring knowledge | When needing advanced guidance |

---

# 10. EXISTING SKILLS CLASSIFICATION (FROM AUDIT)

## 10.1 Skills to Consolidate INTO Context-Intelligence

| Skill | Reason |
|-------|--------|
| `entry-resolution` (deprecated) | Moved to `_deprecated_hive` — conflicts with Pattern 1 |
| `delegation-framework` (deprecated) | Moved to `_deprecated_hive` — conflicts with Pattern 2 |
| `context-integrity` (deprecated) | Moved to `_deprecated_hive` — conflicts with Pattern 3 |

## 10.2 Skills to KEEP (Reference/Bundle)

| Skill | Action | Reason |
|-------|--------|--------|
| `platform-adapter` | KEEP | Cross-platform awareness, bundles well |
| `agent-role-boundary` | KEEP | Diamond model aligns with Pattern 2 |
| `harness-architecture` | KEEP | SDK knowledge, useful reference |

## 10.3 Skills to REFACTOR/MIGRATE

| Skill | Action | Reason |
|-------|--------|--------|
| `spec-distillation` | Consolidate | Project-specific, low reuse |
| `research-methodology` | Consolidate | Project-specific, low reuse |
| `ralph-tasking` | Migrate | ralph-tui specific, out of scope |

---

# 11. SUCCESS METRICS

| Metric | Target | Measurement |
|--------|--------|-------------|
| Context rot detection rate | > 90% | Test scenarios pass |
| Trust scoring accuracy | > 85% | Scoring matches expected |
| Skill conflict rate | 0% | skill-judge reports clean |
| Pattern stacking correctness | 100% | No circular dependencies |
| Non-breaking integration | 100% | npm test passes |
| Progressive disclosure effectiveness | > 80% | L1 loaded when needed, L2+ only on trigger |
| Cross-platform awareness | All platforms | Platform matrix covered |

---

# 12. ASSUMPTIONS AND CONSTRAINTS

## 12.1 Assumptions
- GSD remains the legitimate workflow framework
- OpenCode SDK available for `client.*` APIs
- Skills system functional for loading/bundling
- User verification gates are user-controlled, not ritual

## 12.2 Constraints
- Must not break existing mechanisms
- Must not add ceremony to GSD workflows
- Must not force single-framework dogma
- Verification gates must be opt-in, not mandatory
- Scripts must be discovery-only (no mutation by default)

---

# 13. DOCUMENT DEPENDENCIES

| Document | Status | Purpose |
|----------|--------|---------|
| `context-intelligence-entry-pack-plan-2026-03-19.md` | EXISTING | Context-intelligence planning |
| `setting-the-theme.md` | EXISTING | Theme framing + requirements |
| `HIVEMIND-POLLUTION-AUDIT.md` | EXISTING | Pollution classification |
| `my-prompt-to-investigation.md` | EXISTING | Audit methodology |
| `the-second-context-investigation-round.md` | EXISTING | Investigation findings |

---

**Document Status**: PLANNING
**Next Action**: User authorization to proceed with Phase 1 implementation
