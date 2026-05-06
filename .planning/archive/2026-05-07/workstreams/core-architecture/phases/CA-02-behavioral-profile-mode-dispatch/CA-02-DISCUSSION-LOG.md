# Phase CA-02: Behavioral Profile System + Mode Dispatch - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-06
**Phase:** CA-02 - Behavioral Profile System + Mode Dispatch
**Areas discussed:** Mode → behavior mapping, Language binding, Profile merge strategy, Consumer surface design, Discuss mode dispatch

---

## Mode → Behavior Mapping

| Option | Description | Selected |
|--------|-------------|----------|
| Static lookup table | A static Zod-validated object mapping each mode to a `BehavioralProfile` with fields like `{ guardrailLevel, delegationMode, toolAccessPattern, skillFilter }`. One lookup, no computation. Easy to test, easy to extend. | ✓ |
| Computation function | A function that takes mode + user_expert_level and computes the profile. More flexible (can blend inputs), but harder to test and extend. Risk of hidden logic. | |
| Strategy pattern per mode | A factory that takes mode and returns pre-built behavior objects (strategies). More OO, supports complex per-mode logic, but adds indirection layer for what's essentially a data mapping. | |

**User's choice:** Static lookup table (Recommended)

**Notes:** Chosen for simplicity, testability, and clear mapping. Behavioral profile defaults: 
- `expert-advisor` → `{ guardrailLevel: 'moderate', delegationMode: 'waiter', toolAccessPattern: 'full', skillFilter: 'all' }`
- `hivemind-powered` → `{ guardrailLevel: 'strict', delegationMode: 'waiter', toolAccessPattern: 'restricted', skillFilter: 'curated' }`
- `free-style` → `{ guardrailLevel: 'minimal', delegationMode: 'disabled', toolAccessPattern: 'full', skillFilter: 'all' }`

**Additional agreement:** Language config fields (`conversation_language`, `documents_language`) are injected via `system.transform` hook as early context (same mechanism as intake profile injection).

---

## Language Config Injection

| Option | Description | Selected |
|--------|-------------|----------|
| system.transform injection | `conversation_language` and `documents_language` are injected into `system.transform` hook as early context lines. Every session sees them before the first user message. | ✓ |
| Dedicated language hook | A separate hook specifically for language config injection. More explicit but adds another hook surface. | |
| Tool-level resolution only | Language fields are passed to tool implementations at execution time, not injected into session context. Tools format output based on `documents_language`. | |

**User's choice:** system.transform injection (Recommended)

**Notes:** Consistent with existing pattern (intake profile already injected via `system.transform`). Tools can also read `configs.json` directly via `deps.hivemindConfig` if needed.

---

## Profile Merge Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Config-first with runtime fallback | Configs.json is source of truth. Runtime-detected ProfileMatch from profile-resolver.ts fills gaps where config doesn't specify. Mode + user_expert_level from config always win when overlapping. | ✓ |
| Runtime-first with config default | Runtime-detected profile wins over config. Config is just the initial default. More dynamic but less predictable. | |
| Per-field merge with overrides | Config values and runtime values are merged with per-field override rules. More flexible but adds complexity. | |

**User's choice:** Config-first with runtime fallback (Recommended)

**Notes:** User also noted: configs.json once accidentally deleted is not auto-spawned during `npm run build` — should auto-generate from defaults. This is a resilience/UX concern to track separately.

---

## Merge Output Type

| Option | Description | Selected |
|--------|-------------|----------|
| Unified resolved type | A single `ResolvedBehavioralProfile` type that combines: mode → 4-field behavioral profile, user_expert_level → maps to profile-resolver expertise, conversation_language + documents_language → injection fields, runtime ProfileMatch → communicationStyle + decisionSpeed. One object, one resolution point. | ✓ |
| Separate objects | Keep hivemindConfig (from configs.json) separate from runtime ProfileMatch. Consumers pick from whichever they need. Simpler types but more indirection at consumption sites. | |

**User's choice:** Unified resolved type (Recommended)

**Notes:** Simpler for consumers — one resolution function `resolveBehavioralProfile(sessionId)` returns complete picture.

---

## Consumer Surface Design

| Option | Description | Selected |
|--------|-------------|----------|
| system.transform hook | Already injects intake context. Add behavioral profile fields (guardrailLevel, communicationStyle, language) to the system context injection. Every session sees the resolved profile. | ✓ |
| delegate-task tool | DelegationManager uses guardrailLevel and delegationMode to decide: allow delegation, restrict tool access for child sessions, set budget based on mode. | ✓ |
| Tool guard hooks | Check toolAccessPattern to block restricted tools in hivemind-powered mode. | |
| Category gates / skill loading | Category gates check skillFilter to skip non-curated skills in hivemind-powered mode. Not blocking, just advisory filtering. | ✓ |

**User's choice:** 1, 2, and 4 (Tool guard hooks excluded)

**Notes:** Tool guard hooks were explicitly NOT selected — advisory filtering via category gates instead. Also clarified: "more classified into workflows, tasks and not just delegate-task tools but other task-management, coordination and orchestration of tasks tools alike." Implication: behavioral profile should be available to all task/coordination tools, not just delegate-task.

---

## Task Tools Scope

| Option | Description | Selected |
|--------|-------------|----------|
| All tools get profile | All 16+ tools receive the resolved profile via shared injection. Each tool decides what to use. Consistent but requires updating every tool signature. | |
| Selective tool injection | Only tools that explicitly need behavioral info (delegate-task, delegation-status, run-background-command, configure-primitive, session-journal-export, etc.) get it. Fewer changes, inconsistent access pattern. | ✓ |

**User's choice:** Selective tool injection

**Notes:** Pragmatic approach — start with tools that clearly need it, add others as needed.

---

## Discuss Mode Dispatch

| Option | Description | Selected |
|--------|-------------|----------|
| Hook injection + existing command | system.transform hook reads workflow.discuss_mode and injects directive into session context. GSD `/gsd-discuss-phase` command already routes to correct workflow file. No new dispatch mechanism needed. | |
| New dispatch layer in harness | Build dispatch layer in harness that intercepts `/gsd-discuss-phase` calls and routes based on configs.json discuss_mode. More control but duplicates what command already does. | |
| No harness involvement | Harness doesn't wire discuss_mode — GSD command reads configs.json directly. This is purely a GSD tooling concern. | ✓ |

**User's choice:** No harness involvement (but with critical clarification)

**Notes:** User clarified: "NEVER COUNT gsd-* INTO ANY OF THE FEATURES OF THIS PROJECT DEVELOPMENTS - they are my toolings not the shipped-with." The f-04 auto-intent-vs-workflows-router (lacking in current code) is the actual shipped feature gap. CA-02 should include `discussMode` in the resolved behavioral profile (as a signal for shipped consumers like hm-*/hf-* agents), but the actual routing mechanism is deferred to WS-4 (auto-commands/workflow-router workstream). Discuss mode is a profile signal, not a GSD command dispatch.

---

## the agent's Discretion

- Behavioral profile lookup table approach chosen over function-based computation (simplicity, testability).
- Language injection via `system.transform` (consistency with existing profile injection).
- Config-first merge strategy (predictable, respects user's explicit config choices).
- Unified resolved type (simpler consumption).
- Selective tool injection (pragmatic scope control).
- Discuss mode as profile signal only, dispatch deferred (aligns with shipped features, not GSD tooling).

---

## Deferred Ideas

1. **f-04 Auto-commands / workflow router** — Build the actual intent→workflow routing mechanism that reads the resolved behavioral profile (mode, discussMode) and dispatches to appropriate workflows. This is the shipped feature missing from current code. Depends on CA-02's resolved profile. **Belongs in new workstream WS-4**.

2. **Tool guard enforcement** — Convert `toolAccessPattern` from advisory/category-gate filtering to hard enforcement (pre-execution blocking). Requires UX for "why blocked" explanations and safe override paths. Post-GA feature.

3. **Per-mode hook injection profiles** — Declarative YAML specifying which hooks are enabled/disabled per mode. Could optimize runtime by skipping unused hook factories. Low priority.

4. **Behavioral profile editor (sidecar)** — Admin UI for tuning profiles per team/role. Depends on WS-2 (bootstrap) and WS-8 (sidecar UI).

5. **A/B testing & metrics** — Telemetry to measure impact of different profiles on task success, delegation rates, and user satisfaction. Requires broader telemetry infra.

6. **configs.json auto-generation** — If configs.json is missing, `npm run build` (or first run) should auto-generate it from defaults with a clear console message. Currently it's not resilient to accidental deletion.

7. **Long-term user_expert_level inference** — Enhance `profile-resolver` to track interaction history across sessions and auto-adjust `user_expert_level` in configs (with user confirmation flow).

8. **Behavioral profile versioning** — As profiles evolve, need migration path for existing user configs (similar to how config schema versioning works now).

---

*End of discussion log*