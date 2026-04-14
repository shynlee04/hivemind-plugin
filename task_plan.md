# Task Plan: Hivefiver Ecosystem Audit

## Goal
Audit and fix entire Hivefiver ecosystem (22 skills, 48 agents, 13 commands, 4 workflows) so every artifact is self-contained, cross-references are resolvable, and the system functions as an interconnected composition.

## User Directives
1. NOTHING gets removed. Everything gets connected. Deletions = debt.
2. Iterate until perfect — don't stop
3. Everything must work as an interconnected system
4. Reference: `docs/meta-builder/distinguish-hivefiver-meta-builder.md`
5. Work location: `.hivefiver-meta-builder/**-lab/` (source of truth)
6. `.opencode/` = symlinks to labs (live testing)

## Session Info
- Session ID: ses_299e (continuation from ses_29a6)
- Worktrees: harness-experiment
- Actual Counts (verified): 22 skills, 48 agents, 13 commands, 4 workflows

## Phases

### Phase 1: Skill Audit
- [ ] TASK-S1: Audit all 22 skills — read SKILL.md, map dependencies, score quality
- [ ] TASK-S2: Identify orphaned skills (no incoming refs)
- [ ] TASK-S3: Map skill-to-skill dependencies
- [ ] TASK-S4: Document skill cross-references
- **Status:** pending

### Phase 2: Agent Audit  
- [ ] TASK-A1: Audit all 48 agents — verify connections, check symlinks
- [ ] TASK-A2: Map agent-to-skill bindings
- [ ] TASK-A3: Identify orphan agents
- [ ] TASK-A4: Verify agent execution paths
- **Status:** pending

### Phase 3: Command Audit
- [ ] TASK-C1: Audit all 13 commands — map chain paths
- [ ] TASK-C2: Verify command-to-agent mappings
- [ ] TASK-C3: Identify broken command references
- [ ] TASK-C4: Document command workflow chains
- **Status:** pending

### Phase 4: Workflow Audit
- [ ] TASK-W1: Audit all 4 workflows — verify execution paths
- [ ] TASK-W2: Map workflow-to-skill/agent/command dependencies
- [ ] TASK-W3: Identify missing connections
- [ ] TASK-W4: Document workflow state transitions
- **Status:** pending

### Phase 5: Dependency Graph
- [ ] TASK-G1: Build unified dependency graph (skills ↔ agents ↔ commands ↔ workflows)
- [ ] TASK-G2: Identify circular dependencies
- [ ] TASK-G3: Find missing links (orphan → connected)
- **Status:** pending

### Phase 6: Fix Broken References
- [ ] TASK-F1: Fix skill cross-references
- [ ] TASK-F2: Fix agent-to-skill bindings
- [ ] TASK-F3: Fix command references
- [ ] TASK-F4: Fix workflow connections
- **Status:** pending

### Phase 7: Connect Orphan Artifacts
- [ ] TASK-O1: Connect orphaned skills to ecosystem
- [ ] TASK-O2: Connect orphaned agents to proper chains
- [ ] TASK-O3: Verify all artifacts have at least 1 incoming ref
- **Status:** pending

### Phase 8: Final Verification
- [ ] TASK-V1: Run full ecosystem validation
- [ ] TASK-V2: Verify all symlinks resolve
- [ ] TASK-V3: Confirm system is interconnected
- **Status:** pending

## Decisions Made
| Decision | Rationale | When |
|----------|-----------|------|
| Nothing removed, everything connected | User directive — removals are debt | Session start |
| Use parallel audit agents | 22+48+13+4 = 87 artifacts — too large for sequential | Session start |
| Skills are source of truth, .opencode is live test | Following user architecture | Session start |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| Previous harness-audit was template garbage | User rejected | Need real execution, not descriptions |
| harness-delegation-inspection was reference encyclopedia | User pushed back | Need actionable delegation protocol |
| Planning files from wrong task (Phase 08) | Read existing files | Reset for this audit task |

## Resources
- `.hivefiver-meta-builder/skills-lab/active/refactoring/` — Source skills
- `.hivefiver-meta-builder/agents-lab/active/refactoring/` — Source agents
- `.hivefiver-meta-builder/commands-lab/active/refactoring/` — Source commands
- `.hivefiver-meta-builder/workflows-lab/active/refactoring/` — Source workflows
- `.opencode/` — Live testing (symlinks to labs)
