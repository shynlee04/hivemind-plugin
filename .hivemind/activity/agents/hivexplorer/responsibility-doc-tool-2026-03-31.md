---
title: "hivemind_doc — Deep Responsibility Analysis"
date: 2026-03-31
agent: hivexplorer
scope: src/tools/doc/, src/features/doc-intelligence/, src/intelligence/doc/
git_commit: 7da1d535
---

# hivemind_doc — Deep Responsibility Analysis — 2026-03-31

## Responsibility Statement

The `hivemind_doc` tool is a **read-only document intelligence surface** that allows agents to skim, read, chunk, and search markdown project artifacts without mutating files. It exists to give agents structured access to planning documents, research outputs, handoff records, and other markdown-based governance artifacts — parsing heading hierarchies, frontmatter metadata, and section boundaries so agents can consume large documents in bounded token chunks. It is strictly read-only: no file writes occur anywhere in its call chain.

---

## Actions

### skim

- **Args:** `filePath: string` (required) — workspace-relative markdown file path
- **Validation:** `filePath` presence check at `src/features/doc-intelligence/doc.ts:29-31`
- **Call chain:** `tool.execute()` → `executeHivemindDocAction()` → `skimDocument()` → `readTextFile()` + `readMarkdownMetadata()` + `readMarkdownOutline()` → returns `DocumentSkim`
- **Files read:** The target markdown file via `fs.readFile` at `src/intelligence/doc/read-ops.ts:14-16`
- **Files written:** None
- **Returns:** `DocumentSkim` object containing `path`, `metadata` (frontmatter key-value pairs or null), `outline` (heading hierarchy tree), `lineCount`, `tokenEstimate` — see `src/intelligence/doc/types.ts:16-22`
- **Evidence:** `src/tools/doc/tools.ts:28-33`, `src/features/doc-intelligence/doc.ts:28-43`, `src/intelligence/doc/read-ops.ts:63-74`

### skim_directory

- **Args:** `dirPath: string` (required), `globFilter?: string` (optional)
- **Validation:** `dirPath` presence check at `src/features/doc-intelligence/doc.ts:46-48`
- **Call chain:** `tool.execute()` → `executeHivemindDocAction()` → `skimDirectory()` → `scanMarkdownFiles()` (recursive walk) → `skimDocument()` per file → returns `DocumentSkim[]`
- **Files read:** All `.md`/`.markdown` files under `dirPath` recursively, skipping dot-prefixed dirs and `node_modules` — `src/intelligence/doc/read-ops.ts:18-47`
- **Files written:** None
- **Returns:** Array of `DocumentSkim` objects, one per discovered markdown file
- **Evidence:** `src/features/doc-intelligence/doc.ts:45-56`, `src/intelligence/doc/read-ops.ts:76-85`

### read

- **Args:** `filePath: string` (required), `heading: string` (required)
- **Validation:** Both `filePath` and `heading` presence checks at `src/features/doc-intelligence/doc.ts:59-65`
- **Call chain:** `tool.execute()` → `executeHivemindDocAction()` → `readSection()` → `readMarkdownSection()` → returns section content string
- **Files read:** The target markdown file — `src/intelligence/doc/read-ops.ts:87-91`
- **Files written:** None
- **Returns:** The markdown content under the specified heading (from heading line to next sibling/parent heading), or `null` if heading not found. Section extraction uses `remark` AST parsing to find heading boundaries — `src/intelligence/doc/formats/md.ts:98-120`
- **Evidence:** `src/features/doc-intelligence/doc.ts:58-73`, `src/intelligence/doc/read-ops.ts:87-91`, `src/intelligence/doc/formats/md.ts:98-120`

### chunk

- **Args:** `filePath: string` (required), `heading?: string` (optional), `maxTokens?: number` (optional, default 2000)
- **Validation:** `filePath` presence check at `src/features/doc-intelligence/doc.ts:76-78`
- **Call chain:** `tool.execute()` → `executeHivemindDocAction()` → `readChunked()` → optional `readMarkdownSection()` scope → `chunkMarkdownSections()` → returns `DocumentChunk[]`
- **Files read:** The target markdown file — `src/intelligence/doc/read-ops.ts:93-106`
- **Files written:** None
- **Returns:** Array of `DocumentChunk` objects, each with `heading`, `content`, `tokenEstimate`, `startLine`, `endLine`. If a section exceeds `maxTokens`, it is split into character-based sub-chunks (maxChars = budget × 4) — `src/intelligence/doc/formats/md.ts:122-177`
- **Evidence:** `src/features/doc-intelligence/doc.ts:75-86`, `src/intelligence/doc/read-ops.ts:93-106`, `src/intelligence/doc/formats/md.ts:122-177`

### search

- **Args:** `dirPath: string` (required), `query: string` (required), `globFilter?: string` (optional)
- **Validation:** Both `dirPath` and `query` presence checks at `src/features/doc-intelligence/doc.ts:88-94`
- **Call chain:** `tool.execute()` → `executeHivemindDocAction()` → `searchDocuments()` → `scanMarkdownFiles()` → per-file: `readMarkdownOutline()` + line-by-line regex match → returns `DocumentSearchResult[]`
- **Files read:** All `.md`/`.markdown` files under `dirPath` recursively — `src/intelligence/doc/read-ops.ts:108-151`
- **Files written:** None
- **Returns:** Array of `DocumentSearchResult` objects, each with `path`, `heading` (nearest enclosing heading or "(body)"), `line` (1-indexed), `snippet` (trimmed line, max 200 chars). Search is case-insensitive regex — `src/intelligence/doc/read-ops.ts:120`
- **Evidence:** `src/features/doc-intelligence/doc.ts:88-101`, `src/intelligence/doc/read-ops.ts:108-151`

---

## Data Model

### Tool Args (`src/tools/doc/types.ts:4-14`)

```typescript
type HivemindDocAction = 'skim' | 'skim_directory' | 'read' | 'chunk' | 'search'

interface HivemindDocToolArgs {
  action: HivemindDocAction
  filePath?: string
  dirPath?: string
  heading?: string
  maxTokens?: number
  query?: string
  globFilter?: string
}
```

### Domain Types (`src/intelligence/doc/types.ts:1-29`)

| Interface | Fields | Purpose |
|-----------|--------|---------|
| `HeadingHierarchy` | `level`, `text`, `line`, `children[]` | Recursive heading tree from remark AST |
| `DocumentChunk` | `heading`, `content`, `tokenEstimate`, `startLine`, `endLine` | Bounded content slice for token-limited consumption |
| `DocumentSkim` | `path`, `metadata`, `outline[]`, `lineCount`, `tokenEstimate` | Document overview without full content |
| `DocumentSearchResult` | `path`, `heading`, `line`, `snippet` | Search hit with context |

### Feature Result (`src/features/doc-intelligence/doc.ts:10-20`)

```typescript
type DocFeatureResult =
  | { kind: 'error'; message: string }
  | { kind: 'success'; message: string; data: Record<string, unknown>; metadata?: { title: string; metadata: Record<string, unknown> } }
```

### Pressure Contract (`src/tools/doc/types.ts:16-22`)

All five actions use the `'steady-state'` pressure contract — meaning normal attached work with no active blocking pressure signals. Failure behavior: `continue`. Safety level: `steady`. — `src/shared/pressure-contract.ts:88-104`

---

## Full Call Chain (Top to Bottom)

```
OpenCode Plugin (src/plugin/opencode-plugin.ts:127)
  └─ hivemind_doc: createHivemindDocTool(directory)
       └─ src/tools/doc/tools.ts:10-34
            └─ tool({ description, args, execute() })
                 └─ executeHivemindDocAction(projectRoot, args)
                      └─ src/features/doc-intelligence/doc.ts:22-102
                           ├─ skim → skimDocument()
                           ├─ skim_directory → skimDirectory()
                           ├─ read → readSection()
                           ├─ chunk → readChunked()
                           └─ search → searchDocuments()
                                └─ src/intelligence/doc/read-ops.ts
                                     ├─ safePath() — path traversal guard
                                     ├─ readTextFile() — fs.readFile
                                     ├─ scanMarkdownFiles() — recursive dir walk
                                     └─ formats/md.ts
                                          ├─ readMarkdownOutline() — remark AST heading tree
                                          ├─ readMarkdownMetadata() — frontmatter regex parse
                                          ├─ readMarkdownSection() — heading-bounded section extract
                                          └─ chunkMarkdownSections() — token-budgeted splitting
```

### Safety Layer (`src/intelligence/doc/safety.ts:1-22`)

- `safePath()` — resolves paths and throws on directory traversal attempts (path must start with resolved project root)
- `isMarkdownDocument()` — validates `.md` or `.markdown` extension
- `relativeProjectPath()` — converts absolute paths back to project-relative

### Markdown Parsing (`src/intelligence/doc/formats/md.ts:1-177`)

- Uses `remark` parser + `unist-util-visit` for AST-based heading extraction
- Frontmatter stripped via regex before parsing: `/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/`
- Token estimation: `Math.ceil(content.length / 4)` — rough character-to-token ratio

---

## Test Coverage

### What IS tested (indirectly)

| Test File | What it verifies | Evidence |
|-----------|-----------------|----------|
| `tests/runtime-tools.test.ts:26` | `hivemind_doc` is in `AUTHORITATIVE_RUNTIME_TOOL_IDS` array | Line 26 |
| `tests/runtime-tools.test.ts:71-93` | Plugin registers tool with valid `description` (string, non-empty) and `execute` (function) | Lines 71-93 |
| `tests/runtime-tools.test.ts:103-149` | Tool ID appears in plugin tools, `HIVEMIND_MANAGED_TOOLS`, and `agentToolCatalog` — all three synchronized | Lines 103-149 |
| `tests/plugin-assembly-smoke.test.ts:128` | `hivemind_doc` in registered tool list (exactly 12 tools) | Line 128 |
| `tests/unit/context-renderer/tool-precedence.test.ts:11,31,47,83,139,201` | `hivemind_doc` used as example in tool precedence chain rendering tests (read/write actions) | Multiple lines |
| `src/features/event-tracker/types.test.ts:330` | `ToolInvocation` type accepts `toolName: 'hivemind_doc'` | Line 330 |

### What is NOT tested

| Gap | Detail |
|-----|--------|
| **No unit tests for `executeHivemindDocAction()`** | The feature-level dispatcher has zero direct tests |
| **No unit tests for `skimDocument()`** | No tests verify heading parsing, metadata extraction, or token estimation |
| **No unit tests for `skimDirectory()`** | No tests verify recursive scanning or glob filtering |
| **No unit tests for `readSection()`** | No tests verify heading-bounded section extraction |
| **No unit tests for `readChunked()`** | No tests verify token-budgeted chunking or sub-chunk splitting |
| **No unit tests for `searchDocuments()`** | No tests verify regex matching, heading attribution, or snippet generation |
| **No unit tests for `safePath()`** | Path traversal guard is untested |
| **No unit tests for markdown format parsers** | `formats/md.ts` functions (outline, metadata, section, chunk) have zero tests |
| **No integration tests with real markdown files** | No end-to-end tests exercising the tool against actual `.md` content |

**Summary:** The tool is tested only at the plugin assembly level (registration, type checks). Zero tests exist for the actual document intelligence logic — parsing, chunking, searching, or safety guards.

---

## Callers

### Direct Callers (Runtime)

| Caller | Location | How |
|--------|----------|-----|
| **OpenCode Plugin** | `src/plugin/opencode-plugin.ts:127` | Registers `hivemind_doc: createHivemindDocTool(directory)` in the `tool` surface |
| **Tool Governance** | `src/hooks/runtime-loader/tool-governance.ts:5` | Listed in `HIVEMIND_MANAGED_TOOLS` Set — auto-allowed by `permission.ask` hook (line 158-161 of plugin) |
| **Tool Catalog** | `src/tools/index.ts:28-37` | Registered in `agentToolCatalog` with `workflowPhase: 'doc-intelligence'`, `purposeClasses: ['discovery', 'research', 'planning', 'gatekeeping']` |

### Hook Integration

| Hook | Location | Behavior |
|------|----------|----------|
| `tool.execute.before` | `src/plugin/opencode-plugin.ts:172-177` | Records pre-execution event via `recordToolEvent()` if tool is in `HIVEMIND_MANAGED_TOOLS` |
| `tool.execute.after` | `src/plugin/opencode-plugin.ts:226-231` | Records post-execution event via `recordToolEvent()` |
| `permission.ask` | `src/plugin/opencode-plugin.ts:154-171` | Auto-allows `hivemind_doc` calls (no user permission prompt needed) |

### Indirect Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| **Side-car mock events** | `apps/side-car/app/api/events/route.ts:41` | Uses `hivemind_doc` as mock `tool.failed` event example |
| **Tool precedence tests** | `tests/unit/context-renderer/tool-precedence.test.ts` | Uses `hivemind_doc` as example tool in chain rendering |
| **Event tracker type tests** | `src/features/event-tracker/types.test.ts:330` | Uses `hivemind_doc` as valid `ToolInvocation.toolName` |

### Agent Consumers (Declared)

Per the `agentToolCatalog` entry at `src/tools/index.ts:28-37`, this tool is declared for purpose classes:
- `discovery` — codebase exploration, document orientation
- `research` — finding information in planning/research artifacts
- `planning` — reading task plans, specifications
- `gatekeeping` — verifying documentation against implementation

---

## Git Context

- **Current commit:** `7da1d535` — `feat(hivexplorer): add tool consumer chain map for all 6 managing-layer tools`
- **Uncommitted change:** `D src/intelligence/doc/AGENTS.md` — an AGENTS.md file was deleted from the intelligence/doc directory
- **Recent relevant commits:**
  - `7dae8ec6` — fix: restore preserved runtime tool proof
  - `8c4ce952` — fix: relocate start-work type consumers
  - `92a5ac98` — feat: port curated migration slice
  - `ba6ab4ef` — refactor: introduce structured intelligence documentation
  - `64f94646` — refactor: extract runtime tool implementations to dedicated modules

---

## Gaps

1. **Zero unit tests for document intelligence logic** — all parsing, chunking, searching, and safety functions in `src/intelligence/doc/` are untested
2. **No tests for the `executeHivemindDocAction()` dispatcher** — argument validation and action routing unverified
3. **`doc-surface-router.ts` is unused by the doc tool** — `resolveDocKnowledgeSurfaces()` maps purpose classes to knowledge surfaces but is never imported by any file in the doc tool chain. It is exported from `src/intelligence/doc/index.ts` but has no callers within the tool's call chain.
4. **Token estimation is naive** — `Math.ceil(content.length / 4)` at `src/intelligence/doc/formats/md.ts:14` is a rough heuristic, not a real tokenizer
5. **Search uses regex on raw lines** — no stemming, no fuzzy matching, no phrase awareness. The regex is case-insensitive but otherwise literal — `src/intelligence/doc/read-ops.ts:120`
6. **`read` action requires `heading`** — there is no way to read an entire file without specifying a heading; the tool forces section-level reads only
