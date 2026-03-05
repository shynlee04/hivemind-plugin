# CLAUDE.md — Project Entry Point

**Project**: hivemind-plugin (OpenCode meta-framework engine)
**Status**: Active Healer Refactor — Node 1 Injection Layer in progress
**Last Updated**: 2026-03-04

---
## JSDOC Enforcement  
CRITICAL: Before modifying any function, you MUST:  
1. Read the entire JSDoc section  
2. Update the @param and @returns tags  
3. Preserve all @example blocks

## MANDATORY FIRST READS

Before ANY action, read these documents in order:

1. **[AGENTS.md](./AGENTS.md)** — Agent registry, architecture, delegation hierarchy, workflow standards
2. **[CONTAMINATION-GUARDRAILS.md](./CONTAMINATION-GUARDRAILS.md)** — Toxic artifact registry, proven anti-patterns, safe delegation contracts, current dev status

These documents are symlinked into `.hivemind/`, `.opencode/`, `src/`, and `docs/` for visibility in every working directory.

---
1. **Executive Snapshot (8–12 bullets)**

- HIVEMIND is a meta-framework project built on Opencode and currently running in “integrate while self-fixing” mode ([`AGENTS.md`](AGENTS.md:20), [`CLAUDE.md`](CLAUDE.md:1)).
- The workflow model is dual-lineage: one shared entry sequence, then strict routing into two separate spaces ([`docs/journeys/DUAL-LINEAGE-USER-JOURNEY-STORIES-2026-03-04.md`](docs/journeys/DUAL-LINEAGE-USER-JOURNEY-STORIES-2026-03-04.md:39)).
- Extension/customization surface belongs to [`.opencode/`](.opencode/), [`commands/`](commands/), [`skills/`](skills/), [`workflows/`](workflows/).
- Core implementation/runtime belongs to repository root + [`src/`](src/) (tools/libs/hooks/schemas) ([`AGENTS.md`](AGENTS.md:105)).
- Main unresolved system risk is dual per-turn context injection conflict across extension and core hooks ([`AGENTS.md`](AGENTS.md:123)).
- Node-1 has partial completed fixes: path/session bootstrap + schema/governance normalization ([`AGENTS.md`](AGENTS.md:137)).
- Progress is blocked by authorization for test expectation updates; 11 tests remain failing by known contract shift ([`AGENTS.md`](AGENTS.md:145)).
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
| [`tests/`](tests/) | Quality | Regression verification | Active, 11 failing cases | Blocked |

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
  - 11 failing tests remain a formal gate pending authorization.
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
- [ ] Treat 11 failing tests as a known hard gate until authorization is granted.
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

## CRITICAL SAFETY RULES

### DO NOT (Non-Negotiable)
- **DO NOT** read `.hivemind/state/brain.json` for routing or decisions
- **DO NOT** glob `**/*.md` — this causes context explosion (proven: 100+ files returned)
- **DO NOT** read `session-ses_*.md` exports without explicit user instruction
- **DO NOT** trust handoff claims without verifying referenced files exist
- **DO NOT** consume any `.md`, `.json`, `.yaml` artifact that was not passed via explicit delegation handoff from the prior agent's turn
- **DO NOT** load more than 2 skills per session
- **DO NOT** advance into restricted regions (see CONTAMINATION-GUARDRAILS.md §6) without user authorization

### DO (Required)
- **DO** declare your agent identity and session type at session start
- **DO** check the human user's most recent message for current intent before acting
- **DO** verify file existence before consuming any referenced planning artifact
- **DO** run `npx tsc --noEmit` before and after code changes
- **DO** run `npm test` before claiming any work is complete
- **DO** use targeted file reads, never broad globs

---

## CURRENT OBJECTIVE: Meta-Builder Healer Refactor

Refactor the `hivefiver` meta-builder module into a reliable healer for the project lineage team — an orchestrator that can diagnose, refactor, debug, validate, and evolve the framework WITHOUT poisoning runtime context.

### Active Work: Node 1 — Injection Layer Refactoring
- Fix 3A/3B (Session Isolation) — ✅ DONE
- Fix 1.5A/1.5B (Schema Detox) — ✅ DONE
- Test alignment — ⏳ BLOCKED (11 tests failing from schema contract changes)
- Fix 1.5C/D, Fix 1, Fix 2 — ⏳ NOT STARTED

### Core Problem Being Solved
Two independent auto-injection systems fire on every LLM turn, injecting contradictory context from overlapping state files. This causes role-drift, hallucination, and context poisoning across all agents.

See CONTAMINATION-GUARDRAILS.md §4 for the full Dual-Injection Conflict documentation.

---

## BUILD/TEST COMMANDS

```bash
npm test                                  # Run all tests
npx tsx --test tests/filename.test.ts     # Run specific test
npx tsc --noEmit                         # Type check
npm run guard:public                     # Run before any master push
```

---

## ARCHITECTURE QUICK REFERENCE

| Layer | Location | Role | Constraint |
|-------|----------|------|------------|
| Tools | `src/tools/` | Write-Only | CQRS: tools own mutations |
| Libraries | `src/lib/` | Pure TS engine | No side effects |
| Hooks | `src/hooks/` | Read-Auto (inject) | No mutations; read-only |
| Schemas | `src/schemas/` | DNA (Zod) | Source of truth for types |

### Key Files
| File | Purpose |
|------|---------|
| `src/hooks/session-lifecycle.ts` | Context injection every turn (System 2a) |
| `src/hooks/messages-transform.ts` | Message transform every turn (System 2b) |
| `.opencode/plugins/hiveops-governance/hooks/context-injection.ts` | Plugin injection every turn (System 1) |
| `src/lib/paths.ts` | Path resolution SOT (now includes session-scoped paths) |
| `src/lib/state-mutation-queue.ts` | ALL state mutations go through here |

---

## AGENT DELEGATION HIERARCHY

```
User
└── hiveminder (Primary — OUT OF SCOPE for implementation, IN SCOPE for compatibility)
    └── hivefiver (Meta-Builder — ACTIVE, IN SCOPE)
        ├── hivemaker (Implementation)
        ├── hiveplanner (Planning)
        ├── hivexplorer (Investigation — read-only)
        ├── hiverd (External research)
        ├── hivehealer (Remediation)
        ├── hiveq (Quality gates)
        └── hitea (Testing)
```

---

## BRANCH POLICY

| Branch | Purpose |
|--------|---------|
| `dev-v3` | Development, planning, internal docs |
| `master` | Public release only (NO secrets, NO .opencode, NO planning docs) |

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

