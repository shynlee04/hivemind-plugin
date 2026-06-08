---
name: hm-l3-synthesis
description: Compress research findings into actionable artifacts with tiered reduction. Use when packing codebases, extracting interfaces, or producing validated reports. Stage 3 of the hm-research-chain pipeline. Consumes findings from hm-detective and evidence from hm-deep-research. Uses cached API signatures from hm-tech-stack-ingest for validation. NOT for raw data collection or unfiltered dumps.
metadata:
  consumed-by:
    - "hm-l2-synthesizer"
    - "hf-l2-synthesizer"
  lineage-scope: "hm+hf"
  access: "FLEXIBLE"
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
| "Sources disagree" | Contradiction + Consensus | [templates/contradiction-consensus.md](templates/contradiction-consensus.md) |

<execution_context>
For reading modes during analysis: load skill "hm-detective"
Reading modes: SKIM for orientation, SCAN for targeted extraction, DEEP for interface analysis

For cached tech stack assets (offline API signatures for validation): load skill "hm-tech-stack-ingest"
Use cached API signatures to validate against REAL code before generating artifacts or quality gates.

For research findings to synthesize: load skill "hm-deep-research"
hm-synthesis consumes structured research outputs with citations and evidence levels.

For chain orchestration: load skill "hm-research-chain"
hm-synthesis is Stage 3 of the canonical research chain.
</execution_context>

---

## Three Compression Tiers

Every packing operation selects one tier. Default: Focused.

### Evidence-Backed Synthesis Gate

Before producing a final report, plan, or reusable artifact:

1. Group findings into themes only after each theme has cited evidence.
2. Fill `templates/contradiction-consensus.md` for conflicts, weak consensus, or unresolved claims.
3. Add a methodology/limitations section when sources are partial, stale, vendor-biased, or inaccessible.
4. Separate recommendations from facts; recommendations need rationale and alternatives.
5. Export provenance: source list, reviewed materials, unresolved gaps, and continuation path.

**BLOCKED rule:** If a high-impact contradiction remains unresolved, the artifact may recommend investigation, but it must not claim a settled answer.

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
| **peer** | Required but not bundled | e.g., `react` for a React plugin, `express` for middleware |
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
- Results inform which project-local adapters or documented conventions to load during analysis:
  - Node.js → inspect package metadata, lockfiles, build config, and existing project docs
  - Rust → inspect Cargo manifests, feature flags, module exports, and existing project docs
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

## Self-Correction

When synthesis produces unreliable artifacts or hits a dead end, use these correction modes:

### Mode 1: Over-Compression (Signature tier used where Snapshot was needed)

```
What was the compression objective?
├── Security audit, legal compliance → MUST use Snapshot (0% reduction). Re-run with compress=false.
├── Code review, onboarding → Focused is appropriate. If still too thin, re-run with compress=false on key files.
├── Architecture planning → Signature may be sufficient. If missing crucial impl details, escalate to Focused.
└── Unsure → Default to Focused. Never use Signature for audit/security work.
```

### Mode 2: Corpus Gate Failure (insufficient evidence for classification)

```
Which criterion failed?
├── Repos < 3 → expand search: add GitHub trending repos, related orgs, language-specific repos
├── Artifacts < 10 → widen scope: include test files, config patterns, build scripts
├── Single org → add repos from different organizations or community projects
├── Pattern exhaustion (no new patterns after 20 artifacts) → stop classification, document what you have, flag for manual review
└── All criteria met but classification is shaky → produce a gap report, do NOT force classification
```

### Mode 3: Contradiction Consensus Failure (sources disagree, no resolution)

```
1. Fill templates/contradiction-consensus.md with each position and evidence
2. If high-impact contradiction → artifact recommends investigation, does NOT claim settled answer
3. If low-impact → document the disagreement, pick one with rationale, note the alternative
4. If tied on evidence → document both, flag for external decision
```

### Mode 4: Artifact Validation Failure (generated artifact doesn't match source)

```
1. Re-read the source findings from hm-deep-research or hm-detective
2. Check if the source was stale (re-run staleness check on .tech-registry.json)
3. If hm-tech-stack-ingest has cached API signatures → validate artifact claims against cached source
4. If validation still fails → re-run the synthesis from scratch with fresh source reads
5. If source itself is questionable → route back to hm-deep-research for re-investigation
```

### Mode 5: Dependency Graph Staleness (package.json changed since last MAP)

```
1. Compare timestamps: ls -la package.json against .tech-registry.json last_updated
2. If out of sync → re-run MAP step: grep import/require/emit
3. Re-run CLASSIFY → DETECT → RESOLVE sequence
4. Validate: npm run typecheck && npm run build && npm test
```

### Maximum Correction Attempts

3 per synthesis task. After 3 correction cycles without resolution:
- Produce artifact with methodology/limitations section
- Document unresolved contradictions and gaps
- Export provenance: sources reviewed, blocked sources, continuation path
- Do NOT claim settled answers for unresolved high-impact contradictions

## Cross-References

### Research Chain Position

```
hm-tech-stack-ingest → hm-detective → hm-deep-research → hm-synthesis
         (upstream)    (upstream)     (upstream)     (this skill)
```

hm-synthesis is **Stage 3 (Synthesize)** of the canonical `hm-research-chain` pipeline.

### Upstream Skills (Feeds Into This Skill)

| Related Skill | Boundary |
|---------------|----------|
| `hm-tech-stack-ingest` | Cached API signatures, type definitions, and repo references for offline validation. Use cached assets to verify generated artifacts against REAL code. |
| `hm-detective` | Codebase map, `.tech-registry.json`, and dependency graph. hm-detective provides the structural understanding needed for pattern classification and interface extraction. |
| `hm-deep-research` | Structured research findings with citations, evidence levels, contradiction matrices, and source evaluations. hm-synthesis compresses these into artifacts. |

### Downstream Skills (This Skill Feeds Into)

| Related Skill | Boundary |
|---------------|----------|
| `hm-research-chain` | hm-synthesis produces the final artifact that hm-research-chain exports and persists with continuation metadata. |

### Related / Sibling Skills

| Related Skill | Boundary |
|---------------|----------|
| `hm-research-chain` | Orchestrator. hm-synthesis is Stage 3 of the chain. hm-research-chain triggers hm-synthesis after Stage 2 research completes and routes its output to artifact export. |

### Boundary Clarification

| Nearby Skill | What hm-synthesis Does | What the Other Skill Does |
|-------------|----------------------|--------------------------|
| `hm-tech-stack-ingest` | Uses cached API signatures to validate generated artifacts; does NOT download repositories | Downloads, caches, and organizes third-party repositories as bundled assets |
| `hm-detective` | Compresses codebase structure into pattern classifications and interface extractions | Investigates the live codebase with SCAN/READ/DEEP modes |
| `hm-deep-research` | Synthesizes, compresses, and restructures research findings into actionable artifacts | Generates structured research findings with MCP tools and multi-source evidence |
| `hm-research-chain` | Executes Stage 3 artifact compression when triggered by the chain | Orchestrates the full ingest → detect → research → synthesize pipeline |
