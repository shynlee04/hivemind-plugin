# Phase 1 Research: Runtime Authority Baseline

**Phase:** 1 - Runtime Authority Baseline  
**Date:** 2026-03-18  
**Requirements:** CTRL-01, CTRL-02  
**Question:** What does HiveMind need to change so runtime start and attach flows use one authoritative OpenCode runtime instead of split-brain local assumptions?

## Executive Summary

Phase 1 should introduce an explicit SDK-owned runtime authority seam instead of continuing to treat `runtime-attachment.json` plus plugin-local context as if they were the runtime itself. Current official OpenCode docs show two authoritative lifecycle entrypoints: `createOpencode()` starts a server and returns a client, while `createOpencodeClient({ baseUrl })` attaches to an already-running server. The repo already has attachment, status, and control-plane scaffolding, but it does not currently wire those scaffolds to a persisted runtime authority record tied to the official SDK lifecycle.

The safest route is a supervisor-first authority baseline. Add one explicit runtime identity contract to the existing attachment/supervisor/status surfaces, use `hm-init` to create or record a managed SDK runtime, and use attach-aware routing plus plugin `serverUrl` context to bind to an already-running runtime without creating a second one. This keeps the plugin assembly layer clean, preserves the control-plane boundary, and gives later phases a stable seam for status, proof, and recovery work.

## Primary Evidence

### Official OpenCode Sources

1. **SDK lifecycle authority**
   - `createOpencode()` starts both server and client.
   - `createOpencodeClient({ baseUrl })` connects to an existing running instance.
   - Source: [OpenCode SDK](https://opencode.ai/docs/sdk/) (checked 2026-03-18)

2. **Plugin/runtime authority**
   - Plugins are loaded by OpenCode and hooks run in load order.
   - Plugin context includes the SDK client and server URL; local plugin behavior should be attached to that runtime rather than inventing a second session/runtime truth.
   - Source: [OpenCode Plugins](https://opencode.ai/docs/plugins/) (checked 2026-03-18)

3. **Tool-governed mutation**
   - Custom tools should use `tool()` and `tool.schema` as the managed mutation boundary.
   - Source: [OpenCode Custom Tools](https://opencode.ai/docs/custom-tools/) (checked 2026-03-18)

### Local Repository Evidence

1. `src/shared/runtime-attachment.ts` persists profile/defaults/bindings, but today it does **not** persist a concrete SDK runtime identity such as runtime authority mode, runtime instance ID, or attached server base URL.
2. `src/control-plane/control-plane-handler.ts` performs `hm-init`/`hm-doctor`/`hm-harness` orchestration and writes attachment/projection artifacts, but it does not currently show a dedicated SDK lifecycle helper that owns runtime creation vs attachment.
3. `src/tools/runtime/tools.ts` already exposes `hivemind_runtime_status` and `hivemind_runtime_command`, making it the correct reporting/execution seam for runtime authority once the missing fields exist.
4. `src/hooks/sdk-context.ts` already caches `client`, `$`, and `serverUrl` from the real plugin context, which is strong evidence that attach semantics should be anchored to the live OpenCode runtime instead of local-only file state.
5. `src/control-plane/AGENTS.md` explicitly says `hm-harness` is readiness/diagnostic only and that future verification should exercise real OpenCode server/client flows.
6. There are no live Phase 1 code-path references to `createOpencode(` or `createOpencodeClient(` in the current worktree source, which supports the roadmap claim that authoritative runtime ownership still needs to be aligned.

## Options Considered

### Option 1: Supervisor-first SDK authority seam

Introduce a dedicated SDK runtime helper in the control plane, persist runtime authority fields in attachment state, surface them through supervisor/status, and teach attach routing to reuse active runtime context.

**Why this is best:** It matches the official SDK lifecycle directly, keeps control-plane and plugin responsibilities separate, and creates one additive source of truth that later phases can verify. It also works with the repo's current sector boundaries: control plane stays a thin adapter, plugin stays assembly-only, supervisor/status stay additive, and tools remain the mutation/reporting seam.

### Option 2: Control-plane-only patch

Keep everything inside `control-plane-handler.ts` and only add enough flags to decide whether `hm-init` or `hm-harness` should run.

**Why this is weaker:** It would reduce immediate ambiguity, but it would also make the control plane own more runtime truth than the repo's current architecture allows. That would create a local patch, not an authoritative baseline, and it would make later status/proof/recovery slices harder.

### Option 3: Plugin-context-only attach inference

Treat plugin `serverUrl` and cached SDK client as the runtime authority without persisting an explicit runtime authority record in the attachment/supervisor surfaces.

**Why this is weaker:** It helps attach flows inside a live plugin session, but it does not solve CLI-side `hm-init`/`hm-doctor`/`hm-harness` identity, nor does it give status/reporting a durable record. It would leave Phase 1 split between ephemeral plugin context and persistent local files.

## Recommended Phase 1 Decisions

1. Add explicit runtime authority fields to the attachment/supervisor/status seam.
   - Recommended concrete fields:
     - `runtimeAuthority: "managed-sdk" | "attached-sdk" | "none"`
     - `runtimeInstanceId: string | undefined`
     - `serverBaseUrl: string | undefined`

2. Create one SDK lifecycle helper owned by the control plane.
   - Managed path uses `createOpencode()`.
   - Attach path uses `createOpencodeClient({ baseUrl })`.

3. Keep plugin assembly clean.
   - `src/plugin/opencode-plugin.ts` should keep registering hooks/tools only.
   - Attach/runtime awareness belongs in `src/hooks/sdk-context.ts`, `src/plugin/runtime-plan.ts`, `src/shared/runtime-attachment.ts`, and `src/tools/runtime/tools.ts`.

4. Make `hivemind_runtime_status` the public inspection seam for Phase 1 truth.
   - Status must report authority mode, runtime instance ID, and attached server URL consistently.

5. Prevent implicit competing init.
   - If a live attached runtime already exists for the same authority context, route to attach/harness/resume guidance instead of silently bootstrapping another runtime.

## Phase 1 Plan Split

### 01-01: Establish authoritative runtime ownership and lifecycle entrypoints

Focus:
- Introduce SDK lifecycle helper and runtime identity fields.
- Persist managed-runtime authority into attachment/supervisor/status surfaces.
- Expose managed authority through runtime status.

### 01-02: Normalize attach semantics and prevent competing runtime instances

Focus:
- Use live plugin `serverUrl` and attach-aware routing to bind to existing runtime.
- Reconcile attach/route/status behavior around `attached-sdk`.
- Refuse or redirect competing bootstrap attempts when an attached runtime is already authoritative.

## Risks To Watch

1. **Control-plane bloat**
   - Do not let `control-plane-handler.ts` become the long-term supervisor.

2. **Plugin assembly leakage**
   - Do not move business logic back into `src/plugin/opencode-plugin.ts`.

3. **Status drift**
   - Do not expose new runtime authority fields in status unless they come from the same persisted authority source.

4. **Mock-only confidence**
   - Phase 1 can use unit/integration tests for the planning slice, but the roadmap still requires later live official-boundary proof.

## Canonical References

- `.planning/PROJECT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/research/SUMMARY.md`
- `.planning/research/STACK.md`
- `.planning/research/ARCHITECTURE.md`
- `src/control-plane/AGENTS.md`
- `src/plugin/AGENTS.md`
- `src/shared/runtime-attachment.ts`
- `src/control-plane/control-plane-handler.ts`
- `src/hooks/sdk-context.ts`
- `src/sdk-supervisor/runtime-status.ts`
- `src/tools/runtime/tools.ts`

## Source Links

- [OpenCode SDK](https://opencode.ai/docs/sdk/)
- [OpenCode Plugins](https://opencode.ai/docs/plugins/)
- [OpenCode Custom Tools](https://opencode.ai/docs/custom-tools/)

---

*Research completed: 2026-03-18*  
*Ready for planning: yes*
