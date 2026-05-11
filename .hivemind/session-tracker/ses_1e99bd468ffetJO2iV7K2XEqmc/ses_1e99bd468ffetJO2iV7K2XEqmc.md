---
sessionID: ses_1e99bd468ffetJO2iV7K2XEqmc
created: 2026-05-11T09:35:24.067Z
updated: 2026-05-11T09:35:24.067Z
parentSessionID: null
delegationDepth: 0
children: []
continuityIndex: session-continuity.json
status: active
---

## USER (turn 1)

You are a subagent tasked with adding/upgrading the IRON CLAW governance section in 6 research/synthesis/ingestion skills. You MUST read each SKILL.md, find the right insertion point, and add the standardized IRON CLAW block using the Edit tool.

## Files to Edit (in /Users/apple/hivemind-plugin-private/.opencode/skills/):

1. `hm-l3-tech-stack-ingest/SKILL.md` - Already has "## Constitutional Rule" at line 38. Upgrade it: Insert the IRON CLAW block as a new section between the "## Constitutional Rule" section and the "## Two-Tier Trust Model" section (around line 40-60). Keep the existing two. If the content overlaps, integrate the IRON CLAW as the overarching governance header.

2. `hm-l3-tech-context-compliance/SKILL.md` - Already has "## Constitutional Compliance" at line 51. Insert the IRON CLAW block right BEFORE the existing "## Constitutional Compliance" section (around line 50), making it the overarching governance for the file.

3. `hm-l3-deep-research/SKILL.md` - Already has "## Cross-Architecture Research Routing" at line 44 and "## Two-Tier Trust Model" at line 48. Insert the IRON CLAW block right BEFORE "## Cross-Architecture Research Routing" (around line 44), making it the governance header for all subsequent trust/validation content.

4. `hm-l3-detective/SKILL.md` - Read lines 1-100 first. Find the section gap after "## Overview" or "## Quick Jump" and before the reading modes content. Add the IRON CLAW as a new section there.

5. `hm-l3-research-chain/SKILL.md` - Already has "## Constitutional Compliance" at line 40. Insert the IRON CLAW block right BEFORE the "## Constitutional Compliance" section, making it the overarching governance.

6. `hm-l3-synthesis/SKILL.md` - Already has "## Constitutional Compliance — Two-Tier Trust Model" at line 411. Insert the IRON CLAW block RIGHT BEFORE "## Constitutional Compliance — Two-Tier Trust Model", making it the governance header.

## The Standardized IRON CLAW Block

For EACH file, add this EXACT block with the heading adapted to the file's section structure:

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
3. Use the Edit tool to add the block, adapting the heading level to match the file's heading structure (if using ### for sub-sections, use ### for the IRON CLAW heading)
4. For files with existing governance: make the IRON CLAW section the overarching header that comes BEFORE existing governance sections

## Return Format

Return a structured report listing each file edited, the insertion point chosen, and confirmation the edit was applied.

### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-tech-stack-ingest/SKILL.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-tech-context-compliance/SKILL.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-deep-research/SKILL.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-detective/SKILL.md"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-detective/SKILL.md</path>
<type>file</type>
<content>
1: ---
2: name: hm-l3-detective
3: description: Investigate codebases with SCAN, READ, and DEEP reading modes. Use when navigating large codebases, finding definitions, or recovering session context. Stage 1 of the hm-research-chain pipeline. Feeds findings into hm-deep-research and hm-synthesis. Consumes cached assets from hm-tech-stack-ingest. NOT for writing code or running tests.
4: metadata:
5:   layer: "3"
6:   role: "investigation"
7:   pattern: P2
8: allowed-tools: Read Write Edit Bash Glob Grep
9: ---
10: 
11: ## Overview
12: 
13: Investigate codebases using three reading modes: SCAN for targeted extraction, READ for standard review, and DEEP for interface analysis. Use when navigating large codebases, finding definitions, recovering session context, or estimating token budgets. Produces structured codebase findings with surgical edit guidance.
14: 
15: ## Quick Jump
16: 
17: | Investigation Need | Section | Jump |
18: |--------------------|---------|------|
19: | "How do I read this?" | Reading Modes | [Three Reading Modes](#three-reading-modes) |
20: | "How much context will this cost?" | Token Budget | [references/token-budget.md](references/token-budget.md) |
21: | "I lost context — recover" | Swarm Recovery | [references/swarm-recovery.md](references/swarm-recovery.md) |
22: | "What tech stack is this?" | Tech Registry | [references/tech-registry.md](references/tech-registry.md) |
23: | "How do I edit safely?" | Surgical Edits | [references/surgical-edits.md](references/surgical-edits.md) |
24: | "Where do notes go?" | Document Pipeline | [references/document-pipeline.md](references/document-pipeline.md) |
25: | "Is this design assumption true?" | Assumption Verification | [templates/assumption-verification.md](templates/assumption-verification.md) |
26: 
27: ## Three Reading Modes
28: 
29: Every file read costs tokens. Choose the cheapest mode that answers your question.
30: 
31: | Mode | Token Cost | When | Tools |
32: |------|-----------|------|-------|
33: | **SKIM** | ~5% | Orientation: "what is this?" | glob, ls, frontmatter-only, grep -c |
34: | **SCAN** | ~15% | Targeted: "find X" | grep -n, offset reads ±20 lines, TOC navigation |
35: | **SCAN (Tech Stack)** | ~10% | Stack detection: "what's this built with?" | grep indicator files, read 5-10 config files |
36: | **DEEP** | 100% | Understanding: "need every line" | Read full file, repomix pack + grep |
37: 
38: **Escalation rule**: START → SKIM → (if insufficient) SCAN or SCAN (Tech Stack) → (if still need context) DEEP. Never skip to DEEP.
39: 
40: ### Assumption Verification Mode
41: 
42: Use this mode when asked to validate a design assumption, locate an existing pattern, prove whether behavior exists, or recover truth from a large codebase.
43: 
44: 1. Write the assumption as a falsifiable claim.
45: 2. Search for at least two independent evidence paths: definitions, call sites, tests, docs, config, runtime state, or git history.
46: 3. Classify the result using `templates/assumption-verification.md`: confirmed, discrepancy, addition, missing, or blocked.
47: 4. If nothing is found, report the search paths and exact queries; do not silently treat absence as proof.
48: 5. End with an answer-first finding and file:line evidence.
49: 
50: **Not-found rule:** A definitive "not found" requires at least two search strategies and a documented scope boundary.
51: 
52: ### Mode Selection Decision Tree
53: 
54: ```
55: What do you need?
56: |
57: +-- "What files exist?" or "What is this project?"
58: |   -> SKIM: glob patterns, ls directory, grep -c for match counts
59: |
60: +-- "Where is function X defined?" or "What imports Y?"
61: |   -> SCAN: grep -n "pattern" file → get line numbers → offset read ±20
62: |
63: +-- "What tech stack is this?" or "What framework is this built with?"
64: |   -> SCAN (Tech Stack): grep for package.json/go.mod/Cargo.toml → read 5-10 config files
65: |
66: +-- "How does this algorithm work?" or "I need to understand every branch"
67: |   -> DEEP: Read full file (only after SKIM + SCAN confirm it's the right file)
68: ```
69: 
70: ### Case Study: Finding a Bug in a 600-Line File
71: 
72: **Wrong**: Read the entire 600-line file. Cost: ~600 lines of context.
73: 
74: **Right**:
75: 1. SKIM: `grep -c "error" file.ts` → 12 matches. File is relevant.
76: 2. SCAN: `grep -n "error" file.ts` → lines 45, 120, 234, 310, 445, 501, 520, 533, 540, 555, 567, 580
77: 3. SCAN: Read offset=40 limit=30 (lines 40-70), offset=115 limit=30 (lines 115-145), etc.
78: 4. DEEP: Only if the bug spans multiple sections you've already identified.
79: 
80: **Cost**: ~200 lines vs 600 lines. 67% savings.
81: 
82: ## Token-Efficient Retrieval Patterns
83: 
84: These patterns apply across all reading modes. Master them before any investigation.
85: 
86: | Pattern | How | Savings |
87: |---------|-----|---------|
88: | **Offset Hop-Reading** | Read offset=N limit=30 instead of reading N lines to get to line N | 90%+ vs full read |
89: | **Grep-Before-Read** | grep -n → get line numbers → offset read only those sections | 80%+ vs blind read |
90: | **Frontmatter-Only** | For planning docs, read only between --- markers | 95%+ vs full doc |
91: | **TOC-First** | grep ## headings first, then targeted reads | 70%+ vs full read |
92: | **Repomix Compress** | Always use compress: true (70% token reduction) | 70% vs uncompressed |
93: 
94: ### Worked Example: Finding Where a Function Is Called
95: 
96: **Goal**: Find all callers of `processTask` in a 47-file codebase.
97: 
98: ```
99: Step 1 (SKIM): grep -rn "processTask" src/ --include="*.ts" | wc -l → 23 matches
100: Step 2 (SKIM): grep -rn "processTask" src/ --include="*.ts" | cut -d: -f1 | sort -u → 8 files

(Showing lines 1-100 of 329. Use offset=101 to continue.)
</content>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-research-chain/SKILL.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-synthesis/SKILL.md"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-synthesis/SKILL.md</path>
<type>file</type>
<content>
400: | **Orphaned Artifact** | ADR or registry entry with no linked source file | Every artifact must reference its source file and line range |
401: 
402: ### Synthesis-Specific Anti-Patterns
403: 
404: | Anti-Pattern | Detection | Fix |
405: |-------------|-----------|-----|
406: | **Garbage Compactor** | Synthesizing from unverified inputs without running Input Quality Gate | Run all 4 quality checks before synthesis. If BLOCKED, return to hm-deep-research |
407: | **Echo Chamber** | All findings from a single tool/source (e.g., only repomix, only context7) | Require ≥2 distinct source tools. Route back for multi-source research |
408: | **Version Blender** | Mixing findings from different library versions without flagging incompatibilities | Run version match check. Flag every version mismatch in methodology section |
409: | **Cache Amplifier** | Compressing cached-only findings into authoritative-sounding artifacts | Require ≥50% live-source provenance. Downgrade quality score to D or F for cache-only |
410: 
411: ## Constitutional Compliance — Two-Tier Trust Model
412: 
413: Synthesis outputs inherit the trust level of their inputs. Enforce this model:
414: 
415: | Tier | Role | Tools | When to Trust |
416: |------|------|-------|--------------|
417: | **Validation (PRIMARY)** | Live verification of synthesis claims | `context7_query_docs`, `deepwiki_ask_question`, `exa_web_search_exa`, `repomix_grep_repomix_output` | Every claim about API behavior, library interfaces, or architectural patterns |
418: | **Reference (SUPPLEMENTARY)** | Orientation and context understanding | Cached hm-tech-stack-ingest assets, hm-detective structural maps, local .tech-registry.json | Understanding project context, framing research scope, gap identification |
419: 
420: **Rule:** Validation-tier sources MUST confirm any claim that the artifact presents as fact. Reference-tier sources support understanding but cannot substantiate claims alone.
421: 
422: **Staleness Severity Scale:** CRITICAL=24h / HIGH=7d / STANDARD=30d / LOW=90d. Synthesis claims about rapidly-evolving APIs (e.g., AI SDKs) default to CRITICAL. Stable APIs (e.g., core Node.js) default to STANDARD.
423: 
424: ## MCP Tool Integration for Synthesis Verification
425: 
426: After producing a synthesis artifact, verify key claims against live sources:
427: 
428: | Verification Target | MCP Tool | Query Pattern |
429: |---------------------|----------|--------------|
430: | API signatures and method existence | `context7_query_docs` | "Does [library] [version] export [method] with [signature]?" |
431: | Architectural patterns and conventions | `deepwiki_ask_question` | "Is [pattern] the recommended approach in [repo]?" |
432: | Counter-evidence and recent changes | `exa_web_search_exa` | "[library] [feature] breaking change [year]" or "[library] alternative to [claim]" |
433: | Cross-reference against packed codebase | `repomix_grep_repomix_output` | grep for specific function/class names in packed output |
434: 
435: **Minimum verification:** For synthesis quality A or B, at least 2 of the 4 tools must confirm key claims. For C or below, all 4 should be attempted.
436: 
437: ## Synthesis Quality Score
438: 
439: After producing a synthesis artifact, rate it using this scale. The score is MANDATORY — every artifact must include it.
440: 
441: | Score | Criteria | Allowed Actions |
442: |-------|----------|----------------|
443: | **A** | Multi-source inputs, >80% live-verified, no contradictions, all versions match | Publish as authoritative artifact |
444: | **B** | Multi-source inputs, >50% live-verified, contradictions resolved with rationale | Publish with methodology/limitations section |
445: | **C** | Multi-source but <50% live-verified, or minor version mismatches | Publish with WARNING header and re-verification recommendation |
446: | **D** | Dominated by single source or cache-only inputs | Do NOT publish. Return to hm-deep-research for additional sources |
447: | **F** | Cannot verify inputs, all findings are cache-only | BLOCK synthesis entirely. Route back to research stage |
448: 
449: **Score assignment rule:** When in doubt between two scores, use the lower one. Honest low scores prevent downstream errors from compressed garbage.

(Showing lines 400-449 of 596. Use offset=450 to continue.)
</content>
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_xAAQ6pZuysTLsgQME1B31260"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_00_VwTKT70wF02oa377CkSv1365"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_01_kLDjjlMVRW3s607EkHLs1170"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_02_eBkldwqrUXH0RfrUZGoH7825"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_03_uNtXLnnUf1Y9SjJqd2Fd1573"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_04_iuJq1LiBybJG1MiShib74457"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_05_cg56Oo8b7kvlTGWMOOzG9563"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_c9C8SnvbowsNxekvDi061716"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_00_R3jCwIqUNivLyA8lHCiF6126"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_iZ2J0NghxPYvmZUEOEg08285"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_QqSpNA45YaN1aKKCvpt79221"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_WpOZsZKCcW4dyvdtkzgE9776"
}
```

