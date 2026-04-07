# Task Plan: Hivefiver Ecosystem Audit & Integration

## Goal
Audit and connect the entire Hivefiver ecosystem (20 skills, 21 agents, 11 commands, 4 workflows) so every artifact is self-contained, cross-references are resolvable, and the system functions as an interconnected composition. **Nothing gets removed — everything gets connected.**

## Current Phase
Phase 1: Audit All Skills

## Phases

### Phase 1: Audit All 20 Skills
- [ ] Read every SKILL.md file
- [ ] Map which agents reference each skill
- [ ] Map which commands trigger each skill
- [ ] Map which workflows execute each skill
- [ ] Map inter-skill references
- [ ] Score each skill on self-containment (can it work alone?)
- [ ] Score each skill on trigger quality (natural language activators?)
- [ ] Score each skill on cross-platform compatibility (no hardcoded paths?)
- [ ] Identify broken/stale cross-references
- [ ] Output: `docs/audit/skill-audit.md`
**Status:** in_progress

### Phase 2: Audit All 21 Agents
- [ ] Read every agent definition
- [ ] Check each agent appears in at least one: skill routing table, command $ARGUMENTS, workflow step, or other agent's delegation config
- [ ] Identify orphan agents (no connections)
- [ ] Score each agent on integration quality
- [ ] Output: `docs/audit/agent-audit.md`
**Status:** pending

### Phase 3: Audit All 11 Commands
- [ ] Read every command definition
- [ ] Map input/output chains between commands
- [ ] Identify merge candidates (commands that do similar things)
- [ ] Document chaining paths
- [ ] Output: `docs/audit/command-audit.md`
**Status:** pending

### Phase 4: Audit All 4 Workflows
- [ ] Read every workflow definition
- [ ] Verify each workflow references valid skills/agents/commands
- [ ] Verify end-to-end execution paths
- [ ] Output: `docs/audit/workflow-audit.md`
**Status:** pending

### Phase 5: Build Dependency Graph
- [ ] Create complete cross-reference matrix
- [ ] Identify all broken references
- [ ] Identify all missing connections
- [ ] Output: `docs/audit/dependency-graph.md`
**Status:** pending

### Phase 6: Fix Broken References
- [ ] Fix every broken cross-reference in skills
- [ ] Fix every broken cross-reference in agents
- [ ] Fix every broken cross-reference in commands
- [ ] Fix every broken cross-reference in workflows
- [ ] Commit after each batch of fixes
**Status:** pending

### Phase 7: Connect Orphan Agents
- [ ] For each orphan agent, determine the right connection point
- [ ] Wire orphan agents into skills, commands, workflows, or other agents
- [ ] If no valid connection exists, document why (but don't delete)
- [ ] Commit after each agent connection
**Status:** pending

### Phase 8: Final Verification
- [ ] Re-audit all 20 skills — confirm self-contained
- [ ] Re-audit all 21 agents — confirm connected
- [ ] Re-audit all 11 commands — confirm chained
- [ ] Re-audit all 4 workflows — confirm executable
- [ ] Re-verify all cross-references — confirm resolvable
- [ ] Output: `docs/audit/final-verification.md`
**Status:** pending

## Decisions Made
| Decision | Rationale | When |
|----------|-----------|------|
| Nothing gets removed | User directive — removals are debt | Session start |
| Audit phases are read-only | Prevent accidental damage before plan approved | Phase 1 |
| Fix phases commit per-artifact | Easy rollback if something breaks | Phase 6+ |
| Memory in .hivemind/state/ | Cross-session persistence | Session start |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| Previous harness-audit was template garbage | User rejected | Real execution only |
| harness-delegation-inspection was encyclopedia | User pushed back | Need actionable protocol |
