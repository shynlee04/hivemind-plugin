# AGENTS.md

This file provides guidance to ALL agents working in this repository.

**Last Updated**: 2026-03-04
**Version**: 3.1-guardrails
**Maintained By**: hivefiver meta-builder
**Symlinked To**: `.hivemind/AGENTS.md`, `.opencode/AGENTS.md`, `src/AGENTS.md`

---

## JSDOC Enforcement  
CRITICAL: Before modifying any function, you MUST:  
1. Read the entire JSDoc section  
2. Update the @param and @returns tags  
3. Preserve all @example blocks
4. Maintain the code files with this JSDoc section to pass on logs, report issues and addressing isolation when needed and logics, contracts, functions, and other important details of the code. 

## Non-Interactive Shell Awareness (Canonical)

- Shell is non-interactive (no TTY/PTY). Never run commands that wait for prompts or UI input.
- Always use non-interactive flags and explicit messages (`-y`, `--yes`, `--non-interactive`, `--no-edit`, `-f`).
- If a tool can still block, provide deterministic input (`yes |`, heredoc) or fail fast with a timeout.

1. **Executive Snapshot (8–12 bullets)**

- HIVEMIND is a meta-framework project built on Opencode and currently running in “integrate while self-fixing” mode ([`AGENTS.md`](AGENTS.md:20), [`CLAUDE.md`](CLAUDE.md:1)).
- The workflow model is dual-lineage: one shared entry sequence, then strict routing into two separate spaces ([`docs/journeys/DUAL-LINEAGE-USER-JOURNEY-STORIES-2026-03-04.md`](docs/journeys/DUAL-LINEAGE-USER-JOURNEY-STORIES-2026-03-04.md:39)).
- Extension/customization surface belongs to [`.opencode/`](.opencode/), [`commands/`](commands/), [`skills/`](skills/), [`workflows/`](workflows/).
- Core implementation/runtime belongs to repository root + [`src/`](src/) (tools/libs/hooks/schemas) ([`AGENTS.md`](AGENTS.md:105)).
- Main unresolved system risk is dual per-turn context injection conflict across extension and core hooks ([`AGENTS.md`](AGENTS.md:123)).
- Node-1 has partial completed fixes: path/session bootstrap + schema/governance normalization ([`AGENTS.md`](AGENTS.md:137)).
- Regression baseline was previously blocked by stale test expectations; baseline was re-audited and stabilized on March 5, 2026.
- Restricted regions are explicit and currently safety-gated ([`AGENTS.md`](AGENTS.md:181)).
- Most confusion/hallucination risk comes from lineage mixing and from treating similar workflow patterns as shared artifacts.
- Current priority is safe completion of refactor sequence, not expansion of new features.

2. **Project Goal → Intended Achievements → Means**

| Project Goal | Intended Achievements | Means |
|---|---|---|
| Stabilize HIVEMIND as a reliable meta-orchestration framework | Lower drift, deterministic routing, safer sessions | Follow guarded Node-1 sequence + runtime constraints in [`AGENTS.md`](AGENTS.md:150) |
| Keep lineage boundaries clean | Prevent cross-domain confusion/hallucination | Enforce shared-entry then split model in [`docs/journeys/DUAL-LINEAGE-USER-JOURNEY-STORIES-2026-03-04.md`](docs/journeys/DUAL-LINEAGE-USER-JOURNEY-STORIES-2026-03-04.md:35) |
| Fix contamination sources safely | Decouple conflicting injectors and stale contracts | Gate edits to restricted hooks and complete prerequisites first ([`AGENTS.md`](AGENTS.md:181)) |

3. **Historical Context and Evolution**

- The project entered contamination-defense mode after repeated context poisoning and role drift across sessions ([`AGENTS.md`](AGENTS.md:12), [`CONTAMINATION-GUARDRAILS.md`](CONTAMINATION-GUARDRAILS.md:82)).
- Governance was tightened: targeted context reads, strict mutation/routing discipline, and restricted zones.
- Refactor progressed on foundations: session pathing/bootstrap and schema/governance counter normalization ([`AGENTS.md`](AGENTS.md:137)).
- Remaining steps are dependency-gated and currently constrained by test-alignment authorization ([`AGENTS.md`](AGENTS.md:145), [`AGENTS.md`](AGENTS.md:150)).

4. **Architecture and Domain Boundaries**

- **[`.opencode`](.opencode/) extension layer**
  - Purpose: end-user extension/customization and framework-level orchestration assets.
  - Includes plugin/hook side behavior (notably [`.opencode/plugins/hiveops-governance/hooks/context-injection.ts`](.opencode/plugins/hiveops-governance/hooks/context-injection.ts:1)).
  - Includes operational surfaces in [`commands/`](commands/), [`skills/`](skills/), [`agents/`](agents/), [`workflows/`](workflows/).

- **HIVEMIND core layer (root + [`src`](src/))**
  - Purpose: project runtime logic and contract enforcement.
  - Core layers: [`src/tools/`](src/tools/), [`src/lib/`](src/lib/), [`src/hooks/`](src/hooks/), [`src/schemas/`](src/schemas/) ([`AGENTS.md`](AGENTS.md:105)).
  - Key contamination-relevant files: [`src/hooks/session-lifecycle.ts`](src/hooks/session-lifecycle.ts:1), [`src/hooks/messages-transform.ts`](src/hooks/messages-transform.ts:1).

- **Integration/self-fix layer (where both interact)**
  - Shared entry sequence before lineage routing is the only intended common lane ([`docs/journeys/DUAL-LINEAGE-USER-JOURNEY-STORIES-2026-03-04.md`](docs/journeys/DUAL-LINEAGE-USER-JOURNEY-STORIES-2026-03-04.md:39)).
  - After routing, artifacts and planning are separate; interaction should be controlled via delegation contracts ([`docs/journeys/DUAL-LINEAGE-USER-JOURNEY-STORIES-2026-03-04.md`](docs/journeys/DUAL-LINEAGE-USER-JOURNEY-STORIES-2026-03-04.md:429)).

5. **Tech Stack Matrix**

| Component | Layer | Purpose | Current Use | Stability |
|---|---|---|---|---|
| [`package.json`](package.json:1) | Runtime/Core | Node/TypeScript CLI framework base | Active | Medium |
| [`.opencode/plugins/hiveops-governance/hooks/context-injection.ts`](.opencode/plugins/hiveops-governance/hooks/context-injection.ts:1) | Extension | Plugin-side context injection | Active every turn | At Risk |
| [`src/hooks/session-lifecycle.ts`](src/hooks/session-lifecycle.ts:1) | Core | Session lifecycle context composition | Active every turn | At Risk |
| [`src/hooks/messages-transform.ts`](src/hooks/messages-transform.ts:1) | Core | Message transform + anchor/checklist injection | Active every turn | At Risk |
| [`src/lib/paths.ts`](src/lib/paths.ts:1) | Core | Session/effective path resolution | Active (Fix 3A done) | Improving |
| [`src/hooks/event-handler.ts`](src/hooks/event-handler.ts:1) | Core | Session bootstrap and init handling | Active (Fix 3B done) | Improving |
| [`src/schemas/brain-state.ts`](src/schemas/brain-state.ts:1) | Core | Brain-state schema contract | Detox applied | Medium |
| [`src/lib/detection.ts`](src/lib/detection.ts:1) | Core | Governance counters/health detection | Normalized contract active | Medium |
| [`tests/`](tests/) | Quality | Regression verification | Active, baseline revalidated on 2026-03-05 | Monitoring |

6. **Current State Assessment**

- **Working**
  - Refactor foundations completed: Fix 3A, 3B, 1.5A, 1.5B ([`AGENTS.md`](AGENTS.md:137)).
  - Type-check status documented as passing ([`AGENTS.md`](AGENTS.md:55)).
  - Boundary and governance docs are explicit and actionable ([`AGENTS.md`](AGENTS.md:181), [`docs/journeys/DUAL-LINEAGE-USER-JOURNEY-STORIES-2026-03-04.md`](docs/journeys/DUAL-LINEAGE-USER-JOURNEY-STORIES-2026-03-04.md:7)).

- **Partially working**
  - Session isolation direction is in place but full migration/decoupling chain is unfinished ([`AGENTS.md`](AGENTS.md:150)).
  - Schema/governance updates landed, but full regression confidence is pending test alignment.

- **Broken/unclear**
  - Dual-injector conflict remains active (primary contamination risk).
  - Maintain formal regression gate with `npm test` and targeted suites before restricted-zone edits.
  - Several restricted zones are not safely editable yet due to prerequisite order.

7. **Issues and Concerns Register**

| ID | Description | Scope (Isolated/Cross-domain) | Severity | Evidence | Suspected Cause |
|---|---|---|---|---|---|
| HM-01 | Dual per-turn injection conflict | Cross-domain | Critical | [`AGENTS.md`](AGENTS.md:123) | Overlapping extension + core injectors |
| HM-02 | Failing tests block progression | Isolated (quality) | High | [`AGENTS.md`](AGENTS.md:145) | Contract drift vs old test expectations |
| HM-03 | Restricted hook/state regions carry high regression risk | Cross-domain | High | [`AGENTS.md`](AGENTS.md:181) | Premature edits before prerequisite completion |
| HM-04 | Lineage-mixing hallucination risk | Cross-domain | High | [`docs/journeys/DUAL-LINEAGE-USER-JOURNEY-STORIES-2026-03-04.md`](docs/journeys/DUAL-LINEAGE-USER-JOURNEY-STORIES-2026-03-04.md:241) | Similar workflow pattern mistaken as shared artifact space |
| HM-05 | Incomplete clean-slate session migration | Cross-domain | High | [`AGENTS.md`](AGENTS.md:150) | Dependency chain not fully executed |
| HM-06 | Pending lineage ID schema hardening | Isolated (schema) | Medium | [`AGENTS.md`](AGENTS.md:150) | Deferred Fix 1.5C |
| HM-07 | Pending soft-governance dead-counter cleanup | Isolated (core logic) | Medium | [`AGENTS.md`](AGENTS.md:150) | Deferred Fix 1.5D |
| HM-08 | Relational staleness rewrite not started | Cross-domain | Medium | [`AGENTS.md`](AGENTS.md:150) | Blocked by upstream refactor dependencies |

8. **Isolation vs Combination Analysis**

- **What fails in isolation**
  - Test-contract mismatch in quality layer ([`tests/`](tests/)).
  - Pending schema/soft-governance cleanup tasks in core layer ([`src/schemas/`](src/schemas/), [`src/hooks/`](src/hooks/)).
  - Some stale assumptions in planning artifacts if consumed without validation.

- **What fails only when combined**
  - Extension injector + core injectors together amplify contradictory context and drift.
  - Mixed lineage planning (framework assets + implementation tasks in one stream) produces routing confusion and bad delegation.

- **Dependency collision points**
  - Shared state surfaces under [`.hivemind/state/`](.hivemind/state/).
  - Per-turn execution overlap between [`.opencode/plugins/hiveops-governance/hooks/context-injection.ts`](.opencode/plugins/hiveops-governance/hooks/context-injection.ts:1), [`src/hooks/session-lifecycle.ts`](src/hooks/session-lifecycle.ts:1), and [`src/hooks/messages-transform.ts`](src/hooks/messages-transform.ts:1).
  - Sequence violations against Node-1 prerequisite order ([`AGENTS.md`](AGENTS.md:150)).

9. **Dual-Lineage Risk Control**

- **Common hallucination traps**
  - Treating both lineages as one artifact universe after routing.
  - Assuming similarly named workflows imply shared ownership.
  - Pulling broad context dumps instead of targeted evidence.

- **Disambiguation rules**
  - If scope is extension/customization assets, route to extension/framework lineage.
  - If scope is core runtime implementation in [`src/`](src/), route to core/project lineage.
  - If request spans both, split into separate tasks/sessions with explicit boundaries.

- **Validation checks before acting**
  - Run shared entry checks and explicit lineage routing from [`docs/journeys/DUAL-LINEAGE-USER-JOURNEY-STORIES-2026-03-04.md`](docs/journeys/DUAL-LINEAGE-USER-JOURNEY-STORIES-2026-03-04.md:259).
  - Verify restricted zones and prerequisites in [`AGENTS.md`](AGENTS.md:181).
  - Require complete handoff packet fields before delegation ([`docs/journeys/DUAL-LINEAGE-USER-JOURNEY-STORIES-2026-03-04.md`](docs/journeys/DUAL-LINEAGE-USER-JOURNEY-STORIES-2026-03-04.md:430)).

10. **AI Agent Onboarding Checklist (Actionable)**

- [ ] Read [`AGENTS.md`](AGENTS.md:1), [`CONTAMINATION-GUARDRAILS.md`](CONTAMINATION-GUARDRAILS.md:1), and [`docs/journeys/DUAL-LINEAGE-USER-JOURNEY-STORIES-2026-03-04.md`](docs/journeys/DUAL-LINEAGE-USER-JOURNEY-STORIES-2026-03-04.md:1) before any work.
- [ ] Declare lineage and scope explicitly before planning.
- [ ] Keep extension-layer tasks and core-layer tasks separate unless cross-domain integration is explicitly required.
- [ ] Avoid restricted regions until prerequisites are satisfied.
- [ ] Use targeted evidence gathering; avoid context flooding.
- [ ] Treat regression deltas as a hard gate until explicitly triaged and approved.
- [ ] Use measurable acceptance criteria and hard-stop conditions in each handoff.
- [ ] Record assumptions/unknowns in every report.
- [ ] Re-check boundary integrity before each new delegation wave.

11. **Immediate Next-Step Workflow Priorities**

1. Obtain authorization and align the 11 failing test expectations ([`AGENTS.md`](AGENTS.md:145)).
2. Execute remaining Node-1 steps in strict order: Fix 1.5C → 1.5D → 3C-D → Fix 1 → Fix 2 ([`AGENTS.md`](AGENTS.md:150)).
3. Keep restricted zones frozen until prerequisite gates are passed ([`AGENTS.md`](AGENTS.md:181)).
4. Enforce lineage-safe handoff packets for all future delegations ([`docs/journeys/DUAL-LINEAGE-USER-JOURNEY-STORIES-2026-03-04.md`](docs/journeys/DUAL-LINEAGE-USER-JOURNEY-STORIES-2026-03-04.md:429)).
5. Re-validate contamination risk at each milestone using the same evidence anchors.

**Assumptions and Unknowns**
- Assumption A1: status entries in [`AGENTS.md`](AGENTS.md:137) reflect current repository reality.
- Unknown U1: there may be external session artifacts not represented in current indexed workspace listing.

## ⚠️ CONTAMINATION WARNING

This project has forensically proven context poisoning across 7+ agent sessions. Before doing ANY work, read:

→ **[CONTAMINATION-GUARDRAILS.md](./CONTAMINATION-GUARDRAILS.md)** — Toxic artifact registry, anti-patterns, safe protocols

### Non-Negotiable Runtime Conditions
1. **MUST** load agent-specific skills before acting
2. **MUST NOT** consume any `.md`, `.json`, `.yaml` artifacts unless passed via explicit delegation handoff with valid investigation from the prior agent's turn
3. **MUST NOT** read `.hivemind/state/brain.json` for routing or decisions
4. **MUST NOT** glob `**/*.md` — use targeted file reads only
5. **MUST** run `npx tsc --noEmit` after any code changes
6. If you violate any of the above: **STOP** immediately and capture the workflow state

---

## Current Objective: Meta-Builder Healer Refactor

Refactor the **`hivefiver`** module into a reliable "healer" for the project lineage team — a meta-builder orchestrator that can diagnose, refactor, debug, validate, and evolve the framework **without poisoning runtime context**.

### What hivefiver Is
- Meta-builder: engineers the tools that engineers use
- Framework doctor: diagnoses and repairs broken framework chains
- Quality gatekeeper: no asset ships without contract compliance

### What hivefiver Is NOT
- Product-only implementor (Pivoting to surgical refactor operation, allowing and shifting orientation to restructure and refactor the whole project)
- General assistant (redirects non-framework requests)

### Scope Boundaries

| Module | Status | Constraint |
|--------|--------|-----------|
| `hivefiver` | **IN SCOPE** — pivoting to surgical refactor operation | Allowing and shifting orientation to restructure and refactor the whole project (`.opencode/**`, `.hivemind/**`, `docs/**`, `src/**`, `tests/**`) |
| `hiveminder` | **OUT OF SCOPE** for implementation; **IN SCOPE** for compatibility | Agent profiles and subagents are shared — refactors must keep future compatibility |

### Core Problem Being Solved
Two independent auto-injection systems fire on EVERY LLM turn, injecting contradictory context from overlapping state files. This causes role-drift, hallucination, and context poisoning. See CONTAMINATION-GUARDRAILS.md §4.

---

## Build/Test Commands

```bash
npm test                                    # Run all tests (203 pass, 11 fail as of 2026-03-04)
npx tsx --test tests/filename.test.ts       # Run specific test
npx tsc --noEmit                           # Type check (currently PASSING)
npm run guard:public                       # Run BEFORE any master push
```

---

## Branch Policy

| Branch | Purpose |
|--------|---------|
| `dev-v3` | Development, planning, internal docs |
| `master` | Public release only (NO secrets, NO .opencode, NO planning docs) |

---

## Agent Registry

| Name | Type | Role | Scope Constraints | Location |
|------|------|------|-------------------|----------|
| **hiveminder** | Primary | Supreme orchestrator | No direct code edits; orchestrates via delegation. OUT OF SCOPE for now | `agents/hiveminder.md` |
| **hivefiver** | Meta-Builder | Framework asset builder + surgical refactor | **PIVOTED**: Surgical refactor operation across whole project (`.opencode/**`, `.hivemind/**`, `src/**`, `tests/**`, `docs/**`) | `agents/hivefiver.md` |
| **hivemaker** | Executor | Implementation specialist | `src/**`, `tests/**`, `docs/**` only; NO framework assets | `agents/hivemaker.md` |
| **hivehealer** | Remediation | Debugging, hardening | `src/**`, `tests/**`, `docs/**` only; NO framework assets | `agents/hivehealer.md` |
| **hiveplanner** | Planner | Phase planning, research synthesis | `docs/plans/` only; research + synthesis focus | `agents/hiveplanner.md` |
| **hiveq** | Verifier | Quality gates, PASS/FAIL verdicts | Read-only on code; verification reports only | `agents/hiveq.md` |
| **hivexplorer** | Investigator | Codebase research, evidence collection | Read-only; NO file modifications | `agents/hivexplorer.md` |
| **hiverd** | Research | External research, ecosystem analysis | External knowledge only; NO internal code edits | `agents/hiverd.md` |
| **hitea** | Testing | AI-driven testing infrastructure | `tests/**` only | `agents/hitea.md` |

### Delegation Hierarchy
```
User
└── hiveminder (Primary — currently inactive)
    └── hivefiver (Meta-Builder — ACTIVE)
        ├── hivemaker (Implementation)
        ├── hiveplanner (Planning)
        ├── hivexplorer (Investigation — terminal, read-only)
        ├── hiverd (External research — terminal)
        ├── hivehealer (Remediation)
        ├── hiveq (Quality gates)
        └── hitea (Testing)
```

---

## Architecture Essentials

### Layer Architecture
| Layer | Location | Role | Constraint |
|-------|----------|------|------------|
| **Tools** | `src/tools/` | Write-Only | CQRS: tools own mutations |
| **Libraries** | `src/lib/` | Subconscious Engine (pure TS) | No side effects |
| **Hooks** | `src/hooks/` | Read-Auto (inject context) | No mutations; read-only |
| **Schemas** | `src/schemas/` | DNA (Zod validation) | Source of truth for types |

### Critical Patterns

1. **State Mutation Queue**: ALL state changes MUST go through `src/lib/state-mutation-queue.ts`. Direct file writes to `.hivemind/` are forbidden.

2. **Path Resolution**: ALWAYS use `getEffectivePaths()` from `src/lib/paths.ts`. Never hardcode `.hivemind/` paths. New: `getSessionPaths()` for per-session state.

3. **CQRS Enforcement**: Hooks are READ-ONLY (context injection). Tools own WRITE operations. Violations break session integrity.

4. **Session Isolation**: New sessions get their own directory under `.hivemind/sessions/active/<session-id>/` with a clean-slate `profile.json` (agent: "unresolved" until `hivemind_declare` fires).

### Dual-Injection Systems (DANGER ZONE)

| System | File | Fires | What It Does |
|--------|------|-------|-------------|
| System 1 | `.opencode/plugins/hiveops-governance/hooks/context-injection.ts` | Every turn | Reads 6 state files, prepends to messages |
| System 2a | `src/hooks/session-lifecycle.ts` | Every turn | Reads 5 state files, appends to system |
| System 2b | `src/hooks/messages-transform.ts` | Every turn | Prepends anchors + appends checklist |

**These are the primary sources of context poisoning.** Do NOT edit them without completing Node 1 Fixes 3C-D and Fix 1 first.

---

## Development Status (Node 1: Injection Layer Refactoring)

### Completed
| Step | What | Evidence |
|------|------|---------|
| Fix 3A | `src/lib/paths.ts` — SessionPaths + getSessionPaths() | `npx tsc --noEmit` PASS |
| Fix 3B | `src/hooks/event-handler.ts` — session.created bootstrap | profile.json with agent:"unresolved" |
| Fix 1.5A | `src/schemas/brain-state.ts` — schema detox | Orphans pruned, cycle_log lobotomized |
| Fix 1.5B | `src/lib/detection.ts` — GovernanceCounters normalized | 4-field contract active: {drift, compaction, out_of_order, evidence_pressure} |

### Baseline History
| Step | What | Blocker |
|------|------|---------|
| Test alignment (historical) | Prior failing baseline was reconciled during guardrail-first stabilization | Continue enforcing full suite before Node-1 restricted-zone work |

### Not Started (Requires Authorization)
| Step | What | Prerequisite |
|------|------|-------------|
| Fix 1.5C | Lineage ID validation in hierarchy schema | Test alignment |
| Fix 1.5D | soft-governance.ts dead counter cleanup | Test alignment |
| Fix 3C-D | Clean-slate session state init + hook migration | Fix 1.5C/D |
| Fix 1 | Dual-injection decoupling (agent guards) | Fix 3C-D |
| Fix 2 | Relational staleness rewrite | Fix 1 |

---

## Workflow Standards

### TODO Discipline (All Agents)
1. **Turn Start**: Read current TODO list
2. **First Item**: Entry point for current turn
3. **Last Item**: MUST be `HARD STOP — [verification condition]`
4. **After Execution**: Update TODO list immediately
5. **HARD STOP Rule**: Stop and report; do NOT continue past it

### No-Guess Mandate
1. **DO NOT** reason from training data about unfamiliar technology
2. **MUST** use MCP tools first: Tavily, Context7, DeepWiki, Repomix
3. **If ALL MCP tools fail**: State explicitly and STOP
4. All technical claims must cite MCP source

### Safe Delegation Contract
See CONTAMINATION-GUARDRAILS.md §3 for the complete delegation safety protocol.

---

## Restricted Regions (DO NOT ENTER Without Authorization)

See CONTAMINATION-GUARDRAILS.md §6 for the complete list with rationales.

Key restrictions:
- `.opencode/plugins/hiveops-governance/hooks/` — System 1 injection, needs Fix 1 first
- `src/hooks/session-lifecycle.ts` — System 2a injection, needs Fix 1 first
- `src/hooks/messages-transform.ts` — System 2b injection, needs Fix 1 first
- `.hivemind/state/` — Global singleton state, needs Fix 3C-D first
- `.hivemind/plans/` — Unvalidated planning artifacts from multiple agents

---

## Planning Documents

| Document | Purpose | Status | Trust Level |
|----------|---------|--------|-------------|
| `docs/plans/NODE-1-INJECTION-LAYER-REFACTOR-2026-03-04.md` | Node 1 blueprint v2.1 | Active | HIGH (approved with amendments) |
| `docs/plans/SPEC-COMPACT-SUPERIORITY-ARCHITECTURE-2026-03-03.md` | Architecture spec | Reference | MEDIUM (needs validation) |
| `docs/plans/ENTITY-RELATIONAL-MAP-2026-03-03.md` | Entity relationships | Reference | MEDIUM (needs validation) |
| `docs/plans/EXPLORE1-ARCH-STRUCTURE-2026-03-03.md` | Architecture exploration | Reference | MEDIUM (needs validation) |
| `CONTAMINATION-GUARDRAILS.md` | Forensic contamination defense | Active | HIGH (evidence-based) |

---

## Related Files

- `CLAUDE.md` — Project entry point for Claude/OpenCode sessions
- `CONTAMINATION-GUARDRAILS.md` — Forensic contamination defense guide
- `AGENT_RULES.md` — Constitutional architecture document (reference only)

<!-- HIVEMIND-GOVERNANCE-START -->

## HiveMind Context Governance

This project uses **HiveMind** for AI session management. It prevents drift, tracks decisions, and preserves memory across sessions.

### Required Workflow

1. **START** every session with:
   ```
   declare_intent({ mode: "plan_driven" | "quick_fix" | "exploration", focus: "What you're working on" })
   ```
2. **UPDATE** when switching focus:
   ```
   map_context({ level: "trajectory" | "tactic" | "action", content: "New focus" })
   ```
3. **END** when done:
   ```
   compact_session({ summary: "What was accomplished" })
   ```

### Available Tools (10)

| Group | Tools |
|-------|-------|
| Core | `declare_intent`, `map_context`, `compact_session` |
| Cognitive Mesh | `scan_hierarchy`, `save_anchor`, `think_back` |
| Memory | `save_mem`, `recall_mems` |
| Hierarchy | `hierarchy_manage` |
| Delegation | `export_cycle` |

### Why It Matters

- **Without `declare_intent`**: Drift detection is OFF, work is untracked
- **Without `map_context`**: Context degrades every turn, warnings pile up
- **Without `compact_session`**: Intelligence lost on session end
- **`save_mem` + `recall_mems`**: Persistent memory across sessions — decisions survive

### State Files

- `.hivemind/state/brain.json` — Machine state (do not edit manually)
- `.hivemind/state/hierarchy.json` — Decision tree
- `.hivemind/sessions/` — Session files and archives

<!-- HIVEMIND-GOVERNANCE-END -->
