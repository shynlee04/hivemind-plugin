---
phase: P44-tool-intelligence-capability-layer
plan: 03
type: execute
wave: 2
depends_on: ["P44-01"]
files_modified:
  - src/coordination/spawner/spawn-request-builder.ts
  - tests/lib/spawner/spawn-request-builder.test.ts
autonomous: true
requirements:
  - REQ-P44-04
must_haves:
  truths:
    - "resolveDelegationPermissionProfile calls capabilityGate.resolveToolsForAgent(agentName) when agent metadata is available"
    - "Delegation to agent with declared tools produces exactly those tools (no more, no less)"
    - "Delegation to agent without declared tools produces category-based defaults"
    - "WRITE_CAPABLE_TOOLS constant is retained as ultimate fallback, not primary source"
    - "Change is <= 80 LOC in spawn-request-builder.ts"
    - "All existing delegation tests pass unmodified"
  artifacts:
    - path: src/coordination/spawner/spawn-request-builder.ts
      provides: resolveDelegationPermissionProfile wired to CapabilityGate resolveToolsForAgent
      contains: "resolveToolsForAgent"
    - path: tests/lib/spawner/spawn-request-builder.test.ts
      provides: Unit tests for capability-aware permission resolution covering AC-04a through AC-04e
      min_lines: 10
  key_links:
    - from: src/coordination/spawner/spawn-request-builder.ts
      to: src/features/capability-gate/index.ts
      via: import CapabilityGate + resolveToolsForAgent call inside resolveDelegationPermissionProfile
      pattern: import.*capability-gate.*index
    - from: resolveDelegationPermissionProfile
      to: WRITE_CAPABLE_TOOLS
      via: WRITE_CAPABLE_TOOLS used only when both explicitTools and capabilityTools are empty -- ultimate fallback
      pattern: WRITE_CAPABLE_TOOLS
---

<objective>
Wire CapabilityGate into resolveDelegationPermissionProfile so the spawner resolves the effective tool set from the capability gate (additive to existing toolsFromAgentMetadata), with WRITE_CAPABLE_TOOLS as the ultimate fallback. This closes the 18-tool visibility gap at the delegation boundary (REQ-P44-04).
</objective>

<purpose>
REQ-P44-04 is the primary wiring requirement. Currently spawn-request-builder.ts resolves tools from WRITE_CAPABLE_TOOLS (7 items) via toolsFromAgentMetadata, which means 18 of 31 harness tools are invisible at the delegation boundary. This plan makes the capability gate an additive resolution layer: toolsFromAgentMetadata handles permission: deny logic; CapabilityGate.resolveToolsForAgent contributes the full 31-tool classification; WRITE_CAPABLE_TOOLS remains as the last-resort fallback when both return empty.
</purpose>

<output>
src/coordination/spawner/spawn-request-builder.ts updated with CapabilityGate integration in resolveDelegationPermissionProfile. Net change <= 80 LOC. All existing delegation tests pass unmodified. 4 new test cases added covering AC-04a through AC-04e.
</output>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-plan.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/P44-tool-intelligence-capability-layer/P44-SPEC.md
@.planning/phases/P44-tool-intelligence-capability-layer/RESEARCH.md
@src/features/capability-gate/index.ts (created in P44-01)
@src/coordination/spawner/spawn-request-builder.ts
@tests/lib/spawner/spawn-request-builder.test.ts
</context>

<tasks>
<task type="auto">
  <name>Task 1: Add CapabilityGate import + integrate resolveToolsForAgent into resolveDelegationPermissionProfile</name>
  <files>
    src/coordination/spawner/spawn-request-builder.ts
  </files>
  <read_first>
    @src/features/capability-gate/index.ts -- exported CapabilityGate class and resolveToolsForAgent signature to import
    @src/coordination/spawner/spawn-request-builder.ts -- current resolveDelegationPermissionProfile (lines 73-85), toolsFromAgentMetadata (lines 87-122), WRITE_CAPABLE_TOOLS constant (line 29), READ_ONLY_TOOLS constant (line 28)
    @.planning/phases/P44-tool-intelligence-capability-layer/RESEARCH.md -- Pattern 2 code example (lines 188-222) showing the additive merge approach
  </read_first>
  <action>
    Modify src/coordination/spawner/spawn-request-builder.ts:
    1. Add import: `import { CapabilityGate, TOOL_CAPABILITY_MAP } from "../../features/capability-gate/index.js";`
    2. Instantiate a module-level CapabilityGate singleton AFTER the constants block (after line 31, before the function definitions): `const capabilityGate = new CapabilityGate();`
    3. Modify resolveDelegationPermissionProfile (lines 73-85) to add capability resolution as an additive layer:
       - After computing `explicitTools = toolsFromAgentMetadata(agent)`, compute `capabilityTools = agent?.name ? capabilityGate.resolveToolsForAgent(agent.name) : undefined`
       - Replace lines 79-84 with a merge that combines explicitTools (from frontmatter), capabilityTools (from capability gate), and intentTools (review-only heuristic) into a single deduplicated array. Filter ALL entries through TOOL_CAPABILITY_MAP.has() to reject any tool name not in the capability map.
       - If the merged result is empty, fall back to WRITE_CAPABLE_TOOLS (per AC-04c: last-resort fallback).
       - Keep `toolsFromAgentMetadata` unchanged -- it handles permission: deny logic which must be preserved.
       - Add a local helper `mergeToolSets(sets: (readonly string[] | undefined)[]): string[]` that uses a Set to deduplicate, filters through TOOL_CAPABILITY_MAP.has(), and returns WRITE_CAPABLE_TOOLS if the Set is empty.
    4. Net added/modified code in this file must be <= 80 LOC. Do NOT delete WRITE_CAPABLE_TOOLS, READ_ONLY_TOOLS, toolsFromAgentMetadata, isReviewOnlyTask, or isPermissionAllowed/isPermissionDenied helpers (AC-04e: existing tests must pass unmodified).
  </action>
  <verify>
    <automated>npm run typecheck 2>&1 | tail -10</automated>
  </verify>
  <done>
    `npm run typecheck` exits 0. resolveDelegationPermissionProfile now calls capabilityGate.resolveToolsForAgent. WRITE_CAPABLE_TOOLS remains in the file as a fallback constant. Net LOC change <= 80 lines.
  </done>
</task>

<task type="auto">
  <name>Task 2: Add unit tests for capability-aware permission resolution (AC-04a through AC-04e)</name>
  <files>
    tests/lib/spawner/spawn-request-builder.test.ts
  </files>
  <read_first>
    @tests/lib/spawner/spawn-request-builder.test.ts -- existing test patterns and describe blocks to determine where to insert new tests
    @src/coordination/spawner/spawner-types.ts -- DelegationSpawnRequest type and permissionProfile shape
    @src/features/capability-gate/index.ts -- TOOL_CAPABILITY_MAP keys to use in test assertions
  </read_first>
  <action>
    Add 5 new test cases to tests/lib/spawner/spawn-request-builder.test.ts:
    1. "AC-04a: agent with tools: declaration produces exactly those tools" -- call resolveDelegationPermissionProfile with agent = { name: "test-agent", tools: { "delegate-task": true, "hivemind-session-view": true } }, assert result.tools includes "delegate-task" and "hivemind-session-view" AND the built-in tools from WRITE_CAPABLE_TOOLS that are in TOOL_CAPABILITY_MAP. Assert result.tools does NOT include tools not declared by the agent and not in WRITE_CAPABLE_TOOLS (e.g., "hivemind-pressure" should not appear if not declared).
    2. "AC-04b: agent without tools: declaration gets category-based defaults" -- call resolveDelegationPermissionProfile with agent = { name: "unknown-agent" } (no tools field), assert result.tools contains only tools that CapabilityGate returns for "unknown-agent" role (read-only: read, glob, grep). Assert result.tools does NOT contain harness tools like "delegate-task".
    3. "AC-04c: WRITE_CAPABLE_TOOLS is ultimate fallback when both explicit and capability tools are empty" -- call resolveDelegationPermissionProfile with agent = { name: "empty-tools-agent", tools: {} }, assert result.tools includes WRITE_CAPABLE_TOOLS items.
    4. "AC-04d: change is within 80 LOC budget" -- run `git diff --stat src/coordination/spawner/spawn-request-builder.ts` or `wc -l` before/after; assert net added lines <= 80. (This test can be a bash command in the test file or a separate verification step.)
    5. "AC-04e: existing delegation tests pass unmodified" -- this is verified by running the full test suite; add a comment-only test case noting this requirement is enforced by the full-suite run in Task 3.
    Run ONLY the new tests first to confirm they pass: `npx vitest run tests/lib/spawner/spawn-request-builder.test.ts -t "capability" --reporter=verbose`.
  </action>
  <verify>
    <automated>npx vitest run tests/lib/spawner/spawn-request-builder.test.ts -t "capability" --reporter=verbose 2>&1 | tail -10</automated>
  </verify>
  <done>
    All 5 new capability-related test cases pass. The pattern "capability" matches all new tests by name.
  </done>
</task>

<task type="auto">
  <name>Task 3: Full regression run -- confirm zero existing test failures introduced by change</name>
  <files>
    src/coordination/spawner/spawn-request-builder.ts
    tests/lib/spawner/spawn-request-builder.test.ts
  </files>
  <read_first>
    @tests/lib/spawner/spawn-request-builder.test.ts -- run full file to check for regressions in existing tests
  </read_first>
  <action>
    Run the full spawn-request-builder test suite: `npx vitest run tests/lib/spawner/spawn-request-builder.test.ts --reporter=verbose 2>&1 | tail -20`. Confirm that ALL tests pass (new and existing). If any existing test fails, investigate: the failure must be due to the capability gate integration (not a pre-existing bug). Fix by adjusting the merge logic to preserve backward compatibility. Also run: `bash -c 'wc -l src/coordination/spawner/spawn-request-builder.ts'` and compare to the pre-change baseline (read the file at the start of this task, record the line count, then compare after modifications). If net change > 80 LOC, refactor to merge helper to reduce LOC.
  </action>
  <verify>
    <automated>npx vitest run tests/lib/spawner/spawn-request-builder.test.ts --reporter=verbose 2>&1 | grep -E "(PASS|FAIL)" | tail -5</automated>
    <automated>bash -c 'wc -l src/coordination/spawner/spawn-request-builder.ts'</automated>
  </verify>
  <done>
    Full spawn-request-builder test suite passes (0 failures). LOC increase <= 80 lines from pre-phase baseline. AC-04e satisfied: all existing delegation tests pass unmodified.
  </done>
</task>

<task type="auto">
  <name>Task 4: End-to-end verification -- spawn agent with declared tools and verify delegation allowlist</name>
  <files>
    src/coordination/spawner/spawn-request-builder.ts
    src/features/capability-gate/index.ts
    tests/lib/spawner/spawn-request-builder.test.ts
  </files>
  <read_first>
    @tests/lib/spawner/spawn-request-builder.test.ts -- full test file to understand existing integration test patterns
    @src/coordination/spawner/spawn-request-builder.ts -- buildSdkSpawnRequest function that calls resolveDelegationPermissionProfile
  </read_first>
  <action>
    Add an integration test to tests/lib/spawner/spawn-request-builder.test.ts (or create a new tests/features/capability-gate/spawner-integration.test.ts) that verifies the end-to-end flow: (1) Create a mock agent with name "hm-l0-orchestrator" and tools: { "hivemind-command-engine": true }, (2) Call buildSdkSpawnRequest with this agent, (3) Assert the returned DelegationSpawnRequest.permissionProfile.tools includes "hivemind-command-engine" AND "read" AND "edit" (built-ins from WRITE_CAPABLE_TOOLS), (4) Assert the result does NOT include "hivemind-pressure" if the agent did not declare it. (5) Call buildSdkSpawnRequest with agent = { name: "hm-l2-codebase-mapper" } (no tools: field), assert result.tools does not include harness-specific tools like "delegate-task". Run: `npx vitest run tests/lib/spawner/spawn-request-builder.test.ts --reporter=verbose`.
  </action>
  <verify>
    <automated>npx vitest run tests/lib/spawner/spawn-request-builder.test.ts --reporter=verbose 2>&1 | tail -8</automated>
  </verify>
  <done>
    All tests pass including the new e2e integration test. AC-04a, AC-04b, AC-04c all verified with concrete test evidence.
  </done>
</task>
</tasks>

<threat_model>
## Trust Boundaries
| Boundary | Description |
|----------|-------------|
| agent frontmatter -> spawn-request-builder | Untrusted agent metadata produces permission profile for child session |
| CapabilityGate -> spawn-request-builder | Trusted tool resolution must not return tools outside TOOL_CAPABILITY_MAP |

## STRIDE Threat Register
| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-P44-07 | Elevation of Privilege | Malformed tools: frontmatter grants excessive tools | mitigate | resolveDelegationPermissionProfile filters merged tool set through TOOL_CAPABILITY_MAP.has(name) before returning -- unknown names excluded |
| T-P44-08 | Tampering | Spawn request permissionProfile manipulation | accept | Permission profile is consumed only by OpenCode SDK delegation at spawn time -- no persistence or cross-session carry |
| T-P44-09 | Denial of Service | CapabilityGate lookup failure at delegation time | accept | Fallback to WRITE_CAPABLE_TOOLS is hardcoded in the merge helper -- lookup failure degrades gracefully to existing behavior |
| T-P44-SC | Tampering | npm/pip/cargo installs | mitigate | slopcheck + blocking human checkpoint for [ASSUMED]/[SUS] |
</threat_model>

<verification>
- npx vitest run tests/lib/spawner/spawn-request-builder.test.ts -- all tests pass (new + existing)
- git diff --stat src/coordination/spawner/spawn-request-builder.ts OR wc -l diff -- net change <= 80 LOC
- npm test -- zero new failures beyond the 4 pre-existing delegation-status/session-journal-export failures
- npm run typecheck -- clean
- grep -c "resolveToolsForAgent" src/coordination/spawner/spawn-request-builder.ts -- >= 1 (confirm integration exists)
- grep -c "WRITE_CAPABLE_TOOLS" src/coordination/spawner/spawn-request-builder.ts -- >= 1 (confirm fallback retained)
</verification>

<success_criteria>
REQ-P44-04 fully implemented and verified: resolveDelegationPermissionProfile consults CapabilityGate.resolveToolsForAgent as an additive layer before falling back to category defaults and WRITE_CAPABLE_TOOLS. AC-04a: agent with declared tools gets exactly those tools (verified by test). AC-04b: agent without declared tools gets category defaults (verified by test). AC-04c: WRITE_CAPABLE_TOOLS is last-resort fallback (verified by test + grep). AC-04d: change <= 80 LOC (verified by wc -l). AC-04e: all existing delegation tests pass unmodified (verified by full test suite run). All 31 tools (24 harness + 7 built-in) are now visible at the delegation boundary for the first time.
</success_criteria>

<output>
Create .planning/phases/P44-tool-intelligence-capability-layer/P44-03-SUMMARY.md when done
</output>
