---
name: hm-l3-omo-reference
description: Provides the complete oh-my-openagent architecture as a packed reference for agent plugin design. Use when referencing oh-my-openagent architecture, plugin system design, hook system patterns, circuit breaker design, session continuity patterns, or skill loader architecture. NOT for direct code implementation.
metadata:
  consumed-by:
    - "hm-l2-researcher"
    - "hm-l2-architect"
  lineage-scope: "hm-*"
  access: "STRICT"
  layer: "3"
  role: "reference"
  pattern: P2
  version: "1.0.0"
  context-bomb: true
allowed-tools:
  - Read
  - Grep
  - Glob
---

## Overview

Complete oh-my-openagent architecture reference for agent plugin design patterns. Use when referencing plugin systems, hook architectures, circuit breakers, session continuity, or skill loader design. Contains packed repository with structured navigation into project structure, tech stack, and all source files.

## Repomix-Generated References

Repomix also generated structured markdown references from the packed output:

| File | Contents |
|------|----------|
| `references/summary.md` | **Start here** - Purpose, format explanation, and statistics |
| `references/project-structure.md` | Directory tree with line counts per file (674 lines, verified 2026-04-23) |
| `references/tech-stack.md` | Technology stack: language, runtime, frameworks, dependencies |
| `references/files.md` | All file contents (search with `## File: <path>`) |

## How to Use

### 1. Find file locations

Check `references/project-structure.md` for the directory tree.

### 2. Read file contents

Grep in `references/files.md` for the file path:
```
## File: src/utils/helpers.ts
```

### 3. Search for code

Grep in `references/files.md` for keywords:
```
function calculateTotal
```

### 4. Use the raw XML

The complete packed repo is in `references/oh-my-openagent-full.xml` (original repomix XML format). Use `attach_packed_output` or `grep_repomix_output` tools to explore it.

## Tech Stack Quick Reference

Load `references/tech-stack.md` when you need to understand:
- What language and runtime the codebase uses (TypeScript + Bun)
- Key frameworks and dependencies (OpenCode Plugin SDK, LSP, ast-grep)
- Build and test tooling (tsc, bun:test)
- Overall architecture patterns (plugin system, hook system, agent composition)

Do NOT load for simple file lookups or code searches — use `references/project-structure.md` or grep `references/files.md` instead.

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **The Memorizer** | Treats packed XML as current truth | Repomix packs are historical reference only. Verify against live code. |
| **The Full-Loader** | Reads entire XML without compression | Use `compress: true` for structure-first exploration. Grep before reading. |
| **The Pattern Copier** | Copies OMO patterns directly into harness | OMO is architectural inspiration, not implementation spec. Adapt, don't copy. |
| **The Stale Citer** | Cites packed code as current behavior | Packed code may be outdated. Use only for structural patterns, not runtime claims. |

## Self-Correction

### When the Task Keeps Failing

[Detection] If searches in `references/files.md` return no results, the packed repository may not contain what you're looking for — OMO is a specific architecture tool, not a general OpenCode reference. Verify the search terms match OMO's actual code patterns by checking `references/project-structure.md` for file naming conventions first. If the needed information simply doesn't exist in OMO, flag it as out-of-scope and suggest consulting the actual OpenCode platform reference skill instead.

[Recovery] Start with project-structure.md to understand file naming. Use exact file paths from the project-structure tree in grep queries. If information is absent, recommend consulting hm-opencode-platform-reference for OpenCode-specific questions.

### When Unsure About the Next Step

[Detection] If you don't know which reference file to load, default to `references/summary.md` — it contains purpose, format explanation, and statistics that orient you to the rest of the pack. If you need structural patterns (how code is organized), read `references/project-structure.md`. If you need actual code, grep `references/files.md`. Only load the raw XML pack (`references/oh-my-openagent-full.xml`) when grep in files.md is insufficient.

[Recovery] Follow the 4-step usage guide in order: summary → structure → grep files.md → XML as last resort.

### When the User Contradicts Skill Guidance

[Detection] If the user wants to directly copy OMO patterns into harness code, warn that OMO is architectural inspiration — its patterns were designed for a different plugin system and may not map directly to the current harness architecture. If the user insists, adapt the pattern to the current codebase rather than copying verbatim. Document the adaptation rationale. If the user says the packed code is outdated, trust their assessment — repomix packs are historical snapshots — and suggest checking the live OMO repository for current patterns.

[Recovery] Adapt patterns, don't copy. Document adaptation decisions. If user claims staleness, defer to their live-repo knowledge.

### When an Edge Case Is Encountered

[Detection] If the packed repository contains files that reference external dependencies or APIs not documented within the pack, those references are dead ends — the pack is self-contained and does not include dependency source code. If the packed XML file is too large for a single read, use repomix grep tools (`grep_repomix_output`) or compress mode to explore incrementally. If the OMO skill was generated for a different version of OMO than what the project uses, flag version mismatch as a risk.

[Recovery] Use repomix grep for large XML files. Flag version mismatches and dead external references. Use compress mode for structure-first exploration.

---

This skill was generated by [Repomix](https://github.com/yamadashy/repomix)
