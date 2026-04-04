# Codebase Investigation

## Table of Contents

- [Broad-to-Deep Investigation Methodology](#broad-to-deep-investigation-methodology)
- [Repomix Commands Reference](#repomix-commands-reference)
- [OpenCode Built-In Tools for Investigation](#opencode-built-in-tools-for-investigation)
- [Investigation Agent Selection](#investigation-agent-selection)

## Broad-to-Deep Investigation Methodology

Five phases. Each builds on the prior. No skipping.

| Phase | Action | Output |
|-------|--------|--------|
| **1. High-level map** | Repomix pack entire codebase or specific directory → XML output → grep for module boundaries, exports, entry points | Module graph showing which modules exist, what they export |
| **2. Pipeline map** | Attach packed output → grep for data flow patterns, interface boundaries, type definitions | Interface inventory — what each module exposes |
| **3. Journey map** | Trace specific features through modules, identify dependency chains | Dependency chains — how modules connect |
| **4. Low-level proof** | Targeted file reads with offset for implementation details | Implementation evidence — exact code behavior |
| **5. Cross-pass synthesis** | Combine findings from all phases into unified domain model | Domain model — how everything fits together |

**Phase rules:**
- Phase 1 must complete before Phase 2 (you need the map before tracing pipelines)
- Phase 3 requires Phase 2 output (you need interfaces before tracing features)
- Phase 4 is targeted — only read files identified in Phase 3
- Phase 5 cannot produce output until Phases 1-4 are complete

## Repomix Commands Reference

| Command | Purpose | Notes |
|---------|---------|-------|
| `repomix --remote <repo>` | Pack remote repository | Fetches and packages the entire repo |
| `repomix .` | Pack local directory | Respects .gitignore |
| `--compress` | Tree-sitter compression | 70% token reduction, preserves signatures/interfaces/types |
| `--format xml` | XML output (default) | Claude-optimized (Anthropic recommends XML tags) |
| `--format json` | JSON output | Programmatic synthesis (jq extraction) |
| `--format markdown` | Markdown output | Human-readable reports |
| `--format plain` | Plain text output | Universal compatibility |

**Attach → Grep workflow:**
1. Pack produces an output ID
2. `repomix_attach_packed_output` loads the packed content
3. `repomix_grep_repomix_output` searches within attached output using regex
4. `repomix_read_repomix_output` reads specific line ranges

## OpenCode Built-In Tools for Investigation

| Tool | Command | Use When |
|------|---------|----------|
| **grep** | Regex search across codebase (ripgrep) | Finding specific patterns, imports, usages |
| **glob** | File pattern matching | Discovering file structure, finding test files |
| **list** | Directory listing | Understanding project layout |
| **read** | File reads with offset | Large files — read specific sections |
| **lsp** | goToDefinition, findReferences, hover, workspaceSymbol | Tracing definitions and usages (when available) |
| **websearch** | Exa AI external research | Validating patterns against documentation |

**Tool selection for investigation:**
- Need to find where something is used → grep
- Need to know what files exist → glob
- Need to understand a file's content → read (with offset for large files)
- Need to trace a definition → lsp (when available)
- Need external validation → websearch

## Investigation Agent Selection

| Agent | Use When | Scope |
|-------|----------|-------|
| `hivexplorer` | Read-only broad sweeps | Codebase investigation, session analysis |
| `hiverd` | External research + documentation | MCP tools, library validation |
| `architect` | Architecture validation | Design decisions, pattern validation |
| `hivemaker` | Investigation reveals implementation needed | Code changes required after investigation |

**Dispatch rules:**
- Wave 1: `hivexplorer` for broad sweeps (parallel)
- Wave 2: `hiverd` for targeted external research
- Wave 3: `architect` for design validation
- Only dispatch `hivemaker` when investigation findings require code changes
