# Task Plan: HiveMind V3 — From Experiment to Platform Harness

**Goal:** Transform harness-experiment from a skill-pack-only project into a complete platform harness superior to both GSD and oh-my-openagent — runtime build-on-demand, CLI substrate, eval harness, full OpenCode concept coverage.

**Current Phase:** Phase 2 — Planning & Breakdown (NOT implementation)

## Rogue Agent Incident (2026-04-04)
- Rogue agent misread AGENTS.md, deleted `.kilo/skills/` and `.opencode/` user files
- User reverted via `git reset --hard 54d2300b` (Phase 1 checkpoint)
- Rogue work preserved in `rogue-agent-backup` branch
- LESSON: AGENTS.md "NOT static .md" = development direction for harness engine, NOT permission to nuke user project dirs. `.opencode/` and `.kilo/` are sacred user space.
- SKILLS (.md) are the OpenCode skill contract format — refactoring target, NOT deletion target.

---

## Phases

### Phase 1: Foundation Reset ✅ COMPLETE
- [x] 1a. Rewrite AGENTS.md with full platform governance (271 lines)
- [x] 1b. Thin out PRD to full harness scope (278 lines, F01-F22)
- [x] 1c. Archive violated scripts, extract good patterns
- [x] 1d. Deep research (GSD vs OMO vs npm ecosystem, 272 lines)
- [x] 1e. Planning triplet reset
- **Commit:** 54d2300b

### Phase 2: Planning & Breakdown (CURRENT — PLANNING ONLY)

**Step 1 — Load planning skills:**
- [ ] 2a. Load `breakdown-feature-prd` skill
- [ ] 2b. Load `breakdown-plan` skill

**Step 2 — Archive violated scripts:**
- [ ] 2c. Move to `.archive/` with replacement references and guidance prompting
- [ ] 2d. NOT delete — archive with context

**Step 3 — Extract valid practices from:**
- [ ] 2e. `plans/skill-ecosystem-audit-and-hivemind-v3-readiness/plan.md`
- [ ] 2f. `docs/02_PRD/PRD-01_meta-builder-ecosystem/PRD-01_meta-builder-ecosystem.md`

**Step 4 — Create phase-by-phase execution plan:**
- [ ] 2g. PRDs and epics for each phase
- [ ] 2h. Reference archived materials, NOT bring them forward into active codebase

**Status:** in_progress (Phase 2 context captured for GSD planning; planning documents only, NO code)

### Phase 3: Runtime Harness Synthesis & Implementation (PLANNING)

**DO NOT refactor or migrate product-detox yet. Focus on correctly structuring harness-experiment with proper runtime capabilities.**

- [ ] 3a. PRD: On-demand runtime construction (agents call agents, dynamic prompts, runtime command parsing, background agent execution, code run factory pattern, runtime composition of meta concepts)
- [ ] 3b. PRD: Full autonomy features (synthesize from OMO features.md — auto-loop, delegation chain, task persistence, task queuing, autonomous decision-making)
- [ ] 3c. Epic: Deep synthesis & reflection — analyze current harness-experiment trash/failed attempts, identify what went wrong in prior agent interpretations, extract valid patterns that align with clean architecture, achieve mindset shift
- [ ] 3d. Validate: Plugin layer thin (<100 LOC assembly only), Tools (write-side, 5 core, Zod schemas), Hooks (read-side, observation only), Shared (leaf module, no deps)
- **Status:** pending (awaiting Phase 2 planning)

### Phase 4: Master Plan & Checkpoint (PLANNING)

- [ ] 4a. Comprehensive master plan with file tracking for all phases
- [ ] 4b. Document synthesis learnings and architectural decisions
- [ ] 4c. Validate runtime harness implementation against requirements
- [ ] 4d. Prepare clean harness-experiment as migration source (NOT product-detox)
- [ ] 4e. COMMIT CHECKPOINT with detailed report:
  - Governance establishment results
  - Archived violations count and references
  - Runtime harness implementation status
  - Synthesis insights from OMO features
  - Readiness assessment for product-detox migration
  - Next phase recommendations
- **Status:** pending (awaiting Phase 3)

### Phase 5: CLI Substrate + Eval Harness (IMPLEMENTATION — AFTER PLANNING)
- [ ] 5a. Create bin/hivemind-tools.cjs central router
- [ ] 5b. Create bin/lib/ domain modules
- [ ] 5c. Wire eval harness into CLI
- [ ] 5d. Dual packaging (package.json, npm)
- **Status:** pending (BLOCKED until Phases 2-4 complete + user approval)

### Phase 6: Selective Migration (IMPLEMENTATION — AFTER EVERYTHING)
- [ ] 6a. Port validated skills to new architecture
- [ ] 6b. Eliminate product-detox bloat (67% reduction)
- [ ] 6c. Final validation + release v3.0.0
- **Status:** pending (BLOCKED until Phase 5 complete)

### Phase 7: Hivefiver Skill Audit + Fix (2026-04-07)
**Goal:** Fix 4 broken skills + validate 3 agents + fix playbook. All must pass HIVEFIVER-PLAYBOOK rules and universal-rules.md.

**Audit Results (2026-04-07):**
- session-context-manager: NEEDS_FIX (hardcoded .hivemind/state/ paths, --constraint GSD flags)
- phase-loop: NEEDS_FIX (space-separated allowed-tools, TS pseudo-code, no read pattern, generic roles)
- command-parser: NEEDS_REWRITE (60% JS pseudo-code, GSD refs, YAML format, no read pattern)
- agent-authorization: NEEDS_FIX (space-separated allowed-tools, task_plan.md dep, hardcoded specialist names, arbitrary thresholds)
- intent-loop agent: CLEAN (0 defects)
- spec-verifier agent: CLEAN (0 defects)
- phase-guardian agent: CLEAN (0 defects)
- HIVEFIVER-PLAYBOOK: NEEDS_FIX (instruction vs instructions, phantom name field, missing steps field)
- System integration: FRAGMENTED (2 orphaned skills, broken cross-refs, state path split)

**Fix Tasks:**
- [x] 7a. Fix session-context-manager — workspace-relative paths, remove --constraint flags, add read pattern
- [x] 7b. Fix phase-loop — YAML allowed-tools, remove TS code, add read pattern, fix generic roles
- [ ] 7c. Fix command-parser — rewrite as prose (no JS), remove GSD refs, add read pattern
- [x] 7d. Fix agent-authorization — YAML format, remove task_plan.md hard dep, mark specialist names as examples, soften thresholds
- [x] 7e. Fix HIVEFIVER-PLAYBOOK — instruction→instructions, remove phantom name field, add steps field, fix allowed-tools format
- [ ] 7f. Fix integration — broken cross-refs (meta-builder agent, phase-history.json), state bridge
- [ ] 7g. System-wide re-validation — all 7 artifacts + playbook pass together

**Status:** in_progress (4 of 7 fixes complete)

---

## Key Decisions (LOCKED)

| Decision | Locked Answer |
|----------|---------------|
| Project scope | Full platform harness, NOT just skill packs |
| Agent definitions | Runtime build-on-demand, NOT static .md files |
| CLI architecture | Centralized Node.js router (like gsd-tools.cjs) |
| Distribution | Dual: npm SDK + npx git installs |
| Runtime features | Background agents, auto-loop, delegation chains, task queuing, categories |
| Benchmark | Superior to both GSD and oh-my-openagent |
| User directories (.opencode/, .kilo/) | SACRED — never modify without explicit user intent |
| Skills (.md format) | Valid OpenCode contract — refactoring target, not deletion target |

## Errors Encountered

| Error | Cause | Resolution |
|-------|-------|------------|
| Rogue agent deleted user skills | Misread AGENTS.md "NOT static .md" as permission to nuke | `git reset --hard 54d2300b`, branch `rogue-agent-backup` |
| Premature Phase 2 implementation | Coordinator jumped to code instead of planning | Reverted, restructured as planning-only |
| Stale planning files at root | Old skill-pack-era content (Phase 3 validation gate) | Updating now to reflect Phase 1→2 transition |
