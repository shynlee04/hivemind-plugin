# Deep rebuild stack-l3-opencode root skill (@hf-l2-skill-builder subagent)

**Session ID:** ses_1f10811cfffehvgXrVSMVoAP0N
**Created:** 5/10/2026, 5:59:49 AM
**Updated:** 5/10/2026, 6:00:38 AM

---

## User

You are hf-l2-skill-builder, SUBAGENT delegated by hf-l0-orchestrator. This is a COMPLETE REBUILD, not an audit patch.

LOAD THESE SKILLS FIRST:
- hm-l3-deep-research (validate signatures against npm + GitHub API)
- hm-l3-detective (investigate codebase patterns)
- hm-l3-synthesis (compress findings into artifacts)
- hf-l2-skill-synthesis (extract reusable patterns)
- hf-l2-use-authoring-skills (authoring quality)
- skill-development (progressive disclosure)
- skill-judge (quality scoring)
- gate-l3-evidence-truth (verification)

## TASK: Complete Rebuild of stack-l3-opencode

### SOURCE DIRECTORY
`.hivefiver-meta-builder/skills-lab/active/refactoring/stack-l3-opencode/`

### TARGET DEPLOY
`.opencode/skills/stack-l3-opencode/` (symlinked from source)

### CONTEXT
This is the ROOT contamination skill. Built from ARCHIVED `sst/opencode` v1.14.28. ALL 10+ curl URLs in scripts/update.sh point to wrong repo. API docs reference stale interfaces. 16 versions behind (1.14.28 → 1.14.44). Downstream validation patterns are now wrong. This skill feeds ALL other OpenCode-related skills.

### METHOD (read EVERY file, validate EVERY claim)

**Phase 1: INGEST current state**
Read ALL files in the skill directory tree:
- SKILL.md, TOC.md, metadata.json, architecture.md
- ALL files in references/api/ (plugin.md, sdk.md, types.md, etc.)
- ALL files in references/ (any others)
- scripts/update.sh
- metrics/rich-gate-scorecard.md
- evals/ if they exist

Build a complete map of: what files exist, what version each references, what sst/opencode URLs exist.

**Phase 2: DEEP RESEARCH — validate against TRUTH source**
Use hm-deep-research to validate EVERY API claim:
- npm registry: @opencode-ai/plugin, @opencode-ai/sdk current versions
- GitHub API: anomalyco/opencode repo structure, branch
- The repomix dump at `.hivefiver-meta-builder/skills-lab/active/refactoring/hm-l3-opencode-platform-reference/references/repomix-opencode.xml` (fresh v1.14.44, read it to grep specific signatures)
- Key API signatures to verify: tool(), hook(), PluginInput, ToolDefinition, WorkspaceAdapter, ProviderHookContext, chat.params.model, AuthOAuthResult, ACP protocol, TUI v2 keymap

**Phase 3: SYNTHESIZE — extract correct patterns**
From the validated research, extract:
- Correct API surface for plugin.md rewrite
- Correct SDK v1 and v2 surface for sdk.md rewrite
- Correct types surface for types.md rewrite
- ACP protocol documentation (NEW file)
- TUI v2 keymap documentation (NEW file)

**Phase 4: REWRITE — complete, not patched**

1. **scripts/update.sh** — COMPLETE REWRITE:
   - Replace ALL 10 curl URLs: sst/opencode → anomalyco/opencode
   - Branch references: main → dev (anomalyco uses dev)
   - Add new files to download: acp/agent.ts, acp/session.ts, acp/types.ts, tui.ts
   - Verify all URLs actually resolve (use deep research to confirm file paths exist)

2. **references/api/plugin.md** — COMPLETE REWRITE with verified signatures:
   - ToolDefinition = ReturnType<typeof tool> (derived type, NOT inline)
   - chat.params.model is REQUIRED: model: Model (not optional)
   - WorkspaceAdapter (correct spelling, not Adaptor)
   - ProviderHookContext as named exported type
   - AuthOAuthResult (replaces deprecated AuthOuathResult)
   - PreToolUse, PostToolUse hook signatures
   - PluginInput structure

3. **references/api/sdk.md** — COMPLETE REWRITE:
   - Document v1 gen/types.gen.ts and v2 gen/types.gen.ts growth
   - Add experimental_workspaceID from V2 client
   - Document gen/sdk.gen.ts surface
   - Note the gen migration path

4. **references/api/types.md** — COMPLETE REWRITE:
   - Add TuiPlugin, TuiKeymap types
   - Add EventCommandExecuted type
   - Update any stale type references

5. **CREATE references/api/acp.md** — Agent Client Protocol:
   - JSON-RPC over stdio (not REST)
   - From packages/opencode/src/acp/ in repomix
   - Agent, Session, Types interfaces

6. **CREATE references/api/tui-v2.md** — TUI v2:
   - api.keymap.registerLayer API
   - Deprecation of api.command
   - From packages/plugin/src/tui.ts in repomix

7. **CREATE references/pipeline-patterns.md** — How stack-l3-opencode composes with other skills in development workflow pipelines

8. **CREATE references/stack-chains.md** — Dependency ordering between stack-* skills

9. **CREATE references/department-bundles.md** — Role-based skill loading bundles

10. **SKILL.md** — Update:
    - Source: anomalyco/opencode v1.14.44
    - Add trigger phrases specific to OpenCode v1.14.44
    - Update reference file list to include all new files
    - Update version references

11. **TOC.md** — Add all new files

12. **metadata.json, architecture.md** — Update versions

### VERIFICATION (run gate-l3-evidence-truth)
- grep "sst/opencode" across ALL files → ZERO
- grep "anomalyco/opencode" → present where expected
- grep "1.14.28" → ZERO (except historical notes)
- grep "1.14.44" → present where expected
- All 10 curl URLs in update.sh point to anomalyco
- All new files created and populated with real content (not placeholders)

### RETURN
1. File-by-file status: REWRITTEN / CREATED / UPDATED
2. Research evidence: npm versions, GitHub API response, key signatures verified
3. Verification: grep results for contamination checks
4. Quality scores (1-10) per skill-judge dimensions
5. Write checkpoint: `.scratch/stack-opencode-rebuild-2026-05-10.md`

### CONSTRAINTS
- DO NOT grep-and-replace. Read every file. Synthesize fresh content.
- DO NOT skip any file. Every file gets read and validated.
- ALL API claims must be backed by repomix evidence or deep research.
- New files (acp.md, tui-v2.md, pipeline-patterns.md, stack-chains.md, department-bundles.md) must contain real, substantive content — not stubs.

---

## Assistant (Hf-L2-Skill-Builder · DeepSeek V4 Pro · 19.1s)

_Thinking:_

I am hf-l2-skill-builder, L2 skill authoring specialist. I create, audit, and repair SKILL.md packages with trigger phrase compliance. I am a SUBAGENT delegated by hf-l0-orchestrator for a COMPLETE REBUILD of stack-l3-opencode.

Let me start by loading the required skills as specified in the task, then systematically work through all phases.

Let me first understand the task structure:
1. **Phase 1**: INGEST - read ALL files in the source directory
2. **Phase 2**: DEEP RESEARCH - validate against truth sources
3. **Phase 3**: SYNTHESIZE - extract correct patterns
4. **Phase 4**: REWRITE - complete rewrite of all files
5. **VERIFICATION**: gate-l3-evidence-truth

Let me begin by loading the required skills and then reading all files in the source directory.

I am **hf-l2-skill-builder**, L2 skill authoring specialist. I create, audit, and repair SKILL.md packages. **I am a SUBAGENT** delegated by hf-l0-orchestrator to perform a COMPLETE REBUILD of `stack-l3-opencode`. I must fulfill my work within constraints — returning verification evidence in the handoff report.

Let me start by loading the required skills and ingesting the current state.

**Tool: skill**

**Input:**
```json
{
  "name": "hm-l3-deep-research"
}
```

**Output:**
```
<skill_content name="hm-l3-deep-research">
# Skill: hm-l3-deep-research

## Overview

Conduct version-matched deep research with MCP tools and citation tracking. Use when investigating libraries, verifying API signatures, gathering multi-source evidence, or producing comprehensive research reports. Returns structured findings with citations and evidence persistence.

## Quick Jump

| Research Need | Start Here |
|---------------|------------|
| "This case vs. that case" | [Case Comparison](references/case-comparison.md) |
| "Something went wrong" | [Edge Cases](references/edge-cases.md) |
| "When do I stop researching?" | [Requirements vs. Spec](references/requirements-vs-spec.md) |
| "Where do I draw the line?" | [Interface Tradeoffs](references/interface-tradeoffs.md) |
| "Turn findings into features" | [Brainstorming & Shaping](references/brainstorming-shaping.md) |
| "What kind of research am I doing?" | [Research Patterns](references/research-patterns.md) |
| "This is high-stakes or exhaustive" | [Sequential Research Gates](workflows/sequential-research-gates.md) |
| "Which sources should I trust?" | [Source Evaluation Template](templates/source-evaluation.md) |
| "Sources disagree" | [Contradiction Matrix](templates/contradiction-matrix.md) |

<execution_context>
For reading modes during investigation: load skill "hm-detective"
Reading modes: SKIM for orientation, SCAN for targeted extraction, DEEP for interface analysis

For cached tech stack assets (offline API signatures, repo references): load skill "hm-tech-stack-ingest"
Cross-architecture research routing: When hm-tech-stack-ingest has cached a library, use the cached
API signatures instead of Context7 or web searches. This validates against REAL code, not assumptions.

For artifact export and compression: load skill "hm-synthesis"
Export tier: Standard (findings + decisions) for most research
Compression: Snapshot for full analysis, Focused for targeted investigation

For chain orchestration: load skill "hm-research-chain"
hm-deep-research is Stage 2 of the canonical research chain.
</execution_context>

## Cross-Architecture Research Routing

When `hm-tech-stack-ingest` has cached a library's full source, API signatures, or documentation, route research requests through cached assets BEFORE external MCP tools.

### Routing Decision Tree

```
Is the target library cached in references/tech-stacks/<name>/?
├── YES → Use cached assets first
│   ├── Need API signature? → grep references/tech-stacks/<name>/api/
│   ├── Need full source? → read references/tech-stacks/<name>/raw/
│   ├── Need usage examples? → read references/tech-stacks/<name>/examples/
│   └── Cached version differs from installed? → Flag discrepancy, use installed version
└── NO → Use MCP tools (Context7, DeepWiki, Repomix, Tavily)
    └── After research, consider ingesting via hm-tech-stack-ingest for future use
```

### Validation Priority

When both cached assets and web documentation are available:

| Source | Priority | When to Trust |
|--------|----------|---------------|
| **Cached source code** (repomix raw/) | HIGHEST | For API signatures, type definitions, and implementation details |
| **Cached API docs** (context7 api/) | HIGH | For official API behavior and examples |
| **Cached structured docs** (deepwiki docs/) | MEDIUM | For architecture overview and module relationships |
| **Web search** (Tavily, Brave) | LOW | Only for current information, news, or community patterns |
| **Live Context7** | FALLBACK | When nothing is cached |

**Rule:** If cached source code exists for the exact version in use, validate every claimed API signature against the cached source. Do not trust web documentation without verification against cached code.

---

## The Six Concepts

Every research task touches at least two of these. Complex tasks touch all six.

### 1. Case Comparison — "This Case vs. That Case"

Research is comparative by nature. You are always deciding between approaches, tools, patterns, or solutions. The case comparison framework gives you a structure for side-by-side analysis.

**When to use it**: Every time you evaluate two or more options.

| Dimension | Case A | Case B |
|-----------|--------|--------|
| Approach | [what A does] | [what B does] |
| Depth needed | [shallow/medium/deep] | [shallow/medium/deep] |
| Risk of wrong answer | [low/medium/high] | [low/medium/high] |
| Time to validate | [hours/days] | [hours/days] |
| Reversibility | [easy/hard] | [easy/hard] |

**Example**: "Should we use Prisma or Drizzle for our ORM?"

| | Prisma | Drizzle |
|---|--------|---------|
| Approach | Schema-first, generated client | SQL-like, type-inferred |
| Depth needed | Medium (docs are thorough) | Deep (patterns are emergent) |
| Risk of wrong answer | Medium (lock-in) | Low (closer to SQL) |
| Time to validate | 2 days (migration tooling) | 1 day (simpler setup) |
| Reversibility | Hard (schema migration) | Easy (raw SQL fallback) |

Load [references/case-comparison.md](references/case-comparison.md) for 5 complete case pairs with decision frameworks.

---

### 2. Edge Cases — When Research Goes Wrong

Research fails in predictable ways. The top 6 failure modes:

| Failure | Signal | First Response |
|---------|--------|----------------|
| Contradictory sources | Two authoritative sources disagree | Check dates. Newer wins, but verify changelogs. |
| Outdated information | Last update > 12 months, API version mismatch | Search with freshness filter. Check GitHub releases. |
| Too new for patterns | < 6 months old, < 100 GitHub stars | Read source code directly. Build a prototype. |
| Vendor docs are wrong | Code doesn't match documented behavior | Create a minimal repro. File an issue. Use the code, not the docs. |
| No clear winner | 3+ valid approaches, zero differentiation | Define your constraints first. Pick the simplest that fits. |
| Scope creep | Research question keeps expanding | Write a one-sentence scope. Anything outside = separate investigation. |

Load [references/edge-cases.md](references/edge-cases.md) for each failure's full resolution workflow.

---

### 3. Requirements vs. Spec — When to Stop Researching

Research has a natural endpoint. Cross it and you are writing a specification, not doing research. The boundary looks like this:

| Phase | Mindset | Output | Duration |
|-------|---------|--------|----------|
| **Research** | "What's possible?" | Findings, options, tradeoffs | Open-ended |
| **Requirements** | "What do we need?" | Measurable needs, constraints, priorities | Convergent |
| **Specification** | "How do we build it?" | Interfaces, data models, test cases | Precise |

**Signals you've crossed the boundary**:

- You start defining function signatures → you are in spec territory
- You list acceptance criteria → you are in requirements territory
- You say "we should" instead of "they offer" → you left research territory

**How to handle premature specification**: Stop. Write down what triggered it. Ask: "Do I have enough evidence for this decision?" If no, go back to research. If yes, acknowledge the transition and switch to requirements framing.

Load [references/requirements-vs-spec.md](references/requirements-vs-spec.md) for the full transition template.

---

### 4. Interface Tradeoffs — Where to Draw Lines

During research, you investigate interfaces — APIs, type boundaries, module contracts. The question is always: how deep do I go?

**Decision framework**:

```
1. SCOPE: What surface area does this research cover?
   - Single function → SCAN mode, 15 min max
   - Module boundary → DEEP mode on public exports only
   - Cross-module → DEEP mode on interfaces, SKIM on implementations

2. DEPTH: How much do I need to understand?
   - "What does it do?" → SKIM + examples
   - "How does it work?" → SCAN + error paths
   - "Can I change it?" → DEEP + dependents + tests

3. CONFIDENCE: How sure do I need to be?
   - High confidence (production decision) → 3+ sources, working prototype
   - Medium confidence (architecture planning) → 2 sources, interface extraction
   - Low confidence (exploration) → 1 source, document as hypothesis

4. STOP CONDITION: When do I stop investigating this interface?
   - When confidence matches the decision's reversibility
   - Easy to reverse → low confidence is fine → stop early
   - Hard to reverse → high confidence needed → keep digging
```

Load [references/interface-tradeoffs.md](references/interface-tradeoffs.md) for worked examples from real codebases.

---

### 5. Brainstorming & Shaping — From Findings to Features

Research produces findings. Findings become features through this pipeline:

```
RESEARCH → SYNTHESIZE → BRAINSTORM → SHAPE → VALIDATE
  findings    patterns     ideas      proposals    evidence
```

**The critical rule**: Brainstorm from evidence, not imagination. Every feature idea must trace back to at least one research finding.

**Shaping a feature proposal**:

| Element | Question | Source |
|---------|----------|--------|
| Problem | What user pain exists? | Research finding |
| Approach | What solution does the evidence support? | Best-evaluated option |
| Scope | What's the minimum viable version? | Constraint analysis |
| Risks | What could go wrong? | Edge case findings |
| Validation | How do we know it worked? | Measurable criteria |

**Anti-patterns to avoid**:

- Feature creep: adding capabilities beyond what research supports
- Analysis paralysis: requiring 100% confidence before proposing anything
- Premature optimization: designing for scale the research doesn't justify
- Solution shopping: researching until you find confirmation of a pre-chosen answer

Load [references/brainstorming-shaping.md](references/brainstorming-shaping.md) for the full brainstorming-to-proposal workflow.

---

### 6. Research Patterns — Five Archetypes

Every research task falls into one of five archetypes. Identify yours, then follow the matching workflow.

| Archetype | Question | Depth | Breadth |
|-----------|----------|-------|---------|
| **Technology Scan** | "What's out there?" | Shallow | Broad |
| **Market Analysis** | "What's the landscape?" | Medium | Broad |
| **Codebase Archaeology** | "What's in here?" | Deep | Narrow |
| **API Investigation** | "How does this work?" | Deep | Narrow |
| **Competitive Audit** | "How do others do it?" | Medium | Medium |

### Quick Pattern Selection

```
What are you researching?
|
+-- A technology, library, or tool
|   +-- "What options exist?" → Technology Scan
|   +-- "How does this specific one work?" → API Investigation
|
+-- A market, product area, or business question
|   +-- "What's the competitive landscape?" → Market Analysis
|   +-- "How do competitors solve this?" → Competitive Audit
|
+-- An existing codebase or system
|   +-- "What does this code do?" → Codebase Archaeology
|   +-- "How does this API work?" → API Investigation
|
+-- Not sure yet
    → Start with Technology Scan (broadest, cheapest)
      Then narrow to the specific archetype that matches
```

Load [references/research-patterns.md](references/research-patterns.md) for complete workflows per archetype (5-7 steps, tools, output format, validation gate).

---

## Research Workflow (All Patterns)

Regardless of archetype, every research task follows this skeleton:

### High-Stakes Sequential Gate

For deep, exhaustive, compliance, architecture, or public-facing research, run the gated sequence before the normal loop. This adapts the strict phase-gate pattern from third-party deep-research packages while keeping the workflow harness-neutral.

1. **Frame gate:** write the research question, scope boundary, decision owner, and stop condition.
2. **Source gate:** collect at least three relevant sources or document why fewer exist; classify each source with `templates/source-evaluation.md`.
3. **Deep-read gate:** extract claims into a durable note before synthesizing; do not summarize from snippets alone.
4. **Contradiction gate:** fill `templates/contradiction-matrix.md` for any competing claims, version differences, or source conflicts.
5. **Artifact gate:** produce a final artifact with source links, unresolved gaps, and continuation IDs if work may resume later.

**Stop rule:** If a gate output is missing, stop and document `BLOCKED`, not `PASS`.

### Step 1: Frame the Question

Write one sentence. If you cannot, the question is too broad.

```
Good: "What ORM options exist for TypeScript serverless projects in 2026?"
Bad: "What's the best database setup?"
```

### Step 2: Identify the Archetype

Use the pattern selection tree above. Load the matching workflow from [references/research-patterns.md](references/research-patterns.md).

### Step 3: Set the Context Budget

Estimate tokens available. Divide by 4 for character budget. Never spend > 70% on fetching — reserve 30% for synthesis.

### Step 4: Execute the Research Loop

```
LOOP:
  1. Pick next hypothesis or question
  2. Select tool (see Tool Quick Reference below)
  3. Execute search/extraction
  4. Write finding immediately — never batch
  5. Check: answered? If no, refine query (max 3 attempts)
  6. Check: contradicts prior finding? If yes, flag for resolution
  7. Next hypothesis
UNTIL all questions addressed OR budget exhausted
```

### Step 5: Synthesize

Merge findings into a coherent answer. Structure depends on archetype:

| Archetype | Synthesis Output |
|-----------|-----------------|
| Technology Scan | Comparison table + recommendation |
| Market Analysis | Landscape map + positioning |
| Codebase Archaeology | Architecture diagram + dependency map |
| API Investigation | Interface contract + usage patterns |
| Competitive Audit | Feature matrix + gap analysis |

### Step 6: Validate

Every claim needs a source. Key claims need direct evidence (source code, official docs) or 2+ corroborating sources.

### Step 7: Persist Provenance

Before handing off, create or update a research artifact with:

- source list with evaluated authority and freshness
- contradiction matrix entries and resolution status
- continuation key (`research_id`, upstream issue, PR, URL, or interaction ID)
- unresolved gaps that must not be hidden behind confident language

Use [workflows/sequential-research-gates.md](workflows/sequential-research-gates.md) when the artifact will feed implementation, planning, or verification.

```
Evidence levels:
  DIRECT       → Code/docs prove it
  CORROBORATED → 2+ independent sources agree
  TESTIMONIAL  → One source says so (mark "unverified")
  ABSENCE      → No evidence found (not the same as disproved)
```

### Step 7: Deliver

Produce the artifact. Minimum structure:

1. **Executive summary** — 3-5 sentences, the answer
2. **Key findings** — numbered, each with evidence level and source
3. **Tradeoffs** — what you gave up, what you gained
4. **Gaps** — what you couldn't answer, and why
5. **Source index** — every URL, file path, or tool output consulted

---

## Tool Quick Reference

| Task | Primary Tool | Fallback |
|------|-------------|----------|
| Broad discovery | tavily-search (basic) | brave-search |
| Targeted extraction | tavily-extract | fetcher |
| Library documentation | Context7 (resolve → query) | DeepWiki |
| Repo understanding | DeepWiki | repomix pack |
| Code search | exa web search | grep |
| Recent news/releases | brave-news | tavily-search (time_range) |
| Site documentation | tavily-crawl | manual extract loop |
| Complex multi-source | tavily-research (pro) | multi-search + manual synthesize |

### Budget Rules

- Context7: resolve-library-id ONCE, then max 3 query-docs calls per library
- Tavily: start with basic depth. Escalate to advanced only when basic is insufficient
- Repomix: always use compress=true (70% reduction). Always set includePatterns
- Context > 70% consumed: stop fetching, synthesize what you have, document gaps

---

## Version-Matched Documentation Research

When researching libraries or frameworks where version matters (APIs, breaking changes, deprecation), use version-specific Context7 queries rather than generic ones. Generic queries return latest-version documentation that may not match the codebase's pinned version.

### When to Use

- Researching a library where the user's version is >1 major behind latest
- Investigating breaking changes between versions
- Searching for migration guides or deprecation notices
- The codebase's `package.json`, `Cargo.toml`, or `go.mod` specifies exact versions

### Protocol

```
Step 1: Read .tech-registry.json (via hm-detective SCAN or hm-synthesis detection)
  - Extract resolved versions from stack.framework, stack.runtime, stack.test_framework
  - Also check lockfiles for transitive dependency versions

Step 2: Resolve versioned library in Context7
  - Use resolve-library-id with versioned name: "Next.js 14" not just "Next.js"
  - If resolve-library-id fails with version suffix, try without version, then filter results

Step 3: Query with version-specific questions
  - "Next.js 14 app router API for middleware"
  - "React 18 useEffect cleanup behavior changes"
  - "TypeScript 5.2 satisfies keyword usage"

Step 4: Detect breaking changes
  - Compare user's version vs. latest documented version
  - Flag when >2 major versions behind
  - Search for migration guides: "migrate from X to Y [library]"
```

### Breaking Change Detection

| Gap | Action | Context7 Query Pattern |
|-----|--------|------------------------|
| 1 major version behind | Note in findings, no action | — |
| 2 major versions behind | Flag as tech debt, estimate effort | "[library] [old] to [new] migration guide" |
| 3+ major versions behind | Require ADR before recommending upgrade | "[library] [old] breaking changes [new]" |
| Deprecated API in use | Immediate replacement recommendation | "[library] [version] [api] deprecated alternative" |

**Rule:** Do NOT recommend upgrading across >2 major versions without a dedicated migration research phase. The risk of silent breaking changes exceeds the benefit of newer features.

---

## Anti-Patterns — Stop When You Detect These

| Anti-Pattern | Detection | Fix |
|-------------|-----------|-----|
| Single-Source Synthesis | Only 1 source for a key claim | Find a second source before asserting |
| Full-Page Fetch | Reading > 50KB when you need 3 lines | Use grep + offset reading |
| Infinite Research Loop | 3rd search returns no new findings | Stop. Synthesize what you have. |
| Premature Specification | Defining function signatures during research | Write the spec idea down, return to research |
| Feature Creep in Research | Question expands beyond original scope | Write scope boundary, defer expansions |
| Solution Shopping | Only researching one option | Require 2+ alternatives before recommending |
| Context Graveyard | 30 min investigation with nothing on disk | Write findings every batch |
| Stale Cite | Source > 6 months old for current tech | Use freshness filters, re-validate |

## References (Progressive Disclosure)

Load references ONLY when the SKILL.md is insufficient for your task.

- **[Case Comparison](references/case-comparison.md)** — Side-by-side research scenarios with decision frameworks
- **[Edge Cases](references/edge-cases.md)** — Real-life edge cases with resolution workflows
- **[Requirements vs. Spec](references/requirements-vs-spec.md)** — Boundary detection and transition templates
- **[Interface Tradeoffs](references/interface-tradeoffs.md)** — Depth decisions with worked examples
- **[Brainstorming & Shaping](references/brainstorming-shaping.md)** — Findings-to-features pipeline
- **[Research Patterns](references/research-patterns.md)** — 5 archetypes with full workflows

## When NOT to Load References

| Condition | Do NOT Load | Reason |
|-----------|-------------|--------|
| Simple lookup (< 3 searches) | All references | SKILL.md has enough |
| Only need tool parameters | All references | Tool Quick Reference above is sufficient |
| Single-option evaluation | case-comparison.md, competitive patterns | No comparison needed |
| Context > 50% consumed | ALL references | Synthesize what you have, document gaps |

## Self-Correction

When research produces unreliable findings or reaches a dead end, use these correction modes before escalating:

### Mode 1: Contradictory Sources (two authoritative sources disagree)

```
1. Check publication dates — newer source wins, but verify its changelog
2. Check version alignment — does the contradiction stem from version differences?
3. Fill templates/contradiction-matrix.md with both claims and evidence
4. If unresolvable: flag as UNRESOLVED, document both positions, recommend investigation
5. If resolvable: document the winning claim with rationale
```

### Mode 2: Source Failure (MCP tool returned empty, error, or irrelevant results)

```
Which tool failed?
├── Context7 → re-resolve library ID without version, then filter results; fall back to deepwiki
├── Tavily → refine query: add "docs", "API", or "reference"; try brave-search as fallback
├── DeepWiki → use repomix_pack_remote_repository instead; search GitHub directly
├── Repomix → try context7 for API surface; use web extraction for docs
├── Exa → try tavily-search with same query; use brave-search
└── All tools failed → document as BLOCKED in findings, proceed with available evidence
```

### Mode 3: Infinite Research Loop (3rd search iteration with no new findings)

```
1. STOP. Do not run another search.
2. Review existing findings: is the question actually answered?
   ├── YES → Synthesize what you have, document remaining gaps
   └── NO → Reframe the question more narrowly, limit to 1 more search cycle
3. If still looping after reframed question → document as NEEDS_CONTEXT
```

### Mode 4: Premature Specification (research bleeding into spec territory)

```
Self-check:
└── Are you defining function signatures? → STOP. Move to requirements framing.
└── Are you saying "we should" instead of "they offer"? → STOP. Return to research.
└── Are you writing acceptance criteria? → STOP. Acknowledge the transition.
```

### Mode 5: Stale or Missing Version Match (researched docs don't match installed version)

```
1. Re-read .tech-registry.json for the exact pinned version
2. If hm-tech-stack-ingest has cached this version → use cached API signatures (highest priority)
3. If not cached → run version-specific Context7 query with the exact version
4. If latest docs don't match → check migration guides, changelogs, breaking change notices
5. If version gap > 2 majors → require ADR before recommending upgrade
```

### Maximum Correction Attempts

3 per research task. After 3 correction cycles without resolution:
- Document findings with evidence levels (DIRECT, CORROBORATED, TESTIMONIAL, ABSENCE)
- Flag unresolved contradictions in the matrix
- Write continuation key for future investigation
- Export artifact with methodology, limitations, and gap documentation

## Cross-References

### Research Chain Position

```
hm-tech-stack-ingest → hm-detective → hm-deep-research → hm-synthesis
         (upstream)    (upstream)     (this skill)     (downstream)
```

hm-deep-research is **Stage 2 (Research)** of the canonical `hm-research-chain` pipeline.

### Upstream Skills (Feeds Into This Skill)

| Related Skill | Boundary |
|---------------|----------|
| `hm-tech-stack-ingest` | Cached API signatures, repo references, and version-matched source code. Use cached assets for signature-level validation before external searches. See [Cross-Architecture Research Routing](#cross-architecture-research-routing). |
| `hm-detective` | Codebase map and `.tech-registry.json`. hm-detective tells hm-deep-research WHAT technology stack is in use so research is version-matched. |

### Downstream Skills (This Skill Feeds Into)

| Related Skill | Boundary |
|---------------|----------|
| `hm-synthesis` | hm-deep-research produces structured findings with citations and evidence levels. hm-synthesis compresses these into actionable artifacts. |

### Related / Sibling Skills

| Related Skill | Boundary |
|---------------|----------|
| `hm-research-chain` | Orchestrator. hm-deep-research is Stage 2 of the chain. hm-research-chain decides when to trigger hm-deep-research after Stage 1 detection. |

### Boundary Clarification

| Nearby Skill | What hm-deep-research Does | What the Other Skill Does |
|-------------|--------------------------|--------------------------|
| `hm-tech-stack-ingest` | Uses cached API signatures for research validation; researches what isn't cached using MCP tools | Downloads and caches libraries; does NOT perform research or compare approaches |
| `hm-detective` | Researches external libraries, APIs, and web sources using version-matched queries | Investigates local codebase structure with SCAN/READ/DEEP modes |
| `hm-synthesis` | Produces structured research findings with citations, evidence levels, and source evaluation | Compresses and restructures those findings into plans, ADRs, and exportable artifacts |
| `hm-research-chain` | Executes Stage 2 evidence gathering when triggered by the chain | Orchestrates the full pipeline, routes between stages, and handles continuation metadata |

Base directory for this skill: file:///Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-deep-research
Relative paths in this skill (e.g., scripts/, reference/) are relative to this base directory.
Note: file list is sampled.

<skill_files>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-deep-research/templates/contradiction-matrix.md</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-deep-research/templates/.gitkeep</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-deep-research/templates/source-evaluation.md</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-deep-research/metrics/rich-gate-scorecard.md</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-deep-research/metrics/.gitkeep</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-deep-research/scripts/.gitkeep</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-deep-research/scripts/validate-rich-package.sh</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-deep-research/workflows/sequential-research-gates.md</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-deep-research/workflows/.gitkeep</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-deep-research/evals/evals.json</file>
</skill_files>
</skill_content>
```

**Tool: skill**

**Input:**
```json
{
  "name": "hm-l3-detective"
}
```

**Output:**
```
<skill_content name="hm-l3-detective">
# Skill: hm-l3-detective

## Overview

Investigate codebases using three reading modes: SCAN for targeted extraction, READ for standard review, and DEEP for interface analysis. Use when navigating large codebases, finding definitions, recovering session context, or estimating token budgets. Produces structured codebase findings with surgical edit guidance.

## Quick Jump

| Investigation Need | Section | Jump |
|--------------------|---------|------|
| "How do I read this?" | Reading Modes | [Three Reading Modes](#three-reading-modes) |
| "How much context will this cost?" | Token Budget | [references/token-budget.md](references/token-budget.md) |
| "I lost context — recover" | Swarm Recovery | [references/swarm-recovery.md](references/swarm-recovery.md) |
| "What tech stack is this?" | Tech Registry | [references/tech-registry.md](references/tech-registry.md) |
| "How do I edit safely?" | Surgical Edits | [references/surgical-edits.md](references/surgical-edits.md) |
| "Where do notes go?" | Document Pipeline | [references/document-pipeline.md](references/document-pipeline.md) |
| "Is this design assumption true?" | Assumption Verification | [templates/assumption-verification.md](templates/assumption-verification.md) |

## Three Reading Modes

Every file read costs tokens. Choose the cheapest mode that answers your question.

| Mode | Token Cost | When | Tools |
|------|-----------|------|-------|
| **SKIM** | ~5% | Orientation: "what is this?" | glob, ls, frontmatter-only, grep -c |
| **SCAN** | ~15% | Targeted: "find X" | grep -n, offset reads ±20 lines, TOC navigation |
| **SCAN (Tech Stack)** | ~10% | Stack detection: "what's this built with?" | grep indicator files, read 5-10 config files |
| **DEEP** | 100% | Understanding: "need every line" | Read full file, repomix pack + grep |

**Escalation rule**: START → SKIM → (if insufficient) SCAN or SCAN (Tech Stack) → (if still need context) DEEP. Never skip to DEEP.

### Assumption Verification Mode

Use this mode when asked to validate a design assumption, locate an existing pattern, prove whether behavior exists, or recover truth from a large codebase.

1. Write the assumption as a falsifiable claim.
2. Search for at least two independent evidence paths: definitions, call sites, tests, docs, config, runtime state, or git history.
3. Classify the result using `templates/assumption-verification.md`: confirmed, discrepancy, addition, missing, or blocked.
4. If nothing is found, report the search paths and exact queries; do not silently treat absence as proof.
5. End with an answer-first finding and file:line evidence.

**Not-found rule:** A definitive "not found" requires at least two search strategies and a documented scope boundary.

### Mode Selection Decision Tree

```
What do you need?
|
+-- "What files exist?" or "What is this project?"
|   -> SKIM: glob patterns, ls directory, grep -c for match counts
|
+-- "Where is function X defined?" or "What imports Y?"
|   -> SCAN: grep -n "pattern" file → get line numbers → offset read ±20
|
+-- "What tech stack is this?" or "What framework is this built with?"
|   -> SCAN (Tech Stack): grep for package.json/go.mod/Cargo.toml → read 5-10 config files
|
+-- "How does this algorithm work?" or "I need to understand every branch"
|   -> DEEP: Read full file (only after SKIM + SCAN confirm it's the right file)
```

### Case Study: Finding a Bug in a 600-Line File

**Wrong**: Read the entire 600-line file. Cost: ~600 lines of context.

**Right**:
1. SKIM: `grep -c "error" file.ts` → 12 matches. File is relevant.
2. SCAN: `grep -n "error" file.ts` → lines 45, 120, 234, 310, 445, 501, 520, 533, 540, 555, 567, 580
3. SCAN: Read offset=40 limit=30 (lines 40-70), offset=115 limit=30 (lines 115-145), etc.
4. DEEP: Only if the bug spans multiple sections you've already identified.

**Cost**: ~200 lines vs 600 lines. 67% savings.

## Token-Efficient Retrieval Patterns

These patterns apply across all reading modes. Master them before any investigation.

| Pattern | How | Savings |
|---------|-----|---------|
| **Offset Hop-Reading** | Read offset=N limit=30 instead of reading N lines to get to line N | 90%+ vs full read |
| **Grep-Before-Read** | grep -n → get line numbers → offset read only those sections | 80%+ vs blind read |
| **Frontmatter-Only** | For planning docs, read only between --- markers | 95%+ vs full doc |
| **TOC-First** | grep ## headings first, then targeted reads | 70%+ vs full read |
| **Repomix Compress** | Always use compress: true (70% token reduction) | 70% vs uncompressed |

### Worked Example: Finding Where a Function Is Called

**Goal**: Find all callers of `processTask` in a 47-file codebase.

```
Step 1 (SKIM): grep -rn "processTask" src/ --include="*.ts" | wc -l → 23 matches
Step 2 (SKIM): grep -rn "processTask" src/ --include="*.ts" | cut -d: -f1 | sort -u → 8 files
Step 3 (SCAN): For each of 8 files, grep -n "processTask" → get line numbers
Step 4 (SCAN): Read ±20 lines around each call site (8 files × ~2 calls × 40 lines = 640 lines)
Step 5 (DEEP): Only if a call site's context is unclear after SCAN
```

**Cost**: ~700 lines total vs reading all 47 files (~14,000 lines). **95% savings**.

---

## Hierarchical Tech Registry

The `.tech-registry.json` file is your persistent memory across sessions. Read it FIRST before any investigation.

### What It Contains

- **Stack**: Language, runtime, framework, test tool, build tool
- **Modules**: Every source file with its role (leaf/core/entry), LOC, and dependencies
- **Concerns**: Active issues and resolved problems

### Read-First Protocol

```
1. Read .tech-registry.json
2. If exists → use stack for conventions, modules for dependency graph
3. If missing → run discovery (see references/tech-registry.md)
4. If stale → spot-check 3 files, update if mismatched
```

### Update Protocol

Agents APPEND findings — never overwrite. After discovering new information:
1. Read the full registry
2. Modify the specific field that changed
3. Update `last_updated` to today's date
4. Write the complete file back

See [references/tech-registry.md](references/tech-registry.md) for full schema and procedures.

---

## Swarm-Based Context Recovery

When context is lost (compaction, interruption, session reset), dispatch 5 parallel agents. Each returns max 100 lines.

| Agent | Task | Output |
|-------|------|--------|
| **TOC Agent** | Read heading structures → section map with line ranges | File → Section → Line Range → Purpose |
| **Metadata Agent** | Read all frontmatter → status, key_files, commits | File → name → status → key_files |
| **Git Agent** | git log --oneline -20, git diff --stat HEAD~5 | Timeline + changed files |
| **Diff Agent** | Read diffs for changed files only → what changed | File → Lines +/- → Summary |
| **Registry Agent** | Read .tech-registry.json → known tech stack | Full registry or inferred stack |

### Merge Procedure

1. Collect all 5 agent outputs
2. Create `.scratch/recovery-brief-YYYY-MM-DD.md`
3. Structure: Project State → Recent Changes → Document Map → What Was In Progress → Gaps → Next Actions
4. Validate: all 5 agents returned, brief < 500 lines, gaps documented
5. Update tech registry with any new discoveries

See [references/swarm-recovery.md](references/swarm-recovery.md) for full prompt envelopes and merge procedures.

---

## LSP-Aware Surgical Edit Protocol

Every edit follows this 5-step sequence. No shortcuts.

1. **Locate**: `grep -n "target" file` → exact line numbers
2. **Read Context**: Read offset=(line-20) limit=40 → context ±20
3. **Edit**: Use PRECISE oldString (exact whitespace, indentation, newlines)
4. **Verify Size**: NEVER edit >50 lines in one operation
5. **Verify Result**: `grep` the result to confirm it landed correctly

### LSP Safety Rules

- Changing exported function signatures? Update all callers first, or use overloads
- Adding new symbols? Use unique names to avoid collisions
- Renaming variables? Sequential edits, one per usage, verify each

See [references/surgical-edits.md](references/surgical-edits.md) for before/after examples and anti-patterns.

---

## Document Promotion Pipeline

Investigation artifacts flow through four stages with increasing quality requirements:

```
.scratch/              → Raw notes (ephemeral, session-scoped)
  ↓ promote (sources cited, no TODOs)
.research/             → Findings with sources (reusable across sessions)
  ↓ promote (decision stated, alternatives considered)
.planning/decisions/   → ADRs (Architecture Decision Records, project-level)
  ↓ promote (success criteria, specific files, verification commands)
.planning/phases/      → Execution plans (Source of Truth for implementation)
```

### Promotion Gates

| Gate | Requirement |
|------|-------------|
| Scratch → Research | Every finding has a source, no TODOs, organized by topic |
| Research → Decision | Decision in one sentence, 2+ alternatives considered, consequences listed |
| Decision → Plan | References ADRs, checkable success criteria, specific files, verification commands |

See [references/document-pipeline.md](references/document-pipeline.md) for naming conventions and content structures.

## Anti-Patterns — STOP When You Detect These

| Anti-Pattern | Detection | Fix |
|-------------|-----------|-----|
| Full File Fever | Reading >200 lines when you need 3 | grep → offset read |
| Context Avalanche | Loading 5+ files "for context" | Skim first, deep-read only targets |
| Registry Amnesia | Re-discovering tech stack each session | Read .tech-registry.json FIRST |
| Edit Blast Zone | Editing >50 lines in one operation | Surgical edits: grep → offset ±20 → precise oldString |
| Solo Recovery | One agent reading massive session export | 5-agent swarm |

## References (Progressive Disclosure)

Load references ONLY when the SKILL.md procedures are insufficient for your task.

- **[Reading Modes](references/reading-modes.md)** — Detailed procedures with worked examples for SKIM, SCAN, DEEP
- **[Token Budget](references/token-budget.md)** — Cost tables, estimation formulas, escalation rules
- **[Swarm Recovery](references/swarm-recovery.md)** — 5-agent protocol, prompt envelopes, merge procedures
- **[Tech Registry](references/tech-registry.md)** — Schema, update procedures, cross-session persistence
- **[Surgical Edits](references/surgical-edits.md)** — LSP-aware edit protocol with before/after examples
- **[Document Pipeline](references/document-pipeline.md)** — Promotion rules, validation gates, naming conventions

## When NOT to Load References

| Condition | Do NOT Load | Reason |
|-----------|-------------|--------|
| Simple file lookup (< 3 files) | All references | SKILL.md has enough for basic navigation |
| Only need token estimates | reading-modes.md, swarm-recovery.md | Load only token-budget.md |
| Already know the tech stack | tech-registry.md | Read .tech-registry.json directly |
| Context > 50% consumed | ALL references | Use cheapest mode available, document gaps |

## Self-Correction

When investigation produces unexpected results or gets stuck, use these correction modes before escalating:

### Mode 1: Mode Escalation Failure (SKIM too shallow, moved to DEEP too early)

```
Did SKIM return enough context?
├── NO → Run SCAN instead: grep -n target line → offset read ±20
├── YES but SCAN missed → Run SCAN with broader pattern: grep -rn "related_term" --include="*.ts"
└── SKIM + SCAN both insufficient → Run DEEP on the specific file (only after confirmed relevance)
```

### Mode 2: Assumption Verification Loop (not-found or ambiguous)

```
What did the first search strategy return?
├── 0 results → try a second strategy: switch from grep to glob, or from file content to git history
├── 1 result → try a third strategy: check call sites, imports, tests, or config files
├── ≥2 results, contradictory → re-verify file paths and versions; check for duplicate definitions
└── Still not found after 2+ strategies → document search paths, exact queries, scope boundary
```

### Mode 3: Swarm Recovery Partial (some agents returned empty)

```
Which agent returned empty?
├── TOC Agent → re-run with broader heading patterns (include ##, ###, ####)
├── Metadata Agent → check for frontmatter-less files; read first 30 lines of each
├── Git Agent → expand log range (--oneline -50), check reflog
├── Diff Agent → expand diff range (HEAD~10), check staged changes
├── Registry Agent → run full discovery (SCAN Tech Stack mode)
└── 2+ agents empty → context may be too damaged; document what IS available
```

### Mode 4: Token Budget Exceeded (investigation consuming too much context)

```
1. Pause the current investigation
2. Write all findings to .scratch/ immediately
3. Re-estimate budget using references/token-budget.md
4. Switch to the cheapest reading mode that still answers the question
5. If budget still insufficient → document gaps, promote to .research/ for next session
```

### Maximum Correction Attempts

3 per investigation task. After 3 correction cycles without resolution:
- Document what was tried and what remains blocked
- Write findings to `.scratch/recovery-brief-YYYY-MM-DD.md`
- Promote to `.research/` with gap documentation

## Cross-References

### Research Chain Position

```
hm-tech-stack-ingest → hm-detective → hm-deep-research → hm-synthesis
         (upstream)       (this skill)    (downstream)    (downstream)
```

hm-detective is **Stage 1 (Detect)** of the canonical `hm-research-chain` pipeline.

### Upstream Skills (Feeds Into This Skill)

| Related Skill | Boundary |
|---------------|----------|
| `hm-tech-stack-ingest` | Cached codebases and API signatures for tech registry population. Read `.tech-registry.json` from ingested assets before scanning. |

### Downstream Skills (This Skill Feeds Into)

| Related Skill | Boundary |
|---------------|----------|
| `hm-deep-research` | Evidence gathering. hm-detective produces the tech registry and codebase map that hm-deep-research uses for scope-aware searches. |
| `hm-synthesis` | Compression and artifact export. hm-detective's findings (tech registry, file maps, dependency graphs) become inputs for hm-synthesis pattern classification. |

### Related / Sibling Skills

| Related Skill | Boundary |
|---------------|----------|
| `hm-research-chain` | Orchestrator. hm-detective is Stage 1 of the chain. hm-research-chain decides when to trigger hm-detective and how to route its output. |

### Boundary Clarification

| Nearby Skill | What hm-detective Does | What the Other Skill Does |
|-------------|----------------------|--------------------------|
| `hm-tech-stack-ingest` | Reads the `.tech-registry.json` and scans the codebase with SCAN/DEEP modes | Downloads and caches third-party repos as persistent bundled assets |
| `hm-deep-research` | Investigates the local codebase structure, tech stack, and module dependencies | Investigates external libraries, API signatures, and web sources with version-matched queries |
| `hm-synthesis` | Produces structured codebase findings (tech registry, file maps, dependency graphs) | Compresses findings into actionable artifacts with tiered reduction |
| `hm-research-chain` | Executes Stage 1 detection when triggered by the chain | Orchestrates the full detect → research → synthesize pipeline |
| Single-file edit | surgical-edits.md | Follow the 5-step protocol from SKILL.md |

Base directory for this skill: file:///Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-detective
Relative paths in this skill (e.g., scripts/, reference/) are relative to this base directory.
Note: file list is sampled.

<skill_files>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-detective/templates/assumption-verification.md</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-detective/templates/.gitkeep</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-detective/scripts/.gitkeep</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-detective/scripts/validate-rich-package.sh</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-detective/references/document-pipeline.md</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-detective/references/surgical-edits.md</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-detective/references/token-budget.md</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-detective/references/tech-registry.md</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-detective/references/reading-modes.md</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l3-detective/references/swarm-recovery.md</file>
</skill_files>
</skill_content>
```

**Tool: skill**

**Input:**
```json
{
  "name": "hf-l2-use-authoring-skills"
}
```

**Output:**
```
<skill_content name="hf-l2-use-authoring-skills">
# Skill: hf-l2-use-authoring-skills

## The Iron Law

```
NO SKILL WITHOUT TRIGGER PHRASES IN THE DESCRIPTION
```

<files_to_read>
.opencode/skills/use-authoring-skills/references/01-skill-anatomy.md
.opencode/skills/use-authoring-skills/references/02-frontmatter-standard.md
.opencode/skills/use-authoring-skills/references/03-three-patterns.md
.opencode/skills/use-authoring-skills/references/05-skill-quality-matrix.md
.opencode/skills/use-authoring-skills/scripts/validate-gate.sh
.opencode/skills/use-authoring-skills/scripts/validate-skill.sh
.opencode/skills/use-authoring-skills/scripts/check-overlaps.sh
.opencode/get-shit-done/references/thinking-models-execution.md
</files_to_read>

The description is the ONLY thing the agent sees before deciding to load a skill. If it doesn't contain specific phrases a user would say, the skill is invisible. Dead on arrival.

**Not "the description should be good."** The description IS the skill. Without it, nothing else matters.

### What agents actually rationalize

| What agents say | Reality |
|-----------------|---------|
| "The description is clear enough" | It says "provides guidance for skill development." Agent will never load it. |
| "I'll add trigger phrases later" | Later never comes. The skill sits dead until someone audits it. |
| "The references are too long, I'll summarize" | References ARE the value. SKILL.md points to them. Summarizing = losing knowledge. |
| "This skill needs another skill to work" | Standalone contract. Push to load, don't require. If it can't work alone, it's not a skill — it's a chapter. |
| "The script stub exits 0 so validation passes" | A stub that always passes is a lie. Remove it or make it real. |
| "I'll keep the dead reference, it might be useful later" | Dead references are debt. The agent will try to load them, fail, and move on. |

## HIERARCHY ENFORCEMENT — Run This FIRST

This skill is LAYER 4 in the loading chain (domain execution). Before any action:

1. **Verify hierarchy chain:**
   ```bash
   bash scripts/verify-hierarchy.sh use-authoring-skills
   ```
   This checks that meta-builder exists and routed to this skill.

2. **Register this skill as loaded:**
   ```bash
   bash scripts/register-skill.sh use-authoring-skills
   ```

3. **Prerequisites:**
   - `meta-builder` must exist (routing source)
   - Background skills should already be loaded by upstream skills

**If hierarchy check fails → STOP. This skill should only be loaded after meta-builder routing.**

# Use Authoring Skills

## MANDATORY FIRST STEP — Run This Before Anything Else

**Every time this skill loads, run the preflight validator immediately:**

```bash
bash scripts/validate-gate.sh <create|edit|audit> "<user-request>" <skill-dir>
```

- `<create>` — building a new skill from scratch or from a document
- `<edit>` — modifying an existing skill
- `<audit>` — reviewing/grading an existing skill
- `<user-request>` — the user's exact words in quotes
- `<skill-dir>` — directory where the skill lives (default: `.`)

**If this exits non-zero, you are BLOCKED.** Fix the reported issue and re-run. Do not proceed to any other step until Gate 0 passes.

## Step-by-Step Checklist (Follow In Order)

Copy this checklist into `task_plan.md` and check off each item as you complete it. **You may not skip steps.**

```
- [ ] STEP 1: Run validate-gate.sh — must exit 0
- [ ] STEP 2: Run decision tree below — pick ONE path
- [ ] STEP 3: Load the ONE matching reference file (not all)
- [ ] STEP 4: Ask questions if unclear (max 3, question tool only)
- [ ] STEP 5: Write frontmatter — run validate-skill.sh
- [ ] STEP 6: Write body — follow agentskills.io principles (see below)
- [ ] STEP 7: Run validate-skill.sh — if FAIL, fix and repeat STEP 7
- [ ] STEP 8: Run check-overlaps.sh — if FAIL, fix and repeat STEP 8
- [ ] STEP 9: Dispatch critic subagent for review — if FAIL, fix and repeat STEP 9
- [ ] STEP 10: Final validate-gate.sh re-run — must exit 0
```

## Decision Tree — Pick Your Path

```
User says...                          → Load
─────────────────────────────────────────────────────────
"create a skill" / "make a skill"     → references/03-three-patterns.md
"create a skill like this @file"      → references/03-three-patterns.md (template path)
"audit this skill" / "review skill"   → references/05-skill-quality-matrix.md
"fix triggers" / "skill not loading"  → references/11-description-optimization.md
"improve this skill" / "refactor"     → references/07-iterative-refinement.md
"skill overlaps with..."              → references/08-conflict-detection.md
"write evals for skill"               → references/10-eval-lifecycle.md
"write scripts for skill"             → references/09-script-authoring.md
"make skill work on X platform"       → references/06-cross-platform-activation.md
"doctor" / "what's wrong with..."     → references/12-anti-deception.md
```

**Rule:** Load only ONE reference file from the decision tree. Do not load all references.

## agentskills.io Principles (Apply During STEP 6)

These are the core design principles from agentskills.io. Apply them when writing skill content:

1. **Procedures over declarations** — Teach HOW to do something, not WHAT something is. Use imperative verbs: "Run this script", "Check the output", "If X, do Y". Avoid: "This skill handles...", "The agent should...".

2. **Defaults, not menus** — Pick one approach as the primary path. Mention alternatives in one sentence. Do not present 5 options and ask the agent to choose. Example: "Use `bash scripts/validate-skill.sh` to validate. For Python-only skills, `pytest` is an acceptable alternative."

3. **Match specificity to fragility** — Be prescriptive for fragile steps (file formats, YAML syntax, tool invocation). Be flexible for creative steps (body content, examples). Frontmatter format = prescriptive. Example scenarios = flexible.

4. **Checklists for multi-step workflows** — Any workflow with 3+ steps must be a checklist with `[ ]` items. Agents check items off as they go.

5. **Validation loops** — Every significant action follows: do → validate → fix → repeat. Never declare done without running the validator.

6. **Bundle scripts in scripts/** — Reusable validation, initialization, and cleanup logic lives in `scripts/`. Reference them from SKILL.md, don't inline shell commands.

## Validation Loop (STEP 7–9)

After writing skill content, enter this loop:

```
LOOP START:
  1. Run: bash scripts/validate-skill.sh <skill-dir>
  2. If exit code ≠ 0:
     - Read the FAIL messages
     - Fix each issue
     - Go to step 1
  3. Run: bash scripts/check-overlaps.sh <skill-dir>
  4. If exit code ≠ 0:
     - Read overlap warnings
     - Resolve conflicts
     - Go to step 3
  5. Dispatch critic subagent:
     - Task: "Review this skill against agentskills.io principles"
     - Pass: skill-dir path + the agentskills.io principles from this file
     - If critic reports issues → fix them → go to step 1
  6. All checks passed → exit loop
LOOP END
```

**Maximum iterations:** 5. If the loop hasn't passed after 5 iterations, stop and report what's blocking.

## Question Enforcement (STEP 4)

When intent is unclear:

- **Maximum 3 questions per session.** Not 4. Not "just one more."
- **Use the question tool only.** Do not ask questions in plain text output.
- **Wait for answers** before proceeding to implementation.
- If still unclear after 3 questions, proceed with the most reasonable default and document the assumption in `task_plan.md`.

## Gate System

| Gate | When | Criteria | Enforcement |
|------|------|----------|-------------|
| G1: Intent | Before any work | User intent in task_plan.md Goal field | `validate-gate.sh` checks Goal non-empty |
| G2: Structure | Before writing body | SKILL.md frontmatter has name + description | `validate-skill.sh` checks frontmatter |
| G3: Pattern | Before body content | Pattern (P1/P2/P3) selected in task_plan.md | `validate-gate.sh` checks pattern field |
| G4: Quality | Before declaring done | Quality score ≥ 3/5 on all 5 dimensions | `gate-enforce.sh G4` runs scoring |
| G5: Validation | Final step | validate-skill.sh + check-overlaps.sh both pass | `validate-gate.sh` re-run |
| G6: Subagent Review | After G5 | Critic subagent review passes | Manual dispatch + loop |

**Run enforcement:** `bash scripts/validate-gate.sh <action> "<request>" <dir>` — exits non-zero if blocked.

## Worked Example: Document → Skill Conversion

**Input:** User provides a 200-line markdown command file to convert into a skill.

**STEP 1:** `bash scripts/validate-gate.sh create "Convert this command file into a skill" .` → exits 0, creates task_plan.md.

**STEP 2:** Decision tree → "create a skill like this @file" → load `references/03-three-patterns.md`.

**STEP 3:** Pattern decision: focused how-to guide → **P2** (balanced depth). Record in task_plan.md.

**STEP 4:** Questions if needed (max 3 via question tool).

**STEP 5:** Write frontmatter:
```yaml
---
name: hf-l2-use-authoring-skills
description: Synthesizes Repomix-packed codebase analysis into structured research reports with citations. Use when the user asks to analyze a codebase deeply, create research reports from Repomix output, or synthesize findings from multiple code sources.
---
```
Run `bash scripts/validate-skill.sh .` → passes.

**STEP 6:** Write body following agentskills.io principles (procedures, defaults, checklists).

**STEP 7–9:** Validation loop → validate-skill.sh → check-overlaps.sh → critic subagent → all pass.

**STEP 10:** `bash scripts/validate-gate.sh create "Convert this command file into a skill" .` → exits 0.

**Output:** Complete skill at target directory with `references/` and `scripts/`.

## Anti-Patterns — With Detection

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **Phantom dependencies** — referencing skills that don't exist | `grep -r "skill(" SKILL.md references/` → verify each exists | Remove or create the missing skill |
| **Identity crisis** — P1 router with P3 depth content | Count lines: >300 in SKILL.md = likely P3 masquerading | Split into thin SKILL.md + reference files |
| **Unenforceable gates** — claims "programmatic" with no scripts | `ls scripts/` → must have validate-gate.sh + validate-skill.sh | Create enforcement scripts or remove gate claims |
| **Template TDD mismatch** — forcing RED phase on template conversion | Check task type: if "convert document" → skip RED | Use template-driven workflow |
| **Banned field usage** — `compatibility` in frontmatter | `grep "compatibility:" SKILL.md` | Remove per agentskills.io spec |
| **Skipping validation loop** — declaring done without running validators | Check task_plan.md: STEP 7–9 unchecked | Run the loop before claiming complete |

## Platform Adaptation

| Platform | Skill Location | Hook Format | Notes |
|----------|---------------|-------------|-------|
| **OpenCode** | `.opencode/skills/<name>/SKILL.md` | `opencode.json` hooks | Use `skill` tool to load |
| **Claude Code** | `.claude/skills/<name>/SKILL.md` | `.claude/hooks/` | Same frontmatter spec |
| **Codex** | `.codex/skills/<name>/SKILL.md` | `.codex/hooks/` | May need `allowed-tools` field |
| **Cursor** | `.cursor/skills/<name>/SKILL.md` | `.cursor/rules/` | Frontmatter may vary |

Always write frontmatter per agentskills.io spec — it is the lowest common denominator.

## Scripts

All 8 scripts passed audit — each has real validation logic, exits non-zero on failure, and contains no placeholder/TODO text. Unlike stub scripts (which exit 0 always), these enforce actual constraints.

| Script | Purpose | Lines |
|--------|---------|-------|
| `validate-gate.sh` | Preflight: intent, pattern, planning files | 118 |
| `validate-skill.sh` | Structure: frontmatter, sections, terminology | 187 |
| `check-overlaps.sh` | Content duplication detection across reference files | 203 |
| `gate-enforce.sh` | Gate G1-G5 enforcement with pass/fail | 109 |
| `check-complete.sh` | Phase completion status reporter | 37 |
| `init-session.sh` | Planning file initialization | 121 |
| `register-skill.sh` | Skill load recording in loaded-skills.json | 122 |
| `verify-hierarchy.sh` | Prerequisite chain verification | 295 |

Enforcement lives primarily in SKILL.md text (Iron Law + Validation Gate). Scripts supplement for mechanical checks (structure validation, gate enforcement). If a script ever becomes a stub (exits 0 without checking), delete it — the text enforcement is the source of truth.

## Validation Gate

Before a skill is done:
- [ ] Description has trigger phrases (specific things users would say)
- [ ] Description uses third person
- [ ] SKILL.md body uses imperative form
- [ ] SKILL.md is lean (1,500-2,000 words, <5k max)
- [ ] All referenced files exist and have real content (not stubs)
- [ ] No script stubs that exit 0 always
- [ ] No dead references to files/scripts that don't exist
- [ ] Works standalone — doesn't require other HiveMind skills

## Three Operating Rules

1. **Run validate-gate.sh first** — before reading, writing, or planning anything.
2. **Procedures over declarations** — teach HOW, not WHAT. Use checklists for 3+ step workflows.
3. **Validate before done** — run the validation loop (STEP 7–9). No exceptions.

## Self-Correction

### When the Task Keeps Failing
[Detection] validate-skill.sh repeatedly fails (3+ iterations). check-overlaps.sh reports persistent conflicts. Critic subagent keeps flagging the same issues after 3 fix cycles.
[Recovery] STOP the validation loop. Read the exact failure messages from each failing script. Address the root cause rather than patching symptoms. If overlap conflicts persist: the skill may need scope reduction or should be merged with the overlapping skill. If critic reports are unclear: ask the user which specific principle is violated before continuing. Do not exceed 5 total iterations — beyond that, the skill needs redesign, not refinement.

### When Unsure About the Next Step
[Detection] The user's request doesn't clearly map to any decision tree path. validate-gate.sh exits with an ambiguous error. Pattern selection (P1/P2/P3) is unclear for the task.
[Recovery] Run `bash scripts/validate-gate.sh <action> "<user-request>" <dir>` to create task_plan.md — this will clarify intent and pattern. Check the pattern field in task_plan.md: if unset, default to P2 (balanced depth) for most authoring tasks. Use the question tool for up to 3 clarifications — but proceed with reasonable defaults if still unclear after 3 questions.

### When the User Contradicts Skill Guidance
[Detection] User says "don't bother with the checklist" or "skip validation, just write it" or "I know the agentskills.io spec, ignore it." User wants to bypass the 10-step checklist or validation loop.
[Recovery] Acknowledge the user's authority but warn: "Skipping validation means the skill may have broken frontmatter, phantom references, or dead trigger phrases. The skill may silently fail to load." If the user insists, document skipped steps in task_plan.md and mark the skill as "unvalidated." Never claim a skill passed validation if any gate was skipped.

### When an Edge Case Is Encountered
[Detection] Skill being audited uses a non-standard frontmatter format (different YAML spec). User wants to author a skill for a platform not in the adaptation table. Script fails due to missing dependency (bash version, jq not installed). Skill has content in multiple languages.
[Recovery] For non-standard frontmatter: validate against agentskills.io spec and flag deviations. For unsupported platforms: apply agentskills.io patterns as the lowest common denominator, then document platform-specific adaptations. For missing dependencies: check if the script has fallback logic — if not, inform the user which dependency is needed. For multi-language skills: treat the primary language as canonical and flag translations for separate review.

Base directory for this skill: file:///Users/apple/hivemind-plugin-private/.opencode/skills/hf-l2-use-authoring-skills
Relative paths in this skill (e.g., scripts/, reference/) are relative to this base directory.
Note: file list is sampled.

<skill_files>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hf-l2-use-authoring-skills/task_plan.md</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hf-l2-use-authoring-skills/templates/trigger-queries.json</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hf-l2-use-authoring-skills/templates/grading-rubric.json</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hf-l2-use-authoring-skills/templates/skill-scaffold/references/.gitkeep</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hf-l2-use-authoring-skills/evals/trigger-queries.json</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hf-l2-use-authoring-skills/evals/evals.json</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hf-l2-use-authoring-skills/templates/evals.json</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hf-l2-use-authoring-skills/references/03-three-patterns.md</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hf-l2-use-authoring-skills/references/08-conflict-detection.md</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hf-l2-use-authoring-skills/references/04-tdd-workflow.md</file>
</skill_files>
</skill_content>
```

**Tool: skill**

**Input:**
```json
{
  "name": "skill-judge"
}
```

**Output:**
```
<skill_content name="skill-judge">
# Skill: skill-judge

# Skill Judge

Evaluate Agent Skills against official specifications and patterns derived from 17+ official examples.

---

## Core Philosophy

### What is a Skill?

A Skill is NOT a tutorial. A Skill is a **knowledge externalization mechanism**.

Traditional AI knowledge is locked in model parameters. To teach new capabilities:
```
Traditional: Collect data → GPU cluster → Train → Deploy new version
Cost: $10,000 - $1,000,000+
Timeline: Weeks to months
```

Skills change this:
```
Skill: Edit SKILL.md → Save → Takes effect on next invocation
Cost: $0
Timeline: Instant
```

This is the paradigm shift from "training AI" to "educating AI" — like a hot-swappable LoRA adapter that requires no training. You edit a Markdown file in natural language, and the model's behavior changes.

### The Core Formula

> **Good Skill = Expert-only Knowledge − What Claude Already Knows**

A Skill's value is measured by its **knowledge delta** — the gap between what it provides and what the model already knows.

- **Expert-only knowledge**: Decision trees, trade-offs, edge cases, anti-patterns, domain-specific thinking frameworks — things that take years of experience to accumulate
- **What Claude already knows**: Basic concepts, standard library usage, common programming patterns, general best practices

When a Skill explains "what is PDF" or "how to write a for-loop", it's compressing knowledge Claude already has. This is **token waste** — context window is a public resource shared with system prompts, conversation history, other Skills, and user requests.

### Tool vs Skill

| Concept | Essence | Function | Example |
|---------|---------|----------|---------|
| **Tool** | What model CAN do | Execute actions | bash, read_file, write_file, WebSearch |
| **Skill** | What model KNOWS how to do | Guide decisions | PDF processing, MCP building, frontend design |

Tools define capability boundaries — without bash tool, model can't execute commands.
Skills inject knowledge — without frontend-design Skill, model produces generic UI.

**The equation**:
```
General Agent + Excellent Skill = Domain Expert Agent
```

Same Claude model, different Skills loaded, becomes different experts.

### Three Types of Knowledge in Skills

When evaluating, categorize each section:

| Type | Definition | Treatment |
|------|------------|-----------|
| **Expert** | Claude genuinely doesn't know this | Must keep — this is the Skill's value |
| **Activation** | Claude knows but may not think of | Keep if brief — serves as reminder |
| **Redundant** | Claude definitely knows this | Should delete — wastes tokens |

The art of Skill design is maximizing Expert content, using Activation sparingly, and eliminating Redundant ruthlessly.

---

## Evaluation Dimensions (120 points total)

### D1: Knowledge Delta (20 points) — THE CORE DIMENSION

The most important dimension. Does the Skill add genuine expert knowledge?

| Score | Criteria |
|-------|----------|
| 0-5 | Explains basics Claude knows (what is X, how to write code, standard library tutorials) |
| 6-10 | Mixed: some expert knowledge diluted by obvious content |
| 11-15 | Mostly expert knowledge with minimal redundancy |
| 16-20 | Pure knowledge delta — every paragraph earns its tokens |

**Red flags** (instant score ≤5):
- "What is [basic concept]" sections
- Step-by-step tutorials for standard operations
- Explaining how to use common libraries
- Generic best practices ("write clean code", "handle errors")
- Definitions of industry-standard terms

**Green flags** (indicators of high knowledge delta):
- Decision trees for non-obvious choices ("when X fails, try Y because Z")
- Trade-offs only an expert would know ("A is faster but B handles edge case C")
- Edge cases from real-world experience
- "NEVER do X because [non-obvious reason]"
- Domain-specific thinking frameworks

**Evaluation questions**:
1. For each section, ask: "Does Claude already know this?"
2. If explaining something, ask: "Is this explaining TO Claude or FOR Claude?"
3. Count paragraphs that are Expert vs Activation vs Redundant

---

### D2: Mindset + Appropriate Procedures (15 points)

Does the Skill transfer expert **thinking patterns** along with **necessary domain-specific procedures**?

The difference between experts and novices isn't "knowing how to operate" — it's "how to think about the problem." But thinking patterns alone aren't enough when Claude lacks domain-specific procedural knowledge.

**Key distinction**:
| Type | Example | Value |
|------|---------|-------|
| **Thinking patterns** | "Before designing, ask: What makes this memorable?" | High — shapes decision-making |
| **Domain-specific procedures** | "OOXML workflow: unpack → edit XML → validate → pack" | High — Claude may not know this |
| **Generic procedures** | "Step 1: Open file, Step 2: Edit, Step 3: Save" | Low — Claude already knows |

| Score | Criteria |
|-------|----------|
| 0-3 | Only generic procedures Claude already knows |
| 4-7 | Has domain procedures but lacks thinking frameworks |
| 8-11 | Good balance: thinking patterns + domain-specific workflows |
| 12-15 | Expert-level: shapes thinking AND provides procedures Claude wouldn't know |

**What counts as valuable procedures**:
- Workflows Claude hasn't been trained on (new tools, proprietary systems)
- Correct ordering that's non-obvious (e.g., "validate BEFORE packing, not after")
- Critical steps that are easy to miss (e.g., "MUST recalculate formulas after editing")
- Domain-specific sequences (e.g., MCP server's 4-phase development process)

**What counts as redundant procedures**:
- Generic file operations (open, read, write, save)
- Standard programming patterns (loops, conditionals, error handling)
- Common library usage that's well-documented

**Expert thinking patterns look like**:
```markdown
Before [action], ask yourself:
- **Purpose**: What problem does this solve? Who uses it?
- **Constraints**: What are the hidden requirements?
- **Differentiation**: What makes this solution memorable?
```

**Valuable domain procedures look like**:
```markdown
### Redlining Workflow (Claude wouldn't know this sequence)
1. Convert to markdown: `pandoc --track-changes=all`
2. Map text to XML: grep for text in document.xml
3. Implement changes in batches of 3-10
4. Pack and verify: check ALL changes were applied
```

**Redundant generic procedures look like**:
```markdown
Step 1: Open the file
Step 2: Find the section
Step 3: Make the change
Step 4: Save and test
```

**The test**:
1. Does it tell Claude WHAT to think about? (thinking patterns)
2. Does it tell Claude HOW to do things it wouldn't know? (domain procedures)

A good Skill provides both when needed.

---

### D3: Anti-Pattern Quality (15 points)

Does the Skill have effective NEVER lists?

**Why this matters**: Half of expert knowledge is knowing what NOT to do. A senior designer sees purple gradient on white background and instinctively cringes — "too AI-generated." This intuition for "what absolutely not to do" comes from stepping on countless landmines.

Claude hasn't stepped on these landmines. It doesn't know Inter font is overused, doesn't know purple gradients are the signature of AI-generated content. Good Skills must explicitly state these "absolute don'ts."

| Score | Criteria |
|-------|----------|
| 0-3 | No anti-patterns mentioned |
| 4-7 | Generic warnings ("avoid errors", "be careful", "consider edge cases") |
| 8-11 | Specific NEVER list with some reasoning |
| 12-15 | Expert-grade anti-patterns with WHY — things only experience teaches |

**Expert anti-patterns** (specific + reason):
```markdown
NEVER use generic AI-generated aesthetics like:
- Overused font families (Inter, Roboto, Arial)
- Cliched color schemes (particularly purple gradients on white backgrounds)
- Predictable layouts and component patterns
- Default border-radius on everything
```

**Weak anti-patterns** (vague, no reasoning):
```markdown
Avoid making mistakes.
Be careful with edge cases.
Don't write bad code.
```

**The test**: Would an expert read the anti-pattern list and say "yes, I learned this the hard way"? Or would they say "this is obvious to everyone"?

---

### D4: Specification Compliance — Especially Description (15 points)

Does the Skill follow official format requirements? **Special focus on description quality.**

| Score | Criteria |
|-------|----------|
| 0-5 | Missing frontmatter or invalid format |
| 6-10 | Has frontmatter but description is vague or incomplete |
| 11-13 | Valid frontmatter, description has WHAT but weak on WHEN |
| 14-15 | Perfect: comprehensive description with WHAT, WHEN, and trigger keywords |

**Frontmatter requirements**:
- `name`: lowercase, alphanumeric + hyphens only, ≤64 characters
- `description`: **THE MOST CRITICAL FIELD** — determines if skill gets used at all

---

**Why description is THE MOST IMPORTANT field**:

```
┌─────────────────────────────────────────────────────────────────────┐
│  SKILL ACTIVATION FLOW                                              │
│                                                                     │
│  User Request → Agent sees ALL skill descriptions → Decides which  │
│                 (only descriptions, not bodies!)     to activate    │
│                                                                     │
│  If description doesn't match → Skill NEVER gets loaded            │
│  If description is vague → Skill might not trigger when it should  │
│  If description lacks keywords → Skill is invisible to the Agent   │
└─────────────────────────────────────────────────────────────────────┘
```

**The brutal truth**: A Skill with perfect content but poor description is **useless** — it will never be activated. The description is the **only chance** to tell the Agent "use me in these situations."

---

**Description must answer THREE questions**:

1. **WHAT**: What does this Skill do? (functionality)
2. **WHEN**: In what situations should it be used? (trigger scenarios)
3. **KEYWORDS**: What terms should trigger this Skill? (searchable terms)

**Excellent description** (all three elements):
```yaml
description: "Comprehensive document creation, editing, and analysis with support
for tracked changes, comments, formatting preservation, and text extraction.
When Claude needs to work with professional documents (.docx files) for:
(1) Creating new documents, (2) Modifying or editing content,
(3) Working with tracked changes, (4) Adding comments, or any other document tasks"
```

Analysis:
- WHAT: creation, editing, analysis, tracked changes, comments
- WHEN: "When Claude needs to work with... for: (1)... (2)... (3)..."
- KEYWORDS: .docx files, tracked changes, professional documents

**Poor description** (missing elements):
```yaml
description: "处理文档相关功能"
```

Problems:
- WHAT: vague ("文档相关功能" — what specifically?)
- WHEN: missing (when should Agent use this?)
- KEYWORDS: missing (no ".docx", no specific scenarios)

**Another poor example**:
```yaml
description: "A helpful skill for various tasks"
```

This is useless — Agent has no idea when to activate it.

---

**Description quality checklist**:
- [ ] Lists specific capabilities (not just "helps with X")
- [ ] Includes explicit trigger scenarios ("Use when...", "When user asks for...")
- [ ] Contains searchable keywords (file extensions, domain terms, action verbs)
- [ ] Specific enough that Agent knows EXACTLY when to use it
- [ ] Includes scenarios where this skill MUST be used (not just "can be used")

---

### D5: Progressive Disclosure (15 points)

Does the Skill implement proper content layering?

Skill loading has three layers:
```
Layer 1: Metadata (always in memory)
         Only name + description
         ~100 tokens per skill

Layer 2: SKILL.md Body (loaded after triggering)
         Detailed guidelines, code examples, decision trees
         Ideal: < 500 lines

Layer 3: Resources (loaded on demand)
         scripts/, references/, assets/
         No limit
```

| Score | Criteria |
|-------|----------|
| 0-5 | Everything dumped in SKILL.md (>500 lines, no structure) |
| 6-10 | Has references but unclear when to load them |
| 11-13 | Good layering with MANDATORY triggers present |
| 14-15 | Perfect: decision trees + explicit triggers + "Do NOT Load" guidance |

**For Skills WITH references directory**, check Loading Trigger Quality:

| Trigger Quality | Characteristics |
|-----------------|-----------------|
| Poor | References listed at end, no loading guidance |
| Mediocre | Some triggers but not embedded in workflow |
| Good | MANDATORY triggers in workflow steps |
| Excellent | Scenario detection + conditional triggers + "Do NOT Load" |

**The loading problem**:
```
Loading too little ◄─────────────────────────────────► Loading too much
- References sit unused                    - Wastes context space
- Agent doesn't know when to load          - Irrelevant info dilutes key content
- Knowledge is there but never accessed    - Unnecessary token overhead
```

**Good loading trigger** (embedded in workflow):
```markdown
### Creating New Document

**MANDATORY - READ ENTIRE FILE**: Before proceeding, you MUST read
[`docx-js.md`](docx-js.md) (~500 lines) completely from start to finish.
**NEVER set any range limits when reading this file.**

**Do NOT load** `ooxml.md` or `redlining.md` for this task.
```

**Bad loading trigger** (just listed):
```markdown
## References
- docx-js.md - for creating documents
- ooxml.md - for editing
- redlining.md - for tracking changes
```

**For simple Skills** (no references, <100 lines): Score based on conciseness and self-containment.

---

### D6: Freedom Calibration (15 points)

Is the level of specificity appropriate for the task's fragility?

Different tasks need different levels of constraint. This is about matching freedom to fragility.

| Score | Criteria |
|-------|----------|
| 0-5 | Severely mismatched (rigid scripts for creative tasks, vague for fragile ops) |
| 6-10 | Partially appropriate, some mismatches |
| 11-13 | Good calibration for most scenarios |
| 14-15 | Perfect freedom calibration throughout |

**The freedom spectrum**:

| Task Type | Should Have | Why | Example Skill |
|-----------|-------------|-----|---------------|
| Creative/Design | High freedom | Multiple valid approaches, differentiation is value | frontend-design |
| Code review | Medium freedom | Principles exist but judgment required | code-review |
| File format operations | Low freedom | One wrong byte corrupts file, consistency critical | docx, xlsx, pdf |

**High freedom** (text-based instructions):
```markdown
Commit to a BOLD aesthetic direction. Pick an extreme: brutally minimal,
maximalist chaos, retro-futuristic, organic natural...
```

**Medium freedom** (pseudocode or parameterized):
```markdown
Review priority:
1. Security vulnerabilities (must fix)
2. Logic errors (must fix)
3. Performance issues (should fix)
4. Maintainability (optional)
```

**Low freedom** (specific scripts, exact steps):
```markdown
**MANDATORY**: Use exact script in `scripts/create-doc.py`
Parameters: --title "X" --author "Y"
Do NOT modify the script.
```

**The test**: Ask "if Agent makes a mistake, what's the consequence?"
- High consequence → Low freedom
- Low consequence → High freedom

---

### D7: Pattern Recognition (10 points)

Does the Skill follow an established official pattern?

Through analyzing 17 official Skills, we identified 5 main design patterns:

| Pattern | ~Lines | Key Characteristics | Example | When to Use |
|---------|--------|---------------------|---------|-------------|
| **Mindset** | ~50 | Thinking > technique, strong NEVER list, high freedom | frontend-design | Creative tasks requiring taste |
| **Navigation** | ~30 | Minimal SKILL.md, routes to sub-files | internal-comms | Multiple distinct scenarios |
| **Philosophy** | ~150 | Two-step: Philosophy → Express, emphasizes craft | canvas-design | Art/creation requiring originality |
| **Process** | ~200 | Phased workflow, checkpoints, medium freedom | mcp-builder | Complex multi-step projects |
| **Tool** | ~300 | Decision trees, code examples, low freedom | docx, pdf, xlsx | Precise operations on specific formats |

| Score | Criteria |
|-------|----------|
| 0-3 | No recognizable pattern, chaotic structure |
| 4-6 | Partially follows a pattern with significant deviations |
| 7-8 | Clear pattern with minor deviations |
| 9-10 | Masterful application of appropriate pattern |

**Pattern selection guide**:

| Your Task Characteristics | Recommended Pattern |
|---------------------------|---------------------|
| Needs taste and creativity | Mindset (~50 lines) |
| Needs originality and craft quality | Philosophy (~150 lines) |
| Has multiple distinct sub-scenarios | Navigation (~30 lines) |
| Complex multi-step project | Process (~200 lines) |
| Precise operations on specific format | Tool (~300 lines) |

---

### D8: Practical Usability (15 points)

Can an Agent actually use this Skill effectively?

| Score | Criteria |
|-------|----------|
| 0-5 | Confusing, incomplete, contradictory, or untested guidance |
| 6-10 | Usable but with noticeable gaps |
| 11-13 | Clear guidance for common cases |
| 14-15 | Comprehensive coverage including edge cases and error handling |

**Check for**:
- **Decision trees**: For multi-path scenarios, is there clear guidance on which path to take?
- **Code examples**: Do they actually work? Or are they pseudocode that breaks?
- **Error handling**: What if the main approach fails? Are fallbacks provided?
- **Edge cases**: Are unusual but realistic scenarios covered?
- **Actionability**: Can Agent immediately act, or needs to figure things out?

**Good usability** (decision tree + fallback):
```markdown
| Task | Primary Tool | Fallback | When to Use Fallback |
|------|-------------|----------|----------------------|
| Read text | pdftotext | PyMuPDF | Need layout info |
| Extract tables | camelot-py | tabula-py | camelot fails |

**Common issues**:
- Scanned PDF: pdftotext returns blank → Use OCR first
- Encrypted PDF: Permission error → Use PyMuPDF with password
```

**Poor usability** (vague):
```markdown
Use appropriate tools for PDF processing.
Handle errors properly.
Consider edge cases.
```

---

## NEVER Do When Evaluating

- **NEVER** give high scores just because it "looks professional" or is well-formatted
- **NEVER** ignore token waste — every redundant paragraph should result in deduction
- **NEVER** let length impress you — a 43-line Skill can outperform a 500-line Skill
- **NEVER** skip mentally testing the decision trees — do they actually lead to correct choices?
- **NEVER** forgive explaining basics with "but it provides helpful context"
- **NEVER** overlook missing anti-patterns — if there's no NEVER list, that's a significant gap
- **NEVER** assume all procedures are valuable — distinguish domain-specific from generic
- **NEVER** undervalue the description field — poor description = skill never gets used
- **NEVER** put "when to use" info only in the body — Agent only sees description before loading

---

## Evaluation Protocol

### Step 1: First Pass — Knowledge Delta Scan

Read SKILL.md completely and for each section ask:
> "Does Claude already know this?"

Mark each section as:
- **[E] Expert**: Claude genuinely doesn't know this — value-add
- **[A] Activation**: Claude knows but brief reminder is useful — acceptable
- **[R] Redundant**: Claude definitely knows this — should be deleted

Calculate rough ratio: E:A:R
- Good Skill: >70% Expert, <20% Activation, <10% Redundant
- Mediocre Skill: 40-70% Expert, high Activation
- Bad Skill: <40% Expert, high Redundant

### Step 2: Structure Analysis

```
[ ] Check frontmatter validity
[ ] Count total lines in SKILL.md
[ ] List all reference files and their sizes
[ ] Identify which pattern the Skill follows
[ ] Check for loading triggers (if references exist)
```

### Step 3: Score Each Dimension

For each of the 8 dimensions:
1. Find specific evidence (quote relevant lines)
2. Assign score with one-line justification
3. Note specific improvements if score < max

### Step 4: Calculate Total & Grade

```
Total = D1 + D2 + D3 + D4 + D5 + D6 + D7 + D8
Max = 120 points
```

**Grade Scale** (percentage-based):
| Grade | Percentage | Meaning |
|-------|------------|---------|
| A | 90%+ (108+) | Excellent — production-ready expert Skill |
| B | 80-89% (96-107) | Good — minor improvements needed |
| C | 70-79% (84-95) | Adequate — clear improvement path |
| D | 60-69% (72-83) | Below Average — significant issues |
| F | <60% (<72) | Poor — needs fundamental redesign |

### Step 5: Generate Report

```markdown
# Skill Evaluation Report: [Skill Name]

## Summary
- **Total Score**: X/120 (X%)
- **Grade**: [A/B/C/D/F]
- **Pattern**: [Mindset/Navigation/Philosophy/Process/Tool]
- **Knowledge Ratio**: E:A:R = X:Y:Z
- **Verdict**: [One sentence assessment]

## Dimension Scores

| Dimension | Score | Max | Notes |
|-----------|-------|-----|-------|
| D1: Knowledge Delta | X | 20 | |
| D2: Mindset vs Mechanics | X | 15 | |
| D3: Anti-Pattern Quality | X | 15 | |
| D4: Specification Compliance | X | 15 | |
| D5: Progressive Disclosure | X | 15 | |
| D6: Freedom Calibration | X | 15 | |
| D7: Pattern Recognition | X | 10 | |
| D8: Practical Usability | X | 15 | |

## Critical Issues
[List must-fix problems that significantly impact the Skill's effectiveness]

## Top 3 Improvements
1. [Highest impact improvement with specific guidance]
2. [Second priority improvement]
3. [Third priority improvement]

## Detailed Analysis
[For each dimension scoring below 80%, provide:
- What's missing or problematic
- Specific examples from the Skill
- Concrete suggestions for improvement]
```

---

## Common Failure Patterns

### Pattern 1: The Tutorial
```
Symptom: Explains what PDF is, how Python works, basic library usage
Root cause: Author assumes Skill should "teach" the model
Fix: Claude already knows this. Delete all basic explanations.
     Focus on expert decisions, trade-offs, and anti-patterns.
```

### Pattern 2: The Dump
```
Symptom: SKILL.md is 800+ lines with everything included
Root cause: No progressive disclosure design
Fix: Core routing and decision trees in SKILL.md (<300 lines ideal)
     Detailed content in references/, loaded on-demand
```

### Pattern 3: The Orphan References
```
Symptom: References directory exists but files are never loaded
Root cause: No explicit loading triggers
Fix: Add "MANDATORY - READ ENTIRE FILE" at workflow decision points
     Add "Do NOT Load" to prevent over-loading
```

### Pattern 4: The Checkbox Procedure
```
Symptom: Step 1, Step 2, Step 3... mechanical procedures
Root cause: Author thinks in procedures, not thinking frameworks
Fix: Transform into "Before doing X, ask yourself..."
     Focus on decision principles, not operation sequences
```

### Pattern 5: The Vague Warning
```
Symptom: "Be careful", "avoid errors", "consider edge cases"
Root cause: Author knows things can go wrong but hasn't articulated specifics
Fix: Specific NEVER list with concrete examples and non-obvious reasons
     "NEVER use X because [specific problem that takes experience to learn]"
```

### Pattern 6: The Invisible Skill
```
Symptom: Great content but skill rarely gets activated
Root cause: Description is vague, missing keywords, or lacks trigger scenarios
Fix: Description must answer WHAT, WHEN, and include KEYWORDS
     "Use when..." + specific scenarios + searchable terms

Example fix:
BAD:  "Helps with document tasks"
GOOD: "Create, edit, and analyze .docx files. Use when working with
       Word documents, tracked changes, or professional document formatting."
```

### Pattern 7: The Wrong Location
```
Symptom: "When to use this Skill" section in body, not in description
Root cause: Misunderstanding of three-layer loading
Fix: Move all triggering information to description field
     Body is only loaded AFTER triggering decision is made
```

### Pattern 8: The Over-Engineered
```
Symptom: README.md, CHANGELOG.md, INSTALLATION_GUIDE.md, CONTRIBUTING.md
Root cause: Treating Skill like a software project
Fix: Delete all auxiliary files. Only include what Agent needs for the task.
     No documentation about the Skill itself.
```

### Pattern 9: The Freedom Mismatch
```
Symptom: Rigid scripts for creative tasks, vague guidance for fragile operations
Root cause: Not considering task fragility
Fix: High freedom for creative (principles, not steps)
     Low freedom for fragile (exact scripts, no parameters)
```

---

## Quick Reference Checklist

```
┌─────────────────────────────────────────────────────────────────────────┐
│  SKILL EVALUATION QUICK CHECK                                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  KNOWLEDGE DELTA (most important):                                      │
│    [ ] No "What is X" explanations for basic concepts                   │
│    [ ] No step-by-step tutorials for standard operations                │
│    [ ] Has decision trees for non-obvious choices                       │
│    [ ] Has trade-offs only experts would know                           │
│    [ ] Has edge cases from real-world experience                        │
│                                                                         │
│  MINDSET + PROCEDURES:                                                  │
│    [ ] Transfers thinking patterns (how to think about problems)        │
│    [ ] Has "Before doing X, ask yourself..." frameworks                 │
│    [ ] Includes domain-specific procedures Claude wouldn't know         │
│    [ ] Distinguishes valuable procedures from generic ones              │
│                                                                         │
│  ANTI-PATTERNS:                                                         │
│    [ ] Has explicit NEVER list                                          │
│    [ ] Anti-patterns are specific, not vague                            │
│    [ ] Includes WHY (non-obvious reasons)                               │
│                                                                         │
│  SPECIFICATION (description is critical!):                              │
│    [ ] Valid YAML frontmatter                                           │
│    [ ] name: lowercase, ≤64 chars                                       │
│    [ ] description answers: WHAT does it do?                            │
│    [ ] description answers: WHEN should it be used?                     │
│    [ ] description contains trigger KEYWORDS                            │
│    [ ] description is specific enough for Agent to know when to use     │
│                                                                         │
│  STRUCTURE:                                                             │
│    [ ] SKILL.md < 500 lines (ideal < 300)                               │
│    [ ] Heavy content in references/                                     │
│    [ ] Loading triggers embedded in workflow                            │
│    [ ] Has "Do NOT Load" for preventing over-loading                    │
│                                                                         │
│  FREEDOM:                                                               │
│    [ ] Creative tasks → High freedom (principles)                       │
│    [ ] Fragile operations → Low freedom (exact scripts)                 │
│                                                                         │
│  USABILITY:                                                             │
│    [ ] Decision trees for multi-path scenarios                          │
│    [ ] Working code examples                                            │
│    [ ] Error handling and fallbacks                                     │
│    [ ] Edge cases covered                                               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## The Meta-Question

When evaluating any Skill, always return to this fundamental question:

> **"Would an expert in this domain, looking at this Skill, say:**
> **'Yes, this captures knowledge that took me years to learn'?"**

If the answer is yes → the Skill has genuine value.
If the answer is no → it's compressing what Claude already knows.

The best Skills are **compressed expert brains** — they take a designer's 10 years of aesthetic accumulation and compress it into 43 lines, or a document expert's operational experience into a 200-line decision tree.

What gets compressed must be things Claude doesn't have. Otherwise, it's garbage compression.

---

## Self-Evaluation Note

This Skill (skill-judge) should itself pass evaluation:

- **Knowledge Delta**: Provides specific evaluation criteria Claude wouldn't generate on its own
- **Mindset**: Shapes how to think about Skill quality, not just checklist items
- **Anti-Patterns**: "NEVER Do When Evaluating" section with specific don'ts
- **Specification**: Valid frontmatter with comprehensive description
- **Progressive Disclosure**: Self-contained, no external references needed
- **Freedom**: Medium freedom appropriate for evaluation task
- **Pattern**: Follows Tool pattern with decision frameworks
- **Usability**: Clear protocol, report template, quick reference



Evaluate this Skill against itself as a calibration exercise.

Base directory for this skill: file:///Users/apple/.claude/skills/skill-judge
Relative paths in this skill (e.g., scripts/, reference/) are relative to this base directory.
Note: file list is sampled.

<skill_files>
<file>/Users/apple/.claude/skills/skill-judge/README.md</file>
</skill_files>
</skill_content>
```

---

## Assistant (Hf-L2-Skill-Builder · DeepSeek V4 Pro · 10.2s)

_Thinking:_

The skills are loaded. Now let me begin Phase 1: INGEST all files in the source directory. Let me read the directory structure first, then systematically read every file.

Skills loaded. Now beginning **Phase 1: INGEST** — reading the entire source directory tree.

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/skills-lab/active/refactoring/stack-l3-opencode"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/skills-lab/active/refactoring/stack-l3-opencode</path>
<type>directory</type>
<entries>
bundled/
evals/
metadata.json
metrics/
references/
scripts/
SKILL.md
TOC.md

(8 entries)
</entries>
```

**Tool: glob**

**Input:**
```json
{
  "pattern": "**/*",
  "path": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/skills-lab/active/refactoring/stack-l3-opencode"
}
```

**Output:**
```
/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/skills-lab/active/refactoring/stack-l3-opencode/TOC.md
/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/skills-lab/active/refactoring/stack-l3-opencode/references/api/plugin.md
/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/skills-lab/active/refactoring/stack-l3-opencode/metrics/rich-gate-scorecard.md
/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/skills-lab/active/refactoring/stack-l3-opencode/references/architecture.md
/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/skills-lab/active/refactoring/stack-l3-opencode/metadata.json
/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/skills-lab/active/refactoring/stack-l3-opencode/SKILL.md
/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/skills-lab/active/refactoring/stack-l3-opencode/scripts/update.sh
/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/skills-lab/active/refactoring/stack-l3-opencode/scripts/.gitkeep
/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/skills-lab/active/refactoring/stack-l3-opencode/references/patterns/testing.md
/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/skills-lab/active/refactoring/stack-l3-opencode/references/patterns/dev.md
/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/skills-lab/active/refactoring/stack-l3-opencode/references/patterns/.gitkeep
/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/skills-lab/active/refactoring/stack-l3-opencode/references/patterns/gatekeeping.md
/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/skills-lab/active/refactoring/stack-l3-opencode/references/migration/.gitkeep
/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/skills-lab/active/refactoring/stack-l3-opencode/references/expert/tool-internals.md
/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/skills-lab/active/refactoring/stack-l3-opencode/references/expert/hook-composition.md
/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/skills-lab/active/refactoring/stack-l3-opencode/references/expert/client-server.md
/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/skills-lab/active/refactoring/stack-l3-opencode/references/api/types.md
/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/skills-lab/active/refactoring/stack-l3-opencode/references/api/sdk.md
/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/skills-lab/active/refactoring/stack-l3-opencode/references/expert/.gitkeep
/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/skills-lab/active/refactoring/stack-l3-opencode/references/.gitkeep
/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/skills-lab/active/refactoring/stack-l3-opencode/references/api/.gitkeep
/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/skills-lab/active/refactoring/stack-l3-opencode/bundled/opencode-sdk-plugin.md
/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/skills-lab/active/refactoring/stack-l3-opencode/evals/evals.json
/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/skills-lab/active/refactoring/stack-l3-opencode/bundled/.gitkeep
```

---

## Assistant (Hf-L2-Skill-Builder · DeepSeek V4 Pro · 19.1s)

_Thinking:_

Good, I have the full file list. Now let me read ALL files systematically. Let me start with the core files first, then move to the subdirectories.

Now let me read all core files. Starting with SKILL.md, metadata.json, TOC.md, and the main reference files:

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/skills-lab/active/refactoring/stack-l3-opencode/SKILL.md"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/skills-lab/active/refactoring/stack-l3-opencode/SKILL.md</path>
<type>file</type>
<content>
1: ---
2: name: stack-l3-opencode
3:   version: "1.14.44"
4: description: "OpenCode SDK + Plugin internals for feature development, architecture, auditing, quality checking, test building, and gatekeeping. Contains BEYOND-DOCS expert knowledge extracted from source."
5: triggers:
6:   - "opencode sdk"
7:   - "opencode plugin"
8:   - "definePlugin"
9:   - "tool registration"
10:   - "hook registration"
11:   - "session management"
12:   - "delegate task"
13:   - "opencode api"
14:   - "plugin development"
15:   - "opencode tool"
16:   - "opencode hook"
17:   - "tool.execute"
18:   - "chat.params"
19:   - "chat.headers"
20:   - "shell.env"
21:   - "permission.ask"
22:   - "session.compacting"
23:   - "ToolContext"
24:   - "ToolResult"
25:   - "PluginInput"
26:   - "Hooks"
27:   - "AuthHook"
28:   - "ProviderHook"
29:   - "createOpencodeClient"
30:   - "BunShell"
31:   - "hook composition"
32:   - "tool schema validation"
33:   - "opencode sse"
34:   - "opencode abort signal"
35:   - "acp protocol"
36:   - "agent client protocol"
37:   - "TUI keymap"
38:   - "workspace adapter"
39:   - "api.keymap"
40: ---
41: 
42: # Stack: OpenCode SDK + Plugin
43: 
44: > **Version:** 1.14.44 | **Source:** [anomalyco/opencode](https://github.com/anomalyco/opencode) | **Bundled:** 22,771 lines
45: 
46: ## ⚠️ Key Gotchas (Read Before Coding)
47: 
48: 1. **`tool()` is an identity function** — zero runtime validation, pure TypeScript branding
49: 2. **`context.ask()` returns Effect, not Promise** — `await` does nothing; use `Effect.runPromise()`
50: 3. **Hook output is mutable pass-through** — last-write-wins at field level; always spread
51: 4. **`z.transform()`/`.refine()`/`z.lazy()` silently break** in tool schemas — only use primitives
52: 5. **Abort signal is cooperative** — runtime doesn't force-kill your async operations
53: 6. **Session has no "completed" state** — only idle/busy/retry; sessions live until deleted
54: 7. **No hook priority system** — ordering determined by `Config.plugin[]` array position
55: 
56: ## Quick Navigation
57: 
58: | Document | What You'll Find | When to Load |
59: |----------|-----------------|--------------|
60: | **[Expert: Hook Composition](references/expert/hook-composition.md)** | Multi-plugin ordering, output mutation, compaction flow, event types (32-40+), permission override | Writing hooks, debugging hook chains, compaction recovery |
61: | **[Expert: Tool Internals](references/expert/tool-internals.md)** | tool() zero-validation, Zod→JSON Schema failures, ToolResult shape, ToolState machine | Creating tools, debugging tool errors, schema design |
62: | **[Expert: Client-Server](references/expert/client-server.md)** | SSE event bus, session lifecycle, prompt_async, part mutations, v1 vs v2 differences | SDK integration, delegation, session recovery |
63: | [API: Plugin](references/api/plugin.md) | Hook signatures, PluginInput shape, auth/provider hooks | Looking up exact TypeScript signatures |
64: | [API: SDK](references/api/sdk.md) | Session CRUD, messaging, client setup | SDK client usage |
65: | [API: Types](references/api/types.md) | All exported TypeScript types | Type lookup |
66: | [Patterns: Dev](references/patterns/dev.md) | Tool creation, hook wiring, plugin assembly | Feature development |
67: | [Patterns: Testing](references/patterns/testing.md) | Mock SDK, tool testing, hook testing | Writing tests |
68: | [Patterns: Gatekeeping](references/patterns/gatekeeping.md) | Quality gates, type safety, hook correctness | Code review |
69: | **[API: ACP](references/api/acp.md)** | Agent Client Protocol — JSON-RPC over stdio for IDE integration | Building IDE plugins, Zed/VS Code integration |
70: | **[API: TUI v2](references/api/tui-v2.md)** | TUI keymap API, keybinding layers, command dispatch | TUI plugin development, custom keybindings |
71: | **[Pipeline Patterns](references/pipeline-patterns.md)** | How stack-opencode composes with other skills in development workflows | Architecture design, workflow composition |
72: | **[Stack Chains](references/stack-chains.md)** | Dependency ordering between stack-* skills | Skill loading order, dependency resolution |
73: | **[Department Bundles](references/department-bundles.md)** | Role-based skill loading bundles | Team configuration, agent setup |
74: 
75: ## Decision Trees
76: 
77: ### "Should I use a tool or a hook?"
78: 
79: ```
80: Need the LLM to call it?           → TOOL (tool.execute flow)
81: Need to modify LLM behavior?       → HOOK (chat.params, tool.definition)
82: Need to observe events?            → EVENT hook (fire-and-forget)
83: Need to inject env vars?           → SHELL.ENV hook (not tool args!)
84: Need to auto-approve permissions?  → PERMISSION.ASK hook
85: Need to recover from compaction?   → SESSION.COMPACTING + AUTOCONTINUE hooks
86: ```
87: 
88: ### "Which Zod types work in tool schemas?"
89: 
90: ```
91: z.string/number/boolean/array/object/enum/optional → ✅ Reliable
92: z.record/tuple/union/default                        → ⚠️ Partial conversion
93: z.transform/refine/lazy/any                         → ❌ Silent failure
94: ```
95: 
96: ### "Which SDK version should I use?"
97: 
98: ```
99: Need workspace isolation or session restore? → v2 (createOpencodeClient v2)
100: Just basic session/message CRUD?             → v1 works fine
101: Writing a plugin (hooks/tools)?              → Plugin API is version-independent
102: ```
103: 
104: ## Ecosystem Routing
105: 
106: | When working on... | Also load... | Because... |
107: |---------------------|--------------|------------|
108: | Tool schemas with Zod | `stack-zod` | Zod→JSON Schema conversion has silent failures |
109: | Testing plugin behavior | `stack-vitest` | SDK mocking patterns, ToolContext mock setup |
110: | Next.js sidecar dashboard | `stack-nextjs` | Sidecar reads SSE events, consumes SDK client |
111: | Quality gate for plugin code | `gate-lifecycle-integration` | 9-surface mutation authority table, CQRS boundaries |
112: | Evidence for tool outputs | `gate-evidence-truth` | L1-L5 hierarchy, ToolStateCompleted as evidence |
113: | Spec compliance for features | `gate-spec-compliance` | Traceability between specs and tool/hook implementations |
114: 
115: ## Source Files (for grep in bundled/)
116: 
117: | Package | Key Files |
118: |---------|-----------|
119: | `@opencode-ai/plugin` | `index.ts` (types), `tool.ts` (helper), `shell.ts` (BunShell), `tui.ts` (TUI API) |
120: | `@opencode-ai/sdk` | `index.ts`, `client.ts`, `server.ts`, `gen/sdk.gen.ts`, `gen/types.gen.ts` |
121: 
122: ## Updating
123: 
124: Run `scripts/update.sh` to re-download source when OpenCode version changes.
125: 
126: ## Self-Correction
127: 
128: > Reference documents provide facts, not workflows. When facts conflict with reality, this section guides resolution.
129: 
130: ### When Information Is Outdated
131: 1. **Check the version in frontmatter** (currently: 1.14.44) — OpenCode SDK updates frequently; verify against installed version.
132: 2. **Run `scripts/update.sh`** to re-download source from `anomalyco/opencode` and refresh bundled references.
133: 3. **Verify against live source:** The bundled 22,771-line source pack is the ground truth. If runtime behavior differs from gotchas, the source has changed.
134: 4. **Key gotchas are version-sensitive:** The `context.ask()` returning Effect (not Promise) and `tool()` being an identity function are behavioral claims — verify against source if the version changes.
135: 
136: ### When Unsure About API Accuracy
137: 1. **Grep the bundled source:** `references/expert/tool-internals.md` for tool behavior, `references/expert/hook-composition.md` for hook ordering.
138: 2. **Read actual source:** The source files at `anomalyco/opencode` on GitHub are canonical. Check the tag matching the installed version.
139: 3. **The Zod reliability matrix (lines 78-84) is source-verified at v1.14.44:** If `z.transform()` behavior changes in a newer SDK, the matrix must be re-verified.
140: 
141: ### When the User Contradicts Reference Content
142: 1. **Cite the source:** "This stack-opencode reference (v1.14.44) documents behavior extracted from source. Your installed version may differ — check `@opencode-ai/plugin` version in `node_modules`."
143: 2. **Offer verification:** Run `npm list @opencode-ai/plugin @opencode-ai/sdk` to compare installed versions.
144: 3. **Do not override:** Source-extracted behavioral claims are version-specific. User's runtime takes precedence.
145: 
146: ### When an Edge Case Is Encountered
147: 1. **Document the gap:** Missing coverage includes hook composition with 3+ plugins, ToolContext timeout behavior, SSE event ordering guarantees, session state machine edge cases (retry→idle transition), and permission inheritance across nested delegations.
148: 2. **Search bundled references** — expert docs (`references/expert/`) cover deep internals.
149: 3. **Check GitHub issues:** `anomalyco/opencode` repo for known SDK bugs.
150: 4. **Escalate to skill maintainer:** File an update request with SDK version, hook/tool chain, and observed behavior.

(End of file - total 150 lines)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/AGENTS.md
# AGENTS.md — Hivefiver Meta-Builder Module

## Project Overview

Hivefiver is the **hm-meta-builder module** of the HiveMind Framework. It creates, audits, stacks, and extends OpenCode soft concepts: skills, agents, commands, tools, workflows, and references.

**This is NOT a project-builder.** That's Hiveminder's domain. Hivefiver builds the building blocks.

### The Three Entities

| Entity | Role | Boundary |
|--------|------|----------|
| **OpenCode** | Agent coding harness CLI — the platform/OS | Native capabilities: agents, commands, skills, tools, plugins |
| **HiveMind** | Parent framework wrapping OpenCode | Houses both Hivefiver + Hiveminder |
| **Hivefiver** | Meta-builder module | Creates/audits/stacks OpenCode concepts. Tests in labs, ships as TS runtime |
| **Hiveminder** | Project-builder agent lineage | Handles "let's build a NextJS app" — DO NOT TOUCH |

### What Hivefiver Delivers

- **Agent definitions** (`.md` files with YAML frontmatter, permissions, execution flows)
- **Command definitions** (thin shells referencing workflow files)
- **Skill packages** (SKILL.md + references/ + scripts/ + templates/)
- **Workflow files** (procedural logic executed by agents)
- **Reference files** (platform docs, patterns, best practices)

### Testing → Shipping Pipeline

```
.hivefiver-meta-builder/**-lab/  ← Source of truth (edit here)
        ↓ symlinks
.opencode/{agents,commands,skills}/  ← Live testing (OpenCode reads here)
        ↓ when validated
TS runtime builder (opencode-harness npm package)  ← Final shipping format
```

---

## Lab Structure

```
.hivefiver-meta-builder/
├── agents-lab/active/refactoring/     ← Agent definitions (source of truth)
├── commands-lab/active/refactoring/   ← Command definitions (source of truth)
├── skills-lab/active/refactoring/     ← Skill packages (source of truth)
├── workflows-lab/active/refactoring/  ← Workflow files (procedural logic)
├── references-lab/active/refactoring/ ← Reference docs (platform patterns)
├── plans/                             ← Implementation plans
└── orchestrator/                      ← Coordinator definitions
```

### Lab → `.opencode/` Sync

The `.opencode/` directories (`agents/`, `commands/`, `skills/`) are **standalone directories** — they contain real files, not symlinks. Changes in labs must be copied/synced to `.opencode/` for live testing.

| `.opencode/` path | Source in lab |
|---|---|
| `.opencode/agents/` | `.hivefiver-meta-builder/agents-lab/active/refactoring/` |
| `.opencode/commands/` | `.hivefiver-meta-builder/commands-lab/active/refactoring/` |
| `.opencode/skills/` | `.hivefiver-meta-builder/skills-lab/active/refactoring/` |

**Edit in labs → sync to `.opencode/` for live testing.**

---

## Agent Team

### Tier 1: Primary Agents (user interacts directly via Tab key)

| Agent | File | Role |
|-------|------|------|
| **hf-l0-orchestrator** | `.opencode/agents/hf-l0-orchestrator.md` | Meta-builder routing brain. Receives requests → classifies intent → delegates to specialists → two-stage review → reports. |
| **hf-l1-coordinator** | `.opencode/agents/hf-l1-coordinator.md` | Interactive orchestrator. Task management, delegation, parallel execution. |
| **hm-l2-conductor** | `.opencode/agents/hm-l2-conductor.md` | Command execution workhorse. Intent classification, wisdom system, delegate-task routing. |

### Tier 2: Specialist Subagents (dispatched by primaries)

| Agent | File | Role |
|-------|------|------|
| **hf-l2-skill-builder** | `.opencode/agents/hf-l2-skill-builder.md` | Creates/audits/repairs skills. Enforces agentskills.io principles. |
| **hf-l2-agent-builder** | `.opencode/agents/hf-l2-agent-builder.md` | Creates/audits/repairs agent definitions. Explicit permissions, execution flows. |
| **hf-l2-command-builder** | `.opencode/agents/hf-l2-command-builder.md` | Creates/audits/repairs commands. Non-interactive shell safety, $ARGUMENTS, !bash. |
| **hm-l2-executor** | `.opencode/agents/hm-l2-executor.md` | Atomic code implementation. Reads before writes, follows patterns. |
| **hm-l2-critic** | `.opencode/agents/hm-l2-critic.md` | Quality verification. Ruthless review, correctness validation. |
| **hm-l2-researcher** | `.opencode/agents/hm-l2-researcher.md` | Deep investigation. Evidence collection, pattern discovery. |

### Tier 3: Fast Subagents

| Agent | File | Role |
|-------|------|------|
| **explore** | ⚠️ MISSING from filesystem | Fast codebase scan. Lightweight, high-throughput. **Note:** No `explore.md` exists in `.opencode/agents/`. May need to be created or this row removed. |

### Tier 4: Prompt-Enhance Lane Agents

| Agent | File | Role |
|-------|------|------|
| **hm-l2-prompt-skimmer** | `.opencode/agents/hm-l2-prompt-skimmer.md` | Phase 0 skim for prompt-enhancement routing. |
| **hm-l2-prompt-analyzer** | `.opencode/agents/hm-l2-prompt-analyzer.md` | Deep text-quality lane for prompts. |
| **hm-l2-context-mapper** | `.opencode/agents/hm-l2-context-mapper.md` | Grounds prompt references in repo reality. |
| **hm-l2-risk-assessor** | `.opencode/agents/hm-l2-risk-assessor.md` | Flags destructive, security, and scope risks. |
| **hm-l2-context-purifier** | `.opencode/agents/hm-l2-context-purifier.md` | Distills noisy prompts without changing intent. |
| **hm-l2-prompt-repackager** | `.opencode/agents/hm-l2-prompt-repackager.md` | Produces the final YAML+XML enhanced prompt payload. |

---

## Command Set

### Hivefiver Commands (hf-*)

| Command | Agent | Purpose |
|---------|-------|---------|
| `/hf-create` | hf-l0-orchestrator | Create skill/agent/command/tool via specialist routing |
| `/hf-audit` | hf-l0-orchestrator | Audit meta-concepts for quality, overlaps, dead refs |
| `/hf-stack` | hf-l0-orchestrator | Stack 2-3 skills with loading order validation |
| `/hf-prompt-enhance` | hf-l0-orchestrator | Enhance, audit, or repack prompts via skim → bridge → lanes → assembly |

### Existing Commands (updated)

| Command | Agent | Status |
|---------|-------|--------|
| `/start-work` | hm-l2-conductor | Updated with $ARGUMENTS, bash injection, skill loading |
| `/plan` | hm-l1-coordinator | Updated with $ARGUMENTS, bash injection |
| `/ultrawork` | hm-l2-conductor | Updated with bash injection, skill loading |
| `/deep-init` | hm-l1-coordinator | Keep as-is |
| `/harness-doctor` | hm-l1-coordinator | Keep as-is |

---

## Delegation Protocol

### The Dispatch Envelope

```
Task tool (<specialist>):
  description: "Task N: [name]"
  prompt: |
    You are [role]. Your task: [FULL TASK TEXT]

    ## Context
    [Scene-setting — where this fits, why it matters]

    ## Scope
    - Include: [specific files/paths]
    - Exclude: [what NOT to touch]

    ## Output Format
    - Status: DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED
    - [Specific output requirements]
```

**NEVER pass session history to subagents. Construct exact context.**

### Status Protocol

| Status | Meaning | Action |
|--------|---------|--------|
| DONE | Complete, verified | Proceed |
| DONE_WITH_CONCERNS | Complete but doubts | Read concerns → address if correctness, note if observation |
| NEEDS_CONTEXT | Knowledge gap | Provide context → re-dispatch |
| BLOCKED | Cannot proceed | Assess: context? model? size? plan? → escalate if needed |

### Two-Stage Review

1. **Stage 1: Spec Compliance** — Does output match requirements? Nothing extra? Nothing missing?
2. **Stage 2: Code Quality** — Well-built? Clean? Following patterns?

**Stage 1 MUST pass before Stage 2.**

---

## Iron Laws

1. **NO DIRECT CREATION WITHOUT DELEGATION** — Route to specialists. Never create skills/agents/commands directly.
2. **NO STACK WITHOUT A REASON** — Max 3 skills per stack. Explain why each is needed.
3. **NO SUBAGENT WITHOUT CONSTRUCTED CONTEXT** — Full task text, scene-setting, scope. Never session history.
4. **NO SKILL WITHOUT TRIGGER PHRASES** — Description is the only thing agents see. Must contain specific user phrases.
5. **EVERY COMMAND SURVIVES CI=true** — No TTY-dependent operations. Non-interactive shell safety.

---

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **The Executor** — creating directly | Writing SKILL.md or agent files yourself | STOP. Delegate to specialist. |
| **The Hoarder** — loading 4+ skills | Context blown, skills ignored | Max 3. Explain why each is needed. |
| **The Improviser** — ignoring routing table | Routed wrong, task failed | Trust the table. Fix the table if wrong. |
| **The Context Polluter** — passing session history | Subagent prompt includes "earlier in conversation" | Construct fresh context: task text + scene-setting + scope |
| **The File Referrer** — "read the plan file" | Subagent told to read file path | Paste full task text into the prompt. Always. |
| **The Hallucinator** — inventing architecture | Making assumptions without evidence | Ground in lineage. Read session exports. Verify with grep. |

---

## Worktree Strategy

| Worktree | Branch | Purpose |
|----------|--------|---------|
| `harness-experiment` | `harness-experiment` | Main development worktree. Labs + symlinks live here. |
| `hivefiver-v2` | `feature/hivefiver-agent-command-v2` | Agent+command package development. |
| `hivefiver-packs` | `feature/hivefiver-agent-command-packs` | Alternative package worktree. |

**Each worktree can have its own lab state.** Symlinks point to local labs within that worktree.

---

## Testing Workflow

1. **Edit in labs** — `.hivefiver-meta-builder/**-lab/active/refactoring/`
2. **Test via sync** — `.opencode/` directories contain live copies
3. **Validate** — Run OpenCode commands, verify agents load, check skill triggers
4. **Commit** — Changes in labs are committed to git
5. **Ship** — When validated, pack into TS runtime builder

---

## Session Recovery

If interrupted:
1. `git worktree list` — find your worktrees
2. `cd` to the right worktree
3. `git status` — see what was in progress
4. `git log --oneline -5` — see recent commits
5. Read `.hivefiver-meta-builder/plans/` for current plans
6. Resume from where you left off

</system-reminder>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/skills-lab/active/refactoring/stack-l3-opencode/metadata.json"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/skills-lab/active/refactoring/stack-l3-opencode/metadata.json</path>
<type>file</type>
<content>
1: {
2:   "stack_name": "opencode",
3:   "packages": ["@opencode-ai/sdk", "@opencode-ai/plugin"],
4:   "version": "1.14.44",
5:   "source_repo": "https://github.com/anomalyco/opencode",
6:   "source_paths": ["packages/sdk/js/src/", "packages/plugin/src/"],
7:   "ingest_date": "2026-05-10",
8:   "ingest_tools": ["deepwiki", "context7", "github-api", "repomix"],
9:   "last_validated": "2026-05-10",
10:   "update_command": "scripts/update.sh",
11:   "tags": ["sdk", "plugin", "typescript", "session", "tools", "hooks", "delegation", "zod", "effect"],
12:   "repomix_status": "SUCCESS — re-ingested 2026-05-10 from anomalyco/opencode (55 files, 127K tokens)",
13:   "source_files": {
14:     "plugin": {
15:       "index.ts": { "size_bytes": 8785, "sha": "71a3278cbb074604270945fe061f18ffa7faa05a" },
16:       "tool.ts": { "size_bytes": 1080, "sha": "3105bf534bef6065b0f9b775b5c724d8e6019675" },
17:       "shell.ts": { "size_bytes": 3055, "sha": "56733fdb3c27ccea2d108a43674d6fa6fa569e0a" },
18:       "tui.ts": { "size_bytes": 12359, "sha": "1c57a71ab31557e16a0c62d38238d16266242e2a" },
19:       "example.ts": { "size_bytes": 397, "sha": "9d7e178a96a18a9a23ed16c87967705e15007bc5" },
20:       "example-workspace.ts": { "size_bytes": 849, "sha": "9253284507ffb01ccb6249a8b93ba6c0bd40340d" }
21:     },
22:     "sdk": {
23:       "index.ts": { "size_bytes": 453, "sha": "d044f5ad66e49daa401a74a44a19fc46dbd9d2c3" },
24:       "client.ts": { "size_bytes": 1581, "sha": "05f46382523c468816824dede4872c204891625b" },
25:       "server.ts": { "size_bytes": 3128, "sha": "2d1ab29fc92880f2f5a35375f26012b3725a8dcd" },
26:       "process.ts": { "size_bytes": 1048, "sha": "3111b424aa18e41623b6b13e9f9b3e1dbe7b265c" },
27:       "gen/sdk.gen.ts": { "size_bytes": 34677, "sha": "5e3e67e1c03080d0e31c8ca362a8e9293ffe1324" },
28:       "gen/types.gen.ts": { "size_bytes": 68342, "sha": "8eefe5bfe985f30de4f3fc41020a56f6ab11ac00" }
29:     }
30:   }
31: }

(End of file - total 31 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/skills-lab/active/refactoring/stack-l3-opencode/TOC.md"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/skills-lab/active/refactoring/stack-l3-opencode/TOC.md</path>
<type>file</type>
<content>
1: # Table of Contents — OpenCode SDK + Plugin Stack
2: 
3: > Version 1.14.44 | Source: [anomalyco/opencode](https://github.com/anomalyco/opencode)
4: 
5: ## Package Structure
6: 
7: ```
8: anomalyco/opencode/
9: ├── packages/
10: │   ├── plugin/              @opencode-ai/plugin
11: │   │   ├── src/
12: │   │   │   ├── index.ts     ← All types: Plugin, Hooks, AuthHook, ProviderHook, PluginInput
13: │   │   │   ├── tool.ts      ← tool() helper, ToolContext, ToolResult, ToolDefinition
14: │   │   │   ├── shell.ts     ← BunShell, BunShellPromise, BunShellOutput types
15: │   │   │   ├── tui.ts       ← TUI plugin API: TuiPluginApi, TuiApp, TuiCommand, etc.
16: │   │   │   ├── example.ts   ← Minimal example plugin
17: │   │   │   └── example-workspace.ts ← Workspace adaptor example
18: │   │   └── package.json     ← v1.14.44, exports: ".", "./tool", "./tui"
19: │   └── sdk/
20: │       └── js/              @opencode-ai/sdk
21: │           ├── src/
22: │           │   ├── index.ts       ← createOpencode() (client+server factory)
23: │           │   ├── client.ts      ← createOpencodeClient()
24: │           │   ├── server.ts      ← createOpencodeServer(), createOpencodeTui()
25: │           │   ├── process.ts     ← Process management utilities
26: │           │   ├── gen/           ← Auto-generated SDK (v1)
27: │           │   │   ├── sdk.gen.ts       ← OpencodeClient class (34.7KB)
28: │           │   │   ├── types.gen.ts     ← All generated types (68.3KB)
29: │           │   │   ├── client.gen.ts    ← createClient() factory
30: │           │   │   ├── client/          ← Client internals
31: │           │   │   └── core/            ← Core HTTP utilities
32: │           │   └── v2/            ← SDK v2 (recommended)
33: │           │       ├── index.ts
34: │           │       ├── client.ts
35: │           │       ├── server.ts
36: │           │       ├── data.ts
37: │           │       └── gen/           ← Generated v2 SDK
38: │           └── package.json     ← v1.14.44, exports: ".", "./client", "./server", "./v2", "./v2/client"
39: ```
40: 
41: ## Expert Knowledge (BEYOND-DOCS)
42: 
43: These files contain knowledge extracted from source code that is NOT in official documentation.
44: 
45: | File | Topics | Key Insights |
46: |------|--------|--------------|
47: | [Expert: Hook Composition](references/expert/hook-composition.md) | Multi-plugin ordering, output mutation, event types (32-40+), compaction flow, permission override, env injection | No priority system; last-write-wins; event hook receives ALL events; compaction has overflow flag |
48: | [Expert: Tool Internals](references/expert/tool-internals.md) | tool() zero-validation, Zod→JSON Schema failures, ToolResult shape, context.ask() returns Effect, ToolState machine, abort cooperative | tool() is identity function; z.transform/refine/lazy silently break; ask() is NOT awaitable |
49: | [Expert: Client-Server](references/expert/client-server.md) | SSE event bus, session lifecycle, prompt_async, part mutations, v1 vs v2 differences, HTTP endpoints | 3 session states (no completed); SSE for events; v2 adds workspace isolation |
50: 
51: ## API Reference Jump Links
52: 
53: ### Plugin API (`@opencode-ai/plugin`)
54: 
55: | Symbol | Type | File | Section |
56: |--------|------|------|---------|
57: | `Plugin` | Type | `index.ts` | [Plugin Type](references/api/plugin.md#plugin-type) |
58: | `PluginInput` | Type | `index.ts` | [PluginInput](references/api/plugin.md#plugininput) |
59: | `PluginOptions` | Type | `index.ts` | [PluginOptions](references/api/plugin.md#pluginoptions) |
60: | `PluginModule` | Type | `index.ts` | [PluginModule](references/api/plugin.md#pluginmodule) |
61: | `Config` | Type | `index.ts` | [Config](references/api/plugin.md#config) |
62: | `Hooks` | Interface | `index.ts` | [Hooks Interface](references/api/plugin.md#hooks-interface) |
63: | `AuthHook` | Type | `index.ts` | [AuthHook](references/api/plugin.md#authhook) |
64: | `AuthOAuthResult` | Type | `index.ts` | [AuthOAuthResult](references/api/plugin.md#authoauthresult) |
65: | `AuthOAuthResult` | Type | `index.ts` | [AuthOAuthResult](references/api/plugin.md#authoauthresult) |
66: | `ProviderHook` | Type | `index.ts` | [ProviderHook](references/api/plugin.md#providerhook) |
67: | `ProviderHookContext` | Type | `index.ts` | [ProviderHookContext](references/api/plugin.md#providerhookcontext) |
68: | `ProviderContext` | Type | `index.ts` | [ProviderContext](references/api/plugin.md#providercontext) |
69: | `WorkspaceInfo` | Type | `index.ts` | [Workspace Types](references/api/plugin.md#workspace-types) |
70: | `WorkspaceTarget` | Type | `index.ts` | [Workspace Types](references/api/plugin.md#workspace-types) |
71: | `WorkspaceAdapter` | Type | `index.ts` | [Workspace Types](references/api/plugin.md#workspace-types) |
72: | `tool()` | Function | `tool.ts` | [tool() Helper](references/api/plugin.md#tool-helper) |
73: | `tool.schema` | Property | `tool.ts` | [tool.schema](references/api/plugin.md#toolschema) |
74: | `ToolContext` | Type | `tool.ts` | [ToolContext](references/api/plugin.md#toolcontext) |
75: | `ToolResult` | Type | `tool.ts` | [ToolResult](references/api/plugin.md#toolresult) |
76: | `ToolDefinition` | Type | `tool.ts` | [ToolDefinition](references/api/plugin.md#tooldefinition) |
77: | `BunShell` | Interface | `shell.ts` | [BunShell](references/api/plugin.md#bunshell) |
78: | `BunShellPromise` | Interface | `shell.ts` | [BunShellPromise](references/api/plugin.md#bunshellpromise) |
79: | `BunShellOutput` | Interface | `shell.ts` | [BunShellOutput](references/api/plugin.md#bunshelloutput) |
80: 
81: ### Hook Names (in `Hooks` interface)
82: 
83: | Hook Name | Purpose | Input Shape | Output Shape |
84: |-----------|---------|-------------|--------------|
85: | `event` | System event subscriber | `{ event: Event }` | void |
86: | `config` | Configuration hook | `Config` | void |
87: | `tool` | Tool registration | — | `{ [key: string]: ToolDefinition }` |
88: | `auth` | Authentication provider | — | `AuthHook` |
89: | `provider` | Provider customization | — | `ProviderHook` |
90: | `chat.message` | New message received | `{ sessionID, agent?, model?, messageID?, variant? }` | `{ message, parts }` |
91: | `chat.params` | Modify LLM parameters | `{ sessionID, agent, model, provider, message }` | `{ temperature, topP, topK, maxOutputTokens, options }` |
92: | `chat.headers` | Modify request headers | `{ sessionID, agent, model, provider, message }` | `{ headers }` |
93: | `permission.ask` | Permission decision | `Permission` | `{ status: "ask" \| "ask" \| "allow" }` |
94: | `command.execute.before` | Pre-command processing | `{ command, sessionID, arguments }` | `{ parts }` |
95: | `tool.execute.before` | Pre-tool execution | `{ tool, sessionID, callID }` | `{ args }` |
96: | `tool.execute.after` | Post-tool execution | `{ tool, sessionID, callID, args }` | `{ title, output, metadata }` |
97: | `tool.definition` | Modify tool definitions | `{ toolID }` | `{ description, parameters }` |
98: | `shell.env` | Inject env vars | `{ cwd, sessionID?, callID? }` | `{ env }` |
99: | `experimental.chat.messages.transform` | Transform messages | `{}` | `{ messages: {info, parts}[] }` |
100: | `experimental.chat.system.transform` | Transform system prompt | `{ sessionID?, model }` | `{ system: string[] }` |
101: | `experimental.session.compacting` | Session compaction | `{ sessionID }` | `{ context: string[], prompt? }` |
102: | `experimental.compaction.autocontinue` | Auto-continue control | `{ sessionID, agent, model, provider, message, overflow }` | `{ enabled }` |
103: | `experimental.text.complete` | Text completion | `{ sessionID, messageID, partID }` | `{ text }` |
104: 
105: ### SDK API (`@opencode-ai/sdk`)
106: 
107: | Symbol | Type | File | Section |
108: |--------|------|------|---------|
109: | `createOpencode()` | Function | `index.ts` | [createOpencode](references/api/sdk.md#createopencode) |
110: | `createOpencodeClient()` | Function | `client.ts` | [createOpencodeClient](references/api/sdk.md#createopencodeclient) |
111: | `createOpencodeServer()` | Function | `server.ts` | [createOpencodeServer](references/api/sdk.md#createopencodeserver) |
112: | `createOpencodeTui()` | Function | `server.ts` | [createOpencodeTui](references/api/sdk.md#createopencodetui) |
113: | `OpencodeClient` | Class | `gen/sdk.gen.ts` | [OpencodeClient](references/api/sdk.md#opencodeclient) |
114: | `client.session.create()` | Method | `gen/sdk.gen.ts` | [Session Create](references/api/sdk.md#sessioncreate) |
115: | `client.session.list()` | Method | `gen/sdk.gen.ts` | [Session List](references/api/sdk.md#sessionlist) |
116: | `client.session.get()` | Method | `gen/sdk.gen.ts` | [Session Get](references/api/sdk.md#sessionget) |
117: | `client.session.update()` | Method | `gen/sdk.gen.ts` | [Session Update](references/api/sdk.md#sessionupdate) |
118: | `client.session.delete()` | Method | `gen/sdk.gen.ts` | [Session Delete](references/api/sdk.md#sessiondelete) |
119: | `client.session.prompt()` | Method | `gen/sdk.gen.ts` | [Session Prompt](references/api/sdk.md#sessionprompt) |
120: | `client.session.share()` | Method | `gen/sdk.gen.ts` | [Session Share](references/api/sdk.md#sessionshare) |
121: | `client.session.abort()` | Method | `gen/sdk.gen.ts` | [Session Abort](references/api/sdk.md#sessionabort) |

(End of file - total 121 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/skills-lab/active/refactoring/stack-l3-opencode/scripts/update.sh"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/skills-lab/active/refactoring/stack-l3-opencode/scripts/update.sh</path>
<type>file</type>
<content>
1: #!/usr/bin/env bash
2: # update.sh — Re-download OpenCode source and regenerate skill files
3: # Usage: bash scripts/update.sh [version]
4: set -euo pipefail
5: 
6: SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
7: SKILL_DIR="$(dirname "$SCRIPT_DIR")"
8: TMP_DIR=$(mktemp -d)
9: 
10: VERSION="${1:-latest}"
11: echo "[stack-opencode] Updating to version: $VERSION"
12: 
13: # ── Download source via GitHub API ──
14: echo "[stack-opencode] Downloading plugin source..."
15: mkdir -p "$TMP_DIR/plugin"
16: curl -sL "https://raw.githubusercontent.com/sst/opencode/dev/packages/plugin/src/index.ts" -o "$TMP_DIR/plugin/index.ts"
17: curl -sL "https://raw.githubusercontent.com/sst/opencode/dev/packages/plugin/src/tool.ts" -o "$TMP_DIR/plugin/tool.ts"
18: curl -sL "https://raw.githubusercontent.com/sst/opencode/dev/packages/plugin/src/shell.ts" -o "$TMP_DIR/plugin/shell.ts"
19: curl -sL "https://raw.githubusercontent.com/sst/opencode/dev/packages/plugin/src/tui.ts" -o "$TMP_DIR/plugin/tui.ts"
20: curl -sL "https://raw.githubusercontent.com/sst/opencode/dev/packages/plugin/src/example.ts" -o "$TMP_DIR/plugin/example.ts"
21: 
22: echo "[stack-opencode] Downloading SDK source..."
23: mkdir -p "$TMP_DIR/sdk"
24: curl -sL "https://raw.githubusercontent.com/sst/opencode/dev/packages/sdk/js/src/index.ts" -o "$TMP_DIR/sdk/index.ts"
25: curl -sL "https://raw.githubusercontent.com/sst/opencode/dev/packages/sdk/js/src/client.ts" -o "$TMP_DIR/sdk/client.ts"
26: curl -sL "https://raw.githubusercontent.com/sst/opencode/dev/packages/sdk/js/src/server.ts" -o "$TMP_DIR/sdk/server.ts"
27: 
28: echo "[stack-opencode] Downloading package.json files..."
29: curl -sL "https://raw.githubusercontent.com/sst/opencode/dev/packages/plugin/package.json" -o "$TMP_DIR/plugin-package.json"
30: curl -sL "https://raw.githubusercontent.com/sst/opencode/dev/packages/sdk/js/package.json" -o "$TMP_DIR/sdk-package.json"
31: 
32: # ── Extract version ──
33: PLUGIN_VERSION=$(node -e "console.log(require('$TMP_DIR/plugin-package.json').version)")
34: SDK_VERSION=$(node -e "console.log(require('$TMP_DIR/sdk-package.json').version)")
35: 
36: echo "[stack-opencode] Plugin version: $PLUGIN_VERSION"
37: echo "[stack-opencode] SDK version: $SDK_VERSION"
38: 
39: # ── Update metadata.json ──
40: node -e "
41: const fs = require('fs');
42: const meta = JSON.parse(fs.readFileSync('$SKILL_DIR/metadata.json', 'utf8'));
43: meta.version = '$PLUGIN_VERSION';
44: meta.ingest_date = new Date().toISOString().split('T')[0];
45: meta.last_validated = new Date().toISOString().split('T')[0];
46: fs.writeFileSync('$SKILL_DIR/metadata.json', JSON.stringify(meta, null, 2) + '\n');
47: "
48: 
49: echo "[stack-opencode] Updated metadata.json"
50: 
51: # ── Cleanup ──
52: rm -rf "$TMP_DIR"
53: 
54: echo "[stack-opencode] ✅ Update complete. Version: $PLUGIN_VERSION"
55: echo "[stack-opencode] NOTE: Reference files in references/ should be manually reviewed for API changes."

(End of file - total 55 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/skills-lab/active/refactoring/stack-l3-opencode/references/architecture.md"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/skills-lab/active/refactoring/stack-l3-opencode/references/architecture.md</path>
<type>file</type>
<content>
1: # Architecture — OpenCode SDK + Plugin
2: 
3: > Version 1.14.44 | Source: [anomalyco/opencode](https://github.com/anomalyco/opencode)
4: 
5: ## System Overview
6: 
7: ```text
8: ┌─────────────────────────────────────────────────────────────────┐
9: │                        Plugin System                            │
10: │  `packages/plugin/src/index.ts`                                 │
11: │                                                                  │
12: │  Plugin = async (PluginInput) => Promise<Hooks>                 │
13: │                                                                  │
14: │  Hooks define: tools, hooks (events), auth, providers           │
15: ├──────────┬──────────┬──────────┬──────────┬────────────────────┤
16: │  tool()  │ Hooks    │ AuthHook │ Provider │  BunShell ($)      │
17: │ tool.ts  │ index.ts │ index.ts │ Hook     │  shell.ts          │
18: │          │          │          │ index.ts │                    │
19: └──────────┴──────────┴──────────┴──────────┴────────────────────┘
20:          │                        │
21:          ▼                        ▼
22: ┌─────────────────────────────────────────────────────────────────┐
23: │                         SDK Layer                                │
24: │  `packages/sdk/js/src/`                                         │
25: │                                                                  │
26: │  createOpencodeClient() — HTTP client to OpenCode server         │
27: │  createOpencodeServer() — Spawn standalone OpenCode server       │
28: │  createOpencode()      — Combined client+server factory          │
29: ├───────────────┬─────────────────┬───────────────────────────────┤
30: │  client.ts    │  server.ts      │  gen/ (auto-generated)        │
31: │  Client init  │  Server spawn   │  OpencodeClient class         │
32: │  + intercept  │  + TUI spawn    │  + types.gen.ts (68KB)        │
33: └───────────────┴─────────────────┴───────────────────────────────┘
34:          │
35:          ▼
36: ┌─────────────────────────────────────────────────────────────────┐
37: │                    OpenCode Runtime                              │
38: │  (Go binary — not part of this SDK)                             │
39: │                                                                  │
40: │  HTTP API on localhost:4096 (default)                           │
41: │  OpenAPI spec: packages/sdk/openapi.json                        │
42: │  Plugin loading via Node.js worker                              │
43: └─────────────────────────────────────────────────────────────────┘
44: ```
45: 
46: ## Two Contexts
47: 
48: | Context | Entry Point | Pattern | State |
49: |---------|-------------|---------|-------|
50: | **Server-side Plugin** | `Plugin` function | Effect-based async | Access to tools, hooks, auth, providers, SDK client, BunShell |
51: | **TUI Plugin** | `TuiPluginApi` | Solid.js + imperative | Access to terminal UI slots, routes, keybinds, theme, state |
52: 
53: Server-side plugins run in Node.js worker. TUI plugins run in the terminal renderer process. They NEVER share memory.
54: 
55: ## Module Dependency Graph
56: 
57: ```text
58: packages/plugin/src/
59: ├── index.ts ──imports──→ @opencode-ai/sdk (types only)
60: │                  ──imports──→ ./tool.js (ToolDefinition type)
61: │                  ──imports──→ ./shell.js (BunShell type)
62: ├── tool.ts ──imports──→ zod, effect
63: │       └── exports: tool(), tool.schema, ToolDefinition type
64: ├── shell.ts ──imports──→ (none — pure types)
65: ├── tui.ts  ──imports──→ @opentui/core, @opentui/solid (optional peers)
66: │       └── 300+ lines of TUI type definitions
67: └── example.ts ──imports──→ ./index.js, ./tool.js
68: 
69: packages/sdk/js/src/
70: ├── index.ts ──imports──→ ./client.js, ./server.js
71: ├── client.ts ──imports──→ ./gen/types.gen.js, ./gen/client/client.gen.js, ./gen/sdk.gen.js
72: │       └── Request interceptor (header→query rewrite), response interceptor (text/html guard)
73: ├── server.ts ──imports──→ cross-spawn, ./gen/types.gen.js, ./process.js
74: │       └── Server spawn, stdout URL detection, OPENCODE_CONFIG_CONTENT injection
75: ├── process.ts ──imports──→ (Node.js builtins)
76: │       └── stop() + bindAbort() — cross-platform process management
77: ├── v2/
78: │   ├── client.ts ── Same pattern + workspace header injection
79: │   ├── server.ts ── Identical to V1 server
80: │   └── data.ts ── data.message.user() helper with stub IDs
81: └── gen/ ──auto-generated──→ from openapi.json via @hey-api/openapi-ts
82:     ├── sdk.gen.ts ──the OpencodeClient class (~auto-generated)
83:     ├── types.gen.ts ──all generated types (68KB)
84:     └── client/client.gen.ts ──HTTP client base
85: ```
86: 
87: ## Key Design Decisions
88: 
89: 1. **Plugins are functions, not classes.** `async (input) => Hooks`. No `definePlugin()` wrapper.
90: 2. **Hooks use dot-notation names.** `"tool.execute.before"`, NOT `PreToolUse`.
91: 3. **SDK is auto-generated.** From OpenAPI spec via `@hey-api/openapi-ts`. `gen/` is read-only.
92: 4. **Two SDK versions coexist.** v1 at `gen/`, v2 at `v2/gen/`. v2 adds workspace scoping.
93: 5. **Plugin receives `client` in input.** Fully initialized `OpencodeClient`.
94: 6. **`tool.schema` exposes Zod.** Full library re-export. Don't import zod separately.
95: 7. **Shell access via `$`.** `BunShell` tagged template for subprocess execution.
96: 8. **Effect is used internally.** `ToolContext.ask()` returns `Effect.Effect<void>`, not Promise. Use `Effect.runPromise()`.
97: 
98: ## Package Exports
99: 
100: ### `@opencode-ai/plugin`
101: 
102: ```json
103: {
104:   ".": "./src/index.ts",
105:   "./tool": "./src/tool.ts",
106:   "./tui": "./src/tui.ts"
107: }
108: ```
109: 
110: ### `@opencode-ai/sdk`
111: 
112: ```json
113: {
114:   ".": "./src/index.ts",
115:   "./client": "./src/client.ts",
116:   "./server": "./src/server.ts",
117:   "./v2": "./src/v2/index.ts",
118:   "./v2/client": "./src/v2/client.ts",
119:   "./v2/gen/client": "./src/v2/gen/client/index.ts",
120:   "./v2/server": "./src/v2/server.ts"
121: }
122: ```
123: 
124: ## Peer Dependencies
125: 
126: | Package | Peer | Version | Required |
127: |---------|------|---------|----------|
128: | `@opencode-ai/plugin` | `@opentui/core` | >=0.1.105 | Optional (TUI only) |
129: | `@opencode-ai/plugin` | `@opentui/solid` | >=0.1.105 | Optional (TUI only) |
130: | `@opencode-ai/plugin` | `effect` | — | Implicit (used by ToolContext.ask) |
131: | `@opencode-ai/sdk` | — | — | None |
132: 
133: ## Plugin Runtime Lifecycle
134: 
135: ```text
136: 1. OpenCode server starts (Go binary)
137: 2. Plugin loader discovers plugins from config
138: 3. Each plugin function called with PluginInput
139: 4. Plugin returns Hooks object
140: 5. Hooks registered in runtime:
141:    - tool → added to tool registry
142:    - auth → registered for provider
143:    - provider → models merged
144:    - hooks → added to hook chain
145: 6. Plugin lives for server lifetime
146: 7. Hooks called on matching events
147: ```
148: 
149: ## Effect.Effect Internals
150: 
151: `ToolContext.ask()` returns `Effect.Effect<void>`:
152: 
153: - Effect is a lazy computation — nothing happens until run
154: - `Effect.runPromise(effect)` executes and returns Promise<void>
155: - If permission denied, the Effect fails → `runPromise` rejects
156: - Use `Effect.catchAll()` or try/catch around `runPromise` for graceful handling
157: 
158: ## Auto-generated gen/ Directory
159: 
160: - `types.gen.ts` — 68KB of types from OpenAPI spec
161: - `sdk.gen.ts` — OpencodeClient class with all API methods
162: - `client/client.gen.ts` — Base HTTP client
163: - **Never edit gen/ files** — regenerated from openapi.json
164: - Generated by `@hey-api/openapi-ts`
165: 
166: ## Two SDK Versions: Coexistence Strategy
167: 
168: | Feature | V1 | V2 |
169: |---------|----|----|
170: | Client | `packages/sdk/js/src/client.ts` | `packages/sdk/js/src/v2/client.ts` |
171: | Server | `packages/sdk/js/src/server.ts` | `packages/sdk/js/src/v2/server.ts` |
172: | Directory header | `x-opencode-directory` | `x-opencode-directory` |
173: | Workspace header | Not supported | `x-opencode-workspace` |
174: | URL encoding | Basic | `pick()` comparison function |
175: | Data helpers | None | `data.message.user()` |
176: | Types | `gen/types.gen.ts` | `v2/gen/types.gen.ts` |
177: 
178: Both versions share the same process management (`process.ts`) and same OpenAPI spec.

(End of file - total 178 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/skills-lab/active/refactoring/stack-l3-opencode/metrics/rich-gate-scorecard.md"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/skills-lab/active/refactoring/stack-l3-opencode/metrics/rich-gate-scorecard.md</path>
<type>file</type>
<content>
1: # RICH Gate Scorecard — stack-opencode
2: 
3: **Date:** 2026-04-29 | **Auditor:** gsd-executor (SE-8) | **Version:** 1.0.0
4: **Skill Type:** Reference Document (stack reference)
5: **RICH Applicability:** Partial — reference docs are exempt from workflow-specific gates (RICH-2, RICH-4)
6: 
7: ---
8: 
9: ## D1-D8 Dimension Scores
10: 
11: ### D1: Knowledge Delta (20 points)
12: **Score: 17/20**
13: 
14: Exceptional BEYOND-DOCS knowledge synthesis: 7 key gotchas with specific failure modes (tool() zero-validation, context.ask() Effect-not-Promise, hook output mutation, Zod transform/refine/lazy silent failures, abort signal cooperation, missing session state, no hook priority). These are NOT in official docs — they're source-extracted behavioral truths. Three decision trees (Tool vs Hook, Zod type reliability matrix, SDK version selection). Source file index for direct grep against bundled source. 9 reference files organized as expert/api/patterns tiers.
15: 
16: **Deductions:** Source-extracted knowledge quality varies — "tool() is an identity function" is critical, but "no hook priority system" is implementation-specific trivia. Expert guides could benefit from version ranges for each behavioral claim.
17: 
18: **Evidence:** `SKILL.md` lines 41-49 (gotchas), 67-76 (tool vs hook decision tree), 78-84 (Zod reliability matrix), 86-92 (SDK version selection), 107-110 (source file index). 9 bundled references across expert, api, and patterns tiers.
19: 
20: ### D2: Mindset + Appropriate Procedures (15 points)
21: **Score: 10/15** *(adjusted: reference docs score lower on procedural mindset)*
22: 
23: Decision trees encode architectural thinking: tool vs hook selection, Zod type reliability grading, SDK version decisions. The "Read Before Coding" directive on gotchas enforces correct-first-time mindset. Source file index enables grep-first debugging.
24: 
25: **Deductions:** No plugin assembly procedure (order-dependent hook registration). No hook debugging procedure (how to trace mutation through hook chain). Decision trees cover "what" more than "how to debug when wrong."
26: 
27: ### D3: Anti-Pattern Quality (15 points)
28: **Score: 10/15**
29: 
30: 7 key gotchas function as implicit anti-patterns (e.g., using `await context.ask()` expecting a Promise, using `z.transform()` in tool schemas). Each states what breaks and implies the correct alternative. However, none are formally structured as anti-patterns with severity and detection methods.
31: 
32: **Deductions:** Gotchas lack explicit "Correct Pattern" column. No detection commands (grep patterns) for finding violations. The hook output mutation issue (last-write-wins) is a subtle bug — no example of correct spread merging.
33: 
34: ### D4: Specification Compliance — Description (15 points)
35: **Score: 14/15**
36: 
37: Valid frontmatter with name, version (1.14.44), 39 trigger keywords — among the most comprehensive in the skill set. Covers SDK API names (definePlugin, tool registration, hook registration, ToolContext, ToolResult, PluginInput, Hooks, AuthHook, ProviderHook, createOpencodeClient, BunShell), lifecycle events (session.compacting, permission.ask), concepts (hook composition, tool schema validation, opencode sse, opencode abort signal), new subsystems (ACP protocol, TUI keymap, workspace adapter), and patterns (plugin development, opencode tool, opencode hook).
38: 
39: **Deductions:** Some triggers are overly specific (chat.params, chat.headers) and may not match natural language usage. Version is a string "1.14.44" — other skills use semver ranges.
40: 
41: ### D5: Progressive Disclosure (15 points)
42: **Score: 14/15**
43: 
44: Strong progressive disclosure: Key Gotchas first (read before coding) → Quick Navigation table with When to Load column → Decision Trees → Ecosystem Routing → Source Files → Updating. The "When to Load" column is a metadata innovation — tells agents what reference to load based on their task, not just what's available. 9 references with tiered organization (expert/api/patterns).
45: 
46: **Deductions:** "When to Load" guidance could be more prescriptive ("If creating a tool, load X and Y; skip Z"). No "Read Time" estimates. The bundled source is 20,546 lines — no guidance on incremental search strategy.
47: 
48: ### D6: Freedom Calibration (15 points — PARTIALLY APPLICABLE)
49: **Score: N/A (reference document)**
50: 
51: This dimension is not applicable to reference documents. The skill informs but doesn't constrain.
52: 
53: ### D7: Pattern Recognition (10 points)
54: **Score: 9/10**
55: 
56: Clear Reference pattern with BEYOND-DOCS expert tier (differentiating feature), gotcha-first loading, decision trees, source-backing. The "expert/api/patterns" reference organization is a pattern innovation — separates source-derived behavioral truth from API documentation from usage patterns.
57: 
58: **Deductions:** Pattern innovation should be self-documented for skill author reference.
59: 
60: ### D8: Practical Usability (15 points)
61: **Score: 14/15**
62: 
63: Gotchas prevent the most common failures. Decision trees resolve 80% of routing questions. Source file index enables precise grep. The Zod reliability matrix (✅/⚠️/❌) is immediately actionable. Ecosystem routing connects to 5 sibling skills. Update script provided for version freshness.
64: 
65: **Deductions:** The bundled source (20,546 lines) is large — no guidance on incremental search patterns to avoid full reads. "Quick Navigation" table has 9 rows — could benefit from collapsed priority tiers.
66: 
67: ---
68: 
69: ## Score Summary
70: 
71: | Dimension | Score | Max | % | Applicable? |
72: |-----------|-------|-----|----|-------------|
73: | D1: Knowledge Delta | 17 | 20 | 85% | YES |
74: | D2: Mindset + Procedures | 10 | 15 | 67% | PARTIAL |
75: | D3: Anti-Pattern Quality | 10 | 15 | 67% | YES |
76: | D4: Spec Compliance | 14 | 15 | 93% | YES |
77: | D5: Progressive Disclosure | 14 | 15 | 93% | YES |
78: | D6: Freedom Calibration | N/A | 15 | — | N/A (ref doc) |
79: | D7: Pattern Recognition | 9 | 10 | 90% | YES |
80: | D8: Practical Usability | 14 | 15 | 93% | YES |
81: | **TOTAL (applicable)** | **88** | **105** | **83.8%** | — |
82: 
83: **Quality classification:** Proficient (83.8%) on applicable dimensions — approaching Expert.
84: 
85: ---
86: 
87: ## RICH Gate Scores
88: 
89: | Gate | Criterion | Status | Notes |
90: |------|-----------|--------|-------|
91: | RICH-1 | Source lineage documented | ✅ PASS | OpenCode SDK+Plugin 1.14.44; source repo `anomalyco/opencode`; 22,771-line bundled source confirmed |
92: | RICH-2 | Pattern decisions documented | ⚠️ N/A | Reference docs document SDK behavior, not pattern decisions |
93: | RICH-3 | Cross-refs to related stack skills | ✅ PASS | Ecosystem routing to stack-zod, stack-vitest, stack-nextjs, gate-lifecycle-integration, gate-evidence-truth, gate-spec-compliance |
94: | RICH-4 | Script with validation | ⚠️ N/A | Reference docs have `scripts/update.sh` for version refresh, not validation |
95: | RICH-5 | Bundled references are substantive | ✅ PASS | 9 bundled references: hook-composition, tool-internals, client-server, plugin API, SDK API, types, dev patterns, testing patterns, gatekeeping patterns |
96: | RICH-6 | Framework-agnostic paths | ✅ PASS | All paths relative; no project-local hardcodes |
97: | RICH-7 | Version coverage gaps documented | ⚠️ PARTIAL | Version 1.14.44 tracked; v1 vs v2 SDK differences documented; Plugin API noted as version-independent |
98: | RICH-8 | Scorecard + evals exist | ✅ PASS | This scorecard + `evals/evals.json` created |
99: 
100: **RICH gates applicable:** 5/6 — 83.3% on applicable gates
101: 
102: **RICH Exit Decision:** **PASS** (on applicable criteria). The most technically deep stack reference — source-extracted behavioral truths (BEYOND-DOCS) differentiate it from API-lookup tools.

(End of file - total 102 lines)
</content>
```

---

## Assistant (Hf-L2-Skill-Builder · DeepSeek V4 Pro)

_Thinking:_

Now let me read the API reference files and remaining reference files.

Now reading the API reference files and remaining references:

**Tool: read**

**Input:**
```json
{}
```

---

