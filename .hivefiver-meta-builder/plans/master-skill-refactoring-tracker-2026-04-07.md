# Master Skill Refactoring Tracker

**Created:** 2026-04-07  
**Branch:** `feature/harness-implementation`  
**Worktree:** `harness-experiment`  
**Last Commit:** `30b4f550` — skill(meta-builder): refactor cycle 2

---

## 1. Boundary Declaration (UNTOUCH)

These files, directories, and concepts are FROZEN. No refactoring, no modification, no experimentation.

### Hard Harness — Completely Off-Limits
| Path | Reason |
|------|--------|
| `src/` | TypeScript runtime code. Ships as `opencode-harness` npm package. Separate concern. |
| `dist/` | Build output. Generated, never edited. |
| `tests/` | Unit test suite. Only modified when runtime code changes. |
| `package.json`, `tsconfig.json`, `vitest.config.ts` | Build configuration. Stable. |

### Third-Party References — Read-Only Patterns
| Source | Reason |
|--------|--------|
| `github.com/gsd-build/get-shit-done` | External reference. Patterns extracted, not modified. |
| `github.com/shynlee04/awesome-copilot` | External reference. Structure studied, not adopted wholesale. |
| `github.com/obra/superpowers` | External reference. Workflow patterns observed, not copied. |

### Governance Documents — Frozen Until Explicitly Unfrozen
| File | Reason |
|------|--------|
| `.hivefiver-meta-builder/AGENTS.md` | Core governance. Taxonomy, iron laws, routing table. Stable. |
| `.hivefiver-meta-builder/distinguish-hivefiver-meta-builder.md` | Entity boundaries. Defines OpenCode vs HiveMind vs Hivefiver vs Hiveminder. |

### Taxonomy Framework — Frozen
| Concept | Reason |
|---------|--------|
| 2×2×2 classification (lineage × hierarchy × orientation) | The lens for all classification. Not a refactoring target. |
| Core lexicon (skill, tool, command, agent, subagent) | Definitions are stable. |
| Iron Laws (7 rules) | Non-negotiable constraints. |
| Routing table | Determines specialist assignment. Stable. |

### What IS Untouch During This Refactoring Cycle
- No new skills created
- No new agents created
- No new commands created
- No changes to `src/` runtime code
- No changes to governance documents (unless explicitly requested)
- No adoption of third-party branding or terminology
- No big-bang rewrites — one skill, one section, one commit at a time

---

## 2. Master Status Board

| # | Skill | Location | Status | Current Phase | Last Commit | Notes |
|---|-------|----------|--------|---------------|-------------|-------|
| 1 | `agents-and-subagents-dev` | `skills-lab/active/refactoring/agents-and-subagents-dev/` | AUDITED | Ready for Phase 4: Refactor | `0aea1711` | 2 HIGH fixes (ses_id triggers, model guidance), 2 MEDIUM (description triggers, worktree reference thin), 2 LOW. 4/6 RED tests pass, 2 weak, 1 NO trigger |
| 2 | `use-authoring-skills` | `skills-lab/active/refactoring/use-authoring-skills/` | AUDITED | Ready for Phase 4: Refactor | `0aea1711` | 6/6 RED tests PASS. CRITICAL: hierarchy dependency violates standalone-first. 2 HIGH (TDD unreachable, extreme case testing missing). 2 MEDIUM (orientations missing, thin references) |
| 3 | `command-dev` | `skills-lab/active/refactoring/command-dev/` | AUDITED | Ready for Phase 4: Refactor | `0aea1711` | 6/6 RED tests trigger but body is DECLARATIVE not PROCEDURAL. 3 HIGH (no workflow, no subtask decision, no GSD patterns). 2 MEDIUM (CI checklist, $ARGUMENTS guidance) |

**Active Pipeline:** `agents-and-subagents-dev` (Phase 1: Inventory)
**Completed Pipelines:** 0
**Domain Pipeline:** NOT YET (requires all 3 single pipelines complete)

---

## 3. Single Pipeline — Per-Skill Refactoring

Each skill moves through these phases sequentially. Only ONE skill in the pipeline at a time.

### Pipeline Template (applies to each skill)

```
Phase 1: Inventory
  - Read frontmatter + first headings only
  - Document current structure (LOC, sections, references)
  - Identify what exists vs what's missing
  - Output: inventory notes in this tracker

Phase 2: RED Tests (Simulated)
  - 6 prompts that SHOULD invoke the skill
  - 4 prompts that should NOT invoke the skill
  - Document where current skill fails each test
  - Output: failure modes listed

Phase 3: Gap Analysis
  - Compare against external patterns (GSD, awesome-copilot, superpowers)
  - Identify structural gaps, trigger gaps, reference gaps
  - Output: gap list with priority

Phase 4: Refactor (One Section at a Time)
  - Fix one section per commit
  - Validate after each change
  - No section skipped
  - Output: committed changes

Phase 5: Validate
  - Triggers work (6 invoke + 4 non-invoke)
  - No dead references
  - Standalone-first check (works with OpenCode alone)
  - Frontmatter compliance
  - Output: validation pass/fail

Phase 6: Commit + Mark Complete
  - Final commit with descriptive message
  - Update status board
  - Move to next skill
```

### Pipeline Execution Order

1. **`agents-and-subagents-dev`** — Foundation. Agent architecture underpins everything else.
2. **`use-authoring-skills`** — Depends on agent patterns being sound. Skill authoring needs to know what a good agent looks like.
3. **`command-dev`** — Depends on both agent and skill patterns. Commands delegate to agents and load skills.

---

### 3.1 agents-and-subagents-dev — AUDIT COMPLETE (hivefiver-skill-author)

**Status:** DONE_WITH_CONCERNS

#### RED Test Results (6 Invoke)
| # | Prompt | Triggers? | Body Handles? | Failure Mode |
|---|--------|-----------|---------------|--------------|
| 1 | "Create an agent for code review" | YES | YES | None — clean pass |
| 2 | "Set up subagent delegation for parallel research" | YES | YES | None — clean pass |
| 3 | "Configure agent temperature and model settings" | PARTIAL | PARTIAL | Temperature covered, model guidance MISSING |
| 4 | "How does mode: all work for agents?" | WEAK | YES | Body has section, description lacks trigger phrase |
| 5 | "Hide this agent from user selection" | WEAK | YES | Body has section, description lacks trigger phrase |
| 6 | "Track delegated sessions with ses_id" | NO | YES | PHANTOM — body teaches it, description never advertises it |

#### Non-Invoke Results (4 Should Not Trigger)
All 4 correctly ignored. No false positives.

#### Reference File Check
- `delegation-protocol.md`: EXISTS + REAL CONTENT (115 lines) ✅
- `worktree-control.md`: EXISTS + THIN (71 lines, below 100-line minimum) ⚠️

#### GENERAL-KNOWLEDGE.md Compliance
| Requirement | Status | Gap |
|-------------|--------|-----|
| mode: "all" | ✅ YES | Dedicated section |
| hidden: true | ✅ YES | Dedicated section |
| subtask: true/false | ✅ YES | Table with behavior |
| ses_idxxxxx tracking | ⚠️ PARTIAL | Body has it, description lacks trigger. Missing glob/resume workflow |
| temperature/model | ⚠️ PARTIAL | Temperature only. Model guidance completely absent |
| agent frontmatter spec | ✅ YES | Required + optional fields |

#### Priority Fixes
1. **[HIGH]** Add ses_id/session tracking trigger phrases to description
2. **[HIGH]** Add model guidance section (which models for which agent types)
3. **[MEDIUM]** Strengthen description: "mode: all", "hide agent", "hidden"
4. **[MEDIUM]** Enrich worktree-control.md (71→100+ lines)
5. **[LOW]** Add subtask to description triggers

---

### 3.2 use-authoring-skills — AUDIT COMPLETE (hivefiver-skill-author)

**Status:** DONE_WITH_CONCERNS

#### RED Test Results (6 Invoke)
| # | Prompt | Triggers? | Body Handles? | Failure Mode |
|---|--------|-----------|---------------|--------------|
| 1 | "Write a skill" | YES | YES | None |
| 2 | "Audit this skill for quality" | YES | YES | None |
| 3 | "My skill description is too vague, optimize it" | YES | YES | None |
| 4 | "Convert this markdown doc into a skill" | YES | YES | None |
| 5 | "Check if my skill overlaps with another" | YES | YES | None |
| 6 | "Write evals for my skill before shipping" | YES | YES | None |

All 6 RED tests PASS. All 4 non-invoke tests PASS.

#### Reference File Check
| File | Lines | Status |
|------|-------|--------|
| 01-skill-anatomy.md | 87 | ⚠️ BELOW 100-line threshold |
| 02-frontmatter-standard.md | 121 | ✅ |
| 03-three-patterns.md | 126 | ✅ |
| 04-tdd-workflow.md | 149 | ✅ but UNREACHABLE from decision tree |
| 05-skill-quality-matrix.md | 164 | ✅ |
| 06-cross-platform-activation.md | 115 | ✅ |
| 07-iterative-refinement.md | 141 | ✅ |
| 08-conflict-detection.md | 73 | ⚠️ BELOW 100-line threshold |
| 09-script-authoring.md | 102 | ✅ |
| 10-eval-lifecycle.md | 147 | ✅ |
| 11-description-optimization.md | 133 | ✅ |
| 12-anti-deception.md | 118 | ✅ |

#### Script Check
All 8 scripts exist with real validation logic. No stubs.

#### GENERAL-KNOWLEDGE.md Compliance
| Requirement | Status | Gap |
|-------------|--------|-----|
| 2 lineages | ⚠️ PARTIAL | Mentioned as dependency, not taught as classification |
| 2 hierarchies | ⚠️ PARTIAL | References critic subagent but doesn't teach hierarchy |
| 2 orientations | ❌ MISSING | Not addressed anywhere |
| agentskills.io principles | ✅ YES | All 6 principles listed |
| TDD workflow | ⚠️ PARTIAL | Reference exists but UNREACHABLE from decision tree |
| Extreme case testing | ❌ MISSING | Zero coverage |

#### CRITICAL: Standalone-First Violation
Lines 43-62 enforce `meta-builder` must exist and route here first. `verify-hierarchy.sh` blocks if meta-builder not loaded. This violates Iron Law #6.

#### Priority Fixes
1. **[CRITICAL]** Remove hierarchy dependency on meta-builder (violates standalone-first)
2. **[HIGH]** Add TDD workflow to decision tree (04-tdd-workflow.md unreachable)
3. **[HIGH]** Add extreme case testing methodology
4. **[MEDIUM]** Add 2 orientations to decision tree
5. **[MEDIUM]** Expand thin reference files (01: 87 lines, 08: 73 lines)
6. **[LOW]** Add lineage classification guidance

---

### 3.3 command-dev — AUDIT COMPLETE (hivefiver-skill-author)

**Status:** DONE_WITH_CONCERNS

#### RED Test Results (6 Invoke)
| # | Prompt | Triggers? | Body Handles? | Failure Mode |
|---|--------|-----------|---------------|--------------|
| 1 | "Create a command" | YES | PARTIAL | DECLARER — says "MUST have" but no procedural steps |
| 2 | "Add a command with arguments" | YES | PARTIAL | POINTER — defers all substance to reference file |
| 3 | "Write a custom command with bash injection" | YES | PARTIAL | BULLET-POINTER — lists !bash but doesn't teach how |
| 4 | "Set up a command with $ARGUMENTS parsing" | YES | PARTIAL | POINTER — no procedural glue for argument design |
| 5 | "Configure command agent with subtask flag" | YES | PARTIAL | DEFINITION — defines subtask but no decision framework |
| 6 | "Make this command survive CI=true" | YES | YES | Strongest section. Minor: no post-write validation checklist |

All 4 non-invoke tests PASS.

#### Reference File Check
- `command-anatomy.md`: EXISTS + REAL CONTENT (119 lines) ✅
- `non-interactive-shell.md`: EXISTS + REAL CONTENT (224 lines) ✅

#### GENERAL-KNOWLEDGE.md Compliance
| Requirement | Status | Gap |
|-------------|--------|-----|
| GSD command patterns | ❌ MISSING | Zero mention of phase parsing, flag precedence |
| $ARGUMENTS injection | ⚠️ PARTIAL | Reference has examples, SKILL.md body only bullet point |
| Deterministic execution | ❌ MISSING | No step-by-step creation workflow |
| subtask: true/false | ⚠️ PARTIAL | Definition but no decision framework |
| @reference includes | ⚠️ PARTIAL | In reference file, not in SKILL.md body |
| CI=true mandates | ✅ YES | Well covered |

#### Priority Fixes
1. **[HIGH]** Add procedural creation workflow (replace declarative with step-by-step)
2. **[HIGH]** Add subtask decision framework (when true vs false)
3. **[HIGH]** Add GSD command patterns (phase parsing, flag precedence)
4. **[MEDIUM]** Add CI=true validation checklist
5. **[MEDIUM]** Strengthen $ARGUMENTS procedural guidance
6. **[LOW]** Add @reference usage guidance to SKILL.md body

---

## 4. Domain Pipeline — Cross-Skill Integration

Only activates after all 3 single pipelines complete.

```
Phase D1: Overlap Detection
  - Identify content duplicated across skills
  - Flag conflicting instructions between skills
  - Output: overlap report

Phase D2: Shared Reference Extraction
  - Identify references that should be shared vs skill-local
  - Extract common patterns into shared reference files
  - Output: shared reference structure

Phase D3: Loading Order Validation
  - Test all valid 2-skill and 3-skill stacks
  - Verify no circular dependencies
  - Verify max 3 per stack rule
  - Output: valid stack configurations

Phase D4: Cross-Skill Trigger Conflict Resolution
  - Ensure no two skills claim the same trigger phrases
  - Verify routing table still works after refactoring
  - Output: trigger conflict report (should be empty)

Phase D5: Integration Validation
  - Full end-to-end test: create skill → create agent → create command
  - Verify all three work together
  - Output: integration pass/fail
```

---

## 5. Execution Log

| Date | Skill | Phase | Action | Commit | Status |
|------|-------|-------|--------|--------|--------|
| 2026-04-07 | — | — | Master tracker created | — | DONE |
| 2026-04-07 | agents-and-subagents-dev | Phase 1-3 | Inventory, RED tests, gap analysis complete | `f8275cfe` | DONE |
| 2026-04-07 | agents-and-subagents-dev | Phase 4 (partial) | Added OpenCode agent config section (mode, hidden, subtask, ses_id) | `f8275cfe` | DONE |
| 2026-04-07 | all 3 skills | Full audit | 3 parallel hivefiver-skill-author audits completed. All 3 DONE_WITH_CONCERNS. 6-4 RED tests run per skill. GENERAL-KNOWLEDGE.md compliance checked. Reference files verified. Scripts verified. | `0aea1711` | DONE |
| 2026-04-07 | — | — | Spec written: meta-builder 5-skill chain design | `0aea1711` | DONE |
| | | | | | |

*Append new entries as work progresses. Most recent first.*

---

## 6. Backlog Inventory

Skills not in the top 3 priority. Listed for future polling.

| Skill | Location | One-Liner | Priority Signal |
|-------|----------|-----------|-----------------|
| `meta-builder` | `.opencode/skills/meta-builder/` | Routing brain — may need sync with updated specialist skills | Medium — depends on specialist updates |
| `coordinating-loop` | `.opencode/skills/coordinating-loop/` | Multi-agent dispatch — may need domain pipeline updates | Low — works until domain pipeline starts |
| `planning-with-files` | `.opencode/skills/planning-with-files/` | Task persistence — third-party, stable | Low — external, not refactoring target |
| `opencode-platform-reference` | `.opencode/skills/opencode-platform-reference/` | Platform docs — may need updates if OpenCode changes | Low — reference skill, follows platform |
| `custom-tools-dev` | `.opencode/skills/custom-tools-dev/` | Tool creation — may need updates after agent/skill refactoring | Medium — depends on agent patterns |
| `command-parser` | `.opencode/skills/command-parser/` | Command argument parsing — may overlap with command-dev | Medium — check for overlap with command-dev |
| `skill-synthesis` | `.opencode/skills/skill-synthesis/` | Skill creation from repos — may need updated authoring patterns | Low — depends on use-authoring-skills |
| `user-intent-interactive-loop` | `.opencode/skills/user-intent-interactive-loop/` | Intent clarification — stable workflow skill | Low — workflow skill, not meta-builder |
| `session-context-manager` | `.opencode/skills/session-context-manager/` | Context persistence — stable | Low — utility skill |
| `repomix-explorer` | `.opencode/skills/repomix-explorer/` | Codebase exploration — third-party pattern | Low — external pattern |
| `repomix-exploration-guide` | `.opencode/skills/repomix-exploration-guide/` | Deep codebase investigation — third-party pattern | Low — external pattern |
| `phase-loop` | `.opencode/skills/phase-loop/` | Loop semantics — stable workflow skill | Low — workflow skill |
| `agent-authorization` | `.opencode/skills/agent-authorization/` | Agent creation guardrails — may need agent pattern updates | Medium — depends on agents-and-subagents-dev |
| `harness-audit` | `.opencode/skills/harness-audit/` | Harness auditing — runtime-specific | Low — runtime concern |
| `harness-delegation-inspection` | `.opencode/skills/harness-delegation-inspection/` | Delegation inspection — runtime-specific | Low — runtime concern |
| `oh-my-openagent-reference` | `.opencode/skills/oh-my-openagent-reference/` | OMO architecture reference — stable reference | Low — reference skill |
| `opencode-non-interactive-shell` | `.opencode/skills/opencode-non-interactive-shell/` | Shell safety — stable utility | Low — utility skill |

---

## 7. Third-Party Skills — Reference Only

These are borrowed tools. They help solve problems but are NOT part of the project's own skill system. They are read for patterns, not refactored.

| Source | Skills Sampled | What We Extract | What We Don't Adopt |
|--------|---------------|-----------------|---------------------|
| `obra/superpowers` | brainstorming, systematic-debugging, test-driven-development, writing-plans, executing-plans, subagent-driven-development, dispatching-parallel-agents, finishing-a-development-branch, using-git-worktrees, verification-before-completion, requesting-code-review, receiving-code-review, using-superpowers | Structural patterns (Overview → When to Use → Process → Red Flags → Integration), trigger language ("Use when X, before Y"), rationalization tables, DOT flowcharts, gerund naming | Branding ("IRON CLAW", "superpowers"), platform-specific tool mappings, specific skill names |
| `shynlee04/awesome-copilot` | cli-mastery, threat-model-analyst, breakdown-plan, context-map | Frontmatter structure (name + description only), reference organization (module-based, orchestrator-based, inline-only), progressive disclosure (L0-L3 layers), trigger strategies (keyword, action words, INVOKE declaration, USE FOR/DO NOT USE FOR) | Training/XP systems, platform-specific features, bundled asset patterns that don't apply |
| `gsd-build/get-shit-done` | 24 agents, command patterns, workflow patterns, template patterns | Command frontmatter (name, description, allowed-tools, agent), YAML frontmatter consistency, $ARGUMENTS injection, flag parsing convention, agent-skills resolution, checkpoint protocol, deterministic execution via CLI tools | GSD-specific CLI tools (gsd-tools.cjs), `.planning/` directory conventions (we have our own), `.claude/` path conventions |

---

## 8. Recovery Protocol

If interrupted or context lost:

1. Read this file — it contains all state
2. Check `git status --short` for uncommitted changes
3. Check `git log --oneline -5` for recent work
4. Resume from the last completed phase in the Execution Log
5. If a skill was mid-refactor, re-run Phase 1 (Inventory) for that skill before continuing

---

*This document is the single source of truth for the refactoring effort. All progress, decisions, and state live here. No other tracking file needed.*
