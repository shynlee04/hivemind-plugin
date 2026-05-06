# Phase CA-02: Behavioral Profile System + Mode Dispatch - Context

**Gathered:** 2026-05-06
**Status:** Ready for planning

## Phase Boundary

This phase establishes the behavioral profile system and mode dispatch layer for Hivemind V3. It builds the mapping between configuration values (`mode`, `user_expert_level`, `workflow.discuss_mode`, `conversation_language`, `documents_and_articles_language` in `configs.json`) and **observable runtime behavior changes** that hooks and tools can consume.

CA-02 does NOT implement the f-04 auto-commands/workflow-router itself — that is deferred to WS-4. This phase provides the resolved behavioral profile (a single source of truth) that downstream consumer hooks, tools, and future routers read.

## Scope Delivered

1. **Mode → behavioral profile mapping** – static lookup table mapping each mode (`expert-advisor`, `hivemind-powered`, `free-style`) to a `BehavioralProfile` with fields: `guardrailLevel`, `delegationMode`, `toolAccessPattern`, `skillFilter`.
2. **Language config injection** – `conversation_language` and `documents_language` injected into `system.transform` hook output (and available via `deps.hivemindConfig`).
3. **Profile merge strategy** – Config-first resolution combining static config values with runtime-detected `ProfileMatch` from `profile-resolver.ts` into a single `ResolvedBehavioralProfile` type.
4. **Consumer surface** – `system.transform` hook, task/coordination tools (selective injection), and category gates all read the resolved profile.

## Out of Scope (Deferred)

- **f-04 Auto-intent vs. workflow router** – The actual dispatch mechanism that routes agent intents to workflows based on profile/mode is a separate workstream (WS-4). This phase only produces the data layer.
- **Tool guard hooks** – Explicit blocking of tools based on `toolAccessPattern` is not implemented here (advisory filtering only via category gates).
- **Per-tool behavioral changes** – Individual tools can read the profile but behavior modifications are minimal in this phase (focus on composition/lifecycle layer).

---

## Requirements (locked via prior phases)

**Requirements are not locked by a SPEC.md for CA-02.** This phase synthesizes from CA-01 configs schema (D-CONF-01, D-CONF-04, D-CONF-05, D-BIND-01, D-BIND-02 already complete) and existing profile resolution (SEI-04).

**Relevant prior decisions:**
- **D-CONF-01 (CA-01)** – `configs.json` schema expanded to full skeleton v2 §9.1 (13 workflow toggles, 3 execution fields, snake_case keys).
- **D-BIND-01/02 (CA-01)** – Config subscription model with lazy-load cache and `getConfig()` at composition root.
- **SEI-04 (existing)** – `profile-resolver.ts` resolves `communicationStyle`, `decisionSpeed`, `expertise` from session context.

---

## Implementation Decisions

### Mode → Behavioral Profile Mapping

- **D-01:** Use a **static lookup table** (`BehavioralProfile` type) mapping each `mode` to `{ guardrailLevel, delegationMode, toolAccessPattern, skillFilter }`. No runtime computation — simple, testable, extensible.
- **D-02:** Behavioral profile defaults:
  - `expert-advisor` → `{ guardrailLevel: 'moderate', delegationMode: 'waiter', toolAccessPattern: 'full', skillFilter: 'all' }`
  - `hivemind-powered` → `{ guardrailLevel: 'strict', delegationMode: 'waiter', toolAccessPattern: 'restricted', skillFilter: 'curated' }`
  - `free-style` → `{ guardrailLevel: 'minimal', delegationMode: 'disabled', toolAccessPattern: 'full', skillFilter: 'all' }`
- **D-03:** `delegationMode` values: `'waiter'` (SDK child-session dispatch), `'sync'` (direct execution), `'disabled'` (no delegation).

### Language Config Injection

- **D-04:** `conversation_language` and `documents_and_artifacts_language` from `configs.json` are injected into `system.transform` hook as context lines (e.g., `- conversation_language: en`). The same values are available via `deps.hivemindConfig` for tool-level consumption.
- **D-05:** No dedicated language hook — reuse existing `system.transform` injection point (consistent with how intake profile is injected).

### Profile Merge Strategy

- **D-06:** **Config-first with runtime fallback.** Static config values (`mode`, `user_expert_level`, `language` fields) are the source of truth. Runtime-detected `ProfileMatch` (from `profile-resolver.ts`) fills gaps where config doesn't specify (`communicationStyle`, `decisionSpeed`) and maps `user_expert_level` → `expertise` for consistency.
- **D-07:** Produce a single unified `ResolvedBehavioralProfile` type:
  ```typescript
  interface ResolvedBehavioralProfile {
    mode: HivemindMode;                           // from config
    behavioralProfile: BehavioralProfile;         // derived from mode lookup
    language: {
      conversation: SupportedLanguage;             // from config
      documents: SupportedLanguage;                // from config
    };
    userExpertLevel: UserExpertLevel;              // from config
    runtimeProfile: ProfileMatch;                  // from profile-resolver (merged)
    merged: {
      expertise: Expertise;                        // config.user_expert_level mapped OR runtime
      communicationStyle: CommunicationStyle;      // runtime only
      decisionSpeed: DecisionSpeed;                // runtime only
    };
  }
  ```
- **D-08:** Resolution happens once per session (lazily at first hook/tool access) via a new `resolveBehavioralProfile(sessionId): ResolvedBehavioralProfile` helper in `src/lib/behavioral-profile/`.

### Consumer Surface Design

- **D-09:** `system.transform` hook injects resolved behavioral profile fields into session system context:
  - `behavioral.guardrailLevel`
  - `behavioral.delegationMode`
  - `language.conversation` / `language.documents`
  - `runtime.communicationStyle` / `runtime.decisionSpeed`

- **D-10:** **Selective tool injection** — only coordination/task-management tools that need behavioral awareness receive the resolved profile:
  - `delegate-task` – uses `delegationMode` and `guardrailLevel`
  - `delegation-status` – displays behavioral context
  - `configure-primitive` – respects `toolAccessPattern`
  - `session-journal-export` – includes profile in export
  - Other tools access profile via `deps.hivemindConfig` (already available) or request explicitly.

- **D-11:** **Category gates** read `skillFilter` to provide advisory filtering (non-blocking) on skill loading. In `hivemind-powered` mode, non-curated skills are flagged but not prevented.

- **D-12:** `DelegationManager` checks `guardrailLevel` from resolved profile when determining per-session concurrency and tool-budget overrides (workspace runtime policy remains canonical; profile provides session-level adjustments).

### Discuss Mode Integration

- **D-13:** `workflow.discuss_mode` from `configs.json` is included in the resolved behavioral profile as `discussMode`. It is NOT used to auto-route commands (no f-04 router in this phase).
- **D-14:** The `/gsd-discuss-phase` command (GSD tooling) can read `configs.json` directly. The `system.transform` hook exposes `discussMode` in session context so agents know the intended discussion style:
  - `sufficient-phase-discussion` – baseline Q&A, assumption surfacing
  - `intensive-phase-discussion` – deep research, evidence gathering
  - `skip-phase-discussion` – skip discussion entirely

---

## Canonical References

Downstream agents MUST read these before planning or implementing.

### Architecture & Design
- `.planning/codebase/ARCHITECTURE.md` — Overall system decomposition (4 paths × 2 lineages)
- `.planning/codebase/STRUCTURE.md` — Module dependency rules and boundaries
- `.planning/codebase/CONCERNS.md` — Cross-cutting concerns and quality gates

### Prior Phase Decisions
- `.planning/workstreams/core-architecture/phases/CA-01-configs-schema-runtime-binding/CA-01-01-SUMMARY.md` — Configs schema v2 expansion (D-CONF-01, D-CONF-04, D-CONF-05)
- `.planning/workstreams/core-architecture/phases/CA-01-configs-schema-runtime-binding/CA-01-02-SUMMARY.md` — Config subscriber and runtime binding (D-BIND-01, D-BIND-02)

### Schema & Types
- `src/schema-kernel/hivemind-configs.schema.ts` — Source of truth for config schema (version 2.0.0)
- `src/lib/session-entry/profile-resolver.ts` — Runtime profile resolution (SEI-04)
- `src/hooks/types.ts` — `HookDependencies` interface (includes `hivemindConfig`)

### Implementation Artifacts
- `src/lib/config-subscriber.ts` — Lazy-load cache for configs
- `src/plugin.ts` — Composition root where `getConfig()` is wired into `deps.hivemindConfig`

---

## Existing Code Insights

### Reusable Assets
- **`profile-resolver.ts`** — Resolves `ProfileMatch` from session context. Used as-is for runtime half of profile merge. Exports `resolveProfile(context)` returning `{ communicationStyle, decisionSpeed, expertise, matchConfidence }`.
- **`config-subscriber.ts`** — Provides `getConfig(projectRoot)` with per-project lazy cache. Exported and already used in `plugin.ts`. No changes needed.
- **`system.transform` hook** in `create-core-hooks.ts` — Already injects intake context into session. Extension point for behavioral profile fields.
- **`Category` gates** in `src/lib/category-gates.ts` — Existing gate infrastructure. Can extend with `skillFilter` advisory checks.
- **`DelegationManager`** in `src/lib/delegation-manager.ts` — Uses `runtimePolicy`. Can be extended to apply session-level behavioral overrides.

### Established Patterns
- **CQRS separation** — Tools mutate, hooks observe. Behavioral profile is read-only data available to both via `deps.hivemindConfig` and the new resolution helper.
- **Lazy-load + cache** — `config-subscriber` pattern. Reuse for resolved profile (compute once per session, cache in `session-api` or closure scope).
- **Factory defaults via Zod** — `configs.json` schema uses `z.default()` for nested objects. Profile resolution follows same pattern: derive from config, enrich with runtime.
- **Hook dependency injection** — `HookDependencies` bundle passed to all hook factories. Add `behavioralProfile` resolver or accessor here for consistency.

### Integration Points
- **`createCoreHooks(deps)`** — Extend `system.transform` to inject behavioral fields. `deps` already has `hivemindConfig`; add `getBehavioralProfile(sessionId): ResolvedBehavioralProfile` via new module.
- **`DelegationManager` constructor** — Accepts `runtimePolicy`. Add optional `behavioralProfile` override per delegation (from session).
- **`src/schema-kernel/index.ts`** — Export new types (`BehavioralProfile`, `ResolvedBehavioralProfile`, `DelegationMode`).
- **`src/lib/session-api.ts`** — Add `getSessionBehavioralProfile(sessionId): ResolvedBehavioralProfile` to SDK wrappers.
- **`src/hooks/create-tool-guard-hooks.ts`** — Potential future enforcement point for `toolAccessPattern` (advisory for now).

---

## Specific Ideas

- `system.transform` output example:
  ```
  Session intake context:
  - purpose: ...
  - language: ...
  - behavioral.guardrailLevel: moderate
  - behavioral.delegationMode: waiter
  - behavioral.toolAccessPattern: full
  - language.conversation: en
  - language.documents: en
  - runtime.communicationStyle: detailed
  - runtime.decisionSpeed: deliberate
  ```

- The **`behavioralProfile` lookup table** lives in `src/lib/behavioral-profile/profiles.ts`:
  ```typescript
  export const BehavioralProfiles: Record<HivemindMode, BehavioralProfile> = {
    'expert-advisor': { guardrailLevel: 'moderate', delegationMode: 'waiter', toolAccessPattern: 'full', skillFilter: 'all' },
    'hivemind-powered': { guardrailLevel: 'strict', delegationMode: 'waiter', toolAccessPattern: 'restricted', skillFilter: 'curated' },
    'free-style': { guardrailLevel: 'minimal', delegationMode: 'disabled', toolAccessPattern: 'full', skillFilter: 'all' }
  };
  ```

- **Profile resolution helper** (`src/lib/behavioral-profile/resolve-behavioral-profile.ts`):
  ```typescript
  export function resolveBehavioralProfile(sessionId: string): ResolvedBehavioralProfile {
    const config = getConfig(projectRoot);
    const runtime = resolveProfile(getSessionContext(sessionId));
    const behavioral = BehavioralProfiles[config.mode];
    return { mode: config.mode, behavioral, language: { conversation: config.conversation_language, documents: config.documents_language }, userExpertLevel: config.user_expert_level, runtimeProfile: runtime, merged: { expertise: mapLevelToExpertise(config.user_expert_level, runtime.expertise), communicationStyle: runtime.communicationStyle, decisionSpeed: runtime.decisionSpeed } };
  }
  ```

- **Advisory skill filtering** (non-blocking): category gates can log or annotate skill choices based on `skillFilter`. Tools reading the profile may hide or gray-out non-curated skills in UIs but never throw errors.

---

## Deferred Ideas

- **f-04 Auto-commands / workflow router** — Build a router that reads `mode` + `behavioralProfile` + `discussMode` and maps user intents to workflow templates. Depends on this phase's resolved profile. Belongs in a new workstream (WS-4).
- **Tool guard enforcement** — Convert `toolAccessPattern` from advisory (category gate) to blocking (pre-tool-execution hook). Needs UX for "why blocked" and override paths. Post-GA feature.
- **Per-mode hook injection profiles** — Declarative lists of "hooks to enable/disable per mode". Could optimize runtime by skipping unused hook factories. Low priority.
- **Behavioral profile editor in sidecar** — UI for admins to tune profiles per team/role. Depends on WS-2 bootstrap and WS-8 sidecar UI.
- **A/B testing and metrics** — Measure impact of different profiles on task completion, delegation success rate, and agent satisfaction. Requires telemetry infra.
- **`user_expert_level` auto-detection** — Enhance `profile-resolver` to infer `user_expert_level` from long-term interaction history, not just single-session context.

---

*Phase: CA-02 - Behavioral Profile System + Mode Dispatch*
*Context gathered: 2026-05-06*