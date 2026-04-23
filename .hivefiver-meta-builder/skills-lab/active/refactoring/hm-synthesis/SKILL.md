---
name: hm-synthesis
description: Compress research findings into actionable artifacts with tiered reduction. Use when packing codebases, extracting interfaces, or producing validated reports. NOT for raw data collection or unfiltered dumps.
metadata:
  layer: "2"
  role: "compression"
  pattern: P2
allowed-tools: Read Write Edit Bash Glob Grep
---

## Overview

Compress research findings into actionable artifacts with tiered reduction. Use when packing codebases, extracting interfaces, producing validated reports, or classifying patterns. Produces compressed outputs at three reduction tiers with cross-dependency analysis.

## Quick Jump

| Task | Section | Detail |
|------|---------|--------|
| "Compress this repo" | Compression Tiers | [Three Compression Tiers](#three-compression-tiers) |
| "What depends on what?" | Cross-Dep Analysis | [references/cross-dep-analysis.md](references/cross-dep-analysis.md) |
| "Extract the API surface" | Interface Extraction | [references/interface-extraction.md](references/interface-extraction.md) |
| "What patterns does this use?" | Pattern Classification | [references/pattern-classifier.md](references/pattern-classifier.md) |
| "Is my corpus big enough?" | Corpus Gate | [references/corpus-gate.md](references/corpus-gate.md) |
| "Export findings that last" | Artifact Export | [references/artifact-export.md](references/artifact-export.md) |

<execution_context>
For reading modes during analysis: load skill "hm-detective"
Reading modes: SKIM for orientation, SCAN for targeted extraction, DEEP for interface analysis
</execution_context>

---

## Three Compression Tiers

Every packing operation selects one tier. Default: Focused.

| Tier | Reduction | Content | When |
|------|-----------|---------|------|
| **Snapshot** | 0% | Full source, every line, every comment | Final audit, security review, legal compliance |
| **Focused** | ~50% | Tree-sitter signatures + key implementations (public exports, error paths, config) | Dependency analysis, code review prep, onboarding |
| **Signature** | ~70% | Types, interfaces, exports, module boundaries only | Architecture planning, API contract extraction, budget-constrained context |

### Decision Table

```
What do you need?
|
+-- "Every line matters" (audit, security, legal)
|   -> SNAPSHOT: repomix_pack_codebase(compress=false)
|
+-- "How does this work?" (review, onboarding, deps)
|   -> FOCUSED: repomix_pack_codebase(compress=true) + grep for key implementations
|
+-- "What's the shape?" (architecture, contracts, planning)
|   -> SIGNATURE: extract types/interfaces only (see interface-extraction.md)
|
+-- "I'm not sure yet"
|   -> FOCUSED: safest default, readable at half the cost
```

### Tier Comparison

| Property | Snapshot | Focused | Signature |
|----------|----------|---------|-----------|
| Full source | Yes | Signatures + selective body | Types only |
| Comments | Yes | Stripped | Stripped |
| Private members | Yes | No | No |
| Error handling paths | Yes | Yes | Signatures only |
| Import graph | Reconstruct | Reconstruct | Explicit |
| Avg tokens (1000 LOC) | ~8000 | ~4000 | ~2400 |

See [references/compression-tiers.md](references/compression-tiers.md) for per-language settings, repomix configuration, and worked examples.

---

## Cross-Dependency Analysis Protocol

5-step protocol. Run sequentially. No shortcuts.

```
MAP → CLASSIFY → DETECT → RESOLVE → VALIDATE
```

### MAP — List Every Dependency

```bash
grep -rn "import.*from\|require(" src/ --include="*.ts" > /tmp/deps-raw.txt
grep -rn "emit\|on(" src/ --include="*.ts" >> /tmp/deps-raw.txt
```

Output: raw import/require/event list with file:line pairs.

### CLASSIFY — Tag Each Dependency

| Category | Pattern | Example |
|----------|---------|---------|
| **internal** | Same package, `./` or `../` imports | `import { foo } from "./helpers"` |
| **external** | node_modules, npm packages | `import { z } from "zod"` |
| **peer** | Required but not bundled | `@opencode-ai/plugin` |
| **dev** | Build/test only | `vitest`, `typescript` |

### DETECT — Find Problems

| Problem | Detection |
|---------|-----------|
| Version conflict | Same package at different versions in dependency tree |
| Circular dependency | File A imports B, B imports A (direct or transitive) |
| Missing peer | Package used but not declared in `peerDependencies` |
| Orphan import | Import exists but symbol never referenced in body |
| Phantom dependency | Used but not declared in `package.json` |

### RESOLVE — Propose Fixes

For each detected problem, produce a JSON record:

```json
{
  "type": "circular_dependency",
  "files": ["src/lib/continuity.ts", "src/lib/lifecycle-manager.ts"],
  "severity": "high",
  "fix": "Extract shared types to src/lib/types.ts (leaf module)",
  "effort": "low"
}
```

### VALIDATE — Prove It Works

```bash
npm run typecheck
npm run build
npm test
```

All three must pass. If any fails, loop back to RESOLVE.

See [references/cross-dep-analysis.md](references/cross-dep-analysis.md) for dependency graph generation, circular dep visualization, and multi-package monorepo handling.

---

## Interface Extraction

Extract typed contracts from source code. Four extraction types:

| Contract Type | What You Get | Tool |
|---------------|-------------|------|
| **TypeScript types** | All `type`, `interface`, `enum` declarations | `grep -n "^export type\|^export interface\|^enum"` |
| **Module boundaries** | Public exports + their signatures | Read `index.ts` re-exports |
| **Event contracts** | `emit()` / `on()` signatures with payloads | `grep -n "emit\|\.on("` |
| **CLI contracts** | Command signatures, argument types | Parse frontmatter in command files |

### Extraction Template

For each extracted interface:

```markdown
## [ModuleName]

**Exports:**
- `functionName(param: Type): ReturnType` — [one-line purpose]
- `ClassName` — [one-line purpose]

**Events:**
- `event-name: { payload: Type }` — emitted when [condition]

**Dependencies:** [internal modules this depends on]
**Dependents:** [modules that depend on this]
```

See [references/interface-extraction.md](references/interface-extraction.md) for full templates, multi-file extraction, and contract validation.

---

## Pattern Classification

Classify code patterns from the analyzed codebase. Three tiers adapted from skill-synthesis:

| Tier | Name | Detection | Examples |
|------|------|-----------|----------|
| **P1** | Fundamental | < 200 LOC, 0-2 dependencies, single responsibility | Leaf utilities, pure helpers, type definitions |
| **P2** | Integration | 200-500 LOC, 3-8 dependencies, coordinates multiple modules | State machines, API wrappers, event handlers |
| **P3** | Utility | Cross-cutting, used by P2 modules, reusable across projects | Logging, error formatting, config loading |

### Classification Heuristics

```
1. Count lines in module
2. Count import dependencies
3. Check: single file? → P1 candidate
4. Check: imports from ≥3 internal modules? → P2 candidate
5. Check: imported by ≥5 other modules? → P3 candidate
6. Resolve conflicts: purpose beats size
```

### Evidence Requirements

Every classification needs:

- Line count (exact)
- Dependency count (exact)
- Import graph position (leaf / mid / root)
- One-sentence purpose statement
- Confidence level (high / medium / low)

See [references/pattern-classifier.md](references/pattern-classifier.md) for the full detection algorithm, edge cases, and classification output format.

---

## Corpus Gate

Pattern classification requires sufficient evidence. Do NOT classify with insufficient corpus.

### Minimum Requirements

| Requirement | Threshold | Why |
|-------------|-----------|-----|
| Repos analyzed | ≥ 3 | Prevents single-project bias |
| Artifacts extracted | ≥ 10 | Ensures pattern diversity |
| Organizations covered | ≥ 2 | Avoids org-specific conventions |
| Languages represented | ≥ 1 | Minimum viable (ideally 2+) |

### Validation Failure Triage

| Failure | Detection | Triage |
|---------|-----------|--------|
| **Insufficient repos** | Repo count < 3 | Expand search: add GitHub trending, related orgs, language-specific repos |
| **Insufficient artifacts** | Artifact count < 10 | Widen scope: include test files, config patterns, build scripts |
| **Single-org bias** | All repos from one org | Add repos from different organizations or community projects |
| **Pattern exhaustion** | No new patterns after 20 artifacts | Stop classification. Document what you have. Flag for manual review |

**Rule:** If the corpus gate fails, produce a gap report. Do NOT force classification with thin evidence.

See [references/corpus-gate.md](references/corpus-gate.md) for corpus assembly procedures, quality scoring, and anti-patterns.

---

## Tech-Stack Detection

Before any codebase packing operation, detect the technology stack. This informs compression tier selection, reference file loading, and Context7 query generation.

### Trigger

Run tech-stack detection when:
- `.tech-registry.json` is missing or stale (>30 days since `last_updated`)
- User asks "what's the tech stack?" or "analyze dependencies"
- Before repomix packing a new repository (informs `--include` patterns)

### Detection Protocol

```
Step 1: Check for .tech-registry.json
  - If present and recent (<30 days): use existing stack data
  - If missing/stale: proceed to Step 2

Step 2: Detect from repo root files
  - package.json → Node.js stack (language, runtime, frameworks, dependencies)
  - go.mod → Go stack (language, runtime, modules)
  - Cargo.toml → Rust stack (language, runtime, crates)
  - pyproject.toml / requirements.txt → Python stack
  - pom.xml / build.gradle → Java stack (Maven/Gradle)
  - tsconfig.json → TypeScript (supplement to any JS/Node stack)
  - bunfig.toml → Bun runtime (supplement to Node stack)

Step 3: Parse version information for Context7
  - package-lock.json / yarn.lock / pnpm-lock.yaml → exact dependency versions
  - Cargo.lock → exact crate versions
  - go.sum → exact module versions
  - Extract versions for Context7 `resolve-library-id` queries

Step 4: Write to .tech-registry.json using unified schema
  - See references/artifact-export.md for schema and update protocol
  - Ensure hm-detective and hm-deep-research can consume the same file
```

### Version Resolution

Extract exact versions from lockfiles and use them for Context7 queries:

| Lockfile | Version Source | Context7 Query Example |
|----------|---------------|------------------------|
| package-lock.json | `dependencies["next"].version` | "Next.js 14 app router API" |
| Cargo.lock | `[[package]] name="tokio" version="1.35"` | "tokio 1.35 async runtime patterns" |
| go.sum | `github.com/gin-gonic/gin v1.9.1` | "gin 1.9 middleware chaining" |

### Integration with Compression Tiers

- **Tech-stack detection runs at the SCAN tier** (~15% cost): grep for indicator files, read 5-10 key files
- Results inform which reference files to load during analysis:
  - Node.js → load `references/node-patterns.md` if available
  - Rust → load `references/rust-patterns.md` if available
- Stack data also guides repomix `--include` patterns (e.g., `src/**/*.ts` for TS, `src/**/*.rs` for Rust)

---

## Session Artifact Export

Investigation findings must survive context compaction. Three export mechanisms:

### 1. Patch-Based Updates

For updating existing files (tech registry, planning docs):

```
Read existing file → Modify specific fields → Write complete file back
Never overwrite without reading first.
```

### 2. ADR Format

For architecture decisions:

```markdown
# ADR-[NNN]: [Title]
**Date:** YYYY-MM-DD
**Status:** Proposed | Accepted | Deprecated

## Decision
[One sentence]

## Context
[Why this decision was needed]

## Consequences
- [What changes]
- [What breaks]
- [What new dependencies]
```

### 3. .tech-registry.json Integration

Append discoveries to the tech registry using the **unified hm-detective schema** (`project`, `last_updated`, `stack`, `concerns`, `modules`):

```json
{
  "modules": {
    "src/new-module.ts": {
      "role": "leaf",
      "loc": 45,
      "deps": ["src/types.ts"]
    }
  },
  "concerns": {
    "active": ["new-concern-id"]
  }
}
```

See [references/artifact-export.md](references/artifact-export.md) for the full schema specification, update protocol, and migration notes. The unified schema ensures `hm-detective`, `hm-synthesis`, and `hm-deep-research` all read and write the same `.tech-registry.json` format without corruption.

---

## Anti-Patterns

| Anti-Pattern | Detection | Fix |
|-------------|-----------|-----|
| **Over-Compression** | Signature tier used for security/audit work | Use Snapshot for anything requiring full source |
| **Classification Without Corpus** | Pattern claims without ≥3 repos, ≥10 artifacts | Run corpus gate first. Produce gap report if insufficient |
| **Stale Dependency Graph** | Dependencies listed but package.json changed since analysis | Re-run MAP step. Compare timestamps |
| **Interface Drift** | Extracted interfaces don't match running code | Validate with `npm run typecheck` after extraction |
| **Orphaned Artifact** | ADR or registry entry with no linked source file | Every artifact must reference its source file and line range |

## References (Progressive Disclosure)

Load references ONLY when the SKILL.md procedures are insufficient for your task.

- **[Compression Tiers](references/compression-tiers.md)** — Per-language settings, repomix config, worked examples
- **[Cross-Dependency Analysis](references/cross-dep-analysis.md)** — Full 5-step protocol, graph generation, monorepo handling
- **[Interface Extraction](references/interface-extraction.md)** — Templates, multi-file extraction, contract validation
- **[Pattern Classifier](references/pattern-classifier.md)** — Detection algorithm, edge cases, output format
- **[Corpus Gate](references/corpus-gate.md)** — Assembly procedures, quality scoring, anti-patterns
- **[Validated Playbooks](references/validated-playbooks.md)** — End-to-end synthesis workflows with validation gates
- **[Artifact Export](references/artifact-export.md)** — Export formats, naming conventions, promotion gates
