# Phase 16.4 Investigation Report

**Analysis Date:** 2026-04-25

## 1. Phase 16.4 Overview

**Phase ID:** `16.4-harness-architecture-baseline-migration-control-plane`

**Current Status:** Architecture baseline executed; ready for verify-work (per `.planning/STATE.md`)

**Goal:** Establish an evidence-verified architecture baseline and migration control plane that:
- Invalidates stale/hallucinated prior architecture decisions
- Revises stale Phase 11 architecture where needed
- Defines runtime/state/component boundaries before further delegation expansion
- Enables product-detox concept migration (not code copying)
- Hardens agent hierarchy, runtime configuration, user settings

### Phase 16.4 Artifact Inventory

**15 artifacts in** `.planning/phases/16.4-harness-architecture-baseline-migration-control-plane/`:

| Artifact | Purpose |
|----------|---------|
| `16.4-SPEC.md` | 14 locked requirements, ambiguity score 0.16 |
| `16.4-CONTEXT.md` | Implementation decisions (D-01 through D-24), canonical refs |
| `16.4-MIGRATION-CONTROL-PLANE.md` | Product-detox concept gate matrix, state transition rules |
| `16.4-DECISION-REGISTER.md` | Stale-decision validation register |
| `16.4-ARCHITECTURE-BASELINE.md` | Architecture baseline with mutation authority |
| `16.4-PATTERNS.md` | Architecture patterns |
| `16.4-FIRST-BIG-WIN-SCORECARD.md` | First-big-win scoring |
| `16.4-RESEARCH.md` | Research findings |
| `16.4-DISCUSSION-LOG.md` | Discussion log |
| `16.4-VALIDATION.md` | Validation results |
| `16.4-SOURCE-COVERAGE-AUDIT.md` | Source coverage audit |
| `16.4-01-PLAN.md` | Plan 01 — Decision register + guard artifacts |
| `16.4-02-PLAN.md` | Plan 02 — Architecture baseline |
| `16.4-03-PLAN.md` | Plan 03 — Migration control plane |
| `16.4-04-PLAN.md` | Plan 04 — Validation + first-big-win |

### Key Dependencies Established by 16.4

1. **D-11/D-12/D-13:** `.hivemind/` is the preferred canonical state root (over `.opencode/state/opencode-harness/`)
2. **D-21/D-22:** First recommended migration = session journal + execution lineage bridge
3. **D-24:** Product-detox concepts migrate as concepts/contracts, NOT code
4. **D-06/D-07:** Phase 16.4 supersedes stale Phase 11 architecture
5. **Delegation manifest paused** until baseline gates exist

---

## 2. `.opencode/` Directory Structure

### Agents (58 files in `.opencode/agents/`)

**Core Agents (6):**
- `coordinator.md` — Primary orchestrator
- `conductor.md` — Execution conductor
- `researcher.md` — Research specialist
- `builder.md` (named `build.md`) — Implementation builder
- `critic.md` — Quality critic
- `general.md` — General-purpose agent

**GSD Specialist Agents (33):**
- `gsd-advisor-researcher.md`, `gsd-ai-researcher.md`, `gsd-assumptions-analyzer.md`
- `gsd-code-fixer.md`, `gsd-code-reviewer.md`, `gsd-codebase-mapper.md`
- `gsd-debug-session-manager.md`, `gsd-debugger.md`
- `gsd-doc-classifier.md`, `gsd-doc-synthesizer.md`, `gsd-doc-verifier.md`, `gsd-doc-writer.md`
- `gsd-domain-researcher.md`, `gsd-eval-auditor.md`, `gsd-eval-planner.md`
- `gsd-executor.md`, `gsd-framework-selector.md`, `gsd-integration-checker.md`
- `gsd-intel-updater.md`, `gsd-nyquist-auditor.md`, `gsd-pattern-mapper.md`
- `gsd-phase-researcher.md`, `gsd-plan-checker.md`, `gsd-planner.md`
- `gsd-project-researcher.md`, `gsd-research-synthesizer.md`, `gsd-roadmapper.md`
- `gsd-security-auditor.md`, `gsd-ui-auditor.md`, `gsd-ui-checker.md`
- `gsd-ui-researcher.md`, `gsd-user-profiler.md`, `gsd-verifier.md`

**Hivefiver Meta Agents (6):**
- `hivefiver.md` — Root meta-concept orchestrator (MINDNETWORK graph traversal)
- `hivefiver-orchestrator.md` — Routes to specialist subagents via Task tool
- `hivefiver-agent-builder.md` — Creates/audits/repairs agent definitions
- `hivefiver-skill-author.md` — Creates/audits/repairs skill definitions
- `hivefiver-command-builder.md` — Creates/audits/repairs command definitions
- `hivefiver-tool-builder.md` — Creates/audits/repairs custom tool definitions

**Other Agents (13):**
- `hf-prompter.md`, `intent-loop.md`, `meta-synthesis-agent.md`, `orchestrator.md`
- `phase-guardian.md`, `prompt-analyzer.md`, `prompt-repackager.md`, `prompt-skimmer.md`
- `risk-assessor.md`, `spec-verifier.md`
- `context-mapper.md`, `context-purifier.md`, `explore.md` (not present, referenced from system)

### Skills (32 entries in `.opencode/skills/`)

**Hivefiver Skills (6):**
- `hivefiver-agents-and-subagents-dev/` — Agent definition authoring
- `hivefiver-command-dev/` — Command definition authoring
- `hivefiver-context-absorb/` — Multi-wave context absorption
- `hivefiver-custom-tools-dev/` — Custom tool authoring
- `hivefiver-delegation-gates/` — Delegation authorization gates
- `hivefiver-use-authoring-skills/` — Skill authoring procedures

**HM Core Skills (5):**
- `hm-meta-builder/` — Routes meta-concept requests to specialists
- `hm-coordinating-loop/` — Multi-agent dispatch with validation
- `hm-planning-with-files/` — 3-file external memory system
- `hm-user-intent-interactive-loop/` — User intent clarification
- `hm-opencode-platform-reference/` — Complete OpenCode platform docs

**HM Extended Skills (21):**
- `hm-agent-composition/`, `hm-agents-md-sync/`, `hm-command-parser/`
- `hm-completion-looping/`, `hm-debug/`, `hm-deep-research/`
- `hm-detective/`, `hm-omo-reference/`, `hm-opencode-non-interactive-shell/`
- `hm-opencode-project-audit/`, `hm-opencode-project-inspection/`
- `hm-phase-execution/`, `hm-phase-loop/`, `hm-refactor/`
- `hm-research-chain/`, `hm-skill-synthesis/`, `hm-spec-driven-authoring/`
- `hm-subagent-delegation-patterns/`, `hm-synthesis/`
- `hm-test-driven-execution/`

### Commands (16 entries in `.opencode/commands/`)

**Core Commands (6):**
- `start-work.md`, `plan.md`, `deep-init.md`
- `deep-research-synthesis-repomix.md`, `harness-doctor.md`, `ultrawork.md`

**Hivefiver Commands (5):**
- `hf-absorb.md`, `hf-audit.md`, `hf-create.md`
- `hf-prompt-enhance.md`, `hf-prompt-enhance-to-plan.md`, `hf-stack.md`

**Other Commands (5):**
- `harness-audit.md`, `sync-agents-md.md`
- `gsd/dev-preferences.md` (subdirectory)

### Rules (2 in `.opencode/rules/`)
- `universal-rules.md` — Anti-patterns, instruction priority, context budget, subagent rules
- `commit-governance.md` — Git commit discipline

---

## 3. Hivefiver Infrastructure Summary

### Agent Hierarchy

```
hivefiver (root meta-concept orchestrator)
├── hivefiver-orchestrator (routes to specialists via Task tool)
│   ├── hivefiver-agent-builder (agent .md creation/audit)
│   ├── hivefiver-skill-author (SKILL.md creation/audit)
│   ├── hivefiver-command-builder (command .md creation/audit)
│   └── hivefiver-tool-builder (TypeScript tool creation/audit)
```

### Skill Dependencies (per agent permissions)

| Agent | Allowed Skills |
|-------|---------------|
| `hivefiver-agent-builder` | `hivefiver-agents-and-subagents-dev`, `hm-opencode-platform-reference`, `hm-opencode-non-interactive-shell` |
| `hivefiver-skill-author` | `hivefiver-use-authoring-skills`, `skill-judge`, `skill-creator`, `hm-opencode-platform-reference` |
| `hivefiver-command-builder` | `hivefiver-command-dev`, `hm-opencode-non-interactive-shell`, `hm-opencode-platform-reference` |
| `hivefiver-tool-builder` | `hivefiver-custom-tools-dev`, `hm-opencode-platform-reference`, `hm-opencode-non-interactive-shell` |
| `hivefiver-orchestrator` | `hm-meta-builder`, `hivefiver-use-authoring-skills`, all `hivefiver-*-dev`, `hm-coordinating-loop`, `hm-planning-with-files`, `skill-judge` |
| `hivefiver` (root) | All `hm-*` + all `hivefiver-*` + `repomix-*` |

### Key Design Constraints

- All hivefiver specialist agents have `task: deny` — they cannot delegate further
- All use `temperature: 0.15` (deterministic)
- All follow the Iron Law pattern: "NO DIRECT CREATION WITHOUT DELEGATION" (orchestrator) / "You never X directly" (specialists)
- `hivefiver-orchestrator` is `mode: primary` with `task: allow`
- Specialists are `mode: subagent` with `task: deny`

---

## 4. Plugin Layer (`src/plugin.ts`)

### Architecture

`plugin.ts` is a thin composition root (~97 LOC). It:
1. Loads runtime policy via `loadRuntimePolicy()`
2. Lazily loads PTY manager (`lib/pty/pty-manager.js`)
3. Creates `DelegationManager` with client + PTY options
4. Creates `HarnessLifecycleManager` with deps
5. Wires hook factories and registers tools

### Registered Tools (6)

```typescript
tool: {
  "delegate-task": createDelegateTaskTool(delegationManager),
  "delegation-status": createDelegationStatusTool(delegationManager),
  "run-background-command": createRunBackgroundCommandTool({...}), // conditional on PTY
  "prompt-skim": createPromptSkimTool(directory),
  "prompt-analyze": createPromptAnalyzeTool(directory),
  "session-patch": createSessionPatchTool(directory),
}
```

### Hook Composition

```typescript
{
  ...createCoreHooks({...}),          // Event routing, notification replay, message transform
  ...sessionReadHooks,                // Compaction, lifecycle hooks
  ...createToolGuardHooks({...}),     // Tool-budget, circuit-breaker, runtime policy
}
```

### Key Observations

- **No `AGENT_DEFAULTS`, `AGENT_TOOLS`, `CIRCUIT_BREAKER_THRESHOLD`, `MAX_TOOL_CALLS_PER_SESSION` constants** — these were removed. Runtime policy is loaded from `loadRuntimePolicy()` and types in `types.ts`.
- `WATCH_TIMEOUT_MS = 1800000` (30 minutes) is the only hardcoded constant
- Delegation recovery runs asynchronously (`void delegationManager.recoverPending()`)
- Two event observers: `delegationEventObserver` + `sessionEventObserver`

---

## 5. Delegation Manager (`src/lib/delegation-manager.ts`)

### Architecture (510 LOC)

The `DelegationManager` class is the core delegation orchestrator. Key characteristics:

**Dual Dispatch Modes:**
- `dispatch()` — SDK delegation via `spawnDelegatedSession()`
- `dispatchCommand()` — PTY/headless command delegation via `CommandDelegationHandler`

**State Management:**
- In-memory Maps: `delegations`, `delegationsBySession`, `safetyTimers`, `gracePeriodTimers`
- `DelegationConcurrencyQueue` semaphore for keyed concurrency
- Persistence via `persistDelegations()` / `readPersistedDelegations()`

**Dual Handlers:**
- `SdkDelegationHandler` — SDK child session lifecycle
- `CommandDelegationHandler` — PTY command lifecycle

**Key Flows:**
1. `dispatch()` → validate agent → acquire semaphore → spawn child → register → persist → prompt child
2. `handleSessionIdle()` → transition to running → start stability polling
3. `transitionToTerminal()` → unified terminal transition (completed/error/timeout)
4. `recoverPending()` → restore delegations from disk on restart

**Constants (from `types.ts`):**
- `DEFAULT_SAFETY_CEILING_MS`: 30 minutes
- `MAX_DELEGATION_DEPTH`: 3
- `TASK_CLEANUP_DELAY_MS`: 10 minutes (grace period)
- `MAX_DELEGATIONS_BEFORE_PRUNE`: 50

### Supporting Modules

| Module | File | Purpose |
|--------|------|---------|
| `sdk-delegation.ts` | `src/lib/sdk-delegation.ts` | SDK child session handler |
| `command-delegation.ts` | `src/lib/command-delegation.ts` | PTY command handler |
| `spawner/` | `src/lib/spawner/` | Session creation, concurrency keys, parent directory |
| `delegation-persistence.ts` | `src/lib/delegation-persistence.ts` | Delegation record I/O |
| `notification-handler.ts` | `src/lib/notification-handler.ts` | Terminal notifications (active despite docs saying deprecated) |

---

## 6. Agent-Builder/Agent-Config Infrastructure

### Finding: No programmatic agent-config infrastructure in `src/`

There is **no** code in `src/` that programmatically builds, configures, or manages agent definitions. The search for `*agent*builder*` and `*config*agent*` in `src/` returned zero results.

### How agents are currently managed:

1. **Agent definitions are `.md` files** in `.opencode/agents/` with YAML frontmatter
2. **Hivefiver agents** (`hivefiver-agent-builder.md`, etc.) are the only "builder" infrastructure — they are themselves `.md` agent definitions that guide an LLM to write other `.md` agent definitions
3. **No TypeScript tool** exists to create/modify agent definitions programmatically
4. **Agent validation** is done via `validateAgent()` in `delegation-manager.ts` — but this only checks the agent name exists in the OpenCode server's agent list, not that the `.md` file is well-formed

### What `validateAgent()` does:

```typescript
// In delegation-manager.ts
private async validateAgent(agent: string): Promise<ValidatedAgent> {
  const rawResponse = await this.client.app.agents()
  // Checks agent name exists in server response
  // Gracefully handles Zod validation errors from server
  // Returns { name, provider?, model?, category? }
}
```

### Gap: No Schema-Validated Agent Definition Pipeline

The project has:
- `schema-kernel/` for prompt-enhance schemas (Zod)
- `.opencode/agents/` with 58 YAML-frontmatter `.md` files
- `hivefiver-agent-builder` agent (LLM-guided, not programmatic)
- No Zod schema for validating agent frontmatter
- No tool to create/update agent definitions from code
- No tool to audit agent definitions for correctness

---

## 7. Source Tree Structure

```
src/
├── plugin.ts (97 LOC)           # Composition root
├── index.ts                     # Public API re-exports
├── hooks/ (5 files)             # Event hook factories
│   ├── create-core-hooks.ts     # Event routing, notification replay
│   ├── create-session-hooks.ts  # Compaction, lifecycle
│   ├── create-tool-guard-hooks.ts # Budget, circuit-breaker
│   ├── messages-transform.ts    # Message transformation
│   └── types.ts                 # Hook types
├── tools/ (6 entries)           # Plugin tools
│   ├── delegate-task.ts         # Delegation dispatch
│   ├── delegation-status.ts     # Status polling
│   ├── run-background-command.ts # PTY command tool
│   ├── prompt-skim/             # Prompt analysis
│   ├── prompt-analyze/          # Prompt deep analysis
│   └── session-patch/           # Session patching
├── lib/ (19 entries)            # Core library
│   ├── types.ts (475 LOC)       # Shared types + constants (leaf)
│   ├── delegation-manager.ts (510 LOC) # Core orchestrator
│   ├── continuity.ts (~401 LOC) # Durable JSON persistence
│   ├── lifecycle-manager.ts     # Session lifecycle (STUB)
│   ├── session-api.ts           # SDK wrappers
│   ├── completion-detector.ts   # Dual-signal completion
│   ├── notification-handler.ts  # Notifications (deprecated but active)
│   ├── task-status.ts           # Status transitions
│   ├── delegation-persistence.ts # Delegation record I/O
│   ├── helpers.ts               # Pure utilities
│   ├── runtime.ts               # Event→status mapping
│   ├── state.ts                 # In-memory Maps
│   ├── concurrency.ts           # Keyed semaphore
│   ├── runtime-policy.ts        # Runtime policy loading
│   ├── sdk-delegation.ts        # SDK session handler
│   ├── command-delegation.ts    # PTY command handler
│   ├── pty/                     # PTY management
│   └── spawner/                 # Session creation
├── shared/ (2 files)            # Cross-cutting utilities
│   ├── tool-response.ts         # Standard response envelope
│   └── tool-helpers.ts          # Tool conventions
└── schema-kernel/ (2 files)     # Zod schemas
    ├── index.ts
    └── prompt-enhance.schema.ts
```

---

## 8. Project State Summary

**From `.planning/STATE.md`:**
- Milestone: v2.0
- Progress: 88% (43/49 plans, 10/26 phases)
- Tests: 351 passing
- Typecheck: Clean
- Build: Clean
- Current focus: Phase 16.4 architecture baseline — ready for verify-work

**Key Active Concerns:**
1. `notification-handler.ts` marked deprecated but still actively used
2. `delegation-manager.ts` at 510 LOC — approaching module size limit
3. `lifecycle-manager.ts` is a stub/facade
4. No programmatic agent-config infrastructure
5. State split between `.opencode/state/opencode-harness/` and planned `.hivemind/`
6. Phase 11 architecture is stale and superseded by 16.4
7. Runtime verification of delegate-task still pending live test

---

*Investigation report: 2026-04-25*
