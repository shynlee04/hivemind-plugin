---
version: 3.0
pipeline: prompt-enhance-repackage
generated: 2026-04-07
complexity_before: 8
complexity_after: 5
confidence: high
phases_completed: [skim, bridge, investigation, clarification]
parent_session: ses_29a6
prompt_lineage: v1(original) → v2(2026-04-06) → v3(this)

# Execution model
exit_criteria: skill_judge_score_100_percent
execution_order: skills_then_agents_then_commands_then_workflows
loop_pattern: sequential_per_artifact
progressive_disclosure: required

# On-disk counts (verified 2026-04-07)
skills_count: 20
agents_count: 22
commands_count: 11
workflows_count: 4

# Risk flags
uncommitted_files: 70
eval_harness_symlink: broken
oh_my_openagent_xml: 11MB context_bomb_at_skills_references
---

# Enhanced Session Context Prompt v3

Audited-then-clarified plan for the 2nd-iteration improvement of the Hivefiver
ecosystem in harness-experiment. This prompt replaces the v2 plan entirely — all
phases are re-scoped around the user's clarified priorities.

---

<intent>

Perform a 2nd-iteration quality improvement of every skill, agent, command, and
workflow in the .opencode/ directory so the entire ecosystem functions as a
unified, cross-referencing system. Each artifact must be audited against the
skill-judge framework, refactored until it scores 100%, then move to the next
artifact. No placeholder content. No "nothingness" skills. Professional quality
only — each skill must know what it is meant to do and do it completely.

</intent>

---

<scope>

## Priority Order (non-negotiable)

1. **Skills** (20 on disk) — audit → refactor → re-audit → next
2. **Agents** (22 on disk) — only after all skills reach 100%
3. **Commands** (11 on disk) — only after all agents are validated
4. **Workflows** (4 on disk) — only after all commands are validated

Each priority tier gates the next. No parallel work across tiers.

## Boundaries

- **In scope**: All .opencode/ artifacts (skills/, agents/, commands/, workflows/)
- **In scope**: All .hivefiver-meta-builder/ lab source files that feed into .opencode/
- **In scope**: Progressive disclosure enforcement in all skill content
- **Out of scope**: src/ TypeScript source code (hard harness — separate concern)
- **Out of scope**: New feature development (this is quality improvement, not greenfield)
- **Out of scope**: Deletion of functional connected artifacts (stale refs can be updated)

</scope>

---

<constraints>

## Iron Rules

1. **Sequential execution**: One artifact at a time. Complete its audit-refactor cycle
   before touching the next.

2. **Exit criteria per artifact**: The skill-judge framework (8 dimensions, 120 points)
   must return 100% before advancing. If 100% is unreachable for a valid reason
   (e.g., platform limitation), document the exception and get user sign-off.

3. **Progressive disclosure**: Every skill must follow progressive disclosure —
   frontmatter metadata, then concise description, then detailed content layers.
   No wall-of-text SKILL.md files.

4. **No placeholder content**: Every skill must contain real implementation value.
   If a skill exists only to route to another skill, it must justify its existence
   with unique value (trigger patterns, context enrichment, platform adaptation).

5. **Cross-reference integrity**: All internal references (agent mentions, skill
   triggers, command chains, workflow steps) must resolve to artifacts that exist
   on disk. No dead links, no aspirational references.

6. **Pre-flight checkpoint**: Before starting any modification, verify git status.
   If >20 uncommitted files exist, commit a checkpoint first.

7. **No concurrent writes**: Only one agent modifies files at a time. Sequential
   wave execution enforced.

8. **Context bomb avoidance**: The file at `.opencode/skills/oh-my-openagent-reference/
   references/oh-my-openagent-full.xml` is 11MB (276K lines). NEVER read it fully.
   Use grep, regex, or chunked offset reads only.

9. **Symlink awareness**: .opencode/ files are REAL COPIES, not symlinks to labs.
   Changes in .opencode/ must be manually synced to .hivefiver-meta-builder/ labs
   if the lab is the canonical source.

10. **Planning triplet**: Update findings.md, progress.md, and task_plan.md at
    every phase boundary.

</constraints>

---

<artifacts>

## Skills (20 on disk, priority tier 1)

| # | Directory | Notes |
|---|-----------|-------|
| 1 | agent-authorization | Authorization framework for agent creation |
| 2 | agents-and-subagents-dev | Agent architecture and subagent dispatch |
| 3 | command-dev | Slash command development |
| 4 | command-parser | $ARGUMENT propositional command parsing |
| 5 | coordinating-loop | Multi-agent orchestration with validation gates |
| 6 | custom-tools-dev | OpenCode plugin SDK and custom tool architecture |
| 7 | harness-audit | Full OpenCode project audit |
| 8 | harness-delegation-inspection | Subagent patterns and delegation protocols |
| 9 | meta-builder | Meta-skill for creating/editing skills |
| 10 | oh-my-openagent-reference | ⚠️ Contains 11MB XML — grep only |
| 11 | opencode-non-interactive-shell | Shell command safety for agents |
| 12 | opencode-platform-reference | OpenCode platform capabilities reference |
| 13 | phase-loop | Iterative phase execution loop semantics |
| 14 | planning-with-files | 3-file external memory for multi-step tasks |
| 15 | repomix-exploration-guide | Deep codebase investigation with Repomix |
| 16 | repomix-explorer | Codebase analysis via Repomix CLI |
| 17 | session-context-manager | Session context persistence across phases |
| 18 | skill-synthesis | Skill creation from GitHub repos |
| 19 | use-authoring-skills | Authoring skills frontmatter and patterns |
| 20 | user-intent-interactive-loop | Long session and requirement probing |

## Agents (22 on disk, priority tier 2)

Located at .opencode/agents/*.md — audited after all skills reach 100%.

## Commands (11 on disk, priority tier 3)

Located at .opencode/commands/*.md — audited after all agents are validated.

## Workflows (4 on disk, priority tier 4)

Located at .hivefiver-meta-builder/workflows-lab/ — audited last.

## Known Broken Items

- `.opencode/skills/eval-harness` — symlink points to `../../.agents/skills/eval-harness`
  which resolves to `/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.agents/skills/eval-harness`
  — target does not exist on disk. This symlink must be removed or fixed before
  the skills tier begins.

</artifacts>

---

<references>

## Knowledge Sources

| Source | Location | Access Method |
|--------|----------|---------------|
| skill-judge framework | Installed at ~/.agents/skills/skill-judge/ | `skill` tool — load "skill-judge" |
| oh-my-openagent patterns | .opencode/skills/oh-my-openagent-reference/ | `skill` tool OR grep on SKILL.md only |
| oh-my-openagent-full.xml | .opencode/skills/oh-my-openagent-reference/references/ | ⚠️ grep/chunked reads ONLY — 11MB |
| OpenCode platform reference | .opencode/skills/opencode-platform-reference/ | `skill` tool |
| Meta-builder concept | docs/meta-builder/distinguish-hivefiver-meta-builder.md | `read` tool |
| Onboarding protocol | docs/meta-builder/updating-for-hivefiver-onboarding.md | `read` tool |
| Architecture proposal | docs/draft/architecture-proposal-hivemind-v3.md | `read` tool |
| GSD reference (if needed) | /tmp/gsd-full/ (may need re-clone) | `bash` + `read` tool |
| Previous audit report | docs/audit/command-workflow-audit.md | `read` tool |
| Dependency graph | docs/audit/dependency-graph.md | `read` tool |
| Previous implementation plan | .hivefiver-meta-builder/plans/prompt-enhance-implementation-plan-2026-04-07.md | `read` tool |
| Lab source files | .hivefiver-meta-builder/{skills,agents,commands,workflows}-lab/ | `read` tool |

## skill-judge Dimensions (8, 120 points max)

1. Trigger Accuracy (15 pts) — Does the description trigger correctly?
2. Progressive Disclosure (15 pts) — Layered content structure?
3. Cross-Platform Compatibility (15 pts) — Works across Claude Code, Copilot, Gemini?
4. Content Quality (20 pts) — Real implementation value, not filler?
5. Error Handling (15 pts) — Graceful failure modes documented?
6. Integration (15 pts) — References resolve, dependencies clear?
7. Maintainability (15 pts) — Versioned, documented, updateable?
8. Self-Description (10 pts) — Knows what it is and what it does?

</references>

---

<execution_plan>

## Pre-Flight (gate 0)

1. Run `git status --short` — if >20 uncommitted files, commit a checkpoint
   with message: `checkpoint: pre-2nd-iteration-audit — 70 uncommitted files`
2. Remove or fix broken eval-harness symlink at `.opencode/skills/eval-harness`
3. Verify all 20 skill directories contain SKILL.md files
4. Update progress.md with pre-flight completion

## Tier 1: Skills (20 artifacts, sequential)

For each skill in the priority order below:

### Per-Skill Cycle

```
AUDIT → load skill-judge skill → score the skill → document score
  ↓ (if < 100%)
REFACTOR → identify gaps from judge feedback → make minimum changes → save
  ↓
RE-AUDIT → load skill-judge skill → score again → document score
  ↓ (if < 100%, repeat up to 3 times)
ESCALATE → if still < 100% after 3 cycles → document exception → ask user
  ↓ (if 100%)
ADVANCE → commit with message: `skill: {name} — 100% on skill-judge` → next
```

### Skill Priority Order

1. **meta-builder** — Foundation skill that creates/edits other skills; must be
   perfect before auditing skills it helps create
2. **use-authoring-skills** — Authoring patterns; feeds into all other skill quality
3. **skill-synthesis** — Creates skills from repos; quality gate for generated content
4. **coordinating-loop** — Multi-agent orchestration; referenced by workflows
5. **planning-with-files** — Multi-step task tracking; referenced by commands
6. **user-intent-interactive-loop** — Long session management; referenced by agents
7. **command-dev** — Command development patterns; referenced by commands
8. **command-parser** — Command string parsing; feeds command-dev
9. **agents-and-subagents-dev** — Agent architecture; referenced by agents
10. **agent-authorization** — Agent creation gates; referenced by agents-and-subagents
11. **custom-tools-dev** — Plugin SDK patterns; referenced by tools
12. **opencode-platform-reference** — Platform capabilities; reference skill
13. **opencode-non-interactive-shell** — Shell safety; referenced by commands/agents
14. **harness-audit** — Project audit capability
15. **harness-delegation-inspection** — Delegation patterns
16. **session-context-manager** — Session persistence
17. **phase-loop** — Iterative execution semantics
18. **repomix-explorer** — Codebase analysis
19. **repomix-exploration-guide** — Deep investigation guide
20. **oh-my-openagent-reference** — Reference only; audit for quality but do NOT
    read the full XML (11MB). Grep SKILL.md and metadata only.

### Exit Criteria for Tier 1

- All 20 skills score 100% on skill-judge (or have documented exceptions)
- All cross-references between skills resolve to existing artifacts
- Progressive disclosure enforced in all skill content
- No placeholder or "nothingness" content in any skill
- Git commits for each completed skill audit

## Tier 2: Agents (22 artifacts, sequential)

Begins only after Tier 1 exits successfully.

### Per-Agent Cycle

Same audit → refactor → re-audit pattern as skills, but using agent-specific
quality criteria:

1. **Description accuracy** — Does the agent's description match its actual role?
2. **Tool assignments** — Are referenced tools available and correctly specified?
3. **Permission model** — Are permissions minimal and justified?
4. **Cross-references** — Does the agent reference existing skills/commands?
5. **Temperature/model config** — Is configuration appropriate for the agent's task?
6. **Trigger conditions** — When does this agent activate? Is it clear?

### Agent Priority Order

1. coordinator.md — Central routing agent
2. conductor.md — Execution orchestrator
3. builder.md — Implementation specialist
4. researcher.md — Investigation specialist
5. critic.md — Review specialist
6. explore.md — Codebase exploration
7. hivefiver-orchestrator.md — Meta-concept orchestration
8. intent-loop.md — Pre-planning clarification
9. meta-synthesis-agent.md — Meta-concept analysis
10. phase-guardian.md — Loop enforcement
11. spec-verifier.md — Post-implementation verification
12. All remaining agents (11 more) — alphabetical

### Exit Criteria for Tier 2

- All 22 agents pass quality criteria
- All agent-to-skill references resolve (skills already at 100%)
- All agent-to-command references resolve (commands audited next)
- No orphan agents without connections

## Tier 3: Commands (11 artifacts, sequential)

Begins only after Tier 2 exits successfully.

### Per-Command Cycle

1. **Frontmatter validity** — YAML parses, all fields are valid
2. **Argument schema** — Arguments defined and validated
3. **Agent binding** — Referenced agents exist and are configured
4. **Execution path** — Command chain is traceable end-to-end
5. **Error handling** — Failure modes documented
6. **Help text** — Usage instructions are clear and accurate

### Exit Criteria for Tier 3

- All 11 commands pass quality criteria
- All command chains execute without dead references
- All agent bindings resolve to existing, audited agents

## Tier 4: Workflows (4 artifacts, sequential)

Begins only after Tier 3 exits successfully.

### Per-Workflow Cycle

1. **Step sequencing** — Each step references existing artifacts
2. **Error recovery** — What happens when a step fails?
3. **State management** — How is workflow state persisted?
4. **Exit conditions** — When is the workflow complete?

### Exit Criteria for Tier 4

- All 4 workflows pass quality criteria
- End-to-end execution traceable through audited artifacts
- Integration report produced

## Post-Completion

1. Run full integration verification
2. Write `integration-report-2026-04-07.md`
3. Update progress.md with final status
4. Git tag: `v0.2.0-ecosystem-audited`

</execution_plan>

---

<risks_mitigated>

## Risk 1: Context Bomb (oh-my-openagent-full.xml)
- **Risk**: 11MB XML file (276K lines) will blow context window if read fully
- **Mitigation**: NEVER read the full file. Use `grep` with targeted patterns,
  or read SKILL.md (1.7KB) which summarizes the reference. If deep patterns are
  needed, use chunked offset reads of max 200 lines at a time.
- **Status**: Mitigated by constraint #8

## Risk 2: 70 Uncommitted Files
- **Risk**: Working on top of uncommitted changes means no rollback point
- **Mitigation**: Commit a checkpoint before starting (pre-flight step)
- **Status**: Mitigated by pre-flight gate

## Risk 3: Concurrent Writes
- **Risk**: Multiple agents modifying files simultaneously → merge conflicts
- **Mitigation**: Sequential execution enforced. One artifact at a time.
- **Status**: Mitigated by constraint #7

## Risk 4: Broken eval-harness Symlink
- **Risk**: Symlink at `.opencode/skills/eval-harness` points to non-existent target
- **Mitigation**: Remove or fix the symlink in pre-flight before skills audit begins
- **Status**: Identified, fix required in pre-flight

## Risk 5: Unbounded Loop Cycles
- **Risk**: A skill might never reach 100% on skill-judge, causing infinite loops
- **Mitigation**: Hard cap of 3 audit-refactor cycles per artifact. After 3 failures,
  escalate to user with documented exception.
- **Status**: Mitigated by per-skill cycle definition

## Risk 6: Cross-Reference Drift
- **Risk**: Fixing one artifact breaks references in another
- **Mitigation**: Skills are audited first (foundation tier). Agent refs to skills
  are validated after skills are locked. Commands after agents. Workflows last.
  This ensures downstream references always point to already-validated upstream artifacts.
- **Status**: Mitigated by tier ordering

## Risk 7: .opencode/ is Real Copies (not symlinks)
- **Risk**: Changes to .opencode/ won't propagate to labs automatically
- **Mitigation**: Document which is canonical source for each artifact. If labs are
  canonical, sync changes back after .opencode/ is updated.
- **Status**: Mitigated by constraint #9

## Risk 8: Progressive Disclosure Not Enforced
- **Risk**: Skills may pass audit on content quality but fail on structure
- **Mitigation**: Progressive disclosure is a specific dimension in skill-judge
  (15 points). Skills cannot score 100% without proper layering.
- **Status**: Mitigated by skill-judge dimension 2

</risks_mitigated>

---

<quality_gates>

## Pre-Flight Gate

| Check | Pass Condition |
|-------|---------------|
| Uncommitted files checkpointed | `git status --short` shows clean or <20 |
| eval-harness symlink fixed | File removed or target exists |
| All 20 skills have SKILL.md | `ls .opencode/skills/*/SKILL.md` returns 20 |
| progress.md updated | Contains pre-flight completion note |

## Per-Artifact Gate (applies to every skill, agent, command, workflow)

| Check | Pass Condition |
|-------|---------------|
| Audit scored | skill-judge returns numeric score |
| Score = 100% | Or documented exception with user approval |
| Cross-references valid | All mentions of other artifacts resolve on disk |
| Progressive disclosure (skills) | Content is layered, not wall-of-text |
| No placeholder content | Every section has real, actionable value |
| Committed | `git log` shows commit for this artifact |

## Tier Transition Gates

| Transition | Condition |
|------------|-----------|
| Skills → Agents | All 20 skills at 100% + committed |
| Agents → Commands | All 22 agents pass criteria + committed |
| Commands → Workflows | All 11 commands pass criteria + committed |
| Workflows → Done | All 4 workflows pass criteria + committed |

## Final Gate

| Check | Pass Condition |
|-------|---------------|
| Integration report written | docs/audit/integration-report-2026-04-07.md exists |
| No orphan references | grep for dead links returns 0 |
| progress.md final | Shows all tiers complete |
| Git tag applied | v0.2.0-ecosystem-audited exists |

</quality_gates>
