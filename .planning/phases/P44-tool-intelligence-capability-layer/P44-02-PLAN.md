---
phase: P44-tool-intelligence-capability-layer
plan: 02
type: execute
wave: 2
depends_on: ["P44-01"]
files_modified:
  - src/features/capability-gate/index.ts
  - src/features/capability-gate/types.ts
  - src/features/capability-gate/agent-capability-profiles.ts
  - tests/features/capability-gate/capability-map.test.ts
autonomous: true
requirements:
  - REQ-P44-02
  - REQ-P44-03
must_haves:
  truths:
    - "Native OpenCode task is represented as a first-class Delegate capability"
    - "Hivemind capability seed profiles are programmatic source, not OpenCode permission: or deprecated tools: authority"
    - "No plan task adds permission: deny or relies on deny/ask/allow as the intelligence plane"
    - "Every capability-map tool is assigned to at least one Hivemind seed profile"
    - "Unknown agents retain read-only fallback with contextual guidance"
  artifacts:
    - path: src/features/capability-gate/agent-capability-profiles.ts
      provides: Programmatic static seed profiles for Hivemind-owned tool intelligence
      contains: "task"
    - path: src/features/capability-gate/index.ts
      provides: CapabilityGate seeded from Hivemind profiles and native task in TOOL_CAPABILITY_MAP
      contains: "TOOL_CAPABILITY_MAP"
    - path: tests/features/capability-gate/capability-map.test.ts
      provides: Coverage tests proving native task and zero orphaned capability-map tools
  key_links:
    - from: src/features/capability-gate/agent-capability-profiles.ts
      to: src/features/capability-gate/index.ts
      via: CapabilityGate resolves from Hivemind seed profiles
      pattern: "AGENT_CAPABILITY_PROFILES"
    - from: native OpenCode task
      to: ToolCategory.Delegate
      via: task is the primary subagent dispatch path
      pattern: "[\"task\""
---

<objective>
Replace the deprecated frontmatter `tools:` migration plan with a Hivemind-owned static capability seed layer. The seed layer is programmatic, testable, and independent of OpenCode's native `permission:` plane. It gives CapabilityGate a durable baseline while leaving final runtime decisions to the ToolIntelligenceEngine in P44-04.
</objective>

<purpose>
The previous P44-02 plan was invalid because it treated `tools:` as the capability authority and implied that OpenCode `permission:` could encode Hivemind intelligence. The user explicitly rejected that model. P44-02 now creates static Hivemind seed profiles only: they answer "which tools are generally relevant for this role?" They do not answer "is this tool correct right now?" Runtime correctness is owned by P44-04.
</purpose>

<output>
CapabilityGate has native `task` in the capability map and resolves role baseline tools from Hivemind seed profiles. All tool names in every profile exist in `TOOL_CAPABILITY_MAP`. Zero orphaned tools remain. No `.opencode/agents/**` or `.hivefiver-meta-builder/**` agent files are modified by this plan.
</output>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-plan.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/P44-tool-intelligence-capability-layer/P44-SPEC.md
@.planning/phases/P44-tool-intelligence-capability-layer/RESEARCH.md
@src/features/capability-gate/index.ts
@src/features/capability-gate/types.ts
@tests/features/capability-gate/capability-map.test.ts
</context>

<tasks>
<task type="auto">
  <name>Task 1: Add native task to the capability map</name>
  <files>
    src/features/capability-gate/index.ts
    tests/features/capability-gate/capability-map.test.ts
  </files>
  <read_first>
    @src/features/capability-gate/index.ts -- current TOOL_CAPABILITY_MAP, READ_ONLY_TOOLS, WRITE_CAPABLE_TOOLS, resolveToolsForAgent
    @tests/features/capability-gate/capability-map.test.ts -- current expectations for built-ins and tool count
  </read_first>
  <action>
    Add `task` to `TOOL_CAPABILITY_MAP` with category `ToolCategory.Delegate`, source `built-in`, and a description that identifies it as OpenCode's native subagent dispatch tool. Do not add `task` to `WRITE_CAPABLE_TOOLS`; SDK child sessions remain controlled separately in P44-03. Update tests to expect native task as first-class capability-map coverage.
  </action>
  <verify>
    <automated>npx vitest run tests/features/capability-gate/capability-map.test.ts --reporter=verbose</automated>
  </verify>
  <done>
    Native task is present in TOOL_CAPABILITY_MAP and classified as Delegate. Tests prove the total capability-map tool count includes task.
  </done>
</task>

<task type="auto">
  <name>Task 2: Create Hivemind agent capability seed profiles</name>
  <files>
    src/features/capability-gate/agent-capability-profiles.ts
    src/features/capability-gate/index.ts
    src/features/capability-gate/types.ts
  </files>
  <read_first>
    @src/features/capability-gate/index.ts -- existing role heuristic in resolveToolsForAgent
    @src/features/capability-gate/types.ts -- ToolCategory and exported types
  </read_first>
  <action>
    Create a small programmatic seed profile map. Suggested shape: `{ id, match, categories, tools, rationale }`. Include profiles for front-facing orchestrators/coordinators, L2 implementation specialists, verifier/auditor/reviewer agents, research/doc agents, hf meta-builder agents, and unknown fallback. The profile data must not reference OpenCode `permission:` or deprecated `tools:`. It may use role/name matchers only as bootstrap classification until stronger metadata exists.
  </action>
  <verify>
    <automated>npm run typecheck</automated>
  </verify>
  <done>
    Capability seed profiles compile and are imported by CapabilityGate without circular dependencies.
  </done>
</task>

<task type="auto">
  <name>Task 3: Resolve tools from seed profiles and prove zero orphaned tools</name>
  <files>
    src/features/capability-gate/index.ts
    tests/features/capability-gate/capability-map.test.ts
  </files>
  <read_first>
    @src/features/capability-gate/agent-capability-profiles.ts -- profile structure and mapping
    @src/features/capability-gate/index.ts -- CapabilityGate implementation
  </read_first>
  <action>
    Replace the hardcoded role branching inside `resolveToolsForAgent()` with profile-based resolution. Add tests that iterate all seed profile tools and fail if any tool is missing from `TOOL_CAPABILITY_MAP`. Add tests that every capability-map tool is covered by at least one seed profile. Keep unknown agents read-only.
  </action>
  <verify>
    <automated>npx vitest run tests/features/capability-gate/capability-map.test.ts --reporter=verbose</automated>
    <automated>npm run typecheck</automated>
  </verify>
  <done>
    Zero orphaned capability-map tools remain, native task included. Unknown agents still resolve to read-only baseline.
  </done>
</task>
</tasks>

<threat_model>
| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-P44-02-01 | Elevation of Privilege | Static seed profiles over-grant tools | mitigate | Seed profiles are baseline only; P44-04 ToolIntelligenceEngine performs JIT runtime decisions |
| T-P44-02-02 | Tampering | Profile references unknown tool | mitigate | Tests fail when profile tool is absent from TOOL_CAPABILITY_MAP |
| T-P44-02-03 | Denial of Service | Native task treated like unrestricted recursive delegation | mitigate | P44-02 only classifies native task; P44-04 blocks recursive task unless JIT grant exists |
</threat_model>

<verification>
- `npx vitest run tests/features/capability-gate/capability-map.test.ts --reporter=verbose`
- `npm run typecheck`
- Grep gate: `grep -R "^tools:" .planning/phases/P44-tool-intelligence-capability-layer/P44-02-PLAN.md` returns no dependency on deprecated tools frontmatter
- Grep gate: no new `permission: deny` is introduced by this plan
</verification>

<success_criteria>
REQ-P44-02 and REQ-P44-03 pass when CapabilityGate has native `task`, Hivemind seed profiles cover every capability-map tool, no profile tool is invalid, unknown agents remain read-only, and no OpenCode-native permission plane is treated as the source of Hivemind tool intelligence.
</success_criteria>

<output>
Create `.planning/phases/P44-tool-intelligence-capability-layer/P44-02-SUMMARY.md` when done.
</output>
