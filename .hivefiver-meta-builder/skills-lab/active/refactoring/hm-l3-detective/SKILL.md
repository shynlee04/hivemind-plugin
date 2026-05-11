---
name: hm-l3-detective
description: Investigate codebases with SCAN, READ, and DEEP reading modes. Use when navigating large codebases, finding definitions, or recovering session context. Stage 1 of the hm-research-chain pipeline. Feeds findings into hm-deep-research and hm-synthesis. Consumes cached assets from hm-tech-stack-ingest. NOT for writing code or running tests.
metadata:
  layer: "3"
  role: "investigation"
  pattern: P2
allowed-tools: Read Write Edit Bash Glob Grep
---

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
