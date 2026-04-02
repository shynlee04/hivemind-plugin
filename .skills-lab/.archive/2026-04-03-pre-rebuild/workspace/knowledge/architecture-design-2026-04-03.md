# Architecture Design: Skill Authoring Package Rebuild

**Created:** 2026-04-03
**Status:** DRAFT — Awaiting User Approval
**Inputs:** Wave 0 (context scouting), Wave 1 (deep audit × 3 agents)

---

## 1. Target Directory Structure

```
use-authoring-skills/
│
├── SKILL.md                                  # Routing hub (< 500 lines)
│
├── references/
│   ├── 01-skill-anatomy.md                   # [KEEP] Deduplicated: structure + naming + versions
│   ├── 02-frontmatter-spec.md                # [KEEP] Deduplicated: ONLY frontmatter schema
│   ├── 03-skill-patterns.md                  # [KEEP] Deduplicated: P1/P2/P3 + decision tree
│   ├── 04-tdd-workflow.md                    # [FIX] Remove forbidden frontmatter from GREEN phase
│   ├── 05-quality-matrix.md                  # [KEEP] Best file — absorb audit-checklist.md
│   ├── 06-cross-platform-activation.md       # [NEW] Agent discovery, parsing, activation, platform table
│   ├── 07-iterative-refinement.md            # [REWRITE] Add concrete examples, remove dead link to 06
│   ├── 08-conflict-detection.md              # [KEEP] Remove overlap with 05, fix dead link to 06
│   ├── 09-script-authoring.md                # [NEW] Agentic script design (non-interactive, self-contained)
│   ├── 10-eval-lifecycle.md                  # [NEW] Eval-driven development (evals, grading, benchmarks)
│   ├── 11-description-optimization.md        # [NEW] Trigger testing methodology (20 queries, overfitting)
│   └── 12-anti-deception.md                  # [NEW] Guardrails, gatekeeping, context boundaries
│
├── templates/
│   ├── evals.json                            # [NEW] Eval case template
│   ├── grading-rubric.json                   # [NEW] Scoring template
│   ├── benchmark.json                        # [NEW] Benchmark aggregation template
│   ├── trigger-queries.json                  # [NEW] 20-query trigger test template
│   └── skill-scaffold/                       # [NEW] Starter directory template
│       └── SKILL.md
│
├── scripts/
│   ├── validate-skill.sh                     # [NEW] Validate frontmatter + structure
│   ├── check-overlaps.sh                    # [NEW] Detect content duplication
│   └── test-triggers.sh                      # [NEW] Run trigger query tests
│
├── examples/
│   ├── example-p1-simple.md                  # [NEW] Complete P1 skill creation walkthrough
│   ├── example-p2-technique.md               # [NEW] Complete P2 technique creation walkthrough
│   └── example-p3-routed.md                  # [NEW] Complete P3 routed skill creation walkthrough
│
└── [DELETED]
    ├── references/sw-04-tdd-workflow.md      # [DELETE] 100% duplicate of 04
    ├── references/audit-checklist.md         # [MERGE] Into 05-quality-matrix.md
    └── templates/skill-audit.json             # [REPLACE] With expanded evals.json + grading-rubric.json
```

---

## 2. SKILL.md Routing Hub Design

### Frontmatter (Spec-Compliant)
```yaml
---
name: use-authoring-skills
description: >
  This skill should be used when creating, auditing, evaluating, or improving
  agent skills. Provides comprehensive skill-authoring guidance including anatomy,
  frontmatter specification, pattern selection (P1/P2/P3), TDD workflow,
  quality scoring, eval-driven iteration, script authoring, description optimization,
  and cross-platform activation. Triggers on: "create a skill", "audit skill",
  "improve skill", "skill frontmatter", "skill pattern", "skill quality",
  "eval a skill", "optimize skill description", "skill authoring".
---
```

### Body Structure (< 500 lines target)
```
SKILL.md Body:
├── Overview (20 lines) — What this skill does, when to use
├── Phase Gate System (40 lines) — Authoring lifecycle phases
├── Pattern Selection Guide (50 lines) — P1 vs P2 vs P3 decision tree
├── Quick Reference Tables (60 lines) — Frontmatter fields, naming rules, quality dimensions
├── TDD Workflow Summary (30 lines) — RED → GREEN → REFACTOR overview
├── Reference Map (80 lines) — What to load when (progressive disclosure guide)
├── Templates & Scripts Index (30 lines) — What's available and how to use
├── Anti-Patterns & Common Mistakes (40 lines) — Top mistakes to avoid
├── Cross-Package Integration (30 lines) — How this connects to other meta-packages
└── Gatekeeping (20 lines) — When to refuse or redirect
Total estimate: ~400 lines
```

---

## 3. Progressive Disclosure Tier Assignment

### Tier 1: Metadata (Always in context, ~100 tokens)
- `name` + `description` from SKILL.md frontmatter

### Tier 2: Instructions (When skill triggers, ~5000 tokens)
- SKILL.md body (< 500 lines)
- This is the ROUTING HUB — tells the agent which references to load

### Tier 3: On-Demand References (Loaded as needed)

| Priority | File | Load When | Est. Tokens |
|----------|------|-----------|-------------|
| 🔴 Always useful | 01-skill-anatomy | Creating any skill | ~2,000 |
| 🔴 Always useful | 02-frontmatter-spec | Writing frontmatter | ~1,500 |
| 🟠 Pattern selection | 03-skill-patterns | Choosing P1/P2/P3 | ~2,500 |
| 🟠 Quality cycle | 04-tdd-workflow | Following TDD cycle | ~2,800 |
| 🟠 Quality check | 05-quality-matrix | Evaluating quality | ~2,200 |
| 🟡 Platform-specific | 06-cross-platform | Deploying cross-platform | ~1,800 |
| 🟡 Improvement | 07-iterative-refinement | Iterating on skill | ~1,500 |
| 🟡 Multi-skill | 08-conflict-detection | Managing skill sets | ~1,600 |
| 🟡 Script-heavy | 09-script-authoring | Adding scripts to skill | ~2,000 |
| 🟢 Eval-focused | 10-eval-lifecycle | Running eval cycles | ~2,200 |
| 🟢 Trigger-focused | 11-description-optimization | Optimizing description | ~1,800 |
| 🟢 Advanced | 12-anti-deception | Guarding against misuse | ~1,500 |

**Total if all loaded: ~23,400 tokens** — but progressive disclosure means an agent typically loads 2-4 references per task (~5,000-8,000 tokens).

---

## 4. Content Ownership (Single Source of Truth)

### Deduplication Plan

| Topic | OWNER | Current Duplicates | Action |
|-------|-------|--------------------|--------|
| P1/P2/P3 structure templates | 03-skill-patterns | 01 (lines 106-212) | Remove from 01, cross-ref to 03 |
| Frontmatter rules | 02-frontmatter-spec | 01 (line 22), 04 (lines 116-128) | Remove from both, cross-ref to 02 |
| Quality dimensions table | 05-quality-matrix | 04 (lines 176-188) | Remove from 04, cross-ref to 05 |
| Audit checklist | 05-quality-matrix | audit-checklist.md (32 lines) | Merge into 05, delete checklist file |
| Internal metadata in body | 01-skill-anatomy | 02 (lines 99-122) | Remove from 02, keep in 01 |
| "Only name+description" rule | 02-frontmatter-spec | 02 itself (6 repetitions) | Consolidate to ONE statement |
| Naming rules | 01-skill-anatomy | 02 (lines 34-49) | Keep in 01, cross-ref from 02 |
| Complete TDD file | 04-tdd-workflow | sw-04-tdd-workflow.md | Delete sw-04 |

---

## 5. Fix Specifications (Priority-Ordered)

### P0: CRITICAL Fixes (Must happen first)

**F1: Fix 04-tdd-workflow.md GREEN phase**
- DELETE lines 120-127 (8 forbidden frontmatter fields)
- REPLACE with spec-compliant example showing only `name` + `description`
- REPLACE line 172 vague checklist with explicit "name + description only" check

**F2: Delete sw-04-tdd-workflow.md**
- Verified byte-for-byte duplicate (SHA-256 confirmed)
- Remove from references/ directory

**F3: Fix SKILL.md frontmatter**
- Remove any non-standard fields
- Ensure only `name` + `description` in frontmatter
- Write spec-compliant description with trigger phrases

**F4: Resolve Spec Policy Conflict**
- DECISION NEEDED: Does 02-frontmatter-spec allow spec-allowed optional fields (`license`, `compatibility`, `metadata`, `allowed-tools`)?
- Option A: Align with spec — allow optional fields, document HiveMind convention as recommendation
- Option B: Keep HiveMind restriction — document as deliberate deviation with rationale
- Recommendation: Option A (align with spec) — agents need to know the full spec, HiveMind constraints can be a subsection

### P1: HIGH Priority (Deduplication)

**F5: Deduplicate 01-skill-anatomy.md**
- Remove P1/P2/P3 templates (~107 lines) → replace with "See 03-skill-patterns.md for structure templates"
- Remove frontmatter rule (line 22) → "See 02-frontmatter-spec.md"
- Remove naming rules overlap with 02 → keep in 01, cross-ref from 02

**F6: Deduplicate 02-frontmatter-spec.md**
- Consolidate "only name+description" to ONE statement
- Remove HiveMind-specific notes section → move relevant parts to 01 or 06
- Remove naming rules overlap → cross-ref to 01

**F7: Deduplicate 03-skill-patterns.md**
- Fix self-integration copy-paste error (lines 275-276)
- Remove trivial stacking arithmetic
- Refocus domain interconnectedness on pattern selection

**F8: Deduplicate 04-tdd-workflow.md**
- Replace quality dimensions table → cross-ref to 05

**F9: Merge audit-checklist.md into 05-quality-matrix.md**
- Expand 05's existing checklist section
- Delete standalone audit-checklist.md

### P2: NEW Content

**F10: Write 06-cross-platform-activation.md**
- Agent discovery mechanisms (filesystem scanning, .agents/skills/)
- Parsing frontmatter (lenient YAML validation)
- Activation mechanisms (file-read vs dedicated tool)
- Platform compatibility table (OpenCode, Claude Code, Codex, etc.)
- Context compaction protection

**F11: Write 09-script-authoring.md**
- Non-interactive requirements
- Self-contained patterns (PEP 723, Deno npm:, Bun auto-install)
- -help documentation, error messages, structured output
- Idempotency, dry-run, exit codes, safe defaults

**F12: Write 10-eval-lifecycle.md**
- Eval case design (evals.json format)
- Workspace structure (iteration-N/, with_skill/, without_skill/)
- Assertion writing
- Grading (PASS/FAIL with evidence)
- Benchmark aggregation
- Pattern analysis (analyst pass)
- Human review workflow
- Iteration loop

**F13: Write 11-description-optimization.md**
- How skill triggering works
- Writing effective descriptions
- Trigger eval queries (20 queries: 8-10 positive, 8-10 negative)
- Train/validation splits
- Optimization loop (5 iterations)
- Overfitting avoidance

**F14: Write 12-anti-deception.md**
- Observation limits
- Pattern/anti-pattern pairs
- Shadowing techniques
- Context boundaries
- Gatekeeping domain boundaries
- Refusal intelligence
- Consultant role outside domain

---

## 6. Tension Resolution Proposals

| # | Tension | Proposed Resolution | Rationale |
|---|---------|-------------------|-----------|
| T1 | Concision vs spec coverage | Lean SKILL.md (<500 lines) + deep progressive refs | Progressive disclosure gives both — concise entry, deep on demand |
| T2 | HiveMind naming vs spec naming | Keep `use-authoring-skills` directory name, spec-compliant frontmatter `name` field | Internal convention preserved, spec compliance in the skill itself |
| T3 | Determinism vs pattern flexibility | Deterministic for MUST rules, flexible for SHOULD guidance | Rules are strict (frontmatter, naming), patterns are guides |
| T4 | Phase-gated vs iterative loop | Phase gates BETWEEN phases, iterative loops WITHIN phases | Sequential progression, cyclical refinement inside each phase |
| T5 | Single framework vs cross-platform | Spec-compliant by default, HiveMind conventions as optional layer | Universal base, framework-specific addons |

---

## 7. Implementation Wave Plan

### Wave 2: Fix Criticals (3 subagents, parallel)
- Agent A: Fix 04-tdd-workflow.md (F1)
- Agent B: Fix SKILL.md frontmatter (F3) + delete sw-04 (F2)
- Agent C: Resolve spec policy conflict (F4) — update 02-frontmatter-spec.md

### Wave 3: Deduplicate (3 subagents, parallel)
- Agent A: Deduplicate 01 + 02 (F5 + F6)
- Agent B: Deduplicate 03 + 04 (F7 + F8)
- Agent C: Merge audit-checklist into 05 + rewrite 07 (F9 + partial F10)

### Wave 4: New Content Batch 1 (3 subagents, parallel)
- Agent A: Write 06-cross-platform-activation.md (F10)
- Agent B: Write 09-script-authoring.md (F11) + 10-eval-lifecycle.md (F12)
- Agent C: Write 11-description-optimization.md (F13) + 12-anti-deception.md (F14)

### Wave 5: Rebuild SKILL.md (1 subagent)
- Rewrite SKILL.md as routing hub using all Wave 2-4 outputs

### Wave 6: Templates + Scripts + Examples (2 subagents, parallel)
- Agent A: Create all 5 templates + 3 scripts
- Agent B: Write 3 worked examples (P1, P2, P3)

### Wave 7: Validation (1 subagent)
- Run through complete skill creation scenario
- Verify token budgets
- Test progressive disclosure

---

## 8. Success Criteria

| Criterion | Measure | Target |
|-----------|---------|--------|
| SKILL.md line count | `wc -l` | < 500 |
| Frontmatter spec compliance | Only name + description | Pass |
| Cross-file duplication | Shared line count | < 5% |
| Spec coverage | TAB 2-6 requirements met | > 85% |
| Reference file count | Total files | 12 |
| Templates available | Files in templates/ | 5 |
| Scripts available | Files in scripts/ | 3 |
| Examples available | Files in examples/ | 3 |
| Dead links | References to non-existent files | 0 |
| Contradictions | Opposing rules across files | 0 |
