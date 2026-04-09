# Bundle Scan — Platform/Reference Skills (2026-04-09)

## Auditor: C | Scope: 3 skills

---

## SKILL: opencode-platform-reference

**Location:** `.claude/skills/opencode-platform-reference/`
**Alternative locations checked:** `.opencode/skills/opencode-platform-reference/` — NOT FOUND

### Directory Structure

```
.claude/skills/opencode-platform-reference/
├── .DS_Store
├── SKILL.md
└── references/
    ├── opencode-agents.md          (611 lines)
    ├── opencode-built-in-tools.md  (275 lines)
    ├── opencode-commands.md        (242 lines)
    ├── opencode-configs.md         (555 lines)
    ├── opencode-custom-tools.md    (156 lines)
    ├── opencode-formatter.md       (105 lines)
    ├── opencode-github.md          (275 lines)
    ├── opencode-lsp-servers.md     (149 lines)
    ├── opencode-mcp-servers.md     (402 lines)
    ├── opencode-models.md          (183 lines)
    ├── opencode-permissions.md     (196 lines)
    ├── opencode-plugins.md         (294 lines)
    ├── opencode-rules.md           (145 lines)
    ├── opencode-sdk.md             (302 lines)
    ├── opencode-server.md          (161 lines)
    ├── opencode-share-usage.md      (83 lines)
    ├── opencode-skills.md          (157 lines)
    ├── opencode-troubleShooting.md (207 lines)
    ├── repomix-opencode.md         (737,755 lines)
    └── repomix-opencode.xml        (717,834 lines)
```

### scripts/

| Script | Exists? | Lines | Purpose | Called From SKILL.md | Dependencies |
|--------|---------|-------|---------|---------------------|-------------|
| *(none)* | — | — | — | — | — |

**No scripts/ directory exists.**

### references/

| File | Exists? | Lines | Purpose | Required/Mandatory | Covers What |
|------|---------|-------|---------|---------------------|-------------|
| opencode-agents.md | YES | 611 | Agent definition, modes, configuration, permissions | Listed in SKILL.md table | Agent setup, switching, @ mention, subtask spawning |
| opencode-built-in-tools.md | YES | 275 | All built-in tools (read, write, edit, bash, glob, grep, task, skill) | Listed in SKILL.md table | Tool permissions, built-in tool reference |
| opencode-commands.md | YES | 242 | Slash commands, frontmatter, template placeholders | Listed in SKILL.md table | Custom command creation, frontmatter fields |
| opencode-configs.md | YES | 555 | Full opencode.json schema, config precedence, variable substitution | Listed in SKILL.md table | JSON/JSONC config format, all config keys |
| opencode-custom-tools.md | YES | 156 | Custom tool creation, tool.schema (Zod), Python tools | Listed in SKILL.md table | Tool definition, TypeScript/JS, Python tools |
| opencode-formatter.md | YES | 105 | Code formatter configuration | Listed in SKILL.md table | Language-specific formatters |
| opencode-github.md | YES | 275 | GitHub integration (issues, PRs, Actions) | Listed in SKILL.md table | /opencode mentions, CI runner, triage |
| opencode-lsp-servers.md | YES | 149 | LSP server configuration | Listed in SKILL.md table | Language server integration, diagnostics |
| opencode-mcp-servers.md | YES | 402 | MCP server setup (local and remote) | Listed in SKILL.md table | MCP config, tool discovery, caveats |
| opencode-models.md | YES | 183 | Model providers, model selection | Listed in SKILL.md table | 75+ LLM providers, local models |
| opencode-permissions.md | YES | 196 | Permission system, cascading, glob patterns, per-agent overrides | Listed in SKILL.md table | allow/deny/ask, cascading rules |
| opencode-plugins.md | YES | 294 | Plugin system, hooks, tool registration, dependencies | Listed in SKILL.md table | tool.execute.before/after, event hooks, compacting |
| opencode-rules.md | YES | 145 | Rules system (AGENTS.md, project/global scopes) | Listed in SKILL.md table | Rule files, custom instructions |
| opencode-sdk.md | YES | 302 | Full SDK API (session CRUD, prompt, abort, events, TUI control) | Listed in SKILL.md table | JS/TS client, programmatic control |
| opencode-server.md | YES | 161 | Server configuration (opencode serve) | Listed in SKILL.md table | HTTP server, headless mode |
| opencode-share-usage.md | YES | 83 | Session sharing (public links) | Listed in SKILL.md table | Share conversations, collaboration |
| opencode-skills.md | YES | 157 | Skill discovery, SKILL.md format, permissions, loading | Listed in SKILL.md table | Skill locations, on-demand loading |
| opencode-troubleShooting.md | YES | 207 | Troubleshooting guide (logs, debugging) | Listed in SKILL.md table | Log locations, common issues |
| repomix-opencode.md | YES | 737,755 | Full OpenCode source code (markdown packed format) | Listed in SKILL.md table | Complete source for deep analysis |
| repomix-opencode.xml | YES | 717,834 | Full OpenCode source code (XML packed format) | Listed in SKILL.md table | Complete source for attach_packed_output |

### assets/

| File | Exists? | Purpose |
|------|---------|---------|
| *(none)* | — | — |

**No assets/ directory exists.**

### Discrepancies

- **No phantom references.** All 20 files listed in SKILL.md table exist on disk.
- **No orphan files.** All files on disk are referenced in the SKILL.md table.
- **Naming inconsistency:** `opencode-troubleShooting.md` uses camelCase (`troubleShooting`) while all other files use lowercase kebab-case. This is cosmetic but breaks consistency.
- **Extraneous file:** `.DS_Store` exists in the directory — not a source file, should be gitignored.

### Conflicts

- None with other skills in this audit scope. This skill is a standalone reference bundle.

### Gaps

- **No scripts/ directory.** This is acceptable — the skill is purely reference material. No scripts are needed for its purpose.
- **No assets/ directory.** Same rationale — no binary assets needed.
- **Massive file sizes:** The two repomix packed files (repomix-opencode.md at 737K lines, repomix-opencode.xml at 717K lines) together are ~1.46M lines. These are extremely large. Agents reading these files would consume enormous context windows. The structured reference files (18 md files, ~4.5K lines total) are the practical entry point.
- **No index/search guide:** While SKILL.md lists all files, it doesn't provide guidance on which reference to consult for specific use cases (e.g., "to understand hooks → opencode-plugins.md").

---

## SKILL: opencode-non-interactive-shell

**Location:** `.claude/skills/opencode-non-interactive-shell/`
**Alternative locations checked:** `.opencode/skills/opencode-non-interactive-shell/` — NOT FOUND

### Directory Structure

```
.claude/skills/opencode-non-interactive-shell/
└── SKILL.md  (237 lines)
```

### scripts/

| Script | Exists? | Lines | Purpose | Called From SKILL.md | Dependencies |
|--------|---------|-------|---------|---------------------|-------------|
| *(none)* | — | — | — | — | — |

**No scripts/ directory exists.**

### references/

| File | Exists? | Lines | Purpose | Required/Mandatory | Covers What |
|------|---------|-------|---------|---------------------|-------------|
| *(none)* | — | — | — | — | — |

**No references/ directory exists.**

### assets/

| File | Exists? | Purpose |
|------|---------|---------|
| *(none)* | — | — |

**No assets/ directory exists.**

### Discrepancies

- **No phantom references.** SKILL.md contains no file references — it's entirely self-contained.
- **No orphan files.** Only SKILL.md exists.
- **SKILL.md references example scripts in code blocks** (lines 152, 157, 170) — these are illustrative only, not actual files:
  - `./install_script.sh` (line 152) — example, not a real file
  - `./configure.sh` (line 157) — example, not a real file
  - `./potentially_hanging_script.sh` (line 170) — example, not a real file

### Conflicts

- None. This skill is fully self-contained with no external dependencies.

### Gaps

- **No scripts/ directory.** This is acceptable — the skill provides behavioral guidelines, not executable scripts.
- **No references/ directory.** The skill could benefit from a reference file listing all known non-interactive flags for common CLI tools (a machine-parseable lookup table), but this is not critical.
- **Potential enhancement:** A `references/banned-commands.txt` or `references/non-interactive-flags.json` could make this skill programmatically queryable by other skills/tools. Currently all knowledge is embedded in the SKILL.md markdown tables.

---

## SKILL: oh-my-openagent-reference

**Location:** `.claude/skills/oh-my-openagent-reference/`
**Alternative locations checked:** `.opencode/skills/oh-my-openagent-reference/` — NOT FOUND

### Directory Structure

```
.claude/skills/oh-my-openagent-reference/
├── .DS_Store
├── SKILL.md  (55 lines)
└── references/
    ├── files.md                       (276,602 lines)
    ├── oh-my-openagent-full.xml       (276,597 lines)
    ├── project-structure.md           (4 lines)
    └── summary.md                     (48 lines)
```

### scripts/

| Script | Exists? | Lines | Purpose | Called From SKILL.md | Dependencies |
|--------|---------|-------|---------|---------------------|-------------|
| *(none)* | — | — | — | — | — |

**No scripts/ directory exists.**

### references/

| File | Exists? | Lines | Purpose | Required/Mandatory | Covers What |
|------|---------|-------|---------|---------------------|-------------|
| summary.md | YES | 48 | Start here — purpose, format explanation, statistics | Listed in SKILL.md table | File structure overview, usage guidelines, stats |
| project-structure.md | YES | 4 | Directory tree with line counts per file | Listed in SKILL.md table | Single file listing: `repomix-oh-my-openagents.xml (276598 lines)` |
| files.md | YES | 276,602 | All file contents from packed repo (markdown format) | Listed in SKILL.md table | Full OMO source code, searchable via `## File: <path>` |
| oh-my-openagent-full.xml | YES | 276,597 | Full packed repo (original repomix XML format) | Listed in SKILL.md table | Complete repo for attach_packed_output/grep_repomix_output |

### assets/

| File | Exists? | Purpose |
|------|---------|---------|
| *(none)* | — | — |

**No assets/ directory exists.**

### Discrepancies

- **PHANTOM REFERENCE (Critical):** `summary.md` (line 19) lists `tech-stack.md` in its file structure table:
  ```
  | `tech-stack.md` | Languages, frameworks, and dependencies |
  ```
  **This file does NOT exist on disk.** The repomix generate_skill tool created summary.md with a reference to a file it apparently did not produce. This is a phantom reference.
  
- **PROJECT-STRUCTURE MISMATCH (Minor):** `project-structure.md` contains only 4 lines — a single file entry:
  ```
  repomix-oh-my-openagents.xml (276598 lines)
  ```
  This is misleading. The "project structure" should show the original OMO repo's directory tree, not just the repomix output file. The repomix generation appears to have been misconfigured or the structure extraction failed.

- **FILES.MD vs OH-MY-OPENAGENT-FULL.XML REDUNDANCY:** These two files contain essentially the same content in different formats:
  - `files.md`: Markdown format (276,602 lines)
  - `oh-my-openagent-full.xml`: XML format (276,597 lines)
  
  Together they're ~553K lines of largely duplicated content. The XML file is the authoritative repomix output; `files.md` is a repomix-generated markdown rendering of the same data.

- **Extraneous file:** `.DS_Store` in the directory.

### Conflicts

- None with other skills in this audit scope.

### Gaps

- **No scripts/ directory.** Acceptable — reference-only skill.
- **No assets/ directory.** Acceptable — no binary assets needed.
- **Missing tech-stack.md** — referenced by summary.md but not generated. Impact: Low (languages/frameworks can be inferred from files.md content).
- **project-structure.md is essentially empty** — only shows the repomix output filename, not the actual OMO project directory tree. This severely limits its usefulness as a navigation aid.
- **No dedicated topic references:** Unlike opencode-platform-reference which has 18 topic-specific reference files, this skill has only 2 monolithic files (files.md + xml). There are no extracted topic references for OMO's key subsystems (plugin system, hooks, circuit breaker, skill loader, session continuity).

---

## AGGREGATE FINDINGS

### Scripts Summary

| Metric | Value |
|--------|-------|
| Total scripts across all 3 skills | 0 |
| Skills with scripts/ directory | 0 |
| With clear purpose | N/A |
| With dependencies | N/A |
| Phantom script references | 0 |

**Assessment:** None of the 3 audited skills have scripts. This is expected — all 3 are reference/pattern skills (Layer 3, role: reference). They provide documentation and packed codebases, not executable logic.

### References Summary

| Metric | Value |
|--------|-------|
| Total reference files across all 3 skills | 24 |
| Total lines of reference content | ~1,733,414 |
| opencode-platform-reference: 20 files | 1,455,589 lines (99.5% in 2 repomix files) |
| opencode-non-interactive-shell: 0 files | 0 lines (all content in SKILL.md) |
| oh-my-openagent-reference: 4 files | 553,251 lines (99.96% in 2 packed files) |

**Practical reference content (excluding repomix packs):**

| Skill | Structured refs | Lines | Purpose |
|-------|----------------|-------|---------|
| opencode-platform-reference | 18 topic .md files | ~4,548 | OpenCode platform documentation |
| opencode-non-interactive-shell | 0 | 0 | Self-contained SKILL.md (237 lines) |
| oh-my-openagent-reference | 2 (summary + project-structure) | 52 | Metadata only; real content in packed files |

### Overlapping Coverage

| Topic | Skill A | Skill B | Nature |
|-------|---------|---------|--------|
| Shell safety patterns | opencode-non-interactive-shell | opencode-platform-reference (repomix source) | OMO source may contain similar patterns in its built-in skills, but the non-interactive-shell skill is specifically authored for this project's harness needs |
| Plugin system design | oh-my-openagent-reference | opencode-platform-reference (opencode-plugins.md) | Different scope — OMO's plugin system vs OpenCode's plugin system. Not a true conflict, different platforms. |

### Conflicts Found

| Script/Ref | Skill A | Skill B | Nature of Conflict |
|------------|---------|---------|-------------------|
| *(none)* | — | — | No functional conflicts found between these 3 skills |

All 3 skills serve distinct, non-overlapping purposes:
1. **opencode-platform-reference** → OpenCode platform API and configuration reference
2. **opencode-non-interactive-shell** → Shell safety and non-interactive execution patterns
3. **oh-my-openagent-reference** → Oh-My-OpenAgent codebase as design reference for harness patterns

### Gap Summary

| Skill | Missing Bundle | Impact | Severity |
|-------|---------------|--------|----------|
| opencode-platform-reference | No search guide / index for 18 reference files | Medium — agents must scan SKILL.md table to find the right reference. A use-case-to-reference mapping would improve lookup efficiency. | Low |
| opencode-platform-reference | No scripts for common harness setup tasks | Low — skill is reference-only by design | N/A |
| opencode-non-interactive-shell | No references/ directory with machine-parseable flag tables | Low — SKILL.md is self-contained and comprehensive at 237 lines | Low |
| opencode-non-interactive-shell | No references/banned-commands.txt for programmatic enforcement | Low — the banned commands list is in SKILL.md prose, not queryable | Low |
| oh-my-openagent-reference | **tech-stack.md is missing** (phantom reference in summary.md) | Medium — summary.md promises a file that doesn't exist. Agents following summary.md's guidance will fail. | **Medium** |
| oh-my-openagent-reference | **project-structure.md is essentially empty** | High — agents cannot navigate the OMO codebase structure. They must search the 276K-line files.md blindly. | **High** |
| oh-my-openagent-reference | No topic-extracted references (e.g., hooks.md, plugin-system.md, circuit-breaker.md) | Medium — unlike opencode-platform-reference which has 18 topic files, OMO reference requires full-text search of 276K lines to find any topic | Medium |
| oh-my-openagent-reference | files.md + oh-my-openagent-full.xml are redundant (~553K duplicated lines) | Low — wastes disk space but both formats serve different consumption patterns (grep vs repomix tools) | Low |

### Disk Usage Summary

| Skill | Total Size | Repomix Packs | Structured Refs |
|-------|-----------|---------------|-----------------|
| opencode-platform-reference | ~1.46M lines | 1.46M lines (99.7%) | 4,548 lines (0.3%) |
| opencode-non-interactive-shell | 237 lines | 0 | 0 (self-contained) |
| oh-my-openagent-reference | ~553K lines | 553K lines (99.99%) | 52 lines (0.01%) |

### Key Recommendations

1. **Fix phantom reference:** Delete the `tech-stack.md` row from `oh-my-openagent-reference/references/summary.md` OR generate the missing file.
2. **Regenerate project-structure.md:** The OMO skill's `project-structure.md` should contain the OMO repo's actual directory tree, not just the repomix filename.
3. **Consider deduplication:** The OMO skill has both `files.md` and `oh-my-openagent-full.xml` containing the same data. Consider keeping only the XML (for repomix tools) and removing `files.md` to save ~276K lines.
4. **Add topic extraction to OMO:** Extract key OMO subsystems (hooks, plugins, circuit breaker, session continuity, skill loader) into dedicated reference files, following the pattern of opencode-platform-reference's 18 topic files.
5. **Standardize naming:** `opencode-troubleShooting.md` should be `opencode-troubleshooting.md` to match the lowercase kebab-case convention of all other files.

---

_Report generated: 2026-04-09_
_Auditor: C (Bundle Scanner — Platform/Reference Skills)_
_Depth: Full scan of all scripts/, references/, assets/ directories_
