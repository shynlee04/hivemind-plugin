# Task Plan: HiveMind V3 — From Experiment to Platform Harness

**Goal:** Transform harness-experiment from a skill-pack-only project into a complete platform harness that is superior to both GSD and oh-my-openagent — with runtime build-on-demand, CLI substrate, eval harness, and full OpenCode concept coverage.

**Current Phase:** Phase 1 — Foundation Reset

## Phases

### Phase 1: Foundation Reset (CURRENT)
- [ ] 1a. Rewrite AGENTS.md with full platform governance
- [ ] 1b. Thin out PRD to full harness scope (not just skills)
- [ ] 1c. Archive violated scripts, extract good patterns
- **Status:** in_progress

### Phase 2: CLI Substrate
- [ ] 2a. Create bin/hivemind-tools.cjs central router (modeled after gsd-tools.cjs)
- [ ] 2b. Create bin/lib/ domain modules (core, state, skill, eval, scaffold, config)
- [ ] 2c. Port validated bash scripts to Node.js CLI commands
- **Status:** pending

### Phase 3: Runtime Composition Engine
- [ ] 3a. Implement runtime build-on-demand (agents compose prompts, parse commands)
- [ ] 3b. Implement background agent execution
- [ ] 3c. Implement delegation chain with task persistence across sessions
- [ ] 3d. Implement task queuing (autonomous execution)
- **Status:** pending

### Phase 4: Category System + Session Recovery
- [ ] 4a. Port oh-my-openagent category system (domain-specific agent presets)
- [ ] 4b. Implement session recovery (automatic state reconstruction)
- [ ] 4c. Implement ralph-loop / ulw-loop patterns
- **Status:** pending

### Phase 5: Eval Harness + Dual Packaging
- [ ] 5a. Rebuild eval harness integrated into CLI (hivemind-tools eval run)
- [ ] 5b. Create package.json with bin field, npm keywords, peerDependencies
- [ ] 5c. Validate full ecosystem (>95% eval pass rate)
- **Status:** pending

### Phase 6: Selective Migration
- [ ] 6a. Port validated harness-experiment skills to new architecture
- [ ] 6b. Eliminate product-detox bloat (67% reduction)
- [ ] 6c. Final validation + release v3.0.0
- **Status:** pending

## Key Decisions (LOCKED)

| Decision | Locked Answer |
|----------|---------------|
| Project scope | Full platform harness, NOT just skill packs |
| Agent definitions | Runtime build-on-demand, NOT static .md files |
| CLI architecture | Centralized Node.js router (like gsd-tools.cjs) |
| Distribution | Dual: npm SDK + npx git installs |
| Runtime features | Background agents, auto-loop, delegation chains, task queuing, categories |
| Benchmark | Superior to both GSD and oh-my-openagent |

## Errors Encountered

| Error | Attempt | Resolution |
|-------|---------|------------|
| (none yet for this phase) | - | - |
