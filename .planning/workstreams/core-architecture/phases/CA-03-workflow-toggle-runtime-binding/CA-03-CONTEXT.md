# Phase CA-03: Workflow Toggle Runtime Binding - Context

**Gathered:** 2026-05-06
**Status:** Ready for planning

## Phase Boundary

CA-03 is the **runtime integration bridge** that connects CA-01 (config schema + subscriber) and CA-02 (behavioral profile resolution) to actual agent runtime behavior. Currently, `getConfig()` loads configs at plugin init and `resolveBehavioralProfile()` is wired into deps, but **no consumer hook, tool, or command gates behavior on workflow toggles or governance fields**. This phase makes configs and behavioral profiles **observable in agent behavior** — hooks gate on toggles, tools check defensively, and governance fields are enforced as structured instructions in every system prompt.

CA-03 retroactively validates all 17 blocked UATs from CA-01 (10 blocked) and CA-02 (7 blocked) with fresh vitest test evidence.

### Scope Delivered

1. **Structured governance block** — `mode`, `user_expert_level`, `conversation_language`, `documents_and_articles_language` injected into `system.transform` as concise imperative instructions matched to each field and value. Always active, non-negotiable reminders before every prompt.
2. **6-toggle runtime wiring** — `research`, `plan_check`, `verifier`, `discuss_mode`, `use_worktrees`, `research_before_questions` each have a concrete 1:1 hook-level consumer that gates behavior.
3. **Execution field consumers** — `parallelization`, `atomic_commit`, `commit_docs` consumed by harness modules (DelegationManager, continuity, .hivemind/ persistence).
4. **Future toggle documentation** — Remaining 7 toggles annotated with `@future-consumer` JSDoc tags and pre-assigned consumer modules.
5. **UAT retro-validation** — All 17 blocked CA-01/CA-02 UATs re-validated with vitest test evidence, updating original UAT files.

### Out of Scope (Deferred)

- **Remaining 7 toggle wiring** — Owned by CA-04 (Full lifecycle + everything)
- **f-04 Auto-commands / workflow router** — WS-4 workstream
- **Cross-lineage naming convention validation** (hm-* / hf-*) — CA-04
- **Tool guard enforcement** (blocking, not advisory) — Post-GA feature

---

## Implementation Decisions

### CA-03 Scope
- **D-01:** CA-03 is the **full runtime integration bridge**, not just workflow toggle binding. It wires governance fields (mode, user_expert_level, language), workflow toggles, and execution fields into runtime consumers.
- **D-02:** Governance fields are injected as a **structured governance block** in system prompt — concise imperative instructions matched to each field and value.
- **D-03:** **Hook-level gating** is primary for workflow toggles. Tools read toggles defensively (don't proceed if toggle off). Skills remain passive.
- **D-04:** **Selective wiring** — 6 toggles get runtime consumers in CA-03: `research`, `plan_check`, `verifier`, `discuss_mode`, `use_worktrees`, `research_before_questions`. Each has a clear, existing hook/skill consumer path.

### Governance Block Format
- **D-05:** Format is **hybrid instruction + fields**: instruction-style for mode/expertise/language directives, field:value pairs for runtime context (communicationStyle, decisionSpeed, expertise).
- **D-06:** Example governance block for mode=expert-advisor, expertise=intermediate-high, language=en:
  ```
  --- Governance ---
  You are operating in expert-advisor mode. Communicate at intermediate-high level. Use en for all conversation and documents.
  communicationStyle: detailed | decisionSpeed: deliberate | expertise: intermediate-high
  ```
- **D-07:** Governance block is appended to `system.transform` output. It is always active — non-negotiable, loaded as a reminder before every prompt sent.

### Toggle → Consumer Mapping (6 wired toggles)
- **D-08:** `research` → gates `research_before_questions` and research-phase hooks. When false, skip research-related skill loading and hook injection.
- **D-09:** `plan_check` → gates plan verification hooks. When false, skip post-plan quality checks.
- **D-10:** `verifier` → gates verification-phase hooks. When false, skip implementation verification steps.
- **D-11:** `discuss_mode` → gates discuss-phase workflow routing. Controls whether discussion is `sufficient-phase-discussion`, `intensive-phase-discussion`, or `skip-phase-discussion`.
- **D-12:** `use_worktrees` → gates git worktree isolation hooks. When false, skip worktree creation for parallel tasks.
- **D-13:** `research_before_questions` → gates pre-question web search hooks. When true, research context is gathered before presenting questions.

### Execution Field Consumers
- **D-14:** `parallelization` → consumed by `DelegationManager` to control wave dispatch. When false, delegations are sequential.
- **D-15:** `atomic_commit` → consumed by continuity persistence to control commit strategy. When false, state changes are batched.
- **D-16:** `commit_docs` → consumed by `.hivemind/` document persistence to toggle auto-commit of documentation artifacts.
- **D-17:** All three default to `true` (current schema defaults preserved).

### Future Toggle Documentation
- **D-18:** 7 unwired toggles get `@future-consumer` JSDoc annotations in `src/schema-kernel/hivemind-configs.schema.ts` with pre-assigned consumer modules:
  | Toggle | Consumer Module | Target |
  |--------|----------------|--------|
  | trajectory_control | hivemind-trajectory tool | CA-04 |
  | advanced_continuity_validation | continuity.ts | CA-04 |
  | task_plus_enabled | task-status.ts | CA-04 |
  | cross_session_tasks_dependencies_validation | lifecycle-manager.ts | CA-04 |
  | ui_phase | sidecar UI (WS-2/WS-8) | Future |
  | ui_safety_gate | sidecar UI (WS-2/WS-8) | Future |
  | ai_integration_phase | WS-4 | Future |

### CA-04 Boundary
- **D-19:** CA-04 remains PLANNED at current priority. Its scope is **Full lifecycle + everything**: CRUD ownership modules for `.hivemind/` subdirectories, wiring of remaining 7 toggles, cross-lineage naming convention validation (hm-* / hf-*), and full runtime lifecycle audit (9-surface mutation authority, CQRS boundaries, actor hierarchy).

### Testing Strategy
- **D-20:** **Strict TDD with authentic behaviors** — no mocks allowed. Tests exercise real hook factories with real toggle configurations. Governance block tests verify exact output format against known config values.
- **D-21:** **Vitest test evidence** for retroactive UAT validation. Each of the 17 blocked CA-01/CA-02 UATs is re-validated by running relevant vitest tests and capturing pass/fail output as evidence. Original UAT files (`CA-01-UAT.md`, `CA-02-UAT.md`) are updated with fresh results.

### the agent's Discretion
*No areas were deferred to the agent — all decisions were user-directed.*

---

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Architecture & Design
- `.planning/codebase/ARCHITECTURE.md` — System decomposition, 9-surface mutation authority table
- `.planning/codebase/STRUCTURE.md` — Module dependency rules and boundaries
- `.planning/codebase/CONCERNS.md` — Cross-cutting concerns and quality gates

### Prior Phase Artifacts
- `.planning/workstreams/core-architecture/ROADMAP.md` — Phase overview, dependencies, checkpoints
- `.planning/workstreams/core-architecture/phases/CA-01-configs-schema-runtime-binding/CA-01-01-SUMMARY.md` — Config schema v2 expansion
- `.planning/workstreams/core-architecture/phases/CA-01-configs-schema-runtime-binding/CA-01-02-SUMMARY.md` — Config subscriber and runtime binding
- `.planning/workstreams/core-architecture/phases/CA-01-configs-schema-runtime-binding/CA-01-UAT.md` — 10 blocked UATs requiring CA-03 retro-validation
- `.planning/workstreams/core-architecture/phases/CA-02-behavioral-profile-mode-dispatch/CA-02-CONTEXT.md` — Behavioral profile decisions (D-01 through D-14)
- `.planning/workstreams/core-architecture/phases/CA-02-behavioral-profile-mode-dispatch/CA-02-01-SUMMARY.md` — Behavioral profile implementation summary
- `.planning/workstreams/core-architecture/phases/CA-02-behavioral-profile-mode-dispatch/CA-02-02-SUMMARY.md` — Behavioral profile implementation summary
- `.planning/workstreams/core-architecture/phases/CA-02-behavioral-profile-mode-dispatch/CA-02-UAT.md` — 7 blocked UATs requiring CA-03 retro-validation

### Schema & Types
- `src/schema-kernel/hivemind-configs.schema.ts` — Source of truth for config schema v2 (13 toggles, 3 execution fields, governance fields)
- `src/lib/behavioral-profile/types.ts` — BehavioralProfile, ResolvedBehavioralProfile types
- `src/hooks/types.ts` — HookDependencies interface (hivemindConfig, getBehavioralProfile)

### Implementation Artifacts
- `src/plugin.ts` — Composition root where config and behavioral profile are wired into deps
- `src/hooks/create-core-hooks.ts` — system.transform hook (governance block injection point)
- `src/lib/config-subscriber.ts` — Lazy-load config cache
- `src/lib/behavioral-profile/resolve-behavioral-profile.ts` — Profile resolution helper

---

## Existing Code Insights

### Reusable Assets
- **`system.transform` hook** (`create-core-hooks.ts:68-122`) — Already injects behavioral profile context. Extension point for structured governance block. Existing intake context injection pattern to follow.
- **`config-subscriber.ts`** — Provides `getConfig(projectRoot)` with per-project lazy cache. Already used in `plugin.ts:56`. No changes needed.
- **`resolve-behavioral-profile.ts`** — Resolves `ResolvedBehavioralProfile` from config + runtime context. Already wired into deps in `plugin.ts:85`. No changes needed.
- **`HookDependencies`** (`hooks/types.ts:38`) — `hivemindConfig` already available to all hook factories. `getBehavioralProfile(sessionId)` already available.
- **`DelegationManager`** (`src/lib/delegation-manager.ts`) — Controls wave dispatch. Natural consumer for `parallelization` toggle.
- **`lifecycle-manager.ts`** — Handles session lifecycle events. Consumer for lifecycle-related toggles.

### Established Patterns
- **CQRS separation** — Tools mutate, hooks observe. Toggle gates in hooks (observation layer), defensive checks in tools (mutation layer). Consistent with existing architecture.
- **Lazy-load + cache** — `config-subscriber` pattern. Toggle state is read once at hook invocation (no per-tool overhead).
- **Factory defaults via Zod** — Schema defaults are the source of truth. No separate default constants file.
- **Hook dependency injection** — `HookDependencies` bundle passed to all hook factories. Toggle checking functions added here.

### Integration Points
- **`createCoreHooks(deps)`** (`create-core-hooks.ts:47`) — Add governance block injection to `system.transform`. Add toggle checks to relevant hook factories.
- **`createToolGuardHooks(deps)`** — Add defensive toggle checks (tool refuses to proceed if toggle is off).
- **`DelegationManager`** — Add `parallelization` toggle check before wave dispatch.
- **`src/lib/continuity.ts`** — Add `atomic_commit` toggle check before state persistence.
- **`src/lib/delegation-persistence.ts`** — Add `commit_docs` toggle check before document auto-commit.

---

## Specific Ideas

- **Governance block** appears at the top of every system prompt as a non-negotiable set of reminders. It uses the hybrid format: instruction-style for behavioral directives, field:value for context.
- **Toggle gating** follows a consistent pattern across all 6 wired toggles:
  1. Hook factory reads toggle from `deps.hivemindConfig.workflow.<toggle>`
  2. When toggle is `false`, hook returns early (no-op)
  3. Tool defensive check: before execution, tool reads toggle and returns explanatory message if off
- **Future toggle annotations** use JSDoc `@future-consumer <module> — <phase>` tags directly in the schema file, keeping documentation co-located with the field definition.
- **UAT retro-validation** updates CA-01-UAT.md and CA-02-UAT.md in-place: each blocked test entry gets a new `result: passed` or `result: failed` with `evidence: vitest <test-name>` reference.

---

## Deferred Ideas

- **Remaining 7 toggle wiring** → CA-04 (Full lifecycle + everything)
- **f-04 Auto-commands / workflow router** → WS-4 workstream
- **Cross-lineage naming convention audit** (hm-*/hf-*/gate-*/stack-* consistency) → CA-04
- **Tool guard enforcement** (blocking pre-tool-execution hook, not advisory) → Post-GA
- **Per-mode hook injection profiles** (declarative hook enable/disable lists) → Post-MVP
- **Behavioral profile editor in sidecar** → WS-2/WS-8
- **A/B testing and metrics for behavioral profiles** → Requires telemetry infra

None — discussion stayed within phase scope.

---

*Phase: CA-03 - Workflow Toggle Runtime Binding*
*Context gathered: 2026-05-06*
