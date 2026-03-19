# Phase 11: Runtime Context Detox and Plugin Flattening - Research

**Researched:** 2026-03-19
**Domain:** OpenCode plugin runtime context injection, hook authority, and repo-local plugin flattening
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

Phase 11 should be planned as a surgical runtime-authority correction, not a broad cleanup pass. Current repo evidence shows the plugin emits overlapping runtime context through `chat.message`, `experimental.chat.system.transform`, `experimental.chat.messages.transform`, and `experimental.session.compacting`, while repeatedly calling `loadRuntimeBindingsSnapshot(directory)` across multiple hooks in the same turn. That is the concrete source of duplicated context, stale wrapper layering, and false-confidence tests.

The plan should converge on one authoritative per-turn injection seam and one compaction-preservation seam. Based on current OpenCode docs and upstream bug evidence, the safest choice is to make `experimental.chat.messages.transform` the only runtime message injection path, keep `experimental.session.compacting` for compaction survival, delete `chat.message` as a context emitter, and delete `experimental.chat.system.transform` entirely. Upstream issue `anomalyco/opencode#17100` reports that `experimental.chat.system.transform` mutations are silently discarded by the runtime, so Phase 11 should treat that hook as non-authoritative even if local tests can mutate its in-process object.

The plugin-flattening side of the phase should remove orchestration that no live runtime consumer needs, but only after proving consumer absence. `src/plugin/runtime-plan.ts`, `src/plugin/surface-registry.ts`, and `src/plugin/create-core-hooks.ts` are strong deletion candidates because current repo evidence ties them mainly to the old plugin plan path and tests that validate that path. In contrast, `src/shared/runtime-invocation.ts`, `src/shared/turn-output.ts`, `src/shared/lifecycle-spine.ts`, and parts of `src/hooks/runtime-bridge/` still have live consumers or test-backed behavior, so the plan must relocate or preserve them until consumers are actually removed.

**Primary recommendation:** Plan Phase 11 as four ordered moves: prove live consumers, collapse to one cached snapshot plus one unified packet, delete dead orchestration/wrappers, then replace old-layer tests with behavior checks against the real plugin runtime path.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@opencode-ai/plugin` | `1.2.27` | Official OpenCode plugin hook and tool surface | This is the runtime authority for plugin hooks, tool definitions, and compaction behavior in this phase. |
| `@opencode-ai/sdk` | `1.2.27` | Official client API used by the plugin | Current repo governance is SDK-first; Phase 11 must preserve official boundary behavior rather than re-invent it. |
| `tsx` | `4.7.0` | Test runner for repo `.test.ts` files | Existing test harness already uses `tsx --test`, so planning should extend current verification instead of introducing a second test stack. |
| `typescript` | `^5.3.0` | Compile-time guardrail | The refactor deletes and relocates types and adapters; `tsc --noEmit` is the first safety gate. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Repo test suite | current repo | Verifies boundary rules and runtime behavior | Use for deletion-proof and behavior regression checks after each plugin flattening step. |
| `npm view` registry metadata | 2026-03-19 verified | Version validation source | Use before locking package recommendations into plan docs or implementation tasks. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `experimental.chat.messages.transform` as primary injector | `chat.message` | Rejected because Phase 11 explicitly deletes it as a context emitter and current plugin already duplicates context through it. |
| `experimental.session.compacting` for compaction only | `experimental.chat.messages.transform` only | Rejected because upstream issue `anomalyco/opencode#17820` shows messages transform had compaction gaps in `1.2.27`; keeping explicit compaction support is safer. |
| Direct plugin helpers | `createPluginRuntimePlan()` | Rejected because current plan object mostly serves wrapper chains and stale tests rather than live runtime needs. |

**Installation:**
```bash
npm install @opencode-ai/plugin@1.2.27 @opencode-ai/sdk@1.2.27
```

**Version verification:**
```bash
npm view @opencode-ai/plugin version time.modified
npm view @opencode-ai/sdk version time.modified
```

Verified on 2026-03-19:
- `@opencode-ai/plugin` `1.2.27`, modified `2026-03-19T12:10:13.666Z`
- `@opencode-ai/sdk` `1.2.27`, modified `2026-03-19T12:10:09.030Z`

## Architecture Patterns

### Recommended Project Structure
```text
src/
├── plugin/                  # Thin plugin assembly, unified packet render, route hints
├── features/runtime-entry/  # Real runtime entry behavior owners
├── features/session-entry/  # Start-work and session-entry authority
├── core/                    # Authoritative state domains preserved by phase boundary
├── tools/                   # Stable SDK tool surfaces
└── shared/                  # Only shared utilities still proven live after consumer audit
```

### Pattern 1: One Snapshot Per Turn
**What:** Create one per-turn snapshot loader in plugin assembly, cache it, and pass the cached value to every hook/helper that needs runtime state.

**When to use:** Any hook path that needs runtime bindings during a single LLM turn.

**Example:**
```typescript
type SnapshotLoader = () => RuntimeBindingsSnapshot

function createSnapshotLoader(directory: string): SnapshotLoader {
  let cached: RuntimeBindingsSnapshot | undefined
  return () => {
    cached ??= loadRuntimeBindingsSnapshot(directory)
    return cached
  }
}
```

### Pattern 2: One Authoritative Packet
**What:** Replace split packet families with one unified `<hivemind context_version="v1">` render function owned near plugin assembly.

**When to use:** Every per-turn message injection path and compaction injection path.

**Example:**
```typescript
function renderHivemindContext(input: {
  sessionId: string
  lineage: string
  trajectory: string
  workflow: string
  taskIds: string[]
  entryState: string
  purpose: string
  risk: string
  routeCommand: string
  governanceMode: string
  language: string
}): string {
  return [
    `<hivemind context_version="v1">`,
    `session_id=${input.sessionId}`,
    `lineage=${input.lineage}`,
    `trajectory=${input.trajectory}`,
    `workflow=${input.workflow}`,
    `task_ids=${input.taskIds.join(",")}`,
    `entry_state=${input.entryState}`,
    `purpose=${input.purpose}`,
    `risk=${input.risk}`,
    `route_command=${input.routeCommand}`,
    `governance_mode=${input.governanceMode}`,
    `language=${input.language}`,
    `</hivemind>`,
  ].join("\n")
}
```

### Pattern 3: Delete by Consumer Proof
**What:** Every deletion candidate gets a live-consumer audit before removal.

**When to use:** Before deleting files named in `11-CONTEXT.md`, especially shared or hook-layer files.

**Example:**
```text
1. Identify all imports and runtime registrations.
2. Classify each consumer as live runtime, tool/runtime entry, test-only, or dead wrapper.
3. If any live runtime or preserved feature imports remain, relocate first.
4. Delete only after consumer count reaches zero or surviving code is moved.
```

### Pattern 4: Feature-Owned Behavior, Plugin-Owned Wiring
**What:** The plugin should assemble hooks and render packet content, while feature folders continue to own business behavior.

**When to use:** Whenever a file only adapts feature outputs into hook registration.

### Anti-Patterns to Avoid
- **Wrapper-on-wrapper prompt transforms:** `system-transform.ts` -> `transform-runtime-prompt.ts` -> prompt compiler is unnecessary if the plugin only needs final packet strings.
- **Deletion by architecture wish:** Do not delete `src/shared/runtime-invocation.ts` or `src/hooks/runtime-bridge/` just because the target architecture wants fewer layers; current repo evidence still shows live consumers.
- **Test-preserved dead layers:** Do not keep `createPluginRuntimePlan()` alive only because tests assert it exists.
- **Content-presence assertions:** Tests that only check a string exists in output are not valid proof of runtime-authoritative behavior.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Plugin hook contract | Custom shadow hook abstraction | Official `@opencode-ai/plugin` hook names and mutation contract | Phase 11 is about reducing shadow layers, not adding another one. |
| Per-turn state caching | Ad-hoc cache objects in multiple modules | One plugin-local lazy snapshot loader | Single ownership prevents drift and duplicate loads. |
| Runtime-consumer proof | Manual intuition-based deletes | Repo evidence from imports, registrations, and tests | This phase specifically guards against false deletion assumptions. |
| Prompt packet families | Parallel XML packet variants | One unified `<hivemind context_version="v1">` renderer | Multiple packet families already caused duplication and overlap. |
| Confidence baseline | Placeholder smoke tests | Behavior checks against actual hook assembly and preserved consumers | Old tests currently validate architecture theater, not authority. |

**Key insight:** The most dangerous custom behavior in this phase is not new code; it is custom confidence. Do not preserve synthetic plan objects, synthetic surface registries, or synthetic hook hierarchies once the plugin can wire the authoritative behavior directly.

## Common Pitfalls

### Pitfall 1: Deleting a File That Still Serves a Preserved Consumer
**What goes wrong:** A file looks like dead architecture from the Phase 11 target shape, but it still feeds runtime entry commands, tools, or preserved shared logic.
**Why it happens:** Architecture diagnosis is ahead of current repo state.
**How to avoid:** Audit all imports before deletion and classify consumers.
**Warning signs:** Shared files are still referenced by `src/features/runtime-entry/*`, `src/tools/runtime/*`, or high-value tests.

### Pitfall 2: Trusting `experimental.chat.system.transform`
**What goes wrong:** The team believes system-transform mutations are authoritative because local plugin code mutates the object.
**Why it happens:** Local mutation is observable in-process, but upstream issue `#17100` reports runtime discard.
**How to avoid:** Delete the hook as a context emitter and move all authoritative injection to message transform plus explicit compaction support.
**Warning signs:** Tests only inspect mutated objects or local packet strings, not delivered runtime behavior.

### Pitfall 3: Collapsing to `messages.transform` Without Compaction Coverage
**What goes wrong:** Per-turn behavior works, but compacted sessions lose context.
**Why it happens:** Upstream issue `#17820` documents compaction not triggering `experimental.chat.messages.transform` in `1.2.27`.
**How to avoid:** Keep `experimental.session.compacting` as an explicit preservation seam.
**Warning signs:** `/compact` or continuation flows are untested after flattening.

### Pitfall 4: Replacing Duplicate Packets With a Bigger Duplicate Packet System
**What goes wrong:** The refactor keeps multiple renderers and just renames them.
**Why it happens:** Existing prompt-packet layers are easier to adapt than remove.
**How to avoid:** Define one canonical packet renderer and make every preserved injection path consume it.
**Warning signs:** Separate system/message/sub-session packet renderers still carry overlapping fields after the phase.

### Pitfall 5: Keeping False Baselines Green
**What goes wrong:** Tests continue to pass while the live runtime path remains wrong.
**Why it happens:** Old tests assert the existence of `createPluginRuntimePlan()`, wrapper outputs, or hook names instead of user-visible authority.
**How to avoid:** Replace old-plan tests with behavior checks for hook registration, one-snapshot behavior, one-packet behavior, and deletion-proof consumer integrity.
**Warning signs:** A test suite passes even though duplicate emitters still exist or authoritative hooks are unchanged.

## Code Examples

Verified planning patterns from current repo and official docs:

### Primary Injection Strategy
```typescript
export const HiveMindPlugin: Plugin = async (ctx) => {
  const getSnapshot = createSnapshotLoader(ctx.directory)

  return {
    "experimental.chat.messages.transform": async (input, output) => {
      const snapshot = getSnapshot()
      const packet = renderHivemindContext(fromSnapshot(snapshot))
      output.messages = injectPacket(output.messages, packet)
    },

    "experimental.session.compacting": async (_input, output) => {
      const snapshot = getSnapshot()
      output.context.push(renderHivemindContext(fromSnapshot(snapshot)))
    },
  }
}
```

### Deletion-Proof Audit Checklist
```text
Candidate file:
- Imported by live plugin assembly? keep or relocate first
- Imported by preserved runtime entry/tool code? keep or relocate first
- Imported only by old plugin-plan wrappers and stale tests? safe deletion candidate
- Mentioned only in architecture docs but not code? verify before acting
```

### Route Hint as a Small Surviving Helper
```typescript
function buildRouteReminder(routeCommand: string, risk: string): string {
  return [
    "<hivemind-route-bridge>",
    `route_command=${routeCommand}`,
    `risk=${risk}`,
    "</hivemind-route-bridge>",
  ].join("\n")
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Multiple plugin packet emitters (`chat.message`, system transform, messages transform, compaction) | One authoritative runtime packet plus explicit compaction support | Phase 11 target, based on 2026 repo and upstream hook evidence | Reduces duplication, drift, and false-authority tests. |
| Orchestration object as integration center | Thin plugin assembly calling real feature/runtime helpers directly | Phase 11 target | Removes wrapper tax and makes consumer ownership auditable. |
| In-process mutation as proof | Official docs + runtime issue evidence + repo consumer audit | 2026 research discipline | Prevents local false positives from being mistaken for live behavior. |

**Deprecated/outdated:**
- `experimental.chat.system.transform` as authoritative packet injector: outdated for this project because upstream evidence shows runtime discard risk.
- `createPluginRuntimePlan()` as safety blanket: outdated because it centralizes outputs that current runtime does not need.
- Test-only surface registries: outdated when they are no longer proving live behavior.

## Open Questions

1. **Should `src/hooks/runtime-bridge/instruction-loader.ts` move into `src/features/runtime-entry/` or `src/plugin/`?**
   - What we know: `src/features/runtime-entry/command.ts` still imports it, so `src/hooks/runtime-bridge/` is not yet fully dead.
   - What's unclear: Which preserved owner is the best permanent home.
   - Recommendation: Decide ownership before any directory deletion task; do not plan whole-directory deletion until this file moves or is proven dead.

2. **Should `src/plugin-handlers/` survive as a thin plugin-local helper set or be inlined into `src/plugin/`?**
   - What we know: Current evidence shows it is mostly part of the old plugin-plan path.
   - What's unclear: Whether any preserved behavior still benefits from a stable helper boundary.
   - Recommendation: Plan an audit subtask first, then either inline tiny survivors or delete the directory after proof.

3. **Can `src/shared/turn-output.ts`, `src/shared/runtime-invocation.ts`, and `src/shared/lifecycle-spine.ts` be deleted in this phase?**
   - What we know: They still have repo consumers and tests today.
   - What's unclear: Whether those consumers are strategic survivors or temporary bridge debt.
   - Recommendation: Treat deletion as conditional, not guaranteed. The plan should allow relocation-first or defer deletion if live consumers remain.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node `tsx --test` |
| Config file | `package.json` |
| Quick run command | `npx tsx --test tests/plugin-assembly-smoke.test.ts tests/plugin-runtime.test.ts tests/runtime-hook-hierarchy.test.ts tests/runtime-tools.test.ts tests/runtime-authority-live-sanity.test.ts -x` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| P11-01 | `chat.message` no longer emits runtime context | unit | `npx tsx --test tests/plugin-assembly-smoke.test.ts -x` | ✅ |
| P11-02 | `experimental.chat.system.transform` removed as context emitter | unit | `npx tsx --test tests/plugin-assembly-smoke.test.ts -x` | ✅ |
| P11-03 | one cached snapshot is reused across hook work in a turn | unit | `npx tsx --test tests/plugin-runtime.test.ts -x` | ✅ rewrite needed |
| P11-04 | one unified `<hivemind context_version="v1">` packet is emitted | unit | `npx tsx --test tests/prompt-packet-compiler.test.ts tests/plugin-runtime.test.ts -x` | ✅ rewrite needed |
| P11-05 | compaction still receives authoritative context | integration | `npx tsx --test tests/runtime-authority-live-sanity.test.ts -x` | ✅ likely expand |
| P11-06 | dead orchestration files are removed only after consumer proof | unit | `npx tsx --test tests/runtime-tools.test.ts tests/runtime-hook-hierarchy.test.ts -x` | ✅ replace with new consumer-proof tests |
| P11-07 | preserved tools/runtime entry paths still work after flattening | integration | `npx tsx --test tests/runtime-entry-contract.test.ts tests/control-plane-runtime-tools.test.ts tests/schema-kernel-contracts.test.ts -x` | ✅ |

### Sampling Rate
- **Per task commit:** targeted `npx tsx --test ... -x` for the files touched by that subtask
- **Per wave merge:** `npm run typecheck:core && npm test`
- **Phase gate:** `npm run typecheck:core && npm test` must be green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] Rewrite `tests/plugin-runtime.test.ts` so it proves flattened runtime behavior instead of `createPluginRuntimePlan()` outputs.
- [ ] Rewrite `tests/plugin-assembly-smoke.test.ts` to assert the new authoritative hook set rather than preserving deleted hook emitters.
- [ ] Replace `tests/runtime-hook-hierarchy.test.ts` with direct-plugin helper tests if wrapper layers are deleted.
- [ ] Replace `tests/runtime-tools.test.ts` surface-registry assertions with consumer-proof or preserved-boundary assertions.
- [ ] Add a focused test that proves `loadRuntimeBindingsSnapshot(directory)` is read once per turn by the flattened plugin assembly.
- [ ] Add a focused test that proves the single unified `<hivemind context_version="v1">` packet carries the required fields and no duplicate packet family remains.

## Sources

### Primary (HIGH confidence)
- Repo authority: `/Users/apple/hivemind-plugin/.planning/phases/11-runtime-context-detox-and-plugin-flattening/11-CONTEXT.md` - locked Phase 11 decisions, deletion candidates, and preserved boundaries
- Repo authority: `/Users/apple/hivemind-plugin/src/plugin/opencode-plugin.ts` - current hook registrations and repeated snapshot loading points
- Repo evidence: `/Users/apple/hivemind-plugin/src/plugin/runtime-plan.ts` - current orchestration object responsibilities
- Repo evidence: `/Users/apple/hivemind-plugin/src/shared/runtime-invocation.ts`, `/Users/apple/hivemind-plugin/src/shared/turn-output.ts`, `/Users/apple/hivemind-plugin/src/shared/lifecycle-spine.ts` - current conditional deletion candidates with live consumers
- Repo evidence: `/Users/apple/hivemind-plugin/tests/plugin-runtime.test.ts`, `/Users/apple/hivemind-plugin/tests/plugin-assembly-smoke.test.ts`, `/Users/apple/hivemind-plugin/tests/runtime-hook-hierarchy.test.ts`, `/Users/apple/hivemind-plugin/tests/runtime-tools.test.ts` - current false-confidence baseline candidates
- Official docs: `https://opencode.ai/docs/plugins/index` - plugin structure, official hook examples, and compaction hook behavior (last updated 2026-03-19)
- npm registry: `npm view @opencode-ai/plugin version time.modified` and `npm view @opencode-ai/sdk version time.modified` - current published package versions

### Secondary (MEDIUM confidence)
- GitHub issue: `https://github.com/anomalyco/opencode/issues/17100` - strong upstream evidence that `experimental.chat.system.transform` mutations are discarded by runtime; issue is closed as `not_planned`
- GitHub issue: `https://github.com/anomalyco/opencode/issues/17820` - upstream evidence that `experimental.chat.messages.transform` had compaction-trigger gaps in `1.2.27`

### Tertiary (LOW confidence)
- None. This research avoided unverified community posts and SEO articles.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - current package versions and official docs were verified on 2026-03-19
- Architecture: HIGH - recommendations are anchored in current repo consumers plus explicit Phase 11 boundary text
- Pitfalls: HIGH - pitfalls are backed by repo evidence and upstream OpenCode issue reports

**Research date:** 2026-03-19
**Valid until:** 2026-04-18
