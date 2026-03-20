# Agent-Work Contract Plan 03 Corrected - 2026-03-20

## Scope

- Plan 03 only: verified hook/tool integration for Agent-Work Contract.
- Sequence stays strict: superpower skill gate -> TDD loop per task -> writing-plan execution -> subagent-driven execution after plan approval.
- No product implementation in this document.

## Verified Baseline

- `experimental.session.compacting` is already registered inline in `src/plugin/opencode-plugin.ts:187`, and Plan 03 implementation must extend that existing inline handler rather than introduce any new registration surface.
- `src/hooks/workflow-integration/workflow-continuity.ts:7` is helper-only and does not own hook registration.
- `src/hooks/event-handler.ts` is the existing authoritative `event` hook adapter and must remain the only root event handler surface.
- Tool implementations must follow official OpenCode execution-plane patterns: `tool.schema`, `ToolContext` fields (`sessionID`, `agent`, `directory`, `worktree`, `metadata`, `ask`), and `JSON.stringify(...)` return values.
- Existing managed tools (`hivemind_task`, `hivemind_trajectory`, `hivemind_handoff`) are authorities and must be integrated with, not duplicated.
- Schema-first is mandatory for every new packet, payload, and context extension.
- Runtime hook, emitter, folder, file, export, and tool-name conflicts must be audited before wiring changes.
- The authoritative context renderer currently lives at `src/plugin/context-renderer.ts`; `src/shared/context-renderer.ts` does not exist in the verified tree.

## Critical Corrections

- Do not claim `src/hooks/workflow-integration/workflow-continuity.ts` owns `session.compacting`; the inline handler in `src/plugin/opencode-plugin.ts` remains the single registration point.
- Do not create `src/features/agent-work-contract/hooks/event-handler.ts`; use `src/features/agent-work-contract/hooks/agent-work-event-handler.ts` and compose it through `src/hooks/event-handler.ts`.
- Do not create a second `experimental.session.compacting` registration anywhere.
- Do not bypass schema validation for context packets, compaction payloads, or tool payloads.
- Do not extend nonexistent `src/shared/context-renderer.ts`; only touch `src/plugin/context-renderer.ts` if the packet shape is validated and collision-free.
- Do not register or treat a new tool as managed until synchronization is completed across `src/plugin/opencode-plugin.ts`, `src/hooks/runtime-loader/tool-governance.ts`, and `src/tools/index.ts`.

## Task Sequence

### Task 1 - Folder/File Audit and Runtime Conflict Audit

**Goal:** verify authoritative surfaces, names, and collision risks before any create/modify step.

**Files to inspect**

- `src/plugin/opencode-plugin.ts`
- `src/hooks/event-handler.ts`
- `src/hooks/index.ts`
- `src/hooks/workflow-integration/workflow-continuity.ts`
- `src/hooks/runtime-loader/tool-governance.ts`
- `src/tools/index.ts`
- `src/plugin/context-renderer.ts`
- `src/features/agent-work-contract/index.ts`
- `src/features/agent-work-contract/schema/index.ts`

**Bite-sized steps**

- Confirm there is exactly one `event` root hook owner and exactly one inline `experimental.session.compacting` registration.
- Confirm the audit record explicitly preserves `src/plugin/opencode-plugin.ts:187` as the sole compaction authority and `src/hooks/workflow-integration/workflow-continuity.ts:7` as helper-only.
- Confirm target feature paths do not already exist: `src/features/agent-work-contract/hooks/agent-work-event-handler.ts`, `src/features/agent-work-contract/hooks/compaction-preservation.ts`, `src/features/agent-work-contract/tools/create-contract-tool.ts`, `src/features/agent-work-contract/tools/classify-intent-tool.ts`, `src/features/agent-work-contract/tools/export-contract-tool.ts`.
- Confirm no current tool ids or barrel exports collide with planned Agent-Work Contract tool ids.
- Confirm any planned managed tool addition carries a three-authority synchronization checklist covering `src/plugin/opencode-plugin.ts`, `src/hooks/runtime-loader/tool-governance.ts`, and `src/tools/index.ts`.
- Record the authoritative renderer correction: use `src/plugin/context-renderer.ts`, not `src/shared/context-renderer.ts`.
- Freeze the verified integration list in the execution notes before writing tests or modules.

**Gates**

- Conflict audit evidence captured from file/path and hook/tool-name inspection.
- `npx tsc --noEmit`
- Runtime conflict check: grep for `experimental.session.compacting`, `createEventHandler`, and managed tool ids to confirm uniqueness.

### Task 2 - Add Feature Event Helper and Unit Tests

**Goal:** create an Agent-Work Contract event helper without shadowing the root event hook.

**Files**

- `src/features/agent-work-contract/hooks/agent-work-event-handler.ts`
- `src/features/agent-work-contract/hooks/agent-work-event-handler.test.ts`
- `src/features/agent-work-contract/hooks/index.ts`
- `src/features/agent-work-contract/index.ts`

**Bite-sized TDD steps**

- Write a failing unit test for the helper contract: accepted event inputs, schema-validated packet extraction, and no direct hook registration side effects.
- Implement the helper with schema-first parsing only after the failing test is in place.
- Add/export the feature hook barrel without adding a second root `event-handler.ts`.
- Keep integration deferred until the plugin wiring task.

**Gates**

- `npx tsx --test src/features/agent-work-contract/hooks/agent-work-event-handler.test.ts`
- `npx tsc --noEmit`
- Schema validation gate: helper tests must assert parsing through existing Agent-Work Contract schemas or approved schema extensions.
- Runtime conflict check: re-audit that `src/hooks/event-handler.ts` remains the sole root event hook entry.

### Task 3 - Add Compaction Preservation Helper and Unit Tests

**Goal:** isolate contract-preservation logic for compaction while keeping the SDK hook inline in plugin assembly.

**Files**

- `src/features/agent-work-contract/hooks/compaction-preservation.ts`
- `src/features/agent-work-contract/hooks/compaction-preservation.test.ts`
- `src/features/agent-work-contract/schema/contract.ts` (only if packet preservation needs additive validated fields)
- `src/features/agent-work-contract/schema/index.ts` (only if schema exports change)

**Bite-sized TDD steps**

- Write a failing unit test that defines the preserved contract packet shape and rejects invalid or partial payloads.
- Add the smallest schema-first helper needed to derive compaction-safe contract context.
- Keep the helper pure and reusable so `src/plugin/opencode-plugin.ts` can call it without creating a second hook owner.
- Update schema exports only if a new additive contract-preservation shape is required.

**Gates**

- `npx tsx --test src/features/agent-work-contract/hooks/compaction-preservation.test.ts`
- `npx tsc --noEmit`
- Schema validation gate: all preserved payloads parse cleanly through the feature schema surface.
- Runtime conflict check: grep confirms there is still one `experimental.session.compacting` registration after helper creation.

### Task 4 - Extend the Authoritative Context Renderer Only If Validated

**Goal:** add contract fields to the injected context only if the packet shape is proven valid and non-conflicting.

**Files**

- `src/plugin/context-renderer.ts`
- `src/plugin/context-renderer.test.ts`
- `src/features/agent-work-contract/schema/contract.ts` (only if additive packet fields need schema authority)

**Bite-sized TDD steps**

- First write a failing renderer test for any new Agent-Work Contract context field.
- Validate the packet shape against schema authority before touching the renderer.
- Extend `src/plugin/context-renderer.ts` only if the new fields do not collide with existing packet keys or downstream parsing rules.
- If validation fails or collisions appear, stop here and leave the renderer unchanged.

**Gates**

- `npx tsx --test src/plugin/context-renderer.test.ts`
- `npx tsc --noEmit`
- Schema validation gate: renderer additions must be backed by explicit schema parsing, not ad hoc string assembly.
- Runtime conflict check: packet field-name audit proves no duplicate or ambiguous context keys.

### Task 5 - Update Plugin Assembly and Existing Root Hook Wiring

**Goal:** extend the existing inline compaction path and authoritative event hook wiring without collisions.

**Files**

- `src/plugin/opencode-plugin.ts`
- `src/hooks/event-handler.ts`
- `tests/plugin-assembly-smoke.test.ts`
- `tests/plugin-runtime.test.ts`

**Bite-sized TDD steps**

- Start with failing assembly tests that assert one `event` hook, one inline `experimental.session.compacting` hook, and the expected Agent-Work Contract wiring points.
- Add composition into `src/hooks/event-handler.ts` only through imports/calls to the new feature helper.
- Extend the existing inline compaction handler in `src/plugin/opencode-plugin.ts:187`; do not register a second compaction hook.
- Run the runtime hook/emitter collision audit again immediately before saving plugin changes.

**Gates**

- `npx tsx --test tests/plugin-assembly-smoke.test.ts tests/plugin-runtime.test.ts`
- `npx tsc --noEmit`
- Schema validation gate: plugin wiring must consume only schema-validated helper outputs.
- Runtime conflict check: one `event` binding, one `experimental.session.compacting` binding, and no duplicate emitter/tool registrations.

### Task 6 - Add Official-SDK Agent-Work Contract Tools and Unit Tests

**Goal:** add the three Plan 03 tools using official SDK patterns only.

**Files**

- `src/features/agent-work-contract/tools/create-contract-tool.ts`
- `src/features/agent-work-contract/tools/create-contract-tool.test.ts`
- `src/features/agent-work-contract/tools/classify-intent-tool.ts`
- `src/features/agent-work-contract/tools/classify-intent-tool.test.ts`
- `src/features/agent-work-contract/tools/export-contract-tool.ts`
- `src/features/agent-work-contract/tools/export-contract-tool.test.ts`
- `src/features/agent-work-contract/tools/index.ts`
- `src/features/agent-work-contract/schema/contract.ts` (if create/export payloads need additive fields)
- `src/features/agent-work-contract/schema/intent.ts` (if classify payloads need additive fields)
- `src/features/agent-work-contract/schema/delegation.ts` (if export payloads extend handoff shape)

**Bite-sized TDD steps**

- Run an SDK-interface audit before registration: verify import pattern, `tool.schema`, `ToolContext` field usage, `context.metadata()`, `context.ask()`, and `JSON.stringify(...)` output shape against existing runtime tools and official SDK contract.
- Write failing unit tests for each tool factory covering schema validation, context usage, and JSON-stringified payload output.
- Implement each tool by delegating to existing Agent-Work Contract engine/schema authorities rather than duplicating `hivemind_task`, `hivemind_trajectory`, or `hivemind_handoff` behavior.
- Keep tool ids collision-free with `src/hooks/runtime-loader/tool-governance.ts` and `src/tools/index.ts`.
- If any new tool becomes a managed first-class runtime tool, synchronize the change across all three authorities: `src/plugin/opencode-plugin.ts`, `src/hooks/runtime-loader/tool-governance.ts`, and `src/tools/index.ts` before the task can pass.

**Gates**

- `npx tsx --test src/features/agent-work-contract/tools/create-contract-tool.test.ts src/features/agent-work-contract/tools/classify-intent-tool.test.ts src/features/agent-work-contract/tools/export-contract-tool.test.ts`
- `npx tsc --noEmit`
- Schema validation gate: all tool args/results parse through the feature schema surface before serialization.
- SDK gate: tests must prove `tool.schema` usage, `ToolContext` field consumption, and `JSON.stringify(...)` returns.
- Runtime conflict check: planned tool ids do not overlap with the managed-tool set unless intentionally added with audited wiring.

### Task 7 - Hook/Tool Barrels and Final Integration Gates

**Goal:** finish exports and run Plan 03 end-to-end integration gates.

**Files**

- `src/features/agent-work-contract/hooks/index.ts`
- `src/features/agent-work-contract/tools/index.ts`
- `src/features/agent-work-contract/index.ts`
- `src/tools/index.ts` (only if root tool export is required for plugin assembly)
- `src/hooks/runtime-loader/tool-governance.ts` (only if new tool ids become managed and the audit approves it)
- `tests/plugin-assembly-smoke.test.ts`
- `tests/runtime-tools.test.ts`
- `tests/plugin-runtime.test.ts`

**Bite-sized TDD steps**

- Add or update failing integration tests for final export visibility and registered tool availability.
- Export the new feature hooks/tools through feature barrels first, then root barrels only where assembly requires it.
- Update managed-tool governance only if the new tool ids are intentionally first-class runtime tools, the conflict audit passes, and the three-authority synchronization rule is completed across `src/plugin/opencode-plugin.ts`, `src/hooks/runtime-loader/tool-governance.ts`, and `src/tools/index.ts`.
- Finish with a final schema sync/validation pass and full runtime collision audit.

**Gates**

- `npx tsx --test tests/plugin-assembly-smoke.test.ts tests/runtime-tools.test.ts tests/plugin-runtime.test.ts`
- `npx tsc --noEmit`
- Schema validation gate: all additive exports resolve through the authoritative schema barrel without drift.
- Runtime conflict check: no duplicate hooks, no duplicate tool ids, no shadowed barrel exports, no folder/file-name collisions.

## SDK Interface Audit Checklist

- Verify all new tool factories use `tool.schema` for every argument.
- Verify each new tool consumes official `ToolContext` fields: `sessionID`, `agent`, `directory`, `worktree`, `metadata`, and `ask` where mutation requires permission.
- Verify each new tool returns `JSON.stringify(...)` rather than raw objects.
- Verify execution-plane code imports from the plugin SDK surface only.
- Verify plugin assembly stays assembly-only and does not absorb feature business logic.

## Runtime Conflict Checklist

- No second `experimental.session.compacting` registration.
- `experimental.session.compacting` authority stays inline at `src/plugin/opencode-plugin.ts:187` and is only extended there.
- `src/hooks/workflow-integration/workflow-continuity.ts:7` remains helper-only and never becomes hook authority.
- No new root `event-handler.ts` under the feature.
- No shadowing of `src/hooks/event-handler.ts`.
- No duplicate tool ids against `HIVEMIND_MANAGED_TOOLS` or `src/tools/index.ts` catalog entries.
- Any new managed tool is synchronized across `src/plugin/opencode-plugin.ts`, `src/hooks/runtime-loader/tool-governance.ts`, and `src/tools/index.ts`.
- No packet-key collisions in `src/plugin/context-renderer.ts`.
- No duplicate barrel exports that create ambiguous import paths.

## Exit Criteria

- Each task completes in sequence with its TDD, schema, typecheck, and runtime-collision gates passed.
- All tool/hook wiring is verified against existing authoritative integration points only.
- Any attempt to touch nonexistent or non-authoritative surfaces is rejected and corrected before implementation starts.
