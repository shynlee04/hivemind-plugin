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
| 1 | `agents-and-subagents-dev` | `skills-lab/active/refactoring/agents-and-subagents-dev/` | IN_PROGRESS | Phase 1: Inventory | — | 97 LOC. 2 reference dirs (delegation-protocol.md, worktree-control.md — NOT YET VERIFIED EXIST). Frontmatter: metadata layer/role/pattern/version + allowed-tools. Has Iron Law, rationalization table, delegation protocol, status protocol, worktree control, validation gate, anti-patterns. MISSING: OpenCode-specific agent config (mode: "all", hidden: true, subtask:), session ID tracking (ses_idxxxxx), agent frontmatter spec, temperature/model guidance |
| 2 | `use-authoring-skills` | `skills-lab/active/refactoring/use-authoring-skills/` | NOT_STARTED | — | — | 266 LOC. Full package: references/ (14 files), scripts/ (8 scripts), evals/, hooks/, templates/. Frontmatter: metadata layer/role/pattern/version + allowed-tools. Has Iron Law, hierarchy enforcement, decision tree, agentskills.io principles, validation loop, gate system, worked example, anti-patterns, platform adaptation, scripts table, validation gate. STRONGEST of the 3. May need: trigger phrase density check, eval lifecycle completeness |
| 3 | `command-dev` | `skills-lab/active/refactoring/command-dev/` | NOT_STARTED | — | — | 80 LOC. 2 reference dirs (non-interactive-shell.md, command-anatomy.md — NOT YET VERIFIED EXIST). Frontmatter: metadata layer/role/pattern/version + allowed-tools. Has Iron Law, rationalization table, on-load instructions, command anatomy, non-interactive shell mandates, anti-patterns. MISSING: GSD-style command patterns (phase parsing, flag precedence, @reference includes), $ARGUMENTS parsing patterns, deterministic execution flow, delegation to workflows |

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

### 3.1 agents-and-subagents-dev — RED Test Cases (Phase 2 Complete)

#### 6 Prompts That SHOULD Invoke This Skill

| # | Prompt | Expected Behavior | Current Skill Handles? |
|---|--------|-------------------|----------------------|
| 1 | "Create an agent for code review" | Load skill, show agent frontmatter spec, delegation pattern | PARTIAL — knows delegation, missing frontmatter spec |
| 2 | "Set up subagent delegation for parallel research" | Load skill, show dispatch envelope, worktree isolation | YES — delegation protocol covered |
| 3 | "Configure agent temperature and model settings" | Load skill, show temperature/model guidance | NO — not mentioned anywhere |
| 4 | "How does mode: all work for agents?" | Load skill, explain mode: "all" for main+subagent | NO — OpenCode-specific config missing |
| 5 | "Hide this agent from user selection" | Load skill, explain hidden: true flag | NO — OpenCode-specific config missing |
| 6 | "Track delegated sessions with ses_id" | Load skill, explain session ID tracking pattern | NO — ses_idxxxxx pattern not covered |

#### 4 Prompts That Should NOT Invoke This Skill

| # | Prompt | Why Not | Current Skill Would Misfire? |
|---|--------|---------|---------------------------|
| 1 | "Create a skill for TDD workflows" | This is skill authoring, not agent creation | NO — description is specific enough |
| 2 | "Write a command that parses arguments" | This is command development, not agent definition | NO — description is specific enough |
| 3 | "Build a NextJS app" | This is project building, not meta-concept | NO — clearly out of scope |
| 4 | "Fix this TypeScript bug" | This is implementation, not agent architecture | NO — clearly out of scope |

#### Gap Analysis (Phase 3)

| Gap | Priority | Fix Required |
|-----|----------|-------------|
| No OpenCode agent frontmatter spec (mode, hidden, subtask, color, tools) | HIGH | Add section with OpenCode-specific agent config |
| No session ID tracking (ses_idxxxxx pattern) | HIGH | Add section on session resume for delegated agents |
| No temperature/model guidance | MEDIUM | Add section on model selection per agent tier |
| No taxonomy classification (2×2×2) | LOW | Add where this skill sits in the matrix |
| Reference files exist but not verified for OpenCode compatibility | MEDIUM | Verify delegation-protocol.md and worktree-control.md reference OpenCode patterns, not Claude Code |
| No agent profile structure examples | MEDIUM | Add worked example of a complete agent definition |

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
| 2026-04-07 | agents-and-subagents-dev | Phase 1: Inventory | Full inventory complete. 97 LOC. 2 reference files exist (delegation-protocol.md 4.1K, worktree-control.md 1.9K). Frontmatter: name, description, metadata (layer/role/pattern/version), allowed-tools. Body: Iron Law, rationalization table, On Load, Delegation Protocol, Status Protocol, Worktree Control, Validation Gate, Anti-Patterns. Gaps identified: no OpenCode agent config (mode/hidden/subtask), no session ID tracking, no agent frontmatter spec, no temperature/model guidance, no taxonomy classification | — | DONE |
| 2026-04-07 | agents-and-subagents-dev | Phase 2: RED Tests | 6 invoke + 4 non-invoke test cases defined (see Section 3.1) | — | DONE |
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
