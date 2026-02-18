---
name: hivemind-architect-strategist
description: "Core skill for the hiveminder agent. Provides scanning, analysis, and synthesis capabilities for architecture review and strategic planning. Research-fronted and evidence-oriented approaches for high-quality decision making."
license: MIT
compatibility: opencode
metadata:
  audience: architects
  workflow: planning,review,analysis
---

# HiveMind Architect Strategist

**Core principle:** Research-fronted. Evidence-oriented. Clean architecture. Ruthless quality. Never decide without data. Never claim without proof.

## When to Use

- Starting architecture review or code audit
- Planning strategic refactoring decisions
- Evaluating technical debt and migration paths
- Synthesizing findings from multiple code scans
- Making evidence-based recommendations

## Plugin Dependency

This skill is part of the `hivemind-context-governance` plugin. It provides core capabilities for the hiveminder agent.

When installed to client projects via `npx hivemind init`, this skill becomes available in:
- `.opencode/skills/hivemind-architect-strategist/SKILL.md` (project-level)
- Or `~/.config/opencode/skills/hivemind-architect-strategist/SKILL.md` (global)

## Core Philosophy

| Principle | Meaning |
|-----------|---------|
| **Research-fronted** | Always investigate before deciding. Scan code, check docs, validate assumptions. |
| **Evidence-oriented** | Claims require proof. "This is broken" → show the error. "This should work" → cite the docs. |
| **Clean architecture** | Follow SOLID principles. Respect layers: tools/lib/hooks/schemas. No shortcuts. |
| **Ruthless quality** | No compromises on standards. If it doesn't pass tests, it doesn't ship. |

## Scanning Capabilities

### Using HiveMind Custom Tools (requires plugin)

```typescript
// Deep hierarchy scan
scan_hierarchy({ action: "analyze" })

// Recall past decisions
recall_mems({ query: "architecture" })

// Save strategic insights
save_mem({
  shelf: "strategy",
  content: "Key insight...",
  tags: "architecture,planning"
})

// Immutable constraints
save_anchor({
  key: "arch_constraint_1",
  value: "Tools must be ≤100 lines"
})
```

### Using Standard OpenCode Tools

```typescript
// Pattern search
grep({ pattern: "import.*from", include: "*.ts" })

// File discovery
glob({ pattern: "src/**/*.ts" })

// Content reading
read({ filePath: "src/lib/example.ts" })

// Web research
websearch({ query: "best practices for X" })
```

### Deep Codebase Scan

```typescript
// Analyze hierarchy and context state
scan_hierarchy({ action: "analyze" })

// Pattern detection across codebase
grep({ pattern: "import.*from", include: "*.ts" })
grep({ pattern: "TODO|FIXME|HACK", include: "*.ts" })

// Structure analysis
glob({ pattern: "**/*.ts" })
glob({ pattern: "src/tools/**/*.ts" })
glob({ pattern: "src/lib/**/*.ts" })
```

### Architecture Taxonomy Scan

```bash
# Verify layer boundaries
find src/tools -name "*.ts" -exec wc -l {} \; | awk '$1 > 100 {print "VIOLATION: " $2 " has " $1 " lines"}'

# Check for LLM prompts in lib/
grep -r "prompt\|generateText\|streamText" src/lib/ && echo "VIOLATION: LLM calls in pure lib"

# Check for business logic in tools
grep -r "async.*=>" src/tools/*.ts | grep -v "schema\|lib\." && echo "WARNING: Business logic in tool"
```

## Analysis Patterns

### 1. Architecture Taxonomy Verification

```
Layer           | Constraint                      | Detection
----------------|---------------------------------|--------------------------------
tools/          | ≤100 lines, Zod schema + lib   | wc -l > 100, missing schema
lib/            | Pure TS, no LLM prompts         | grep for ai-sdk imports
hooks/          | Read-only, inject context       | grep for write operations
schemas/        | Zod validation + FK constraints| missing .refine() or .transform()
```

### 2. Dependency Graph Analysis

```typescript
// Find circular dependencies
grep -r "from '\.\." src/ | sort | uniq -c | sort -rn

// Identify tight coupling
grep -r "import.*from.*src/" src/ | cut -d: -f1 | sort | uniq -c | sort -rn
```

### 3. Code Smell Detection

| Smell | Pattern | Risk |
|-------|---------|------|
| God Object | File > 300 lines | Maintenance nightmare |
| Feature Envy | Many imports from one module | Coupling |
| Primitive Obsession | `string` everywhere | Type safety loss |
| Dead Code | Unexported, unreferenced | Bloat |
| Duplicate Logic | Similar function names | DRY violation |

### 4. Technical Debt Identification

```bash
# Quick debt scan
grep -rn "TODO\|FIXME\|HACK\|XXX" src/ | wc -l

# Debt severity assessment
grep -rn "any\|unknown\|@ts-ignore" src/ | wc -l

# Test coverage gaps
find tests -name "*.test.ts" | wc -l vs find src -name "*.ts" | wc -l
```

## Synthesis Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                     SYNTHESIS PIPELINE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. SCAN     →  Gather raw data                                 │
│     • scan_hierarchy for context state                          │
│     • glob/grep for code patterns                               │
│     • read files for implementation details                     │
│                                                                 │
│  2. FILTER   →  Remove noise, focus on signal                   │
│     • Exclude node_modules, dist, generated files              │
│     • Prioritize src/, tests/, docs/                            │
│     • Focus on recent changes (git log)                         │
│                                                                 │
│  3. ANALYZE  →  Find patterns, gaps, issues                     │
│     • Compare against architecture taxonomy                     │
│     • Check dependency graphs for cycles                        │
│     • Identify code smells and debt                             │
│                                                                 │
│  4. SYNTHESIZE → Create actionable insights                     │
│     • Group related issues                                      │
│     • Prioritize by impact/effort                               │
│     • Generate recommendations with evidence                    │
│                                                                 │
│  5. REPORT   →  Evidence-based recommendations                  │
│     • Cite specific files and lines                             │
│     • Provide verification commands                             │
│     • Include rollback plans                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Quality Criteria

### Tools (`src/tools/`)

```
✓ ≤100 lines per file
✓ Zod schema for input validation
✓ Delegates business logic to lib/
✓ Returns structured result object
✗ No direct database access
✗ No LLM prompt construction
✗ No complex business logic
```

### Libraries (`src/lib/`)

```
✓ Pure TypeScript functions
✓ No LLM SDK imports
✓ No external API calls (except via abstraction)
✓ Fully testable without mocks
✗ No Zod parsing (belongs in tools)
✗ No file writes (belongs in tools via persistence lib)
```

### Hooks (`src/hooks/`)

```
✓ Read-only operations
✓ Inject context into conversation
✓ Return structured context object
✗ No write operations
✗ No side effects
✗ No LLM calls
```

### Schemas (`src/schemas/`)

```
✓ Zod validation with .refine()/.transform()
✓ FK constraints for related entities
✓ Clear error messages
✗ No business logic
✗ No file I/O
```

## Integration Points

| Agent | Purpose | When to Invoke |
|-------|---------|----------------|
| **scanner** | Deep investigation, MCP tool discovery | Need exhaustive code scan |
| **explore** | Terrain mapping, file discovery | Need quick structural overview |
| **code-review** | Deep inspection, quality gate | Before accepting changes |
| **build** | Implementation, testing | After planning is complete |

## Report Template

When synthesizing findings, structure reports as:

```markdown
## Architecture Review: [Component/Module]

### Executive Summary
[1-2 sentences on overall health]

### Evidence Gathered
- Files scanned: [count]
- Patterns detected: [list]
- Debt items found: [count by severity]

### Findings

#### Critical (Must Fix)
1. [Issue] - [Evidence: file:line] - [Impact]

#### High Priority
1. [Issue] - [Evidence] - [Impact]

#### Medium Priority  
1. [Issue] - [Evidence] - [Recommendation]

### Recommendations
1. [Action] - [Why] - [Verification command]

### Rollback Plan
[If recommendations fail, how to revert]
```

## Evidence Requirements

| Claim Type | Required Evidence |
|------------|-------------------|
| "This is broken" | Error message + stack trace + file:line |
| "This should work" | Documentation URL + version + code sample |
| "This violates architecture" | Taxonomy rule + file:line + suggested fix |
| "Technical debt here" | Pattern detected + line count + impact estimate |
| "Tests are missing" | File list of untested modules + coverage % |

## Quick Reference Commands

```bash
# Architecture health check
find src -name "*.ts" -exec wc -l {} \; | awk '$1 > 100 {print}'

# Dependency analysis
grep -r "from '\.\." src/ | sort | uniq -c | sort -rn | head -20

# Technical debt scan
grep -rn "TODO\|FIXME\|any\|@ts-ignore" src/ | wc -l

# Test coverage check
npm test -- --coverage 2>/dev/null | grep "All files"

# Type safety
npx tsc --noEmit
```

## Red Flags

| Thought | Reality |
|---------|---------|
| "I'll just read the docs" | Docs >48h old are SUSPECT. Scan the code. |
| "This looks fine" | "Looks" is not evidence. Run tests, check types. |
| "I know this pattern" | Codebases evolve. Verify with grep. |
| "This is a simple fix" | Simple fixes cascade. Check dependencies first. |
| "I'll skip the scan" | Every skipped scan is a potential bug. |
| "The tests should pass" | Run them. "Should" is not verification. |