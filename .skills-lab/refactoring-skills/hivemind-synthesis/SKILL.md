---
name: hivemind-synthesis
description: Investigation, research, and synthesis orchestration — codebase, sessions, and activity analysis with Repomix + MCP tool integration and pre-gatekeeping on synthesized output.
---
> **Parameter Legend**
>
> | Placeholder | Meaning |
> |---|---|
> | `{runtime_state_dir}` | Runtime state directory (e.g., `.hivemind/`) |
> | `{runtime_activity_dir}` | Activity output directory (e.g., `.hivemind/activity/`) |
> | `{pathing_config}` | Active paths configuration file (e.g., `.hivemind/pathing/active-paths.json`) |
>
> Replace placeholders with your project's actual runtime paths.



## Table of Contents

- [When to Load](#when-to-load)
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

**Synthesis is not assembly. Assembly concatenates findings. Synthesis produces understanding. If unable to explain how findings connect, the output is aggregated — not synthesized.**

## When to Load


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
| Session-inspection | `{runtime_state_dir}/session-inspection/ses_*/` | 427 dirs, 768 files | Reconstructing agent decisions |
| Sessions | `{runtime_state_dir}/sessions/ses_*/` | 1,748 JSON + 103 dirs | Workflow pattern analysis |
| Session exports | project root `session-ses_*.md` | 5 files, 54K+ lines | User prompt pattern analysis |

Session-inspection: each dir has `assistant-output.md` + `purification-command.json`. Sessions: each dir has `session.json` (metadata) + `events.md` (timestamped) + `diagnostics.log`.

Time-machine investigation: filter by date → Repomix pack session-inspection dirs → grep for decisions → cross-reference with git commits → synthesize temporal narrative.

Long-haul analysis: track purpose classes across time, detect workflow bottlenecks, map delegation chains.

**Full protocol:** `references/session-investigation.md`

### Activity Investigation

`{runtime_activity_dir}/` with 17 subdirectories, 137+ files:

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
| Tests pass | `Run the test suite (e.g., npm test, pytest, cargo test)` — all green | Hard — blocks |
| Build succeeds | `Build the project (e.g., npm run build, cargo build)` — exit 0 | Hard — blocks |
| Types check | `Run type checking (e.g., npx tsc --noEmit for TypeScript)` — 0 errors | Hard — blocks |
| No circular dependencies | Dependency graph analysis | Hard — blocks |
| No broken exports | Grep verification of import chains | Soft — warning |
| Session findings cross-checked | Git log correlation with session timestamps | Soft — warning |

Protocol: Run all hard gates first. If any hard gate fails → synthesis cannot proceed. Run soft gates after hard gates pass. Log to `{runtime_activity_dir}/synthesis/pre-gate-{timestamp}.json`. Pre-gate result feeds into `hivemind-gatekeeping` synthesis gate.

Integration: Pre-gate is a **precondition** for synthesis gates. Pre-gate failure → block pipeline. Pre-gate pass → proceed to `hivemind-gatekeeping`. Both must pass for synthesis output to be trusted.

**Full protocol:** `references/pre-gatekeeping.md`

---

## Agent Swarm Orchestration

This skill coordinates investigation swarms under orchestrator (e.g., hiveminder) coordination:

| Agent | Role | When Dispatched |
|-------|------|----------------|
| `an investigation agent (e.g., hivexplorer)` | Read-only broad sweeps | Parallel investigation waves |
| `a research agent (e.g., hiverd)` | External research via MCP tools | Documentation, library validation |
| `architect` | Design validation | Architecture validation of synthesis |
| `an implementation agent (e.g., hivemaker)` | Implementation | Investigation reveals code changes needed |

Leveraging: `use-hivemind-delegation` (swarm dispatch packets), `use-hivemind-research` (MCP tool utilization), OpenCode built-in tools (grep, glob, list, LSP, offset reading, websearch).

Wave pattern: Wave 1 — parallel investigation agent (e.g., hivexplorer) sweeps (pack + grep). Wave 2 — `a research agent (e.g., hiverd)` external research (MCP tools). Wave 3 — `architect` validation. Each wave produces structured findings. the orchestrator (e.g., hiveminder) synthesizes across waves.

---

## Anti-Patterns

| # | Anti-Pattern | What Actually Happens |
|---|-------------|----------------------|
| 1 | **Synthesizing without investigation** | Produces a beautiful analysis of assumptions. None of it is grounded in code. |
| 2 | **Trusting session memory without git verification** | "I remember we decided X." Git says otherwise. 2 hours wasted on wrong direction. |
| 3 | **Skipping pre-gatekeeping** | Synthesis output references broken APIs. Downstream agents build on sand. |
| 4 | **Full read when grep would answer** | Reads 10,000 lines to find one import statement. Use targeted grep. |
| 5 | **Single-source synthesis** | Found one answer and stopped. Two sources might disagree. Always cross-check. |
| 6 | **Repomix pack without compression on large codebases** | Blows the token budget on full file contents. Use `--compress` for architecture analysis. |
| 7 | **Synthesis without wave sequencing** | Tries to investigate, research, validate, and synthesize in one pass. Context overload. Use waves. |

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
| Session/activity reconstruction | inspect `{runtime_state_dir}/` artifacts + correlate with git or output evidence | narrative timeline + claim appendix |

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

Run `Run synthesis validation (e.g., scripts/hm-synthesis-validate.sh <report.md> [claims.json])` before handoff.  
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
- Synthesis artifacts are stored in `{project}/{runtime_activity_dir}/synthesis/` at runtime
- Pre-gate results feed into `hivemind-gatekeeping` synthesis gates
- This skill composes with `hivemind-codemap` for codebase scanning, `use-hivemind-context` for investigation trust, and `hivemind-architecture` for design validation

## Activity Output

All artifacts produced by this skill follow the Activity Folder Protocol.

**Pathing:** See `{pathing_config}` for resolved output paths.
**Naming:** `{category}-{semantic-id}-{YYYY-MM-DD}.{ext}`
**Meta:** All JSON includes `_meta.created_at`, `_meta.updated_at`, `_meta.producer`.
**Validation:** `Run artifact validation (e.g., bash scripts/hm-artifact-validate.sh {path})` to confirm compliance.