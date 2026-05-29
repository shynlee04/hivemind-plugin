# System Audit: Agent Hierarchy + Routing

**Date:** 2026-05-29
**Scope:** `.opencode/agents/`, `.opencode/commands/`, `.opencode/workflows/`, `.opencode/skills/`, `src/routing/`

---

## Agent Inventory

### By Lineage

| Lineage | Count | Has depth/lineage metadata | Has skills field |
|---------|-------|---------------------------|-----------------|
| hm-* | 31 | 1 (hm-l0-orchestrator only) | 1 |
| hf-* | 11 | 11 (all) | 11 |
| gsd-* | 33 | 0 | 0 |
| **Total** | **75** | **12** | **12** |

### By Hierarchy Level (agents with explicit `depth` field)

| Level | Agents | Status |
|-------|--------|--------|
| L0 | `hm-l0-orchestrator`, `hf-l0-orchestrator` | ✅ Both exist |
| L1 | `hf-l1-coordinator` | ⚠️ `hm-l1-coordinator` MISSING |
| L2 | 9 × `hf-l2-*` (agent-builder, auditor, command-builder, meta-builder, prompter, refactorer, skill-builder, synthesizer, tool-builder) | ⚠️ ZERO `hm-l2-*` agents exist |
| L3 | None | ❌ No L3 agents exist |

### Agents Referenced in Commands but MISSING

| Missing Agent | Referenced By Commands |
|---------------|----------------------|
| `hm-l2-conductor` | `plan.md`, `start-work.md`, `harness-doctor.md`, `sync-agents-md.md`, `ultrawork.md` |
| `hm-l2-researcher` | `deep-research-synthesis-repomix.md` |
| `hm-l1-coordinator` | `hf-prompt-enhance.md` |

### Agents Referenced in Routing Table (`intake-gate.ts`) but MISSING

| Missing Agent | Purpose Class |
|---------------|---------------|
| `hm-l2-scout` | discovery |
| `hm-l2-brainstorm` | brainstorming |
| `hm-l3-research-chain` | research |
| `hm-l2-critic` | gatekeeping |
| `hm-l2-test-driven-execution` | tdd |

**Only 2 of 8 routing targets exist:** `gsd-planner` (planning) and `gsd-executor` (implementation).

### Representative Agent Patterns

| Agent | Level | Mode | Tools | Skills | Delegation |
|-------|-------|------|-------|--------|-----------|
| `hm-l0-orchestrator` | L0 | primary | glob, grep, task (hm-l1/l2/l3), session-*, hivemind-*, webfetch, websearch | 9 skills (hm-l2-*, gate-l3-*) | Can dispatch hm-l1-*, hm-l2-*, hm-l3-* |
| `hf-l0-orchestrator` | L0 | primary | glob, grep, task (hf-l1/l2, hm-l1/l2), delegate-task, hivemind-*, webfetch, websearch | None explicit | Can dispatch hf-l1-*, hf-l2-*, hm-l2-* |
| `hf-l1-coordinator` | L1 | subagent | read, glob, grep, task (hf-l2-*, hm-l2-*), delegate-task | 7 skills | Can dispatch hf-l2-*, hm-l2-* |
| `hf-l2-agent-builder` | L2 | subagent | read, edit/write (.md/.json/.txt/.xml/.yaml), glob, grep | 2 skills | Cannot delegate |
| `hm-orchestrator` | (none) | all | Not specified in frontmatter | None | Delegates to hm-* L2 agents |
| `hm-executor` | (none) | all | Not specified in frontmatter | None | Cannot delegate |
| `gsd-executor` | (none) | subagent | Not specified in frontmatter | None | Cannot delegate |

**Key observation:** Only `hf-*` agents have proper depth/lineage metadata. The 31 `hm-*` agents and 33 `gsd-*` agents lack this metadata (except `hm-l0-orchestrator`).

---

## Command Inventory

### Counts

| Category | Count |
|----------|-------|
| Total command files | 124 |
| With `namespace: hm` | 105 |
| With `agent` field | 120 |
| With `subtask` field | 120 |
| With `validation-gates` | 105 |
| Without namespace (hf-*, misc) | 19 |

### Top Agent Routing (commands → agent)

| Agent | # Commands |
|-------|-----------|
| `hm-orchestrator` | 51 |
| `hm-planner` | 9 |
| `hm-nyquist-auditor` | 9 |
| `hm-code-reviewer` | 6 |
| `hf-l0-orchestrator` | 6 |
| `hm-l2-conductor` | 5 (MISSING) |
| `hm-executor` | 5 |
| `hm-roadmapper` | 4 |
| `hm-phase-researcher` | 4 |

### Commands Pointing to MISSING Agents

| Command | Target Agent | Status |
|---------|-------------|--------|
| `plan.md` | `hm-l2-conductor` | ❌ MISSING |
| `start-work.md` | `hm-l2-conductor` | ❌ MISSING |
| `harness-doctor.md` | `hm-l2-conductor` | ❌ MISSING |
| `sync-agents-md.md` | `hm-l2-conductor` | ❌ MISSING |
| `ultrawork.md` | `hm-l2-conductor` | ❌ MISSING |
| `deep-research-synthesis-repomix.md` | `hm-l2-researcher` | ❌ MISSING |
| `hf-prompt-enhance.md` | `hm-l1-coordinator` | ❌ MISSING |

### Command-to-Workflow References

- 12 commands reference `hm-sdk` for initialization
- Commands like `hm-execute`, `hm-discuss-phase`, `hm-research` reference workflow files via `@` imports
- Commands use `$ARGUMENTS` for parameter passing (120 of 124)

---

## Workflow Inventory

| Category | Count |
|----------|-------|
| Total workflow files | 103 |
| hm-* workflows | 103 |
| Workflow subdirectories | 3 (discuss-phase, execute-phase, help) |

### Key Workflows

| Workflow | Purpose | References Agents |
|----------|---------|-------------------|
| `hm-execute-phase.md` | Wave-based plan execution | hm-executor, hm-verifier, hm-planner, hm-phase-researcher, hm-plan-checker, hm-debugger, hm-codebase-mapper, hm-integration-checker, hm-nyquist-auditor, hm-ui-researcher, hm-ui-checker, hm-ui-auditor |
| `hm-discuss-phase.md` | Context gathering via questions | hm-intent-loop |
| `hm-autonomous.md` | Full milestone automation | hm-orchestrator, hm-planner, hm-executor |
| `hm-plan-phase.md` | Plan creation | hm-planner |
| `hm-quick.md` | Quick task execution | hm-executor |

### Workflow-Agent Coupling

- 13 workflows reference specific agents (hm-executor, hm-planner, hm-verifier)
- Most workflows use `hm-sdk query` for initialization (336 references across all workflows)
- Workflows are markdown files with XML-tagged process steps — NOT executable code

---

## Skill Inventory

| Category | Count |
|----------|-------|
| Total skill directories | 34 |
| hf-l2-* (meta-builder) | 13 |
| gate-l3-* (quality gates) | 3 |
| stack-l3-* (reference) | 6 |
| Other (orchestration/patterns) | 12 |

### Skills Referenced by Agents but MISSING

| Missing Skill | Referenced By |
|---------------|--------------|
| `hm-l2-lineage-router` | `hm-l0-orchestrator` |
| `hm-l2-skill-router` | `hm-l0-orchestrator` |
| `hm-l2-coordinating-loop` | `hm-l0-orchestrator`, `hf-l1-coordinator` |
| `hm-l2-user-intent-interactive-loop` | `hm-l0-orchestrator` |
| `hm-l2-completion-looping` | `hm-l0-orchestrator`, `hf-l1-coordinator` |
| `hm-l2-phase-loop` | `hm-l0-orchestrator` |

**6 of 9 skills referenced by `hm-l0-orchestrator` don't exist.** The `hf-*` agents reference skills that DO exist (hf-l2-*, gate-l3-*, stack-l3-*).

---

## Routing Map

### How User Input Flows

```
User Input
    │
    ▼
┌─────────────────────────────┐
│  opencode.json              │
│  plugin: ./dist/plugin.js   │
│  instructions: rules/*.md   │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  src/routing/session-entry/ │
│  ├─ purpose-classifier.ts   │  Classifies: discovery/brainstorming/research/planning/implementation/gatekeeping/tdd/course-correction
│  ├─ language-resolution.ts  │  Detects language/script
│  ├─ profile-resolver.ts     │  Resolves developer profile
│  └─ intake-gate.ts          │  Maps purpose → routing target
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  PURPOSE_TO_ROUTING_TARGET  │
│  discovery → hm-l2-scout ❌ │
│  brainstorm → hm-l2-brainstorm ❌
│  research → hm-l3-research-chain ❌
│  planning → gsd-planner ✅  │
│  implementation → gsd-executor ✅
│  gatekeeping → hm-l2-critic ❌
│  tdd → hm-l2-test-driven ❌
│  course-correction → gsd-debugger ✅
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  src/routing/command-engine/│
│  ├─ discoverCommandBundles()│  Loads .opencode/commands/*.md
│  ├─ analyzeCommandContract()│  Validates command shape
│  ├─ routeCommandPreview()   │  Preview routing without execution
│  └─ renderCommandContext()  │  Bounded context serialization
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  Command Execution          │
│  Command .md frontmatter:   │
│  ├─ agent: <target-agent>   │
│  ├─ subtask: true/false     │
│  ├─ validation-gates: [...] │
│  └─ body with $ARGUMENTS    │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  Agent .md loaded           │
│  ├─ YAML frontmatter        │
│  ├─ permission matrix       │
│  ├─ skills to load          │
│  └─ XML-tagged body         │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  Workflow .md executed      │
│  ├─ <purpose>               │
│  ├─ <process> steps         │
│  ├─ hm-sdk queries          │
│  └─ Agent delegation via    │
│     task/delegate-task      │
└─────────────────────────────┘
```

### Two Parallel Routing Systems

1. **`src/routing/session-entry/`** — Programmatic TypeScript routing. Maps purpose classes to agent names. **5 of 8 targets are MISSING.**

2. **Command frontmatter** — Declarative YAML routing. Each command specifies `agent:` field. **7 commands point to MISSING agents.**

These two systems are **disconnected** — the intake-gate routing table doesn't reference any command names, and commands don't reference the intake-gate purpose classes.

---

## Gaps Found

### CRITICAL: Broken Routing

1. **`intake-gate.ts` routing table is 62.5% broken** — 5 of 8 routing targets (`hm-l2-scout`, `hm-l2-brainstorm`, `hm-l3-research-chain`, `hm-l2-critic`, `hm-l2-test-driven-execution`) don't exist as agent files. Only `gsd-planner`, `gsd-executor`, and `gsd-debugger` work.

2. **7 commands route to non-existent agents** — `plan`, `start-work`, `harness-doctor`, `sync-agents-md`, `ultrawork` all point to `hm-l2-conductor` which doesn't exist. `deep-research-synthesis-repomix` points to `hm-l2-researcher`. `hf-prompt-enhance` points to `hm-l1-coordinator`.

3. **`hm-l1-coordinator` is missing** — The hm-* lineage has L0 but no L1. The `hm-l0-orchestrator` declares it can dispatch to `hm-l1-*` but no such agent exists.

4. **Zero `hm-l2-*` agents exist** — The hm-* lineage has 31 agents but none are classified as L2. The L0 orchestrator's `delegation_routing.fast_path.targets` includes `hm-l2-*` and `hm-l3-*` — both empty sets.

### HIGH: Missing Skills

5. **6 of 9 skills referenced by `hm-l0-orchestrator` don't exist** — `hm-l2-lineage-router`, `hm-l2-skill-router`, `hm-l2-coordinating-loop`, `hm-l2-user-intent-interactive-loop`, `hm-l2-completion-looping`, `hm-l2-phase-loop` are all missing. The L0 orchestrator's skill loading will fail silently.

6. **Skills referenced by `hf-l1-coordinator` are also missing** — `hm-l2-coordinating-loop` and `hm-l2-completion-looping` don't exist.

### MEDIUM: Metadata Gaps

7. **63 of 75 agents lack `depth`/`lineage` metadata** — Only hf-* agents (11) and hm-l0-orchestrator (1) have proper hierarchy metadata. The 31 hm-* agents and 33 gsd-* agents are metadata-blind to the routing system.

8. **Only 12 of 75 agents declare skills** — The `skills:` frontmatter field is only present in hf-* agents and hm-l0-orchestrator. The remaining 63 agents have no declared skill loading.

9. **gsd-* agents are completely unmapped** — 33 agents with no depth, no lineage, no skills field. They exist as standalone subagents but aren't part of the hierarchy.

### MEDIUM: Structural Issues

10. **Duplicate commands** — `plan.md` and `hm-plan.md` both exist with different targets (`hm-l2-conductor` vs `hm-planner`). Same for `start-work.md` / `hm-start-work.md`, `harness-doctor.md` / `hm-harness-doctor.md`, etc. The non-prefixed versions point to MISSING agents.

11. **Backup files in production** — `.backup` files exist in `.opencode/commands/` (e.g., `hm-deep-init.md.backup`, `hm-harness-audit.md.backup`). These are sync artifacts and should be cleaned.

12. **Two routing systems with no bridge** — `src/routing/session-entry/` and command frontmatter are independent routing mechanisms with no shared state or cross-validation.

### LOW: Observability

13. **No agent-to-test mapping** — 239 test files exist in `tests/` but they test TypeScript source code, not agent/command/workflow definitions. The .md primitives have zero test coverage.

14. **Workflow-agent coupling is implicit** — Workflows reference agents by name in prose, not via structured metadata. No programmatic validation that referenced agents exist.

---

## Summary

| Metric | Count | Status |
|--------|-------|--------|
| Total agents | 75 | |
| Agents with hierarchy metadata | 12 | ⚠️ 16% |
| L0 agents | 2 | ✅ |
| L1 agents | 1 (should be 2+) | ⚠️ |
| L2 agents (hm-*) | 0 (should be many) | ❌ |
| L3 agents | 0 | ❌ |
| Total commands | 124 | |
| Commands routing to missing agents | 7 | ❌ |
| Total workflows | 103 | |
| Total skills | 34 | |
| Skills referenced but missing | 6 | ❌ |
| Routing targets that exist | 3/8 | ❌ 37.5% |

**Bottom line:** The agent hierarchy described in AGENTS.md (L0 → L1 → L2 → L3 delegation chain) is **partially implemented**. The `hf-*` lineage (meta-concept building) is complete and well-structured. The `hm-*` lineage (product development) has a functioning L0 orchestrator but **no L1 coordinators or L2 specialists** — the entire middle and execution layers are missing. The intake routing table is mostly broken. Commands that claim to use `hm-l2-conductor` will fail.
