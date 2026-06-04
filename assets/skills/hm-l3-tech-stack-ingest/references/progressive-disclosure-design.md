# Progressive Disclosure Design — Ingested Tech Stacks

## Design Principle

```
Load only what is needed, when it is needed. Never load an entire ingested repo at skill load time.
```

Progressive disclosure means the agent sees a TOC first, then navigates to specific sections. The skill's SKILL.md loads without any ingested content. The ingested stacks sit on disk, indexed and searchable, but only loaded when an agent explicitly needs API signatures, types, or documentation from a specific stack.

## Why This Design

| Problem | Progressive Disclosure Solution |
|---------|-------------------------------|
| Ingested repos can be 100MB+ (e.g., LLVM, Chromium) | Agent loads TOC (5KB), then specific sections (20-50KB) |
| Context window is limited (200K tokens) | Never load more than one stack section at a time |
| Multiple stacks needed for cross-validation | Load each stack's TOC, then dive in as needed |
| Fast search across all stacks | grep across TOC files first, then read matching sections |

## Directory Structure

Every ingested tech stack follows this structure:

```
references/tech-stacks/<stack-name>/
│
├── TOC.md                    # ← LOADED FIRST. Table of contents with jump links.
│                             #    ~5-10KB. Always the entry point.
│
├── metadata.json             # ← LOADED SECOND (if needed).
│                             #    Version, source URL, ingest date, tags.
│                             #    ~1KB. Used for staleness checks.
│
├── architecture.md           # ← LOADED THIRD (if architecture is needed).
│                             #    Module map, dependency graph, core abstractions.
│                             #    ~5-20KB.
│
├── api/                      # ← LOADED ON DEMAND (when API signatures needed).
│   ├── index.md              #    API index with jump links to all sections.
│   ├── exports.md            #    All exported functions, classes, types.
│   ├── types.md              #    Type definitions and interfaces.
│   └── <module>.md           #    Per-module API details.
│
├── docs/                     # ← LOADED ON DEMAND (when documentation needed).
│   ├── index.md              #    Documentation index.
│   ├── getting-started.md    #    Installation and basic usage.
│   ├── core-concepts.md      #    Key concepts and architecture docs.
│   └── <topic>.md            #    Per-topic documentation.
│
├── examples/                 # ← LOADED ON DEMAND (when examples needed).
│   ├── index.md              #    Example index.
│   └── <use-case>.md         #    Per-use-case examples.
│
├── raw/                      # ← NEVER LOADED DIRECTLY by the agent.
│   └── <source-tool>-output.<ext>  # Raw ingested files. Used by scripts only.
│
└── changelog.md              # ← LOADED ON DEMAND (when tracking ingestion history).
                              #    Version history of this ingestion.
```

## Loading Order Protocol

When an agent needs to use an ingested tech stack, it follows this loading order:

```
1. CHECK if stack exists:
   ls references/tech-stacks/<stack-name>/

2. LOAD the TOC (always first):
   cat references/tech-stacks/<stack-name>/TOC.md

3. DECIDE what you need from the TOC:
   ├─ "I need to check the version" → cat metadata.json
   ├─ "I need to understand the architecture" → cat architecture.md
   ├─ "I need API signatures" → cat api/index.md → cat api/exports.md
   ├─ "I need documentation" → cat docs/index.md → cat docs/<topic>.md
   └─ "I need examples" → cat examples/index.md → cat examples/<use-case>.md

4. SEARCH within the loaded section using grep (only after loading):
   grep "export function" api/exports.md
   grep "interface " api/types.md

5. NEVER load raw/ files. They are source material, not reference content.
```

## Content Format Rules

### TOC.md Format

The TOC must be the first file loaded. It must be concise (<10KB) and contain ONLY jump links — not the actual content.

```markdown
# <Package Name> v<version> — Tech Stack Reference

**Ingested:** YYYY-MM-DD | **Source:** <repo-url> | **Ecosystem:** <npm/pip/go/...>

## Documentation Sections

### Architecture
- [Architecture Overview](architecture.md#architecture-overview)
  - [Module Map](architecture.md#module-map)
  - [Dependency Graph](architecture.md#dependency-graph)
  - [Core Abstractions](architecture.md#core-abstractions)

### API Reference
- [API Index](api/index.md)
  - [Exported Functions](api/exports.md#exported-functions)
  - [Exported Types](api/exports.md#exported-types)
  - [Exported Classes](api/exports.md#exported-classes)
  - [Type Definitions](api/types.md)
  - [Interfaces](api/types.md#interfaces)

### Documentation
- [Documentation Index](docs/index.md)
  - [Getting Started](docs/getting-started.md)
  - [Core Concepts](docs/core-concepts.md)
  - [Advanced Usage](docs/advanced-usage.md)
  - [API Reference](docs/api-reference.md)

### Examples
- [Example Index](examples/index.md)
  - [Basic Usage](examples/basic-usage.md)
  - [Common Patterns](examples/common-patterns.md)

### Meta
- [Metadata](metadata.json) — version, source, ingest info
- [Changelog](changelog.md) — ingestion history
```

### metadata.json Format

```json
{
  "stack_name": "zod",
  "display_name": "Zod",
  "version": "4.3.6",
  "version_exact": "4.3.6",
  "source_url": "https://github.com/colinhacks/zod",
  "ecosystem": "npm",
  "package_type": "utility",
  "ingest_date": "2026-04-28",
  "ingest_tool": "repomix + context7 + deepwiki",
  "last_validated": "2026-04-28",
  "checksum": "",
  "tags": ["schema", "validation", "typescript", "runtime-type-checking"],
  "dependencies_of": ["hivemind-harness"],
  "source_files": {
    "repomix": "raw/repomix-output.xml",
    "context7": "api/context7-exports.md",
    "deepwiki": "docs/deepwiki-contents.md"
  },
  "size_kb": {
    "total": 4500,
    "api": 1200,
    "docs": 2800,
    "examples": 500
  }
}
```

### architecture.md Format

The architecture file must include:

1. **Module Map** — directory tree showing source organization
2. **Core Abstractions** — table of key classes/functions/types and their purpose
3. **Dependency Graph** — how modules depend on each other (leaf to entry point)
4. **Entry Points** — what's exported publicly, main entry files
5. **Design Patterns** — notable patterns used (factory, builder, chain-of-responsibility, etc.)

### api/ Files Format

Each API file must use consistent formatting for grep-ability:

```markdown
# Exported Functions

## `functionName(param1: Type, param2: Type): ReturnType`

**Module:** `src/module.ts`
**Source line:** 42

Description of what this function does.

### Parameters
- `param1` (Type) — description
- `param2` (Type) — description

### Returns
- `ReturnType` — description

### Example
\`\`\`typescript
const result = functionName("value", 42);
\`\`\`
```

The key: every symbol (function, class, type, interface) must have its source module and line number. This enables `hm-synthesis` and quality gates to cite real source locations.

## Search Strategy

### Finding Anything in Any Stack

```bash
# 1. Find all stacks
ls references/tech-stacks/

# 2. Search across ALL stacks (TOC-level only)
grep -r "<keyword>" references/tech-stacks/*/TOC.md

# 3. Search within a specific stack
grep -r "<keyword>" references/tech-stacks/<stack-name>/api/
grep -r "<keyword>" references/tech-stacks/<stack-name>/docs/

# 4. Find all exported symbols across all stacks
grep -r "^## \`" references/tech-stacks/*/api/exports.md
```

### Token Budget Awareness

| Operation | Approximate Token Cost |
|-----------|----------------------|
| `ls references/tech-stacks/` | ~50 tokens |
| `cat references/tech-stacks/<name>/TOC.md` | ~1,000-2,500 tokens |
| `cat references/tech-stacks/<name>/metadata.json` | ~200-500 tokens |
| `cat references/tech-stacks/<name>/architecture.md` | ~1,500-5,000 tokens |
| `cat references/tech-stacks/<name>/api/exports.md` | ~3,000-15,000 tokens (depends on API size) |
| `grep "export function" references/tech-stacks/<name>/api/exports.md` | ~500-1,500 tokens |
| Full stack load (all files) | ~20,000-200,000+ tokens — AVOID |

## Indexing and Cross-Reference

### Master Index (`references/tech-stacks/index.json`)

This file is the single source of truth for what's been ingested:

```json
{
  "last_updated": "2026-04-28T03:00:00Z",
  "total_stacks": 3,
  "stacks": [
    {
      "name": "@opencode-ai/plugin",
      "version": "1.14.19",
      "ecosystem": "npm",
      "path": "references/tech-stacks/opencode-ai-plugin/",
      "ingested": "2026-04-28",
      "tags": ["sdk", "opencode", "plugin", "typescript"],
      "size_kb": 3200
    },
    {
      "name": "zod",
      "version": "4.3.6",
      "ecosystem": "npm",
      "path": "references/tech-stacks/zod/",
      "ingested": "2026-04-28",
      "tags": ["schema", "validation", "typescript"],
      "size_kb": 4500
    }
  ]
}
```

### Cross-Stack Dependency Tracking

Some stacks depend on others. Track this in metadata:

```json
{
  "stack_name": "@opencode-ai/plugin",
  "dependencies": ["@opencode-ai/sdk"],
  "dependencies_of": [],
  "peer_dependencies": ["zod"]
}
```

When quality gates validate an SDK like `@opencode-ai/plugin`, they may also need `zod` (peer dep) and `@opencode-ai/sdk` (transitive dep). The cross-reference enables discovering these relationships.

## Design Anti-Patterns

| Anti-Pattern | Why It's Wrong | Correct Pattern |
|-------------|---------------|-----------------|
| Loading `raw/` files directly | These are source material, not reference content. They can be 100MB+. | Always route through organized `api/`, `docs/`, `examples/` files. |
| Loading all stacks at once | Context window explosion. One stack alone is 20K-200K tokens. | Load one TOC at a time. Load specific sections as needed. |
| Skipping the TOC | Without the TOC, the agent doesn't know what's available and loads everything. | Always `cat TOC.md` first. |
| No metadata.json | Without version tracking, stale docs get used for validation. | Always create metadata.json. Always check staleness. |
| Disorganized api/ structure | grep can't find specific symbols without consistent formatting. | Use the standard format from `api/ Files Format` above. |
| No cross-referencing | Quality gates don't know about transitive dependencies to validate. | Track `dependencies` and `peer_dependencies` in metadata. |
