# Phase CA-04: CRUD Ownership Modules + Lifecycle Verification - Context

**Gathered:** 2026-05-07
**Status:** Ready for planning

## Phase Boundary

CA-04 establishes **typed CRUD ownership modules** for every `.hivemind/` subdirectory, wires the `cross_session_tasks_dependencies_validation` toggle to `lifecycle-manager.ts`, performs a **full runtime lifecycle audit** against the 9-surface mutation authority table and CQRS boundaries, and validates cross-lineage naming conventions (hm-*/hf-*/gate-*/stack-*) across all shipped primitives.

This phase is the **architectural integrity capstone** for the core-architecture workstream — it ensures every `.hivemind/` directory has a single owning module responsible for all reads and writes (no ad-hoc file access), validates that the existing 34 src/lib modules comply with the CQRS contract, and surfaces gap intelligence for the 7 remaining workstreams.

### Scope Delivered

1. **Tiered CRUD ownership modules** — ~15 new/expanded `src/lib/` modules providing typed read/write operations for `.hivemind/` subdirectories, tiered by mutation authority (CRUD, append-only, read-only per dir).
2. **Toggle wiring** — `cross_session_tasks_dependencies_validation` wired to `lifecycle-manager.ts` consumer (hook gate + defensive tool check). Remaining 3 toggles stay doc-only with updated `@future-consumer` annotations.
3. **Lifecycle audit** — Phase 1: verification-only pass across all 34 src/lib modules using gate-l3-lifecycle-integration criteria (9-surface mutation authority, CQRS boundaries, actor hierarchy). Phase 2: targeted fixes on the 6 CRUD-owner modules.
4. **Naming convention validation** — Phase 1: full directory scan + report across all 56 shipped agents and 51 active skills. Phase 2: reusable CI validation script with sample validation (44 representative primitives).
5. **Canonical references** — All deferred items, gap findings, and missing primitives tracked in REQUIREMENTS.md, STATE.md, ROADMAP.md and follow-up context for downstream phases.

### Out of Scope (Deferred)

- **Full CRUD for all 19 directories** — Tiered approach used instead; full uniform CRUD deferred until other workstreams shape their directory interfaces.
- **Wiring of trajectory_control, advanced_continuity_validation, task_plus_enabled** — Doc-only annotations updated; wiring deferred to WS-6 (trajectory-task-plus) or future CA phases.
- **ui_phase, ui_safety_gate, ai_integration_phase toggle wiring** — Owned by WS-2/WS-8 (sidecar UI) and WS-4 (auto-commands). Not in CA-04 scope.
- **Auto-fixes for naming violations** — Scan + report only. Auto-fixes deferred to dedicated naming-quality wave.
- **Full lifecycle audit of all 34 modules with fixes** — 28 non-CRUD-owner modules get verification-only pass; fixes deferred to dedicated CA-05 or equivalent.
- **E2E runtime UAT validation** — 19 blocked UATs from CA-03 still require live OpenCode session. CA-04 adds code-level lifecycle audit but does not resolve the e2e session gap.
- **Tool guard enforcement (blocking)** — Advisory only. Blocking post-GA.

---

## Implementation Decisions

### CA-04 Scope
- **D-01:** CA-04 scope is tiered CRUD ownership + lifecycle audit + naming validation + single toggle wiring. It is NOT "full uniform CRUD for everything" — that would violate Q2/Q3 and over-engineer for directories whose interfaces are not yet shaped by other workstreams.

### CRUD Module Depth (Tiered by Mutation Need)

- **D-02:** CRUD operations are tiered by directory semantics, not uniform across all 19 `.hivemind/` subdirectories. Three tiers:
  - **CRUD tier** (7 dirs): `state/`, `delegation-managements/`, `registries/`, `task-managements/`, `uat/`, `manifests/`, `configs.json` — full Create/Read/Update/Delete via owning module.
  - **Append-only tier** (7 dirs): `journal/`, `lineage/`, `event-tracker/`, `daily-notes/`, `poor-prompts/`, `artifacts/`, `logs/` — Create + Read + Append only (no delete, no update of existing entries). Respects Q3 journal append-only decision.
  - **Read-only tier** (6 dirs): `runtime/`, `sidecar/`, `hf-brain/`, `hm-brain/`, `onboarding/`, `.hivemind/` root — Read only from owning module. Respects Q2 sidecar READ-ONLY design and Q6 state-root separation.
- **D-03:** Each directory gets exactly ONE owning module in `src/lib/` with typed TypeScript functions. No other module writes to that directory. Enforced by D-CRUD-05 from WS-1 Restructuring.
- **D-04:** Existing modules already serving as de-facto owners are formalized: `continuity.ts` → `state/`, `delegation-persistence.ts` → `delegation-managements/`. New modules created for remaining directories.
- **D-05:** A `DirectoryMutationTier` enum is added to `src/lib/types.ts` (`CRUD`, `APPEND_ONLY`, `READ_ONLY`). Each owning module exports its tier as a constant for runtime validation and audit.
- **D-06:** Deferred directories (those whose interfaces depend on future workstreams) are documented with `@future-owner` JSDoc annotations instead of placeholder modules. Their CRUD operations are defined as interface contracts to be implemented when the owning workstream reaches them.

### Toggle Wiring

- **D-07:** Only `cross_session_tasks_dependencies_validation` is wired in CA-04. Consumer: `lifecycle-manager.ts`. Pattern follows CA-03 D-03 (hook gates on toggle, tool checks defensively). Toggle defaults to `false` (safe no-op) — validation is opt-in per session.
- **D-08:** Remaining 3 CA-04-targeted toggles (`trajectory_control`, `advanced_continuity_validation`, `task_plus_enabled`) stay doc-only. `@future-consumer` annotations updated to reflect current consumption status. Wiring deferred to WS-6 (trajectory-task-plus) phases.
- **D-09:** The `@future-consumer` annotation format is updated from `@future-consumer <module> — CA-04` to include a status field: `@future-consumer <module> — DEFERRED to WS-6` or `@future-consumer <module> — WIRED in CA-04 (lifecycle-manager.ts)`.

### Lifecycle Audit

- **D-10:** Audit is conducted in two phases. Phase 1: verification-only pass across all 34 `src/lib/` modules using synthesized gate-l3-lifecycle-integration criteria. Produces `CA-04-LIFECYCLE-AUDIT.md` with PASS/FAIL per module per surface (mutation authority, CQRS boundary, actor hierarchy, event wiring, classification fit, SDK compliance). No code changes.
- **D-11:** Phase 2: targeted fixes on the 6 CRUD-owner modules that CA-04 touches (`continuity.ts`, `delegation-persistence.ts`, `lifecycle-manager.ts`, `task-status.ts`, `execution-lineage.ts`, `session-journal.ts`). Only violations in these 6 modules are fixed. Remaining 28 modules' violations are deferred.
- **D-12:** Prerequisite: the gate-l3-lifecycle-integration skill's missing reference documents (`references/nine-surface-authority.md`, `references/evaluation-checklist.md`, `references/cqrs-boundaries.md`) must be synthesized from `.planning/codebase/ARCHITECTURE.md` and live source code before the audit can produce reliable PASS/FAIL verdicts. These criteria documents become permanent project assets consumed by the gate skill.
- **D-13:** Audit findings feed into REQUIREMENTS.md and STATE.md as tracked gaps for future phases/audits.

### Naming Convention Validation

- **D-14:** Validation is conducted in two layers. Layer 1: full directory scan of all 56 shipped agents and 51 active skills. Checks prefix compliance (hm-*/hf-*/gate-*/stack-* regex per naming-syndicate rules), `lineage:` field presence, `consumed-by:` metadata completeness, orphan skill detection. Produces `CA-04-NAMING-AUDIT.md` report. No auto-fixes.
- **D-15:** Layer 2: reusable CI validation script (`scripts/validate-naming.sh` or `src/lib/naming-validator.ts`) that applies naming-syndicate rules to any set of agent/skill files. Validated against a representative sample: 10 hm-* agents + 10 hm-* skills + all 11 hf-* agents + all 13 hf-* skills (44 primitives total). Script becomes a repeatable CI gate.
- **D-16:** gsd-* primitives (33 agents, 65 skills) are EXCLUDED from audit scope — they are development tooling, not shipped. Only hm-*/hf-*/gate-*/stack-* primitives are validated.
- **D-17:** Cross-lineage loading violations (hm-* agents loading hf-* skills without authorization) are detected in the scan but NOT auto-fixed. Violations are reported as HIGH-severity findings. The hf-* FLEXIBLE lineage permits loading hm-* skills for cross-validation; the reverse (hm-* loading hf-*) is a violation per integration-contracts D-AD-01.

### the agent's Discretion

*All decisions were user-directed. No areas were deferred to agent discretion.*

---

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Architecture & Design
- `.planning/codebase/ARCHITECTURE.md` — System decomposition, 9-surface mutation authority table, CQRS boundaries, actor hierarchy — **source for synthesized gate criteria documents**
- `.planning/codebase/STRUCTURE.md` — Module dependency rules, boundaries, src/lib/ module inventory (34 modules)
- `.planning/codebase/CONCERNS.md` — Cross-cutting concerns and quality gates

### Project Governance
- `.planning/MASTER-PROJECT-SKELETON.md` — Complete feature landscape: 4 paths × 2 lineages, 100+ feature IDs, 8 workstreams
- `.planning/SKELETON-INTEGRATED-SYSTEMATIC-APPROACH-v2-2026-05-06.md` — Skeleton v2: feature gap inventory, workstream dependency order, config schema skeleton, `.hivemind/` bootstrap tree
- `.planning/SKELETON-TRACKING-INDEX.md` — Feature ID ownership map, section coverage matrix, workstream gap summary
- `.planning/REQUIREMENTS.md` — Aggregated project requirements: Path 1-4 features, Q1-Q6 locked validation decisions, gap coverage map
- `.planning/STATE.md` — Current build gates (1765 pass, 90.49% coverage), workstream status, deferred workstreams

### Validation Decisions (Q1-Q6, Locked 2026-04-25)
- `docs/proposals/VALIDATION-DECISIONS-2026-04-25.md` — Q1 (runtime detection), Q2 (sidecar READ-ONLY), Q3 (journal append-only), Q4 (memory MVP), Q5 (RICH gate), Q6 (`.hivemind/` state root separation)
- **Q2** directly constrains CRUD module depth: sidecar CANNOT write to canonical state → `sidecar/` directory is read-only tier
- **Q3** directly constrains CRUD module depth: journal is append-only event timeline → `journal/` directory is append-only tier
- **Q6** directly constrains CRUD module depth: `.hivemind/` is internal state root, `.opencode/` is primitives only → classification must distinguish state writes from primitive config

### Prior Phase Artifacts (Core Architecture)
- `.planning/workstreams/core-architecture/ROADMAP.md` — Phase overview, dependencies (CA-01 → CA-02 → CA-04), checkpoint CP-CA-4
- `.planning/workstreams/core-architecture/phases/CA-01-configs-schema-runtime-binding/CA-01-01-SUMMARY.md` — Config schema v2 expansion (D-CONF-01, D-CONF-04, D-CONF-05)
- `.planning/workstreams/core-architecture/phases/CA-01-configs-schema-runtime-binding/CA-01-02-SUMMARY.md` — Config subscriber and runtime binding (D-BIND-01, D-BIND-02)
- `.planning/workstreams/core-architecture/phases/CA-02-behavioral-profile-mode-dispatch/CA-02-CONTEXT.md` — Behavioral profile decisions (D-01 through D-14), profile merge strategy, consumer surface
- `.planning/workstreams/core-architecture/phases/CA-03-workflow-toggle-runtime-binding/CA-03-CONTEXT.md` — **Primary handoff to CA-04**: governance block, 6-toggle wiring, @future-consumer annotations (D-18), CA-04 scope boundary (D-19), deferred items
- `.planning/workstreams/core-architecture/phases/CA-03-workflow-toggle-runtime-binding/CA-03-01-SUMMARY.md` — Governance block implementation
- `.planning/workstreams/core-architecture/phases/CA-03-workflow-toggle-runtime-binding/CA-03-02-SUMMARY.md` — Toggle wiring + execution field consumers
- `.planning/workstreams/core-architecture/phases/CA-03-workflow-toggle-runtime-binding/CA-03-03-SUMMARY.md` — UAT triage: 6 schema-level passed, 19 e2e blocked
- `.planning/workstreams/core-architecture/phases/CA-03-workflow-toggle-runtime-binding/CA-03-UAT.md` — Full UAT status: 19 blocked e2e tests documented

### WS-1 Restructuring (Source of D-CRUD and D-LIFECYCLE decisions)
- `.planning/workstreams/hivemind-state-architecture/CONTEXT.md` — WS-1 Restructuring CONTEXT: D-CRUD-01..05 (CRUD lifecycle), D-LIFECYCLE-01..02 (lifecycle integration), D-CONF-01..05 (configs.json schema), D-BIND-01..03 (schema binding)

### Schema & Types
- `src/schema-kernel/hivemind-configs.schema.ts` — Source of truth for config schema v2 (13 toggles, 3 execution fields, governance fields). Contains @future-consumer annotations (lines 133-147).
- `src/lib/types.ts` — Shared types + constants (leaf module). Target for new `DirectoryMutationTier` enum.
- `src/hooks/types.ts` — `HookDependencies` interface (hivemindConfig, getBehavioralProfile)

### Quality Gate Skills (for Lifecycle Audit)
- `.opencode/skills/gate-l3-lifecycle-integration/SKILL.md` — Lifecycle integration gate: 9-surface mutation authority, CQRS boundaries, actor hierarchy, event wiring, classification fit, SDK compliance. **NOTE: `references/` subdirectory is empty — criteria documents must be synthesized from ARCHITECTURE.md**

### Naming Convention Skills
- `.opencode/skills/hf-l2-naming-syndicate/SKILL.md` — Formal naming convention: prefixes, lineage rules (hm-* STRICT, hf-* FLEXIBLE, gate-* INTERNAL, stack-* REFERENCE)
- `.opencode/skills/hm-l3-integration-contracts/SKILL.md` — Bidirectional skill-agent contract authority, orphan detection, cross-lineage validation rules (D-AD-01)

### Implementation Artifacts (CRUD-Owner Modules)
- `src/lib/continuity.ts` — De-facto owner for `state/`. Existing CRUD pattern: `recordSessionContinuity` (CREATE), `getSessionContinuity` (READ), `patchSessionContinuity` (UPDATE), `deleteSessionContinuity` (DELETE). ~455 LOC. Singleton cache pattern.
- `src/lib/delegation-persistence.ts` — De-facto owner for `delegation-managements/`. `persistDelegations()`, `readPersistedDelegations()`.
- `src/lib/lifecycle-manager.ts` — Consumer for `cross_session_tasks_dependencies_validation` toggle. Session lifecycle state machine.
- `src/lib/task-status.ts` — Task status transitions + guards. @future-consumer target for `task_plus_enabled` (deferred).
- `src/lib/execution-lineage.ts` — Derived projection combining continuity + delegations + journal entries. ~122 LOC.
- `src/lib/session-journal.ts` — Append-only event timeline (Q3). ~119 LOC.
- `src/lib/delegation-manager.ts` — Core delegation orchestrator. ~656 LOC. Natural consumer for lifecycle audit (actor hierarchy).
- `src/hooks/hook-cqrs-boundary.ts` — CQRS enforcement: `assertHookWriteBoundary`. Key reference for lifecycle audit.
- `src/hooks/create-core-hooks.ts` — system.transform hook (governance block injection point). CA-03 toggle gate pattern reference.
- `src/plugin.ts` — Composition root (~142 LOC) where new CRUD modules are wired into deps.

### `.hivemind/` Directory Structure (19 subdirectories)
```
.hivemind/
├── artifacts/         — READ_ONLY tier
├── daily-notes/       — APPEND_ONLY tier
├── delegation-managements/ — CRUD tier (owner: delegation-persistence.ts)
├── event-tracker/     — APPEND_ONLY tier
├── hf-brain/          — READ_ONLY tier
├── hm-brain/          — READ_ONLY tier
├── journal/           — APPEND_ONLY tier (Q3: append-only)
├── lineage/           — APPEND_ONLY tier
├── logs/              — APPEND_ONLY tier
├── manifests/         — CRUD tier
├── onboarding/        — READ_ONLY tier
├── poor-prompts/      — APPEND_ONLY tier
├── registries/        — CRUD tier
├── runtime/           — READ_ONLY tier
├── sidecar/           — READ_ONLY tier (Q2: sidecar writes forbidden)
├── state/             — CRUD tier (owner: continuity.ts)
├── task-managements/  — CRUD tier
├── uat/               — CRUD tier
└── configs.json       — CRUD tier
```

### Gap Intelligence (for future phases)
- `.hivemind/poor-prompts/PROJECT-ISSUES-2026-05-05.md` — Giant holes and gaps: missing commands, workflows, parsing, conditional auto routing, intent routing. Skeleton far from completion. Reference for deferred tracking.

---

## Existing Code Insights

### Reusable Assets
- **`continuity.ts`** — Established CRUD pattern: typed functions per operation, deep-clone-on-read, quarantine on write failure, `[Harness]` error prefix. Pattern to replicate across all new CRUD modules.
- **`delegation-persistence.ts`** — Established delegation record I/O pattern: `persistX()` + `readX()` function pair with JSON serialization/deserialization.
- **`config-subscriber.ts`** — Lazy-load + cache pattern. Reusable for CRUD modules that need per-project cache isolation.
- **`hook-cqrs-boundary.ts`** — `classifyHook()` and `assertHookWriteBoundary()` utilities. Critical reference for lifecycle audit CQRS verification.
- **`create-core-hooks.ts`** — CA-03 toggle gate pattern: `if (!deps.hivemindConfig.workflow.research) return;` (early return when toggle off). Replicate for `cross_session_tasks_dependencies_validation`.
- **`system.transform` hook** — Governance block injection point. Already wires behavioral profile + governance fields. Extension point for lifecycle context injection.

### Established Patterns
- **CQRS separation** — Tools mutate, hooks observe. Enforced by `hook-cqrs-boundary.ts`. New CRUD modules are tools (write-side mutation authority). Lifecycle audit verifies this boundary across all 34 modules.
- **Lazy-load + cache** — `config-subscriber` pattern. CRUD modules should cache directory listings / file handles lazily.
- **Factory defaults via Zod** — Schema defaults are source of truth. Toggle defaults (`false` for CA-04-targeted toggles) are safe no-ops.
- **Hook dependency injection** — `HookDependencies` bundle passed to all hook factories. Toggle checking functions added here per CA-03 pattern.
- **`@future-consumer` JSDoc annotations** — CA-03 established pattern of documenting unwired toggle consumers in schema file. CA-04 updates these annotations with status (WIRED/DEFERRED).
- **`[Harness]` error prefix** — All thrown errors use this prefix. New CRUD modules follow same convention.

### Integration Points
- **`plugin.ts` composition root** — New CRUD modules are instantiated and wired into deps here (~142 LOC). Adding ~15 new module instances may push this toward the 500 LOC size cap — consider splitting into `src/lib/crud/` subdirectory with barrel export if needed.
- **`HookDependencies`** (`hooks/types.ts`) — Add `getLifecycleValidationContext(sessionId)` accessor for `cross_session_tasks_dependencies_validation` toggle consumer.
- **`createCoreHooks(deps)`** — Add toggle gate for `cross_session_tasks_dependencies_validation` in relevant hook factories.
- **`lifecycle-manager.ts`** — Primary consumer for single wired toggle. Extend session lifecycle validation to check cross-session task dependencies when toggle is enabled.
- **`DelegationManager`** — Actor hierarchy verification target. L0→L1→L2→L3 delegation depth enforcement currently partial. Lifecycle audit will surface gaps.
- **Gate skill `references/` directory** — Must be populated with synthesized criteria documents before audit can run. These become permanent project assets at `.opencode/skills/gate-l3-lifecycle-integration/references/`.

---

## Specific Ideas

- **CRUD module naming convention**: `src/lib/crud/<directory-name>.ts` — e.g., `src/lib/crud/registries.ts`, `src/lib/crud/task-managements.ts`. Each exports typed functions matching its tier.
- **`DirectoryMutationTier` enum** in `src/lib/types.ts`:
  ```typescript
  export const DirectoryMutationTier = {
    CRUD: 'crud',
    APPEND_ONLY: 'append_only',
    READ_ONLY: 'read_only',
  } as const;
  export type DirectoryMutationTier = (typeof DirectoryMutationTier)[keyof typeof DirectoryMutationTier];
  ```
- **Toggle gate pattern** for `cross_session_tasks_dependencies_validation` (replicating CA-03):
  ```typescript
  // In hook factory:
  if (!deps.hivemindConfig.workflow.cross_session_tasks_dependencies_validation) return;
  // In tool defensive check:
  if (!config.workflow.cross_session_tasks_dependencies_validation) {
    return formatToolResponse({ message: 'Cross-session task validation is disabled. Enable cross_session_tasks_dependencies_validation in configs.json.' });
  }
  ```
- **Lifecycle audit criteria synthesis** — Build `references/nine-surface-authority.md` from ARCHITECTURE.md component responsibilities table + CQRS rules. Each of 9 surfaces mapped to owning modules with mutation/observation authority annotations.
- **Naming report structure** — Per-primitive: prefix compliance (PASS/FAIL), lineage field (PRESENT/MISSING), consumed-by metadata (COMPLETE/PARTIAL/MISSING), cross-lineage loading violations (NONE/DETECTED). Aggregate: per-lineage compliance %, orphan count, violation count.
- **Deferred tracking** — All deferred decisions from this discussion are entered into REQUIREMENTS.md under their respective feature paths, with `CA-04-DEFERRED` tag. STATE.md deferred workstreams section updated with CA-04 gap findings.

---

## Deferred Ideas

### From Toggle Wiring
- **trajectory_control** → hivemind-trajectory tool. Deferred to WS-6 (trajectory-task-plus). @future-consumer annotation updated to `DEFERRED to WS-6`.
- **advanced_continuity_validation** → continuity.ts. Deferred to WS-6 or future CA phase. @future-consumer annotation updated.
- **task_plus_enabled** → task-status.ts. Deferred to WS-6. @future-consumer annotation updated.
- **ui_phase, ui_safety_gate** → sidecar UI. Deferred to WS-2/WS-8.
- **ai_integration_phase** → WS-4 workstream. Deferred.

### From CRUD Module Depth
- **Full uniform CRUD for all 19 directories** — Deferred until other workstreams shape directory interfaces. Current tiered approach provides correct foundation.
- **Placeholder modules for deferred directories** — Interface contracts documented via `@future-owner` JSDoc. Implementation deferred to owning workstreams.

### From Lifecycle Audit
- **Fixes for 28 non-CRUD-owner modules** — Deferred to dedicated CA-05 or equivalent quality-sprint phase. Verification pass produces gap inventory for planning.
- **Tool guard enforcement (blocking, not advisory)** — Post-GA feature.

### From Naming Validation
- **Auto-fixes for naming violations** — Deferred to dedicated naming-quality wave (SE-2 or later).
- **Backfill consumed-by metadata across 50+ skills** — Deferred. Report documents the gap.
- **Cross-lineage loading enforcement at runtime** — Deferred. Currently documentation-only.

### From Broader Skeleton Gaps (surfaced for knowledge)
- **Commands, workflows, parsing, conditional auto routing, intent routing** — Giant holes per `.hivemind/poor-prompts/PROJECT-ISSUES-2026-05-05.md`. Skeleton far from completion. These gaps are surfaced as CA-04-NOTES for future workstreams, not as CA-04 deliverables.

---

*Phase: CA-04 - CRUD Ownership Modules + Lifecycle Verification*
*Context gathered: 2026-05-07*
