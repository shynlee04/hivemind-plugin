# Repomix Workflows

## Table of Contents

- [Core Repomix Workflows](#core-repomix-workflows)
- [Output Format Selection](#output-format-selection)
- [Compression Decision Matrix](#compression-decision-matrix)
- [Skill Generation Workflow](#skill-generation-workflow)
- [Repomix + MCP Tool Chain](#repomix--mcp-tool-chain)

## Core Repomix Workflows

| Workflow | Tool/Command | Purpose |
|----------|-------------|---------|
| **Pack** | `repomix .` or `repomix --remote <github-url>` | Package codebase into consolidated output |
| **Compress** | `--compress` flag | Tree-sitter compression (70% token reduction) |
| **Attach** | `repomix_attach_packed_output` | Load existing packed output by path or ID |
| **Grep** | `repomix_grep_repomix_output` | Targeted regex search in packed output |
| **Read** | `repomix_read_repomix_output` | Read specific line ranges from packed output |

**Pack → Grep → Read pipeline:**
1. Pack the codebase → get output ID
2. Attach the packed output
3. Grep for specific patterns (imports, exports, types, usages)
4. Read specific line ranges for detailed analysis

**Pack remote:**
```bash
repomix --remote https://github.com/user/repo
```

**Pack local with compression:**
```bash
repomix . --compress --format xml
```

## Output Format Selection

| Format | Use When | Token Efficiency |
|--------|----------|-----------------|
| **XML** (default) | Claude analysis — Anthropic recommends XML tags | Good |
| **JSON** | Programmatic synthesis — jq extraction, scripts | Good |
| **Markdown** | Human-readable reports, documentation | Lower |
| **Plain text** | Universal compatibility, minimal overhead | Highest |

**Decision rule:** Default to XML for Claude analysis. Use JSON when grep results need programmatic processing. Use Markdown when output goes to human-readable reports.

## Compression Decision Matrix

| Scenario | Use Compression? | Why |
|----------|-----------------|-----|
| Architecture analysis | ✅ Yes | Need signatures, not implementations |
| Pattern extraction | ✅ Yes | Patterns are in structure, not detail |
| API signature review | ✅ Yes | Interfaces are preserved in compression |
| >50 files | ✅ Yes | Token budget requires reduction |
| Bug investigation | ❌ No | Need full context for debugging |
| Implementation details | ❌ No | Compression strips implementation code |
| <50 files | ❌ No | Token savings not worth information loss |

**Gotcha:** Compression is experimental — may change between versions. Compressed output shows `⋮----` markers indicating removed sections. If you see these markers, know that implementation detail has been stripped.

## Skill Generation Workflow

`repomix_generate_skill` creates SKILL.md + references/ from codebase:

1. Analyzes codebase structure
2. Extracts relevant code content
3. Auto-detects tech stack
4. Generates SKILL.md with metadata + references with project details
5. Output to `.claude/skills/<skill-name>/` or project-scoped directory

**Output structure:**
```
.claude/skills/<skill-name>/
├── SKILL.md              # Entry point with usage guide
└── references/
    ├── summary.md        # Purpose, format, statistics
    ├── project-structure.md  # Directory tree with line counts
    ├── files.md          # All file contents
    └── tech-stack.md     # Languages, frameworks, dependencies
```

## Repomix + MCP Tool Chain

| Composition | Pipeline | Use When |
|-------------|----------|----------|
| Repomix → Context7 | Pack codebase → resolve library IDs → query docs | Validating library usage patterns |
| Repomix → Deepwiki | Pack repo → ask questions about structure | Understanding unfamiliar codebases |
| Repomix → Tavily | Pack sessions → grep patterns → web research | Validating decisions against current best practices |
| Repomix → Exa | Pack codebase → grep for patterns → code search | Finding similar implementations elsewhere |

**Full chain:** Repomix packs codebase → grep extracts patterns → Context7/Deepwiki provides context → Tavily/Exa validates externally → Synthesize findings.
