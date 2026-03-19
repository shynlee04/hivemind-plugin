# Phase 11 Consumer Proof Matrix

Generated: 2026-03-19
Plan: 11-06
Scope: Conditional deletion targets named in `11-CONTEXT.md`

This matrix records current repo-evidence consumers before any Phase 11 cleanup deletes or relocates runtime-context layers. Import consumers are taken from `src/**` and `tests/**` references; historical docs are noted only when they explain why a target is still planned.

## Classification Legend

- `delete-now` - no live `src/**` or `tests/**` import consumer remains; later plan still must prove the zero-consumer command below.
- `relocate-first` - live consumers remain, but the surviving owner is already known and imports should move before deletion.
- `keep-for-preserved-boundary` - current phase boundary still preserves this surface as a live authority seam.
- `defer` - current consumers exist, but the final survivor owner is not yet narrow enough to delete in 11-01.
- `deleted` - zero-consumer proof was re-run and the target was removed in a later Phase 11 cleanup plan.

## Conditional Target Matrix

| Target | Current import consumers (`src/**`, `tests/**`) | Runtime registration path | Classification | Survivor owner / relocation destination | Zero-consumer proof required before delete |
| --- | --- | --- | --- | --- | --- |
| `src/plugin/runtime-plan.ts` | None after Plan 11-06; plugin assembly now builds route hints and context packets directly, tests no longer import the plan object, and the package barrel exports only `HiveMindPlugin` | None | `deleted` | Surviving plugin-owned behavior stays in `src/plugin/opencode-plugin.ts`, `src/plugin/context-renderer.ts`, and `src/plugin/route-hint.ts` | Completed in Plan 11-06 via `rg -n "runtime-plan|createPluginRuntimePlan|buildRouteReminder" src tests` |
| `src/plugin/surface-registry.ts` | None after Plan 11-06; registry-only tests were already removed and the package barrel exports only `HiveMindPlugin` | None | `deleted` | No survivor needed; flattened plugin surface exposes the plugin entry instead of a synthetic registry | Completed in Plan 11-06 via `rg -n "surface-registry|createRuntimeSurfaceRegistry" src tests` |
| `src/plugin/create-core-hooks.ts` | None after Plan 11-06; no preserved runtime path still consumes synthetic hook descriptors | None | `deleted` | No survivor needed; hook registration lives directly in `src/plugin/opencode-plugin.ts` | Completed in Plan 11-06 via `rg -n "create-core-hooks|createCoreHooks" src tests` |
| `src/plugin/plugin-types.ts` | None after Plan 11-06; all types were only used by the deleted plugin-plan family | None | `deleted` | No survivor needed; preserved contracts already live with their feature or shared owners | Completed in Plan 11-06 via `rg -n "plugin-types|PluginRuntime(Input|Plan|Response)|RuntimeSurfaceEntry|HookDescriptor|RuntimeEntryKernelContract" src tests` |
| `src/shared/runtime-invocation.ts` | `src/features/runtime-entry/command.ts`; `src/commands/slash-command/command-types.ts`; `tests/lifecycle-spine.test.ts`; `tests/schema-kernel-contracts.test.ts`; plus `src/shared/index.ts` barrel | No plugin hook registers it directly; runtime-entry command flow imports it as a preserved record contract | `keep-for-preserved-boundary` | Keep under `src/features/runtime-entry/invocation.ts` via the current shared re-export until preserved runtime-entry consumers are intentionally moved | `rg -n "runtime-invocation" src tests` shows only approved preserved-boundary consumers, or the shared re-export is removed after those imports move |
| `src/shared/turn-output.ts` | `src/features/runtime-entry/command.ts`; `src/commands/slash-command/command-types.ts`; `tests/lifecycle-spine.test.ts`; `tests/schema-kernel-contracts.test.ts`; plus `src/shared/index.ts` barrel | No plugin hook registers it directly; runtime-entry command flow uses it for turn export projection | `keep-for-preserved-boundary` | Keep in `src/shared/turn-output.ts` unless a later plan moves turn-export ownership into one preserved feature module | `rg -n "turn-output|TurnExportProjectionV1|createTurnOutputEnvelope|createTurnOutputProjection" src tests` shows no remaining preserved-boundary consumer before delete |
| `src/shared/lifecycle-spine.ts` | `src/shared/entry-kernel-state.ts`; `src/shared/turn-output.ts`; `src/features/runtime-entry/invocation.ts`; plus `src/shared/index.ts` barrel | No plugin hook registers it directly; shared lifecycle identities still back entry/runtime/turn records | `keep-for-preserved-boundary` | Keep in `src/shared/lifecycle-spine.ts` while entry-kernel, runtime-invocation, and turn-output stay decomposed | `rg -n "lifecycle-spine|create(EntryKernel|RuntimeInvocation|TurnOutput)Lifecycle" src tests` shows no preserved lifecycle consumer before delete |
| `src/hooks/runtime-bridge/` | `src/plugin/surface-registry.ts` (bridge wrappers only) | Surface-registry publishes bridge metadata, but preserved command-flow consumers now import `src/features/runtime-entry/instruction-loader.ts` directly | `defer` | `src/hooks/runtime-bridge/instruction-loader.ts` is delete-ready once Plan 11-06 removes the remaining `src/plugin/surface-registry.ts` consumer; no preserved control-plane or slash-command path still depends on the bridge shim | `rg -n "hooks/runtime-bridge/instruction-loader" src tests` returns no `src/**` or `tests/**` imports outside the deferred plugin-orchestration family |
| `src/hooks/context-injection/` | `src/plugin/runtime-plan.ts`; `src/hooks/runtime-bridge/context-injection-hook.ts` | No direct hook registration in `HiveMindPlugin`; only indirect plan/bridge plumbing | `defer` | Expected end state is deletion, but 11-01 must first remove `runtime-plan.ts` and bridge-only references | `rg -n "hooks/context-injection|buildContextInjectionPlan" src tests` returns no `src/**` or `tests/**` consumer lines |
| `src/hooks/prompt-transformation/` | `src/plugin/opencode-plugin.ts`; `src/plugin/messages-transform.ts`; `src/plugin/system-transform.ts`; `src/plugin/plugin-types.ts`; `src/hooks/runtime-bridge/prompt-transformation-hook.ts` | `HiveMindPlugin['experimental.chat.messages.transform']` depends on synthetic-part helpers; plugin adapters wrap `transformRuntimePrompt()` for both message and system packet families | `relocate-first` | Move surviving helpers (`createSyntheticPart`, `findLastUserMessage`, `getMessageText`, and any kept packet rendering seam) to `src/plugin/` or another final preserved owner, then delete wrappers | `rg -n "hooks/prompt-transformation|transformRuntimePrompt|createSyntheticPart|findLastUserMessage|getMessageText" src tests` returns no old-path imports |
| `src/plugin-handlers/` | `src/plugin/runtime-plan.ts`; `src/plugin/plugin-types.ts`; `src/hooks/auto-slash-command/auto-slash-command.ts`; `src/hooks/auto-slash-command/auto-slash-command-types.ts`; `src/index.ts` barrel | No direct plugin hook key points at this directory; current live use is routing/helper composition | `defer` | Decide in Plan 11-08 whether `resolveCommandBinding()` and related types stay as a minimal helper seam for `src/hooks/auto-slash-command/` or move into `src/plugin/`/`src/features/session-entry/` | `rg -n "plugin-handlers|buildPluginContext|resolveCommandBinding|PluginContext|CommandBinding" src tests` shows no remaining preserved consumer after the 11-08 decision |
| `src/hooks/start-work/purpose-classifier.ts` | None after Plan 11-10; only historical docs/plans reference the removed shim path | None | `deleted` | Feature-owned implementation lives in `src/features/session-entry/purpose-classifier.ts` | Completed in Plan 11-10 via `rg -n "hooks/start-work/purpose-classifier" src tests` |
| `src/hooks/start-work/lineage-router.ts` | None after Plan 11-10; only historical docs/plans reference the removed shim path | None | `deleted` | Feature-owned implementation lives in `src/features/session-entry/lineage-router.ts` | Completed in Plan 11-10 via `rg -n "hooks/start-work/lineage-router" src tests` |
| `src/hooks/start-work/readiness-gates.ts` | None after Plan 11-10; only historical docs/plans reference the removed shim path | None | `deleted` | Feature-owned implementation lives in `src/features/session-entry/readiness-gates.ts` | Completed in Plan 11-10 via `rg -n "hooks/start-work/readiness-gates" src tests` |
| `src/hooks/start-work/session-state.ts` | None after Plan 11-10; only historical docs/plans reference the removed shim path | None | `deleted` | Feature-owned implementation lives in `src/features/session-entry/session-state.ts` | Completed in Plan 11-10 via `rg -n "hooks/start-work/session-state" src tests` |
| `src/hooks/start-work/start-work-types.ts` | None after Plan 11-10; plugin, runtime-plan, plugin-handler, runtime-entry, and test consumers now import `src/features/session-entry/start-work-types.ts` directly | No plugin hook registers it directly; shim is no longer a preserved consumer path | `deleted` | Feature-owned authority lives in `src/features/session-entry/start-work-types.ts` | Completed in Plan 11-10 via `rg -n "hooks/start-work/start-work-types" src tests` |

## Notes By Family

- Plan 11-06 removed `runtime-plan.ts`, `surface-registry.ts`, `create-core-hooks.ts`, and `plugin-types.ts` after re-running zero-consumer proof and confirming the flattened plugin path no longer imports or exports them.
- Plan 11-06 also reduced `src/plugin/index.ts` and `src/index.ts` to export only `HiveMindPlugin` from the plugin assembly boundary.
- `runtime-bridge/instruction-loader.ts` is no longer needed by preserved control-plane or slash-command consumers after Plan 11-05; the remaining bridge dependency is the deferred plugin-orchestration family headed by `src/plugin/surface-registry.ts`.
- `prompt-transformation/` still touches the real plugin path today, so test rewrites must stop preserving the old wrapper hierarchy before later delete plans can land cleanly.
- Plan 11-10 removed all five `src/hooks/start-work/*` shim files after re-running zero-consumer proof.
- `start-work-types.ts` needed one more relocation pass before deletion: plugin, runtime-plan, plugin-handler, runtime-entry, and test consumers now import `src/features/session-entry/start-work-types.ts` directly.

## Evidence Commands Used

```bash
rg -n "runtime-plan|surface-registry|create-core-hooks|plugin-types|runtime-invocation|turn-output|lifecycle-spine|hooks/runtime-bridge|hooks/context-injection|hooks/prompt-transformation|hooks/start-work/(purpose-classifier|lineage-router|readiness-gates|session-state|start-work-types)|plugin-handlers" src tests
rg -n "hooks/prompt-transformation" src --glob "*.ts"
rg -n "hooks/context-injection" src --glob "*.ts"
rg -n "hooks/runtime-bridge" src --glob "*.ts"
rg -n "plugin-handlers" src --glob "*.ts"
rg -n "hooks/start-work/purpose-classifier|hooks/start-work/lineage-router|hooks/start-work/readiness-gates|hooks/start-work/session-state|hooks/start-work/start-work-types" src tests
```
