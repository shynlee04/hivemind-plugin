---
name: hm-detective
description: "Strategic codebase investigation and context-efficient retrieval. Use when navigating large codebases, recovering session context, reading walls of text efficiently, searching across files, estimating token budgets, or performing surgical edits. Three reading modes (skim/scan/deep at 5%/15%/100% cost), swarm-based context recovery with 5 parallel agents, hierarchical tech registry for cross-session persistence, and LSP-aware surgical edits. Triggers on: navigate this codebase efficiently, skim scan deep reading modes, surgical edit across files, grep before read pattern, token budget management, context recovery with swarm, recover session context, estimate token budget, offset hop-reading, how is this codebase structured, find where X is defined, too many files to read, context is getting full."
metadata:
  layer: "2"
  role: "investigation"
  pattern: P2
allowed-tools: Read Write Edit Bash Glob Grep
---

# HM Detective

The strategic investigation and retrieval skill. Teaches agents HOW to read, navigate, search, and edit efficiently — not what to research, but how to consume information without blowing context budgets.

## Quick Jump

| Investigation Need | Section | Jump |
|--------------------|---------|------|
| "How do I read this?" | Reading Modes | [Three Reading Modes](#three-reading-modes) |
| "How much context will this cost?" | Token Budget | [references/token-budget.md](references/token-budget.md) |
| "I lost context — recover" | Swarm Recovery | [references/swarm-recovery.md](references/swarm-recovery.md) |
| "What tech stack is this?" | Tech Registry | [references/tech-registry.md](references/tech-registry.md) |
| "How do I edit safely?" | Surgical Edits | [references/surgical-edits.md](references/surgical-edits.md) |
| "Where do notes go?" | Document Pipeline | [references/document-pipeline.md](references/document-pipeline.md) |

## Three Reading Modes

Every file read costs tokens. Choose the cheapest mode that answers your question.

| Mode | Token Cost | When | Tools |
|------|-----------|------|-------|
| **SKIM** | ~5% | Orientation: "what is this?" | glob, ls, frontmatter-only, grep -c |
| **SCAN** | ~15% | Targeted: "find X" | grep -n, offset reads ±20 lines, TOC navigation |
| **SCAN (Tech Stack)** | ~10% | Stack detection: "what's this built with?" | grep indicator files, read 5-10 config files |
| **DEEP** | 100% | Understanding: "need every line" | Read full file, repomix pack + grep |

**Escalation rule**: START → SKIM → (if insufficient) SCAN or SCAN (Tech Stack) → (if still need context) DEEP. Never skip to DEEP.

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
| Single-file edit | surgical-edits.md | Follow the 5-step protocol from SKILL.md |
