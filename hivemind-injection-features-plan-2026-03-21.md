# Plan: HiveMind Injection Features — TurnHierarchy, ToolPrecedence, WorkflowStyleAdaptive

**Generated**: 2026-03-21

## Overview

Implement 3 new context injection features that extend the existing SDK hook infrastructure (`messages.transform`, `command.execute.before`, `session.compacting`) to provide richer runtime context to the agent. All features are additive — existing behavior is preserved.

## Prerequisites

- OpenCode SDK at `.repo-sdkpacked/opencode-api-sdk.xml`
- Existing hooks verified at `src/plugin/opencode-plugin.ts` lines 143-164, 170, 210-221
- Existing `context-renderer.ts` at `src/plugin/context-renderer.ts`
- Existing `CompactionPreservationPacket` schema at `src/features/agent-work-contract/schema/contract.ts`

## Dependency Graph

| Wave | Tasks | Can Start When |
|------|-------|----------------|
| 1 | T1 (schema), T2 (schema2) | Immediately |
| 2 | T3, T4, T9 | T1, T2 complete |
| 3 | T5, T7, T10 | T3, T4, T9 complete |
| 4 | T6, T8, T11 | T5, T7, T10 complete |
| 5 | T12 (final-verification) | T6, T8, T11 complete |

---

## Tasks

### T1: Define TurnHierarchyContext Schema
- **depends_on**: []
- **location**: `src/plugin/context-renderer.ts`
- **description**: Add `TurnHierarchyContext` interface with fields: `parent_turn_id?: string`, `turn_depth: number`, `turn_type: 'root' | 'delegation' | 'handoff' | 'checkpoint' | 'correction'`, `sibling_count: number`, `pending_parent?: string`, `trajectory_path: string[]`
- **validation**: TypeScript compiles, interface has all fields
- **status**: Not Completed
- **files edited/created**: `src/plugin/context-renderer.ts`

### T2: Define ToolPrecedenceChain Schema
- **depends_on**: []
- **location**: `src/plugin/context-renderer.ts`
- **description**: Add `ToolPrecedenceEntry` interface with `tool`, `action`, `args`, and `ToolPrecedenceChain` interface with `chain: ToolPrecedenceEntry[]`, `mandatory_reads: {path: string, reason: string}[]`
- **validation**: TypeScript compiles, schema defined
- **status**: Not Completed
- **files edited/created**: `src/plugin/context-renderer.ts`

### T3: Implement TurnHierarchyContext Renderer
- **depends_on**: [T1]
- **location**: `src/plugin/context-renderer.ts`, `src/plugin/opencode-plugin.ts`
- **description**: Extend `renderHivemindContext` to support rendering `<hivemind-turn-hierarchy>` block. Add `renderTurnHierarchy(packet: TurnHierarchyContext): string` function. Modify `messages.transform` hook at line 170 to inject turn hierarchy block.
- **validation**: Existing tests pass, new render output parses correctly
- **status**: Not Completed
- **files edited/created**: `src/plugin/context-renderer.ts`, `src/plugin/opencode-plugin.ts`

### T4: Implement ToolPrecedenceContract Renderer
- **depends_on**: [T2]
- **location**: `src/plugin/context-renderer.ts`, `src/plugin/opencode-plugin.ts`
- **description**: Extend `command.execute.before` block (line 143) to include structured `tool_precedence` JSON array and `mandatory_reads` array instead of flat advisory strings. Add `renderToolPrecedence(chain: ToolPrecedenceChain): string` function.
- **validation**: Existing tests pass, command context block has structured JSON
- **status**: Not Completed
- **files edited/created**: `src/plugin/context-renderer.ts`, `src/plugin/opencode-plugin.ts`

### T5: Write TurnHierarchyContext Tests
- **depends_on**: [T3]
- **location**: `tests/unit/context-renderer/turn-hierarchy.test.ts`
- **description**: Create TDD tests for TurnHierarchyContext rendering. Test all turn_types, depth rendering, trajectory_path serialization, parent_turn_id handling.
- **validation**: All tests pass with `npx tsx --test`
- **status**: Not Completed
- **files edited/created**: `tests/unit/context-renderer/turn-hierarchy.test.ts`

### T6: Write TurnHierarchyContext Integration Test
- **depends_on**: [T5]
- **location**: `tests/integration/turn-hierarchy-integration.test.ts`
- **description**: Create integration test that simulates messages.transform hook call and verifies turn hierarchy block is prepended to lastUserMessage.parts
- **validation**: Integration test passes
- **status**: Not Completed
- **files edited/created**: `tests/integration/turn-hierarchy-integration.test.ts`

### T7: Write ToolPrecedenceContract Tests
- **depends_on**: [T4]
- **location**: `tests/unit/context-renderer/tool-precedence.test.ts`
- **description**: Create TDD tests for ToolPrecedenceChain rendering. Test chain serialization, mandatory_reads, parsing verification.
- **validation**: All tests pass with `npx tsx --test`
- **status**: Not Completed
- **files edited/created**: `tests/unit/context-renderer/tool-precedence.test.ts`

### T8: Write ToolPrecedenceContract Integration Test
- **depends_on**: [T7]
- **location**: `tests/integration/tool-precedence-integration.test.ts`
- **description**: Create integration test that simulates command.execute.before hook call and verifies structured tool_precedence JSON is in output.parts
- **validation**: Integration test passes
- **status**: Not Completed
- **files edited/created**: `tests/integration/tool-precedence-integration.test.ts`

### T9: Implement WorkflowStyleAdaptiveOutput Renderer
- **depends_on**: [T1]
- **location**: `src/plugin/context-renderer.ts`, `src/plugin/opencode-plugin.ts`
- **description**: Create workflow-style-aware renderers: `renderTDDCompaction()`, `renderBMADCompaction()`, `renderResearchCompaction()`, `renderDefaultCompaction()`. Detect workflow style from `purposeClass` or `workflowPhase`. Modify `session.compacting` hook at line 210 to call style-aware renderer instead of generic renderHivemindContext.
- **validation**: Existing tests pass, different output per workflow style
- **status**: Not Completed
- **files edited/created**: `src/plugin/context-renderer.ts`, `src/plugin/opencode-plugin.ts`

### T10: Write WorkflowStyleAdaptiveOutput Tests
- **depends_on**: [T9]
- **location**: `tests/unit/context-renderer/workflow-style.test.ts`
- **description**: Create TDD tests for workflow-style-aware rendering. Test TDD style output format, BMAD style output format, research style output format, default fallback.
- **validation**: All tests pass with `npx tsx --test`
- **status**: Not Completed
- **files edited/created**: `tests/unit/context-renderer/workflow-style.test.ts`

### T11: Write WorkflowStyleAdaptiveOutput Integration Test
- **depends_on**: [T10]
- **location**: `tests/integration/workflow-style-integration.test.ts`
- **description**: Create integration test that simulates session.compacting hook call with different purposeClass values and verifies correct style-specific output.
- **validation**: Integration test passes
- **status**: Not Completed
- **files edited/created**: `tests/integration/workflow-style-integration.test.ts`

### T12: Final TypeScript Verification
- **depends_on**: [T6, T8, T11]
- **location**: All modified files
- **description**: Run `npx tsc --noEmit` and `npm test` to verify all 3 features compile and pass tests together.
- **validation**: `npx tsc --noEmit` passes, `npm test` passes
- **status**: Not Completed
- **files edited/created**: All

---

## Testing Strategy

- **Unit tests**: Test individual render functions with mock data
- **Integration tests**: Test hook-level behavior with simulated SDK input/output
- **TDD cycle**: Red (test fails) → Green (minimal implementation) → Refactor
- **SDK contract tests**: Verify hook signatures match `.repo-sdk-packed/opencode-api-sdk.xml`

## Feature Output Formats

### TurnHierarchyContext Output:
```xml
<hivemind-turn-hierarchy>
turn_depth=2
turn_type=delegation
parent_turn_id="msg_parent_123"
sibling_count=1
trajectory_path=["traj_xyz","wf_main","tsh_001","sub_002"]
pending_parent=none
</hivemind-turn-hierarchy>
```

### ToolPrecedenceContract Output:
```xml
<hivemind-command-context>
command=hm-implement
trajectory=traj_xyz
workflow=wf_main
task_ids=tsk_001,tsk_002
execution_rule=tool-precedence-chain
tool_precedence=[
  {"tool":"hivemind_doc","action":"read","args":{"filePath":"task_plan.md"}},
  {"tool":"hivemind_task","action":"list"}
]
mandatory_reads=[
  {"path":".hivemind/task_plan.md","reason":"current_work_scope"}
]
</hivemind-command-context>
```

### WorkflowStyleAdaptiveOutput (TDD example):
```xml
<hivemind-compaction workflow_style='tdd'>
last_test_status=failing
last_test_file='src/utils.test.ts'
test_count_run=14
test_count_pass=12
next_action=write_implementation_to_pass_failing_test
recent_anchors=['test_write:2026-03-21T10:00:00Z']
pending_task_ids=['tsk_009']
</hivemind-compaction>
```

---

## Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| messages.transform hook modification breaks existing context | Low | High | Extensive integration tests, never modify existing field rendering |
| Breaking changes to HivemindContextPacket | Low | Medium | Additive only, never remove fields |
| Workflow style detection inaccurate | Medium | Low | Default fallback always works |
| Tool precedence parsing by LLM unpredictable | Medium | Medium | Use structured JSON array format the LLM can reliably parse |

---

## Architecture Notes

- All new interfaces are `internal-only` (not exported from package public API)
- Render functions are pure: input → string output, no side effects
- Hook modifications preserve existing behavior, only extend output
- Schema kernel authority remains at `src/schema-kernel/` for any new persisted contracts
