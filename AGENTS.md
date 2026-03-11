# AGENTS.md

This file provides guidance to ALL agents working in this repository.

**Last Updated**: 2026-03-10
**Version**: 3.3-strategic-resync
**Maintained By**: hivefiver meta-builder
**Symlinked To**: `.hivemind/AGENTS.md`, `.opencode/AGENTS.md`, `src/AGENTS.md`

---
## Aware of your role while having SKILLS loaded

- Knowing your role in agents' profile prioritize it first of everything else

## SKILL must be loaded

- according to your workflows and role-specific SKILLS and SKILL sets must always be accommodated 

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
- Root framework asset source belongs to [`commands/`](commands/), [`skills/`](skills/), [`workflows/`](workflows/), [`agents/`](agents/), [`templates/`](templates/), [`prompts/`](prompts/), and [`references/`](references/); [`.opencode/`](.opencode/) is the delivery mirror and adapter surface.
- Core implementation/runtime belongs to repository root + [`src/`](src/) (tools/libs/hooks/schemas) and remains the canonical runtime/governance owner ([`AGENTS.md`](AGENTS.md:105)).
- Main unresolved system risk is still prompt-surface ownership drift across extension and core hooks, but the first de-duplication slice is now landed.
- March 6 hardening milestones are already in place: `task_id` continuity, `hivemind_inspect.traverse` v1, ownership coverage tests, tool-gate demotion, and child-session minimization.
- `.hivemind/project/planning/` is now the canonical readable planning root; legacy `.planning/` remains compatibility-only while consumers are normalized.
- Regression baseline was previously blocked by stale expectations; targeted verification gates are now active and must stay green before each new restricted edit.
- Restricted regions remain explicit high-risk zones, but phased plan-backed edits are now allowed when ownership coverage and verification are present ([`AGENTS.md`](AGENTS.md:181)).
- Most confusion/hallucination risk comes from lineage mixing and from treating similar workflow patterns as shared artifacts.
- Current priority is bootstrap-and-composition-first strategic resync on `.hivemind` formation, readable planning SOT, and continuity design; sidecar concerns are not the active long-haul focus.

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
- The March 6 baseline is now being carried into a strategic resync centered on reset/init formation, `.hivemind` composition, and planning-root normalization instead of immediate deeper hook refactors.
- Remaining steps are dependency-gated and currently constrained by test-alignment authorization ([`AGENTS.md`](AGENTS.md:145), [`AGENTS.md`](AGENTS.md:150)).

4. **Architecture and Domain Boundaries**

- **[`.opencode`](.opencode/) extension layer**
  - Purpose: delivery mirror, OpenCode adapter surface, and fallback-only wrapper layer.
  - Includes plugin/hook side adapter behavior (notably [`.opencode/plugins/hiveops-governance/hooks/context-injection.ts`](.opencode/plugins/hiveops-governance/hooks/context-injection.ts:1)).
  - Includes mirrored operational surfaces projected from the root framework asset folders.

- **HIVEMIND core layer (root + [`src`](src/))**
  - Purpose: canonical project runtime logic, contract enforcement, and governance ownership.
  - Core layers: [`src/tools/`](src/tools/), [`src/lib/`](src/lib/), [`src/hooks/`](src/hooks/), [`src/schemas/`](src/schemas/) ([`AGENTS.md`](AGENTS.md:105)).
  - Key contamination-relevant files: [`src/hooks/session-lifecycle.ts`](src/hooks/session-lifecycle.ts:1), [`src/hooks/messages-transform.ts`](src/hooks/messages-transform.ts:1).

- **Integration/self-fix layer (where both interact)**
  - Shared entry sequence before lineage routing is the only intended common lane ([`docs/journeys/DUAL-LINEAGE-USER-JOURNEY-STORIES-2026-03-04.md`](docs/journeys/DUAL-LINEAGE-USER-JOURNEY-STORIES-2026-03-04.md:39)).
  - After routing, artifacts and planning are separate; interaction should be controlled via delegation contracts ([`docs/journeys/DUAL-LINEAGE-USER-JOURNEY-STORIES-2026-03-04.md`](docs/journeys/DUAL-LINEAGE-USER-JOURNEY-STORIES-2026-03-04.md:429)).
  - Active refactor target: keep `src/**` as canonical authority and narrow `.opencode/**` to mirror/adapter/fallback behavior.

5. **Tech Stack Matrix**

| Component | Layer | Purpose | Current Use | Stability |
|---|---|---|---|---|
| [`package.json`](package.json:1) | Runtime/Core | Node/TypeScript CLI framework base | Active | Medium |
| [`.opencode/plugins/hiveops-governance/hooks/context-injection.ts`](.opencode/plugins/hiveops-governance/hooks/context-injection.ts:1) | Extension | Plugin-side adapter/fallback injection surface | **DISABLED 2026-03-08** — removed from `opencode.json`; all files marked `@deprecated` | Archived |
| [`src/hooks/session-lifecycle.ts`](src/hooks/session-lifecycle.ts:1) | Core | Session lifecycle context composition | Active every turn | At Risk |
| [`src/hooks/messages-transform.ts`](src/hooks/messages-transform.ts:1) | Core | Message transform + anchor/checklist injection | Active every turn | At Risk |
| [`src/lib/paths.ts`](src/lib/paths.ts:1) | Core | Session/effective path resolution | Active (Fix 3A done) | Improving |
| [`src/hooks/event-handler.ts`](src/hooks/event-handler.ts:1) | Core | Session bootstrap and init handling | Active (Fix 3B done) | Improving |
| [`src/schemas/brain-state.ts`](src/schemas/brain-state.ts:1) | Core | Brain-state schema contract | Detox applied | Medium |
| [`src/lib/detection.ts`](src/lib/detection.ts:1) | Core | Governance counters/health detection | Normalized contract active | Medium |
| [`tests/`](tests/) | Quality | Regression verification | Active, baseline revalidated on 2026-03-05 | Monitoring |

6. **Current State Assessment**

- **Working**
  - Refactor foundations completed: Fix 3A, 3B, 1.5A, 1.5B.
  - `task_id` continuity now persists through cycle capture/export.
  - `hivemind_inspect.traverse` v1 is active for hierarchy-first navigation.
  - Child-session minimization is active in the core runtime hooks.
  - Type-check status documented as passing ([`AGENTS.md`](AGENTS.md:55)).
  - Boundary and governance docs are explicit and actionable ([`AGENTS.md`](AGENTS.md:181), [`docs/journeys/DUAL-LINEAGE-USER-JOURNEY-STORIES-2026-03-04.md`](docs/journeys/DUAL-LINEAGE-USER-JOURNEY-STORIES-2026-03-04.md:7)).

- **Partially working**
- Session isolation direction is in place, child-session prompt load is reduced, and direct GX-Pack fallback runtime coverage now exists for the real plugin hook boundary.
  - Prompt-surface ownership is safer than before, but the full canonical ownership migration is not finished.
  - The canonical planning root now exists under `.hivemind/project/planning/`, but consumer normalization and hierarchy governance are still in progress.

- **Broken/unclear**
  - Dual-injector conflict is reduced, not eliminated.
  - `.opencode/plugins/**` still behaves partly like a second runtime control plane even though the source-canonical target is now `src/**`.
  - State authority is still split across `brain.json`, `graph/*.json`, and `hierarchy.json`; this is intentional for now but must remain disciplined.
  - Readable planning-root hierarchy is still maturing from shell-level scaffolding into governed long-haul SOT.
  - Maintain formal regression gates with `npx tsc --noEmit` plus targeted suites before restricted-zone edits.

7. **Issues and Concerns Register**

| ID | Description | Scope (Isolated/Cross-domain) | Severity | Evidence | Suspected Cause |
|---|---|---|---|---|---|
| HM-01 | Dual per-turn injection conflict | Cross-domain | ~~Critical~~ **Resolved** | [`AGENTS.md`](AGENTS.md:123) | Overlapping extension + core injectors — **RESOLVED 2026-03-08**: `hiveops-governance` plugin disabled in `opencode.json`, all files `@deprecated`. `src/hooks/` is now sole governance owner. |
| HM-09 | Source-vs-mirror ownership drift between root framework assets and `.opencode/**` | Cross-domain | High | `src/cli/sync-assets.ts`, `src/lib/hivefiver-integration.ts` | Dual-authority language around authored and mirrored assets |
| HM-02 | Ownership regressions can reintroduce stale prompt duplication | Isolated (quality) | High | `tests/injection-surface-ownership.test.ts` | Prompt-surface cleanup without coverage |
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
  - Mirror assets and root authored assets create authority ambiguity if later cycles reason from both as peers.
  - Mixed lineage planning (framework assets + implementation tasks in one stream) produces routing confusion and bad delegation.

- **Dependency collision points**
  - Shared state surfaces under [`.hivemind/state/`](.hivemind/state/).
  - Per-turn execution overlap between [`.opencode/plugins/hiveops-governance/hooks/context-injection.ts`](.opencode/plugins/hiveops-governance/hooks/context-injection.ts:1), [`src/hooks/session-lifecycle.ts`](src/hooks/session-lifecycle.ts:1), and [`src/hooks/messages-transform.ts`](src/hooks/messages-transform.ts:1).
  - Authored root assets vs mirrored `.opencode` assets when audits or planning artifacts treat both as first-class authorities.
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

1. Preserve the new verification baseline: `npx tsc --noEmit` + targeted ownership/child-session suites before each restricted change.
2. Use the state-authority pass in `docs/plans/2026-03-06-state-authority-rationalization-pass.md` as the active source for injection/navigation/session-metadata authority.
3. Execute the strategic resync audit on reset/init/bootstrap, `.hivemind` composition, and planning-root normalization before reopening deeper runtime refactors.
4. Use the fresh manual Devin packets in `docs/plans/` only after the local framing is stable, then treat returned answers as external synthesis input rather than authority.
5. Keep the ecosystem control master as the top-level decision surface; runtime context cleanup remains active only as Workstream B and must not become the project-wide master path again.
6. Use the ecosystem execution constitution before later refactor implementation so subagents, TDD, and verification all share the same packet and stop rules.
7. Treat the direct fallback harness as complete for the current hook boundary, then use consolidation and truth compilation before deciding whether any further context extraction is justified.

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

The active wave inside that objective is now a strategic resync:

- audit how reset/init and later automation form `.hivemind`
- normalize `.hivemind/project/planning/` as the readable planning root
- define the second-lineage `hivefiver` operating model and routing hierarchy
- prepare manual external synthesis packets
- only then reopen the next implementation tranche

### What hivefiver Is
- Meta-builder: engineers the tools that engineers use
- Framework doctor: diagnoses and repairs broken framework chains
- Tailored meta-package builder: designs and evolves agents, commands, tools, plugins, workflows, and guidance surfaces around user intent
- Adaptive operator guide: changes workflow depth and pace based on project stage, domain pressure, package topology, and user technology awareness
- Quality gatekeeper: no asset ships without contract compliance

### What hivefiver Is NOT
- Product-only implementor (Pivoting to surgical refactor operation, allowing and shifting orientation to restructure and refactor the whole project)
- General assistant (redirects non-framework requests)

### Scope Boundaries

| Module | Status | Constraint |
|--------|--------|-----------|
| `hivefiver` | **IN SCOPE** — pivoting to surgical refactor operation | Allowing and shifting orientation to restructure and refactor the whole project (`.opencode/**`, `.hivemind/**`, `docs/**`, `src/**`, `tests/**`) |
| `hiveminder` | **OUT OF SCOPE** for implementation; **IN SCOPE** for compatibility | Agent profiles and subagents are shared — refactors must keep future compatibility |

### Codex Sidecar Surfaces

- `.codex/**` and `docs/framework/**` remain optional mirror surfaces only.
- They are not the active priority in the current long-haul wave.
- OpenCode runtime and `.hivemind` composition remain the active source of truth for this strategic resync.

### Core Problem Being Solved
Two independent auto-injection systems fire on EVERY LLM turn, injecting contradictory context from overlapping state files. This causes role-drift, hallucination, and context poisoning. See CONTAMINATION-GUARDRAILS.md §4.

---

## Build/Test Commands

```bash
npm test                                    # Run all tests (use before major milestone claims)
npx tsx --test tests/filename.test.ts       # Run specific test
npm run typecheck                           # Core type check wrapper
npm run typecheck:all                       # Core + dashboard type checks
npm run lint:boundary                       # SDK/boundary/public-surface checks
npm run guard:public                        # Run BEFORE any master push
```

## Operational CLI Commands

```bash
npx hivemind-context-governance             # Interactive setup wizard
npx hivemind-context-governance init --mode assisted
npx hivemind-context-governance migrate     # One-time legacy flat-file -> graph migration
npx hivemind-context-governance doctor      # Diagnose/repair .hivemind lineage integrity
npx hivemind-context-governance status
npx hivemind-context-governance settings
npx hivemind-context-governance scan --action analyze --json
npx hivemind-context-governance scan --action recommend
npx hivemind-context-governance scan --action orchestrate --json
npx hivemind-context-governance sync-assets --target project
npx hivemind-context-governance compact     # Archive current session and reset (OpenCode only)
npx hivemind-context-governance dashboard --refresh 1   # optional (requires ink + react peers)
npx hivemind-context-governance purge                  # DANGER: removes .hivemind/ entirely
npx hivemind-context-governance help
npx hivemind status                                    # CLI alias via package bin
```

## Command Pack (Current)

```bash
commands/hivefiver-architect.md
commands/hivefiver-audit.md
commands/hivefiver-build.md
commands/hivefiver-continue.md
commands/hivefiver-discovery.md
commands/hivefiver-doctor.md
commands/hivefiver-intake.md
commands/hivefiver-plan-spawn.md
commands/hivefiver-spec.md
commands/hivefiver-start.md
commands/hivefiver.md
commands/hivemind-clarify.md
commands/hivemind-compact.md
commands/hivemind-context.md
commands/hivemind-dashboard.md
commands/hivemind-debug-trigger.md
commands/hivemind-debug-verify.md
commands/hivemind-delegate.md
commands/hivemind-lint.md
commands/hivemind-pre-stop.md
commands/hivemind-scan.md
commands/hivemind-status.md
commands/hiveminder-orchestrate.md
commands/hiveq-audit.md
commands/hiveq-compliance.md
commands/hiveq-gate-check.md
commands/hiveq-lint.md
commands/hiveq-regression.md
commands/hiveq-verify.md
commands/hiverd-analyze.md
commands/hiverd-brainstorm.md
commands/hiverd-compare.md
commands/hiverd-document.md
commands/hiverd-research.md
commands/hiverd-synthesize.md
```

## Workflow Pack (Current)

```bash
workflows/hivemind-brownfield-bootstrap.yaml
workflows/feature-sprint.yaml
workflows/bug-remediation.yaml
workflows/spec-generation.yaml
workflows/research-synthesis.yaml
workflows/sequential-delegation-workflow.yaml
workflows/composed-workflow.yaml
workflows/verification-gate.yaml
workflows/hiveq-audit-workflow.yaml
workflows/hiveq-gate-enforcement.yaml
workflows/hiveq-verification-pipeline.yaml
workflows/hiveq-regression-suite.yaml
workflows/hivefiver-mcp-fallback.yaml
workflows/hivefiver-enterprise-architect.yaml
workflows/hivefiver-enterprise.yaml
workflows/hivefiver-floppy-engineer.yaml
workflows/hivefiver-vibecoder.yaml
workflows/hiverd-brainstorm-session.yaml
workflows/hiverd-comparative-analysis.yaml
workflows/hiverd-deep-research.yaml
workflows/hiverd-synthesis-pipeline.yaml
```

TODO (2026-03-10): No additional `commands/*.md` or `workflows/*.yaml` files discovered beyond this list.

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

### Dual-Injection Systems (HIGH-RISK ZONE)

| System | File | Fires | What It Does |
|--------|------|-------|-------------|
| ~~System 1~~ | `.opencode/plugins/hiveops-governance/hooks/context-injection.ts` | **DISABLED** | ~~Prepends GX-Pack governance context~~ — Plugin removed from `opencode.json` 2026-03-08. All files `@deprecated`. |
| System 2a | `src/hooks/session-lifecycle.ts` | Every turn | Appends governance/system context with child-session suppression (now sole system prompt owner) |
| System 2b | `src/hooks/messages-transform.ts` | Every turn | Prepends structured context and appends checklist with child-session minimization |

**These remain the primary contamination surfaces.** Only edit them under the active phased plan, with ownership tests and fresh verification evidence.

---

## Development Status (Node 1: Injection Layer Refactoring)

### Completed
| Step | What | Evidence |
|------|------|---------|
| Fix 3A | `src/lib/paths.ts` — SessionPaths + getSessionPaths() | `npx tsc --noEmit` PASS |
| Fix 3B | `src/hooks/event-handler.ts` — session.created bootstrap | profile.json with agent:"unresolved" |
| Fix 1.5A | `src/schemas/brain-state.ts` — schema detox | Orphans pruned, cycle_log lobotomized |
| Fix 1.5B | `src/lib/detection.ts` — GovernanceCounters normalized | 4-field contract active: {drift, compaction, out_of_order, evidence_pressure} |
| March 6A | `task_id` continuity in `cycle_log` | `tests/cycle-task-id.test.ts` PASS |
| March 6B | `hivemind_inspect.traverse` v1 | `tests/hivemind-inspect-traverse.test.ts` PASS |
| March 6C | Prompt-surface coverage lock + first de-dup slice | ownership + budget contract tests PASS |
| March 6D | `tool-gate` advisory-only demotion | `tests/tool-gate-readonly.test.ts` PASS |
| March 6E | Child-session runtime minimization | `tests/child-session-injection-policy.test.ts` PASS |

### Baseline History
| Step | What | Blocker |
|------|------|---------|
| Test alignment (historical) | Prior failing baseline was reconciled during guardrail-first stabilization | Continue enforcing full suite before Node-1 restricted-zone work |

### Active / Remaining
| Step | What | Prerequisite |
|------|------|-------------|
| Next 1 | QA / research workflow design pass | Preserve March 6 authority split |
| Next 2 | Workstream B consolidation and truth compilation | Keep the current runtime tranche stable and subordinate before any further extraction |
| Next 3 | Workstream B consolidation review gate | Ownership + child-session tests stay green and `01-34-PLAN.md` explicitly allows continuation |
| Later | Fix 1.5C / 1.5D follow-up cleanup | Active baseline remains green |
| Later | Relational staleness rewrite | Follow-on authority decisions stay stable |

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

## Restricted Regions (ENTER ONLY WITH PLAN + VERIFICATION)

See CONTAMINATION-GUARDRAILS.md §6 for the complete list with rationales.

Key restrictions:
- `.opencode/plugins/hiveops-governance/hooks/` — ~~System 1 injection~~ **DISABLED 2026-03-08**: Plugin removed from `opencode.json`, all files `@deprecated`. No longer a restricted region.
- `src/hooks/session-lifecycle.ts` — System 2a injection, high-risk ownership surface
- `src/hooks/messages-transform.ts` — System 2b injection, high-risk ownership surface
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
