# Phase 11: Runtime Context Detox and Plugin Flattening - Research

**Researched:** 2026-03-20
**Domain:** OpenCode plugin lifecycle hooks, runtime packet injection, and plugin-boundary flattening
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
## Implementation Decisions

### Runtime Context Emission
- Delete the `chat.message` context injection path as a runtime context emitter.
- Delete `experimental.chat.system.transform` as a duplicate context emitter.
- Keep a single authoritative runtime context injection path plus `experimental.session.compacting` for compaction survival.
- Cache `loadRuntimeBindingsSnapshot(directory)` once per turn instead of reloading runtime state multiple times.
- Replace the competing XML packets with one unified `<hivemind context_version="v1">` block that carries the authoritative runtime fields: `session_id`, `lineage`, `trajectory`, `workflow`, `task_ids`, `entry_state`, `purpose`, `risk`, `route_command`, `governance_mode`, and `language`.

### Plugin Orchestration Simplification
- Remove `createPluginRuntimePlan()` orchestration and replace it with direct calls to the actually consumed runtime entry pieces.
- Treat unused outputs, surface registries, context-injection plans, and runtime bridge scaffolding as dead weight unless implementation proves a live consumer.
- Favor direct plugin-owned render/injection helpers over wrapper chains that only forward arguments.

### Removal Targets
- Delete `src/plugin/runtime-plan.ts`.
- Delete `src/plugin/surface-registry.ts`.
- Delete `src/plugin/create-core-hooks.ts`.
- Delete `src/plugin/plugin-types.ts` unless a minimal `PluginRuntimeInput` survivor is still required by live code.
- Delete `src/shared/turn-output.ts`, `src/shared/runtime-invocation.ts`, and `src/shared/lifecycle-spine.ts` if repo evidence confirms they are only consumed by dead paths.
- Delete `src/hooks/runtime-bridge/`, `src/hooks/context-injection/`, and `src/hooks/prompt-transformation/` if no live consumer remains after the simplification.
- Delete the `src/hooks/start-work/*` re-export shims called out in the architecture doc and import directly from `src/features/session-entry/*`.

### Boundaries to Preserve
- Keep the six SDK tools as stable authority surfaces: `hivemind_doc`, `hivemind_runtime_status`, `hivemind_runtime_command`, `hivemind_task`, `hivemind_trajectory`, and `hivemind_handoff`.
- Keep `src/core/` state-management domains that remain authoritative.
- Keep `src/features/session-entry/` and `src/features/runtime-entry/` as the real behavior owners unless the refactor only thins adapters around them.
- Keep `src/commands/slash-command/`, `src/control-plane/`, `skills/`, and the throttled governance toast behavior unless a change is necessary to preserve the new simplified runtime path.
- Treat `src/intelligence/` and `src/plugin-handlers/` as evaluation targets, not automatic deletions.

### Verification Discipline
- Do not preserve false-positive, placeholder, or content-presence-only baselines just to keep tests green.
- Any claim that a hook, file, or directory is unused must be proven by current repo evidence before deletion.
- The phase must reduce false runtime emissions and wrong baselines, not merely rename layers around them.

### Claude's Discretion
No explicit Claude's Discretion section was provided in `11-CONTEXT.md`.

### Deferred Ideas (OUT OF SCOPE)
## Deferred Ideas

- Richer TUI/operator UX work — remains out of scope for this phase.
- New feature expansion, policy packs, or skill-pack work — out of scope.
- Any speculative restoration work not directly required to detox runtime context emission or flatten the plugin path — deferred.
</user_constraints>

## Summary

Phase 11 should now be planned against the corrected hook model, not the earlier assumption that a new session-start hook was needed. Current repo evidence already shows the surviving plugin assembly uses `event`, `chat.message`, `experimental.chat.messages.transform`, and `experimental.session.compacting` in `src/plugin/opencode-plugin.ts`, and the current smoke test already asserts that `chat.message` does not inject runtime parts while `experimental.chat.messages.transform` and `experimental.session.compacting` carry the authoritative packet behavior.

Official OpenCode docs list `session.created` and `session.compacted` among events delivered through the existing `event` hook, and upstream issue `anomalyco/opencode#5409` explicitly documents that plugin authors already use `event` for `session.created` today while requesting a separate `SessionStart` hook only for missing resume semantics. Upstream issue `anomalyco/opencode#16879` further confirms `event` is fire-and-forget and its promise is dropped, which means Phase 11 must treat `event` as a side-effect/state-initialization seam only, never as a runtime packet injection seam.

The prescriptive runtime model for this phase is therefore: use `event` for lifecycle observation and state setup, keep `chat.message` only for turn reset or other non-packet coordination if still needed, use `experimental.chat.messages.transform` as the sole runtime packet injector, and use `experimental.session.compacting` as the explicit compaction-preservation seam. Do not reintroduce feature-local session-start hook files or any second injector under a different name.

**Primary recommendation:** Plan Phase 11 as a correction-and-proof pass: preserve the current single-injector model, formalize `event` as side-effect-only lifecycle handling, reconcile outdated planning artifacts, and add proof-first tests for lifecycle behavior versus runtime packet injection.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@opencode-ai/plugin` | `1.2.27` | Official plugin hook and tool surface | The phase is about conforming to actual OpenCode hook semantics, so this package is the authority boundary. |
| `@opencode-ai/sdk` | `1.2.27` | Event types and client surface consumed by plugin/runtime tests | Repo code and verification both depend on SDK types matching live OpenCode behavior. |
| `tsx` | `4.21.0` verified upstream; repo declares `^4.7.0` | Node test runner for `.test.ts` files | Existing repo tests already use `tsx --test`; Phase 11 should extend that test seam, not add a second framework. |
| `typescript` | `5.9.3` verified upstream; repo declares `^5.3.0` | Type and import deletion safety gate | Phase 11 deletes wrappers and moves ownership, so `tsc --noEmit` remains the first hard gate. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Official OpenCode plugin docs | updated 2026-03-19 | Hook contract reference | Use for hook names, event availability, and documented mutator surfaces. |
| GitHub issue evidence | current as of 2026-03-20 | Runtime-behavior clarifications not fully captured in docs | Use when docs omit lifecycle edge cases such as `event` fire-and-forget or compaction gaps. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Existing `event` + `session.created` | New session-start hook abstraction | Rejected for Phase 11 because upstream already exposes `session.created` on `event`, and inventing a local hook would create a shadow lifecycle contract. |
| `experimental.chat.messages.transform` as sole runtime injector | `chat.message` packet injection | Rejected because Phase 11 explicitly converges on one packet injector and current repo tests already prove `chat.message` is not the injector. |
| `experimental.session.compacting` as preservation seam | Rely on message transform during compaction | Rejected because `anomalyco/opencode#17820` documented a real compaction gap for `experimental.chat.messages.transform` in `1.2.27`. |

**Installation:**
```bash
npm install @opencode-ai/plugin@1.2.27 @opencode-ai/sdk@1.2.27
```

**Version verification:**
```bash
npm view @opencode-ai/plugin version time.modified
npm view @opencode-ai/sdk version time.modified
npm view tsx version time.modified
npm view typescript version time.modified
```

Verified on 2026-03-20:
- `@opencode-ai/plugin` `1.2.27`, modified `2026-03-19T20:21:52.478Z`
- `@opencode-ai/sdk` `1.2.27`, modified `2026-03-19T20:21:48.005Z`
- `tsx` `4.21.0`, modified `2025-11-30T15:56:09.695Z`
- `typescript` `5.9.3`, modified `2026-03-19T07:28:08.377Z`

## Architecture Patterns

### Recommended Project Structure
```text
src/
├── plugin/                  # Hook assembly, packet rendering, route hint helpers
├── hooks/event-handler.ts   # Event-side effects only
├── features/runtime-entry/  # Runtime behavior owners preserved by phase boundary
├── features/session-entry/  # Start-work classification and lifecycle decisions
├── tools/                   # Stable SDK tool surfaces
└── shared/                  # Only proven survivors after consumer audit
```

### Pattern 1: Event Hook for Lifecycle Side Effects Only
**What:** Use the existing `event` hook to observe OpenCode lifecycle events such as `session.created` and `session.compacted`, and do state initialization or receipts there.

**When to use:** Session creation bookkeeping, recovery checkpoint triggers, telemetry, trajectory notes, or cached state bootstrap that does not need to mutate the prompt packet for the current turn.

**Example:**
```typescript
// Source: https://opencode.ai/docs/plugins/ and https://github.com/anomalyco/opencode/issues/16879
event: async ({ event }) => {
  if (event.type === 'session.created') {
    await initializeSessionState()
  }

  if (event.type === 'session.compacted') {
    await recordCompactionCheckpoint()
  }
}
```

### Pattern 2: Keep `chat.message` as Coordination, Not Injection
**What:** If `chat.message` remains at all, use it for turn-local resets or non-packet coordination only.

**When to use:** Resetting per-turn caches, showing degraded-mode toasts, or capturing timing boundaries before the actual injector runs.

**Example:**
```typescript
// Source: src/plugin/opencode-plugin.ts
'chat.message': async () => {
  turnSnapshot.resetTurnSnapshot()
  const snapshot = await turnSnapshot.getSnapshot()
  if (snapshot.hasHivemind && !snapshot.hivemindHealthy) {
    await showGovernanceToast('degraded-mode', 'Run `hm-init` for full capabilities.', 'warning')
  }
}
```

### Pattern 3: Messages Transform Is the Sole Runtime Injector
**What:** Inject the canonical `<hivemind context_version="v1">` packet only through `experimental.chat.messages.transform`.

**When to use:** Every normal request-turn runtime packet injection.

**Example:**
```typescript
// Source: src/plugin/opencode-plugin.ts
'experimental.chat.messages.transform': async (_input, output) => {
  const messages = output.messages as MessageLike[]
  const lastUserMessage = findLastUserMessage(messages)
  if (!lastUserMessage) return

  const snapshot = await turnSnapshot.getSnapshot()
  const startWork = resolveStartWork(createStartWorkInput({
    directory,
    sessionId: lastUserMessage.info!.sessionID,
    userMessage: getMessageText(lastUserMessage),
    snapshot,
  }))

  const packet = renderHivemindContext(createHivemindContextPacket({
    sessionId: lastUserMessage.info!.sessionID,
    snapshot,
    startWork,
  }))

  lastUserMessage.parts = [
    createSyntheticPart(lastUserMessage.info!.sessionID, lastUserMessage.info!.id, packet),
    ...(lastUserMessage.parts ?? []),
  ]
}
```

### Pattern 4: Compaction Has Its Own Preservation Seam
**What:** Preserve the same canonical packet through `experimental.session.compacting` instead of assuming message transforms cover compaction.

**When to use:** Continuation summary preservation and post-compaction recovery.

**Example:**
```typescript
// Source: src/plugin/opencode-plugin.ts and https://opencode.ai/docs/plugins/
'experimental.session.compacting': async (input, output) => {
  const snapshot = await turnSnapshot.getSnapshot()
  output.context.push(renderHivemindContext(createHivemindContextPacket({
    sessionId: input.sessionID,
    snapshot,
  })))
}
```

### Pattern 5: Delete by Consumer Proof, Not by Planned Topology
**What:** Delete plugin families only after current code and tests prove no preserved runtime consumer remains.

**When to use:** Any removal target from `11-CONTEXT.md`, especially shared and hook-layer files.

### Anti-Patterns to Avoid
- **Inventing a local session-start contract:** Do not add `session-start-hook.ts` or a repo-local `session.start` hook for Phase 11.
- **Using `event` as a packet injector:** Docs and issue evidence support `event` for lifecycle observation, not prompt mutation.
- **Treating `chat.message` as a stealth second injector:** It may coordinate lifecycle state, but under Phase 11 it must not emit runtime context.
- **Trusting outdated planning topology over current repo proof:** Current repo and tests already reflect part of the corrected model; planning must start from that truth.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session-start lifecycle seam | Custom `session.start` abstraction inside this repo | Existing `event` hook with `session.created` | Official OpenCode already exposes this event, and a local hook would become a competing contract. |
| Runtime packet injection | Secondary injectors in `chat.message`, system transform, or event helpers | `experimental.chat.messages.transform` only | One packet path is the explicit Phase 11 convergence rule. |
| Compaction preservation | Hidden carry-forward logic in message transform | `experimental.session.compacting` | Official docs and upstream issue evidence show compaction needs an explicit seam. |
| Plugin orchestration | New plan/registry wrappers around surviving helpers | Direct plugin assembly imports | Phase 11 is flattening, not replacing dead scaffolding with new scaffolding. |
| Lifecycle proof | Content-presence-only smoke tests | Hook-specific behavior tests separated by seam | The phase needs proof of ownership and behavior, not just string presence. |

**Key insight:** The riskiest thing to hand-roll here is a new lifecycle contract. Phase 11 should remove invented hook topology, not move it to a different folder.

## Common Pitfalls

### Pitfall 1: Planning Against the Old Session-Start Assumption
**What goes wrong:** The plan creates tasks for a custom session-start hook family because the older planning artifact proposed one.
**Why it happens:** The artifact predates the corrected Phase 11 hook model.
**How to avoid:** Treat `session.created` on the existing `event` hook as the official lifecycle start signal that exists today.
**Warning signs:** Any task mentions `session-start-hook.ts`, `session.start`, or feature-local hook registration for startup.

### Pitfall 2: Using `event` for Anything That Must Affect the Current Prompt
**What goes wrong:** The design relies on `event` to synchronously affect the current runtime packet.
**Why it happens:** `event` looks lifecycle-rich, but upstream issue `#16879` confirms it is fire-and-forget.
**How to avoid:** Limit `event` to side effects and initialization; use messages transform and compaction hooks for AI-visible context.
**Warning signs:** Tasks expect `event` to block idle transitions or mutate the outgoing prompt.

### Pitfall 3: Re-introducing `chat.message` as a Hidden Injector
**What goes wrong:** A new packet or reminder is slipped into `chat.message` because it is easy to reach user-turn state there.
**Why it happens:** `chat.message` is already present and has access to session timing.
**How to avoid:** Keep `chat.message` tests strict: reset/coordination is allowed, runtime packet emission is not.
**Warning signs:** `output.parts` mutation reappears in `chat.message` tests or implementation.

### Pitfall 4: Ignoring Compaction-Specific Coverage
**What goes wrong:** Normal turns work, but compacted sessions lose context or preserve a different packet shape.
**Why it happens:** The team assumes messages transform covers both normal and compacted requests.
**How to avoid:** Keep dedicated compaction tests and preserve `experimental.session.compacting` as a first-class seam.
**Warning signs:** No test asserts packet parity between normal turns and compaction.

### Pitfall 5: Letting Stale Repo Docs Override Live Code
**What goes wrong:** Planning follows older notes that still describe `chat.message` as a context injector.
**Why it happens:** Some AGENTS/planning artifacts lagged the Phase 11 corrections.
**How to avoid:** Prefer current code, current tests, official docs, and current upstream issues over stale narrative docs.
**Warning signs:** Documentation claims a hook injects runtime context, but `tests/plugin-assembly-smoke.test.ts` disproves it.

## Code Examples

Verified patterns from repo evidence and official docs:

### Lifecycle Side Effects via `event`
```typescript
// Source: https://opencode.ai/docs/plugins/
export const NotificationPlugin = async ({ $ }) => {
  return {
    event: async ({ event }) => {
      if (event.type === 'session.created') {
        await initializeSessionState()
      }
      if (event.type === 'session.idle') {
        await $`osascript -e 'display notification "Session completed!" with title "opencode"'`
      }
    },
  }
}
```

### Current Repo Injector Shape
```typescript
// Source: src/plugin/opencode-plugin.ts
const packet = renderHivemindContext(createHivemindContextPacket({
  sessionId: sessionID,
  snapshot,
  startWork,
}))

lastUserMessage.parts = [
  createSyntheticPart(sessionID, messageID, packet),
  ...(lastUserMessage.parts ?? []),
]
```

### Current Repo Compaction Preservation Shape
```typescript
// Source: src/plugin/opencode-plugin.ts
output.context.push(renderHivemindContext(createHivemindContextPacket({
  sessionId: compactionInput.sessionID,
  snapshot,
})))
```

### Proof-First Guard for `chat.message`
```typescript
// Source: tests/plugin-assembly-smoke.test.ts
const output = { parts: [] as Part[] }
await hooks['chat.message']?.({ sessionID: 'ses_123', messageID: 'msg_123' } as never, output as never)
assert.equal(output.parts.length, 0)
```

## Testing / TDD Implications

TTD for Phase 11 should separate lifecycle proof from runtime-injection proof. The core mistake to avoid is asserting that a hook exists without proving what it is allowed to do.

### Proof-First Test Seams
- **Lifecycle seam:** `event` receives `session.created` and `session.compacted`, triggers side effects only, and is never treated as a prompt mutator.
- **Turn coordination seam:** `chat.message` may reset per-turn snapshot state, but it must not emit runtime packet parts.
- **Runtime injection seam:** `experimental.chat.messages.transform` injects exactly one canonical `<hivemind context_version="v1">` packet on normal turns.
- **Compaction seam:** `experimental.session.compacting` injects the canonical packet for continuation survival.

### Must Be Tested Before Implementation Claims
1. `event` side-effect tests: prove `session.created` and `session.compacted` can be observed without introducing any output mutation contract.
2. `chat.message` non-injector tests: prove reset/toast behavior can remain while `output.parts` stays untouched.
3. `messages.transform` injector tests: prove one canonical packet is injected and no legacy packet families survive.
4. `compaction` preservation tests: prove the compacted context carries the same authoritative packet shape.
5. consumer-proof tests: prove each deletion target has zero preserved runtime consumers before removal.

### Test Strategy
- **Red:** add failing tests for missing lifecycle-side-effect proof and stale artifact assumptions.
- **Green:** implement or preserve only the minimal hook wiring needed to satisfy the corrected contract.
- **Refactor:** delete wrapper families after consumer-proof tests pass.

## Artifact Reconciliation

The planning artifact at `.experimental-planning/the-agent-work-contract-planning-artifact.md` contains both transferable ideas and now-invalid hook topology.

### What Transfers
- **Single snapshot per turn:** still valid and directly aligned with `src/plugin/runtime-snapshot.ts`.
- **Feature-owned behavior, thin plugin wiring:** still valid and aligned with current plugin assembly.
- **Schema/contract thinking for durable state:** still directionally useful outside the rejected hook assumptions.

### What Does Not Transfer
- **`session-start-hook.ts`:** invalid under the corrected Phase 11 model. Do not create a feature-local start hook when `session.created` already arrives through `event`.
- **`turn-control-hook.ts` as a runtime emitter:** invalid if it becomes a second packet injector or a stealth continuation injector.
- **Hook family topology as architecture truth:** invalid where it conflicts with current repo evidence and upstream OpenCode behavior.

### How to Interpret the Artifact Under Phase 11 Constraints
- Read the artifact as a diagnosis and idea source, not as current hook authority.
- Reuse its concerns about over-reading runtime state and over-coupled feature boundaries.
- Discard any assumption that Phase 11 should introduce a new session-start hook family.
- Reframe lifecycle work onto the existing `event` hook and keep AI-visible runtime context exclusively on `experimental.chat.messages.transform` plus `experimental.session.compacting`.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Assume custom session-start hook is needed | Use `event` with `session.created` for lifecycle observation | Verified against current docs/issues on 2026-03-20 | Removes a shadow lifecycle contract from the plan. |
| Treat `chat.message` as a plausible packet injector | Treat `chat.message` as reset/coordination only | Reflected in current repo tests on 2026-03-20 | Keeps one runtime packet injector instead of two. |
| Assume compaction can inherit message injection automatically | Preserve packet explicitly via `experimental.session.compacting` | Reinforced by `#17820` | Prevents compaction-specific context loss. |

**Deprecated/outdated:**
- `experimental.chat.system.transform` as authoritative runtime injector: outdated because upstream issue `#17100` reports mutations are discarded by runtime.
- Feature-local `session-start-hook.ts`: outdated because OpenCode already emits `session.created` through `event`.
- Treating `event` as synchronous control flow: outdated because upstream issue `#16879` documents fire-and-forget behavior.

## Open Questions

1. **Does Phase 11 still need `chat.message` at all once reset/toast duties are isolated?**
   - What we know: current repo keeps it only for reset/degraded-mode behavior, and tests assert zero packet injection.
   - What's unclear: whether those duties can move elsewhere without changing runtime semantics.
   - Recommendation: treat deletion as optional, not required; preserve unless there is proof of a cleaner seam.

2. **Which deletion targets still have preserved runtime consumers after the corrected hook model is applied?**
   - What we know: the user asked to flatten plugin ownership only where runtime evidence supports it.
   - What's unclear: a full per-file zero-consumer matrix for every candidate named in `11-CONTEXT.md`.
   - Recommendation: make consumer-proof a prerequisite task, not an afterthought.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node `tsx --test` |
| Config file | `package.json` |
| Quick run command | `npx tsx --test tests/plugin-assembly-smoke.test.ts -x` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| P11-LIFE-01 | `event` observes lifecycle events like `session.created` for side effects only | unit | `npx tsx --test tests/plugin-event-hook.test.ts -x` | ❌ Wave 0 |
| P11-LIFE-02 | `chat.message` does not inject runtime parts | unit | `npx tsx --test tests/plugin-assembly-smoke.test.ts -x` | ✅ |
| P11-INJECT-01 | `experimental.chat.messages.transform` injects one canonical packet on normal turns | unit | `npx tsx --test tests/plugin-assembly-smoke.test.ts -x` | ✅ |
| P11-INJECT-02 | `experimental.session.compacting` preserves canonical packet during compaction | unit | `npx tsx --test tests/plugin-assembly-smoke.test.ts -x` | ✅ |
| P11-DEL-01 | deletion targets are removed only after zero-consumer proof | unit | `npx tsx --test tests/plugin-consumer-proof.test.ts -x` | ❌ Wave 0 |
| P11-BOUND-01 | preserved runtime/tool boundaries still work after flattening | integration | `npx tsx --test tests/runtime-tools.test.ts tests/plugin-assembly-smoke.test.ts -x` | ✅ partial |

### Sampling Rate
- **Per task commit:** run the targeted `tsx --test` command for the hook seam touched.
- **Per wave merge:** `npm run typecheck:core && npm test`
- **Phase gate:** full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/plugin-event-hook.test.ts` — prove `event` handles `session.created`/`session.compacted` as side effects only.
- [ ] `tests/plugin-consumer-proof.test.ts` — prove deletion candidates have zero preserved consumers before removal.
- [ ] Strengthen `tests/plugin-assembly-smoke.test.ts` with explicit assertion that no `event` mutator contract is relied upon.
- [ ] Add a parity assertion that the canonical packet shape in normal turns and compaction is identical for required fields.

## Sources

### Primary (HIGH confidence)
- `src/plugin/opencode-plugin.ts` - current surviving hook assembly and current injector/preservation seams
- `tests/plugin-assembly-smoke.test.ts` - current repo proof that `chat.message` is non-injecting and messages/compaction hooks own packet behavior
- `src/hooks/event-handler.ts` - current repo event-side-effect behavior
- `src/plugin/runtime-snapshot.ts` - current per-turn cached snapshot seam
- `https://opencode.ai/docs/plugins/` - official hook/event list and compaction hook contract, last updated 2026-03-19
- `https://github.com/anomalyco/opencode/issues/5409` - upstream evidence that `event` already receives `session.created`, while a separate session-start hook was requested for missing resume semantics

### Secondary (MEDIUM confidence)
- `https://github.com/anomalyco/opencode/issues/16879` - upstream evidence that `event` is fire-and-forget and not awaited
- `https://github.com/anomalyco/opencode/issues/17100` - upstream evidence that `experimental.chat.system.transform` mutations are discarded by runtime
- `https://github.com/anomalyco/opencode/issues/17820` - upstream evidence that `experimental.chat.messages.transform` needed separate compaction handling in `1.2.27`
- `.experimental-planning/the-agent-work-contract-planning-artifact.md` - useful diagnosis, but stale hook topology requiring reconciliation

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - package versions were verified against npm registry and official docs are current
- Architecture: HIGH - recommendations are anchored in current repo code/tests plus official hook/event docs
- Pitfalls: HIGH - pitfalls are backed by repo evidence and current upstream issues

**Research date:** 2026-03-20
**Valid until:** 2026-04-19
