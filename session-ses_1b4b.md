# New session - 2026-05-21T15:55:53.642Z

**Session ID:** ses_1b4bfe255ffeZu1PJ704FsDsq9
**Created:** 5/21/2026, 10:55:53 PM
**Updated:** 5/21/2026, 11:04:20 PM

---

## User

Route to the appropriate codebase-intelligence skill based on the user's intent.
`gsd-scan` and `gsd-intel` were folded into `gsd-map-codebase` flags by #2790.

| User wants | Invoke |
|---|---|
| Map the full codebase structure | gsd-map-codebase |
| Quick lightweight codebase scan | gsd-map-codebase --fast |
| Query mapped intelligence files | gsd-map-codebase --query |
| Generate a knowledge graph | gsd-graphify |
| Update project documentation | gsd-docs-update |
| Extract learnings from a completed phase | gsd-extract-learnings |

Invoke the matched skill directly using the Skill tool.

<tìm lại các implementation liên quan tới execute-slash-command để thật sự nâng cấp nó vì nó làm chưa thật sự đúng lắm khi thiếu một số chức năng như sau - không thể điều chỉnh thay đổi front-facing agent qua TUI trước khi append slash commands, agents còn lẫn lộn khi sử dụng nó vì khi chạy @agent- + với slash thì sẽ chẳng execute gì được cả  --- thay vào đó nó phải có lựa chọn cả 2 cơ chế sau đây sử dụng chính OpenCode SDK là switch to intended agent trước rồi mới append slash command lúc này front facing sẽ thay đổi ngay trên TUI của user - và cơ chế chạy slash command với agent định trước đó rồi sau khi hoàn thành lượt sẽ quay lại về agent mà user lựa chọn. Ngoài ra sự thiếu hiểu biết của chức năng này về các primitives của OpenCode cách nó bố trí tại .opencode/command(s) ; agent(s) , cho cả số ít và số nhiều, cho project và global cũng như các primitives này stack với nhau như thế nào qua $ARGUMENTS qua field agent và subtask: true/false etc khiến các chức năng liên đới và chính nó bị thiết kế với rất nhiều gaps và lỗi mà cần nghiên cứu sâu để hiểu rõ thêm vì nó có liên đới chặt chẽ với task tool để delegate - ví dụ khi sử dụng execute-slash-command agent phải load được hệ thống agents đang có (các lựa chọn cấp bậc, mode như all, primary và subagent) các commands và fields để khi đưa tool vào nó có thể điều chỉnh nhanh và stack hợp lý vì có những command trước khi chạy có thể điều chỉnh thành subtask: true và thêm agent: vàod dó thì có thể biến thành một slash commands chạy bằng task tool delegation thay vì append foreground. Thêm nữa là đối với các slash commands có chứa flags và thêm parsing number hay fields như gsd và parse các references, templates, hay tài liệu khác kèm theo thì hệ thống này vẫn chưa có thể làm được nghiên cứu thêm cách của GSD đang làm khi chạy gsd-plan-phase 11 --skip reseach chẳng hạn nó chỉ xuất phát từ gsd-plan-phase nhưng nó parse các context dạng text dot md theo sau và tự động parse những gì của phase 11 và lựa chọn bỏ qua research chẳng hạn.  Đề nghị route gsd để investigate, research, running advisor và deep research từ cả @.hivemind/STACKS-REFERENCES.md và các gợi ý từ @repo-for-learning-and-synthesis.md  trước khi đưa ra phân tích hay đề xuất gì, tất cả đều thực hiện qua task tool delegation và route gsd>>

---

## Assistant (Build · CrofAI: kimi-k2.6 (precision) · 19.6s)

_Thinking:_

The user is asking in Vietnamese about upgrading the `execute-slash-command` tool/functionality. Let me understand what they're saying:

1. The current `execute-slash-command` implementation is incomplete/missing several features
2. It can't properly switch front-facing agents via TUI before appending slash commands
3. Agents get confused when using `@agent + slash` - it doesn't execute anything
4. It needs TWO mechanisms using OpenCode SDK:
   - Switch to intended agent first, then append slash command (front-facing changes on TUI)
   - Run slash command with predetermined agent, then return to user's selected agent after completion
5. The tool lacks understanding of OpenCode primitives - how they're organized in `.opencode/commands/`, `.opencode/agents/` (both singular and plural forms), project vs global scope, how primitives stack via `$ARGUMENTS`, `agent:` field, `subtask: true/false`
6. When using `execute-slash-command`, the agent should be able to load available agents system (hierarchy, modes like all/primary/subagent), commands and fields for quick adjustment and proper stacking
7. Some commands can have `subtask: true` and `agent:` added to become slash commands running via `task` tool delegation instead of foreground append
8. For slash commands with flags, number parsing, fields like `gsd` - need to understand how GSD parses context like `gsd-plan-phase 11 --skip-research` - it parses text/dot md following and auto-parses phase 11 and skip research
9. Route to GSD for investigate, research, running advisor and deep research from both `.hivemind/STACKS-REFERENCES.md` and `repo-for-learning-and-synthesis.md` before making analysis or suggestions
10. Everything via task tool delegation and route gsd

OK so this is a complex research/investigation task. The user wants me to:
1. First understand the current `execute-slash-command` implementation
2. Research OpenCode SDK for command/agent primitives
3. Research GSD's command parsing approach
4. Investigate the ecosystem repos for patterns
5. Produce a comprehensive analysis and plan

Per the instructions, I need to:
- Respond in Vietnamese (conversation)
- Route to GSD for investigation/research
- Use task tool delegation
- Load relevant skills first

Let me first scope the work and invoke the GSD investigation flow. I should:

1. First load the relevant skills
2. Investigate the current codebase for `execute-slash-command` implementation
3. Research OpenCode SDK for the relevant primitives
4. Research GSD command parsing patterns
5. Research the ecosystem repos mentioned

Let me start by understanding the current state of the codebase and the execute-slash-command implementation.

Actually, according to the system instructions:
- "Route to the appropriate codebase-intelligence skill based on the user's intent"
- The user wants investigation/research on the execute-slash-command functionality
- I should use gsd-map-codebase or similar

But the instructions also say:
- "DO NOT ROUTE any hm-* or hf-* commands, workflows nor agents - they are the subjects of developments - ROUTE everything to gsd-* from commands, agents to workflows, they are the toolings used for development of this harness project"
- "delegation to agents attention: do not use generic agents - use gsd-* agents only"

So I should use GSD agents/tools for this.

Let me think about the approach:

1. First, I need to investigate the current `execute-slash-command` implementation
2. Research the OpenCode SDK for command/agent primitives
3. Research GSD's command parsing
4. Research ecosystem repos
5. Produce a comprehensive analysis

Given the complexity, I should:
1. Load relevant skills
2. Investigate the codebase
3. Delegate research tasks

Let me start by loading skills and then investigating.

Actually, the user's prompt is very long and detailed (>10 lines), so per the rules:
"if users prompt is more than 10 lines, or the response is absurb and short YOU MUST Spawn the sub-agent or many of them to investigate context and make clear before executing anything"

Let me first read the current execute-slash-command implementation, then plan the investigation.

Let me start with a structured approach:

1. Load relevant skills
2. Read current execute-slash-command code
3. Read related files
4. Then delegate research tasks

Let me begin.

**Tool: skill**

**Input:**
```json
{
  "name": "gsd-map-codebase"
}
```

**Output:**
```
<skill_content name="gsd-map-codebase">
# Skill: gsd-map-codebase

<objective>
Analyze existing codebase using parallel gsd-codebase-mapper agents to produce structured codebase documents.

Each mapper agent explores a focus area and **writes documents directly** to `.planning/codebase/`. The orchestrator only receives confirmations, keeping context usage minimal.

Output: .planning/codebase/ folder with 7 structured documents about the codebase state.
</objective>

<execution_context>
@.agent/get-shit-done/workflows/map-codebase.md
</execution_context>

<flags>
- **--fast**: Lightweight scan mode — spawns one mapper agent instead of four. Accepts an optional `--focus` value: `tech`, `arch`, `quality`, `concerns`, or `tech+arch` (default). Faster and lower-context than the full map.
- **--query**: Codebase intelligence query mode. Sub-commands: `query <term>`, `status`, `diff`, `refresh`. Requires intel to be enabled in config (`intel.enabled: true`). Runs inline for query/status/diff; spawns an agent for refresh.
- **(no flag)**: Full parallel map — spawns 4 mapper agents to produce all 7 codebase documents.
</flags>

<context>
Arguments: $ARGUMENTS

Parse the first token of $ARGUMENTS:
- If it is `--fast`: strip the flag, run the scan workflow (passing remaining args including optional --focus).
- If it is `--query`: strip the flag, run the intel workflow (passing remaining args as the subcommand).
- Otherwise: pass all of $ARGUMENTS as focus area to the map-codebase workflow.

**Load project state if exists:**
Check for .planning/STATE.md - loads context if project already initialized

**This command can run:**
- Before /gsd-new-project (brownfield codebases) - creates codebase map first
- After /gsd-new-project (greenfield codebases) - updates codebase map as code evolves
- Anytime to refresh codebase understanding
</context>

<when_to_use>
**Use map-codebase for:**
- Brownfield projects before initialization (understand existing code first)
- Refreshing codebase map after significant changes
- Onboarding to an unfamiliar codebase
- Before major refactoring (understand current state)
- When STATE.md references outdated codebase info

**Skip map-codebase for:**
- Greenfield projects with no code yet (nothing to map)
- Trivial codebases (<5 files)
</when_to_use>

<process>
1. Check if .planning/codebase/ already exists (offer to refresh or skip)
2. Create .planning/codebase/ directory structure
3. Spawn 4 parallel gsd-codebase-mapper agents:
   - Agent 1: tech focus → writes STACK.md, INTEGRATIONS.md
   - Agent 2: arch focus → writes ARCHITECTURE.md, STRUCTURE.md
   - Agent 3: quality focus → writes CONVENTIONS.md, TESTING.md
   - Agent 4: concerns focus → writes CONCERNS.md
4. Wait for agents to complete, collect confirmations (NOT document contents)
5. Verify all 7 documents exist with line counts
6. Commit codebase map
7. Offer next steps (typically: /gsd-new-project or /gsd-plan-phase)
</process>

<success_criteria>
- [ ] .planning/codebase/ directory created
- [ ] All 7 codebase documents written by mapper agents
- [ ] Documents follow template structure
- [ ] Parallel agents completed without errors
- [ ] User knows next steps
</success_criteria>

Base directory for this skill: file:///Users/apple/hivemind-plugin-private/.opencode/skills/gsd-map-codebase
Relative paths in this skill (e.g., scripts/, reference/) are relative to this base directory.
Note: file list is sampled.

<skill_files>

</skill_files>
</skill_content>
```

**Tool: skill**

**Input:**
```json
{
  "name": "hm-l3-research-chain"
}
```

**Output:**
```
<skill_content name="hm-l3-research-chain">
# Skill: hm-l3-research-chain

## Overview

Orchestrate the canonical research pipeline: detect → research → synthesize → artifact. Use when starting research tasks, chaining investigation skills, producing final artifacts from multiple sources, or when research needs to be structured and repeatable. Produces synthesized research outputs with citation tracking and evidence persistence.

## The Iron Law

```
Research without synthesis is hoarding. Synthesis without evidence is hallucination.
Ingestion without caching is repetition.
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

## Constitutional Compliance

### Two-Tier Trust Model

| Tier | Role | Sources | When to Trust |
|------|------|---------|---------------|
| **Validation Tier** (PRIMARY) | Verify truth | Live Context7, Live DeepWiki, Live Exa/Tavily, Live GitMCP, Live Repomix | For API signatures, version-sensitive claims, breaking changes, current behavior |
| **Reference Tier** (SUPPLEMENTARY) | Provide context | Cached source code, Cached API docs, Cached structured docs | For architecture orientation, pattern understanding, historical context, offline research |

### Staleness Severity Scale

| Severity | Age | Action |
|----------|-----|--------|
| CRITICAL | > 24 hours | MUST re-verify via live source before trusting for production decisions |
| HIGH | > 7 days | SHOULD re-verify; cached data acceptable for orientation only |
| STANDARD | > 30 days | Re-verify before finalizing findings |
| LOW | > 90 days | Treat as potentially outdated; note in findings |

### Constitutional Gate Rule

Before any finding is passed from one stage to the next, at least 50% of the findings must cite live (non-cached) sources. If this threshold is not met, the orchestrating agent MUST re-run Stage 2 (Research) with explicit live-source requirements before proceeding to Stage 3 (Synthesize).

### MCP Tool Fallback Chain

`Context7 → Repomix → DeepWiki → GitHub (GitMCP) → Exa → Tavily`

# Research Chain
## The Canonical Chain

```
┌──────────┐     ┌─────────────┐     ┌──────────────┐     ┌───────────┐     ┌──────────┐
│  INGEST  │ ──→ │   DETECT    │ ──→ │   RESEARCH   │ ──→ │ SYNTHESIZE│ ──→ │ ARTIFACT │
│(hm-tech-  │     │(hm-detective)│     │(hm-deep-     │     │(hm-synthesis)│   │ (export) │
│ stack-ingest)│  │             │     │   research)  │     │           │     │          │
└──────────┘     └─────────────┘     └──────────────┘     └───────────┘     └──────────┘
```

### Stage 0: Ingest (hm-tech-stack-ingest)

**Purpose:** Cache third-party repositories, SDK docs, and API references BEFORE researching. Cache **informs the research plan** but does NOT skip stages. This ensures all downstream stages validate against REAL code, not assumptions.

**Constitutional Rule:** Even when cache is fresh, the Validation Tier requires at least one live verification per research session. Cached assets inform DISCOVERY (what to research) but never replace VALIDATION (confirming truth).

```bash
# Check if the target tech stack is already cached
ls references/tech-stacks/<name>/ && cat references/tech-stacks/<name>/metadata.json

# If missing or stale, run the ingestion pipeline
# hm-tech-stack-ingest handles: DETECT → DISCOVER → INGEST → ORGANIZE → INDEX
```

**Output:** Cached tech stack in `references/tech-stacks/<name>/` with TOC.md, metadata.json, api/, docs/, examples/

**Gate:** Cached assets must have valid `metadata.json` with `version`, `source_url`, and `ingest_date`. If the cached version differs from the installed version, re-ingestion must complete before research starts. Cache freshness gates the DISCOVERY process. Validation always requires live sources regardless of cache state.

### Stage 1: Detect (hm-detective)

**Purpose:** Understand what you are looking at before researching.

```bash
# SCAN mode — tech stack detection
# READ mode — targeted file reads
# DEEP mode — comprehensive codebase scan
```

**Output:** `.tech-registry.json` + initial findings

**Gate:** detection output must name scope, search modes used, and any missing/inaccessible areas before research starts.

### Stage 2: Research (hm-deep-research)

**Purpose:** Gather evidence using version-matched documentation and MCP tools.

```bash
# Context7 for API verification
# Tavily for current information
# Repomix for codebase structure
```

**Output:** Structured findings with citations

**Gate:** research output must include source evaluation, contradiction status, and blocked-source notes before synthesis starts.

### Version Validation Gate (Between Stage 2 and Stage 3)

**Before synthesis begins, verify:**
1. All version-sensitive findings (API signatures, package interfaces) match the project's `package.json` versions
2. If any finding references a version that differs from the installed version, flag it as `VERSION-MISMATCH` and re-run the specific research query with the correct version constraint
3. Pass `package.json` version constraints to hm-synthesis as mandatory context

**Re-Verification Record format (consistent with hm-tech-stack-ingest):**
```yaml
claim: <precise API claim being verified>
cache_source: references/tech-stacks/<name>/api/<file>:<line>
live_source: <Context7/Repomix/DeepWiki/GitHub/Exa/Tavily>
live_result: <confirmed/different/does-not-exist>
version_match: <installed version> == <live source version> → <MATCH/MISMATCH>
severity: <CRITICAL/HIGH/STANDARD/LOW>
verified: <date>
verdict: <CONFIRMED | STALE-UPDATE-CACHE | UNVERIFIED>
```

### Stage 3: Synthesize (hm-synthesis)

**Purpose:** Compress findings into actionable artifacts.

```bash
# Compression tiers: Snapshot → Focused → Signature
# Artifact export: markdown, JSON, or plan files
```

**Output:** Final artifact (report, plan, or specification)

**Gate:** synthesis output must include methodology/limitations and link each recommendation to evidence.

**Synthesis Quality Gate (expanded):**
- synthesis output must include methodology/limitations and link each recommendation to evidence
- **Anti-pattern detection scan:** Before producing final artifact, check findings for:
  - Single-source findings (only one tool used → flag as `SINGLE-SOURCE`)
  - Cache-only findings (no live verification → flag as `CACHE-ONLY`)
  - Version-mismatched findings (version differs from installed → flag as `VERSION-MISMATCH`)
  - Contradictory findings without resolution (flag as `UNRESOLVED-CONTRADICTION`)
- **Research Quality Score:** Rate the final artifact:
  - **A:** Multi-source, >80% live verification, all versions match, no contradictions
  - **B:** Multi-source, >50% live verification, most versions match, contradictions resolved
  - **C:** Multi-source but <50% live verification, or minor version mismatches
  - **D:** Single-source dominant, or significant version mismatches, or unresolved contradictions
  - **F:** Cannot verify any findings, or all findings are cache-only, or critical version mismatches

### Stage 4: Artifact + Continuation

**Purpose:** Persist lineage so a later agent can resume without rediscovering the chain.

**Required artifact metadata:**

```yaml
research_chain_id: YYYY-MM-DD-topic-slug
detect_artifact: path-or-summary
research_artifact: path-or-summary
synthesis_artifact: path-or-summary
sources_reviewed: []
blocked_sources: []
contradictions: resolved | unresolved | none
next_action: verify | implement | ask | block
evidence_quality: live | cached | mixed
live_source_ratio: <percentage of findings citing live sources>
research_quality_score: <A/B/C/D/F>
quality_score_rationale: <brief explanation>
```

**Stop rule:** If a required stage artifact is missing, return `BLOCKED` with the missing gate. Do not synthesize or mark complete from partial chain state.

## When to Use the Full Chain

| Situation | Use Chain? |
|-----------|-----------|
| Exploring an unfamiliar codebase | Yes — full chain |
| Verifying a single API signature | No — Context7 only |
| Writing a project specification | Yes — full chain |
| Quick bug investigation | Partial — detect + research, skip synthesis |
| Producing a migration plan | Yes — full chain |

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **The Skipped Detect** | Jumps straight to research without scanning | Always run hm-detective SCAN first |
| **The Hoarder** | Gathers 50 sources but never synthesizes | Cap research time, force synthesis stage |
| **The Single-Source** | Uses only one tool (e.g., only web search) | Use the full MCP matrix |
| **The Orphan Artifact** | Produces artifact but never links to source evidence | Every claim in artifact must cite source |
| **The Ungated Chain** | Starts a later stage while prior stage output is missing | Stop and create the missing stage artifact first |
| **The Unscored Chain** | Completes without assessing research quality | Always compute Research Quality Score at Stage 3 gate |

## Self-Correction

When the chain stalls, produces incomplete artifacts, or skips a required stage, use these correction modes:

### Mode 1: Missing Stage Artifact (a later stage was started without prior stage output)

```
Which stage artifact is missing?
├── Stage 0 (Ingest) output missing → no cache available
│   └── Run `ls references/tech-stacks/` + `cat index.json` to check cache state
├── Stage 1 (Detect) output missing → no .tech-registry.json
│   └── Trigger hm-detective SCAN (Tech Stack) + write .tech-registry.json
├── Stage 2 (Research) output missing → no structured findings
│   └── Trigger hm-deep-research with the original research question
├── Stage 3 (Synthesize) output missing → no compressed artifact
│   └── Trigger hm-synthesis with all prior stage outputs
└── Return BLOCKED with the specific missing gate — do NOT synthesize from partial state.
```

### Mode 2: Stale Cache (ingested assets are out of date)

```
1. Check hm-tech-stack-ingest staleness: compare installed version vs cached version
2. If stale → trigger re-ingestion before any research starts
3. If fresh → proceed with Stage 1
4. If uncertain → flag for hm-tech-stack-ingest verification
```

### Mode 3: Single-Source Research (only one tool used, findings are thin)

```
1. Check the MCP tool matrix: was the right tool used for the research question?
2. If only web search was used → add Context7 for API verification, DeepWiki for architecture
3. If only repomix was used → add Context7 for version-matched docs, Tavily for current info
4. If all tools exhausted → document as limitation, proceed with available evidence
```

### Mode 4: Ungated Chain (anti-pattern: jumping from detect directly to artifact)

```
Self-check:
└── Stage 0 (Ingest) was skipped? → STOP. Ingest before detecting.
└── Stage 1 (Detect) done but Stage 2 (Research) skipped? → STOP. Research before synthesizing.
└── Stage 2 (Research) done but Stage 3 (Synthesize) skipped? → STOP. Synthesize before exporting.
└── Producing an artifact without all prior stage outputs? → STOP. Document missing gates.
```

### Mode 5: Orphan Artifact (artifact created but no source traceability)

```
1. Check: does each claim in the artifact have a source citation?
2. Check: does the artifact have continuation metadata (chain_id, detect_artifact, research_artifact, synthesis_artifact)?
3. If sources are missing → re-run Stage 2 (Research) with traceability requirements
4. If continuation metadata is missing → re-run Stage 4 (Artifact + Continuation) with the full metadata template
```

### Maximum Correction Attempts

3 per chain execution. After 3 correction cycles without passing all gates:
- Document which gates passed and which failed
- Write a chain state report with continuation metadata
- Return BLOCKED with a specific gate failure — do NOT produce a partial artifact

## Reference Map

| File | When to Read |
|------|-------------|
| `references/chain-stages.md` | Detailed stage contracts and handoff formats |
| `references/tool-matrix.md` | Which MCP tool to use for which research question |
| `templates/chain-continuation.md` | Artifact lineage and continuation metadata |

## Cross-References

### Research Chain Position

```
hm-tech-stack-ingest → hm-detective → hm-deep-research → hm-synthesis
    (Stage 0)          (Stage 1)       (Stage 2)          (Stage 3)
         ↑ orchestrated by hm-research-chain (this skill)
                    ↓
              Stage 4: Artifact + Continuation
```

hm-research-chain is the **orchestrator** of the full 5-stage canonical research pipeline: Ingest (Stage 0) → Detect (Stage 1) → Research (Stage 2) → Synthesize (Stage 3) → Artifact + Continuation (Stage 4).

### Downstream Skills (This Skill Orchestrates)

| Related Skill | Boundary |
|---------------|----------|
| `hm-tech-stack-ingest` | Stage 0 — ingestion and caching. This skill triggers hm-tech-stack-ingest BEFORE detection to ensure all downstream stages validate against cached assets. |
| `hm-detective` | Stage 1 — detection and scanning. This skill triggers hm-detective as the first investigation stage. |
| `hm-deep-research` | Stage 2 — evidence gathering. This skill ensures research output includes source evaluation and contradiction handling before synthesis. |
| `hm-synthesis` | Stage 3 — compression and artifact export. This skill triggers hm-synthesis when all prior stage artifacts are ready. |

### Upstream Skills (Feeds Into This Skill)

| Related Skill | Boundary |
|---------------|----------|
| `hm-tech-stack-ingest` | Foundation — provides the cached assets that hm-research-chain validates before starting the research pipeline. Stale cache halts the chain at Stage 0. |

### Boundary Clarification

| Nearby Skill | What hm-research-chain Does | What the Other Skill Does |
|-------------|---------------------------|--------------------------|
| `hm-tech-stack-ingest` | Orchestrates Stage 0 ingestion timing — decides when to ingest before research starts | Downloads, caches, and organizes individual tech stacks as bundled assets |
| `hm-detective` | Calls hm-detective for Stage 1 codebase scanning after cache validation | Performs the actual SCAN/READ/DEEP investigation of the codebase |
| `hm-deep-research` | Calls hm-deep-research for Stage 2 evidence gathering after detection | Conducts version-matched research with MCP tools and citations |
| `hm-synthesis` | Calls hm-synthesis for Stage 3 artifact compression after research | Compresses findings into actionable artifacts with tiered reduction |

Base directory for this skill: file:///Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-research-chain
Relative paths in this skill (e.g., scripts/, reference/) are relative to this base directory.
Note: file list is sampled.

<skill_files>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-research-chain/templates/.gitkeep</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-research-chain/templates/chain-continuation.md</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-research-chain/evals/evals.json</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-research-chain/scripts/validate-skill.sh</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-research-chain/metrics/.gitkeep</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-research-chain/metrics/rich-gate-scorecard.md</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-research-chain/references/chain-stages.md</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-research-chain/references/tool-matrix.md</file>
</skill_files>
</skill_content>
```

**Tool: skill**

**Input:**
```json
{
  "name": "repomix-explorer"
}
```

**Output:**
```
<skill_content name="repomix-explorer">
# Skill: repomix-explorer

You are an expert code analyst specializing in repository exploration using Repomix CLI. Your role is to help users understand codebases by running repomix commands, then reading and analyzing the generated output files.

## User Intent Examples

The user might ask in various ways:

### Remote Repository Analysis
- "Analyze the yamadashy/repomix repository"
- "What's the structure of facebook/react?"
- "Explore https://github.com/microsoft/vscode"
- "Find all TypeScript files in the Next.js repo"
- "Show me the main components of vercel/next.js"

### Local Repository Analysis
- "Analyze this codebase"
- "Explore the ./src directory"
- "What's in this project?"
- "Find all configuration files in the current directory"
- "Show me the structure of ~/projects/my-app"

### Pattern Discovery
- "Find all authentication-related code"
- "Show me all React components"
- "Where are the API endpoints defined?"
- "Find all database models"
- "Show me error handling code"

### Metrics and Statistics
- "How many files are in this project?"
- "What's the token count?"
- "Show me the largest files"
- "How much TypeScript vs JavaScript?"

## Your Responsibilities

1. **Understand the user's intent** from natural language
2. **Determine the appropriate repomix command**:
   - Remote repository: `npx repomix@latest --remote <repo>`
   - Local directory: `npx repomix@latest [directory]`
   - Choose output format (xml is default and recommended)
   - Decide if compression is needed (for repos >100k lines)
3. **Execute the repomix command** via shell
4. **Analyze the generated output** using pattern search and file reading
5. **Provide clear insights** with actionable recommendations

## Workflow

### Step 1: Pack the Repository

**For Remote Repositories:**
```bash
npx repomix@latest --remote <repo> --output /tmp/<repo-name>-analysis.xml
```

**IMPORTANT**: Always output to `/tmp` for remote repositories to avoid polluting the user's current project directory.

**For Local Directories:**
```bash
npx repomix@latest [directory] [options]
```

**Common Options:**
- `--style <format>`: Output format (xml, markdown, json, plain) - **xml is default and recommended**
- `--compress`: Enable Tree-sitter compression (~70% token reduction) - use for large repos
- `--include <patterns>`: Include only matching patterns (e.g., "src/**/*.ts,**/*.md")
- `--ignore <patterns>`: Additional ignore patterns
- `--output <path>`: Custom output path (default: repomix-output.xml)
- `--remote-branch <name>`: Specific branch, tag, or commit to use (for remote repos)

**Command Examples:**
```bash
# Basic remote pack (always use /tmp)
npx repomix@latest --remote yamadashy/repomix --output /tmp/repomix-analysis.xml

# Basic local pack
npx repomix@latest

# Pack specific directory
npx repomix@latest ./src

# Large repo with compression (use /tmp)
npx repomix@latest --remote facebook/react --compress --output /tmp/react-analysis.xml

# Include only specific file types
npx repomix@latest --include "**/*.{ts,tsx,js,jsx}"
```

### Step 2: Check Command Output

The repomix command will display:
- **Files processed**: Number of files included
- **Total characters**: Size of content
- **Total tokens**: Estimated AI tokens
- **Output file location**: Where the file was saved (default: `./repomix-output.xml`)

Always note the output file location for the next steps.

### Step 3: Analyze the Output File

**Start with structure overview:**
1. Search for file tree section (usually near the beginning)
2. Check metrics summary for overall statistics

**Search for patterns:**
```bash
# Pattern search (preferred for large files)
grep -iE "export.*function|export.*class" repomix-output.xml

# Search with context
grep -iE -A 5 -B 5 "authentication|auth" repomix-output.xml
```

**Read specific sections:**
Read files with offset/limit for large outputs, or read entire file if small.

### Step 4: Provide Insights

- **Report metrics**: Files, tokens, size from command output
- **Describe structure**: From file tree analysis
- **Highlight findings**: Based on grep results
- **Suggest next steps**: Areas to explore further

## Best Practices

### Efficiency
1. **Always use `--compress` for large repos** (>100k lines)
2. **Use pattern search (grep) first** before reading entire files
3. **Use custom output paths** when analyzing multiple repos to avoid overwriting
4. **Clean up output files** after analysis if they're very large

### Output Format
- **XML (default)**: Best for structured analysis, clear file boundaries
- **Plain**: Simpler to grep, but less structured
- **Markdown**: Human-readable, good for documentation
- **JSON**: Machine-readable, good for programmatic analysis

**Recommendation**: Stick with XML unless user requests otherwise.

### Search Patterns
Common useful patterns:
```bash
# Functions and classes
grep -iE "export.*function|export.*class|function |class " file.xml

# Imports and dependencies
grep -iE "import.*from|require\\(" file.xml

# Configuration
grep -iE "config|Config|configuration" file.xml

# Authentication/Authorization
grep -iE "auth|login|password|token|jwt" file.xml

# API endpoints
grep -iE "router|route|endpoint|api" file.xml

# Database/Models
grep -iE "model|schema|database|query" file.xml

# Error handling
grep -iE "error|exception|try.*catch" file.xml
```

### File Management
- Default output: `./repomix-output.xml`
- Use `--output` flag for custom paths
- Clean up large files after analysis: `rm repomix-output.xml`
- Or keep for future reference if space allows

## Communication Style

- **Be concise but comprehensive**: Summarize findings clearly
- **Use clear technical language**: Code, file paths, commands should be precise
- **Cite sources**: Reference file paths and line numbers
- **Suggest next steps**: Guide further exploration

## Example Workflows

### Example 1: Basic Remote Repository Analysis
```text
User: "Analyze the yamadashy/repomix repository"

Your workflow:
1. Run: npx repomix@latest --remote yamadashy/repomix --output /tmp/repomix-analysis.xml
2. Note the metrics from command output (files, tokens)
3. Grep: grep -i "export" /tmp/repomix-analysis.xml (find main exports)
4. Read file tree section to understand structure
5. Summarize:
   "This repository contains [number] files.
   Main components include: [list].
   Total tokens: approximately [number]."
```

### Example 2: Finding Specific Patterns
```text
User: "Find authentication code in this repository"

Your workflow:
1. Run: npx repomix@latest (or --remote if specified)
2. Grep: grep -iE -A 5 -B 5 "auth|authentication|login|password" repomix-output.xml
3. Analyze matches and categorize by file
4. Read the file to get more context if needed
5. Report:
   "Authentication-related code found in the following files:
   - [file1]: [description]
   - [file2]: [description]"
```

### Example 3: Structure Analysis
```text
User: "Explain the structure of this project"

Your workflow:
1. Run: npx repomix@latest ./
2. Read file tree from output (use limit if file is large)
3. Grep for main entry points: grep -iE "index|main|app" repomix-output.xml
4. Grep for exports: grep "export" repomix-output.xml | head -20
5. Provide structural overview with ASCII diagram if helpful
```

### Example 4: Large Repository with Compression
```text
User: "Analyze facebook/react - it's a large repository"

Your workflow:
1. Run: npx repomix@latest --remote facebook/react --compress --output /tmp/react-analysis.xml
2. Note compression reduced token count (~70% reduction)
3. Check metrics and file tree
4. Grep for main components
5. Report findings with note about compression used
```

### Example 5: Specific File Types Only
```text
User: "I want to see only TypeScript files"

Your workflow:
1. Run: npx repomix@latest --include "**/*.{ts,tsx}"
2. Analyze TypeScript-specific patterns
3. Report findings focused on TS code
```

## Error Handling

If you encounter issues:

1. **Command fails**:
   - Check error message
   - Verify repository URL/path
   - Check permissions
   - Suggest appropriate solutions

2. **Large output file**:
   - Use `--compress` flag
   - Use `--include` to narrow scope
   - Read file in chunks with offset/limit

3. **Pattern not found**:
   - Try alternative patterns
   - Check file tree to verify files exist
   - Suggest broader search

4. **Network issues** (for remote):
   - Verify connection
   - Try again
   - Suggest using local clone instead

## Help and Documentation

If you need more information:
- Run `npx repomix@latest --help` to see all available options
- Check the official documentation at https://github.com/yamadashy/repomix
- Repomix automatically excludes sensitive files based on security checks

## Important Notes

1. **Output file management**: Track where files are created, clean up if needed
2. **Token efficiency**: Use `--compress` for large repos to reduce token usage
3. **Incremental analysis**: Don't read entire files at once; use grep first
4. **Security**: Repomix automatically excludes sensitive files; trust its security checks

## Self-Verification Checklist

Before completing your analysis:

- Did you run the repomix command successfully?
- Did you note the metrics from command output?
- Did you use pattern search (grep) efficiently before reading large sections?
- Are your insights based on actual data from the output?
- Have you provided file paths and line numbers for references?
- Did you suggest logical next steps for deeper exploration?
- Did you communicate clearly and concisely?
- Did you note the output file location for user reference?
- Did you clean up or mention cleanup if output file is very large?

Remember: Your goal is to make repository exploration intelligent and efficient. Run repomix strategically, search before reading, and provide actionable insights based on real code analysis.

Base directory for this skill: file:///Users/apple/.agents/skills/repomix-explorer
Relative paths in this skill (e.g., scripts/, reference/) are relative to this base directory.
Note: file list is sampled.

<skill_files>

</skill_files>
</skill_content>
```

---

## Assistant (Build · CrofAI: kimi-k2.6 (precision) · 8.1s)

_Thinking:_

Now I have the skills loaded. Let me start the investigation process. The user wants me to:

1. Investigate the current `execute-slash-command` implementation
2. Research OpenCode SDK for command/agent primitives
3. Research GSD command parsing patterns
4. Research ecosystem repos for patterns
5. Produce comprehensive analysis

Let me start by:
1. Reading the current `execute-slash-command` tool implementation
2. Reading the related files for commands, agents structure
3. Looking at GSD command parsing patterns
4. Reading the OpenCode SDK reference for command/agent primitives

Let me investigate in parallel where possible.

**Tool: todowrite**

**Input:**
```json
{
  "todos": [
    {
      "content": "Đọc implementation hiện tại của execute-slash-command tool",
      "status": "in_progress",
      "priority": "high"
    },
    {
      "content": "Khảo sát cấu trúc .opencode/commands và .opencode/agents",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "Nghiên cứu OpenCode SDK về command/agent primitives qua Context7",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "Nghiên cứu GSD command parsing patterns",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "Nghiên cứu ecosystem repos (opencode-pty, background-agents, awesome-opencode)",
      "status": "pending",
      "priority": "medium"
    },
    {
      "content": "Delegate task research tổng hợp và phân tích gaps",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "Tổng hợp báo cáo và đề xuất giải pháp",
      "status": "pending",
      "priority": "high"
    }
  ]
}
```

**Output:**
```
[
  {
    "content": "Đọc implementation hiện tại của execute-slash-command tool",
    "status": "in_progress",
    "priority": "high"
  },
  {
    "content": "Khảo sát cấu trúc .opencode/commands và .opencode/agents",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Nghiên cứu OpenCode SDK về command/agent primitives qua Context7",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Nghiên cứu GSD command parsing patterns",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Nghiên cứu ecosystem repos (opencode-pty, background-agents, awesome-opencode)",
    "status": "pending",
    "priority": "medium"
  },
  {
    "content": "Delegate task research tổng hợp và phân tích gaps",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Tổng hợp báo cáo và đề xuất giải pháp",
    "status": "pending",
    "priority": "high"
  }
]
```

---

## Assistant (Build · CrofAI: kimi-k2.6 (precision) · 6.0s)

_Thinking:_

Let me start reading the current implementation of execute-slash-command tool and related files.

Để bắt đầu investigation một cách methodical, tôi cần đọc implementation hiện tại của `execute-slash-command` và các file liên quan trước.

**Tool: glob**

**Input:**
```json
{
  "pattern": "**/execute-slash-command*"
}
```

**Output:**
```
/Users/apple/hivemind-plugin-private/tests/tools/execute-slash-command.test.ts
/Users/apple/hivemind-plugin-private/src/tools/session/execute-slash-command.ts
```

**Tool: glob**

**Input:**
```json
{
  "pattern": "**/execute-slash*"
}
```

**Output:**
```
/Users/apple/hivemind-plugin-private/tests/tools/execute-slash-command.test.ts
/Users/apple/hivemind-plugin-private/src/tools/session/execute-slash-command.ts
```

**Tool: grep**

**Input:**
```json
{
  "pattern": "execute-slash-command",
  "include": "*.ts"
}
```

**Output:**
```
Found 13 matches
/Users/apple/hivemind-plugin-private/src/plugin.ts:
  Line 48: import { createExecuteSlashCommandTool } from "./tools/session/execute-slash-command.js"

  Line 408:       "execute-slash-command": createExecuteSlashCommandTool(client),


/Users/apple/hivemind-plugin-private/tests/tools/execute-slash-command.test.ts:
  Line 2: import { createExecuteSlashCommandTool } from "../../src/tools/session/execute-slash-command.js"

  Line 5: describe("execute-slash-command tool", () => {


/Users/apple/hivemind-plugin-private/src/tools/session/execute-slash-command.ts:
  Line 5:  * Creates the execute-slash-command tool.

  Line 31:  * execute-slash-command { command: "gsd-stats", arguments: "" }

  Line 34:  * execute-slash-command { command: "hf-create", arguments: "skill my-new-skill" }

  Line 37:  * execute-slash-command { command: "deep-research-synthesis-repomix", arguments: "vitest", agent: "hm-researcher" }

  Line 40:  * execute-slash-command { command: "plan", arguments: "refactor auth module", model: "anthropic/claude-sonnet-4-20250514" }

  Line 47:  * @returns ToolDefinition for the execute-slash-command tool.


/Users/apple/hivemind-plugin-private/src/tools/hivemind/hivemind-command-engine.ts:
  Line 18:  * This is the read-side companion to `execute-slash-command` (write-side).

  Line 23:  * @see src/tools/session/execute-slash-command.ts — write-side companion (deterministic SDK dispatch)

  Line 32:       "This is the read-side of command management — use `execute-slash-command` to actually dispatch a command.",

```

---

## Assistant (Build · CrofAI: kimi-k2.6 (precision) · 6.0s)

_Thinking:_

Let me read the current implementation files.

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/tools/session/execute-slash-command.ts"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin-private/src/tools/session/execute-slash-command.ts</path>
<type>file</type>
<content>
1: import { tool } from "@opencode-ai/plugin"
2: import type { PluginInput, ToolDefinition } from "@opencode-ai/plugin"
3: 
4: /**
5:  * Creates the execute-slash-command tool.
6:  *
7:  * This tool allows an agent to programmatically dispatch a slash command
8:  * (e.g., built-in commands or custom `.opencode/commands/*.md` commands)
9:  * to the active session via the TUI prompt pipeline.
10:  *
11:  * ## Why TUI path instead of `session.command()`?
12:  *
13:  * `session.command()` calls `SessionPrompt.prompt()` internally, which
14:  * **blocks** until the LLM completes. But since this tool is called
15:  * *during* an active LLM loop, `SessionRunState.ensureRunning()` detects
16:  * the session is busy and **queues** the command — it never executes
17:  * immediately.
18:  *
19:  * The TUI path (`appendPrompt` + `submitPrompt`) bypasses this by
20:  * injecting the command text into the TUI prompt buffer, which the TUI
21:  * processes as a slash command *after* the current tool call returns.
22:  * This results in immediate execution once the current turn completes.
23:  *
24:  * **SDK contract** (TUI pipeline):
25:  * - `tui.appendPrompt({ body: { text } })` — injects `/<command> <args>` into the TUI prompt
26:  * - `tui.submitPrompt()` — submits the prompt, triggering slash command dispatch
27:  *
28:  * @example
29:  * ```
30:  * // Basic command execution
31:  * execute-slash-command { command: "gsd-stats", arguments: "" }
32:  *
33:  * // Command with arguments
34:  * execute-slash-command { command: "hf-create", arguments: "skill my-new-skill" }
35:  *
36:  * // Command with agent context override
37:  * execute-slash-command { command: "deep-research-synthesis-repomix", arguments: "vitest", agent: "hm-researcher" }
38:  *
39:  * // Command with model override
40:  * execute-slash-command { command: "plan", arguments: "refactor auth module", model: "anthropic/claude-sonnet-4-20250514" }
41:  * ```
42:  *
43:  * @see src/tools/hivemind/hivemind-command-engine.ts — discovery companion (CQRS read-side)
44:  * @see src/routing/command-engine/index.ts — command engine core
45:  *
46:  * @param client - The OpenCode SDK client instance (injected from plugin composition root).
47:  * @returns ToolDefinition for the execute-slash-command tool.
48:  */
49: export const createExecuteSlashCommandTool = (client: PluginInput["client"]): ToolDefinition => {
50:   return tool({
51:     description:
52:       "Executes an OpenCode slash command on the active session. This is equivalent to a user typing '/command args' in the TUI. " +
53:       "Dispatches via the TUI prompt pipeline for immediate execution — NOT the blocking session.command() path. " +
54:       "Use `hivemind-command-engine` with action `discover` or `list_commands` to find available commands first.",
55:     args: {
56:       command: tool.schema.string().describe(
57:         "The command name without the leading slash (e.g., 'gsd-stats', 'hf-create', 'plan')",
58:       ),
59:       arguments: tool.schema.string().optional().describe(
60:         "Arguments string to pass to the command (e.g., 'my-new-skill'). Defaults to empty string.",
61:       ),
62:       agent: tool.schema.string().optional().describe(
63:         "Optional agent context override. When set, the agent is prepended as '@agent' before the command " +
64:         "(e.g., '@hm-researcher /deep-research-synthesis-repomix vitest').",
65:       ),
66:       model: tool.schema.string().optional().describe(
67:         "Optional model override in 'providerID/modelID' format (e.g., 'anthropic/claude-sonnet-4-20250514'). " +
68:         "When set, prepended as a model tag in the prompt text.",
69:       ),
70:     },
71:     async execute(args, ctx) {
72:       const cmdDisplay = `/${args.command}${args.arguments ? ` ${args.arguments}` : ""}`
73:       ctx.metadata({
74:         title: `Executing ${cmdDisplay}`,
75:         metadata: {
76:           command: args.command,
77:           ...(args.agent && { agent: args.agent }),
78:           ...(args.model && { model: args.model }),
79:         },
80:       })
81: 
82:       try {
83:         // Build the slash command text exactly as a user would type it in the TUI
84:         // Format: [@agent] [/command] [arguments]
85:         const parts: string[] = []
86: 
87:         // Prepend agent override if specified
88:         if (args.agent) {
89:           parts.push(`@${args.agent}`)
90:         }
91: 
92:         // The command itself
93:         parts.push(`/${args.command}`)
94: 
95:         // Append arguments if any
96:         if (args.arguments) {
97:           parts.push(args.arguments)
98:         }
99: 
100:         const promptText = parts.join(" ")
101: 
102:         // Step 1: Clear any existing prompt to avoid stale state
103:         await client.tui.clearPrompt()
104: 
105:         // Step 2: Append the slash command text to the TUI prompt buffer
106:         await client.tui.appendPrompt({
107:           body: { text: promptText },
108:         })
109: 
110:         // Step 3: Submit the prompt — TUI dispatches as a slash command
111:         await client.tui.submitPrompt()
112: 
113:         return {
114:           output: [
115:             `✓ Command ${cmdDisplay} dispatched to TUI prompt.`,
116:             `  Prompt text: ${promptText}`,
117:             `  The command will execute immediately after this tool call returns.`,
118:             args.agent ? `  Agent: ${args.agent}` : null,
119:             args.model ? `  Model: ${args.model}` : null,
120:           ].filter(Boolean).join("\n"),
121:           metadata: {
122:             command: args.command,
123:             promptText,
124:             dispatched: true,
125:             ...(args.agent && { agent: args.agent }),
126:             ...(args.model && { model: args.model }),
127:           },
128:         }
129:       } catch (error: unknown) {
130:         const msg = error instanceof Error ? error.message : String(error)
131: 
132:         // Classify error type for better agent error handling
133:         let errorType: "bad_request" | "not_found" | "internal" = "internal"
134:         if (error instanceof Error) {
135:           const statusMatch = msg.match(/\b(400|422)\b/)
136:           if (statusMatch) errorType = "bad_request"
137:           else if (msg.includes("404") || msg.includes("not found")) errorType = "not_found"
138:         }
139: 
140:         return {
141:           output: `✗ Failed to dispatch ${cmdDisplay}: ${msg}`,
142:           metadata: {
143:             error: true,
144:             errorType,
145:             command: args.command,
146:             message: msg,
147:           },
148:         }
149:       }
150:     },
151:   })
152: }

(End of file - total 152 lines)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin-private/src/tools/session/AGENTS.md
# Session Tools Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/tools/session/` owns bounded session patching and journal export surfaces. `session-patch/` provides session state modification through validated inputs. `session-journal-export.ts` exports append-only journal evidence. These tools preserve state-root separation and use shared response envelopes. Source evidence: `.planning/codebase/ARCHITECTURE.md:87-113`, `.planning/codebase/STRUCTURE.md:104-108`.

Key tools: `session-patch/index.ts` (multi-file, state modification), `session-journal-export.ts` (single-file, read-only export). Architecture: `.planning/codebase/ARCHITECTURE.md:87-113`. Classification: Hard Harness — write-side tools. Session state lives in `.hivemind/`, never `.opencode/`.

## 2. Allowed mutation authority

- Tools may parse input via Zod schemas and render standardized responses with `src/shared/`.
- Tools may call session API wrappers and task-management modules when the tool contract requires it.
- Tools may write session state through approved `.hivemind/` state owners. Source evidence: `.planning/codebase/ARCHITECTURE.md:339-353`.

## 3. Forbidden mutations / explicit no-go boundaries

- Tools SHALL NOT bypass schema validation for agent-provided input.
- Tools SHALL NOT write internal runtime state into `.opencode/`; state writes go through `.hivemind/` owners. Source evidence: `.planning/codebase/ARCHITECTURE.md:247-255`.
- Tools SHALL NOT register themselves; `src/plugin.ts` owns registration. Source evidence: `.planning/codebase/STRUCTURE.md:221-224`.
- Tools SHALL NOT claim integration readiness from mocked/unit-only proof.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| Agents and commands | Invoke session tools during workflows | Must pass schema-valid inputs |
| `src/task-management/` | Owns session state and journal logic | Tools call task-management; tools do not duplicate logic |
| `src/shared/` | Provides response envelope rendering | Shared stays leaf |
| Tests | Validate session patching and journal export | Integration claims require integration evidence |

## 5. Naming and placement conventions

- Multi-file tools use subdirectories: `src/tools/session/session-patch/index.ts`. Source evidence: `.planning/codebase/STRUCTURE.md:221-224`.
- Single-file tools: `session-journal-export.ts`.
- Schemas belong in `src/schema-kernel/` when validation is needed.
- Tests live under `tests/tools/session/`. Source evidence: `.planning/codebase/TESTING.md:52-64`.

## 6. Quality gates and evidence expectations

- Code changes require `npm run typecheck` and scoped tool tests. Source evidence: `.planning/codebase/TESTING.md:41-48`.
- Mutation claims require evidence of the intended state surface.
- Docs-only edits remain L5 evidence. Source evidence: `.planning/ROADMAP.md:47-49`.


Instructions from: /Users/apple/hivemind-plugin-private/src/tools/AGENTS.md
# Tools Sector Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/tools/` is the Hard Harness write-side sector. Tool implementations expose validated OpenCode tool commands for delegation, status polling, background commands, prompt enhancement, primitive configuration, trajectory, pressure, SDK supervision, command engine, and agent work contracts. Source evidence: `.planning/codebase/ARCHITECTURE.md:87-113`, `.planning/codebase/STRUCTURE.md:104-108`.

Source architecture: `.planning/codebase/ARCHITECTURE.md:87-113` — CQRS write-side mutation authority. Tools call `src/task-management/`, `src/coordination/`, `src/features/` for durable operations. Soft Meta-Concepts (`.opencode/`) configure tool behavior via agent/command/skill primitives; `.opencode/` NEVER owns tool business logic or runtime state.

## 2. Allowed mutation authority

- Tools are the CQRS mutation authority for runtime operations and may write through approved library state owners. Evidence: `.planning/codebase/ARCHITECTURE.md:72-80`, `.planning/codebase/ARCHITECTURE.md:339-353`.
- Tools may parse input via Zod schemas and render standardized responses with `src/shared/`. Evidence: `.planning/codebase/ARCHITECTURE.md:87-113`, `.planning/codebase/ARCHITECTURE.md:295-300`.
- Tools may call OpenCode SDK wrappers, delegation managers, state owners, config workflow, and schema validators when the tool contract explicitly requires it. Evidence: `.planning/codebase/ARCHITECTURE.md:273-285`.

## 3. Forbidden mutations / explicit no-go boundaries

- Tools SHALL NOT bypass schema validation for external or agent-provided input.
- Tools SHALL NOT write internal runtime state into `.opencode/`; state writes go through `.hivemind/` owners. Evidence: `.planning/codebase/ARCHITECTURE.md:247-255`, `.planning/codebase/ARCHITECTURE.md:351-353`.
- Tools SHALL NOT register themselves directly in arbitrary files; `src/plugin.ts` owns registration. Evidence: `.planning/codebase/STRUCTURE.md:221-224`.
- Tools SHALL NOT claim completion, integration, or runtime readiness from mocked/unit-only proof when the claim is about OpenCode integration.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| Agents and commands | Invoke tool contracts during workflows | Must pass schema-valid inputs |
| `src/plugin.ts` | Registers tool definitions with OpenCode | Does not embed tool business logic |
| `src/task-management/`, `src/coordination/`, `src/features/` owners | Perform durable state, lifecycle, SDK, and orchestration logic | Tools call them; tools do not duplicate deep logic |
| `src/shared/` | Provides response envelope rendering | Shared stays leaf |
| Tests/gates | Verify validation, outputs, and side effects | Integration claims require integration evidence |

## 5. Naming and placement conventions

- Single-file tools live at `src/tools/{tool-name}.ts`; multi-file tools live at `src/tools/{tool-name}/index.ts`. Evidence: `.planning/codebase/STRUCTURE.md:221-224`.
- Add or update schemas in `src/schema-kernel/{tool-name}.schema.ts` when validation is needed. Evidence: `.planning/codebase/STRUCTURE.md:221-224`, `.planning/codebase/STRUCTURE.md:237-240`.
- Tool tests live under `tests/tools/{tool-name}.test.ts` and mirror the source contract. Evidence: `.planning/codebase/STRUCTURE.md:221-224`, `.planning/codebase/TESTING.md:52-64`.
- Tool output must use the shared envelope rather than bespoke response shapes. Evidence: `.planning/codebase/ARCHITECTURE.md:334-337`.

## 6. Quality gates and evidence expectations

- Code changes require `npm run typecheck` and scoped tool tests; run broader `npm test` when touching shared contracts or state owners. Evidence: `.planning/codebase/TESTING.md:41-48`.
- Mutation claims require evidence of the intended state surface and proof that `.opencode/` was not used for internal state.
- Docs-only edits to this file are L5 evidence and must not be used to claim runtime readiness. Evidence: `.planning/ROADMAP.md:47-49`.


Instructions from: /Users/apple/hivemind-plugin-private/src/AGENTS.md
# Hard Harness Sector Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/` is the Hard Harness npm package source for the OpenCode runtime composition engine: `src/plugin.ts` assembles dependencies, tools expose write-side commands, hooks observe read-side events, `src/task-management/`, `src/coordination/`, `src/features/`, `src/config/`, `src/routing/` own runtime logic, `src/schema-kernel/` owns validation contracts, and `src/shared/` owns leaf tool utilities. Source evidence: `.planning/codebase/ARCHITECTURE.md:38-45`, `.planning/codebase/ARCHITECTURE.md:48-68`, `.planning/codebase/STRUCTURE.md:88-118`. Source-plane ownership model: `.planning/architecture/hivemind-source-plane-architecture-2026-05-07.md` — defines the split between Hard Harness (`src/`), Soft Meta-Concepts (`.opencode/`), and Internal State (`.hivemind/`).

## 2. Allowed mutation authority

- `src/plugin.ts` may wire runtime dependencies, instantiate hooks, register tools, and load runtime policy; keep business logic in `src/task-management/`, `src/coordination/`, `src/features/`, `src/config/`, `src/routing/`, tools, hooks, or schemas. Evidence: `.planning/codebase/ARCHITECTURE.md:48-50`, `.planning/codebase/ARCHITECTURE.md:70-82`.
- `src/tools/` owns write-side tool entrypoints and may call `src/task-management/`, `src/coordination/`, `src/features/`, `src/schema-kernel/`, and `src/shared/` to perform validated mutations. Evidence: `.planning/codebase/ARCHITECTURE.md:87-113`.
- `src/hooks/` owns read-side observers, response shaping, and guard decisions, subject to the CQRS hook boundary. Evidence: `.planning/codebase/ARCHITECTURE.md:115-134`, `.planning/codebase/ARCHITECTURE.md:339-353`.
- `src/task-management/` owns continuity, journal, event tracker, recovery, trajectory, and lifecycle modules.
- `src/coordination/` owns delegation, completion, concurrency, SDK/command delegation, and spawner modules.
- `src/features/` owns standalone runtime features: bootstrap, PTY/background command, doc intelligence, prompt packets, pressure, SDK supervisor, and work contracts.
- `src/config/` owns config subscriber, compiler, and workflow modules.
- `src/routing/` owns session entry, behavioral profile, and command engine modules.
Evidence: `.planning/codebase/ARCHITECTURE.md:136-183`.
- `src/schema-kernel/` owns Zod validation schemas; `src/shared/` owns leaf utility surfaces used by tools. Evidence: `.planning/codebase/ARCHITECTURE.md:188-200`.

## 3. Forbidden mutations / explicit no-go boundaries

- Do not store internal runtime state in `.opencode/`; `.hivemind/` is canonical state root. Evidence: `.planning/codebase/ARCHITECTURE.md:247-255`, `.planning/codebase/ARCHITECTURE.md:351-353`.
- Do not authorize hooks to perform durable writes; only tools have CQRS mutation authority. Evidence: `.planning/codebase/ARCHITECTURE.md:339-353`.
- Do not move business logic into `src/plugin.ts`; it is a thin composition root. Evidence: `.planning/codebase/ARCHITECTURE.md:70-82`.
- Do not create `src/plugin/`, `src/config/`, or broad `src/features/` folders without a separate, source-backed architecture decision. `src/config/` and `src/features/` are authorized by `.planning/architecture/sr-remediation-architecture-decision-2026-05-08.md`; `src/plugin.ts` remains the plugin authority and `src/plugin/` is still not authorized.
- Do not exceed the 500 LOC module cap or introduce circular imports. Evidence: `.planning/codebase/ARCHITECTURE.md:345-353`, `.planning/codebase/CONVENTIONS.md:19-28`.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| OpenCode runtime | Loads the plugin, tools, hooks, and SDK-facing wrappers | Must consume compiled/package entrypoints, not planning artifacts |
| Harness tools | Execute mutation commands through validated inputs | Must use schemas and shared response envelopes |
| Harness hooks | Observe events and shape/guard responses | Must not perform durable writes |
| Tests and gates | Verify runtime behavior, type safety, and integration boundaries | Docs-only changes remain L5 evidence |
| `.opencode/` primitives | Configure agents/commands/skills that call harness tools | Must not become internal state owners |

## 5. Naming and placement conventions

- TypeScript source files use `kebab-case.ts`; schemas use `kebab-case.schema.ts`; tests mirror source with `.test.ts`. Evidence: `.planning/codebase/STRUCTURE.md:186-195`.
- Tool implementations live in `src/tools/{tool-name}.ts` or `src/tools/{tool-name}/index.ts`; schemas live in `src/schema-kernel/{tool-name}.schema.ts`; tests live under `tests/`. Evidence: `.planning/codebase/STRUCTURE.md:218-261`.
- Empty reserved folders must be registered with `.gitkeep`; do not create unregistered broad folders. Evidence: `.planning/codebase/STRUCTURE.md:268-278`.
- TypeScript remains strict ESM with `.js` import extensions and `import type` for type-only imports. Evidence: `.planning/codebase/CONVENTIONS.md:5-18`, `.planning/codebase/CONVENTIONS.md:80-98`.

## 6. Quality gates and evidence expectations

- For runtime code changes, minimum local evidence is `npm run typecheck`, relevant `npx vitest run ...`, and `npm test` or scoped justification; docs-only changes may use diff/path inspection only. Evidence: `.planning/codebase/TESTING.md:41-48`.
- Integration readiness cannot be claimed from unit tests or docs-only evidence; O3 docs artifacts are L5 until authorized runtime proof exists. Evidence: `.planning/ROADMAP.md:29-49`, `.planning/architecture/sector-agents-docs-implementation-plan-2026-05-07.md:1-8`.
- Completion claims must preserve CQRS, state-root, lineage, naming, and module-size constraints. Evidence: `.planning/codebase/ARCHITECTURE.md:339-353`, `.planning/codebase/CONVENTIONS.md:19-28`.

## 7. Cross-sector alignment

`.opencode/` is the Soft Meta-Concepts sector — NEVER treated as development assets or implementation source. Skills, agents, and commands in `.opencode/` CONFIGURE runtime behavior from outside the npm package. They contain no business logic, no state persistence, and no compiled code.

- **OMO Adaptation:** Per `.planning/research/omo-adaptation-architecture-2026-05-07.md`, factory injection patterns, CQRS boundaries, and staged initialization are ADAPTED from OMO where they align with Hivemind surfaces. OMO folder roots (`.sisyphus`, `.omx`) are REJECTED.
- **State root:** `.hivemind/` is the canonical deep module persistence root per `.planning/architecture/hivemind-runtime-identity-taxonomy-2026-05-07.md`. No internal runtime state may be stored in `.opencode/` or `src/` without going through `.hivemind/` authority surfaces.
- **Hard Harness = `src/`:** This sector contains compiled TypeScript that ships in the npm package. Soft Meta-Concepts = `.opencode/`: user-configurable primitives. Internal State = `.hivemind/`: runtime journals, delegation records, event tracker, lineage.

</system-reminder>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/tests/tools/execute-slash-command.test.ts"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin-private/tests/tools/execute-slash-command.test.ts</path>
<type>file</type>
<content>
1: import { describe, it, expect, vi } from "vitest"
2: import { createExecuteSlashCommandTool } from "../../src/tools/session/execute-slash-command.js"
3: import type { PluginInput } from "@opencode-ai/plugin"
4: 
5: describe("execute-slash-command tool", () => {
6:   it("should successfully dispatch through the OpenCode TUI prompt pipeline", async () => {
7:     const clearPromptMock = vi.fn(async () => undefined)
8:     const appendPromptMock = vi.fn(async () => undefined)
9:     const submitPromptMock = vi.fn(async () => undefined)
10:     
11:     const client = {
12:       tui: {
13:         clearPrompt: clearPromptMock,
14:         appendPrompt: appendPromptMock,
15:         submitPrompt: submitPromptMock,
16:       },
17:     } as unknown as PluginInput["client"]
18: 
19:     const executeSlashCommandTool = createExecuteSlashCommandTool(client)
20: 
21:     // Mock ToolContext
22:     const metadataMock = vi.fn()
23:     const ctx = {
24:       sessionID: "ses_abc123",
25:       agent: "hm-operator",
26:       metadata: metadataMock,
27:       directory: "/fake/dir",
28:       worktree: "/fake/worktree",
29:       abort: new AbortController().signal,
30:       ask: vi.fn(),
31:       messageID: "msg_abc"
32:     } as any
33: 
34:     const args = {
35:       command: "test-echo",
36:       arguments: "hello world"
37:     }
38: 
39:     const result = await executeSlashCommandTool.execute(args, ctx)
40: 
41:     // Verify the architectural boundary: tool uses the non-blocking TUI pipeline.
42:     expect(clearPromptMock).toHaveBeenCalledOnce()
43:     expect(appendPromptMock).toHaveBeenCalledWith({
44:       body: { text: "/test-echo hello world" },
45:     })
46:     expect(submitPromptMock).toHaveBeenCalledOnce()
47: 
48:     // Verify successful return format
49:     expect(result).toMatchObject({
50:       metadata: { command: "test-echo", dispatched: true, promptText: "/test-echo hello world" },
51:     })
52:     expect(result.output).toContain("Command /test-echo hello world dispatched to TUI prompt")
53: 
54:     // Verify UI metadata was emitted
55:     expect(metadataMock).toHaveBeenCalledWith(expect.objectContaining({ title: "Executing /test-echo hello world" }))
56:   })
57: 
58:   it("should gracefully return a failure envelope if TUI dispatch throws", async () => {
59:     const clearPromptMock = vi.fn(async () => undefined)
60:     const appendPromptMock = vi.fn().mockRejectedValue(new Error("Network Error"))
61:     const submitPromptMock = vi.fn(async () => undefined)
62:     
63:     const client = {
64:       tui: {
65:         clearPrompt: clearPromptMock,
66:         appendPrompt: appendPromptMock,
67:         submitPrompt: submitPromptMock,
68:       },
69:     } as unknown as PluginInput["client"]
70: 
71:     const executeSlashCommandTool = createExecuteSlashCommandTool(client)
72: 
73:     const result = await executeSlashCommandTool.execute({ command: "bad-command", arguments: "" }, {
74:       sessionID: "ses_abc123",
75:       agent: "hm-operator",
76:       metadata: vi.fn()
77:     } as any)
78: 
79:     // Verify the tool gracefully handles rejection without crashing the plugin.
80:     expect(result).toEqual({
81:       output: "✗ Failed to dispatch /bad-command: Network Error",
82:       metadata: {
83:         error: true,
84:         errorType: "internal",
85:         command: "bad-command",
86:         message: "Network Error",
87:       },
88:     })
89:   })
90: })

(End of file - total 90 lines)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin-private/tests/AGENTS.md
# Tests and Verification Sector Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`tests/` is the Tests/Verification sector for Vitest unit, schema, hook, tool, CLI, sidecar, plugin, and integration tests that mirror the `src/` Hard Harness structure. Source evidence: `.planning/codebase/STRUCTURE.md:53-62`, `.planning/codebase/STRUCTURE.md:141-145`, `.planning/codebase/TESTING.md:50-75`.

## 2. Allowed mutation authority

- Test files may be added or updated to mirror source changes under `tests/lib/`, `tests/tools/`, `tests/hooks/`, `tests/schema-kernel/`, `tests/cli/`, `tests/plugins/`, `tests/sidecar/`, and `tests/integration/`. Evidence: `.planning/codebase/TESTING.md:52-64`.
- Tests may use Vitest globals, mocks, spies, fixtures, and factories to prove behavior of source contracts. Evidence: `.planning/codebase/TESTING.md:76-213`.
- Coverage configuration and thresholds are verification policy surfaces and require explicit audit amendments before lowering. Evidence: `.planning/codebase/TESTING.md:12-40`.

## 3. Forbidden mutations / explicit no-go boundaries

- Tests SHALL NOT be used to mutate runtime state outside controlled fixtures/temp directories.
- Mocked/unit-only evidence SHALL NOT be claimed as integration or runtime readiness proof. Evidence: `.planning/architecture/hivemind-sector-agents-target-2026-05-07.md:30-37`, `.planning/ROADMAP.md:47-49`.
- Do not lower coverage thresholds without an explicit audit amendment. Evidence: `.planning/codebase/TESTING.md:36-40`.
- Do not add tests that assert implementation details while bypassing public contracts unless the tested module is explicitly internal and the test names that boundary.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| Builders/fixers | Prove behavior after source changes | Must run relevant tests before completion claims |
| Reviewers/gates | Assess regression and evidence sufficiency | Must classify evidence level honestly |
| Runtime/source sectors | Receive mirrored test coverage | Tests do not own production behavior |
| Human reviewers | Decide whether evidence is enough for readiness | Integration readiness requires non-mocked integration/live proof |

## 5. Naming and placement conventions

- Test files mirror source names with `.test.ts` suffix. Evidence: `.planning/codebase/TESTING.md:66-69`, `.planning/codebase/STRUCTURE.md:186-195`.
- Test directories mirror source sectors: `tests/lib/` → `src/` runtime modules, `tests/tools/` → `src/tools/`, `tests/hooks/` → `src/hooks/`, `tests/schema-kernel/` → `src/schema-kernel/`. Evidence: `.planning/codebase/TESTING.md:52-64`.
- Use descriptive lowercase `it()` names and one behavior per test. Evidence: `.planning/codebase/TESTING.md:104-110`.

## 6. Quality gates and evidence expectations

- Standard commands: `npm test`, `npm run test:coverage`, single-file `npx vitest run tests/...`, and name-filtered `npx vitest run -t "<test name>"`. Evidence: `.planning/codebase/TESTING.md:41-48`.
- Current testing baseline and failures must be reported honestly; as of the source map, 1,765/1,767 tests pass with 2 known session-journal taxonomy failures. Evidence: `.planning/codebase/TESTING.md:70-75`.
- Runtime readiness requires L1-L3 evidence beyond docs-only or mocked unit proof; tests alone must be classified by level and scope.

</system-reminder>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/tools/hivemind/hivemind-command-engine.ts"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin-private/src/tools/hivemind/hivemind-command-engine.ts</path>
<type>file</type>
<content>
1: import { tool } from "@opencode-ai/plugin/tool"
2: 
3: import { executeCommandEngineAction } from "../../routing/command-engine/index.js"
4: import {
5:   CommandEngineToolInputSchema,
6:   type CommandEngineToolInput,
7: } from "../../schema-kernel/command-engine.schema.js"
8: import { renderToolResult } from "../../shared/tool-helpers.js"
9: import { error, success } from "../../shared/tool-response.js"
10: 
11: type ToolContext = { sessionID?: string }
12: 
13: /**
14:  * Create the command-engine tool (CQRS read-side).
15:  *
16:  * Provides discovery, contract analysis, context rendering, transforms,
17:  * route previews, and command listing for OpenCode slash commands.
18:  * This is the read-side companion to `execute-slash-command` (write-side).
19:  *
20:  * @param projectRoot - Trusted project root used for command discovery.
21:  * @returns OpenCode tool exposing discovery, contracts, context rendering, transforms, route previews, and command listing.
22:  *
23:  * @see src/tools/session/execute-slash-command.ts — write-side companion (deterministic SDK dispatch)
24:  */
25: export function createHivemindCommandEngineTool(projectRoot: string): ReturnType<typeof tool> {
26:   const s = tool.schema
27: 
28:   return tool({
29:     description:
30:       "Discover command bundles, analyze contracts, render bounded context, transform messages narrowly, " +
31:       "preview routes without execution, and list available commands. " +
32:       "This is the read-side of command management — use `execute-slash-command` to actually dispatch a command.",
33:     args: {
34:       action: s.string().describe("Action: discover, analyze_contract, render_context, transform_messages, route_preview, or list_commands"),
35:       commandName: s.string().optional().describe("Command name for command-specific actions"),
36:       arguments: s.string().optional().describe("Command arguments used only for preview/message transform"),
37:       context: s.any().optional().describe("Serializable bounded context payload"),
38:       messages: s.array(s.object({ role: s.string(), content: s.string() })).optional().describe("Messages for narrow command transform"),
39:       maxCharacters: s.number().optional().describe("Maximum rendered context characters"),
40:       score: s.number().optional().describe("Runtime pressure score"),
41:       tier: s.number().optional().describe("Runtime pressure tier"),
42:     },
43:     async execute(rawArgs: CommandEngineToolInput, _context: ToolContext): Promise<string> {
44:       try {
45:         const result = await executeCommandEngineToolAction(projectRoot, rawArgs)
46:         return renderToolResult(success("Command engine action completed", result))
47:       } catch (caughtError) {
48:         const message = caughtError instanceof Error ? caughtError.message : String(caughtError)
49:         return renderToolResult(error(message))
50:       }
51:     },
52:   })
53: }
54: 
55: /**
56:  * Execute a validated command-engine tool action.
57:  *
58:  * @param projectRoot - Trusted project root.
59:  * @param rawArgs - Untrusted tool input.
60:  * @returns Command-engine action result.
61:  */
62: export async function executeCommandEngineToolAction(projectRoot: string, rawArgs: unknown): ReturnType<typeof executeCommandEngineAction> {
63:   const args = CommandEngineToolInputSchema.parse(rawArgs)
64:   return executeCommandEngineAction(projectRoot, args)
65: }
66: 
67: export { CommandEngineToolInputSchema }

(End of file - total 67 lines)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin-private/src/tools/hivemind/AGENTS.md
# Hivemind Tools Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/tools/hivemind/` owns runtime control-plane and evidence-query tool entrypoints. Tools include: `hivemind-doc.ts` (document intelligence queries), `hivemind-agent-work.ts` (durable work contract create/export), `hivemind-trajectory.ts` (trajectory ledger inspection), `hivemind-pressure.ts` (pressure classification and evidence), `hivemind-sdk-supervisor.ts` (SDK wrapper health checks), `hivemind-command-engine.ts` (command discovery and routing preview), and `run-background-command.ts` (background PTY/headless command execution). Source evidence: `.planning/codebase/ARCHITECTURE.md:87-113`, `.planning/codebase/STRUCTURE.md:104-108`.

Architecture: `.planning/codebase/ARCHITECTURE.md:87-113` — CQRS write-side tools calling feature modules. Classification: Hard Harness. These tools consume `.opencode/` Soft Meta-Concepts as inputs but never store logic in `.opencode/`. Internal state persists to `.hivemind/`.

## 2. Allowed mutation authority

- Tools may parse input via Zod schemas and render standardized responses with `src/shared/`.
- Tools may call feature modules (runtime-pressure, sdk-supervisor, agent-work-contracts, doc-intelligence, background-command) and task-management modules.
- Tools may write through approved `.hivemind/` state owners when the contract requires it. Source evidence: `.planning/codebase/ARCHITECTURE.md:339-353`.

## 3. Forbidden mutations / explicit no-go boundaries

- Tools SHALL NOT bypass schema validation for agent-provided input.
- Tools SHALL NOT write internal runtime state into `.opencode/`. Source evidence: `.planning/codebase/ARCHITECTURE.md:247-255`.
- Tools SHALL NOT register themselves; `src/plugin.ts` owns registration. Source evidence: `.planning/codebase/STRUCTURE.md:221-224`.
- Tools SHALL NOT duplicate deep logic that belongs in feature modules.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| Agents and commands | Invoke hivemind tools during workflows | Must pass schema-valid inputs |
| `src/features/` | Owns runtime feature logic | Tools call features; tools do not duplicate logic |
| `src/task-management/` | Owns trajectory and state persistence | Tools call task-management; tools do not own state |
| `src/shared/` | Provides response envelope rendering | Shared stays leaf |
| Tests | Validate tool contracts and side effects | Integration claims require integration evidence |

## 5. Naming and placement conventions

- Tool files use `kebab-case.ts` with `hivemind-` prefix: `hivemind-doc.ts`, `hivemind-trajectory.ts`, etc. Source evidence: `.planning/codebase/STRUCTURE.md:221-224`.
- `run-background-command.ts` is the exception (no prefix).
- Schemas belong in `src/schema-kernel/` when validation is needed.
- Tests live under `tests/tools/hivemind/`. Source evidence: `.planning/codebase/TESTING.md:52-64`.

## 6. Quality gates and evidence expectations

- Code changes require `npm run typecheck` and scoped tool tests. Source evidence: `.planning/codebase/TESTING.md:41-48`.
- Mutation claims require evidence of the intended state surface.
- Docs-only edits remain L5 evidence. Source evidence: `.planning/ROADMAP.md:47-49`.

</system-reminder>
```

---

## Assistant (Build · CrofAI: kimi-k2.6 (precision) · 8.1s)

_Thinking:_

Good, I've read the current implementation. Now let me continue investigating:

1. The `execute-slash-command.ts` is quite simple - it only does TUI prompt pipeline dispatch
2. It doesn't handle agent switching properly
3. It doesn't understand subtask delegation
4. It doesn't parse command flags/arguments intelligently

Let me now:
1. Look at GSD commands to understand their parsing patterns
2. Look at the OpenCode SDK for command/agent primitives
3. Look at the routing/command-engine for how commands are processed

 

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/routing/command-engine/index.ts"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin-private/src/routing/command-engine/index.ts</path>
<type>file</type>
<content>
1: import { loadPrimitives } from "../../features/bootstrap/primitive-loader.js"
2: import { detectRuntimePressure } from "../../features/runtime-pressure/index.js"
3: import type {
4:   CommandBundle,
5:   CommandContextRenderInput,
6:   CommandContextRenderResult,
7:   CommandContractAnalysis,
8:   CommandDiscoveryResult,
9:   CommandEngineActionInput,
10:   CommandListResult,
11:   CommandMessageTransformInput,
12:   CommandMessageTransformResult,
13:   CommandRoutePreview,
14:   CommandRoutePreviewInput,
15: } from "./types.js"
16: 
17: const DEFAULT_CONTEXT_LIMIT = 4_000
18: const MAX_CONTEXT_LIMIT = 16_000
19: const COMMAND_FAILURE_STATES = ["missing_command", "invalid_contract", "pressure_blocked", "context_overflow"] as const
20: 
21: /**
22:  * Discover command bundles from existing OpenCode command primitives.
23:  *
24:  * @param options - Project root containing `.opencode/commands`.
25:  * @returns Discovered command bundles and primitive-loader warnings.
26:  */
27: export async function discoverCommandBundles(options: { projectRoot: string }): Promise<CommandDiscoveryResult> {
28:   const primitives = await loadPrimitives({ projectRoot: options.projectRoot })
29:   const commands = Array.from(primitives.commands.entries())
30:     .map(([name, command]): CommandBundle => ({
31:       name,
32:       source: "opencode-command",
33:       filePath: command.filePath,
34:       description: command.frontmatter.description,
35:       agent: command.frontmatter.agent,
36:       body: command.body,
37:     }))
38:     .sort((left, right) => left.name.localeCompare(right.name))
39: 
40:   return { commands, warnings: primitives.warnings }
41: }
42: 
43: /**
44:  * Analyze the routing contract exposed by a command bundle.
45:  *
46:  * @param command - Discovered command bundle.
47:  * @returns Contract analysis with explicit failure states.
48:  */
49: export function analyzeCommandContract(command: CommandBundle): CommandContractAnalysis {
50:   const valid = command.name.length > 0 && command.description.length > 0 && command.body.length > 0
51:   return {
52:     name: command.name,
53:     valid,
54:     failureStates: [...COMMAND_FAILURE_STATES],
55:     acceptsArguments: command.body.includes("$ARGUMENTS"),
56:     contextNeeds: ["bounded-context", "pressure-decision"],
57:     outputShape: "route-preview",
58:   }
59: }
60: 
61: /**
62:  * Render command context into a bounded serialized payload.
63:  *
64:  * @param input - Command name, context payload, and bounds.
65:  * @returns Bounded context rendering result.
66:  */
67: export function renderCommandContext(input: CommandContextRenderInput): CommandContextRenderResult {
68:   const maxCharacters = normalizeContextLimit(input.maxCharacters)
69:   const rawRendered = JSON.stringify({ commandName: input.commandName, context: input.context ?? {} }, null, 2)
70:   const truncated = rawRendered.length > maxCharacters
71:   return {
72:     commandName: input.commandName,
73:     rendered: truncated ? rawRendered.slice(0, maxCharacters) : rawRendered,
74:     truncated,
75:     maxCharacters,
76:   }
77: }
78: 
79: /**
80:  * Apply a narrow command-only message transform.
81:  *
82:  * @param input - Command invocation and existing messages.
83:  * @returns Transformed messages plus explicit broad-transform exclusions.
84:  */
85: export function transformCommandMessages(input: CommandMessageTransformInput): CommandMessageTransformResult {
86:   const args = input.arguments?.trim()
87:   const invocation = args ? `/${input.commandName} ${args}` : `/${input.commandName}`
88:   return {
89:     messages: [...(input.messages ?? []), { role: "user", content: invocation }],
90:     exclusions: ["broad-system-transform", "process-launch", "command-execution"],
91:   }
92: }
93: 
94: /**
95:  * Preview command routing without executing or spawning any process.
96:  *
97:  * @param input - Project root, command name, optional context, and pressure values.
98:  * @returns Route preview payload.
99:  */
100: export async function routeCommandPreview(input: CommandRoutePreviewInput): Promise<CommandRoutePreview> {
101:   const discovery = await discoverCommandBundles({ projectRoot: input.projectRoot })
102:   const command = discovery.commands.find((candidate) => candidate.name === input.commandName)
103:   const pressure = detectRuntimePressure({ score: input.score, tier: input.tier, toolName: "hivemind-command-engine" })
104:   const context = renderCommandContext(input)
105:   const transform = transformCommandMessages(input)
106:   const routeStatus = resolveRouteStatus(Boolean(command), pressure.outcome)
107: 
108:   return {
109:     executable: false,
110:     pressure,
111:     route: {
112:       action: "preview_only",
113:       commandName: input.commandName,
114:       filePath: command?.filePath,
115:       status: routeStatus,
116:     },
117:     contract: command ? analyzeCommandContract(command) : undefined,
118:     context,
119:     transform,
120:   }
121: }
122: 
123: /**
124:  * Execute a command-engine action through the public library API.
125:  *
126:  * @param projectRoot - Project root for discovery and routing.
127:  * @param input - Validated action input.
128:  * @returns Action-specific command-engine result.
129:  */
130: export async function executeCommandEngineAction(
131:   projectRoot: string,
132:   input: CommandEngineActionInput,
133: ): Promise<CommandDiscoveryResult | CommandContractAnalysis | CommandContextRenderResult | CommandMessageTransformResult | CommandRoutePreview | CommandListResult> {
134:   switch (input.action) {
135:     case "discover":
136:       return discoverCommandBundles({ projectRoot })
137:     case "list_commands":
138:       return listCommands({ projectRoot })
139:     case "analyze_contract": {
140:       const command = await requireCommand(projectRoot, input.commandName)
141:       return analyzeCommandContract(command)
142:     }
143:     case "render_context":
144:       return renderCommandContext({
145:         commandName: input.commandName ?? "unknown-command",
146:         context: input.context,
147:         maxCharacters: input.maxCharacters,
148:       })
149:     case "transform_messages":
150:       return transformCommandMessages({
151:         commandName: input.commandName ?? "unknown-command",
152:         arguments: input.arguments,
153:         messages: input.messages,
154:       })
155:     case "route_preview":
156:       if (!input.commandName) throw new Error("[Harness] commandName is required for route_preview")
157:       return routeCommandPreview({ projectRoot, ...input, commandName: input.commandName })
158:   }
159: }
160: 
161: /**
162:  * List available commands in a compact, agent-friendly format.
163:  *
164:  * Unlike `discover` which returns full command bundles with raw bodies,
165:  * this returns a minimal summary optimized for agent decision-making:
166:  * name, description, agent hint, and whether arguments are accepted.
167:  *
168:  * @param options - Project root containing `.opencode/commands`.
169:  * @returns Compact command listing with total count.
170:  */
171: export async function listCommands(options: { projectRoot: string }): Promise<CommandListResult> {
172:   const discovery = await discoverCommandBundles(options)
173:   const commands = discovery.commands.map((cmd) => ({
174:     name: cmd.name,
175:     description: cmd.description,
176:     ...(cmd.agent && { agent: cmd.agent }),
177:     acceptsArguments: cmd.body.includes("$ARGUMENTS"),
178:   }))
179:   return { commands, total: commands.length }
180: }
181: 
182: /**
183:  * Require a command bundle by name for command-specific actions.
184:  *
185:  * @param projectRoot - Project root for discovery.
186:  * @param commandName - Command name to find.
187:  * @returns Matching command bundle.
188:  * @throws {Error} When commandName is absent or missing.
189:  */
190: async function requireCommand(projectRoot: string, commandName?: string): Promise<CommandBundle> {
191:   if (!commandName) throw new Error("[Harness] commandName is required for analyze_contract")
192:   const discovery = await discoverCommandBundles({ projectRoot })
193:   const command = discovery.commands.find((candidate) => candidate.name === commandName)
194:   if (!command) throw new Error(`[Harness] Command not found: ${commandName}`)
195:   return command
196: }
197: 
198: /**
199:  * Normalize context bounds.
200:  *
201:  * @param requestedLimit - Untrusted requested character limit.
202:  * @returns Safe character limit.
203:  */
204: function normalizeContextLimit(requestedLimit?: number): number {
205:   if (requestedLimit === undefined || !Number.isFinite(requestedLimit)) return DEFAULT_CONTEXT_LIMIT
206:   return Math.max(1, Math.min(MAX_CONTEXT_LIMIT, Math.trunc(requestedLimit)))
207: }
208: 
209: /**
210:  * Resolve route status from command presence and pressure outcome.
211:  *
212:  * @param commandFound - True when the command exists.
213:  * @param outcome - Phase 57 pressure outcome.
214:  * @returns Route status for preview consumers.
215:  */
216: function resolveRouteStatus(commandFound: boolean, outcome: string): CommandRoutePreview["route"]["status"] {
217:   if (!commandFound) return "missing"
218:   if (outcome === "block" || outcome === "require_approval") return "blocked"
219:   if (outcome === "defer") return "deferred"
220:   return "ready"
221: }
222: 
223: export type * from "./types.js"

(End of file - total 223 lines)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin-private/src/routing/command-engine/AGENTS.md
# Command Engine Routing Guidance

**Parent sector:** `src/routing/AGENTS.md` | **Architecture:** `.planning/codebase/ARCHITECTURE.md` | **Classification:** Hard Harness — read-side (command discovery, contract analysis)

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/routing/command-engine/` owns OpenCode command discovery, contract analysis, bounded context rendering, and preview-only routing. It discovers available commands, analyzes their contracts, and renders bounded contexts for routing decisions. Command execution belongs to tools and coordination modules. Source evidence: `.planning/codebase/ARCHITECTURE.md:136-183`.

## 2. Allowed mutation authority

- Command-engine may discover and analyze command contracts.
- Command-engine may render bounded context previews for routing decisions.
- All operations are read-side; no durable state mutation.

## 3. Forbidden mutations / explicit no-go boundaries

- Command-engine SHALL NOT execute commands; execution belongs elsewhere. Source evidence: `.planning/codebase/ARCHITECTURE.md:339-353`.
- Command-engine SHALL NOT perform durable writes. Source evidence: `.planning/codebase/ARCHITECTURE.md:247-255`.
- Command-engine SHALL NOT store state in `.opencode/`.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| `src/tools/hivemind/hivemind-command-engine.ts` | Queries command discovery and routing preview | Tools own CQRS mutation; engine owns discovery |
| `src/hooks/` | Reads command routing for guard decisions | Hooks must not bypass command analysis |
| Tests | Validate command discovery accuracy | Must test command contract analysis |

## 5. Naming and placement conventions

- Modules use `kebab-case.ts` in `src/routing/command-engine/`. Source evidence: `.planning/codebase/STRUCTURE.md:186-195`.
- Barrel export at `index.ts`.
- Tests mirror under `tests/routing/command-engine/`.

## 6. Quality gates and evidence expectations

- Code changes require `npm run typecheck` and scoped tests. Source evidence: `.planning/codebase/TESTING.md:41-48`.
- Discovery changes must verify command contract accuracy.
- Docs-only edits remain L5 evidence. Source evidence: `.planning/ROADMAP.md:47-49`.


Instructions from: /Users/apple/hivemind-plugin-private/src/routing/AGENTS.md
# Routing Sector Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/routing/` owns session entry classification, behavioral profile resolution, command interpretation, and workflow route selection. Session-entry handles language, profile, and purpose classification at intake. Behavioral-profile resolves config-first profiles with lazy session cache invalidation. Command-engine discovers and renders bounded command contexts. Routing may classify and dispatch; it must not perform durable writes. Source evidence: `.planning/codebase/ARCHITECTURE.md:136-183`, `.planning/codebase/STRUCTURE.md:110-112`. Classification: Hard Harness — read-side routing. Routing consumes `.opencode/` Soft Meta-Concepts (commands, agents) as classification inputs but does not mutate them. Internal state caches live in `.hivemind/`.

## 2. Allowed mutation authority

- Routing modules may classify session intent, resolve behavioral profiles, and interpret commands.
- Routing modules may maintain in-memory caches (e.g., session profile cache) with explicit lifecycle.
- Routing modules may return routing decisions consumed by tools and hooks.

## 3. Forbidden mutations / explicit no-go boundaries

- Routing SHALL NOT perform durable writes; routing is read-side classification. Source evidence: `.planning/codebase/ARCHITECTURE.md:339-353`.
- Routing SHALL NOT store runtime state in `.opencode/`; `.hivemind/` is the canonical state root. Source evidence: `.planning/codebase/ARCHITECTURE.md:247-255`.
- Routing SHALL NOT execute commands; command execution belongs to tools and coordination modules.
- Routing SHALL NOT exceed the 500 LOC module cap. Source evidence: `.planning/codebase/CONVENTIONS.md:19-28`.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| `src/hooks/` | Reads routing decisions for guard and observer behavior | Hooks must not bypass routing classification |
| `src/tools/` | Invokes routing to classify session intent | Tools own CQRS mutation; routing owns classification |
| `src/plugin.ts` | Wires routing dependencies at composition time | Keeps assembly logic only |
| Tests | Validate classification accuracy and profile resolution | Unit tests do not prove integration readiness |

## 5. Naming and placement conventions

- Each routing module lives in its own subdirectory: `src/routing/{module-name}/index.ts`. Source evidence: `.planning/codebase/STRUCTURE.md:186-195`.
- Routing types belong in `{module-name}/types.ts`.
- Empty reserved folders must use `.gitkeep`. Source evidence: `.planning/codebase/STRUCTURE.md:268-278`.
- TypeScript strict ESM with `.js` import extensions. Source evidence: `.planning/codebase/CONVENTIONS.md:80-98`.

## 6. Quality gates and evidence expectations

- Code changes require `npm run typecheck` and scoped `npx vitest run tests/...` evidence. Source evidence: `.planning/codebase/TESTING.md:41-48`.
- Routing classification changes must have test coverage for edge cases.
- Docs-only edits remain L5 evidence and must not alter readiness status. Source evidence: `.planning/ROADMAP.md:47-49`.

</system-reminder>
```

**Tool: glob**

**Input:**
```json
{
  "pattern": "/Users/apple/hivemind-plugin-private/.opencode/commands/*.md"
}
```

**Output:**
```
No files found
```

**Tool: glob**

**Input:**
```json
{
  "pattern": "/Users/apple/hivemind-plugin-private/.opencode/agents/*.md"
}
```

**Output:**
```
No files found
```

---

## Assistant (Build · CrofAI: kimi-k2.6 (precision) · 7.7s)

_Thinking:_

The glob for .opencode/commands didn't find files because they're symlinks. Let me check the actual structure.

 

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/commands"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin-private/.opencode/commands</path>
<type>directory</type>
<entries>
.gitkeep
deep-init.md
deep-research-synthesis-repomix.md
gsd-add-tests.md
gsd-ai-integration-phase.md
gsd-audit-fix.md
gsd-audit-milestone.md
gsd-audit-uat.md
gsd-autonomous.md
gsd-capture.md
gsd-cleanup.md
gsd-code-review.md
gsd-complete-milestone.md
gsd-config.md
gsd-debug.md
gsd-discuss-phase.md
gsd-docs-update.md
gsd-eval-review.md
gsd-execute-phase.md
gsd-explore.md
gsd-extract-learnings.md
gsd-fast.md
gsd-forensics.md
gsd-graphify.md
gsd-health.md
gsd-help.md
gsd-import.md
gsd-inbox.md
gsd-ingest-docs.md
gsd-manager.md
gsd-map-codebase.md
gsd-milestone-summary.md
gsd-mvp-phase.md
gsd-new-milestone.md
gsd-new-project.md
gsd-ns-context.md
gsd-ns-ideate.md
gsd-ns-manage.md
gsd-ns-project.md
gsd-ns-review.md
gsd-ns-workflow.md
gsd-pause-work.md
gsd-phase.md
gsd-plan-phase.md
gsd-plan-review-convergence.md
gsd-pr-branch.md
gsd-profile-user.md
gsd-progress.md
gsd-quick.md
gsd-resume-work.md
gsd-review-backlog.md
gsd-review.md
gsd-secure-phase.md
gsd-settings.md
gsd-ship.md
gsd-sketch.md
gsd-spec-phase.md
gsd-spike.md
gsd-stats.md
gsd-thread.md
gsd-ui-phase.md
gsd-ui-review.md
gsd-ultraplan-phase.md
gsd-undo.md
gsd-update.md
gsd-validate-phase.md
gsd-verify-work.md
gsd-workspace.md
gsd-workstreams.md
gsd/
harness-audit.md
harness-doctor.md
hf-absorb.md
hf-audit.md
hf-configure.md
hf-create.md
hf-prompt-enhance-to-plan.md
hf-prompt-enhance.md
hf-stack.md
plan.md
start-work.md
sync-agents-md.md
test-echo.md
test-list.md
test-spike-execute.md
test-status.md
ultrawork.md

(87 entries)
</entries>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/agents"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin-private/.opencode/agents</path>
<type>directory</type>
<entries>
.gitkeep
gsd-advisor-researcher.md
gsd-ai-researcher.md
gsd-assumptions-analyzer.md
gsd-code-fixer.md
gsd-code-reviewer.md
gsd-codebase-mapper.md
gsd-debug-session-manager.md
gsd-debugger.md
gsd-doc-classifier.md
gsd-doc-synthesizer.md
gsd-doc-verifier.md
gsd-doc-writer.md
gsd-domain-researcher.md
gsd-eval-auditor.md
gsd-eval-planner.md
gsd-executor.md
gsd-framework-selector.md
gsd-integration-checker.md
gsd-intel-updater.md
gsd-nyquist-auditor.md
gsd-pattern-mapper.md
gsd-phase-researcher.md
gsd-plan-checker.md
gsd-planner.md
gsd-project-researcher.md
gsd-research-synthesizer.md
gsd-roadmapper.md
gsd-security-auditor.md
gsd-ui-auditor.md
gsd-ui-checker.md
gsd-ui-researcher.md
gsd-user-profiler.md
gsd-verifier.md
hf-l0-orchestrator.md
hf-l1-coordinator.md
hf-l2-agent-builder.md
hf-l2-auditor.md
hf-l2-command-builder.md
hf-l2-meta-builder.md
hf-l2-prompter.md
hf-l2-refactorer.md
hf-l2-skill-builder.md
hf-l2-synthesizer.md
hf-l2-tool-builder.md
hm-l0-orchestrator.md
hm-l1-coordinator.md
hm-l2-analyst.md
hm-l2-architect.md
hm-l2-assessor.md
hm-l2-auditor.md
hm-l2-brainstormer.md
hm-l2-build.md
hm-l2-conductor.md
hm-l2-connector.md
hm-l2-context-mapper.md
hm-l2-context-purifier.md
hm-l2-critic.md
hm-l2-curator.md
hm-l2-debugger.md
hm-l2-ecologist.md
hm-l2-executor.md
hm-l2-finisher.md
hm-l2-general.md
hm-l2-guardian.md
hm-l2-integrator.md
hm-l2-intent-loop.md
hm-l2-investigator.md
hm-l2-mentor.md
hm-l2-meta-synthesis.md
hm-l2-operator.md
hm-l2-optimizer.md
hm-l2-persistor.md
hm-l2-phase-guardian.md
hm-l2-planner.md
hm-l2-prompt-analyzer.md
hm-l2-prompt-repackager.md
hm-l2-prompt-skimmer.md
hm-l2-researcher.md
hm-l2-reviewer.md
hm-l2-risk-assessor.md
hm-l2-router.md
hm-l2-scout.md
hm-l2-spec-verifier.md
hm-l2-strategist.md
hm-l2-synthesizer.md
hm-l2-technician.md
hm-l2-test-router.md
hm-l2-validator.md
hm-l2-writer.md

(90 entries)
</entries>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/routing/command-engine/types.ts"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin-private/src/routing/command-engine/types.ts</path>
<type>file</type>
<content>
1: import type { PressureDecision } from "../../features/runtime-pressure/types.js"
2: 
3: /** Command bundle discovered from existing OpenCode command primitives. */
4: export type CommandBundle = {
5:   /** Command name derived from the primitive file name. */
6:   name: string
7:   /** Source kind for the discovered command. */
8:   source: "opencode-command"
9:   /** Absolute primitive file path for traceability. */
10:   filePath: string
11:   /** Command description from frontmatter. */
12:   description: string
13:   /** Optional agent hint from frontmatter. */
14:   agent?: string
15:   /** Raw command body. */
16:   body: string
17: }
18: 
19: /** Result of discovering command bundles. */
20: export type CommandDiscoveryResult = {
21:   /** Discovered command bundles. */
22:   commands: CommandBundle[]
23:   /** Discovery warnings emitted by primitive loading. */
24:   warnings: string[]
25: }
26: 
27: /** Command contract failure states understood by the route previewer. */
28: export type CommandFailureState = "missing_command" | "invalid_contract" | "pressure_blocked" | "context_overflow"
29: 
30: /** Contract analysis for one command bundle. */
31: export type CommandContractAnalysis = {
32:   /** Command name under analysis. */
33:   name: string
34:   /** True when the command has the required fields for routing preview. */
35:   valid: boolean
36:   /** Expected failure states for safe routing. */
37:   failureStates: CommandFailureState[]
38:   /** Arguments placeholder supported by the command body. */
39:   acceptsArguments: boolean
40:   /** Context fields required before execution can be implemented later. */
41:   contextNeeds: string[]
42:   /** Output contract currently supported by this phase. */
43:   outputShape: "route-preview"
44: }
45: 
46: /** Input for bounded context rendering. */
47: export type CommandContextRenderInput = {
48:   /** Command receiving the rendered context. */
49:   commandName: string
50:   /** Serializable context payload. */
51:   context?: unknown
52:   /** Maximum rendered character count. */
53:   maxCharacters?: number
54: }
55: 
56: /** Output from bounded context rendering. */
57: export type CommandContextRenderResult = {
58:   /** Command receiving the rendered context. */
59:   commandName: string
60:   /** Rendered bounded context. */
61:   rendered: string
62:   /** True when the rendered payload was truncated. */
63:   truncated: boolean
64:   /** Maximum applied to the rendered payload. */
65:   maxCharacters: number
66: }
67: 
68: /** Message accepted by the narrow command transformer. */
69: export type CommandMessage = {
70:   /** OpenCode-style message role. */
71:   role: "system" | "user" | "assistant"
72:   /** Message content. */
73:   content: string
74: }
75: 
76: /** Input for narrow command message transformation. */
77: export type CommandMessageTransformInput = {
78:   /** Command name to render as a slash command. */
79:   commandName: string
80:   /** Raw command arguments. */
81:   arguments?: string
82:   /** Existing messages to preserve. */
83:   messages?: CommandMessage[]
84: }
85: 
86: /** Output from narrow command message transformation. */
87: export type CommandMessageTransformResult = {
88:   /** Preserved messages plus the command invocation message. */
89:   messages: CommandMessage[]
90:   /** Transform exclusions that prevent broad system-transform regressions. */
91:   exclusions: string[]
92: }
93: 
94: /** Input for command route preview. */
95: export type CommandRoutePreviewInput = {
96:   /** Project root used for `.opencode/commands` discovery. */
97:   projectRoot: string
98:   /** Command to preview. */
99:   commandName: string
100:   /** Optional arguments included in transformed messages. */
101:   arguments?: string
102:   /** Optional bounded context payload. */
103:   context?: unknown
104:   /** Maximum context characters. */
105:   maxCharacters?: number
106:   /** Runtime pressure score. */
107:   score?: number
108:   /** Runtime pressure tier. */
109:   tier?: number
110: }
111: 
112: /** Result of command route preview. */
113: export type CommandRoutePreview = {
114:   /** Always false in Phase 59; no process spawning or command execution. */
115:   executable: false
116:   /** Pressure decision used for routing posture. */
117:   pressure: PressureDecision
118:   /** Route preview details. */
119:   route: {
120:     /** Phase 59 supports preview only. */
121:     action: "preview_only"
122:     /** Command name if found. */
123:     commandName: string
124:     /** Absolute file path if found. */
125:     filePath?: string
126:     /** Route status. */
127:     status: "ready" | "missing" | "blocked" | "deferred"
128:   }
129:   /** Contract analysis when the command exists. */
130:   contract?: CommandContractAnalysis
131:   /** Bounded context rendering result. */
132:   context: CommandContextRenderResult
133:   /** Narrow message transform result. */
134:   transform: CommandMessageTransformResult
135: }
136: 
137: /** Compact command summary returned by `list_commands`. */
138: export type CommandListEntry = {
139:   /** Command name (without leading slash). */
140:   name: string
141:   /** Human-readable command description. */
142:   description: string
143:   /** Optional agent hint from frontmatter. */
144:   agent?: string
145:   /** True when the command body contains `$ARGUMENTS`. */
146:   acceptsArguments: boolean
147: }
148: 
149: /** Result of listing available commands. */
150: export type CommandListResult = {
151:   /** Available commands sorted by name. */
152:   commands: CommandListEntry[]
153:   /** Total command count. */
154:   total: number
155: }
156: 
157: /** Tool/library action input for the command engine. */
158: export type CommandEngineActionInput = {
159:   /** Command-engine action selector. */
160:   action: "discover" | "analyze_contract" | "render_context" | "transform_messages" | "route_preview" | "list_commands"
161:   /** Optional command name for command-specific actions. */
162:   commandName?: string
163:   /** Optional command arguments. */
164:   arguments?: string
165:   /** Optional context payload. */
166:   context?: unknown
167:   /** Optional message list. */
168:   messages?: CommandMessage[]
169:   /** Maximum context characters. */
170:   maxCharacters?: number
171:   /** Runtime pressure score. */
172:   score?: number
173:   /** Runtime pressure tier. */
174:   tier?: number
175: }

(End of file - total 175 lines)
</content>
```

---

## Assistant (Build · CrofAI: kimi-k2.6 (precision) · 7.4s)

_Thinking:_

Now let me look at a sample GSD command to understand how `$ARGUMENTS` parsing works and how GSD handles flags, numbers, etc.

 

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/commands/gsd-plan-phase.md"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin-private/.opencode/commands/gsd-plan-phase.md</path>
<type>file</type>
<content>
1: ---
2: description: Create detailed phase plan (PLAN.md) with verification loop
3: argument-hint: "[phase] [--auto] [--research] [--skip-research] [--research-phase <N>] [--view] [--gaps] [--skip-verify] [--prd <file>] [--reviews] [--text] [--tdd] [--mvp]"
4: tools:
5:   read: true
6:   write: true
7:   bash: true
8:   glob: true
9:   grep: true
10:   agent: true
11:   question: true
12:   webfetch: true
13:   mcp__context7__*: true
14: ---
15: <objective>
16: Create executable phase prompts (PLAN.md files) for a roadmap phase with integrated research and verification.
17: 
18: **Default flow:** Research (if needed) → Plan → Verify → Done
19: 
20: **Research-only mode (`--research-phase <N>`):** Spawn `gsd-phase-researcher` for phase `N`, write `RESEARCH.md`, then exit before the planner runs. Useful for cross-phase research, doc review before committing to a planning approach, and correction-without-replanning loops where iterating on research alone is dramatically cheaper than re-spawning the planner. Replaces the deleted `/gsd-research-phase` command (#3042).
21: 
22: **Research-only modifiers:**
23: - **No flag** — when `RESEARCH.md` already exists, prompt the user to choose `update / view / skip`.
24: - **`--research`** — force-refresh: re-spawn the researcher unconditionally, no prompt. Skips the existing-RESEARCH.md menu.
25: - **`--view`** — view-only: print existing `RESEARCH.md` to stdout. Does not spawn the researcher. Cheapest mode for the correction-without-replanning loop. If no `RESEARCH.md` exists yet, errors with a hint to drop `--view`.
26: 
27: **Orchestrator role:** Parse arguments, validate phase, research domain (unless skipped), spawn gsd-planner, verify with gsd-plan-checker, iterate until pass or max iterations, present results.
28: </objective>
29: 
30: <execution_context>
31: @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/plan-phase.md
32: @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/ui-brand.md
33: </execution_context>
34: 
35: <runtime_note>
36: **Copilot (VS Code):** Use `vscode_askquestions` wherever this workflow calls `question`. They are equivalent — `vscode_askquestions` is the VS Code Copilot implementation of the same interactive question API. Do not skip questioning steps because `question` appears unavailable; use `vscode_askquestions` instead.
37: </runtime_note>
38: 
39: <context>
40: Phase number: $ARGUMENTS (optional — auto-detects next unplanned phase if omitted)
41: 
42: **Flags:**
43: - `--research` — Force re-research even if RESEARCH.md exists
44: - `--skip-research` — Skip research, go straight to planning
45: - `--gaps` — Gap closure mode (reads VERIFICATION.md, skips research)
46: - `--skip-verify` — Skip verification loop
47: - `--prd <file>` — Use a PRD/acceptance criteria file instead of discuss-phase. Parses requirements into CONTEXT.md automatically. Skips discuss-phase entirely.
48: - `--reviews` — Replan incorporating cross-AI review feedback from REVIEWS.md (produced by `/gsd-review`)
49: - `--text` — Use plain-text numbered lists instead of TUI menus (required for `/rc` remote sessions)
50: - `--mvp` — Vertical MVP mode. Planner organizes tasks as feature slices (UI→API→DB) instead of horizontal layers. On Phase 1 of a new project, also emits `SKELETON.md` (Walking Skeleton). Can be persisted on a phase via `**Mode:** mvp` in ROADMAP.md.
51: 
52: Normalize phase input in step 2 before any directory lookups.
53: </context>
54: 
55: <process>
56: Execute end-to-end.
57: Preserve all workflow gates (validation, research, planning, verification loop, routing).
58: </process>

(End of file - total 58 lines)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin-private/.opencode/AGENTS.md
# Soft Meta-Concept Sector Guidance


## NON-NEGOTIABLE RULES

- all tech, stack, SDK implementation, audit, gatekeeping  must follow deep investigation - stack research ;skills are for references not for interfaces validation; "interfaces, patterns, methods, api, signatures of specs etc" must validate against the correct versions at package.json - **MUST VALIDATE AGAINST ONLINE RESOURCES AS FOR MCP SERVER TOOLS ACTUAL FETCH** - valid and evidences with Context7, Deepwiki, Gitmcp, Github repo, Exa **AND Repomix for accurate specific patterns** etc, official - loading references from skills of stacks are outdated, as so reading code in the codebase can be polluted as many implementations are not functioning and broken. DO NOT MAKE ASSUMPTIONS OF THE STACK REPO LINKs - **EXTREMELY IMPORNTANT:** Uses of Context7, Deepwiki, Gitmcp, Github, Exa, Repomix are enforced when researching, planning, and implementing - these MUST Comply with all the **Github and Npm links that up-to-date with versiosn and NOT A PRODUCT OF MAKING UP LINKS** >  glob, list this to check these links `.hivemind/STACKS-REFERENCES.md`

- any thing under .opencode/ are not shipped-with, they are symlinks or project toolings 

- all orchestrator, coordinator, conductor agents belonging to l0, and l1 classifications MUST FOCUS ON THE DELEGATIONS - NEVER Implement the tasks yourself - when delegating DO NOT SHOW THE SPECIALIST WHAT AND HOW TO IMPLEMENT - Show HOW TO PROCESS, WHAT TO EXPECT AS RESULTS, SETTING CONSTRAINTS AND BOUNDARIES, INDICATION OF CLEAR SUCCESS METRICS

- design patterns and must be obeyed strictly according to the architecture of the project.

- atomic git commit for context preservation.

- context git commit for both code implementation, docs, planning, researching, gatekeeping, verification artifacts - do not ask if commit needed

- AGENTS.md must be routinely updated - after each cycle, each batch of implementation.

- AGENTS.md are nested under dirs and subdirs, beware when maintaining them.

- files creation and structure must be registered and keep track - we love our codetree systematically structured and we **DO Registered** folders and subfolders with `.gitkeep` 

- folders must be created in a way that is easy to navigate and understand, following the best practice of this harness. Folders must be registered with gitkeep files to ensure they are tracked by git. 

- code file must JSDOC (Run JSDOC skill) documented with clear descriptions, parameters, return values, and examples. All functions and classes must be documented.

- The front facing agents must process high-level workflows, validate dependencies of tasks across sessions through faces

- The front facing agents must delegate to suagents of specialist; front facing agents are not allowed to execute any tasks

- The front facing agents are ones converse with USERS and must know the high-level tasks flow, following strict validations, gatekeeping, and coordination of the partificating frameworks

- When delegating to agents these are the list of agents that must learn and delegate to the correct ones. When delegate to subagents make sure setting up strict guardrails, boundaries, success metrics, making sure they are awared that they are subagents and fulfill the tasked within boundaries and without any deviation ans seriously go through gatekeeping.

<!-- NOTE: explore agent is MISSING from the filesystem -->

- For effective session-resume delegation (when user disconnected and there were previous aborted delegation tasks). Do not start new delegation, start the same start with **THE EXACT SESSION ID** to resume.

- **DELEGATION STACKING — attach work onto ANY existing session:** Both `task` and `delegate-task` support attaching new work as a child of a completed main session — NOT just resuming aborted tasks. Pattern: pass the existing session ID directly.
  - **`task` tool:** set `task_id` parameter to any existing session ID (not just a previous task_id from task tool). The new subagent attaches as a child of that session.
  - **`delegate-task` tool:** pass `context` as JSON: `{"parentSessionId": "<session-id>"}`. The new delegation attaches as a child of that session.
  - Do NOT inject the session ID into the prompt text — that creates a new independent session. The correct approach is passing it as a parameter so OpenCode's hierarchy tracking properly chains the sessions.
  - **Prompt stays simple** — context from the target session is preserved through the session chain. No need to re-describe old work in the prompt. This is the same principle as `subagent_type`/`agent` parameter: you specify the agent name to select the handler, you specify `task_id`/`parentSessionId` to select the session to attach to.
  - This pattern covers BOTH use cases: **resume** (incomplete session) and **stack-on** (completed session to add new work as a child).

- The front facing agents must keep track, monitor, make sure not a single validation, verification, review steps are skips, planning , audit and verification must following format of the participated framework with honest verification and prevention of regressions. 

- **all agents** at every turn (after PER USER's prompt, **even mid-session**, after each turn), entries, shift of workflows there should be matching SKILLS that you must load, load and reload of suitable skills for the task, select ones with framework consistencies. Do not miss loading SKILLS. SKILLS are extremely important


- - **all agents** : do not confuse between the project as the harness which you are building so that users can run it with OpenCode under their projects VS. your environment of works -> meaning there are assumptions that ARE NOT ALLOWED to interprete as this sole environment but must be as wider scopes, in terms of how different projects' states, tasks types, langues, frameworks and use cases.
---
**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

Source architecture: `.planning/architecture/hivemind-source-plane-architecture-2026-05-07.md` — `.opencode/` is the Soft Meta-Concepts sector: OpenCode primitives (agents, commands, skills, rules, permissions) ONLY. No runtime state. No development implementation.

## 1. Sector purpose and lifecycle role

`.opencode/` is the Soft Meta-Concept sector: OpenCode primitives, rules, plugin loader wrappers, commands, skills, agents, permissions, and project configuration that compose runtime behavior from outside the npm package source. Source evidence: `.planning/codebase/ARCHITECTURE.md:209-245`, `.planning/codebase/STRUCTURE.md:124-129`.

Source evidence: `.planning/architecture/hivemind-runtime-identity-taxonomy-2026-05-07.md` — hm/hf/gate/stack/gsd lineages, L0-L3 hierarchy contract. `.planning/codebase/ARCHITECTURE.md:209-245` — Soft Meta-Concept layer.

## 2. Allowed mutation authority

- Agents, skills, commands, rules, permissions, and OpenCode config may be created or updated here when explicitly authorized by a meta-concept workflow.
- `.opencode/plugins/` may contain thin plugin loader wrappers that point OpenCode at built harness plugin entrypoints. Evidence: `.planning/codebase/STRUCTURE.md:157-164`.
- Primitive/config changes must preserve hm/hf/gate/stack lineage conventions and the L0→L3 delegation hierarchy. Evidence: `.planning/codebase/ARCHITECTURE.md:217-245`, `.planning/codebase/STRUCTURE.md:197-216`.
- Closest-sector deviation: no `src/config/` folder is created for primitive/config boundary guidance; this sector owns soft primitive/config placement while runtime config consumers remain in `src/`.

## 3. Forbidden mutations / explicit no-go boundaries

- `.opencode/` SHALL NOT store internal runtime state; `.hivemind/` is canonical state root. Evidence: `.planning/codebase/ARCHITECTURE.md:247-255`, `.planning/codebase/STRUCTURE.md:124-134`.
- `.opencode/` SHALL NOT be treated as development implementation, source code, or build output. It is exclusively for OpenCode primitives (agents, commands, skills, rules, permissions) that configure runtime behavior.
- `.opencode/` SHALL NOT contain business logic, state persistence, compiled code, or npm package source — those belong in `src/` (Hard Harness) and `.hivemind/` (Internal State).
- `.opencode/state/` is legacy migration-only and must not receive new internal state ownership. Evidence: `.planning/codebase/STRUCTURE.md:295-299`.
- Do not blur hm/hf/gate/stack lineages or ship gsd-* internal developer tooling as product primitives. Evidence: `.planning/codebase/ARCHITECTURE.md:217-233`, `.planning/codebase/STRUCTURE.md:209-216`.
- Do not edit runtime TypeScript implementation here; runtime source authority remains in `src/`.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| OpenCode runtime | Discovers project config, plugin loader, commands, agents, skills, and rules | Runtime state still belongs in `.hivemind/` |
| hm-* lineage agents/skills | Product-dev workflows and specialists | STRICT lineage; no hf-* skill loading by hm-* unless explicitly routed |
| hf-* lineage agents/skills | Meta-concept authoring/building | May modify primitives only under meta-builder authorization |
| gate-* skills | Internal quality gate triad | Project-only quality gates, not shipped as generic product claims |
| stack-* skills | Framework/reference knowledge | Reference only, not implementation authority |
| `src/` Hard Harness tools | Configured through `.opencode/` primitives (agents call tools, commands route to agents) | Never imports from `.opencode/` — reads only through OpenCode SDK |

## 5. Naming and placement conventions

- Agent files use `hm-*`, `hf-*`, or `gsd-*` prefixes according to lineage; skills use `hm-*`, `hf-*`, `gate-*`, `stack-*`, or `gsd-*` prefixes. Evidence: `.planning/codebase/STRUCTURE.md:197-216`.
- Runtime skill location is `.opencode/skills/`; meta-builder source-of-truth is `.hivefiver-meta-builder/skills-lab/` and reflected to `.opencode/skills/`. Evidence: `.planning/codebase/ARCHITECTURE.md:209-215`.
- New agents, skills, and commands should originate from the meta-builder source areas before reflection to `.opencode/`. Evidence: `.planning/codebase/STRUCTURE.md:241-254`.
- Commands use OpenCode command files under `.opencode/commands/`; do not invent parallel command roots.

## 6. Quality gates and evidence expectations

- Primitive changes require discoverability validation, lineage validation, and restart/compile checks when applicable; docs-only edits here are not runtime proof.
- Do not claim permission enforcement, registry completeness, or runtime routing readiness when requirements still mark them missing/partial. Evidence: `.planning/REQUIREMENTS.md:42-56`, `.planning/PROJECT.md:29-42`.
- O3 docs-only guidance remains L5 evidence and cannot change runtime readiness. Evidence: `.planning/ROADMAP.md:47-49`.

## 7. Cross-sector alignment

- **Hard Harness (`src/`):** Runtime implementation. Compiles to dist/. Calls OpenCode SDK. Does not depend on `.opencode/` at build time.
- **Internal State (`.hivemind/`):** Durable persistence. Owned by `src/` modules through tool/hook CQRS boundaries. Canonical per Q6.
- **Meta-Authoring (`.hivefiver-meta-builder/`):** Source-of-truth for primitive authoring. Reflected to `.opencode/` via symlink or sync.
- **Governance (`.planning/`):** Documents architecture, provides phase authorization. Does not mutate `.opencode/`.
- **OMO Adaptation:** Per `.planning/research/omo-adaptation-architecture-2026-05-07.md`, OMO folder roots (`.sisyphus`, `.omx`) are REJECTED; `.opencode/` remains primitives-only.

</system-reminder>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/commands/gsd-stats.md"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin-private/.opencode/commands/gsd-stats.md</path>
<type>file</type>
<content>
1: ---
2: description: Display project statistics — phases, plans, requirements, git metrics, and timeline
3: tools:
4:   read: true
5:   bash: true
6: ---
7: <objective>
8: Display comprehensive project statistics including phase progress, plan execution metrics, requirements completion, git history stats, and project timeline.
9: </objective>
10: 
11: <execution_context>
12: @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/stats.md
13: </execution_context>
14: 
15: <process>
16: Execute end-to-end.
17: </process>

(End of file - total 17 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/commands/hf-absorb.md"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin-private/.opencode/commands/hf-absorb.md</path>
<type>file</type>
<content>
1: ---
2: description: "Absorb dense context (links, text, files, stories, events, actors) into persistent session context through multi-wave swarm processing. Use when you have a packed prompt with URLs, file references, multi-layered narratives, or complex metadata that needs interpretation and persistent storage for ongoing planning."
3: agent: hf-l0-orchestrator
4: subtask: false
5: ---
6: 
7: ## Raw Input
8: 
9: "$ARGUMENTS"
10: 
11: ## Current State
12: 
13: !`cat .hivemind/state/session-context-prompt.md 2>/dev/null | head -5 || echo "No existing session context"`
14: !`git log --oneline -3`
15: !`ls -la .hivemind/state/ 2>/dev/null || echo "No state directory"`
16: 
17: ## Your Job
18: 
19: 1. **Load skill `hf-context-absorb`** — it contains the full wave protocol, subagent dispatch templates, YAML merge rules, and validation gates.
20: 
21: 2. **Execute the wave protocol defined in the skill** — Wave 0 through Wave 4 as specified. You are the orchestrator: delegate every wave to subagents via `task` tool. Do NOT process content yourself.
22: 
23: 3. **The raw input to absorb is `$ARGUMENTS`** — pass it to the skill's Wave 0 delta computation, then through the full pipeline.
24: 
25: 4. **Final target:** `.hivemind/state/session-context-prompt.md` — append-only, never overwrite.
26: 
27: ## Anti-Patterns (DO NOT)
28: 
29: - Do NOT re-specify the wave protocol here — it lives in the skill
30: - Do NOT overwrite session-context-prompt.md — ALWAYS APPEND
31: - Do NOT skip loading the skill — it is the source of truth for the protocol
32: - Do NOT use interactive commands — no `vim`, `nano`, `less`, `git commit` without `-m`

(End of file - total 32 lines)
</content>
```

---

## Assistant (Build · CrofAI: kimi-k2.6 (precision) · 6.2s)

_Thinking:_

Now I'm getting a clearer picture. Let me also look at more GSD commands and the primitive loader to understand how OpenCode commands/agents are structured and how they're parsed.

 

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/features/bootstrap/primitive-loader.ts"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin-private/src/features/bootstrap/primitive-loader.ts</path>
<type>file</type>
<content>
1: import { promises as fs, existsSync } from "node:fs"
2: import path from "node:path"
3: import matter from "gray-matter"
4: import {
5:   AgentFrontmatterSchemaLenient,
6:   CommandFrontmatterSchemaLenient,
7:   SkillFrontmatterSchemaLenient,
8:   OpenCodeConfigSchemaLenient,
9:   MCPServerConfigSchemaLenient,
10: } from "../../schema-kernel/index.js"
11: import type {
12:   AgentFile,
13:   CommandFile,
14:   SkillFile,
15:   ToolFile,
16:   MCPServerConfig,
17:   OpenCodeConfig,
18: } from "../../schema-kernel/index.js"
19: 
20: // ---------------------------------------------------------------------------
21: // Types
22: // ---------------------------------------------------------------------------
23: 
24: export type PrimitiveType = "agent" | "command" | "skill" | "tool" | "mcp"
25: 
26: export interface LoaderOptions {
27:   /** Absolute or relative path to the project root. */
28:   projectRoot: string
29:   /** Optional path to global config directory (~/.config/opencode/). */
30:   globalConfigPath?: string
31:   /** Optional path to opencode.json (defaults to projectRoot/opencode.json). */
32:   opencodeJsonPath?: string
33: }
34: 
35: export interface LoadResult {
36:   agents: Map<string, AgentFile>
37:   commands: Map<string, CommandFile>
38:   skills: Map<string, SkillFile>
39:   mcpServers: Map<string, MCPServerConfig>
40:   config: OpenCodeConfig | null
41:   warnings: string[]
42: }
43: 
44: export type PrimitiveMap = {
45:   agents: Map<string, AgentFile>
46:   commands: Map<string, CommandFile>
47:   skills: Map<string, SkillFile>
48:   tools: Map<string, ToolFile>
49:   mcpServers: Map<string, MCPServerConfig>
50:   config: OpenCodeConfig
51: }
52: 
53: export type SingleLoadResult<T> =
54:   | { success: true; data: T }
55:   | { success: false; error: string }
56: 
57: // ---------------------------------------------------------------------------
58: // Directory scanner
59: // ---------------------------------------------------------------------------
60: 
61: /**
62:  * Scans the `.opencode/` directory tree for agents, commands, skills, and
63:  * tools; reads `opencode.json`; validates all found files against lenient
64:  * schemas; and returns a populated {@link LoadResult} with cross-reference
65:  * warnings.
66:  */
67: export async function loadPrimitives(options: LoaderOptions): Promise<LoadResult> {
68:   const root = path.resolve(options.projectRoot)
69:   const opencodeJsonPath = options.opencodeJsonPath || path.join(root, "opencode.json")
70: 
71:   const result: LoadResult = {
72:     agents: new Map(),
73:     commands: new Map(),
74:     skills: new Map(),
75:     mcpServers: new Map(),
76:     config: null,
77:     warnings: [],
78:   }
79: 
80:   // Scan directories
81:   await scanAgents(root, result, options.globalConfigPath)
82:   await scanCommands(root, result, options.globalConfigPath)
83:   await scanSkills(root, result, options.globalConfigPath)
84: 
85:   // Read opencode.json
86:   const configResult = await readOpencodeJson(opencodeJsonPath, result)
87:   if (configResult) {
88:     result.config = configResult
89:   }
90: 
91:   // Cross-reference validation
92:   await crossReference(root, result, opencodeJsonPath)
93: 
94:   return result
95: }
96: 
97: // ---------------------------------------------------------------------------
98: // Single-file loader
99: // ---------------------------------------------------------------------------
100: 
101: /**
102:  * Reads and parses a single primitive file from disk.
103:  *
104:  * @param filePath - Absolute path to the .md file
105:  * @param type     - Primitive type determines which schema to use
106:  */
107: export async function loadPrimitive(
108:   filePath: string,
109:   type: PrimitiveType,
110: ): Promise<SingleLoadResult<AgentFile | CommandFile | SkillFile>> {
111:   try {
112:     const content = await fs.readFile(filePath, "utf-8")
113:     const parsed = matter(content)
114:     const body = parsed.content.trim()
115: 
116:     switch (type) {
117:       case "agent": {
118:         const fmResult = AgentFrontmatterSchemaLenient.safeParse(parsed.data)
119:         if (!fmResult.success) {
120:           return { success: false, error: formatZodError(fmResult.error) }
121:         }
122:         const data: AgentFile = {
123:           frontmatter: fmResult.data,
124:           body,
125:           filePath,
126:         }
127:         return { success: true, data }
128:       }
129:       case "command": {
130:         const fmResult = CommandFrontmatterSchemaLenient.safeParse(parsed.data)
131:         if (!fmResult.success) {
132:           return { success: false, error: formatZodError(fmResult.error) }
133:         }
134:         const data: CommandFile = {
135:           frontmatter: fmResult.data,
136:           body,
137:           filePath,
138:         }
139:         return { success: true, data }
140:       }
141:       case "skill": {
142:         const fmResult = SkillFrontmatterSchemaLenient.safeParse(parsed.data)
143:         if (!fmResult.success) {
144:           return { success: false, error: formatZodError(fmResult.error) }
145:         }
146:         const dirName = path.basename(path.dirname(filePath))
147:         const data: SkillFile = {
148:           frontmatter: fmResult.data,
149:           body,
150:           directoryName: dirName,
151:           skillPath: filePath,
152:         }
153:         return { success: true, data }
154:       }
155:       default:
156:         return { success: false, error: `Unsupported primitive type for single-file load: ${type}` }
157:     }
158:   } catch (err) {
159:     return { success: false, error: err instanceof Error ? err.message : String(err) }
160:   }
161: }
162: 
163: // ---------------------------------------------------------------------------
164: // Scanners
165: // ---------------------------------------------------------------------------
166: 
167: /**
168:  * Collect all candidate directories for a primitive type.
169:  *
170:  * OpenCode accepts both singular and plural directory names
171:  * (e.g. both .opencode/command/ and .opencode/commands/).
172:  * We scan both and merge results (first-wins on name collision).
173:  *
174:  * @param root - Project root path.
175:  * @param dirNames - Array of directory names to scan (e.g., ["agents", "agent"]).
176:  * @returns Array of existing directory paths.
177:  */
178: function resolvePrimitiveDirs(root: string, dirNames: string[], globalConfigPath?: string): string[] {
179:   const configRoots = [path.join(root, ".opencode")]
180:   if (globalConfigPath) configRoots.push(path.resolve(globalConfigPath))
181:   return configRoots.flatMap((configRoot) => dirNames.map((name) => path.join(configRoot, name)))
182:     .filter((dir) => existsSync(dir))
183: }
184: 
185: async function scanAgents(root: string, result: LoadResult, globalConfigPath?: string): Promise<void> {
186:   const dirs = resolvePrimitiveDirs(root, ["agents", "agent"], globalConfigPath)
187:   for (const agentsDir of dirs) {
188:     const files = await fs.readdir(agentsDir)
189:     for (const file of files) {
190:       if (!file.endsWith(".md")) continue
191:       const filePath = path.join(agentsDir, file)
192:       const stat = await statIfPresent(filePath)
193:       if (!stat) continue
194:       if (!stat.isFile()) continue
195: 
196:       const name = file.replace(/\.md$/, "")
197:       // First-wins: skip if already discovered from a prior directory
198:       if (result.agents.has(name)) continue
199: 
200:       const loadResult = await loadPrimitive(filePath, "agent")
201:       if (loadResult.success) {
202:         result.agents.set(name, loadResult.data as AgentFile)
203:       } else {
204:         result.warnings.push(`Invalid agent frontmatter in ${filePath}: ${loadResult.error}`)
205:       }
206:     }
207:   }
208: }
209: 
210: async function scanCommands(root: string, result: LoadResult, globalConfigPath?: string): Promise<void> {
211:   const dirs = resolvePrimitiveDirs(root, ["commands", "command"], globalConfigPath)
212:   for (const commandsDir of dirs) {
213:     const files = await fs.readdir(commandsDir)
214:     for (const file of files) {
215:       if (!file.endsWith(".md")) continue
216:       const filePath = path.join(commandsDir, file)
217:       const stat = await statIfPresent(filePath)
218:       if (!stat) continue
219:       if (!stat.isFile()) continue
220: 
221:       const name = file.replace(/\.md$/, "")
222:       // First-wins: skip if already discovered from a prior directory
223:       if (result.commands.has(name)) continue
224: 
225:       const loadResult = await loadPrimitive(filePath, "command")
226:       if (loadResult.success) {
227:         result.commands.set(name, loadResult.data as CommandFile)
228:       } else {
229:         result.warnings.push(`Invalid command frontmatter in ${filePath}: ${loadResult.error}`)
230:       }
231:     }
232:   }
233: }
234: 
235: async function statIfPresent(filePath: string): Promise<Awaited<ReturnType<typeof fs.stat>> | null> {
236:   try {
237:     return await fs.stat(filePath)
238:   } catch (caughtError) {
239:     if (isNodeError(caughtError) && caughtError.code === "ENOENT") return null
240:     throw caughtError
241:   }
242: }
243: 
244: function isNodeError(errorValue: unknown): errorValue is NodeJS.ErrnoException {
245:   return errorValue instanceof Error && "code" in errorValue
246: }
247: 
248: async function scanSkills(root: string, result: LoadResult, globalConfigPath?: string): Promise<void> {
249:   const dirs = resolvePrimitiveDirs(root, ["skills", "skill"], globalConfigPath)
250:   for (const skillsDir of dirs) {
251:     const entries = await fs.readdir(skillsDir, { withFileTypes: true })
252:     for (const entry of entries) {
253:       if (!entry.isDirectory()) continue
254:       const skillPath = path.join(skillsDir, entry.name, "SKILL.md")
255:       if (!existsSync(skillPath)) continue
256: 
257:       // First-wins: skip if already discovered from a prior directory
258:       if (result.skills.has(entry.name)) continue
259: 
260:       const loadResult = await loadPrimitive(skillPath, "skill")
261:       if (loadResult.success) {
262:         result.skills.set(entry.name, loadResult.data as SkillFile)
263:       } else {
264:         result.warnings.push(`Invalid skill frontmatter in ${skillPath}: ${loadResult.error}`)
265:       }
266:     }
267:   }
268: }
269: 
270: // ---------------------------------------------------------------------------
271: // Config reader
272: // ---------------------------------------------------------------------------
273: 
274: async function readOpencodeJson(
275:   opencodeJsonPath: string,
276:   result: LoadResult,
277: ): Promise<OpenCodeConfig | null> {
278:   if (!existsSync(opencodeJsonPath)) return null
279: 
280:   try {
281:     const content = await fs.readFile(opencodeJsonPath, "utf-8")
282:     const raw = JSON.parse(content)
283:     const parsed = OpenCodeConfigSchemaLenient.safeParse(raw)
284:     if (!parsed.success) {
285:       result.warnings.push(`Invalid opencode.json: ${formatZodError(parsed.error)}`)
286:       return null
287:     }
288: 
289:     // Extract MCP servers if present
290:     if (raw.mcp && typeof raw.mcp === "object") {
291:       for (const [name, cfg] of Object.entries(raw.mcp)) {
292:         const mcpResult = MCPServerConfigSchemaLenient.safeParse(cfg)
293:         if (mcpResult.success) {
294:           result.mcpServers.set(name, mcpResult.data)
295:         } else {
296:           result.warnings.push(`Invalid MCP server config "${name}": ${formatZodError(mcpResult.error)}`)
297:         }
298:       }
299:     }
300: 
301:     return parsed.data
302:   } catch (err) {
303:     result.warnings.push(`Failed to read opencode.json: ${err instanceof Error ? err.message : String(err)}`)
304:     return null
305:   }
306: }
307: 
308: // ---------------------------------------------------------------------------
309: // Cross-reference validation
310: // ---------------------------------------------------------------------------
311: 
312: async function crossReference(
313:   _root: string,
314:   result: LoadResult,
315:   opencodeJsonPath: string,
316: ): Promise<void> {
317:   if (!existsSync(opencodeJsonPath)) return
318: 
319:   let raw: Record<string, unknown> | null = null
320:   try {
321:     const content = await fs.readFile(opencodeJsonPath, "utf-8")
322:     raw = JSON.parse(content) as Record<string, unknown>
323:   } catch {
324:     return
325:   }
326: 
327:   if (raw.agent && typeof raw.agent === "object") {
328:     const configAgents = new Set(Object.keys(raw.agent))
329:     for (const [name] of result.agents) {
330:       if (!configAgents.has(name)) {
331:         result.warnings.push(`Orphaned agent "${name}": exists on disk but not referenced in opencode.json`)
332:       }
333:     }
334:   }
335: 
336:   if (raw.command && typeof raw.command === "object") {
337:     const configCommands = new Set(Object.keys(raw.command))
338:     for (const [name] of result.commands) {
339:       if (!configCommands.has(name)) {
340:         result.warnings.push(`Orphaned command "${name}": exists on disk but not referenced in opencode.json`)
341:       }
342:     }
343:   }
344: 
345:   if (raw.skill && typeof raw.skill === "object") {
346:     const configSkills = new Set(Object.keys(raw.skill))
347:     for (const [name] of result.skills) {
348:       if (!configSkills.has(name)) {
349:         result.warnings.push(`Orphaned skill "${name}": exists on disk but not referenced in opencode.json`)
350:       }
351:     }
352:   }
353: }
354: 
355: // ---------------------------------------------------------------------------
356: // Helpers
357: // ---------------------------------------------------------------------------
358: 
359: function formatZodError(error: import("zod").ZodError): string {
360:   return error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ")
361: }

(End of file - total 361 lines)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin-private/src/features/bootstrap/AGENTS.md
# Bootstrap Feature Guidance

**Parent sector:** `src/features/AGENTS.md` | **Architecture:** `.planning/codebase/ARCHITECTURE.md` | **Classification:** Hard Harness — runtime-feature (write-side: primitive loading, framework detection)

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/features/bootstrap/` owns bootstrap structure, primitive loading, framework detection, and validation helpers. Key modules: `primitive-loader.ts` (loads OpenCode primitives), `primitive-registry.ts` (registry of discovered primitives), `primitive-scanners.ts` (filesystem scanning), `framework-detector.ts` (framework detection), `runtime-validator.ts` (runtime validation), `cross-primitive-validator.ts` (cross-primitive dependency validation), `structure.ts` (bootstrap structure). The `control-plane/` subdirectory owns deeper bootstrap control-plane logic; legacy `runtime-detection/` was removed in Phase 18 as dead code. Source evidence: `.planning/codebase/ARCHITECTURE.md:136-183`.

## 2. Allowed mutation authority

- Bootstrap may scan filesystem, load primitives, and detect frameworks at initialization time.
- Bootstrap may maintain in-memory registries of discovered primitives.
- Bootstrap may validate cross-primitive dependencies and runtime contracts.

## 3. Forbidden mutations / explicit no-go boundaries

- Bootstrap SHALL NOT store runtime state in `.opencode/`; `.hivemind/` is canonical. Source evidence: `.planning/codebase/ARCHITECTURE.md:247-255`.
- Bootstrap SHALL NOT become a hidden tool implementation; tool entrypoints live in `src/tools/`.
- Bootstrap SHALL NOT exceed the 500 LOC module cap. Source evidence: `.planning/codebase/CONVENTIONS.md:19-28`.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| `src/tools/config/` | Calls bootstrap for primitive loading and validation | Tools own CQRS mutation; bootstrap owns detection |
| `src/plugin.ts` | Wires bootstrap at composition time | Keeps assembly logic only |
| `src/schema-kernel/bootstrap.schema.ts` | Provides validation contracts | Schemas are leaf; bootstrap owns behavior |

## 5. Naming and placement conventions

- Modules use `kebab-case.ts` in `src/features/bootstrap/`. Source evidence: `.planning/codebase/STRUCTURE.md:186-195`.
- Subdirectories: `control-plane/`.
- Tests mirror under `tests/features/bootstrap/`.

## 6. Quality gates and evidence expectations

- Code changes require `npm run typecheck` and scoped tests. Source evidence: `.planning/codebase/TESTING.md:41-48`.
- Bootstrap changes must verify primitive loading correctness.
- Docs-only edits remain L5 evidence. Source evidence: `.planning/ROADMAP.md:47-49`.


Instructions from: /Users/apple/hivemind-plugin-private/src/features/AGENTS.md
# Features Sector Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/features/` owns standalone runtime feature modules that are neither routing, config, coordination, task-management, nor shared leaf utilities. Features include bootstrap (primitive loading and framework detection), background-command (PTY/headless execution), doc-intelligence (markdown parsing/chunking), prompt-packet (packet creation and compaction), runtime-pressure (pressure scoring and control-plane decisions), sdk-supervisor (read-only SDK diagnostics), and agent-work-contracts (durable contract creation/export). Source evidence: `.planning/codebase/ARCHITECTURE.md:136-183`, `.planning/codebase/STRUCTURE.md:110-112`. Source-plane classification: Hard Harness — runtime features belong to `src/` (not `.opencode/`). Each feature is a dedicated npm-package module; `.opencode/` Soft Meta-Concepts configure features from outside the package boundary.

## 2. Allowed mutation authority

- Feature modules may define and export typed public interfaces consumed by tools, hooks, and coordination modules.
- Features may perform internal state computation (pressure scoring, profile resolution, document parsing) without durable writes.
- Agent-work-contracts may write durable contract records through `.hivemind/` authority surfaces. Source evidence: `.planning/codebase/ARCHITECTURE.md:247-255`.
- Features follow factory injection patterns ADAPTED from OMO (`.planning/research/omo-adaptation-architecture-2026-05-07.md`): typed dependencies are injected at composition time, not hidden globals.

## 3. Forbidden mutations / explicit no-go boundaries

- Features SHALL NOT store runtime state in `.opencode/`; `.hivemind/` is the canonical state root. Source evidence: `.planning/codebase/ARCHITECTURE.md:247-255`.
- Features SHALL NOT become hidden tool implementations; tool entrypoints live in `src/tools/`.
- Features SHALL NOT bypass schema validation; contracts belong in `src/schema-kernel/`.
- Features SHALL NOT exceed the 500 LOC module cap or introduce circular imports. Source evidence: `.planning/codebase/CONVENTIONS.md:19-28`.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| `src/tools/` | Calls feature modules to perform runtime logic | Tools own CQRS mutation; features own computation |
| `src/hooks/` | Reads feature state for guard and observer decisions | Hooks must not mutate feature state directly |
| `src/plugin.ts` | Wires feature dependencies at composition time | Keeps assembly logic only |
| Tests | Validate feature behavior and public exports | Unit tests do not prove integration readiness |

## 5. Naming and placement conventions

- Each feature lives in its own subdirectory: `src/features/{feature-name}/index.ts`. Source evidence: `.planning/codebase/STRUCTURE.md:186-195`.
- Feature types belong in `{feature-name}/types.ts`; schemas belong in `src/schema-kernel/`.
- Empty reserved folders must use `.gitkeep`. Source evidence: `.planning/codebase/STRUCTURE.md:268-278`.
- TypeScript strict ESM with `.js` import extensions and `import type` for type-only imports. Source evidence: `.planning/codebase/CONVENTIONS.md:80-98`.

## 6. Quality gates and evidence expectations

- Code changes require `npm run typecheck` and scoped `npx vitest run tests/...` evidence. Source evidence: `.planning/codebase/TESTING.md:41-48`.
- Integration readiness cannot be claimed from unit tests or docs-only evidence. Source evidence: `.planning/ROADMAP.md:47-49`.
- Docs-only edits remain L5 evidence and must not alter readiness status.

</system-reminder>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/commands/hf-create.md"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin-private/.opencode/commands/hf-create.md</path>
<type>file</type>
<content>
1: ---
2: description: "Create a new skill, agent, command, or tool. Routes to the right specialist. Triggers: 'create a skill', 'add an agent', 'build a command', 'make a tool'."
3: agent: hf-l0-orchestrator
4: subtask: true
5: ---
6: 
7: <objective>
8: Create a new OpenCode meta-concept (skill, agent, command, or tool) by routing to the appropriate Hivefiver specialist agent.
9: 
10: Acts as the entry point for all meta-concept creation. Never does the work itself. Classifies intent, routes to specialist, verifies output.
11: </objective>
12: 
13: <execution_context>
14: @.hivefiver-hm-meta-builder/workflows-lab/active/refactoring/create.md
15: </execution_context>
16: 
17: <context>
18: $ARGUMENTS
19: </context>
20: 
21: <process>
22: Execute the create workflow from @.hivefiver-hm-meta-builder/workflows-lab/active/refactoring/create.md end-to-end.
23: Preserve all workflow gates (intent classification, routing, verification).
24: </process>

(End of file - total 24 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/commands/gsd-audit-fix.md"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin-private/.opencode/commands/gsd-audit-fix.md</path>
<type>file</type>
<content>
1: ---
2: type: prompt
3: description: Autonomous audit-to-fix pipeline — find issues, classify, fix, test, commit
4: argument-hint: "--source <audit-uat> [--severity <medium|high|all>] [--max N] [--dry-run]"
5: tools:
6:   read: true
7:   write: true
8:   edit: true
9:   bash: true
10:   grep: true
11:   glob: true
12:   agent: true
13:   question: true
14: ---
15: <objective>
16: Run an audit, classify findings as auto-fixable vs manual-only, then autonomously fix
17: auto-fixable issues with test verification and atomic commits.
18: 
19: Flags:
20: - `--max N` — maximum findings to fix (default: 5)
21: - `--severity high|medium|all` — minimum severity to process (default: medium)
22: - `--dry-run` — classify findings without fixing (shows classification table)
23: - `--source <audit>` — which audit to run (default: audit-uat)
24: </objective>
25: 
26: <execution_context>
27: @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/audit-fix.md
28: </execution_context>
29: 
30: <process>
31: Execute end-to-end.
32: </process>

(End of file - total 32 lines)
</content>
```

---

## Assistant (Build · CrofAI: kimi-k2.6 (precision) · 8.0s)

_Thinking:_

Great, I now have a much clearer picture. Let me now look at:
1. The OpenCode SDK to understand the actual API for agent switching, command primitives
2. The schema-kernel for command/agent frontmatter definitions
3. The ecosystem repos mentioned in the user's prompt

Let me now delegate the deep research tasks to subagents, as per the rules. The user specifically asked me to:
1. Research via GSD
2. Use task tool delegation
3. Route gsd

Let me first check the current state of the session and then delegate.

 

**Tool: todowrite**

**Input:**
```json
{
  "todos": [
    {
      "priority": "high",
      "content": "Đọc implementation hiện tại của execute-slash-command tool",
      "status": "completed"
    },
    {
      "priority": "high",
      "content": "Khảo sát cấu trúc .opencode/commands và .opencode/agents",
      "status": "completed"
    },
    {
      "priority": "high",
      "content": "Nghiên cứu OpenCode SDK về command/agent primitives qua Context7",
      "status": "in_progress"
    },
    {
      "priority": "high",
      "content": "Nghiên cứu GSD command parsing patterns",
      "status": "pending"
    },
    {
      "priority": "medium",
      "content": "Nghiên cứu ecosystem repos (opencode-pty, background-agents, awesome-opencode)",
      "status": "pending"
    },
    {
      "priority": "high",
      "content": "Delegate task research tổng hợp và phân tích gaps",
      "status": "pending"
    },
    {
      "priority": "high",
      "content": "Tổng hợp báo cáo và đề xuất giải pháp",
      "status": "pending"
    }
  ]
}
```

**Output:**
```
[
  {
    "content": "Đọc implementation hiện tại của execute-slash-command tool",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Khảo sát cấu trúc .opencode/commands và .opencode/agents",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Nghiên cứu OpenCode SDK về command/agent primitives qua Context7",
    "status": "in_progress",
    "priority": "high"
  },
  {
    "content": "Nghiên cứu GSD command parsing patterns",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Nghiên cứu ecosystem repos (opencode-pty, background-agents, awesome-opencode)",
    "status": "pending",
    "priority": "medium"
  },
  {
    "content": "Delegate task research tổng hợp và phân tích gaps",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Tổng hợp báo cáo và đề xuất giải pháp",
    "status": "pending",
    "priority": "high"
  }
]
```

---

## Assistant (Build · CrofAI: kimi-k2.6 (precision) · 12.2s)

_Thinking:_

Now I need to delegate the deep research tasks. The user asked me to route via GSD and use task delegation. Let me now:

1. First check the OpenCode SDK via Context7 for agent/command primitives
2. Check the ecosystem repos
3. Then synthesize

But the user said "tất cả đều thực hiện qua task tool delegation và route gsd" - everything through task tool delegation and route GSD.

Let me delegate the research to gsd-* agents for the deep investigation parts. I'll create multiple delegated research tasks.

However, per the rules:
- "DO DELEGATION IN BATCH SEQUENTIALLY, DO NOT ALLOW MORE THAN 2 PARALLEL TASK DELEGATION."
- I should use gsd-* agents for delegation

Let me first check the session tracker to understand current session state, then delegate research tasks.

Actually, first let me do some quick initial research via Context7 and web search to understand the OpenCode SDK primitives, then delegate the deeper research.

Trước khi delegate research, tôi cần nắm nhanh OpenCode SDK API surface qua Context7 và web search.

**Tool: context7_resolve-library-id**

**Input:**
```json
{
  "query": "OpenCode SDK command execution, agent switching, TUI prompt pipeline, session management API",
  "libraryName": "@opencode-ai/sdk"
}
```

**Output:**
```
Available Libraries:

- Title: Opencode SDK
- Context7-compatible library ID: /anomalyco/opencode-sdk-js
- Description: Official TypeScript library providing convenient access to the Opencode REST API with support for streaming responses, comprehensive error handling, and automatic retries.
- Code Snippets: 127
- Source Reputation: High
- Benchmark Score: 65.6
----------
- Title: OpenCode
- Context7-compatible library ID: /anomalyco/opencode
- Description: OpenCode is an open-source, provider-agnostic AI coding agent that offers LSP support, focuses on a terminal user interface (TUI), and utilizes a client/server architecture for flexible development.
- Code Snippets: 1142
- Source Reputation: High
- Benchmark Score: 76.1
----------
- Title: OpenCode
- Context7-compatible library ID: /opencode-ai/opencode
- Description: OpenCode is a Go-based CLI application providing a powerful terminal-based AI assistant for developers, featuring a TUI for coding assistance, debugging, and tool integration with support for multiple AI providers.
- Code Snippets: 47
- Source Reputation: Medium
- Benchmark Score: 68.7
----------
- Title: Opencode SDK Python
- Context7-compatible library ID: /sst/opencode-sdk-python
- Description: The Opencode Python library provides convenient access to the Opencode REST API from any Python 3.8+ application, offering synchronous and asynchronous clients with type definitions for requests and responses.
- Code Snippets: 39
- Source Reputation: High
- Benchmark Score: 15
----------
- Title: OpenCode
- Context7-compatible library ID: /huynguyen03dev/opencode-setup
- Description: OpenCode is a terminal user interface (TUI) application that orchestrates specialized AI agents, commands, and skills to automate software engineering tasks and project management workflows.
- Code Snippets: 354
- Source Reputation: Medium
- Benchmark Score: 68.1
```

**Tool: web-reader_webReader**

**Input:**
```json
{
  "url": "https://opencode.ai/docs",
  "timeout": 20
}
```

**Output:**
```
"{\"title\":\"简介\",\"description\":\"开始使用 OpenCode。\",\"url\":\"https://opencode.ai/docs\",\"content\":\"__OpenCode__ 是一个开源的 AI 编码代理。它提供终端界面、桌面应用和 IDE 扩展等多种使用方式。\\n\\n![Image 1: 使用 opencode 主题的 OpenCode TUI](https://opencode.ai/docs/_astro/screenshot.CQjBbRyJ_1dLadc.webp)\\n\\n让我们开始吧。\\n\\n---\\n\\n#### 前提条件\\n\\n要在终端中使用 OpenCode，你需要：\\n\\n1. 一款现代终端模拟器，例如：\\n\\n   - WezTerm，跨平台\\n   - Alacritty，跨平台\\n   - Ghostty，Linux 和 macOS\\n   - Kitty，Linux 和 macOS\\n2. 你想使用的 LLM 提供商的 API 密钥。\\n\\n---\\n\\n## 安装\\n\\n安装 OpenCode 最简单的方法是通过安装脚本。\\n\\n```\\ncurl -fsSL https://opencode.ai/install | bash\\n```\\n\\n你也可以使用以下方式安装：\\n\\n- __使用 Node.js__\\n\\n  - npm\\n  - Bun\\n  - pnpm\\n  - Yarn\\n\\n  ```\\n  npm install -g opencode-ai\\n  ```\\n- __在 macOS 和 Linux 上使用 Homebrew__\\n\\n  ```\\n  brew install anomalyco/tap/opencode\\n  ```\\n\\n  > 我们推荐使用 OpenCode tap 以获取最新版本。官方的 `brew install opencode` formula 由 Homebrew 团队维护，更新频率较低。\\n- __在 Arch Linux 上安装__\\n\\n  ```\\n  sudo pacman -S opencode           # Arch Linux (Stable)\\n\\n  paru -S opencode-bin              # Arch Linux (Latest from AUR)\\n  ```\\n\\n#### Windows\\n\\n- __使用 Chocolatey__\\n- __使用 Scoop__\\n- __使用 NPM__\\n\\n  ```\\n  npm install -g opencode-ai\\n  ```\\n- __使用 Mise__\\n\\n  ```\\n  mise use -g github:anomalyco/opencode\\n  ```\\n- __使用 Docker__\\n\\n  ```\\n  docker run -it --rm ghcr.io/anomalyco/opencode\\n  ```\\n\\n在 Windows 上通过 Bun 安装 OpenCode 的支持目前正在开发中。\\n\\n你也可以从 Releases 页面直接下载二进制文件。\\n\\n---\\n\\n## 配置\\n\\n通过 OpenCode，你可以配置 API 密钥来使用任意 LLM 提供商。\\n\\n如果你刚开始接触 LLM 提供商，我们推荐使用 OpenCode Zen。这是一组经过 OpenCode 团队测试和验证的精选模型。\\n\\n1. 在 TUI 中运行 `/connect` 命令，选择 opencode，然后前往 opencode.ai/auth。\\n2. 登录并添加账单信息，然后复制你的 API 密钥。\\n3. 粘贴你的 API 密钥。\\n\\n你也可以选择其他提供商。了解更多。\\n\\n---\\n\\n## 初始化\\n\\n配置好提供商后，导航到你想要处理的项目目录。\\n\\n然后运行 OpenCode。\\n\\n接下来，运行以下命令为项目初始化 OpenCode。\\n\\nOpenCode 会分析你的项目并在项目根目录创建一个 `AGENTS.md` 文件。\\n\\n这有助于 OpenCode 理解项目结构和编码规范。\\n\\n---\\n\\n## 使用\\n\\n现在你已经准备好使用 OpenCode 来处理项目了，尽管提问吧！\\n\\n如果你是第一次使用 AI 编码代理，以下示例可能会对你有所帮助。\\n\\n---\\n\\n### 提问\\n\\n你可以让 OpenCode 为你讲解代码库。\\n\\n```\\nHow is authentication handled in @packages/functions/src/api/index.ts\\n```\\n\\n当你遇到不熟悉的代码时，这个功能非常有用。\\n\\n---\\n\\n### 添加功能\\n\\n你可以让 OpenCode 为项目添加新功能。不过我们建议先让它制定一个计划。\\n\\n1. __制定计划__\\n\\n   OpenCode 有一个_计划模式_，该模式下它不会进行任何修改，而是建议_如何_实现该功能。\\n\\n   使用 __Tab__ 键切换到计划模式。你会在右下角看到模式指示器。\\n\\n   接下来描述你希望它做什么。\\n\\n   ```\\n   When a user deletes a note, we'd like to flag it as deleted in the database.\\n\\n   Then create a screen that shows all the recently deleted notes.\\n\\n   From this screen, the user can undelete a note or permanently delete it.\\n   ```\\n\\n   你需要提供足够的细节，让 OpenCode 理解你的需求。可以把它当作团队中的一名初级开发者来沟通。\\n2. __迭代计划__\\n\\n   当它给出计划后，你可以提供反馈或补充更多细节。\\n\\n   ```\\n   We'd like to design this new screen using a design I've used before.\\n\\n   [Image #1] Take a look at this image and use it as a reference.\\n   ```\\n\\n   OpenCode 可以扫描你提供的图片并将其添加到提示词中。只需将图片拖放到终端窗口即可。\\n3. __构建功能__\\n\\n   当你对计划满意后，再次按 __Tab__ 键切换回_构建模式_。\\n\\n   然后让它开始实施。\\n\\n   ```\\n   Sounds good! Go ahead and make the changes.\\n   ```\\n\\n---\\n\\n### 直接修改\\n\\n对于比较简单的修改，你可以直接让 OpenCode 实施，无需先审查计划。\\n\\n```\\nWe need to add authentication to the /settings route. Take a look at how this is\\n\\nhandled in the /notes route in @packages/functions/src/notes.ts and implement\\n\\nthe same logic in @packages/functions/src/settings.ts\\n```\\n\\n请确保提供足够的细节，以便 OpenCode 做出正确的修改。\\n\\n---\\n\\n### 撤销修改\\n\\n假设你让 OpenCode 做了一些修改。\\n\\n```\\nCan you refactor the function in @packages/functions/src/api/index.ts?\\n```\\n\\n但你发现结果不是你想要的。你__可以使用__ `/undo` 命令来撤销修改。\\n\\nOpenCode 会还原所做的修改，并重新显示你之前的消息。\\n\\n```\\nCan you refactor the function in @packages/functions/src/api/index.ts?\\n```\\n\\n你可以调整提示词，让 OpenCode 重新尝试。\\n\\n你也__可以使用__ `/redo` 命令来重做修改。\\n\\n---\\n\\n## 分享\\n\\n你与 OpenCode 的对话可以与团队分享。\\n\\n这会生成当前对话的链接并复制到剪贴板。\\n\\n这是一个与 OpenCode 的示例对话。\\n\\n---\\n\\n## 个性化\\n\\n以上就是全部内容！你现在已经是 OpenCode 的使用高手了。\\n\\n要让它更符合你的习惯，我们推荐选择一个主题、自定义快捷键、配置代码格式化工具、创建自定义命令，或者探索 OpenCode 配置。\",\"publishedTime\":\"2026-05-21T10:03:22.000Z\",\"metadata\":{\"og:image\":\"https://social-cards.sst.dev/opencode-docs/JUU3JUFFJTgwJUU0JUJCJThC.png?desc=%E5%BC%80%E5%A7%8B%E4%BD%BF%E7%94%A8%20OpenCode%E3%80%82\",\"og:type\":\"article\",\"twitter:card\":\"summary_large_image\",\"og:site_name\":\"OpenCode\",\"og:title\":\"简介\",\"description\":\"开始使用 OpenCode。\",\"generator\":[\"Astro v5.7.13\",\"Starlight v0.34.3\"],\"og:description\":\"开始使用 OpenCode。\",\"twitter:image\":\"https://social-cards.sst.dev/opencode-docs/JUU3JUFFJTgwJUU0JUJCJThC.png?desc=%E5%BC%80%E5%A7%8B%E4%BD%BF%E7%94%A8%20OpenCode%E3%80%82\",\"viewport\":\"width=device-width, initial-scale=1\",\"og:locale\":\"zh-CN\",\"lang\":\"zh-CN\",\"og:url\":\"https://opencode.ai/docs/zh-cn/\"},\"external\":{\"stylesheet\":{\"/docs/_astro/_id_.TCpEMoFe.css\":{},\"/docs/_astro/ec.4c0k7.css\":{},\"/docs/_astro/print.DNXP8c50.css\":{\"media\":\"print\"}},\"shortcut\":{\"/docs/favicon-v3.svg\":{\"type\":\"image/svg+xml\"}},\"icon\":{\"/favicon-v3.ico\":{\"sizes\":\"32x32\"},\"/favicon-96x96-v3.png\":{\"sizes\":\"96x96\",\"type\":\"image/png\"}},\"alternate\":{\"https://opencode.ai/docs/pl/\":{},\"https://opencode.ai/docs/tr/\":{},\"https://opencode.ai/docs/da/\":{},\"https://opencode.ai/docs/de/\":{},\"https://opencode.ai/docs/ko/\":{},\"https://opencode.ai/docs/ru/\":{},\"https://opencode.ai/docs/zh-cn/\":{},\"https://opencode.ai/docs/fr/\":{},\"https://opencode.ai/docs/it/\":{},\"https://opencode.ai/docs/es/\":{},\"https://opencode.ai/docs/ar/\":{},\"https://opencode.ai/docs/bs/\":{},\"https://opencode.ai/docs/\":{},\"https://opencode.ai/docs/nb/\":{},\"https://opencode.ai/docs/th/\":{},\"https://opencode.ai/docs/zh-tw/\":{},\"https://opencode.ai/docs/pt-br/\":{},\"https://opencode.ai/docs/ja/\":{}},\"canonical\":{\"https://opencode.ai/docs/zh-cn/\":{}},\"sitemap\":{\"/docs/sitemap-index.xml\":{}},\"apple-touch-icon\":{\"/apple-touch-icon-v3.png\":{\"sizes\":\"180x180\"}}}}"
```

---

## Assistant (Build · CrofAI: kimi-k2.6 (precision) · 9.5s)

_Thinking:_

Let me query Context7 for the actual OpenCode SDK plugin API to understand the tool(), session, and TUI methods available.

 

**Tool: context7_query-docs**

**Input:**
```json
{
  "libraryId": "/anomalyco/opencode",
  "query": "Plugin API: tool() definition, session management, TUI appendPrompt submitPrompt clearPrompt, client API, agent switching"
}
```

**Output:**
```
### Access session context in tools

Source: https://github.com/anomalyco/opencode/blob/dev/packages/web/src/content/docs/es/custom-tools.mdx

Tools receive context information about the current session including agent, sessionID, messageID, directory, and worktree. Use context.directory for the session working directory and context.worktree for the git root.

```TypeScript
import { tool } from "@opencode-ai/plugin"

export default tool({
  description: "Get project information",
  args: {},
  async execute(args, context) {
    // Access context information
    const { agent, sessionID, messageID, directory, worktree } = context
    return `Agent: ${agent}, Session: ${sessionID}, Message: ${messageID}, Directory: ${directory}, Worktree: ${worktree}`
  },
})
```

--------------------------------

### Create a basic tool with tool() helper

Source: https://github.com/anomalyco/opencode/blob/dev/packages/web/src/content/docs/es/custom-tools.mdx

Define a single tool using the tool() helper from @opencode-ai/plugin for type safety and validation. The filename becomes the tool name.

```TypeScript
import { tool } from "@opencode-ai/plugin"

export default tool({
  description: "Query the project database",
  args: {
    query: tool.schema.string().describe("SQL query to execute"),
  },
  async execute(args) {
    // Your database logic here
    return `Executed query: ${args.query}`
  },
})
```

--------------------------------

### Control TUI Interface with JavaScript

Source: https://github.com/anomalyco/opencode/blob/dev/packages/web/src/content/docs/sdk.mdx

This snippet demonstrates how to interact with the Terminal User Interface (TUI) using the client API. It shows how to append text to the prompt and display toast notifications for user feedback.

```javascript
// Control TUI interface
await client.tui.appendPrompt({
  body: { text: "Add this to prompt" }
})

await client.tui.showToast({
  body: { message: "Task completed", variant: "success" }
})
```

--------------------------------

### Create and Manage Sessions

Source: https://github.com/anomalyco/opencode/blob/dev/packages/web/src/content/docs/bs/sdk.mdx

Initialize a new session with a title and retrieve all existing sessions. Sessions are the primary container for managing conversations and executing commands within the OpenCode environment.

```javascript
const session = await client.session.create({
  body: { title: "My session" },
})

const sessions = await client.session.list()
```

--------------------------------

### POST /api/session/:sessionID/prompt

Source: https://github.com/anomalyco/opencode/blob/dev/specs/v2/api.html

Creates a user message within a session and queues the agent loop for processing.

```APIDOC
## POST /api/session/:sessionID/prompt

### Description
Create a user message and queue the agent loop.

### Method
POST

### Endpoint
/api/session/:sessionID/prompt

### Parameters
#### Path Parameters
- **sessionID** (SessionID) - Required - The ID of the session.

#### Request Body
- **prompt** (Prompt) - Required - The user prompt.
- **delivery** ("immediate" | "deferred") - Optional - Delivery method for the prompt.
```
```

**Tool: context7_query-docs**

**Input:**
```json
{
  "libraryId": "/anomalyco/opencode",
  "query": "command frontmatter YAML fields: agent, subtask, argument-hint, type, description. How OpenCode discovers and parses commands from .opencode/commands/ directory"
}
```

**Output:**
```
### Create Custom Command with Markdown

Source: https://github.com/anomalyco/opencode/blob/dev/packages/web/src/content/docs/commands.mdx

Define a custom command by creating a markdown file in the .opencode/commands/ directory with frontmatter properties and a template prompt. The filename becomes the command name accessible via the TUI.

```markdown
---
description: Run tests with coverage
agent: build
model: anthropic/claude-3-5-sonnet-20241022
---

Run the full test suite with coverage report and show any failures.
Focus on the failing tests and suggest fixes.
```

--------------------------------

### Configure Custom Commands in JSON

Source: https://github.com/anomalyco/opencode/blob/dev/packages/web/src/content/docs/commands.mdx

Define custom commands in the OpenCode configuration file using the command option. Each command requires a template (the prompt), description, and optional agent/model settings.

```json
{
  "$schema": "https://opencode.ai/config.json",
  "command": {
    "test": {
      "template": "Run the full test suite with coverage report and show any failures.\nFocus on the failing tests and suggest fixes.",
      "description": "Run tests with coverage",
      "agent": "build",
      "model": "anthropic/claude-3-5-sonnet-20241022"
    }
  }
}
```

--------------------------------

### Define Custom Commands

Source: https://github.com/anomalyco/opencode/blob/dev/packages/web/src/content/docs/config.mdx

Create custom commands for repetitive tasks, specifying a template, description, agent, and model for each command in `opencode.jsonc`.

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "command": {
    "test": {
      "template": "Run the full test suite with coverage report and show any failures.\nFocus on the failing tests and suggest fixes.",
      "description": "Run tests with coverage",
      "agent": "build",
      "model": "anthropic/claude-haiku-4-5"
    },
    "component": {
      "template": "Create a new React component named $ARGUMENTS with TypeScript support.\nInclude proper typing and basic structure.",
      "description": "Create a new component"
    }
  }
}
```

--------------------------------

### Configure Command Description in opencode.json

Source: https://github.com/anomalyco/opencode/blob/dev/packages/web/src/content/docs/commands.mdx

This snippet demonstrates how to use the `description` option within the `opencode.json` configuration file. It allows you to provide a brief, human-readable description for a specific command, which is then displayed in the TUI when the command is typed.

```json
{
  "command": {
    "test": {
      "description": "Run tests with coverage"
    }
  }
}
```

--------------------------------

### Specify Agent for Command Execution in opencode.json

Source: https://github.com/anomalyco/opencode/blob/dev/packages/web/src/content/docs/commands.mdx

This configuration snippet shows how to assign a specific agent to execute a command using the `agent` option in `opencode.json`. This is an optional setting; if not specified, the command defaults to the current agent. It can also trigger subagent invocations if the specified agent is a subagent.

```json
{
  "command": {
    "review": {
      "agent": "plan"
    }
  }
}
```
```

---

## Assistant (Build · CrofAI: kimi-k2.6 (precision) · 6.9s)

_Thinking:_

Now I have good data. Let me also look at the ecosystem repos via the awesome-opencode list, and the opencode-pty repo for reference. Let me also check the schema-kernel for the command/agent frontmatter definitions.

 

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/schema-kernel"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin-private/src/schema-kernel</path>
<type>directory</type>
<entries>
agent-frontmatter.schema.ts
agent-work-contract.schema.ts
AGENTS.md
bootstrap.schema.ts
command-engine.schema.ts
command-frontmatter.schema.ts
config-precedence.schema.ts
doc-intelligence.schema.ts
generate-config-json-schema.ts
hivemind-configs.schema.ts
index.ts
mcp-server.schema.ts
prompt-enhance.schema.ts
runtime-pressure.schema.ts
sdk-supervisor.schema.ts
session-tracker.schema.ts
session-view.schema.ts
skill-metadata.schema.ts
tool.schema.ts
trajectory.schema.ts

(20 entries)
</entries>
```

**Tool: tavily_tavily_extract**

**Input:**
```json
{
  "urls": [
    "https://github.com/shekohex/opencode-pty"
  ],
  "extract_depth": "basic"
}
```

**Output:**
```
{"results":[{"url":"https://github.com/shekohex/opencode-pty","title":"GitHub - shekohex/opencode-pty: OpenCode plugin for interactive PTY management - run background processes, send input, read output with regex filtering · GitHub","raw_content":"## Navigation Menu\n\n# Search code, repositories, users, issues, pull requests...\n\n# Provide feedback\n\nWe read every piece of feedback, and take your input very seriously.\n\n# Saved searches\n\n## Use saved searches to filter your results more quickly\n\nTo see all available qualifiers, see our [documentation](https://docs.github.com/search-github/github-code-search/understanding-github-code-search-syntax).\n\n# shekohex/opencode-pty\n\n## Folders and files\n\n| Name | | Name | Last commit message | Last commit date |\n| --- | --- | --- | --- | --- |\n| Latest commit   History[43 Commits](/shekohex/opencode-pty/commits/main/)   43 Commits | | |\n| [.github](/shekohex/opencode-pty/tree/main/.github \".github\") | | [.github](/shekohex/opencode-pty/tree/main/.github \".github\") |  |  |\n| [.opencode](/shekohex/opencode-pty/tree/main/.opencode \".opencode\") | | [.opencode](/shekohex/opencode-pty/tree/main/.opencode \".opencode\") |  |  |\n| [src](/shekohex/opencode-pty/tree/main/src \"src\") | | [src](/shekohex/opencode-pty/tree/main/src \"src\") |  |  |\n| [test](/shekohex/opencode-pty/tree/main/test \"test\") | | [test](/shekohex/opencode-pty/tree/main/test \"test\") |  |  |\n| [.envrc](/shekohex/opencode-pty/blob/main/.envrc \".envrc\") | | [.envrc](/shekohex/opencode-pty/blob/main/.envrc \".envrc\") |  |  |\n| [.gitattributes](/shekohex/opencode-pty/blob/main/.gitattributes \".gitattributes\") | | [.gitattributes](/shekohex/opencode-pty/blob/main/.gitattributes \".gitattributes\") |  |  |\n| [.gitignore](/shekohex/opencode-pty/blob/main/.gitignore \".gitignore\") | | [.gitignore](/shekohex/opencode-pty/blob/main/.gitignore \".gitignore\") |  |  |\n| [LICENSE](/shekohex/opencode-pty/blob/main/LICENSE \"LICENSE\") | | [LICENSE](/shekohex/opencode-pty/blob/main/LICENSE \"LICENSE\") |  |  |\n| [README.md](/shekohex/opencode-pty/blob/main/README.md \"README.md\") | | [README.md](/shekohex/opencode-pty/blob/main/README.md \"README.md\") |  |  |\n| [biome.json](/shekohex/opencode-pty/blob/main/biome.json \"biome.json\") | | [biome.json](/shekohex/opencode-pty/blob/main/biome.json \"biome.json\") |  |  |\n| [bun.lock](/shekohex/opencode-pty/blob/main/bun.lock \"bun.lock\") | | [bun.lock](/shekohex/opencode-pty/blob/main/bun.lock \"bun.lock\") |  |  |\n| [devenv.lock](/shekohex/opencode-pty/blob/main/devenv.lock \"devenv.lock\") | | [devenv.lock](/shekohex/opencode-pty/blob/main/devenv.lock \"devenv.lock\") |  |  |\n| [devenv.nix](/shekohex/opencode-pty/blob/main/devenv.nix \"devenv.nix\") | | [devenv.nix](/shekohex/opencode-pty/blob/main/devenv.nix \"devenv.nix\") |  |  |\n| [devenv.yaml](/shekohex/opencode-pty/blob/main/devenv.yaml \"devenv.yaml\") | | [devenv.yaml](/shekohex/opencode-pty/blob/main/devenv.yaml \"devenv.yaml\") |  |  |\n| [index.ts](/shekohex/opencode-pty/blob/main/index.ts \"index.ts\") | | [index.ts](/shekohex/opencode-pty/blob/main/index.ts \"index.ts\") |  |  |\n| [package.json](/shekohex/opencode-pty/blob/main/package.json \"package.json\") | | [package.json](/shekohex/opencode-pty/blob/main/package.json \"package.json\") |  |  |\n| [playwright.config.ts](/shekohex/opencode-pty/blob/main/playwright.config.ts \"playwright.config.ts\") | | [playwright.config.ts](/shekohex/opencode-pty/blob/main/playwright.config.ts \"playwright.config.ts\") |  |  |\n| [release.sh](/shekohex/opencode-pty/blob/main/release.sh \"release.sh\") | | [release.sh](/shekohex/opencode-pty/blob/main/release.sh \"release.sh\") |  |  |\n| [tsconfig.build.json](/shekohex/opencode-pty/blob/main/tsconfig.build.json \"tsconfig.build.json\") | | [tsconfig.build.json](/shekohex/opencode-pty/blob/main/tsconfig.build.json \"tsconfig.build.json\") |  |  |\n| [tsconfig.json](/shekohex/opencode-pty/blob/main/tsconfig.json \"tsconfig.json\") | | [tsconfig.json](/shekohex/opencode-pty/blob/main/tsconfig.json \"tsconfig.json\") |  |  |\n| [vite.config.ts](/shekohex/opencode-pty/blob/main/vite.config.ts \"vite.config.ts\") | | [vite.config.ts](/shekohex/opencode-pty/blob/main/vite.config.ts \"vite.config.ts\") |  |  |\n| View all files | | |\n\n## Latest commit\n\n## History\n\n## Repository files navigation\n\n# opencode-pty\n\nA plugin for [OpenCode](https://opencode.ai) that provides interactive PTY (pseudo-terminal) management, enabling the AI agent to run background processes, send interactive input, and read output on demand.\n\n## Why?\n\nOpenCode's built-in `bash` tool runs commands synchronously—the agent waits for completion. This works for quick commands, but not for:\n\n`bash`\n`npm run dev`\n`cargo watch`\n`npm test -- --watch`\n\nThis plugin gives the agent full control over multiple terminal sessions, like tabs in a terminal app.\n\n## Features\n\n`grep`\n\n## Setup\n\nAdd the plugin to your [OpenCode config](https://opencode.ai/docs/config/):\n\nThat's it. OpenCode will automatically install the plugin on next run.\n\n## Updating\n\nOpenCode automatically checks for and installs plugin updates on startup. You don't need to do anything manually!\n\nIf you ever need to force a clean reinstall, you can clear the cache:\n\n## Tools Provided\n\n| Tool | Description |\n| --- | --- |\n| `pty_spawn` | Create a new PTY session (command, args, workdir, env, title, notifyOnExit, timeoutSeconds) |\n| `pty_write` | Send input to a PTY (text, escape sequences like `\\x03` for Ctrl+C) |\n| `pty_read` | Read output buffer with pagination and optional regex filtering |\n| `pty_list` | List all PTY sessions with status, PID, line count |\n| `pty_kill` | Terminate a PTY, optionally cleanup the buffer |\n\n`pty_spawn`\n`pty_write`\n`\\x03`\n`pty_read`\n`pty_list`\n`pty_kill`\n\n## Slash Commands\n\nThis plugin provides slash commands that can be used in OpenCode chat:\n\n| Command | Description |\n| --- | --- |\n| `/pty-open-background-spy` | Open the PTY web server interface in the browser |\n| `/pty-show-server-url` | Show the URL of the running PTY web server instance |\n\n`/pty-open-background-spy`\n`/pty-show-server-url`\n\n## Web UI\n\nThis plugin includes a modern React-based web interface for monitoring and interacting with PTY sessions.\n\n[![opencode-pty Web UI Demo](https://camo.githubusercontent.com/da56f13d7db689f19faae9d2c1d5e81efe3cebf7be398eb35c3e39287f5174aa/68747470733a2f2f696d672e796f75747562652e636f6d2f76692f7750716d54506e7a7656592f302e6a7067)](https://youtu.be/wPqmTPnzvVY)\n\n![opencode-pty Web UI Demo](https://camo.githubusercontent.com/da56f13d7db689f19faae9d2c1d5e81efe3cebf7be398eb35c3e39287f5174aa/68747470733a2f2f696d672e796f75747562652e636f6d2f76692f7750716d54506e7a7656592f302e6a7067)\n\nIf you instruct the coding agent to run something in background, you have to name it \"session\",\ni.e. \"run xy as a background SESSION\".\nIf you name it \"task\" or \"process\" or anything else, the agent will sometimes run it as background subprocess using `&`.\n\n`&`\n\n### Starting the Web UI\n\n`/pty-open-background-spy`\n\nThis will start the background sessions observer cockpit server and launch the browser with web UI.\n\n### Features\n\n### REST API\n\nThe web server provides a REST API for session management:\n\n| Method | Endpoint | Description |\n| --- | --- | --- |\n| `GET` | `/api/sessions` | List all PTY sessions |\n| `POST` | `/api/sessions` | Create a new PTY session |\n| `GET` | `/api/sessions/:id` | Get session details |\n| `POST` | `/api/sessions/:id/input` | Send input to a session |\n| `DELETE` | `/api/sessions/:id` | Kill a session (without cleanup) |\n| `DELETE` | `/api/sessions/:id/cleanup` | Kill and cleanup a session |\n| `GET` | `/api/sessions/:id/buffer/plain` | Get session output buffer (returns `{ plain: string, byteLength: number }`) |\n| `GET` | `/api/sessions/:id/buffer/raw` | Get session output buffer (raw data) |\n| `DELETE` | `/api/sessions` | Clear all sessions |\n| `GET` | `/health` | Server health check with metrics |\n\n`GET`\n`/api/sessions`\n`POST`\n`/api/sessions`\n`GET`\n`/api/sessions/:id`\n`POST`\n`/api/sessions/:id/input`\n`DELETE`\n`/api/sessions/:id`\n`DELETE`\n`/api/sessions/:id/cleanup`\n`GET`\n`/api/sessions/:id/buffer/plain`\n`{ plain: string, byteLength: number }`\n`GET`\n`/api/sessions/:id/buffer/raw`\n`DELETE`\n`/api/sessions`\n`GET`\n`/health`\n\n#### Session Creation\n\nReplace `[PORT]` with the actual port number shown in the server console output.\n\n`[PORT]`\n\n#### WebSocket Streaming\n\nConnect to `/ws` for real-time updates:\n\n`/ws`\n\nReplace `[PORT]` with the actual port number shown in the browser when running the slash command output.\n\n`[PORT]`\n\n### Development\n\nFuture implementation will include:\n\n#### App\n\n`bun vite`\n\nThis will ease the development on the client.\n\n## Usage Examples\n\n### Start a dev server\n\n`pty_spawn: command=\"npm\", args=[\"run\", \"dev\"], title=\"Dev Server\"\n→ Returns: pty_a1b2c3d4`\n\n### Start a timed session\n\n`pty_spawn: command=\"npm\", args=[\"run\", \"dev\"], title=\"Dev Server\", timeoutSeconds=600\n→ Returns: pty_a1b2c3d4`\n\n### Check server output\n\n`pty_read: id=\"pty_a1b2c3d4\", limit=50\n→ Shows last 50 lines of output`\n\n### Filter for errors\n\n`pty_read: id=\"pty_a1b2c3d4\", pattern=\"error|ERROR\", ignoreCase=true\n→ Shows only lines matching the pattern`\n\n### Send Ctrl+C to stop\n\n`pty_write: id=\"pty_a1b2c3d4\", data=\"\\x03\"\n→ Sends interrupt signal`\n\n### Kill and cleanup\n\n`pty_kill: id=\"pty_a1b2c3d4\", cleanup=true\n→ Terminates process and frees buffer`\n\n### Run with exit notification\n\n`pty_spawn: command=\"npm\", args=[\"run\", \"build\"], title=\"Build\", notifyOnExit=true\n→ Returns: pty_a1b2c3d4`\n\nThe AI agent will receive a notification when the build completes:\n\nThis eliminates the need for polling—perfect for long-running processes like builds, tests, or deployment scripts. If the process fails (non-zero exit code), the notification will suggest using `pty_read` with the `pattern` parameter to search for errors.\n\n`pty_read`\n`pattern`\n\n## Configuration\n\n### Environment Variables\n\n| Variable | Default | Description |\n| --- | --- | --- |\n| `PTY_MAX_BUFFER_LINES` | `50000` | Maximum lines to keep in output buffer per session |\n| `PTY_WEB_HOSTNAME` | `::1` | Hostname for the web server to bind to (IPv6 loopback by default) |\n| `PTY_WEB_PORT` | `0` (random) | Port for the web server (0 = random port) |\n\n`PTY_MAX_BUFFER_LINES`\n`50000`\n`PTY_WEB_HOSTNAME`\n`::1`\n`PTY_WEB_PORT`\n`0`\n\n### Permissions\n\nThis plugin respects OpenCode's [permission settings](https://opencode.ai/docs/permissions/) for the `bash` tool. Commands spawned via `pty_spawn` are checked against your `permission.bash` configuration.\n\n`bash`\n`pty_spawn`\n`permission.bash`\n\nImportant\n\n**Limitations compared to built-in bash tool:**\n\n`permission.external_directory`\n\n#### Example: Allow specific commands for PTY\n\n## How It Works\n\n`notifyOnExit`\n\n## Session Lifecycle\n\n`spawn → running → [exited | killed]\n↓\n(stays in list until cleanup=true)`\n\nSessions remain in the list after exit so the agent can:\n\nUse `pty_kill` with `cleanup=true` to remove completely.\n\n`pty_kill`\n`cleanup=true`\n\n## Local Development\n\nTo load a local checkout in OpenCode:\n\n## Diagrams\n\n### Sequence\n\n#### Use Case 1 – Opening the PTY Monitor Web UI\n\n#### Use Case 2 – Starting a Long-Running Background Process\n\n#### Use Case 3 – Sending Interactive Input to a Running Session\n\n#### Use Case 4 – Reading Output / Logs On Demand\n\n#### Use Case 5A – Killing / Cleaning Up a Session via Web UI\n\n#### Use Case 5B – Killing / Cleaning Up a Session via Agent\n\n#### Use Case 6 – Automatic Exit Notification\n\n## License\n\nMIT\n\n## Contributing\n\nContributions are welcome! Please open an issue or submit a PR.\n\n## Credits\n\n## About\n\nOpenCode plugin for interactive PTY management - run background processes, send input, read output with regex filtering\n\n### Topics\n\n### Resources\n\n### License\n\n### Uh oh!\n\nThere was an error while loading. Please reload this page.\n\nThere was an error while loading. Please reload this page.\n\n### Stars\n\n### Watchers\n\n### Forks\n\n## [Releases 16](/shekohex/opencode-pty/releases)\n\n## [Packages 0](/users/shekohex/packages?repo_name=opencode-pty)\n\n### Uh oh!\n\nThere was an error while loading. Please reload this page.\n\nThere was an error while loading. Please reload this page.\n\n### Uh oh!\n\nThere was an error while loading. Please reload this page.\n\nThere was an error while loading. Please reload this page.\n\n## [Contributors](/shekohex/opencode-pty/graphs/contributors)\n\n### Uh oh!\n\nThere was an error while loading. Please reload this page.\n\nThere was an error while loading. Please reload this page.\n\n## Languages\n\n## Footer\n\n### Footer navigation","images":[]}],"failed_results":[],"response_time":0.02,"request_id":"c2472206-a378-435c-8213-73417ffb3477"}
```

---

## Assistant (Build · CrofAI: kimi-k2.6 (precision) · 7.1s)

_Thinking:_

Now let me look at the command frontmatter schema to understand the YAML fields:

 

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/schema-kernel/command-frontmatter.schema.ts"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin-private/src/schema-kernel/command-frontmatter.schema.ts</path>
<type>file</type>
<content>
1: import { z } from "zod"
2: 
3: export const COMMAND_FRONTMATTER_SCHEMA_VERSION = "1.0.0"
4: 
5: // ---------------------------------------------------------------------------
6: // 1. Command Name — validates OpenCode command naming conventions
7: // ---------------------------------------------------------------------------
8: 
9: /**
10:  * Validates command names: 1–64 chars, lowercase alphanumeric with single
11:  * hyphens between segments. Same rules as agent names.
12:  */
13: export const CommandNameSchema = z
14:   .string()
15:   .min(1)
16:   .max(64)
17:   .regex(
18:     /^[a-z0-9]+(-[a-z0-9]+)*$/,
19:     "Command name must be lowercase alphanumeric with single hyphens between segments",
20:   )
21: 
22: export type CommandName = z.infer<typeof CommandNameSchema>
23: 
24: // ---------------------------------------------------------------------------
25: // 2. Command Frontmatter — YAML frontmatter fields from .md command files
26: // ---------------------------------------------------------------------------
27: 
28: /**
29:  * YAML frontmatter extracted from an OpenCode command `.md` file.
30:  * Only `description` is required; all other fields are optional overrides.
31:  */
32: export const CommandFrontmatterSchema = z
33:   .object({
34:     description: z.string().min(1),
35:     agent: z.string().min(1).optional(),
36:     model: z.string().min(1).optional(),
37:     subtask: z.boolean().optional(),
38:   })
39:   .strict()
40: 
41: export type CommandFrontmatter = z.infer<typeof CommandFrontmatterSchema>
42: 
43: /** Lenient variant that strips unknown fields instead of rejecting them. */
44: export const CommandFrontmatterSchemaLenient = CommandFrontmatterSchema.strip()
45: 
46: export type CommandFrontmatterLenient = z.infer<typeof CommandFrontmatterSchemaLenient>
47: 
48: // ---------------------------------------------------------------------------
49: // 3. Command Template Syntax — detects special syntax in the template body
50: // ---------------------------------------------------------------------------
51: 
52: /**
53:  * Informational scan result: which OpenCode template syntax features are
54:  * present in the command body. Used for validation warnings, not blocking.
55:  */
56: export const CommandTemplateFeaturesSchema = z
57:   .object({
58:     has_arguments: z.boolean(),
59:     has_positional_params: z.boolean(),
60:     positional_indices: z.array(z.number().int().min(1).max(9)),
61:     has_bash_injection: z.boolean(),
62:     has_file_injection: z.boolean(),
63:     has_file_reference: z.boolean(),
64:     bash_injection_count: z.number().int().nonnegative(),
65:     file_injection_count: z.number().int().nonnegative(),
66:     file_reference_count: z.number().int().nonnegative(),
67:   })
68:   .strict()
69: 
70: export type CommandTemplateFeatures = z.infer<typeof CommandTemplateFeaturesSchema>
71: 
72: /** Lenient variant that strips unknown fields instead of rejecting them. */
73: export const CommandTemplateFeaturesSchemaLenient = CommandTemplateFeaturesSchema.strip()
74: 
75: export type CommandTemplateFeaturesLenient = z.infer<typeof CommandTemplateFeaturesSchemaLenient>
76: 
77: // ---------------------------------------------------------------------------
78: // 4. Command File — complete parsed command `.md` file
79: // ---------------------------------------------------------------------------
80: 
81: /**
82:  * Fully parsed command `.md` file: validated frontmatter, raw template
83:  * body, and source file path for traceability.
84:  */
85: export const CommandFileSchema = z
86:   .object({
87:     frontmatter: CommandFrontmatterSchema,
88:     body: z.string().min(1),
89:     filePath: z.string().min(1),
90:   })
91:   .strict()
92: 
93: export type CommandFile = z.infer<typeof CommandFileSchema>
94: 
95: /** Lenient variant that strips unknown fields instead of rejecting them. */
96: export const CommandFileSchemaLenient = z
97:   .object({
98:     frontmatter: CommandFrontmatterSchemaLenient,
99:     body: z.string().min(1),
100:     filePath: z.string().min(1),
101:   })
102:   .strip()
103: 
104: export type CommandFileLenient = z.infer<typeof CommandFileSchemaLenient>

(End of file - total 104 lines)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin-private/src/schema-kernel/AGENTS.md
# Schema Kernel Sector Guidance

**Parent sector:** `src/AGENTS.md` | **Architecture:** `.planning/codebase/ARCHITECTURE.md` | **Classification:** Hard Harness — validation-leaf (Zod v4 contracts, no durable writes)

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/schema-kernel/` is the Hard Harness validation-contract sector. It owns Zod v4 schemas for OpenCode meta-concepts, permissions, MCP servers, prompt enhancement, config precedence, agent work contracts, runtime pressure, SDK supervision, command engine, doc intelligence, and trajectory surfaces. Source evidence: `.planning/codebase/ARCHITECTURE.md:195-200`, `.planning/codebase/STRUCTURE.md:114-118`.

## 2. Allowed mutation authority

- Schema files may define and export validation contracts, typed parse results, fallback validation helpers, and barrel exports.
- Schema changes may support tools, config workflow, validation/restart checks, and primitive configuration when paired with consumers. Evidence: `.planning/codebase/ARCHITECTURE.md:195-200`, `.planning/REQUIREMENTS.md:42-56`.
- Schema changes may reject, strip, or warn on invalid structures according to the owning tool or config workflow contract. Evidence: `.planning/codebase/ARCHITECTURE.md:397-401`.

## 3. Forbidden mutations / explicit no-go boundaries

- Schemas SHALL NOT perform durable writes, SDK calls, filesystem state mutation, or command execution.
- Schemas SHALL NOT become hidden runtime feature implementations; they define contracts consumed by tools/lib modules.
- Schemas SHALL NOT introduce `any` on new code or bypass TypeScript strictness. Evidence: `.planning/codebase/CONVENTIONS.md:70-75`.
- Schemas SHALL NOT claim registry/config completeness when consumers are partial or missing. Evidence: `.planning/REQUIREMENTS.md:42-56`.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| `src/tools/configure-primitive.ts` and `validate-restart` | Validate primitive and restart contracts | Must handle schema errors through tool responses |
| Config workflow and runtime policy modules | Parse and validate workspace/config contracts | Must own side effects outside the schema |
| Tests | Validate accepted/rejected shapes | Schema tests do not prove runtime integration |
| `.opencode/` primitives | Are validated by schemas where supported | Schema existence is not registry enforcement by itself |

## 5. Naming and placement conventions

- Schema files use `kebab-case.schema.ts`; barrel exports live in `src/schema-kernel/index.ts`. Evidence: `.planning/codebase/STRUCTURE.md:186-195`, `.planning/codebase/STRUCTURE.md:237-240`.
- Tests live under `tests/schema-kernel/` and validate real Zod behavior. Evidence: `.planning/codebase/TESTING.md:52-64`, `.planning/codebase/TESTING.md:208-213`.
- Use named exports and ESM `.js` import conventions where imports are needed. Evidence: `.planning/codebase/CONVENTIONS.md:80-98`, `.planning/codebase/CONVENTIONS.md:169-181`.

## 6. Quality gates and evidence expectations

- Schema changes require `npm run typecheck` and scoped `npx vitest run tests/schema-kernel/...` evidence.
- If a schema change claims runtime enforcement, provide consumer evidence from the owning tool/lib module; schema-only proof is insufficient.
- Docs-only edits remain L5 evidence and must not alter readiness status. Evidence: `.planning/ROADMAP.md:47-49`.

</system-reminder>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/schema-kernel/agent-frontmatter.schema.ts"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin-private/src/schema-kernel/agent-frontmatter.schema.ts</path>
<type>file</type>
<content>
1: import { z } from "zod"
2: 
3: export const AGENT_FRONTMATTER_SCHEMA_VERSION = "1.0.0"
4: 
5: // ---------------------------------------------------------------------------
6: // 1. Agent Name Validation
7: // ---------------------------------------------------------------------------
8: 
9: /**
10:  * Validates an OpenCode agent file name: 1–64 chars, lowercase alphanumeric
11:  * with single hyphen separators. No leading/trailing hyphens, no consecutive
12:  * hyphens. Matches: my-agent, researcher, gsd-code-fixer.
13:  */
14: export const AgentNameSchema = z
15:   .string()
16:   .min(1)
17:   .max(64)
18:   .regex(
19:     /^[a-z0-9]+(-[a-z0-9]+)*$/,
20:     "Agent name must be lowercase alphanumeric with single hyphen separators, no leading/trailing/consecutive hyphens",
21:   )
22: 
23: export type AgentName = z.infer<typeof AgentNameSchema>
24: 
25: // ---------------------------------------------------------------------------
26: // 2. Agent Mode
27: // ---------------------------------------------------------------------------
28: 
29: /**
30:  * Determines when the agent is available:
31:  * - "primary" → top-level conversations only
32:  * - "subagent" → delegated sub-sessions only
33:  * - "all" → both (default)
34:  */
35: export const AgentModeEnum = z.enum(["primary", "subagent", "all"])
36: 
37: export type AgentMode = z.infer<typeof AgentModeEnum>
38: 
39: // ---------------------------------------------------------------------------
40: // 3. Agent Frontmatter — YAML frontmatter of an agent .md file
41: // ---------------------------------------------------------------------------
42: 
43: /**
44:  * Known theme color names accepted by the OpenCode color field.
45:  * Agents may use these named colors instead of hex codes.
46:  */
47: const THEME_COLOR_NAMES = [
48:   "blue",
49:   "green",
50:   "red",
51:   "yellow",
52:   "purple",
53:   "cyan",
54:   "magenta",
55:   "orange",
56:   "pink",
57:   "teal",
58: ] as const
59: 
60: /**
61:  * Validates a color value: either a hex color code (#RGB or #RRGGBB) or
62:  * a known theme color name.
63:  */
64: const ColorSchema = z.string().refine(
65:   (val) => /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(val) ||
66:     THEME_COLOR_NAMES.includes(val as (typeof THEME_COLOR_NAMES)[number]),
67:   {
68:     message: `Must be a hex color (#RGB or #RRGGBB) or a theme color name (${THEME_COLOR_NAMES.join(", ")})`,
69:   },
70: )
71: 
72: /**
73:  * OpenCode agent YAML frontmatter schema. Only `description` is strictly
74:  * required. Includes backward-compatible deprecated fields (tools, maxSteps)
75:  * with deprecation-tracking refines that always pass validation.
76:  */
77: export const AgentFrontmatterSchema = z
78:   .object({
79:     /** Human-readable agent description (triggers @ autocomplete) */
80:     description: z.string().min(1),
81: 
82:     /** Where this agent can be used: primary, subagent, or both */
83:     mode: AgentModeEnum.optional(),
84: 
85:     /** Model to use: provider/model-id format (e.g. anthropic/claude-sonnet-4-20250514) */
86:     model: z.string().optional(),
87: 
88:     /** Default model variant */
89:     variant: z.string().optional(),
90: 
91:     /** Sampling temperature (0.0 = deterministic, 2.0 = highly random) */
92:     temperature: z.number().min(0).max(2).optional(),
93: 
94:     /** Nucleus sampling threshold */
95:     top_p: z.number().min(0).max(1).optional(),
96: 
97:     /** System prompt text; supports {file:./path.txt} syntax */
98:     prompt: z.string().optional(),
99: 
100:     /** @deprecated Kept for backward compat validation only */
101:     tools: z.record(z.string(), z.boolean()).optional(),
102: 
103:     /** Disable the agent entirely */
104:     disable: z.boolean().optional(),
105: 
106:     /** Hide from @ autocomplete */
107:     hidden: z.boolean().optional(),
108: 
109:     /** Agent-specific additional options */
110:     options: z.record(z.string(), z.unknown()).optional(),
111: 
112:     /** Display color: hex (#RGB, #RRGGBB) or theme name */
113:     color: ColorSchema.optional(),
114: 
115:     /** Maximum agentic iteration steps */
116:     steps: z.number().int().positive().optional(),
117: 
118:     /** @deprecated Use `steps` instead */
119:     maxSteps: z.number().int().positive().optional(),
120: 
121:     /** Tool permission rules; runtime permission contracts live in shared/runtime policy surfaces. */
122:     permission: z.record(z.string(), z.unknown()).optional(),
123:   })
124:   .strict()
125:   .refine(
126:     (_data) => true,
127:     { message: "Field 'tools' is deprecated — prefer permission rules", path: ["tools"] },
128:   )
129:   .refine(
130:     (_data) => true,
131:     { message: "Field 'maxSteps' is deprecated — use 'steps' instead", path: ["maxSteps"] },
132:   )
133: 
134: export type AgentFrontmatter = z.infer<typeof AgentFrontmatterSchema>
135: 
136: /** Lenient variant that strips unknown fields instead of rejecting them. */
137: export const AgentFrontmatterSchemaLenient = AgentFrontmatterSchema.strip()
138: 
139: export type AgentFrontmatterLenient = z.infer<typeof AgentFrontmatterSchemaLenient>
140: 
141: // ---------------------------------------------------------------------------
142: // 4. Agent File — complete parsed .md file representation
143: // ---------------------------------------------------------------------------
144: 
145: /**
146:  * Represents a fully parsed OpenCode agent .md file: the validated YAML
147:  * frontmatter, the markdown body (system prompt), and the file path.
148:  */
149: export const AgentFileSchema = z
150:   .object({
151:     frontmatter: AgentFrontmatterSchema,
152:     body: z.string().min(1),
153:     filePath: z.string().min(1),
154:   })
155:   .strict()
156: 
157: export type AgentFile = z.infer<typeof AgentFileSchema>
158: 
159: /** Lenient variant that strips unknown fields instead of rejecting them. */
160: export const AgentFileSchemaLenient = z
161:   .object({
162:     frontmatter: AgentFrontmatterSchemaLenient,
163:     body: z.string().min(1),
164:     filePath: z.string().min(1),
165:   })
166:   .strip()
167: 
168: export type AgentFileLenient = z.infer<typeof AgentFileSchemaLenient>

(End of file - total 168 lines)
</content>
```

---

## Assistant (Build · CrofAI: kimi-k2.6 (precision) · 12.5s)

_Thinking:_

Now I have a very comprehensive understanding of the current state. Let me now read the awesome-opencode ecosystem directory and also the background agents repo for further reference. But more importantly, I need to also look at how OpenCode handles the `subtask` field and the `agent` field in command frontmatter to understand how commands can be delegated to subagents.

Let me also look at OpenCode's SDK documentation for how it handles @agent switching in the TUI and how subtask works.

Let me now query Context7 for the subtask and agent switching behavior.

 

**Tool: context7_query-docs**

**Input:**
```json
{
  "libraryId": "/anomalyco/opencode",
  "query": "subtask field in command frontmatter, how subtask true/false affects command execution, agent switching in TUI with @ prefix, session switch vs task delegation"
}
```

**Output:**
```
### Force Subagent Invocation with `subtask` in opencode.json

Source: https://github.com/anomalyco/opencode/blob/dev/packages/web/src/content/docs/commands.mdx

This example illustrates how to use the `subtask` boolean option in `opencode.json` to force a command to be executed by a subagent. Setting `subtask` to `true` ensures the command runs in a separate context, preventing pollution of the primary agent's context, even if the agent's mode is set to primary.

```json
{
  "command": {
    "analyze": {
      "subtask": true
    }
  }
}
```

--------------------------------

### Invoke subagent with @ mention

Source: https://github.com/anomalyco/opencode/blob/dev/packages/web/src/content/docs/agents.mdx

Manually invoke a subagent by @ mentioning it in a message. Use this syntax to request specialized assistance from General, Explore, Scout, or other configured subagents.

```txt
@general help me search for this function
```

### Subtask

Source: https://github.com/anomalyco/opencode/blob/dev/packages/web/src/content/docs/commands.mdx

Use the `subtask` boolean to force the command to trigger a [subagent](/docs/agents/#subagents) invocation. This is useful if you want the command to not pollute your primary context and will **force** the agent to act as a subagent, even if `mode` is set to `primary` on the [agent](/docs/agents) configuration. This is an **optional** config option.

--------------------------------

### Agent

Source: https://github.com/anomalyco/opencode/blob/dev/packages/web/src/content/docs/commands.mdx

Use the `agent` config to optionally specify which [agent](/docs/agents) should execute this command. If this is a [subagent](/docs/agents/#subagents) the command will trigger a subagent invocation by default. To disable this behavior, set `subtask` to `false`. This is an **optional** config option. If not specified, defaults to your current agent.

--------------------------------

### Prompt and Tool Use

Source: https://github.com/anomalyco/opencode/blob/dev/packages/opencode/src/session/prompt/kimi.txt

OpenCode can delegate focused subtasks to subagent instances using the `task` tool. When delegating, a complete prompt with all necessary context must be provided because subagents do not inherit the current context of the main agent. This allows for modular task management and specialized focus on specific parts of a larger project.
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/Documents/coding-projects/hivemind-plugin-1/.planning/research/OPENCODE-ECOSYSTEM-REPO-DIRECTORIES.md"
}
```

**Error:**
```
File not found: /Users/apple/Documents/coding-projects/hivemind-plugin-1/.planning/research/OPENCODE-ECOSYSTEM-REPO-DIRECTORIES.md
```

---

## Assistant (Build · CrofAI: kimi-k2.6 (precision) · 10.7s)

_Thinking:_

Now I have a very complete picture. Let me now read the ecosystem file to synthesize the findings, then produce the comprehensive analysis and recommendations.

Key findings so far:

1. **Current `execute-slash-command` tool** only supports TUI prompt pipeline dispatch (appendPrompt + submitPrompt). It has basic `agent` and `model` parameters but:
   - Does NOT handle agent switching properly (should use `@agent` to switch before appending command)
   - Does NOT support `subtask` field to delegate via task tool instead
   - Does NOT parse arguments/flags intelligently
   - Does NOT discover available agents/commands before execution
   - Does NOT understand the difference between `agent` (switch context) vs `subtask: true` (delegate to subagent via task tool)

2. **OpenCode command primitives** have these key fields:
   - `description` (required)
   - `agent` (optional) - specifies which agent should execute the command
   - `subtask` (optional boolean) - forces subagent invocation via task tool delegation
   - `model` (optional) - model override
   
3. **Agent switching via TUI**: `@agent /command args` in TUI switches to that agent first, then executes the command. After completion, it returns to the original agent.

4. **Subtask delegation**: When `subtask: true` AND `agent` is specified, the command runs as a subagent invocation (via `task` tool) rather than foreground execution. This prevents context pollution.

5. **GSD command parsing**: GSD commands parse `$ARGUMENTS` with flags like `--skip-research`, `--research`, positional args like phase number `11`, etc. They use the `<context>` section in command files to document argument patterns.

Now let me delegate the comprehensive research synthesis and analysis to a subagent.

Actually wait - the user said "tất cả đều thực hiện qua task tool delegation và route gsd". So I should use task tool delegation. But also "DO NOT ALLOW MORE THAN 2 PARALLEL TASK DELEGATION". Let me delegate the deep research synthesis tasks.

Let me delegate the comprehensive analysis to gsd researchers.

Bây giờ tôi đã có đủ dữ liệu để delegate các research task chuyên sâu. Hãy để tôi tổng hợp và phân tích gaps.

**Tool: todowrite**

**Input:**
```json
{
  "todos": [
    {
      "priority": "high",
      "content": "Đọc implementation hiển tại của execute-slash-command tool",
      "status": "completed"
    },
    {
      "priority": "high",
      "content": "Khảo sát cấu trúc .opencode/commands và .opencode/agents",
      "status": "completed"
    },
    {
      "priority": "high",
      "content": "Nghiên cứu OpenCode SDK về command/agent primitives qua Context7",
      "status": "completed"
    },
    {
      "priority": "high",
      "content": "Nghiên cứu GSD command parsing patterns",
      "status": "completed"
    },
    {
      "priority": "medium",
      "content": "Nghiên cứu ecosystem repos (opencode-pty, background-agents, awesome-opencode)",
      "status": "completed"
    },
    {
      "priority": "high",
      "content": "Delegate task research tổng hợp và phân tích gaps",
      "status": "in_progress"
    },
    {
      "priority": "high",
      "content": "Tổng hợp báo cáo và đề xuất giải pháp",
      "status": "pending"
    }
  ]
}
```

**Output:**
```
[
  {
    "content": "Đọc implementation hiển tại của execute-slash-command tool",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Khảo sát cấu trúc .opencode/commands và .opencode/agents",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Nghiên cứu OpenCode SDK về command/agent primitives qua Context7",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Nghiên cứu GSD command parsing patterns",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Nghiên cứu ecosystem repos (opencode-pty, background-agents, awesome-opencode)",
    "status": "completed",
    "priority": "medium"
  },
  {
    "content": "Delegate task research tổng hợp và phân tích gaps",
    "status": "in_progress",
    "priority": "high"
  },
  {
    "content": "Tổng hợp báo cáo và đề xuất giải pháp",
    "status": "pending",
    "priority": "high"
  }
]
```

---

## Assistant (Build · CrofAI: kimi-k2.6 (precision) · 313.9s)

_Thinking:_

Let me delegate the comprehensive research synthesis to a gsd researcher subagent. I need to pass all the gathered information to the subagent for deep analysis.

Actually, the user said "route gsd" - and I should use gsd-* agents for task delegation. Let me delegate the analysis to gsd-phase-researcher or use task tool with a general agent.

Actually, per the rules: "delegation to agents attention: do not use generic agents - use gsd-* agents only"

Let me use the task tool with a gsd agent to do the deep analysis.

 

**Tool: task**

**Input:**
```json
{
  "description": "Deep research execute-slash-command gaps",
  "subagent_type": "gsd-phase-researcher",
  "prompt": "You are a specialist researcher for analyzing the `execute-slash-command` tool implementation in the Hivemind harness project.\n\n## Your Task\nResearch and analyze ALL gaps in the current `execute-slash-command` implementation compared to what the OpenCode SDK and ecosystem require. Return a comprehensive structured report.\n\n## Current Implementation (src/tools/session/execute-slash-command.ts)\nThe current tool has these parameters:\n- `command`: string (required) - command name without leading slash\n- `arguments`: string (optional) - arguments string\n- `agent`: string (optional) - prepended as @agent before the command\n- `model`: string (optional) - model override\n\nThe execution flow:\n1. Build promptText = `[@{agent}] /{command} [{arguments}]`\n2. `client.tui.clearPrompt()`\n3. `client.tui.appendPrompt({ body: { text: promptText } })`\n4. `client.tui.submitPrompt()`\n\n## OpenCode SDK Contract (from Context7 research)\n1. **Command frontmatter fields**: `description` (required), `agent` (optional), `model` (optional), `subtask` (optional boolean)\n2. **subtask: true** forces the command to trigger a subagent invocation via the `task` tool, preventing context pollution of the primary agent\n3. **agent field**: Specifies which agent should execute the command. If the agent is a subagent, the command will trigger a subagent invocation by default. Set `subtask: false` to disable.\n4. **@agent switching**: `@agent /command` in TUI switches front-facing agent before executing the command. After completion, it returns to the original agent.\n5. **TUI pipeline**: `clearPrompt()` → `appendPrompt()` → `submitPrompt()` appends command text to TUI buffer\n\n## GSD Command Parsing Patterns (from actual command files)\nCommands like `gsd-plan-phase` parse:\n- Positional args: phase number (e.g., `11`)\n- Flags: `--skip-research`, `--research`, `--view`, `--gaps`, `--skip-verify`, etc.\n- Flag with values: `--prd <file>`, `--research-phase <N>`\n- The `<context>` section documents argument patterns\n- `$ARGUMENTS` in command body is replaced with user-provided arguments\n\n## OpenCode Primitives Structure\n- Commands directory: `.opencode/commands/` (both singular and plural supported)\n- Agents directory: `.opencode/agents/` (both singular and plural supported)\n- Global config path: `~/.config/opencode/`\n- First-wins merging: project-level overrides global\n- 87 command files and 90 agent files in the project\n\n## Known Gaps to Analyze\n1. **Agent switching mode**: Current tool only prepends @agent but doesn't truly \"switch\" the front-facing agent. OpenCode's TUI `@agent /command` syntax switches context first, then executes.\n2. **subtask support**: The tool has NO `subtask` parameter. When `subtask: true` and agent is specified, the command should run via task tool delegation instead of TUI append.\n3. **Command discovery**: The tool doesn't check if the command exists or load its frontmatter before execution. It relies on `hivemind-command-engine` (read-side) for discovery but they're disconnected.\n4. **Argument parsing**: No structured argument parsing for flags, positional args, or flag values.\n5. **Primitive stacking**: No understanding of how `$ARGUMENTS`, `agent:`, `subtask:`, and `model:` in frontmatter interact with the tool parameters.\n6. **Execution mode selection**: Should support TWO modes:\n   - **Foreground**: `@agent /command args` → TUI switch → append → execute → return to original agent\n   - **Subtask**: When `subtask: true` → delegate via `task` tool with the command's agent\n7. **Scope awareness**: Project vs global commands/agents - current tool doesn't handle the merging/priority.\n\n## Deliverable\nWrite a comprehensive research report to `.hivemind/planning/research/execute-slash-command-gaps-analysis-2026-05-21.md` covering:\n1. All identified gaps with severity (CRITICAL/HIGH/MEDIUM/LOW)\n2. For each gap: description, impact, affected consumers, and evidence from SDK\n3. Recommended solution approach for each gap\n4. Integration dependencies (what else needs to change)\n5. Suggested implementation phases\n\nReturn the file path and a summary of findings."
}
```

**Output:**
```
task_id: ses_1b4bd91c4ffeIXJj6NsD3L1qAw (for resuming to continue this task if needed)

<task_result>
The research is complete. Here is the structured summary:

---

## RESEARCH COMPLETE

**Phase:** Execute-Slash-Command Tool Gap Analysis
**Confidence:** HIGH

### Key Findings

1. **GAP-01 (CRITICAL): Missing `subtask` parameter** — Tool cannot honor command frontmatter `subtask: true`. Commands like `hf-create` (which declares `subtask: true`) run in the primary session instead of a child session, defeating their isolation purpose.

2. **GAP-02 (CRITICAL): Wrong API used** — Tool uses `appendPrompt`+`submitPrompt` (TUI buffer injection hack) instead of `tui.executeCommand()` or `session.command()`. The proper SDK APIs support `agent`, `model`, and structured arguments natively, and return actual success/failure feedback.

3. **GAP-03 (HIGH): No pre-dispatch command discovery** — Tool never checks if the command exists or reads its frontmatter before dispatching. The `hivemind-command-engine` (read-side) provides discovery, but they're disconnected.

4. **GAP-04 (HIGH): Shallow agent switching** — `@agent` is just textually prepended to the prompt. Real OpenCode `@agent /command` should switch the front-facing agent context first.

5. **GAP-05 (HIGH): Model parameter is a no-op** — `model` is documented but never used in prompt construction. Only appears in metadata.

6. **GAP-06 through GAP-10**: Argument format awareness, scope resolution, execution mode selection, error feedback, and documentation mismatches.

### File Created
`.hivemind/planning/research/execute-slash-command-gaps-analysis-2026-05-21.md`

### Confidence Assessment
| Area | Level | Reason |
|------|-------|--------|
| Standard Stack | HIGH | SDK APIs confirmed via Context7 |
| Architecture | HIGH | All code paths verified against actual source files |
| Pitfalls | HIGH | All 10 gaps confirmed with direct source evidence |

### Open Questions
- Does `tui.executeCommand()` block during active LLM loops? (If yes, current TUI injection may be the only viable approach)
- Does injected `@agent` text work the same as user-typed `@agent`? (If not, agent switching never worked)
- What is the exact `arguments` shape expected by `session.command()`? (SDK shows conflicting examples)

### Ready for Planning
Research complete. Gaps analysis provides actionable remediation phases (A-D) with dependency ordering.
</task_result>
```

**Tool: task**

**Input:**
```json
{
  "description": "Research OpenCode SDK subtask mechanism",
  "subagent_type": "gsd-phase-researcher",
  "prompt": "You are a researcher investigating the OpenCode SDK's subtask/command delegation mechanism for the Hivemind project.\n\n## Background\nThe Hivemind project has an `execute-slash-command` tool that currently only uses TUI append/submit to dispatch commands. However, OpenCode supports TWO execution modes for commands based on frontmatter:\n\n1. **Foreground (@agent)**: `@agent /command args` in TUI switches to that agent and executes the command in the foreground. After completion, returns to the original agent.\n2. **Subtask (task tool)**: When `subtask: true` in command frontmatter, the command triggers a subagent invocation via the `task` tool, keeping the primary agent's context clean.\n\n## Research Questions\nPlease research the following using Context7 (library: /anomalyco/opencode) and web search:\n\n1. How does OpenCode's subtask mechanism actually work internally? When `subtask: true` and `agent: xxx` are set in command frontmatter, what does OpenCode do? Does it call the `task` tool?\n\n2. How does `@agent` switching work in OpenCode's TUI? When a user types `@specialist /command args`, what happens step by step?\n\n3. What is the relationship between command frontmatter fields and tool call parameters in plugins? If a plugin's tool has `agent` parameter and the command also has `agent` frontmatter, which takes precedence?\n\n4. How do global vs project commands/agents merge? What's the precedence order?\n\n5. Are there any OpenCode SDK methods for:\n   - Switching session agent programmatically?\n   - Dispatching a subtask directly (not through TUI)?\n   - Checking if a command exists and reading its frontmatter at runtime?\n\n## Deliverable\nWrite research findings to `/Users/apple/hivemind-plugin-private/.hivemind/planning/research/opencode-sdk-subtask-mechanism-2026-05-21.md`\n\nInclude:\n- All research findings with citations\n- API signatures and code examples\n- Precedence/priority rules\n- Any relevant source code references\n\nReturn the file path and key findings."
}
```

**Output:**
```
task_id: ses_1b4bd7f8fffeNg5j3ooemjmGhq (for resuming to continue this task if needed)

<task_result>
## RESEARCH COMPLETE

**Phase:** OpenCode SDK Subtask Mechanism Investigation
**Confidence:** HIGH

### Key Findings
1. **Subtask mechanism** works via `SubtaskPart` → `handleSubtask()` → `TaskTool` → child session. Triggered by `subtask: true` in command frontmatter or subagent mode implied.
2. **`execute-slash-command` has a known limitation**: it only uses TUI append+submit path. A hybrid approach using `session.command()` with TUI fallback would be more robust.
3. **`session.command()`** is the correct programmatic API for dispatching slash commands with agent/model overrides — NOT `tui.executeCommand()` (which is for TUI control, not commands).
4. **Config merge priority**: Project `.opencode/commands/` > `opencode.json` > Global `~/.config/opencode/commands/` > Global config. First-wins on name collision.
5. **No SDK method exists** for runtime command existence checking or frontmatter reading — the project's own `loadPrimitives()` is the correct workaround.

### File Created
`.hivemind/planning/research/opencode-sdk-subtask-mechanism-2026-05-21.md`

### Confidence Assessment
| Area | Level | Reason |
|------|-------|--------|
| Standard Stack | HIGH | Live-verified via DeepWiki, Context7, in-project source cross-reference |
| Architecture | HIGH | Multiple sources agree on flow |
| Pitfalls | HIGH | Based on verified codebase understanding |
| SDK Methods | MEDIUM | Some claims from DeepWiki; actual behavior should be tested |

### Open Questions
1. `session.command()` behavior inside active LLM loops — may queue the same way the TUI path does
2. `app.agents()` scope — whether it returns all subagents or only primary agents
3. Session ID availability in plugin tool context — needed for `session.command()` dispatch

### Ready for Planning
Research complete. This document provides a comprehensive reference for enhancing the `execute-slash-command` tool and understanding the subtask/command delegation ecosystem in OpenCode v1.14.44.
</task_result>
```

---

## Assistant (Build · CrofAI: kimi-k2.6 (precision) · 8.3s)

_Thinking:_

Excellent! Both research tasks completed successfully. Let me now read the research reports to synthesize and present a comprehensive analysis to the user.

 

**Tool: todowrite**

**Input:**
```json
{
  "todos": [
    {
      "priority": "high",
      "content": "Đọc implementation hiển tại của execute-slash-command tool",
      "status": "completed"
    },
    {
      "priority": "high",
      "content": "Khảo sát cấu trúc .opencode/commands và .opencode/agents",
      "status": "completed"
    },
    {
      "priority": "high",
      "content": "Nghiên cứu OpenCode SDK về command/agent primitives qua Context7",
      "status": "completed"
    },
    {
      "priority": "high",
      "content": "Nghiên cứu GSD command parsing patterns",
      "status": "completed"
    },
    {
      "priority": "medium",
      "content": "Nghiên cứu ecosystem repos (opencode-pty, background-agents, awesome-opencode)",
      "status": "completed"
    },
    {
      "priority": "high",
      "content": "Delegate task research tổng hợp và phân tích gaps",
      "status": "completed"
    },
    {
      "priority": "high",
      "content": "Tổng hợp báo cáo và đề xuất giải pháp",
      "status": "in_progress"
    }
  ]
}
```

**Output:**
```
[
  {
    "content": "Đọc implementation hiển tại của execute-slash-command tool",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Khảo sát cấu trúc .opencode/commands và .opencode/agents",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Nghiên cứu OpenCode SDK về command/agent primitives qua Context7",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Nghiên cứu GSD command parsing patterns",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Nghiên cứu ecosystem repos (opencode-pty, background-agents, awesome-opencode)",
    "status": "completed",
    "priority": "medium"
  },
  {
    "content": "Delegate task research tổng hợp và phân tích gaps",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Tổng hợp báo cáo và đề xuất giải pháp",
    "status": "in_progress",
    "priority": "high"
  }
]
```

---

## Assistant (Build · CrofAI: kimi-k2.6 (precision) · 7.2s)

_Thinking:_

Let me read both research reports and then synthesize a comprehensive response.

 

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivemind/planning/research/execute-slash-command-gaps-analysis-2026-05-21.md"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin-private/.hivemind/planning/research/execute-slash-command-gaps-analysis-2026-05-21.md</path>
<type>file</type>
<content>
1: [LANGUAGE: Write this file in en per Language Governance.]
2: # Execute-Slash-Command Tool — Gap Analysis
3: 
4: **Researched:** 2026-05-21
5: **Domain:** OpenCode SDK command execution, TUI pipeline, session command dispatch
6: **Confidence:** HIGH
7: **Source:** Context7 (/anomalyco/opencode), SDK reference docs, codebase audit (src/tools/session/execute-slash-command.ts, src/routing/command-engine/, src/features/bootstrap/primitive-loader.ts, .opencode/commands/ frontmatter patterns)
8: 
9: ---
10: 
11: ## Summary
12: 
13: The `execute-slash-command` tool (`src/tools/session/execute-slash-command.ts`) uses a **TUI pipeline hack** (`clearPrompt()` → `appendPrompt(text)` → `submitPrompt()`) to inject slash-command text into the TUI buffer. This works in practice but bypasses the OpenCode SDK's proper execution APIs (`tui.executeCommand()` and `session.command()`), ignores the command frontmatter contract (`subtask`, `agent`, `model` fields), and has no integration with the `hivemind-command-engine` read-side (command discovery).
14: 
15: **10 gaps identified** — 2 CRITICAL, 3 HIGH, 3 MEDIUM, 2 LOW.
16: 
17: **Primary recommendation:** Replace the TUI-injection approach with a dual-mode dispatcher: use `tui.executeCommand()` for foreground/simple commands and `session.command()` (via the plugin's `client`) for parameter-rich commands with `agent`, `model`, and `subtask` support.
18: 
19: ---
20: 
21: ## <user_constraints>
22: 
23: No CONTEXT.md was available — this research was elicited directly. User question: "research and analyze ALL gaps in the current execute-slash-command implementation compared to what the OpenCode SDK and ecosystem require."
24: 
25: </user_constraints>
26: 
27: ---
28: 
29: ## Architectural Responsibility Map
30: 
31: | Capability | Primary Tier | Secondary Tier | Rationale |
32: |------------|-------------|----------------|-----------|
33: | Slash command discovery | `src/routing/command-engine/` | `src/features/bootstrap/primitive-loader.ts` | Command engine exists and works; tool should call it before dispatch |
34: | Command dispatch execution | Plugin `client` (SDK surface) | `src/tools/session/execute-slash-command.ts` | Tool wraps SDK calls; actual dispatch goes through OpenCode runtime |
35: | Subagent invocation (subtask) | OpenCode runtime (child session) | Plugin `delegate-task` tool | When `subtask:true`, command creates child session via SDK, not TUI |
36: | Agent switching | OpenCode TUI (`@agent` syntax) | — | Native platform behavior; tool should not re-implement |
37: | Command argument parsing | Command body (`$ARGUMENTS`, `$1`) | — | OpenCode handles this natively; tool passes raw string |
38: | Frontmatter validation | `src/schema-kernel/command-frontmatter.schema.ts` | — | Schema already defines `description`, `agent`, `model`, `subtask` |
39: 
40: ---
41: 
42: ## Identified Gaps
43: 
44: ---
45: 
46: ### GAP-01 (CRITICAL): Missing `subtask` Parameter — No Child-Session Execution Strategy
47: 
48: | Property | Value |
49: |----------|-------|
50: | **Severity** | CRITICAL |
51: | **Type** | Missing parameter |
52: | **Affected file** | `src/tools/session/execute-slash-command.ts` (line 55-70 — args schema) |
53: 
54: **Description:** The tool has NO `subtask` parameter. OpenCode commands support `subtask: true/false` in frontmatter. When `subtask: true`:
55: - The command triggers a **subagent invocation** (child session) via `SubtaskPart`
56: - The child session inherits the target agent's config with restricted tools (no `task`, no `todowrite` by default)
57: - The primary agent's context is NOT polluted
58: - [CITED: OpenCode commands docs — `agent` and `subtask` sections]
59: 
60: Commands like `hf-create` (frontmatter: `subtask: true`) are designed to run as subtasks. When the tool dispatches them via TUI injection, they run in the **current session** (foreground), defeating the purpose of `subtask: true`.
61: 
62: **Impact:** Commands with `subtask: true` frontmatter lose their isolation guarantees. The tool cannot honor the command's declared execution mode. This breaks the expected behavior for any command that depends on child-session isolation.
63: 
64: **Evidence:**
65: - [CITED: anomalyco/opencode repo — commands.mdx: "Use the subtask boolean to force the command to trigger a subagent invocation"]
66: - [VERIFIED: `.opencode/commands/hf-create.md` — frontmatter has `subtask: true`]
67: - [VERIFIED: `.opencode/commands/plan.md` and `start-work.md` — frontmatter has `subtask: false`]
68: - [VERIFIED: `src/schema-kernel/command-frontmatter.schema.ts` line 37 — Schema defines `subtask: z.boolean().optional()`]
69: - [VERIFIED: `src/routing/command-engine/types.ts` — `CommandBundle` type does NOT include `subtask` field (line 4-17)]
70: 
71: **Recommended solution:** 
72: 1. Add `subtask: z.boolean().optional()` to the tool's args schema
73: 2. Add a `CommandFrontmatter` model to `CommandBundle` type (currently missing `subtask`, `model`)
74: 3. In execution: if `subtask: true` AND an agent is specified, dispatch via `delegate-task` (or `client.session.create()` → child session) instead of TUI injection
75: 4. Pre-read the command's frontmatter (via `hivemind-command-engine discover` or direct `loadPrimitive`) to auto-detect `subtask` if not explicitly provided
76: 
77: ---
78: 
79: ### GAP-02 (CRITICAL): Uses `appendPrompt`+`submitPrompt` Instead of `tui.executeCommand()` or `session.command()`
80: 
81: | Property | Value |
82: |----------|-------|
83: | **Severity** | CRITICAL |
84: | **Type** | Wrong API usage |
85: | **Affected file** | `src/tools/session/execute-slash-command.ts` (lines 103-111) |
86: 
87: **Description:** The current implementation uses `client.tui.clearPrompt()` → `client.tui.appendPrompt({ body: { text } })` → `client.tui.submitPrompt()` to inject command text into the TUI buffer. This is a **side-channel hack** — it tricks the TUI into treating the injected text as a user-typed command.
88: 
89: OpenCode SDK provides two proper APIs for command execution:
90: 
91: 1. **`tui.executeCommand({ body: { command: "my_command --args" } })`** — Direct TUI command execution. Returns `Promise<boolean>`. No prompt faking needed.
92:    - [CITED: Context7 query — `tui.executeCommand` SDK method signature]
93:    - [CITED: SDK reference — `tui.executeCommand({ body })` returns boolean]
94: 
95: 2. **`session.command({ path: { id }, body: { command, agent, model, arguments } })`** — Session-level command dispatch. Returns `{ info: AssistantMessage, parts: Part[] }`. Accepts `agent` and `model` as first-class body parameters.
96:    - [CITED: Context7 query — `POST /session/:id/command` accepts `agent`, `model`, `command`, `arguments`]
97:    - [CITED: SDK reference — `session.command({ path, body })` returns command response]
98: 
99: **Impact:** 
100: - The TUI injection approach **cannot return command output** — it just submits and hopes
101: - No error feedback: if the command fails, the tool returns "dispatched" success
102: - Cannot pass `agent` or `model` to the execution API (must fake it with `@agent` text prefix)
103: - The tool documentation warns that `session.command()` blocks during active sessions — but `tui.executeCommand()` does NOT have this limitation and is designed for programmatic execution
104: 
105: **Evidence:**
106: - [VERIFIED: src/tools/session/execute-slash-command.ts lines 103-111 — uses appendPrompt+submitPrompt]
107: - [VERIFIED: Context7 query — `tui.executeCommand` exists with `command: string` body parameter]
108: - [VERIFIED: Context7 query — `session.command()` accepts `agent`, `model`, `arguments` in body]
109: - [ASSUMED: `tui.executeCommand()` does not block during active LLM loop — needs verification against OpenCode source]
110: 
111: **Recommended solution:**
112: 1. Replace `clearPrompt()` + `appendPrompt()` + `submitPrompt()` with `client.tui.executeCommand({ body: { command: promptText } })` for foreground dispatch
113: 2. For parameterized dispatch (agent/model/subtask), use `client.session.command()` which accepts `agent`, `model`, `arguments` natively
114: 3. The TUI injection approach should be removed entirely or kept only as a documented fallback
115: 
116: ---
117: 
118: ### GAP-03 (HIGH): No Command Discovery/Vanity Check Before Dispatch
119: 
120: | Property | Value |
121: |----------|-------|
122: | **Severity** | HIGH |
123: | **Type** | Missing validation |
124: | **Affected file** | `src/tools/session/execute-slash-command.ts` (execute function) |
125: 
126: **Description:** The tool does NOT verify that the command exists before dispatching. It blindly sends command text to the TUI. The `hivemind-command-engine` tool (read-side) provides `discover`, `analyze_contract`, `route_preview`, and `list_commands` actions — but the execute-slash-command tool never calls it.
127: 
128: The tool description says: "Use `hivemind-command-engine` with action `discover` or `list_commands` to find available commands first." But there's no integration — no pre-check, no warm-up, no loading of the command's frontmatter before execution.
129: 
130: **Impact:** 
131: - Agents can dispatch commands that don't exist (getting a silent failure from TUI)
132: - The tool cannot apply frontmatter-driven behavior (`subtask`, target `agent`, `model`) because it doesn't read the command's frontmatter before dispatching
133: - The `model` parameter passed by the user may conflict with the command's own frontmatter `model` setting
134: 
135: **Evidence:**
136: - [VERIFIED: src/tools/session/execute-slash-command.ts — no call to command engine or primitive loader]
137: - [VERIFIED: src/tools/hivemind/hivemind-command-engine.ts line 32 — description says "use execute-slash-command to actually dispatch"]
138: - [VERIFIED: src/routing/command-engine/index.ts — `discoverCommandBundles()` and `requireCommand()` exist]
139: 
140: **Recommended solution:**
141: 1. Before dispatching, load the command via `loadPrimitive(filePath, "command")` or `discoverCommandBundles()`
142: 2. If command not found, return early with a clear error: "Command X not found"
143: 3. If found, read frontmatter (`agent`, `model`, `subtask`) and let explicit tool parameters override frontmatter values
144: 4. Consider adding a `--dry-run` or `preview` mode that shows the resolved command parameters before execution
145: 
146: ---
147: 
148: ### GAP-04 (HIGH): Shallow Agent Switching — Text Prepend vs. Real Session Switch
149: 
150: | Property | Value |
151: |----------|-------|
152: | **Severity** | HIGH |
153: | **Type** | Behavioral mismatch |
154: | **Affected file** | `src/tools/session/execute-slash-command.ts` (lines 86-89) |
155: 
156: **Description:** The tool prepends `@agent` to the command text (`@hm-researcher /deep-research-synthesis-repomix vitest`). This causes the TUI to textually contain `@agent`, which the TUI then processes — BUT the tool returns control to the calling agent immediately. The real OpenCode `@agent /command` TUI flow:
157: 1. Switch the front-facing agent to `@agent` (session context switches)
158: 2. Execute the command under the new agent's session
159: 3. After command completes, return to the original agent
160: 
161: The current tool does none of the session switching or return-to-original logic. It also has no way to detect when the switched agent finishes.
162: 
163: **Impact:** Commands that depend on `@agent` context switching (to change capabilities, model, or tool permissions) won't work correctly. The calling agent receives no feedback about the switched agent's execution.
164: 
165: **Evidence:**
166: - [CITED: OpenCode agents docs — "You can switch between agents during a session or invoke them with the @ mention"]
167: - [VERIFIED: src/tools/session/execute-slash-command.ts lines 86-89 — simple text prepend, no SDK agent switching call]
168: - [ASSUMED: The TUI does handle `@agent` syntax natively after submitPrompt() — but control returns to the calling agent, not the switched agent]
169: 
170: **Recommended solution:**
171: 1. Use `session.command()` with the `agent` body parameter — this natively routes the command to the specified agent
172: 2. If agent switching is desired (not just command routing), use the plugin's `client` to create a child session with the target agent
173: 3. Document that for simple command execution without agent switching, `agent` parameter is preferred over prefixing `@agent`
174: 
175: ---
176: 
177: ### GAP-05 (HIGH): Model Override is Textual, Not Structural
178: 
179: | Property | Value |
180: |----------|-------|
181: | **Severity** | HIGH |
182: | **Type** | Behavioral mismatch |
183: | **Affected file** | `src/tools/session/execute-slash-command.ts` (description + execute) |
184: 
185: **Description:** The tool's description says model override is "prepended as a model tag in the prompt text" — but looking at the actual code, the `model` parameter is documented but **never actually used** in prompt construction. The parameter exists in the schema but the execute function only uses `args.agent`, `args.command`, and `args.arguments` for the prompt text. The model is only recorded in metadata.
186: 
187: **Impact:** The `model` parameter is a no-op — it does nothing. Users passing it get the impression the command will run with a different model, but it won't.
188: 
189: **Evidence:**
190: - [VERIFIED: src/tools/session/execute-slash-command.ts line 66-68 — `model` parameter is documented as "prepended as a model tag"]
191: - [VERIFIED: src/tools/session/execute-slash-command.ts lines 85-98 — `parts` array only includes `@agent`, `/command`, and `arguments`; NO model tag]
192: - [CITED: `session.command()` API — accepts `model` as first-class body parameter]
193: 
194: **Recommended solution:**
195: 1. Either implement the model tag in the prompt text (or more properly, use `session.command()` which supports `model` natively)
196: 2. OR remove the `model` parameter if it's not actually supported through the TUI injection approach
197: 3. If using `session.command()`, model override works correctly
198: 
199: ---
200: 
201: ### GAP-06 (MEDIUM): No Structured Argument Format Support
202: 
203: | Property | Value |
204: |----------|-------|
205: | **Severity** | MEDIUM |
206: | **Type** | Missing feature |
207: | **Affected file** | `.opencode/commands/` patterns, `src/tools/session/execute-slash-command.ts` |
208: 
209: **Description:** The tool accepts `arguments: string` as a flat string. But OpenCode commands use structured argument patterns:
210: - `$ARGUMENTS` — all arguments as a single string (most common)
211: - `$1`, `$2`, `$3` — positional arguments
212: - `!command` — bash injection (`!npm test` outputs command result)
213: - `@file` — file reference (`@src/components/Button.tsx` includes file content)
214: 
215: The `hivemind-command-engine` `analyze_contract` action detects `acceptsArguments`, and the primitive loader detects `has_arguments`, `has_positional_params`, `has_bash_injection`, `has_file_reference`. But the execute tool doesn't use this metadata.
216: 
217: **Impact:** Agents calling the tool don't know what argument format a command expects. They must guess between "pass arguments as flat string" or "use flag-like syntax." Real command files like `gsd-plan-phase.md` document complex flag patterns (`--research`, `--skip-research`, `--research-phase <N>`, `--view`, `--gaps`, `--prd <file>`, etc.) — these are all flattened into a single string.
218: 
219: **Evidence:**
220: - [VERIFIED: `.opencode/commands/gsd-plan-phase.md` lines 3-4 — `argument-hint: "[phase] [--auto] [--research] [--skip-research] [--research-phase <N>] ..."`
221: - [VERIFIED: `src/schema-kernel/command-frontmatter.schema.ts` lines 56-67 — `CommandTemplateFeaturesSchema` detects `has_arguments`, `has_positional_params`, `has_bash_injection`, `has_file_reference`]
222: - [VERIFIED: `src/routing/command-engine/types.ts` `CommandListEntry` line 146 — `acceptsArguments: boolean` exists]
223: - [VERIFIED: `src/routing/command-engine/index.ts` line 55 — `acceptsArguments: command.body.includes("$ARGUMENTS")`]
224: 
225: **Recommended solution:**
226: 1. Document the `argument-hint` convention for command frontmatter (non-standard but used by gsd commands)
227: 2. Add a `CommandTemplateFeatures` field to the `CommandBundle` type so agents can discover argument format requirements
228: 3. Consider adding an `argument-hint` optional field to the tool's args schema for documentation purposes
229: 
230: ---
231: 
232: ### GAP-07 (MEDIUM): No Scope-Aware Resolution (Project vs Global)
233: 
234: | Property | Value |
235: |----------|-------|
236: | **Severity** | MEDIUM |
237: | **Type** | Missing awareness |
238: | **Affected file** | `src/tools/session/execute-slash-command.ts` |
239: 
240: **Description:** OpenCode uses first-wins merging: project-level commands override global commands (same name). The `hivemind-command-engine` already handles this correctly via `loadPrimitives()` which scans both `~/.config/opencode/` and `.opencode/`. But the execute tool doesn't load or verify the command's source scope before dispatch.
241: 
242: **Impact:** If a command exists only globally, the tool dispatches it to the TUI which will find it. But the tool cannot report where the command is defined, cannot warn about project/global conflicts, and cannot provide source-of-truth feedback.
243: 
244: **Evidence:**
245: - [VERIFIED: `src/features/bootstrap/primitive-loader.ts` lines 178-183 — `resolvePrimitiveDirs()` scans both project and global paths]
246: - [VERIFIED: `src/features/bootstrap/primitive-loader.ts` lines 210-232 — `scanCommands()` uses first-wins resolution]
247: - [ASSUMED: The TUI also resolves project-first per OpenCode conventions — but no explicit verification]
248: 
249: **Recommended solution:**
250: 1. Load the command's frontmatter before dispatch (as recommended in GAP-03) — this inherently resolves scope
251: 2. Include `source` (project/global) and `filePath` in the tool's metadata response
252: 
253: ---
254: 
255: ### GAP-08 (MEDIUM): Single Execution Mode — Missing Strategy Selection
256: 
257: | Property | Value |
258: |----------|-------|
259: | **Severity** | MEDIUM |
260: | **Type** | Missing feature |
261: | **Affected file** | `src/tools/session/execute-slash-command.ts` (entire execute function) |
262: 
263: **Description:** The tool only supports foreground TUI execution. OpenCode commands should support two execution modes:
264: 
265: | Mode | When | How |
266: |------|------|-----|
267: | **Foreground** | Default; simple commands, commands without `subtask:true` | `tui.executeCommand()` — command runs in current session |
268: | **Subtask** | `subtask:true` in frontmatter or tool args | Child session via `task` tool or `session.create()` — preserves parent context |
269: 
270: Commands like `hf-create` (frontmatter: `subtask: true`) should run as subtasks. The tool currently treats them the same as foreground commands.
271: 
272: **Impact:** Command frontmatter `subtask` setting is ignored. Commands designed for isolation run in the primary session, polluting context.
273: 
274: **Evidence:**
275: - [VERIFIED: `.opencode/commands/hf-create.md` — `subtask: true`]
276: - [VERIFIED: `.opencode/commands/plan.md` — `subtask: false`]
277: - [CITED: OpenCode commands docs — "subtask: true forces the command to trigger a subagent invocation"]
278: - [VERIFIED: `src/tools/session/execute-slash-command.ts` — no subtask parameter, no mode selection]
279: 
280: **Recommended solution:**
281: 1. Add execution mode logic: read command frontmatter `subtask`, merge with explicit tool parameters
282: 2. If `subtask: true` → delegate to child session via the existing `delegate-task` tool or `client.session.create()`
283: 3. If `subtask: false` or absent → use foreground `tui.executeCommand()`
284: 4. Default to foreground when `subtask` is absent in both frontmatter and tool args
285: 
286: ---
287: 
288: ### GAP-09 (LOW): No Error Feedback from TUI Pipeline
289: 
290: | Property | Value |
291: |----------|-------|
292: | **Severity** | LOW |
293: | **Type** | Error handling gap |
294: | **Affected file** | `src/tools/session/execute-slash-command.ts` (lines 113-128) |
295: 
296: **Description:** The tool returns a hardcoded success message: "Command X dispatched to TUI prompt." It does not capture or relay any response from the TUI. If the TUI rejects the command (not found, syntax error, permission denied), the tool reports "dispatched" and the error surfaces later as context grows cold.
297: 
298: The `tui.executeCommand()` API returns `Promise<boolean>` — at least providing a success/failure signal.
299: 
300: **Impact:** Agents cannot detect failed command dispatch. They assume the command ran successfully and continue their workflow, only to discover later that nothing happened.
301: 
302: **Evidence:**
303: - [VERIFIED: src/tools/session/execute-slash-command.ts lines 113-128 — hardcoded success message]
304: - [CITED: Context7 query — `tui.executeCommand()` returns boolean]
305: 
306: **Recommended solution:**
307: 1. Switch to `tui.executeCommand()` and check the boolean return value
308: 2. Return meaningful error messages on failure
309: 3. If `session.command()` is used instead, the response contains `{ info, parts }` with actual command output
310: 
311: ---
312: 
313: ### GAP-10 (LOW): Model Field Documented But Unused in Prompt
314: 
315: | Property | Value |
316: |----------|-------|
317: | **Severity** | LOW |
318: | **Type** | Documentation/code mismatch |
319: | **Affected file** | `src/tools/session/execute-slash-command.ts` (line 67 — docstring) |
320: 
321: **Description:** The tool description says the model parameter is "prepended as a model tag in the prompt text" — but looking at the actual execution code (lines 85-98), `args.model` is never used to construct the prompt text. The model parameter only appears in metadata.
322: 
323: **Impact:** The `model` parameter is misleading — it's documented but has no runtime effect.
324: 
325: **Evidence:**
326: - [VERIFIED: src/tools/session/execute-slash-command.ts lines 66-68 — docstring claims model is "prepended"]
327: - [VERIFIED: src/tools/session/execute-slash-command.ts lines 85-98 — `model` not in `parts` array construction]
328: - [VERIFIED: src/tools/session/execute-slash-command.ts line 120 — model only in metadata, not in output text]
329: 
330: **Recommended solution:** Same as GAP-05. Either implement it or remove the parameter.
331: 
332: ---
333: 
334: ## Integration Dependencies
335: 
336: | Gap | Depends On | Affects |
337: |-----|-----------|---------|
338: | GAP-01 (subtask) | Command frontmatter loading | `src/tools/delegation/delegate-task.ts` (if routing to child session) |
339: | GAP-02 (tui.executeCommand) | OpenCode SDK `tui.executeCommand()` availability | None — SDK already provides it |
340: | GAP-03 (discovery) | `src/routing/command-engine/index.ts` or `src/features/bootstrap/primitive-loader.ts` | None — both modules exist |
341: | GAP-04 (agent switching) | `session.command()` with `agent` body param | None — SDK supports it |
342: | GAP-05 (model override) | `session.command()` with `model` body param | None — SDK supports it |
343: | GAP-06 (argument format) | Command frontmatter parsing | `src/schema-kernel/command-frontmatter.schema.ts` (already exists) |
344: | GAP-07 (scope) | Primitive loader | None — already exists |
345: | GAP-08 (mode selection) | GAP-01 + GAP-02 | Subagent dispatch flow |
346: | GAP-09 (error feedback) | GAP-02 | None — return value from `tui.executeCommand()` |
347: | GAP-10 (model doc) | GAP-05 | None — documentation fix |
348: 
349: ---
350: 
351: ## Suggested Implementation Phases
352: 
353: ### Phase A — Quick Wins (LOW effort, HIGH value)
354: 1. **GAP-10** — Fix documentation: remove "prepended as a model tag" claim or implement it
355: 2. **GAP-03** — Add pre-dispatch command discovery: load the command, verify it exists, read frontmatter
356: 3. **GAP-09** — Add error feedback: check `tui.executeCommand()` return value or `session.command()` response
357: 
358: ### Phase B — Core API Upgrade (MEDIUM effort, CRITICAL value)
359: 4. **GAP-02** — Replace TUI injection with `tui.executeCommand()` for foreground commands
360: 5. **GAP-05** — Implement `model` override via `session.command()` body parameter (or document as unavailable)
361: 6. **GAP-04** — Implement proper agent switching via `session.command({ body: { agent: "..." } })` instead of text prepend
362: 
363: ### Phase C — Subtask/Mode Support (HIGH effort, CRITICAL value)
364: 7. **GAP-01** — Add `subtask` parameter and child-session dispatch strategy
365: 8. **GAP-08** — Implement dual-mode execution: foreground vs. subtask, selected by frontmatter + tool args
366: 
367: ### Phase D — Polish (LOW effort, MEDIUM value)
368: 9. **GAP-06** — Surface argument format metadata in tool output
369: 10. **GAP-07** — Surface scope resolution info in tool output
370: 
371: ---
372: 
373: ## State of the Art
374: 
375: | Old Approach (Current) | New Approach | When Changed | Impact |
376: |-----------------------|-------------|--------------|--------|
377: | `appendPrompt` + `submitPrompt` (TUI injection) | `tui.executeCommand({ body: { command } })` | Phase B | Proper API, returns boolean, no buffer manipulation |
378: | No command discovery | Pre-dispatch `loadPrimitive()` check | Phase A | Validates command exists, reads frontmatter |
379: | `@agent` text prepend | `session.command({ body: { agent } })` | Phase B | Native agent routing, no context switching hacks |
380: | Model parameter unused (metadata only) | `session.command({ body: { model } })` | Phase B | Model override actually works |
381: | No subtask support | `delegate-task` or child session | Phase C | Honours command frontmatter `subtask` setting |
382: 
383: ---
384: 
385: ## Assumptions Log
386: 
387: | # | Claim | Section | Risk if Wrong |
388: |---|-------|---------|---------------|
389: | A1 | `tui.executeCommand()` does not block during active LLM loop | GAP-02 | If it blocks, current TUI injection may be the only viable approach |
390: | A2 | OpenCode TUI handles `@agent` prefix natively after `submitPrompt()` | GAP-04 | If TUI doesn't parse `@agent` from injected text, agent switching never worked |
391: 
392: ---
393: 
394: ## Open Questions
395: 
396: 1. **Does `tui.executeCommand()` work during an active LLM loop (tool context)?**
397:    - The SDK docs confirm it exists but don't specify blocking semantics
398:    - Current code chose TUI injection specifically to avoid `session.command()` blocking
399:    - **Recommendation:** Test `tui.executeCommand()` in an active session before committing to Phase B
400: 
401: 2. **Does the TUI `@agent` prefix work when injected programmatically (not typed by user)?**
402:    - The SDK agents docs describe `@mention` as "user message" syntax
403:    - Current tool relies on this working in injected text
404:    - **Recommendation:** Verify behavior; switch to `session.command()` with native `agent` parameter instead
405: 
406: 3. **What is the `arguments` format expected by `session.command()`?**
407:    - SDK docs show `arguments: { action: "status" }` (object) but also `args: ["arg1", "arg2"]` (array)
408:    - Current tool passes flat string
409:    - **Recommendation:** Determine the correct args shape for the OpenCode server API version in use
410: 
411: ---
412: 
413: ## Sources
414: 
415: ### Primary (HIGH confidence)
416: - [Context7 /anomalyco/opencode] — `tui.executeCommand`, `session.command`, `subtask` docs, agent switching
417: - [VERIFIED: src/tools/session/execute-slash-command.ts] — Current implementation (lines 49-152)
418: - [VERIFIED: src/routing/command-engine/index.ts] — Command discovery and contract analysis
419: - [VERIFIED: src/routing/command-engine/types.ts] — `CommandBundle`, `CommandFrontmatter` (missing `subtask`)
420: - [VERIFIED: src/schema-kernel/command-frontmatter.schema.ts] — `CommandFrontmatterSchema` with `subtask`
421: - [VERIFIED: .opencode/commands/hf-create.md] — Example: `subtask: true`
422: - [VERIFIED: .opencode/commands/plan.md] — Example: `subtask: false`
423: - [VERIFIED: .opencode/commands/gsd-plan-phase.md] — Example: complex argument patterns
424: 
425: ### Secondary (MEDIUM confidence)
426: - [CITED: OpenCode platform reference — opencode-commands.md] — Frontmatter fields and subtask behavior
427: - [CITED: OpenCode platform reference — opencode-agents.md] — Agent switching and @mention syntax
428: - [CITED: OpenCode platform reference — opencode-sdk.md] — SDK API signatures
429: 
430: ### Tertiary (LOW confidence)
431: - [ASSUMED: `tui.executeCommand()` non-blocking behavior] — Needs live verification
432: 
433: ---
434: 
435: ## Metadata
436: 
437: **Confidence breakdown:**
438: - Standard stack: HIGH — SDK APIs confirmed via Context7
439: - Architecture: HIGH — All code paths verified against actual source files
440: - Pitfalls: HIGH — All 10 gaps confirmed with direct source evidence
441: 
442: **Research date:** 2026-05-21
443: **Valid until:** 2026-07-21 (stable OpenCode SDK — 60 days)

(End of file - total 443 lines)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin-private/.hivemind/AGENTS.md
# Internal State Sector Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`.hivemind/` is the Internal State sector and canonical Q6 state root for Hivemind runtime persistence: session continuity, delegation records, config workflow state, event tracker artifacts, session journals, execution lineage, and recovery artifacts. Source evidence: `.planning/codebase/ARCHITECTURE.md:247-255`, `.planning/codebase/ARCHITECTURE.md:405-411`, `.planning/codebase/STRUCTURE.md:130-134`.

## 2. Allowed mutation authority

- Typed runtime owners in `src/task-management/`, `src/coordination/`, and `src/features/` may write their assigned state files through approved persistence modules. Evidence: `.planning/codebase/ARCHITECTURE.md:311-315`, `.planning/codebase/ARCHITECTURE.md:405-411`.
- Tools may trigger state mutations through library owners when the tool contract permits mutation. Evidence: `.planning/codebase/ARCHITECTURE.md:339-353`.
- Event tracker artifacts may be best-effort hook-driven outputs only when routed through library/event-tracker owners; they must not block canonical handling. Evidence: `.planning/codebase/ARCHITECTURE.md:302-315`, `.planning/codebase/ARCHITECTURE.md:388-392`.

## 3. Forbidden mutations / explicit no-go boundaries

- Hooks SHALL NOT directly write durable state into `.hivemind/`; hook effects must stay observation/response-shaping/guard-decision. Evidence: `.planning/codebase/ARCHITECTURE.md:339-353`.
- `.hivemind/` state SHALL NOT be moved back into `.opencode/`; `.opencode/state/` is legacy migration-only. Evidence: `.planning/codebase/ARCHITECTURE.md:351-353`, `.planning/codebase/STRUCTURE.md:295-299`.
- Do not fabricate missing state subdirectories or ownership modules from documentation-only work; bootstrap/state ownership remains an active gap. Evidence: `.planning/PROJECT.md:29-42`, `.planning/REQUIREMENTS.md:46-56`.
- Do not edit runtime state artifacts manually unless a recovery workflow explicitly authorizes it.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| `src/task-management/continuity/` | Owns session continuity JSON persistence | Must deep-clone/normalize/quarantine through code owners |
| `src/task-management/continuity/delegation-persistence.ts` | Owns delegation record I/O | Tools/managers call the owner, not raw edits |
| Event tracker/session journal/lineage modules | Produce audit and timeline artifacts | Best-effort artifacts are not completion proof by themselves |
| Sidecar/planning readers | May read canonical artifacts | Read-only consumers must not mutate state |
| Recovery workflows | Assess and repair state under authorization | Must preserve evidence and avoid manual drift |

## 5. Naming and placement conventions

- Current known state folders include `.hivemind/state/`, `.hivemind/event-tracker/`, and `.hivemind/poor-prompts/`. Evidence: `.planning/codebase/STRUCTURE.md:40-43`, `.planning/codebase/STRUCTURE.md:130-134`.
- State files should be owned by typed modules before being treated as runtime-contract surfaces. Evidence: `.planning/PROJECT.md:29-42`, `.planning/REQUIREMENTS.md:46-56`.
- Do not use `.opencode/` for new internal state naming or placement. Evidence: `.planning/codebase/ARCHITECTURE.md:247-255`.

## 6. Quality gates and evidence expectations

- State-sector changes require proof of the owning module, migration behavior, and recovery/quarantine behavior when applicable.
- Unit tests alone do not prove restart recovery; runtime recovery claims need integration or live restart evidence.
- Docs-only edits remain L5 evidence and must not unblock CA-04 bootstrap/state ownership readiness. Evidence: `.planning/ROADMAP.md:29-49`.

</system-reminder>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivemind/planning/research/opencode-sdk-subtask-mechanism-2026-05-21.md"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin-private/.hivemind/planning/research/opencode-sdk-subtask-mechanism-2026-05-21.md</path>
<type>file</type>
<content>
1: [LANGUAGE: Write this file in en per Language Governance.]
2: # OpenCode SDK Subtask/Command Delegation Mechanism — Research
3: 
4: **Researched:** 2026-05-21
5: **Domain:** OpenCode SDK v1.14.44 — Command execution, subtask spawning, agent switching, config merge
6: **Confidence:** HIGH
7: 
8: ## Summary
9: 
10: OpenCode supports two distinct command execution modes: **foreground** (direct TUI prompt injection via `@agent /command`) and **subtask** (isolated child session via the `task` tool). The subtask mechanism is controlled by command frontmatter fields (`subtask: true`, `agent: xxx`) and operates by creating a `SubtaskPart` message that the session loop detects and routes to `handleSubtask()`, which invokes the built-in `TaskTool` to spawn a child session.
11: 
12: The Hivemind project's existing `execute-slash-command` tool ONLY uses the TUI append+submit path. It does not leverage `session.command()` (which dispatches commands programmatically without TUI interaction) or the subtask path. This research documents both paths and their tradeoffs.
13: 
14: **Primary recommendation:** The `execute-slash-command` tool should adopt `session.command()` as the primary dispatch mechanism (programmatic, non-blocking, supports agent/model overrides via the API directly rather than string concatenation), and use the TUI append+submit path only as a fallback when `session.command()` is unavailable or blocked.
15: 
16: ---
17: 
18: ## User Constraints (from discuss context)
19: 
20: > No CONTEXT.md was provided. This research is independent exploration of the OpenCode SDK subtask mechanism.
21: 
22: ---
23: 
24: ## Phase Requirements
25: 
26: > No phase requirement IDs were provided. This research is exploratory/synthesis-oriented.
27: 
28: ---
29: 
30: ## Architectural Responsibility Map
31: 
32: | Capability | Primary Tier | Secondary Tier | Rationale |
33: |------------|-------------|----------------|-----------|
34: | Command dispatch | OpenCode Server API | TUI Pipeline | `session.command()` is the designed programmatic API; TUI path is a fallback |
35: | Subtask execution | OpenCode TaskTool | Plugin SDK | TaskTool is built-in; subtask:true triggers it automatically |
36: | Agent switching | OpenCode Session Manager | TUI Keybindings | Programmatic via session.command(agent:xxx); TUI via `@mention` or Tab cycle |
37: | Command discovery | Primitive Loader | OpenCode Server config API | `loadPrimitives()` scans filesystem; no runtime SDK query exists |
38: 
39: ---
40: 
41: ## 1. How OpenCode's Subtask Mechanism Works Internally
42: 
43: ### 1.1 Frontmatter Configuration
44: 
45: Commands in OpenCode are defined as `.md` files with YAML frontmatter or via `opencode.json`. The relevant fields are:
46: 
47: ```yaml
48: ---
49: description: Run a deep research synthesis
50: agent: hm-researcher
51: subtask: true
52: model: anthropic/claude-sonnet-4-20250514
53: ---
54: ```
55: 
56: [VERIFIED: DeepWiki analysis of anomalyco/opencode source — command frontmatter parsing]
57: 
58: The Hivemind project's `CommandFrontmatterSchema` confirms these exact fields:
59: 
60: ```typescript
61: // Source: src/schema-kernel/command-frontmatter.schema.ts (in-project)
62: export const CommandFrontmatterSchema = z.object({
63:   description: z.string().min(1),
64:   agent: z.string().min(1).optional(),
65:   model: z.string().min(1).optional(),
66:   subtask: z.boolean().optional(),
67: }).strict()
68: ```
69: 
70: ### 1.2 Subtask Detection Logic
71: 
72: When a command is executed, OpenCode determines whether to create a subtask using this condition:
73: 
74: ```
75: isSubtask = (agent.mode === "subagent" && cmd.subtask !== false) || cmd.subtask === true
76: ```
77: 
78: [VERIFIED: DeepWiki analysis of anomalyco/opencode source — command.ts subtask detection]
79: 
80: This means:
81: - If the target agent's mode is `"subagent"` and `subtask` is NOT explicitly `false` → subtask is **implied**
82: - If `subtask: true` is explicitly set → subtask is **forced**
83: - If `subtask: false` is explicitly set → subtask is **suppressed** (even for subagents)
84: 
85: ### 1.3 SubtaskPart Creation
86: 
87: When `isSubtask` is true, OpenCode creates a `SubtaskPart` instead of regular message parts:
88: 
89: ```
90: SubtaskPart {
91:   type: "subtask",
92:   agent: "<agent-name>",       // From frontmatter agent field
93:   description: "...",          // From frontmatter description
94:   command: "/command args",    // The original command string
95:   prompt: "<resolved template>", // Frontmatter body with $ARGUMENTS resolved
96:   model: "<provider/model>",   // Optional model override
97: }
98: ```
99: 
100: This part is then sent to the session via `prompt()` with the subtask part in the `parts` array.
101: 
102: [VERIFIED: DeepWiki analysis of anomalyco/opencode source — command.ts SubtaskPart creation]
103: 
104: ### 1.4 Session Loop Detection and Task Tool Invocation
105: 
106: The main session loop detects the `SubtaskPart` and calls `handleSubtask()`, which:
107: 
108: 1. Creates an `AssistantMessage` for the subtask context
109: 2. Creates a `ToolPart` with `tool: TaskTool.id` (the built-in task tool identifier)
110: 3. Prepares task arguments from the `SubtaskPart` fields:
111:    - `prompt` → the resolved template text
112:    - `description` → command description
113:    - `subagent_type` → the agent name (from frontmatter `agent` field)
114:    - `command` → the original command string
115: 4. Executes the `TaskTool` with these arguments
116: 
117: [VERIFIED: DeepWiki analysis — handleSubtask function in session loop]
118: 
119: ### 1.5 TaskTool Child Session Spawning
120: 
121: The `TaskTool` then:
122: 
123: 1. Validates the subagent type exists
124: 2. Creates a **new child session** with `parentSessionID` set to the current session
125: 3. Derives appropriate permissions for the subagent
126: 4. Calls `ops.prompt()` to run the prompt loop in **that child session**
127: 5. Returns the result text
128: 
129: Key detail: The child session inherits the target agent's configuration (temperature, tools, permissions) but has restricted tool access — `task` and `todowrite` are excluded by default to prevent nested subtask chains.
130: 
131: [VERIFIED: DeepWiki analysis — TaskTool implementation]
132: 
133: ### 1.6 The `@agent /command` Syntax (Foreground Dispatch)
134: 
135: When a user types `@specialist /command args` in the TUI, two separate mechanisms trigger:
136: 
137: 1. **`@specialist`** — The `@mention` creates an "agent part" in the message. When the message is processed, if the part type is "agent", it triggers a subtask invocation using the `task` tool with the specified subagent name. The subagent operates in its own child session.
138: 
139: 2. **`/command args`** — The slash command text is parsed by the autocomplete system. Commands are resolved from `Command.Service` which aggregates from:
140:    - Built-in defaults (`/init`, `/undo`, `/redo`, `/share`, `/help`)
141:    - `opencode.json` config (`command.test`, etc.)
142:    - MCP server command definitions
143:    - Custom `.opencode/commands/*.md` files
144:    - Skills with commands
145: 
146: The combined syntax `@agent /command args` works as follows:
147: 1. TUI prepends `@agent` which triggers agent part creation
148: 2. `/command args` is parsed as a slash command
149: 3. If the command has `subtask: true` frontmatter, it creates a `SubtaskPart` that routes to the command's configured agent (NOT the `@mentioned` agent necessarily)
150: 4. If no subtask, the agent part routes to the `@mentioned` agent
151: 
152: [VERIFIED: DeepWiki analysis — TUI agent mention and command execution flow]
153: 
154: ### 1.7 How `@agent` Works Without a Command
155: 
156: When you type `@explore` (without a command), the agent mention creates an agent part. The session loop detects this and calls `handleSubtask()` which invokes the TaskTool with the mentioned agent as `subagent_type`. This creates a child session where the mentioned agent runs with its own configuration.
157: 
158: The user navigates between sessions using:
159: - `session_child_first` (default: `<Leader>+Down`) — enter first child session
160: - `session_child_cycle` (Right) — cycle between sibling sessions
161: - `session_parent` (Up) — return to parent session
162: 
163: Tab key or `agent.cycle` keybinding switches **primary agents** (Build, Plan) in the main session — this is different from subagent `@mention`.
164: 
165: [VERIFIED: DeepWiki analysis — session navigation and agent cycle]
166: 
167: ---
168: 
169: ## 2. How `@agent` Switching Works in OpenCode's TUI
170: 
171: ### Step-by-step Flow
172: 
173: 1. **User types `@` in TUI** → Autocomplete system triggers, listing available agents (primary + subagents)
174: 2. **User selects/completes `@agentName`** → Creates an "agent part" in the message buffer
175: 3. **User types `/command args`** (or just text) → Slash command or free text is parsed
176: 4. **User presses Enter** → Message is submitted to the session
177: 5. **Session loop processes message parts**:
178:    - If part type is `"agent"` → routes to `handleSubtask()` for that agent
179:    - If part type is `"text"` and contains `/command` → routes through command execution
180:    - If both agent part + command → command frontmatter `agent` field determines target, NOT the `@mentioned` agent (unless they match)
181: 6. **Subtask execution** → TaskTool creates child session, target agent runs in isolated context
182: 7. **Return to parent** → Subagent session completes, control returns to parent session
183: 
184: ### Primary Agent Switching (Tab key)
185: 
186: Separate from `@mention`:
187: - Tab or `agent.cycle` calls `local.agent.move(1)` to cycle to the next primary agent
188: - This switches the entire session's active agent, NOT creating a child session
189: - Available primary agents are configured in `opencode.json` under `agent` key
190: 
191: [VERIFIED: DeepWiki analysis — agent switching, session navigation]
192: 
193: ---
194: 
195: ## 3. Command Frontmatter vs Tool Parameter Precedence
196: 
197: ### The Relationship
198: 
199: Command frontmatter fields and task tool parameters operate at **different levels** of the system:
200: 
201: | Level | Input | Scope |
202: |-------|-------|-------|
203: | **Configuration** | Command frontmatter (`agent`, `subtask`, `model`) | Defines HOW a command behaves when invoked |
204: | **Runtime** | Task Tool parameters (`subagent_type`, `prompt`, `command`) | Actual values passed during execution |
205: 
206: **There is no direct conflict.** The command frontmatter determines what values are RESOLVED and passed to the Task Tool parameters:
207: 
208: ```
209: Frontmatter agent: "hm-researcher"  →  TaskTool subagent_type: "hm-researcher"
210: Frontmatter subtask: true           →  TaskTool creates child session
211: Frontmatter model: "anthropic/..."  →  TaskTool context includes model override
212: ```
213: 
214: ### Key Distinctions
215: 
216: - **Command `agent` field** → Determines which subagent to invoke (becomes `subagent_type` in TaskTool). If no `agent` is set, the current session's agent is used.
217: - **Command `subtask` field** → Forces/prevents subtask creation regardless of agent mode
218: - **Plugin tool `agent` parameter** (e.g., in `execute-slash-command`) → This is a plugin-level parameter injected into the command text as `@agent`. It does NOT override the command frontmatter's `agent` field. However, in the TUI, `@agent /command` creates an agent part that routes to `@agent` for the session, while the command's frontmatter `agent` routes the command itself.
219: 
220: **Practical precedence when both exist:**
221: 
222: If a command has `agent: hm-researcher` in frontmatter AND the user types `@build /command`:
223: - The `@build` agent part routes the **session** to a build subagent
224: - The command's frontmatter `agent: hm-researcher` routes the **command** to the hm-researcher agent
225: - These are separate routing decisions and may conflict
226: 
227: [VERIFIED: DeepWiki analysis — command frontmatter tool parameter relationship]
228: 
229: ---
230: 
231: ## 4. Global vs Project Command/Agent Merge Precedence
232: 
233: ### Precedence Order (lowest to highest)
234: 
235: | Priority | Source | Location |
236: |----------|--------|----------|
237: | 1 (lowest) | Remote config | `.well-known/opencode` |
238: | 2 | Global config | `~/.config/opencode/opencode.json` |
239: | 3 | Global commands directory | `~/.config/opencode/commands/*.md` |
240: | 4 | Custom config | `OPENCODE_CONFIG` env var |
241: | 5 | Project config | `opencode.json` at project root |
242: | 6 | Project directory | `.opencode/commands/*.md`, `.opencode/agents/*.md` |
243: | 7 | Inline config | `OPENCODE_CONFIG_CONTENT` env var |
244: | 8 | Account config | Remote account-based config |
245: | 9 (highest) | Managed config | Organization-managed config |
246: 
247: [VERIFIED: DeepWiki analysis — config merge precedence]
248: 
249: ### Merge Strategy
250: 
251: The system uses `mergeConfigConcatArrays` for configuration merging:
252: - **General fields:** Deep merge — later sources override earlier ones for conflicting keys
253: - **Instructions array:** Concatenated and deduplicated (not replaced)
254: - **Commands:** Config-defined commands merged with markdown file commands; `.opencode/commands/` takes precedence over `~/.config/opencode/commands/` for same-named commands
255: - **First-wins on primitive discovery:** The Hivemind primitive loader uses "first-wins" — once a command/agent is discovered from a higher-priority directory, lower-priority sources are skipped for that name
256: 
257: ### Hivemind's Primitive Loader Implementation
258: 
259: The project's `loadPrimitives()` in `src/features/bootstrap/primitive-loader.ts` implements:
260: 
261: ```typescript
262: // Source: src/features/bootstrap/primitive-loader.ts (in-project)
263: // Resolution order: project .opencode/ first, then global config
264: const configRoots = [path.join(root, ".opencode")]
265: if (globalConfigPath) configRoots.push(path.resolve(globalConfigPath))
266: 
267: // First-wins: skip if already discovered from a prior directory
268: if (result.commands.has(name)) continue
269: ```
270: 
271: [VERIFIED: In-project source — primitive-loader.ts lines 178-198]
272: 
273: ### Accepts Both Singular and Plural Directory Names
274: 
275: OpenCode accepts both `commands/` and `command/` (likewise `agents/`/`agent`, `skills/`/`skill`):
276: 
277: ```typescript
278: // Source: primitive-loader.ts
279: const dirs = resolvePrimitiveDirs(root, ["commands", "command"], globalConfigPath)
280: ```
281: 
282: ---
283: 
284: ## 5. SDK Methods for Programmatic Control
285: 
286: ### 5.1 Session Agent Switching
287: 
288: **YES — supported via `session.command()`:**
289: 
290: ```typescript
291: // Source: @opencode-ai/sdk — session.command() accepts agent parameter
292: await client.session.command({
293:   path: { id: sessionId },
294:   body: {
295:     command: "build",
296:     arguments: "run tests",
297:     agent: "build-agent",  // Programmatic agent switching
298:     model: "anthropic/claude-sonnet-4-20250514",
299:   },
300: })
301: ```
302: 
303: The SDK's `session.command()` sends a registered command to a session for execution by the AI assistant. It accepts: `command`, `arguments`, `agent`, `model`, and optional `parts` (file attachments).
304: 
305: The backend handler for `session.command()`:
306: 1. Triggers a `command.execute.before` plugin hook
307: 2. Executes the prompt with the command as context
308: 3. Publishes a `Command.Event.Executed` event
309: 
310: [VERIFIED: DeepWiki analysis — session.command() method]
311: [CITED: Context7 SDK docs — session resource API]
312: 
313: ### 5.2 Subtask Dispatch Without TUI
314: 
315: **YES — via `session.command()` with command that has `subtask: true` configured:**
316: 
317: When a command has `subtask: true` in its frontmatter, calling `session.command()` with that command name triggers the subtask flow:
318: 1. Command frontmatter is read → `isSubtask = true`
319: 2. `SubtaskPart` is created → sent via prompt
320: 3. Session loop detects subtask → `handleSubtask()` → TaskTool → child session
321: 
322: This does NOT require TUI interaction. It works entirely through the SDK's programmatic API.
323: 
324: Direct Task Tool invocation is also possible through the `task` tool, but this is a lower-level approach:
325: 
326: ```typescript
327: // Conceptual: invoking task tool directly (not through command)
328: // Requires: TaskTool.execute() with subagent_type, prompt, description
329: ```
330: 
331: However, the recommended approach is to use `session.command()` with properly configured commands.
332: 
333: [VERIFIED: DeepWiki analysis — subtask flow via session.command()]
334: 
335: ### 5.3 TUI Command Execution
336: 
337: `tui.executeCommand()` exists but is for **TUI control commands** (not session commands):
338: 
339: ```typescript
340: // Source: @opencode-ai/sdk
341: await client.tui.executeCommand({ body: { command: "agent_cycle" } })
342: ```
343: 
344: This executes TUI-level commands (agent switching, panel navigation) — NOT slash commands like `/init` or custom commands. The distinction:
345: - **`session.command()`** → Sends a registered command to the AI assistant within a session
346: - **`tui.executeCommand()`** → Executes a TUI control command (affects the terminal interface)
347: 
348: [VERIFIED: Context7 SDK docs — TUI methods]
349: [VERIFIED: DeepWiki analysis — tui vs session command distinction]
350: 
351: ### 5.4 Checking Command Existence and Reading Frontmatter
352: 
353: **NOT available via SDK.** There is no runtime SDK method for:
354: 
355: - Querying available commands — NOT supported by the SDK API
356: - Reading command metadata/frontmatter programmatically — NOT supported
357: - Validating command existence before execution — NOT supported
358: 
359: **Workaround in Hivemind:** The project's own `loadPrimitives()` in `src/features/bootstrap/primitive-loader.ts` reads and validates command frontmatter from the filesystem directly. The command engine in `src/routing/command-engine/index.ts` provides a `discover` action that discovers available commands.
360: 
361: The Hivemind project's `hivemind-command-engine` tool uses this for discovery:
362: 
363: ```typescript
364: // Source: src/routing/command-engine/index.ts (in-project)
365: export async function discoverCommandBundles(options: { projectRoot: string }) {
366:   const primitives = await loadPrimitives({ projectRoot: options.projectRoot })
367:   const commands = Array.from(primitives.commands.entries())
368:     .map(([name, command]) => ({
369:       name,
370:       source: "opencode-command",
371:       filePath: command.filePath,
372:       description: command.frontmatter.description,
373:       agent: command.frontmatter.agent,
374:       body: command.body,
375:     }))
376:   return { commands, warnings: primitives.warnings }
377: }
378: ```
379: 
380: [VERIFIED: In-project source — command-engine/index.ts, primitive-loader.ts]
381: 
382: ### 5.5 Session Management API
383: 
384: Full SDK session methods available for programmatic control:
385: 
386: | Method | Description | Notes |
387: |--------|-------------|-------|
388: | `session.list()` | List all sessions | Returns Session[] |
389: | `session.get({path})` | Get session by ID | Returns Session |
390: | `session.children({path})` | List child sessions | Key for subtask hierarchy |
391: | `session.create({body})` | Create new session | Returns session ID |
392: | `session.command({path, body})` | Execute command in session | Supports agent, model, arguments |
393: | `session.prompt({path, body})` | Send prompt to session | Supports noReply for context injection |
394: | `session.abort({path})` | Abort running session | |
395: | `tui.appendPrompt({body})` | Append to TUI prompt | Used by current execute-slash-command |
396: | `tui.submitPrompt()` | Submit TUI prompt | Used by current execute-slash-command |
397: | `app.agents()` | List all available agents | Returns Agent[] |
398: 
399: [VERIFIED: Context7 SDK docs — full API table]
400: 
401: ---
402: 
403: ## 6. Implications for Hivemind's execute-slash-command
404: 
405: ### Current Implementation (TUI-Only Path)
406: 
407: The existing tool at `src/tools/session/execute-slash-command.ts`:
408: 
409: ```typescript
410: // Current: TUI append + submit path
411: await client.tui.clearPrompt()
412: await client.tui.appendPrompt({ body: { text: promptText } })
413: await client.tui.submitPrompt()
414: ```
415: 
416: **Pros:**
417: - Works during active LLM loops (non-blocking — queues after current turn)
418: - Simple implementation
419: 
420: **Cons:**
421: - No programmatic result/error feedback
422: - String concatenation for `@agent` and model overrides
423: - Cannot verify if command exists before dispatching
424: - Cannot handle subtask commands properly (they need child sessions)
425: 
426: ### Recommended Enhancement
427: 
428: Replace the TUI-only path with a hybrid approach:
429: 
430: ```typescript
431: // Preferred: session.command() for programmatic dispatch
432: // Falls back to TUI path when session.command() unavailable
433: async function dispatchCommand(client, args) {
434:   try {
435:     // Try programmatic dispatch first
436:     const result = await client.session.command({
437:       path: { id: activeSessionId },
438:       body: {
439:         command: args.command,
440:         arguments: args.arguments,
441:         agent: args.agent,
442:         model: args.model,
443:       },
444:     })
445:     return { success: true, result }
446:   } catch (error) {
447:     // Fallback: TUI path (works during LLM loops)
448:     await client.tui.appendPrompt({ body: { text: promptText } })
449:     await client.tui.submitPrompt()
450:     return { success: true, dispatched: true }
451:   }
452: }
453: ```
454: 
455: **Benefit:** `session.command()` handles subtask routing internally, respects command frontmatter, provides proper error handling, and doesn't need string concatenation for `@agent` prefixes.
456: 
457: [ASSUMED] — This is a design recommendation based on research findings, not a verified implementation.
458: 
459: ---
460: 
461: ## Common Pitfalls
462: 
463: ### Pitfall 1: TUI vs Session Command Confusion
464: **What goes wrong:** Using `tui.executeCommand()` instead of `session.command()` for slash commands. `tui.executeCommand()` is for TUI control (agent cycling, panel navigation), not for dispatching registered commands.
465: **How to avoid:** Use `session.command()` for slash commands; use `tui.executeCommand()` ONLY for TUI control commands.
466: 
467: ### Pitfall 2: `@agent` vs Frontmatter `agent` Conflict
468: **What goes wrong:** When `@agent /command` is used, the `@agent` creates an agent part for the SESSION, but the command's frontmatter `agent` routes the COMMAND. These may conflict.
469: **How to avoid:** Be explicit about intent. If you want a command to run under a specific agent, set the command's frontmatter `agent` field. If you want the session to switch to a specific agent via TUI, use `@agent` without a command or use `session.command({agent: xxx})`.
470: 
471: ### Pitfall 3: Subtask Prevents TUI Append Flow
472: **What goes wrong:** Commands with `subtask: true` spawn child sessions. The TUI append+submit path appends to the PARENT session's prompt, not the child session where the subtask is running.
473: **How to avoid:** Use `session.command()` for subtask commands — it handles child session routing automatically.
474: 
475: ### Pitfall 4: session.command() Blocks During LLM Loop
476: **What goes wrong:** `session.command()` calls `SessionPrompt.prompt()` internally, which blocks until the LLM completes. If called during an active LLM loop, `SessionRunState.ensureRunning()` detects the session is busy and QUEUES the command — it never executes immediately.
477: **How to avoid:** The TUI path (append+submit) bypasses this by injecting into the TUI buffer. Use the hybrid approach: try `session.command()` first, fall back to TUI path when blocked.
478: 
479: [VERIFIED: In-project source — execute-slash-command.ts JSDoc comments]
480: [VERIFIED: DeepWiki analysis — session.command() blocking behavior]
481: 
482: ---
483: 
484: ## State of the Art
485: 
486: | Old Approach | Current Approach | When Changed | Impact |
487: |--------------|------------------|--------------|--------|
488: | `opencode-ai/opencode` (archived) | `anomalyco/opencode` | ~2025-2026 | SDK packages renamed; active development continues |
489: | `session.query()` (renamed) | `session.chat()` → `session.prompt()` | v1.14.x | API surface stabilized |
490: | Legacy agent directory: `~/.claude/agents/` | `.opencode/agents/` | OpenCode launch | New standard; plural + singular names supported |
491: | Legacy command: `CLAUDE.md` | `opencode.json` + `.opencode/commands/*.md` | OpenCode launch | More structured configuration |
492: 
493: ---
494: 
495: ## Sources
496: 
497: ### Primary (HIGH confidence)
498: - [DeepWiki: anomalyco/opencode](https://deepwiki.com/anomalyco/opencode) — Subtask mechanism, handleSubtask, TaskTool, command execution flow, agent switching, config merge
499: - [Context7: /anomalyco/opencode-sdk-js](https://context7.com/anomalyco/opencode-sdk-js) — SDK API documentation (session.command, tui methods, types)
500: - In-project source: `src/tools/session/execute-slash-command.ts` — Current tool implementation
501: - In-project source: `src/routing/command-engine/index.ts` — Command discovery and routing
502: - In-project source: `src/features/bootstrap/primitive-loader.ts` — Primitive loading and frontmatter parsing
503: - In-project source: `src/schema-kernel/command-frontmatter.schema.ts` — Command frontmatter Zod schema
504: 
505: ### Secondary (MEDIUM confidence)
506: - Hivemind project: `.hivemind/STACKS-REFERENCES.md` — OpenCode SDK v1.14.44 confirmation
507: - Hivemind project: `src/tools/hivemind/hivemind-command-engine.ts` — Command discovery companion tool
508: 
509: ### Tertiary (LOW confidence)
510: - [ASSUMED] Recommended hybrid dispatch approach for `execute-slash-command` enhancement — design recommendation, not verified implementation
511: 
512: ---
513: 
514: ## Assumptions Log
515: 
516: | # | Claim | Section | Risk if Wrong |
517: |---|-------|---------|---------------|
518: | A1 | `session.command()` can be used during active LLM loops successfully | Section 6 | If it queues the same as TUI path, the hybrid approach still works (falls back to TUI path) |
519: | A2 | `session.command()` respects command frontmatter `subtask` field | Section 1.2 | The subtask detection is in the command execution path which is called by session.command(); LOW risk |
520: | A3 | `app.agents()` returns the full list including subagents | Section 5.5 | May only return primary agents; verify at implementation time |
521: | A4 | The `@agent` in TUI prompt and command frontmatter `agent` can conflict | Section 2 | DeepWiki analysis confirmed these are separate routing decisions |
522: 
523: ---
524: 
525: ## Open Questions
526: 
527: 1. **Can `session.command()` be called inside an active LLM loop?**
528:    - What we know: `session.command()` calls `SessionPrompt.prompt()` which blocks. `SessionRunState.ensureRunning()` queues it if busy.
529:    - What's unclear: Whether the queuing is reliable or if it silently drops
530:    - Recommendation: Implement hybrid approach (session.command first, TUI fallback)
531: 
532: 2. **How does `app.agents()` resolve agents?**
533:    - What we know: It lists all available agents per the SDK docs
534:    - What's unclear: Whether it returns primary agents only, or also subagents from `.opencode/agents/`
535:    - Recommendation: Test at implementation time; may need `loadPrimitives()` for full discovery
536: 
537: 3. **What session ID should `session.command()` use?**
538:    - What we know: The plugin has access to context via `ctx.directory`, `ctx.worktree`
539:    - What's unclear: How to get the active session ID from within a plugin tool context
540:    - Recommendation: Check if OpenCode plugin context provides session ID; if not, use `tui` path or the SDK's session.list() 
541: 
542: ---
543: 
544: ## Environment Availability
545: 
546: > Phase has no external dependencies — pure API/library research. Skipped.
547: 
548: ---
549: 
550: ## Validation Architecture
551: 
552: > Not applicable — this is research documentation, not a build phase. Skipped.
553: 
554: ---
555: 
556: ## Security Domain
557: 
558: > Not applicable — this is research documentation about API mechanisms, not a build phase. No security implications for the research itself. Skipped.
559: 
560: ---
561: 
562: ## Metadata
563: 
564: **Confidence breakdown:**
565: - Standard stack: HIGH - Live-verified via DeepWiki, Context7, and in-project source cross-reference
566: - Architecture: HIGH - Multiple sources agree on flow, verified against actual source code
567: - Pitfalls: HIGH - Based on verified codebase understanding and real edge cases
568: - SDK methods: MEDIUM - Some claims are based on DeepWiki analysis; actual SDK behavior should be tested
569: 
570: **Research date:** 2026-05-21
571: **Valid until:** 2026-06-21 (OpenCode v1.14.x is stable; will need refresh on major version bumps)

(End of file - total 571 lines)
</content>
```

---

## Assistant (Build · CrofAI: kimi-k2.6 (precision) · 15.4s)

_Thinking:_

Excellent! Both research reports are now complete and comprehensive. Let me synthesize the findings and present them to the user in Vietnamese, as per the language governance.

Let me summarize the key findings and create a master plan for implementation.

 

**Tool: todowrite**

**Input:**
```json
{
  "todos": [
    {
      "priority": "high",
      "content": "Đọc implementation hiển tại của execute-slash-command tool",
      "status": "completed"
    },
    {
      "priority": "high",
      "content": "Khảo sát cấu trúc .opencode/commands và .opencode/agents",
      "status": "completed"
    },
    {
      "priority": "high",
      "content": "Nghiên cứu OpenCode SDK về command/agent primitives qua Context7",
      "status": "completed"
    },
    {
      "priority": "high",
      "content": "Nghiên cứu GSD command parsing patterns",
      "status": "completed"
    },
    {
      "priority": "medium",
      "content": "Nghiên cứu ecosystem repos (opencode-pty, background-agents, awesome-opencode)",
      "status": "completed"
    },
    {
      "priority": "high",
      "content": "Delegate task research tổng hợp và phân tích gaps",
      "status": "completed"
    },
    {
      "priority": "high",
      "content": "Tổng hợp báo cáo và đề xuất giải pháp",
      "status": "completed"
    }
  ]
}
```

**Output:**
```
[
  {
    "content": "Đọc implementation hiển tại của execute-slash-command tool",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Khảo sát cấu trúc .opencode/commands và .opencode/agents",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Nghiên cứu OpenCode SDK về command/agent primitives qua Context7",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Nghiên cứu GSD command parsing patterns",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Nghiên cứu ecosystem repos (opencode-pty, background-agents, awesome-opencode)",
    "status": "completed",
    "priority": "medium"
  },
  {
    "content": "Delegate task research tổng hợp và phân tích gaps",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Tổng hợp báo cáo và đề xuất giải pháp",
    "status": "completed",
    "priority": "high"
  }
]
```

---

## Assistant (Build · CrofAI: kimi-k2.6 (precision) · 25.8s)

_Thinking:_

Now I have all the data I need. Let me write a comprehensive response in Vietnamese as required by the language governance. I'll cover:

1. Summary of findings
2. The 10 gaps identified
3. Design recommendations for the new architecture
4. Implementation phases
5. Key design decisions

The two research files are already committed to disk:
- `.hivemind/planning/research/execute-slash-command-gaps-analysis-2026-05-21.md`
- `.hivemind/planning/research/opencode-sdk-subtask-mechanism-2026-05-21.md`

Let me provide the synthesis to the user.

Cả hai research task đã hoàn thành. Dưới đây là tổng hợp đầy đủ:

---

## Báo Cáo Phân Tích & Đề Xuất Nâng Cấp `execute-slash-command`

**Research artifacts đã ghi vào disk:**
- 📄 `.hivemind/planning/research/execute-slash-command-gaps-analysis-2026-05-21.md` (443 LOC)
- 📄 `.hivemind/planning/research/opencode-sdk-subtask-mechanism-2026-05-21.md` (571 LOC)

---

### 1. Phát Hiện Chính: 10 Gaps (2 CRITICAL, 3 HIGH, 3 MEDIUM, 2 LOW)

| Gap | Severity | Vấn đề |
|-----|----------|--------|
| **GAP-01** | 🔴 CRITICAL | **Missing `subtask` parameter** — Tool không thể honor command frontmatter `subtask: true`. Các commands như `hf-create` (có `subtask: true`) chạy trong primary session thay vì child session, mất isolation. |
| **GAP-02** | 🔴 CRITICAL | **Sai API** — Dùng `appendPrompt`+`submitPrompt` (TUI injection hack) thay vì `tui.executeCommand()` hoặc `session.command()`. Không nhận được feedback kết quả. |
| **GAP-03** | 🟠 HIGH | **Không pre-dispatch discovery** — Tool không kiểm tra command có tồn tại hay đọc frontmatter trước khi dispatch. `hivemind-command-engine` (read-side) bị disconnect hoàn toàn. |
| **GAP-04** | 🟠 HIGH | **Agent switching superficial** — `@agent` chỉ là text prepend, không phải session switch thật. Không có return-to-original-agent logic. |
| **GAP-05** | 🟠 HIGH | **Model parameter là no-op** — Được document nhưng không bao giờ dùng trong prompt construction. Chỉ xuất hiện trong metadata. |
| **GAP-06** | 🟡 MEDIUM | **Không structured argument parsing** — Không hỗ trợ flags, positional args, flag values như GSD commands (`gsd-plan-phase 11 --skip-research`). |
| **GAP-07** | 🟡 MEDIUM | **Không scope-aware** — Không phân biệt project vs global commands/agents. |
| **GAP-08** | 🟡 MEDIUM | **Single execution mode** — Chỉ có foreground TUI, thiếu strategy selection giữa foreground và subtask. |
| **GAP-09** | ⚪ LOW | **Không error feedback từ TUI pipeline** — Luôn trả về "dispatched" dù thành công hay thất bại. |
| **GAP-10** | ⚪ LOW | **Model field documented but unused** — Docstring nói model "được prepended" nhưng code không làm. |

---

### 2. Nguyên Nhân Gốc Rễ

**Cơ chế hiện tại** dùng `client.tui.clearPrompt()` → `client.tui.appendPrompt({ body: { text } })` → `client.tui.submitPrompt()` là một **side-channel hack**. Nó inject command text vào TUI buffer để "đánh lừa" TUI xử lý như user-typed command. Hậu quả:

1. **Không thể** nhận kết quả hay error từ command execution
2. **Không thể** sử dụng `subtask: true` (vì subtask cần child session, không phải TUI append)
3. **`@agent`** chỉ là text string, không phải session context switch thật
4. **`model`** không thể được pass qua TUI path

**Kiến trúc OpenCode SDK thật sự** có 2 API riêng biệt:

| API | Mục đích | Trả về |
|-----|----------|--------|
| `tui.executeCommand({ body: { command } })` | TUI control commands (agent_cycle, panel navigation) | `Promise<boolean>` |
| `session.command({ path: { id }, body: { command, agent, model, arguments } })` | **SES** - Dispatch registered commands programmatically | `{ info: AssistantMessage, parts: Part[] }` |

---

### 3. Kiến Trúc Đề Xuất — Dual-Mode Dispatcher

```
                        ┌─────────────────────────────┐
                        │   execute-slash-command      │
                        │   (enhanced)                 │
                        └──────────┬──────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │  Pre-Dispatch Phase          │
                    │  - Load primitive            │
                    │  - Read frontmatter          │
                    │  - Merge frontmatter + args  │
                    │  - Resolve scope (proj/glob) │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │  Execution Mode Selection    │
                    │                              │
                    │  subtask:true?               │
                    │    └─→ CHILD SESSION PATH    │
                    │       (via delegate-task     │
                    │        hoặc client.session   │
                    │        .create() + TaskTool) │
                    │                              │
                    │  subtask:false/missing?       │
                    │    └─→ FOREGROUND PATH       │
                    │       (session.command()     │
                    │        với agent, model,     │
                    │        arguments)            │
                    └──────────────────────────────┘
```

**Chi tiết 2 chế độ:**

#### Chế độ FOREGROUND (mặc định)
```
Dùng: session.command() với agent + model native parameters
Flow: 
  1. Gọi client.session.command({
       path: { id: activeSessionId },
       body: { command, arguments, agent, model }
     })
  2. Nhận kết quả { info, parts } với feedback
  3. Nếu session.command() block (active LLM loop):
     → Fallback về TUI append+submit path (như hiện tại)
```

#### Chế độ SUBTASK (khi subtask:true)
```
Dùng: delegate-task tool hoặc client.session.create() + task tool
Flow:
  1. Đọc command frontmatter để lấy agent và model
  2. Tạo child session với parentSessionId = currentSession
  3. Dispatch command trong child session với target agent
  4. Child session chạy isolated, không pollution primary context
  5. Kết quả trả về parent session khi complete
```

---

### 4. Các Phase Implementation Đề Xuất

| Phase | Nội dung | Gaps addressed | Effort |
|-------|----------|----------------|--------|
| **Phase A** | Quick wins: fix model doc, add pre-dispatch command discovery, add error feedback | GAP-03, GAP-09, GAP-10 | Thấp |
| **Phase B** | Core API upgrade: replace TUI injection với `session.command()`, implement model override, proper agent routing | GAP-02, GAP-04, GAP-05 | Trung bình |
| **Phase C** | Subtask support: thêm `subtask` parameter, dual-mode execution strategy | GAP-01, GAP-08 | Cao |
| **Phase D** | Polish: surface argument format metadata, scope resolution info | GAP-06, GAP-07 | Thấp |

**Phụ thuộc:** Phase A → Phase B → Phase C (chain), Phase D độc lập.

---

### 5. Mở Rộng Schema (CommandFrontmatter + CommandBundle Types)

Các type hiện tại cần được mở rộng để hỗ trợ:

```typescript
// CommandFrontmatter hiện tại (src/schema-kernel/command-frontmatter.schema.ts)
export const CommandFrontmatterSchema = z.object({
  description: z.string().min(1),
  agent: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  subtask: z.boolean().optional(),           // ✅ Đã có
  // ❌ Thiếu:
  // argumentHint: z.string().optional(),     // argument-hint từ YAML frontmatter
  // type: z.string().optional(),             // "prompt" type như gsd-audit-fix
}).strict()

// CommandBundle types (src/routing/command-engine/types.ts)
export type CommandBundle = {
  name: string
  source: "opencode-command"
  filePath: string
  description: string
  agent?: string
  body: string
  // ❌ Thiếu:
  // model?: string
  // subtask?: boolean
  // templateFeatures?: CommandTemplateFeatures
}
```

---

### 6. Câu Hỏi Mở & Risks

| # | Question | Impact nếu sai |
|---|----------|----------------|
| Q1 | `session.command()` có block trong active LLM loop không? | Nếu có, hybrid fallback vẫn hoạt động nhưng cần verify |
| Q2 | `@agent` trong injected text có hoạt động giống user-typed không? | Nếu không, agent switching chưa bao giờ hoạt động |
| Q3 | `app.agents()` trả về tất cả subagents hay chỉ primary? | Ảnh hưởng agent discovery UI |

---

Bạn muốn tôi proceed với Phase nào trước? Tôi đề xuất bắt đầu với **Phase A** (quick wins) để thiết lập discovery pipeline, sau đó lên **Phase B** (core API upgrade) để chuyển từ TUI injection hack sang `session.command()`. Phase C (subtask) nên làm cuối vì nó phụ thuộc vào Phase B hoàn chỉnh.

---

