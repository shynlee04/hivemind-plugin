# GSD Agent Composition Playbook — Plan

## What I'm Building

A SKILL.md that teaches agents how to COMPOSE other GSD agents from user intent. Not a reference encyclopedia. Not a copy-paste of agent definitions. A **composition grammar** — teaching the XML markup patterns, step protocols, structured return formats, and chaining logic that makes GSD agents work.

## What the Current SKILL.md Gets Wrong

1. **1,591 lines** — violates progressive disclosure (<500 lines max)
2. **Description starts with "Use when"** — not third-person trigger format
3. **No references/ directory** — everything dumped in one file
4. **No scripts/** — no eval, no validation
5. **No evals/** — zero test infrastructure
6. **It's a reference manual**, not a skill instruction set
7. **Copies agent descriptions** instead of teaching composition patterns

## What It Should Teach (The Meta-Patterns)

### 1. XML Markup Grammar (the actual design language)
- `<role>` — identity injection
- `<execution_flow>` — ordered step sequences
- `<step name="..." priority="...">` — named, prioritized steps
- `<structured_returns>` — deterministic output formats
- `<deviation_rules>` — numbered auto-apply rules
- `<checkpoint_protocol>` — pause/resume with typed checkpoints
- `<core_principle>` — non-negotiable philosophy blocks
- `<project_context>` — discovery protocol blocks
- `<success_criteria>` — validation checklists
- `<analysis_paralysis_guard>` — stuck detection
- `<authentication_gates>` — error-as-gate pattern
- `<discovery_levels>` — research depth routing

### 2. Step Protocol Patterns
- `load_context` → `analyze` → `generate` → `run_and_verify` → `report`
- Every step has: name, inputs, outputs, failure conditions
- Steps are composable — verifier reuses executor's step structure

### 3. Structured Return Formats
- SECURED / OPEN_THREATS / ESCALATE (security)
- GAPS FILLED / PARTIAL / ESCALATE (testing)
- VERIFIED / FAILED / UNCERTAIN (verification)
- CHECKPOINT REACHED with typed sub-types

### 4. Deviation Rule System
- Rules 1-3: auto-fix (no permission needed)
- Rule 4: architectural change (stop, ask)
- Rule priority ordering
- Scope boundary enforcement
- Fix attempt limits (max 3)

### 5. Checkpoint Types
- `checkpoint:human-verify` (90%) — visual/functional
- `checkpoint:decision` (9%) — implementation choice
- `checkpoint:human-action` (1%) — unavoidable manual
- Auto-mode behavior vs standard behavior

### 6. Agent Composition Patterns
- **Mandatory Initial Read** — `<files_to_read>` enforcement
- **Project Context Discovery** — AGENTS.md → skills → rules chain
- **Read-Only Enforcement** — certain agents NEVER modify implementation
- **Escalation Gates** — surface unresolvable gaps, don't fix blindly
- **Two-Stage Verification** — spec compliance first, quality second

### 7. Chaining Patterns
- Researcher → Planner → Checker → Executor → Verifier → Nyquist
- UI: Researcher → Checker → Planner → Executor → Auditor
- Security: Planner (threat model) → Executor → Security Auditor
- Each agent's output is the next agent's input artifact

## Structure (Progressive Disclosure)

```
gsd-agent-composition/
├── SKILL.md (~300 lines) — Core grammar, decision tree, when/what/why
├── references/
│   ├── xml-markup.md (~200 lines) — All XML block types with examples
│   ├── step-protocols.md (~250 lines) — Step naming, sequencing, I/O contracts
│   ├── structured-returns.md (~200 lines) — Output format templates
│   ├── deviation-rules.md (~150 lines) — Numbered rule system, scope boundaries
│   ├── checkpoint-protocols.md (~200 lines) — Checkpoint types, auto-mode, return format
│   └── chaining-patterns.md (~250 lines) — Agent composition chains, artifact flow
├── scripts/
│   ├── validate-skill.sh — Validates SKILL.md frontmatter + structure
│   └── check-markup.sh — Checks XML block structure in agent files
├── evals/
│   └── evals.json — Test cases for skill effectiveness
└── assets/
    └── templates/ — Agent definition templates
```

## SKILL.md Content (what goes in the main file)

1. **Frontmatter** — proper name, third-person description with triggers
2. **Mandatory Initial Read** — the #1 pattern all agents follow
3. **XML Markup Quick Reference** — all block types in one table
4. **Decision Tree** — which blocks for which agent type
5. **Core Grammar Rules** — the 5 non-negotiables
6. **Progressive Disclosure Triggers** — when to load which reference
7. **Anti-Patterns** — what NOT to do when composing agents

## What Goes in Each Reference

### xml-markup.md
- Every XML block type found across 24 agents
- Purpose, position in file, required attributes
- Examples from real agents (executor, verifier, planner, nyquist, security)
- Nesting rules (what goes inside what)

### step-protocols.md
- Step naming conventions (load_*, analyze_*, generate_*, run_*, report)
- Step I/O contracts (what each step consumes and produces)
- Priority attributes (priority="first" vs default)
- Common step sequences by agent type
- The analysis_paralysis_guard pattern

### structured-returns.md
- All return format templates from all agents
- When to use which format
- The SECURED/OPEN_THREATS/ESCALATE pattern
- The GAPS FILLED/PARTIAL/ESCALATE pattern
- The VERIFIED/FAILED/UNCERTAIN pattern
- CHECKPOINT REACHED format

### deviation-rules.md
- The 4-rule system (auto-fix bugs, add missing, fix blocking, ask architecture)
- Rule priority ordering
- Scope boundary enforcement
- Fix attempt limits
- Tracking and reporting deviations

### checkpoint-protocols.md
- 3 checkpoint types with percentages
- Auto-mode vs standard behavior
- Return format specification
- Continuation handling
- Authentication gates as special checkpoints

### chaining-patterns.md
- Standard chain: Researcher → Planner → Checker → Executor → Verifier → Nyquist
- UI chain: Researcher → Checker → Planner → Executor → Auditor
- Security chain: Planner → Executor → Security Auditor
- Artifact flow between agents (what each produces, what next consumes)
- Wave execution patterns
- Failure recovery chains

## Validation Gates

Before declaring done:
- [ ] SKILL.md ≤400 lines
- [ ] Description has third-person WHAT + WHEN + KEYWORDS
- [ ] All 6 reference files exist with real content
- [ ] Scripts do real validation (not stubs)
- [ ] evals.json has 3+ test cases
- [ ] No copy-paste from agent files — synthesized patterns only
- [ ] Teaches COMPOSITION, not content
- [ ] skill-judge score ≥ 96/120 (Grade B or better)

## Delegation Plan

**Cycle 1 (2 waves):** Load benchmarks
- Wave 1: Read hm-deep-research, hm-detective, hm-synthesis as quality benchmarks
- Wave 2: Read meta-builder routing, use-authoring-skills references

**Cycle 2 (2 waves):** Write core
- Wave 1: Write SKILL.md (~300 lines) with proper frontmatter, decision tree, XML quick reference
- Wave 2: Write xml-markup.md + step-protocols.md references

**Cycle 3 (2 waves):** Write references
- Wave 1: Write structured-returns.md + deviation-rules.md
- Wave 2: Write checkpoint-protocols.md + chaining-patterns.md

**Cycle 4 (2 waves):** Infrastructure
- Wave 1: Create scripts/ (validate-skill.sh, check-markup.sh)
- Wave 2: Create evals/evals.json + templates

**Cycle 5 (2 waves):** Cross-check
- Wave 1: Run skill-judge against the restructured skill
- Wave 2: Cross-check against existing 20+ skills for overlap

**Cycle 6 (2 waves):** Fix + validate
- Wave 1: Apply all fixes from audit findings
- Wave 2: Re-run skill-judge, validate all gates
