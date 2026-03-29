# Hivefiver module synthesis with Opencode TUI

**Session ID:** ses_2c911d9a0ffe3HT7PLb3Fw1qfl
**Created:** 3/29/2026, 7:11:10 AM
**Updated:** 3/29/2026, 7:14:36 AM

---

## User

use hivemind-ideating, hivemind-researching and investigation deeply for synthesis of the hivefiver module running @.sdk-lib/opencode/opencode-commands.md and SKILLS to configution of features, settings, those that change the behaviours, approaches, and steer how agents, workflows and other concepts chained etc. And to make the concepts more approachable and as intended to include planning artifacts and agents work contract under src/ >>> a TUI or GUI local graphic is a must I came acros Vercel Json Render plus Opencode SDK /Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/json-render/repomix-json-render.xml
/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/opencode
/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/opencode/opencode-agents.md
/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/opencode/opencode-built-in-tools.md
/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/opencode/opencode-commands.md
/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/opencode/opencode-configs.md
/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/opencode/opencode-custom-tools.md
/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/opencode/opencode-plugins.md
/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/opencode/opencode-rules.md
/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/opencode/opencode-sdk.md
/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/opencode/repomix-opencode.md
/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/opencode/repomix-opencode.xml  + background agents found in both /Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/opencode-workspace-background-agents/repomix-output-kdcokenny-opencode-workspace.xml
/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/oh-my-openagents/repomix-oh-my-openagents.xml please continue the work from the /Users/apple/hivemind-plugin/.worktrees/product-detox/session-ses_2da9.md with deep investigation and revamp

---

## Assistant (Hivefiver · xiaomi/mimo-v2-pro:free · 25.3s)

_Thinking:_

The user wants me to:

1. Use hivemind-ideating, hivemind-research skills for deep investigation
2. Synthesize the hivefiver module running from the opencode-commands.md and SKILLS
3. Configure features, settings that change behaviors, approaches, and steer how agents, workflows are chained
4. Make concepts more approachable with planning artifacts and agents work contracts under src/
5. Create a TUI or GUI local graphic - they mention Vercel JSON Render plus OpenCode SDK
6. Continue work from session-ses_2da9.md with deep investigation and revamp

Let me first:


I'll start by loading the hivemind-ideating and hivemind-research skills to understand the context and patterns, then examine the referenced documents to grasp the module structure and requirements before diving into the investigation and revamp work.

**Tool: skill**

**Input:**
```json
{
  "name": "hivemind-synthesis"
}
```

**Output:**
```
<skill_content name="hivemind-synthesis">
# Skill: hivemind-synthesis

<!-- LOAD-POSITION
slot: depth
role: depth
prerequisites: use-hivemind-delegation, use-hivemind-research
-->

## Load Position

**Layer: Depth**. Loads after delegation and research routers.

| Constraint | Rule |
|-----------|------|
| Position | Depth layer |
| Load order | After entry router + delegation + research |
| Prerequisites | `use-hivemind-delegation`, `use-hivemind-research` |
| Conflict | None — loads alongside any domain skill |

# hivemind-synthesis

## Table of Contents

- [Load Position](#load-position)
- [When You Need This](#when-you-need-this)
- [Do Not Use This For](#do-not-use-this-for)
- [Domain Bundle 1: Investigation](#domain-bundle-1-investigation)
  - [Codebase Investigation](#codebase-investigation)
  - [Session Investigation](#session-investigation)
  - [Activity Investigation](#activity-investigation)
- [Domain Bundle 2: Research + Investigation → Synthesis](#domain-bundle-2-research--investigation--synthesis)
  - [Single-Stack API Synthesis](#single-stack-api-synthesis)
  - [Cross-Dependency Analysis](#cross-dependency-analysis)
  - [MCP Tool Orchestration](#mcp-tool-orchestration)
  - [Synthesis Protocols](#synthesis-protocols)
  - [Repomix Workflows](#repomix-workflows)
- [Domain Bundle 3: Pre-Gatekeeping](#domain-bundle-3-pre-gatekeeping)
  - [Pre-Gatekeeping on Synthesized SDK](#pre-gatekeeping-on-synthesized-sdk)
- [Agent Swarm Orchestration](#agent-swarm-orchestration)
- [Anti-Patterns](#anti-patterns)
- [Sibling Skills](#sibling-skills)
- [Conditional Loading](#conditional-loading)
- [Bundled Resources](#bundled-resources)
- [Independence Rules](#independence-rules)

**Synthesis is not assembly. Assembly concatenates findings. Synthesis produces understanding. If you cannot explain how findings connect, you have aggregated — not synthesized.**

## When You Need This

You need this skill when:

- Deep codebase investigation is required — hierarchy, slices, domains, dependency chains
- Session analysis is needed — user prompts, workflow patterns, delegation chains, temporal narratives
- Activity investigation is required — planning artifacts, delegation records, handoff evidence, TDD traces
- Single-stack API/feature synthesis — deep tech stack API and feature behavior understanding
- Cross-dependency multi-stack interface validation — identifying conflicts, shared imports, boundary contracts
- Pre-gatekeeping before synthesis output is trusted — ensuring tests, build, and types are clean
- Repomix pack + grep + attach workflows are needed for large codebase analysis
- Agent swarm coordination for parallel investigation waves

## Do Not Use This For

- Implementation work → `hivemind-execution`
- TDD workflows → `use-hivemind-tdd`
- Refactoring → `hivemind-refactor`
- Debug workflows → `hivemind-system-debug`
- Architecture decisions → `hivemind-architecture`
- Pure delegation protocol → `use-hivemind-delegation`

---

## Domain Bundle 1: Investigation

Three investigation domains. Each produces structured findings that feed into synthesis.

### Codebase Investigation

Broad-to-deep methodology using Repomix pack + grep + attach. Five phases:

| Phase | Action | Output |
|-------|--------|--------|
| 1. High-level map | Repomix pack entire codebase → XML output → grep for module boundaries | Module graph |
| 2. Pipeline map | Attach packed output → grep for data flow, interfaces, types | Interface inventory |
| 3. Journey map | Trace features through modules, identify dependency chains | Dependency chains |
| 4. Low-level proof | Targeted file reads with offset for implementation details | Implementation evidence |
| 5. Cross-pass synthesis | Combine all phases into unified domain model | Domain model |

Repomix commands: `repomix --remote <repo>`, `repomix .`, `--compress` (Tree-sitter, 70% reduction), `--format xml|markdown|json`. Attach output → grep on output ID for targeted reads.

OpenCode built-in tools: `grep` (ripgrep regex), `glob` (file patterns), `list` (directory), `read` (offset reads), `lsp` (goToDefinition, findReferences), `websearch` (Exa AI).

**Full protocol:** `references/codebase-investigation.md`

### Session Investigation

Three-layer session data ecosystem:

| Layer | Path | Scale | Use When |
|-------|------|-------|----------|
| Session-inspection | `.hivemind/session-inspection/ses_*/` | 427 dirs, 768 files | Reconstructing agent decisions |
| Sessions | `.hivemind/sessions/ses_*/` | 1,748 JSON + 103 dirs | Workflow pattern analysis |
| Session exports | project root `session-ses_*.md` | 5 files, 54K+ lines | User prompt pattern analysis |

Session-inspection: each dir has `assistant-output.md` + `purification-command.json`. Sessions: each dir has `session.json` (metadata) + `events.md` (timestamped) + `diagnostics.log`.

Time-machine investigation: filter by date → Repomix pack session-inspection dirs → grep for decisions → cross-reference with git commits → synthesize temporal narrative.

Long-haul analysis: track purpose classes across time, detect workflow bottlenecks, map delegation chains.

**Full protocol:** `references/session-investigation.md`

### Activity Investigation

`.hivemind/activity/` with 17 subdirectories, 137+ files:

| Category | Path | Scale | Investigation Focus |
|----------|------|-------|-------------------|
| Planning | `activity/plans/`, `activity/planning/` | 20+ files | Plan continuity, task decomposition |
| Delegation | `activity/delegation/` | 34 files | Agent usage patterns, success rates |
| Handoff | `activity/handoff/` | 12 files | Context preservation, carry-forward |
| TDD | `activity/tdd/` | 21 files | Red/green/refactor evidence per plan |
| Verification | `activity/verification/` | 19 files | Incremental, hiveq, final verify |
| Agents | `activity/agents/` | Per-agent dirs | Output quality, decision patterns |

Cross-ref with `activity/status.json` (workflow tracker) and `activity/synthesis/` (integration summaries).

**Full protocol:** `references/activity-investigation.md`

---

## Domain Bundle 2: Research + Investigation → Synthesis

Research from MCP tools and investigation findings converge into synthesis output.

### Single-Stack API Synthesis

Deep tech stack API and feature behavior understanding:

1. Identify the API surface — what does the stack expose?
2. Map feature behaviors — what does each API do in practice?
3. Validate with code — grep packed output for actual usage, not just declarations
4. Synthesize API contract — combine interface, behavior, and usage into unified model

### Cross-Dependency Analysis

Identify cross-stack dependencies, interface conflicts, shared imports:

1. **Shared interfaces** — grep for imports between modules, find shared type definitions
2. **Dependency chains** — trace from entry points through layers
3. **Conflict detection** — duplicate exports, conflicting types, version mismatches
4. **Validation** — pack each dependency chain → grep for import patterns → cross-reference

For multi-stack projects (TypeScript + Python + Shell): identify boundary contracts (JSON schemas, REST APIs, CLI interfaces), validate interfaces match across stacks.

**Full protocol:** `references/cross-dependency-analysis.md`

### MCP Tool Orchestration

Utilizing Context7, Deepwiki, Tavily, Exa, Repomix for investigation:

| MCP Server | Tools | Primary Use |
|------------|-------|------------|
| **Context7** | resolve-library-id, query-docs | Library documentation, version compatibility |
| **Deepwiki** | read-wiki-structure, read-wiki-contents, ask-question | GitHub repo documentation |
| **Tavily** | search, extract, crawl, research | Web research, content extraction |
| **Exa** | web_search, crawling, get_code_context | Code search, web search |
| **Repomix** | pack, attach, grep, read | Codebase packaging + analysis |

Tool selection: Library docs → Context7 (fallback: Deepwiki). Web research → Tavily (fallback: Exa). Code search → Exa code (fallback: Repomix grep). Repo docs → Deepwiki (fallback: Git Fetcher). Codebase analysis → Repomix (fallback: built-in grep/glob).

Composition patterns: Research pipeline (Tavily → Exa → Context7 → Synthesize). Codebase investigation (Repomix → grep → attach → read → Cross-validate). Library validation (Context7 → query → Deepwiki → Verify).

**Full catalog:** `references/mcp-tool-catalog.md`

### Synthesis Protocols

Research + investigation → synthesis pipeline:

```
INVESTIGATE → EXTRACT → VALIDATE → SYNTHESIZE → GATE
```

| Phase | Action | Output |
|-------|--------|--------|
| INVESTIGATE | Codebase, session, activity, external research | Raw findings |
| EXTRACT | Pull findings → structured as: finding → source → confidence → evidence | Structured findings |
| VALIDATE | Cross-check against code, MCP tools, git history | Verified findings |
| SYNTHESIZE | Combine into domain model, API contracts, dependency map | Synthesis output |
| GATE | Pre-gatekeeping → hivemind-gatekeeping → integration checkpoint | Gated output |

Wave sequencing: Wave 1 (broad) → synthesis → Wave 2 (targeted) → synthesis → Wave 3 (validation) → synthesis → GATE.

**Full protocols:** `references/synthesis-protocols.md`

### Repomix Workflows

Pack, compress, grep, attach, skill generation:

| Workflow | Command/Tool | When |
|----------|-------------|------|
| Pack | `repomix .` or `repomix --remote <url>` | Initial codebase capture |
| Compress | `--compress` flag | >50 files, architecture analysis |
| Attach | `repomix_attach_packed_output` | Load existing packed output |
| Grep | `repomix_grep_repomix_output` | Targeted search in packed output |
| Read | `repomix_read_repomix_output` | Line-range reads |
| Skill gen | `repomix_generate_skill` | Generate SKILL.md from codebase |

Output format: XML (Claude analysis), JSON (programmatic synthesis), Markdown (human-readable), Plain (universal).

Compression decision: Use for architecture analysis, pattern extraction, API review (>50 files). Skip for bug investigation, implementation details (<50 files).

**Full workflows:** `references/repomix-workflows.md`

---

## Domain Bundle 3: Pre-Gatekeeping

### Pre-Gatekeeping on Synthesized SDK

Sits between investigation/research and synthesis. Ensures synthesized output is trustworthy.

| Check | Evidence Required | Gate Type |
|-------|-------------------|-----------|
| Tests pass | `npm test` — all green | Hard — blocks |
| Build succeeds | `npm run build` — exit 0 | Hard — blocks |
| Types check | `npx tsc --noEmit` — 0 errors | Hard — blocks |
| No circular dependencies | Dependency graph analysis | Hard — blocks |
| No broken exports | Grep verification of import chains | Soft — warning |
| Session findings cross-checked | Git log correlation with session timestamps | Soft — warning |

Protocol: Run all hard gates first. If any hard gate fails → synthesis cannot proceed. Run soft gates after hard gates pass. Log to `.hivemind/activity/synthesis/pre-gate-{timestamp}.json`. Pre-gate result feeds into `hivemind-gatekeeping` synthesis gate.

Integration: Pre-gate is a **precondition** for synthesis gates. Pre-gate failure → block pipeline. Pre-gate pass → proceed to `hivemind-gatekeeping`. Both must pass for synthesis output to be trusted.

**Full protocol:** `references/pre-gatekeeping.md`

---

## Agent Swarm Orchestration

This skill coordinates investigation swarms under hiveminder orchestration:

| Agent | Role | When Dispatched |
|-------|------|----------------|
| `hivexplorer` | Read-only broad sweeps | Parallel investigation waves |
| `hiverd` | External research via MCP tools | Documentation, library validation |
| `architect` | Design validation | Architecture validation of synthesis |
| `hivemaker` | Implementation | Investigation reveals code changes needed |

Leveraging: `use-hivemind-delegation` (swarm dispatch packets), `use-hivemind-research` (MCP tool utilization), OpenCode built-in tools (grep, glob, list, LSP, offset reading, websearch).

Wave pattern: Wave 1 — parallel `hivexplorer` sweeps (pack + grep). Wave 2 — `hiverd` external research (MCP tools). Wave 3 — `architect` validation. Each wave produces structured findings. `hiveminder` synthesizes across waves.

---

## Anti-Patterns

| # | Anti-Pattern | What Actually Happens |
|---|-------------|----------------------|
| 1 | **Synthesizing without investigation** | You produce a beautiful analysis of assumptions. None of it is grounded in code. |
| 2 | **Trusting session memory without git verification** | "I remember we decided X." Git says otherwise. 2 hours wasted on wrong direction. |
| 3 | **Skipping pre-gatekeeping** | Synthesis output references broken APIs. Downstream agents build on sand. |
| 4 | **Full read when grep would answer** | You read 10,000 lines to find one import statement. Use targeted grep. |
| 5 | **Single-source synthesis** | You found one answer and stopped. Two sources might disagree. Always cross-check. |
| 6 | **Repomix pack without compression on large codebases** | You blow your token budget on full file contents. Use `--compress` for architecture analysis. |
| 7 | **Synthesis without wave sequencing** | You try to investigate, research, validate, and synthesize in one pass. Context overload. Use waves. |

---

## OpenCode Tool Matrix

| Task | Primary Tool | Use When | Fallback |
|---|---|---|---|
| Codebase-wide architecture sweep | `repomix_pack_codebase` | Need a packed, searchable code snapshot | built-in `glob` + `grep` |
| Search packed code for seams | `repomix_grep_repomix_output` | Already have a Repomix output ID | built-in `grep` on source files |
| Library/API clarification | `context7_query-docs` | Need vendor or package documentation | `deepwiki_ask_question` |
| Repo docs synthesis | `deepwiki_ask_question` | Need GitHub-repo-grounded explanation | `context7_query-docs` |
| Web evidence collection | `tavily_tavily_extract` | URLs already known and need clean extraction | `exa_crawling_exa` |
| Broad external search | `exa_web_search_exa` | Need fresh candidate sources quickly | `tavily_tavily_search` |
| Current repo-local proof | built-in `read` / `grep` | Need exact file truth | Repomix read output |

## MCP Tool Usage in Synthesis

| Need | Primary MCP | Why | Escalate When |
|---|---|---|---|
| Official library docs | Context7 | Best for package-specific reference and examples | Version ambiguity remains |
| GitHub repo behavior or docs | DeepWiki | Repo-grounded Q&A and wiki retrieval | Need exact source file proof |
| Known URLs with high-value content | Tavily Extract | Fast clean extraction with markdown output | Tables or protected content fail |
| Broad web discovery | Exa Search / Tavily Search | Current-source retrieval and ranking | Results repeat or lack depth |
| Local or remote codebase map | Repomix | Whole-repo packaging with grepable output | Need exact line-level proof |


1. Prefer Context7 for official package usage, not generic search.
2. Prefer DeepWiki when the target is a GitHub repository, not an npm package.
3. Prefer Tavily/Exa for literature or ecosystem evidence.
4. Record source URLs, titles, and credibility scores before drafting the report.

## Claims-Evidence Protocol

1. Draft a singular claim with a stable ID such as `C-01`.
2. Gather at least one direct evidence item before writing analysis prose.
3. Require **3+ sources per core claim** for recommendations or high-stakes conclusions.
4. Score each source with the credibility model before assigning claim confidence.
5. Record contradictory material in the counterevidence register instead of burying it.
6. Assign claim confidence only after the evidence set is complete.
7. Let `LOW` evidence appear only as caveat, counterpoint, or gap signal.

| Field | Meaning |
|---|---|
| `id` | Stable claim identifier |
| `claim_text` | Singular verifiable statement |
| `evidence[].quote` | Exact excerpt or bounded factual summary |
| `evidence[].source_url` | Canonical source locator |
| `evidence[].source_title` | Human-readable title |
| `evidence[].credibility_score` | 0-100 composite score |
| `confidence` | Claim-level `HIGH` / `MEDIUM` / `LOW` |
| `counter_evidence[]` | Contradictions, caveats, or scope limits |
| `verdict` | `supported`, `mixed`, `tentative`, `rejected` |

Load `references/claims-evidence-framework.md` when the report needs claim tables, counterevidence, novel insights, or diminishing-returns logic.

## Source Credibility Scoring

- Domain authority: **35%**
- Recency: **20%**
- Expertise: **25%**
- Bias / balance: **20%**

- `80-100` = Strong; may support critical claims.
- `60-79` = Acceptable; use for secondary claims or corroboration.
- `0-59` = Weak; use only as caveat, counterpoint, or gap signal.

High-authority examples: official docs, maintainer repos, IEEE, arXiv, government domains.  
Moderate-authority examples: reputable industry analysis and engineering blogs.  
Low-authority indicators: anonymous blogs, content farms, low-trust subdomains, reposts.

## Progressive Assembly Strategy

1. Freeze the outline and claim inventory first.
2. Write one major section at a time.
3. Persist claims JSON, citation ledger, and report markdown after each section.
4. Resume from disk after compaction instead of regenerating the whole report.
5. For reports above ~18K words, continue section-by-section with explicit handoff state.

Load `references/progressive-assembly.md` when running long or multi-turn synthesis.

## Bash Examples (5)

### 1. Pack the local codebase for architecture synthesis

```text
repomix_pack_codebase({
  directory: "/absolute/project/path",
  includePatterns: "src/**,docs/**",
  style: "xml"
})
```

### 2. Search a packed output for interface seams

```text
repomix_grep_repomix_output({
  outputId: "<repomix-output-id>",
  pattern: "interface|type|export",
  contextLines: 2
})
```

### 3. Pull official package docs for a disputed API

```text
context7_query-docs({
  libraryId: "/vercel/next.js",
  query: "App Router streaming and route segment config"
})
```

### 4. Extract high-value web pages after search

```text
tavily_tavily_extract({
  urls: ["https://example.com/report", "https://example.com/spec"],
  extract_depth: "advanced",
  format: "markdown"
})
```

### 5. Ask a GitHub repo-specific synthesis question

```text
deepwiki_ask_question({
  repoName: "owner/repo",
  question: "What evidence in this repository supports claim C-03?"
})
```

## Decision Tree: Synthesis Type → Output Format

| If the job is... | Then do this | Primary Output |
|---|---|---|
| Codebase analysis | Repomix pack → grep packed output → targeted reads → claims table | claims JSON + technical synthesis report |
| Literature review | Exa/Tavily search → extract → credibility score → evidence table | research-led report with bibliography |
| Multi-source product evaluation | combine local code truth + official docs + external sources | triangulated claims-evidence ledger |
| Session/activity reconstruction | inspect `.hivemind/` artifacts + correlate with git or output evidence | narrative timeline + claim appendix |

## Cross-Skill Chaining

- Load `use-hivemind-research` before synthesis when evidence still needs collection or credibility scoring.
- Load `hivemind-gatekeeping` before final handoff when the synthesized output needs gate validation.
- Load `use-hivemind-context` when session or document trust is uncertain.

1. `use-hivemind-research` — gather and normalize evidence
2. `hivemind-synthesis` — assemble claims, counterevidence, and insights
3. `hivemind-gatekeeping` — run synthesis gates and validation loops

## Metrics & Verification

- 10+ distinct sources
- 3+ sources per core claim
- credibility score recorded for every source
- counterevidence register populated for contested topics
- validation script passes with zero blocking failures

Run `scripts/hm-synthesis-validate.sh <report.md> [claims.json]` before handoff.  
Load `references/synthesis-validation.md` when tailoring thresholds by mode.

---

## Sibling Skills

| Skill | Relationship |
|-------|-------------|
| `use-hivemind` | Entry router that triggers this skill |
| `use-hivemind-delegation` | Swarm dispatch for investigation waves |
| `use-hivemind-research` | MCP tool utilization for research |
| `hivemind-gatekeeping` | Synthesis gates, pre-gatekeeping |
| `hivemind-codemap` | Codebase scanning mechanics |
| `use-hivemind-context` | Context health for investigation trust |
| `hivemind-architecture` | Architecture validation of synthesis |

## Conditional Loading

| Condition | Load Reference |
|-----------|---------------|
| Codebase investigation needed | `references/codebase-investigation.md` |
| Session analysis needed | `references/session-investigation.md` |
| Activity data investigation needed | `references/activity-investigation.md` |
| Repomix pack/grep/attach workflow needed | `references/repomix-workflows.md` |
| MCP tool selection needed | `references/mcp-tool-catalog.md` |
| Cross-stack dependency analysis needed | `references/cross-dependency-analysis.md` |
| Research-to-synthesis pipeline needed | `references/synthesis-protocols.md` |
| Pre-gatekeeping on synthesis needed | `references/pre-gatekeeping.md` |

## Bundled Resources

| Resource | Path | Purpose |
|----------|------|---------|
| Codebase Investigation | `references/codebase-investigation.md` | Broad-to-deep methodology, Repomix commands, built-in tools |
| Session Investigation | `references/session-investigation.md` | Session data ecosystem, time-machine protocol, long-haul analysis |
| Activity Investigation | `references/activity-investigation.md` | Activity data layers, planning, delegation, handoff, TDD evidence |
| Repomix Workflows | `references/repomix-workflows.md` | Pack, compress, grep, attach, skill generation workflows |
| MCP Tool Catalog | `references/mcp-tool-catalog.md` | MCP server inventory, tool selection matrix, composition patterns |
| Cross-Dependency Analysis | `references/cross-dependency-analysis.md` | Cross-stack analysis, dependency graphs, conflict detection |
| Synthesis Protocols | `references/synthesis-protocols.md` | Investigate → Extract → Validate → Synthesize → Gate pipeline |
| Pre-Gatekeeping | `references/pre-gatekeeping.md` | Pre-gate checklist, protocol, integration with hivemind-gatekeeping |

## Independence Rules

- This skill operates at depth level — requires `use-hivemind-delegation` and `use-hivemind-research` as prerequisites
- It provides investigation methodology and synthesis protocols, not delegation mechanics
- Synthesis artifacts are stored in `{project}/.hivemind/activity/synthesis/` at runtime
- Pre-gate results feed into `hivemind-gatekeeping` synthesis gates
- This skill composes with `hivemind-codemap` for codebase scanning, `use-hivemind-context` for investigation trust, and `hivemind-architecture` for design validation

## Activity Output

All artifacts produced by this skill follow the Activity Folder Protocol.

**Pathing:** See `.hivemind/pathing/active-paths.json` for resolved output paths.
**Naming:** `{category}-{semantic-id}-{YYYY-MM-DD}.{ext}`
**Meta:** All JSON includes `_meta.created_at`, `_meta.updated_at`, `_meta.producer`.
**Validation:** Run `bash use-hivemind-delegation/scripts/hm-artifact-validate.sh {path}` to confirm compliance.

Base directory for this skill: file:///Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/hivemind-synthesis
Relative paths in this skill (e.g., scripts/, reference/) are relative to this base directory.
Note: file list is sampled.

<skill_files>
<file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/hivemind-synthesis/templates/synthesis-report.md</file>
<file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/hivemind-synthesis/templates/claims-evidence-table.json</file>
<file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/hivemind-synthesis/scripts/hm-synthesis-validate.sh</file>
<file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/hivemind-synthesis/references/pre-gatekeeping.md</file>
<file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/hivemind-synthesis/references/synthesis-validation.md</file>
<file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/hivemind-synthesis/references/repomix-workflows.md</file>
<file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/hivemind-synthesis/references/claims-evidence-framework.md</file>
<file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/hivemind-synthesis/references/synthesis-protocols.md</file>
<file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/hivemind-synthesis/references/session-investigation.md</file>
<file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/hivemind-synthesis/references/progressive-assembly.md</file>
</skill_files>
</skill_content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin/.worktrees/product-detox/session-ses_2da9.md"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin/.worktrees/product-detox/session-ses_2da9.md</path>
<type>file</type>
<content>1: # New session - 2026-03-25T14:37:44.765Z
2: 
3: **Session ID:** ses_2da91ea42ffeJoPz6qK7MlpjVb
4: **Created:** 3/25/2026, 9:37:44 PM
5: **Updated:** 3/28/2026, 7:17:05 PM
6: 
7: ---
8: 
9: ## Assistant (Hiveminder · xiaomi/mimo-v2-pro:free · 9.3s)
10: 
11: _Thinking:_
12: 
13: Now Phase 2: Create the TypeScript interfaces.
14: 
15: Phase 2: TypeScript interfaces.
16: 
17: **Tool: todowrite**
18: 
19: **Input:**
20: ```json
21: {
22:   "todos": [
23:     {
24:       "content": "Trace the skill injection mechanism from dist/ → source code",
25:       "priority": "high",
26:       "status": "completed"
27:     },
28:     {
29:       "content": "Determine if the injection is alive/working or dead",
30:       "priority": "high",
31:       "status": "completed"
32:     },
33:     {
34:       "content": "Map current .opencode/skills names vs what the injection expects",
35:       "priority": "high",
36:       "status": "completed"
37:     },
38:     {
39:       "content": "Identify the load-3 logic and per-turn/workflow skill rotation",
40:       "priority": "high",
41:       "status": "completed"
42:     },
43:     {
44:       "content": "Verify front-facing agents (hiveminder, build, plan) skill awareness",
45:       "priority": "medium",
46:       "status": "completed"
47:     },
48:     {
49:       "content": "Report findings to user",
50:       "priority": "high",
51:       "status": "completed"
52:     },
53:     {
54:       "content": "Plan configurable JSON settings feature for skill injection",
55:       "priority": "high",
56:       "status": "completed"
57:     },
58:     {
59:       "content": "Phase 1: Create config/skill-injection.json with corrected skill names",
60:       "priority": "high",
61:       "status": "completed"
62:     },
63:     {
64:       "content": "Phase 2: Create src/shared/skill-injection.types.ts (TypeScript interfaces)",
65:       "priority": "high",
66:       "status": "in_progress"
67:     },
68:     {
69:       "content": "Phase 3: Create src/shared/skill-injection-loader.ts (loader + validator)",
70:       "priority": "high",
71:       "status": "pending"
72:     },
73:     {
74:       "content": "Phase 4: Modify src/plugin/skill-exposure-map.ts to use loader",
75:       "priority": "high",
76:       "status": "pending"
77:     },
78:     {
79:       "content": "Phase 5: Type check + test",
80:       "priority": "high",
81:       "status": "pending"
82:     }
83:   ]
84: }
85: ```
86: 
87: **Output:**
88: ```
89: [
90:   {
91:     "content": "Trace the skill injection mechanism from dist/ → source code",
92:     "priority": "high",
93:     "status": "completed"
94:   },
95:   {
96:     "content": "Determine if the injection is alive/working or dead",
97:     "priority": "high",
98:     "status": "completed"
99:   },
100:   {
101:     "content": "Map current .opencode/skills names vs what the injection expects",
102:     "priority": "high",
103:     "status": "completed"
104:   },
105:   {
106:     "content": "Identify the load-3 logic and per-turn/workflow skill rotation",
107:     "priority": "high",
108:     "status": "completed"
109:   },
110:   {
111:     "content": "Verify front-facing agents (hiveminder, build, plan) skill awareness",
112:     "priority": "medium",
113:     "status": "completed"
114:   },
115:   {
116:     "content": "Report findings to user",
117:     "priority": "high",
118:     "status": "completed"
119:   },
120:   {
121:     "content": "Plan configurable JSON settings feature for skill injection",
122:     "priority": "high",
123:     "status": "completed"
124:   },
125:   {
126:     "content": "Phase 1: Create config/skill-injection.json with corrected skill names",
127:     "priority": "high",
128:     "status": "completed"
129:   },
130:   {
131:     "content": "Phase 2: Create src/shared/skill-injection.types.ts (TypeScript interfaces)",
132:     "priority": "high",
133:     "status": "in_progress"
134:   },
135:   {
136:     "content": "Phase 3: Create src/shared/skill-injection-loader.ts (loader + validator)",
137:     "priority": "high",
138:     "status": "pending"
139:   },
140:   {
141:     "content": "Phase 4: Modify src/plugin/skill-exposure-map.ts to use loader",
142:     "priority": "high",
143:     "status": "pending"
144:   },
145:   {
146:     "content": "Phase 5: Type check + test",
147:     "priority": "high",
148:     "status": "pending"
149:   }
150: ]
151: ```
152: 
153: ---
154: 
155: ## Assistant (Hiveminder · xiaomi/mimo-v2-pro:free · 116.6s)
156: 
157: _Thinking:_
158: 
159: Let me now delegate the actual code implementation to the hivemaker agent. The hivemaker will:1. Create `src/shared/skill-injection.types.ts`
160: 2. Create `src/shared/skill-injection-loader.ts`
161: 3. Modify `src/plugin/skill-exposure-map.ts`4. Add `config` to `files` in `package.json`5. Run type check
162: 
163: Let me dispatch this as a single bounded task since the files are all related.Actually, let me be smarter about this. The user's CLAUDE.md says I'm the orchestrator and should delegate. Let me delegate to the hivemaker with a clear delegation packet.But first, I need to understand what the current `skill-exposure-map.ts` exports so the hivemaker can modify it correctly. 
164: 
165: I already have the key exports from the subagent report: `resolveSkillBundle`, `resolveSessionRole`, `renderSessionRoleDirective`, plus the type and constant exports. Now I'll create a comprehensive delegation packet for the hivemaker.
166: 
167: Now delegating Phases 2-4 to hivemaker. Let me dispatch a single bounded delegation for the implementation.
168: 
169: **Tool: task**
170: 
171: **Input:**
172: ```json
173: {
174:   "description": "Implement skill injection config",
175:   "prompt": "## Delegation Packet\n\n**Target Agent:** hivemaker\n**Scope:** Implement configurable skill injection — create types, loader, modify exposure map, update package.json\n**Context:**\n\nThe project at `/Users/apple/hivemind-plugin/.worktrees/product-detox/` has a skill injection pipeline. Currently `src/plugin/skill-exposure-map.ts` has hardcoded TypeScript constants (`SHARED_SKILLS`, `AGENT_BUNDLES`, `PURPOSE_CONDITIONAL`, `SUBSESSION_ADDITIONS`, `MAX_SKILLS`) that define which skills to inject into agent prompts. These are stale — 11 of 21 skill names don't exist on disk.\n\nThe fix: replace hardcoded constants with a JSON config file. The config file `config/skill-injection.json` is already created at `/Users/apple/hivemind-plugin/.worktrees/product-detox/config/skill-injection.json`.\n\n### What exists now in skill-exposure-map.ts:\n- `SkillEntry` type: `{ name: string; description: string }`\n- `SHARED_SKILLS: SkillEntry[]` — currently `[{ name: 'use-hivemind-delegation', ... }]`\n- `MAX_SKILLS = 7` — should become 3\n- `AGENT_BUNDLES: Record<string, SkillEntry[]>` — 9 agent entries with old skill names\n- `PURPOSE_CONDITIONAL: Record<string, SkillEntry[]>` — 6 purpose entries\n- `SUBSESSION_ADDITIONS: SkillEntry[]`\n- `resolveSkillBundle(activeAgent, purposeClass, sessionState)` — 4-layer waterfall, returns `SkillEntry[]`\n- `resolveSessionRole(sessionState, activeAgent)` — returns `SessionRole`\n- `renderSessionRoleDirective(role)` — returns string\n\nThe file also imports from `./skill-focus-renderer.js` and is imported by `messages-transform-adapter.ts`.\n\n### What also exists:\n- `src/shared/opencode-skill-registry.ts` — has `createOpencodeSkillRegistry(packageRoot)` that scans `{packageRoot}/skills/*/SKILL.md` and returns `OpencodeSkillRegistryEntry[]` with `.id` field\n\n### Tasks (in order):\n\n1. **Create `src/shared/skill-injection.types.ts`** — TypeScript interfaces:\n```typescript\nexport interface SkillEntry {\n  name: string\n  descri... (line truncated to 2000 chars)
176:   "subagent_type": "hivemaker"
177: }
178: ```
179: 
180: **Error:**
181: ```
182: Tool execution aborted
183: ```
184: 
185: ---
186: 
187: ## User
188: 
189: stop there revert implementation I said report and stop you have not totally review what I truly wanted
190: 
191: ---
192: 
193: ## Assistant (Hiveminder · xiaomi/mimo-v2-pro:free · 11.5s)
194: 
195: _Thinking:_
196: 
197: The user is telling me to stop and revert. They said "report and stop" - they wanted me to report findings and NOT implement anything. They want to review the findings first before any implementation happens.
198: 
199: Let me:
200: 1. Stop everything
201: 2. Revert the config file I already created
202: 3. Just present the findings cleanly
203: 
204: Understood. Reverting the file I created.
205: 
206: **Tool: bash**
207: 
208: **Input:**
209: ```json
210: {
211:   "command": "rm -rf /Users/apple/hivemind-plugin/.worktrees/product-detox/config",
212:   "description": "Remove created config directory"
213: }
214: ```
215: 
216: ---
217: 
218: ## Assistant (Hiveminder · xiaomi/mimo-v2-pro:free · 56.3s)
219: 
220: _Thinking:_
221: 
222: The user wanted me to report findings and stop. Let me present a clean report without any implementation.
223: 
224: The `config/` directory is removed. Zero code changes remain.
225: 
226: ---
227: 
228: ## Investigation Report: Skill Injection Pipeline
229: 
230: ### The Injection Mechanism (Traced dist → src)
231: 
232: The injection fires on **every user message** via this chain:
233: 
234: ```
235: opencode-plugin.ts:222            ← registers experimental.chat.messages.transform hook
236:   → messages-transform-adapter.ts:41    ← injection engine
237:     → skill-exposure-map.ts:137         ← resolves skill bundle (HARDCODED — root problem)
238:       → skill-focus-renderer.ts:32      ← renders <available_skills> XML block
239:         → synthetic-parts.ts:12         ← wraps as hidden synthetic Part
240:           → prepended BEFORE user message parts (line 170)
241: ```
242: 
243: Only fires on `variant === 'new'` or `'continue'`. Skips tool results and thinking turns.
244: 
245: ### Status: ALIVE but BROKEN
246: 
247: | Dimension | State |
248: |-----------|-------|
249: | Mechanically functional | YES — hook fires, resolves, renders, injects |
250: | Content correct | NO — 11 of 21 injected skill names don't exist on disk |
251: | MAX_SKILLS | 7 (should be 3 per policy) |
252: | File-system registry connected | NO — `opencode-skill-registry.ts` discovers 15 real skills but is NOT wired to injection |
253: 
254: ### The Core Disconnect
255: 
256: Two systems exist that never talk to each other:
257: 
258: | System | File | What it does | Wired to injection? |
259: |--------|------|-------------|-------------------|
260: | Hardcoded exposure map | `src/plugin/skill-exposure-map.ts` | Static `AGENT_BUNDLES` dict with 21 skill names | **YES** |
261: | File-system registry | `src/shared/opencode-skill-registry.ts` | Scans `.opencode/skills/*/SKILL.md`, discovers 15 real skills | **NO** |
262: 
263: ### Skill Name Drift (21 names in injection map vs 15 skills on disk)
264: 
265: **Skills that exist in `.opencode/skills/` (15):**
266: `hivemind-atomic-commit`, `hivemind-codemap`, `hivemind-gatekeeping`, `hivemind-patterns`, `hivemind-refactor`, `hivemind-spec-driven`, `hivemind-system-debug`, `use-hivemind`, `use-hivemind-context`, `use-hivemind-delegation`, `use-hivemind-git-memory`, `use-hivemind-planning`, `use-hivemind-research`, `use-hivemind-skill-authoring`, `use-hivemind-tdd`
267: 
268: **Old names in injection map that need renaming:**
269: 
270: | Old Name (in code) | New Name (on disk) | Status |
271: |---|---|---|
272: | `hivemind-gatekeeping-delegation` | `hivemind-gatekeeping` | RENAME |
273: | `git-continuity-memory` | `use-hivemind-git-memory` | RENAME |
274: | `tdd-delegation` | `use-hivemind-tdd` | RENAME |
275: | `research-delegation` | `use-hivemind-research` | RENAME |
276: | `spec-distillation` | `hivemind-spec-driven` | RENAME |
277: | `course-correction-delegation` | — | DEPRECATED (split into `hivemind-system-debug` + `hivemind-refactor`) |
278: | `hivemind-research-tools` | — | ABSORBED into `use-hivemind-research` |
279: | `hivemind-research-framework` | — | ABSORBED into `use-hivemind-research` |
280: 
281: **Names in injection map with NO disk equivalent at all (external `.agents/skills/` only):**
282: `verification-before-completion`, `test-driven-development`, `clean-code`, `refactor`, `writing-plans`, `breakdown-plan`, `deep-research`, `systematic-debugging`, `qa-test-planner`, `context-map`
283: 
284: ### Agent Config Drift
285: 
286: Hiveminder's prompt mandates loading 3 skills at session start:
287: 1. `use-hivemind-context-integrity` — **DEPRECATED** (in `_deprecated_hive/`), renamed to `use-hivemind-context`
288: 2. `hivemind-gatekeeping-delegation` — renamed to `hivemind-gatekeeping`
289: 3. `use-hivemind-git-memory` — **EXISTS** ✓
290: 
291: 12 orphaned references across all agent `.md` files point to skills that don't exist in `.opencode/skills/`.
292: 
293: ### What You Need to Decide
294: 
295: 1. **Should the hardcoded `skill-exposure-map.ts` constants be replaced by a JSON config file?** This would let you edit skill names without touching TypeScript — just edit JSON + rebuild.
296: 2. **Should `opencode-skill-registry.ts` be wired to the injection pipeline?** This would auto-validate that injected skill names actually exist on disk.
297: 3. **What should `MAX_SKILLS` be?** Currently 7. Policy says 3. The `use-hivemind` skill says "max 3 active skills loaded simultaneously."
298: 4. **Which of the 15 real skills should each agent bundle contain?** The current bundles were designed around old skill names — the mapping needs rethinking.
299: 
300: No code was changed. Awaiting your direction on how to proceed.
301: 
302: ---
303: 
304: ## User
305: 
306: This is going to be the init (guided run by a premade agent called hivefiver -> this agent will build the settings, configuration that include all of these below, and this is the injection classify to front agents, subagents  carry throughout the course of development and injected conditional based on template with fixed values that have been configured by hivefiver by QA and instruction with users - and both these conditional values and fixed values are only changed (plus the yaml assets set as json schema values are either changed or reset to default values for the indicated fields either internal or of OpenCode official that I am going to describe below) these are back-forth, delegated for exploation and systnehsis and instruciton helping and change to match of the agent hivefiver with the preset of test and schema to exactly matched the predefined schema ->  through three commands 1. hm-init ->>> reset default by interview and confirm with users  2. hm-doctor ->>>> interview user  and discover whats wrong 3. hm-setting ->>>> the step-by-step each selective sets or all sets configuration . And since there is a one faulty legacy CLI init, these above commands and the misleading false sync assets >>>> clean and detach them out first >>>> for the configuration the new approach will include these injection following the template of 1. Main frontfacing  agents (for now just for hivefiver the bootstrap and  the module of this hivemind framework  helper, doctor and initiator (detecting green or brownfield, cleaning and organizing docs and bootstrapting the .hivemind/ folder and what needs inside)  and hiveminder the project team lead to coordinate, orchestrate and delegate the default agents hivehealer, hiveq, hiverd, hivexplorer, hitea, architect, hivemaker, code-skeptic, the explore and general are the fallback of opencode system: the injectioons following setting and categories into main and sub delegation  and since the tokens consumption so only include main and 2n... (line truncated to 2000 chars)
307: 
308: **Current State & Core Problem:**
309: 1.  **Broken Skill Injection:** The pipeline (`opencode-plugin.ts` → `skill-exposure-map.ts`) injects a hardcoded list of 21 skill names. 11 do not exist on disk. The file-system registry (`opencode-skill-registry.ts`) discovers 15 real skills but is not connected to the injection mechanism.
310: 2.  **Configuration Drift:** Agent prompt files contain 12+ orphaned references to deprecated or renamed skills. The `MAX_SKILLS` constant is 7, violating the policy maximum of 3.
311: 3.  **No Unified Config:** Agent definitions, permissions, skills, and tools lack a centralized, schema-based configuration system.
312: 
313: **Required Solution: The `hivefiver` Agent System**
314: Build a `hivefiver` agent that manages the entire configuration lifecycle. It will bootstrap the `.hivemind/` directory, generate configuration files, and ensure all injected values are valid and schema-compliant.
315: 
316: **Phase 1: Clean Legacy Artifacts**
317: - Remove or disable the faulty legacy CLI `init` command.
318: - Identify and detach any misleading "sync" assets or processes that conflict with the new approach.
319: 
320: **Phase 2: Implement `hivefiver` Commands**
321: 1.  **`hm-init`:** Conducts an interview to reset all configuration to defaults for a greenfield or brownfield project. Confirms settings with the user, then bootstraps the `.hivemind/` folder structure and core documents (`PRD.md`, `PROJECT.md`, `STATE.md`, etc.).
322: 2.  **`hm-doctor`:** Diagnoses the current project state. Interviews the user to discover misconfigurations, broken skill references, or drift from schema.
323: 3.  **`hm-setting`:** Provides a step-by-step interface to configure individual setting groups or all settings at once.
324: 
325: **Phase 3: Define Configuration Schema & Injection Logic**
326: All configuration must be defined in a project-level JSON schema file (e.g., `.opencode/opencode.json`), following the official OpenCode documentation for agents, tools, rules, commands, permissions, LSP, MCP servers, skills, and custom tools/plugins.
327: 
328: **A. Fixed Configuration Values (Set by `hivefiver` via QA):**
329: - **Project Planning:** Path to `.hivemind/activity/` (main paths).
330: - **Session Time-Machine:** Path to `.hivemind/sessions/` (include brief instruction on reading verbose logs).
331: - **User Preferences (Front-facing agents only):**
332:     - `user_communication_language`: Language for user interaction.
333:     - `document_language`: Language for documentation and artifacts.
334:     - `user_expert_level`: `beginner` | `intermediate` | `advanced` | `expert`. Each level defines a 2-line communication style (e.g., `beginner`: verbose, explanatory, decision-suggestive; `advanced/expert`: concise, architecture-focused).
335:     - `governance_level`: 4 levels (exclude auto-block). Convert "auto-block" to "halt-investigate-propose" (e.g., for no plan, no hierarchy, poisoned context).
336:     - `operation_mode`: `iterative-interactive` | `research-first` | `yolo`. `iterative-interactive` is default, always consulting user. `research-first` spawns a sub-agent for fresh context each turn. `yolo` is high-autonomy but must enforce all hierarchy, planning, and gatekeeping rules.
337: 
338: **B. Conditional & Fine-Grained Injection (Carried by Sub-agents):**
339: - **Skill Loading Rules:** Defined per agent, per phase, per task classification (`research`, `implementation`, `debug`, `refactor`, `codebase-scan`, `tdd`, `spec-driven`, `investigation`). Each rule specifies:
340:     - `mandatory_skills`: Always load (e.g., 1 skill).
341:     - `high_likelihood_skills`: Probable skills for the context.
342: - **Phase Classification:**
343:     1.  **Project Initiation (Tier 1):** For new or brownfield projects. Mandates creation/update of core docs: `PRD.md`, `PROJECT.md`, `STATE.md`, `ARCHITECTURE.md`, `PITFALLS.md`, `CONCERNS.md`, `CONSTITUTION.md`, `STACK.md`, `SPECIFICATION.md`. Use symlinks if integrating with other frameworks.
344:     2.  **Planning & Execution (Tier 2):** Phase and atomic planning, matched to task classifications above.
345: 
346: **C. Agent Definition Schema:**
347: Default agents (`hiveminder`, `hivehealer`, `hiveq`, `hiverd`, `hivexplorer`, `hitea`, `architect`, `hivemaker`, `code-skeptic`) are defined as flat templates with `name` and `description`. The `hivefiver` configures their full runtime properties: `permissions`, `commands`, `mcp`, `skills`, `custom_tools`, `plugins`. The schema must be stackable and chainable, especially for commands using `$ARGUMENT` and sub-agent delegation.
348: 
349: **Phase 4: Technical Implementation Requirements**
350: 1.  **Replace Hardcoded Map:** Convert `skill-exposure-map.ts` from a static TypeScript dictionary to a dynamic loader that reads from the JSON configuration schema.
351: 2.  **Connect Registry to Injection:** Wire `opencode-skill-registry.ts` into the injection pipeline to validate that all skill names in the configuration exist on disk before injection.
352: 3.  **Enforce `MAX_SKILLS`:** Set the global constant to `3` as per policy.
353: 4.  **Build `hivefiver` as a Module:** Implement `hivefiver` as a bootstrap, doctor, and initiator module within the Hivemind framework. It must detect greenfield vs. brownfield states, clean/organize docs, and bootstrap the `.hivemind/` folder.
354: 5.  **Schema-Aware Build Process:** The build process must compile the default agent templates (as `.ts` files) and the JSON schema into the runtime configuration used by `hivefiver`.
355: 
356: **Final Output:** A fully refactored system where `hivefiver` generates a valid, schema-compliant `opencode.json`. The skill injection pipeline consumes this configuration, injecting only skills that exist on disk, for the correct agents, at the right times, respecting all user and policy constraints. 
357: 
358: ---
359: 
360: ## Assistant (Hiveminder · xiaomi/mimo-v2-pro:free · 36.4s)
361: 
362: _Thinking:_
363: 
364: The user has given me a massive, detailed specification for a complete refactoring of the HiveMind framework's initialization and configuration system. This is not just about the skill injection fix — it's a much larger architectural overhaul.
365: 
366: Let me understand what they're asking:
367: 
368: 1. **Three commands**: `hm-init`, `hm-doctor`, `hm-setting` — managed by a `hivefiver` agent
369: 2. **Configuration schema**: Following OpenCode official docs for agents, tools, rules, commands, permissions, etc.
370: 3. **Fixed values**: User preferences (language, expert level, governance level, operation mode)
371: 4. **Conditional injection**: Per-agent, per-phase, per-task-classification skill loading rules
372: 
373: 
374: 5. **Phase classification**: Tier 1 (project initiation with core docs) and Tier 2 (planning & execution)
375: 6. **Agent templates**: Default agents defined as flat templates, configured by hivefiver
376: 7. **Legacy cleanup**: Remove faulty CLI init, detach false sync assets
377: 8. **Schema-driven**: Everything tied to JSON schema following OpenCode docs
378: 
379: The user sent this massive spec and referenced a file about non-interactive shell. They want me to fully absorb this before responding. This is a huge undertaking — they're essentially redesigning how the entire HiveMind framework initializes and configures itself, moving from ad-hoc setup to a schema-driven, agent-managed system.
380: 
381: I need to focus on understanding their intent first rather than diving into implementation. They're asking me to absorb all the linked OpenCode documentation, understand how each module connects, and then synthesize this into a coherent architecture. The key insight is that `hivefiver` acts as the orchestrator — it's the agent that handles project initialization, doctoring, and settings management, replacing the old CLI approach entirely. I'm seeing the full scope here—this is a major architectural overhaul, not just a quick fix. Rather than diving into implementation, I should map out the existing system thoroughly, identify where the legacy init and false sync assets are causing problems, then design the new hivefiver-driven approach across multiple phases. I'll structure this as a multi-round plan that the user can review and approve before I start building.
382: 
383: **Tool: todowrite**
384: 
385: **Input:**
386: ```json
387: {
388:   "todos": [
389:     {
390:       "content": "Absorb full specification: hivefiver agent system, 3 commands, config schema, injection template",
391:       "priority": "high",
392:       "status": "completed"
393:     },
394:     {
395:       "content": "Investigate legacy CLI init and false sync assets for cleanup",
396:       "priority": "high",
397:       "status": "pending"
398:     },
399:     {
400:       "content": "Map OpenCode docs schema (agents, tools, rules, commands, permissions, skills, plugins)",
401:       "priority": "high",
402:       "status": "pending"
403:     },
404:     {
405:       "content": "Research existing hm-init, hm-doctor, hm-setting command implementations",
406:       "priority": "high",
407:       "status": "pending"
408:     },
409:     {
410:       "content": "Design the hivefiver agent module architecture",
411:       "priority": "high",
412:       "status": "pending"
413:     },
414:     {
415:       "content": "Create multi-round execution plan with phase gates",
416:       "priority": "high",
417:       "status": "pending"
418:     }
419:   ]
420: }
421: ```
422: 
423: **Output:**
424: ```
425: [
426:   {
427:     "content": "Absorb full specification: hivefiver agent system, 3 commands, config schema, injection template",
428:     "priority": "high",
429:     "status": "completed"
430:   },
431:   {
432:     "content": "Investigate legacy CLI init and false sync assets for cleanup",
433:     "priority": "high",
434:     "status": "pending"
435:   },
436:   {
437:     "content": "Map OpenCode docs schema (agents, tools, rules, commands, permissions, skills, plugins)",
438:     "priority": "high",
439:     "status": "pending"
440:   },
441:   {
442:     "content": "Research existing hm-init, hm-doctor, hm-setting command implementations",
443:     "priority": "high",
444:     "status": "pending"
445:   },
446:   {
447:     "content": "Design the hivefiver agent module architecture",
448:     "priority": "high",
449:     "status": "pending"
450:   },
451:   {
452:     "content": "Create multi-round execution plan with phase gates",
453:     "priority": "high",
454:     "status": "pending"
455:   }
456: ]
457: ```
458: 
459: ---
460: 
461: ## Assistant (Hiveminder · xiaomi/mimo-v2-pro:free · 298.8s)
462: 
463: _Thinking:_
464: 
465: This is a massive undertaking. The user has given me a very detailed specification. Let me break down what I need to do:
466: 
467: 1. First, I need to investigate the current state — legacy CLI, sync assets, existing hm-init/hm-doctor/hm-setting
468: 2. Map the OpenCode docs schema
469: 3. Design the new system
470: 4. Create a multi-round plan
471: 
472: But the user's CLAUDE.md says: "When user says 'plan' → ALWAYS create high-level routed/conditional multi-round plan. NEVER create ready-to-implement detailed specifications. Master plan = orchestration guide for multiple agent cycles. Each cycle requires user authorization before proceeding."
473: 
474: 
475: I see now — they're asking me to plan without executing, and I already created that config file when they explicitly asked me to stop and report. I need to refocus on just analyzing the current state and laying out the approach without making any changes.
476: 
477: This is a significantly larger scope than the initial skill injection fix. Let me investigate the full current state before proposing any plan.
478: 
479: **Tool: task**
480: 
481: **Input:**
482: ```json
483: {
484:   "description": "Find legacy CLI init code",
485:   "prompt": "I need to find ALL legacy CLI init code in this project. Search in /Users/apple/hivemind-plugin/.worktrees/product-detox/ for:\n\n1. Any CLI init command implementation — search for \"hm-init\", \"init\" in src/cli/, src/commands/, bin/\n2. Any \"sync\" assets or processes — search for \"sync\", \"false sync\", \"asset sync\" in src/, scripts/, commands/\n3. The current hm-init, hm-doctor, hm-setting command implementations — search for these exact strings in all .ts, .js, .md files\n4. Any initialization/bootstrap code in src/ that sets up .hivemind/ directory\n5. Check dist/ for compiled init/doctor/setting commands\n6. Check bin/ for CLI entry points\n7. Check commands/ directory for any init/doctor/setting command markdown files\n\nFor each finding, return:\n- The exact file path\n- The line range\n- A brief description of what it does\n- Whether it's \"alive\" (compiled to dist/) or \"dead\" (only in src/)\n\nBe thorough — check src/cli/, src/commands/, src/control-plane/, commands/, bin/, scripts/",
486:   "subagent_type": "explore"
487: }
488: ```
489: 
490: **Output:**
491: ```
492: task_id: ses_2da47685cffekF3qAeVGQuPs3V (for resuming to continue this task if needed)
493: 
494: <task_result>
495: Now I have all the data needed. Here is the complete investigation report.
496: 
497: ---
498: 
499: ## Codebase Investigation Report
500: 
501: **Scope:** Legacy CLI init code (hm-init, hm-doctor, hm-settings, hm-harness, hm-sync) in `/Users/apple/hivemind-plugin/.worktrees/product-detox/`
502: **Question:** Find ALL legacy CLI init command implementations, sync assets, initialization/bootstrap code, compiled dist output, and command markdown files.
503: 
504: ---
505: 
506: ### Findings
507: 
508: #### 1. CLI Entry Point
509: 
510: | # | Finding | File | Line | Evidence |
511: |---|---------|------|------|----------|
512: | 1 | Main CLI entry — dispatches init/doctor/settings/harness/sync commands | `src/cli.ts` | 1-194 | `#!/usr/bin/env node` entry, `runCli()` dispatches to `initProject`, `runDoctorCommand`, `runSettingsCommand`, `runHarnessCommand`, `syncRuntimeSurface` based on resolved command |
513: | 2 | Compiled CLI binary (ALIVE) | `dist/cli.js` | 1 | 7815 bytes, executable — this is what `hm-init`, `hm-doctor`, `hm-settings`, `hm-harness`, `hm-sync` all point to |
514: 
515: #### 2. CLI Command Routing
516: 
517: | # | Finding | File | Line | Evidence |
518: |---|---------|------|------|----------|
519: | 3 | Command routing — resolves binary aliases to CLI commands | `src/cli/command-routing.ts` | 1-50 | Maps `hm-init`→`init`, `hm-doctor`→`doctor`, `hm-settings`→`settings`, `hm-harness`→`harness`, `hm-sync`→`sync`. Compiled to `dist/cli/command-routing.js` |
520: 
521: #### 3. CLI Thin Re-Export Wrappers (src/cli/)
522: 
523: | # | Finding | File | Line | Evidence |
524: |---|---------|------|------|----------|
525: | 4 | Init re-export | `src/cli/init.ts` | 1-2 | `export { initProject } from '../features/runtime-entry/index.js'` — thin barrel |
526: | 5 | Doctor re-export | `src/cli/doctor.ts` | 1-2 | `export { runDoctorCommand } from '../features/runtime-entry/index.js'` — thin barrel |
527: | 6 | Settings re-export | `src/cli/settings.ts` | 1-116 | **Substantive** — `updateProjectSettings()` and `runSettingsCommand()` with intake gate logic |
528: | 7 | Harness re-export | `src/cli/harness.ts` | 1-2 | `export { runHarnessCommand } from '../features/runtime-entry/index.js'` — thin barrel |
529: | 8 | Runtime assets sync wrapper | `src/cli/runtime-assets.ts` | 1-26 | `syncRuntimeSurface()` wraps `../features/runtime-observability/sync.js` with package-specific options. Compiled to `dist/cli/runtime-assets.js` |
530: 
531: All compiled to `dist/cli/*.js` — **ALIVE**.
532: 
533: #### 4. Feature Implementation — Runtime Entry (src/features/runtime-entry/)
534: 
535: | # | Finding | File | Line | Evidence |
536: |---|---------|------|------|----------|
537: | 9 | Init barrel/decoupler | `src/features/runtime-entry/init.ts` | 1-25 | Re-exports from `init.types.js`, `init.helpers.js`, `init-project.js`, `init.handler.js` |
538: | 10 | Init types | `src/features/runtime-entry/init.types.ts` | 1-57 | `InitOptions`, `InitProjectResult` interfaces |
539: | 11 | Init helpers | `src/features/runtime-entry/init.helpers.ts` | 1-37 | `buildInitReport()`, `createRuntimeId()` |
540: | 12 | **Init project entry** | `src/features/runtime-entry/init-project.ts` | 1-126 | `initProject()` — CLI entry point for hm-init. Resolves intake gates, executes hm-init command bundle |
541: | 13 | **Init handler** | `src/features/runtime-entry/init.handler.ts` | 1-275 | `runInitHandler()` — Deep handler that bootstraps workflow authority, trajectory ledger, recovery checkpoint, planning projection, calls `syncRuntimeSurface` (line 126) |
542: | 14 | **Doctor CLI entry** | `src/features/runtime-entry/doctor.ts` | 41-71 | `runDoctorCommand()` — finds hm-doctor bundle, executes it |
543: | 15 | **Doctor handler** | `src/features/runtime-entry/doctor.ts` | 73-161 | `runDoctorHandler()` — repairs recovery state, syncs runtime surface (line 99), creates checkpoint |
544: | 16 | Settings handler | `src/features/runtime-entry/settings.ts` | 1-21 | `runSettingsHandler` imported from here. Contains settings business logic |
545: | 17 | Feature barrel | `src/features/runtime-entry/index.ts` | 1-11 | Re-exports all runtime-entry modules including init, doctor, harness, settings |
546: 
547: All compiled to `dist/features/runtime-entry/*.js` — **ALIVE**.
548: 
549: #### 5. Sync/Runtime Assets
550: 
551: | # | Finding | File | Line | Evidence |
552: |---|---------|------|------|----------|
553: | 18 | **Core sync implementation** | `src/features/runtime-observability/sync.ts` | 1-108 | `syncRuntimeSurface()` — creates `.opencode/plugins/hivemind-context-governance.ts` stub, updates `opencode.json` plugin array. Writes files via `mkdir` + `writeFile`. Compiled to `dist/features/runtime-observability/sync.js` — **ALIVE** |
554: | 19 | Sync callers | `src/features/runtime-entry/init.handler.ts` | 12, 126 | `import { syncRuntimeSurface } from '../../cli/runtime-assets.js'` — called during init |
555: | 20 | Sync callers | `src/features/runtime-entry/doctor.ts` | 6, 99 | `import { syncRuntimeSurface } from '../../cli/runtime-assets.js'` — called during doctor when healthy |
556: | 21 | Sync CLI command | `src/cli.ts` | 169-171 | `case 'sync': result = await syncRuntimeSurface(directory)` |
557: 
558: #### 6. Control Plane Layer
559: 
560: | # | Finding | File | Line | Evidence |
561: |---|---------|------|------|----------|
562: | 22 | **Control plane handler dispatch** | `src/control-plane/control-plane-handler.ts` | 1-32 | Routes `hm-init`→`runInitHandler`, `hm-doctor`→`runDoctorHandler`, `hm-harness`→`runHarnessHandler`, `hm-settings`→`runSettingsHandler` |
563: | 23 | **Control plane registry** | `src/control-plane/control-plane-registry.ts` | 1-268 | Registers all 4 primitives with keywords, binary aliases, CLI commands, detection logic. Compiled to `dist/control-plane/` — **ALIVE** |
564: | 24 | Control plane types | `src/control-plane/control-plane-types.ts` | 4 | `type ControlPlanePrimitiveId = 'hm-init' \| 'hm-doctor' \| 'hm-harness' \| 'hm-settings'` |
565: 
566: #### 7. Command Bundle Registry
567: 
568: | # | Finding | File | Line | Evidence |
569: |---|---------|------|------|----------|
570: | 25 | **hm-init bundle** | `src/commands/slash-command/command-bundles.ts` | 5-22 | `id: 'hm-init'`, `commandFile: 'hm-init.md'`, `controlPlanePrimitiveId: 'hm-init'` |
571: | 26 | **hm-doctor bundle** | `src/commands/slash-command/command-bundles.ts` | 23-40 | `id: 'hm-doctor'`, `commandFile: 'hm-doctor.md'` |
572: | 27 | **hm-harness bundle** | `src/commands/slash-command/command-bundles.ts` | 41-58 | `id: 'hm-harness'`, `commandFile: 'hm-harness.md'` |
573: | 28 | **hm-settings bundle** | `src/commands/slash-command/command-bundles.ts` | 59-76 | `id: 'hm-settings'`, `commandFile: 'hm-settings.md'` |
574: 
575: #### 8. Command Markdown Files
576: 
577: | # | Finding | File | Line | Evidence |
578: |---|---------|------|------|----------|
579: | 29 | hm-init command (root) | `commands/hm-init.md` | 1-60 | Bootstrap control plane command — references `hivemind_runtime_command` with `command: "hm-init"` |
580: | 30 | hm-doctor command (root) | `commands/hm-doctor.md` | 1-39 | Repair command — diagnose, repair, recovery path |
581: | 31 | hm-settings command (root) | `commands/hm-settings.md` | 1-57 | Settings reconfiguration — references `hivemind_runtime_command` with `command: "hm-settings"` |
582: | 32 | hm-init command (.opencode) | `.opencode/commands/hm-init.md` | 1 | Mirror of root — **NOISE**: `.opencode/commands/` is dev projection, not shipped |
583: | 33 | hm-doctor command (.opencode) | `.opencode/commands/hm-doctor.md` | 1 | Mirror — **NOISE** |
584: | 34 | hm-settings command (.opencode) | `.opencode/commands/hm-settings.md` | 1 | Mirror — **NOISE** |
585: 
586: #### 9. package.json Binary Declarations
587: 
588: | # | Finding | File | Line | Evidence |
589: |---|---------|------|------|----------|
590: | 35 | **All 6 CLI binaries** | `package.json` | 18-26 | `hivemind-context-governance`, `hivemind`, `hm-init`, `hm-doctor`, `hm-settings`, `hm-harness`, `hm-sync` — ALL point to `dist/cli.js` |
591: 
592: #### 10. bin/ Directory
593: 
594: | # | Finding | File | Line | Evidence |
595: |---|---------|------|------|----------|
596: | 36 | **hivemind-tools.cjs** | `bin/hivemind-tools.cjs` | 1-1406+ | Separate legacy CLI tool (CJS). Contains `trace-paths`, `verify-install`, `migrate-check`, `inspect`, `validate`, `ecosystem-check`, `source-audit`. References `.hivemind/` init concepts (line 269: "`.hivemind/ directory missing — run \`hivemind init\`'"). NOT compiled to dist — **SEPARATE** from the main CLI |
597: 
598: #### 11. Deprecated Sync Scripts
599: 
600: | # | Finding | File | Line | Evidence |
601: |---|---------|------|------|----------|
602: | 37 | **Agent registry sync (DEAD)** | `scripts/sync-agent-registry.ts.deprecated` | 1-28 | Regenerates `.opencode/agents/*.md` from canonical `agents/*.deprecated.md`. Uses `createOpencodeAgentRegistry`. File extension `.deprecated` — **DEAD** |
603: | 38 | **Agent registry parity check (DEAD)** | `scripts/check-agent-registry-parity.sh.deprecated` | 1-8 | Shell script that runs the deprecated sync script — **DEAD** |
604: 
605: #### 12. .hivemind/ Directory Bootstrap
606: 
607: | # | Finding | File | Line | Evidence |
608: |---|---------|------|------|----------|
609: | 39 | No explicit `.hivemind/` mkdir in init code | `src/features/runtime-entry/` | N/A | The init handler does NOT directly `mkdir .hivemind/`. It delegates to subsystem modules (`bootstrapWorkflowAuthority`, `bootstrapTrajectoryLedger`, `createRecoveryCheckpoint`, etc.) which write to `.hivemind/` subdirectories. The only explicit `mkdir` in sync is for `.opencode/plugins/` (sync.ts line 101) |
610: | 40 | Test creates `.hivemind/agent-work-contract/` | `src/features/agent-work-contract/tools/export-contract-tool.test.ts` | 178 | `await mkdir(join(projectRoot, '.hivemind', 'agent-work-contract'), { recursive: true })` — test-only |
611: 
612: ---
613: 
614: ### Structure Map
615: 
616: ```
617: CLI Flow:
618:   package.json bin → dist/cli.js → src/cli.ts → src/cli/command-routing.ts
619:                         │
620:                         ├── init    → src/cli/init.ts → src/features/runtime-entry/init-project.ts → init.handler.ts
621:                         ├── doctor  → src/cli/doctor.ts → src/features/runtime-entry/doctor.ts
622:                         ├── settings→ src/cli/settings.ts (substantive, runs via command bundle)
623:                         ├── harness → src/cli/harness.ts → src/features/runtime-entry/harness.ts
624:                         └── sync    → src/cli/runtime-assets.ts → src/features/runtime-observability/sync.ts
625: 
626: Control Plane:
627:   src/control-plane/control-plane-registry.ts  (primitives, detection, keywords)
628:   src/control-plane/control-plane-handler.ts    (routes to handler functions)
629:   src/control-plane/control-plane-intake.ts     (profile resolution, gates)
630: 
631: Command Contracts:
632:   commands/hm-init.md        (root projection — LIVE, registered)
633:   commands/hm-doctor.md      (root projection — LIVE, registered)
634:   commands/hm-settings.md    (root projection — LIVE, registered)
635:   .opencode/commands/*.md    (dev mirror — NOISE, not authoritative)
636: 
637: bin/hivemind-tools.cjs       (separate legacy CJS CLI — NOT part of dist/cli.js)
638: scripts/*.deprecated         (DEAD sync scripts)
639: ```
640: 
641: ### Summary: ALIVE vs DEAD
642: 
643: | Status | Files |
644: |--------|-------|
645: | **ALIVE** (compiled to `dist/`) | `src/cli.ts`, `src/cli/init.ts`, `src/cli/doctor.ts`, `src/cli/settings.ts`, `src/cli/harness.ts`, `src/cli/runtime-assets.ts`, `src/cli/command-routing.ts`, `src/features/runtime-entry/*.ts`, `src/features/runtime-observability/sync.ts`, `src/control-plane/*` |
646: | **ALIVE** (shipped as-is) | `commands/hm-init.md`, `commands/hm-doctor.md`, `commands/hm-settings.md`, `bin/hivemind-tools.cjs` |
647: | **DEAD** (deprecated) | `scripts/sync-agent-registry.ts.deprecated`, `scripts/check-agent-registry-parity.sh.deprecated` |
648: | **NOISE** (dev-only mirror) | `.opencode/commands/hm-init.md`, `.opencode/commands/hm-doctor.md`, `.opencode/commands/hm-settings.md` |
649: </task_result>
650: ```
651: 
652: **Tool: task**
653: 
654: **Input:**
655: ```json
656: {
657:   "description": "Map OpenCode docs schema",
658:   "prompt": "I need to understand the OpenCode configuration schema. The user referenced these docs:\n- https://opencode.ai/docs/agents/\n- https://opencode.ai/docs/tools/\n- https://opencode.ai/docs/rules/\n- https://opencode.ai/docs/commands/\n- https://opencode.ai/docs/permissions/\n- https://opencode.ai/docs/lsp/\n- https://opencode.ai/docs/mcp-servers/\n- https://opencode.ai/docs/skills/\n- https://opencode.ai/docs/custom-tools/\n- https://opencode.ai/docs/plugins/\n\nAlso check the file at /Users/apple/hivemind-plugin/.worktrees/product-detox/docs/synthesis/opencode-non-interactive-shell.md\n\nFor each doc URL, fetch the content and return:\n1. The JSON schema structure for that entity type\n2. Required vs optional fields\n3. How they're configured in opencode.json\n\nAlso read the current /Users/apple/hivemind-plugin/.worktrees/product-detox/opencode.json to see what's already configured.\n\nAlso check if there's an existing OpenCode schema file or TypeScript types for the opencode.json format anywhere in the project.\n\nReturn a complete mapping of the OpenCode configuration schema.",
659:   "subagent_type": "hiverd"
660: }
661: ```
662: 
663: **Output:**
664: ```
665: task_id: ses_2da476772ffekwbKgQfphBWJKB (for resuming to continue this task if needed)
666: 
667: <task_result>
668: ## External Research Report
669: 
670: **Question:** Complete OpenCode configuration schema mapping for opencode.json
671: **Sources Checked:** 15 (10 doc URLs + 5 local files)
672: **Research Date:** 2026-03-25
673: **Freshness:** All sources accessed 2026-03-25 (current)
674: 
675: ---
676: 
677: ### Executive Summary
678: 
679: The OpenCode configuration schema is a JSON object with `$schema` reference to `https://opencode.ai/config.json`. The configuration supports multiple entity types: agents, commands, tools, permissions, MCP servers, plugins, LSP servers, formatters, skills, and more. Configuration is **merged across layers** (remote → global → project), not replaced.
680: 
681: ---
682: 
683: ## Complete Schema Mapping
684: 
685: ### Top-Level Configuration Entity
686: 
687: ```typescript
688: // Root Configuration Schema
689: interface OpenCodeConfig {
690:   "$schema"?: string;                    // JSON schema reference
691:   "logLevel"?: "DEBUG" | "INFO" | "WARN" | "ERROR";
692:   
693:   // Server Configuration
694:   "server"?: ServerConfig;
695:   
696:   // Agent Configuration  
697:   "agent"?: Record<string, AgentConfig>;
698:   "default_agent"?: string;
699:   
700:   // Command Configuration
701:   "command"?: Record<string, CommandConfig>;
702:   
703:   // Tools Configuration (deprecated, use permission)
704:   "tools"?: Record<string, boolean>;
705:   
706:   // Permission Configuration
707:   "permission"?: PermissionConfig;
708:   
709:   // Model Configuration
710:   "model"?: string;                      // Format: "provider/model-id"
711:   "small_model"?: string;
712:   
713:   // Provider Configuration
714:   "provider"?: Record<string, ProviderConfig>;
715:   "disabled_providers"?: string[];
716:   "enabled_providers"?: string[];
717:   
718:   // MCP Servers
719:   "mcp"?: Record<string, MCPConfig>;
720:   
721:   // Plugins
722:   "plugin"?: string[];
723:   
724:   // Formatters
725:   "formatter"?: FormatterConfig | false;
726:   
727:   // LSP Servers
728:   "lsp"?: LSPConfig | false;
729:   
730:   // Skills
731:   "skills"?: {
732:     "paths"?: string[];
733:     "urls"?: string[];
734:   };
735:   
736:   // Instructions/Rules
737:   "instructions"?: string[];
738:   
739:   // Other
740:   "snapshot"?: boolean;
741:   "share"?: "manual" | "auto" | "disabled";
742:   "autoupdate"?: boolean | "notify";
743:   "username"?: string;
744:   "watcher"?: { "ignore"?: string[] };
745:   "compaction"?: {
746:     "auto"?: boolean;
747:     "prune"?: boolean;
748:     "reserved"?: number;
749:   };
750:   "experimental"?: Record<string, unknown>;
751: }
752: ```
753: 
754: ---
755: 
756: ### 1. AGENTS Schema
757: 
758: **Doc Source:** https://opencode.ai/docs/agents/
759: **Confidence:** HIGH | **Freshness:** Current (2026-03-25)
760: 
761: #### Agent Configuration Schema
762: 
763: ```typescript
764: interface AgentConfig {
765:   // REQUIRED
766:   "description": string;                  // What agent does, when to use
767:   
768:   // OPTIONAL
769:   "mode"?: "primary" | "subagent" | "all";  // How agent can be used
770:   "model"?: string;                      // Override model, format: "provider/model-id"
771:   "prompt"?: string;                     // Path to custom prompt file "{file:./prompts/build.txt}"
772:   "temperature"?: number;                 // 0.0-1.0, randomness
773:   "top_p"?: number;                      // 0.0-1.0, diversity alternative to temperature
774:   "steps"?: number;                      // Max agentic iterations (replaces deprecated maxSteps)
775:   "maxSteps"?: number;                   // @deprecated, use steps
776:   "disable"?: boolean;                   // Disable the agent
777:   "hidden"?: boolean;                    // Hide from @ autocomplete (subagents only)
778:   "color"?: string;                     // Hex (e.g., "#FF5733") or theme color
779:   "tools"?: Record<string, boolean>;     // @deprecated, use permission
780:   "permission"?: PermissionConfig;       // Fine-grained permissions
781:   
782:   // Any additional properties passed to provider as model options
783:   [key: string]: unknown;
784: }
785: ```
786: 
787: #### Agent Mode Values
788: | Mode | Description |
789: |------|-------------|
790: | `primary` | Main agent, interact directly, cycle with Tab |
791: | `subagent` | Invoke via @ mention or Task tool |
792: | `all` | Default, can be used both ways |
793: 
794: #### Built-in Agents
795: | Agent | Mode | Default Tools |
796: |-------|------|---------------|
797: | `build` | primary | All tools enabled |
798: | `plan` | primary | Read-only (edit/bash denied) |
799: | `general` | subagent | Full except todo |
800: | `explore` | subagent | Read-only |
801: | `compaction` | primary | Hidden, auto-system |
802: | `title` | primary | Hidden, auto-system |
803: | `summary` | primary | Hidden, auto-system |
804: 
805: #### Required vs Optional Fields
806: | Field | Required | Default |
807: |--------|----------|---------|
808: | `description` | **YES** | - |
809: | `mode` | No | `all` |
810: | `model` | No | Global model (primary) or parent model (subagent) |
811: | `prompt` | No | Built-in prompt |
812: | `temperature` | No | Model defaults (usually 0) |
813: | `top_p` | No | Model defaults |
814: | `steps` | No | Unlimited |
815: | `disable` | No | `false` |
816: | `hidden` | No | `false` |
817: | `color` | No | Theme default |
818: | `tools` | No | All true (deprecated) |
819: | `permission` | No | Global permissions |
820: 
821: #### opencode.json Examples
822: 
823: ```json
824: {
825:   "$schema": "https://opencode.ai/config.json",
826:   "agent": {
827:     "build": {
828:       "mode": "primary",
829:       "model": "anthropic/claude-sonnet-4-20250514",
830:       "prompt": "{file:./prompts/build.txt}",
831:       "tools": {
832:         "write": true,
833:         "edit": true,
834:         "bash": true
835:       }
836:     },
837:     "plan": {
838:       "mode": "primary",
839:       "model": "anthropic/claude-haiku-4-20250514",
840:       "tools": {
841:         "write": false,
842:         "edit": false,
843:         "bash": false
844:       }
845:     },
846:     "code-reviewer": {
847:       "description": "Reviews code for best practices and potential issues",
848:       "mode": "subagent",
849:       "model": "anthropic/claude-sonnet-4-20250514",
850:       "prompt": "You are a code reviewer. Focus on security, performance, and maintainability.",
851:       "tools": {
852:         "write": false,
853:         "edit": false
854:       }
855:     }
856:   }
857: }
858: ```
859: 
860: ---
861: 
862: ### 2. COMMANDS Schema
863: 
864: **Doc Source:** https://opencode.ai/docs/commands/
865: **Confidence:** HIGH | **Freshness:** Current (2026-03-25)
866: 
867: #### Command Configuration Schema
868: 
869: ```typescript
870: interface CommandConfig {
871:   // REQUIRED
872:   "template": string;                    // Prompt sent to LLM when command executes
873:   
874:   // OPTIONAL
875:   "description"?: string;               // Shown in TUI
876:   "agent"?: string;                     // Agent to execute (subagent by default)
877:   "model"?: string;                      // Override default model
878:   "subtask"?: boolean;                  // Force subagent invocation
879: }
880: ```
881: 
882: #### Placeholders in Template
883: | Placeholder | Description |
884: |-------------|-------------|
885: | `$ARGUMENTS` | All arguments passed to command |
886: | `$1`, `$2`, `$3` | Individual positional arguments |
887: | `!`command`` | Inject bash command output |
888: | `@filename` | Include file content |
889: 
890: #### Required vs Optional Fields
891: | Field | Required | Default |
892: |--------|----------|---------|
893: | `template` | **YES** | - |
894: | `description` | No | - |
895: | `agent` | No | Current agent |
896: | `model` | No | Current model |
897: | `subtask` | No | `false` |
898: 
899: #### opencode.json Examples
900: 
901: ```json
902: {
903:   "command": {
904:     "test": {
905:       "template": "Run the full test suite with coverage report and show any failures.\nFocus on the failing tests and suggest fixes.",
906:       "description": "Run tests with coverage",
907:       "agent": "build",
908:       "model": "anthropic/claude-3-5-sonnet-20241022"
909:     },
910:     "component": {
911:       "template": "Create a new React component named $ARGUMENTS with TypeScript support.\nInclude proper typing and basic structure.",
912:       "description": "Create a new component"
913:     }
914:   }
915: }
916: ```
917: 
918: #### Markdown Command Files
919: - Location: `.opencode/commands/` (project) or `~/.config/opencode/commands/` (global)
920: - Filename becomes command name
921: - Frontmatter defines options
922: 
923: ---
924: 
925: ### 3. PERMISSIONS Schema
926: 
927: **Doc Source:** https://opencode.ai/docs/permissions/
928: **Confidence:** HIGH | **Freshness:** Current (2026-03-25)
929: 
930: #### Permission Configuration Schema
931: 
932: ```typescript
933: type PermissionAction = "allow" | "ask" | "deny";
934: 
935: interface PermissionConfig {
936:   "*"?: PermissionAction;              // Catch-all
937:   "read"?: PermissionRule;
938:   "edit"?: PermissionRule;              // Covers edit, write, patch, multiedit
939:   "glob"?: PermissionRule;
940:   "grep"?: PermissionRule;
941:   "list"?: PermissionRule;
942:   "bash"?: PermissionRule;
943:   "task"?: PermissionRule;              // Subagent invocation
944:   "skill"?: PermissionRule;
945:   "lsp"?: PermissionRule;
946:   "todoread"?: PermissionAction;
947:   "todowrite"?: PermissionAction;
948:   "webfetch"?: PermissionAction;
949:   "websearch"?: PermissionAction;
950:   "codesearch"?: PermissionAction;
951:   "external_directory"?: PermissionRule;
952:   "doom_loop"?: PermissionAction;
953:   [key: string]: PermissionRule | PermissionAction | unknown;
954: }
955: 
956: type PermissionRule = 
957:   | PermissionAction                    // Simple: "allow" | "ask" | "deny"
958:   | PermissionObject;                   // Granular: { "pattern": action, ... }
959: 
960: interface PermissionObject {
961:   [pattern: string]: PermissionAction;
962: }
963: ```
964: 
965: #### Pattern Matching
966: - `*` - Matches zero or more of any character
967: - `?` - Matches exactly one character
968: - `~` or `$HOME` - Home directory expansion
969: - Last matching rule wins
970: 
971: #### Available Permission Keys
972: | Permission | Description | Default |
973: |------------|-------------|---------|
974: | `read` | Reading files | `allow` (`.env` denied) |
975: | `edit` | File modifications | `allow` |
976: | `glob` | File globbing | `allow` |
977: | `grep` | Content search | `allow` |
978: | `list` | Directory listing | `allow` |
979: | `bash` | Shell commands | `allow` |
980: | `task` | Subagent invocation | `allow` |
981: | `skill` | Skill loading | `allow` |
982: | `lsp` | LSP queries | `allow` |
983: | `todoread` | Reading todos | `allow` |
984: | `todowrite` | Writing todos | `allow` |
985: | `webfetch` | Fetching URLs | `allow` |
986: | `websearch` | Web search | `allow` |
987: | `codesearch` | Code search | `allow` |
988: | `external_directory` | Paths outside workspace | `ask` |
989: | `doom_loop` | Repeated identical tool calls | `ask` |
990: 
991: #### Required vs Optional Fields
992: | Field | Required | Default |
993: |--------|----------|---------|
994: | All permission keys | No | `allow` (most), `ask` (external_directory, doom_loop) |
995: 
996: #### opencode.json Examples
997: 
998: ```json
999: {
1000:   "permission": {
1001:     "*": "ask",
1002:     "bash": "allow",
1003:     "edit": "deny",
1004:     "webfetch": "allow",
1005:     "bash": {
1006:       "*": "ask",
1007:       "git *": "allow",
1008:       "npm *": "allow",
1009:       "rm *": "deny",
1010:       "grep *": "allow"
1011:     },
1012:     "edit": {
1013:       "*": "deny",
1014:       "packages/web/src/content/docs/*.mdx": "allow"
1015:     }
1016:   }
1017: }
1018: ```
1019: 
1020: ---
1021: 
1022: ### 4. TOOLS Schema
1023: 
1024: **Doc Source:** https://opencode.ai/docs/tools/
1025: **Confidence:** HIGH | **Freshness:** Current (2026-03-25)
1026: 
1027: #### Built-in Tools
1028: | Tool | Description | Permission Key |
1029: |------|-------------|----------------|
1030: | `bash` | Execute shell commands | `bash` |
1031: | `edit` | Modify existing files | `edit` |
1032: | `write` | Create/overwrite files | `edit` |
1033: | `read` | Read file contents | `read` |
1034: | `grep` | Search with regex | `grep` |
1035: | `glob` | Find files by pattern | `glob` |
1036: | `list` | List directory contents | `list` |
1037: | `lsp` | LSP interactions (experimental) | `lsp` |
1038: | `patch` | Apply patches | `edit` |
1039: | `skill` | Load skill files | `skill` |
1040: | `todowrite` | Manage todos | `todowrite` |
1041: | `todoread` | Read todos | `todoread` |
1042: | `webfetch` | Fetch web content | `webfetch` |
1043: | `websearch` | Search web (Exa) | `websearch` |
1044: | `question` | Ask user questions | `question` |
1045: 
1046: #### Note
1047: Tools are controlled via `permission` config, not `tools` boolean config (deprecated).
1048: 
1049: ---
1050: 
1051: ### 5. MCP SERVERS Schema
1052: 
1053: **Doc Source:** https://opencode.ai/docs/mcp-servers/
1054: **Confidence:** HIGH | **Freshness:** Current (2026-03-25)
1055: 
1056: #### MCP Configuration Schema
1057: 
1058: ```typescript
1059: interface MCPConfig {
1060:   // Common

(Output capped at 50 KB. Showing lines 1-1060. Use offset=1061 to continue.)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/opencode"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/opencode</path>
<type>directory</type>
<entries>
opencode-agents.md
opencode-built-in-tools.md
opencode-commands.md
opencode-configs.md
opencode-custom-tools.md
opencode-plugins.md
opencode-rules.md
opencode-sdk.md
repomix-opencode.md
repomix-opencode.xml

(10 entries)
</entries>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/json-render"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/json-render</path>
<type>directory</type>
<entries>
repomix-json-render.xml

(1 entries)
</entries>
```

---

## Assistant (Hivefiver · xiaomi/mimo-v2-pro:free · 15.5s)

_Thinking:_

The user wants me to continue work from the session file. Let me read the rest of the session file and also the other SDK docs to understand the full picture. The session file was truncated. Let me read the rest.

Key tasks from the session:
1. The user wants a hivefiver agent system that manages configuration lifecycle
2. Three commands: hm-init, hm-doctor, hm-setting
3. Configuration schema following OpenCode official docs
4. Fixed values (user preferences) and conditional injection (per-agent, per-phase, per-task skills)
5. Phase classification (Tier 1: project initiation, Tier 2: planning & execution)


6. Now I need to build a TUI or GUI using Vercel JSON Render with the OpenCode SDK to display and manage these configurations, then read through the remaining session documentation and SDK files to get the full context.

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin/.worktrees/product-detox/session-ses_2da9.md",
  "offset": 1061
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin/.worktrees/product-detox/session-ses_2da9.md</path>
<type>file</type>
<content>1061:   "type": "local" | "remote";          // REQUIRED
1062:   "enabled"?: boolean;                  // Default: true
1063:   "timeout"?: number;                   // ms, default: 5000
1064:   
1065:   // Local Only
1066:   "command"?: string[];                  // REQUIRED for local
1067:   "environment"?: Record<string, string>;
1068:   
1069:   // Remote Only
1070:   "url"?: string;                       // REQUIRED for remote
1071:   "headers"?: Record<string, string>;
1072:   "oauth"?: OAuthConfig | false;
1073: }
1074: 
1075: interface OAuthConfig {
1076:   "clientId"?: string;
1077:   "clientSecret"?: string;
1078:   "scope"?: string;
1079: }
1080: ```
1081: 
1082: #### Required vs Optional Fields
1083: | Field | Required | Type | Default |
1084: |--------|----------|-------|---------|
1085: | `type` | **YES** | `"local"` \| `"remote"` | - |
1086: | `command` | **YES** (local) | `string[]` | - |
1087: | `url` | **YES** (remote) | `string` | - |
1088: | `enabled` | No | `boolean` | `true` |
1089: | `timeout` | No | `number` | `5000` |
1090: | `environment` | No | `object` | - |
1091: | `headers` | No | `object` | - |
1092: | `oauth` | No | `object \| false` | Auto-detect |
1093: 
1094: #### opencode.json Examples
1095: 
1096: ```json
1097: {
1098:   "mcp": {
1099:     "sentry": {
1100:       "type": "remote",
1101:       "url": "https://mcp.sentry.dev/mcp",
1102:       "oauth": {}
1103:     },
1104:     "context7": {
1105:       "type": "remote",
1106:       "url": "https://mcp.context7.com/mcp",
1107:       "headers": {
1108:         "CONTEXT7_API_KEY": "{env:CONTEXT7_API_KEY}"
1109:       }
1110:     },
1111:     "repomix": {
1112:       "type": "local",
1113:       "command": ["npx", "-y", "repomix", "--mcp"],
1114:       "enabled": false
1115:     }
1116:   }
1117: }
1118: ```
1119: 
1120: ---
1121: 
1122: ### 6. PLUGINS Schema
1123: 
1124: **Doc Source:** https://opencode.ai/docs/plugins/
1125: **Confidence:** HIGH | **Freshness:** Current (2026-03-25)
1126: 
1127: #### Plugin Configuration
1128: 
1129: ```typescript
1130: // Plugin is an array of plugin identifiers (npm package names or file paths)
1131: type PluginConfig = string[];
1132: ```
1133: 
1134: #### Plugin Locations
1135: | Location | Path |
1136: |----------|------|
1137: | Project | `.opencode/plugins/` |
1138: | Global | `~/.config/opencode/plugins/` |
1139: | npm | Package name in `plugin` array |
1140: 
1141: #### Plugin Context (available in plugin function)
1142: ```typescript
1143: interface PluginContext {
1144:   project: ProjectInfo;
1145:   directory: string;                    // Current working directory
1146:   worktree: string;                    // Git worktree root
1147:   client: OpenCodeSDKClient;
1148:   $: BunShellAPI;                      // Bun.$ for shell commands
1149: }
1150: ```
1151: 
1152: #### Plugin Hooks Available
1153: | Category | Hooks |
1154: |----------|-------|
1155: | Command | `command.executed` |
1156: | File | `file.edited`, `file.watcher.updated` |
1157: | Installation | `installation.updated` |
1158: | LSP | `lsp.client.diagnostics`, `lsp.updated` |
1159: | Message | `message.part.removed`, `message.part.updated`, `message.removed`, `message.updated` |
1160: | Permission | `permission.asked`, `permission.replied` |
1161: | Server | `server.connected` |
1162: | Session | `session.created`, `session.compacted`, `session.deleted`, `session.diff`, `session.error`, `session.idle`, `session.status`, `session.updated` |
1163: | Shell | `shell.env` |
1164: | Tool | `tool.execute.after`, `tool.execute.before` |
1165: | TUI | `tui.prompt.append`, `tui.command.execute`, `tui.toast.show` |
1166: 
1167: #### opencode.json Examples
1168: 
1169: ```json
1170: {
1171:   "plugin": [
1172:     "opencode-helicone-session",
1173:     "opencode-wakatime",
1174:     "@my-org/custom-plugin",
1175:     ".opencode/plugins/hivemind-context-governance.ts"
1176:   ]
1177: }
1178: ```
1179: 
1180: ---
1181: 
1182: ### 7. LSP SERVERS Schema
1183: 
1184: **Doc Source:** https://opencode.ai/docs/lsp/
1185: **Confidence:** HIGH | **Freshness:** Current (2026-03-25)
1186: 
1187: #### LSP Configuration Schema
1188: 
1189: ```typescript
1190: interface LSPConfig {
1191:   [serverName: string]: LSPServerConfig | boolean;
1192: }
1193: 
1194: interface LSPServerConfig {
1195:   "disabled"?: boolean;                // Disable specific server
1196:   "command"?: string[];                // Custom LSP command
1197:   "extensions"?: string[];             // File extensions handled
1198:   "env"?: Record<string, string>;      // Environment variables
1199:   "initialization"?: object;           // Server-specific init options
1200: }
1201: ```
1202: 
1203: #### Built-in LSP Servers
1204: | Server | Extensions | Auto-install |
1205: |--------|------------|--------------|
1206: | astro | .astro | Yes |
1207: | bash | .sh, .bash, .zsh, .ksh | Yes |
1208: | clangd | .c, .cpp, .h, .hpp, etc. | Yes |
1209: | csharp | .cs | .NET SDK |
1210: | dart | .dart | dart command |
1211: | deno | .ts, .tsx, .js, .jsx, .mjs | deno.json |
1212: | eslint | .ts, .tsx, .js, .jsx, etc. | eslint dependency |
1213: | gopls | .go | go command |
1214: | pyright | .py, .pyi | pyright dependency |
1215: | rust | .rs | rust-analyzer |
1216: | typescript | .ts, .tsx, .js, .jsx, .mts, .cts | typescript dependency |
1217: | And 25+ more... | | |
1218: 
1219: #### opencode.json Examples
1220: 
1221: ```json
1222: {
1223:   "lsp": {
1224:     "typescript": {
1225:       "initialization": {
1226:         "preferences": {
1227:           "importModuleSpecifierPreference": "relative"
1228:         }
1229:       }
1230:     },
1231:     "rust": {
1232:       "env": {
1233:         "RUST_LOG": "debug"
1234:       }
1235:     },
1236:     "custom-lsp": {
1237:       "command": ["custom-lsp-server", "--stdio"],
1238:       "extensions": [".custom"]
1239:     }
1240:   }
1241: }
1242: ```
1243: 
1244: ---
1245: 
1246: ### 8. AGENT SKILLS Schema
1247: 
1248: **Doc Source:** https://opencode.ai/docs/skills/
1249: **Confidence:** HIGH | **Freshness:** Current (2026-03-25)
1250: 
1251: #### Skill Discovery Locations
1252: | Location | Path |
1253: |----------|------|
1254: | Project | `.opencode/skills/<name>/SKILL.md` |
1255: | Global | `~/.config/opencode/skills/<name>/SKILL.md` |
1256: | Claude-compatible (project) | `.claude/skills/<name>/SKILL.md` |
1257: | Claude-compatible (global) | `~/.claude/skills/<name>/SKILL.md` |
1258: | Agent-compatible (project) | `.agents/skills/<name>/SKILL.md` |
1259: | Agent-compatible (global) | `~/.agents/skills/<name>/SKILL.md` |
1260: 
1261: #### SKILL.md Frontmatter Schema
1262: 
1263: ```typescript
1264: interface SkillFrontmatter {
1265:   "name": string;                      // REQUIRED: 1-64 chars, lowercase hyphenated
1266:   "description": string;               // REQUIRED: 1-1024 chars
1267:   "license"?: string;
1268:   "compatibility"?: string;
1269:   "metadata"?: Record<string, string>;
1270: }
1271: ```
1272: 
1273: #### Name Validation Regex
1274: ```
1275: ^[a-z0-9]+(-[a-z0-9]+)*$
1276: ```
1277: 
1278: #### Skill Permission Configuration
1279: ```json
1280: {
1281:   "permission": {
1282:     "skill": {
1283:       "*": "allow",
1284:       "pr-review": "allow",
1285:       "internal-*": "deny",
1286:       "experimental-*": "ask"
1287:     }
1288:   }
1289: }
1290: ```
1291: 
1292: ---
1293: 
1294: ### 9. RULES/INSTRUCTIONS Schema
1295: 
1296: **Doc Source:** https://opencode.ai/docs/rules/
1297: **Confidence:** HIGH | **Freshness:** Current (2026-03-25)
1298: 
1299: #### Instruction File Locations
1300: | Type | Path |
1301: |------|------|
1302: | Project | `AGENTS.md` or `CLAUDE.md` (fallback) |
1303: | Global | `~/.config/opencode/AGENTS.md` |
1304: | Claude-compatible (global) | `~/.claude/CLAUDE.md` |
1305: 
1306: #### Instructions Config
1307: ```typescript
1308: // In opencode.json
1309: interface InstructionsConfig {
1310:   "instructions": string[];            // Paths/URLs to instruction files
1311: }
1312: ```
1313: 
1314: #### Precedence
1315: 1. Local `AGENTS.md` / `CLAUDE.md` (first found, traversing up)
1316: 2. Global `~/.config/opencode/AGENTS.md`
1317: 3. Claude `~/.claude/CLAUDE.md`
1318: 
1319: #### opencode.json Examples
1320: 
1321: ```json
1322: {
1323:   "instructions": [
1324:     "CONTRIBUTING.md",
1325:     "docs/guidelines.md",
1326:     ".cursor/rules/*.md",
1327:     "https://raw.githubusercontent.com/my-org/shared-rules/main/style.md"
1328:   ]
1329: }
1330: ```
1331: 
1332: ---
1333: 
1334: ### 10. CUSTOM TOOLS Schema
1335: 
1336: **Doc Source:** https://opencode.ai/docs/custom-tools/
1337: **Confidence:** HIGH | **Freshness:** Current (2026-03-25)
1338: 
1339: #### Custom Tool Definition Schema
1340: 
1341: ```typescript
1342: // Using tool() helper from @opencode-ai/plugin
1343: import { tool } from "@opencode-ai/plugin"
1344: 
1345: const myTool = tool({
1346:   description: string;                  // Tool description for LLM
1347:   args: {                               // Zod schema for arguments
1348:     [key: string]: z.ZodType;
1349:   };
1350:   async execute(args, context) {        // Execution function
1351:     // context.sessionID
1352:     // context.agent
1353:     // context.directory
1354:     // context.worktree
1355:     // context.abort
1356:     // context.metadata()
1357:     // context.ask()
1358:     return JSON.stringify({ ... });
1359:   }
1360: });
1361: ```
1362: 
1363: #### Tool Locations
1364: | Location | Path |
1365: |----------|------|
1366: | Project | `.opencode/tools/` |
1367: | Global | `~/.config/opencode/tools/` |
1368: 
1369: #### Context Interface
1370: ```typescript
1371: interface ToolContext {
1372:   sessionID: string;
1373:   agent: string;
1374:   directory: string;                   // Session working directory
1375:   worktree: string;                    // Git worktree root
1376:   abort: AbortSignal;
1377:   metadata(): void;
1378:   ask(): Promise<UserResponse>;
1379: }
1380: ```
1381: 
1382: ---
1383: 
1384: ### 11. FORMATTERS Schema
1385: 
1386: **Doc Source:** https://opencode.ai/docs/formatters/
1387: **Confidence:** HIGH | **Freshness:** Current (2026-03-25)
1388: 
1389: #### Formatter Configuration Schema
1390: 
1391: ```typescript
1392: interface FormatterConfig {
1393:   [formatterName: string]: FormatterSettings | boolean;
1394: }
1395: 
1396: interface FormatterSettings {
1397:   "disabled"?: boolean;
1398:   "command"?: string[];                // Formatter command with $FILE placeholder
1399:   "environment"?: Record<string, string>;
1400:   "extensions"?: string[];             // File extensions handled
1401: }
1402: ```
1403: 
1404: #### Built-in Formatters
1405: | Formatter | Extensions | Requirement |
1406: |-----------|------------|-------------|
1407: | biome | .js, .jsx, .ts, .tsx, .html, .css, .md, .json, .yaml | biome.json config |
1408: | prettier | Many | prettier dependency |
1409: | eslint | .ts, .tsx, .js, .jsx, etc. | eslint config |
1410: | ruff | .py, .pyi | ruff command |
1411: | rustfmt | .rs | rustfmt command |
1412: | gofmt | .go | gofmt command |
1413: | And 20+ more... | | |
1414: 
1415: #### opencode.json Examples
1416: 
1417: ```json
1418: {
1419:   "formatter": {
1420:     "prettier": {
1421:       "disabled": true
1422:     },
1423:     "custom-prettier": {
1424:       "command": ["npx", "prettier", "--write", "$FILE"],
1425:       "environment": {
1426:         "NODE_ENV": "development"
1427:       },
1428:       "extensions": [".js", ".ts", ".jsx", ".tsx"]
1429:     }
1430:   }
1431: }
1432: ```
1433: 
1434: ---
1435: 
1436: ### 12. SERVER Schema
1437: 
1438: **Doc Source:** https://opencode.ai/docs/config/
1439: **Confidence:** HIGH | **Freshness:** Current (2026-03-25)
1440: 
1441: #### Server Configuration Schema
1442: 
1443: ```typescript
1444: interface ServerConfig {
1445:   "port"?: number;                    // Port to listen on
1446:   "hostname"?: string;                 // Hostname, defaults to "0.0.0.0" when mdns enabled
1447:   "mdns"?: boolean;                   // Enable mDNS discovery
1448:   "mdnsDomain"?: string;               // Custom mDNS domain, default: "opencode.local"
1449:   "cors"?: string[];                  // Additional CORS origins
1450: }
1451: ```
1452: 
1453: ---
1454: 
1455: ### 13. PROVIDER Schema
1456: 
1457: **Doc Source:** https://opencode.ai/docs/models/
1458: **Confidence:** HIGH | **Freshness:** Current (2026-03-25)
1459: 
1460: #### Provider Configuration Schema
1461: 
1462: ```typescript
1463: interface ProviderConfig {
1464:   "options"?: {
1465:     "apiKey"?: string;                // "{env:VAR_NAME}" syntax
1466:     "timeout"?: number;               // Request timeout in ms, default: 300000
1467:     "chunkTimeout"?: number;          // Chunk timeout in ms
1468:     "setCacheKey"?: boolean;
1469:     "baseURL"?: string;               // Custom base URL
1470:   };
1471:   "models"?: {
1472:     [modelName: string]: {
1473:       "limit"?: { "context"?: number; "output"?: number; };
1474:       "options"?: Record<string, unknown>;  // Provider-specific options
1475:       "variants"?: {
1476:         [variantName: string]: {
1477:           // Variant-specific options
1478:           [key: string]: unknown;
1479:         };
1480:       };
1481:       "disabled"?: boolean;
1482:     };
1483:   };
1484: }
1485: ```
1486: 
1487: #### Provider Options by Service
1488: | Provider | Options |
1489: |----------|---------|
1490: | All | `timeout`, `chunkTimeout`, `setCacheKey`, `baseURL` |
1491: | Amazon Bedrock | `region`, `profile`, `endpoint` |
1492: | OpenAI | Provider-specific model options |
1493: | Anthropic | `thinking` config |
1494: 
1495: ---
1496: 
1497: ### 14. Additional Configuration Keys
1498: 
1499: #### Compaction
1500: ```typescript
1501: interface CompactionConfig {
1502:   "auto"?: boolean;                   // Default: true
1503:   "prune"?: boolean;                 // Default: true  
1504:   "reserved"?: number;               // Token buffer
1505: }
1506: ```
1507: 
1508: #### Watcher
1509: ```typescript
1510: interface WatcherConfig {
1511:   "ignore"?: string[];               // Glob patterns
1512: }
1513: ```
1514: 
1515: ---
1516: 
1517: ## Current opencode.json Analysis
1518: 
1519: **File:** `/Users/apple/hivemind-plugin/.worktrees/product-detox/opencode.json`
1520: 
1521: ```json
1522: {
1523:   "$schema": "https://opencode.ai/config.json",
1524:   "model": "minimax-coding-plan/MiniMax-M2.7",
1525:   "plugin": [
1526:     ".opencode/plugins/hivemind-context-governance.ts"
1527:   ],
1528:   "provider": {
1529:     "minimax": {
1530:       "options": {
1531:         "apiKey": "{env:MINIMAX_API_KEY}"
1532:       }
1533:     },
1534:     "openai": {
1535:       "models": {
1536:         "gpt-5.4": {
1537:           "limit": {
1538:             "context": 200000,
1539:             "output": 128000
1540:           }
1541:         }
1542:       }
1543:     }
1544:   }
1545: }
1546: ```
1547: 
1548: **Current Configuration Coverage:**
1549: 
1550: | Entity Type | Configured | Missing from Config |
1551: |-------------|------------|---------------------|
1552: | Model | ✅ | - |
1553: | Plugin | ✅ | - |
1554: | Provider | ✅ | - |
1555: | Agent | ❌ | Not configured |
1556: | Command | ❌ | Not configured |
1557: | Permission | ❌ | Not configured |
1558: | MCP | ❌ | Not configured |
1559: | LSP | ❌ | Not configured |
1560: | Formatter | ❌ | Not configured |
1561: | Skills | ❌ | Not configured |
1562: | Instructions | ❌ | Not configured |
1563: 
1564: ---
1565: 
1566: ## Existing TypeScript Types in Project
1567: 
1568: The project contains internal TypeScript interfaces for OpenCode entity handling:
1569: 
1570: ### Agent Registry (`src/shared/opencode-agent-registry.ts`)
1571: ```typescript
1572: interface CanonicalAgentFrontmatter {
1573:   description?: string;
1574:   mode?: string;
1575:   tools?: Record<string, unknown>;
1576:   permission?: Record<string, unknown>;
1577:   [key: string]: unknown;
1578: }
1579: 
1580: interface RuntimeAgentFrontmatter {
1581:   description?: string;
1582:   mode?: string;
1583:   tools?: Record<string, unknown>;
1584:   permission?: Record<string, unknown>;
1585: }
1586: 
1587: interface OpencodeAgentRegistryEntry {
1588:   id: string;
1589:   sourcePath: string;
1590:   canonicalFrontmatter: CanonicalAgentFrontmatter;
1591:   runtimeFrontmatter: RuntimeAgentFrontmatter;
1592:   body: string;
1593:   runtimeMarkdown: string;
1594: }
1595: ```
1596: 
1597: ### Skill Registry (`src/shared/opencode-skill-registry.ts`)
1598: ```typescript
1599: interface SkillFrontmatter {
1600:   name: string;
1601:   description: string;
1602:   [key: string]: unknown;
1603: }
1604: 
1605: interface OpencodeSkillRegistryEntry {
1606:   id: string;
1607:   sourcePath: string;
1608:   frontmatter: SkillFrontmatter;
1609:   body: string;
1610:   runtimeMarkdown: string;
1611:   referenceFiles: Map<string, string>;
1612:   templateFiles: Map<string, string>;
1613:   testFiles: Map<string, string>;
1614: }
1615: ```
1616: 
1617: ---
1618: 
1619: ## No Existing OpenCode Schema File Found
1620: 
1621: **Search Results:**
1622: - No `opencode-schema.ts` or similar found in project
1623: - No `zod` schema definitions for OpenCode config
1624: - The official JSON schema is at `https://opencode.ai/config.json` (fetched above)
1625: - SDK reference file `.repo-sdk-packed/opencode-api-sdk.xml` does not exist in this project
1626: 
1627: ---
1628: 
1629: ## Summary: Configuration Precedence
1630: 
1631: From lowest to highest priority (later overrides earlier):
1632: 
1633: 1. **Remote config** (`.well-known/opencode`) - Organizational defaults
1634: 2. **Global config** (`~/.config/opencode/opencode.json`)
1635: 3. **Custom config** (`OPENCODE_CONFIG` env var)
1636: 4. **Project config** (`opencode.json`)
1637: 5. **`.opencode/` directories** (agents/, commands/, plugins/, skills/, tools/)
1638: 6. **Inline config** (`OPENCODE_CONFIG_CONTENT` env var)
1639: 
1640: Configuration files are **merged**, not replaced. Later sources override conflicting keys while preserving non-conflicting settings.
1641: </task_result>
1642: ```
1643: 
1644: **Tool: task**
1645: 
1646: **Input:**
1647: ```json
1648: {
1649:   "description": "Find existing .hivemind structure",
1650:   "prompt": "I need to understand the current .hivemind/ directory structure and what's inside it.\n\nAt /Users/apple/hivemind-plugin/.worktrees/product-detox/:\n\n1. List the full .hivemind/ directory tree (all files and subdirectories)\n2. Read the key files inside: any continuity.json, active-paths.json, session state files\n3. Check .hivemind/activity/ structure\n4. Check .hivemind/sessions/ if it exists\n5. Look for any PRD.md, PROJECT.md, STATE.md, ARCHITECTURE.md files — both in .hivemind/ and at project root\n6. Check for CONCERNS.md, CONSTITUTION.md, STACK.md, SPECIFICATION.md, PITFALLS.md\n7. Check the docs/planning/ directory for planning artifacts\n8. Read paths.ts from src/shared/ to understand how .hivemind/ paths are resolved\n\nReturn:\n- Complete .hivemind/ directory listing\n- Which core documents exist and where\n- How paths are currently resolved (from paths.ts)\n- What's missing vs what the spec requires",
1651:   "subagent_type": "hivexplorer"
1652: }
1653: ```
1654: 
1655: **Output:**
1656: ```
1657: task_id: ses_2da47667affeGtC9fsVjQqGg0r (for resuming to continue this task if needed)
1658: 
1659: <task_result>
1660: Here is the complete investigation report.
1661: 
1662: ---
1663: 
1664: ## Codebase Investigation Report
1665: 
1666: **Scope:** `.hivemind/` directory structure, core state files, path resolution, and documentation artifacts  
1667: **Question:** What exists in `.hivemind/`, what core documents are present, how paths are resolved, and what's missing vs. spec requirements
1668: 
1669: ---
1670: 
1671: ### 1. Complete `.hivemind/` Directory Listing
1672: 
1673: ```
1674: .hivemind/
1675: ├── context-check.json                    # Context rot assessment (2026-03-19, CLEAN)
1676: ├── config/
1677: │   ├── entry-kernel-state.json           # Kernel readiness: "ready", qa: "passed"
1678: │   └── runtime-attachment.json           # Worktree attachment config, lineage=hivefiver
1679: ├── state/
1680: │   ├── tasks.json                        # Empty task list (v1.0.0)
1681: │   └── trajectory-ledger.json            # 8 checkpoints, 0 active trajectories
1682: ├── graph/
1683: │   └── tasks.json                        # Empty task list (v1.0.0)
1684: ├── agent-work-contract/
1685: │   └── (empty)
1686: ├── project/
1687: │   ├── planning/
1688: │   │   ├── index.json
1689: │   │   ├── project-state.json
1690: │   │   ├── phases/00-control-plane/00-01-PLAN.md
1691: │   │   ├── runtime-entry/
1692: │   │   │   ├── diagnosis-tracking-2026-03-20.md
1693: │   │   │   ├── health-status-2026-03-20.md
1694: │   │   │   └── meta-state-2026-03-20.md
1695: │   │   └── trajectory-projections/
1696: │   │       ├── trj_ses_2f86eff84ffecj34JHANsBS8nH.json
1697: │   │       ├── trj_ses_2ff4137d7ffeYCfVl5WU2Wb9Au.json
1698: │   │       ├── trj_ses_2ff723f3affeYecs1HDNptxEm5.json
1699: │   │       ├── trj_ses_30165cac3ffeGqldBqjEqeUTs0.json
1700: │   │       └── trj_ses_harness_1774039169268.json
1701: │   └── runtime-turns/
1702: │       ├── ses_2f86eff84ffecj34JHANsBS8nH/ (4 turns: .md + .yaml each)
1703: │       ├── ses_2ff4137d7ffeYCfVl5WU2Wb9Au/ (1 turn)
1704: │       ├── ses_2ff723f3affeYecs1HDNptxEm5/ (1 turn)
1705: │       ├── ses_2ffb44dceffe7GU6umIc1Tx1E4/ (2 turns)
1706: │       ├── ses_30165cac3ffeGqldBqjEqeUTs0/ (3 turns)
1707: │       └── ses_harness_1774039169268/ (1 turn)
1708: ├── activity/
1709: │   ├── status.json                       # Workflow state: session-journal-implementation, complete
1710: │   ├── agents/
1711: │   │   ├── hitea/p4b/
1712: │   │   ├── hiveq/{2026-03-25,20260324}/
1713: │   │   └── hiverd/20260324201948-superpowers-research/
1714: │   ├── audit/
1715: │   │   └── audit-src-2026-03-25.md
1716: │   ├── codescan/
1717: │   │   └── pass_1774372436/
1718: │   ├── delegation/                       # 20 JSON files (phase delegation records)
1719: │   ├── planning/                         # 16 plan files (plan-4 through plan-11 + revisions)
1720: │   ├── plans/
1721: │   │   └── session-journal-consolidation-plan-2026-03-25.md
1722: │   ├── review/                           # 7 code-skeptic review files
1723: │   ├── specs/
1724: │   │   └── session-journal-consolidation-spec-2026-03-25.md
1725: │   ├── synthesis/
1726: │   │   ├── plan-5-cycle-summary-2026-03-24.md
1727: │   │   └── final-integration-summary-2026-03-24.md
1728: │   ├── tdd/
1729: │   │   ├── red/ (7 evidence files)
1730: │   │   ├── green/ (7 evidence files)
1731: │   │   └── refactor/ (7 evidence files)
1732: │   └── verification/                     # 20 verification files
1733: ├── sessions/                             # 228 files
1734: │   ├── ses_2026-03-25T*_implementation_unknown.json  (120+ session v2 JSON files)
1735: │   └── ses_*/                            # ~110 session subdirectories (older format)
1736: ├── session-inspection/                   # 220 entries
1737: │   └── ses_*/
1738: │       ├── assistant-output.md
1739: │       └── purification-command.json
1740: └── error-log/                            # 1,290 .md error-log files
1741: ```
1742: 
1743: ---
1744: 
1745: ### 2. Core Documents — Existence Map
1746: 
1747: | Document | Location | Exists? | Notes |
1748: |----------|----------|---------|-------|
1749: | `PRD.md` | `.hivemind/` or root | **NO** | Not found anywhere |
1750: | `PROJECT.md` | `.planning/PROJECT.md` | YES | Also `.planning/PROJECT-2026-03-20.md` |
1751: | `STATE.md` | `.planning/STATE.md` | YES | Also `.planning/STATE-2026-03-20.md` |
1752: | `ARCHITECTURE.md` | `.planning/codebase/` | YES | Also `.planning/research/` |
1753: | `CONCERNS.md` | `.planning/codebase/CONCERNS.md` | YES | |
1754: | `CONSTITUTION.md` | — | **NO** | Not found |
1755: | `STACK.md` | `.planning/codebase/` | YES | Also `.planning/research/` |
1756: | `SPECIFICATION.md` | — | **NO** | Not found (`.hivemind/activity/specs/` has a dated spec instead) |
1757: | `PITFALLS.md` | `docs/PITFALLS.md` | YES | Also `.planning/research/` |
1758: | `continuity.json` | `.hivemind/activity/sessions/` | **NO** | Spec requires this at `.hivemind/activity/sessions/continuity.json` — dir doesn't exist |
1759: | `active-paths.json` | `.hivemind/pathing/` | **NO** | Spec requires `.hivemind/pathing/active-paths.json` — dir doesn't exist |
1760: | `AGENTS.md` | Root | YES | Primary governance file |
1761: | `CONCERNSV1.md` | Root | YES | Referenced in AGENTS.md for type monolith audit |
1762: | `ROADMAP.md` | `.planning/ROADMAP.md` | YES | |
1763: | `REQUIREMENTS.md` | `.planning/REQUIREMENTS.md` | YES | |
1764: 
1765: ---
1766: 
1767: ### 3. Path Resolution (`src/shared/paths.ts`)
1768: 
1769: File: `/Users/apple/hivemind-plugin/.worktrees/product-detox/src/shared/paths.ts` (89 lines)
1770: 
1771: **Constants defined (lines 9-15):**
1772: - `HIVEMIND_DIR = '.hivemind'`
1773: - `STATE_DIR = 'state'`
1774: - `SESSIONS_DIR = 'sessions'`
1775: - `GRAPH_DIR = 'graph'`
1776: - `CONFIG_DIR = 'config'`
1777: - `ARTIFACTS_DIR = 'artifacts'` — **declared but unused** in `getEffectivePaths()`
1778: - `CHECKPOINTS_DIR = 'checkpoints'` — **declared but unused** in `getEffectivePaths()`
1779: 
1780: **State file references (lines 18-23):**
1781: - `hiveneuron.json`, `hivebrain.md`, `brain.json`, `anchors.json` — **none of these exist** on disk in `.hivemind/state/`
1782: 
1783: **`getEffectivePaths()` (lines 63-88) — the canonical path authority:**
1784: ```
1785: root                    → .hivemind/
1786: stateDir                → .hivemind/state/
1787: configDir               → .hivemind/config/
1788: graphDir                → .hivemind/graph/
1789: sessionsDir             → .hivemind/sessions/
1790: sessionInspectionDir    → .hivemind/session-inspection/
1791: projectPlanningDir      → .hivemind/project/planning/
1792: handoffsDir             → .hivemind/handoffs/        ← DIR DOES NOT EXIST on disk
1793: errorLogDir             → .hivemind/error-log/
1794: ```
1795: 
1796: **Paths NOT in `getEffectivePaths()` but present on disk:**
1797: - `.hivemind/activity/` — the entire activity tree is missing from path resolution
1798: - `.hivemind/agent-work-contract/` — exists on disk, not in path resolver
1799: - `.hivemind/session-inspection/` — individual session getter exists (`getSessionInspectionPath`) but no general inspection dir in return object
1800: 
1801: **Paths in `getEffectivePaths()` but missing on disk:**
1802: - `.hivemind/handoffs/` — referenced as `handoffsDir` but directory doesn't exist
1803: 
1804: ---
1805: 
1806: ### 4. What's Missing vs. What the Spec Requires
1807: 
1808: The AGENTS.md Activity Folder spec requires this structure:
1809: 
1810: ```
1811: .hivemind/activity/
1812: ├── handoff/          ← MISSING (no handoff/ dir inside activity/)
1813: ├── delegation/       ✓ EXISTS (20 files)
1814: ├── hierarchy/        ← MISSING
1815: ├── sessions/         ← MISSING (continuity.json expected here)
1816: ├── codescan/         ✓ EXISTS (1 batch)
1817: ├── agents/           ✓ EXISTS (hitea, hiveq, hiverd)
1818: ├── longhaul/         ← MISSING
1819: ├── pathing/          ← MISSING (active-paths.json expected here)
1820: └── state/            ← MISSING (no state/ dir inside activity/)
1821: ```
1822: 
1823: **Specific gaps:**
1824: 
1825: | Spec Requirement | Status | Evidence |
1826: |------------------|--------|----------|
1827: | `.hivemind/activity/handoff/` | **MISSING** | No such directory |
1828: | `.hivemind/activity/hierarchy/` | **MISSING** | No such directory |
1829: | `.hivemind/activity/sessions/continuity.json` | **MISSING** | Directory doesn't exist |
1830: | `.hivemind/activity/longhaul/task-state.json` | **MISSING** | Directory doesn't exist |
1831: | `.hivemind/activity/pathing/active-paths.json` | **MISSING** | Directory doesn't exist |
1832: | `.hivemind/activity/state/` | **MISSING** | No such subdirectory |
1833: | `.hivemind/handoffs/` (from paths.ts) | **MISSING** | Referenced in code, absent on disk |
1834: | `ARTIFACTS_DIR` usage | **DEAD CODE** | Constant declared, never used |
1835: | `CHECKPOINTS_DIR` usage | **DEAD CODE** | Constant declared, never used |
1836: | `STATE_FILES.hiveneuron` etc. | **DEAD CODE** | Referenced files don't exist |
1837: 
1838: **Additional observations:**
1839: - `context-check.json` is stale (dated 2026-03-19, 6 days old)
1840: - 1,290 error-log entries and 228 session files suggest heavy session activity — likely bloat from rapid session creation
1841: - The `activity/status.json` workflow is marked "complete" for `session-journal-implementation` (all 10 plans done)
1842: - Git HEAD is at `7183335` — "Generated numerous Hivemind session artifacts, error logs, and inspection reports"
1843: - No `pathing/active-paths.json` means agents have no deterministic path registry to resolve output locations, contradicting the spec's Deterministic Pathing rule
1844: 
1845: ---
1846: 
1847: ### 5. Structure Map Summary
1848: 
1849: The `.hivemind/` directory has **organic growth** from session activity (228 sessions, 1,290 error logs) but is **missing the structural scaffolding** the spec mandates. The `activity/` subdirectory has good coverage of planning/verification/tdd/delegation workflows but lacks the operational directories (handoff, hierarchy, longhaul, pathing, sessions/continuity). Path resolution in `paths.ts` has dead constants and a missing `handoffs/` directory, while the entire `activity/` tree is absent from the path resolver.
1850: </task_result>
1851: ```
1852: 
1853: ---
1854: 
1855: ## Assistant (Hiveminder · xiaomi/mimo-v2-pro:free · 87.7s)
1856: 
1857: _Thinking:_
1858: 
1859: Now I have a comprehensive understanding of the current state. Let me synthesize all findings and present a clear report. The user asked me to "report and stop" — so I should present findings clearly without implementing anything.
1860: 
1861: Let me create a comprehensive report covering:
1862: 1. Legacy CLI and sync assets (what needs cleanup)
1863: 2. OpenCode schema (what we need to conform to)
1864: 3. Current .hivemind/ state (what exists vs what's needed)
1865: 4. The gap analysis
1866: 
1867: Then present the master plan as a high-level multi-round approach, since the CLAUDE.md says "When user says 'plan' → ALWAYS create high-level routed/conditional multi-round plan. NEVER create ready-to-implement detailed specifications."
1868: 
1869: 
1870: Actually, I'm re-reading the user's message — they didn't say "plan," they gave me a detailed specification and said "report and stop." So I should stick with just the findings report and hold off on proposing any implementation plan until they authorize it.
1871: 
1872: ## Complete Investigation Report
1873: 
1874: ### A. Legacy CLI & Sync Assets (Cleanup Targets)
1875: 
1876: The current system has these ALIVE components that the user spec calls "faulty legacy CLI init" and "misleading false sync assets":
1877: 
1878: **CLI Pipeline (all alive, all compiled to `dist/`):**
1879: 
1880: | Component | File | Purpose |
1881: |-----------|------|---------|
1882: | CLI entry | `src/cli.ts` | Dispatches init/doctor/settings/harness/sync |
1883: | Command routing | `src/cli/command-routing.ts` | Maps `hm-init`→`init`, `hm-doctor`→`doctor`, etc. |
1884: | Init handler | `src/features/runtime-entry/init.handler.ts` | Bootstraps workflow authority, trajectory ledger, calls sync |
1885: | Doctor handler | `src/features/runtime-entry/doctor.ts` | Repairs recovery state, calls sync |
1886: | Settings handler | `src/cli/settings.ts` | Settings with intake gate logic |
1887: | **Sync (the "false sync")** | `src/features/runtime-observability/sync.ts` | Writes `.opencode/plugins/hivemind-context-governance.ts` stub, updates `opencode.json` plugin array |
1888: | Control plane | `src/control-plane/control-plane-registry.ts` | Registers all 4 primitives with keywords, binary aliases |
1889: 
1890: **Command bundles (shipped):**
1891: - `commands/hm-init.md`, `commands/hm-doctor.md`, `commands/hm-settings.md`
1892: 
1893: **Already dead (deprecated):**
1894: - `scripts/sync-agent-registry.ts.deprecated`
1895: - `scripts/check-agent-registry-parity.sh.deprecated`
1896: 
1897: **Noise (dev-only mirrors):**
1898: - `.opencode/commands/hm-init.md`, `.opencode/commands/hm-doctor.md`, `.opencode/commands/hm-settings.md`
1899: 
1900: **Legacy CJS (separate, not compiled to dist):**
1901: - `bin/hivemind-tools.cjs` — 1406+ line legacy CLI with `trace-paths`, `verify-install`, `migrate-check`, etc. References `.hivemind/` init concepts. NOT part of `dist/cli.js`.
1902: 
1903: ---
1904: 
1905: ### B. OpenCode Configuration Schema (What We Must Conform To)
1906: 
1907: The OpenCode config in `opencode.json` supports these entity types. **Currently only 3 of 11 are configured:**
1908: 
1909: | Entity | Configured? | Key Fields |
1910: |--------|------------|------------|
1911: | `model` | YES | `"minimax-coding-plan/MiniMax-M2.7"` |
1912: | `plugin` | YES | `[".opencode/plugins/hivemind-context-governance.ts"]` |
1913: | `provider` | YES | minimax, openai |
1914: | `agent` | **NO** | `description`, `mode`, `model`, `prompt`, `permission`, `tools`, `steps` |
1915: | `command` | **NO** | `template`, `description`, `agent`, `model`, `subtask` |
1916: | `permission` | **NO** | `*`, `read`, `edit`, `bash`, `task`, `skill` (each: allow/ask/deny) |
1917: | `mcp` | **NO** | `type`, `command`, `url`, `enabled`, `timeout` |
1918: | `skills` | **NO** | `paths`, `urls` |
1919: | `lsp` | **NO** | Server configs |
1920: | `formatter` | **NO** | Formatter configs |
1921: | `instructions` | **NO** | Paths to instruction files |
1922: 
1923: **Agent mode values:** `primary` | `subagent` | `all`
1924: **Built-in agents:** `build` (primary), `plan` (primary), `general` (subagent), `explore` (subagent)
1925: **Skill discovery paths:** `.opencode/skills/<name>/SKILL.md`, `.claude/skills/`, `.agents/skills/`
1926: **Config precedence:** remote → global → project → `.opencode/` dirs → env var
1927: 
1928: ---
1929: 
1930: ### C. Current `.hivemind/` State vs. Spec Requirements
1931: 
1932: **What exists (organic growth from 228 sessions):**
1933: - `.hivemind/config/` — entry-kernel-state.json, runtime-attachment.json
1934: - `.hivemind/state/` — tasks.json, trajectory-ledger.json
1935: - `.hivemind/project/planning/` — index, phases, runtime-turns
1936: - `.hivemind/activity/` — delegation (20 files), planning, verification, tdd, codescan, agents
1937: - `.hivemind/sessions/` — 228 files
1938: - `.hivemind/session-inspection/` — 220 entries
1939: - `.hivemind/error-log/` — 1,290 files
1940: 
1941: **What's MISSING from spec:**
1942: 
1943: | Required | Status |
1944: |----------|--------|
1945: | `.hivemind/activity/handoff/` | MISSING |
1946: | `.hivemind/activity/hierarchy/` | MISSING |
1947: | `.hivemind/activity/sessions/continuity.json` | MISSING (dir doesn't exist) |
1948: | `.hivemind/activity/longhaul/task-state.json` | MISSING |
1949: | `.hivemind/activity/pathing/active-paths.json` | MISSING |
1950: | `.hivemind/activity/state/` | MISSING |
1951: | `PRD.md` | MISSING |
1952: | `CONSTITUTION.md` | MISSING |
1953: | `SPECIFICATION.md` | MISSING |
1954: | `pathing/active-paths.json` | MISSING (no deterministic path registry) |
1955: 
1956: **Dead code in `paths.ts`:**
1957: - `ARTIFACTS_DIR`, `CHECKPOINTS_DIR` constants — declared, never used
1958: - `STATE_FILES.hiveneuron`, `hivebrain`, `brain`, `anchors` — referenced files don't exist
1959: - `handoffsDir` — returned by `getEffectivePaths()` but directory doesn't exist on disk
1960: - Entire `activity/` tree absent from path resolver
1961: 
1962: **Stale state:**
1963: - `context-check.json` dated 2026-03-19 (6 days old, SUSPECT)
1964: 
1965: ---
1966: 
1967: ### D. The Injection Problem (Restated with New Context)
1968: 
1969: The skill injection pipeline is **mechanically alive** but **content-broken**:
1970: 
1971: - `src/plugin/skill-exposure-map.ts` has 21 hardcoded skill names, 11 don't exist on disk
1972: - `MAX_SKILLS = 7` (should be 3 per policy)
1973: - `opencode-skill-registry.ts` correctly discovers 15 real skills but is disconnected from injection
1974: - The new architecture requires this to be driven by `hivefiver` configuration, not hardcoded TypeScript
1975: 
1976: ---
1977: 
1978: ### E. Hivefiver Command Architecture (From Your Spec)
1979: 
1980: The three commands and their responsibilities:
1981: 
1982: | Command | Purpose | Key Actions |
1983: |---------|---------|-------------|
1984: | `hm-init` | Reset to defaults via interview | Detect greenfield/brownfield, bootstrap `.hivemind/`, generate core docs, configure settings |
1985: | `hm-doctor` | Diagnose and repair | Interview user, discover misconfig, broken refs, schema drift |
1986: | `hm-setting` | Step-by-step configuration | Configure individual groups or all settings at once |
1987: 
1988: **Configuration categories (fixed values set by hivefiver):**
1989: - User communication language, document language
1990: - Expert level (beginner/intermediate/advanced/expert)
1991: - Governance level (4 levels, no auto-block — replace with halt-investigate-propose)
1992: - Operation mode (iterative-interactive / research-first / yolo)
1993: 
1994: **Conditional injection carried by sub-agents:**
1995: - Per-agent, per-phase, per-task-classification skill rules
1996: - Mandatory skills (always load) + high-likelihood skills
1997: - Two-tier phase classification: Tier 1 (project initiation with core docs) → Tier 2 (planning & execution)
1998: 
1999: ---
2000: 
2001: ### F. `src/shared/paths.ts` — Dead Code and Gaps
2002: 
2003: The path resolver has significant dead code and missing paths that the new system must clean up:
2004: 
2005: - 4 dead constants (`ARTIFACTS_DIR`, `CHECKPOINTS_DIR`, plus unused state file refs)
2006: - `handoffsDir` returned but directory doesn't exist
2007: - `activity/` tree completely absent from resolver despite being the primary operational directory
2008: - No `pathing/active-paths.json` means no deterministic path registry (contradicts spec)
2009: 
2010: ---
2011: 
2012: **All findings reported. No code was changed. Awaiting your direction on how to proceed with the hivefiver-driven refactoring.**
2013: 
2014: ---
2015: 
2016: ## User
2017: 
2018: use-hivemind then load skill to delegation, tdd-delegation, delagation-gatekeeping and context skill to begin the large phase planning, spec-driven with git commit and planning, verification and handoff clearly output to mangae the complete test-driven code changes as refactor, consolidate and revamp
2019: 
2020: ---
2021: 
2022: ## Assistant (Hiveminder · xiaomi/mimo-v2-pro:free · 30.0s)
2023: 
2024: _Thinking:_
2025: 
2026: The user wants me to load the appropriate skills and begin the large phase planning for the hivefiver-driven refactoring. Let me load the skills they specified:
2027: 
2028: 1. use-hivemind (already loaded as entry router)
2029: 2. use-hivemind-delegation
2030: 3. use-hivemind-tdd (they said "tdd-delegation" but the new name is use-hivemind-tdd)
2031: 4. hivemind-gatekeeping (they said "delegation-gatekeeping" but the new name is hivemind-gatekeeping)
2032: 5. use-hivemind-context (they said "context skill")
2033: 
2034: But wait — the load-3 constraint says max 3 active skills. I already have:
2035: 
2036: 
2037: - use-hivemind (slot 1)
2038: - use-hivemind-delegation (slot 2)
2039: - hivemind-spec-driven (slot 3)
2040: 
2041: I need to replace hivemind-spec-driven with the skills the user is asking for, since they want delegation, TDD, gatekeeping, and context instead. Let me swap out the current third skill to accommodate their request. I'm going in circles trying to enforce the slot constraint when the user is explicitly asking me to load multiple skills. Let me just load what they requested and move forward with the planning work.
2042: 
2043: **Tool: skill**
2044: 
2045: **Input:**
2046: ```json
2047: {
2048:   "name": "use-hivemind-tdd"
2049: }
2050: ```
2051: 
2052: **Output:**
2053: ```
2054: <skill_content name="use-hivemind-tdd">
2055: # Skill: use-hivemind-tdd
2056: 
2057: # use-hivemind-tdd
2058: 
2059: You're building something. The test comes first — always. This skill governs the entire TDD lifecycle: from writing the first failing test to claiming completion after the last refactor. It consolidates delegation mechanics, phase-level enforcement, and gate protocol into one place.
2060: 
2061: ## Load Position
2062: 
2063: **Slot: 2. Requires `use-hivemind` in Slot 1.**
2064: 
2065: | Constraint | Rule |
2066: |-----------|------|
2067: | Stack position | Slot 2 of 3 |
2068: | Load order | After entry router |
2069: | Max active | 3 skills total |
2070: | Parent | `use-hivemind` |
2071: 
2072: ## The TDD Loop
2073: 
2074: Three steps. In order. Never combined. Never skipped.
2075: 
2076: **RED** — Write a test that defines what the code *should* do. Run it. It *must* fail. If it passes immediately, it's testing nothing. Delete it and write one that actually asserts behavior.
2077: 
2078: **GREEN** — Write the minimum code to make the test pass. Don't optimize. Don't refactor. Don't add features the test doesn't ask for. Just make it green.
2079: 
2080: **REFACTOR** — Now clean up. Better names. Extract functions. Reduce duplication. Tests must still pass. If they break, revert the refactor — you changed behavior.
2081: 
2082: Then you do it again. For the next piece of behavior. And the next. Until the phase is done.
2083: 
2084: ## Gate 1: RED (Pre-Implementation)
2085: 
2086: **Rule:** No implementation code exists until a test exists and fails.
2087: 
2088: | Check | Pass Condition |
2089: |-------|---------------|
2090: | `test_file_exists` | Test file created at expected path |
2091: | `test_is_meaningful` | Contains real assertion — not `assert(true)` |
2092: | `test_fails` | Command output shows expected failure |
2093: | `no_implementation` | No corresponding implementation file or function yet |
2094: 
2095: ```bash
2096: # The test must fail. That's the proof it tests real behavior.
2097: npx jest --testPathPattern=<target> 2>&1 | tail -20
2098: # Expected: FAIL with assertion error or "function not found"
2099: ```
2100: 
2101: **If it passes immediately:** it's trivially true. Delete it. Write a test that actually asserts behavior. A passing test before implementation proves nothing.
2102: 
2103: **If no test exists:** implementation is BLOCKED. Return to red.
2104: 
2105: ## Gate 2: GREEN (Post-Implementation)
2106: 
2107: **Rule:** ALL tests pass. Build succeeds. Types are clean. No exceptions.
2108: 
2109: | Check | Pass Condition |
2110: |-------|---------------|
2111: | `all_tests_pass` | Test command exits 0, all assertions pass |
2112: | `type_check_clean` | `npx tsc --noEmit` — zero errors |
2113: | `build_succeeds` | `npm run build` — exits 0 |
2114: | `no_regressions` | Prior tests still pass |
2115: 
2116: ```bash
2117: npm test 2>&1 | tail -5
2118: # Expected: "Tests: X passed, 0 failed"
2119: 
2120: npx tsc --noEmit 2>&1
2121: # Expected: (no output = clean)
2122: 
2123: npm run build 2>&1 | tail -3
2124: # Expected: exit 0
2125: ```
2126: 
2127: **If any test fails:** implementation is incomplete. Fix it. Do not proceed to refactor.
2128: 
2129: **If type check fails:** you have type errors. Fix them before claiming green.
2130: 
2131: ## Gate 3: REFACTOR (Post-Cleanup)
2132: 
2133: **Rule:** ALL tests still pass. Same pass count. Same assertions. No behavior change.
2134: 
2135: | Check | Pass Condition |
2136: |-------|---------------|
2137: | `all_tests_pass` | Same test output as green gate |
2138: | `type_check_clean` | `npx tsc --noEmit` still zero errors |
2139: | `build_succeeds` | `npm run build` still exits 0 |
2140: | `no_behavior_change` | Test output identical to pre-refactor |
2141: 
2142: ```bash
2143: npm test 2>&1 | tail -5
2144: # Expected: "Tests: X passed, 0 failed" (same X as green gate)
2145: 
2146: git diff --stat
2147: # Structural changes only — no logic changes in implementation
2148: ```
2149: 
2150: **If any test breaks after refactor:** REVERT the refactor. Refactoring must not change behavior.
2151: 
2152: ## Gate 4: Phase Transition
2153: 
2154: **Rule:** Current phase + ALL prior phases + build + types + lint must pass before advancing.
2155: 
2156: | Check | Pass Condition |
2157: |-------|---------------|
2158: | `current_phase_tests_pass` | Tests for current phase all pass |
2159: | `prior_phase_tests_pass` | All tests from previous phases still pass |
2160: | `type_check_clean` | `npx tsc --noEmit` zero errors |
2161: | `build_succeeds` | `npm run build` exits 0 |
2162: | `lint_clean` | `npm run lint` — no errors |
2163: 
2164: ```bash
2165: npm test 2>&1 | tail -5       # All phases included
2166: npx tsc --noEmit 2>&1         # Zero errors
2167: npm run build 2>&1 | tail -3  # Exit 0
2168: npm run lint 2>&1 | tail -3   # No errors
2169: ```
2170: 
2171: **If prior phase tests regress:** the current phase introduced a bug. Fix it before advancing. Never silently advance.
2172: 
2173: ## Gate 5: Completion
2174: 
2175: **Rule:** FULL suite + integration + build + types + lint. All pass or no completion.
2176: 
2177: | Check | Pass Condition |
2178: |-------|---------------|
2179: | `full_test_suite_passes` | `npm test` — all tests pass |
2180: | `integration_tests_pass` | Integration test subset passes |
2181: | `type_check_clean` | `npx tsc --noEmit` zero errors |
2182: | `build_succeeds` | `npm run build` exits 0 |
2183: | `lint_clean` | `npm run lint` — no errors |
2184: | `no_regressions` | Entire test history still passes |
2185: 
2186: ```bash
2187: npm test 2>&1 | tail -5
2188: npx tsc --noEmit 2>&1
2189: npm run build 2>&1 | tail -3
2190: npm run lint 2>&1 | tail -3
2191: ```
2192: 
2193: **ANY failure at this gate means the work is NOT complete.** Do not claim done.
2194: 
2195: ## Phase TDD Lifecycle
2196: 
2197: Each plan phase gets its own complete R-G-R cycle. Phases are sequential — Phase N+1 cannot start until Phase N passes Gate 4.
2198: 
2199: ```
2200: Phase 01: red → green → refactor → Gate 4 (transition)
2201: Phase 02: red → green → refactor → Gate 4 (includes Phase 01 tests)
2202: Phase 03: red → green → refactor → Gate 4 (includes Phase 01+02 tests)
2203:   ...
2204: Phase N:  red → green → refactor → Gate 4 (includes ALL prior tests)
2205:                                           ↓
2206:                                     Gate 5 (completion)
2207: ```
2208: 
2209: ### Per-Phase Rules
2210: 
2211: - **RED:** Tests cover only THIS phase's deliverables. Prior tests must still pass.
2212: - **GREEN:** Implement minimum for THIS phase only. No cross-phase scope creep. Prior tests must still pass.
2213: - **REFACTOR:** Clean THIS phase's code. All tests (this + prior) must still pass.
2214: - **TRANSITION:** Run full suite. If prior tests regress, fix before advancing.
2215: 
2216: ### Phase Test Strategy
2217: 
2218: | Phase Type | Primary | Secondary | What to Test |
2219: |-----------|---------|-----------|-------------|
2220: | Foundation | Unit | — | Core types, interfaces, data structures |
2221: | Core Logic | Unit | Integration | Business logic; integration for external calls |
2222: | API / Interface | Unit | Integration | Request/response; endpoints |
2223: | Data Layer | Unit | Integration | Queries/mutations; DB ops |
2224: | Integration | Integration | Unit | Cross-module flows; edge cases |
2225: | UI / Presentation | Unit | E2E | Component logic; user flows |
2226: | E2E / Polish | E2E | Integration | User journeys; subsystem integration |
2227: 
2228: ## Test Writing Order
2229: 
2230: Tests MUST be written in this order. Never skip levels.
2231: 
2232: ```
2233: Level 1: Unit Tests
2234:   ├─ Test individual functions/methods in isolation
2235:   ├─ Mock external dependencies
2236:   ├─ Cover edge cases, error paths, boundary conditions
2237:   └─ ALL must pass before proceeding to Level 2
2238: 
2239: Level 2: Integration Tests
2240:   ├─ Test interactions between modules
2241:   ├─ Test API contracts, data flow, state transitions
2242:   ├─ Use real dependencies where possible (no stubs for SDK surfaces)
2243:   └─ ALL must pass before proceeding to Level 3
2244: 
2245: Level 3: E2E Tests
2246:   ├─ Test full user-facing workflows
2247:   ├─ Test across system boundaries
2248:   ├─ Validate against live interfaces where possible
2249:   └─ ALL must pass before claiming completion
2250: ```
2251: 
2252: Writing integration tests while unit tests are still failing hides unit-level bugs behind integration noise. Don't do it.
2253: 
2254: ## Multi-Phase State Tracking
2255: 
2256: Track TDD state across all phases in a single checkpoint file.
2257: 
2258: ```
2259: {project}/.hivemind/activity/delegation/phase-tdd-{plan_id}-checkpoint.json
2260: ```
2261: 
2262: ```json
2263: {
2264:   "_meta": {
2265:     "created_at": "2026-03-24T10:00:00Z",
2266:     "updated_at": "2026-03-24T10:30:00Z",
2267:     "plan_id": "feature-auth-001",
2268:     "total_phases": 4
2269:   },
2270:   "phases": [
2271:     {
2272:       "phase_id": "phase-01-foundation",
2273:       "phase_index": 1,
2274:       "status": "complete",
2275:       "tdd_cycle": {
2276:         "red": { "status": "complete", "tests_written": 8, "test_files": ["types.test.ts"] },
2277:         "green": { "status": "complete", "tests_passing": 8, "tests_failing": 0 },
2278:         "refactor": { "status": "complete", "tests_still_passing": true }
2279:       },
2280:       "transition_gate": { "all_green": true, "verified_at": "2026-03-24T10:20:00Z" }
2281:     }
2282:   ],
2283:   "cumulative_test_count": 8,
2284:   "last_verified_phase": 1,
2285:   "blocked": false,
2286:   "blocked_reason": null
2287: }
2288: ```
2289: 
2290: ### Rules
2291: 
2292: 1. Update checkpoint after every sub-phase (red, green, refactor).
2293: 2. `cumulative_test_count` reflects ALL tests across all completed phases.
2294: 3. `last_verified_phase` is the highest phase that passed Gate 4.
2295: 4. Blocked phases: set `blocked: true` + `blocked_reason` with specific failure.
2296: 5. Prior phase transition gates are IMMUTABLE once set — never retroactively change pass/fail.
2297: 
2298: ## Evidence Format
2299: 
2300: Every gate requires COMMAND OUTPUT as evidence, never claims.
2301: 
2302: ```json
2303: {
2304:   "gate_id": "green",
2305:   "timestamp": "2026-03-24T10:00:00Z",
2306:   "checks": {
2307:     "all_tests_pass": {
2308:       "command": "npm test",
2309:       "exit_code": 0,
2310:       "output_excerpt": "Tests: 42 passed, 0 failed",
2311:       "status": "pass"
2312:     },
2313:     "type_check_clean": {
2314:       "command": "npx tsc --noEmit",
2315:       "exit_code": 0,
2316:       "output_excerpt": "",
2317:       "status": "pass"
2318:     }
2319:   },
2320:   "gate_result": "pass"
2321: }
2322: ```
2323: 
2324: "Tests pass" is a claim. The output of `npm test` is evidence. Always show the evidence.
2325: 
2326: ## Anti-Patterns
2327: 
2328: | Anti-Pattern | Excuse | Reality |
2329: |-------------|--------|---------|
2330: | Writing implementation before tests | "I know what it should do" | Tests written after are reverse-engineered to match, not verify |
2331: | Claiming green without running gate | "It should pass" | Should ≠ does. Run the command. |
2332: | Skipping red gate | "The test is obvious" | Obvious tests are trivially true. They test nothing. |
2333: | Combining red+green in one step | "Saves time" | Saves time hiding bugs. The failing proof is the whole point. |
2334: | Writing integration tests before unit passes | "Integration is more important" | Integration failures hide unit-level bugs you'll never find |
2335: | Refactoring without running tests | "It's just a rename" | Renames break references. Structure changes break assumptions. |
2336: | Using `assert(true)` or empty tests | "Gate passes anyway" | Gate passes. Bugs ship. You chose this. |
2337: | Running gate once, reusing evidence | "Tests haven't changed" | Implementation changed. Evidence is stale. Re-run. |
2338: | Advancing phase without Gate 4 | "Phase 1 was simple" | Simple phases still break things downstream. Prove it passed. |
2339: | Claiming done at Gate 4 without Gate 5 | "Phases all pass" | Phases passing ≠ project complete. Integration and lint may still fail. |
2340: 
2341: ## Regression Response
2342: 
2343: | Scenario | Action |
2344: |---------|--------|
2345: | Prior phase test breaks during current red | STOP. Fix prior test before writing new ones. |
2346: | Prior phase test breaks during current green | STOP. Implementation broke prior behavior. Fix. |
2347: | Prior phase test breaks during refactor | REVERT refactor. Re-run. Fix if still broken. |
2348: | Build breaks after green | Green is not truly green. Fix and re-verify. |
2349: 
2350: ## Bundled Resources
2351: 
2352: | Resource | Purpose |
2353: |---------|---------|
2354: | `references/tdd-loop-delegation.md` | Red-green-refactor delegation mechanics |
2355: | `references/test-gate-enforcement.md` | Gate rules and enforcement details |
2356: | `references/phase-tdd-lifecycle.md` | Detailed per-phase R-G-R rules |
2357: | `references/transition-gates.md` | Gate checks, failure handling, result format |
2358: | `references/multi-phase-checkpoint.md` | Full checkpoint schema and state rules |
2359: | `templates/use-hivemind-tdd-packet.md` | Extended delegation packet JSON template |
2360: | `templates/phase-tdd-checkpoint.md` | Multi-phase checkpoint JSON template |
2361: | `templates/transition-gate-result.md` | Phase transition gate result JSON |
2362: 
2363: ## Independence Rules
2364: 
2365: - This is a **domain router** — it consolidates delegation mechanics, phase enforcement, and gate protocol
2366: - Parent: `use-hivemind` (Slot 1)
2367: - Depth companions: `hivemind-atomic-commit`, `hivemind-gatekeeping`
2368: - Checkpoints stored in `{project}/.hivemind/activity/delegation/` at runtime
2369: - Universal and framework-agnostic — applies to any project with test-driven development
2370: 
2371: Base directory for this skill: file:///Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind-tdd
2372: Relative paths in this skill (e.g., scripts/, reference/) are relative to this base directory.
2373: Note: file list is sampled.
2374: 
2375: <skill_files>
2376: <file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind-tdd/templates/tdd-checkpoint.md</file>
2377: <file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind-tdd/templates/tdd-delegation-packet.md</file>
2378: <file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind-tdd/templates/build-verify-checkpoint.md</file>
2379: <file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind-tdd/tests/tdd-scenario.md</file>
2380: <file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind-tdd/tests/tdd-delegation.md</file>
2381: <file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind-tdd/references/interface-design.md</file>
2382: <file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind-tdd/references/test-first-packet.md</file>
2383: <file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind-tdd/references/verification-before-completion.md</file>
2384: <file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind-tdd/references/tdd-loop-delegation.md</file>
2385: <file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind-tdd/references/mocking-guide.md</file>
2386: </skill_files>
2387: </skill_content>
2388: ```
2389: 
2390: **Tool: skill**
2391: 
2392: **Input:**
2393: ```json
2394: {
2395:   "name": "use-hivemind-context"
2396: }
2397: ```
2398: 
2399: **Output:**
2400: ```
2401: <skill_content name="use-hivemind-context">
2402: # Skill: use-hivemind-context
2403: 
2404: <!-- LOAD-POSITION
2405: slot: 2
2406: role: domain
2407: max-stack: 3
2408: -->
2409: 
2410: ## Load Position
2411: 
2412: **Slot: 2 (Domain — context health)**. `use-hivemind` is always loaded first.
2413: 
2414: | Constraint | Rule |
2415: |-----------|------|
2416: | Stack position | Slot 2 of 3 |
2417: | Load order | After `use-hivemind` |
2418: | Max active | 3 skills total |
2419: | Conflict | Cannot co-load with another domain router |
2420: 
2421: # use-hivemind-context
2422: 
2423: You're about to trust something — a doc, a memory, a prior session's claim, a test result. Stop. This domain router puts a checkpoint between "I remember" and "I trust." It doesn't do the checking itself. It dispatches to the right specialist based on what kind of doubt you have: session health uncertainty, or project-structural verification.
2424: 
2425: **Parent:** `use-hivemind` (Slot 1 entry router)
2426: 
2427: ## When You Need This
2428: 
2429: | Signal | Route To |
2430: |--------|----------|
2431: | Session just resumed after interruption, compaction, or `/clear` | `context-intelligence-entry` (quick mode) |
2432: | Something feels off — docs don't match code, memory seems stale | `context-intelligence-entry` (rot mode) |
2433: | Need a full trust breakdown before a major decision | `context-intelligence-entry` (full mode) |
2434: | Before starting work — baseline project health | `context-entry-verify` (gate-chain or landscape) |
2435: | Between implementation phases — gate checkpoint | `context-entry-verify` (individual gates) |
2436: | Validating a completion claim with hard evidence | `context-entry-verify` (gate-chain) |
2437: | After merges, dependency changes, or long gaps | `context-entry-verify` (landscape) |
2438: 
2439: ## The 3-Step Trust Check
2440: 
2441: Before routing, run this mental model. It takes five seconds and catches most problems.
2442: 
2443: 1. **Freshness** — Was anything relevant written in the last 48 hours?
2444:    - Docs, commits, session state files. If nothing is recent, your context is suspect.
2445: 2. **Code vs Docs** — Does the code match what the docs claim?

(Output capped at 50 KB. Showing lines 1061-2445. Use offset=2446 to continue.)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/opencode/opencode-configs.md"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/opencode/opencode-configs.md</path>
<type>file</type>
<content>1: Config
2: Using the OpenCode JSON config.
3: 
4: You can configure OpenCode using a JSON config file.
5: 
6: Format
7: OpenCode supports both JSON and JSONC (JSON with Comments) formats.
8: 
9: opencode.jsonc
10: {
11:   "$schema": "https://opencode.ai/config.json",
12:   "model": "anthropic/claude-sonnet-4-5",
13:   "autoupdate": true,
14:   "server": {
15:     "port": 4096,
16:   },
17: }
18: 
19: Locations
20: You can place your config in a couple of different locations and they have a different order of precedence.
21: 
22: Note
23: 
24: Configuration files are merged together, not replaced.
25: 
26: Configuration files are merged together, not replaced. Settings from the following config locations are combined. Later configs override earlier ones only for conflicting keys. Non-conflicting settings from all configs are preserved.
27: 
28: For example, if your global config sets autoupdate: true and your project config sets model: "anthropic/claude-sonnet-4-5", the final configuration will include both settings.
29: 
30: Precedence order
31: Config sources are loaded in this order (later sources override earlier ones):
32: 
33: Remote config (from .well-known/opencode) - organizational defaults
34: Global config (~/.config/opencode/opencode.json) - user preferences
35: Custom config (OPENCODE_CONFIG env var) - custom overrides
36: Project config (opencode.json in project) - project-specific settings
37: .opencode directories - agents, commands, plugins
38: Inline config (OPENCODE_CONFIG_CONTENT env var) - runtime overrides
39: This means project configs can override global defaults, and global configs can override remote organizational defaults.
40: 
41: Note
42: 
43: The .opencode and ~/.config/opencode directories use plural names for subdirectories: agents/, commands/, modes/, plugins/, skills/, tools/, and themes/. Singular names (e.g., agent/) are also supported for backwards compatibility.
44: 
45: Remote
46: Organizations can provide default configuration via the .well-known/opencode endpoint. This is fetched automatically when you authenticate with a provider that supports it.
47: 
48: Remote config is loaded first, serving as the base layer. All other config sources (global, project) can override these defaults.
49: 
50: For example, if your organization provides MCP servers that are disabled by default:
51: 
52: Remote config from .well-known/opencode
53: {
54:   "mcp": {
55:     "jira": {
56:       "type": "remote",
57:       "url": "https://jira.example.com/mcp",
58:       "enabled": false
59:     }
60:   }
61: }
62: 
63: You can enable specific servers in your local config:
64: 
65: opencode.json
66: {
67:   "mcp": {
68:     "jira": {
69:       "type": "remote",
70:       "url": "https://jira.example.com/mcp",
71:       "enabled": true
72:     }
73:   }
74: }
75: 
76: Global
77: Place your global OpenCode config in ~/.config/opencode/opencode.json. Use global config for user-wide server/runtime preferences like providers, models, and permissions.
78: 
79: For TUI-specific settings, use ~/.config/opencode/tui.json.
80: 
81: Global config overrides remote organizational defaults.
82: 
83: Per project
84: Add opencode.json in your project root. Project config has the highest precedence among standard config files - it overrides both global and remote configs.
85: 
86: For project-specific TUI settings, add tui.json alongside it.
87: 
88: Tip
89: 
90: Place project specific config in the root of your project.
91: 
92: When OpenCode starts up, it looks for a config file in the current directory or traverse up to the nearest Git directory.
93: 
94: This is also safe to be checked into Git and uses the same schema as the global one.
95: 
96: Custom path
97: Specify a custom config file path using the OPENCODE_CONFIG environment variable.
98: 
99: Terminal window
100: export OPENCODE_CONFIG=/path/to/my/custom-config.json
101: opencode run "Hello world"
102: 
103: Custom config is loaded between global and project configs in the precedence order.
104: 
105: Custom directory
106: Specify a custom config directory using the OPENCODE_CONFIG_DIR environment variable. This directory will be searched for agents, commands, modes, and plugins just like the standard .opencode directory, and should follow the same structure.
107: 
108: Terminal window
109: export OPENCODE_CONFIG_DIR=/path/to/my/config-directory
110: opencode run "Hello world"
111: 
112: The custom directory is loaded after the global config and .opencode directories, so it can override their settings.
113: 
114: Schema
115: The server/runtime config schema is defined in opencode.ai/config.json.
116: 
117: TUI config uses opencode.ai/tui.json.
118: 
119: Your editor should be able to validate and autocomplete based on the schema.
120: 
121: TUI
122: Use a dedicated tui.json (or tui.jsonc) file for TUI-specific settings.
123: 
124: tui.json
125: {
126:   "$schema": "https://opencode.ai/tui.json",
127:   "scroll_speed": 3,
128:   "scroll_acceleration": {
129:     "enabled": true
130:   },
131:   "diff_style": "auto"
132: }
133: 
134: Use OPENCODE_TUI_CONFIG to point to a custom TUI config file.
135: 
136: Legacy theme, keybinds, and tui keys in opencode.json are deprecated and automatically migrated when possible.
137: 
138: Learn more about TUI configuration here.
139: 
140: Server
141: You can configure server settings for the opencode serve and opencode web commands through the server option.
142: 
143: opencode.json
144: {
145:   "$schema": "https://opencode.ai/config.json",
146:   "server": {
147:     "port": 4096,
148:     "hostname": "0.0.0.0",
149:     "mdns": true,
150:     "mdnsDomain": "myproject.local",
151:     "cors": ["http://localhost:5173"]
152:   }
153: }
154: 
155: Available options:
156: 
157: port - Port to listen on.
158: hostname - Hostname to listen on. When mdns is enabled and no hostname is set, defaults to 0.0.0.0.
159: mdns - Enable mDNS service discovery. This allows other devices on the network to discover your OpenCode server.
160: mdnsDomain - Custom domain name for mDNS service. Defaults to opencode.local. Useful for running multiple instances on the same network.
161: cors - Additional origins to allow for CORS when using the HTTP server from a browser-based client. Values must be full origins (scheme + host + optional port), eg https://app.example.com.
162: Learn more about the server here.
163: 
164: Tools
165: You can manage the tools an LLM can use through the tools option.
166: 
167: opencode.json
168: {
169:   "$schema": "https://opencode.ai/config.json",
170:   "tools": {
171:     "write": false,
172:     "bash": false
173:   }
174: }
175: 
176: Learn more about tools here.
177: 
178: Models
179: You can configure the providers and models you want to use in your OpenCode config through the provider, model and small_model options.
180: 
181: opencode.json
182: {
183:   "$schema": "https://opencode.ai/config.json",
184:   "provider": {},
185:   "model": "anthropic/claude-sonnet-4-5",
186:   "small_model": "anthropic/claude-haiku-4-5"
187: }
188: 
189: The small_model option configures a separate model for lightweight tasks like title generation. By default, OpenCode tries to use a cheaper model if one is available from your provider, otherwise it falls back to your main model.
190: 
191: Provider options can include timeout, chunkTimeout, and setCacheKey:
192: 
193: opencode.json
194: {
195:   "$schema": "https://opencode.ai/config.json",
196:   "provider": {
197:     "anthropic": {
198:       "options": {
199:         "timeout": 600000,
200:         "chunkTimeout": 30000,
201:         "setCacheKey": true
202:       }
203:     }
204:   }
205: }
206: 
207: timeout - Request timeout in milliseconds (default: 300000). Set to false to disable.
208: chunkTimeout - Timeout in milliseconds between streamed response chunks. If no chunk arrives in time, the request is aborted.
209: setCacheKey - Ensure a cache key is always set for designated provider.
210: You can also configure local models. Learn more.
211: 
212: Provider-Specific Options
213: Some providers support additional configuration options beyond the generic timeout and apiKey settings.
214: 
215: Amazon Bedrock
216: Amazon Bedrock supports AWS-specific configuration:
217: 
218: opencode.json
219: {
220:   "$schema": "https://opencode.ai/config.json",
221:   "provider": {
222:     "amazon-bedrock": {
223:       "options": {
224:         "region": "us-east-1",
225:         "profile": "my-aws-profile",
226:         "endpoint": "https://bedrock-runtime.us-east-1.vpce-xxxxx.amazonaws.com"
227:       }
228:     }
229:   }
230: }
231: 
232: region - AWS region for Bedrock (defaults to AWS_REGION env var or us-east-1)
233: profile - AWS named profile from ~/.aws/credentials (defaults to AWS_PROFILE env var)
234: endpoint - Custom endpoint URL for VPC endpoints. This is an alias for the generic baseURL option using AWS-specific terminology. If both are specified, endpoint takes precedence.
235: Note
236: 
237: Bearer tokens (AWS_BEARER_TOKEN_BEDROCK or /connect) take precedence over profile-based authentication. See authentication precedence for details.
238: 
239: Learn more about Amazon Bedrock configuration.
240: 
241: Themes
242: Set your UI theme in tui.json.
243: 
244: tui.json
245: {
246:   "$schema": "https://opencode.ai/tui.json",
247:   "theme": "tokyonight"
248: }
249: 
250: Learn more here.
251: 
252: Agents
253: You can configure specialized agents for specific tasks through the agent option.
254: 
255: opencode.jsonc
256: {
257:   "$schema": "https://opencode.ai/config.json",
258:   "agent": {
259:     "code-reviewer": {
260:       "description": "Reviews code for best practices and potential issues",
261:       "model": "anthropic/claude-sonnet-4-5",
262:       "prompt": "You are a code reviewer. Focus on security, performance, and maintainability.",
263:       "tools": {
264:         // Disable file modification tools for review-only agent
265:         "write": false,
266:         "edit": false,
267:       },
268:     },
269:   },
270: }
271: 
272: You can also define agents using markdown files in ~/.config/opencode/agents/ or .opencode/agents/. Learn more here.
273: 
274: Default agent
275: You can set the default agent using the default_agent option. This determines which agent is used when none is explicitly specified.
276: 
277: opencode.json
278: {
279:   "$schema": "https://opencode.ai/config.json",
280:   "default_agent": "plan"
281: }
282: 
283: The default agent must be a primary agent (not a subagent). This can be a built-in agent like "build" or "plan", or a custom agent you’ve defined. If the specified agent doesn’t exist or is a subagent, OpenCode will fall back to "build" with a warning.
284: 
285: This setting applies across all interfaces: TUI, CLI (opencode run), desktop app, and GitHub Action.
286: 
287: Sharing
288: You can configure the share feature through the share option.
289: 
290: opencode.json
291: {
292:   "$schema": "https://opencode.ai/config.json",
293:   "share": "manual"
294: }
295: 
296: This takes:
297: 
298: "manual" - Allow manual sharing via commands (default)
299: "auto" - Automatically share new conversations
300: "disabled" - Disable sharing entirely
301: By default, sharing is set to manual mode where you need to explicitly share conversations using the /share command.
302: 
303: Commands
304: You can configure custom commands for repetitive tasks through the command option.
305: 
306: opencode.jsonc
307: {
308:   "$schema": "https://opencode.ai/config.json",
309:   "command": {
310:     "test": {
311:       "template": "Run the full test suite with coverage report and show any failures.\nFocus on the failing tests and suggest fixes.",
312:       "description": "Run tests with coverage",
313:       "agent": "build",
314:       "model": "anthropic/claude-haiku-4-5",
315:     },
316:     "component": {
317:       "template": "Create a new React component named $ARGUMENTS with TypeScript support.\nInclude proper typing and basic structure.",
318:       "description": "Create a new component",
319:     },
320:   },
321: }
322: 
323: You can also define commands using markdown files in ~/.config/opencode/commands/ or .opencode/commands/. Learn more here.
324: 
325: Keybinds
326: Customize keybinds in tui.json.
327: 
328: tui.json
329: {
330:   "$schema": "https://opencode.ai/tui.json",
331:   "keybinds": {}
332: }
333: 
334: Learn more here.
335: 
336: Snapshot
337: OpenCode uses snapshots to track file changes during agent operations, enabling you to undo and revert changes within a session. Snapshots are enabled by default.
338: 
339: For large repositories or projects with many submodules, the snapshot system can cause slow indexing and significant disk usage as it tracks all changes using an internal git repository. You can disable snapshots using the snapshot option.
340: 
341: opencode.json
342: {
343:   "$schema": "https://opencode.ai/config.json",
344:   "snapshot": false
345: }
346: 
347: Note that disabling snapshots means changes made by the agent cannot be rolled back through the UI.
348: 
349: Autoupdate
350: OpenCode will automatically download any new updates when it starts up. You can disable this with the autoupdate option.
351: 
352: opencode.json
353: {
354:   "$schema": "https://opencode.ai/config.json",
355:   "autoupdate": false
356: }
357: 
358: If you don’t want updates but want to be notified when a new version is available, set autoupdate to "notify". Notice that this only works if it was not installed using a package manager such as Homebrew.
359: 
360: Formatters
361: You can configure code formatters through the formatter option.
362: 
363: opencode.json
364: {
365:   "$schema": "https://opencode.ai/config.json",
366:   "formatter": {
367:     "prettier": {
368:       "disabled": true
369:     },
370:     "custom-prettier": {
371:       "command": ["npx", "prettier", "--write", "$FILE"],
372:       "environment": {
373:         "NODE_ENV": "development"
374:       },
375:       "extensions": [".js", ".ts", ".jsx", ".tsx"]
376:     }
377:   }
378: }
379: 
380: Learn more about formatters here.
381: 
382: Permissions
383: By default, opencode allows all operations without requiring explicit approval. You can change this using the permission option.
384: 
385: For example, to ensure that the edit and bash tools require user approval:
386: 
387: opencode.json
388: {
389:   "$schema": "https://opencode.ai/config.json",
390:   "permission": {
391:     "edit": "ask",
392:     "bash": "ask"
393:   }
394: }
395: 
396: Learn more about permissions here.
397: 
398: Compaction
399: You can control context compaction behavior through the compaction option.
400: 
401: opencode.json
402: {
403:   "$schema": "https://opencode.ai/config.json",
404:   "compaction": {
405:     "auto": true,
406:     "prune": true,
407:     "reserved": 10000
408:   }
409: }
410: 
411: auto - Automatically compact the session when context is full (default: true).
412: prune - Remove old tool outputs to save tokens (default: true).
413: reserved - Token buffer for compaction. Leaves enough window to avoid overflow during compaction
414: Watcher
415: You can configure file watcher ignore patterns through the watcher option.
416: 
417: opencode.json
418: {
419:   "$schema": "https://opencode.ai/config.json",
420:   "watcher": {
421:     "ignore": ["node_modules/**", "dist/**", ".git/**"]
422:   }
423: }
424: 
425: Patterns follow glob syntax. Use this to exclude noisy directories from file watching.
426: 
427: MCP servers
428: You can configure MCP servers you want to use through the mcp option.
429: 
430: opencode.json
431: {
432:   "$schema": "https://opencode.ai/config.json",
433:   "mcp": {}
434: }
435: 
436: Learn more here.
437: 
438: Plugins
439: Plugins extend OpenCode with custom tools, hooks, and integrations.
440: 
441: Place plugin files in .opencode/plugins/ or ~/.config/opencode/plugins/. You can also load plugins from npm through the plugin option.
442: 
443: opencode.json
444: {
445:   "$schema": "https://opencode.ai/config.json",
446:   "plugin": ["opencode-helicone-session", "@my-org/custom-plugin"]
447: }
448: 
449: Learn more here.
450: 
451: Instructions
452: You can configure the instructions for the model you’re using through the instructions option.
453: 
454: opencode.json
455: {
456:   "$schema": "https://opencode.ai/config.json",
457:   "instructions": ["CONTRIBUTING.md", "docs/guidelines.md", ".cursor/rules/*.md"]
458: }
459: 
460: This takes an array of paths and glob patterns to instruction files. Learn more about rules here.
461: 
462: Disabled providers
463: You can disable providers that are loaded automatically through the disabled_providers option. This is useful when you want to prevent certain providers from being loaded even if their credentials are available.
464: 
465: opencode.json
466: {
467:   "$schema": "https://opencode.ai/config.json",
468:   "disabled_providers": ["openai", "gemini"]
469: }
470: 
471: Note
472: 
473: The disabled_providers takes priority over enabled_providers.
474: 
475: The disabled_providers option accepts an array of provider IDs. When a provider is disabled:
476: 
477: It won’t be loaded even if environment variables are set.
478: It won’t be loaded even if API keys are configured through the /connect command.
479: The provider’s models won’t appear in the model selection list.
480: Enabled providers
481: You can specify an allowlist of providers through the enabled_providers option. When set, only the specified providers will be enabled and all others will be ignored.
482: 
483: opencode.json
484: {
485:   "$schema": "https://opencode.ai/config.json",
486:   "enabled_providers": ["anthropic", "openai"]
487: }
488: 
489: This is useful when you want to restrict OpenCode to only use specific providers rather than disabling them one by one.
490: 
491: Note
492: 
493: The disabled_providers takes priority over enabled_providers.
494: 
495: If a provider appears in both enabled_providers and disabled_providers, the disabled_providers takes priority for backwards compatibility.
496: 
497: Experimental
498: The experimental key contains options that are under active development.
499: 
500: opencode.json
501: {
502:   "$schema": "https://opencode.ai/config.json",
503:   "experimental": {}
504: }
505: 
506: Caution
507: 
508: Experimental options are not stable. They may change or be removed without notice.
509: 
510: Variables
511: You can use variable substitution in your config files to reference environment variables and file contents.
512: 
513: Env vars
514: Use {env:VARIABLE_NAME} to substitute environment variables:
515: 
516: opencode.json
517: {
518:   "$schema": "https://opencode.ai/config.json",
519:   "model": "{env:OPENCODE_MODEL}",
520:   "provider": {
521:     "anthropic": {
522:       "models": {},
523:       "options": {
524:         "apiKey": "{env:ANTHROPIC_API_KEY}"
525:       }
526:     }
527:   }
528: }
529: 
530: If the environment variable is not set, it will be replaced with an empty string.
531: 
532: Files
533: Use {file:path/to/file} to substitute the contents of a file:
534: 
535: opencode.json
536: {
537:   "$schema": "https://opencode.ai/config.json",
538:   "instructions": ["./custom-instructions.md"],
539:   "provider": {
540:     "openai": {
541:       "options": {
542:         "apiKey": "{file:~/.secrets/openai-key}"
543:       }
544:     }
545:   }
546: }
547: 
548: File paths can be:
549: 
550: Relative to the config file directory
551: Or absolute paths starting with / or ~
552: These are useful for:
553: 
554: Keeping sensitive data like API keys in separate files.
555: Including large instruction files without cluttering your config.
556: Sharing common configuration snippets across multiple config files.

(End of file - total 556 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/opencode/opencode-agents.md"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/opencode/opencode-agents.md</path>
<type>file</type>
<content>1: Agents
2: Configure and use specialized agents.
3: 
4: Agents are specialized AI assistants that can be configured for specific tasks and workflows. They allow you to create focused tools with custom prompts, models, and tool access.
5: 
6: Tip
7: 
8: Use the plan agent to analyze code and review suggestions without making any code changes.
9: 
10: You can switch between agents during a session or invoke them with the @ mention.
11: 
12: Types
13: There are two types of agents in OpenCode; primary agents and subagents.
14: 
15: Primary agents
16: Primary agents are the main assistants you interact with directly. You can cycle through them using the Tab key, or your configured switch_agent keybind. These agents handle your main conversation. Tool access is configured via permissions — for example, Build has all tools enabled while Plan is restricted.
17: 
18: Tip
19: 
20: You can use the Tab key to switch between primary agents during a session.
21: 
22: OpenCode comes with two built-in primary agents, Build and Plan. We’ll look at these below.
23: 
24: Subagents
25: Subagents are specialized assistants that primary agents can invoke for specific tasks. You can also manually invoke them by @ mentioning them in your messages.
26: 
27: OpenCode comes with two built-in subagents, General and Explore. We’ll look at this below.
28: 
29: Built-in
30: OpenCode comes with two built-in primary agents and two built-in subagents.
31: 
32: Use build
33: Mode: primary
34: 
35: Build is the default primary agent with all tools enabled. This is the standard agent for development work where you need full access to file operations and system commands.
36: 
37: Use plan
38: Mode: primary
39: 
40: A restricted agent designed for planning and analysis. We use a permission system to give you more control and prevent unintended changes. By default, all of the following are set to ask:
41: 
42: file edits: All writes, patches, and edits
43: bash: All bash commands
44: This agent is useful when you want the LLM to analyze code, suggest changes, or create plans without making any actual modifications to your codebase.
45: 
46: Use general
47: Mode: subagent
48: 
49: A general-purpose agent for researching complex questions and executing multi-step tasks. Has full tool access (except todo), so it can make file changes when needed. Use this to run multiple units of work in parallel.
50: 
51: Use explore
52: Mode: subagent
53: 
54: A fast, read-only agent for exploring codebases. Cannot modify files. Use this when you need to quickly find files by patterns, search code for keywords, or answer questions about the codebase.
55: 
56: Use compaction
57: Mode: primary
58: 
59: Hidden system agent that compacts long context into a smaller summary. It runs automatically when needed and is not selectable in the UI.
60: 
61: Use title
62: Mode: primary
63: 
64: Hidden system agent that generates short session titles. It runs automatically and is not selectable in the UI.
65: 
66: Use summary
67: Mode: primary
68: 
69: Hidden system agent that creates session summaries. It runs automatically and is not selectable in the UI.
70: 
71: Usage
72: For primary agents, use the Tab key to cycle through them during a session. You can also use your configured switch_agent keybind.
73: 
74: Subagents can be invoked:
75: 
76: Automatically by primary agents for specialized tasks based on their descriptions.
77: 
78: Manually by @ mentioning a subagent in your message. For example.
79: 
80: @general help me search for this function
81: 
82: Navigation between sessions: When subagents create child sessions, use session_child_first (default: <Leader>+Down) to enter the first child session from the parent.
83: 
84: Once you are in a child session, use:
85: 
86: session_child_cycle (default: Right) to cycle to the next child session
87: session_child_cycle_reverse (default: Left) to cycle to the previous child session
88: session_parent (default: Up) to return to the parent session
89: This lets you switch between the main conversation and specialized subagent work.
90: 
91: Configure
92: You can customize the built-in agents or create your own through configuration. Agents can be configured in two ways:
93: 
94: JSON
95: Configure agents in your opencode.json config file:
96: 
97: opencode.json
98: {
99:   "$schema": "https://opencode.ai/config.json",
100:   "agent": {
101:     "build": {
102:       "mode": "primary",
103:       "model": "anthropic/claude-sonnet-4-20250514",
104:       "prompt": "{file:./prompts/build.txt}",
105:       "tools": {
106:         "write": true,
107:         "edit": true,
108:         "bash": true
109:       }
110:     },
111:     "plan": {
112:       "mode": "primary",
113:       "model": "anthropic/claude-haiku-4-20250514",
114:       "tools": {
115:         "write": false,
116:         "edit": false,
117:         "bash": false
118:       }
119:     },
120:     "code-reviewer": {
121:       "description": "Reviews code for best practices and potential issues",
122:       "mode": "subagent",
123:       "model": "anthropic/claude-sonnet-4-20250514",
124:       "prompt": "You are a code reviewer. Focus on security, performance, and maintainability.",
125:       "tools": {
126:         "write": false,
127:         "edit": false
128:       }
129:     }
130:   }
131: }
132: 
133: Markdown
134: You can also define agents using markdown files. Place them in:
135: 
136: Global: ~/.config/opencode/agents/
137: Per-project: .opencode/agents/
138: ~/.config/opencode/agents/review.md
139: ---
140: description: Reviews code for quality and best practices
141: mode: subagent
142: model: anthropic/claude-sonnet-4-20250514
143: temperature: 0.1
144: tools:
145:   write: false
146:   edit: false
147:   bash: false
148: ---
149: 
150: You are in code review mode. Focus on:
151: 
152: - Code quality and best practices
153: - Potential bugs and edge cases
154: - Performance implications
155: - Security considerations
156: 
157: Provide constructive feedback without making direct changes.
158: 
159: The markdown file name becomes the agent name. For example, review.md creates a review agent.
160: 
161: Options
162: Let’s look at these configuration options in detail.
163: 
164: Description
165: Use the description option to provide a brief description of what the agent does and when to use it.
166: 
167: opencode.json
168: {
169:   "agent": {
170:     "review": {
171:       "description": "Reviews code for best practices and potential issues"
172:     }
173:   }
174: }
175: 
176: This is a required config option.
177: 
178: Temperature
179: Control the randomness and creativity of the LLM’s responses with the temperature config.
180: 
181: Lower values make responses more focused and deterministic, while higher values increase creativity and variability.
182: 
183: opencode.json
184: {
185:   "agent": {
186:     "plan": {
187:       "temperature": 0.1
188:     },
189:     "creative": {
190:       "temperature": 0.8
191:     }
192:   }
193: }
194: 
195: Temperature values typically range from 0.0 to 1.0:
196: 
197: 0.0-0.2: Very focused and deterministic responses, ideal for code analysis and planning
198: 0.3-0.5: Balanced responses with some creativity, good for general development tasks
199: 0.6-1.0: More creative and varied responses, useful for brainstorming and exploration
200: opencode.json
201: {
202:   "agent": {
203:     "analyze": {
204:       "temperature": 0.1,
205:       "prompt": "{file:./prompts/analysis.txt}"
206:     },
207:     "build": {
208:       "temperature": 0.3
209:     },
210:     "brainstorm": {
211:       "temperature": 0.7,
212:       "prompt": "{file:./prompts/creative.txt}"
213:     }
214:   }
215: }
216: 
217: If no temperature is specified, OpenCode uses model-specific defaults; typically 0 for most models, 0.55 for Qwen models.
218: 
219: Max steps
220: Control the maximum number of agentic iterations an agent can perform before being forced to respond with text only. This allows users who wish to control costs to set a limit on agentic actions.
221: 
222: If this is not set, the agent will continue to iterate until the model chooses to stop or the user interrupts the session.
223: 
224: opencode.json
225: {
226:   "agent": {
227:     "quick-thinker": {
228:       "description": "Fast reasoning with limited iterations",
229:       "prompt": "You are a quick thinker. Solve problems with minimal steps.",
230:       "steps": 5
231:     }
232:   }
233: }
234: 
235: When the limit is reached, the agent receives a special system prompt instructing it to respond with a summarization of its work and recommended remaining tasks.
236: 
237: Caution
238: 
239: The legacy maxSteps field is deprecated. Use steps instead.
240: 
241: Disable
242: Set to true to disable the agent.
243: 
244: opencode.json
245: {
246:   "agent": {
247:     "review": {
248:       "disable": true
249:     }
250:   }
251: }
252: 
253: Prompt
254: Specify a custom system prompt file for this agent with the prompt config. The prompt file should contain instructions specific to the agent’s purpose.
255: 
256: opencode.json
257: {
258:   "agent": {
259:     "review": {
260:       "prompt": "{file:./prompts/code-review.txt}"
261:     }
262:   }
263: }
264: 
265: This path is relative to where the config file is located. So this works for both the global OpenCode config and the project specific config.
266: 
267: Model
268: Use the model config to override the model for this agent. Useful for using different models optimized for different tasks. For example, a faster model for planning, a more capable model for implementation.
269: 
270: Tip
271: 
272: If you don’t specify a model, primary agents use the model globally configured while subagents will use the model of the primary agent that invoked the subagent.
273: 
274: opencode.json
275: {
276:   "agent": {
277:     "plan": {
278:       "model": "anthropic/claude-haiku-4-20250514"
279:     }
280:   }
281: }
282: 
283: The model ID in your OpenCode config uses the format provider/model-id. For example, if you’re using OpenCode Zen, you would use opencode/gpt-5.1-codex for GPT 5.1 Codex.
284: 
285: Tools (deprecated)
286: tools is deprecated. Prefer the agent’s permission field for new configs, updates and more fine-grained control.
287: 
288: Allows you to control which tools are available in this agent. You can enable or disable specific tools by setting them to true or false. In an agent’s tools config, true is equivalent to {"*": "allow"} permission and false is equivalent to {"*": "deny"} permission.
289: 
290: opencode.json
291: {
292:   "$schema": "https://opencode.ai/config.json",
293:   "tools": {
294:     "write": true,
295:     "bash": true
296:   },
297:   "agent": {
298:     "plan": {
299:       "tools": {
300:         "write": false,
301:         "bash": false
302:       }
303:     }
304:   }
305: }
306: 
307: Note
308: 
309: The agent-specific config overrides the global config.
310: 
311: You can also use wildcards in legacy tools entries to control multiple tools at once. For example, to disable all tools from an MCP server:
312: 
313: opencode.json
314: {
315:   "$schema": "https://opencode.ai/config.json",
316:   "agent": {
317:     "readonly": {
318:       "tools": {
319:         "mymcp_*": false,
320:         "write": false,
321:         "edit": false
322:       }
323:     }
324:   }
325: }
326: 
327: Learn more about tools.
328: 
329: Permissions
330: You can configure permissions to manage what actions an agent can take. Currently, the permissions for the edit, bash, and webfetch tools can be configured to:
331: 
332: "ask" — Prompt for approval before running the tool
333: "allow" — Allow all operations without approval
334: "deny" — Disable the tool
335: opencode.json
336: {
337:   "$schema": "https://opencode.ai/config.json",
338:   "permission": {
339:     "edit": "deny"
340:   }
341: }
342: 
343: You can override these permissions per agent.
344: 
345: opencode.json
346: {
347:   "$schema": "https://opencode.ai/config.json",
348:   "permission": {
349:     "edit": "deny"
350:   },
351:   "agent": {
352:     "build": {
353:       "permission": {
354:         "edit": "ask"
355:       }
356:     }
357:   }
358: }
359: 
360: You can also set permissions in Markdown agents.
361: 
362: ~/.config/opencode/agents/review.md
363: ---
364: description: Code review without edits
365: mode: subagent
366: permission:
367:   edit: deny
368:   bash:
369:     "*": ask
370:     "git diff": allow
371:     "git log*": allow
372:     "grep *": allow
373:   webfetch: deny
374: ---
375: 
376: Only analyze code and suggest changes.
377: 
378: You can set permissions for specific bash commands.
379: 
380: opencode.json
381: {
382:   "$schema": "https://opencode.ai/config.json",
383:   "agent": {
384:     "build": {
385:       "permission": {
386:         "bash": {
387:           "git push": "ask",
388:           "grep *": "allow"
389:         }
390:       }
391:     }
392:   }
393: }
394: 
395: This can take a glob pattern.
396: 
397: opencode.json
398: {
399:   "$schema": "https://opencode.ai/config.json",
400:   "agent": {
401:     "build": {
402:       "permission": {
403:         "bash": {
404:           "git *": "ask"
405:         }
406:       }
407:     }
408:   }
409: }
410: 
411: And you can also use the * wildcard to manage permissions for all commands. Since the last matching rule takes precedence, put the * wildcard first and specific rules after.
412: 
413: opencode.json
414: {
415:   "$schema": "https://opencode.ai/config.json",
416:   "agent": {
417:     "build": {
418:       "permission": {
419:         "bash": {
420:           "*": "ask",
421:           "git status *": "allow"
422:         }
423:       }
424:     }
425:   }
426: }
427: 
428: Learn more about permissions.
429: 
430: Mode
431: Control the agent’s mode with the mode config. The mode option is used to determine how the agent can be used.
432: 
433: opencode.json
434: {
435:   "agent": {
436:     "review": {
437:       "mode": "subagent"
438:     }
439:   }
440: }
441: 
442: The mode option can be set to primary, subagent, or all. If no mode is specified, it defaults to all.
443: 
444: Hidden
445: Hide a subagent from the @ autocomplete menu with hidden: true. Useful for internal subagents that should only be invoked programmatically by other agents via the Task tool.
446: 
447: opencode.json
448: {
449:   "agent": {
450:     "internal-helper": {
451:       "mode": "subagent",
452:       "hidden": true
453:     }
454:   }
455: }
456: 
457: This only affects user visibility in the autocomplete menu. Hidden agents can still be invoked by the model via the Task tool if permissions allow.
458: 
459: Note
460: 
461: Only applies to mode: subagent agents.
462: 
463: Task permissions
464: Control which subagents an agent can invoke via the Task tool with permission.task. Uses glob patterns for flexible matching.
465: 
466: opencode.json
467: {
468:   "agent": {
469:     "orchestrator": {
470:       "mode": "primary",
471:       "permission": {
472:         "task": {
473:           "*": "deny",
474:           "orchestrator-*": "allow",
475:           "code-reviewer": "ask"
476:         }
477:       }
478:     }
479:   }
480: }
481: 
482: When set to deny, the subagent is removed from the Task tool description entirely, so the model won’t attempt to invoke it.
483: 
484: Tip
485: 
486: Rules are evaluated in order, and the last matching rule wins. In the example above, orchestrator-planner matches both * (deny) and orchestrator-* (allow), but since orchestrator-* comes after *, the result is allow.
487: 
488: Tip
489: 
490: Users can always invoke any subagent directly via the @ autocomplete menu, even if the agent’s task permissions would deny it.
491: 
492: Color
493: Customize the agent’s visual appearance in the UI with the color option. This affects how the agent appears in the interface.
494: 
495: Use a valid hex color (e.g., #FF5733) or theme color: primary, secondary, accent, success, warning, error, info.
496: 
497: opencode.json
498: {
499:   "agent": {
500:     "creative": {
501:       "color": "#ff6b6b"
502:     },
503:     "code-reviewer": {
504:       "color": "accent"
505:     }
506:   }
507: }
508: 
509: Top P
510: Control response diversity with the top_p option. Alternative to temperature for controlling randomness.
511: 
512: opencode.json
513: {
514:   "agent": {
515:     "brainstorm": {
516:       "top_p": 0.9
517:     }
518:   }
519: }
520: 
521: Values range from 0.0 to 1.0. Lower values are more focused, higher values more diverse.
522: 
523: Additional
524: Any other options you specify in your agent configuration will be passed through directly to the provider as model options. This allows you to use provider-specific features and parameters.
525: 
526: For example, with OpenAI’s reasoning models, you can control the reasoning effort:
527: 
528: opencode.json
529: {
530:   "agent": {
531:     "deep-thinker": {
532:       "description": "Agent that uses high reasoning effort for complex problems",
533:       "model": "openai/gpt-5",
534:       "reasoningEffort": "high",
535:       "textVerbosity": "low"
536:     }
537:   }
538: }
539: 
540: These additional options are model and provider-specific. Check your provider’s documentation for available parameters.
541: 
542: Tip
543: 
544: Run opencode models to see a list of the available models.
545: 
546: Create agents
547: You can create new agents using the following command:
548: 
549: Terminal window
550: opencode agent create
551: 
552: This interactive command will:
553: 
554: Ask where to save the agent; global or project-specific.
555: Description of what the agent should do.
556: Generate an appropriate system prompt and identifier.
557: Let you select which tools the agent can access.
558: Finally, create a markdown file with the agent configuration.
559: Use cases
560: Here are some common use cases for different agents.
561: 
562: Build agent: Full development work with all tools enabled
563: Plan agent: Analysis and planning without making changes
564: Review agent: Code review with read-only access plus documentation tools
565: Debug agent: Focused on investigation with bash and read tools enabled
566: Docs agent: Documentation writing with file operations but no system commands
567: Examples
568: Here are some example agents you might find useful.
569: 
570: Tip
571: 
572: Do you have an agent you’d like to share? Submit a PR.
573: 
574: Documentation agent
575: ~/.config/opencode/agents/docs-writer.md
576: ---
577: description: Writes and maintains project documentation
578: mode: subagent
579: tools:
580:   bash: false
581: ---
582: 
583: You are a technical writer. Create clear, comprehensive documentation.
584: 
585: Focus on:
586: 
587: - Clear explanations
588: - Proper structure
589: - Code examples
590: - User-friendly language
591: 
592: Security auditor
593: ~/.config/opencode/agents/security-auditor.md
594: ---
595: description: Performs security audits and identifies vulnerabilities
596: mode: subagent
597: tools:
598:   write: false
599:   edit: false
600: ---
601: 
602: You are a security expert. Focus on identifying potential security issues.
603: 
604: Look for:
605: 
606: - Input validation vulnerabilities
607: - Authentication and authorization flaws
608: - Data exposure risks
609: - Dependency vulnerabilities
610: - Configuration security issues
611: 

(End of file - total 611 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/opencode/opencode-sdk.md"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/opencode/opencode-sdk.md</path>
<type>file</type>
<content>1: SDK
2: Type-safe JS client for opencode server.
3: 
4: The opencode JS/TS SDK provides a type-safe client for interacting with the server. Use it to build integrations and control opencode programmatically.
5: 
6: Learn more about how the server works. For examples, check out the projects built by the community.
7: 
8: Install
9: Install the SDK from npm:
10: 
11: Terminal window
12: npm install @opencode-ai/sdk
13: 
14: Create client
15: Create an instance of opencode:
16: 
17: import { createOpencode } from "@opencode-ai/sdk"
18: 
19: const { client } = await createOpencode()
20: 
21: This starts both a server and a client
22: 
23: Options
24: Option	Type	Description	Default
25: hostname	string	Server hostname	127.0.0.1
26: port	number	Server port	4096
27: signal	AbortSignal	Abort signal for cancellation	undefined
28: timeout	number	Timeout in ms for server start	5000
29: config	Config	Configuration object	{}
30: Config
31: You can pass a configuration object to customize behavior. The instance still picks up your opencode.json, but you can override or add configuration inline:
32: 
33: import { createOpencode } from "@opencode-ai/sdk"
34: 
35: const opencode = await createOpencode({
36:   hostname: "127.0.0.1",
37:   port: 4096,
38:   config: {
39:     model: "anthropic/claude-3-5-sonnet-20241022",
40:   },
41: })
42: 
43: console.log(`Server running at ${opencode.server.url}`)
44: 
45: opencode.server.close()
46: 
47: Client only
48: If you already have a running instance of opencode, you can create a client instance to connect to it:
49: 
50: import { createOpencodeClient } from "@opencode-ai/sdk"
51: 
52: const client = createOpencodeClient({
53:   baseUrl: "http://localhost:4096",
54: })
55: 
56: Options
57: Option	Type	Description	Default
58: baseUrl	string	URL of the server	http://localhost:4096
59: fetch	function	Custom fetch implementation	globalThis.fetch
60: parseAs	string	Response parsing method	auto
61: responseStyle	string	Return style: data or fields	fields
62: throwOnError	boolean	Throw errors instead of return	false
63: Types
64: The SDK includes TypeScript definitions for all API types. Import them directly:
65: 
66: import type { Session, Message, Part } from "@opencode-ai/sdk"
67: 
68: All types are generated from the server’s OpenAPI specification and available in the types file.
69: 
70: Errors
71: The SDK can throw errors that you can catch and handle:
72: 
73: try {
74:   await client.session.get({ path: { id: "invalid-id" } })
75: } catch (error) {
76:   console.error("Failed to get session:", (error as Error).message)
77: }
78: 
79: Structured Output
80: You can request structured JSON output from the model by specifying an format with a JSON schema. The model will use a StructuredOutput tool to return validated JSON matching your schema.
81: 
82: Basic Usage
83: const result = await client.session.prompt({
84:   path: { id: sessionId },
85:   body: {
86:     parts: [{ type: "text", text: "Research Anthropic and provide company info" }],
87:     format: {
88:       type: "json_schema",
89:       schema: {
90:         type: "object",
91:         properties: {
92:           company: { type: "string", description: "Company name" },
93:           founded: { type: "number", description: "Year founded" },
94:           products: {
95:             type: "array",
96:             items: { type: "string" },
97:             description: "Main products",
98:           },
99:         },
100:         required: ["company", "founded"],
101:       },
102:     },
103:   },
104: })
105: 
106: // Access the structured output
107: console.log(result.data.info.structured_output)
108: // { company: "Anthropic", founded: 2021, products: ["Claude", "Claude API"] }
109: 
110: Output Format Types
111: Type	Description
112: text	Default. Standard text response (no structured output)
113: json_schema	Returns validated JSON matching the provided schema
114: JSON Schema Format
115: When using type: 'json_schema', provide:
116: 
117: Field	Type	Description
118: type	'json_schema'	Required. Specifies JSON schema mode
119: schema	object	Required. JSON Schema object defining the output structure
120: retryCount	number	Optional. Number of validation retries (default: 2)
121: Error Handling
122: If the model fails to produce valid structured output after all retries, the response will include a StructuredOutputError:
123: 
124: if (result.data.info.error?.name === "StructuredOutputError") {
125:   console.error("Failed to produce structured output:", result.data.info.error.message)
126:   console.error("Attempts:", result.data.info.error.retries)
127: }
128: 
129: Best Practices
130: Provide clear descriptions in your schema properties to help the model understand what data to extract
131: Use required to specify which fields must be present
132: Keep schemas focused - complex nested schemas may be harder for the model to fill correctly
133: Set appropriate retryCount - increase for complex schemas, decrease for simple ones
134: APIs
135: The SDK exposes all server APIs through a type-safe client.
136: 
137: Global
138: Method	Description	Response
139: global.health()	Check server health and version	{ healthy: true, version: string }
140: Examples
141: const health = await client.global.health()
142: console.log(health.data.version)
143: 
144: App
145: Method	Description	Response
146: app.log()	Write a log entry	boolean
147: app.agents()	List all available agents	Agent[]
148: Examples
149: // Write a log entry
150: await client.app.log({
151:   body: {
152:     service: "my-app",
153:     level: "info",
154:     message: "Operation completed",
155:   },
156: })
157: 
158: // List available agents
159: const agents = await client.app.agents()
160: 
161: Project
162: Method	Description	Response
163: project.list()	List all projects	Project[]
164: project.current()	Get current project	Project
165: Examples
166: // List all projects
167: const projects = await client.project.list()
168: 
169: // Get current project
170: const currentProject = await client.project.current()
171: 
172: Path
173: Method	Description	Response
174: path.get()	Get current path	Path
175: Examples
176: // Get current path information
177: const pathInfo = await client.path.get()
178: 
179: Config
180: Method	Description	Response
181: config.get()	Get config info	Config
182: config.providers()	List providers and default models	{ providers: Provider[], default: { [key: string]: string } }
183: Examples
184: const config = await client.config.get()
185: 
186: const { providers, default: defaults } = await client.config.providers()
187: 
188: Sessions
189: Method	Description	Notes
190: session.list()	List sessions	Returns Session[]
191: session.get({ path })	Get session	Returns Session
192: session.children({ path })	List child sessions	Returns Session[]
193: session.create({ body })	Create session	Returns Session
194: session.delete({ path })	Delete session	Returns boolean
195: session.update({ path, body })	Update session properties	Returns Session
196: session.init({ path, body })	Analyze app and create AGENTS.md	Returns boolean
197: session.abort({ path })	Abort a running session	Returns boolean
198: session.share({ path })	Share session	Returns Session
199: session.unshare({ path })	Unshare session	Returns Session
200: session.summarize({ path, body })	Summarize session	Returns boolean
201: session.messages({ path })	List messages in a session	Returns { info: Message, parts: Part[]}[]
202: session.message({ path })	Get message details	Returns { info: Message, parts: Part[]}
203: session.prompt({ path, body })	Send prompt message	body.noReply: true returns UserMessage (context only). Default returns AssistantMessage with AI response. Supports body.outputFormat for structured output
204: session.command({ path, body })	Send command to session	Returns { info: AssistantMessage, parts: Part[]}
205: session.shell({ path, body })	Run a shell command	Returns AssistantMessage
206: session.revert({ path, body })	Revert a message	Returns Session
207: session.unrevert({ path })	Restore reverted messages	Returns Session
208: postSessionByIdPermissionsByPermissionId({ path, body })	Respond to a permission request	Returns boolean
209: Examples
210: // Create and manage sessions
211: const session = await client.session.create({
212:   body: { title: "My session" },
213: })
214: 
215: const sessions = await client.session.list()
216: 
217: // Send a prompt message
218: const result = await client.session.prompt({
219:   path: { id: session.id },
220:   body: {
221:     model: { providerID: "anthropic", modelID: "claude-3-5-sonnet-20241022" },
222:     parts: [{ type: "text", text: "Hello!" }],
223:   },
224: })
225: 
226: // Inject context without triggering AI response (useful for plugins)
227: await client.session.prompt({
228:   path: { id: session.id },
229:   body: {
230:     noReply: true,
231:     parts: [{ type: "text", text: "You are a helpful assistant." }],
232:   },
233: })
234: 
235: Files
236: Method	Description	Response
237: find.text({ query })	Search for text in files	Array of match objects with path, lines, line_number, absolute_offset, submatches
238: find.files({ query })	Find files and directories by name	string[] (paths)
239: find.symbols({ query })	Find workspace symbols	Symbol[]
240: file.read({ query })	Read a file	{ type: "raw" | "patch", content: string }
241: file.status({ query? })	Get status for tracked files	File[]
242: find.files supports a few optional query fields:
243: 
244: type: "file" or "directory"
245: directory: override the project root for the search
246: limit: max results (1–200)
247: Examples
248: // Search and read files
249: const textResults = await client.find.text({
250:   query: { pattern: "function.*opencode" },
251: })
252: 
253: const files = await client.find.files({
254:   query: { query: "*.ts", type: "file" },
255: })
256: 
257: const directories = await client.find.files({
258:   query: { query: "packages", type: "directory", limit: 20 },
259: })
260: 
261: const content = await client.file.read({
262:   query: { path: "src/index.ts" },
263: })
264: 
265: TUI
266: Method	Description	Response
267: tui.appendPrompt({ body })	Append text to the prompt	boolean
268: tui.openHelp()	Open the help dialog	boolean
269: tui.openSessions()	Open the session selector	boolean
270: tui.openThemes()	Open the theme selector	boolean
271: tui.openModels()	Open the model selector	boolean
272: tui.submitPrompt()	Submit the current prompt	boolean
273: tui.clearPrompt()	Clear the prompt	boolean
274: tui.executeCommand({ body })	Execute a command	boolean
275: tui.showToast({ body })	Show toast notification	boolean
276: Examples
277: // Control TUI interface
278: await client.tui.appendPrompt({
279:   body: { text: "Add this to prompt" },
280: })
281: 
282: await client.tui.showToast({
283:   body: { message: "Task completed", variant: "success" },
284: })
285: 
286: Auth
287: Method	Description	Response
288: auth.set({ ... })	Set authentication credentials	boolean
289: Examples
290: await client.auth.set({
291:   path: { id: "anthropic" },
292:   body: { type: "api", key: "your-api-key" },
293: })
294: 
295: Events
296: Method	Description	Response
297: event.subscribe()	Server-sent events stream	Server-sent events stream
298: Examples
299: // Listen to real-time events
300: const events = await client.event.subscribe()
301: for await (const event of events.stream) {
302:   console.log("Event:", event.type, event.properties)
303: }

(End of file - total 303 lines)
</content>
```

---

## Assistant (Hivefiver · xiaomi/mimo-v2-pro:free · 14.1s)

_Thinking:_

Now I have a comprehensive understanding of the current state from the session file and the SDK docs. Let me also read the remaining files from the session and the json-render library. Let me also check the rest of the session file and the JSON render SDK.

Let me also read the key source files referenced in the session to understand the current state before planning.

The user wants me to:
1. Continue the deep investigation and synthesis work from the session
2. Focus on the hivefiver module configuration system
3. Include planning artifacts and agent work contracts under src/
4. Build a TUI/GUI local graphic using Vercel JSON Render + OpenCode SDK

Let me now read the remaining session content and the json-render repomix output to understand what that library provides.

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin/.worktrees/product-detox/session-ses_2da9.md",
  "offset": 2446
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin/.worktrees/product-detox/session-ses_2da9.md</path>
<type>file</type>
<content>2446:    - Open the file. Don't trust the doc's word. The code is the authority.
2447: 3. **Prior Sessions** — Is memory corroborated by git or build output?
2448:    - If you "remember" something but git doesn't show it, the memory is wrong.
2449: 
2450: If step 1 fails → go straight to rot check. If step 2 or 3 fails → go full analysis.
2451: 
2452: ## Distrust Levels
2453: 
2454: Declare the level explicitly. Don't mumble "it might be stale." Say what it is.
2455: 
2456: | Level | Meaning | What To Do |
2457: |-------|---------|------------|
2458: | **CLEAN** | Docs, code, and git agree. Recent commits exist. Session state is readable. | Proceed normally. |
2459: | **SUSPECT** | One source disagrees with others, or documents are >48 hours old. | Cross-check the disagreeing source before trusting. |
2460: | **DEGRADED** | Multiple contradictions. Session state is stale or unreadable. | Run rot check. Quarantine unverified claims. |
2461: | **POLLUTED** | Active misinformation — docs claim things the code doesn't do, or AGENTS.md references non-existent files. | Trust-nothing mode. Verify everything from code and git. |
2462: | **POISONED** | Session context is actively contradictory. Prior session memory conflicts with git history. | Full analysis. Emit checkpoint. Do not proceed until trust is rebuilt. |
2463: 
2464: When DEGRADED or worse, say it out loud: "Context is DEGRADED. Distrusting [specific sources] until verified."
2465: 
2466: ## Routing Logic
2467: 
2468: ```
2469: Input: what's doubted?
2470:   ├── Session health, freshness, prior memory
2471:   │     → context-intelligence-entry
2472:   │       ├── --quick  (fast continuity probe)
2473:   │       ├── --rot    (deterministic PASS/FAIL gate)
2474:   │       └── --full   (deep trust breakdown)
2475:   │
2476:   └── Project state, build, tests, git structure
2477:         → context-entry-verify
2478:           ├── gate-chain  (fail-fast sequential)
2479:           ├── landscape   (full report, never blocks)
2480:           └── individual  (targeted gate checks)
2481: ```
2482: 
2483: ## Verification Gates (Project Reality)
2484: 
2485: When `context-entry-verify` is dispatched, these four layers run:
2486: 
2487: | Layer | What It Checks | Gate Type |
2488: |-------|---------------|-----------|
2489: | 1. Project Reality | Build, tests, contracts, dependencies, SDK surface | Hard — blocks |
2490: | 2. Planning Integrity | Plan files exist, reference real files, no contradictions | Hard — requires `.planning/` convention |
2491: | 3. Git Evidence | Branch state, last commit, diff stats, merge-conflict-free | Hard — blocks |
2492: | 4. Architecture | Domain boundaries, dead exports, circular dependencies | Soft — warnings only |
2493: 
2494: Layer 2 assumes a `.planning/` directory with `STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md`. If your project doesn't use that convention, use `landscape` instead of `gate-chain` to skip meaningless failures.
2495: 
2496: ## Freshness Probe
2497: 
2498: Quick checks you can run before dispatching:
2499: 
2500: - **Document age**: `find . -name "*.md" -mtime -2` — anything older than 2 days is suspect
2501: - **Git recency**: `git log --oneline -5` — if the latest commit is days old, session memory is stale
2502: - **Session state**: Check `.hivemind/activity/sessions/continuity.json` exists and has a recent `updated_at`
2503: - **Test signal**: Run `npx tsc --noEmit && npm test` — if tests pass but code looks wrong, the test is lying
2504: 
2505: ## Distrust Protocol
2506: 
2507: When rot is detected or after session interruption:
2508: 
2509: 1. **Trust-Nothing Mode**: Treat all prior context as stale until verified from code, git, or build output. Not "mostly trustworthy." Stale.
2510: 2. **AGENTS.md Quarantine**: Verify every instruction in AGENTS.md against actual code before following it. If it references a file that doesn't exist, quarantine the instruction — don't follow it and don't delete it.
2511: 3. **False Signal Awareness**: Test output, linter results, and doc-claimed behavior must be cross-checked against implementation reality. A passing test that asserts `true === true` proves nothing.
2512: 
2513: ## Orchestrator Integration
2514: 
2515: When the orchestrator's session is already heavy:
2516: 
2517: - **Quick mode** can run inline — it's lightweight enough
2518: - **Rot and full modes** should be **delegated** to a subagent — their output can be large
2519: - The orchestrator reads only: `rot_level`, `trust`, `can_proceed`, `recommendations`
2520: - If rot result is DEGRADED or worse, declare distrust before routing to any other domain
2521: 
2522: ## Handoff Paths
2523: 
2524: ```
2525: .hivemind/activity/context/check-cache.json    ← runtime cache (not official boundary)
2526: .hivemind/activity/codescan/                   ← scan outputs per pass
2527: .hivemind/activity/sessions/continuity.json    ← session continuity state
2528: ```
2529: 
2530: Paths are relative to project root. Resolve via `pathing/active-paths.json`.
2531: 
2532: ## Carry-Forward
2533: 
2534: After any context check completes:
2535: 
2536: - If issues were found, emit a continuity checkpoint noting what was verified and what remains uncertain
2537: - Store it in `{project}/.hivemind/activity/context/` or `{project}/.hivemind/activity/sessions/`
2538: - If delegation follows, include the distrust context in the delegation packet so child agents don't repeat false trust
2539: - Compress to ≤5 key findings, blocked routes, recommended next action, output paths
2540: 
2541: ## Sibling Skills
2542: 
2543: | Parent | This Skill | Depth Partners |
2544: |--------|-----------|----------------|
2545: | `use-hivemind` | `use-hivemind-context` | `context-intelligence-entry`, `context-entry-verify` |
2546: 
2547: This router consolidates: `context-intelligence-entry` (session health, rot detection, trust scoring) and `context-entry-verify` (project verification gates, build/test/git checks). Domain-specific scripts and references remain in their respective `scripts/` and `references/` directories.
2548: 
2549: ## Anti-Patterns
2550: 
2551: **You assume remembered context is trustworthy.** It's not. Run a quick probe. Takes seconds, saves hours of debugging based on stale assumptions.
2552: 
2553: **You treat quick mode as sufficient for major decisions.** Quick tells you if the session is alive. It doesn't tell you if the project is healthy. Use rot or full when it matters.
2554: 
2555: **You trust a test pass without reading the assertion.** A test that asserts `expect(result).toBeDefined()` on a function that returns garbage is lying to you. Read what it actually checks.
2556: 
2557: **You follow AGENTS.md instructions that reference files you haven't confirmed exist.** If AGENTS.md says "load the skill at `skills/foo/SKILL.md`" and that path doesn't exist, the instruction is stale. Quarantine it.
2558: 
2559: **You skip the distrust declaration and just keep working.** If context is DEGRADED and you don't say so, the next agent inherits your false confidence. Declare the level. Every time.
2560: 
2561: **You run full analysis when quick mode would answer the question.** Full analysis is expensive. If you just need to know "is this session fresh?", quick mode is the right tool. Don't bring a spectrometer to check if the light is on.
2562: 
2563: Base directory for this skill: file:///Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind-context
2564: Relative paths in this skill (e.g., scripts/, reference/) are relative to this base directory.
2565: Note: file list is sampled.
2566: 
2567: <skill_files>
2568: <file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind-context/scripts/hm-verify.cjs</file>
2569: <file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind-context/scripts/context-harness-init.cjs</file>
2570: <file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind-context/schemas/output.schema.ts</file>
2571: <file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind-context/tests/direct-invocation.md</file>
2572: <file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind-context/references/false-signal-detection.md</file>
2573: <file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind-context/references/gate-chain-order.md</file>
2574: <file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind-context/references/entry-state-matrix.md</file>
2575: <file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind-context/references/delegation-scope.md</file>
2576: <file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind-context/references/context-rot-taxonomy.md</file>
2577: <file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind-context/references/context-distrust-protocol.md</file>
2578: </skill_files>
2579: </skill_content>
2580: ```
2581: 
2582: ---
2583: 
2584: ## Assistant (Hiveminder · xiaomi/mimo-v2-pro:free · 15.7s)
2585: 
2586: _Thinking:_
2587: 
2588: Now I have all the skills loaded. The user wants me to begin the large phase planning for the hivefiver-driven refactoring. Let me apply what the skills tell me:
2589: 
2590: From use-hivemind-context: Run a context health check first.
2591: From use-hivemind-delegation: Plan before delegating.
2592: From use-hivemind-tdd: Test-first, red-green-refactor.
2593: From hivemind-spec-driven: Extract requirements, classify, resolve ambiguity, create spec.
2594: 
2595: This is a massive undertaking. Let me:
2596: 1. First, do a quick context health check (the 3-step trust check)
2597: 2. Then decompose the work into phases
2598: 
2599: 
2600: 3. Create a high-level plan
2601: 
2602: Starting with the trust check: I'm verifying the session state, confirming that the legacy CLI and sync components actually exist in the codebase, and validating that my earlier findings about skill names and configurations are still accurate.
2603: 
2604: Now I'm checking git freshness and confirming the context is CLEAN—the code matches my documented findings and git is current. With that validated, I can move forward with the planning.
2605: 
2606: The spec breaks down into five major phases: cleaning up legacy code and dead assets, building out the three hivefiver commands, defining the schema and injection logic, replacing the hardcoded skill mappings with a dynamic loader, and finally wiring the registry to the injection pipeline. This is substantial work, so I need to think through how to structure the multi-round execution plan.
2607: 
2608: I'm realizing the user is asking me to create a master orchestration plan rather than jump into implementation. The key is to route this through the right planning skills, keep it high-level with clear phases and dependencies, and get authorization before proceeding. Let me start by establishing context health first, then build out the full plan.
2609: 
2610: Now I need to figure out what tools are actually available to me—I see TodoWrite and bash commands, but I'm not certain about task planning utilities. Let me map out the approach: run a context health check to understand the current state, then decompose the spec into phases and present the routing plan to the user for approval.
2611: 
2612: Skills loaded. Running context health check per `use-hivemind-context` protocol before any planning.
2613: 
2614: **Tool: bash**
2615: 
2616: **Input:**
2617: ```json
2618: {
2619:   "command": "git log --oneline -5",
2620:   "description": "Check git recency for context health",
2621:   "workdir": "/Users/apple/hivemind-plugin/.worktrees/product-detox"
2622: }
2623: ```
2624: 
2625: **Output:**
2626: ```
2627: 7183335 Generated numerous Hivemind session artifacts, error logs, and inspection reports, alongside updates to skill definitions and new session management tests.
2628: 4724eed feat: Introduce new skills, agents, and session management, while deprecating older GSD and skill-related files, and updating package-lock.`
2629: 61ac25b feat: Refactor skill directory structure, introduce new skills, and update core plugin components.
2630: 98dbb51 refactor(delegation): decompose monolith into 6-skill ecosystem with gatekeeping and domain delegation
2631: 42eff5b fix(skills): enforce frontmatter schema — name+description only, remove forbidden use_when field
2632: 
2633: ```
2634: 
2635: **Tool: bash**
2636: 
2637: **Input:**
2638: ```json
2639: {
2640:   "command": "ls -la /Users/apple/hivemind-plugin/.worktrees/product-detox/.hivemind/context-check.json /Users/apple/hivemind-plugin/.worktrees/product-detox/.hivemind/activity/status.json 2>/dev/null",
2641:   "description": "Check context and activity status freshness"
2642: }
2643: ```
2644: 
2645: **Output:**
2646: ```
2647: -rw-r--r--  1 apple  staff  5366 Mar 24 07:42 /Users/apple/hivemind-plugin/.worktrees/product-detox/.hivemind/activity/status.json
2648: -rw-r--r--@ 1 apple  staff   260 Mar 23 19:42 /Users/apple/hivemind-plugin/.worktrees/product-detox/.hivemind/context-check.json
2649: 
2650: ```
2651: 
2652: ---
2653: 
2654: ## Assistant (Hiveminder · xiaomi/mimo-v2-pro:free · 53.5s)
2655: 
2656: _Thinking:_
2657: 
2658: The git log shows recent commits (today, March 25). The context-check.json is from March 23 (2 days old, SUSPECT). The activity/status.json is from March 24 (1 day old, borderline).
2659: 
2660: Based on use-hivemind-context trust check:
2661: 1. Freshness: Git is recent (today). Context-check is 2 days old (SUSPECT). Activity status is 1 day old (OK).
2662: 2. Code vs Docs: My investigation was thorough — code matches findings.
2663: 3. Prior sessions: No compaction or interruption detected.
2664: 
2665: **Context Level: CLEAN to SUSPECT.** The context-check.json is stale but the git history and code are fresh. 
2666: 
2667: My findings are corroborated by the actual files, so I'm ready to move forward with planning. I need to decompose the hivefiver system spec into phases and create a multi-round execution plan—this is a massive undertaking spanning 5 major work streams, so I'll break it down into dependency-ordered phases and present it to the user for authorization.
2668: 
2669: **Context Health: CLEAN** — Git active (5 recent commits today), code corroborates all findings, no compaction or session interruption detected. `context-check.json` is SUSPECT (2 days old) but irrelevant to planning.
2670: 
2671: Now decomposing the hivefiver system into a master plan. This is a large-scale refactoring — 5 major work streams with dependencies.
2672: 
2673: **Tool: todowrite**
2674: 
2675: **Input:**
2676: ```json
2677: {
2678:   "todos": [
2679:     {
2680:       "content": "CONTEXT HEALTH: Verify session state freshness",
2681:       "priority": "high",
2682:       "status": "completed"
2683:     },
2684:     {
2685:       "content": "PHASE 0: Legacy cleanup — remove faulty CLI init, detach false sync, remove dead code",
2686:       "priority": "high",
2687:       "status": "pending"
2688:     },
2689:     {
2690:       "content": "PHASE 1: Schema foundation — define configuration types, JSON schema, validation",
2691:       "priority": "high",
2692:       "status": "pending"
2693:     },
2694:     {
2695:       "content": "PHASE 2: Hivefiver agent — build the bootstrap/doctor/initiator module",
2696:       "priority": "high",
2697:       "status": "pending"
2698:     },
2699:     {
2700:       "content": "PHASE 3: Injection revamp — replace hardcoded exposure map with config-driven loader",
2701:       "priority": "high",
2702:       "status": "pending"
2703:     },
2704:     {
2705:       "content": "PHASE 4: Integration & verification — wire everything, test, validate",
2706:       "priority": "high",
2707:       "status": "pending"
2708:     }
2709:   ]
2710: }
2711: ```
2712: 
2713: **Output:**
2714: ```
2715: [
2716:   {
2717:     "content": "CONTEXT HEALTH: Verify session state freshness",
2718:     "priority": "high",
2719:     "status": "completed"
2720:   },
2721:   {
2722:     "content": "PHASE 0: Legacy cleanup — remove faulty CLI init, detach false sync, remove dead code",
2723:     "priority": "high",
2724:     "status": "pending"
2725:   },
2726:   {
2727:     "content": "PHASE 1: Schema foundation — define configuration types, JSON schema, validation",
2728:     "priority": "high",
2729:     "status": "pending"
2730:   },
2731:   {
2732:     "content": "PHASE 2: Hivefiver agent — build the bootstrap/doctor/initiator module",
2733:     "priority": "high",
2734:     "status": "pending"
2735:   },
2736:   {
2737:     "content": "PHASE 3: Injection revamp — replace hardcoded exposure map with config-driven loader",
2738:     "priority": "high",
2739:     "status": "pending"
2740:   },
2741:   {
2742:     "content": "PHASE 4: Integration & verification — wire everything, test, validate",
2743:     "priority": "high",
2744:     "status": "pending"
2745:   }
2746: ]
2747: ```
2748: 
2749: ---
2750: 
2751: ## Assistant (Hiveminder · xiaomi/mimo-v2-pro:free · 41.1s)
2752: 
2753: _Thinking:_
2754: 
2755: Now let me create the master plan. I'll present it clearly with phases, dependencies, delegation routing, and TDD gates.
2756: 
2757: Actually, I realize I should use the hivemind-planning agent to decompose this properly. Let me delegate to hiveplanner for the detailed planning.But wait — the user said I'm the orchestrator. I should create the plan myself, then present it for authorization. The CLAUDE.md says: "When user says 'plan' → ALWAYS create high-level routed/conditional multi-round plan. NEVER create ready-to-implement detailed specifications."
2758: 
2759: The user didn't say "plan" explicitly but asked me to "begin the large phase planning." So I should create the master plan.Let me create a clear, high-level multi-round plan.
2760: 
2761: ## Master Orchestration Plan: Hivefiver System Refactoring
2762: 
2763: ### Scope
2764: 
2765: Build the `hivefiver` agent system that replaces hardcoded skill injection with a configurable, schema-driven architecture. 5 phases, sequential with gate checkpoints.
2766: 
2767: ---
2768: 
2769: ### Phase 0: Legacy Cleanup
2770: 
2771: **Goal:** Remove faulty CLI init, detach false sync assets, clean dead code.
2772: 
2773: | Task | Route To | Evidence Required |
2774: |------|----------|-------------------|
2775: | Identify all `sync` call sites in init/doctor handlers | `hivexplorer` | File paths + line numbers |
2776: | Remove or deprecate `src/features/runtime-observability/sync.ts` | `hivemaker` | Git diff showing removal |
2777: | Remove `hm-sync` from CLI routing, command-bundles, package.json bins | `hivemaker` | Compiled dist passes typecheck |
2778: | Clean dead constants in `src/shared/paths.ts` (ARTIFACTS_DIR, CHECKPOINTS_DIR, phantom state files) | `hivemaker` | `npx tsc --noEmit` clean |
2779: | Deprecate noise `.opencode/commands/*.md` dev mirrors | `hivemaker` | Files removed or renamed `.deprecated` |
2780: | Audit `bin/hivemind-tools.cjs` — decide deprecation vs integration | `code-skeptic` | Audit report with recommendation |
2781: 
2782: **Gate:** `npx tsc --noEmit` clean, `npm test` passes, no broken imports.
2783: 
2784: ---
2785: 
2786: ### Phase 1: Schema Foundation
2787: 
2788: **Goal:** Define the configuration schema that all downstream phases consume.
2789: 
2790: | Task | Route To | Evidence Required |
2791: |------|----------|-------------------|
2792: | Design `HivemindConfig` TypeScript interfaces — agent bundles, purpose-conditional, shared skills, user prefs, governance, operation mode | `architect` | `.ts` types file, compiles clean |
2793: | Design JSON schema (`skill-injection-config-v1`) with `_meta`, validation rules | `architect` | JSON Schema file, validates sample configs |
2794: | Map OpenCode official schema fields to HiveMind config (agents, commands, permissions, skills, mcp, plugins) | `hivexplorer` + `hiverd` | Cross-reference table |
2795: | Define `UserPreferences` schema: communication_language, document_language, expert_level, governance_level, operation_mode | `architect` | Types + JSON schema |
2796: | Define `PhaseClassification` schema: Tier 1 (project initiation) / Tier 2 (planning & execution) with task classification enums | `architect` | Types + JSON schema |
2797: | Define `SkillInjectionRule` schema: per-agent × per-phase × per-task-classification, mandatory vs high-likelihood | `architect` | Types + JSON schema |
2798: | Create default JSON config with ONLY real skill names (15 from `.opencode/skills/`) | `hivemaker` | Config file, validated against disk |
2799: 
2800: **Gate:** All types compile. JSON schema validates against default config. No references to non-existent skills.
2801: 
2802: ---
2803: 
2804: ### Phase 2: Hivefiver Agent Module
2805: 
2806: **Goal:** Build the bootstrap/doctor/initiator module.
2807: 
2808: | Task | Route To | Evidence Required |
2809: |------|----------|-------------------|
2810: | Build `hm-init` command: greenfield/brownfield detection interview, `.hivemind/` bootstrap, core doc generation (PRD.md, PROJECT.md, STATE.md, ARCHITECTURE.md, CONSTITUTION.md, etc.) | `hivemaker` | Command runs, produces `.hivemind/` structure |
2811: | Build `hm-doctor` command: diagnostic interview, config drift detection, broken skill ref discovery, schema compliance check | `hivemaker` | Doctor report with findings |
2812: | Build `hm-setting` command: step-by-step config groups (user prefs, governance, operation mode, agent bundles, skills) | `hivemaker` | Settings flow produces valid config |
2813: | Wire to existing control-plane registry as new primitives | `hivemaker` | `control-plane-registry.ts` updated, compiles |
2814: | Update command markdown files (`commands/hm-init.md`, etc.) | `hivemaker` | Command bundles reference new handlers |
2815: 
2816: **Gate:** All 3 commands dispatch correctly via control plane. `hm-init` bootstraps `.hivemind/`. `hm-doctor` detects known issues. `hm-setting` produces valid config JSON.
2817: 
2818: ---
2819: 
2820: ### Phase 3: Injection Revamp
2821: 
2822: **Goal:** Replace hardcoded skill injection with config-driven dynamic loader.
2823: 
2824: | Task | Route To | Evidence Required |
2825: |------|----------|-------------------|
2826: | Create `src/shared/skill-injection-loader.ts`: loads JSON config, validates against file-system registry, caches | `hivemaker` | Compiles, unit tests pass |
2827: | Wire `opencode-skill-registry.ts` to injection loader for disk validation | `hivemaker` | Missing skills produce warnings, not crashes |
2828: | Modify `src/plugin/skill-exposure-map.ts`: replace hardcoded constants with loader calls, keep `resolveSkillBundle()` signature | `hivemaker` | `messages-transform-adapter.ts` unchanged, still works |
2829: | Set `MAX_SKILLS = 3` per policy | `hivemaker` | Config default + code constant agree |
2830: | Add `config` directory to `package.json` `files` array | `hivemaker` | `npm pack --dry-run` includes config/ |
2831: 
2832: **Gate:** `npx tsc --noEmit` clean. Injection pipeline fires with config-driven skills. Only real skill names injected. `messages-transform-adapter.ts` unchanged.
2833: 
2834: ---
2835: 
2836: ### Phase 4: Integration & Verification
2837: 
2838: **Goal:** End-to-end validation with TDD evidence.
2839: 
2840: | Task | Route To | Evidence Required |
2841: |------|----------|-------------------|
2842: | Full test suite: `npm test` all pass | `hiveq` | Command output |
2843: | Type check: `npx tsc --noEmit` clean | `hiveq` | Zero errors |
2844: | Build: `npm run build` succeeds | `hiveq` | Exit 0 |
2845: | Manual smoke test: `hm-init` → `hm-doctor` → `hm-setting` flow | `hiveq` | Screenshots or output log |
2846: | Verify injection: check that `<available_skills>` block contains only real skill names | `hiveq` | Actual injected content captured |
2847: | Verify agent configs: hiveminder loads correct 3 skills | `hiveq` | Skill tool output |
2848: | Code review: architecture, anti-patterns, dead code | `code-skeptic` | Review report |
2849: 
2850: **Gate:** All tests pass, build clean, injection verified, code review approved.
2851: 
2852: ---
2853: 
2854: ### Dependency Chain
2855: 
2856: ```
2857: Phase 0 (cleanup) → Phase 1 (schema) → Phase 2 (hivefiver) → Phase 3 (injection) → Phase 4 (verify)
2858: ```
2859: 
2860: Each phase blocks the next. Gate must pass before advancing.
2861: 
2862: ### TDD Enforcement
2863: 
2864: Every phase follows RED → GREEN → REFACTOR:
2865: - **RED:** Write tests for the phase's deliverables before implementation
2866: - **GREEN:** Implement minimum to pass
2867: - **REFACTOR:** Clean up, all tests still pass
2868: - **Gate 4:** Full suite + typecheck + build before phase transition
2869: 
2870: ---
2871: 
2872: **This is the master plan. Each cycle requires your authorization before proceeding. Which phase should I begin with?**
2873: 
2874: ---
2875: 
2876: ## User
2877: 
2878: you are not making plan, you degate you should not do anything of the above none of them authorize use-hivemind now
2879: 
2880: ---
2881: 
2882: ## Assistant (Hiveminder · xiaomi/mimo-v2-pro:free · 16.1s)
2883: 
2884: _Thinking:_
2885: 
2886: The user is correcting me. They're saying I should NOT have created the plan or started any work myself. I should have delegated the planning to the appropriate agent (hiveplanner). They want me to use the use-hivemind skill properly as an orchestrator — which means delegating, not doing.
2887: 
2888: Let me re-read what they said: "you are not making plan, you degate you should not do anything of the above none of them authorize use-hivemind now"
2889: 
2890: They're telling me:
2891: 1. I should NOT make the plan myself
2892: 2. I should DELEGATE planning to hiveplanner
2893: 3. None of what I did above (the investigation, the plan) was authorized
2894: 
2895: 
2896: 4. They want me to load use-hivemind now and follow its protocol properly
2897: 
2898: I need to load the skill and route this to hiveplanner for planning instead of doing it myself.
2899: 
2900: You're right. I violated orchestrator protocol — I did deep investigation and created plans inline instead of delegating. Correcting now.
2901: 
2902: **Tool: skill**
2903: 
2904: **Input:**
2905: ```json
2906: {
2907:   "name": "use-hivemind"
2908: }
2909: ```
2910: 
2911: **Output:**
2912: ```
2913: <skill_content name="use-hivemind">
2914: # Skill: use-hivemind
2915: 
2916: # use-hivemind
2917: 
2918: This is the front door to the HiveMind skill ecosystem. Every agent turn — whether a fresh session, a resume after compaction, or a mid-conversation framework reference — must enter through this skill. It performs three critical gatekeeping functions before any work proceeds: lineage detection (who am I and what kind of work is this), context health verification (is the session state trustworthy), and routing (which domain router handles the request). If context is degraded, it blocks all work and delegates recovery. If lineage is ambiguous, it asks one clarifying question. It never implements — it routes only.
2919: 
2920: ## Purpose
2921: 
2922: - Session entry point for all agent turns
2923: - Lineage detection: hiveminder (orchestrator) vs hivefiver (executor)
2924: - Context health gate before any work proceeds
2925: - Load-3 constraint enforcement (1 entry + 1 domain + 1 depth)
2926: - Routing to correct domain router based on request type
2927: 
2928: ## When to Activate
2929: 
2930: | Trigger | Example Phrases |
2931: |---------|----------------|
2932: | Session start | "help me", "start working", "continue", "begin" |
2933: | Post-compaction | After `/clear`, context feels unclear, session resumes |
2934: | Framework reference | User mentions "hivemind", "hive", "framework", "skill system" |
2935: | Lineage confusion | "which lineage", "who should do this", "am I building framework or project" |
2936: | Stack confusion | "too many skills", "which skills loaded", "stack overflow" |
2937: | Skill routing | "what skill do I use for X", "route me" |
2938: | Delegation intent | "delegate", "handoff", "send to subagent" |
2939: | Verification gate | "am I done", "verify this", "before merge" |
2940: | Context rot | "lost context", "forgot what I was doing", "context seems wrong" |
2941: | Explicit activation | "use hivemind", "load hivemind framework" |
2942: 
2943: ## Routing Matrix
2944: 
2945: | Request Type | Route To | Description |
2946: |-------------|----------|-------------|
2947: | Delegation work | `use-hivemind-delegation` | Splitting work across subagents, handoff packets, return contracts |
2948: | Skill creation/audit | `use-hivemind-skill-authoring` | Authoring, auditing, or refactoring HiveMind skills |
2949: | Git memory operations | `use-hivemind-git-memory` | Commit-based memory encoding, semantic retrieval, continuity |
2950: | Multi-stage refactor | `use-hivemind` | Framework refactor, recovery, detox across context and code |
2951: | Research questions | `use-hivemind-research` | Multi-source investigation, evidence grading, synthesis |
2952: | Planning work | `use-hivemind-planning` | Plan lifecycle, phase decomposition, execution tracking |
2953: | Simple questions | Execute inline | Answer directly without routing — no skill loading needed |
2954: 
2955: **Routing decision:** Match the request intent to the table above. If the request spans multiple categories, pick the primary intent. If ambiguous, ask one clarifying question.
2956: 
2957: ## Load-3 Constraint
2958: 
2959: The skill stack has a hard maximum of **3 active skills**. Every load must follow this formula:
2960: 
2961: | Slot | Purpose | Example |
2962: |------|---------|---------|
2963: | 1 — Entry | This skill (`use-hivemind`) | Always loaded first |
2964: | 2 — Domain | Domain router for the request type | `use-hivemind-delegation`, `use-hivemind-planning`, etc. |
2965: | 3 — Depth | Implementation skill within the domain | `use-hivemind-tdd`, `hivemind-atomic-commit`, etc. |
2966: 
2967: **Enforcement rules:**
2968: 
2969: - Before loading any skill, count current active skills
2970: - If stack is already at 3 → defer, do not load another skill
2971: - If stack exceeds 3 → stop, ask user to resolve (unload one skill) before proceeding
2972: - This skill itself occupies slot 1 — the remaining 2 slots are for domain + depth
2973: 
2974: ## Lineage Detection
2975: 
2976: Two lineages exist in the HiveMind ecosystem. Detect which one applies before routing:
2977: 
2978: | Lineage | Role | Characteristics | Routes To |
2979: |---------|------|-----------------|-----------|
2980: | **Hiveminder** | Orchestrator | Coordinates work, delegates to subagents, never reads deep | Domain routers (`use-hivemind-delegation`, `use-hivemind-planning`, etc.) |
2981: | **Hivefiver** | Executor | Implements bounded work, writes code, produces artifacts | Implementation skills (`use-hivemind-tdd`, `hivemind-atomic-commit`, etc.) |
2982: 
2983: **Detection logic:**
2984: 
2985: 1. Is the agent's role explicitly stated in the session context? → Use that.
2986: 2. Is the request about coordinating/planning vs. implementing/executing? → Hiveminder coordinates, hivefiver executes.
2987: 3. Is there a delegation packet with `agent` field? → The agent field determines lineage.
2988: 4. If still unclear → ask: "Are you orchestrating work (hiveminder) or executing directly (hivefiver)?"
2989: 
2990: **Key distinction:** Hiveminder never loads depth skills — it loads domain routers only. Hivefiver loads depth skills within a domain. This prevents orchestrator sessions from accumulating implementation context.
2991: 
2992: ## Context Health Gate
2993: 
2994: Before routing, the session state must be verified as trustworthy:
2995: 
2996: 1. **Check staleness** — Is the session context fresh? (last file read within reasonable window, no interrupted compaction)
2997: 2. **Check for drift** — Does the user indicate confusion or loss of context?
2998: 3. **Check for pollution** — Are there conflicting signals, stale references, or corrupted state?
2999: 
3000: **If context health fails:**
3001: 
3002: - **DO NOT** route to any domain router
3003: - **DO NOT** attempt work of any kind
3004: - **Delegate immediately** to `context-intelligence-entry` for recovery
3005: - Report: `blocked` — context degraded, recovery delegated
3006: 
3007: **If context health passes:**
3008: 
3009: - Proceed to lineage detection, then routing
3010: 
3011: ## Step-by-Step Protocol
3012: 
3013: ```
3014: 0. CHECK STACK     → If ≥3 active skills, DEFER (wait for slot)
3015: 1. DETECT          → Is this session start, post-compaction, or framework reference?
3016: 2. CONTEXT GATE    → Run context health assessment
3017: 3. IF DEGRADED     → Route to `context-intelligence-entry`, STOP
3018: 4. IDENTIFY LINEAGE → Hiveminder (orchestrator) or Hivefiver (executor)?
3019: 5. CLASSIFY REQUEST → Match to routing matrix
3020: 6. LOAD DOMAIN     → Load the domain router (slot 2)
3021: 7. EXECUTE         → Domain router handles depth skill loading (slot 3)
3022: ```
3023: 
3024: ## Anti-Patterns
3025: 
3026: | Anti-Pattern | Why It Fails | Correct Behavior |
3027: |-------------|-------------|-----------------|
3028: | Loading >3 skills | Stack budget exceeded, context overload | Enforce load-3, defer excess |
3029: | Skipping entry router | No lineage check, no context gate | Always start here |
3030: | Doing deep reads inline | Orchestrator should not scan code | Delegate to `hivexplorer` or equivalent |
3031: | Implementing in router | Routing ≠ execution | Route to specialist, never implement |
3032: | Loading depth skill without domain | Missing domain context | Always load domain router first |
3033: | Answering "what is hivemind" inline | Bypasses routing | Route to appropriate specialist |
3034: | Loading multiple domain routers | Conflicting routing paths | Pick primary intent, route once |
3035: 
3036: ## Platform Detection
3037: 
3038: This skill is **platform-agnostic**. It works in OpenCode, Claude Code, Cursor, Gemini CLI, and any agent system that supports skill loading. Platform-specific behaviors (stack budget enforcement, skill loading mechanism) are handled by the platform layer, not by this skill.
3039: 
3040: | Platform | Stack Budget | Skill Loading |
3041: |----------|-------------|---------------|
3042: | OpenCode | 3 max | `skill` tool |
3043: | Claude Code | 3 max | CLAUDE.md or skill tool |
3044: | Cursor | Platform-defined | Rules system |
3045: | Gemini CLI | Platform-defined | Context system |
3046: | Custom | 3 recommended | Platform-specific |
3047: 
3048: ## Terminal State
3049: 
3050: - Lineage identified (hiveminder or hivefiver)
3051: - Context health verified (or recovery delegated)
3052: - Domain router loaded (slot 2)
3053: - Ready for depth skill load (slot 3) or inline execution
3054: 
3055: ## No-Load Conditions
3056: 
3057: Do not load this skill — defer or block — when:
3058: 
3059: | Condition | Action |
3060: |-----------|--------|
3061: | Stack already at 3 skills | Defer until a slot opens |
3062: | Context health fails | Block, delegate to `context-intelligence-entry` |
3063: | Another entry router is active | Defer to the active router |
3064: | Authority unclear (conflicting SOT) | Escalate before routing |
3065: | Simple question, no routing needed | Answer inline, do not load skills |
3066: 
3067: ## Independence Rules
3068: 
3069: - Self-contained routing logic — no external dependencies beyond skill names
3070: - No implementation — routes only, never executes work
3071: - No deep reads — context assessment is shallow (session state, not code inspection)
3072: - No mutation — this skill never writes files, modifies state, or commits
3073: 
3074: Base directory for this skill: file:///Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind
3075: Relative paths in this skill (e.g., scripts/, reference/) are relative to this base directory.
3076: Note: file list is sampled.
3077: 
3078: <skill_files>
3079: <file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind/templates/load-template.md</file>
3080: <file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind/references/verification-before-completion.md</file>
3081: <file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind/references/context-health-check.md</file>
3082: <file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind/references/agent-roles.md</file>
3083: <file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind/references/orchestrator-delegation.md</file>
3084: </skill_files>
3085: </skill_content>
3086: ```
3087: 
3088: ---
3089: 
3090: ## Assistant (Hiveminder · xiaomi/mimo-v2-pro:free · 29.0s)
3091: 
3092: _Thinking:_
3093: 
3094: Now I'm following the proper use-hivemind protocol:
3095: 
3096: 0. CHECK STACK → I've loaded 5 skills (use-hivemind, use-hivemind-delegation, hivemind-spec-driven, use-hivemind-tdd, use-hivemind-context). That's over the limit of 3. But the user asked me to load them. The skill says "If stack exceeds 3 → stop, ask user to resolve."
3097: 
3098: But the user explicitly told me to load these skills. The use-hivemind skill also says "Hiveminder never loads depth skills — it loads domain routers only." So as hiveminder, I should only have:
3099: 
3100: 
3101: - Slot 1: use-hivemind (entry)
3102: - Slot 2: use-hivemind-delegation (domain router)
3103: - Slot 3: One of the others
3104: 
3105: The depth skills (hivemind-spec-driven, use-hivemind-tdd, use-hivemind-context) should be loaded by subagents, not by me. Now I'm going through the rest of the protocol: detect the session context, check if it's healthy, identify my lineage as hiveminder, classify what the user is asking for as planning work that requires delegation, and load the appropriate domain router.
3106: 
3107: Actually, I'm reconsidering—this is a framework refactor spanning context and code, which use-hivemind classifies as "Multi-stage refactor" that routes back to use-hivemind itself. But the user explicitly asked for "large phase planning," so I should route to use-hivemind-planning instead and have the hiveplanner agent decompose the work with a delegation packet.
3108: 
3109: Now I'm applying the routing matrix to confirm: Planning work goes to use-hivemind-planning, which handles plan lifecycle, phase decomposition, and execution tracking. That's exactly what we need here. I'll load it in slot 2 and move forward with the protocol.
3110: 
3111: Following use-hivemind protocol:
3112: 
3113: **Step 0 — Stack check:** 5 skills loaded, exceeds 3. As hiveminder (orchestrator), I should only carry entry + domain. Depth skills belong to subagents.
3114: 
3115: **Step 1 — Detect:** This is a framework reference — large-scale hivefiver system refactoring.
3116: 
3117: **Step 2 — Context gate:** Git is fresh (5 commits today). Context is CLEAN.
3118: 
3119: **Step 3 — Lineage:** I am **hiveminder** (orchestrator). I coordinate, I don't implement.
3120: 
3121: **Step 4 — Classify:** "Large phase planning" → routes to `use-hivemind-planning`.
3122: 
3123: **Step 5 — Load domain router:**
3124: 
3125: **Tool: skill**
3126: 
3127: **Input:**
3128: ```json
3129: {
3130:   "name": "use-hivemind-planning"
3131: }
3132: ```
3133: 
3134: **Output:**
3135: ```
3136: <skill_content name="use-hivemind-planning">
3137: # Skill: use-hivemind-planning
3138: 
3139: # use-hivemind-planning
3140: 
3141: You've got a thing to build. Maybe the requirements are clear. Maybe they're a mess. Either way, you need a structured path from "what the human wants" to "here's what each subagent does." This skill is that path. It handles the full arc: distilling noisy specs, validating feasibility, decomposing into bounded slices, mapping dependencies, and tracking progress through to done.
3142: 
3143: Consolidates: `use-hivemind-planning`, `use-hivemind-planning`, `hivemind-spec-driven`, `hivemind-codemap` (feasibility section).
3144: 
3145: ## Load Position
3146: 
3147: **Slot 2 (Domain — planning)**. `use-hivemind` must be loaded first.
3148: 
3149: ## When to Load
3150: 
3151: - You have vague or contradictory requirements and need to turn them into something actionable
3152: - You need to break a multi-concern task into phases and slices
3153: - You want to validate feasibility before committing to a plan
3154: - You're tracking execution across phases with evidence gates
3155: - You need dependency maps to find what can run in parallel
3156: 
3157: ## The Planning Flow
3158: 
3159: Five steps. Don't skip around — each one feeds the next.
3160: 
3161: **1. Spec** — What does the human actually want? Extract requirement atoms, classify them, map what's clear vs ambiguous vs contradictory. If there's noise, distill first.
3162: 
3163: **2. Validate** — Can we actually do this? Check that target files exist, constraints hold, and no HIGH-IMPACT ambiguity is lurking. If feasibility fails, stop before decomposing.
3164: 
3165: **3. Decompose** — Break the validated plan into phases. Number them. Each phase is a bounded unit: ≤5 files, single concern, explicit gate.
3166: 
3167: **4. Dependencies** — What depends on what? Build the DAG, find the critical path, identify parallel candidates. No circular deps.
3168: 
3169: **5. Track** — Where are we right now? What's done, what's blocked, what's next? Carry forward ≤5 key findings between phases.
3170: 
3171: ## Spec Distillation
3172: 
3173: When requirements are messy, start here. Don't plan on top of ambiguity.
3174: 
3175: ### Five-Bucket Classification
3176: 
3177: Every requirement atom goes into exactly one bucket:
3178: 
3179: | Bucket | What Goes Here | Example |
3180: |--------|----------------|---------|
3181: | **Functional** | What the system does | Features, behaviors, user stories |
3182: | **Non-functional** | How well it performs | Performance, scalability, security |
3183: | **Integration** | How it connects | APIs, data contracts, dependencies |
3184: | **Risk/Compliance** | What could go wrong | Regulatory, security, audit |
3185: | **Operations** | How it's deployed | Monitoring, incident response, deployment |
3186: 
3187: ### Ambiguity Map
3188: 
3189: For each requirement atom, tag it:
3190: 
3191: - **Clear** → add to spec draft
3192: - **Ambiguous** → unresolved queue
3193: - **Contradictory** → conflict register
3194: 
3195: ### Clarification Rules
3196: 
3197: - MCQ-first — multiple choice before free text, reduces vague answers
3198: - One question at a time — don't overwhelm
3199: - Block on HIGH-IMPACT ambiguity — better to clarify now than refactor later
3200: - Max 10 rounds with progressive hints — don't loop forever
3201: 
3202: ### Terminal States
3203: 
3204: - Spec complete → proceed to validation
3205: - Ambiguity unresolved → BLOCK, continue clarifying
3206: - Contradiction detected → document both sides, escalate to user
3207: 
3208: ## Feasibility Validation
3209: 
3210: Before you decompose, check reality. Three checks, all must pass:
3211: 
3212: | Check | What It Does | Evidence Needed |
3213: |-------|-------------|-----------------|
3214: | **Target exists** | Verify files/modules/paths are real | File paths from `glob`/`grep` |
3215: | **Constraints hold** | Resource limits, timeline, dependency availability | JSON proof |
3216: | **Ambiguity residual** | No HIGH-IMPACT ambiguity remaining | Ambiguity map is clear |
3217: 
3218: Use `quick` scan depth for feasibility — you don't need exhaustive analysis, just enough to confirm the plan isn't built on ghosts.
3219: 
3220: **Gate**: All 3 checks produce evidence. No claim without proof.
3221: 
3222: ## Phase Numbering
3223: 
3224: Two-digit scheme with optional sub-phases:
3225: 
3226: | Range | Purpose | Example |
3227: |-------|---------|---------|
3228: | `01`–`09` | Standard phases | `01-foundation`, `02-core-logic` |
3229: | `10`–`19` | Extended phases | `10-integration`, `11-edge-cases` |
3230: | `20`+ | Emergency / unplanned | `20-hotfix-path` |
3231: | Sub-phases | Child work within a phase | `01.1-types`, `01.2-wiring` |
3232: 
3233: Use 2-digit padding (`01`, not `1`) for sorting and deterministic ordering.
3234: 
3235: ## Decomposition Steps
3236: 
3237: Six steps. Authority surface first, concern type second, file cluster third. Never decompose by directory alone — that misses cross-cutting concerns.
3238: 
3239: **Step 1 — Authority Surface Analysis.** Classify every target: `tool` (LLM-facing, Zod required), `hook` (read-only), `core` (state management), `shared` (utilities), `schema` (contract authority, additive only), `config` (needs user approval). Never mix surfaces in one slice unless they share a concern.
3240: 
3241: **Step 2 — Concern Separation.** Each slice handles exactly one: `read` (inspect), `write` (modify), or `verify` (test). A slice that writes code AND runs tests is two slices. Always.
3242: 
3243: **Step 3 — File Cluster Grouping.** Group by import relationships and shared interfaces. Max 5 files per cluster. If a cluster exceeds 5, split by sub-concern. Circular imports at cluster edges = split signal.
3244: 
3245: **Step 4 — Slice Sizing.** ≤5 files per slice. Single concern. Explicit `in_scope` and `out_of_scope`. Finishable in one subagent pass. If too large, split by surface → concern → cluster. If still too large after all three, the plan is too coarse — re-distill.
3246: 
3247: **Step 5 — Dependency Ordering.** Build the graph. A depends on B if A needs B's output or they share files (read before write, write before verify). Topological sort. Critical path = longest chain. Parallel candidates = zero in-degree.
3248: 
3249: **Step 6 — Gate Definition.** Every write slice needs a gate: `npx tsc --noEmit`, `npm test`, `npm run build`. Verify slices ARE gates. Read slices return evidence, no gate needed.
3250: 
3251: ## Plan Record Schema
3252: 
3253: ```json
3254: {
3255:   "_meta": {
3256:     "created_at": "ISO 8601",
3257:     "updated_at": "ISO 8601",
3258:     "plan_id": "plan-{timestamp}-{concern}",
3259:     "source_spec": "path to spec candidate"
3260:   },
3261:   "status": "validated | decomposing | executing | complete | blocked",
3262:   "validation": {
3263:     "completeness": { "functional": true, "non_functional": true, "integration": true, "risk": true, "operations": true },
3264:     "feasibility": { "target_exists": true, "evidence": "file:line references" },
3265:     "constraints": { "resource_limits": "...", "timeline": "..." },
3266:     "ambiguity_residual": []
3267:   },
3268:   "phases": [
3269:     {
3270:       "phase_id": "01-foundation",
3271:       "concerns": ["types"],
3272:       "files": ["src/shared/types.ts"],
3273:       "dependencies": [],
3274:       "parallel_safe": true,
3275:       "status": "pending",
3276:       "gate": "npx tsc --noEmit && npm test",
3277:       "linked_commits": []
3278:     }
3279:   ],
3280:   "dependency_graph": {
3281:     "critical_path": ["01", "03", "05"],
3282:     "parallel_waves": [["01", "02"], ["03"]],
3283:     "edges": [{ "from": "03", "to": "01", "type": "depends-on" }]
3284:   },
3285:   "carry_forward": []
3286: }
3287: ```
3288: 
3289: ## Slice Template
3290: 
3291: Each slice is a bounded unit. This is what gets handed to delegation.
3292: 
3293: ```json
3294: {
3295:   "slice_id": "tool-schemas-zod-migration",
3296:   "order": 3,
3297:   "wave": 1,
3298:   "concern": "write",
3299:   "authority_surfaces": ["tool"],
3300:   "in_scope": ["src/tools/runtime/status.ts"],
3301:   "out_of_scope": ["src/hooks/**"],
3302:   "description": "Migrate tool arg definitions to use tool.schema",
3303:   "depends_on": ["01-types"],
3304:   "parallel_safe": false,
3305:   "gate": {
3306:     "command": "npx tsc --noEmit && npm test -- --testPathPattern=tools",
3307:     "expected_pass": true
3308:   },
3309:   "evidence_required": ["files_modified", "diff_output", "type_check_result"],
3310:   "estimated_complexity": "low | medium | high"
3311: }
3312: ```
3313: 
3314: ## Re-Decomposition
3315: 
3316: When a slice fails twice on the same `slice_id`, don't retry. Re-decompose.
3317: 
3318: 1. **Collect failure evidence** — gather both return packets, find the real blocker
3319: 2. **Re-run decomposition** — apply all 6 steps to the failed slice alone
3320: 3. **Split further** — the slice was too large; use the splitting heuristic from Step 4
3321: 4. **Re-emit** — new slice_ids, updated dependency graph
3322: 5. **Log** — record reason in the activity folder
3323: 
3324: **Decision tree:**
3325: 
3326: ```
3327: Slice failed 2x
3328:   ├── External dependency blocker?  → add dependency slice
3329:   ├── Scope too large?              → split by surface → concern → cluster
3330:   ├── Missing context?              → add a read slice before the write
3331:   ├── Conflicting with another?     → merge into sequential pair
3332:   └── Architectural blocker?        → STOP. Escalate to user.
3333: ```
3334: 
3335: ## Handoff Paths
3336: 
3337: ```
3338: .hivemind/activity/planning/       ← plan records, phase state
3339: .hivemind/activity/delegation/     ← slice definitions, packets
3340: ```
3341: 
3342: Plan records are stored at `{project}/.hivemind/activity/planning/` at runtime. Resolve via `pathing/active-paths.json`, not ad-hoc paths.
3343: 
3344: ## Anti-Patterns
3345: 
3346: You think the spec is clear enough. It's not. If you skipped the ambiguity map, you'll find out mid-implementation when the requirements contradict themselves.
3347: 
3348: You think 8 files per slice is fine. It's not — the child can't hold that context in one pass. Split it.
3349: 
3350: You think parallel dispatch without independence proof is safe. It's not. Two slices modifying the same type file will collide, and you won't know which one's output to trust.
3351: 
3352: You're decomposing by directory. Stop. Directories don't map to concerns. Decompose by authority surface first, then concern, then cluster.
3353: 
3354: You're bundling verification with implementation. A slice that writes code and runs tests hides failures. Verification is always its own slice.
3355: 
3356: You're retrying a failed slice. Stop. The slice was too large. Re-decompose it.
3357: 
3358: You're skipping dependency analysis. Parallel dispatch fails unpredictably when you don't know what depends on what. Build the graph first.
3359: 
3360: You're planning without a spec. Planning on ambiguous requirements is building on sand. Distill first, validate second, decompose third.
3361: 
3362: ## Sibling Skills
3363: 
3364: | Parent | This Skill | Depth Partner |
3365: |--------|-----------|---------------|
3366: | use-hivemind | use-hivemind-planning | use-hivemind-delegation |
3367: 
3368: This skill consolidates: `use-hivemind-planning` (lifecycle + retraceability), `use-hivemind-planning` (decomposition methodology), `hivemind-spec-driven` (requirement extraction), and `hivemind-codemap` (feasibility scanning). Detailed references, templates, and scan helpers live in the respective `references/` directories.
3369: 
3370: Base directory for this skill: file:///Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind-planning
3371: Relative paths in this skill (e.g., scripts/, reference/) are relative to this base directory.
3372: Note: file list is sampled.
3373: 
3374: <skill_files>
3375: <file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind-planning/templates/decomposition-plan.json</file>
3376: <file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind-planning/templates/plan-record.md</file>
3377: <file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind-planning/templates/spec-candidate.md</file>
3378: <file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind-planning/templates/slice-template.json</file>
3379: <file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind-planning/scripts/extract-requirements.sh</file>
3380: <file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind-planning/tests/plan-scenario.md</file>
3381: <file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind-planning/tests/basic-decomposition.md</file>
3382: <file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind-planning/tests/direct-invocation.md</file>
3383: <file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind-planning/tests/re-decomposition.md</file>
3384: <file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind-planning/tests/parallel-candidates.md</file>
3385: </skill_files>
3386: </skill_content>
3387: ```
3388: 
3389: ---
3390: 
3391: ## Assistant (Hiveminder · xiaomi/mimo-v2-pro:free · 497.4s)
3392: 
3393: _Thinking:_
3394: 
3395: Now I'm following the proper protocol. I have use-hivemind (slot 1) and use-hivemind-planning (slot 2) loaded. According to the load-3 constraint, I should stop here and let the planning flow handle depth skill loading via subagents.
3396: 
3397: The user's spec is a massive framework refactoring. Per use-hivemind-planning protocol, I need to:
3398: 
3399: 1. **Spec** — Extract requirements, classify into buckets, map ambiguity
3400: 2. **Validate** — Check feasibility
3401: 3. **Decompose** — Break into phases and slices
3402: 
3403: 
3404: 4. **Dependencies** — Build DAG
3405: 5. **Track** — Set up tracking
3406: 
3407: This planning work itself is a complex task that should be delegated to the hiveplanner subagent. As the hiveminder orchestrator, I should emit a delegation packet to have them produce the plan record, then route it according to the protocol.
3408: 
3409: The delegation skill says I must delegate when criteria are met, and this definitely qualifies — the work spans more than three files and requires deep investigation. So I'm creating a delegation packet for hiveplanner with the full context from the user's specification, asking them to produce a plan record with phases, slices, and dependency analysis.
3410: 
3411: **Stack: 2/3** (use-hivemind + use-hivemind-planning). Per protocol, I stop here. Depth skills load in subagents.
3412: 
3413: Per `use-hivemind-planning` protocol: Planning is complex work spanning multiple files. Delegation criteria met. Dispatching to `hiveplanner`.
3414: 
3415: **Tool: task**
3416: 
3417: **Input:**
3418: ```json
3419: {
3420:   "description": "Hivefiver system phase planning",

(Output capped at 50 KB. Showing lines 2446-3420. Use offset=3421 to continue.)
</content>
```

**Tool: bash**

**Input:**
```json
{
  "command": "wc -l /Users/apple/hivemind-plugin/.worktrees/product-detox/session-ses_2da9.md",
  "description": "Count total lines in session file"
}
```

**Output:**
```
   10313 /Users/apple/hivemind-plugin/.worktrees/product-detox/session-ses_2da9.md

```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/json-render/repomix-json-render.xml",
  "limit": 300
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/json-render/repomix-json-render.xml</path>
<type>file</type>
<content>1: <repomix><file_summary>This file is a merged representation of the entire codebase, combined into a single document by Repomix.
2: The content has been processed where line numbers have been added, content has been formatted for parsing in xml style.<purpose>This file contains a packed representation of the entire repository&apos;s contents.
3: It is designed to be easily consumable by AI systems for analysis, code review,
4: or other automated processes.</purpose><file_format>The content is organized as follows:
5: 1. This summary section
6: 2. Repository information
7: 3. Directory structure
8: 4. Repository files (if enabled)
9: 5. Repository files, each consisting of:
10:   - File path as an attribute
11:   - Full contents of the file</file_format><usage_guidelines>- This file should be treated as read-only. Any changes should be made to the
12:   original repository files, not this packed version.
13: - When processing this file, use the file path to distinguish
14:   between different files in the repository.
15: - Be aware that this file may contain sensitive information. Handle it with
16:   the same level of security as you would the original repository.</usage_guidelines><notes>- Some files may have been excluded based on .gitignore rules and Repomix&apos;s configuration
17: - Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
18: - Files matching patterns in .gitignore are excluded
19: - Files matching default ignore patterns are excluded
20: - Line numbers have been added to the beginning of each line
21: - Content has been formatted for parsing in xml style
22: - Files are sorted by Git change count (files with more changes are at the bottom)</notes></file_summary><directory_structure>.changeset/
23:   config.json
24:   README.md
25: .cursor/
26:   mcp.json
27: .github/
28:   workflows/
29:     ci.yml
30:     release.yml
31: .husky/
32:   pre-commit
33: apps/
34:   web/
35:     app/
36:       (main)/
37:         docs/
38:           a2ui/
39:             page.mdx
40:           adaptive-cards/
41:             page.mdx
42:           ag-ui/
43:             page.mdx
44:           ai-sdk/
45:             page.mdx
46:           api/
47:             codegen/
48:               page.mdx
49:             core/
50:               page.mdx
51:             image/
52:               page.mdx
53:             ink/
54:               page.mdx
55:             jotai/
56:               page.mdx
57:             mcp/
58:               page.mdx
59:             next/
60:               page.mdx
61:             react/
62:               page.mdx
63:             react-email/
64:               page.mdx
65:             react-native/
66:               page.mdx
67:             react-pdf/
68:               page.mdx
69:             react-three-fiber/
70:               page.mdx
71:             redux/
72:               page.mdx
73:             remotion/
74:               page.mdx
75:             shadcn/
76:               page.mdx
77:             shadcn-svelte/
78:               page.mdx
79:             solid/
80:               page.mdx
81:             svelte/
82:               page.mdx
83:             vue/
84:               page.mdx
85:             xstate/
86:               page.mdx
87:             yaml/
88:               page.mdx
89:             zustand/
90:               page.mdx
91:           catalog/
92:             page.mdx
93:           changelog/
94:             page.mdx
95:           code-export/
96:             page.mdx
97:           computed-values/
98:             page.mdx
99:           custom-schema/
100:             page.mdx
101:           data-binding/
102:             page.mdx
103:           generation-modes/
104:             page.mdx
105:           installation/
106:             page.mdx
107:           migration/
108:             page.mdx
109:           openapi/
110:             page.mdx
111:           quick-start/
112:             page.mdx
113:           registry/
114:             page.mdx
115:           renderers/
116:             page.mdx
117:           schemas/
118:             page.mdx
119:           skills/
120:             page.mdx
121:           specs/
122:             page.mdx
123:           streaming/
124:             page.mdx
125:           validation/
126:             page.mdx
127:           visibility/
128:             page.mdx
129:           watchers/
130:             page.mdx
131:           layout.tsx
132:           page.mdx
133:         examples/
134:           page.tsx
135:         layout.tsx
136:         page.tsx
137:       api/
138:         docs-chat/
139:           route.ts
140:         docs-markdown/
141:           route.ts
142:         generate/
143:           route.ts
144:         search/
145:           route.ts
146:       fonts/
147:         GeistMonoVF.woff
148:         GeistVF.woff
149:       og/
150:         [...slug]/
151:           route.tsx
152:         og-image.tsx
153:         route.tsx
154:       playground/
155:         layout.tsx
156:         page.tsx
157:       favicon.ico
158:       globals.css
159:       layout.tsx
160:       not-found.tsx
161:     components/
162:       ui/
163:         accordion.tsx
164:         alert.tsx
165:         badge.tsx
166:         button.tsx
167:         card.tsx
168:         carousel.tsx
169:         checkbox.tsx
170:         collapsible.tsx
171:         dialog.tsx
172:         drawer.tsx
173:         dropdown-menu.tsx
174:         input.tsx
175:         label.tsx
176:         pagination.tsx
177:         popover.tsx
178:         progress.tsx
179:         radio-group.tsx
180:         resizable.tsx
181:         select.tsx
182:         separator.tsx
183:         sheet.tsx
184:         skeleton.tsx
185:         slider.tsx
186:         sonner.tsx
187:         switch.tsx
188:         table.tsx
189:         tabs.tsx
190:         textarea.tsx
191:         toggle-group.tsx
192:         toggle.tsx
193:         tooltip.tsx
194:       code-block.tsx
195:       code-tabs.tsx
196:       code.tsx
197:       copy-button.tsx
198:       copy-page-button.tsx
199:       demo.tsx
200:       docs-chat.tsx
201:       docs-mobile-nav.tsx
202:       docs-sidebar.tsx
203:       expandable-code.tsx
204:       generation-modes-diagram.tsx
205:       header.tsx
206:       package-install.tsx
207:       playground.tsx
208:       search.tsx
209:       table-of-contents.tsx
210:       theme-provider.tsx
211:       theme-toggle.tsx
212:     lib/
213:       render/
214:         catalog-display.ts
215:         catalog.ts
216:         registry.tsx
217:         renderer.tsx
218:       docs-navigation.ts
219:       examples.ts
220:       mdx-to-markdown.ts
221:       page-metadata.ts
222:       page-titles.ts
223:       rate-limit.ts
224:       search-index.ts
225:       spec-patch.ts
226:       use-playground-stream.ts
227:       utils.ts
228:     public/
229:       Geist-Regular.ttf
230:       GeistPixel-Square.ttf
231:     .env.example
232:     .gitignore
233:     CHANGELOG.md
234:     components.json
235:     eslint.config.js
236:     mdx-components.tsx
237:     next.config.js
238:     package.json
239:     postcss.config.mjs
240:     README.md
241:     tsconfig.json
242: examples/
243:   chat/
244:     app/
245:       api/
246:         generate/
247:           route.ts
248:       globals.css
249:       layout.tsx
250:       opengraph-image.png
251:       page.tsx
252:     components/
253:       ui/
254:         accordion.tsx
255:         alert.tsx
256:         badge.tsx
257:         button.tsx
258:         card.tsx
259:         chart.tsx
260:         input.tsx
261:         label.tsx
262:         progress.tsx
263:         radio-group.tsx
264:         select.tsx
265:         separator.tsx
266:         skeleton.tsx
267:         table.tsx
268:         tabs.tsx
269:       theme-provider.tsx
270:       theme-toggle.tsx
271:     lib/
272:       render/
273:         catalog.ts
274:         registry.tsx
275:         renderer.tsx
276:       tools/
277:         crypto.ts
278:         github.ts
279:         hackernews.ts
280:         search.ts
281:         weather.ts
282:       agent.ts
283:       rate-limit.ts
284:       utils.ts
285:     .env.example
286:     CHANGELOG.md
287:     eslint.config.js
288:     next-env.d.ts
289:     next.config.ts
290:     package.json
291:     postcss.config.mjs
292:     tsconfig.json
293:   dashboard/
294:     app/
295:       api/
296:         generate/
297:           route.ts
298:         v1/
299:           accounts/
300:             [id]/

(Showing lines 1-300 of 175539. Use offset=301 to continue.)
</content>
```

---

## Assistant (Hivefiver · xiaomi/mimo-v2-pro:free · 9.9s)

_Thinking:_

Now I have a comprehensive picture. The session file is 10,313 lines long. Let me also read the end of the session file to see where it left off, and also look at the JSON render library's key components.

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin/.worktrees/product-detox/session-ses_2da9.md",
  "offset": 10200
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin/.worktrees/product-detox/session-ses_2da9.md</path>
<type>file</type>
<content>10200: 
10201: 
10202: 5. Command resolves the `hivefiver` agent and executes
10203: 
10204: Now I should let the user know this is ready to test.
10205: 
10206: Bootstrap fixed. Plugin now auto-projects `hivefiver.md` on first load.
10207: 
10208: **Fresh install flow:**
10209: ```
10210: 1. User opens OpenCode (default 'build' agent)
10211: 2. HiveMind plugin loads
10212: 3. ensureAgentProjection() → creates .opencode/agents/hivefiver.md
10213: 4. User types /hm-init
10214: 5. Command finds hivefiver agent → executes hivemind_hm_init tool
10215: ```
10216: 
10217: Verified: `npx tsc --noEmit` clean, 5/5 tests pass. Only creates if missing — never overwrites existing config.
10218: 
10219: Try `/hm-init` on a fresh session. The plugin will auto-create the hivefiver agent before any command needs it.
10220: 
10221: ---
10222: 
10223: ## User
10224: 
10225: # HM Init
10226: 
10227: ## Objective
10228: Establish the control plane when `.hivemind` is missing or incomplete, then hand back a valid starting state for later workflows.
10229: 
10230: ## Context
10231: - Arguments: ``
10232: - Trigger: missing control-plane state or an explicit bootstrap request
10233: - Output focus: a startup report plus the next recommended command
10234: 
10235: ## Mandatory Execution Rules
10236: 1. First inspect runtime state with `hivemind_runtime_status`.
10237: 2. Never hand-write `.hivemind/**` files with `bash`, `write`, or ad hoc JSON scaffolding.
10238: 3. To actually run bootstrap, you must call `hivemind_runtime_command` with `command: "hm-init"`.
10239: 4. If `profileComplete` is false, you must immediately use the built-in `question` tool wizard before attempting bootstrap.
10240: 5. Do not ask a free-text permission question like "do you want me to run hm-init?" when bootstrap is already required.
10241: 6. Do not let runtime defaults silently fill missing profile groups. Missing intake must be completed explicitly or via the recommended preset groups.
10242: 
10243: ## Process
10244: 1. Inspect whether the control plane exists at all.
10245: 2. If the bootstrap profile is incomplete, run a staged `question` wizard:
10246:    - Stage 1: `preferredUserName`, `chatLanguage`, `artifactLanguage`
10247:    - Stage 2: `expertiseLevel`, `outputStyle`
10248:    - Stage 3: `governanceMode`, `automationLevel`
10249: 3. For Stages 2 and 3, offer "use recommended defaults" as the `guided-onboarding` preset.
10250: 4. After all stages are complete, execute `hivemind_runtime_command` for `hm-init` and include:
10251:    - explicit profile values collected so far
10252:    - `presetId: "guided-onboarding"` if any preset group was used
10253:    - `intakeEvidence` with:
10254:      - `source: "question-tool"`
10255:      - `questionnaireId: "bootstrap-profile-v1"`
10256:      - `displayLanguage`
10257:      - `completedGroups: ["identity-language", "expertise-style", "governance-automation"]`
10258:      - `usedRecommendedPresetGroups` for any stage that used the preset
10259: 5. If the runtime returns `executionMode: "question-gate"`, continue the wizard instead of improvising with defaults or shell writes.
10260: 6. Return the startup report and next workflow command instead of drifting directly into unrelated work.
10261: 
10262: ## Output Contract
10263: - status
10264: - created_state
10265: - missing_prerequisites
10266: - next_command
10267: 
10268: ---
10269: 
10270: ## Assistant (Hivefiver · xiaomi/mimo-v2-pro:free · 100.2s)
10271: 
10272: _Thinking:_
10273: 
10274: The user has pasted the ORIGINAL `commands/hm-init.md` content — this is what the file looked like BEFORE our modifications. They're showing me that our changes to `hm-init.md` replaced the `hivemind_runtime_command` references with `hivemind_hm_init`, but the original design uses `hivemind_runtime_command` which dispatches through the control plane to the existing init handler.
10275: 
10276: The original command says:
10277: - Rule 3: "you must call `hivemind_runtime_command` with `command: "hm-init"`"
10278: - It has a `question` tool wizard for profile intake
10279: - It uses `intakeEvidence` with specific fields
10280: 
10281: 
10282: - The output contract references `<hivemind-command-context>` with `tool_precedence` that chains `hivemind_runtime_command`
10283: 
10284: So the real issue is that the original design already had a working flow through the control plane with `hivemind_runtime_command` dispatching to handlers and using the `question` tool for profile intake. Our new `hivemind_hm_init` tool broke this by bypassing that chain entirely. I need to reconsider whether we should restore the original command flow instead of replacing it.
10285: 
10286: The user's point is clear: the original `hivemind_runtime_command` approach was the right design, and our new tools shouldn't have replaced it—they should work alongside it or integrate with it. I need to revert the changes to the command markdown files and keep the original flow intact, focusing our new tools on runtime configuration and skill injection instead.
10287: 
10288: The user is showing the ORIGINAL `hm-init.md` — this is what our changes overwrote. The original design uses `hivemind_runtime_command` which dispatches through the control plane. Our change broke this by replacing it with the new `hivemind_hm_init` tool that doesn't have the question wizard, intake evidence, or control plane dispatch.
10289: 
10290: Dispatching revert + proper integration.
10291: 
10292: **Tool: task**
10293: 
10294: **Input:**
10295: ```json
10296: {
10297:   "description": "Revert command md and integrate",
10298:   "prompt": "## Delegation Packet — Execution Mode\n\n**Target Agent:** hivemaker\n**Slice ID:** fix-revert-command-md-proper-integration\n**Mode:** execution\n\n### Problem\n\nThe original `commands/hm-init.md` uses `hivemind_runtime_command` with `command: \"hm-init\"` which dispatches through the control plane. It has:\n- Question wizard for profile intake (stages 1-3)\n- `intakeEvidence` contract\n- `tool_precedence` chain\n- `mutation_rule: do-not-hand-write-hivemind-state-files`\n\nOur Phase 06 changes replaced this with a reference to the new `hivemind_hm_init` tool. But the new tool is a PLACEHOLDER — it doesn't have the question wizard, intake, or control plane dispatch.\n\nThe original flow was CORRECT. We should NOT have changed the command markdown files.\n\n### Fix\n\n1. **Revert** `commands/hm-init.md` to original content (uses `hivemind_runtime_command`)\n2. **Revert** `commands/hm-settings.md` to original content (uses `hivemind_runtime_command`)\n3. **Revert** `commands/hm-doctor.md` to original content\n4. **Keep** the new hivefiver tools (`hivemind_hm_init`, `hivemind_hm_doctor`, `hivemind_hm_setting`) — they serve a different purpose as direct OpenCode tools for programmatic access\n5. **Keep** `.opencode/agents/hivefiver.md` — needed for the command to run\n6. **Keep** `ensureAgentProjection()` in plugin — needed for bootstrap\n\n### How to Revert\n\nUse git to restore the original command files:\n```bash\ngit checkout HEAD -- commands/hm-init.md commands/hm-doctor.md commands/hm-settings.md\n```\n\nIf git checkout doesn't work (files were never committed in original state), manually write the ORIGINAL content.\n\n### The ORIGINAL hm-init.md content:\n\n```markdown\n# HM Init\n\n## Objective\nEstablish the control plane when `.hivemind` is missing or incomplete, then hand back a valid starting state for later workflows.\n\n## Context\n- Arguments: ``\n- Trigger: missing control-plane state or an explicit bootstrap request\n- Output focus: a star... (line truncated to 2000 chars)
10299:   "subagent_type": "hivemaker"
10300: }
10301: ```
10302: 
10303: **Error:**
10304: ```
10305: Error: The user has specified a rule which prevents you from using this specific tool call. Here are some of the relevant rules [{"permission":"*","pattern":"*","action":"allow"},{"permission":"task","pattern":"*","action":"deny"},{"permission":"task","pattern":"hivexplorer","action":"allow"},{"permission":"task","pattern":"hiveplanner","action":"allow"},{"permission":"task","pattern":"hiverd","action":"allow"},{"permission":"task","pattern":"hiveq","action":"allow"},{"permission":"task","pattern":"build","action":"allow"},{"permission":"task","pattern":"general","action":"allow"},{"permission":"task","pattern":"plan","action":"allow"},{"permission":"task","pattern":"explore","action":"allow"}]
10306: ```
10307: 
10308: ---
10309: 
10310: ## Assistant (Hivefiver · xiaomi/mimo-v2-pro:free · 53.1s)
10311: 
10312: ---
10313: 

(End of file - total 10313 lines)
</content>
```

**Tool: bash**

**Input:**
```json
{
  "command": "ls -la /Users/apple/hivemind-plugin/.worktrees/product-detox/src/plugin/skill-exposure-map.ts /Users/apple/hivemind-plugin/.worktrees/product-detox/src/shared/opencode-skill-registry.ts /Users/apple/hivemind-plugin/.worktrees/product-detox/src/shared/paths.ts 2>/dev/null",
  "description": "Check key source files exist"
}
```

**Output:**
```
-rw-r--r--  1 apple  staff  6339 Mar 29 00:47 /Users/apple/hivemind-plugin/.worktrees/product-detox/src/plugin/skill-exposure-map.ts
-rw-r--r--  1 apple  staff  4177 Mar 29 00:47 /Users/apple/hivemind-plugin/.worktrees/product-detox/src/shared/opencode-skill-registry.ts
-rw-r--r--  1 apple  staff  2269 Mar 29 04:44 /Users/apple/hivemind-plugin/.worktrees/product-detox/src/shared/paths.ts

```

---

## Assistant (Hivefiver · xiaomi/mimo-v2-pro:free · 16.7s)

_Thinking:_

Now I have a complete picture. The session file ends at line 10313 with an error about hivemaker task delegation being blocked by permissions. The user now wants me to "continue the work from the session with deep investigation and revamp."

Let me synthesize everything I've learned:

## Current State Summary

### From the session (ses_2da9.md):
1. **Skill injection is broken**: `skill-exposure-map.ts` has 21 hardcoded skill names, 11 don't exist on disk
2. **MAX_SKILLS = 7** (should be 3 per policy)
3. **File-system registry disconnected**: `opencode-skill-registry.ts` discovers 15 real skills but isn't wired to injection


4. **Legacy CLI init is functional but problematic**, and there's a **false sync asset** that needs addressing
5. The session was building out the hivefiver system with `hm-init`, `hm-doctor`, and `hm-setting` commands, plus `hivemind_hm_init`/`hivemind_hm_doctor`/`hivemind_hm_setting` tools, but the final delegation to revert command files hit a permissions wall

### What the user wants now:
1. Deep investigation and synthesis using hivemind-ideating and hivemind-research
2. Configuration of features, settings, and behavioral changes for agents, workflows, and command chaining
3. Planning artifacts and agent work contracts to move under src/
4. A TUI or GUI local graphic leveraging Vercel JSON Render with the OpenCode SDK
5. A full revamp of the configuration system to make it more approachable and purposeful

I need to work through this systematically using the hivemind-synthesis skill I've loaded. Let me start by reading the key source files to understand the current state, then build out a comprehensive synthesis report.

Now I'm clarifying what the user is actually asking for: a local TUI or GUI graphic that visualizes the HiveMind configuration system, leveraging Vercel JSON Render's ability to render React components from JSON and the OpenCode SDK's programmatic interface. This is a visualization layer for the entire HiveMind module.

My approach will be to investigate the current state and produce a synthesis report with findings, then present a multi-round plan for the user to authorize.

Now I have full context from the session (10,313 lines, ended with permissions error blocking hivemaker delegation). Let me read the current state of key source files and produce the synthesis.

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin/.worktrees/product-detox/src/plugin/skill-exposure-map.ts"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin/.worktrees/product-detox/src/plugin/skill-exposure-map.ts</path>
<type>file</type>
<content>1: /**
2:  * Skill Exposure Map — Selective skill bundle resolution per agent and runtime state.
3:  *
4:  * Resolves skills for the active agent based on:
5:  * - The agent's registered identity
6:  * - The current purpose class (workflow type)
7:  * - The session state (main vs sub-session)
8:  *
9:  * Configuration is loaded dynamically via the skill injection loader.
10:  * Call `initSkillInjection(packageRoot)` once at plugin startup.
11:  *
12:  * Registry constraint: ONLY the 9 registered agent IDs are valid keys.
13:  * Subagents spawned via Task() use their parent agent's skill bundle.
14:  *
15:  * @module plugin/skill-exposure-map
16:  */
17: 
18: import { loadSkillInjectionConfig, type SkillInjectionConfig } from '../shared/skill-injection-loader.js'
19: import { resolveTieredSkills } from '../shared/tiered-injection.js'
20: import type { TaskClassification } from '../schema-kernel/agent-records.js'
21: 
22: export interface SkillEntry {
23:   name: string
24:   description: string
25: }
26: 
27: /** Cached config — populated by initSkillInjection() */
28: let cachedConfig: SkillInjectionConfig | null = null
29: 
30: /**
31:  * Resolve the default agent name from the loaded config.
32:  *
33:  * Returns the configured `default_agent` field, or falls back to `'hiveminder'`
34:  * if no config has been loaded yet.
35:  *
36:  * @returns The default agent ID
37:  */
38: export function resolveDefaultAgent(): string {
39:   return cachedConfig?.default_agent ?? 'hiveminder'
40: }
41: 
42: /**
43:  * Initialize skill injection from config file.
44:  *
45:  * Must be called once at plugin startup before resolveSkillBundle() is used.
46:  * Loads from '{packageRoot}/config/skill-injection.json', falling back to defaults.
47:  *
48:  * @param packageRoot - Absolute path to the project root
49:  */
50: export function initSkillInjection(packageRoot: string): void {
51:   cachedConfig = loadSkillInjectionConfig(packageRoot)
52: }
53: 
54: /**
55:  * Resolve the skill bundle for an active agent.
56:  *
57:  * Delegates to the two-tier injection system (`resolveTieredSkills`) which
58:  * handles shared skills, Tier 1 core init (project-initiation), agent bundles,
59:  * Tier 2 task-conditional (when taskClassification is provided), purpose-conditional,
60:  * and sub-session additions.
61:  *
62:  * The 4th parameter `taskClassification` is OPTIONAL — existing callers
63:  * (e.g., messages-transform-adapter.ts) use 3 args and continue to work.
64:  *
65:  * @param activeAgent        - The agent ID from transformInput.agent (may be undefined)
66:  * @param purposeClass       - The current purpose class from startWork routing
67:  * @param sessionState       - The session state (main | sub-session | fresh | ongoing | continuation)
68:  * @param taskClassification - The current task classification (optional — triggers Tier 2 injection)
69:  * @returns Ordered skill entries
70:  */
71: export function resolveSkillBundle(
72:   activeAgent: string | undefined,
73:   purposeClass: string | undefined,
74:   sessionState: string | undefined,
75:   taskClassification?: TaskClassification | undefined,
76: ): SkillEntry[] {
77:   if (!cachedConfig) {
78:     // Fallback: if init was never called, return empty bundle
79:     console.warn('[skill-exposure-map] resolveSkillBundle called before initSkillInjection. Returning empty bundle.')
80:     return []
81:   }
82: 
83:   // Phase classification is not exposed to the adapter yet; derive from purposeClass
84:   // When purposeClass is absent, phaseClassification is undefined (no Tier 1 injection)
85:   const phaseClassification = undefined
86: 
87:   return resolveTieredSkills(
88:     activeAgent,
89:     phaseClassification,
90:     taskClassification,
91:     cachedConfig,
92:     { purposeClass, sessionState },
93:   )
94: }
95: 
96: /**
97:  * Session role classification — determines whether the agent should DELEGATE or COMPLETE.
98:  *
99:  * This is NOT a role label. It is a behavioral directive written as natural
100:  * user-side guidance that tells the agent what to do with its current turn.
101:  */
102: export type SessionRole = 'orchestrate' | 'specialist' | 'standalone'
103: 
104: /**
105:  * Determine the session role based on session state and agent type.
106:  *
107:  * - main/fresh/ongoing/continuation + orchestrator agent → "orchestrate"
108:  *   → You are the conductor. Delegate work. Coordinate specialists.
109:  *
110:  * - sub-session + specialist agent → "specialist"
111:  *   → You received delegated work. Complete it. Do NOT redelegate.
112:  *     Stop only at a checkpoint, then return your evidence.
113:  *
114:  * - standalone agents (explorer, hiverd, hiveplanner) → "standalone"
115:  *   → You are doing direct research or planning. Make progress.
116:  *     Use subagents only for isolated parallel research.
117:  */
118: export function resolveSessionRole(
119:   sessionState: string | undefined,
120:   activeAgent: string | undefined,
121: ): SessionRole {
122:   // Orchestrator agents: hiveminder, hivefiver — always orchestrate in main sessions
123:   if (activeAgent === 'hiveminder' || activeAgent === 'hivefiver') {
124:     return 'orchestrate'
125:   }
126: 
127:   // Sub-session: specialist completing delegated work
128:   if (sessionState === 'sub-session') {
129:     return 'specialist'
130:   }
131: 
132:   // Specialist agents that should complete directly (not redelegate)
133:   const specialistAgents = ['hiveq', 'hivemaker', 'hivehealer', 'hitea']
134:   if (activeAgent && specialistAgents.includes(activeAgent)) {
135:     return 'specialist'
136:   }
137: 
138:   // Research/planning agents: standalone but may use parallel subagents
139:   const standaloneAgents = ['hivexplorer', 'hiverd', 'hiveplanner']
140:   if (activeAgent && standaloneAgents.includes(activeAgent)) {
141:     return 'standalone'
142:   }
143: 
144:   // Default for unknown agents
145:   return sessionState === 'sub-session' ? 'specialist' : 'orchestrate'
146: }
147: 
148: /**
149:  * Render the natural-language session role directive.
150:  * This is written as user-side prompting, NOT a system label.
151:  */
152: export function renderSessionRoleDirective(role: SessionRole): string {
153:   switch (role) {
154:     case 'orchestrate':
155:       return 'You are coordinating the session. Break work into focused tasks and delegate each to the right specialist. Do not implement directly — have specialists do the work and verify their returns.'
156:     case 'specialist':
157:       return 'You have a specific task to complete. Work on it until you reach a checkpoint, then return your evidence and findings. Do not redelegate your assigned work — you are the terminal executor for this task.'
158:     case 'standalone':
159:       return 'You are doing direct research or planning. Make tangible progress each turn. You may use parallel subagents for isolated research threads, but own the synthesis yourself.'
160:   }
161: }

(End of file - total 161 lines)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin/.worktrees/product-detox/src/plugin/AGENTS.md
# src/plugin/ — Plugin Assembly (Entry Point)

The OpenCode plugin entry point. Assembly-only — no business logic, no inline tools.

## Boundary

- `opencode-plugin.ts` assembles hooks, tools, and configuration
- Hooks are imported from `src/hooks/`
- Tools are imported from `src/tools/`
- **No inline tool definitions** — all tools extracted to `src/tools/`

## Assembly Pattern

```typescript
return {
  event: async (eventInput) => { await eventHandler(eventInput) },
  'chat.message': async (input, output) => { await handleChatMessage(...) },
  'tool.execute.after': async (toolInput) => { await handleToolExecution(...) },
  tool: { hivemind_runtime_status: ..., hivemind_task: ..., ... },
  // ... other hooks
}
```

## Rules

- Plugin file stays under 300 LOC
- No imports from `sdk-supervisor` deprecated modules
- All hook error handling uses `.catch(() => undefined)`
- Tools registered via `createHivemindXxxTool(directory)` factory pattern

</system-reminder>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin/.worktrees/product-detox/src/shared/opencode-skill-registry.ts"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin/.worktrees/product-detox/src/shared/opencode-skill-registry.ts</path>
<type>file</type>
<content>1: import { existsSync, readdirSync, readFileSync } from 'node:fs'
2: import { homedir } from 'node:os'
3: import { join } from 'node:path'
4: 
5: import YAML from 'yaml'
6: 
7: export interface SkillFrontmatter {
8:   name: string
9:   description: string
10:   [key: string]: unknown
11: }
12: 
13: export interface OpencodeSkillRegistryEntry {
14:   id: string
15:   sourcePath: string
16:   frontmatter: SkillFrontmatter
17:   body: string
18:   runtimeMarkdown: string
19:   referenceFiles: Map<string, string>
20:   templateFiles: Map<string, string>
21:   testFiles: Map<string, string>
22: }
23: 
24: interface DiscoveredSkill {
25:   skillDir: string
26:   skillId: string
27: }
28: 
29: function splitFrontmatter(markdown: string): {
30:   frontmatter: SkillFrontmatter
31:   body: string
32: } {
33:   const match = markdown.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
34:   if (!match) {
35:     throw new Error('Skill markdown must start with YAML frontmatter')
36:   }
37: 
38:   const [, yamlSource, body = ''] = match
39:   const parsed = YAML.parse(yamlSource) as SkillFrontmatter | null
40:   
41:   if (!parsed?.name || !parsed?.description) {
42:     throw new Error('Skill frontmatter must include name and description')
43:   }
44: 
45:   return {
46:     frontmatter: parsed,
47:     body,
48:   }
49: }
50: 
51: function projectRuntimeFrontmatter(
52:   frontmatter: SkillFrontmatter,
53: ): { name: string; description: string } {
54:   return {
55:     name: frontmatter.name,
56:     description: frontmatter.description,
57:   }
58: }
59: 
60: function renderRuntimeMarkdown(
61:   frontmatter: Pick<SkillFrontmatter, 'name' | 'description'>,
62:   body: string,
63: ): string {
64:   const renderedFrontmatter = YAML.stringify(frontmatter).trimEnd()
65:   const trimmedBody = body.replace(/^\n+/, '')
66:   return `---\n${renderedFrontmatter}\n---\n\n${trimmedBody}`
67: }
68: 
69: function readMarkdownFiles(baseDir: string, subDir: string): Map<string, string> {
70:   const files = new Map<string, string>()
71:   const fullPath = join(baseDir, subDir)
72: 
73:   try {
74:     const entries = readdirSync(fullPath, { withFileTypes: true })
75:     for (const entry of entries) {
76:       if (entry.isFile() && entry.name.endsWith('.md')) {
77:         const content = readFileSync(join(fullPath, entry.name), 'utf-8')
78:         files.set(`${subDir}/${entry.name}`, content)
79:       }
80:     }
81:   } catch {
82:     // Directory doesn't exist, return empty map
83:   }
84: 
85:   return files
86: }
87: 
88: function discoverSkills(scanRoots: string[], excludedSkillIds: string[] = []): DiscoveredSkill[] {
89:   const discovered: DiscoveredSkill[] = []
90:   const excludedSet = new Set(excludedSkillIds)
91:   const seen = new Set<string>()
92: 
93:   for (const root of scanRoots) {
94:     if (!existsSync(root)) continue
95: 
96:     try {
97:       const entries = readdirSync(root, { withFileTypes: true })
98:       for (const entry of entries) {
99:         if (!entry.isDirectory()) continue
100:         if (entry.name.startsWith('_')) continue
101:         if (excludedSet.has(entry.name)) continue
102:         if (seen.has(entry.name)) continue
103: 
104:         const skillDir = join(root, entry.name)
105:         const skillMd = join(skillDir, 'SKILL.md')
106:         if (!existsSync(skillMd)) continue
107: 
108:         seen.add(entry.name)
109:         discovered.push({ skillDir, skillId: entry.name })
110:       }
111:     } catch {
112:       // directory read failed, skip this root
113:     }
114:   }
115: 
116:   return discovered
117: }
118: 
119: function buildRegistryEntry(skill: DiscoveredSkill): OpencodeSkillRegistryEntry {
120:   const sourcePath = join(skill.skillDir, 'SKILL.md')
121:   const source = readFileSync(sourcePath, 'utf-8')
122:   const { frontmatter, body } = splitFrontmatter(source)
123:   const runtimeFrontmatter = projectRuntimeFrontmatter(frontmatter)
124: 
125:   return {
126:     id: skill.skillId,
127:     sourcePath,
128:     frontmatter,
129:     body,
130:     runtimeMarkdown: renderRuntimeMarkdown(runtimeFrontmatter, body),
131:     referenceFiles: readMarkdownFiles(skill.skillDir, 'references'),
132:     templateFiles: readMarkdownFiles(skill.skillDir, 'templates'),
133:     testFiles: readMarkdownFiles(skill.skillDir, 'tests'),
134:   }
135: }
136: 
137: export function createOpencodeSkillRegistry(
138:   packageRoot: string,
139:   excludedSkillIds: string[] = [],
140: ): OpencodeSkillRegistryEntry[] {
141:   const scanRoots = [
142:     join(packageRoot, '.opencode', 'skills'),
143:     join(homedir(), '.config', 'opencode', 'skills'),
144:   ]
145:   const skills = discoverSkills(scanRoots, excludedSkillIds)
146:   return skills.map((skill) => buildRegistryEntry(skill))
147: }

(End of file - total 147 lines)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin/.worktrees/product-detox/src/shared/AGENTS.md
# src/shared/ — Shared Utilities & Primitives

Cross-cutting utilities used by multiple modules. No domain logic.

## Boundary

- Path resolution (`paths.ts`): canonical path authority via `getEffectivePaths()`
- Runtime attachment (`runtime-attachment.ts`): session lifecycle state
- Tool helpers (`tool-helpers.ts`): JSON/list formatting for tool outputs
- **No business logic** — shared modules are pure utilities

## Key Exports

| Module | Purpose |
|--------|---------|
| `paths.ts` | `getEffectivePaths()` — single path authority |
| `runtime-attachment.ts` | Runtime attachment snapshot |
| `tool-helpers.ts` | Shared JSON/list helpers for tools |

## Rules

- All path constants in `paths.ts` — no hardcoded `.hivemind/` elsewhere
- Shared types use interface decomposition (≤10 fields per core type)
- No imports from `core/session/` (removed) or `event-bus.ts` (removed)

</system-reminder>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin/.worktrees/product-detox/src/shared/paths.ts"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin/.worktrees/product-detox/src/shared/paths.ts</path>
<type>file</type>
<content>1: /**
2:  * Path utilities for HiveMind
3:  * Centralizes all path constants and helpers
4:  */
5: 
6: import path from 'path'
7: 
8: // Root directory names
9: export const HIVEMIND_DIR = '.hivemind'
10: export const STATE_DIR = 'state'
11: export const SESSIONS_DIR = 'sessions'
12: export const GRAPH_DIR = 'graph'
13: export const CONFIG_DIR = 'config'
14: 
15: // State files
16: export const STATE_FILES = {} as const
17: 
18: // Path builders
19: export function getHivemindPath(projectRoot: string): string {
20:   return path.join(projectRoot, HIVEMIND_DIR)
21: }
22: 
23: export function getStatePath(projectRoot: string, filename: string): string {
24:   return path.join(projectRoot, HIVEMIND_DIR, STATE_DIR, filename)
25: }
26: 
27: export function getSessionPath(projectRoot: string, sessionId: string): string {
28:   return path.join(projectRoot, HIVEMIND_DIR, SESSIONS_DIR, sessionId)
29: }
30: 
31: export function getConfigPath(projectRoot: string, configName: string): string {
32:   return path.join(projectRoot, HIVEMIND_DIR, CONFIG_DIR, configName)
33: }
34: 
35: // Path predicates
36: export function isHivemindPath(filePath: string): boolean {
37:   return filePath.includes(HIVEMIND_DIR)
38: }
39: 
40: export function isSessionFile(filePath: string): boolean {
41:   return filePath.includes(SESSIONS_DIR)
42: }
43: 
44: /**
45:  * Canonical path authority: derives all runtime paths from a single project root.
46:  * All modules should use this instead of building paths ad-hoc.
47:  */
48: export function getEffectivePaths(projectRoot: string) {
49:   const root = path.join(projectRoot, HIVEMIND_DIR)
50:   const stateDir = path.join(root, STATE_DIR)
51:   const configDir = path.join(root, CONFIG_DIR)
52:   const graphDir = path.join(root, GRAPH_DIR)
53:   const sessionsDir = path.join(root, SESSIONS_DIR)
54:   const journeyEventsDir = path.join(root, SESSIONS_DIR, 'journey-events')
55:   const errorLogsDir = path.join(root, SESSIONS_DIR, 'error-logs')
56:   const projectPlanningDir = path.join(root, 'project', 'planning')
57: 
58:   return {
59:     root,
60:     stateDir,
61:     configDir,
62:     graphDir,
63:     sessionsDir,
64:     journeyEventsDir,
65:     errorLogsDir,
66:     projectPlanningDir,
67:     runtimeAttachmentSettings: path.join(configDir, 'runtime-attachment.json'),
68:     workflowTasksState: path.join(stateDir, 'tasks.json'),
69:     workflowTasksGraph: path.join(graphDir, 'tasks.json'),
70:     trajectoryLedger: path.join(stateDir, 'trajectory-ledger.json'),
71:   }
72: }

(End of file - total 72 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin/.worktrees/product-detox/commands/hm-init.md"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin/.worktrees/product-detox/commands/hm-init.md</path>
<type>file</type>
<content>1: ---
2: description: "Bootstrap the Hivemind control plane and collect the minimum required profile, governance, and readiness state."
3: agent: hivefiver
4: subtask: false
5: consumes_state:
6:   - entry
7: produces_state:
8:   - workflow-authority
9:   - trajectory-ledger
10:   - recovery-checkpoint
11:   - planning-projection
12: verification_contract: bootstrap-readiness
13: closeout_gate: required
14: artifact_projections:
15:   - planning
16:   - recovery
17: ---
18: 
19: # HM Init
20: 
21: ## Objective
22: Establish the control plane when `.hivemind` is missing or incomplete, then hand back a valid starting state for later workflows.
23: 
24: ## Context
25: - Arguments: `$ARGUMENTS`
26: - Trigger: missing control-plane state or an explicit bootstrap request
27: - Output focus: a startup report plus the next recommended command
28: 
29: ## Mandatory Execution Rules
30: 1. First inspect runtime state with `hivemind_runtime_status`.
31: 2. Never hand-write `.hivemind/**` files with `bash`, `write`, or ad hoc JSON scaffolding.
32: 3. To actually run bootstrap, you must call `hivemind_hm_init` with `mode: "auto"` (or `"greenfield"` / `"brownfield"` when explicitly directed).
33: 4. If `profileComplete` is false, you must immediately use the built-in `question` tool wizard before attempting bootstrap.
34: 5. Do not ask a free-text permission question like "do you want me to run hm-init?" when bootstrap is already required.
35: 6. Do not let runtime defaults silently fill missing profile groups. Missing intake must be completed explicitly or via the recommended preset groups.
36: 
37: ## Process
38: 1. Inspect whether the control plane exists at all.
39: 2. If the bootstrap profile is incomplete, run a staged `question` wizard:
40:    - Stage 1: `preferredUserName`, `chatLanguage`, `artifactLanguage`
41:    - Stage 2: `expertiseLevel`, `outputStyle`
42:    - Stage 3: `governanceMode`, `automationLevel`
43: 3. For Stages 2 and 3, offer "use recommended defaults" as the `guided-onboarding` preset.
44: 4. After all stages are complete, execute `hivemind_hm_init` with `mode: "auto"` and include:
45:    - `force: true` only when a full re-bootstrap is explicitly requested
46:    - `intakeEvidence` with:
47:      - `source: "question-tool"`
48:      - `questionnaireId: "bootstrap-profile-v1"`
49:      - `displayLanguage`
50:      - `completedGroups: ["identity-language", "expertise-style", "governance-automation"]`
51:      - `usedRecommendedPresetGroups` for any stage that used the preset
52: 5. If the runtime returns `executionMode: "question-gate"`, continue the wizard instead of improvising with defaults or shell writes.
53: 6. Return the startup report and next workflow command instead of drifting directly into unrelated work.
54: 
55: ## Output Contract
56: - status
57: - created_state
58: - missing_prerequisites
59: - next_command

(End of file - total 59 lines)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin/.worktrees/product-detox/commands/AGENTS.md
# /commands — OpenCode Command Contracts

## Responsibilities
- Store shipped slash-command projections as markdown files with frontmatter and structured sections.
- Represent command intent, routing context, process, and output contract in a form that mirrors OpenCode command concepts.
- Stay thin: the executable install/runtime logic belongs to `src/`, not to root markdown content.
- Reserve root `commands/` for bundle-backed or control-plane-adapter command assets.

## Rules
- Commands are thin OpenCode-facing projections, not runtime authority.
- Every command file must declare frontmatter at minimum: `description`, `agent`, and `subtask`.
- Keep command content focused on orchestration behavior, not implementation details of runtime modules.
- User-facing command assets must reference active governance artifacts such as `MASTER.active.md`, `task_plan.active.md`, and `progress.active.md` instead of legacy root planning files.
- Stable governance and SOT references inside command assets should use non-date-stamped authority paths.
- **If a command file is not referenced by `src/commands/slash-command/command-bundles.ts`, it does not belong in `commands/` as a live surface.**
- Command markdown may not rely on `.opencode/skills/**` shell pipelines or direct `.hivemind/**` mutation as hidden runtime engines.
- **User-space protection**: Commands operate in user-side spaces (`.hivemind/**`); any state mutations must use `context.ask()` for explicit user consent.

---

## Command Registry Status

### Registered Commands (10) — ACTIVE

These commands are backed by `SlashCommandBundle` entries in `src/commands/slash-command/command-bundles.ts`:

| Command | Agent | Purpose |
|---------|-------|---------|
| `hm-init` | hivefiver | Initialize control plane |
| `hm-doctor` | hivefiver | Repair broken control plane |
| `hm-harness` | hivefiver | Validate workflow readiness |
| `hm-settings` | hivefiver | Reconfigure control plane settings |
| `hm-research` | hiverd | Run research and synthesis workflow |
| `hm-plan` | hivefiver | Build structured implementation plan |
| `hm-implement` | hivefiver | Execute implementation workflow |
| `hm-verify` | hiveq | Run verification and review workflow |
| `hm-tdd` | hiveq | Enforce test-driven development flow |
| `hm-course-correct` | hivefiver | Recover or realign an active workflow |

---

## Noise/Disconnected Commands (33) — NOISE

These command files are NOT registered in `command-bundles.ts` and should be removed or never used:

### Hivefiver Subcommands (15) — NOISE

These are fake commands that don't exist in the bundle registry:

| Command | Reason |
|---------|--------|
| `hivefiver.md` | **VIOLATES RULES**: Contains `<enforcement>` blocks with shell scripts calling non-existent `.opencode/skills/hivefiver-*/scripts/`. This is a hidden runtime engine violation. |
| `hivefiver-start.md` | Not registered |
| `hivefiver-plan-spawn.md` | Not registered |
| `hivefiver-spec.md` | Not registered |
| `hivefiver-doctor.md` | Not registered |
| `hivefiver-discovery.md` | Not registered |
| `hivefiver-intake.md` | Not registered |
| `hivefiver-audit.md` | Not registered |
| `hivefiver-build.md` | Not registered |
| `hivefiver-continue.md` | Not registered |
| `hivefiver-architect.md` | Not registered |

### HiveRD Commands (6) — NOISE

| Command | Reason |
|---------|--------|
| `hiverd-synthesize.md` | Not registered |
| `hiverd-research.md` | Not registered |
| `hiverd-analyze.md` | Not registered |
| `hiverd-brainstorm.md` | Not registered |
| `hiverd-compare.md` | Not registered |

### HiveQ Commands (6) — NOISE

| Command | Reason |
|---------|--------|
| `hiveq-verify.md` | Not registered |
| `hiveq-gate-check.md` | Not registered |
| `hiveq-lint.md` | Not registered |
| `hiveq-regression.md` | Not registered |
| `hiveq-compliance.md` | Not registered |
| `hiveq-audit.md` | Not registered |

### HiveMind Commands (11) — NOISE

| Command | Reason |
|---------|--------|
| `hiveminder-orchestrate.md` | Not registered |
| `hivemind-status.md` | Not registered |
| `hivemind-scan.md` | Not registered |
| `hivemind-delegate.md` | Not registered |
| `hivemind-lint.md` | Not registered |
| `hivemind-debug-verify.md` | Not registered |
| `hivemind-clarify.md` | Not registered |
| `hivemind-compact.md` | Not registered |
| `hivemind-dashboard.md` | Not registered |
| `hivemind-debug-trigger.md` | Not registered |
| `hivemind-context.md` | Not registered |
| `hivemind-pre-stop.md` | Not registered |

---

## Why These Should Be Detached

1. **Violate AGENTS.md rules**: `hivefiver.md` uses shell scripts as hidden runtime engines
2. **No bundle backing**: Not registered in `command-bundles.ts`
3. **Misleading**: Appear to be valid commands but are never executed
4. **Non-existent skills**: `hivefiver.md` references `.opencode/skills/hivefiver-mode/` and `hivefiver-coordination/` which do not exist

## Do Not Reconnect

Do not reconnect these noise commands to the build:
- They reference non-existent skills and tools
- They bypass the bundle registry which is the runtime authority
- They violate the command markdown governance rules
- They create confusion about what is actually executable

</system-reminder>
```

---

## Assistant (Hivefiver · xiaomi/mimo-v2-pro:free · 11.6s)

_Thinking:_

Now I have a complete picture of the current state. Let me also check the new files that were created during the session (the skill-injection-loader, tiered-injection, and the new tools).

**Tool: bash**

**Input:**
```json
{
  "command": "find /Users/apple/hivemind-plugin/.worktrees/product-detox/src/shared -name \"skill-injection*\" -o -name \"tiered*\" 2>/dev/null; find /Users/apple/hivemind-plugin/.worktrees/product-detox/src/tools -name \"hm_*\" -o -name \"hm-*\" 2>/dev/null; find /Users/apple/hivemind-plugin/.worktrees/product-detox/src/schema-kernel -name \"agent*\" 2>/dev/null; find /Users/apple/hivemind-plugin/.worktrees/product-detox/src/features -name \"agent-work*\" 2>/dev/null; find /Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/agents -name \"hivefiver*\" 2>/dev/null",
  "description": "Find new files created during session"
}
```

**Output:**
```
/Users/apple/hivemind-plugin/.worktrees/product-detox/src/shared/skill-injection-loader.ts
/Users/apple/hivemind-plugin/.worktrees/product-detox/src/shared/tiered-injection.ts
/Users/apple/hivemind-plugin/.worktrees/product-detox/src/shared/skill-injection-loader.test.ts
/Users/apple/hivemind-plugin/.worktrees/product-detox/src/shared/tiered-injection.test.ts
/Users/apple/hivemind-plugin/.worktrees/product-detox/src/schema-kernel/agent-records.ts
/Users/apple/hivemind-plugin/.worktrees/product-detox/src/features/agent-work-contract
/Users/apple/hivemind-plugin/.worktrees/product-detox/src/features/agent-work-contract/hooks/agent-work-event-handler.test.ts
/Users/apple/hivemind-plugin/.worktrees/product-detox/src/features/agent-work-contract/hooks/agent-work-event-handler.ts
/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/agents/hivefiver.md

```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin/.worktrees/product-detox/src/tools"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin/.worktrees/product-detox/src/tools</path>
<type>directory</type>
<entries>
AGENTS.md
doc/
handoff/
hivefiver-doctor/
hivefiver-init/
hivefiver-setting/
hivefiver-tools.test.ts
hivemind-journal.test.ts
hivemind-journal.ts
index.ts
runtime/
task/
trajectory/

(13 entries)
</entries>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin/.worktrees/product-detox/src/schema-kernel"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin/.worktrees/product-detox/src/schema-kernel</path>
<type>directory</type>
<entries>
agent-records.ts
AGENTS.md
config-records.ts
default-agent-templates.test.ts
default-agent-templates.ts
index.ts
schema-records.test.ts
skill-injection-records.ts

(8 entries)
</entries>
```

---

## Assistant (Hivefiver · xiaomi/mimo-v2-pro:free · 20.5s)

_Thinking:_

Excellent! So the session has already created a lot of the infrastructure:

1. `src/shared/skill-injection-loader.ts` — loads the config
2. `src/shared/tiered-injection.ts` — two-tier injection system
3. `src/shared/skill-injection-loader.test.ts` — tests
4. `src/shared/tiered-injection.test.ts` — tests
5. `src/schema-kernel/agent-records.ts` — agent record types
6. `src/schema-kernel/config-records.ts` — config record types
7. `src/schema-kernel/default-agent-templates.ts` — default agent templates


8. `src/schema-kernel/skill-injection-records.ts` — skill injection record types
9. `src/features/agent-work-contract/` — agent work contract feature
10. `src/tools/hivefiver-doctor/` — hm-doctor tool
11. `src/tools/hivefiver-init/` — hm-init tool
12. `src/tools/hivefiver-setting/` — hm-setting tool
13. `.opencode/agents/hivefiver.md` — hivefiver agent definition

The session was interrupted, so I need to figure out what still needs to be completed.  Looking at the session file, it ended with a revert of command markdown files that failed due to permissions issues, and the user is now asking me to pick up where that left off. Let me read through the key new files to understand what's already been done.

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin/.worktrees/product-detox/src/shared/skill-injection-loader.ts"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin/.worktrees/product-detox/src/shared/skill-injection-loader.ts</path>
<type>file</type>
<content>1: /**
2:  * Skill Injection Loader — Config-driven dynamic skill bundle resolution.
3:  *
4:  * Reads skill injection configuration from `{packageRoot}/config/skill-injection.json`,
5:  * validates skill names against the on-disk registry, and caches the result.
6:  * Falls back to defaults when config file is missing.
7:  *
8:  * @module shared/skill-injection-loader
9:  */
10: 
11: import { readFileSync } from 'node:fs'
12: import { join } from 'node:path'
13: 
14: import { type SkillInjectionConfig, type SkillValidationResult } from '../schema-kernel/skill-injection-records.js'
15: import { createOpencodeSkillRegistry } from './opencode-skill-registry.js'
16: 
17: export type { SkillInjectionConfig, SkillValidationResult }
18: 
19: /** Cached config singleton — keyed by package root */
20: let cachedConfig: SkillInjectionConfig | null = null
21: let cachedRoot: string | null = null
22: 
23: /**
24:  * Build a default config derived from the current hardcoded exposure map.
25:  * Used when no config file exists on disk.
26:  *
27:  * @returns Default SkillInjectionConfig with agent bundles and purpose conditionals
28:  */
29: function buildDefaultConfig(): SkillInjectionConfig {
30:   return {
31:     _meta: {
32:       version: '1.0.0',
33:       updated_at: new Date().toISOString(),
34:       updated_by: 'hivemaker',
35:       schema: 'skill-injection-config-v1',
36:     },
37:     shared_skills: [
38:       { name: 'use-hivemind-delegation', description: 'Enforce delegation when front-facing agents must split work across subagents' },
39:     ],
40:     max_skills: null,
41:     agent_bundles: {
42:       hiveminder: [
43:         { name: 'hivemind-gatekeeping-delegation', description: 'Gatekeeping for multi-pass delegation loops and synthesis gates' },
44:         { name: 'git-continuity-memory', description: 'Git-aware context continuity, commit SHAs, and branch state for delegation resume' },
45:         { name: 'hivemind-atomic-commit', description: 'Atomic commit discipline with typed activity classification and pre-commit gates' },
46:       ],
47:       hivefiver: [
48:         { name: 'hivemind-gatekeeping-delegation', description: 'Gatekeeping for multi-pass delegation loops and synthesis gates' },
49:         { name: 'git-continuity-memory', description: 'Git-aware context continuity and branch state management' },
50:         { name: 'hivemind-atomic-commit', description: 'Atomic commit discipline with typed activity classification' },
51:       ],
52:       hiveq: [
53:         { name: 'tdd-delegation', description: 'TDD-aware delegation for red-green-refactor loops with phase gates' },
54:         { name: 'verification-before-completion', description: 'Run verification commands and confirm output before completing claims' },
55:         { name: 'test-driven-development', description: 'Test-first development with 80%+ coverage requirements' },
56:       ],
57:       hivemaker: [
58:         { name: 'tdd-delegation', description: 'TDD-aware delegation for red-green-refactor loops with phase gates' },
59:         { name: 'clean-code', description: 'Clean Code principles: meaningful names, small functions, clear intent' },
60:         { name: 'refactor', description: 'Surgical refactoring to improve maintainability without changing behavior' },
61:         { name: 'test-driven-development', description: 'Test-first development with red-green-refactor discipline' },
62:       ],
63:       hiveplanner: [
64:         { name: 'writing-plans', description: 'Create structured implementation plans with success criteria and dependencies' },
65:         { name: 'breakdown-plan', description: 'Break down work into Epic > Feature > Story/Enabler > Test hierarchy' },
66:         { name: 'spec-distillation', description: 'Distill noisy requirements into structured spec candidates before planning' },
67:       ],
68:       hivexplorer: [
69:         { name: 'research-delegation', description: 'Research-specific delegation for evidence collection and multi-source synthesis' },
70:         { name: 'context-map', description: 'Map all files relevant to a task before making changes' },
71:         { name: 'hivemind-codemap', description: 'Whole-codebase mapping, seam discovery, and concern slicing for refactors' },
72:         { name: 'hivemind-research', description: 'Structured research methodology with question framing and evidence grading' },
73:       ],
74:       hiverd: [
75:         { name: 'research-delegation', description: 'Research-specific delegation for evidence collection and multi-source synthesis' },
76:         { name: 'deep-research', description: 'Enterprise-grade research with multi-source synthesis and citation tracking' },
77:         { name: 'hivemind-research', description: 'Structured research methodology with question framing and evidence grading' },
78:       ],
79:       hivehealer: [
80:         { name: 'course-correction-delegation', description: 'Debug loop delegation: reproduce, narrow, contain, and prove evidence' },
81:         { name: 'systematic-debugging', description: 'Reproduce, narrow, contain, and create evidence before fixing bugs' },
82:         { name: 'hivemind-system-debug', description: 'Detox and restoration work with reproducibility and rollback logic' },
83:       ],
84:       hitea: [
85:         { name: 'tdd-delegation', description: 'TDD-aware delegation for red-green-refactor loops with phase gates' },
86:         { name: 'qa-test-planner', description: 'Comprehensive test plans with manual test cases and regression suites' },
87:         { name: 'test-driven-development', description: 'Test-first development with 80%+ coverage requirements' },
88:       ],
89:     },
90:     purpose_conditional: {
91:       tdd: [
92:         { name: 'tdd-delegation', description: 'TDD-aware delegation for red-green-refactor loops with phase gates' },
93:         { name: 'test-driven-development', description: 'Test-first development with 80%+ coverage requirements' },
94:       ],
95:       research: [
96:         { name: 'research-delegation', description: 'Research-specific delegation for evidence collection and multi-source synthesis' },
97:         { name: 'deep-research', description: 'Enterprise-grade research with multi-source synthesis and citation tracking' },
98:       ],
99:       planning: [
100:         { name: 'writing-plans', description: 'Create structured implementation plans with success criteria and dependencies' },
101:         { name: 'breakdown-plan', description: 'Break down work into Epic > Feature > Story/Enabler > Test hierarchy' },
102:       ],
103:       implementation: [
104:         { name: 'clean-code', description: 'Clean Code principles: meaningful names, small functions, clear intent' },
105:         { name: 'refactor', description: 'Surgical refactoring to improve maintainability without changing behavior' },
106:       ],
107:       'course-correction': [
108:         { name: 'course-correction-delegation', description: 'Debug loop delegation: reproduce, narrow, contain, and prove evidence' },
109:         { name: 'systematic-debugging', description: 'Reproduce, narrow, contain, and create evidence before fixing bugs' },
110:       ],
111:       gatekeeping: [
112:         { name: 'hivemind-gatekeeping-delegation', description: 'Gatekeeping for multi-pass delegation loops and synthesis gates' },
113:         { name: 'verification-before-completion', description: 'Run verification commands and confirm output before completing claims' },
114:       ],
115:     },
116:     subsession_additions: [
117:       { name: 'git-continuity-memory', description: 'Git-aware context continuity and branch state management for delegated sessions' },
118:     ],
119:     excluded_skill_ids: [],
120:     default_agent: 'hiveminder',
121:   }
122: }
123: 
124: /**
125:  * Load skill injection configuration from disk.
126:  *
127:  * Reads `{packageRoot}/config/skill-injection.json`. If the file doesn't exist,
128:  * returns default config derived from the original hardcoded exposure map.
129:  * Results are cached per package root.
130:  *
131:  * @param packageRoot - Absolute path to the project root
132:  * @returns Parsed or default SkillInjectionConfig
133:  */
134: export function loadSkillInjectionConfig(packageRoot: string): SkillInjectionConfig {
135:   // Return cached config if root matches
136:   if (cachedConfig && cachedRoot === packageRoot) {
137:     return cachedConfig
138:   }
139: 
140:   const configPath = join(packageRoot, 'config', 'skill-injection.json')
141: 
142:   try {
143:     const raw = readFileSync(configPath, 'utf-8')
144:     const parsed = JSON.parse(raw) as SkillInjectionConfig
145:     cachedConfig = parsed
146:     cachedRoot = packageRoot
147:     return parsed
148:   } catch (err) {
149:     // Config file missing or unreadable — use defaults
150:     if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
151:       console.warn(
152:         `[skill-injection-loader] Config file not found at ${configPath}. ` +
153:         'Using default skill injection config. Create the file to customize skill bundles.',
154:       )
155:     } else {
156:       console.warn(
157:         `[skill-injection-loader] Failed to read config at ${configPath}: ${(err as Error).message}. ` +
158:         'Using default config.',
159:       )
160:     }
161: 
162:     cachedConfig = buildDefaultConfig()
163:     cachedRoot = packageRoot
164:     return cachedConfig
165:   }
166: }
167: 
168: /**
169:  * Validate skill names in a config against the on-disk skill registry.
170:  *
171:  * Builds the registry from SKILL.md files on disk, then checks
172:  * every skill name referenced in the config. Missing skills are reported as
173:  * warnings (not errors), so the config remains valid.
174:  *
175:  * @param config - The skill injection config to validate
176:  * @param packageRoot - Absolute path to the project root for registry scan
177:  * @returns Validation result with missing skills and warnings
178:  */
179: export function validateSkillNames(
180:   config: SkillInjectionConfig,
181:   packageRoot: string,
182: ): SkillValidationResult {
183:   const registry = createOpencodeSkillRegistry(packageRoot)
184:   const registryIds = new Set(registry.map(entry => entry.id))
185: 
186:   const allSkillNames: string[] = []
187: 
188:   // Collect all referenced skill names from config
189:   for (const skill of config.shared_skills) {
190:     allSkillNames.push(skill.name)
191:   }
192:   for (const bundle of Object.values(config.agent_bundles)) {
193:     for (const skill of bundle) {
194:       allSkillNames.push(skill.name)
195:     }
196:   }
197:   for (const conditional of Object.values(config.purpose_conditional)) {
198:     for (const skill of conditional) {
199:       allSkillNames.push(skill.name)
200:     }
201:   }
202:   for (const skill of config.subsession_additions) {
203:     allSkillNames.push(skill.name)
204:   }
205: 
206:   // Deduplicate
207:   const uniqueNames = [...new Set(allSkillNames)]
208: 
209:   // Find missing
210:   const missingSkills = uniqueNames.filter(name => !registryIds.has(name))
211:   const warnings = missingSkills.map(
212:     name => `Skill "${name}" not found in registry at ${packageRoot}/skills/`,
213:   )
214: 
215:   return {
216:     valid: true, // Missing skills are warnings, not errors
217:     missing_skills: missingSkills,
218:     warnings,
219:   }
220: }
221: 
222: /**
223:  * Reset cached config — for testing only.
224:  * @internal
225:  */
226: export function resetCache(): void {
227:   cachedConfig = null
228:   cachedRoot = null
229: }

(End of file - total 229 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin/.worktrees/product-detox/src/shared/tiered-injection.ts"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin/.worktrees/product-detox/src/shared/tiered-injection.ts</path>
<type>file</type>
<content>1: /**
2:  * Tiered Injection — Two-tier skill injection resolution for the HiveMind framework.
3:  *
4:  * **Tier 1 (Core Init):** Skills always loaded during the project-initiation phase.
5:  * These are foundational skills every agent needs when setting up a project.
6:  *
7:  * **Tier 2 (Task-Conditional):** Skills loaded based on the current task classification.
8:  * The front agent (hiveminder/hivefiver) conditionally selects these based on:
9:  * - Active agent
10:  * - Current phase
11:  * - Task type
12:  *
13:  * @module shared/tiered-injection
14:  */
15: 
16: import type { SkillInjectionConfig } from '../schema-kernel/skill-injection-records.js'
17: import type { TaskClassification, PhaseClassification } from '../schema-kernel/agent-records.js'
18: 
19: /** A single skill entry — mirrors the schema-kernel SkillEntry type */
20: export interface SkillEntry {
21:   name: string
22:   description: string
23: }
24: 
25: /** A tier 2 task-conditional injection rule */
26: export interface SkillInjectionRule {
27:   /** The task classification that triggers this rule */
28:   task_classification: TaskClassification
29:   /** Skills always injected when this classification is active */
30:   mandatory_skills: SkillEntry[]
31:   /** Skills injected with high likelihood (treated as mandatory for resolution) */
32:   high_likelihood_skills: SkillEntry[]
33: }
34: 
35: // ─── Tier 1: Core Init Skills ────────────────────────────────────────────────
36: 
37: /**
38:  * Tier 1 core initialization skills — always loaded during project-initiation.
39:  *
40:  * These form the foundational skill set every agent needs when starting
41:  * a new project or resuming project initiation.
42:  */
43: export const TIER1_CORE_INIT_SKILLS: SkillEntry[] = [
44:   { name: 'use-hivemind', description: 'Session entry router — detects lineage, checks context health, routes to correct domain' },
45:   { name: 'use-hivemind-delegation', description: 'Enforce delegation when front-facing agents must split work across subagents' },
46:   { name: 'hivemind-spec-driven', description: 'Spec-driven engineering — from vague requirements to testable specs' },
47: ]
48: 
49: // ─── Tier 2: Task-Conditional Rules ──────────────────────────────────────────
50: 
51: /**
52:  * Tier 2 task-conditional rules — activated when taskClassification is provided.
53:  *
54:  * Each rule maps a task classification to its mandatory and high-likelihood skills.
55:  * The front agent (hiveminder/hivefiver) triggers these based on task type.
56:  */
57: export const TIER2_TASK_RULES: SkillInjectionRule[] = [
58:   {
59:     task_classification: 'tdd',
60:     mandatory_skills: [
61:       { name: 'use-hivemind-tdd', description: 'Test-driven development — red-green-refactor cycle with gate enforcement' },
62:     ],
63:     high_likelihood_skills: [
64:       { name: 'test-driven-development', description: 'Test-first development with 80%+ coverage requirements' },
65:       { name: 'verification-before-completion', description: 'Run verification commands and confirm output before completing claims' },
66:     ],
67:   },
68:   {
69:     task_classification: 'research',
70:     mandatory_skills: [
71:       { name: 'use-hivemind-research', description: 'Structured research methodology with question framing and evidence grading' },
72:     ],
73:     high_likelihood_skills: [
74:       { name: 'deep-research', description: 'Enterprise-grade research with multi-source synthesis and citation tracking' },
75:       { name: 'context-map', description: 'Map all files relevant to a task before making changes' },
76:     ],
77:   },
78:   {
79:     task_classification: 'debug',
80:     mandatory_skills: [
81:       { name: 'hivemind-system-debug', description: 'Detox and restoration work with reproducibility, containment, and rollback logic' },
82:     ],
83:     high_likelihood_skills: [
84:       { name: 'systematic-debugging', description: 'Reproduce, narrow, contain, and create evidence before fixing bugs' },
85:     ],
86:   },
87:   {
88:     task_classification: 'refactor',
89:     mandatory_skills: [
90:       { name: 'hivemind-refactor', description: 'Refactor methodology — smallest safe change, behavior preservation' },
91:     ],
92:     high_likelihood_skills: [
93:       { name: 'clean-code', description: 'Clean Code principles: meaningful names, small functions, clear intent' },
94:       { name: 'refactor', description: 'Surgical refactoring to improve maintainability without changing behavior' },
95:     ],
96:   },
97:   {
98:     task_classification: 'implementation',
99:     mandatory_skills: [
100:       { name: 'clean-code', description: 'Clean Code principles: meaningful names, small functions, clear intent' },
101:     ],
102:     high_likelihood_skills: [
103:       { name: 'refactor', description: 'Surgical refactoring to improve maintainability without changing behavior' },
104:     ],
105:   },
106:   {
107:     task_classification: 'codebase-scan',
108:     mandatory_skills: [
109:       { name: 'hivemind-codemap', description: 'Whole-codebase mapping, seam discovery, and concern slicing for refactors' },
110:     ],
111:     high_likelihood_skills: [
112:       { name: 'context-map', description: 'Map all files relevant to a task before making changes' },
113:     ],
114:   },
115:   {
116:     task_classification: 'spec-driven',
117:     mandatory_skills: [
118:       { name: 'hivemind-spec-driven', description: 'Spec-driven engineering — from vague requirements to testable specs' },
119:     ],
120:     high_likelihood_skills: [
121:       { name: 'writing-plans', description: 'Create structured implementation plans with success criteria and dependencies' },
122:     ],
123:   },
124:   {
125:     task_classification: 'investigation',
126:     mandatory_skills: [
127:       { name: 'context-map', description: 'Map all files relevant to a task before making changes' },
128:     ],
129:     high_likelihood_skills: [
130:       { name: 'hivemind-codemap', description: 'Whole-codebase mapping, seam discovery, and concern slicing for refactors' },
131:       { name: 'deep-research', description: 'Enterprise-grade research with multi-source synthesis and citation tracking' },
132:     ],
133:   },
134: ]
135: 
136: // ─── Resolution Logic ────────────────────────────────────────────────────────
137: 
138: /**
139:  * Resolve the complete skill bundle using the two-tier injection system.
140:  *
141:  * **Resolution order:**
142:  * 1. Shared skills from config (always)
143:  * 2. Tier 1 core init skills (if phase is 'project-initiation')
144:  * 3. Agent-specific bundle from config
145:  * 4. Tier 2 task-conditional skills (if taskClassification provided)
146:  * 5. Purpose-conditional skills from config (if purposeClass matches)
147:  * 6. Sub-session additions (if sessionState is 'sub-session')
148:  *
149:  * All entries are deduplicated by skill name. The max_skills cap is respected
150:  * when set (null = unlimited).
151:  *
152:  * @param agentId            - The active agent ID (e.g., 'hivemaker')
153:  * @param phaseClassification - The current phase classification ('project-initiation' | 'planning-execution')
154:  * @param taskClassification  - The current task classification (optional — triggers Tier 2 when present)
155:  * @param config             - The skill injection configuration
156:  * @param options            - Optional parameters: purposeClass, sessionState
157:  * @returns Ordered, deduplicated skill entries
158:  */
159: export function resolveTieredSkills(
160:   agentId: string | undefined,
161:   phaseClassification: PhaseClassification | undefined,
162:   taskClassification: TaskClassification | undefined,
163:   config: SkillInjectionConfig,
164:   options?: { purposeClass?: string | undefined; sessionState?: string | undefined },
165: ): SkillEntry[] {
166:   const maxSkills = config.max_skills
167:   const seen = new Set<string>()
168:   const result: SkillEntry[] = []
169:   const purposeClass = options?.purposeClass
170:   const sessionState = options?.sessionState
171: 
172:   /** Check if we've hit the cap */
173:   const isCapped = (): boolean => maxSkills !== null && result.length >= maxSkills
174: 
175:   /** Add a skill if not seen and not capped */
176:   const addSkill = (skill: SkillEntry): void => {
177:     if (isCapped()) return
178:     if (!seen.has(skill.name)) {
179:       seen.add(skill.name)
180:       result.push(skill)
181:     }
182:   }
183: 
184:   // 1. Shared skills (always)
185:   for (const skill of config.shared_skills) {
186:     addSkill(skill)
187:   }
188: 
189:   // 2. Tier 1: Core init skills (project-initiation only)
190:   if (phaseClassification === 'project-initiation') {
191:     for (const skill of TIER1_CORE_INIT_SKILLS) {
192:       addSkill(skill)
193:     }
194:   }
195: 
196:   // 3. Agent-specific bundle
197:   const defaultAgent = config.default_agent ?? 'hiveminder'
198:   const effectiveAgent = (agentId && agentId in config.agent_bundles)
199:     ? agentId
200:     : defaultAgent
201: 
202:   const agentSkills = config.agent_bundles[effectiveAgent] ?? []
203:   for (const skill of agentSkills) {
204:     addSkill(skill)
205:   }
206: 
207:   // 4. Tier 2: Task-conditional rules (when taskClassification provided)
208:   if (taskClassification) {
209:     const taskRule = TIER2_TASK_RULES.find(r => r.task_classification === taskClassification)
210:     if (taskRule) {
211:       for (const skill of taskRule.mandatory_skills) {
212:         addSkill(skill)
213:       }
214:       for (const skill of taskRule.high_likelihood_skills) {
215:         addSkill(skill)
216:       }
217:     }
218:   }
219: 
220:   // 5. Purpose-conditional skills (when purposeClass matches a key in config)
221:   if (purposeClass && purposeClass in config.purpose_conditional) {
222:     const conditionalSkills = config.purpose_conditional[purposeClass as keyof typeof config.purpose_conditional]
223:     for (const skill of conditionalSkills) {
224:       addSkill(skill)
225:     }
226:   }
227: 
228:   // 6. Sub-session additions
229:   if (sessionState === 'sub-session') {
230:     for (const skill of config.subsession_additions) {
231:       addSkill(skill)
232:     }
233:   }
234: 
235:   return result
236: }

(End of file - total 236 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin/.worktrees/product-detox/src/schema-kernel/skill-injection-records.ts"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin/.worktrees/product-detox/src/schema-kernel/skill-injection-records.ts</path>
<type>file</type>
<content>1: /**
2:  * Skill Injection Records — Injection rules and configuration
3:  *
4:  * @module schema-kernel/skill-injection-records
5:  */
6: 
7: import { z } from 'zod'
8: 
9: import type { TaskClassification, PhaseClassification } from './agent-records.js'
10: import { SkillEntry as SkillEntrySchema, PurposeClass as PurposeClassSchema } from './agent-records.js'
11: 
12: /** Conditional skill injection rule for an agent */
13: export const SkillInjectionRule = z.object({
14:   agent_id: z.string().min(1),
15:   phase: z.enum(['project-initiation', 'planning-execution']).optional() as z.ZodType<PhaseClassification>,
16:   task_classification: z.enum([
17:     'research', 'implementation', 'debug', 'refactor',
18:     'codebase-scan', 'tdd', 'spec-driven', 'investigation',
19:   ]).optional() as z.ZodType<TaskClassification>,
20:   mandatory_skills: z.array(SkillEntrySchema).min(1),
21:   high_likelihood_skills: z.array(SkillEntrySchema).default([]),
22: })
23: 
24: /** Full skill injection configuration with metadata */
25: export const SkillInjectionConfig = z.object({
26:   _meta: z.object({
27:     version: z.string().default('1.0.0'),
28:     updated_at: z.string().datetime(),
29:     updated_by: z.string().default('hivefiver'),
30:     schema: z.literal('skill-injection-config-v1'),
31:   }),
32:   shared_skills: z.array(SkillEntrySchema),
33:   max_skills: z.number().int().min(1).nullable().default(null),
34:   agent_bundles: z.record(z.string(), z.array(SkillEntrySchema)),
35:   purpose_conditional: z.record(PurposeClassSchema, z.array(SkillEntrySchema)),
36:   subsession_additions: z.array(SkillEntrySchema),
37:   excluded_skill_ids: z.array(z.string()).default([]),
38:   default_agent: z.string().default('hiveminder'),
39: })
40: 
41: /** Result of skill validation against a registry */
42: export const SkillValidationResult = z.object({
43:   valid: z.boolean(),
44:   missing_skills: z.array(z.string()),
45:   warnings: z.array(z.string()),
46: })
47: 
48: // Derived types
49: export type SkillInjectionRule = z.infer<typeof SkillInjectionRule>
50: export type SkillInjectionConfig = z.infer<typeof SkillInjectionConfig>
51: export type SkillValidationResult = z.infer<typeof SkillValidationResult>

(End of file - total 51 lines)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin/.worktrees/product-detox/src/schema-kernel/AGENTS.md
# src/schema-kernel/ — Phase 1 Contract Authority

Owns additive machine-authoritative contracts for persisted and cross-session Phase 1 records.

## Boundary

- This sector defines schemas and record shapes.
- It does not own durable writes, hook logic, or supervisor orchestration.
- Runtime behavior should consume these contracts rather than redefining them ad hoc in other sectors.

## Files

| File | Purpose |
|------|---------|
| `shared.ts` | Common enums and small shared schema primitives |
| `lifecycle-records.ts` | Entry, runtime invocation, turn output, delegation receipt contracts, and validated lifecycle record builders |
| `orchestration-records.ts` | Supervisor, session, workflow graph, wave, and guard contracts |
| `evidence-records.ts` | Freshness, deadlock, and replay contracts |
| `index.ts` | Sector barrel |

## Rules

- Keep schemas decomposed by concern; do not create a contract monolith.
- Favor additive introduction first, then migrate consumers slice by slice.
- Public package exports stay stable; internal schema-kernel modules do not imply new package entrypoints.
- Status/reporting consumers should build or parse lifecycle/orchestration records through this sector rather than publishing ad hoc JSON state with duplicate field contracts.
- The current live reporting consumer is `src/tools/runtime/tools.ts`, which now emits validated lifecycle/supervisor records in `hivemind_runtime_status`.

</system-reminder>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin/.worktrees/product-detox/src/schema-kernel/config-records.ts"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin/.worktrees/product-detox/src/schema-kernel/config-records.ts</path>
<type>file</type>
<content>1: /**
2:  * Config Records — User preferences and operation configuration
3:  *
4:  * @module schema-kernel/config-records
5:  */
6: 
7: import { z } from 'zod'
8: 
9: /** User communication expertise level */
10: export const UserExpertLevel = z.enum(['beginner', 'intermediate', 'advanced', 'expert'])
11: 
12: /** Governance strictness level */
13: export const GovernanceLevel = z.enum([
14:   'permissive',    // Minimal gates, fast iteration
15:   'standard',      // Normal TDD + verification gates
16:   'strict',        // Extra verification, mandatory review
17:   'paranoid',      // Halt-investigate-propose on any anomaly
18: ])
19: 
20: /** Agent operation mode */
21: export const OperationMode = z.enum([
22:   'iterative-interactive',  // Default — consult user each turn
23:   'research-first',         // Spawn sub-agent for fresh context each turn
24:   'yolo',                   // High autonomy, enforce all hierarchy
25: ])
26: 
27: /** User communication and governance preferences */
28: export const UserPreferences = z.object({
29:   communication_language: z.string().default('en'),
30:   document_language: z.string().default('en'),
31:   expert_level: UserExpertLevel.default('intermediate'),
32:   governance_level: GovernanceLevel.default('standard'),
33:   operation_mode: OperationMode.default('iterative-interactive'),
34: })
35: 
36: // Derived types
37: export type UserExpertLevel = z.infer<typeof UserExpertLevel>
38: export type GovernanceLevel = z.infer<typeof GovernanceLevel>
39: export type OperationMode = z.infer<typeof OperationMode>
40: export type UserPreferences = z.infer<typeof UserPreferences>

(End of file - total 40 lines)
</content>
```

---

## Assistant (Hivefiver · xiaomi/mimo-v2-pro:free · 18.2s)

_Thinking:_

Now I have a comprehensive picture. The session has already implemented a significant amount of infrastructure:

1. **skill-injection-loader.ts** — loads config from JSON, validates against registry, caches
2. **tiered-injection.ts** — two-tier injection (Tier 1 core init + Tier 2 task-conditional)
3. **skill-injection-records.ts** — Zod schemas for injection config
4. **config-records.ts** — user preferences schemas (expert level, governance, operation mode)
5. **skill-exposure-map.ts** — already updated to use the new loader (not the old hardcoded version)


6. **hivefiver tools** — init, doctor, and setting implementations in separate directories

But there are still critical gaps: the actual `config/skill-injection.json` file was deleted, the default configuration contains outdated skill names, the command markdown files need updating, and there's no TUI/GUI to visualize the configuration.

Let me figure out what the user actually needs from this session. They want a deep investigation to synthesize what was done with the JSON Render and OpenCode SDK, revamp the hivefiver module with proper configuration injection, add a local TUI/GUI for visualization, and clarify how planning artifacts and agent work contracts fit under src/. I should pull together a comprehensive report of what exists versus what's missing, then work out a plan for the next steps.

Before I move forward with a plan, I need to check a few more files to make sure I have the full picture.

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin/.worktrees/product-detox/src/schema-kernel/default-agent-templates.ts"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin/.worktrees/product-detox/src/schema-kernel/default-agent-templates.ts</path>
<type>file</type>
<content>1: /**
2:  * Default HiveMind Agent Templates
3:  *
4:  * FLAT templates — name and description only.
5:  * The hivefiver agent configures full runtime properties
6:  * (permissions, tools, skills, mcp, plugins) at initialization.
7:  *
8:  * @module schema-kernel/default-agent-templates
9:  */
10: 
11: import { type AgentTemplate, AgentTemplate as AgentTemplateSchema } from './agent-records.js'
12: 
13: // ─── Individual Agent Templates ──────────────────────────────────────────────
14: 
15: /** Primary orchestrator. Coordinates work, delegates to subagents, never reads deep. */
16: export const HIVEMINDER: AgentTemplate = AgentTemplateSchema.parse({
17:   name: 'hiveminder',
18:   description:
19:     'Primary orchestrator. Coordinates work, delegates to subagents, never reads deep.',
20:   mode: 'primary',
21: })
22: 
23: /** Framework writer and meta-builder. Bootstrap/doctor/initiator module. */
24: export const HIVEDFIVER: AgentTemplate = AgentTemplateSchema.parse({
25:   name: 'hivefiver',
26:   description:
27:     'Framework writer and meta-builder. Bootstrap/doctor/initiator module.',
28:   mode: 'all',
29: })
30: 
31: /** Debug and remediation specialist. Diagnoses broken systems, proposes fixes. */
32: export const HIVEHEALER: AgentTemplate = AgentTemplateSchema.parse({
33:   name: 'hivehealer',
34:   description:
35:     'Debug and remediation specialist. Diagnoses broken systems, proposes fixes, verifies recovery.',
36:   mode: 'subagent',
37: })
38: 
39: /** Verification specialist. Tests claims, validates requirements, runs evidence-based completion checks. */
40: export const HIVEQ: AgentTemplate = AgentTemplateSchema.parse({
41:   name: 'hiveq',
42:   description:
43:     'Verification specialist. Tests claims, validates requirements, runs evidence-based completion checks.',
44:   mode: 'subagent',
45: })
46: 
47: /** External research specialist. Fetches documentation, ecosystem knowledge, and market evidence. */
48: export const HIVERD: AgentTemplate = AgentTemplateSchema.parse({
49:   name: 'hiverd',
50:   description:
51:     'External research specialist. Fetches documentation, ecosystem knowledge, and market evidence.',
52:   mode: 'subagent',
53: })
54: 
55: /** Codebase investigator. Read-only exploration, pattern discovery, structure mapping. */
56: export const HIVEXPLORER: AgentTemplate = AgentTemplateSchema.parse({
57:   name: 'hivexplorer',
58:   description:
59:     'Codebase investigator. Read-only exploration, pattern discovery, structure mapping.',
60:   mode: 'subagent',
61: })
62: 
63: /** Test infrastructure specialist. Creates test harnesses, writes tests, validates test coverage. */
64: export const HITEA: AgentTemplate = AgentTemplateSchema.parse({
65:   name: 'hitea',
66:   description:
67:     'Test infrastructure specialist. Creates test harnesses, writes tests, validates test coverage.',
68:   mode: 'subagent',
69: })
70: 
71: /** System design authority. Architecture decisions, pattern selection, dependency analysis. */
72: export const ARCHITECT: AgentTemplate = AgentTemplateSchema.parse({
73:   name: 'architect',
74:   description:
75:     'System design authority. Architecture decisions, pattern selection, dependency analysis.',
76:   mode: 'subagent',
77: })
78: 
79: /** Implementation specialist. Executes scoped code changes, file creation, modification. */
80: export const HIVEMAKER: AgentTemplate = AgentTemplateSchema.parse({
81:   name: 'hivemaker',
82:   description:
83:     'Implementation specialist. Executes scoped code changes, file creation, modification.',
84:   mode: 'subagent',
85: })
86: 
87: /** Code quality auditor. Challenges assumptions, exposes anti-patterns, demands evidence. */
88: export const CODE_SKEPTIC: AgentTemplate = AgentTemplateSchema.parse({
89:   name: 'code-skeptic',
90:   description:
91:     'Code quality auditor. Challenges assumptions, exposes anti-patterns, demands evidence for claims.',
92:   mode: 'subagent',
93: })
94: 
95: // ─── Aggregate Export ────────────────────────────────────────────────────────
96: 
97: /** All 10 default HiveMind agent templates. */
98: export const DEFAULT_AGENT_TEMPLATES: readonly AgentTemplate[] = [
99:   HIVEMINDER,
100:   HIVEDFIVER,
101:   HIVEHEALER,
102:   HIVEQ,
103:   HIVERD,
104:   HIVEXPLORER,
105:   HITEA,
106:   ARCHITECT,
107:   HIVEMAKER,
108:   CODE_SKEPTIC,
109: ]

(End of file - total 109 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin/.worktrees/product-detox/src/schema-kernel/agent-records.ts"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin/.worktrees/product-detox/src/schema-kernel/agent-records.ts</path>
<type>file</type>
<content>1: /**
2:  * Agent Records — Agent template and bundle definitions
3:  *
4:  * @module schema-kernel/agent-records
5:  */
6: 
7: import { z } from 'zod'
8: 
9: /** A single skill entry with name and description */
10: export const SkillEntry = z.object({
11:   name: z.string().min(1),
12:   description: z.string().min(1),
13: })
14: 
15: /** Agent template for creation and configuration */
16: export const AgentTemplate = z.object({
17:   name: z.string().min(1),
18:   description: z.string().min(1),
19:   mode: z.enum(['primary', 'subagent', 'all']).default('all'),
20:   model: z.string().optional(),
21:   permission: z.record(z.string(), z.unknown()).optional(),
22:   tools: z.record(z.string(), z.boolean()).optional(),
23: })
24: 
25: /** Agent skill bundle — max 3 skills per agent */
26: export const AgentBundle = z.object({
27:   agent_id: z.string().min(1),
28:   skills: z.array(SkillEntry).max(3),
29: })
30: 
31: /** Trajectory purpose classification */
32: export const PurposeClass = z.enum([
33:   'tdd',
34:   'research',
35:   'planning',
36:   'implementation',
37:   'course-correction',
38:   'gatekeeping',
39: ])
40: 
41: /** Task type classification */
42: export const TaskClassification = z.enum([
43:   'research',
44:   'implementation',
45:   'debug',
46:   'refactor',
47:   'codebase-scan',
48:   'tdd',
49:   'spec-driven',
50:   'investigation',
51: ])
52: 
53: /** Phase tier classification */
54: export const PhaseClassification = z.enum([
55:   'project-initiation',  // Tier 1: greenfield/brownfield, core docs
56:   'planning-execution',  // Tier 2: phase and atomic planning
57: ])
58: 
59: // Derived types
60: export type SkillEntry = z.infer<typeof SkillEntry>
61: export type AgentTemplate = z.infer<typeof AgentTemplate>
62: export type AgentBundle = z.infer<typeof AgentBundle>
63: export type PurposeClass = z.infer<typeof PurposeClass>
64: export type TaskClassification = z.infer<typeof TaskClassification>
65: export type PhaseClassification = z.infer<typeof PhaseClassification>

(End of file - total 65 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/agents/hivefiver.md"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/agents/hivefiver.md</path>
<type>file</type>
<content>1: ---
2: description: "Framework-writer and Meta-builder for HiveMind assets. Executes bounded framework-asset edits and may delegate support-only research, planning, or verification."
3: mode: all
4: tools:
5:   write: true
6:   edit: true
7:   read: true
8:   bash: true
9: permission:
10:   write: allow
11:   edit: allow
12:   read: allow
13:   bash:
14:     "*": allow
15:   task:
16:     "*": deny
17:     "hivexplorer": allow
18:     "hiveplanner": allow
19:     "hiverd": allow
20:     "hiveq": allow
21:     "build": allow
22:     "general": allow
23:     "plan": allow
24:     "explore": allow
25:   hivemind_doc: allow
26:   skill:
27:     "use-hivemind": allow
28:     "use-hivemind-context": allow
29:     "use-hivemind-delegation": allow
30:     "use-hivemind-planning": allow
31:     "use-hivemind-skill-authoring": allow
32:     "hivemind-gatekeeping": allow
33:     "hivemind-atomic-commit": allow
34: ---
35: 
36: # HiveFiver
37: 
38: <role_priming>
39: You are the bounded framework-writer and Meta-builder for HiveMind. Your sole domain is building, tuning, and repairing the framework layer that ships with HiveMind (agent profiles, commands, workflows, skills). You are NOT an executor for product code.
40: </role_priming>
41: 
42: <task_decomposition>
43: When performing framework authoring, decompose your actions strictly in this order:
44: 1. **Intake:** Read the requirements for the framework change.
45: 2. **Scope-Check:** Ensure the request targets ONLY paths within your `scope_paths`.
46: 3. **Edit:** Apply the required modifications to the authoritative framework assets.
47: 4. **Verify:** Re-read the modified assets to guarantee they match HiveMind contract structures.
48: 5. **Return:** Report completion natively.
49: </task_decomposition>
50: 
51: <delegation_rules>
52: - You are a framework specialist, but you may delegate *support* work.
53: - You may delegate bounded support work to read-only or verification-oriented specialists such as `hivexplorer`, `hiveplanner`, `hiverd`, `hiveq`, or the innate OpenCode support agents.
54: - Do NOT delegate framework-asset editing to product executors like `hivemaker` or `hivehealer`.
55: </delegation_rules>
56: 
57: <hard_boundaries>
58: - **NEVER** edit `src/**` or `tests/**`. That is product code.
59: - Keep root framework files authoritative (e.g., `agents/`). User-local `.opencode/**` runtime projections are created by first-run runtime flows, not authored here.
60: - Prefer compact, machine-stable wording in agent profiles over extended motivational prompt text.
61: - Use precise taxonomy: distinguish between `tools` (executable runtime hooks) and `skills` (markdown procedures). Do not use these terms interchangeably.
62: </hard_boundaries>
63: 
64: <verification_loop>
65: Before concluding your task:
66: 1. Does the framework change perfectly abide by the strict CQRS and interface decomposition models outlined in `AGENTS.md`?
67: 2. Have you kept runtime projection ownership out of the root framework source?
68: If no, return `blocked` or `partial` describing the drift.
69: </verification_loop>
70: 
71: <output_contract>
72: Emit a summary listing the authoritative framework assets modified and confirmation that runtime projection ownership stayed on the first-run runtime side.
73: </output_contract>

(End of file - total 73 lines)
</content>
```

---

## Assistant (Hivefiver · xiaomi/mimo-v2-pro:free · 27.2s)

_Thinking:_

Now I have a complete picture. Let me summarize what exists and what needs to be done:

## What Already Exists (from the session)

### Schema Kernel (src/schema-kernel/)
- `agent-records.ts` — SkillEntry, AgentTemplate, AgentBundle, PurposeClass, TaskClassification, PhaseClassification (Zod schemas)
- `config-records.ts` — UserExpertLevel, GovernanceLevel, OperationMode, UserPreferences (Zod schemas)
- `skill-injection-records.ts` — SkillInjectionRule, SkillInjectionConfig, SkillValidationResult (Zod schemas)


- `default-agent-templates.ts` — 10 default agent templates (hiveminder, hivefiver, hivehealer, hiveq, hiverd, hivexplorer, hitea, architect, hivemaker, code-skeptic)

### Shared (src/shared/)
- `skill-injection-loader.ts` — Loads config from JSON, validates against registry, caches
- `tiered-injection.ts` — Two-tier injection (Tier 1 core init + Tier 2 task-conditional)
- `opencode-skill-registry.ts` — Scans .opencode/skills/ for SKILL.md files
- `paths.ts` — Basic path resolution

### Plugin (src/plugin/)
- `skill-exposure-map.ts` — Already updated to use new loader

### Tools (src/tools/)
- `hivefiver-init/` — hm-init tool
- `hivefiver-doctor/` — hm-doctor tool  
- `hivefiver-setting/` — hm-setting tool

### Agent Definition (.opencode/agents/)
- `hivefiver.md` — Framework writer agent with permissions

## What's Missing / Needs Fixing

### 1. Default config has stale skill names
The `buildDefaultConfig()` in `skill-injection-loader.ts` still references several deprecated skill identifiers that need updating.

### 2. No config file on disk
The `config/skill-injection.json` was deleted during the session. Need to create one with correct skill names.

### 3. paths.ts still has dead code
`ARTIFACTS_DIR`, `CHECKPOINTS_DIR`, `STATE_FILES` (empty), and `handoffsDir` are still missing from paths.ts.

### 4. Command markdown files
The session tried to revert these but failed due to permissions. Need to verify current state and ensure they reference the correct tools.

### 5. No TUI/GUI for configuration
The user is asking for a local TUI or GUI graphic using Vercel JSON Render plus OpenCode SDK to visualize the configuration system.

### 6. Planning artifacts and agent work contracts under src/
The `src/features/agent-work-contract/` already exists. Need to check if it's complete and add planning artifacts.

### 7. Noise commands
33 unregistered command files in `commands/` per the AGENTS.md in commands/.

### 8. Skill names in agent bundles still use old names
Even though `skill-exposure-map.ts` was updated, the `buildDefaultConfig()` uses old skill names.

Now I'm putting together a comprehensive synthesis report and determining what needs to be done next.

Now I have a complete picture. Let me run the build to verify the current state before producing the synthesis.

**Tool: bash**

**Input:**
```json
{
  "command": "npx tsc --noEmit 2>&1 | head -40",
  "description": "Type check current project state",
  "workdir": "/Users/apple/hivemind-plugin/.worktrees/product-detox"
}
```

**Tool: bash**

**Input:**
```json
{
  "command": "ls /Users/apple/hivemind-plugin/.worktrees/product-detox/config/skill-injection.json 2>/dev/null; ls /Users/apple/hivemind-plugin/.worktrees/product-detox/.hivemind/activity/pathing/ 2>/dev/null; ls /Users/apple/hivemind-plugin/.worktrees/product-detox/commands/*.md 2>/dev/null | wc -l",
  "description": "Check config, pathing, noise commands",
  "workdir": "/Users/apple/hivemind-plugin/.worktrees/product-detox"
}
```

**Output:**
```
      46

```

---

## Assistant (Hivefiver · xiaomi/mimo-v2-pro:free · 47.3s)

_Thinking:_

OK so:
1. TypeScript compiles clean (no errors)
2. `config/skill-injection.json` doesn't exist
3. `.hivemind/activity/pathing/` doesn't exist
4. There are 46 command markdown files (10 registered + 36 noise)

Now let me produce the comprehensive synthesis report and multi-round plan. The user wants me to continue the work from the session with deep investigation and revamp.

Given the scope (TUI/GUI, configuration overhaul, planning artifacts, agent work contracts), this is a multi-round effort. Let me produce the synthesis and plan.

TypeScript compiles clean. No `config/skill-injection.json` exists. 46 command files (10 registered, 36+ noise). No `pathing/` directory. 

Here is the complete synthesis of the current state and the multi-round plan for the revamp.

---

## Synthesis Report: HiveFiver Module — Current State vs. Required State

### What Already Exists (Session ses_2da9 deliverables)

| Layer | File | Status |
|-------|------|--------|
| **Schema Kernel** | `src/schema-kernel/agent-records.ts` | ✅ Zod: SkillEntry, AgentTemplate, AgentBundle, PurposeClass, TaskClassification, PhaseClassification |
| | `src/schema-kernel/config-records.ts` | ✅ Zod: UserExpertLevel, GovernanceLevel, OperationMode, UserPreferences |
| | `src/schema-kernel/skill-injection-records.ts` | ✅ Zod: SkillInjectionRule, SkillInjectionConfig, SkillValidationResult |
| | `src/schema-kernel/default-agent-templates.ts` | ✅ 10 agent templates (hiveminder→code-skeptic) |
| **Shared** | `src/shared/skill-injection-loader.ts` | ✅ Loads config JSON, validates against registry, caches |
| | `src/shared/tiered-injection.ts` | ✅ Two-tier: Tier 1 core-init + Tier 2 task-conditional |
| | `src/shared/opencode-skill-registry.ts` | ✅ Scans .opencode/skills/ for SKILL.md |
| **Plugin** | `src/plugin/skill-exposure-map.ts` | ✅ Refactored to use new loader + tiered injection |
| **Tools** | `src/tools/hivefiver-init/` | ✅ hm-init tool |
| | `src/tools/hivefiver-doctor/` | ✅ hm-doctor tool |
| | `src/tools/hivefiver-setting/` | ✅ hm-setting tool |
| **Agent** | `.opencode/agents/hivefiver.md` | ✅ Framework writer agent |

### Critical Gaps

| Gap | Severity | Detail |
|-----|----------|--------|
| `config/skill-injection.json` missing | **BLOCKING** | Default config in `buildDefaultConfig()` uses **13 stale skill names** (hivemind-gatekeeping-delegation, git-continuity-memory, tdd-delegation, research-delegation, spec-distillation, course-correction-delegation, hivemind-research, hivemind-codemap, hivemind-system-debug) |
| `paths.ts` dead code | LOW | `STATE_FILES` is empty object, `journeyEventsDir`/`errorLogsDir` unused |
| 36+ noise commands in `commands/` | **MEDIUM** | Not registered in `command-bundles.ts`, some violate AGENTS.md rules (hidden shell scripts) |
| No TUI/GUI for config visualization | **HIGH** | User requirement: local graphic using Vercel JSON Render + OpenCode SDK |
| `src/features/agent-work-contract/` incomplete | **MEDIUM** | Exists but needs planning artifact integration |
| `.hivemind/activity/pathing/` missing | LOW | No `active-paths.json` deterministic path registry |
| Session ended with permissions error | **BLOCKING** | hivemaker task delegation was denied — `task` permission `hivemaker` is not in the allow list |

### Skill Name Drift in Default Config

| Old Name (in `buildDefaultConfig()`) | Correct Name (on disk) | Status |
|---|---|---|
| `hivemind-gatekeeping-delegation` | `hivemind-gatekeeping` | RENAME |
| `git-continuity-memory` | `use-hivemind-git-memory` | RENAME |
| `tdd-delegation` | `use-hivemind-tdd` | RENAME |
| `research-delegation` | `use-hivemind-research` | RENAME |
| `spec-distillation` | `hivemind-spec-driven` | RENAME |
| `course-correction-delegation` | DEPRECATED | REMOVE (split into hivemind-system-debug + hivemind-refactor) |
| `hivemind-research` | `use-hivemind-research` | RENAME |
| `hivemind-codemap` | `hivemind-codemap` | ✅ EXISTS |
| `hivemind-system-debug` | `hivemind-system-debug` | ✅ EXISTS |
| `verification-before-completion` | `.agents/skills/` only | EXTERNAL |
| `test-driven-development` | `.agents/skills/` only | EXTERNAL |
| `clean-code` | `.agents/skills/` only | EXTERNAL |
| `refactor` | `.agents/skills/` only | EXTERNAL |
| `writing-plans` | `.agents/skills/` only | EXTERNAL |
| `breakdown-plan` | `.agents/skills/` only | EXTERNAL |
| `deep-research` | `.agents/skills/` only | EXTERNAL |
| `systematic-debugging` | `.agents/skills/` only | EXTERNAL |
| `qa-test-planner` | `.agents/skills/` only | EXTERNAL |
| `context-map` | `.agents/skills/` only | EXTERNAL |
| `hivemind-research` | `use-hivemind-research` | RENAME |

### OpenCode Configuration Schema Coverage

| Entity | opencode.json | HiveMind Config | Gap |
|--------|-------------|-----------------|-----|
| `agent` | ✅ Supported | ✅ 10 templates in schema-kernel | Need to project into `opencode.json` |
| `command` | ✅ Supported | ✅ 10 registered bundles | Need command config projection |
| `permission` | ✅ Supported | ✅ hivefiver.md has permissions | Need global permission config |
| `skills` | ✅ Supported | ✅ skill injection system | Need `skills.paths` in opencode.json |
| `mcp` | ✅ Supported | ❌ Not configured | Future |
| `plugin` | ✅ Supported | ✅ hivemind plugin loaded | OK |
| `model` | ✅ Supported | ✅ minimax configured | OK |
| `instructions` | ✅ Supported | ✅ AGENTS.md exists | OK |

---

## Multi-Round Plan for Authorization

This is a **multi-round orchestration** — each round requires authorization before proceeding.

### Round 1: Foundation Repair (Low Risk, High Impact)
**Goal:** Fix stale skill names, create config file, clean dead code, remove noise commands

| # | Task | Delegated To | Gate |
|---|------|-------------|------|
| 1.1 | Fix `buildDefaultConfig()` — replace 13 stale skill names with correct on-disk names | hivemaker | `npx tsc --noEmit` |
| 1.2 | Create `config/skill-injection.json` with correct names only | hivemaker | File validates against schema |
| 1.3 | Clean `paths.ts` dead code (empty STATE_FILES, unused journeyEventsDir/errorLogsDir) | hivemaker | `npx tsc --noEmit` |
| 1.4 | Remove 36+ noise commands from `commands/` (not in `command-bundles.ts`) | hivemaker | `npm run build` passes |
| 1.5 | Fix hivefiver permissions — add `hivemaker` to task allow list | hivemaker | Task tool works for hivemaker |

### Round 2: TUI/GUI Configuration Interface
**Goal:** Build local graphic for visual configuration management using Vercel JSON Render + OpenCode SDK

| # | Task | Delegated To | Gate |
|---|------|-------------|------|
| 2.1 | Design JSON schema for TUI config panels (user prefs, agent bundles, skill injection, governance) | architect | Schema compiles |
| 2.2 | Build React component tree: ConfigPanel, AgentCard, SkillInjector, UserPrefsForm, GovernanceSelector | hivemaker | Renders without errors |
| 2.3 | Wire to OpenCode SDK for live config read/write (`client.config.get()`, `client.session.prompt()`) | hivemaker | SDK integration test |
| 2.4 | Create `src/features/config-tui/` module with entry point and render pipeline | hivemaker | `npx tsc --noEmit` |
| 2.5 | Build command `/hm-dashboard` to launch TUI in browser or terminal | hivemaker | Command registered |

### Round 3: Planning Artifacts & Agent Work Contracts
**Goal:** Integrate planning artifacts and agent work contracts under `src/`

| # | Task | Delegated To | Gate |
|---|------|-------------|------|
| 3.1 | Expand `src/features/agent-work-contract/` — add plan record, slice, and delegation packet types | hivemaker | Types compile |
| 3.2 | Create `src/features/planning-artifacts/` — plan lifecycle, phase tracking, TDD checkpoints | hivemaker | Module compiles |
| 3.3 | Wire agent work contracts to `hivemind_task` and `hivemind_trajectory` tools | hivemaker | Tools emit contract records |
| 3.4 | Create planning artifact TUI panels (phase tracker, dependency graph, checkpoint viewer) | hivemaker | Renders in dashboard |

### Round 4: Configuration Orchestration
**Goal:** Wire hm-init/hm-doctor/hm-setting to full configuration lifecycle

| # | Task | Delegated To | Gate |
|---|------|-------------|------|
| 4.1 | Update hm-init to write `config/skill-injection.json` after interview | hivemaker | Config file produced |
| 4.2 | Update hm-doctor to validate skill names against registry | hivemaker | Doctor reports mismatches |
| 4.3 | Update hm-setting to allow per-agent bundle editing | hivemaker | Settings produce valid config |
| 4.4 | Wire `ensureAgentProjection()` to create all 10 agent .md files | hivemaker | All agents projected |
| 4.5 | Integration test: full hm-init → hm-doctor → hm-setting flow | hiveq | All pass |

### Round 5: Verification & Completion
**Goal:** End-to-end validation

| # | Task | Delegated To | Gate |
|---|------|-------------|------|
| 5.1 | `npm test` — all pass | hiveq | Green |
| 5.2 | `npx tsc --noEmit` — zero errors | hiveq | Green |
| 5.3 | `npm run build` — exit 0 | hiveq | Green |
| 5.4 | Smoke test: inject skills → verify only real names appear | hiveq | Verified |
| 5.5 | Code review: architecture, anti-patterns, dead code | code-skeptic | Approved |

---

**This plan covers 5 rounds, 25 tasks, with TDD gates at every round boundary. Which round should I begin with?**

Runtime projection ownership stays on the first-run runtime side (`.opencode/agents/` is auto-projected by `ensureAgentProjection()`, not authored in root). All schema and injection logic is in `src/schema-kernel/` and `src/shared/`. The TUI module will live in `src/features/config-tui/`.

---

