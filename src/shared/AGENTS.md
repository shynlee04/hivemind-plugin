# src/shared/ — Cross-Cutting Utilities

Common modules used across the plugin.

## Audit Findings (2026-03-15)

> [!NOTE]
> **`event-bus.ts` was REMOVED** in L1 cutover. The SDK `event` hook + `client.tui.publish()` + `client.event.subscribe()` provide the same pub/sub pattern. Do NOT recreate an EventBus — see Authority Principle.

> [!IMPORTANT]
> **`logging.ts` should augment with `client.app.log()`** for structured server-side logging that persists beyond console. Custom `log()` is fine for dev, but production should use the SDK.

## Files

| File | Status | Purpose |
|------|--------|---------|
| `paths.ts` | ✅ | Centralized path builders — `getHivemindPath()`, `getStatePath()` |
| `tool-response.ts` | ✅ | Standard `{status, message, data}` response format |
| `bootstrap-profile.ts` | ✅ | User profile normalization |
| `runtime-attachment.ts` | ✅ | Settings load/save + runtime bindings snapshot |
| `pressure-contract.ts` | ✅ | Pressure contract registry and resolution |
| `opencode-knowledge.ts` | ✅ | OpenCode-specific knowledge surfaces |
| `opencode-agent-registry.ts` | ✅ | Canonical agent parsing + OpenCode-safe runtime projection |
| `lifecycle-spine.ts` | ✅ | Shared lifecycle identities for entry, runtime invocation, and turn output |
| `logging.ts` | ⚠️ | Custom logger — supplement with `client.app.log()` |

## Registry Note

> [!NOTE]
> As of 2026-03-22, `opencode-agent-registry.ts` is a **read-only in-memory registry**. It no longer generates `.opencode/agents/**` projections. The registry provides agent metadata for internal use (capability matrix, validation) but does not write to the filesystem.
> Root `agents/*.deprecated.md` files are the canonical source for agent metadata.

## User-Space Governance

> [!IMPORTANT]
> **`.opencode/*` and `.hivemind/*` are user-side spaces.**
> - `.opencode/plugins/**` is written by `hm-init` and `hm-doctor` (plugin stub only)
> - `.hivemind/**` is created at bootstrap/init runtime
> - Any write operations to these directories MUST require explicit user consent via `context.ask()`
> - Agents must use the question tool and provide rationale before appending or overwriting files in these spaces

## Lifecycle Spine Rule

- `entry-kernel-state.ts` owns entry lifecycle state and release gating.
- `runtime-invocation.ts` owns provider-request lifecycle records and must never masquerade as entry state.
- `turn-output.ts` owns completed-turn lifecycle records and exports.
- Shared lifecycle identities must stay decomposed through `lifecycle-spine.ts`; do not collapse entry, runtime invocation, and turn into one monolithic type.

## Dedup Needed

`parseList()` and `render()` are duplicated in `tools/handoff/`, `tools/task/`, `tools/trajectory/`. Extract to `shared/tool-helpers.ts`.
