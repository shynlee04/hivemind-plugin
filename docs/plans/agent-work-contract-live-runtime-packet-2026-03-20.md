# Agent-Work Contract Live Runtime Packet - 2026-03-20

## 1) `packet_name`

`active-session-contract-runtime-promotion`

## 2) `goal`

Promote the existing Agent-Work Contract from feature-local code into a live session surface by registering the create/export contract tools in the runtime plugin, synchronizing managed-tool governance, and exposing the latest session contract through runtime status so agents can create, inspect, and reuse contract state backed by `.hivemind/agent-work-contract/`.

## 3) `why_this_is_the_first_live_slice`

- The core persistence and compaction paths already exist, but agents cannot intentionally reach them because the contract tools are not registered in the runtime tool catalog.
- `create-contract` already classifies raw intent and already accepts workflow planning fields such as `planningPath` and `outlineRef`, so promoting it unlocks interactive planning artifact persistence without inventing a new schema.
- `export-contract` already emits either the full validated contract or the compaction-safe summary, which is the smallest bridge into hierarchy, delegation, and handoff flows.
- Extending runtime status with the latest session contract makes the surface discoverable and inspectable from the same agent-usable tool family instead of leaving the contract buried in feature-local storage.

## 4) `scope_in`

- `src/plugin/opencode-plugin.ts` - register `hivemind_agent_work_create_contract` and `hivemind_agent_work_export_contract`.
- `src/hooks/runtime-loader/tool-governance.ts` - add the promoted contract tools to the managed-tool set so permission and trajectory recording stay consistent.
- `src/tools/index.ts` - add the promoted tool ids to the authoritative agent tool catalog.
- `src/features/runtime-observability/status.ts` and `src/tools/runtime/types.ts` - surface a latest-session contract summary in `hivemind_runtime_status`.
- `tests/plugin-assembly-smoke.test.ts`, `tests/runtime-tools.test.ts`, and `tests/plugin-runtime.test.ts` - prove runtime registration, managed-tool synchronization, persistence, and visibility.
- Optional additive test file near runtime status if the payload addition needs focused schema assertions.

## 5) `scope_out`

- Do not redesign the Agent-Work schema, contract store, or intent engine.
- Do not add new slash commands, new agent markdown assets, or broad workflow-router changes.
- Do not promote `hivemind_agent_work_classify_intent` in this packet; `create-contract` already covers the first live creation path.
- Do not thread contract mutation through every existing tool yet; only expose the runtime surface and status bridge needed for first-class use.

## 6) `acceptance_criteria`

- `HiveMindPlugin` exposes `hivemind_agent_work_create_contract` and `hivemind_agent_work_export_contract` alongside the existing runtime tools with no duplicate hook or tool ids.
- Managed-tool governance and `agentToolCatalog` stay exactly synchronized with the plugin registration set after the promotion.
- An agent can call `hivemind_agent_work_create_contract` with `rawIntent` plus workflow fields such as `planningPath` and persist a validated contract under `.hivemind/agent-work-contract/`.
- `hivemind_runtime_status` returns a latest-session contract summary that at minimum includes `contractId`, `responseMode`, and planning/workflow summary fields sufficient to confirm the contract is live and attached.
- `hivemind_agent_work_export_contract` can return both the full validated contract and the compaction-safe summary for the stored contract.
- Plugin/runtime tests prove that a stored contract remains visible to compaction context and runtime status after creation.

## 7) `verification_commands`

- `npx tsx --test src/features/agent-work-contract/tools/create-contract-tool.test.ts src/features/agent-work-contract/tools/export-contract-tool.test.ts`
- `npx tsx --test tests/plugin-assembly-smoke.test.ts tests/runtime-tools.test.ts tests/plugin-runtime.test.ts`
- `npx tsc --noEmit`

## 8) `runtime_proof_expectations`

- Local proof: plugin assembly tests show the two contract tools are registered, managed, and collision-free.
- Local proof: a test invokes `hivemind_agent_work_create_contract`, verifies the JSON file exists in `.hivemind/agent-work-contract/`, then verifies `hivemind_runtime_status` reports that contract and `hivemind_agent_work_export_contract` can read it back.
- Local proof: compaction still emits the contract summary from the same persisted record after the runtime promotion.
- Live proof target: in a real OpenCode-loaded plugin session, an agent can create a contract, inspect it through `hivemind_runtime_status`, and export it without touching files directly.

## 9) `implementation_risks`

- Promoting new managed tools changes permission auto-allow and trajectory recording behavior, so the three authorities must be updated together or runtime governance will drift.
- Runtime status payload expansion can break consumers if the new contract summary is not additive and optional.
- Sessions with multiple contracts need a stable “latest active contract” rule; use the existing `updatedAt` sort to avoid introducing new arbitration logic.
- If the packet also tries to wire task or handoff mutation in the same cycle, it stops being bounded and becomes a broader workflow redesign.
