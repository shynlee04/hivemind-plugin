# Skill Ecosystem Audit & HiveMind V3 Readiness Plan

**Branch:** `skill-ecosystem-audit-hivemind-v3-readiness`
**Description:** Audit existing 5 skill packs, fix systematic gaps, create 4 new skills for HiveMind V3 TypeScript module authoring, and produce a structured-autonomy-plan for the full migration.

## Goal

The 5 refactored skill packs (meta-builder, user-intent-interactive-loop, planning-with-files, coordinating-loop, use-authoring-skills) are structurally sound but have 3 categories of gaps that will cause failures when used as a runtime chain for the HiveMind V3 TypeScript project: (1) routing bugs in meta-builder's preflight.sh, (2) missing TypeScript-specific authoring skills, and (3) shallow eval coverage. This plan fixes the bugs, creates the missing skills, and produces a migration plan aligned with the HiveMind V3 architecture proposal.

## Implementation Steps

### Step 1: Fix meta-builder preflight.sh routing bugs
**Files:** `.skills-lab/refactoring-skills/meta-builder/scripts/preflight.sh`
**What:** Fix 3 bugs identified in eval: (a) multi-intent regex priority — "create a skill AND coordinate agents" matches skill-creator instead of detecting coordination intent; fix by checking compound intent patterns first. (b) Default questions_allowed=2 on line 75 should be 3 for GROUP_1 vague intent paths. (c) Add "not my domain" rejection path — when request has no skill/agent/command/tool creation intent (like "fix the bug"), exit 1 with clear message instead of routing to user-intent-interactive-loop.
**Testing:** Re-run eval harness `bash .skills-lab/refactoring-skills/eval-harness/run-all.sh` — TC-002, TC-004, TC-005 must pass.

### Step 2: Fix eval harness assertion mismatches
**Files:** `.skills-lab/refactoring-skills/eval-harness/eval_runner.py`, `.skills-lab/refactoring-skills/eval-harness/fixtures/*/`
**What:** Fix assertion regex patterns that don't match actual script output format. user-intent-interactive-loop TC-001/004/005 fail due to fixture issues (pre-populated intent.json bypassing PROBE phase). planning-with-files TC-002/004 fail due to case-sensitive regex mismatches. coordinating-loop TC-002 expects exit 2 but gets exit 1 due to check order. Add behavior-based assertions that verify files were created, scripts were run, and state was updated — not just stdout string matching.
**Testing:** Re-run eval harness — all 40 tests should pass with meaningful assertions.

### Step 3: Create `typescript-module-architect` skill
**Files:** `.skills-lab/refactoring-skills/typescript-module-architect/SKILL.md`, `references/`, `scripts/`, `evals/`
**What:** New skill covering HiveMind V3 TypeScript module design: 500 LOC max per module, no circular dependencies, CQRS pattern (tools=write, hooks=read), Zod schema validation, tool factory functions, hook read-only constraints, plugin assembly <100 LOC. Include references for: module boundary rules, dependency graph validation, CQRS enforcement, boundary check scripts.
**Testing:** Create eval harness with 8 test cases covering module sizing, circular dependency detection, CQRS pattern validation.

### Step 4: Create `use-authoring-tools` skill
**Files:** `.skills-lab/refactoring-skills/use-authoring-tools/SKILL.md`, `references/`, `scripts/`, `evals/`
**What:** New skill for OpenCode custom tool authoring: `tool()` helper pattern, multi-file tool registration, context/argument handling, Zod validation schemas, JSON string returns, tool factory functions. Align with HiveMind V3's 5 target tools (runtime_status, runtime_command, delegation, trajectory, task). Include references for: tool anatomy, Zod schema patterns, factory function templates, validation scripts.
**Testing:** Create eval harness with 6 test cases covering tool creation, schema validation, factory patterns.

### Step 5: Create `use-authoring-hooks` skill
**Files:** `.skills-lab/refactoring-skills/use-authoring-hooks/SKILL.md`, `references/`, `scripts/`, `evals/`
**What:** New skill for OpenCode hook authoring: 46 lifecycle hooks across 8 interception points, read-only enforcement (no state mutations), event subscription patterns, context injection, synthetic message handling. Align with HiveMind V3's 4 hooks (event-handler, start-work, soft-governance, sdk-context). Include references for: hook taxonomy, read-only constraints, event handler patterns, context injection recipes.
**Testing:** Create eval harness with 6 test cases covering hook creation, read-only validation, event patterns.

### Step 6: Expand `meta-builder/04-hivemind-compatibility.md`
**Files:** `.skills-lab/refactoring-skills/meta-builder/references/04-hivemind-compatibility.md`
**What:** Expand from 55 lines to 200+ lines with concrete routing for: TypeScript tool creation (→ use-authoring-tools), hook authoring (→ use-authoring-hooks), plugin assembly (→ typescript-module-architect), migration workflow (→ migration-workflow). Add worked examples for each routing path. Add stacking recipes that include the new skills.
**Testing:** Run preflight.sh with HiveMind V3-specific prompts to verify correct routing.

### Step 7: Create `migration-workflow` skill
**Files:** `.skills-lab/refactoring-skills/migration-workflow/SKILL.md`, `references/`, `scripts/`, `evals/`
**What:** New skill for the 4-phase HiveMind V3 migration: Phase 1 (Port harness-experiment core), Phase 2 (Eliminate product-detox bloat), Phase 3 (Simplify plugin entry), Phase 4 (Establish clean boundaries). Include: feature flag patterns, rollback protocols, parallel old/new implementations, boundary enforcement scripts (check-module-size.sh, check-plugin-size.sh, check-circular-deps.sh, check-tool-count.sh).
**Testing:** Create eval harness with 4 test cases covering each migration phase.

### Step 8: Add end-to-end chain test to eval harness
**Files:** `.skills-lab/refactoring-skills/eval-harness/chain-evals/chain-5.json` (new), `eval_runner.py` (update)
**What:** Add a chain eval that tests the full LAYER 0 → 1 → 2 → 3 → 4 chain with a real HiveMind V3 task (e.g., "create a new tool for runtime status inspection"). The chain eval should: (1) meta-builder routes correctly, (2) user-intent confirms scope, (3) planning-with-files creates phases, (4) coordinating-loop dispatches, (5) use-authoring-tools creates the tool. Verify files created at each step.
**Testing:** Run chain eval — must pass all 5 layer transitions.

### Step 9: Update planning-with-files for migration task type
**Files:** `.skills-lab/refactoring-skills/planning-with-files/SKILL.md`, `references/01-file-structure.md`
**What:** Add "Migration" task type to the phase generation table with phases: Analyze → Port → Test → Eliminate → Verify. Add migration-specific success criteria and rollback tracking to the file schema.
**Testing:** Run check-complete.sh against a migration task_plan.md fixture.

### Step 10: Add ralph-loop TypeScript recipe to coordinating-loop
**Files:** `.skills-lab/refactoring-skills/coordinating-loop/references/04-ralph-loop-integration.md`
**What:** Add a ralph-loop recipe for TypeScript development: `compile → test → lint → fix → repeat` cycle with gate checks at each step. Include: tsc compilation gate, Jest/Vitest test gate, ESLint gate, boundary check gate (module size, circular deps).
**Testing:** Run the ralph-loop script against a TypeScript module fixture.

### Step 11: Produce structured-autonomy-plan for HiveMind V3 migration
**Files:** `plans/hivemind-v3-migration/plan.md`
**What:** Create a detailed implementation plan for the full HiveMind V3 migration, broken into commits. Each commit corresponds to a testable step. The plan should cover: (1) Create src/ module structure, (2) Port delegation logic, (3) Port session lifecycle, (4) Port continuity stores, (5) Consolidate agent-work-contract, (6) Simplify runtime-entry, (7) Eliminate doc-intelligence, (8) Merge tools 11→5, (9) Simplify plugin entry <100 LOC, (10) Add boundary enforcement scripts, (11) Delete old features, (12) Final cleanup and publish.
**Testing:** Review plan against architecture-proposal-hivemind-v3.md for completeness.

### Step 12: Commit all changes and update SOT docs
**Files:** `.skills-lab/task_plan.md`, `.skills-lab/progress.md`, `.skills-lab/findings.md`
**What:** Update all three SOT documents with the new skill inventory, eval results, and migration plan status. Commit all changes with descriptive messages. Run `bash .skills-lab/refactoring-skills/eval-harness/run-all.sh` one final time to confirm all 40+ tests pass.
**Testing:** Final eval run — all tests pass. All SOT docs updated. All changes committed.

## Success Criteria

- [ ] All 40 existing eval tests pass (currently 32/40)
- [ ] 4 new skills created with eval harnesses (typescript-module-architect, use-authoring-tools, use-authoring-hooks, migration-workflow)
- [ ] meta-builder preflight.sh routing bugs fixed
- [ ] End-to-end chain test passes (LAYER 0 → 4)
- [ ] HiveMind V3 migration plan created in plans/
- [ ] All SOT docs updated
- [ ] All changes committed to git

## Dependencies

- Steps 1-2 are independent (bug fixes)
- Steps 3-7 are independent (new skills) but depend on Step 1 (routing must work for new skills)
- Step 8 depends on Steps 1-7 (chain test needs all skills)
- Step 9 depends on Step 7 (migration skill must exist)
- Step 10 depends on Step 3 (TypeScript module architect must exist)
- Step 11 depends on all previous steps
- Step 12 depends on all previous steps

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| New skills have overlapping triggers with existing skills | Medium | Medium | Run check-overlaps.sh for each new skill before integration |
| Eval harness fixtures need significant restructuring | Low | Medium | Create new fixture directories, don't modify existing ones |
| HiveMind V3 migration plan scope is too large | Medium | High | Break into sub-plans per migration phase |
| TypeScript module architect skill requires deep OpenCode SDK knowledge | Medium | High | Research OpenCode SDK docs during Step 3 |
