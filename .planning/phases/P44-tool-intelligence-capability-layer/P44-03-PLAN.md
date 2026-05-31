---
phase: P44-tool-intelligence-capability-layer
plan: 03
type: execute
wave: 3
depends_on: ["P44-01", "P44-02"]
files_modified:
  - src/coordination/spawner/spawn-request-builder.ts
  - src/coordination/delegation/sdk-child-session-starter.ts
  - tests/lib/spawner/spawn-request-builder.test.ts
  - tests/lib/delegation-manager.test.ts
autonomous: true
requirements:
  - REQ-P44-04
must_haves:
  truths:
    - "P44-03 covers SDK child-session prompt-time tools only"
    - "P44-03 does not claim native OpenCode task enforcement"
    - "resolveDelegationPermissionProfile calls CapabilityGate for agent baseline tools"
    - "SDK child sessions keep recursive native task and delegate-task disabled unless a future JIT grant changes that path"
    - "WRITE_CAPABLE_TOOLS remains only as last-resort fallback"
  artifacts:
    - path: src/coordination/spawner/spawn-request-builder.ts
      provides: SDK child-session permissionProfile seeded from CapabilityGate
      contains: "resolveToolsForAgent"
    - path: src/coordination/delegation/sdk-child-session-starter.ts
      provides: Explicit recursive task/delegate-task disabled prompt tools for SDK child sessions
      contains: "task: false"
    - path: tests/lib/spawner/spawn-request-builder.test.ts
      provides: Unit tests for SDK child-session capability resolution
  key_links:
    - from: src/coordination/spawner/spawn-request-builder.ts
      to: src/features/capability-gate/index.ts
      via: CapabilityGate resolves baseline tool set
      pattern: "resolveToolsForAgent"
    - from: src/coordination/delegation/sdk-child-session-starter.ts
      to: native task recursion policy
      via: prompt tools keep task disabled in SDK children
      pattern: "task: false"
---

<objective>
Wire CapabilityGate into SDK child-session spawn request construction without pretending this covers native OpenCode `task`. This plan governs the SDK child-session prompt tool allowlist path only. Native task event intelligence is owned by P44-04.
</objective>

<purpose>
SDK child sessions still need a bounded prompt-time tool set so Hivemind wrapper delegation does not fall back to the old 7-tool list. However, the user's primary requirement is native `task` intelligence. P44-03 must therefore be explicit about its boundary: it improves SDK child-session allowlists and preserves recursive task safety, but it is not the native task governance solution.
</purpose>

<output>
`resolveDelegationPermissionProfile()` consults CapabilityGate and produces deterministic SDK child-session tools. Recursive `task` and `delegate-task` stay disabled in SDK child sessions unless later JIT grant logic is deliberately added. Tests prove both the capability resolution and recursive delegation ceiling.
</output>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-plan.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/P44-tool-intelligence-capability-layer/P44-SPEC.md
@.planning/phases/P44-tool-intelligence-capability-layer/P44-02-PLAN.md
@src/features/capability-gate/index.ts
@src/coordination/spawner/spawn-request-builder.ts
@src/coordination/delegation/sdk-child-session-starter.ts
@tests/lib/spawner/spawn-request-builder.test.ts
</context>

<tasks>
<task type="auto">
  <name>Task 1: Integrate CapabilityGate into SDK spawn request builder</name>
  <files>
    src/coordination/spawner/spawn-request-builder.ts
  </files>
  <read_first>
    @src/features/capability-gate/index.ts -- profile-backed CapabilityGate from P44-02
    @src/coordination/spawner/spawn-request-builder.ts -- existing resolveDelegationPermissionProfile and toolsFromAgentMetadata
  </read_first>
  <action>
    Update `resolveDelegationPermissionProfile()` so it can use CapabilityGate as an additive baseline for SDK child sessions. Preserve existing OpenCode primitive metadata handling as a compatibility input, but do not describe it as the Hivemind authority. Filter all output tools through `TOOL_CAPABILITY_MAP`. Keep `WRITE_CAPABLE_TOOLS` as last-resort fallback only.
  </action>
  <verify>
    <automated>npm run typecheck</automated>
  </verify>
  <done>
    SDK child-session permissionProfile uses CapabilityGate and rejects unknown tool names.
  </done>
</task>

<task type="auto">
  <name>Task 2: Preserve recursive delegation ceiling in SDK child sessions</name>
  <files>
    src/coordination/delegation/sdk-child-session-starter.ts
    tests/lib/delegation-manager.test.ts
  </files>
  <read_first>
    @src/coordination/delegation/sdk-child-session-starter.ts -- buildDelegationPromptTools
    @tests/lib/delegation-manager.test.ts -- current assertions for task/delegate-task false
  </read_first>
  <action>
    Keep prompt tools with `task: false` and `delegate-task: false` for SDK child sessions. Add or update tests to state why: SDK child sessions do not self-spawn recursively unless a future ToolIntelligenceEngine JIT grant explicitly authorizes it.
  </action>
  <verify>
    <automated>npx vitest run tests/lib/delegation-manager.test.ts -t "delegate-task|task" --reporter=verbose</automated>
  </verify>
  <done>
    Tests prove SDK child sessions do not receive recursive native task or delegate-task access by default.
  </done>
</task>

<task type="auto">
  <name>Task 3: Add SDK allowlist regression tests</name>
  <files>
    tests/lib/spawner/spawn-request-builder.test.ts
  </files>
  <read_first>
    @tests/lib/spawner/spawn-request-builder.test.ts -- existing test patterns
  </read_first>
  <action>
    Add tests for orchestrator/coordinator baseline, L2 specialist baseline, unknown-agent fallback, and invalid tool filtering. Do not assert native `task` execution behavior here; that belongs to P44-04.
  </action>
  <verify>
    <automated>npx vitest run tests/lib/spawner/spawn-request-builder.test.ts --reporter=verbose</automated>
    <automated>npm run typecheck</automated>
  </verify>
  <done>
    SDK allowlist tests pass and do not claim native task governance coverage.
  </done>
</task>
</tasks>

<threat_model>
| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-P44-03-01 | Elevation of Privilege | SDK child-session prompt tools | mitigate | Filter output through TOOL_CAPABILITY_MAP and keep task/delegate-task disabled by default |
| T-P44-03-02 | Confused Deputy | Native task mistaken as covered by SDK path | mitigate | Plan and tests explicitly state native task is owned by P44-04 |
</threat_model>

<verification>
- `npx vitest run tests/lib/spawner/spawn-request-builder.test.ts --reporter=verbose`
- `npx vitest run tests/lib/delegation-manager.test.ts -t "delegate-task|task" --reporter=verbose`
- `npm run typecheck`
- Grep gate: P44-03-SUMMARY must include "SDK child-session only" and "native task covered by P44-04"
</verification>

<success_criteria>
REQ-P44-04 passes when SDK child-session prompt tools use CapabilityGate, recursive task/delegate-task remain disabled by default, and the plan makes no false claim that SDK spawning covers native OpenCode task governance.
</success_criteria>

<output>
Create `.planning/phases/P44-tool-intelligence-capability-layer/P44-03-SUMMARY.md` when done.
</output>
