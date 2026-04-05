# 2nd Iteration Improvement Plan — Hivefiver Meta-Builder

**Date:** 2026-04-05
**Status:** DRAFT — Requires user authorization per cycle before execution
**Input:** Original prompt gap analysis + 3 newly synthesized resources
**Prepared by:** Hivefiver Orchestrator

---

## What Changed Since 1st Iteration

3 previously unread resources have been fully consumed:

1. **git-flow-branch-branch-creator** (awesome-copilot) — Semantic branch classification via git diff analysis. Decision tree for feature/release/hotfix. Edge case handling, validation checklist.
2. **memory-merger** (awesome-copilot) — Quality-bar-driven process for promoting mature lessons from temporary memory → permanent instructions. User approval gates, scope management, zero-knowledge-loss quality bar.
3. **elite-longterm-memory** (nextfrontierbuilds) — 5-layer memory architecture: Hot RAM (SESSION-STATE.md, WAL protocol) → Warm (LanceDB vectors) → Cold (git-notes knowledge graph) → Archive (MEMORY.md + daily/) → Cloud (SuperMemory). Mem0 auto-extraction for 80% token reduction.

**Key synthesis findings:**
- Our 3-layer memory model is too coarse — needs upgrade to 5 layers
- WAL protocol (write-before-respond) is critical — prevents context loss on crash
- Git Flow's branch classification decision tree layers on top of our worktree network
- Memory merger needs to become an operational skill, not just a protocol reference
- Swarm roles (scout/crawler/extraction) map to existing agent capabilities but need explicit definition

---

## Iteration 2: Cycle Structure

This plan is structured as **5 cycles**. Each cycle requires user authorization before proceeding.

```
Cycle 1: Memory System Upgrade (3-layer → 5-layer + WAL)
Cycle 2: Swarm Role Definitions (scout/crawler/extraction)
Cycle 3: Retrospective Mechanism (post-cycle analysis + pattern capture)
Cycle 4: Git Flow Integration (branch classification + memory merger skill)
Cycle 5: Validation & Network Testing (concurrent scenarios + knowledge graph)
```

### Cycle Authorization Protocol

Each cycle has:
- **Prerequisites** — what must be true before starting
- **Tasks** — what the specialist agents will do
- **Deliverables** — what you'll receive
- **Verification** — how we confirm it works
- **Commit strategy** — atomic commits per task

**User must authorize each cycle with "proceed" or "modify" before execution begins.**

---

## Cycle 1: Memory System Upgrade

**Goal:** Upgrade 3-layer memory to 5-layer with WAL protocol

### Why This First
Memory is the foundation of everything else. Without proper memory, the retrospective mechanism, knowledge graph, and agent generation transfer have no substrate to build on. The WAL protocol prevents the exact failure mode that caused the hallucination session (ses_2a54).

### Tasks

| # | Task | Specialist | Deliverable |
|---|------|-----------|-------------|
| 1.1 | Update GIT-WORKFLOW-AND-MEMORY-PROTOCOL.md Part 4: expand 3-layer → 5-layer model | researcher | Updated protocol section |
| 1.2 | Create SESSION-STATE.md template (Hot RAM) with WAL protocol instructions | hivefiver-skill-author | `references-lab/active/refactoring/long-term-memory/SESSION-STATE-TEMPLATE.md` |
| 1.3 | Create `git-workflow` skill package that wraps the protocol as a loadable SKILL.md | hivefiver-skill-author | `skills-lab/active/refactoring/git-workflow/SKILL.md` |
| 1.4 | Create `memory-merger` skill package operationalizing the merger process | hivefiver-skill-author | `skills-lab/active/refactoring/memory-merger/SKILL.md` |
| 1.5 | Update AGENTS.md to reference 5-layer model and WAL protocol | orchestrator | Updated AGENTS.md |

### Deliverables
- 5-layer memory model: L1 Git History → L2 Session State (Hot RAM + WAL) → L3 Lab Files → L4 Episodic/Vectors → L5 External/Cloud
- SESSION-STATE.md template with WAL triggers
- 2 new skill packages: `git-workflow`, `memory-merger`
- Updated AGENTS.md

### Verification
- SESSION-STATE.md template follows WAL protocol (write-before-respond triggers documented)
- git-workflow skill triggers on relevant phrases
- memory-merger skill has quality bar with 10/10 criteria
- All files committed atomically

### Commits
```
docs(protocol): upgrade memory model from 3-layer to 5-layer with WAL protocol
feat(skill): add git-workflow skill — wraps protocol as loadable SKILL.md
feat(skill): add memory-merger skill — operationalizes mature lesson consolidation
docs(module): update AGENTS.md with 5-layer memory model and WAL references
```

---

## Cycle 2: Swarm Role Definitions

**Goal:** Define scout, crawler, and extraction agent roles

### Why This Second
Swarm roles are the execution engine for the worktree network. Without them, the network topology has no agents to populate it. Scout/crawler/extraction behaviors already exist implicitly (researcher explores, skill-synthesis extracts) — this cycle makes them explicit.

### Tasks

| # | Task | Specialist | Deliverable |
|---|------|-----------|-------------|
| 2.1 | Design swarm role taxonomy: scout vs crawler vs extraction vs existing roles | researcher | Swarm role specification |
| 2.2 | Create `hivefiver-scout.md` agent — exploratory research + dependency mapping | hivefiver-agent-builder | `agents-lab/active/refactoring/hivefiver-scout.md` |
| 2.3 | Create `hivefiver-crawler.md` agent — systematic repository analysis | hivefiver-agent-builder | `agents-lab/active/refactoring/hivefiver-crawler.md` |
| 2.4 | Create `hivefiver-extraction.md` agent — synthesizing depth/coverage from docs, templates, scripts | hivefiver-agent-builder | `agents-lab/active/refactoring/hivefiver-extraction.md` |
| 2.5 | Update routing table in hivefiver-orchestrator.md to include swarm dispatch | hivefiver-agent-builder | Updated orchestrator agent |
| 2.6 | Update AGENTS.md agent team table with swarm roles | orchestrator | Updated AGENTS.md |

### Swarm Role Specification (Initial Design)

| Role | Purpose | Trigger Phrases | Tools Priority |
|------|---------|----------------|---------------|
| **Scout** | Exploratory research, dependency mapping, upstream reference discovery | "scout for", "map dependencies", "explore upstream" | glob, grep, web search |
| **Crawler** | Systematic repository analysis, pattern counting, structural mapping | "crawl this repo", "analyze structure", "count patterns" | repomix, grep (count mode) |
| **Extraction** | Synthesize depth + coverage from documentation, templates, scripts | "extract patterns from", "synthesize coverage", "find depth in" | read, grep, write (findings) |

### Deliverables
- 3 new agent definitions (scout, crawler, extraction)
- Updated orchestrator routing table
- Updated AGENTS.md

### Verification
- Each agent has explicit permissions, execution flow, success criteria
- Routing table correctly dispatches based on trigger phrases
- Swarm roles don't overlap with existing researcher/explore roles

### Commits
```
feat(agent): add hivefiver-scout — exploratory research + dependency mapping
feat(agent): add hivefiver-crawler — systematic repository analysis
feat(agent): add hivefiver-extraction — depth/coverage synthesis from documentation
docs(agent): update orchestrator routing table with swarm dispatch
docs(module): update AGENTS.md with swarm roles
```

---

## Cycle 3: Retrospective Mechanism

**Goal:** Post-cycle analysis that captures what worked, what didn't, and how to improve

### Why This Third
Retrospectives close the feedback loop. Without them, the system repeats mistakes (exactly what happened in ses_2a54 — the coordinator looped without learning). This cycle builds the mechanism that captures lessons and feeds them back into the system.

### Tasks

| # | Task | Specialist | Deliverable |
|---|------|-----------|-------------|
| 3.1 | Design retrospective format: sections, triggers, storage | researcher | Retrospective specification |
| 3.2 | Create retrospective workflow file | hivefiver-skill-author | `workflows-lab/active/refactoring/retrospective.md` |
| 3.3 | Create `retrospective` skill package | hivefiver-skill-author | `skills-lab/active/refactoring/retrospective/SKILL.md` |
| 3.4 | Add retrospective trigger to relevant commands (hf-create, hf-audit, hf-stack) | hivefiver-command-builder | Updated command files |
| 3.5 | Integrate with memory-merger: mature retrospectives → permanent lessons | orchestrator | Updated memory-merger skill |

### Retrospective Format (Initial Design)

```markdown
# Retrospective: [Cycle/Task Name] — [Date]

## Metrics
- Tasks completed: X/Y
- Commits created: N
- Agents dispatched: A, B, C
- Tokens consumed: ~T (if available)
- Duration: ~D

## What Worked
- [Pattern 1]: [Why it worked]
- [Pattern 2]: [Why it worked]

## What Didn't Work
- [Failure 1]: [Root cause]
- [Failure 2]: [Root cause]

## Network Topology Impact
- Branch flow: [How branches connected]
- Knowledge transfer: [What flowed between worktrees]
- Blocking: [Where work was waiting on other work]

## Agent-Human Boundary Observations
- [Where the boundary was too strict/too loose]
- [Where human intervention was needed vs automated]

## Atomic Commit Discipline
- [Commit quality observations]
- [Any violations of atomic commit rules]

## Action Items (feed into next cycle)
- [ ] [Improvement 1]
- [ ] [Improvement 2]

## Maturity Assessment
- [ ] Patterns validated across ≥2 cycles → candidate for memory-merger
- [ ] Patterns observed once → keep in retrospective archive
```

### Deliverables
- Retrospective workflow + skill
- Updated commands with retrospective triggers
- Integration with memory-merger for long-term learning

### Verification
- Retrospective skill triggers after workflow completion
- Format captures all 4 dimensions (multi-team, commits, topology, agent-human)
- Memory-merger integration promotes mature patterns

### Commits
```
feat(workflow): add retrospective workflow — post-cycle analysis mechanism
feat(skill): add retrospective skill — actionable retrospectives with 4 dimensions
docs(command): add retrospective triggers to hf-create, hf-audit, hf-stack
docs(skill): integrate retrospective with memory-merger for long-term learning
```

---

## Cycle 4: Git Flow Integration

**Goal:** Integrate Git Flow branch classification + operationalize memory merger

### Why This Fourth
With memory (C1), swarm roles (C2), and retrospectives (C3) in place, we can now integrate Git Flow's sophisticated branch classification into our worktree network. This cycle makes branch creation intelligent rather than manual.

### Tasks

| # | Task | Specialist | Deliverable |
|---|------|-----------|-------------|
| 4.1 | Design Git Flow → Hivefiver adaptation: multi-team branch classification | researcher | Adapted classification framework |
| 4.2 | Update GIT-WORKFLOW-AND-MEMORY-PROTOCOL.md with branch classification decision tree | hivefiver-skill-author | Updated protocol |
| 4.3 | Add `git notes` usage for structured decisions (Cold Store from elite-longterm-memory) | hivefiver-skill-author | Updated protocol + skill |
| 4.4 | Create `hf-branch` command for intelligent branch creation via Git Flow analysis | hivefiver-command-builder | `commands-lab/active/refactoring/hf-branch.md` |
| 4.5 | Test memory-merger on existing findings.md (real data) | researcher + critic | Merged lessons |

### Git Flow → Hivefiver Adaptation

```
Standard Git Flow: develop ← feature/hotfix/release → master
                    (single team, linear)

Hivefiver Adaptation: harness-experiment (main)
                          ├── feature/agent-<name>     (specialist worktree)
                          ├── fix/<component>          (builder worktree)
                          ├── docs/<topic>             (human worktree)
                          ├── experiment/<name>        (exploratory worktree)
                          └── sync/<scope>             (cross-worktree sync)

Branch classification:
  git diff analysis → nature of changes → classify intent
  BUT: multi-team means classification must consider:
    - WHO is making the change (agent vs human)
    - WHICH worktree it's in (team boundaries)
    - WHAT scope it affects (local vs cross-cutting)
```

### Deliverables
- Updated protocol with Git Flow decision tree
- git notes for structured decisions
- New `hf-branch` command
- Real memory-merger test

### Verification
- Branch classification handles multi-team context
- git notes persist structured decisions per branch
- hf-branch command survives CI=true
- memory-merger produces 10/10 quality merged instructions

### Commits
```
docs(protocol): integrate Git Flow branch classification for multi-team worktrees
feat(command): add hf-branch — intelligent branch creation via Git Flow analysis
feat(protocol): add git notes for structured Cold Store decisions
docs(memory): merge <domain> lessons into permanent instructions
```

---

## Cycle 5: Validation & Network Testing

**Goal:** Test concurrent scenarios + validate knowledge graph + confirm end-to-end workflow

### Why This Last
Everything else must be built before we can test it. This cycle validates the entire system works as specified in the original prompt.

### Tasks

| # | Task | Specialist | Deliverable |
|---|------|-----------|-------------|
| 5.1 | Create 2-3 test worktrees with actual agent assignments | builder | Test worktrees |
| 5.2 | Run concurrent test scenario: two teams working simultaneously | orchestrator | Concurrent test report |
| 5.3 | Validate knowledge graph: worktrees as nodes, commits as edges | researcher | Graph validation report |
| 5.4 | Run full workflow cycle with retrospective | orchestrator | Complete cycle report |
| 5.5 | Pack validated labs into structure ready for TS runtime | builder | Runtime-ready structure |

### Test Scenarios

| Scenario | Teams | Expected Outcome |
|----------|-------|------------------|
| **Parallel Skill Creation** | Team A (scout + skill-author) + Team B (crawler + skill-author) | Both teams create skills in separate worktrees without collision |
| **Cross-Team Sync** | Team A completes work → Team B needs it | Clean merge via sync branch, no context loss |
| **Retrospective Cycle** | Full workflow with retrospective at end | Retrospective captures patterns, feeds into next cycle |

### Deliverables
- Test worktrees with proven isolation
- Concurrent test report with results
- Knowledge graph validation
- Full cycle report with retrospective
- Runtime-ready structure

### Verification
- Both teams can commit simultaneously without conflicts
- Knowledge graph is navigable from any worktree
- Retrospective captures all 4 dimensions
- All commits are atomic and properly attributed
- Memory system survives session restart

### Commits
```
test(network): create test worktrees for concurrent scenario validation
test(network): run concurrent test — parallel skill creation
test(network): validate knowledge graph — worktrees as nodes, commits as edges
docs(validation): full cycle report with retrospective
chore(runtime): pack validated labs into TS-runtime-ready structure
```

---

## Conflict Resolutions (New from 2nd Iteration)

| Conflict | Resolution | Rationale |
|----------|------------|-----------|
| Git Flow says "branch from develop" vs we have no develop branch | **Use harness-experiment as develop equivalent** | Our main worktree serves the integration role |
| Git Flow says "merge to both develop and master" vs we merge to main | **Merge to harness-experiment branch** (single integration point) | Simpler for multi-team, avoids split master/develop confusion |
| Git Flow says "--no-ff always" vs GSD says "atomic commits" | **Both apply: --no-ff for integration, atomic for task commits** | No-ff preserves branch narrative, atomic commits are within branches |
| Elite says "LanceDB vectors" vs we have no vector DB installed | **Keep L4 as episodic-memory (SQLite-based) for now** | LanceDB is future optimization, not current requirement |
| Elite says "Mem0 auto-extraction" vs we have no Mem0 API key | **Manual extraction via memory-merger skill for now** | Memory-merger provides the same outcome with human approval gate |
| Memory-merger says "stop and wait for user" vs ultrawork says "don't stop" | **Memory-merger requires user approval; ultrawork skips it** | Merging permanent instructions should never be unsupervised |

---

## What's NOT In This Plan (Deferred)

| Item | Why Deferred | When to Address |
|------|-------------|----------------|
| LanceDB vector search | No infrastructure, not blocking | After TS runtime is stable |
| Mem0 auto-extraction | No API key, not blocking | After memory-merger is validated |
| Cloud backup (SuperMemory) | Optional, not blocking | After on-prem memory is proven |
| Analytics dashboard | Nice-to-have, not in original scope | After core system is validated |
| Community workflow sharing | Future, not in original scope | After internal system is stable |
| TS runtime packing | Requires validated labs first | After Cycle 5 validation passes |

---

## Execution Authorization

This plan contains 5 cycles with ~25 tasks total. Each cycle requires explicit user authorization.

**To proceed with Cycle 1 (Memory System Upgrade), respond with:**
- `proceed` — Execute Cycle 1 as designed
- `modify [feedback]` — Adjust Cycle 1 before execution
- `reorder [cycle number]` — Execute a different cycle first

---

*End of 2nd Iteration Improvement Plan. 5 cycles, ~25 tasks, ~25 atomic commits. Grounded in gap analysis of original prompt + 3 newly synthesized resources.*
