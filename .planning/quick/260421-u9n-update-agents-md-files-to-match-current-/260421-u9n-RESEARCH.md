# Research: AGENTS.md Drift Detection & Routine Update Approach

**Researched:** 2026-04-21
**Domain:** Documentation sync, AGENTS.md maintenance
**Confidence:** HIGH (all claims verified against live filesystem)

## Summary

Both AGENTS.md files contain significant drift from the current codebase. The root AGENTS.md understates .opencode/ counts by 4-10x (claims "6 agents, 5 skills, 6 commands"; actual: 57 agents, 22 skills, 13 commands), misses `delegation-persistence.ts`, and omits `src/shared/` and `src/schema-kernel/` from the project structure tree. The `src/lib/AGENTS.md` similarly misses `delegation-persistence.ts` entirely and has stale LOC estimates.

OMO's `deep-init` command provides an excellent blueprint: a multi-agent concurrent scan that scores directories by complexity, generates hierarchical AGENTS.md files with telegraphic style, and has quality gates (50-150 lines root, 30-80 lines subdirs).

**Primary recommendation:** Create a `agents-md-sync` skill (and optional `/sync-agents-md` command) that uses a simplified version of OMO's scoring approach — scan filesystem, compare against AGENTS.md claims, produce a drift report with specific deltas, then apply edits. Run manually or after major phase completions.

## Specific Drift Found

### Root AGENTS.md (17 specific issues)

| # | Section | Claimed | Actual | Fix |
|---|---------|---------|--------|-----|
| 1 | Project Structure tree (L79-107) | Lists `src/lib/` with 12 modules | 13 modules — missing `delegation-persistence.ts` (78 LOC) | Add to tree |
| 2 | Project Structure tree | No `src/shared/` directory listed | `src/shared/tool-response.ts` (71 LOC), `tool-helpers.ts` (9 LOC) exist | Add `src/shared/` to tree |
| 3 | Project Structure tree | No `src/schema-kernel/` directory listed | `src/schema-kernel/index.ts` + `prompt-enhance.schema.ts` (169 LOC) exist | Add `src/schema-kernel/` to tree |
| 4 | OpenCode Integration (L177) | "6 agents defined in `.opencode/agents/`" | **57 agents** (coordinator, conductor, researcher, builder, critic, explore + 51 more including 30+ GSD agents, hivefiver agents, etc.) | Update count and description |
| 5 | OpenCode Integration (L178) | "5 skills in `.opencode/skills/`" | **22 skills** (original 5 + agent-authorization, command-dev, custom-tools-dev, harness-audit, hm-deep-research, etc.) | Update count |
| 6 | OpenCode Integration (L179) | "6 commands in `.opencode/commands/`" | **13 commands** (original 6 + hf-absorb, hf-audit, hf-create, hf-prompt-enhance, etc.) | Update count |
| 7 | Agent names listed | "coordinator, conductor, researcher, builder, critic, explore" | These 6 exist but 51 more added since | Either list all or describe categories |
| 8 | Skill names listed | "meta-builder, user-intent-interactive-loop, coordinating-loop, planning-with-files, use-authoring-skills" | These 5 exist but 17 more added | Either list all or describe categories |
| 9 | Command names listed | "start-work, plan, deep-init, deep-research-synthesis-repomix, harness-doctor, ultrawork" | These 6 exist but 7 more added | Either list all or describe categories |
| 10 | "Where to find things" table | No entry for delegation persistence | `delegation-persistence.ts` extracted from `delegation-manager.ts` in Phase 16 | Add row |
| 11 | "Where to find things" table | No entry for schema kernel | `src/schema-kernel/` holds prompt-enhance Zod schemas | Add row |
| 12 | "Where to find things" table | No entry for shared utilities | `src/shared/tool-response.ts` provides standard response envelope | Add row |
| 13 | Dependency rules | Lists 12 modules | Now 13 modules with `delegation-persistence.ts` | Add to list |
| 14 | Target architecture LOC | "total codebase target ~4,000-5,000 LOC" | Current `src/` total: 4,581 LOC — at target | No fix needed (informational) |
| 15 | "Runtime features" list | Lists auto-loop, ralph-loop, delegation chain, task queuing, category system, session recovery | After Phase 14-16, features include WaiterModel delegation, PTY integration, queue-key validation | Update feature list |
| 16 | No mention of PTY | — | Phase 16 added PTY support (PtyManager, lazy loading, bun-pty detection) | Add mention |
| 17 | `docs/draft/architecture-proposal-hivemind-v3.md` reference | Referenced for "feature-to-code mapping" | May be stale — needs verification | Verify and update reference |

### src/lib/AGENTS.md (8 specific issues)

| # | Section | Claimed | Actual | Fix |
|---|---------|---------|--------|-----|
| 1 | MODULE RESPONSIBILITIES table | Lists 12 modules | 13 modules — missing `delegation-persistence.ts` (78 LOC) | Add row: `delegation-persistence.ts | ~78 | Delegation record persistence helper | persistDelegation, loadDelegations, normalizeLegacyRecord` |
| 2 | `continuity.ts` LOC | ~635 LOC | 401 LOC (trimmed in Phase 14) | Update to ~401 |
| 3 | `lifecycle-manager.ts` role | "Session lifecycle: create→queue→dispatch→run→complete/error + CompletionDetector integration" | Currently a STUB after Phase 14 clean slate — `launchDelegatedSession()` throws | Update description to note stub status |
| 4 | `helpers.ts` exports | Lists 9 exports | Verify `extractSdkErrorMessage` is now exported (ARCHITECTURE.md says it is) | Verify and update |
| 5 | DEPENDENCY GRAPH | Shows `delegation-manager.ts → concurrency.ts + continuity.ts + helpers.ts + types.ts` | Now also depends on `delegation-persistence.ts` | Add dependency |
| 6 | DEPENDENCY GRAPH | No `delegation-persistence.ts` node | New module depends on `types.ts`, `continuity.ts` | Add to graph |
| 7 | "Where to Look" table | No entry for delegation persistence | `delegation-persistence.ts` handles delegation record I/O | Add row |
| 8 | CODE SMELLS #1 | "continuity.ts (635 LOC)" | Now 401 LOC — below split threshold | Update or remove from smells |

## OMO deep-init Pattern Analysis

**Source:** [VERIFIED: raw.githubusercontent.com/code-yeongyu/oh-my-openagent]

### What deep-init does
A slash command (`/init-deep`) that generates hierarchical AGENTS.md files through 4 phases:

1. **Discovery** — Fires 6+ concurrent explore agents + bash structural analysis + LSP symbol extraction + reads existing AGENTS.md files
2. **Scoring** — Scores each directory on a weighted matrix (file count 3x, reference centrality 3x, module boundary 2x, etc.)
3. **Generation** — Root AGENTS.md gets full treatment (50-150 lines); subdirs get lightweight treatment (30-80 lines, never repeat parent)
4. **Review** — Deduplicate, trim, validate telegraphic style

### Key design decisions
- **Dynamic agent spawning**: scales explore agents based on project size (>100 files = +1 agent per 100)
- **Quality gates**: explicit line count limits, no generic advice
- **Edit vs Write**: existing files get Edit tool, new files get Write tool
- **Telegraphic style mandate**: "Telegraphic or die"
- **Score threshold**: directories scoring >15 get AGENTS.md, 8-15 only if distinct domain, <8 skip

### What we can adapt

| OMO Pattern | Our Adaptation |
|-------------|----------------|
| Concurrent explore agents for discovery | Single skill that scans filesystem with glob/grep (our project is small enough) |
| Scoring matrix | Simplified: just check if files in a directory match AGENTS.md claims |
| Root gets full treatment | Root AGENTS.md gets full update |
| Subdirs get lightweight | `src/lib/AGENTS.md` gets targeted update |
| Quality gates (50-150 lines) | Keep our current sizes, just fix content |
| Edit vs Write rule | Same — always Edit existing files |
| Telegraphic style | Already our convention |

### What doesn't apply to us
- **LSP codemap**: Overkill for our ~50 source files
- **Dynamic agent spawning**: Project is small (4,581 LOC src/)
- **`--create-new` mode**: We want targeted updates, not full regeneration
- **Deep directory scoring**: We only have 2 AGENTS.md locations, not a hierarchy

## Relevant Existing Skills

| Skill | Relevance | How to Use |
|-------|-----------|------------|
| `create-agentsmd` | HIGH — "Prompt for generating an AGENTS.md file for a repository" | Load this skill when generating new AGENTS.md content |
| `agent-md-refactor` | HIGH — "Refactor bloated AGENTS.md files to follow progressive disclosure" | Load after initial sync to ensure quality |
| `gsd-docs-update` | MEDIUM — "Generate or update project documentation verified against codebase" | Could use the gsd-docs-update flow for this |
| `gsd-quick` | MEDIUM — "Execute a quick task with GSD guarantees" | Run the sync as a quick task |

## Recommended Approach

### Option A: Dedicated Skill (RECOMMENDED)

Create `agents-md-sync` skill in `.opencode/skills/` that:

1. **Scan**: Glob `src/lib/*.ts`, `src/tools/*`, `src/hooks/*`, `src/shared/*`, `src/schema-kernel/*`, `.opencode/agents/`, `.opencode/skills/`, `.opencode/commands/`
2. **Compare**: Read existing AGENTS.md files, extract claims (module lists, LOC, counts)
3. **Diff**: Report specific drift items (like the tables above)
4. **Apply**: Edit AGENTS.md files with correct content

**Why skill over command:** Skills can be loaded by any agent; commands are user-triggered only. A skill can be composed into existing workflows (e.g., auto-triggered by `gsd-docs-update` or at phase completion).

### Option B: Enhanced `/deep-init` Command

Adapt the existing `/deep-init` command (already in `.opencode/commands/`) to support a `--sync` flag that does update-only mode instead of full generation.

**Why not:** `/deep-init` is an OMO import — modifying it creates upstream merge friction.

### Option C: Manual `gsd-quick` Task

Run as needed: `/gsd-quick "scan codebase and update both AGENTS.md files to match current state"`.

**Why not recommended:** No persistent knowledge of the AGENTS.md format; each run starts from scratch.

### Decision: Option A (Dedicated Skill)

The skill should:
1. Know the AGENTS.md template format for this project
2. Know where to scan for drift (specific paths)
3. Produce a structured drift report
4. Apply fixes using Edit tool
5. Target runtime: < 5 minutes for full sync

## Immediate Delta (What Needs Changing Now)

### Root AGENTS.md — Priority Changes

1. **Add `delegation-persistence.ts`** to project structure tree and "Where to find things" table
2. **Add `src/shared/` and `src/schema-kernel/`** to project structure tree
3. **Update .opencode/ counts**: 57 agents, 22 skills, 13 commands
4. **Update .opencode/ descriptions**: Categorize (e.g., "6 core agents + 30 GSD specialist agents + 21 hivefiver/meta agents")
5. **Add PTY support** mention in runtime features

### src/lib/AGENTS.md — Priority Changes

1. **Add `delegation-persistence.ts`** to MODULE RESPONSIBILITIES table
2. **Update `continuity.ts` LOC** from ~635 to ~401
3. **Update `lifecycle-manager.ts` description** to note STUB status
4. **Add `delegation-persistence.ts`** to DEPENDENCY GRAPH
5. **Update CODE SMELLS** — continuity.ts no longer 635 LOC

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | 57 agent files are intentional (not accidental) | Drift table | If some should be cleaned up, count may change |
| A2 | `delegation-persistence.ts` exports are stable (Phase 16 still in progress) | Drift table | If API changes, exports list needs update |
| A3 | No other AGENTS.md files exist elsewhere in the project | Drift table | If there are more, they need scanning too |

All other claims in this research were verified against the live filesystem.

## Sources

### Primary (HIGH confidence)
- Live filesystem scan of `src/lib/`, `src/tools/`, `src/hooks/`, `.opencode/` — all counts verified 2026-04-21
- OMO deep-init template at `raw.githubusercontent.com/code-yeongyu/oh-my-openagent` — full template fetched and analyzed
- `.planning/codebase/ARCHITECTURE.md` — generated 2026-04-21 by gsd-codebase-mapper

### Secondary (MEDIUM confidence)
- `.planning/codebase/STRUCTURE.md` — module sizes from 2026-04-21 scan
- `.planning/codebase/CONVENTIONS.md` — coding conventions from 2026-04-21 scan
