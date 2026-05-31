---
phase: P44-tool-intelligence-capability-layer
plan: 02
type: execute
wave: 2
depends_on: ["P44-01"]
files_modified:
  - .hivefiver-meta-builder/agents-lab/active/refactoring/hm-l0-orchestrator/hm-l0-orchestrator.md
  - .hivefiver-meta-builder/agents-lab/active/refactoring/hm-l1-coordinator/hm-l1-coordinator.md
  - .hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-*/hm-l2-*.md
  - .opencode/agents/hm-l0-orchestrator.md
  - .opencode/agents/hm-l1-coordinator.md
  - .opencode/agents/hm-l2-*/hm-l2-*.md
autonomous: true
requirements:
  - REQ-P44-02
  - REQ-P44-03
must_haves:
  truths:
    - "All 31 hm-* agents declare tools: in frontmatter (non-empty, all entries valid tool names)"
    - "11 orphaned tools are assigned to at least one agent category"
    - "Every registered tool from src/plugin.ts appears in >=1 agent's tools: list"
    - "Changes made in .hivefiver-meta-builder/ then reflected to .opencode/agents/"
  artifacts:
    - path: .hivefiver-meta-builder/agents-lab/active/refactoring/hm-l0-orchestrator/hm-l0-orchestrator.md
      provides: tools: declaration for L0 orchestrator
      contains: "tools:"
    - path: .hivefiver-meta-builder/agents-lab/active/refactoring/hm-l1-coordinator/hm-l1-coordinator.md
      provides: tools: declaration for L1 coordinator
      contains: "tools:"
    - path: .hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-*/hm-l2-*.md
      provides: tools: declarations for all 29 L2 agents
      contains: "tools:"
  key_links:
    - from: .hivefiver-meta-builder/agents-lab/active/refactoring/hm-*/*.md
      to: .opencode/agents/hm-*/*.md
      via: sync-assets.js copies source to deployed agents
      pattern: sync-assets
    - from: each agent's tools: field
      to: CapabilityGate.TOOL_CAPABILITY_MAP
      via: tool name must exist in capability map keys
      pattern: capability-gate
---

<objective>
Migrate all 31 hm-* agent frontmatter files from zero/nil tools: declarations to explicit tool allowlists, and assign the 11 orphaned tools to agent categories per the SPEC Appendix assignment plan. Source of truth is .hivefiver-meta-builder/; changes must be reflected to .opencode/agents/.
</objective>

<purpose>
REQ-P44-02 and REQ-P44-03 are data migration requirements — no new runtime logic. REQ-P44-02 ensures every hm-* agent declares its tool set so CapabilityGate.resolveToolsForAgent has authoritative input. REQ-P44-03 closes the orphaned tool gap by mapping 11 tools that appear in plugin.ts but nowhere in agent frontmatter or category routing. Both are prerequisites for REQ-P44-04 to produce meaningful allowlists.
</purpose>

<output>
All 31 hm-* agent .md files in .hivefiver-meta-builder/ updated with non-empty tools: declarations. 11 orphaned tools assigned per SPEC Appendix. .opencode/agents/ files synchronized via direct copy (not sync-assets.js run) to ensure atomic control. Verification script confirms zero orphaned tools remain.
</output>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-plan.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/P44-tool-intelligence-capability-layer/P44-SPEC.md
@.planning/phases/P44-tool-intelligence-capability-layer/RESEARCH.md
@.planning/REQUIREMENTS.md
@src/features/capability-gate/index.ts (created in P44-01)
</context>

<note>
Source-of-truth for agent frontmatter: `.hivefiver-meta-builder/agents-lab/active/refactoring/hm-*.md` → reflected to `.opencode/agents/`. All edits MUST target source-of-truth first, then copy to deployed path. Do NOT create agent files from scratch — UPDATE existing files only.
</note>

<tasks>
<task type="auto">
  <name>Task 1: Audit current hm-* agent frontmatter — identify which 30 agents lack tools: declarations</name>
  <files>
    .hivefiver-meta-builder/agents-lab/active/refactoring/hm-*/*.md
    .opencode/agents/hm-*/*.md
  </files>
  <read_first>
    @src/features/capability-gate/index.ts — TOOL_CAPABILITY_MAP keys to use as the validated tool name set
    @.planning/phases/P44-tool-intelligence-capability-layer/P44-SPEC.md lines 232-246 — Orphaned Tool Assignment Plan (exact mapping table)
    @.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l0-orchestrator/hm-l0-orchestrator.md — existing frontmatter to confirm current tools: state
    @.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l1-coordinator/hm-l1-coordinator.md — existing frontmatter
  </read_first>
  <action>
    Run two grep commands: (1) `grep -L '^tools:' .hivefiver-meta-builder/agents-lab/active/refactoring/hm-*/*.md` to list all source agents missing tools: field. (2) `grep -c '^tools:' .hivefiver-meta-builder/agents-lab/active/refactoring/hm-*/*.md` to count which already have it. Report the exact list of 30 missing agents + the 1 agent that already has tools:. Also grep for the 11 orphaned tool names across all agent frontmatter: `grep -l 'hivemind_sdk_supervisor\|hivemind_session_view\|hivemind_trajectory\|hivemind_pressure\|hivemind_doc\|hivemind_command_engine\|hivemind_agent_work_create\|hivemind_agent_work_export\|repomix' .hivefiver-meta-builder/agents-lab/active/refactoring/hm-*/*.md` — this confirms which agents already reference these tools in permission: blocks. Do NOT modify files in this task.
  </action>
  <verify>
    <automated>bash -c 'echo "Missing tools: $(grep -L "^tools:" .hivefiver-meta-builder/agents-lab/active/refactoring/hm-*/*.md 2>/dev/null | wc -l | tr -d " ")"; echo "Has tools: $(grep -c "^tools:" .hivefiver-meta-builder/agents-lab/active/refactoring/hm-*/*.md 2>/dev/null | grep -v ":0$" | wc -l | tr -d " ")"'</automated>
  </verify>
  <done>
    Audit output shows exactly 30 agents lacking tools: declarations, 1 agent with existing declaration. 11 orphaned tool references in permission: blocks identified for migration to tools: fields.
  </done>
</task>

<task type="auto">
  <name>Task 2: Write tools: declarations to all 31 hm-* source agents per SPEC Appendix mapping</name>
  <files>
    .hivefiver-meta-builder/agents-lab/active/refactoring/hm-l0-orchestrator/hm-l0-orchestrator.md
    .hivefiver-meta-builder/agents-lab/active/refactoring/hm-l1-coordinator/hm-l1-coordinator.md
    .hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-*/hm-l2-*.md
  </files>
  <read_first>
    @src/features/capability-gate/index.ts — TOOL_CAPABILITY_MAP keys: use ONLY these exact kebab-case names in tools: lists
    @.planning/phases/P44-tool-intelligence-capability-layer/P44-SPEC.md lines 232-246 — Orphaned Tool Assignment Plan (authoritative mapping)
    @.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l0-orchestrator/hm-l0-orchestrator.md — existing frontmatter structure (permission: field format) to mirror
  </read_first>
  <action>
    For each of the 31 hm-* agent .md files in .hivefiver-meta-builder/agents-lab/active/refactoring/, write or update the tools: frontmatter field. Rules: (1) If tools: already exists, update its value to match the SPEC Appendix mapping. (2) If tools: is missing, insert `tools:` after the permission: line (or as the last frontmatter field) with appropriate true/false values. (3) Use ONLY tool names that exist as keys in TOOL_CAPABILITY_MAP — never declare a tool not in the capability map (AC-02b). (4) SPEC Appendix assignments are authoritative for the 11 orphaned tools: hivemind_sdk_supervisor -> all hm-* agents (l0, l1, l2); hivemind_session_view -> hm-l0-orchestrator, hm-l1-coordinator; hivemind_trajectory -> hm-l0-orchestrator, hm-verifier; hivemind_pressure -> hm-l0-orchestrator; hivemind_doc -> hm-doc-writer, hm-verifier, hm-phase-researcher; hivemind_command_engine -> hm-l0-orchestrator, hm-l1-coordinator; hivemind_agent_work_create -> hm-l0-orchestrator, hm-planner; hivemind_agent_work_export -> hm-verifier, hm-shipper; repomix_* (repomix_pack_remote, repomix_grep_repomix_output, repomix_read_repomix_output) -> hm-codebase-mapper, hm-phase-researcher. (5) For agents not in the orphaned tool mapping, assign tools based on their role: orchestrators/coordinators get Govern + Delegate + Session + Config + read/write; l2 specialists get Session + Read + Write + their domain tools; verifier/shipper get Govern + Session + Read. (6) Format: `tools: { tool-name: true, another-tool: true }` — list only true entries (omit false entries). After all 31 source files are updated, copy the complete updated .md files to the matching paths in .opencode/agents/ (direct copy, do not run sync-assets.js).
  </action>
  <verify>
    <automated>bash -c 'echo "Source agents with tools:"; grep -c "^tools:" .hivefiver-meta-builder/agents-lab/active/refactoring/hm-*/*.md 2>/dev/null | grep -v ":0$" | wc -l | tr -d " "; echo "Deployed agents with tools:"; grep -c "^tools:" .opencode/agents/hm-*/*.md 2>/dev/null | grep -v ":0$" | wc -l | tr -d " "'</automated>
  </verify>
  <done>
    31 agents in .hivefiver-meta-builder/ have non-empty tools: declarations. 31 agents in .opencode/agents/ have matching tools: declarations. All declared tool names exist in TOOL_CAPABILITY_MAP. 11 orphaned tools are assigned to >=1 agent.
  </done>
</task>

<task type="auto">
  <name>Task 3: Verification — cross-check all declared tools against TOOL_CAPABILITY_MAP + confirm zero orphans</name>
  <files>
    .hivefiver-meta-builder/agents-lab/active/refactoring/hm-*/*.md
    .opencode/agents/hm-*/*.md
    src/features/capability-gate/index.ts
  </files>
  <read_first>
    @src/features/capability-gate/index.ts — TOOL_CAPABILITY_MAP keys (ground truth)
    @.planning/phases/P44-tool-intelligence-capability-layer/P44-SPEC.md lines 232-246 — Orphaned Tool Assignment Plan (rationale reference)
  </read_first>
  <action>
    Run a verification script that: (1) extracts all tool names from every tools: field in .hivefiver-meta-builder/agents-lab/active/refactoring/hm-*/*.md, (2) cross-references each name against TOOL_CAPABILITY_MAP keys in src/features/capability-gate/index.ts, (3) fails if any declared tool name is absent from the map (AC-02b violation), (4) confirms all 31 tools (24 harness + 7 built-in) appear in >=1 agent's tools: list, (5) confirms the 11 orphaned tools (hivemind_sdk_supervisor, hivemind_session_view, hivemind_trajectory, hivemind_pressure, hivemind_doc, hivemind_command_engine, hivemind_agent_work_create, hivemind_agent_work_export, repomix_pack_remote, repomix_grep_repomix_output, repomix_read_repomix_output) each appear in >=1 agent's tools: field (AC-03a). Also verify grep -c tool references in .opencode/agents/hm-*/*.md matches .hivefiver-meta-builder/ count, confirming sync. Report any mismatches. No file modifications in this task.
  </action>
  <verify>
    <automated>bash -c 'node -e "
      const fs = require("fs");
      const mapSrc = fs.readFileSync("src/features/capability-gate/index.ts","utf8");
      const mapKeys = [...mapSrc.matchAll(/\"([^\"]+)\":\s*\{/g)].map(m=>m[1]);
      const agents = fs.readdirSync(".hivefiver-meta-builder/agents-lab/active/refactoring/").filter(d=>d.startsWith("hm-"));
      let declared = new Set();
      let missing = [];
      for (const agent of agents) {
        const content = fs.readFileSync(`.hivefiver-meta-builder/agents-lab/active/refactoring/${agent}/${agent}.md`,"utf8");
        const match = content.match(/^tools:\s*\{(.+)\}/m);
        if (match) {
          const tools = match[1].split(",").map(t=>t.split(":")[0].trim().replace(/['\"]/g,""));
          for (const t of tools) {
            if (!mapKeys.includes(t)) missing.push(t);
            declared.add(t);
          }
        }
      }
      console.log("Declared unique tools:", declared.size);
      console.log("Missing from map:", missing.length, missing.slice(0,5));
      process.exit(missing.length > 0 ? 1 : 0);
    "</automated>
  </verify>
  <done>
    Verification script exits 0.     Declared unique tools >= 31 (24 harness + 7 built-in). Missing from map = 0. All 11 orphaned tools confirmed assigned. .opencode/agents/ count matches .hivefiver-meta-builder/ count.
  </done>
</task>
</tasks>

<threat_model>
## Trust Boundaries
| Boundary | Description |
|----------|-------------|
| .hivefiver-meta-builder/ -> .opencode/agents/ | Sync boundary: source-of-truth must propagate to deployment copy |
| agent frontmatter tools: -> CapabilityGate | Untrusted agent-declared tools filtered through TOOL_CAPABILITY_MAP before use |

## STRIDE Threat Register
| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-P44-04 | Tampering | Agent frontmatter tools: field contains invalid tool names | mitigate | CapabilityGate resolveToolsForAgent filters through TOOL_CAPABILITY_MAP.has(name) -- unknown names silently dropped (AC-02b enforced by verification script) |
| T-P44-05 | Elevation of Privilege | Agent declares tool it should not have | accept | CapabilityGate fallback returns READ_ONLY_TOOLS for unknown agents; only explicit role-matched agents get broader sets |
| T-P44-06 | Denial of Service | Sync drift between .hivefiver-meta-builder/ and .opencode/agents/ | mitigate | Plan uses direct copy (not sync-assets.js) to ensure atomic control; verification script checks both directories match |
| T-P44-SC | Tampering | npm/pip/cargo installs | mitigate | slopcheck + blocking human checkpoint for [ASSUMED]/[SUS] |
</threat_model>

<verification>
- grep -c '^tools:' .hivefiver-meta-builder/agents-lab/active/refactoring/hm-*/*.md | grep -v ':0$' | wc -l == 31
- grep -c '^tools:' .opencode/agents/hm-*/*.md | grep -v ':0$' | wc -l == 31
- Verification script exits 0 (zero tool names missing from TOOL_CAPABILITY_MAP)
- npm run typecheck -- clean
- All 11 orphaned tool names appear in >=1 agent tools: field
</verification>

<success_criteria>
REQ-P44-02 satisfied: 31/31 hm-* agents have non-empty tools: frontmatter field in both .hivefiver-meta-builder/ and .opencode/agents/. REQ-P44-03 satisfied: 11 orphaned tools assigned per SPEC Appendix, zero orphaned tools remain (AC-03a), assignment rationale documented by SPEC Appendix reference. AC-02a, AC-02b, AC-02c, AC-03a, AC-03b, AC-03c all verified.
</success_criteria>

<output>
Create .planning/phases/P44-tool-intelligence-capability-layer/P44-02-SUMMARY.md when done
</output>
