---
sessionID: ses_1e99b195affetbGfs42YyehaEO
created: 2026-05-11T09:36:11.951Z
updated: 2026-05-11T09:36:11.951Z
parentSessionID: null
delegationDepth: 0
children: []
continuityIndex: session-continuity.json
status: active
---

## USER (turn 1)

You are a subagent tasked with adding/upgrading the IRON CLAW governance section in 7 engine, integration, and reference skills. You MUST read each SKILL.md, find the right insertion point, and add the standardized IRON CLAW block using the Edit tool.

## Files to Edit (in /Users/apple/hivemind-plugin-private/.opencode/skills/):

1. `hm-l3-hivemind-engine-contracts/SKILL.md` - Reference contracts for the harness engine. Has "## Overview" at line 18 and "## Plugin Load Order" at line 24. Read lines 1-30 to understand structure. Add the IRON CLAW block after "## Overview" and before "## Plugin Load Order" (as a new section between them).

2. `hm-l3-hivemind-state-reference/SKILL.md` - Reference for state structure. Has "## Overview" at line 18 and "## `.hivemind/` Directory Structure" at line 24. Read lines 1-25. Add the IRON CLAW block after "## Overview" and before "## `.hivemind/` Directory Structure".

3. `hm-l3-integration-contracts/SKILL.md` - Integration contracts between skills/agents. Has "## Overview" at line 39 and "## On Load" at line 45. Read around lines 35-50. Add the IRON CLAW block after "## Overview" and before "## On Load".

4. `hm-l3-omo-reference/SKILL.md` - OMO architecture reference. Has "## Overview" at line 16 and "## Repomix-Generated References" at line 20. Read lines 1-30. Add the IRON CLAW block after "## Overview" and before "## Repomix-Generated References".

5. `hm-l3-tool-capability-matrix/SKILL.md` - Already has "## The Iron Law" at line 27. Read lines 1-50 to understand structure. Add the new tech-stack IRON CLAW block as a section after "## The Iron Law" section and before "## Overview" (around line 32-34). Make it a separate governance section.

6. `hm-l3-subagent-delegation-patterns/SKILL.md` - Delegation patterns reference. Has "## The Iron Law" at line 23. Read lines 1-35. Add the tech-stack IRON CLAW block as a new section after "## The Iron Law" section (around line 27) and before the main content.

7. `hm-l3-opencode-platform-reference/SKILL.md` - Already has "## Constitutional Live-Fetch Compliance" at line 20. Insert the IRON CLAW block right after the "## Overview" section (around line 18), BEFORE "## Constitutional Live-Fetch Compliance".

## The Standardized IRON CLAW Block

Use this EXACT block for ALL files:

```
## 🔨 IRON CLAW: Tech-Stack References & Assets Consumption Governance

> **ABSOLUTE RULE:** No bundled reference, cached asset, or stale pattern from this skill shall be consumed for tech-stack API interface decisions without MCP-verified validation against the project's ACTUAL versions (package.json + lockfile), canonical source mappings (`.hivemind/STACKS-REFERENCES.md`), AND a raw codebase context scan of the current implementation state.

### Rationale

Skills bundle references and assets as ORIENTATION tools — they help you understand WHAT exists and WHERE to look. But every bundled reference is a SNAPSHOT, frozen at the moment of ingestion. Stacks evolve: packages release breaking changes, APIs shift, SDKs deprecate surfaces. Using stale bundled signatures as implementation authority produces silent runtime errors.

### Mandatory 5-Step Validation Chain

Before ANY tech-stack API interface from this skill's references/assets is used for implementation, code generation, or quality gate decisions:

```
STEP 1 — CONSUME .hivemind/STACKS-REFERENCES.md
 ├─ Read the canonical stack→repo→version mapping table
 ├─ Identify the correct GitHub repo for each dependency
 └─ Confirm the repo is active (not archived), version is current

STEP 2 — READ package.json + lockfile
 ├─ Extract the ACTUAL installed version (npm ls / grep lockfile)
 ├─ Cross-reference repo URL from STACKS-REFERENCES.md against npm registry
 └─ Flag any discrepancy between bundled version and installed version

STEP 3 — RAW CODEBASE CONTEXT SCAN
 ├─ grep/glob the actual src/ directory structure for current implementation
 ├─ Read current implementation files — not stale docs or bundled references
 ├─ Verify the claimed API signatures match current codebase reality
 └─ Check import paths, type definitions, and function signatures exist in actual code

STEP 4 — MCP LIVE VALIDATION (minimum 2 tools)
 ├─ Context7: resolve-library-id → query-docs (API signatures at installed version)
 ├─ DeepWiki: ask-question (architecture patterns, behavioral semantics)
 ├─ Repomix: pack-remote-repository (full repo analysis at correct version tag)
 ├─ Exa: web-search (latest docs, tutorials, migration guides)
 ├─ Tavily: search + extract (version-specific migration info)
 ├─ GitHub: get-file-contents (exact source verification at correct version)
 └─ GitMCP: search-code (source-level pattern matching)

STEP 5 — VERIFICATION RECORD
 ├─ Source URL + version confirmed to match package.json
 ├─ MCP tool(s) used + fetch timestamp
 ├─ Codebase scan paths + findings
 ├─ Version match status (MATCHED / MISMATCHED / UNVERIFIED)
 └─ Flag as BLOCKING if version mismatch or critical staleness detected
```

### Consumption Rules

| Action | Rule |
|--------|------|
| **Orientation** (understanding WHAT exists, WHERE to look) | ✅ Reference-tier allowed from bundled assets without live validation |
| **API signature lookup** for implementation | 🚫 BLOCKED without live MCP validation (Step 4) + codebase scan (Step 3) |
| **Interface verification** for quality gates | 🚫 BLOCKED without live MCP validation (Step 4) + version match (Step 2) |
| **Version-sensitive behavioral claims** | 🚫 BLOCKED without live MCP validation (Step 4) |
| **Architecture pattern understanding** | ✅ Reference-tier allowed, but recommend live verification for production decisions |
| **Generating code from bundled patterns** | 🚫 BLOCKED — route to live MCP tools for current API surface |

### Integrated Enforcement Points

| Workflow Phase | IRON CLAW Trigger | Required Validation |
|---------------|-------------------|---------------------|
| Implementation | Before using any API from bundled refs | Steps 2-4 minimum |
| Code review | When verifying API usage against docs | Steps 2-4 minimum |
| Quality gate | Before PASS verdict on interface claims | Steps 1-5 full |
| Research | When synthesizing findings from cached assets | Steps 4-5 minimum |
| Audit | When reporting version-based findings | Steps 1-5 full |
```

## Execution Instructions

For each file:
1. Read the SKILL.md first to understand its structure fully
2. Find the best insertion point based on the hints above
3. Use the Edit tool to add the block
4. Adapt the heading level to match the file's heading hierarchy

## Return Format

Return a structured report listing each file edited, the insertion point chosen, and confirmation the edit was applied. If any file already had similar governance, explain how the IRON CLAW integrates with or supersedes it.

### Tool: skill

**Input:**
```json
{
  "name": "hm-l2-cross-cutting-change"
}
```

**Output:** (pruned)
```
# Skill: hm-l2-cross-cutting-change
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-hivemind-engine-contracts/SKILL.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-hivemind-state-reference/SKILL.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-integration-contracts/SKILL.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-omo-reference/SKILL.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-tool-capability-matrix/SKILL.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-subagent-delegation-patterns/SKILL.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-opencode-platform-reference/SKILL.md"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-opencode-platform-reference/SKILL.md</path>
<type>file</type>
<content>
1: ---
2: name: hm-l3-opencode-platform-reference
3: description: Complete OpenCode platform documentation covering agents, plugins, custom tools, SDK, permissions, skills, commands, configs, MCP servers, and models sourced from anomalyco/opencode v1.14.44. Use when the user asks about "how to create an OpenCode agent", "OpenCode plugin hooks", "custom tool in OpenCode", "OpenCode permission rules", "configure OpenCode MCP server", "OpenCode SDK API", "OpenCode agent frontmatter", "opencode.json schema", "OpenCode command definition", "how does OpenCode skills work", "OpenCode platform architecture", or any question about OpenCode platform surfaces (agents, plugins, tools, SDK, permissions, skills, commands, configs, MCP, models). NOT for general coding tasks or non-OpenCode framework lookup.
4: metadata:
5:   layer: "3"
6:   role: "reference"
7:   pattern: P2
8:   version: "1.1.0"
9:   constitutional_override: true
10: allowed-tools:
11:   - Read
12:   - Grep
13:   - Glob
14: ---
15: 
16: ## Overview
17: 
18: Complete OpenCode platform documentation covering agents, plugins, custom tools, SDK, permissions, skills, commands, configs, MCP servers, and models. Use when building plugin integrations, configuring agents, defining tools, or understanding platform architecture. Contains reference files for all platform capabilities.
19: 
20: ## 🔨 IRON CLAW: Tech-Stack References & Assets Consumption Governance
21: 
22: > **ABSOLUTE RULE:** No bundled reference, cached asset, or stale pattern from this skill shall be consumed for tech-stack API interface decisions without MCP-verified validation against the project's ACTUAL versions (package.json + lockfile), canonical source mappings (`.hivemind/STACKS-REFERENCES.md`), AND a raw codebase context scan of the current implementation state.
23: 
24: ### Rationale
25: 
26: Skills bundle references and assets as ORIENTATION tools — they help you understand WHAT exists and WHERE to look. But every bundled reference is a SNAPSHOT, frozen at the moment of ingestion. Stacks evolve: packages release breaking changes, APIs shift, SDKs deprecate surfaces. Using stale bundled signatures as implementation authority produces silent runtime errors.
27: 
28: ### Mandatory 5-Step Validation Chain
29: 
30: Before ANY tech-stack API interface from this skill's references/assets is used for implementation, code generation, or quality gate decisions:

(Showing lines 1-30 of 262. Use offset=31 to continue.)
</content>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-opencode-platform-reference/SKILL.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-hivemind-engine-contracts/SKILL.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-hivemind-state-reference/SKILL.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-integration-contracts/SKILL.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-omo-reference/SKILL.md"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_00_08VBxr6zeFAK7GA5XfxD5676"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_01_KBVfROAHL0n7BGa82BLJ1341"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_02_PBXFuU21it3kLaPoB5yp4765"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_03_58Ww64RdBKWbtHQx6MtA1352"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-tool-capability-matrix/SKILL.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-subagent-delegation-patterns/SKILL.md"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_00_IR5rjhxP8PXOt7Ru7MLM2106"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_01_ZPa6hL7XoNVF1UwdPsPU0667"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-hivemind-engine-contracts/SKILL.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-hivemind-state-reference/SKILL.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-integration-contracts/SKILL.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-omo-reference/SKILL.md"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-omo-reference/SKILL.md</path>
<type>file</type>
<content>
16: ## Overview
17: 
18: Complete oh-my-openagent architecture reference for agent plugin design patterns. Use when referencing plugin systems, hook architectures, circuit breakers, session continuity, or skill loader design. Contains packed repository with structured navigation into project structure, tech stack, and all source files.
19: 
20: ## 🔨 IRON CLAW: Tech-Stack References & Assets Consumption Governance
21: 
22: > **ABSOLUTE RULE:** No bundled reference, cached asset, or stale pattern from this skill shall be consumed for tech-stack API interface decisions without MCP-verified validation against the project's ACTUAL versions (package.json + lockfile), canonical source mappings (`.hivemind/STACKS-REFERENCES.md`), AND a raw codebase context scan of the current implementation state.
23: 
24: ### Rationale
25: 
26: Skills bundle references and assets as ORIENTATION tools — they help you understand WHAT exists and WHERE to look. But every bundled reference is a SNAPSHOT, frozen at the moment of ingestion. Stacks evolve: packages release breaking changes, APIs shift, SDKs deprecate surfaces. Using stale bundled signatures as implementation authority produces silent runtime errors.
27: 

(Showing lines 16-27 of 169. Use offset=28 to continue.)
</content>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-tool-capability-matrix/SKILL.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-subagent-delegation-patterns/SKILL.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-opencode-platform-reference/SKILL.md"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-opencode-platform-reference/SKILL.md</path>
<type>file</type>
<content>
22: > **ABSOLUTE RULE:** No bundled reference, cached asset, or stale pattern from this skill shall be consumed for tech-stack API interface decisions without MCP-verified validation against the project's ACTUAL versions (package.json + lockfile), canonical source mappings (`.hivemind/STACKS-REFERENCES.md`), AND a raw codebase context scan of the current implementation state.
23: 
24: ### Rationale
25: 
26: Skills bundle references and assets as ORIENTATION tools — they help you understand WHAT exists and WHERE to look. But every bundled reference is a SNAPSHOT, frozen at the moment of ingestion. Stacks evolve: packages release breaking changes, APIs shift, SDKs deprecate surfaces. Using stale bundled signatures as implementation authority produces silent runtime errors.

(Showing lines 22-26 of 262. Use offset=27 to continue.)
</content>
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_JRzGCRoFBm9dSWU7ETOt8577"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_AlPTa6vKpgwbkcRQ2Ekv8367"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_isJiR3Ydxm2QTSvIR9Ip2399"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_ijrkA2G8q1X54D832bDP1805"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_FhkM2hsbXyYZAOpIyxTS3767"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_HHX5ba1vzPI86ZGn6LrC9968"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_KkD3J0U588pfUlqBpAgq0085"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_mVJZ1WjCI8CO1DJ6YAH87627"
}
```

