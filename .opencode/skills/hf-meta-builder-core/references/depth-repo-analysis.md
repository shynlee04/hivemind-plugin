# Depth Reference: Repository Analysis

> **Loading trigger:** Read when analyzing repos for meta-concept extraction (skills, agents, commands, patterns).
> **Do NOT load** for simple routing tasks.

---

## What It Does

This reference documents how to analyze a GitHub repository to extract skill-worthy patterns, agent roles, command structures, and tool usage conventions. Unlike code review, repo analysis for meta-concept extraction is about **adaptation, not duplication** — finding decision trees, trade-offs, and thinking frameworks that took the original authors years to develop, then expressing them as skill knowledge.

The core challenge: most repositories are 90% implementation detail and 10% insight. A naive repomix pack of a 50,000-line repo produces a 50,000-line XML file that overwhelms context. The analyst must filter aggressively before packing, and extract surgically after packing.

---

## WHY It Matters for Meta-Builder

Meta-builder creates skills that teach AI agents to perform expert tasks. The knowledge in those skills must come from somewhere. Two sources exist:
1. **Human expertise** — the meta-builder's own experience (high value, limited supply)
2. **Repository archaeology** — extracting patterns from high-quality codebases (scalable, requires discipline)

Repository archaeology is dangerous because it tempts the analyst into "pattern copying" — extracting HOW the code works (implementation) without extracting WHY the authors made each decision (thinking framework). A skill that explains "this repo uses React hooks" is worthless. A skill that explains "this repo uses hooks for shared state but avoids them for derived state because of re-render cascades" is valuable.

**The meta-builder's job is to extract the second kind of knowledge.**

---

## WHEN to Use

| Trigger | Analysis Depth | Expected Output |
|---------|---------------|---------------|
| User says "analyze this repo for patterns" or "extract patterns from X" | Full repo pack + surgical extraction | 1-3 candidate skill concepts with evidence |
| User says "what makes this codebase special?" | Shallow scan (structure + key files) | 5-10 bullet summary of architectural choices |
| User says "turn this repo into a skill" | Full pack + adaptation workflow | Complete SKILL.md + references/ + scripts/ |
| Post-creation: "does this skill accurately represent the repo?" | Spot-check against source | Verification report: faithful / adapted / invented |

---

## Inline Examples

### Repomix `--include` Patterns for Skill Discovery

**Goal:** Pack only the files that contain decision logic, not the files that contain boilerplate.

**Example patterns for a TypeScript project:**
```bash
# Core: architecture + interfaces + decision files
--include "src/**/*.ts,!src/**/*.spec.ts,!src/**/*.test.ts"

# Config: build choices, dependency philosophy
--include "package.json,tsconfig.json,vite.config.ts,README.md"

# Docs: design decisions, ADRs, RFCs
--include "docs/**/*.md,adr/**/*.md,rfc/**/*.md"

# Exclude: generated code, lockfiles, large binaries
--ignore "node_modules/**,dist/**,coverage/**,package-lock.json,*.lock"
```

**Why it matters:** Including `node_modules/` or `dist/` in a repomix pack multiplies the output by 100x with zero insight gain. The `--include` pattern is the single most important lever for analysis quality.

### Grep Strategies for Pattern Search

**Strategy 1: Find the decision points**
```bash
# Search for architectural decision comments
grep -r "DECISION\|TODO(architecture)\|FIXME(design)" src/

# Search for trade-off discussions in comments
grep -rP "(trade.?off|vs\.?|versus|instead of|rather than)" src/ --include="*.ts" -B 2 -A 2
```

**Strategy 2: Find the anti-patterns**
```bash
# Search for linter rule overrides — these indicate controversial choices
grep -r "eslint-disable" src/ | head -20

# Search for complex types — these indicate boundary design
grep -rP "interface .+\{[^}]{500,}" src/ --include="*.ts"
```

**Strategy 3: Find the extension points**
```bash
# Search for plugin/hook/extension patterns
grep -rP "(hook|plugin|extension|middleware|decorator)" src/ --include="*.ts" -l

# Search for factory functions — indicate flexibility design
grep -rP "function create[A-Z]" src/ --include="*.ts" -l
```

### Token Efficiency Tips

**Tip 1: Structure-first, content-second**
Before packing, get the directory tree. Understand the module boundaries. Then pack only the modules that contain the patterns you want to extract.

```bash
# Step 1: Structure
find src/ -type f -name "*.ts" | sort | head -50

# Step 2: Identify candidate modules
# (modules with many files = likely contain patterns)

# Step 3: Targeted pack
repomix --include "src/core/**/*.ts,src/delegation/**/*.ts,README.md"
```

**Tip 2: Use `--compress` for large repos**
For repos >100k lines, `--compress` uses tree-sitter to strip implementation detail while preserving signatures and structure. The output is ~30% the size with ~90% of the structural insight.

**Trade-off:** `--compress` removes comments, which often contain the "why" behind decisions. For repos where comments are the primary insight source, prefer targeted `--include` over `--compress`.

**Tip 3: XML vs Markdown vs JSON output**
| Format | Best For | Avoid When |
|--------|----------|------------|
| XML | Large repos with deep nesting | Quick scans |
| Markdown | Human-readable reports | Machine parsing |
| JSON | Structured analysis with scripts | Direct skill creation |
| Plain | Fastest, smallest | Complex structure |

For meta-concept extraction, **XML** is usually best because the `<file path="...">` tags make it easy to grep for specific modules.

---

## Permission Recommendations

| Role | Required Tools | Optional Tools |
|------|----------------|----------------|
| **Repo analyzer** | Read, Grep, Glob, Bash | websearch (for context on design choices) |
| **Pattern extractor** | Read, Write, Edit | skill (for cross-checking with existing skills) |
| **Meta-concept creator** | Read, Write, Edit, Bash, Glob, Grep | webfetch (for fetching design docs) |

**Note:** `repomix_pack_remote_repository` is the preferred tool for initial packing. It handles cloning, packing, and cleanup in one operation. Only use manual `git clone` + `repomix` when you need pre-pack filtering that the MCP tool doesn't support.

---

## Adaptation vs Duplication

| Duplication (BAD) | Adaptation (GOOD) |
|-------------------|-------------------|
| "This repo uses Express with middleware" | "This repo uses middleware for cross-cutting concerns (auth, logging, rate limiting) but avoids it for business logic to keep request handlers testable without HTTP context" |
| "The build tool is Vite" | "Vite is chosen over webpack because the project uses ESM-only dependencies and Vite's native ESM dev server avoids the dual-package hazard" |
| "Tests use vitest" | "Tests use vitest with inline snapshots for CLI output verification — this enables regression testing of user-facing messages without separate fixture files" |

**Test:** If a sentence could apply to any repo using the same technology, it's duplication. If it only makes sense for THIS repo, it's adaptation.
